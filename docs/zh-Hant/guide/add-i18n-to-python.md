<a id="add-i18n-to-a-python-app"></a>
# 為 Python 應用程式加入 i18n

本逐步教學將以一個單一語言的 Python 應用程式為例，並使用 ai-i18n-tools 為其新增語區。未經處理的使用者可見字串可手動包裝，或使用 [包裝字串](#wrap-strings) 下的提示進行包裝。`migrate-python-i18n` 只會修復已經包裝的不安全呼叫。任何仍需檢視的項目都會列於報告中。

已經在使用 GNU gettext、Django 或 Flask 目錄了嗎？請保留這些呼叫。選擇下方對應的初始化範本，並讓 `extract` 從現有的 `.po` 檔案中填入空白的目錄欄位。

步驟如下：

1. [安裝](#install-and-choose-a-provider) CLI 並設定 API 金鑰。
2. [挑選範本](#initialise-the-project) 並執行 `init`。
3. 在 `t()` 或 `_()` 中 [包裝字串](#wrap-strings)。
4. [遷移](#step-3-check-wrapped-calls) 已經不安全地包裝的呼叫位置。
5. [選擇模型並翻譯](#choose-models-and-translate)。
6. [在執行階段切換語區](#step-4-add-a-language-switch)。
7. [維持翻譯狀態](#keep-it-translated)。

不確定這是否符合您的情況？請參閱結尾的 [不符合您的情況？](#not-your-case)。

<a id="install-and-choose-a-provider"></a>
## 安裝

當機器上已有 Node.js `>=22.16.0` 時，請使用 npm 套件 ([安裝](/zh-Hant/guide/installation))。若是 Python 專案，請安裝獨立可執行檔 (無需 Node.js)。

Linux 和 macOS：

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell)：

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

安裝程式會檢查 `SHA256SUMS.txt`，將指令安裝為 `ai-i18n-tools`，並將其新增至 `PATH`。二進位檔未經公證或 Authenticode 簽署。手動步驟和資產名稱：[獨立可執行檔](/zh-Hant/guide/installation#standalone-executables)。

設定您傳遞給 `init` 的提供者之 API 金鑰。例如，Cheaper Inference：

```bash
export CHEAPERINFERENCE_API_KEY=your-key-here
```

Ollama 不需要金鑰。其他預設值：[內建提供者](/zh-Hant/guide/providers-and-models#built-in-providers)。

<a id="initialise-the-project"></a>
## 選擇範本

| 現有應用程式 | 指令 | 您會得到什麼 |
| --- | --- | --- |
| 硬式編碼的字串，或新的 `t()` / `_()` 呼叫 | `ai-i18n-tools init -t ui-python -P cheaperinference` | 以來源語言字串為鍵的扁平 JSON，以及 `i18n.py` |
| GNU gettext，而且您也想要平面 JSON | `ai-i18n-tools init -t ui-python-gettext -P anthropic` | JSON 加上 `.po` / `.mo`，以及 `i18n.py` |
| `translations/` 下的 Flask 或 Jinja 目錄 | `ai-i18n-tools init -t ui-python-flask -P groq` | Gettext 目錄和 `i18n.py` |
| Django `gettext` / `{% blocktrans %}` | `ai-i18n-tools init -t ui-python-django -P ollama` | `locale/<lang>/LC_MESSAGES/django.po` (無 `i18n.py`) |

編輯 `sourceLocale` 和 `targetLocales`。`sourceLocale` 是原始碼中字串的語言。任何 BCP-47 語言皆有效；範例通常使用 `en`。框架接線：[Python 整合](/zh-Hant/guide/integrations/python)。呼叫形式和目錄版面配置：[Python 應用程式](/zh-Hant/guide/ui-strings/python)。

<a id="run-the-agent-prompt"></a>
## 封裝字串

先查詢目錄項目，然後進行插值。從產生的 `i18n.py` 匯入 `t` 與 `_`（Django 保留 `gettext` 與 `ngettext`）。

```python
t("Hello, {name}!", name=name)
_("Hello, %s!") % name
_("Total: {price:,.2f}").format(price=price)
```

這些會在任何目錄查詢之前進行評估。提取器會將其標記為不安全，而 `migrate-python-i18n` 會將其重寫：

```python
_(f"Hello, {name}!")
_("Hello, %s!" % name)
_("Hello, {name}!".format(name=name))
```

<a id="agent-prompt-i18n-py"></a>

<a id="agent-prompt-i18npy-helper"></a>

將此用於 Streamlit、FastAPI、使用扁平 JSON 的 Flask、Tkinter、Qt 和 PyWebView 殼層。將其複製到編碼代理中。Django 或現有的 gettext 專案應改用 [下一個提示](#agent-prompt-django-gettext)。

<details class="agent-prompt">
<summary>代理提示：i18n.py 協助程式</summary>

````markdown
# Wrap user-facing Python strings with i18n.py

## Context

ai-i18n-tools extracts only string literals passed to `t()` or `_()` (and the
other names in `ui.uiExtractor.funcNames`). The literal is the source-language
sentence and the catalog key. After this edit the app must behave the same when
the active locale is the source locale. Do not translate any string.

Call shapes: https://wsj-br.github.io/ai-i18n-tools/guide/ui-strings/python

## Scope

Read `ui.sourceRoots` in `ai-i18n-tools.config.json` and edit Python (and Jinja
templates) under those roots. Skip class names, URLs and routes, import paths,
ids, enum and error codes, object keys used as identifiers, log field names,
regexes, comments, and text that is already wrapped. Do not edit the generated
`i18n.py`.

## Call shape

Import `t` and `_` from the generated `i18n.py`. Placeholders are `{name}` or
`{price:,.2f}`, passed as keyword arguments. `_("…") % x` and `_("…").format(…)`
are safe because the lookup happens first.

Never `_(f"…")`, `_("…" % x)`, or `_("…".format(…))`. If one slips in,
`migrate-python-i18n` can rewrite it later.

Before:

```python
st.write(f"Hello, {name}!")
```

After:

```python
st.write(t("Hello, {name}!", name=name))
```

Framework notes:

- Streamlit widgets keep a fixed `key=`.
- Tkinter text is rebuilt after `set_locale`.
- Qt uses `self.tr("…")` (already in the default function list).
- Jinja uses `{% trans %}` / `{% blocktrans %}` rather than an f-string inside
  the template.
- FastAPI and Flask middleware pair `set_locale` with `reset_locale` in
  `finally`.

## Order

1. `ai-i18n-tools init -t ui-python` (or `ui-python-gettext` / `ui-python-flask`
   if you also want `.po` files) so `i18n.py` exists.
2. Wrap call sites.
3. Run `ai-i18n-tools extract`. Then `ai-i18n-tools migrate-python-i18n` (dry
   run) and read the report.

## Do not

- Do not translate, rename, or reword the source text.
- Do not introduce semantic keys.
- Do not create a second helper besides `i18n.py`.
- Do not hand-edit `strings.json`, flat locale JSON, `.po` / `.mo`, or
  `ui-languages.json`.
- Do not change behaviour, layout, or test selectors.

## Verify

- `ai-i18n-tools extract` writes a non-empty catalog.
- The project's tests pass.
- The source locale still shows the original sentences. One target locale shows
  translations after `translate-ui`.

## Report back

List files changed, each string you deliberately skipped with a one-line reason,
and any ambiguous case left for a human (the same word with different meanings,
concatenated sentences, or plurals).
````

</details>

<a id="agent-prompt-django-gettext"></a>

<a id="agent-prompt-django-and-native-gettext"></a>

當應用程式已在呼叫 Django 或 GNU gettext，或當您想繼續使用 `.po` 目錄時，請使用此項。請勿新增 `i18n.py`。

init 範本會精確辨識這些呼叫名稱：`_`、`t`、`translate`、`i18n.t`、`gettext`、`ngettext`、`pgettext` 和 `self.tr`。延遲和無操作變體不在該清單中。請將專案實際呼叫的名稱 (通常是 `gettext_lazy`、`ngettext_lazy`、`pgettext_lazy` 和 `gettext_noop`) 新增至 `ui.uiExtractor.funcNames`，否則 `extract` 會略過它們。只有在名稱被列出後，`ngettext_lazy` 才會被讀取為單數加複數，而 `pgettext_lazy` 則會被讀取為情境加訊息。範本中的 `{% trans %}` 和 `{% blocktrans %}` 會被單獨收集。

<details class="agent-prompt">
<summary>代理提示：Django 和原生 gettext</summary>

````markdown
# Wrap user-facing strings with Django / gettext

## Context

ai-i18n-tools extracts string literals passed to gettext calls whose names are
listed in `ui.uiExtractor.funcNames`, plus `{% trans %}` and `{% blocktrans %}`
in templates. The literal is the source-language message. Existing `.po` files
stay; `extract` fills empty catalog slots from them when
`ui.gettext.ingestExistingPo` is on (the default). Do not translate any string.
Do not create `i18n.py`.

## Scope

Edit Python modules, Django templates, and forms under `ui.sourceRoots`. Skip
URLs, import paths, ids, field names used as identifiers, `verbose_name` keys
that are already lazy-wrapped, comments, and migrations that must not change. Do
not wrap strings inside `help_text` that are already `gettext_lazy` calls.

## Call shape

Init with `ui-python-django` (Django `locale/` and the `django` domain) or
`ui-python-gettext` (existing GNU catalogs). Use `gettext`, `ngettext`,
`pgettext`, and `{% blocktrans %}` / `{% trans %}`. Placeholders are `%(name)s`.

Module-level model, form, and settings strings use the lazy form. Add every lazy
or noop name you call to `ui.uiExtractor.funcNames` (for example `gettext_lazy`,
`ngettext_lazy`, `pgettext_lazy`, and `gettext_noop`). The default list does not
include them.

Before:

```python
verbose_name = "Display name"
```

After:

```python
from django.utils.translation import gettext_lazy as _

verbose_name = _("Display name")
```

Template:

```django
{% blocktrans with name=user.name %}Hello, {{ name }}{% endblocktrans %}
```

The extractor stores that message with a `%(name)s` placeholder. Do not switch
Django templates to `{name}` or to i18next `{{name}}` inside a Python `t()`
call.

## Order

1. Pick `ui-python-django` or `ui-python-gettext`. Confirm `funcNames` includes
   every gettext function the code calls.
2. Wrap call sites. Keep existing `.po` files.
3. Run `ai-i18n-tools extract`.

## Do not

- Do not translate, rename, or reword msgid text.
- Do not add `i18n.py` or a flat-JSON `t()` helper next to Django's gettext.
- Do not hand-edit generated `.po`, `.mo`, `strings.json`, or
  `ui-languages.json`.
- Do not change model field names, migrations, or test selectors.

## Verify

- `ai-i18n-tools extract` lists the new messages and does not drop existing
  msgid entries that `ingestExistingPo` already filled.
- Django checks and the project's tests pass.
- The source locale still shows the original copy.

## Report back

List files changed, each string you deliberately skipped with a one-line reason,
function names you added to `funcNames`, and any ambiguous case left for a
human.
````

</details>

<a id="review-the-result"></a>
## 遷移呼叫位置

在傳入 `--write` 之前，`migrate-python-i18n` 僅為試運行。它總是會寫入 `migrate-python-i18n-report.md`。產生的 `i18n.py` 檔案會被略過。諸如 `{value=}` 與巢狀格式規範等除錯欄位會被回報並保留在原處。

```bash
ai-i18n-tools migrate-python-i18n
ai-i18n-tools migrate-python-i18n --write
```

當試運行列出需要人工審查的站點時，請在執行 `--write` 前閱讀報告。選用的 `--report <path>` 可變更報告路徑。選用的 `--ui-block` 可將掃描限制在單一 UI 區塊。

<a id="choose-models-and-translate"></a>
## 選擇模型並翻譯

來自 `init` 的模型列表是一個起點。對目前啟用提供者的聊天模型進行排序，當候選清單看起來正確時，將其寫入 `translationModels`：

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` 僅會取代 `translationModels`。相同的排名位於 [Models](/zh-Hant/guide/translation-dashboard/models) 分頁中。接著提取並翻譯：

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
```

`extract` 會寫入 `strings.json` 與 `ui-languages.json`。`translate-ui` 會填入扁平化 JSON 檔案，且當設定 `ui.gettext` 時，會填入 `.po` / `.mo` 目錄。請勿手動編輯這些產生的目錄。

<a id="check-one-language"></a>
## 在執行階段切換語系

`set_locale` 會傳回一個 `ContextVar` 權杖。請在請求或回呼結束時重設它。

```python
token = set_locale(code)
try:
    text = t("Hello, {name}!", name=name)
finally:
    reset_locale(token)
```

FastAPI 與 Flask 中介軟體必須在 `finally` (Flask: `teardown_request`) 中進行重設，以確保並行請求不會洩漏地區設定。Django 專案會保留 Django 的地區設定啟用機制，且不會使用 `i18n.py`。各框架注意事項：[各框架中的地區設定](/zh-Hant/guide/ui-strings/python#locale)。

<a id="keep-it-translated"></a>
## 保持翻譯更新

變更來源文字後，請重新執行 `ai-i18n-tools sync` (或先執行 `extract` 再執行 `translate-ui`)。快取機制代表只有新的或變更的字串會傳送至模型。請在 CI 中執行，以免翻譯內容偏離。`ai-i18n-tools dashboard` 會開啟 [翻譯儀表板](/zh-Hant/guide/translation-dashboard/) 以檢閱翻譯。

若要在同一次執行中翻譯 `README.md`，請使用 `--with-readme` 建立架構 (或將該區塊新增至現有設定檔)。請參閱 [為您的 README 和 Markdown 文件新增 i18n](/zh-Hant/guide/add-i18n-to-readme)。

<a id="do-it-by-hand"></a>
## 情況不同？

| 您的情況 | 請閱讀 |
| --- | --- |
| JS/TS 應用程式 | [為 JS/TS 應用程式新增 i18n](/zh-Hant/guide/add-i18n-to-js) |
| 網站或文件網站 | [為網站或文件網站新增 i18n](/zh-Hant/guide/add-i18n-to-website) |
| 儲存庫 README 或其他 Markdown 檔案 | [為您的 README 和 Markdown 文件新增 i18n](/zh-Hant/guide/add-i18n-to-readme) |
| 巢狀語系 JSON | [JSON](/zh-Hant/guide/json) |

<a id="step-1-place-the-helper-and-the-catalogs"></a>
## 範例

| 範例 | 顯示內容 |
| --- | --- |
| [python-streamlit](/zh-Hant/examples#python-streamlit) | 儀表板、`t()` / `_()`、扁平化 JSON |
| [python-fastapi](/zh-Hant/examples#python-fastapi) | 請求範圍的地區設定、扁平化 JSON |
| [python-flask](/zh-Hant/examples#python-flask) | Flask + Jinja、扁平化 JSON |
| [python-gettext](/zh-Hant/examples#python-gettext) | 現有的 gettext CLI；`translate-ui` 會重新整理 `.po` 與 `.mo` |

使用 `npx degit` 複製一個，或從 GitHub Release 下載 `ai-i18n-tools-python-examples.zip`。指令：[範例](/zh-Hant/examples#python-examples)。
