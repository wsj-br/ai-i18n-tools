# ai-i18n-tools

用於國際化 JavaScript/TypeScript 應用程式與文件網站的 CLI 與程式化工具包。可提取 UI 字串，透過 OpenRouter 使用 LLM 進行翻譯，並為 i18next 生成符合語系的 JSON 檔案，同時提供 markdown、Docusaurus JSON 的處理流程，以及（透過 `features.translateSVG`、`translate-svg` 與 `svg` 區塊）獨立 SVG 資源的支援。

<small>**以其他語言閱讀：**</small>

<small id="lang-list">[English (GB)](../README.md) · [German](./README.de.md) · [Spanish](./README.es.md) · [French](./README.fr.md) · [Hindi](./README.hi.md) · [Japanese](./README.ja.md) · [Korean](./README.ko.md) · [Portuguese (BR)](./README.pt-BR.md) · [Chinese (CN)](./README.zh-CN.md) · [Chinese (TW)](./README.zh-TW.md)</small>

## 兩大核心工作流程

**工作流程 1 - UI 翻譯** (React、Next.js、Node.js，任何 i18next 專案)

從 **`t("…")` / `i18n.t("…")` 字面值** 建立主目錄（`strings.json`，並可選擇包含每個語系的 **`models`** 元資料），可選擇性地包含 **`package.json` `description`**，並在設定中啟用時，從 `ui-languages.json` 取得每個 **`englishName`**。透過 OpenRouter 翻譯各語系中缺失的條目，並輸出扁平的 JSON 檔案（`de.json`、`pt-BR.json` 等），可直接供 i18next 使用。

**工作流程 2 - 文件翻譯** (Markdown、Docusaurus JSON)

當啟用時，會翻譯每個 `documentations` 區塊中 `contentPaths` 的 `.md` 與 `.mdx` 檔案，以及該區塊 `jsonSource` 中的 JSON 標籤檔案。每個區塊支援 Docusaurus 風格或扁平的語系後綴目錄結構（`documentations[].markdownOutput`）。共用的根目錄 `cacheDir` 用於存放 SQLite 快取，因此僅有新增或變更的片段會被傳送至 LLM。**SVG：** 啟用 `features.translateSVG`，加入頂層 `svg` 區塊，然後使用 `translate-svg`（當兩者皆設定時，也會由 `sync` 執行）。

兩種工作流程共用單一的 `ai-i18n-tools.config.json` 檔案，可獨立或同時使用。獨立的 SVG 翻譯需使用 `features.translateSVG` 搭配頂層 `svg` 區塊，並透過 `translate-svg` 執行（或在 `sync` 中的 SVG 階段執行）。

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

# 2. Extract UI strings to strings.json (t(…) literals + optional package.json / manifest strings)
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
npx ai-i18n-tools sync   # Extract UI strings, then translate UI strings, SVG, and docs
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

每個指令的全域選項：`-c <config>`（預設值：`ai-i18n-tools.config.json`）、`-v`（詳細輸出）、可選的 `-w` / `--write-logs [path]` 用於將主控台輸出同時寫入日誌檔（預設值：放在翻譯快取目錄下）、`-V` / `--version`，以及 `-h` / `--help`。各指令專用旗標請見 [快速入門](docs/GETTING_STARTED.zh-TW.md#cli-reference)。

---

## 文檔

- [快速入門](docs/GETTING_STARTED.zh-TW.md) - 兩種工作流程的完整設定指南、CLI 參考與設定欄位說明。
- [套件概覽](docs/PACKAGE_OVERVIEW.zh-TW.md) - 架構、內部機制、程式化 API 與擴充點。
- [AI Agent 情境](../docs/ai-i18n-tools-context.md) - **針對使用此套件的應用程式**：提供下游專案整合時使用的提示（可複製到您專案庫的 agent 規則中）。
- **本** 倉儲的維護者內部資料：`dev/package-context.md`（僅限克隆；未發布至 npm）。

---

## 授權

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br)
