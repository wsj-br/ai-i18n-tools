# ai-i18n-tools 1.8.12 Release Notes

## Highlights

- **Heading ids stay at the end of the line:** `translate-docs` peels `{#id}` and `{/* #id */}` suffixes off ATX headings before the model runs, then pins them back at end of line. CJK and other SOV word orders can no longer leave a mid-heading comment that Docusaurus ignores.
- **English heading ids copied to translations:** After `write-heading-ids` updates source files, it copies those English ids onto existing translated markdown (never slugging the translated title) and repairs mid-line placements. `--remove` strips the same tokens in translated files.
- **Tighter document prompts:** Prompts list only the `{{IDENT}}` placeholder types present in the current request, so unused emphasis, glossary, and inline-code tokens are no longer advertised. Inputs with no internal placeholders are told not to emit any `{{…}}` tokens.
- **Nested lists stay intact:** Default list chunking keeps 2-space nested items with their parent, and structural compare no longer false-fails on isolated list node-count drift when marker indents match.
- **Richer failure debugging:** `--debug-failed` logs include the unprotected source, restored translation, and mdast counts actually compared. A new `analyze:translation-failures` maintainer script ranks recurring validation failures.

## Why this release matters

Version 1.8.12 keeps Docusaurus heading anchors valid after CJK translation and stops nested-list chunking from splitting or false-failing markdown, while making document-quality retries easier to diagnose.

---

For the full list of changes, see [`dev/CHANGELOG.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/CHANGELOG.md) (`## [1.8.12] - 2026-09-21`).

---

## Documentation

- [Getting Started](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/GETTING_STARTED.md) — setup, CLI flags, and config reference.  
- [Locale assets guide](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/LOCALE-ASSETS-GUIDE.md) — screenshots and illustrated SVGs in translated docs.  
- [Package Overview](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/PACKAGE_OVERVIEW.md) — architecture and extension points.  
- [AI Agent Context (consumers)](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — concise context for apps **using** the npm package.

---

## License

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br/ai-i18n-tools)
