# ai-i18n-tools 1.3.1 Release Notes

## Highlights

- **Markdown source diagnostics:** Static checks for delimiter issues such as bold wrapping inline code or links (`STRONG_OUTSIDE_INLINE_CODE`, `STRONG_OUTSIDE_LINK`), with a false-positive fix for strong closers before a following code span and correct file line reporting. New CLI `check-markdown` mirrors `translate-docs` path discovery and segment extraction; optional `documentations[].warnMarkdownSourceIssues` (default on) logs issues and refreshes cache rows once per source file before locale work.
- **Translation Cache Editor:** **Markdown issues** tab with filters, pagination, and HTTP APIs; SQLite `markdown_source_issues` (schema v4) stores per-file scan results. **Log links** from the editor now log `path:line` without the `doc-block:{n}:` cache key prefix.
- **Housekeeping CLI:** `clean-temp` walks the tree for `*.log` and `cache.db.backup*.sqlite`, lists matches, and deletes with confirmation or `--force` / `--dry-run`.
- **Docs:** `docs/ai-i18n-tools-context.md` expanded with code patterns, runtime wiring, RTL notes, generated layout, and more CLI coverage for downstream agents.

## Why this release matters

You can catch markdown patterns that confuse translation *before* paying for API work—via CI (`check-markdown`), during `translate-docs`, and in the cache editor—while duplicate per-locale scans and noisy diagnostics are reduced. Temp log and backup files get a simple, safe cleanup path.

## Changes

- **Changed**: docs — expanded `docs/ai-i18n-tools-context.md` with code patterns, a runtime wiring sketch, RTL notes, generated-file layout, and extra CLI entries; remains audience-agnostic for downstream agents.

- **Fixed**: markdown source diagnostics — `STRONG_OUTSIDE_INLINE_CODE` no longer treats the closer of `**word**` / `__word__` (a letter or digit immediately before the delimiter run) as an opener wrapping a following `` `...` `` span; fixes false positives such as `**Bare** `ai-i18n-tools` **in the terminal**`. Strong/link issues now apply `segmentStartLine` to reported file lines like other diagnostics.

- **Added**: markdown source diagnostics — `STRONG_OUTSIDE_INLINE_CODE` and `STRONG_OUTSIDE_LINK` detect `**`/`__` wrapping a `` `...` `` span or a `[text](url)` link (same segment scan as existing checks); reported by `check-markdown`, `translate-docs` when `warnMarkdownSourceIssues` is enabled, and the Translation Cache Editor **Markdown issues** tab.

- **Changed**: translate-docs — markdown source diagnostics (`warnMarkdownSourceIssues`) run **once per source file** (after the same segment extraction as translation) before locale-parallel work, so `markdown_source_issues` refresh and stderr warnings are not duplicated for each target locale.

- **Fixed**: Translation Cache Editor — `POST /api/log-links` (cache segments and **Markdown issues** link button) logs `path:line` with the project-relative file path only, omitting the `doc-block:{n}:` cache key prefix (for example `README.md:57` instead of `doc-block:0:README.md:57`).

- **Added**: CLI `clean-temp` — walks a tree for `*.log` and `cache.db.backup*.sqlite`, prints `./…` lines like `find -print`; `-f` / `--force` deletes without prompting, otherwise prompts `Delete these files? (y/n)` and deletes only on exact `y`; no prompt when nothing matches; optional `-r` / `--root` and `--dry-run` (list only, overrides `--force`). The `package.json` `clean-temp` script invokes this command.

- **Added**: CLI `check-markdown` — scans each `documentations[]` markdown/MDX source (same paths and segment extraction as `translate-docs`, honours `.translate-ignore` and `--path`), prints `path:line: [CODE] detail` to stderr (or JSON with `--json`), exits **1** when issues exist, and refreshes the `markdown_source_issues` SQLite table unless `--no-cache`.

- **Added**: Translation Cache Editor — **Markdown issues** tab with filters, pagination, and `GET /api/markdown-source-issues`, `GET /api/markdown-source-issues/summary`, and `GET /api/markdown-source-issue-codes` (static delimiter / inline-code diagnostics, not translation failures).

- **Added**: SQLite `markdown_source_issues` table (schema version **4**) with `TranslationCache.replaceMarkdownIssuesForFilepath`, `listMarkdownSourceIssues`, `getMarkdownSourceIssueSummary`, and `getUniqueMarkdownSourceIssueCodes`; rows are replaced per cache filepath on scan and removed when translations for that filepath are deleted.

- **Added**: `documentations[].warnMarkdownSourceIssues` (optional, default **true**) — during `translate-docs`, log markdown source warnings and refresh `markdown_source_issues` for each processed file.

- **Added**: `src/processors/markdown-source-diagnostics.ts` and exports `collectMarkdownSourceIssues`, `collectMarkdownIssuesForSegment`, `shouldDiagnoseMarkdownSegment`, and `MARKDOWN_SOURCE_ISSUE_CODES`; `emphasis-placeholders` exports `collectMarkdownDelimiterRuns`, `pairMarkdownEmphasisDelimitersFromRuns`, `findCodeSpanEnd`, `findUnclosedInlineCodeLine1Starts`, and `MarkdownDelimiterRun` for shared pairing rules.

- **Added**: `buildMarkdownExtractOpts` in `doc-translate.ts` so `translate-docs` and `check-markdown` share the same markdown extractor options.

---

## Documentation

- [Getting Started](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/GETTING_STARTED.md) — setup, CLI flags, and config reference.  
- [Package Overview](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/PACKAGE_OVERVIEW.md) — architecture and extension points.  
- [AI Agent Context (consumers)](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — concise context for apps **using** the npm package.

---

## License

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br/ai-i18n-tools)
