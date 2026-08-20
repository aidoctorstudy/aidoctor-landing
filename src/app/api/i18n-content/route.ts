import { getHomeContent, getSiteChrome, LEGAL_CONTENT_EN } from "@/lib/i18n/content";
import { handle } from "@/lib/api";

/**
 * Internal dev tool, not a product endpoint — `scripts/translate-content.mjs`
 * fetches this to get the English content bundle as plain JSON, since the
 * script runs as standalone Node (no `@/` path-alias resolution, no Next
 * TS pipeline) and can't `import` `data/mocks/home.ts` directly. See that
 * script's header comment and decisions-log ADR-0029.
 *
 * Nothing returned here is sensitive: it's exactly the English marketing
 * copy already rendered into every visitor's HTML, just pre-shaped into one
 * JSON payload instead of scattered across page renders.
 */
export const GET = handle(async () => ({
  home: getHomeContent("en"),
  chrome: getSiteChrome("en"),
  legal: LEGAL_CONTENT_EN,
}));
