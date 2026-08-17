"use client";

// 📖 Docs: obsidian/frontend/components/dna-ink-scene.md

/**
 * Dev-only controls panel for the DNA Ink scene.
 *
 * A React port of the slider panel that shipped inside the `dna-ink.html`
 * sketch: one row per `DnaInkConfig` field, a live snapshot of the current
 * values as paste-ready source, and reload / reset. Changes are pushed to the
 * live scene through `DnaInkScene.applyConfig` — nothing remounts, so dragging
 * a slider is smooth.
 *
 * Rendered only when `<DnaInk controls>` is set, which defaults to development.
 */

import { useState } from "react";

import type { DnaInkConfig, HexColor } from "@/lib/scene/dna-ink";

import {
  isColorKey,
  NUMERIC_RANGES,
  serialiseConfig,
  type ColorKey,
  type NumericKey,
  type SliderRange,
} from "./dna-ink-controls.config";

// `w-fit` (not a fixed width) so the collapsed panel shrinks to just the
// summary chip — the body below carries the real width.
const PANEL_CLASSES = [
  "pointer-events-auto fixed top-3 right-3 z-50 select-none",
  "w-fit max-h-[var(--debug-panel-height)] overflow-auto",
  "rounded-md border border-debug-border bg-debug-surface p-2.5",
  "text-[length:var(--debug-text)]/relaxed text-debug-foreground",
  "backdrop-blur-[var(--debug-panel-blur)]",
].join(" ");

const BUTTON_CLASSES = [
  "flex-1 cursor-pointer rounded-sm px-1.5 py-1",
  "border border-debug-control-border bg-debug-control",
  "transition-colors duration-[var(--duration-fast)] ease-entrance",
  "hover:bg-debug-control-hover",
].join(" ");

interface FieldProps<K extends keyof DnaInkConfig> {
  name: K;
  value: DnaInkConfig[K];
  onChange: (value: DnaInkConfig[K]) => void;
}

const ColorField = ({ name, value, onChange }: FieldProps<ColorKey>) => (
  <label className="flex items-center justify-between gap-2.5">
    <span>{name}</span>
    <input
      type="color"
      value={value}
      onChange={(event) => onChange(event.target.value as HexColor)}
      className="h-5 w-7 cursor-pointer rounded-xs border border-debug-swatch-border bg-transparent p-0"
    />
  </label>
);

const RangeField = ({
  name,
  value,
  onChange,
  range,
}: FieldProps<NumericKey> & { range: SliderRange }) => (
  <label className="flex items-center justify-between gap-2.5">
    <span>{name}</span>
    <input
      type="range"
      min={range.min}
      max={range.max}
      step={range.step}
      value={value}
      onChange={(event) => {
        const parsed = parseFloat(event.target.value);
        // Integer-stepped sliders (counts, sizes) must land on the step grid —
        // browsers report the raw value when min isn't a multiple of step.
        onChange(
          Number.isInteger(range.step)
            ? Math.round(parsed / range.step) * range.step
            : parsed,
        );
      }}
      className="w-[var(--debug-slider-width)] cursor-pointer"
    />
  </label>
);

export interface DnaInkControlsProps {
  config: DnaInkConfig;
  onChange: (config: DnaInkConfig) => void;
  /** Re-seed and rebuild the scene with the current settings. */
  onReload: () => void;
  /** Drop stored overrides and rebuild from the committed config. */
  onReset: () => void;
}

export const DnaInkControls = ({
  config,
  onChange,
  onReload,
  onReset,
}: DnaInkControlsProps) => {
  const [copied, setCopied] = useState(false);
  const snapshot = serialiseConfig(config);

  const update = <K extends keyof DnaInkConfig>(
    key: K,
    value: DnaInkConfig[K],
  ) => {
    const next: DnaInkConfig = { ...config };
    next[key] = value;
    setCopied(false);
    onChange(next);
  };

  const copySnapshot = async () => {
    try {
      await navigator.clipboard.writeText(snapshot);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  // Collapsed on load: the panel is a tuning tool, not part of the design.
  // `<summary>` is the native disclosure control — keyboard-operable and
  // labelled without any extra ARIA, which a styled <button> would need.
  return (
    <details className={PANEL_CLASSES}>
      <summary className="cursor-pointer list-none font-medium">
        ⚙ controls
      </summary>

      <div className="mt-1.5 flex w-[var(--debug-panel-width)] flex-col gap-1">
        {(Object.keys(config) as (keyof DnaInkConfig)[]).map((key) =>
          isColorKey(config, key) ? (
            <ColorField
              key={key}
              name={key}
              value={config[key]}
              onChange={(value) => update(key, value)}
            />
          ) : (
            <RangeField
              key={key}
              name={key}
              value={config[key]}
              range={NUMERIC_RANGES[key]}
              onChange={(value) => update(key, value)}
            />
          ),
        )}
      </div>

      <div className="mt-2 flex gap-1.5">
        <button type="button" onClick={onReload} className={BUTTON_CLASSES}>
          ⟳ reload
        </button>
        <button type="button" onClick={onReset} className={BUTTON_CLASSES}>
          ↺ reset
        </button>
        <button
          type="button"
          onClick={() => void copySnapshot()}
          className={BUTTON_CLASSES}
        >
          {copied ? "✓ copied" : "⧉ copy"}
        </button>
      </div>

      <pre className="mt-2 max-h-[var(--debug-snapshot-height)] cursor-text overflow-auto rounded-sm border border-debug-border bg-debug-code-surface px-2 py-1.5 font-mono text-[length:var(--debug-code-text)]/relaxed break-words whitespace-pre-wrap text-debug-code-foreground select-text">
        {snapshot}
      </pre>
    </details>
  );
};
