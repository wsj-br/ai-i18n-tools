<a id="vitepress-integration"></a>
# VitePress 整合

將 `init -t ui-vitepress` 和 `docsOutput.style: "vitepress"` 用於 [VitePress](https://vitepress.dev/) 文件網站。此預設是 `doc-system` 的別名，具有空的 `localeSubpath` 並保留 BCP-47 語言環境資料夾名稱（`localePathLowercase` 預設為 `false`，因此資料夾保持為 `pt-BR`、`zh-Hans` 等）。

另請參閱[文件](/guide/documents/)、[JSON](/guide/json)（主題字串）以及可執行的[examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/)示範。此儲存庫本身的`docs/`下的文件網站是完整的VitePress + ai-i18n-tools參考（九種語言環境、主題JSON、GitHub Pages）。

<a id="quick-start"></a>
## 快速入門

```bash
npx ai-i18n-tools init -t ui-vitepress
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm run docs:build  # VitePress build (project-specific script)
```

當您在一次 `sync` 執行中翻譯頁面內容和 VitePress 介面字串時，請同時啟用 `features.translateDocs` 和 `features.translateJson`。

<a id="page-layout"></a>
## 頁面佈局

英文 Markdown 位於 VitePress 內容根目錄（通常是 `docs/`）。翻譯後的副本寫在原始碼樹旁：

```text
docs/index.md           →  docs/de/index.md
docs/guide/quick-start.md  →  docs/de/guide/quick-start.md
```

配置一個 `docs[]` 區塊：

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

將 `contentPaths` 指向您的英文 `.md` 檔案和目錄。將 `docsRoot` 設定為 VitePress 用作其內容根目錄的相同資料夾。

連接 VitePress [國際化](https://vitepress.dev/guide/i18n)：英文在 `root`，每個目標語言環境在 `locales[code].link` 下（例如 `/pt-BR/`）。保持 `ai-i18n-tools.config.json` 中的 `targetLocales` 與 `.vitepress/config.mts` 中的 `locales` 鍵對齊。

<a id="theme-strings"></a>
## 主題字串

VitePress 的導航、側邊欄、頁尾、搜尋框預留位置和其他 `themeConfig` 標籤不會從 markdown 中提取。請建立一個巢狀 JSON 目錄（例如 `docs/.vitepress/i18n/theme.en.json`），然後使用 JSON 進行翻譯：

```json
{
  "features": {
    "translateJson": true
  },
  "json": [
    {
      "description": "VitePress theme/nav/sidebar strings",
      "contentPaths": "docs/.vitepress/i18n/theme.en.json",
      "outputPathTemplate": "docs/.vitepress/i18n/theme.{locale}.json"
    }
  ]
}
```

在 `.vitepress/config.mts` 中載入每個語言環境檔案，並從翻譯後的 JSON（導航文字、側邊欄組標題、頁腳訊息等）建構 `locales[code].themeConfig`。不要在 `config.mts` 中硬編碼翻譯後的標籤 — 當英文變更時，使用 `sync` / `translate-json` 重新生成它們。

此套件在[docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/.vitepress/config.mts)中載入`theme.{locale}.json`；與[examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/)比較，以了解最小的雙語言環境設定。

<a id="docusaurus-vs-vitepress-shell-json"></a>
## Docusaurus 與 VitePress Shell JSON

| 框架 | Shell / 主題字串 | 管道 |
|-----------|----------------------|----------|
| Docusaurus | `write-translations` 目錄 (`{ message, description }`) | 文件 — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | 您編寫的自訂巢狀 JSON 目錄 | JSON — `json[]` + `translate-json` (或當 `translateJson` 開啟時為 `sync`) |

請勿將 VitePress 主題 JSON 放入 `docs[]`；請改用 `json[]`。

<a id="example-project"></a>
## 範例專案

[examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) — 英文來源位於`docs/`，已提交`pt-BR`和`zh-Hans`頁面樹，以及`theme.pt-BR.json` / `theme.zh-Hans.json`。在連接埠3060上執行`pnpm run docs:dev`。

<a id="readme-as-homepage"></a>
## README 作為文件首頁

有些專案將`README.md`複製到VitePress網站作為`docs/index.md`（此儲存庫在`docs:build`之前使用`scripts/sync-readme-to-docs.mjs`）。該模式在GitHub和文件網站之間共用一個檔案，但連結規則不同：

| 連結類型 | 在 GitHub 上有效 | 在 VitePress 上有效 |
|-----------|-----------------|-------------------|
| `docs/guide/foo.md` | 是 | 否 — 使用網站路由或讓正規化器在同步期間重寫 |
| `./LICENSE`、`examples/demo/` | 是（相對於儲存庫） | 否 — 使用**完整 URL** |
| `/guide/foo` | 否 | 是 |

**建議：** 在`README.md`中，對於VitePress內容樹之外的任何內容（`LICENSE`、`examples/`、設定檔、代理程式上下文檔）以及`translated-docs/`下的翻譯README副本，請使用**完整 URL**。對於站內文件連結，請使用`docs/guide/…`路徑（或`docs/`下的英文文件中的網站路由）；同步腳本和`rewriteVitepressLinks`正規化器會將這些轉換為`/guide/…`路由。

範例：

```markdown
[console-app demo](https://github.com/your-org/your-repo/tree/main/examples/console-app/)
[License](https://github.com/your-org/your-repo/blob/main/LICENSE)
[Quick start](/guide/quick-start)
```

<a id="link-conventions"></a>
## 連結慣例

VitePress 從內容根目錄提供英文頁面，並從 `docs/<locale>/…` 提供本地化副本，但**頁內連結必須使用網站路由**（`/guide/quick-start`、`/reference/configuration`），而不是像 `docs/guide/quick-start.md` 或 `../guide/quick-start.md` 這樣的儲存庫相對路徑。這些 README 樣式的路徑在 GitHub 中有效，但在 VitePress 內部會中斷（在開發環境和 GitHub Pages 上顯示 404 錯誤）。

啟用內建的正規化器，讓 `translate-docs` 自動修復每個翻譯檔案中的連結：

```json
"docsOutput": {
  "style": "vitepress",
  "docsRoot": "docs",
  "rewriteVitepressLinks": true
}
```

當`style`為`"vitepress"`時，`rewriteVitepressLinks`預設為啟用。

| 英文來源中的作者 | 正規化器處理後 |
|--------------------------|------------------|
| `[JSON](/guide/json)` | `[JSON](/guide/json)` |
| 區域設定索引上的 `[Home](./README.md)` | `/` |
| `[Demo](https://github.com/org/repo/tree/main/examples/console-app/)` | 未更改（完整 URL） |

**撰寫規則**

- 跨頁面文件連結：在`docs/`下的英文 Markdown 中使用**網站路由**（`/guide/…`、`/reference/…`），或從`README.md`同步時使用`docs/guide/…`路徑。
- 可執行的示範、`LICENSE`和其他儲存庫檔案：在`README.md`和文件中使用**完整的 GitHub URL**（請參閱[README 作為文件首頁](#readme-as-homepage))。
- **請勿**手動編輯`docs/<locale>/`中的連結 — 請使用`sync` / `translate-docs`重新產生。

另請參閱 [連結重寫](/guide/images-and-screenshots/link-rewriting)（扁平與 VitePress）和 [組態 — `docsOutput`](/reference/configuration#docsoutput)。
