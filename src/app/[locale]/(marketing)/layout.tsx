import type { Metadata, Viewport } from "next";
import { Google_Sans_Flex } from "next/font/google";

import { LOCALES, RTL_LOCALES, isLocale, type Locale } from "@/lib/i18n/locales";
import {
  generateMetadata,
  generateViewport,
} from "@/utils/seo/generate-page-metadata";
import { getSiteStructuredData } from "@/utils/seo/structured-data";

import { LazyCookie } from "@/components/common/Cookie";
import { AdaptiveGrid } from "@/components/common/grid";
import { PreloadProvider, Preloader } from "@/components/common/preloader";
import { ReducedMotion } from "@/components/common/reduced-motion";
import { ScrollLayout } from "@/layouts/scroll-layout";

import "@/app/globals.css";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

/**
 * Google Sans Flex — the Figma design's only typeface.
 *
 * A variable font: one file covers the whole 100–1000 weight range, so the
 * design's Light (300) and Medium (500) cost nothing extra. `GRAD` and `ROND`
 * are requested because the mockup pins them (`GRAD 0, ROND 0`); `wdth` comes
 * along for the same reason. Axes must be listed explicitly or `next/font`
 * ships the weight axis alone.
 */
const googleSansFlex = Google_Sans_Flex({
  variable: "--font-google-sans-flex",
  subsets: ["latin"],
  display: "swap",
  axes: ["GRAD", "ROND", "wdth"],
});

// Locale-agnostic fallback only — every actual page under this layout
// (home, the four legal pages) exports its own locale-aware `generateMetadata`,
// which Next uses instead. This covers the layout itself having no page.
export const metadata: Metadata = generateMetadata();
export const viewport: Viewport = generateViewport();

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "en";
  const dir = RTL_LOCALES.has(locale) ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir}>
      <body className={`${googleSansFlex.variable} font-sans`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(getSiteStructuredData()),
          }}
        />
        {/* The provider wraps everything so any subtree can wait for the
            curtain; the page itself still renders underneath it from the first
            byte, which is what keeps the document crawlable. */}
        <PreloadProvider>
          <Preloader />
          <ScrollLayout>
            <AdaptiveGrid />
            <ReducedMotion />
            <LazyCookie />
            {children}
          </ScrollLayout>
        </PreloadProvider>
      </body>
    </html>
  );
}
