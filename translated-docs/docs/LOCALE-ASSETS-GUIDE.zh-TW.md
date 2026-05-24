<a id="locale-assets-guide"></a>
# 地區語系資源指南

本指南介紹如何在使用 `ai-i18n-tools` 的專案中處理特定地區語系的資源 — 包括截圖（PNG、JPEG、WebP）和插圖 SVG 檔案。內容涵蓋每種可用模式的說明、使用時機，以及如何從零開始設定專案，以便未來新增更多語系時無需重構專案結構。

如需 SVG 設定參考，請參閱 [GETTING_STARTED.md](GETTING_STARTED.zh-TW.md) 中的 [`svg`](#svg) 區段。關於 `postProcessing.regexAdjustments` 選項，請參閱 [設定參考](GETTING_STARTED.zh-TW.md#configuration-reference)。

| 設定路徑 | 值 | 使用情境 | 備註 |
|-------------|-------|----------|-------|
| `docs[].docsOutput.style` | `"flat"` | 附有語系後綴的 README / 使用者指南檔案 | 啟用扁平連結重寫器；當來源位於子目錄時，需搭配 `flatPreserveRelativeDir` 使用 |
| `docs[].docsOutput.style` | `"nested"` (預設) | 在 `outputDir` 下的簡單語系子資料夾 | 不啟用扁平連結重寫器 |
| `docs[].docsOutput.style` | `"doc-system"` | 帶語系前綴的文件樹（自訂產生器） | 設定 `docsRoot` 與 `localeSubpath`；不執行扁平連結重寫器 |
| `docs[].docsOutput.style` | `"docusaurus"` / `"astro-starlight"` | 預設 `doc-system` 版面配置 | 具有產生器特定預設值的別名，適用於 `localeSubpath` |
| `svg.style` | `"flat"` | 網頁應用程式（`name.<locale>.svg` 在 `public/assets/` 中） | 與 Markdown `style` 分開；由 `translate-svg` 使用 |
| `svg.style` | `"nested"` | 文件系統共置的 SVG 輸出 | 常與 `pathTemplate` 搭配使用（模式 E） |

本指南使用設定中的確切 JSON 字串 —— 而非僅英文單字 —— 以確保翻譯版本保持明確無歧義。舊版鍵名（`documentations`、`markdownOutput`）在載入時仍可接受；但在新設定中建議使用 `docs` 與 `docsOutput`。

<small>**以其他語言閱讀：** </small>
<small id="lang-list">[English (GB)](../../docs/LOCALE-ASSETS-GUIDE.md) · [Deutsch](./LOCALE-ASSETS-GUIDE.de.md) · [Español](./LOCALE-ASSETS-GUIDE.es.md) · [Français](./LOCALE-ASSETS-GUIDE.fr.md) · [हिन्दी](./LOCALE-ASSETS-GUIDE.hi.md) · [日本語](./LOCALE-ASSETS-GUIDE.ja.md) · [한국어](./LOCALE-ASSETS-GUIDE.ko.md) · [Português (Brasil)](./LOCALE-ASSETS-GUIDE.pt-BR.md) · [中文 (中国大陆)](./LOCALE-ASSETS-GUIDE.zh-CN.md) · [中文 (台灣)](./LOCALE-ASSETS-GUIDE.zh-TW.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [ai-i18n-tools 在資源處理上的功能與限制](#what-ai-i18n-tools-does-and-does-not-do-with-assets)
- [從一開始就為 i18n 設計](#design-for-i18n-from-the-start)
  - [使用 `docsOutput.style = "flat"` 的 Markdown（README、USER-GUIDE）](#markdown-with-docsoutputstyle--flat-readme-user-guide)
  - [文件系統網站（`docsOutput.style = "doc-system"`）](#doc-system-sites-docsoutputstyle--doc-system)
    - [Docusaurus 預設設定](#docusaurus-preset)
    - [Astro/Starlight 預設設定](#astrostarlight-preset)
  - [使用 SVG 資源的 Web 應用（Next.js、Vite 等）](#web-apps-nextjs-vite-etc-with-svg-assets)
- [決策指南](#decision-guide)
- [模式 A - 共用點陣圖](#pattern-a---shared-raster)
  - [實作範例](#implementation-example)
- [模式 B - 每語系資料夾（URL 重寫）](#pattern-b---per-locale-folder-url-rewriting)
  - [目錄結構](#directory-layout)
  - [截圖指令碼合約](#screenshot-script-contract)
  - [設定 - `docsOutput.style = "flat"`](#config---docsoutputstyle--flat)
  - [設定 - `docsOutput.style = "doc-system"`](#config---docsoutputstyle--doc-system)
  - [預設設定 - `docsOutput.style = "docusaurus"`](#preset---docsoutputstyle--docusaurus)
  - [預設設定 - `docsOutput.style = "astro-starlight"`](#preset---docsoutputstyle--astro-starlight)
- [模式 C - 共置點陣圖（`doc-system`）](#pattern-c---colocated-raster-doc-system)
  - [目錄結構](#directory-layout-1)
  - [截圖指令碼合約](#screenshot-script-contract-1)
  - [設定](#config)
  - [先決條件](#prerequisites)
  - [實作範例](#implementation-example-1)
- [模式 D - 使用 `svg.style = "flat"` 翻譯 SVG](#pattern-d---translated-svg-with-svgstyle--flat)
  - [設定](#config-1)
  - [應用程式參考](#app-reference)
  - [建議的原始碼目錄結構](#source-layout-recommendation)
  - [實作範例](#implementation-example-2)
- [模式 E - 共置翻譯 SVG（文件系統）](#pattern-e---colocated-translated-svg-doc-system)
  - [設定](#config-2)
  - [原始 Markdown](#source-markdown)
  - [SVG 原始檔位置](#svg-source-location)
  - [`pathTemplate` 暫存變數](#pathtemplate-placeholders)
  - [實作範例](#implementation-example-3)
- [扁平連結重寫器與兩步流程](#the-flat-link-rewriter-and-two-step-flow)
  - [當 `docsOutput.style = "flat"` 時的兩步流程](#two-step-flow-when-docsoutputstyle--flat)
  - [使用 `flatPreserveRelativeDir` 的每檔案深度前綴](#per-file-depth-prefix-with-flatpreserverelativedir)
  - [`rewriteRelativeLinks` 與 `linkRewriteDocsRoot`](#rewriterelativelinks-and-linkrewritedocsroot)
- [常見錯誤與疑難排解](#common-mistakes-and-troubleshooting)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

---

<a id="what-ai-i18n-tools-does-and-does-not-do-with-assets"></a>
## ai-i18n-tools 在資源處理上的功能（與限制）

`translate-docs` 會翻譯 Markdown/MDX 內容（包含圖片的替代文字），但不會複製、產生或輸出點陣圖檔案。如果翻譯後的頁面需要特定語系的截圖，您必須將該檔案放置在翻譯後 Markdown 所引用的路徑中。

`translate-svg` 是唯一會輸出語系專屬二進位檔案的指令。它會讀取原始 SVG 檔案，翻譯文字元素（`<text>`、`<title>`、`<desc>`），並為每個語系寫入一個輸出 SVG。此工具絕不會寫入點陣圖檔案（PNG、JPEG、WebP、GIF）。

---

<a id="design-for-i18n-from-the-start"></a>
## 從一開始就為 i18n 設計

在尚未建立任何截圖前，選擇正確的目錄結構，是未來能否輕鬆管理語系專屬資源的最重要因素。若在已提交數十張截圖後才重新調整結構，將需要重組路徑並更新每一個 Markdown 引用。

<a id="markdown-with-docsoutputstyle--flat-readme-user-guide"></a>
### 使用 `docsOutput.style = "flat"` 的 Markdown（README、USER-GUIDE）

從第一天起就將截圖儲存在以語系編碼的子目錄中：

```
images/screenshots/en-GB/translate.png
images/screenshots/en-GB/settings.png
```

當您日後加入 i18n 時，您的 `take-screenshots` 指令碼會為每種語系寫入 `images/screenshots/<locale>/`，並由一條 `regexAdjustments` 規則統一處理所有語系：

```json
{
  "search": "images/screenshots/[^/]+/",
  "replace": "images/screenshots/${translatedLocale}/"
}
```

通用的 `[^/]+` 模式可匹配任何語系資料夾名稱——請勿將原始語系（例如 `screenshots/en-GB/`）寫死，因為一旦 `sourceLocale` 更改，這將導致問題。

若您一開始的路徑未包含語系子目錄（`images/screenshots/translate.png`），則在使用模式 B 之前，您必須重新組織整個目錄結構。

<a id="doc-system-sites-docsoutputstyle--doc-system"></a>
### 文件系統網站（`docsOutput.style = "doc-system"`）

適用於將翻譯頁面儲存在語系前綴目錄下的靜態文件網站——如 Docusaurus i18n、Astro Starlight，以及遵循相同結構的自訂產生器。`docsRoot` 下的檔案將被寫入至：

```text
{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}
```

將 `docs[].docsOutput.docsRoot` 設定為您的英文原始碼根目錄（例如 `"docs"` 或 `"src/content/docs"`）。當您直接設定 `style: "doc-system"` 時，也必須設定 `localeSubpath`，以指定網站在 `{locale}/` 與翻譯檔案之間使用的路徑片段。別名 `"docusaurus"` 與 `"astro-starlight"` 是預設的 `doc-system` 版面配置，並具有預設的 `localeSubpath` 值（參見 [輸出版面配置](GETTING_STARTED.zh-TW.md#output-layouts)）。

| 預設別名 | 預設 `localeSubpath` | 範例輸出 |
|--------------|-------------------------|----------------|
| `"docusaurus"` | `docusaurus-plugin-content-docs/current` | `i18n/de/docusaurus-plugin-content-docs/current/guide.md` |
| `"astro-starlight"` | `""`（空） | `src/content/docs/de/guide.md` |

扁平連結重寫器在 `doc-system` 上**不會**運行（不同於 `"flat"`）。`postProcessing.regexAdjustments` 會看到原始 Markdown 中的 URL——通常是像 `/img/screenshots/en-GB/foo.png` 這樣的絕對路徑或網站根路徑。

**模式 B** 適用於截圖位於共用靜態 URL 樹狀結構的情境：從第一天起就使用帶語系編碼的資料夾，並設定一條通用的 `screenshots/[^/]+/` → `screenshots/${translatedLocale}/` 規則（參見 [設定 — 文件系統](#config---docsoutputstyle--doc-system)）。

**Pattern C** 適用於每種語系的翻譯文件將資源與 Markdown 置於同一位置（不進行 URL 重寫）的情況。您的截圖指令碼必須將 PNG 寫入由 `{outputDir}`、`{locale}` 和 `{localeSubpath}` 衍生出的路徑中——以下 Docusaurus 預設是參考佈局。

<a id="docusaurus-preset"></a>
#### Docusaurus 預設

在專案設定時建立兩個習慣，可完全避免日後使用正規表示式橋接：

1. 在新增任何截圖之前，先建立一個符號連結 `documentation/docs/assets → ../static/assets`。Docusaurus 的 webpack 預設會追蹤符號連結，這可讓原始文件使用相對路徑，翻譯後的文件也能沿用相同的路徑。

2. 將所有文件資源（PNG 和 SVG 檔案）都放在 `static/assets/`（單一目錄）中。不要將它們分開存放在 `static/img/`（SVG）和 `static/assets/`（PNG）中。統一存放位置可讓每一份文件頁面（不論是英文或翻譯版）都能引用相同的相對路徑 `../assets/name.ext`。

在原始 Markdown 中引用資源時，一律使用穩定的相對路徑 `../assets/name.ext`。切勿對文件資源使用絕對路徑 `/img/` 或 `/assets/` 的 URL —— 這些 URL 在英文原始檔（由 `static/` 提供服務）與翻譯語系（與翻譯文件共置）之間會有所不同，這將迫使你必須使用 `regexAdjustments` 規則來橋接。

當您日後加入 i18n 時，截圖指令碼會採用 `getScreenshotDir` 的分割方式（參見 [模式 C](#pattern-c---colocated-raster-doc-system)），而 `translate-svg` 會使用 `pathTemplate`。無需調整正規表示式。

> **注意：** `resolve.symlinks = false` 在 `next.config.ts` 中僅會停用 Next.js 應用程式的 webpack 建置對符號連結的解析。這不會影響使用獨立 webpack 實例的 Docusaurus 文件網站建置。

<a id="astrostarlight-preset"></a>
#### Astro/Starlight 預設設定

等同於使用 `docsOutput.style = "doc-system"` 搭配 `localeSubpath: ""` —— 翻譯頁面直接位於 `{outputDir}/{locale}/` 之下。

從第一天起就將截圖儲存在以語系編碼的路徑下：

```
public/img/screenshots/en-GB/screenshot.png
```

在 `regexAdjustments` 中使用通用的正規表示式：

```json
{
  "search": "screenshots/[^/]+/",
  "replace": "screenshots/${translatedLocale}/"
}
```

<a id="web-apps-nextjs-vite-etc-with-svg-assets"></a>
### 使用 SVG 資源的 Web 應用程式（Next.js、Vite 等）

將 SVG 原始檔放在專用的原始碼目錄中（例如 `images/` 或 `src/assets/`），並設定 `svg.outputDir` 到一個獨立的服務目錄（例如 `public/assets/`）。切勿將原始 SVG 檔案與 `translate-svg` 輸出檔混在同一個資料夾中 —— 否則將無法分辨哪些檔案是生成的。

從一開始就設計可翻譯的 SVG：對所有可讀文字標籤使用 `<text>`、`<title>` 和 `<desc>` 元素。避免將文字嵌入為路徑資料。

在 `svg` 的設定區塊中啟用 `forceLowercase: true`，以避免在不同檔案系統和 CDN 上因大小寫敏感度不同而產生問題。

---

<a id="decision-guide"></a>
## 決策指南

```
Is the asset an SVG with translatable text or labels?
  Yes → Pattern D (web app) or Pattern E (doc-system colocated)
  No (raster screenshot or decorative SVG) →
    doc-system site with assets colocated beside translated docs?
      Yes → Pattern C (rasters) + Pattern E (SVGs)
    Only one locale needs the image (no per-locale variants)?
      Yes → Pattern A
    Otherwise → Pattern B
```

| 模式 | 資源類型                  | 網站類型                                                                 | 工具機制                                               |
|---------|-----------------------------|---------------------------------------------------------------------------|--------------------------------------------------------------|
| A       | 點陣圖（共用）             | `docsOutput.style = "flat"` 文件                                      | 每檔案連結重寫器；通常無需正規表示式                     |
| B       | 點陣圖（依語系）         | `"flat"` 或 `"doc-system"`（包含 `"docusaurus"`、`"astro-starlight"`）    | `regexAdjustments` 語系區段替換                       |
| C       | 點陣圖（共置）          | `"doc-system"` 搭配共置資源（Docusaurus 預設設定）                  | 截圖指令碼自動放置檔案；無需正規表示式                     |
| D       | SVG（可翻譯）            | Web 應用程式                                                                   | `translate-svg` 搭配 `svg.style = "flat"`                    |
| E       | SVG（可翻譯，共置） | `"doc-system"` 搭配共置資源（Docusaurus 預設設定）                  | `translate-svg` 搭配 `svg.style = "nested"` + `pathTemplate` |

---

<a id="pattern-a---shared-raster"></a>
## 模式 A - 共享光柵圖

當單一影像在所有語系之間共用時使用（無需為每個語系提供不同版本）。當啟用 `docsOutput.style = "flat"` 時，平坦連結重寫器會根據每個輸出檔案計算深度前綴，因此與原始檔位於同一目錄的資源（例如 `docs/figure.png`，從 `docs/page.md` 以 `figure.png` 引用）能在所有翻譯後的輸出中正確解析——無需設定 `postProcessing.regexAdjustments` 規則。

範例：此套件會將 `docs/GETTING_STARTED.md` 轉譯為 `translated-docs/docs/GETTING_STARTED.<locale>.md`。兄弟圖像 `docs/translation-dashboard.png` 被引用為 `translation-dashboard.png`。重寫器會根據輸出檔案的目錄回溯至原始目錄（`../../docs/`）來計算每個檔案的前綴，產生 `../../docs/translation-dashboard.png`。從 `translated-docs/docs/` 來看，這會正確解析為 `docs/translation-dashboard.png`。

當儀表板 UI 變更時，請使用 [`scripts/screenshot-translation-dashboard.sh`](../../docs/../scripts/screenshot-translation-dashboard.sh) 重新整理 PNG；此圖像不依語系而異。

在以下情況仍需要 `postProcessing` 規則：
- 資源透過絕對 URL 引用（例如 `/img/figure.png`）——重寫器僅處理相對路徑
- 出於其他原因需變更資源 URL（例如切換至 CDN）

<a id="implementation-example"></a>
### 實作範例

此儲存庫對「翻譯儀表板」截圖使用模式 A：[GETTING_STARTED.md](GETTING_STARTED.zh-TW.md#translation-dashboard) 引用同一資料夾中的影像 [translation-dashboard.png](../../docs/../docs/translation-dashboard.png)。[ai-i18n-tools.config.json](../../docs/../ai-i18n-tools.config.json) 設定了 `docsOutput.style = "flat"` 和 `flatPreserveRelativeDir: true`；每檔案的深度前綴會自動解析影像路徑，無需針對截圖設定 `regexAdjustments`。

---

<a id="pattern-b---per-locale-folder-url-rewriting"></a>
## 模式 B - 按語系資料夾（URL 重寫）

適用於包含 `docsOutput.style = "flat"` 的 README/USER-GUIDE，以及從共用靜態 URL 樹提供截圖的文件系統網站（`docsOutput.style = "doc-system"` 或別名 `"docusaurus"` / `"astro-starlight"`）。

<a id="directory-layout"></a>
### 目錄結構

<details>
<summary>各區域設定範例螢幕擷圖目錄樹</summary>

```
images/screenshots/
├── en-GB/
│   ├── translate.png
│   └── settings.png
├── de/
│   ├── translate.png
│   └── settings.png
└── fr/
    ├── translate.png
    └── settings.png
```

</details>

原始 Markdown 檔案引用原始語系資料夾：

```markdown
![Translate tab](../../docs/images/screenshots/en-GB/translate.png)
```

<a id="screenshot-script-contract"></a>
### 截圖腳本合約

`take-screenshots` 腳本必須為所有語系寫入檔案——不僅限於原始語系。`translate-docs` 命令會重寫路徑但不會建立檔案。常見模式為：

```js
function getScreenshotDir(locale) {
  return `images/screenshots/${locale}`;
}
```

請參閱 [examples/nextjs-app 中的螢幕截圖指令碼](../../docs/../examples/nextjs-app/scripts/screenshot-locales.sh) 中的簡單 `bash` 範例，或 [Transrewrt 專案](https://github.com/wsj-br/transrewrt) 儲存庫中更複雜的 [take-screenshots.js](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) 範例。

> **注意：** 以下四個子章節共用相同的 `regexAdjustments` 語系區段替換（`screenshots/[^/]+/` → `screenshots/${translatedLocale}/`）。僅輸出佈局以及是否先執行平坦連結重寫器有所不同——請跳至符合您 `docsOutput.style` 的子章節。

<a id="config---docsoutputstyle--flat"></a>
### 設定 - `docsOutput.style = "flat"`

當設定 `docsOutput.style = "flat"` 時，平坦連結重寫器會優先執行，並為非 Markdown 的 URL 添加深度前綴。對於位於儲存庫根目錄且設定為 `outputDir: "translated-docs/"` 的 `README.md`，會添加 `../`：

```
images/screenshots/en-GB/translate.png  →  ../images/screenshots/en-GB/translate.png
```

接著 `regexAdjustments` 規則會替換已添加前綴的 URL 中的語系區段：

<details>
<summary>平面配置的 regexAdjustments 範例</summary>

```json
"docsOutput": {
  "style": "flat",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders",
        "search": "images/screenshots/[^/]+/",
        "replace": "images/screenshots/${translatedLocale}/"
      }
    ]
  }
}
```

</details>

結果：`../images/screenshots/de/translate.png` —— 從 `translated-docs/README.de.md` 正確回溯至儲存庫根目錄的相對路徑。

`postProcessing` 步驟在平面連結重寫器之後執行。撰寫 `search` 模式時，應匹配已添加前綴 URL 中任意位置的語系區段——無需在模式中包含 `../` 前綴。

實作範例（正式環境）：[Transrewrt](https://github.com/wsj-br/transrewrt) — [README.md](https://github.com/wsj-br/transrewrt/blob/main/README.md) 中的截圖 URL（`images/screenshots/en-GB/…`），[ai-i18n-tools.config.json](https://github.com/wsj-br/transrewrt/blob/main/ai-i18n-tools.config.json) 中的語系重寫，擷取指令碼 [take-screenshots.js](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts)（參見上方的 [截圖指令碼合約](#screenshot-script-contract)）。

實作範例（示範設定）：[examples/nextjs-app](../../docs/../examples/nextjs-app/) — [ai-i18n-tools.config.json](../../docs/../examples/nextjs-app/ai-i18n-tools.config.json) 中的第二個 `docs[]` 區塊（`images/screenshots/[^/]+/` → `${translatedLocale}`）；輔助指令碼 [screenshot-locales.sh](../../docs/../examples/nextjs-app/scripts/screenshot-locales.sh)。

<a id="config---docsoutputstyle--doc-system"></a>
### 設定 - `docsOutput.style = "doc-system"`

適用於任何透過共用靜態 URL 前綴引用螢幕截圖的文件系統網站的通用模式 B。平面連結重寫器不會執行；`postProcessing` 會重寫原始 Markdown URL 中的地區設定區段。

<details>
<summary>文件系統配置的 regexAdjustments 範例</summary>

```json
"docsOutput": {
  "style": "doc-system",
  "docsRoot": "docs",
  "localeSubpath": "your-generator/locale/content/path",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders in static assets",
        "search": "screenshots/[^/]+/",
        "replace": "screenshots/${translatedLocale}/"
      }
    ]
  }
}
```

</details>

設定 `localeSubpath` 以符合你的產生器在 `{locale}/` 與翻譯後檔案之間的佈局，或在預設值適用時使用預設別名（`"docusaurus"`、`"astro-starlight"`）取代 `"doc-system"`。原始 Markdown 通常會在 URL 中嵌入原始地區設定：

```markdown
![Screenshot](../../docs//img/screenshots/en-GB/screenshot.png)
```

為每個目標地區設定在相同路徑下提供對應的 PNG 檔案（例如 `static/img/screenshots/de/screenshot.png`）。建議使用 `screenshots/[^/]+/` 而非硬編碼 `screenshots/en-GB/`，以便規則能在 `sourceLocale` 變更時仍然有效。

<a id="preset---docsoutputstyle--docusaurus"></a>
### 預設 - `docsOutput.style = "docusaurus"`

與 `"doc-system"` 相同，但使用預設 `localeSubpath = "docusaurus-plugin-content-docs/current"`。平面連結重寫器不會執行。`postProcessing` 會看到原始的 Markdown URL。英文頁面通常使用包含原始地區設定的絕對路徑：

```markdown
![Screenshot](../../docs//img/screenshots/en-GB/screenshot.png)
```

<details>
<summary>Docusaurus 預設設定的 regexAdjustments 範例</summary>

```json
"docsOutput": {
  "style": "docusaurus",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders in docs-site static assets",
        "search": "screenshots/[^/]+/",
        "replace": "screenshots/${translatedLocale}/"
      }
    ]
  }
}
```

</details>

在 `docs-site/static/img/screenshots/<locale>/screenshot.png` 提供對應的 PNG 檔案。對於與原始地區設定無關的設定，建議使用 `screenshots/[^/]+/` 而非 `screenshots/en-GB/`。

實作範例：[examples/nextjs-app/docs-site/docs/feature-showcase.md](../../docs/../examples/nextjs-app/docs-site/docs/feature-showcase.md)（`/img/screenshots/en-GB/screenshot.png`）搭配 [ai-i18n-tools.config.json](../../docs/../examples/nextjs-app/ai-i18n-tools.config.json) 中的第一個 `docs[]` 區塊。

<a id="preset---docsoutputstyle--astro-starlight"></a>
### 預設 - `docsOutput.style = "astro-starlight"`

與 `"doc-system"` 相同，但使用 `localeSubpath: ""` — 翻譯後的頁面直接位於 `{outputDir}/{locale}/` 下方。與上述通用文件系統設定使用相同的模式 B 原則。原始 Markdown 使用 `/img/screenshots/en-GB/screenshot.png`：

<details>
<summary>Astro Starlight 預設設定的 regexAdjustments 範例</summary>

```json
"docsOutput": {
  "style": "astro-starlight",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders in public assets",
        "search": "screenshots/[^/]+/",
        "replace": "screenshots/${translatedLocale}/"
      }
    ]
  }
}
```

</details>

在 `public/img/screenshots/<locale>/screenshot.png` 提供 PNG 檔案。

實作範例：[examples/astro-docs](../../docs/../examples/astro-docs/) — [feature-showcase.mdx](../../docs/../examples/astro-docs/src/content/docs/feature-showcase.mdx) 與 [ai-i18n-tools.config.json](../../docs/../examples/astro-docs/ai-i18n-tools.config.json)（`screenshots/[^/]+/`）。

---

<a id="pattern-c---colocated-raster-doc-system"></a>
## 模式 C - 共置光柵圖（`doc-system`）

當 `doc-system` 網站將特定語系的資源與翻譯後的 Markdown 檔案共置時使用——無需 URL 重寫。Docusaurus 預設（`docsOutput.style = "docusaurus"`）為參考實作；其他使用 `"doc-system"` 搭配自訂 `localeSubpath` 的產生器也遵循相同概念：英文資源存放於原始語系路徑，翻譯後資源則存放於 `{outputDir}/{locale}/[localeSubpath/]assets/` 下。

<a id="directory-layout-1"></a>
### 目錄結構

<details>
<summary>共置資源目錄樹範例（Docusaurus）</summary>

```
documentation/
├── static/
│   └── assets/
│       ├── screen-dashboard.png   ← en-GB screenshots (source locale)
│       └── screen-toolbar.png
├── docs/
│   └── assets → ../static/assets  ← symlink; webpack follows it
└── i18n/
    ├── de/
    │   └── docusaurus-plugin-content-docs/current/assets/
    │       ├── screen-dashboard.png   ← de screenshots
    │       └── screen-toolbar.png
    └── fr/
        └── docusaurus-plugin-content-docs/current/assets/
            ├── screen-dashboard.png
            └── screen-toolbar.png
```

</details>

所有地區的文件都使用相同的相對路徑：

```markdown
![Dashboard](../../docs/../assets/screen-dashboard.png)
```

對於英文（`en-GB`）地區，`../assets/` 會透過符號連結解析至 `static/assets/`。對於翻譯後的地區，則直接解析至該地區自己的 `current/assets/` 目錄。

<a id="screenshot-script-contract-1"></a>
### 螢幕截圖腳本合約

該腳本必須將 PNG 寫入每個語系的正確目錄。`getScreenshotDir` 函數對拆分進行編碼：

```js
function getScreenshotDir(locale) {
  if (locale === 'en-GB') return 'documentation/static/assets';
  return `documentation/i18n/${locale}/docusaurus-plugin-content-docs/current/assets`;
}
```

請參見 [duplistatus](https://github.com/wsj-br/duplistatus) 儲存庫中 [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) 的正式環境實作（本地參考副本：[references/duplistatus/scripts/take-screenshots.ts](../../docs/../references/duplistatus/scripts/take-screenshots.ts)）。

<a id="config"></a>
### 設定

點陣圖檔案不需要 `regexAdjustments` 規則。`translate-docs` 會翻譯 Markdown 中的替代文字，但 URL 保持不變：

```json
{
  "docsOutput": {
    "style": "docusaurus",
    "docsRoot": "documentation/docs"
  }
}
```

如果專案也使用翻譯過的 SVG，則 Pattern E 會處理它們，並將它們與 PNG 一起放置在 `current/assets/` 目錄中，無需額外的正則表達式。

<a id="prerequisites"></a>
### 前置條件

- 必須存在 `docs/assets` 符號連結：`ln -s ../static/assets documentation/docs/assets`
- Docusaurus webpack 預設會追蹤符號連結（在 Docusaurus 建置中 `resolve.symlinks` 預設為 `true`）
- 符號連結只需存在於原始語系中——翻譯建置不會使用它

<a id="implementation-example-1"></a>
### 實作範例

[duplistatus](https://github.com/wsj-br/duplistatus) — [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) 中的 `getScreenshotDir(locale)`；英文文件引用共置的 PNG 檔案（例如 [dashboard.md](../../docs/../references/duplistatus/documentation/docs/user-guide/dashboard.md) 搭配 `../assets/screen-dashboard-summary.png`）；[ai-i18n-tools.config.json](../../docs/../references/duplistatus/ai-i18n-tools.config.json) 中無需 PNG `regexAdjustments`。同一專案中的模式 E SVG 檔案也存放於相同的 `current/assets/` 目錄中（見下文）。

---

<a id="pattern-d---translated-svg-with-svgstyle--flat"></a>
## 模式 D - 翻譯 SVG 搭配 `svg.style = "flat"`

當 Web 應用程式在執行時根據語系代碼嵌入特定語系的 SVG 插圖或圖表時使用。

<a id="config-1"></a>
### 設定

```json
"features": {
  "translateSVG": true
},
"svg": {
  "sourcePath": "images",
  "outputDir": "public/assets",
  "style": "flat"
}
```

`translate-svg` 讀取 `images/` 下的每一個 `.svg`，並為每個語系寫入一個檔案：

```
public/assets/
├── dashboard.en-GB.svg
├── dashboard.de.svg
├── dashboard.fr.svg
└── dashboard.es.svg
```

<a id="app-reference"></a>
### 應用程式參考

```tsx
<img src={`/assets/dashboard.${locale}.svg`} alt="Dashboard diagram" />
```

<a id="source-layout-recommendation"></a>
### 建議的原始檔佈局

將原始 SVG 與輸出目錄分開。使用 `sourcePath: "images"` 和 `outputDir: "public/assets"` 時，這兩個目錄是分離的。切勿將兩者設定為同一目錄。

<a id="implementation-example-2"></a>
### 實作範例

[examples/nextjs-app](../../docs/../examples/nextjs-app/) — [ai-i18n-tools.config.json](../../docs/../examples/nextjs-app/ai-i18n-tools.config.json) 中的 `svg` 區塊（`sourcePath: "images"`、`outputDir: "public/assets"`、`svg.style = "flat"`）；原始檔 [translation_demo_svg.svg](../../docs/../examples/nextjs-app/images/translation_demo_svg.svg)；每個語系的輸出位於 [public/assets/](../../docs/../examples/nextjs-app/public/assets/) 下（例如 `translation_demo_svg.de.svg`）；[page.tsx](../../docs/../examples/nextjs-app/src/app/page.tsx) 中的執行階段 URL（`/assets/translation_demo_svg.${locale}.svg`）。

---

<a id="pattern-e---colocated-translated-svg-doc-system"></a>
## 模式 E - 共置的已翻譯 SVG（文件系統）

適用於文件系統網站，其中翻譯過的 SVG 插圖必須與每個語系內容目錄中的翻譯文件一起出現——與 Pattern C 點陣圖截圖的位置相同。Docusaurus 預設設定是主要範例。

<a id="config-2"></a>
### 設定

```json
"features": {
  "translateSVG": true
},
"svg": {
  "sourcePath": [
    "documentation/static/assets/diagram.svg"
  ],
  "outputDir": "documentation/i18n",
  "style": "nested",
  "pathTemplate": "{outputDir}/{locale}/docusaurus-plugin-content-docs/current/assets/{basename}",
  "forceLowercase": true
}
```

`translate-svg` 會將每種語系的 SVG 分別寫入與 Pattern C 用於 PNG 的相同 `current/assets/` 目錄中：

```
documentation/i18n/de/docusaurus-plugin-content-docs/current/assets/diagram.svg
documentation/i18n/fr/docusaurus-plugin-content-docs/current/assets/diagram.svg
```

<a id="source-markdown"></a>
### 原始 Markdown

所有語系的文件都使用相同的相對路徑：

```markdown
![Diagram](../../docs/../assets/diagram.svg)
```

對於英文語系，符號連結 `docs/assets → ../static/assets` 可解決此問題。對於翻譯語系，則直接解析至 `current/assets/`。

不需要 `regexAdjustments` 規則，因為英文原始文件與翻譯輸出文件使用相同的路徑。

<a id="svg-source-location"></a>
### SVG 原始檔案位置

建議：將原始 SVG 檔案與 en-GB 的 PNG 檔案一起儲存在 `documentation/static/assets/` 中。這樣可將所有文件資源集中管理，且相同的 `docs/assets` 符號連結可同時涵蓋兩者。`svg.sourcePath` 項目則指向 `documentation/static/assets/name.svg`。

<a id="pathtemplate-placeholders"></a>
### `pathTemplate` 樣板變數

| 樣板變數              | 值                                                  |
|--------------------------|--------------------------------------------------------|
| `{outputDir}`            | `svg.outputDir` 的絕對解析路徑              |
| `{locale}`               | 目標語系代碼                                     |
| `{LOCALE}`               | 大寫的語系代碼                                 |
| `{relPath}`              | 從 `sourcePath` 根目錄到原始 SVG 的相對路徑 |
| `{stem}`                 | 不含副檔名的檔案名稱                             |
| `{basename}`             | 含副檔名的檔案名稱                                |
| `{extension}`            | 包含點號的副檔名                                |
| `{relativeToSourceRoot}` | 從最近的 `sourcePath` 根目錄出發的相對路徑       |

完整參考請見 [svg 設定表格](GETTING_STARTED.zh-TW.md#svg)。

<a id="implementation-example-3"></a>
### 實作範例

[duplistatus](https://github.com/wsj-br/duplistatus) — 在 [ai-i18n-tools.config.json](../../docs/../references/duplistatus/ai-i18n-tools.config.json) 中使用巢狀 `svg` 區塊與 `pathTemplate`；原始 SVG 檔案列於 `documentation/static/img/` 下（例如 [duplistatus_toolbar.svg](../../docs/../references/duplistatus/documentation/static/img/duplistatus_toolbar.svg)）；`translate-svg` 將每語系檔案寫入 `documentation/i18n/<locale>/…/current/assets/`，與 Pattern C 的 PNG 檔案並列；目前文件透過 `/img/duplistatus_*.svg` 嵌入這些 SVG（例如 [overview.md](../../docs/../references/duplistatus/documentation/docs/user-guide/overview.md)）。詳情請見 [task-locale-assets-simplification.md](../../docs/../references/duplistatus/dev/task-locale-assets-simplification.md)，其中說明了未來將遷移至 `../assets/` 路徑並移除 SVG `regexAdjustments` 橋接的計畫。

---

<a id="the-flat-link-rewriter-and-two-step-flow"></a>
## 平面連結重寫器與兩步流程

對於 `docsOutput.style = "flat"`（除非設定了 `rewriteRelativeLinks: false` 或自訂的 `pathTemplate`），在 `postProcessing` 之前會執行內建的重寫器。它會處理文件間連結（加入語系後綴）並將深度前綴添加至非 Markdown 的資源 URL 前面。

<a id="two-step-flow-when-docsoutputstyle--flat"></a>
### 當 `docsOutput.style = "flat"` 時的兩步流程

```
source URL  →  [flat link rewriter: depth prefix]  →  [postProcessing: locale segment]  →  output URL
```

以 `outputDir: "translated-docs/"` 和位於儲存庫根目錄的來源 `README.md` 為例：

1. 平面連結重寫器：`images/screenshots/en-GB/foo.png` → `../images/screenshots/en-GB/foo.png`（每個 `../` 對應一個 `translated-docs/`）
2. `postProcessing` 正則表達式 `images/screenshots/[^/]+/` → `images/screenshots/${translatedLocale}/`：`../images/screenshots/de/foo.png`

對於 `docsOutput.style = "doc-system"`（包含 `"docusaurus"`、`"astro-starlight"` 和 `"nested"`），平面連結重寫器不會執行。`postProcessing` 會看到來自已翻譯 Markdown 的原始 URL（通常是像 `/img/screenshots/en-GB/foo.png` 這樣的絕對路徑）。

<a id="per-file-depth-prefix-with-flatpreserverelativedir"></a>
### 使用 `flatPreserveRelativeDir` 的每檔案深度前綴

深度前綴是針對每個輸出檔案個別計算的，而非針對整個批次作業全局計算。對於每個來源檔案，重寫器會計算從輸出檔案目錄回到來源檔案目錄的相對路徑，並將其用作前綴。

這表示使用 `flatPreserveRelativeDir: true` 時，子目錄中的原始檔案會自動取得正確的前綴。例如，`docs/GETTING_STARTED.md` 輸出至 `translated-docs/docs/GETTING_STARTED.<locale>.md`。每個檔案的前綴為 `../../docs/`，因此資源 `translation-dashboard.png`（相對於原始檔案）會變成 `../../docs/translation-dashboard.png` — 從 `translated-docs/docs/` 回溯至 `docs/translation-dashboard.png` 時可正確解析。

對於與來源檔案同目錄的相對路徑資源，不需要進行 `postProcessing` 正則表達式修正。

<a id="rewriterelativelinks-and-linkrewritedocsroot"></a>
### `rewriteRelativeLinks` 與 `linkRewriteDocsRoot`

| 選項                                   | 效果                                                                                                           |
|------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| `docsOutput.rewriteRelativeLinks`    | 明確啟用或停用平面連結重寫器（當 `docsOutput.style = "flat"` 時會覆寫預設值） |
| `docsOutput.linkRewriteDocsRoot`     | 計算 `depthPrefix` 的根目錄（預設為 `"."`）                                                        |
| `docsOutput.flatPreserveRelativeDir` | 影響輸出路徑的佈局，重寫器在計算已知翻譯檔案的目標路徑時會使用此佈局       |

---

<a id="troubleshooting"></a>
<a id="common-mistakes-and-troubleshooting"></a>
## 常見錯誤與疑難排解

**截圖路徑中缺少語系目錄**
`images/screenshots/screenshot.png` — 無法區分語系變體，也無法重寫。在套用模式 B 前，請先重構為 `images/screenshots/<locale>/screenshot.png`。

**在正則表達式中硬編碼來源語系**
`"search": "screenshots/en-GB/"` — 若 `sourceLocale` 更改時會靜默失效。請改用 `"search": "screenshots/[^/]+/"`。

**SVG 來源與輸出位於相同目錄**
若 `svg.sourcePath` 與 `svg.outputDir` 重疊，產生的檔案將與手動編輯的來源混雜。請將它們放在不同的目錄中。

**共置 SVG 使用絕對的 Docusaurus 靜態 URL**
`/img/diagram.svg`（來自 `static/img/`）需要 `regexAdjustments` 規則，才能在翻譯輸出中重寫為 `../assets/`。請將來源 SVG 放在 `static/assets/` 中，並從一開始就使用相對的 `../assets/diagram.svg` 以完全避免此問題。

**Docusaurus 中缺少 `docs/assets` 符號連結**
若無符號連結，位於 `docs/user-guide/` 的來源文件將無法透過相對路徑引用 `static/assets/` 中的 PNG 或 SVG。請在專案建立時設定符號連結：`ln -s ../static/assets documentation/docs/assets`。

**`take-screenshots` 指令碼僅會擷取來源語系**
模式 B 需要為每種語系提供 PNG 檔案。如果指令碼僅擷取 `en-GB`，翻譯後的文件將會有重新寫入的路徑，但指向遺失的檔案。
