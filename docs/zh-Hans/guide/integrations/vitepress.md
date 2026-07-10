<a id="vitepress-integration"></a>
# VitePress 集成

在 [VitePress](https://vitepress.dev/) 文档站点中使用 `init -t ui-vitepress` 和 `docsOutput.style: "vitepress"`。该预设是 `doc-system` 的别名，带有空的 `localeSubpath` 并保留 BCP-47 语言环境文件夹名称（`localePathLowercase` 默认为 `false`，因此文件夹保持为 `pt-BR`、`zh-Hans` 等）。

另请参阅[文档](/zh-Hans/guide/documents/)和可运行的 [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) 演示。本仓库在 `docs/` 下的自身文档站点是一个完整的 VitePress + ai-i18n-tools 参考示例（九种语言环境、主题目录、GitHub Pages）。

<a id="quick-start"></a>
## 快速开始

```bash
npx ai-i18n-tools init -t ui-vitepress
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm run docs:build  # VitePress build (project-specific script)
```

当您在一次 `sync` 运行中翻译页面内容和 VitePress 界面字符串时，请启用 `features.translateDocs`。

<a id="page-layout"></a>
## 页面布局

英文 Markdown 位于 VitePress 内容根目录（通常是 `docs/`）。翻译副本会写入源代码树旁边：

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

将 `contentPaths` 指向您的英文 `.md` 文件和目录。将 `docsRoot` 设置为 VitePress 用作其内容根目录的同一文件夹。

连接 VitePress [国际化](https://vitepress.dev/guide/i18n)：英文位于 `root`，每个目标语言环境位于 `locales[code].link` 下（例如 `/pt-BR/`）。保持 `ai-i18n-tools.config.json` 中的 `targetLocales` 与 `.vitepress/config.mts` 中的 `locales` 键对齐。

<a id="theme-strings"></a>
## 主题字符串

VitePress 导航、侧边栏、页脚、搜索占位符和其他 `themeConfig` 标签不会从 Markdown 中提取。配置 **`docsOutput.vitepressThemeCatalog`**，以便 **`translate-docs`** 从 `.vitepress/config.mts` 引导英文目录（当字符串为内联时）并翻译语言环境主题 JSON 文件：

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

- **`catalogPath`** — 生成的英文嵌套 JSON（引导输出）。当英文位于 `config.mts` 时，作者无需手动维护此文件；重新运行 `sync` 即可刷新它。
- **`outputPathTemplate`**（可选）— 每个语言环境的输出；默认值：与 `catalogPath` 相同的目录，带有 `theme.{locale}.json`。

当这些文件尚不存在时，`init -t ui-vitepress` 还会搭建初始的 `docs/.vitepress/config.mts` 和 `docs/.vitepress/i18n/theme.en.json`。配置通过 `loadTheme()` 加载目录，并在 `themeConfigFor()` 中连接标准的 VitePress 国际化标签（包括 `langMenuLabel`）。

通过 `loadTheme()` 在 `.vitepress/config.mts` 中加载每个语言环境的文件，并根据翻译后的 JSON 构建 `locales[code].themeConfig`。请参阅 [examples/vitepress-docs/docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts)。

**语言菜单字符串：** `locales[code].label` 是下拉菜单中每种语言的可见名称（例如 `Português (Brasil)`）。`themeConfig.langMenuLabel` 是语言切换按钮上的 **aria-label**（VitePress 默认值：`Change language`）。将 `langMenuLabel` 放在主题目录中，并在 `themeConfigFor()` 内部连接 `langMenuLabel: t.langMenuLabel` —— 不要将其与每个语言环境的 `label` 字符串混淆。

在 `sync` / `translate-docs` 期间，如果 `theme.en.json` 中的目录键未从 `config.mts` 中引用（例如 `themeConfigFor()` 中缺少 `t.langMenuLabel`），ai-i18n-tools 会发出警告。

**不要**将 `json[]` 用于 VitePress 主题字符串 —— 该模式仅适用于不相关的应用程序语言环境包。

<a id="wire-configmts-to-generated-theme-json-one-off"></a>
## 将 config.mts 连接到生成的主题 JSON（一次性）

在使用 `vitepressThemeCatalog` 首次成功运行 `i18n:sync` / `translate-docs` 后，仓库已生成 `theme.en.json` 和 `theme.{locale}.json`，但**现有**站点可能仍在 `config.mts` 中包含硬编码的 `text:` / `message:` 字符串。在配置通过 `loadTheme()` 加载翻译后的 JSON 之前，VitePress 不会使用它们。

**不在工具范围内：** 自动代码转换。使用下面的提示一次一个项目（或使用示例配置手动重构）。

1. **时机** — 首次同步生成 `catalogPath` 和本地化主题文件后；期望在 dev/build 中看到翻译后的导航/侧边栏之前。
2. **保持不变** — 路由链接（`/guide/…`）、本地化键、`defineConfig` 结构、非字符串选项（搜索提供者、折叠标志）。
3. **参考** — [examples/vitepress-docs/docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts) 和生成的 `theme.en.json` 结构。
4. **验证** — `pnpm docs:dev`，在导航中切换语言环境，确认侧边栏/页脚/搜索占位符已翻译；`pnpm docs:build` 通过。

**示例 AI 代理提示**（复制到 Cursor 或其他编码代理中）：

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

| 框架 | 外壳/主题字符串 | 管道 |
|-----------|----------------------|----------|
| Docusaurus | `write-translations` 目录 (`{ message, description }`) | 文档 — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | 主题/导航/侧边栏目录 | 文档 — `docsOutput.vitepressThemeCatalog` + `translate-docs` |
| Nextra | `_meta.ts` 侧边栏标签 | 文档 — 当 `style: "nextra"` + `translate-docs` 时自动 |
| Nextra | 主题字典 `.ts` | 文档 — `docs[].nextraDictionaryPath` + `translate-docs` |
| Fumadocs | `meta.json` 侧边栏标签 | 文档 — 当 `style: "fumadocs"` + `translate-docs` 时自动 |
| Fumadocs | UI 覆盖目录 | 文档 — `docsOutput.fumadocsUiCatalog` + `translate-docs` |
| Astro Starlight | 内置 UI 字符串（多语言支持）；无额外外壳管道 | 文档 — `translate-docs`（仅页面） |

Do **不** 将框架 shell/主题字符串放在 `json[]` 中 —— 该管道用于无关的应用程序本地化包。请参阅 [Docusaurus 集成](/zh-Hans/guide/integrations/docusaurus) 和 [Fumadocs 集成](/zh-Hans/guide/integrations/fumadocs) 以了解其他框架模式。

<a id="example-project"></a>
## 示例项目

[examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) — 英文源文件位于 `docs/`，已提交 `pt-BR` 和 `zh-Hans` 页面树，以及 `theme.pt-BR.json` / `theme.zh-Hans.json`。在端口 3060 上运行 `pnpm run docs:dev`。

<a id="readme-and-the-docs-homepage"></a>
## README 与文档主页

下游项目有时会将 `README.md` 作为 `docs/index.md` 复制到 VitePress 站点中（通过构建脚本或手动同步）。该模式在 GitHub 和文档站点之间共享一个文件，但链接规则不同：

| 链接类型 | 在 GitHub 上有效 | 在 VitePress 上有效 |
|-----------|-----------------|-------------------|
| `docs/guide/foo.md` | 是 | 否 — 使用站点路由或在同步期间让规范化器重写 |
| `./LICENSE`, `examples/demo/` | 是（仓库相对路径） | 否 — 使用 **完整 URL** |
| `/guide/foo` | 否 | 是 |

**同步 README → index 的建议：** 在 `README.md` 中，对于 VitePress 内容树之外的任何内容（`LICENSE`、`examples/`、配置文件、代理上下文文件）以及 `translated-docs/` 下的翻译 README 副本，请使用 **完整 URL**。对于站点内文档链接，请使用 `docs/guide/…` 路径（或 `docs/` 下英文文档中的站点路由）；同步脚本或 `rewriteVitepressLinks` 规范化器可以将这些转换为 `/guide/…` 路由。

**此仓库**将 `README.md` 和 `docs/index.md` 作为**独立文件**保留：README 是完整的 npm/GitHub 着陆页；`docs/index.md` 是一个精简的文档站点入口点，链接到 `/guide/` 和 `/reference/`。当共享事实发生变化时，请根据各自的受众更新每个文件。

另一个项目中同步 README 的示例链接：

```markdown
[console-app demo](https://github.com/your-org/your-repo/tree/main/examples/console-app/)
[License](https://github.com/your-org/your-repo/blob/main/LICENSE)
[Quick start](/zh-Hans/guide/quick-start)
```

<a id="link-conventions"></a>
## 链接约定

VitePress 从内容根目录提供英文页面，并从 `docs/<locale>/…` 提供区域设置副本，但**页内链接必须使用站点路由**（`/guide/quick-start`、`/reference/configuration`）——而不是像 `docs/guide/quick-start.md` 或 `../guide/quick-start.md` 这样的仓库相对路径。那些 README 风格的路径在 GitHub 中有效，但在 VitePress 中会失效（在开发环境和 GitHub Pages 上出现 404）。

启用内置的规范化器，以便 `translate-docs` 自动修复每个翻译文件中的链接：

```json
"docsOutput": {
  "style": "vitepress",
  "docsRoot": "docs",
  "rewriteVitepressLinks": true
}
```

当 `style` 为 `"vitepress"` 时，`rewriteVitepressLinks` 默认为启用状态。

| 英文源中的作者 | 经过规范化处理后（英文根输出） | 经过规范化处理后（已翻译的 `docs/<locale>/` 输出） |
|--------------------------|----------------------------------------|------------------------------------------------------|
| `[JSON](/zh-Hans/guide/json)` | `[JSON](/zh-Hans/guide/json)` | `[JSON](/pt-BR/guide/json)`（区域设置前缀与文件夹匹配） |
| 正文中的 `[Quick start](/zh-Hans/guide/quick-start)` 或 `hero.actions[].link` | 不变（`/guide/quick-start`） | `/pt-BR/guide/quick-start` |
| 区域设置索引上的 `[Home](./README.md)` | `/` | `/pt-BR/` |
| `hero.image.src: /logo.svg` | 不变 | 不变（共享的 `docs/public/` 资源） |
| `[Demo](https://github.com/org/repo/tree/main/examples/console-app/)` | 不变（完整 URL） | 不变（完整 URL） |

`docs/` 下的英文根源保留 **与区域设置无关的** 站点路由（`/guide/…`）。写入到 `docs/<locale>/…` 的文件会自动在内部内容路由上获得区域设置前缀——包括 **首页布局 frontmatter**（`hero.actions[].link`、`features[].link`、`prev`/`next`）。共享的公共资源（例如 `/logo.svg` 和 `/translation-dashboard.png`）在每个区域设置上均保持不带前缀。

<a id="theme-navsidebar-links"></a>
### 主题导航/侧边栏链接

`translate-docs` **不会** 重写 `.vitepress/config.mts` 中的链接。导航栏和侧边栏的 `link` 值在 TypeScript 中编写一次，必须在配置构建时按语言环境添加前缀。

VitePress [`themeConfig.i18nRouting`](https://vitepress.dev/reference/default-theme-config#i18nrouting) 仅控制 **语言环境切换器**（当用户选择另一种语言时映射到等效页面）。它 **不会** 重写当前语言环境页面上的静态 `nav` / `sidebar` href。

使用 `ai-i18n-tools` 中的 `prefixVitepressThemeConfigLinks`（与 markdown 链接重写的前缀规则相同）：

```typescript
import { prefixVitepressThemeConfigLinks } from "ai-i18n-tools";

function themeConfigFor(t: ThemeCatalog, localeCode: string | null = null) {
  const localeRoutePrefix = localeCode ? `/${localeCode}` : null;
  return prefixVitepressThemeConfigLinks(
    {
      nav: [{ text: t.nav.guide, link: "/guide/getting-started", activeMatch: "/guide/" }],
      sidebar: [/* … locale-neutral /guide/… links … */],
      /* footer, search, etc. */
    },
    localeRoutePrefix
  );
}

// root English
themeConfig: themeConfigFor(enTheme)

// each target locale
themeConfig: themeConfigFor(theme, code)
```

与 **`link`** 一起为 **`activeMatch`** 添加前缀，以便导航高亮在语言环境路由上正常工作（`/pt-BR/guide/` 而非 `/guide/`）。外部 URL 和共享公共资产保持不变。

在 VitePress 项目中将 `ai-i18n-tools` 添加为 **devDependency**（参见 `examples/vitepress-docs/package.json`），以便 `config.mts` 能够导入 `prefixVitepressThemeConfigLinks`。主 ai-i18n-tools 文档站点直接从 `src/processors/…` 导入，因为它在 monorepo 检出中进行了内部试用；独立副本（degit）应使用 npm 包。

**编写规则**

- 跨页面文档链接：在 `docs/` 下的英文 markdown 中使用**站点路由**（`/guide/…`、`/reference/…`），或者在编写将同步到另一个项目中的 `docs/index.md` 的 README 时使用 `docs/guide/…` 路径。
- 可运行的演示、`LICENSE` 和其他仓库文件：在 `README.md` 和文档中使用**完整的 GitHub URL**（参见 [README 和文档主页](#readme-as-the-docs-homepage)）。
- **不要**手动编辑 `docs/<locale>/` 中的链接——使用 `sync` / `translate-docs` 重新生成。

另请参阅 [链接重写](/zh-Hans/guide/images-and-screenshots/link-rewriting)（扁平结构与 VitePress 对比）和 [配置 — `docsOutput`](/zh-Hans/reference/configuration#docsoutput)。
