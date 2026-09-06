# ai-i18n-tools TODO Tracking

This file tracks outstanding tasks, feature ideas, bugs, and planned changes for the `ai-i18n-tools` project.  
**Purpose:** To help maintainers and contributors organize what needs to be implemented, improved, fixed, or cleaned up.

**Instructions:**

- Add new items under the relevant section below.
- Use concise, action-oriented bullet points (e.g. "Add support for ICU message syntax").
- Remove completed items as soon as they are resolved in the codebase.
- Keep this file in sync if changes are made in PRs or during releases.

---

## New features

- analyse to support translation of i18next project (probably is already supported with the JSON translation workflow), or analyse the posibility to automigrate the key schema to english (source locale) schema of ai-i18n-tools using a dedicate blunded in ai-i18n-tools (moving the strings/translations from the separated .content.ts file to our t() schema)



## Improvements

- check the proofread-ui command to see if it is working as expected, check if the warnings and suggestions make sense and are helpful.
- **Plural placeholder validation:** after Step 0 / Pass B, reject (and retry) CLDR forms that drop or invent `{{count}}` / other interpolations relative to the source literal. Prompt currently says “preserve placeholders” but `parsePluralFormsJsonResponse` does not check. Details: [plural-placeholder-validation.md](./plural-placeholder-validation.md).
- **Docs HTML token restore:** reject (and retry) `translate-docs` segments where the model reuses/drops `{{HTM_N}}` (restored tags no longer match the source map) or leaves an unknown `{{IDENT}}` such as `{{TAM}}`. Current `hasInternalPlaceholderLeak` misses both. Corpus: [docs-placeholder-restore-failures.md](./docs-placeholder-restore-failures.md).



## Fixes

> nothing to fix



## To remove

> nothing to remove

