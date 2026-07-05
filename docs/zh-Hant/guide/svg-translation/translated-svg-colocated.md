<a id="colocated-translated-svg-doc-system"></a>
# 並置翻譯的 SVG (文件系統)

用於文件系統網站，翻譯後的SVG插圖必須與翻譯後的文件一起出現在每個地區設定的內容目錄中 — 与 [同位置的螢幕截圖](/guide/images-and-screenshots/colocated-screenshots) 相同。Docusaurus 預設設定是主要範例。

<a id="config"></a>
### 設定

```json
"features": {
  "translateSVG": true
},
"svg": {
  "sourcePath": [
    "documentation/static/assets/diagram.svg"
  ],
  "outputDir": "documentation/i18n",
  "style": "nested",
  "pathTemplate": "{outputDir}/{locale}/docusaurus-plugin-content-docs/current/assets/{basename}",
  "forceLowercase": true
}
```

`translate-svg` 將每個語言環境的一個 SVG 寫入與並置螢幕截圖用於 PNG 的相同 `current/assets/` 目錄：

```
documentation/i18n/de/docusaurus-plugin-content-docs/current/assets/diagram.svg
documentation/i18n/fr/docusaurus-plugin-content-docs/current/assets/diagram.svg
```

<a id="source-markdown"></a>
### 原始 Markdown

所有語系中的文件皆使用相同的相對路徑：

```markdown
![Diagram](../assets/diagram.svg)
```

對於英文語系，符號連結 `docs/assets → ../static/assets` 會解析至此。對於翻譯語系，則直接解析至 `current/assets/`。

不需要 `regexAdjustments` 規則，因為英文原始文件與翻譯後輸出文件使用相同的路徑。

<a id="svg-source-location"></a>
### SVG 原始檔位置

建議：將原始 SVG 檔案儲存在 `documentation/static/assets/`，與 en-GB 的 PNG 檔案放在一起。這可將所有文件資源集中管理，且相同的 `docs/assets` 符號連結即可同時涵蓋兩者。`svg.sourcePath` 項目接著指向 `documentation/static/assets/name.svg`。

<a id="pathtemplate-placeholders"></a>
### `pathTemplate` 標記

| 標記                     | 值                                                     |
|--------------------------|--------------------------------------------------------|
| `{outputDir}`            | `svg.outputDir` 的絕對解析路徑                          |
| `{locale}`               | 目標語系代碼                                           |
| `{LOCALE}`               | 大寫語系代碼                                           |
| `{relPath}`              | 從 `sourcePath` 根目錄到原始 SVG 的相對路徑           |
| `{stem}`                 | 不含副檔名的檔案名稱                                   |
| `{basename}`             | 檔名（含副檔名）                                   |
| `{extension}`            | 副檔名（含點字）                                     |
| `{relativeToSourceRoot}` | 相對於最近的 `sourcePath` 根目錄的相對路徑 |

在[SVG 配置表](/reference/configuration#svg)中查看完整參考。

<a id="implementation-example"></a>
### 實作範例

[duplistatus](https://github.com/wsj-br/duplistatus) — 巢狀的 `svg` 區塊，在 [ai-i18n-tools.config.json](https://github.com/wsj-br/duplistatus/blob/master/ai-i18n-tools.config.json) 中包含 `pathTemplate`；來源 SVG 列在 `documentation/static/img/` 下方 (例如 [duplistatus_toolbar.svg](https://github.com/wsj-br/duplistatus/blob/master/documentation/static/img/duplistatus_toolbar.svg))；`translate-svg` 將每個地區設定的檔案寫入與 PNG 並置的 `documentation/i18n/<locale>/…/current/assets/` 中；文件目前透過 `/img/duplistatus_*.svg` 嵌入它們 (例如 [overview.md](https://github.com/wsj-br/duplistatus/blob/master/documentation/docs/user-guide/overview.md))。請參閱 [task-locale-assets-simplification.md](https://github.com/wsj-br/duplistatus/blob/master/dev/task-locale-assets-simplification.md)，以了解計劃移至 `../assets/` 路徑並移除 SVG `regexAdjustments` 橋接。

---

<a id="the-flat-link-rewriter-and-two-step-flow"></a>
