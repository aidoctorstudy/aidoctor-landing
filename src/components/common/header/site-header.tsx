// 📖 Docs: obsidian/frontend/components/common.md

/**
 * Site header — Figma node `1575:267`.
 *
 * Fixed to the viewport, so it rides over every section while scrolling. It is
 * a Server Component: nothing here needs state, and `position: fixed` alone
 * does not require the client. The frosted panels are `--surface-glass` over
 * `backdrop-blur-glass`, which is what lets the WebGL backdrop show through.
 *
 * The bar itself is `pointer-events-none` so the 40px gutters either side of
 * the panels don't swallow clicks meant for the scene beneath; each panel
 * switches them back on.
 */

import Image from "next/image";
import Link from "next/link";

import { LanguageSwitcher } from "@/components/common/header/language-switcher";
import type { CtaLink, NavLink } from "@/data/mocks/home";
import type { Locale } from "@/lib/i18n/locales";

import { HeaderCta } from "./header-cta";
import { MobileMenu } from "./mobile-menu";

export interface SiteHeaderProps {
  brandName: string;
  navLinks: readonly NavLink[];
  cta: CtaLink;
  locale: Locale;
}

const GLASS_PANEL =
  "pointer-events-auto rounded-panel bg-surface-glass backdrop-blur-glass";

export const SiteHeader = ({
  brandName,
  navLinks,
  cta,
  locale,
}: SiteHeaderProps) => (
  <header className="pointer-events-none fixed inset-x-0 top-4 z-50 px-5 md:px-10">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-[0.5rem]">
        <Link
          href="#hero"
          className={`${GLASS_PANEL} flex h-[3.375rem] w-[9.3125rem] items-center gap-3 pr-4 pl-1.5`}
        >
          {/* Real logo (ADR-0029) — `next/image` from `public/logo.png`,
              not the old currentColor `DnaIcon` mark it replaced. */}
          <span className="grid size-[2.625rem] shrink-0 place-items-center">
            <Image
              src="/logo.png"
              alt=""
              width={237}
              height={274}
              className="size-full object-contain"
              priority
            />
          </span>
          <span className="text-xl leading-display font-light">
            {brandName}
          </span>
        </Link>

        {/* 54px tall, at the mockup's 157px offset from the logo (node
            1572:525). Width is `w-fit`, not the original 422px fixed value —
            AI Doctor Study's nav carries 5 labels (incl. "How it Works")
            instead of the Figma source's 4, so a fixed width from that spec
            would overflow the pill. Below `lg` the links move into
            `MobileMenu` — five inline links plus the logo and a pill CTA do
            not fit a phone bar. */}
        <nav
          aria-label="Primary"
          className={`${GLASS_PANEL} hidden h-[3.375rem] w-fit items-center px-9 lg:flex`}
        >
          <ul className="flex items-center gap-[2.625rem]">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-base leading-body font-light transition-colors duration-[var(--duration-fast)] ease-entrance hover:text-accent"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* The pill CTA is desktop-only. Collapsing it to a bare arrow disc on a
          phone read as a broken control — the burger carries the same action
          inside the panel instead. The language switcher rides along in its
          own glass pill (mobile carries it inside the burger panel). */}
      <div className="hidden items-center gap-3 lg:flex">
        <LanguageSwitcher locale={locale} className={`${GLASS_PANEL} px-4 py-2`} />
        <HeaderCta cta={cta} hideWhenVisibleId="contact" />
      </div>

      <MobileMenu
        navLinks={navLinks}
        cta={cta}
        locale={locale}
        panelClassName={GLASS_PANEL}
      />
    </div>
  </header>
);
