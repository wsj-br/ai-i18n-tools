<a id="astro-integration"></a>
# Astro 整合

ai-i18n-tools 可與 [Astro](https://astro.build/) 搭配使用，有兩種常見設定：**Astro Starlight** 文件網站和**純 Astro** 行銷或應用程式網站。兩者都使用文件 (`translate-docs`) 作為頁面內容；純 Astro 網站通常將其與 UI 字串 (`extract` / `translate-ui`) 結合，用於 frontmatter 和共享資料中的 `t()` 字串。

另請參閱[使用者介面字串](/guide/ui-strings/astro-website#astro-website-plain-astro-not-starlight)、[文件](/guide/documents/)以及下面的可執行範例。

<a id="astro-starlight"></a>
## Astro Starlight

將 `init -t ui-starlight` 和 `docsOutput.style: "astro-starlight"` 用於 [Astro Starlight](https://starlight.astro.build/) 文件網站。預設值是 `doc-system` 的別名，帶有空的 `localeSubpath` — 翻譯頁面會落在英文原始碼樹旁的 `src/content/docs/<locale>/` 下。

<a id="quick-start"></a>
### 快速入門

```bash
npx ai-i18n-tools init -t ui-starlight
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

配置一個 `docs[]` 區塊：

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

將 `contentPaths` 指向您的英文 `.md` / `.mdx` 檔案和目錄。將 `docsRoot` 設定為 Starlight 用作其內容根目錄的相同資料夾。

Starlight UI 覆寫可以在需要時於獨立的 `docs[]` 區塊中使用 `src/content/i18n/en.json` 搭配 `jsonPathTemplate` — 請參閱[文件 — 初始化文件](/guide/documents/#step-1-initialise-for-documentation)。

<a id="framework-shell-translation"></a>
### 框架外殼翻譯

Starlight 為許多地區語言內建了自身的 UI 字串（導覽標籤、搜尋預留位置、目錄等等）——與 Docusaurus、VitePress 或 Nextra 不同，不需要設定額外的外殼/主題管線：

| 框架 | 外殼 / 主題字串 | 管線 |
|-----------|----------------------|----------|
| Astro Starlight | 內建 UI 字串（多種地區語言）；無額外外殼管線 | 文件 — `translate-docs`（僅頁面） |
| Docusaurus | `write-translations` 目錄（`{ message, description }`） | 文件 — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | 主題/導航/側邊欄目錄 | 文件——`docsOutput.vitepressThemeCatalog` + `translate-docs` |
| Nextra | `_meta.ts` 側邊欄標籤 + 主題字典 `.ts` | 文件 — 請參閱 [Nextra 整合](/guide/nextra-integration) |

其他框架模式請參閱 [Docusaurus 整合](/guide/docusaurus-integration) 與 [VitePress 整合](/guide/vitepress-integration)。

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
| **UI 字串 (`t()`)** | 前端資料、索引標籤、共用陣列 | `extract` → `translate-ui` | `public/locales/{locale}.json`（以英文來源為鍵） |

<a id="quick-start-1"></a>
### 快速入門

```bash
npx ai-i18n-tools init -t ui-astro-website
# enable features.translateDocs and add a docs[] block for page HTML (see below)
pnpm run i18n:sync
pnpm dev
```

使用 `init -t ui-astro-website` 建立 UI 提取，然後在您也翻譯頁面 HTML 時合併 `docs[]` 區塊：

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

透過查找英文原始字面量作為鍵，在**建置時**解析 `t('…')` — 請參閱 `examples/astro-website/src/i18n/t.ts`。除非您新增在載入後切換語言的客戶端島嶼，否則靜態網站不需要 `ai-i18n-tools/runtime` 或 i18next。

<a id="example-project-1"></a>
### 範例專案

[examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) — 混合登陸頁面，透過 `translate-docs` 呈現 HTML，並透過 `t()` + `translate-ui` 呈現螢幕截圖標籤。

<a id="example-projects"></a>
## 專案範例

| 專案 | 用例 | 連接埠 |
|---------|----------|------|
| [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) | Starlight 文件 | 3050 |
| [examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) | 純 Astro 行銷網站 (HTML + `t()` 混合) | (請參閱 README) |

比較 [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) 與 [examples/nextjs-app/docs-site](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/docs-site) — 類似的教學內容，Docusaurus 輸出樣式而非 Starlight。
