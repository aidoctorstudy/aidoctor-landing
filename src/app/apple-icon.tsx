import { ImageResponse } from "next/og";

import { BRAND_LOGO_DATA_URI } from "@/lib/brand-logo";
import { siteConfig } from "@/lib/site";

/**
 * iOS home-screen icon, generated from the real logo (ADR-0029).
 *
 * Separate from `icon.tsx` because Apple crops to a fixed 180×180 and applies
 * its own corner mask — so this variant is square-cornered with a wider margin,
 * which is what stops the mark being clipped by that mask.
 *
 * 📖 Docs: obsidian/frontend/seo-metadata.md
 */

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={BRAND_LOGO_DATA_URI} alt="" width={124} height={143} />
      </div>
    ),
    size,
  );
}
