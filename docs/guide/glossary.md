<a id="glossary"></a>
# Glossary

The glossary ensures consistent product terminology across translations. Users can define a term's translation in one or multiple languages, allowing the AI model to use this predefined translation instead of guessing the best one. It can also be used to keep certain terms, such as product names, unchanged during translation into other languages.


Two kinds of guidance are sent to the model:

- **Term rows** in `glossary.userGlossary` (and, for some pipelines, existing UI translations from `glossary.uiGlossary`). A row is included only when that source term appears in the text being translated.
- **Project context files** in `glossary.contextFiles`. The full brief is injected into every UI, docs, JSON, SVG, and proofread prompt. That section is [below](#project-context-files).

<a id="how-the-glossary-works"></a>
## How the glossary works

<a id="where-terms-come-from"></a>
### Where terms come from

| Source | Config | Used by |
| --- | --- | --- |
| UI catalog | `glossary.uiGlossary` — usually the same path as `ui.stringsJson` | `translate-docs`, `translate-json`, `translate-svg` |
| User CSV | `glossary.userGlossary` | `translate-ui`, `proofread-ui`, `translate-docs`, `translate-json`, `translate-svg` |

`uiGlossary` reuses translations already stored in `strings.json` as hints, so documentation, JSON, and SVG stay aligned with the UI. `translate-ui` and `proofread-ui` do not read `uiGlossary` — they only take hints from the user CSV, so a bad UI translation is not fed back in as the preferred term.

The user CSV wins over the UI catalog. A row whose `locale` is a specific code replaces both the `*` row and the UI-catalog translation for that locale. A `locale` of `*` applies the same translation to every `targetLocales` entry that does not already have one from the UI catalog.

Compact UI-label abbreviations (a trailing dot such as `Alm.`, or a short single-token compression such as `Size` → `Tam`) stay available for UI translation. Document prompts skip them, so they do not push models toward invented <code v-pre>{{…}}</code> tokens in markdown or MDX.

<a id="when-a-term-is-sent"></a>
### When a term is sent

Matching is case-insensitive and stops at a word boundary (whitespace or punctuation). Longer terms are preferred, and overlapping matches are dropped. When a term matches the current batch, the prompt receives a hint like `"dashboard" → "Tableau"`. If that row has a **Context** note, the note is appended for that match only.

**Context** is source-language usage guidance (what the term means, or how to use it). It is not a translation. Changing a **Context** note, or any `glossary.contextFiles` content, refreshes cached translations for the affected locale on the next run — you do not need `--force`. Changing only the preferred **Translation** keeps the existing cache until you pass `--force` or `--force-update`. Rows you edited in the dashboard stay as `user-edited`.

<a id="force"></a>
### Force

When **Force** is `true`, `yes`, or `1`, the source term is taken out of the text before the model sees it and the preferred translation is written back afterward. The wording is exact, not a suggestion. The same word-boundary and longest-match rules apply. Leave **Force** empty (or `false`) when the model should prefer the translation but may still inflect it.

<a id="generate-a-glossary"></a>
## Generate a glossary

`glossary-generate` writes an empty CSV with the standard header. It uses `glossary.userGlossary` from config, or `glossary-user.csv` when that key is unset. It refuses to overwrite a file that already exists (exit **1**).

```bash
ai-i18n-tools glossary-generate
# or: ai-i18n-tools glossary-generate -o i18n/glossary.csv
```

Point config at the file:

```json
{
  "glossary": {
    "uiGlossary": "src/locales/strings.json",
    "userGlossary": "i18n/glossary.csv"
  }
}
```

You can also create the CSV glossary file directly from the dashboard. The first **Add** action on the [Glossary](/guide/translation-dashboard/glossary) tab will create the file if `glossary.userGlossary` is specified and the file does not already exist. When `glossary.autoAddUserEditedToGlossary` is `true` (the default), correcting a UI string in the dashboard can add that change to the CSV during the next `translate-ui` run. The dashboard also serves as an editor for the CSV glossary, allowing you to add, edit, or filter rows within the UI.


<a id="csv-columns"></a>
## CSV columns

Header row:

```text
Original language string,locale,Translation,Force,Context
```

`en` or `English` is accepted instead of `Original language string`. `Notes` is accepted instead of `Context`.

| Column | Meaning |
| --- | --- |
| **Original language string** | Source term or phrase, in the source locale |
| **locale** | Target locale code, or `*` for every target |
| **Translation** | Preferred translation |
| **Force** | `true`, `yes`, or `1` to require this wording; otherwise a hint |
| **Context** | Optional source-language explanation. Sent only when this term matches |

<a id="examples"></a>
## Examples

One product term for every locale, a forced German label, and a French row that explains a word the model might take literally:

```csv
"Original language string","locale","Translation","Force","Context"
"dashboard","*","Tableau","false","The analytics home, not a vehicle panel"
"Save","de","Speichern","true",""
"workspace","fr","espace de travail","false","A user's project container, not an office"
```

Combined with a project brief:

```json
{
  "glossary": {
    "uiGlossary": "src/locales/strings.json",
    "userGlossary": "i18n/glossary.csv",
    "contextFiles": ["i18n/product-context.md"],
    "contextMaxChars": 12000
  }
}
```

Field reference: [`glossary` in Configuration](/reference/configuration#glossary). Command reference: [`glossary-generate`](/reference/cli-commands/tools#glossary-generate).

<a id="project-context-files"></a>
## Project context files

`glossary.contextFiles` is for product-level guidance that does not belong in a single CSV row: what the product is, who it is for, tone, and terms that are easy to mistranslate. Point config at one or more cwd-relative `.md` / `.txt` files; they are concatenated in listed order and injected into every UI, docs, JSON, SVG, and proofread prompt.

```json
{
  "glossary": {
    "userGlossary": "i18n/glossary.csv",
    "contextFiles": ["i18n/product-context.md"]
  }
}
```

Write the brief in the **source locale**, keep it well under `glossary.contextMaxChars` (default `12000`), and store it outside `docs[].contentPaths` unless you also want that file translated. See [`glossary` in Configuration](/reference/configuration#glossary).

<a id="generate-a-context-file-with-an-ai-agent"></a>
### Generate a context file with an AI agent

Ask an agent (Cursor, Claude Code, Copilot, and similar) to read the repo and write the brief. Paste a prompt like this:

```text
Create a translation-context Markdown file for this repository at i18n/product-context.md.

This file is injected verbatim into every ai-i18n-tools translation prompt (UI strings, docs, JSON, SVG, proofread). It must stay in the source language of the project (do not translate it). Translators already receive a glossary of preferred term mappings; this file should explain meaning, audience, and register — not duplicate every glossary row.

Requirements:
- Concise: aim for 1–4 KB, hard limit 8000 characters. No full manuals, README dumps, or changelog history.
- Source-language only. Short headings, bullet lists, and a few example sentences are enough.
- No secrets, API keys, credentials, personal data, internal URLs, or unpublished commercial figures.
- Do not invent product facts. If something is unclear, omit it or mark it as unknown.
- Do not put this file under a path that is also listed in docs[].contentPaths.

Cover, in this order:
1. Product in one paragraph: what it is, who uses it, and the default tone (formal / informal / technical).
2. Domain and disambiguation: terms that look ordinary in English but have a product-specific meaning (for example “dashboard” as an analytics home, not a vehicle panel).
3. Features or areas that change register (billing vs. onboarding vs. admin).
4. Things translators must preserve exactly: brand names, CLI flags, config keys, code identifiers, placeholder tokens.
5. Locale notes only when they affect meaning for every target (for example “use formal you”). Do not list per-locale translations here.

Write only the Markdown file. Afterward, remind me to add it to glossary.contextFiles in ai-i18n-tools.config.json if it is not already listed.
```

Review the file before the next `sync` / `translate-*` run. Changing the file invalidates cached translations for each locale on that run, so keep the brief stable once quality is good.
