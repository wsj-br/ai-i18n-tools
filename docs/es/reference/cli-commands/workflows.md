<a id="cli--workflows--reporting"></a>
# CLI — Flujos de trabajo e informes

<a id="sync"></a>
### `sync`

**Sinopsis:** `ai-i18n-tools sync [options]`

Extraer (si está habilitado), luego traducción de la IU, luego `translate-svg` cuando `features.translateSVG` y `config.svg` están configurados, luego traducción de la documentación, luego `translate-json` cuando `features.translateJson` y `json[]` están configurados, a menos que se omita con `--no-ui`, `--no-svg`, `--no-docs` o `--no-json`.

**Opciones clave:** `-l`, `-p` / `-f`, `--dry-run`, `-j`, `-b`, `--force`, `--force-update`, `--check-cache`, `--no-ui`, `--no-svg`, `--no-docs`, `--no-json`

`--force` se reenvía a los pasos de IU y SVG, así como a docs/JSON; `--force-update` se aplica a docs, JSON y SVG (no a la IU). `--check-cache` se reenvía a docs, JSON y SVG: revalida los segmentos almacenados en caché para las configuraciones regionales con un script nativo forzado, incluso cuando el seguimiento de archivos se omitiría. La fase de documentos también reenvía `--emphasis-placeholders` (mismo significado que `translate-docs`). El `--debug-failed` global escribe registros `FAILED-TRANSLATION` en `cacheDir` para cada intento de modelo descartado (incluidas las alternativas de script SVG/docs), no solo cuando todos los modelos de la cadena fallan. `--prompt-format` no es un indicador `sync`; los pasos de docs y JSON usan el valor predeterminado incorporado (`json-array`).

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

**Véase también:** [Estadísticas del panel](/es/guide/translation-dashboard/statistics)

---

<a id="usage"></a>
### `usage`

**Sinopsis:** `ai-i18n-tools usage [--since <when>] [--provider <name>] [--model <id>] [--operation <name>] [-l <code>] [--outcome accepted|discarded] [--clear] [--older-than <when>] [--dry-run]`

Imprime las estadísticas registradas de llamadas a la API del modelo (llamadas, tokens y un único coste en USD). El coste es el `usage.cost` del proveedor cuando está presente; de lo contrario, es la cantidad de `providers.<name>.modelPricing` o el `providers.<name>.pricing` predeterminado de todo el proveedor (almacenado en llamadas nuevas; aplicado en el momento del informe para filas antiguas que no tienen un coste almacenado). Los mismos agregados que en Panel de traducción → Uso y costes. Las filas de detalles con más de siete días naturales UTC se acumulan en `api_totals` mensuales; los informes combinan ambas tablas. `--since` acepta `YYYY-MM-DD`, una duración (`30m`, `1h`, `6h`, `12h`, `24h`, `7d`, `30d`) o un período de mes natural (`1mo`, `2mo`, `3mo`). `--clear` elimina las filas de detalles y los totales mensuales (`--older-than` es `1mo`, `2mo`, `3mo`, `6mo`, `1y` o `all`; `--dry-run` informa el recuento sin eliminar).

**Opciones clave:** `--since`, `--provider`, `--model`, `--operation`, `-l` / `--locale`, `--outcome`, `--clear`, `--older-than`, `--dry-run`

**Véase también:** [Uso y costos del panel](/es/guide/translation-dashboard/usage)
