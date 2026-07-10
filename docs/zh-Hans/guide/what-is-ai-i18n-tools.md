<a id="what-is-ai-i18n-tools"></a>
# 什么是 ai-i18n-tools？

ai-i18n-tools 是一个命令行工具和工具包，可帮助您使用首选的 LLM 提供商翻译您的应用程序和文档。您可以通过单个配置文件控制所有内容，选择要启用的翻译功能。使用“sync”命令一次性运行您需要的模式。

<a id="translation-modes"></a>
## 翻译模式

- **UI 字符串** — 从 JS/TS 源码中提取 `t("…")` 调用（及类似标记），为 i18next 或静态查找生成扁平的按语言环境的 JSON 文件。命令：`extract`、`translate-ui`。指南：[UI 字符串](/zh-Hans/guide/ui-strings/)。
- **文档** — 翻译 `docs[].contentPaths` 中列出的 Markdown、MDX 和 `.astro` 页面。支持 VitePress、Starlight、Docusaurus、Nextra、Fumadocs、Astro 及其他静态文档站点。命令：`translate-docs`。指南：[文档](/zh-Hans/guide/documents/)。
- **JSON** — 翻译在顶层 `json[]` 中定义的嵌套 JSON 语言包（主题标签、i18n 覆盖项、源码中未包含的应用文案）。命令：`translate-json`。指南：[JSON](/zh-Hans/guide/json)。
- **SVG** — 翻译 SVG 插图中的可见文本（`<text>`、`<title>`、`<desc>`），并为每个语言环境生成一个输出文件。与文档翻译相互独立 — `translate-docs` 不会修改 SVG 资源。命令：`translate-svg`。指南：[SVG 翻译](/zh-Hans/guide/svg-translation/)。

所有四种模式都使用活动的 [LLM 提供商](/zh-Hans/guide/providers-and-models)，共享相同的配置文件，并重用 SQLite 缓存，因此重新运行只会将新的或更改的文本发送到模型。

<a id="which-should-i-use"></a>
## 我应该使用哪种模式？

| 您的内容 | 模式 | 命令 |
| --- | --- | --- |
| 源代码使用 `t()` 或 HTML `data-i18n` 标记 | UI 字符串 | `extract` / `translate-ui` |
| 本地化页面或文档站点 | 文档 | `translate-docs` |
| 独立的嵌套 JSON 区域设置文件 | JSON | `translate-json` |
| 带有 SVG 标签的图表或插图 | SVG | `translate-svg` |

许多项目结合使用多种模式——例如，VitePress 站点的 UI 字符串加文档，或带插图指南的文档加 SVG。请参阅 [快速入门](/zh-Hans/guide/quick-start) 获取脚手架模板，并参阅 [配置](/zh-Hans/reference/configuration) 获取完整的配置架构。

<a id="examples"></a>
## 示例

该存储库在 `examples/` 下提供了可运行的示例项目——每个项目都有自己的配置、已提交的区域设置输出和 README。您可以在没有 API 密钥的情况下浏览翻译文件；重新运行翻译需要提供商密钥（请参阅 [提供商和模型](/zh-Hans/guide/providers-and-models)）。

| 示例 | 显示内容 |
| --- | --- |
| [console-app](/zh-Hans/examples#console-app) | 最小的端到端应用程序：`t()` UI 字符串加 README 翻译 |
| [nextjs-app](/zh-Hans/examples#nextjs-app) | Next.js UI、复数、SVG、嵌套的 Docusaurus 文档、扁平化 README、仪表板 |
| [docusaurus-docs](/zh-Hans/examples#docusaurus-docs) | 独立的 Docusaurus 文档站点 |
| [astro-website](/zh-Hans/examples#astro-website) | Astro 营销站点：全页 HTML 翻译加 `t()` 字符串 |
| [astro-docs](/zh-Hans/examples#astro-docs) | Astro Starlight 文档站点 |
| [vitepress 文档](/zh-Hans/examples#vitepress-docs) | VitePress 文档及主题目录 |
| [nextra 文档](/zh-Hans/examples#nextra-docs) | Nextra 文档及 `_meta.ts` 侧边栏标签和主题词典 |
| [fumadocs-docs](/zh-Hans/examples#fumadocs-docs) | Fumadocs 文档及 `meta.json` 侧边栏标签和 UI 目录 |
| [multi-provider](/zh-Hans/examples#multi-provider) | 比较同一文档上的 LLM 提供商 |
| [test-markdown](/zh-Hans/examples#test-markdown) | Markdown 管道压力测试（CJK、天城文、边缘情况） |

请参阅 [示例](/zh-Hans/examples) 获取 `npx degit` 复制命令和选择指南。

<a id="next-steps"></a>
## 后续步骤

1. [安装](/zh-Hans/guide/installation) — 安装软件包并设置您的提供商 API 密钥。
2. [快速入门](/zh-Hans/guide/quick-start) — 构建配置并运行您的首次翻译。
3. [提供商和模型](/zh-Hans/guide/providers-and-models) — 选择提供商、模型回退链和 `-P` 覆盖。
