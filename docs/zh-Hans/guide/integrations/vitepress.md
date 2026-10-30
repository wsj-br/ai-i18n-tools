<a id="vitepress-integration"></a>
# VitePress 集成

在 [VitePress](https://vitepress.dev/) 文档站点中使用 `init -t ui-vitepress` 和 `docsOutput.style: "vitepress"`。该预设是 `doc-system` 的别名，带有空的 `localeSubpath` 并保留 BCP-47 语言环境文件夹名称（`localePathLowercase` 默认为 `false`，因此文件夹保持为 `pt-BR`、`zh-Hans` 等）。

另请参阅[文档](/zh-Hans/guide/documents/)和可运行的 [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) 演示。本仓库在 `docs/` 下的自身文档站点是一个完整的 VitePress + ai-i18n-tools 参考示例（九种语言环境、主题目录、GitHub Pages）。

<a id="quick-start"></a>
## 快速开始

```bash
ai-i18n-tools init -t ui-vitepress -P anthropic
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm run docs:build  # VitePress build (project-specific script)
```

在一次 `sync` 运行中翻译页面内容和 VitePress 主题字符串时，启用 `features.translateDocs`。

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

将 `contentPaths` 指向用 `sourceLocale` 编写的 `.md` 文件和目录。该语言可以是任何语言。将 `docsRoot` 设置为 VitePress 用作其内容根目录的同一文件夹。

配置 VitePress [国际化](https://vitepress.dev/guide/i18n): 源区域设置位于 `root`，每个目标区域设置位于 `locales[code].link` 下（例如 `/pt-BR/`）。使 `ai-i18n-tools.config.json` 中的 `targetLocales` 与 `.vitepress/config.mts` 中的 `locales` 键保持一致。

<a id="enable-i18n-in-an-existing-site"></a>
### 在现有站点中启用 i18n

仅限英文的 VitePress 配置在翻译页面显示之前需要这些部分。首次设置使用 [在网站或文档站点中添加 i18n](/zh-Hans/guide/add-i18n-to-website#run-the-agent-prompt) 上的提示。[主题目录提示](#wire-configmts-to-generated-theme-json-one-off) 是第一次 `sync` 之后的后续步骤，此时导航字符串仍以内联方式存在于配置中。

- 用于英语的 `locales.root`（`label`、`lang` 和 `themeConfig`）。
- 每个目标区域设置一个 `locales[code]` 条目：`label`、`lang`、`link: '/${code}/'` 以及每个区域设置的 `title` / `description`。
- `themeConfig` 链接和 `activeMatch`，每个区域设置都带有 `prefixVitepressThemeConfigLinks` 前缀（请参阅[主题导航/侧边栏链接](#theme-navsidebar-links))。
- `targetLocales` 与这些 `locales` 键对齐，然后是 `sync`，以确保 `docs/<locale>/` 和 `theme.<locale>.json` 存在。

<a id="theme-strings"></a>
## 主题字符串

VitePress 导航、侧边栏、页脚、搜索占位符以及其他 `themeConfig` 标签不会从 Markdown 中提取。配置 `docsOutput.vitepressThemeCatalog`，以便 `translate-docs` 从 `.vitepress/config.mts` 引导源语言环境目录（当字符串以内联方式存在时）并翻译语言环境主题 JSON 文件：

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

- `catalogPath` — 英文嵌套 JSON。来自 `config.mts` 的引导仅在这些英文字符串仍以内联方式存在于配置中时适用。在 `themeConfigFor` 读取目录后，`mergeThemeCatalogs` 保留现有文件，并且 `theme.en.json` 是事实的来源。当措辞更改时编辑该文件（或者将英文放回 `config.mts` 以进行一次 `sync`）。重命名键会更改段哈希（`path`、一个空字节，然后是值），因此下一个 `sync` 会为每个目标语言环境重新翻译该字符串一次。
- `outputPathTemplate`（可选）— 每个语言环境的输出；默认值：与 `catalogPath` 相同的目录，带 `theme.{locale}.json`。

当这些文件尚不存在时，`init -t ui-vitepress` 还会搭建初始的 `docs/.vitepress/config.mts` 和 `docs/.vitepress/i18n/theme.en.json`。配置通过 `loadTheme()` 加载目录，并在 `themeConfigFor()` 中连接标准的 VitePress 国际化标签（包括 `langMenuLabel`）。

通过 `loadTheme()` 在 `.vitepress/config.mts` 中加载每个语言环境的文件，并根据翻译后的 JSON 构建 `locales[code].themeConfig`。请参阅 [examples/vitepress-docs/docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts)。

**语言菜单字符串：** `locales[code].label` 是下拉菜单中每种语言的可见名称（例如 `Português (Brasil)`）。`themeConfig.langMenuLabel` 是语言切换按钮上的 **aria-label**。当省略该选项时，VitePress 使用 `Change language`。示例目录存储的是 `Language`，并且 `theme.en.json` 和 `config.hardcoded.example.mts` 都使用相同的句子。将 `langMenuLabel` 放入主题目录并在 `themeConfigFor()` 中设置 `langMenuLabel: t.langMenuLabel` — 不要将其与每个区域设置的 `label` 字符串混淆。

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

<details class="agent-prompt">
<summary>主题目录提示</summary>

````markdown
# Load VitePress theme strings from the catalog

## Context

ai-i18n-tools translates VitePress theme strings through
`docsOutput.vitepressThemeCatalog`. `extractVitepressThemeCatalog` writes
positional keys while English is still inline in `config.mts`
(`themeConfig.nav.0.text`, `themeConfig.sidebar.0.items.0.text`,
`locales.root.label`). The runnable example uses stable names instead
(`nav.guide`, `sidebar.gettingStarted`, `site.title`):
https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts

Reshape to named keys once and keep those names. Renaming changes the segment
hash, so the next `sync` re-translates the theme catalog for every locale (a few
dozen short strings, once). After the refactor, `config.mts` has no inline
display literals, `mergeThemeCatalogs` keeps `theme.en.json`, and that file is
the source of truth. Do not tell the user to refresh the catalog from
`config.mts` after this edit.

`translate-docs` does not rewrite links in `config.mts`. Locale pages must
prefix `link` and `activeMatch` or they point at English routes.

## Scope

Edit `.vitepress/config.mts` and `theme.en.json` only. Skip markdown bodies,
route paths, `base`, search provider choice, collapsed flags, and external URLs.

## Call shape

Precondition: `docsOutput.vitepressThemeCatalog` is set and `sync` has already
written `catalogPath`. If `theme.en.json` is missing, stop and ask for that
`sync` first.

1. Add `ai-i18n-tools` as a devDependency. Import
   `prefixVitepressThemeConfigLinks` from `ai-i18n-tools`.
2. Add `loadTheme(localeFile)` that reads `docs/.vitepress/i18n/` via
   `import.meta.url` and `fileURLToPath`. If a locale file is missing
   (`fs.existsSync`), fall back to the English theme so a fresh checkout does
   not crash before the first translation.
3. Rename positional keys in `theme.en.json` to short stable names. Update
   `themeConfigFor` to read those names. Keep links and structure in TypeScript.
   Only display strings come from the catalog.
4. If you keep positional keys instead, read them with string indexes:
   `t.themeConfig.nav["0"].text`. A numeric index `nav[0]` is invisible to the
   unused-key check and warns for every nav and sidebar entry.
5. Wrap the object `themeConfigFor` returns with
   `prefixVitepressThemeConfigLinks(themeConfig, localeRoutePrefix)`. Pass
   `/${code}` for each target locale and `null` for root. That prefixes `link`
   and `activeMatch`.
6. Per locale entry: `label` (native language name), `lang`,
   `link: '/${code}/'`, and that locale's `title` and `description` from the
   catalog.
7. Keys the extractor does not collect must be added to `theme.en.json` by hand,
   then referenced from `themeConfigFor`. That includes local-search copy under
   `search.options.locales.<code>.translations` (`button.buttonText`,
   `modal.noResultsText`, and the rest of that tree). Current VitePress docs do
   not use `options.placeholder` for local search. Also add
   `socialLinks[].ariaLabel`. A `notFound.title` inline in config is collected
   because `title` is a known key; `notFound.quote`, `notFound.linkText`,
   `notFound.linkLabel`, and `notFound.code` are not.

## Order

1. Confirm the catalog file exists.
2. Reshape keys, connect `loadTheme` and `themeConfigFor`, prefix links.
3. Ask the user to run `sync` so locale theme files are regenerated from the new
   key names. Do not hand-translate them.

## Do not

- Do not translate strings yourself.
- Do not leave a second copy of the same label in `config.mts` and in
  `theme.en.json`.
- Do not hand-edit `theme.<locale>.json`.
- Do not change markdown paths, `base`, or the path of internal links (only the
  locale prefix).

## Verify

- `pnpm docs:dev`: English and one target locale show translated nav, sidebar,
  footer, and search strings.
- A locale page's nav `link` and `activeMatch` include the locale prefix
  (`/pt-BR/guide/`, not `/guide/`).
- `pnpm docs:build` passes.
- Removing a locale theme file still builds, because `loadTheme` falls back to
  English.

## Report back

List files changed, the old path key and the new name for each rename, any
string you added by hand because the extractor skips it, and anything you left
inline on purpose.
````

</details>

<a id="example-project"></a>
## 示例项目

[examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) — 英文源文件位于 `docs/`，已提交 `pt-BR` 和 `zh-Hans` 页面树，以及 `theme.pt-BR.json` / `theme.zh-Hans.json`。在端口 3060 上运行 `pnpm run docs:dev`。

<a id="readme-and-the-docs-homepage"></a>
## README 与文档主页

下游项目有时会将 `README.md` 作为 `docs/index.md` 复制到 VitePress 站点中（通过构建脚本或手动同步）。该模式在 GitHub 和文档站点之间共享一个文件，但链接规则不同：

| 链接类型 | 在 GitHub 上工作 | 在 VitePress 上工作 |
|-----------|-----------------|-------------------|
| `docs/guide/foo.md` | 是 | 否 — 使用站点路由或让规范化器在同步期间重写 |
| `./LICENSE`, `examples/demo/` | 是（仓库相对路径） | 否 — 使用 **完整 URL** |
| `/guide/foo` | 否 | 是 |

**同步 README → 索引的建议：** 在 `README.md` 中，对 VitePress 内容树之外的任何内容（`LICENSE`、`examples/`、配置文件、代理上下文文件）以及 `translated-docs/` 下的翻译 README 副本使用 **完整 URL**。对于站内文档链接，使用 `docs/guide/…` 路径（或 `docs/` 下英文文档中的站点路由）；同步脚本或 `rewriteVitepressLinks` 规范化器可以将它们转换为 `/guide/…` 路由。

**本仓库** 将 `README.md` 和 `docs/index.md` 作为 **独立文件** 保留：README 是一个简洁的 GitHub/npm 着陆页；`docs/index.md` 是文档站点的入口点，链接到 `/guide/` 和 `/reference/`。详细指南位于 `docs/` 下 —— 不要在 README 中重复冗长的参考资料。当共享事实发生变化时，请根据各自的受众更新每个文件。

另一个项目中同步 README 的示例链接：

```markdown
[console-app demo](https://github.com/your-org/your-repo/tree/main/examples/console-app/)
[License](https://github.com/your-org/your-repo/blob/main/LICENSE)
[Quick start](/zh-Hans/guide/quick-start)
```

<a id="link-conventions"></a>
## 链接约定

VitePress 从内容根目录提供英文页面，并从 `docs/<locale>/…` 提供区域设置副本，但**页内链接必须使用站点路由**（`/guide/quick-start`、`/reference/configuration`）——而不是像 `docs/guide/quick-start.md` 或 `../guide/quick-start.md` 这样的仓库相对路径。那些 README 风格的路径在 GitHub 中有效，但在 VitePress 中会失效（在开发环境和 GitHub Pages 上出现 404）。

启用内置规范化器，以便 `translate-docs` 自动修复每个翻译文件中的链接：

```json
"docsOutput": {
  "style": "vitepress",
  "docsRoot": "docs",
  "rewriteVitepressLinks": true
}
```

当 `style` 为 `"vitepress"` 时，`rewriteVitepressLinks` 默认为启用状态。

| 在源语言环境中编写 | 规范化器之后（源语言环境根输出） | 规范化器之后（翻译的 `docs/<locale>/` 输出） |
|--------------------------|----------------------------------------|------------------------------------------------------|
| `[JSON](/zh-Hans/guide/json)` | `[JSON](/zh-Hans/guide/json)` | `[JSON](/pt-BR/guide/json)`（语言环境前缀与文件夹匹配） |
| 正文中的 `[Quick start](/zh-Hans/guide/quick-start)` 或 `hero.actions[].link` | 不变（`/guide/quick-start`） | `/pt-BR/guide/quick-start` |
| 区域设置索引上的 `[Home](./README.md)` | `/` | `/pt-BR/` |
| `hero.image.src: /ai-i18n-tools_logo.svg` | 不变 | 不变（共享 `docs/public/` 资源） |
| `[Demo](https://github.com/org/repo/tree/main/examples/console-app/)` | 不变（完整 URL） | 不变（完整 URL） |

`docs/` 下的源区域设置文件保留**区域设置中立的**站点路由 (`/guide/…`)。本示例使用英语作为 `sourceLocale`。任何语言都有效。写入 `docs/<locale>/…` 的文件会自动在内部内容路由上获取区域设置前缀 — 包括**主页布局 frontmatter**（`hero.actions[].link`、`features[].link`、`prev`/`next`）。共享的公共资产（如 `/ai-i18n-tools_logo.svg` 和 `/translation-dashboard.png`）在每个区域设置上都保持无前缀状态。

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

将 `activeMatch` 与 `link` 一起作为前缀，以便导航高亮显示在语言环境路由上工作（`/pt-BR/guide/` 而不是 `/guide/`）。外部 URL 和共享公共资产保持不变。

在 VitePress 项目中将 `ai-i18n-tools` 作为 **devDependency** 添加（参见 `examples/vitepress-docs/package.json`），以便 `config.mts` 可以导入 `prefixVitepressThemeConfigLinks`。ai-i18n-tools 主文档站点直接从 `src/processors/…` 导入，因为它直接使用仓库内的源；独立副本 (degit) 应使用 npm 包。

**编写规则**

- 跨页文档链接：在 `docs/` 下的英文 Markdown 中使用**站点路由** (`/guide/…`, `/reference/…`)，或在编写将同步至其他项目 `docs/index.md` 的 README 时使用 `docs/guide/…` 路径。
- 可运行的演示、`LICENSE` 及其他代码库文件：在 `README.md` 和文档中使用**完整的 GitHub URL**（请参阅 [README 和文档主页](#readme-and-the-docs-homepage)）。
- **请勿**手动编辑 `docs/<locale>/` 中的链接——请通过 `sync` / `translate-docs` 重新生成。

另请参阅 [链接重写](/zh-Hans/guide/images-and-screenshots/link-rewriting)（扁平结构与 VitePress 对比）和 [配置 — `docsOutput`](/zh-Hans/reference/configuration#docsoutput)。
