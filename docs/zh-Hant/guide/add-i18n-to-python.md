<a id="add-i18n-to-a-python-app"></a>
# 為 Python 應用程式加入 i18n

本頁說明如何將單一語言的 Python 應用程式，使用 ai-i18n-tools 加入地區設定。它遵循一條路徑：`ui-python` 範本、一個小型 `i18n.py` 輔助程式，以及翻譯的 JSON 檔案。這條路徑適用於 Streamlit、FastAPI、Flask、桌面應用程式和指令碼。

最快的方法是將本頁上的提示提供給程式碼代理程式。它會設定組態、包裝您的字串、檢查結果，並可新增語言選單。您需要自行安裝 CLI、選擇提供者並初始化專案，因為這需要您的 API 金鑰和您的選擇。您也需要自行執行翻譯，因為這會花費您帳戶中的費用。

如果您使用 Django、Flask-Babel 目錄或 GNU gettext，並想保留這些呼叫？請改用[將 i18n 加入 Django / Python gettext 應用程式](/zh-Hant/guide/add-i18n-to-django-gettext)。它會保留 `gettext` 並寫入 `.po` 和 `.mo` 檔案，無需輔助程式。不確定哪種適用？請參閱結尾的[不適用於您的情況？](#not-your-case)。

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

當機器上已有 Node.js `>=22.16.0` 時，請使用 npm 套件 ([安裝](/zh-Hant/guide/installation))。若是 Python 專案，請安裝獨立可執行檔 (無需 Node.js)。

Linux 和 macOS：

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell)：

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

安裝程式會檢查 `SHA256SUMS.txt`，將指令安裝為 `ai-i18n-tools`，並將其新增至 `PATH`。這些二進位檔未經公證或 Authenticode 簽署。手動步驟和資產名稱：[獨立可執行檔](/zh-Hant/guide/installation#standalone-executables)。

檢查安裝：

```bash
ai-i18n-tools --version
```

然後選擇提供者，並在將執行翻譯的 shell 中設定其 API 金鑰。例如，Cheaper Inference：

```bash
export CHEAPERINFERENCE_API_KEY=your-key-here
```

Ollama 不需要金鑰。其他預設值：[內建提供者](/zh-Hant/guide/providers-and-models#built-in-providers)。請記下提供者名稱，因為您會在下一步將其傳遞給 `init`。代理程式永遠不需要金鑰：它只執行不進行模型呼叫的命令。您稍後在[翻譯](#choose-models-and-translate)時會使用該金鑰。

<a id="initialise-the-project"></a>
## 初始化專案

您在提示之前執行此操作一次。它會寫入組態和 `i18n.py` 輔助程式，並使用您在上方選擇的提供者。

本頁使用一個範本，即 `ui-python`。它會寫入組態、`i18n.py` 輔助程式和 JSON 目錄。它適用於這些應用程式：

| 您的應用程式 | 備註 |
| --- | --- |
| Streamlit | 語言選單需要在應用程式中加入幾行程式碼；請參閱[新增語言切換](#step-4-add-a-language-switch) |
| FastAPI | 地區設定是依每個請求設定的 |
| Flask | 平面 JSON 目錄。對於 `translations/` 中的 Flask-Babel 目錄，請使用[gettext 頁面](/zh-Hant/guide/add-i18n-to-django-gettext) |
| Pyramid | 與 Flask 的接線方式相同 |
| 桌面應用程式 (Tkinter、PyQt、PySide) | 在地區設定變更後重建可見文字 |
| PyWebView | 範本涵蓋 Python shell。請單獨翻譯其 HTML 頁面 |
| 命令列工具和指令碼 | 最簡單的情況 |

使用您選擇的提供者執行 init (此範例中為 Cheaper Inference)：

```bash
ai-i18n-tools init -t ui-python -P cheaperinference
```

然後在 `ai-i18n-tools.config.json` 中編輯 `sourceLocale` 和 `targetLocales`。`sourceLocale` 是來源中字串的語言。任何 BCP-47 語言都有效；範例通常使用 `en`。

執行 `init` 一次。它每次都會重寫 `ai-i18n-tools.config.json`，因此第二次執行會捨棄您所做的編輯。如果 `i18n.py` 已包含標記 `ai-i18n-tools-i18n-py`，則專案已初始化：請跳過此步驟。

`init` 將 `ui.sourceRoots` 設定為 `"."`，因此 `extract` 將掃描整個儲存庫（測試、指令碼、文件）。提示會將其縮小到您的應用程式程式碼（手動操作，即[步驟 1](#place-the-helper))。

框架接線：[Python 整合](/zh-Hant/guide/integrations/python)。呼叫形式和目錄佈局：[Python 應用程式](/zh-Hant/guide/ui-strings/python)。

<a id="run-the-agent-prompt"></a>
## 執行代理程式提示

在您的程式碼代理程式（Cursor、Claude Code、Copilot 或類似工具）中開啟專案，開始新的聊天，然後貼上以下提示。專案必須已經初始化。沒有什麼需要編輯的。如果您想省略某些內容，例如不包含語言選單，請在同一訊息中說明。

代理程式首先檢查 CLI、設定檔和 `i18n.py` 是否存在，如果缺少其中一項，則會停止並提供指示。然後它分為三個部分運作：

- 第 1 部分將 `i18n.py` 和 `locales/` 放置在儲存庫儲存其程式碼的位置，並將設定指向它們。
- 第 2 部分將使用者介面字串包裝在 `t()` 和 `_()` 中，執行 `extract`，並使用 `migrate-python-i18n` 檢查包裝後的呼叫。
- 第 3 部分新增語言選單，或 CLI 語言選項和環境地區設定。

它不會安裝或初始化任何東西，讀取您的 API 金鑰，或進行翻譯。翻譯是審查之後的步驟，由您執行。

````markdown
# Add languages to this Python app

## Before you start

The user must already have installed ai-i18n-tools and initialised this
project. Check that `ai-i18n-tools --version` runs, that
`ai-i18n-tools.config.json` exists, and that an `i18n.py` containing
`ai-i18n-tools-i18n-py` exists. If any of them is missing, stop now and tell
the user to install ai-i18n-tools and run
`ai-i18n-tools init -t ui-python -P <provider>`, then run this prompt again.
Do not install or initialise anything yourself.

## Rules

- Do not read or search the ai-i18n-tools source. This prompt is complete.
- Never read, print, or write API keys, `.env` files, or the shell environment.
- Do not run `translate-ui` or `suggest-models`. They call the translation API
  and cost money. The user runs them after reviewing your work.
- Do not translate, reword, or rename source text. Do not edit `i18n.py` or
  generated files (`strings.json`, per-locale JSON, `ui-languages.json`). Do not
  add another helper module.
- Do not reformat unrelated code. Keep existing blank lines. Run the project's
  formatter and linter at the end. Leave unrelated edits in a dirty tree alone.
  Delete throwaway scripts and do not commit them.

## Part 1 — Place the helper and the catalogs

Skip this part when `i18n.py` and `locales/` already sit with the code that
uses them and the config points at them.

1. Move `i18n.py` and `locales/` together to where this repository keeps its
   code. A script: leave them at the root. A package or `src/` layout: put them
   in the package, beside the modules that import them. `i18n.py` loads
   `locales/` from its own folder, so do not edit paths inside it.
2. In `ai-i18n-tools.config.json`, point `ui.stringsJson`, `ui.flatOutputDir`,
   and `languagesManifestPath` (if it is set) at the new `locales/`. Set
   `ui.sourceRoots` to the application code instead of `"."`.
3. Update imports (`from i18n import t`, or `from mypkg.i18n import t`). If the
   app is installed or shipped (wheel, container), include `locales/*.json` as
   package data.
4. Run `ai-i18n-tools extract` and confirm the catalog is in the new place.

## Part 2 — Wrap strings

The literal in `t("…")` is the source-language sentence and the catalog key.
With the source locale active, the app must behave exactly as before. Text that
is already wrapped needs no change.

- Wrap text a person sees: labels, titles, captions, messages, errors,
  validation text, progress lines, emails. Leave SQL, regexes, file formats, log
  messages, CSS, identifiers, widget keys, status and enum codes, number and
  date formats, and prompts sent to a model.
- Call shapes: `t("Hello, {name}!", name=name)` and `_("Hello, %s!") % name`.
  Placeholders are `{name}`, `{price:,.2f}`, `{rate:.2%}`, or `{item!r}`, passed
  as keyword arguments. No dotted fields: pass `rate=row.rate`. Keep a literal
  `%` away from a printf letter such as `%d`.
- Look up first, then format. Never `_(f"…")`, `_("…" % x)`, or
  `_("…".format(…))`.
- The argument must be a string literal, so `t(variable)` is invisible. Use one
  `t()` per sentence or paragraph, with values as placeholders. Split only where
  the text already branches. Keep markers that the code detects outside `t()`.
- A value that is both stored and shown keeps its source-language value.
  Translate the label where it is displayed, and compare against the stored
  value.
- `t()` at module level runs once and freezes. Call it where the text is shown.
- Put the import with the project's other first-party imports.

Work in passes: list string literals that are not passed to `t` or `_` (a
throwaway script is fine), wrap the user-facing ones, then list again. Treat any
bulk rewrite as a draft and review its diff.

Then run `ai-i18n-tools extract` and `ai-i18n-tools migrate-python-i18n`
without `--write`, and read `migrate-python-i18n-report.md`. It finds calls that
format before the lookup. Apply its edits with `--write` only after reading
them, run `extract` again, and repeat until the dry run lists nothing. Fix
manual-review lines by hand. A clean report does not prove every sentence is
wrapped, so keep scanning. Do not commit the report.

## Part 3 — Language switch

Skip this part only when the program shows no text a person reads (a silent
job or a JSON-only API), or when the user asked you to leave language choice
out. A command-line program still gets this part: it has no menu, but it gets
a language option and the process locale, the same idea as the ai-i18n-tools
CLI (`-L` / `--ui-lang`, then `AI_I18N_LANG`, then a saved setting, then the
operating-system locale).

Goal: one chosen language applies to every `t()` in that run, and a screen can
remember the choice. Work out how this project's framework does it, using these
rules:

1. Choose the locale where one unit of work starts (process start, a request,
   a script rerun, window start-up, a UI event), and call `set_locale` before
   the first `t()`. That includes CLI help, usage errors, and page titles set
   before the body.
2. Choose in this order: the explicit choice (CLI option, selector, `?lang=`),
   the stored choice (settings, cookie, session), the environment, then the
   source locale. Accept only codes from `get_ui_languages()`, matched
   case-insensitively and by language (`pt-br` and `pt` become `pt-BR`).
   `set_locale` does not match. An explicit option or the app's own language
   variable that names an unavailable language warns once, then uses the source
   locale. A locale taken only from the operating system does not warn.
3. Keep the locale local to the unit of work: keep the token from `set_locale`
   and call `reset_locale(token)` in `finally` or a teardown hook. A new thread
   starts in the source locale.
4. On a screen, add a selector built from `get_ui_languages()` (each row has
   `code` and `label`), labelled `t("Language")`, on every screen that should
   switch, and store the choice. A CLI does not get a selector.
5. Make the change visible on the next command, a page reload, `st.rerun()`, or
   a function that re-applies every visible string. Each string is a
   `t("literal")` so the extractor sees it.
6. Set the text direction from `get_direction()` where the framework needs it.

Command-line programs:

- Add `--lang <code>`, `-L <code>`, and `--lang=<code>`, unless the program
  already uses those names. Read the option from the raw arguments before
  argparse builds help, so `--help` is translated too. Document the option in
  that help.
- After the option, read a language environment variable the app already owns.
  Do not read `AI_I18N_LANG`; that variable is only for the ai-i18n-tools CLI.
  With no such variable, use `LC_ALL`, then `LC_MESSAGES`, then `LANG`, and
  ignore a value of `C` or `POSIX`.
- After the environment, use a language already stored in the app's config.
  Then the host locale, then the source locale. Do not add a new config file
  just to remember the language.

Hints, to adapt rather than copy. Web apps: a middleware or before-request hook
chooses the locale, an after-request hook stores the cookie, and templates get
`t`, `_`, and the language helpers. Streamlit: set the locale at the top of the
entry script, before `st.set_page_config`, with a selectbox that has a fixed
`key`, sets `?lang=`, and calls `st.rerun()`; `streamlit_language_selector()`
sets the locale only after it is drawn. Desktop: set the saved locale before
building the window, and refresh the visible text in the selector handler.

## Verify and report

The tests pass, and none leaves a non-source locale active (`reset_locale` needs
the token from `set_locale`). `extract` writes a non-empty catalog. With the
source locale, the output is unchanged.

Report the files changed, skipped strings grouped by reason, plurals left as one
string, one word with several meanings, sentences built from translated pieces,
and any `t()` that runs at import time. Then list the commands for the user, and
do not run them: `ai-i18n-tools suggest-models` (optional),
`ai-i18n-tools translate-ui`, then restart the app.
````

<a id="review-the-result"></a>
## 審查結果

代理程式結束時會產生一份報告。在翻譯之前檢查它：

- 差異。包裝後的文字應與之前相同，沒有不相關的重新格式化。`git diff --stat` 顯示了多少變更。
- 報告中跳過的字串和模糊不清的案例：複數保留為一個字串，一個單字既用作儲存值又用作標題，以及由翻譯片段組成的句子。這些需要手動決定。
- `ai-i18n-tools extract` 執行順暢，且 `strings.json` 位於您預期的資料夾中。
- 您的測試通過，且應用程式在原始語言中看起來相同。
- 沒有留下任何一次性指令碼或 `migrate-python-i18n-report.md`。

代理程式遺漏的字串稍後會以原始語言的文字形式顯示。[步驟 2](#wrap-strings) 有一個可選指令碼，用於列印未包裝的文字。

<a id="choose-models-and-translate"></a>
## 選擇模型並翻譯

由您執行此部分。它使用您的 API 金鑰並在您的帳戶上花費金錢。

來自 `init` 的模型列表是一個起點。對目前啟用提供者的聊天模型進行排序，當候選清單看起來正確時，將其寫入 `translationModels`：

```bash
ai-i18n-tools suggest-models 
ai-i18n-tools suggest-models --apply
```

`--apply` 僅替換 `translationModels`。使用 `--max-output-price` 排除輸出價格超出限制的模型。如果您偏好圖形使用者介面，請使用 `ai-i18n-tools dashboard` 來選擇[模型](/zh-Hant/guide/translation-dashboard/models)。

然後提取並翻譯：

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
```

`extract` 寫入 `strings.json` 和 `ui-languages.json`。`translate-ui` 為每個目標語言寫入一個 JSON 檔案。請勿編輯這些生成的檔案。

`t()` 在地區設定 JSON 中查找原始句子。`strings.json` 中的 ID 不是查找鍵。缺少檔案或缺少鍵會返回原始句子。輔助程式會將載入的 JSON 保留在記憶體中供程序使用，包括在首次查找時缺少檔案時的空映射，因此請在 `translate-ui` 之後重新啟動應用程式。

<a id="check-one-language"></a>
### 檢查一種語言

重新啟動應用程式，切換到一個目標語言，然後開啟一個包含一些包裝字串的頁面。使用代理程式新增的語言選單，或手動設定地區設定。仍然是原始語言的文字表示未包裝、在匯入時執行，或在 `locales/<code>.json` 中沒有條目。在您懷疑程式碼之前，請檢查 JSON 中的句子。

<a id="keep-it-translated"></a>
## 保持翻譯更新

變更原始文字後，重新執行 `ai-i18n-tools sync` (或 `extract` 然後 `translate-ui`)。快取表示只有新的或變更的字串才會傳送到模型。在 CI 中執行它，以避免翻譯偏離。翻譯執行後重新啟動應用程式，以便它重新載入 JSON。`ai-i18n-tools dashboard` 開啟[翻譯儀表板](/zh-Hant/guide/translation-dashboard/) 以審查翻譯。

若要在同一次執行中翻譯 `README.md`，請使用 `--with-readme` 建立架構 (或將該區塊新增至現有設定檔)。請參閱 [為您的 README 和 Markdown 文件新增 i18n](/zh-Hant/guide/add-i18n-to-readme)。

<a id="do-it-by-hand"></a>
## 手動操作

如果您偏好自行進行變更，或想了解提示的作用，請按照這些步驟操作。每個步驟都與提示的一部分相符。最後，您仍然需要[安裝 CLI](#install-and-choose-a-provider)、[初始化專案](#initialise-the-project) 和[翻譯](#choose-models-and-translate)。

1. 將[輔助程式和目錄](#place-the-helper) 放置在此儲存庫儲存其程式碼的位置。
2. 將[字串](#wrap-strings) 包裝在 `t()` 或 `_()` 中。
3. 使用 `migrate-python-i18n` [檢查包裝後的呼叫](#step-3-check-wrapped-calls)。
4. [新增語言切換](#step-4-add-a-language-switch)。

<a id="step-1-place-the-helper-and-the-catalogs"></a>
## 步驟 1：放置輔助程式和目錄

`init` 在儲存庫根目錄中寫入這些內容：

| 檔案 | 內容 | 是否編輯？ |
| --- | --- | --- |
| `i18n.py` | 您的程式碼匯入的輔助程式 (`t`, `_`, `set_locale`) | 否。它是生成的 |
| `locales/strings.json` | 提取快取。應用程式從不讀取它 | 否。它由提取器生成 |
| `locales/<code>.json` | 應用程式載入的翻譯，每個語言一個檔案 | 否。`translate-ui` 寫入它們 |
| `locales/ui-languages.json` | 語言清單，用於語言選單 | 否。它由提取器產生 |

`i18n.py` 從其所在的資料夾載入 `locales/`。將輔助程式和 `locales/` 資料夾一起移動，並保持 `i18n.py` 內的路徑不變。

| 您的儲存庫 | 它們的去向 |
| --- | --- |
| 儲存庫根目錄下的一個指令碼 | 將 `i18n.py` 和 `locales/` 留在 `init` 寫入它們的位置 |
| 一個套件，包含 `src/` 配置 | 將兩者都移入套件中，放在匯入它們的程式碼旁邊 |

範例：`src/mypkg/` 下的可安裝套件 `mypkg` 保留 `src/mypkg/i18n.py` 和 `src/mypkg/locales/`。

將設定更新到新位置：

```json
{
  "ui": {
    "sourceRoots": ["src/mypkg"],
    "stringsJson": "src/mypkg/locales/strings.json",
    "flatOutputDir": "src/mypkg/locales"
  }
}
```

`sourceRoots` 是 `extract` 掃描的資料夾。將其保留在應用程式套件中，以便測試和資料檔案不會進入目錄。語言清單路徑 `languagesManifestPath` 在未設定時會遵循 `flatOutputDir`。如果設定已設定它，請將其更改為匹配。

從您選擇的模組路徑匯入 `t`：儲存庫根目錄下的 `from i18n import t`，或套件內的 `from mypkg.i18n import t`。

當應用程式安裝或以容器形式交付時，地區設定 JSON 必須隨套件一起傳輸。將其新增到套件資料中（模式是相對於套件目錄的）：

```toml
[tool.setuptools.package-data]
mypkg = ["locales/*.json"]
```

使用 `ai-i18n-tools extract` 確認。目錄應出現在新的 `locales/` 資料夾中。

<a id="step-2-wrap-strings"></a>
## 步驟 2：包裝字串

`extract` 僅在字串作為字面值傳遞給 `t()` 或 `_()` 時才記錄它。從生成的模組匯入它們。

首先查詢目錄條目，然後進行插值：

```python
t("Hello, {name}!", name=name)
_("Hello, %s!") % name
_("Total: {price:,.2f}").format(price=price)
```

這些在任何查詢之前執行格式化，因此提取器將它們標記為不安全。[下一步](#step-3-check-wrapped-calls) 會找到它們：

```python
_(f"Hello, {name}!")
_("Hello, %s!" % name)
_("Hello, {name}!".format(name=name))
```

包裝人們看到的文字：小工具標籤、頁面標題、說明文字、UI 中顯示的錯誤、進度行、驗證訊息以及包含一些數字的段落。包含插值數字的段落仍然是一個 `t()` 呼叫。佔位符是諸如 `{name}`、`{price:,.2f}` 或 `{rate:.2%}` 之類的名稱。傳遞 `rate=row.rate`。像 `{row.rate:.2%}` 這樣的佔位符會被拒絕。

保持原始措辭不變。缺少翻譯會返回該句子，因此應用程式在原始語言中保持不變。

跳過程式匹配或記錄的文字：SQL、正規表達式、檔案標頭、記錄器行、CSS、小工具鍵、列舉代碼以及您發送給模型的提示。當一個值既被儲存又被顯示時（一個選項也在程式碼中進行比較的選擇框），請將儲存的值保留在原始語言中，並使用 `format_func` 翻譯標籤。

`t()` 在匯入時執行一次，並保持原始語言，直到該模組再次匯入。在小工具建置時呼叫 `t()`。

<a id="find-unwrapped-strings"></a>

分階段工作：列出不是 `t()` 或 `_()` 參數的字面值，包裝面向使用者的那些，然後再次列出。以下指令碼是可選的。它會列印候選項目，包括 f-string 和與 `+` 連接的文字。它會跳過文件字串、SQL 和沒有空格的文字，因此像 `Overview` 這樣的短標籤仍然需要檢查。完成後將其刪除。重寫檔案的指令碼是草稿：保留現有的空白行，將新的匯入與專案的其他匯入放在一起，執行專案的格式化程式，並在保留之前審查差異。

<details>
<summary>可選：列出未包裝的字串</summary>

```python
"""List string literals that are not passed to t() or _().

Usage: python scan_unwrapped.py path/to/package
"""

import ast
import sys
from pathlib import Path

WRAPPERS = {"t", "_", "translate", "gettext", "ngettext", "pgettext"}
SKIP_DIRS = {".venv", "venv", "env", "site-packages", "__pycache__", "node_modules"}
SQL_START = ("SELECT ", "INSERT ", "UPDATE ", "DELETE ", "WITH ", "PRAGMA ")


class Scanner(ast.NodeVisitor):
    def __init__(self) -> None:
        self.hits: list[tuple[int, str]] = []
        self.skip: set[int] = set()

    def mark_docstring(self, body: list[ast.stmt]) -> None:
        first = body[0] if body else None
        if isinstance(first, ast.Expr) and isinstance(first.value, ast.Constant):
            self.skip.add(id(first.value))

    def visit_Module(self, node: ast.Module) -> None:
        self.mark_docstring(node.body)
        self.generic_visit(node)

    def visit_FunctionDef(self, node: ast.FunctionDef) -> None:
        self.mark_docstring(node.body)
        self.generic_visit(node)

    visit_AsyncFunctionDef = visit_FunctionDef
    visit_ClassDef = visit_FunctionDef

    def visit_Call(self, node: ast.Call) -> None:
        func = node.func
        name = func.id if isinstance(func, ast.Name) else getattr(func, "attr", "")
        if name in WRAPPERS and node.args:
            self.skip.add(id(node.args[0]))
        self.generic_visit(node)

    def visit_BinOp(self, node: ast.BinOp) -> None:
        if id(node) in self.skip:
            return
        if not isinstance(node.op, ast.Add):
            self.generic_visit(node)
            return
        pieces: list[ast.expr] = []

        def flatten(item: ast.expr) -> None:
            if isinstance(item, ast.BinOp) and isinstance(item.op, ast.Add):
                flatten(item.left)
                flatten(item.right)
            else:
                pieces.append(item)

        flatten(node)
        texts = [p for p in pieces if isinstance(p, ast.Constant) and isinstance(p.value, str)]
        if not texts:
            self.generic_visit(node)
            return
        joined = "".join(p.value if p in texts else "{...}" for p in pieces)  # type: ignore[union-attr]
        for piece in texts:
            self.skip.add(id(piece))
        self.report(node.lineno, joined)
        for piece in pieces:
            if piece not in texts:
                self.visit(piece)

    def visit_JoinedStr(self, node: ast.JoinedStr) -> None:
        if id(node) not in self.skip:
            parts = [v.value if isinstance(v, ast.Constant) else "{...}" for v in node.values]
            self.report(node.lineno, "".join(str(p) for p in parts))
        # Never report the pieces of an f-string on their own.

    def visit_Constant(self, node: ast.Constant) -> None:
        if id(node) not in self.skip and isinstance(node.value, str):
            self.report(node.lineno, node.value)

    def report(self, line: int, text: str) -> None:
        if " " not in text.strip() or not any(ch.isalpha() for ch in text):
            return
        if text.startswith(SQL_START):
            return
        preview = " ".join(text.split())
        self.hits.append((line, preview if len(preview) <= 140 else preview[:137] + "..."))


def main() -> None:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
    for path in sorted(root.rglob("*.py")):
        if path.name == "i18n.py" or SKIP_DIRS & set(path.parts):
            continue
        scanner = Scanner()
        try:
            tree = ast.parse(path.read_text(encoding="utf-8"))
        except SyntaxError as error:
            print(f"\n# {path}\nskipped, cannot parse with this Python: {error.msg} (line {error.lineno})")
            continue
        scanner.visit(tree)
        if scanner.hits:
            print(f"\n# {path}")
            for line, preview in scanner.hits:
                print(f"{line}: {preview}")


if __name__ == "__main__":
    main()
```

</details>

<a id="step-3-check-wrapped-calls"></a>
## 步驟 3：檢查包裝呼叫

當程式碼包含在目錄查詢之前格式化字串的呼叫時，請使用此步驟。這在舊版包裝和代理程式錯誤中很常見：

```python
_(f"Hello, {name}!")
_("Hello, %s!" % name)
_("Hello, {name}!".format(name=name))
```

`migrate-python-i18n` 會將這些重寫為優先執行的查詢。第二次執行不會改變任何內容。

```python
t("Hello, {name}!", name=name)
_("Hello, %s!") % name
t("Hello, {name}!", name=name)
```

像 `st.write(f"Hello, {name}!")` 這樣的裸字串會保持原樣。包裝它們是[包裝字串](#wrap-strings)。如果 `extract` 是乾淨的，並且程式碼沒有上述三種形式，則無需重寫。

在 `extract` 之後和 `translate-ui` 之前執行它，這樣目錄就不會將 f-string 儲存為鍵。

```bash
ai-i18n-tools extract
ai-i18n-tools migrate-python-i18n
```

該命令是預跑，直到您傳遞 `--write`。它會寫入 `migrate-python-i18n-report.md`。閱讀該報告。當編輯看起來正確時：

```bash
ai-i18n-tools migrate-python-i18n --write
ai-i18n-tools extract
```

再次執行預跑。當它沒有列出任何編輯時停止，然後執行專案的測試。

命令保留的行 (例如 `{value=}` 等偵錯欄位、巢狀格式規範) 會列在報告中。手動修正這些，然後再次執行預跑。產生的 `i18n.py` 會被跳過。該報告是建置產物：請刪除它或將其加入 git-ignore。

沒有編輯的報告表示包裝呼叫是安全的。這不表示每個使用者可見的句子都已包裝。[未包裝的字面值清單](#find-unwrapped-strings) 是用於檢查此項的。

選用的 `--report <path>` 會變更報告路徑。選用的 `--ui-block` 會將掃描限制為一個 UI 區塊。

<a id="step-4-add-a-language-switch"></a>
## 步驟 4：新增語言切換功能

每個框架都需要相同的四件事：

1. 在每個請求、指令碼執行或視窗事件開始時選擇地區設定，並在第一個 `t()` 之前呼叫 `set_locale`。
2. 僅接受 `ui-languages.json` (`get_ui_languages()`) 中列出的語言，並進行寬鬆比對。瀏覽器會傳送 `pt-br`，而目錄是 `pt-BR`。
3. 提供一個由 `get_ui_languages()` 建置的選擇器。
4. 記住選擇。

開啟 `?lang=pt-BR` 不會執行任何動作，直到應用程式讀取它。[代理程式提示](#run-the-agent-prompt) 會為具有使用者介面的應用程式完成所有這些工作，並且它會自行找出框架。以下各節會顯示 Streamlit、FastAPI、Flask 和 Tkinter 的結果。其他框架遵循相同的規則。

<a id="streamlit"></a>
### Streamlit

Streamlit 指令碼會在每次互動時重新執行，因此地區設定會在每次執行時於指令碼頂端選擇。順序：

1. 從上次執行讀取選擇器值，然後是 `?lang=`，然後是儲存的地區設定。
2. 在 `st.set_page_config` 之前，使用該程式碼呼叫 `set_locale`。
3. 呼叫 `st.set_page_config(page_title=t("…"))`。
4. 繪製選擇器。變更時，儲存程式碼、設定 `?lang=` 和 `st.rerun()`。

一旦使用者選擇，選擇器值就會生效。`?lang=` 會在首次造訪時套用，在該值存在之前。功能表位於應用程式中，而不是 `i18n.py` 中，因此其標籤可以是 `t("Language")`。在每個應該切換的畫面顯示它，包括登入頁面。

<details>
<summary>小工具程式碼</summary>

```python
import streamlit as st
from i18n import get_locale, get_ui_languages, set_locale, t


def apply_requested_locale() -> str:
    rows = [row for row in get_ui_languages() if row.get("code")]
    codes = [str(row["code"]) for row in rows] or [get_locale()]
    requested = (
        st.session_state.get("lang_selector")
        or st.query_params.get("lang")
        or st.session_state.get("locale")
        or get_locale()
    )
    choice = requested if requested in codes else codes[0]
    set_locale(choice)
    st.session_state["locale"] = choice
    if st.query_params.get("lang") != choice:
        st.query_params["lang"] = choice
    return choice


def render_language_selector() -> None:
    rows = [row for row in get_ui_languages() if row.get("code")]
    codes = [str(row["code"]) for row in rows]
    if len(codes) < 2:
        return
    labels = {str(row["code"]): str(row.get("label") or row["code"]) for row in rows}
    current = get_locale()
    choice = st.sidebar.selectbox(
        t("Language"),
        options=codes,
        index=codes.index(current),
        format_func=lambda code: labels.get(code, code),
        key="lang_selector",
    )
    if choice != current:
        st.session_state["locale"] = choice
        st.query_params["lang"] = choice
        set_locale(choice)
        st.rerun()


apply_requested_locale()
st.set_page_config(page_title=t("My app"))


def main() -> None:
    render_language_selector()
    st.write(t("Hello"))


main()
```

</details>

將 `from i18n import …` 變更為 [放置輔助程式和目錄](#place-the-helper) 中的套件路徑。為每個其他小工具提供固定的 `key`，並在建置小工具時呼叫 `t()`。在匯入時計算的標籤在切換後會保留在來源語言中。當稍後比較頁面標題時，請包裝兩側：`nav.title != t("Forecast settings")`，因為 `nav.title` 已翻譯。

來自 `i18n.py` 的 `streamlit_language_selector()` 足以用於標題為純字串的短指令碼。它會在繪製小工具時呼叫 `set_locale`，因此其上方已翻譯的 `page_title` 會在該次執行中保留先前的語言，並且其標籤會保持英文。請參閱 `examples/python-streamlit`。

<a id="fastapi-flask-and-tkinter"></a>
### FastAPI、Flask 和 Tkinter

<a id="choose-the-locale-for-a-request"></a>
#### 為請求選擇語系

網路應用程式有三種語言來源，依序為：訪客的明確選擇 (`?lang=`)、記住該選擇的 Cookie，以及瀏覽器的 `Accept-Language` 標頭。原始語言作為備用。

`set_locale` 不會驗證或正規化所給定的內容。傳送 `pt-br` 或 `pt` 的瀏覽器會默默地取得原始語言，因為目錄檔案是 `pt-BR.json`。下面的模組會進行比對，並忽略不在 `ui-languages.json` 中的代碼。將其儲存在 `i18n.py` 旁邊，並從中介軟體或掛鉤匯入它 (當 `i18n.py` 位於套件內時，請使用套件路徑)。

<details>
<summary>request_locale.py</summary>

```python
"""Choose the UI language for a request. Works with any web framework."""

from __future__ import annotations

from i18n import get_ui_languages


def _codes() -> list[str]:
    return [str(row["code"]) for row in get_ui_languages() if row.get("code")]


def source_locale() -> str:
    for row in get_ui_languages():
        if row.get("isSourceLocale"):
            return str(row["code"])
    return (_codes() or ["en"])[0]


def match(candidate: str | None) -> str | None:
    """Map "pt", "pt_br" or "PT-br" onto a language listed in ui-languages.json."""
    if not candidate:
        return None
    wanted = candidate.strip().replace("_", "-").lower()
    codes = _codes()
    for code in codes:
        if code.lower() == wanted:
            return code
    for code in codes:
        if code.lower().split("-")[0] == wanted.split("-")[0]:
            return code
    return None


def from_accept_language(header: str) -> str | None:
    ranked = []
    for part in header.split(","):
        code, _, params = part.strip().partition(";")
        quality = 1.0
        if params.strip().startswith("q="):
            try:
                quality = float(params.strip()[2:])
            except ValueError:
                quality = 0.0
        if code and code != "*" and quality > 0:
            ranked.append((quality, code))
    for _quality, code in sorted(ranked, key=lambda item: -item[0]):
        found = match(code)
        if found:
            return found
    return None


def pick(query: str | None, cookie: str | None, accept_language: str = "") -> str:
    """An explicit choice (?lang=, then the cookie) beats the browser header."""
    return match(query) or match(cookie) or from_accept_language(accept_language) or source_locale()
```

</details>

<a id="fastapi"></a>
#### FastAPI

在 HTTP 中介軟體中選擇語系。保留來自 `set_locale` 的權杖並在 `finally` 中重設它，以便並行請求保留各自的語言。當中介軟體在 `?lang=` 存在時也會儲存 Cookie，並傳送 `Content-Language` 和 `Vary`，以便快取為每種語言保留一份副本。路由會照常呼叫 `t()` 和 `_()`。對於 HTML 頁面，請將輔助程式一次性新增至範本環境。

<details>
<summary>FastAPI 中介軟體和範本</summary>

```python
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates

from i18n import _, get_direction, get_locale, get_ui_languages, reset_locale, set_locale, t
from request_locale import pick

app = FastAPI()
templates = Jinja2Templates(directory="templates")
templates.env.globals.update(
    _=_, t=t, current_locale=get_locale, ui_languages=get_ui_languages, direction=get_direction
)


@app.middleware("http")
async def locale_middleware(request: Request, call_next):
    code = pick(
        request.query_params.get("lang"),
        request.cookies.get("lang"),
        request.headers.get("accept-language", ""),
    )
    token = set_locale(code)
    try:
        response = await call_next(request)
        if request.query_params.get("lang"):
            response.set_cookie("lang", code, max_age=60 * 60 * 24 * 365, samesite="lax")
        response.headers["Content-Language"] = code
        response.headers.append("Vary", "Accept-Language, Cookie")
        return response
    finally:
        reset_locale(token)


@app.get("/greeting/{name}")
def greeting(name: str) -> JSONResponse:
    return JSONResponse({"message": t("Hello, {name}!", name=name), "locale": get_locale()})


@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse(request, "home.html", {"name": "Ada"})
```

</details>

只傳回 JSON 的 API 不需要選單。用戶端傳送 `Accept-Language` 或 `?lang=`。在中介軟體傳回後建置的文字，例如在背景任務中或傳送串流回應時，可能會在重設後執行。在傳回回應之前建置它。

<a id="flask"></a>
#### Flask

Flask 為每個工作提供一個掛鉤。`before_request` 選擇語系並保留權杖，`after_request` 儲存 Cookie，`teardown_request` 重設語系，而上下文處理器會為範本提供 `t`、`_`、`get_locale`、`get_ui_languages` 和 `get_direction`。Pyramid 使用相同的形式，並帶有 `NewRequest` 訂閱者。

<details>
<summary>Flask 掛鉤</summary>

```python
from flask import Flask, g, render_template, request

from i18n import _, get_direction, get_locale, get_ui_languages, reset_locale, set_locale, t
from request_locale import pick

app = Flask(__name__)


@app.before_request
def choose_locale():
    g.locale = pick(
        request.args.get("lang"),
        request.cookies.get("lang"),
        request.headers.get("Accept-Language", ""),
    )
    g.locale_token = set_locale(g.locale)


@app.after_request
def remember_locale(response):
    if request.args.get("lang"):
        response.set_cookie("lang", g.locale, max_age=60 * 60 * 24 * 365, samesite="Lax")
    response.headers["Content-Language"] = g.locale
    response.vary.add("Accept-Language")
    response.vary.add("Cookie")
    return response


@app.teardown_request
def clear_locale(_error):
    token = g.pop("locale_token", None)
    if token is not None:
        reset_locale(token)


@app.context_processor
def inject_i18n():
    return {
        "_": _,
        "t": t,
        "current_locale": get_locale,
        "ui_languages": get_ui_languages,
        "direction": get_direction,
    }


@app.get("/")
def home():
    return render_template("home.html", name="Ada")
```

</details>

<a id="the-language-menu-in-a-template"></a>
#### 範本中的語言選單

FastAPI 的 `Jinja2Templates` 和 Flask 都會呈現此內容。帶有 `?lang=` 的連結會保留頁面並設定 Cookie，因此該選擇會保留在後續頁面。`dir` 屬性會對從右到左的語言使用 `get_direction()`。

<details>
<summary>範本</summary>

```html
<!doctype html>
<html lang="{{ current_locale() }}" dir="{{ direction() }}">
  <body>
    <p>{{ t("Hello, {name}!", name=name) }}</p>
    <nav>
      {% for language in ui_languages() %}
        <a href="?lang={{ language.code }}"{% if language.code == current_locale() %} aria-current="true"{% endif %}>{{ language.label }}</a>
      {% endfor %}
    </nav>
  </body>
</html>
```

</details>

<a id="tkinter"></a>
#### Tkinter

Tkinter 會一次性建立其小工具，因此語言變更必須更新它們。將每個可見文字寫成一個函式，該函式會呼叫 `t("…")` 並將文字常值包含在其中，使用該函式註冊小工具，並在 `set_locale` 之後呼叫 `refresh()`。`extract` 仍然會看到每個文字常值。將所選代碼儲存在應用程式的設定檔中，並在視窗建置之前使用它呼叫 `set_locale`。

<details>
<summary>帶有語言選單的 Tkinter 視窗</summary>

```python
import tkinter as tk
from collections.abc import Callable
from tkinter import ttk

from i18n import get_locale, get_ui_languages, set_locale, t


class App(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self._texts: list[tuple[tk.Misc, Callable[[], str]]] = []
        rows = [row for row in get_ui_languages() if row.get("code")]
        self._codes = [str(row["code"]) for row in rows]
        labels = [str(row.get("label") or row["code"]) for row in rows]
        self.language = ttk.Combobox(self, values=labels, state="readonly")
        self.language.current(self._codes.index(get_locale()))
        self.language.bind("<<ComboboxSelected>>", self._on_language)
        self.language.pack()
        self.greeting = ttk.Label(self)
        self.greeting.pack()
        self.bind_text(self.greeting, lambda: t("Hello, {name}!", name="Ada"))
        self.refresh()

    def bind_text(self, widget: tk.Misc, text: Callable[[], str]) -> None:
        self._texts.append((widget, text))

    def refresh(self) -> None:
        self.title(t("My app"))
        for widget, text in self._texts:
            widget.configure(text=text())

    def _on_language(self, _event: object) -> None:
        set_locale(self._codes[self.language.current()])
        self.refresh()
```

</details>

新執行緒會以原始語言啟動，而非視窗的語言。在主執行緒中翻譯，或在執行緒函式開頭呼叫 `set_locale`。其他工具包需要相同的組件：一個設定每個可見文字的函式，以及一個呼叫 `set_locale` 然後呼叫該函式的選單處理程式。PyQt 和 PySide 有自己的重新翻譯掛鉤；請參閱[每個框架中的語系](/zh-Hant/guide/ui-strings/python#locale-in-each-framework)。

這是最後一個手動步驟。請繼續閱讀 [選擇模型並翻譯](#choose-models-and-translate)。

<a id="not-your-case"></a>
## 情況不同？

| 情境 | 參考 |
| --- | --- |
| Django、Flask-Babel 目錄，或已使用 GNU gettext 的應用程式 | [將 i18n 新增至 Django / Python gettext 應用程式](/zh-Hant/guide/add-i18n-to-django-gettext) |
| JS/TS 應用程式 | [將 i18n 新增至 JS/TS 應用程式](/zh-Hant/guide/add-i18n-to-js) |
| 網站或文件網站 | [為網站或文件網站新增 i18n](/zh-Hant/guide/add-i18n-to-website) |
| 儲存庫 README 或其他 Markdown 檔案 | [為您的 README 和 Markdown 文件新增 i18n](/zh-Hant/guide/add-i18n-to-readme) |
| 巢狀語系 JSON | [JSON](/zh-Hant/guide/json) |

<a id="examples"></a>
## 範例

| 範例 | 顯示內容 |
| --- | --- |
| [python-streamlit](/zh-Hant/examples#python-streamlit) | 儀表板、`t()` / `_()`、扁平化 JSON |
| [python-fastapi](/zh-Hant/examples#python-fastapi) | 請求範圍的地區設定、扁平化 JSON |
| [python-flask](/zh-Hant/examples#python-flask) | Flask + Jinja、扁平化 JSON |

使用 `npx degit` 複製一個，或從 GitHub Release 下載 `ai-i18n-tools-python-examples.zip`。指令：[範例](/zh-Hant/examples#python-examples)。對於使用 gettext 的應用程式，請參閱 [gettext 範例](/zh-Hant/examples#python-gettext)。
