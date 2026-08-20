// 📖 Docs: obsidian/frontend/components/home-sections.md

/**
 * About — Figma node `1575:272` (content row).
 *
 * Desktop offset is the mockup's own content-row position, just pulled up to
 * the frame's own top gutter: originally `38,604` sitting below a 40,40
 * 1360×500 decorative banner (`AboutBanner`, ADR-0027 → removed per the
 * project owner's request — "large empty blue/teal box", see decisions-log).
 * Deleting that box without also closing the ~604px gap it left would have
 * traded a gradient-filled empty rectangle for a plain-background one, so the
 * content row and the section's fixed height both moved up by the banner's
 * own footprint (33.75rem span + 4rem gutter = 37.75rem) instead of staying at
 * the original Figma coordinate.
 *
 * No `-mt-[100lvh]` overlap here (unlike the original Dantora layout, where
 * this block rode directly over the pinned Services panel — see
 * home-sections.md's *Scroll choreography*). That trick needs a **matched
 * pair**: a multi-viewport scroll-scrubbed runway directly before it, tall
 * enough that pulling this block up by exactly one viewport only covers the
 * runway's *last* frame. Live Demo now sits between Services and About and is
 * a single `min-h-lvh` block, not a runway — the negative margin would cancel
 * its entire height and hide it completely rather than reveal it. Plain
 * sequential flow after Live Demo instead.
 */

import TextEngine from "spring-text-engine";

import { Button } from "@/components/ui/button";
import type { AboutContent } from "@/data/mocks/home";
import { BODY_MOTION, EYEBROW_MOTION } from "@/lib/motion/text-presets";

import { StatCounter } from "./stat-counter";

export interface AboutProps {
  content: AboutContent;
}

export const About = ({ content }: AboutProps) => (
  <section
    id="about"
    className="relative rounded-t-section bg-surface-section-deep px-5 py-16 md:px-10 lg:h-[36.25rem] lg:p-0"
  >
    <div className="mt-10 flex flex-col gap-10 lg:absolute lg:top-[2.5rem] lg:left-[2.375rem] lg:mt-0 lg:w-[85.125rem] lg:flex-row lg:items-center lg:justify-between lg:gap-0">
      <div className="flex flex-col gap-8 lg:w-[28.0625rem] lg:gap-[5.5625rem]">
        <TextEngine
          tag="p"
          className="text-sm leading-body font-medium text-accent uppercase"
          {...EYEBROW_MOTION}
        >
          {content.eyebrow}
        </TextEngine>
        <dl className="grid grid-cols-2 gap-x-[0.625rem] gap-y-10 lg:h-[17.125rem] lg:gap-y-[5.625rem]">
          {content.stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col gap-4 border-l border-accent pl-4 lg:gap-[2.375rem] lg:pl-6"
            >
              <dd className="text-[2.5rem] leading-display font-light text-accent-soft lg:text-6xl">
                <StatCounter value={stat.value} />
              </dd>
              <dt className="text-sm leading-body font-light lg:text-base">
                {stat.label}
              </dt>
            </div>
          ))}
        </dl>
      </div>

      <div className="flex flex-col gap-10 lg:w-[49.3125rem] lg:gap-[8.375rem]">
        {/* Word-level, not line-level: the copy is a run of differently
            coloured spans, and TextEngine splits mixed children reliably by
            word. */}
        <TextEngine
          tag="p"
          className="text-[1.375rem] leading-body font-light md:text-[1.75rem] lg:text-[2.25rem]"
          {...BODY_MOTION}
        >
          {content.paragraph.map((fragment) => (
            <span
              key={fragment.text}
              className={fragment.muted ? "text-foreground-muted" : ""}
            >
              {fragment.text}
            </span>
          ))}
        </TextEngine>
        <div className="flex flex-wrap items-center gap-4">
          {content.actions.map((action, index) => (
            <Button
              key={action.href}
              href={action.href}
              variant={index === 0 ? "primary" : "secondary"}
              className={index === 0 ? "w-[15rem]" : "w-[11.25rem]"}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  </section>
);
