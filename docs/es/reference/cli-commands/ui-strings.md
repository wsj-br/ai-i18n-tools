<a id="cli--ui-strings"></a>
# CLI — Cadenas de la interfaz de usuario

<a id="extract"></a>
### `extract`

**Sinopsis:** `ai-i18n-tools extract`

Actualiza `strings.json` a partir de los literales `t("…")` / `i18n.t("…")`, la descripción opcional `package.json` y las entradas opcionales `englishName` del maestro empaquetado cuando `includeUiLanguageEnglishNames` está habilitado (consulta `ui.uiExtractor`; no lee `languagesManifestPath`). También regenera el `ui-languages.json` de cada bloque. Cuando `.html` / `.htm` aparecen en `ui.uiExtractor.extensions`, también captura las cadenas de marcadores `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` del HTML. Recorre cada bloque `ui` que tenga `sourceRoots`. `--ui-block` limita la ejecución a un solo bloque (índice, descripción o ruta `stringsJson`). No llama a ningún LLM.

**Consulta también:** [Descripción general de las cadenas de interfaz de usuario](/es/guide/ui-strings/), [Aplicaciones HTML simples](/es/guide/ui-strings/plain-html)

---

<a id="migrate-intlayer"></a>
### `migrate-intlayer`

**Sinopsis:** `ai-i18n-tools migrate-intlayer [paths...] [--write] [--report <path>] [--content-glob <glob>] [--t-import <specifier>]`

Importar diccionarios `*.content.ts` de Intlayer en `strings.json` y archivos de localización planos, y reescribir sitios de llamada simples de `useIntlayer` / `getIntlayer` a `t('source string')`. La cadena está escrita en `sourceLocale`, que puede ser cualquier idioma. Ejecución en seco por defecto (el informe se sigue escribiendo). `--write` inicializa el catálogo y aplica reescrituras seguras. No llama a un LLM.

El informe es la entrega de todo lo que `--write` deja atrás, y termina con un **TODO paso a paso** que ordena el resto del trabajo: una llamada concreta de `t()` o JSX para cada sitio manual, la línea `import { t }`, los archivos de diccionario y los restos de `IntlayerProvider` para eliminar después, las cadenas de origen que necesitan `extract` y luego `translate-ui`, y un bootstrap en tiempo de ejecución de i18next para pegar sobre el módulo i18n de la aplicación. El control de configuración regional debe llamar a `i18n.changeLanguage` así como a `loadLocale`. `extract` escribe `ui-languages.json`, que importa dicho bootstrap. No edite `strings.json`, los archivos de configuración regional planos, ni `ui-languages.json` a mano.

**Opciones clave:** `--write`, `--report`, `--content-glob` (predeterminado `**/*.content.ts`), `--t-import`

**Véase también:** [Migración desde Intlayer](/es/guide/migrating-from-intlayer)

---

<a id="translate-intlayer"></a>
### `translate-intlayer`

**Sinopsis:** `ai-i18n-tools translate-intlayer [paths...] [-l <codes>] [--ui-block <selector>] [--dry-run] [-j <n>]`

Traduce las hojas de localización faltantes y obsoletas dentro de los diccionarios `*.content.ts` de Intlayer in situ, manteniendo los diccionarios como la fuente de verdad. A diferencia de [`migrate-intlayer`](#migrate-intlayer), esto no saca la aplicación de Intlayer; solo rellena las hojas `t({ … })`. Úsalo cuando quieras mantener Intlayer en tiempo de ejecución y usar ai-i18n-tools como motor de traducción.

Extrae cada hoja `t({ … })`, alimenta el `strings.json` del bloque de interfaz de usuario elegido con el texto de origen, ejecuta el mismo motor que [`translate-ui`](#translate-ui) (selección de proveedor, glosario, contexto de traducción y reserva de modelo), luego vuelve a escribir las nuevas cadenas por configuración regional en cada objeto `t({ … })`. Las ediciones son precisas: solo cambian las líneas de configuración regional faltantes o obsoletas, por lo que se conservan el formato y los comentarios. Los marcadores de posición `{token}` de Intlayer realizan un viaje de ida y vuelta a <code v-pre>{{token}}</code> para su traducción y regreso.

Una hoja+localización se traduce cuando la localización está ausente de la hoja (faltante), o cuando el texto de la localización de origen cambió desde la última ejecución para esa localización (obsoleta). La obsolescencia se rastrea en `cacheDir`, por lo que editar esa cadena de origen vuelve a traducir esa hoja en la siguiente ejecución. El idioma de origen es `sourceLocale` y puede ser cualquier idioma. `--dry-run` informa los recuentos de faltantes/obsoletas sin llamar a un LLM ni escribir nada. Requiere `features.translateUIStrings` y el `stringsJson` del bloque de UI (igual que `translate-ui`).

**Opciones clave:** `-l` / `--locale`, `--ui-block`, `--dry-run`, `-j` / `--concurrency`

`[paths...]`: archivos/directorios/globs a escanear (predeterminado: el `sourceRoots` del bloque). `-l` / `--locale`: configuraciones regionales de destino separadas por comas para completar (predeterminado: el `targetLocales` configurado del bloque). `--ui-block`: índice de base cero, descripción o ruta de `stringsJson` (predeterminado: bloque 0). `-j` paraleliza las configuraciones regionales.

**Véase también:** [migrate-intlayer](#migrate-intlayer), [Migración desde Intlayer](/es/guide/migrating-from-intlayer)

---

<a id="mark-html"></a>
### `mark-html`

**Sinopsis:** `ai-i18n-tools mark-html [paths...] [--write]`

Inserta marcadores simples `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` en el HTML para que el texto de origen se escriba una sola vez (en el propio elemento). Escanea los archivos/directorios/patrones glob indicados (por defecto: `.html` / `.htm` bajo el `sourceRoots` de cada bloque). Ejecución de prueba por defecto (informa de los recuentos de adiciones por archivo y de cualquier elemento de contenido mixto que requiera un `<span data-i18n>` manual); `--write` aplica los cambios. Idempotente, respeta `data-i18n-ignore` (omite el elemento y su subárbol), nunca toca elementos de tipo código (`code`, `pre`, `kbd`, `samp`, `var`) ni texto vacío o solo numérico, y nunca emite un marcador con valor. No llama a ningún LLM.

**Opciones clave:** `--write`

**Consulta también:** [Marcado de HTML para traducción](/es/guide/ui-strings/plain-html#marking-html-for-translation)

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

`-l` / `--locale`: configuraciones regionales de destino separadas por comas (predeterminado: la configuración `targetLocales` menos `sourceLocale`). `--force`: volver a traducir todas las entradas por configuración regional (ignorar las traducciones existentes). `--dry-run`: sin escrituras, sin llamadas a la API. `-j` paraleliza las **configuraciones regionales**; dentro de cada configuración regional, la configuración `uiBatchConcurrency` (predeterminado **2**) paraleliza los lotes de LLM (fragmentos de 50 cadenas, luego grupos plurales). No hay un indicador de CLI para `uiBatchConcurrency`.

---

<a id="sync-ui"></a>
### `sync-ui`

**Sinopsis:** `ai-i18n-tools sync-ui [-l <codes>] [--force] [--dry-run] [-j <n>]`

Extrae y luego traduce cadenas de interfaz de usuario (requiere `features.translateUIStrings`). Solo interfaz de usuario, sin documentación, SVG o `json[]`. Las mismas opciones de `-l`, `--force`, `--dry-run` y `-j` que `translate-ui`.

---

<a id="proofread-ui"></a>
### `proofread-ui`

**Sinopsis:** `ai-i18n-tools proofread-ui [-l <code>] [--chunk <n>] [--dry-run] [--json] [-j <n>]`

Ejecuta `extract` primero (requiere `features.translateUIStrings`) para que cada catálogo seleccionado coincida con el origen, luego realiza una revisión de LLM de las cadenas de interfaz de usuario de la configuración regional de origen (ortografía, gramática). `--ui-block` limita la extracción y revisión a un bloque. Las sugerencias de terminología provienen únicamente del CSV de `glossary.userGlossary` (mismo alcance que `translate-ui` — los catálogos de la interfaz de usuario no se retroalimentan, por lo que el texto deficiente no se refuerza como glosario). Utiliza el proveedor de LLM activo (su variable de entorno de clave de API).

Devuelve **1** en caso de error (feature flag faltante, error de extracción, catálogo ausente o no válido, clave de API faltante, o cuando fallan todos los lotes); y **0** cuando la ejecución finaliza correctamente (los hallazgos son solo informativos). Escribe `proofread-ui-results_<timestamp>.log` en `cacheDir` como un informe legible (resumen, incidencias, filas no revisadas y filas con estado OK por cadena); la terminal muestra solo los recuentos del resumen y las incidencias (sin líneas `[ok]` por cadena). Si un lote falla, o si la respuesta del modelo es más corta que el lote y no contiene un `index` utilizable en cada posición, esas cadenas se cuentan como no revisadas. Sus incidencias se descartan para evitar que una matriz más corta se aplique a las cadenas incorrectas. Muestra el nombre del archivo de registro en la última línea. Con `--json`, la salida en formato legible se dirige a stderr. Los enlaces utilizan `path:line`, al igual que el botón de enlace de cadenas en la interfaz del panel.

**Opciones clave:** `-l` / `--locale`, `--chunk` (predeterminado **50**), `--dry-run`, `--json`, `-j` / `--concurrency`

---

<a id="export-ui-xliff"></a>
### `export-ui-xliff`

**Sinopsis:** `ai-i18n-tools export-ui-xliff [-l <codes>] [-o <dir>] [--untranslated-only] [--dry-run]`

Exporta `strings.json` a XLIFF 2.0 (un `.xliff` por idioma de destino). Solo lectura; sin API.

**Opciones clave:** `-l` / `--locale`, `-o` / `--output-dir`, `--untranslated-only`, `--dry-run`

`-o` / `--output-dir`: directorio de salida (predeterminado: la misma carpeta que el catálogo). `--untranslated-only`: solo unidades a las que les falta una traducción para ese idioma.
