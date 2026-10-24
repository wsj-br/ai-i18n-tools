<a id="add-i18n-to-a-python-app"></a>
# 為 Python 應用程式加入 i18n

此逐步解說將使用 `migrate-python-i18n`，將單一語言的 Python 應用程式新增地區設定與 ai-i18n-tools。安全呼叫站點編輯會自動套用。任何仍需檢查的項目都會列在報告中。

已經在使用 GNU gettext、Django 或 Flask 目錄了嗎？請保留這些呼叫。選擇下方對應的初始化範本，並讓 `extract` 從現有的 `.po` 檔案中填入空白的目錄欄位。

<a id="install"></a>
## 安裝

若機器已安裝 Node.js `>=22.16.0`，請使用 npm 套件 ([安裝](/zh-Hant/guide/installation))。對於 Python 專案，通常的做法是從 GitHub Release 下載獨立執行檔 — Linux (`x64`, `arm64`)、macOS (`arm64`, `x64`) 以及 Windows (`x64`)。請檢查 `SHA256SUMS.txt`，在 Unix 系統上執行 `chmod +x`，並將檔案放置於 `PATH`。這些二進位檔案未經簽署。資產名稱與校驗和：[獨立執行檔](/zh-Hant/guide/installation#standalone-executables)。

設定您傳遞給 `init` 的提供者之 API 金鑰。例如，Cheaper Inference：

```bash
export CHEAPERINFERENCE_API_KEY=your-key-here
```

Ollama 不需要金鑰。其他預設值：[內建提供者](/zh-Hant/guide/providers-and-models#built-in-providers)。

<a id="pick-a-template"></a>
## 選擇範本

| 現有應用程式 | 指令 | 您會得到什麼 |
| --- | --- | --- |
| 硬式編碼字串，或新的 `t()` / `_()` 呼叫 | `ai-i18n-tools init -t ui-python -P cheaperinference` | 平面英文鍵 JSON 和 `i18n.py` |
| GNU gettext，而且您也想要平面 JSON | `ai-i18n-tools init -t ui-python-gettext -P anthropic` | JSON 加上 `.po` / `.mo`，以及 `i18n.py` |
| `translations/` 下的 Flask 或 Jinja 目錄 | `ai-i18n-tools init -t ui-python-flask -P groq` | Gettext 目錄和 `i18n.py` |
| Django `gettext` / `{% blocktrans %}` | `ai-i18n-tools init -t ui-python-django -P ollama` | `locale/<lang>/LC_MESSAGES/django.po` (無 `i18n.py`) |

編輯 `sourceLocale` 與 `targetLocales`。`sourceLocale` 是原始碼中字串的語言（通常為 `en`）。框架整合：[Python 整合](/zh-Hant/guide/integrations/python)。呼叫格式與目錄配置：[Python 應用程式](/zh-Hant/guide/ui-strings/python)。

<a id="wrap-strings"></a>
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

<a id="migrate"></a>
## 遷移呼叫點

在傳入 `--write` 之前，`migrate-python-i18n` 僅為試運行。它總是會寫入 `migrate-python-i18n-report.md`。產生的 `i18n.py` 檔案會被略過。諸如 `{value=}` 與巢狀格式規範等除錯欄位會被回報並保留在原處。

```bash
ai-i18n-tools migrate-python-i18n
ai-i18n-tools migrate-python-i18n --write
```

當試運行列出需要人工審查的站點時，請在執行 `--write` 前閱讀報告。選用的 `--report <path>` 可變更報告路徑。選用的 `--ui-block` 可將掃描限制在單一 UI 區塊。

<a id="translate"></a>
## 選擇模型並進行翻譯

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

<a id="switch-locale"></a>
## 在執行階段切換地區設定

`set_locale` 會傳回一個 `ContextVar` 權杖。請在請求或回呼結束時重設它。

```python
token = set_locale(code)
try:
    text = t("Hello, {name}!", name=name)
finally:
    reset_locale(token)
```

FastAPI 與 Flask 中介軟體必須在 `finally` (Flask: `teardown_request`) 中進行重設，以確保並行請求不會洩漏地區設定。Django 專案會保留 Django 的地區設定啟用機制，且不會使用 `i18n.py`。各框架注意事項：[各框架中的地區設定](/zh-Hant/guide/ui-strings/python#locale)。

<a id="examples"></a>
## 範例

| 範例 | 顯示內容 |
| --- | --- |
| [python-streamlit](/zh-Hant/examples#python-streamlit) | 儀表板、`t()` / `_()`、扁平化 JSON |
| [python-fastapi](/zh-Hant/examples#python-fastapi) | 請求範圍的地區設定、扁平化 JSON |
| [python-flask](/zh-Hant/examples#python-flask) | Flask + Jinja、扁平化 JSON |
| [python-gettext](/zh-Hant/examples#python-gettext) | 現有的 gettext CLI；`translate-ui` 會重新整理 `.po` 與 `.mo` |

使用 `npx degit` 複製一個，或從 GitHub Release 下載 `ai-i18n-tools-python-examples.zip`。指令：[範例](/zh-Hant/examples#python-examples)。
