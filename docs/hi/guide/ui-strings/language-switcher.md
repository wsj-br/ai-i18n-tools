<a id="language-switcher--rtl"></a>
# भाषा स्विचर और RTL

<a id="language-switcher-ui"></a>
## भाषा स्विचर UI

भाषा चयनकर्ता बनाने के लिए `ui-languages.json` मैनिफेस्ट का उपयोग करें। `ai-i18n-tools` दो डिस्प्ले हेल्पर निर्यात करता है — हस्ताक्षरों के लिए [रनटाइम हेल्पर → डिस्प्ले हेल्पर](/hi/guide/runtime-helpers#display-helpers) देखें।

<details>
<summary>उदाहरण LanguageSelect घटक (React)</summary>

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

`getUILanguageLabel(lang, t)` - अनुवादित होने पर `t(englishName)` दिखाता है, या जब दोनों भिन्न होते हैं तो `englishName / t(englishName)` दिखाता है। सेटिंग्स स्क्रीन के लिए उपयुक्त।

`getUILanguageLabelNative(lang)` - `englishName / label` दिखाता है (प्रत्येक पंक्ति पर कोई `t()` कॉल नहीं)। हेडर मेनू के लिए उपयुक्त है जहाँ आप मूल नाम दृश्यमान रखना चाहते हैं।

`ui-languages.json` मैनिफेस्ट <code>"{ code, label, englishName, direction }"</code> प्रविष्टियों का एक JSON सरणी है (`direction` `"ltr"` या `"rtl"` है)। उदाहरण:

```json
[
  { "code": "en-GB", "label": "English (UK)",   "englishName": "English (UK)",    "direction": "ltr" },
  { "code": "pt-BR", "label": "Português (BR)", "englishName": "Portuguese (BR)", "direction": "ltr" },
  { "code": "de",    "label": "Deutsch",        "englishName": "German",          "direction": "ltr" },
  { "code": "fr",    "label": "Français",       "englishName": "French",          "direction": "ltr" },
  { "code": "ar",    "label": "العربية",           "englishName": "Arabic",          "direction": "rtl" }
]
```

मैनिफेस्ट `sourceLocale` + `targetLocales` और बंडल किए गए मास्टर कैटलॉग से `generate-ui-languages` या `extract` द्वारा उत्पन्न होता है। इसे `languagesManifestPath` में लिखा जाता है (छोड़ने पर डिफ़ॉल्ट रूप से `{ui.flatOutputDir}/ui-languages.json`)। यदि आप कॉन्फ़िग में लोकेल बदलते हैं, तो फ़ाइल को रीफ़्रेश करने के लिए `generate-ui-languages` या `extract` को फिर से चलाएँ।

<a id="rtl-languages"></a>
## RTL भाषाएँ

`ai-i18n-tools` `getTextDirection(lng)` और `applyDirection(lng)` निर्यात करता है — [रनटाइम हेल्पर → RTL हेल्पर](/hi/guide/runtime-helpers#rtl-helpers) देखें।

```js
import { getTextDirection, applyDirection } from 'ai-i18n-tools/runtime';

getTextDirection('ar')    // 'rtl'
getTextDirection('en-GB') // 'ltr'

// Applied automatically via i18n.on('languageChanged', applyDirection) — see Wire i18next
```

`applyDirection` `document.documentElement.dir` (ब्राउज़र) सेट करता है या नो-ऑप (Node.js) है। किसी विशिष्ट तत्व को लक्षित करने के लिए एक वैकल्पिक `element` तर्क पास करें। इसे अपने i18n बूटस्ट्रैप में वायर करें — [i18next वायर करें](/hi/guide/ui-strings/i18next-runtime)।

उन स्ट्रिंग्स के लिए जिनमें `→` तीर हो सकते हैं, उन्हें RTL लेआउट के लिए पलट दें:

```js
import { flipUiArrowsForRtl } from 'ai-i18n-tools/runtime';
const { i18n } = useTranslation();
const isRtl = getTextDirection(i18n.language) === 'rtl';
const label = flipUiArrowsForRtl(t('Next → Step'), isRtl);
```
