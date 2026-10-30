<a id="add-i18n-to-your-readme-and-markdown-docs"></a>
# 將 i18n 新增至您的 README 與 Markdown 文件

本頁說明如何處理 GitHub、GitLab、Bitbucket 或任何其他主機上的儲存庫，讀者從 `README.md` 開始閱讀，並為每種語言新增一個檔案。無需設定文件網站框架。一般專案也會有應用程式或 CLI，且 README 應使用與該應用程式相同的語言和產品術語。沒有 UI 字串的函式庫或僅文件儲存庫是另一種情況，將在下方說明。

<a id="what-you-get"></a>

此工具會保留 `README.md` 不變。主機仍會將其呈現為儲存庫首頁。每個目標語言環境都是一個同級檔案，例如 `translated-docs/README.de.md`。README 中的語言列會將這些檔案連結在一起，且相同的列會寫入每個翻譯中，其連結可從讀者正在查看的檔案中運作。`translate-docs` 會填入該列。它會將從起始標記到結束標記的所有內容替換為每個語言環境的一個連結。當這些檔案也應翻譯時，請將 `CONTRIBUTING.md`、`CHANGELOG.md` 或 `docs/` 資料夾新增到相同的區塊中。請參閱 [README 以外的內容](#step-3-more-than-the-readme)。

最快的方法是將本頁上的提示提供給程式碼代理。它會檢查設定並新增語言列表標記。您需要自行安裝 CLI、選擇提供者並初始化專案，因為這需要您的 API 金鑰和您的選擇。您也需要自行執行翻譯，因為這會花費您帳戶中的資金。

VitePress、Docusaurus、Starlight、Nextra、Fumadocs 或 Astro 網站使用 [為網站或文件網站新增 i18n](/zh-Hant/guide/add-i18n-to-website)。當儲存庫 README 也應翻譯時，請新增 `--with-readme`。不確定哪種情況適用？請參閱結尾的 [不適用於您的情況？](#not-your-case)。

流程：

1. [安裝 CLI 並選擇提供者](#install-and-choose-a-provider)。
2. 使用 `init`[初始化專案](#initialise-the-project)。
3. [執行代理程式提示](#run-the-agent-prompt)。
4. [檢閱結果](#review-the-result)。
5. [選擇模型並翻譯](#choose-models-and-translate)，然後檢查一種語言。
6. [保持翻譯](#keep-it-translated)。

偏好自行進行變更，或想知道提示的作用？[手動操作](#do-it-by-hand) 會逐步引導您完成相同的步驟。

<a id="install-and-choose-a-provider"></a>
## 安裝並選擇提供者

這部分由您執行，而不是代理程式。安裝程式會變更您的機器，而 API 金鑰是屬於您 shell 的機密，不應出現在提示中。

具有 `package.json` 的儲存庫會將套件安裝為開發依賴項。其他安裝選項：[安裝](/zh-Hant/guide/installation)。

```bash
pnpm add -D ai-i18n-tools
```

`npm install --save-dev ai-i18n-tools` 和 `yarn add --dev ai-i18n-tools` 也適用。

沒有 Node.js 專案的儲存庫可以使用獨立執行檔。Linux 和 macOS：

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell)：

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

安裝程式會檢查 `SHA256SUMS.txt`，將命令安裝為 `ai-i18n-tools`，並將其新增到 `PATH`。二進位檔未經公證或 Authenticode 簽署。手動步驟和資產名稱：[獨立執行檔](/zh-Hant/guide/installation#standalone-executables)。當已安裝 Node.js 且您不想要專案依賴項時，`npx ai-i18n-tools` 也適用。

檢查安裝：

```bash
ai-i18n-tools --version
```

然後選擇提供者，並在其將執行翻譯的 shell 中設定其 API 金鑰。例如，OpenRouter：

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Ollama 不需要金鑰。其他預設值：[內建提供者](/zh-Hant/guide/providers-and-models#built-in-providers)。請記下提供者名稱，因為您會在下一步將其傳遞給 `init`。代理程式永遠不需要金鑰：它只執行不進行模型呼叫的命令。您稍後在[翻譯](#choose-models-and-translate)時會使用該金鑰。

<a id="initialise-the-project"></a>
## 初始化專案

您在提示之前執行此操作一次。它會寫入設定並使用您在上方選擇的提供者。它不會編輯 `README.md`。當設定包含 README 區塊時，它會列印要貼上的標記行，並在缺少 `README.md` 時發出警告。

| 您擁有 | 鷹架 | 接著 |
| --- | --- | --- |
| JS/TS 應用程式加上 README | `ai-i18n-tools init -P openrouter` (`ui-markdown`，預設值) | [將 i18n 新增至 JS/TS 應用程式](/zh-Hant/guide/add-i18n-to-js) 適用於 `t()`，以及本頁面適用於 README |
| Python 應用程式加上 README | `ai-i18n-tools init -t ui-python -P openrouter --with-readme` | [將 i18n 新增至 Python 應用程式](/zh-Hant/guide/add-i18n-to-python) 適用於應用程式，以及本頁面適用於 README |
| 任何其他範本，加上 README | 將 `--with-readme` 新增至該 `init` 指令 | 本頁面適用於 README 區塊 |
| 僅有 README 與 Markdown | `ai-i18n-tools init -t docs-markdown -P openrouter` | 本頁面 |

`--with-readme` 在 `ui-markdown` 與 `docs-markdown` 上是無作用的，因為那些範本已包含 README 區塊。

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

然後在 `ai-i18n-tools.config.json` 中編輯 `sourceLocale` 和 `targetLocales`。`sourceLocale` 是 README 的撰寫語言。任何 BCP-47 語言都有效。`features.translateDocs` 必須為 true。混合設定也會設定 `features.translateUIStrings`。`docs[].contentPaths` 列出要翻譯的 Markdown 檔案和資料夾。骨架會列出 `README.md`。

執行 `init` 一次。它每次都會重寫 `ai-i18n-tools.config.json`，因此第二次執行會捨棄您所做的編輯。當您跳過 `init` 時，現有設定會保持不變：提示會附加 README 區塊，而 [步驟 1](#step-1-configure-the-docs-block) 會手動顯示相同的編輯。

<a id="run-the-agent-prompt"></a>
## 執行代理程式提示

在您的程式碼代理（Cursor、Claude Code、Copilot 或類似工具）中開啟專案，開始新的聊天，並貼上以下提示。專案必須已初始化。無需編輯任何內容。如果其他 Markdown 檔案也應翻譯，請在同一訊息中命名它們。

代理會首先檢查 CLI 和設定是否存在，如果缺少其中一個，則會停止並提供指示。然後它分兩部分工作：

- 第 1 部分：當設定中尚未列出 `README.md` 時，附加平面 README 區塊。
- 第 2 部分：將語言列表標記新增到原始 README。

它不會安裝 CLI、初始化設定、讀取您的 API 金鑰、填寫語言連結或翻譯。翻譯是審查之後的步驟，由您執行。

````markdown
# Prepare README and Markdown translation

## Before you start

The user must already have installed ai-i18n-tools and initialised this
project. Check that `ai-i18n-tools --version` runs (or
`pnpm exec ai-i18n-tools --version` when the binary is only in
`node_modules/.bin`) and that
`ai-i18n-tools.config.json` exists. If either is missing, stop now and tell
the user which command to run, then run this prompt again:

- JS/TS app plus a README: `ai-i18n-tools init -P <provider>`
- README and Markdown only: `ai-i18n-tools init -t docs-markdown -P <provider>`
- Any other template: `ai-i18n-tools init -t <template> -P <provider> --with-readme`

Do not install or initialise anything yourself.

## Rules

- Do not read or search the ai-i18n-tools source. This prompt is complete.
- Never read, print, or write API keys, `.env` files, or the shell environment.
- Do not run `sync`, `translate-docs`, `translate-ui`, or `suggest-models`.
  They call the translation API and cost money. The user runs them after
  reviewing your work.
- Do not translate, rewrite, or shorten the source README or any other source
  Markdown. Do not edit anything under `translated-docs/` or other generated
  locale trees. Do not hand-edit locale JSON.
- Do not reformat unrelated files. Leave unrelated edits in a dirty tree alone.

## Part 1 — Config

Skip this part when one `docs` entry already lists `README.md`. Do not add a
second block for the same file.

Otherwise set `features.translateDocs` to true and append one `docs` entry:

- `contentPaths` includes `README.md`
- `outputDir` is `translated-docs`
- `addFrontmatter` is false
- `docsOutput.style` is `flat`
- `docsOutput.flatPreserveRelativeDir` is true
- `docsOutput.linkRewriteDocsRoot` is `.`
- `docsOutput.postProcessing.languageListBlock` uses start
  `<small id="lang-list">`, end `</small>`, separator ` · `

```json
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
```

Leave `features.translateUIStrings` as it is. Add other source files the user
named (`CONTRIBUTING.md`, `docs/`) to that block's `contentPaths`.

## Part 2 — Language list

In `README.md`, where readers should see the other languages, add this marker
if it is not already there. A short label on the line above it is normal
prose. Add that label only when the spot has no heading of its own.

```markdown
**Read in other languages:**

<small id="lang-list"></small>
```

Do not fill in the links yourself. `translate-docs` replaces the marker range.
Markers inside fenced code blocks are ignored, so a config sample in the same
file does not match. Do not put the real marker inside a fence.

## Verify and report

`ai-i18n-tools.config.json` parses, `features.translateDocs` is true, and
exactly one docs block lists `README.md`. The marker is in the source README
and not inside a fence. Nothing under `translated-docs/` changed.

Report the files changed and any Markdown file you left out of `contentPaths`,
with a one-line reason. Then list the commands for the user, and do not run
them: `ai-i18n-tools suggest-models` (optional), `ai-i18n-tools sync`.
````

<a id="review-the-result"></a>
## 審查結果

代理程式結束時會產生一份報告。在翻譯之前檢查它：

- 差異。它應該是設定和標記。原始散文應與之前相同。`git diff --stat` 顯示了多少變更。
- `translated-docs/` 或其他生成的語言環境樹下的任何內容都未經編輯。
- `ai-i18n-tools.config.json` 解析，`features.translateDocs` 為 true，並且只有一個文件區塊列出 `README.md`。
- 標記位於 `README.md` 中，而不是在圍欄式程式碼區塊內。圍欄內的標記範例沒問題。實際的標記在外面。

<a id="choose-models-and-translate"></a>
## 選擇模型並翻譯

由您執行此部分。它使用您的 API 金鑰並在您的帳戶上花費金錢。

來自 `init` 的模型列表是一個起點。對目前啟用提供者的聊天模型進行排序，當候選清單看起來正確時，將其寫入 `translationModels`：

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` 僅替換 `translationModels`。相同的排名位於 `ai-i18n-tools dashboard` 的[模型](/zh-Hant/guide/translation-dashboard/models)分頁上。

然後翻譯：

```bash
ai-i18n-tools sync
ai-i18n-tools status
```

`sync` 會依序執行已啟用的步驟：當 UI 字串開啟時，執行 `extract` 和 `translate-ui`，然後是 `translate-docs`。快取是共用的，因此已為應用程式翻譯的句子在 README 中出現時會被重複使用。UI 目錄也會作為詞彙表提示（`ui[].uiGlossary`，預設開啟）傳遞給文件翻譯，這能讓按鈕和功能名稱保持一致。請參閱[詞彙表](/zh-Hant/guide/glossary)。

該列中的語言名稱來自 `ui-languages.json`，`extract` 會將其寫入 UI 目錄旁。僅含 README 的設定檔沒有 UI 目錄，因此該列會改用內建的語言清單。標籤仍然是原生名稱。只有在您想要自己的專案資訊清單時，才執行 `generate-ui-languages`。

提交 `translated-docs/` 並在主機上開啟翻譯後的 README。來源 README 與 `translated-docs/README.de.md` 之間的相對連結會為每個檔案重寫。

<a id="check-one-language"></a>
### 檢查一種語言

打開 `translated-docs/README.de.md`（或您選擇的任何目標代碼）在主機上和檔案本身中。語言列應列出所有地區設定，且連結可從您正在查看的檔案中運作。仍然是原始語言的句子是在程式碼區塊、URL 或標題錨點內，或它不在 `contentPaths` 中。

<a id="keep-it-translated"></a>
## 保持翻譯更新

在原始 README 或應用程式字串變更後，重新執行 `ai-i18n-tools sync`。快取只會將新的或已變更的文字傳送至模型。在 `translated-docs/` 下提交更新的檔案。`ai-i18n-tools dashboard` 會開啟 [翻譯儀表板](/zh-Hant/guide/translation-dashboard/) 以檢閱翻譯。

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

<a id="hybrid-tips"></a>
### 混合式秘訣

- 使用 `docs[].targetLocales` 將 README 翻譯成比應用程式更少的語言。請參閱[減少文件語系](/zh-Hant/guide/combining-pipelines#fewer-locales-for-documents)。
- 將產品術語放入 `glossary.userGlossary`。UI 字串和 README 使用同一個 CSV。
- 使用 `ai-i18n-tools sync --no-docs` 或 `ai-i18n-tools sync --no-ui` 僅執行其中一邊。

<a id="say-that-the-translation-is-automatic"></a>
### 說明翻譯是自動的

AI 翻譯可能有誤。在 README 底部加上簡短的註解，就像 [此存放庫的 README](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md) 中的註解一樣，告訴讀者其他語言是機器翻譯的，並且在使用前應先檢查。

<a id="do-it-by-hand"></a>
## 手動操作

如果您偏好自行進行變更，或您想知道提示的作用，請執行這些步驟。前兩個與提示的部分相符。後兩個用於額外檔案和指向已發佈網站的連結。您仍然會在最後 [安裝 CLI](#install-and-choose-a-provider)、[初始化專案](#initialise-the-project) 和 [翻譯](#choose-models-and-translate)。

1. [設定文件區塊](#step-1-configure-the-docs-block)。
2. [新增語言清單](#step-2-add-the-language-list)。
3. [不只 README](#step-3-more-than-the-readme)。
4. [主機上的連結](#step-4-links-on-the-host)。

<a id="step-1-configure-the-docs-block"></a>
## 步驟 1：設定文件區塊

有四個鍵很重要：

- `sourceLocale`：README 所用的語言。任何語言皆可。本指南中以英文為常見範例。
- `targetLocales`：要新增的語言。
- `features.translateDocs`：必須為 true。混合設定檔也會設定 `features.translateUIStrings`。
- `docs[].contentPaths`：要翻譯的 Markdown 檔案與資料夾。鷹架會列出 `README.md`。

當 `init` 已寫入 README 區塊時，請跳過此步驟。當您正在編輯已存在的組態時使用它。

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

當已有一個區塊列出 `README.md` 時，請勿新增第二個區塊。

<a id="step-2-add-the-language-list"></a>
## 步驟 2：新增語言清單

將此行放入 `README.md` 中，讀者應會在此處看到其他語言。其上一行的簡短標籤是一般文字，將會被翻譯。

```markdown
**Read in other languages:**

<small id="lang-list"></small>
```

該行可以為空。`translate-docs` 會將從開頭標記到結尾標記之間的所有內容，替換為每個語系的單一連結。圍欄式程式碼區塊內的標記會被忽略，因此同一檔案中的設定檔範例不會匹配。詳細資訊：[語言切換器](/zh-Hant/guide/documents/language-switcher)。

<a id="step-3-more-than-the-readme"></a>
## 步驟 3：不只 README

將路徑新增至 `contentPaths`。`flatPreserveRelativeDir` 會保留資料夾，因此 `docs/guide.md` 會變成 `translated-docs/docs/guide.de.md`，而不會與另一個 `guide.md` 衝突。

```json
"contentPaths": ["README.md", "CONTRIBUTING.md", "docs/"]
```

`.translate-ignore` 檔案會跳過您不想翻譯的路徑。`init --with-translate-ignore` 會寫入一個入門範本。程式碼圍欄、URL 和標題錨點不會被翻譯。請參閱[輸出佈局](/zh-Hant/guide/documents/output-layouts)、[錨點連結](/zh-Hant/guide/documents/anchor-links) 和[連結重寫](/zh-Hant/guide/documents/link-rewriting)。

每個語言不同的螢幕截圖：[圖片與螢幕截圖](/zh-Hant/guide/images-and-screenshots/)。

<a id="step-4-links-on-the-host"></a>
## 步驟 4：主機上的連結

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

這是最後一個手動步驟。請繼續閱讀 [選擇模型並翻譯](#choose-models-and-translate)。

<a id="not-your-case"></a>
## 情況不同？

| 您有 | 請閱讀 |
| --- | --- |
| 應用程式 UI 字串，且沒有要翻譯的 README | [將 i18n 新增至 JS/TS 應用程式](/zh-Hant/guide/add-i18n-to-js) 或 [將 i18n 新增至 Python 應用程式](/zh-Hant/guide/add-i18n-to-python) |
| Django、Flask-Babel 目錄，或已使用 GNU gettext 的應用程式 | [將 i18n 新增至 Django / Python gettext 應用程式](/zh-Hant/guide/add-i18n-to-django-gettext) |
| VitePress、Docusaurus、Starlight、Nextra、Fumadocs 或 Astro 網站 | [將 i18n 新增至網站或文件網站](/zh-Hant/guide/add-i18n-to-website)。當存放庫的 README 也需要翻譯時，請新增 `--with-readme` |
| 每個地區設定一個 HTML 檔案 | [HTML 頁面](/zh-Hant/guide/documents/html-pages) |
| 完整的 `translate-docs` 參考資料 | [文件](/zh-Hant/guide/documents/) |

<a id="examples"></a>
## 範例

| 專案 | 顯示內容 |
| --- | --- |
| [console-app](/zh-Hant/examples#console-app) | 一個小型 Node 應用程式加上一個平面 README 區塊 |
| [nextjs-app](/zh-Hant/examples#nextjs-app) | UI 字串、文件網站和一個獨立的平面 README 區塊 |
| 此存放庫 | [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/ai-i18n-tools.config.json): 扁平的 README 區塊，然後是 VitePress 網站 |
