"use client";

// 📖 Docs: obsidian/frontend/components/home-sections.md

/**
 * Image trail that spawns cards along the cursor's path.
 *
 * Modelled on the "Recognize Yourself" block of
 * `flourish-with-laurin-textura.vercel.app`: every `SPAWN_DISTANCE` of pointer
 * travel pushes a card into a bounded list; `useTransition` scales it **in** at
 * the cursor, and dropping the oldest entry off the end of the list plays the
 * matching **out** transition. That is what gives the tail its dissolve — the
 * far end is leaving, not merely fading.
 *
 * Each card is centred on its spawn point and given a small random tilt, so a
 * dense trail reads as a scattered stack rather than a straight ribbon.
 *
 * Motion is `@react-spring/web` (hard rule #1). Enter is soft, leave is faster,
 * matching the reference's two configs.
 */

import { animated, useTransition } from "@react-spring/web";
import Image from "next/image";
import { useRef, useState, type PointerEvent, type ReactNode } from "react";

/** Pointer travel (px) between two spawns. */
const SPAWN_DISTANCE = 90;
/** Cards alive at once. Older ones are dropped, which plays their exit. */
const TRAIL_LENGTH = 5;
/** Maximum tilt either way, in degrees. */
const MAX_TILT = 12;

const ENTER_CONFIG = { tension: 130, friction: 28 };
const LEAVE_CONFIG = { tension: 300, friction: 24 };
/**
 * Opacity is deliberately near-instant.
 *
 * In the reference the fade is barely perceptible — the readable motion is the
 * scale. Running opacity on the same soft spring as scale made every card
 * spend its life half-transparent, which is not the effect.
 */
const OPACITY_CONFIG = { tension: 900, friction: 40 };

interface TrailCard {
  id: number;
  src: string;
  x: number;
  y: number;
  tilt: number;
}

export interface CursorTrailProps {
  images: readonly string[];
  /** Rendered inside the trail's hit area. */
  children?: ReactNode;
  className?: string;
}

export const CursorTrail = ({
  images,
  children,
  className = "",
}: CursorTrailProps) => {
  const [cards, setCards] = useState<TrailCard[]>([]);
  const nextId = useRef(0);
  const lastSpawn = useRef<{ x: number; y: number } | null>(null);

  const transitions = useTransition(cards, {
    keys: (card: TrailCard) => card.id,
    from: { opacity: 0, scale: 0.4 },
    enter: {
      opacity: 1,
      scale: 1,
      config: (key: string) =>
        key === "opacity" ? OPACITY_CONFIG : ENTER_CONFIG,
    },
    leave: {
      opacity: 0,
      scale: 0.4,
      config: (key: string) =>
        key === "opacity" ? OPACITY_CONFIG : LEAVE_CONFIG,
    },
  });

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    // A coarse pointer has no path to leave — it would spawn on every tap.
    if (event.pointerType !== "mouse") return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;

    const previous = lastSpawn.current;
    if (previous && Math.hypot(x - previous.x, y - previous.y) < SPAWN_DISTANCE) {
      return;
    }
    lastSpawn.current = { x, y };

    const id = nextId.current;
    nextId.current += 1;

    setCards((current) => [
      ...current.slice(-(TRAIL_LENGTH - 1)),
      {
        id,
        src: images[id % images.length],
        x,
        y,
        tilt: (Math.random() - 0.5) * 2 * MAX_TILT,
      },
    ]);
  };

  const handlePointerLeave = () => {
    lastSpawn.current = null;
    setCards([]);
  };

  return (
    <div
      className={`relative ${className}`}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {transitions((style, card) => (
          <animated.div
            className="absolute top-0 left-0 will-change-transform"
            style={{
              opacity: style.opacity,
              // Position is fixed at spawn; only scale is animated, so the
              // card grows in place instead of sliding to the cursor.
              transform: style.scale.to(
                (scale) =>
                  `translate3d(${card.x}px, ${card.y}px, 0) translate(-50%, -50%) rotate(${card.tilt}deg) scale(${scale})`,
              ),
            }}
          >
            <Image
              src={card.src}
              alt=""
              width={432}
              height={544}
              sizes="14rem"
              className="h-[17rem] w-[13.5rem] rounded-card object-cover"
            />
          </animated.div>
        ))}
      </div>
      {children}
    </div>
  );
};
