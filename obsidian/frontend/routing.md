---
tags: [frontend, stable]
updated: 2026-05-21
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
// src/app/(marketing)/page.tsx
import { HomeView } from "@/views/home";

export default function Home() {
  return <HomeView />;
}
```

All layout and UI logic lives in `src/views/home/` (`HomeView`). The view is
a **Server Component**; isolate any client-only animation in a leaf component —
see [[component-conventions]] hard rule #6.

## Current routes

| Route | File | View |
|-------|------|------|
| `/` | `src/app/(marketing)/page.tsx` | `views/home/index.tsx` → `HomeView` |
| `/app` | `src/app/app/page.tsx` | `views/app/study-app-frame.tsx` → `StudyAppFrame` (iframe embed — see [[decisions-log]] ADR-0028) |

## Two root layouts (ADR-0028)

This project has **two separate root layouts**, via Next's "multiple root
layouts" pattern — each defines its own `<html><body>`, and every top-level
route belongs to exactly one of them:

| Root layout | Covers | Carries |
|---|---|---|
| `src/app/(marketing)/layout.tsx` | `/` and any future marketing route | Google Sans Flex, `PreloadProvider`/`Preloader`, `ScrollLayout`, `AdaptiveGrid`, `ReducedMotion`, cookie banner, JSON-LD |
| `src/app/app/layout.tsx` | `/app` only | Nothing — no font load, no providers. Just `globals.css` for Tailwind's reset/utilities, `h-full overflow-hidden` on `html`/`body` |

`(marketing)` is a **route group** — the parens don't add a URL segment, so
`(marketing)/page.tsx` still serves at `/`. Adding a new marketing page means
adding it under `(marketing)/`, not directly under `app/`, or it won't have a
root layout to render inside.

`src/app/error.tsx` and `src/app/loading.tsx` still cover `(marketing)` only
(moved there alongside its `layout.tsx`/`page.tsx`); `/app` has neither —
it's a single static page with no data fetching, so there's nothing for
either boundary to catch yet. `src/app/not-found.tsx` (top-level, outside
both groups) is the global fallback for a path matching neither route group;
`(marketing)/not-found.tsx` covers the common case of an unmatched path
*within* the marketing site.

## Special files

`src/app/` carries the App Router special files:

| File | Role |
|------|------|
| `(marketing)/layout.tsx`, `app/layout.tsx` | The two root layouts — see above |
| `(marketing)/loading.tsx` | Suspense fallback — its presence enables streaming |
| `(marketing)/error.tsx` | Route-segment error boundary (Client Component) |
| `(marketing)/not-found.tsx`, top-level `not-found.tsx` | 404 pages — served with a 404 status |
| `robots.ts` / `sitemap.ts` | Generate `/robots.txt` and `/sitemap.xml` — see [[seo-metadata]]. Stay at the true top level (outside both groups): metadata routes aren't part of the html-document/layout-nesting mechanism, so one copy covers every route regardless of which root layout it belongs to. Same reasoning for `icon.tsx`/`apple-icon.tsx`/`opengraph-image.tsx`. |
| `api/<resource>/route.ts` | API endpoints (Route Handlers) — also unaffected by root layouts; they never render `<html>` |

## Adding a route

1. Create `src/app/(marketing)/<route>/page.tsx` — keep it ~3 lines, delegate
   to a view. (Only use a fresh top-level folder like `app/app/` instead of
   `(marketing)/` if the route genuinely needs its own root layout with none
   of the marketing chrome — that's the exception, not the default.)
2. Create `src/views/<route>.tsx` — the actual page component.
3. Follow the [[new-page]] playbook.

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

Each route exports `metadata` via the shared generator — see [[seo-metadata]].

## Related

[[system-overview]] · [[component-conventions]] · [[new-page]]
