<a id="add-i18n-to-a-website-or-docs-site"></a>
# 为网站或文档站点添加 i18n

本页面适用于处理单语言的文档网站（Markdown 或 MDX）或营销/静态网站（Astro 网站或纯 HTML）。该工具会使用您的 LLM 提供商上的模型来翻译您的页面内容，并为每种语言写入一个本地化副本。您的网站框架会提供这些副本，并提供语言切换器。

对于 UI 字符串位于 `t()` 调用中的应用，请改用[为 JS/TS 应用添加 i18n](/zh-Hans/guide/add-i18n-to-js)或[为 Python 应用添加 i18n](/zh-Hans/guide/add-i18n-to-python)。

<a id="what-do-you-have"></a>
## 你的情况是？

| 你的站点 | 初始模板 | 从这里开始 |
| --- | --- | --- |
| Astro Starlight 或原生 Astro | `ui-starlight` / 混合 UI 字符串 | [Astro](/zh-Hans/guide/integrations/astro) |
| Docusaurus | `ui-docusaurus` | [Docusaurus](/zh-Hans/guide/integrations/docusaurus) |
| VitePress | `ui-vitepress` | [VitePress](/zh-Hans/guide/integrations/vitepress) |
| Nextra 4（Next.js App Router）| `ui-nextra` | [Nextra](/zh-Hans/guide/integrations/nextra) |
| Fumadocs 4（Next.js App Router）| `ui-fumadocs` | [Fumadocs](/zh-Hans/guide/integrations/fumadocs) |
| 纯 HTML 页面 | `ui-plain-html` 或 `docs-plain-html` | [纯 HTML 应用](/zh-Hans/guide/ui-strings/plain-html) |
| 没有站点框架，只有 README 和 Markdown 文件 | `docs-markdown`，或任何模板加上 `--with-readme` | [为你的 README 和 Markdown 文档添加 i18n](/zh-Hans/guide/add-i18n-to-readme) |

<details class="agent-prompt">
<summary>代理提示</summary>

- Astro Starlight：仅注释。Astro `t()` 文件：[JS/TS 提示](/zh-Hans/guide/add-i18n-to-js#agent-prompt)（跳过 i18next）。
- Docusaurus：仅注释（`<Translate>` 是 Docusaurus 自己的 API）。
- VitePress：[主题目录提示](/zh-Hans/guide/integrations/vitepress#wire-configmts-to-generated-theme-json-one-off)。
- Nextra：[字典提示](/zh-Hans/guide/integrations/nextra#agent-prompt-dictionary) 和[混合 `t()` 提示](/zh-Hans/guide/integrations/nextra#optional-t-for-app-react-hybrid)。
- Fumadocs：[UI 目录提示](/zh-Hans/guide/integrations/fumadocs#agent-prompt)。
- README 和 Markdown 文件：[README 提示](/zh-Hans/guide/add-i18n-to-readme#agent-prompt)。

</details>

<a id="steps"></a>
## 步骤

每个框架的流程结构都相同；具体细节请参阅上面链接的框架指南。

1. 安装 CLI 并设置 API 密钥：[安装](/zh-Hans/guide/installation)、[提供商和 API 密钥](/zh-Hans/guide/quick-start#provider-and-api-key)。
2. 搭建脚手架：`ai-i18n-tools init -t <template> -P <provider>`。
3. 设置 `sourceLocale`、`targetLocales` 和 `docs[].contentPaths`（用源语言编写的页面和文件夹）。`sourceLocale` 可以是任何语言。框架指南会展示正确的 `docsOutput.style`。
4. 启用框架自带的 i18n 功能，以便它能提供并链接本地化页面。每个指南都有一个“在现有站点中启用 i18n”部分：[VitePress](/zh-Hans/guide/integrations/vitepress#enable-i18n-in-an-existing-site)、[Docusaurus](/zh-Hans/guide/integrations/docusaurus#enable-i18n-in-an-existing-site)、[Nextra](/zh-Hans/guide/integrations/nextra#enable-i18n-in-an-existing-site)、[Fumadocs](/zh-Hans/guide/integrations/fumadocs#enable-i18n-in-an-existing-site)、[Astro](/zh-Hans/guide/integrations/astro#enable-i18n-in-an-existing-site)。
5. 运行 `ai-i18n-tools sync`（或 `translate-docs`），然后构建站点。
6. 在浏览器中检查一个本地化路由。框架自带的区域设置下拉菜单就是切换器。对于像 README 这样的扁平 Markdown 文件，使用 [languageListBlock](/zh-Hans/guide/documents/language-switcher) 添加一个链接行。

<a id="what-gets-translated"></a>
## 翻译哪些内容

页面主体始终通过[文档](/zh-Hans/guide/documents/)管道处理。框架外壳（导航、侧边栏、主题标签）在框架支持的情况下，会在同一次运行中处理，而不是通过单独的 [JSON](/zh-Hans/guide/json) 管道。

| 框架 | 外壳和主题字符串 | 方式 |
| --- | --- | --- |
| Docusaurus | `write-translations` 目录 (`{ message, description }`) | `docs[].docusaurusCatalogDir` 加上 `translate-docs` |
| VitePress | 主题、导航和侧边栏目录 | `docsOutput.vitepressThemeCatalog` 加上 `translate-docs` |
| Nextra | `_meta.ts` 侧边栏标签 | 通过 `style: "nextra"` 自动完成 |
| Nextra | 主题字典 `.ts` | `docs[].nextraDictionaryPath` |
| Fumadocs | `meta.json` 侧边栏标签 | 通过 `style: "fumadocs"` 自动完成 |
| Fumadocs | UI 覆盖目录 | `docsOutput.fumadocsUiCatalog` |
| Astro Starlight | 内置多区域设置的 UI 字符串 | 仅页面 |

`translate-docs` 不会翻译图片和屏幕截图。有关特定于区域设置的文件，请参阅[图片和屏幕截图](/zh-Hans/guide/images-and-screenshots/)。

<a id="plain-html"></a>
## 纯 HTML

有两个选项，具体取决于页面的预期行为：

- 在浏览器中切换语言的单个页面：使用 `data-i18n*` 属性标记文本，并使用 UI 字符串运行时 (`ui-plain-html`)。请参阅[纯 HTML 应用](/zh-Hans/guide/ui-strings/plain-html)。
- 每个区域设置一个已翻译的 HTML 文件：使用文档管道 (`docs-plain-html`)。请参阅[HTML 页面](/zh-Hans/guide/documents/html-pages)。

一个文件属于一个路径。

<a id="not-your-case"></a>
## 不是您的情况？

- 应用 UI 字符串：[向 JS/TS 应用添加 i18n](/zh-Hans/guide/add-i18n-to-js) 或 [向 Python 应用添加 i18n](/zh-Hans/guide/add-i18n-to-python)。
- 站点旁边的仓库 README，或没有站点框架的 Markdown 文件：[向您的 README 和 Markdown 文档添加 i18n](/zh-Hans/guide/add-i18n-to-readme)。`init … --with-readme` 会在站点模板旁边添加该块。
- 独立的嵌套区域设置 JSON：[JSON](/zh-Hans/guide/json)。
- 同时翻译站点和应用字符串：[合并管道](/zh-Hans/guide/combining-pipelines)。

有关共享选项和各框架差异的参考：[集成](/zh-Hans/guide/integrations/)。
