<a id="configuration-reference"></a>
# 配置参考

<a id="sourcelocale"></a>
### `sourceLocale`

源语言的 BCP-47 代码（例如 `"en-GB"`、`"en"`、`"pt-BR"`）。不会为此区域设置生成翻译文件 — 键字符串本身就是源文本。

**必须匹配**从您的运行时 i18n 设置文件（`SOURCE_LOCALE` / `src/i18n.ts`）导出的 `src/i18n.js`。

<a id="targetlocales"></a>
### `targetLocales`

要翻译的 BCP-47 区域设置代码数组（例如 `["de", "fr", "es", "pt-BR"]`）。

`targetLocales` 是 UI 翻译的主要区域设置列表，也是文档块的默认区域设置列表。使用 `generate-ui-languages` 从 `ui-languages.json` + `sourceLocale` 构建 `targetLocales` 清单。

<a id="uilanguage-optional"></a>
### `uiLanguage` (可选)

工具自身 UI 语言的 BCP-47 代码（CLI 帮助、日志/摘要和翻译仪表板）。它独立于 `sourceLocale` / `targetLocales`，并被 `-L` / `--ui-lang` 标志和 `AI_I18N_LANG` 环境变量覆盖。未知值会优雅地降级到源语言环境 (`en-GB`) — 没有严格的验证。请参阅 [工具 UI 语言](/reference/environment-variables#tool-ui-language)。

<a id="uilanguagespath-optional"></a>
### `uiLanguagesPath`（可选）

用于显示名称、区域设置筛选和语言列表后处理的 `ui-languages.json` 清单的路径。如果省略，CLI 会在 `ui.flatOutputDir/ui-languages.json` 查找清单。

在以下情况下使用：

- 清单位于 `ui.flatOutputDir` 之外，您需要显式地将 CLI 指向它。
- 您希望 [语言切换器后处理](#language-switcher-languagelistblock)（`languageListBlock`）从清单构建区域设置标签。
- `extract` 应将清单中的 `englishName` 条目合并到 `strings.json` 中（需要 `ui.reactExtractor.includeUiLanguageEnglishNames: true`）。

<a id="concurrency-optional"></a>
### `concurrency`（可选）

同时翻译的最大**目标区域设置**（`translate-ui`、`translate-docs`、`translate-svg` 以及 `sync` 中的匹配步骤）。如果省略，CLI 会为 UI 翻译使用**4**，为文档翻译使用**3**（内置默认值）。可以通过 `-j` / `--concurrency` 为每次运行覆盖。

<a id="batchconcurrency-optional"></a>
### `batchConcurrency`（可选）

**translate-docs**、**translate-svg** 和 **translate-json**（以及 `sync` 中的匹配步骤）：每个文件的最大并行 LLM **批处理**请求数（每个批处理可以包含多个段）。省略时默认为 **4**。`translate-ui` 忽略。使用 `-b` / `--batch-concurrency` 覆盖。

<a id="fileconcurrency-optional"></a>
### `fileConcurrency`（可选）

在 `translate-docs` 和 `sync` 期间，并发处理单个区域设置内文件的最大数量 **within a single locale**。当设置为大于 **1** 的值时，同一区域设置内的文件将使用信号量并行处理以控制内存使用。省略时默认为 **1**（顺序处理）。更高的值可以显著提高 I/O 密集型操作的吞吐量，尤其是在所有片段都已缓存（无需 API 调用）的情况下。

**示例：**

```json
{
  "fileConcurrency": 4
}
```

**用例：** 当 `sync --force-update` 以 100% 缓存命中率运行时，将此值设置为 `2-4` 以减少总处理时间。当文件数量很多且较小时，效果最明显。

<a id="batchsize--maxbatchchars-optional"></a>
### `batchSize` / `maxBatchChars`（可选）

**translate-docs**、**translate-svg** 和 **translate-json** 的段批处理：每个 API 请求的段数和字符上限。默认值：**20** 段，**4096** 字符（省略时）。

<a id="provider-and-providers"></a>
### `provider` 和 `providers`

`provider`（顶级，可选）从 `providers` 中选择活动的提供商密钥。当配置的提供商只有一个时，此项是可选的；当配置的提供商多于一个时，则为必需项。

`providers`（顶级）将提供商密钥映射到其配置块。内置密钥（请参阅下面的预设表）仅需要 `translationModels`；任何其他密钥都定义了一个自定义的 OpenAI 兼容端点，并需要 `baseUrl`（以及 `apiKeyEnv`，除非该端点不需要密钥）。

每个 `providers.<name>` 块接受：

- `translationModels`
  首选的模型 ID 列表（纯粹的上游 ID，无 `provider/` 前缀；OpenRouter ID 保留其本地 `vendor/model` 格式）。第一个模型优先尝试；后续条目在出错时作为备用。仅对于 `translate-ui`，您还可以设置 `ui.preferredModel` 在此列表之前尝试一个模型（请参阅 `ui`）。
- `baseUrl`
  OpenAI 兼容的基础 URL。覆盖预设的基础 URL；对于非预设提供商是必需的。
- `apiKeyEnv`
  包含 API 密钥的环境变量。覆盖预设的环境变量。
- `headers`
  发送到此提供商的每个请求的额外 HTTP 标头。
- `maxTokens`
  每个请求的最大完成令牌数。默认值：`8192`。
- `temperature`
  采样温度。默认值：`0.2`。
- `requestTimeoutMs`
  等待每个请求的最大毫秒数。默认值：`30000`（30 秒）。

内置提供商预设（键 — 基本 URL — API 密钥环境变量）：

| 提供商 | 基本 URL | API 密钥环境变量 |
| --- | --- | --- |
| `openrouter` | `https://openrouter.ai/api/v1` | `OPENROUTER_API_KEY` |
| `openai` | `https://api.openai.com/v1` | `OPENAI_API_KEY` |
| `anthropic` | `https://api.anthropic.com/v1` | `ANTHROPIC_API_KEY` |
| `gemini` | `https://generativelanguage.googleapis.com/v1beta/openai` | `GOOGLE_API_KEY` |
| `deepseek` | `https://api.deepseek.com` | `DEEPSEEK_API_KEY` |
| `cerebras` | `https://api.cerebras.ai/v1` | `CEREBRAS_API_KEY` |
| `groq` | `https://api.groq.com/openai/v1` | `GROQ_API_KEY` |
| `mistral` | `https://api.mistral.ai/v1` | `MISTRAL_API_KEY` |
| `xai` | `https://api.x.ai/v1` | `XAI_API_KEY` |
| `nvidia` | `https://integrate.api.nvidia.com/v1` | `NVIDIA_API_KEY` |
| `alibaba` | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` | `ALIBABA_API_KEY` |
| `apifun` | `https://api.apikey.fun/v1` | `APIFUN_API_KEY` |
| `ollama` | `http://localhost:11434/v1` | (无) |

仍然接受旧版顶级 `openrouter` 块（包含 `baseUrl`、`translationModels`、`defaultModel`、`fallbackModel`、`maxTokens`、`temperature`、`requestTimeoutMs`），并在加载时自动迁移到 `providers.openrouter`（包含 `provider: "openrouter"`）；`defaultModel` / `fallbackModel` 会折叠到 `translationModels` 中。

有关在一个配置中配置多个提供程序并使用 `-P` 在它们之间切换的可运行示例，请参阅 [`examples/multi-provider`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/multi-provider/)（`openai`、`anthropic`、`nvidia` 和 `deepseek` 在同一文档上）。

**为什么使用多个模型：** 不同的提供商和模型在成本和质量方面各不相同，在不同语言和区域设置上的表现也不同。将 `translationModels` 配置为**有序的备用链**（而不是单个模型），这样 CLI 可以在请求失败时尝试下一个模型。

将以下列表视为您可以扩展的**基线**：如果特定语言环境的翻译质量差或不成功，请研究哪些模型能有效支持该语言或脚本（参考在线资源或您的提供商文档），并将这些模型 ID 添加为进一步的替代方案。

此列表经过**测试，覆盖了广泛的区域设置**，在一个大型文档项目中覆盖了 36 个目标区域设置；它是一个实用的默认选项，但不能保证对每个区域设置都表现良好。

示例 `translationModels`（与 `npx ai-i18n-tools init` 具有相同的默认值）：

<details>
<summary>默认翻译模型备用列表</summary>

```json
"translationModels": [
  "qwen/qwen3-235b-a22b-2507",
  "openai/gpt-4o-mini",
  "deepseek/deepseek-v4-flash",
  "anthropic/claude-3-haiku",
  "qwen/qwen3.6-plus",
  "anthropic/claude-3.5-haiku",
  "google/gemini-3-flash-preview",
  "~anthropic/claude-haiku-latest",
  "google/gemma-4-31b-it",
  "~anthropic/claude-sonnet-latest",
  "openai/gpt-5.3-codex"
  // … add more fallback models as needed
]
```

</details>

<br />

在您的环境中或 `.env` 文件中设置活动提供商的 API 密钥环境变量（例如 `OPENROUTER_API_KEY`）。

在更改 `translationModels` 之前，请运行 `npx ai-i18n-tools check-models`。对于任何提供程序，它会将其配置的每个模型 ID 与该提供程序的实时模型列表（`GET /models`）进行验证，报告缺失或过期的 ID（`expiration_date`），列出有效模型，并在任何配置的 ID 无效时以非零状态退出。当提供程序返回定价信息时（例如 OpenRouter），它还会显示每 100 万个 token 的估算输入/输出定价（美元）。

要比较配置的模型在实际翻译工作中的表现，请运行 `npx ai-i18n-tools bench-models`。它会通过每个模型独立翻译一个样本（并行进行，受 `concurrency` 限制），并打印每个模型的输入/输出令牌、实际运行时间以及美元成本，这样您就可以在确定 `translationModels` 顺序之前权衡速度与价格。

<a id="features"></a>
### `features`

| 字段 | 管道 | 描述 |
|---|---|---|
| `translateUIStrings` | 1 | 将 `t("…")` / `i18n.t("…")` 提取到 `strings.json` 中，然后翻译条目并写入每个区域设置的平面 JSON（提取自动运行；仅使用独立的 `extract` 刷新目录）。 |
| `translateDocs`      | 2        | 翻译 `.md` / `.mdx` / `.astro` 页面；当设置了 `docs[].docusaurusCatalogDir` 时，Docusaurus 会生成 shell JSON。                                                         |
| `translateJson`      | 3        | `json[]`（`translate-json`）下的任意嵌套 JSON。                                                                                                           |
| `translateSVG`       | —        | 翻译 `.svg` 文件（需要顶层的 `svg` 块）。                                                                                                       |

**翻译** SVG 文件，当 `features.translateSVG` 为 true 且配置了顶层 `svg` 块时，使用 `translate-svg`。`sync` 命令在两者都设置时运行该步骤（除非设置了 `--no-svg`）。

<a id="ui"></a>
### `ui`

- `sourceRoots`  
  扫描 `t("…")` 调用的目录或 glob 模式（相对于当前工作目录）。支持类似 `src/` 或 `["src/**/*.ts"]` 的模式。
- `stringsJson`  
  主目录文件的路径。由 `extract` 更新。
- `flatOutputDir`  
  写入每个区域设置的 JSON 文件的目录（例如 `de.json`）。
- `preferredModel`  
  可选。仅用于 `translate-ui` 的首选模型 ID；然后按顺序使用活动提供商的 `translationModels`，不重复此 ID。
- `uiExtractor.funcNames`（或旧版 `reactExtractor.funcNames`）  
  要扫描的附加函数名称（默认值：`["t", "i18n.t"]`）。
- `uiExtractor.extensions`（或旧版 `reactExtractor.extensions`）  
  要包含的文件扩展名（默认值：`[".js", ".jsx", ".ts", ".tsx"]`）。添加 `.astro` 以支持 Astro 前置 matter 和模板表达式。
- `uiExtractor.includePackageDescription`（或旧版 `reactExtractor.includePackageDescription`）  
  当 `true`（默认值）为 true 时，`extract` 还会将清单中的 `package.json` `description` 作为 UI 字符串包含在内（如果存在）。
- `uiExtractor.packageJsonPath`（或旧版 `reactExtractor.packageJsonPath`）  
  用于该可选描述提取的 `package.json` 文件的自定义路径。
- `uiExtractor.includeUiLanguageEnglishNames`（或旧版 `reactExtractor.includeUiLanguageEnglishNames`）

当 `true`（默认 `false`）时，`extract` 还会将捆绑的 ui-languages 主目录（由 `sourceLocale` + `targetLocales` 构建）中的每个 `englishName` 添加到 `strings.json`（如果源扫描中尚未存在，哈希键相同）。不读取 `uiLanguagesPath`。

<a id="cachedir"></a>
### `cacheDir`

- `cacheDir`
SQLite 缓存目录（所有 `docs` 块共享）。默认 `.translation-cache`。跨运行重用。如果您正在从自定义文档翻译缓存迁移，请归档或删除它 — `cacheDir` 创建自己的 SQLite 数据库，并且与其他架构不兼容。

<a id="best-practice-for-git-exclusions"></a>
#### git 排除的最佳实践：

- 排除翻译缓存文件夹的内容（例如，使用 `.gitignore` 或 `.git/info/exclude`），以防止提交临时缓存的伪影。
- 保留 `cache.db`（不要例行删除它），因为保留 SQLite 缓存可以防止重新翻译未更改的片段。这在更新或修改使用 `ai-i18n-tools` 的软件时可以节省运行时间和 API 成本。
- 排除临时文件和日志文件，以避免提交与备份和调试相关的文件。

<br/>

**示例：**

```gitignore
# Translation cache directory
.translation-cache/*

# Keep SQLite cache for reuse
!.translation-cache/cache.db

# Temporary and log files
*.tmp
*.log
```

<a id="docs"></a>
### `docs`

文档管道块数组。`translate-docs` 和 `sync` 的文档阶段**按顺序处理每个**块。在加载时仍接受旧键，并在配置文件可写时重写；在新配置中首选当前名称。

| 旧键 | 当前键/行为 |
| --- | --- |
| `documentations` | `docs` |
| `markdownOutput` | `docs[].docsOutput` |
| `jsonSource` | `docs[].docusaurusCatalogDir` |
| 顶级 `openrouter` | `providers.openrouter` + `provider: "openrouter"` |
| `features.translateMarkdown` | `features.translateDocs` |
| `features.translateJSON` | 已移除（使用 `docs[].docusaurusCatalogDir` 或 `json[]`） |
| `features.extractUIStrings` | 已移除（`extract` 在 UI 翻译之前运行） |
| `glossary.uiGlossaryFromStringsJson` | `glossary.uiGlossary` |
| `ui.reactExtractor` | `ui.uiExtractor`（别名仍然接受） |
| `svg.svgExtractor.forceLowercase` | `svg.forceLowercase` |

**内容源**

- `description`
此块的可选人类可读注释（不用于翻译）。如果设置，则在 `translate-docs` `🌐` 标题中添加前缀；也会显示在 `status` 部分标题中。
- `contentPaths`
要翻译的 Markdown/MDX 页面正文和 `.astro` 模板（`translate-docs` 会扫描这些以获取 `.md`、`.mdx` 和 `.astro`）。支持**目录路径或 glob 模式**（例如 `"docs/**/*.md"`、`"guides/*.mdx"`、`"src/pages/index.astro"`）。这就是本地化文档正文的来源。
- `sourceFiles`
加载时合并到 `contentPaths` 的可选别名。
- `targetLocales`
此块的可选区域设置子集（否则为根 `targetLocales`）。有效的文档区域设置是跨块的并集。
- `docusaurusCatalogDir`
可选。此块的 Docusaurus JSON 标签目录的源目录（例如，来自 `docusaurus write-translations` 的 `"i18n/en"`）。页面正文始终来自 `contentPaths`；`docusaurusCatalogDir` 仅提供 shell/UI JSON，不提供 MDX。

**输出布局**

- `outputDir`
此块的翻译输出根目录。
- `docsOutput.style`
`"nested"`（默认）、`"flat"`、`"doc-system"` 或别名 `"docusaurus"` / `"astro-starlight"` / `"vitepress"`。
- `docsOutput.localeSubpath`
`{locale}/` 和 `{relativeToDocsRoot}` 之间用于 `doc-system` 的路径段（直接使用 `style: "doc-system"` 时必需；使用别名时预设）。使用 `""` 表示 Starlight 风格的语言环境文件夹。
- `docsOutput.docsRoot`
Docusaurus 布局的源文档根目录（例如 `"docs"`）。省略时默认为 `"docs"`。
- `docsOutput.pathTemplate`
自定义 Markdown 输出路径。占位符：<code>"{outputDir}"</code>、<code>"{locale}"</code>、<code>"{LOCALE}"</code>、<code>"{llocale}"</code>、<code>"{relPath}"</code>、<code>"{stem}"</code>、<code>"{basename}"</code>、<code>"{extension}"</code>、<code>"{docsRoot}"</code>、<code>"{relativeToDocsRoot}"</code>。
- `docsOutput.jsonPathTemplate`
标签文件的自定义 JSON 输出路径。支持与 `pathTemplate` 相同的占位符。
- `docsOutput.localePathLowercase`
当 `true` 时，内置输出布局（`nested`、`flat`、`doc-system` 不带 `pathTemplate`）在路径中使用小写语言环境段。默认 `false`；`astro-starlight` 和 `doc-system` 在配置加载时，如果 `localeSubpath` 为空，则默认为 `true`。
- `docsOutput.flatPreserveRelativeDir`
当 `docsOutput.style = "flat"` 时，保留源子目录，以便具有相同基本名称的文件不会冲突。默认 `false`。
- `docsOutput.rewriteRelativeLinks`
翻译后重写相对链接（当`docsOutput.style = "flat"`且没有自定义`pathTemplate`时自动启用）。
- `docsOutput.linkRewriteDocsRoot`
计算平面链接重写前缀时使用的仓库根目录。通常将其保留为`"."`，除非您的翻译文档位于不同的项目根目录下。
- `docsOutput.rewriteVitepressLinks`
当`true`时，在翻译后运行VitePress链接规范化器。当`docsOutput.style`为`"vitepress"`时，默认启用。与任何`doc-system`布局一起使用，其中语言环境文件夹与英文文件夹并排位于`docsRoot`下。将README样式的`docs/guide/…`路径重写为站点路由（`/guide/…`）和语言环境相对的`../guide/…`链接。对于指向VitePress树外部仓库文件的链接（`LICENSE`，`examples/`），请在英文源中使用完整URL——请参阅[VitePress集成——README作为文档主页](/guide/vitepress-integration#readme-as-homepage)。

**后处理**

- `docsOutput.postProcessing`
对翻译后的 **markdown 正文**进行可选转换（YAML 键和非散文前置元数据值保留）。在段落重组和链接重写（平面或 VitePress）之后、`addFrontmatter` 之前运行。
- `docsOutput.postProcessing.regexAdjustments`
`{ "description"?, "search", "replace" }` 的有序列表。`search` 是一个正则表达式模式（纯字符串使用标志 `g` 或 `/pattern/flags`）。`replace` 支持占位符，例如 `${translatedLocale}`、`${sourceLocale}`、`${sourceFullPath}`、`${translatedFullPath}`、`${sourceFilename}`、`${translatedFilename}`、`${sourceBasedir}`、`${translatedBasedir}`。
<a id="language-switcher-languagelistblock"></a>
- `docsOutput.postProcessing.languageListBlock`
`{ "start", "end", "separator", "label"? }` — 在源和翻译的 markdown 中重新生成有界“以其他语言阅读”链接行。当 `label: "local"` 时，需要 `uiLanguagesPath`（或 `ui.flatOutputDir/ui-languages.json` 处的清单）来获取内名标签。

**行为和元数据**

- `translateFrontmatterFields`
与 `docsOutput` 处于同一级别（每个 `docs[]` 块）。默认 `true`：翻译 Starlight/Docusaurus 的面向用户的 YAML 散文（`title`、`description`、`sidebar.label`、`sidebar_label`、`keywords`、`hero.title`、`hero.tagline`、`hero.image.alt`、`hero.actions[].text`、`pagination_label`、`prev`/`next` 标签）。将 `false` 设置为保持整个前置元数据块不变；传递字符串数组以限制为特定的点路径。
- `segmentSplitting`
与 `docsOutput` 处于同一级别（每个 `docs[]` 块）。用于 `translate-docs` 提取的可选更细粒度段：`{ "enabled", "maxCharsPerSegment"?, "splitPipeTables"?, "splitDenseParagraphs"?, "maxLinesPerParagraphChunk"?, "splitLongLists"?, "maxListItemsPerChunk"?, "qualityRetrySplit"?, "maxQualityRetrySplitDepth"? }`。当 `enabled` 为 `true`（当省略 `segmentSplitting` 时的默认值）时，密集段落、GFM 管道表（第一个块包括标题、分隔符和第一个数据行）和长列表会被拆分；子部分用单个换行符重新连接（`tightJoinPrevious`）。将 `"enabled": false` 设置为仅对每个由空行分隔的正文块使用一个段。当 `qualityRetrySplit` 为 `true`（默认值）时，在所有模型都用尽后未能通过 AST 验证的 markdown 段会逐步拆分并从第一个模型重试；`maxQualityRetrySplitDepth`（默认 `3`）限制递归拆分。
- `warnMarkdownSourceIssues`
当 `true`（省略时的默认值）时，每次 `translate-docs` 运行都会重新扫描 markdown 段以查找危险分隔符/未闭合的内联代码，打印终端警告，并替换该文件缓存路径的 `markdown_source_issues` 行。将 `false` 设置为跳过此块的警告和 SQLite 更新。
- `addFrontmatter`
当 `true`（省略时的默认值）时，翻译后的 markdown 文件包含 YAML 键：`translation_last_updated`、`source_file_mtime`、`source_file_hash`、`translation_language`、`source_file_path`，并且当至少一个段具有模型元数据时，`translation_models`（来自活动提供程序的模型 ID 的排序列表）。设置为 `false` 以跳过。
- `emphasisPlaceholders`
每个 `docs[]` 块。当 `true` 时，在翻译前将 markdown 强调分隔符屏蔽为占位符。对于 CJK 语言环境（`zh`、`ja`、`ko`）和 `rtlLocales` 中列出的语言环境，默认为 `true`；否则默认为 `false`。可通过 CLI `--emphasis-placeholders` / `--no-emphasis-placeholders` 覆盖。
- `rtlLocales`
BCP-47 代码的可选数组，被视为 RTL 以用于强调占位符默认值（与内置 RTL 检测合并）。

<a id="protectattributes-protectkeys"></a>
- `protectAttributes`
可选。额外的 JSX/HTML 属性名，其 **引用的字符串值**不得发送给翻译器。与内置默认值合并（`class`、`id`、`style`、`src`、`href`、`type`、`data-*`、大多数 `aria-*` 等）。不区分大小写。适用于：

- `.astro` 解析替换提取（静态 HTML 标签和 `attr=` 块内的 `{expression}` 中的字符串字面量）。
  - markdown/Astro 段落翻译期间的 MDX 占位符提取（`label`、`tooltip` 以及大写 JSX 标签上的 `aria-label`，加上适用的 `TabItem` `value`）。

示例：`"protectAttributes": ["variant", "size"]` 会在不同区域设置中保持 `variant="primary"` 在 `{items.map(...)}` 内不变。

您也可以列出通常可翻译的属性（例如 `"title"` 或 `"aria-label"`），当您希望这些值从英文按原样复制时。

- `protectKeys`
可选。额外的 **对象属性名**，其带引号的字符串值在模板 `{expression}` 块和 MDX 对象字面量（例如 `label:` 在 `<Tabs values={[ … ]}>` 中）中不得翻译。与内置默认值合并（`class`、`key`、`id`、`href`、`src` 等）。不区分大小写。

示例：`"protectKeys": ["slug", "code"]` 跳过 `{ slug: 'getting-started', title: 'Getting started' }` → 当 `slug` 被保护时，只有 `title` 被翻译。

<br/>

**示例（`docsOutput.style = "flat"` — 屏幕截图路径 + 可选语言列表包装器）：**

<details>
<summary>扁平布局后处理示例（屏幕截图 + languageListBlock）</summary>

```json
"docsOutput": {
  "style": "flat",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders",
        "search": "images/screenshots/[^/]+/",
        "replace": "images/screenshots/${translatedLocale}/"
      }
    ],
    "languageListBlock": {
      "start": "<small id=\"lang-list\">",
      "end": "</small>",
      "separator": " · ",
      "label": "local"
    }
  }
}
```

</details>

<a id="json"></a>
### `json`

嵌套 JSON 翻译管道的顶级数组。仅当 `features.translateJson` 为 true 时使用（`translate-json` 或 `sync` 的 JSON 阶段）。请参阅 [JSON](/guide/json)。

| 字段 | 描述 |
|-------|-------------|
| `description` | CLI / `status` 的可选注释（不翻译）。 |
| `contentPaths` | 项目根目录下的源 `.json` 文件、目录或 glob 模式。 |
| `outputPathTemplate` | 每个目标语言环境必需的输出路径。占位符：`{locale}`、`{LOCALE}`、`{llocale}`、`{stem}`、`{basename}`、`{extension}`、`{relativeToSourceRoot}`。 |
| `targetLocales` | 此块的可选子集；否则为根 `targetLocales`。 |
| `keyPolicy.mode` | `allowlist`、`denylist` 或 `both`。 |
| `keyPolicy.translateKeys` | 模式为 `allowlist` 或 `both` 时要包含的点路径 / glob 模式。 |
| `keyPolicy.skipKeys` | 要排除的点路径 / glob 模式（默认拒绝列表包括 `id`、`slug`、`href`、`url`、`key`、`code`）。 |

<a id="svg"></a>
### `svg`

SVG 文件的顶级路径和布局。仅当 `features.translateSVG` 为 true（通过 `translate-svg` 或 `sync` 的 SVG 阶段）时，翻译才会运行。

| 字段            | 描述                                                                                                                                                                                                                                                        |
|------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `sourcePath`     | 一个或多个目录 **或 glob 模式**（例如 `"images/*.svg"`、`"**/icons/*.svg"`）。模式相对于项目根目录解析，并递归扫描 `.svg` 文件。                                                                         |
| `outputDir`      | 翻译后的 SVG 输出的根目录。                                                                                                                                                                                                                          |
| `style`          | `"flat"` 或 `"nested"`（当 `pathTemplate` 未设置时）。                                                                                                                                                                                                               |
| `pathTemplate`   | 自定义 SVG 输出路径。占位符：<code>"{outputDir}"</code>、<code>"{locale}"</code>、<code>"{LOCALE}"</code>、<code>"{llocale}"</code>、<code>"{relPath}"</code>、<code>"{stem}"</code>、<code>"{basename}"</code>、<code>"{extension}"</code>、<code>"{relativeToSourceRoot}"</code>。 |
| `localePathLowercase` | 当 `true` 时，内置的 `flat` / `nested` SVG 布局使用小写区域设置段。自定义 `pathTemplate` 值保持不变；使用 `{llocale}` 来获取小写段。 |
| `forceLowercase` | 在重新组装 SVG 时将翻译文本转换为小写。对于依赖全小写标签的设计很有用。                                                                                                                                                                |

<a id="glossary"></a>
### `glossary`

| 字段          | 描述                                                                                                                                                                                                                                                        |
|----------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `uiGlossary`   | `strings.json` 的路径 - 从现有翻译自动构建词汇表。                                                                                                                                                                                              |
| `userGlossary` | 包含 `Original language string`（或 `en`）、`locale`、`Translation` 列的 CSV 的路径 - 每行一个源术语和目标区域设置（`locale` 可以是 `*` 以表示所有目标）。 |
| `autoAddUserEditedToGlossary` | 当 `true` 时，对 UI 字符串的仪表板编辑可以自动添加到用户词汇表中。 |

**生成一个空的词汇表 CSV：**

```bash
npx ai-i18n-tools glossary-generate
```
