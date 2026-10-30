---
name: ai-i18n-js
description: Add or maintain source-string UI translation in a JavaScript or TypeScript app.
disable-model-invocation: true
---

# JavaScript / TypeScript UI

Follow the installed `ai-i18n-tools` skill for inspection, credentials, `sync`, and generated-output rules. From that skill, read only `references/javascript.md`.

This command is for literal `t()` or `i18n.t()` calls. An existing nested-key i18next setup stays on the JSON pipeline in `references/json.md`.

## Configure

- Install `ai-i18n-tools` locally when the app imports `ai-i18n-tools/runtime`. Install `i18next`, and `react-i18next` for React, separately.
- New config: `ai-i18n-tools init -P <provider>`. The default `ui-markdown` template includes UI strings and a flat README block. Do not rerun `init` over an existing config.
- Point `ui.sourceRoots`, `ui.stringsJson`, and `ui.flatOutputDir` at the app. Keep config `sourceLocale` identical to the runtime source locale.
- Wrap user-facing text in literal calls. Interpolate after lookup. Do not wrap paths, IDs, or machine values.

## Verify

- Run `ai-i18n-tools sync` only when translation is authorized.
- Load the startup locale before the first render. Switch with `loadLocale(code)` and then `i18n.changeLanguage(code)`.
- Isolate mutable i18next state per SSR request.
- Build the app and test source fallback, interpolation, plurals, and RTL where those are used.
