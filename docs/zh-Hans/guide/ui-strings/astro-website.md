<a id="astro-website"></a>
# Astro 网站

对于静态的 Astro 营销或应用站点（纯 Astro，而非 Starlight），请将 [Astro 内置 i18n 路由](https://docs.astro.build/en/guides/internationalization/) 与 ai-i18n-tools 结合使用。另请参阅 [Astro 集成](/zh-Hans/guide/integrations/astro)。

参考实现是 [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/)（另请参阅其 [README](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/README.md)）：英文在 `/`，九个目标语言环境在 `/{locale}/`（`de`、`fr`、`es`、`ar`、`ja`、`ko`、`zh-cn`、`zh-tw`、`pt-br`）。

<a id="hybrid-pipelines"></a>
## 混合管道

大多数团队使用两个管道的**混合**（它们不会冲突）：

| 管道 | 用于 | 命令 | 输出 |
|----------|---------|----------|--------|
| **页面 HTML** | 模板正文中的标题、段落、导航标签、内联数组 | `translate-docs` | 每个区域设置 `src/pages/{locale}/index.astro` |
| **UI 字符串（`t()`）** | Frontmatter 数据、屏幕截图选项卡标签、共享数组 | `extract` → `translate-ui` | `public/locales/{locale}.json`（英语源作为键）|

添加或删除语言时，请保持三个列表对齐：`targetLocales` 在 `ai-i18n-tools.config.json` 中，`i18n.locales` 在 `astro.config.mjs` 中（Astro 使用 **小写** 路由代码，例如 `pt-br`），以及 `ui-languages.json`（通过 `generate-ui-languages`）。扁平捆绑包 **文件名** 使用配置大小写 (`pt-BR.json`)；通过您的清单 `code` 字段将 Astro 的 `pt-br` 路由映射到该文件（请参阅 `examples/astro-website/src/i18n/locale.ts`）。

示例 `package.json` 脚本（来自参考项目）：

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:translate-ui": "ai-i18n-tools translate-ui",
  "i18n:translate": "ai-i18n-tools translate-docs",
  "i18n:locales": "ai-i18n-tools generate-ui-languages",
  "i18n:sync": "ai-i18n-tools sync"
}
```

<a id="ui-strings-ssg"></a>
## UI 字符串 (SSG)

使用 `init -t ui-astro-website` 搭建 UI 提取，然后在您也翻译页面 HTML 时合并到 `docs[]` 块中（请参阅 [解析和替换页面](#astro-website-pages-parse-and-replace)）。在 TypeScript 模块中将副本包装在 `t('…')` 中，并在 `.astro` 前置内容（以及当您更喜欢 UI 字符串而不是重复的区域设置页面时，模板 `{expression}` 块）中：

```bash
ai-i18n-tools init -t ui-astro-website [-P <provider>]
ai-i18n-tools extract
ai-i18n-tools translate-ui
```

将 `sourceLocale` 设置为匹配 `astro.config.mjs` 中的 `i18n.defaultLocale`。将 flat bundles 写入 Astro 在构建时可以导入的目录（模板使用 `public/locales/`）。在**构建时**通过查找英语源字面量作为键来解析 `t('…')`（请参阅 `examples/astro-website/src/i18n/t.ts`；`strings.json` 是提取缓存，而不是运行时 bundle）。除非您添加了在加载后切换语言的客户端 island，否则对于静态站点，您**不需要** `ai-i18n-tools/runtime` 或 i18next。

连接每个调用 `t()` 的页面（英语根页面和每个 `src/pages/{locale}/` 副本）：

```astro
import { loadFlatBundle, makeT } from '../i18n/t';        // or ../../i18n/t in locale subfolders
import { resolvePageLocale, useTranslations } from '../i18n/utils';

const locale = resolvePageLocale(Astro.currentLocale);
const flat = await loadFlatBundle(Astro.currentLocale);
const t = useTranslations(locale, makeT(flat));
```

示例中支持的辅助函数：`src/i18n/utils.ts`、`src/i18n/locale.ts` 和 `ui-languages.json` 用于标签、方向和 BCP-47 代码。在更改 `targetLocales` 后运行 `generate-ui-languages`（可选择设置 `languagesManifestPath` 以便清单文件与辅助函数放在一起，例如 `src/i18n/ui-languages.json`）。`MainLayout.astro` 从 `resolveUiLanguage(Astro.currentLocale)` 设置 `<html lang>` 和 `<html dir>`；`LanguagePicker.astro` 使用来自 `astro:i18n` 的 `getRelativeLocaleUrl`。

<a id="pages-parse-and-replace"></a>
## 页面（解析和替换）

对于在 `.astro` 文件中具有硬编码 HTML 的营销页面，让 `translate-docs` 提取文本节点和属性（`alt`、`title`、`aria-label`、`placeholder`），使用文档缓存翻译它们，并在您的页面树下写入特定语言的副本。对于大多数可见文本，您**不需要** `t()`。

结构属性和键值默认**不**翻译：内置保护涵盖 JSX/HTML 属性，例如 `class`、`id`、`style`、`src`、`href`、`data-*` 和大多数 `aria-*`，以及模板 `{expression}` 块内的对象键，例如 `class`、`key` 和 `id`。当您使用自定义属性（例如 Tailwind `variant` 或 CMS `slug` 字段）时，使用 `docs[].protectAttributes` 和 `docs[].protectKeys` 扩展这些列表。相同的选项适用于 Markdown 翻译期间的 MDX JSX（请参阅 [protectAttributes / protectKeys](/zh-Hans/reference/configuration#protectattributes-protectkeys)）。

启用 `features.translateDocs` 并添加一个 `docs[]` 块，例如：

```json
{
  "features": { "translateDocs": true },
  "docs": [{
    "contentPaths": ["src/pages/index.astro"],
    "outputDir": "src/pages",
    "docsOutput": {
      "style": "astro-starlight",
      "docsRoot": "src/pages"
    },
    "addFrontmatter": false
  }]
}
```

运行 `ai-i18n-tools translate-docs`（或在 [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) 中运行 `pnpm i18n:translate`）。英文源文件保留在 `src/pages/index.astro`；每个目标区域设置会获得 `src/pages/{locale}/index.astro`，其中的导入已针对多出的目录层级进行调整（例如 `../layouts/` → `../../layouts/`）。

在 **模板主体** 内，当 `{expression}` 块（内联数组、对象 `title`/`desc` 字段）中的字符串字面量面向用户时，它们会被翻译；受保护属性/键上的带引号值、`t('…')`、`<script>` 和 `<style>` 内的字面量保持不变。**前置内容 TypeScript 不会通过此路径翻译**——保持共享前置内容（包括 `t()` 导入和数据数组）在英文和区域设置页面上相同，或者在编辑英文页面后重新运行 `translate-docs`，以便区域设置副本获取前置内容更改。对于仅前置内容的副本，请改用 [UI 字符串管道](#astro-website-ui-strings-ssg)。

请参阅 [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) 以获取完整的混合着陆页（HTML 通过 `translate-docs`，屏幕截图选项卡标签通过 `t()` + `translate-ui`）。
