<a id="add-i18n-to-a-jsts-app"></a>
# 為 JS/TS 應用程式新增 i18n

本頁說明如何處理只有單一語言的 JS/TS 應用程式 (React、Next.js、Node 或 CLI)，並使用 ai-i18n-tools 新增地區設定。它遵循一條路徑：i18next、一個小型啟動檔案，以及翻譯的 JSON 檔案。`extract` 僅在 UI 字串是 `t()` 或 `i18n.t()` 中的字串常值時才記錄，因此純原始文字的目錄將會是空的。

最快的方法是將本頁上的提示提供給程式碼代理程式。它會安裝 i18next、新增啟動檔案、包裝您的字串，並可新增語言切換功能。您需要自行安裝 CLI、選擇提供者並初始化專案，因為這需要您的 API 金鑰和您的選擇。您也需要自行執行翻譯，因為這會花費您帳戶中的費用。

網站或文件網站使用[將 i18n 新增至網站或文件網站](/zh-Hant/guide/add-i18n-to-website)。Python 應用程式使用[將 i18n 新增至 Python 應用程式](/zh-Hant/guide/add-i18n-to-python)。不確定哪個適用？請參閱結尾的[不適用於您的情況？](#not-your-case)。

流程：

1. [安裝 CLI 並選擇提供者](#install-and-choose-a-provider)。
2. 使用 `init`[初始化專案](#initialise-the-project)。
3. [執行代理程式提示](#run-the-agent-prompt)。
4. [檢閱結果](#review-the-result)。
5. [選擇模型並翻譯](#choose-models-and-translate)，然後檢查一種語言。
6. [保持翻譯](#keep-it-translated)。

偏好自行進行變更，或想知道提示的作用？[手動操作](#do-it-by-hand) 會逐步引導您完成相同的步驟。

<a id="install-and-choose-a-provider"></a>
## 安裝並選擇提供者

這部分由您執行，而不是代理程式。安裝程式會變更您的機器，而 API 金鑰是屬於您 shell 的機密，不應出現在提示中。

將套件安裝為開發相依性。啟動檔案會匯入 `ai-i18n-tools/runtime`，而全域 CLI 或獨立可執行檔無法滿足該匯入。其他安裝選項：[安裝](/zh-Hant/guide/installation)。

```bash
pnpm add -D ai-i18n-tools
```

`npm install --save-dev ai-i18n-tools` 和 `yarn add --dev ai-i18n-tools` 也適用。以下範例使用純粹的 `ai-i18n-tools` 命令。本機安裝需要在 `PATH` 上使用 `node_modules/.bin`，或在每個命令前面加上 `pnpm exec`。請參閱[使用 CLI](/zh-Hant/guide/installation#using-the-cli)。

檢查安裝：

```bash
ai-i18n-tools --version
```

然後選擇提供者，並在其將執行翻譯的 shell 中設定其 API 金鑰。例如，OpenRouter：

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Ollama 不需要金鑰。其他預設值：[內建提供者](/zh-Hant/guide/providers-and-models#built-in-providers)。請記下提供者名稱，因為您會在下一步將其傳遞給 `init`。代理程式永遠不需要金鑰：它只執行不進行模型呼叫的命令。您稍後在[翻譯](#choose-models-and-translate)時會使用該金鑰。

<a id="initialise-the-project"></a>
## 初始化專案

您在提示之前執行此操作一次。它會寫入組態並使用您上面選擇的提供者。

```bash
ai-i18n-tools init -P openrouter
```

預設範本是 `ui-markdown`。它會寫入帶有 UI 區塊和平面 README 區塊的 `ai-i18n-tools.config.json`。四個金鑰對應用程式很重要：

- `sourceLocale`：來源中字串的語言。任何 BCP-47 語言都有效；腳手架通常使用 `en-GB`。
- `targetLocales`：要新增的語言。
- `ui.sourceRoots`：`extract` 掃描的資料夾，例如 `src/`。
- `ui.stringsJson` 和 `ui.flatOutputDir`：目錄和每個地區設定檔案的寫入位置。

`init` 不會安裝 i18next，也不會新增啟動檔案。那是提示（手動操作，[步驟 1](#step-1-install-the-runtime-libraries) 和 [步驟 2](#step-2-extract-once-and-add-the-bootstrap))。

執行 `init` 一次。它每次都會重寫 `ai-i18n-tools.config.json`，因此第二次執行會捨棄您所做的編輯。

相同的範本列出了 `README.md` 用於文件翻譯。語言列表標記和 README 檔案位於[將 i18n 加入您的 README 和 Markdown 文件](/zh-Hant/guide/add-i18n-to-readme)。此頁面是 `t()` 路徑。

其他所有金鑰都在[配置](/zh-Hant/reference/configuration)中。呼叫形式：[t() 呼叫和複數](/zh-Hant/guide/ui-strings/t-calls-and-plurals)。啟動程式參考：[連結 i18next](/zh-Hant/guide/ui-strings/i18next-runtime)。

<a id="run-the-agent-prompt"></a>
## 執行代理程式提示

在您的編碼代理程式（Cursor、Claude Code、Copilot 或類似工具）中開啟專案，開始新的聊天，然後貼上以下提示。專案必須已經初始化。無需編輯。如果您想省略某些內容，例如不使用語言切換，請在同一訊息中說明。

代理程式首先檢查 CLI 和配置是否存在，如果缺少其中一個，則停止並提供指示。然後它分為三個部分運作：

- 第 1 部分安裝 i18next，執行 `extract` 一次，並加入啟動程式。
- 第 2 部分將使用者介面字串包裝在 `t()` 或 `i18n.t()` 中。
- 第 3 部分加入語言切換，或 CLI 語言選項。

它不會安裝 CLI、初始化配置、讀取您的 API 金鑰或翻譯。翻譯是審查之後的步驟，由您執行。

````markdown
# Add languages to this JS/TS app

## Before you start

The user must already have installed ai-i18n-tools and initialised this
project. Check that `ai-i18n-tools --version` runs (or
`pnpm exec ai-i18n-tools --version` when the binary is only in
`node_modules/.bin`) and that
`ai-i18n-tools.config.json` exists with a `ui` block. If either is missing,
stop now and tell the user to install ai-i18n-tools as a dev dependency and
run `ai-i18n-tools init -P <provider>`, then run this prompt again. Do not
install the CLI or initialise the config yourself.

## Rules

- Do not read or search the ai-i18n-tools source. This prompt is complete.
- Never read, print, or write API keys, `.env` files, or the shell environment.
- Do not run `translate-ui`, `suggest-models`, or `sync`. They call the
  translation API and cost money. The user runs them after reviewing your work.
- Do not translate, reword, or rename source text. Do not edit generated files
  (`strings.json`, per-locale JSON, `ui-languages.json`).
- Do not introduce semantic keys (`saveButton`, `nav.home`). The literal in
  `t("…")` is the source-language sentence and the catalog key.
- Do not reformat unrelated code. Keep existing blank lines. Run the project's
  formatter and linter at the end. Leave unrelated edits in a dirty tree alone.
  Delete throwaway scripts and do not commit them.

## Part 1 — Runtime

Skip a piece of this part when it is already done.

1. Install `i18next` with the project's package manager. Install
   `react-i18next` only when a component uses `useTranslation()`.
2. Run `ai-i18n-tools extract` once. It writes `strings.json` and
   `ui-languages.json` even when it finds no `t()` calls, so the app compiles.
   Expect 0 strings, or 1 when `package.json` has a `description`
   (`ui.uiExtractor.includePackageDescription` is on by default).
3. Add the bootstrap below. Put it where this repository keeps its app code,
   and point the JSON imports at `ui.stringsJson`, `ui.flatOutputDir`, and
   `languagesManifestPath` when that key is set. `SOURCE_LOCALE` must equal
   config `sourceLocale`, character for character. The sample uses `en-GB`
   only as the shape.
4. Import the bootstrap from the app entry before the first render. In
   Next.js, import it from a client module. Do not call `changeLanguage` on a
   shared i18next instance inside a server component. Concurrent requests
   share that singleton. Use a per-request `createInstance()`, or a stateless
   lookup of the flat bundle.

Not using React? Drop the `react-i18next` import and the `.use(initReactI18next)` call.

```js
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

For JSON under `public/`, the loader fetches `/locales/<code>.json` and
parses the response. For a Node CLI with no bundler, read the file with
`readFileSync` inside that function. A call that uses `{ plurals: true, count }`
also needs the
source-locale flat file under `flatOutputDir`. That file does not exist until
the user runs `translate-ui`, so leave `sourcePluralFlatBundle` out and name
the plural calls in the report.

## Part 2 — Wrap strings

The literal in `t("…")` is the source-language sentence and the catalog key.
With the source locale active, the app must behave exactly as before. Text
that is already wrapped needs no change.

Read `ui.sourceRoots` and edit only those trees (JS, JSX, TS, TSX). Leave
`className`, URLs and routes, import paths, ids, test ids, enum and error
codes, object keys used as identifiers, log field names, CSS, regexes, and
comments.

- React components: `const { t } = useTranslation()` and `{t("Save")}`.
- Module-level constants and non-React files: `i18n.t("…")`. A constant that
  would call `t()` at import time must move into a function or
  `useMemo(..., [t])`, so `t()` runs after the locale loads.
- Placeholders: `t("Hello {{name}}", { name })`. The argument must be a string
  literal. `t(variable)` and a template literal as the key are not extracted.
- Plurals: `t("{{count}} items", { plurals: true, count })`. Do not invent
  `_one` / `_other` keys.
- One `t()` per sentence. Split only where the text already branches.

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

Work in passes: list string literals that are not passed to `t` or `i18n.t`,
wrap the user-facing ones, then list again. Treat any bulk rewrite as a draft
and review its diff. Then run `ai-i18n-tools extract` again.

## Part 3 — Language switch

Skip this part only when the program shows no text a person reads, or when the
user asked you to leave language choice out. A command-line program still gets
this part: a language option, not a widget.

Goal: one chosen language applies to every `t()` in that run, and a screen can
remember the choice. Accept only codes listed in `ui-languages.json`.

- Restore a saved locale before the first render, then draw a control labelled
  `t("Language")` whose options come from that manifest. On change, call
  `await loadLocale(code)` and then `await i18n.changeLanguage(code)`.
- In Next.js, reading `localStorage` in an effect after hydration paints the
  source locale first. Prefer a cookie the server can read, or load the saved
  locale in the client module before the first client render. Do not call
  `changeLanguage` on a shared instance inside a server component.
- A CLI: add `--lang <code>` and `-L <code>` unless those names are taken.
  Read the option before help text is built, so help can be translated too.
  After the option, read a language environment variable the app already owns.
  Do not read `AI_I18N_LANG`. Then the source locale.

## Verify and report

The project's build, type check, and tests pass. `extract` writes a non-empty
catalog of the sentences you wrapped. With the source locale, the output is
unchanged.

Report the files changed, each string you skipped with a one-line reason, the
same word used with different meanings, sentences built from translated pieces,
plurals that still need `sourcePluralFlatBundle` after the user translates,
and any `t()` that runs at import time. Then list the commands for the user,
and do not run them: `ai-i18n-tools suggest-models` (optional),
`ai-i18n-tools translate-ui`, then reload the app.
````

<a id="review-the-result"></a>
## 審查結果

代理程式結束時會產生一份報告。在翻譯之前檢查它：

- 差異。包裝後的文字應與之前相同，沒有不相關的重新格式化。`git diff --stat` 顯示了多少內容已更改。啟動程式、其匯入、包裝的呼叫和語言切換是預期的編輯。
- 生成的目錄（`strings.json`、每個語言環境的 JSON、`ui-languages.json`）除了 `extract` 寫入的內容外，未經觸動。
- `ai-i18n-tools extract` 執行正常，且 `strings.json` 列出了您預期的句子。
- 您的測試通過，且應用程式在原始語言中看起來相同。
- 報告中跳過的字串和模糊不清的情況：一個詞語用於不同的含義、由片段組成的句子以及複數。請手動決定這些。
- 啟動程式中的 `SOURCE_LOCALE` 等於配置中的 `sourceLocale`。

代理程式遺漏的字串稍後會顯示為保留在原始語言中的文字。

<a id="choose-models-and-translate"></a>
## 選擇模型並翻譯

由您執行此部分。它使用您的 API 金鑰並在您的帳戶上花費金錢。

來自 `init` 的模型列表是一個起點。對目前啟用提供者的聊天模型進行排序，當候選清單看起來正確時，將其寫入 `translationModels`：

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` 僅替換 `translationModels`。相同的排名位於 `ai-i18n-tools dashboard` 的[模型](/zh-Hant/guide/translation-dashboard/models)分頁上。

然後提取並翻譯：

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
ai-i18n-tools status
```

`extract` 寫入 `strings.json` 和 `ui-languages.json`。`translate-ui` 在 `ui.flatOutputDir` 下為每個目標語言寫入一個 JSON 檔案。讓這些生成的檔案保持未編輯狀態。當 `features.translateUIStrings` 開啟時，`sync` 會同時執行 `extract` 和 `translate-ui`。`extract` 掃描和寫入的內容：[UI 字串，步驟 2](/zh-Hant/guide/ui-strings/#step-2-extract-strings)。

`t()` 在語言環境 JSON 中查找原始句子。`strings.json` 中的 ID 不是查找鍵。缺少檔案或缺少鍵會返回原始句子。

<a id="check-one-language"></a>
### 檢查一種語言

重新載入應用程式，切換到一個目標語言，然後開啟一個包含一些包裝字串的畫面。使用代理程式新增的語言切換，或自己呼叫 `loadLocale` 和 `changeLanguage`。仍然保留在原始語言中的文字未被包裝、在匯入時執行，或在語言環境 JSON 中沒有條目。在懷疑程式碼之前，請檢查 JSON 中的句子。

當包裝的呼叫使用 `{ plurals: true, count }` 時，請加入原始語言環境的平面檔案，以便複數形式得以解析。這會從 `flatOutputDir` 匯入 `{sourceLocale}.json`，並加入一個 `sourcePluralFlatBundle` 選項，如[連結 i18next](/zh-Hant/guide/ui-strings/i18next-runtime)中所示。

<a id="keep-it-translated"></a>
## 保持翻譯更新

更改原始文字後，重新執行 `ai-i18n-tools sync`（或先執行 `extract` 再執行 `translate-ui`）。快取表示只有新增或變更的字串會傳送至模型。從 [建議的 package.json 指令碼](/zh-Hant/guide/quick-start#recommended-packagejson-scripts) 新增指令碼，並在 CI 中執行 `sync`，以避免翻譯偏離。翻譯執行後重新載入應用程式，以便它能讀取新的 JSON。`ai-i18n-tools dashboard` 會開啟 [翻譯儀表板](/zh-Hant/guide/translation-dashboard/) 以供審閱翻譯。

預設的 `init` 範本也會列出 `README.md`。在 `sync` 翻譯之前貼上語言清單標記。請參閱 [將 i18n 新增至您的 README 和 Markdown 文件](/zh-Hant/guide/add-i18n-to-readme)。

<a id="do-it-by-hand"></a>
## 手動操作

如果您偏好自行進行變更，或想了解提示的作用，請按照這些步驟操作。這些步驟與提示的各部分相符。最後您仍然需要 [安裝 CLI](#install-and-choose-a-provider)、[初始化專案](#initialise-the-project) 和 [翻譯](#choose-models-and-translate)。

1. [安裝執行階段程式庫](#step-1-install-the-runtime-libraries)。
2. [一次性擷取並新增啟動程式](#step-2-extract-once-and-add-the-bootstrap)。
3. 在 `t()` 或 `i18n.t()` 中 [包裝字串](#step-3-wrap-strings)。
4. [新增語言切換器](#step-4-add-a-language-switch)。

<a id="step-1-install-the-runtime-libraries"></a>
## 步驟 1：安裝執行階段程式庫

ai-i18n-tools 不依賴 `i18next` 或 `react-i18next`。應用程式會自行安裝它們。

- 每個在執行階段查詢字串的 JS/TS 應用程式：`i18next`。
- 呼叫 `useTranslation()` 的 React 元件：也需要 `react-i18next`。

```bash
pnpm add i18next
# React components:
pnpm add react-i18next
```

<a id="step-2-extract-once-and-add-the-bootstrap"></a>
## 步驟 2：一次性擷取並新增啟動程式

啟動程式會匯入 `strings.json` 和 `ui-languages.json`，且只有 `extract` 會寫入它們。即使找不到 `t()` 呼叫，它也會寫入兩者，以便應用程式編譯。

```bash
ai-i18n-tools extract
```

預期為 0 個字串，如果您的 `package.json` 包含 `description`，則為 1 個字串，因為擷取器預設會包含它 (`ui.uiExtractor.includePackageDescription`)。

建立 i18n 設定檔。此版本足以包裝字串並翻譯它們。在 `ai-i18n-tools.config.json` 中，`SOURCE_LOCALE` 必須等於 `sourceLocale`。調整匯入路徑，使其與 `ui.stringsJson` 和 `ui.flatOutputDir` 相符。

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

對於 `public/` 下的 JSON 捆綁包，載入器會擷取 `/locales/${code}.json`。對於沒有捆綁器的 Node CLI，請使用 `readFileSync` 讀取檔案。這兩種形式都在 [地區設定載入器](/zh-Hant/guide/ui-strings/i18next-runtime#locale-loaders) 中。

在首次渲染前，從應用程式的進入點匯入此檔案。在 Next.js 中，請從用戶端模組匯入，模式與 [examples/nextjs-app/src/lib/i18n.ts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/src/lib/i18n.ts) 相同。

<a id="step-3-wrap-strings"></a>
## 步驟 3：包裝字串

`t()` 的引數是使用者應該看到的原始語言句子。平面地區設定檔案以該句子作為鍵。

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

再次執行 `ai-i18n-tools extract`。目錄現在應該會列出您包裝的句子。

<a id="step-4-add-a-language-switch"></a>
## 步驟 4：新增語言切換功能

在首次渲染之前還原已儲存的地區設定，如 [連接 i18next](/zh-Hant/guide/ui-strings/i18next-runtime#startup-locale) 中所述。然後新增一個控制項，依序呼叫 `await loadLocale(code)` 和 `await i18n.changeLanguage(code)`。從 `ui-languages.json` 建立選項。小工具、標籤和從右到左的佈局：[語言切換器和 RTL](/zh-Hant/guide/ui-strings/language-switcher)。

命令列程式沒有小工具。新增 `--lang <code>` (如果該名稱可用，則新增 `-L`)，然後新增應用程式已擁有的語言環境變數。不要讀取 `AI_I18N_LANG`；該變數僅適用於 ai-i18n-tools CLI。僅接受 `ui-languages.json` 中列出的代碼。

當程式未顯示任何供人閱讀的文字時，請跳過此步驟。

這是最後一個手動步驟。請繼續閱讀 [選擇模型並翻譯](#choose-models-and-translate)。

<a id="coming-from-another-tool"></a>
## 從其他工具遷移

ai-i18n-tools 包含其自有的字串擷取器。如果您曾使用 `i18next-scanner`、`babel-plugin-i18next-extract` 或類似工具，可以在遷移後移除這些開發依賴項目。現有的 i18next 命名空間 JSON 檔案可以保留在 [JSON 管線](/zh-Hant/guide/json#i18next-namespace-files) 上。Intlayer `.content.ts` 字典可以使用 `migrate-intlayer` 匯入：請參閱 [從 Intlayer 遷移](/zh-Hant/guide/migrating-from-intlayer)。若要在執行階段保留 Intlayer 並僅填入其翻譯，請使用 `translate-intlayer`：請參閱 [就地翻譯 Intlayer](/zh-Hant/guide/translating-intlayer)。

<a id="not-your-case"></a>
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
| Django、Flask-Babel 目錄，或已使用 GNU gettext 的應用程式 | [將 i18n 新增至 Django / Python gettext 應用程式](/zh-Hant/guide/add-i18n-to-django-gettext) |
| 儲存庫 README 或其他 Markdown 檔案 | [為您的 README 和 Markdown 文件新增 i18n](/zh-Hant/guide/add-i18n-to-readme) |

<a id="examples"></a>
## 範例

| 範例 | 說明 |
| --- | --- |
| [console-app](/zh-Hant/examples#console-app) | 最小的 Node 應用程式，`t()` 已包裝，加上一個 README 區塊 |
| [nextjs-app](/zh-Hant/examples#nextjs-app) | React 啟動程式、複數形式、文件網站，以及一個 README 區塊 |

使用 `npx degit` 複製一個。指令：[範例](/zh-Hant/examples#nodejs-examples)。
