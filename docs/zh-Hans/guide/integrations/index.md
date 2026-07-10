<a id="integrations"></a>
# 集成

将 ai-i18n-tools 接入文档站点和 Astro 项目的框架专属指南。每个集成均使用 [文档](/guide/documents/) 管道（`translate-docs` / `sync`）处理页面内容；外壳字符串（导航、侧边栏、主题）在注明的情况下也在同一管道中处理——而非通过独立的 [JSON](/guide/json) 管道。

<a id="which-guide-to-read"></a>
## 阅读哪个指南

| 你的站点 | 初始模板 | 从这里开始 |
| --- | --- | --- |
| Astro Starlight 或原生 Astro | `ui-starlight` / 混合 UI 字符串 | [Astro](/guide/integrations/astro) |
| Docusaurus | `ui-docusaurus` | [Docusaurus](/guide/integrations/docusaurus) |
| VitePress | `ui-vitepress` | [VitePress](/guide/integrations/vitepress) |
| Nextra 4（Next.js App Router）| `ui-nextra` | [Nextra](/guide/integrations/nextra) |
| Fumadocs 4（Next.js App Router）| `ui-fumadocs` | [Fumadocs](/guide/integrations/fumadocs) |

<a id="shared-concepts"></a>
## 共享概念

所有文档框架集成均共享 [文档](/guide/documents/) 中所述的相同 `docs[]` 块模型。请将 `docsOutput.style` 设置为与你的框架相匹配（`"docusaurus"`、`"vitepress"`、`"nextra"`、`"fumadocs"` 或 `"astro-starlight"`）。有关输出文件夹布局和链接重写行为，请参见 [输出布局](/guide/documents/output-layouts) 和 [链接重写](/guide/documents/link-rewriting)。

**不要**将框架外壳或主题字符串放入 `json[]`——该管道用于无关的应用程序语言包。每个集成页面都会说明该框架中哪些目录路径和 CLI 标志涵盖导航、侧边栏和主题标签。

<a id="examples"></a>
## 可运行示例

| 框架 | 示例仓库 |
| --- | --- |
| Astro Starlight | [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) |
| 原生 Astro 网站 | [examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) |
| Docusaurus | [examples/nextjs-app/docs-site](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/docs-site) |
| VitePress | [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs) |
| Nextra | [examples/nextra-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs) |
| Fumadocs | [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs) |
