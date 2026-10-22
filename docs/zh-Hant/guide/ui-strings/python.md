<a id="python"></a>
# Python 應用程式

`ai-i18n-tools` 從 Python 以及 Jinja、Django 和 Qt `.ui` 檔案中提取 UI 字串，然後寫入扁平化的英文鍵值 JSON、GNU gettext 目錄，或兩者皆有。執行階段輔助程式是一個標準函式庫 `i18n.py`（Python 3.10 或更新版本）。Streamlit、Tkinter、PyQt、PySide、PyWebView、Flask、Pyramid 和 FastAPI 會呼叫該輔助程式。Django 則使用 Django 自身的 gettext。

可執行的副本位於 `examples/python-streamlit`、`examples/python-flask`、`examples/python-fastapi` 和 `examples/python-gettext` 中。它們是 Python 專案。前三個使用虛擬環境 (virtualenv) 和 `pip install -r requirements.txt`。`python-gettext` 僅使用標準函式庫。它們不是 npm 套件。發行封存檔 `ai-i18n-tools-python-examples.zip` 包含相同的四個目錄。npm tarball 和獨立執行檔則不包含。

<a id="init"></a>
## 鷹架 (Scaffold)

```bash
ai-i18n-tools init -t ui-python
ai-i18n-tools init -t ui-python-gettext
ai-i18n-tools init -t ui-python-flask
ai-i18n-tools init -t ui-python-django
```

`ui-python` 寫入扁平 JSON 和 `i18n.py`。`ui-python-gettext` 寫入 JSON 和 `.po` / `.mo`。`ui-python-flask` 在 `translations/` 和 `i18n.py` 下寫入 gettext 目錄。`ui-python-django` 寫入 `locale/<lang>/LC_MESSAGES/django.po` 且不會寫入 `i18n.py`。

掃描根目錄會跳過 `node_modules`、`.git`、`.venv`、`venv`、`env`、`site-packages`、`__pycache__`、`.tox`、`.nox`、`.pytest_cache`、`.mypy_cache`、`.ruff_cache` 和 `.eggs`。

<a id="calls"></a>
## 進行翻譯的呼叫

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

扁平 JSON 鍵為英文原始碼。內容使用 `context` + U+0004 + 英文原始碼。複數插槽保留為 `{md5}_one`、`{md5}_other` 以及 `translate-ui` 已經寫入的其他 CLDR 格式。輔助程式會使用 MD5 對修剪後的單數形式進行雜湊處理，並讀取前 8 個十六進位字元。

Gettext 檔案使用 `msgctxt` 作為內容，並使用 `msgid` / `msgid_plural` 作為複數形式。`ui.gettext.compileMo` 會將 `.mo` 寫在 `.po` 旁邊。`purge-locale` 會刪除該地區設定的 `.po` 和 `.mo`。當 `flatOutput` 為 false 時，它會保持扁平 JSON 檔案不變，因為它們未被寫入。

`t(..., plurals=True)` 若具有英文來源地區設定和明確的複數來源，將會跳過模型並儲存來自來源字串的 `one` / `other`。

<a id="locale"></a>
## 各框架中的地區設定

`set_locale` 會傳回 `ContextVar` 權杖。請在 `finally` 中重設它，包含 FastAPI 和 Flask 中介軟體，以確保並行請求不會洩漏地區設定。

- **Streamlit.** `streamlit_language_selector(sidebar=True, key="lang_selector")` 會寫入 `st.session_state.locale` 與 `st.query_params["lang"]`。請為每個小工具提供固定的 `key`。請參閱 `examples/python-streamlit`。
- **FastAPI.** 在中介軟體中讀取 `?lang=` 或 `Accept-Language`，呼叫 `set_locale`，並在 `finally` 中執行 `reset_locale`。路由會呼叫 `t()` 與 `_()`。請參閱 `examples/python-fastapi`。
- **Flask 和 Pyramid.** 從請求中設定地區設定，並將 `_`、`t`、`current_locale`、`ui_languages` 與 `direction` 注入至範本內容。請參閱 `examples/python-flask`。
- **現有的 gettext.** 保留 `_()`、`gettext()` 與 `ngettext()` 原樣。將 `ui.gettext` 指向目前的 `locales/` 樹狀結構，然後執行 `extract` 與 `translate-ui`。請參閱 `examples/python-gettext`。
- **Django.** 使用 `gettext`、`ngettext` 與 `{% blocktrans %}`。初始化範本 `ui-python-django` 以符合 Django 的 `locale/` 目錄與 `django` 網域。
- **Tkinter.** 在建立每個小工具時呼叫 `t()` 或 `_()`，然後在 `set_locale` 之後重建可見文字。
- **PyQt / PySide.** `self.tr("...")` 會被擷取。除非有 `notr="true"`，否則 `.ui` 檔案會提供 `<string>` 元素。`comment` 屬性會成為 gettext 內容。
- **PyWebView / PyWebKit.** 使用上述 Python 範本擷取 Python shell。使用 `data-i18n` 標記或每個地區設定一個 HTML 文件來擷取 HTML 頁面。
