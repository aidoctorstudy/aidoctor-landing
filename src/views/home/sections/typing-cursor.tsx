"use client";

// 📖 Docs: obsidian/frontend/components/home-sections.md

/**
 * Blinking cyan cursor bar for the Live Demo chat card.
 *
 * Same technique as `MobileDnaFallback`: a `@react-spring/web` async `to`
 * chain looping opacity forever, never `@keyframes` (hard rule #1). A blink
 * is binary (on/off), not eased travel, so `config.duration` with `easing:
 * (t) => (t < 1 ? 0 : 1)` — a hard step — reads as a cursor, not a fade.
 */

import { animated, useSpring } from "@react-spring/web";

/** One on/off half-cycle, in ms — a typical terminal-cursor blink rate. */
const BLINK_HALF_CYCLE = 530;

export interface TypingCursorProps {
  className?: string;
}

export const TypingCursor = ({ className }: TypingCursorProps) => {
  const { opacity } = useSpring({
    from: { opacity: 1 },
    to: async (next) => {
      while (true) {
        await next({ opacity: 0 });
        await next({ opacity: 1 });
      }
    },
    config: { duration: BLINK_HALF_CYCLE, easing: (t: number) => (t < 1 ? 0 : 1) },
  });

  return (
    <animated.span
      aria-hidden="true"
      className={`inline-block h-[1em] w-[2px] bg-accent align-middle ${className ?? ""}`}
      style={{ opacity }}
    />
  );
};
