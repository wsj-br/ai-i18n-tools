<a id="add-i18n-to-a-django-python-gettext-app"></a>
# Add i18n to a Django / Python gettext app

This page is for a Python application that translates with GNU gettext, or one that will: Django, Flask with Flask-Babel style catalogs, or any app that calls `gettext()`. You keep the gettext calls. ai-i18n-tools reads them, translates the messages, and writes the `.po` and compiled `.mo` files your app already loads. No helper module is needed.

The quickest way is to give a coding agent the prompt on this page. It sets up the config, wraps your strings, checks the result, and can add a language switch. You install the CLI, choose the provider, and initialise the project yourself, because that needs your API key and your choices. You also run the translation yourself, because it spends money on your account and rewrites your `.po` and `.mo` files.

Building a Streamlit, FastAPI, Flask, desktop, or script app that has no gettext today? Use [Add i18n to a Python app](/guide/add-i18n-to-python) instead. It adds a small `i18n.py` helper and writes JSON catalogs. Not sure which applies? See [Not your case?](#not-your-case) at the end.

The flow:

1. [Install the CLI and choose a provider](#install).
2. [Initialise the project](#pick-a-template) with `init`.
3. [Run the agent prompt](#agent-prompt-django-gettext).
4. [Review the result](#review-the-result).
5. [Choose models and translate](#translate), then check one language.
6. [Keep it translated](#keep-it-translated).

Prefer to make the changes yourself, or want to know what the prompt does? [Do it by hand](#do-it-by-hand) walks through the same steps one at a time.

<a id="install"></a>
<a id="choose-a-provider"></a>
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

The installer checks `SHA256SUMS.txt`, installs the command as `ai-i18n-tools`, and adds it to `PATH`. The binaries are not notarized or Authenticode-signed. Manual steps and asset names: [Standalone executables](/guide/installation#standalone-executables).

Check the install:

```bash
ai-i18n-tools --version
```

Then choose a provider and set its API key in the shell that will run the translation. For example, Cheaper Inference:

```bash
export CHEAPERINFERENCE_API_KEY=your-key-here
```

Ollama needs no key. Other presets: [Built-in providers](/guide/providers-and-models#built-in-providers). Note the provider name, because you pass it to `init` in the next step. The agent never needs the key: it only runs commands that make no model calls. You use the key later, when you [translate](#translate).

<a id="pick-a-template"></a>
<a id="initialise-the-project"></a>
## Initialise the project

You run this once, before the prompt. It writes the config, and it uses the provider you chose above. Pick the template that matches your app:

| Your app | Template | Catalogs it writes |
| --- | --- | --- |
| Django | `ui-python-django` | `locale/<lang>/LC_MESSAGES/django.po` and `.mo` |
| Flask with Flask-Babel style catalogs | `ui-python-flask` | `translations/<lang>/LC_MESSAGES/messages.po` and `.mo` |
| Any other Python app that already uses GNU gettext | `ui-python-gettext` | `locales/<lang>/LC_MESSAGES/messages.po` and `.mo` |

Run init with the template name and the provider you chose:

```bash
ai-i18n-tools init -t ui-python-django -P cheaperinference
```

Run `init` once. It rewrites `ai-i18n-tools.config.json` every time, so a second run drops edits you have made. If the config already exists and is customised, skip `init` and edit the config.

`ui-python-gettext` and `ui-python-flask` also write an `i18n.py` helper when that file is missing. A gettext app does not need it, so delete it (the prompt does this for you). `ui-python-gettext` also writes JSON files next to the gettext catalogs. To write gettext catalogs only, set `"flatOutput": false` in the `ui` block (the prompt does this too). `ui-python-django` writes neither the helper nor JSON, because Django keeps its own translation system.

Then edit `sourceLocale` and `targetLocales` in `ai-i18n-tools.config.json`. `sourceLocale` is the language of the strings in your code. Any BCP-47 language is valid; examples often use `en`. Write target codes as `pt-BR`. The catalog folder is `pt_BR`, the form gettext and Django expect (`localeFormat` is `posix`).

<a id="agent-prompt-django-gettext"></a>

<a id="agent-prompt-django-and-native-gettext"></a>

<a id="run-the-agent-prompt"></a>
## Run the agent prompt

Open the project in your coding agent (Cursor, Claude Code, Copilot, or similar), start a new chat, and paste the prompt below. The project must already be initialised. There is nothing to edit. If you want something left out, for example no language switch, say so in the same message.

The agent first checks that the CLI and the config exist, and stops with instructions if one is missing. Then it works in four parts:

- Part 1 makes the config match your existing catalogs, and removes the `i18n.py` that some templates write.
- Part 2 wraps the user-facing strings with the gettext calls you already use, and the template tags.
- Part 3 runs `extract` and finds calls that format before the lookup.
- Part 4 adds the language switch.

It does not install or initialise anything, read your API key, or translate. It does not run `makemessages` or `compilemessages`, and it leaves your `.po` and `.mo` files alone. Translation is the step after the review, and you run it.

<details class="agent-prompt">
<summary>Agent prompt: add languages to a Django or gettext app</summary>

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
## Review the result

The agent ends with a report. Check it before you translate:

- The diff. Only wrapped calls, template tags, the config, and the language switch should have changed. Your `.po` and `.mo` files should be untouched until you translate.
- `ai-i18n-tools.config.json`: `gettext.outputDir` and `domain` point at the catalogs your app loads, and `sourceRoots` covers the application code.
- `ai-i18n-tools extract` lists the new messages and keeps the translations already in your `.po` files.
- The dry run of `migrate-python-i18n` lists nothing that is left to fix.
- Django's checks and your tests pass, and the app looks the same in the source language.
- The skipped strings and ambiguous cases in the report: plurals left as one string, one word with two meanings, and sentences built from translated pieces. Decide those by hand.

Commit this state. `translate-ui` rewrites your `.po` files, so you will want a clean diff to review.

<a id="translate"></a>
## Choose models and translate

You run this part. It uses your API key, spends money on your account, and rewrites your `.po` files, so commit first.

The model list from `init` is a starting point. Rank the active provider's chat models and, when the shortlist looks right, write it into `translationModels`:

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` replaces only `translationModels`. The same ranking is on the [Models](/guide/translation-dashboard/models) tab. Then translate:

```bash
ai-i18n-tools translate-ui
```

`translate-ui` writes the `.pot` template, one `.po` per target locale, and the compiled `.mo`. Leave those files unedited from now on, because the next run regenerates them. Review the first diff before you commit it.

Restart the server if it does not pick up the new `.mo` files.

<a id="check-one-language"></a>
### Check one language

Switch to one target language and look at a page with a few wrapped strings. Texts that still show the source language were not wrapped, or the `.mo` was not reloaded. Texts that show `%(name)s` in the output lost their dictionary. Check the placeholders in the `.po` file.

<a id="keep-it-translated"></a>
## Keep it translated

Re-run `ai-i18n-tools sync` (or `extract` then `translate-ui`) after changing source text. The cache means only new or changed strings go to the model. Run it in CI so translations do not drift. `ai-i18n-tools dashboard` opens the [Translation Dashboard](/guide/translation-dashboard/) to review translations.

`purge-locale` removes a locale's `.po` and `.mo`. Commit the `.po` files. Commit the `.mo` files too unless your build compiles them.

To translate `README.md` in the same run, scaffold with `--with-readme` (or add the block to an existing config). See [Add i18n to your README and Markdown docs](/guide/add-i18n-to-readme).

<a id="do-it-by-hand"></a>
## Do it by hand

Work through these steps if you prefer to make the changes yourself, or you want to know what the prompt does. Each step matches a part of the prompt. You still [install the CLI](#install), [initialise the project](#pick-a-template), and [translate](#translate) at the end.

1. [Point the config at your catalogs](#point-the-config).
2. [Wrap strings](#wrap-strings) with the gettext calls you already use.
3. [Extract and check the calls](#extract-and-check).
4. [Switch language at runtime](#switch-language).

<a id="point-the-config"></a>
## Step 1: Point the config at your catalogs

The template writes sensible defaults. This is the Django one:

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

Check four things against your project:

- `gettext.outputDir` and `potPath` are where your catalogs already live. Django: the folder in `LOCALE_PATHS`, or the `locale/` folder inside an app. Flask-Babel: `translations/`.
- `gettext.domain` is the file name your app loads. Django uses `django`. Flask-Babel uses `messages`. For plain gettext it is the domain in your `gettext.translation(...)` call.
- `sourceRoots` lists the folders that `extract` scans. Narrow it from `"."` to your application code, so tests and scripts stay out of the catalog.
- `stringsJson` is the extraction cache, a file this tool owns. Keep it next to the catalogs. It is not a runtime file. Your app never reads it.

When each Django app keeps its own `locale/` folder, use one `ui` block per catalog tree. `ui` accepts a list, and `--ui-block` runs one block. Paths must be unique across blocks. See [Configuration](/reference/configuration).

`ingestExistingPo` is on by default. During `extract`, translations already in your `.po` files fill empty slots. A translation that is already set is not replaced. Commit your catalogs before the first `translate-ui`, because it rewrites the `.po` files and compiles the `.mo` files. Review that diff.

`compileMo` writes the `.mo` for you, so you do not need `compilemessages` in this workflow. Choose one tool to write the catalogs: running `makemessages` after `translate-ui` rewrites the same `.po` files.

<a id="wrap-strings"></a>
## Step 2: Wrap strings

`extract` records a string only when it is a literal passed to one of the function names in `ui.uiExtractor.funcNames`, or a template tag. Keep the calls you have. Add what is missing.

Python code:

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

Placeholders use `%(name)s`. Pass the values after the lookup with `%`, never before it. Models, forms, and settings run when the module is imported, so they use the lazy form. Do not apply `%` to a lazy string at import time. Use `format_lazy` instead.

Templates (Django `{% load i18n %}`, or Jinja in Flask):

```jinja
{% load i18n %}
<h1>{% translate "Welcome back" %}</h1>
{% blocktranslate with name=user.name %}Hello, {{ name }}!{% endblocktranslate %}
```

`{% translate %}`, `{% trans %}`, `{% blocktranslate %}`, and `{% blocktrans %}` are collected on their own. A template variable such as <code v-pre>{{ name }}</code> is stored as `%(name)s`. Keep it in that form.

Names `extract` does not know are skipped. The default list is `_`, `t`, `translate`, `i18n.t`, `gettext`, `ngettext`, `pgettext`, and `self.tr`. If the code calls `gettext_lazy("…")` directly, `ngettext_lazy`, `pgettext_lazy`, `npgettext`, or `gettext_noop`, add those names to `ui.uiExtractor.funcNames`. When you import the lazy function as `_`, as in `gettext_lazy as _`, the name `_` is already covered.

Wrap text a person sees: labels, headings, messages, form and model text, emails. Leave identifiers, URLs, field names, settings keys, log messages, and migrations alone. Do not reword the source text. A missing translation returns the source sentence, so the app looks the same in the source language.

These calls evaluate the formatting before the lookup, so the string never matches a catalog entry:

```python
_(f"Hello, {name}!")
_("Hello, %s!" % name)
_("Hello, {name}!".format(name=name))
```

<a id="extract-and-check"></a>
## Step 3: Extract and check the calls

Run `extract` once the calls are wrapped. It writes the extraction cache and fills empty slots from your existing `.po` files. It does not call a model.

```bash
ai-i18n-tools extract
```

Then look for calls that format before the lookup. `migrate-python-i18n` finds them. Run it without `--write`:

```bash
ai-i18n-tools migrate-python-i18n
```

It writes `migrate-python-i18n-report.md`. Read it and fix each listed call by hand with `%(name)s` and a dictionary. Delete the report or git-ignore it.

Do not pass `--write` on this page. That option rewrites an f-string or a `.format()` call into `t("…", name=name)`, a call that exists only in the `i18n.py` helper. A gettext app has no `t`. A report with no lines means the wrapped calls are safe. It does not mean every sentence was wrapped, so read the diff of `strings.json` and look for text you expected to see.

<a id="switch-language"></a>
## Step 4: Switch language at runtime

Your framework chooses the language. ai-i18n-tools does not add a menu or a helper.

<a id="django"></a>
### Django

In `settings.py`:

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

`LocaleMiddleware` goes after the session middleware and before `CommonMiddleware`. `LANGUAGE_CODE` is the source language. `LANGUAGES` lists the languages a visitor can pick. `LOCALE_PATHS` points at the folder `gettext.outputDir` writes to, unless each app keeps its own `locale/` folder.

Add Django's language switch view to `urls.py`:

```python
from django.urls import include, path

urlpatterns = [
    path("i18n/", include("django.conf.urls.i18n")),
    # ...
]
```

Then add a form to a template:

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

The view saves the choice in a cookie. To put the language in the URL instead, use `i18n_patterns`. Both are standard Django features. See Django's documentation on internationalisation.

<a id="plain-gettext"></a>
### Plain gettext and Flask-Babel

Load the catalog for the language you want and call it. The [python-gettext](/examples#python-gettext) example does this in a command-line tool:

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

Convert `pt-BR` to `pt_BR`, the folder name `translate-ui` wrote. Keep `fallback=True` so a missing catalog shows the source text. In a web app, build the translations object per request and do not install one globally with `gettext.install`, or concurrent requests will share a language. In Flask-Babel, return the code from your locale selector function, and keep `translations/` as its translation directory.

That is the last manual step. Continue at [Choose models and translate](#translate).

<a id="not-your-case"></a>
## Not your case?

| You have | Read |
| --- | --- |
| A Streamlit, FastAPI, Flask, desktop, or script app with no gettext | [Add i18n to a Python app](/guide/add-i18n-to-python) |
| A JS/TS app | [Add i18n to a JS/TS app](/guide/add-i18n-to-js) |
| A website or docs site | [Add i18n to a website or docs site](/guide/add-i18n-to-website) |
| A repository README or other Markdown files | [Add i18n to your README and Markdown docs](/guide/add-i18n-to-readme) |

<a id="examples"></a>
## Examples

| Example | What it shows |
| --- | --- |
| [python-gettext](/examples#python-gettext) | An existing gettext command-line tool; `translate-ui` refreshes `.po` and `.mo` |

There is no Django example directory. The `python-gettext` example shows the same config shape with domain `messages`. Copy it with `npx degit`, or download `ai-i18n-tools-python-examples.zip` from the GitHub Release. Commands: [Examples](/examples#python-examples).
