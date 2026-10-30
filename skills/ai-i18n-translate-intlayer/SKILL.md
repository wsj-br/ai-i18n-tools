---
name: ai-i18n-translate-intlayer
description: Fill missing and stale Intlayer dictionary translations in place.
disable-model-invocation: true
---

# Translate Intlayer in place

Follow the installed `ai-i18n-tools` skill for inspection, credentials, and provider cost. Intlayer stays at runtime and the `*.content.ts` dictionaries stay the source of truth.

Stop when the user wants to leave Intlayer and ask them to run `/ai-i18n-migrate-intlayer`. Do not rewrite call sites to `t()` from this command. `sync` does not update Intlayer leaves.

## Configure

- If `ai-i18n-tools.config.json` is missing, run `ai-i18n-tools init -P <provider>` once. Do not rerun `init` over an existing config.
- Set `sourceLocale` and `targetLocales` to the dictionary locales. Point `ui.sourceRoots` and `ui.stringsJson` at the app. The catalog may live in a scratch directory such as `.i18n/`.
- `features.translateUIStrings` must be enabled. The command uses the same engine as `translate-ui`.

## Translate

1. Dry-run first: `ai-i18n-tools translate-intlayer src --dry-run`. This reports missing and stale leaves and does not call a model.
2. When translation is authorized, run `ai-i18n-tools translate-intlayer src`. Scope a run with `-l de,fr` or `--ui-block` when needed.
3. The command edits only missing or stale locale lines and preserves formatting, key order, and comments. Existing translations stay as written.
4. Re-run after adding or editing a source-locale string. Only the new or stale leaves are translated.

`{{token}}` placeholders pass through. Single-brace `{token}` placeholders are restored to that form on write. Leaves that use `insert("…")` stay wrapped in `insert(…)`.

## Verify

- Compare the dictionary diff and confirm untouched locales did not change.
- Run the app and check one newly filled locale. Edit one source string, translate again, and confirm only that leaf changes.
