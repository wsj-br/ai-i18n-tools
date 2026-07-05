<a id="configuration-reference"></a>
# Referencia de configuración

<a id="sourcelocale"></a>
### `sourceLocale`

Código BCP-47 para el idioma de origen (por ejemplo, `"en-GB"`, `"en"`, `"pt-BR"`). No se genera ningún archivo de traducción para esta configuración regional — la propia cadena clave es el texto fuente.

**Debe coincidir** con `SOURCE_LOCALE` exportado desde su archivo de configuración de i18n en tiempo de ejecución (`src/i18n.ts` / `src/i18n.js`).

<a id="targetlocales"></a>
### `targetLocales`

Matriz de códigos de configuración regional BCP-47 a los que traducir (por ejemplo, `["de", "fr", "es", "pt-BR"]`).

`targetLocales` es la lista principal de configuraciones regionales para la traducción de la interfaz de usuario y la lista predeterminada para bloques de documentación. Usa `generate-ui-languages` para generar el manifiesto `ui-languages.json` a partir de `sourceLocale` + `targetLocales`.

<a id="uilanguage-optional"></a>
### `uiLanguage` (opcional)

Código BCP-47 para el idioma de la interfaz de usuario de la herramienta (ayuda de la CLI, registros/resúmenes y el Panel de traducción). Es independiente de `sourceLocale` / `targetLocales` y se anula mediante el indicador `-L` / `--ui-lang` y la variable de entorno `AI_I18N_LANG`. Los valores desconocidos se degradan correctamente a la configuración regional de origen (`en-GB`); no hay una validación estricta. Consulte [Idioma de la interfaz de usuario de la herramienta](/reference/environment-variables#tool-ui-language).

<a id="uilanguagespath-optional"></a>
### `uiLanguagesPath` (opcional)

Ruta al manifiesto `ui-languages.json` utilizado para nombres mostrados, filtrado por configuración regional y postprocesamiento de listas de idiomas. Si se omite, la CLI busca el manifiesto en `ui.flatOutputDir/ui-languages.json`.

Utiliza esto cuando:

- El manifiesto está fuera de `ui.flatOutputDir` y debe indicar explícitamente la CLI.
- Desea [post-procesado del selector de idioma](#language-switcher-languagelistblock) (`languageListBlock`) para generar etiquetas de idioma a partir del manifiesto.
- `extract` debería fusionar entradas `englishName` del manifiesto en `strings.json` (requiere `ui.reactExtractor.includeUiLanguageEnglishNames: true`).

<a id="concurrency-optional"></a>
### `concurrency` (opcional)

Número máximo de **configuraciones regionales destino** traducidas simultáneamente (`translate-ui`, `translate-docs`, `translate-svg` y los pasos correspondientes dentro de `sync`). Si se omite, la CLI usa **4** para traducción de interfaz de usuario y **3** para traducción de documentación (valores predeterminados integrados). Puedes anularlo por ejecución con `-j` / `--concurrency`.

<a id="batchconcurrency-optional"></a>
### `batchConcurrency` (opcional)

**translate-docs**, **translate-svg** y **translate-json** (y los pasos correspondientes dentro de `sync`): solicitudes **por lotes** máximas de LLM paralelas por archivo (cada lote puede contener muchos segmentos). El valor predeterminado es **4** cuando se omite. Ignorado por `translate-ui`. Anule con `-b` / `--batch-concurrency`.

<a id="fileconcurrency-optional"></a>
### `fileConcurrency` (opcional)

Número máximo de archivos procesados simultáneamente **dentro de una sola configuración regional** durante `translate-docs` y `sync`. Cuando se establece en un valor mayor que **1**, los archivos dentro de la misma configuración regional se procesan en paralelo usando un semáforo para controlar el uso de memoria. Valor predeterminado **1** (procesamiento secuencial) si se omite. Valores más altos pueden mejorar significativamente el rendimiento en operaciones limitadas por E/S, especialmente cuando todos los segmentos ya están en caché (sin necesidad de llamadas a la API).

**Ejemplo:**

```json
{
  "fileConcurrency": 4
}
```

**Caso de uso:** Establezca esto en `2-4` al ejecutar `sync --force-update` con aciertos del 100 % en la caché para reducir el tiempo total de procesamiento. La mejora es más notable con muchos archivos pequeños.

<a id="batchsize--maxbatchchars-optional"></a>
### `batchSize` / `maxBatchChars` (opcional)

Agrupación de segmentos para **translate-docs**, **translate-svg** y **translate-json**: cuántos segmentos por solicitud de API y un límite de caracteres. Valores predeterminados: **20** segmentos, **4096** caracteres (cuando se omite).

<a id="provider-and-providers"></a>
### `provider` y `providers`

`provider` (nivel superior, opcional) selecciona la clave del proveedor activo de `providers`. Es opcional cuando se configura exactamente un proveedor; es obligatorio cuando se configuran más de uno.

`providers` (nivel superior) mapea una clave de proveedor a su bloque. Las claves integradas (ver la tabla de preajustes a continuación) solo necesitan `translationModels`; cualquier otra clave define un endpoint personalizado compatible con OpenAI y requiere `baseUrl` (más `apiKeyEnv` a menos que el endpoint no necesite clave).

Cada bloque de `providers.<name>` acepta:

- `translationModels`
  Lista ordenada preferida de IDs de modelos (IDs directos del upstream, sin prefijo `provider/`; los IDs de OpenRouter conservan su forma nativa de `vendor/model`). El primero se intenta primero; las entradas posteriores son de respaldo en caso de error. Solo para `translate-ui`, también puedes establecer `ui.preferredModel` para intentar un modelo antes de esta lista (ver `ui`).
- `baseUrl`
  URL base compatible con OpenAI. Anula la URL base preestablecida; es obligatorio para un proveedor no preestablecido.
- `apiKeyEnv`
  Variable de entorno que contiene la clave API. Anula la variable de entorno preestablecida.
- `headers`
  Encabezados HTTP adicionales enviados con cada solicitud a este proveedor.
- `maxTokens`
  Tokens de finalización máximos por solicitud. Predeterminado: `8192`.
- `temperature`
  Temperatura de muestreo. Predeterminado: `0.2`.
- `requestTimeoutMs`
  Tiempo máximo en milisegundos para esperar cada solicitud. Predeterminado: `30000` (30 segundos).

Presets de proveedores integrados (clave — URL base — variable de entorno de clave API):

| Proveedor | URL base | Variable de entorno de clave API |
| --- | --- | --- |
| `openrouter` | `https://openrouter.ai/api/v1` | `OPENROUTER_API_KEY` |
| `openai` | `https://api.openai.com/v1` | `OPENAI_API_KEY` |
| `anthropic` | `https://api.anthropic.com/v1` | `ANTHROPIC_API_KEY` |
| `gemini` | `https://generativelanguage.googleapis.com/v1beta/openai` | `GOOGLE_API_KEY` |
| `deepseek` | `https://api.deepseek.com` | `DEEPSEEK_API_KEY` |
| `cerebras` | `https://api.cerebras.ai/v1` | `CEREBRAS_API_KEY` |
| `groq` | `https://api.groq.com/openai/v1` | `GROQ_API_KEY` |
| `mistral` | `https://api.mistral.ai/v1` | `MISTRAL_API_KEY` |
| `xai` | `https://api.x.ai/v1` | `XAI_API_KEY` |
| `nvidia` | `https://integrate.api.nvidia.com/v1` | `NVIDIA_API_KEY` |
| `alibaba` | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` | `ALIBABA_API_KEY` |
| `apifun` | `https://api.apikey.fun/v1` | `APIFUN_API_KEY` |
| `ollama` | `http://localhost:11434/v1` | (ninguno) |

Todavía se acepta un bloque `openrouter` de nivel superior heredado (con `baseUrl`, `translationModels`, `defaultModel`, `fallbackModel`, `maxTokens`, `temperature`, `requestTimeoutMs`) y se migra automáticamente a `providers.openrouter` (con `provider: "openrouter"`) al cargarlo; `defaultModel` / `fallbackModel` se pliegan en `translationModels`.

Para ver un ejemplo ejecutable que configura varios proveedores en una configuración y cambia entre ellos con `-P`, consulte [`examples/multi-provider`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/multi-provider/) (`openai`, `anthropic`, `nvidia` y `deepseek` en el mismo documento).

**Por qué usar múltiples modelos:** Diferentes proveedores y modelos tienen costos variables y ofrecen diferentes niveles de calidad entre idiomas y locales. Configura `translationModels` **como una cadena de respaldo ordenada** (en lugar de un solo modelo) para que la CLI pueda intentar el siguiente modelo si una solicitud falla.

Considere la siguiente lista como una **línea base** que puede ampliar: si la traducción para una configuración regional específica es deficiente o no tiene éxito, investigue qué modelos admiten ese idioma o script de manera efectiva (consulte los recursos en línea o la documentación de su proveedor) y agregue esos ID de modelo como alternativas adicionales.

Esta lista fue **probada para una amplia cobertura de localidades** en un gran proyecto de documentación con 36 localidades objetivo; sirve como valor predeterminado práctico, pero no se garantiza que funcione bien en todas las localidades.

Ejemplo `translationModels` (mismos valores predeterminados que `npx ai-i18n-tools init`):

<details>
<summary>Lista predeterminada de alternativas para translationModels</summary>

```json
"translationModels": [
  "qwen/qwen3-235b-a22b-2507",
  "openai/gpt-4o-mini",
  "deepseek/deepseek-v4-flash",
  "anthropic/claude-3-haiku",
  "qwen/qwen3.6-plus",
  "anthropic/claude-3.5-haiku",
  "google/gemini-3-flash-preview",
  "~anthropic/claude-haiku-latest",
  "google/gemma-4-31b-it",
  "~anthropic/claude-sonnet-latest",
  "openai/gpt-5.3-codex"
  // … add more fallback models as needed
]
```

</details>

<br />

Establece la variable de entorno de la clave API del proveedor activo (ej. `OPENROUTER_API_KEY`) en tu entorno o archivo `.env`.

Antes de cambiar `translationModels`, ejecuta `npx ai-i18n-tools check-models`. Para cualquier proveedor, verifica cada ID de modelo configurado contra la lista actual de modelos del proveedor (`GET /models`), informa los IDs que faltan o que han superado `expiration_date`, enumera los modelos válidos y finaliza con un código distinto de cero si algún ID configurado no es válido. Cuando el proveedor devuelve precios (por ejemplo, OpenRouter), también muestra el costo estimado de entrada/salida (dólares estadounidenses por cada millón de tokens).

Para comparar los modelos configurados en un trabajo de traducción real, ejecute `npx ai-i18n-tools bench-models`. Traduce una muestra a través de cada modelo de forma aislada (en paralelo, limitado por `concurrency`) e imprime los tokens de entrada/salida por modelo, el tiempo real y el costo en USD, para que pueda sopesar la velocidad frente al precio antes de decidirse por un orden de `translationModels`.

<a id="features"></a>
### `features`

| Campo                | Canalización | Descripción                                                                                                                                                        |
|----------------------|----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `translateUIStrings` | 1        | Extraer `t("…")` / `i18n.t("…")` en `strings.json`, luego traducir las entradas y escribir JSON plano por configuración regional (la extracción se ejecuta automáticamente; usar `extract` independiente para actualizar solo el catálogo). |
| `translateDocs`      | 2        | Traducir páginas `.md` / `.mdx` / `.astro`; JSON del shell de Docusaurus cuando `docs[].docusaurusCatalogDir` está definido.                                                         |
| `translateJson`      | 3        | JSON anidado arbitrario bajo `json[]` (`translate-json`).                                                                                                           |
| `translateSVG`       | —        | Traducir archivos `.svg` (requiere el bloque `svg` de nivel superior).                                                                                                       |

**Traduce** archivos SVG con `translate-svg` cuando `features.translateSVG` es verdadero y se configura un bloque superior `svg`. El comando `sync` ejecuta ese paso cuando ambos están establecidos (a menos que `--no-svg`).

<a id="ui"></a>
### `ui`

- `sourceRoots`  
  Directorios o patrones glob (relativos a cwd) escaneados para llamadas a `t("…")`. Admite patrones como `src/` o `["src/**/*.ts"]`.
- `stringsJson`  
  Ruta al archivo maestro del catálogo. Actualizado por `extract`.
- `flatOutputDir`  
  Directorio donde se escriben los archivos JSON por locale (`de.json`, etc.).
- `preferredModel`  
  Opcional. ID del modelo que se intenta primero solo para `translate-ui`; luego los `translationModels` del proveedor activo en orden, sin duplicar este ID.
- `uiExtractor.funcNames` (o `reactExtractor.funcNames` heredado)  
  Nombres adicionales de funciones para escanear (predeterminado: `["t", "i18n.t"]`).
- `uiExtractor.extensions` (o `reactExtractor.extensions` heredado)  
  Extensiones de archivo a incluir (predeterminado: `[".js", ".jsx", ".ts", ".tsx"]`). Añade `.astro` para frontmatter de Astro y expresiones de plantilla.
- `uiExtractor.includePackageDescription` (o `reactExtractor.includePackageDescription` heredado)  
  Cuando está `true` (predeterminado), `extract` también incluye `package.json` `description` como cadena de interfaz cuando está presente.
- `uiExtractor.packageJsonPath` (o `reactExtractor.packageJsonPath` heredado)  
  Ruta personalizada al archivo `package.json` utilizado para la extracción opcional de descripciones.
- `uiExtractor.includeUiLanguageEnglishNames` (o `reactExtractor.includeUiLanguageEnglishNames` heredado)

Cuando `true` (predeterminado `false`), `extract` también agrega cada `englishName` del catálogo maestro de idiomas de la interfaz de usuario incluido (creado a partir de `sourceLocale` + `targetLocales`) a `strings.json` cuando aún no está presente en el análisis de origen (mismas claves hash). No lee `uiLanguagesPath`.

<a id="cachedir"></a>
### `cacheDir`

- `cacheDir`
Directorio de caché de SQLite (compartido por todos los bloques `docs`). Predeterminado `.translation-cache`. Reutilizar en varias ejecuciones. Si está migrando desde una caché de traducción de documentos personalizada, archívela o elimínela; `cacheDir` crea su propia base de datos SQLite y no es compatible con otros esquemas.

<a id="best-practice-for-git-exclusions"></a>
#### Mejor práctica para exclusiones en git:

- Excluya el contenido de la carpeta de caché de traducción (por ejemplo, usando `.gitignore` o `.git/info/exclude`) para evitar confirmar artefactos temporales de caché.
- Mantenga `cache.db` (no eliminarlo habitualmente), ya que conservar la caché SQLite evita volver a traducir segmentos sin cambios. Esto ahorra tiempo de ejecución y costos de API al actualizar o modificar software que usa `ai-i18n-tools`.
- Excluya archivos temporales y de registro para evitar confirmar archivos de respaldo y depuración.

<br/>

**Ejemplo:**

```gitignore
# Translation cache directory
.translation-cache/*

# Keep SQLite cache for reuse
!.translation-cache/cache.db

# Temporary and log files
*.tmp
*.log
```

<a id="docs"></a>
### `docs`

Matriz de bloques de la canalización de documentación. `translate-docs` y la fase de documentos de `sync` **procesan cada** bloque en orden. Las claves heredadas aún se aceptan en el momento de la carga y se reescriben cuando el archivo de configuración es editable; prefiera los nombres actuales en las nuevas configuraciones.

| Clave heredada | Clave/comportamiento actual |
| --- | --- |
| `documentations` | `docs` |
| `markdownOutput` | `docs[].docsOutput` |
| `jsonSource` | `docs[].docusaurusCatalogDir` |
| `openrouter` de nivel superior | `providers.openrouter` + `provider: "openrouter"` |
| `features.translateMarkdown` | `features.translateDocs` |
| `features.translateJSON` | eliminado (use `docs[].docusaurusCatalogDir` o `json[]`) |
| `features.extractUIStrings` | eliminado (`extract` se ejecuta antes de la traducción de la interfaz de usuario) |
| `glossary.uiGlossaryFromStringsJson` | `glossary.uiGlossary` |
| `ui.reactExtractor` | `ui.uiExtractor` (el alias aún se acepta) |
| `svg.svgExtractor.forceLowercase` | `svg.forceLowercase` |

**Fuentes de contenido**

- `description`
Nota opcional legible para humanos sobre este bloque (no se usa para traducción). Se antepone en el encabezado `translate-docs` `🌐` cuando se establece; también se muestra en los encabezados de sección de `status`.
- `contentPaths`
Cuerpos de páginas en Markdown/MDX y plantillas `.astro` a traducir (`translate-docs` analiza estos en busca de `.md`, `.mdx` y `.astro`). Admite **rutas de directorio o patrones globales** (por ejemplo, `"docs/**/*.md"`, `"guides/*.mdx"`, `"src/pages/index.astro"`). De ahí proviene la documentación localizada.
- `sourceFiles`
Alias opcional que se fusiona en `contentPaths` en tiempo de carga.
- `targetLocales`
Subconjunto opcional de configuraciones regionales solo para este bloque (en caso contrario, se usa la raíz `targetLocales`). Las configuraciones regionales efectivas de la documentación son la unión entre todos los bloques.
- `docusaurusCatalogDir`
Opcional. Directorio fuente para catálogos de etiquetas JSON de Docusaurus para este bloque (por ejemplo, `"i18n/en"` de `docusaurus write-translations`). Los cuerpos de página siempre provienen de `contentPaths`; `docusaurusCatalogDir` solo proporciona JSON de interfaz/estructura, no MDX.

**Estructura de salida**

- `outputDir`
Directorio raíz para la salida traducida de este bloque.
- `docsOutput.style`
`"nested"` (predeterminado), `"flat"`, `"doc-system"` o los alias `"docusaurus"` / `"astro-starlight"` / `"vitepress"`.
- `docsOutput.localeSubpath`
Segmento de ruta entre `{locale}/` y `{relativeToDocsRoot}` para `doc-system` (obligatorio cuando se usa `style: "doc-system"` directamente; preestablecido cuando se usa un alias). Use `""` para carpetas de configuración regional estilo Starlight.
- `docsOutput.docsRoot`
Raíz de documentos de origen para el diseño de Docusaurus (por ejemplo, `"docs"`). Predeterminado `"docs"` cuando se omite.
- `docsOutput.pathTemplate`
Ruta de salida de markdown personalizada. Marcadores de posición: <code>"{outputDir}"</code>, <code>"{locale}"</code>, <code>"{LOCALE}"</code>, <code>"{llocale}"</code>, <code>"{relPath}"</code>, <code>"{stem}"</code>, <code>"{basename}"</code>, <code>"{extension}"</code>, <code>"{docsRoot}"</code>, <code>"{relativeToDocsRoot}"</code>.
- `docsOutput.jsonPathTemplate`
Ruta de salida JSON personalizada para archivos de etiquetas. Admite los mismos marcadores de posición que `pathTemplate`.
- `docsOutput.localePathLowercase`
Cuando `true`, los diseños de salida integrados (`nested`, `flat`, `doc-system` sin `pathTemplate`) usan segmentos de configuración regional en minúsculas en las rutas. Predeterminado `false`; `astro-starlight` y `doc-system` con `localeSubpath` vacío se establecen de forma predeterminada en `true` en la carga de configuración.
- `docsOutput.flatPreserveRelativeDir`
Cuando `docsOutput.style = "flat"`, mantenga los subdirectorios de origen para que los archivos con el mismo nombre base no colisionen. Predeterminado `false`.
- `docsOutput.rewriteRelativeLinks`
Reescribe los enlaces relativos después de la traducción (habilitado automáticamente cuando `docsOutput.style = "flat"` y no hay `pathTemplate` personalizado).
- `docsOutput.linkRewriteDocsRoot`
Raíz del repositorio utilizada al calcular los prefijos de reescritura de enlaces planos. Normalmente, déjelo como `"."` a menos que su documentación traducida se encuentre bajo una raíz de proyecto diferente.
- `docsOutput.rewriteVitepressLinks`
Cuando `true`, ejecute el normalizador de enlaces de VitePress después de la traducción. Por defecto, está habilitado cuando `docsOutput.style` es `"vitepress"`. Úselo con cualquier diseño `doc-system` donde las carpetas de configuración regional se encuentren junto al inglés en `docsRoot`. Reescribe las rutas `docs/guide/…` de estilo README a rutas del sitio (`/guide/…`) y enlaces `../guide/…` relativos a la configuración regional. Para enlaces a archivos del repositorio fuera del árbol de VitePress (`LICENSE`, `examples/`), use URL completas en la fuente en inglés; consulte [Integración de VitePress — README como la página de inicio de la documentación](/guide/vitepress-integration#readme-as-homepage).

**Posprocesado**

- `docsOutput.postProcessing`
Transformaciones opcionales en el **cuerpo de markdown** traducido (las claves YAML y los valores de metadatos no textuales se conservan). Se ejecuta después del reensamblaje de segmentos y la reescritura de enlaces (planos o VitePress), y antes de `addFrontmatter`.
- `docsOutput.postProcessing.regexAdjustments`
Lista ordenada de `{ "description"?, "search", "replace" }`. `search` es un patrón de expresión regular (la cadena simple usa la bandera `g`, o `/pattern/flags`). `replace` admite marcadores de posición como `${translatedLocale}`, `${sourceLocale}`, `${sourceFullPath}`, `${translatedFullPath}`, `${sourceFilename}`, `${translatedFilename}`, `${sourceBasedir}`, `${translatedBasedir}`.
<a id="language-switcher-languagelistblock"></a>
- `docsOutput.postProcessing.languageListBlock`
`{ "start", "end", "separator", "label"? }` — regenera una fila de enlaces delimitada "leer en otros idiomas" en el markdown de origen y traducido. Requiere `uiLanguagesPath` (o un manifiesto en `ui.flatOutputDir/ui-languages.json`) para las etiquetas endónimas cuando `label: "local"`.

**Comportamiento y metadatos**

- `translateFrontmatterFields`
Al mismo nivel que `docsOutput` (por bloque `docs[]`). `true` predeterminado: traducir el texto YAML de cara al usuario para Starlight/Docusaurus (etiquetas `title`, `description`, `sidebar.label`, `sidebar_label`, `keywords`, `hero.title`, `hero.tagline`, `hero.image.alt`, `hero.actions[].text`, `pagination_label`, `prev`/`next`). Establezca `false` para mantener todo el bloque de metadatos sin cambios; pase una matriz de cadenas para restringir a rutas de puntos específicas.
- `segmentSplitting`
Al mismo nivel que `docsOutput` (por bloque `docs[]`). Segmentos opcionales más granulares para la extracción de `translate-docs`: `{ "enabled", "maxCharsPerSegment"?, "splitPipeTables"?, "splitDenseParagraphs"?, "maxLinesPerParagraphChunk"?, "splitLongLists"?, "maxListItemsPerChunk"?, "qualityRetrySplit"?, "maxQualityRetrySplitDepth"? }`. Cuando `enabled` es `true` (predeterminado cuando se omite `segmentSplitting`), los párrafos densos, las tablas de tuberías GFM (el primer fragmento incluye el encabezado, el separador y la primera fila de datos) y las listas largas se dividen; las subpartes se unen con saltos de línea únicos (`tightJoinPrevious`). Establezca `"enabled": false` para usar un segmento por bloque de cuerpo delimitado por línea en blanco solamente. Cuando `qualityRetrySplit` es `true` (predeterminado), los segmentos de markdown que fallan la validación AST después de que todos los modelos se agotan se dividen progresivamente y se reintentan desde el primer modelo; `maxQualityRetrySplitDepth` (`3` predeterminado) limita las divisiones recursivas.
- `warnMarkdownSourceIssues`
Cuando `true` (predeterminado cuando se omite), cada ejecución de `translate-docs` vuelve a escanear los segmentos de markdown en busca de delimitadores riesgosos / código en línea sin cerrar, imprime advertencias en la terminal y reemplaza las filas `markdown_source_issues` para la ruta de archivo de caché de ese archivo. Establezca `false` para omitir advertencias y actualizaciones de SQLite para este bloque.
- `addFrontmatter`
Cuando `true` (predeterminado cuando se omite), los archivos markdown traducidos incluyen las claves YAML: `translation_last_updated`, `source_file_mtime`, `source_file_hash`, `translation_language`, `source_file_path`, y cuando al menos un segmento tiene metadatos del modelo, `translation_models` (lista ordenada de IDs de modelo del proveedor activo). Establezca en `false` para omitir.
- `emphasisPlaceholders`
Por bloque `docs[]`. Cuando `true`, enmascara los delimitadores de énfasis de markdown como marcadores de posición antes de la traducción. Por defecto, `true` para configuraciones regionales CJK (`zh`, `ja`, `ko`) y para las configuraciones regionales enumeradas en `rtlLocales`; de lo contrario, por defecto, `false`. Se puede anular mediante CLI `--emphasis-placeholders` / `--no-emphasis-placeholders`.
- `rtlLocales`
Matriz opcional de códigos BCP-47 tratados como RTL para los valores predeterminados de marcador de posición de énfasis (fusionados con la detección de RTL incorporada).

<a id="protectattributes-protectkeys"></a>
- `protectAttributes`
Opcional. Nombres adicionales de atributos JSX/HTML cuyos **valores de cadena entre comillas** no deben enviarse al traductor. Se fusionan con los valores predeterminados integrados (`class`, `id`, `style`, `src`, `href`, `type`, `data-*`, la mayoría de `aria-*`, etc.). No distingue entre mayúsculas y minúsculas. Se aplica a:

- `.astro` extracción de parseo y reemplazo (etiquetas HTML estáticas y literales de cadena después de `attr=` dentro de bloques `{expression}`).
  - Extracción de marcadores de posición MDX durante la traducción de segmentos markdown/Astro (`label`, `tooltip`, y `aria-label` en etiquetas JSX en mayúsculas, además de `TabItem` `value` cuando sea aplicable).

Ejemplo: `"protectAttributes": ["variant", "size"]` mantiene `variant="primary"` dentro de `{items.map(...)}` sin cambios en todos los idiomas.

También puedes incluir atributos normalmente traducibles (por ejemplo `"title"` o `"aria-label"`) cuando desees que esos valores se copien textualmente del inglés.

- `protectKeys`
Opcional. Nombres adicionales de **propiedades de objeto** cuyos valores entre comillas no deben traducirse dentro de bloques de plantilla `{expression}` y literales de objeto MDX (por ejemplo `label:` dentro de `<Tabs values={[ … ]}>`). Se combina con los valores predeterminados integrados (`class`, `key`, `id`, `href`, `src`, etc.). No distingue entre mayúsculas y minúsculas.

Ejemplo: `"protectKeys": ["slug", "code"]` omite `{ slug: 'getting-started', title: 'Getting started' }` → solo se traduce `title` cuando `slug` está protegido.

<br/>

**Ejemplo (`docsOutput.style = "flat"` — rutas de capturas de pantalla + contenedor opcional con lista de idiomas):**

<details>
<summary>Ejemplo de postprocesamiento con diseño plano (capturas de pantalla + bloque de lista de idiomas)</summary>

```json
"docsOutput": {
  "style": "flat",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders",
        "search": "images/screenshots/[^/]+/",
        "replace": "images/screenshots/${translatedLocale}/"
      }
    ],
    "languageListBlock": {
      "start": "<small id=\"lang-list\">",
      "end": "</small>",
      "separator": " · ",
      "label": "local"
    }
  }
}
```

</details>

<a id="json"></a>
### `json`

Matriz de nivel superior de canalizaciones de traducción JSON anidadas. Se usa solo cuando `features.translateJson` es verdadero (`translate-json` o la etapa JSON de `sync`). Consulta [JSON](/guide/json).

| Campo | Descripción |
|-------|-------------|
| `description` | Nota opcional para CLI / `status` (no se traduce). |
| `contentPaths` | Archivos, directorios o patrones `.json` de origen bajo la raíz del proyecto. |
| `outputPathTemplate` | Ruta de salida requerida por configuración regional de destino. Marcadores de posición: `{locale}`, `{LOCALE}`, `{llocale}`, `{stem}`, `{basename}`, `{extension}`, `{relativeToSourceRoot}`. |
| `targetLocales` | Subconjunto opcional para este bloque; en caso contrario, raíz `targetLocales`. |
| `keyPolicy.mode` | `allowlist`, `denylist` o `both`. |
| `keyPolicy.translateKeys` | Rutas con notación de puntos o patrones glob a incluir cuando el modo es `allowlist` o `both`. |
| `keyPolicy.skipKeys` | Rutas con notación de puntos o patrones glob a excluir (la lista de denegación predeterminada incluye `id`, `slug`, `href`, `url`, `key`, `code`). |

<a id="svg"></a>
### `svg`

Rutas y estructura de nivel superior para archivos SVG. La traducción solo se ejecuta cuando `features.translateSVG` es verdadero (mediante `translate-svg` o la etapa SVG de `sync`).

| Campo            | Descripción                                                                                                                                                                                                                                                        |
|------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `sourcePath`     | Uno o más directorios **o patrones globales** (por ejemplo, `"images/*.svg"`, `"**/icons/*.svg"`). Los patrones se resuelven respecto a la raíz del proyecto y se escanean recursivamente en busca de archivos `.svg`.                                                                         |
| `outputDir`                   | Directorio raíz para la salida SVG traducida.                                                                                                                                                                                                                                          |
| `style`                       | `"flat"` o `"nested"` cuando `pathTemplate` no está definido.                                                                                                                                                                                                                               |
| `pathTemplate`   | Ruta de salida personalizada para SVG. Marcadores de posición: <code>"{outputDir}"</code>, <code>"{locale}"</code>, <code>"{LOCALE}"</code>, <code>"{llocale}"</code>, <code>"{relPath}"</code>, <code>"{stem}"</code>, <code>"{basename}"</code>, <code>"{extension}"</code>, <code>"{relativeToSourceRoot}"</code>. |
| `localePathLowercase` | Cuando es `true`, los diseños integrados de SVG `flat` / `nested` usan segmentos de idioma en minúsculas. Los valores personalizados de `pathTemplate` no cambian; use `{llocale}` para segmentos en minúsculas. |
| `forceLowercase` | Texto traducido en minúsculas durante la reensamblaje SVG. Útil para diseños que dependen de etiquetas completamente en minúsculas.                                                                                                                                                                                |

<a id="glossary"></a>
### `glossary`

| Campo          | Descripción                                                                                                                                                                 |
|----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `uiGlossary`   | Ruta a `strings.json` - crea automáticamente un glosario a partir de traducciones existentes.                                                                                                 |
| `userGlossary` | Ruta a un archivo CSV con columnas `Original language string` (o `en`), `locale`, `Translation` - una fila por término fuente y configuración regional objetivo (`locale` puede ser `*` para todos los destinos). |
| `autoAddUserEditedToGlossary` | Cuando `true`, las ediciones del panel de control a las cadenas de la interfaz de usuario se pueden añadir automáticamente al glosario del usuario. |

**Genere un archivo CSV de glosario vacío:**

```bash
npx ai-i18n-tools glossary-generate
```
