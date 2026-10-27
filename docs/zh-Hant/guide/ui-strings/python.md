<a id="python-applications"></a>
# Python 應用程式

`ai-i18n-tools` 會從 Python、Jinja、Django 和 Qt `.ui` 檔案中擷取 UI 字串，然後寫入以來源語言字串為鍵的扁平 JSON、GNU gettext 目錄，或兩者皆是。`sourceLocale` 可以是任何語言。執行階段協助程式是標準程式庫 `i18n.py` (Python 3.10 或更新版本)。Streamlit、Tkinter、PyQt、PySide、PyWebView、Flask、Pyramid 和 FastAPI 會呼叫該協助程式。Django 則使用其自己的 gettext。

將地區設定新增至現有的單一語言應用程式：[為 Python 應用程式新增 i18n](/zh-Hant/guide/add-i18n-to-python)，包括 [`i18n.py` 提示](/zh-Hant/guide/add-i18n-to-python#agent-prompt-i18n-py) 和 [Django / gettext 提示](/zh-Hant/guide/add-i18n-to-python#agent-prompt-django-gettext)。框架選擇器：[Python 整合](/zh-Hant/guide/integrations/python)。函數清單：[Python 執行階段 (`i18n.py`)](/zh-Hant/reference/programmatic-api#python-runtime)。

可執行的副本位於 `examples/python-streamlit`、`examples/python-flask`、`examples/python-fastapi` 和 `examples/python-gettext` 中。它們是 Python 專案。前三個使用虛擬環境 (virtualenv) 和 `pip install -r requirements.txt`。`python-gettext` 僅使用標準函式庫。它們不是 npm 套件。發行封存檔 `ai-i18n-tools-python-examples.zip` 包含相同的四個目錄。npm tarball 和獨立執行檔則不包含。

<a id="scaffold"></a>
## 鷹架

```bash
ai-i18n-tools init -t ui-python -P cheaperinference
ai-i18n-tools init -t ui-python-gettext -P anthropic
ai-i18n-tools init -t ui-python-flask -P groq
ai-i18n-tools init -t ui-python-django -P ollama
```

`ui-python` 寫入扁平 JSON 和 `i18n.py`。`ui-python-gettext` 寫入 JSON 和 `.po` / `.mo`。`ui-python-flask` 在 `translations/` 和 `i18n.py` 下寫入 gettext 目錄。`ui-python-django` 寫入 `locale/<lang>/LC_MESSAGES/django.po` 且不會寫入 `i18n.py`。

也請翻譯儲存庫的 README：將 `--with-readme` 新增至上述的 `init` 指令。請參閱 [為您的 README 和 Markdown 文件新增 i18n](/zh-Hant/guide/add-i18n-to-readme)。

掃描根目錄會跳過 `node_modules`、`.git`、`.venv`、`venv`、`env`、`site-packages`、`__pycache__`、`.tox`、`.nox`、`.pytest_cache`、`.mypy_cache`、`.ruff_cache` 和 `.eggs`。

<a id="calls-that-translate"></a>
## 翻譯呼叫

先查詢目錄項目，然後進行插值。

可攜式：

```python
t("Hello, {name}!", name=name)
t("Total: {price:,.2f}", price=price)
_("Hello, %s!") % name
_("Total: {price:,.2f}").format(price=price)
```

在 Python 3.14 上，輔助程式也接受範本字串：

```python
translate(t"Hello, {name}!")
```

`translate` 是 `t` 的別名。關鍵字引數會覆寫從範本字串取得的值。

原生 gettext，由於範本是引數，因此仍然安全：

```python
_("Hello, %s!") % name
ngettext("1 file", "{count} files", count, count=count)
pgettext("menu", "Open")
```

這些會在任何目錄查詢之前進行評估，因此提取器會將其標記為不安全，且 `migrate-python-i18n` 會重寫它們：

```python
_(f"Hello, {name}!")
_("Hello, %s!" % name)
_("Hello, {name}!".format(name=name))
```

`migrate-python-i18n` 在您傳入 `--write` 之前屬於試執行 (dry run)。它會寫入 `migrate-python-i18n-report.md`。諸如 `{value=}` 之類的偵錯欄位和巢狀格式規格會被回報並保留在原處。

`{% trans %}` 和 `{% blocktrans %}` 會變成 gettext `%(name)s` 預留位置。Jinja 會去除並摺疊空白字元。Django 會保留內部空白字元，除非標籤指定了 `trimmed`。

<a id="catalogs"></a>
## 目錄

扁平 JSON 的鍵是來源語言字串，即 `sourceLocale` 中的文字。該語言可以是任何語言。情境會使用 `context` + U+0004 + 該來源字串。複數位置會保留 `{md5}_one`、`{md5}_other` 以及 `translate-ui` 已寫入的其他 CLDR 形式。協助程式會使用 MD5 將修剪過的單數形式進行雜湊處理，並讀取前 8 個十六進位字元。

Gettext 檔案使用 `msgctxt` 作為內容，並使用 `msgid` / `msgid_plural` 作為複數形式。`ui.gettext.compileMo` 會將 `.mo` 寫在 `.po` 旁邊。`purge-locale` 會刪除該地區設定的 `.po` 和 `.mo`。當 `flatOutput` 為 false 時，它會保持扁平 JSON 檔案不變，因為它們未被寫入。

`t(..., plurals=True)` 若具有英文來源地區設定和明確的複數來源，將會跳過模型並儲存來自來源字串的 `one` / `other`。

<a id="locale-in-each-framework"></a>
## 各框架中的地區設定

`set_locale` 會傳回 `ContextVar` 權杖。請在 `finally` 中重設它，包含 FastAPI 和 Flask 中介軟體，以確保並行請求不會洩漏地區設定。

- <a id="streamlit"></a>**Streamlit。** `streamlit_language_selector(sidebar=True, key="lang_selector")` 會寫入 `st.session_state.locale` 和 `st.query_params["lang"]`。請為每個小工具 (widget) 提供固定的 `key`。請參閱 `examples/python-streamlit`。
- <a id="fastapi"></a>**FastAPI。** 在中介軟體 (middleware) 中讀取 `?lang=` 或 `Accept-Language`，呼叫 `set_locale`，並在 `finally` 中執行 `reset_locale`。路由會呼叫 `t()` 和 `_()`。請參閱 `examples/python-fastapi`。
- <a id="flask"></a>**Flask 與 Pyramid。** 從請求中設定地區設定，並將 `_`、`t`、`current_locale`、`ui_languages` 和 `direction` 注入至模板內容中。請參閱 `examples/python-flask`。
- <a id="gettext"></a>**現有的 gettext。** 保留 `_()`、`gettext()` 和 `ngettext()`。將 `ui.gettext` 指向目前的 `locales/` 樹狀目錄，然後執行 `extract` 與 `translate-ui`。請參閱 `examples/python-gettext`。
- <a id="django"></a>**Django。** 使用 `gettext`、`ngettext` 和 `{% blocktrans %}`。初始化模板 `ui-python-django` 以符合 Django 的 `locale/` 目錄與 `django` 網域。
- <a id="tkinter"></a>**Tkinter。** 在建立每個小工具時呼叫 `t()` 或 `_()`，然後在 `set_locale` 之後重建可見文字。
- <a id="pyqt"></a>**PyQt / PySide。** `self.tr("...")` 會被提取。除非有 `notr="true"`，否則 `.ui` 檔案會提供 `<string>` 元素。`comment` 屬性會成為 gettext 內容。
- <a id="pywebview"></a>**PyWebView / PyWebKit。** 使用上述的 Python 模板提取 Python shell。使用 `data-i18n` 標記或每個地區設定一個 HTML 文件的方式來提取 HTML 頁面。
