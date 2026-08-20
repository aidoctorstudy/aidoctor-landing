# `/app` — study app files needed here

The Next.js side of this integration is done (`src/app/app/`,
`src/views/app/study-app-frame.tsx` — see decisions-log ADR-0028). It embeds
`/app/index.html` via `<iframe>`.

**Not done: the actual app.** These files were requested but never supplied
to this project — nothing under `public/app/` except this README and the
placeholder `index.html` is real:

- `index.html`
- `styles.css`
- `auth.js`
- `01-core-utils.js` … `12-animations.js` (the numbered feature modules)
- `logo.svg`
- any other assets the app needs

Drop them in this folder (flat, matching the paths the app's own
`index.html` expects — same-origin, so relative script/asset paths inside it
should resolve correctly once they're here) and delete the placeholder
`index.html`. No other code changes should be needed — the iframe already
points at `/app/index.html`.
