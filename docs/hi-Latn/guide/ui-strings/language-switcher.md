<a id="language-switcher--rtl"></a>
# Bhasha badalne wala (Language switcher) aur RTL

<a id="language-switcher-ui"></a>
## Bhasha badalne wala UI

Bhasha chunne wale ko banane ke liye `ui-languages.json` manifest ka upyog karein. `ai-i18n-tools` do display helpers export karta hai — signatures ke liye [Runtime helpers → Display helpers](/hi-Latn/guide/runtime-helpers#display-helpers) dekhein.

<details>
<summary>Udaharan BhashaSelect component (React)</summary>

```tsx
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getUILanguageLabel,
  getUILanguageLabelNative,
  type UiLanguageManifestRow,
} from 'ai-i18n-tools/runtime';
import uiLanguages from './locales/ui-languages.json';
import { loadLocale } from './i18n';

function LanguageSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  const { t, i18n } = useTranslation();

  const options = useMemo(
    () =>
      (uiLanguages as UiLanguageManifestRow[]).map((lang) => ({
        code: lang.code,
        // Settings/content dropdowns: shows translated name when available
        label: getUILanguageLabel(lang, t),
        // Header globe menu: shows "English / Deutsch"-style label, no t() call
        nativeLabel: getUILanguageLabelNative(lang),
      })),
    [t]
  );

  const handleChange = async (code: string) => {
    await loadLocale(code);
    await i18n.changeLanguage(code);
    onChange(code);
  };

  return (
    <select value={value} onChange={(e) => handleChange(e.target.value)}>
      {options.map((row) => (
        <option key={row.code} value={row.code}>
          {row.label}
        </option>
      ))}
    </select>
  );
}
```

</details>

<br />

`getUILanguageLabel(lang, t)` - anuvadit hone par `t(englishName)` dikhata hai, ya jab dono alag hon to `englishName / t(englishName)` dikhata hai. Settings screen ke liye upyukt.

`getUILanguageLabelNative(lang)` - `englishName / label` dikhata hai (har row par koi `t()` call nahi). Header menu ke liye upyukt jahan aap native naam dikhana chahte hain.

`ui-languages.json` manifest <code>"{ code, label, englishName, direction }"</code> entries ka ek JSON array hai (`direction` `"ltr"` ya `"rtl"` hai). Udaharan:

```json
[
  { "code": "en-GB", "label": "English (UK)", "englishName": "English (UK)", "direction": "ltr" },
  { "code": "pt-BR", "label": "Português (BR)", "englishName": "Portuguese (BR)", "direction": "ltr" },
  { "code": "de",    "label": "Deutsch",        "englishName": "German", "direction": "ltr" },
  { "code": "fr",    "label": "Français",       "englishName": "French", "direction": "ltr" },
  { "code": "ar",    "label": "العربية",         "englishName": "Arabic", "direction": "rtl" }
]
```

Manifest `generate-ui-languages` ya `extract` dwara `sourceLocale` + `targetLocales` aur bundled master catalog se generate kiya jata hai. Ise `languagesManifestPath` mein likha jata hai (jab chhod diya jata hai to `{ui.flatOutputDir}/ui-languages.json` par default hota hai). Yadi aap config mein locales badalte hain, to file ko refresh karne ke liye phir se `generate-ui-languages` ya `extract` chalayen.

<a id="rtl-languages"></a>
## RTL bhashayein

`ai-i18n-tools` `getTextDirection(lng)` aur `applyDirection(lng)` export karta hai — [Runtime helpers → RTL helpers](/hi-Latn/guide/runtime-helpers#rtl-helpers) dekhein.

```js
import { getTextDirection, applyDirection } from 'ai-i18n-tools/runtime';

getTextDirection('ar')    // 'rtl'
getTextDirection('en-GB') // 'ltr'

// Applied automatically via i18n.on('languageChanged', applyDirection) — see Wire i18next
```

`applyDirection` `document.documentElement.dir` (browser) set karta hai ya no-op (Node.js) hai. Ek vishisht element ko target karne ke liye ek optional `element` argument pass karein. Ise apne i18n bootstrap mein wire karein — [Wire i18next](/hi-Latn/guide/ui-strings/i18next-runtime).

Strings ke liye jinmein `→` arrows ho sakte hain, RTL layouts ke liye unhein flip karein:

```js
import { flipUiArrowsForRtl } from 'ai-i18n-tools/runtime';
const { i18n } = useTranslation();
const isRtl = getTextDirection(i18n.language) === 'rtl';
const label = flipUiArrowsForRtl(t('Next → Step'), isRtl);
```
