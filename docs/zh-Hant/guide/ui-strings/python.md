<a id="python-applications"></a>
# Python 應用程式

`ai-i18n-tools` 會從 Python、Jinja、Django 和 Qt `.ui` 檔案中擷取 UI 字串，然後寫入以來源語言字串為鍵的扁平 JSON、GNU gettext 目錄，或兩者皆是。`sourceLocale` 可以是任何語言。執行階段協助程式是標準程式庫 `i18n.py` (Python 3.10 或更新版本)。Streamlit、Tkinter、PyQt、PySide、PyWebView、Flask、Pyramid 和 FastAPI 會呼叫該協助程式。Django 則使用其自己的 gettext。

將語言環境新增至現有的單一語言應用程式：[將 i18n 新增至 Python 應用程式](/zh-Hant/guide/add-i18n-to-python)，及其[代理程式提示](/zh-Hant/guide/add-i18n-to-python#run-the-agent-prompt)。對於 Django、Flask-Babel 目錄，或已使用 gettext 的應用程式：[將 i18n 新增至 Django / Python gettext 應用程式](/zh-Hant/guide/add-i18n-to-django-gettext)，及其[代理程式提示](/zh-Hant/guide/add-i18n-to-django-gettext#run-the-agent-prompt)。框架選擇器：[Python 整合](/zh-Hant/guide/integrations/python)。函數清單：[Python 執行階段 (`i18n.py`)](/zh-Hant/reference/programmatic-api#python-runtime)。

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

`migrate-python-i18n` 是預演，直到您傳遞 `--write` 為止。它會寫入 `migrate-python-i18n-report.md`。諸如 `{value=}` 和巢狀格式規範等偵錯欄位會被報告並保留在原位。`--write` 會將 f-string 和 `.format()` 呼叫轉換為 `t(...)`，這是一個僅存在於產生的 `i18n.py` 中的函數。在 gettext 或 Django 應用程式中，使用預演來尋找不安全的呼叫並使用 `%(name)s` 手動修復它們。

`{% trans %}` 和 `{% blocktrans %}` 會變成 gettext `%(name)s` 預留位置。Jinja 會去除並摺疊空白字元。Django 會保留內部空白字元，除非標籤指定了 `trimmed`。

<a id="catalogs"></a>
## 目錄

扁平 JSON 的鍵是來源語言字串，即 `sourceLocale` 中的文字。該語言可以是任何語言。情境會使用 `context` + U+0004 + 該來源字串。複數位置會保留 `{md5}_one`、`{md5}_other` 以及 `translate-ui` 已寫入的其他 CLDR 形式。協助程式會使用 MD5 將修剪過的單數形式進行雜湊處理，並讀取前 8 個十六進位字元。

Gettext 檔案使用 `msgctxt` 作為內容，並使用 `msgid` / `msgid_plural` 作為複數形式。`ui.gettext.compileMo` 會將 `.mo` 寫在 `.po` 旁邊。`purge-locale` 會刪除該地區設定的 `.po` 和 `.mo`。當 `flatOutput` 為 false 時，它會保持扁平 JSON 檔案不變，因為它們未被寫入。

`t(..., plurals=True)` 若具有英文來源地區設定和明確的複數來源，將會跳過模型並儲存來自來源字串的 `one` / `other`。

<a id="things-to-know"></a>
## 須知

- `t()` 會查詢來源語言句子。`strings.json` 中的 ID 並非查詢鍵。遺失語言環境檔案或遺失鍵會傳回該句子。
- 輔助程式會將每個載入的 JSON 檔案保留在記憶體中，直到程序結束，包括在首次查詢時檔案遺失時的空映射。在 `translate-ui` 之後重新啟動應用程式。
- 在該次執行的第一個 `t()` 之前呼叫 `set_locale`。`?lang=` 在應用程式讀取並呼叫 `set_locale` 之前不會執行任何操作。
- `t()` 在匯入時執行一次，並保留來源語言，直到該模組再次匯入。在建置小工具時呼叫 `t()`。
- 佔位符是 `{when}`、`{counts}`、`{name:.2%}`、`{name:,.2f}` 和 `{name!r}`。為佔位符命名，說明其用途，包括格式規範 (`{when:%Y-%m-%d}`、`{share:.0%}`)。避免使用 `{value}` 和 `{value_2}`。翻譯必須複製每個佔位符名稱和格式規範，不得更改。如果重新命名其中一個，則會跳過格式設定，輔助程式會發出一次警告，並顯示原始句子。`translate-ui` 會拒絕重新命名佔位符的批次，並在稍後執行時，重新翻譯仍有此問題的已儲存列。僅包含佔位符和標點符號的字串，例如 `{state} · {title}`，會被複製，而不會傳送給模型。點狀欄位，例如 `{row.rate}`，會被拒絕。傳遞 `rate=row.rate`。`migrate-python-i18n` 從 `start.isoformat()` 推斷出 `{start}`，從 `obj.attr` 推斷出 `{attr}`，從 `len(rows)` 推斷出 `{rows_count}`，從 `", ".join(selected)` 推斷出 `{selected}`，並報告剩餘的 `{value_1}`。
- Streamlit 頁面檔案中的 `t()` 會在每次重新執行時，於 `set_locale` 之後執行。在僅匯入一次的模組中，或在匯入時建立的字典中，`t()` 會保留在首次匯入時的語言。將這些呼叫放入在顯示文字時執行的函數中。請勿重新載入模組以追蹤地區設定。
- 緊接著 printf 類型字母 (`%d`、`%a`、`%s` 等) 的字面百分比符號會被視為舊式格式設定。使用關鍵字引數時，失敗的 `%` 格式設定會傳回範本並跳過 `{name}` 替換。將字面百分比符號與這些字母分開，例如在原始文字中像 `% do CDI` 或 `% a.a.`。

<a id="locale-in-each-framework"></a>
## 各框架中的地區設定

`set_locale` 會傳回 `ContextVar` 權杖。請在 `finally` 中重設它，包含 FastAPI 和 Flask 中介軟體，以確保並行請求不會洩漏地區設定。

- <a id="streamlit"></a>**Streamlit.** 在執行的第一個 `t()` 之前呼叫 `set_locale`，包括 `st.set_page_config(page_title=…)`。保留該令牌，並在頁面腳本返回後呼叫 `reset_locale`，包括在 `st.navigation` 的 `run()` 之後。`streamlit_language_selector(sidebar=True, key="lang_selector")` 會寫入 `st.session_state.locale` 和 `st.query_params["lang"]`，並在小工具繪製時呼叫 `set_locale`，因此其上方的翻譯標題在該次執行中會保持為先前的語言。其標籤是固定的英文。需要翻譯標題的頁面應遵循[新增語言切換](/zh-Hant/guide/add-i18n-to-python#step-4-add-a-language-switch)。為每個小工具指定一個固定的 `key`。請參閱 `examples/python-streamlit` 以了解簡短輔助程式，以及指南範例以了解比對、處理地區設定和 `reset_locale`。
- <a id="fastapi"></a>**FastAPI.** 在中介軟體中讀取 `?lang=` 或 `Accept-Language`，呼叫 `set_locale`，並在 `finally` 中呼叫 `reset_locale`。路由會呼叫 `t()` 和 `_()`。請參閱 `examples/python-fastapi`。
- <a id="flask"></a>**Flask 和 Pyramid.** 從請求中設定地區設定，並將 `_`、`t`、`current_locale`、`ui_languages` 和 `direction` 注入到模板上下文中。請參閱 `examples/python-flask`。
- <a id="gettext"></a>**現有的 gettext.** 保留 `_()`、`gettext()` 和 `ngettext()` 不變。將 `ui.gettext` 指向目前的 `locales/` 樹，然後執行 `extract` 再執行 `translate-ui`。請參閱 `examples/python-gettext`。
- <a id="django"></a>**Django。** 使用 `gettext`、`ngettext` 和 `{% blocktrans %}`。初始化模板 `ui-python-django` 以符合 Django 的 `locale/` 目錄與 `django` 網域。
- <a id="tkinter"></a>**Tkinter。** 在建立每個小工具時呼叫 `t()` 或 `_()`，然後在 `set_locale` 之後重建可見文字。
- <a id="pyqt"></a>**PyQt / PySide。** `self.tr("...")` 會被提取。除非有 `notr="true"`，否則 `.ui` 檔案會提供 `<string>` 元素。`comment` 屬性會成為 gettext 內容。
- <a id="pywebview"></a>**PyWebView / PyWebKit。** 使用上述的 Python 模板提取 Python shell。使用 `data-i18n` 標記或每個地區設定一個 HTML 文件的方式來提取 HTML 頁面。
