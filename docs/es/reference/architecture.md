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
| | `src/glossary/` | Carga de glosario, sugerencias de términos y archivos de contexto de proyecto opcionales para las indicaciones |
| | `src/utils/` | Registrador, hashing, analizador de ignorados, tablas de ancho de visualización, cargador `.env` |
| **Tiempo de ejecución de su aplicación** | `src/runtime/` | Ayudantes i18next y utilidades de visualización — exportados como `'ai-i18n-tools/runtime'` ([Ayudantes de tiempo de ejecución](/es/guide/runtime-helpers)) |
| **Interfaz de usuario de la herramienta** *(dogfooding)* | `src/i18n/`, `src/dashboard-app/`, `src/server/` | Localiza la propia CLI y el Panel de traducción de este paquete — separado del contenido de tu proyecto ([Autolocalización](#self-localisation-tool-ui)) |

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

Para las fuentes `.html` / `.htm` (cuando se enumeran en `ui.uiExtractor.extensions`), `extract` en su lugar enruta el archivo a través de `html-i18n-marks.ts`, que escanea los atributos de marcador `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` / `data-i18n-alt` / `data-i18n-aria-label` (configurable mediante `ui.uiExtractor.htmlI18nAttributes`). Un marcador vacío toma su texto fuente del propio `textContent` o atributo del elemento; un marcador con valor (`data-i18n="Key"`) utiliza el valor. `data-i18n-locale-src` y `data-i18n-locale-href` están reservados para el entorno de ejecución del navegador y nunca se extraen. El mismo módulo impulsa el comando `mark-html`, que inserta los marcadores vacíos automáticamente (incluyendo `alt` y `aria-label`) y nunca inserta los marcadores de URL de configuración regional. Los archivos HTML nunca llegan a las pasadas de Babel / i18next-scanner. El HTML de configuración regional generado bajo un `outputDir` de documentación se excluye de este escaneo.

Los sitios SSG de Astro simples pueden omitir i18next: cargar `{locale}.json` plano en tiempo de compilación y resolver `t('source text')` por clave de texto fuente. El idioma de origen es `sourceLocale` y puede ser cualquier idioma (consulte `examples/astro-website/src/i18n/t.ts` y [Cadenas de interfaz de usuario — sitio web de Astro](/es/guide/ui-strings/astro-website)).

Las aplicaciones HTML simples siguen el mismo modelo de catálogo con atributos de marcador en lugar de llamadas a `t()` — consulte [Marcar HTML para traducción](/es/guide/ui-strings/plain-html#marking-html-for-translation). El script integrable es `ai-i18n-tools/html-runtime/i18n.js`.

El HTML estático que debe convertirse en un archivo por configuración regional es un pipeline de documentos (`HtmlTemplateExtractor` dentro de `translate-docs`), no este catálogo. Consulte [Páginas HTML](/es/guide/documents/html-pages).

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

- Identifique los idiomas de origen y de destino (por nombre de visualización de `localeDisplayNames` o `ui-languages.json`).
- Anteponga una directiva de script cuando la configuración regional de destino tenga un sistema de escritura esperado (script BCP-47 explícito o un idioma predeterminado como `hi` → Devanagari, `ar` → árabe, `ja` → kana/kanji japonés).
- Envíe una matriz JSON de cadenas y solicite una matriz JSON de traducciones a cambio.
- Incluya sugerencias de glosario cuando estén disponibles.

`LlmClient.translateUIBatch` prueba cada modelo en orden, recurriendo a errores de análisis, de red o de script incorrecto (incluyendo la alternativa romanizada/latina para configuraciones regionales de script nativo). La CLI construye esa lista por configuración regional de destino a partir de `localeModels`, el `uiModels` opcional y `translationModels` (consulta [Modelos de IA](/es/guide/ai-models#model-fallback-chain)).

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

- `MarkdownExtractor` - divide el markdown en segmentos tipados: `frontmatter`, `heading`, `paragraph`, `code`, `admonition`. El frontmatter YAML se clasifica como **no traducible** (`slug`, `id` y otras claves de enrutamiento permanecen estables). Los bloques `export ...` de nivel superior (por ejemplo, definiciones de componentes de React) se clasifican como segmentos `other` no traducibles junto con el manejo `import ...` existente. Los bloques de varias líneas que comienzan con una etiqueta JSX en mayúscula (por ejemplo, un bloque `<Tabs>`) se clasifican como párrafos traducibles. Los segmentos no traducibles (bloques de código, HTML sin formato) se conservan textualmente.
- `AstroTemplateExtractor` - análisis y reemplazo para páginas de marketing `.astro` (`translate-docs` a través de `translateAstroFile` en `doc-translate.ts`). Extrae nodos de texto HTML visibles para el usuario y atributos traducibles (`alt`, `title`, `aria-label`, `placeholder`), además de literales de cadena dentro de bloques de plantilla `{expression}` cuando son visibles para el usuario. Omite TypeScript de frontmatter, `<script>`, `<style>`, valores de atributos/claves protegidos y literales dentro de `t('…')`. El reensamblaje ajusta las importaciones relativas cuando las rutas de salida son más profundas (por ejemplo, `src/pages/de/index.astro`). Consulte [Páginas del sitio web de Astro](/es/guide/ui-strings/astro-website#pages-parse-and-replace).
- `JsonExtractor` - extrae valores de cadena de archivos de etiquetas JSON de Docusaurus (catálogos de UI de Docusaurus, no cuerpo MDX).
- `SvgExtractor` - extrae contenido `<text>`, `<title>` y `<desc>` de SVG (utilizado por `translate-svg` para archivos bajo `config.svg`, no por `translate-docs`).
- `html-i18n-marks.ts`: un escáner de etiquetas HTML enfocado utilizado por `extract` para fuentes de `.html` / `.htm` y por el comando `mark-html`. `collectHtmlI18nStrings` / `collectHtmlI18nLocations` leen los atributos de marcador `data-i18n*` (marcador simple → `textContent` / `title` / `placeholder` del elemento; marcador con valor → el valor), y `markHtmlContent` inserta marcadores simples en elementos de texto hoja / título / marcador de posición (idempotente, respeta `data-i18n-ignore`, omite elementos similares a código y de contenido mixto). El ayudante compartido `normalizeI18nText` mantiene las claves en tiempo de compilación idénticas al tiempo de ejecución del navegador.

<a id="astro-hybrid-sites-ui--page-html"></a>
### Sitios híbridos de Astro (interfaz de usuario + HTML de página)

Las aplicaciones de Astro plano a menudo habilitan **ambas** cadenas de interfaz de usuario y documentos en una configuración (referencia: `examples/astro-website/`):

| Capa | Mecanismo | Salida |
| --- | --- | --- |
| HTML de plantilla | `AstroTemplateExtractor` + `translate-docs` | `.astro` por configuración regional en `docs[].outputDir` |
| Frontmatter / `t('…')` | `ui-string-babel.ts` + `extract` + `translate-ui` | `public/locales/{locale}.json` plano (cadena de idioma de origen como clave; `sourceLocale` puede ser cualquier idioma) |

El comando `sync` ejecuta los pasos habilitados en orden: **extraer** y luego **traducir-interfaz de usuario** (cuando `features.translateUIStrings`) → opcional **traducir-svg** → **traducir-documentos** → opcional **traducir-json** (a menos que se omita con `--no-ui`, `--no-svg`, `--no-docs` o `--no-json`). La plantilla de inicialización `ui-astro-website` crea solo cadenas de interfaz de usuario; agregue `docs[]` y `features.translateDocs` para HTML de página.

<a id="heading-anchor-insertion-write-heading-ids-cli"></a>
### Inserción de anclas de encabezado (`write-heading-ids` CLI)

El comando `write-heading-ids` es un preprocesador **local y sin uso de LLM** para archivos markdown de documentación. Implementación: `src/cli/write-heading-ids.ts` coordina el descubrimiento de archivos; `src/markdown/write-heading-ids-core.ts` analiza las líneas e inserta anclajes.

Requiere una configuración válida con **al menos un bloque `docs[]`**. Para cada bloque, recopila archivos `.md` / `.mdx` en `contentPaths`, aplica las reglas `.translate-ignore` del proyecto (la misma idea que la traducción de documentos) y, opcionalmente, restringe a un subárbol con `--path` / `--file`. Cada archivo se transforma con `applyHeadingAnchorsToMarkdown`: para cada **encabezado ATX plano** (`# …` a `###### …`) fuera de los bloques de código cercados, los ID de encabezado existentes de cualquier forma se reemplazan con el estilo seleccionado. Los estilos HTML escriben `<a id="slug"></a>` en la línea anterior a un encabezado sin sufijo; `--slug-style mdx-comment` escribe `{/* #slug */}` en la línea del encabezado (y elimina un ancla HTML precedente). Los slugs siempre provienen del texto del encabezado actual. `--remove` elimina los anclajes HTML, los sufijos clásicos de `{#id}` y los ID de comentarios MDX sin escribir nuevos. Los algoritmos de slug coinciden con los ecosistemas comunes —`github` (predeterminado), `bitbucket`, `gitlab`, `pymdown` (normalización Unicode opcional / banderas de codificación de porcentaje), `azure-devops`, más `mdx-comment` (slug de github + salida de comentarios MDX)— para que los ID de anclaje se mantengan consistentes con las herramientas existentes (doctoc, PyMdown, Docusaurus, etc.). `--dry-run` informa las ediciones que se realizarían sin escribirlas.

Después del pase de origen, el mismo comando reposiciona esos identificadores en inglés en el markdown traducido existente de cada configuración regional (`resolveTranslatedOutputPath`). Los títulos traducidos nunca se vuelven a slugificar; un `{#id}` / `{/* #id */}` a mitad de encabezado se mueve de nuevo al sufijo (o ancla HTML) que espera el estilo seleccionado. Los archivos de configuración regional que faltan se omiten.

Este comando **no** se ejecuta dentro de `translate-docs` ni `sync`; ejecútelo explícitamente cuando desee IDs de fragmento estables en los archivos fuente antes de la traducción o publicación.

<a id="placeholder-protection"></a>
### Protección de marcadores de posición

Antes de la traducción, la sintaxis sensible se sustituye por tokens opacos para evitar corrupción por parte del LLM, aplicado en este orden (la restauración es el proceso inverso):

1. **Bloques de código delimitados** (tres o más acentos graves o virgulillas, incluida una delimitación más larga que envuelve a una más corta): toda la delimitación, incluida la cadena de información, se reemplaza por <code v-pre>{{CDF_N}}</code> y se mantiene en orden con los demás tokens estructurales. Esto mantiene las muestras dentro de contenedores como `::: code-group` o `::: tip` en su sitio. Las cadenas de información de la delimitación (etiquetas de pestaña de VitePress) permanecen en el idioma de origen. Un delimitador de apertura sin cerrar se deja como texto para que no se absorba un delimitador de cierre de contenedor posterior.
2. **Sufijos de ID de encabezado** (`{#id}` clásico / `{/* #id */}` de MDX al final de un encabezado ATX): se eliminan por completo de la línea y **no** se envían al modelo. Tras la restauración, se vuelven a fijar al final del encabezado correspondiente para que Docusaurus siga viendo un ID válido. Los comentarios a mitad de encabezado permanecen en el texto y son gestionados por las capas posteriores de MDX / `{#…}`. Los encabezados dentro de una delimitación enmascarada no se eliminan.
3. **Etiquetas y comentarios HTML** (`<strong>`, `<!-- ... -->`, etc.): las etiquetas HTML en minúsculas de una lista de elementos permitidos conocida se reemplazan por tokens <code v-pre>{{HTM_N}}</code>. Las etiquetas JSX en mayúsculas (`<Highlight>`, `<Tabs>`, `</Tab>`) se gestionan por separado en la capa MDX (paso 6).
4. **Marcadores de advertencia** (`:::note`, `:::`): solo el prefijo de la directiva en la línea de apertura se reemplaza por <code v-pre>{{ADM_OPEN_N}}</code>; cualquier título en la misma línea se deja para que el modelo lo traduzca. Se restauran con el texto original exacto.
5. **Anclajes de documento** (HTML `<a id="…">`, `{#…}` de Docusaurus sobrante a mitad de encabezado): se conservan literalmente.
6. **Construcciones exclusivas de MDX** (`src/processors/mdx-placeholders.ts`):
   - **Comentarios de MDX** (`{/* … */}`, incluido un `{/* #my-id */}` a mitad de encabezado que no era un sufijo de final de línea) reemplazados por <code v-pre>{{MDX_N}}</code>.
   - **Etiquetas JSX en mayúsculas** (`<Highlight>`, `<Tabs>`, `<TabItem>`, `<TOCInline />`, `</Highlight>`): se conservan como <code v-pre>{{MDX_N}}</code> con atributos de cadena traducibles (`label`, `tooltip`, `aria-label`) reescritos como <code v-pre>{{JXA_N}}</code> dentro de la etiqueta, a menos que el nombre del atributo aparezca en `docs[].protectAttributes`; también se extraen `label:` dentro de literales de objeto `<Tabs values={[ { label: '…' } ]}>` (se pueden omitir mediante `docs[].protectKeys`) y `<TabItem value="…">` (cuando no existe ningún atributo `label`, omitiendo los valores tipo slug en minúsculas). Se añaden al segmento como líneas `||JXA_N: …||` y se vuelven a fusionar mediante `restoreMdx`.
   - **Expresiones entre llaves de MDX** (`{frontMatter.title}`, <code v-pre>style={{…}}</code>): coincidencia sensible a la profundidad, reemplazadas por <code v-pre>{{MDX_N}}</code>.
7. **URL de Markdown** (`](url)`, `src="…"`): se restauran desde un mapa después de la traducción.
8. **Fragmentos de código en línea** (`` `code` ``) y **código en línea envuelto en negrita** (`**`code`**`): se conservan.
9. **Énfasis de Markdown** (opcional, habilitado automáticamente para configuraciones regionales CJK/RTL): delimitadores de énfasis enmascarados.

Después de que el modelo devuelva el resultado, `translate-docs` restaura los mapas y valida el segmento: debe estar presente el mismo multiconjunto de tokens de doble llave, los tokens estructurales (<code v-pre>{{HTM_N}}</code>, marcadores de advertencia, <code v-pre>{{CDF_N}}</code>) deben mantener su subsecuencia ordenada (los tokens de contenido como <code v-pre>{{ILC_N}}</code> / <code v-pre>{{URL_N}}</code> / <code v-pre>{{SE}}</code> pueden moverse con el orden de las palabras), los tipos de etiquetas HTML restauradas deben coincidir con el origen no protegido y cualquier identificador de doble llave sobrante ya debe haber existido en el origen (por lo que los tokens inventados fallan). La instrucción del documento también pide a los modelos que copien cada token una vez, mantengan el orden de los tokens estructurales y no inventen nuevos envoltorios de doble llave; las comprobaciones mecánicas siguen siendo las que prevalecen.

La protección compartida de atributos/claves para las plantillas Astro y MDX JSX se implementa en `src/processors/expression-attribute-protection.ts` y se controla por bloque mediante `docs[].protectAttributes` y `docs[].protectKeys` (consulte [protectAttributes / protectKeys](/es/reference/configuration#protectattributes-protectkeys)).

<a id="cache-translationcache"></a>
### Caché (`TranslationCache`)

La base de datos SQLite (mediante `node:sqlite`) almacena filas indexadas por `(source_hash, locale)` con `translated_text`, `model`, `filepath`, `last_hit_at` y campos relacionados. El hash corresponde a los primeros 16 caracteres hexadecimales SHA-256 del contenido normalizado (espacios en blanco reducidos).

En cada ejecución, los segmentos se buscan por hash × configuración regional. Solo los fallos de caché van al LLM. Después de la traducción, `last_hit_at` se restablece para las filas de segmentos en el ámbito de traducción actual que no fueron alcanzadas. Los aciertos de caché exitosos durante la traducción de documentos eliminan las filas obsoletas de `translation_failures` para ese segmento.

`cleanup` ejecuta `sync --force-update` primero, luego:

- elimina filas de segmentos obsoletas (`last_hit_at` nulo / ruta de archivo vacía);
- purga claves de `file_tracking` cuando la ruta de origen resuelta falta en el disco (`doc-block:…`, `json-block:…`, `svg-files:…`, etc.);
- elimina filas de traducción cuya ruta de archivo de metadatos apunta a un archivo que falta;
- purga filas huérfanas de `translation_failures`;
- purga filas huérfanas de `markdown_source_issues` cuya ruta de origen resuelta falta en el disco;
- elimina filas de caché para configuraciones regionales ausentes de la configuración (`sourceLocale`, raíz `targetLocales`, y cualquier `docs[]` / `json[]` `targetLocales` por bloque; solo SQLite — usa `purge-locale` para eliminar archivos generados).

No hace una copia de seguridad de `cache.db` a menos que se pase `--backup <path>`, lo que escribe una copia de seguridad en esa ruta primero.

Las llamadas al modelo facturadas (traducciones aceptadas y reintentos descartados) se almacenan en `api_calls`. Después de un comando que haya registrado llamadas, las filas de detalle con más de siete días naturales UTC pasan a las `api_totals` mensuales. `usage` y la vista de Uso y costos del panel combinan ambas tablas. Consulte [Uso y costos](/es/guide/translation-dashboard/usage).

Las notas del glosario `Context` y `glossary.contextFiles` reciben una huella digital (`prompt_context_hash`) y se inyectan en la IU, la documentación, JSON, SVG y los prompts de revisión. Modificar esa directriz invalida los segmentos en caché coincidentes y las filas de seguimiento de archivos en la siguiente ejecución. Las filas de la caché de `user-edited` del panel se conservan. Cambiar solo una traducción preferida del glosario mantiene la caché existente intacta hasta `--force` / `--force-update`.

El comando `translate-docs` también utiliza el **seguimiento de archivos** para que las fuentes sin cambios con salidas existentes y actualizadas puedan omitir el trabajo por completo. `--check-cache` vuelve a abrir las configuraciones regionales con un sistema de escritura esperado para que los segmentos en caché se vuelvan a validar; `--force-update` vuelve a ejecutar el procesamiento de archivos para cada configuración regional mientras sigue utilizando la caché de segmentos; `--force` borra el seguimiento de archivos y omite las lecturas de la caché de segmentos para la traducción de la API. Cuando cada modelo configurado falla la validación AST en un segmento de markdown, `translate-docs` puede dividir progresivamente el segmento y reintentar partes más pequeñas (`docs[].segmentSplitting.qualityRetrySplit`, activado por defecto). Consulte [Documentos — comportamiento y banderas de la caché](/es/guide/documents/cli-options#cache-behaviour-and-translate-docs-flags) para ver la tabla completa de banderas.

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

- **Reserva de modelo (fallback)**: prueba cada modelo de la lista resuelta en orden; recurre a la siguiente opción en caso de fallos de solicitud o análisis. Cada configuración regional de destino obtiene su propia cadena resuelta: `localeModels(locale)` primero cuando está configurado, luego `uiModels` (solo canalizaciones de IU), y después `translationModels`. La traducción de documentos, JSON y SVG crea un cliente por configuración regional con la cadena que no es de IU. El comando `bench-models` en su lugar construye un cliente de modelo único por ID configurado (unión de `translationModels`, `uiModels` y `localeModels`; `translationModels: [id]`, sin reserva) para que pueda medir el tiempo y el precio de cada modelo de forma independiente.
- **Tiempo de espera de solicitud**: `requestTimeout` (segundos) o `requestTimeoutMs` en el proveedor activo; de lo contrario, se utilizan las mismas claves en la parte superior de la configuración (45 segundos por defecto), lo que aborta cada solicitud mediante `AbortSignal.timeout`. El mismo valor se aplica a `GET /models` cuando la CLI carga la lista de modelos de un proveedor para `check-models` (cualquier proveedor). El filtro de comprobación previa opcional que descarta los ID de modelo desconocidos solo se ejecuta cuando el proveedor activo es OpenRouter.
- **Extras de OpenRouter** (solo cuando `openrouter` está activo): enrutamiento de rendimiento a través del campo de solicitud `provider` y los encabezados `HTTP-Referer` / `X-Title`. El uso de tokens se informa para cada proveedor. OpenRouter y Cheaper Inference también devuelven un importe facturado en USD (`usage.cost`; Cheaper Inference recurre a `cheaper_inference.billing.billed_cost_usd`). Cuando el proveedor omite ese importe, el coste en USD se calcula a partir de `providers.<name>.modelPricing`, luego el valor predeterminado de `pricing` para todo el proveedor, después el precio de lista de entrada y salida de models.dev, y se almacena en la fila `api_calls`. Un coste reportado por el proveedor (incluido `0`) nunca se reemplaza. El coste desconocido permanece sin establecer. La fijación de precios de una llamada solo lee el segmento models.dev de `<cacheDir>/benchmark-scores.json`; no descarga languagebench ni el archivo Arena.
- **Registro de tráfico de depuración**: si `debugTrafficFilePath` está establecido, añade el JSON de solicitud y respuesta a un archivo (programático). La CLI `--debug-failed` escribe archivos `FAILED-TRANSLATION` bajo `cacheDir` con el prompt del sistema/usuario, la respuesta sin procesar del asistente y los errores de validación para intentos fallidos de traducción de IU, documentos, JSON y SVG. Los fallos de la API del proveedor / cuerpo vacío se imprimen en la consola en lugar de volcar un archivo solo con el prompt.

`suggest-models` y la pestaña Modelos del panel no llaman al LLM. Clasifican el catálogo de chat del proveedor activo con ChrF de languagebench, la puntuación de Arena de LMArena y los precios de models.dev y, después, reemplazan opcionalmente `providers.<name>.translationModels`. Los agregados se encuentran en `<cacheDir>/benchmark-scores.json`. Consulta [Modelos de IA](/es/guide/ai-models) y [suggest-models](/es/reference/cli-commands/models#suggest-models).

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

`init` escribe configuraciones de inicio desde `initConfigTemplates`: `ui-markdown` (cadenas de interfaz de usuario más un bloque README plano), `docs-markdown` (solo README y Markdown), `ui-docusaurus`, `ui-starlight`, `ui-vitepress` (documentos de VitePress + `vitepressThemeCatalog`), `ui-nextra` (documentos de Nextra + `nextraDictionaryPath`), `ui-astro-website` (interfaz de usuario de Astro simple; añade `docs[]` para la traducción de páginas de `.astro`), `ui-json-bundles` (solo `json[]` JSON), `ui-python`, `ui-python-gettext`, `ui-python-django` y `ui-python-flask`. `--with-readme` añade ese mismo bloque README a cualquier plantilla que no liste ya `README.md`, y activa `translateDocs`. Consulta [Cadenas de interfaz de usuario — Inicializar](/es/guide/ui-strings/#step-1-initialise), [Añadir i18n a tu README y documentos Markdown](/es/guide/add-i18n-to-readme) y [Aplicaciones Python](/es/guide/ui-strings/python).

<a id="logger"></a>
### Registrador (Logger)

`Logger` admite niveles `debug`, `info`, `warn`, `error` con salida de colores ANSI. El modo detallado (`-v`) habilita `debug`. Cuando se establece `logFilePath`, las líneas de registro también se escriben en ese archivo.

<a id="self-localisation-tool-ui"></a>
### Autolocalización (interfaz de usuario de la herramienta)

La herramienta localiza su propia interfaz de usuario — la ayuda de la CLI, los mensajes de registro/resumen/error de alto tráfico y el Panel de traducción — por separado del contenido que traduce para ti.

- **Resolución de configuración regional** (`resolveUiLocale` en `src/core/ui-locale.ts`): selecciona la configuración regional de la interfaz de usuario de `-L` / `--ui-lang` > `AI_I18N_LANG` > configuración `uiLanguage` > configuración regional del sistema operativo host (`Intl.DateTimeFormat().resolvedOptions().locale`). El candidato se normaliza y se compara con el conjunto de paquetes distribuidos, ya sea exactamente o por la variación más cercana (p. ej., `pt-PT` → `pt-BR`, `en-US` → `en-GB`), recurriendo a la configuración regional de origen (`en-GB`). La CLI resuelve una vez antes de que se construya la ayuda (escaneo de argv previo al análisis) y de nuevo después de la carga de configuración para que se aplique `uiLanguage` (la bandera y la variable de entorno siguen prevaleciendo).
- **Tiempo de ejecución** (`src/i18n/index.ts`): un `t(source, vars)` mínimo con interpolación <code v-pre>{{name}}</code>, indexado por la cadena de origen en inglés contra paquetes planos por configuración regional en `src/i18n/locales/<code>.json` (copiado a `dist/i18n/locales` en la compilación). Las claves o paquetes que faltan devuelven el texto de origen. Este es el mismo modelo de clave como predeterminado que las cadenas de la interfaz de usuario — no hay búsqueda por hash.
- **Panel de control**: el servidor expone `GET /api/ui-i18n` que devuelve `{ locale, dir, bundle }` para la configuración regional de la interfaz de usuario resuelta; el frontend establece `<html lang>` / `dir` y localiza el marcado estático a través de atributos `data-i18n*`.
- **Dogfooding**: los paquetes son producidos por `pnpm i18n:self` (`sync-ui --ui-block src/i18n/strings.json`), que extrae y traduce el bloque `ui` de la CLI y del panel de control en `ai-i18n-tools.config.json`. Las claves del catálogo provienen de llamadas a `t()` en `src/cli/` y `src/i18n/` más los marcadores `data-i18n*` del panel de control en `src/dashboard-app/index.html`.

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
      "htmlI18nAttributes": ["data-i18n", "data-i18n-title", "data-i18n-placeholder", "data-i18n-alt", "data-i18n-aria-label"]
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
│   ├── matcher.ts                  Term hint extraction for prompts
│   └── translation-context.ts      contextFiles loader and guidance fingerprints
│
├── runtime/
│   ├── index.ts                    Runtime re-exports
│   ├── template.ts                 interpolateTemplate, flipUiArrowsForRtl
│   ├── ui-language-display.ts      getUILanguageLabel, getUILanguageLabelNative
│   └── i18next-helpers.ts          RTL detection, i18next setup factories
│
├── i18n/                           Self-localisation runtime for the tool's own UI
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
