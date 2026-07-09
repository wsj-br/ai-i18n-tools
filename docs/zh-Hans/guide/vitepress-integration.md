<a id="vitepress-integration"></a>
# VitePress集成

将 `init -t ui-vitepress` 和 `docsOutput.style: "vitepress"` 用于 [VitePress](https://vitepress.dev/) 文档站点。此预设是 `doc-system` 的别名，其 `localeSubpath` 为空，并保留了 BCP-47 区域设置文件夹名称（`localePathLowercase` 默认为 `false`，因此文件夹保持为 `pt-BR`、`zh-Hans` 等）。

另请参阅[文档](/guide/documents/)和可运行的 [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) 演示。本仓库在 `docs/` 下的文档站点是一个完整的 VitePress + ai-i18n-tools 参考实现（包含九种语言、主题目录、GitHub Pages）。

<a id="quick-start"></a>
## 快速入门

```bash
npx ai-i18n-tools init -t ui-vitepress
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm run docs:build  # VitePress build (project-specific script)
```

当您在一次 `sync` 运行中同时翻译页面内容和 VitePress 界面字符串时，请启用 `features.translateDocs`。

<a id="page-layout"></a>
## 页面布局

英文 markdown 位于 VitePress 内容根目录（通常是 `docs/`）。翻译后的副本与源树并排放置：

```text
docs/index.md           →  docs/de/index.md
docs/guide/quick-start.md  →  docs/de/guide/quick-start.md
```

配置一个 `docs[]` 块：

```json
{
  "contentPaths": ["docs/index.md", "docs/guide"],
  "outputDir": "docs",
  "docsOutput": {
    "style": "vitepress",
    "docsRoot": "docs",
    "rewriteVitepressLinks": true
  }
}
```

将 `contentPaths` 指向您的英文 `.md` 文件和目录。将 `docsRoot` 设置为 VitePress 用作其内容根目录的相同文件夹。

连接 VitePress [国际化](https://vitepress.dev/guide/i18n)：英文在 `root`，每个目标区域设置在 `locales[code].link` 下（例如 `/pt-BR/`）。保持 `ai-i18n-tools.config.json` 中的 `targetLocales` 与 `.vitepress/config.mts` 中的 `locales` 键对齐。

<a id="theme-strings"></a>
## 主题字符串

VitePress 导航栏、侧边栏、页脚、搜索占位符和其他 `themeConfig` 标签不会从 markdown 中提取。请配置 **`docsOutput.vitepressThemeCatalog`**，以便 **`translate-docs`** 从 `.vitepress/config.mts` 引导生成英文目录（当字符串为内联时），并翻译各语言的主题 JSON 文件：

```json
{
  "features": {
    "translateDocs": true
  },
  "docs": [
    {
      "contentPaths": ["docs/index.md", "docs/guide"],
      "outputDir": "docs",
      "docsOutput": {
        "style": "vitepress",
        "docsRoot": "docs",
        "vitepressThemeCatalog": {
          "configPath": "docs/.vitepress/config.mts",
          "catalogPath": "docs/.vitepress/i18n/theme.en.json"
        }
      }
    }
  ]
}
```

- **`catalogPath`** — 生成的英文嵌套 JSON（引导输出）。当英文内容存在于 `config.mts` 中时，作者无需手动维护此文件；重新运行 `sync` 即可刷新。
- **`outputPathTemplate`**（可选）— 各语言输出；默认值：与 `catalogPath` 相同的目录，并带有 `theme.{locale}.json`。

在 `.vitepress/config.mts` 中通过 `loadTheme()` 加载各语言文件，并根据翻译后的 JSON 构建 `locales[code].themeConfig`。请参阅 [examples/vitepress-docs/docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts)。

**不要**将 `json[]` 用于 VitePress 主题字符串 — 该模式仅适用于无关的应用程序语言包。

<a id="wire-config-mts-to-generated-theme-json"></a>
## 将 config.mts 连接到生成的主题 JSON（一次性操作）

在使用 `vitepressThemeCatalog` 首次成功运行 `i18n:sync` / `translate-docs` 后，仓库已生成 `theme.en.json` 和 `theme.{locale}.json`，但 **现有**站点的 `config.mts` 中可能仍包含硬编码的 `text:` / `message:` 字符串。在配置通过 `loadTheme()` 加载之前，VitePress 不会使用翻译后的 JSON。

**不在工具范围内：** 自动代码重构。每个项目使用一次以下提示（或使用示例配置手动重构）。

1. **何时执行** — 在首次同步生成 `catalogPath` 和各语言主题文件之后；在期望在开发/构建中看到翻译后的导航栏/侧边栏之前。
2. **保持不变** — 路由链接 (`/guide/…`)、语言键、`defineConfig` 结构、非字符串选项（搜索提供程序、折叠标志）。
3. **参考** — [examples/vitepress-docs/docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts) 和生成的 `theme.en.json` 结构。
4. **验证** — `pnpm docs:dev`，在导航栏中切换语言，确认侧边栏/页脚/搜索占位符已翻译；`pnpm docs:build` 通过。

**AI 代理提示示例**（复制到 Cursor 或其他编码代理中）：

```markdown
Refactor our VitePress config to load theme strings from generated JSON files instead of hardcoded literals.

Context:
- ai-i18n-tools already generated English and locale theme catalogs via `docsOutput.vitepressThemeCatalog`.
- English catalog: `docs/.vitepress/i18n/theme.en.json`
- Locale catalogs: `docs/.vitepress/i18n/theme.{locale}.json` (e.g. pt-BR, zh-Hans)
- Target file: `docs/.vitepress/config.mts` (or our project's equivalent path)
- Reference pattern: https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/docs/.vitepress/config.mts

Requirements:
1. Add `loadTheme(localeFile: string)` that reads JSON from `docs/.vitepress/i18n/` (use `import.meta.url` / `fileURLToPath` for ESM paths).
2. Add `themeConfigFor(t)` that builds VitePress `themeConfig` from the catalog — keep all **links and structure** in TypeScript; only **display strings** come from JSON keys matching `theme.en.json`.
3. Wire `locales.root` and each target locale in `locales[code]` to `loadTheme('theme.en.json')` or `loadTheme('theme.{code}.json')`, then `themeConfig: themeConfigFor(theme)`.
4. Align locale codes with `ai-i18n-tools.config.json` `targetLocales` and existing VitePress `locales` keys.
5. Do **not** change markdown content paths, `base`, or link targets — only move translatable labels out of inline string literals.
6. Preserve any project-specific options (ignoreDeadLinks, head config, etc.).

After editing:
- Run `pnpm docs:dev` (or our docs dev script) and confirm English + at least one translated locale show correct nav/sidebar/footer/search placeholder.
- If a string exists in config but not in `theme.en.json`, add a matching key to the JSON shape in `themeConfigFor` and note that the user should re-run `i18n:sync` to refresh catalogs from config if needed.

Do not introduce a hand-maintained duplicate of theme strings — config must read from the generated JSON files only.
```

<a id="framework-shell-translation"></a>
## 框架外壳翻译

| 框架 | Shell / 主题字符串 | 管道 |
|-----------|----------------------|----------|
| Docusaurus | `write-translations` 目录 (`{ message, description }`) | 文档 — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | 主题/导航/侧边栏目录 | 文档 — `docsOutput.vitepressThemeCatalog` + `translate-docs` |
| Nextra | `_meta.ts` 侧边栏标签 | 文档 — 当 `style: "nextra"` + `translate-docs` 时自动翻译 |
| Nextra | 主题字典 `.ts` | 文档 — `docs[].nextraDictionaryPath` + `translate-docs` |
| Astro Starlight | 内置 UI 字符串（多语言）；无额外外壳流水线 | 文档 — `translate-docs`（仅页面） |

**不要**将框架外壳/主题字符串放入 `json[]` —— 该流水线用于不相关的应用语言包。有关其他框架模式，请参见 [Docusaurus 集成](/guide/docusaurus-integration) 和 [Nextra 集成](/guide/nextra-integration)。

<a id="example-project"></a>
## 示例项目

[examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) — 英文源文件位于 `docs/`，已提交 `pt-BR` 和 `zh-Hans` 页面树，以及 `theme.pt-BR.json` / `theme.zh-Hans.json`。在端口 3060 上运行 `pnpm run docs:dev`。

<a id="readme-as-the-docs-homepage"></a>
## 将 README 作为文档主页

一些项目将 `README.md` 复制到 VitePress 站点作为 `docs/index.md`（此存储库在 `docs:build` 之前使用 `scripts/sync-readme-to-docs.mjs`）。这种模式在 GitHub 和文档站点之间共享一个文件，但链接规则不同：

| 链接类型 | 在 GitHub 上有效 | 在 VitePress 上有效 |
|-----------|-----------------|-------------------|
| `docs/guide/foo.md` | 是 | 否 — 使用站点路由或在同步期间让规范化器重写 |
| `./LICENSE`、`examples/demo/` | 是（相对于存储库） | 否 — 使用 **完整 URL** |
| `/guide/foo` | 否 | 是 |

**建议：** 在 `README.md` 中，对于 VitePress 内容树之外的任何内容（`LICENSE`、`examples/`、配置文件、代理上下文文件）以及 `translated-docs/` 下的翻译 README 副本，请使用 **完整 URL**。对于站点内文档链接，请使用 `docs/guide/…` 路径（或 `docs/` 下英文文档中的站点路由）；同步脚本和 `rewriteVitepressLinks` 规范化器会将这些链接转换为 `/guide/…` 路由。

示例：

```markdown
[console-app demo](https://github.com/your-org/your-repo/tree/main/examples/console-app/)
[License](https://github.com/your-org/your-repo/blob/main/LICENSE)
[Quick start](/guide/quick-start)
```

<a id="link-conventions"></a>
## 链接约定

VitePress 从内容根目录提供英文页面，并从 `docs/<locale>/…` 提供本地化副本，但**页面内链接必须使用站点路由**（`/guide/quick-start`、`/reference/configuration`），而不是像 `docs/guide/quick-start.md` 或 `../guide/quick-start.md` 这样的仓库相对路径。这些 README 风格的路径在 GitHub 中有效，但在 VitePress 内部（开发环境和 GitHub Pages 上均出现 404 错误）会失效。

启用内置的规范化器，以便 `translate-docs` 自动修复每个翻译文件中的链接：

```json
"docsOutput": {
  "style": "vitepress",
  "docsRoot": "docs",
  "rewriteVitepressLinks": true
}
```

当 `style` 为 `"vitepress"` 时，`rewriteVitepressLinks` 默认启用。

| 英文源文件中的作者 | 规范化后 |
|--------------------------|------------------|
| `[JSON](/guide/json)` | `[JSON](/guide/json)` |
| 区域设置索引上的 `[Home](./README.md)` | `/` |
| `[Demo](https://github.com/org/repo/tree/main/examples/console-app/)` | 未更改（完整 URL） |

**创作规则**

- 跨页文档链接：在 `docs/` 下的英文 Markdown 中使用 **站点路由**（`/guide/…`、`/reference/…`），或在从 `README.md` 同步时使用 `docs/guide/…` 路径。
- 可运行的演示、`LICENSE` 和其他存储库文件：在 `README.md` 和文档中（参见[README 作为文档主页](#readme-as-homepage)) 使用 **完整的 GitHub URL**。
- **不要**手动编辑 `docs/<locale>/` 中的链接 — 使用 `sync` / `translate-docs` 重新生成。

另请参阅 [链接重写](/guide/images-and-screenshots/link-rewriting)（平面与 VitePress）和 [配置 — `docsOutput`](/reference/configuration#docsoutput)。
