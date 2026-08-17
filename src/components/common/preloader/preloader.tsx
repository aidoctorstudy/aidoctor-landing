"use client";

// 📖 Docs: obsidian/frontend/components/common.md

/**
 * Brand curtain shown while the page loads.
 *
 * Three parts, all driven by one `progress` spring:
 * a ring that draws clockwise from twelve o'clock, the DNA mark filling
 * diagonally from its lower-left, and a percentage counter.
 *
 * When loading finishes the curtain **clips away bottom-to-top** — the panel's
 * bottom edge travels up, so the page is uncovered from the bottom of the
 * viewport. On its way out it calls `markRevealed()`, which is what releases
 * the hero's text animations (see [[RevealOnReady]]); without that hand-off the
 * hero would animate behind the curtain and be finished by the time anyone
 * saw it.
 *
 * Motion is `@react-spring/web` throughout (hard rule #1).
 */

import { animated, useSpring } from "@react-spring/web";
import { useEffect, useRef, useState } from "react";

import { brandMarkDataUri } from "@/lib/brand-mark";
import { siteConfig } from "@/lib/site";

import { usePreload } from "./preload-context";

/** Ring geometry, in the SVG's own units. */
const RING_SIZE = 400;
const RING_RADIUS = 180;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/**
 * How far the bar crawls before the page is actually ready.
 *
 * A progress bar that sits at 0 until `load` fires and then snaps to 100 tells
 * the viewer nothing. This creeps to 85% on its own, then completes for real.
 */
const CREEP_TARGET = 0.85;
const CREEP_CONFIG = { tension: 12, friction: 30 };
/** Brisk once the real signal lands — no reason to dawdle at the end. */
const COMPLETE_CONFIG = { tension: 90, friction: 26 };
const CURTAIN_CONFIG = { tension: 90, friction: 24 };
/** Beat at 100% before the curtain moves, so the number can be read. */
const HOLD_MS = 400;

/**
 * How far the curtain has travelled before the hero is told to animate.
 *
 * Waiting for `onRest` is too late: the reveal then *starts* on a page that is
 * already fully uncovered, so the visitor watches an empty layout for the
 * length of the stagger. The hero copy sits at 28.55% from the top and is
 * therefore still covered at this point — the animation begins underneath the
 * last of the panel and is already in flight when the panel clears it, which is
 * what makes the two read as one gesture instead of two.
 */
const REVEAL_AT_INSET = 60;

export const Preloader = () => {
  const { loaded, revealed, markRevealed } = usePreload();
  const [lifting, setLifting] = useState(false);
  const [gone, setGone] = useState(false);
  /** Latches the one-shot hand-off, which `onChange` would otherwise repeat. */
  const releasedRef = useRef(false);

  const [{ progress }] = useSpring(
    () => ({
      from: { progress: 0 },
      to: { progress: loaded ? 1 : CREEP_TARGET },
      config: loaded ? COMPLETE_CONFIG : CREEP_CONFIG,
    }),
    [loaded],
  );

  // Hold at 100% for a beat, then start the curtain.
  useEffect(() => {
    if (!loaded) return;
    const timer = setTimeout(() => setLifting(true), HOLD_MS);
    return () => clearTimeout(timer);
  }, [loaded]);

  const curtain = useSpring({
    // `inset(0 0 B 0)` trims from the bottom edge upward, so the panel's
    // remaining sliver is its top — the page is uncovered from the bottom.
    bottomInset: lifting ? 100 : 0,
    config: CURTAIN_CONFIG,
    // Per-key handler, so the argument is this value rather than the whole
    // controller. Fires every frame while the curtain moves, hence the latch.
    onChange: {
      bottomInset: (result) => {
        if (!lifting || releasedRef.current) return;
        if (result.value < REVEAL_AT_INSET) return;
        releasedRef.current = true;
        markRevealed();
      },
    },
    onRest: () => {
      if (!lifting) return;
      // Belt and braces: if the spring somehow rests without ever crossing the
      // threshold, the hero must still be released.
      releasedRef.current = true;
      markRevealed();
      setGone(true);
    },
  });

  // Lock scrolling until the page is actually usable.
  useEffect(() => {
    if (revealed) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [revealed]);

  if (gone) return null;

  return (
    <animated.div
      aria-hidden="true"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-16 bg-accent will-change-[clip-path]"
      style={{
        clipPath: curtain.bottomInset.to(
          (value) => `inset(0% 0% ${value}% 0%)`,
        ),
      }}
    >
      <div className="relative grid size-[min(60vw,22rem)] place-items-center">
        <svg
          viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
          fill="none"
          className="absolute inset-0 size-full -rotate-90"
        >
          <animated.circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke={siteConfig.brand.lime}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={progress.to(
              (value) => RING_CIRCUMFERENCE * (1 - value),
            )}
          />
        </svg>

        {/* Unfilled mark: the same glyph, barely lighter than the backdrop, so
            the lime fill reads as filling something rather than appearing. */}
        <div className="relative size-[38%]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={brandMarkDataUri("rgba(224,242,254,0.14)")}
            alt=""
            className="absolute inset-0 size-full"
          />
          <animated.div
            className="absolute inset-0"
            style={{
              // A hard stop on a 45° gradient: everything before it is opaque,
              // everything after is cut away — a straight diagonal edge
              // sweeping from the lower-left corner to the upper-right.
              maskImage: progress.to(
                (value) =>
                  `linear-gradient(45deg, #000 ${value * 100}%, transparent ${value * 100}%)`,
              ),
              WebkitMaskImage: progress.to(
                (value) =>
                  `linear-gradient(45deg, #000 ${value * 100}%, transparent ${value * 100}%)`,
              ),
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={brandMarkDataUri(siteConfig.brand.lime)}
              alt=""
              className="size-full"
            />
          </animated.div>
        </div>
      </div>

      <animated.p className="text-[2.5rem] leading-display font-light text-white tabular-nums">
        {progress.to((value) => `${Math.round(value * 100)}%`)}
      </animated.p>
    </animated.div>
  );
};
