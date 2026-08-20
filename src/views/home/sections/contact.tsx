// 📖 Docs: obsidian/frontend/components/home-sections.md

/**
 * Contact — Figma node `1575:274` (frame only; the form panel `1574:747`
 * no longer applies).
 *
 * Was a lead-capture form (`POST /api/contact`) — replaced with a plain
 * closing CTA at the project owner's request (decisions-log). The DNA scene
 * and the "rides over Team" scroll choreography are unchanged: only the
 * content changed, from a form panel to a centred heading and two buttons.
 */

import TextEngine from "spring-text-engine";

import { Spring } from "@/components/animation/springs/spring";
import { LazyDnaInk } from "@/components/scene/dna-ink";
import { Button } from "@/components/ui/button";
import type { ContactContent } from "@/data/mocks/home";
import {
  BODY_MOTION,
  ELEMENT_MOTION,
  EYEBROW_MOTION,
  HEADING_MOTION,
} from "@/lib/motion/text-presets";

export interface ContactProps {
  content: ContactContent;
}

export const Contact = ({ content }: ContactProps) => (
  <section
    id="contact"
    className="relative z-20 flex min-h-lvh flex-col items-center justify-center gap-10 overflow-hidden rounded-t-section bg-surface-section px-5 py-20 text-center md:px-10 lg:h-lvh lg:min-h-0"
  >
    {/* Same scene as Hero, `image 660` in the mockup — hidden below `lg`:
        a second WebGL context on a phone is a real cost, and this screen no
        longer has a form to justify carrying it there. */}
    <div className="pointer-events-none hidden lg:absolute lg:inset-0 lg:block">
      <LazyDnaInk className="block size-full" controls={false} />
    </div>

    <div className="relative z-10 flex w-full max-w-[44.75rem] flex-col items-center gap-6 lg:gap-10">
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
          className="w-full justify-center text-center text-[2.25rem] leading-display font-light md:text-[3rem] lg:text-6xl"
          {...HEADING_MOTION}
        >
          {content.title}
        </TextEngine>
      </div>

      <TextEngine
        tag="p"
        className="w-full justify-center text-center text-base leading-body font-light lg:w-[35rem]"
        {...BODY_MOTION}
      >
        {content.description}
      </TextEngine>

      <Spring {...ELEMENT_MOTION} delayIn={220} className="flex flex-wrap items-center justify-center gap-4">
        {content.actions.map((action, index) => (
          <Button
            key={action.href}
            href={action.href}
            variant={index === 0 ? "primary" : "secondary"}
            className="w-[13rem]"
          >
            {action.label}
          </Button>
        ))}
      </Spring>
    </div>
  </section>
);
