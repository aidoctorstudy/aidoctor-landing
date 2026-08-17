/**
 * Site-wide configuration — the single source of truth for SEO.
 *
 * Consumed by the metadata generator, `robots.ts`, `sitemap.ts`, and the
 * JSON-LD structured-data helper. Update the placeholder values per project.
 */
import { publicEnv } from "@/env";

export const siteConfig = {
  name: "AI Doctor Study",
  /** Used as the `<title>` when a page doesn't set its own. */
  title: "AI Doctor Study — AI-Powered Medical Learning",
  description:
    "The AI study companion for MBBS and medical students. Ask anything, get expert explanations instantly.",
  /**
   * Public origin, no trailing slash. Drives canonical URLs, OG tags, the
   * sitemap, and JSON-LD. Production domain is `aidoctor.study` — set
   * `NEXT_PUBLIC_SITE_URL=https://aidoctor.study` there; local dev falls back
   * to localhost.
   */
  url: publicEnv.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  /**
   * Open Graph / Twitter share image.
   *
   * Generated from the logo at request time by `src/app/opengraph-image.tsx`
   * rather than shipped as a static file — see that route. Next resolves the
   * `/opengraph-image` file convention automatically, so this path only exists
   * for callers that pass an explicit override.
   */
  ogImage: "/opengraph-image",
  twitterHandle: "@aidoctorstudy",
  author: "AI Doctor Study",
  /** Browser theme-color (address bar / PWA) — the brand sky-blue. */
  themeColor: "#0EA5E9",
  /** Brand palette, shared with the generated icon and OG routes. */
  brand: {
    green: "#0EA5E9",
    lime: "#E0F2FE",
    mint: "#070D17",
  },
} as const;
