<a id="examples"></a>
# 示例

GitHub 上 [`examples/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/) 下的可运行项目 — 每个项目都有自己的配置、已提交的区域设置输出和 README。您可以在没有 API 密钥的情况下浏览翻译文件；重新运行翻译需要提供商密钥（[提供商和模型](/zh-Hans/guide/providers-and-models)）。

<a id="run-standalone-npx-degit"></a>
## 独立运行 (`npx degit`)

复制一个示例，无需克隆整个存储库。每个示例都声明 `"ai-i18n-tools": "^1.7.2"` 并从 npm 安装 CLI：

```bash
npx degit wsj-br/ai-i18n-tools/examples/<name> <name>
cd <name>
pnpm install
```

如果你改为克隆了**整个** [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools) 仓库，请在仓库根目录下运行 `pnpm install` 和 `pnpm run build`，然后运行 `cd examples/<name>`。工作区示例通过其 `pnpm run i18n:*` 脚本使用本地 CLI，或者在 [PATH 设置](/zh-Hans/guide/installation#using-the-cli) 之后直接使用 `ai-i18n-tools …`。请参阅 [安装 — 克隆的 monorepo](/zh-Hans/guide/installation#cloned-monorepo)。

<a id="list-of-examples"></a>
## 示例列表

<a id="console-app"></a>
<a id="nextjs-app"></a>
<a id="astro-website"></a>
<a id="astro-docs"></a>
<a id="vitepress-docs"></a>
<a id="nextra-docs"></a>
<a id="plain-html"></a>
<a id="fumadocs-docs"></a>
<a id="docusaurus-docs"></a>
<a id="multi-provider"></a>
<a id="test-markdown"></a>

| 示例 | 最适合 | 使用 degit 复制 | 运行 |
| --- | --- | --- | --- |
| [**console-app**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app/README.md) | 最小的工作应用程序，包含 `t()` UI 字符串 + README 翻译 | `npx degit wsj-br/ai-i18n-tools/examples/console-app console-app` | `pnpm start` |
| [**nextjs-app**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/README.md) | React / Next.js + 复数 + 仪表板；嵌套的 Docusaurus 文档 + 扁平 README + SVG 资源 | `npx degit wsj-br/ai-i18n-tools/examples/nextjs-app nextjs-app` | `pnpm dev`（应用 `:3030`；`cd docs-site && pnpm start` 用于文档 `:3040`） |
| [**docusaurus-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs/README.md) | 仅 Docusaurus 文档站点（`docusaurus` 预设） | `npx degit wsj-br/ai-i18n-tools/examples/docusaurus-docs docusaurus-docs` | `pnpm start`（`:3100`；构建 + 服务，区域设置菜单正常工作） |
| [**astro-website**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/README.md) | Astro 登录页面：全页 HTML + `t()` 混合 | `npx degit wsj-br/ai-i18n-tools/examples/astro-website astro-website` | `pnpm dev` |
| [**astro-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs/README.md) | Astro Starlight 文档站点 | `npx degit wsj-br/ai-i18n-tools/examples/astro-docs astro-docs` | `pnpm dev` (`:3050`) |
| [**vitepress-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/README.md) | VitePress 文档站点 + 主题 JSON (`pt-BR`, `zh-Hans`) | `npx degit wsj-br/ai-i18n-tools/examples/vitepress-docs vitepress-docs` | `pnpm run docs:dev` (`:3060`) |
| [**nextra-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs/README.md) | Nextra 4 MDX + `_meta.ts` / 字典 `.ts` 外壳 (`pt-BR`, `zh-Hans`) | `npx degit wsj-br/ai-i18n-tools/examples/nextra-docs nextra-docs` | `pnpm run dev` (`:3070`) |
| [**fumadocs-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/README.md) | Fumadocs 4 MDX + `meta.json` / UI 目录 (`pt`, `zh`, dot 解析器) | `npx degit wsj-br/ai-i18n-tools/examples/fumadocs-docs fumadocs-docs` | `pnpm run dev` (`:3080`) |
| [**plain-html**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/README.md) | 纯 HTML + `data-i18n*` 标记；静态区域设置 JSON（仪表板式 UI） | `npx degit wsj-br/ai-i18n-tools/examples/plain-html plain-html` | `pnpm dev`（`:3090`） |
| [**multi-provider**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/multi-provider/README.md) | 选择或基准测试 LLM 提供商 (`-P` / `--provider`) | `npx degit wsj-br/ai-i18n-tools/examples/multi-provider multi-provider` | `ai-i18n-tools translate-docs -P openai --force` |
| [**test-markdown**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/test-markdown/README.md) | 回归测试 Markdown / CJK 翻译 (梵文, MDX) | `npx degit wsj-br/ai-i18n-tools/examples/test-markdown test-markdown` | `pnpm build` |

每个 **示例** 名称都链接到其 GitHub README，其中包含完整的设置、命令和项目布局 — 或者浏览[存储库中的示例索引](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/README.md)。
