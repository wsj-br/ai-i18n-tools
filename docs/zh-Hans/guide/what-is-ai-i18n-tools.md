<a id="what-is-ai-i18n-tools"></a>
# 什么是 ai-i18n-tools？

ai-i18n-tools 是一个命令行工具和工具包，可帮助您使用首选的 LLM 提供商翻译您的应用程序和文档。您可以通过单个配置文件控制所有内容，选择要启用的翻译功能。使用“sync”命令一次性运行您需要的模式。

<a id="translation-modes"></a>
## 翻译模式

- **UI 字符串** — 从 JS/TS 源代码中提取 `t("…")` 调用（和类似标记），并为 i18next 或静态查找写入扁平的每个区域设置 JSON 文件。命令：`extract`、`translate-ui`。指南：[UI 字符串](/guide/ui-strings/)。
- **文档** — 翻译 `docs[].contentPaths` 中列出的 Markdown、MDX 和 `.astro` 页面。适用于 VitePress、Starlight、Docusaurus、Astro 和其他静态文档站点。命令：`translate-docs`。指南：[文档](/guide/documents/)。
- **JSON** — 翻译顶级 `json[]` 中定义的嵌套 JSON 区域设置包（主题标签、i18n 覆盖、不在源代码中的应用程序文本）。命令：`translate-json`。指南：[JSON](/guide/json)。
- **SVG** — 翻译 SVG 插图（`<text>`、`<title>`、`<desc>`）中可见的文本，并为每个区域设置写入一个输出文件。与文档翻译分开 — `translate-docs` 不修改 SVG 资产。命令：`translate-svg`。指南：[SVG 翻译](/guide/svg-translation/)。

所有四种模式都使用活动的 [LLM 提供商](/guide/providers-and-models)，共享相同的配置文件，并重用 SQLite 缓存，因此重新运行只会将新的或更改的文本发送到模型。

<a id="which-should-i-use"></a>
## 我应该使用哪种模式？

| 您的内容 | 模式 | 命令 |
| --- | --- | --- |
| 源代码使用 `t()` 或 HTML `data-i18n` 标记 | UI 字符串 | `extract` / `translate-ui` |
| 本地化页面或文档站点 | 文档 | `translate-docs` |
| 独立的嵌套 JSON 区域设置文件 | JSON | `translate-json` |
| 带有 SVG 标签的图表或插图 | SVG | `translate-svg` |

许多项目结合使用多种模式——例如，VitePress 站点的 UI 字符串加文档，或带插图指南的文档加 SVG。请参阅 [快速入门](/guide/quick-start) 获取脚手架模板，并参阅 [配置](/reference/configuration) 获取完整的配置架构。

<a id="examples"></a>
## 示例

该存储库在 `examples/` 下提供了可运行的示例项目——每个项目都有自己的配置、已提交的区域设置输出和 README。您可以在没有 API 密钥的情况下浏览翻译文件；重新运行翻译需要提供商密钥（请参阅 [提供商和模型](/guide/providers-and-models)）。

| 示例 | 显示内容 |
| --- | --- |
| [console-app](/examples#console-app) | 最小的端到端应用程序：`t()` UI 字符串加 README 翻译 |
| [nextjs-app](/examples#nextjs-app) | Next.js UI、复数、SVG、Docusaurus 文档站点、仪表板 |
| [astro-website](/examples#astro-website) | Astro 营销站点：全页 HTML 翻译加 `t()` 字符串 |
| [astro-docs](/examples#astro-docs) | Astro Starlight 文档站点 |
| [vitepress-docs](/examples#vitepress-docs) | VitePress 文档加主题 JSON |
| [multi-provider](/examples#multi-provider) | 比较同一文档上的 LLM 提供商 |
| [test-markdown](/examples#test-markdown) | Markdown 管道压力测试（CJK、天城文、边缘情况） |

请参阅 [示例](/examples) 获取 `npx degit` 复制命令和选择指南。

<a id="next-steps"></a>
## 后续步骤

1. [安装](/guide/installation) — 安装软件包并设置您的提供商 API 密钥。
2. [快速入门](/guide/quick-start) — 构建配置并运行您的首次翻译。
3. [提供商和模型](/guide/providers-and-models) — 选择提供商、模型回退链和 `-P` 覆盖。
