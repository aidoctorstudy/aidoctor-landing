---
tags: [frontend, component, catalog, wip]
updated: 2026-08-10
---

# Catalog — Home page sections

The AI Doctor Study landing page — copy re-themed from the Dantora starter,
layout still the Figma frame "Concept 4" (node `1518:1970`). Assembled by
`src/views/home/index.tsx`; each section lives
in `src/views/home/sections/` — feature-specific, so **next to the feature**,
not in `components/` ([[folder-structure]]).

Copy comes from `src/data/mocks/home.ts` and reaches sections through props.
No component holds its own text.

## Status

| Section | Figma node | State |
|---------|-----------|-------|
| Site header | `1575:267` | ✅ built |
| Hero | `1558:307` · `1558:305` · `1574:602` · `1574:605` | ✅ built |
| Why Dantora (+ cursor image trail, app mockup) | `1558:320` | ✅ built |
| Services (horizontal scroll) | `1575:268` · `1574:680` | ✅ built |
| Live Demo | — (net new, ADR-0029) | ✅ built |
| About | `1575:273` · `1575:272` | ✅ built |
| Team | `1558:410` | ✅ built |
| Pricing | — (net new, ADR-0029) | ✅ built |
| Contact (plain closing CTA, overlays Team) | `1575:274` | ✅ built |
| Floating CTA | — (net new, ADR-0029) | ✅ built |

## The fix that mattered: cap-height text trim

Almost every text node in the mockup carries
`text-box-trim: trim-both; text-box-edge: cap alphabetic`. Figma measures those
boxes **from cap height to baseline**, not across the full line box. Dropping
that on import gave every block half-leading it was never designed with, and
the error compounded down the page:

| Element | Was | Figma | Now |
|---------|-----|-------|-----|
| Hero `h1` | 132 | 109 | 109 |
| Services `h2` | 132 | 109 | 109 |
| Pill button | 57 | 48 | 48 |
| Chip row | 108 | 94 | 92 |
| Header CTA | 81 | 54 | 54 |

`globals.css` now applies `text-box: trim-both cap alphabetic` in `@layer base`
to every text element, which fixes the vertical rhythm globally instead of by
hand-tuning padding per component. Inside a flex container the bare text node
is an anonymous flex item the base rule can't reach, so the `text-trim`
`@utility` exists for labels that need it explicitly — see `<Button>`.

## Responsive: two layouts, one breakpoint

`lg` (1024px) is the only layout breakpoint. Above it the page is the Figma
composition; below it, a flow layout.

> [!important] Markup is written in **mobile** order
> Absolute positioning ignores DOM order, so each section is authored as a flex
> column in reading order and the desktop composition is rebuilt with `lg:`
> offsets. That avoids a pile of `order-*` overrides — but it means the DNA
> canvas now sits *after* the hero copy in the DOM, so the copy carries an
> explicit `z-10`. Without it the scene paints over the heading at `lg`, which
> is exactly what happened on the first pass.

> [!important] The scroll choreography is kept at **every** breakpoint
> The Services scrub, the About overlay and the Contact overlay all run on
> touch too. They were desktop-only for one revision; that was reverted by
> request, and it is safe because none of them calls `preventDefault` — each is
> a pure function of scroll position, so the page still scrolls normally and no
> gesture is ever stolen. Only sizing is responsive.
>
> The Services runway and About's `-mt-[100lvh]` are a **matched pair**:
> disabling one without the other pulls About up over the section above it.

| Piece | Below `lg` |
|-------|-----------|
| Header nav | moves into `MobileMenu` — a burger panel with the same links plus the Start-for-Free and Login actions |
| Header CTA pills | hidden. Collapsing them to bare arrow discs read as a broken control; the burger carries both actions instead. |
| Contact's DNA scene | not rendered — a second WebGL context is a real cost on a phone, and the form is what matters on that screen |

> [!warning] The adaptive grid is desktop-only now
> It used to carry 1024 and 360 bases as well. That produced *smaller* text on a
> larger device: an 820px tablet computed a 12.6px root while a 500px phone
> computed 21.6px, with a jump at every breakpoint edge. Proportional scaling
> only earns its keep where the layout is absolutely positioned — below `lg` the
> flow layout reflows on its own, so the root is a plain 16px. See
> `grid.config.ts`.

## Sizing: full-viewport sections, proportional offsets

The artboard's screens are 1440×800 and read as **one screen each**, so Hero,
Why Dantora, the Services panel, Team and Contact are all `h-lvh`.

Inside them the two axes are measured differently, and mixing them up is what
caused every overflow so far:

| Axis | Unit | Why |
|------|------|-----|
| Horizontal | `rem` at the 1440 base | the adaptive grid scales rem with viewport width, so x-offsets and widths stay Figma-exact |
| Vertical | **% of the artboard's 800px** | a fixed rem height overflows a short viewport; `35.25%` is Figma's `y = 282` |

So the hero copy is `top-[35.25%]` (282/800), the divider `top-[78.625%]`
(629/800), the buttons `top-[89.375%]` (715/800). Only About keeps a rem height
— it is a scroll-through block, not a screen.

> [!note] Two places where the fixed header forces a deviation from Figma
> The hero copy sits at **28.55 %**, not the artboard's 35.25 %. Figma has no
> header over the hero's copy, so its spacing reads fine there; with the header
> fixed over every screen the gap above the eyebrow and the gap below the
> description came out visibly unequal (145 vs 133). 28.55 % balances them at
> 140/138. The Services deviation below has the same cause.

The Services rail sits at `top-[39%] bottom-10`. `top` is the knob for the gap
under the heading, and because the bottom gutter is pinned to match the sides,
pushing it down buys that room by shortening the cards — which is the intended
trade, not a side effect.

> [!warning] The fixed header costs Services 6% of the artboard
> Figma puts the Services heading at `y = 64` (8%), but the header only overlaps
> the *hero* on the artboard — here it is fixed over every screen and occupies
> the top 8.75%. The heading is therefore at 14%, with the rail at 34% and the
> cards at 56% height rather than Figma's 65%. This is a deliberate, documented
> deviation; the alternative is a heading permanently under the header.

## Section colours

In the original Dantora theme the Figma frame's own background was white, and
the mint was a *panel* colour painted by full-bleed rects inside each screen —
`1518:2115` (hero, `rounded-b-[48px]`), `1546:184` (services,
`rounded-t-[48px]`) and so on, with Why Dantora reading white between two mint
panels because it has no such rect.

As of the full dark re-theme (ADR-0023), `--background` and `--surface-section`
shared the same dark navy primitive (`#070d17`), so Hero, Why and Services read
as **one continuous dark canvas** with no seam at the rounded corner between
Hero and Why. ADR-0026 split them apart again: `--surface-section` (Hero,
Contact) moved to its own, slightly lighter primitive (`--raw-color-navy-800`,
`#10182a`) to narrow the *louder* seam against the DNA canvas's own `bgColor`
inside those two sections — reopening a faint seam at the Hero→Why boundary
as the traded-off cost. `--surface-section-deep` (`#0c1524`, node `1546:162`,
About/Team) still stands apart as its own step, reading as raised against the
block it slides over. `--foreground` flipped from black to white in the
ADR-0023 change; see [[design-system]] → *Full
dark theme* for the full list of roles that had to move with it (glass
surfaces, `--border-subtle`, `--foreground-muted/subtle`) and the one card that
deliberately opted out (the Services "lime" card, which keeps dark text on its
own light background).

## `CursorTrail` — the Why Dantora image trail

Ported from the "Recognize Yourself" block of
`flourish-with-laurin-textura.vercel.app` at the client's request, after reading
its implementation off the shipped bundle.

| Parameter | Value | Source |
|-----------|-------|--------|
| Spawn threshold | 90px of pointer travel | reference |
| Cards alive at once | 5 | bounded list; older entries are dropped |
| Tilt | random ±12° | reference uses `Math.random() - .5` |
| Enter spring | `tension 130, friction 28` | reference |
| Leave spring | `tension 300, friction 24` | reference — out is faster than in |
| Opacity spring | `tension 900, friction 40` | **not** the reference's numbers — see below |
| Transform | `translate(-50%,-50%) rotate(…) scale(…)` | reference |

> [!important] `useTransition`, not a recycled pool
> The first implementation kept a fixed pool of `useSprings` and re-fired the
> same entry, so nothing ever *left* — the tail merely faded in place. The
> reference pushes onto a capped list and lets items **exit**, which is what
> produces the dissolve at the far end. Position is frozen at spawn and only
> scale is animated, so a card grows where it was dropped rather than sliding
> toward the cursor.

> [!note] Opacity runs on its own, much stiffer spring
> In the reference the fade is barely perceptible — the readable motion is the
> scale. Sharing the soft enter/leave config meant every card spent its life
> half-transparent. `useTransition`'s `config` accepts a per-key function, so
> `opacity` gets `tension 900` while `scale` keeps the reference's values.

The copy above it carries `relative z-10`, so the cards pass behind the
heading. Touch pointers are ignored — there is no path to leave.

The Why section is `overflow-hidden`: a card spawned near an edge is otherwise
drawn over the hero above and Services below.

### `AppMockup` — the browser-chrome preview (ADR-0029)

`why-dantora.tsx` → `app-mockup.tsx`. Net new, no Figma node: a static (not
typing — that's Live Demo's job) browser-chrome card showing one Q&A, built
from the same card/glass tokens as the rest of the page rather than a
screenshot. `aria-hidden`, `pointer-events-none`, copy from
`WhyContent.mockup` (`AppMockupContent` in `data/mocks/home.ts`).

Positioned **top-right**, `hidden lg:block`, `top-24` (clearing the fixed
header) — not bottom-right, which is where it first shipped. `FloatingCta`
is fixed to that same corner site-wide, and this section is `h-lvh`, so a
bottom-10 mockup and the CTA collided the moment the CTA appeared (caught
live in-browser: the pill rendered on top of the mockup's last message). Any
future decorative element added to a full-viewport section should default
away from bottom-right for the same reason.

## `LiveDemo` — the scripted chat transcript (ADR-0029)

`live-demo.tsx` + `typing-cursor.tsx`, between Services and About. Net new,
no Figma node. A fixed, scripted metformin Q&A (`LIVE_DEMO_CONTENT` in
`data/mocks/home.ts`) that "types" itself in and replays every scroll pass
(`mode="always"`, this page's usual vocabulary).

**Letter-level, not word-level.** Every other heading/body reveal on this
page splits by word (`HEADING_MOTION`/`BODY_MOTION`, see *Text motion*
below) — a chat bubble needs the finer grain to actually read as typing.
Each message is its own `TextEngine` with `letterIn`/`letterOut`/
`letterStagger`, a bespoke config local to this file (not added to
`text-presets.ts` — it's a one-off, purpose-built for a typing cadence, not
a second general-purpose text preset).

**Sequencing without client state.** Each message's `delayIn` is a running
total of the *previous* messages' own `text.length × LETTER_STAGGER +
MESSAGE_GAP`, computed once per render from the static copy via a pure
`Array.reduce` — no `useState`, no timers. An earlier `let elapsed = 0`
accumulator reassigned during the map failed this project's
`react-hooks/immutability` lint rule (mutating an outer render-scoped
variable); the fix was a purely functional reduce building `{ list,
elapsed }` immutably.

**`TypingCursor`** — a small always-on blinking cyan bar after the
transcript, `@react-spring/web` `useSpring` with an async `to` chain
(`while (true) { await next({opacity:0}); await next({opacity:1}); }`) and a
hard-step easing (`(t) => t < 1 ? 0 : 1`) so it reads as a binary blink, not
a fade. Not `@keyframes` — hard rule #1 bans them outright even for
continuous decorative motion (design-system.md's ADR-0014 exception is
discrete state only); this is the same technique `MobileDnaFallback` uses
(see [[dna-ink-scene]]) and the same *kind* of bespoke-`useSpring` leaf as
`StatCounter`/`HeaderCta`.

> [!warning] `min-h-lvh` here is load-bearing, not just visual
> This section directly precedes About, and About *used to* ride over
> whatever came before it via `-mt-[100lvh]` — a trick that needs a tall
> scroll-scrubbed runway, not a content-sized block (see the *Scroll
> choreography* warning below). The actual fix was removing that trick from
> About entirely; `min-h-lvh` here just keeps this section's own rhythm
> consistent with Hero/Why/Team/Contact and is safe to change independently
> now that About no longer depends on it.

## `Pricing` — Free / Pro (ADR-0029)

`pricing.tsx`, between Team and Pricing. Net new, no Figma node. Two cards
from one internal `PlanCard`, content from `PRICING_CONTENT`
(`data/mocks/home.ts`, `PricingPlan[]`). Pro carries `plan.highlighted`:
the `--glow-accent` token (`globals.css` — Tier 1 `--raw-shadow-glow-accent`
composed from the existing `--raw-color-brand-alpha-40` primitive, Tier 2
role `--glow-accent`) and a `plan.badge` pill ("Most Popular").

`z-20` + `bg-background` on the section — see the *Scroll choreography*
table above: Pricing sits directly after the sticky Team rail and needed the
same treatment Contact already had, or Team bled through underneath it.

> [!note] Pro has no CTA button at all now (ADR-0039, supersedes ADR-0031)
> ADR-0031 gave Pro a `cta.href` of `APP_URL` plus an explanatory `note`
> ("no auth-gated Gumroad redirect yet"). Both were removed outright per a
> direct request to drop every "Get Pro" button site-wide — `PricingPlan.cta`
> is now optional (`cta?: CtaLink`), and `PlanCard` only renders the
> `<Button>`/`note` block when `plan.cta` is set. Free's card is unaffected.
> `CONTACT_CONTENT.actions` lost its own separate "Get Pro" entry the same
> way — Contact now renders one button. If a real post-auth checkout flow
> ever ships, that's a new CTA to design, not a revert of this note.

## `FloatingCta` — the scroll-triggered pill (ADR-0029)

`components/common/floating-cta.tsx` — `common/`, not a section file, since
it's site-wide chrome mounted once in `home/index.tsx`, outside `<main>`.
Fixed bottom-right, content from `FLOATING_CTA` (`data/mocks/home.ts`).

Same `@react-spring/web` fade-and-lift technique as `HeaderCta` (opacity +
a `translate3d`, `pointer-events` dropped once opacity crosses 0.5) but
triggered by `window.scrollY > 300` behind a plain `scroll` listener rather
than an `IntersectionObserver` — the requirement genuinely is a scroll
offset ("appears after 300px"), not an element's viewport position.
`Spring`'s own `mode="forward"` already uses this same
`window.addEventListener("scroll", …, { passive: true })` pattern.

## Team block — measured against Figma

Node `1558:410`, verified in the browser by dividing rendered rects by the
adaptive-grid scale:

| | Figma | Rendered |
|---|---|---|
| Intro card width | 447 | 447 |
| Portrait card width | 332 | 332 |
| Card gap | 11 | 11 |
| Intro card padding | 32 | 32 |
| Title width | 336 | 336 |
| Social button / gap | 64 / 12 | 64 / 12 |
| Rail → progress bar | 40 | 40 |
| Bar height | 2 | 2 |
| Card height | 558 of 800 (69.8 %) | 70.2 % of viewport |
| Caption plate inset | 32 all round | 32 all round |

The rail is: intro card → **five** portraits → a lime "and other 60+
specialists" tail card (node `1575:238`) with its own ring arrow. The caption
plates are inset 32 on all three sides, the same as the intro card's padding —
that is what lines them up with the social row across the whole rail.

> [!note] The mockup's captions are mis-gendered
> Figma puts a woman's name on a man's portrait and vice versa. Names here are
> invented so each matches the person actually pictured, per the client's
> instruction; the roles and the order follow the artboard.

Card height is proportional rather than absolute because the block is a full
viewport here, not the artboard's 600px band.

> [!warning] No scroll-snap on either rail
> `snap-mandatory` re-snaps whenever the layout shifts, and the Team section
> changes height as it becomes sticky — the rail silently landed on card two
> before anyone had touched it (measured `scrollLeft: 383`, exactly one card
> width). Snapping also fights the drag-and-glide, which already lands where you
> let go.

> [!important] Why the drag kept breaking
> Two native behaviours were stealing the gesture: the browser starting its own
> **image drag** (fixed with `preventDefault()` on pointerdown plus
> `[&_img]:pointer-events-none`), and Lenis' inherited `scroll-behavior: smooth`
> fighting the direct `scrollLeft` writes, which made the rail feel like rubber
> (fixed with `[scroll-behavior:auto]`). `touch-action: pan-y` keeps vertical
> page scrolling on touch while the component owns the horizontal axis.
> Verified: a 700px drag moves the rail exactly 700px.

## `MobileMenu` — the burger

`components/common/header/mobile-menu.tsx`, rendered below `lg`. A real
`<button>` with `aria-expanded` / `aria-controls`, Escape to close, a body
scroll-lock while open (restoring the previous `overflow`, not assuming
`visible`), and every link closing on activation so the anchor jump lands on a
page that can actually scroll.

The panel scales and fades from the toggle via `useTransition` rather than
sliding in, which keeps it anchored to the button that opened it.

Carries both header pills (`cta` primary, `loginCta` secondary — ADR-0031)
as plain `<Button withArrow>` elements, not `HeaderCta`: the panel is
already conditionally rendered (`isOpen &&`), so there's no separate
Contact-visibility fade to reproduce here.

## `HeaderCta` — the button that steps aside

`components/common/header/header-cta.tsx`. The Contact section rides up over
Team and reaches the header's own top edge (`top-4`), which is exactly where
the header's CTA pills sit — and on that screen they're redundant anyway
(Contact's own buttons offer the same actions).

An `IntersectionObserver` on `#contact` springs it out (opacity + a 24px lift)
and drops `pointer-events` with it, so a faded button is never clickable.

Rendered **twice** in `SiteHeader` (ADR-0031): once with `cta={loginCta}
variant="secondary"` (the "Login" pill), once with `cta={cta}` (the default
`variant="primary"`, "Start for Free"). The `variant` prop (`ButtonVariant`,
default `"primary"`) exists so both share the exact same fade/lift mechanics
and pill shape — "same glass pill style," just a different fill — instead of
duplicating the spring logic for a second button. `SiteHeader` stays a Server
Component; `HeaderCta` and `LanguageSwitcher` are its two client leaves.

## Text motion — one vocabulary, not per-section effects

`src/lib/motion/text-presets.ts` holds the page's **only** three text reveals,
spread onto `TextEngine` ([[text-engine]]) wherever copy appears:

| Preset | Splits by | Used for |
|--------|-----------|----------|
| `EYEBROW_MOTION` | word | section eyebrows |
| `HEADING_MOTION` | word | **section** h1 / h2 only |
| `BODY_MOTION` | word | paragraphs, and the About run of coloured spans |
| `ELEMENT_MOTION` | — | non-text blocks: buttons, rules, chip lists |

`ELEMENT_MOTION` is the odd one out: it is spread onto
[[components/animation-springs|`<Spring>`]], not `TextEngine`, because there are
no words to stagger. It animates on **mount** rather than on scroll, so the
caller supplies the cascade through `delayIn`. Same blur-and-rise as the copy,
deliberately — a button arriving under a heading should look like part of the
same gesture, not a second effect.

Headings run on their own `DISPLAY_SPRING` (`tension 130, friction 24`),
travelling 60px out of a 20px blur with a 55 ms word stagger — larger than the
body preset so it still reads as a display reveal, but brisk, because
word-level staggering already spreads the reveal over several hundred ms.

> [!important] Card titles are static — deliberately
> `HEADING_MOTION` belongs to **section** headings. The service card titles
> (`h3`), the Team intro card's `h2` and the Contact form's `h3` render as plain
> elements: five card titles revealing themselves while the Services rail scrubs
> horizontally reads as noise, the Team card sits on a draggable rail where the
> reveal would replay on every pass, and the form title would compete with the
> section heading beside it on the same screen. Verified by counting animated
> slots in the DOM: 0 for all three, 7 for the Services section heading.

## `StatCounter` — the About figures

`views/home/sections/stat-counter.tsx`. Splits `"98%"` into prefix / number /
suffix once and animates **only** the number, so nothing about the markup
changes while it counts and the layout never shifts.

The count is a spring (`tension 22, friction 26`), not a stepped timer — a
spring decelerates into its target, which is what makes it read as soft instead
of as a ticking odometer. Rounding happens at render time, so the number only
moves forward. An `IntersectionObserver` starts it on entry and returns it to
zero on exit, matching the text presets' `always` behaviour. The full value
stays in `aria-label` so assistive tech never reads a half-counted figure.

All three resolve **out of a blur** (`blur(12px)` → `blur(0px)`) while rising
slightly, on spring configs — one soft, one snappier for short labels. Keeping
them in one module is the point: an eyebrow animates identically in every
section instead of six sections each inventing timings.

> [!warning] `mode="always"`, and it is a correctness choice
> `once` was tried first — replaying on every pass is noise on a page this long.
> It also **loses copy**. The reveal starts at `opacity: 0`, so if the spring is
> starved when the trigger fires (fast scroll, a busy frame, a throttled tab)
> `once` never replays and the text stays invisible *permanently* — which is
> exactly what "the texts on the right disappeared" was. `always` re-triggers on
> the next entry, so a missed reveal heals itself.

> [!danger] Never put `absolute` on a `TextEngine` — wrap it
> TextEngine sets `position: relative` as an **inline style**, and an inline
> style beats a Tailwind class. `className="absolute top-… left-…"` therefore
> leaves the element `relative`, and `top`/`left` silently become *offsets from
> its flow position* — the Services eyebrow and description dropped below the
> heading and stretched to full width. Positioning goes on a wrapper `<div>`;
> the engine only ever carries typography classes.

> [!note] `columnGap: 0.25` on headings
> TextEngine's default word gap is ~0.3em, wider than a real space. Display
> headings measured against Figma therefore tipped onto an extra line — the
> Services heading spilled a third line behind the card rail. The preset pins
> the gap, and that heading's container is `43.5rem` rather than Figma's 42.75
> to absorb the remaining difference in word-box width.

> [!note] No `overflow` clip on the headings
> The reveal reads as a de-blur, and a clip box would cut the blur's soft edge.
> That also sidesteps the leading trap, though `leading-display` is kept on every
> heading regardless. Centred blocks still pair `justify-center` with
> `text-center`, since TextEngine's container is a flex row.

## Gutters

The 40px gutter is uniform: the Services rail is pinned `left-10 bottom-10`
rather than given a percentage height, so the gap beneath the cards equals the
gap either side at any viewport. The Team rail is the deliberate exception —
`pl-10` only, running to the right edge, because the mockup cuts the cards off
rather than boxing them in.

## How to verify a section

Do **not** eyeball a screenshot at an arbitrary window size — the adaptive grid
scales everything, so nothing will match Figma's numbers directly. Instead read
`getComputedStyle(document.documentElement).fontSize / 16` as the scale, divide
measured rects by it, and compare the result to the Figma node's `x/y/w/h`.
Header and hero were signed off this way (logo `40,16 149×54`, nav
`197,16 422×54`, hero button `40,715 180×48` — exact).

> [!warning] Built ≠ pixel-audited
> Every section renders and matches the mockup's structure, type scale and
> palette, but a value-by-value sweep against Figma has **not** been done. Known
> open items are listed under *Outstanding* below.

## Scroll choreography

| Effect | How |
|--------|-----|
| Fixed header | `position: fixed` — no JS |
| Services horizontal scrub | `ServicesTrack`: tall wrapper, `sticky` panel, progress read once per frame from the shared ticker into a `useSpring` `x` |
| Contact over Team | Team is `sticky top-0` inside `main`, so it stays pinned for the rest of the page; Contact follows with `z-20` and its own panel colour. **`Pricing` needs the same treatment** — it sits directly before Contact, between Team and Contact, so it also carries `z-20` + an opaque `bg-background`, or Team bleeds through underneath it during the handoff (found live in-browser, ADR-0029). |
| Team slider | native `overflow-x-auto` rail **plus pointer-capture dragging** — a mouse cannot drag a native scroller, so press/move/release write `scrollLeft` directly and a post-drag click is swallowed so a card never opens from a drag. Only the progress bar is animated, springing from `scrollLeft`. |
| Cursor image trail | `CursorTrail`: `useTransition` over a bounded list — one spawn per 90px of pointer travel, oldest dropped off the end. See below. |

The Contact-over-Team overlay is **flow order, not a scroll listener** —
nothing to throttle, nothing to recalculate on resize.

> [!warning] About no longer rides over Services (ADR-0029)
> It used to: `-mt-[100lvh]` + `z-10`, starting one viewport before the
> Services runway ended while its panel was still pinned. That trick needs a
> **matched pair** — a multi-viewport scroll-scrubbed runway directly above
> it, tall enough that pulling the block up by exactly one viewport only
> covers the runway's *last* frame (this was true of Services, is not true
> of a plain section). Live Demo now sits directly before About, between
> Services and About, and is a single `min-h-lvh` block, not a runway — the
> negative margin canceled Live Demo's entire height and hid it completely
> instead of revealing it. About dropped `-mt-[100lvh]`/`z-10` entirely and
> now just flows normally after Live Demo; Services' rail simply releases
> and Live Demo follows in plain flow, with no overlap flourish. Don't
> reintroduce the negative margin without also turning whatever precedes
> About into a real scroll-scrubbed runway — see about.tsx's docstring.

## Outstanding

- Team shows 4 portraits (`Our Team/02–05`); the mockup lays out 6 cards.
- Member names and roles are **invented placeholders** — the mockup's captions
  were not legible in the extracted context.
- No mobile frame exists, so nothing reflows — ADR-0019.

## `SiteHeader` — `components/common/header/site-header.tsx`

Site chrome, so it lives in `common/` rather than beside the page. A **Server
Component**: `position: fixed` needs no client boundary, and nothing here holds
state — it renders two client leaves (`HeaderCta`, `LanguageSwitcher`) rather
than becoming one itself.

Frosted panels (`bg-surface-glass` + `backdrop-blur-glass`) on a bar that
is itself `pointer-events-none`, with each panel switching them back on. Without
that, the 40 px gutters between panels would sit over the canvas and swallow
pointer events the WebGL scene needs for its cursor deform.

Takes a `locale` prop (ADR-0030), passed straight through to
`LanguageSwitcher` — the header itself does no locale-dependent rendering
beyond that. The logo pill renders `next/image` from `/logo.png` (ADR-0030 —
was the `<DnaIcon>` `currentColor` glyph, see [[components/ui]]).

## `Hero` — `views/home/sections/hero.tsx`

> [!important] The mockup's hero image is our own scene
> Figma's `image 659` is a still render of [[dna-ink-scene]]. The section mounts
> the **live** `<LazyDnaInk>` in the same box (x 361, width 1140 of the 1440
> frame) instead of shipping the PNG, and it reacts to the cursor. ADR-0024
> first set its `bgColor` to `#070d17` (exact match with `--surface-section`,
> zero seam) — live-testing on production showed that made the ink/helix
> essentially invisible, so ADR-0025 moved it to `#1e293b` (helix visible, a
> fairly noticeable seam), and ADR-0026 narrowed that seam from both sides:
> `bgColor` is now `#16202e` and `--surface-section` moved to its own
> `--raw-color-navy-800` (`#10182a`) instead of matching `--background`
> exactly. See ADR-0024–0026 and [[dna-ink-scene]].

**Entry cascade.** Every block enters, not just the copy. Each is wrapped in
[[common|`<RevealOnReady>`]], which carries that block's positioning *and* holds
its animation until the preloader curtain is on its way out — one wrapper doing
both jobs, so the composition does not gain a second layer of divs.

| Block | Motion | `delayIn` |
|-------|--------|-----------|
| eyebrow · h1 · description | text presets | 0 (own word stagger) |
| divider rule | `ELEMENT_MOTION` | 140 |
| trust line | `ELEMENT_MOTION` | 220 |
| service chips | `ELEMENT_MOTION` | 300 |
| actions | `ELEMENT_MOTION` | 380 |

The copy leads at zero because its word stagger is already several hundred ms
long; the furniture then cascades down the artboard.

The **scene is deliberately not wrapped**. It holds the preloader open until it
has drawn a frame ([[common|gates]]), so it is already on screen before anything
here animates — wrapping it would hide the one element that is guaranteed ready.

Because the curtain uncovers the page bottom-to-top, the lower blocks are
visible well before the copy is: at the moment the hero is released the panel
still covers the top of the frame, so the delays above are spent on blocks the
visitor can already see.

## Layout method

Sections are laid out at the Figma frame's **exact coordinates**, converted
px → rem at the 1440 base (`1rem = 16px`), on a `relative` section of the
frame's height. The adaptive grid drives the root font-size from the viewport,
so every offset stays proportional at any width — ADR-0019.

This is deliberate: the brief asks for Figma's proportions to hold everywhere,
and absolute rem offsets reproduce a fixed composition exactly where a flow
layout only approximates it. It also means **the layout does not reflow** —
which is fine until there is a mobile frame to reflow *to*. See ADR-0019's
consequences.

## Related

[[components/ui]] · [[dna-ink-scene]] · [[design-system]] · [[new-page]] ·
[[decisions-log]]
