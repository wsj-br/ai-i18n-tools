<a id="integrations"></a>
# 集成

将 ai-i18n-tools 接入文档站点和 Astro 项目的框架专属指南。每个集成均使用 [文档](/zh-Hans/guide/documents/) 管道（`translate-docs` / `sync`）处理页面内容；外壳字符串（导航、侧边栏、主题）在注明的情况下也在同一管道中处理——而非通过独立的 [JSON](/zh-Hans/guide/json) 管道。

<a id="which-guide-to-read"></a>
## 阅读哪个指南

| 你的站点 | 初始模板 | 从这里开始 |
| --- | --- | --- |
| Astro Starlight 或原生 Astro | `ui-starlight` / 混合 UI 字符串 | [Astro](/zh-Hans/guide/integrations/astro) |
| Docusaurus | `ui-docusaurus` | [Docusaurus](/zh-Hans/guide/integrations/docusaurus) |
| VitePress | `ui-vitepress` | [VitePress](/zh-Hans/guide/integrations/vitepress) |
| Nextra 4（Next.js App Router）| `ui-nextra` | [Nextra](/zh-Hans/guide/integrations/nextra) |
| Fumadocs 4（Next.js App Router）| `ui-fumadocs` | [Fumadocs](/zh-Hans/guide/integrations/fumadocs) |

<a id="shared-concepts"></a>
## 共享概念

所有文档框架集成均共享 [文档](/zh-Hans/guide/documents/) 中所述的相同 `docs[]` 块模型。请将 `docsOutput.style` 设置为与你的框架相匹配（`"docusaurus"`、`"vitepress"`、`"nextra"`、`"fumadocs"` 或 `"astro-starlight"`）。有关输出文件夹布局和链接重写行为，请参见 [输出布局](/zh-Hans/guide/documents/output-layouts) 和 [链接重写](/zh-Hans/guide/documents/link-rewriting)。

每个 `init -t ui-*` 模板都会生成一个默认的 LLM 提供商块（除非你传入 `-P <provider>`，否则为 `openrouter`）。在 `translate-docs` 或 `sync` 之前，如有需要请配置 `provider` / `providers` 并设置相应的 API 密钥 — 参见[提供商和 API 密钥](/zh-Hans/guide/quick-start#provider-and-api-key)。

有关跨框架比较，请参阅[框架外壳翻译](#framework-shell-translation)。下方链接的每个指南均涵盖相应框架的设置。

<a id="framework-shell-translation"></a>
## 框架外壳翻译

| 框架 | 外壳/主题字符串 | 管道 |
|-----------|----------------------|----------|
| Docusaurus | `write-translations` 目录 (`{ message, description }`) | 文档 — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | 主题/导航/侧边栏目录 | 文档 — `docsOutput.vitepressThemeCatalog` + `translate-docs` |
| Nextra | `_meta.ts` 侧边栏标签 | 文档 — 当 `style: "nextra"` + `translate-docs` 时自动 |
| Nextra | 主题字典 `.ts` | 文档 — `docs[].nextraDictionaryPath` + `translate-docs` |
| Fumadocs | `meta.json` 侧边栏标签 | 文档 — 当 `style: "fumadocs"` + `translate-docs` 时自动 |
| Fumadocs | UI 覆盖目录 | 文档 — `docsOutput.fumadocsUiCatalog` + `translate-docs` |
| Astro Starlight | 内置 UI 字符串（多语言支持）；无额外外壳管道 | 文档 — `translate-docs`（仅页面） |

请**不要**将框架外壳/主题字符串放入 `json[]` — 该流水线用于无关的应用程序语言包。各框架的设置详情请参阅从[阅读哪份指南](#which-guide-to-read)链接的指南。

<a id="runnable-examples"></a>
## 可运行示例

| 框架 | 示例仓库 |
| --- | --- |
| Astro Starlight | [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) |
| 原生 Astro 网站 | [examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) |
| Docusaurus | [examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs) |
| VitePress | [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs) |
| Nextra | [examples/nextra-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs) |
| Fumadocs | [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs) |
