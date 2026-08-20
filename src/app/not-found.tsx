import type { Metadata } from "next";
import Link from "next/link";

import { siteConfig } from "@/lib/site";

/**
 * Global 404 fallback for paths matching neither the `(marketing)` route
 * group nor `/app` — Next synthesizes a `/_not-found` route for this case
 * that isn't reliably covered by either root layout's own metadata, so this
 * top-level file (outside both groups) sets its own `metadataBase` to avoid
 * an unresolved-OG-image build warning. `(marketing)/not-found.tsx` still
 * handles the common case (an unmatched path *within* the marketing site).
 */
export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: "Not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <html lang="en">
      <body>
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <h1 className="text-6xl font-bold">404</h1>
          <p className="text-lg">This page could not be found.</p>
          <Link href="/" className="underline underline-offset-4">
            Back to home
          </Link>
        </div>
      </body>
    </html>
  );
}
