"use client";

// 📖 Docs: obsidian/frontend/components/home-sections.md

/**
 * Horizontal scroll hijack for the Services rail — at **every** breakpoint.
 *
 * The panel is one full viewport and `sticky`; the wrapper around it is the
 * scroll runway, and vertical scroll maps onto horizontal travel of the rail.
 * The runway is deliberately longer than the scrub needs — its last viewport is
 * where the About block slides up over the pinned panel (About carries a
 * matching negative margin), so the rail must finish travelling before then,
 * and `DWELL_VIEWPORTS` buys reading time on the final card.
 *
 * > This ran desktop-only for one revision. It is back on touch by request, and
 * > it is safe there because nothing here calls `preventDefault` — the rail is
 * > a pure function of scroll position, so the page still scrolls normally and
 * > the gesture is never stolen. Only the card sizing is responsive.
 *
 * Scroll progress is read once per frame from the shared ticker and drives a
 * spring, so the rail eases instead of snapping to raw scroll (hard rule #1).
 */

import { animated, useSpring } from "@react-spring/web";
import { useRef, type ReactNode } from "react";

import { useLoop } from "@/hooks/animation/use-render-loop";

const SCRUB_CONFIG = { tension: 220, friction: 42 };
const EVERY_FRAME = 0;

/** Total viewports of runway: pin + scrub + dwell + overlay. */
const RUNWAY_VIEWPORTS = 4;
/** Trailing viewport reserved for the About overlay — not part of the scrub. */
const OVERLAY_VIEWPORTS = 1;
/**
 * Viewports the finished rail holds still before About starts covering it.
 *
 * Without an explicit dwell the scrub ended and the overlay began one viewport
 * later no matter how long the runway was — lengthening the runway just slowed
 * the scrub. This is the knob that actually buys reading time on the last card.
 */
const DWELL_VIEWPORTS = 1;

export interface ServicesTrackProps {
  /** Stays pinned while the rail scrubs. */
  header: ReactNode;
  children: ReactNode;
}

export const ServicesTrack = ({ header, children }: ServicesTrackProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const [{ x }, api] = useSpring(() => ({ x: 0, config: SCRUB_CONFIG }));

  useLoop(
    () => {
      const wrapper = wrapperRef.current;
      const track = trackRef.current;
      if (!wrapper || !track) return;

      const viewport = window.innerHeight;
      const scrubbable =
        wrapper.offsetHeight -
        viewport * (1 + OVERLAY_VIEWPORTS + DWELL_VIEWPORTS);
      if (scrubbable <= 0) return;

      const progress = Math.min(
        Math.max(-wrapper.getBoundingClientRect().top / scrubbable, 0),
        1,
      );

      const travel = Math.max(track.scrollWidth - track.clientWidth, 0);
      api.start({ x: -progress * travel });
    },
    { framerate: EVERY_FRAME },
  );

  return (
    <div
      ref={wrapperRef}
      className="relative"
      style={{ height: `${RUNWAY_VIEWPORTS * 100}lvh` }}
    >
      <div className="sticky top-0 h-lvh overflow-hidden rounded-t-section bg-surface-section">
        {header}
        {/* `bottom-10` (`bottom-5` on mobile) keeps the gap under the rail equal
            to the side gutter; `top` is the knob for the gap under the heading,
            so pushing it down buys room by shortening the cards. */}
        <animated.div
          ref={trackRef}
          className="absolute top-[46%] right-0 bottom-5 left-5 flex gap-[0.625rem] will-change-transform md:left-10 lg:top-[39%] lg:bottom-10 lg:w-[85rem]"
          style={{ x }}
        >
          {children}
        </animated.div>
      </div>
    </div>
  );
};
