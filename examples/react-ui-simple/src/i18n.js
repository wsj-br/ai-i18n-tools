/**
 * Same idea as Transrewrt `src/renderer/i18n.js` (see transrewrt/dev/i18n.md):
 * pt-BR is the source language — keys are the Portuguese strings; missing keys show the key as text.
 * Other locales load flat JSON from `translate-ui` (source string → translation).
 */
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import uiLanguages from "./locales/ui-languages.json";

export function normalizeLocale(locale) {
  const raw = String(locale).trim();
  if (raw.includes("-")) {
    const parts = raw.split("-");
    if (parts.length === 2) {
      return `${parts[0].toLowerCase()}-${parts[1].toUpperCase()}`;
    }
  }
  return raw.toLowerCase();
}

const SOURCE = normalizeLocale("pt-BR");

i18n.use(initReactI18next).init({
  resources: {},
  lng: "pt-BR",
  fallbackLng: "pt-BR",
  parseMissingKeyHandler: (key) => key,
  interpolation: { escapeValue: false },
  nsSeparator: false,
});

const originalT = i18n.t.bind(i18n);
i18n.t = function patchedT(key, ...rest) {
  const normalizedKey = typeof key === "string" ? key.trim() : key;
  return originalT(normalizedKey, ...rest);
};

/** Locale codes from ui-languages.json (for the demo language switcher). */
export const supportedLocaleCodes = uiLanguages.map((e) => e.code);

const localeJsonModules = import.meta.glob("./locales/bundles/*.json");

/**
 * Load flat bundle for a target locale (files produced by `ai-i18n-tools translate-ui`).
 * No-op for the source locale pt-BR.
 */
export async function loadLocale(lang) {
  const n = normalizeLocale(lang);
  if (n === SOURCE) {
    return;
  }
  const path = `./locales/bundles/${lang}.json`;
  const loader = localeJsonModules[path];
  if (!loader) {
    console.warn("[i18n] locale bundle not found (run translate-ui):", lang);
    return;
  }
  const mod = await loader();
  const data = mod.default ?? mod;
  i18n.addResourceBundle(lang, "translation", data, true, true);
}

export default i18n;
