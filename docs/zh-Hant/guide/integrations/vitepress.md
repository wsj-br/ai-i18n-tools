<a id="vitepress-integration"></a>
# VitePress 整合

在 [VitePress](https://vitepress.dev/) 文文件網站中使用 `init -t ui-vitepress` 與 `docsOutput.style: "vitepress"`。此預設為 `doc-system` 的別名，帶有空白的 `localeSubpath` 並保留 BCP-47 語系資料夾名稱（`localePathLowercase` 預設為 `false`，因此資料夾保持為 `pt-BR`、`zh-Hans` 等）。

另請參閱 [Documents](/zh-Hant/guide/documents/) 與可執行的 [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) 示範。本儲存庫自身在 `docs/` 下的文件網站是一個完整的 VitePress + ai-i18n-tools 參考（九種語系、主題目錄、GitHub Pages）。

<a id="quick-start"></a>
## 快速開始

```bash
ai-i18n-tools init -t ui-vitepress [-P <provider>]
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm run docs:build  # VitePress build (project-specific script)
```

當您要在一次 `sync` 執行中同時翻譯頁面內容與 VitePress chrome 字串時，請啟用 `features.translateDocs`。

<a id="page-layout"></a>
## 頁面版面

英文 Markdown 位於 VitePress 內容根目錄（通常為 `docs/`）。翻譯副本會寫入來源樹旁：

```text
docs/index.md           →  docs/de/index.md
docs/guide/quick-start.md  →  docs/de/guide/quick-start.md
```

設定一個 `docs[]` 區塊：

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

將 `contentPaths` 指向您的英文 `.md` 檔案與目錄。將 `docsRoot` 設為 VitePress 用作內容根目錄的同一個資料夾。

設定 VitePress [國際化](https://vitepress.dev/guide/i18n)：英文位於 `root`，各目標語系位於 `locales[code].link` 之下（例如 `/pt-BR/`）。保持 `ai-i18n-tools.config.json` 中的 `targetLocales` 與 `.vitepress/config.mts` 中的 `locales` 鍵一致。

<a id="theme-strings"></a>
## 主題字串

VitePress 導覽列、側邊欄、頁尾、搜尋預留位置及其他 `themeConfig` 標籤不會從 Markdown 中擷取。設定 **`docsOutput.vitepressThemeCatalog`**，讓 **`translate-docs`** 從 `.vitepress/config.mts` 啟動英文目錄（當字串為內嵌時），並翻譯各語系的主題 JSON 檔案：

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

- **`catalogPath`** — 產生的英文巢狀 JSON（啟動輸出）。當英文存在於 `config.mts` 時，作者不需手動維護此檔案；重新執行 `sync` 即可重新整理。
- **`outputPathTemplate`**（可選）— 各語系輸出；預設：與 `catalogPath` 相同的目錄，帶有 `theme.{locale}.json`。

`init -t ui-vitepress` 也會在這些檔案尚不存在時建立初始 `docs/.vitepress/config.mts` 與 `docs/.vitepress/i18n/theme.en.json`。設定檔透過 `loadTheme()` 載入目錄，並在 `themeConfigFor()` 中設定標準 VitePress i18n 標籤（包含 `langMenuLabel`）。

在 `.vitepress/config.mts` 中透過 `loadTheme()` 載入各語系檔案，並從翻譯後的 JSON 建構 `locales[code].themeConfig`。請參閱 [examples/vitepress-docs/docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts)。

**語言選單字串：** `locales[code].label` 是下拉選單中每種語言的顯示名稱（例如 `Português (Brasil)`）。`themeConfig.langMenuLabel` 是語言切換按鈕上的 **aria-label**（VitePress 預設：`Change language`）。將 `langMenuLabel` 放入主題目錄，並在 `themeConfigFor()` 內設定 `langMenuLabel: t.langMenuLabel` — 不要將其與各語系的 `label` 字串混淆。

在 `sync` / `translate-docs` 期間，當 `theme.en.json` 中的目錄鍵未從 `config.mts` 被參照時（例如 `themeConfigFor()` 中缺少 `t.langMenuLabel`），ai-i18n-tools 會發出警告。

**請勿**將 `json[]` 用於 VitePress 主題字串 — 該模式僅適用於不相關的應用程式語系套件。

<a id="wire-configmts-to-generated-theme-json-one-off"></a>
## 將 config.mts 連接至產生的主題 JSON（一次性）

在使用 `vitepressThemeCatalog` 首次成功執行 `i18n:sync` / `translate-docs` 後，儲存庫已產生 `theme.en.json` 與 `theme.{locale}.json`，但**現有**網站可能仍在 `config.mts` 中保留硬編碼的 `text:` / `message:` 字串。在設定檔透過 `loadTheme()` 載入翻譯 JSON 之前，VitePress 不會使用該 JSON。

**不在工具範圍內：** 自動 codemod。請在每個專案中使用以下提示一次（或手動使用範例設定檔進行重構）。

1. **時機** — 在首次同步產生 `catalogPath` 與語系主題檔案之後；在期望開發/建置時出現翻譯導覽/側邊欄之前。
2. **保持不變** — 路由連結（`/guide/…`）、語系鍵、`defineConfig` 結構、非字串選項（搜尋供應商、摺疊旗標）。
3. **參考** — [examples/vitepress-docs/docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts) 與產生的 `theme.en.json` 結構。
4. **驗證** — `pnpm docs:dev`，在導覽列切換語系，確認側邊欄/頁尾/搜尋預留位置已翻譯；`pnpm docs:build` 通過。

**範例 AI 代理提示**（複製到 Cursor 或其他程式碼代理）：

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

<a id="example-project"></a>
## 範例專案

[examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) — 英文來源位於 `docs/`，已提交 `pt-BR` 與 `zh-Hans` 頁面樹，加上 `theme.pt-BR.json` / `theme.zh-Hans.json`。在連接埠 3060 執行 `pnpm run docs:dev`。

<a id="readme-and-the-docs-homepage"></a>
## README 與文件首頁

下游專案有時會透過建置腳本或手動同步，將 `README.md` 複製到 VitePress 網站作為 `docs/index.md`。此模式在 GitHub 與文件網站之間共用同一個檔案，但連結規則不同：

| 連結類型 | 在 GitHub 上可用 | 在 VitePress 上可用 |
|-----------|-----------------|-------------------|
| `docs/guide/foo.md` | 是 | 否 — 請使用網站路由或讓正規化器在同步時改寫 |
| `./LICENSE`, `examples/demo/` | 是（相對於儲存庫） | 否 — 請使用**完整網址** |
| `/guide/foo` | 否 | 是 |

**同步 README → index 的建議：** 在 `README.md` 中，對 VitePress 內容樹之外的任何項目（`LICENSE`、`examples/`、設定檔、代理上下文檔案）以及 `translated-docs/` 下的翻譯 README 副本，請使用**完整網址**。對站內文件連結，請使用 `docs/guide/…` 路徑（或英文文件中 `docs/` 下的網站路由）；同步腳本或 `rewriteVitepressLinks` 正規化器可將其轉換為 `/guide/…` 路由。

**此儲存庫**將 `README.md` 與 `docs/index.md` 保留為**獨立檔案**：README 是簡潔的 GitHub/npm 到達頁面；`docs/index.md` 是文件網站的入口點，連結至 `/guide/` 與 `/reference/`。詳細指南位於 `docs/` 之下 — 請勿在 README 中重複冗長的參考資料。當共同事實變更時，請根據其受眾更新各個檔案。

另一個專案中已同步 README 的範例連結：

```markdown
[console-app demo](https://github.com/your-org/your-repo/tree/main/examples/console-app/)
[License](https://github.com/your-org/your-repo/blob/main/LICENSE)
[Quick start](/zh-Hant/guide/quick-start)
```

<a id="link-conventions"></a>
## 連結慣例

VitePress 從內容根目錄提供英文頁面，並從 `docs/<locale>/…` 提供各語系副本，但**頁面內連結必須使用站點路由**（`/guide/quick-start`、`/reference/configuration`）— 而非如 `docs/guide/quick-start.md` 或 `../guide/quick-start.md` 的存放庫相對路徑。這些 README 風格的路徑在 GitHub 中可用，但在 VitePress 內會失效（在開發環境與 GitHub Pages 上出現 404）。

啟用內建正規化器，讓 `translate-docs` 自動修正每個翻譯檔案中的連結：

```json
"docsOutput": {
  "style": "vitepress",
  "docsRoot": "docs",
  "rewriteVitepressLinks": true
}
```

當 `style` 為 `"vitepress"` 時，`rewriteVitepressLinks` 預設為啟用。

| 英文來源中的作者 | 經過標準化器後（英文根輸出） | 經過標準化器後（翻譯後的 `docs/<locale>/` 輸出） |
|--------------------------|----------------------------------------|------------------------------------------------------|
| `[JSON](/zh-Hant/guide/json)` | `[JSON](/zh-Hant/guide/json)` | `[JSON](/pt-BR/guide/json)`（地區前綴與資料夾相符） |
| 內文中的 `[Quick start](/zh-Hant/guide/quick-start)` 或 `hero.actions[].link` | 不變（`/guide/quick-start`） | `/pt-BR/guide/quick-start` |
| 地區索引上的 `[Home](./README.md)` | `/` | `/pt-BR/` |
| `hero.image.src: /ai-i18n-tools_logo.svg` | 不變 | 不變（共享 `docs/public/` 資源） |
| `[Demo](https://github.com/org/repo/tree/main/examples/console-app/)` | 不變（完整 URL） | 不變（完整 URL） |

`docs/` 下的英文根來源保留 **地區設定中性** 的網站路由（`/guide/…`）。寫入至 `docs/<locale>/…` 的檔案會在內部內容路由上自動取得地區設定前綴 — 包括 **首頁版面配置 frontmatter**（`hero.actions[].link`、`features[].link`、`prev`/`next`）。如 `/ai-i18n-tools_logo.svg` 與 `/translation-dashboard.png` 等共享公開資源在每個地區設定上保持無前綴。

<a id="theme-navsidebar-links"></a>
### 主題導覽/側邊欄連結

`translate-docs` **不會** 重寫 `.vitepress/config.mts` 中的連結。導覽列與側邊欄的 `link` 值在 TypeScript 中只需編寫一次，並且必須在設定建置時根據各語系加上前綴。

VitePress [`themeConfig.i18nRouting`](https://vitepress.dev/reference/default-theme-config#i18nrouting) 僅控制 **語系切換器**（在使用者選擇其他語言時對應到相同的頁面）。它 **不會** 重寫目前語系頁面上的靜態 `nav` / `sidebar` href。

使用來自 `ai-i18n-tools` 的 `prefixVitepressThemeConfigLinks`（前綴規則與 markdown 連結重寫相同）：

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

在 **`link`** 旁加上 **`activeMatch`** 前綴，以便導覽列高亮能在語系路由上運作（是 `/pt-BR/guide/` 而非 `/guide/`）。外部 URL 與共享的公開資源保持不變。

在 VitePress 專案中將 `ai-i18n-tools` 新增為 **devDependency**（請參閱 `examples/vitepress-docs/package.json`），以便 `config.mts` 可以匯入 `prefixVitepressThemeConfigLinks`。主要的 ai-i18n-tools 文件網站直接從 `src/processors/…` 匯入，因為它使用 monorepo checkout 進行 dogfooding；獨立副本（degit）應使用 npm 套件。

**撰寫規則**

- 跨頁文件連結：在 `docs/` 下的英文 Markdown 中使用**站點路由**（`/guide/…`、`/reference/…`），或在撰寫將同步至另一個專案 `docs/index.md` 的 README 時使用 `docs/guide/…` 路徑。
- 可執行的範例、`LICENSE` 及其他存放庫檔案：在 `README.md` 與文件中使用**完整 GitHub URL**（參見 [README 與文件首頁](#readme-as-the-docs-homepage)）。
- **不要**手動編輯 `docs/<locale>/` 中的連結 — 請用 `sync` / `translate-docs` 重新產生。

另見[連結重寫](/zh-Hant/guide/images-and-screenshots/link-rewriting)（扁平 vs VitePress）與[設定 — `docsOutput`](/zh-Hant/reference/configuration#docsoutput)。
