// 📖 Docs: obsidian/frontend/components/home-sections.md

/**
 * Why Dantora — Figma node `1558:320`.
 *
 * The band between the hero (page y 800) and Services (page y 1601), so it is
 * exactly 801px tall. The copy block sits at page 362,1035 → 362,235 inside
 * the band, 716 wide.
 *
 * The image trail takes the whole band as its hit area; the mockup's three
 * static cards on the right are the trail's spawned frames, live.
 */

import TextEngine from "spring-text-engine";

import { Button } from "@/components/ui/button";
import type { WhyContent } from "@/data/mocks/home";
import {
  BODY_MOTION,
  EYEBROW_MOTION,
  HEADING_MOTION,
} from "@/lib/motion/text-presets";

import { CursorTrail } from "./cursor-trail";

export interface WhyDantoraProps {
  content: WhyContent;
}

export const WhyDantora = ({ content }: WhyDantoraProps) => (
  // Sits on the white page background between two mint panels — that contrast
  // is the design, not a missing fill.
  // `overflow-hidden` clips the trail to this band — without it a card spawned
  // near an edge spills over the hero above and Services below.
  <section id="why" className="relative h-lvh overflow-hidden bg-background">
    {/* `h-full`, not `absolute inset-0`: the trail root already carries
        `relative`, and the two position utilities would fight — `relative`
        wins, the box collapses to zero height and the centred copy escapes
        upward into the hero. */}
    <CursorTrail images={content.trailImages} className="h-full">
      {/* Centred both ways at every size; only the widths and type scale
          change. The trail itself is already mouse-only, so touch gets the
          plain centred block. */}
      <div className="absolute top-1/2 left-1/2 flex w-[min(100%-2.5rem,44.75rem)] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-8 text-center lg:gap-12">
        {/* `justify-center` alongside `text-center`: TextEngine's container is
            a flex row, so text-align alone positions nothing (hard rule #3). */}
        <div className="flex w-full flex-col items-center gap-4 lg:gap-8">
          <TextEngine
            tag="p"
            className="w-full justify-center text-center text-sm leading-body font-medium text-accent uppercase"
            {...EYEBROW_MOTION}
          >
            {content.eyebrow}
          </TextEngine>
          <TextEngine
            tag="h2"
            className="w-full justify-center text-center text-[2.25rem] leading-display font-light md:text-[3rem] lg:w-[39.25rem] lg:text-6xl"
            {...HEADING_MOTION}
          >
            {content.title}
          </TextEngine>
        </div>
        <TextEngine
          tag="p"
          className="w-full justify-center text-center text-base leading-body font-light lg:w-[27.625rem]"
          {...BODY_MOTION}
        >
          {content.description}
        </TextEngine>
        <div className="flex items-center gap-4">
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
        </div>
      </div>
    </CursorTrail>
  </section>
);
