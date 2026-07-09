<a id="output-layouts"></a>
# 輸出佈局

`docsOutput.style` 控制翻譯後的 markdown 檔案的寫入位置。在 `docs[].docsOutput.style` 中使用下面的確切字串值（別名是預設佈局，而不是獨立的引擎）。

`docsOutput.style = "nested"`（省略時為預設）— 在 `{outputDir}/{locale}/` 下鏡像來源樹（例如 `docs/guide.md` → `i18n/de/docs/guide.md`）。

`docsOutput.style = "doc-system"` — 用於靜態文件站點的、預加地區代碼的文件樹。`docsRoot` 下的檔案會寫入 `{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}`。`docsRoot` 以外的路徑會回退到巢狀佈局。將 `docs[].docsOutput.docsRoot` 設定為您的英文來源根目錄（例如 `"docs"` 或 `"src/content/docs"`）。當 `docsOutput.style = "doc-system"` 時，您必須明確設定 `localeSubpath`（使用下面的別名進行預設設定）。

**別名**（相同的佈局引擎，預設 `localeSubpath`）：

- `docsOutput.style = "docusaurus"` — `localeSubpath` 預設為 `docusaurus-plugin-content-docs/current`（Docusaurus i18n 外掛佈局）。
- `docsOutput.style = "astro-starlight"` — `localeSubpath` 預設為 `""`（翻譯後的頁面直接置於 `{outputDir}/{locale}/` 之下，當英文內容位於內容根目錄且 `outputDir` 等於 `docsRoot` 時，與 [Starlight](https://starlight.astro.build/guides/i18n/) 相符）。
- `docsOutput.style = "vitepress"` — 佈局與 `doc-system` 相同但 `localeSubpath` 為空；保留 BCP-47 語系資料夾名稱（`localePathLowercase` 預設為 `false`）。請參閱 [VitePress 整合](/guide/vitepress-integration)。
- `docsOutput.style = "nextra"` — 佈局與 `doc-system` 相同但 `localeSubpath` 為空；英文來源置於語系資料夾下（例如 `content/en/`）。請參閱 [Nextra 整合](/guide/nextra-integration)。
- `docsOutput.style = "fumadocs"` — 與 `doc-system` 相同的版面配置，但 `localeSubpath` 為空；英文來源使用點後綴檔案（預設），或當 `fumadocsParser` 為 `"dir"` 時使用語言資料夾。請參閱 [Fumadocs 整合](/guide/fumadocs-integration)。

Docusaurus 預設（主要文件頁面）：

```text
docs/guide.md  →  i18n/de/docusaurus-plugin-content-docs/current/guide.md
```

Starlight 預設（相同的區塊形狀，不同的路徑）：

```text
src/content/docs/guide.md  →  src/content/docs/de/guide.md
```

VitePress 預設（英文位於內容根目錄，語言環境資料夾位於來源旁）：

```text
docs/guide/quick-start.md  →  docs/de/guide/quick-start.md
```

Nextra 預設配置（英文置於語系資料夾下，目標語言使用同層語系資料夾）：

```text
content/en/guide/getting-started.mdx  →  content/pt-BR/guide/getting-started.mdx
```

Fumadocs 預設 — 點剖析器（預設；語言後綴位於英文來源旁）：

```text
content/docs/guide/getting-started.mdx  →  content/docs/guide/getting-started.pt.mdx
```

Fumadocs 預設 — 目錄剖析器（Nextra 風格語言資料夾）：

```text
content/docs/en/guide/getting-started.mdx  →  content/docs/pt-BR/guide/getting-started.mdx
```

選擇性的 JSON 標籤 — Docusaurus 外殼字串來自 `docusaurusCatalogDir`（非 MDX 主體內容）：

```text
i18n/en/sidebar.json  →  i18n/de/sidebar.json
```

Starlight 為許多地區提供 UI 字串；選擇性的自訂 UI 覆蓋使用 `src/content/i18n/en.json` 和 `jsonPathTemplate: "{outputDir}/{locale}.json"` 在單獨的 `docs[]` 區塊中，如果需要的話。

VitePress 的導覽列/側邊欄/頁尾字串不在 markdown 中——請設定 `docsOutput.vitepressThemeCatalog` 並在 **`translate-docs`** 內進行翻譯。請參閱 [VitePress 整合](/guide/vitepress-integration)。

Nextra 主題字典（`.ts`）與 `_meta.ts` 側邊欄標籤不在 markdown 中——請使用 `docs[].nextraDictionaryPath` 並在 `style: "nextra"` 時自動收集 `_meta`，全部在 **`translate-docs`** 內完成。請參閱 [Nextra 整合](/guide/nextra-integration)。

Fumadocs UI 覆寫（`lib/layout.shared.ts`）和 `meta.json` 側邊欄標籤不在 markdown 中 — 當 `style: "fumadocs"` 時使用 `docsOutput.fumadocsUiCatalog` 和自動 `meta.json` 集合，全部在 **`translate-docs`** 內。請參閱 [Fumadocs 整合](/guide/fumadocs-integration)。

`docsOutput.style = "flat"` — 將翻譯後的檔案放置在來源旁邊，並帶有地區後綴，或放在子目錄中。當 `docsOutput.style = "flat"` 時（除非設定了 `rewriteRelativeLinks: false` 或自訂的 `pathTemplate`），頁面之間的相對連結會自動重寫。

```text
docs/guide.md → i18n/guide.de.md
```

如需在平面佈局中建立跨頁錨點連結，請參閱[錨點連結](/guide/documents/anchor-links)。

對於內建相對連結修正以外的連結和資產 URL 重寫，請參閱[連結重寫](/guide/documents/link-rewriting) (`docsOutput.postProcessing.regexAdjustments`)。

如需在翻譯頁面中加入螢幕截圖和點陣圖資產，請參閱[圖片與螢幕截圖](/guide/images-and-screenshots/)。

<a id="pathtemplate--jsonpathtemplate-placeholders"></a>
## `pathTemplate` / `jsonPathTemplate` 預留位置

透過設定 `docs[].docsOutput.pathTemplate` (Markdown 和 MDX) 或 `jsonPathTemplate` (JSON 標籤檔案) 來覆寫翻譯檔案的寫入位置。兩者都接受相同的預留位置。解析的路徑必須保留在此區塊的 `outputDir` 內 (CLI 會拒絕超出此範圍的路徑)。

如果您使用自訂 `pathTemplate`，`rewriteRelativeLinks` 預設為 `false`，除非您明確設定它 — 相對連結重寫是為沒有自訂範本的 `docsOutput.style = "flat"` 而建置的。

對於內建佈局（`nested`、`flat`、`doc-system`，沒有自訂範本），請將 `docsOutput.localePathLowercase` 設定為 `true`，以寫入小寫的地區設定資料夾或檔案名稱片段（例如，`pt-br` 而非 `pt-BR`）。`astro-starlight` 別名預設為 `true`。自訂的 `pathTemplate` / `jsonPathTemplate` 值保持不變 — 當您需要小寫片段但將 `{llocale}` 保留為 BCP-47 時，請在此處使用 `{locale}`。

| 預留位置            | 角色                                                                                                       | 範例                                                          |
|------------------------|------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| `{outputDir}`          | 此文件區塊 `outputDir` 的絕對解析路徑                                           | `/home/acme/repo/i18n`                                           |
| `{locale}`             | 目標地區設定碼（與設定 / CLI 中的格式相同）                                                          | `de`、`pt-BR`                                                    |
| `{LOCALE}`             | 相同地區設定的大寫形式                                                                                     | `DE`、`PT-BR`                                                    |
| `{llocale}`            | 相同地區設定的小寫形式（符合 Astro 路由資料夾，例如 `pt-br`、`zh-cn`）                               | `de`、`pt-br`                                                    |
| `{relPath}`            | 相對於專案根目錄的檔案路徑，POSIX `/`                                                   | `docs/guide.md`、`README.md`                                     |
| `{stem}`               | 檔名 **無**副檔名                                                                                             | `guide` 用於 `docs/guide.md`                                      |
| `{basename}`           | 檔名 **含**副檔名                                                                                             | `guide.md`                                                       |
| `{extension}`          | 副檔名 **包含** 句點                                                                            | `.md`、`.mdx`                                                    |
| `{docsRoot}`           | `docsOutput.docsRoot` 的絕對解析路徑（若省略則預設為 `docs`）                            | `/home/acme/repo/docs`                                           |
| `{relativeToDocsRoot}` | 當路徑字串對齊時（POSIX），移除相符的 `{relPath}` 前綴的 `docsRoot`；否則保持不變 | `docs/guide.md` （常見）；僅在套用移除時為 `guide.md` |

**範例**

設定片段：

```json
{
  "outputDir": "i18n",
  "docsOutput": {
    "pathTemplate": "{outputDir}/{locale}/{relPath}"
  }
}
```

對於地區設定 `de` 和來源 `docs/guide.md`，專案根目錄為 `/home/acme/repo` 且 `outputDir` 解析為 `/home/acme/repo/i18n`，展開的路徑為：

```text
/home/acme/repo/i18n/de/docs/guide.md
```

使用 `docsOutput.style = "flat"` 且無自訂 `pathTemplate` 時，常見模式是透過 `{stem}` 和 `{extension}` 只保留檔案名稱，例如 `{outputDir}/{stem}.{locale}{extension}`，這會在解析後的 `outputDir` 下產生 `…/guide.de.md`。
