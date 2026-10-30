---
name: ai-i18n-vitepress
description: Add or maintain VitePress documentation localization.
disable-model-invocation: true
---

# VitePress

Follow the installed `ai-i18n-tools` skill for inspection, credentials, `sync`, and generated-output rules. From that skill, read only the VitePress section of `references/documentation.md`.

This command is only for a VitePress docs site.

## Configure

- New config: `ai-i18n-tools init -t ui-vitepress -P <provider>`. Do not rerun `init` over an existing config.
- Use Documents with `docsOutput.style: "vitepress"`. Source content lives under `docs/`; output lands under `docs/{locale}/`.
- `docsOutput.vitepressThemeCatalog` needs `configPath` and `catalogPath`. Point the VitePress config at the generated theme JSON. Translating the files does not connect them.
- Write source links as site routes, such as `/guide/start`. Outside fenced code, protect Vue interpolation examples with `<code v-pre>{{name}}</code>`.

## Verify

- Run `ai-i18n-tools sync` only when translation is authorized.
- Build the site and check source and target routes, sidebar labels, theme strings, and heading fragments.
