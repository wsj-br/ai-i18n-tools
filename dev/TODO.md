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

- analyse to support translation of i18next project (probably is already supported with the JSON translation workflow), or analyse the posibility to automigrate the key schema to english (source locale) schema of ai-i18n-tools using a dedicate blunded in ai-i18n-tools (moving the strings/translations from the separeted .content.ts file to our t() schema) 

- ~~add a new cli command~~ `bench-models` ~~to benchmark the performance of the models, like we do in the presets-editor in transrewrt project (details in [translatePresetsBenchmark.js](https://raw.githubusercontent.com/wsj-br/transrewrt/refs/heads/main/dev/presets-editor/translatePresetsBenchmark.js)). Showing to the user the model ID, the input and output tokens, the time taken, and the cost in USD. The time should be the wall time translation time of each model.~~ [**DONE**]

- ~~add a new cli~~ `purge-locale` ~~to delete all translation cache for a given locale or locales. by default it remove all entries from the translations table, remove all entries from the file_tracking table, and remove all entries from the translation_failures table of the selected locale/locales. Don't need to remove the entries from the strings.json file of the selected locale/locales.~~ [**DONE**]



## Improvements

- ~~translate the docusaurus admonitions titles between brackets and support nested admonitions (for example~~ `:::note[Title]` ~~or~~ `:::tip[Title]`~~). See plan~~ `/home/wsj/.cursor/plans/translate_admonition_titles_+_nesting_69e2ede6.plan.md` ~~in the agent history.~~ [**DONE**]

- ~write a compreensive documenation in astro or docusaurus and publish it as a website in Github Pages~

- ~separate the examples into different repositories to allow each example to be used as a standalone project~

- create a example of the plain HTML similar to the dashboard app

- check the proofread-ui command to see if it is working as expected, check if the warnings and suggestions make sense and are helpful.



## Fixes

- ~~check if we detect placeholder leaks in the translation output~~ [**OK**]

- ~~check if the~~ `lint-source` ~~command is the best name to this action. Maybe we should call it something else.~~ [**OK**]

- ~~when running sync or translate-* commands, make sure to recreate a translated file if the destination file is older than the source file or the destination file doesn't exist.~~ [**DONE**]



## To remove

> nothing to remove

