<a id="python"></a>
# Python 应用程序

`ai-i18n-tools` 从 Python 以及 Jinja、Django 和 Qt `.ui` 文件中提取 UI 字符串，然后写入以源语言字符串为键的扁平 JSON、GNU gettext 目录或两者。`sourceLocale` 可以是任何语言。运行时帮助程序是一个标准库 `i18n.py`（Python 3.10 或更高版本）。Streamlit、Tkinter、PyQt、PySide、PyWebView、Flask、Pyramid 和 FastAPI 调用该帮助程序。Django 使用其自己的 gettext。

为现有的单语言应用添加区域设置：[为 Python 应用添加 i18n](/zh-Hans/guide/add-i18n-to-python)，包括 [`i18n.py` 提示](/zh-Hans/guide/add-i18n-to-python#agent-prompt-i18n-py) 和 [Django / gettext 提示](/zh-Hans/guide/add-i18n-to-python#agent-prompt-django-gettext)。框架选择器：[Python 集成](/zh-Hans/guide/integrations/python)。函数列表：[Python 运行时 (`i18n.py`)](/zh-Hans/reference/programmatic-api#python-runtime)。

可运行的副本位于 `examples/python-streamlit`、`examples/python-flask`、`examples/python-fastapi` 和 `examples/python-gettext` 中。它们是 Python 项目。前三个项目使用 virtualenv 和 `pip install -r requirements.txt`。`python-gettext` 仅使用标准库。它们不是 npm 包。发布存档 `ai-i18n-tools-python-examples.zip` 包含相同的四个目录。npm tarball 和独立可执行文件则不包含。

<a id="init"></a>
## 脚手架

```bash
ai-i18n-tools init -t ui-python -P cheaperinference
ai-i18n-tools init -t ui-python-gettext -P anthropic
ai-i18n-tools init -t ui-python-flask -P groq
ai-i18n-tools init -t ui-python-django -P ollama
```

`ui-python` 写入扁平 JSON 和 `i18n.py`。`ui-python-gettext` 写入 JSON 和 `.po` / `.mo`。`ui-python-flask` 在 `translations/` 和 `i18n.py` 下写入 gettext 目录。`ui-python-django` 写入 `locale/<lang>/LC_MESSAGES/django.po` 且不写入 `i18n.py`。

也可翻译存储库的 README：将 `--with-readme` 添加到上面的 `init` 命令中。请参阅[为您的 README 和 Markdown 文档添加 i18n](/zh-Hans/guide/add-i18n-to-readme)。

扫描根目录会跳过 `node_modules`、`.git`、`.venv`、`venv`、`env`、`site-packages`、`__pycache__`、`.tox`、`.nox`、`.pytest_cache`、`.mypy_cache`、`.ruff_cache` 和 `.eggs`。

<a id="calls"></a>
## 翻译调用

先查找目录条目，然后进行插值。

可移植：

```python
t("Hello, {name}!", name=name)
t("Total: {price:,.2f}", price=price)
_("Hello, %s!") % name
_("Total: {price:,.2f}").format(price=price)
```

在 Python 3.14 上，辅助程序还接受模板字符串：

```python
translate(t"Hello, {name}!")
```

`translate` 是 `t` 的别名。关键字参数会覆盖从模板字符串中获取的值。

原生 gettext，由于模板是参数，因此仍然安全：

```python
_("Hello, %s!") % name
ngettext("1 file", "{count} files", count, count=count)
pgettext("menu", "Open")
```

这些会在任何目录查找之前进行求值，因此提取器会将它们标记为不安全，并由 `migrate-python-i18n` 重写：

```python
_(f"Hello, {name}!")
_("Hello, %s!" % name)
_("Hello, {name}!".format(name=name))
```

`migrate-python-i18n` 在传入 `--write` 之前是试运行。它会写入 `migrate-python-i18n-report.md`。调试字段（例如 `{value=}`）和嵌套格式规范会被报告并保留在原处。

`{% trans %}` 和 `{% blocktrans %}` 变为 gettext `%(name)s` 占位符。Jinja 会剥离并折叠空白字符。Django 会保留内部空白字符，除非标签声明为 `trimmed`。

<a id="catalogs"></a>
## 目录

扁平 JSON 键是源语言字符串，即 `sourceLocale` 中的文本。该语言可以是任何语言。上下文使用 `context` + U+0004 + 该源字符串。复数形式槽位保持为 `{md5}_one`、`{md5}_other` 以及 `translate-ui` 已写入的其他 CLDR 形式。帮助程序使用 MD5 对修剪后的单数形式进行哈希处理，并读取前 8 个十六进制字符。

Gettext 文件使用 `msgctxt` 作为上下文，使用 `msgid` / `msgid_plural` 作为复数形式。`ui.gettext.compileMo` 将 `.mo` 写入 `.po` 旁边。`purge-locale` 会删除该区域设置的 `.po` 和 `.mo`。当 `flatOutput` 为 false 时，它不会处理扁平 JSON 文件，因为它们未被写入。

具有英文源区域设置和显式复数源的 `t(..., plurals=True)` 会跳过模型，并从源字符串中存储 `one` / `other`。

<a id="locale"></a>
## 各框架中的区域设置

`set_locale` 返回一个 `ContextVar` 令牌。请在 `finally` 中重置它（包括 FastAPI 和 Flask 中间件），以确保并发请求不会泄露区域设置。

- <a id="streamlit"></a>**Streamlit。** `streamlit_language_selector(sidebar=True, key="lang_selector")` 写入 `st.session_state.locale` 和 `st.query_params["lang"]`。为每个小部件提供固定的 `key`。请参阅 `examples/python-streamlit`。
- <a id="fastapi"></a>**FastAPI。** 在中间件中读取 `?lang=` 或 `Accept-Language`，调用 `set_locale`，并在 `finally` 中 `reset_locale`。路由调用 `t()` 和 `_()`。请参阅 `examples/python-fastapi`。
- <a id="flask"></a>**Flask 和 Pyramid。** 从请求中设置区域设置，并将 `_`、`t`、`current_locale`、`ui_languages` 和 `direction` 注入到模板上下文中。请参阅 `examples/python-flask`。
- <a id="gettext"></a>**现有的 gettext。** 保留 `_()`、`gettext()` 和 `ngettext()`。将 `ui.gettext` 指向当前的 `locales/` 树，然后运行 `extract` 和 `translate-ui`。请参阅 `examples/python-gettext`。
- <a id="django"></a>**Django。** 使用 `gettext`、`ngettext` 和 `{% blocktrans %}`。初始化模板 `ui-python-django` 以匹配 Django 的 `locale/` 目录和 `django` 域。
- <a id="tkinter"></a>**Tkinter。** 在创建每个小部件时调用 `t()` 或 `_()`，然后在 `set_locale` 之后重建可见文本。
- <a id="pyqt"></a>**PyQt / PySide。** `self.tr("...")` 会被提取。除非 `notr="true"`，否则 `.ui` 文件会贡献 `<string>` 元素。`comment` 属性将成为 gettext 上下文。
- <a id="pywebview"></a>**PyWebView / PyWebKit。** 使用上述 Python 模板提取 Python shell。使用 `data-i18n` 标记或每个区域设置一个 HTML 文档来提取 HTML 页面。
