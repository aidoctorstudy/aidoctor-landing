---
tags: [frontend, seo, stable]
updated: 2026-05-21
---

# SEO & Metadata

## Site config

`src/lib/site.ts` (`siteConfig`) is the **single source of truth** for SEO —
name, description, origin URL, OG image, Twitter handle, theme colour. The
metadata generator, `robots.ts`, `sitemap.ts`, and the JSON-LD helper all read
from it. Filled in for Dantora: clinic name, the hero's promise as the
description, `#246f65` as the theme colour, plus a `brand` block the generated
image routes read.

## Icons and OG image are generated from the real logo (ADR-0030)

The starter's original placeholder icon set was deleted, then replaced
twice: first (ADR-0022 era) with a generated `currentColor` DNA-mark glyph
via `next/og`, then — as of ADR-0030 — with the **actual AI Doctor Study
logo** (`public/logo.png`, a 237×274 raster brain/neural-network mark). The
old glyph (`components/ui/icons/dna-icon.tsx`, `lib/brand-mark.ts`) is
deleted; nothing references `DnaIcon` or `brandMarkDataUri` anymore.

| Asset | Size | Purpose |
|-------|------|---------|
| `public/logo.png` | 237×274 | The single committed source of the artwork. Every other logo surface derives from this file. |
| `public/favicon.ico` | 16/32/48/64px, multi-res | Static fallback — some browsers/crawlers request this exact path regardless of the `<link rel="icon">` `app/icon.tsx` emits. |
| `app/icon.tsx` | 512² | favicon (Next file convention) — the logo on a mint squircle |
| `app/apple-icon.tsx` | 180² | iOS home screen; square-cornered with a wider margin, because Apple applies its own corner mask |
| `app/opengraph-image.tsx` | 1200×630 | share card — logo, wordmark, headline, trust line on mint |

The three generated routes draw the logo through `src/lib/brand-logo.ts`'s
`BRAND_LOGO_DATA_URI` — `public/logo.png` read once at module load and
base64-encoded. That's a Satori-specific need, not a general pattern:
Satori (`next/og`) renders outside Next's normal image pipeline, so a plain
`/logo.png` URL isn't reliably resolvable inside it, the same reason the
old `brandMarkDataUri` builder existed. **Everywhere else — the navbar
(`site-header.tsx`), the preloader (`preloader.tsx`) — references
`/logo.png` directly** as a plain `<Image>`/`<img>`, not this data URI:
there's no reason to inline ~49KB of base64 into the client bundle when the
browser can just fetch and cache the file once.

> [!note] The preloader's "unfilled" ghost layer changed technique
> It used to render the mark a second time in a different `currentColor`
> fill to look faint. A raster PNG with its own baked-in gradient can't be
> recoloured that way, so it's now the same `/logo.png` dimmed with CSS
> `opacity` instead — same visual effect, different mechanism.

> [!important] Don't re-declare icons in `generateMetadata`
> `icon` and `apple-icon` are Next **file conventions**: Next emits the
> `<link rel="icon">` tags itself. The helper's hand-written `icons` block was
> removed — keeping it would have duplicated the tags and pointed them at the
> deleted placeholder PNGs.

> [!note] The OG card uses Satori's fallback font
> `next/font` ships WOFF2, which Satori cannot consume, so the card renders in
> the bundled fallback rather than Google Sans Flex. Supply a TTF/OTF via
> `ImageResponse`'s `fonts` option if exact brand type on the share card
> matters.

The JSON-LD organisation node is typed `MedicalClinic`, not `Organization` — it
inherits from both MedicalOrganization and LocalBusiness, which is what lets
search engines treat the site as a healthcare provider.

`siteConfig.url` comes from `NEXT_PUBLIC_SITE_URL` (see [[environment-variables]]),
falling back to `http://localhost:3000`.

## Metadata generator

`src/utils/seo/generate-page-metadata.ts` exports two builders:

```ts
import {
  generateMetadata,
  generateViewport,
} from "@/utils/seo/generate-page-metadata";

export const metadata = generateMetadata({ title: "…", description: "…" });
export const viewport = generateViewport();
```

- `generateMetadata(props?)` → a Next.js `Metadata` object: title/description,
  OpenGraph, Twitter cards, canonical, icons, robots. `metadataBase` is **always
  set** from `siteConfig.url`, so relative URLs (OG image, canonical) resolve to
  absolute — required by social scrapers.
- `generateViewport()` → the `Viewport` export. `themeColor` lives here, **not**
  on the metadata object (Next deprecated it there).

Accepted `generateMetadata` options: `title`, `description`, `url`, `ogImage`,
`twitterHandle`, `author`, `siteName`, `locale` (ADR-0030). (`keywords` and the
non-standard `other` tags were dropped — no SEO value.)

## Locale-aware metadata (ADR-0030)

Every actual page route calls `generateMetadata` with its resolved `locale`
(a `Locale` from `lib/i18n/locales.ts`) — `url` stays **unlocalized**
(`/terms`, not `/ar/terms`); the generator does the prefixing:

```ts
export async function generateMetadata({ params }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  return buildMetadata({
    title: "…", description: "…",
    url: "/terms",                       // unlocalized — always
    locale: isLocale(rawLocale) ? rawLocale : "en",
  });
}
```

Passing `locale` adds:
- `alternates.canonical` → the **locale-prefixed** URL (`localizedPath`, from
  `lib/i18n/locales.ts`).
- `alternates.languages` → one entry per locale in `LOCALES`, plus
  `x-default` pointing at the unprefixed English URL — the standard hreflang
  fallback target.
- `openGraph.locale` → the long-form Open Graph locale (`OG_LOCALES` in
  `lib/i18n/locales.ts`, e.g. `ar_SA`), not just `en_US` for everyone.

Omitting `locale` (the marketing root layout's own fallback `metadata`
export, which no real page actually uses — every page overrides it with its
own locale-aware `generateMetadata`) produces the old locale-agnostic
output: `en_US` OG locale, no hreflang block.

## robots.txt & sitemap.xml

Generated by the Next file conventions:
- `src/app/robots.ts` → `/robots.txt` — `allow: "/"` for every user agent,
  which already covers AI/LLM crawlers (there's no separate disallow rule
  for them to trip over) — no changes needed there for that.
- `src/app/sitemap.ts` → `/sitemap.xml` — a `ROUTES` list of unlocalized
  paths (`""`, `/app`, `/terms`, …; add an entry as new routes ship),
  expanded into **one sitemap entry per route per locale** (ADR-0030) via
  `LOCALES`/`localizedPath` from `lib/i18n/locales.ts`. Each entry carries
  Next's native `alternates.languages` field (no hand-rolled XML) so
  crawlers read every locale variant of a page as related content, not as
  duplicates.

## Structured data (JSON-LD)

`src/utils/seo/structured-data.ts` → `getSiteStructuredData()` builds an
`Organization` + `WebSite` JSON-LD graph. The root layout renders it once in a
`<script type="application/ld+json">`.

## Bot detection

`src/utils/is-bot.ts` exports `isBot()` — a **server-only** async helper that
reads the `user-agent` header and returns `true` for Lighthouse, Googlebot,
PageSpeed, HeadlessChrome, GTmetrix, Pingdom, Bingbot, Yandexbot.

> [!caution]
> Calling `isBot()` (or any `headers()` reader) in a route **opts it out of
> static prerendering** — a TTFB cost for every visitor. Serving crawler-specific
> behaviour also borders on cloaking. Prefer the [[animation-system|reduced-motion]]
> path (`<ReducedMotion>`): animations only touch opacity/transform, so content
> is always in the DOM and crawlers see it regardless. Use `isBot()` sparingly.

## Static assets

The `public/` **root** holds meta/PWA/SEO assets — `favicon.ico`,
`logo.png` (ADR-0030, the single source every generated icon/OG route
derives from — see *Icons and OG image* above), `manifest.json`,
`browserconfig.xml`, `llms.txt`. Site **content** assets (images, videos) go
under `public/assets/<section>/` — see [[folder-structure]].

`llms.txt` is a static, hand-written machine-readable summary for LLM
agents/crawlers (what the product is, its features, pricing, and canonical
links) — an emerging convention, not a Next.js file convention, so it's a
plain file in `public/` rather than a generated route. Unlike `siteConfig` in
`site.ts`, nothing regenerates it automatically — if the product's features,
pricing, or links change, update `public/llms.txt` by hand too. (Kept in
sync as of ADR-0029/0030: Pro pricing, the discount code, and all four legal
routes are listed.)

> [!note] The stale `open-graph.png` `#todo` is resolved
> A checked-in `900×600 public/open-graph.png` used to sit alongside the
> generated `opengraph-image.tsx` route as dead weight, undersized against
> the declared `1200×630`. It's been deleted — `opengraph-image.tsx` is the
> only OG image source now, generated fresh from `public/logo.png` at the
> correct size (ADR-0030).

## Related

[[routing]] · [[utils]] · [[animation-system]] · [[environment-variables]] · [[decisions-log]]
