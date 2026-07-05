<a id="translated-svg-with-svgstyle--flat"></a>
# `svg.style = "flat"`でSVGを翻訳する

Webアプリがロケール固有のSVGイラストや図を埋め込み、実行時にロケールコードで参照する場合に使用します。

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

`translate-svg` は `images/` 配下のすべての `.svg` を読み取り、ロケールごとに1つのファイルを出力します。

```
public/assets/
├── dashboard.en-GB.svg
├── dashboard.de.svg
├── dashboard.fr.svg
└── dashboard.es.svg
```

<a id="app-reference"></a>
### アプリ内での参照

```tsx
<img src={`/assets/dashboard.${locale}.svg`} alt="Dashboard diagram" />
```

<a id="source-layout-recommendation"></a>
### ソース構成の推奨

ソースのSVGは出力ディレクトリとは別に管理してください。`sourcePath: "images"` と `outputDir: "public/assets"` を使用すると、2つのディレクトリは明確に分かれます。両方を同じディレクトリに設定しないでください。

<a id="implementation-example"></a>
### 実装例

[examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/) — [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/ai-i18n-tools.config.json) の `svg` ブロック (`sourcePath: "images"`、`outputDir: "public/assets"`、`svg.style = "flat"`)。ソースは [translation_demo_svg.svg](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/images/translation_demo_svg.svg)。[public/assets/](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/public/assets/) 以下にロケールごとの出力 (例: `translation_demo_svg.de.svg`)。[page.tsx](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/src/app/page.tsx) のランタイム URL (`/assets/translation_demo_svg.${locale}.svg`)。

---

<a id="pattern-e---colocated-translated-svg-doc-system"></a>
