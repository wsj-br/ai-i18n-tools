<a id="add-i18n-to-a-python-app"></a>
# 为 Python 应用添加国际化 (i18n)

本演练将为一个单语言 Python 应用程序添加区域设置（使用 ai-i18n-tools）。未包装的面向用户的字符串可通过手动方式或使用“[包装字符串](#wrap-strings)”下的提示进行包装。`migrate-python-i18n` 只会修复已包装的不安全调用。任何仍需检查的内容都会在报告中列出。

如果您已经在项目中使用 GNU gettext、Django 或 Flask 目录，请保留这些调用。选择下方匹配的初始化模板，并让 `extract` 从现有的 `.po` 文件中填充空的目录槽位。

步骤如下：

1. [安装](#install) CLI 并设置 API 密钥。
2. [选择一个模板](#pick-a-template) 并运行 `init`。
3. 在 `t()` 或 `_()` 中[包装字符串](#wrap-strings)。
4. [迁移](#migrate)已进行不安全包装的调用点。
5. [选择模型并翻译](#translate)。
6. [在运行时切换区域设置](#switch-locale)。
7. [保持翻译更新](#keep-it-translated)。

不确定这是否适合您的情况？请参阅末尾的“[不适合您的情况？](#not-your-case)”。

<a id="install"></a>
## 安装

如果机器上已安装 Node.js `>=22.16.0`，请使用 npm 包（参见[安装](/zh-Hans/guide/installation))。对于 Python 项目，请安装独立可执行文件（无需 Node.js）。

Linux 和 macOS：

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell)：

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

安装程序会检查 `SHA256SUMS.txt`，将命令安装为 `ai-i18n-tools`，并将其添加到 `PATH` 中。二进制文件未经公证或 Authenticode 签名。有关手动步骤和资产名称，请参阅：[独立可执行文件](/zh-Hans/guide/installation#standalone-executables)。

设置您传递给 `init` 的提供商的 API 密钥。例如，Cheaper Inference：

```bash
export CHEAPERINFERENCE_API_KEY=your-key-here
```

Ollama 无需密钥。其他预设：[内置提供商](/zh-Hans/guide/providers-and-models#built-in-providers)。

<a id="pick-a-template"></a>
## 选择模板

| 当前应用 | 命令 | 您将获得 |
| --- | --- | --- |
| 硬编码字符串，或新的 `t()` / `_()` 调用 | `ai-i18n-tools init -t ui-python -P cheaperinference` | 以源语言字符串为键的扁平化 JSON，以及 `i18n.py` |
| GNU gettext，并且您也想要扁平的 JSON | `ai-i18n-tools init -t ui-python-gettext -P anthropic` | JSON 加上 `.po` / `.mo`，以及 `i18n.py` |
| `translations/` 下的 Flask 或 Jinja 目录 | `ai-i18n-tools init -t ui-python-flask -P groq` | Gettext 目录和 `i18n.py` |
| Django `gettext` / `{% blocktrans %}` | `ai-i18n-tools init -t ui-python-django -P ollama` | `locale/<lang>/LC_MESSAGES/django.po`（无 `i18n.py`） |

编辑 `sourceLocale` 和 `targetLocales`。`sourceLocale` 是源文件中字符串的语言。任何 BCP-47 语言都有效；示例中通常使用 `en`。框架接线：[Python 集成](/zh-Hans/guide/integrations/python)。调用形态和目录布局：[Python 应用程序](/zh-Hans/guide/ui-strings/python)。

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

<a id="agent-prompt-i18n-py"></a>

<a id="agent-prompt-i18npy-helper"></a>

将此用于 Streamlit、FastAPI、使用扁平化 JSON 的 Flask、Tkinter、Qt 以及 PyWebView shell。将其复制到编码代理中。Django 或现有的 gettext 项目应改用[下一个提示](#agent-prompt-django-gettext)。

<details class="agent-prompt">
<summary>代理提示：i18n.py 帮助程序</summary>

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

当应用程序已调用 Django 或 GNU gettext 时，或者当您想继续使用 `.po` 目录时，请使用此项。不要添加 `i18n.py`。

init 模板会精确识别以下调用名称：`_`、`t`、`translate`、`i18n.t`、`gettext`、`ngettext`、`pgettext` 和 `self.tr`。延迟和空操作变体不在此列表中。将项目实际调用的名称（通常是 `gettext_lazy`、`ngettext_lazy`、`pgettext_lazy` 和 `gettext_noop`）添加到 `ui.uiExtractor.funcNames` 中，否则 `extract` 会跳过它们。只有在列出名称后，`ngettext_lazy` 才会被读取为单数加复数，`pgettext_lazy` 才会被读取为上下文加消息。模板中的 `{% trans %}` 和 `{% blocktrans %}` 会被单独收集。

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

<a id="migrate"></a>

<a id="migrate-call-sites"></a>
## 迁移调用点

`migrate-python-i18n` 在传入 `--write` 之前均为试运行。它始终会写入 `migrate-python-i18n-report.md`。生成的 `i18n.py` 文件会被跳过。诸如 `{value=}` 之类的调试字段和嵌套格式规范会被报告并保留在原处。

```bash
ai-i18n-tools migrate-python-i18n
ai-i18n-tools migrate-python-i18n --write
```

当试运行列出需要人工检查的站点时，请在 `--write` 之前阅读报告。可选的 `--report <path>` 可更改报告路径。可选的 `--ui-block` 可将扫描限制在一个 UI 块内。

<a id="translate"></a>

<a id="choose-models-and-translate"></a>
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

<a id="switch-locale-at-runtime"></a>
## 在运行时切换语言区域

`set_locale` 返回一个 `ContextVar` 令牌。在请求或回调结束时重置它。

```python
token = set_locale(code)
try:
    text = t("Hello, {name}!", name=name)
finally:
    reset_locale(token)
```

FastAPI 和 Flask 中间件必须在 `finally`（Flask：`teardown_request`）中进行重置，以防止并发请求导致区域设置泄漏。Django 项目保留 Django 的区域设置激活机制，且不使用 `i18n.py`。各框架说明：[各框架中的区域设置](/zh-Hans/guide/ui-strings/python#locale)。

<a id="keep-it-translated"></a>
## 保持翻译更新

更改源文本后，请重新运行 `ai-i18n-tools sync`（或先运行 `extract` 再运行 `translate-ui`）。缓存意味着只有新的或更改后的字符串会发送到模型。在 CI 中运行它，以防翻译偏离。`ai-i18n-tools dashboard` 会打开 [翻译仪表板](/zh-Hans/guide/translation-dashboard/) 以审校翻译。

要在同一次运行中翻译 `README.md`，请使用 `--with-readme` 搭建脚手架（或将该块添加到现有配置中）。请参阅 [为您的 README 和 Markdown 文档添加 i18n](/zh-Hans/guide/add-i18n-to-readme)。

<a id="not-your-case"></a>
## 不是您的情况？

| 您的情况 | 请阅读 |
| --- | --- |
| 一个 JS/TS 应用 | [为 JS/TS 应用添加 i18n](/zh-Hans/guide/add-i18n-to-js) |
| 一个网站或文档站点 | [为网站或文档站点添加 i18n](/zh-Hans/guide/add-i18n-to-website) |
| 一个仓库 README 或其他 Markdown 文件 | [为您的 README 和 Markdown 文档添加 i18n](/zh-Hans/guide/add-i18n-to-readme) |
| 嵌套的语言区域 JSON | [JSON](/zh-Hans/guide/json) |

<a id="examples"></a>
## 示例

| 示例 | 显示内容 |
| --- | --- |
| [python-streamlit](/zh-Hans/examples#python-streamlit) | 仪表板、`t()` / `_()`、扁平化 JSON |
| [python-fastapi](/zh-Hans/examples#python-fastapi) | 请求作用域的区域设置、扁平化 JSON |
| [python-flask](/zh-Hans/examples#python-flask) | Flask + Jinja、扁平化 JSON |
| [python-gettext](/zh-Hans/examples#python-gettext) | 现有的 gettext CLI；`translate-ui` 刷新 `.po` 和 `.mo` |

使用 `npx degit` 复制一个，或从 GitHub Release 下载 `ai-i18n-tools-python-examples.zip`。命令：[示例](/zh-Hans/examples#python-examples)。
