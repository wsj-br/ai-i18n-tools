<a id="html-pages"></a>
# HTML 頁面

`translate-docs` 可為每個語言區域產生一個 HTML 檔案。將 `.html` 或 `.htm` 檔案放在 `docs[]` `contentPaths` 項目上，然後執行 `translate-docs` 或 `sync`。英文檔案會保留為來源。語言區域複本會寫入 `outputDir` 下。

當每種語言都有自己的頁面時（例如靜態網站、一組手寫的 HTML 文件），請使用此功能。當單一 HTML 檔案保持原位，且瀏覽器從扁平 JSON 交換字串時，請使用[純 HTML 應用程式](/zh-Hant/guide/ui-strings/plain-html)。

使用以下指令建立骨架：

```bash
ai-i18n-tools init -t docs-plain-html [-P <provider>]
```

可執行的示範為 [`examples/plain-html-docs`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html-docs)（連接埠 3092）。

<a id="what-is-translated"></a>
## 翻譯的內容

會翻譯：可見文字、`alt`、`title`、`aria-label`、`placeholder`、`<title>`、`meta name="description"`，以及 `og:title` / `og:description`。

保持不變：`script`、`style`、`textarea`、`pre` 和 `code` 元素，以及 `src`、`href` 和其他 URL。包含 `<code>` 或 `<em>` 的段落會保留這些標籤，並翻譯周圍的文字。

`html lang` 和 `dir` 設定於語言區域檔案上。英文來源會保留其自身的 `lang`，直到您變更它為止。

當產生的語言區域檔案位於 `outputDir`（`pt-BR/` 目錄或扁平 `name.pt-BR.html`）下時，會在下次執行時略過。當相同的 `.html` 檔案同時也是 UI 目錄來源（`ui.sourceRoots`）時，會印出警告。

<a id="links-and-images"></a>
## 連結與圖片

指向相同 `docs[]` 區塊中其他 HTML 頁面的連結，會重寫為該頁面的語言區域輸出。其他相對 URL 會加上前置詞，以便它們仍能從語言區域檔案解析。

當存在特定語言區域的檔案時，`docsOutput.localizedAssets` 會選擇性地重新命名圖片與圖示。CSS `url()` 不會被重寫。

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

使用上述模式的 `img/trulli.jpg` 會變成 `img/trulli-pt-BR.jpg`。使用 `onlyIfExists: true`（預設值）時，若缺少該檔案，則會保留原始 URL。絕對 URL、`data:` URL 和 `#` 片段會被略過。根相對 URL（`/img/trulli.jpg`）會在 `assetRoot` 下進行測試，若省略 `assetRoot`，則在 HTML 檔案的目錄下進行測試。

`srcset`、`poster`、`<source src>`、圖示 `<link>` URL，以及 `og:image` / `twitter:image` 使用相同的規則。

對於 HTML，在新增語系資料夾之前，會從專案相對路徑中移除 `docsOutput.docsRoot`。使用 `docsRoot: "site"` 和 `style: "nested"` 時，會將 `site/index.html` 寫入 `site/pt-BR/index.html`。

<a id="language-list-and-hreflang"></a>
## 語言清單與 hreflang

每個語系副本和英文來源都會填入兩組註解配對（以便替代連結保持相互對應）：

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

`script`、`style`、`pre` 和 `code` 內的標記會被忽略。在詳細資訊模式下執行時，若頁面沒有配對則會發出警告。當省略 `docsOutput.html` 時，會使用相同的註解作為預設值。

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

`format: "links"` 會寫入 `<a>` 元素。在 `<ul>`、`<ol>` 或 `<nav>` 內部，每個連結都會被包裝在 `<li>` 中。`format: "select"` 會寫入 `<option>` 列。請將標記放入您自己的 `<select data-lang-select>` 中，並載入 `lang-select.js`（以 `ai-i18n-tools/html-runtime/lang-select.js` 形式提供，並複製於範例中）。一個區塊使用一種格式。

`label` 為 `local`（自稱）、`english` 或 `both`（當兩者不同時為 `English / endonym`）。不在已設定集合中的語系會被省略。

`hreflang.siteUrl` 會為替代連結加上前置詞。若未設定，連結將為相對路徑，並會記錄警告。`xDefault` 預設為 `sourceLocale`。`stripIndexHtml` 會將 `index.html` 轉換為目錄 URL。

沒有網站地圖檔案、沒有自動 `<head>` 注入，也沒有 `canonical` 或 `og:locale` 重寫。瀏覽器語言不會重新導向訪客。

<a id="second-run"></a>
## 第二次執行

句子翻譯會保留在快取中。檔案追蹤雜湊也包含語系清單和 `docsOutput.html` / `localizedAssets`。新增語系會重寫語言清單和 hreflang 區塊，即使每個句子都已快取也一樣。相符的雜湊和最新的輸出檔案會跳過該頁面。
