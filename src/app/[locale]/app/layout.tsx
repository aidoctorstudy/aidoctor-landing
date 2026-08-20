import type { Metadata, Viewport } from "next";

import { LOCALES, isLocale, type Locale } from "@/lib/i18n/locales";
import { siteConfig } from "@/lib/site";
import { generateViewport } from "@/utils/seo/generate-page-metadata";

import "@/app/globals.css";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

/**
 * Separate root layout for `/app` — the study app shell.
 *
 * A Next.js route needs a root layout somewhere above it; this one is
 * deliberately its own, not a child of `(marketing)/layout.tsx`, per Next's
 * "multiple root layouts" pattern (see the sibling `(marketing)` route
 * group). None of the marketing site's chrome belongs here — no
 * `PreloadProvider`/`Preloader` curtain, no `ScrollLayout`/Lenis, no
 * `AdaptiveGrid`, no cookie banner, no Google Sans Flex font load. This is
 * meant to render nothing but a full-viewport iframe.
 *
 * `globals.css` is still imported — for Tailwind's utilities/preflight reset
 * (`h-full`, `overflow-hidden`, the CSS custom properties), not for the
 * marketing design system's fonts or providers.
 *
 * 📖 Docs: obsidian/frontend/routing.md
 */

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: "AI Doctor Study — App",
  // Thin iframe shell with no content of its own — nothing here for a
  // crawler to index; the real app it embeds is a separate, unbuilt concern.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = generateViewport();

export default async function AppRootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "en";

  return (
    <html lang={locale} className="h-full overflow-hidden">
      <body className="m-0 h-full overflow-hidden p-0">{children}</body>
    </html>
  );
}
