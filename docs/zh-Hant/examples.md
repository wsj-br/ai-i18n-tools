<a id="examples"></a>
# 範例

GitHub 上 [`examples/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/) 下的可執行專案 — 每個專案都有自己的設定、已提交的地區設定輸出和 README。您無需 API 金鑰即可探索翻譯檔案；重新執行翻譯需要提供者金鑰（[提供者和模型](/zh-Hant/guide/providers-and-models))。

<a id="run-standalone-npx-degit"></a>
## 獨立執行 (`npx degit`)

複製一個範例，而無需複製整個儲存庫。每個範例都宣告 `"ai-i18n-tools": "^1.7.2"` 並從 npm 安裝 CLI：

```bash
npx degit wsj-br/ai-i18n-tools/examples/<name> <name>
cd <name>
pnpm install
```

如果您是改為複製**整個** [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools) 儲存庫，請在儲存庫根目錄執行 `pnpm install` 與 `pnpm run build`，然後執行 `cd examples/<name>`。工作區範例透過 `pnpm exec ai-i18n-tools …` 或其 `pnpm run i18n:*` 腳本使用本地 CLI —— 而非在儲存庫根目錄執行 `npx`（該指令會執行已發布的 npm 套件）。請參閱[安裝 —— 複製的 Monorepo](/zh-Hant/guide/installation#cloned-monorepo)。

<a id="list-of-examples"></a>
## 範例清單

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

| 範例 | 最適合 | 使用 degit 複製 | 執行 |
| --- | --- | --- | --- |
| [**console-app**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app/README.md) | 最小的工作應用程式，包含 `t()` UI 字串 + README 翻譯 | `npx degit wsj-br/ai-i18n-tools/examples/console-app console-app` | `pnpm start` |
| [**nextjs-app**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/README.md) | React / Next.js + 複數 + 儀表板；巢狀 Docusaurus 文件 + 扁平 README + SVG 資源 | `npx degit wsj-br/ai-i18n-tools/examples/nextjs-app nextjs-app` | `pnpm dev` (應用 `:3030`；`cd docs-site && pnpm start` 用於文件 `:3040`) |
| [**docusaurus-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs/README.md) | 僅 Docusaurus 文件網站（`docusaurus` 預設） | `npx degit wsj-br/ai-i18n-tools/examples/docusaurus-docs docusaurus-docs` | `pnpm start` (`:3100`；建置 + 服務，語系選單可運作) |
| [**astro-website**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/README.md) | Astro 登陸頁面：全頁 HTML + `t()` 混合 | `npx degit wsj-br/ai-i18n-tools/examples/astro-website astro-website` | `pnpm dev` |
| [**astro-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs/README.md) | Astro Starlight 文件網站 | `npx degit wsj-br/ai-i18n-tools/examples/astro-docs astro-docs` | `pnpm dev` (`:3050`) |
| [**vitepress-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/README.md) | VitePress 文件網站 + 主題 JSON (`pt-BR`, `zh-Hans`) | `npx degit wsj-br/ai-i18n-tools/examples/vitepress-docs vitepress-docs` | `pnpm run docs:dev` (`:3060`) |
| [**nextra-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs/README.md) | Nextra 4 MDX + `_meta.ts` / 字典 `.ts` 殼層 (`pt-BR`, `zh-Hans`) | `npx degit wsj-br/ai-i18n-tools/examples/nextra-docs nextra-docs` | `pnpm run dev` (`:3070`) |
| [**fumadocs-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/README.md) | Fumadocs 4 MDX + `meta.json` / UI 目錄 (`pt`, `zh`, dot 解析器) | `npx degit wsj-br/ai-i18n-tools/examples/fumadocs-docs fumadocs-docs` | `pnpm run dev` (`:3080`) |
| [**plain-html**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/README.md) | 純 HTML + `data-i18n*` 標記；靜態語系 JSON（儀表板式 UI） | `npx degit wsj-br/ai-i18n-tools/examples/plain-html plain-html` | `pnpm dev` (`:3090`) |
| [**multi-provider**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/multi-provider/README.md) | 選擇或基準測試 LLM 提供者 (`-P` / `--provider`) | `npx degit wsj-br/ai-i18n-tools/examples/multi-provider multi-provider` | `ai-i18n-tools translate-docs -P openai --force` |
| [**test-markdown**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/test-markdown/README.md) | 回歸測試 Markdown / CJK 翻譯 (天城文, MDX) | `npx degit wsj-br/ai-i18n-tools/examples/test-markdown test-markdown` | `pnpm build` |

每個**範例**名稱都連結到其 GitHub README，其中包含完整的設定、命令和專案佈局 — 或者瀏覽[儲存庫中的範例索引](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/README.md)。
