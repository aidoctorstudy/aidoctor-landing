"use client";

// 📖 Docs: obsidian/frontend/components/dna-ink-scene.md

/**
 * CSS backdrop shown instead of the DNA scene on mobile when WebGL context
 * creation fails — see `DnaInkWithFallback`.
 *
 * The "slow pulse" is a `@react-spring/web` async chain (`to: async next =>
 * { while (true) { await next(...) } }`), not `@keyframes` — hard rule #1
 * bans keyframes outright even for a decorative, continuous effect like this
 * one. The async form oscillates between the two opacity states forever
 * without a rAF loop of its own, which is exactly what a "slowly pulsing"
 * glow needs.
 */

import { animated, useSpring } from "@react-spring/web";

/** One full dim → bright → dim cycle, in ms. */
const PULSE_DURATION = 3200;

export interface MobileDnaFallbackProps {
  className?: string;
}

export const MobileDnaFallback = ({ className }: MobileDnaFallbackProps) => {
  const { opacity } = useSpring({
    from: { opacity: 0.5 },
    to: async (next) => {
      while (true) {
        await next({ opacity: 1 });
        await next({ opacity: 0.5 });
      }
    },
    config: { duration: PULSE_DURATION / 2 },
  });

  return (
    <animated.div
      aria-hidden="true"
      className={`bg-[image:var(--raw-gradient-dna-fallback)] ${className ?? ""}`}
      style={{ opacity }}
    />
  );
};
