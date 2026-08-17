// 📖 Docs: obsidian/frontend/components/common.md
"use client";

import type { ReactNode } from "react";

/**
 * Cookie-scoped button primitive. Two variants matching the project's
 * white/dark surfaces — replaces the external `SimpleButton` the component
 * shipped with. Hover states snap (the project bans CSS transitions; real
 * motion goes through @react-spring/web).
 */
export interface CookieButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary";
}

const base =
  "rounded-lg px-4 py-2 text-sm font-medium leading-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";

const variants: Record<NonNullable<CookieButtonProps["variant"]>, string> = {
  // Matches the site's own primary/outline button colours (ADR-0024) rather
  // than a generic foreground-inverted style, so this banner reads as part of
  // the same product instead of a bolted-on library default.
  primary:
    "bg-action-primary text-action-primary-foreground hover:bg-action-primary-hover",
  secondary:
    "border border-action-outline-border bg-transparent text-action-outline-foreground hover:bg-action-outline-hover",
};

export const CookieButton = ({
  children,
  onClick,
  variant = "primary",
}: CookieButtonProps) => (
  <button type="button" onClick={onClick} className={`${base} ${variants[variant]}`}>
    {children}
  </button>
);
