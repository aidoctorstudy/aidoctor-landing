// 📖 Docs: obsidian/frontend/components/home-sections.md

/**
 * App mockup — decorative browser-chrome frame around a static snippet of the
 * chat UI, dropped into Why Dantora (no Figma node — net new). Pure CSS/HTML,
 * no screenshot: a traffic-light row, a fake address bar, one user bubble and
 * one AI bubble, built from the same tokens as the real product's cards.
 *
 * Deliberately static, not the Live Demo's typing transcript — a second
 * animated chat this close to the first would read as a rerun rather than a
 * second feature. `aria-hidden`: the copy it shows is illustrative, already
 * covered by the section's real heading/description for assistive tech.
 */

import type { AppMockupContent } from "@/data/mocks/home";

export interface AppMockupProps {
  content: AppMockupContent;
  className?: string;
}

export const AppMockup = ({ content, className = "" }: AppMockupProps) => (
  <div
    aria-hidden="true"
    className={`overflow-hidden rounded-card border border-border-card bg-surface-card shadow-[var(--glow-accent)] backdrop-blur-glass ${className}`}
  >
    <div className="flex items-center gap-3 border-b border-border-card bg-surface-glass px-4 py-3">
      <span className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-accent/30" />
        <span className="size-2 rounded-full bg-accent/50" />
        <span className="size-2 rounded-full bg-accent" />
      </span>
      <span className="flex-1 truncate rounded-panel bg-surface-input px-3 py-1 text-xs leading-body font-light text-foreground-subtle">
        {content.url}
      </span>
    </div>

    <div className="flex flex-col gap-3 p-5">
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-panel bg-action-primary px-4 py-2.5 text-sm leading-body font-light text-action-primary-foreground">
          {content.question}
        </p>
      </div>
      <div className="flex justify-start">
        <p className="max-w-[85%] rounded-panel border border-border-card bg-surface-input px-4 py-2.5 text-sm leading-body font-light">
          {content.answer}
        </p>
      </div>
    </div>
  </div>
);
