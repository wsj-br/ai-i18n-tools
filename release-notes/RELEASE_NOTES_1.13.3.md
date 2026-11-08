# ai-i18n-tools 1.13.3 Release Notes

## Highlights

- **A cited label is only the span that is the term:** A bold or inline-code span counts as a locked UI label when its text is the glossary term. A longer phrase such as `**Ask for target language**` no longer requires the catalog form of `Target language`. Headings and lines that are only that label are unchanged.
- **A locked-label miss finishes the run:** After every configured model fails that check and no other quality check failed, `translate-docs` writes and caches the segment with a glossary-label flag. The summary lists the warnings and writes `glossary-review-*.md` under `cacheDir`. The exit code stays 0.
- **Skip a label check, then retry only those segments:** `glossary.labelCheckSkips` skips the locked-label check for a term, a locale, and optional file globs. The dashboard Glossary tab edits the list, and a Failures row can add a skip. `--recheck-glossary-warnings` retries only flagged segments.
- **The same quality error stops after three tries:** The model list for a segment stops after three attempts fail with the same quality error. A locked-label miss still keeps the best candidate. A batch failure counts as the first of the three.
- **Discarded model output stays readable:** Cache schema 7 stores `translations.glossary_warning` and `translation_failures.rejected_text`, so a discarded model output can be read from the Failures tab.
- **The dashboard header stays in view:** The title and tab bar stay fixed at the top of the page while scrolling.
- **`doctor` can fill in the missing ignore lines:** `--fix-gitignore` appends the missing cache, environment, and temporary-file lines to `.gitignore`, under a blank line and `# ai-i18n-tools doctor fix`. The missing-pattern warning names that command.

## Why this release matters

Version 1.13.3 lets a document translation finish when a locked UI label cannot be matched exactly, and leaves a review file, skips, and a recheck so those segments can be fixed later. The dashboard header stays visible while you scroll, and `doctor` can write the `.gitignore` lines it already warns about.

---

For the full list of changes, see [`dev/CHANGELOG.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/CHANGELOG.md) (`## [1.13.3] - 2026-11-08`).

---

## Documentation

- [Documentation](https://wsj-br.github.io/ai-i18n-tools/) — guides, integrations, and reference
- [Coding-agent skill](https://wsj-br.github.io/ai-i18n-tools/guide/coding-agent-skill.html) — install the consumer skill and workflow slash commands
- [AI Agent Context](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — integration guide for assistants in consumer repositories

---

## License

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br/ai-i18n-tools)
