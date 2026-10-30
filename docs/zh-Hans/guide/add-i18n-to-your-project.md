<a id="add-i18n-to-your-project"></a>
# 为你的项目添加 i18n

本节是一系列演练，适用于目前仅支持一种语言的项目。请从这里开始。下面的每个页面都将介绍一种项目类型，从设置到生成第一个翻译文件的完整过程。[开始使用](/zh-Hans/guide/what-is-ai-i18n-tools) 页面介绍了该工具是什么、安装选项以及提供商和模型。你可以无需先阅读这些页面就直接打开一个演练。

<a id="what-you-do-and-what-the-tool-does"></a>
## 你做什么以及工具做什么

| 你 | 工具 |
| --- | --- |
| 选择要尝试的语言、提供商和模型 | 提取文本，进行翻译，检查结果，并写入目录或页面 |
| 使文本可见：在应用代码中使用 `t()`、使用网站框架的 i18n，或在 README 中使用语言列表标记 | 缓存每次翻译，并在下次运行时复用 |
| 加载文件并检查一种语言 | 显示进度，并让你在 [翻译仪表板](/zh-Hans/guide/translation-dashboard/) 中审查措辞 |

演练会说明哪些源文件编辑需要你来完成。对于那些机械化的编辑，我们提供了编码代理提示。CLI 会写入目录和已翻译的文件。它不会安装 i18next 或你的网站框架的 i18n。

<a id="shared-setup"></a>
## 通用设置

每篇演练都遵循相同的顺序。你选择的页面会填充具体细节。

1. 安装 CLI 并设置您的提供商 API 密钥。Ollama 无需密钥。[安装](/zh-Hans/guide/installation) 和 [提供商和 API 密钥](/zh-Hans/guide/quick-start#provider-and-api-key)。
2. 运行 `init`，使用该页面指定的模板。这会写入 `ai-i18n-tools.config.json`。
3. 准备项目，以便工具能够识别文本。使用该页面的代理提示，或同一页面上的手动步骤。
4. 运行 `ai-i18n-tools sync`，然后运行 `ai-i18n-tools status`。
5. 加载输出，检查一种目标语言，并在源文件更改时重新运行 `sync`。缓存只会将新的或已更改的文本发送给模型。

<a id="pages-in-this-section"></a>
## 本节页面

| 您拥有 | 页面 | 该页面涵盖的内容 |
| --- | --- | --- |
| 一个按钮和消息仍为纯文本的 JS/TS 应用（React、Next.js、Node、CLI） | [为 JS/TS 应用添加 i18n](/zh-Hans/guide/add-i18n-to-js) | 安装 i18next，添加引导程序，将字面量包装在 `t()` 中，并添加语言切换功能，然后 `extract` 和 `translate-ui` |
| 一个 Python 应用（Streamlit、FastAPI、Flask、桌面应用、脚本） | [为 Python 应用添加 i18n](/zh-Hans/guide/add-i18n-to-python) | 放置 `i18n.py` 辅助函数，包装 `t()` 或 `_()`，添加语言切换功能。CLI 可以从独立可执行文件运行，无需安装 Node.js |
| 一个 Django 应用、带有 Flask-Babel 目录的 Flask 应用，或任何已使用 GNU gettext 的应用 | [为 Django / Python gettext 应用添加 i18n](/zh-Hans/guide/add-i18n-to-django-gettext) | 保留 `gettext`、`{% blocktranslate %}` 和您的 `.po` 文件。该工具会填充并编译目录 |
| 一个文档或营销网站（VitePress、Starlight、Docusaurus、Nextra、Fumadocs、Astro、纯 HTML） | [为网站或文档站点添加 i18n](/zh-Hans/guide/add-i18n-to-website) | 使用该页面的代理提示启用框架的 i18n，然后 `sync` 以翻译页面和主题标签 |
| 一个仓库的 README 和其他 Markdown 文件，通常与应用放在一起 | [为你的 README 和 Markdown 文档添加 i18n](/zh-Hans/guide/add-i18n-to-readme) | 每种语言一个文件（`translated-docs/README.de.md`），并在 README 中添加一个语言行。`init --with-readme` 会将该块添加到任何模板中 |
| 一个仓库中包含上述多种情况 | [组合流水线](/zh-Hans/guide/combining-pipelines) | 一个配置和一个 `sync`。通常的组合是应用 UI 字符串加上 README |
| 拥有 Intlayer 词典，并希望保留 Intlayer | [就地翻译 Intlayer](/zh-Hans/guide/translating-intlayer) | `translate-intlayer` 会填充 `*.content.ts` 中缺失和过时的叶节点 |
| 拥有 Intlayer 词典，但正在从 Intlayer 迁移 | [从 Intlayer 迁移](/zh-Hans/guide/migrating-from-intlayer) | `migrate-intlayer` 会从词典中填充目录，并将安全的调用点重写为 `t()` |

如果一个应用也有 README，则需要同时使用应用页面和 README 页面的指南。如果一个网站也有 README，则使用网站页面的指南，并为 README 块使用 `init … --with-readme`。

<a id="where-to-go-deeper"></a>
## 深入了解

演练在接入第一门语言后便会结束。之后的内容请参阅参考页面：

- [UI 字符串](/zh-Hans/guide/ui-strings/)、[文档](/zh-Hans/guide/documents/)、[JSON](/zh-Hans/guide/json) 和 [SVG](/zh-Hans/guide/svg-translation/)，一次用于一个流水线。
- [集成](/zh-Hans/guide/integrations/)，用于框架外壳字符串（导航、侧边栏、主题）。
- [快速入门](/zh-Hans/guide/quick-start)，用于命令列表和推荐的 `package.json` 脚本。
- [LLM 提供程序](/zh-Hans/guide/providers-and-models)，用于预设和 API 密钥。
- [AI 模型](/zh-Hans/guide/ai-models)，用于已排序的候选列表和回退链。
