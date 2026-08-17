// 📖 Docs: obsidian/frontend/components/home-sections.md

/**
 * Hero — Figma nodes `1518:2115` (panel), `1558:307` (copy), `1558:305`
 * (actions), `1574:602` (trust line), `1574:605` (service chips).
 *
 * **Two layouts.** Below `lg` the blocks are a plain flex column in DOM order,
 * which is also the reading order. From `lg` up each block is pinned at the
 * artboard's own coordinates — horizontal offsets in rem, vertical ones as a
 * percentage of the artboard's 800px height, so the composition keeps Figma's
 * proportions at any desktop width.
 *
 * Absolute positioning ignores DOM order, so the markup is written in **mobile**
 * order and the desktop composition is reconstructed by the `lg:` offsets. That
 * avoids a pile of `order-*` overrides.
 *
 * **Every block enters.** Each is wrapped in [[RevealOnReady]], which both
 * carries the block's positioning and holds its animation until the preloader
 * curtain is on its way out. Copy animates through the text presets; everything
 * else through `<Spring>` with `ELEMENT_MOTION`, cascading down the composition
 * via `ENTRY_DELAY` so the hero assembles rather than appearing at once.
 *
 * The mockup's right-hand image (`image 659`) is a still of the DNA Ink scene,
 * so the live [[dna-ink-scene]] renders there instead. It is deliberately *not*
 * wrapped: it holds the preloader open until it has drawn a frame, so by the
 * time anything here animates the scene is already on screen.
 */

import TextEngine from "spring-text-engine";

import { Spring } from "@/components/animation/springs/spring";
import { RevealOnReady } from "@/components/common/preloader";
import { LazyDnaInk } from "@/components/scene/dna-ink";
import { Button } from "@/components/ui/button";
import type { HeroContent } from "@/data/mocks/home";
import {
  BODY_MOTION,
  ELEMENT_MOTION,
  EYEBROW_MOTION,
  HEADING_MOTION,
} from "@/lib/motion/text-presets";

/**
 * Entry cascade, in ms. Copy leads at zero — it carries its own word stagger,
 * which is already several hundred ms long — and the furniture follows top to
 * bottom down the artboard.
 */
const ENTRY_DELAY = {
  divider: 140,
  trustLine: 220,
  chips: 300,
  actions: 380,
} as const;

export interface HeroProps {
  content: HeroContent;
}

export const Hero = ({ content }: HeroProps) => (
  <section
    id="hero"
    // Decorative cyan glow + dot-grid layered over the panel colour — static
    // background-image, not motion, so it doesn't touch hard rule #1.
    className="relative flex min-h-lvh flex-col gap-8 overflow-hidden rounded-b-section bg-surface-section bg-[image:var(--raw-background-hero)] bg-[length:100%_100%,2rem_2rem] px-5 pt-28 pb-12 md:px-10 lg:block lg:h-lvh lg:min-h-0 lg:p-0"
  >
    {/* `z-10` is load-bearing: the markup is in mobile order, so the scene's
        canvas comes *after* the copy in the DOM and would otherwise paint over
        it once both are absolutely positioned at `lg`. */}
    <RevealOnReady className="z-10 lg:absolute lg:top-[28.55%] lg:left-10 lg:w-[44.75rem]">
      <div className="flex flex-col gap-6 lg:gap-12">
        <div className="flex flex-col gap-4 lg:gap-8">
          <TextEngine
            tag="p"
            className="text-sm leading-body font-medium text-accent uppercase"
            {...EYEBROW_MOTION}
          >
            {content.eyebrow}
          </TextEngine>
          <TextEngine
            tag="h1"
            className="text-[2.5rem] leading-display font-light md:text-[3rem] lg:text-6xl"
            {...HEADING_MOTION}
          >
            {content.title}
          </TextEngine>
        </div>
        <TextEngine
          tag="p"
          className="text-base leading-body font-light lg:w-[30.875rem]"
          {...BODY_MOTION}
        >
          {content.description}
        </TextEngine>
      </div>
    </RevealOnReady>

    <RevealOnReady className="z-10 lg:absolute lg:top-[89.375%] lg:left-10">
      <Spring
        {...ELEMENT_MOTION}
        delayIn={ENTRY_DELAY.actions}
        className="flex flex-wrap gap-4"
      >
        {content.actions.map((action, index) => (
          <Button
            key={action.href}
            href={action.href}
            variant={index === 0 ? "primary" : "secondary"}
            className="w-[11.25rem]"
          >
            {action.label}
          </Button>
        ))}
      </Spring>
    </RevealOnReady>

    {/* Mobile gives the scene a fixed slice of the viewport; desktop restores
        the artboard's box (x 361, width 1140 — overhanging and clipped). */}
    <div className="pointer-events-none -mx-5 h-[40lvh] md:-mx-10 lg:absolute lg:inset-y-0 lg:left-[22.5625rem] lg:mx-0 lg:h-auto lg:w-[71.25rem]">
      <LazyDnaInk className="block size-full" gatesPreload />
    </div>

    <RevealOnReady className="lg:absolute lg:top-[78.625%] lg:right-10 lg:left-[2.5625rem]">
      <Spring {...ELEMENT_MOTION} delayIn={ENTRY_DELAY.divider}>
        <hr className="border-t border-border-subtle" />
      </Spring>
    </RevealOnReady>

    <RevealOnReady className="lg:absolute lg:top-[83.625%] lg:left-10">
      <Spring
        {...ELEMENT_MOTION}
        delayIn={ENTRY_DELAY.trustLine}
        tag="p"
        className="flex items-center gap-3 text-base leading-body text-accent"
      >
        {content.trustLine}
        <span aria-hidden="true" className="h-px w-[3.125rem] bg-accent" />
      </Spring>
    </RevealOnReady>

    <RevealOnReady className="lg:absolute lg:top-[83.625%] lg:left-[55.5625rem] lg:w-[31.9375rem]">
      <Spring
        {...ELEMENT_MOTION}
        delayIn={ENTRY_DELAY.chips}
        tag="ul"
        className="flex flex-wrap gap-1 lg:justify-end"
      >
        {content.serviceChips.map((chip) => (
          <li
            key={chip}
            className="rounded-chip border border-border-chip bg-surface-chip px-5 py-3 text-sm leading-body font-light text-accent-soft backdrop-blur-glass lg:px-8 lg:py-4 lg:text-base"
          >
            {chip}
          </li>
        ))}
      </Spring>
    </RevealOnReady>
  </section>
);
