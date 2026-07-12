<a id="output-layouts"></a>
# 輸出佈局

`docsOutput.style` 控制翻譯後的 markdown 檔案寫入位置。請在 `docs[].docsOutput.style` 中使用下方確切的字串值。別名是預設的 `doc-system` 佈局（或 Fumadocs 點號後綴佈局），而非獨立的引擎——設定載入時可能會將別名 `style` 值重寫為標準的 `"doc-system"`，同時在 `stylePreset` 中保留原始預設值。

設定 `docs[].docsOutput.pathTemplate` (markdown/MDX) 或 `jsonPathTemplate` (JSON 標籤檔案) 以覆寫任何內建佈局。請參閱下方的 [pathTemplate 佔位符](#pathtemplate--jsonpathtemplate-placeholders)。

<a id="layout-overview"></a>
## 佈局總覽

| `docsOutput.style` | 引擎 | 典型用途 |
| --- | --- | --- |
| `"nested"` | 語系資料夾映射完整原始碼樹 | 預設；`{outputDir}/{locale}/` 下的通用 i18n 輸出 |
| `"flat"` | 檔名中的語系後綴（可選子目錄） | README、更新日誌、儲存庫根目錄文件、[語言切換器](/zh-Hant/guide/documents/language-switcher) |
| `"doc-system"` | 語系資料夾 + `docsRoot` 下的可選 `localeSubpath` | 自訂靜態文件產生器 |
| `"docusaurus"` | `doc-system` 預設 | [Docusaurus](/zh-Hant/guide/integrations/docusaurus) i18n 外掛佈局 |
| `"astro-starlight"` | `doc-system` 預設 (`localeSubpath: ""`) | [Astro Starlight](/zh-Hant/guide/integrations/astro#astro-starlight)、純 Astro 語系頁面 |
| `"vitepress"` | `doc-system` 預設 (`localeSubpath: ""`) | [VitePress](/zh-Hant/guide/integrations/vitepress) 位於英文旁的語系資料夾 |
| `"nextra"` | `doc-system` 預設 (`localeSubpath: ""`) | [Nextra](/zh-Hant/guide/integrations/nextra) 語系資料夾 (`content/en/` → `content/{locale}/`) |
| `"fumadocs"` | 點號後綴（預設）或當 `fumadocsParser: "dir"` 時的 `doc-system` | [Fumadocs](/zh-Hant/guide/integrations/fumadocs) 點號或目錄內容佈局 |

<a id="nested-default"></a>
## `nested` (預設)

`docsOutput.style = "nested"` (省略時預設) —— 在 `{outputDir}/{locale}/` 下映射原始碼樹。

```text
docs/guide.md  →  i18n/de/docs/guide.md
README.md      →  i18n/de/README.md
```

在 `docsRoot` 之外的路徑（如有設定）使用相同的巢狀結構。

<a id="flat"></a>
## `flat`

`docsOutput.style = "flat"` —— 將翻譯後的檔案寫入 `outputDir` 下，並在檔名中加入語系後綴。預設情況下僅保留基本檔名 (`{outputDir}/{stem}.{locale}{extension}`)，因此除非您啟用 `flatPreserveRelativeDir`，否則 `docs/guide.md` 與 `docs/other/guide.md` 會發生衝突。

```text
README.md           →  translated-docs/README.de.md
docs/guide.md       →  translated-docs/guide.de.md   (default: basename only)
```

當 `docsOutput.style = "flat"` 時，頁面之間的相對連結會自動重寫（除非設定了 `rewriteRelativeLinks: false` 或自訂的 `pathTemplate`）。關於跨頁面的 `#anchor` 處理，請參閱 [錨點連結](/zh-Hant/guide/documents/anchor-links)。

<a id="flat-with-flatpreserverelativedir"></a>
### `flat` 搭配 `flatPreserveRelativeDir`

將 `docsOutput.flatPreserveRelativeDir` 設為 `true`，以在 `outputDir` 下保留原始碼子目錄。當翻譯多個在不同資料夾中共享基本檔名的 markdown 檔案，或者當平面輸出必須映射淺層樹狀結構時（例如儲存庫根目錄的 README 加上 `docs/*.md`），請使用此選項。

```text
docs/guide.md       →  translated-docs/docs/guide.de.md
docs/sub/page.md    →  translated-docs/docs/sub/page.de.md
```

平面連結重寫器在計算資產 URL 的深度前綴時，會使用每個檔案的輸出路徑——請參閱 [連結重寫](/zh-Hant/guide/images-and-screenshots/link-rewriting#per-file-depth-prefix-with-flatpreserverelativedir)。

<a id="doc-system"></a>
## `doc-system`

`docsOutput.style = "doc-system"` — 靜態文件網站的語系前綴文件樹。`docsRoot` 下的檔案會寫入至：

```text
{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}
```

`docsRoot` 以外的路徑會回退至 [巢狀](#nested) 佈局（`{outputDir}/{locale}/{relPath}`）。

將 `docs[].docsOutput.docsRoot` 設定為您的英文來源根目錄（例如 `"docs"`、`"src/content/docs"` 或 `"content/en"`）。當 `docsOutput.style = "doc-system"` 時，您必須明確設定 `localeSubpath`（請使用下方的別名來套用預設值）。當翻譯頁面直接位於 `{outputDir}/{locale}/` 之下時，請使用 `localeSubpath: ""`（Starlight 風格）。

來自 `docusaurusCatalogDir` 的 Docusaurus shell JSON 以及文件系統預設下的其他 JSON 產物，遵循與 Markdown 相同的資料夾佈局。使用 `style: "flat"` 時，JSON 標籤檔案仍會使用巢狀結構，除非您設定 `jsonPathTemplate`。

<a id="doc-system-aliases"></a>
## 文件系統別名

**別名**（相同的 `doc-system` 引擎，預設 `localeSubpath` 與預設值）：

- `docsOutput.style = "docusaurus"` — `localeSubpath` 預設為 `docusaurus-plugin-content-docs/current`（Docusaurus i18n 外掛佈局）。
- `docsOutput.style = "astro-starlight"` — `localeSubpath` 預設為 `""`；`localePathLowercase` 預設為 `true`。翻譯頁面位於 `{outputDir}/{locale}/` 之下，當英文內容位於內容根目錄且 `outputDir` 等於 `docsRoot` 時，與 [Starlight](https://starlight.astro.build/guides/i18n/) 一致。亦用於一般 Astro 語系頁面（`src/pages/index.astro` → `src/pages/{locale}/index.astro`）—請參閱 [Astro 網站頁面](/zh-Hant/guide/ui-strings/astro-website#pages-parse-and-replace)。
- `docsOutput.style = "vitepress"` — 與 `doc-system` 相同的佈局，但 `localeSubpath` 為空；保留 BCP-47 語系資料夾名稱（`localePathLowercase` 預設為 `false`）。請參閱 [VitePress 整合](/zh-Hant/guide/integrations/vitepress)。
- `docsOutput.style = "nextra"` — 與 `doc-system` 相同的佈局，但 `localeSubpath` 為空；英文來源位於語系資料夾之下（例如 `content/en/`）。請參閱 [Nextra 整合](/zh-Hant/guide/integrations/nextra)。

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

選擇性的 JSON 標籤 — Docusaurus 外殼字串來自 `docusaurusCatalogDir`（非 MDX 主體內容）：

```text
i18n/en/sidebar.json  →  i18n/de/sidebar.json
```

Starlight 為許多地區提供 UI 字串；選擇性的自訂 UI 覆蓋使用 `src/content/i18n/en.json` 和 `jsonPathTemplate: "{outputDir}/{locale}.json"` 在單獨的 `docs[]` 區塊中，如果需要的話。

VitePress 導覽/側邊欄/頁尾字串不在 markdown 中 — 請設定 `docsOutput.vitepressThemeCatalog` 並在 **`translate-docs`** 內翻譯。請參閱 [VitePress 整合](/zh-Hant/guide/integrations/vitepress)。

Nextra 主題字典 (`.ts`) 與 `_meta.ts` 側邊欄標籤不在 markdown 中 — 請使用 `docs[].nextraDictionaryPath` 並在 `style: "nextra"` 時自動收集 `_meta`，全都在 **`translate-docs`** 內。請參閱 [Nextra 整合](/zh-Hant/guide/integrations/nextra)。

<a id="fumadocs"></a>
## `fumadocs`

`docsOutput.style = "fumadocs"` — 透過 `docsOutput.fumadocsParser` 的 Fumadocs 內容佈局：

- **`"dot"`（預設）** — 檔名中的語系後綴位於英文來源旁的 `outputDir` 之下（非語系資料夾）。此與 `doc-system` 路徑結構是分開的。

```text
content/docs/guide/getting-started.mdx  →  content/docs/guide/getting-started.pt.mdx
```

- **`"dir"`** — Nextra 風格的語系資料夾；使用相同的 `doc-system` 引擎，但 `localeSubpath` 為空。

```text
content/docs/en/guide/getting-started.mdx  →  content/docs/pt-BR/guide/getting-started.mdx
```

Fumadocs UI 覆寫 (`lib/layout.shared.ts`) 與 `meta.json` 側邊欄標籤不在 markdown 中 — 請使用 `docsOutput.fumadocsUiCatalog` 並在 `style: "fumadocs"` 時自動收集 `meta.json`，全都在 **`translate-docs`** 內。請參閱 [Fumadocs 整合](/zh-Hant/guide/integrations/fumadocs)。

對於內建相對連結修正以外的連結和資產 URL 重寫，請參閱[連結重寫](/zh-Hant/guide/documents/link-rewriting) (`docsOutput.postProcessing.regexAdjustments`)。

如需在翻譯頁面中加入螢幕截圖和點陣圖資產，請參閱[圖片與螢幕截圖](/zh-Hant/guide/images-and-screenshots/)。

<a id="pathtemplate--jsonpathtemplate-placeholders"></a>
## `pathTemplate` / `jsonPathTemplate` 預留位置

透過設定 `docs[].docsOutput.pathTemplate` (Markdown 和 MDX) 或 `jsonPathTemplate` (JSON 標籤檔案) 來覆寫翻譯檔案的寫入位置。兩者都接受相同的預留位置。解析的路徑必須保留在此區塊的 `outputDir` 內 (CLI 會拒絕超出此範圍的路徑)。

如果您使用自訂 `pathTemplate`，`rewriteRelativeLinks` 預設為 `false`，除非您明確設定它 — 相對連結重寫是為沒有自訂範本的 `docsOutput.style = "flat"` 而建置的。

對於內建佈局（`nested`、`flat`、`doc-system` 且未使用自訂範本），將 `docsOutput.localePathLowercase` 設定為 `true` 可寫入小寫的語系資料夾或檔名區段（例如以 `pt-br` 取代 `pt-BR`）。`astro-starlight` 別名以及 `doc-system` 搭配空的 `localeSubpath` 會在設定載入時將此預設為 `true`。自訂的 `pathTemplate` / `jsonPathTemplate` 值保持不變 — 當您需要小寫區段同時將 `{locale}` 保留為 BCP-47 時，請在該處使用 `{llocale}`。

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
