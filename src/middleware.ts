import { NextRequest, NextResponse } from "next/server";

import { DEFAULT_LOCALE, LOCALES } from "@/lib/i18n/locales";

/**
 * Locale routing — rewrites every request to carry a concrete `[locale]`
 * segment, while keeping the default locale (English) unprefixed in the
 * visible URL (`/`, not `/en/`).
 *
 * Hand-rolled rather than a library — see `lib/i18n/locales.ts`'s docstring
 * and decisions-log ADR-0029 for why.
 *
 * `config.matcher` below already excludes `/api`, `/_next`, any path with a
 * file extension (favicon.ico, robots.txt, sitemap.xml, manifest.json), and
 * the generated icon/OG image routes by name — their *public* URLs
 * (`/icon`, `/apple-icon`, `/opengraph-image`) carry no file extension even
 * though they render images, so the dot-based exclusion alone doesn't catch
 * them. Missing this exclusion was a real bug found in testing: those three
 * paths were silently rewritten to `/en/icon` etc. (no such route exists at
 * that nested path — they're declared at the true top level, outside
 * `[locale]`, per routing.md), 404ing the favicon and the `og:image` meta
 * tag on every request. So this function only ever sees actual page
 * requests.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const firstSegment = pathname.split("/")[1];
  if ((LOCALES as readonly string[]).includes(firstSegment)) {
    // Already locale-prefixed (e.g. /ar/pricing) — nothing to do.
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Skip Next internals, API routes, any request for an actual file
  // (favicon.ico, robots.txt, sitemap.xml, manifest.json — all contain a
  // dot), and the generated icon/OG routes by exact name (no dot in their
  // public URL — see the docstring above).
  matcher: ["/((?!_next|api|icon$|apple-icon$|opengraph-image$|.*\\..*).*)"],
};
