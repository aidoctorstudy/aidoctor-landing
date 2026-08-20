---
tags: [frontend, stable]
updated: 2026-05-21
---

# Catalog — Hooks

Custom hooks in `src/hooks/`, grouped by domain.

## `hooks/animation/` — `#do-not-modify`

The hooks powering the [[animation-system]]. Consume them through the spring
components — don't call them directly unless extending the engine.

| Hook | File | Role |
|------|------|------|
| `useInViewRef` | `use-in-view-ref.ts` | IntersectionObserver ref for viewport detection |
| `useDynamicInView` | `use-dynamic-in-view.ts` | in-view detection with dynamic targets |
| `useLoopInView` | `use-loop-in-view.ts` | in-view tied to a render loop |
| `useProgressTrigger` | `use-progress-trigger.ts` | scroll → 0–1 progress (powers `<SpringTrigger>` / `<ProgressTrigger>`); returns `progress` as a `RefObject<number>` — read `.current` |
| `useSpringTrigger` | `use-spring-trigger.ts` | scroll-driven spring logic |
| `useLoop` | `use-render-loop.ts` | subscribes a callback to the shared rAF ticker (`src/lib/animation/ticker.ts`) |
| `useResizeLoop` | `user-resize-loop.ts` | runs a callback when window width changes (via `useLoop`) |

## `hooks/smooth-scroll/`

| Hook | File | Role |
|------|------|------|
| `useScroll` | `use-scroll.ts` | Zustand store for Lenis + scroll state — see [[smooth-scroll]] |

## `hooks/` (root)

| Hook | File | Role |
|------|------|------|
| `useWindowWidth` / `useWindowHeight` / `useWindowSize` | `use-window-size.ts` | SSR-safe window dimensions — all three share **one** debounced (300 ms) `resize` listener via a `useSyncExternalStore` store |
| `useMediaQuery` | `use-media-query.ts` | SSR-safe `matchMedia` subscription. Exports `DESKTOP_QUERY` (`min-width: 1024px`), the project's single layout breakpoint, and `MOBILE_QUERY` (`max-width: 767px`, matching `springsConfig.mobileWidth` — added for `DnaInkWithFallback`, ADR-0029). |

> [!note] `useMediaQuery` is for *behaviour*, not styling
> Reach for it only when something must genuinely change below a breakpoint — a
> scroll hijack that should not run, a sticky overlay that would hide content, a
> WebGL scene not worth mounting. Anything purely visual belongs in Tailwind's
> responsive prefixes. It returns `false` during SSR and the first client
> render, so the mobile branch is what renders before hydration.
| `useAdaptiveGrid` | `use-adaptive-grid.ts` | Scales the root `<html>` font-size up while the viewport exceeds `baseWidth` — powers `<AdaptiveGrid>`, see [[components/common]] |

> [!note] Shared render loop
> Loop-based hooks (`useLoop`, `useResizeLoop`, `useLoopInView`, the trigger
> hooks) all subscribe to the single app-wide ticker in `src/lib/animation/ticker.ts`
> rather than each starting their own `requestAnimationFrame`. See
> [[animation-system]]. The ticker is **not** `#do-not-modify`.

## Adding a hook

Place it under `hooks/<domain>/`. Data-fetching logic belongs in hooks, not in
presentational components. Use [[templates/hook-note]] to document it here.

## Related

[[animation-system]] · [[smooth-scroll]] · [[utils]]
