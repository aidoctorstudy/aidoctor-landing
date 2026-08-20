// 📖 Docs: obsidian/frontend/components/common.md
"use client";

import Link from "next/link";
import { animated, useTransition } from "@react-spring/web";

import { CookieButton } from "./CookieButton";
import { useCookieStore } from "./cookieStore";

export const CookieBanner = () => {
  const consent = useCookieStore((s) => s.consent);
  const hydrated = useCookieStore((s) => s.hydrated);
  const modalOpen = useCookieStore((s) => s.modalOpen);
  const acceptAll = useCookieStore((s) => s.acceptAll);
  const rejectAll = useCookieStore((s) => s.rejectAll);
  const openModal = useCookieStore((s) => s.openModal);

  // Banner shows only after hydration confirmed no prior consent. Hidden while
  // the preferences modal is up so the two surfaces never compete for focus.
  const shouldShow = hydrated && consent === null && !modalOpen;

  // react-spring keeps the node mounted through the leave animation — no
  // manual mount/timeout juggling needed.
  const transitions = useTransition(shouldShow, {
    from: { opacity: 0, y: 24 },
    enter: { opacity: 1, y: 0 },
    leave: { opacity: 0, y: 24 },
    config: { tension: 280, friction: 32 },
  });

  return transitions((style, show) =>
    show ? (
      <animated.section
        aria-label="Cookie consent"
        style={{
          opacity: style.opacity,
          transform: style.y.to((v) => `translateY(${v}px)`),
        }}
        // `bg-background/95` already lands on rgba(7,13,23,.95) — the exact
        // value asked for — now that `--background` is the brand's ink navy.
        // `bottom-[calc(1rem+env(safe-area-inset-bottom))]` (and the `sm:`
        // equivalent) is `bottom-4`/`bottom-12` plus the iPhone home-indicator
        // safe area, so the banner never sits under it — the only fixed,
        // edge-anchored element on the site, so the only one that needs this.
        className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-4 right-4 z-[1000] flex flex-col gap-3 rounded-xl border-t border-border-chip bg-background/95 p-5 font-sans text-foreground shadow-2xl backdrop-blur-glass sm:bottom-[calc(3rem+env(safe-area-inset-bottom))] sm:left-auto sm:right-12 sm:w-[420px] sm:p-6"
      >
        <h2 className="text-base font-medium leading-snug sm:text-lg">
          This website uses cookies
        </h2>
        <p className="text-sm leading-relaxed text-foreground/70">
          We use cookies to improve your experience. Essential cookies are
          always on. See our{" "}
          <Link
            href="/cookies"
            className="underline underline-offset-2 hover:text-foreground/70"
          >
            cookie policy
          </Link>
          .
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <CookieButton onClick={acceptAll}>Accept All</CookieButton>
          <CookieButton variant="secondary" onClick={rejectAll}>
            Essential Only
          </CookieButton>
          <button
            type="button"
            onClick={openModal}
            className="px-2 py-2 text-sm font-medium leading-none text-foreground underline underline-offset-2 hover:text-foreground/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            Manage preferences
          </button>
        </div>
      </animated.section>
    ) : null,
  );
};
