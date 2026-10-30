---
name: ai-i18n-docusaurus
description: Add or maintain Docusaurus documentation localization.
disable-model-invocation: true
---

# Docusaurus

Follow the installed `ai-i18n-tools` skill for inspection, credentials, `sync`, and generated-output rules. From that skill, read only the Docusaurus section of `references/documentation.md`.

This command is only for a Docusaurus site.

## Configure

- New config: `ai-i18n-tools init -t ui-docusaurus -P <provider>`. Do not rerun `init` over an existing config.
- Use Documents with `docsOutput.style: "docusaurus"`. Page output belongs under `i18n/{locale}/docusaurus-plugin-content-docs/current/`.
- Generate the source catalogs with Docusaurus `write-translations`, then set `docs[].docusaurusCatalogDir` to their source-locale directory.
- Keep those `{ message, description }` catalogs in Documents. Do not move them to `json[]`.

## Verify

- Run `ai-i18n-tools sync` only when translation is authorized.
- Build the site and check docs routes, navbar and sidebar labels, and the locale dropdown.
