<a id="html-pages"></a>
# HTML 頁面

當靜態網站需要每個語言區域對應一個已翻譯的 `.html` 或 `.htm` 檔案時，請使用 Documents 管線。`translate-docs` 會翻譯來源頁面、重寫其相對連結，並將語言區域複本寫入 `outputDir` 下。不需要瀏覽器 i18n 執行階段或 `data-i18n*` 標記。

當單一 HTML 檔案保持原位，且瀏覽器指令碼即時從扁平 JSON 交換字串時，請改用[純 HTML 應用程式](/zh-Hant/guide/ui-strings/plain-html)。請勿將同一個檔案放入兩個管線中；當 HTML 檔案同時是 `docs[]` 來源和 `ui.sourceRoots` 目錄來源時，CLI 會發出警告。

可執行的 [`examples/plain-html-docs`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html-docs) 網站會在連接埠 3092 提供英文，並將葡萄牙文寫入 `site/pt-BR/`。

<a id="quick-start"></a>
## 快速開始

建立可運作的設定架構：

```bash
ai-i18n-tools init -t docs-plain-html [-P <provider>]
```

或將此 HTML 部分新增至已有 LLM [提供者](/zh-Hant/guide/providers-and-models) 的 `ai-i18n-tools.config.json`：

```json
{
  "sourceLocale": "en",
  "targetLocales": ["pt-BR"],
  "features": {
    "translateDocs": true,
    "translateUIStrings": false
  },
  "docs": [
    {
      "description": "Static HTML pages",
      "contentPaths": ["site/"],
      "outputDir": "site",
      "addFrontmatter": false,
      "docsOutput": {
        "style": "nested",
        "docsRoot": "site",
        "localizedAssets": {
          "include": ["img/**"],
          "pattern": "{stem}-{locale}{ext}",
          "onlyIfExists": true
        },
        "html": {
          "languageList": {
            "format": "links",
            "label": "local"
          },
          "hreflang": {
            "siteUrl": "https://example.com",
            "xDefault": "en",
            "stripIndexHtml": true
          }
        }
      }
    }
  ]
}
```

`docsRoot` 應該是 `contentPaths` 內的來源樹狀結構。在插入語言區域目錄前會先將其去除。使用上述設定：

```text
site/index.html       → site/pt-BR/index.html
site/about.html       → site/pt-BR/about.html
```

選擇性地將[語言清單與 hreflang 標記](#language-list-and-hreflang)新增至每個來源頁面，然後執行：

```bash
ai-i18n-tools translate-docs
# Or run every enabled pipeline:
ai-i18n-tools sync
```

此命令也會重新整理來源語言檔案中的標記內部內容。請將 `outputDir` 下的語言區域檔案視為產生的輸出；編輯來源頁面並再次執行此命令。

<a id="what-is-translated"></a>
## 翻譯的內容

HTML 擷取器會翻譯：

- 包含字母的可見文字，包括 `<title>` 以及內嵌標記周圍的文字
- `alt`、`title`、`aria-label` 和 `placeholder` 屬性值
- `<input type="submit">` 和 `<input type="button">` 上的 `value`
- `meta name="description"`、`meta property="og:title"` 和 `meta property="og:description"` 上的 `content`

在翻譯周圍句子時，會保留 `<a>`、`<em>`、`<strong>`、`<span>`、`<img>` 和 `<br>` 等內嵌元素。類似程式碼的內嵌元素（如 `<code>` 和 `<kbd>`）會保持完整不變：

```html
<p>Run <code>pnpm build</code> before deployment.</p>
```

整個 `script`、`style`、`textarea`、`pre` 和 `code` 子樹狀結構會原封不動地複製。其他屬性（包括 `class`、`id`、`src`、`href` 和包含 URL 的中繼資料）不會傳送至模型。

在每個語言區域複本上，管線會設定 `<html lang="…">` 和該語言區域的 `dir`（`ltr` 或 `rtl`）。來源頁面會保留其撰寫的 `lang` 和 `dir`。請使用 UTF-8 HTML；當 `<meta charset>` 宣告其他編碼時，CLI 會發出警告。

<a id="output-layout"></a>
## 輸出配置

對於一般的靜態網站配置，請設定：

```json
{
  "outputDir": "site",
  "docsOutput": {
    "style": "nested",
    "docsRoot": "site"
  }
}
```

`style: "nested"` 會寫入 `{outputDir}/{locale}/{path relative to docsRoot}`。`style: "flat"` 會寫入具有語言區域後綴的檔案，例如 `site/about.pt-BR.html`。請參閱[輸出配置](/zh-Hant/guide/documents/output-layouts)以了解所有樣式和自訂路徑範本。

`outputDir` 下產生的語言區域目錄和扁平語言區域檔案名稱會從未來的來源探索中排除。這可防止 `site/pt-BR/index.html` 或 `site/index.pt-BR.html` 被再次翻譯。

<a id="links-and-images"></a>
## 連結與圖片

當相對連結的目標是同一個 `docs[]` 區塊中的另一個來源頁面時，以 `.html` 或 `.htm` 結尾的相對連結會被重寫。查詢字串和片段會保留。例如，`site/index.html` 中的 `href="about.html#history"` 會變成 `site/pt-BR/index.html` 中的 `href="./about.html#history"`。

其他相對 `href`、`src`、`srcset` 和 `poster` URL 會加上深度前置詞，以便共用檔案仍能從語言區域頁面解析。絕對 URL、通訊協定相對 URL、`data:` URL 和僅限片段的連結保持不變。根相對 URL 維持根相對。

`docsOutput.localizedAssets` 可以選取特定語言區域的圖片或圖示檔案名稱：

```json
"localizedAssets": {
  "include": ["img/**"],
  "pattern": "{stem}-{locale}{ext}",
  "onlyIfExists": true
}
```

| 預留位置 | 意義 |
| --- | --- |
| `{stem}` | 不含副檔名的檔案名稱 |
| `{ext}` | 副檔名，包含點號 |
| `{basename}` | 包含副檔名的檔案名稱 |
| `{locale}` | 已設定的語言區域代碼（`pt-BR`） |
| `{llocale}` | 小寫語言區域 |
| `{LOCALE}` | 大寫語言區域 |

`img/trulli.jpg` 會變成 `img/trulli-pt-BR.jpg`。使用 `onlyIfExists: true`（預設值）時，只有在本地化檔案存在時才會使用該 URL；否則會保留原始的共用資產。只有在其他建置或 CDN 步驟保證這些檔案存在時，才設定 `onlyIfExists: false`。

`include` 會比對 URL 路徑，例如 `img/**`。使用 `assetRoot` 來設定檔案系統目錄，以便檢查本地化候選項——特別是根相對 URL，例如 `/img/trulli.jpg`。

相同的本地化規則適用於 `srcset`、`poster`、`<source src>`、圖示 `<link href>`，以及 `og:image` / `twitter:image`。管線會重寫參考，但不會建立、翻譯或複製資產檔案。CSS `url()` 值不會被重寫。

<a id="language-list-and-hreflang"></a>
## 語言清單與 hreflang

將語言清單配對放在可見導覽所屬的位置，並將 hreflang 配對放在 `<head>` 內：

```html
<nav>
  <ul>
    <!-- ai-i18n:lang-list -->
    <!-- /ai-i18n:lang-list -->
  </ul>
</nav>
<!-- ai-i18n:hreflang -->
<!-- /ai-i18n:hreflang -->
```

在每次執行時，管線只會取代每個配對之間的內容。它會更新每個地區設定副本和來源頁面，並保持替代連結的相互對應。`script`、`style`、`pre` 和 `code` 內的標記會被忽略。使用 `--verbose` 時，如果缺少已設定的配對，CLI 會發出警告。

```json
"html": {
  "languageList": {
    "format": "links",
    "label": "local",
    "separator": " · "
  },
  "hreflang": {
    "siteUrl": "https://example.com",
    "xDefault": "en",
    "stripIndexHtml": true
  }
}
```

即使省略 `docsOutput.html`，預設註解也能正常運作。只有在來源使用不同的標記文字時，才設定 `languageList.start` / `end` 或 `hreflang.start` / `end`。

### 可見語言導覽

- `format: "links"` 會寫入 `<a>` 元素。在 `<ul>`、`<ol>` 或 `<nav>` 內，每個連結都會包裝在 `<li>` 中；在其他地方，`separator` 會連接這些連結。
- `format: "select"` 會寫入 `<option>` 列。將標記放在您自己的 `<select data-lang-select>` 內，將 `node_modules/ai-i18n-tools/dist/html-runtime/lang-select.js` 複製到網站中，並載入該傳統指令碼。它會導覽至所選選項產生的 URL。
- `label` 是 `local`（自稱）、`english` 或 `both`（當兩者不同時為 `English / endonym`）。標籤優先來自 `ui-languages.json`（若可用），然後來自套件內建的地區設定清單。

一個標記區塊使用一種格式。產生的連結包含 `lang`、`hreflang` 和 `aria-current`；目前頁面產生的選項具有 `selected`。

### 搜尋引擎替代連結

`hreflang.siteUrl` 會作為替代 URL 的前綴。在部署前，將其設定為網站的公開來源。省略時，管線會寫入相對替代連結並記錄警告。

`xDefault` 預設為 `sourceLocale`；只有在為該頁面設定該地區設定時才會輸出。`stripIndexHtml: true` 會將 `index.html` 替代項轉換為目錄 URL。

標記區塊是必要的：管線不會自動將標籤注入 `<head>`。它也不會產生網站地圖、標準 URL 或 `og:locale`，且不會根據瀏覽器語言進行重新導向。

只有已設定的來源和目標地區設定符合語言區塊的資格。當 `ui-languages.json` 存在時，其列和順序會決定出現哪些符合資格的地區設定，因此請保持資訊清單與設定一致。如果您使用 `--locale` 進行翻譯以僅產生子集，請在每個連結的地區設定輸出都存在之前，不要發佈。

<a id="second-run"></a>
## 第二次執行

句子翻譯會保留在快取中。檔案追蹤雜湊也包含地區設定清單、輸出樣式、`docsOutput.html` 和 `localizedAssets`。新增地區設定或變更這些選項會重寫產生的區塊和連結，即使每個句子都已快取。符合的雜湊和最新的輸出檔案會跳過該地區設定頁面。

<a id="troubleshooting"></a>
## 疑難排解

| 症狀 | 檢查項目 |
| --- | --- |
| 輸出為 `site/pt-BR/site/index.html` | 將 `docsOutput.docsRoot` 設定為 `"site"`，以剝離來源前綴。 |
| 連結仍指向英文頁面 | 使用相對 `.html` / `.htm` 連結，並將目標頁面包含在同一個 `docs[]` 區塊中。 |
| 從地區設定頁面無法正確載入圖片路徑 | 保持相對路徑，以便套用深度重寫；請記住，CSS `url()` 不會被重寫。 |
| 未選取本地化圖片 | 檢查 `localizedAssets.include`、檔案名稱 `pattern`，以及當 `onlyIfExists` 為 true 時候選項是否存在。 |
| 語言清單為空或未變更 | 將兩個標記註解保持在正確的順序，並置於 `script`、`style`、`pre` 和 `code` 之外。 |
| 下拉選單無法導覽 | 將 `data-lang-select` 新增至 `<select>` 並載入 `html-runtime/lang-select.js`。 |
| Hreflang URL 使用了錯誤的主機 | 將 `hreflang.siteUrl` 設定為最終公開來源。 |
| 已翻譯的頁面被再次翻譯 | 將產生的語系檔案保留在已設定的 `outputDir` 下；請勿將其新增為獨立來源。 |
