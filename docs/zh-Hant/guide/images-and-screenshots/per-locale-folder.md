<a id="per-locale-folder-url-rewriting"></a>
# 依地區設定的資料夾 (URL 重寫)

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
![Translate tab](images/screenshots/en-GB/translate.png)
```

<a id="screenshot-script-contract"></a>
### 螢幕截圖腳本合約

`take-screenshots` 腳本必須為每個語言環境（而不僅僅是來源語言環境）寫入檔案。`translate-docs` 命令會重寫路徑，但不會建立檔案。一個典型的輔助程式：

```js
function getScreenshotDir(locale) {
  return `images/screenshots/${locale}`;
}
```

請參閱 [examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/scripts/screenshot-locales.sh) 中的螢幕截圖腳本中的簡單 `bash` 範例，或 [Transrewrt 專案](https://github.com/wsj-br/transrewrt) 儲存庫中的 [take-screenshots.js](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) 中的更複雜範例。

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

`postProcessing` 步驟在平面連結重寫器之後執行。編寫 `search` 正規表示式，以匹配已預先加上字首的 URL 中任何位置的語言環境區段 — 無需在正規表示式中包含 `../` 字首。

實作範例（正式環境）：[Transrewrt](https://github.com/wsj-br/transrewrt) — [README.md](https://github.com/wsj-br/transrewrt/blob/main/README.md) 中的螢幕擷取畫面 URL（`images/screenshots/en-GB/…`），[ai-i18n-tools.config.json](https://github.com/wsj-br/transrewrt/blob/main/ai-i18n-tools.config.json) 中的地區設定重寫，腳本 [take-screenshots.js](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts)（請參閱上方 [螢幕擷取畫面腳本合約](#screenshot-script-contract)）。

實作範例（示範設定）：[examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/) — [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/ai-i18n-tools.config.json) 中的第二個 `docs[]` 區塊（`images/screenshots/[^/]+/` → `${translatedLocale}`）；輔助腳本 [screenshot-locales.sh](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/scripts/screenshot-locales.sh)。

<a id="config---docsoutputstyle--doc-system"></a>
### 設定 - `docsOutput.style = "doc-system"`

對於任何透過共用靜態 URL 字首引用螢幕截圖的文檔系統網站，採用相同的每個語言環境資料夾方法。平面連結重寫器不執行；`postProcessing` 重寫原始 markdown URL 中的語言環境區段。

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
![Screenshot](/img/screenshots/en-GB/screenshot.png)
```

在每個目標地區設定的相同路徑上提供相符的 PNG 檔案（例如 `static/img/screenshots/de/screenshot.png`）。偏好使用 `screenshots/[^/]+/` 而非硬式編碼 `screenshots/en-GB/`，以便規則在 `sourceLocale` 變更時得以保留。

<a id="preset---docsoutputstyle--docusaurus"></a>
### 預設值 - `docsOutput.style = "docusaurus"`

與 `"doc-system"` 相同，使用預設的 `localeSubpath = "docusaurus-plugin-content-docs/current"`。扁平連結重寫器不會運行。`postProcessing` 會看到原始 markdown URL。英文頁面通常使用帶有來源地區設定的絕對路徑：

```markdown
![Screenshot](/img/screenshots/en-GB/screenshot.png)
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

實作範例：[examples/nextjs-app/docs-site/docs/feature-showcase.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/docs-site/docs/feature-showcase.md) (`/img/screenshots/en-GB/screenshot.png`) 以及 [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/ai-i18n-tools.config.json) 中的第一個 `docs[]` 區塊。

<a id="preset---docsoutputstyle--astro-starlight"></a>
### 預設值 - `docsOutput.style = "astro-starlight"`

與 `"doc-system"` 和 `localeSubpath: ""` 相同 — 翻譯頁面直接位於 `{outputDir}/{locale}/` 下。與上述通用文檔系統設定採用相同的每個語言環境資料夾方法。來源 markdown 使用 `/img/screenshots/en-GB/screenshot.png`：

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

實作範例：[examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs/) — [feature-showcase.mdx](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/astro-docs/src/content/docs/feature-showcase.mdx) 和 [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/astro-docs/ai-i18n-tools.config.json) (`screenshots/[^/]+/`)。

---

<a id="colocated-raster-doc-system"></a>
