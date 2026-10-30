---
name: ai-i18n-plain-html
description: Add or maintain one HTML file that switches language in the browser.
disable-model-invocation: true
---

# Plain HTML app

Follow the installed `ai-i18n-tools` skill for inspection, credentials, `sync`, and generated-output rules. From that skill, read only the HTML marker section of `references/javascript.md`.

This command keeps one HTML file, as in `examples/plain-html`. Stop when the project needs a separate HTML file per locale and ask the user to run `/ai-i18n-plain-html-docs`.

## Configure

- New config: `ai-i18n-tools init -t ui-plain-html -P <provider>`. Do not rerun `init` over an existing config.
- Mark text with `data-i18n` and supported attribute markers such as `data-i18n-alt`. Include `.html` in the extractor extensions.
- Copy `ai-i18n-tools/html-runtime/i18n.js` into the site and serve that copy. The browser cannot import the package bare.
- `data-i18n-locale-src` and `data-i18n-locale-href` switch assets at runtime. They are not extracted messages.
- Leave `features.translateDocs` off. Do not add `data-i18n` markers and a per-locale document tree for the same page.

## Verify

- Run `ai-i18n-tools sync` only when translation is authorized.
- Open the single page, switch locale, and confirm text, attributes, and localized assets change without a reload.
