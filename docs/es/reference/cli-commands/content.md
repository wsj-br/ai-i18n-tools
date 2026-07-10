<a id="cli--other-content"></a>
# CLI — Otro contenido

<a id="translate-json"></a>
### `translate-json`

**Sinopsis:** `ai-i18n-tools translate-json [options]`

Traduce JSON anidado por `json[]` (requiere `features.translateJson`). Caché SQLite compartida.

**Opciones clave:** `-l`, `-p` / `--path`, `--dry-run`, `--force`, `--force-update`, `-b`, `--prompt-format`

**Ver también:** [JSON](/es/guide/json)

---

<a id="translate-svg"></a>
### `translate-svg`

**Sinopsis:** `ai-i18n-tools translate-svg [options]`

Traduce archivos SVG configurados en `config.svg` (separado de los documentos). Requiere `features.translateSVG`. Las mismas ideas de caché que los documentos; admite `--no-cache` para omitir lecturas/escrituras de SQLite para esa ejecución.

**Opciones clave:** `-j`, `-b`, `--force`, `--force-update`, `-p` / `--path`, `--dry-run`, `--no-cache`

**Ver también:** [Traducción de SVG](/es/guide/svg-translation/)
