// 📖 Docs: obsidian/frontend/components/common.md

/**
 * Adaptive scaling grid configuration.
 *
 * The grid keeps a rem-based design proportional across viewports by scaling
 * the root (`<html>`) font-size. Each breakpoint maps a viewport `maxWidth` to
 * the design `baseWidth` it was laid out at — at `baseWidth` the root
 * font-size equals `FONT_BASE` and rem values match the design 1:1.
 *
 * - Scaling DOWN (viewport at or below `GRID_BASE_WIDTH`) is driven by the
 *   `vw` media queries in `src/app/globals.css`.
 * - Scaling UP (viewport above `GRID_BASE_WIDTH`) is driven at runtime by the
 *   `AdaptiveGrid` component / `useAdaptiveGrid` hook.
 *
 * Changing these values means updating the `html` media queries in
 * `globals.css` to match — the formula is:
 *   font-size: FONT_BASE * 100 / baseWidth  (vw)
 */

/** Root font-size (px) the design is measured against. */
export const FONT_BASE = 16;

export interface GridBreakpoint {
  /** Media-query `max-width` threshold (px). */
  maxWidth: number;
  /** Design base width (px) the range was laid out at. */
  baseWidth: number;
}

/**
 * Breakpoints, largest first.
 *
 * **One entry, on purpose.** The design exists as a single 1440 desktop
 * frame, and that is the only range where proportional scaling earns its keep:
 * the composition there is absolutely positioned at the artboard's coordinates,
 * so every offset has to track the viewport or the layout falls apart.
 *
 * Below `lg` the page is a *flow* layout that reflows on its own, so scaling the
 * root font-size buys nothing and actively hurt: with the starter's 1024 and
 * 360 bases, a 820px tablet computed a 12.6px root (body copy at 12.6px) while a
 * 500px phone computed 21.6px — smaller text on the larger device, and a jump at
 * every breakpoint edge. Below 1024 the root is a plain 16px and normal
 * responsive utilities do the work.
 */
export const GRID_BREAKPOINTS: readonly GridBreakpoint[] = [
  { maxWidth: 1440, baseWidth: 1440 },
];

/**
 * Damping for the scale-up above `GRID_BASE_WIDTH`.
 *
 * `1` = the design keeps Figma's proportions exactly at any width, which is
 * what this project asks for. The starter's default (`0.6666`) deliberately
 * damps growth on very wide monitors; that trade is off here.
 */
export const GRID_SCALE_COEF = 1;

/** Largest breakpoint width — above it the root font-size scales up. */
export const GRID_BASE_WIDTH = Math.max(
  ...GRID_BREAKPOINTS.map((bp) => bp.maxWidth),
);
