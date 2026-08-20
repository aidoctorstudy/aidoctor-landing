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
 * The iframe target (`/app/index.html` under `public/app/`) is not part of
 * this repo yet — see decisions-log ADR-0028.
 */
export const StudyAppFrame = () => (
  <iframe
    src="/app/index.html"
    title="AI Doctor Study"
    className="block h-dvh w-dvw border-0"
  />
);
