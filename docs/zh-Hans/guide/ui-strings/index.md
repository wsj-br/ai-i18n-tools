<a id="ui-strings"></a>
# UI 字符串

专为使用 i18next 的任何 JS/TS 项目设计：React 应用、Next.js（客户端和服务器组件）、Node.js 服务、CLI 工具。

<a id="which-guide-to-read"></a>
## 阅读哪个指南

| 您的应用 | 下一步阅读 |
| --- | --- |
| React / Next.js / Node + i18next | [连接 i18next](/zh-Hans/guide/ui-strings/i18next-runtime)（步骤 4） |
| 纯 HTML（标记中没有 `t()`） | [纯 HTML 应用](/zh-Hans/guide/ui-strings/plain-html) |
| Astro 营销网站（混合） | [Astro 网站](/zh-Hans/guide/ui-strings/astro-website) |
| `t()` 规则、插值、复数 | [t() 调用和复数](/zh-Hans/guide/ui-strings/t-calls-and-plurals) |
| 语言选择器 / RTL | [语言切换器和 RTL](/zh-Hans/guide/ui-strings/language-switcher) |
| 运行时 API 签名 | [运行时助手](/zh-Hans/guide/runtime-helpers) |

<a id="step-1-initialise"></a>
## 步骤 1：初始化

```bash
npx ai-i18n-tools init
```

这会使用 `ui-markdown` 模板写入 `ai-i18n-tools.config.json`（包含一个默认的 `provider` / `providers` 块）。在运行 `translate-ui` 或 `sync` 之前，请在环境变量或 `.env` 中设置当前所用提供商的 API 密钥——Ollama 除外；参见[提供商与 API 密钥](/zh-Hans/guide/quick-start#provider-and-api-key)。编辑配置以设置：

- `provider` 和 `providers` —— 至少一个带有 `translationModels` 的提供商；如果不想使用 OpenRouter，请更改预设或模型列表。参见 [LLM 提供商与模型](/zh-Hans/guide/providers-and-models)。
- `sourceLocale` —— 你的源语言 BCP-47 代码（例如 `"en-GB"`）。**必须匹配** 从你的运行时 i18n 配置文件（`src/i18n.ts` / `src/i18n.js`）导出的 `SOURCE_LOCALE`。
- `targetLocales` —— 目标语言的 BCP-47 代码数组（例如 `["de", "fr", "pt-BR"]`）。运行 `generate-ui-languages` 以从此列表创建 `ui-languages.json` 清单。
- `ui.sourceRoots` —— 要扫描 `t("…")` 调用的目录或 glob 模式（例如 `["src/"]`、`["src/**/*.ts"]`）。
- `ui.stringsJson` —— 主目录的写入位置（例如 `"src/locales/strings.json"`）。
- `ui.flatOutputDir` —— `de.json`、`pt-BR.json` 等的写入位置（例如 `"src/locales/"`）。
- `providers.<active>.uiModels`（可选）—— 用于 `translate-ui`、复数生成和 `proofread-ui` 的有序 UI 专用模型列表（位于任何匹配的 `localeModels` 条目之后、`translationModels` 之前）。参见[提供商与模型](/zh-Hans/guide/providers-and-models#model-fallback-chain)。

<a id="step-2-extract-strings"></a>
## 步骤 2：提取字符串

```bash
npx ai-i18n-tools extract
```

扫描 `ui.sourceRoots` 下的所有 JS/TS 文件中的 `t("literal")` 和 `i18n.t("literal")` 调用。写入（或合并到）`ui.stringsJson`。

扫描器是可配置的：通过 `ui.uiExtractor.funcNames`（或旧版 `ui.reactExtractor.funcNames`）添加自定义函数名称。对于 Astro 页面和组件，将 `.astro` 添加到 `ui.uiExtractor.extensions`。对于纯 HTML，请参阅[纯 HTML 应用](/zh-Hans/guide/ui-strings/plain-html)。

<a id="step-3-translate-ui-strings"></a>
## 步骤 3：翻译 UI 字符串

```bash
npx ai-i18n-tools translate-ui
```

读取 `strings.json`，将批次发送到每个目标区域设置的活动 LLM 提供者，将扁平的 JSON 文件（`de.json`、`fr.json` 等）写入 `ui.flatOutputDir`。模型选择使用 UI 链：`localeModels(locale)` → `uiModels` → `translationModels`（请参阅 [提供者和模型](/zh-Hans/guide/providers-and-models#model-fallback-chain)）。

<a id="per-locale-model-overrides"></a>
### 每个区域模型覆盖

可选的 `providers.<active>.localeModels` 条目将 BCP-47 区域设置映射到为该区域设置尝试的有序模型列表，**在** `uiModels` 和 `translationModels` 之前。相同的 `localeModels` 条目也适用于文档、JSON 和 SVG 翻译。区域设置标签不区分大小写（`pt-br` = `pt-BR`）。如果没有匹配的条目，仅使用 `uiModels` 和 `translationModels` 进行 UI 工作。

对于每个条目，`translate-ui` 将成功翻译每个区域设置的**活动提供程序的模型 ID**存储在一个可选的 `models` 对象中（与 `translated` 具有相同的区域设置键）。在翻译仪表板中编辑的字符串在该区域设置的 `models` 中用哨兵值 `user-edited` 标记。`ui.flatOutputDir` 下的每个区域设置的平面文件仍仅为**源字符串 → 翻译**；它们不包含 `models`（因此运行时捆绑包保持不变）。

> **注意：** 仪表板对 UI 字符串的编辑存储在 `strings.json` 中，而不是 SQLite 文档缓存中。运行普通的 `sync` 或 `translate-ui`（无特殊标志）以从目录中重写平面区域设置文件 — `--force-update` **不会**转发到 UI 步骤。手动编辑后避免在 UI 命令上使用 `--force`：它会重新翻译每个条目并可能覆盖您的 `user-edited` 行。

然后在运行时连接 i18next — [连接 i18next](/zh-Hans/guide/ui-strings/i18next-runtime)。

<a id="exporting-to-xliff-20-optional"></a>
## 导出到 XLIFF 2.0（可选）

要将 UI 字符串移交给翻译供应商、TMS 或 CAT 工具，请将目录导出为 **XLIFF 2.0**（每个目标语言环境一个文件）。此命令是 **只读** 的：它不会修改 `strings.json` 或调用任何 API。

```bash
npx ai-i18n-tools export-ui-xliff
```

默认情况下，文件会写入 `ui.stringsJson` 旁边，命名方式类似于 `strings.de.xliff`、`strings.pt-BR.xliff`（您的目录的基本名称 + 语言环境 + `.xliff`）。使用 `-o` / `--output-dir` 写入其他位置。来自 `strings.json` 的现有翻译会出现在 `<target>` 中；缺失的语言环境会使用 `state="initial"` 且没有 `<target>`，以便工具可以填充它们。使用 `--untranslated-only` 仅导出每个语言环境仍需要翻译的单元（对供应商批次很有用）。`--dry-run` 会打印路径而不写入文件。
