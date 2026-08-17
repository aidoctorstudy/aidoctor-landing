---
tags: [frontend, component, catalog, stable]
updated: 2026-08-10
---

# Catalog — UI primitives

Design-system primitives in `src/components/ui/`. Stateless, no provider
dependencies. All Server Components unless noted.

## `button.tsx` — `<Button>`

The design's only button shape: a pill. Figma nodes `1546:199` (primary),
`1546:201` (secondary), `1572:533` (primary + arrow disc).

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `children` | `ReactNode` | — | Label |
| `variant` | `"primary" \| "secondary"` | `"primary"` | solid cyan / outline cyan (ADR-0024) |
| `href` | `string` | — | present → renders `<Link>`, absent → `<button>` |
| `withArrow` | `boolean` | `false` | trailing light-cyan disc with `ArrowUpRightIcon` |
| `type` | `"button" \| "submit"` | `"button"` | ignored when `href` is set |

`href` also accepts an absolute URL (e.g. `EXTERNAL_APP_URL` in
`data/mocks/home.ts`) — `next/link` renders it as a plain external anchor,
same tab, no special-casing needed.

> [!important] The element follows the behaviour
> `href` renders a real anchor, otherwise a real `<button>` — never a `div` with
> a click handler ([[html-semantics]]). The arrow variant drops its right
> padding (`pr-0.5`) because the disc sits flush with the pill edge, exactly as
> in the mockup.

Colour comes from `--action-primary*` (solid fill) / `--action-outline*`
(transparent fill, cyan border and text — ADR-0024, replacing the old solid-lime
secondary pill). `--action-secondary*` itself wasn't repointed to the outline
role — it's still a light-cyan *fill* token, now used only by the arrow disc
and the header/contact icon badges, which would have broken if it had been
redefined out from under them. The hover state is a token-backed CSS
`transition-colors`, which is the narrow exception hard rule #1 allows
(ADR-0014).

## `icons/` — `<DnaIcon>`, `<ArrowUpRightIcon>`

Icons extracted from the Figma frame and hand-converted to components rather
than dropped in `public/` as `.svg` files.

> [!note] Why components, not assets
> The exported SVGs bake in `#F8FFB4`. An `<img>` can't be re-coloured, and a
> baked hex is a hard rule #4 violation the moment the palette moves. Both
> icons paint with `fill="currentColor"`, so the colour comes from a token on
> the parent (`text-action-secondary`, `text-accent`, …) and one icon serves
> every context.

Both take `{ className }` only — size with `size-*`, colour with `text-*`.
The original exports are kept in `public/assets/icons/` for reference.

## Adding a primitive

Named export, typed `interface …Props`, no `any`, under ~150 lines. Anything
that needs a provider or browser state belongs in [[components/common]]
instead, and anything specific to one page belongs next to that page — see
[[folder-structure]].

## Related

[[component-conventions]] · [[design-system]] · [[html-semantics]] ·
[[components/home-sections]]
