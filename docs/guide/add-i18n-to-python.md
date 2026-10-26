<a id="add-i18n-to-a-python-app"></a>
# Add i18n to a Python app

This walkthrough takes a Python application that has a single language and adds locales with ai-i18n-tools. Bare user-facing strings are wrapped by hand or with the prompts under [Wrap strings](#wrap-strings). `migrate-python-i18n` only repairs unsafe calls that are already wrapped. Anything that still needs a look is listed in a report.

Already using GNU gettext, Django, or Flask catalogs? Keep those calls. Pick the matching init template below and let `extract` fill empty catalog slots from the existing `.po` files.

The steps:

1. [Install](#install) the CLI and set the API key.
2. [Pick a template](#pick-a-template) and run `init`.
3. [Wrap strings](#wrap-strings) in `t()` or `_()`.
4. [Migrate call sites](#migrate) that are already wrapped unsafely.
5. [Choose models and translate](#translate).
6. [Switch locale at runtime](#switch-locale).
7. [Keep it translated](#keep-it-translated).

Not sure this is your case? See [Not your case?](#not-your-case) at the end.

<a id="install"></a>
## Install

Use the npm package when the machine already has Node.js `>=22.16.0` ([Installation](/guide/installation)). For a Python project, the usual path is the standalone executable from the GitHub Release — Linux (`x64`, `arm64`), macOS (`arm64`, `x64`), and Windows (`x64`). Check `SHA256SUMS.txt`, run `chmod +x` on Unix, and put the file on `PATH`. The binaries are unsigned. Asset names and checksums: [Standalone executables](/guide/installation#standalone-executables).

Set the API key for the provider you pass to `init`. For example, Cheaper Inference:

```bash
export CHEAPERINFERENCE_API_KEY=your-key-here
```

Ollama needs no key. Other presets: [Built-in providers](/guide/providers-and-models#built-in-providers).

<a id="pick-a-template"></a>
## Pick a template

| App today | Command | What you get |
| --- | --- | --- |
| Hard-coded strings, or new `t()` / `_()` calls | `ai-i18n-tools init -t ui-python -P cheaperinference` | Flat English-key JSON and `i18n.py` |
| GNU gettext, and you also want flat JSON | `ai-i18n-tools init -t ui-python-gettext -P anthropic` | JSON plus `.po` / `.mo`, and `i18n.py` |
| Flask or Jinja catalogs under `translations/` | `ai-i18n-tools init -t ui-python-flask -P groq` | Gettext catalogs and `i18n.py` |
| Django `gettext` / `{% blocktrans %}` | `ai-i18n-tools init -t ui-python-django -P ollama` | `locale/<lang>/LC_MESSAGES/django.po` (no `i18n.py`) |

Edit `sourceLocale` and `targetLocales`. `sourceLocale` is the language of the strings in the source (often `en`). Framework wiring: [Python integrations](/guide/integrations/python). Call shapes and catalog layout: [Python applications](/guide/ui-strings/python).

<a id="wrap-strings"></a>
## Wrap strings

Look up the catalog entry first, then interpolate. Import `t` and `_` from the generated `i18n.py` (Django keeps `gettext` and `ngettext`).

```python
t("Hello, {name}!", name=name)
_("Hello, %s!") % name
_("Total: {price:,.2f}").format(price=price)
```

These are evaluated before any catalog lookup. The extractor marks them unsafe, and `migrate-python-i18n` rewrites them:

```python
_(f"Hello, {name}!")
_("Hello, %s!" % name)
_("Hello, {name}!".format(name=name))
```

<a id="agent-prompt-i18n-py"></a>

<a id="agent-prompt-i18npy-helper"></a>

Use this for Streamlit, FastAPI, Flask with flat JSON, Tkinter, Qt, and a PyWebView shell. Copy it into a coding agent. A Django or existing-gettext project should use the [next prompt](#agent-prompt-django-gettext) instead.

<details class="agent-prompt">
<summary>Agent prompt: i18n.py helper</summary>

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

Use this when the app already calls Django or GNU gettext, or when you want to stay on `.po` catalogs. Do not add `i18n.py`.

The init templates recognise these call names exactly: `_`, `t`, `translate`, `i18n.t`, `gettext`, `ngettext`, `pgettext`, and `self.tr`. Lazy and noop variants are not in that list. Add the names the project actually calls — typically `gettext_lazy`, `ngettext_lazy`, `pgettext_lazy`, and `gettext_noop` — to `ui.uiExtractor.funcNames`, or `extract` skips them. `ngettext_lazy` is read as singular plus plural, and `pgettext_lazy` as context plus message, only after the name is listed. `{% trans %}` and `{% blocktrans %}` in templates are collected on their own.

<details class="agent-prompt">
<summary>Agent prompt: Django and native gettext</summary>

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
## Migrate call sites

`migrate-python-i18n` is a dry run until you pass `--write`. It always writes `migrate-python-i18n-report.md`. Generated `i18n.py` files are skipped. Debug fields such as `{value=}` and nested format specs are reported and left in place.

```bash
ai-i18n-tools migrate-python-i18n
ai-i18n-tools migrate-python-i18n --write
```

Read the report before `--write` when the dry run lists manual-review sites. Optional `--report <path>` changes the report path. Optional `--ui-block` limits the scan to one UI block.

<a id="translate"></a>

<a id="choose-models-and-translate"></a>
## Choose models and translate

The model list from `init` is a starting point. Rank the active provider's chat models and, when the shortlist looks right, write it into `translationModels`:

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` replaces only `translationModels`. The same ranking is on the [Models](/guide/translation-dashboard/models) tab. Then extract and translate:

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
```

`extract` writes `strings.json` and `ui-languages.json`. `translate-ui` fills the flat JSON files and, when `ui.gettext` is set, the `.po` / `.mo` catalogs. Do not hand-edit those generated catalogs.

<a id="switch-locale"></a>

<a id="switch-locale-at-runtime"></a>
## Switch locale at runtime

`set_locale` returns a `ContextVar` token. Reset it when the request or the callback ends.

```python
token = set_locale(code)
try:
    text = t("Hello, {name}!", name=name)
finally:
    reset_locale(token)
```

FastAPI and Flask middleware must reset in `finally` (Flask: `teardown_request`) so concurrent requests do not leak a locale. Django projects keep Django's locale activation and do not use `i18n.py`. Per-framework notes: [Locale in each framework](/guide/ui-strings/python#locale).

<a id="keep-it-translated"></a>
## Keep it translated

Re-run `ai-i18n-tools sync` (or `extract` then `translate-ui`) after changing source text. The cache means only new or changed strings go to the model. Run it in CI so translations do not drift. `ai-i18n-tools dashboard` opens the [Translation Dashboard](/guide/translation-dashboard/) to review translations.

To translate `README.md` in the same run, scaffold with `--with-readme` (or add the block to an existing config). See [Add i18n to your README and Markdown docs](/guide/add-i18n-to-readme).

<a id="not-your-case"></a>
## Not your case?

| You have | Read |
| --- | --- |
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
| [python-gettext](/examples#python-gettext) | Existing gettext CLI; `translate-ui` refreshes `.po` and `.mo` |

Copy one with `npx degit`, or download `ai-i18n-tools-python-examples.zip` from the GitHub Release. Commands: [Examples](/examples#python-examples).
