<a id="cli--ui-strings"></a>
# CLI — Cadenas de la interfaz de usuario

<a id="extract"></a>
### `extract`

**Sinopsis:** `ai-i18n-tools extract`

Actualiza `strings.json` a partir de literales `t("…")` / `i18n.t("…")`, descripción opcional `package.json` y entradas opcionales `englishName` de master agrupadas cuando `includeUiLanguageEnglishNames` está habilitado (consulta `ui.uiExtractor`; no lee `languagesManifestPath`). También regenera `ui-languages.json` en `languagesManifestPath`. Cuando `.html` / `.htm` se enumeran en `ui.uiExtractor.extensions`, también captura cadenas de marcador `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` de HTML. Requiere `ui.sourceRoots` no vacío. No llama a un LLM.

**Consulta también:** [Descripción general de las cadenas de interfaz de usuario](/guide/ui-strings/), [Aplicaciones HTML simples](/guide/ui-strings/plain-html)

---

<a id="mark-html"></a>
### `mark-html`

**Sinopsis:** `ai-i18n-tools mark-html [paths...] [--write]`

Inserta marcadores `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` sin formato en HTML para que el texto de origen se escriba una vez (en el propio elemento). Escanea los archivos/directorios/globs dados (predeterminado: `.html` / `.htm` en `ui.sourceRoots`). Ejecución en seco por defecto (informa los recuentos de adiciones por archivo y cualquier elemento de contenido mixto que necesite un `<span data-i18n>` manual); `--write` aplica los cambios. Idempotente, respeta `data-i18n-ignore` (omite el elemento y su subárbol), nunca toca elementos similares a código (`code`, `pre`, `kbd`, `samp`, `var`) o texto vacío/solo numérico, y nunca emite un marcador valorado. No llama a un LLM.

**Opciones clave:** `--write`

**Consulta también:** [Marcado de HTML para traducción](/guide/ui-strings/plain-html#marking-html-for-translation)

---

<a id="generate-ui-languages"></a>
### `generate-ui-languages`

**Sinopsis:** `ai-i18n-tools generate-ui-languages [--master <path>] [--dry-run]`

Escribe `ui-languages.json` en `languagesManifestPath` (por defecto `{ui.flatOutputDir}/ui-languages.json`) usando `sourceLocale` + `targetLocales` y el `data/ui-languages-complete.json` agrupado (o `--master`). Advierte y emite marcadores de posición `TODO` para los idiomas que faltan en el archivo maestro. Si tienes un manifiesto existente con valores `label` o `englishName` personalizados, se reemplazarán por los valores predeterminados del catálogo maestro; revisa y ajusta el archivo generado después.

**Opciones clave:** `--master`, `--dry-run`

---

<a id="translate-ui"></a>
### `translate-ui`

**Sinopsis:** `ai-i18n-tools translate-ui [-l <codes>] [--force] [--dry-run] [-j <n>]`

Traduce solo las cadenas de la interfaz de usuario (`strings.json` → JSON de idioma). Requiere `features.translateUIStrings`.

**Opciones clave:** `-l` / `--locale`, `--force`, `--dry-run`, `-j` / `--concurrency`

`-l` / `--locale`: idiomas de destino separados por comas (predeterminado: configuración `targetLocales` menos `sourceLocale`). `--force`: vuelve a traducir todas las entradas por idioma (ignora las traducciones existentes). `--dry-run`: sin escrituras, sin llamadas a la API.

---

<a id="sync-ui"></a>
### `sync-ui`

**Sinopsis:** `ai-i18n-tools sync-ui [-l <codes>] [--force] [--dry-run] [-j <n>]`

Extrae y luego traduce cadenas de interfaz de usuario (requiere `features.translateUIStrings`). Solo interfaz de usuario, sin documentación, SVG o `json[]`. Las mismas opciones de `-l`, `--force`, `--dry-run` y `-j` que `translate-ui`.

---

<a id="proofread-ui"></a>
### `proofread-ui`

**Sinopsis:** `ai-i18n-tools proofread-ui [-l <code>] [--chunk <n>] [--dry-run] [--json] [-j <n>]`

Ejecuta `extract` primero (requiere `features.translateUIStrings`) para que `strings.json` coincida con el origen, luego revisa con LLM las cadenas de interfaz de usuario del idioma de origen (ortografía, gramática). Las sugerencias de terminología provienen solo del CSV de `glossary.userGlossary` (mismo alcance que `translate-ui`, no `strings.json` / `uiGlossary`, por lo que el texto incorrecto no se refuerza como glosario). Utiliza el proveedor de LLM activo (su variable de entorno de clave API).

Sale con **1** en caso de fallo (falta de indicador de característica, fallo de extracción, catálogo faltante/inválido, clave API faltante o cuando todos los lotes fallan); sale con **0** cuando la ejecución se completa con éxito (los hallazgos son solo a modo de asesoramiento). Escribe `proofread-ui-results_<timestamp>.log` en `cacheDir` como un informe legible por humanos (resumen, problemas y filas de OK por cadena); el terminal imprime solo los recuentos de resumen y los problemas (no hay líneas `[ok]` por cadena). Imprime el nombre del archivo de registro en la última línea. Con `--json`, la salida de estilo humano va a stderr. Los enlaces usan `path:line` como el botón de enlace de las cadenas de interfaz de usuario del panel de control.

**Opciones clave:** `-l` / `--locale`, `--chunk` (predeterminado **50**), `--dry-run`, `--json`, `-j` / `--concurrency`

---

<a id="export-ui-xliff"></a>
### `export-ui-xliff`

**Sinopsis:** `ai-i18n-tools export-ui-xliff [-l <codes>] [-o <dir>] [--untranslated-only] [--dry-run]`

Exporta `strings.json` a XLIFF 2.0 (un `.xliff` por idioma de destino). Solo lectura; sin API.

**Opciones clave:** `-l` / `--locale`, `-o` / `--output-dir`, `--untranslated-only`, `--dry-run`

`-o` / `--output-dir`: directorio de salida (predeterminado: la misma carpeta que el catálogo). `--untranslated-only`: solo unidades a las que les falta una traducción para ese idioma.
