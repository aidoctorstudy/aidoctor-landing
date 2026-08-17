"use client";

// 📖 Docs: obsidian/frontend/components/home-sections.md

/**
 * Team rail — a draggable horizontal slider.
 *
 * Native `overflow-x-auto` handles wheel, trackpad, touch and keyboard, but a
 * mouse cannot drag it — so pointer capture is layered on top: press, move,
 * release, writing `scrollLeft` directly. The click that ends a drag is
 * swallowed so a card link never fires from a drag.
 *
 * The 2px bar underneath (Figma node `1558:389`) is the position indicator: it
 * springs from `scrollLeft`, which is the only animated part (hard rule #1).
 */

import { animated, useSpring } from "@react-spring/web";
import {
  useRef,
  type PointerEvent as ReactPointerEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type UIEvent,
} from "react";

import { useLoop } from "@/hooks/animation/use-render-loop";

const PROGRESS_CONFIG = { tension: 260, friction: 38 };
/** How much of the remaining distance the rail closes each frame. */
const GLIDE = 0.18;
/** Velocity carried past release, in frames' worth of travel. */
const MOMENTUM = 14;
/** Below this the glide is finished and native scrolling takes back over. */
const SETTLE_PX = 0.5;
const EVERY_FRAME = 0;

const clampScroll = (rail: HTMLDivElement, value: number): number =>
  Math.min(Math.max(value, 0), rail.scrollWidth - rail.clientWidth);
/** The bar's resting fill when there is nothing to scroll (Figma: 890/1360). */
const MIN_FILL = 890 / 1360;
/** Pointer travel (px) past which a press counts as a drag, not a click. */
const DRAG_THRESHOLD = 4;

export interface TeamSliderProps {
  children: ReactNode;
}

export const TeamSlider = ({ children }: TeamSliderProps) => {
  const railRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);
  const dragStartScroll = useRef(0);
  const dragging = useRef(false);
  const moved = useRef(false);
  /** Where the rail is heading; the ticker eases `scrollLeft` toward it. */
  const target = useRef<number | null>(null);
  const velocity = useRef(0);
  const lastClientX = useRef(0);

  const [{ fill }, api] = useSpring(() => ({
    fill: MIN_FILL,
    config: PROGRESS_CONFIG,
  }));

  // Eases the rail toward `target` once per frame from the shared ticker. When
  // there is no target, native scrolling (wheel, trackpad, touch) is untouched.
  useLoop(
    () => {
      const rail = railRef.current;
      if (!rail || target.current === null) return;

      const distance = target.current - rail.scrollLeft;
      if (!dragging.current && Math.abs(distance) < SETTLE_PX) {
        target.current = null;
        return;
      }
      rail.scrollLeft += distance * GLIDE;
    },
    { framerate: EVERY_FRAME },
  );

  const syncProgress = (rail: HTMLDivElement) => {
    const scrollable = rail.scrollWidth - rail.clientWidth;
    if (scrollable <= 0) return;
    api.start({ fill: MIN_FILL + (1 - MIN_FILL) * (rail.scrollLeft / scrollable) });
  };

  const handleScroll = (event: UIEvent<HTMLDivElement>) =>
    syncProgress(event.currentTarget);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") return; // native touch scrolling is better
    // Stops the browser starting its own image/text drag, which silently steals
    // the pointer stream and leaves the rail stuck mid-gesture.
    event.preventDefault();
    const rail = event.currentTarget;
    dragging.current = true;
    moved.current = false;
    dragStartX.current = event.clientX;
    lastClientX.current = event.clientX;
    velocity.current = 0;
    // Grab from where the rail actually is, not from a stale glide target.
    dragStartScroll.current = rail.scrollLeft;
    target.current = rail.scrollLeft;
    rail.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const travelled = event.clientX - dragStartX.current;
    if (Math.abs(travelled) > DRAG_THRESHOLD) moved.current = true;
    velocity.current = lastClientX.current - event.clientX;
    lastClientX.current = event.clientX;
    // Set a target rather than writing scrollLeft: the ticker eases toward it,
    // which is what turns a 1:1 grab into a glide.
    target.current = clampScroll(
      event.currentTarget,
      dragStartScroll.current - travelled,
    );
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    dragging.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    // Carry the release velocity so the rail coasts instead of stopping dead.
    target.current = clampScroll(
      event.currentTarget,
      (target.current ?? event.currentTarget.scrollLeft) +
        velocity.current * MOMENTUM,
    );
    velocity.current = 0;
  };

  // A drag that ends over a card must not also open it.
  const handleClickCapture = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!moved.current) return;
    event.preventDefault();
    event.stopPropagation();
    moved.current = false;
  };

  return (
    <>
      <div
        ref={railRef}
        onScroll={handleScroll}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={handleClickCapture}
        // `pl-10` only: the rail runs to the viewport's right edge, as in the
        // mockup where the cards are cut off rather than boxed in.
        // `touch-action: pan-y` keeps vertical page scrolling on touch while we
        // own the horizontal axis. `[&_img]:pointer-events-none` is the other
        // half of the native-drag fix from `handlePointerDown`.
        // `scroll-behavior: auto` stops Lenis' smooth behaviour fighting the
        // direct `scrollLeft` writes and making the drag feel like rubber.
        // No scroll-snap. `snap-mandatory` re-snaps whenever the layout shifts,
        // and this section changes height as it becomes sticky — the rail was
        // silently landing on card two before anyone touched it. Snapping also
        // fights the drag-and-glide below, which already lands where you let go.
        className="flex min-h-0 flex-1 cursor-grab gap-[0.6875rem] overflow-x-auto overscroll-x-contain pl-5 touch-pan-y select-none [scroll-behavior:auto] active:cursor-grabbing md:pl-10 [-ms-overflow-style:none] [scrollbar-width:none] [&_img]:pointer-events-none [&::-webkit-scrollbar]:hidden"
      >
        {children}
        {/* Trailing gutter so the last card can clear the right edge. */}
        <span aria-hidden="true" className="w-10 shrink-0" />
      </div>

      {/* Figma: rail ends at 558, bar sits at 598 — a 40px gap, matching the
          page gutter (node 1558:389). */}
      <div className="relative mx-5 mt-6 h-[0.125rem] shrink-0 bg-border-subtle md:mx-10 lg:mt-10">
        <animated.div
          className="h-full origin-left bg-accent"
          style={{ transform: fill.to((value) => `scaleX(${value})`) }}
        />
      </div>
    </>
  );
};
