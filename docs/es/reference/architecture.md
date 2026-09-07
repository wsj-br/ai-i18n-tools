<a id="architecture"></a>
# Arquitectura

<a id="architecture-overview"></a>
## Visión general de la arquitectura

El código base está organizado en cuatro capas. Utilice esta sección para el modelo mental; abra el [árbol de origen](#source-tree) cuando necesite detalles a nivel de archivo.

<a id="how-a-sync-run-fits-together"></a>
### Cómo encaja una ejecución de `sync`

`sync` (y los comandos de traducción individuales) ejecutan las características habilitadas en orden:

| Paso | Comando | Qué hace |
| --- | --- | --- |
| 1 | `extract` → `translate-ui` | Escanear fuentes de la interfaz de usuario → actualizar `strings.json` → rellenar JSON de configuración regional plana (`de.json`, …) |
| 2 | `translate-svg` *(opcional)* | Traducir texto SVG bajo `config.svg` |
| 3 | `translate-docs` | Traducir páginas de markdown, MDX, `.astro`; JSON de catálogo de Docusaurus; `_meta` / diccionario `.ts` de Nextra; catálogo de temas de VitePress |
| 4 | `translate-json` *(opcional)* | Traducir hojas JSON anidadas bajo `json[]` |

Cada pipeline sigue el mismo bucle central: **extraer segmentos → proteger sintaxis → agrupar → buscar en caché o llamar a LLM → escribir salida**. Los servicios compartidos en el medio —configuración, marcadores de posición, caché, glosario, `LlmClient`— se describen en [Infraestructura compartida](#shared-infrastructure).

<a id="module-map"></a>
### Mapa de módulos

| Capa | Carpeta | Rol |
| --- | --- | --- |
| **Entrada** | `src/cli/` | Comandos CLI: `init`, `extract`, `mark-html`, `translate-ui`, `translate-docs`, `translate-json`, `translate-svg`, `sync`, `status`, `dashboard`, … |
| **Pipelines** | `src/extractors/` | Extracción de segmentos de JS/TS, marcadores HTML, markdown, JSON, SVG, `.astro` |
| | `src/processors/` | Protección de marcadores de posición, procesamiento por lotes, validación, reescritura de enlaces |
| **Compartido** | `src/core/` | Configuración, tipos, caché SQLite, prompts, rutas de salida, utilidades de configuración regional |
| | `src/api/` | `LlmClient` — cliente de chat agnóstico al proveedor (Vercel AI SDK) con fallback de modelo |
| | `src/glossary/` | Carga de glosario y sugerencias de términos para prompts |
| | `src/utils/` | Registrador, hashing, analizador de ignorados, tablas de ancho de visualización, cargador `.env` |
| **Tiempo de ejecución de su aplicación** | `src/runtime/` | Ayudantes i18next y utilidades de visualización — exportados como `'ai-i18n-tools/runtime'` ([Ayudantes de tiempo de ejecución](/es/guide/runtime-helpers)) |
| **Interfaz de usuario de la herramienta** *(dogfooding)* | `src/i18n/`, `src/dashboard-app/`, `src/server/` | Localiza la propia CLI y el Panel de traducción de este paquete — separado del contenido de su proyecto ([Autolocalización](#self-localization-tool-ui)) |

Todo lo destinado a uso programático se reexporta desde `src/index.ts` ([API programática](/es/reference/programmatic-api)).

<a id="pipeline-summaries"></a>
### Resúmenes de pipelines

| Canalización | Sección | Entrada → salida |
| --- | --- | --- |
| Cadenas de interfaz de usuario | [Elementos internos de las cadenas de interfaz de usuario](#ui-strings-internals) | Archivos fuente → `strings.json` → `{locale}.json` plano |
| Documentos | [Elementos internos de los documentos](#documents-internals) | Markdown / MDX / `.astro` / Docusaurus JSON → archivos por configuración regional en `docs[].outputDir` |
| Paquetes JSON | [Elementos internos de JSON](#json-internals) | JSON anidado en `json[]` → archivos JSON por configuración regional |
| SVG | [Elementos internos de los documentos — extractores](#extractors) | Archivos SVG en `config.svg` → copias SVG traducidas |

---

<a id="ui-strings-internals"></a>
## Cadenas de interfaz de usuario internas

| Paso | Componente | Resultado |
| --- | --- | --- |
| 1 | Archivos fuente (JS/TS; `.astro` / `.html` opcional) | Archivos en disco |
| 2 | `UIStringExtractor` (i18next-scanner; `.astro` a través de `ui-string-babel.ts`) | Segmentos con clave de hash MD5 |
| 3 | `strings.json` | Catálogo maestro: `{ hash: { source, translated, models?, locations? } }` |
| 4 | `LlmClient.translateUIBatch()` | Matriz JSON de cadenas de origen → traducciones (+ ID de modelo por lote) |
| 5 | `de.json`, `pt-BR.json`, … | Mapas planos: cadena de origen → traducción (sin metadatos de modelo) |

<a id="uistringextractor"></a>
### `UIStringExtractor`

Utiliza el `i18next-scanner` de `Parser.parseFuncFromString` para encontrar llamadas a `t("literal")` y `i18n.t("literal")` en archivos JS/TS. Para fuentes `.astro` (cuando se enumeran en `ui.uiExtractor.extensions`), `ui-string-babel.ts` analiza el frontmatter y los bloques de plantilla `{expression}` con `@babel/parser` y aplica las mismas reglas de `funcNames`. Los nombres de las funciones y las extensiones de archivo son configurables a través de `ui.uiExtractor` (`ui.reactExtractor` es un alias compatible). `extract` **también fusiona entradas no escaneadas en el mismo catálogo:** el `package.json` del proyecto `description` cuando `includePackageDescription` está habilitado (predeterminado), y cada `englishName` del catálogo maestro de ui-languages incluido (construido a partir de `sourceLocale` + `targetLocales`) cuando `includeUiLanguageEnglishNames` es `true` (las cadenas ya encontradas en el origen tienen prioridad; no lee `languagesManifestPath`). `extract` también regenera `ui-languages.json` en `languagesManifestPath`. Los hashes de segmento son los **primeros 8 caracteres hexadecimales MD5** de la cadena de origen recortada; estos se convierten en las claves en `strings.json`.

Para fuentes de `.html` / `.htm` (cuando se listan en `ui.uiExtractor.extensions`), `extract` enruta el archivo a través de `html-i18n-marks.ts`, que escanea los atributos de marcador de `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` (configurables mediante `ui.uiExtractor.htmlI18nAttributes`). Un marcador simple toma su texto fuente del propio `textContent` / `title` / `placeholder` del elemento; un marcador con valor (`data-i18n="Key"`) usa el valor. El mismo módulo potencia el comando `mark-html`, que inserta marcadores simples automáticamente. Los archivos HTML nunca llegan a los pases de Babel / i18next-scanner.

Los sitios SSG de Astro sencillos pueden omitir i18next: cargar `{locale}.json` plano en el momento de la compilación y resolver `t('English')` por clave de texto de origen (consulte `examples/astro-website/src/i18n/t.ts` y [cadenas de interfaz de usuario — sitio web de Astro](/es/guide/ui-strings/astro-website#astro-website-plain-astro-not-starlight)).

Las aplicaciones HTML sencillas siguen el mismo modelo de catálogo con atributos de marcador en lugar de llamadas a `t()`; consulte [Marcado de HTML para traducción](/es/guide/ui-strings/plain-html#marking-html-for-translation).

<a id="stringsjson"></a>
### `strings.json`

El catálogo maestro tiene la siguiente estructura:

```json
{
  "a1b2c3d4": {
    "source": "The English string",
    "translated": {
      "de": "Der deutsche Text",
      "pt-BR": "O texto em português"
    },
    "models": {
      "de": "anthropic/claude-3.5-haiku",
      "pt-BR": "openai/gpt-4o"
    },
    "locations": [{ "file": "src/app/page.tsx", "line": 51 }]
  }
}
```

`models` (opcional) — por configuración regional, qué modelo produjo esa traducción después de la última ejecución exitosa de `translate-ui` para esa configuración regional (o `user-edited` si el texto se guardó desde el Panel de traducción). `locations` (opcional) — dónde `extract` encontró la cadena (escáner + línea de descripción del paquete; las cadenas `englishName` del maestro incluido pueden omitir `locations`).

`extract` agrega nuevas claves y conserva los datos `translated` / `models` existentes para las claves que aún están presentes en el escaneo (literales del escáner, descripción opcional, `englishName` maestro incluido opcional). `translate-ui` completa las entradas `translated` faltantes, actualiza `models` para las configuraciones regionales que traduce y escribe archivos de configuración regional planos.

**Manifiesto** de `ui-languages.json` — Matriz JSON de `{ code, label, englishName, direction }` (BCP-47 `code`, UI `label`, referencia `englishName`, `"ltr"` o `"rtl"`). Use `generate-ui-languages` o `extract` para construir un archivo de proyecto a partir de `sourceLocale` + `targetLocales` y el `data/ui-languages-complete.json` maestro incluido.

<a id="flat-locale-files"></a>
### Archivos de configuración regional planos

Cada localización objetivo recibe un archivo JSON plano (`de.json`) que asocia cadena fuente → traducción (sin campo `models`):

```json
{
  "The English string": "Der deutsche Text",
  "Save": "Speichern"
}
```

i18next carga estos archivos como paquetes de recursos y busca traducciones mediante la cadena fuente (modelo de clave como valor por defecto).

<a id="ui-translation-prompts"></a>
### Mensajes de traducción de interfaz

`buildUIPromptMessages` construye mensajes del sistema y del usuario que:

- Identifique los idiomas de origen y destino (por nombre mostrado en `localeDisplayNames` o `ui-languages.json`).
- Envíe un array JSON de cadenas y solicite un array JSON de traducciones a cambio.
- Incluya sugerencias del glosario cuando estén disponibles.

`LlmClient.translateUIBatch` prueba cada modelo en orden, recurriendo a errores de análisis o de red. La CLI construye esa lista por configuración regional de destino a partir de `localeModels`, `uiModels` opcional y `translationModels` (consulta [Proveedores y modelos](/es/guide/providers-and-models#model-fallback-chain)).

---

<a id="documents-internals"></a>
## Documentos internos

| Paso | Componente | Resultado |
| --- | --- | --- |
| 1 | Archivos Markdown / MDX / JSON / `.astro` (`translate-docs`) | Archivos fuente |
| 2 | `MarkdownExtractor` / `JsonExtractor` / `AstroTemplateExtractor` | `segments[]` — segmentos tipados con hash + contenido |
| 3 | `PlaceholderHandler` | Texto protegido: HTML, advertencias, anclas, MDX, URL, código en línea, énfasis enmascarado como tokens |
| 4 | `splitTranslatableIntoBatches` | `batches[]` — agrupado por recuento + límite de caracteres |
| 5 | Búsqueda de `TranslationCache` | Acierto de caché → omitir; fallo → `LlmClient.translateDocumentBatch` |
| 6 | `PlaceholderHandler.restoreAfterTranslation` | Texto final — marcadores de posición restaurados |
| 7 | `resolveDocumentationOutputPath` | Archivo de salida — diseño Docusaurus o diseño plano |

<a id="extractors"></a>
### Extractores

Todos los extractores extienden `BaseExtractor` e implementan `extract(content, filepath): Segment[]`.

- `MarkdownExtractor` - divide el markdown en segmentos tipados: `frontmatter`, `heading`, `paragraph`, `code`, `admonition`. El frontmatter YAML se clasifica como **no traducible** (`slug`, `id` y otras claves de enrutamiento permanecen estables). Los bloques `export ...` de nivel superior (por ejemplo, definiciones de componentes de React) se clasifican como segmentos `other` no traducibles junto con el manejo existente de `import ...`. Los bloques de varias líneas que comienzan con una etiqueta JSX en mayúsculas (por ejemplo, un bloque `<Tabs>`) se clasifican como párrafos traducibles. Los segmentos no traducibles (bloques de código, HTML sin formato) se conservan textualmente.
- `AstroTemplateExtractor` - analizar y reemplazar para páginas de marketing `.astro` (`translate-docs` a través de `translateAstroFile` en `doc-translate.ts`). Extrae nodos de texto HTML orientados al usuario y atributos traducibles (`alt`, `title`, `aria-label`, `placeholder`), además de literales de cadena dentro de bloques de plantilla `{expression}` cuando están orientados al usuario. Omite TypeScript de frontmatter, `<script>`, `<style>`, valores de atributos/claves protegidos y literales dentro de `t('…')`. El reensamblaje ajusta las importaciones relativas cuando las rutas de salida son más profundas (por ejemplo, `src/pages/de/index.astro`). Consulte [Páginas del sitio web de Astro](/es/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace).
- `JsonExtractor` - extrae valores de cadena de archivos de etiquetas JSON de Docusaurus (catálogos de interfaz de usuario de Docusaurus, no cuerpo MDX).
- `SvgExtractor` - extrae contenido `<text>`, `<title>` y `<desc>` de SVG (utilizado por `translate-svg` para archivos bajo `config.svg`, no por `translate-docs`).
- `html-i18n-marks.ts`: un escáner de etiquetas HTML enfocado utilizado por `extract` para fuentes de `.html` / `.htm` y por el comando `mark-html`. `collectHtmlI18nStrings` / `collectHtmlI18nLocations` leen los atributos de marcador `data-i18n*` (marcador simple → `textContent` / `title` / `placeholder` del elemento; marcador con valor → el valor), y `markHtmlContent` inserta marcadores simples en elementos de texto hoja / título / marcador de posición (idempotente, respeta `data-i18n-ignore`, omite elementos similares a código y de contenido mixto). El ayudante compartido `normalizeI18nText` mantiene las claves en tiempo de compilación idénticas al tiempo de ejecución del navegador.

<a id="astro-hybrid-sites-ui--page-html"></a>
### Sitios híbridos de Astro (interfaz de usuario + HTML de página)

Las aplicaciones de Astro plano a menudo habilitan **ambas** cadenas de interfaz de usuario y documentos en una configuración (referencia: `examples/astro-website/`):

| Capa | Mecanismo | Salida |
| --- | --- | --- |
| HTML de plantilla | `AstroTemplateExtractor` + `translate-docs` | `.astro` por configuración regional en `docs[].outputDir` |
| Frontmatter / `t('…')` | `ui-string-babel.ts` + `extract` + `translate-ui` | `public/locales/{locale}.json` plano (texto fuente en inglés como clave) |

El comando `sync` ejecuta los pasos habilitados en orden: **extraer** y luego **traducir-interfaz de usuario** (cuando `features.translateUIStrings`) → opcional **traducir-svg** → **traducir-documentos** → opcional **traducir-json** (a menos que se omita con `--no-ui`, `--no-svg`, `--no-docs` o `--no-json`). La plantilla de inicialización `ui-astro-website` crea solo cadenas de interfaz de usuario; agregue `docs[]` y `features.translateDocs` para HTML de página.

<a id="heading-anchor-insertion-write-heading-ids-cli"></a>
### Inserción de anclas de encabezado (`write-heading-ids` CLI)

El comando `write-heading-ids` es un preprocesador **local y sin uso de LLM** para archivos markdown de documentación. Implementación: `src/cli/write-heading-ids.ts` coordina el descubrimiento de archivos; `src/markdown/write-heading-ids-core.ts` analiza las líneas e inserta anclajes.

Requiere una configuración válida con **al menos un bloque `docs[]`**. Para cada bloque, recopila archivos `.md` / `.mdx` en `contentPaths`, aplica las reglas `.translate-ignore` del proyecto (misma idea que la traducción de documentos) y, opcionalmente, se restringe a un subárbol con `--path` / `--file`. Cada archivo se transforma con `applyHeadingAnchorsToMarkdown`: para cada **encabezado ATX plano** (`# …` a `###### …`) fuera de los bloques de código cercados, se inserta una línea HTML vacía `<a id="slug"></a>` en la línea superior cuando falta o está desactualizada, o —con `--slug-style mdx-comment`— se añade un sufijo MDX de Docusaurus `{/* #slug */}` en la línea del encabezado. Los algoritmos de slug coinciden con los ecosistemas comunes —`github` (predeterminado), `bitbucket`, `gitlab`, `pymdown` (normalización Unicode opcional / banderas de codificación de porcentaje), `azure-devops`, más `mdx-comment` (slug de github + salida de comentarios MDX)— para que los ID de anclaje se mantengan consistentes con las herramientas existentes (doctoc, PyMdown, Docusaurus, etc.). `--dry-run` informa las ediciones que se realizarían sin escribir.

Este comando **no** se ejecuta dentro de `translate-docs` ni `sync`; ejecútelo explícitamente cuando desee IDs de fragmento estables en los archivos fuente antes de la traducción o publicación.

<a id="placeholder-protection"></a>
### Protección de marcadores de posición

Antes de la traducción, la sintaxis sensible se sustituye por tokens opacos para evitar corrupción por parte del LLM, aplicado en este orden (la restauración es el proceso inverso):

1. **Etiquetas y comentarios HTML** (`<strong>`, `<!-- ... -->`, etc.) - las etiquetas HTML en minúsculas de una lista de permitidos conocida se reemplazan con tokens ```{{HTM_N}}```. Las etiquetas JSX en mayúsculas (`<Highlight>`, `<Tabs>`, `</Tab>`) son manejadas por separado por la capa MDX (paso 4).
2. **Marcadores de advertencia** (`:::note`, `:::`) - solo el prefijo de la directiva en la línea de apertura se reemplaza con ```{{ADM_OPEN_N}}```; cualquier título en la misma línea se deja para que el modelo lo traduzca. Restaurado con el texto original exacto.
3. **Anclajes de documentos** (HTML `<a id="…">`, encabezado Docusaurus `{#…}`) - conservados textualmente.
4. **Constructos solo de MDX** (`src/processors/mdx-placeholders.ts`):
   - **Comentarios MDX** (`{/* … */}`, incluyendo el formato de ID de encabezado de Docusaurus `{/* #my-id */}`) reemplazados por ```{{MDX_N}}```.
   - **Etiquetas JSX en mayúsculas** (`<Highlight>`, `<Tabs>`, `<TabItem>`, `<TOCInline />`, `</Highlight>`) - conservadas como ```{{MDX_N}}``` con atributos de cadena traducibles (`label`, `tooltip`, `aria-label`) reescritos a ```{{JXA_N}}``` dentro de la etiqueta a menos que el nombre del atributo aparezca en `docs[].protectAttributes`; `label:` dentro de literales de objeto `<Tabs values={[ { label: '…' } ]}>` (omitibles a través de `docs[].protectKeys`) y `<TabItem value="…">` (cuando no existe un atributo `label`, omitiendo valores en minúsculas similares a slugs) también se extraen. Se añaden al segmento como líneas `||JXA_N: …||`, fusionadas de nuevo por `restoreMdx`.
   - **Expresiones de llave MDX** (`{frontMatter.title}`, <code v-pre>style={{…}}</code>) - coincidencia consciente de la profundidad, reemplazadas por ```{{MDX_N}}```.
5. **URL de Markdown** (`](url)`, `src="…"`) - restauradas de un mapa después de la traducción.
6. **Fragmentos de código en línea** (`` `code` ``) y **código en línea con negrita** (`**`code`**`) - se conservan.
7. **Énfasis en markdown** (opcional, habilitado automáticamente para configuraciones regionales CJK/RTL) - los delimitadores de énfasis se enmascaran.

Una vez que el modelo regresa, `translate-docs` restaura los mapas y valida el segmento: el mismo multiconjunto de tokens de doble llave debe estar presente, los tokens estructurales (<code v-pre>{{HTM_N}}</code>, marcadores de advertencia) deben mantener su subsecuencia ordenada (los tokens de contenido como <code v-pre>{{ILC_N}}</code> / <code v-pre>{{URL_N}}</code> / <code v-pre>{{SE}}</code> pueden moverse con el orden de las palabras), los tipos de etiquetas HTML restauradas deben coincidir con la fuente desprotegida, y cualquier identificador de doble llave restante ya debe haber existido en la fuente (por lo que los tokens inventados fallan). La instrucción del documento también pide a los modelos que copien cada token una vez, mantengan el orden de los tokens estructurales y no inventen nuevos envoltorios de doble llave; las comprobaciones mecánicas siguen siendo autorizadas.

La protección compartida de atributos/claves para las plantillas Astro y MDX JSX se implementa en `src/processors/expression-attribute-protection.ts` y se controla por bloque mediante `docs[].protectAttributes` y `docs[].protectKeys` (consulte [protectAttributes / protectKeys](/es/reference/configuration#protectattributes-protectkeys)).

<a id="cache-translationcache"></a>
### Caché (`TranslationCache`)

La base de datos SQLite (mediante `node:sqlite`) almacena filas indexadas por `(source_hash, locale)` con `translated_text`, `model`, `filepath`, `last_hit_at` y campos relacionados. El hash corresponde a los primeros 16 caracteres hexadecimales SHA-256 del contenido normalizado (espacios en blanco reducidos).

En cada ejecución, los segmentos se buscan por hash × configuración regional. Solo los fallos de caché van al LLM. Después de la traducción, `last_hit_at` se restablece para las filas de segmento en el ámbito de traducción actual que no fueron afectadas. Los aciertos de caché exitosos durante la traducción de documentos borran las filas `translation_failures` obsoletas para ese segmento. `cleanup` ejecuta `sync --force-update` primero, luego elimina las filas de segmento obsoletas (`last_hit_at` nulo / ruta de archivo vacía), poda las claves `file_tracking` cuando falta la ruta de origen resuelta en el disco (`doc-block:…`, `json-block:…`, `svg-files:…`, etc.), elimina las filas de traducción cuya ruta de archivo de metadatos apunta a un archivo que falta, poda las filas `translation_failures` huérfanas, poda las filas `markdown_source_issues` huérfanas cuya ruta de origen resuelta falta en el disco, y elimina las filas de caché para las configuraciones regionales ausentes de la configuración (`sourceLocale`, raíz `targetLocales`, y cualquier `docs[]` / `json[]` `targetLocales` por bloque; solo SQLite — use `purge-locale` para eliminar los archivos generados); no hace una copia de seguridad de `cache.db` a menos que se pase `--backup <path>`, lo que escribe una copia de seguridad en esa ruta primero.

El comando `translate-docs` también utiliza el **seguimiento de archivos** para que las fuentes sin cambios con salidas existentes y actualizadas puedan omitir el trabajo por completo. `--force-update` vuelve a ejecutar el procesamiento de archivos mientras sigue utilizando la caché de segmentos; `--force` borra el seguimiento de archivos y omite las lecturas de la caché de segmentos para la traducción de la API. Cuando cada modelo configurado falla la validación AST en un segmento de markdown, `translate-docs` puede dividir progresivamente el segmento y reintentar partes más pequeñas (`docs[].segmentSplitting.qualityRetrySplit`, activado por defecto). Consulte [Documentos — comportamiento y banderas de la caché](/es/guide/documents/cli-options#cache-behaviour-and-translate-docs-flags) para ver la tabla completa de banderas.

**Formato de solicitud por lotes:** `translate-docs --prompt-format` selecciona XML (`<seg>` / `<t>`) o formas de array/objeto JSON solo para `LlmClient.translateDocumentBatch`; la extracción, los marcadores de posición y la validación no cambian. Consulte [Formato de solicitud por lotes](/es/guide/documents/cli-options#batch-prompt-format).

<a id="output-path-resolution"></a>
### Resolución de ruta de salida

`resolveDocumentationOutputPath(config, cwd, locale, relPath, kind)` mapea una ruta relativa a la fuente a la ruta de salida:

- Estilo `nested` (predeterminado): `{outputDir}/{locale}/{relPath}` para Markdown.
- Estilo `doc-system`: bajo `docsRoot`, las salidas usan `{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}`; las rutas fuera de `docsRoot` recurren al diseño anidado. Alias: `docusaurus` (predeterminado `localeSubpath` = ruta del complemento Docusaurus), `astro-starlight` (`localeSubpath` vacío predeterminado), `vitepress` (igual que `doc-system` con `localeSubpath` vacío; conserva el uso de mayúsculas y minúsculas de la carpeta BCP-47).
- Estilo `flat`: `{outputDir}/{stem}.{locale}{extension}`. Cuando `flatPreserveRelativeDir` es `true`, los subdirectorios de origen se mantienen bajo `outputDir`.
- **Personalizado** `pathTemplate`: cualquier diseño de Markdown que use `{outputDir}`, `{locale}`, `{LOCALE}`, `{relPath}`, `{stem}`, `{basename}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}`.
- **Personalizado** `jsonPathTemplate`: diseño personalizado separado para archivos JSON de etiquetas, usando los mismos marcadores de posición.
- `linkRewriteDocsRoot` ayuda al reescritor de enlaces planos a calcular los prefijos correctos cuando la salida traducida se encuentra en una ubicación distinta a la raíz del proyecto por defecto.

<a id="flat-link-rewriting"></a>
### Reescritura plana de enlaces

Cuando `docsOutput.style === "flat"`, los archivos markdown traducidos se colocan junto al origen con sufijos de configuración regional. Los enlaces relativos entre páginas se reescriben para que `[Guide](./guide.md)` en `readme.de.md` apunte a `guide.de.md`. Controlado por `rewriteRelativeLinks` (habilitado automáticamente para el estilo plano sin un `pathTemplate` personalizado). El mismo paso antepone un prefijo de profundidad por archivo a las URL de activos que no son markdown antes de que se ejecute `postProcessing.regexAdjustments`; consulte [Reescritor de enlaces planos](/es/guide/images-and-screenshots/link-rewriting#the-flat-link-rewriter-and-two-step-flow).

---

<a id="json-internals"></a>
## Internos de JSON

| Paso | Componente | Resultado |
| --- | --- | --- |
| 1 | `json[].contentPaths` | Archivos resueltos (archivo, directorio o glob) |
| 2 | `NestedJsonExtractor` | Hojas de cadena seleccionadas por `keyPolicy` (rutas de puntos + minimatch) |
| 3 | `PlaceholderHandler` + lote + `TranslationCache` | Acierto de caché → omitir; fallo → `LlmClient.translateDocumentBatch` (SQLite compartido) |
| 4 | `NestedJsonExtractor.reassemble` | Archivo de salida a través de `expandJsonBlockOutputPath(outputPathTemplate)` |

- `NestedJsonExtractor` (`src/extractors/nested-json-extractor.ts`) recorre JSON anidado arbitrario y emite un segmento por cada hoja de cadena translatable. `keyPolicy.mode` (`allowlist`, `denylist` o `both`) filtra rutas con minimatch en notación de puntos (nombres sin procesar como `slug` coinciden con el segmento de clave final).
- La pista de archivo de caché utiliza `json-block:{blockIndex}:{projectRelPath}` en `file_tracking` (mismo `cacheDir` que documentos y SVG).
- **No** para catálogos de Docusaurus `write-translations` (forma `{ message, description }`) — esos usan Documentos (`docs[].docusaurusCatalogDir` + `JsonExtractor` dentro de `translate-docs`).
- **No** para cadenas de interfaz de usuario `t()` — cadenas de interfaz de usuario (`strings.json` + paquetes planos).
- CLI: `translate-json`; orquestación en `src/cli/translate-json-run.ts`. Plantilla de inicio: `ui-json-bundles`.

---

<a id="shared-infrastructure"></a>
## Infraestructura compartida

<a id="llmclient"></a>
### `LlmClient`

Cliente de chat independiente del proveedor construido sobre el SDK de IA de Vercel (`ai` + `@ai-sdk/openai-compatible`). Resuelve el proveedor activo desde `provider` / `providers`, construye un cliente compatible con OpenAI (`createOpenAICompatible`) para `baseUrl` y la clave API de ese proveedor, y enruta todas las llamadas a través de `generateText`. `OpenRouterClient` se mantiene como un alias obsoleto. Comportamientos clave:

- **Respaldo del modelo**: intenta cada modelo en la lista resuelta en orden; recurre a fallas de solicitud o análisis. Cada configuración regional de destino obtiene su propia cadena resuelta: `localeModels(locale)` primero cuando está configurado, luego `uiModels` (solo canalizaciones de UI), luego `translationModels`. La traducción de documentos, JSON y SVG crea un cliente por configuración regional con la cadena que no es de UI. El comando `bench-models` en su lugar construye un cliente de un solo modelo por ID configurado (unión de `translationModels`, `uiModels` y `localeModels`; `translationModels: [id]`, sin respaldo) para que pueda cronometrar y tasar cada modelo de forma independiente.
- **Tiempo de espera de la solicitud**: el `requestTimeoutMs` del proveedor activo (30 segundos por defecto) aborta cada solicitud a través de `AbortSignal.timeout`. El mismo valor se aplica a `GET /models` cuando la CLI carga la lista de modelos de un proveedor para `check-models` (cualquier proveedor). El filtro opcional previo al vuelo que descarta ID de modelo desconocidos solo se ejecuta cuando el proveedor activo es OpenRouter.
- **Extras de OpenRouter** (solo cuando `openrouter` está activo): enrutamiento de rendimiento a través del campo de solicitud `provider`, encabezados `HTTP-Referer` / `X-Title` y costo exacto en USD leído de `usage.cost`. El uso de tokens se informa para cada proveedor; el costo exacto solo cuando el proveedor lo devuelve.
- **Registro de tráfico de depuración**: si se establece `debugTrafficFilePath`, agrega JSON de solicitud y respuesta a un archivo.

<a id="config-loading"></a>
### Carga de configuración

Canalización `loadI18nConfigFromFile(configPath, cwd)`:

1. Leer y analizar `ai-i18n-tools.config.json` (JSON).
2. `mergeWithDefaults` - fusión profunda con `defaultI18nConfigPartial`, y fusión de cualquier entrada `docs[].sourceFiles` en `contentPaths`.
3. `expandTargetLocalesFileReferenceInRawInput` - convertir `targetLocales` a una matriz y rechazar entradas tipo ruta (deben ser códigos BCP-47, no una ruta a `ui-languages.json`); `languagesManifestPath` por defecto es `{ui.flatOutputDir}/ui-languages.json` durante `mergeWithDefaults`.
4. `expandDocumentationTargetLocalesInRawInput` - lo mismo para cada entrada `docs[].targetLocales`.
5. `expandJsonTargetLocalesInRawInput` - igual para cada entrada de `json[].targetLocales`.
6. `parseI18nConfig` - validación Zod + `validateI18nBusinessRules`.
7. `applyProviderOverrideToRawInput` - cuando `-P` / `--provider` se pasa en la CLI.
8. `applyEnvOverrides` - aplicar `OPENROUTER_BASE_URL`, `OLLAMA_BASE_URL`, `I18N_SOURCE_LOCALE` y `I18N_TARGET_LOCALES` cuando estén configurados (las claves API se resuelven por separado por proveedor dentro de `LlmClient`).
9. `augmentConfigWithUiLanguagesMaster` - adjuntar nombres de visualización de manifiesto del catálogo maestro incluido.
10. `assertEffectiveLocalesInUiLanguagesMaster` - validar códigos de configuración regional contra el catálogo maestro cuando corresponda.

`init` escribe configuraciones iniciales desde `initConfigTemplates`: `ui-markdown` (UI + markdown de aplicación opcional), `ui-docusaurus`, `ui-starlight`, `ui-vitepress` (documentos de VitePress + `vitepressThemeCatalog`), `ui-nextra` (documentos de Nextra + `nextraDictionaryPath`), `ui-astro-website` (UI de Astro simple; añadir `docs[]` para la traducción de páginas `.astro`), `ui-json-bundles` (solo `json[]` JSON). Consulte [Inicio rápido — Inicializar](/es/guide/quick-start#step-1-initialise).

<a id="logger"></a>
### Registrador (Logger)

`Logger` admite niveles `debug`, `info`, `warn`, `error` con salida de colores ANSI. El modo detallado (`-v`) habilita `debug`. Cuando se establece `logFilePath`, las líneas de registro también se escriben en ese archivo.

<a id="self-localization-tool-ui"></a>
### Autolocalización (interfaz de usuario de la herramienta)

La herramienta localiza su propia interfaz de usuario — ayuda de CLI, mensajes de registro/resumen/error de alto tráfico y el panel de traducción — por separado del contenido que traduce para usted.

- **Resolución de configuración regional** (`resolveUiLocale` en `src/core/ui-locale.ts`): elige la configuración regional de la interfaz de usuario de `-L` / `--ui-lang` > `AI_I18N_LANG` > configuración `uiLanguage` > configuración regional del sistema operativo host (`Intl.DateTimeFormat().resolvedOptions().locale`). El candidato se normaliza y se compara con el conjunto de paquetes enviados exactamente o por la variación más cercana (por ejemplo, `pt-PT` → `pt-BR`, `en-US` → `en-GB`), recurriendo a la configuración regional de origen (`en-GB`). La CLI se resuelve una vez antes de que se construya la ayuda (escaneo de argv previo al análisis) y nuevamente después de la carga de la configuración para que se aplique `uiLanguage` (la bandera y la variable de entorno aún ganan).
- **Tiempo de ejecución** (`src/i18n/index.ts`): un `t(source, vars)` mínimo con interpolación ```{{name}}```, indexado por la cadena de origen en inglés contra paquetes planos por configuración regional en `src/i18n/locales/<code>.json` (copia a `dist/i18n/locales` en la compilación). Las claves o paquetes faltantes devuelven el texto de origen. Este es el mismo modelo de clave como predeterminado que las cadenas de la interfaz de usuario; no hay búsqueda de hash.
- **Panel de control**: el servidor expone `GET /api/ui-i18n` que devuelve `{ locale, dir, bundle }` para la configuración regional de la interfaz de usuario resuelta; el frontend establece `<html lang>` / `dir` y localiza el marcado estático a través de atributos `data-i18n*`.
- **Dogfooding**: los paquetes se producen ejecutando la propia canalización de extracción → `translate-ui` del paquete contra `ai-i18n-self.config.json` (`pnpm i18n:self`). Las claves del catálogo provienen de las llamadas a `t()` en `src/cli/` y `src/i18n/`, además de los marcadores `data-i18n*` del panel de control en `src/dashboard-app/index.html`.

---

<a id="extension-points"></a>
## Puntos de extensión

<a id="custom-function-names-ui-extraction"></a>
### Nombres personalizados de funciones (extracción de interfaz de usuario)

Agrega nombres no estándar de funciones de traducción mediante la configuración:

```json
{
  "ui": {
    "uiExtractor": {
      "funcNames": ["t", "i18n.t", "translate", "i18n.translate"],
      "extensions": [".js", ".jsx", ".ts", ".tsx", ".astro", ".html"],
      "htmlI18nAttributes": ["data-i18n", "data-i18n-title", "data-i18n-placeholder"]
    }
  }
}
```

(`ui.reactExtractor` es un alias completamente compatible para `ui.uiExtractor`.)

Añade `.html` / `.htm` a `extensions` para escanear atributos de marcador HTML durante la `extract`. `ui.uiExtractor.htmlI18nAttributes` es opcional y por defecto es `["data-i18n", "data-i18n-title", "data-i18n-placeholder"]`; `data-i18n` se mapea al `textContent` del elemento y `data-i18n-<attr>` se mapea al valor de ese atributo (p. ej., `data-i18n-aria-label`).

<a id="custom-extractors"></a>
### Extractores personalizados

Implementa `ContentExtractor` desde el paquete:

```ts
import { BaseExtractor, type Segment } from 'ai-i18n-tools';

class MyExtractor extends BaseExtractor {
  readonly name = 'my-format';
  canHandle(filepath: string) { return filepath.endsWith('.myext'); }
  extract(content: string, filepath: string): Segment[] { /* … */ }
  reassemble(segments: Segment[], translations: Map<string, string>): string { /* … */ }
}
```

Registre extractores personalizados extendiendo las clases de extractor públicas exportadas desde `'ai-i18n-tools'` (por ejemplo, subclase `MarkdownExtractor`). La CLI conecta los extractores incorporados internamente; no hay una importación profunda compatible de `doc-translate.ts`.

<a id="custom-output-paths"></a>
### Rutas de salida personalizadas

Use `docsOutput.pathTemplate` para cualquier disposición de archivos:

```json
{
  "docs": [
    {
      "docsOutput": {
        "pathTemplate": "{outputDir}/{locale}/{relativeToDocsRoot}"
      }
    }
  ]
}
```

---

<a id="source-tree"></a>
## Árbol de origen

<details>
<summary>Diseño completo de <code>src/</code> (referencia a nivel de archivo)</summary>

```text
src/
├── index.ts                        Public API re-exports
│
├── cli/
│   ├── index.ts                    CLI entry point (commander)
│   ├── extract-strings.ts          `extract` command implementation
│   ├── mark-html.ts                `mark-html` command (insert bare `data-i18n*` markers into HTML)
│   ├── translate-ui-strings.ts     `translate-ui` command implementation
│   ├── doc-translate.ts            `translate-docs` command (documentation files only)
│   ├── translate-json-run.ts       `translate-json` command (`json[]` nested locale bundles)
│   ├── translate-svg.ts            `translate-svg` command (SVG files from `config.svg`)
│   ├── write-heading-ids.ts        `write-heading-ids` command (markdown heading anchors)
│   ├── bench-models.ts             `bench-models` command (per-model translate latency/token/cost benchmark)
│   ├── helpers.ts                  Shared CLI utilities
│   └── file-utils.ts               File collection helpers
│
├── markdown/
│   └── write-heading-ids-core.ts   Slug styles + `<a id="…">` insertion for `write-heading-ids`
│
├── core/
│   ├── types.ts                    Zod schemas + TypeScript types for all config shapes
│   ├── config.ts                   Config loading, merging, validation, init templates
│   ├── cache.ts                    SQLite translation cache (node:sqlite)
│   ├── prompt-builder.ts           LLM prompt construction for docs and UI strings
│   ├── output-paths.ts             Docusaurus / flat output path resolution
│   ├── ui-languages.ts             ui-languages.json loading and locale resolution
│   ├── ui-locale.ts                Resolve the tool's own UI locale (flag/env/config/OS → shipped bundle)
│   ├── locale-utils.ts             BCP-47 normalisation, locale list parsing, script/Han-variant validation
│   └── errors.ts                   Typed error classes
│
├── extractors/
│   ├── base-extractor.ts           Abstract base class for all extractors
│   ├── ui-string-extractor.ts      JS/TS source scanner (i18next-scanner + Babel for `.astro`)
│   ├── ui-string-babel.ts          Babel-based `t()` discovery in `.astro` frontmatter and `{expression}` blocks
│   ├── ui-string-locations.ts      Source locations for extracted UI strings
│   ├── html-i18n-marks.ts          HTML `data-i18n*` marker scanner + `mark-html` annotator
│   ├── classify-segment.ts         Heuristic segment type classification
│   ├── markdown-extractor.ts       Markdown / MDX segment extraction
│   ├── markdown-segment-split.ts   Optional segment splitting for long markdown blocks
│   ├── frontmatter-fields.ts       Selective YAML front matter field translation
│   ├── astro-template-extractor.ts `.astro` parse-and-replace (HTML + template expressions; used by `translate-docs`)
│   ├── json-extractor.ts           Docusaurus catalog JSON extraction (`translate-docs`)
│   ├── nested-json-extractor.ts    Arbitrary nested JSON leaves (`translate-json`, `json[]`)
│   └── svg-extractor.ts            SVG text extraction
│
├── processors/
│   ├── placeholder-handler.ts      Chain: HTML → admonitions → anchors → MDX → URLs → emphasis
│   ├── expression-attribute-protection.ts  Shared protected attribute/key lists (Astro + MDX JSX)
│   ├── url-placeholders.ts         Markdown URL protection/restore
│   ├── admonition-placeholders.ts  Docusaurus admonition protection/restore
│   ├── anchor-placeholders.ts      HTML anchor / heading ID protection/restore
│   ├── html-tag-placeholders.ts    Lowercase HTML tag / comment protection ({{HTM_N}})
│   ├── placeholder-integrity.ts    Pre/post-restore token sequence + tag-kind + invented {{IDENT}} checks
│   ├── mdx-placeholders.ts         MDX comments, JSX tags, brace expressions, JSX attribute extraction
│   ├── batch-processor.ts          Segment → batch grouping (count + char limits)
│   ├── validator.ts                Post-translation structural checks
│   └── flat-link-rewrite.ts        Relative link rewriting for flat output
│
├── api/
│   ├── llm-client.ts               LlmClient: provider-agnostic chat client (AI SDK) with model fallback chain
│   └── provider-models-catalog.ts  Fetch/parse any provider's OpenAI-compatible GET /models catalog
│
├── glossary/
│   ├── glossary.ts                 Glossary loading (CSV + auto-build from strings.json)
│   └── matcher.ts                  Term hint extraction for prompts
│
├── runtime/
│   ├── index.ts                    Runtime re-exports
│   ├── template.ts                 interpolateTemplate, flipUiArrowsForRtl
│   ├── ui-language-display.ts      getUILanguageLabel, getUILanguageLabelNative
│   └── i18next-helpers.ts          RTL detection, i18next setup factories
│
├── i18n/                           Self-localization runtime for the tool's own UI
│   ├── index.ts                    t(source, vars) + bundle/manifest loaders (keyed by English source string)
│   └── locales/                    Shipped UI bundles (de.json, es.json, …; generated by `pnpm i18n:self`)
│
├── dashboard-app/
│   ├── index.html                  Translation Dashboard static UI (HTML/CSS/JS)
│   ├── app.js
│   └── styles.css
│
├── server/
│   └── translation-dashboard.ts    Express app for Translation Dashboard (cache / strings.json / glossary)
│
└── utils/
    ├── logger.ts                   Leveled logger with ANSI support
    ├── hash.ts                     Segment hash (SHA-256 first 16 hex)
    ├── table.ts                    Display-width aware table rendering (CJK/emoji column alignment)
    ├── load-dotenv.ts              Auto-load `.env` from the cwd at CLI startup (never overrides existing env)
    └── ignore-parser.ts            .translate-ignore file parser
```

</details>
