// 📖 Docs: obsidian/frontend/components/home-sections.md

/**
 * Services — Figma node `1575:268` (section 1440×800), cards `1574:680`.
 *
 * Every offset is the mockup's own: title at 40,64 (684 wide), eyebrow at
 * 1068,64, description at 1068,124 (332 wide), rail at 40,237 with 523-tall
 * cards spaced 10px apart. The opener is 561 wide, the rest 447.
 */

import Link from "next/link";
import TextEngine from "spring-text-engine";

import { ArrowUpRightIcon } from "@/components/ui/icons";
import { APP_URL, type SectionIntro, type ServiceCard } from "@/data/mocks/home";
import {
  BODY_MOTION,
  EYEBROW_MOTION,
  HEADING_MOTION,
} from "@/lib/motion/text-presets";

import { ServicesTrack } from "./services-track";

export interface ServicesProps {
  intro: SectionIntro;
  cards: readonly ServiceCard[];
}

// The pinned rail dictates height at every size; only width and padding change.
const CARD_BASE =
  "relative flex h-full w-[78vw] max-w-[22rem] shrink-0 flex-col justify-between overflow-hidden rounded-card p-6 lg:max-w-none lg:p-8";

const CARD_VARIANT: Record<ServiceCard["variant"], string> = {
  // "lime" is a legacy name from the Dantora data model (`ServiceCard.variant`
  // in data/mocks/home.ts) — ADR-0024 dropped the actual light-lime fill for a
  // dark glass card with a cyan border, matching the other feature cards. It
  // can rely on the ambient white `--foreground` again, same as `photo`/`brand`.
  lime: "border border-border-card bg-surface-card backdrop-blur-glass lg:w-[35.0625rem]",
  // ADR-0027: was a full-bleed stock photo (`<Image fill>`); now a dark
  // medical-themed gradient card with a decorative emoji instead — see
  // `card.emoji` below.
  photo: "bg-[image:var(--raw-gradient-feature-card)] text-white lg:w-[27.9375rem]",
  brand: "bg-accent text-white lg:w-[27.9375rem]",
};

export const Services = ({ intro, cards }: ServicesProps) => (
  <section id="features" className="relative bg-background">
    <ServicesTrack
      header={
        // Figma puts the heading at y 64 of 800 (8%), but the fixed header
        // occupies the top 8.75% of every screen — unlike the artboard, where
        // it only overlaps the hero. Pushed to 14% so it clears, and the rail
        // and card height come down to match rather than overflowing.
        // Positioning lives on wrapper divs, never on the TextEngine itself:
        // TextEngine sets `position: relative` as an **inline style**, which
        // beats a Tailwind `absolute` class. Put `absolute` on the engine and
        // its `top`/`left` silently become relative offsets — the eyebrow and
        // description dropped below the heading and stretched full width.
        // Mobile: a stacked intro in flow above the rail. Desktop: pinned at
        // the artboard's coordinates. 43.5rem, not Figma's 42.75 — TextEngine's
        // word boxes are a hair wider than laid-out text, and at 42.75 the
        // heading tipped onto a third line the card rail then covered.
        <div className="flex flex-col gap-4 px-5 pt-24 md:px-10 lg:block lg:p-0">
          <div className="lg:absolute lg:top-[14%] lg:left-[66.75rem] lg:w-[20.75rem]">
            <TextEngine
              tag="p"
              className="text-sm leading-body font-medium text-accent uppercase"
              {...EYEBROW_MOTION}
            >
              {intro.eyebrow}
            </TextEngine>
          </div>
          <div className="lg:absolute lg:top-[14%] lg:left-10 lg:w-[43.5rem]">
            <TextEngine
              tag="h2"
              className="text-[2.25rem] leading-display font-light md:text-[3rem] lg:text-6xl"
              {...HEADING_MOTION}
            >
              {intro.title}
            </TextEngine>
          </div>
          <div className="lg:absolute lg:top-[21%] lg:left-[66.75rem] lg:w-[20.75rem]">
            <TextEngine
              tag="p"
              className="text-base leading-body font-light"
              {...BODY_MOTION}
            >
              {intro.description}
            </TextEngine>
          </div>
        </div>
      }
    >
      {cards.map((card) => (
        <article
          key={card.index}
          className={`${CARD_BASE} ${CARD_VARIANT[card.variant]}`}
        >
          <div className="flex flex-col gap-4 lg:gap-6">
            {/* Decorative stand-in for the old stock photo (ADR-0027) — the
                title text already names the feature, so screen readers skip
                this. */}
            {card.emoji && (
              <span
                aria-hidden="true"
                className="text-4xl leading-none lg:text-5xl"
              >
                {card.emoji}
              </span>
            )}
            <p className="text-base leading-body lg:text-xl">{card.index}</p>
            {/* Static on purpose — see HEADING_MOTION's note. Five card titles
                revealing themselves while the rail scrubs past is noise. */}
            <h3 className="text-[1.5rem] leading-display font-light lg:text-[2rem]">
              {card.title}
            </h3>
          </div>

          {/* Figma stacks row / rule / row with a flat `gap-24` and no padding
              on the rows themselves (node 1574:678). Padding on the rows
              instead double-counts the gap and spreads the list. `border-card`
              (cyan-alpha), not `border-subtle`, so it matches this card's own
              outer border tone rather than the page-level divider colour. */}
          {card.items && (
            <ul className="flex flex-col gap-4 lg:w-[31.0625rem] lg:gap-6">
              {card.items.map((item, index) => (
                <li key={item} className="flex flex-col gap-4 lg:gap-6">
                  {index > 0 && (
                    <span
                      aria-hidden="true"
                      className="h-px w-full bg-border-card"
                    />
                  )}
                  <span className="text-base leading-body lg:text-xl">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {/* `items-end`: Figma places the ring at y 48 of the 72-tall row
              (node 1574:611), sitting on the row's baseline. */}
          {card.cta && (
            <div className="flex items-end justify-end">
              {/* Node 1558:347: a 72px ring — 1px white stroke, no fill — not
                  the filled lime disc the buttons use. Links straight to
                  sign-up, same as every other CTA on the page. */}
              <Link
                href={APP_URL}
                aria-label="Sign up for free"
                className="grid size-14 place-items-center rounded-full border border-white text-white transition-colors duration-[var(--duration-fast)] ease-entrance hover:bg-white hover:text-accent lg:size-[4.5rem]"
              >
                <ArrowUpRightIcon className="size-[1.1875rem]" />
              </Link>
            </div>
          )}
        </article>
      ))}
    </ServicesTrack>
  </section>
);
