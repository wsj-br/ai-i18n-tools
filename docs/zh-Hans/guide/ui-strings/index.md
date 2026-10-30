<a id="ui-strings"></a>
# UI 字符串

`extract` 和 `translate-ui` 的参考文档，这是一个将 `t()` 调用转换为各区域设置目录的流水线。首次向应用添加 i18n？请从[向 JS/TS 应用添加 i18n](/zh-Hans/guide/add-i18n-to-js)或[向 Python 应用添加 i18n](/zh-Hans/guide/add-i18n-to-python)开始。它们涵盖了包装步骤，然后将引导你回到此处完成第 2 步到第 4 步。

此流水线支持 JS/TS 项目（React、Next.js 客户端和服务器组件、Node.js 服务、纯 HTML、Astro 网站和 CLI 工具）和 Python 应用程序。在源调用 `t()` 后，JS/TS 使用 i18next 查找字符串。Python 通过生成的 `i18n.py` 调用 `t()` 或 gettext（Django 保留 Django 的 gettext）。

<a id="which-guide-to-read"></a>
## 阅读哪个指南

| 你的应用 | 下一步阅读 |
| --- | --- |
| 带有硬编码源字符串且尚无 `t()` 的 JS/TS | [向 JS/TS 应用添加 i18n](/zh-Hans/guide/add-i18n-to-js) |
| React / Next.js / Node，源中已有 `t()` | [连接 i18next](/zh-Hans/guide/ui-strings/i18next-runtime) |
| Python (`t()`、`_()`、gettext、Jinja、Django) | [Python 应用程序](/zh-Hans/guide/ui-strings/python)。初始化：`ui-python`、`ui-python-gettext`、`ui-python-flask` 或 `ui-python-django`。辅助工具：`i18n.py`。要将语言环境添加到现有应用程序，请参阅[将 i18n 添加到 Python 应用程序](/zh-Hans/guide/add-i18n-to-python)，或者当应用程序使用 gettext 时，请参阅[将 i18n 添加到 Django / Python gettext 应用程序](/zh-Hans/guide/add-i18n-to-django-gettext)。 |
| 纯 HTML（标记中没有 `t()`） | [纯 HTML 应用](/zh-Hans/guide/ui-strings/plain-html) |
| Astro 营销网站（混合） | [Astro 网站](/zh-Hans/guide/ui-strings/astro-website) |
| `t()` 规则、插值、复数 | [t() 调用和复数](/zh-Hans/guide/ui-strings/t-calls-and-plurals) |
| 语言选择器 / RTL | [语言切换器和 RTL](/zh-Hans/guide/ui-strings/language-switcher) |
| 运行时 API 签名 | [运行时助手](/zh-Hans/guide/runtime-helpers) |
| Intlayer `.content.ts` 字典，从 Intlayer 迁移 | [从 Intlayer 迁移](/zh-Hans/guide/migrating-from-intlayer) |
| Intlayer `.content.ts` 字典，保留 Intlayer | [就地翻译 Intlayer](/zh-Hans/guide/translating-intlayer) |

<a id="step-1-initialise"></a>
## 步骤 1：初始化

```bash
ai-i18n-tools init -P openrouter
```

这会使用 `ui-markdown` 模板写入 `ai-i18n-tools.config.json`（包括该预设的 `provider` / `providers` 块）。该模板还会为 `README.md` 开启文档翻译，并以平面文件形式写入 `translated-docs/` 下。仅含 README 的仓库则改用 `init -t docs-markdown`。请参阅[向 README 和 Markdown 文档添加 i18n](/zh-Hans/guide/add-i18n-to-readme)。在运行 `translate-ui` 或 `sync` 之前，请在环境或 `.env` 中为该提供商设置 API 密钥 — Ollama 除外；请参阅[提供商和 API 密钥](/zh-Hans/guide/quick-start#provider-and-api-key)。有四个键对 UI 字符串很重要：

- `sourceLocale`：你的源文本所用语言的 BCP-47 代码。任何语言都有效；`"en-GB"` 只是一个示例。它必须与从你的运行时 i18n 配置文件（`src/i18n.ts` / `src/i18n.js`）导出的 `SOURCE_LOCALE` 相匹配。`t()` 内的字符串就是该源语言，平面区域设置文件将其用作键。
- `targetLocales`：你的目标语言的 BCP-47 代码（例如 `["de", "fr", "pt-BR"]`）。运行 `generate-ui-languages` 以从此列表创建 `ui-languages.json` 清单。
- `ui.sourceRoots`：要扫描 `t("…")` 调用的目录或 glob 模式（例如 `["src/"]`）。
- `ui.stringsJson` 和 `ui.flatOutputDir`：主目录和各区域设置文件（`de.json`、`pt-BR.json`）的写入位置。

所有其他键（包括 `providers.<active>.uiModels`）都在[配置](/zh-Hans/reference/configuration)中。

<a id="step-2-extract-strings"></a>
## 步骤 2：提取字符串

在 `t()` / `i18n.t()` 调用存在之前，`extract` 不起任何作用。请先包装硬编码的副本：[向 JS/TS 应用添加 i18n](/zh-Hans/guide/add-i18n-to-js)。

```bash
ai-i18n-tools extract
```

扫描 `ui.sourceRoots` 下的文件以查找 `t("literal")` 和 `i18n.t("literal")` 调用。写入（或合并到）`ui.stringsJson`。

扫描器是可配置的：通过 `ui.uiExtractor.funcNames`（或旧版 `ui.reactExtractor.funcNames`）添加自定义函数名称。对于 Astro 页面和组件，将 `.astro` 添加到 `ui.uiExtractor.extensions`。对于纯 HTML，请参阅[纯 HTML 应用](/zh-Hans/guide/ui-strings/plain-html)。

<a id="what-extract-scans"></a>
### extract 扫描的内容

- 默认扩展名仅为 `.js`、`.jsx`、`.ts` 和 `.tsx`。只有将 `.mjs`、`.cjs`、`.mts` 和 `.cts` 添加到 `ui.uiExtractor.extensions` 时，它们才会被包含。
- 像 `t(variable)` 这样的非字面量键或模板字面量会被跳过，且不发出警告。
- `package.json` `description` 默认包含（`ui.uiExtractor.includePackageDescription`）。
- 不支持 Vue 和 Svelte 单文件组件。将 `.vue` 或 `.svelte` 添加到 `extensions` 不会提取模板文本。没有 SFC 解析器。

<a id="step-3-translate-ui-strings"></a>
## 步骤 3：翻译 UI 字符串

```bash
ai-i18n-tools translate-ui
```

读取 `strings.json`，将批次发送到活动 LLM 提供程序上的模型，以处理每个目标语言环境，并将平面 JSON 文件（`de.json`、`fr.json` 等）写入 `ui.flatOutputDir`。模型选择使用 UI 链：`localeModels(locale)` → `uiModels` → `translationModels`（请参阅[AI 模型](/zh-Hans/guide/ai-models#model-fallback-chain))。在一个语言环境内，最多可同时运行 `uiBatchConcurrency` 个批次（默认值 **2**；请参阅[配置 — uiBatchConcurrency](/zh-Hans/reference/configuration#uibatchconcurrency-optional))。`-j` 仍然只并行处理目标语言环境。

<a id="translations-database-stringsjson"></a>
### 翻译数据库 (`strings.json`)

对于每个条目，`translate-ui` 将成功翻译每个区域设置的**活动提供程序的模型 ID**存储在一个可选的 `models` 对象中（与 `translated` 具有相同的区域设置键）。在翻译仪表板中编辑的字符串在该区域设置的 `models` 中用哨兵值 `user-edited` 标记。`ui.flatOutputDir` 下的每个区域设置的平面文件仍仅为**源字符串 → 翻译**；它们不包含 `models`（因此运行时捆绑包保持不变）。

> **注意:** 对 UI 字符串的仪表板编辑存储在 `strings.json` 中，而不是 SQLite 文档缓存中。运行普通的 `sync` 或 `translate-ui`（不带特殊标志）以从目录中重写平面语言环境文件 — `--force-update` **不会**转发到 UI 步骤。手动编辑后，避免在 UI 命令上使用 `--force`：它会重新翻译每个条目，并可能覆盖您的 `user-edited` 行。目录行中存储的翻译未能通过语言环境书写系统检查的（例如，`hi` 的罗马化印地语）将被视为缺失并重新翻译，无需 `--force`。

<a id="step-4-use-the-output-in-your-app"></a>
## 第 4 步：在你的应用中使用输出

`translate-ui` 只写入文件。应用必须加载它们。

- JS/TS：使用运行时帮助程序连接 i18next，加载用户选择的区域设置文件，并添加语言切换器。请参阅[连接 i18next](/zh-Hans/guide/ui-strings/i18next-runtime)和[语言切换器和 RTL](/zh-Hans/guide/ui-strings/language-switcher)。
- Python：使用生成的 `i18n.py` 或你的 gettext 目录。请参阅[Python 应用程序](/zh-Hans/guide/ui-strings/python)。
- 纯 HTML：在页面旁边加载运行时脚本。请参阅[纯 HTML 应用](/zh-Hans/guide/ui-strings/plain-html)。
- Astro：请参阅 [Astro 网站](/zh-Hans/guide/ui-strings/astro-website)。

<a id="optional"></a>
## 可选

<a id="per-locale-model-overrides"></a>
### 每个区域模型覆盖

有些模型在翻译某些语言方面比其他模型表现更好。例如，qwen 和 z-ai 模型在亚洲语言方面表现良好。添加 `providers.<active>.localeModels` 条目，为每个 BCP-47 语言环境提供一个优先模型列表。对于该语言环境，这些列表会在 `uiModels` 和 `translationModels` 之前尝试。语言环境标签不区分大小写匹配（`zh-cn` 和 `ZH-CN` 是等效的）。如果没有匹配的条目，该工具将使用默认的 `uiModels` 和 `translationModels` 顺序。相同的 `localeModels` 机制适用于文档、JSON 和 SVG 翻译。

<a id="exporting-to-xliff-20"></a>
### 导出到 XLIFF 2.0

要将 UI 字符串移交给翻译供应商、TMS 或 CAT 工具，请将目录导出为 **XLIFF 2.0**（每个目标语言环境一个文件）。此命令是 **只读** 的：它不会修改 `strings.json` 或调用任何 API。

```bash
ai-i18n-tools export-ui-xliff
```

默认情况下，文件会写入 `ui.stringsJson` 旁边，命名方式类似于 `strings.de.xliff`、`strings.pt-BR.xliff`（您的目录的基本名称 + 语言环境 + `.xliff`）。使用 `-o` / `--output-dir` 写入其他位置。来自 `strings.json` 的现有翻译会出现在 `<target>` 中；缺失的语言环境会使用 `state="initial"` 且没有 `<target>`，以便工具可以填充它们。使用 `--untranslated-only` 仅导出每个语言环境仍需要翻译的单元（对供应商批次很有用）。`--dry-run` 会打印路径而不写入文件。
