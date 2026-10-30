<a id="add-i18n-to-a-website-or-docs-site"></a>
# 為網站或文件網站新增 i18n

本頁說明如何將只有單一語言的文件網站（Markdown 或 MDX）或行銷或靜態網站（Astro 網站或純 HTML）新增語系，並使用 ai-i18n-tools 進行處理。此工具會使用您 LLM 供應商的模型翻譯頁面內容，並為每種語言寫入一份本地化副本。您的網站框架會提供這些副本並提供語言切換器。

最快的方法是將本頁上的提示提供給程式碼代理程式。它會啟用該框架的 i18n 並檢查組態。您需要自行安裝 CLI、選擇供應商並初始化專案，因為這需要您的 API 金鑰和您的選擇。您也需要自行執行翻譯，因為這會花費您帳戶中的費用。

對於 UI 字串位於 `t()` 呼叫中的應用程式，請使用 [將 i18n 新增至 JS/TS 應用程式](/zh-Hant/guide/add-i18n-to-js) 或 [將 i18n 新增至 Python 應用程式](/zh-Hant/guide/add-i18n-to-python)。沒有網站框架的儲存庫 README 則使用 [將 i18n 新增至您的 README 和 Markdown 文件](/zh-Hant/guide/add-i18n-to-readme)。不確定哪種適用？請參閱結尾的 [不適用於您的情況？](#not-your-case)。

<a id="steps"></a>

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

將套件安裝為開發依賴項。VitePress 組態會從 `ai-i18n-tools` 匯入 `prefixVitepressThemeConfigLinks`，而純 HTML 頁面則從套件複製 `i18n.js`。只有當網站從未匯入 `ai-i18n-tools/runtime` 且從未從其組態匯入套件時，獨立可執行檔才足夠。其他安裝選項：[安裝](/zh-Hant/guide/installation)。

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

您在提示之前執行此操作一次。它會寫入 `ai-i18n-tools.config.json` 並使用您上面選擇的供應商。它不會在現有網站中開啟 i18n。那是提示。

| 您的網站 | 初始化範本 | 詳細資訊指南 |
| --- | --- | --- |
| Astro Starlight | `ui-starlight` | [Astro](/zh-Hant/guide/integrations/astro) |
| Docusaurus | `ui-docusaurus` | [Docusaurus](/zh-Hant/guide/integrations/docusaurus) |
| VitePress | `ui-vitepress` | [VitePress](/zh-Hant/guide/integrations/vitepress) |
| Nextra 4 (Next.js App Router) | `ui-nextra` | [Nextra](/zh-Hant/guide/integrations/nextra) |
| Fumadocs 4 (Next.js App Router) | `ui-fumadocs` | [Fumadocs](/zh-Hant/guide/integrations/fumadocs) |
| 純 Astro 網站 | `ui-astro-website` | [Astro](/zh-Hant/guide/integrations/astro#plain-astro-marketing-and-app-sites) |
| 在瀏覽器中切換語言的單一 HTML 檔案 | `ui-plain-html` | [純 HTML 應用程式](/zh-Hant/guide/ui-strings/plain-html) |
| 每個語系一個翻譯的 HTML 檔案 | `docs-plain-html` | [HTML 頁面](/zh-Hant/guide/documents/html-pages) |
| 沒有網站框架，只有 README 和 Markdown 檔案 | `docs-markdown`，或任何範本加上 `--with-readme` | [為您的 README 和 Markdown 文件新增 i18n](/zh-Hant/guide/add-i18n-to-readme) |

```bash
ai-i18n-tools init -t ui-vitepress -P openrouter
```

將表格中的範本替換為 `ui-vitepress`。然後編輯 `sourceLocale`、`targetLocales` 和 `docs[].contentPaths`。`sourceLocale` 是頁面的語言。任何 BCP-47 語言都有效。`contentPaths` 必須是使用該語言撰寫的頁面和資料夾。範本中的路徑是起始點。`docsOutput.style` 已為範本設定。`ui-astro-website` 和 `ui-plain-html` 會寫入一個 `ui` 區塊和一個空的 `docs` 陣列。當您翻譯頁面 HTML 時，提示會為純 Astro 網站新增一個頁面 HTML `docs` 區塊。

執行 `init` 一次。它每次都會重寫 `ai-i18n-tools.config.json`，因此第二次執行會捨棄您所做的編輯。

<a id="run-the-agent-prompt"></a>
## 執行代理程式提示

在您的程式碼代理程式（Cursor、Claude Code、Copilot 或類似工具）中開啟專案，開始新的聊天，並貼上以下提示。專案必須已經初始化。沒有什麼需要編輯的。如果您希望省略框架的某些細節，請在同一訊息中說明。

代理程式首先檢查 CLI 和組態是否存在，如果缺少其中一個，則會停止並提供指示。然後它會偵測框架並啟用該框架的語系路由。它不會安裝 CLI、初始化組態、讀取您的 API 金鑰或進行翻譯。翻譯是審查之後的步驟，由您執行。

````markdown
# Enable i18n on this website or docs site

## Before you start

The user must already have installed ai-i18n-tools and initialised this
project. Check that `ai-i18n-tools --version` runs (or
`pnpm exec ai-i18n-tools --version` when the binary is only in
`node_modules/.bin`) and that
`ai-i18n-tools.config.json` exists. If either is missing, stop now and tell
the user to install ai-i18n-tools as a dev dependency and run
`ai-i18n-tools init -t <template> -P <provider>`, then run this prompt again.
The template is `ui-vitepress`, `ui-docusaurus`, `ui-starlight`, `ui-nextra`,
`ui-fumadocs`, `ui-astro-website`, `ui-plain-html`, or `docs-plain-html`.
Do not install or initialise anything yourself.

`ui-plain-html` and `ui-astro-website` are valid when `docs` is empty. Every
other template needs one `docs` entry. If that entry is missing, stop and name
the init command.

## Rules

- Do not read or search the ai-i18n-tools source. This prompt is complete.
- Never read, print, or write API keys, `.env` files, or the shell environment.
- Do not run `sync`, `translate-docs`, `translate-ui`, or `suggest-models`.
  They call the translation API and cost money. The user runs them after
  reviewing your work.
- Do not translate, reword, or rename source pages, nav labels, or dictionary
  strings. Do not edit generated locale trees (`docs/<locale>/`,
  `i18n/<locale>/` other than the source catalog from `write-translations`,
  `theme.<locale>.json`, `content/<locale>/`, locale MDX, or locale HTML).
- Do not reformat unrelated code. Leave unrelated edits in a dirty tree alone.
- Apply one branch. If the framework is unclear, stop and ask.

Detect the branch from `docsOutput.style`, then from the config file and
`package.json`: `vitepress`, `docusaurus`, `nextra`, `fumadocs`,
`astro-starlight` with pages under `src/content/docs` (Starlight), `nested`
with HTML `contentPaths` (`docs-plain-html`), a `ui` block whose extractor
extensions include `.html` (`ui-plain-html`), or an Astro site that is not
Starlight (`ui-astro-website`).

Point `contentPaths` and `docsRoot` at the source-language pages that exist
in this repository. The paths written by `init` are starters.

## VitePress

- In `.vitepress/config`, set `locales.root` for the source locale (`label`,
  `lang`, and the existing `themeConfig`). Add one `locales[code]` per
  `targetLocales` entry: `label`, `lang`, `link: '/<code>/'`, and per-locale
  `title` / `description`. Keep `targetLocales` equal to those keys.
- Author nav and sidebar links once, without a locale prefix. Prefix `link`
  and `activeMatch` per locale with `prefixVitepressThemeConfigLinks` from
  `ai-i18n-tools`. `translate-docs` does not rewrite links inside the config.
- Leave `docsOutput.vitepressThemeCatalog` as `init` wrote it. If the config
  already loads `theme.en.json`, keep that loader and add `locales[code]` the
  same way. If theme strings are still inline, leave them inline. Do not
  create `theme.en.json` or `theme.<locale>.json` yourself, and do not load a
  theme file that is not on disk. The first `sync` bootstraps a missing
  catalog.
- `docsOutput.style` is `vitepress`. `outputDir` is the docs root.

## Docusaurus

- Add the `i18n` block in `docusaurus.config.js`: `defaultLocale`, `locales`
  (source plus each target), and `localeConfigs[locale].path` when the URL
  path differs from the locale code. The path must match the folder under
  `i18n/`.
- Point `docusaurusCatalogDir` at `i18n/<defaultLocale>`. `docsOutput.style`
  is `docusaurus`. `contentPaths` and `docsRoot` are the source docs folder.
  `outputDir` is the parent of the locale folders.
- Run this project's `docusaurus write-translations` so
  `i18n/<defaultLocale>/` exists. That command does not call a model. Do not
  run `sync` or `translate-docs`.
- Custom React in `src/pages` and `src/components` is not markdown. Mark
  user-facing copy with `<Translate>` or `translate()` from
  `@docusaurus/Translate`. The message has to be a static string. Do not wrap
  those calls in `t()`.

## Nextra

- Move source MDX to `content/<sourceLocale>/` (usually `content/en/`). The
  source locale is a folder, not the content root. Leave `_meta.ts` beside
  the pages it labels.
- Set `i18n.locales` and `defaultLocale` in `next.config`. `targetLocales`
  matches `i18n.locales` except the default locale.
- Add an `app/[lang]/` route, `getPageMap('/' + lang)`, and `<Layout i18n>`.
- Add `app/_dictionaries/<source>.ts` (usually `en.ts`) with the English
  chrome as string literals (`siteTitle`, footer, `editLink`, search
  placeholder, table-of-contents title, last-updated label), and
  `get-dictionary.ts` that imports `./${locale}`. Pass those fields into
  `<Layout>`, `<Navbar>`, and `<Footer>`. Keep native language names in a
  labels map, untranslated.
- Config: `features.translateDocs`, `docsOutput.style` `nextra`, `docsRoot`
  `content/<sourceLocale>`, `nextraDictionaryPath` the source dictionary.
- Optional: `proxy.ts` that re-exports `nextra/locales`.
- Do not write `app/_dictionaries/pt-BR.ts`, `content/pt-BR/`, or any other
  locale tree.

## Fumadocs

- `defineI18n` in `lib/i18n.ts` with `languages`, `defaultLanguage`, and
  `parser: "dot"` or `"dir"`. Use `"dot"` unless the source pages already live
  under a locale folder. Set `docsOutput.fumadocsParser` to the same value.
- Add `app/[lang]/` routes. Export `createI18nMiddleware(i18n)` from
  `proxy.ts`.
- Dot: source MDX stays at the collection root (`content/docs/`). Dir: source
  MDX lives under `content/docs/<sourceLocale>/`. Point `contentPaths` and
  `docsRoot` at that source tree. `docsOutput.style` is `fumadocs`.
- `targetLocales` equals `languages` minus the default language, character
  for character.
- Leave English UI overrides as they are. Do not write `ui.<locale>.json` or
  translated MDX. Do not put this catalog in `json[]`.

## Astro Starlight

- In the Starlight config, set `locales`, including a `root` entry when the
  source language should be unprefixed (`label` and required `lang`). Set
  `defaultLocale: 'root'` when that root entry is the source language.
- Source pages stay in `src/content/docs/`. `translate-docs` writes
  `src/content/docs/<locale>/`. Point `contentPaths` at the source pages, not
  at locale folders. `outputDir` and `docsRoot` are `src/content/docs`.
  `docsOutput.style` is `astro-starlight`.
- Align `targetLocales` with the non-root locale keys. Starlight directory
  keys are often lowercase (`pt-br`). If you change case to match, say so in
  the report.
- Prefer sidebar `slug` entries so the label comes from the page title. Do
  not hand-translate sidebar `label` maps or `social[].label`. There is no
  shell catalog to add.

## Plain Astro

- Enable Astro i18n routing: `i18n.locales` includes the source locale and
  each target. Astro route codes are lowercase (`pt-br`). In the report, list
  `targetLocales`, `i18n.locales`, and the note that flat JSON filenames use
  the casing in `targetLocales`.
- `init -t ui-astro-website` leaves `docs` empty and turns on UI strings. When
  page HTML should be translated, set `features.translateDocs` to true and
  append one `docs` entry: `contentPaths` the source pages (for example
  `src/pages/index.astro`), `outputDir` `src/pages`, `addFrontmatter` false,
  `docsOutput.style` `astro-starlight`, `docsRoot` `src/pages`. Leave
  `features.translateUIStrings` as it is.
- If frontmatter or shared data calls `t()`, stop that part and tell the user
  to run the JS/TS prompt and skip i18next. Astro resolves `t` at build time.
  Do not wrap those calls here, and do not install i18next.

## Plain HTML

Each file belongs to only one pipeline. If the same file is both a `docs[]` source and
under `ui.sourceRoots`, stop and ask.

`ui-plain-html` (one page, language switches in the browser):

- Run `ai-i18n-tools mark-html` with no `--write`, read the report, then
  run it again with `--write`. It inserts `data-i18n` markers. It does not
  call a model.
- Copy `node_modules/ai-i18n-tools/dist/html-runtime/i18n.js` next to the page.
  Load it at the end of `<body>` with `data-source-locale` equal to
  `sourceLocale`, `data-locales-base` pointing at `flatOutputDir` as a URL
  relative to the script, and `data-locale-select` pointing at an empty
  `<select>`. Do not add a `docs` block for the same file.

`docs-plain-html` (one HTML file per locale):

- Confirm `contentPaths`, `outputDir`, and `docsRoot`. `docsOutput.style` is
  `nested`. Do not add `data-i18n` markers. Do not fill a language list by
  hand. `translate-docs` writes the locale files and the list.

## Verify and report

The framework's locale config matches `targetLocales`. `contentPaths` point
at source-language pages. No generated locale tree was edited. Run the
project's build or typecheck when it has one, and do not run a translation.

Report the branch you applied, the files changed, and any page you left out
of `contentPaths`, with a one-line reason. Then list the commands for the
user, and do not run them: `ai-i18n-tools suggest-models` (optional),
`ai-i18n-tools sync`, then build the site and open one localised route.
````

<a id="review-the-result"></a>
## 審查結果

代理程式結束時會產生一份報告。在翻譯之前檢查它：

- 差異。它應該是框架語系組態、`contentPaths` 以及分支描述的路由。原始頁面內容應與之前相同。`git diff --stat` 顯示了多少變更。
- `targetLocales` 與框架將提供的語系金鑰相符。
- `contentPaths` 指向原始語言頁面，而不是工具應該寫入的語系資料夾。
- 未編輯任何產生的語系樹：`docs/<locale>/`、語系 HTML、`content/<locale>/`、`theme.<locale>.json`，或 Docusaurus `i18n/<locale>/` 資料夾（來自 `write-translations` 的原始目錄除外）。
- 專案的建置或型別檢查仍然通過。

<a id="choose-models-and-translate"></a>
## 選擇模型並翻譯

由您執行此部分。它使用您的 API 金鑰並在您的帳戶上花費金錢。

來自 `init` 的模型列表是一個起點。對目前啟用提供者的聊天模型進行排序，當候選清單看起來正確時，將其寫入 `translationModels`：

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` 僅替換 `translationModels`。相同的排名位於 `ai-i18n-tools dashboard` 的[模型](/zh-Hant/guide/translation-dashboard/models)分頁上。

然後翻譯並建置：

```bash
ai-i18n-tools sync
```

當 `features.translateDocs` 開啟時，`sync` 會執行 `translate-docs`，當 UI 字串開啟時，則執行 `extract` 加上 `translate-ui`（`ui-plain-html`，以及也使用 `t()` 的純 Astro 網站）。`ai-i18n-tools translate-docs` 會自行執行文件步驟。

<a id="what-gets-translated"></a>
### 翻譯內容

頁面主體會經過 [文件](/zh-Hant/guide/documents/) 管線。框架介面元素（導覽、側邊欄、主題標籤）會在框架支援的相同執行中處理。這不是獨立的 [JSON](/zh-Hant/guide/json) 管線。在瀏覽器中切換語言的純 HTML 頁面是個例外：`mark-html` 和 `translate-ui` 會寫入扁平的 JSON，然後瀏覽器指令碼會套用它。每個語系一個 HTML 檔案會留在文件管線中。

| 框架 | Shell 和佈景主題字串 | 方法 |
| --- | --- | --- |
| Docusaurus | `write-translations` 目錄 (`{ message, description }`) | `docs[].docusaurusCatalogDir` 加上 `translate-docs` |
| VitePress | 佈景主題、導覽和側邊欄目錄 | `docsOutput.vitepressThemeCatalog` 加上 `translate-docs` |
| Nextra | `_meta.ts` 側邊欄標籤 | 使用 `style: "nextra"` 自動處理 |
| Nextra | 佈景主題字典 `.ts` | `docs[].nextraDictionaryPath` |
| Fumadocs | `meta.json` 側邊欄標籤 | 使用 `style: "fumadocs"` 自動處理 |
| Fumadocs | UI 覆寫目錄 | `docsOutput.fumadocsUiCatalog` |
| Astro Starlight | 內建多種語系的 UI 字串 | 僅限頁面 |

`translate-docs` 不會翻譯圖片與螢幕擷取畫面。關於特定語系的檔案，請參閱[圖片與螢幕擷取畫面](/zh-Hant/guide/images-and-screenshots/)。

在第一次 `sync` 之後，有些框架仍然需要設定來載入命令剛寫入的目錄。這些提示會留在整合頁面上：[VitePress 主題目錄](/zh-Hant/guide/integrations/vitepress#wire-configmts-to-generated-theme-json-one-off)、[Nextra 字典](/zh-Hant/guide/integrations/nextra#agent-prompt-dictionary-and-routes) 和 [Fumadocs UI 目錄](/zh-Hant/guide/integrations/fumadocs#agent-prompt)。

<a id="check-one-language"></a>
### 檢查一種語言

建置網站並在瀏覽器中開啟一個本地化路由。框架自己的語系下拉式選單就是切換器。對於在瀏覽器中切換的單一 HTML 檔案，請使用執行階段填入的選取項目。對於每個語系一個 HTML 檔案，請開啟語系資料夾下的檔案。

仍然是原始語言的文字，表示它被排除在 `contentPaths` 之外、是程式碼區塊、URL、標題錨點，或者路由未連接。仍然是原始語言的 VitePress 導覽標籤是主題目錄：請先執行 `sync`，然後如果字串仍然內嵌在設定中，請執行 [主題目錄提示](/zh-Hant/guide/integrations/vitepress#wire-configmts-to-generated-theme-json-one-off)。

<a id="keep-it-translated"></a>
## 保持翻譯更新

原始頁面變更後，請重新執行 `ai-i18n-tools sync`。快取表示只有新的或變更的文字會傳送到模型。提交管線寫入的語系樹狀結構。`ai-i18n-tools dashboard` 會開啟 [翻譯儀表板](/zh-Hant/guide/translation-dashboard/) 以檢閱翻譯。

若要在同一次執行中翻譯 `README.md`，請使用 `--with-readme` 建立架構 (或將該區塊新增至現有設定檔)。請參閱 [為您的 README 和 Markdown 文件新增 i18n](/zh-Hant/guide/add-i18n-to-readme)。

<a id="do-it-by-hand"></a>
## 手動操作

如果您偏好自行進行變更，或想知道提示的作用，請執行這些步驟。您最終仍需 [安裝 CLI](#install-and-choose-a-provider)、[初始化專案](#initialise-the-project) 並 [翻譯](#choose-models-and-translate)。

1. 將 `contentPaths` 和 `docsRoot` 指向原始語言頁面。範本路徑是起點。
2. 啟用框架的語系路由。使用與範本相符的分支。整合頁面有完整的參考資料。

框架從目錄讀取的 Shell 字串會在第一次 `sync` 之後連接。下方每個分支都會連結該後續步驟。

<a id="vitepress"></a>
### VitePress

新增 `locales.root` 和每個目標一個 `locales[code]`，並使用 `prefixVitepressThemeConfigLinks` 作為導覽和側邊欄連結的前綴。將內嵌主題字串留給第一個 `sync`。檢查清單：[在現有網站中啟用 i18n](/zh-Hant/guide/integrations/vitepress#enable-i18n-in-an-existing-site)。在 `sync` 寫入 `theme.<locale>.json` 之後，如果設定中仍然有內嵌字串，請貼上 [主題目錄提示](/zh-Hant/guide/integrations/vitepress#wire-configmts-to-generated-theme-json-one-off)。

<a id="docusaurus"></a>
### Docusaurus

新增 `i18n` 區塊，將 `docusaurusCatalogDir` 指向來源目錄，然後執行 `docusaurus write-translations`。檢查清單：[在現有網站中啟用 i18n](/zh-Hant/guide/integrations/docusaurus#enable-i18n-in-an-existing-site)。Shell JSON：[Shell 字串](/zh-Hant/guide/integrations/docusaurus#shell-strings-write-translations)。

<a id="nextra"></a>
### Nextra

將 MDX 移至 `content/<sourceLocale>/` 下方，新增 `app/[lang]/`，並新增來源字典模組。檢查清單：[在現有網站中啟用 i18n](/zh-Hant/guide/integrations/nextra#enable-i18n-in-an-existing-site)。[字典提示](/zh-Hant/guide/integrations/nextra#agent-prompt-dictionary-and-routes) 是相同連接的較長傳遞。需要 `t()` 的 App React：[混合提示](/zh-Hant/guide/integrations/nextra#optional-t-for-app-react-hybrid)。

<a id="fumadocs"></a>
### Fumadocs

新增 `defineI18n`、`app/[lang]/` 和中介軟體。將 `fumadocsParser` 與 `dot` 或 `dir` 匹配。檢查清單：[在現有網站中啟用 i18n](/zh-Hant/guide/integrations/fumadocs#enable-i18n-in-an-existing-site)。[UI 目錄提示](/zh-Hant/guide/integrations/fumadocs#agent-prompt) 會在路由存在後連接 `i18n.translations()`。

<a id="astro-starlight"></a>
### Astro Starlight

新增 `locales`，包括當原始語言沒有前綴時的 `root`。頁面會留在 `src/content/docs/` 中。檢查清單：[在現有網站中啟用 i18n](/zh-Hant/guide/integrations/astro#enable-i18n-in-an-existing-site)。Starlight 隨附其自己的 UI 字串。偏好 `slug` 側邊欄項目。

<a id="plain-astro"></a>
### Plain Astro

開啟 Astro 的 `i18n.locales`，並且當頁面 HTML 應該被翻譯時，從 [Plain Astro](/zh-Hant/guide/integrations/astro#plain-astro-marketing-and-app-sites) 新增 `docs` 區塊。Frontmatter `t()` 呼叫會使用 [JS/TS 提示](/zh-Hant/guide/add-i18n-to-js#run-the-agent-prompt)，而無需安裝 i18next。Astro 會在建置時解析 `t`。

<a id="plain-html"></a>
### 純 HTML

檔案會歸屬於以下兩種選項之一：

- 瀏覽器中可切換語言的單一頁面：`ui-plain-html`。執行 `ai-i18n-tools mark-html`（試執行，然後 `--write`）並載入 `i18n.js`。請參閱[純 HTML 應用程式](/zh-Hant/guide/ui-strings/plain-html)。
- 每個語言環境一個已翻譯的 HTML 檔案：`docs-plain-html`。請參閱[HTML 頁面](/zh-Hant/guide/documents/html-pages)。

這是最後一個手動步驟。請繼續閱讀 [選擇模型並翻譯](#choose-models-and-translate)。

<a id="not-your-case"></a>
## 情況不同？

| 您有 | 閱讀 |
| --- | --- |
| 應用程式 UI 字串 | [將 i18n 新增至 JS/TS 應用程式](/zh-Hant/guide/add-i18n-to-js) 或 [將 i18n 新增至 Python 應用程式](/zh-Hant/guide/add-i18n-to-python) |
| Django、Flask-Babel 目錄，或已使用 GNU gettext 的應用程式 | [將 i18n 新增至 Django / Python gettext 應用程式](/zh-Hant/guide/add-i18n-to-django-gettext) |
| 網站旁的儲存庫 README，或 Markdown 檔案且沒有網站框架 | [將 i18n 新增至您的 README 和 Markdown 文件](/zh-Hant/guide/add-i18n-to-readme)。`init … --with-readme` 會在網站範本旁新增該區塊 |
| 獨立的巢狀語言環境 JSON | [JSON](/zh-Hant/guide/json) |
| 網站和應用程式字串在一個組態中 | [結合管線](/zh-Hant/guide/combining-pipelines) |

關於共用選項與各框架差異的參考資料：[整合](/zh-Hant/guide/integrations/)。

<a id="examples"></a>
## 範例

| 範例 | 顯示內容 |
| --- | --- |
| [vitepress-docs](/zh-Hant/examples#vitepress-docs) | VitePress 頁面和主題目錄 |
| [docusaurus-docs](/zh-Hant/examples#docusaurus-docs) | Docusaurus 頁面和殼層 JSON |
| [astro-docs](/zh-Hant/examples#astro-docs) | Starlight 頁面 |
| [nextra-docs](/zh-Hant/examples#nextra-docs) | Nextra 4 路由和字典 |
| [fumadocs-docs](/zh-Hant/examples#fumadocs-docs) | Fumadocs 路由和 UI 目錄 |
| [astro-website](/zh-Hant/examples#astro-website) | Astro 登陸頁面、HTML 加上 `t()` |
| [plain-html](/zh-Hant/examples#plain-html) | 單一 HTML 檔案，`data-i18n` 標記 |
| [plain-html-docs](/zh-Hant/examples#plain-html-docs) | 每個語言環境一個 HTML 檔案 |

使用 `npx degit` 複製一個。指令：[範例](/zh-Hant/examples#nodejs-examples)。
