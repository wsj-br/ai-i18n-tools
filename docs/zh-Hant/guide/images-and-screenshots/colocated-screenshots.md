<a id="colocated-raster-doc-system"></a>
# 共置點陣圖 (`doc-system`)

當 `doc-system` 網站將特定地區的資源與翻譯過的 markdown 放在一起時使用 — 不需要進行 URL 重寫。Docusaurus 預設設定 (`docsOutput.style = "docusaurus"`) 是參考實作；其他使用 `"doc-system"` 並自訂 `localeSubpath` 的產生器遵循相同的概念：英文資源位於來源地區路徑，翻譯過的資源位於 `{outputDir}/{locale}/[localeSubpath/]assets/` 下。

> **為何沒有庫內範例：** 本儲存庫的 Docusaurus 示範（[`examples/docusaurus-docs`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs/)、[`examples/nextjs-app`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/)）改用[各語系資料夾](/zh-Hant/guide/images-and-screenshots/per-locale-folder)佈局——請參閱[決策指南](/zh-Hant/guide/images-and-screenshots/#decision-guide)。共置的 `../assets/` 是建議的全新專案模式；[duplistatus](https://github.com/wsj-br/duplistatus) 是完整的生產環境參考。

<a id="directory-layout"></a>
### 目錄佈局

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
![Dashboard](../assets/screen-dashboard.png)
```

對於英文 (`en-GB`) 地區，`../assets/` 透過符號連結解析到 `static/assets/`。對於翻譯過的地區，它會直接解析到該地區自己的 `current/assets/` 目錄。

<a id="screenshot-script-contract"></a>
### 螢幕截圖腳本合約

腳本必須將 PNG 寫入每個地區的正確目錄。`getScreenshotDir` 函數編碼了分割：

```js
function getScreenshotDir(locale) {
  if (locale === 'en-GB') return 'documentation/static/assets';
  return `documentation/i18n/${locale}/docusaurus-plugin-content-docs/current/assets`;
}
```

請參閱 [duplistatus](https://github.com/wsj-br/duplistatus) 儲存庫中 [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) 的實際實作。

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

如果專案也使用翻譯的 SVG，[並置 SVG 翻譯](/zh-Hant/guide/svg-translation/translated-svg-colocated) 會處理它們，並且它們會與 PNG 一起放置在 `current/assets/` 中，無需額外的正規表示式。

<a id="prerequisites"></a>
### 先決條件

- 必須存在 `docs/assets` 符號連結：`ln -s ../static/assets documentation/docs/assets`
- Docusaurus webpack 預設會遵循符號連結 (Docusaurus 建置中 `resolve.symlinks` 預設為 `true`)
- 符號連結只需要存在於來源地區 — 翻譯過的建置不會使用它

<a id="implementation-example"></a>
### 實作範例

[duplistatus](https://github.com/wsj-br/duplistatus) — `getScreenshotDir(locale)` 在 [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) 中；英文文件參考並置的 PNG（例如 [dashboard.md](https://github.com/wsj-br/duplistatus/blob/master/documentation/docs/user-guide/dashboard.md) 與 `../assets/screen-dashboard-summary.png`）。來自同一專案的並置 SVG 會放置在相同的 `current/assets/` 目錄中 — 請參閱 [並置 SVG](/zh-Hant/guide/svg-translation/translated-svg-colocated)。
