<a id="fumadocs-integration"></a>
# Fumadocs 整合

在 Next.js App Router 上的 [Fumadocs](https://www.fumadocs.dev/) 4 文件網站使用 `init -t ui-fumadocs` 與 `docsOutput.style: "fumadocs"`。此預設為 `doc-system` 的別名，帶有空白的 `localeSubpath` 並保留 BCP-47 或短地區代碼（`localePathLowercase` 預設為 `false`）。

另請參閱[文件](/zh-Hant/guide/documents/)及可執行的 [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/) 範例（dot 解析器，連接埠 3080）。

<a id="quick-start"></a>
## 快速開始

```bash
npx ai-i18n-tools init -t ui-fumadocs
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm run build       # Next.js build (project-specific script)
```

當您要在單次 `sync` 執行中翻譯頁面內容、`meta.json` 側邊欄標籤及 Fumadocs UI 覆寫時，請啟用 `features.translateDocs`。

<a id="page-layout"></a>
## 頁面版面

Fumadocs 透過 `docsOutput.fumadocsParser` 支援兩種 i18n 內容佈局。**dot** 解析器為預設值（Fumadocs 內建及如 [SWR](https://github.com/vercel/swr-site) 等正式網站所使用）。

<a id="dot-parser-default"></a>
### Dot 解析器（預設）

英文 MDX 檔案位於集合根目錄。翻譯副本在同一目錄中使用地區代碼後綴：

```text
content/docs/index.mdx                    →  content/docs/index.pt.mdx
content/docs/guide/getting-started.mdx    →  content/docs/guide/getting-started.zh.mdx
```

```json
{
  "contentPaths": ["content/docs"],
  "outputDir": "content/docs",
  "docsOutput": {
    "style": "fumadocs",
    "docsRoot": "content/docs",
    "fumadocsParser": "dot",
    "rewriteFumadocsLinks": true
  }
}
```

在 `lib/i18n.ts` 中將 `targetLocales` 與 `defineI18n().languages` 精確對齊（範例使用短代碼 `pt` 與 `zh`）。

<a id="dir-parser-nextra-style"></a>
### Dir 解析器（Nextra 風格）

對於習慣使用地區資料夾的團隊（`content/docs/en/` → `content/docs/pt-BR/`），將 `fumadocsParser` 設定為 `"dir"`：

```text
content/docs/en/index.mdx           →  content/docs/pt-BR/index.mdx
content/docs/en/guide/foo.mdx       →  content/docs/zh-Hans/guide/foo.mdx
```

```json
{
  "contentPaths": ["content/docs/en"],
  "outputDir": "content/docs",
  "docsOutput": {
    "style": "fumadocs",
    "docsRoot": "content/docs/en",
    "fumadocsParser": "dir",
    "rewriteFumadocsLinks": true
  }
}
```

請參閱 [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/) 中的 `ai-i18n-tools.config.dir.example.json` 以取得可複製貼上的目錄設定。心智模型與 [Nextra 整合](/zh-Hant/guide/integrations/nextra#page-layout) 相符。

<a id="sidebar-metajson"></a>
## 側邊欄（`meta.json`）

Fumadocs 使用 JSON `meta.json` 檔案來定義側邊欄結構與標題。當 `docsOutput.style` 為 `"fumadocs"` 時，**`translate-docs`** 會將 `meta.json` 收集至 `docsRoot`（或 `docs[].fumadocsMetaGlob`）之下，翻譯 `docs[].fumadocsMetaTranslatableKeys` 中所列鍵值的字串（預設：`title`、`description`），並寫入各地區代碼的輸出：

| 解析器 | 英文來源 | 輸出 |
|--------|----------------|--------|
| **dot** | `content/docs/**/meta.json` | `content/docs/**/meta.{locale}.json` |
| **dir** | `content/docs/en/**/meta.json` | `content/docs/{locale}/**/meta.json` |

**切勿**翻譯 `pages` slug 陣列、`root`、`icon`、`defaultOpen` 或其他結構性鍵值——僅翻譯供人類閱讀的標籤。

<a id="ui-catalog"></a>
## UI 目錄

Fumadocs 版面配置的介面元素（搜尋預留位置、地區顯示名稱，以及 `lib/layout.shared.ts` 中的其他 `defineTranslations` / `i18n.translations()` 覆寫）不會從 markdown 中擷取。請設定 **`docsOutput.fumadocsUiCatalog`**，讓 **`translate-docs`** 從 `sourcePath` 啟動英文目錄並翻譯各地區代碼的 JSON：

```json
{
  "features": {
    "translateDocs": true
  },
  "docs": [
    {
      "contentPaths": ["content/docs"],
      "outputDir": "content/docs",
      "docsOutput": {
        "style": "fumadocs",
        "docsRoot": "content/docs",
        "fumadocsParser": "dot",
        "fumadocsUiCatalog": {
          "sourcePath": "lib/layout.shared.ts",
          "catalogPath": "lib/i18n/ui.en.json"
        }
      }
    }
  ]
}
```

- **`catalogPath`** — 產生的英文扁平 JSON（啟動輸出）。當 `layout.shared.ts` 中的英文覆寫變更時，請重新執行 `sync`。
- **`outputPathTemplate`**（可選）— 各地區代碼輸出；預設：`ui.{locale}.json`，位於 `catalogPath` 旁。

在 `layout.shared.ts` 中透過 `loadUiCatalog(locale)` 載入各地區代碼的 JSON，並在您的根版面配置中與 `i18nProvider(translations, lang)` 合併。請參閱 [examples/fumadocs-docs/lib/layout.shared.ts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/fumadocs-docs/lib/layout.shared.ts)。

標準地區設定可由 `@fumadocs/language/*` 預設集涵蓋而無需 LLM 成本；目錄僅翻譯英文區塊中的 **專案覆寫**。

**請勿** 將 `json[]` 用於 Fumadocs UI 字串 — 該管線適用於不相關的應用程式地區設定套件。

<a id="framework-shell-translation"></a>
## 框架外殼翻譯

| 框架 | 殼層 / 主題字串 | 管線 |
|-----------|----------------------|----------|
| Docusaurus | `write-translations` 目錄 | 文件 — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | 主題/導覽/側邊欄目錄 | 文件 — `docsOutput.vitepressThemeCatalog` + `translate-docs` |
| Nextra | `_meta.ts` 側邊欄標籤 | 文件 — 當 `style: "nextra"` + `translate-docs` 時自動 |
| Nextra | 主題字典 `.ts` | 文件 — `docs[].nextraDictionaryPath` + `translate-docs` |
| Fumadocs | `meta.json` 側邊欄標籤 | 文件 — 當 `style: "fumadocs"` + `translate-docs` 時自動 |
| Fumadocs | UI 覆寫目錄 | 文件 — `docsOutput.fumadocsUiCatalog` + `translate-docs` |
| Astro Starlight | 內建 UI 字串（多語系）；無額外外殼管線 | 文件 — `translate-docs`（僅頁面） |

請**勿**將框架 shell/主題字串放入 `json[]` 中 — 該管線適用於無關的應用程式語言包。請參閱 [Docusaurus 整合](/zh-Hant/guide/integrations/docusaurus)、[VitePress 整合](/zh-Hant/guide/integrations/vitepress) 與 [Nextra 整合](/zh-Hant/guide/integrations/nextra) 以了解其他框架模式。

<a id="link-conventions"></a>
## 連結慣例

Fumadocs 透過 Next.js 中介軟體提供語言前綴路由（`/docs/getting-started`、`/pt/docs/getting-started`）。**頁內連結應保持語言中立**（`/docs/getting-started`），以便自動套用當前語言前綴。

啟用內建正規化器，讓 `translate-docs` 自動修正每個翻譯檔案中的連結：

```json
"docsOutput": {
  "style": "fumadocs",
  "docsRoot": "content/docs",
  "rewriteFumadocsLinks": true
}
```

當 `style` 為 `"fumadocs"` 時，`rewriteFumadocsLinks` 預設為啟用。

| 英文來源中的作者 | 正規化後 |
|--------------------------|------------------|
| `[Guide](content/docs/guide/getting-started.mdx)` | `[Guide](/docs/guide/getting-started)` |
| `[Home](content/docs/index.mdx)` | `[Home](/docs)` |
| `[Guide](/zh-Hant/guide/getting-started.mdx)` | `[Guide](/docs/guide/getting-started)` |
| `[Demo](https://github.com/org/repo)` | 不變（完整 URL） |

**撰寫規則**

- 跨頁面文件連結：在英文 MDX 中使用**語言中立的網站路由**（`/docs/…`），或使用 `content/docs/…` / 相對 `.mdx` 路徑，讓正規化器在 `sync` 期間改寫它們。
- 內容樹之外的儲存庫檔案：使用**完整 URL**。
- 請**勿**手動編輯帶語言後綴副本（`*.pt.mdx`）或 `content/{locale}/` 樹中的連結 — 請使用 `sync` / `translate-docs` 重新產生。

另請參閱 [文件 — 連結改寫](/zh-Hant/guide/documents/link-rewriting) 與 [設定 — `docsOutput`](/zh-Hant/reference/configuration#docsoutput)。

<a id="locale-codes"></a>
## 地區設定代碼

請將 `ai-i18n-tools.config.json` 中的 `targetLocales` 與您 Fumadocs 應用程式中的 `defineI18n().languages` 保持**完全**一致。dot 範例使用短代碼（`pt`、`zh`）；目錄設定可使用 BCP-47 資料夾（`pt-BR`、`zh-Hans`）。系統不會強制標準化 — 不相符的代碼會導致輸出路徑錯誤或頁面遺失。

<a id="multiple-collections"></a>
## 多重集合

Fumadocs 專案可在 `source.config.ts` 中定義多個 `defineDocs` 區塊（文件、部落格、範例）。請為每個要翻譯的集合新增一個 `docs[]` 區塊，各自擁有獨立的 `contentPaths`、`outputDir` 與 `docsRoot`。

<a id="example-project"></a>
## 範例專案

[examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/) — 位於 `content/docs/` 的英文 MDX，已提交的 `pt` 與 `zh` dot 後綴頁面、`meta.json` 及 `lib/i18n/ui.{locale}.json`。在連接埠 **3080** 上執行 `pnpm run dev`。

<a id="cross-references"></a>
## 交叉參照

- [設定 — `docsOutput`](/zh-Hant/reference/configuration#docsoutput)
- [輸出佈局](/zh-Hant/guide/documents/output-layouts)
- [Docusaurus 整合](/zh-Hant/guide/integrations/docusaurus)
- [Nextra 整合](/zh-Hant/guide/integrations/nextra) (目錄解析器心智模型)
- [VitePress 整合](/zh-Hant/guide/integrations/vitepress) (UI 目錄啟動模式)
