<a id="language-switcher-languagelistblock"></a>
# 語言切換器 (`languageListBlock`)

當翻譯的 Markdown 檔案應包含一個「**以其他語言閱讀**」的連結列時，請使用 `docsOutput.postProcessing.languageListBlock`，其中每個地區設定一個連結，且 `href` 值是相對於每個輸出檔案計算的。

此儲存庫將其用於 [README.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md) (在 `translated-docs/` 下的平面輸出)。在 `translate-docs` 之後，每個翻譯副本都會獲得一個刷新的區塊；例如 [translated-docs/README.de.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/translated-docs/README.de.md) 連結到 `translated-docs/` 下的同級地區設定檔案，並返回到儲存庫根目錄的英文來源。

需要 `docsOutput.style = "flat"` (或另一個可以透過相對路徑定址同級地區設定檔案的佈局)。請參閱 [輸出佈局](/guide/documents/output-layouts)。

<a id="1-mark-the-block-in-source-markdown"></a>
## 1. 在來源 Markdown 中標記區塊

將切換器包裝在由 `start` 和 `end` 子字串標記分隔的 HTML（或任何行）中。此儲存庫使用：

```markdown
<small>**Read in other languages:** </small>
<small id="lang-list">[English (GB)](/) · [Deutsch](./README.de.md) · …</small>
```

初始連結文字僅為預留位置。`translate-docs` 會替換從包含 `start` 的第一行到包含 `end` 的第一行之後的整個片段（圍起來的程式碼區塊內的標記會被忽略，因此同一檔案中的設定範例不會匹配）。

<a id="2-configure-the-block"></a>
## 2. 配置區塊

`start` 和 `end` 是任意的子字串標記 — 它們不一定要是 `<small id="lang-list">` / `</small>`。請選擇出現在語言切換器片段中的任何開頭和結尾文字：另一個 HTML 標記 (`<div class="lang-switcher">` … `</div>`)、HTML 註解 (`<!-- lang-list -->` … `<!-- /lang-list -->`)，或僅限 Markdown 的邊界 (例如，一行 `**Languages:**` 到一行 `---`)。在設定中將 `start` 和 `end` 設定為與您在來源檔案中使用的完全一致。

根配置 ([ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/ai-i18n-tools.config.json))：

```json
"postProcessing": {
  "languageListBlock": {
    "start": "<small id=\"lang-list\">",
    "end": "</small>",
    "separator": " · "
  }
}
```

| 欄位       | 角色                                                                                                     |
|-------------|----------------------------------------------------------------------------------------------------------|
| `start`     | 識別區塊開頭行的子字串                                                  |
| `end`       | 結尾行上的子字串 (當兩者出現在同一行時，可以是與 `start` 相同的行)             |
| `separator` | 在產生的 `[label](href)` 連結之間的文字 (此儲存庫使用 `" · "`)                                    |
| `label`     | 選用：`"local"` (預設) 使用資訊清單中的每個地區語言的本地名稱；`"english"` 使用 `englishName` |

<a id="3-what-happens-at-runtime"></a>
## 3. 執行時會發生什麼

1. **提取** — 語言列表片段**不會**傳送給模型 (`translatable: false`)。
2. **每個翻譯檔案** — 在區段翻譯和選用的平面連結重寫之後，`postProcessing` 會重建區塊：每個地區語言一個 Markdown 連結，標籤來自 `ui-languages.json` (如果存在，否則使用捆綁的主目錄，否則使用 `localeDisplayNames`)，路徑相對於正在寫入的檔案。
3. **來源更新** — 在完成 `translate-docs` / `sync` 文件傳遞後，相同的標準區塊會寫回 **英文來源檔案**中的 `contentPaths`，因此新增地區語言會更新儲存庫中的切換器，而無需手動編輯每個連結。

如果檔案沒有匹配的區塊，CLI 會記錄警告 (當 `--verbose` 時) 並保持內文不變。

<a id="4-label-manifest"></a>
## 4. 標籤清單

對於內名標籤 (`label: "local"`)，透過 `generate-ui-languages` 生成或維護 `ui-languages.json` (需要 [`uiLanguagesPath`](/reference/configuration#uilanguagespath-optional))。此儲存庫的僅文件配置沒有 UI 管道，因此標籤來自 `sourceLocale` + `targetLocales` 的捆綁主目錄。

<a id="5-examples-in-this-repository"></a>
## 5. 此儲存庫中的範例

| 範例 | 檔案 |
|------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 此套件 (平面 README + VitePress 網站) | [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/ai-i18n-tools.config.json) (README 區塊：`docsOutput.style = "flat"`；網站區塊：`docsOutput.style = "vitepress"`；透過 `json[]` 的主題 JSON) |
| 平面 README + Docusaurus 文件 | [examples/nextjs-app/ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/ai-i18n-tools.config.json) (第二個區塊：`docsOutput.style = "flat"`；第一個區塊：`docsOutput.style = "docusaurus"`) |
| VitePress 文件 (最小化演示) | [examples/vitepress-docs/ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/ai-i18n-tools.config.json) (`docsOutput.style = "vitepress"` + `json[]` 主題目錄) |

`<small id="lang-list">` 前面一行 (例如 `**Read in other languages:**`) 是一個正常的翻譯區段，並在每個目標地區語言中進行本地化；只有標記內的連結列會逐字重新產生，但 `href` 和由資訊清單驅動的標籤除外。
