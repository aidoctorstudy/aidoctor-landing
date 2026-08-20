---
tags: [frontend, stable]
updated: 2026-08-10
---

# Catalog — Common Components

Files in `src/components/common/` — shared infrastructure that may depend on
providers. Conventions: [[component-conventions]].

## Cookie — `Cookie/`

Self-contained cookie consent system — a bottom-right **banner** plus a full
category **preferences modal**. No third-party library (the old
`react-cookie-consent` dependency was removed). Lives in `src/components/common/Cookie/`.

| File | Role |
|------|------|
| `Cookie.tsx` | Mount component — hydrates the store, renders banner + modal |
| `LazyCookie.tsx` | `next/dynamic` `ssr:false` wrapper — keeps cookie JS out of first-load |
| `CookieBanner.tsx` | Bottom-right consent banner |
| `CookiePreferencesModal.tsx` | Category preferences dialog with per-category toggles |
| `CookieButton.tsx` | Local button primitive — `primary` / `secondary` variants |
| `cookieStore.ts` | Zustand store + `localStorage` persistence |
| `index.ts` | Barrel exports — `Cookie`, `LazyCookie`, `useCookieStore`, `CookieConsent` |

**Mounting** — the root layout renders `<LazyCookie />` inside `ScrollLayout`:
```tsx
import { LazyCookie } from "@/components/common/Cookie";
```

**State** — `useCookieStore` (Zustand). `consent` is `null` until the user decides;
the banner shows only after hydration confirms `consent === null`. Persisted to
`localStorage` under key `cookie-consent-v1`. Three categories: `necessary`
(always on), `analytics`, `marketing`.

**Styling & motion** — ported to the project stack: Tailwind v4 with the
`background` / `foreground` design tokens (dark-mode adaptive, no hardcoded hex),
and `@react-spring/web` for all motion — `useTransition` drives the banner and
modal mount/unmount, `useSpring` drives the toggle knob. No CSS transitions.
The modal locks scroll through the Lenis [[smooth-scroll|scroll store]]
(`useScroll.stop()`), not `body` overflow.

> [!note] `#todo`
> The privacy-policy link points to `/privacy-policy` — that route does not exist
> yet. Placeholder consent copy should be reviewed before launch.

## Grid — adaptive scaling (`grid/`)

The **adaptive scaling grid** keeps a rem-based layout proportional across every
viewport by scaling the root (`<html>`) font-size. Design in `rem` once, and the
whole UI scales as one unit. Lives in `src/components/common/grid/`.

| File | Role |
|------|------|
| `grid.config.ts` | Breakpoints + `FONT_BASE` — the single source of truth for the grid |
| `adaptive-grid.tsx` | `<AdaptiveGrid>` client component — drives the scale-up, renders `null` |
| `index.ts` | Barrel exports — `AdaptiveGrid`, `GRID_BREAKPOINTS`, … |

**How it works** — two halves cover the whole viewport range:

- **Scale down** (viewport ≤ 1920px) — `vw`-based `html { font-size }` media
  queries in `globals.css`. At each breakpoint's design base width the root
  font-size resolves to 16px; between breakpoints it tracks the viewport.
- **Scale up** (viewport > 1920px) — the `<AdaptiveGrid>` component sets an
  inline `html` font-size at runtime via [[hooks|`useAdaptiveGrid`]], so the
  design keeps growing (damped by `coef`) on large displays.

The `globals.css` media queries and `grid.config.ts` describe the same
breakpoints — **keep them in sync** (formula: `font-size = 16 * 100 / baseWidth vw`).

**Mounting** — the root layout renders `<AdaptiveGrid />` inside `ScrollLayout`:
```tsx
import { AdaptiveGrid } from "@/components/common/grid";
```
Mount it once. Props: `baseWidth` (defaults to the largest breakpoint) and
`coef` (0–1 scale-up damping, default `0.6666`).

> [!note]
> This replaced a `styled-components`-based scaling system that was dropped into
> `common/` — see [[decisions-log]] ADR-0008. `styled-components` is **not** a
> project dependency; the scale-down CSS lives in `globals.css` per [[design-system]].

## ReducedMotion — `reduced-motion.tsx`

`<ReducedMotion>` — a client leaf that calls react-spring's `useReducedMotion()`.
It watches the `prefers-reduced-motion` media query and toggles react-spring's
global `skipAnimation`, so every spring — and `spring-text-engine` — jumps to its
end state instead of animating. Renders `null`; mounted once in the root layout.
See [[animation-system]] and [[seo-metadata]].

## Preloader — `preloader/`

The brand curtain shown while the page loads, and the hand-off that holds the
hero's entry animations until it lifts. Lives in
`src/components/common/preloader/`.

| File | Role |
|------|------|
| `preload-context.tsx` | `<PreloadProvider>` + `usePreload()` — owns the two signals |
| `preloader.tsx` | The curtain itself — ring, filling logo, counter |
| `reveal-on-ready.tsx` | `<RevealOnReady>` — re-arms a subtree's reveals after the curtain |
| `index.ts` | Barrel exports |

**Two signals, not one.** `usePreload()` returns
`{ loaded, revealed, markRevealed, registerGate }`:

- `loaded` — the page is *ready* (see **Readiness** below).
- `revealed` — the curtain is *on its way out*. This is the signal content waits
  on.

They are deliberately separate: between them sits the 100% hold (`HOLD_MS`) and
the curtain animation.

`revealed` fires **during** the lift, not at `onRest`, once `bottomInset` passes
`REVEAL_AT_INSET` (60). Waiting for rest meant the hero's reveal *started* on a
fully uncovered page, so the visitor watched an empty layout for the length of
the stagger. Firing mid-lift means the animation is already in flight when the
panel clears the copy, and the two read as one gesture.

Measured, at `CURTAIN_CONFIG` (`tension 90, friction 24`): the lift reaches 28%
at ~1219 ms, 75% at ~1454 ms, 95% at ~1803 ms and only settles at ~2636 ms — the
spring approaches 100 asymptotically, so `onRest` lands roughly **800 ms after
the panel is visually gone**. Anything choreographed off `onRest` is later than
it looks.

> [!note] Reading the curtain back
> Computed `clip-path` collapses trailing zeros: `inset(0% 0% 43.2%)`, not
> `inset(0% 0% 43.2% 0%)`. A probe expecting four values silently matches
> nothing.

### Readiness is more than `window.load`

`loaded` requires **all** of:

| Condition | Why |
|-----------|-----|
| `window.load` | the document's own subresources are in |
| `document.fonts.ready` | typography-first design — uncovering mid-swap shows the hero in a fallback face and then reflows it |
| every **gate** released | see below |
| `MIN_DURATION_MS` (900) elapsed | on a warm cache everything resolves in a few hundred ms, and a ring that flashes past reads as a glitch, not as progress |

…or `GATE_TIMEOUT_MS` (6000) has passed, which forces the curtain up regardless.
That ceiling is not optional: a failed chunk or a refused WebGL context would
otherwise trap the visitor behind an opaque panel forever.

**Gates.** `window.load` says nothing about anything mounted *lazily*, and the
hero's centrepiece is exactly that — [[dna-ink-scene]] is a
`dynamic({ ssr: false })` import, so `three` had not even been fetched when the
curtain first lifted. Measured: the overlay was gone at **982 ms**, long before
the scene existed.

Anything that must be on screen before the reveal therefore claims a gate:

```tsx
useEffect(() => {
  const release = registerGate();
  return release;          // also releases on unmount — never strand the curtain
}, [registerGate]);
```

Two rules for gate holders:

- **Claim it in an eagerly mounted component**, not inside the lazy chunk. By
  the time that chunk arrives the preloader may already have finished, and there
  would be nothing left to hold. `LazyDnaInk` claims it; `DnaInk` only reports
  readiness back through `onReady`.
- **Release on a real frame, not on mount.** `DnaInk` fires `onReady` after its
  first `scene.render()` — at mount the GL context exists but nothing is drawn,
  which is precisely the state the preloader is there to hide.
- **Only gate what is actually on screen.** The Contact scene never renders
  while off screen, so its gate would never resolve — hence the opt-in
  `gatesPreload` prop, set on the hero instance alone.

`pendingGates === 0` is also true before anything has claimed a gate, but that
window is unreachable: gates are claimed in child effects, and React runs those
before the provider's own effect starts either timer.

**The curtain.** One `progress` spring drives all three visuals — a ring drawn
clockwise from twelve o'clock (`strokeDashoffset` against a full-circumference
`strokeDasharray`), the DNA mark filling diagonally from its lower-left (a
`mask-image` `linear-gradient(45deg, …)` with a **hard stop**, so the boundary is
a straight edge rather than a fade), and a percentage counter.

Progress creeps to `CREEP_TARGET` (85%) on its own with a deliberately slack
spring, then completes briskly once `loaded` lands. A bar that sits at 0 and then
snaps to 100 communicates nothing; the creep is honest about "still working"
without pretending to measure bytes.

Exit is `clipPath: inset(0% 0% B% 0%)` with `B` springing 0 → 100. Increasing the
**bottom** inset trims the panel from its bottom edge upward, so the page is
uncovered **bottom-to-top** and the last sliver of green is at the top of the
viewport. After `onRest` the overlay unmounts entirely (`gone`) rather than
lingering at `opacity: 0` over the scene's canvas.

Scroll is locked (`body { overflow: hidden }`) until `revealed`.

> [!warning] `onRest` fires at *any* rest, not just the final one
> It also fires when the spring settles at its initial value, so the handler
> guards on `if (!lifting) return;`. Removing that guard reveals the page
> immediately on mount.

**`<RevealOnReady>`** — wrap anything whose entry animation must not play behind
the curtain. The hero is the case that forces it: it is in view from the very
first frame, so its [[text-engine|`TextEngine`]] reveals fire at mount, run to
completion under the curtain, and are already finished when anyone sees the page.

Two mechanisms, and **both** are required:

1. A `key` that swaps when `revealed` flips, which **remounts** the subtree and
   re-arms every in-view trigger inside it. This is what makes the reveal play
   at all.
2. `opacity-0` on the subtree until then. The remount alone does not suppress
   the first, pointless pass — it still ends at full opacity, and the frame in
   which the curtain is removed paints that finished text one tick before the
   remount resets it. That flash-then-replay is read, correctly, as the
   animation playing twice.

A remount rather than conditional rendering: `children` still render on the
server, so the copy is in the initial HTML for crawlers and for no-JS readers —
conditional rendering would have emptied the hero from the document. The
`opacity` flip is a binary state change, not a transition, so no animation rule
applies to it.

It takes a `className`, which lands on that same wrapper. That is what lets it
**replace** a positioning wrapper instead of adding one — the hero places every
block at its artboard coordinates, and a second nested div there would mean
either duplicating the offsets or breaking the flex column below `lg`.

> [!tip] Measuring this
> The animated node is `.line-word > span`, **not** the `.line-word` wrapper —
> a probe on the wrapper reads `opacity: 1` forever and shows nothing. Sample
> the effective opacity (word × wrapper) each frame and count rising edges:
> two edges means the double-play regressed. Note also that browser-tool round
> trips can exceed the whole preloader, so the probe must be installed and read
> inside a **single batched call**.

**Mounting** — the root layout wraps everything in the provider, with the curtain
as a sibling of `ScrollLayout`:
```tsx
<PreloadProvider>
  <Preloader />
  <ScrollLayout>{children}</ScrollLayout>
</PreloadProvider>
```
The page renders underneath the curtain from the first byte — the overlay covers
it, it is never withheld.

All motion is `@react-spring/web` (hard rule #1); the ring, the mask and the clip
are all `.to()` interpolations off springs, no keyframes.

## FloatingCta — `floating-cta.tsx`

Fixed bottom-right "Try Free" pill, mounted once in `home/index.tsx` outside
`<main>` (ADR-0029). Same `@react-spring/web` fade-and-lift technique as
`HeaderCta` (opacity + `translate3d`, `pointer-events` dropped once opacity
crosses 0.5) but triggered by a raw `window.scrollY > 300` behind a `scroll`
listener rather than an `IntersectionObserver` — the requirement is a scroll
offset ("appears after 300px"), not an element's position. `Spring`'s own
`mode="forward"` already uses this same
`window.addEventListener("scroll", …, { passive: true })` pattern.

Lives in `common/`, not next to a feature section, because it's site-wide
chrome rather than belonging to one page section — see
[[component-conventions]] → *Placement*.

## LanguageSwitcher — `header/language-switcher.tsx`

The header's locale picker (ADR-0030). A native `<details>`/`<summary>`
disclosure — the same pattern the DNA Ink controls panel already uses (see
[[dna-ink-scene]]): keyboard-operable and labelled for free, no hand-rolled
`useState` + ARIA dropdown, no spring — showing/hiding a native disclosure
is browser behaviour, not motion the animation system needs to own.

Rendered twice: once in `SiteHeader`'s desktop bar (its own glass pill, next
to `HeaderCta`), once inside `MobileMenu`'s panel (`self-start`, alongside
the CTA button) — both instances exist in the DOM regardless of viewport,
CSS decides which is visible.

`usePathname()` + a small `stripLocalePrefix` helper preserve the current
page across a switch: picking Arabic from `/pricing` navigates to
`/ar/pricing`, not `/ar`. Labels come from `LOCALE_LABELS`
(`lib/i18n/locales.ts`) — each locale's own native name, not its English
name or ISO code.

## Skeleton loaders

Three skeleton components for `loading` states of async-data components — every
async component must mirror its final layout with one of these
(see [[component-conventions]]).

| Component | File | For |
|-----------|------|-----|
| `<SkeletonImage>` | `skeleton-image.tsx` | image placeholders |
| `<SkeletonLoader>` | `skeleton-loader.tsx` | generic block placeholders |
| `<SkeletonVideo>` | `skeleton-video.tsx` | video placeholders |

## Related

[[component-conventions]] · [[components/animation-springs]] · [[components/ui]] ·
[[components/home-sections]] · [[text-engine]]
