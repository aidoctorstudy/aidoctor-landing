/**
 * Text reveal presets — the page's one motion vocabulary.
 *
 * Every section spreads these onto `TextEngine` rather than inventing its own
 * timings, so an eyebrow behaves identically wherever it appears and the page
 * reads as one system instead of six unrelated effects.
 *
 * The shared idea: copy resolves **out of a blur**, rising slightly, one slot at
 * a time. Headings resolve line by line, body copy word by word, eyebrows fast
 * enough to feel like a label rather than an animation.
 *
 * All motion is spring-based (hard rule #1). Never `mode="manual"` (hard rule
 * #3).
 *
 * > Why `"always"` and not `"once"`
 * > `once` was the first choice — re-animating on every pass is noise on a page
 * > this long. It also loses text. The reveal starts at `opacity: 0`, and if the
 * > spring is starved when the trigger fires (fast scroll, a busy frame, a
 * > throttled tab) `once` never replays, so the copy stays invisible
 * > **permanently**. `always` re-triggers on the next entry, so a missed reveal
 * > heals itself. Losing copy is a correctness bug; replaying an animation is a
 * > taste question.
 *
 * 📖 Docs: obsidian/frontend/components/home-sections.md
 */

/** Blur the copy resolves out of. One value, so the whole page matches. */
const BLUR_FROM = "blur(12px)";
const BLUR_TO = "blur(0px)";

/** Soft, slightly over-damped — no bounce on typography. */
const SOFT_SPRING = { tension: 150, friction: 30 };
/**
 * Display headings — firm and quick.
 *
 * Word-level staggering already spreads a heading over several hundred ms, so
 * the spring itself has to be brisk or the whole reveal drags.
 */
const DISPLAY_SPRING = { tension: 130, friction: 24 };
/** A touch snappier, for short labels. */
const LABEL_SPRING = { tension: 220, friction: 28 };

/**
 * Section eyebrow — the small uppercase label.
 *
 * Word-level so a two-word label still has a little internal cascade.
 */
export const EYEBROW_MOTION = {
  mode: "always",
  wordIn: { y: 0, opacity: 1, filter: BLUR_TO },
  wordOut: { y: 12, opacity: 0, filter: BLUR_FROM },
  wordStagger: 45,
  wordConfig: LABEL_SPRING,
} as const;

/**
 * Display heading — resolves word by word.
 *
 * Reserved for the page's **section** headings. Card titles deliberately do not
 * use it: a rail of five cards each animating its own title reads as noise, and
 * the Services rail scrubs horizontally while they would still be settling.
 *
 * No `overflow` clip: the reveal reads as a de-blur, and clipping would fight
 * the blur's soft edge. That also sidesteps the leading trap, though the
 * `leading-display` floor is kept on every heading anyway.
 */
export const HEADING_MOTION = {
  mode: "always",
  // TextEngine's default word gap is ~0.3em — wider than a real space, which
  // pushed display headings onto an extra line versus the Figma measurement.
  columnGap: 0.25,
  // Word-level, not line-level: the heading assembles itself left to right
  // instead of whole rows sliding up as blocks. Travel stays larger than the
  // body preset so it still reads as a display reveal.
  wordIn: { y: 0, opacity: 1, filter: BLUR_TO },
  wordOut: { y: 60, opacity: 0, filter: "blur(20px)" },
  wordStagger: 55,
  wordConfig: DISPLAY_SPRING,
} as const;

/** Body copy — word by word, gentler travel than a heading. */
export const BODY_MOTION = {
  mode: "always",
  wordIn: { y: 0, opacity: 1, filter: BLUR_TO },
  wordOut: { y: 16, opacity: 0, filter: BLUR_FROM },
  wordStagger: 26,
  wordConfig: SOFT_SPRING,
} as const;

/**
 * Non-text elements — buttons, rules, chips, anything without words to stagger.
 *
 * Spread onto `<Spring>` (see [[components/animation-springs]]), which animates
 * on mount rather than on scroll: these live alongside copy that is already
 * being revealed, so the trigger is the same mount the text presets respond to,
 * and staggering is the caller's job via `delayIn`.
 *
 * Same blur-and-rise as the copy, deliberately — one vocabulary, so a button
 * arriving under a heading looks like part of the same gesture.
 *
 * `transform` is written out rather than using react-spring's `y` shorthand:
 * the shorthand is a property of the `animated` element, and these values pass
 * through the vendored wrapper's `style` merge instead.
 */
export const ELEMENT_MOTION = {
  mode: "always",
  from: {
    opacity: 0,
    filter: BLUR_FROM,
    transform: "translate3d(0, 1.25rem, 0)",
  },
  to: { opacity: 1, filter: BLUR_TO, transform: "translate3d(0, 0rem, 0)" },
  config: SOFT_SPRING,
} as const;
