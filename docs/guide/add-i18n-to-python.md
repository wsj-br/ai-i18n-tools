<a id="add-i18n-to-a-python-app"></a>
# Add i18n to a Python app

This page takes a Python application that has a single language and adds locales with ai-i18n-tools. It follows one path: the `ui-python` template, a small `i18n.py` helper, and JSON files of translations. That path fits Streamlit, FastAPI, Flask, desktop apps, and scripts.

The quickest way is to give a coding agent the prompt on this page. It sets up the config, wraps your strings, checks the result, and can add a language menu. You install the CLI, choose the provider, and initialise the project yourself, because that needs your API key and your choices. You also run the translation yourself, because it spends money on your account.

Using Django, Flask-Babel catalogs, or GNU gettext, and want to keep those calls? Use [Add i18n to a Django / Python gettext app](/guide/add-i18n-to-django-gettext) instead. It keeps `gettext` and writes `.po` and `.mo` files, with no helper. Not sure which applies? See [Not your case?](#not-your-case) at the end.

The flow:

1. [Install the CLI and choose a provider](#install-and-choose-a-provider).
2. [Initialise the project](#initialise-the-project) with `init`.
3. [Run the agent prompt](#run-the-agent-prompt).
4. [Review the result](#review-the-result).
5. [Choose models and translate](#choose-models-and-translate), then check one language.
6. [Keep it translated](#keep-it-translated).

Prefer to make the changes yourself, or want to know what the prompt does? [Do it by hand](#do-it-by-hand) walks through the same steps one at a time.

<a id="install-and-choose-a-provider"></a>
## Install and choose a provider

You do this part, not the agent. The installer changes your machine, and the API key is a secret that belongs in your shell, not in a prompt.


Use the npm package when the machine already has Node.js `>=22.16.0` ([Installation](/guide/installation)). For a Python project, install the standalone executable (no Node.js).

Linux and macOS:

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell):

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

The installer checks `SHA256SUMS.txt`, installs the command as `ai-i18n-tools`, and adds it to `PATH`. The binaries are not notarised or Authenticode-signed. Manual steps and asset names: [Standalone executables](/guide/installation#standalone-executables).

Check the install:

```bash
ai-i18n-tools --version
```

Then choose a provider and set its API key in the shell that will run the translation. For example, Cheaper Inference:

```bash
export CHEAPERINFERENCE_API_KEY=your-key-here
```

Ollama needs no key. Other presets: [Built-in providers](/guide/providers-and-models#built-in-providers). Note the provider name, because you pass it to `init` in the next step. The agent never needs the key: it only runs commands that make no model calls. You use the key later, when you [translate](#choose-models-and-translate).

<a id="initialise-the-project"></a>
## Initialise the project

You run this once, before the prompt. It writes the config and the `i18n.py` helper, and it uses the provider you chose above.

This page uses one template, `ui-python`. It writes the config, the `i18n.py` helper, and JSON catalogs. It fits these apps:

| Your app | Notes |
| --- | --- |
| Streamlit | The language menu needs a few lines in the app; see [Add a language switch](#step-4-add-a-language-switch) |
| FastAPI | The locale is set per request |
| Flask | Flat JSON catalogs. For Flask-Babel catalogs in `translations/`, use the [gettext page](/guide/add-i18n-to-django-gettext) |
| Pyramid | Same wiring as Flask |
| Desktop apps (Tkinter, PyQt, PySide) | Rebuild the visible text after the locale changes |
| PyWebView | The template covers the Python shell. Translate its HTML page separately |
| Command-line tools and scripts | The simplest case |

Run init with the provider you chose (Cheaper Inference in this example):

```bash
ai-i18n-tools init -t ui-python -P cheaperinference
```

Then edit `sourceLocale` and `targetLocales` in `ai-i18n-tools.config.json`. `sourceLocale` is the language of the strings in the source. Any BCP-47 language is valid; examples often use `en`.

Run `init` once. It rewrites `ai-i18n-tools.config.json` every time, so a second run drops edits you have made. If `i18n.py` already contains the marker `ai-i18n-tools-i18n-py`, the project is already initialised: skip this step.

`init` sets `ui.sourceRoots` to `"."`, so `extract` would scan the whole repository (tests, scripts, docs). The prompt narrows it to your application code (by hand, that is [Step 1](#place-the-helper)).

Framework wiring: [Python integrations](/guide/integrations/python). Call shapes and catalog layout: [Python applications](/guide/ui-strings/python).

<a id="run-the-agent-prompt"></a>
## Run the agent prompt

Open the project in your coding agent (Cursor, Claude Code, Copilot, or similar), start a new chat, and paste the prompt below. The project must already be initialised. There is nothing to edit. If you want something left out, for example no language menu, say so in the same message.

The agent first checks that the CLI, the config, and `i18n.py` exist, and stops with instructions if one is missing. Then it works in three parts:

- Part 1 puts `i18n.py` and `locales/` where the repository keeps its code, and points the config at them.
- Part 2 wraps the user-facing strings in `t()` and `_()`, runs `extract`, and checks the wrapped calls with `migrate-python-i18n`.
- Part 3 adds a language menu, or a CLI language option and environment locale.

It does not install or initialise anything, read your API key, or translate. Translation is the step after the review, and you run it.


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
## Review the result

The agent ends with a report. Check it before you translate:

- The diff. Wrapped text should read the same as before, with no unrelated reformatting. `git diff --stat` shows how much changed.
- The skipped strings and the ambiguous cases in the report: plurals left as one string, one word used as a stored value and as a caption, and sentences built from translated pieces. Decide those by hand.
- `ai-i18n-tools extract` runs clean, and `strings.json` is in the folder you expect.
- Your tests pass, and the app looks the same in the source language.
- No throwaway script or `migrate-python-i18n-report.md` was left behind.

Strings the agent missed show up as text that stays in the source language later. [Step 2](#wrap-strings) has an optional script that prints text that is not wrapped.

<a id="choose-models-and-translate"></a>
## Choose models and translate

You run this part. It uses your API key and spends money on your account.

The model list from `init` is a starting point. Rank the active provider's chat models and, when the shortlist looks right, write it into `translationModels`:

```bash
ai-i18n-tools suggest-models 
ai-i18n-tools suggest-models --apply
```

`--apply` replaces only `translationModels`. Use `--max-output-price` to exclude models whose output price exceeds a limit. If you prefer a GUI, use `ai-i18n-tools dashboard` to select the [models](/guide/translation-dashboard/models). 

Then extract and translate:

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
```

`extract` writes `strings.json` and `ui-languages.json`. `translate-ui` writes one JSON file per target language. Leave those generated files unedited.

`t()` looks up the source sentence in the locale JSON. The id in `strings.json` is not the lookup key. A missing file or a missing key returns the source sentence. The helper keeps the loaded JSON in memory for the process, including an empty map when the file was missing on the first lookup, so restart the app after `translate-ui`.

<a id="check-one-language"></a>
### Check one language

Restart the app, switch to one target language, and open a page with a few wrapped strings. Use the language menu the agent added, or set the locale by hand. Text that is still in the source language was not wrapped, runs at import time, or has no entry in `locales/<code>.json`. Check the JSON for the sentence before you suspect the code.

<a id="keep-it-translated"></a>
## Keep it translated

Re-run `ai-i18n-tools sync` (or `extract` then `translate-ui`) after changing source text. The cache means only new or changed strings go to the model. Run it in CI so translations do not drift. Restart the app after a translation run so it reloads the JSON. `ai-i18n-tools dashboard` opens the [Translation Dashboard](/guide/translation-dashboard/) to review translations.

To translate `README.md` in the same run, scaffold with `--with-readme` (or add the block to an existing config). See [Add i18n to your README and Markdown docs](/guide/add-i18n-to-readme).

<a id="do-it-by-hand"></a>
## Do it by hand

Work through these steps if you prefer to make the changes yourself, or you want to know what the prompt does. Each step matches a part of the prompt. You still [install the CLI](#install-and-choose-a-provider), [initialise the project](#initialise-the-project), and [translate](#choose-models-and-translate) at the end.

1. [Place the helper and the catalogs](#place-the-helper) where this repository keeps its code.
2. [Wrap strings](#wrap-strings) in `t()` or `_()`.
3. [Check wrapped calls](#step-3-check-wrapped-calls) with `migrate-python-i18n`.
4. [Add a language switch](#step-4-add-a-language-switch).

<a id="step-1-place-the-helper-and-the-catalogs"></a>
## Step 1: Place the helper and the catalogs

`init` writes these at the repository root:

| File | What it is | Edit it? |
| --- | --- | --- |
| `i18n.py` | The helper your code imports (`t`, `_`, `set_locale`) | No. It is generated |
| `locales/strings.json` | The extraction cache. The app never reads it | No. It is generated by the extractor |
| `locales/<code>.json` | The translations the app loads, one file per language | No. `translate-ui` writes them |
| `locales/ui-languages.json` | The list of languages, for a language menu | No. It is generated by the extractor |

`i18n.py` loads `locales/` from the folder it sits in. Move the helper and the `locales/` folder together, and leave the paths inside `i18n.py` unchanged.

| Your repository | Where they go |
| --- | --- |
| One script at the repository root | Leave `i18n.py` and `locales/` where `init` wrote them |
| A package, including a `src/` layout | Move both into the package, next to the code that imports them |

Example: an installable package `mypkg` under `src/mypkg/` keeps `src/mypkg/i18n.py` and `src/mypkg/locales/`.

Update the config to the new place:

```json
{
  "ui": {
    "sourceRoots": ["src/mypkg"],
    "stringsJson": "src/mypkg/locales/strings.json",
    "flatOutputDir": "src/mypkg/locales"
  }
}
```

`sourceRoots` is the folder `extract` scans. Keep it on the application package so tests and data files stay out of the catalog. The language list path, `languagesManifestPath`, follows `flatOutputDir` when it is not set. If the config already sets it, change it to match.

Import `t` from the module path you chose: `from i18n import t` at the repository root, or `from mypkg.i18n import t` inside a package.

When the app is installed or shipped in a container, the locale JSON has to travel with the package. Add it to package data (the pattern is relative to the package directory):

```toml
[tool.setuptools.package-data]
mypkg = ["locales/*.json"]
```

Confirm with `ai-i18n-tools extract`. The catalog should appear in the new `locales/` folder.

<a id="step-2-wrap-strings"></a>
## Step 2: Wrap strings

`extract` records a string only when it is a literal passed to `t()` or `_()`. Import them from the generated module.

Look up the catalog entry first, then interpolate:

```python
t("Hello, {name}!", name=name)
_("Hello, %s!") % name
_("Total: {price:,.2f}").format(price=price)
```

These run the formatting before any lookup, so the extractor marks them unsafe. The [next step](#step-3-check-wrapped-calls) finds them:

```python
_(f"Hello, {name}!")
_("Hello, %s!" % name)
_("Hello, {name}!".format(name=name))
```

Wrap text a person sees: widget labels, page titles, captions, errors shown in the UI, progress lines, validation messages, and paragraphs that include a few numbers. A paragraph with interpolated numbers is still one `t()` call. Placeholders are names such as `{name}`, `{price:,.2f}`, or `{rate:.2%}`. Pass `rate=row.rate`. A placeholder like `{row.rate:.2%}` is rejected.

Leave the source wording as it is. A missing translation returns that sentence, so the app stays the same in the source language.

Skip text the program matches or logs: SQL, regexes, file headers, logger lines, CSS, widget keys, enum codes, and prompts you send to a model. When a value is both stored and shown (a select box whose option is also compared in code), keep the stored value in the source language and translate the label with `format_func`.

`t()` at import time runs once and keeps the source language until that module is imported again. Call `t()` when the widget is built.

<a id="find-unwrapped-strings"></a>

Work in passes: list literals that are not arguments of `t()` or `_()`, wrap the user-facing ones, then list again. The script below is optional. It prints candidates, including f-strings and text joined with `+`. It skips docstrings, SQL, and text with no space, so a short label such as `Overview` still needs a look. Delete it when you are done. A script that rewrites files is a draft: keep existing blank lines, put the new import with the project's other imports, run the project's formatter, and review the diff before you keep it.

<details>
<summary>Optional: list strings that are not wrapped</summary>

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
## Step 3: Check wrapped calls

Use this step when the code contains calls that format the string before the catalog lookup. That is typical of older wrapping and of an agent slip:

```python
_(f"Hello, {name}!")
_("Hello, %s!" % name)
_("Hello, {name}!".format(name=name))
```

`migrate-python-i18n` rewrites those into a lookup that happens first. A second run changes nothing.

```python
t("Hello, {name}!", name=name)
_("Hello, %s!") % name
t("Hello, {name}!", name=name)
```

Bare strings such as `st.write(f"Hello, {name}!")` stay as they are. Wrapping them is [Wrap strings](#wrap-strings). If `extract` is clean and the code has none of the three shapes above, there is nothing to rewrite.

Run it after `extract` and before `translate-ui`, so the catalog never stores an f-string as a key.

```bash
ai-i18n-tools extract
ai-i18n-tools migrate-python-i18n
```

The command is a dry run until you pass `--write`. It writes `migrate-python-i18n-report.md`. Read that report. When the edits look right:

```bash
ai-i18n-tools migrate-python-i18n --write
ai-i18n-tools extract
```

Run the dry run again. Stop when it lists no edits, then run the project's tests.

Lines the command leaves in place (debug fields such as `{value=}`, nested format specs) are listed in the report. Fix those by hand and run the dry run again. Generated `i18n.py` is skipped. The report is a build artefact: delete it or git-ignore it.

A report with no edits means the wrapped calls are safe. It does not mean every user-facing sentence was wrapped. The [unwrapped-literal list](#find-unwrapped-strings) is the check for that.

Optional `--report <path>` changes the report path. Optional `--ui-block` limits the scan to one UI block.

<a id="step-4-add-a-language-switch"></a>
## Step 4: Add a language switch

Every framework needs the same four things:

1. Choose the locale at the start of each request, script run, or window event, and call `set_locale` before the first `t()`.
2. Accept only languages listed in `ui-languages.json` (`get_ui_languages()`), and match them loosely. Browsers send `pt-br`, while the catalog is `pt-BR`.
3. Offer a selector built from `get_ui_languages()`.
4. Remember the choice.

Opening `?lang=pt-BR` does nothing until the app reads it. The [agent prompt](#run-the-agent-prompt) does all of this for apps that have a user interface, and it works out the framework for itself. The sections below show the result for Streamlit, FastAPI, Flask, and Tkinter. Other frameworks follow the same rules.

<a id="streamlit"></a>
### Streamlit

A Streamlit script reruns on every interaction, so the locale is chosen at the top of the script on every run. Order:

1. Read the selector value from the previous run, then `?lang=`, then the stored locale.
2. Call `set_locale` with that code, before `st.set_page_config`.
3. Call `st.set_page_config(page_title=t("…"))`.
4. Draw the selector. On change, store the code, set `?lang=`, and `st.rerun()`.

The selector value wins once the user has chosen. `?lang=` applies on a fresh visit, before that value exists. The menu lives in the app, not in `i18n.py`, so its label can be `t("Language")`. Show it on every screen that should switch, including a sign-in page.

<details>
<summary>Widget code</summary>

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

Change `from i18n import …` to the package path from [Place the helper and the catalogs](#place-the-helper). Give every other widget a fixed `key`, and call `t()` when the widget is built. Labels computed at import time stay in the source language after a switch. When a page title is compared later, wrap both sides: `nav.title != t("Forecast settings")`, because `nav.title` is already translated.

`streamlit_language_selector()` from `i18n.py` is enough for a short script whose title is a plain string. It calls `set_locale` when the widget is drawn, so a translated `page_title` above it stays on the previous language for that run, and its label stays English. See `examples/python-streamlit`.

<a id="fastapi-flask-and-tkinter"></a>
### FastAPI, Flask, and Tkinter

<a id="choose-the-locale-for-a-request"></a>
#### Choose the locale for a request

A web app has three sources for the language, in this order: the visitor's explicit choice (`?lang=`), the cookie that remembers it, and the browser's `Accept-Language` header. The source language is the fallback.

`set_locale` does not validate or normalise what it is given. A browser that sends `pt-br` or `pt` would silently get the source language, because the catalog file is `pt-BR.json`. The module below does the matching and ignores codes that are not in `ui-languages.json`. Save it next to `i18n.py`, and import it from the middleware or hook (use the package path when `i18n.py` is inside a package).

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

Choose the locale in HTTP middleware. Keep the token from `set_locale` and reset it in `finally`, so concurrent requests keep their own language. The middleware also saves the cookie when `?lang=` is present, and sends `Content-Language` and `Vary` so caches keep one copy per language. Routes call `t()` and `_()` as usual. For HTML pages, add the helpers to the template environment once.

<details>
<summary>FastAPI middleware and templates</summary>

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

An API that returns only JSON needs no menu. Clients send `Accept-Language` or `?lang=`. Text built after the middleware returns, such as in a background task or while a streaming response is sent, may run after the reset. Build it before you return the response.

<a id="flask"></a>
#### Flask

Flask has a hook for each job. `before_request` chooses the locale and keeps the token, `after_request` stores the cookie, `teardown_request` resets the locale, and a context processor gives the templates `t`, `_`, `get_locale`, `get_ui_languages`, and `get_direction`. Pyramid uses the same shape with a `NewRequest` subscriber.

<details>
<summary>Flask hooks</summary>

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
#### The language menu in a template

FastAPI's `Jinja2Templates` and Flask both render this. A link that carries `?lang=` keeps the page and sets the cookie, so the choice sticks on later pages. The `dir` attribute uses `get_direction()` for right-to-left languages.

<details>
<summary>Template</summary>

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

Tkinter creates its widgets once, so a language change has to update them. Write each visible text as a function that calls `t("…")` with the literal inside it, register the widget with that function, and call `refresh()` after `set_locale`. `extract` still sees every literal. Save the chosen code in the app's settings file, and call `set_locale` with it before the window is built.

<details>
<summary>Tkinter window with a language menu</summary>

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

A new thread starts in the source language, not the window's. Translate in the main thread, or call `set_locale` at the start of the thread function. Other toolkits need the same pieces: a function that sets every visible text, and a menu handler that calls `set_locale` and then that function. PyQt and PySide have their own retranslate hooks; see [Locale in each framework](/guide/ui-strings/python#locale-in-each-framework).

That is the last manual step. Continue at [Choose models and translate](#choose-models-and-translate).

<a id="not-your-case"></a>
## Not your case?

| You have | Read |
| --- | --- |
| Django, Flask-Babel catalogs, or an app that already uses GNU gettext | [Add i18n to a Django / Python gettext app](/guide/add-i18n-to-django-gettext) |
| A JS/TS app | [Add i18n to a JS/TS app](/guide/add-i18n-to-js) |
| A website or docs site | [Add i18n to a website or docs site](/guide/add-i18n-to-website) |
| A repository README or other Markdown files | [Add i18n to your README and Markdown docs](/guide/add-i18n-to-readme) |
| Nested locale JSON | [JSON](/guide/json) |

<a id="examples"></a>
## Examples

| Example | What it shows |
| --- | --- |
| [python-streamlit](/examples#python-streamlit) | Dashboard, `t()` / `_()`, flat JSON |
| [python-fastapi](/examples#python-fastapi) | Request-scoped locale, flat JSON |
| [python-flask](/examples#python-flask) | Flask + Jinja, flat JSON |

Copy one with `npx degit`, or download `ai-i18n-tools-python-examples.zip` from the GitHub Release. Commands: [Examples](/examples#python-examples). For an app that uses gettext, see the [gettext example](/examples#python-gettext).
