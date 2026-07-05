<a id="translated-svg-with-svgstyle--flat"></a>
# 翻譯後的 SVG 與 `svg.style = "flat"`

當網頁應用程式嵌入特定地區的 SVG 插圖或圖表，並在執行階段透過地區代碼引用它們時使用。

<a id="config"></a>
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

<a id="implementation-example"></a>
### 實作範例

[examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/) — [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/ai-i18n-tools.config.json) 中的 `svg` 區塊 (`sourcePath: "images"`、`outputDir: "public/assets"`、`svg.style = "flat"`)；來源 [translation_demo_svg.svg](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/images/translation_demo_svg.svg)；[public/assets/](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/public/assets/) 下的每個地區設定輸出 (例如 `translation_demo_svg.de.svg`)；[page.tsx](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/src/app/page.tsx) 中的執行階段 URL (`/assets/translation_demo_svg.${locale}.svg`)。

---

<a id="pattern-e---colocated-translated-svg-doc-system"></a>
