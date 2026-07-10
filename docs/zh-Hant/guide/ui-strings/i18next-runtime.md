<a id="wire-i18next-at-runtime"></a>
# 在執行階段連接 i18next

使用由 `'ai-i18n-tools/runtime'` 匯出的輔助程式來建立您的 i18n 設定檔。如需 API 簽章，請參閱[執行階段輔助程式](/guide/runtime-helpers)。

<details>
<summary>完整的 i18n 啟動範例 (src/i18n.js)</summary>

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
## 保持 `SOURCE_LOCALE` 對齊

**請保持三個值一致：** `sourceLocale` 在 `ai-i18n-tools.config.json` 中，此檔案中的 `SOURCE_LOCALE`，以及您輸出目錄下的複數型平面 JSON `translate-ui` 會寫成 `{sourceLocale}.json`（通常是 `public/locales/`）。請在靜態 `import` 中使用相同的基本名稱（上方範例：`en-GB` → `en-GB.json`）。`sourcePluralFlatBundle` 中的 `lng` 欄位必須等於 `SOURCE_LOCALE`。靜態 ES `import` 路徑無法使用變數；如果您變更來源地區設定，請同時更新 `SOURCE_LOCALE` 和匯入路徑。或者，使用動態 `import(\` 載入該檔案。/public/locales/${SOURCE_LOCALE}.json\`)`、`fetch` 或 `readFileSync`，以便路徑從 `SOURCE_LOCALE` 建構。

該程式碼片段使用 `./locales/…` 和 `./public/locales/…`，就像 `i18n` 位於這些資料夾旁邊一樣。如果您的檔案位於 `src/` 之下（典型情況），請使用 `../locales/…` 和 `../public/locales/…`，以便匯入解析至與 `ui.stringsJson`、`languagesManifestPath` 和 `ui.flatOutputDir` 相同的路徑。

在 React 渲染之前（例如，在您的入口點頂部）匯入 `i18n.js`。當使用者變更語言時，請呼叫 `await loadLocale(code)` 然後呼叫 `await i18n.changeLanguage(code)`。

`SOURCE_LOCALE` 會被匯出，因此任何需要它的其他檔案（例如語言切換器）都可以直接從 `'./i18n'` 匯入。如果您正在遷移現有的 i18next 設定，請將任何硬式編碼的來源地區設定字串（例如，散佈在元件中的 `'en-GB'` 檢查）替換為從您的 i18n 引導檔案匯入 `SOURCE_LOCALE`。

如果您偏好不使用預設匯出，具名匯入（`import { defaultI18nInitOptions, … } from 'ai-i18n-tools/runtime'`）也能正常運作。

<a id="locale-loaders"></a>
## 語言環境載入器

請透過使用 `makeLocaleLoadersFromManifest` 從 `ui-languages.json` 衍生地區設定，將 `localeLoaders` **與設定保持一致**（這會使用與 `SOURCE_LOCALE` 相同的正規化方式篩選掉 `makeLoadLocale`）。當您將地區設定新增至 `targetLocales` 並執行 `generate-ui-languages` 時，資訊清單會更新，您的載入器會自動追蹤變更 — 無需維護單獨的硬式編碼對應表。

對於 `public/` 下的 JSON 捆綁包（典型的 Next.js 設定），請從您的公開 URL 路徑擷取：

```js
(code) => () => fetch(`/locales/${code}.json`).then(res => res.json())
```

對於沒有捆綁器的 Node CLI，請在一個小型輔助程式中使用 `readFileSync`，該程式會為每個程式碼讀取並剖析 JSON 檔案。

使用 `setupKeyAsDefaultT` 作為常見的應用程式進入點（鍵值修剪 + 複數 `wrapT` + 可選的 `translate-ui` `{sourceLocale}.json`）。單獨呼叫 `wrapI18nWithKeyTrim` 已**棄用**用於應用程式連接 — 請參閱[執行階段輔助程式](/guide/runtime-helpers)。
