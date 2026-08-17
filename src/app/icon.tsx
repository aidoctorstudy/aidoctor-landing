import { ImageResponse } from "next/og";

import { brandMarkDataUri } from "@/lib/brand-mark";
import { siteConfig } from "@/lib/site";

/**
 * Favicon, generated from the logo.
 *
 * Next's `icon` file convention: this replaces a checked-in `favicon.ico` and
 * emits the `<link rel="icon">` automatically, so the metadata helper no longer
 * hand-declares icon paths. Drawing it from `brandMarkDataUri` means the
 * favicon can never drift from the mark used in the header.
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
          background: siteConfig.brand.green,
          // ~19% — the mark sits on a squircle, matching the header's logo tile.
          borderRadius: 96,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={brandMarkDataUri(siteConfig.brand.lime)}
          alt=""
          width={320}
          height={320}
        />
      </div>
    ),
    size,
  );
}
