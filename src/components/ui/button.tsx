// 📖 Docs: obsidian/frontend/components/ui.md

/**
 * Pill action — the design's only button shape.
 *
 * Figma nodes `1546:199` (primary), `1546:201` (secondary) and `1572:533`
 * (primary with the trailing arrow disc). Renders a real `<a>` when `href` is
 * given and a real `<button>` otherwise, so the element always matches what it
 * does ([[html-semantics]]).
 */

import Link from "next/link";
import type { ReactNode } from "react";

import { ArrowUpRightIcon } from "@/components/ui/icons";

export type ButtonVariant = "primary" | "secondary";

export interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  /** Renders an `<a>`; omit for a `<button>`. */
  href?: string;
  /** Trailing arrow disc, as on the header's "Contact Us". */
  withArrow?: boolean;
  /** Only meaningful without `href`. */
  type?: "button" | "submit";
  className?: string;
}

const BASE_CLASSES =
  "inline-flex items-center justify-center rounded-action border text-xl leading-body font-light whitespace-nowrap transition-colors duration-[var(--duration-fast)] ease-entrance";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-action-primary border-action-primary-border text-action-primary-foreground hover:bg-action-primary-hover",
  // Outline/ghost treatment (ADR-0024) — transparent fill, cyan border and
  // text, replacing the old solid-lime pill now that the palette is cyan.
  secondary:
    "border-action-outline-border bg-transparent text-action-outline-foreground hover:bg-action-outline-hover",
};

// Heights come straight from the mockup's frames — 48 for a plain pill
// (`1546:199`), 54 for the arrow variant (`1572:533`), where the 48px disc sits
// with only 3px either side. Driving height by padding instead lands at 80 and
// throws the header off by half its height.
const SIZE_CLASSES = {
  plain: "h-12 px-8",
  arrow: "h-[3.375rem] gap-2.5 pr-0.5 pl-8",
};

export const Button = ({
  children,
  variant = "primary",
  href,
  withArrow = false,
  type = "button",
  className = "",
}: ButtonProps) => {
  const classes = [
    BASE_CLASSES,
    VARIANT_CLASSES[variant],
    withArrow ? SIZE_CLASSES.arrow : SIZE_CLASSES.plain,
    className,
  ].join(" ");

  const content = (
    <>
      <span className="text-trim">{children}</span>
      {withArrow && (
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-action-secondary text-action-secondary-foreground">
          <ArrowUpRightIcon className="size-4" />
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} className={classes}>
      {content}
    </button>
  );
};
