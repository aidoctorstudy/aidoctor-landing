"use client";

// 📖 Docs: obsidian/frontend/components/common.md

/**
 * Fixed bottom-right "Try Free" pill, shown once the visitor has scrolled
 * past `SCROLL_THRESHOLD`.
 *
 * Same `@react-spring/web` fade-and-lift technique as `HeaderCta` (opacity +
 * a translate, `pointer-events` toggled off below the halfway point of the
 * fade so a barely-visible button is never clickable) — but driven by a raw
 * scroll offset rather than an `IntersectionObserver`, because the trigger
 * here genuinely is "300px of scroll", not "a particular element passed the
 * viewport edge". `Spring`'s own `mode="forward"` uses this same
 * `window.addEventListener("scroll", …, { passive: true })` pattern.
 */

import { animated, useSpring } from "@react-spring/web";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { CtaLink } from "@/data/mocks/home";

const REVEAL_CONFIG = { tension: 210, friction: 30 };
/** Pixels of scroll before the pill appears. */
const SCROLL_THRESHOLD = 300;

export interface FloatingCtaProps {
  cta: CtaLink;
}

export const FloatingCta = ({ cta }: FloatingCtaProps) => {
  const [visible, setVisible] = useState(false);
  const visibleRef = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      const shouldShow = window.scrollY > SCROLL_THRESHOLD;
      if (shouldShow === visibleRef.current) return;
      visibleRef.current = shouldShow;
      setVisible(shouldShow);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const style = useSpring({
    opacity: visible ? 1 : 0,
    y: visible ? 0 : 24,
    config: REVEAL_CONFIG,
  });

  return (
    <animated.div
      className="fixed right-5 bottom-5 z-40 md:right-10 md:bottom-10"
      style={{
        opacity: style.opacity,
        transform: style.y.to((value) => `translate3d(0, ${value}px, 0)`),
        pointerEvents: style.opacity.to((value) =>
          value < 0.5 ? "none" : "auto",
        ),
      }}
    >
      {/* Label already carries its own arrow ("Try Free →") — `withArrow`
          would double it with the pill's trailing disc. */}
      <Button href={cta.href}>{cta.label}</Button>
    </animated.div>
  );
};
