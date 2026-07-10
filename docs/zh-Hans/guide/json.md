<a id="json"></a>
# JSON

专为将 UI 文本保存在每个区域设置的**嵌套 JSON 文件**（例如 `src/i18n/en/translation.json`）而不是源代码中的 `t("…")` 的项目而设计。CLI 会遍历这些文件中的字符串值，通过活动的 LLM 提供程序翻译它们，并使用 `json[].outputPathTemplate` 写入每个区域设置的输出。它使用与 `translate-docs` 和 `translate-svg` (`cacheDir`) 相同的 SQLite 缓存。

此管道**不**运行 `extract` — 没有 `strings.json` 目录。使用 `features.translateJson` 和顶级 `json[]` 中的一个或多个条目来启用它。

<a id="per-locale-model-overrides"></a>
### 每个区域模型覆盖

`translate-json` 解析模型 **按目标区域设置**：首先使用 `localeModels(locale)`，如果已配置，则使用 `translationModels`。在某些区域设置中，使用专用模型可以带来更好的效果，例如 `zh-Hans` / `zh-Hant` 主题文件。请参阅 [提供程序和模型](/zh-Hans/guide/providers-and-models#model-fallback-chain)。

<a id="step-1-initialise-for-nested-json"></a>
### 步骤 1：初始化嵌套 JSON

```bash
npx ai-i18n-tools init -t ui-json-bundles
```

该模板设置了 `features.translateJson: true`，禁用了界面提取和文档翻译，并搭建了一个指向 `src/i18n/en/translation.json`、输出为 `src/i18n/{llocale}/translation.json` 的单个 `json[]` 块。它还包含一个默认的 `provider` / `providers` 块——在运行 `translate-json` 或 `sync` 之前，请设置相应的 API 密钥（或使用本地 Ollama）；参见[提供商与 API 密钥](/zh-Hans/guide/quick-start#provider-and-api-key)。请根据你的仓库布局编辑 `sourceLocale`、`targetLocales`、`contentPaths` 和 `outputPathTemplate`。

<a id="step-2-configure-json"></a>
### 步骤 2：配置 `json[]`

每个 `json[]` 块描述一个管道：

- `contentPaths` — 一个或多个 `.json` 文件、目录或 glob（例如 `"src/i18n/en/translation.json"` 或 `"src/i18n/en/overrides/*.json"`）。路径从项目根目录解析。
- `outputPathTemplate` — 必需。写入每个目标区域设置文件的位置。占位符：`{locale}`、`{LOCALE}`、`{llocale}`（小写区域设置，适用于 Astro 路由文件夹）、`{stem}`、`{basename}`、`{extension}`、`{relativeToSourceRoot}`。
- `targetLocales`（可选）— 仅用于此块的子集；否则应用根 `targetLocales`。
- `keyPolicy` — 哪些 JSON 键包含可翻译的文本，哪些是稳定标识符（见下文）。
- `description`（可选）— 显示在 CLI 标题和 `status` 输出中。

示例（多个源文件，小写区域设置文件夹）：

```json
{
  "sourceLocale": "en",
  "targetLocales": ["de", "fr", "pt-BR"],
  "features": {
    "translateJson": true
  },
  "cacheDir": ".translation-cache",
  "json": [
    {
      "description": "App UI bundle",
      "contentPaths": [
        "src/i18n/en/translation.json",
        "src/i18n/en/overrides/*.json"
      ],
      "outputPathTemplate": "src/i18n/{llocale}/{basename}",
      "keyPolicy": {
        "mode": "denylist",
        "skipKeys": ["id", "slug", "href", "url", "key", "code"],
        "translateKeys": []
      }
    }
  ]
}
```

**`keyPolicy`**

| `mode`      | 行为 |
|-------------|-----------|
| `allowlist` | 仅翻译与 `translateKeys`（点路径；minimatch glob）匹配的键。 |
| `denylist`  | 翻译所有字符串值，除了与 `skipKeys` 匹配的键。 |
| `both`      | 先应用 `translateKeys`，然后从 `skipKeys` 中删除匹配项。 |

路径使用点表示法（`nav.home.label`）。像 `slug` 这样的裸名称匹配任何深度的最终键段。

<a id="step-3-translate-json-bundles"></a>
### 步骤 3：翻译 JSON 包

```bash
npx ai-i18n-tools translate-json
```

可选标志（与 `translate-docs` 的想法相同）：`-l` / `--locale` 用于目标子集，`-p` / `--path` 用于限制文件，`--dry-run`、`--force`（清除匹配文件的文件跟踪和段缓存），`--force-update`（当文件哈希匹配时重新处理；段缓存仍然适用），`-b` / `--batch-concurrency`，`--prompt-format`（`xml` \| `json-array` \| `json-object`）。

仅 JSON 项目可以运行：

```bash
npx ai-i18n-tools sync --no-ui --no-svg --no-docs
```

当同时启用 UI 和文档时，`sync` 会在 translate-docs 之后运行 **translate-json**（除非 `--no-json`）。使用 `--no-json` 跳过 JSON。

检查每个文件和区域设置的覆盖率：

```bash
npx ai-i18n-tools status
```

当 `translateJson` 运行时，`status` 会打印一个 `json[]` 部分（✓ 最新，● 过时或缺失）。

<a id="json-vs-other-pipelines"></a>
### JSON 与其他管道

| 情况 | 用途 |
|-----------|-----|
| JS/TS/Astro 中的 UI 字符串位于 `t("…")` / `i18n.t("…")` 中 | [UI 字符串](/zh-Hans/guide/ui-strings/) — `extract` + `translate-ui` |
| Docusaurus `write-translations` 目录 (`{ "key": { "message": "…", "description": "…" } }`) | 文档 — `docs[].docusaurusCatalogDir` + `translate-docs`，**不是** `json[]` |
| VitePress 主题/导航/侧边栏字符串 | 文档 — `docsOutput.vitepressThemeCatalog` + `translate-docs`；**不要**使用 `json[]` — 参见 [VitePress 集成](/zh-Hans/guide/integrations/vitepress) |
| Nextra `_meta.ts` 标签和主题字典 `.ts` | 文档 — `translate-docs`（当 `style: "nextra"` 时自动 `_meta`，可选 `nextraDictionaryPath`）；**不要**使用 `json[]` — 参见 [Nextra 集成](/zh-Hans/guide/integrations/nextra) |
| Fumadocs `meta.json` 标签和 UI 覆盖目录 | 文档 — `translate-docs`（当 `style: "fumadocs"` 时自动 `meta.json`，可选 `fumadocsUiCatalog`）；**不要**使用 `json[]` — 参见 [Fumadocs 集成](/zh-Hans/guide/integrations/fumadocs) |
| 独立嵌套区域设置 JSON（ZenBrowser 风格的 `translation.json` 树） | JSON — `json[]` + `translate-json` |
| 带有 `<text>` / `<title>` / `<desc>` 的图示 `.svg` 文件 | `features.translateSVG` + [`svg`](/zh-Hans/reference/configuration#svg) + `translate-svg`（可选；不是三个主要管道之一） |

字段参考：[配置参考](/zh-Hans/reference/configuration#json) 中的 [`json`](#json)。用于清理的缓存键在 `file_tracking` 中使用 `json-block:{blockIndex}:{projectRelPath}`。
