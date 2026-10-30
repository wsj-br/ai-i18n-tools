---
name: ai-i18n-plain-html-docs
description: Add or maintain one translated HTML tree per locale.
disable-model-invocation: true
---

# Plain HTML documents

Follow the installed `ai-i18n-tools` skill for inspection, credentials, `sync`, and generated-output rules. From that skill, read only the plain-HTML documents section of `references/documentation.md`.

This command writes one locale tree, as in `examples/plain-html-docs`. Stop when the project keeps one HTML file and switches language in the browser, and ask the user to run `/ai-i18n-plain-html`.

## Configure

- New config: `ai-i18n-tools init -t docs-plain-html -P <provider>`. Do not rerun `init` over an existing config.
- Use Documents. The template reads `site/` and writes locale copies such as `site/pt-BR/index.html` with `docsOutput.style: "nested"`.
- Translate visible text, `alt`, `<title>`, and `meta name="description"` on those copies. Do not send `src` or `href` values to the model.
- Do not add `data-i18n` markers or the browser `html-runtime`. Leave `features.translateUIStrings` off.

## Verify

- Run `ai-i18n-tools sync` only when translation is authorized.
- Open a source page and one locale page. Check translated copy, rewritten links, and localized images.
