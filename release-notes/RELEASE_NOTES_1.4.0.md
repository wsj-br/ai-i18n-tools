# ai-i18n-tools 1.4.0 Release Notes

## Highlights

- **MDX placeholder protection:** New `{{MDX_N}}` tokens protect MDX-only constructs (heading-id comments `{/* #my-id */}`, generic comments `{/* … */}`, capitalized JSX tag pairs like `<Highlight>`, and depth-aware brace expressions like `{frontMatter.title}`) from leaking into translation prompts. These are managed via the new `protectMdx` / `restoreMdx` utilities.
- **MDX extraction improvements:** `label` attributes on `<Tabs values={[ … ]}>` objects and `<TabItem>` openers (when they lack `label`) are now extracted as translatable strings, skipping lowercase slug-like values to keep keys aligned with `defaultValue` / `values`. Top-level MDX `export` blocks are classified as non-translatable code, matching existing `import` rules.
- **YAML front matter exclusion:** YAML front matter in markdown/MDX is no longer translated (`translatable: false`), keeping routing keys (`slug`, `id`, etc.) stable across locales.
- **Admonition clarity:** Only the directive prefix on the opening line of admonitions (`:::note` or ``:::note `` with a same-line title) is replaced by `{{ADM_OPEN_N}}`; the title suffix remains for the model to translate.
- **Path filtering & warnings:** `translate-docs` / `sync` now translate `.md` / `.mdx` files outside `documentations[].contentPaths` (using `documentations[0]` output settings) or that were missed by discovery (e.g., ignored files), with a warning. Commands warn when `--path` / `--file` points to a non-existent path.
- **CLI help improvements:** Root `--help` shows a short guide per command; `translate-docs`, `translate-svg`, `translate-ui`, `sync`, and `export-ui-xliff` append Examples; descriptions and `sync -l` hint text mention comma-separated locale codes.
- **Backup file naming:** CLI `strip-md-bold-inline` now uses `.tmp` extension for backup files (e.g., `file.backup.2026-05-04T22-46-00-000Z.md.tmp`) to prevent accidental translation.

## Why this release matters

This release significantly improves reliability and predictability for documentation translation, especially for projects using MDX. MDX-only constructs that previously leaked into translation prompts are now protected, and extraction logic handles common patterns like `<Tabs>` labels and `export` blocks correctly. Path filtering and clearer warnings help you catch missing files or invalid paths early, while front matter and admonition handling ensure routing keys and directive syntax remain stable across locales.

---

## Documentation

- [Getting Started](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/GETTING_STARTED.md) — setup, CLI flags, and config reference.  
- [Package Overview](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/PACKAGE_OVERVIEW.md) — architecture and extension points.  
- [AI Agent Context (consumers)](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — concise context for apps **using** the npm package.

---

## License

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br/ai-i18n-tools)
