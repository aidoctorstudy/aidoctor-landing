// 📖 Docs: obsidian/frontend/components/home-sections.md

/**
 * About — Figma nodes `1575:273` (frame) / `1575:272` (content).
 *
 * Desktop offsets are the mockup's own: banner at 40,40 (1360×500), content row
 * at 38,604 (1362×380), left column 449 wide with the stat grid at y 106, right
 * column from x 573 and 789 wide, buttons at y 332.
 *
 * `-mt-[100lvh]` makes this block ride *over* the pinned Services panel at
 * **every** breakpoint: it starts one viewport before that runway ends, so
 * scrolling lifts it across. This only works because the Services runway also
 * exists at every breakpoint — the two are a matched pair, and disabling one on
 * small screens without the other pulls this section up over the one above.
 */

import TextEngine from "spring-text-engine";

import { Button } from "@/components/ui/button";
import type { AboutContent } from "@/data/mocks/home";
import { BODY_MOTION, EYEBROW_MOTION } from "@/lib/motion/text-presets";

import { AboutBanner } from "./about-banner";
import { StatCounter } from "./stat-counter";

export interface AboutProps {
  content: AboutContent;
}

export const About = ({ content }: AboutProps) => (
  <section
    id="about"
    className="relative z-10 -mt-[100lvh] rounded-t-section bg-surface-section-deep px-5 py-16 md:px-10 lg:h-[71.5rem] lg:p-0"
  >
    <AboutBanner className="h-[16rem] rounded-card md:h-[24rem] lg:absolute lg:top-[2.5rem] lg:left-[2.5rem] lg:h-[31.25rem] lg:w-[85rem]" />

    <div className="mt-10 flex flex-col gap-10 lg:absolute lg:top-[37.75rem] lg:left-[2.375rem] lg:mt-0 lg:w-[85.125rem] lg:flex-row lg:items-center lg:justify-between lg:gap-0">
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
