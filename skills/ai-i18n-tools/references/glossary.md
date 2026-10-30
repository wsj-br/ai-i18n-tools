# Glossary and translation context

Use the glossary to keep product names, domain terms, and do-not-translate words
consistent across every pipeline (UI, Documents, JSON, SVG). It feeds terminology
hints into the model prompt; it does not post-process or find-and-replace output
unless a row is forced.

## Two sources of terms

- UI auto-glossary: each `ui[]` block with `uiGlossary` true (the default) seeds
  terms from its `strings.json` translations. Existing UI translations therefore
  guide Documents/JSON/SVG wording automatically. Set `uiGlossary: false` on a
  block to exclude it.
- User glossary CSV: a hand-curated file at `glossary.userGlossary`. User rows
  override and extend the auto-glossary.

Both are matched case-insensitively on word boundaries. Longer terms win over
shorter overlapping ones.

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

- Re-run `ai-i18n-tools sync` after editing the CSV; terminology applies on the
  next translation, and cached rows for unchanged source stay as they were.
- Spot-check that forced terms appear verbatim and that `*` rows reached every
  target locale.
- Keep the CSV in version control; it is source, not generated output.

## Published guides

- [Glossary](https://wsj-br.github.io/ai-i18n-tools/guide/glossary)
- [Configuration](https://wsj-br.github.io/ai-i18n-tools/reference/configuration#glossary)
