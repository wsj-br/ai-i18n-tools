<a id="ai-i18n-tools"></a>
# ai-i18n-tools

[![npm 版本](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![npm 下載次數](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/)
[![授權許可：MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

用於國際化 JavaScript/TypeScript 應用程式與文件網站的 CLI 及程式化工具包。可提取 UI 字串，透過 OpenRouter 使用 LLM 進行翻譯，並為 i18next 生成符合地區設定的 JSON 檔案，同時提供用於 Markdown、Docusaurus JSON 與獨立 SVG 資源的處理流程。

<small>**以其他語言閱讀：** </small>
<small id="lang-list">[English (GB)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [中文 (中国大陆)](./README.zh-CN.md) · [中文 (台灣)](./README.zh-TW.md)</small>

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**目錄**

- [兩個核心工作流程](#two-core-workflows)
- [安裝](#installation)
- [快速開始](#quick-start)
  - [工作流程 1 - UI 字串](#workflow-1---ui-strings)
  - [工作流程 2 - 文件](#workflow-2---documentation)
  - [兩種工作流程](#both-workflows)
- [執行階段輔助工具](#runtime-helpers)
- [CLI 指令](#cli-commands)
- [文件](#documentation)
- [授權條款](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="two-core-workflows"></a>
## 兩個核心工作流程

**工作流程 1 - UI 翻譯**（React、Next.js、Node.js、任何 i18next 專案）

從 `t("…")` / `i18n.t("…")` **literals** 建立主目錄 (`strings.json`，包含可選的每區域設定 `models` 元數據)，可選擇性加入 `package.json` `description`，並在設定中啟用時，從 `ui-languages.json` 匯入各個 `englishName`。透過 OpenRouter 翻譯各區域設定中遺漏的項目，並輸出扁平化的 JSON 檔案 (`de.json`、`pt-BR.json` 等)，可直接供 i18next 使用。

**工作流程 2 - 文件翻譯**（Markdown、Docusaurus JSON）

翻譯 `.md` 和 `.mdx` 從每個 `documentations` 區塊的 `contentPaths` 和 JSON 標籤檔案，當啟用時來自該區塊的 `jsonSource`。支持 Docusaurus 風格和平面區域後綴佈局每個區塊 (`documentations[].markdownOutput`)。共享根 `cacheDir` 保存 SQLite 快取，因此只有新的或更改的段落會發送到 LLM。 **SVG:** 啟用 `features.translateSVG`，添加頂層 `svg` 區塊，然後使用 `translate-svg`（當兩者都設置時也從 `sync` 運行）。

兩種工作流程共用單一 `ai-i18n-tools.config.json` 檔案，可獨立或同時使用。獨立 SVG 翻譯使用 `features.translateSVG` 搭配頂層 `svg` 區塊，並透過 `translate-svg` 執行（或在 `sync` 內的 SVG 階段執行）。

---

<a id="installation"></a>
## 安裝

發布的套件僅支援 **ESM**（`"type": "module"`）。可從 Node.js、打包工具或 `import()` 使用 `import` —— `require('ai-i18n-tools')` **不支援**。

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
```

設定您的 OpenRouter API 金鑰：

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

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

從 `'ai-i18n-tools/runtime'` 匯出 - 可在任何 JS 環境中使用，無需導入 i18next：

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
ai-i18n-tools init [-t ui-markdown|ui-docusaurus]   Create config file
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]   Build ui-languages.json from locales + master catalog (needs uiLanguagesPath)
ai-i18n-tools extract                               Merge scanner output, optional package.json description, optional manifest englishName into strings.json
ai-i18n-tools translate-docs [--locale <code>]      Translate documentation (markdown, JSON); see docs for
                                                    --force-update, --force, --stats, --clear-cache,
                                                    --prompt-format (xml | json-array | json-object)
ai-i18n-tools translate-svg [--locale <code>]       Standalone SVG assets (features.translateSVG + config.svg); see --no-cache
ai-i18n-tools translate-ui [--locale <code>]        Translate UI strings only; see --force, --dry-run
ai-i18n-tools export-ui-xliff [--locale <code>]     Export UI strings to XLIFF 2.0 (one file per locale); see --untranslated-only, -o
ai-i18n-tools sync                                  Extract UI strings, then translate UI strings, SVG, and docs
ai-i18n-tools status [--max-columns <n>]   UI strings per locale; markdown per file × locale in tables of up to n locales (default 9)
ai-i18n-tools editor                                Open cache/glossary web editor
ai-i18n-tools cleanup [--dry-run] [--no-backup] [--backup <path>]   Runs sync --force-update, then cleans stale + orphaned cache rows; backs up SQLite by default
ai-i18n-tools glossary-generate                     Create empty glossary CSV template
```

每個指令的全域選項：`-c <config>`（預設值：`ai-i18n-tools.config.json`）、`-v`（詳細輸出）、選擇性 `-w` / `--write-logs [path]` 用於將主控台輸出同時寫入日誌檔（預設值：放在翻譯快取目錄下）、`-V` / `--version`，以及 `-h` / `--help`。各指令專用旗標請見 [快速開始](docs/GETTING_STARTED.zh-TW.md#cli-reference)。

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
