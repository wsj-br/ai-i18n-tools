# Streamlit + English-key JSON

Analytics dashboard localized with `t()` and `_()`. Catalogs are flat JSON keyed by the English source. The calls in `app.py` are already in the lookup-before-format shape.

This example is a Python project. It is not an npm package and it is not inside the `ai-i18n-tools` tarball or the standalone executable. A copy is attached to GitHub Releases as `ai-i18n-tools-python-examples.zip`.

## Run

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
streamlit run app.py
```

On Windows, activate `.venv\Scripts\activate` instead of `source`.

## Translate with the standalone binary

Download `ai-i18n-tools` for your platform from the GitHub Release (no Node.js install). From this directory:

```bash
./ai-i18n-tools extract
./ai-i18n-tools translate-ui
```

From a Node checkout of this repository, the same commands are `node ../../bin/ai-i18n-tools.mjs extract`.

`t("Welcome back, {user_name}!", user_name=user_name)` and `_("Selected metric: %s") % metric` look up the catalog first, then fill in the values.
