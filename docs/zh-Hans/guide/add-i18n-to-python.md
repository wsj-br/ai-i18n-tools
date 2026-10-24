<a id="add-i18n-to-a-python-app"></a>
# 为 Python 应用添加国际化 (i18n)

本指南将引导您使用 `migrate-python-i18n` 为仅支持单一语言的 Python 应用添加多语言支持。该工具可安全地修改调用点，并将仍需人工检查的内容列入报告。

如果您已经在项目中使用 GNU gettext、Django 或 Flask 目录，请保留这些调用。选择下方匹配的初始化模板，并让 `extract` 从现有的 `.po` 文件中填充空的目录槽位。

<a id="install"></a>
## 安装

如果机器上已安装 Node.js `>=22.16.0`，请使用 npm 包 ([安装](/zh-Hans/guide/installation))。对于 Python 项目，通常的做法是使用 GitHub Release 中提供的独立可执行文件 —— Linux (`x64`, `arm64`)、macOS (`arm64`, `x64`) 和 Windows (`x64`)。请检查 `SHA256SUMS.txt`，在 Unix 系统上运行 `chmod +x`，并将文件放入 `PATH`。这些二进制文件未签名。资源名称和校验和：[独立可执行文件](/zh-Hans/guide/installation#standalone-executables)。

设置您传递给 `init` 的提供商的 API 密钥。例如，Cheaper Inference：

```bash
export CHEAPERINFERENCE_API_KEY=your-key-here
```

Ollama 无需密钥。其他预设：[内置提供商](/zh-Hans/guide/providers-and-models#built-in-providers)。

<a id="pick-a-template"></a>
## 选择模板

| 当前应用 | 命令 | 您将获得什么 |
| --- | --- | --- |
| 硬编码字符串，或新的 `t()` / `_()` 调用 | `ai-i18n-tools init -t ui-python -P cheaperinference` | 扁平的英文键 JSON 和 `i18n.py` |
| GNU gettext，并且您也想要扁平的 JSON | `ai-i18n-tools init -t ui-python-gettext -P anthropic` | JSON 加上 `.po` / `.mo`，以及 `i18n.py` |
| `translations/` 下的 Flask 或 Jinja 目录 | `ai-i18n-tools init -t ui-python-flask -P groq` | Gettext 目录和 `i18n.py` |
| Django `gettext` / `{% blocktrans %}` | `ai-i18n-tools init -t ui-python-django -P ollama` | `locale/<lang>/LC_MESSAGES/django.po`（无 `i18n.py`） |

编辑 `sourceLocale` 和 `targetLocales`。`sourceLocale` 是源代码中字符串的语言（通常为 `en`）。框架集成：[Python 集成](/zh-Hans/guide/integrations/python)。调用形式和目录布局：[Python 应用](/zh-Hans/guide/ui-strings/python)。

<a id="wrap-strings"></a>
## 包装字符串

先查找目录条目，然后进行插值。从生成的 `i18n.py` 中导入 `t` 和 `_`（Django 保留 `gettext` 和 `ngettext`）。

```python
t("Hello, {name}!", name=name)
_("Hello, %s!") % name
_("Total: {price:,.2f}").format(price=price)
```

这些会在任何目录查找之前进行评估。提取器会将它们标记为不安全，而 `migrate-python-i18n` 会重写它们：

```python
_(f"Hello, {name}!")
_("Hello, %s!" % name)
_("Hello, {name}!".format(name=name))
```

<a id="migrate"></a>
## 迁移调用点

`migrate-python-i18n` 在传入 `--write` 之前均为试运行。它始终会写入 `migrate-python-i18n-report.md`。生成的 `i18n.py` 文件会被跳过。诸如 `{value=}` 之类的调试字段和嵌套格式规范会被报告并保留在原处。

```bash
ai-i18n-tools migrate-python-i18n
ai-i18n-tools migrate-python-i18n --write
```

当试运行列出需要人工检查的站点时，请在 `--write` 之前阅读报告。可选的 `--report <path>` 可更改报告路径。可选的 `--ui-block` 可将扫描限制在一个 UI 块内。

<a id="translate"></a>
## 选择模型并翻译

`init` 提供的模型列表是一个起点。对当前活跃提供商的聊天模型进行排序，当候选列表确认无误后，将其写入 `translationModels`：

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` 仅替换 `translationModels`。相同的排名位于 [Models](/zh-Hans/guide/translation-dashboard/models) 选项卡中。然后提取并翻译：

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
```

`extract` 写入 `strings.json` 和 `ui-languages.json`。`translate-ui` 会填充扁平化 JSON 文件，并在设置 `ui.gettext` 时填充 `.po` / `.mo` 目录。请勿手动编辑这些生成的目录。

<a id="switch-locale"></a>
## 在运行时切换区域设置

`set_locale` 返回一个 `ContextVar` 令牌。在请求或回调结束时重置它。

```python
token = set_locale(code)
try:
    text = t("Hello, {name}!", name=name)
finally:
    reset_locale(token)
```

FastAPI 和 Flask 中间件必须在 `finally`（Flask：`teardown_request`）中进行重置，以防止并发请求导致区域设置泄漏。Django 项目保留 Django 的区域设置激活机制，且不使用 `i18n.py`。各框架说明：[各框架中的区域设置](/zh-Hans/guide/ui-strings/python#locale)。

<a id="examples"></a>
## 示例

| 示例 | 显示内容 |
| --- | --- |
| [python-streamlit](/zh-Hans/examples#python-streamlit) | 仪表板、`t()` / `_()`、扁平化 JSON |
| [python-fastapi](/zh-Hans/examples#python-fastapi) | 请求作用域的区域设置、扁平化 JSON |
| [python-flask](/zh-Hans/examples#python-flask) | Flask + Jinja、扁平化 JSON |
| [python-gettext](/zh-Hans/examples#python-gettext) | 现有的 gettext CLI；`translate-ui` 刷新 `.po` 和 `.mo` |

使用 `npx degit` 复制一个，或从 GitHub Release 下载 `ai-i18n-tools-python-examples.zip`。命令：[示例](/zh-Hans/examples#python-examples)。
