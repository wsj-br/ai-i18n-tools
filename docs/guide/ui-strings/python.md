<a id="python"></a>
# Python applications

`ai-i18n-tools` extracts UI strings from Python and from Jinja, Django, and Qt `.ui` files, then writes flat JSON keyed by the source-language string, GNU gettext catalogs, or both. `sourceLocale` can be any language. The runtime helper is a standard-library `i18n.py` (Python 3.10 or newer). Streamlit, Tkinter, PyQt, PySide, PyWebView, Flask, Pyramid, and FastAPI call that helper. Django uses Django's own gettext.

Adding locales to an existing single-language app: [Add i18n to a Python app](/guide/add-i18n-to-python), including the [`i18n.py` prompt](/guide/add-i18n-to-python#agent-prompt-i18n-py) and the [Django / gettext prompt](/guide/add-i18n-to-python#agent-prompt-django-gettext). Framework chooser: [Python integrations](/guide/integrations/python). Function list: [Python runtime (`i18n.py`)](/reference/programmatic-api#python-runtime).

Runnable copies live in `examples/python-streamlit`, `examples/python-flask`, `examples/python-fastapi`, and `examples/python-gettext`. They are Python projects. The first three use a virtualenv and `pip install -r requirements.txt`. `python-gettext` uses only the standard library. They are not npm packages. The release archive `ai-i18n-tools-python-examples.zip` contains the same four directories. The npm tarball and the standalone executable do not.

<a id="init"></a>
## Scaffold

```bash
ai-i18n-tools init -t ui-python -P cheaperinference
ai-i18n-tools init -t ui-python-gettext -P anthropic
ai-i18n-tools init -t ui-python-flask -P groq
ai-i18n-tools init -t ui-python-django -P ollama
```

`ui-python` writes flat JSON and `i18n.py`. `ui-python-gettext` writes JSON and `.po` / `.mo`. `ui-python-flask` writes gettext catalogs under `translations/` and `i18n.py`. `ui-python-django` writes `locale/<lang>/LC_MESSAGES/django.po` and does not write `i18n.py`.

Also translate the repository README: add `--with-readme` to the `init` command above. See [Add i18n to your README and Markdown docs](/guide/add-i18n-to-readme).

Scan roots skip `node_modules`, `.git`, `.venv`, `venv`, `env`, `site-packages`, `__pycache__`, `.tox`, `.nox`, `.pytest_cache`, `.mypy_cache`, `.ruff_cache`, and `.eggs`.

<a id="calls"></a>
## Calls that translate

Look up the catalog entry first, then interpolate.

Portable:

```python
t("Hello, {name}!", name=name)
t("Total: {price:,.2f}", price=price)
_("Hello, %s!") % name
_("Total: {price:,.2f}").format(price=price)
```

On Python 3.14 the helper also accepts a template string:

```python
translate(t"Hello, {name}!")
```

`translate` is an alias of `t`. Keyword arguments override values taken from the template string.

Native gettext, still safe because the template is the argument:

```python
_("Hello, %s!") % name
ngettext("1 file", "{count} files", count, count=count)
pgettext("menu", "Open")
```

These are evaluated before any catalog lookup, so the extractor marks them unsafe and `migrate-python-i18n` rewrites them:

```python
_(f"Hello, {name}!")
_("Hello, %s!" % name)
_("Hello, {name}!".format(name=name))
```

`migrate-python-i18n` is a dry run until you pass `--write`. It writes `migrate-python-i18n-report.md`. Debug fields such as `{value=}` and nested format specs are reported and left in place.

`{% trans %}` and `{% blocktrans %}` become gettext `%(name)s` placeholders. Jinja strips and collapses whitespace. Django keeps internal whitespace unless the tag says `trimmed`.

<a id="catalogs"></a>
## Catalogs

Flat JSON keys are the source-language string, the text in `sourceLocale`. That language can be any language. A context uses `context` + U+0004 + that source string. Plural slots stay `{md5}_one`, `{md5}_other`, and the other CLDR forms `translate-ui` already writes. The helper hashes the trimmed singular with MD5 and reads the first 8 hex characters.

Gettext files use `msgctxt` for context and `msgid` / `msgid_plural` for plurals. `ui.gettext.compileMo` writes the `.mo` next to the `.po`. `purge-locale` deletes that locale's `.po` and `.mo`. When `flatOutput` is false it leaves the flat JSON files alone because they were not written.

`t(..., plurals=True)` with an English source locale and an explicit plural source skips the model and stores `one` / `other` from the source strings.

<a id="locale"></a>
## Locale in each framework

`set_locale` returns a `ContextVar` token. Reset it in `finally`, including FastAPI and Flask middleware, so concurrent requests do not leak a locale.

- <a id="streamlit"></a>**Streamlit.** `streamlit_language_selector(sidebar=True, key="lang_selector")` writes `st.session_state.locale` and `st.query_params["lang"]`. Give every widget a fixed `key`. See `examples/python-streamlit`.
- <a id="fastapi"></a>**FastAPI.** Read `?lang=` or `Accept-Language` in middleware, call `set_locale`, and `reset_locale` in `finally`. Routes call `t()` and `_()`. See `examples/python-fastapi`.
- <a id="flask"></a>**Flask and Pyramid.** Set the locale from the request and inject `_`, `t`, `current_locale`, `ui_languages`, and `direction` into the template context. See `examples/python-flask`.
- <a id="gettext"></a>**Existing gettext.** Leave `_()`, `gettext()`, and `ngettext()` in place. Point `ui.gettext` at the current `locales/` tree and run `extract` then `translate-ui`. See `examples/python-gettext`.
- <a id="django"></a>**Django.** Use `gettext`, `ngettext`, and `{% blocktrans %}`. Init template `ui-python-django` matches Django's `locale/` directory and `django` domain.
- <a id="tkinter"></a>**Tkinter.** Call `t()` or `_()` when creating each widget, then rebuild the visible text after `set_locale`.
- <a id="pyqt"></a>**PyQt / PySide.** `self.tr("...")` is extracted. A `.ui` file contributes `<string>` elements unless `notr="true"`. The `comment` attribute becomes gettext context.
- <a id="pywebview"></a>**PyWebView / PyWebKit.** Extract the Python shell with the Python templates above. Extract the HTML page with `data-i18n` markers or with one HTML document per locale.
