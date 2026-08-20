import { FloatingCta } from "@/components/common/floating-cta";
import { SiteFooter } from "@/components/common/footer/site-footer";
import { SiteHeader } from "@/components/common/header/site-header";
import { getHomeContent, getSiteChrome } from "@/lib/i18n/content";
import type { Locale } from "@/lib/i18n/locales";

import { About } from "./sections/about";
import { Contact } from "./sections/contact";
import { Hero } from "./sections/hero";
import { LiveDemo } from "./sections/live-demo";
import { Pricing } from "./sections/pricing";
import { Services } from "./sections/services";
import { Team } from "./sections/team";
import { WhyDantora } from "./sections/why-dantora";

/**
 * Home view — a Server Component assembling the AI Doctor Study landing page.
 *
 * Sections run in Figma order and take their copy through props, so nothing
 * is hardcoded in a component (component-conventions.md). Live Demo and
 * Pricing are net-new (no Figma node): Live Demo sits between Features and
 * About, Pricing between Team and Contact.
 *
 * The two overlay reveals are pure flow order, no scroll listeners: Services
 * and Team are `sticky`, and the blocks after them carry the page background
 * plus a higher `z-index`, so scrolling lifts each one over the block it
 * follows.
 *
 * `locale` (ADR-0029) resolves the actual copy via `getHomeContent`/
 * `getSiteChrome` — English is the TS source in `data/mocks/home.ts`, other
 * locales read a committed JSON override (or fall back to English if none
 * exists yet). See `lib/i18n/content.ts`'s docstring for the full contract.
 */
export interface HomeViewProps {
  locale: Locale;
}

export const HomeView = ({ locale }: HomeViewProps) => {
  const content = getHomeContent(locale);
  const chrome = getSiteChrome(locale);

  return (
    <>
      <SiteHeader
        brandName={chrome.brandName}
        navLinks={chrome.siteNav}
        cta={chrome.headerCta}
        locale={locale}
      />
      <main>
        <Hero content={content.hero} />
        <WhyDantora content={content.why} />
        <Services intro={content.servicesIntro} cards={content.serviceCards} />
        <LiveDemo content={content.liveDemo} />
        <About content={content.about} />
        <Team content={content.team} />
        <Pricing content={content.pricing} />
        <Contact content={content.contact} />
      </main>
      <SiteFooter brandName={chrome.brandName} links={chrome.footerLinks} />
      <FloatingCta cta={chrome.floatingCta} />
    </>
  );
};
