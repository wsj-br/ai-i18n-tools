<a id="ui-strings"></a>
# UI 字符串

专为使用 i18next 的任何 JS/TS 项目设计：React 应用、Next.js（客户端和服务器组件）、Node.js 服务、CLI 工具。

<a id="which-guide-to-read"></a>
## 阅读哪个指南

| 您的应用 | 下一步阅读 |
| --- | --- |
| React / Next.js / Node + i18next | [连接 i18next](/guide/ui-strings/i18next-runtime)（步骤 4） |
| 纯 HTML（标记中没有 `t()`） | [纯 HTML 应用](/guide/ui-strings/plain-html) |
| Astro 营销网站（混合） | [Astro 网站](/guide/ui-strings/astro-website) |
| `t()` 规则、插值、复数 | [t() 调用和复数](/guide/ui-strings/t-calls-and-plurals) |
| 语言选择器 / RTL | [语言切换器和 RTL](/guide/ui-strings/language-switcher) |
| 运行时 API 签名 | [运行时助手](/guide/runtime-helpers) |

<a id="step-1-initialise"></a>
## 步骤 1：初始化

```bash
npx ai-i18n-tools init
```

这将使用 `ui-markdown` 模板写入 `ai-i18n-tools.config.json`。编辑它来设置：

- `sourceLocale` - 您的源语言 BCP-47 代码（例如 `"en-GB"`）。**必须与** `SOURCE_LOCALE` 中从运行时 i18n 设置文件中导出的代码匹配（`src/i18n.ts` / `src/i18n.js`）。
- `targetLocales` - 目标语言的 BCP-47 代码数组（例如 `["de", "fr", "pt-BR"]`）。运行 `generate-ui-languages` 以从此列表创建 `ui-languages.json` manifest。
- `ui.sourceRoots` - 要扫描 `t("…")` 调用的目录或 glob 模式（例如 `["src/"]`、`["src/**/*.ts"]`）。
- `ui.stringsJson` - 主目录的写入位置（例如 `"src/locales/strings.json"`）。
- `ui.flatOutputDir` - 写入 `de.json`、`pt-BR.json` 等的位置（例如 `"src/locales/"`）。
- `ui.preferredModel`（可选）- 尝试**首先**用于 `translate-ui` 的模型 ID；失败后，CLI 会按顺序继续使用活动提供商的 `translationModels`，跳过重复项。

<a id="step-2-extract-strings"></a>
## 步骤 2：提取字符串

```bash
npx ai-i18n-tools extract
```

扫描 `ui.sourceRoots` 下的所有 JS/TS 文件中的 `t("literal")` 和 `i18n.t("literal")` 调用。写入（或合并到）`ui.stringsJson`。

扫描器是可配置的：通过 `ui.uiExtractor.funcNames`（或旧版 `ui.reactExtractor.funcNames`）添加自定义函数名称。对于 Astro 页面和组件，将 `.astro` 添加到 `ui.uiExtractor.extensions`。对于纯 HTML，请参阅[纯 HTML 应用](/guide/ui-strings/plain-html)。

<a id="step-3-translate-ui-strings"></a>
## 步骤 3：翻译 UI 字符串

```bash
npx ai-i18n-tools translate-ui
```

读取 `strings.json`，将批次发送给每个目标语言环境的活动 LLM 提供商，将扁平化 JSON 文件（`de.json`、`fr.json` 等）写入 `ui.flatOutputDir`。当设置了 `ui.preferredModel` 时，该模型会在尝试活动提供商的 `translationModels` 列表之前被调用（文档翻译和其他命令仅使用提供商的列表）。

对于每个条目，`translate-ui` 将成功翻译每个区域设置的**活动提供程序的模型 ID**存储在一个可选的 `models` 对象中（与 `translated` 具有相同的区域设置键）。在翻译仪表板中编辑的字符串在该区域设置的 `models` 中用哨兵值 `user-edited` 标记。`ui.flatOutputDir` 下的每个区域设置的平面文件仍仅为**源字符串 → 翻译**；它们不包含 `models`（因此运行时捆绑包保持不变）。

> **注意：** 仪表板对 UI 字符串的编辑存储在 `strings.json` 中，而不是 SQLite 文档缓存中。运行普通的 `sync` 或 `translate-ui`（无特殊标志）以从目录中重写平面区域设置文件 — `--force-update` **不会**转发到 UI 步骤。手动编辑后避免在 UI 命令上使用 `--force`：它会重新翻译每个条目并可能覆盖您的 `user-edited` 行。

然后在运行时连接 i18next — [连接 i18next](/guide/ui-strings/i18next-runtime)。

<a id="exporting-to-xliff-20-optional"></a>
## 导出到 XLIFF 2.0（可选）

要将 UI 字符串移交给翻译供应商、TMS 或 CAT 工具，请将目录导出为 **XLIFF 2.0**（每个目标语言环境一个文件）。此命令是 **只读** 的：它不会修改 `strings.json` 或调用任何 API。

```bash
npx ai-i18n-tools export-ui-xliff
```

默认情况下，文件会写入 `ui.stringsJson` 旁边，命名方式类似于 `strings.de.xliff`、`strings.pt-BR.xliff`（您的目录的基本名称 + 语言环境 + `.xliff`）。使用 `-o` / `--output-dir` 写入其他位置。来自 `strings.json` 的现有翻译会出现在 `<target>` 中；缺失的语言环境会使用 `state="initial"` 且没有 `<target>`，以便工具可以填充它们。使用 `--untranslated-only` 仅导出每个语言环境仍需要翻译的单元（对供应商批次很有用）。`--dry-run` 会打印路径而不写入文件。
