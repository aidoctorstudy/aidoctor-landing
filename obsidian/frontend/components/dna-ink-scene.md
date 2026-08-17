---
tags: [frontend, component, 3d, stable]
updated: 2026-08-10
---

# Component — DNA Ink scene

The project's WebGL backdrop: a rotating DNA double helix that continuously
sheds ink-in-water plumes. Ported from a standalone `dna-ink.html` sketch into
the starter's conventions. ADR: [[decisions-log]] ADR-0018.

- **Engine:** `src/lib/scene/dna-ink/` — framework-free three.js
- **React leaf:** `src/components/scene/dna-ink/` — Client Component (`"use client"`)
- **Status:** #stable

## Files

| File | Role |
|------|------|
| `lib/scene/dna-ink/config.ts` | `DnaInkConfig` + `DNA_INK_CONFIG` — **every tunable lives here** |
| `lib/scene/dna-ink/shaders.ts` | GLSL sources, verbatim from the sketch |
| `lib/scene/dna-ink/scene.ts` | `DnaInkScene` — renderer, camera, composer, both point clouds, pointer |
| `components/scene/dna-ink/dna-ink.tsx` | Mounts the canvas, sizes it, feeds the pointer, drives the ticker, owns the live settings |
| `components/scene/dna-ink/lazy-dna-ink.tsx` | `dynamic({ ssr: false })` wrapper — keeps `three` out of first-load JS |
| `components/scene/dna-ink/dna-ink-controls.tsx` | The dev settings panel |
| `components/scene/dna-ink/dna-ink-controls.config.ts` | Slider ranges, snapshot serialiser, `localStorage` helpers |

`DnaInkScene` knows nothing about React. It owns a `<canvas>` and exposes
`setSize` / `setPointer` / `clearPointer` / `render` / `dispose`; that split is
what makes the scene testable and the component ~70 lines.

## Props

```ts
interface DnaInkProps {
  config?: DnaInkConfig;  // starting settings; defaults to DNA_INK_CONFIG
  controls?: boolean;     // settings panel; defaults to OFF everywhere
  className?: string;     // classes for the <canvas> itself
  onReady?: () => void;   // fired once, after the FIRST DRAWN FRAME
}

interface LazyDnaInkProps extends DnaInkProps {
  gatesPreload?: boolean; // hold the preloader until this scene has painted
}
```

**`gatesPreload`** wires the scene into the [[common|preloader]]'s gate system.
Because the scene is a lazy chunk, `window.load` does not wait for it — without
a gate the curtain lifts onto an empty hero. The gate is claimed in
`LazyDnaInk` (which mounts eagerly) and released from `onReady`, which fires
after the first `scene.render()`, not on mount: at mount the GL context exists
but nothing is drawn.

Set it on the **hero instance only**. An off-screen scene never renders — the
Contact one does not paint until scrolled to — so its gate would never resolve
and the curtain would sit until the 6 s timeout.

## Usage

```tsx
import { LazyDnaInk } from "@/components/scene/dna-ink";

<div className="pointer-events-none fixed inset-x-0 top-0 h-lvh">
  <LazyDnaInk className="block h-full w-full" />
</div>
```

Import **`LazyDnaInk`**, never `DnaInk` directly — the direct import pulls
`three` (~600 KB raw) into the importing chunk and would run during SSR.

## How it works

Both clouds are `THREE.Points` over a buffer of random seeds; the shaders hash
each seed into a point identity and place it entirely on the GPU — there is no
per-point JS. `helixPoint()` (shared GLSL) samples the double helix: 85 % of
points land on the two strands, the rest on base-pair rungs.

Ink position is a pure function of a normalised life `L = fract(seed + t·rate)`:
born on the helix at its own emission moment, pushed radially outward
(`spread`), swirled by an evolving 3D simplex flow (`turbulence`, `noiseFreq`,
`noiseEvolve`), swelling (`inkGrow`) and thinning as it disperses.

Both materials use `THREE.MultiplyBlending` and write
`mix(vec3(1.0), colour, coverage)` — the dye **darkens the water** rather than
glowing on black. `vec3(1.0)` is the multiply identity, so a fragment with zero
coverage leaves the backdrop untouched whatever `bgColor` is; the backdrop
itself comes from the clear colour. That is why the scene wants a **light**
backdrop, and why there is no additive bloom: on a dark `bgColor` the clouds
have nothing left to darken and fade toward invisible.

> [!warning] `bgColor` is dark in production (ADR-0024), against this file's own advice
> As of ADR-0024, `config.bgColor` is `#070d17` — dark — at the project owner's
> explicit, informed request, made after being shown exactly this paragraph.
> The consequence described above is real and expected: the ink/helix render
> visibly faint. This is not a bug to fix by picking a lighter `bgColor` or by
> changing the blend mode (a shader change, off-limits under hard rule #2) —
> it's a deliberate trade-off the project owner chose knowingly. See ADR-0024
> for the two alternatives that were offered and declined.

## The settings panel

A React port of the slider panel from the sketch. It renders when `controls` is
true, which now **defaults to `false` everywhere, development included** — pass
`controls` explicitly to bring it back for a tuning session.

It used to default on in development. That was right while the scene was being
tuned and wrong afterwards: the chip sits in the top-right corner, directly over
the header's Contact button, so every screenshot of the real design had a dev
tool in it. The panel is also the only thing that reads the stored
`localStorage` override, so with it off the committed `DNA_INK_CONFIG` is
guaranteed to be what renders — which closes the masking trap noted under
*Tuning*.

It ships **collapsed**: a `⚙ controls` chip in the top-right corner, click to
open. The disclosure is a native `<details>` / `<summary>`, so it is
keyboard-operable and labelled with no extra ARIA; the panel is `w-fit` and the
body below it carries the fixed width, which is what lets the collapsed chip
shrink to its own text. The open/closed state is not persisted — a tuning tool
should not be in the way of the next person who opens the page.

| Control | Effect |
|---------|--------|
| colour swatches | `hexToVec3` → uniform, next frame |
| sliders | uniform, next frame (ranges ported from the sketch's `numericRanges`) |
| `⟳ reload` | rebuilds the scene from scratch — re-seeds every random buffer |
| `↺ reset` | clears stored overrides, restores the `config` prop, rebuilds |
| `⧉ copy` | copies the snapshot to the clipboard |

The `<pre>` at the bottom is the point of the whole panel: it renders the live
settings as **paste-ready source** for the body of `config.ts`, so a tuning
session ends in a copy-paste rather than transcription.

Edits persist to `localStorage` under `ai-doctor-study:dna-ink` and are re-read on
mount. `readStoredConfig` drops unknown keys and type mismatches, so a stale
entry written before a field changed shape cannot poison the scene — and
`↺ reset` clears the key.

> [!important] Edits go through `applyConfig`, never a remount
> `DnaInkScene` is created in an effect keyed on an internal `generation`
> counter, **not** on the settings. A slider writes uniforms only; the canvas
> and the GL context survive. Only `⟳ reload` / `↺ reset` bump `generation`.
> Count changes (`helixCount`, `inkCount`, `atmoCount`, `atmoSize`) reallocate
> buffers, so `applyConfig` debounces them by 120 ms — a drag rebuilds once.

`maxPixelRatio` is the one slider that resizes the framebuffer; `applyConfig`
replays the last known size when it changes.

> [!note] The panel is still in the production chunk
> It is imported statically by `dna-ink.tsx`, so the ~2 KB of panel code ships
> inside the `ssr: false` scene chunk even though it never renders in
> production. If that ever matters, wrap it in its own `dynamic()`.

> [!important] The scene clock is frame-driven, never `performance.now()`
> Ink position is a **pure function of `uTime`**
> (`life = fract(seed + uTime * emitRate)`). Feeding it a wall clock means that
> any dropped frames — which is precisely what fast scrolling causes — advance
> `uTime` by a large step, and the entire plume teleports to a different phase.
> On screen it reads as the model "changing position" and the strand tearing
> apart.
>
> `render()` therefore accumulates **clamped** deltas into `this.elapsed`
> (`MAX_FRAME_DELTA`, 50 ms) and feeds that to `uTime`, `uAppear` and the
> atmosphere. A stall now costs at most one clamped frame of drift instead of
> however long the browser was busy. `spinPhase` already worked this way; the
> other three uniforms did not.
>
> **`uAppear` is the exception and runs on wall clock.** Tying the entrance fade
> to the frame clock was a regression: after any rAF throttling the scene sat
> stuck part-faded, rendering as a small faint tangle instead of a helix — which
> reads as "the model changed position" even though nothing moved. A jump in the
> fade is invisible (it is a one-shot intro that is already over); a jump in
> `uTime` is not. Hence two clocks.

> [!important] `gl_PointSize` must be normalised against the drawing buffer
> This was the actual cause of "the model keeps changing" — not the clocks.
> `gl_PointSize` is **device pixels**, so a sprite covers a larger *share* of a
> smaller canvas. Narrow the window and the projected strand shrinks while the
> dots do not: they overlap, MULTIPLY blending multiplies the overlap, and the
> cloud goes dense and colour-shifted. Every canvas resize therefore changed how
> the scene looked.
>
> Both clouds now multiply their size by `uPixelScale`
> (`bufferHeight / REFERENCE_BUFFER_HEIGHT`, 1600 = 800 design px at a 2× ratio
> cap). The **atmosphere layer never had the bug** — it always scaled by
> `uRes.y / 900.0`, which is what gave the diagnosis away. `helixSize` and
> `inkSize` in the config are calibrated against that reference.
>
> Verified by halving the hero's height at runtime: the helix scales down and
> keeps its density and colour, where before it would have thickened.

> [!important] The scene rewinds when it leaves the viewport
> `config.spin` turns the helix continuously, so every return to a scene block
> showed it at whatever angle it had drifted to — reported repeatedly as "the
> DNA keeps rotating when I scroll back and forth". `resetClock()` zeroes
> `elapsed` and `spinPhase` on the **exit** edge of the visibility observer, so
> the block always opens on the same pose and the rewind itself happens off
> screen where no jump is visible. `uAppear` is deliberately untouched — the
> intro fade must not replay.
>
> This is also why the render gate carries **no `rootMargin`**: the gate and the
> rewind have to share one boundary, or the scene spins through the margin
> before you see it and the determinism is lost.
>
> `config.spin` was `0` (one fixed pose) for the original Dantora design; as of
> ADR-0024 it's `0.12` — a deliberately slow crawl, requested directly by the
> project owner. `0.34` reproduces the reference sketch's original speed. The
> rewind-on-exit mechanism above works at any `spin` value, fixed pose or not —
> it always keeps every arrival starting from the same angle.

> [!danger] Pointer NDC is clamped to ±1 — the camera once measured `y = −45`
> The "DNA at a different angle / small knot" family of reports had one more
> cause, found by reproducing the scroll round-trip and reading
> `scene.inspect()` mid-bug: **`camY: −45.28`** against a legal parallax range
> of ±3. The `pointermove` listener lives on `window`, but NDC is computed from
> the **canvas rect** — scroll the canvas ~9000px away and the same maths yields
> ±15 and beyond, and the camera followed it: viewing the helix down its axis
> from triple distance = the knot. Which angle you got depended on where the
> mouse happened to be during the scroll — hence "иногда".
>
> Three layers now guarantee the invariant:
> 1. `setPointer` clamps to [−1, 1] — scene-level, safe against any caller;
> 2. the component drops `pointermove` while the canvas is off screen — there
>    is nothing to parallax;
> 3. `resetClock()` zeroes the pointer easing state too, so a stale target can
>    never swing the camera during re-entry.
>
> Verified by replaying the breaking sequence (scroll to bottom → move the mouse
> → return): the pose is now identical to baseline, and `inspect()` shows every
> camera within ±3.

> [!danger] Visibility is measured from the rect every frame — never an `IntersectionObserver`
> This was the bug behind every "the DNA is wrong again" report, and it took a
> diagnostic handle to find rather than another guess. `IntersectionObserver`
> **latches**: its first callback fires with whatever the layout says at
> subscribe time, and if that reads as *not* intersecting, a static element
> produces no further callbacks — so the render gate stayed shut forever.
>
> With the gate shut, `render()` never runs, so `uAppear` stays at **0**. At
> zero appear only the densest overlaps clear the visibility threshold, and the
> helix draws as a small faint knot instead of a full strand. Scrolling away and
> back happened to fire the observer, which is why it "sometimes worked".
>
> `scene.inspect()` (dev-only, registered on `window.__dnaScenes`) is what made
> this measurable: `{ appear: 0, elapsed: 0 }` on a scene that was plainly on
> screen. Use it before theorising about this scene again.
>
> The gate now reads `getBoundingClientRect()` once per frame inside the ticker.
> One rect read per scene per frame is nothing, and it cannot latch.

> [!important] The scene renders only while its canvas is on screen
> The page carries **two** instances at ~200k point sprites each. Drawing both
> at all times starves the frame budget, and a starved rAF is the upstream cause
> of the stutter above — the clock fixes treat the symptom, this treats the
> cause. An `IntersectionObserver` with one viewport of `rootMargin` flips a
> ref that `useLoop` checks before calling `render()`, so the off-screen scene
> costs nothing while staying warm on approach (optimize-3d-scene §4).

## Conventions it follows

- **No hardcoded values** (hard rule #4) — every number is a named field of
  `DnaInkConfig`, or a framing constant at the top of `scene.ts`.
- **Server Components by default** (hard rule #7) — [[routing|the view]] stays a
  Server Component; the scene is the `"use client"` leaf.
- **One rAF for the page** — `render()` is driven by `useLoop` → the shared
  ticker (`src/lib/animation/ticker.ts`, ADR-0009), not its own loop.
- **Hard rule #1 does not apply** to the WebGL loop — see [[optimize-3d-scene]]
  *How it sits with the hard rules*. Everything layered *around* the canvas
  (reveals, overlays, copy) is still spring-based.
- **Canvas `lvh`, content `dvh`** — the canvas layer is pinned to the large
  viewport so a collapsing mobile URL bar never reallocates the framebuffer.
- Decorative: `aria-hidden="true"` and `pointer-events-none`, so content above
  it stays clickable and screen readers skip it.

## Deviations from the reference sketch

Recorded in full in [[decisions-log]] ADR-0018. In short:

1. **Two dead bloom composers removed.** The sketch built `torusComposer` and
   `bloomComposer` and assigned their render targets to uniforms the final
   shader never samples — three full scene renders per frame for an image that
   was discarded. Output is identical; cost is a third.
2. **`maxPixelRatio: 2`** added to the config. The sketch rendered at the raw
   `devicePixelRatio`; a 3× phone means 9× the fragments for ~47 k point
   sprites. Set it to `3` to reproduce the sketch exactly.
3. **The debug panel is a React component, not injected DOM.** Same rows, same
   ranges, same `localStorage` behaviour — but dev-gated, styled from `--debug-*`
   design tokens, and its snapshot emits paste-ready `config.ts` source instead
   of a bare `const CONFIG`. `⟳ reload` remounts the scene rather than reloading
   the page.
4. **`WebGL1Renderer` → `WebGLRenderer`** — removed from three in r163.
   Along with it, both cloud materials now set **`premultipliedAlpha: true`**,
   which modern three requires for `MultiplyBlending`; without it the renderer
   sets no blend function at all and the dye stops accumulating. Visually
   identical to r143 — see ADR-0018.
5. **Touch devices skip the pointer listeners** — a coarse pointer has no cursor
   to follow, which is the sketch's idle state anyway.
6. **`bgColor` actually works.** In the sketch the swatch was dead: all three
   places that decide the backdrop — clear colour, `scene.background`,
   `fog.color` — were hardcoded `0xffffff`, and the `uBg` uniform it fed is
   never sampled by the final shader. The port drives all three from
   `config.bgColor` via `writeHexToColor`, which uses `Color.setRGB` rather than
   `setHex` **on purpose**: `setHex` would treat the value as sRGB and convert
   it into the linear working space, but nothing downstream ever encodes back
   (the composer's copy pass is a custom shader with no `<colorspace_fragment>`),
   so a managed colour would land on screen visibly darker than the hex asked
   for. `setRGB` defaults to the working space, making the conversion a no-op —
   the same reasoning behind `hexToVec3` for the palette.

## Tuning

Open the page in development, drag sliders until it looks right, hit `⧉ copy`,
and paste over the body of `src/lib/scene/dna-ink/config.ts`. Editing that file
directly works too — it is the committed source of truth, and the panel starts
from it.

**One file covers both instances.** The hero and the Contact block each mount
`<LazyDnaInk>` without a `config` prop, so both fall back to `DNA_INK_CONFIG`.
There is no per-instance tuning to keep in sync.

> [!warning] Clear the stored override after pasting a new config
> The panel persists edits to `localStorage` (`ai-doctor-study:dna-ink`) and re-reads
> them on mount, so in development a stale entry silently masks whatever you
> just committed — the file changes and the page does not. `↺ reset` clears it;
> so does `localStorage.removeItem('ai-doctor-study:dna-ink')`. Production never reads
> the key, because the panel only renders in development.

## Related

[[optimize-3d-scene]] · [[tech-stack]] · [[component-conventions]] ·
[[folder-structure]] · [[decisions-log]]
