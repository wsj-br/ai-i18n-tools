<a id="svg-translation"></a>
# SVG 翻譯

專為包含人類可讀標籤的 **SVG 插圖和圖表**而設計。`translate-svg` 命令讀取來源 `.svg` 檔案，從 `<text>`、`<title>` 和 `<desc>` 元素中提取文字，透過作用中的 LLM 供應商翻譯這些字串，並為**每個目標語言環境寫入一個輸出 SVG**。

這是唯一會發出特定語言環境的 **二進位** SVG 檔案的管線。`translate-docs` 會翻譯 Markdown 替代文字和連結參考，但它不會修改或複製 SVG 資產。當頁面需要帶有翻譯標籤的圖表時，請啟用 `features.translateSVG` 並設定頂層 `svg` 區塊。

SVG 翻譯使用與 `translate-docs` 和 `translate-json` (`cacheDir`) 相同的 SQLite 快取。已翻譯的文字區段會從快取中提供；只有新的或變更的來源文字才會傳送至 LLM。

<a id="when-to-use-svg-translation"></a>
### 何時使用 SVG 翻譯

在以下情況下使用 `translate-svg`：

- SVG 包含必須隨語言環境變更的可見標籤、標題或描述。
- Web 應用程式在執行時載入特定語言環境的圖表檔案（例如 `dashboard.de.svg`）。
- 文件系統網站（Docusaurus、Astro Starlight、VitePress）將翻譯後的 SVG 與翻譯後的 Markdown 並置。

請**勿**將 `translate-svg` 用於：

- 沒有可翻譯文字的裝飾性 SVG（圖示、標誌、背景）。
- 點陣圖螢幕截圖 (PNG、JPEG、WebP) — 這些透過 [圖片和螢幕截圖](/guide/images-and-screenshots/) 處理。
- 嵌入路徑資料而非 `<text>` 元素的文字 — 提取器無法讀取路徑輪廓。

<a id="design-for-i18n-from-the-start"></a>
### 從一開始就為國際化設計

當標籤從一開始就是真實文字元素時，SVG 最容易翻譯：

- 將人類可讀的內容放入 `<text>`、`<title>` 和 `<desc>` 中。
- 避免在設計工具中將標籤轉換為路徑 — 路徑資料對翻譯器來說是不透明的。
- 將**來源 SVG** 放在與 `svg.outputDir` 分開的專用目錄中。混合來源和生成的語言環境檔案會導致無法判斷哪些檔案可以安全編輯或重新生成。

對於 Web 應用程式，當您的設計使用全小寫標籤時，請啟用 `forceLowercase: true` — 這可以避免跨檔案系統和 CDN 的大小寫敏感度不匹配。

<a id="output-layouts"></a>
### 輸出佈局

`translate-svg` 支援兩種常見的輸出形狀。根據您的應用程式或文件網站如何在執行時參考 SVG 檔案來選擇。

| 版面配置 | `svg.style` | 最適合 | 子指南 |
|--------|-------------|----------|-------------|
| **平面 (Web 應用程式)** | `"flat"` | Next.js、Vite 和其他透過語言環境編碼檔案名稱嵌入 SVG 的應用程式 | [Web 應用程式 (平面 SVG)](/guide/svg-translation/translated-svg-web-app) |
| **並置 (文件系統)** | `"nested"` + `pathTemplate` | Docusaurus 和其他文件系統網站，其中翻譯的資產與翻譯的頁面並置 | [並置 SVG](/guide/svg-translation/translated-svg-colocated) |

**平面版面配置**將檔案（例如 `public/assets/diagram.de.svg`）寫入 `diagram.en-GB.svg` 旁邊。您的應用程式會使用語言環境後綴來參考它們：

```tsx
<img src={`/assets/diagram.${locale}.svg`} alt="Architecture diagram" />
```

**並置版面配置**將每個語言環境的 SVG 寫入該語言環境的內容樹（例如 `i18n/de/.../assets/diagram.svg`）。來源和翻譯的 Markdown 使用相同的相對路徑 (`../assets/diagram.svg`) — 不需要 `regexAdjustments` 規則。

請參閱 [圖片和螢幕截圖決策指南](/guide/images-and-screenshots/#decision-guide)，了解 SVG 版面配置如何與點陣圖螢幕截圖策略配合。

<a id="step-1-enable-and-configure"></a>
### 步驟 1：啟用和設定

啟用功能並將 `translate-svg` 指向您的來源檔案和輸出根目錄：

```json
{
  "features": {
    "translateSVG": true
  },
  "svg": {
    "sourcePath": "images",
    "outputDir": "public/assets",
    "style": "flat"
  }
}
```

主要 `svg` 欄位：

- `sourcePath` — 一個或多個目錄或 glob 模式（例如 `"images/*.svg"`、`"**/icons/*.svg"`）。從專案根目錄遞迴掃描。
- `outputDir` — 翻譯後的 SVG 輸出的根目錄。
- `style` — 當您未使用自訂 `pathTemplate` 時，為 `"flat"` 或 `"nested"`。
- `pathTemplate` — 可選的自訂輸出路徑，帶有佔位符 `{outputDir}`、`{locale}`、`{llocale}`、`{basename}`、`{stem}` 和其他（協同定位文件系統佈局所需）。
- `forceLowercase` — 重新組裝時的翻譯文字為小寫。

完整欄位參考：[設定 — `svg`](/reference/configuration#svg)。

<a id="step-2-translate"></a>
### 步驟 2：翻譯

```bash
npx ai-i18n-tools translate-svg
```

翻譯單一語系：

```bash
npx ai-i18n-tools translate-svg --locale de
```

預覽而不寫入檔案：

```bash
npx ai-i18n-tools translate-svg --dry-run
```

當 `features.translateSVG` 和 `svg` 都設定時，`sync` 會自動執行 SVG 步驟（使用 `--no-svg` 跳過）。共用旗標包括 `-l` / `--locale`、`-p` / `--path`、`-j` / `--concurrency` 和 `--force` / `--force-update`。

<a id="troubleshooting"></a>
### 疑難排解

常見的 SVG 問題 — 混合的來源/輸出目錄、Docusaurus 上的絕對靜態 URL 以及路徑佈局錯誤 — 在[SVG 疑難排解](/guide/svg-translation/troubleshooting)中有所涵蓋。對於點陣圖資產和連結重寫，請參閱[圖片和螢幕截圖疑難排解](/guide/images-and-screenshots/troubleshooting)。
