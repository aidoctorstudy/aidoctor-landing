import { isLocale, type Locale } from "@/lib/i18n/locales";
import { StudyAppFrame } from "@/views/app/study-app-frame";

export default async function AppPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "en";

  return <StudyAppFrame locale={locale} />;
}
