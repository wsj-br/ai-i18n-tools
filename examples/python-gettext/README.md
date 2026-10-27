# Existing GNU gettext CLI

A small notes command that already calls `gettext`. The application keeps `gettext.translation`, `_()`, and `ngettext()`. `ai-i18n-tools` only refreshes the catalogs.

`flatOutput` is off. Translations are `locales/<locale>/LC_MESSAGES/messages.po` and compiled `messages.mo` files. Brazilian Portuguese uses the directory `pt_BR`.

This example is a Python project. It is not an npm package and it is not inside the `ai-i18n-tools` tarball or the standalone executable. A copy is attached to GitHub Releases as `ai-i18n-tools-python-examples.zip`.

## Run

```bash
python3 app.py
python3 app.py --lang es --name Ada --count 3
python3 app.py --lang pt-BR --count 1
```

There are no third-party packages.

## Translate with the standalone binary

Install the command (no Node.js install). Linux and macOS: `curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash`. Windows PowerShell: `irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex`.

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
```

`extract` reads the `_()` and `ngettext()` calls and fills empty `strings.json` slots from the existing `.po` files. `translate-ui` writes updated `.po` and `.mo` catalogs. From a Node checkout, use `node ../../bin/ai-i18n-tools.mjs`.

Applications that call `t()` or `_()` from the generated `i18n.py` helper, instead of GNU gettext, are `examples/python-streamlit`, `examples/python-flask`, and `examples/python-fastapi`.
