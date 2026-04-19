/**
 * Node.js / CLI i18next bootstrap for ai-i18n-tools (see docs/GETTING_STARTED.md, Step 4).
 *
 * Paths line up with this example’s `ai-i18n-tools.config.json`:
 * `ui.stringsJson` → `locales/strings.json`, `ui.flatOutputDir` → `locales/`, and the
 * generated `ui-languages.json` lives beside the flat bundles. Load target JSON with
 * `readFileSync` here (no bundler); the doc’s `import()` loader is for packagers.
 */

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import i18n from 'i18next';
import aiI18n from 'ai-i18n-tools/runtime';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Must match `sourceLocale` in `ai-i18n-tools.config.json` and `{sourceLocale}.json` under `flatOutputDir`. */
export const SOURCE_LOCALE = 'en-GB';

function readJson(relPath) {
  return JSON.parse(readFileSync(join(__dirname, relPath), 'utf-8'));
}

// Key-as-default defaults: missing keys show the literal, colons allowed in keys, React-style interpolation.
void i18n.init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));

// Catalog + plural flat from `translate-ui` (non-plural UI still resolves via keys; plural keys need the bundle).
const stringsJson = readJson('../locales/strings.json');
const enGbPluralBundle = readJson('../locales/en-GB.json');
aiI18n.setupKeyAsDefaultT(i18n, {
  stringsJson,
  sourcePluralFlatBundle: { lng: SOURCE_LOCALE, bundle: enGbPluralBundle },
});

/** Lazy loader for one locale file (used by makeLocaleLoadersFromManifest). */
function makeFileLoader(localeCode) {
  return async () => {
    const filePath = join(__dirname, `../locales/${localeCode}.json`);
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  };
}

const uiLanguages = readJson('../locales/ui-languages.json');

// One loader per manifest entry (source locale skipped) — stays in sync after `generate-ui-languages`.
const localeLoaders = aiI18n.makeLocaleLoadersFromManifest(
  uiLanguages,
  SOURCE_LOCALE,
  makeFileLoader
);

/** After `await loadLocale(code)`, call `i18n.changeLanguage(code)` (e.g. from a switcher). */
export const loadLocale = aiI18n.makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);
export default i18n;
