"use client";

// 📖 Docs: obsidian/frontend/components/common.md

/**
 * Holds a subtree's entry animations until the preloader curtain has lifted.
 *
 * The hero is in view from the very first frame, so its `TextEngine` reveals
 * fire immediately — behind the curtain — and are long finished by the time
 * anyone sees the page. Two things are needed to fix that, and **both** matter:
 *
 * 1. `key` swaps when `revealed` flips, which remounts the subtree and re-arms
 *    every mount- and in-view-triggered animation inside it. This is what makes
 *    the reveal play at all.
 * 2. The subtree is `opacity-0` until then. Without it the first, pointless
 *    pass still ends at full opacity, and the frame in which the curtain is
 *    removed paints that finished text one tick before the remount resets it —
 *    read, correctly, as the animation playing twice.
 *
 * A remount, rather than conditional rendering: `children` are still
 * server-rendered inside this component, so the copy is in the initial HTML for
 * crawlers and for anyone without JavaScript. `opacity` is a binary state flip,
 * not a transition, so no animation rule applies to it.
 *
 * `className` lands on the same element, which is what lets this replace a
 * positioning wrapper rather than adding a second one — important in the hero,
 * where every block is absolutely placed at its artboard coordinates.
 */

import type { ReactNode } from "react";

import { usePreload } from "./preload-context";

export interface RevealOnReadyProps {
  children: ReactNode;
  /** Layout classes for the wrapper — positioning, width, stacking. */
  className?: string;
}

export const RevealOnReady = ({ children, className }: RevealOnReadyProps) => {
  const { revealed } = usePreload();
  const classes = [className, revealed ? null : "opacity-0"]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      key={revealed ? "revealed" : "loading"}
      className={classes || undefined}
    >
      {children}
    </div>
  );
};
