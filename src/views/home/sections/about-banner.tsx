// 📖 Docs: obsidian/frontend/components/home-sections.md

/**
 * About banner — ADR-0027.
 *
 * Was a parallax photo (image 150% of its frame, drifting against scroll via
 * a spring off the shared ticker — hard rule #1). Replaced with a static CSS
 * gradient + grid pattern: there's no photo to crop/drift anymore, and a flat
 * decorative backdrop doesn't need motion, so this dropped the spring, the
 * ticker subscription and `"use client"` entirely — a plain Server Component.
 */

export interface AboutBannerProps {
  className?: string;
}

export const AboutBanner = ({ className = "" }: AboutBannerProps) => (
  <div
    aria-hidden="true"
    className={`bg-[image:var(--raw-background-about-banner)] bg-[length:100%_100%,2.5rem_2.5rem] ${className}`}
  />
);
