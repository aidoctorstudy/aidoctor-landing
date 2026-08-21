// 📖 Docs: obsidian/frontend/components/home-sections.md

/**
 * Shared view for the four legal pages (/terms, /refunds, /cookies,
 * /privacy) — one component instead of four near-duplicates, per
 * `LegalPageContent` (`data/mocks/legal.ts`). ADR-0029.
 *
 * A Server Component: nothing here needs state, so this stays static/plain
 * HTML+CSS — no motion, matching the utilitarian nature of a legal page
 * (the design system's spring-first rule (hard rule #1) applies to the
 * *marketing* experience; a wall of legal text reading via plain semantic
 * HTML is the correct choice here, not an omission).
 *
 * Site chrome (`SiteHeader`/`SiteFooter`) isn't part of the `(marketing)`
 * root layout — `HomeView` renders it itself — so this view renders it too,
 * for the same nav/footer on every marketing route.
 */

import type { ReactNode } from "react";

import { SiteFooter } from "@/components/common/footer/site-footer";
import { SiteHeader } from "@/components/common/header/site-header";
import { Button } from "@/components/ui/button";
import type { LegalBlock, LegalPageContent, LegalRun } from "@/data/mocks/legal";
import { getSiteChrome } from "@/lib/i18n/content";
import type { Locale } from "@/lib/i18n/locales";

const TONE_CLASSES: Record<"info" | "warning" | "danger", string> = {
  info: "border-border-card bg-surface-card",
  warning: "border-state-warning-border bg-state-warning-soft",
  danger: "border-state-danger-border bg-state-danger-soft",
};

const TONE_LABEL_CLASSES: Record<"info" | "warning" | "danger", string> = {
  info: "text-accent-soft",
  warning: "text-state-warning",
  danger: "text-state-danger",
};

const renderRuns = (runs: readonly LegalRun[]): ReactNode =>
  runs.map((run, index) => {
    const content = run.bold ? <strong>{run.text}</strong> : run.text;
    if (!run.href) return <span key={index}>{content}</span>;

    const isExternal = run.href.startsWith("http");
    return (
      <a
        key={index}
        href={run.href}
        {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="text-accent-soft underline underline-offset-2 transition-colors duration-[var(--duration-fast)] ease-entrance hover:text-accent"
      >
        {content}
      </a>
    );
  });

const LegalBlockView = ({ block }: { block: LegalBlock }) => {
  switch (block.type) {
    case "paragraph":
      return (
        <p className="text-base leading-body font-light text-foreground-muted">
          {renderRuns(block.runs)}
        </p>
      );
    case "list":
      return (
        <ul className="flex list-disc flex-col gap-3 pl-5 text-base leading-body font-light text-foreground-muted">
          {block.items.map((item, index) => (
            <li key={index}>{renderRuns(item)}</li>
          ))}
        </ul>
      );
    case "callout":
      return (
        <div className={`flex flex-col gap-3 rounded-card border p-6 ${TONE_CLASSES[block.tone]}`}>
          <p className={`text-xs leading-body font-medium uppercase ${TONE_LABEL_CLASSES[block.tone]}`}>
            {block.label}
          </p>
          {block.paragraphs.map((paragraph, index) => (
            <p key={index} className="text-base leading-body font-light">
              {renderRuns(paragraph)}
            </p>
          ))}
        </div>
      );
    case "table":
      return (
        <div className="overflow-x-auto rounded-card border border-border-card">
          <table className="w-full min-w-[36rem] text-left text-sm leading-body font-light">
            <thead>
              <tr className="border-b border-border-card">
                {block.headers.map((header) => (
                  <th
                    key={header}
                    scope="col"
                    className="p-4 text-xs leading-body font-medium text-accent-soft uppercase"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-border-card last:border-0">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="p-4 align-top text-foreground-muted">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
};

export interface LegalPageProps {
  content: LegalPageContent;
  locale: Locale;
}

export const LegalPageView = ({ content, locale }: LegalPageProps) => {
  const chrome = getSiteChrome(locale);

  return (
    <>
      <SiteHeader
        brandName={chrome.brandName}
        navLinks={chrome.siteNav}
        cta={chrome.headerCta}
        loginCta={chrome.loginCta}
        locale={locale}
      />
    <main className="bg-background px-5 pt-32 pb-20 md:px-10">
      <div className="mx-auto flex w-full max-w-[48rem] flex-col gap-10">
        <header className="flex flex-col gap-4">
          <p className="text-sm leading-body font-medium text-accent uppercase">
            {content.eyebrow}
          </p>
          <h1 className="text-[2.25rem] leading-display font-light md:text-5xl">
            {content.title}
          </h1>
          <p className="text-sm leading-body font-light text-foreground-subtle">
            Last updated: {content.lastUpdated} · {content.scope}
          </p>
        </header>

        <div className="flex flex-col gap-3 rounded-card border border-border-card bg-surface-card p-6 md:p-8">
          <p className="text-xs leading-body font-medium text-accent-soft uppercase">
            The short version
          </p>
          <ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-body font-light text-foreground-muted">
            {content.summary.map((runs, index) => (
              <li key={index}>{renderRuns(runs)}</li>
            ))}
          </ul>
        </div>

        <nav
          aria-label="Contents"
          className="rounded-card border border-border-card bg-surface-card p-6 md:p-8"
        >
          <p className="mb-3 text-xs leading-body font-medium text-accent-soft uppercase">
            Contents
          </p>
          <ol className="grid grid-cols-1 gap-2 text-sm leading-body font-light sm:grid-cols-2">
            {content.sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="text-foreground-subtle transition-colors duration-[var(--duration-fast)] ease-entrance hover:text-accent-soft"
                >
                  {section.number}. {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {content.sections.map((section) => (
          <section key={section.id} id={section.id} className="flex scroll-mt-28 flex-col gap-4">
            <h2 className="flex items-baseline gap-3 text-xl leading-display font-light">
              <span className="text-sm leading-body font-medium text-accent tabular-nums">
                {section.number}
              </span>
              {section.title}
            </h2>
            {section.blocks.map((block, index) => (
              <LegalBlockView key={index} block={block} />
            ))}
          </section>
        ))}

        <div className="flex justify-center pt-6">
          <Button href="/" variant="secondary" className="w-fit px-8">
            Back to home
          </Button>
        </div>
      </div>
    </main>
    <SiteFooter brandName={chrome.brandName} links={chrome.footerLinks} />
  </>
  );
};
