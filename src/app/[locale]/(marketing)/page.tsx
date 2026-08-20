import type { Metadata } from "next";

import { isLocale } from "@/lib/i18n/locales";
import { generateMetadata as buildMetadata } from "@/utils/seo/generate-page-metadata";
import { HomeView } from "@/views/home";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  return buildMetadata({
    url: "/",
    locale: isLocale(rawLocale) ? rawLocale : "en",
  });
}

export default async function Home({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  return <HomeView locale={locale} />;
}
