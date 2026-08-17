import { ImageResponse } from "next/og";

import { brandMarkDataUri } from "@/lib/brand-mark";
import { siteConfig } from "@/lib/site";

/**
 * Open Graph / Twitter share card, generated from the logo and site config.
 *
 * Built with `next/og` rather than checked in as a PNG so the card can never
 * fall out of sync with `siteConfig` — change the tagline and the image
 * follows.
 *
 * 📖 Docs: obsidian/frontend/seo-metadata.md
 */

export const alt = `${siteConfig.name} — ${siteConfig.description}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: 72,
          background: siteConfig.brand.mint,
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 88,
              height: 88,
              borderRadius: 16,
              background: siteConfig.brand.green,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={brandMarkDataUri(siteConfig.brand.lime)}
              alt=""
              width={52}
              height={52}
            />
          </div>
          <span style={{ fontSize: 44, letterSpacing: -0.5 }}>
            {siteConfig.name}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <span style={{ fontSize: 68, lineHeight: 1.1, maxWidth: 900 }}>
            Study smarter. Pass your exams.
          </span>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              fontSize: 28,
              color: siteConfig.brand.green,
            }}
          >
            Trusted by 50,000+ medical students worldwide
          </span>
        </div>
      </div>
    ),
    size,
  );
}
