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
    title: "Terms of Service — AI Doctor Study",
    description:
      "The Terms of Service for AI Doctor Study — the AI-powered study companion for medical students.",
    url: "/terms",
    locale: isLocale(rawLocale) ? rawLocale : "en",
  });
}

export default async function TermsPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  return <LegalPageView content={getLegalContent(locale, "terms")} locale={locale} />;
}
