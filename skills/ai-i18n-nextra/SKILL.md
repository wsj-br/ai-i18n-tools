---
name: ai-i18n-nextra
description: Add or maintain Nextra documentation localization.
disable-model-invocation: true
---

# Nextra

Follow the installed `ai-i18n-tools` skill for inspection, credentials, `sync`, and generated-output rules. From that skill, read only the Nextra section of `references/documentation.md`.

This command is for Nextra docs. A `t()` component beside the docs also needs `references/javascript.md`.

## Configure

- New config: `ai-i18n-tools init -t ui-nextra -P <provider>`. Do not rerun `init` over an existing config.
- Use Documents with `docsOutput.style: "nextra"`, `docsRoot: "content/en"`, and `outputDir: "content"` so locales are siblings of the source folder.
- `_meta.ts` labels are included by the preset. Set `docs[].nextraDictionaryPath` for a theme dictionary.
- Keep that dictionary in Documents. Do not move it to `json[]`.

## Verify

- Run `ai-i18n-tools sync` only when translation is authorized.
- Build the site and check locale folders, sidebar labels, and dictionary strings.
