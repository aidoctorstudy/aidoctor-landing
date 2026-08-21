import { isLocale, type Locale } from "@/lib/i18n/locales";
import { StudyAppFrame } from "@/views/app/study-app-frame";

export default async function AppPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ pro?: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "en";
  const { pro } = await searchParams;

  return <StudyAppFrame locale={locale} proActivated={pro === "activated"} />;
}
