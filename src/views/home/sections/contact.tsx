// 📖 Docs: obsidian/frontend/components/home-sections.md

/**
 * Contact — Figma node `1575:274`, form panel `1574:747`.
 *
 * The last block, and the one that rides over Team: it carries the page
 * background and a higher stacking order, so scrolling lifts it over the
 * sticky Team rail.
 *
 * The mockup's `image 660` is another still of the DNA scene, so the live one
 * renders behind the form instead.
 */

import Link from "next/link";
import TextEngine from "spring-text-engine";

import { LazyDnaInk } from "@/components/scene/dna-ink";
import { ArrowUpRightIcon, DnaIcon } from "@/components/ui/icons";
import type { ContactContent } from "@/data/mocks/home";
import {
  BODY_MOTION,
  EYEBROW_MOTION,
  HEADING_MOTION,
} from "@/lib/motion/text-presets";

export interface ContactProps {
  content: ContactContent;
  privacyHref: string;
}

const FIELD_CLASSES =
  "w-full rounded-panel border border-border-input bg-surface-input px-8 py-6 text-base leading-body font-light placeholder:text-foreground-subtle focus-visible:border-accent focus-visible:outline-none";

export const Contact = ({ content, privacyHref }: ContactProps) => (
  <section
    id="contact"
    // `justify-start` + `pt-28`, not `justify-center`: the stacked content is
    // taller than the viewport on a phone, so centring pushed the heading up
    // under the fixed header instead of balancing anything.
    className="relative z-20 flex min-h-lvh flex-col gap-10 overflow-hidden rounded-t-section bg-surface-section px-5 pt-28 pb-20 md:px-10 lg:block lg:h-lvh lg:min-h-0 lg:p-0"
  >
    {/* Scene replaces `image 660`: x 113, width 1138 of the 1440 frame. Hidden
        below `lg` — a second WebGL context on a phone is a real cost, and the
        form is what matters on this screen. */}
    <div className="pointer-events-none hidden lg:absolute lg:inset-y-0 lg:left-[7.0625rem] lg:block lg:w-[71.125rem]">
      <LazyDnaInk className="block size-full" controls={false} />
    </div>

    <div className="flex flex-col gap-6 lg:absolute lg:top-[35.25%] lg:left-[2.5625rem] lg:w-[42.75rem] lg:gap-12">
      <div className="flex flex-col gap-4 lg:gap-8">
        <TextEngine
          tag="p"
          className="text-sm leading-body font-medium text-accent uppercase"
          {...EYEBROW_MOTION}
        >
          {content.eyebrow}
        </TextEngine>
        <TextEngine
          tag="h2"
          className="text-[2.25rem] leading-display font-light md:text-[3rem] lg:text-6xl"
          {...HEADING_MOTION}
        >
          {content.title}
        </TextEngine>
      </div>
      <TextEngine
        tag="p"
        className="text-base leading-body font-light lg:w-[27.6875rem]"
        {...BODY_MOTION}
      >
        {content.description}
      </TextEngine>
    </div>

    {/* Figma puts the panel at y 40, but the header CTA used to occupy that
        corner. The CTA now steps aside here (see `HeaderCta`), so the panel
        reaches up to the header's own top edge (`top-4`) and keeps the 40px
        gutter below. */}
    <div className="flex flex-col gap-8 rounded-card bg-surface-glass-strong p-6 backdrop-blur-glass-strong md:p-8 lg:absolute lg:top-4 lg:right-10 lg:bottom-10 lg:w-[35.0625rem] lg:gap-12">
      <div className="flex flex-col gap-6">
        <span className="grid size-[2.625rem] place-items-center rounded-mark bg-accent text-action-secondary">
          <DnaIcon className="size-6" />
        </span>
        {/* Static: a form panel's own title animating alongside the section
            heading beside it reads as two competing reveals on one screen. */}
        <h3 className="text-[1.75rem] leading-display font-light lg:text-[2.25rem]">
          {content.formTitle}
        </h3>
      </div>

      <form
        className="flex flex-1 flex-col gap-6"
        action="/api/contact"
        method="post"
      >
        {content.fields.map((field) => (
          <div key={field.name} className="flex flex-col gap-4">
            <label
              htmlFor={field.name}
              className="text-sm leading-body font-medium text-accent uppercase"
            >
              {field.label}
            </label>
            {field.type === "textarea" ? (
              <textarea
                id={field.name}
                name={field.name}
                rows={1}
                placeholder={field.placeholder}
                className={`${FIELD_CLASSES} resize-none`}
              />
            ) : (
              <input
                id={field.name}
                name={field.name}
                type={field.type}
                placeholder={field.placeholder}
                className={FIELD_CLASSES}
              />
            )}
          </div>
        ))}

        <p className="text-base leading-body font-light text-foreground-subtle">
          {content.consentLead}
          <Link href={privacyHref} className="text-foreground underline">
            {content.consentLinkLabel}
          </Link>
          {content.consentTail}
        </p>

        {/* Height comes from the mockup's 54px frame (node 1573:585), not from
            padding: padding around a 48px disc lands at 80 and blows the panel
            out of its box. `mt-auto` pins it to the bottom, as in Figma. */}
        <button
          type="submit"
          className="mt-auto flex h-[3.375rem] shrink-0 items-center justify-between rounded-action border border-action-primary-border bg-action-primary pr-0.5 pl-8 text-xl leading-body font-light text-action-primary-foreground transition-colors duration-[var(--duration-fast)] ease-entrance hover:bg-action-primary-border"
        >
          <span className="text-trim">{content.submitLabel}</span>
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-action-secondary text-action-secondary-foreground">
            <ArrowUpRightIcon className="size-4" />
          </span>
        </button>
      </form>
    </div>
  </section>
);
