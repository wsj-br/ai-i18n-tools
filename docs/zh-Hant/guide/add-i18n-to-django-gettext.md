<a id="add-i18n-to-a-django--python-gettext-app"></a>
# 將 i18n 加入 Django / Python gettext 應用程式

此頁面適用於使用 GNU gettext 進行翻譯的 Python 應用程式，或將會使用它的應用程式：Django、使用 Flask-Babel 風格目錄的 Flask，或任何呼叫 `gettext()` 的應用程式。您保留 gettext 呼叫。ai-i18n-tools 會讀取這些呼叫，翻譯訊息，並寫入您的應用程式已載入的 `.po` 和已編譯的 `.mo` 檔案。不需要輔助模組。

最快的方法是將此頁面上的提示提供給程式碼代理。它會設定組態、包裝您的字串、檢查結果，並可以新增語言切換功能。您需要自行安裝 CLI、選擇提供者並初始化專案，因為這需要您的 API 金鑰和您的選擇。您也需要自行執行翻譯，因為這會花費您帳戶中的資金，並重寫您的 `.po` 和 `.mo` 檔案。

正在建置目前沒有 gettext 的 Streamlit、FastAPI、Flask、桌面或指令碼應用程式嗎？請改用 [將 i18n 加入 Python 應用程式](/zh-Hant/guide/add-i18n-to-python)。它會新增一個小型 `i18n.py` 輔助程式並寫入 JSON 目錄。不確定哪個適用？請參閱結尾的 [不適用於您的情況？](#not-your-case)。

流程：

1. [安裝 CLI 並選擇提供者](#install-and-choose-a-provider)。
2. 使用 `init` [初始化專案](#initialise-the-project)。
3. [執行代理提示](#run-the-agent-prompt)。
4. [檢閱結果](#review-the-result)。
5. [選擇模型並翻譯](#translate)，然後檢查一種語言。
6. [保持翻譯狀態](#keep-it-translated)。

偏好自行進行變更，或想知道提示的作用？[手動操作](#do-it-by-hand) 會逐步引導您完成相同的步驟。

<a id="install-and-choose-a-provider"></a>
## 安裝並選擇提供者

這部分由您執行，而非代理。安裝程式會變更您的機器，而 API 金鑰是屬於您 shell 的機密，不應出現在提示中。

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

Ollama 不需要金鑰。其他預設值：[內建提供者](/zh-Hant/guide/providers-and-models#built-in-providers)。請記下提供者名稱，因為您將在下一步中將其傳遞給 `init`。代理從不需要金鑰：它只執行不進行模型呼叫的指令。您稍後在 [翻譯](#translate) 時會使用此金鑰。

<a id="initialise-the-project"></a>
## 初始化專案

您在提示之前執行此操作一次。它會寫入組態，並使用您上面選擇的提供者。選擇與您的應用程式相符的範本：

| 您的應用程式 | 範本 | 它寫入的目錄 |
| --- | --- | --- |
| Django | `ui-python-django` | `locale/<lang>/LC_MESSAGES/django.po` 和 `.mo` |
| 使用 Flask-Babel 風格目錄的 Flask | `ui-python-flask` | `translations/<lang>/LC_MESSAGES/messages.po` 和 `.mo` |
| 任何其他已使用 GNU gettext 的 Python 應用程式 | `ui-python-gettext` | `locales/<lang>/LC_MESSAGES/messages.po` 和 `.mo` |

使用範本名稱和您選擇的提供者執行初始化：

```bash
ai-i18n-tools init -t ui-python-django -P cheaperinference
```

執行 `init` 一次。它每次都會重寫 `ai-i18n-tools.config.json`，因此第二次執行會捨棄您所做的編輯。如果配置已存在且已自訂，請跳過 `init` 並編輯配置。

當 `i18n.py` 檔案遺失時，`ui-python-gettext` 和 `ui-python-flask` 也會寫入一個輔助程式。gettext 應用程式不需要它，因此請刪除它（提示會為您執行此操作）。`ui-python-gettext` 也會在 gettext 目錄旁邊寫入 JSON 檔案。若要僅寫入 gettext 目錄，請在 `ui` 區塊中設定 `"flatOutput": false`（提示也會執行此操作）。`ui-python-django` 既不寫入輔助程式也不寫入 JSON，因為 Django 維護其自己的翻譯系統。

然後在 `ai-i18n-tools.config.json` 中編輯 `sourceLocale` 和 `targetLocales`。`sourceLocale` 是您程式碼中字串的語言。任何 BCP-47 語言都有效；範例通常使用 `en`。將目標代碼寫為 `pt-BR`。目錄資料夾是 `pt_BR`，這是 gettext 和 Django 預期的格式（`localeFormat` 是 `posix`）。

<a id="run-the-agent-prompt"></a>
## 執行代理程式提示

在您的編碼代理程式（Cursor、Claude Code、Copilot 或類似工具）中開啟專案，開始新的聊天，然後貼上以下提示。專案必須已初始化。無需編輯。如果您希望省略某些內容，例如不進行語言切換，請在同一訊息中說明。

代理程式首先檢查 CLI 和配置是否存在，如果其中一個遺失，則會停止並提供指示。然後它分為四個部分運作：

- 第 1 部分使配置符合您現有的目錄，並移除某些範本寫入的 `i18n.py`。
- 第 2 部分使用您已使用的 gettext 呼叫和範本標籤來包裝面向使用者的字串。
- 第 3 部分執行 `extract` 並尋找在查詢之前進行格式化的呼叫。
- 第 4 部分新增語言切換。

它不安裝或初始化任何內容，不讀取您的 API 金鑰，也不進行翻譯。它不執行 `makemessages` 或 `compilemessages`，並且不動您的 `.po` 和 `.mo` 檔案。翻譯是審查之後的步驟，由您執行。

<details class="agent-prompt">
<summary>代理程式提示：將語言新增至 Django 或 gettext 應用程式</summary>

````markdown
# Add languages to this gettext app

## Before you start

The user must already have installed ai-i18n-tools and initialised this
project. Check that `ai-i18n-tools --version` runs and that
`ai-i18n-tools.config.json` exists with a `ui.gettext` block. If either is
missing, stop now and tell the user to install ai-i18n-tools and run
`ai-i18n-tools init -t <template> -P <provider>`, then run this prompt again.
The template is `ui-python-django` for Django, `ui-python-flask` for
Flask-Babel catalogs, and `ui-python-gettext` for any other gettext app. Do not
install or initialise anything yourself.

## Rules

- Do not read or search the ai-i18n-tools source. This prompt is complete.
- Never read, print, or write API keys, `.env` files, or the shell environment.
- Do not run `translate-ui` or `suggest-models`. They call the translation API,
  cost money, and `translate-ui` rewrites the `.po` and `.mo` files. The user
  runs them after reviewing your work.
- Do not translate, reword, or rename source text. Do not hand-edit `.po`,
  `.mo`, `.pot`, or `strings.json`. Do not run `makemessages` or
  `compilemessages`. Do not create `i18n.py` or any other translation helper.
  Do not edit migrations or change field names.
- Do not reformat unrelated code. Run the project's formatter and linter at the
  end. Leave unrelated edits in a dirty tree alone. Delete throwaway scripts and
  do not commit them.

## Part 1 — Config

1. If init wrote an `i18n.py`, delete it. A gettext app does not use it. If the
   project uses the `ui-python-gettext` template, set `"flatOutput": false` in
   the `ui` block.
2. Make the config match the project. `ui.gettext.outputDir`, `potPath`, and
   `domain` must be where the existing catalogs live and the domain the app
   loads (Django: `django`; Flask-Babel: `messages`). Put `ui.stringsJson` and
   `ui.flatOutputDir` beside the catalogs. Set `ui.sourceRoots` to the
   application code instead of `"."`. Use one `ui` block per catalog tree when
   apps keep separate `locale/` folders.
3. Keep the existing `.po` files. `extract` reads them and keeps their
   translations.

## Part 2 — Wrap strings

Keep the gettext calls the project already uses, and wrap what is missing. The
literal is the source-language message. With the source language active, the
app must behave exactly as before.

- Python: `gettext`, `ngettext`, `pgettext`. Placeholders are `%(name)s`,
  filled after the lookup: `_("Hello, %(name)s!") % {"name": name}`. Strings that
  run at import time (models, forms, apps, settings) use the lazy form, for
  example `from django.utils.translation import gettext_lazy as _`. Never apply
  `%` to a lazy string at import time. Use `format_lazy`.
- Templates: add `{% load i18n %}` where needed. Use `{% translate "…" %}` and
  `{% blocktranslate with name=user.name %}Hello, {{ name }}!{% endblocktranslate %}`.
  Do not switch templates to `{name}` placeholders.
- Look up first, then format. Never `_(f"…")`, `_("…" % x)`, or
  `_("…".format(…))`. The argument must be a string literal, so `_(variable)` is
  invisible.
- `extract` knows `_`, `t`, `translate`, `i18n.t`, `gettext`, `ngettext`,
  `pgettext`, and `self.tr`. Add every other name the code calls to
  `ui.uiExtractor.funcNames`: for example `gettext_lazy` called directly,
  `ngettext_lazy`, `pgettext_lazy`, `npgettext`, `gettext_noop`.
- Wrap text a person sees: labels, headings, messages, form and model text,
  emails, admin text. Leave identifiers, URLs, route names, field names,
  settings keys, log messages, SQL, and text that is already wrapped. A value
  that is both stored and shown (choices) keeps its stored value. Wrap the
  label.

Work in passes: wrap, run `ai-i18n-tools extract`, look for text still
unwrapped, and repeat.

## Part 3 — Check

1. `ai-i18n-tools extract` lists the new messages and keeps the entries filled
   from the existing `.po` files.
2. Run `ai-i18n-tools migrate-python-i18n` without `--write` and read
   `migrate-python-i18n-report.md`. It finds calls that format before the
   lookup. Fix each one by hand with `%(name)s` and a dict. Never use `--write`:
   it rewrites f-strings and `.format()` calls to `t(...)`, which a gettext app
   does not have. Do not commit the report.
3. Django's checks and the project's tests pass, and the source language still
   shows the original text.

## Part 4 — Language switch

Skip this part when the user asked you to leave the switch out. It changes the
layout.

Goal: the user can pick a language, the choice is remembered, and every request
after that uses it. Use the framework's own mechanism, and accept only the
languages in `sourceLocale` and `targetLocales`.

- Django: `LANGUAGE_CODE` is the source language. `LANGUAGES` lists the
  supported languages with Django's lower-case codes (`pt-br`). `LOCALE_PATHS`
  points at `gettext.outputDir`, unless each app keeps its own `locale/` folder.
  Add `django.middleware.locale.LocaleMiddleware` after `SessionMiddleware` and
  before `CommonMiddleware`. Add `path("i18n/", include("django.conf.urls.i18n"))`
  to the URLconf, and a form that posts to `set_language` with a `next` field
  and a select built from `get_available_languages`, labelled
  `{% translate "Language" %}`.
- Flask-Babel: the locale selector returns, in order, `?lang=`, a cookie that
  remembers it, the `Accept-Language` header, then the source language. Match
  case-insensitively (`pt-br` is `pt-BR`) and ignore unknown codes. Keep
  `translations/` as the translation directory. Add a menu of links that carry
  `?lang=`, and store the cookie.
- Plain gettext: build the translations object with
  `gettext.translation(domain, localedir, languages=[code], fallback=True)`,
  converting `pt-BR` to `pt_BR`. In a web app build it per request. Do not use
  `gettext.install` there, because it is global and concurrent requests would
  share a language.
- Any framework: choose the language where a request or run starts, remember
  the choice, and keep it local to that request.

## Verify and report

The tests pass. With the source language, the output is unchanged. After the
user runs `translate-ui` and restarts the server, switching shows translations.
Before that, it shows the source text.

Report the files changed, each string you skipped with a one-line reason, the
function names you added to `funcNames`, plurals left as one string, one word
with several meanings, and sentences built from translated pieces. Then list
the commands for the user, and do not run them: `ai-i18n-tools translate-ui`,
then restart the server. Remind the user to commit first, because `translate-ui`
rewrites the `.po` files.
````

</details>

<a id="review-the-result"></a>
## 審查結果

代理程式會產生一份報告。在翻譯之前檢查它：

- 差異。只有包裝的呼叫、範本標籤、配置和語言切換應該已變更。在您翻譯之前，您的 `.po` 和 `.mo` 檔案不應觸動。
- `ai-i18n-tools.config.json`：`gettext.outputDir` 和 `domain` 指向您的應用程式載入的目錄，而 `sourceRoots` 涵蓋應用程式程式碼。
- `ai-i18n-tools extract` 列出新訊息並保留您 `.po` 檔案中已有的翻譯。
- `migrate-python-i18n` 的試執行沒有列出任何需要修復的內容。
- Django 的檢查和您的測試通過，並且應用程式在原始語言中看起來相同。
- 報告中跳過的字串和模稜兩可的情況：複數保留為一個字串、一個詞有兩種含義，以及由翻譯片段組成的句子。請手動決定這些。

提交此狀態。`translate-ui` 會重寫您的 `.po` 檔案，因此您會希望有一個清晰的差異以供審查。

<a id="choose-models-and-translate"></a>
## 選擇模型並翻譯

您執行此部分。它使用您的 API 金鑰，花費您帳戶中的資金，並重寫您的 `.po` 檔案，因此請先提交。

來自 `init` 的模型列表是一個起點。對目前啟用提供者的聊天模型進行排序，當候選清單看起來正確時，將其寫入 `translationModels`：

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` 僅替換 `translationModels`。相同的排名位於「[模型](/zh-Hant/guide/translation-dashboard/models)」分頁上。然後翻譯：

```bash
ai-i18n-tools translate-ui
```

`translate-ui` 寫入 `.pot` 範本，每個目標語系一個 `.po`，以及編譯的 `.mo`。從現在起不要編輯這些檔案，因為下次執行會重新產生它們。在提交之前審查第一個差異。

如果伺服器沒有偵測到新的 `.mo` 檔案，請重新啟動伺服器。

<a id="check-one-language"></a>
### 檢查一種語言

切換到一個目標語言，並查看一個包含一些包裝字串的頁面。仍然顯示原始語言的文字未被包裝，或者 `.mo` 未重新載入。輸出中顯示 `%(name)s` 的文字遺失了其字典。檢查 `.po` 檔案中的佔位符。

<a id="keep-it-translated"></a>
## 保持翻譯更新

變更來源文字後，請重新執行 `ai-i18n-tools sync` (或先執行 `extract` 再執行 `translate-ui`)。快取機制代表只有新的或變更的字串會傳送至模型。請在 CI 中執行，以免翻譯內容偏離。`ai-i18n-tools dashboard` 會開啟 [翻譯儀表板](/zh-Hant/guide/translation-dashboard/) 以檢閱翻譯。

`purge-locale` 會移除語系的 `.po` 和 `.mo`。提交 `.po` 檔案。除非您的建置會編譯它們，否則也請提交 `.mo` 檔案。

若要在同一次執行中翻譯 `README.md`，請使用 `--with-readme` 建立架構 (或將該區塊新增至現有設定檔)。請參閱 [為您的 README 和 Markdown 文件新增 i18n](/zh-Hant/guide/add-i18n-to-readme)。

<a id="do-it-by-hand"></a>
## 手動操作

如果您偏好自行進行變更，或者您想知道提示的作用，請按照這些步驟操作。每個步驟都對應提示的一部分。您仍然需要在最後 [安裝 CLI](#install-and-choose-a-provider)、[初始化專案](#initialise-the-project) 並 [進行翻譯](#translate)。

1. [將設定指向您的目錄](#point-the-config)。
2. 使用您已在使用的 gettext 呼叫來 [包裝字串](#wrap-strings)。
3. [擷取並檢查呼叫](#extract-and-check)。
4. [在執行時切換語言](#switch-language)。

<a id="step-1-point-the-config-at-your-catalogs"></a>
## 步驟 1：將設定指向您的目錄

範本會寫入合理的預設值。這是 Django 的範例：

```json
{
  "ui": {
    "sourceRoots": ["."],
    "stringsJson": "locale/strings.json",
    "flatOutputDir": "locale",
    "flatOutput": false,
    "gettext": {
      "outputDir": "locale",
      "domain": "django",
      "potPath": "locale/django.pot",
      "compileMo": true,
      "ingestExistingPo": true,
      "localeFormat": "posix"
    }
  }
}
```

根據您的專案檢查四件事：

- `gettext.outputDir` 和 `potPath` 是您的目錄所在的位置。Django：`LOCALE_PATHS` 中的資料夾，或應用程式內的 `locale/` 資料夾。Flask-Babel：`translations/`。
- `gettext.domain` 是您的應用程式載入的檔案名稱。Django 使用 `django`。Flask-Babel 使用 `messages`。對於純粹的 gettext，它是您 `gettext.translation(...)` 呼叫中的網域。
- `sourceRoots` 列出了 `extract` 掃描的資料夾。將其從 `"."` 縮小到您的應用程式碼，以便測試和腳本不會包含在目錄中。
- `stringsJson` 是擷取快取，一個此工具擁有的檔案。將其放在目錄旁邊。它不是執行時檔案。您的應用程式從不讀取它。

當每個 Django 應用程式保留自己的 `locale/` 資料夾時，每個目錄樹使用一個 `ui` 區塊。`ui` 接受一個列表，並且 `--ui-block` 執行一個區塊。路徑在區塊之間必須是唯一的。請參閱 [設定](/zh-Hant/reference/configuration)。

`ingestExistingPo` 預設為開啟。在 `extract` 期間，您的 `.po` 檔案中已有的翻譯會填補空白位置。已設定的翻譯不會被取代。在第一次 `translate-ui` 之前提交您的目錄，因為它會重寫 `.po` 檔案並編譯 `.mo` 檔案。檢閱該差異。

`compileMo` 會為您寫入 `.mo`，因此在此工作流程中您不需要 `compilemessages`。選擇一個工具來寫入目錄：在 `translate-ui` 之後執行 `makemessages` 會重寫相同的 `.po` 檔案。

<a id="step-2-wrap-strings"></a>
## 步驟 2：包裝字串

`extract` 僅在字串作為文字傳遞給 `ui.uiExtractor.funcNames` 中的其中一個函數名稱或範本標籤時才記錄它。保留您現有的呼叫。補上遺漏的部分。

Python 程式碼：

```python
from django.utils.translation import gettext as _
from django.utils.translation import gettext_lazy, ngettext, pgettext

_("Welcome back")
_("Hello, %(name)s!") % {"name": name}
ngettext("%(count)d file", "%(count)d files", n) % {"count": n}
pgettext("menu", "Open")

class Article(models.Model):
    title = models.CharField(gettext_lazy("Title"), max_length=200)
```

預留位置使用 `%(name)s`。在查詢後使用 `%` 傳遞值，絕不要在其之前。模型、表單和設定在模組匯入時執行，因此它們使用惰性形式。不要在匯入時將 `%` 應用於惰性字串。改用 `format_lazy`。

範本 (Django `{% load i18n %}`，或 Flask 中的 Jinja)：

```jinja
{% load i18n %}
<h1>{% translate "Welcome back" %}</h1>
{% blocktranslate with name=user.name %}Hello, {{ name }}!{% endblocktranslate %}
```

`{% translate %}`、`{% trans %}`、`{% blocktranslate %}` 和 `{% blocktrans %}` 會自行收集。像 <code v-pre>{{ name }}</code> 這樣的範本變數會儲存為 `%(name)s`。保持該形式。

`extract` 不知道的名稱會被跳過。預設列表是 `_`、`t`、`translate`、`i18n.t`、`gettext`、`ngettext`、`pgettext` 和 `self.tr`。如果程式碼直接呼叫 `gettext_lazy("…")`、`ngettext_lazy`、`pgettext_lazy`、`npgettext` 或 `gettext_noop`，請將這些名稱新增到 `ui.uiExtractor.funcNames`。當您將惰性函數匯入為 `_` 時，如 `gettext_lazy as _` 所示，名稱 `_` 已被涵蓋。

包裝人們看到的文字：標籤、標題、訊息、表單和模型文字、電子郵件。讓識別碼、URL、欄位名稱、設定鍵、日誌訊息和遷移保持不變。不要改寫原始文字。缺少翻譯會返回原始句子，因此應用程式在原始語言中看起來相同。

這些呼叫在查詢之前評估格式，因此字串永遠不會匹配目錄條目：

```python
_(f"Hello, {name}!")
_("Hello, %s!" % name)
_("Hello, {name}!".format(name=name))
```

<a id="step-3-extract-and-check-the-calls"></a>
## 步驟 3：提取並檢查呼叫

一旦呼叫被包裝後，請執行 `extract`。它會寫入提取快取，並從您現有的 `.po` 檔案中填補空白位置。它不會呼叫模型。

```bash
ai-i18n-tools extract
```

然後尋找在查詢前進行格式化的呼叫。`migrate-python-i18n` 會找到它們。在沒有 `--write` 的情況下執行它：

```bash
ai-i18n-tools migrate-python-i18n
```

它會寫入 `migrate-python-i18n-report.md`。閱讀它，並使用 `%(name)s` 和字典手動修正每個列出的呼叫。刪除報告或將其加入 git 忽略清單。

請勿在此頁面傳遞 `--write`。該選項會將 f-string 或 `.format()` 呼叫重寫為 `t("…", name=name)`，這是一個僅存在於 `i18n.py` 輔助程式中的呼叫。gettext 應用程式沒有 `t`。沒有任何行的報告表示包裝的呼叫是安全的。這並不表示每個句子都已包裝，因此請閱讀 `strings.json` 的差異，並尋找您預期會看到的文字。

<a id="step-4-switch-language-at-runtime"></a>
## 步驟 4：在執行時切換語言

您的框架會選擇語言。ai-i18n-tools 不會新增選單或輔助程式。

<a id="django"></a>
### Django

在 `settings.py` 中：

```python
LANGUAGE_CODE = "en"
LANGUAGES = [
    ("en", "English"),
    ("pt-br", "Português (Brasil)"),
]
LOCALE_PATHS = [BASE_DIR / "locale"]

MIDDLEWARE = [
    # ...
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "django.middleware.common.CommonMiddleware",
    # ...
]
```

`LocaleMiddleware` 位於會話中介軟體之後和 `CommonMiddleware` 之前。`LANGUAGE_CODE` 是原始語言。`LANGUAGES` 列出了訪客可以選擇的語言。`LOCALE_PATHS` 指向 `gettext.outputDir` 寫入的資料夾，除非每個應用程式都保留自己的 `locale/` 資料夾。

將 Django 的語言切換視圖新增至 `urls.py`：

```python
from django.urls import include, path

urlpatterns = [
    path("i18n/", include("django.conf.urls.i18n")),
    # ...
]
```

然後將表單新增至範本：

```jinja
{% load i18n %}
{% get_current_language as CURRENT %}
{% get_available_languages as LANGUAGES %}
<form action="{% url 'set_language' %}" method="post">
  {% csrf_token %}
  <input name="next" type="hidden" value="{{ request.get_full_path }}">
  <select name="language" onchange="this.form.submit()">
    {% for code, name in LANGUAGES %}
      <option value="{{ code }}"{% if code == CURRENT %} selected{% endif %}>{{ name }}</option>
    {% endfor %}
  </select>
</form>
```

該視圖會將選擇儲存到 cookie 中。若要將語言放入 URL 中，請改用 `i18n_patterns`。兩者都是標準的 Django 功能。請參閱 Django 關於國際化的文件。

<a id="plain-gettext-and-flask-babel"></a>
### 純 gettext 和 Flask-Babel

載入您想要的語言目錄並呼叫它。[python-gettext](/zh-Hant/examples#python-gettext) 範例在命令列工具中執行此操作：

```python
import gettext
from pathlib import Path

LOCALEDIR = Path(__file__).resolve().parent / "locales"


def load_catalog(lang: str) -> gettext.NullTranslations:
    code = lang.replace("-", "_")
    return gettext.translation("messages", localedir=str(LOCALEDIR), languages=[code], fallback=True)


_ = load_catalog("pt-BR").gettext
print(_("Hello"))
```

將 `pt-BR` 轉換為 `pt_BR`，這是 `translate-ui` 寫入的資料夾名稱。保留 `fallback=True`，以便缺少目錄時顯示原始文字。在網路應用程式中，為每個請求建立翻譯物件，並且不要使用 `gettext.install` 全域安裝一個，否則並行請求將共用一種語言。在 Flask-Babel 中，從您的地區設定選擇器函數返回代碼，並將 `translations/` 作為其翻譯目錄。

這是最後一個手動步驟。繼續前往 [選擇模型並翻譯](#translate)。

<a id="not-your-case"></a>
## 情況不同？

| 您擁有 | 閱讀 |
| --- | --- |
| 沒有 gettext 的 Streamlit、FastAPI、Flask、桌面或腳本應用程式 | [將 i18n 新增至 Python 應用程式](/zh-Hant/guide/add-i18n-to-python) |
| JS/TS 應用程式 | [將 i18n 新增至 JS/TS 應用程式](/zh-Hant/guide/add-i18n-to-js) |
| 網站或文件網站 | [為網站或文件網站新增 i18n](/zh-Hant/guide/add-i18n-to-website) |
| 儲存庫 README 或其他 Markdown 檔案 | [為您的 README 和 Markdown 文件新增 i18n](/zh-Hant/guide/add-i18n-to-readme) |

<a id="examples"></a>
## 範例

| 範例 | 顯示內容 |
| --- | --- |
| [python-gettext](/zh-Hant/examples#python-gettext) | 現有的 gettext 命令列工具；`translate-ui` 重新整理 `.po` 和 `.mo` |

沒有 Django 範例目錄。`python-gettext` 範例顯示了具有網域 `messages` 的相同配置形狀。使用 `npx degit` 複製它，或從 GitHub 發行版下載 `ai-i18n-tools-python-examples.zip`。命令：[範例](/zh-Hant/examples#python-examples)。
