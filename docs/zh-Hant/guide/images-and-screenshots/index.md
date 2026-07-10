<a id="what-ai-i18n-tools-does-and-does-not-do-with-assets"></a>
# ai-i18n-tools 對資產的處理（以及不處理的項目）

`translate-docs` 會翻譯 markdown/MDX 內容（包含圖片的 alt 文字），但它不會複製、產生或輸出點陣圖檔。如果翻譯後的頁面需要特定地區的螢幕截圖，您必須將該檔案放置在翻譯後的 markdown 會引用的路徑。

`translate-svg` 是唯一會輸出地區專用二進位檔案的指令。它會讀取來源 SVG 檔案，翻譯文字元素（`<text>`、`<title>`、`<desc>`），並為每個地區輸出一個 SVG 檔案。點陣圖檔（PNG、JPEG、WebP、GIF）永遠不會由該工具寫入。

---

<a id="design-for-i18n-from-the-start"></a>
# 從一開始就為國際化設計

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

通用 `[^/]+` 正規表達式會比對任何地區設定資料夾名稱 — 請勿硬式編碼您的來源地區設定 (例如 `screenshots/en-GB/`)，因為如果 `sourceLocale` 變更，這會導致錯誤。

如果您從省略地區設定子目錄 (`images/screenshots/translate.png`) 的路徑開始，則需要先重組整個樹狀結構，然後 [每個地區設定資料夾](/zh-Hant/guide/images-and-screenshots/per-locale-folder) 的重寫才能運作。

<a id="doc-system-sites-docsoutputstyle--doc-system"></a>
### 文件系統網站（`docsOutput.style = "doc-system"`）

用於靜態文件網站，這些網站將翻譯後的頁面儲存在地區前綴的樹狀結構下 — 例如 Docusaurus i18n、Astro Starlight 和遵循相同結構的自訂產生器。`docsRoot` 下的檔案會寫入：

```text
{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}
```

將 `docs[].docsOutput.docsRoot` 設定為您的英文來源根目錄 (例如 `"docs"` 或 `"src/content/docs"`)。當您直接設定 `style: "doc-system"` 時，您還必須將 `localeSubpath` 設定為您的網站用於 `{locale}/` 和翻譯檔案之間的路徑區段。別名 `"docusaurus"`、`"astro-starlight"` 和 `"vitepress"` 是預設的 `doc-system` 版面配置，具有預設的 `localeSubpath` 值 (請參閱 [輸出版面配置](/zh-Hant/guide/documents/output-layouts))。

| 預設別名 | 預設 `localeSubpath` | 範例輸出 |
|--------------|-------------------------|----------------|
| `"docusaurus"` | `docusaurus-plugin-content-docs/current` | `i18n/de/docusaurus-plugin-content-docs/current/guide.md` |
| `"astro-starlight"` | `""` (空白) | `src/content/docs/de/guide.md` |
| `"vitepress"` | `""` (空白) | `docs/de/guide/quick-start.md` |

平面鏈接改寫器 **not** 對 `doc-system` 執行（與 `"flat"` 不同）。`postProcessing.regexAdjustments` 會看到來自來源 markdown 的原始 URL — 通常是絕對路徑或站點根路徑，例如 `/img/screenshots/en-GB/foo.png`。

**每個地區設定資料夾** 版面配置適用於螢幕截圖位於共用靜態 URL 樹狀結構中：從第一天起就使用地區設定編碼的資料夾和一個通用 `screenshots/[^/]+/` → `screenshots/${translatedLocale}/` 規則 (請參閱 [設定 — 文件系統](#config---docsoutputstyle--doc-system))。

**並置螢幕截圖** 適用於每個地區設定的翻譯文件將資產儲存在 Markdown 旁邊 (無 URL 重寫)。您的螢幕截圖指令碼必須將 PNG 寫入從 `{outputDir}`、`{locale}` 和 `{localeSubpath}` 派生的路徑 — 下面的 Docusaurus 預設值是參考版面配置。

<a id="docusaurus-preset"></a>
#### Docusaurus 預設值

專案設定時養成兩個習慣，可完全避免日後使用正規表示式橋接：

1. 在新增任何截圖之前先建立符號連結 `documentation/docs/assets → ../static/assets`。Docusaurus 的 webpack 預設會追蹤符號連結，這可讓原始文件使用相對路徑，而翻譯後的文件也能沿用相同的相對路徑。

2. 將所有文件資源（PNG 與 SVG 檔案）統一放在 `static/assets/` 目錄中。不要將它們分開存放於 `static/img/`（SVG）與 `static/assets/`（PNG）。統一存放位置可讓每一份文件頁面（不論英文或翻譯版）都能引用相同的相對路徑 `../assets/name.ext`。

在原始 Markdown 中引用資源時，一律使用穩定的相對路徑 `../assets/name.ext`。切勿對文件資源使用絕對路徑 `/img/` 或 `/assets/` 的 URL —— 因為這些 URL 在英文原始檔（由 `static/` 提供服務）與翻譯語系（與翻譯文件共置）之間會有所不同，這將迫使您必須撰寫 `regexAdjustments` 規則來橋接。

當您稍後新增 i18n 時，螢幕截圖指令碼會採用 `getScreenshotDir` 分割 (請參閱 [並置螢幕截圖](/zh-Hant/guide/images-and-screenshots/colocated-screenshots))，而 `translate-svg` 會使用 `pathTemplate`。無需調整正規表達式。

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
# 決策指南

```
Is the asset an SVG with translatable text or labels?
  Yes → Web app SVG or Colocated SVG
  No (raster screenshot or decorative SVG) →
    doc-system site with assets colocated beside translated docs?
      Yes → Colocated screenshots (rasters) + Colocated SVG (SVGs)
    Only one locale needs the image (no per-locale variants)?
      Yes → Shared image
    Otherwise → Per-locale folder
```

SVG 版面配置涵蓋在 [SVG 翻譯](/zh-Hant/guide/svg-translation/) 指南中。

| 版面配置 | 資產類型 | 網站類型 | 工具機制 |
|--------|-----------------------------|---------------------------------------------------------------------------|--------------------------------------------------------------|
| [共用影像](/zh-Hant/guide/images-and-screenshots/shared-image) | 點陣圖 (共用) | `docsOutput.style = "flat"` 文件 | 每檔案連結重寫器；通常沒有正規表達式 |
| [每個地區設定資料夾](/zh-Hant/guide/images-and-screenshots/per-locale-folder) | 點陣圖 (每個地區設定) | `"flat"` 或 `"doc-system"` (包括 `"docusaurus"`、`"astro-starlight"`) | `regexAdjustments` 地區設定區段交換 |
| [並置螢幕截圖](/zh-Hant/guide/images-and-screenshots/colocated-screenshots) | 點陣圖 (並置) | 具有並置資產的 `"doc-system"` (Docusaurus 預設) | 螢幕截圖指令碼放置檔案；沒有正規表達式 |
| [Web 應用程式 SVG](/zh-Hant/guide/svg-translation/translated-svg-web-app) | SVG (已翻譯) | Web 應用程式 | `translate-svg` 與 `svg.style = "flat"` |
| [並置 SVG](/zh-Hant/guide/svg-translation/translated-svg-colocated) | SVG (已翻譯，並置) | 具有並置資產的 `"doc-system"` (Docusaurus 預設) | `translate-svg` 與 `svg.style = "nested"` + `pathTemplate` |
