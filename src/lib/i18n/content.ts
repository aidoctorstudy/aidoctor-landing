import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  ABOUT_CONTENT,
  APP_URL,
  BRAND_NAME,
  CONTACT_CONTENT,
  FLOATING_CTA,
  FOOTER_LINKS,
  HEADER_CTA,
  HERO_CONTENT,
  LIVE_DEMO_CONTENT,
  LOGIN_CTA,
  PRICING_CONTENT,
  SERVICE_CARDS,
  SERVICES_INTRO,
  SITE_NAV,
  TEAM_CONTENT,
  WHY_CONTENT,
  type AboutContent,
  type ContactContent,
  type CtaLink,
  type FooterLink,
  type HeroContent,
  type LiveDemoContent,
  type NavLink,
  type PricingContent,
  type SectionIntro,
  type ServiceCard,
  type TeamContent,
  type WhyContent,
} from "@/data/mocks/home";
import {
  COOKIES_CONTENT,
  PRIVACY_CONTENT,
  REFUNDS_CONTENT,
  TERMS_CONTENT,
  type LegalPageContent,
} from "@/data/mocks/legal";

import { localizedPath, type Locale } from "./locales";

/**
 * Locale-resolved content — the bridge between the props-driven data layer
 * (`data/mocks/*.ts`, per component-conventions.md's "no hardcoded content"
 * rule) and i18n (ADR-0029).
 *
 * **English is the TS source of truth; other locales are JSON overrides.**
 * `data/mocks/home.ts` / `legal.ts` stay exactly as they were before i18n —
 * every constant there is still the single English source, and no content
 * was duplicated out into a parallel `en.json` purely to satisfy a "read
 * from a file" contract. A non-English locale is resolved by reading
 * `data/i18n/<locale>/home.json` (or `legal-<page>.json`), produced by
 * `scripts/translate-content.mjs`, and used **whole** in place of the
 * English bundle if present.
 *
 * The fallback is **file-level, not per-key**: a missing or unparsable
 * locale file falls back to the entire English bundle, rather than trying
 * to deep-merge partial translations key-by-key. `scripts/translate-content.mjs`
 * always writes a complete bundle in one pass (or fails and writes nothing),
 * so partial files aren't an expected state this needs to handle gracefully —
 * simpler and safer than a merge that could silently mix two languages
 * inside one sentence if a nested object were only half-translated.
 *
 * `scripts/translate-content.mjs` (ADR-0032) generates the locale JSON
 * files via LibreTranslate — no API key required by default. A locale with
 * no file yet (or a failed/partial run — each file's translation is
 * independent, see that script) simply falls back to the English bundle
 * above, exactly as designed.
 */

export interface HomeContentBundle {
  hero: HeroContent;
  why: WhyContent;
  servicesIntro: SectionIntro;
  serviceCards: readonly ServiceCard[];
  liveDemo: LiveDemoContent;
  about: AboutContent;
  team: TeamContent;
  pricing: PricingContent;
  contact: ContactContent;
}

export interface SiteChromeBundle {
  brandName: string;
  siteNav: readonly NavLink[];
  headerCta: CtaLink;
  loginCta: CtaLink;
  floatingCta: CtaLink;
  footerLinks: readonly FooterLink[];
}

const ENGLISH_HOME: HomeContentBundle = {
  hero: HERO_CONTENT,
  why: WHY_CONTENT,
  servicesIntro: SERVICES_INTRO,
  serviceCards: SERVICE_CARDS,
  liveDemo: LIVE_DEMO_CONTENT,
  about: ABOUT_CONTENT,
  team: TEAM_CONTENT,
  pricing: PRICING_CONTENT,
  contact: CONTACT_CONTENT,
};

const ENGLISH_CHROME: SiteChromeBundle = {
  brandName: BRAND_NAME,
  siteNav: SITE_NAV,
  headerCta: HEADER_CTA,
  loginCta: LOGIN_CTA,
  floatingCta: FLOATING_CTA,
  footerLinks: FOOTER_LINKS,
};

export const LEGAL_CONTENT_EN = {
  terms: TERMS_CONTENT,
  refunds: REFUNDS_CONTENT,
  cookies: COOKIES_CONTENT,
  privacy: PRIVACY_CONTENT,
} as const;

export type LegalPage = keyof typeof LEGAL_CONTENT_EN;

/** Reads and parses `data/i18n/<locale>/<file>.json`, or `null` if absent/invalid. */
const readLocaleJson = <T>(locale: Locale, file: string): T | null => {
  try {
    const path = join(process.cwd(), "src", "data", "i18n", locale, `${file}.json`);
    return JSON.parse(readFileSync(path, "utf-8")) as T;
  } catch {
    return null;
  }
};

/**
 * The content layer (English source, or a translated JSON override) only
 * ever knows the bare `APP_URL` ("/app") — `scripts/translate-content.mjs`
 * copies `href` fields through unchanged by construction (they're
 * structural, never translated), so every locale's JSON has the same
 * unprefixed value. Locale-prefixing happens here, once, on the way out,
 * rather than teaching every render site (or the translation script) about
 * routing — walks the whole bundle and rewrites any string value that is
 * *exactly* `APP_URL` to `localizedPath(locale, APP_URL)` (`/app` for
 * `en`, `/ar/app` etc. otherwise). Safe as an exact-match rewrite: nothing
 * else in this content is ever the literal string `"/app"` (prose never
 * is, and every other href is a distinct path or an external URL).
 */
const localizeAppLinks = <T>(value: T, locale: Locale): T => {
  if (typeof value === "string") {
    return (value === APP_URL ? localizedPath(locale, APP_URL) : value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((entry) => localizeAppLinks(entry, locale)) as T;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, localizeAppLinks(entry, locale)]),
    ) as T;
  }
  return value;
};

export const getHomeContent = (locale: Locale): HomeContentBundle => {
  const bundle = locale === "en" ? ENGLISH_HOME : (readLocaleJson<HomeContentBundle>(locale, "home") ?? ENGLISH_HOME);
  return localizeAppLinks(bundle, locale);
};

export const getSiteChrome = (locale: Locale): SiteChromeBundle => {
  const bundle = locale === "en" ? ENGLISH_CHROME : (readLocaleJson<SiteChromeBundle>(locale, "chrome") ?? ENGLISH_CHROME);
  return localizeAppLinks(bundle, locale);
};

export const getLegalContent = (locale: Locale, page: LegalPage): LegalPageContent => {
  const english = LEGAL_CONTENT_EN[page];
  if (locale === "en") return english;
  return readLocaleJson<LegalPageContent>(locale, `legal-${page}`) ?? english;
};
