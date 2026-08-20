// 📖 Docs: obsidian/frontend/components/home-sections.md

/**
 * Live Demo — net-new section, no Figma node (sits between Features and
 * About). A scripted, always-replaying chat transcript styled after the real
 * `/app` product, so a visitor sees the actual shape of an answer before ever
 * signing up.
 *
 * The "typing" effect is `TextEngine` split at **letter** level rather than
 * this page's usual word-level `HEADING_MOTION`/`BODY_MOTION` — a chat bubble
 * needs the finer grain to read as typing rather than as a reveal. Each
 * message's `delayIn` is computed from the running total of the *previous*
 * messages' own letter count × stagger, so the second bubble starts once the
 * first has actually finished "typing" instead of both animating at once.
 * `mode="always"` matches the rest of the page's vocabulary (see
 * text-presets.ts) — the transcript retypes itself every pass into view.
 *
 * `min-h-lvh`, matching Hero/Why/Team/Contact: a full-viewport section, not
 * a content-sized one. This also keeps About's own layout simple — About
 * used to ride *over* Services via `-mt-[100lvh]` (a trick that needs a tall
 * scroll-scrubbed runway directly before it, see about.tsx), and inserting a
 * short, content-sized block directly above it would have let that negative
 * margin overshoot straight through this section. About no longer overlaps
 * anything here; this section simply flows before it at a full viewport.
 */

import TextEngine from "spring-text-engine";

import { Inview } from "@/components/animation/springs/in-view";
import { Button } from "@/components/ui/button";
import type { LiveDemoContent } from "@/data/mocks/home";
import {
  BODY_MOTION,
  ELEMENT_MOTION,
  EYEBROW_MOTION,
  HEADING_MOTION,
} from "@/lib/motion/text-presets";

import { TypingCursor } from "./typing-cursor";

/** ms between letters — brisk enough to read as typing, not a slow reveal. */
const LETTER_STAGGER = 18;
/** Pause after a bubble finishes before the next one starts. */
const MESSAGE_GAP = 450;
/** Quick, minimal-travel: a letter should snap in, not drift. */
const TYPING_CONFIG = { tension: 300, friction: 22 };

export interface LiveDemoProps {
  content: LiveDemoContent;
}

export const LiveDemo = ({ content }: LiveDemoProps) => {
  // Running total of "typing time" so each bubble starts after the last one
  // finishes, computed once from static copy — no client state needed.
  // Written as a pure `reduce` (no outer-variable reassignment during
  // render) rather than a `let` accumulator.
  const delays = content.messages.reduce<{ list: number[]; elapsed: number }>(
    (acc, message) => ({
      list: [...acc.list, acc.elapsed],
      elapsed: acc.elapsed + message.text.length * LETTER_STAGGER + MESSAGE_GAP,
    }),
    { list: [], elapsed: 0 },
  ).list;

  return (
    <section
      id="live-demo"
      className="relative flex min-h-lvh flex-col justify-center bg-background px-5 py-24 md:px-10"
    >
      <div className="mx-auto flex w-full max-w-[44.75rem] flex-col items-center gap-4 text-center lg:gap-8">
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
        <TextEngine
          tag="p"
          className="w-full justify-center text-center text-base leading-body font-light lg:w-[27.625rem]"
          {...BODY_MOTION}
        >
          {content.description}
        </TextEngine>
      </div>

      <Inview
        {...ELEMENT_MOTION}
        className="mx-auto mt-12 w-full max-w-[40rem] lg:mt-16"
      >
        {/* Dark card, cyan accents — the same glass/card tokens as the rest
            of the page, so it reads as "the real app" rather than a mockup
            with its own palette. */}
        <div className="flex flex-col gap-5 rounded-card border border-border-card bg-surface-card p-6 backdrop-blur-glass md:p-8">
          {content.messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-panel px-5 py-3.5 text-sm leading-body font-light md:text-base ${
                  message.role === "user"
                    ? "bg-action-primary text-action-primary-foreground"
                    : "border border-border-card bg-surface-input"
                }`}
              >
                <TextEngine
                  tag="p"
                  mode="always"
                  letterIn={{ opacity: 1, filter: "blur(0px)" }}
                  letterOut={{ opacity: 0, filter: "blur(6px)" }}
                  letterStagger={LETTER_STAGGER}
                  letterConfig={TYPING_CONFIG}
                  delayIn={delays[index]}
                >
                  {message.text}
                </TextEngine>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2 pl-1 text-accent">
            <TypingCursor />
          </div>
        </div>
      </Inview>

      <div className="mt-8 flex justify-center">
        <Button href={content.ctaHref} variant="secondary" className="w-fit px-8">
          {content.ctaLabel}
        </Button>
      </div>
    </section>
  );
};
