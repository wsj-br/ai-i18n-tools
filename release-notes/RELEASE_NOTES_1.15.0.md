# ai-i18n-tools 1.15.0 Release Notes

## Highlights

- **`upgrade` updates the install you are running:** The command prints the latest npm or GitHub release and, after confirmation or `--yes`, updates a project or global Node install, or replaces the standalone executable for the current platform.
- **Heading ids inside inline code stay put:** `{#id}` and `{/* #id */}` written as code in a heading are no longer rewritten to empty backticks. `sync --force-update` no longer has to restore those spans from the translation cache.
- **Root help lists UI languages as `code - name`:** Shipped `-L` / `--ui-lang` languages wrap at 80 columns with a two-space indent. A bare `-L` / `--ui-lang` still prints the aligned table.
- **The package description matches the full surface:** The npm description, keywords, and root help cover JS/TS, Python, and .NET apps, websites, docs, READMEs, JSON, and SVG, and name the frameworks and catalogs the tool already supports.

## Why this release matters

Version 1.15.0 adds `upgrade` so a project, global, or standalone install can move to the latest release from the CLI, and stops `write-heading-ids` from stripping heading-id examples that are written as inline code.

---

For the full list of changes, see [`dev/CHANGELOG.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/CHANGELOG.md) (`## [1.15.0] - 2026-11-10`).

---

## Documentation

- [Installation](https://wsj-br.github.io/ai-i18n-tools/guide/installation.html) — installation instructions
- [Documentation](https://wsj-br.github.io/ai-i18n-tools/) — guides, integrations, and reference
- [Coding-agent skill](https://wsj-br.github.io/ai-i18n-tools/guide/coding-agent-skill.html) — install the consumer skill and workflow slash commands
- [Add internationalization](https://wsj-br.github.io/ai-i18n-tools/guide/add-i18n-to-your-project.html) — add internationalization to your project (JS/TS, Python, .Net, Documentation, ...)

---

## License

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br/ai-i18n-tools)
