/**
 * DNA Ink — scene settings.
 *
 * Ported verbatim from the `dna-ink.html` reference sketch (the values the
 * in-browser control panel produced). This module is the single source of truth
 * for the look: every number below is fed to a shader uniform in `scene.ts`, so
 * tuning the scene means editing this file — never the render code.
 *
 * Cyan / sky-blue palette on white paper (AI Doctor Study re-theme — see
 * decisions-log ADR-0022). `bgColor` is deliberately kept light even though
 * the surrounding panel tokens went dark: the clouds are MULTIPLY-blended and
 * only read on a light surface, so darkening it here would erase the helix.
 * A rotating DNA double helix continuously sheds ink-in-water plumes: every
 * ink point is born on the strand, then advected outward by an evolving
 * simplex-noise flow, growing and fading like dye diffusing through water.
 *
 * 📖 Docs: obsidian/frontend/components/dna-ink-scene.md
 */

/** `#rrggbb` — the only literal form the scene shaders accept. */
export type HexColor = `#${string}`;

export interface DnaInkConfig {
  /** Clear colour of the water/paper. */
  bgColor: HexColor;
  /** Inactive on a white background — kept so the flame composite can be revived. */
  flameColor: HexColor;
  /** Inactive on a white background. */
  flameColor2: HexColor;
  /** Flame mix amount. `0` disables the flame composite entirely. */
  flameAmt: number;

  /** Faint suspended sediment drifting with the camera (multiply-blended). */
  atmoColor: HexColor;
  atmoCount: number;
  atmoSize: number;
  atmoSpeed: number;

  /** Strand core — saturated violet. */
  helixColorA: HexColor;
  /** Strand base — deep violet. */
  helixColorB: HexColor;
  /** Ink at birth. */
  inkCore: HexColor;
  /** Ink mid-life. */
  inkMid: HexColor;
  /** Ink far edge — pale lavender, fades into the white. */
  inkEdge: HexColor;

  /** Strand + rung point count. Changing it rebuilds the geometry. */
  helixCount: number;
  /** Ink plume point count. Changing it rebuilds the geometry. */
  inkCount: number;

  /** Camera distance — frames the whole strand. */
  camDist: number;
  helixSize: number;
  inkSize: number;
  brightness: number;
  helixOpacity: number;
  inkOpacity: number;
  /** How much an ink point swells over its life. */
  inkGrow: number;

  /** Helix coil radius. */
  radius: number;
  /** Half-height of the strand. */
  height: number;
  /** Coils per world unit. */
  twist: number;
  /** Strand jitter thickness. */
  strandThick: number;
  /** Slow breathing sway of the whole helix. */
  wave: number;

  /** Helix rotation speed (rad/s). */
  spin: number;
  /** Lean of the helix (z tilt, radians). */
  tilt: number;

  /** Ink life-cycle speed (cycles/sec). */
  emitRate: number;
  /** Radial diffusion distance. */
  spread: number;
  /** Vertical drift of the ink. */
  rise: number;
  /** Noise-driven swirl amount. */
  turbulence: number;
  /** Spatial scale of the flow field. */
  noiseFreq: number;
  /** How fast the flow field morphs. */
  noiseEvolve: number;

  /** Mouse camera parallax. */
  parallax: number;

  /** World radius the cursor deforms within. */
  pointerRadius: number;
  /** How hard points are pushed away from the cursor. */
  pointerStrength: number;

  /**
   * Upper bound on `devicePixelRatio`.
   *
   * Not in the original sketch, which rendered at the raw DPR. A 3× phone
   * renders 9× the fragments for ~47k additive point sprites, which is the
   * difference between 60 fps and a slideshow — so the port clamps it.
   * Raise to `3` to reproduce the sketch exactly on a high-DPI display.
   */
  maxPixelRatio: number;
}

export const DNA_INK_CONFIG: DnaInkConfig = {
  // ADR-0024: bgColor moved dark at the project owner's explicit, informed
  // request, overriding ADR-0022/0023's decision to keep it light. Per this
  // file's own MultiplyBlending docs, a dark backdrop leaves the ink/helix
  // faint — brightness/opacity below were raised to partly compensate, but
  // this cannot fully undo the blend math without a shader change (off-limits
  // under hard rule #2). See decisions-log ADR-0024.
  bgColor: "#070d17",
  flameColor: "#0ea5e9",
  flameColor2: "#7dd3fc",
  flameAmt: 0.12,
  atmoColor: "#38bdf8",
  atmoCount: 1500,
  atmoSize: 0,
  atmoSpeed: 0.6,

  helixColorA: "#0ea5e9",
  helixColorB: "#7dd3fc",
  inkCore: "#0c4a6e",
  inkMid: "#e0f2fe",
  inkEdge: "#0ea5e9",

  helixCount: 40000,
  inkCount: 160000,

  camDist: 12,
  helixSize: 1,
  inkSize: 6,
  brightness: 0.55,
  helixOpacity: 1.8,
  inkOpacity: 0.95,
  inkGrow: 1.8,

  radius: 1.75,
  height: 6.8,
  twist: 0.65,
  strandThick: 0.39,
  wave: 0.5,

  // Slow rotation, per ADR-0024 — was 0 (one fixed pose). 0.34 reproduces the
  // original sketch's speed exactly; 0.12 is a deliberately slower crawl.
  spin: 0.12,
  tilt: -0.34,

  emitRate: 0.19,
  spread: 0.6,
  rise: -0.2,
  turbulence: 1.6,
  noiseFreq: 1.05,
  noiseEvolve: 0.1,

  parallax: 3,

  pointerRadius: 5,
  pointerStrength: 1.55,

  maxPixelRatio: 1.5,
};
