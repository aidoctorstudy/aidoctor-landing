import type { Locale } from "@/lib/i18n/locales";

/**
 * `/app` — embeds the actual AI Doctor Study web app via iframe, so the
 * marketing site and the product share one domain.
 *
 * A Server Component: an `<iframe>` needs no client-side state or effects to
 * render, so there's no reason to pay for a client bundle here (hard rule
 * #6). `dvh`/`dvw`, not `vh`/`vw` — the large/dynamic viewport units track a
 * mobile browser's collapsing URL bar, the same reasoning the DNA scene's
 * canvas layer uses ([[dna-ink-scene]]).
 *
 * `?locale=` is the only way the embedded static app can know which
 * `[locale]` route it's being viewed under — `public/app/index.html` is a
 * single static path with no router of its own, so it can't read a URL
 * segment the way this page can. `public/app/i18n/i18n.js` reads this query
 * param (ADR-0033) to pick a translation dictionary and set `dir`.
 */
export const StudyAppFrame = ({ locale }: { locale: Locale }) => (
  <iframe
    src={`/app/index.html?locale=${locale}`}
    title="AI Doctor Study"
    className="block h-dvh w-dvw border-0"
  />
);
