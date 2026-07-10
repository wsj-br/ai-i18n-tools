<a id="cli--other-content"></a>
# CLI — Other content

<a id="translate-json"></a>
### `translate-json`

**Synopsis:** `ai-i18n-tools translate-json [options]`

Translate nested JSON per `json[]` (requires `features.translateJson`). Shared SQLite cache.

**Key options:** `-l`, `-p` / `--path`, `--dry-run`, `--force`, `--force-update`, `-b`, `--prompt-format`

**See also:** [JSON](/guide/json)

---

<a id="translate-svg"></a>
### `translate-svg`

**Synopsis:** `ai-i18n-tools translate-svg [options]`

Translate SVG files configured in `config.svg` (separate from docs). Requires `features.translateSVG`. Same cache ideas as docs; supports `--no-cache` to skip SQLite reads/writes for that run.

**Key options:** `-j`, `-b`, `--force`, `--force-update`, `-p` / `--path`, `--dry-run`, `--no-cache`

**See also:** [SVG translation](/guide/svg-translation/)
