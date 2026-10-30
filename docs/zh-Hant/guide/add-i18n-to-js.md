<a id="add-i18n-to-a-jsts-app"></a>
# 為 JS/TS 應用程式新增 i18n

本頁面適用於其按鈕、標籤和訊息仍為純原始語言文字的 JS/TS 應用程式 (React、Next.js、Node 或 CLI)。`extract` 僅在 UI 字串為 `t()` 或 `i18n.t()` 內的字串字面值時才會記錄，因此目前目錄會是空的，且 `translate-ui` 將沒有任何可翻譯的內容。

步驟如下：安裝工具、安裝 i18next、執行一次 `extract`、新增一個小型設定檔以確保 `t` 存在、包裝面向使用者的文字，然後進行翻譯。不確定這是否符合您的情況？請參閱結尾的 [不符合您的情況？](#not-your-case)。

<a id="install-and-choose-a-provider"></a>
## 安裝工具並設定金鑰

安裝 CLI ([安裝](/zh-Hant/guide/installation)) 並為您的供應商設定 API 金鑰 ([供應商與 API 金鑰](/zh-Hant/guide/quick-start#provider-and-api-key))。Ollama 不需要金鑰。

<a id="initialise-the-project"></a>
## 初始化設定

```bash
ai-i18n-tools init -P openrouter
```

此操作會寫入 `ai-i18n-tools.config.json`。目前有四個重要的鍵：

- `sourceLocale`：您文字所使用的語言。任何語言皆可。本指南中以英文為常見範例。
- `targetLocales`：要新增的語言。
- `ui.sourceRoots`：`extract` 掃描的資料夾，例如 `src/`。
- `ui.stringsJson` 和 `ui.flatOutputDir`：目錄和各語系檔案的寫入位置。

所有其他鍵的說明請見 [設定](/zh-Hant/reference/configuration)。

<a id="run-the-agent-prompt"></a>
## 安裝執行階段函式庫

ai-i18n-tools 不依賴 `i18next` 或 `react-i18next`。應用程式會自行安裝它們。

- 每個在執行階段查詢字串的 JS/TS 應用程式：`i18next`。
- 呼叫 `useTranslation()` 的 React 元件：也需要 `react-i18next`。

```bash
pnpm add i18next
# React components:
pnpm add react-i18next
```

<a id="review-the-result"></a>
## 執行一次擷取

```bash
ai-i18n-tools extract
```

下一步驟中的設定檔會匯入 `strings.json` 和 `ui-languages.json`，且只有 `extract` 會寫入它們。即使找不到任何 `t()` 呼叫，它也會寫入這兩者，這樣應用程式才能編譯。預期會有 0 個字串，或者若您的 `package.json` 中有 `description`，則會有 1 個，因為擷取器預設會包含它 (`ui.uiExtractor.includePackageDescription`)。

<a id="choose-models-and-translate"></a>
## 新增啟動程式

建立 i18n 設定檔。此精簡版本足以包覆字串並加以翻譯。在 `ai-i18n-tools.config.json` 中，`SOURCE_LOCALE` 必須等於 `sourceLocale`。

```js
// src/i18n.js — adjust the import paths to match `ui` in your config
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import aiI18n from 'ai-i18n-tools/runtime';
import uiLanguages from './locales/ui-languages.json';
import stringsJson from './locales/strings.json';

export const SOURCE_LOCALE = 'en-GB';

void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));
aiI18n.setupKeyAsDefaultT(i18n, { stringsJson });

i18n.on('languageChanged', aiI18n.applyDirection);
aiI18n.applyDirection(i18n.language);

const localeLoaders = aiI18n.makeLocaleLoadersFromManifest(
  uiLanguages,
  SOURCE_LOCALE,
  (code) => () => import(`./locales/${code}.json`),
);

export const loadLocale = aiI18n.makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);
export default i18n;
```

未使用 React？請移除 `react-i18next` 的匯入和 `.use(initReactI18next)` 的呼叫。

當應用程式開始使用複數形式時，請新增原始語系的扁平檔案，以便解析複數形式。這會增加第三個匯入和一個 `sourcePluralFlatBundle` 選項，如 [連接 i18next](/zh-Hant/guide/ui-strings/i18next-runtime) 中所示。

在首次渲染前，從應用程式的進入點匯入此檔案。在 Next.js 中，請從用戶端模組匯入，模式與 [examples/nextjs-app/src/lib/i18n.ts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/src/lib/i18n.ts) 相同。

<a id="check-one-language"></a>
## 取代寫死的文案

您可以手動執行此操作，或將 [JS/TS 提示](#run-the-agent-prompt) 貼到編碼代理程式中。`t()` 的引數是使用者應看見的來源語言句子。扁平的語系檔案會以此句子為鍵。

<details class="agent-prompt" id="agent-prompt">
<summary>JS/TS 代理程式提示</summary>

將此內容複製到 Cursor 或其他編碼代理程式中。它會包裝面向使用者的字面值，但不會翻譯它們。

````markdown
# Wrap user-facing JS/TS strings in t()

## Context

ai-i18n-tools extracts only string literals passed to `t()` or `i18n.t()`. The
literal is the source-language sentence and the catalog key (`t("Save")`, not
`t("saveButton")`). After this edit the app must behave the same when the active
locale is the source locale. Do not translate any string.

Bootstrap and call-shape reference:
https://wsj-br.github.io/ai-i18n-tools/guide/ui-strings/i18next-runtime
https://wsj-br.github.io/ai-i18n-tools/guide/ui-strings/t-calls-and-plurals

## Scope

Read `ui.sourceRoots` in `ai-i18n-tools.config.json` and edit only those trees
(JS/JSX/TS/TSX). Skip `className`, URLs and routes, import paths, ids, test ids,
enum and error codes, object keys used as identifiers, log field names, CSS,
regexes, comments, and text that is already inside `t()` or `i18n.t()`.

## Call shape

Install `i18next`. Install `react-i18next` when a component uses
`useTranslation()`. Run `ai-i18n-tools extract` once so `strings.json` and
`ui-languages.json` exist, then add the bootstrap from the Wire i18next guide.
`SOURCE_LOCALE` must equal config `sourceLocale`.

- React components: `const { t } = useTranslation()` and `{t("Save")}`.
- Module-level constants and non-React files: `i18n.t("…")`. Move a constant
  that would call `t()` at import time into a function or `useMemo(..., [t])`.
- Placeholders: `t("Hello {{name}}", { name })`. No template literal as a key.
- Plurals: `t("{{count}} items", { plurals: true, count })`.
- Next.js: import the bootstrap from a client module before render. Do not call
  `changeLanguage` on a shared i18next instance inside a server component. Use a
  per-request `createInstance()`, or a stateless flat-bundle lookup.

Before:

```jsx
<button>Save</button>
```

After:

```jsx
<button>{t("Save")}</button>
```

Before:

```js
console.log(`Hello ${name}`);
```

After:

```js
console.log(t("Hello {{name}}", { name }));
```

## Order

1. Install the libraries.
2. Run `ai-i18n-tools extract` once.
3. Add the bootstrap.
4. Wrap call sites.
5. Run `ai-i18n-tools extract` again. Do not run a translation yourself and do
   not hand-edit catalogs.

## Do not

- Do not translate, rename, or reword the source text.
- Do not introduce semantic keys (`saveButton`, `nav.home`).
- Do not hand-edit `strings.json`, flat locale JSON, or `ui-languages.json`.
- Do not change behaviour, layout, or test selectors.

## Verify

- `ai-i18n-tools extract` writes a non-empty catalog of the sentences you
  wrapped.
- The project's build, type check, and tests pass.
- With the source locale active, every wrapped string still shows the original
  sentence. Switch one target locale after `translate-ui` and confirm those
  sentences change.

## Report back

List files changed, each string you deliberately skipped with a one-line reason,
and any ambiguous case you left for a human (the same word used with different
meanings, concatenated sentences, or a plural you were not sure about).
````

</details>

JSX：

```jsx
<button>Save</button>
<button>{t("Save")}</button>
```

Node、CLI 或任何非 React 模組：

```js
console.log(`Hello ${name}`);
console.log(t("Hello {{name}}", { name }));
```

規則（亦見於 [t() 呼叫與複數](/zh-Hant/guide/ui-strings/t-calls-and-plurals))：

- 鍵是字面值。`t(variable)` 和 <code>{'t(`Hello ${name}`)'}</code> 不會被擷取，且非字面值的呼叫會被略過，不會發出警告。
- 字面值內的預留位置使用 i18next 格式 <code v-pre>{{name}}</code>，並在第二個引數中傳入。
- 複數：一個來源句子加上 `{ plurals: true, count }`。請參閱 [基數複數](/zh-Hant/guide/ui-strings/t-calls-and-plurals#cardinal-plurals-plurals-true)。請勿自行建立 `_one` / `_other` 鍵。
- React 元件從 `useTranslation()` 取得 `t`。其他檔案則呼叫 `i18n.t`。在匯入時求值的常數必須移至函式或 `useMemo(..., [t])` 中，這樣 `t()` 才能在語系載入後執行。
- Next.js 伺服器元件不得在共用的 i18next 執行個體上呼叫 `changeLanguage`。並行請求會共用該單例。請使用每個請求的 `createInstance()`，或對扁平套件組合進行無狀態查詢（請參閱 [Nextra 混合模式](/zh-Hant/guide/integrations/nextra#optional-t-for-app-react-hybrid))。

請勿更動以下項目：`className`、`href` 及其他 URL、匯入路徑、ID、測試 ID、錯誤碼、用作識別碼的物件鍵，以及註解內的文字。

<a id="keep-it-translated"></a>
## 擷取與翻譯

當字面值就緒時：

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
ai-i18n-tools status
```

當 `features.translateUIStrings` 開啟時，`sync` 會同時執行 `extract` 和 `translate-ui`。`extract` 現在應會列出您包裝的句子。開啟 `ui.flatOutputDir` 下一個產生的語系檔案，並確認翻譯已在其中。下一步：請參閱 [UI 字串，步驟 2](/zh-Hant/guide/ui-strings/#step-2-extract-strings)，了解 `extract` 掃描和寫入的內容。

[examples/console-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app) 是一個小型的 Node 應用程式，其 `src/main.js` 已被包裝。Next.js 範例是 React 的啟動程式。

<a id="do-it-by-hand"></a>
## 語言切換

如 [連接 i18next](/zh-Hant/guide/ui-strings/i18next-runtime#startup-locale) 中所述，在首次渲染前還原已儲存的語系。然後新增一個會呼叫 `await loadLocale(code)` 再接著呼叫 `await i18n.changeLanguage(code)` 的控制項：[語言切換器與 RTL](/zh-Hant/guide/ui-strings/language-switcher)。

<a id="step-1-install-the-runtime-libraries"></a>
## 保持翻譯更新

變更來源文字後，請重新執行 `sync`。快取機制意味著只有新的或變更的字串會傳送到模型。從 [建議的 package.json 指令碼](/zh-Hant/guide/quick-start#recommended-packagejson-scripts) 新增指令碼，並在 CI 中執行 `sync`，以避免翻譯內容產生偏差。

預設的 `init` 範本也會翻譯 `README.md`。請參閱 [為您的 README 和 Markdown 文件新增 i18n](/zh-Hant/guide/add-i18n-to-readme)。

<a id="step-2-extract-once-and-add-the-bootstrap"></a>
## 從其他工具遷移

ai-i18n-tools 包含其自有的字串擷取器。如果您曾使用 `i18next-scanner`、`babel-plugin-i18next-extract` 或類似工具，可以在遷移後移除這些開發依賴項目。現有的 i18next 命名空間 JSON 檔案可以保留在 [JSON 管線](/zh-Hant/guide/json#i18next-namespace-files) 上。Intlayer `.content.ts` 字典可以使用 `migrate-intlayer` 匯入：請參閱 [從 Intlayer 遷移](/zh-Hant/guide/migrating-from-intlayer)。若要在執行階段保留 Intlayer 並僅填入其翻譯，請使用 `translate-intlayer`：請參閱 [就地翻譯 Intlayer](/zh-Hant/guide/translating-intlayer)。

<a id="step-3-wrap-strings"></a>
## 情況不同？

| 您目前的程式碼 | 閱讀 |
| --- | --- |
| 已使用來源語言句子進行 `t("…")` 或 `i18n.t("…")` | [UI 字串](/zh-Hant/guide/ui-strings/) 步驟 2–3，然後 [連接 i18next](/zh-Hant/guide/ui-strings/i18next-runtime) |
| i18next 命名空間 JSON (`t("saveButton")` 加上 `en/translation.json`) | [JSON](/zh-Hant/guide/json)。除非您準備好變更每個呼叫，否則請勿將這些鍵值切換為來源語言句子 |
| Intlayer 字典，從 Intlayer 遷移 | [從 Intlayer 遷移](/zh-Hant/guide/migrating-from-intlayer) |
| Intlayer 字典，保留 Intlayer | [就地翻譯 Intlayer](/zh-Hant/guide/translating-intlayer) |
| 單一 HTML 檔案 | [純 HTML](/zh-Hant/guide/ui-strings/plain-html) 和 `mark-html` |
| 文件網站，或 Astro 頁面 HTML | [將 i18n 新增至網站或文件網站](/zh-Hant/guide/add-i18n-to-website) 和 [Astro 網站](/zh-Hant/guide/ui-strings/astro-website)。`t()` 僅用於共用資料和 frontmatter |
| Python 應用程式 | [將 i18n 新增至 Python 應用程式](/zh-Hant/guide/add-i18n-to-python) |
| 儲存庫 README 或其他 Markdown 檔案 | [為您的 README 和 Markdown 文件新增 i18n](/zh-Hant/guide/add-i18n-to-readme) |
