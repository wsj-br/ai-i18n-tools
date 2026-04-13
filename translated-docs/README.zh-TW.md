---
translation_last_updated: '2026-04-13T00:28:26.582Z'
source_file_mtime: '2026-04-13T00:12:20.078Z'
source_file_hash: e18e8298ff645bc6b54dc44e33f5afcd538eef92699118fc92ccc8746d207cc3
translation_language: zh-TW
source_file_path: README.md
---
# ai-i18n-tools

用於國際化 JavaScript/TypeScript 應用程式與文件網站的 CLI 與程式化工具套件。提取 UI 字串，透過 OpenRouter 使用 LLM 進行翻譯，並為 i18next 生成區域設定就緒的 JSON 檔案，外加 Markdown、Docusaurus JSON 的處理流程，以及（透過 `translate-svg`）獨立的 SVG 資源。

<small>**以其他語言閱讀：**</small>

<small id="lang-list">[en-GB](../README.md) · [de](./README.de.md) · [es](./README.es.md) · [fr](./README.fr.md) · [hi](./README.hi.md) · [ja](./README.ja.md) · [ko](./README.ko.md) · [pt-BR](./README.pt-BR.md) · [zh-CN](./README.zh-CN.md) · [zh-TW](./README.zh-TW.md)</small>

## 兩大核心工作流程

**工作流程 1 - UI 翻譯** (React、Next.js、Node.js，任何 i18next 專案)

掃描原始碼檔案中的 `t("…")` 呼叫，建立主目錄（`strings.json`，可選包含每個區域設定的 **`models`** 元資料），透過 OpenRouter 為每個區域設定翻譯缺失的條目，並寫入可供 i18next 直接使用的扁平 JSON 檔案（`de.json`、`pt-BR.json`，…）。

**工作流程 2 - 文件翻譯** (Markdown、Docusaurus JSON)

翻譯每個 `documentations` 區塊的 `contentPaths` 中的 `.md` 和 `.mdx` 檔案，並在啟用時翻譯該區塊 `jsonSource` 中的 JSON 標籤檔案。支援每個區塊的 Docusaurus 風格與扁平區域設定後綴佈局（`documentations[].markdownOutput`）。共享的根目錄 `cacheDir` 存放 SQLite 快取，因此只有新增或變更的片段才會發送給 LLM。**SVG：** 使用頂層 `svg` 區塊搭配 `translate-svg`（當設定 `svg` 時，也可從 `sync` 執行）。

兩個工作流程共用單一的 `ai-i18n-tools.config.json` 檔案，可獨立使用或一起使用。獨立的 SVG 翻譯透過頂層 `svg` 區塊配置，並透過 `translate-svg`（或 `sync` 內的 SVG 階段）執行。

---

## 安裝

已發佈的套件為 **僅限 ESM**（`"type": "module"`）。請在 Node.js、打包工具或 `import()` 中使用 `import` — **不支援 `require('ai-i18n-tools')`。**

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

## 快速開始

### 工作流程 1 - UI 字串

```bash
# 1. Create config
npx ai-i18n-tools init

# 2. Extract t("…") calls from source
npx ai-i18n-tools extract

# 3. Translate to all target locales
npx ai-i18n-tools translate-ui
```

使用 `'ai-i18n-tools/runtime'` 中的輔助工具，在您的應用程式中連接 i18next：

```js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import uiLanguages from './locales/ui-languages.json';
import {
  defaultI18nInitOptions,
  wrapI18nWithKeyTrim,
  makeLoadLocale,
  applyDirection,
} from 'ai-i18n-tools/runtime';

// Must match sourceLocale in ai-i18n-tools.config.json
export const SOURCE_LOCALE = 'en-GB';

void i18n.use(initReactI18next).init(defaultI18nInitOptions(SOURCE_LOCALE));
wrapI18nWithKeyTrim(i18n);
i18n.on('languageChanged', applyDirection);
applyDirection(i18n.language);

const localeLoaders = Object.fromEntries(
  uiLanguages
    .filter(({ code }) => code !== SOURCE_LOCALE)
    .map(({ code }) => [code, () => import(`./locales/${code}.json`)])
);
export const loadLocale = makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);
export default i18n;
```

### 工作流程 2 - 文件

```bash
# 1. Create config for Docusaurus
npx ai-i18n-tools init -t ui-docusaurus

# 2. Translate all docs
npx ai-i18n-tools translate-docs

# 3. Check status
npx ai-i18n-tools status
```

### 兩個工作流程

```bash
npx ai-i18n-tools sync   # extract UI strings, then translate UI strings, optional standalone SVG, then docs
```

---

## 執行期輔助工具

從 `'ai-i18n-tools/runtime'` 匯出 - 適用於任何 JS 環境，無需引入 i18next：

| 輔助工具 | 描述 |
|---|---|
| `defaultI18nInitOptions(sourceLocale)` | 適用於以鍵值作為預設值設定的標準 i18next 初始化選項。 |
| `wrapI18nWithKeyTrim(i18n)` | 包裝 `i18n.t`，使其在查詢前先修剪鍵值。 |
| `makeLoadLocale(i18n, loaders, sourceLocale)` | 用於非同步載入區域設定檔案的工廠函式。 |
| `getTextDirection(lng)` | 針對 BCP-47 代碼返回 `'ltr'` 或 `'rtl'`。 |
| `applyDirection(lng, element?)` | 在 `document.documentElement` 上設定 `dir` 屬性。 |
| `getUILanguageLabel(lang, t)` | 語言選單列的顯示標籤（搭配 i18n）。 |
| `getUILanguageLabelNative(lang)` | 不呼叫 `t()` 的顯示標籤（標題風格）。 |
| `interpolateTemplate(str, vars)` | 對純字串進行 `{{var}}` 替換的低階函式（內部使用；應用程式碼應改用 `t()`）。 |
| `flipUiArrowsForRtl(text, isRtl)` | 針對 RTL 佈局將 `→` 翻轉為 `←`。 |

---

## CLI 指令

```
ai-i18n-tools init [-t ui-markdown|ui-docusaurus]   Create config file
ai-i18n-tools extract                               Scan source for t("…") calls
ai-i18n-tools translate-docs [--locale <code>]      Translate documentation (markdown, JSON); see docs for
                                                    --force-update, --force, --stats, --clear-cache,
                                                    --prompt-format (xml | json-array | json-object)
ai-i18n-tools translate-svg [--locale <code>]       Standalone SVG assets (requires config.svg); see --no-cache
ai-i18n-tools translate-ui [--locale <code>]        Translate UI strings only; see --force, --dry-run
ai-i18n-tools sync                                  Extract UI strings, then UI, optional SVG, then docs
ai-i18n-tools status                                Translation status per file × locale
ai-i18n-tools editor                                Open cache/glossary web editor
ai-i18n-tools cleanup [--dry-run] [--no-backup] [--backup <path>]   Runs sync --force-update, then cleans stale + orphaned cache rows; backs up SQLite by default
ai-i18n-tools glossary-generate                     Create empty glossary CSV template
```

所有命令都接受 `-c <config>`（默認值：`ai-i18n-tools.config.json`）、`-v`（詳細模式），以及可選的 `-w` / `--write-logs [path]` 來將控制台輸出附加到日誌文件（默認值：在翻譯緩存目錄下）。

---

## 文檔

- [開始使用](GETTING_STARTED.zh-TW.md) - 針對兩種工作流程的完整設置指南、所有 CLI 標誌和配置字段參考。
- [包概述](PACKAGE_OVERVIEW.zh-TW.md) - 架構、內部原理、程序化 API 和擴展點。
- [AI 代理上下文](../docs/ai-i18n-tools-context.md) - 為進行代碼或配置更改的代理和維護者提供簡明的項目上下文。

---

## 授權

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br)
