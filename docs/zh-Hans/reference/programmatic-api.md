<a id="programmatic-api"></a>
# 编程 API

所有公共类型和类都从包根目录导出。示例：从 Node.js 运行 translate-ui 步骤，无需 CLI：

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

通过 Node.js 搭建配置。第四个参数是内置预设（`cwd` 是第三个）。当模板尚未列出 `README.md` 时，一个可选的第五个参数 `{ withReadme: true }` 会附加扁平化的 README 文档块，并返回是否已添加该块：

```ts
import { writeInitConfigFile } from 'ai-i18n-tools';

writeInitConfigFile('ai-i18n-tools.config.json', 'uiMarkdown', process.cwd(), 'anthropic');
writeInitConfigFile('ai-i18n-tools.config.json', 'docsMarkdown', process.cwd(), 'openrouter');
writeInitConfigFile('ai-i18n-tools.config.json', 'uiPython', process.cwd(), 'openrouter', {
  withReadme: true,
});
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
| `rankProviderModels` / `resolveSuggestionWeights` | 评级单个提供商的聊天目录。评级指标为 ChrF 和 Arena；质量配置文件根据该指标进行排序，价格配置文件遵循帕累托前沿。不打印或写入配置。 |
| `PlaceholderHandler` | 保护/恢复翻译周围的 Markdown 语法（HTML 标签、警告、锚点、MDX 注释/JSX/花括号、URL、行内代码、强调）。 |
| `protectMdx` / `restoreMdx` | 保护/恢复 MDX 注释、JSX 标签、花括号表达式和 JSX 字符串属性（由 `PlaceholderHandler` 调用；也导出供直接使用）。 |
| `splitTranslatableIntoBatches` | 将片段分组为适合 LLM 的批次。 |
| `validateTranslation` | 翻译后的结构检查（**async** — 必须等待）。 |
| `resolveDocumentationOutputPath` | 解析已翻译文档的输出文件路径。 |
| `Glossary` / `GlossaryMatcher` | 加载并应用翻译术语表，包括可选的术语 `Context` 说明。 |
| `loadTranslationContext` / `computeGuidanceFingerprint` | 加载 `glossary.contextFiles` 和用于缓存失效的指纹指引。 |
| `runTranslateUI` | 编程方式的 translate-ui 入口点。 |
| `writeInitConfigFile` | 写入一个初始配置文件 JSON（`template`、`cwd`、一个必需的 `providerKey` 和一个可选的 `{ withReadme }`）。返回 `{ readmeBlockAdded, hasReadmeBlock }`。 |
| `DEFAULT_INIT_MODELS_BY_PROVIDER` | `init -P` 所用各内置预设的初始 `translationModels`。 |
| `PROVIDER_PRESETS` | 内置提供程序预设映射（`baseUrl`、`apiKeyEnv`）。 |

<a id="python-runtime-i18npy"></a>
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
| `pgettext(context, message, **values)` | 上下文查找（`msgctxt`，或 `context` + U+0004 + 扁平化 JSON 格式的源语言字符串），然后进行插值。 |
| `streamlit_language_selector(sidebar=True, key="lang_selector")` | Streamlit 选择框。写入 `st.session_state.locale` 和 `st.query_params["lang"]`，调用 `set_locale`，并返回所选代码。 |

<a id="net-runtime-i18ncs"></a>
## .NET 运行时 (`I18n.cs`)

`init -t ui-dotnet` 在 `I18n.cs` 缺失时将 `assets/dotnet/I18n.cs` 复制到项目中。它是一个适用于 .NET 6 或更高版本的无依赖辅助工具。以下成员与上表中 Node 导出的内容是分开的。调用形式和 XAML 标记：[.NET 应用程序](/zh-Hans/guide/ui-strings/dotnet)。

| 成员 | 行为 |
| --- | --- |
| `SetLocale(locale)` | 加载该区域设置的平面 JSON，当精确文件缺失时遍历 `CultureInfo.Parent`。引发 `LocaleChanged`。 |
| `T(source, args)` | 查找修剪后的字面量，使用 `string.Format` 格式化，并恢复源字符串的首尾空白。 |
| `Tn(singular, plural, count, args)` | 复数查找。`{0}` 是计数。目录键是修剪后的单数形式的 MD5-8 加上 `_` 和 CLDR 形式。 |
| `Tp(context, source, args)` | 查找上下文 + U+0004 + 源，然后格式化。 |
| `N(source)` | 返回 `source`。提取出来以便静态标签可以被编目。 |
| `Loc[source]` | 调用 `T` 的索引器。`Loc` 是类型为 `StringSourceLocalizer` 的静态字段。 |
| `Configure(options)` | 设置源区域设置，当 `SourceLocale` 非空时。每次调用都会替换 `Strict`、`FlatDirectory` 和 `OpenLocale`（null 会清除目录和流加载器）。仅当数组非空时，`Locales` 才会替换语言列表。 |
| `SupportedLocales` | `BuiltInLocales` 直到传递非空的 `Locales` 数组。本地名称和英文名称。null 的 `Locales` 数组不会恢复时间戳。 |
| `IsRightToLeft(locale)` | `CultureInfo.TextInfo.IsRightToLeft`。 |
| `PluralForm(locale, n)` | 来自与 `.po` 文件相同的 GNU 规则的 CLDR 形式名称。 |

`init -t ui-dotnet-resx` 而是复制 `I18nResx.cs`。`T`、`Tn` 和 `Tp` 使用相同的源字符串键调用 `ResourceManager`。`SetLocale` 设置 `CurrentUICulture` 和 `CurrentCulture`。详细信息：[将 i18n 添加到 .NET ResourceManager 应用程序](/zh-Hans/guide/add-i18n-to-dotnet-resourcemanager)。
