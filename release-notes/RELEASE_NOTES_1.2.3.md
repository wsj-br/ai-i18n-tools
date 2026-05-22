# ai-i18n-tools 1.2.3 Release Notes

## Highlights

- Improved UI language catalog generation when bare language tags are missing from glibc locale data. The build now falls back to Wikimedia data for valid 2-3 letter tags (for example `jv` for Javanese), while still excluding non-primary wiki keys.
- Improved review flow for UI language labels and text direction using an LLM call through OpenRouter.
- Added support for `documentations[].markdownOutput.postProcessing.languageListBlock.label` with values `local` or `english`. Labels are sourced from `ui-languages.json`, and the default remains `local` so generated links use locale endonyms unless overridden.
- Updated dependencies to enforce security patches for `uuid@<14.0.0` and `postcss@<8.5.10` across workspace installs.


## Why this release matters

This release improves language metadata coverage and consistency, especially for locales that were previously under-represented in glibc-only inputs.


---

## Documentation

- [Getting Started](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/GETTING_STARTED.md) — setup, CLI flags, and config reference.  
- [Package Overview](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/PACKAGE_OVERVIEW.md) — architecture and extension points.  
- [AI Agent Context (consumers)](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — concise context for apps **using** the npm package.


---

## License

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br/ai-i18n-tools)
