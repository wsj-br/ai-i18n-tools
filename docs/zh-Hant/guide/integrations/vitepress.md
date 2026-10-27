<a id="vitepress-integration"></a>
# VitePress 整合

在 [VitePress](https://vitepress.dev/) 文文件網站中使用 `init -t ui-vitepress` 與 `docsOutput.style: "vitepress"`。此預設為 `doc-system` 的別名，帶有空白的 `localeSubpath` 並保留 BCP-47 語系資料夾名稱（`localePathLowercase` 預設為 `false`，因此資料夾保持為 `pt-BR`、`zh-Hans` 等）。

另請參閱 [Documents](/zh-Hant/guide/documents/) 與可執行的 [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) 示範。本儲存庫自身在 `docs/` 下的文件網站是一個完整的 VitePress + ai-i18n-tools 參考（九種語系、主題目錄、GitHub Pages）。

<a id="quick-start"></a>
## 快速開始

```bash
ai-i18n-tools init -t ui-vitepress -P anthropic
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

將 `contentPaths` 指向以 `sourceLocale` 編寫的 `.md` 檔案與目錄。該語言可以是任何語言。將 `docsRoot` 設定為 VitePress 用作其內容根目錄的相同資料夾。

設定 VitePress [國際化](https://vitepress.dev/guide/i18n)：來源語系位於 `root`，每個目標語系位於 `locales[code].link` 下方（例如 `/pt-BR/`）。讓 `ai-i18n-tools.config.json` 中的 `targetLocales` 與 `.vitepress/config.mts` 中的 `locales` 鍵保持一致。

<a id="enable-i18n-in-an-existing-site"></a>
### 在現有網站中啟用 i18n

僅限英文的 VitePress 設定需要具備這些部分，翻譯後的頁面才能顯示。[代理提示](#wire-configmts-to-generated-theme-json-one-off) 涵蓋了主題目錄的部分。

- 用於英文的 `locales.root` (`label`、`lang` 和 `themeConfig`)。
- 每個目標語系一個 `locales[code]` 項目：`label`、`lang`、`link: '/${code}/'`，以及每個語系的 `title` / `description`。
- `themeConfig` 連結和 `activeMatch` 每個語系都加上 `prefixVitepressThemeConfigLinks` 前綴（請參閱 [主題導覽列/側邊欄連結](#theme-navsidebar-links))。
- `targetLocales` 與那些 `locales` 鍵對齊，然後 `sync` 以便 `docs/<locale>/` 和 `theme.<locale>.json` 存在。

<a id="theme-strings"></a>
## 主題字串

VitePress 導覽列、側邊欄、頁尾、搜尋預留位置和其他 `themeConfig` 標籤不會從 markdown 中擷取。設定 **`docsOutput.vitepressThemeCatalog`** 以便 **`translate-docs`** 從 `.vitepress/config.mts` 啟動來源語系目錄（當字串為內嵌時）並翻譯語系主題 JSON 檔案：

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

- **`catalogPath`** — 英文巢狀 JSON。來自 `config.mts` 的啟動僅在那些英文字串仍內嵌於設定中時適用。在 `themeConfigFor` 讀取目錄後，`mergeThemeCatalogs` 會保留現有檔案，而 `theme.en.json` 則是真實來源。當措辭變更時請編輯該檔案（或將英文放回 `config.mts` 中進行一次 `sync`）。重新命名鍵會變更區段雜湊值（`path`、一個 NUL 位元組，然後是值），因此下一次 `sync` 會為每個目標語系重新翻譯該字串一次。
- **`outputPathTemplate`** (選用) — 每個語系的輸出；預設：與 `catalogPath` 相同的目錄，附帶 `theme.{locale}.json`。

`init -t ui-vitepress` 也會在這些檔案尚不存在時建立初始 `docs/.vitepress/config.mts` 與 `docs/.vitepress/i18n/theme.en.json`。設定檔透過 `loadTheme()` 載入目錄，並在 `themeConfigFor()` 中設定標準 VitePress i18n 標籤（包含 `langMenuLabel`）。

在 `.vitepress/config.mts` 中透過 `loadTheme()` 載入各語系檔案，並從翻譯後的 JSON 建構 `locales[code].themeConfig`。請參閱 [examples/vitepress-docs/docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts)。

**語言選單字串：** `locales[code].label` 是下拉式選單中每種語言的可見名稱（例如 `Português (Brasil)`）。`themeConfig.langMenuLabel` 是語言切換器按鈕上的 **aria-label**。當省略該選項時，VitePress 會使用 `Change language`。範例目錄改為儲存 `Language`，且 `theme.en.json` 和 `config.hardcoded.example.mts` 都使用相同的句子。將 `langMenuLabel` 放入主題目錄中，並在 `themeConfigFor()` 內設定 `langMenuLabel: t.langMenuLabel` — 請勿將其與每個語系的 `label` 字串混淆。

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

<details class="agent-prompt">
<summary>主題目錄提示</summary>

````markdown
# Load VitePress theme strings from the catalog

## Context

ai-i18n-tools translates VitePress chrome through
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
2. Reshape keys, wire `loadTheme` and `themeConfigFor`, prefix links.
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
  footer, and search chrome.
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

| 在來源語系中編寫 | 經過正規化程式後 (來源語系根目錄輸出) | 經過正規化程式後 (已翻譯的 `docs/<locale>/` 輸出) |
|--------------------------|----------------------------------------|------------------------------------------------------|
| `[JSON](/zh-Hant/guide/json)` | `[JSON](/zh-Hant/guide/json)` | `[JSON](/pt-BR/guide/json)` (語系前綴與資料夾相符) |
| 內文中的 `[Quick start](/zh-Hant/guide/quick-start)` 或 `hero.actions[].link` | 不變（`/guide/quick-start`） | `/pt-BR/guide/quick-start` |
| 地區索引上的 `[Home](./README.md)` | `/` | `/pt-BR/` |
| `hero.image.src: /ai-i18n-tools_logo.svg` | 不變 | 不變（共享 `docs/public/` 資源） |
| `[Demo](https://github.com/org/repo/tree/main/examples/console-app/)` | 不變（完整 URL） | 不變（完整 URL） |

`docs/` 下的來源語系檔案會保留**語系中立的**網站路由 (`/guide/…`)。此範例使用英文作為 `sourceLocale`。任何語言都有效。寫入 `docs/<locale>/…` 的檔案會自動在內部內容路由上取得語系前綴 — 包括**首頁版面配置 frontmatter** (`hero.actions[].link`、`features[].link`、`prev`/`next`)。共用的公用資產 (例如 `/ai-i18n-tools_logo.svg` 和 `/translation-dashboard.png`) 在每個語系中都保持無前綴。

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

- 跨頁文件連結：在 `docs/` 下的英文 Markdown 中使用**網站路由**（`/guide/…`、`/reference/…`），或在撰寫將同步至其他專案中 `docs/index.md` 的 README 時使用 `docs/guide/…` 路徑。
- 可執行範例、`LICENSE` 及其他儲存庫檔案：在 `README.md` 及文件中使用**完整 GitHub URL**（請參閱 [README 與文件首頁](#readme-and-the-docs-homepage)）。
- **請勿**手動編輯 `docs/<locale>/` 中的連結——請使用 `sync` / `translate-docs` 重新產生。

另見[連結重寫](/zh-Hant/guide/images-and-screenshots/link-rewriting)（扁平 vs VitePress）與[設定 — `docsOutput`](/zh-Hant/reference/configuration#docsoutput)。
