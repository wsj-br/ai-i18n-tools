# ai-i18n-tools 1.8.9 Release Notes

## Highlights

- **CJK-friendly content placeholders:** Pre-restore integrity now treats `{{ILC_N}}` / `{{URL_N}}` / `{{BLD_N}}` and emphasis markers as restore-by-id content tokens (multiset only). Locale word-order reorderings no longer fail as `placeholderTagMap` sequence mismatches; ordered subsequence checks remain only for structural `{{HTM_N}}` / `{{ADM_*}}` tokens.
- **Clearer placeholder diagnostics:** Content-placeholder inventory and structural-order validation failures are classified separately from post-restore HTML tag errors, so valid CJK inline-code reordering is diagnosable without weakening reuse/drop checks.
- **Docusaurus MDX heading ids:** `write-heading-ids --slug-style mdx-comment` appends `{/* #slug */}` ids (GitHub slug algorithm), refreshes stale comment ids when heading text changes, and HTML styles skip headings that already carry an MDX comment id.
- **Bare CLI in this checkout:** Committed `bin/ai-i18n-tools` plus `.envrc` `PATH_add bin` so the `ai-i18n-tools` command works after `direnv allow`.
- **Example version pins:** Standalone degit copies pin `ai-i18n-tools` to `^1.8.9`; `pnpm version` syncs those pins, ncu skips them, and `pre-release` fails if any pin is stale.

## Why this release matters

Version 1.8.9 lets CJK document translations reorder inline code, URLs, and emphasis without false placeholder failures, and adds Docusaurus MDX comment heading ids plus a PATH-friendly local CLI.

## Detailed Changes

- **Changed**: examples — pin `ai-i18n-tools` to `^1.8.9` (including `multi-provider` / `test-markdown`) so standalone degit copies match the release; the monorepo still resolves via `ai-i18n-tools: workspace:*`.
- **Changed**: scripts — exclude `ai-i18n-tools` from example ncu upgrades, sync example pins from the root version on `pnpm version`, and fail `pre-release` if any example pin is stale.
- **Added**: cli — committed `bin/ai-i18n-tools` (PATH-friendly name beside the published `bin/ai-i18n-tools.mjs` shim) and `.envrc` `PATH_add bin`, so the bare `ai-i18n-tools` command works in this checkout after `direnv allow`.
- **Fixed**: docs — classify content-placeholder inventory and structural-order validation failures separately from post-restore HTML tag errors, so valid CJK inline-code reordering is diagnosable without weakening placeholder reuse/drop checks.
- **Fixed**: docs — pre-restore placeholder integrity treats `{{ILC_N}}` / `{{URL_N}}` / `{{BLD_N}}` / emphasis markers as restore-by-id content tokens (multiset only), so locale word-order reorderings no longer fail as `placeholderTagMap` sequence mismatches; ordered subsequence checks remain only for structural `{{HTM_N}}` / `{{ADM_*}}` tokens.
- **Added**: write-heading-ids — `--slug-style mdx-comment` appends Docusaurus MDX heading ids (`{/* #slug */}`) using the github slug algorithm; refreshes stale comment ids when heading text changes, and HTML styles skip headings that already carry an MDX comment id.

---

## Documentation

- [Getting Started](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/GETTING_STARTED.md) — setup, CLI flags, and config reference.  
- [Locale assets guide](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/LOCALE-ASSETS-GUIDE.md) — screenshots and illustrated SVGs in translated docs.  
- [Package Overview](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/PACKAGE_OVERVIEW.md) — architecture and extension points.  
- [AI Agent Context (consumers)](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — concise context for apps **using** the npm package.

---

## License

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br/ai-i18n-tools)
