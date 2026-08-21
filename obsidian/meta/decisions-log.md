---
tags: [meta, decision]
updated: 2026-08-10
---

# Decisions Log (ADRs)

Architecture Decision Records. Each entry captures a choice, its context, and its
consequences. Use [[templates/adr-note]] for new entries. Newest first.

---

## ADR-0033 — RTL scroll-direction fix, translation-pipeline hardening, and a dictionary-based i18n system for `public/app/`

- **Status:** Accepted
- **Date:** 2026-08-21

**Context.** Three bugs reported against the live `/ar` page, plus a new
requirement: add i18n (9 locales, RTL for `ar`/`ur`) to `public/app/` — the
~7,000-line vanilla-JS study app embedded via `<iframe>`
([[decisions-log]] ADR-0028), which had none.

**Bug 1 — Services rail unreadable in RTL, root-caused as a scroll-direction
bug, not a contrast bug.** `services-track.tsx`'s scroll-hijacked card rail
always slides the track `x = -progress * travel` (leftward) as the user
scrolls. Under `dir="rtl"` (set on `<html>` for `ar`/`ur`), flexbox
automatically reverses child order — card 1 renders at the *right* edge
instead of the left — so the same leftward slide rushes every card off the
left edge before it's readable and ends the runway on an empty void instead
of the last card, rather than revealing cards one at a time. What read as
"hard to read, bad contrast" was actually cards flying past mid-animation.
Fixed with one line: `x = (rtl ? 1 : -1) * progress * travel`, `rtl` read
from `document.documentElement.dir` once per frame (cheap string compare).
Confirmed live: cards now settle and hold, ending on the last card at the
left edge.

**Bug 2 — team member names.** Already correct — `translateMember()` in
`translate-content.mjs` has always kept `name` unchanged (ADR-0032). No
code change; verified in the live DOM and in `ar/home.json`.

**Bug 3 — Live Demo chat "reversed/corrupted" text, and a cluster of
translation-pipeline bugs found chasing it.** Manually reading the actual
`ar/home.json` output (not just checking for zero `FAILED` lines) surfaced
four distinct, real bugs in the split-and-splice translator built for
ADR-0032:
1. **No space at splice boundaries** — `translateWithSpacing` sends a
   segment's *trimmed* core to LibreTranslate, but the API response has no
   guaranteed relationship to the input's surrounding whitespace, so a
   protected phrase spliced back in landed glued to its neighbour with zero
   space (`"...بنفسكaidoctor.study/app"`). Fixed by capturing
   leading/trailing whitespace before translating and reattaching it after,
   unconditionally, rather than trusting the engine to preserve it.
2. **Multi-sentence strings translated only partway** — a 2-sentence Live
   Demo message came back with sentence 1 in Arabic and sentence 2 verbatim
   English, 200 status, no error. Fixed by splitting every segment into
   individual sentences (`splitSentences`) and sending one sentence per
   request — confirmed live that the previously-failing sentence translates
   correctly in isolation.
3. **Silent full-string echo-back** — some short strings (a CTA label, a
   stat label) came back byte-identical to the English input despite
   needing translation (confirmed by the same string translating correctly
   in other locales, e.g. `es`'s `about.actions` already had "Login" →
   "Iniciar sesión"). Fixed with `looksUntranslated()` — retries up to twice
   when trimmed-lowercased output equals input — plus a duplicate-Arabic-
   punctuation cleanup (`"؟?"` → `"؟"`, another live-caught artifact).
4. **Reversed multi-digit numbers** — the most serious: `"300"` came back as
   `"٠٠٣"` and `"90"` as `"٠٩"` — a live, in-the-stored-JSON digit-order
   corruption, not a rendering artifact, found while auditing the `why`
   section's clinical mockup (dosage/timing numbers, not the Live Demo
   panel itself, but the same translation pipeline). Fixed by protecting
   any digit run (`50,000`, `24/7`, `30%`) from ever reaching the MT engine
   at all, the same principle as the brand-name/URL protection — numbers
   don't need linguistic translation, and Arabic technical writing commonly
   keeps Western digits anyway.

All four were caught by actually reading translated output, not by trusting
a clean exit code — the same lesson ADR-0032 already drew from the
placeholder-token bug, now generalized: **a free MT service's `200 OK` is
not evidence of a correct translation.** All 8 marketing-site locales were
regenerated with the hardened script after these fixes landed.

**New: `public/app/` i18n (9 locales, RTL).** The study app is ~7,000 lines
of vanilla JS across `index.html` + 13 numbered feature modules, with no
build step, no framework, and no existing i18n. Two designs were
considered:
- **Rewrite every user-facing string to call `t('some.key')`** — the
  conventional approach, and what `translate-content.mjs` effectively does
  for the Next.js site's React components. Rejected here: it means editing
  hundreds of call sites across a large, revenue-generating app (Firebase
  auth, Gumroad checkout) with no test suite — real risk of breaking
  working logic for a translation feature.
- **A dictionary keyed by the exact English source string, applied at
  runtime by walking the DOM** — the approach taken. `public/app/i18n/
  i18n.js` detects the locale (from the iframe's `?locale=` query param,
  set by `study-app-frame.tsx` from the Next.js `[locale]` route — the
  static app has no URL segment of its own to read), sets `lang`/`dir`
  before first paint, then translates existing text nodes and
  `placeholder`/`title`/`aria-label` attributes by looking up their
  *current* text in `translations.js`. A `MutationObserver` re-applies the
  same lookup to anything the feature modules inject afterwards (quiz
  questions, flashcards, toasts, panel switches) — so dynamically-generated
  markup is covered automatically, with zero edits to any of the 13 files.
  The trade-off, accepted deliberately: a *concatenated* string
  (`'Q ' + num + '/' + total`) can't be matched by an exact-text
  dictionary, since the DOM only ever sees the final joined string — those
  stay in English. `scripts/extract-app-strings.mjs` excludes fragments
  that look like they're missing their concatenated other half rather than
  translating them uselessly.

**Extraction and translation pipeline.** `extract-app-strings.mjs` pulls
~930 unique candidate strings programmatically: text between tags and
`placeholder`/`title`/`aria-label` attributes from `index.html`; literal
arguments to `showToast`/`confirm`/`alert`/`.textContent =` from the JS
files; and `lbl`/`label`/`name`/`title`/`sub`/`text` object-literal
properties, added after a live check found several dashboard quick-action
buttons (command-palette entries, quick-action tiles — data-driven UI built
from arrays of `{panel:'examprep', lbl:'Exam Prep'}`-shaped objects) stayed
English because that source wasn't covered by the call-based patterns.
Deliberately **not** every string literal in the JS files — they also build
long AI-prompt strings sent to the backend, which must stay in English for
the model and would be actively wrong to translate.
`translate-app-content.mjs` shares its protected-phrase/whitespace/
sentence-splitting/retry logic with the hardened `translate-content.mjs`
above, but batches many strings into one LibreTranslate request instead of
one request per string — confirmed live that `q` accepts an array (150
strings in one call, one response array back) — since ~840 independent
short strings × 8 locales at one-request-each would have taken hours. Two
more bugs specific to this content surfaced and were fixed pre-emptively
(medical scoring/vitals text, not present in the marketing site's copy):
parenthesized scores (`"(0)"`) losing their opening paren, and `<`/`≤`/`≥`
comparison readings (`"< 90"`, `"≤ 60"`) causing severe corruption
(`"BP systolic < 90"` → `"...systolic 90 / / / / / / / 60"`) — both are now
protected spans, same principle as the digit-reversal fix above.

**RTL layout for `public/app/`.** `public/app/i18n/rtl.css`, scoped by
`[dir="rtl"]`, loaded unconditionally after `styles.css`. Not an exhaustive
mirror of ~2,500 lines of hand-written CSS (this app hardcodes physical
`left`/`right` throughout, the same class of issue as the marketing site's
Services rail) — covers the one whole-app-affecting piece (the fixed icon
sidebar + its `margin-left` content offset) and the fixed-position chrome
most likely to visibly collide with RTL text (toast stack, FAB, XP popup).

**Consequences.**
- `services-track.tsx`, `translate-content.mjs` changed; all 8
  `src/data/i18n/<locale>/*.json` bundles regenerated and re-verified
  (valid JSON, zero leftover artifacts, protected phrases intact, numbers
  no longer reversed).
- New: `scripts/extract-app-strings.mjs`, `scripts/translate-app-content.mjs`,
  `public/app/i18n/{i18n.js,rtl.css,translations.js}`. ~930 unique English
  UI strings extracted; `ar` translated 747, other locales 684–925 (the gap
  is `translated === source`, correctly excluded rather than stored as a
  no-op entry — some is deliberate, e.g. `AI Doctor`/`aidoctor.study`/
  `MED20` staying literal, some is the free MT engine declining to
  translate certain short strings at all, see next point).
- `study-app-frame.tsx` now takes a required `locale` prop and builds
  `/app/index.html?locale=<locale>`; `[locale]/app/page.tsx` reads
  `params.locale` and passes it through (previously the iframe `src` was a
  hardcoded literal with no locale awareness at all).
- **A fifth pipeline failure mode, distinct from the four above: some short
  strings ("Login", "Email", "Rating", "Exam Prep", "Go Pro") come back
  byte-identical to their English input** even after the `looksUntranslated`
  retry — not transient (reproduced across four separate full runs) and not
  fixable by retrying a deterministic model. Confirmed the *dictionary* was
  actually to blame, not the translator, by checking `es`'s output for the
  same strings (`"Login"` → `"Iniciar sesión"` there) — so it's specific to
  which strings this instance's Arabic model treats as already "fine as
  English", not a systemic Arabic failure. Given the volume (~930 strings ×
  8 locales), this is disclosed as a known gap rather than chased
  exhaustively; the highest-visibility instances on the `ar` locale
  specifically (the one named in the bug reports this ADR responds to) were
  hand-patched directly in `ar/home.json`, `ar/chrome.json`, and
  `public/app/i18n/translations.js` — team-member credential lines, the
  Live Demo panel in full (both AI messages had additionally hit failure
  mode 2, the multi-sentence partial-translate bug, even in isolation —
  hand-written medically-accurate Arabic replaces them), and the dashboard's
  quick-action button labels.
- Not done: the same manual pass for the other 7 locales (`ur, es, fr, hi,
  pt, de, zh`) — only `ar` was named in the reports this ADR addresses, so
  only `ar` got hand-verified and hand-patched beyond the automated
  pipeline; a full RTL audit of `public/app/`'s ~2,500-line stylesheet
  beyond the sidebar/fixed-chrome fixes above; native-speaker review of any
  of the machine-translated content (marketing site or app) — both already
  disclosed as known limits in ADR-0032, unchanged by this entry.

## Related

[[decisions-log]] · [[environment-variables]] · [[routing]]

---

## ADR-0032 — Translation pipeline switched from the Anthropic API to LibreTranslate

- **Status:** Accepted — script rewritten and verified with a real,
  complete 8-locale translation run
- **Date:** 2026-08-21

**Context.** Requested: rewrite `scripts/translate-content.mjs` (ADR-0030)
to use LibreTranslate instead of the Anthropic API, targeting the free
public instance at `https://libretranslate.com`, no API key, translating
`en` → `ar, ur, es, fr, hi, pt, de, zh`, preserving URLs/hrefs/prices/the
`MED20` code, writing the same `src/data/i18n/<locale>/` file layout.

**Decision — why this couldn't be the same script with a different API
call.** The Anthropic version sent each content bundle as one JSON payload
with a system prompt asking the model to preserve structure and skip
protected fields — that only works because an instruction-following LLM
understands "don't touch this key." LibreTranslate is a plain
text-to-text MT engine with no concept of JSON or field semantics, so
"translate the whole JSON blob" was never viable here. The rewrite
therefore has one small translator function per content shape (`translateHero`,
`translatePlan`, `translateBlock`, …) in `scripts/translate-content.mjs`
that explicitly rebuilds each object field by field: natural-language
strings go through `t()`; everything structural (`href`, `url`, enum
discriminators, anchor `id`s, prices, `period`, proper names, emoji,
booleans) is copied through unchanged, by construction — not by asking an
engine to leave it alone. Protected literal phrases that must survive
*inside* a translated sentence (`MED20`, "AI Doctor Study", the bare
domain "aidoctor.study") are never sent to the MT engine at all — see the
third bug below for why, and the split-and-splice approach that replaced
the original placeholder-token design.

**A real, live-verified problem with the literal request: the official
public instance now requires a key.** `https://libretranslate.com`'s
`/languages` endpoint is open, but every `/translate` call returns
`400 {"error":"Visit https://portal.libretranslate.com to get an API
key"}` — confirmed by actually running the rewritten script against it,
not assumed. Raised with the project owner (`AskUserQuestion`: get a free
key / point at a different free instance / ship unrun) — **point at a
different free instance** was chosen. Several other commonly-cited public
LibreTranslate mirrors were tried live and found dead, cert-mismatched, or
DNS-unresolvable (`translate.argosopentech.com`, `libretranslate.pussthecat.org`,
`translate.mentality.rip`, `lt.blitzw.in`, and others — free public MT
mirrors are notoriously short-lived). `https://translate.disroot.org`
verified working anonymously — `/translate` for all 7 non-Chinese target
languages, `zh-Hans` for Chinese, and the placeholder-token protection
mechanism all confirmed live — and is now the script's default
`LIBRETRANSLATE_URL`. Both `LIBRETRANSLATE_URL` and an optional
`LIBRETRANSLATE_API_KEY` (for the official instance, or a self-host)
remain overridable via env, so this default can be swapped the moment
disroot.org's instance changes or goes down too — a real risk with any
free community-run mirror, disclosed in the script's own header comment.

**A second real bug caught live, not assumed.** LibreTranslate has no bare
`zh` target — only `zh-Hans` (Simplified) and `zh-Hant` (Traditional),
confirmed by reading the actual `/languages` response. Our own locale code
is `zh` (matching `lib/i18n/locales.ts`, and the output directory
`src/data/i18n/zh/`). Without a mapping layer, the script's own
supported-languages guard would have silently **skipped Chinese entirely**
every run, reporting nothing wrong — a correctly-designed safety check
would have masked a real bug instead of catching one. Fixed with a small
`LOCALE_TO_LIBRETRANSLATE_TARGET = { zh: "zh-Hans" }` map: the API request's
`target` field goes through it, everything else (file paths, CLI args, log
messages) still uses our own `zh`.

**A third real bug, the most serious, caught by actually reading the
output — not just checking exit codes.** The first implementation
protected literal phrases with an injected placeholder token
(`XPROTECTEDX0X`) sent through LibreTranslate and swapped back afterwards.
The full 8-locale run completed with **zero `FAILED` log lines**, which
looked like a clean pass — but manually inspecting the written JSON found
the MT engine had silently mangled the token in at least two places:
`ar/legal-terms.json` came back with literal `XPROTECTEDX` fragments left
in the Arabic text (the exact-string swap-back couldn't find its token
anymore), and `fr/home.json`'s pricing `discountNote` — the `MED20` coupon
line — came back as `"...code XPROTETEDX0X..."` (the engine had dropped a
letter from the token itself). Neither failure surfaced as an error
anywhere; both would have shipped as visibly broken, untranslated-looking
text in production. Retrying with a letters-only token (no digits, on the
theory that Arabic digit-shape handling was the cause) still failed
differently on the same Arabic string, showing the real problem is
structural: **no black-box MT engine can be trusted to pass an arbitrary
synthetic token through untouched**, especially into a different script.
Fixed by removing token injection entirely — `findProtectedSpans()` now
splits each string around every protected phrase/URL/email, translates
only the surrounding fragments, and splices the original protected text
back in untouched, so it never reaches the MT engine and cannot come back
corrupted. `t()`'s `restore()` step and its exact-match assumption are
gone. Trade-off: slightly less fluent phrasing immediately around a
protected phrase (the model translates fragments instead of one whole
sentence), in exchange for a hard content-correctness guarantee — judged
the right trade for a coupon code and a brand name. All locale files
already written by the token-based run were regenerated with the fixed
script.

**Politeness toward a free, unauthenticated, shared instance.** Every
LibreTranslate call now runs **strictly sequentially** — no `Promise.all`
fan-out anywhere in the translator functions, one request in flight at a
time globally — with a delay after each call (`TRANSLATE_DELAY_MS`,
default 300 ms) and retry-with-backoff on 429/5xx. A per-locale cache
(`Map`) avoids re-translating repeated strings (CTA labels like "Login"
appear in several places). A full 8-locale run is consequently slow by
design; `--locales=` translates a subset.

**Consequences.** `ANTHROPIC_API_KEY` is no longer read or required by
this script — removed from `.env.example` and environment-variables.md,
replaced with the optional `LIBRETRANSLATE_API_KEY`. All 8 locales were
(re-)generated with the fixed split-and-splice script and the full set —
48 files (`{home,chrome,legal-terms,legal-refunds,legal-cookies,
legal-privacy}.json` × `ar, ur, es, fr, hi, pt, de, zh`) — is confirmed
committed and verified: all valid JSON, zero `FAILED` log lines, zero
leftover placeholder artifacts (broad `XPROTE`/`PROTETE` scan across every
file, not just the exact original token string), and `MED20`/"AI Doctor
Study" both present and intact in every locale's `home.json` (1 and 4
occurrences respectively, matching the English source count). `href`
values spot-checked untouched (`/app` × 8 per locale). `npm run lint` and
`npx tsc --noEmit` both clean (the one lint error that exists,
`public/app/05-exam-prep.js:293`, predates and is unrelated to this
change). A slow sequential run against a shared free instance can still
partially fail per file without failing the whole script (each
`try`/`catch` in `main()` is independent) — that's a legitimate `FAILED`
log line now, distinct from the silent corruption this ADR fixes; none
occurred in the final run. Translation quality here is machine-translated
(Argos/LibreTranslate via `translate.disroot.org`), not reviewed by a
native speaker — treat it as a solid first pass, not a final localization
sign-off, and note the protected-phrase splice can make phrasing
immediately around "AI Doctor Study"/`MED20` slightly less fluent than a
single unbroken MT pass would have produced. RTL rendering (`ar`, `ur`)
and the visual result in-browser have not been checked — only the JSON
content itself has been verified.

## Related

[[decisions-log]] · [[environment-variables]] · [[tech-stack]]

---

## ADR-0031 — CTA relabel: Login pill in the header, Sign Up for Free in the Hero, Pro's "Get Pro" routes through /app until auth exists

- **Status:** Accepted
- **Date:** 2026-08-20

**Context.** Requested: a "Login" pill next to the header's "Start for Free";
the Hero's secondary button ("See Pro Features") replaced with "Login"; the
Hero's primary button relabelled "Sign Up for Free" (same `/app` href); the
Pricing section's "Get Pro" pointed at `/app` instead of straight to
Gumroad checkout, since there's no auth-gated redirect from sign-up to
checkout yet — "for now just link to /app with a note"; and every remaining
"Start Free Trial" button (found only in the About section's action row)
replaced with the same "Sign Up for Free" + "Login" pair.

**Decision.**
- New `LOGIN_CTA: CtaLink` in `data/mocks/home.ts` (`{ label: "Login", href:
  APP_URL }`), threaded through `SiteChromeBundle`
  (`lib/i18n/content.ts`) alongside the existing `headerCta`, so it
  resolves per-locale the same way every other chrome string does.
- `HeaderCta` (`components/common/header/header-cta.tsx`) gained an
  optional `variant?: ButtonVariant` prop (default `"primary"`, unchanged
  behaviour for existing callers). `SiteHeader` now renders it **twice** —
  `variant="secondary"` for Login, the default for Start-for-Free — so both
  pills share the exact same Contact-visibility fade/lift spring instead of
  duplicating that logic for a second button. `MobileMenu` renders both as
  plain `<Button withArrow>` (no fade needed — the panel itself is already
  conditionally rendered).
- `HERO_CONTENT.actions`: `"Start for Free"` → `"Sign Up for Free"` (href
  unchanged, still `APP_URL`); `"See Pro Features"` (`#features`) →
  `"Login"` (`APP_URL`).
- `ABOUT_CONTENT.actions`: the lone `"Start Free Trial"` entry became two —
  `"Sign Up for Free"` and `"Login"`, both `APP_URL` — with the existing
  third action, `"See Pricing"` → `PRO_CHECKOUT_URL`, left in place (not
  mentioned in the request, so not touched).
- `PricingPlan` gained an optional `note?: string`. Pro's `cta.href` moved
  from `PRO_CHECKOUT_URL` to `APP_URL`; `note` is
  `"Sign up or log in first — you'll continue to checkout from there."`,
  rendered by `PlanCard` (`pricing.tsx`) directly under the button when
  present (`undefined` for Free, so nothing renders there). `CONTACT_CONTENT`'s
  own separate "Get Pro" button was deliberately **not** touched — the
  request scoped this to "the Pricing section" specifically.

**A real bug caught while implementing, not after.** Hero's and About's
action lists now legitimately contain two `CtaLink`s pointing at the same
`APP_URL` (Sign Up for Free / Login). Both components' `.map()` used
`key={action.href}` — correct when every href in the array was unique, but
a silent duplicate-key bug the moment two entries share one. Fixed by
switching both to `key={`${action.label}-${action.href}`}` before this
ever rendered, not discovered via a runtime warning. `contact.tsx` and
`why-dantora.tsx` still key by `action.href` alone — left alone since
neither array can currently produce a duplicate, but the next content edit
to either should re-check that assumption.

**Consequences.** The Pricing→Gumroad flow is now a known two-step
placeholder (browse pricing → `/app` → manually navigate to Gumroad) rather
than a one-click checkout; a real fix requires an actual auth-gated
post-signup redirect to `PRO_CHECKOUT_URL`; `pricing.tsx`'s catalog note
(home-sections.md) flags this explicitly so it isn't mistaken for a
finished flow later.

## Related

[[home-sections]] · [[components/common]] · [[components/ui]]

---

## ADR-0030 — SEO hardening, four legal pages, full i18n routing (9 locales), and the real logo replacing the placeholder mark

- **Status:** Accepted — logo/SEO/legal-pages/i18n-infra shipped and
  verified in-browser; the 8 non-English translation JSON files are **not**
  committed yet (requires a real `ANTHROPIC_API_KEY`, which this session
  didn't have — every locale currently renders the English bundle)
- **Date:** 2026-08-20

**Context.** Requested, in one batch: a long SEO/technical checklist (404,
per-page meta, og:image, JSON-LD, canonical, sitemap, robots, favicon, alt
text, source maps, console errors, code-splitting), full multilingual
support for `en, ar, ur, es, fr, hi, pt, de, zh` via `next.config.js` `i18n`
+ a Claude-API translation pipeline + a language switcher + RTL + locale
sitemap/hreflang, and — in a separate follow-up message — replacing the
placeholder logo/favicon with the real `aidoctor.study` logo everywhere.

An audit against the live code found most of the SEO checklist already
done by this starter (favicon, custom 404s, `lang="en"`, single `<h1>`,
canonical, JSON-LD, `robots.txt` already `allow: "/"` for every bot
including AI crawlers, `llms.txt`, a dynamic 1200×630 OG image, no console
errors, source maps already off in production). Two real problems needed
solving first:
1. **`next.config.js` `i18n` is a Pages Router API** — this project has no
   Pages Router, so that config key does nothing in App Router (confirmed:
   no `middleware.ts` existed, routing.md documented no locale segment).
   Real App Router i18n needs a `[locale]` route segment + middleware.
2. **`/terms`, `/refunds`, `/cookies`, `/privacy` were footer links with no
   route behind them** (confirmed via `site-footer.tsx`'s own docstring) —
   the sitemap/metadata items need real pages to point at. Terms/Refunds/
   Cookies had full legacy content as standalone HTML in
   `public/app/{terms,refunds,cookies}.html`; Privacy had no prior content
   anywhere.

Both were raised with the project owner before starting (`AskUserQuestion`):
confirmed **build-time** translation (a script translates once via the
Anthropic API, output committed, pages render statically — no runtime API
cost/latency, works with static rendering/SEO) over a per-request pipeline,
and confirmed building the four legal pages now (porting three, authoring
Privacy fresh) rather than skipping them.

The logo request surfaced a second ambiguity: the repo held **two different
old marks** (a raster brain/neural-network PNG wrapped in `public/app/logo.svg`,
used as the legacy app's own favicon; and an inline stethoscope/circle SVG in
the legacy legal pages' headers), neither committed as a canonical
`logo.png`/`favicon.ico`, and *also* the DNA-helix `currentColor` glyph
(`DnaIcon`) this project's own header/icons had been using as a stand-in.
Asked which was "the actual logo" (`AskUserQuestion`, with rendered
previews) — the project owner picked the brain/neural-network mark.

**Decision — logo (ADR-0030a).**
- Extracted the PNG payload from `public/app/logo.svg`'s base64 data URI →
  `public/logo.png` (237×274, the single committed source every other logo
  surface derives from) and a multi-resolution `public/favicon.ico`
  (16/32/48/64px).
- New `src/lib/brand-logo.ts` (`BRAND_LOGO_DATA_URI`) replaces
  `lib/brand-mark.ts`: reads `public/logo.png` once at module load,
  base64-encodes it, for the three Satori-rendered routes only
  (`icon.tsx`, `apple-icon.tsx`, `opengraph-image.tsx` — Satori can't
  resolve a plain `/logo.png` URL, the same reason the old builder existed).
  Everywhere else (`site-header.tsx`'s navbar, `preloader.tsx`) references
  `/logo.png` directly via `next/image`/`<img>` — no reason to inline ~49KB
  of base64 into the client bundle when the browser can fetch and cache the
  file once.
- Deleted `components/ui/icons/dna-icon.tsx` (`<DnaIcon>`) and
  `lib/brand-mark.ts` entirely once nothing referenced them; the shared
  `IconProps` type moved to a new `icon-types.ts` so `ArrowUpRightIcon`/
  `CheckIcon` didn't need to import it from a deleted file.
- Deleted the stale, undersized (900×600 vs. the declared 1200×630) checked-in
  `public/open-graph.png` — dead weight now that `opengraph-image.tsx` is
  the only OG image source and renders at the correct size.
- The preloader's "unfilled ghost" layer (previously the mark re-rendered
  in a different `currentColor` fill) switched to the same `/logo.png`
  dimmed with CSS `opacity` — a raster PNG with its own baked-in gradient
  can't be recoloured the old way.

**Decision — i18n routing (ADR-0030b), hand-rolled, not a library.**
`src/lib/i18n/locales.ts` is the single source of truth (`LOCALES`,
`DEFAULT_LOCALE = "en"`, `RTL_LOCALES = {ar, ur}`, `LOCALE_LABELS`,
`OG_LOCALES`, `localizedPath()`). `src/middleware.ts` rewrites every request
to carry a concrete `[locale]` segment while keeping English unprefixed in
the visible URL (`/`, not `/en/`) — an already-prefixed request
(`/ar/pricing`) passes through unchanged. `src/app/(marketing)/**` and
`src/app/app/**` moved to `src/app/[locale]/(marketing)/**` /
`src/app/[locale]/app/**`; `robots.ts`/`sitemap.ts`/`icon.tsx`/
`apple-icon.tsx`/`opengraph-image.tsx`/`api/**` stayed at the true top
level (they're not part of the layout-nesting mechanism — one copy already
covered every route). `generateStaticParams` on both root layouts lists all
9 locales for static generation per locale.

A library (`next-intl` etc.) would only be used here for its routing
utilities — content resolution deliberately does **not** go through a
`t()`/hooks system (see below) — so the actual need (a segment + a
rewrite) was small enough to own directly, matching this project's existing
style of small hand-rolled infra (the ticker, the scroll store,
`use-media-query`).

**Decision — content resolution stays props-driven; English is the TS
source, other locales are JSON overrides (ADR-0030c).**
`component-conventions.md` already mandates "no hardcoded content in
components, data comes from props." That held: **every section component
is unchanged** — `hero.tsx`, `pricing.tsx`, all of them still just take
typed `content` props. `src/lib/i18n/content.ts` is the only new piece:
`getHomeContent(locale)` / `getSiteChrome(locale)` / `getLegalContent(locale,
page)` return the `data/mocks/home.ts` / `legal.ts` constants directly for
`"en"`, or — for any other locale — read `src/data/i18n/<locale>/*.json`
and return that instead, falling back to the whole English bundle if the
file is missing or fails to parse. This is a **deliberate, disclosed
deviation** from a more literal reading of "extract English into JSON too":
duplicating the English constants into a redundant `en.json` that gets read
right back would have meant hand-transcribing ~1000 lines of existing TS
content for no behavioural gain. The fallback is also **file-level, not
per-key** — a missing/broken locale file falls back to the *entire* English
bundle rather than a per-key deep-merge, deliberately: `translate-content.mjs`
always writes a complete bundle in one pass or writes nothing, so partial
files aren't an expected state, and a per-key merge risks silently mixing
two languages inside one sentence if a nested object were ever only
half-translated.

**Decision — translation pipeline (ADR-0030d).**
`scripts/translate-content.mjs` — plain Node, `fetch` only, no new npm
dependency (matches tech-stack.md's minimal-deps philosophy). It can't
`import` the TS content modules directly (no `@/` path-alias resolution
outside Next's own pipeline, and no `tsx`/`ts-node` dependency to add for
one script), so it instead fetches the English bundle as JSON from a new
internal dev-tool endpoint, `GET /api/i18n-content`
(`src/app/api/i18n-content/route.ts`, using the project's existing
`handle()` envelope convention) — meaning **the Next dev server must be
running** (`npm run dev`) before this script is run. For each of the 8
non-English locales it sends each JSON bundle to the Anthropic Messages API
with a system prompt instructing verbatim structure/key preservation and
explicitly protecting URLs/hrefs/emails/the `MED20` code/prices from
translation, and writes `src/data/i18n/<locale>/{home,chrome,legal-terms,
legal-refunds,legal-cookies,legal-privacy}.json`. `npm run translate` runs
it; `ANTHROPIC_API_KEY` goes in `.env.local` (documented in `.env.example`
and environment-variables.md) and is read by the script itself, not through
`src/env.ts` — the script runs outside Next's request lifecycle.
**Not run this session** — no API key was available; every locale
currently renders English until it is.

**Decision — legal pages, RTL, hreflang, LanguageSwitcher.**
`data/mocks/legal.ts` — a small block-based content model (`paragraph` /
`list` / `callout` / `table`) shared by one view, `views/legal/legal-page.tsx`
(`LegalPageView`), rather than four near-duplicate page components. Terms/
Refunds/Cookies ported verbatim from `public/app/*.html`'s `<main>` content;
Privacy authored fresh (no prior version existed) in the same structure/
tone. Terms' governing-law section and Privacy's international-transfers
section both render as an explicit amber "PLACEHOLDER — FINALIZE WITH LEGAL
COUNSEL BEFORE LAUNCH" callout (new `--state-warning`/`--state-danger` Tier
2 tokens, `globals.css`) rather than inventing a jurisdiction — those
facts depend on where the operating entity is actually registered, which
isn't something to fabricate. `[locale]/(marketing)/layout.tsx` sets
`<html lang={locale} dir={rtl ? "rtl" : "ltr"}>` from `RTL_LOCALES`; RTL
layout beyond that (logical-property utilities, mirroring the DNA scene's
absolute pixel offsets) was **not** attempted — out of scope for this pass,
a known limitation. `generate-page-metadata.ts`'s `generateMetadata` gained
a `locale` param → `alternates.languages` (hreflang + `x-default`),
`openGraph.locale`, and a locale-prefixed `canonical`; `sitemap.ts` expands
`ROUTES` into one entry per route per locale, each carrying Next's native
`alternates.languages` sitemap field. `components/common/header/
language-switcher.tsx` is a native `<details>`/`<summary>` disclosure
(same pattern as the DNA Ink controls panel) rendered in both `SiteHeader`
and `MobileMenu`, preserving the current path across a locale switch.

**A real bug, caught live in-browser before it shipped.** The middleware's
matcher excluded `/api`, `/_next`, and any path containing a dot — but
`icon.tsx`/`apple-icon.tsx`/`opengraph-image.tsx`'s *public* URLs (`/icon`,
`/apple-icon`, `/opengraph-image`) carry no extension even though they
render images. They were silently rewritten to `/en/icon` etc. — no such
route exists there, since those files live at the true top level outside
`[locale]` — 404ing the favicon and the `og:image` meta tag on **every
single request**, not an edge case. Found by curling those three paths
directly after the middleware landed; fixed by excluding them **by exact
name** in the matcher (`icon$|apple-icon$|opengraph-image$`) alongside the
dot rule. See routing.md's danger callout — flagged there so a future
locale/route addition doesn't reintroduce the same class of bug.

**Consequences.**
- `sitemap.ts` now lists `/`, `/app`, and the four legal routes — ×9
  locales each.
- `team.tsx`'s social icons gained real `alt` text (`social.label`) — they
  were `alt=""` (decorative), which was wrong; they're meaningful links.
- `public/llms.txt` refreshed for the Live Demo/Pricing sections added in
  ADR-0029, plus all four legal routes and the `MED20` discount code.
- `next.config.ts` gained an explicit `productionBrowserSourceMaps: false`
  — Next's own default, made explicit so a future edit can't silently flip
  it on.
- **Follow-up required, not done here:** run `npm run translate` to
  populate the 8 locale JSON files (superseded by ADR-0032 — the script no
  longer uses Anthropic/`ANTHROPIC_API_KEY` at all, see that entry for the
  actual run and its outcome); consider RTL logical-property adoption in
  the handful of components where left/right is meaningful (button icon
  order, chip lists) if Arabic/Urdu visual QA surfaces layout issues beyond
  `dir="rtl"` alone.

## Related

[[routing]] · [[seo-metadata]] · [[home-sections]] · [[components/ui]] ·
[[components/common]] · [[environment-variables]] · [[design-system]]

---

## ADR-0029 — Landing page v2: Live Demo, Pricing, app mockup, floating CTA; contact form → plain CTA; About banner removed

- **Status:** Accepted
- **Date:** 2026-08-20

**Context.** Requested: a Live Demo chat section (Features→About), a Pricing
section (Team→Contact), a more vibrant/rotating DNA helix, a floating "Try
Free" CTA appearing after 300px of scroll, a CSS fallback for the Hero's DNA
scene on mobile if WebGL fails, and a static browser-chrome app mockup inside
Why Dantora. Two follow-up asks landed in the same turn: replace the Contact
lead-capture form with a plain closing CTA, and delete the About section's
large decorative banner ("large empty blue/teal box").

Two requested details conflicted with hard rules and were substituted rather
than implemented literally:
- **CSS `@keyframes` for a "slowly pulsing" mobile DNA fallback and a
  blinking chat cursor** — hard rule #1 bans `@keyframes` outright, even for
  continuous decorative motion (`design-system.md` — ADR-0014's exception is
  discrete state only). Both are instead `@react-spring/web` `useSpring`
  calls with an async `to` chain (`while (true) { await next(...) }`), which
  oscillates forever without a rAF loop of its own or any keyframes. Same
  technique as `StatCounter`/`HeaderCta`'s existing bespoke-spring pattern.
- **A pixel-literal `radial-gradient(...rgba(14,165,233,0.2)...)`** —
  composed instead from the already-existing `--raw-color-brand-alpha-20`
  Tier 1 primitive (identical value), per the token rule.

**Decision.**
- `src/lib/scene/dna-ink/config.ts` — `helixOpacity` 1.8→2.2, `brightness`
  0.55→0.7, `spin` 0.12→0.15. `helixColorA`/`B` were already the requested
  `#0ea5e9`/`#7dd3fc` (ADR-0022) — no change needed there.
- `DnaInk` (`components/scene/dna-ink/dna-ink.tsx`) gained an `onError`
  prop, fired from a `try/catch` around `new DnaInkScene(...)` (most common
  real cause: `WebGLRenderer` throwing on a refused context). `LazyDnaInk`
  releases its preload gate on error too, or a refused context would strand
  the curtain until the 6s timeout. New `DnaInkWithFallback` (mobile-only,
  gated on the new `MOBILE_QUERY` in `use-media-query.ts`) swaps to
  `MobileDnaFallback` — the CSS/spring gradient — on failure; only the Hero
  instance uses it (Contact's scene is already desktop-only).
- New sections, all net-new (no Figma node) and built from the page's
  existing vocabulary (`TextEngine` + the three text presets, `<Inview>` +
  `ELEMENT_MOTION`, `<Button>`, the card/glass tokens):
  - `LiveDemo` (`live-demo.tsx`) between Services and About. Letter-level
    `TextEngine` (not the page's usual word-level presets — a chat bubble
    needs the finer grain) with per-message `delayIn` computed from a pure
    `reduce` over the previous messages' own length × stagger, so bubbles
    "type" in sequence. `min-h-lvh`, matching every other full-bleed
    section — see the *consequence* below on why that stopped being
    optional partway through.
  - `Pricing` (`pricing.tsx`) between Team and Contact. Two cards from one
    `PlanCard` sub-component; Pro carries the new `--glow-accent` token and
    a badge.
  - `AppMockup` (`app-mockup.tsx`), a static (not typing) browser-chrome
    card inside Why Dantora, content from `WhyContent.mockup`.
  - `FloatingCta` (`components/common/floating-cta.tsx`) — same
    `useSpring` fade/lift technique as `HeaderCta`, but driven by
    `window.scrollY > 300` behind a raw scroll listener (the same pattern
    `Spring`'s own `mode="forward"` already uses), not an
    `IntersectionObserver` — the trigger genuinely is a scroll offset, not
    an element's position.
- `Contact` (`contact.tsx`) rewritten: the `POST /api/contact` lead-capture
  form is gone, replaced with a centred heading/subtext/two-button CTA. The
  DNA scene backdrop and the "rides over Team" `z-20` choreography are
  unchanged. `ContactContent` (`data/mocks/home.ts`) dropped `FormField`/
  consent/`submitLabel` for `actions: readonly CtaLink[]`.
- `AboutBanner` deleted (component + its three CSS tokens
  `--raw-gradient-about-banner`/`--raw-pattern-grid`/
  `--raw-background-about-banner`, ADR-0027). Removing it without adjusting
  layout would have left the same footprint as a plain-background gap
  rather than actually closing it, so About's content row and fixed height
  both moved up by the banner's own span (37.75rem) — see about.tsx's
  docstring for the exact numbers.

**Consequences.**
- **About no longer rides over the section above it via `-mt-[100lvh]`.**
  That trick (About riding over Services' pinned runway) needs a **matched
  pair**: a multi-viewport scroll-scrubbed runway directly before it, tall
  enough that pulling About up by exactly one viewport only covers the
  runway's last frame (home-sections.md's own warning about this pair).
  Live Demo now sits directly before About and is a single `min-h-lvh`
  block, not a runway — the negative margin canceled its entire height and
  hid it completely rather than revealing it (caught live in-browser: Live
  Demo's content was invisible, About's stats sat directly under the
  header). Fixed by dropping `-mt-[100lvh]`/`z-10` from About entirely and
  letting it flow normally after Live Demo. The Services→About "rides over"
  transition is gone; Services' pinned rail now simply releases and Live
  Demo follows in plain flow. Nothing asked for that transition to survive
  Live Demo's insertion, and re-engineering Live Demo into a second
  scroll-scrubbed runway to preserve it was out of scope.
- **Team's "stays pinned, next section rides over it via `z-20`" mechanism
  (`team.tsx`) needed `Pricing` to opt in too**, not just `Contact`: Team is
  `sticky top-0 z-10` and "stays pinned for the rest of the page" on its
  own — whatever comes right after it needs a higher stacking context *and*
  an opaque fill, or Team shows through underneath during the scroll
  handoff. Caught the same way (in-browser): without `z-20` on `Pricing`,
  Team's testimonial rail bled through behind the pricing cards. Fixed by
  giving `Pricing` `relative z-20 rounded-t-section bg-background`,
  mirroring `Contact`'s own treatment exactly.
- **`AppMockup` moved from bottom-right to top-right inside Why Dantora.**
  First placed bottom-right per a literal reading of "browser mockup in the
  Why section"; `FloatingCta` is fixed to that same corner site-wide, and
  Why Dantora is `h-lvh`, so the two collided the moment the CTA appeared
  (caught in-browser: "Try Free" rendered on top of the mockup's last
  message). Any future net-new decorative element in a full-viewport
  section should default away from the bottom-right corner for the same
  reason.
- `SITE_NAV`'s "Pricing" link now points at `#pricing` (was `#about`, a
  placeholder from before a real Pricing section existed).
- New tokens: `--raw-gradient-dna-fallback` (Tier 1, mobile DNA fallback),
  `--raw-shadow-glow-accent` (Tier 1) + `--glow-accent` (Tier 2, Pro card
  glow) — both composed from existing brand-alpha primitives, no new
  literals. New icon: `CheckIcon` (pricing feature lists).

## Related

[[home-sections]] · [[dna-ink-scene]] · [[design-system]] · [[animation-system]]

---

## ADR-0028 — `/app` embeds the study app via iframe, on a second root layout; the app's own files were never supplied

- **Status:** Partially accepted — routing/embedding shell done, the actual
  app content is blocked
- **Date:** 2026-08-20

**Context.** Requested: move the real AI Doctor Study product (a chat/
flashcard/exam SaaS app with its own `index.html`, `auth.js`, twelve numbered
feature modules, etc.) onto this domain at `/app`, with zero shared chrome
with the marketing site — literally "NO Next.js header/footer/layout."
That product's source has never existed in this repository at any point this
session, and wasn't attached to or pasted into the request. Copying files
that don't exist isn't possible; a full chat/auth/flashcard/exam application
was **not** fabricated to fill the gap — see the "What was not done" section.

**Decision — routing/embedding shell (done).**
- `src/app/(marketing)/` — a route group holding what used to be the bare
  `src/app/layout.tsx` + `page.tsx` (plus `error.tsx`/`loading.tsx`/
  `not-found.tsx`, moved alongside them). Route groups don't add a URL
  segment, so this still serves `/` — see [[routing]].
- `src/app/app/layout.tsx` + `page.tsx` — a **second, separate root layout**
  (Next's documented "multiple root layouts" pattern) for `/app` only. Carries
  none of the marketing chrome: no font load, no `PreloadProvider`/
  `Preloader` curtain, no `ScrollLayout`, no `AdaptiveGrid`, no cookie banner.
  Only `globals.css` (for Tailwind's reset/utilities) and explicit
  `h-full overflow-hidden` on `html`/`body`.
- `src/views/app/study-app-frame.tsx` (`StudyAppFrame`) — a **Server
  Component** rendering `<iframe src="/app/index.html" className="block
  h-dvh w-dvw border-0">`. The request specified `'use client'`, but nothing
  here needs client-side state/effects to render an iframe, and hard rule #6
  defaults to Server Components — deviated from the literal instruction on
  purpose, not an oversight.
- `data/mocks/home.ts`: `EXTERNAL_APP_URL` (an absolute `https://
  app.aidoctor.study` URL) renamed `APP_URL` and repointed to `/app` — same
  origin now, so `next/link` gives real client-side navigation instead of a
  full page load to another domain. Every "Start for Free"/"Start Free
  Trial" CTA already ran through that one constant (ADR-0024), so this one
  change covers all of them; the Team tail card's "Get Started"
  (`TEAM_CONTENT.more`) previously pointed at `#contact` and was repointed to
  `APP_URL` too, since it was explicitly named as one of the buttons that
  should lead to the app. `PRO_CHECKOUT_URL` (the Gumroad link) is untouched
  — pricing and app-entry are still different destinations.
- No separate "redirect" was built for `/` vs `/app` — Next's file-based
  routing already does exactly that by having two distinct routes; adding
  middleware/redirect logic on top would be solving an already-solved
  problem.

**What was NOT done, and why.** `public/app/` contains only a placeholder
`index.html` (clearly labeled as a placeholder, dark-themed to match so it
doesn't look broken if loaded) and a `README.md` listing exactly which files
are still needed and where to put them. The real `index.html`, `styles.css`,
`auth.js`, the twelve numbered feature modules, `logo.svg`, and any other
assets were requested but never supplied — inventing a working version of
someone else's SaaS product's source code was not an option. Once those
files exist, dropping them into `public/app/` (same paths the app's own
`index.html` expects — same-origin, so its relative script/asset references
should resolve as-is) and deleting the placeholder `index.html` should be
the only remaining step; no further code changes are expected to be needed.

**Known rough edge.** `next build` emits one warning —
`metadataBase property in metadata export is not set` — for Next's
auto-synthesized `/_not-found` route (the fallback for a path matching
*neither* root-layout group, distinct from `(marketing)/not-found.tsx`,
which handles the common in-marketing-site case and does have
`metadataBase` set). Adding a top-level `src/app/not-found.tsx` outside both
groups, with its own `metadataBase`, did not resolve it. This only affects
unresolved OG-image URLs for that one synthetic edge-case route — cosmetic,
not a functional bug (confirmed: `/`, `/app`, and an arbitrary unmatched path
all resolve correctly at runtime) — not worth further chasing into Next
internals right now.

Related: [[routing]], [[design-system]], ADR-0024.

---

## ADR-0027 — Replaced the last stock photos (Features cards, About banner) with CSS gradients

- **Status:** Accepted
- **Date:** 2026-08-17

**Context.** The Dantora clinic stock photos on the three "photo" Services/
Features cards (`/assets/Our Services/*.png`) and the About banner
(`/assets/About/banner.png`) were the last real photography left on the site
after the testimonial photos were already replaced with initials avatars
(ADR-0024). Requested: gradient cards with an emoji/icon instead of the
Features photos, and a specific CSS gradient + grid pattern for the banner.

**Decision.**
- `ServiceCard.image` → `ServiceCard.emoji`. The "photo" variant's background
  moved from `<Image fill>` to a new `--raw-gradient-feature-card` token
  (dark navy/brand-blue, same three shades as the About banner's gradient at
  a different angle/stop mix, so the two read as related). Each card keeps
  its title and gets one decorative, `aria-hidden` emoji: 🩻 Image Analysis,
  💊 Drug Mnemonics, 📝 Exam Prep. The lime→dark-card (ADR-0024) and brand
  (solid accent) variants were untouched — they never used a photo.
- `AboutContent.bannerImage` removed; `AboutBanner` now renders the exact
  requested gradient (`linear-gradient(135deg, #0c1524 0%, #0c4a6e 50%,
  #070d17 100%)`, `--raw-gradient-about-banner`) plus a new subtle grid
  overlay (`--raw-pattern-grid`, two 1px hairline layers tiled 40px apart),
  composited into `--raw-background-about-banner` the same way Hero's glow +
  dot pattern were composited under ADR-0024.
- **`AboutBanner` dropped its parallax spring entirely** and is no longer a
  Client Component. The drift (`useLoop` → `useSpring` → `translate3d`) existed
  specifically to crop-and-shift an oversized *photo* against scroll — with no
  photo, there's nothing for it to reveal, so keeping the spring around would
  have been motion for its own sake on a flat background. This isn't a hard
  rule #1 violation (nothing here plays music with no listener) — it's a
  legitimate simplification once the thing the animation was *for* was
  removed, per the "don't leave half-finished/dead animation code" instinct.
  The static gradient still respects `rounded-card` and its container's box
  the same way the old image did.

**Not removed:** the actual asset files under `public/assets/Our Services/`
and `public/assets/About/` — deleting files is a separate, more destructive
action than removing the code paths that referenced them, and wasn't asked
for.

Related: [[home-sections]], [[design-system]], ADR-0024.

---

## ADR-0026 — Narrowed the Hero/Contact canvas seam by moving both sides toward each other

- **Status:** Accepted
- **Date:** 2026-08-17

**Context.** ADR-0025 set the DNA canvas's `bgColor` to `#1e293b` — clearly
lighter than the surrounding `--surface-section` panel (`#070d17`, shared with
`--background` since ADR-0023) — specifically so the MULTIPLY-blended helix
would stay visible after `#070d17` made it read as invisible in production.
The project owner then flagged the resulting **visible seam** inside the Hero
viewport (and Contact, same pattern) as a bug: "the left panel background
should match the right side... remove any split or two-tone effect." Asked
directly, given that matching them exactly (`#070d17`) is the specific change
that caused ADR-0025 in the first place, the project owner chose a middle
path: nudge both colours toward each other rather than fully matching either
one.

**Decision.**
- New Tier 1 primitive `--raw-color-navy-800: #10182a`. `--surface-section`
  (Hero + Contact panel) now points at it instead of `--raw-color-mint-50`
  — a deliberate, one-token break from `--background`, which stays
  `--raw-color-mint-50` (`#070d17`) untouched. Why/Services/the page default
  are unaffected.
- `DNA_INK_CONFIG.bgColor` moved `#1e293b` → `#16202e` (darker, meeting the
  panel from the other side).

**Consequence, accepted on purpose.** `--surface-section` and `--background`
were unified under ADR-0023 specifically to remove the seam *between* Hero
and Why (they used to be different colours in the ADR-0022 two-tone version).
This ADR reopens a **faint** version of that seam — at the Hero→Why and
Contact section boundaries, and at the Hero's own `rounded-b-section` corner
cut where it meets the page background — in exchange for closing the much
more noticeable seam *inside* the Hero/Contact viewport, between the copy
panel and the canvas. The two seams are not the same size: this one is
roughly half the magnitude of the one it replaces, and sits at a natural
section boundary rather than in the middle of a single screen, which reads as
far less like a rendering glitch.

**If asked again to fully remove the seam:** matching `bgColor` to
`--surface-section` exactly has been tried twice now (ADR-0024, and implicitly
what "remove the split" asks for) and both times made the helix unacceptably
faint on the live deploy. Re-verify on the actual production build before
matching them again — see ADR-0025's note about this exact trap.

Related: [[dna-ink-scene]], [[design-system]], [[home-sections]], ADR-0023,
ADR-0024, ADR-0025.

---

## ADR-0025 — DNA scene `bgColor` moved off `#070d17` after live production testing

- **Status:** Accepted
- **Date:** 2026-08-17

**Context.** The project owner reported "the DNA helix isn't rendering in
production" on the live Vercel deploy (`aidoctor-landing.vercel.app`). A full
server/build/network audit found nothing wrong: `next build` compiled clean,
the scene's chunk was present and byte-identical between the local production
build and the live deploy (same `Content-Length`, same content hash), no CSP
header existed anywhere, and the page title/content confirmed the deploy was
current, not stale. Asked to check DevTools directly, the project owner
confirmed: **no console error**, just a dark, empty-looking hero.

This matched ADR-0024's own documented prediction exactly — `bgColor:
#070d17` (identical to the surrounding panel colour) was expected to leave the
MULTIPLY-blended ink/helix "faint," and in practice on a real device that
read as fully invisible, not merely dim. There was no bug to fix; the
literal, informed choice from ADR-0024 just looked worse in production than
anticipated.

**Decision.** `bgColor` moved from `#070d17` to `#1e293b` (a muted mid-dark
slate) — offered as the "compromise" option back in ADR-0024 and declined at
the time in favour of the exact-match value; now chosen after seeing the
exact-match result live. Dark enough to stay in theme and keep most of the
seam-free blend into the surrounding `#070d17`/`#0c1524` panels; light enough
that `MultiplyBlending` leaves the helix dim but genuinely visible instead of
essentially gone. A small visible seam against the panel is the accepted
trade-off, same shape as ADR-0022's original light-canvas trade-off, just at a
smaller magnitude.

**What this ADR is NOT.** Not a case-sensitivity fix, not a CSP fix, not a
stale-deploy fix — none of those were the problem. Worth recording precisely
*because* the investigation ruled all of them out first; a future agent
hitting a similar "works locally, not in production" report on this scene
should check whether the symptom is actually this known faintness trade-off
before assuming a build/deploy bug.

Related: [[dna-ink-scene]], [[design-system]], ADR-0024.

---

## ADR-0024 — Dark-mode polish pass: card/chip/input tokens, DNA scene overrides, testimonials, footer, cookie fixes

- **Status:** Accepted (phase 1 of a larger, explicitly phased request)
- **Date:** 2026-08-17

**Context.** After ADR-0023's dark-theme conversion, the project owner sent a
large combined spec: exact rgba values for every surface (cards, nav, buttons,
chips, inputs, form panel), a request to move the DNA scene's `bgColor` fully
dark, a vanilla-JS 3D hover system, a 4-tier adaptive performance engine, a
text-only fallback mode with a real payment link, and several content/footer/
cookie items. Given the size and the direct conflicts with this project's own
hard rules (spring-only motion; the DNA scene's light-backdrop requirement),
four decisions were confirmed live with the project owner via `AskUserQuestion`
before any code changed — recorded here since they're load-bearing for
everything below:

1. **DNA scene `bgColor` → exactly `#070d17` (dark), as literally specified** —
   overriding ADR-0022/0023's decision to keep it light, *knowingly*: the
   project owner was shown the documented MULTIPLY-blending consequence (the
   ink/helix fades to near-invisible on a dark backdrop, and no shader change
   is allowed to fix it) and chose this outcome anyway, over a muted-mid-tone
   compromise or keeping the canvas white. This is **not** an agent error to
   "fix" later — see the callout in `globals.css` and `config.ts`.
2. **3D hover effects → vanilla JS mousemove listeners, as literally
   specified** — a deliberate, informed exception to hard rule #1 (spring-only
   motion), authorized by the project owner specifically for this feature.
   **Deferred to a follow-up pass**, per decision 4 below — not implemented in
   this ADR. A future agent implementing it should use raw
   `pointermove`/transform writes, not `@react-spring/web`, and should link
   back to this ADR so the deviation isn't mistaken for an oversight.
3. **The Gumroad Pro link (`https://hyperai3.gumroad.com/l/aidoctorstudypro`)
   and its pricing are real and confirmed** — wired into the site (see below),
   not fabricated.
4. **Scope phased**, per the project owner's own choice: this ADR covers only
   the "dark-mode critical fixes + content changes" bucket (cards, buttons,
   chips, inputs, form panel, DNA scene colors, testimonials, footer, cookie
   banner, button hrefs). The 3D hover system, the 4-tier adaptive performance
   engine (device scoring, FPS-based throttling, battery API), and the
   text-only static-HTML fallback mode are **explicitly out of scope for this
   ADR** and were not started — they are separate, unstarted follow-up work.
   The performance-tier work in particular belongs to the `optimize-3d-scene`
   skill (hard rule #11) when it's picked up, not a hand-rolled implementation.

**Decision — new design tokens** (`globals.css`), added rather than
hardcoding the spec's rgba values in `className`, per hard rule #4:

| New Tier 2 role | Value | Used by |
|---|---|---|
| `--accent-soft` | `raw-color-lime-400` (`#7dd3fc`) | stat numbers, chip text — an alias, not a new primitive |
| `--action-primary-hover` | `raw-color-brand-600` (`#0284c7`) | primary button hover fill, now distinct from its border colour |
| `--action-outline-*` | cyan-alpha border/text/hover | the secondary button's new outline treatment |
| `--surface-card` / `--border-card` | `card-alpha-80` / `brand-alpha-15` | feature cards, testimonial cards, the team rail's tail card |
| `--surface-chip` / `--border-chip` | `brand-alpha-10` / `brand-alpha-20` | Hero's floating service chips |
| `--surface-input` / `--border-input` | `card-alpha-60` / `brand-alpha-20` | Contact form fields |
| `--glass-blur-strong` | `20px` | Contact's form panel only — the header/chips stay at the general `--glass-blur` (bumped `10px` → `12px` to match the spec's Nav value) |

`--surface-glass` / `--surface-glass-strong` moved from neutral black-alpha
(ADR-0023) to the brand's own ink-navy alpha (`rgba(7,13,23,…)`), matching the
spec's exact Nav/Form-panel values. `--surface-glass-subtle` was **retired** —
Hero's chips moved to the new dedicated `--surface-chip`/`--border-chip` pair
instead of reusing generic glass, so nothing referenced it anymore (verified
by grep before deleting). `--foreground-muted` moved from white-alpha to a
slate-blue tint (`rgba(148,163,184,.8)`), matching the spec's explicit "muted
text" value.

> [!important] `--action-secondary*` was deliberately NOT repointed
> The secondary *button* needed a new outline look, but `--action-secondary*`
> is a shared role also used as a plain light-cyan **fill** — the header/
> contact icon badges (`bg-accent text-action-secondary`) and the button's own
> trailing arrow disc. Repointing it to "transparent" for the button would have
> broken those. New `--action-outline-*` tokens carry the button-only meaning
> instead; see [[components/ui]].

**Decision — Services "lime" card and the Team "more" card** both moved off
`bg-action-secondary` (a solid light-lime fill) onto the new `--surface-card`/
`--border-card` dark-glass treatment, so they no longer need explicit dark-text
overrides — they inherit the ambient white `--foreground` like every other
card now. (ADR-0023 had given the lime card an explicit
`text-action-secondary-foreground` override because it was still light at the
time; that's reverted here since the card itself went dark.) The lime card's
internal list divider moved from `--border-subtle` (now light-alpha, invisible
on light surfaces) to `--border-card`, matching its own new border tone.

**Decision — testimonials replace the team rail's stock photos.** The
Dantora clinic's stock doctor photos (`TeamMember.image`) were removed —
there are no real AI Doctor Study student photos to use instead.
`TeamMember` gained `quote` and `initials`; `team.tsx`'s cards now render a
short pull-quote over a gradient initials-avatar (`--raw-gradient-avatar`,
composed from the same two brand shades as `--action-primary-border`/
`--accent`, kept at Tier 1 since Tier 2 tokens may not reference each other).
Content is the five names/credentials/quotes given verbatim.

**Decision — button hrefs externalized.** `EXTERNAL_APP_URL`
(`https://app.aidoctor.study`) and `PRO_CHECKOUT_URL` (the Gumroad link) are
new exported constants in `data/mocks/home.ts`. Every "Start for Free"/"Start
Free Trial" *link* now points at `EXTERNAL_APP_URL`; About's second action
("See Pricing") points at `PRO_CHECKOUT_URL`. **One exception, on purpose:**
Contact's form *submit* button was relabelled "Send Message" instead of
"Start Free Trial" — it's a `<button type="submit">` that posts to
`/api/contact`, not a link, and giving it the same label as the externally-
linking buttons while it does something completely different would be
confusing, not just redundant. The Services section's `id` moved from
`services` to `features` so `#features` (used by the nav and by "See Pro
Features"/"Explore Features") resolves to something real, rather than adding a
second id to the same element.

**Decision — new `SiteFooter`** (`components/common/footer/site-footer.tsx`),
mounted as a sibling of `<main>`, not inside it — it's its own landmark, not
page content. Links to `/terms`, `/refunds`, `/cookies`, `/privacy` as
requested; **none of those four routes exist yet** (verified: `/terms` 404s).
Building their legal content is unstarted, separate work — this ADR only adds
the links, it doesn't fabricate legal copy.

**Decision — cookie system updated in place, not replaced.** The project
already had a full `Cookie`/`CookieBanner`/`CookiePreferencesModal`/
`cookieStore` system with a granular preferences modal (analytics/marketing
toggles) — more capable than the spec's plain two-button ask, not less, so it
was kept and restyled rather than replaced:
- `STORAGE_KEY` renamed `cookie-consent-v1` → `aid_cookie_consent`, matching
  the spec. Old stored consent is orphaned, not migrated (consistent with how
  the DNA scene's `localStorage` key rename was handled in ADR-0022).
- **Bug fixed while touching this file:** `acceptAll()` was setting
  `analytics`/`marketing` to `false` — "Accept all" behaved identically to
  "Reject all". Now sets both `true`.
- Copy/labels updated to the spec's wording ("Accept All" / "Essential Only"),
  and both variants restyled onto the site's actual button tokens
  (`--action-primary*` / `--action-outline*`) instead of a generic
  foreground-inverted style.
- The banner's policy link moved from `/privacy-policy` (never existed) to
  `/cookies`, matching `SiteFooter`'s link and the spec's explicit ask.

**What was NOT done** (see decision 4): 3D hover effects, the 4-tier
performance/battery/FPS system, and the text-only fallback mode. `?perf=` /
`?textonly=` query-param testing hooks from the original spec don't exist
either, since the systems they'd test don't exist yet.

Related: [[design-system]], [[components/ui]], [[home-sections]],
[[dna-ink-scene]], ADR-0022, ADR-0023.

---

## ADR-0023 — ADR-0022's two-tone panels were unreadable; converted to a full dark theme

- **Status:** Accepted
- **Date:** 2026-08-17

**Context.** ADR-0022 scoped the AI Doctor Study re-theme to exactly six named
color tokens, on the letter of the request. That left `--background` bound to
`--raw-color-white` and `--foreground` to `--raw-color-black` untouched, while
`--surface-section` / `--surface-section-deep` (the Hero/Contact/About/Team
panel colour) went dark navy. Tested live: the Hero's own copy — eyebrow,
headline, description — sits directly on `--surface-section` with no explicit
text colour, so it rendered as **black text on a near-black panel**,
essentially invisible. The project owner confirmed this reads as broken, not
as an intentional two-tone design, and asked for a proper dark theme instead.

**Decision.** Converted to a single, fully coherent dark theme rather than
patching the one broken spot:

- `--background: var(--raw-color-mint-50)` (was `--raw-color-white`) —
  reuses the same dark-navy primitive as `--surface-section`, so Hero, Why and
  Services read as one flat dark canvas instead of dark-panel-on-white-page.
- `--foreground: var(--raw-color-white)` (was `--raw-color-black`).
- Every Tier 2 role that implicitly assumed "dark text on a light surface" was
  re-pointed in the same pass, not left to break silently:
  `--surface-glass/-subtle/-strong` (white-alpha → black-alpha, so frosted
  glass panels — header, floating chips, the Contact form card — stay
  legible against a dark page), `--border-subtle` (black-alpha-10 →
  white-alpha-12, so it's visible drawn *on* the dark page — the Hero divider,
  the Team slider's progress track), and `--foreground-muted` /
  `--foreground-subtle` (black-alpha → white-alpha, so de-emphasised copy dims
  white instead of darkening black).
- **One deliberate exception, not a bug:** the Services "lime" card
  (`CARD_VARIANT.lime`, `services.tsx`) keeps a light lime background by
  design (an accent card popping against the dark rail, same intent as the
  original Dantora design's lime card). It cannot inherit the new white
  `--foreground`, so it now carries an explicit
  `text-action-secondary-foreground`, and its internal list divider swapped
  from `bg-border-subtle` (now light, invisible on a light card) to
  `bg-action-secondary-border` — the token whose entire purpose is a border
  tone visible against the lime surface, already used for that card's own
  outer border.
- Added Tier 1 primitives: `--raw-color-white-alpha-40`,
  `--raw-color-black-alpha-60`, `--raw-color-black-alpha-90`. Removed
  `--raw-color-black-alpha-10` and `--raw-color-black-alpha-40`, which became
  unused once `--border-subtle` and `--foreground-muted` moved off them
  (verified with a repo-wide grep before deleting).
- `opengraph-image.tsx`'s hardcoded card colours (a Satori/`next/og` route,
  which can't consume CSS custom properties) were already flipped to dark
  under ADR-0022 and needed no further change.

**What did not change.** [[dna-ink-scene]]'s `bgColor` — still white/light,
for the same MULTIPLY-blending reason documented in ADR-0022: the scene would
otherwise erase its own helix, and fixing that would mean a shader/blend-mode
change, off-limits under hard rule #2. The canvas remains a visible light
rectangle inside the dark Hero/Contact panels; that trade-off stands from
ADR-0022 and was not part of what the project owner flagged as broken.

Related: [[design-system]], [[home-sections]], [[dna-ink-scene]], ADR-0022,
ADR-0019.

---

## ADR-0022 — Re-themed Dantora → AI Doctor Study; DNA scene keeps a light `bgColor`

- **Status:** Accepted
- **Date:** 2026-08-17

**Context.** The project was rebranded from the Dantora clinic template to AI
Doctor Study, an AI study companion for medical students. Scope was
deliberately narrow: brand name, copy, and six named color tokens
(`--raw-color-brand-500/900`, `--raw-color-lime-200/400`,
`--raw-color-mint-50/100`) — no layout, animation, spring config, or shader
changes ([[animation-system]], [[dna-ink-scene]] hard rules unaffected).

`--raw-color-mint-50/100` back `--surface-section` / `--surface-section-deep`,
the panel colour behind Hero, Contact, About and Team ([[design-system]] →
*Current theme state*). Swapping them to a dark navy (`#070d17` / `#0c1524`)
darkens those four panels, while `--background` itself (Why, Services, and the
page default) stays bound to `--raw-color-white` and was **not** part of the
requested swap — so the page is intentionally two-tone: dark Hero/About/Team/
Contact panels against white Why/Services bands. This was a deliberate, scoped
choice — see the two `AskUserQuestion` decisions this ADR is based on: (1)
widen the desktop nav pill (`w-fit`, was a Figma-exact `w-[26.375rem]`) rather
than drop or shrink the 5th nav label, and (2) confirmed live with the project
owner that this two-tone panel split, not a full dark re-theme, is what "change
only these tokens" meant.

**The harder conflict: the DNA Ink scene's `bgColor`.** [[dna-ink-scene]]
documents that its ink/helix clouds use `THREE.MultiplyBlending` and **only
read on a light backdrop** — on a dark `bgColor` they have nothing to darken
and visually vanish, and there is no additive-bloom fallback (that would be a
shader change, off-limits under hard rule #11/ADR-0018's scope). The scene's
own `config.ts.bgColor` used to equal `--raw-color-mint-50` by convention (both
were the same "paper" colour), so darkening mint-50 would have silently broken
the scene's centrepiece animation.

**Decision.** `DNA_INK_CONFIG.bgColor` stays **white** (`#ffffff`), decoupled
from `--raw-color-mint-50`. Only the scene's hue fields — `helixColorA/B`,
`inkCore/Mid/Edge`, `atmoColor`, `flameColor/2` — shifted to a cyan/sky family
matching the new `#0ea5e9` brand colour. The trade-off, confirmed with the
project owner: the canvas now sits as a visible light rectangle inside the
dark Hero/Contact panels rather than blending seamlessly, in exchange for the
helix staying fully visible and untouched mechanically.

**Consequences.**
- `src/lib/site.ts`'s `brand.mint` (used by `opengraph-image.tsx`'s card
  background) went dark, which also required flipping that route's hardcoded
  text colour from `#000000` to `#ffffff` — a literal, not a token, because
  Satori/`next/og` can't consume CSS custom properties.
- The DNA Ink `localStorage` tuning key moved from `dantora:dna-ink` to
  `ai-doctor-study:dna-ink` (`dna-ink-controls.config.ts`) — old stored
  overrides are simply orphaned, not migrated, consistent with
  `readStoredConfig`'s existing "drop unknown/stale" behaviour.
- JSON-LD `@type` moved `MedicalClinic` → `EducationalOrganization`
  (`structured-data.ts`) to match the new business.
- Section anchor ids (`#hero`, `#why`, `#services`, `#about`, `#team`,
  `#contact`) and component/file names (`WhyDantora`, `why-dantora.tsx`, the
  `/assets/Why Dantora/…` and `/assets/Our Team/…` image folders) were **left
  unchanged** — renaming them touches no visible copy and risked breaking
  image paths for no user-facing benefit.

Related: [[design-system]], [[dna-ink-scene]], [[home-sections]], ADR-0018,
ADR-0019.

---

## ADR-0021 — Page readiness is gated by components, not by `window.load`

- **Status:** Accepted
- **Date:** 2026-08-10

**Context.** The preloader originally treated `window.load` +
`document.fonts.ready` as "the page is ready". Both fire early relative to what
the visitor actually sees: `window.load` accounts for the document's own
subresources and nothing else. The hero's centrepiece — [[dna-ink-scene]] — is a
`dynamic({ ssr: false })` import fetched *after* hydration, so it is invisible to
that signal. Measured: the curtain was gone at **982 ms**, before `three` had
been downloaded, let alone before a frame was drawn. Any future heavy leaf (a
video, a large decoded image, a second scene) has exactly the same problem.

**Decision.** Readiness is **contributed**, not inferred. `PreloadProvider`
exposes `registerGate()`; a component that must be on screen before the reveal
claims a gate in an effect and releases it when genuinely ready. `loaded`
requires the document signals *and* an empty gate set *and* a `MIN_DURATION_MS`
floor.

Three rules make it safe, and each exists because the naive version fails:

1. **Claim eagerly, release late.** The gate is claimed in the eagerly mounted
   wrapper (`LazyDnaInk`), not inside the lazy chunk — by the time that chunk
   loads the preloader may already have finished. It is released from the first
   *drawn frame*, not from mount, because a live GL context with nothing on
   screen is the exact state being hidden.
2. **Opt in per instance.** Gating is a prop (`gatesPreload`), not automatic. An
   off-screen instance never renders, so an automatic gate would never resolve —
   the Contact scene would hold the curtain until the timeout.
3. **Always have a ceiling.** `GATE_TIMEOUT_MS` (6 s) lifts the curtain
   regardless. A failed chunk or a refused WebGL context must degrade to a
   slightly late reveal, never to a permanently opaque page.

**Consequences.** Readiness is honest but no longer knowable from one place —
what the curtain waits for is the sum of whoever claimed a gate. The timeout is
the backstop that keeps that from being dangerous. Cleanup must release the gate
(return the releaser as the effect's cleanup), or an unmounted component strands
the curtain. The releaser is idempotent so a double call is harmless.

**Alternatives rejected.** A fixed delay — dishonest in both directions, too
short on a cold connection and pure dead time on a warm one. Gating on the lazy
chunk's `import()` promise — resolves when the module is *parsed*, which is still
several hundred milliseconds before anything is drawn.

---

## ADR-0020 — One layout breakpoint; the adaptive grid is desktop-only

- **Status:** Accepted
- **Date:** 2026-08-10
- **Amends:** ADR-0019

**Context.** ADR-0019 recorded that the page did not reflow and that the
sub-640 breakpoint was inherited guesswork, pending a mobile Figma frame. That
frame still does not exist, but tablet and mobile were requested anyway — so the
small-screen layout is **our design decision**, not a port.

**Decision.**

1. **`lg` (1024px) is the only layout breakpoint.** Above it, the Figma
   composition — absolutely positioned at the artboard's coordinates. Below it,
   an ordinary flow layout. Two layouts, not a spectrum: intermediate
   breakpoints would mean inventing intermediate designs.
2. **Sections are authored in mobile DOM order.** Absolute positioning ignores
   document order, so the desktop composition is reconstructed with `lg:`
   offsets rather than the markup being written desktop-first and reordered
   with `order-*`. The cost is that stacking becomes explicit — the hero copy
   needs `z-10` because the scene's canvas now follows it in the DOM.
3. **The adaptive grid is scoped to 1024–1440 (plus scale-up above).** Its 1024
   and 360 bases were actively harmful: an 820px tablet computed a 12.6px root
   while a 500px phone computed 21.6px — *smaller text on the larger device* —
   with a discontinuity at every edge. Proportional root-font scaling only earns
   its keep where the layout is absolutely positioned; a flow layout reflows on
   its own. Below `lg` the root is a plain 16px.
4. **The scroll choreography is kept at every breakpoint.** It shipped
   desktop-only for one revision on the argument that hijacking scroll is
   hostile on touch; that was reverted by request, and the argument was weaker
   than it looked — nothing in the Services scrub or either overlay calls
   `preventDefault`. Each is a pure function of scroll position, so the page
   scrolls normally and no gesture is taken. Only sizing is responsive. Note
   the Services runway and About's `-mt-[100lvh]` are a matched pair.
5. **Small screens still drop what genuinely costs.** Contact's second WebGL
   scene is not mounted below `lg`, the header nav moves into a burger panel,
   and the header's pill CTA is desktop-only — collapsed to a bare arrow disc it
   read as a broken control.

**Consequences.**

- The small-screen layout is **unreviewed against any design**. When a mobile
  frame arrives, expect the `lg:`-prefixed values to stay and the base classes
  to be replaced wholesale.
- Any new section must be written mobile-first and pinned with `lg:`, or it will
  silently only work on desktop.
- ADR-0019's "no mobile design → nothing reflows" consequence is superseded;
  its 1440-base and light-only-theme decisions still stand.

---

## ADR-0019 — One 1440 design base, scaled fully proportionally; light-only theme

- **Status:** Accepted
- **Date:** 2026-08-10

**Context.** The Dantora UI arrived as a **single** Figma frame — "Concept 4",
1440 × 5005, desktop only. The brief asks for identical proportions to Figma on
every screen. The starter's adaptive grid already scales a rem-based layout by
driving the root font-size, but it shipped configured for a 1920 design base and
damped the scale-up above it (`coef: 0.6666`).

**Decision.**

1. **1440 is the only desktop base.** The `{ maxWidth: 1920, baseWidth: 1920 }`
   breakpoint is gone, and the `html` media query below 1440 is
   `1.111111vw` (`16 × 100 / 1440`). There is no 1920 entry because there is no
   1920 design — inventing one means inventing a layout nobody drew.
2. **`GRID_SCALE_COEF = 1`.** Above 1440 the scale-up is now fully
   proportional rather than damped, because "the same proportions as Figma" is
   the explicit requirement. The starter's damping exists to stop a design
   ballooning on ultra-wide monitors; that trade is off here. Verified: at a
   2560 viewport the root font-size is 28.44 px — exactly `16 × 2560 / 1440`.
3. **Light-only theme.** The `prefers-color-scheme: dark` block is removed
   rather than extended. The page's whole visual identity is a MULTIPLY-blended
   point cloud on a mint surface: the clouds *darken* the backdrop, so on a dark
   `--background` they have nothing to darken and the scene disappears. A dark
   variant is a design problem, not a token override.
4. **Google Sans Flex replaces Onest**, with `GRAD`/`ROND`/`wdth` requested
   explicitly — the mockup pins all three.

**Consequences.**

- ~~**There is no mobile design.** …the sub-640 breakpoint is a guess.~~
  **Superseded by ADR-0020**, which adds a small-screen layout and scopes the
  adaptive grid to the desktop range. There is still no mobile Figma frame; the
  layout below `lg` is our design decision.
- Any future dark mode must start from the scene, not from `globals.css`.

---

## ADR-0018 — Port the DNA Ink sketch as a lib/component split, minus its dead passes

- **Status:** Accepted
- **Date:** 2026-08-10

**Context.** The scene arrived as a single self-contained `dna-ink.html` — an
import-map three.js sketch with a `CONFIG` object, inline GLSL, a `localStorage`
-backed slider panel, and a `render()` driving three `EffectComposer`s. It had to
become part of this Next.js project, with no HTML file left behind.

**Decision.**

1. **Split framework-free engine from React leaf.** `src/lib/scene/dna-ink/`
   holds `config.ts` / `shaders.ts` / `scene.ts` and imports nothing from React;
   `src/components/scene/dna-ink/` mounts it. Two new folders, mirroring the
   `lib/scene/` path [[optimize-3d-scene]] already sanctions. The alternative —
   one big `"use client"` component — would have put ~400 lines of GPU plumbing
   behind a React boundary and made the config unreachable from anywhere else.
2. **`CONFIG` becomes a typed module, not component props.** Hard rule #4 bans
   hardcoded values; a `DnaInkConfig` interface with one field per tunable makes
   the whole look editable from one file and type-checked at the call site.
3. **Delete the two bloom composers.** The sketch built `torusComposer` and
   `bloomComposer`, then assigned their render targets to `finalPass` uniforms
   (`torusTexture`, `bloomTexture`) that the final fragment shader — a one-line
   `tDiffuse` passthrough — never samples. Three full scene renders and two
   `UnrealBloomPass`es per frame, all discarded. Removing them is
   **visually lossless**: the on-screen image was always `finalComposer` alone.
   The passthrough `EffectComposer` is *kept* rather than collapsed to a bare
   `renderer.render()`, so the render-target path (and therefore the exact
   rasterisation, MSAA included) is unchanged and bloom can be reinstated.
4. **Clamp the pixel ratio (`maxPixelRatio: 2`).** The only deliberate visual
   deviation. The sketch used the raw `devicePixelRatio`; at 3× that is 9× the
   fragments for ~47 k overlapping point sprites. It is a config field, not a
   constant, so reproducing the sketch is a one-line change.
5. **Keep the debug panel, but gate it and make its output paste-ready.**
   Initially dropped — a UI that silently overrides the committed config from a
   previous session is a trap — then reinstated on request, with the trap closed
   three ways: it renders only when `controls` is true (default: development
   builds), `readStoredConfig` validates every restored key against the current
   shape, and its snapshot emits real `config.ts` source so a tuning session
   ends by committing the values rather than leaving them in `localStorage`.
   Panel chrome is tokenised under `--debug-*` and deliberately not themed —
   it floats over an arbitrary scene and must stay legible in both schemes.
   The scene gained `applyConfig()` for this: uniform writes only, debounced
   120 ms for the four settings that reallocate buffers, so a slider drag never
   remounts the canvas or drops the GL context.
6. **Modern `three` (`0.185`), not the pinned `0.143`.** `WebGL1Renderer` was
   removed in r163 → `WebGLRenderer`. Colour handling is unaffected: every
   palette colour goes through the sketch's own `hexToVec3`, and the custom
   shader passes carry no `<colorspace_fragment>` include, so nothing is
   re-encoded. Shipping a four-year-old three in a fresh Next 16 project was the
   worse trade.

**The one upgrade trap, and why it is invisible in code review.** r143 supported
`MultiplyBlending` on a non-premultiplied material via
`blendFunc(ZERO, SRC_COLOR)`. Modern `WebGLState` **deleted that branch**: it
logs *"MultiplyBlending requires material.premultipliedAlpha = true"* and then
sets **no blend function at all**, so the clouds inherit whatever state the
previous draw left behind. The port rendered — plausibly, even attractively —
while silently losing the density accumulation that makes overlapping dye go
dark, which is the entire ink-in-water effect. Setting
`premultipliedAlpha: true` restores it exactly: the premultiplied path is
`blendFuncSeparate(DST_COLOR, ONE_MINUS_SRC_ALPHA, ZERO, ONE)`, which reduces to
`dst * src` because every fragment in these shaders writes `alpha = 1.0`.
**Lesson for the next port: a scene that renders is not a scene that is
correct — read the console, and diff against the original side-by-side.**

**Consequences.**

- `three` is now a project dependency ([[tech-stack]]), and the
  [[optimize-3d-scene]] routing rule (hard rule #11) is permanently live — every
  performance request on this project must go through the skill.
- The scene subscribes to the shared ticker (ADR-0009); it does not start a
  second `requestAnimationFrame`.
- Not yet done, and deliberately left for a real optimisation pass: device
  tiering (§2), loader prewarm (§3), in-view gating (§4), the bot poster (§1).
  The port is faithful first; §14 says measure before cutting.

---

## ADR-0017 — A skill states its preconditions and its own internal conflicts

- **Status:** Accepted
- **Date:** 2026-07-24

**Context.** `optimize-3d-scene` (ADR-0016) was run for the first time on a real
scene outside this repo — a raw WebGL project, no three.js, no scroll. The fix
order held up; what cost hours was everything the skill left implicit. Ranked by
time burned:

1. **§0 could not be executed at all.** `renderer.info.render` /
   `.programs.length` exist only on `THREE.WebGLRenderer`, yet the skill's own
   title says "three.js / WebGL". The agent had to invent instrumentation before
   it could take a baseline.
2. **The measurement environment was never stated**, and all three failure modes
   fired: dev-mode numbers are invalid (eager chunk serving faked a §1 failure;
   Strict Mode's double-mount faked 2 listeners and a halved frame rate), a
   stale `next start` on the port served 500s that read as a code bug, and
   `waitUntil: "networkidle0"` never fires against `next start`.
3. **§1 actively breaks §3.** `dynamic(ssr: false)` means the scene cannot
   compile until after hydration; on Regular 3G + 4× CPU programs linked at
   5.0 s against a loader that lifted at 2.36 s. Two correct steps, silently
   contradicting each other.
4. **§3's stall list was GPU-only** — all four causes shader/texture/target —
   but the worst stall measured was a 3.9 s main-thread CPU decode. Workers
   appeared nowhere in the skill.

Plus four smaller ones: the `as="fetch"` preload credentials trap (only
`use-credentials` + `include` dedupes; the other pairings silently
double-download), §5's `1000/30` actually measuring ~26 fps because of how the
ticker throttles, §7's "cut the sparse end" having no lever on a *baked* point
buffer, and §13's `lvh` being read as applying to the layout when it is for the
canvas only.

**Decision.** Fold all of it back into the skill, and adopt two rules for how
this and every future skill is written:

- **A step states its preconditions.** §0 now ships a `getContext` hook that
  gives a raw WebGL scene the counted equivalents of `renderer.info`
  (`draws` / `verts` / `links[]` timestamps / captured `attrs`), and a
  *measurement environment* block: production build, kill the old server first,
  `waitUntil: "load"`, and — because SwiftShader is not a GPU — only counted
  quantities transfer, never absolute fps.
- **A step names where it fights another step.** §3 now carries the §1 conflict
  explicitly, with the measurement that exposes it (link timestamps vs handoff
  time) and the fix (preload the data from the HTML; gate the loader on
  scene-ready, not on a duration).

Also added: §3 gains a fifth stall cause (CPU decode → Worker, with
transfer-in-both-directions) and the preload-credentials warning; §5 states the
~26 fps reality; §7 requires a decile ordering check before truncating a baked
buffer; §13 splits canvas `lvh` from content `dvh`; §1's poster is rejustified
(crawler screenshots and the no-WebGL fallback — *not* layout stability) with
two crops for tighter-axis framing and the `headers()` → `○`→`ƒ` prerender
trade-off named.

**Consequences.** The skill now works on a scene with no three.js in it, and its
first section can be executed instead of merely read. The cost is a longer §0 —
an agent must build instrumentation and a production build before touching
anything — which is the correct tax: every number the skill asks for later is
worthless without it. Deliberately kept unchanged, because the field run
confirmed them: the cheapest-first ordering, the canonical-file table, and
"don't invent new shapes; port these" — the `device.ts` port dropped in clean
and is most of why that run went as fast as it did.

---

## ADR-0016 — Skills are registered in the vault, not just dropped in `.claude/`

- **Status:** Accepted
- **Date:** 2026-07-24

**Context.** The first Claude Code skill for this starter —
`optimize-3d-scene` — arrived as a folder under `.claude/skills/`. A skill there
is discoverable to Claude Code *at runtime*, but it is invisible to the vault:
nothing in `obsidian/` said it existed, when to reach for it, or how it relates
to the hard rules. That contradicts ADR-0006 (the vault is the single source of
truth) and leaves the invocation decision to model judgement — exactly the kind
of thing this project pins down in writing. A performance request on a
scene-carrying project would otherwise get whatever fix order the agent invented
that day, when the skill exists precisely because the order matters (audit →
bot path → tiering → prewarm → visibility gate → budgets → fill).

**Decision.** A skill is only "installed" once it is registered:

1. The skill lives at `.claude/skills/<name>/`.
2. A vault note under `workflows/` documents what it does, its trigger
   conditions, and how it maps onto this project's primitives.
3. It is linked from [[README]]'s Map of Content and from the skills table in
   [[ai-agent-guide]].
4. If invocation should be non-optional, the routing rule goes into AGENTS.md's
   hard rules — the shim every agent reads first.
5. It is logged in [[changelog]].

For `optimize-3d-scene` this became **hard rule #11**: a performance / jank /
pre-ship request **and** a three.js or WebGL scene in the project → invoke the
skill and follow its order. The vault note [[optimize-3d-scene]] additionally
maps the skill's canonical patterns (which reference an external workspace) onto
what the starter already ships — the shared ticker (ADR-0009) for its one-rAF
rule, `isBot()` (ADR-0010) for its bot path, the Lenis store for scroll, the
in-view hooks for its render gate — so following the skill does not produce a
second copy of infrastructure that exists.

**Consequences.** Skill invocation becomes a documented rule rather than a guess,
and the routing survives model, tool and session changes because it lives in
AGENTS.md and the vault, not only in the skill's own `description`. The cost is
one extra note plus two index edits per skill — the same tax every component and
hook already pays. The starter still ships **no `three` dependency**
([[tech-stack]] unchanged); rule #11 is dormant until a project adds one. A
wrong vault path inside the skill (`obsidian/Meta/…`, plus an `open-questions.md`
this vault does not have) was corrected as part of registering it — registration
is also the moment a skill gets checked against reality.

---

## ADR-0015 — Strict three-tier design-token naming convention

- **Status:** Accepted
- **Date:** 2026-07-17

**Context.** ADR-0004 made tokens the styling currency but never said what a token
should be *called*. The starter shipped two tokens (`--background`,
`--foreground`) and no grammar, so every project built from it would invent its
own — defeating the point of a shared starter, since an agent moving between
projects could not predict a token name without reading `globals.css`. Reference
taken from [Mavik Labs — *Design Tokens in Tailwind v4*](https://www.maviklabs.com/blog/design-tokens-tailwind-v4-2026/)
(three tiers: primitive → semantic → component).

**Decision.** Adopt the three-tier model with an explicit grammar, documented in
[[design-system]] and codified as AGENTS.md hard rule #4:

| Tier | Grammar | Lives in |
|------|---------|----------|
| Primitive | `--raw-<category>-<name>[-<shade>]` | `:root` |
| Semantic | `--<role>[-<variant>][-<state>]` | `:root` |
| Component | `--<tw-namespace>-<component>[-<property>]` | `@theme inline` |

- Only Tier 1 holds literals; Tier 2 names purpose, never appearance; Tier 2 is
  the themeable layer (dark mode overrides there). No tier may be skipped.
- Every `@theme inline` entry is exactly `--<namespace>-<role>: var(--<role>)`.
  `inline` is load-bearing — it inlines the `var()` into each utility so Tier 2
  overrides cascade; binding a literal freezes the value and breaks theming.
- Tier 3 stays rare by design (ADR-0012 prefers a React component).

**Two deliberate deviations from the reference article**, both verified against
`tailwindcss` v4.3.3 by compiling a probe stylesheet:
1. The article names primitives `--color-blue-500`. We prefix them `--raw-*` and
   keep them out of `@theme` — under Tailwind v4 a `--color-*` entry *generates
   utilities*, so naming primitives that way would emit a `bg-blue-500` for every
   raw value and let markup bypass the semantic tier.
2. The article lists `--duration-fast` / `--duration-normal` next to `--ease-*`.
   **There is no `--duration-*` namespace in Tailwind v4** — the probe confirmed
   `duration-fast` compiles to nothing and the variable is not even emitted from
   `@theme inline`. Durations therefore stay Tier 2 only, consumed as
   `duration-[var(--duration-fast)]`. (`--ease-*` *is* a real namespace and is used.)

Retrofit is **minimal and unopinionated**: the existing background/foreground
tokens were restructured into the tiers, and the primitives/durations/`--ease-entrance`
/`--leading-display` they imply were added. **No brand palette was invented** —
the convention is the deliverable; projects add `--raw-color-brand-*` themselves.

**Consequences.** Token names are now predictable across every project from this
starter. This **amends ADR-0004**, which said only that new values go in
`globals.css` first — they must now also follow the tier grammar. `globals.css`
grew a documented tier structure but stays bounded (ADR-0012). Existing markup is
unaffected: `bg-background` / `text-foreground` still resolve, since the Tier 2
names and `@theme` bindings kept their public names.

---

## ADR-0014 — Narrow CSS-transition exception for trivial state changes

- **Status:** Accepted
- **Date:** 2026-07-17

**Context.** ADR-0002 banned CSS transitions outright to force every motion
through the spring layer. In practice the ban's cost lands hardest where its
benefit is lowest: a nav link fading its colour on hover had to become a client
component wrapping `<Hover>` with a spring config, to animate one property that
no user will ever interrupt or perceive as physical. The rule pushed teams toward
either boilerplate or quiet rule-breaking.

**Decision.** Keep hard rule #1 for all real motion; carve out one narrow,
condition-bound exception. CSS `transition-*` is allowed **only** for simple,
discrete state changes — `hover:` / `focus-visible:` / `active:` colour, opacity,
border-colour, underline, and small decorative nudges — subject to three
conditions, all required:

1. **Token-backed timing** — `duration-[var(--duration-fast)] ease-entrance`; raw
   ms/cubic-bezier values remain banned by hard rule #4.
2. **`transition-*` only** — `@keyframes` stay banned outright. Anything long
   enough to need keyframes is long enough to deserve a spring.
3. **Utilities only** — the transition lives in `className`, never in a CSS file
   (ADR-0012).

Everything scroll-driven, revealing, layout-affecting, staggered, orchestrated,
or interruptible remains spring-based; text remains [[text-engine]]. Anything
past the allowed list is `<Hover>`.

**Consequences.** A hover colour change no longer needs a client component — the
common case gets cheaper and the spring layer keeps the cases it is actually good
at. This **amends ADR-0002**, whose "CSS transitions are banned" is now "CSS
keyframes are banned; transitions are limited to the list above". The exception is
deliberately narrow and enumerated rather than a judgement call ("simple
animations") so it cannot erode into general CSS animation. `--raw-duration-*` /
`--duration-*` / `--ease-entrance` tokens exist to serve it (ADR-0015).
[[animation-system]], [[design-system]], and [[ai-agent-guide]] updated to match.

---

## ADR-0013 — `<Inview>` self-observe fix; spring components honour resize

- **Status:** Accepted
- **Date:** 2026-06-07

**Context.** `<Inview>` only animated when an external `trigger` ref was passed.
Without one it never revealed. Root cause: `useDynamicInView` returns its target
attachment as a **callback ref** (`setNode`) in the first tuple slot, but
`in-view.tsx` destructured it as `inViewRef` and wrote `inViewRef.current = node`
in the JSX `ref` callback — assigning `.current` to a function instead of calling
it. `setNode` never ran, the observed `node` stayed `null`, and with no `trigger`
the observer had nothing to watch (`trigger?.current ?? node` → `null`). With a
`trigger` it worked only because `trigger.current` bypassed the dead `node` path.
TypeScript flagged this at build time (`Property 'current' does not exist on type
'TargetRefCallback'`), so the build was already failing.

Separately, `<Inview>`, `<Spring>`, and `<Hover>` tracked `width`
(`useWindowWidth()`) as a `useMemo`/`useEffect` dependency to re-evaluate mobile
gating on resize, but never passed it to `isMobileDisabled()` — so the value was
genuinely unused (ESLint `react-hooks/exhaustive-deps` warning) **and** resize
re-evaluation silently did nothing; the check always read `window.innerWidth` at
call time.

**Decision.** This is the second authorized edit to the `#do-not-modify` engine
(after ADR-0009). Two corrections:
1. In `in-view.tsx`, call the callback ref — `setInViewNode(node)` — instead of
   assigning `.current`, so the component observes itself when no `trigger` is
   given.
2. Pass the React-tracked `width` into every `isMobileDisabled(value, width)`
   call across `in-view.tsx`, `spring.tsx`, and `hover.tsx`. This is the
   documented second parameter of `isMobileDisabled` and makes the `width`
   dependency meaningful, fixing resize re-evaluation and clearing the lint
   warnings.

**Consequences.** `<Inview>` now works standalone (the common case). `yarn build`
and `yarn lint` are both clean (0 errors, 0 warnings). The springs folder remains
`#do-not-modify` by default — these were explicitly signed-off bug fixes.

---

## ADR-0012 — Styling lives in utilities and components, not `globals.css`

- **Status:** Accepted
- **Date:** 2026-05-22

**Context.** ADR-0004 made design tokens the styling currency and ruled that
"new values must be added to `globals.css` first." Combined with the
design-system guidance to *"extract repeated multi-class patterns to
`@layer components`"*, the path of least resistance for any repeated visual
pattern became a named class in `globals.css`. On an animation-heavy,
multi-section marketing site that grows the file without bound — a single
global stylesheet accumulating hundreds of component-specific classes that are
never deleted when their component is. The fix is a placement rule, not a
file-splitting trick: splitting `globals.css` into many files only spreads the
same bloat.

**Decision.** Styling follows a strict placement order; `globals.css` stays
bounded by design.

- One-off styling → **Tailwind utilities** in `className`. Nothing enters CSS.
- A repeated pattern with markup/structure/props → a **React component**
  (`components/ui/`), *not* a CSS class. This is the default answer to "this
  looks repeated" — e.g. an eyebrow label with a `::before` dot is an
  `<Eyebrow>` component, not a `.label-eyebrow` class.
- A repeated pure-utility combo with no structure → a Tailwind v4 `@utility`.
- `@layer components` is reserved **strictly** for what utilities and
  components genuinely cannot express: pseudo-elements (`::before`/`::after`),
  third-party DOM overrides (`!important` on library markup), complex
  descendant/state selectors.
- `globals.css` only ever holds: `@import`, tokens (`:root` + `@theme`), base
  element resets (`@layer base`), and the narrow `@layer components`
  exceptions above. If it grows past that, something was misplaced.
- CSS Modules were considered and **rejected** — a second styling mechanism
  for the rare bespoke-CSS case is not worth the extra mental model when
  motion is spring-based (no keyframes — ADR-0002) and utilities + components
  cover everything else.

**Consequences.** `globals.css` stays a few-hundred-line file indefinitely.
"Repeated thing" pressure now pushes toward React components — which the
project wants anyway. This **amends ADR-0004**: design *tokens* still go in
`globals.css` first, but component-specific *classes* no longer do.
[[design-system]] and [[component-conventions]] updated to match.

---

## ADR-0011 — API layer: `app/api` route handlers, secrets server-side

- **Status:** Accepted
- **Date:** 2026-05-22

**Context.** The starter had no API layer. It needs a convention for reaching
external services that keeps secret keys off the client and gives endpoints a
consistent shape.

**Decision.** External calls go through Next.js Route Handlers —
`src/app/api/<resource>/route.ts`:
- **The handler owns the work** — business logic, multiple upstream calls,
  filtering, and reading secret env vars all live in `route.ts`. No mandatory
  passthrough service layer; extract shared code only when genuinely reused.
- Secrets are safe in handlers because `route.ts` is never bundled to the
  browser. Secret env vars are **unprefixed**; `NEXT_PUBLIC_` only for
  browser-safe values.
- Every endpoint: validates input with `zod`, returns the `{ data }` /
  `{ error }` envelope via the shared `handle()` wrapper (`src/lib/api/`), runs
  on the Node runtime (not Edge).
- `src/env.ts` validates env with zod — `publicEnv` vs `getServerEnv()`.
- Client Components fetch via `apiFetch` (`src/lib/api-client.ts`), same-origin
  only. Render-time data is read in Server Components.
- Added `zod`. The example endpoint is `app/api/contact/route.ts`.
- Codified as **AGENTS.md hard rule #9**.

**Consequences.** A clear, secret-safe API convention (full note:
[[api-architecture]]). Server Actions were considered for mutations but
deferred — for now everything goes through `app/api`. The choice can be
revisited if forms need progressive enhancement. First server dependency
(`zod`) and first server-only env var (`CONTACT_ENDPOINT`) now exist.

---

## ADR-0010 — SEO & performance hardening

- **Status:** Accepted
- **Date:** 2026-05-21

**Context.** A review found gaps that would hurt a production marketing site:
`metadataBase` defaulted to `null` (relative OG/canonical URLs never resolved to
absolute — broken social previews); `themeColor` sat on the deprecated metadata
field; there was no `robots.txt`, `sitemap.xml`, or structured data; the
`next.config.ts` was empty; `ScrollLayout` leaked a `requestAnimationFrame`
loop; the home view was a top-level `"use client"` (violating hard rule #6);
and the animation-heavy starter ignored `prefers-reduced-motion`.

**Decision.**
- **Site config.** `src/lib/site.ts` (`siteConfig`) is the single source of
  truth for SEO, fed by `NEXT_PUBLIC_SITE_URL` (fallback `http://localhost:3000`).
- **Metadata.** `metadataBase` is always set; `themeColor` moved to a
  `generateViewport()` / `viewport` export; dead `keywords` / `other` tags
  dropped; OG dimensions corrected to match the asset.
- **Crawlability.** Added `app/robots.ts`, `app/sitemap.ts`, and a JSON-LD
  `Organization`+`WebSite` helper rendered once in the root layout.
- **App Router files.** Added `loading.tsx` (enables streaming), `error.tsx`,
  `not-found.tsx`.
- **Rendering.** `HomeView` is a Server Component; client-only animation moved
  to the `HomeShowcase` leaf — models hard rule #6 instead of breaking it.
- **Reduced motion.** `<ReducedMotion>` calls react-spring's `useReducedMotion`,
  toggling the global `skipAnimation` — one app-root mount covers every spring
  and `spring-text-engine`. Chosen over per-component handling for its reach.
- **Build config.** `next.config.ts` now sets `removeConsole` (prod),
  AVIF/WebP, `next/image` breakpoints aligned to the adaptive-grid widths, and
  `poweredByHeader: false`. React Compiler is left as a documented opt-in (needs
  `babel-plugin-react-compiler`).
- Fixed the `ScrollLayout` Lenis rAF leak (cancel on unmount).

**Consequences.** Social/SEO metadata is correct in production once
`NEXT_PUBLIC_SITE_URL` is set. The first project env var now exists (see
[[environment-variables]]). `isBot()` stays available but is discouraged — it
opts routes out of static rendering; reduced-motion is the preferred lever (see
[[seo-metadata]]). React Compiler remains opt-in pending a dependency install.

---

## ADR-0009 — Shared animation ticker; authorized engine performance refactor

- **Status:** Accepted
- **Date:** 2026-05-21

**Context.** A performance review of the animation engine found load issues that
scale with the number of animated components on a page:
- `useLoop` started a **private `requestAnimationFrame` loop per hook instance** —
  N scroll-driven components meant N rAF loops, none of which ever stopped.
- `useWindowWidth` attached a **separate debounced `resize` listener per call** —
  one per spring component.
- `useDynamicInView` re-created its `IntersectionObserver` **on every render**
  (effect keyed on an unstable `options` object), and a dead `Proxy` branch
  created observers that were never disconnected.
- `useLoop`'s mount-only effect captured a **stale `onRender`**, so prop changes
  after mount were ignored.
All of this lives under `src/hooks/animation/` and `src/components/animation/springs/`
— `#do-not-modify` (ADR-0002).

**Decision.** With explicit user sign-off, apply a one-time performance refactor
to the protected engine, and introduce a shared, unprotected loop primitive:
- New `src/lib/animation/ticker.ts` — a single app-wide, reference-counted rAF
  loop (`subscribeToTicker`). It starts on the first subscriber, stops on the
  last, and throttles each subscriber independently. **Not** `#do-not-modify` —
  it is the supported extension point.
- `useLoop` now subscribes to the ticker and reads `onRender` / `framerate`
  through refs (fixes the stale-closure bug). Public signature unchanged.
- `useDynamicInView` rewritten without the `Proxy`: one observer, re-created only
  when the observed element or options actually change; exposes a callback ref.
- `use-window-size.ts` (not protected) now serves all three hooks from one
  debounced `resize` listener via `useSyncExternalStore`. The unused
  `debounceDelay` parameter was dropped.
- `mode="forward"` `scroll` listeners in `<Spring>` / `<Inview>` made `passive`.
- Hard rule #2 amended: the engine stays protected by default; changes require
  explicit sign-off.

**Consequences.** A page with N animated components now runs **one** rAF loop and
**one** resize listener instead of N of each, with no observer churn. Public
hook/component APIs are unchanged except `useWindowWidth`/`Height`/`Size`, which
no longer take a `debounceDelay` argument (no caller passed one). This **amends
ADR-0002's** do-not-modify scope.

A follow-up pass then cleared all 13 pre-existing ESLint problems in the engine
(also authorized): `isMobileDisabled` gained an optional `viewportWidth`
argument, missing `disableOnMobile` effect deps were added, a
`trigger.current`-in-cleanup hazard in `<Hover>` was fixed, `<Handle>`'s
transition effects were ref-stabilised, and `useProgressTrigger` now returns
`progress` as a `RefObject<number>` (no consumer affected).

---

## ADR-0008 — Adaptive scaling grid via root font-size

- **Status:** Accepted
- **Date:** 2026-05-21

**Context.** An adaptive scaling system was dropped into `src/components/common/`
to keep a rem-based design proportional across viewports. It shipped as a
`styled-components` implementation (`createGlobalStyle`, a `css` `media` helper,
`rm`/`em` helpers, plus `colors.ts` / `fonts.ts` / `utils.ts`). `styled-components`
is not a project dependency, and global CSS belongs in `globals.css` per ADR-0004.

**Decision.** Keep only the scaling behaviour; rebuild it to the project stack.
- **Scale down** (viewport ≤ largest breakpoint) — `vw`-based `html { font-size }`
  media queries in `globals.css`, inside `@layer base`.
- **Scale up** (viewport > largest breakpoint) — a `<AdaptiveGrid>` client
  component (`useAdaptiveGrid` hook) sets an inline `html` font-size at runtime,
  reusing the existing `useResizeLoop` render loop.
- Breakpoints live in `grid.config.ts` as typed config; the `globals.css` media
  queries mirror them and must be kept in sync (formula in both files).
- The dropped `styled-components` files were deleted, not committed.

**Consequences.** A rem-based layout now scales as one unit on every viewport.
`styled-components` stays out of the dependency tree. The breakpoint set is
duplicated across `grid.config.ts` and `globals.css` by design — the CSS-only
config rule (ADR-0004) forbids generating the media queries from JS.

---

## ADR-0007 — Automate the vault workflow with Claude Code hooks

- **Status:** Accepted
- **Date:** 2026-05-21

**Context.** The "read the vault first, follow the relevant guide, update the docs
after every change" workflow depended on the user reminding the agent each time.
Documentation drifts the moment it relies on memory.

**Decision.** Encode the workflow as Claude Code hooks in `.claude/settings.json`
(committed, team-wide):
- `SessionStart` — injects a pointer to read the vault first.
- `UserPromptSubmit` — on every request, reminds the agent to consult the relevant
  guide and to update docs for any change made.
- `Stop` — at the end of every turn, blocks **once** to confirm the vault was
  updated. A `${TMPDIR}` marker keyed by session id guarantees it blocks at most
  once per turn (no infinite loop).

**Consequences.** The documentation workflow is enforced without user prompting.
`.claude/settings.json` is now a tracked project file. Hooks are reviewable and
disableable via `/hooks`. New hooks take effect on the next session start (or after
opening `/hooks`). See [[ai-agent-guide]].

---

## ADR-0006 — The vault is the single source of truth

- **Status:** Accepted
- **Date:** 2026-05-21

**Context.** ADR-0001 left dense spec files (`project-specs.md`, `text-engine-docs.md`)
at the repo root alongside the vault, creating duplication — the same conventions
existed both as terse specs and as expanded vault notes, which would drift.

**Decision.** The vault is the **only** documentation source.
- `project-specs.md` — deleted; its content was already decomposed into the
  `architecture/` and `frontend/` notes (and `environment-variables.md`).
- `text-engine-docs.md` — moved into the vault as [[text-engine-reference]].
- `generic-layout-prompt.md` — moved into the vault (see ADR via [[changelog]]).
- Root keeps only thin shims: `AGENTS.md` carries the breaking-change warning and
  hard rules and points into the vault; `CLAUDE.md` and `.cursorrules` both
  `@`-import `AGENTS.md`.

**Consequences.** No documentation duplication. Agents bootstrap from `AGENTS.md`
and read vault notes on demand. This **amends ADR-0001** — root files no longer
hold canonical spec content.

---

## ADR-0005 — Use standard `next/link` for navigation

- **Status:** Accepted
- **Date:** 2026-05-21

**Context.** Two conflicting conventions existed: `project-specs.md` specified
standard `next/link` / `useRouter`, while `generic-layout-prompt.md` specified
custom `<AnimLink>` / `useAnimRouter()` wrappers. The custom wrappers were never
built.

**Decision.** Use standard Next.js navigation — `<Link>` from `next/link` and
`useRouter` from `next/navigation`. The `AnimLink` / `useAnimRouter` convention is
dropped. See [[routing]].

**Consequences.** `generic-layout-prompt.md` §5 updated to match. No animated-route-
transition layer exists; if one is needed later, revisit with a new ADR.

---

## ADR-0001 — Adopt an Obsidian vault as the project brain

- **Status:** Accepted — amended by ADR-0006
- **Date:** 2026-05-21

**Context.** Project knowledge was scattered across root markdown files
(`project-specs.md`, `text-engine-docs.md`, `AGENTS.md`). New contributors and AI
agents had no structured map of the system.

**Decision.** Introduce `obsidian/` as an Obsidian vault — a linked, navigable
second brain. Root spec files remain as machine-read sources; the vault expands on
them. See [[ai-agent-guide]].

**Consequences.** Docs must now be maintained alongside code. The vault is the
canonical place to *understand* the project; root files stay canonical for *tooling*.

---

## ADR-0002 — All motion is spring-based (`@react-spring/web`)

- **Status:** Accepted (inherited from starter) — amended by ADR-0014
- **Date:** Project baseline

**Context.** Marketing sites need rich, interruptible, physically natural motion.
CSS transitions and keyframes are rigid; competing libraries add weight.

**Decision.** Use `@react-spring/web` for every animation. A custom component layer
(`src/components/animation/springs/`) wraps it. CSS keyframes and `framer-motion`
are **banned**. CSS transitions were banned outright here; **ADR-0014 narrows that
to allow `transition-*` for trivial hover/focus state changes only.**

**Consequences.** All animation goes through the [[animation-system]]. The springs
folder is `#do-not-modify`. Text animation is delegated to [[text-engine]].

---

## ADR-0003 — Routes delegate to Views

- **Status:** Accepted (inherited from starter)
- **Date:** Project baseline

**Context.** Mixing routing concerns with page UI makes `app/` files heavy and hard
to test.

**Decision.** `app/**/page.tsx` files only import and render a component from
`src/views/`. All layout/UI logic lives in the view. See [[routing]].

**Consequences.** Every route is a 3-line file. Views are the real page components.

---

## ADR-0004 — Tailwind v4 with CSS-based config

- **Status:** Accepted (inherited from starter) — amended by ADR-0012 and ADR-0015
- **Date:** Project baseline

**Context.** Tailwind v4 removes `tailwind.config.js` in favour of CSS-native config.

**Decision.** All theme tokens live in `globals.css` under `:root` and `@theme inline`.
No JS config file. Raw values in class names are banned. See [[design-system]].

**Consequences.** Design tokens are the only styling currency. New values must be
added to `globals.css` first — and, per ADR-0015, must follow the three-tier
naming convention.
