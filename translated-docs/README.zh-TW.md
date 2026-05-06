<a id="ai-i18n-tools"></a>
# ai-i18n-tools

[![npm 版本](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![npm 下載次數](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/)
[![授權許可：MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

用於國際化 JavaScript/TypeScript 應用程式和文件網站的 CLI 與工具包。透過 OpenRouter 使用大型語言模型提取 UI 字串並進行翻譯，並為 i18next 生成符合語系格式的 JSON 檔案。針對文件內容，它會翻譯 `contentPaths` 底下的 Markdown 和 MDX 檔案（讀者所開啟的本地化頁面）。選用的 Docusaurus 標籤 JSON 來自 `jsonSource`，用以處理網站外殼字串（如 `write-translations` 目錄中的主題、導覽列、頁尾等），與頁面主內容分開處理。SVG 檔案的翻譯則使用 `features.translateSVG` 和頂層的 `svg` 區塊。

<small>**以其他語言閱讀：** </small>
<small id="lang-list">[English (GB)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [中文 (中国大陆)](./README.zh-CN.md) · [中文 (台灣)](./README.zh-TW.md)</small>

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**目錄**

- [兩個核心工作流程](#two-core-workflows)
- [安裝](#installation)
  - [使用 CLI](#using-the-cli)
- [OpenRouter](#openrouter)
- [快速開始](#quick-start)
  - [工作流程 1 - UI 字串](#workflow-1---ui-strings)
  - [工作流程 2 - 文件](#workflow-2---documentation)
  - [兩個工作流程](#both-workflows)
- [執行階段輔助工具](#runtime-helpers)
- [CLI 指令](#cli-commands)
- [文件](#documentation)
- [授權](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="two-core-workflows"></a>
## 兩個核心工作流程

**工作流程 1 - UI 翻譯**（React、Next.js、Node.js、任何 i18next 專案）

從 `t("…")` / `i18n.t("…")` **literals** 建立主目錄 (`strings.json`，包含可選的每區域設定 `models` 元數據)，可選擇性加入 `package.json` `description`，並在設定中啟用時，從 `ui-languages.json` 匯入各個 `englishName`。透過 OpenRouter 翻譯各區域設定中遺漏的項目，並輸出扁平化的 JSON 檔案 (`de.json`、`pt-BR.json` 等)，可直接供 i18next 使用。

**工作流程 2 - 文件翻譯**（Markdown / MDX，可選 Docusaurus 外殼 JSON）

翻譯每個 `documentations` 區塊中 `contentPaths` 的 `.md` 與 `.mdx` — 也就是本地化的文件內容。當設定 `features.translateJSON` 與 `jsonSource` 時，也會翻譯 Docusaurus **標籤 JSON**（來自 `write-translations` 的導覽列、頁尾、主題/外掛 UI），但不包含 MDX 主體文字。支援依區塊設定 Docusaurus 風格或扁平式語系後綴的目錄結構（`documentations[].markdownOutput`）。共用的根目錄 `cacheDir` 儲存 SQLite 快取，因此僅有新增或變更的片段會傳送至 LLM。**SVG：** 啟用 `features.translateSVG`，加入頂層 `svg` 區塊，然後使用 `translate-svg`（若兩者皆設定，也可從 `sync` 執行）。

這兩種工作流程共用單一的 `ai-i18n-tools.config.json` 檔案，可獨立或同時使用。SVG 檔案翻譯使用 `features.translateSVG` 搭配頂層 `svg` 區塊，並透過 `translate-svg`（或 `sync` 內的 SVG 階段）執行。

---

<a id="installation"></a>
## 安裝

發布的套件僅支援 **ESM**（`"type": "module"`）。請從 Node.js、打包工具或 `import()` 使用 `import` — `require('ai-i18n-tools')` **不受支援**。此套件宣告了 `engines.node` `>=22.16.0`；較舊的 Node.js 版本不受支援。

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
```

<a id="using-the-cli"></a>
### 使用 CLI

**依專案安裝（建議）** — 作為相依性或開發相依性安裝，然後透過 `npx`、`pnpm exec` 或 `package.json` 指令碼呼叫：

```bash
pnpm add -D ai-i18n-tools     # or: npm i -D ai-i18n-tools
npx ai-i18n-tools sync        # or: pnpm exec ai-i18n-tools sync
```

```json
"scripts": {
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate": "ai-i18n-tools translate-docs"
}
```

套件管理工具會在 Linux 和 macOS 上以正確的權限寫入 `node_modules/.bin/ai-i18n-tools`，並在 Windows 上建立 `.cmd` / `.ps1` shim；指令碼執行器會自動偵測。

**終端機中的** `ai-i18n-tools` **：** `package.json` 已經在 `PATH` 上以 `node_modules/.bin` 執行，因此像 `pnpm run i18n:sync` 這樣的命令可以直接呼叫 CLI，而無需輸入 `npx`。若要在互動式殼層中直接執行 `ai-i18n-tools`（在本機安裝後，從專案根目錄執行），請將本機的 bin 目錄前置到 `PATH`：

```bash
# bash/zsh — project root
export PATH="$PWD/node_modules/.bin:$PATH"
ai-i18n-tools sync
```

```powershell
# Windows PowerShell — project root
$env:Path = "$PWD\node_modules\.bin;$env:Path"
ai-i18n-tools sync
```

使用 [**direnv**](https://direnv.net/)，在專案根目錄中添加 `PATH_add node_modules/.bin` 到 `.envrc`，以便在 `cd` 進入倉庫後可以使用基本命令。無需調整 `PATH`，繼續使用 `npx ai-i18n-tools …` 或 `pnpm exec ai-i18n-tools …`。

**免安裝一次性執行** — 使用 `npx ai-i18n-tools <cmd>` 或 `pnpm dlx ai-i18n-tools <cmd>`（僅針對此次執行下載套件；不會寫入 `package.json`）。

在 Linux、macOS 和 WSL 上，註冊表安裝會自動為 CLI 指令碼設定可執行權限。在 Windows 上，套件管理工具會產生 `.cmd` 和 `.ps1` shim 來明確呼叫 Node。

設定您的 OpenRouter API 金鑰：

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

<a id="openrouter"></a>
## OpenRouter

呼叫 OpenRouter 的指令（`translate-ui`、`translate-docs`、`sync`、`check-models` 及相關腳本）需要在環境中設定 `OPENROUTER_API_KEY`。`check-markdown` 不使用 OpenRouter。

在 `ai-i18n-tools.config.json` 中，`openrouter` 物件包含模型列表、`baseUrl`、`maxTokens`、`temperature` 以及 `requestTimeoutMs`：表示對 OpenRouter 的每個 HTTP 請求（聊天完成和內部 `GET /models` 呼叫）等待的最長時間（毫秒）。預設值為 `30000`（30 秒）。

執行 `ai-i18n-tools check-models` 以根據 OpenRouter 的即時目錄驗證每個已設定的模型 ID。此命令會報告遺失或已過期的 ID `expiration_date`，列出有效模型及其估計的輸入/輸出價格（每百萬 tokens 的美元價格），並在任何已設定的 ID 無效時以非零狀態碼結束。此操作需要 `OPENROUTER_API_KEY`。

---

<a id="quick-start"></a>
## 快速開始

<a id="workflow-1---ui-strings"></a>
### 工作流程 1 - UI 字串

```bash
# 1. Create config
npx ai-i18n-tools init

# 2. Extract UI strings to strings.json (t(…) literals + optional package.json / manifest strings)
npx ai-i18n-tools extract

# 3. Translate to all target locales
npx ai-i18n-tools translate-ui
```

在您的應用程式中使用來自 `'ai-i18n-tools/runtime'` 的輔助工具來整合 i18next：

```js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import uiLanguages from './locales/ui-languages.json';
import stringsJson from './locales/strings.json';
// Plural flat: ./public/locales/{SOURCE_LOCALE}.json — must match config sourceLocale
import sourcePluralFlat from './public/locales/en-GB.json';
import aiI18n from 'ai-i18n-tools/runtime';

// Must match sourceLocale in ai-i18n-tools.config.json
export const SOURCE_LOCALE = 'en-GB';

void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));
aiI18n.setupKeyAsDefaultT(i18n, {
  stringsJson,
  sourcePluralFlatBundle: { lng: SOURCE_LOCALE, bundle: sourcePluralFlat },
});
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

<a id="workflow-2---documentation"></a>
### 工作流程 2 - 文件

```bash
# 1. Create config for Docusaurus
npx ai-i18n-tools init -t ui-docusaurus

# 2. Translate all docs
npx ai-i18n-tools translate-docs

# 3. Check status
npx ai-i18n-tools status
```

<a id="both-workflows"></a>
### 兩種工作流程

```bash
npx ai-i18n-tools sync   # Extract UI strings, then translate UI strings, SVG, and docs
```

---

<a id="runtime-helpers"></a>
## 執行階段輔助工具

以下輔助函數從 `'ai-i18n-tools/runtime'` 匯出，可在任何 JavaScript 環境中使用。您不需要匯入 i18next 即可使用它們：

| 輔助工具 | 說明 |
|---|---|
| `defaultI18nInitOptions(sourceLocale)` | 用於「鍵值即預設值」設定的標準 i18next 初始化選項。 |
| `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` | 建議的串接方式：從 `strings.json` 取得 key-trim + 複數 `wrapT`，可選擇性合併 `translate-ui` `{sourceLocale}.json` 的複數鍵。 |
| `wrapI18nWithKeyTrim(i18n)` | 僅為較低階的 key-trim 包裝器 (應用程式串接已不建議使用；請改用 `setupKeyAsDefaultT`)。 |
| `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, makeLoader)` | 從 `ui-languages.json` 建立 `localeLoaders` 對應表以供 `makeLoadLocale` 使用 (包含所有 `code`，除了 `sourceLocale`)。 |
| `makeLoadLocale(i18n, loaders, sourceLocale)` | 用於非同步載入語系檔案的工廠函式。 |
| `getTextDirection(lng)` | 根據 BCP-47 編碼回傳 `'ltr'` 或 `'rtl'`。 |
| `applyDirection(lng, element?)` | 在 `document.documentElement` 上設定 `dir` 屬性。 |
| `getUILanguageLabel(lang, t)` | 語言選單列的顯示標籤（包含 i18n）。 |
| `getUILanguageLabelNative(lang)` | 不呼叫 `t()` 的顯示標籤（標頭風格）。 |
| `interpolateTemplate(str, vars)` | 在純字串上進行低階 `{{var}}` 替換（內部使用；應用程式碼應改用 `t()`）。 |
| `flipUiArrowsForRtl(text, isRtl)` | 將 `→` 翻轉為 `←` 以支援由右至左（RTL）的版面配置。 |

---

<a id="cli-commands"></a>
## CLI 指令

```text
ai-i18n-tools version                               Print version and build timestamp
ai-i18n-tools help [command]                        Show global or per-command help (same as -h)
ai-i18n-tools init [-t ui-markdown|ui-docusaurus] [-o path] [--with-translate-ignore]   Create config file
ai-i18n-tools check-models                          Validate configured OpenRouter model ids against GET /models (pricing, expiration); requires OPENROUTER_API_KEY
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]   Build ui-languages.json from locales + master catalog (needs uiLanguagesPath)
ai-i18n-tools extract                               Merge scanner output, optional package.json description, optional manifest englishName into strings.json
ai-i18n-tools translate-docs …                      Translate documentation: markdown/MDX from contentPaths; optional Docusaurus label JSON from jsonSource. Flags include -l/--locale <codes>, -p/-f path, --dry-run,
                                                    --force, --force-update, --stats, --clear-cache, --type, --json-only, --no-json, -j, -b,
                                                    --prompt-format, --emphasis-placeholders, --no-emphasis-placeholders, --debug-failed
ai-i18n-tools write-heading-ids …                   Insert HTML anchor lines before ATX headings in .md/.mdx (documentations[])
ai-i18n-tools strip-md-bold-inline …              Remove bold (**) around inline code in markdown/MDX (documentations[])
ai-i18n-tools check-markdown [-p|--path <path>] [--json] [--no-cache]   Scan documentation markdown for delimiter / inline-code issues and strong-outside-code or strong-outside-link patterns; refresh SQLite markdown_source_issues; exit 1 if any issue
ai-i18n-tools translate-svg …                        SVG files (features.translateSVG + config.svg); flags include -l/--locale <codes>,
                                                    -p/-f path, --dry-run, --force, --force-update, --no-cache, -j, -b
ai-i18n-tools translate-ui …                        Translate UI strings only; flags include -l/--locale <codes>, --dry-run, --force, -j
ai-i18n-tools lint-source …                         Run extract, then LLM review of source-locale UI strings (OpenRouter)
ai-i18n-tools export-ui-xliff …                   Export UI strings to XLIFF 2.0 (one file per locale); -l, -o, --untranslated-only, --dry-run
ai-i18n-tools sync …                                Extract, then UI / SVG / docs; flags include -l/--locale <codes>, -p/-f path, --dry-run, --force,
                                                    --force-update, --no-ui, --no-svg, --no-docs, -j, -b, --emphasis-placeholders,
                                                    --no-emphasis-placeholders, --debug-failed
ai-i18n-tools status [--max-columns <n>]   UI strings per locale; markdown per file × locale in tables of up to n locales (default 9)
ai-i18n-tools statistics [--max-columns <n>]        Documentation cache + strings.json aggregates (same as editor Statistics)
ai-i18n-tools editor                                Open cache/glossary web editor
ai-i18n-tools cleanup [--dry-run] [--no-backup] [--backup <path>]   Runs sync --force-update, then cleans stale + orphaned cache rows; backs up SQLite by default
ai-i18n-tools clean-temp [-r|--root <path>] [-f|--force] [--dry-run]   List *.log and cache.db.backup*.sqlite; delete after `y`, with `-f`, or skip if none match
ai-i18n-tools glossary-generate                     Create empty glossary CSV template
```

每個指令的完整旗標列表與 `src/cli/index.ts` 一同維護於[依指令分類的 CLI 旗標](docs/GETTING_STARTED.zh-TW.md#cli-flags-by-command)。執行 `ai-i18n-tools <command> --help` 以顯示內建的使用說明文字。

每個指令皆支援的全域選項：`-c <config>`（預設值：`ai-i18n-tools.config.json`）、`-v`（詳細輸出）、選擇性使用 `-w` / `--write-logs [path]` 將主控台輸出同時寫入日誌檔案（預設儲存於翻譯快取目錄下）、`-V` / `--version`，以及 `-h` / `--help`。指令總覽表請見[開始使用](docs/GETTING_STARTED.zh-TW.md#cli-reference)。

---

<a id="documentation"></a>
## 文件

- [快速入門](docs/GETTING_STARTED.zh-TW.md) - 兩種工作流程的完整設定指南、CLI 參考與設定欄位參考。
- [套件總覽](docs/PACKAGE_OVERVIEW.zh-TW.md) - 架構、內部機制、程式化 API 與擴充點。
- [AI Agent 情境](../docs/ai-i18n-tools-context.md) - **適用於使用此套件的應用程式：** 供下游專案使用的整合提示詞（複製至您儲存庫的 Agent 規則中）。
- 針對 **此** 儲存庫的維護者內部資訊：`dev/package-context.md`（僅限 clone；未發布至 npm）。

---

<a id="license"></a>
## 授權條款

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br)
