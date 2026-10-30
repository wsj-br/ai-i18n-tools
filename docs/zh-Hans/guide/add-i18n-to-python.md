<a id="add-i18n-to-a-python-app"></a>
# 为 Python 应用添加国际化 (i18n)

本页面介绍如何将只有一个语言的 Python 应用程序使用 ai-i18n-tools 添加本地化。它遵循一条路径：`ui-python` 模板、一个小型 `i18n.py` 辅助工具和翻译的 JSON 文件。该路径适用于 Streamlit、FastAPI、Flask、桌面应用程序和脚本。

最快的方法是将本页面上的提示提供给编码代理。它会设置配置、包装字符串、检查结果，并可以添加语言菜单。您需要自行安装 CLI、选择提供商并初始化项目，因为这需要您的 API 密钥和您的选择。您还需要自行运行翻译，因为它会花费您账户中的资金。

如果您正在使用 Django、Flask-Babel 目录或 GNU gettext，并希望保留这些调用，请改用[将 i18n 添加到 Django / Python gettext 应用程序](/zh-Hans/guide/add-i18n-to-django-gettext)。它保留 `gettext` 并写入 `.po` 和 `.mo` 文件，无需辅助工具。不确定哪个适用？请参阅末尾的[不适用于您的情况？](#not-your-case)。

流程：

1. [安装 CLI 并选择提供商](#install-and-choose-a-provider)。
2. 使用 `init`[初始化项目](#initialise-the-project)。
3. [运行代理提示](#run-the-agent-prompt)。
4. [查看结果](#review-the-result)。
5. [选择模型并翻译](#choose-models-and-translate)，然后检查一种语言。
6. [保持翻译](#keep-it-translated)。

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

Ollama 不需要密钥。其他预设：[内置提供商](/zh-Hans/guide/providers-and-models#built-in-providers)。记下提供商名称，因为您将在下一步将其传递给 `init`。代理从不需要密钥：它只运行不进行模型调用的命令。您稍后在[翻译](#choose-models-and-translate)时会使用该密钥。

<a id="initialise-the-project"></a>
## 初始化项目

您在提示之前运行此命令一次。它会写入配置和 `i18n.py` 辅助工具，并使用您上面选择的提供商。

本页面使用一个模板，`ui-python`。它会写入配置、`i18n.py` 辅助工具和 JSON 目录。它适用于以下应用程序：

| 您的应用程序 | 备注 |
| --- | --- |
| Streamlit | 语言菜单需要在应用程序中添加几行代码；请参阅[添加语言切换](#step-4-add-a-language-switch) |
| FastAPI | 区域设置是按请求设置的 |
| Flask | 平面 JSON 目录。对于 `translations/` 中的 Flask-Babel 目录，请使用[gettext 页面](/zh-Hans/guide/add-i18n-to-django-gettext) |
| Pyramid | 与 Flask 的连接方式相同 |
| 桌面应用程序 (Tkinter, PyQt, PySide) | 区域设置更改后重建可见文本 |
| PyWebView | 模板涵盖 Python shell。单独翻译其 HTML 页面 |
| 命令行工具和脚本 | 最简单的情况 |

使用您选择的提供商运行 init（本例中为 Cheaper Inference）：

```bash
ai-i18n-tools init -t ui-python -P cheaperinference
```

然后在 `ai-i18n-tools.config.json` 中编辑 `sourceLocale` 和 `targetLocales`。`sourceLocale` 是源中字符串的语言。任何 BCP-47 语言都有效；示例通常使用 `en`。

运行 `init` 一次。它每次都会重写 `ai-i18n-tools.config.json`，因此第二次运行会丢弃您所做的编辑。如果 `i18n.py` 已经包含标记 `ai-i18n-tools-i18n-py`，则项目已初始化：跳过此步骤。

`init` 将 `ui.sourceRoots` 设置为 `"."`，因此 `extract` 将扫描整个仓库（测试、脚本、文档）。提示将其范围缩小到您的应用程序代码（手动操作，即[步骤 1](#place-the-helper))。

框架连接：[Python 集成](/zh-Hans/guide/integrations/python)。调用形式和目录布局：[Python 应用程序](/zh-Hans/guide/ui-strings/python)。

<a id="run-the-agent-prompt"></a>
## 运行代理提示

在您的编码代理（Cursor、Claude Code、Copilot 或类似工具）中打开项目，开始新聊天，然后粘贴下面的提示。项目必须已经初始化。无需编辑。如果您希望省略某些内容，例如不包含语言菜单，请在同一消息中说明。

代理首先检查 CLI、配置和 `i18n.py` 是否存在，如果缺少其中任何一项，则会停止并提供说明。然后它分三个部分工作：

- 第 1 部分将 `i18n.py` 和 `locales/` 放置在存储库保存其代码的位置，并将配置指向它们。
- 第 2 部分将面向用户的字符串包装在 `t()` 和 `_()` 中，运行 `extract`，并使用 `migrate-python-i18n` 检查包装后的调用。
- 第 3 部分添加语言菜单，或 CLI 语言选项和环境区域设置。

它不安装或初始化任何东西，不读取您的 API 密钥，也不进行翻译。翻译是审查之后的步骤，由您运行。

````markdown
# Add languages to this Python app

## Before you start

The user must already have installed ai-i18n-tools and initialised this
project. Check that `ai-i18n-tools --version` runs, that
`ai-i18n-tools.config.json` exists, and that an `i18n.py` containing
`ai-i18n-tools-i18n-py` exists. If any of them is missing, stop now and tell
the user to install ai-i18n-tools and run
`ai-i18n-tools init -t ui-python -P <provider>`, then run this prompt again.
Do not install or initialise anything yourself.

## Rules

- Do not read or search the ai-i18n-tools source. This prompt is complete.
- Never read, print, or write API keys, `.env` files, or the shell environment.
- Do not run `translate-ui` or `suggest-models`. They call the translation API
  and cost money. The user runs them after reviewing your work.
- Do not translate, reword, or rename source text. Do not edit `i18n.py` or
  generated files (`strings.json`, per-locale JSON, `ui-languages.json`). Do not
  add another helper module.
- Do not reformat unrelated code. Keep existing blank lines. Run the project's
  formatter and linter at the end. Leave unrelated edits in a dirty tree alone.
  Delete throwaway scripts and do not commit them.

## Part 1 — Place the helper and the catalogs

Skip this part when `i18n.py` and `locales/` already sit with the code that
uses them and the config points at them.

1. Move `i18n.py` and `locales/` together to where this repository keeps its
   code. A script: leave them at the root. A package or `src/` layout: put them
   in the package, beside the modules that import them. `i18n.py` loads
   `locales/` from its own folder, so do not edit paths inside it.
2. In `ai-i18n-tools.config.json`, point `ui.stringsJson`, `ui.flatOutputDir`,
   and `languagesManifestPath` (if it is set) at the new `locales/`. Set
   `ui.sourceRoots` to the application code instead of `"."`.
3. Update imports (`from i18n import t`, or `from mypkg.i18n import t`). If the
   app is installed or shipped (wheel, container), include `locales/*.json` as
   package data.
4. Run `ai-i18n-tools extract` and confirm the catalog is in the new place.

## Part 2 — Wrap strings

The literal in `t("…")` is the source-language sentence and the catalog key.
With the source locale active, the app must behave exactly as before. Text that
is already wrapped needs no change.

- Wrap text a person sees: labels, titles, captions, messages, errors,
  validation text, progress lines, emails. Leave SQL, regexes, file formats, log
  messages, CSS, identifiers, widget keys, status and enum codes, number and
  date formats, and prompts sent to a model.
- Call shapes: `t("Hello, {name}!", name=name)` and `_("Hello, %s!") % name`.
  Placeholders are `{name}`, `{price:,.2f}`, `{rate:.2%}`, or `{item!r}`, passed
  as keyword arguments. No dotted fields: pass `rate=row.rate`. Keep a literal
  `%` away from a printf letter such as `%d`.
- Look up first, then format. Never `_(f"…")`, `_("…" % x)`, or
  `_("…".format(…))`.
- The argument must be a string literal, so `t(variable)` is invisible. Use one
  `t()` per sentence or paragraph, with values as placeholders. Split only where
  the text already branches. Keep markers that the code detects outside `t()`.
- A value that is both stored and shown keeps its source-language value.
  Translate the label where it is displayed, and compare against the stored
  value.
- `t()` at module level runs once and freezes. Call it where the text is shown.
- Put the import with the project's other first-party imports.

Work in passes: list string literals that are not passed to `t` or `_` (a
throwaway script is fine), wrap the user-facing ones, then list again. Treat any
bulk rewrite as a draft and review its diff.

Then run `ai-i18n-tools extract` and `ai-i18n-tools migrate-python-i18n`
without `--write`, and read `migrate-python-i18n-report.md`. It finds calls that
format before the lookup. Apply its edits with `--write` only after reading
them, run `extract` again, and repeat until the dry run lists nothing. Fix
manual-review lines by hand. A clean report does not prove every sentence is
wrapped, so keep scanning. Do not commit the report.

## Part 3 — Language switch

Skip this part only when the program shows no text a person reads (a silent
job or a JSON-only API), or when the user asked you to leave language choice
out. A command-line program still gets this part: it has no menu, but it gets
a language option and the process locale, the same idea as the ai-i18n-tools
CLI (`-L` / `--ui-lang`, then `AI_I18N_LANG`, then a saved setting, then the
operating-system locale).

Goal: one chosen language applies to every `t()` in that run, and a screen can
remember the choice. Work out how this project's framework does it, using these
rules:

1. Choose the locale where one unit of work starts (process start, a request,
   a script rerun, window start-up, a UI event), and call `set_locale` before
   the first `t()`. That includes CLI help, usage errors, and page titles set
   before the body.
2. Choose in this order: the explicit choice (CLI option, selector, `?lang=`),
   the stored choice (settings, cookie, session), the environment, then the
   source locale. Accept only codes from `get_ui_languages()`, matched
   case-insensitively and by language (`pt-br` and `pt` become `pt-BR`).
   `set_locale` does not match. An explicit option or the app's own language
   variable that names an unavailable language warns once, then uses the source
   locale. A locale taken only from the operating system does not warn.
3. Keep the locale local to the unit of work: keep the token from `set_locale`
   and call `reset_locale(token)` in `finally` or a teardown hook. A new thread
   starts in the source locale.
4. On a screen, add a selector built from `get_ui_languages()` (each row has
   `code` and `label`), labelled `t("Language")`, on every screen that should
   switch, and store the choice. A CLI does not get a selector.
5. Make the change visible on the next command, a page reload, `st.rerun()`, or
   a function that re-applies every visible string. Each string is a
   `t("literal")` so the extractor sees it.
6. Set the text direction from `get_direction()` where the framework needs it.

Command-line programs:

- Add `--lang <code>`, `-L <code>`, and `--lang=<code>`, unless the program
  already uses those names. Read the option from the raw arguments before
  argparse builds help, so `--help` is translated too. Document the option in
  that help.
- After the option, read a language environment variable the app already owns.
  Do not read `AI_I18N_LANG`; that variable is only for the ai-i18n-tools CLI.
  With no such variable, use `LC_ALL`, then `LC_MESSAGES`, then `LANG`, and
  ignore a value of `C` or `POSIX`.
- After the environment, use a language already stored in the app's config.
  Then the host locale, then the source locale. Do not add a new config file
  just to remember the language.

Hints, to adapt rather than copy. Web apps: a middleware or before-request hook
chooses the locale, an after-request hook stores the cookie, and templates get
`t`, `_`, and the language helpers. Streamlit: set the locale at the top of the
entry script, before `st.set_page_config`, with a selectbox that has a fixed
`key`, sets `?lang=`, and calls `st.rerun()`; `streamlit_language_selector()`
sets the locale only after it is drawn. Desktop: set the saved locale before
building the window, and refresh the visible text in the selector handler.

## Verify and report

The tests pass, and none leaves a non-source locale active (`reset_locale` needs
the token from `set_locale`). `extract` writes a non-empty catalog. With the
source locale, the output is unchanged.

Report the files changed, skipped strings grouped by reason, plurals left as one
string, one word with several meanings, sentences built from translated pieces,
and any `t()` that runs at import time. Then list the commands for the user, and
do not run them: `ai-i18n-tools suggest-models` (optional),
`ai-i18n-tools translate-ui`, then restart the app.
````

<a id="review-the-result"></a>
## 审查结果

代理结束时会生成一份报告。在翻译之前检查它：

- 差异。包装后的文本应与之前相同，没有不相关的重新格式化。`git diff --stat` 显示了多少更改。
- 报告中跳过的字符串和模糊情况：复数保留为一个字符串，一个词既用作存储值又用作标题，以及由翻译片段构建的句子。手动决定这些。
- `ai-i18n-tools extract` 运行正常，并且 `strings.json` 位于您预期的文件夹中。
- 您的测试通过，并且应用程序在源语言中看起来相同。
- 没有留下任何一次性脚本或 `migrate-python-i18n-report.md`。

代理遗漏的字符串稍后会显示为保留在源语言中的文本。[步骤 2](#wrap-strings) 有一个可选脚本，用于打印未包装的文本。

<a id="choose-models-and-translate"></a>
## 选择模型并翻译

您运行此部分。它使用您的 API 密钥并在您的账户上花费资金。

`init` 提供的模型列表是一个起点。对当前活跃提供商的聊天模型进行排序，当候选列表确认无误后，将其写入 `translationModels`：

```bash
ai-i18n-tools suggest-models 
ai-i18n-tools suggest-models --apply
```

`--apply` 仅替换 `translationModels`。使用 `--max-output-price` 排除输出价格超出限制的模型。如果您更喜欢 GUI，请使用 `ai-i18n-tools dashboard` 选择[模型](/zh-Hans/guide/translation-dashboard/models)。

然后提取并翻译：

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
```

`extract` 写入 `strings.json` 和 `ui-languages.json`。`translate-ui` 为每种目标语言写入一个 JSON 文件。请勿编辑这些生成的文件。

`t()` 在区域设置 JSON 中查找源句子。`strings.json` 中的 ID 不是查找键。缺少文件或缺少键会返回源句子。助手会将加载的 JSON 保留在进程内存中，包括首次查找时文件缺失的空映射，因此请在 `translate-ui` 后重新启动应用程序。

<a id="check-one-language"></a>
### 检查一种语言

重新启动应用程序，切换到一种目标语言，并打开一个包含一些包装字符串的页面。使用代理添加的语言菜单，或手动设置区域设置。仍然是源语言的文本未被包装，在导入时运行，或者在 `locales/<code>.json` 中没有条目。在怀疑代码之前，请检查 JSON 中的句子。

<a id="keep-it-translated"></a>
## 保持翻译更新

更改源文本后，重新运行 `ai-i18n-tools sync`（或 `extract`，然后 `translate-ui`）。缓存意味着只有新的或更改的字符串才会发送到模型。在 CI 中运行它，以防止翻译偏离。翻译运行后重新启动应用程序，以便它重新加载 JSON。`ai-i18n-tools dashboard` 打开[翻译仪表板](/zh-Hans/guide/translation-dashboard/) 以审查翻译。

要在同一次运行中翻译 `README.md`，请使用 `--with-readme` 搭建脚手架（或将该块添加到现有配置中）。请参阅 [为您的 README 和 Markdown 文档添加 i18n](/zh-Hans/guide/add-i18n-to-readme)。

<a id="do-it-by-hand"></a>
## 手动操作

如果您更喜欢自己进行更改，或者想了解提示的作用，请完成这些步骤。每个步骤都与提示的一部分相对应。最后，您仍然需要[安装 CLI](#install-and-choose-a-provider)、[初始化项目](#initialise-the-project) 和[翻译](#choose-models-and-translate)。

1. 将[助手和目录](#place-the-helper) 放置在此存储库保存其代码的位置。
2. 将[字符串](#wrap-strings) 包装在 `t()` 或 `_()` 中。
3. 使用 `migrate-python-i18n` [检查包装后的调用](#step-3-check-wrapped-calls)。
4. [添加语言切换](#step-4-add-a-language-switch)。

<a id="step-1-place-the-helper-and-the-catalogs"></a>
## 步骤 1：放置助手和目录

`init` 将这些写入存储库根目录：

| 文件 | 是什么 | 是否编辑？ |
| --- | --- | --- |
| `i18n.py` | 您的代码导入的助手 (`t`, `_`, `set_locale`) | 否。它是生成的 |
| `locales/strings.json` | 提取缓存。应用程序从不读取它 | 否。它由提取器生成 |
| `locales/<code>.json` | 应用程序加载的翻译，每种语言一个文件 | 否。`translate-ui` 写入它们 |
| `locales/ui-languages.json` | 语言列表，用于语言菜单 | 否。它由提取器生成 |

`i18n.py` 从其所在文件夹加载 `locales/`。将辅助程序和 `locales/` 文件夹一起移动，并保持 `i18n.py` 中的路径不变。

| 您的存储库 | 它们的位置 |
| --- | --- |
| 存储库根目录中的一个脚本 | 将 `i18n.py` 和 `locales/` 留在 `init` 写入它们的位置 |
| 一个包，包括 `src/` 布局 | 将两者都移到包中，与导入它们的代码放在一起 |

示例：`src/mypkg/` 下的可安装包 `mypkg` 保留 `src/mypkg/i18n.py` 和 `src/mypkg/locales/`。

将配置更新到新位置：

```json
{
  "ui": {
    "sourceRoots": ["src/mypkg"],
    "stringsJson": "src/mypkg/locales/strings.json",
    "flatOutputDir": "src/mypkg/locales"
  }
}
```

`sourceRoots` 是 `extract` 扫描的文件夹。将其保留在应用程序包中，以便测试和数据文件不包含在目录中。语言列表路径 `languagesManifestPath` 在未设置时遵循 `flatOutputDir`。如果配置已设置，请将其更改为匹配。

从您选择的模块路径导入 `t`：存储库根目录中的 `from i18n import t`，或包内的 `from mypkg.i18n import t`。

当应用程序安装或在容器中交付时，区域设置 JSON 必须随包一起传输。将其添加到包数据中（模式是相对于包目录的）：

```toml
[tool.setuptools.package-data]
mypkg = ["locales/*.json"]
```

使用 `ai-i18n-tools extract` 确认。目录应出现在新的 `locales/` 文件夹中。

<a id="step-2-wrap-strings"></a>
## 步骤 2：包装字符串

`extract` 仅当字符串是传递给 `t()` 或 `_()` 的字面量时才记录它。从生成的模块导入它们。

首先查找目录条目，然后进行插值：

```python
t("Hello, {name}!", name=name)
_("Hello, %s!") % name
_("Total: {price:,.2f}").format(price=price)
```

这些在任何查找之前运行格式化，因此提取器将其标记为不安全。[下一步](#step-3-check-wrapped-calls) 会找到它们：

```python
_(f"Hello, {name}!")
_("Hello, %s!" % name)
_("Hello, {name}!".format(name=name))
```

包装用户看到的文本：小部件标签、页面标题、标题、UI 中显示的错误、进度行、验证消息以及包含一些数字的段落。包含插值数字的段落仍然是一个 `t()` 调用。占位符是诸如 `{name}`、`{price:,.2f}` 或 `{rate:.2%}` 之类的名称。传递 `rate=row.rate`。像 `{row.rate:.2%}` 这样的占位符将被拒绝。

保持源措辞不变。缺失的翻译会返回该句子，因此应用程序在源语言中保持不变。

跳过程序匹配或记录的文本：SQL、正则表达式、文件头、日志行、CSS、小部件键、枚举代码以及发送给模型的提示。当一个值既被存储又被显示时（一个选项也在代码中进行比较的选择框），请将存储的值保留在源语言中，并使用 `format_func` 翻译标签。

`t()` 在导入时运行一次，并保持源语言，直到该模块再次导入。在构建小部件时调用 `t()`。

<a id="find-unwrapped-strings"></a>

分阶段工作：列出不是 `t()` 或 `_()` 参数的字面量，包装面向用户的，然后再次列出。以下脚本是可选的。它会打印候选，包括 f-string 和与 `+` 连接的文本。它会跳过文档字符串、SQL 和没有空格的文本，因此像 `Overview` 这样的短标签仍然需要检查。完成后将其删除。重写文件的脚本是草稿：保留现有空行，将新的导入与项目的其他导入放在一起，运行项目的格式化程序，并在保留之前审查差异。

<details>
<summary>可选：列出未包装的字符串</summary>

```python
"""List string literals that are not passed to t() or _().

Usage: python scan_unwrapped.py path/to/package
"""

import ast
import sys
from pathlib import Path

WRAPPERS = {"t", "_", "translate", "gettext", "ngettext", "pgettext"}
SKIP_DIRS = {".venv", "venv", "env", "site-packages", "__pycache__", "node_modules"}
SQL_START = ("SELECT ", "INSERT ", "UPDATE ", "DELETE ", "WITH ", "PRAGMA ")


class Scanner(ast.NodeVisitor):
    def __init__(self) -> None:
        self.hits: list[tuple[int, str]] = []
        self.skip: set[int] = set()

    def mark_docstring(self, body: list[ast.stmt]) -> None:
        first = body[0] if body else None
        if isinstance(first, ast.Expr) and isinstance(first.value, ast.Constant):
            self.skip.add(id(first.value))

    def visit_Module(self, node: ast.Module) -> None:
        self.mark_docstring(node.body)
        self.generic_visit(node)

    def visit_FunctionDef(self, node: ast.FunctionDef) -> None:
        self.mark_docstring(node.body)
        self.generic_visit(node)

    visit_AsyncFunctionDef = visit_FunctionDef
    visit_ClassDef = visit_FunctionDef

    def visit_Call(self, node: ast.Call) -> None:
        func = node.func
        name = func.id if isinstance(func, ast.Name) else getattr(func, "attr", "")
        if name in WRAPPERS and node.args:
            self.skip.add(id(node.args[0]))
        self.generic_visit(node)

    def visit_BinOp(self, node: ast.BinOp) -> None:
        if id(node) in self.skip:
            return
        if not isinstance(node.op, ast.Add):
            self.generic_visit(node)
            return
        pieces: list[ast.expr] = []

        def flatten(item: ast.expr) -> None:
            if isinstance(item, ast.BinOp) and isinstance(item.op, ast.Add):
                flatten(item.left)
                flatten(item.right)
            else:
                pieces.append(item)

        flatten(node)
        texts = [p for p in pieces if isinstance(p, ast.Constant) and isinstance(p.value, str)]
        if not texts:
            self.generic_visit(node)
            return
        joined = "".join(p.value if p in texts else "{...}" for p in pieces)  # type: ignore[union-attr]
        for piece in texts:
            self.skip.add(id(piece))
        self.report(node.lineno, joined)
        for piece in pieces:
            if piece not in texts:
                self.visit(piece)

    def visit_JoinedStr(self, node: ast.JoinedStr) -> None:
        if id(node) not in self.skip:
            parts = [v.value if isinstance(v, ast.Constant) else "{...}" for v in node.values]
            self.report(node.lineno, "".join(str(p) for p in parts))
        # Never report the pieces of an f-string on their own.

    def visit_Constant(self, node: ast.Constant) -> None:
        if id(node) not in self.skip and isinstance(node.value, str):
            self.report(node.lineno, node.value)

    def report(self, line: int, text: str) -> None:
        if " " not in text.strip() or not any(ch.isalpha() for ch in text):
            return
        if text.startswith(SQL_START):
            return
        preview = " ".join(text.split())
        self.hits.append((line, preview if len(preview) <= 140 else preview[:137] + "..."))


def main() -> None:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
    for path in sorted(root.rglob("*.py")):
        if path.name == "i18n.py" or SKIP_DIRS & set(path.parts):
            continue
        scanner = Scanner()
        try:
            tree = ast.parse(path.read_text(encoding="utf-8"))
        except SyntaxError as error:
            print(f"\n# {path}\nskipped, cannot parse with this Python: {error.msg} (line {error.lineno})")
            continue
        scanner.visit(tree)
        if scanner.hits:
            print(f"\n# {path}")
            for line, preview in scanner.hits:
                print(f"{line}: {preview}")


if __name__ == "__main__":
    main()
```

</details>

<a id="step-3-check-wrapped-calls"></a>
## 步骤 3：检查包装的调用

当代码包含在目录查找之前格式化字符串的调用时，请使用此步骤。这通常是旧版包装和代理程序错误（agent slip）的典型情况：

```python
_(f"Hello, {name}!")
_("Hello, %s!" % name)
_("Hello, {name}!".format(name=name))
```

`migrate-python-i18n` 会将这些重写为首先发生的查找。第二次运行不会改变任何内容。

```python
t("Hello, {name}!", name=name)
_("Hello, %s!") % name
t("Hello, {name}!", name=name)
```

像 `st.write(f"Hello, {name}!")` 这样的裸字符串保持不变。包装它们请参阅[包装字符串](#wrap-strings)。如果 `extract` 是干净的，并且代码不包含上述三种形式，则无需重写。

在 `extract` 之后和 `translate-ui` 之前运行它，这样目录就不会将 f-string 存储为键。

```bash
ai-i18n-tools extract
ai-i18n-tools migrate-python-i18n
```

该命令是空运行，直到您传入 `--write`。它会写入 `migrate-python-i18n-report.md`。阅读该报告。当编辑看起来正确时：

```bash
ai-i18n-tools migrate-python-i18n --write
ai-i18n-tools extract
```

再次运行空运行。当它不列出任何编辑时停止，然后运行项目的测试。

命令保留的行（例如 `{value=}` 等调试字段，嵌套格式规范）会在报告中列出。手动修复这些问题并再次运行空运行。生成的 `i18n.py` 会被跳过。该报告是一个构建产物：删除它或将其添加到 git 忽略列表。

没有编辑的报告意味着包装的调用是安全的。这并不意味着每个面向用户的句子都已包装。[未包装的字面量列表](#find-unwrapped-strings) 是对此的检查。

可选的 `--report <path>` 会更改报告路径。可选的 `--ui-block` 将扫描限制为一个 UI 块。

<a id="step-4-add-a-language-switch"></a>
## 步骤 4：添加语言切换功能

每个框架都需要以下四项内容：

1. 在每个请求、脚本运行或窗口事件开始时选择区域设置，并在第一个 `t()` 之前调用 `set_locale`。
2. 仅接受 `ui-languages.json` (`get_ui_languages()`) 中列出的语言，并进行宽松匹配。浏览器发送 `pt-br`，而目录是 `pt-BR`。
3. 提供一个由 `get_ui_languages()` 构建的选择器。
4. 记住选择。

打开 `?lang=pt-BR` 不会执行任何操作，直到应用程序读取它。[代理提示](#run-the-agent-prompt) 为具有用户界面的应用程序完成所有这些工作，并且它会自行确定框架。以下部分显示了 Streamlit、FastAPI、Flask 和 Tkinter 的结果。其他框架遵循相同的规则。

<a id="streamlit"></a>
### Streamlit

Streamlit 脚本在每次交互时都会重新运行，因此，区域设置在每次运行脚本的顶部选择。顺序：

1. 读取上次运行的选择器值，然后是 `?lang=`，然后是存储的区域设置。
2. 在 `st.set_page_config` 之前，使用该代码调用 `set_locale`。
3. 调用 `st.set_page_config(page_title=t("…"))`。
4. 绘制选择器。更改时，存储代码，设置 `?lang=`，并 `st.rerun()`。

一旦用户做出选择，选择器值就会生效。`?lang=` 在首次访问时应用，在该值存在之前。菜单存在于应用程序中，而不是 `i18n.py` 中，因此其标签可以是 `t("Language")`。在每个需要切换的屏幕上显示它，包括登录页面。

<details>
<summary>小组件代码</summary>

```python
import streamlit as st
from i18n import get_locale, get_ui_languages, set_locale, t


def apply_requested_locale() -> str:
    rows = [row for row in get_ui_languages() if row.get("code")]
    codes = [str(row["code"]) for row in rows] or [get_locale()]
    requested = (
        st.session_state.get("lang_selector")
        or st.query_params.get("lang")
        or st.session_state.get("locale")
        or get_locale()
    )
    choice = requested if requested in codes else codes[0]
    set_locale(choice)
    st.session_state["locale"] = choice
    if st.query_params.get("lang") != choice:
        st.query_params["lang"] = choice
    return choice


def render_language_selector() -> None:
    rows = [row for row in get_ui_languages() if row.get("code")]
    codes = [str(row["code"]) for row in rows]
    if len(codes) < 2:
        return
    labels = {str(row["code"]): str(row.get("label") or row["code"]) for row in rows}
    current = get_locale()
    choice = st.sidebar.selectbox(
        t("Language"),
        options=codes,
        index=codes.index(current),
        format_func=lambda code: labels.get(code, code),
        key="lang_selector",
    )
    if choice != current:
        st.session_state["locale"] = choice
        st.query_params["lang"] = choice
        set_locale(choice)
        st.rerun()


apply_requested_locale()
st.set_page_config(page_title=t("My app"))


def main() -> None:
    render_language_selector()
    st.write(t("Hello"))


main()
```

</details>

将 `from i18n import …` 更改为来自[放置帮助程序和目录](#place-the-helper)的包路径。为每个其他小组件提供一个固定的 `key`，并在构建小组件时调用 `t()`。在导入时计算的标签在切换后仍保留在源语言中。当稍后比较页面标题时，包装两侧：`nav.title != t("Forecast settings")`，因为 `nav.title` 已经翻译。

对于标题是纯字符串的短脚本，`i18n.py` 中的 `streamlit_language_selector()` 就足够了。它在绘制小组件时调用 `set_locale`，因此，其上方已翻译的 `page_title` 在该次运行中仍保持在之前的语言，并且其标签保持为英文。请参阅 `examples/python-streamlit`。

<a id="fastapi-flask-and-tkinter"></a>
### FastAPI、Flask 和 Tkinter

<a id="choose-the-locale-for-a-request"></a>
#### 为请求选择区域设置

Web 应用的语言有三个来源，按此顺序排列：访问者的明确选择 (`?lang=`)、记住该选择的 Cookie，以及浏览器的 `Accept-Language` 标头。源语言是备用语言。

`set_locale` 不会验证或规范化其接收到的内容。发送 `pt-br` 或 `pt` 的浏览器将静默获取源语言，因为目录文件是 `pt-BR.json`。下面的模块执行匹配并忽略不在 `ui-languages.json` 中的代码。将其保存在 `i18n.py` 旁边，并从中间件或钩子中导入它（当 `i18n.py` 位于包中时，请使用包路径）。

<details>
<summary>request_locale.py</summary>

```python
"""Choose the UI language for a request. Works with any web framework."""

from __future__ import annotations

from i18n import get_ui_languages


def _codes() -> list[str]:
    return [str(row["code"]) for row in get_ui_languages() if row.get("code")]


def source_locale() -> str:
    for row in get_ui_languages():
        if row.get("isSourceLocale"):
            return str(row["code"])
    return (_codes() or ["en"])[0]


def match(candidate: str | None) -> str | None:
    """Map "pt", "pt_br" or "PT-br" onto a language listed in ui-languages.json."""
    if not candidate:
        return None
    wanted = candidate.strip().replace("_", "-").lower()
    codes = _codes()
    for code in codes:
        if code.lower() == wanted:
            return code
    for code in codes:
        if code.lower().split("-")[0] == wanted.split("-")[0]:
            return code
    return None


def from_accept_language(header: str) -> str | None:
    ranked = []
    for part in header.split(","):
        code, _, params = part.strip().partition(";")
        quality = 1.0
        if params.strip().startswith("q="):
            try:
                quality = float(params.strip()[2:])
            except ValueError:
                quality = 0.0
        if code and code != "*" and quality > 0:
            ranked.append((quality, code))
    for _quality, code in sorted(ranked, key=lambda item: -item[0]):
        found = match(code)
        if found:
            return found
    return None


def pick(query: str | None, cookie: str | None, accept_language: str = "") -> str:
    """An explicit choice (?lang=, then the cookie) beats the browser header."""
    return match(query) or match(cookie) or from_accept_language(accept_language) or source_locale()
```

</details>

<a id="fastapi"></a>
#### FastAPI

在 HTTP 中间件中选择区域设置。保留来自 `set_locale` 的令牌并在 `finally` 中重置它，以便并发请求保持各自的语言。当 `?lang=` 存在时，中间件还会保存 Cookie，并发送 `Content-Language` 和 `Vary`，以便缓存为每种语言保留一个副本。路由照常调用 `t()` 和 `_()`。对于 HTML 页面，将辅助函数一次性添加到模板环境中。

<details>
<summary>FastAPI 中间件和模板</summary>

```python
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates

from i18n import _, get_direction, get_locale, get_ui_languages, reset_locale, set_locale, t
from request_locale import pick

app = FastAPI()
templates = Jinja2Templates(directory="templates")
templates.env.globals.update(
    _=_, t=t, current_locale=get_locale, ui_languages=get_ui_languages, direction=get_direction
)


@app.middleware("http")
async def locale_middleware(request: Request, call_next):
    code = pick(
        request.query_params.get("lang"),
        request.cookies.get("lang"),
        request.headers.get("accept-language", ""),
    )
    token = set_locale(code)
    try:
        response = await call_next(request)
        if request.query_params.get("lang"):
            response.set_cookie("lang", code, max_age=60 * 60 * 24 * 365, samesite="lax")
        response.headers["Content-Language"] = code
        response.headers.append("Vary", "Accept-Language, Cookie")
        return response
    finally:
        reset_locale(token)


@app.get("/greeting/{name}")
def greeting(name: str) -> JSONResponse:
    return JSONResponse({"message": t("Hello, {name}!", name=name), "locale": get_locale()})


@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse(request, "home.html", {"name": "Ada"})
```

</details>

只返回 JSON 的 API 不需要菜单。客户端发送 `Accept-Language` 或 `?lang=`。中间件返回后构建的文本，例如在后台任务中或发送流式响应时，可能会在重置后运行。在返回响应之前构建它。

<a id="flask"></a>
#### Flask

Flask 为每个任务提供一个钩子。`before_request` 选择区域设置并保留令牌，`after_request` 存储 Cookie，`teardown_request` 重置区域设置，并且上下文处理器为模板提供 `t`、`_`、`get_locale`、`get_ui_languages` 和 `get_direction`。Pyramid 使用相同的形式，带有一个 `NewRequest` 订阅者。

<details>
<summary>Flask 钩子</summary>

```python
from flask import Flask, g, render_template, request

from i18n import _, get_direction, get_locale, get_ui_languages, reset_locale, set_locale, t
from request_locale import pick

app = Flask(__name__)


@app.before_request
def choose_locale():
    g.locale = pick(
        request.args.get("lang"),
        request.cookies.get("lang"),
        request.headers.get("Accept-Language", ""),
    )
    g.locale_token = set_locale(g.locale)


@app.after_request
def remember_locale(response):
    if request.args.get("lang"):
        response.set_cookie("lang", g.locale, max_age=60 * 60 * 24 * 365, samesite="Lax")
    response.headers["Content-Language"] = g.locale
    response.vary.add("Accept-Language")
    response.vary.add("Cookie")
    return response


@app.teardown_request
def clear_locale(_error):
    token = g.pop("locale_token", None)
    if token is not None:
        reset_locale(token)


@app.context_processor
def inject_i18n():
    return {
        "_": _,
        "t": t,
        "current_locale": get_locale,
        "ui_languages": get_ui_languages,
        "direction": get_direction,
    }


@app.get("/")
def home():
    return render_template("home.html", name="Ada")
```

</details>

<a id="the-language-menu-in-a-template"></a>
#### 模板中的语言菜单

FastAPI 的 `Jinja2Templates` 和 Flask 都可以渲染此内容。带有 `?lang=` 的链接会保留页面并设置 Cookie，因此该选择会在后续页面上保持不变。`dir` 属性对从右到左的语言使用 `get_direction()`。

<details>
<summary>模板</summary>

```html
<!doctype html>
<html lang="{{ current_locale() }}" dir="{{ direction() }}">
  <body>
    <p>{{ t("Hello, {name}!", name=name) }}</p>
    <nav>
      {% for language in ui_languages() %}
        <a href="?lang={{ language.code }}"{% if language.code == current_locale() %} aria-current="true"{% endif %}>{{ language.label }}</a>
      {% endfor %}
    </nav>
  </body>
</html>
```

</details>

<a id="tkinter"></a>
#### Tkinter

Tkinter 只创建一次其小部件，因此语言更改必须更新它们。将每个可见文本编写为一个函数，该函数调用 `t("…")` 并将字面量包含在其中，使用该函数注册小部件，并在 `set_locale` 之后调用 `refresh()`。`extract` 仍然可以看到每个字面量。将所选代码保存在应用的设置文件中，并在构建窗口之前使用它调用 `set_locale`。

<details>
<summary>带语言菜单的 Tkinter 窗口</summary>

```python
import tkinter as tk
from collections.abc import Callable
from tkinter import ttk

from i18n import get_locale, get_ui_languages, set_locale, t


class App(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self._texts: list[tuple[tk.Misc, Callable[[], str]]] = []
        rows = [row for row in get_ui_languages() if row.get("code")]
        self._codes = [str(row["code"]) for row in rows]
        labels = [str(row.get("label") or row["code"]) for row in rows]
        self.language = ttk.Combobox(self, values=labels, state="readonly")
        self.language.current(self._codes.index(get_locale()))
        self.language.bind("<<ComboboxSelected>>", self._on_language)
        self.language.pack()
        self.greeting = ttk.Label(self)
        self.greeting.pack()
        self.bind_text(self.greeting, lambda: t("Hello, {name}!", name="Ada"))
        self.refresh()

    def bind_text(self, widget: tk.Misc, text: Callable[[], str]) -> None:
        self._texts.append((widget, text))

    def refresh(self) -> None:
        self.title(t("My app"))
        for widget, text in self._texts:
            widget.configure(text=text())

    def _on_language(self, _event: object) -> None:
        set_locale(self._codes[self.language.current()])
        self.refresh()
```

</details>

新线程以源语言启动，而不是窗口的语言。在主线程中进行翻译，或在线程函数开始时调用 `set_locale`。其他工具包需要相同的组件：一个设置所有可见文本的函数，以及一个调用 `set_locale` 然后调用该函数的菜单处理程序。PyQt 和 PySide 有自己的重翻译钩子；请参阅[每个框架中的区域设置](/zh-Hans/guide/ui-strings/python#locale-in-each-framework)。

这是最后一个手动步骤。继续阅读[选择模型并翻译](#choose-models-and-translate)。

<a id="not-your-case"></a>
## 不是您的情况？

| 您拥有 | 阅读 |
| --- | --- |
| Django、Flask-Babel 目录，或已使用 GNU gettext 的应用 | [将 i18n 添加到 Django / Python gettext 应用](/zh-Hans/guide/add-i18n-to-django-gettext) |
| JS/TS 应用程序 | [将 i18n 添加到 JS/TS 应用程序](/zh-Hans/guide/add-i18n-to-js) |
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

使用 `npx degit` 复制一个，或从 GitHub Release 下载 `ai-i18n-tools-python-examples.zip`。命令：[示例](/zh-Hans/examples#python-examples)。对于使用 gettext 的应用，请参阅 [gettext 示例](/zh-Hans/examples#python-gettext)。
