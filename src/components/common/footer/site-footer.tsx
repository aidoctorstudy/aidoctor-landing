// 📖 Docs: obsidian/frontend/components/common.md

/**
 * Site footer — legal links only (ADR-0024). A Server Component: nothing
 * here needs state.
 *
 * Sits after `<Contact>` in flow, not inside `<main>` — it isn't part of the
 * page's main content, it's a landmark of its own ([[html-semantics]]).
 *
 * The four routes below (`/terms`, `/refunds`, `/cookies`, `/privacy`) are
 * real pages as of ADR-0029 — `views/legal/legal-page.tsx`, content in
 * `data/mocks/legal.ts`.
 */

import Link from "next/link";

export interface FooterLink {
  label: string;
  href: string;
}

export interface SiteFooterProps {
  brandName: string;
  links: readonly FooterLink[];
}

export const SiteFooter = ({ brandName, links }: SiteFooterProps) => (
  <footer className="bg-surface-section px-5 py-10 md:px-10">
    <div className="flex flex-col items-center gap-4 text-center">
      <p className="text-sm leading-body font-light text-foreground-subtle">
        © {new Date().getFullYear()} {brandName}
      </p>
      <nav aria-label="Legal">
        <ul className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm leading-body font-light text-foreground-subtle">
          {links.map((link, index) => (
            <li key={link.href} className="flex items-center gap-2">
              {index > 0 && <span aria-hidden="true">·</span>}
              <Link
                href={link.href}
                className="transition-colors duration-[var(--duration-fast)] ease-entrance hover:text-accent-soft"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  </footer>
);
