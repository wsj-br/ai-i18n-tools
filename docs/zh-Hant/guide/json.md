<a id="json"></a>
# JSON

專為將 UI 內容儲存在每個地區設定的**巢狀 JSON 檔案**（例如 `src/i18n/en/translation.json`）中，而非原始碼中的 `t("…")` 的專案所設計。CLI 會遍歷這些檔案中的字串值，透過作用中的 LLM 提供者翻譯它們，並使用 `json[].outputPathTemplate` 寫入每個地區設定的輸出。它使用與 `translate-docs` 和 `translate-svg` 相同的 SQLite 快取 (`cacheDir`)。

這個管道不**運行** — 沒有`extract` — 因為沒有 `strings.json` 目錄。使用 `features.translateJson` 並在頂級 `json[]` 中加入一個或多個項目來啟用它。

<a id="step-1-initialise-for-nested-json"></a>
### 步驟 1：初始化巢狀 JSON

```bash
npx ai-i18n-tools init -t ui-json-bundles
```

該範本會設定 `features.translateJson: true`，停用 UI 提取和文件翻譯，並建立一個指向 `src/i18n/en/translation.json` 的單一 `json[]` 區塊，輸出為 `src/i18n/{llocale}/translation.json`。請編輯 `sourceLocale`、`targetLocales`、`contentPaths` 和 `outputPathTemplate` 以符合您的儲存庫佈局。

<a id="step-2-configure-json"></a>
### 步驟 2：設定 `json[]`

每個 `json[]` 區塊描述一個管道：

- `contentPaths` — 一或多個 `.json` 檔案、目錄或萬用字元模式（例如 `"src/i18n/en/translation.json"` 或 `"src/i18n/en/overrides/*.json"`）。路徑會從專案根目錄解析。
- `outputPathTemplate` — 必要。每個目標地區設定檔案的寫入位置。預留位置：`{locale}`、`{LOCALE}`、`{llocale}`（小寫地區設定，適用於 Astro 路由資料夾）、`{stem}`、`{basename}`、`{extension}`、`{relativeToSourceRoot}`。
- `targetLocales`（選用）— 僅適用於此區塊的子集；否則會套用根目錄的 `targetLocales`。
- `keyPolicy` — 哪些 JSON 鍵包含可翻譯的文字與穩定的識別符（請參閱下方）。
- `description`（選用）— 顯示在 CLI 標頭和 `status` 輸出中。

範例（多個來源檔案，小寫地區設定資料夾）：

```json
{
  "sourceLocale": "en",
  "targetLocales": ["de", "fr", "pt-BR"],
  "features": {
    "translateJson": true
  },
  "cacheDir": ".translation-cache",
  "json": [
    {
      "description": "App UI bundle",
      "contentPaths": [
        "src/i18n/en/translation.json",
        "src/i18n/en/overrides/*.json"
      ],
      "outputPathTemplate": "src/i18n/{llocale}/{basename}",
      "keyPolicy": {
        "mode": "denylist",
        "skipKeys": ["id", "slug", "href", "url", "key", "code"],
        "translateKeys": []
      }
    }
  ]
}
```

**`keyPolicy`**

| `mode`      | 行為 |
|-------------|-----------|
| `allowlist` | 僅翻譯符合 `translateKeys`（點狀路徑；minimatch 萬用字元模式）的鍵。 |
| `denylist`  | 翻譯所有字串值，但排除符合 `skipKeys` 的鍵。 |
| `both`      | 先套用 `translateKeys`，然後從 `skipKeys` 中移除符合的項目。 |

路徑使用點狀表示法（`nav.home.label`）。像 `slug` 這樣的裸名稱會符合任何深度的最終鍵段。

<a id="step-3-translate-json-bundles"></a>
### 步驟 3：翻譯 JSON 套件

```bash
npx ai-i18n-tools translate-json
```

選用旗標（與 `translate-docs` 的概念相同）：`-l` / `--locale` 用於目標子集，`-p` / `--path` 用於限制檔案，`--dry-run`、`--force`（清除檔案追蹤和符合檔案的區段快取），`--force-update`（當檔案雜湊匹配時重新處理；區段快取仍然適用），`-b` / `--batch-concurrency`，`--prompt-format`（`xml` \| `json-array` \| `json-object`）。

僅限 JSON 的專案可以執行：

```bash
npx ai-i18n-tools sync --no-ui --no-svg --no-docs
```

當同時啟用 UI 或文件時，`sync` 會在 translate-docs 後執行 **translate-json**（除非 `--no-json`）。使用 `--no-json` 跳過 JSON。

檢查每個檔案和地區設定檔的涵蓋範圍：

```bash
npx ai-i18n-tools status
```

當 `translateJson` 啟用時，`status` 會列印一個 `json[]` 區塊（✓ 最新的，● 過期或遺失）。

<a id="json-vs-other-pipelines"></a>
### JSON 與其他管線

| 情況 | 用途 |
|-----------|-----|
| JS/TS/Astro 中的 UI 字串位於 `t("…")` / `i18n.t("…")` | [UI 字串](/guide/ui-strings/) — `extract` + `translate-ui` |
| Docusaurus `write-translations` 目錄 (`{ "key": { "message": "…", "description": "…" } }`) | 文件 — `docs[].docusaurusCatalogDir` + `translate-docs`，**不是** `json[]` |
| VitePress 主題/導覽/側邊欄 JSON (您編寫的巢狀目錄) | JSON — `json[]` + `translate-json`；頁面主體保留在文件中 — 請參閱 [VitePress 整合](/guide/vitepress-integration) |
| 獨立的巢狀地區設定 JSON (ZenBrowser 樣式 `translation.json` 樹) | JSON — `json[]` + `translate-json` |
| 附有 `<text>` / `<title>` / `<desc>` 的圖解 `.svg` 檔案 | `features.translateSVG` + [`svg`](/reference/configuration#svg) + `translate-svg` (選用；非三個主要管道之一) |

欄位參考：[設定參考](/reference/configuration#json) 中的 [`json`](#json)。用於清理的快取鍵在 `file_tracking` 中使用 `json-block:{blockIndex}:{projectRelPath}`。
