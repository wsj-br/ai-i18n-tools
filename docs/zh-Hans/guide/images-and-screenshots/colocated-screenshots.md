<a id="colocated-raster-doc-system"></a>
# 并置栅格 (`doc-system`)

当一个 `doc-system` 站点将特定于区域设置的资源与翻译后的 markdown 并置时使用 — 无需进行 URL 重写。Docusaurus 预设 (`docsOutput.style = "docusaurus"`) 是参考实现；其他使用 `"doc-system"` 和自定义 `localeSubpath` 的生成器遵循相同的思路：英文资源位于源区域设置路径下，翻译后的资源位于 `{outputDir}/{locale}/[localeSubpath/]assets/` 下。

> **为什么没有仓库内示例：** 本仓库的 Docusaurus 示例（[`examples/docusaurus-docs`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs/)、[`examples/nextjs-app`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/)）改用[按语言环境的文件夹](/zh-Hans/guide/images-and-screenshots/per-locale-folder)布局——请参阅[决策指南](/zh-Hans/guide/images-and-screenshots/#decision-guide)。共置的 `../assets/` 是推荐的全新项目模式；[duplistatus](https://github.com/wsj-br/duplistatus) 是完整的生产环境参考。

<a id="directory-layout"></a>
### 目录布局

<details>
<summary>示例并置资源目录树（Docusaurus）</summary>

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

每个区域设置的所有文档都使用相同的相对路径：

```markdown
![Dashboard](../assets/screen-dashboard.png)
```

对于英文（`en-GB`）区域设置，`../assets/` 通过符号链接解析到 `static/assets/`。对于翻译后的区域设置，它直接解析到该区域设置自己的 `current/assets/` 目录。

<a id="screenshot-script-contract"></a>
### 屏幕截图脚本约定

脚本必须将 PNG 文件写入每个区域设置的正确目录。`getScreenshotDir` 函数对此进行编码：

```js
function getScreenshotDir(locale) {
  if (locale === 'en-GB') return 'documentation/static/assets';
  return `documentation/i18n/${locale}/docusaurus-plugin-content-docs/current/assets`;
}
```

请参阅 [duplistatus](https://github.com/wsj-br/duplistatus) 存储库中 [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) 的实际实现。

<a id="config"></a>
### 配置

光栅文件不需要 `regexAdjustments` 规则。`translate-docs` 会翻译 markdown 中的 alt 文本，但 URL 保持不变：

```json
{
  "docsOutput": {
    "style": "docusaurus",
    "docsRoot": "documentation/docs"
  }
}
```

如果项目还使用已翻译的 SVG，[并置 SVG 翻译](/zh-Hans/guide/svg-translation/translated-svg-colocated) 会处理它们，并且它们会与 PNG 一起放置在 `current/assets/` 中，无需额外的正则表达式。

<a id="prerequisites"></a>
### 先决条件

- 必须存在 `docs/assets` 符号链接：`ln -s ../static/assets documentation/docs/assets`
- Docusaurus webpack 默认会跟随符号链接（Docusaurus 构建中 `resolve.symlinks` 默认为 `true`）
- 符号链接仅在源区域设置中存在即可 — 翻译后的构建不使用它

<a id="implementation-example"></a>
### 实现示例

[duplistatus](https://github.com/wsj-br/duplistatus) — [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) 中的 `getScreenshotDir(locale)`；英文文档引用并置 PNG（例如 [dashboard.md](https://github.com/wsj-br/duplistatus/blob/master/documentation/docs/user-guide/dashboard.md) 和 `../assets/screen-dashboard-summary.png`）。来自同一项目的并置 SVG 放置在相同的 `current/assets/` 目录中 — 请参阅 [并置 SVG](/zh-Hans/guide/svg-translation/translated-svg-colocated)。
