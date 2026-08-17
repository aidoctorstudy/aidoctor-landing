"use client";

// 📖 Docs: obsidian/frontend/components/home-sections.md

/**
 * Burger menu — the small-screen half of the header.
 *
 * Below `lg` the desktop bar cannot fit five links, a logo and a pill CTA, so
 * the nav collapses behind a single toggle. The panel carries the same links
 * plus the Contact action, so nothing is unreachable on a phone.
 *
 * Motion is a `@react-spring/web` transition (hard rule #1) — the panel scales
 * and fades from the toggle rather than sliding, which keeps it visually
 * anchored to the button that opened it.
 *
 * Accessibility: a real `<button>` with `aria-expanded` / `aria-controls`,
 * Escape closes, the page behind is scroll-locked while open, and every link
 * closes on activation so the anchor jump lands on a scrollable page.
 */

import { animated, useTransition } from "@react-spring/web";
import Link from "next/link";
import { useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import type { CtaLink, NavLink } from "@/data/mocks/home";

const PANEL_SPRING = { tension: 260, friction: 30 };

export interface MobileMenuProps {
  navLinks: readonly NavLink[];
  cta: CtaLink;
  /** Same frosted-panel treatment as the rest of the header. */
  panelClassName: string;
}

export const MobileMenu = ({
  navLinks,
  cta,
  panelClassName,
}: MobileMenuProps) => {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);

    // Lock the page while the panel covers it, and restore whatever the value
    // was rather than assuming it was `visible`.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const transitions = useTransition(open, {
    from: { opacity: 0, scale: 0.94 },
    enter: { opacity: 1, scale: 1 },
    leave: { opacity: 0, scale: 0.94 },
    config: PANEL_SPRING,
  });

  return (
    <div className="pointer-events-auto relative lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((value) => !value)}
        className={`${panelClassName} flex size-[3.375rem] items-center justify-center`}
      >
        <span aria-hidden="true" className="flex flex-col gap-[0.3125rem]">
          <span
            className={`block h-px w-5 bg-foreground transition-transform duration-[var(--duration-normal)] ease-entrance ${
              open ? "translate-y-[0.34375rem] rotate-45" : ""
            }`}
          />
          <span
            className={`block h-px w-5 bg-foreground transition-opacity duration-[var(--duration-fast)] ease-entrance ${
              open ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block h-px w-5 bg-foreground transition-transform duration-[var(--duration-normal)] ease-entrance ${
              open ? "-translate-y-[0.34375rem] -rotate-45" : ""
            }`}
          />
        </span>
      </button>

      {transitions(
        (style, isOpen) =>
          isOpen && (
            <animated.nav
              id={panelId}
              aria-label="Primary"
              style={{ opacity: style.opacity, scale: style.scale }}
              className={`${panelClassName} absolute top-[4.125rem] right-0 flex w-[min(18rem,calc(100vw-2.5rem))] origin-top-right flex-col gap-2 p-5`}
            >
              <ul className="flex flex-col">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="block py-3 text-lg leading-body font-light transition-colors duration-[var(--duration-fast)] ease-entrance hover:text-accent"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <Button
                href={cta.href}
                withArrow
                className="w-full justify-between"
              >
                {cta.label}
              </Button>
            </animated.nav>
          ),
      )}
    </div>
  );
};
