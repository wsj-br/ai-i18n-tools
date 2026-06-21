<a id="locale-assets-guide"></a>
# 區域性資產指南

本指南涵蓋了在專案中使用 `ai-i18n-tools` 時如何處理區域性特定資產（螢幕截圖（PNG、JPEG、WebP）和插圖 SVG 檔案）。它解釋了每種可用模式、何時使用它，以及如何從頭開始設定專案，以便日後新增更多區域性時無需進行結構性重構。

如需 SVG 設定參考，請參閱 [GETTING_STARTED.md](GETTING_STARTED.zh-Hant.md) 中的 [`svg`](#svg) 章節。如需 `postProcessing.regexAdjustments` 選項，請參閱 [設定參考](GETTING_STARTED.zh-Hant.md#configuration-reference)。

| 設定路徑 | 值 | 使用案例 | 備註 |
|-------------|-------|----------|-------|
| `docs[].docsOutput.style` | `"flat"` | 區域性後綴的 README / USER-GUIDE 檔案 | 啟用平面連結重寫器；當來源位於子目錄中時，請與 `flatPreserveRelativeDir` 配對 |
| `docs[].docsOutput.style` | `"nested"` (預設) | `outputDir` 下的簡單區域性子資料夾 | 無平面連結重寫器 |
| `docs[].docsOutput.style` | `"doc-system"` | 區域性前綴的文件樹（自訂產生器） | 設定 `docsRoot` 和 `localeSubpath`；平面連結重寫器不會執行 |
| `docs[].docsOutput.style` | `"docusaurus"` / `"astro-starlight"` | 預設的 `doc-system` 版面配置 | 針對 `localeSubpath` 的產生器特定預設值的別名 |
| `svg.style` | `"flat"` | Web 應用程式（`name.<locale>.svg` 在 `public/assets/` 中） | 與 markdown `style` 分開；由 `translate-svg` 使用 |
| `svg.style` | `"nested"` | 文件系統共置的 SVG 輸出 | 通常與 `pathTemplate`（模式 E）配對 |

本指南使用設定中的確切 JSON 字串，而非僅使用英文單字，因此翻譯後的副本將保持無歧義。載入時接受舊版金鑰（`documentations`、`markdownOutput`）；在新設定中偏好使用 `docs` 和 `docsOutput`。

<small>**以其他語言閱讀：** </small>
<small id="lang-list">[English (UK)](../../docs/LOCALE-ASSETS-GUIDE.md) · [Deutsch](./LOCALE-ASSETS-GUIDE.de.md) · [Español](./LOCALE-ASSETS-GUIDE.es.md) · [Français](./LOCALE-ASSETS-GUIDE.fr.md) · [Hindi (Roman)](./LOCALE-ASSETS-GUIDE.hi-Latn.md) · [日本語](./LOCALE-ASSETS-GUIDE.ja.md) · [한국어](./LOCALE-ASSETS-GUIDE.ko.md) · [Português (Brasil)](./LOCALE-ASSETS-GUIDE.pt-BR.md) · [简体中文](./LOCALE-ASSETS-GUIDE.zh-Hans.md) · [繁體中文](./LOCALE-ASSETS-GUIDE.zh-Hant.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [ai-i18n-tools 對資產的作用（及不作用）](#what-ai-i18n-tools-does-and-does-not-do-with-assets)
- [從一開始就為 i18n 設計](#design-for-i18n-from-the-start)
  - [包含 `docsOutput.style = "flat"` 的 Markdown（README、USER-GUIDE）](#markdown-with-docsoutputstyle--flat-readme-user-guide)
  - [文件系統網站（`docsOutput.style = "doc-system"`）](#doc-system-sites-docsoutputstyle--doc-system)
    - [Docusaurus 預設集](#docusaurus-preset)
    - [Astro/Starlight 預設集](#astrostarlight-preset)
  - [具有 SVG 資產的 Web 應用程式（Next.js、Vite 等）](#web-apps-nextjs-vite-etc-with-svg-assets)
- [決策指南](#decision-guide)
- [模式 A - 共用點陣圖](#pattern-a---shared-raster)
  - [實作範例](#implementation-example)
- [模式 B - 區域性資料夾（URL 重寫）](#pattern-b---per-locale-folder-url-rewriting)
  - [目錄結構](#directory-layout)
  - [螢幕截圖腳本合約](#screenshot-script-contract)
  - [設定 - `docsOutput.style = "flat"`](#config---docsoutputstyle--flat)
  - [設定 - `docsOutput.style = "doc-system"`](#config---docsoutputstyle--doc-system)
  - [預設集 - `docsOutput.style = "docusaurus"`](#preset---docsoutputstyle--docusaurus)
  - [預設集 - `docsOutput.style = "astro-starlight"`](#preset---docsoutputstyle--astro-starlight)
- [模式 C - 共置點陣圖（`doc-system`）](#pattern-c---colocated-raster-doc-system)
  - [目錄結構](#directory-layout-1)
  - [螢幕截圖腳本合約](#screenshot-script-contract-1)
  - [設定](#config)
  - [先決條件](#prerequisites)
  - [實作範例](#implementation-example-1)
- [模式 D - 翻譯的 SVG 與 `svg.style = "flat"`](#pattern-d---translated-svg-with-svgstyle--flat)
  - [設定](#config-1)
  - [應用程式參考](#app-reference)
  - [來源結構建議](#source-layout-recommendation)
  - [實作範例](#implementation-example-2)
- [模式 E - 共置翻譯的 SVG（文件系統）](#pattern-e---colocated-translated-svg-doc-system)
  - [設定](#config-2)
  - [來源 Markdown](#source-markdown)
  - [SVG 來源位置](#svg-source-location)
  - [`pathTemplate` 預留位置](#pathtemplate-placeholders)
  - [實作範例](#implementation-example-3)
- [平面連結重寫器和兩步驟流程](#the-flat-link-rewriter-and-two-step-flow)
  - [當 `docsOutput.style = "flat"` 時的兩步驟流程](#two-step-flow-when-docsoutputstyle--flat)
  - [每個檔案的深度前綴與 `flatPreserveRelativeDir`](#per-file-depth-prefix-with-flatpreserverelativedir)
  - [`rewriteRelativeLinks` 和 `linkRewriteDocsRoot`](#rewriterelativelinks-and-linkrewritedocsroot)
- [常見錯誤與疑難排解](#common-mistakes-and-troubleshooting)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

---

<a id="what-ai-i18n-tools-does-and-does-not-do-with-assets"></a>
## ai-i18n-tools 的功能（與限制）

`translate-docs` 會翻譯 markdown/MDX 內容（包含圖片的 alt 文字），但它不會複製、產生或輸出點陣圖檔。如果翻譯後的頁面需要特定地區的螢幕截圖，您必須將該檔案放置在翻譯後的 markdown 會引用的路徑。

`translate-svg` 是唯一會輸出地區專用二進位檔案的指令。它會讀取來源 SVG 檔案，翻譯文字元素（`<text>`、`<title>`、`<desc>`），並為每個地區輸出一個 SVG 檔案。點陣圖檔（PNG、JPEG、WebP、GIF）永遠不會由該工具寫入。

---

<a id="design-for-i18n-from-the-start"></a>
## 從一開始就為 i18n 設計

在任何螢幕截圖存在之前，選擇正確的目錄結構是後續處理地區專用資產順暢度的最大關鍵。在提交數十張螢幕截圖後才修改結構，意味著要重構路徑並更新每個 markdown 引用。

<a id="markdown-with-docsoutputstyle--flat-readme-user-guide"></a>
### 搭配 `docsOutput.style = "flat"` 的 Markdown（README、USER-GUIDE）

從第一天起，就在地區代碼子目錄下儲存螢幕截圖：

```
images/screenshots/en-GB/translate.png
images/screenshots/en-GB/settings.png
```

當您稍後加入 i18n 時，您的 `take-screenshots` 指令會為每個地區寫入 `images/screenshots/<locale>/`，而一個 `regexAdjustments` 規則會處理所有這些檔案：

```json
{
  "search": "images/screenshots/[^/]+/",
  "replace": "images/screenshots/${translatedLocale}/"
}
```

通用的 `[^/]+` 模式會比對任何地區的資料夾名稱 — 請勿硬編碼您的來源地區（例如 `screenshots/en-GB/`），因為這會在 `sourceLocale` 變更時導致中斷。

如果您一開始的路徑省略了地區子目錄（`images/screenshots/translate.png`），您將需要在 Pattern B 可以運作之前重構整個樹狀結構。

<a id="doc-system-sites-docsoutputstyle--doc-system"></a>
### 文件系統網站（`docsOutput.style = "doc-system"`）

用於靜態文件網站，這些網站將翻譯後的頁面儲存在地區前綴的樹狀結構下 — 例如 Docusaurus i18n、Astro Starlight 和遵循相同結構的自訂產生器。`docsRoot` 下的檔案會寫入：

```text
{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}
```

將 `docs[].docsOutput.docsRoot` 設定為您的英文來源根目錄（例如 `"docs"` 或 `"src/content/docs"`）。當您直接設定 `style: "doc-system"` 時，您還必須將 `localeSubpath` 設定為您的網站用於 `{locale}/` 和翻譯檔案之間的がパス段。別名 `"docusaurus"` 和 `"astro-starlight"` 是預設的 `doc-system` 佈局，具有預設的 `localeSubpath` 值（請參閱 [輸出佈局](GETTING_STARTED.zh-Hant.md#output-layouts))。

| 預設別名 | 預設 `localeSubpath` | 範例輸出 |
|--------------|-------------------------|----------------|
| `"docusaurus"` | `docusaurus-plugin-content-docs/current` | `i18n/de/docusaurus-plugin-content-docs/current/guide.md` |
| `"astro-starlight"` | `""` (空白) | `src/content/docs/de/guide.md` |

平面鏈接改寫器 **not** 對 `doc-system` 執行（與 `"flat"` 不同）。`postProcessing.regexAdjustments` 會看到來自來源 markdown 的原始 URL — 通常是絕對路徑或站點根路徑，例如 `/img/screenshots/en-GB/foo.png`。

**Pattern B** 在螢幕截圖位於共用靜態 URL 樹狀結構時套用：從第一天起就使用地區代碼資料夾，並使用一個通用的 `screenshots/[^/]+/` → `screenshots/${translatedLocale}/` 規則（請參閱 [設定 — 文件系統](#config---docsoutputstyle--doc-system))。

**Pattern C** 在每個地區的翻譯文件將資產與 markdown 放在一起時套用（不進行 URL 重寫）。您的螢幕截圖指令必須將 PNG 寫入從 `{outputDir}`、`{locale}` 和 `{localeSubpath}` 衍生出來的路徑 — 下方的 Docusaurus 預設值是參考佈局。

<a id="docusaurus-preset"></a>
#### Docusaurus 預設值

專案設定時養成兩個習慣，可完全避免日後使用正規表示式橋接：

1. 在新增任何截圖之前先建立符號連結 `documentation/docs/assets → ../static/assets`。Docusaurus 的 webpack 預設會追蹤符號連結，這可讓原始文件使用相對路徑，而翻譯後的文件也能沿用相同的相對路徑。

2. 將所有文件資源（PNG 與 SVG 檔案）統一放在 `static/assets/` 目錄中。不要將它們分開存放於 `static/img/`（SVG）與 `static/assets/`（PNG）。統一存放位置可讓每一份文件頁面（不論英文或翻譯版）都能引用相同的相對路徑 `../assets/name.ext`。

在原始 Markdown 中引用資源時，一律使用穩定的相對路徑 `../assets/name.ext`。切勿對文件資源使用絕對路徑 `/img/` 或 `/assets/` 的 URL —— 因為這些 URL 在英文原始檔（由 `static/` 提供服務）與翻譯語系（與翻譯文件共置）之間會有所不同，這將迫使您必須撰寫 `regexAdjustments` 規則來橋接。

當日後加入 i18n 時，截圖指令碼會自動採用 `getScreenshotDir` 的分割方式（參見 [模式 C](#pattern-c---colocated-raster-doc-system)），而 `translate-svg` 會使用 `pathTemplate`。無需調整任何正規表示式。

> **注意：** `resolve.symlinks = false` 在 `next.config.ts` 中僅會停用 Next.js 應用程式的 webpack 建置對符號連結的解析。這不會影響使用獨立 webpack 實例的 Docusaurus 文件站台建置。

<a id="astrostarlight-preset"></a>
#### Astro/Starlight 預設設定

等同於使用 `docsOutput.style = "doc-system"` 搭配 `localeSubpath: ""` —— 翻譯頁面直接放在 `{outputDir}/{locale}/` 下方。

從第一天起就將截圖儲存在以語系編碼的路徑下：

```
public/img/screenshots/en-GB/screenshot.png
```

使用 `regexAdjustments` 中的通用正規表示式：

```json
{
  "search": "screenshots/[^/]+/",
  "replace": "screenshots/${translatedLocale}/"
}
```

<a id="web-apps-nextjs-vite-etc-with-svg-assets"></a>
### 使用 SVG 資源的 Web 應用程式（Next.js、Vite 等）

將 SVG 原始檔放在專用的原始碼目錄中（例如 `images/` 或 `src/assets/`），並設定 `svg.outputDir` 指向另一個用於提供服務的目錄（例如 `public/assets/`）。切勿將原始 SVG 檔案與 `translate-svg` 輸出檔混在同一個資料夾中 —— 否則將難以區分哪些檔案是生成的。

從一開始就設計可翻譯的 SVG：所有可讀的文字標籤都應使用 `<text>`、`<title>` 和 `<desc>` 元素。避免將文字嵌入為路徑資料。

在 `svg` 的設定區塊中啟用 `forceLowercase: true`，以避免在不同檔案系統與 CDN 之間因大小寫敏感度不一致而產生問題。

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

| 模式 | 資源類型                  | 站台類型                                                                 | 工具機制                                               |
|---------|-----------------------------|---------------------------------------------------------------------------|--------------------------------------------------------------|
| A       | 點陣圖（共用）             | `docsOutput.style = "flat"` 文件                                      | 每個檔案的連結重寫器；通常不需要正規表示式                     |
| B       | 點陣圖（依語系）         | `"flat"` 或 `"doc-system"`（包含 `"docusaurus"`、`"astro-starlight"`）    | `regexAdjustments` 語系區段替換                       |
| C       | 點陣圖（共置）          | `"doc-system"` 搭配共置資源（Docusaurus 預設）                  | 截圖指令碼自動放置檔案；無需正規表示式                     |
| D       | SVG（可翻譯）            | Web 應用程式                                                                   | `translate-svg` 搭配 `svg.style = "flat"`                    |
| E       | SVG（可翻譯，共置） | `"doc-system"` 搭配共置資源（Docusaurus 預設）                  | `translate-svg` 搭配 `svg.style = "nested"` + `pathTemplate` |

---

<a id="pattern-a---shared-raster"></a>
## 模式 A - 共用光柵

當單一圖片跨所有地區設定共用時使用。當 `docsOutput.style = "flat"` 時，平面連結重寫器會根據每個輸出檔案計算深度前綴，因此與來源檔案相鄰的資產（例如，從 `docs/page.md` 參照的 `docs/figure.png`，如 `figure.png`）能在每個翻譯的輸出中正確解析——不需要 `postProcessing.regexAdjustments` 規則。

範例：此套件將 `docs/GETTING_STARTED.md` 翻譯為 `translated-docs/docs/GETTING_STARTED.<locale>.md`。同級影像 `docs/translation-dashboard.png` 被參考為 `translation-dashboard.png`。重寫器會從輸出檔案的目錄回溯到來源目錄（`../../docs/`）計算每個檔案的前綴，產生 `../../docs/translation-dashboard.png`。從 `translated-docs/docs/`，這會正確解析為 `docs/translation-dashboard.png`。

當儀表板 UI 變更時，請使用 [`scripts/screenshot-translation-dashboard.sh`](../../docs/../scripts/screenshot-translation-dashboard.sh) 重新整理 PNG；該影像並非地區設定專屬。

當發生以下情況時，仍需要 `postProcessing` 規則：
- 資源是透過絕對 URL 參考的（例如 `/img/figure.png`）——重寫器僅處理相對路徑
- 您想因其他原因更改資源 URL（例如切換到 CDN）

<a id="implementation-example"></a>
### 實作範例

此儲存庫在翻譯儀表板截圖中使用模式 A：[GETTING_STARTED.md](GETTING_STARTED.zh-Hant.md#translation-dashboard) 會參考同一個資料夾中的影像 [translation-dashboard.png](../../docs/../docs/translation-dashboard.png)。[ai-i18n-tools.config.json](../../docs/../ai-i18n-tools.config.json) 會設定 `docsOutput.style = "flat"` 和 `flatPreserveRelativeDir: true`；每個檔案的深度前綴會解析影像路徑，而無需螢幕截圖 `regexAdjustments`。

---

<a id="pattern-b---per-locale-folder-url-rewriting"></a>
## 模式 B - 地區設定專屬資料夾（URL 重寫）

適用於具有 `docsOutput.style = "flat"` 的 README/USER-GUIDE，以及用於從共用靜態 URL 樹提供螢幕截圖的說明系統網站（`docsOutput.style = "doc-system"` 或其別名 `"docusaurus"` / `"astro-starlight"`）。

<a id="directory-layout"></a>
### 目錄佈局

<details>
<summary>範例地區設定專屬螢幕截圖目錄樹</summary>

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

來源 Markdown 參考來源地區設定目錄：

```markdown
![Translate tab](../../docs/images/screenshots/en-GB/translate.png)
```

<a id="screenshot-script-contract"></a>
### 螢幕截圖腳本合約

`take-screenshots` 腳本必須為每個地區設定編寫檔案——而不僅僅是來源地區設定。`translate-docs` 命令會重寫路徑但不會建立檔案。常見模式：

```js
function getScreenshotDir(locale) {
  return `images/screenshots/${locale}`;
}
```

請參閱 [examples/nextjs-app](../../docs/../examples/nextjs-app/scripts/screenshot-locales.sh) 中的簡單 `bash` 範例，或 [Transrewrt 專案](https://github.com/wsj-br/transrewrt) 儲存庫中的 [take-screenshots.js](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) 的更複雜範例。

> **注意：** 以下四個子區段共用相同的 `regexAdjustments` 地區設定片段交換（`screenshots/[^/]+/` → `screenshots/${translatedLocale}/`）。僅輸出佈局和平面連結重寫器是否先執行有所不同——請跳至符合您 `docsOutput.style` 的子區段。

<a id="config---docsoutputstyle--flat"></a>
### 設定 - `docsOutput.style = "flat"`

當 `docsOutput.style = "flat"` 時，平面連結重寫器會先執行，並為非 Markdown URL 加上深度前綴。對於儲存庫根目錄中的 `README.md` 和 `outputDir: "translated-docs/"`，它會添加 `../`：

```
images/screenshots/en-GB/translate.png  →  ../images/screenshots/en-GB/translate.png
```

然後 `regexAdjustments` 規則會替換該已加上前綴 URL 中的地區設定片段：

<details>
<summary>範例正規表示式平面佈局的調整</summary>

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

結果：`../images/screenshots/de/translate.png` — 從 `translated-docs/README.de.md` 返回到儲存庫根目錄的正確相對路徑。

`postProcessing` 步驟在扁平連結重寫器之後運行。編寫 `search` 模式，以匹配已預先加上字首的 URL 中任何位置的地區設定區段 — 無需在模式中包含 `../` 字首。

實作範例（正式環境）：[Transrewrt](https://github.com/wsj-br/transrewrt) — [README.md](https://github.com/wsj-br/transrewrt/blob/main/README.md) 中的螢幕擷取畫面 URL（`images/screenshots/en-GB/…`），[ai-i18n-tools.config.json](https://github.com/wsj-br/transrewrt/blob/main/ai-i18n-tools.config.json) 中的地區設定重寫，腳本 [take-screenshots.js](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts)（請參閱上方 [螢幕擷取畫面腳本合約](#screenshot-script-contract)）。

實作範例（示範設定）：[examples/nextjs-app](../../docs/../examples/nextjs-app/) — [ai-i18n-tools.config.json](../../docs/../examples/nextjs-app/ai-i18n-tools.config.json) 中的第二個 `docs[]` 區塊（`images/screenshots/[^/]+/` → `${translatedLocale}`）；輔助腳本 [screenshot-locales.sh](../../docs/../examples/nextjs-app/scripts/screenshot-locales.sh)。

<a id="config---docsoutputstyle--doc-system"></a>
### 設定 - `docsOutput.style = "doc-system"`

通用模式 B，適用於透過共用靜態 URL 字首引用螢幕擷取畫面的任何文件系統網站。扁平連結重寫器不會運行；`postProcessing` 會重寫原始 markdown URL 中的地區設定區段。

<details>
<summary>範例正規表示式文件系統佈局的調整</summary>

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

將 `localeSubpath` 設定為符合您的產生器在 `{locale}/` 和已翻譯檔案之間的佈局，或者在預設值符合時使用預設別名（`"docusaurus"`、`"astro-starlight"`）而非 `"doc-system"`。來源 markdown 通常會在 URL 中嵌入來源地區設定：

```markdown
![Screenshot](../../docs//img/screenshots/en-GB/screenshot.png)
```

在每個目標地區設定的相同路徑上提供相符的 PNG 檔案（例如 `static/img/screenshots/de/screenshot.png`）。偏好使用 `screenshots/[^/]+/` 而非硬式編碼 `screenshots/en-GB/`，以便規則在 `sourceLocale` 變更時得以保留。

<a id="preset---docsoutputstyle--docusaurus"></a>
### 預設值 - `docsOutput.style = "docusaurus"`

與 `"doc-system"` 相同，使用預設的 `localeSubpath = "docusaurus-plugin-content-docs/current"`。扁平連結重寫器不會運行。`postProcessing` 會看到原始 markdown URL。英文頁面通常使用帶有來源地區設定的絕對路徑：

```markdown
![Screenshot](../../docs//img/screenshots/en-GB/screenshot.png)
```

<details>
<summary>範例正規表示式 Docusaurus 預設值的調整</summary>

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

在 `docs-site/static/img/screenshots/<locale>/screenshot.png` 提供相符的 PNG 檔案。對於來源地區設定無關的設定，請偏好使用 `screenshots/[^/]+/` 而非 `screenshots/en-GB/`。

實作範例：[examples/nextjs-app/docs-site/docs/feature-showcase.md](../../docs/../examples/nextjs-app/docs-site/docs/feature-showcase.md)（`/img/screenshots/en-GB/screenshot.png`），搭配 [ai-i18n-tools.config.json](../../docs/../examples/nextjs-app/ai-i18n-tools.config.json) 中的第一個 `docs[]` 區塊。

<a id="preset---docsoutputstyle--astro-starlight"></a>
### 預設值 - `docsOutput.style = "astro-starlight"`

與 `"doc-system"` 相同，使用 `localeSubpath: ""` — 已翻譯的頁面直接放在 `{outputDir}/{locale}/` 下方。與上述通用文件系統設定相同的模式 B 原則。來源 markdown 使用 `/img/screenshots/en-GB/screenshot.png`：

<details>
<summary>範例正規表示式 Astro Starlight 預設值的調整</summary>

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

實作範例：[examples/astro-docs](../../docs/../examples/astro-docs/) — [feature-showcase.mdx](../../docs/../examples/astro-docs/src/content/docs/feature-showcase.mdx) 和 [ai-i18n-tools.config.json](../../docs/../examples/astro-docs/ai-i18n-tools.config.json)（`screenshots/[^/]+/`）。

---

<a id="pattern-c---colocated-raster-doc-system"></a>
## 模式 C - 共置點陣圖（`doc-system`）

當 `doc-system` 網站將特定地區的資源與翻譯過的 markdown 放在一起時使用 — 不需要進行 URL 重寫。Docusaurus 預設設定 (`docsOutput.style = "docusaurus"`) 是參考實作；其他使用 `"doc-system"` 並自訂 `localeSubpath` 的產生器遵循相同的概念：英文資源位於來源地區路徑，翻譯過的資源位於 `{outputDir}/{locale}/[localeSubpath/]assets/` 下。

<a id="directory-layout-1"></a>
### 目錄結構

<details>
<summary>範例並存資源目錄樹 (Docusaurus)</summary>

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

每個地區的所有文件都使用相同的相對路徑：

```markdown
![Dashboard](../../docs/../assets/screen-dashboard.png)
```

對於英文 (`en-GB`) 地區，`../assets/` 透過符號連結解析到 `static/assets/`。對於翻譯過的地區，它會直接解析到該地區自己的 `current/assets/` 目錄。

<a id="screenshot-script-contract-1"></a>
### 螢幕截圖腳本合約

腳本必須將 PNG 寫入每個地區的正確目錄。`getScreenshotDir` 函數編碼了分割：

```js
function getScreenshotDir(locale) {
  if (locale === 'en-GB') return 'documentation/static/assets';
  return `documentation/i18n/${locale}/docusaurus-plugin-content-docs/current/assets`;
}
```

請參閱 [duplistatus](https://github.com/wsj-br/duplistatus) 儲存庫中的生產環境實作 [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) (本地參考副本：[references/duplistatus/scripts/take-screenshots.ts](../../docs/../references/duplistatus/scripts/take-screenshots.ts))。

<a id="config"></a>
### 設定

點陣圖檔案不需要 `regexAdjustments` 規則。`translate-docs` 會翻譯 markdown 中的替代文字，但 URL 保持不變：

```json
{
  "docsOutput": {
    "style": "docusaurus",
    "docsRoot": "documentation/docs"
  }
}
```

如果專案也使用翻譯過的 SVG，模式 E 會處理它們，它們會與 PNG 一起放在 `current/assets/` 中，無需額外的正規表示式。

<a id="prerequisites"></a>
### 先決條件

- 必須存在 `docs/assets` 符號連結：`ln -s ../static/assets documentation/docs/assets`
- Docusaurus webpack 預設會遵循符號連結 (Docusaurus 建置中 `resolve.symlinks` 預設為 `true`)
- 符號連結只需要存在於來源地區 — 翻譯過的建置不會使用它

<a id="implementation-example-1"></a>
### 實作範例

[duplistatus](https://github.com/wsj-br/duplistatus) — [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) 中的 `getScreenshotDir(locale)`；英文文件參考並存的 PNG (例如 [dashboard.md](../../docs/../references/duplistatus/documentation/docs/user-guide/dashboard.md) 搭配 `../assets/screen-dashboard-summary.png`)；[ai-i18n-tools.config.json](../../docs/../references/duplistatus/ai-i18n-tools.config.json) 中沒有 PNG `regexAdjustments`。同一個專案的模式 E SVG 會放在相同的 `current/assets/` 目錄中 (見下文)。

---

<a id="pattern-d---translated-svg-with-svgstyle--flat"></a>
## 模式 D - 搭配 `svg.style = "flat"` 的翻譯 SVG

當網頁應用程式嵌入特定地區的 SVG 插圖或圖表，並在執行階段透過地區代碼引用它們時使用。

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

`translate-svg` 會讀取 `images/` 下的每個 `.svg`，並為每個地區寫入一個檔案：

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
### 原始檔版面配置建議

將原始 SVG 檔案與輸出目錄分開存放。使用 `sourcePath: "images"` 和 `outputDir: "public/assets"` 時，這兩個目錄是分離的。切勿將兩者設定為同一目錄。

<a id="implementation-example-2"></a>
### 實作範例

[examples/nextjs-app](../../docs/../examples/nextjs-app/) — [ai-i18n-tools.config.json](../../docs/../examples/nextjs-app/ai-i18n-tools.config.json) 中的 `svg` 區塊 (`sourcePath: "images"`, `outputDir: "public/assets"`, `svg.style = "flat"`)；原始檔案 [translation_demo_svg.svg](../../docs/../examples/nextjs-app/images/translation_demo_svg.svg)；依語系輸出至 [public/assets/](../../docs/../examples/nextjs-app/public/assets/) 下 (例如 `translation_demo_svg.de.svg`)；[page.tsx](../../docs/../examples/nextjs-app/src/app/page.tsx) 中的執行階段 URL (`/assets/translation_demo_svg.${locale}.svg`)。

---

<a id="pattern-e---colocated-translated-svg-doc-system"></a>
## 模式 E - 共置翻譯 SVG (文件系統)

適用於文件系統網站，其中翻譯後的 SVG 插圖必須與各語系內容目錄中的翻譯文件並列出現——與模式 C 的點陣圖截圖相同位置。Docusaurus 預設設定為主要範例。

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

`translate-svg` 會將每種語系的單一 SVG 寫入與模式 C 用於 PNG 檔案相同的 `current/assets/` 目錄中：

```
documentation/i18n/de/docusaurus-plugin-content-docs/current/assets/diagram.svg
documentation/i18n/fr/docusaurus-plugin-content-docs/current/assets/diagram.svg
```

<a id="source-markdown"></a>
### 原始 Markdown

所有語系中的文件皆使用相同的相對路徑：

```markdown
![Diagram](../../docs/../assets/diagram.svg)
```

對於英文語系，符號連結 `docs/assets → ../static/assets` 會解析至此。對於翻譯語系，則直接解析至 `current/assets/`。

不需要 `regexAdjustments` 規則，因為英文原始文件與翻譯後輸出文件使用相同的路徑。

<a id="svg-source-location"></a>
### SVG 原始檔位置

建議：將原始 SVG 檔案儲存在 `documentation/static/assets/`，與 en-GB 的 PNG 檔案放在一起。這可將所有文件資源集中管理，且相同的 `docs/assets` 符號連結即可同時涵蓋兩者。`svg.sourcePath` 項目接著指向 `documentation/static/assets/name.svg`。

<a id="pathtemplate-placeholders"></a>
### `pathTemplate` 標記

| 標記                     | 值                                                     |
|--------------------------|--------------------------------------------------------|
| `{outputDir}`            | `svg.outputDir` 的絕對解析路徑                          |
| `{locale}`               | 目標語系代碼                                           |
| `{LOCALE}`               | 大寫語系代碼                                           |
| `{relPath}`              | 從 `sourcePath` 根目錄到原始 SVG 的相對路徑           |
| `{stem}`                 | 不含副檔名的檔案名稱                                   |
| `{basename}`             | 檔名（含副檔名）                                   |
| `{extension}`            | 副檔名（含點字）                                     |
| `{relativeToSourceRoot}` | 相對於最近的 `sourcePath` 根目錄的相對路徑 |

完整參考請參閱 [svg 設定表格](GETTING_STARTED.zh-Hant.md#svg)。

<a id="implementation-example-3"></a>
### 實作範例

[duplistatus](https://github.com/wsj-br/duplistatus) — 巢狀 `svg` 區塊，其中 `pathTemplate` 位於 [ai-i18n-tools.config.json](../../docs/../references/duplistatus/ai-i18n-tools.config.json) 中；來源 SVG 列於 `documentation/static/img/` 下方（例如 [duplistatus_toolbar.svg](../../docs/../references/duplistatus/documentation/static/img/duplistatus_toolbar.svg)）；`translate-svg` 會將每個地區設定檔寫入 Pattern C PNG 旁的 `documentation/i18n/<locale>/…/current/assets/` 中；文件目前透過 `/img/duplistatus_*.svg` 嵌入（例如 [overview.md](../../docs/../references/duplistatus/documentation/docs/user-guide/overview.md)）。請參閱 [task-locale-assets-simplification.md](../../docs/../references/duplistatus/dev/task-locale-assets-simplification.md) 以了解計畫移至 `../assets/` 路徑並移除 SVG `regexAdjustments` 橋接器的內容。

---

<a id="the-flat-link-rewriter-and-two-step-flow"></a>
## 平面連結重寫器與兩步驟流程

對於 `docsOutput.style = "flat"`（除非設定了 `rewriteRelativeLinks: false` 或自訂的 `pathTemplate`），在 `postProcessing` 之前會執行內建的重寫器。它會處理跨文件連結（加上地區後綴），並為非 markdown 資產 URL 加上深度前綴。

<a id="two-step-flow-when-docsoutputstyle--flat"></a>
### `docsOutput.style = "flat"` 時的兩步驟流程

```
source URL  →  [flat link rewriter: depth prefix]  →  [postProcessing: locale segment]  →  output URL
```

在儲存庫根目錄中，使用 `outputDir: "translated-docs/"` 和來源 `README.md` 的範例：

1. 平面連結重寫器：`images/screenshots/en-GB/foo.png` → `../images/screenshots/en-GB/foo.png`（針對 `translated-docs/` 的一個 `../`）
2. `postProcessing` 正則表達式 `images/screenshots/[^/]+/` → `images/screenshots/${translatedLocale}/`：`../images/screenshots/de/foo.png`

對於 `docsOutput.style = "doc-system"`（包括 `"docusaurus"`、`"astro-starlight"` 和 `"nested"`），平面連結重寫器不會執行。`postProcessing` 會看到翻譯後 markdown 中的原始 URL（通常是絕對路徑，例如 `/img/screenshots/en-GB/foo.png`）。

<a id="per-file-depth-prefix-with-flatpreserverelativedir"></a>
### 針對檔案的深度前綴（使用 `flatPreserveRelativeDir`）

深度前綴是針對每個輸出檔案計算的，而不是針對整個批次全域計算。對於每個來源檔案，重寫器會計算從輸出檔案目錄回溯到來源檔案目錄的相對路徑，並將其用作前綴。

這表示使用 `flatPreserveRelativeDir: true` 時，子目錄中的來源檔案會自動獲得正確的前綴。例如，`docs/GETTING_STARTED.md` 會輸出到 `translated-docs/docs/GETTING_STARTED.<locale>.md`。每個檔案的前綴是 `../../docs/`，因此資產 `translation-dashboard.png`（相對於來源）會變成 `../../docs/translation-dashboard.png` — 這會從 `translated-docs/docs/` 正確解析回 `docs/translation-dashboard.png`。

對於與來源檔案並存的相對路徑資產，不需要進行 `postProcessing` 正則表達式校正。

<a id="rewriterelativelinks-and-linkrewritedocsroot"></a>
### `rewriteRelativeLinks` 與 `linkRewriteDocsRoot`

| 選項                                   | 效果                                                                                                           |
|------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| `docsOutput.rewriteRelativeLinks`    | 明確啟用或停用平面連結重寫器（當 `docsOutput.style = "flat"` 時覆寫預設值） |
| `docsOutput.linkRewriteDocsRoot`     | 計算 `depthPrefix` 的根目錄（預設為 `"."`）                                                        |
| `docsOutput.flatPreserveRelativeDir` | 影響輸出路徑佈局，重寫器在計算已知翻譯檔案的目標路徑時會使用此佈局 |

---

<a id="troubleshooting"></a>
<a id="common-mistakes-and-troubleshooting"></a>
## 常見錯誤與疑難排解

**螢幕截圖路徑中沒有地區設定目錄**
`images/screenshots/screenshot.png` — 無法區分地區設定的變體，也無法重寫。請在套用模式 B 之前，先重構為 `images/screenshots/<locale>/screenshot.png`。

**正規表達式中硬式編碼來源地區設定**
`"search": "screenshots/en-GB/"` — 如果 `sourceLocale` 變更，將會無聲無息地中斷。請改用 `"search": "screenshots/[^/]+/"`。

**SVG 來源與輸出在同一個目錄**
如果 `svg.sourcePath` 與 `svg.outputDir` 重疊，產生的檔案將會與手動編輯的來源混雜。請將它們放在不同的目錄中。

**Docusaurus 中 SVG 的絕對靜態 URL**
`/img/diagram.svg`（來自 `static/img/`）需要 `regexAdjustments` 規則才能在翻譯後的輸出中重寫為 `../assets/`。請將來源 SVG 放在 `static/assets/`，並從一開始就使用相對的 `../assets/diagram.svg`，以完全避免此問題。

**Docusaurus 中缺少 `docs/assets` 符號連結**
沒有符號連結，`docs/user-guide/` 中的來源文件無法透過相對路徑參考 `static/assets/` 中的 PNG 或 SVG。請在專案建立時設定符號連結：`ln -s ../static/assets documentation/docs/assets`。

**`take-screenshots` 指令碼僅擷取來源地區設定**
模式 B 需要每個地區設定都有 PNG 檔案。如果指令碼僅擷取 `en-GB`，翻譯後的文件將有重寫的路徑指向遺失的檔案。
