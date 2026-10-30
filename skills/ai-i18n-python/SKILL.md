---
name: ai-i18n-python
description: Add or maintain the generated Python helper and flat JSON catalogs.
disable-model-invocation: true
---

# Python helper

Follow the installed `ai-i18n-tools` skill for inspection, credentials, `sync`, and generated-output rules. From that skill, read only the generated-helper sections of `references/python.md`.

This command is for an app with no gettext today. When Django, Flask-Babel, or another gettext runtime is already present, keep it and follow the gettext sections of `references/python.md`. Ask the user to run `/ai-i18n-django` for that workflow.

## Configure

- New config: `ai-i18n-tools init -t ui-python -P <provider>`. Do not rerun `init` over an existing config.
- The template writes `i18n.py` and flat JSON catalogs. Keep the helper and its catalogs in the same directory, and ship both in package data.
- Call `t("Welcome, {name}!", name=user_name)` with a literal message. Format after lookup. Do not use `t(f"…")` or `t(variable)`.
- Set the locale for each request, thread, or Streamlit run, and reset it in `finally`.

## Verify

- Run `ai-i18n-tools sync` only when translation is authorized, then restart the app. The helper caches even missing locale files.
- Test source text, interpolation, and one target locale in the installed artifact, not only the checkout.
- Refresh `i18n.py` by comparing a disposable scaffold. Do not rerun `init` in the project to upgrade the helper.
