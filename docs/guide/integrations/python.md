<a id="python"></a>
# Python

Chooser for Python applications. Extraction, catalogs, and call shapes live in [Python applications](/guide/ui-strings/python). The step-by-step for an existing single-locale app is [Add i18n to a Python app](/guide/add-i18n-to-python), with an [`i18n.py` prompt](/guide/add-i18n-to-python#agent-prompt-i18n-py) and a [Django / gettext prompt](/guide/add-i18n-to-python#agent-prompt-django-gettext).

Streamlit, FastAPI, Flask, Pyramid, Tkinter, PyQt, PySide, and PyWebView call the generated `i18n.py` helper (Python 3.10 or newer). Django keeps Django's gettext. Four runnable copies ship in the repository: `examples/python-streamlit`, `examples/python-flask`, `examples/python-fastapi`, and `examples/python-gettext`. Pyramid, Django, Tkinter, Qt, and PyWebView have no separate example directory.

<a id="which-template"></a>
## Which template

| Framework | Init template | Catalog | Example |
| --- | --- | --- | --- |
| Streamlit | `ui-python` | Flat English-key JSON | [python-streamlit](/examples#python-streamlit) |
| FastAPI | `ui-python` | Flat English-key JSON | [python-fastapi](/examples#python-fastapi) |
| Flask + Jinja, flat JSON | `ui-python` | Flat English-key JSON | [python-flask](/examples#python-flask) |
| Flask / Jinja gettext | `ui-python-flask` | `.po` / `.mo` under `translations/` | Use the Flask notes below |
| Pyramid | `ui-python` or `ui-python-flask` | Same as Flask | Same wiring as Flask |
| Django | `ui-python-django` | `locale/<lang>/LC_MESSAGES/django.po` | No example directory |
| Existing GNU gettext | `ui-python-gettext` | Flat JSON and `.po` / `.mo`, or gettext only | [python-gettext](/examples#python-gettext) |
| Tkinter | `ui-python` | Flat English-key JSON | No example directory |
| PyQt / PySide | `ui-python` or a gettext template | Flat JSON and/or `.po` | No example directory |
| PyWebView / PyWebKit | A Python template for the shell | Shell catalogs, plus HTML markers or one HTML file per locale | No example directory |

`ui-python`, `ui-python-gettext`, and `ui-python-flask` write `i18n.py` when that file is missing. `ui-python-django` does not. Add `--with-readme` to also translate the repository README: [Add i18n to your README and Markdown docs](/guide/add-i18n-to-readme).

<a id="framework-notes"></a>
## Framework notes

<a id="streamlit"></a>
### Streamlit

`streamlit_language_selector()` writes the locale into session state and the query string. Give every widget a fixed `key`. Details: [Locale — Streamlit](/guide/ui-strings/python#streamlit).

<a id="fastapi"></a>
### FastAPI

Read `?lang=` or `Accept-Language` in middleware, call `set_locale`, and `reset_locale` in `finally` so concurrent requests keep their own locale. Details: [Locale — FastAPI](/guide/ui-strings/python#fastapi).

<a id="flask"></a>
### Flask and Pyramid

The [python-flask](/examples#python-flask) example uses flat JSON. `init -t ui-python-flask` is the gettext layout under `translations/` for an app that already uses Flask-Babel-style catalogs. Either way, set the locale from the request and inject `_`, `t`, `current_locale`, `ui_languages`, and `direction` into the template context. Pyramid uses the same request-scoped pattern. Details: [Locale — Flask and Pyramid](/guide/ui-strings/python#flask).

<a id="django"></a>
### Django

Keep `gettext`, `ngettext`, and `{% blocktrans %}`. `init -t ui-python-django` matches Django's `locale/` directory and the `django` domain, and leaves Django's runtime in place. Details: [Locale — Django](/guide/ui-strings/python#django).

<a id="gettext"></a>
### Existing gettext

Leave `_()`, `gettext()`, and `ngettext()` in place. Point `ui.gettext` at the current catalog tree and run `extract`, then `translate-ui`. The [python-gettext](/examples#python-gettext) example is gettext-only (`flatOutput: false`). `init -t ui-python-gettext` also writes flat JSON. Details: [Locale — Existing gettext](/guide/ui-strings/python#gettext).

<a id="desktop"></a>
### Tkinter, Qt, and PyWebView

Call `t()` or `_()` when creating each Tkinter widget, then rebuild the visible text after `set_locale`. PyQt and PySide `self.tr("...")` calls are extracted, and Qt `.ui` files contribute `<string>` elements unless `notr="true"`. For PyWebView or PyWebKit, extract the Python shell with a template above and extract the HTML page with `data-i18n` markers or with one HTML document per locale. Details: [Locale — Tkinter](/guide/ui-strings/python#tkinter), [PyQt / PySide](/guide/ui-strings/python#pyqt), and [PyWebView](/guide/ui-strings/python#pywebview).
