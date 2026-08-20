import type { Metadata } from "next";

import { getLegalContent } from "@/lib/i18n/content";
import { isLocale } from "@/lib/i18n/locales";
import { generateMetadata as buildMetadata } from "@/utils/seo/generate-page-metadata";
import { LegalPageView } from "@/views/legal/legal-page";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  return buildMetadata({
    title: "Cookie Policy — AI Doctor Study",
    description:
      "The Cookie Policy for AI Doctor Study — which cookies and local storage we use, and why.",
    url: "/cookies",
    locale: isLocale(rawLocale) ? rawLocale : "en",
  });
}

export default async function CookiesPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  return <LegalPageView content={getLegalContent(locale, "cookies")} locale={locale} />;
}
