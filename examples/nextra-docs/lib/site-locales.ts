export const siteLocales = ["en", "pt-BR", "zh-Hans"] as const;

export type SiteLocale = (typeof siteLocales)[number];

export const defaultSiteLocale: SiteLocale = "en";

export function isSiteLocale(value: string | undefined): value is SiteLocale {
  return value !== undefined && (siteLocales as readonly string[]).includes(value);
}

/** Map route/cookie/lang params to a configured site locale, falling back to English. */
export function resolveSiteLocale(value: string | undefined): SiteLocale {
  return isSiteLocale(value) ? value : defaultSiteLocale;
}

/** BCP-47-ish segment (e.g. en-GB, fr) — not a content slug like "guide". */
function looksLikeLocaleSegment(segment: string): boolean {
  return /^[a-z]{2,3}(-[A-Za-z0-9]+)*$/i.test(segment);
}

/** Drop unrecognized locale-like path segments (e.g. `/en-GB/en-GB/guide` → `/guide`). */
export function stripInvalidLocalePrefix(pathname: string): {
  locale: SiteLocale;
  rest: string;
} {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length > 0 && isSiteLocale(segments[0])) {
    const locale = segments.shift() as SiteLocale;
    return {
      locale,
      rest: segments.length > 0 ? `/${segments.join("/")}` : "",
    };
  }

  while (segments.length > 0 && looksLikeLocaleSegment(segments[0]!)) {
    segments.shift();
  }

  return {
    locale: defaultSiteLocale,
    rest: segments.length > 0 ? `/${segments.join("/")}` : "",
  };
}
