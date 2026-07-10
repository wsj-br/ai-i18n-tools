<a id="cli--ui-strings"></a>
# CLI — UI strings

<a id="extract"></a>
### `extract`

**Synopsis:** `ai-i18n-tools extract`

Update `strings.json` from `t("…")` / `i18n.t("…")` literals, optional `package.json` description, and optional bundled-master `englishName` entries when `includeUiLanguageEnglishNames` is enabled (see `ui.uiExtractor`; does not read `languagesManifestPath`). Also regenerates `ui-languages.json` at `languagesManifestPath`. When `.html` / `.htm` are listed in `ui.uiExtractor.extensions`, also captures `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` marker strings from HTML. Requires non-empty `ui.sourceRoots`. Does not call an LLM.

**See also:** [UI strings overview](/guide/ui-strings/), [Plain HTML apps](/guide/ui-strings/plain-html)

---

<a id="mark-html"></a>
### `mark-html`

**Synopsis:** `ai-i18n-tools mark-html [paths...] [--write]`

Insert bare `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` markers into HTML so the source text is written once (on the element itself). Scans the given files/dirs/globs (default: `.html` / `.htm` under `ui.sourceRoots`). Dry run by default (reports per-file add counts and any mixed-content elements that need a manual `<span data-i18n>`); `--write` applies changes. Idempotent, honours `data-i18n-ignore` (skips the element and its subtree), never touches code-like elements (`code`, `pre`, `kbd`, `samp`, `var`) or empty/numeric-only text, and never emits a valued marker. Does not call an LLM.

**Key options:** `--write`

**See also:** [Marking HTML for translation](/guide/ui-strings/plain-html#marking-html-for-translation)

---

<a id="generate-ui-languages"></a>
### `generate-ui-languages`

**Synopsis:** `ai-i18n-tools generate-ui-languages [--master <path>] [--dry-run]`

Write `ui-languages.json` to `languagesManifestPath` (defaults to `{ui.flatOutputDir}/ui-languages.json`) using `sourceLocale` + `targetLocales` and the bundled `data/ui-languages-complete.json` (or `--master`). Warns and emits `TODO` placeholders for locales missing from the master file. If you have an existing manifest with customised `label` or `englishName` values, they will be replaced by master catalog defaults — review and adjust the generated file afterwards.

**Key options:** `--master`, `--dry-run`

---

<a id="translate-ui"></a>
### `translate-ui`

**Synopsis:** `ai-i18n-tools translate-ui [-l <codes>] [--force] [--dry-run] [-j <n>]`

Translate UI strings only (`strings.json` → locale JSON). Requires `features.translateUIStrings`.

**Key options:** `-l` / `--locale`, `--force`, `--dry-run`, `-j` / `--concurrency`

`-l` / `--locale`: comma-separated target locales (default: config `targetLocales` minus `sourceLocale`). `--force`: re-translate all entries per locale (ignore existing translations). `--dry-run`: no writes, no API calls.

---

<a id="sync-ui"></a>
### `sync-ui`

**Synopsis:** `ai-i18n-tools sync-ui [-l <codes>] [--force] [--dry-run] [-j <n>]`

Extract, then translate UI strings (requires `features.translateUIStrings`). UI-only — no documentation, SVG, or `json[]`. Same `-l`, `--force`, `--dry-run`, and `-j` options as `translate-ui`.

---

<a id="proofread-ui"></a>
### `proofread-ui`

**Synopsis:** `ai-i18n-tools proofread-ui [-l <code>] [--chunk <n>] [--dry-run] [--json] [-j <n>]`

Runs `extract` first (requires `features.translateUIStrings`) so `strings.json` matches source, then LLM review of source-locale UI strings (spelling, grammar). Terminology hints come from `glossary.userGlossary` CSV only (same scope as `translate-ui` — not `strings.json` / `uiGlossary`, so bad copy is not reinforced as glossary). Uses the active LLM provider (its API-key env var).

Exits **1** on failure (missing feature flag, extract failure, missing/invalid catalog, missing API key, or when all batches fail); exit **0** when the run completes successfully (findings are advisory). Writes `proofread-ui-results_<timestamp>.log` under `cacheDir` as a human-readable report (summary, issues, and per-string OK rows); the terminal prints summary counts and issues only (no `[ok]` lines per string). Prints the log filename on the last line. With `--json`, human-style output goes to stderr. Links use `path:line` like the dashboard UI strings link button.

**Key options:** `-l` / `--locale`, `--chunk` (default **50**), `--dry-run`, `--json`, `-j` / `--concurrency`

---

<a id="export-ui-xliff"></a>
### `export-ui-xliff`

**Synopsis:** `ai-i18n-tools export-ui-xliff [-l <codes>] [-o <dir>] [--untranslated-only] [--dry-run]`

Export `strings.json` to XLIFF 2.0 (one `.xliff` per target locale). Read-only; no API.

**Key options:** `-l` / `--locale`, `-o` / `--output-dir`, `--untranslated-only`, `--dry-run`

`-o` / `--output-dir`: output directory (default: same folder as the catalog). `--untranslated-only`: only units missing a translation for that locale.
