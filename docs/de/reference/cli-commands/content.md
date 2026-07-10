<a id="cli--other-content"></a>
# CLI – Weiterer Inhalt

<a id="translate-json"></a>
### `translate-json`

**Synopsis:** `ai-i18n-tools translate-json [options]`

Übersetzt verschachteltes JSON pro `json[]` (erfordert `features.translateJson`). Gemeinsamer SQLite-Cache.

**Wichtige Optionen:** `-l`, `-p` / `--path`, `--dry-run`, `--force`, `--force-update`, `-b`, `--prompt-format`

**Siehe auch:** [JSON](/guide/json)

---

<a id="translate-svg"></a>
### `translate-svg`

**Synopsis:** `ai-i18n-tools translate-svg [options]`

Übersetzt in `config.svg` konfigurierte SVG-Dateien (getrennt von den Dokumenten). Erfordert `features.translateSVG`. Gleiche Cache-Konzepte wie bei Dokumenten; unterstützt `--no-cache`, um SQLite-Lese-/Schreibvorgänge für diesen Durchlauf zu überspringen.

**Wichtige Optionen:** `-j`, `-b`, `--force`, `--force-update`, `-p` / `--path`, `--dry-run`, `--no-cache`

**Siehe auch:** [SVG-Übersetzung](/guide/svg-translation/)
