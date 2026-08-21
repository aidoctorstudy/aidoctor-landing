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
 *
 * `proActivated` carries the same problem for Gumroad's post-purchase
 * redirect: Gumroad sends the browser to this *page's* URL
 * (`aidoctor.study/app?pro=activated`), but the celebration-on-return logic
 * lives inside the iframe's own JS (`public/app/auth.js`), which only ever
 * sees the iframe's own `src` query string — a param on the parent page's
 * URL is invisible to it otherwise. Forwarded through unconditionally
 * appending `&pro=activated` is deliberately not "pass every query param
 * through": only this one has meaning inside the iframe today.
 */
export const StudyAppFrame = ({
  locale,
  proActivated = false,
}: {
  locale: Locale;
  proActivated?: boolean;
}) => (
  <iframe
    src={`/app/index.html?locale=${locale}${proActivated ? "&pro=activated" : ""}`}
    title="AI Doctor Study"
    className="block h-dvh w-dvw border-0"
  />
);
