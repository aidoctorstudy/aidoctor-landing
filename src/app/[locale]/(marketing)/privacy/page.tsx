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
    title: "Privacy Policy — AI Doctor Study",
    description:
      "The Privacy Policy for AI Doctor Study — what data we collect, why, and your rights.",
    url: "/privacy",
    locale: isLocale(rawLocale) ? rawLocale : "en",
  });
}

export default async function PrivacyPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  return <LegalPageView content={getLegalContent(locale, "privacy")} locale={locale} />;
}
