<a id="cli-options"></a>
# CLI options

Reference for `translate-docs` cache behaviour, flags, batch prompt format, and internal SQLite path keys.

<a id="cache-behaviour-and-translate-docs-flags"></a>
## Cache behaviour and `translate-docs` flags

The CLI keeps **file tracking** in SQLite (source hash per file × locale) and **segment** rows (hash × locale per translatable chunk). A normal run skips a file entirely when the tracked hash matches the current source, the output file already exists, **and** the output's modification time is at least as new as the source's; otherwise it processes the file and uses the segment cache so unchanged text does not call the API.


| Flag                          | Effect                                                                                                                                                                                                                                                              |
|-------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| *(default)*                   | Skip unchanged files when tracking + on-disk output match; use segment cache for the rest.                                                                                                                                                                          |
| `-l, --locale <codes>`        | Comma-separated target locales (when omitted, defaults match the union of root `targetLocales` and each `docs[]` block's optional `targetLocales`).                                                                                                                 |
| `-p, --path` / `-f, --file`   | Only translate markdown/JSON under this path (project-relative, absolute, or glob pattern); `--file` is an alias for `--path`.                                                                                                                                      |
| `--dry-run`                   | No file writes and no API calls.                                                                                                                                                                                                                                    |
| `--type <kind>`               | Restrict to `markdown` or `json` (otherwise both when enabled in config).                                                                                                                                                                                           |
| `--json-only` / `--no-json`   | Translate only JSON label files, or skip JSON and translate markdown only.                                                                                                                                                                                          |
| `-j, --concurrency <n>`       | Max parallel target locales (default from config or CLI built-in default).                                                                                                                                                                                          |
| `-b, --batch-concurrency <n>` | Max parallel batch API calls per file (docs; default from config or CLI).                                                                                                                                                                                           |
| `--emphasis-placeholders`     | Mask markdown emphasis markers as placeholders before translation. Auto-enabled for CJK and RTL locales unless overridden per block via `docs[].emphasisPlaceholders` or disabled with `--no-emphasis-placeholders`.                                                |
| `--debug-failed`              | Write detailed `FAILED-TRANSLATION` logs under `cacheDir` when validation fails.                                                                                                                                                                                    |
| `--force-update`              | Re-process every matched file (extract, reassemble, write outputs) even when file tracking would skip. **Segment cache still applies** — unchanged segments are not sent to the LLM.                                                                                |
| `--force`                     | Clears file tracking for each processed file and **does not read** the segment cache for API translation (full re-translation). New results are still **written** to the segment cache.                                                                             |
| `--stats`                     | Print segment counts, tracked file counts, and per-locale segment totals, then exit.                                                                                                                                                                                |
| `--clear-cache [locale]`      | Delete cached translations (and file tracking): all locales, or a single locale, then exit.                                                                                                                                                                         |
| `--prompt-format <mode>`      | How each **batch** of segments is sent to the model and parsed (`xml`, `json-array`, or `json-object`). Default `json-array`. Does not change extraction, placeholders, validation, cache, or fallback behaviour — see [Batch prompt format](#batch-prompt-format). |


You cannot combine `--force` with `--force-update` (they are mutually exclusive).

<a id="batch-prompt-format"></a>
## Batch prompt format

`translate-docs` sends translatable segments to the active LLM provider in **batches** (grouped by `batchSize` / `maxBatchChars`). The `--prompt-format` flag only changes that batch's **wire format**; `PlaceholderHandler` tokens, markdown AST checks, SQLite cache keys, and per-segment fallback when batch parsing fails are unchanged.

| Mode                   | User message                                                           | Model reply                                                 |
|------------------------|------------------------------------------------------------------------|-------------------------------------------------------------|
| `xml`                  | Pseudo-XML: one `<seg id="N">…</seg>` per segment (with XML escaping). | Only `<t id="N">…</t>` blocks, one per segment index.       |
| `json-array` (default) | A JSON array of strings, one entry per segment in order.               | A JSON array of the **same length** (same order).           |
| `json-object`          | A JSON object `{"0":"…","1":"…",…}` keyed by segment index.            | A JSON object with the **same keys** and translated values. |

Some models follow one format more reliably than another, so try a different mode if a model frequently returns malformed batches or mismatched segment ids. `json-array` is the default because it is a common, simple format that models generally handle well.

The run header also prints `Batch prompt format: …` so you can confirm the active mode. JSON label files (`docusaurusCatalogDir`) and SVG file batches use the same setting when those steps run as part of `translate-docs` (or `sync`'s docs phase — `sync` does not expose this flag; it defaults to `json-array`).

