# Glossary and translation context

Use the glossary to keep product names, domain terms, and do-not-translate words
consistent across every pipeline (UI, Documents, JSON, SVG). It feeds terminology
hints into the model prompt. A `Force` row is written back after translation.
Markdown also rejects a short UI label whose catalog translation is missing.

## Two sources of terms

- UI auto-glossary: each `ui[]` block with `uiGlossary` true (the default) seeds
  terms from its `strings.json` translations. Existing UI translations therefore
  guide Documents/JSON/SVG wording automatically. Set `uiGlossary: false` on a
  block to exclude it.
- User glossary CSV: a hand-curated file at `glossary.userGlossary`. User rows
  override and extend the auto-glossary.

Both are matched case-insensitively on word boundaries. Longer terms win over
shorter overlapping ones. A multi-word prefix shared by two or more UI catalog
keys is added as its own term when the prefix is a capitalized label and the
catalog translations for a locale share a short starting phrase. Sentence stems
are not added. Markdown translation requires a two-to-five-word UI label
(catalog key or that seeded prefix) to keep its translation when the source
cites it in bold, inline code, a heading, or a line that is only that label.
Title case inside a sentence is a hint, so the translation can inflect.
A single-content-word label such as `Sign in` stays a hint. The check ignores
capitalization. Ordinary prose may inflect the same words.
Single-word hints may still be inflected. A user-CSV hint that is not also a UI
label stays a hint.

## Create and fill the user glossary

```bash
ai-i18n-tools glossary-generate
```

This writes an empty CSV (default `glossary-user.csv`, or `glossary.userGlossary`)
with the standard header. It refuses to overwrite an existing file. Columns:

| Column | Meaning |
| --- | --- |
| `Original language string` | Source-locale term (also accepts `en`/`english`). |
| `locale` | Target locale, or `*` for every `targetLocales` entry. |
| `Translation` | Required locale translation for that term. |
| `Force` | `true`/`yes`/`1` replaces the term in output, not just a hint. |
| `Context` | Optional source-language usage note (also accepts `Notes`). |

- A `*` row applies to all targets; an exact-locale row overrides the `*` value.
- Rows missing source, locale, or translation are skipped.
- To keep a term untranslated, add a row whose `Translation` equals the source and
  set `Force` to `true`.
- `Force` protects the replacement like a placeholder; use it for brand names and
  fixed terminology, not ordinary wording preferences.

## Configure

Merge into an already-configured project:

```json
{
  "glossary": {
    "userGlossary": "glossary-user.csv",
    "contextFiles": ["docs/translation-notes.md"]
  }
}
```

- `userGlossary`: CSV path, project-root relative.
- `autoAddUserEditedToGlossary` (default true): dashboard-edited translations feed
  back into the auto-glossary.
- `contextFiles`: Markdown/plain-text files injected into every translation and
  proofread prompt for project-wide tone and domain context.
- `contextMaxChars` (default 12000, max 100000): caps concatenated context text.

## Verify

- Re-run `ai-i18n-tools sync` after editing the CSV. A non-forced translation
  change keeps cached rows until `--force` or `--force-update`. A `Force` row
  refreshes only segments whose source contains that term, unless the row also
  has a `Context` note (that still refreshes the whole locale). `sync --no-ui`
  skips UI translation, and `sync --force` does not retranslate the UI catalog.
- Spot-check that forced terms appear verbatim and that `*` rows reached every
  target locale.
- Keep the CSV in version control; it is source, not generated output.

## Published guides

- [Glossary](https://wsj-br.github.io/ai-i18n-tools/guide/glossary)
- [Configuration](https://wsj-br.github.io/ai-i18n-tools/reference/configuration#glossary)
