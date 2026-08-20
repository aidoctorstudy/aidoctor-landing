---
tags: [frontend, stable]
updated: 2026-08-20
---

# Routing

Next.js 16 App Router. The defining convention: **routes delegate to views**.

> [!warning]
> Per `AGENTS.md`, this version of Next.js may differ from older knowledge. Heed
> deprecation notices before writing routing code.

## Route → View delegation

`app/**/page.tsx` files contain **no UI logic**. They import a component from
`src/views/` and render it. ADR: [[decisions-log]] ADR-0003.

```tsx
// src/app/[locale]/(marketing)/page.tsx
import { isLocale } from "@/lib/i18n/locales";
import { HomeView } from "@/views/home";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  return <HomeView locale={isLocale(rawLocale) ? rawLocale : "en"} />;
}
```

All layout and UI logic lives in `src/views/home/` (`HomeView`). The view is
a **Server Component**; isolate any client-only animation in a leaf component —
see [[component-conventions]] hard rule #6.

## Current routes

Every marketing/app route sits one level deeper than it used to, under
`src/app/[locale]/` (ADR-0030) — see *Locale routing* below.

| Route (English, unprefixed) | File | View |
|-------|------|------|
| `/` | `src/app/[locale]/(marketing)/page.tsx` | `views/home/index.tsx` → `HomeView` |
| `/terms`, `/refunds`, `/cookies`, `/privacy` | `src/app/[locale]/(marketing)/<page>/page.tsx` | `views/legal/legal-page.tsx` → `LegalPageView` (shared across all four — see [[components/home-sections]], ADR-0029) |
| `/app` | `src/app/[locale]/app/page.tsx` | `views/app/study-app-frame.tsx` → `StudyAppFrame` (iframe embed — see [[decisions-log]] ADR-0028) |

Every non-English locale carries the same routes under a `/xx` prefix
(`/ar/terms`, `/es/app`, …) — see *Locale routing*.

## Locale routing (ADR-0030)

`src/middleware.ts` rewrites every incoming request to carry a concrete
`[locale]` segment, while keeping English (`DEFAULT_LOCALE` in
`lib/i18n/locales.ts`) unprefixed in the visible URL: `/pricing` is served
by `[locale]/(marketing)/pricing/page.tsx` with `locale = "en"` internally,
without ever redirecting to `/en/pricing`. A request that already carries a
known locale prefix (`/ar/pricing`) passes through unchanged.

Hand-rolled rather than a routing library (`next-intl` etc.) — see
`lib/i18n/locales.ts`'s own docstring for why: content resolution
(`lib/i18n/content.ts`) already lives in this project's existing
props-driven data layer, so a library's `t()`/hooks system would go
unused; the only genuinely-needed piece is the segment + rewrite, which is
small enough to own directly.

> [!danger] The middleware matcher must exclude the generated icon/OG routes **by name**, not just by file extension
> `config.matcher` skips `_next`, `api`, and any path containing a dot
> (`favicon.ico`, `robots.txt`, `sitemap.xml`) — but `icon.tsx` /
> `apple-icon.tsx` / `opengraph-image.tsx`'s **public URLs** (`/icon`,
> `/apple-icon`, `/opengraph-image`) carry no extension even though they
> render images. Missing this was a real bug caught in testing: those three
> paths were silently rewritten to `/en/icon` etc. — no such route exists
> there, since these files live at the true top level outside `[locale]`
> (see *Special files* below) — 404ing the favicon and the `og:image` meta
> tag on **every single request**, not just an edge case. The matcher now
> excludes `icon$|apple-icon$|opengraph-image$` explicitly alongside the
> dot rule. If a new generated metadata route is ever added at the top
> level, its exact public path needs the same treatment.

`generateStaticParams` on both `[locale]/(marketing)/layout.tsx` and
`[locale]/app/layout.tsx` lists all 9 locales (`LOCALES` in
`lib/i18n/locales.ts`), so every page is statically generated per locale at
build time rather than resolved on first request.

## Two root layouts (ADR-0028)

This project has **two separate root layouts**, via Next's "multiple root
layouts" pattern — each defines its own `<html><body>`, and every top-level
route belongs to exactly one of them:

| Root layout | Covers | Carries |
|---|---|---|
| `src/app/[locale]/(marketing)/layout.tsx` | `/` and any future marketing route | Google Sans Flex, `PreloadProvider`/`Preloader`, `ScrollLayout`, `AdaptiveGrid`, `ReducedMotion`, cookie banner, JSON-LD. Sets `<html lang={locale} dir={rtl ? "rtl" : "ltr"}>` (ADR-0030). |
| `src/app/[locale]/app/layout.tsx` | `/app` only | Nothing marketing-specific — no font load, no providers. Just `globals.css` for Tailwind's reset/utilities, `h-full overflow-hidden` on `html`/`body`. Sets `<html lang={locale}>`. |

`(marketing)` is a **route group** — the parens don't add a URL segment, so
`[locale]/(marketing)/page.tsx` still serves at `/<locale-prefix>/`. Adding a
new marketing page means adding it under `[locale]/(marketing)/`, not
directly under `app/`, or it won't have a root layout to render inside.

`[locale]/(marketing)/error.tsx` and `[locale]/(marketing)/loading.tsx`
still cover `(marketing)` only (moved there alongside its
`layout.tsx`/`page.tsx`); `/app` has neither — it's a single static page
with no data fetching, so there's nothing for either boundary to catch yet.
`src/app/not-found.tsx` (top-level, outside `[locale]` entirely) is the
global fallback for a path matching neither route group;
`[locale]/(marketing)/not-found.tsx` covers the common case of an unmatched
path *within* the marketing site.

## Special files

`src/app/` carries the App Router special files. Everything that renders
`<html>` or belongs to one specific root layout lives under `[locale]/`;
everything else (metadata routes, API routes) stays at the true top level,
**outside** `[locale]` — see the danger callout above for why that split
matters to the middleware specifically:

| File | Role |
|------|------|
| `[locale]/(marketing)/layout.tsx`, `[locale]/app/layout.tsx` | The two root layouts — see above |
| `[locale]/(marketing)/loading.tsx` | Suspense fallback — its presence enables streaming |
| `[locale]/(marketing)/error.tsx` | Route-segment error boundary (Client Component) |
| `[locale]/(marketing)/not-found.tsx`, top-level `not-found.tsx` | 404 pages — served with a 404 status |
| `middleware.ts` | Locale detection/rewrite (ADR-0030) — see *Locale routing* above |
| `robots.ts` / `sitemap.ts` | Generate `/robots.txt` and `/sitemap.xml` — see [[seo-metadata]]. `sitemap.ts` now lists every route **per locale**, each with `alternates.languages` (ADR-0030). Both stay at the true top level: metadata routes aren't part of the html-document/layout-nesting mechanism, so one copy covers every route regardless of which root layout or locale it belongs to. Same reasoning for `icon.tsx`/`apple-icon.tsx`/`opengraph-image.tsx`. |
| `api/<resource>/route.ts` | API endpoints (Route Handlers) — also unaffected by root layouts or locale; they never render `<html>`. `api/i18n-content/route.ts` is an internal dev tool, not a product endpoint — see [[decisions-log]] ADR-0030. |

## Adding a route

1. Create `src/app/[locale]/(marketing)/<route>/page.tsx` — keep it ~3 lines
   plus locale resolution (see the example above), delegate to a view. (Only
   use a fresh top-level folder like `[locale]/app/` instead of
   `[locale]/(marketing)/` if the route genuinely needs its own root layout
   with none of the marketing chrome — that's the exception, not the
   default.)
2. Create `src/views/<route>.tsx` — the actual page component. If it needs
   locale-aware copy, resolve it via `getHomeContent`/`getSiteChrome`/
   `getLegalContent` (`lib/i18n/content.ts`) rather than importing
   `data/mocks/*.ts` constants directly.
3. Add the route's path to `ROUTES` in `sitemap.ts`.
4. Follow the [[new-page]] playbook.

## Navigation

Use **standard Next.js navigation** — `<Link>` from `next/link` and `useRouter`
from `next/navigation`. ADR: [[decisions-log]] ADR-0005.

```tsx
import Link from 'next/link';
import { useRouter } from 'next/navigation';
```

> [!note]
> Earlier drafts of `generic-layout-prompt.md` referenced `<AnimLink>` /
> `useAnimRouter()`. Those were never built and the convention is dropped — use
> `next/link` directly.

## SEO per route

Each route exports `metadata` via the shared generator, now passing its
resolved `locale` through for hreflang/canonical/`og:locale` — see
[[seo-metadata]].

## Related

[[system-overview]] · [[component-conventions]] · [[new-page]] · [[seo-metadata]] · [[decisions-log]]
