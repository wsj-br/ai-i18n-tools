<a id="wire-i18next-at-runtime"></a>
# Runtime par i18next ko wire karein

`'ai-i18n-tools/runtime'` dwara export kiye gaye helpers ka upyog karke apni i18n setup file banayein. API signatures ke liye, [Runtime helpers](/guide/runtime-helpers) dekhein.

<details>
<summary>Pura i18n bootstrap udaharan (src/i18n.js)</summary>

```js
// src/i18n.js or src/i18n.ts — use ../locales and ../public/locales instead of ./ when this file is under src/
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import aiI18n from 'ai-i18n-tools/runtime';

// Project locale files — paths must match `ui` in ai-i18n-tools.config.json (paths there are relative to the project root).
import uiLanguages from './locales/ui-languages.json'; // `languagesManifestPath` (defaults to `{ui.flatOutputDir}/ui-languages.json`)
import stringsJson from './locales/strings.json'; // `ui.stringsJson`
import sourcePluralFlat from './public/locales/en-GB.json'; // `{ui.flatOutputDir}/{SOURCE_LOCALE}.json` from translate-ui

// Must match `sourceLocale` in ai-i18n-tools.config.json (same string as in the import path above)
export const SOURCE_LOCALE = 'en-GB';

// initialise i18n with the default options
void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));

// set up the key-as-default translation
aiI18n.setupKeyAsDefaultT(i18n, {
  stringsJson,
  sourcePluralFlatBundle: { lng: SOURCE_LOCALE, bundle: sourcePluralFlat },
});

// apply the direction to the i18n instance
i18n.on('languageChanged', aiI18n.applyDirection);
aiI18n.applyDirection(i18n.language);

// create the locale loaders
const localeLoaders = aiI18n.makeLocaleLoadersFromManifest(
  uiLanguages,
  SOURCE_LOCALE,
  (code) => () => import(`./locales/${code}.json`),
);

// create the loadLocale function
export const loadLocale = aiI18n.makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);

// export the i18n instance
export default i18n;
```

</details>

<a id="keeping-source_locale-aligned"></a>
## `SOURCE_LOCALE` ko align rakhna

**Teen values ko align rakhein:** `ai-i18n-tools.config.json` mein `sourceLocale`, is file mein `SOURCE_LOCALE`, aur plural flat JSON `translate-ui` jo `{sourceLocale}.json` ke roop mein aapke flat output dir (aksar `public/locales/`) ke neeche likhta hai. Usi basename ka upyog static `import` mein karein (upar diya gaya udaharan: `en-GB` → `en-GB.json`). `sourcePluralFlatBundle` mein `lng` field `SOURCE_LOCALE` ke barabar hona chahiye. Static ES `import` paths variables ka upyog nahi kar sakte; agar aap source locale badalte hain, to `SOURCE_LOCALE` aur import path ko ek saath update karein. Vikalp roop se, us file ko dynamic `import(\`./public/locales/${SOURCE_LOCALE}.json\`)`, `fetch`, ya `readFileSync` ke saath load karein taaki path `SOURCE_LOCALE` se banaya ja sake.

Yah snippet `./locales/…` aur `./public/locales/…` ka upyog karta hai jaise ki `i18n` un folderon ke saath baitha ho. Yadi aapka file `src/` ke niche hai (samanya), to `../locales/…` aur `../public/locales/…` ka upyog karein taaki imports `ui.stringsJson`, `languagesManifestPath`, aur `ui.flatOutputDir` ke saman path par suljh jaayein.

React render hone se pehle `i18n.js` ko import karein (jaise ki aapke entry point ke top par). Jab user bhasha badalta hai, to `await loadLocale(code)` aur phir `await i18n.changeLanguage(code)` ko call karein.

`SOURCE_LOCALE` ko export kiya gaya hai taaki koi bhi anya file jise iski zaroorat hai (jaise ki ek language switcher) ise seedhe `'./i18n'` se import kar sake. Agar aap ek maujooda i18next setup ko migrate kar rahe hain, to kisi bhi hardcoded source locale strings (jaise ki components mein bikhre hue `'en-GB'` checks) ko apne i18n bootstrap file se `SOURCE_LOCALE` ke imports se badal dein.

Named imports (`import { defaultI18nInitOptions, … } from 'ai-i18n-tools/runtime'`) wahi kaam karte hain agar aap default export ka upyog nahi karna chahte hain.

<a id="locale-loaders"></a>
## Locale loaders

`localeLoaders` ko **config ke saath align** rakhein, unhe `ui-languages.json` se `makeLocaleLoadersFromManifest` ka upyog karke derive karke (yeh `SOURCE_LOCALE` ko wahi normalisation ka upyog karke filter karta hai jo `makeLoadLocale` karta hai). Jab aap `targetLocales` mein ek locale jodte hain aur `generate-ui-languages` chalate hain, to manifest update ho jaata hai aur aapke loaders swayam hi badlav ko track karte hain — ek alag hardcoded map ko maintain karne ki koi zaroorat nahi hai.

`public/` ke neeche JSON bundles ke liye (typical Next.js setup), apne public URL path se fetch karein:

```js
(code) => () => fetch(`/locales/${code}.json`).then(res => res.json())
```

Bundler ke bina Node CLIs ke liye, har code ke liye JSON file ko padhne aur parse karne wale ek chhote helper ke andar `readFileSync` ka upyog karein.

`setupKeyAsDefaultT` ka upyog aam app entry point ke roop mein karein (key-trim + plural `wrapT` + optional `translate-ui` `{sourceLocale}.json`). Application wiring ke liye akele `wrapI18nWithKeyTrim` ko call karna **deprecated** hai — [Runtime helpers](/guide/runtime-helpers) dekhein.
