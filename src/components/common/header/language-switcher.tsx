"use client";

// 📖 Docs: obsidian/frontend/components/common.md

/**
 * Language switcher — the header's locale picker (ADR-0029).
 *
 * A native `<details>`/`<summary>` disclosure, not a hand-rolled
 * `useState` + ARIA dropdown — the same pattern the DNA Ink controls panel
 * already uses (see dna-ink-scene.md): keyboard-operable and labelled with
 * no extra ARIA plumbing, for free. Not spring-driven: showing/hiding a
 * native disclosure is browser behaviour, not motion the animation system
 * needs to own.
 *
 * Preserves the current page across a locale switch by stripping any
 * existing locale prefix off `usePathname()` and re-prefixing it with the
 * target locale (or leaving it bare for the unprefixed default).
 */

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LOCALE_LABELS, LOCALES, type Locale } from "@/lib/i18n/locales";

export interface LanguageSwitcherProps {
  locale: Locale;
  className?: string;
}

const stripLocalePrefix = (pathname: string): string => {
  const segments = pathname.split("/");
  const maybeLocale = segments[1];
  if ((LOCALES as readonly string[]).includes(maybeLocale)) {
    return `/${segments.slice(2).join("/")}`;
  }
  return pathname;
};

export const LanguageSwitcher = ({ locale, className = "" }: LanguageSwitcherProps) => {
  const pathname = usePathname();
  const bare = stripLocalePrefix(pathname || "/");

  return (
    <details className={`relative ${className}`}>
      <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm leading-body font-light text-foreground transition-colors duration-[var(--duration-fast)] ease-entrance hover:text-accent [&::-webkit-details-marker]:hidden">
        {LOCALE_LABELS[locale]}
      </summary>
      <ul className="absolute top-full right-0 z-10 mt-2 flex w-40 flex-col gap-1 rounded-panel border border-border-card bg-surface-glass-strong p-2 backdrop-blur-glass-strong">
        {LOCALES.map((entry) => (
          <li key={entry}>
            <Link
              href={entry === "en" ? bare || "/" : `/${entry}${bare}`}
              aria-current={entry === locale ? "page" : undefined}
              className={`block rounded-mark px-3 py-2 text-sm leading-body font-light transition-colors duration-[var(--duration-fast)] ease-entrance hover:bg-surface-chip ${
                entry === locale ? "text-accent" : "text-foreground"
              }`}
            >
              {LOCALE_LABELS[entry]}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
};
