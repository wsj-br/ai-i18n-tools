<a id="integrations"></a>
# 集成

框架集成参考：它们的共同点以及外围字符串有何不同。要向网站添加语言，请从[为网站或文档站点添加 i18n](/zh-Hans/guide/add-i18n-to-website)开始。对于应用，请从[为 JS/TS 应用添加 i18n](/zh-Hans/guide/add-i18n-to-js)或[为 Python 应用添加 i18n](/zh-Hans/guide/add-i18n-to-python)开始。对于仓库 README 和其他 Markdown 文件，请从[为您的 README 和 Markdown 文档添加 i18n](/zh-Hans/guide/add-i18n-to-readme)开始。

文档集成使用[文档](/zh-Hans/guide/documents/)流水线 (`translate-docs` / `sync`) 处理页面内容；外围字符串（导航、侧边栏、主题）在注明的情况下，在同一流水线内处理——而不是通过单独的 [JSON](/zh-Hans/guide/json) 流水线。Python 应用程序使用 [UI 字符串](/zh-Hans/guide/ui-strings/python) 流水线 (`extract` / `translate-ui`)。

<a id="which-guide-to-read"></a>
## 阅读哪个指南

包含每个框架一个初始化模板的选择表位于[为网站或文档站点添加国际化支持](/zh-Hans/guide/add-i18n-to-website#initialise-the-project)中。该页面上的操作指南提示可启用框架的国际化支持。下方的集成页面保留了 shell-catalog 的详细信息。Python 框架：[Python](/zh-Hans/guide/integrations/python)。

<a id="shared-concepts"></a>
## 共享概念

文档框架集成共享 [Documents](/zh-Hans/guide/documents/) 中描述的相同 `docs[]` 块模型。将 `docsOutput.style` 设置为与您的框架匹配 (`"docusaurus"`, `"vitepress"`, `"nextra"`, `"fumadocs"`, 或 `"astro-starlight"`)。有关输出文件夹布局和链接重写行为，请参阅 [Output layouts](/zh-Hans/guide/documents/output-layouts) 和 [Link rewriting](/zh-Hans/guide/documents/link-rewriting)。Python 设置是独立的：[Python](/zh-Hans/guide/integrations/python)。

每个 `init -t ui-* -P <provider>` 脚手架都会写入该预设的 LLM 提供商块。在 `translate-docs` 或 `sync` 之前，请设置相应的 API 密钥 — 请参阅 [提供商和 API 密钥](/zh-Hans/guide/quick-start#provider-and-api-key)。

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
| Streamlit | [examples/python-streamlit](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-streamlit) |
| Flask | [examples/python-flask](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-flask) |
| FastAPI | [examples/python-fastapi](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-fastapi) |
| GNU gettext | [examples/python-gettext](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-gettext) |
