---
name: ai-i18n-django
description: Add or maintain Django, Flask-Babel, or plain gettext catalogs.
disable-model-invocation: true
---

# Django and gettext

Follow the installed `ai-i18n-tools` skill for inspection, credentials, `sync`, and generated-output rules. From that skill, read only the gettext, Django, and Flask-Babel sections of `references/python.md`.

Keep the existing gettext imports, template tags, and catalogs. Do not introduce `t()` or a second translation helper.

## Configure

- New config uses one template: `ui-python-django`, `ui-python-flask`, or `ui-python-gettext`. Run `ai-i18n-tools init -t <template> -P <provider>` only when no config exists.
- Django catalogs live at `locale/<lang>/LC_MESSAGES/django`. Flask uses `translations/<lang>/LC_MESSAGES/messages`. Plain gettext defaults to `locales/`.
- Match `ui.gettext.outputDir`, `potPath`, and `domain` to the existing loader. Use `localeFormat: "posix"` for folders such as `pt_BR`.
- Remove an unused `i18n.py` only when this init just generated it. For gettext-only output, set `ui.flatOutput` to `false`.
- Keep Django lazy translations and `%(name)s` placeholders. Register extra call names in `ui.uiExtractor.funcNames`.

## Verify

- Preserve existing `.po` translations; they can seed the catalog.
- Run `ai-i18n-tools sync` only when translation is authorized. Enable `compileMo` and confirm the `.mo` files are in the deployed artifact.
- Use Django locale middleware or Flask-Babel's selector. Do not install translations process-wide for a web app.
