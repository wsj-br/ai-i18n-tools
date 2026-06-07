# ai-i18n-tools 1.6.0 Release Notes

## Highlights

- **Doc translation resilience:** `translate-docs` can progressively split segments when all models fail validation, retry smaller chunks from the first model, and cache the joined result—controlled by `docs[].segmentSplitting.qualityRetrySplit` (default on).
- **Graceful interrupt handling:** Ctrl+C (SIGINT) and SIGTERM are handled across translation and sync commands; each workflow prints a partial summary and stops starting new API work promptly.
- **CJK emphasis parsing fixes:** Placeholder restoration for bold and italic now inserts spacing when emphasis markers are glued to Unicode letters or punctuation, so CommonMark/mdast parses `strong` and `emphasis` correctly after CJK reordering in translations.
- **Cache reliability:** SQLite WAL checkpoint on close, guaranteed cache shutdown on exit (including errors and signals), and `cleanup` prunes orphaned `translation_failures` rows.
- **Cleaner install and workspace tooling:** Committed CLI wrapper plus `prepare` script rebuilds after a clean checkout; new `pnpm run clean:workspace` removes build outputs and temp files across the monorepo.
- **Docs aligned with current CLI:** Getting Started, Package Overview, and agent context updated for `dashboard`, `translate-json`, runtime exports, and Workflow 3 internals.

## Why this release matters

Version 1.6.0 improves reliability of long doc translation runs—fewer hard failures on difficult segments, safer cache shutdown, and predictable interrupt behavior—while fixing CJK emphasis edge cases that could break markdown structure in translated output. Workspace and install ergonomics are also smoother for contributors and CI.

## Detailed Changes

- **Changed**: examples — refreshed workspace dependencies (`i18next` ^26.3.1, `astro` ^6.4.4, `next` ^16.2.7, `react` ^19.2.7, `tailwindcss` ^3.4.19); aligned Node engine to `>=22.16.0` in console-app. Stock `@astrojs/starlight` on Astro 6.4 needs no pnpm patch — deprecated `markdown.remarkPlugins` still works until Astro 8.0 ([Astro 6.4 blog](https://astro.build/blog/astro-640/)).

- **Changed**: scripts — `scripts/clean-workspace.sh` also removes temporary files matched by `ai-i18n-tools clean-temp` (`*.log`, `*.tmp`, `cache.db.backup*.sqlite`) across the workspace.

- **Added**: scripts — `scripts/clean-workspace.sh` and `pnpm run clean:workspace` remove `node_modules`, build outputs (`dist/`, `build/`, `.next/`, `.astro/`, etc.), test coverage, `src/build-info.generated.ts`, and install/build logs across the pnpm workspace.

- **Fixed**: install — committed `bin/ai-i18n-tools.mjs` wrapper and root `prepare` (`scripts/ensure-built.mjs`) so `pnpm install` after a clean workspace no longer warns about missing `dist/cli/index.js` and rebuilds the library when `dist/` is absent.

- **Security**: examples — removed standalone `examples/nextjs-app/docs-site/pnpm-lock.yaml` and nested `pnpm-workspace.yaml` so Docusaurus deps resolve through the monorepo lockfile (`serialize-javascript@7.0.5`, `uuid@14.0.0` overrides); `scripts/upgrade-dependencies.sh` no longer runs a separate `--ignore-workspace` audit pass for docs-site.

- **Changed**: scripts — `scripts/upgrade-tools.sh` upgrades global `npm@latest`, then refreshes `package.json` `packageManager` and runs `corepack prepare` after installing the latest global `pnpm` (aligned with transrewrt).

- **Changed**: docs — aligned `README.md`, `docs/ai-i18n-tools-context.md`, `docs/PACKAGE_OVERVIEW.md`, and `docs/GETTING_STARTED.md` with current CLI (`dashboard`, `translate-json`, default port 8675), runtime exports (`wrapT`, plural helpers), Workflow 3 internals, `cleanup` `translation_failures` pruning, and removal of `STRONG_OUTSIDE_INLINE_CODE` diagnostics; fixed example scripts (`i18n:dashboard`, console-app `i18n:translate`).

- **Removed**: markdown source diagnostics — `STRONG_OUTSIDE_INLINE_CODE` pre-translation warning (translation now handles `**`/`__` around inline code via emphasis placeholders); removed CLI `strip-md-bold-inline` and `stripBoldAroundInlineCode` utility.

- **Fixed**: emphasis placeholders — when restoring `{{SE}}`/`{{SU}}` closers, insert a space before a following Unicode letter if the character before the closer is punctuation (e.g. `**Rephrase…**을(를)` → `**Rephrase…** 을(를)`), so CommonMark/mdast counts `strong` nodes correctly for CJK particles glued to ellipsis-terminated bold spans.

- **Fixed**: emphasis placeholders — when restoring `{{IU}}`/`{{SU}}` openers (and raw `_`/`__` in `applyEmphasisCloserSpacing`), insert a leading space if the opener is glued after a Unicode letter (e.g. `データを{{IU}}処理{{IU}}` → `データを _処理_ こと`), so underscore emphasis parses after CJK reordering in translations.

- **Fixed**: bold-code placeholders — when restoring `{{BLD_N}}`, insert a leading space if the placeholder is glued after a Unicode letter (e.g. `限り{{BLD_0}}` → `限り **`code`**`), so `**`+`` ` `` openers parse as `strong` after CJK text; trailing-space fix for following particles is unchanged.

- **Added**: `translate-docs` — progressive split-on-failure for markdown AST mismatches: when all configured models fail validation on a segment, split it into smaller chunks (list midpoint, then finer), retry each part from the first model, and cache the joined translation under the original segment hash. Controlled by `docs[].segmentSplitting.qualityRetrySplit` (default on) and `maxQualityRetrySplitDepth` (default `3`); run summary includes `Quality split retries`.

- **Fixed**: documentation cache / cleanup — `cleanup` now prunes orphaned rows from the `translation_failures` table (no matching `translations` row, or source filepath missing on disk); successful cache hits during doc translation clear stale failure rows for that segment.

- **Fixed**: cache — `TranslationCache.close()` runs `PRAGMA wal_checkpoint(TRUNCATE)` on disk databases before closing; `translate-svg`, `cleanup`, and `dashboard` always close the cache on exit (including errors and SIGINT/SIGTERM); `--write-logs` no longer calls `process.exit()` from signal handlers so async `finally` blocks can flush the DB.

- **Fixed**: CLI interrupt — Ctrl+C (SIGINT) and SIGTERM are handled across `translate-docs`, `translate-svg`, `translate-ui`, `translate-json`, `sync`, `sync-ui`, and `cleanup`; each workflow prints a partial summary of completed work before exiting with code 130/143. Batch and per-segment translation loops honor `abortSignal` so in-flight locales stop starting new API work after the first interrupt. `runMapWithConcurrency` rejects promptly on abort (without waiting for all parallel locale workers to finish), and `translate-docs` skips output writes and success summary once interrupted.

---

## Documentation

- [Getting Started](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/GETTING_STARTED.md) — setup, CLI flags, and config reference.  
- [Locale assets guide](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/LOCALE-ASSETS-GUIDE.md) — screenshots and illustrated SVGs in translated docs.  
- [Package Overview](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/PACKAGE_OVERVIEW.md) — architecture and extension points.  
- [AI Agent Context (consumers)](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — concise context for apps **using** the npm package.

---

## License

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br/ai-i18n-tools)
