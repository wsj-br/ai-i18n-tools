<a id="examples"></a>
# 範例

GitHub 上 [`examples/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/) 下的可執行專案 — 每個專案都有自己的設定、已提交的地區設定輸出和 README。您無需 API 金鑰即可探索翻譯檔案；重新執行翻譯需要提供者金鑰（[提供者和模型](/zh-Hant/guide/providers-and-models))。

<a id="run-standalone-npx-degit"></a>
## 獨立執行 (`npx degit`)

在不複製完整儲存庫的情況下複製一個範例。

<a id="node-examples"></a>
### Node.js 範例

每個 Node.js 範例都會宣告一個與當前套件版本相符的已發布插入符號範圍 `ai-i18n-tools`，並從 npm 安裝 CLI：

```bash
npx degit wsj-br/ai-i18n-tools/examples/<name> <name>
cd <name>
pnpm install
```

<a id="python-examples"></a>
### Python 範例

`python-streamlit`、`python-flask`、`python-fastapi` 和 `python-gettext` 沒有 `package.json`。下表中的 `degit` 指令均有效。您也可以從 [GitHub Release](https://github.com/wsj-br/ai-i18n-tools/releases) 下載 `ai-i18n-tools-python-examples.zip`。該 zip 檔案包含相同的四個目錄。它不屬於 npm 套件的一部分，也不在獨立執行檔內。

`python-streamlit`、`python-flask` 和 `python-fastapi` 使用 virtualenv 和 `pip install -r requirements.txt`。`python-gettext` 僅使用標準函式庫。請使用 [獨立執行檔](/zh-Hant/guide/installation#standalone-executables) 進行翻譯。

```bash
npx degit wsj-br/ai-i18n-tools/examples/python-streamlit python-streamlit
cd python-streamlit
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

在 Windows 上，請啟用 `.venv\Scripts\activate`。

如果您改為複製了 **整個** [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools) 儲存庫，請在儲存庫根目錄執行 `pnpm install` 和 `pnpm run build`，然後執行 `cd examples/<name>`。工作區 (Node.js) 範例透過其 `pnpm run i18n:*` 指令碼使用本機 CLI，或在 [PATH 設定](/zh-Hant/guide/installation#using-the-cli) 後直接使用 `ai-i18n-tools …`。該檢出中的 Python 範例在建置後使用 `node ../../bin/ai-i18n-tools.mjs` 進行翻譯。請參閱 [安裝 — 複製的 monorepo](/zh-Hant/guide/installation#cloned-monorepo)。

<a id="list-of-examples"></a>
## 範例清單

<a id="console-app"></a>
<a id="nextjs-app"></a>
<a id="astro-website"></a>
<a id="astro-docs"></a>
<a id="vitepress-docs"></a>
<a id="nextra-docs"></a>
<a id="plain-html"></a>
<a id="plain-html-docs"></a>
<a id="fumadocs-docs"></a>
<a id="docusaurus-docs"></a>
<a id="multi-provider"></a>
<a id="intlayer-migration"></a>
<a id="test-markdown"></a>
<a id="python-streamlit"></a>
<a id="python-flask"></a>
<a id="python-fastapi"></a>
<a id="python-gettext"></a>

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
| [**plain-html-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html-docs/README.md) | 純 HTML 文件：每個語言區域一個頁面、在地化圖片、hreflang | `npx degit wsj-br/ai-i18n-tools/examples/plain-html-docs plain-html-docs` | `pnpm dev` (`:3092`) |
| [**multi-provider**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/multi-provider/README.md) | 選擇或基準測試 LLM 提供者 (`-P` / `--provider`) | `npx degit wsj-br/ai-i18n-tools/examples/multi-provider multi-provider` | `ai-i18n-tools translate-docs -P openai --force` |
| [**test-markdown**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/test-markdown/README.md) | 回歸測試 Markdown / CJK 翻譯 (天城文, MDX) | `npx degit wsj-br/ai-i18n-tools/examples/test-markdown test-markdown` | `pnpm build` |
| [**intlayer-migration**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/intlayer-migration/README.md) | Intlayer `.content.ts` → `t()` (`migrate-intlayer`, 重置 + AI 代理報告) | `npx degit wsj-br/ai-i18n-tools/examples/intlayer-migration intlayer-migration` | `pnpm reset && pnpm dev` (`:3091`) |
| [**python-streamlit**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-streamlit/README.md) | Streamlit 儀表板，`t()` / `_()`，英文鍵 JSON | `npx degit wsj-br/ai-i18n-tools/examples/python-streamlit python-streamlit` | `python3 -m venv .venv && pip install -r requirements.txt && streamlit run app.py` |
| [**python-flask**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-flask/README.md) | Flask + Jinja，`t()` / `_()`，英文鍵 JSON | `npx degit wsj-br/ai-i18n-tools/examples/python-flask python-flask` | `python3 -m venv .venv && pip install -r requirements.txt && flask --app app run` |
| [**python-fastapi**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-fastapi/README.md) | FastAPI，ContextVar 地區設定，`t()` / `_()`，英文鍵 JSON | `npx degit wsj-br/ai-i18n-tools/examples/python-fastapi python-fastapi` | `python3 -m venv .venv && pip install -r requirements.txt && uvicorn app:app` |
| [**python-gettext**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-gettext/README.md) | 現有的 GNU gettext CLI；`extract` / `translate-ui` 重新整理 `.po` 與 `.mo` | `npx degit wsj-br/ai-i18n-tools/examples/python-gettext python-gettext` | `python3 app.py --lang es` |

每個**範例**名稱都連結到其 GitHub README，其中包含完整的設定、命令和專案佈局 — 或者瀏覽[儲存庫中的範例索引](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/README.md)。

Node.js 範例在 `pnpm install` 之後從 npm 安裝 CLI。四個 Python 範例使用 `venv` 和 `pip`（`python-gettext` 僅使用標準函式庫）以及用於翻譯的 [獨立執行檔](/zh-Hant/guide/installation#standalone-executables) 。

<br/>

::: tip 免責聲明
產品名稱與圖示均屬於其各自的所有者，僅供識別之用。本軟體與上述品牌無任何關聯，亦未獲其背書或認可。
:::
