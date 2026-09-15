# ai-i18n-tools 1.8.11 Release Notes

## Highlights

- **API errors stay on the console:** Provider and empty-body failures print the model, error, and next model instead of writing prompt-only `FAILED-TRANSLATION` files. Those files remain for parse, script, and quality misses; identical API errors are logged once per client.
- **Unchanged docs skip again:** File-level skip is back for every locale, including native-script ones such as `hi`, `ja`, `ko`, `zh-Hans`, and `zh-Hant`. Unchanged sources no longer retranslate just because the locale enforces a writing system.
- **`--check-cache` for a script recrawl:** `translate-docs`, `translate-json`, `translate-svg`, and `sync` can re-validate cached segments for script-enforced locales even when file tracking matches.
- **Dashboard script-issue confirm:** Documentation-tab edits that fail the writing-system check return `409` (`script_issue`). The UI warns and can save anyway after confirmation.
- **Heading ids always refresh:** `write-heading-ids` replaces existing HTML, `{#id}`, or MDX comment ids with a slug from the current heading text. `--remove` strips all of those forms.

## Why this release matters

Version 1.8.11 restores cheap skip for unchanged documents (including native-script locales), while `--check-cache` and clearer API-error logging keep script recrawls and provider failures diagnosable.

---

For the full list of changes, see [`dev/CHANGELOG.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/CHANGELOG.md) (`## [1.8.11] - 2026-09-16`).

---

## Documentation

- [Getting Started](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/GETTING_STARTED.md) — setup, CLI flags, and config reference.  
- [Locale assets guide](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/LOCALE-ASSETS-GUIDE.md) — screenshots and illustrated SVGs in translated docs.  
- [Package Overview](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/PACKAGE_OVERVIEW.md) — architecture and extension points.  
- [AI Agent Context (consumers)](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — concise context for apps **using** the npm package.

---

## License

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br/ai-i18n-tools)
