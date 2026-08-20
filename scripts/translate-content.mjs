#!/usr/bin/env node
/**
 * Build-time translation pipeline (decisions-log ADR-0029).
 *
 * Translates the site's English content into the other 8 locales via the
 * Anthropic API, and writes the result as committed JSON files under
 * `src/data/i18n/<locale>/`. Those files are read at request time by
 * `src/lib/i18n/content.ts` (`getHomeContent`/`getSiteChrome`/
 * `getLegalContent`) — this script is a one-time (or re-run-when-copy-changes)
 * dev tool, **not** part of `next build`. Rerun it after editing English
 * copy in `data/mocks/home.ts` / `data/mocks/legal.ts`, then commit the
 * updated JSON.
 *
 * Plain Node, `fetch` only — no new npm dependency, matching this project's
 * minimal-deps philosophy (see tech-stack.md). It cannot `import` the TS
 * content modules directly (no `@/` path-alias resolution outside Next's
 * own pipeline), so it instead fetches the English bundle as JSON from a
 * small internal dev-tool endpoint, `GET /api/i18n-content` — meaning:
 *
 *   **The Next dev server must be running** (`npm run dev`) before this
 *   script is run.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-ant-... node scripts/translate-content.mjs
 *   node scripts/translate-content.mjs --locales=ar,es   # subset
 *   node scripts/translate-content.mjs --dry-run          # translate, don't write
 *
 * `ANTHROPIC_API_KEY` may also be set in `.env.local` (git-ignored) — this
 * script reads that file itself since it runs outside Next's own env
 * loading. See `.env.example` and environment-variables.md.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const ALL_LOCALES = ["ar", "ur", "es", "fr", "hi", "pt", "de", "zh"];
const DEV_SERVER_URL = process.env.DEV_SERVER_URL ?? "http://localhost:3000";
const MODEL = process.env.TRANSLATE_MODEL ?? "claude-sonnet-5";
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

const LOCALE_NAMES = {
  ar: "Arabic (Modern Standard Arabic)",
  ur: "Urdu",
  es: "Spanish",
  fr: "French",
  hi: "Hindi",
  pt: "Portuguese",
  de: "German",
  zh: "Simplified Chinese",
};

/** One JSON payload → one output file, so a failure in one doesn't block the rest. */
const BUNDLES = [
  { key: "home", file: "home.json" },
  { key: "chrome", file: "chrome.json" },
];
const LEGAL_PAGES = ["terms", "refunds", "cookies", "privacy"];

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

function getApiKey() {
  return process.env.ANTHROPIC_API_KEY ?? readDotEnvLocal().ANTHROPIC_API_KEY;
}

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

const SYSTEM_PROMPT = `You translate marketing/legal website copy from English into the requested language, for a JSON payload that a web app renders directly.

Rules — follow exactly:
1. Return ONLY valid JSON, no markdown fences, no commentary before or after.
2. Preserve the JSON structure, all object keys, and array order EXACTLY as given.
3. Translate every human-readable string value naturally and idiomatically — this is user-facing copy, not a literal word-for-word translation.
4. NEVER translate or alter: URLs, hrefs, paths (anything starting with "/" or "http"), email addresses, the discount code "MED20", numeric values, currency amounts (e.g. "$2.99"), or object/array keys.
5. For fields that are clearly a proper noun or brand name ("AI Doctor Study", "Gumroad", "Claude AI", "USMLE", "PLAB", "MBBS"), keep them unchanged (transliterate only if the target script makes that necessary for readability, e.g. Arabic/Urdu/Hindi/Chinese) rather than translating the name itself.
6. Keep the same tone: direct, confident, friendly — not stiff or overly formal, unless the source text itself is a formal legal passage (Terms/Privacy/Refunds/Cookies content), where a precise, formal register is correct.
7. If a value is already just a symbol, emoji, short code, or non-translatable token, return it unchanged.`;

async function translateJson(payload, localeName, apiKey) {
  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Target language: ${localeName}\n\nJSON payload to translate:\n${JSON.stringify(payload, null, 2)}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Anthropic API error ${res.status}: ${body.slice(0, 500)}`);
  }

  const result = await res.json();
  const text = result.content?.[0]?.text ?? "";
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Model did not return valid JSON. First 300 chars:\n${text.slice(0, 300)}`);
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

async function main() {
  const { locales, dryRun } = parseArgs();
  const apiKey = getApiKey();

  if (!apiKey) {
    console.error(
      "Missing ANTHROPIC_API_KEY. Set it in the environment or in .env.local (see .env.example).",
    );
    process.exit(1);
  }

  const unknown = locales.filter((l) => !ALL_LOCALES.includes(l));
  if (unknown.length > 0) {
    console.error(`Unknown locale(s): ${unknown.join(", ")}. Valid: ${ALL_LOCALES.join(", ")}`);
    process.exit(1);
  }

  console.log(`Fetching English content from ${DEV_SERVER_URL} ...`);
  const english = await fetchEnglishContent();

  for (const locale of locales) {
    const localeName = LOCALE_NAMES[locale];
    console.log(`\n=== ${locale} (${localeName}) ===`);

    for (const { key, file } of BUNDLES) {
      try {
        console.log(`  translating ${file} ...`);
        const translated = await translateJson(english[key], localeName, apiKey);
        await writeLocaleFile(locale, file, translated, dryRun);
      } catch (error) {
        console.error(`  FAILED ${file}: ${error.message}`);
      }
    }

    for (const page of LEGAL_PAGES) {
      const filename = `legal-${page}.json`;
      try {
        console.log(`  translating ${filename} ...`);
        const translated = await translateJson(english.legal[page], localeName, apiKey);
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
