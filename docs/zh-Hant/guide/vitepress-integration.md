<a id="vitepress-integration"></a>
# VitePress 整合

將 `init -t ui-vitepress` 和 `docsOutput.style: "vitepress"` 用於 [VitePress](https://vitepress.dev/) 文件網站。此預設是 `doc-system` 的別名，具有空的 `localeSubpath` 並保留 BCP-47 語言環境資料夾名稱（`localePathLowercase` 預設為 `false`，因此資料夾保持為 `pt-BR`、`zh-Hans` 等）。

另見[文件](/guide/documents/)與可執行的 [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) 示範。本儲存庫自身的文件網站位於 `docs/` 之下，是一個完整的 VitePress + ai-i18n-tools 參考實作（九種語言、主題目錄、GitHub Pages）。

<a id="quick-start"></a>
## 快速入門

```bash
npx ai-i18n-tools init -t ui-vitepress
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm run docs:build  # VitePress build (project-specific script)
```

當您要在一次 `sync` 執行中同時翻譯頁面內容與 VitePress 介面字串時，請啟用 `features.translateDocs`。

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

VitePress 的導覽列、側邊、側邊欄、頁尾、搜尋預留位置及其他 `themeConfig` 標籤不會從 markdown 中提取。請設定 **`docsOutput.vitepressThemeCatalog`**，讓 **`translate-docs`** 從 `.vitepress/config.mts` 啟動英文目錄（當字串為內嵌時），並翻譯各語言的主題 JSON 檔案：

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

- **`catalogPath`** — 產生的英文巢狀 JSON（啟動輸出）。當英文內容存在於 `config.mts` 時，作者不需手動維護此檔案；重新執行 `sync` 即可重新整理。
- **`outputPathTemplate`**（可選）— 各語言各語言輸出；預設：與 `catalogPath` 相同的目錄，並帶有 `theme.{locale}.json`。

透過 `loadTheme()` 在 `.vitepress/config.mts` 中載入各語言檔案，並從翻譯後的 JSON 建置 `locales[code].themeConfig`。請參閱 [examples/vitepress-docs/docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts)。

**請勿**使用 `json[]` 來處理 VitePress 主題字串 — 該模式僅適用於無關的應用程式語言套件。

<a id="wire-config-mts-to-generated-theme-json"></a>
## 將 config.mts 連接至產生的主題 JSON（一次性設定）

在首次以 `vitepressThemeCatalog` 成功執行 `i18n:sync` / `translate-docs` 後，儲存庫已產生 `theme.en.json` 與 `theme.{locale}.json`，但**現有**的網站可能仍在 `config.mts` 中保留硬編碼的 `text:` / `message:` 字串。在設定檔透過 `loadTheme()` 載入翻譯 JSON 之前，VitePress 不會使用該翻譯 JSON。

**不在工具範圍內：** 自動程式碼重構。每個專案使用以下提示一次（或參照範例設定檔手動重構）。

1. **時機** — 在首次同步產生 `catalogPath` 與各語言主題檔案之後；在預期開發/建置時看到翻譯後的導覽列/側邊欄之前。
2. **保持不變** — 路由連結（`/guide/…`）、語言鍵、`defineConfig` 結構、非字串選項（搜尋提供者、摺疊旗標）。
3. **參考** — [examples/vitepress-docs/docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts) 與產生的 `theme.en.json` 結構。
4. **驗證** — `pnpm docs:dev`，在導覽列切換語言，確認側邊欄/頁尾/搜尋預留位置已翻譯；`pnpm docs:build` 通過。

**AI 代理程式提示範例**（複製到 Cursor 或其他程式碼代理中）：

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
## 框架外殼翻譯

| 框架 | Shell / 主題字串 | 管道 |
|-----------|----------------------|----------|
| Docusaurus | `write-translations` 目錄 (`{ message, description }`) | 文件 — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | 主題/導航/側邊欄目錄 | 文件——`docsOutput.vitepressThemeCatalog` + `translate-docs` |
| Nextra | `_meta.ts` 側邊欄標籤 | 文件——自動時 `style: "nextra"` + `translate-docs` |
| Nextra | 主題字典 `.ts` | 文件——`docs[].nextraDictionaryPath` + `translate-docs` |
| Fumadocs | `meta.json` 側邊欄標籤 | 文件 — 當 `style: "fumadocs"` + `translate-docs` 時自動處理 |
| Fumadocs | UI 覆寫目錄 | 文件 — `docsOutput.fumadocsUiCatalog` + `translate-docs` |
| Astro Starlight | 內建 UI 字串（多種語系）；無額外外殼管線 | 文件 — `translate-docs`（僅限頁面） |

**不**將框架 shell/主題字串放在 `json[]` ——該管道是為無關的應用程式區域套件而設。請參考 [Docusaurus 整合](/guide/docusaurus-integration) 和 [Nextra 整合](/guide/nextra-integration) 以了解其他框架模式。

<a id="example-project"></a>
## 範例專案

[examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) — 英文來源位於`docs/`，已提交`pt-BR`和`zh-Hans`頁面樹，以及`theme.pt-BR.json` / `theme.zh-Hans.json`。在連接埠3060上執行`pnpm run docs:dev`。

<a id="readme-as-the-docs-homepage"></a>
## 以 README 作為文件首頁

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
