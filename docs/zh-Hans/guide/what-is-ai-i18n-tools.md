<a id="what-is-ai-i18n-tools"></a>
# 什么是 ai-i18n-tools？

您有一个应用、网站、文档站点或仓库自述文件，它只有一种语言，而您希望支持更多语言。这种语言是 `sourceLocale`，它可以是任何语言。在这些指南中，英语是一个常见的例子。ai-i18n-tools 会找到文本，使用您选择的 LLM 提供商上的模型进行翻译，并写入您的项目已加载的文件。它会缓存每个结果，因此重新运行时只会将新的或更改的文本发送到模型。

<a id="what-you-do-and-what-the-tool-does"></a>
## 你做什么以及工具做什么

| 您 | 工具 |
| --- | --- |
| 选择要尝试的语言、提供商和模型 | 提取文本、进行翻译、验证结果并写入目录或页面 |
| 让面向用户的文本对工具可见：应用代码中的 `t()` 调用、网站框架自身的 i18n，或自述文件中的语言列表标记 | 缓存翻译并在每次重新运行时重用它们 |
| 将结果接入应用、网站的路由或自述文件的语言行 | 显示进度并让你在仪表板中审查翻译 |

该工具不会重写你的源代码。为包装步骤提供了编码代理提示。它不会安装 i18next 或你的网站框架的 i18n，也不会构建你的语言切换器，不过为此提供了运行时帮助程序。

<a id="where-do-i-start"></a>
## 从何开始？

演练分组在[为你的项目添加 i18n](/zh-Hans/guide/add-i18n-to-your-project)中，其中包含共享设置和针对每种项目的页面。请选择一行：

| 你有 | 从这里开始 |
| --- | --- |
| 源代码中包含纯文本的 JS/TS 应用（React、Next.js、Node、CLI） | [为 JS/TS 应用添加 i18n](/zh-Hans/guide/add-i18n-to-js) |
| Python 应用（Streamlit、FastAPI、Flask、Django、gettext、桌面） | [为 Python 应用添加 i18n](/zh-Hans/guide/add-i18n-to-python) |
| 网站或文档站点（VitePress、Docusaurus、Starlight、Nextra、Fumadocs、Astro、纯 HTML） | [为网站或文档站点添加 i18n](/zh-Hans/guide/add-i18n-to-website) |
| 仓库自述文件和其他 Markdown 文件，通常与应用放在一起 | [为你的自述文件和 Markdown 文档添加 i18n](/zh-Hans/guide/add-i18n-to-readme) |
| 独立的嵌套 JSON 区域设置文件 | [JSON](/zh-Hans/guide/json) |
| 带有文本标签的 SVG 图表 | [SVG 翻译](/zh-Hans/guide/svg-translation/) |
| Intlayer 字典（迁出 Intlayer） | [从 Intlayer 迁移](/zh-Hans/guide/migrating-from-intlayer) |
| Intlayer 字典（保留 Intlayer，就地翻译） | [就地翻译 Intlayer](/zh-Hans/guide/translating-intlayer) |

<a id="how-it-works"></a>
## 工作原理

1. 安装 CLI 并设置提供商的 API 密钥：[安装](/zh-Hans/guide/installation)。
2. 运行 `init` 以写入 `ai-i18n-tools.config.json`：[快速入门](/zh-Hans/guide/quick-start)。
3. 准备项目：将字符串包装在 `t()` 中，启用网站框架的 i18n，或将语言列表标记添加到自述文件中。
4. 运行 `sync`。它会提取文本，翻译新内容，并写入输出。
5. 在你的应用或网站中加载输出，添加语言切换器，并在源文件更改时重新运行 `sync`。

<a id="translation-modes"></a>
## 翻译模式

在底层，该工具运行四个流水线。你的配置会启用你需要的流水线，`sync` 会按顺序运行它们。

- UI 字符串 — 从 JS/TS 和 Python 源代码中提取 `t("…")` 和 `_()` 调用（以及类似的标记，包括 GNU gettext），并写入每个区域设置的扁平化 JSON 或 `.po` / `.mo` 目录。命令：`extract`、`translate-ui`。指南：[UI 字符串](/zh-Hans/guide/ui-strings/)。Python：[Python 应用](/zh-Hans/guide/ui-strings/python)。
- 文档 — 翻译 `docs[].contentPaths` 中列出的 Markdown、MDX 和 `.astro` 页面。适用于 VitePress、Starlight、Docusaurus、Nextra、Fumadocs、Astro 和其他静态文档站点，以及仓库自述文件（`flat` 的 `docsOutput.style`）。命令：`translate-docs`。指南：[文档](/zh-Hans/guide/documents/) 和 [为你的自述文件和 Markdown 文档添加 i18n](/zh-Hans/guide/add-i18n-to-readme)。
- JSON — 翻译在顶层 `json[]` 中定义的嵌套 JSON 区域设置包（主题标签、i18n 覆盖、不在源代码中的应用文案）。命令：`translate-json`。指南：[JSON](/zh-Hans/guide/json)。
- SVG — 翻译 SVG 插图（`<text>`、`<title>`、`<desc>`）内的可见文本，并为每个区域设置写入一个输出文件。与文档翻译分开。命令：`translate-svg`。指南：[SVG 翻译](/zh-Hans/guide/svg-translation/)。

许多项目会组合多种模式。常见的组合是 UI 字符串加上仓库的 README。像 VitePress 这样的文档网站是另一种常见的组合。请参阅[组合管道](/zh-Hans/guide/combining-pipelines)和[为您的 README 和 Markdown 文档添加 i18n](/zh-Hans/guide/add-i18n-to-readme)。

<a id="examples"></a>
## 示例

该仓库在 `examples/` 下提供了可运行的示例项目，每个项目都有自己的配置、已提交的本地化输出和 README。无需 API 密钥即可浏览已翻译的文件；重新运行翻译则需要提供商密钥。

| 如果您有 | 示例 |
| --- | --- |
| 一个 JS/TS 应用 | [console-app](/zh-Hans/examples#console-app), [nextjs-app](/zh-Hans/examples#nextjs-app) |
| 一个与应用并存的仓库 README | [console-app](/zh-Hans/examples#console-app), [nextjs-app](/zh-Hans/examples#nextjs-app) |
| 一个 Python 应用 | [python-streamlit](/zh-Hans/examples#python-streamlit), [python-fastapi](/zh-Hans/examples#python-fastapi), [python-gettext](/zh-Hans/examples#python-gettext) |
| 一个文档网站 | [docusaurus-docs](/zh-Hans/examples#docusaurus-docs), [vitepress-docs](/zh-Hans/examples#vitepress-docs), [astro-docs](/zh-Hans/examples#astro-docs) |
| 一个网站或纯 HTML | [astro-website](/zh-Hans/examples#astro-website), [plain-html](/zh-Hans/examples#plain-html) |

请参阅[示例](/zh-Hans/examples)查看完整列表和 `npx degit` 复制命令。

<a id="next-steps"></a>
## 后续步骤

1. [安装](/zh-Hans/guide/installation) — 安装 npm 包，或为 Python 项目下载[独立可执行文件](/zh-Hans/guide/installation#standalone-executables)，并设置你的提供商 API 密钥。
2. [快速入门](/zh-Hans/guide/quick-start) — 构建配置并运行你的首次翻译。
3. [LLM 提供商](/zh-Hans/guide/providers-and-models) — 选择提供商、API 密钥和 `-P` 覆盖。
4. [AI 模型](/zh-Hans/guide/ai-models) — 使用 `suggest-models` 或仪表板的 **模型** 选项卡对候选列表进行排序，并保留多个模型，以便在翻译失败时可以尝试下一个模型。
