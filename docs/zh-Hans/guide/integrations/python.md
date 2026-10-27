<a id="python"></a>
# Python

适用于 Python 应用程序的选择器。提取、目录和调用形式位于 [Python 应用程序](/zh-Hans/guide/ui-strings/python) 中。为现有单区域设置应用添加 i18n 的分步指南是 [为 Python 应用添加 i18n](/zh-Hans/guide/add-i18n-to-python)，其中包含 [`i18n.py` 提示](/zh-Hans/guide/add-i18n-to-python#agent-prompt-i18n-py) 和 [Django / gettext 提示](/zh-Hans/guide/add-i18n-to-python#agent-prompt-django-gettext)。

Streamlit、FastAPI、Flask、Pyramid、Tkinter、PyQt、PySide 和 PyWebView 调用生成的 `i18n.py` 辅助程序（Python 3.10 或更高版本）。Django 保留 Django 的 gettext。存储库中附带了四个可运行的副本：`examples/python-streamlit`、`examples/python-flask`、`examples/python-fastapi` 和 `examples/python-gettext`。Pyramid、Django、Tkinter、Qt 和 PyWebView 没有单独的示例目录。

<a id="which-template"></a>
## 选择模板

| 框架 | 初始化模板 | 目录 | 示例 |
| --- | --- | --- | --- |
| Streamlit | `ui-python` | 以源字符串为键的扁平 JSON | [python-streamlit](/zh-Hans/examples#python-streamlit) |
| FastAPI | `ui-python` | 以源字符串为键的扁平 JSON | [python-fastapi](/zh-Hans/examples#python-fastapi) |
| Flask + Jinja，扁平 JSON | `ui-python` | 以源字符串为键的扁平 JSON | [python-flask](/zh-Hans/examples#python-flask) |
| Flask / Jinja gettext | `ui-python-flask` | `translations/` 下的 `.po` / `.mo` | 使用下方的 Flask 说明 |
| Pyramid | `ui-python` 或 `ui-python-flask` | 与 Flask 相同 | 与 Flask 的连接方式相同 |
| Django | `ui-python-django` | `locale/<lang>/LC_MESSAGES/django.po` | 无示例目录 |
| 现有 GNU gettext | `ui-python-gettext` | 平铺式 JSON 和 `.po` / `.mo`，或仅 gettext | [python-gettext](/zh-Hans/examples#python-gettext) |
| Tkinter | `ui-python` | 以源字符串为键的扁平 JSON | 无示例目录 |
| PyQt / PySide | `ui-python` 或 gettext 模板 | 平铺式 JSON 和/或 `.po` | 无示例目录 |
| PyWebView / PyWebKit | 用于 shell 的 Python 模板 | Shell 目录，以及 HTML 标记或每个语言环境一个 HTML 文件 | 无示例目录 |

`ui-python`、`ui-python-gettext` 和 `ui-python-flask` 会在该文件缺失时写入 `i18n.py`。`ui-python-django` 不会。添加 `--with-readme` 以同时翻译仓库的 README：[为你的 README 和 Markdown 文档添加 i18n](/zh-Hans/guide/add-i18n-to-readme)。

<a id="framework-notes"></a>
## 框架说明

<a id="streamlit"></a>
### Streamlit

`streamlit_language_selector()` 将语言环境写入会话状态和查询字符串中。为每个小部件提供一个固定的 `key`。详情：[Locale — Streamlit](/zh-Hans/guide/ui-strings/python#streamlit)。

<a id="fastapi"></a>
### FastAPI

在中间件中读取 `?lang=` 或 `Accept-Language`，调用 `set_locale`，并在 `finally` 中使用 `reset_locale`，以便并发请求保持各自的语言环境。详情：[Locale — FastAPI](/zh-Hans/guide/ui-strings/python#fastapi)。

<a id="flask"></a>
### Flask 和 Pyramid

[python-flask](/zh-Hans/examples#python-flask) 示例使用扁平 JSON。`init -t ui-python-flask` 是 `translations/` 下的 gettext 布局，适用于已经使用 Flask-Babel 风格目录的应用程序。无论哪种方式，请从请求中设置区域设置，并将 `_`、`t`、`current_locale`、`ui_languages` 和 `direction` 注入到模板上下文中。Pyramid 使用相同的请求作用域模式。详情：[区域设置 — Flask 和 Pyramid](/zh-Hans/guide/ui-strings/python#flask)。

<a id="django"></a>
### Django

保留 `gettext`、`ngettext` 和 `{% blocktrans %}`。`init -t ui-python-django` 与 Django 的 `locale/` 目录和 `django` 域匹配，并保持 Django 的运行时原样。详情：[区域设置 — Django](/zh-Hans/guide/ui-strings/python#django)。

<a id="gettext"></a>
### 现有 gettext

保留 `_()`、`gettext()` 和 `ngettext()`。将 `ui.gettext` 指向当前的目录树并运行 `extract`，然后运行 `translate-ui`。[python-gettext](/zh-Hans/examples#python-gettext) 示例仅限 gettext (`flatOutput: false`)。`init -t ui-python-gettext` 也写入扁平 JSON。详情：[区域设置 — 现有 gettext](/zh-Hans/guide/ui-strings/python#gettext)。

<a id="desktop"></a>
### Tkinter、Qt 和 PyWebView

在创建每个 Tkinter 小部件时调用 `t()` 或 `_()`，然后在 `set_locale` 之后重建可见文本。PyQt 和 PySide `self.tr("...")` 调用会被提取，除非 `notr="true"`，否则 Qt `.ui` 文件会提供 `<string>` 元素。对于 PyWebView 或 PyWebKit，请使用上方的模板提取 Python shell，并使用 `data-i18n` 标记或每个区域设置一个 HTML 文档来提取 HTML 页面。详情：[区域设置 — Tkinter](/zh-Hans/guide/ui-strings/python#tkinter)、[PyQt / PySide](/zh-Hans/guide/ui-strings/python#pyqt) 和 [PyWebView](/zh-Hans/guide/ui-strings/python#pywebview)。
