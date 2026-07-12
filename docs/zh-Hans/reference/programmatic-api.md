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

从 Node.js 生成脚手架配置（可选的第四个参数选择内置预设；默认为 `openrouter`）：

```ts
import { writeInitConfigFile } from 'ai-i18n-tools';

writeInitConfigFile('ai-i18n-tools.config.json', 'uiMarkdown', process.cwd(), 'anthropic');
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
| `JsonExtractor` | 从 Docusaurus JSON 标签文件（UI 目录，非 MDX 正文）中提取。 |
| `SvgExtractor` | 从 SVG 文件中提取。 |
| `LlmClient` | 向活动的 LLM 提供程序发出翻译请求（`OpenRouterClient` 是已弃用的别名）。 |
| `PlaceholderHandler` | 保护/恢复翻译周围的 Markdown 语法（HTML 标签、警告、锚点、MDX 注释/JSX/花括号、URL、行内代码、强调）。 |
| `protectMdx` / `restoreMdx` | 保护/恢复 MDX 注释、JSX 标签、花括号表达式和 JSX 字符串属性（由 `PlaceholderHandler` 调用；也导出供直接使用）。 |
| `splitTranslatableIntoBatches` | 将片段分组为适合 LLM 的批次。 |
| `validateTranslation` | 翻译后的结构检查（**async** — 必须等待）。 |
| `resolveDocumentationOutputPath` | 解析已翻译文档的输出文件路径。 |
| `Glossary` / `GlossaryMatcher` | 加载并应用翻译词汇表。 |
| `runTranslateUI` | 程序化翻译 UI 入口点。 |
| `writeInitConfigFile` | 编写初始配置 JSON（`template`，可选的 `providerKey` 默认为 `openrouter`）。 |
| `DEFAULT_INIT_MODELS_BY_PROVIDER` | `init -P` 所用各内置预设的初始 `translationModels`。 |
| `PROVIDER_PRESETS` | 内置提供程序预设映射（`baseUrl`、`apiKeyEnv`）。 |
