import { SiteFooter } from "@/components/common/footer/site-footer";
import { SiteHeader } from "@/components/common/header/site-header";
import {
  ABOUT_CONTENT,
  BRAND_NAME,
  CONTACT_CONTENT,
  FOOTER_LINKS,
  HEADER_CTA,
  HERO_CONTENT,
  SERVICE_CARDS,
  SERVICES_INTRO,
  SITE_NAV,
  TEAM_CONTENT,
  WHY_CONTENT,
} from "@/data/mocks/home";

import { About } from "./sections/about";
import { Contact } from "./sections/contact";
import { Hero } from "./sections/hero";
import { Services } from "./sections/services";
import { Team } from "./sections/team";
import { WhyDantora } from "./sections/why-dantora";

/**
 * Home view — a Server Component assembling the AI Doctor Study landing page.
 *
 * Sections run in Figma order and take their copy through props from
 * `src/data/mocks/home.ts`, so nothing is hardcoded in a component.
 *
 * The two overlay reveals are pure flow order, no scroll listeners: Services
 * and Team are `sticky`, and the blocks after them carry the page background
 * plus a higher `z-index`, so scrolling lifts each one over the block it
 * follows.
 */
export const HomeView = () => {
  return (
    <>
      <SiteHeader brandName={BRAND_NAME} navLinks={SITE_NAV} cta={HEADER_CTA} />
      <main>
        <Hero content={HERO_CONTENT} />
        <WhyDantora content={WHY_CONTENT} />
        <Services intro={SERVICES_INTRO} cards={SERVICE_CARDS} />
        <About content={ABOUT_CONTENT} />
        <Team content={TEAM_CONTENT} />
        <Contact content={CONTACT_CONTENT} privacyHref="/privacy" />
      </main>
      <SiteFooter brandName={BRAND_NAME} links={FOOTER_LINKS} />
    </>
  );
};
