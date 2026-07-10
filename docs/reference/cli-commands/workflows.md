<a id="cli--workflows--status"></a>
# CLI — Workflows & status

<a id="sync"></a>
### `sync`

**Synopsis:** `ai-i18n-tools sync [options]`

Extract (if enabled), then UI translation, then `translate-svg` when `features.translateSVG` and `config.svg` are set, then documentation translation, then `translate-json` when `features.translateJson` and `json[]` are set — unless skipped with `--no-ui`, `--no-svg`, `--no-docs`, or `--no-json`.

**Key options:** `-l`, `-p` / `-f`, `--dry-run`, `-j`, `-b`, `--force`, `--force-update`, `--no-ui`, `--no-svg`, `--no-docs`, `--no-json`

`--force` is forwarded to the UI and SVG steps as well as docs/JSON; `--force-update` applies to docs, JSON, and SVG (not UI). Docs phase also forwards `--emphasis-placeholders` and `--debug-failed` (same meaning as `translate-docs`). `--prompt-format` is not a `sync` flag; docs and JSON steps use the built-in default (`json-array`).

---

<a id="status"></a>
### `status`

**Synopsis:** `ai-i18n-tools status [--max-columns <n>]`

When `features.translateUIStrings` is on, prints UI coverage per locale (`Translated` / `Missing` / `Total`). Then prints markdown translation status per file × locale (no `--locale` filter; locales come from config). When `features.translateJson` is on and `json[]` is configured, also prints JSON bundle status per block. Large locale lists are split into repeated tables of up to `n` locale columns (default **9**) so lines stay narrow in the terminal.

**Key options:** `--max-columns`

---

<a id="statistics"></a>
### `statistics`

**Synopsis:** `ai-i18n-tools statistics [--max-columns <n>]`

Print documentation cache and `strings.json` statistics (same aggregates as Translation Dashboard → Statistics). `--max-columns`: max locale columns per model × locale table (default **6**).

**Key options:** `--max-columns`

**See also:** [Dashboard statistics](/guide/translation-dashboard/statistics)
