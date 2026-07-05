<a id="translated-svg-with-svgstyle--flat"></a>
# 带有 `svg.style = "flat"` 的翻译 SVG

当 Web 应用嵌入特定于区域设置的 SVG 插图或图表并在运行时按区域设置代码引用它们时使用。

<a id="config"></a>
### 配置

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

`translate-svg` 读取 `images/` 下的每个 `.svg` 并为每个区域设置写入一个文件：

```
public/assets/
├── dashboard.en-GB.svg
├── dashboard.de.svg
├── dashboard.fr.svg
└── dashboard.es.svg
```

<a id="app-reference"></a>
### 应用引用

```tsx
<img src={`/assets/dashboard.${locale}.svg`} alt="Dashboard diagram" />
```

<a id="source-layout-recommendation"></a>
### 源文件布局建议

将源 SVG 文件与输出目录分开。使用 `sourcePath: "images"` 和 `outputDir: "public/assets"` 时，这两个目录是不同的。切勿将两者设置为同一目录。

<a id="implementation-example"></a>
### 实现示例

[examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/) — [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/ai-i18n-tools.config.json) 中的 `svg` 块 (`sourcePath: "images"`、`outputDir: "public/assets"`、`svg.style = "flat"`)；源 [translation_demo_svg.svg](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/images/translation_demo_svg.svg)；[public/assets/](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/public/assets/) 下的每个区域设置输出（例如 `translation_demo_svg.de.svg`）；[page.tsx](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/src/app/page.tsx) 中的运行时 URL (`/assets/translation_demo_svg.${locale}.svg`)。

---

<a id="pattern-e---colocated-translated-svg-doc-system"></a>
