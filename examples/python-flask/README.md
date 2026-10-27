# Flask + Jinja + English-key JSON

Shop page localized with `t()` and `_()`. The route and `templates/index.html` already call those functions. Flat JSON catalogs live in `locales/`.

This example is a Python project. It is not an npm package and it is not inside the `ai-i18n-tools` tarball or the standalone executable. A copy is attached to GitHub Releases as `ai-i18n-tools-python-examples.zip`.

## Run

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
flask --app app run
```

Open `/?lang=es` or `/?lang=pt-BR`. The app also reads `Accept-Language`. Each request sets the locale and resets the `ContextVar` token when the request ends.

## Translate with the standalone binary

Install the command (no Node.js install). Linux and macOS: `curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash`. Windows PowerShell: `irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex`.

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
```

From a Node checkout, use `node ../../bin/ai-i18n-tools.mjs`.

If the application already uses GNU gettext instead of `t()` and `_()`, see `examples/python-gettext`.
