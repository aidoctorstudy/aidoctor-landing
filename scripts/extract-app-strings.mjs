#!/usr/bin/env node
/**
 * One-off extraction pass for the `public/app/` study app's i18n rewrite.
 *
 * `public/app/index.html` is a ~1900-line static HTML shell for a large
 * vanilla-JS SPA — hand-enumerating every visible string risked missing
 * fragments or mis-copying whitespace, so this pulls them out
 * programmatically instead: strips <script>/<style> blocks, then collects
 * (a) text between tags and (b) placeholder/title/aria-label attribute
 * values, filtering out pure symbols/whitespace/numbers and de-duplicating.
 *
 * Output is fed into `translate-app-content.mjs`, which translates each
 * unique string once (via LibreTranslate batching) and writes
 * `public/app/i18n/translations.js`. Not run automatically — a dev-only
 * tool, same category as `translate-content.mjs`.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const html = readFileSync(join(ROOT, "public/app/index.html"), "utf-8");

const withoutScripts = html.replace(/<script[\s\S]*?<\/script>/gi, "");

const decode = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#10;/g, "\n")
    .trim();

const isTranslatable = (s) => {
  if (!s) return false;
  if (!/[a-zA-Z]{2,}/.test(s)) return false; // needs real letters, not just symbols/numbers
  if (/^[\d\s.,/%$€£+*:#()✓✕→←↑↓⏱⏸▶⏮⏭●∞-]+$/.test(s)) return false; // pure symbols/numbers
  if (s.startsWith("http") || s.includes("://")) return false;
  if (s.includes("{") || s.includes("var(--")) return false;
  // A stray apostrophe (e.g. inside a contraction in an adjacent string)
  // can throw off the quote-delimited `lbl:'...'`-style regex enough that
  // it captures "name : 'File" instead of "File" — reject anything that
  // still has a bare `identifier :` prefix, a sign the match went wrong.
  if (/^\s*\w+\s*:\s*['"]?/.test(s)) return false;
  // Excludes CSS-class/id-looking tokens ("btn-primary") but not ordinary
  // short lowercase words picked up as standalone text nodes ("or") — a
  // live run found the hyphen-free version of this filter had wrongly
  // dropped the "or" divider between the Google button and the manual
  // signup form.
  if (/^[a-z0-9]+-[a-z0-9-]*$/.test(s)) return false;
  return true;
};

const strings = new Set();

// Text between tags.
for (const m of withoutScripts.matchAll(/>([^<>]+)</g)) {
  const text = decode(m[1]);
  if (isTranslatable(text)) strings.add(text);
}

// Translatable attributes.
for (const m of withoutScripts.matchAll(/\b(?:placeholder|title|aria-label)="([^"]+)"/g)) {
  const text = decode(m[1]);
  if (isTranslatable(text)) strings.add(text);
}

// ---------------------------------------------------------------------------
// JS files: only pull strings from calls that are unambiguously user-facing
// (toast/alert/confirm) or simple literal assignments — not the AI-prompt
// text these files also build (those go to the backend, not the screen, and
// must stay in the source language for the model).
// ---------------------------------------------------------------------------
const JS_FILES = [
  "01-core-utils.js",
  "02-file-media.js",
  "03-lecture.js",
  "04-library-tools.js",
  "05-exam-prep.js",
  "06-quiz-clinical.js",
  "07-mock-dashboard.js",
  "08-medical-tools.js",
  "09-srs-decks.js",
  "10-ui-system.js",
  "11-nibble-growth.js",
  "12-animations.js",
  "auth.js",
];

/**
 * A dictionary keyed by exact source text can't translate a string built by
 * concatenation (`'Q ' + num + '/' + total`) — the DOM only ever sees the
 * final joined text, which never matches a fragment key. Filtering those
 * out here (rather than translating them uselessly) is what "extract UI
 * strings" means for a codebase with no template-interpolation convention:
 * skip fragments that look like they're missing their other half.
 */
const looksLikeFragment = (s) =>
  /[:/(•]\s*$/.test(s) || /^[A-Z][a-z]*\.?\s+$/.test(s) || /\s$/.test(s);

const jsCallPatterns = [
  /\b(?:showToast|confirm|alert)\(\s*['"]([^'"]{3,200})['"]/g,
  /\.textContent\s*=\s*['"]([^'"]{3,200})['"]/g,
  // Data-driven UI (command palette entries, quick-action tiles, generated
  // review/library cards) build their labels from object-literal
  // properties rather than a function call — e.g.
  // `{panel:'examprep', lbl:'Exam Prep'}` in 07-mock-dashboard.js. Found
  // live: several dashboard quick-action buttons stayed English because
  // this pattern wasn't covered by the call-based patterns above.
  /\b(?:lbl|label|name|title|sub|text)\s*:\s*['"]([^'"]{2,120})['"]/g,
];

for (const file of JS_FILES) {
  let src;
  try {
    src = readFileSync(join(ROOT, "public/app", file), "utf-8");
  } catch {
    continue;
  }
  for (const pattern of jsCallPatterns) {
    for (const m of src.matchAll(pattern)) {
      const text = decode(m[1]);
      if (isTranslatable(text) && !looksLikeFragment(text)) strings.add(text);
    }
  }
}

/**
 * Strings the regex patterns above genuinely can't reach: ternary-embedded
 * literals (`hour < 12 ? 'Good morning' : ...`, no function call or object
 * key to anchor on) and HTML fragments built by string concatenation
 * (`'<div>'+'Sessions Done'+'</div>'` — the `>text<` shape only exists
 * once the pieces are joined at runtime, not in the source text a regex
 * scans). Reported live as still-English on `/ar/app`; verified each
 * against its exact source line (public/app/10-ui-system.js,
 * 11-nibble-growth.js, 04-library-tools.js) rather than guessing, since the
 * dictionary lookup is exact-text-match and punctuation/whitespace has to
 * match the real DOM text precisely.
 */
const MANUAL_STRINGS = [
  "Good morning!",
  "Good afternoon!",
  "Good evening!",
  "Good morning",
  "Good afternoon",
  "Good evening",
  "Sessions Done",
  "Total Focus",
  "Today Focus",
  "Recent Sessions",
  "No sessions yet",
  "No sessions yet — use Lock-In Mode!",
  "Share My Stats",
  "No mistakes yet — keep going!",
  "Making your 8 nibble cards...",
  // showAchievement()'s two args (auth.js) — same "no call-pattern to
  // anchor a regex on" gap as the rest of this list.
  "Pro Activated!",
];
for (const s of MANUAL_STRINGS) strings.add(s);

const sorted = [...strings].sort((a, b) => a.localeCompare(b));
writeFileSync(
  join(ROOT, "scripts/tmp-app-strings.json"),
  JSON.stringify(sorted, null, 2) + "\n",
  "utf-8",
);
console.log(`Extracted ${sorted.length} unique candidate strings.`);
