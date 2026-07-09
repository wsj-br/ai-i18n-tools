import "server-only";
import { resolveSiteLocale, type SiteLocale } from "../../lib/site-locales";

export type Dictionary = {
  siteTitle: string;
  siteDescription: string;
  footer: string;
  editLink: string;
  searchPlaceholder: string;
  tocTitle: string;
  lastUpdated: string;
};

const dictionaries: Record<SiteLocale, () => Promise<{ default: Dictionary }>> = {
  en: () => import("./en"),
  "pt-BR": () => import("./pt-BR"),
  "zh-Hans": () => import("./zh-Hans"),
};

export async function getDictionary(locale: string): Promise<Dictionary> {
  const loader = dictionaries[resolveSiteLocale(locale)];
  const { default: dictionary } = await loader();
  return dictionary;
}

export function getDirection(_locale: string): "ltr" | "rtl" {
  return "ltr";
}
