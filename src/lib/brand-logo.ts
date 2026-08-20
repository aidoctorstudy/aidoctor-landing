import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The real AI Doctor Study logo (ADR-0029), as a base64 data URI — for the
 * generated icon/OG routes only. Those render via Satori (`next/og`)
 * outside Next's normal image pipeline, so `next/image` doesn't apply and a
 * relative `/logo.png` URL isn't reliably resolvable inside that renderer;
 * a data URI is the same escape hatch the old `brandMarkDataUri` used.
 *
 * Everywhere else (the navbar, the preloader) is a plain browser `<img>` /
 * `next/image`, and should reference `/logo.png` directly rather than this
 * constant — no reason to inline ~49KB of base64 into the client bundle
 * when the browser can just fetch and cache the file.
 *
 * Read once at module load from `public/logo.png` — the single committed
 * source of the artwork — so this can never drift from what ships.
 *
 * 📖 Docs: obsidian/frontend/seo-metadata.md
 */
const LOGO_PATH = join(process.cwd(), "public", "logo.png");

export const BRAND_LOGO_DATA_URI = `data:image/png;base64,${readFileSync(LOGO_PATH).toString("base64")}`;
