---
tags: [meta, decision]
updated: 2026-08-10
---

# Decisions Log (ADRs)

Architecture Decision Records. Each entry captures a choice, its context, and its
consequences. Use [[templates/adr-note]] for new entries. Newest first.

---

## ADR-0024 — Dark-mode polish pass: card/chip/input tokens, DNA scene overrides, testimonials, footer, cookie fixes

- **Status:** Accepted (phase 1 of a larger, explicitly phased request)
- **Date:** 2026-08-17

**Context.** After ADR-0023's dark-theme conversion, the project owner sent a
large combined spec: exact rgba values for every surface (cards, nav, buttons,
chips, inputs, form panel), a request to move the DNA scene's `bgColor` fully
dark, a vanilla-JS 3D hover system, a 4-tier adaptive performance engine, a
text-only fallback mode with a real payment link, and several content/footer/
cookie items. Given the size and the direct conflicts with this project's own
hard rules (spring-only motion; the DNA scene's light-backdrop requirement),
four decisions were confirmed live with the project owner via `AskUserQuestion`
before any code changed — recorded here since they're load-bearing for
everything below:

1. **DNA scene `bgColor` → exactly `#070d17` (dark), as literally specified** —
   overriding ADR-0022/0023's decision to keep it light, *knowingly*: the
   project owner was shown the documented MULTIPLY-blending consequence (the
   ink/helix fades to near-invisible on a dark backdrop, and no shader change
   is allowed to fix it) and chose this outcome anyway, over a muted-mid-tone
   compromise or keeping the canvas white. This is **not** an agent error to
   "fix" later — see the callout in `globals.css` and `config.ts`.
2. **3D hover effects → vanilla JS mousemove listeners, as literally
   specified** — a deliberate, informed exception to hard rule #1 (spring-only
   motion), authorized by the project owner specifically for this feature.
   **Deferred to a follow-up pass**, per decision 4 below — not implemented in
   this ADR. A future agent implementing it should use raw
   `pointermove`/transform writes, not `@react-spring/web`, and should link
   back to this ADR so the deviation isn't mistaken for an oversight.
3. **The Gumroad Pro link (`https://hyperai3.gumroad.com/l/aidoctorstudypro`)
   and its pricing are real and confirmed** — wired into the site (see below),
   not fabricated.
4. **Scope phased**, per the project owner's own choice: this ADR covers only
   the "dark-mode critical fixes + content changes" bucket (cards, buttons,
   chips, inputs, form panel, DNA scene colors, testimonials, footer, cookie
   banner, button hrefs). The 3D hover system, the 4-tier adaptive performance
   engine (device scoring, FPS-based throttling, battery API), and the
   text-only static-HTML fallback mode are **explicitly out of scope for this
   ADR** and were not started — they are separate, unstarted follow-up work.
   The performance-tier work in particular belongs to the `optimize-3d-scene`
   skill (hard rule #11) when it's picked up, not a hand-rolled implementation.

**Decision — new design tokens** (`globals.css`), added rather than
hardcoding the spec's rgba values in `className`, per hard rule #4:

| New Tier 2 role | Value | Used by |
|---|---|---|
| `--accent-soft` | `raw-color-lime-400` (`#7dd3fc`) | stat numbers, chip text — an alias, not a new primitive |
| `--action-primary-hover` | `raw-color-brand-600` (`#0284c7`) | primary button hover fill, now distinct from its border colour |
| `--action-outline-*` | cyan-alpha border/text/hover | the secondary button's new outline treatment |
| `--surface-card` / `--border-card` | `card-alpha-80` / `brand-alpha-15` | feature cards, testimonial cards, the team rail's tail card |
| `--surface-chip` / `--border-chip` | `brand-alpha-10` / `brand-alpha-20` | Hero's floating service chips |
| `--surface-input` / `--border-input` | `card-alpha-60` / `brand-alpha-20` | Contact form fields |
| `--glass-blur-strong` | `20px` | Contact's form panel only — the header/chips stay at the general `--glass-blur` (bumped `10px` → `12px` to match the spec's Nav value) |

`--surface-glass` / `--surface-glass-strong` moved from neutral black-alpha
(ADR-0023) to the brand's own ink-navy alpha (`rgba(7,13,23,…)`), matching the
spec's exact Nav/Form-panel values. `--surface-glass-subtle` was **retired** —
Hero's chips moved to the new dedicated `--surface-chip`/`--border-chip` pair
instead of reusing generic glass, so nothing referenced it anymore (verified
by grep before deleting). `--foreground-muted` moved from white-alpha to a
slate-blue tint (`rgba(148,163,184,.8)`), matching the spec's explicit "muted
text" value.

> [!important] `--action-secondary*` was deliberately NOT repointed
> The secondary *button* needed a new outline look, but `--action-secondary*`
> is a shared role also used as a plain light-cyan **fill** — the header/
> contact icon badges (`bg-accent text-action-secondary`) and the button's own
> trailing arrow disc. Repointing it to "transparent" for the button would have
> broken those. New `--action-outline-*` tokens carry the button-only meaning
> instead; see [[components/ui]].

**Decision — Services "lime" card and the Team "more" card** both moved off
`bg-action-secondary` (a solid light-lime fill) onto the new `--surface-card`/
`--border-card` dark-glass treatment, so they no longer need explicit dark-text
overrides — they inherit the ambient white `--foreground` like every other
card now. (ADR-0023 had given the lime card an explicit
`text-action-secondary-foreground` override because it was still light at the
time; that's reverted here since the card itself went dark.) The lime card's
internal list divider moved from `--border-subtle` (now light-alpha, invisible
on light surfaces) to `--border-card`, matching its own new border tone.

**Decision — testimonials replace the team rail's stock photos.** The
Dantora clinic's stock doctor photos (`TeamMember.image`) were removed —
there are no real AI Doctor Study student photos to use instead.
`TeamMember` gained `quote` and `initials`; `team.tsx`'s cards now render a
short pull-quote over a gradient initials-avatar (`--raw-gradient-avatar`,
composed from the same two brand shades as `--action-primary-border`/
`--accent`, kept at Tier 1 since Tier 2 tokens may not reference each other).
Content is the five names/credentials/quotes given verbatim.

**Decision — button hrefs externalized.** `EXTERNAL_APP_URL`
(`https://app.aidoctor.study`) and `PRO_CHECKOUT_URL` (the Gumroad link) are
new exported constants in `data/mocks/home.ts`. Every "Start for Free"/"Start
Free Trial" *link* now points at `EXTERNAL_APP_URL`; About's second action
("See Pricing") points at `PRO_CHECKOUT_URL`. **One exception, on purpose:**
Contact's form *submit* button was relabelled "Send Message" instead of
"Start Free Trial" — it's a `<button type="submit">` that posts to
`/api/contact`, not a link, and giving it the same label as the externally-
linking buttons while it does something completely different would be
confusing, not just redundant. The Services section's `id` moved from
`services` to `features` so `#features` (used by the nav and by "See Pro
Features"/"Explore Features") resolves to something real, rather than adding a
second id to the same element.

**Decision — new `SiteFooter`** (`components/common/footer/site-footer.tsx`),
mounted as a sibling of `<main>`, not inside it — it's its own landmark, not
page content. Links to `/terms`, `/refunds`, `/cookies`, `/privacy` as
requested; **none of those four routes exist yet** (verified: `/terms` 404s).
Building their legal content is unstarted, separate work — this ADR only adds
the links, it doesn't fabricate legal copy.

**Decision — cookie system updated in place, not replaced.** The project
already had a full `Cookie`/`CookieBanner`/`CookiePreferencesModal`/
`cookieStore` system with a granular preferences modal (analytics/marketing
toggles) — more capable than the spec's plain two-button ask, not less, so it
was kept and restyled rather than replaced:
- `STORAGE_KEY` renamed `cookie-consent-v1` → `aid_cookie_consent`, matching
  the spec. Old stored consent is orphaned, not migrated (consistent with how
  the DNA scene's `localStorage` key rename was handled in ADR-0022).
- **Bug fixed while touching this file:** `acceptAll()` was setting
  `analytics`/`marketing` to `false` — "Accept all" behaved identically to
  "Reject all". Now sets both `true`.
- Copy/labels updated to the spec's wording ("Accept All" / "Essential Only"),
  and both variants restyled onto the site's actual button tokens
  (`--action-primary*` / `--action-outline*`) instead of a generic
  foreground-inverted style.
- The banner's policy link moved from `/privacy-policy` (never existed) to
  `/cookies`, matching `SiteFooter`'s link and the spec's explicit ask.

**What was NOT done** (see decision 4): 3D hover effects, the 4-tier
performance/battery/FPS system, and the text-only fallback mode. `?perf=` /
`?textonly=` query-param testing hooks from the original spec don't exist
either, since the systems they'd test don't exist yet.

Related: [[design-system]], [[components/ui]], [[home-sections]],
[[dna-ink-scene]], ADR-0022, ADR-0023.

---

## ADR-0023 — ADR-0022's two-tone panels were unreadable; converted to a full dark theme

- **Status:** Accepted
- **Date:** 2026-08-17

**Context.** ADR-0022 scoped the AI Doctor Study re-theme to exactly six named
color tokens, on the letter of the request. That left `--background` bound to
`--raw-color-white` and `--foreground` to `--raw-color-black` untouched, while
`--surface-section` / `--surface-section-deep` (the Hero/Contact/About/Team
panel colour) went dark navy. Tested live: the Hero's own copy — eyebrow,
headline, description — sits directly on `--surface-section` with no explicit
text colour, so it rendered as **black text on a near-black panel**,
essentially invisible. The project owner confirmed this reads as broken, not
as an intentional two-tone design, and asked for a proper dark theme instead.

**Decision.** Converted to a single, fully coherent dark theme rather than
patching the one broken spot:

- `--background: var(--raw-color-mint-50)` (was `--raw-color-white`) —
  reuses the same dark-navy primitive as `--surface-section`, so Hero, Why and
  Services read as one flat dark canvas instead of dark-panel-on-white-page.
- `--foreground: var(--raw-color-white)` (was `--raw-color-black`).
- Every Tier 2 role that implicitly assumed "dark text on a light surface" was
  re-pointed in the same pass, not left to break silently:
  `--surface-glass/-subtle/-strong` (white-alpha → black-alpha, so frosted
  glass panels — header, floating chips, the Contact form card — stay
  legible against a dark page), `--border-subtle` (black-alpha-10 →
  white-alpha-12, so it's visible drawn *on* the dark page — the Hero divider,
  the Team slider's progress track), and `--foreground-muted` /
  `--foreground-subtle` (black-alpha → white-alpha, so de-emphasised copy dims
  white instead of darkening black).
- **One deliberate exception, not a bug:** the Services "lime" card
  (`CARD_VARIANT.lime`, `services.tsx`) keeps a light lime background by
  design (an accent card popping against the dark rail, same intent as the
  original Dantora design's lime card). It cannot inherit the new white
  `--foreground`, so it now carries an explicit
  `text-action-secondary-foreground`, and its internal list divider swapped
  from `bg-border-subtle` (now light, invisible on a light card) to
  `bg-action-secondary-border` — the token whose entire purpose is a border
  tone visible against the lime surface, already used for that card's own
  outer border.
- Added Tier 1 primitives: `--raw-color-white-alpha-40`,
  `--raw-color-black-alpha-60`, `--raw-color-black-alpha-90`. Removed
  `--raw-color-black-alpha-10` and `--raw-color-black-alpha-40`, which became
  unused once `--border-subtle` and `--foreground-muted` moved off them
  (verified with a repo-wide grep before deleting).
- `opengraph-image.tsx`'s hardcoded card colours (a Satori/`next/og` route,
  which can't consume CSS custom properties) were already flipped to dark
  under ADR-0022 and needed no further change.

**What did not change.** [[dna-ink-scene]]'s `bgColor` — still white/light,
for the same MULTIPLY-blending reason documented in ADR-0022: the scene would
otherwise erase its own helix, and fixing that would mean a shader/blend-mode
change, off-limits under hard rule #2. The canvas remains a visible light
rectangle inside the dark Hero/Contact panels; that trade-off stands from
ADR-0022 and was not part of what the project owner flagged as broken.

Related: [[design-system]], [[home-sections]], [[dna-ink-scene]], ADR-0022,
ADR-0019.

---

## ADR-0022 — Re-themed Dantora → AI Doctor Study; DNA scene keeps a light `bgColor`

- **Status:** Accepted
- **Date:** 2026-08-17

**Context.** The project was rebranded from the Dantora clinic template to AI
Doctor Study, an AI study companion for medical students. Scope was
deliberately narrow: brand name, copy, and six named color tokens
(`--raw-color-brand-500/900`, `--raw-color-lime-200/400`,
`--raw-color-mint-50/100`) — no layout, animation, spring config, or shader
changes ([[animation-system]], [[dna-ink-scene]] hard rules unaffected).

`--raw-color-mint-50/100` back `--surface-section` / `--surface-section-deep`,
the panel colour behind Hero, Contact, About and Team ([[design-system]] →
*Current theme state*). Swapping them to a dark navy (`#070d17` / `#0c1524`)
darkens those four panels, while `--background` itself (Why, Services, and the
page default) stays bound to `--raw-color-white` and was **not** part of the
requested swap — so the page is intentionally two-tone: dark Hero/About/Team/
Contact panels against white Why/Services bands. This was a deliberate, scoped
choice — see the two `AskUserQuestion` decisions this ADR is based on: (1)
widen the desktop nav pill (`w-fit`, was a Figma-exact `w-[26.375rem]`) rather
than drop or shrink the 5th nav label, and (2) confirmed live with the project
owner that this two-tone panel split, not a full dark re-theme, is what "change
only these tokens" meant.

**The harder conflict: the DNA Ink scene's `bgColor`.** [[dna-ink-scene]]
documents that its ink/helix clouds use `THREE.MultiplyBlending` and **only
read on a light backdrop** — on a dark `bgColor` they have nothing to darken
and visually vanish, and there is no additive-bloom fallback (that would be a
shader change, off-limits under hard rule #11/ADR-0018's scope). The scene's
own `config.ts.bgColor` used to equal `--raw-color-mint-50` by convention (both
were the same "paper" colour), so darkening mint-50 would have silently broken
the scene's centrepiece animation.

**Decision.** `DNA_INK_CONFIG.bgColor` stays **white** (`#ffffff`), decoupled
from `--raw-color-mint-50`. Only the scene's hue fields — `helixColorA/B`,
`inkCore/Mid/Edge`, `atmoColor`, `flameColor/2` — shifted to a cyan/sky family
matching the new `#0ea5e9` brand colour. The trade-off, confirmed with the
project owner: the canvas now sits as a visible light rectangle inside the
dark Hero/Contact panels rather than blending seamlessly, in exchange for the
helix staying fully visible and untouched mechanically.

**Consequences.**
- `src/lib/site.ts`'s `brand.mint` (used by `opengraph-image.tsx`'s card
  background) went dark, which also required flipping that route's hardcoded
  text colour from `#000000` to `#ffffff` — a literal, not a token, because
  Satori/`next/og` can't consume CSS custom properties.
- The DNA Ink `localStorage` tuning key moved from `dantora:dna-ink` to
  `ai-doctor-study:dna-ink` (`dna-ink-controls.config.ts`) — old stored
  overrides are simply orphaned, not migrated, consistent with
  `readStoredConfig`'s existing "drop unknown/stale" behaviour.
- JSON-LD `@type` moved `MedicalClinic` → `EducationalOrganization`
  (`structured-data.ts`) to match the new business.
- Section anchor ids (`#hero`, `#why`, `#services`, `#about`, `#team`,
  `#contact`) and component/file names (`WhyDantora`, `why-dantora.tsx`, the
  `/assets/Why Dantora/…` and `/assets/Our Team/…` image folders) were **left
  unchanged** — renaming them touches no visible copy and risked breaking
  image paths for no user-facing benefit.

Related: [[design-system]], [[dna-ink-scene]], [[home-sections]], ADR-0018,
ADR-0019.

---

## ADR-0021 — Page readiness is gated by components, not by `window.load`

- **Status:** Accepted
- **Date:** 2026-08-10

**Context.** The preloader originally treated `window.load` +
`document.fonts.ready` as "the page is ready". Both fire early relative to what
the visitor actually sees: `window.load` accounts for the document's own
subresources and nothing else. The hero's centrepiece — [[dna-ink-scene]] — is a
`dynamic({ ssr: false })` import fetched *after* hydration, so it is invisible to
that signal. Measured: the curtain was gone at **982 ms**, before `three` had
been downloaded, let alone before a frame was drawn. Any future heavy leaf (a
video, a large decoded image, a second scene) has exactly the same problem.

**Decision.** Readiness is **contributed**, not inferred. `PreloadProvider`
exposes `registerGate()`; a component that must be on screen before the reveal
claims a gate in an effect and releases it when genuinely ready. `loaded`
requires the document signals *and* an empty gate set *and* a `MIN_DURATION_MS`
floor.

Three rules make it safe, and each exists because the naive version fails:

1. **Claim eagerly, release late.** The gate is claimed in the eagerly mounted
   wrapper (`LazyDnaInk`), not inside the lazy chunk — by the time that chunk
   loads the preloader may already have finished. It is released from the first
   *drawn frame*, not from mount, because a live GL context with nothing on
   screen is the exact state being hidden.
2. **Opt in per instance.** Gating is a prop (`gatesPreload`), not automatic. An
   off-screen instance never renders, so an automatic gate would never resolve —
   the Contact scene would hold the curtain until the timeout.
3. **Always have a ceiling.** `GATE_TIMEOUT_MS` (6 s) lifts the curtain
   regardless. A failed chunk or a refused WebGL context must degrade to a
   slightly late reveal, never to a permanently opaque page.

**Consequences.** Readiness is honest but no longer knowable from one place —
what the curtain waits for is the sum of whoever claimed a gate. The timeout is
the backstop that keeps that from being dangerous. Cleanup must release the gate
(return the releaser as the effect's cleanup), or an unmounted component strands
the curtain. The releaser is idempotent so a double call is harmless.

**Alternatives rejected.** A fixed delay — dishonest in both directions, too
short on a cold connection and pure dead time on a warm one. Gating on the lazy
chunk's `import()` promise — resolves when the module is *parsed*, which is still
several hundred milliseconds before anything is drawn.

---

## ADR-0020 — One layout breakpoint; the adaptive grid is desktop-only

- **Status:** Accepted
- **Date:** 2026-08-10
- **Amends:** ADR-0019

**Context.** ADR-0019 recorded that the page did not reflow and that the
sub-640 breakpoint was inherited guesswork, pending a mobile Figma frame. That
frame still does not exist, but tablet and mobile were requested anyway — so the
small-screen layout is **our design decision**, not a port.

**Decision.**

1. **`lg` (1024px) is the only layout breakpoint.** Above it, the Figma
   composition — absolutely positioned at the artboard's coordinates. Below it,
   an ordinary flow layout. Two layouts, not a spectrum: intermediate
   breakpoints would mean inventing intermediate designs.
2. **Sections are authored in mobile DOM order.** Absolute positioning ignores
   document order, so the desktop composition is reconstructed with `lg:`
   offsets rather than the markup being written desktop-first and reordered
   with `order-*`. The cost is that stacking becomes explicit — the hero copy
   needs `z-10` because the scene's canvas now follows it in the DOM.
3. **The adaptive grid is scoped to 1024–1440 (plus scale-up above).** Its 1024
   and 360 bases were actively harmful: an 820px tablet computed a 12.6px root
   while a 500px phone computed 21.6px — *smaller text on the larger device* —
   with a discontinuity at every edge. Proportional root-font scaling only earns
   its keep where the layout is absolutely positioned; a flow layout reflows on
   its own. Below `lg` the root is a plain 16px.
4. **The scroll choreography is kept at every breakpoint.** It shipped
   desktop-only for one revision on the argument that hijacking scroll is
   hostile on touch; that was reverted by request, and the argument was weaker
   than it looked — nothing in the Services scrub or either overlay calls
   `preventDefault`. Each is a pure function of scroll position, so the page
   scrolls normally and no gesture is taken. Only sizing is responsive. Note
   the Services runway and About's `-mt-[100lvh]` are a matched pair.
5. **Small screens still drop what genuinely costs.** Contact's second WebGL
   scene is not mounted below `lg`, the header nav moves into a burger panel,
   and the header's pill CTA is desktop-only — collapsed to a bare arrow disc it
   read as a broken control.

**Consequences.**

- The small-screen layout is **unreviewed against any design**. When a mobile
  frame arrives, expect the `lg:`-prefixed values to stay and the base classes
  to be replaced wholesale.
- Any new section must be written mobile-first and pinned with `lg:`, or it will
  silently only work on desktop.
- ADR-0019's "no mobile design → nothing reflows" consequence is superseded;
  its 1440-base and light-only-theme decisions still stand.

---

## ADR-0019 — One 1440 design base, scaled fully proportionally; light-only theme

- **Status:** Accepted
- **Date:** 2026-08-10

**Context.** The Dantora UI arrived as a **single** Figma frame — "Concept 4",
1440 × 5005, desktop only. The brief asks for identical proportions to Figma on
every screen. The starter's adaptive grid already scales a rem-based layout by
driving the root font-size, but it shipped configured for a 1920 design base and
damped the scale-up above it (`coef: 0.6666`).

**Decision.**

1. **1440 is the only desktop base.** The `{ maxWidth: 1920, baseWidth: 1920 }`
   breakpoint is gone, and the `html` media query below 1440 is
   `1.111111vw` (`16 × 100 / 1440`). There is no 1920 entry because there is no
   1920 design — inventing one means inventing a layout nobody drew.
2. **`GRID_SCALE_COEF = 1`.** Above 1440 the scale-up is now fully
   proportional rather than damped, because "the same proportions as Figma" is
   the explicit requirement. The starter's damping exists to stop a design
   ballooning on ultra-wide monitors; that trade is off here. Verified: at a
   2560 viewport the root font-size is 28.44 px — exactly `16 × 2560 / 1440`.
3. **Light-only theme.** The `prefers-color-scheme: dark` block is removed
   rather than extended. The page's whole visual identity is a MULTIPLY-blended
   point cloud on a mint surface: the clouds *darken* the backdrop, so on a dark
   `--background` they have nothing to darken and the scene disappears. A dark
   variant is a design problem, not a token override.
4. **Google Sans Flex replaces Onest**, with `GRAD`/`ROND`/`wdth` requested
   explicitly — the mockup pins all three.

**Consequences.**

- ~~**There is no mobile design.** …the sub-640 breakpoint is a guess.~~
  **Superseded by ADR-0020**, which adds a small-screen layout and scopes the
  adaptive grid to the desktop range. There is still no mobile Figma frame; the
  layout below `lg` is our design decision.
- Any future dark mode must start from the scene, not from `globals.css`.

---

## ADR-0018 — Port the DNA Ink sketch as a lib/component split, minus its dead passes

- **Status:** Accepted
- **Date:** 2026-08-10

**Context.** The scene arrived as a single self-contained `dna-ink.html` — an
import-map three.js sketch with a `CONFIG` object, inline GLSL, a `localStorage`
-backed slider panel, and a `render()` driving three `EffectComposer`s. It had to
become part of this Next.js project, with no HTML file left behind.

**Decision.**

1. **Split framework-free engine from React leaf.** `src/lib/scene/dna-ink/`
   holds `config.ts` / `shaders.ts` / `scene.ts` and imports nothing from React;
   `src/components/scene/dna-ink/` mounts it. Two new folders, mirroring the
   `lib/scene/` path [[optimize-3d-scene]] already sanctions. The alternative —
   one big `"use client"` component — would have put ~400 lines of GPU plumbing
   behind a React boundary and made the config unreachable from anywhere else.
2. **`CONFIG` becomes a typed module, not component props.** Hard rule #4 bans
   hardcoded values; a `DnaInkConfig` interface with one field per tunable makes
   the whole look editable from one file and type-checked at the call site.
3. **Delete the two bloom composers.** The sketch built `torusComposer` and
   `bloomComposer`, then assigned their render targets to `finalPass` uniforms
   (`torusTexture`, `bloomTexture`) that the final fragment shader — a one-line
   `tDiffuse` passthrough — never samples. Three full scene renders and two
   `UnrealBloomPass`es per frame, all discarded. Removing them is
   **visually lossless**: the on-screen image was always `finalComposer` alone.
   The passthrough `EffectComposer` is *kept* rather than collapsed to a bare
   `renderer.render()`, so the render-target path (and therefore the exact
   rasterisation, MSAA included) is unchanged and bloom can be reinstated.
4. **Clamp the pixel ratio (`maxPixelRatio: 2`).** The only deliberate visual
   deviation. The sketch used the raw `devicePixelRatio`; at 3× that is 9× the
   fragments for ~47 k overlapping point sprites. It is a config field, not a
   constant, so reproducing the sketch is a one-line change.
5. **Keep the debug panel, but gate it and make its output paste-ready.**
   Initially dropped — a UI that silently overrides the committed config from a
   previous session is a trap — then reinstated on request, with the trap closed
   three ways: it renders only when `controls` is true (default: development
   builds), `readStoredConfig` validates every restored key against the current
   shape, and its snapshot emits real `config.ts` source so a tuning session
   ends by committing the values rather than leaving them in `localStorage`.
   Panel chrome is tokenised under `--debug-*` and deliberately not themed —
   it floats over an arbitrary scene and must stay legible in both schemes.
   The scene gained `applyConfig()` for this: uniform writes only, debounced
   120 ms for the four settings that reallocate buffers, so a slider drag never
   remounts the canvas or drops the GL context.
6. **Modern `three` (`0.185`), not the pinned `0.143`.** `WebGL1Renderer` was
   removed in r163 → `WebGLRenderer`. Colour handling is unaffected: every
   palette colour goes through the sketch's own `hexToVec3`, and the custom
   shader passes carry no `<colorspace_fragment>` include, so nothing is
   re-encoded. Shipping a four-year-old three in a fresh Next 16 project was the
   worse trade.

**The one upgrade trap, and why it is invisible in code review.** r143 supported
`MultiplyBlending` on a non-premultiplied material via
`blendFunc(ZERO, SRC_COLOR)`. Modern `WebGLState` **deleted that branch**: it
logs *"MultiplyBlending requires material.premultipliedAlpha = true"* and then
sets **no blend function at all**, so the clouds inherit whatever state the
previous draw left behind. The port rendered — plausibly, even attractively —
while silently losing the density accumulation that makes overlapping dye go
dark, which is the entire ink-in-water effect. Setting
`premultipliedAlpha: true` restores it exactly: the premultiplied path is
`blendFuncSeparate(DST_COLOR, ONE_MINUS_SRC_ALPHA, ZERO, ONE)`, which reduces to
`dst * src` because every fragment in these shaders writes `alpha = 1.0`.
**Lesson for the next port: a scene that renders is not a scene that is
correct — read the console, and diff against the original side-by-side.**

**Consequences.**

- `three` is now a project dependency ([[tech-stack]]), and the
  [[optimize-3d-scene]] routing rule (hard rule #11) is permanently live — every
  performance request on this project must go through the skill.
- The scene subscribes to the shared ticker (ADR-0009); it does not start a
  second `requestAnimationFrame`.
- Not yet done, and deliberately left for a real optimisation pass: device
  tiering (§2), loader prewarm (§3), in-view gating (§4), the bot poster (§1).
  The port is faithful first; §14 says measure before cutting.

---

## ADR-0017 — A skill states its preconditions and its own internal conflicts

- **Status:** Accepted
- **Date:** 2026-07-24

**Context.** `optimize-3d-scene` (ADR-0016) was run for the first time on a real
scene outside this repo — a raw WebGL project, no three.js, no scroll. The fix
order held up; what cost hours was everything the skill left implicit. Ranked by
time burned:

1. **§0 could not be executed at all.** `renderer.info.render` /
   `.programs.length` exist only on `THREE.WebGLRenderer`, yet the skill's own
   title says "three.js / WebGL". The agent had to invent instrumentation before
   it could take a baseline.
2. **The measurement environment was never stated**, and all three failure modes
   fired: dev-mode numbers are invalid (eager chunk serving faked a §1 failure;
   Strict Mode's double-mount faked 2 listeners and a halved frame rate), a
   stale `next start` on the port served 500s that read as a code bug, and
   `waitUntil: "networkidle0"` never fires against `next start`.
3. **§1 actively breaks §3.** `dynamic(ssr: false)` means the scene cannot
   compile until after hydration; on Regular 3G + 4× CPU programs linked at
   5.0 s against a loader that lifted at 2.36 s. Two correct steps, silently
   contradicting each other.
4. **§3's stall list was GPU-only** — all four causes shader/texture/target —
   but the worst stall measured was a 3.9 s main-thread CPU decode. Workers
   appeared nowhere in the skill.

Plus four smaller ones: the `as="fetch"` preload credentials trap (only
`use-credentials` + `include` dedupes; the other pairings silently
double-download), §5's `1000/30` actually measuring ~26 fps because of how the
ticker throttles, §7's "cut the sparse end" having no lever on a *baked* point
buffer, and §13's `lvh` being read as applying to the layout when it is for the
canvas only.

**Decision.** Fold all of it back into the skill, and adopt two rules for how
this and every future skill is written:

- **A step states its preconditions.** §0 now ships a `getContext` hook that
  gives a raw WebGL scene the counted equivalents of `renderer.info`
  (`draws` / `verts` / `links[]` timestamps / captured `attrs`), and a
  *measurement environment* block: production build, kill the old server first,
  `waitUntil: "load"`, and — because SwiftShader is not a GPU — only counted
  quantities transfer, never absolute fps.
- **A step names where it fights another step.** §3 now carries the §1 conflict
  explicitly, with the measurement that exposes it (link timestamps vs handoff
  time) and the fix (preload the data from the HTML; gate the loader on
  scene-ready, not on a duration).

Also added: §3 gains a fifth stall cause (CPU decode → Worker, with
transfer-in-both-directions) and the preload-credentials warning; §5 states the
~26 fps reality; §7 requires a decile ordering check before truncating a baked
buffer; §13 splits canvas `lvh` from content `dvh`; §1's poster is rejustified
(crawler screenshots and the no-WebGL fallback — *not* layout stability) with
two crops for tighter-axis framing and the `headers()` → `○`→`ƒ` prerender
trade-off named.

**Consequences.** The skill now works on a scene with no three.js in it, and its
first section can be executed instead of merely read. The cost is a longer §0 —
an agent must build instrumentation and a production build before touching
anything — which is the correct tax: every number the skill asks for later is
worthless without it. Deliberately kept unchanged, because the field run
confirmed them: the cheapest-first ordering, the canonical-file table, and
"don't invent new shapes; port these" — the `device.ts` port dropped in clean
and is most of why that run went as fast as it did.

---

## ADR-0016 — Skills are registered in the vault, not just dropped in `.claude/`

- **Status:** Accepted
- **Date:** 2026-07-24

**Context.** The first Claude Code skill for this starter —
`optimize-3d-scene` — arrived as a folder under `.claude/skills/`. A skill there
is discoverable to Claude Code *at runtime*, but it is invisible to the vault:
nothing in `obsidian/` said it existed, when to reach for it, or how it relates
to the hard rules. That contradicts ADR-0006 (the vault is the single source of
truth) and leaves the invocation decision to model judgement — exactly the kind
of thing this project pins down in writing. A performance request on a
scene-carrying project would otherwise get whatever fix order the agent invented
that day, when the skill exists precisely because the order matters (audit →
bot path → tiering → prewarm → visibility gate → budgets → fill).

**Decision.** A skill is only "installed" once it is registered:

1. The skill lives at `.claude/skills/<name>/`.
2. A vault note under `workflows/` documents what it does, its trigger
   conditions, and how it maps onto this project's primitives.
3. It is linked from [[README]]'s Map of Content and from the skills table in
   [[ai-agent-guide]].
4. If invocation should be non-optional, the routing rule goes into AGENTS.md's
   hard rules — the shim every agent reads first.
5. It is logged in [[changelog]].

For `optimize-3d-scene` this became **hard rule #11**: a performance / jank /
pre-ship request **and** a three.js or WebGL scene in the project → invoke the
skill and follow its order. The vault note [[optimize-3d-scene]] additionally
maps the skill's canonical patterns (which reference an external workspace) onto
what the starter already ships — the shared ticker (ADR-0009) for its one-rAF
rule, `isBot()` (ADR-0010) for its bot path, the Lenis store for scroll, the
in-view hooks for its render gate — so following the skill does not produce a
second copy of infrastructure that exists.

**Consequences.** Skill invocation becomes a documented rule rather than a guess,
and the routing survives model, tool and session changes because it lives in
AGENTS.md and the vault, not only in the skill's own `description`. The cost is
one extra note plus two index edits per skill — the same tax every component and
hook already pays. The starter still ships **no `three` dependency**
([[tech-stack]] unchanged); rule #11 is dormant until a project adds one. A
wrong vault path inside the skill (`obsidian/Meta/…`, plus an `open-questions.md`
this vault does not have) was corrected as part of registering it — registration
is also the moment a skill gets checked against reality.

---

## ADR-0015 — Strict three-tier design-token naming convention

- **Status:** Accepted
- **Date:** 2026-07-17

**Context.** ADR-0004 made tokens the styling currency but never said what a token
should be *called*. The starter shipped two tokens (`--background`,
`--foreground`) and no grammar, so every project built from it would invent its
own — defeating the point of a shared starter, since an agent moving between
projects could not predict a token name without reading `globals.css`. Reference
taken from [Mavik Labs — *Design Tokens in Tailwind v4*](https://www.maviklabs.com/blog/design-tokens-tailwind-v4-2026/)
(three tiers: primitive → semantic → component).

**Decision.** Adopt the three-tier model with an explicit grammar, documented in
[[design-system]] and codified as AGENTS.md hard rule #4:

| Tier | Grammar | Lives in |
|------|---------|----------|
| Primitive | `--raw-<category>-<name>[-<shade>]` | `:root` |
| Semantic | `--<role>[-<variant>][-<state>]` | `:root` |
| Component | `--<tw-namespace>-<component>[-<property>]` | `@theme inline` |

- Only Tier 1 holds literals; Tier 2 names purpose, never appearance; Tier 2 is
  the themeable layer (dark mode overrides there). No tier may be skipped.
- Every `@theme inline` entry is exactly `--<namespace>-<role>: var(--<role>)`.
  `inline` is load-bearing — it inlines the `var()` into each utility so Tier 2
  overrides cascade; binding a literal freezes the value and breaks theming.
- Tier 3 stays rare by design (ADR-0012 prefers a React component).

**Two deliberate deviations from the reference article**, both verified against
`tailwindcss` v4.3.3 by compiling a probe stylesheet:
1. The article names primitives `--color-blue-500`. We prefix them `--raw-*` and
   keep them out of `@theme` — under Tailwind v4 a `--color-*` entry *generates
   utilities*, so naming primitives that way would emit a `bg-blue-500` for every
   raw value and let markup bypass the semantic tier.
2. The article lists `--duration-fast` / `--duration-normal` next to `--ease-*`.
   **There is no `--duration-*` namespace in Tailwind v4** — the probe confirmed
   `duration-fast` compiles to nothing and the variable is not even emitted from
   `@theme inline`. Durations therefore stay Tier 2 only, consumed as
   `duration-[var(--duration-fast)]`. (`--ease-*` *is* a real namespace and is used.)

Retrofit is **minimal and unopinionated**: the existing background/foreground
tokens were restructured into the tiers, and the primitives/durations/`--ease-entrance`
/`--leading-display` they imply were added. **No brand palette was invented** —
the convention is the deliverable; projects add `--raw-color-brand-*` themselves.

**Consequences.** Token names are now predictable across every project from this
starter. This **amends ADR-0004**, which said only that new values go in
`globals.css` first — they must now also follow the tier grammar. `globals.css`
grew a documented tier structure but stays bounded (ADR-0012). Existing markup is
unaffected: `bg-background` / `text-foreground` still resolve, since the Tier 2
names and `@theme` bindings kept their public names.

---

## ADR-0014 — Narrow CSS-transition exception for trivial state changes

- **Status:** Accepted
- **Date:** 2026-07-17

**Context.** ADR-0002 banned CSS transitions outright to force every motion
through the spring layer. In practice the ban's cost lands hardest where its
benefit is lowest: a nav link fading its colour on hover had to become a client
component wrapping `<Hover>` with a spring config, to animate one property that
no user will ever interrupt or perceive as physical. The rule pushed teams toward
either boilerplate or quiet rule-breaking.

**Decision.** Keep hard rule #1 for all real motion; carve out one narrow,
condition-bound exception. CSS `transition-*` is allowed **only** for simple,
discrete state changes — `hover:` / `focus-visible:` / `active:` colour, opacity,
border-colour, underline, and small decorative nudges — subject to three
conditions, all required:

1. **Token-backed timing** — `duration-[var(--duration-fast)] ease-entrance`; raw
   ms/cubic-bezier values remain banned by hard rule #4.
2. **`transition-*` only** — `@keyframes` stay banned outright. Anything long
   enough to need keyframes is long enough to deserve a spring.
3. **Utilities only** — the transition lives in `className`, never in a CSS file
   (ADR-0012).

Everything scroll-driven, revealing, layout-affecting, staggered, orchestrated,
or interruptible remains spring-based; text remains [[text-engine]]. Anything
past the allowed list is `<Hover>`.

**Consequences.** A hover colour change no longer needs a client component — the
common case gets cheaper and the spring layer keeps the cases it is actually good
at. This **amends ADR-0002**, whose "CSS transitions are banned" is now "CSS
keyframes are banned; transitions are limited to the list above". The exception is
deliberately narrow and enumerated rather than a judgement call ("simple
animations") so it cannot erode into general CSS animation. `--raw-duration-*` /
`--duration-*` / `--ease-entrance` tokens exist to serve it (ADR-0015).
[[animation-system]], [[design-system]], and [[ai-agent-guide]] updated to match.

---

## ADR-0013 — `<Inview>` self-observe fix; spring components honour resize

- **Status:** Accepted
- **Date:** 2026-06-07

**Context.** `<Inview>` only animated when an external `trigger` ref was passed.
Without one it never revealed. Root cause: `useDynamicInView` returns its target
attachment as a **callback ref** (`setNode`) in the first tuple slot, but
`in-view.tsx` destructured it as `inViewRef` and wrote `inViewRef.current = node`
in the JSX `ref` callback — assigning `.current` to a function instead of calling
it. `setNode` never ran, the observed `node` stayed `null`, and with no `trigger`
the observer had nothing to watch (`trigger?.current ?? node` → `null`). With a
`trigger` it worked only because `trigger.current` bypassed the dead `node` path.
TypeScript flagged this at build time (`Property 'current' does not exist on type
'TargetRefCallback'`), so the build was already failing.

Separately, `<Inview>`, `<Spring>`, and `<Hover>` tracked `width`
(`useWindowWidth()`) as a `useMemo`/`useEffect` dependency to re-evaluate mobile
gating on resize, but never passed it to `isMobileDisabled()` — so the value was
genuinely unused (ESLint `react-hooks/exhaustive-deps` warning) **and** resize
re-evaluation silently did nothing; the check always read `window.innerWidth` at
call time.

**Decision.** This is the second authorized edit to the `#do-not-modify` engine
(after ADR-0009). Two corrections:
1. In `in-view.tsx`, call the callback ref — `setInViewNode(node)` — instead of
   assigning `.current`, so the component observes itself when no `trigger` is
   given.
2. Pass the React-tracked `width` into every `isMobileDisabled(value, width)`
   call across `in-view.tsx`, `spring.tsx`, and `hover.tsx`. This is the
   documented second parameter of `isMobileDisabled` and makes the `width`
   dependency meaningful, fixing resize re-evaluation and clearing the lint
   warnings.

**Consequences.** `<Inview>` now works standalone (the common case). `yarn build`
and `yarn lint` are both clean (0 errors, 0 warnings). The springs folder remains
`#do-not-modify` by default — these were explicitly signed-off bug fixes.

---

## ADR-0012 — Styling lives in utilities and components, not `globals.css`

- **Status:** Accepted
- **Date:** 2026-05-22

**Context.** ADR-0004 made design tokens the styling currency and ruled that
"new values must be added to `globals.css` first." Combined with the
design-system guidance to *"extract repeated multi-class patterns to
`@layer components`"*, the path of least resistance for any repeated visual
pattern became a named class in `globals.css`. On an animation-heavy,
multi-section marketing site that grows the file without bound — a single
global stylesheet accumulating hundreds of component-specific classes that are
never deleted when their component is. The fix is a placement rule, not a
file-splitting trick: splitting `globals.css` into many files only spreads the
same bloat.

**Decision.** Styling follows a strict placement order; `globals.css` stays
bounded by design.

- One-off styling → **Tailwind utilities** in `className`. Nothing enters CSS.
- A repeated pattern with markup/structure/props → a **React component**
  (`components/ui/`), *not* a CSS class. This is the default answer to "this
  looks repeated" — e.g. an eyebrow label with a `::before` dot is an
  `<Eyebrow>` component, not a `.label-eyebrow` class.
- A repeated pure-utility combo with no structure → a Tailwind v4 `@utility`.
- `@layer components` is reserved **strictly** for what utilities and
  components genuinely cannot express: pseudo-elements (`::before`/`::after`),
  third-party DOM overrides (`!important` on library markup), complex
  descendant/state selectors.
- `globals.css` only ever holds: `@import`, tokens (`:root` + `@theme`), base
  element resets (`@layer base`), and the narrow `@layer components`
  exceptions above. If it grows past that, something was misplaced.
- CSS Modules were considered and **rejected** — a second styling mechanism
  for the rare bespoke-CSS case is not worth the extra mental model when
  motion is spring-based (no keyframes — ADR-0002) and utilities + components
  cover everything else.

**Consequences.** `globals.css` stays a few-hundred-line file indefinitely.
"Repeated thing" pressure now pushes toward React components — which the
project wants anyway. This **amends ADR-0004**: design *tokens* still go in
`globals.css` first, but component-specific *classes* no longer do.
[[design-system]] and [[component-conventions]] updated to match.

---

## ADR-0011 — API layer: `app/api` route handlers, secrets server-side

- **Status:** Accepted
- **Date:** 2026-05-22

**Context.** The starter had no API layer. It needs a convention for reaching
external services that keeps secret keys off the client and gives endpoints a
consistent shape.

**Decision.** External calls go through Next.js Route Handlers —
`src/app/api/<resource>/route.ts`:
- **The handler owns the work** — business logic, multiple upstream calls,
  filtering, and reading secret env vars all live in `route.ts`. No mandatory
  passthrough service layer; extract shared code only when genuinely reused.
- Secrets are safe in handlers because `route.ts` is never bundled to the
  browser. Secret env vars are **unprefixed**; `NEXT_PUBLIC_` only for
  browser-safe values.
- Every endpoint: validates input with `zod`, returns the `{ data }` /
  `{ error }` envelope via the shared `handle()` wrapper (`src/lib/api/`), runs
  on the Node runtime (not Edge).
- `src/env.ts` validates env with zod — `publicEnv` vs `getServerEnv()`.
- Client Components fetch via `apiFetch` (`src/lib/api-client.ts`), same-origin
  only. Render-time data is read in Server Components.
- Added `zod`. The example endpoint is `app/api/contact/route.ts`.
- Codified as **AGENTS.md hard rule #9**.

**Consequences.** A clear, secret-safe API convention (full note:
[[api-architecture]]). Server Actions were considered for mutations but
deferred — for now everything goes through `app/api`. The choice can be
revisited if forms need progressive enhancement. First server dependency
(`zod`) and first server-only env var (`CONTACT_ENDPOINT`) now exist.

---

## ADR-0010 — SEO & performance hardening

- **Status:** Accepted
- **Date:** 2026-05-21

**Context.** A review found gaps that would hurt a production marketing site:
`metadataBase` defaulted to `null` (relative OG/canonical URLs never resolved to
absolute — broken social previews); `themeColor` sat on the deprecated metadata
field; there was no `robots.txt`, `sitemap.xml`, or structured data; the
`next.config.ts` was empty; `ScrollLayout` leaked a `requestAnimationFrame`
loop; the home view was a top-level `"use client"` (violating hard rule #6);
and the animation-heavy starter ignored `prefers-reduced-motion`.

**Decision.**
- **Site config.** `src/lib/site.ts` (`siteConfig`) is the single source of
  truth for SEO, fed by `NEXT_PUBLIC_SITE_URL` (fallback `http://localhost:3000`).
- **Metadata.** `metadataBase` is always set; `themeColor` moved to a
  `generateViewport()` / `viewport` export; dead `keywords` / `other` tags
  dropped; OG dimensions corrected to match the asset.
- **Crawlability.** Added `app/robots.ts`, `app/sitemap.ts`, and a JSON-LD
  `Organization`+`WebSite` helper rendered once in the root layout.
- **App Router files.** Added `loading.tsx` (enables streaming), `error.tsx`,
  `not-found.tsx`.
- **Rendering.** `HomeView` is a Server Component; client-only animation moved
  to the `HomeShowcase` leaf — models hard rule #6 instead of breaking it.
- **Reduced motion.** `<ReducedMotion>` calls react-spring's `useReducedMotion`,
  toggling the global `skipAnimation` — one app-root mount covers every spring
  and `spring-text-engine`. Chosen over per-component handling for its reach.
- **Build config.** `next.config.ts` now sets `removeConsole` (prod),
  AVIF/WebP, `next/image` breakpoints aligned to the adaptive-grid widths, and
  `poweredByHeader: false`. React Compiler is left as a documented opt-in (needs
  `babel-plugin-react-compiler`).
- Fixed the `ScrollLayout` Lenis rAF leak (cancel on unmount).

**Consequences.** Social/SEO metadata is correct in production once
`NEXT_PUBLIC_SITE_URL` is set. The first project env var now exists (see
[[environment-variables]]). `isBot()` stays available but is discouraged — it
opts routes out of static rendering; reduced-motion is the preferred lever (see
[[seo-metadata]]). React Compiler remains opt-in pending a dependency install.

---

## ADR-0009 — Shared animation ticker; authorized engine performance refactor

- **Status:** Accepted
- **Date:** 2026-05-21

**Context.** A performance review of the animation engine found load issues that
scale with the number of animated components on a page:
- `useLoop` started a **private `requestAnimationFrame` loop per hook instance** —
  N scroll-driven components meant N rAF loops, none of which ever stopped.
- `useWindowWidth` attached a **separate debounced `resize` listener per call** —
  one per spring component.
- `useDynamicInView` re-created its `IntersectionObserver` **on every render**
  (effect keyed on an unstable `options` object), and a dead `Proxy` branch
  created observers that were never disconnected.
- `useLoop`'s mount-only effect captured a **stale `onRender`**, so prop changes
  after mount were ignored.
All of this lives under `src/hooks/animation/` and `src/components/animation/springs/`
— `#do-not-modify` (ADR-0002).

**Decision.** With explicit user sign-off, apply a one-time performance refactor
to the protected engine, and introduce a shared, unprotected loop primitive:
- New `src/lib/animation/ticker.ts` — a single app-wide, reference-counted rAF
  loop (`subscribeToTicker`). It starts on the first subscriber, stops on the
  last, and throttles each subscriber independently. **Not** `#do-not-modify` —
  it is the supported extension point.
- `useLoop` now subscribes to the ticker and reads `onRender` / `framerate`
  through refs (fixes the stale-closure bug). Public signature unchanged.
- `useDynamicInView` rewritten without the `Proxy`: one observer, re-created only
  when the observed element or options actually change; exposes a callback ref.
- `use-window-size.ts` (not protected) now serves all three hooks from one
  debounced `resize` listener via `useSyncExternalStore`. The unused
  `debounceDelay` parameter was dropped.
- `mode="forward"` `scroll` listeners in `<Spring>` / `<Inview>` made `passive`.
- Hard rule #2 amended: the engine stays protected by default; changes require
  explicit sign-off.

**Consequences.** A page with N animated components now runs **one** rAF loop and
**one** resize listener instead of N of each, with no observer churn. Public
hook/component APIs are unchanged except `useWindowWidth`/`Height`/`Size`, which
no longer take a `debounceDelay` argument (no caller passed one). This **amends
ADR-0002's** do-not-modify scope.

A follow-up pass then cleared all 13 pre-existing ESLint problems in the engine
(also authorized): `isMobileDisabled` gained an optional `viewportWidth`
argument, missing `disableOnMobile` effect deps were added, a
`trigger.current`-in-cleanup hazard in `<Hover>` was fixed, `<Handle>`'s
transition effects were ref-stabilised, and `useProgressTrigger` now returns
`progress` as a `RefObject<number>` (no consumer affected).

---

## ADR-0008 — Adaptive scaling grid via root font-size

- **Status:** Accepted
- **Date:** 2026-05-21

**Context.** An adaptive scaling system was dropped into `src/components/common/`
to keep a rem-based design proportional across viewports. It shipped as a
`styled-components` implementation (`createGlobalStyle`, a `css` `media` helper,
`rm`/`em` helpers, plus `colors.ts` / `fonts.ts` / `utils.ts`). `styled-components`
is not a project dependency, and global CSS belongs in `globals.css` per ADR-0004.

**Decision.** Keep only the scaling behaviour; rebuild it to the project stack.
- **Scale down** (viewport ≤ largest breakpoint) — `vw`-based `html { font-size }`
  media queries in `globals.css`, inside `@layer base`.
- **Scale up** (viewport > largest breakpoint) — a `<AdaptiveGrid>` client
  component (`useAdaptiveGrid` hook) sets an inline `html` font-size at runtime,
  reusing the existing `useResizeLoop` render loop.
- Breakpoints live in `grid.config.ts` as typed config; the `globals.css` media
  queries mirror them and must be kept in sync (formula in both files).
- The dropped `styled-components` files were deleted, not committed.

**Consequences.** A rem-based layout now scales as one unit on every viewport.
`styled-components` stays out of the dependency tree. The breakpoint set is
duplicated across `grid.config.ts` and `globals.css` by design — the CSS-only
config rule (ADR-0004) forbids generating the media queries from JS.

---

## ADR-0007 — Automate the vault workflow with Claude Code hooks

- **Status:** Accepted
- **Date:** 2026-05-21

**Context.** The "read the vault first, follow the relevant guide, update the docs
after every change" workflow depended on the user reminding the agent each time.
Documentation drifts the moment it relies on memory.

**Decision.** Encode the workflow as Claude Code hooks in `.claude/settings.json`
(committed, team-wide):
- `SessionStart` — injects a pointer to read the vault first.
- `UserPromptSubmit` — on every request, reminds the agent to consult the relevant
  guide and to update docs for any change made.
- `Stop` — at the end of every turn, blocks **once** to confirm the vault was
  updated. A `${TMPDIR}` marker keyed by session id guarantees it blocks at most
  once per turn (no infinite loop).

**Consequences.** The documentation workflow is enforced without user prompting.
`.claude/settings.json` is now a tracked project file. Hooks are reviewable and
disableable via `/hooks`. New hooks take effect on the next session start (or after
opening `/hooks`). See [[ai-agent-guide]].

---

## ADR-0006 — The vault is the single source of truth

- **Status:** Accepted
- **Date:** 2026-05-21

**Context.** ADR-0001 left dense spec files (`project-specs.md`, `text-engine-docs.md`)
at the repo root alongside the vault, creating duplication — the same conventions
existed both as terse specs and as expanded vault notes, which would drift.

**Decision.** The vault is the **only** documentation source.
- `project-specs.md` — deleted; its content was already decomposed into the
  `architecture/` and `frontend/` notes (and `environment-variables.md`).
- `text-engine-docs.md` — moved into the vault as [[text-engine-reference]].
- `generic-layout-prompt.md` — moved into the vault (see ADR via [[changelog]]).
- Root keeps only thin shims: `AGENTS.md` carries the breaking-change warning and
  hard rules and points into the vault; `CLAUDE.md` and `.cursorrules` both
  `@`-import `AGENTS.md`.

**Consequences.** No documentation duplication. Agents bootstrap from `AGENTS.md`
and read vault notes on demand. This **amends ADR-0001** — root files no longer
hold canonical spec content.

---

## ADR-0005 — Use standard `next/link` for navigation

- **Status:** Accepted
- **Date:** 2026-05-21

**Context.** Two conflicting conventions existed: `project-specs.md` specified
standard `next/link` / `useRouter`, while `generic-layout-prompt.md` specified
custom `<AnimLink>` / `useAnimRouter()` wrappers. The custom wrappers were never
built.

**Decision.** Use standard Next.js navigation — `<Link>` from `next/link` and
`useRouter` from `next/navigation`. The `AnimLink` / `useAnimRouter` convention is
dropped. See [[routing]].

**Consequences.** `generic-layout-prompt.md` §5 updated to match. No animated-route-
transition layer exists; if one is needed later, revisit with a new ADR.

---

## ADR-0001 — Adopt an Obsidian vault as the project brain

- **Status:** Accepted — amended by ADR-0006
- **Date:** 2026-05-21

**Context.** Project knowledge was scattered across root markdown files
(`project-specs.md`, `text-engine-docs.md`, `AGENTS.md`). New contributors and AI
agents had no structured map of the system.

**Decision.** Introduce `obsidian/` as an Obsidian vault — a linked, navigable
second brain. Root spec files remain as machine-read sources; the vault expands on
them. See [[ai-agent-guide]].

**Consequences.** Docs must now be maintained alongside code. The vault is the
canonical place to *understand* the project; root files stay canonical for *tooling*.

---

## ADR-0002 — All motion is spring-based (`@react-spring/web`)

- **Status:** Accepted (inherited from starter) — amended by ADR-0014
- **Date:** Project baseline

**Context.** Marketing sites need rich, interruptible, physically natural motion.
CSS transitions and keyframes are rigid; competing libraries add weight.

**Decision.** Use `@react-spring/web` for every animation. A custom component layer
(`src/components/animation/springs/`) wraps it. CSS keyframes and `framer-motion`
are **banned**. CSS transitions were banned outright here; **ADR-0014 narrows that
to allow `transition-*` for trivial hover/focus state changes only.**

**Consequences.** All animation goes through the [[animation-system]]. The springs
folder is `#do-not-modify`. Text animation is delegated to [[text-engine]].

---

## ADR-0003 — Routes delegate to Views

- **Status:** Accepted (inherited from starter)
- **Date:** Project baseline

**Context.** Mixing routing concerns with page UI makes `app/` files heavy and hard
to test.

**Decision.** `app/**/page.tsx` files only import and render a component from
`src/views/`. All layout/UI logic lives in the view. See [[routing]].

**Consequences.** Every route is a 3-line file. Views are the real page components.

---

## ADR-0004 — Tailwind v4 with CSS-based config

- **Status:** Accepted (inherited from starter) — amended by ADR-0012 and ADR-0015
- **Date:** Project baseline

**Context.** Tailwind v4 removes `tailwind.config.js` in favour of CSS-native config.

**Decision.** All theme tokens live in `globals.css` under `:root` and `@theme inline`.
No JS config file. Raw values in class names are banned. See [[design-system]].

**Consequences.** Design tokens are the only styling currency. New values must be
added to `globals.css` first — and, per ADR-0015, must follow the three-tier
naming convention.
