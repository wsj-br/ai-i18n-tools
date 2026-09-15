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

- Evaluate and, if needed, extend support for translating i18next projects. Confirm that the existing JSON translation workflow covers typical i18next key/value schemas. Investigate the feasibility of automatically migrating i18next key-based translations to the English source-string schema used by ai-i18n-tools (e.g., via a built-in migration utility that moves strings/translations from separate `.content.ts` files into the `t()` pattern).

- Add functionality to enable supplying extra context alongside glossary terms, ensuring that translations are more accurate and contextually appropriate. For example, allow attaching documentation or detailed feature explanations so that translations for all languages reflect correct usage and meaning.

- Implement tracking and reporting for model call statistics and associated costs, allowing users to view and understand their usage and expenditure on translation model API calls.


## Improvements

- check the proofread-ui command to see if it is working as expected, check if the warnings and suggestions make sense and are helpful.



## Fixes

> nothing to fix



## To remove

> nothing to remove

