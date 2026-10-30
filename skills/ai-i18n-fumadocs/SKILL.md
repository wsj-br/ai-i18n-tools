---
name: ai-i18n-fumadocs
description: Add or maintain Fumadocs documentation localization.
disable-model-invocation: true
---

# Fumadocs

Follow the installed `ai-i18n-tools` skill for inspection, credentials, `sync`, and generated-output rules. From that skill, read only the Fumadocs section of `references/documentation.md`.

This command is only for a Fumadocs site.

## Configure

- New config: `ai-i18n-tools init -t ui-fumadocs -P <provider>`. Do not rerun `init` over an existing config.
- The template uses `docsOutput.style: "fumadocs"` and `fumadocsParser: "dot"`, which writes `page.de.mdx` beside the source page.
- Folder routing instead sets `fumadocsParser: "dir"` and points `docsRoot` at the source-locale folder.
- `meta.json` labels are included by the preset. `docsOutput.fumadocsUiCatalog` needs `sourcePath` and `catalogPath`. Keep that catalog in Documents.

## Verify

- Run `ai-i18n-tools sync` only when translation is authorized.
- Build the site and check the parser's output paths, meta labels, and UI catalog strings.
