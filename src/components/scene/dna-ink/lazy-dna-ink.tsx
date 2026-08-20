"use client";

// 📖 Docs: obsidian/frontend/components/dna-ink-scene.md

/**
 * Lazy client wrapper for the DNA Ink scene.
 *
 * `dynamic({ ssr: false })` keeps `three` and the scene module out of the
 * page's first-load JS: the chunk is only fetched once this wrapper mounts on
 * the client. It also guarantees the scene never runs during SSR, where there
 * is no canvas and no WebGL context to build one from.
 *
 * That laziness is exactly why `gatesPreload` exists. `window.load` does not
 * wait for a chunk fetched after hydration, so the [[preloader]] would lift its
 * curtain onto an empty hero. The gate is claimed **here**, in the eagerly
 * mounted wrapper, rather than inside the lazy component — by the time that
 * chunk arrives the preloader may already have finished, and there would be
 * nothing left to hold.
 */

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef } from "react";

import { usePreload } from "@/components/common/preloader";

import type { DnaInkProps } from "./dna-ink";

const DnaInk = dynamic(
  () => import("./dna-ink").then((m) => ({ default: m.DnaInk })),
  { ssr: false, loading: () => null },
);

export interface LazyDnaInkProps extends DnaInkProps {
  /**
   * Hold the preloader's curtain until this scene has drawn its first frame.
   * Set it on the hero instance only: a scene that is off screen never renders,
   * so its gate would never resolve.
   */
  gatesPreload?: boolean;
}

export const LazyDnaInk = ({
  gatesPreload,
  onError,
  ...props
}: LazyDnaInkProps) => {
  const { registerGate } = usePreload();
  const releaseRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!gatesPreload) return;
    const release = registerGate();
    releaseRef.current = release;
    // Released on unmount too, so a scene that is torn down before it ever
    // paints cannot strand the curtain.
    return release;
  }, [gatesPreload, registerGate]);

  const handleReady = useCallback(() => releaseRef.current?.(), []);
  // A scene that fails to mount will never draw a frame either — release any
  // held gate on failure too, or a refused WebGL context would strand the
  // preloader curtain until the 6s timeout.
  const handleError = useCallback(() => {
    onError?.();
    if (gatesPreload) releaseRef.current?.();
  }, [gatesPreload, onError]);

  return (
    <DnaInk
      {...props}
      onReady={gatesPreload ? handleReady : undefined}
      onError={handleError}
    />
  );
};
