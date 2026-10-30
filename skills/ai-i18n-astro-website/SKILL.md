---
name: ai-i18n-astro-website
description: Add or maintain localization for a vanilla Astro website.
disable-model-invocation: true
---

# Astro website

Follow the installed `ai-i18n-tools` skill for inspection, credentials, `sync`, and generated-output rules. From that skill, read `references/javascript.md` for build-time `t()` strings and `references/documentation.md` for `.astro` pages.

This command is the marketing site in `examples/astro-website`. Stop when the project is Starlight and ask the user to run `/ai-i18n-starlight`.

## Configure

- New config: `ai-i18n-tools init -t ui-astro-website -P <provider>`. Do not rerun `init` over an existing config.
- The template scaffolds UI extraction for literal `t()` calls, including `.astro` files. It leaves `docs` empty.
- Add a Documents block for page HTML when those pages should be translated. Documents leaves Astro frontmatter and `t()` arguments untranslated.
- Use Astro's own i18n routing. Do not install i18next and do not import `ai-i18n-tools/runtime`. Translations resolve at build time.
- Map route codes such as `pt-br` to the BCP-47 bundle filenames.

## Verify

- Run `ai-i18n-tools sync` only when translation is authorized.
- Build the site and open the source route and one prefixed locale route. Check both translated page copy and dynamic `t()` strings.
