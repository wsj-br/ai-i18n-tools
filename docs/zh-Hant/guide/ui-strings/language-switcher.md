<a id="language-switcher--rtl"></a>
# 語言切換器與 RTL

<a id="language-switcher-ui"></a>
## 語言切換器使用者介面

使用 `ui-languages.json` 資訊清單來建立語言選擇器。`ai-i18n-tools` 匯出兩個顯示輔助程式 — 請參閱[執行階段輔助程式 → 顯示輔助程式](/guide/runtime-helpers#display-helpers)以取得簽章。

<details>
<summary>範例 LanguageSelect 元件（React）</summary>

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

`getUILanguageLabel(lang, t)` — 當翻譯後顯示 `t(englishName)`，或當兩者不同時顯示 `englishName / t(englishName)`。適用於設定畫面。

`getUILanguageLabelNative(lang)` — 顯示 `englishName / label`（每行沒有 `t()` 呼叫）。適用於您希望顯示原生名稱的標頭選單。

`ui-languages.json` manifest 是 <code>"{ code, label, englishName, direction }"</code> 項目的 JSON 陣列（`direction` 為 `"ltr"` 或 `"rtl"`）。範例：

```json
[
  { "code": "en-GB", "label": "English (UK)", "englishName": "English (UK)", "direction": "ltr" },
  { "code": "pt-BR", "label": "Português (BR)", "englishName": "Portuguese (BR)", "direction": "ltr" },
  { "code": "de",    "label": "Deutsch",        "englishName": "German", "direction": "ltr" },
  { "code": "fr",    "label": "Français",       "englishName": "French", "direction": "ltr" },
  { "code": "ar",    "label": "العربية",         "englishName": "Arabic", "direction": "rtl" }
]
```

清單由 `generate-ui-languages` 或 `extract` 從 `sourceLocale` + `targetLocales` 與隨附的主目錄產生。它會寫入至 `languagesManifestPath`（省略時預設為 `{ui.flatOutputDir}/ui-languages.json`）。如果您在設定中變更了語言環境，請再次執行 `generate-ui-languages` 或 `extract` 以重新整理該檔案。

<a id="rtl-languages"></a>
## RTL 語言

`ai-i18n-tools` 匯出 `getTextDirection(lng)` 和 `applyDirection(lng)` — 請參閱[執行階段輔助程式 → RTL 輔助程式](/guide/runtime-helpers#rtl-helpers)。

```js
import { getTextDirection, applyDirection } from 'ai-i18n-tools/runtime';

getTextDirection('ar')    // 'rtl'
getTextDirection('en-GB') // 'ltr'

// Applied automatically via i18n.on('languageChanged', applyDirection) — see Wire i18next
```

`applyDirection` 設定 `document.documentElement.dir` (瀏覽器) 或不執行任何操作 (Node.js)。傳遞選用的 `element` 引數以指定特定元素。在您的 i18n 啟動中連接它 — [連接 i18next](/guide/ui-strings/i18next-runtime)。

對於可能包含 `→` 箭頭的字串，請為從右至左的版面配置翻轉它們：

```js
import { flipUiArrowsForRtl } from 'ai-i18n-tools/runtime';
const { i18n } = useTranslation();
const isRtl = getTextDirection(i18n.language) === 'rtl';
const label = flipUiArrowsForRtl(t('Next → Step'), isRtl);
```
