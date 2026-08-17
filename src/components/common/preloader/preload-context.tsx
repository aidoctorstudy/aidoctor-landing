"use client";

// 📖 Docs: obsidian/frontend/components/common.md

/**
 * Tracks real page load and broadcasts when the preloader has finished.
 *
 * Two separate signals, deliberately:
 *
 * - `loaded` — the page is genuinely ready. Fonts matter here: without waiting
 *   for them the curtain lifts onto text that then reflows as Google Sans Flex
 *   swaps in.
 * - `revealed` — the curtain has finished its exit. Hero motion keys off this,
 *   not off `loaded`, so the reveal plays *after* the overlay is gone rather
 *   than behind it.
 *
 * **`window.load` alone is not readiness.** It fires once the document's own
 * subresources are in, which says nothing about anything mounted lazily — and
 * the hero's centrepiece is exactly that: [[dna-ink-scene]] is a
 * `dynamic({ ssr: false })` import, so `three` had not even been fetched when
 * the curtain used to lift. Anything that must be on screen before the reveal
 * therefore claims a **gate** (`registerGate`) and releases it when it is
 * genuinely ready.
 *
 * The provider renders its children immediately: the page is server-rendered
 * underneath the overlay, so crawlers and a no-JS visitor get the full document
 * regardless of preloader state.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Floor on how long the curtain stays up.
 *
 * On a warm cache everything resolves in a few hundred milliseconds, and a
 * progress ring that flashes past is worse than none — it reads as a glitch.
 */
const MIN_DURATION_MS = 900;

/**
 * Ceiling on gate waiting. A gate that never resolves — a failed chunk, a
 * refused WebGL context, a device that never paints the canvas — must not trap
 * the visitor behind an opaque panel forever. After this the curtain lifts
 * regardless.
 */
const GATE_TIMEOUT_MS = 6000;

interface PreloadState {
  /** Real load progress is complete. */
  loaded: boolean;
  /** The curtain has finished lifting. */
  revealed: boolean;
  markRevealed: () => void;
  /**
   * Claim a gate: the curtain will not lift until the returned callback runs.
   * Call it in an effect and return the callback as that effect's cleanup, so a
   * gate can never outlive the component that claimed it.
   */
  registerGate: () => () => void;
}

const PreloadContext = createContext<PreloadState>({
  loaded: true,
  revealed: true,
  markRevealed: () => {},
  registerGate: () => () => {},
});

export const usePreload = (): PreloadState => useContext(PreloadContext);

export const PreloadProvider = ({ children }: { children: ReactNode }) => {
  const [documentReady, setDocumentReady] = useState(false);
  const [minElapsed, setMinElapsed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [pendingGates, setPendingGates] = useState(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const finish = () => {
      // `fonts.ready` resolves on the next tick even when everything is cached,
      // so this is safe to await unconditionally.
      void document.fonts.ready.then(() => {
        if (!cancelled) setDocumentReady(true);
      });
    };

    if (document.readyState === "complete") finish();
    else window.addEventListener("load", finish, { once: true });

    const floor = setTimeout(() => setMinElapsed(true), MIN_DURATION_MS);
    const ceiling = setTimeout(() => setTimedOut(true), GATE_TIMEOUT_MS);

    return () => {
      cancelled = true;
      window.removeEventListener("load", finish);
      clearTimeout(floor);
      clearTimeout(ceiling);
    };
  }, []);

  const registerGate = useCallback(() => {
    setPendingGates((count) => count + 1);
    let released = false;
    return () => {
      if (released) return;
      released = true;
      setPendingGates((count) => count - 1);
    };
  }, []);

  const markRevealed = useCallback(() => setRevealed(true), []);

  // `pendingGates === 0` is also true before anything has claimed one, but that
  // window is not reachable: gates are claimed in child effects, and React runs
  // those before this provider's own effect starts either timer.
  const loaded =
    timedOut || (documentReady && minElapsed && pendingGates === 0);

  const value = useMemo(
    () => ({ loaded, revealed, markRevealed, registerGate }),
    [loaded, revealed, markRevealed, registerGate],
  );

  return (
    <PreloadContext.Provider value={value}>{children}</PreloadContext.Provider>
  );
};
