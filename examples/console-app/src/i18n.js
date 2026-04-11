import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import i18n from 'i18next';
import {
  defaultI18nInitOptions,
  makeLoadLocale,
  wrapI18nWithKeyTrim,
} from 'ai-i18n-tools/runtime';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const SOURCE_LOCALE = 'en';

void i18n.init(defaultI18nInitOptions(SOURCE_LOCALE));
wrapI18nWithKeyTrim(i18n);

function makeFileLoader(localeCode) {
  return async () => {
    const filePath = join(__dirname, `../locales/${localeCode}.json`);
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  };
}

const localeLoaders = {
  es: makeFileLoader('es'),
  fr: makeFileLoader('fr'),
  de: makeFileLoader('de'),
  'pt-BR': makeFileLoader('pt-BR'),
};

export const loadLocale = makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);
export default i18n;
