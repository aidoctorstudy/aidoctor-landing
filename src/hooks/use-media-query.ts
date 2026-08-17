"use client";

/**
 * SSR-safe `matchMedia` subscription.
 *
 * Built on `useSyncExternalStore` rather than `useState` + `useEffect` so the
 * server snapshot is explicit: it returns `false` during SSR and on the first
 * client render, then re-renders once the real value is known. That ordering is
 * what keeps it hydration-safe — reading `window.matchMedia` during render
 * would produce server/client markup that disagrees.
 *
 * Use it for behaviour that must actually *change* below a breakpoint (a scroll
 * hijack that should not run, a sticky overlay that would hide content). Pure
 * styling belongs in Tailwind's responsive prefixes, not here.
 *
 * 📖 Docs: obsidian/frontend/hooks.md
 */

import { useCallback, useSyncExternalStore } from "react";

export const useMediaQuery = (query: string): boolean => {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );

  const getSnapshot = useCallback(
    () => window.matchMedia(query).matches,
    [query],
  );

  // Server and first paint: assume the query does not match. Every caller here
  // treats `false` as "small screen", so the mobile layout is what renders
  // before hydration — the safer default.
  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};

/** Matches the `lg` breakpoint — where the Figma desktop composition starts. */
export const DESKTOP_QUERY = "(min-width: 1024px)";
