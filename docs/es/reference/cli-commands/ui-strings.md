<a id="cli--ui-strings"></a>
# CLI — Cadenas de la interfaz de usuario

<a id="extract"></a>
### `extract`

**Sinopsis:** `ai-i18n-tools extract`

Actualiza `strings.json` a partir de literales `t("…")` / `i18n.t("…")`, descripción opcional `package.json` y entradas opcionales `englishName` de master agrupadas cuando `includeUiLanguageEnglishNames` está habilitado (consulta `ui.uiExtractor`; no lee `languagesManifestPath`). También regenera `ui-languages.json` en `languagesManifestPath`. Cuando `.html` / `.htm` se enumeran en `ui.uiExtractor.extensions`, también captura cadenas de marcador `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` de HTML. Requiere `ui.sourceRoots` no vacío. No llama a un LLM.

**Consulta también:** [Descripción general de las cadenas de interfaz de usuario](/es/guide/ui-strings/), [Aplicaciones HTML simples](/es/guide/ui-strings/plain-html)

---

<a id="migrate-intlayer"></a>
### `migrate-intlayer`

**Sinopsis:** `ai-i18n-tools migrate-intlayer [paths...] [--write] [--report <path>] [--content-glob <glob>] [--t-import <specifier>]`

Importa diccionarios de Intlayer `*.content.ts` en archivos de configuración regional planos y de `strings.json`, y reescribe los sitios de llamada simples de `useIntlayer` / `getIntlayer` a `t('English source')`. Ejecución en seco por defecto (el informe se sigue escribiendo). `--write` inicializa el catálogo y aplica reescrituras seguras. No llama a un LLM.

El informe es la entrega de todo lo que `--write` deja atrás, y termina con un **TODO paso a paso** que ordena el resto del trabajo: una llamada concreta de `t()` o JSX para cada sitio manual, la línea `import { t }`, los archivos de diccionario y los restos de `IntlayerProvider` para eliminar después, las cadenas de origen que necesitan `extract` y luego `translate-ui`, y un bootstrap en tiempo de ejecución de i18next para pegar sobre el módulo i18n de la aplicación. El control de configuración regional debe llamar a `i18n.changeLanguage` así como a `loadLocale`. `extract` escribe `ui-languages.json`, que importa dicho bootstrap. No edite `strings.json`, los archivos de configuración regional planos, ni `ui-languages.json` a mano.

**Opciones clave:** `--write`, `--report`, `--content-glob` (predeterminado `**/*.content.ts`), `--t-import`

**Véase también:** [Migración desde Intlayer](/es/guide/migrating-from-intlayer)

---

<a id="mark-html"></a>
### `mark-html`

**Sinopsis:** `ai-i18n-tools mark-html [paths...] [--write]`

Inserta marcadores `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` sin formato en HTML para que el texto de origen se escriba una vez (en el propio elemento). Escanea los archivos/directorios/globs dados (predeterminado: `.html` / `.htm` en `ui.sourceRoots`). Ejecución en seco por defecto (informa los recuentos de adiciones por archivo y cualquier elemento de contenido mixto que necesite un `<span data-i18n>` manual); `--write` aplica los cambios. Idempotente, respeta `data-i18n-ignore` (omite el elemento y su subárbol), nunca toca elementos similares a código (`code`, `pre`, `kbd`, `samp`, `var`) o texto vacío/solo numérico, y nunca emite un marcador valorado. No llama a un LLM.

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

`-l` / `--locale`: configuración regional de destino separada por comas (predeterminado: `targetLocales` menos `sourceLocale`). `--force`: volver a traducir todas las entradas por configuración regional (ignorar las traducciones existentes). `--dry-run`: sin escrituras, sin llamadas a la API. `-j` paraleliza las **configuraciones regionales**; dentro de cada configuración regional, la configuración `uiBatchConcurrency` (predeterminado **2**) paraleliza los lotes de LLM (fragmentos de 50 cadenas, luego grupos plurales). No hay un indicador de CLI para `uiBatchConcurrency`.

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

Devuelve **1** en caso de error (feature flag faltante, error de extracción, catálogo ausente o no válido, clave de API faltante, o cuando fallan todos los lotes); y **0** cuando la ejecución finaliza correctamente (los hallazgos son solo informativos). Escribe `proofread-ui-results_<timestamp>.log` en `cacheDir` como un informe legible (resumen, incidencias, filas no revisadas y filas con estado OK por cadena); la terminal muestra solo los recuentos del resumen y las incidencias (sin líneas `[ok]` por cadena). Si un lote falla, o si la respuesta del modelo es más corta que el lote y no contiene un `index` utilizable en cada posición, esas cadenas se cuentan como no revisadas. Sus incidencias se descartan para evitar que una matriz más corta se aplique a las cadenas incorrectas. Muestra el nombre del archivo de registro en la última línea. Con `--json`, la salida en formato legible se dirige a stderr. Los enlaces utilizan `path:line`, al igual que el botón de enlace de cadenas en la interfaz del panel.

**Opciones clave:** `-l` / `--locale`, `--chunk` (predeterminado **50**), `--dry-run`, `--json`, `-j` / `--concurrency`

---

<a id="export-ui-xliff"></a>
### `export-ui-xliff`

**Sinopsis:** `ai-i18n-tools export-ui-xliff [-l <codes>] [-o <dir>] [--untranslated-only] [--dry-run]`

Exporta `strings.json` a XLIFF 2.0 (un `.xliff` por idioma de destino). Solo lectura; sin API.

**Opciones clave:** `-l` / `--locale`, `-o` / `--output-dir`, `--untranslated-only`, `--dry-run`

`-o` / `--output-dir`: directorio de salida (predeterminado: la misma carpeta que el catálogo). `--untranslated-only`: solo unidades a las que les falta una traducción para ese idioma.
