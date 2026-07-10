<a id="cli--cache--maintenance"></a>
# CLI — Cache & maintenance

<a id="cleanup"></a>
### `cleanup`

**Synopsis:** `ai-i18n-tools cleanup [--dry-run] [--backup <path>]`

Clears the entire `markdown_source_issues` table, then runs `sync --force-update` (extract, UI, SVG, docs, and `translate-json` when enabled) so markdown issues repopulate for currently configured docs; then removes stale segment rows (null `last_hit_at` / empty filepath); drops `file_tracking` rows whose resolved source path is missing on disk; removes translation rows whose `filepath` metadata points at a missing file; prunes orphaned `translation_failures` rows. Logs four prune counts after sync (stale segments, orphaned `file_tracking`, orphaned translations, orphaned failures) plus the upfront markdown-issues clear count.

**Key options:** `--dry-run`, `--backup`

`--backup <path>` writes a SQLite backup to that path before modifications (no backup unless this flag is set).

---

<a id="clean-temp"></a>
### `clean-temp`

**Synopsis:** `ai-i18n-tools clean-temp [-r | --root <path>] [-f | --force] [--dry-run]`

No config. Walks a directory tree (default: cwd) for `*.log`, `*.tmp`, and `cache.db.backup*.sqlite`, prints `./…` paths like `find -print`. With matches: prompts `Delete these files? (y/n)` unless `-f` / `--force` (delete without prompt). With no matches: exits without prompting. `--dry-run`: list only, no prompt or deletes (overrides `--force`).

**Key options:** `-r` / `--root`, `-f` / `--force`, `--dry-run`

---

<a id="purge-locale"></a>
### `purge-locale`

**Synopsis:** `ai-i18n-tools purge-locale -l <code> [-l <code> …] [options]`

Delete all cached rows for the given locale(s) from `translations`, `file_tracking`, and `translation_failures`, and the generated artifacts for that locale: translated documents (`.md` / `.mdx` / `.astro` outputs resolved from `docs[]`, including orphaned outputs whose source was removed — found by sweeping each block's output tree, except when a custom `pathTemplate` is configured), the per-locale flat UI file (`<flatOutputDir>/<locale>.json`), and the locale's entries in `strings.json`.

Locales are passed via repeatable `-l` / `--locale` (normalized to BCP-47). Prints per-locale counts (cache rows, documents, `strings.json` entries, flat file); warns (does not error) for locales with nothing to purge. Prompts for confirmation unless `-y` / `--yes` / `-f` / `--force`. `--dry-run`: report counts and the files that would be removed, delete nothing. `--keep-files`: purge only the SQLite cache, leaving generated files and `strings.json` untouched. No SQLite backup is made unless `--backup <path>` is passed, which writes a backup to that path before deletion.

**Key options:** `-l` / `--locale`, `--dry-run`, `-y` / `--yes`, `-f` / `--force`, `--keep-files`, `--backup`
