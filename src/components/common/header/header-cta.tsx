"use client";

// 📖 Docs: obsidian/frontend/components/home-sections.md

/**
 * Header call-to-action that steps aside on the Contact screen.
 *
 * Once the Contact block is on screen the button is redundant — and it sits
 * exactly where that block's form panel now reaches. It fades and lifts out
 * rather than disappearing, and `pointer-events` are dropped with it so a
 * hidden button can never be clicked.
 *
 * Only this leaf is a Client Component; the rest of the header stays a Server
 * Component.
 */

import { animated, useSpring } from "@react-spring/web";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import type { CtaLink } from "@/data/mocks/home";

const REVEAL_CONFIG = { tension: 210, friction: 30 };
/** Fire as soon as any sliver of the target shows. */
const OBSERVER_THRESHOLD = 0;

export interface HeaderCtaProps {
  cta: CtaLink;
  /** Element whose visibility hides the button — the Contact section. */
  hideWhenVisibleId: string;
}

export const HeaderCta = ({ cta, hideWhenVisibleId }: HeaderCtaProps) => {
  const [style, api] = useSpring(() => ({
    opacity: 1,
    y: 0,
    config: REVEAL_CONFIG,
  }));
  const hidden = useRef(false);

  useEffect(() => {
    const target = document.getElementById(hideWhenVisibleId);
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const shouldHide = entry.isIntersecting;
        if (shouldHide === hidden.current) return;
        hidden.current = shouldHide;
        api.start({ opacity: shouldHide ? 0 : 1, y: shouldHide ? -24 : 0 });
      },
      { threshold: OBSERVER_THRESHOLD },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [api, hideWhenVisibleId]);

  return (
    <animated.div
      className="pointer-events-auto"
      style={{
        opacity: style.opacity,
        transform: style.y.to((value) => `translate3d(0, ${value}px, 0)`),
        // Untargetable the moment it starts fading out.
        pointerEvents: style.opacity.to((value) =>
          value < 0.5 ? "none" : "auto",
        ),
      }}
    >
      <Button href={cta.href} withArrow>
        {cta.label}
      </Button>
    </animated.div>
  );
};
