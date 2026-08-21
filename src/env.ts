/**
 * Validated environment variables.
 *
 * `publicEnv` holds `NEXT_PUBLIC_*` values — inlined into the client bundle,
 * safe in the browser. `getServerEnv()` holds server-only values (secrets) —
 * never read it from client code; on the client those values are `undefined`.
 *
 * A missing/invalid variable fails fast with a clear zod error rather than
 * surfacing as a confusing runtime bug later.
 */

import { z } from "zod";

/**
 * Treat an empty env var as unset.
 *
 * `cp .env.example .env` leaves declared-but-blank keys (`CONTACT_ENDPOINT=`),
 * which reach us as `""` — and `""` is not `undefined`, so an `.optional()`
 * schema would reject it as "Invalid URL". Without this, the documented setup
 * flow would break every optional variable the moment someone copied the
 * example file.
 */
const optionalUrl = () =>
  z.preprocess((v) => (v === "" ? undefined : v), z.url().optional());

/** Same `""` → unset treatment as `optionalUrl()`, for plain (non-URL) strings. */
const optionalString = () =>
  z.preprocess((v) => (v === "" ? undefined : v), z.string().optional());

const publicSchema = z.object({
  NEXT_PUBLIC_SITE_URL: optionalUrl(),
});

const serverSchema = z.object({
  /** Optional upstream the contact endpoint forwards leads to (CRM / webhook). */
  CONTACT_ENDPOINT: optionalUrl(),
  /**
   * The seller's own Gumroad account ID (Gumroad Settings → Advanced), used
   * by `/api/gumroad-webhook` to check an incoming ping's `seller_id` field
   * matches — Gumroad doesn't HMAC-sign webhooks the way Stripe does, so
   * this is the only verification available, not cryptographic proof. See
   * `app/api/gumroad-webhook/route.ts`.
   */
  GUMROAD_SELLER_ID: optionalString(),
  /** Restricts which product's sales grant Pro (in case this Gumroad
   *  account ever sells more than one thing). Matches the checkout URL's
   *  `/l/<permalink>` — see `PRO_CHECKOUT_URL` in `data/mocks/home.ts`. */
  GUMROAD_PRODUCT_PERMALINK: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().default("aidoctorstudypro"),
  ),
});

/** Public env — safe to read anywhere (server or client). */
export const publicEnv = publicSchema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});

let cachedServerEnv: z.infer<typeof serverSchema> | undefined;

/**
 * Server-only env. Call from route handlers / server code only — parsed
 * lazily so the client bundle never evaluates it.
 */
export function getServerEnv() {
  cachedServerEnv ??= serverSchema.parse({
    CONTACT_ENDPOINT: process.env.CONTACT_ENDPOINT,
    GUMROAD_SELLER_ID: process.env.GUMROAD_SELLER_ID,
    GUMROAD_PRODUCT_PERMALINK: process.env.GUMROAD_PRODUCT_PERMALINK,
  });
  return cachedServerEnv;
}
