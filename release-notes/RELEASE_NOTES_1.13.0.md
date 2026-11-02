# ai-i18n-tools 1.13.0 Release Notes

## Highlights

- **Translate .NET apps:** Extract `T`, `Tn`, `Tp`, `N`, and `Loc["…"]` from C#, Razor, and cshtml, and `{loc:Tr '…'}` from XAML and AXAML. Unsafe interpolation is reported and left out of the catalog. `init -t ui-dotnet` writes `I18n.cs` with embedded flat JSON, culture fallback, and plurals. `ui.resx` writes a neutral file and one `.resx` per culture; keys are the source strings, and `init -t ui-dotnet-resx` writes `I18nResx.cs`. `extract` reads those satellites, including legacy named keys matched through the neutral value. `migrate-dotnet-i18n` rewrites interpolation, concatenation, and `string.Format` inside `T()` (dry run by default) and can mark unmarked XAML labels and high-confidence C# sinks with `--wrap`. Placeholder style `dotnet` keeps `{0}`, alignment, and format specs. `uiExtractor.exclude` skips extra paths, and the usual build folders (`bin`, `obj`, `.vs`, `TestResults`, `packages`) are skipped on directory walks. The guide and `ui-dotnet` template take the language menu from `locales/ui-languages.json`.
- **Inflect UI labels in prose, and keep them exact when cited:** A catalog label inside a sentence is a glossary hint, so a translation can inflect it (Hindi can use `कर्सर खाते` for `Cursor account`). The exact wording is required when the source cites that label in bold, inline code, a heading, or a line that is only the label. Shared multi-word prefixes from the UI catalog are seeded as their own terms when the English prefix is a capitalized label. Markdown that drops a two-to-five-word UI label is rejected and retried on the next model, and the document prompt says not to add bold the source does not have. A new or edited `Force` row misses the segment cache only when the source contains that term and the stored text does not already include the forced translation.
- **Keep UI strings when a later phase fails:** `translate-ui` writes plain strings when that phase finishes and plural forms when the plural phase finishes, so a plural failure leaves the strings already translated. A stored translation that renames, drops, invents, or changes a placeholder is translated again; `user-edited` rows are kept and warned about. `--dry-run` does not create the output directory or call a model. Discarded UI-string and plural checks log the same way as document translation, and Pass B keeps a placeholder that exists only on the English plural form (a singular with a literal number and no count token). A string that is only placeholders and punctuation is copied. A percent sign followed by a word and an apostrophe, as in French `% d'appels`, is treated as prose.
- **`sync` skip flags skip that step:** `--no-ui`, `--no-svg`, `--no-docs`, and `--no-json` skip the matching phase. The same flag read fixes `--no-cache` and `--no-emphasis-placeholders`. `sync --force` no longer retranslates the UI catalog. Flat link rewriting still uses every markdown file in the docs block, so `sync --file README.md` points a sibling link at the locale file.
- **Clearer checks before a run:** `doctor` says how many `translationModels` are configured for the active provider and whether each is valid, missing, or past its catalog date. Set environment variables print as one alphabetical list (`Configured variables: NAME, ...`); API key values stay hidden. `suggest-models --max-output-price` is now `--max-price`. When `requestTimeout` and `requestTimeoutMs` are omitted, the default LLM request timeout is 120 seconds.
- **Spaces and placeholders follow the host language:** A JavaScript, TypeScript, or Python literal keeps a leading or trailing space in the catalog key, and `t()` looks that text up as written. C# and XAML still trim, because `I18n.T` puts those spaces back after lookup. `migrate-python-i18n` names a placeholder from the expression (`start.isoformat()` becomes `{start}`). Dashboard edits to the document cache are no longer rejected with the UI placeholder rules; UI catalog rows still ask for confirmation when a placeholder does not match its source. `pnpm build:binary` strips debug info and static symbols from the copied Node binary before injection.

## Why this release matters

Version 1.13.0 brings .NET and `.resx` into the same extract-and-translate workflow as JavaScript and Python. UI runs keep the strings already translated if a later plural phase fails, and glossary hints let a label inflect in a sentence while staying exact when the source cites it.

---

For the full list of changes, see [`dev/CHANGELOG.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/CHANGELOG.md) (`## [1.13.0] - 2026-11-02`).

---

## Documentation

- [Documentation](https://wsj-br.github.io/ai-i18n-tools/) — guides, integrations, and reference
- [Coding-agent skill](https://wsj-br.github.io/ai-i18n-tools/guide/coding-agent-skill.html) — install the consumer skill and workflow slash commands
- [AI Agent Context](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — integration guide for assistants in consumer repositories

---

## License

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br/ai-i18n-tools)
