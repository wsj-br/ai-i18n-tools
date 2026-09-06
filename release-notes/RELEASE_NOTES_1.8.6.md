# ai-i18n-tools 1.8.6 Release Notes

## Highlights

- **Cleaner glossary hints for docs:** `translate-docs` skips compact UI-label abbreviations (e.g. `Size` → `Tam` / `Tam.`, `Storage` → `Alm.`) when building glossary hints, so column-header shortenings from `strings.json` / `userGlossary` no longer steer models toward invented `{{TAM}}`-style tokens in MDX. UI and `proofread-ui` hint behavior is unchanged.

## Why this release matters

Version 1.8.6 keeps document translations from picking up compact UI glossary abbreviations that were causing invented brace tokens in MDX output.

## Detailed Changes

- **Fixed**: glossary/docs — `translate-docs` skips compact UI-label abbreviations (e.g. `Size` → `Tam` / `Tam.`, `Storage` → `Alm.`) when building glossary hints, so column-header shortenings from `strings.json` / `userGlossary` no longer steer models toward invented `{{TAM}}`-style tokens in MDX. UI/`proofread-ui` hints are unchanged (`findTermsInText(..., { skipUiAbbreviations: true })`).

---

## Documentation

- [Getting Started](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/GETTING_STARTED.md) — setup, CLI flags, and config reference.  
- [Locale assets guide](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/LOCALE-ASSETS-GUIDE.md) — screenshots and illustrated SVGs in translated docs.  
- [Package Overview](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/PACKAGE_OVERVIEW.md) — architecture and extension points.  
- [AI Agent Context (consumers)](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — concise context for apps **using** the npm package.

---

## License

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br/ai-i18n-tools)
