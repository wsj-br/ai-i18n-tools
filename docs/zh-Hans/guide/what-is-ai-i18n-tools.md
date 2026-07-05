<a id="what-is-ai-i18n-tools"></a>
# 什么是 ai-i18n-tools？

`ai-i18n-tools` 包提供了三种翻译服务：

- **UI 字符串**：从任何 JS/TS 源代码中提取 `t("…")` 调用，通过活动的 [LLM 提供商](/guide/providers-and-models) 进行翻译，并写入扁平的按区域设置的 JSON 文件，以供 i18next 使用。
- **文档**：通过 `translate-docs` 翻译 `docs[].contentPaths` 中列出的 **markdown、MDX 和 `.astro` 页面**，并进行智能缓存。当启用 `features.translateDocs` 时，可选的 **Docusaurus 目录 JSON**（来自 `docusaurus write-translations` 的 `docs[].docusaurusCatalogDir`）将在同一命令中翻译——网站的界面元素（导航栏、页脚、主题字符串），而不是 `docs/` 中的散文。**VitePress** 页面主体使用相同的 `docs[]` 管道；导航/侧边栏/页脚标签使用 JSON（`json[]` / `translate-json`）——请参阅 [VitePress 集成](/guide/vitepress-integration)。
- **JSON**：通过顶级 `json[]`、`features.translateJson` 和 `translate-json` 翻译任意嵌套的 JSON 包（例如 `src/i18n/en/translation.json`）——适用于将 UI 文本保存在按区域设置的 JSON 文件中而不是源代码中的 `t()` 的网站。
- **工具 UI（内置）**——CLI 帮助、日志和翻译仪表板以多种语言提供；这与翻译**您的**应用程序的 UI 字符串或文档是分开的。

**SVG** 资产使用 `features.translateSVG`、顶级 `svg` 块和 `translate-svg`（请参阅 [CLI 参考](/reference/cli-commands))。

**我应该使用哪一个？**

- 通过 `t()` 在源代码中面向用户的字符串 → UI 字符串 (`extract` / `translate-ui`)。
- 本地化页面、Docusaurus shell JSON 或 VitePress markdown → 文档 (`translate-docs`)。
- VitePress 主题 JSON 或其他独立的嵌套区域设置文件 → JSON (`translate-json`)。

所有这三者都使用活动的 LLM 提供商（请参阅 [提供商和模型](/guide/providers-and-models)）并共享一个配置文件。

<a id="next-steps"></a>
## 后续步骤

1. [安装](/guide/installation) — 安装软件包并设置您的提供商 API 密钥。
2. [快速入门](/guide/quick-start) — 构建配置并运行您的首次翻译。
3. [提供商和模型](/guide/providers-and-models) — 选择提供商、模型回退链和 `-P` 覆盖。
