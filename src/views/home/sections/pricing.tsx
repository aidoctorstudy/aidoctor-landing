// 📖 Docs: obsidian/frontend/components/home-sections.md

/**
 * Pricing — net-new section, no Figma node (sits between Team and Contact).
 * Two cards: Free and Pro. Pro carries the `--glow-accent` token (a
 * cyan `box-shadow` role, globals.css) and a "Most Popular" badge — the only
 * two things that visually distinguish it from Free, everything else is the
 * same card shape so the pair reads as one system.
 */

import TextEngine from "spring-text-engine";

import { Inview } from "@/components/animation/springs/in-view";
import { Button } from "@/components/ui/button";
import { CheckIcon } from "@/components/ui/icons";
import type { PricingContent, PricingPlan } from "@/data/mocks/home";
import {
  BODY_MOTION,
  ELEMENT_MOTION,
  EYEBROW_MOTION,
  HEADING_MOTION,
} from "@/lib/motion/text-presets";

/** Card-to-card stagger, so Pro settles a beat after Free. */
const CARD_DELAY_STEP = 120;

const PlanCard = ({ plan, delayIn }: { plan: PricingPlan; delayIn: number }) => (
  <Inview
    {...ELEMENT_MOTION}
    delayIn={delayIn}
    tag="article"
    className={`relative flex w-full max-w-[24rem] flex-col gap-8 rounded-card border p-8 lg:w-[24rem] ${
      plan.highlighted
        ? "border-accent bg-surface-card shadow-[var(--glow-accent)]"
        : "border-border-card bg-surface-card"
    }`}
  >
    {plan.badge && (
      <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-chip bg-accent px-4 py-1.5 text-xs leading-body font-medium text-action-secondary-foreground uppercase">
        {plan.badge}
      </span>
    )}

    <div className="flex flex-col gap-2">
      <h3 className="text-xl leading-display font-light">{plan.name}</h3>
      <p className="text-sm leading-body font-light text-foreground-muted">
        {plan.description}
      </p>
    </div>

    <p className="flex items-end gap-1">
      <span className="text-5xl leading-display font-light">{plan.price}</span>
      <span className="pb-1 text-base leading-body font-light text-foreground-muted">
        {plan.period}
      </span>
    </p>

    <ul className="flex flex-1 flex-col gap-4">
      {plan.features.map((feature) => (
        <li key={feature} className="flex items-center gap-3 text-sm leading-body font-light">
          <span className="grid size-5 shrink-0 place-items-center rounded-full bg-action-outline-hover text-accent">
            <CheckIcon className="size-3" />
          </span>
          {feature}
        </li>
      ))}
    </ul>

    <Button
      href={plan.cta.href}
      variant={plan.highlighted ? "primary" : "secondary"}
      className="w-full"
    >
      {plan.cta.label}
    </Button>
  </Inview>
);

export interface PricingProps {
  content: PricingContent;
}

export const Pricing = ({ content }: PricingProps) => (
  // `z-20` + an opaque background, matching Contact: Team is `sticky top-0
  // z-10` and stays pinned "for the rest of the page" (team.tsx), so whatever
  // comes right after it in DOM needs a higher stacking context and its own
  // fill or Team shows through underneath it during the scroll handoff.
  <section
    id="pricing"
    className="relative z-20 rounded-t-section bg-background px-5 py-24 md:px-10 lg:py-32"
  >
    <div className="mx-auto flex w-full max-w-[44.75rem] flex-col items-center gap-4 text-center lg:gap-8">
      <TextEngine
        tag="p"
        className="w-full justify-center text-center text-sm leading-body font-medium text-accent uppercase"
        {...EYEBROW_MOTION}
      >
        {content.eyebrow}
      </TextEngine>
      <TextEngine
        tag="h2"
        className="w-full justify-center text-center text-[2.25rem] leading-display font-light md:text-[3rem] lg:text-6xl"
        {...HEADING_MOTION}
      >
        {content.title}
      </TextEngine>
      <TextEngine
        tag="p"
        className="w-full justify-center text-center text-base leading-body font-light lg:w-[27.625rem]"
        {...BODY_MOTION}
      >
        {content.description}
      </TextEngine>
    </div>

    <div className="mx-auto mt-12 flex w-full max-w-[52rem] flex-col items-center gap-8 lg:mt-16 lg:flex-row lg:items-stretch lg:justify-center">
      {content.plans.map((plan, index) => (
        <PlanCard key={plan.name} plan={plan} delayIn={index * CARD_DELAY_STEP} />
      ))}
    </div>

    <Inview
      {...ELEMENT_MOTION}
      delayIn={content.plans.length * CARD_DELAY_STEP}
      tag="p"
      className="mt-8 text-center text-sm leading-body font-light text-foreground-muted"
    >
      {content.discountNote}
    </Inview>
  </section>
);
