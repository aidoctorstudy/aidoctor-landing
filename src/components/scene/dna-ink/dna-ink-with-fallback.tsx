"use client";

// 📖 Docs: obsidian/frontend/components/dna-ink-scene.md

/**
 * Hero-only wrapper: the live DNA scene, or a CSS backdrop if it fails to
 * mount on a phone.
 *
 * The Hero mounts its scene on every viewport (unlike Contact's, which is
 * desktop-only), so a phone that refuses a WebGL context — no `LazyDnaInk`
 * `onError` handling existed before this — was left with an empty hero. This
 * wrapper only swaps to the CSS fallback below `MOBILE_QUERY` (768px):
 * desktop failures are rare enough, and different enough in cause, to be out
 * of scope here — see `DnaInk`'s `onError` doc.
 */

import { useState } from "react";

import { MOBILE_QUERY, useMediaQuery } from "@/hooks/use-media-query";

import { LazyDnaInk, type LazyDnaInkProps } from "./lazy-dna-ink";
import { MobileDnaFallback } from "./mobile-dna-fallback";

export const DnaInkWithFallback = ({
  className,
  ...props
}: LazyDnaInkProps) => {
  const [failed, setFailed] = useState(false);
  const isMobile = useMediaQuery(MOBILE_QUERY);

  if (failed && isMobile) {
    return <MobileDnaFallback className={className} />;
  }

  return (
    <LazyDnaInk className={className} onError={() => setFailed(true)} {...props} />
  );
};
