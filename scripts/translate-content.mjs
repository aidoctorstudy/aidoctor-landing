#!/usr/bin/env node
/**
 * Build-time translation pipeline (decisions-log ADR-0032, superseding
 * ADR-0030's Anthropic-based version).
 *
 * Translates the site's English content into the other 8 locales via
 * LibreTranslate, and writes the result as committed JSON files under
 * `src/data/i18n/<locale>/`. Those files are read at
 * request time by `src/lib/i18n/content.ts` (`getHomeContent`/
 * `getSiteChrome`/`getLegalContent`) — this script is a one-time (or
 * re-run-when-copy-changes) dev tool, **not** part of `next build`. Rerun
 * it after editing English copy in `data/mocks/home.ts` /
 * `data/mocks/legal.ts`, then commit the updated JSON.
 *
 * Plain Node, `fetch` only — no new npm dependency, matching this
 * project's minimal-deps philosophy (see tech-stack.md). It cannot
 * `import` the TS content modules directly (no `@/` path-alias resolution
 * outside Next's own pipeline), so it instead fetches the English bundle
 * as JSON from a small internal dev-tool endpoint, `GET /api/i18n-content`
 * — meaning:
 *
 *   **The Next dev server must be running** (`npm run dev`) before this
 *   script is run.
 *
 * ## Why field-level translators, not "translate the whole JSON blob"
 *
 * The Anthropic version (ADR-0030) sent each content bundle as one JSON
 * payload with a system prompt asking the model to preserve structure and
 * skip URLs/hrefs/codes. That worked because an instruction-following LLM
 * can honour "don't touch this key" and "return valid JSON matching this
 * shape." LibreTranslate is a plain text-to-text MT engine — it has no
 * concept of JSON structure or field semantics, so that whole approach
 * doesn't carry over.
 *
 * Instead, this version has one small translator function per content
 * shape (`translateHero`, `translatePlan`, `translateBlock`, …) that
 * explicitly rebuilds each object field by field: natural-language string
 * fields go through `t()` (translate), everything structural — `href`,
 * `url`, enum discriminators (`variant`, `tone`, `type`, `role`), anchor
 * `id`s, prices, `period`, proper names, emoji, booleans — is copied
 * through unchanged. This is more code than a generic deep-walk-and-guess
 * translator, but it's the only way to be **certain** a cookie-table
 * anchor id or an `href` never gets mangled by an MT engine that has no
 * idea what JSON even is.
 *
 * ## Protected substrings
 *
 * Even within a translatable string, a few literal phrases must survive
 * unchanged — the discount code `MED20`, the brand name "AI Doctor Study",
 * the bare domain "aidoctor.study" (appears in body copy without a link,
 * e.g. "Try it yourself at aidoctor.study/app"). `protect()`/`restore()`
 * swap each occurrence for a placeholder token before the call and put the
 * literal phrase back after — best-effort, since an NMT model can still
 * occasionally reorder or lightly alter an inserted token (more of a risk
 * in RTL/CJK output). Spot-check the Arabic/Urdu/Chinese output for this
 * after a run.
 *
 * ## Which public instance, and why
 *
 * The official https://libretranslate.com now gates its `/translate`
 * endpoint behind a free-tier API key (verified live while building this
 * script — `/languages` is open, `/translate` returns *"Visit
 * https://portal.libretranslate.com to get an API key"*). The default
 * here is instead **https://translate.disroot.org** — a community-run
 * public instance, verified live (including Arabic/Urdu/Hindi/Chinese
 * targets and the placeholder-token protection mechanism below) to accept
 * genuinely anonymous `/translate` calls, no key. Free public instances
 * come and go — if this one stops working, either get a free key from
 * portal.libretranslate.com and set `LIBRETRANSLATE_API_KEY` (works
 * against the official instance too — pass `LIBRETRANSLATE_URL=
 * https://libretranslate.com/translate` alongside it), or self-host via
 * LibreTranslate's Docker image and point `LIBRETRANSLATE_URL` at it.
 *
 * ## Politeness toward the free public endpoint
 *
 * Every LibreTranslate call runs **strictly sequentially** (no
 * `Promise.all` fan-out) with a delay after each one
 * (`TRANSLATE_DELAY_MS`, default 300 ms), plus retry-with-backoff on
 * 429/5xx — a shared community instance has no meaningful throughput
 * guarantee for anonymous callers. A full 8-locale run is slow by design
 * (easily 15–40+ minutes) — use `--locales=` to translate a subset.
 *
 * Before translating anything, the script asks the LibreTranslate instance
 * which target languages it actually supports (`GET /languages`) and skips
 * any requested locale that isn't in that list, rather than firing
 * hundreds of requests that would all fail the same way.
 *
 * Usage:
 *   node scripts/translate-content.mjs
 *   node scripts/translate-content.mjs --locales=ar,es   # subset
 *   node scripts/translate-content.mjs --dry-run          # translate, don't write
 *
 *   LIBRETRANSLATE_URL=https://your-self-host/translate node scripts/translate-content.mjs
 *   LIBRETRANSLATE_API_KEY=... node scripts/translate-content.mjs
 *
 * `LIBRETRANSLATE_API_KEY` (optional) may also be set in `.env.local`
 * (git-ignored) — this script reads that file itself since it runs
 * outside Next's own env loading. See `.env.example` and
 * environment-variables.md.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const ALL_LOCALES = ["ar", "ur", "es", "fr", "hi", "pt", "de", "zh"];
const DEV_SERVER_URL = process.env.DEV_SERVER_URL ?? "http://localhost:3000";
const LEGAL_PAGES = ["terms", "refunds", "cookies", "privacy"];

const LIBRETRANSLATE_URL =
  process.env.LIBRETRANSLATE_URL ?? "https://translate.disroot.org/translate";
/** Derived from `LIBRETRANSLATE_URL` — `GET {base}/languages` lists supported codes. */
const LANGUAGES_URL = `${LIBRETRANSLATE_URL.replace(/\/translate\/?$/, "")}/languages`;

/**
 * Our own locale codes (`lib/i18n/locales.ts`) match LibreTranslate's
 * target codes for every locale except Chinese: LibreTranslate has no bare
 * `zh` — only `zh-Hans` (Simplified) and `zh-Hant` (Traditional). Verified
 * live against both https://libretranslate.com/languages and
 * https://translate.disroot.org/languages (same underlying software, same
 * language set). Everything else in this script (the output directory,
 * `--locales=`, the supported-languages skip message) still uses our own
 * `zh`; only the actual API request's `target` field goes through this
 * mapping.
 */
const LOCALE_TO_LIBRETRANSLATE_TARGET = { zh: "zh-Hans" };
const toLibreTarget = (locale) => LOCALE_TO_LIBRETRANSLATE_TARGET[locale] ?? locale;

/** Pause after every request — the free public instance has no generous rate limit. */
const REQUEST_DELAY_MS = Number(process.env.TRANSLATE_DELAY_MS ?? 300);
const MAX_RETRIES = 4;

/**
 * Literal phrases that must never be translated even mid-sentence, checked
 * longest-first so e.g. the full email isn't left partially replaced by the
 * bare-domain rule. `protect()` swaps each for a placeholder before the
 * LibreTranslate call; `restore()` swaps it back after.
 */
const PROTECTED_PHRASES = [
  "support@aidoctor.study",
  "aidoctor.study/app",
  "aidoctor.study",
  "AI Doctor Study",
  "MED20",
];

function parseArgs() {
  const args = process.argv.slice(2);
  const localesArg = args.find((a) => a.startsWith("--locales="));
  const locales = localesArg
    ? localesArg.slice("--locales=".length).split(",").map((s) => s.trim())
    : ALL_LOCALES;
  const dryRun = args.includes("--dry-run");
  return { locales, dryRun };
}

/** This script runs outside Next's env loading, so it reads `.env.local` itself. */
function readDotEnvLocal() {
  const path = join(ROOT, ".env.local");
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return out;
}

const LIBRETRANSLATE_API_KEY =
  process.env.LIBRETRANSLATE_API_KEY ?? readDotEnvLocal().LIBRETRANSLATE_API_KEY;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchEnglishContent() {
  const res = await fetch(`${DEV_SERVER_URL}/api/i18n-content`);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch English content from ${DEV_SERVER_URL}/api/i18n-content (${res.status}). Is \`npm run dev\` running?`,
    );
  }
  const { data } = await res.json();
  return data;
}

/** Best-effort — a failure here just skips the supported-languages filter, not the whole run. */
async function fetchSupportedLanguages() {
  try {
    const res = await fetch(LANGUAGES_URL);
    if (!res.ok) return null;
    const list = await res.json();
    return new Set(list.map((entry) => entry.code));
  } catch {
    return null;
  }
}

async function writeLocaleFile(locale, filename, data, dryRun) {
  const dir = join(ROOT, "src", "data", "i18n", locale);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const path = join(dir, filename);
  if (dryRun) {
    console.log(`[dry-run] would write ${path}`);
    return;
  }
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
  console.log(`  wrote ${path}`);
}

// ---------------------------------------------------------------------------
// LibreTranslate call, with protected-substring splitting and retry/backoff.
// ---------------------------------------------------------------------------

/**
 * A first version of this script protected substrings with an injected
 * placeholder token (`XPROTECTEDX0X`) sent through the MT engine and swapped
 * back afterwards. A live run against `translate.disroot.org` shipped a
 * corrupted `ar/legal-terms.json`: Arabic translation mangled the token
 * badly enough (dropped characters, inserted RTL text around it) that the
 * exact-string swap-back silently failed. Retrying with a letters-only
 * token (no digits) still failed the same way on a different string — the
 * MT engine simply doesn't guarantee verbatim passthrough of *any* synthetic
 * token, especially into a different script.
 *
 * So protected phrases are never sent to the MT engine at all: the string is
 * split around each protected span, only the surrounding fragments are
 * translated, and the protected text is spliced back in untouched. This
 * trades a little grammatical smoothness immediately around a brand name /
 * URL / coupon code for a hard guarantee that the code/link content itself
 * can never come back corrupted.
 */
function findProtectedSpans(text) {
  const spans = [];
  for (const phrase of PROTECTED_PHRASES) {
    let from = 0;
    for (;;) {
      const idx = text.indexOf(phrase, from);
      if (idx === -1) break;
      spans.push({ start: idx, end: idx + phrase.length });
      from = idx + phrase.length;
    }
  }
  // Defense in depth, in case a URL/email ever appears somewhere not
  // already covered by PROTECTED_PHRASES or by a structural `href` field.
  // The numeric pattern is a real-bug fix, not defense in depth: a live run
  // came back with "300" as "٠٠٣" and "90" as "٠٩" — translate.disroot.org's
  // Arabic output silently reverses multi-digit numbers when it renders
  // them (a live-observed corruption, not a rendering artifact — the
  // reversed digits are in the stored JSON text itself). Numbers don't need
  // linguistic translation and Arabic medical/technical writing commonly
  // keeps Western digits anyway, so protecting any digit run (with internal
  // `,`/`.`/`:`/`/`/`%`, e.g. "50,000", "24/7", "30%") sidesteps the bug
  // entirely instead of trying to detect and un-reverse it after the fact.
  // Comparison-operator readings ("<30", "≤ 60") and parenthesized figures
  // ("(0)") — ported from translate-app-content.mjs (ADR-0033) after the
  // same class of bug showed up here too: "eGFR <30 mL/min" came back as
  // "eGFR MIS30 mL/min" because "<" was sent to the MT engine unprotected.
  for (const re of [
    /https?:\/\/\S+/g,
    /[\w.+-]+@[\w-]+\.[\w.-]+/g,
    /\([+-]?\d+\)/g,
    /[<>≤≥]\s*\d+(?:\.\d+)?/g,
    /\$\d[\d,.]*/g,
    /\d+%/g,
    /\d[\d.,:/%\s]*\d|\d+/g,
  ]) {
    let match;
    while ((match = re.exec(text))) {
      spans.push({ start: match.index, end: match.index + match[0].length });
    }
  }

  spans.sort((a, b) => a.start - b.start || b.end - a.end);
  const nonOverlapping = [];
  let lastEnd = -1;
  for (const span of spans) {
    if (span.start >= lastEnd) {
      nonOverlapping.push(span);
      lastEnd = span.end;
    }
  }
  return nonOverlapping;
}

async function callLibreTranslate(text, target, attempt = 1) {
  const body = { q: text, source: "en", target, format: "text" };
  if (LIBRETRANSLATE_API_KEY) body.api_key = LIBRETRANSLATE_API_KEY;

  const res = await fetch(LIBRETRANSLATE_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.status === 429 || res.status >= 500) {
    if (attempt > MAX_RETRIES) {
      throw new Error(`LibreTranslate ${res.status} after ${MAX_RETRIES} retries`);
    }
    const backoff = 2 ** attempt * 1000;
    console.warn(
      `    [${res.status}] retrying in ${backoff}ms (attempt ${attempt}/${MAX_RETRIES})`,
    );
    await sleep(backoff);
    return callLibreTranslate(text, target, attempt + 1);
  }

  if (!res.ok) {
    const body2 = await res.text().catch(() => "");
    throw new Error(`LibreTranslate ${res.status}: ${body2.slice(0, 300)}`);
  }

  const json = await res.json();
  if (typeof json.translatedText !== "string") {
    throw new Error(`Unexpected LibreTranslate response: ${JSON.stringify(json).slice(0, 300)}`);
  }
  return json.translatedText;
}

/**
 * `translate.disroot.org` has been caught, live, silently echoing English
 * text back unchanged with a 200 and no error — not just for whole strings,
 * but for one sentence out of a multi-sentence input it otherwise
 * translated correctly (a Live Demo AI message came back half-Arabic,
 * half-verbatim-English). A short retry loop catches the transient version
 * of this; anything still unchanged after retrying ships as-is (better than
 * an infinite loop against a free shared instance).
 */
function looksUntranslated(source, translated) {
  return (
    source.trim().toLowerCase() === translated.trim().toLowerCase() &&
    /[a-z]{3,}/i.test(source)
  );
}

const UNTRANSLATED_RETRIES = 2;

/**
 * Collapses duplicate terminal punctuation LibreTranslate has been seen to
 * produce when it translates a Latin `?`/`!` to its Arabic counterpart
 * *and* leaves the original — e.g. "What are the contraindications?" came
 * back as "...المخالفات؟?" (Arabic `؟` immediately followed by an ASCII `?`).
 */
function cleanupPunctuation(text) {
  return text.replace(/([?!])\s*([؟])/g, "$2").replace(/([؟])\s*([?!])/g, "$1");
}

/**
 * Translate one string, cached per locale run (many labels repeat — "Login",
 * "Sign Up for Free", CTA labels shared across sections — so this cuts real
 * request volume against a rate-limited free endpoint). `cache` is a plain
 * `Map` created fresh per locale by the caller.
 */
async function translateRaw(text, target, attempt = 1) {
  const translated = cleanupPunctuation(await callLibreTranslate(text, target));
  await sleep(REQUEST_DELAY_MS);
  if (looksUntranslated(text, translated) && attempt <= UNTRANSLATED_RETRIES) {
    return translateRaw(text, target, attempt + 1);
  }
  return translated;
}

/**
 * Splits on sentence-ending punctuation + whitespace, keeping the
 * punctuation with its sentence. A live run caught `translate.disroot.org`
 * translating only the *first* sentence of a multi-sentence Live Demo
 * message and silently echoing the rest back in English, with a 200 and no
 * error — one sentence per request sidesteps that failure mode instead of
 * trying to detect it after the fact.
 */
function splitSentences(text) {
  return text.split(/(?<=[.!?])\s+(?=\S)/);
}

async function translateSegment(text, target) {
  const sentences = splitSentences(text);
  if (sentences.length <= 1) return translateRaw(text, target);

  const translated = [];
  for (const sentence of sentences) {
    translated.push(await translateRaw(sentence, target));
  }
  return translated.join(" ");
}

/**
 * Translates `segment`'s trimmed core and reattaches its original
 * leading/trailing whitespace verbatim. LibreTranslate's response strips
 * surrounding whitespace, so a segment translated right up against a
 * spliced-in protected phrase (see `findProtectedSpans`) came back glued to
 * it with no space at all — caught live in `aidoctor.study/app` output
 * (`"...بنفسكaidoctor.study/app"`, no space before the domain).
 */
async function translateWithSpacing(segment, target) {
  const leading = segment.match(/^\s*/)[0];
  const trailing = segment.match(/\s*$/)[0];
  const core = segment.slice(leading.length, segment.length - trailing.length);
  if (!core) return segment;
  return leading + (await translateSegment(core, target)) + trailing;
}

async function t(text, target, cache) {
  if (!text) return text;
  if (cache.has(text)) return cache.get(text);

  const spans = findProtectedSpans(text);
  let result;
  if (spans.length === 0) {
    result = await translateWithSpacing(text, target);
  } else {
    const parts = [];
    let cursor = 0;
    for (const span of spans) {
      if (span.start > cursor) {
        parts.push(await translateWithSpacing(text.slice(cursor, span.start), target));
      }
      parts.push(text.slice(span.start, span.end));
      cursor = span.end;
    }
    if (cursor < text.length) {
      parts.push(await translateWithSpacing(text.slice(cursor), target));
    }
    result = parts.join("");
  }

  cache.set(text, result);
  return result;
}

/** Sequential map — one LibreTranslate request in flight at a time, globally. */
async function mapSeries(items, fn) {
  const results = [];
  for (const item of items) {
    results.push(await fn(item));
  }
  return results;
}

// ---------------------------------------------------------------------------
// Field-level translators — one per content shape in data/mocks/home.ts and
// data/mocks/legal.ts. Every field not explicitly translated below is copied
// through unchanged on purpose (hrefs, urls, ids, enum discriminators,
// prices, emoji, proper names, booleans) — see the file header for why this
// can't be a generic deep-walk translator.
// ---------------------------------------------------------------------------

const translateCta = async (cta, target, cache) => ({
  label: await t(cta.label, target, cache),
  href: cta.href,
});

const translateCtaList = (list, target, cache) =>
  mapSeries(list, (cta) => translateCta(cta, target, cache));

/** `NavLink` and `FooterLink` share this exact shape. */
const translateLink = async (link, target, cache) => ({
  label: await t(link.label, target, cache),
  href: link.href,
});

const translateHero = async (hero, target, cache) => ({
  eyebrow: await t(hero.eyebrow, target, cache),
  title: await t(hero.title, target, cache),
  description: await t(hero.description, target, cache),
  actions: await translateCtaList(hero.actions, target, cache),
  trustLine: await t(hero.trustLine, target, cache),
  serviceChips: await mapSeries(hero.serviceChips, (chip) => t(chip, target, cache)),
});

const translateWhy = async (why, target, cache) => ({
  eyebrow: await t(why.eyebrow, target, cache),
  title: await t(why.title, target, cache),
  description: await t(why.description, target, cache),
  actions: await translateCtaList(why.actions, target, cache),
  // Asset paths — never translate.
  trailImages: why.trailImages,
  mockup: {
    // Display domain text, not a real link — left as-is like the paths above.
    url: why.mockup.url,
    question: await t(why.mockup.question, target, cache),
    answer: await t(why.mockup.answer, target, cache),
  },
});

const translateSectionIntro = async (intro, target, cache) => ({
  eyebrow: await t(intro.eyebrow, target, cache),
  title: await t(intro.title, target, cache),
  description: await t(intro.description, target, cache),
});

const translateServiceCard = async (card, target, cache) => ({
  index: card.index,
  title: await t(card.title, target, cache),
  ...(card.items
    ? { items: await mapSeries(card.items, (item) => t(item, target, cache)) }
    : {}),
  ...(card.emoji ? { emoji: card.emoji } : {}),
  ...(card.cta ? { cta: await t(card.cta, target, cache) } : {}),
  variant: card.variant,
});

const translateDemoMessage = async (message, target, cache) => ({
  role: message.role,
  text: await t(message.text, target, cache),
});

const translateLiveDemo = async (liveDemo, target, cache) => ({
  eyebrow: await t(liveDemo.eyebrow, target, cache),
  title: await t(liveDemo.title, target, cache),
  description: await t(liveDemo.description, target, cache),
  messages: await mapSeries(liveDemo.messages, (message) =>
    translateDemoMessage(message, target, cache),
  ),
  ctaLabel: await t(liveDemo.ctaLabel, target, cache),
  ctaHref: liveDemo.ctaHref,
});

const translateStat = async (stat, target, cache) => ({
  value: stat.value,
  label: await t(stat.label, target, cache),
});

const translateFragment = async (fragment, target, cache) => ({
  text: await t(fragment.text, target, cache),
  muted: fragment.muted,
});

const translateAbout = async (about, target, cache) => ({
  eyebrow: await t(about.eyebrow, target, cache),
  stats: await mapSeries(about.stats, (stat) => translateStat(stat, target, cache)),
  paragraph: await mapSeries(about.paragraph, (fragment) =>
    translateFragment(fragment, target, cache),
  ),
  actions: await translateCtaList(about.actions, target, cache),
});

const translateSocial = async (social, target, cache) => ({
  label: await t(social.label, target, cache),
  href: social.href,
  icon: social.icon,
});

const translateMember = async (member, target, cache) => ({
  name: member.name,
  role: await t(member.role, target, cache),
  quote: await t(member.quote, target, cache),
  initials: member.initials,
});

const translateTeam = async (team, target, cache) => ({
  eyebrow: await t(team.eyebrow, target, cache),
  title: await t(team.title, target, cache),
  socials: await mapSeries(team.socials, (social) => translateSocial(social, target, cache)),
  members: await mapSeries(team.members, (member) => translateMember(member, target, cache)),
  more: {
    title: await t(team.more.title, target, cache),
    cta: await t(team.more.cta, target, cache),
    href: team.more.href,
  },
});

const translatePlan = async (plan, target, cache) => ({
  name: await t(plan.name, target, cache),
  price: plan.price,
  period: plan.period,
  description: await t(plan.description, target, cache),
  features: await mapSeries(plan.features, (feature) => t(feature, target, cache)),
  cta: await translateCta(plan.cta, target, cache),
  ...(plan.badge ? { badge: await t(plan.badge, target, cache) } : {}),
  ...(plan.highlighted !== undefined ? { highlighted: plan.highlighted } : {}),
  ...(plan.note ? { note: await t(plan.note, target, cache) } : {}),
});

const translatePricing = async (pricing, target, cache) => ({
  eyebrow: await t(pricing.eyebrow, target, cache),
  title: await t(pricing.title, target, cache),
  description: await t(pricing.description, target, cache),
  plans: await mapSeries(pricing.plans, (plan) => translatePlan(plan, target, cache)),
  // "MED20" inside this sentence survives via protect()/restore() in t().
  discountNote: await t(pricing.discountNote, target, cache),
});

const translateContact = async (contact, target, cache) => ({
  eyebrow: await t(contact.eyebrow, target, cache),
  title: await t(contact.title, target, cache),
  description: await t(contact.description, target, cache),
  actions: await translateCtaList(contact.actions, target, cache),
});

const translateHome = async (home, target, cache) => ({
  hero: await translateHero(home.hero, target, cache),
  why: await translateWhy(home.why, target, cache),
  servicesIntro: await translateSectionIntro(home.servicesIntro, target, cache),
  serviceCards: await mapSeries(home.serviceCards, (card) =>
    translateServiceCard(card, target, cache),
  ),
  liveDemo: await translateLiveDemo(home.liveDemo, target, cache),
  about: await translateAbout(home.about, target, cache),
  team: await translateTeam(home.team, target, cache),
  pricing: await translatePricing(home.pricing, target, cache),
  contact: await translateContact(home.contact, target, cache),
});

const translateChrome = async (chrome, target, cache) => ({
  // Brand name — never translated.
  brandName: chrome.brandName,
  siteNav: await mapSeries(chrome.siteNav, (link) => translateLink(link, target, cache)),
  headerCta: await translateCta(chrome.headerCta, target, cache),
  loginCta: await translateCta(chrome.loginCta, target, cache),
  floatingCta: await translateCta(chrome.floatingCta, target, cache),
  footerLinks: await mapSeries(chrome.footerLinks, (link) => translateLink(link, target, cache)),
});

// --- Legal content -----------------------------------------------------

const translateRun = async (run, target, cache) => ({
  text: await t(run.text, target, cache),
  ...(run.bold !== undefined ? { bold: run.bold } : {}),
  ...(run.href !== undefined ? { href: run.href } : {}),
});

const translateRuns = (runs, target, cache) =>
  mapSeries(runs, (run) => translateRun(run, target, cache));

const translateRunGrid = (grid, target, cache) =>
  mapSeries(grid, (runs) => translateRuns(runs, target, cache));

/**
 * Table cells are a mix of prose ("Keeps you signed in with your Google
 * account…") and bare technical identifiers (`aid_cookie_consent`,
 * `_ga, _ga_*`) that must not be run through MT. A cell that's nothing but
 * comma-separated code-like tokens is left alone; anything with real words
 * and spaces gets translated normally.
 */
const TECHNICAL_CELL = /^[\w.*-]+(,\s*[\w.*-]+)*$/;
const translateTableCell = async (cell, target, cache) =>
  TECHNICAL_CELL.test(cell.trim()) ? cell : t(cell, target, cache);

const translateBlock = async (block, target, cache) => {
  switch (block.type) {
    case "paragraph":
      return { type: "paragraph", runs: await translateRuns(block.runs, target, cache) };
    case "list":
      return {
        type: "list",
        ...(block.ordered !== undefined ? { ordered: block.ordered } : {}),
        items: await translateRunGrid(block.items, target, cache),
      };
    case "callout":
      return {
        type: "callout",
        tone: block.tone,
        label: await t(block.label, target, cache),
        paragraphs: await translateRunGrid(block.paragraphs, target, cache),
      };
    case "table":
      return {
        type: "table",
        headers: await mapSeries(block.headers, (header) => t(header, target, cache)),
        rows: await mapSeries(block.rows, (row) =>
          mapSeries(row, (cell) => translateTableCell(cell, target, cache)),
        ),
      };
    default:
      return block;
  }
};

const translateSection = async (section, target, cache) => ({
  // Anchor slug — must stay stable, in-page links (`#agreement`, `#rights`)
  // and the contents nav depend on it matching the English id exactly.
  id: section.id,
  number: section.number,
  title: await t(section.title, target, cache),
  blocks: await mapSeries(section.blocks, (block) => translateBlock(block, target, cache)),
});

const translateLegalContent = async (content, target, cache) => ({
  eyebrow: await t(content.eyebrow, target, cache),
  title: await t(content.title, target, cache),
  // A plain date string — not translated (no locale-aware date formatting here).
  lastUpdated: content.lastUpdated,
  scope: await t(content.scope, target, cache),
  summary: await translateRunGrid(content.summary, target, cache),
  sections: await mapSeries(content.sections, (section) =>
    translateSection(section, target, cache),
  ),
});

// ---------------------------------------------------------------------------

async function main() {
  const { locales, dryRun } = parseArgs();

  const unknown = locales.filter((l) => !ALL_LOCALES.includes(l));
  if (unknown.length > 0) {
    console.error(`Unknown locale(s): ${unknown.join(", ")}. Valid: ${ALL_LOCALES.join(", ")}`);
    process.exit(1);
  }

  console.log(`Fetching English content from ${DEV_SERVER_URL} ...`);
  const english = await fetchEnglishContent();

  console.log(`Checking supported languages at ${LANGUAGES_URL} ...`);
  const supported = await fetchSupportedLanguages();
  if (!supported) {
    console.warn("  Could not fetch the supported-languages list — proceeding without that check.");
  }

  for (const locale of locales) {
    const target = toLibreTarget(locale);

    if (supported && !supported.has(target)) {
      console.error(
        `\n=== ${locale} === SKIPPED — "${target}" not supported by this LibreTranslate instance (supports: ${[...supported].sort().join(", ")})`,
      );
      continue;
    }

    console.log(`\n=== ${locale} (LibreTranslate target: ${target}) ===`);
    const cache = new Map();

    try {
      console.log("  translating home.json ...");
      const home = await translateHome(english.home, target, cache);
      await writeLocaleFile(locale, "home.json", home, dryRun);
    } catch (error) {
      console.error(`  FAILED home.json: ${error.message}`);
    }

    try {
      console.log("  translating chrome.json ...");
      const chrome = await translateChrome(english.chrome, target, cache);
      await writeLocaleFile(locale, "chrome.json", chrome, dryRun);
    } catch (error) {
      console.error(`  FAILED chrome.json: ${error.message}`);
    }

    for (const page of LEGAL_PAGES) {
      const filename = `legal-${page}.json`;
      try {
        console.log(`  translating ${filename} ...`);
        const translated = await translateLegalContent(english.legal[page], target, cache);
        await writeLocaleFile(locale, filename, translated, dryRun);
      } catch (error) {
        console.error(`  FAILED ${filename}: ${error.message}`);
      }
    }
  }

  console.log("\nDone.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
