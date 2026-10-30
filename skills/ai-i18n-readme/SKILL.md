---
name: ai-i18n-readme
description: Add or maintain README and repository Markdown translation.
disable-model-invocation: true
---

# README and Markdown

Follow the installed `ai-i18n-tools` skill for inspection, credentials, `sync`, and generated-output rules. From that skill, read only the repository-Markdown section of `references/documentation.md`.

This command is for flat Markdown output. A docs framework uses its own command.

## Configure

- Markdown only: `ai-i18n-tools init -t docs-markdown -P <provider>`.
- Markdown beside another new template: add `--with-readme` to that `init` command. It is a no-op when the template already has a README block.
- Do not rerun `init` over an existing config. Add the README block by editing the config.
- Use `docsOutput.style: "flat"`. `README.md` becomes `translated-docs/README.de.md`. Set `flatPreserveRelativeDir: true` when files in different folders share a basename.
- Paste the language-list markers into the source before translating that block.

## Verify

- Run `ai-i18n-tools sync` only when translation is authorized.
- Check the locale-suffixed files and the generated language list. Edit the source Markdown and regenerate; do not patch `translated-docs/`.
