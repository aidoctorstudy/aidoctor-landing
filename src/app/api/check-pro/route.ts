import type { NextRequest } from "next/server";
import { z } from "zod";

import { handle } from "@/lib/api";
import { isProEmail } from "@/lib/gumroad/pro-users";

/**
 * `GET /api/check-pro?email=...` — called by `public/app/auth.js` on every
 * login (Google or email/password) to see if that email has an active
 * Gumroad purchase on file. Same-origin (the study app is embedded via
 * iframe from this domain — see decisions-log ADR-0028), so no CORS
 * handling needed.
 */
const querySchema = z.object({ email: z.email() });

export const GET = handle(async (req: NextRequest) => {
  const { email } = querySchema.parse({ email: req.nextUrl.searchParams.get("email") });
  return { isPro: await isProEmail(email) };
});
