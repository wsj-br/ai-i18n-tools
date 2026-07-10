<a id="cli--workflows--status"></a>
# CLI — Flujos de trabajo y estado

<a id="sync"></a>
### `sync`

**Sinopsis:** `ai-i18n-tools sync [options]`

Extraer (si está habilitado), luego traducción de la IU, luego `translate-svg` cuando `features.translateSVG` y `config.svg` están configurados, luego traducción de la documentación, luego `translate-json` cuando `features.translateJson` y `json[]` están configurados, a menos que se omita con `--no-ui`, `--no-svg`, `--no-docs` o `--no-json`.

**Opciones clave:** `-l`, `-p` / `-f`, `--dry-run`, `-j`, `-b`, `--force`, `--force-update`, `--no-ui`, `--no-svg`, `--no-docs`, `--no-json`

`--force` se reenvía a los pasos de IU y SVG, así como a docs/JSON; `--force-update` se aplica a docs, JSON y SVG (no a la IU). La fase de docs también reenvía `--emphasis-placeholders` y `--debug-failed` (mismo significado que `translate-docs`). `--prompt-format` no es un indicador de `sync`; los pasos de docs y JSON usan el valor predeterminado incorporado (`json-array`).

---

<a id="status"></a>
### `status`

**Sinopsis:** `ai-i18n-tools status [--max-columns <n>]`

Cuando `features.translateUIStrings` está activado, imprime la cobertura de la IU por configuración regional (`Translated` / `Missing` / `Total`). Luego imprime el estado de la traducción de markdown por archivo × configuración regional (sin filtro `--locale`; las configuraciones regionales provienen de la configuración). Cuando `features.translateJson` está activado y `json[]` está configurado, también imprime el estado del paquete JSON por bloque. Las listas de configuraciones regionales grandes se dividen en tablas repetidas de hasta `n` columnas de configuración regional (predeterminado **9**) para que las líneas permanezcan estrechas en el terminal.

**Opciones clave:** `--max-columns`

---

<a id="statistics"></a>
### `statistics`

**Sinopsis:** `ai-i18n-tools statistics [--max-columns <n>]`

Imprime las estadísticas de la caché de documentación y `strings.json` (los mismos agregados que Panel de traducción → Estadísticas). `--max-columns`: columnas de configuración regional máximas por modelo × tabla de configuración regional (predeterminado **6**).

**Opciones clave:** `--max-columns`

**Ver también:** [Estadísticas del panel](/guide/translation-dashboard/statistics)
