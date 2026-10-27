<a id="add-i18n-to-your-readme-and-markdown-docs"></a>
# 將 i18n 新增至您的 README 與 Markdown 文件

本頁面適用於 GitHub、GitLab、Bitbucket 或任何其他主機上的存放庫，其讀者會從 `README.md` 與一些其他 Markdown 檔案開始閱讀。無需設定文件網站框架。一般專案也會有應用程式或 CLI，而 README 應使用與該應用程式相同的語言和相同的產品術語。另一種情況是沒有 UI 字串的程式庫或僅有文件的存放庫，將在下方說明。

此工具會將 `README.md` 保留在原位，並為每種語言寫入一個語系檔案，例如 `translated-docs/README.de.md`。README 內部的語言列會將這些檔案連結在一起。

<a id="which-setup-are-you-in"></a>
## 您屬於哪種設定？

| 您擁有 | 鷹架 | 接著 |
| --- | --- | --- |
| JS/TS 應用程式加上 README | `ai-i18n-tools init -P openrouter` (`ui-markdown`，預設值) | [將 i18n 新增至 JS/TS 應用程式](/zh-Hant/guide/add-i18n-to-js) 適用於 `t()`，以及本頁面適用於 README |
| Python 應用程式加上 README | `ai-i18n-tools init -t ui-python -P openrouter --with-readme` | [將 i18n 新增至 Python 應用程式](/zh-Hant/guide/add-i18n-to-python) 適用於應用程式，以及本頁面適用於 README |
| 任何其他範本，加上 README | 將 `--with-readme` 新增至該 `init` 指令 | 本頁面適用於 README 區塊 |
| 僅有 README 與 Markdown | `ai-i18n-tools init -t docs-markdown -P openrouter` | 本頁面 |

`--with-readme` 在 `ui-markdown` 與 `docs-markdown` 上是無作用的，因為那些範本已包含 README 區塊。

<a id="what-you-get"></a>
## 您會獲得什麼

- `README.md` 仍是來源檔案。主機將繼續將其轉譯為存放庫首頁。
- 每個目標語系都是一個同層級檔案，例如 `translated-docs/README.de.md`。
- 來源與每個翻譯中的語言列會列出所有語系，且連結可從讀者正在查看的檔案中正常運作。

當這些檔案也應被翻譯時，請將 `CONTRIBUTING.md`、`CHANGELOG.md` 或 `docs/` 資料夾新增至相同的區塊。請參閱 [不僅是 README](#more-than-the-readme)。

<a id="install"></a>
## 安裝

安裝 CLI ([安裝](/zh-Hant/guide/installation)) 並為您的供應商設定 API 金鑰 ([供應商與 API 金鑰](/zh-Hant/guide/quick-start#provider-and-api-key))。Ollama 不需要金鑰。

具有 `package.json` 的存放庫會將套件安裝為開發依賴項。沒有 Node.js 專案的存放庫可以執行 `npx ai-i18n-tools`，或使用 [獨立可執行檔](/zh-Hant/guide/installation#standalone-executables)。

<a id="scaffold"></a>
## 鷹架

JS/TS 應用程式與 README (一個指令；`ui-markdown` 是預設範本)：

```bash
ai-i18n-tools init -P openrouter
```

Python、Astro、純 HTML、VitePress、Docusaurus 或其他範本，並新增相同的 README 區塊：

```bash
ai-i18n-tools init -t ui-python -P openrouter --with-readme
```

僅有 README 與 Markdown 檔案：

```bash
ai-i18n-tools init -t docs-markdown -P openrouter
```

`init` 僅會寫入 `ai-i18n-tools.config.json`。它不會編輯 `README.md`。當設定檔包含 README 區塊時，它會印出要貼上的標記行，並在 `README.md` 遺失時發出警告。現有的設定檔會被保留不動：請手動新增區塊，如 [將區塊新增至您已有的設定檔](#add-the-block-to-a-config-you-already-have) 中所述。

<a id="configure"></a>
## 設定

有四個鍵很重要：

- `sourceLocale`：README 所用的語言。任何語言皆可。本指南中以英文為常見範例。
- `targetLocales`：要新增的語言。
- `features.translateDocs`：必須為 true。混合設定檔也會設定 `features.translateUIStrings`。
- `docs[].contentPaths`：要翻譯的 Markdown 檔案與資料夾。鷹架會列出 `README.md`。

<details>
<summary>混合式：UI 字串與 README</summary>

`ui-markdown` 會寫入此格式。`ui` 是應用程式目錄。`docs` 項目是 README。

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "fr", "es", "pt-BR"],
  "features": {
    "translateUIStrings": true,
    "translateDocs": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "src/locales/strings.json",
    "flatOutputDir": "src/locales/"
  },
  "docs": [
    {
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "docsOutput": {
        "style": "flat",
        "flatPreserveRelativeDir": true,
        "linkRewriteDocsRoot": ".",
        "postProcessing": {
          "languageListBlock": {
            "start": "<small id=\"lang-list\">",
            "end": "</small>",
            "separator": " · "
          }
        }
      }
    }
  ]
}
```

</details>

<details>
<summary>僅 README 與 Markdown</summary>

`docs-markdown` 會關閉 UI 字串，並保留相同的 README 區塊。

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "fr", "es", "pt-BR"],
  "features": {
    "translateUIStrings": false,
    "translateDocs": true
  },
  "docs": [
    {
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "docsOutput": {
        "style": "flat",
        "flatPreserveRelativeDir": true,
        "linkRewriteDocsRoot": "."
      }
    }
  ]
}
```

語言清單的設定與混合式範例中的相同。此處省略是為了讓程式碼片段簡短。`init -t docs-markdown` 會寫入這些設定。

</details>

<a id="add-the-block-to-a-config-you-already-have"></a>
### 將區塊新增至現有設定檔

將混合式範例中的 `docs` 物件附加進來，並將 `features.translateDocs` 設為 `true`。如果設定檔中已有 `docs` 陣列（例如 VitePress 或 Docusaurus 網站），請將 README 物件作為第二個項目附加。`sync` 會執行每個區塊。[examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app) 就是這樣做的：一個區塊用於文件網站，一個扁平區塊用於 `README.md`。

<a id="language-list"></a>
## 新增語言清單

將此行放入 `README.md` 中，讀者應會在此處看到其他語言。其上一行的簡短標籤是一般文字，將會被翻譯。

```markdown
**Read in other languages:**

<small id="lang-list"></small>
```

該行可以為空。`translate-docs` 會將從開頭標記到結尾標記之間的所有內容，替換為每個語系的單一連結。圍欄式程式碼區塊內的標記會被忽略，因此同一檔案中的設定檔範例不會匹配。詳細資訊：[語言切換器](/zh-Hant/guide/documents/language-switcher)。

<a id="translate"></a>
## 翻譯

```bash
ai-i18n-tools sync
ai-i18n-tools status
```

`sync` 會依序執行已啟用的步驟：當 UI 字串開啟時，執行 `extract` 和 `translate-ui`，然後是 `translate-docs`。快取是共用的，因此已為應用程式翻譯的句子在 README 中出現時會被重複使用。UI 目錄也會作為詞彙表提示（`ui[].uiGlossary`，預設開啟）傳遞給文件翻譯，這能讓按鈕和功能名稱保持一致。請參閱[詞彙表](/zh-Hant/guide/glossary)。

該列中的語言名稱來自 `ui-languages.json`，`extract` 會將其寫入 UI 目錄旁。僅含 README 的設定檔沒有 UI 目錄，因此該列會改用內建的語言清單。標籤仍然是原生名稱。只有在您想要自己的專案資訊清單時，才執行 `generate-ui-languages`。

提交 `translated-docs/` 並在主機上開啟翻譯後的 README。來源 README 與 `translated-docs/README.de.md` 之間的相對連結會為每個檔案重寫。

<a id="hybrid-tips"></a>
## 混合式訣竅

- 使用 `docs[].targetLocales` 將 README 翻譯成比應用程式更少的語言。請參閱[減少文件語系](/zh-Hant/guide/combining-pipelines#fewer-locales-for-documents)。
- 將產品術語放入 `glossary.userGlossary`。UI 字串和 README 使用同一個 CSV。
- 使用 `ai-i18n-tools sync --no-docs` 或 `ai-i18n-tools sync --no-ui` 僅執行其中一邊。

<a id="more-than-the-readme"></a>
## 不僅是 README

將路徑新增至 `contentPaths`。`flatPreserveRelativeDir` 會保留資料夾，因此 `docs/guide.md` 會變成 `translated-docs/docs/guide.de.md`，而不會與另一個 `guide.md` 衝突。

```json
"contentPaths": ["README.md", "CONTRIBUTING.md", "docs/"]
```

`.translate-ignore` 檔案會跳過您不想翻譯的路徑。`init --with-translate-ignore` 會寫入一個入門範本。程式碼圍欄、URL 和標題錨點不會被翻譯。請參閱[輸出佈局](/zh-Hant/guide/documents/output-layouts)、[錨點連結](/zh-Hant/guide/documents/anchor-links) 和[連結重寫](/zh-Hant/guide/documents/link-rewriting)。

每個語言不同的螢幕截圖：[圖片與螢幕截圖](/zh-Hant/guide/images-and-screenshots/)。

<a id="links-on-the-host"></a>
## 主機上的連結

連到存放庫中其他檔案的連結會被重寫為地區設定檔案。連到已發佈文件網站的連結則不會。此存放庫使用 `regexAdjustments` 將地區設定加到其文件網站 URL 的前綴：

```json
"regexAdjustments": [
  {
    "search": "https://wsj-br\\.github\\.io/ai-i18n-tools/",
    "replace": "https://wsj-br.github.io/ai-i18n-tools/${translatedLocale}/"
  }
]
```

扁平連結重寫器會先執行，然後才是這些取代。請參閱 [連結重寫](/zh-Hant/guide/documents/link-rewriting)。

<a id="keep-it-translated"></a>
## 保持翻譯更新

在來源 README 或應用程式字串變更後，重新執行 `sync`。快取只會將新的或變更的文字傳送給模型。將更新的檔案提交到 `translated-docs/` 下。

下方的工作流程是範例，不是已發佈的動作。當 `README.md` 變更時，它會安裝 CLI 並執行 `sync`。將提供者金鑰儲存為存放庫密碼。檢閱 `translated-docs/` 的差異並提交，或將其推送到分支並開啟提取要求。

```yaml
name: Translate README
on:
  push:
    paths:
      - "README.md"
      - "ai-i18n-tools.config.json"
  workflow_dispatch:
jobs:
  translate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
      - run: npm install --save-dev ai-i18n-tools
      - run: npx ai-i18n-tools sync
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
```

使用您設定的提供者對應的環境變數。除非您在託管的執行器上安裝 Ollama，否則它不會在上面運作。

<a id="quality"></a>
## 註明翻譯為自動翻譯

AI 翻譯可能有誤。在 README 底部加上簡短的註解，就像 [此存放庫的 README](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md) 中的註解一樣，告訴讀者其他語言是機器翻譯的，並且在使用前應先檢查。

<a id="not-your-case"></a>
## 情況不同？

| 您有 | 請閱讀 |
| --- | --- |
| 應用程式 UI 字串，且沒有要翻譯的 README | [將 i18n 新增至 JS/TS 應用程式](/zh-Hant/guide/add-i18n-to-js) 或 [將 i18n 新增至 Python 應用程式](/zh-Hant/guide/add-i18n-to-python) |
| VitePress、Docusaurus、Starlight、Nextra、Fumadocs 或 Astro 網站 | [將 i18n 新增至網站或文件網站](/zh-Hant/guide/add-i18n-to-website)。當存放庫的 README 也需要翻譯時，請新增 `--with-readme` |
| 每個地區設定一個 HTML 檔案 | [HTML 頁面](/zh-Hant/guide/documents/html-pages) |
| 完整的 `translate-docs` 參考資料 | [文件](/zh-Hant/guide/documents/) |

<a id="examples"></a>
## 範例

| 專案 | 顯示內容 |
| --- | --- |
| [console-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app) | 一個小型的 Node 應用程式加上一個扁平的 README 區塊 |
| [nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app) | UI 字串、一個文件網站，以及一個獨立的扁平 README 區塊 |
| 此存放庫 | [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/ai-i18n-tools.config.json): 扁平的 README 區塊，然後是 VitePress 網站 |

<a id="agent-prompt"></a>
## 代理提示

將此內容複製到 Cursor 或其他編碼代理中。它會準備存放庫。它不會翻譯 README。

````markdown
# Prepare README and Markdown translation

## Context

ai-i18n-tools translates Markdown listed in `docs[]` and writes one file per locale. The source README stays in place. Flat output for a README looks like `translated-docs/README.de.md`. Guide: https://wsj-br.github.io/ai-i18n-tools/guide/add-i18n-to-readme

## Scope

Edit `ai-i18n-tools.config.json` and the source Markdown files that should grow a language list. Do not edit anything under `translated-docs/` or other generated locale trees.

## Config

- If there is no config, run `ai-i18n-tools init -P <provider>` for a JS/TS app (this template already includes the README block), `ai-i18n-tools init -t docs-markdown -P <provider>` for Markdown only, or `ai-i18n-tools init -t <template> -P <provider> --with-readme` for any other template.
- If a config exists, set `features.translateDocs` to true and append one `docs` entry: `contentPaths` includes `README.md`, `outputDir` is `translated-docs`, `addFrontmatter` is false, `docsOutput.style` is `flat`, `flatPreserveRelativeDir` is true, and `postProcessing.languageListBlock` uses start `<small id="lang-list">`, end `</small>`, separator ` · `.
- Do not add a second block when one already lists `README.md`.
- Add other source files the user named (`CONTRIBUTING.md`, `docs/`) to that block's `contentPaths`.

## README

Add this line where the language row should appear, if it is not already there:

```markdown
<small id="lang-list"></small>
```

Do not fill in the links yourself. `translate-docs` replaces the marker range.

## Do not

- Do not translate, rewrite, or shorten the source README.
- Do not hand-edit `translated-docs/` or locale JSON.
- Do not run a translation yourself.

## Verify

`ai-i18n-tools.config.json` parses, `features.translateDocs` is true, and exactly one docs block lists `README.md`.

## Report back

List files changed and any Markdown file you left out of `contentPaths`, with a one-line reason.
````
