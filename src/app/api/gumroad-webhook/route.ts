import type { NextRequest } from "next/server";

import { getServerEnv } from "@/env";
import { ApiError, handle } from "@/lib/api";
import { grantPro } from "@/lib/gumroad/pro-users";

/**
 * Gumroad's "Ping" webhook — POSTed as `application/x-www-form-urlencoded`
 * (not JSON) on every sale for a product with Ping notifications on. Set the
 * webhook URL in Gumroad → the product's Settings → Ping to
 * `https://aidoctor.study/api/gumroad-webhook`.
 *
 * **No signature header.** Unlike Stripe, Gumroad doesn't HMAC-sign these —
 * `seller_id` (visible only in the seller's own Gumroad account settings,
 * not the public storefront) is the only verification available, checked
 * against `GUMROAD_SELLER_ID`. Not cryptographic proof, but it does stop
 * anyone who merely discovers this URL from POSTing arbitrary form data to
 * grant themselves Pro. `GUMROAD_SELLER_ID` is required (not best-effort) —
 * the alternative, accepting webhooks when it's unset, would silently grant
 * Pro to anyone during the window before it's configured.
 */
export const POST = handle(async (req: NextRequest) => {
  const { GUMROAD_SELLER_ID, GUMROAD_PRODUCT_PERMALINK } = getServerEnv();

  if (!GUMROAD_SELLER_ID) {
    console.error(
      "[gumroad-webhook] GUMROAD_SELLER_ID is not set — rejecting until it's configured (see .env.example).",
    );
    throw new ApiError(503, "not_configured", "Gumroad webhook verification is not configured.");
  }

  const form = await req.formData();
  const field = (key: string) => String(form.get(key) ?? "");

  if (field("seller_id") !== GUMROAD_SELLER_ID) {
    console.warn("[gumroad-webhook] seller_id mismatch — ignoring (not from our Gumroad account).");
    return { ignored: "seller_id_mismatch" };
  }

  if (field("product_permalink") !== GUMROAD_PRODUCT_PERMALINK) {
    // A different product on the same Gumroad account — not the Pro plan.
    return { ignored: "different_product" };
  }

  const email = field("email");
  if (!email) {
    console.warn("[gumroad-webhook] ping had no email field — ignoring.");
    return { ignored: "no_email" };
  }

  if (field("refunded") === "true" || field("chargebacked") === "true") {
    // Gumroad re-pings the same URL on a refund/chargeback. Revoking Pro on
    // this signal isn't implemented — out of scope of what was asked
    // (activate on sale) — logged so it's visible rather than silently
    // dropped if that's ever needed.
    console.log(`[gumroad-webhook] refund/chargeback for ${email} — Pro not revoked (not implemented).`);
    return { ignored: "refund_not_revoked" };
  }

  await grantPro(email);
  console.log(
    `[gumroad-webhook] granted Pro to ${email}${field("test") === "true" ? " (Gumroad test ping)" : ""}.`,
  );

  return { granted: true };
});
