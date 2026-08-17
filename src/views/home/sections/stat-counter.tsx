"use client";

// 📖 Docs: obsidian/frontend/components/home-sections.md

/**
 * Counting stat value — "98%", "24h", "60+", "15".
 *
 * The figures carry non-numeric parts (a percent sign, a unit, a plus), so the
 * component splits the string once into prefix / number / suffix and animates
 * only the number. Nothing about the markup changes as it counts, so the
 * layout never shifts.
 *
 * Motion is a `@react-spring/web` spring (hard rule #1), not a stepped timer:
 * a spring decelerates into its target, which is what makes the count read as
 * soft rather than as a ticking odometer. Rounding happens at render time, so
 * the displayed value only ever moves forward.
 *
 * Runs when the figure scrolls into view, and resets when it leaves so the
 * count plays again — matching the text presets' `always` behaviour.
 */

import { animated, useSpring } from "@react-spring/web";
import { useEffect, useRef } from "react";

/** Long and heavily damped: no overshoot, no bounce on a number. */
const COUNT_SPRING = { tension: 22, friction: 26 };
/** Fire once any part of the figure is on screen. */
const OBSERVER_THRESHOLD = 0.2;

const SPLIT = /^(\D*)(\d+)(\D*)$/;

export interface StatCounterProps {
  /** e.g. `"98%"`, `"24h"`, `"60+"`, `"15"`. */
  value: string;
  className?: string;
}

export const StatCounter = ({ value, className }: StatCounterProps) => {
  const ref = useRef<HTMLElement>(null);

  const match = SPLIT.exec(value);
  const prefix = match?.[1] ?? "";
  const target = match ? Number(match[2]) : 0;
  const suffix = match?.[3] ?? "";

  const [{ count }, api] = useSpring(() => ({
    count: 0,
    config: COUNT_SPRING,
  }));

  useEffect(() => {
    const element = ref.current;
    // A value with no digits (should not happen) is rendered as-is.
    if (!element || !match) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        api.start({ count: entry.isIntersecting ? target : 0 });
      },
      { threshold: OBSERVER_THRESHOLD },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [api, match, target]);

  if (!match) return <span className={className}>{value}</span>;

  return (
    <animated.span
      ref={ref}
      className={className}
      // The full string stays in the accessibility tree while the digits move.
      aria-label={value}
    >
      {count.to((current) => `${prefix}${Math.round(current)}${suffix}`)}
    </animated.span>
  );
};
