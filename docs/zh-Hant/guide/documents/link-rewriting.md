<a id="link-rewriting"></a>
# 連結重寫

`translate-docs` 會重寫翻譯過的 Markdown 中的 URL，以便檔案移至特定語系路徑後，連結仍能解析。大多數跨頁連結都會自動處理；當您的網站使用共用的靜態 URL 樹狀結構或語系編碼的資產資料夾時，請新增 `docsOutput.postProcessing.regexAdjustments` 規則。

<a id="built-in-rewriters"></a>
## 內建重寫器

執行哪個重寫器取決於 `docsOutput.style`：

| 版面配置 | 內建重寫器 | 修正內容 |
| --- | --- | --- |
| `"flat"` (沒有自訂 `pathTemplate` 時的預設值) | 平面連結重寫器 (`rewriteRelativeLinks`，預設啟用) | 跨頁相對連結 (`guide.md` → `guide.de.md`) 和非 Markdown 資產 URL 的深度前綴 |
| `"vitepress"` | VitePress 連結正規化器 (`rewriteVitepressLinks`，預設啟用) | README 樣式 `docs/guide/…` 路徑 → 網站路由 (`/guide/…`) |
| `"nextra"` | Nextra 連結正規化器（`rewriteNextraLinks`，預設開啟） | `content/en/…` 與相對 `.mdx` 路徑 → 語系中性路由（`/guide/…`） |
| `"fumadocs"` | Fumadocs 連結正規化器（`rewriteFumadocsLinks`，預設開啟） | `content/docs/…` 與相對 `.mdx` 路徑 → 語系中性路由（`/docs/…`） |
| `"doc-system"`、`"docusaurus"`、`"astro-starlight"` | 無 | 來源 URL 會直接傳遞，直到 `postProcessing` |

自訂 `pathTemplate` 會停用平面重寫器，除非您明確設定 `rewriteRelativeLinks: true`。請參閱[輸出版面配置](/guide/documents/output-layouts)和[錨點連結](/guide/documents/anchor-links)以了解跨頁 `#anchor` 處理。

如需 VitePress 專屬的撰寫規則，請參閱 [VitePress 整合 — 連結慣例](/guide/integrations/vitepress#link-conventions)。

如需 Nextra 專屬的撰寫規則，請參閱 [Nextra 整合 — 連結慣例](/guide/integrations/nextra#link-conventions)。

如需 Fumadocs 專屬的撰寫規則，請參閱 [Fumadocs 整合 — 連結慣例](/guide/integrations/fumadocs#link-conventions)。

<a id="postprocessingregexadjustments"></a>
## `postProcessing.regexAdjustments`

當內建重寫器不足時，請在 `docs[].docsOutput.postProcessing` 下新增有序的 `{ "description"?, "search", "replace" }` 規則 — 例如：

- 包含 **語系資料夾區段** 的螢幕截圖或圖片 URL (`screenshots/en-GB/` → `screenshots/de/`)
- 英文來源和翻譯輸出樹狀結構之間不同的絕對網站根路徑 (`/img/…`)
- 任何必須依目標語系變更但不是簡單相對 Markdown 連結的 URL 模式

`postProcessing` 會在 **重新組合的翻譯 Markdown 主體** (YAML 前言鍵和非散文值會保留) 上執行。它會在區段重新組合和內建連結重寫**之後**執行，並在 `addFrontmatter`**之前**執行。

<a id="two-step-flow-with-flat-layout"></a>
### 兩步驟流程與平面版面配置

當 `docsOutput.style = "flat"` 時，平面連結重寫器會先執行，然後是 `regexAdjustments`：

```
source URL  →  [flat link rewriter]  →  [regexAdjustments]  →  output URL
```

在儲存庫根目錄中，使用 `outputDir: "translated-docs/"` 和來源 `README.md` 的範例：

1. 平面重寫器：`images/screenshots/en-GB/foo.png` → `../images/screenshots/en-GB/foo.png`
2. `regexAdjustments`：`images/screenshots/[^/]+/` → `images/screenshots/${translatedLocale}/` → `../images/screenshots/de/foo.png`

撰寫 `search` 模式以符合 **已加前綴的 URL 內部** 的語系區段 — 您不需要在正規表示式中包含 `../` 深度前綴。

對於 `doc-system` 版面配置，平面重寫器不會執行。`regexAdjustments` 會看到來自來源 Markdown 的原始 URL (通常是像 `/img/screenshots/en-GB/foo.png` 這樣的絕對路徑)。

請參閱[平面連結重寫器和兩步驟流程](/guide/images-and-screenshots/link-rewriting#the-flat-link-rewriter-and-two-step-flow)以了解深度前綴行為和 `flatPreserveRelativeDir`。

<a id="replace-placeholders"></a>
### `replace` 預留位置

`replace` 字串支援按檔案和地區設定展開的範本變數：

| 預留位置 | 值 |
| --- | --- |
| `${translatedLocale}` | 目標地區設定（標準化 BCP-47） |
| `${sourceLocale}` | 來源地區設定 |
| `${sourceFullPath}` | 絕對來源檔案路徑 (POSIX `/`) |
| `${translatedFullPath}` | 絕對翻譯輸出路徑 |
| `${sourceFilename}` / `${translatedFilename}` | 帶副檔名的基本名稱 |
| `${sourceBasedir}` / `${translatedBasedir}` | 來源 / 輸出檔案的父目錄 |

`search` 是一個正規表達式模式。純字串使用 `g` 旗標；當您需要其他旗標時，請使用 `/pattern/flags`（模式不得包含未逸出的 `/` 字元）。

<a id="common-patterns"></a>
## 常見模式

<a id="per-locale-asset-folder"></a>
### 按地區設定的資產資料夾

從一開始就將資產儲存在按地區設定編碼的子目錄下，並使用一個通用規則替換該區段：

```json
"postProcessing": {
  "regexAdjustments": [
    {
      "description": "Per-locale screenshot folders",
      "search": "images/screenshots/[^/]+/",
      "replace": "images/screenshots/${translatedLocale}/"
    }
  ]
}
```

使用 `[^/]+` 而不是硬編碼您的來源地區設定 (`en-GB`)，這樣即使 `sourceLocale` 變更，規則仍然有效。

完整教學：[圖片與螢幕截圖 — 按地區設定的資料夾](/guide/images-and-screenshots/per-locale-folder)。

<a id="doc-system-static-urls"></a>
### 文件系統靜態 URL

對於 Docusaurus、Starlight 或其他從共享靜態樹提供螢幕截圖的 `doc-system` 網站：

```json
"postProcessing": {
  "regexAdjustments": [
    {
      "description": "Locale segment in static screenshot URLs",
      "search": "screenshots/[^/]+/",
      "replace": "screenshots/${translatedLocale}/"
    }
  ]
}
```

如果您的產生器支援，請在來源 Markdown 中優先使用共置的相對路徑 (`../assets/name.png`) — 這樣就不需要 `regexAdjustments` 橋接。請參閱 [圖片與螢幕截圖](/guide/images-and-screenshots/) 以了解版面配置選項。

<a id="when-regex-is-not-needed"></a>
### 何時不需要正規表達式

在以下情況下，您通常**不需要** `regexAdjustments`：

- 跨頁面連結是簡單的相對 Markdown 路徑和 `docsOutput.style = "flat"`（內建重寫器會新增地區設定後綴）
- 資產位於來源檔案旁邊，並且扁平重寫器的每個檔案深度前綴正確解析它們
- 英文和每個翻譯副本使用**相同**的 URL（網站根目錄下的共享圖片、共置資產、正規化後的 VitePress 網站路由）
- VitePress 站內連結使用網站路由或帶有 `rewriteVitepressLinks: true` 的 `docs/guide/…` 路徑
- Nextra 與 Fumadocs 的頁內連結使用語系中性路由（`/guide/…`、`/docs/…`）或帶有 `rewriteNextraLinks` / `rewriteFumadocsLinks: true` 的內容根路徑

<a id="full-config-example"></a>
## 完整設定範例

帶有每個語言環境螢幕截圖和可選語言切換器區塊的平面 README：

<details>
<summary>平面佈局：regexAdjustments + languageListBlock</summary>

```json
"docsOutput": {
  "style": "flat",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders",
        "search": "images/screenshots/[^/]+/",
        "replace": "images/screenshots/${translatedLocale}/"
      }
    ],
    "languageListBlock": {
      "start": "<small id=\"lang-list\">",
      "end": "</small>",
      "separator": " · ",
      "label": "local"
    }
  }
}
```

</details>

欄位參考：[組態 — `docs`](/reference/configuration#docs) (`docsOutput.postProcessing`)。

<a id="troubleshooting"></a>
## 疑難排解

| 症狀 | 可能原因 | 檢查項目 |
| --- | --- | --- |
| 翻譯頁面在圖片或靜態資產上出現 404 錯誤 | 您的 URL 佈局缺少或錯誤的 `regexAdjustments` | [圖片與螢幕截圖 — 疑難排解](/guide/images-and-screenshots/troubleshooting) |
| 連結開啟正確檔案但 `#section` 錯誤 | 錨點 slug 漂移，而非 URL 重寫 | [錨點連結](/guide/documents/anchor-links) |
| `regexAdjustments` 規則對平面佈局無效 | `search` 預期重寫器前的 URL，但平面佈局已新增深度前綴 | 比對帶有前綴路徑內的區段（請參閱[兩步驟流程](#two-step-flow-with-flat-layout)) |
| 執行時跳過無效的正規表示式 | 格式錯誤的 `search` 模式 | CLI 會以規則 `description` 發出警告；針對範例翻譯輸出測試模式 |
