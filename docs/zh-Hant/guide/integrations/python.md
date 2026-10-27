<a id="python"></a>
# Python

Python 應用程式選擇器。擷取、目錄和呼叫形式可在 [Python 應用程式](/zh-Hant/guide/ui-strings/python) 中找到。為現有的單一語系應用程式新增功能的逐步說明請見 [為 Python 應用程式新增 i18n](/zh-Hant/guide/add-i18n-to-python)，其中包含 [`i18n.py` 提示](/zh-Hant/guide/add-i18n-to-python#agent-prompt-i18n-py) 和 [Django / gettext 提示](/zh-Hant/guide/add-i18n-to-python#agent-prompt-django-gettext)。

Streamlit、FastAPI、Flask、Pyramid、Tkinter、PyQt、PySide 與 PyWebView 會呼叫產生的 `i18n.py` 輔助程式（Python 3.10 或更新版本）。Django 則保留 Django 的 gettext。儲存庫中隨附四個可執行的副本：`examples/python-streamlit`、`examples/python-flask`、`examples/python-fastapi` 與 `examples/python-gettext`。Pyramid、Django、Tkinter、Qt 與 PyWebView 沒有獨立的範例目錄。

<a id="which-template"></a>
## 選擇模板

| 框架 | 初始化範本 | 目錄 | 範例 |
| --- | --- | --- | --- |
| Streamlit | `ui-python` | 以來源字串為鍵的扁平 JSON | [python-streamlit](/zh-Hant/examples#python-streamlit) |
| FastAPI | `ui-python` | 以來源字串為鍵的扁平 JSON | [python-fastapi](/zh-Hant/examples#python-fastapi) |
| Flask + Jinja, flat JSON | `ui-python` | 以來源字串為鍵的扁平 JSON | [python-flask](/zh-Hant/examples#python-flask) |
| Flask / Jinja gettext | `ui-python-flask` | `.po` / `.mo` 位於 `translations/` 下 | 請參閱下方的 Flask 說明 |
| Pyramid | `ui-python` 或 `ui-python-flask` | 同 Flask | 與 Flask 的連接方式相同 |
| Django | `ui-python-django` | `locale/<lang>/LC_MESSAGES/django.po` | 無範例目錄 |
| 現有 GNU gettext | `ui-python-gettext` | 平面 JSON 與 `.po` / `.mo`，或僅使用 gettext | [python-gettext](/zh-Hant/examples#python-gettext) |
| Tkinter | `ui-python` | 以來源字串為鍵的扁平 JSON | 沒有範例目錄 |
| PyQt / PySide | `ui-python` 或 gettext 模板 | 平面 JSON 與/或 `.po` | 無範例目錄 |
| PyWebView / PyWebKit | 用於 Shell 的 Python 模板 | Shell 目錄，外加 HTML 標記或每個語言環境一個 HTML 檔案 | 無範例目錄 |

`ui-python`、`ui-python-gettext` 和 `ui-python-flask` 會在 `i18n.py` 檔案遺失時寫入該檔案。`ui-python-django` 則不會。新增 `--with-readme` 以同時翻譯儲存庫的 README：[為您的 README 和 Markdown 文件新增 i18n](/zh-Hant/guide/add-i18n-to-readme)。

<a id="framework-notes"></a>
## 框架說明

<a id="streamlit"></a>
### Streamlit

`streamlit_language_selector()` 會將語言環境寫入工作階段狀態與查詢字串中。請為每個小工具提供固定的 `key`。詳細資訊：[Locale — Streamlit](/zh-Hant/guide/ui-strings/python#streamlit)。

<a id="fastapi"></a>
### FastAPI

在中間件中讀取 `?lang=` 或 `Accept-Language`，呼叫 `set_locale`，並在 `finally` 中執行 `reset_locale`，以便並行請求能各自維持其語言環境。詳細資訊：[Locale — FastAPI](/zh-Hant/guide/ui-strings/python#fastapi)。

<a id="flask-and-pyramid"></a>
### Flask 和 Pyramid

[python-flask](/zh-Hant/examples#python-flask) 範例使用扁平化 JSON。`init -t ui-python-flask` 是 `translations/` 下的 gettext 配置，適用於已經使用 Flask-Babel 風格目錄的應用程式。無論哪種方式，請從請求中設定地區設定 (locale)，並將 `_`、`t`、`current_locale`、`ui_languages` 和 `direction` 注入到模板上下文中。Pyramid 使用相同的請求範圍模式。詳細資訊：[Locale — Flask and Pyramid](/zh-Hant/guide/ui-strings/python#flask)。

<a id="django"></a>
### Django

保留 `gettext`、`ngettext` 和 `{% blocktrans %}`。`init -t ui-python-django` 會對應 Django 的 `locale/` 目錄與 `django` 網域，並保留 Django 的執行階段。詳細資訊：[Locale — Django](/zh-Hant/guide/ui-strings/python#django)。

<a id="existing-gettext"></a>
### 現有的 gettext

保留 `_()`、`gettext()` 和 `ngettext()`。將 `ui.gettext` 指向目前的目錄樹並執行 `extract`，然後執行 `translate-ui`。[python-gettext](/zh-Hant/examples#python-gettext) 範例僅使用 gettext (`flatOutput: false`)。`init -t ui-python-gettext` 也會寫入扁平化 JSON。詳細資訊：[Locale — Existing gettext](/zh-Hant/guide/ui-strings/python#gettext)。

<a id="tkinter-qt-and-pywebview"></a>
### Tkinter、Qt 和 PyWebView

在建立每個 Tkinter 元件時呼叫 `t()` 或 `_()`，然後在 `set_locale` 之後重建可見文字。PyQt 與 PySide 的 `self.tr("...")` 呼叫會被提取，且除非設定了 `notr="true"`，否則 Qt `.ui` 檔案會提供 `<string>` 元素。對於 PyWebView 或 PyWebKit，請使用上方的模板提取 Python shell，並使用 `data-i18n` 標記或每個地區設定一個 HTML 文件的方式來提取 HTML 頁面。詳細資訊：[Locale — Tkinter](/zh-Hant/guide/ui-strings/python#tkinter)、[PyQt / PySide](/zh-Hant/guide/ui-strings/python#pyqt) 以及 [PyWebView](/zh-Hant/guide/ui-strings/python#pywebview)。
