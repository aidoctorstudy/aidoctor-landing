/**
 * Pro-user store — Vercel KV (`@vercel/kv`, Redis-compatible), replacing
 * the flat-file store from ADR-0036. That file worked locally but doesn't
 * reliably persist on Vercel's serverless deployment (read-only filesystem
 * outside `/tmp`, not shared across function instances) — this is the
 * follow-up ADR-0036 flagged as required before relying on this for real
 * revenue. See decisions-log ADR-0037.
 *
 * One key per email (`pro:<email>` → `true`) rather than one big hash —
 * the idiomatic KV shape, and avoids a single hot key every check/grant
 * contends on.
 *
 * `@vercel/kv`'s own package currently warns it's deprecated in favor of
 * `@upstash/redis` directly / a Vercel Marketplace Redis integration (it's
 * now a thin wrapper around `@upstash/redis` under the hood) — used here
 * because it's what was asked for, and the wrapper is still functionally
 * maintained. If that changes, every caller only ever goes through
 * `isProEmail`/`grantPro`, so swapping the two functions' bodies for
 * `@upstash/redis` directly is a same-shape, one-file change.
 *
 * Requires `KV_REST_API_URL`/`KV_REST_API_TOKEN` (and friends) in the
 * environment — Vercel injects these automatically once a KV/Redis store
 * is created and linked to the project; `vercel env pull .env.local` pulls
 * them down for local dev. `kv` reads them itself; nothing here configures
 * it. An unlinked project makes `isProEmail`/`grantPro` reject with
 * `@vercel/kv`'s own "missing environment variables" error — surfaced to
 * the caller (`handle()` logs and 500s it) rather than swallowed, since a
 * silent no-op here is exactly the kind of "looks done, isn't" failure
 * ADR-0036 was written to avoid.
 */
import { kv } from "@vercel/kv";

/** Case-insensitive — Gumroad and Google both send emails as typed, not normalized. */
const normalize = (email: string) => email.trim().toLowerCase();
const keyFor = (email: string) => `pro:${normalize(email)}`;

export async function isProEmail(email: string): Promise<boolean> {
  return (await kv.get<boolean>(keyFor(email))) === true;
}

/** Idempotent — safe to call for the same email on every renewal ping. */
export async function grantPro(email: string): Promise<void> {
  await kv.set(keyFor(email), true);
}
