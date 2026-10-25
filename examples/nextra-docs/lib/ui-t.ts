import "server-only";
import { interpolateTemplate } from "ai-i18n-tools/runtime";
import { defaultSiteLocale, resolveSiteLocale, type SiteLocale } from "./site-locales";

type FlatBundle = Record<string, string>;
type Translate = (source: string, vars?: Record<string, string | number | boolean>) => string;

/**
 * Target-locale flat bundles from `translate-ui`. The source route (`en`) has no
 * bundle: the English literal is already the string to show.
 */
const targetBundles: Partial<Record<SiteLocale, () => Promise<{ default: FlatBundle }>>> = {
  "pt-BR": () => import("../locales/pt-BR.json"),
  "zh-Hans": () => import("../locales/zh-Hans.json"),
};

/** Stateless lookup for server components. Does not select plural forms. */
export async function getT(lang: string): Promise<Translate> {
  const locale = resolveSiteLocale(lang);
  if (locale === defaultSiteLocale) {
    return (source, vars) => interpolateTemplate(source, vars ?? {});
  }
  const loader = targetBundles[locale];
  const flat = loader ? (await loader()).default : {};
  return (source, vars) => interpolateTemplate(flat[source] ?? source, vars ?? {});
}
