<a id="astro-integration"></a>
# Astro 整合

ai-i18n-tools 可與 [Astro](https://astro.build/) 搭配使用，有兩種常見設定：**Astro Starlight** 文件網站和**純 Astro** 行銷或應用程式網站。兩者都使用文件 (`translate-docs`) 作為頁面內容；純 Astro 網站通常將其與 UI 字串 (`extract` / `translate-ui`) 結合，用於 frontmatter 和共享資料中的 `t()` 字串。

另請參閱 [UI 字串](/zh-Hant/guide/ui-strings/astro-website)、[文件](/zh-Hant/guide/documents/) 及下方可執行的範例。

<a id="astro-starlight"></a>
## Astro Starlight

將 `init -t ui-starlight` 與 `docsOutput.style: "astro-starlight"` 用於 [Astro Starlight](https://starlight.astro.build/) 文件網站。此預設集是 `doc-system` 的別名，帶有空的 `localeSubpath` — 翻譯後的頁面會放在來源語系樹狀目錄旁的 `src/content/docs/<locale>/` 底下。`sourceLocale` 可以是任何語言。

<a id="quick-start"></a>
### 快速入門

```bash
ai-i18n-tools init -t ui-starlight -P cheaperinference
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm dev             # Starlight dev server (project-specific script)
```

<a id="page-layout"></a>
### 頁面佈局

英文 Markdown 和 MDX 位於 Starlight 內容根目錄（通常是 `src/content/docs/`）。翻譯副本寫在原始碼樹旁：

```text
src/content/docs/quick-start.md     →  src/content/docs/de/quick-start.md
src/content/docs/guide/setup.mdx    →  src/content/docs/fr/guide/setup.mdx
```

設定一個 `docs[]` 區塊：

```json
{
  "contentPaths": ["src/content/docs/"],
  "outputDir": "src/content/docs",
  "docsOutput": {
    "style": "astro-starlight",
    "docsRoot": "src/content/docs"
  }
}
```

將 `contentPaths` 指向以 `sourceLocale` 編寫的 `.md` / `.mdx` 檔案與目錄。該語言可以是任何語言。將 `docsRoot` 設定為 Starlight 用作其內容根目錄的相同資料夾。

Starlight UI 覆寫可以在需要時於獨立的 `docs[]` 區塊中使用 `src/content/i18n/en.json` 搭配 `jsonPathTemplate` — 請參閱[文件 — 初始化文件](/zh-Hant/guide/documents/#step-1-initialise-for-documentation)。

Starlight 內建了許多地區設定的 UI 字串（導覽標籤、搜尋預留位置、目錄等等）。沒有單獨的 shell/主題管線需要設定 — 僅將 `translate-docs` 用於頁面內容。至於其他框架，請參閱[框架 shell 翻譯](/zh-Hant/guide/integrations/#framework-shell-translation)。

明確的側邊欄 `label`、網站 `title` 及 `astro.config.mjs` 中的 `social[].label` 是此工具不會翻譯的英文字面值。偏好使用 `slug` 項目，這樣標籤就會來自頁面已翻譯的前言 (`title`)。需要自訂措辭的群組或外部連結，會使用 Starlight 的各語系 `translations` 對應表 (`label` 用於預設語系，`translations['pt-BR']` 用於其他語系)。在目前的 Starlight 結構描述中，`social[].label` 沒有翻譯欄位；它會維持原樣。請參閱 [Starlight 側邊欄](https://starlight.astro.build/guides/sidebar/#internationalization) 與 [examples/astro-docs/astro.config.mjs](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/astro-docs/astro.config.mjs)，其中使用了 `slug` 項目。

<a id="enable-i18n-in-an-existing-site"></a>
### 在現有網站中啟用 i18n

- 在 Starlight 設定中設定 `locales`，當英文應為無前綴時 (`label` 及必要的 `lang`)，包含一個 `root` 項目。
- 當預設語言是該根語系時，設定 `defaultLocale: 'root'`。僅在 Starlight 的預設值已相符時，才省略 `defaultLocale`。
- 英文頁面保留在 `src/content/docs/` 中；`translate-docs` 會寫入 `src/content/docs/<locale>/`。
- `targetLocales` 與非根語系的鍵值對齊 (注意大小寫：Starlight 的目錄鍵值通常是小寫，例如 `pt-br`)。

<a id="example-project"></a>
### 範例專案

[examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) — 英文原始碼位於 `src/content/docs/`，已提交的翻譯位於 `src/content/docs/<locale>/`，RTL 語系 (`ar`)，以及詞彙表驅動的翻譯。在連接埠 3050 上執行 `pnpm dev`。

<a id="plain-astro-marketing-and-app-sites"></a>
## 純 Astro（行銷和應用程式網站）

對於靜態 Astro 行銷或應用程式網站（非 Starlight），請將 [Astro 內建的 i18n 路由](https://docs.astro.build/en/guides/internationalization/) 與 ai-i18n-tools 結合使用。參考實作是 [examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website)：英文位於 `/`，目標語系位於 `/{locale}/`。

大多數團隊在同一頁面上使用兩種管道的**混合**：

| 管道 | 用途 | 命令 | 輸出 |
|----------|---------|----------|--------|
| **頁面 HTML** | 範本主體中的標題、段落、導覽標籤、內嵌陣列 | `translate-docs` | 每種語言 `src/pages/{locale}/index.astro` |
| **UI 字串 (`t()`)** | 前言資料、索引標籤標籤、共用陣列 | `extract` → `translate-ui` | `public/locales/{locale}.json` (來源語言字串作為鍵值) |

<a id="quick-start-1"></a>
### 快速入門

```bash
ai-i18n-tools init -t ui-astro-website -P ollama
# enable features.translateDocs and add a docs[] block for page HTML (see below)
pnpm run i18n:sync
pnpm dev
```

使用 `init -t ui-astro-website -P ollama` 建立 UI 提取骨架，然後當您也翻譯頁面 HTML 時，合併一個 `docs[]` 區塊。

```json
{
  "features": {
    "translateUIStrings": true,
    "translateDocs": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "public/locales/strings.json",
    "flatOutputDir": "public/locales/"
  },
  "docs": [{
    "contentPaths": ["src/pages/index.astro"],
    "outputDir": "src/pages",
    "docsOutput": {
      "style": "astro-starlight",
      "docsRoot": "src/pages"
    },
    "addFrontmatter": false
  }]
}
```

當您新增或移除語言時，請保持三個清單對齊：`targetLocales` 在 `ai-i18n-tools.config.json` 中，`i18n.locales` 在 `astro.config.mjs` 中（Astro 使用 **小寫** 路由代碼，例如 `pt-br`），以及 `ui-languages.json`（透過 `generate-ui-languages`）。扁平化套件**檔案名稱**使用配置大小寫 (`pt-BR.json`)；透過您的清單 `code` 欄位將 Astro 的 `pt-br` 路由映射到該檔案。

在**建置期間**透過將來源語言的字面值作為鍵值來查詢，以解析 `t('…')` — 請參閱 `examples/astro-website/src/i18n/t.ts`。`sourceLocale` 可以是任何語言。此範例使用英文。對於靜態網站，您不需要 `ai-i18n-tools/runtime` 或 i18next，除非您新增了在載入後切換語言的用戶端孤島。

<a id="example-project-1"></a>
### 範例專案

[examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) — 混合登陸頁面，透過 `translate-docs` 呈現 HTML，並透過 `t()` + `translate-ui` 呈現螢幕截圖標籤。

<a id="example-projects"></a>
## 專案範例

| 專案 | 用例 | 連接埠 |
|---------|----------|------|
| [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) | Starlight 文件 | 3050 |
| [examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) | 純 Astro 行銷網站 (HTML + `t()` 混合) | (請參閱 README) |

比較 [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) 與 [examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs) —— 教學內容相似，但輸出風格為 Docusaurus 而非 Starlight。
