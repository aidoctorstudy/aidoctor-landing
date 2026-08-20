import { ImageResponse } from "next/og";

import { BRAND_LOGO_DATA_URI } from "@/lib/brand-logo";
import { siteConfig } from "@/lib/site";

/**
 * Favicon, generated from the real logo (ADR-0029; `public/favicon.ico` is
 * also committed as a static fallback — some browsers/crawlers request that
 * exact path regardless of the `<link rel="icon">` tag this route emits).
 *
 * Next's `icon` file convention: this route emits the `<link rel="icon">`
 * automatically, so the metadata helper no longer hand-declares icon paths.
 * Drawing it from `BRAND_LOGO_DATA_URI` means this can never drift from
 * `public/logo.png`, the single committed source of the artwork.
 *
 * 📖 Docs: obsidian/frontend/seo-metadata.md
 */

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: siteConfig.brand.mint,
          // ~19% — matches the header's logo tile corner rounding.
          borderRadius: 96,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={BRAND_LOGO_DATA_URI} alt="" width={380} height={438} />
      </div>
    ),
    size,
  );
}
