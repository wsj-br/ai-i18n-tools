<a id="add-i18n-to-a-django--python-gettext-app"></a>
# 为 Django/Python gettext 应用程序添加 i18n

本页面适用于使用 GNU gettext 进行翻译的 Python 应用程序，或将要使用它的应用程序：Django、使用 Flask-Babel 风格目录的 Flask，或任何调用 `gettext()` 的应用程序。您保留 gettext 调用。ai-i18n-tools 会读取这些调用，翻译消息，并写入您的应用程序已加载的 `.po` 和已编译的 `.mo` 文件。无需辅助模块。

最快的方法是将本页面上的提示提供给编码代理。它会设置配置，封装您的字符串，检查结果，并可以添加语言切换功能。您需要自行安装 CLI、选择提供商并初始化项目，因为这需要您的 API 密钥和您的选择。您还需要自行运行翻译，因为它会花费您账户上的资金并重写您的 `.po` 和 `.mo` 文件。

正在构建目前没有 gettext 的 Streamlit、FastAPI、Flask、桌面或脚本应用程序？请改用[为 Python 应用程序添加 i18n](/zh-Hans/guide/add-i18n-to-python)。它会添加一个小的 `i18n.py` 辅助工具并写入 JSON 目录。不确定哪种情况适用？请参阅末尾的[不适用于您的情况？](#not-your-case)。

流程：

1. [安装 CLI 并选择提供商](#install-and-choose-a-provider)。
2. 使用 `init`[初始化项目](#initialise-the-project)。
3. [运行代理提示](#run-the-agent-prompt)。
4. [查看结果](#review-the-result)。
5. [选择模型并翻译](#translate)，然后检查一种语言。
6. [保持翻译状态](#keep-it-translated)。

倾向于自行更改，或者想知道提示的作用？[手动操作](#do-it-by-hand) 会逐步完成相同的步骤。

<a id="install-and-choose-a-provider"></a>
## 安装并选择提供商

这部分由您完成，而不是代理。安装程序会更改您的机器，API 密钥是属于您 shell 的秘密，不应出现在提示中。

如果机器上已安装 Node.js `>=22.16.0`，请使用 npm 包（参见[安装](/zh-Hans/guide/installation))。对于 Python 项目，请安装独立可执行文件（无需 Node.js）。

Linux 和 macOS：

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell)：

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

安装程序会检查 `SHA256SUMS.txt`，将命令安装为 `ai-i18n-tools`，并将其添加到 `PATH`。这些二进制文件未经公证或 Authenticode 签名。手动步骤和资产名称：[独立可执行文件](/zh-Hans/guide/installation#standalone-executables)。

检查安装：

```bash
ai-i18n-tools --version
```

然后选择一个提供商，并在将运行翻译的 shell 中设置其 API 密钥。例如，Cheaper Inference：

```bash
export CHEAPERINFERENCE_API_KEY=your-key-here
```

Ollama 不需要密钥。其他预设：[内置提供商](/zh-Hans/guide/providers-and-models#built-in-providers)。请记下提供商名称，因为您将在下一步中将其传递给 `init`。代理永远不需要密钥：它只运行不进行模型调用的命令。您稍后在[翻译](#translate)时会用到该密钥。

<a id="initialise-the-project"></a>
## 初始化项目

您在提示之前运行此命令一次。它会写入配置，并使用您上面选择的提供商。选择与您的应用程序匹配的模板：

| 您的应用程序 | 模板 | 它写入的目录 |
| --- | --- | --- |
| Django | `ui-python-django` | `locale/<lang>/LC_MESSAGES/django.po` 和 `.mo` |
| 使用 Flask-Babel 风格目录的 Flask | `ui-python-flask` | `translations/<lang>/LC_MESSAGES/messages.po` 和 `.mo` |
| 任何其他已使用 GNU gettext 的 Python 应用程序 | `ui-python-gettext` | `locales/<lang>/LC_MESSAGES/messages.po` 和 `.mo` |

使用模板名称和您选择的提供商运行 init：

```bash
ai-i18n-tools init -t ui-python-django -P cheaperinference
```

运行 `init` 一次。它每次都会重写 `ai-i18n-tools.config.json`，因此第二次运行会丢弃您所做的编辑。如果配置已存在且已自定义，请跳过 `init` 并编辑配置。

当 `i18n.py` 文件缺失时，`ui-python-gettext` 和 `ui-python-flask` 还会写入一个辅助文件。gettext 应用不需要它，因此请删除它（提示会为您完成此操作）。`ui-python-gettext` 也会在 gettext 目录旁边写入 JSON 文件。若要仅写入 gettext 目录，请在 `ui` 块中设置 `"flatOutput": false`（提示也会这样做）。`ui-python-django` 既不写入辅助文件也不写入 JSON，因为 Django 有自己的翻译系统。

然后编辑 `ai-i18n-tools.config.json` 中的 `sourceLocale` 和 `targetLocales`。`sourceLocale` 是您代码中字符串的语言。任何 BCP-47 语言都有效；示例通常使用 `en`。将目标代码写为 `pt-BR`。目录文件夹是 `pt_BR`，这是 gettext 和 Django 期望的格式（`localeFormat` 是 `posix`）。

<a id="run-the-agent-prompt"></a>
## 运行代理提示

在您的编码代理（Cursor、Claude Code、Copilot 或类似工具）中打开项目，开始新聊天，然后粘贴以下提示。项目必须已初始化。无需编辑。如果您想排除某些内容，例如不进行语言切换，请在同一消息中说明。

代理首先检查 CLI 和配置是否存在，如果缺少其中一个，则会停止并给出说明。然后它分四个部分工作：

- 第 1 部分使配置与您现有的目录匹配，并删除某些模板写入的 `i18n.py`。
- 第 2 部分使用您已使用的 gettext 调用和模板标签包装面向用户的字符串。
- 第 3 部分运行 `extract` 并查找在查找之前进行格式化的调用。
- 第 4 部分添加语言切换。

它不安装或初始化任何东西，不读取您的 API 密钥，也不进行翻译。它不运行 `makemessages` 或 `compilemessages`，并且不触碰您的 `.po` 和 `.mo` 文件。翻译是审查之后的步骤，由您运行。

<details class="agent-prompt">
<summary>代理提示：为 Django 或 gettext 应用添加语言</summary>

````markdown
# Add languages to this gettext app

## Before you start

The user must already have installed ai-i18n-tools and initialised this
project. Check that `ai-i18n-tools --version` runs and that
`ai-i18n-tools.config.json` exists with a `ui.gettext` block. If either is
missing, stop now and tell the user to install ai-i18n-tools and run
`ai-i18n-tools init -t <template> -P <provider>`, then run this prompt again.
The template is `ui-python-django` for Django, `ui-python-flask` for
Flask-Babel catalogs, and `ui-python-gettext` for any other gettext app. Do not
install or initialise anything yourself.

## Rules

- Do not read or search the ai-i18n-tools source. This prompt is complete.
- Never read, print, or write API keys, `.env` files, or the shell environment.
- Do not run `translate-ui` or `suggest-models`. They call the translation API,
  cost money, and `translate-ui` rewrites the `.po` and `.mo` files. The user
  runs them after reviewing your work.
- Do not translate, reword, or rename source text. Do not hand-edit `.po`,
  `.mo`, `.pot`, or `strings.json`. Do not run `makemessages` or
  `compilemessages`. Do not create `i18n.py` or any other translation helper.
  Do not edit migrations or change field names.
- Do not reformat unrelated code. Run the project's formatter and linter at the
  end. Leave unrelated edits in a dirty tree alone. Delete throwaway scripts and
  do not commit them.

## Part 1 — Config

1. If init wrote an `i18n.py`, delete it. A gettext app does not use it. If the
   project uses the `ui-python-gettext` template, set `"flatOutput": false` in
   the `ui` block.
2. Make the config match the project. `ui.gettext.outputDir`, `potPath`, and
   `domain` must be where the existing catalogs live and the domain the app
   loads (Django: `django`; Flask-Babel: `messages`). Put `ui.stringsJson` and
   `ui.flatOutputDir` beside the catalogs. Set `ui.sourceRoots` to the
   application code instead of `"."`. Use one `ui` block per catalog tree when
   apps keep separate `locale/` folders.
3. Keep the existing `.po` files. `extract` reads them and keeps their
   translations.

## Part 2 — Wrap strings

Keep the gettext calls the project already uses, and wrap what is missing. The
literal is the source-language message. With the source language active, the
app must behave exactly as before.

- Python: `gettext`, `ngettext`, `pgettext`. Placeholders are `%(name)s`,
  filled after the lookup: `_("Hello, %(name)s!") % {"name": name}`. Strings that
  run at import time (models, forms, apps, settings) use the lazy form, for
  example `from django.utils.translation import gettext_lazy as _`. Never apply
  `%` to a lazy string at import time. Use `format_lazy`.
- Templates: add `{% load i18n %}` where needed. Use `{% translate "…" %}` and
  `{% blocktranslate with name=user.name %}Hello, {{ name }}!{% endblocktranslate %}`.
  Do not switch templates to `{name}` placeholders.
- Look up first, then format. Never `_(f"…")`, `_("…" % x)`, or
  `_("…".format(…))`. The argument must be a string literal, so `_(variable)` is
  invisible.
- `extract` knows `_`, `t`, `translate`, `i18n.t`, `gettext`, `ngettext`,
  `pgettext`, and `self.tr`. Add every other name the code calls to
  `ui.uiExtractor.funcNames`: for example `gettext_lazy` called directly,
  `ngettext_lazy`, `pgettext_lazy`, `npgettext`, `gettext_noop`.
- Wrap text a person sees: labels, headings, messages, form and model text,
  emails, admin text. Leave identifiers, URLs, route names, field names,
  settings keys, log messages, SQL, and text that is already wrapped. A value
  that is both stored and shown (choices) keeps its stored value. Wrap the
  label.

Work in passes: wrap, run `ai-i18n-tools extract`, look for text still
unwrapped, and repeat.

## Part 3 — Check

1. `ai-i18n-tools extract` lists the new messages and keeps the entries filled
   from the existing `.po` files.
2. Run `ai-i18n-tools migrate-python-i18n` without `--write` and read
   `migrate-python-i18n-report.md`. It finds calls that format before the
   lookup. Fix each one by hand with `%(name)s` and a dict. Never use `--write`:
   it rewrites f-strings and `.format()` calls to `t(...)`, which a gettext app
   does not have. Do not commit the report.
3. Django's checks and the project's tests pass, and the source language still
   shows the original text.

## Part 4 — Language switch

Skip this part when the user asked you to leave the switch out. It changes the
layout.

Goal: the user can pick a language, the choice is remembered, and every request
after that uses it. Use the framework's own mechanism, and accept only the
languages in `sourceLocale` and `targetLocales`.

- Django: `LANGUAGE_CODE` is the source language. `LANGUAGES` lists the
  supported languages with Django's lower-case codes (`pt-br`). `LOCALE_PATHS`
  points at `gettext.outputDir`, unless each app keeps its own `locale/` folder.
  Add `django.middleware.locale.LocaleMiddleware` after `SessionMiddleware` and
  before `CommonMiddleware`. Add `path("i18n/", include("django.conf.urls.i18n"))`
  to the URLconf, and a form that posts to `set_language` with a `next` field
  and a select built from `get_available_languages`, labelled
  `{% translate "Language" %}`.
- Flask-Babel: the locale selector returns, in order, `?lang=`, a cookie that
  remembers it, the `Accept-Language` header, then the source language. Match
  case-insensitively (`pt-br` is `pt-BR`) and ignore unknown codes. Keep
  `translations/` as the translation directory. Add a menu of links that carry
  `?lang=`, and store the cookie.
- Plain gettext: build the translations object with
  `gettext.translation(domain, localedir, languages=[code], fallback=True)`,
  converting `pt-BR` to `pt_BR`. In a web app build it per request. Do not use
  `gettext.install` there, because it is global and concurrent requests would
  share a language.
- Any framework: choose the language where a request or run starts, remember
  the choice, and keep it local to that request.

## Verify and report

The tests pass. With the source language, the output is unchanged. After the
user runs `translate-ui` and restarts the server, switching shows translations.
Before that, it shows the source text.

Report the files changed, each string you skipped with a one-line reason, the
function names you added to `funcNames`, plurals left as one string, one word
with several meanings, and sentences built from translated pieces. Then list
the commands for the user, and do not run them: `ai-i18n-tools translate-ui`,
then restart the server. Remind the user to commit first, because `translate-ui`
rewrites the `.po` files.
````

</details>

<a id="review-the-result"></a>
## 审查结果

代理结束时会生成一份报告。在翻译之前检查它：

- 差异。只有包装的调用、模板标签、配置和语言切换应该有所更改。在您翻译之前，您的 `.po` 和 `.mo` 文件应保持不变。
- `ai-i18n-tools.config.json`：`gettext.outputDir` 和 `domain` 指向您的应用加载的目录，而 `sourceRoots` 涵盖应用程序代码。
- `ai-i18n-tools extract` 列出新消息并保留您 `.po` 文件中已有的翻译。
- `migrate-python-i18n` 的空运行未列出任何待修复项。
- Django 的检查和您的测试通过，并且应用在源语言中看起来相同。
- 报告中跳过的字符串和歧义情况：复数形式保留为一个字符串、一个词语具有两种含义以及由翻译片段构建的句子。手动决定这些。

提交此状态。`translate-ui` 会重写您的 `.po` 文件，因此您会希望有一个干净的差异以供审查。

<a id="choose-models-and-translate"></a>
## 选择模型并翻译

您运行此部分。它使用您的 API 密钥，在您的账户上花费资金，并重写您的 `.po` 文件，因此请先提交。

`init` 提供的模型列表是一个起点。对当前活跃提供商的聊天模型进行排序，当候选列表确认无误后，将其写入 `translationModels`：

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` 仅替换 `translationModels`。相同的排名位于[模型](/zh-Hans/guide/translation-dashboard/models)选项卡上。然后翻译：

```bash
ai-i18n-tools translate-ui
```

`translate-ui` 写入 `.pot` 模板，每个目标语言环境一个 `.po`，以及编译后的 `.mo`。从现在起不要编辑这些文件，因为下次运行会重新生成它们。在提交之前审查第一个差异。

如果服务器没有识别新的 `.mo` 文件，请重启服务器。

<a id="check-one-language"></a>
### 检查一种语言

切换到一种目标语言，并查看包含一些已包装字符串的页面。仍然显示源语言的文本未被包装，或者 `.mo` 未重新加载。输出中显示 `%(name)s` 的文本丢失了其字典。检查 `.po` 文件中的占位符。

<a id="keep-it-translated"></a>
## 保持翻译更新

更改源文本后，请重新运行 `ai-i18n-tools sync`（或先运行 `extract` 再运行 `translate-ui`）。缓存意味着只有新的或更改后的字符串会发送到模型。在 CI 中运行它，以防翻译偏离。`ai-i18n-tools dashboard` 会打开 [翻译仪表板](/zh-Hans/guide/translation-dashboard/) 以审校翻译。

`purge-locale` 移除某个区域设置的 `.po` 和 `.mo`。提交 `.po` 文件。除非您的构建过程会编译它们，否则也提交 `.mo` 文件。

要在同一次运行中翻译 `README.md`，请使用 `--with-readme` 搭建脚手架（或将该块添加到现有配置中）。请参阅 [为您的 README 和 Markdown 文档添加 i18n](/zh-Hans/guide/add-i18n-to-readme)。

<a id="do-it-by-hand"></a>
## 手动操作

如果您倾向于自己进行更改，或者想了解提示的作用，请按照以下步骤操作。每个步骤都与提示的一部分相对应。最后您仍然需要[安装 CLI](#install-and-choose-a-provider)、[初始化项目](#initialise-the-project)并[进行翻译](#translate)。

1. [将配置指向您的目录](#point-the-config)。
2. [使用您已有的 gettext 调用包装字符串](#wrap-strings)。
3. [提取并检查调用](#extract-and-check)。
4. [在运行时切换语言](#switch-language)。

<a id="step-1-point-the-config-at-your-catalogs"></a>
## 步骤 1：将配置指向您的目录

模板会写入合理的默认值。这是 Django 的默认值：

```json
{
  "ui": {
    "sourceRoots": ["."],
    "stringsJson": "locale/strings.json",
    "flatOutputDir": "locale",
    "flatOutput": false,
    "gettext": {
      "outputDir": "locale",
      "domain": "django",
      "potPath": "locale/django.pot",
      "compileMo": true,
      "ingestExistingPo": true,
      "localeFormat": "posix"
    }
  }
}
```

根据您的项目检查以下四项：

- `gettext.outputDir` 和 `potPath` 是您的目录所在的位置。Django：`LOCALE_PATHS` 中的文件夹，或应用程序内的 `locale/` 文件夹。Flask-Babel：`translations/`。
- `gettext.domain` 是您的应用程序加载的文件名。Django 使用 `django`。Flask-Babel 使用 `messages`。对于纯 gettext，它是您 `gettext.translation(...)` 调用中的域。
- `sourceRoots` 列出了 `extract` 扫描的文件夹。将其从 `"."` 缩小到您的应用程序代码，以便测试和脚本不包含在目录中。
- `stringsJson` 是提取缓存，一个由该工具拥有的文件。将其放在目录旁边。它不是运行时文件。您的应用程序从不读取它。

当每个 Django 应用程序都保留自己的 `locale/` 文件夹时，每个目录树使用一个 `ui` 块。`ui` 接受一个列表，并且 `--ui-block` 运行一个块。路径在块之间必须是唯一的。请参阅[配置](/zh-Hans/reference/configuration)。

`ingestExistingPo` 默认启用。在 `extract` 期间，您的 `.po` 文件中已有的翻译会填充空槽。已经设置的翻译不会被替换。在第一次 `translate-ui` 之前提交您的目录，因为它会重写 `.po` 文件并编译 `.mo` 文件。审查该差异。

`compileMo` 会为您写入 `.mo`，因此在此工作流程中您不需要 `compilemessages`。选择一个工具来写入目录：在 `translate-ui` 之后运行 `makemessages` 会重写相同的 `.po` 文件。

<a id="step-2-wrap-strings"></a>
## 步骤 2：包装字符串

`extract` 仅当字符串是传递给 `ui.uiExtractor.funcNames` 中某个函数名或模板标签的字面量时，才会记录它。保留您已有的调用。添加缺失的部分。

Python 代码：

```python
from django.utils.translation import gettext as _
from django.utils.translation import gettext_lazy, ngettext, pgettext

_("Welcome back")
_("Hello, %(name)s!") % {"name": name}
ngettext("%(count)d file", "%(count)d files", n) % {"count": n}
pgettext("menu", "Open")

class Article(models.Model):
    title = models.CharField(gettext_lazy("Title"), max_length=200)
```

占位符使用 `%(name)s`。在查找后使用 `%` 传递值，切勿在此之前。模型、表单和设置在模块导入时运行，因此它们使用惰性形式。不要在导入时将 `%` 应用于惰性字符串。请改用 `format_lazy`。

模板 (Django `{% load i18n %}`，或 Flask 中的 Jinja)：

```jinja
{% load i18n %}
<h1>{% translate "Welcome back" %}</h1>
{% blocktranslate with name=user.name %}Hello, {{ name }}!{% endblocktranslate %}
```

`{% translate %}`、`{% trans %}`、`{% blocktranslate %}` 和 `{% blocktrans %}` 会单独收集。模板变量（例如 <code v-pre>{{ name }}</code>）会存储为 `%(name)s`。保持这种形式。

`extract` 不知道的名称会被跳过。默认列表是 `_`、`t`、`translate`、`i18n.t`、`gettext`、`ngettext`、`pgettext` 和 `self.tr`。如果代码直接调用 `gettext_lazy("…")`、`ngettext_lazy`、`pgettext_lazy`、`npgettext` 或 `gettext_noop`，请将这些名称添加到 `ui.uiExtractor.funcNames`。当您将惰性函数导入为 `_` 时，如 `gettext_lazy as _` 所示，名称 `_` 已被涵盖。

包装用户可见的文本：标签、标题、消息、表单和模型文本、电子邮件。标识符、URL、字段名、设置键、日志消息和迁移保持不变。不要改写源文本。缺失的翻译会返回源句子，因此应用程序在源语言中看起来相同。

这些调用在查找之前评估格式，因此字符串永远不会匹配目录条目：

```python
_(f"Hello, {name}!")
_("Hello, %s!" % name)
_("Hello, {name}!".format(name=name))
```

<a id="step-3-extract-and-check-the-calls"></a>
## 步骤 3：提取并检查调用

在调用被包装后运行 `extract`。它会写入提取缓存，并从您现有的 `.po` 文件中填充空槽。它不会调用模型。

```bash
ai-i18n-tools extract
```

然后查找在查找之前进行格式化的调用。`migrate-python-i18n` 会找到它们。在没有 `--write` 的情况下运行它：

```bash
ai-i18n-tools migrate-python-i18n
```

它会写入 `migrate-python-i18n-report.md`。阅读它，并使用 `%(name)s` 和字典手动修复每个列出的调用。删除报告或将其添加到 Git 忽略列表。

请勿在此页面上传递 `--write`。该选项会将 f-string 或 `.format()` 调用重写为 `t("…", name=name)`，这是一个仅存在于 `i18n.py` 助手中的调用。gettext 应用程序没有 `t`。没有行的报告意味着包装的调用是安全的。这并不意味着每个句子都被包装了，因此请阅读 `strings.json` 的差异，并查找您期望看到的文本。

<a id="step-4-switch-language-at-runtime"></a>
## 步骤 4：在运行时切换语言

您的框架选择语言。ai-i18n-tools 不会添加菜单或助手。

<a id="django"></a>
### Django

在 `settings.py` 中：

```python
LANGUAGE_CODE = "en"
LANGUAGES = [
    ("en", "English"),
    ("pt-br", "Português (Brasil)"),
]
LOCALE_PATHS = [BASE_DIR / "locale"]

MIDDLEWARE = [
    # ...
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "django.middleware.common.CommonMiddleware",
    # ...
]
```

`LocaleMiddleware` 位于会话中间件之后和 `CommonMiddleware` 之前。`LANGUAGE_CODE` 是源语言。`LANGUAGES` 列出了访问者可以选择的语言。`LOCALE_PATHS` 指向 `gettext.outputDir` 写入的文件夹，除非每个应用程序保留自己的 `locale/` 文件夹。

将 Django 的语言切换视图添加到 `urls.py`：

```python
from django.urls import include, path

urlpatterns = [
    path("i18n/", include("django.conf.urls.i18n")),
    # ...
]
```

然后将表单添加到模板：

```jinja
{% load i18n %}
{% get_current_language as CURRENT %}
{% get_available_languages as LANGUAGES %}
<form action="{% url 'set_language' %}" method="post">
  {% csrf_token %}
  <input name="next" type="hidden" value="{{ request.get_full_path }}">
  <select name="language" onchange="this.form.submit()">
    {% for code, name in LANGUAGES %}
      <option value="{{ code }}"{% if code == CURRENT %} selected{% endif %}>{{ name }}</option>
    {% endfor %}
  </select>
</form>
```

该视图将选择保存在 cookie 中。要将语言放在 URL 中，请改用 `i18n_patterns`。两者都是标准的 Django 功能。请参阅 Django 关于国际化的文档。

<a id="plain-gettext-and-flask-babel"></a>
### 纯 gettext 和 Flask-Babel

加载您想要的语言的目录并调用它。[python-gettext](/zh-Hans/examples#python-gettext) 示例在命令行工具中执行此操作：

```python
import gettext
from pathlib import Path

LOCALEDIR = Path(__file__).resolve().parent / "locales"


def load_catalog(lang: str) -> gettext.NullTranslations:
    code = lang.replace("-", "_")
    return gettext.translation("messages", localedir=str(LOCALEDIR), languages=[code], fallback=True)


_ = load_catalog("pt-BR").gettext
print(_("Hello"))
```

将 `pt-BR` 转换为 `pt_BR`，这是 `translate-ui` 写入的文件夹名称。保留 `fallback=True`，以便缺失的目录显示源文本。在 Web 应用程序中，按请求构建翻译对象，并且不要使用 `gettext.install` 全局安装一个，否则并发请求将共享一种语言。在 Flask-Babel 中，从您的区域设置选择器函数返回代码，并保留 `translations/` 作为其翻译目录。

这是最后一个手动步骤。继续阅读[选择模型并翻译](#translate)。

<a id="not-your-case"></a>
## 不是您的情况？

| 您有 | 阅读 |
| --- | --- |
| 没有 gettext 的 Streamlit、FastAPI、Flask、桌面或脚本应用程序 | [将 i18n 添加到 Python 应用程序](/zh-Hans/guide/add-i18n-to-python) |
| JS/TS 应用程序 | [将 i18n 添加到 JS/TS 应用程序](/zh-Hans/guide/add-i18n-to-js) |
| 一个网站或文档站点 | [为网站或文档站点添加 i18n](/zh-Hans/guide/add-i18n-to-website) |
| 一个仓库 README 或其他 Markdown 文件 | [为您的 README 和 Markdown 文档添加 i18n](/zh-Hans/guide/add-i18n-to-readme) |

<a id="examples"></a>
## 示例

| 示例 | 显示内容 |
| --- | --- |
| [python-gettext](/zh-Hans/examples#python-gettext) | 一个现有的 gettext 命令行工具；`translate-ui` 刷新 `.po` 和 `.mo` |

没有 Django 示例目录。`python-gettext` 示例显示了具有域 `messages` 的相同配置形状。使用 `npx degit` 复制它，或从 GitHub Release 下载 `ai-i18n-tools-python-examples.zip`。命令：[示例](/zh-Hans/examples#python-examples)。
