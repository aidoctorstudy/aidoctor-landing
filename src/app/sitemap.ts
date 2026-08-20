import type { MetadataRoute } from "next";

import { LOCALES, localizedPath } from "@/lib/i18n/locales";
import { siteConfig } from "@/lib/site";

/** Public routes, most → least important. Add an entry as the site grows. */
const ROUTES: readonly { path: string; priority: number }[] = [
  { path: "", priority: 1 },
  { path: "/app", priority: 0.9 },
  { path: "/terms", priority: 0.3 },
  { path: "/refunds", priority: 0.3 },
  { path: "/cookies", priority: 0.3 },
  { path: "/privacy", priority: 0.3 },
];

/**
 * Generates `/sitemap.xml` from `ROUTES` above — one entry per route **per
 * locale** (ADR-0029), each carrying `alternates.languages` (Next's native
 * per-URL hreflang support in `MetadataRoute.Sitemap`, no hand-rolling
 * needed) so crawlers see every locale variant of a page as related, not as
 * duplicate content.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return ROUTES.flatMap(({ path, priority }) => {
    const languages = Object.fromEntries([
      ...LOCALES.map((locale) => [locale, `${siteConfig.url}${localizedPath(locale, path)}`]),
      ["x-default", `${siteConfig.url}${path}`],
    ]);

    return LOCALES.map((locale) => ({
      url: `${siteConfig.url}${localizedPath(locale, path)}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority,
      alternates: { languages },
    }));
  });
}
