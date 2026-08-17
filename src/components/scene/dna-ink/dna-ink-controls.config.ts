// 📖 Docs: obsidian/frontend/components/dna-ink-scene.md

/**
 * Metadata for the DNA Ink controls panel: one slider range per numeric
 * setting, plus the snapshot serialiser and the local-storage helpers.
 *
 * `NUMERIC_RANGES` is typed as an exhaustive `Record<NumericKey, …>`, so adding
 * a field to `DnaInkConfig` without giving it a range is a **compile error**,
 * not a slider that silently defaults to 0–1.
 */

import type { DnaInkConfig, HexColor } from "@/lib/scene/dna-ink";

/** Keys of `DnaInkConfig` whose value is a number. */
export type NumericKey = {
  [K in keyof DnaInkConfig]: DnaInkConfig[K] extends number ? K : never;
}[keyof DnaInkConfig];

/** Keys of `DnaInkConfig` whose value is a `#rrggbb` colour. */
export type ColorKey = Exclude<keyof DnaInkConfig, NumericKey>;

export interface SliderRange {
  min: number;
  max: number;
  step: number;
}

/** Ported from the sketch's `numericRanges`; `maxPixelRatio` is new. */
export const NUMERIC_RANGES: Record<NumericKey, SliderRange> = {
  flameAmt: { min: 0, max: 2, step: 0.02 },
  atmoCount: { min: 0, max: 1500, step: 10 },
  atmoSize: { min: 0, max: 80, step: 1 },
  atmoSpeed: { min: 0, max: 4, step: 0.05 },
  helixCount: { min: 2000, max: 40000, step: 500 },
  inkCount: { min: 5000, max: 160000, step: 1000 },
  camDist: { min: 8, max: 40, step: 0.5 },
  helixSize: { min: 1, max: 20, step: 0.5 },
  inkSize: { min: 1, max: 40, step: 0.5 },
  brightness: { min: 0, max: 4, step: 0.05 },
  helixOpacity: { min: 0, max: 2, step: 0.02 },
  inkOpacity: { min: 0, max: 2, step: 0.02 },
  inkGrow: { min: 0, max: 8, step: 0.1 },
  radius: { min: 0.2, max: 3, step: 0.05 },
  height: { min: 1, max: 10, step: 0.1 },
  twist: { min: 0.2, max: 5, step: 0.05 },
  strandThick: { min: 0, max: 1, step: 0.01 },
  wave: { min: 0, max: 1.5, step: 0.02 },
  spin: { min: 0, max: 2, step: 0.02 },
  tilt: { min: -1.5, max: 1.5, step: 0.02 },
  emitRate: { min: 0.01, max: 0.5, step: 0.005 },
  spread: { min: 0, max: 10, step: 0.1 },
  rise: { min: -3, max: 3, step: 0.05 },
  turbulence: { min: 0, max: 8, step: 0.1 },
  noiseFreq: { min: 0.05, max: 2, step: 0.05 },
  noiseEvolve: { min: 0, max: 1, step: 0.01 },
  parallax: { min: 0, max: 3, step: 0.05 },
  pointerRadius: { min: 0, max: 8, step: 0.1 },
  pointerStrength: { min: 0, max: 6, step: 0.05 },
  maxPixelRatio: { min: 1, max: 3, step: 0.5 },
};

/** Narrows a config key to one holding a colour, so the row can pick its input. */
export const isColorKey = (
  config: DnaInkConfig,
  key: keyof DnaInkConfig,
): key is ColorKey => typeof config[key] === "string";

/** Slider values carry float noise; keep the snapshot as readable as the source. */
const SNAPSHOT_PRECISION = 4;

/**
 * Render the live config as source you can paste straight over the body of
 * `src/lib/scene/dna-ink/config.ts` — the panel's entire reason to exist.
 */
export const serialiseConfig = (config: DnaInkConfig): string => {
  const lines = ["export const DNA_INK_CONFIG: DnaInkConfig = {"];

  for (const key of Object.keys(config) as (keyof DnaInkConfig)[]) {
    const value = config[key];
    const formatted =
      typeof value === "string"
        ? `"${value}"`
        : Number.isInteger(value)
          ? String(value)
          : String(parseFloat(value.toFixed(SNAPSHOT_PRECISION)));
    lines.push(`  ${key}: ${formatted},`);
  }

  lines.push("};");
  return lines.join("\n");
};

const STORAGE_KEY = "ai-doctor-study:dna-ink";

/**
 * Merge any stored overrides over `base`.
 *
 * Deliberately conservative: unknown keys and type mismatches are dropped, so a
 * stale entry written before a config field changed shape can never poison the
 * scene. Returns `base` untouched if there is nothing usable.
 */
export const readStoredConfig = (base: DnaInkConfig): DnaInkConfig => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;

    const stored: unknown = JSON.parse(raw);
    if (typeof stored !== "object" || stored === null) return base;

    const merged: DnaInkConfig = { ...base };
    for (const key of Object.keys(base) as (keyof DnaInkConfig)[]) {
      const value = (stored as Record<string, unknown>)[key];
      if (typeof value !== typeof base[key]) continue;
      if (isColorKey(base, key) && typeof value === "string") {
        merged[key] = value as HexColor;
      } else if (typeof value === "number") {
        merged[key as NumericKey] = value;
      }
    }
    return merged;
  } catch {
    return base;
  }
};

export const writeStoredConfig = (config: DnaInkConfig): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Private mode / quota — the panel still works, it just won't persist.
  }
};

export const clearStoredConfig = (): void => {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to recover from: the caller resets its own state either way.
  }
};
