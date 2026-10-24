<a id="add-i18n-to-a-python-app"></a>
# Add i18n to a Python app

This walkthrough takes a Python application that has a single language and adds locales with ai-i18n-tools. Safe call-site edits are applied by `migrate-python-i18n`. Anything that still needs a look is listed in a report.

Already using GNU gettext, Django, or Flask catalogs? Keep those calls. Pick the matching init template below and let `extract` fill empty catalog slots from the existing `.po` files.

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

<a id="migrate"></a>
## Migrate call sites

`migrate-python-i18n` is a dry run until you pass `--write`. It always writes `migrate-python-i18n-report.md`. Generated `i18n.py` files are skipped. Debug fields such as `{value=}` and nested format specs are reported and left in place.

```bash
ai-i18n-tools migrate-python-i18n
ai-i18n-tools migrate-python-i18n --write
```

Read the report before `--write` when the dry run lists manual-review sites. Optional `--report <path>` changes the report path. Optional `--ui-block` limits the scan to one UI block.

<a id="translate"></a>
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

<a id="examples"></a>
## Examples

| Example | What it shows |
| --- | --- |
| [python-streamlit](/examples#python-streamlit) | Dashboard, `t()` / `_()`, flat JSON |
| [python-fastapi](/examples#python-fastapi) | Request-scoped locale, flat JSON |
| [python-flask](/examples#python-flask) | Flask + Jinja, flat JSON |
| [python-gettext](/examples#python-gettext) | Existing gettext CLI; `translate-ui` refreshes `.po` and `.mo` |

Copy one with `npx degit`, or download `ai-i18n-tools-python-examples.zip` from the GitHub Release. Commands: [Examples](/examples#python-examples).
