import {
  applyDirection,
  defaultI18nInitOptions,
  makeLoadLocale,
  wrapI18nWithKeyTrim,
  type I18nWithResources,
} from "ai-i18n-tools/runtime";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

export const SOURCE_LOCALE = "en-GB";

const i18nForHelpers = i18n as unknown as I18nWithResources;

void i18n.use(initReactI18next).init(defaultI18nInitOptions(SOURCE_LOCALE));
wrapI18nWithKeyTrim(i18nForHelpers);

function applyDocumentLocale(lng: string) {
  applyDirection(lng);
  if (typeof document !== "undefined" && document.documentElement) {
    document.documentElement.setAttribute("lang", lng);
  }
}

i18n.on("languageChanged", applyDocumentLocale);
applyDocumentLocale(i18n.language);

function makeFetchLoader(localeCode: string) {
  return async () => {
    const res = await fetch(`/locales/${localeCode}.json`);
    if (!res.ok) {
      throw new Error(`Failed to load locale ${localeCode}: ${res.status}`);
    }
    return res.json() as Promise<Record<string, string>>;
  };
}

const localeLoaders = {
  es: makeFetchLoader("es"),
  fr: makeFetchLoader("fr"),
  de: makeFetchLoader("de"),
  "pt-BR": makeFetchLoader("pt-BR"),
  ar: makeFetchLoader("ar"),
};

export const loadLocale = makeLoadLocale(
  i18nForHelpers,
  localeLoaders,
  SOURCE_LOCALE,
);
export default i18n;
