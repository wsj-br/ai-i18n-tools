---
name: ai-i18n-migrate-intlayer
description: Migrate an Intlayer app to source-string t() calls.
disable-model-invocation: true
---

# Migrate off Intlayer

Follow the installed `ai-i18n-tools` skill for inspection, credentials, and catalog ownership. This is a one-time move off Intlayer. Stop when Intlayer should remain the runtime and ask the user to run `/ai-i18n-translate-intlayer`.

`migrate-intlayer` does not call a model. `sync` is only for source strings the report marks as new, after the rewrite.

## Configure

- If `ai-i18n-tools.config.json` is missing, run `ai-i18n-tools init -P <provider>` once. Do not rerun `init` over an existing config.
- Set `sourceLocale` and `targetLocales` to the locales already in the dictionaries. Point `ui.sourceRoots`, `ui.stringsJson`, and `ui.flatOutputDir` at the app. Both catalog paths are required.

## Migrate

1. Dry-run `ai-i18n-tools migrate-intlayer` and read `migrate-intlayer-report.md` before writing.
2. Run `ai-i18n-tools migrate-intlayer --write` only after that review. It seeds the catalogs and rewrites safe call sites.
3. Finish every manual-review site with the report's `t()` or JSX replacement. Add the `import { t }` line it shows.
4. Paste the report's runtime bootstrap over the app i18n module. After `loadLocale(next)`, call `i18n.changeLanguage(next)`.
5. Delete the leftover `*.content.ts` files and `useIntlayer` / `IntlayerProvider` usage listed in the report.
6. Run `ai-i18n-tools extract`, then `ai-i18n-tools sync`, for strings the report marks as new. `extract` writes `ui-languages.json`, which the bootstrap imports.
7. Remove the `intlayer` and `react-intlayer` dependencies only after the app runs on ai-i18n-tools.

Do not hand-edit `strings.json`, the flat locale files, or `ui-languages.json`.

## Verify

- Build and open the app in the source locale and one migrated locale.
- Confirm dynamic keys, spreads, and chained replacements were changed only where the report gave a concrete replacement.
