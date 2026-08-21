#!/usr/bin/env node
/**
 * Translates `scripts/tmp-app-strings.json` (produced by
 * `extract-app-strings.mjs`) into the study app's other 8 locales and
 * writes `public/app/i18n/translations.js` — a dictionary keyed by the
 * *exact* English source string, one object per locale. The app's runtime
 * (`public/app/i18n/i18n.js`) looks up each visible string by its current
 * English text and swaps in the match for the active locale; anything with
 * no entry (or on the `en` locale) just renders as-is. See i18n.js's header
 * for why a dictionary-by-source-text beats rewriting the app's ~5,000
 * lines of vanilla JS to call a `t('key')` function at every call site.
 *
 * Shares its translation strategy with `translate-content.mjs` (ADR-0032,
 * ADR-0033) — same protected-phrase splicing, sentence-splitting, and
 * untranslated-retry logic, ported here because this run is shaped
 * differently: ~840 independent short strings rather than a handful of
 * content bundles, so it's worth batching many strings into one
 * LibreTranslate request (confirmed live: `q` accepts an array, 150 items
 * in one call worked fine) instead of one request per string — the naive
 * per-string approach would take hours across 8 locales.
 *
 * Usage: node scripts/translate-app-content.mjs [--locales=ar,ur] [--dry-run]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const ALL_LOCALES = ["ar", "ur", "es", "fr", "hi", "pt", "de", "zh"];
const LOCALE_TO_LIBRETRANSLATE_TARGET = { zh: "zh-Hans" };
const toLibreTarget = (locale) => LOCALE_TO_LIBRETRANSLATE_TARGET[locale] ?? locale;

const LIBRETRANSLATE_URL = process.env.LIBRETRANSLATE_URL ?? "https://translate.disroot.org/translate";
const LANGUAGES_URL = LIBRETRANSLATE_URL.replace(/\/translate$/, "/languages");
const BATCH_SIZE = Number(process.env.TRANSLATE_BATCH_SIZE ?? 80);
const REQUEST_DELAY_MS = Number(process.env.TRANSLATE_DELAY_MS ?? 400);
const MAX_RETRIES = 4;
const UNTRANSLATED_RETRIES = 2;

/** Literal strings that must survive verbatim, longest/most-specific first. */
const PROTECTED_PHRASES = [
  "AI Doctor Study",
  "aidoctor.study",
  "Mustafa Shahid Khan",
  "Llama 3.3",
  "Groq",
  "MED20",
  "AI Doctor",
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

// ---------------------------------------------------------------------------
// Protected-span splitting — identical principle to translate-content.mjs.
// ---------------------------------------------------------------------------
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
  for (const re of [
    /https?:\/\/\S+/g,
    /[\w.+-]+@[\w-]+\.[\w.-]+/g,
    // Parenthesized scores ("(0)", "(+2)") and comparison-operator readings
    // ("< 90", "≤ 60", "≥100") — a live batch run caught both classes badly
    // mangled: the bare-number regex below leaves the paren/operator as
    // ordinary text sent to the MT engine, which lost opening parens
    // ("Absent (0)" -> "0)") and, worse, turned "<"/"≤"/"≥" into repeated
    // garbage ("BP systolic < 90" -> "...systolic 90 / / / / / / / 60").
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

const splitSentences = (text) => text.split(/(?<=[.!?])\s+(?=\S)/);

/**
 * Breaks one EN source string into an ordered list of atomic units:
 * `{ type: "protected", value }` copied through verbatim, or
 * `{ type: "sentence", value, leading, trailing }` — a single sentence with
 * its surrounding whitespace captured separately so it can be reattached
 * after translation (LibreTranslate strips it, see ADR-0033).
 */
function toUnits(text) {
  const spans = findProtectedSpans(text);
  const textRanges = [];
  let cursor = 0;
  for (const span of spans) {
    if (span.start > cursor) textRanges.push([cursor, span.start]);
    cursor = span.end;
  }
  if (cursor < text.length) textRanges.push([cursor, text.length]);

  const units = [];
  let ti = 0;
  let si = 0;
  cursor = 0;
  const spanStarts = spans.map((s) => s.start);
  while (cursor < text.length) {
    if (si < spans.length && cursor === spanStarts[si]) {
      units.push({ type: "protected", value: text.slice(spans[si].start, spans[si].end) });
      cursor = spans[si].end;
      si += 1;
      continue;
    }
    const range = textRanges[ti];
    ti += 1;
    const segment = text.slice(range[0], range[1]);
    const leading = segment.match(/^\s*/)[0];
    const trailing = segment.match(/\s*$/)[0];
    const core = segment.slice(leading.length, segment.length - trailing.length);
    if (core) {
      const sentences = splitSentences(core);
      sentences.forEach((sentence, index) => {
        units.push({
          type: "sentence",
          value: sentence,
          leading: index === 0 ? leading : "",
          trailing: index === sentences.length - 1 ? trailing : "",
        });
      });
    } else if (leading || trailing) {
      units.push({ type: "protected", value: leading + trailing });
    }
    cursor = range[1];
  }
  return units;
}

function cleanupPunctuation(text) {
  return text.replace(/([?!])\s*([؟])/g, "$2").replace(/([؟])\s*([?!])/g, "$1");
}

function looksUntranslated(source, translated) {
  return (
    !translated.trim() ||
    (source.trim().toLowerCase() === translated.trim().toLowerCase() && /[a-z]{3,}/i.test(source))
  );
}

async function callLibreTranslateBatch(texts, target, attempt = 1) {
  const body = { q: texts, source: "en", target, format: "text" };
  if (LIBRETRANSLATE_API_KEY) body.api_key = LIBRETRANSLATE_API_KEY;

  const res = await fetch(LIBRETRANSLATE_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.status === 429 || res.status >= 500) {
    if (attempt > MAX_RETRIES) throw new Error(`LibreTranslate ${res.status} after ${MAX_RETRIES} retries`);
    const backoff = 2 ** attempt * 1000;
    console.warn(`    [${res.status}] retrying batch in ${backoff}ms (attempt ${attempt}/${MAX_RETRIES})`);
    await sleep(backoff);
    return callLibreTranslateBatch(texts, target, attempt + 1);
  }
  if (!res.ok) {
    const body2 = await res.text().catch(() => "");
    throw new Error(`LibreTranslate ${res.status}: ${body2.slice(0, 300)}`);
  }

  const json = await res.json();
  if (!Array.isArray(json.translatedText)) {
    throw new Error(`Unexpected batch LibreTranslate response: ${JSON.stringify(json).slice(0, 300)}`);
  }
  return json.translatedText.map(cleanupPunctuation);
}

/** Translates unique `sentences` (deduped) into `target`, batched, with per-item retry on echo-back failures. */
async function translateSentenceSet(sentences, target) {
  const unique = [...new Set(sentences)];
  const result = new Map();

  for (let i = 0; i < unique.length; i += BATCH_SIZE) {
    const batch = unique.slice(i, i + BATCH_SIZE);
    console.log(`    batch ${i / BATCH_SIZE + 1}/${Math.ceil(unique.length / BATCH_SIZE)} (${batch.length} strings) ...`);
    let translated = await callLibreTranslateBatch(batch, target);
    await sleep(REQUEST_DELAY_MS);

    for (let attempt = 1; attempt <= UNTRANSLATED_RETRIES; attempt += 1) {
      const retryIndices = batch
        .map((source, idx) => (looksUntranslated(source, translated[idx]) ? idx : -1))
        .filter((idx) => idx !== -1);
      if (retryIndices.length === 0) break;
      const retryBatch = retryIndices.map((idx) => batch[idx]);
      const retryResult = await callLibreTranslateBatch(retryBatch, target);
      await sleep(REQUEST_DELAY_MS);
      retryIndices.forEach((idx, j) => {
        translated[idx] = retryResult[j];
      });
    }

    // A translation that's still empty after every retry ships as English
    // rather than as a blank string — better a readable fallback than
    // silently missing text.
    batch.forEach((source, idx) => {
      result.set(source, translated[idx].trim() ? translated[idx] : source);
    });
  }
  return result;
}

function reconstruct(units, sentenceMap) {
  return units
    .map((unit) => {
      if (unit.type === "protected") return unit.value;
      const translated = sentenceMap.get(unit.value) ?? unit.value;
      return unit.leading + translated + unit.trailing;
    })
    .join("");
}

async function main() {
  const { locales, dryRun } = parseArgs();
  for (const locale of locales) {
    if (!ALL_LOCALES.includes(locale)) {
      throw new Error(`Unknown locale "${locale}". Expected one of: ${ALL_LOCALES.join(", ")}`);
    }
  }

  const enStrings = JSON.parse(readFileSync(join(ROOT, "scripts/tmp-app-strings.json"), "utf-8"));
  const unitsByString = new Map(enStrings.map((s) => [s, toUnits(s)]));
  const allSentences = enStrings.flatMap((s) => unitsByString.get(s).filter((u) => u.type === "sentence").map((u) => u.value));

  console.log(`${enStrings.length} source strings, ${new Set(allSentences).size} unique translatable sentences.`);
  console.log(`Checking supported languages at ${LANGUAGES_URL} ...`);
  const supported = await fetchSupportedLanguages();

  const outPath = join(ROOT, "public/app/i18n/translations.js");
  // Locales not requested this run (e.g. `--locales=ar` for a spot-fix) keep
  // whatever the file already has for them, rather than being dropped.
  const existing = existsSync(outPath)
    ? JSON.parse(
        readFileSync(outPath, "utf-8")
          .replace(/^\s*\/\*[\s\S]*?\*\/\s*/, "")
          .replace(/^window\.AID_TRANSLATIONS\s*=\s*/, "")
          .replace(/;\s*$/, ""),
      )
    : {};
  const dictionaries = {};

  for (const locale of locales) {
    const target = toLibreTarget(locale);
    if (supported && !supported.has(target)) {
      console.log(`\n=== ${locale}: SKIPPED (not in supported-languages list for target "${target}") ===`);
      continue;
    }
    console.log(`\n=== ${locale} (LibreTranslate target: ${target}) ===`);
    const sentenceMap = await translateSentenceSet(allSentences, target);

    const dict = {};
    for (const source of enStrings) {
      const translated = reconstruct(unitsByString.get(source), sentenceMap);
      if (translated !== source) dict[source] = translated;
    }
    dictionaries[locale] = dict;
    console.log(`  ${Object.keys(dict).length}/${enStrings.length} strings translated (rest identical to English).`);
  }

  if (dryRun) {
    console.log("\n[dry-run] would write", outPath);
    return;
  }

  const dir = dirname(outPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const header = `/**\n * Study app translations — generated by scripts/translate-app-content.mjs\n * from scripts/tmp-app-strings.json (see extract-app-strings.mjs). Keyed by\n * the *exact* English source string; loaded and applied by ./i18n.js.\n * Machine-translated (LibreTranslate), not reviewed by a native speaker.\n */\n`;
  const merged = { ...existing, ...dictionaries };
  const body = `window.AID_TRANSLATIONS = ${JSON.stringify(merged, null, 2)};\n`;
  writeFileSync(outPath, header + body, "utf-8");
  console.log(`\nWrote ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
