<a id="glossary"></a>
# 詞彙表

術語表可確保產品術語在所有翻譯中保持一致。使用者可以定義術語在一種或多種語言中的翻譯，讓 AI 模型使用此預先定義的翻譯，而非自行猜測最佳譯法。它也可用於在翻譯成其他語言時，保持某些術語（例如產品名稱）不變。

系統會將兩種指引傳送給模型：

- `glossary.userGlossary` 中的 **Term rows**（以及某些管線中來自 `glossary.uiGlossary` 的現有 UI 翻譯）。只有當該來源術語出現在正在翻譯的文字中時，才會包含該列。
- `glossary.contextFiles` 中的 **Project context files**。完整的簡要說明會注入到每個 UI、文件、JSON、SVG 和校對提示中。該區段位於[下方](#project-context-files)。

<a id="how-the-glossary-works"></a>
## 術語表的運作方式

<a id="where-terms-come-from"></a>
### 術語的來源

| 來源 | 設定 | 使用於 |
| --- | --- | --- |
| UI 目錄 | `glossary.uiGlossary` — 通常與 `ui.stringsJson` 路徑相同 | `translate-docs`、`translate-json`、`translate-svg` |
| 使用者 CSV | `glossary.userGlossary` | `translate-ui`、`proofread-ui`、`translate-docs`、`translate-json`、`translate-svg` |

`uiGlossary` 會重複使用已儲存在 `strings.json` 中的翻譯作為提示，使文件、JSON 和 SVG 與 UI 保持一致。`translate-ui` 和 `proofread-ui` 不會讀取 `uiGlossary` — 它們僅從使用者 CSV 取得提示，因此錯誤的 UI 翻譯不會被回饋為偏好術語。

使用者 CSV 的優先順序高於 UI 目錄。若某列的 `locale` 為特定代碼，則會同時取代該地區設定的 `*` 列與 UI 目錄翻譯。若 `locale` 為 `*`，則會將相同的翻譯套用至每個尚未從 UI 目錄取得翻譯的 `targetLocales` 項目。

精簡的 UI 標籤縮寫（例如結尾帶點的 `Alm.`，或簡短的單一權杖壓縮如 `Size` → `Tam`）仍可用於 UI 翻譯。文件提示會略過它們，因此不會促使模型在 markdown 或 MDX 中產生虛構的 <code v-pre>{{…}}</code> 權杖。

<a id="when-a-term-is-sent"></a>
### 術語傳送的時機

比對不區分大小寫，並在單字邊界（空白或標點符號）停止。系統會優先採用較長的術語，並捨棄重疊的比對結果。當術語與目前批次相符時，提示會收到類似 `"dashboard" → "Tableau"` 的提示。如果該列具有 **Context** 註解，則僅針對該比對結果附加此註解。

**Context** 是來源語言的使用指引（術語的含義或使用方法），而非翻譯。變更 **Context** 註解或任何 `glossary.contextFiles` 內容，會在下次執行時重新整理受影響地區設定的快取翻譯 — 您不需要 `--force`。僅變更偏好的 **Translation** 會保留現有快取，直到您傳遞 `--force` 或 `--force-update` 為止。您在儀表板中編輯的列會保持為 `user-edited`。

<a id="force"></a>
### 強制

當 **Force** 為 `true`、`yes` 或 `1` 時，來源術語會在模型讀取前從文字中移除，並在之後寫回偏好翻譯。用詞會完全一致，而非僅供建議。同樣適用單字邊界和最長比對規則。當模型應優先使用該翻譯但仍可對其進行詞形變化時，請將 **Force** 留空（或設為 `false`）。

<a id="generate-a-glossary"></a>
## 產生術語表

`glossary-generate` 會寫入帶有標準標頭的空白 CSV。它會使用設定中的 `glossary.userGlossary`，或在未設定該金鑰時使用 `glossary-user.csv`。它會拒絕覆寫已存在的檔案（結束 **1**）。

```bash
ai-i18n-tools glossary-generate
# or: ai-i18n-tools glossary-generate -o i18n/glossary.csv
```

將設定指向該檔案：

```json
{
  "glossary": {
    "uiGlossary": "src/locales/strings.json",
    "userGlossary": "i18n/glossary.csv"
  }
}
```

您也可以直接從儀表板建立 CSV 術語表檔案。在 [術語表](/zh-Hant/guide/translation-dashboard/glossary) 索引標籤上首次執行 **新增** 動作時，如果已指定 `glossary.userGlossary` 且檔案尚不存在，系統便會建立該檔案。當 `glossary.autoAddUserEditedToGlossary` 為 `true`（預設值）時，在儀表板中修正 UI 字串，即可在下次執行 `translate-ui` 時將該變更新增至 CSV。儀表板也可作為 CSV 術語表的編輯器，讓您在 UI 中新增、編輯或篩選列。

<a id="csv-columns"></a>
## CSV 欄位

標頭列：

```text
Original language string,locale,Translation,Force,Context
```

`en` 或 `English` 可取代 `Original language string`。`Notes` 可取代 `Context`。

| 欄位 | 意義 |
| --- | --- |
| **原始語言字串** | 來源語言區域中的來源術語或片語 |
| **語言區域** | 目標語言區域代碼，或適用於所有目標的 `*` |
| **翻譯** | 首選翻譯 |
| **強制** | 設為 `true`、`yes` 或 `1` 以強制使用此措辭；否則僅作為提示 |
| **上下文** | 選用的來源語言說明。僅在此術語相符時傳送 |

<a id="examples"></a>
## 範例

每個語言區域一個產品術語、一個強制的德文標籤，以及一個解釋模型可能會照字面理解的詞語的法文資料列：

```csv
"Original language string","locale","Translation","Force","Context"
"dashboard","*","Tableau","false","The analytics home, not a vehicle panel"
"Save","de","Speichern","true",""
"workspace","fr","espace de travail","false","A user's project container, not an office"
```

結合專案簡報：

```json
{
  "glossary": {
    "uiGlossary": "src/locales/strings.json",
    "userGlossary": "i18n/glossary.csv",
    "contextFiles": ["i18n/product-context.md"],
    "contextMaxChars": 12000
  }
}
```

欄位參考：[設定中的 `glossary`](/zh-Hant/reference/configuration#glossary)。命令參考：[`glossary-generate`](/zh-Hant/reference/cli-commands/tools#glossary-generate)。

<a id="project-context-files"></a>
## 專案上下文檔案

`glossary.contextFiles` 用於不屬於單一 CSV 列的產品級指南：產品是什麼、目標對象是誰、語氣，以及容易誤譯的術語。將設定指向一個或多個相對於 cwd 的 `.md` / `.txt` 檔案；它們會按列出順序串接，並注入到每個 UI、文件、JSON、SVG 和校對提示中。

```json
{
  "glossary": {
    "userGlossary": "i18n/glossary.csv",
    "contextFiles": ["i18n/product-context.md"]
  }
}
```

以**來源語言**撰寫簡介，長度應遠低於 `glossary.contextMaxChars`（預設為 `12000`），並將其儲存在 `docs[].contentPaths` 之外，除非您也希望翻譯該檔案。請參閱[設定中的 `glossary`](/zh-Hant/reference/configuration#glossary)。

<a id="generate-a-context-file-with-an-ai-agent"></a>
### 使用 AI 代理程式產生上下文檔案

要求代理（Cursor、Claude Code、Copilot 等）讀取儲存庫並撰寫簡介。貼上類似以下的提示：

```text
Create a translation-context Markdown file for this repository at i18n/product-context.md.

This file is injected verbatim into every ai-i18n-tools translation prompt (UI strings, docs, JSON, SVG, proofread). It must stay in the source language of the project (do not translate it). Translators already receive a glossary of preferred term mappings; this file should explain meaning, audience, and register — not duplicate every glossary row.

Requirements:
- Concise: aim for 1–4 KB, hard limit 8000 characters. No full manuals, README dumps, or changelog history.
- Source-language only. Short headings, bullet lists, and a few example sentences are enough.
- No secrets, API keys, credentials, personal data, internal URLs, or unpublished commercial figures.
- Do not invent product facts. If something is unclear, omit it or mark it as unknown.
- Do not put this file under a path that is also listed in docs[].contentPaths.

Cover, in this order:
1. Product in one paragraph: what it is, who uses it, and the default tone (formal / informal / technical).
2. Domain and disambiguation: terms that look ordinary in English but have a product-specific meaning (for example “dashboard” as an analytics home, not a vehicle panel).
3. Features or areas that change register (billing vs. onboarding vs. admin).
4. Things translators must preserve exactly: brand names, CLI flags, config keys, code identifiers, placeholder tokens.
5. Locale notes only when they affect meaning for every target (for example “use formal you”). Do not list per-locale translations here.

Write only the Markdown file. Afterward, remind me to add it to glossary.contextFiles in ai-i18n-tools.config.json if it is not already listed.
```

在下一次 `sync` / `translate-*` 執行前檢視該檔案。變更該檔案會使該次執行中每個語言地區的快取翻譯失效，因此一旦品質良好，請保持簡介穩定。
