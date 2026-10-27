---
layout: home
title: ai-i18n-tools
pageClass: home-onboarding
description: >-
  通过引导式设置、AI 翻译和缓存复用，将您的单语言应用、网站或仓库文档变为多语言。可以从 JavaScript、TypeScript、Python 或
  README 开始。
hero:
  name: ai-i18n-tools
  text: 将您的单语言项目变为多语言。
  tagline: 通过引导式设置和 AI 翻译，为您的应用、网站或仓库文档添加语言。选择您的提供商和模型，并在项目增长时复用缓存的翻译。
  image:
    src: /ai-i18n-tools_logo.svg
    alt: ai-i18n-tools 标志
  actions:
    - theme: brand
      text: 选择您的项目
      link: '#start-here'
    - theme: alt
      text: 浏览示例
      link: /zh-Hans/examples
---



<a id="start-here"></a>
## 从您已有的项目开始

目前只有一种语言？从这里开始。该语言可以是任何语言：将其设置为 `sourceLocale`。在这些指南中，英语是一个常见的例子。国际化 (i18n) 能让您的项目为支持不同语言做好准备；这些指南将引导您从设置开始，直到获得您的第一个翻译体验，包括您的仓库已在 GitHub、GitLab 或任何其他主机上显示的 README 文件。

<div class="home-paths">
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/typescript.svg" alt="" aria-hidden="true" width="26" height="26" />
<img class="icon-light" src="/icons/brands/react.svg" alt="" aria-hidden="true" width="26" height="26" />
<img class="icon-mono" src="/icons/brands/nextjs.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/nodejs.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/ui/terminal.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

### JavaScript 或 TypeScript 应用

将纯文本的按钮、标签和消息转变为多语言 UI。设置您的运行时，标记要翻译的文本，并配置语言切换。包含用于准备步骤的编码代理提示。

React · Next.js · Node.js · CLI

[为 JS/TS 应用添加 i18n](/zh-Hans/guide/add-i18n-to-js)

</article>
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/python.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/streamlit.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/fastapi.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/flask.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/ui/terminal.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

### Python 应用

封装面向用户的文本，并使用生成的辅助程序加载已翻译的消息，或保留原生 gettext。从独立的可执行文件运行翻译 CLI，无需单独安装 Node.js。

Streamlit · FastAPI · Flask · Django · CLI

[为 Python 应用添加 i18n](/zh-Hans/guide/add-i18n-to-python)

</article>
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/vitepress.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/astro.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/docusaurus.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

### 网站或文档

发布本地化页面，并将其连接到您网站的语言路由。遵循特定于框架的步骤来配置导航、主题标签和语言菜单。

VitePress · Starlight · Docusaurus · Astro

[为网站或文档网站添加 i18n](/zh-Hans/guide/add-i18n-to-website)

</article>
<article class="home-card">

<div class="home-card-logos">
<img class="icon-mono" src="/icons/brands/github.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/gitlab.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/bitbucket.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

### 仓库 README 和文档

将 `README.md` 和其他 Markdown 文件翻译成每种语言一个文件，并在文件间添加一行链接。您可以将其与应用的 UI 字符串配对，或单独翻译 README。

GitHub · GitLab · Bitbucket

[为您的 README 和 Markdown 文档添加 i18n](/zh-Hans/guide/add-i18n-to-readme)

</article>
</div>

不确定哪种路径适合您？[为您的项目添加 i18n](/zh-Hans/guide/add-i18n-to-your-project) 列出了每个演练。[了解 ai-i18n-tools 的功能](/zh-Hans/guide/what-is-ai-i18n-tools) 以了解这些流水线如何协同工作。

## 从设置到您的第一个新语言

<div class="home-steps">

1. **准备您的项目。** 选择您的语言、翻译提供商以及要尝试的模型。对于应用，标记面向用户的文本并设置翻译运行时。对于网站，启用框架的语言路由。指南中包含了在需要更改源代码时可用的编码代理提示。
2. **翻译成可用的文件。** 设置就绪后，运行 `sync`。它会提取支持的应用字符串，翻译您启用的内容，并写入区域设置文件或本地化页面。
3. **加载、检查并继续。** 将输出连接到您的应用或网站，连接语言切换功能，并检查一个目标语言。在源文件更改后重新运行，以翻译新增或更改的文本。

</div>

您可以手动或使用编码代理来处理运行时和路由设置。CLI 负责处理提取、翻译、验证和文件生成——而不是自动重写源代码或安装语言切换器。[遵循完整的快速入门](/zh-Hans/guide/quick-start)。

## 您的源文本。已为更多语言做好准备。

这个说明性的 JS/TS 示例展示了运行时设置和翻译后结果的结构。标记源字符串可使其被发现；每个生成的区域设置文件都会将该语句映射到其译文。

::: code-group

```js [Prepared source]
t("Save changes");
```

```json [Generated de.json]
{
  "Save changes": "Änderungen speichern"
}
```

```json [Generated pt-BR.json]
{
  "Save changes": "Salvar alterações"
}
```

```json [Generated zh-Hans.json]
{
  "Save changes": "保存更改"
}
```

:::

源句子在您的代码中保持可读。您的应用在运行时加载生成的区域设置文件。想看看完整的接线方式吗？[探索可运行的 Next.js 示例](/zh-Hans/examples#nextjs-app)。网站遵循不同的路径：[生成本地化页面](/zh-Hans/guide/add-i18n-to-website)，而不是包装每个段落。

## 也为下一次更新而构建

<div class="home-features">
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/openai.svg" alt="" aria-hidden="true" width="26" height="26" />
<img class="icon-mono" src="/icons/brands/anthropic.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/openrouter.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/gemini.svg" alt="" aria-hidden="true" width="26" height="26" />
<img class="icon-mono" src="/icons/brands/ollama.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

### 选择您的提供商和模型

使用支持的提供商，例如 OpenAI、Anthropic、OpenRouter、Gemini、本地 Ollama 或其他九个内置选项。您也可以使用任何与 OpenAI 兼容的提供商。翻译质量遵循模型列表（`translationModels`，以及每个区域设置的覆盖项）。`suggest-models` 以及仪表板 **模型** 下的相同排名，是根据已发布的翻译基准构建该列表的。

[LLM 提供商](/zh-Hans/guide/providers-and-models) · [AI 模型](/zh-Hans/guide/ai-models)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/refresh-cw.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

### 复用已完成的工作

借助缓存的翻译，重新运行时可以专注于新增或更改的文本，而无需再次翻译所有内容。

[保持翻译](/zh-Hans/guide/quick-start#keep-it-translated)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/layout-dashboard.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

### 在本地审校 AI 输出

在翻译仪表板中检查翻译、更正措辞并管理术语。

[查看仪表板](/zh-Hans/guide/translation-dashboard/)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/layers.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

### 将应用和内容集中管理

通过一个配置即可翻译应用消息、文档、嵌套的区域设置 JSON 和 SVG 文本标签。只启用您需要的功能。

[组合流水线](/zh-Hans/guide/combining-pipelines)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/file-text.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

### 将 README 与应用一同翻译

一个 `sync` 即可涵盖 UI 字符串和仓库 Markdown，并将语言行写入 README。

[为您的 README 和 Markdown 文档添加 i18n](/zh-Hans/guide/add-i18n-to-readme)

</article>
</div>

## 先看一个实际项目

这些示例包含配置和已提交的翻译文件。无需 API 密钥即可浏览输出；重新运行翻译需要配置提供商，并且通常需要一个密钥。本地 Ollama 不需要 API 密钥。

<div class="home-examples">
<article class="home-card">

<div class="home-card-logos">
<img class="icon-mono" src="/icons/brands/nextjs.svg" alt="" aria-hidden="true" width="26" height="26" />
<img class="icon-light" src="/icons/brands/react.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

### 多语言应用

在一个可运行的 Next.js 项目中，查看 React 组件、运行时集成、复数形式和语言切换功能。

[探索 Next.js 示例](/zh-Hans/examples#nextjs-app)

</article>
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/python.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/streamlit.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

### Python 实战

了解 Streamlit 应用如何包装其消息并使用翻译后的 JSON，而无需向应用添加 JavaScript 运行时。

[探索 Streamlit 示例](/zh-Hans/examples#python-streamlit)

</article>
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/vitepress.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

### 多语言文档

查看已翻译的 VitePress 页面以及本地化的导航和主题标签。

[探索 VitePress 示例](/zh-Hans/examples#vitepress-docs)

</article>
</div>

[浏览所有可运行的示例](/zh-Hans/examples)，包括纯 HTML、其他框架和现有的 i18n 工作流程。

## 已有 i18n？保留行之有效的部分。

您不必从头开始。

<div class="home-existing">
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/code.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

### 源字符串调用

保留项目中已有的 `t()` 和 gettext 调用。

[JS/TS UI 字符串](/zh-Hans/guide/ui-strings/) · [Python 和 gettext](/zh-Hans/guide/ui-strings/python)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/braces.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

### JSON 资源包

翻译嵌套的区域设置文件，包括 i18next 命名空间。网站导航和主题目录属于[文档翻译](/zh-Hans/guide/add-i18n-to-website#what-gets-translated)，而非此路径。

[翻译 JSON 包](/zh-Hans/guide/json)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/languages.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

### Intlayer 字典

保留 Intlayer 并填写缺失的翻译，或将应用迁移到源字符串调用。

[就地翻译](/zh-Hans/guide/translating-intlayer) · [迁移到源字符串调用](/zh-Hans/guide/migrating-from-intlayer)

</article>
</div>

还有图表？与您的应用或文档一起[翻译 SVG 文本标签](/zh-Hans/guide/svg-translation/)。

<a id="quick-install"></a>
## 准备好添加您的第一门语言了吗？

<div class="home-cta">

[选择您的项目](#start-here)以获取完整演练，或[打开快速入门](/zh-Hans/guide/quick-start)以了解安装和配置。

为 Node.js 项目安装 [npm 包](/zh-Hans/guide/installation)。

<a id="python-no-nodejs"></a>

对于 Python，[下载独立可执行文件](/zh-Hans/guide/installation#standalone-executables)——无需单独安装 Node.js。

<div class="home-badges">

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE)

[![Linux x64](https://img.shields.io/badge/Linux-x64-FCC624?logo=linux&logoColor=black)](https://github.com/wsj-br/ai-i18n-tools/releases) [![Linux arm64](https://img.shields.io/badge/Linux-arm64-FCC624?logo=linux&logoColor=black)](https://github.com/wsj-br/ai-i18n-tools/releases) [![macOS arm64](https://img.shields.io/badge/macOS-arm64-000000?logo=apple&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases) [![macOS x64](https://img.shields.io/badge/macOS-x64-000000?logo=apple&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases) [![Windows x64](https://img.shields.io/badge/Windows-x64-0078D6?logo=windows&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases)

</div>

</div>

<a id="explore-the-documentation"></a>
## 在需要时深入了解

[集成](/zh-Hans/guide/integrations/) · [LLM 提供商](/zh-Hans/guide/providers-and-models) · [AI 模型](/zh-Hans/guide/ai-models) · [配置](/zh-Hans/reference/configuration) · [CLI 参考](/zh-Hans/reference/cli-commands/)

<br/>

<br/>

::: info 关于本站
非英语界面和文档是使用 ai-i18n-tools 翻译的。AI 翻译可能包含错误。

所有产品名称、徽标和商标均为其各自所有者的财产。图标和名称仅用于识别目的。本项目不隶属于这些品牌，也未获得其认可。
:::
