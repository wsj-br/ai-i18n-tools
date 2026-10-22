# FastAPI + English-key JSON

Request-scoped locale with `contextvars`. Routes call `t()` and `_()`. Flat JSON catalogs live in `locales/`.

This example is a Python project. It is not an npm package and it is not inside the `ai-i18n-tools` tarball or the standalone executable. A copy is attached to GitHub Releases as `ai-i18n-tools-python-examples.zip`.

## Run

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload
```

`GET /greeting/Ada?lang=es` returns the greeting for that locale. The middleware resets the `ContextVar` token in `finally`.

On Python 3.14, `python3 tstring_314.py` checks that `translate(t"Hello, {name}!")` keeps the interpolated name.

## Translate with the standalone binary

```bash
./ai-i18n-tools extract
./ai-i18n-tools translate-ui
```

From a Node checkout, use `node ../../bin/ai-i18n-tools.mjs`.

If the application already uses GNU gettext instead of `t()` and `_()`, see `examples/python-gettext`.
