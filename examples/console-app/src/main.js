import { parseArgs } from 'util';
import i18n, { loadLocale } from './i18n.js';

const { values } = parseArgs({
  options: {
    locale: { type: 'string', short: 'l', default: 'en-GB' },
  },
});

const locale = values.locale;

await loadLocale(locale);
await i18n.changeLanguage(locale);

const { t } = i18n;

console.log('-------------------------------------------------------');
console.log(t('ai-i18n-tools example console app'));
console.log('-------------------------------------------------------\n');
console.log(t('Hello World!!'));
console.log(t('This line will be translated to multiple languages.'));
console.log(t('This is line number {{number}}', { number: 3 }));
console.log('\n\n');
