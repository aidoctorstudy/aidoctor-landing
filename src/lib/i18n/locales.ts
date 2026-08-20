/**
 * Locale configuration — the single source of truth for i18n.
 *
 * Every other file (middleware, layouts, `generateMetadata`, `sitemap.ts`,
 * `LanguageSwitcher`) imports from here rather than repeating the locale
 * list, so adding a locale is a one-file change.
 *
 * Routing is hand-rolled, not a library (`next-intl` etc.) — see
 * decisions-log ADR-0029: content is resolved server-side into the existing
 * props-driven data shape (`getHomeContent(locale)` et al., `data/mocks/`),
 * so a routing library's `t()`/hooks system would go unused here; the only
 * thing actually needed is the `[locale]` segment + a rewrite for the
 * unprefixed default, which is small enough to own directly.
 *
 * 📖 Docs: obsidian/frontend/routing.md, decisions-log ADR-0029
 */

export const LOCALES = ["en", "ar", "ur", "es", "fr", "hi", "pt", "de", "zh"] as const;

export type Locale = (typeof LOCALES)[number];

/** Unprefixed in the URL (`/`, not `/en/`) — every other locale is `/xx/`. */
export const DEFAULT_LOCALE: Locale = "en";

export const RTL_LOCALES: ReadonlySet<Locale> = new Set(["ar", "ur"]);

/** Native display name, for the language switcher. */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  ar: "العربية",
  ur: "اردو",
  es: "Español",
  fr: "Français",
  hi: "हिन्दी",
  pt: "Português",
  de: "Deutsch",
  zh: "中文",
};

/** `og:locale` / `<meta http-equiv>`-style values — Open Graph wants the long form. */
export const OG_LOCALES: Record<Locale, string> = {
  en: "en_US",
  ar: "ar_SA",
  ur: "ur_PK",
  es: "es_ES",
  fr: "fr_FR",
  hi: "hi_IN",
  pt: "pt_PT",
  de: "de_DE",
  zh: "zh_CN",
};

export const isLocale = (value: string): value is Locale =>
  (LOCALES as readonly string[]).includes(value);

/** `path` starting with `/`. Returns it unprefixed for the default locale. */
export const localizedPath = (locale: Locale, path: string): string =>
  locale === DEFAULT_LOCALE ? path : `/${locale}${path}`;
