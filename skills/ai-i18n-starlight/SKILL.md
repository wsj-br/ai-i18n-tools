---
name: ai-i18n-starlight
description: Add or maintain Astro Starlight documentation localization.
disable-model-invocation: true
---

# Astro Starlight

Follow the installed `ai-i18n-tools` skill for inspection, credentials, `sync`, and generated-output rules. From that skill, read only the Starlight section of `references/documentation.md`.

This command is for Starlight docs, as in `examples/astro-docs`. Stop when the project is a vanilla Astro marketing site and ask the user to run `/ai-i18n-astro-website`.

## Configure

- New config: `ai-i18n-tools init -t ui-starlight -P <provider>`. Do not rerun `init` over an existing config.
- Use Documents with `docsOutput.style: "astro-starlight"`. Source pages live in `src/content/docs/`; translations are locale subfolders beside them.
- Starlight locale paths default to lowercase. Map those route codes to the BCP-47 catalog codes when they differ.
- Starlight ships its own UI translations. A custom override uses a separate Documents block with `jsonPathTemplate`, not `json[]`.

## Verify

- Run `ai-i18n-tools sync` only when translation is authorized.
- Build the Starlight site and check locale routes, sidebar labels, and heading fragments.
