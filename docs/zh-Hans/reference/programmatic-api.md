<a id="programmatic-api"></a>
# 编程 API

所有公共类型和类都从包根目录导出。示例：在 Node.js 中运行 translate-UI 步骤，而不使用 CLI：

```ts
import { loadI18nConfigFromFile, runTranslateUI } from 'ai-i18n-tools';

// Config must have features.translateUIStrings: true (and valid targetLocales, etc.).
const config = loadI18nConfigFromFile('ai-i18n-tools.config.json');

const summary = await runTranslateUI(config, {
  cwd: process.cwd(),
  locales: config.targetLocales,
  force: false,
  dryRun: false,
  verbose: false,
});
console.log(
  `Updated ${summary.stringsUpdated} string(s); locales touched: ${summary.localesTouched.join(', ')}`
);
```

从 Node.js 生成配置。第四个参数是内置预设（`cwd` 是第三个）：

```ts
import { writeInitConfigFile } from 'ai-i18n-tools';

writeInitConfigFile('ai-i18n-tools.config.json', 'uiMarkdown', process.cwd(), 'anthropic');
writeInitConfigFile('ai-i18n-tools.config.json', 'uiMarkdown', process.cwd(), 'cheaperinference');
```

主要导出（常用 — 完整公共接口请参阅 `src/index.ts`）：

| 导出 | 描述 |
|---|---|
| `loadI18nConfigFromFile` | 从 JSON 文件加载、合并、验证配置。 |
| `parseI18nConfig` | 验证原始配置对象。 |
| `TranslationCache` | SQLite 缓存 - 使用 `cacheDir` 路径进行实例化。 |
| `UIStringExtractor` | 从 JS/TS 源中提取 `t("…")` 字符串。 |
| `collectHtmlI18nStrings` / `markHtmlContent` | 扫描/插入 HTML 中的 `data-i18n*` 标记（支持 `extract` 用于 `.html` 和 `mark-html` 命令）。 |
| `MarkdownExtractor` | 从 Markdown 中提取可翻译的片段。 |
| `HtmlTemplateExtractor` | 提取并重组纯 HTML 文档（文本和可翻译属性；`src` / `href` 保持原位）。 |
| `JsonExtractor` | 从 Docusaurus JSON 标签文件（UI 目录，非 MDX 正文）中提取。 |
| `SvgExtractor` | 从 SVG 文件中提取。 |
| `LlmClient` | 向活动的 LLM 提供程序发出翻译请求（`OpenRouterClient` 是已弃用的别名）。 |
| `rankProviderModels` / `resolveSuggestionWeights` | 按 `suggest-models` 所使用的质量或价格概况对排名第一的提供商的聊天目录进行排序。不会打印或写入配置。 |
| `PlaceholderHandler` | 保护/恢复翻译周围的 Markdown 语法（HTML 标签、警告、锚点、MDX 注释/JSX/花括号、URL、行内代码、强调）。 |
| `protectMdx` / `restoreMdx` | 保护/恢复 MDX 注释、JSX 标签、花括号表达式和 JSX 字符串属性（由 `PlaceholderHandler` 调用；也导出供直接使用）。 |
| `splitTranslatableIntoBatches` | 将片段分组为适合 LLM 的批次。 |
| `validateTranslation` | 翻译后的结构检查（**async** — 必须等待）。 |
| `resolveDocumentationOutputPath` | 解析已翻译文档的输出文件路径。 |
| `Glossary` / `GlossaryMatcher` | 加载并应用翻译术语表，包括可选的术语 `Context` 说明。 |
| `loadTranslationContext` / `computeGuidanceFingerprint` | 加载 `glossary.contextFiles` 和用于缓存失效的指纹指引。 |
| `runTranslateUI` | 程序化翻译 UI 入口点。 |
| `writeInitConfigFile` | 编写一个启动配置 JSON（`template`、`cwd` 和一个必需的 `providerKey`）。 |
| `DEFAULT_INIT_MODELS_BY_PROVIDER` | `init -P` 所用各内置预设的初始 `translationModels`。 |
| `PROVIDER_PRESETS` | 内置提供程序预设映射（`baseUrl`、`apiKeyEnv`）。 |

<a id="python-runtime"></a>
## Python 运行时 (`i18n.py`)

当 `i18n.py` 缺失时，`init -t ui-python`、`ui-python-gettext` 和 `ui-python-flask` 会将此模块写入项目。它是适用于 Python 3.10 或更高版本的标准库辅助工具。请从该文件导入它。下方的函数与上表中的 Node 导出项是分开的。Django 项目会保留 Django 的 gettext，因此 `ui-python-django` 不会写入 `i18n.py`。

调用形状、不安全的 f-strings 以及各框架的区域设置连接：[Python 应用程序](/zh-Hans/guide/ui-strings/python)。

| 函数 | 行为 |
| --- | --- |
| `set_locale(locale)` | 设置当前区域设置。代码中的下划线会存储为连字符（`pt_BR` 变为 `pt-BR`）。返回一个 `ContextVar` 令牌。 |
| `reset_locale(token)` | 从该令牌恢复区域设置。在 `finally` 中调用它，包括 FastAPI 和 Flask 中间件。 |
| `get_locale()` | 返回当前区域设置。 |
| `set_backend(backend)` | 选择 `"auto"`、`"json"` 或 `"gettext"`。 |
| `get_ui_languages()` | 读取扁平 JSON 目录旁边的 `ui-languages.json`，或者在关闭扁平输出时读取 gettext 目录。 |
| `get_direction(locale=None)` | 从该区域设置的清单行返回 `"rtl"` 或 `"ltr"`（省略时为当前区域设置）。 |
| `_(message)` | 查找一个字面量，然后返回目录字符串或消息本身。 |
| `t(template, *, plurals=False, count=None, **values)` | 查找字面量，然后进行插值。`translate` 是相同的函数。在 Python 3.14 上，`translate(t"Hello, {name}!")` 会保留模板及其值。关键字参数会覆盖从模板字符串中获取的值。 |
| `ngettext(singular, plural, n, **values)` | 复数查找，然后进行插值。`count` 可用于格式字符串。 |
| `pgettext(context, message, **values)` | 上下文查找（`msgctxt`，或 `context` + U+0004 + 扁平 JSON 中的英文源文本），然后进行插值。 |
| `streamlit_language_selector(sidebar=True, key="lang_selector")` | Streamlit 选择框。写入 `st.session_state.locale` 和 `st.query_params["lang"]`，调用 `set_locale`，并返回所选代码。 |
