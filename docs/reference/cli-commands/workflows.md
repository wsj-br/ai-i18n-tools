<a id="cli--workflows--reporting"></a>
# CLI — Workflows & reporting

<a id="sync"></a>
### `sync`

**Synopsis:** `ai-i18n-tools sync [options]`

Extract (if enabled), then UI translation, then `translate-svg` when `features.translateSVG` and `config.svg` are set, then documentation translation, then `translate-json` when `features.translateJson` and `json[]` are set — unless skipped with `--no-ui`, `--no-svg`, `--no-docs`, or `--no-json`.

**Key options:** `-l`, `-p` / `-f`, `--dry-run`, `-j`, `-b`, `--force`, `--force-update`, `--check-cache`, `--no-ui`, `--no-svg`, `--no-docs`, `--no-json`

`--force` is forwarded to the UI and SVG steps as well as docs/JSON; `--force-update` applies to docs, JSON, and SVG (not UI). `--check-cache` is forwarded to docs, JSON, and SVG: it re-validates cached segments for locales with an enforced native script even when file tracking would skip. Docs phase also forwards `--emphasis-placeholders` (same meaning as `translate-docs`). Global `--debug-failed` writes `FAILED-TRANSLATION` logs under `cacheDir` for each discarded model attempt (including SVG/docs script fallbacks), not only when every model in the chain fails. `--prompt-format` is not a `sync` flag; docs and JSON steps use the built-in default (`json-array`).

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

---

<a id="usage"></a>
### `usage`

**Synopsis:** `ai-i18n-tools usage [--since <when>] [--provider <name>] [--model <id>] [--operation <name>] [-l <code>] [--outcome accepted|discarded] [--clear] [--older-than <when>] [--dry-run]`

Print recorded model API-call statistics (calls, tokens, and a single USD cost). Cost is the provider's `usage.cost` when present, otherwise the amount from `providers.<name>.modelPricing` or the provider-wide `providers.<name>.pricing` default (stored on new calls; applied at report time for older rows that have no stored cost). Same aggregates as Translation Dashboard → Usage & costs. Detail rows older than seven UTC calendar days are rolled into monthly `api_totals`; reports combine both tables. `--since` accepts `YYYY-MM-DD`, a duration (`30m`, `1h`, `6h`, `12h`, `24h`, `7d`, `30d`), or a calendar-month window (`1mo`, `2mo`, `3mo`). `--clear` deletes detail rows and monthly totals (`--older-than` is `1mo`, `2mo`, `3mo`, `6mo`, `1y`, or `all`; `--dry-run` reports the count without deleting).

**Key options:** `--since`, `--provider`, `--model`, `--operation`, `-l` / `--locale`, `--outcome`, `--clear`, `--older-than`, `--dry-run`

**See also:** [Dashboard usage & costs](/guide/translation-dashboard/usage)
