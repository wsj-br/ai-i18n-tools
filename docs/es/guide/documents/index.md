<a id="documents"></a>
# Documentos

Referencia de `translate-docs`, el pipeline para páginas Markdown, MDX, `.astro` y HTML simple listadas en bloques de configuración `docs[]`. El campo `contentPaths` de cada bloque enumera los archivos o carpetas a traducir. Esos archivos están escritos en `sourceLocale`, que puede ser cualquier idioma. El inglés en los ejemplos es solo una muestra. ¿Añadiendo idiomas a un sitio por primera vez? Empieza en [Añadir i18n a un sitio web o de documentación](/es/guide/add-i18n-to-website). Un README de repositorio y otros archivos Markdown, normalmente junto a una aplicación: [Añadir i18n a tu README y documentos Markdown](/es/guide/add-i18n-to-readme). Las páginas HTML simples (un archivo por cada configuración regional) se describen en [Páginas HTML](/es/guide/documents/html-pages).

Las cadenas de la interfaz del framework (barra de navegación, barra lateral, tema) se traducen en la misma ejecución, no mediante un pipeline separado. Las guías del framework en la tabla siguiente explican cómo lo hace cada uno: `docusaurusCatalogDir` para Docusaurus, `docsOutput.vitepressThemeCatalog` para VitePress, `docs[].nextraDictionaryPath` para Nextra, `docsOutput.fumadocsUiCatalog` para Fumadocs. Las etiquetas de la barra lateral de Nextra `_meta.ts` y Fumadocs `meta.json` se recopilan automáticamente. Astro Starlight incluye cadenas de interfaz de usuario integradas para muchas configuraciones regionales, y las anulaciones opcionales pueden usar `jsonPathTemplate` en un bloque `docs[]`.

Para imágenes PNG y otras imágenes rasterizadas incrustadas en markdown, consulte [Imágenes y capturas de pantalla](/es/guide/images-and-screenshots/). `translate-docs` solo traduce el texto alternativo; no copia archivos rasterizados.

Para un bloque opcional de **selector de idioma** en README o documentos, configure `docsOutput.style` en `"flat"`; consulte [Selector de idioma](/es/guide/documents/language-switcher).

Los archivos [SVG](/es/guide/svg-translation/) se traducen a través de [`translate-svg`](/es/reference/cli-commands/content#translate-svg) cuando `features.translateSVG` está habilitado, no a través de `docs[]` / `contentPaths`.

Los paquetes JSON de interfaz de usuario anidados arbitrarios no relacionados con las cadenas de shell/tema de un framework de documentación pertenecen a la canalización [JSON](/es/guide/json), no a `docs[]`.

Cada bloque de UI incluye su `strings.json` como sugerencias de glosario para la documentación de forma predeterminada (`uiGlossary`, valor predeterminado `true`). `translate-docs` reutiliza esas traducciones como sugerencias en los prompts de LLM cuando aparecen términos coincidentes en un segmento. Configure `uiGlossary` como `false` en un catálogo que deba excluirse de los prompts de documentos. El `glossary.userGlossary` opcional añade sobrescrituras CSV para los términos del producto (compartidas con `translate-ui` y `proofread-ui`). Las abreviaturas compactas de las etiquetas de UI usadas para ajustar columnas estrechas (por ejemplo, `Size` → `Tam`) siguen disponibles para la traducción de la UI, pero se omiten de las sugerencias del glosario de documentos. Genere un CSV inicial con `glossary-generate`, edite las filas en la pestaña [Glosario](/es/guide/translation-dashboard/glossary) del Panel de traducción, o consulte [Configuración — `glossary`](/es/reference/configuration#glossary) y [Glosario](/es/guide/glossary).

<a id="per-locale-model-overrides"></a>
### Anulaciones de modelo por configuración regional

`translate-docs` y el paso de documentación de `sync` resuelven los modelos **por cada configuración regional de destino**: primero `localeModels(locale)` si está configurado y, después, la cadena `translationModels` global del proveedor. Usa esta opción cuando un idioma específico necesite un modelo diferente al de tu lista de respaldo predeterminada; por ejemplo, si prefieres Gemini para la documentación en `pt-BR` cuando la cadena global tiene dificultades con el portugués. Consulta [Modelos de IA](/es/guide/ai-models#model-fallback-chain) y [Configuración - `localeModels`](/es/reference/configuration#provider-and-providers).

<a id="which-guide-to-read"></a>
## Qué guía leer

| Su configuración | Empiece aquí |
| --- | --- |
| Sitio de Docusaurus | `init -t ui-docusaurus`, `docsOutput.style = "docusaurus"` - [Docusaurus](/es/guide/integrations/docusaurus) |
| Sitio de VitePress | `init -t ui-vitepress` + `vitepressThemeCatalog` para el tema - [VitePress](/es/guide/integrations/vitepress) |
| Sitio de Nextra | `init -t ui-nextra` + `nextraDictionaryPath` para el diccionario (la barra lateral `_meta.ts` es automática) - [Nextra](/es/guide/integrations/nextra) |
| Sitio de Fumadocs | `init -t ui-fumadocs` + `fumadocsUiCatalog` para la interfaz de usuario (la barra lateral `meta.json` es automática) - [Fumadocs](/es/guide/integrations/fumadocs) |
| Astro Starlight | `init -t ui-starlight` - [Astro Starlight](/es/guide/integrations/astro#astro-starlight) |
| Páginas HTML plano | `init -t docs-plain-html` - [Páginas HTML](/es/guide/documents/html-pages) |
| Documentos planos (README, registros de cambios, etc.) | [Añadir i18n a tu README y documentos Markdown](/es/guide/add-i18n-to-readme) — `init -t docs-markdown` o `--with-readme`. Diseño: [Diseños de salida](/es/guide/documents/output-layouts), [selector de idioma](/es/guide/documents/language-switcher) |
| Dónde aterrizan los archivos traducidos | [Diseños de salida](/es/guide/documents/output-layouts) |
| Enlaces `#anchor` entre páginas | [Enlaces de anclaje](/es/guide/documents/anchor-links) |
| Reescritura de URL de enlaces y activos (`regexAdjustments`) | [Reescritura de enlaces](/es/guide/documents/link-rewriting) |
| Capturas de pantalla en documentos | [Imágenes y capturas de pantalla](/es/guide/images-and-screenshots/) |
| Terminología del producto y consistencia entre interfaz y documentación | [Configuración — `glossary`](/es/reference/configuration#glossary), [Glosario](/es/guide/glossary) |
| Banderas y caché de `translate-docs` | [Opciones de CLI](/es/guide/documents/cli-options) |

<a id="step-1-initialise-for-documentation"></a>
## Paso 1: Inicializar para la documentación

```bash
ai-i18n-tools init -t ui-docusaurus -P openai
```

Para sitios de documentación Astro Starlight:

```bash
ai-i18n-tools init -t ui-starlight -P cheaperinference
```

Para sitios de documentación de VitePress:

```bash
ai-i18n-tools init -t ui-vitepress -P anthropic
```

Configure `docsOutput.vitepressThemeCatalog` para las cadenas de navegación/barra lateral/pie de página; consulte [Integración de VitePress](/es/guide/integrations/vitepress).

Para sitios de documentación de Nextra:

```bash
ai-i18n-tools init -t ui-nextra -P gemini
```

Configure `docs[].nextraDictionaryPath` para las cadenas del diccionario de temas; consulte [Integración de Nextra](/es/guide/integrations/nextra). Las etiquetas de la barra lateral `_meta.ts` se recopilan automáticamente.

Para sitios de documentación de Fumadocs:

```bash
ai-i18n-tools init -t ui-fumadocs -P groq
```

Configure `docsOutput.fumadocsUiCatalog` para las anulaciones de la interfaz de usuario; consulte [Integración de Fumadocs](/es/guide/integrations/fumadocs). Las etiquetas de la barra lateral `meta.json` se recopilan automáticamente.

Para la interfaz de un sitio web Astro plano (sin Starlight):

```bash
ai-i18n-tools init -t ui-astro-website -P ollama
```

Esa plantilla solo permite la extracción de la interfaz de usuario. Para la traducción de HTML de páginas, también configura `features.translateDocs` y añade un bloque `docs[]` (consulta [Páginas de sitio web de Astro (analizar y reemplazar)](/es/guide/ui-strings/astro-website#pages-parse-and-replace)). La configuración [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) muestra ambos pipelines juntos.

Edite el `ai-i18n-tools.config.json` generado:

- `provider` y `providers` — `init -P <provider>` genera la estructura de ese ajuste preestablecido; establece su clave de API antes de `translate-docs` o `sync` (Ollama no necesita ninguna clave). Consulta [Proveedor y clave de API](/es/guide/quick-start#provider-and-api-key), [Proveedores de LLM](/es/guide/providers-and-models) y [Modelos de IA](/es/guide/ai-models).
- `sourceLocale` - idioma de origen (debe coincidir con `defaultLocale` en `docusaurus.config.js`).
- `targetLocales` - array de códigos de configuración regional BCP-47 (p. ej., `["de", "fr", "es"]`).
- `cacheDir` - directorio de caché de SQLite compartido para todas las canalizaciones (y directorio de registros predeterminado para `--write-logs`).
- `docs` - array de bloques de documentación. Cada bloque tiene `description` opcional, `contentPaths` (cadena o array; archivo, directorio o patrón), `outputDir`, `docusaurusCatalogDir` opcional, `docsOutput`, `segmentSplitting` opcional, `translateFrontmatterFields`, `protectAttributes`, `protectKeys`, `targetLocales`, `addFrontmatter`, etc.
- `docs[].description` - nota breve opcional para los mantenedores. Cuando se establece, aparece en el titular de `translate-docs` y en los encabezados de sección de `status`.
- `docs[].contentPaths` - fuentes de markdown/MDX/`.astro` (y `docusaurusCatalogDir` opcional para JSON de shell de Docusaurus).
- `docs[].outputDir` - raíz de salida traducida para ese bloque.
- `docs[].docsOutput.style` - `"nested"` (predeterminado), `"flat"`, `"doc-system"`, o los alias `"docusaurus"` / `"astro-starlight"` / `"vitepress"` / `"nextra"` / `"fumadocs"` (consulte [Diseños de salida](/es/guide/documents/output-layouts)).
- `ui[].uiGlossary` - cuando es `true` (el valor predeterminado), el `strings.json` de ese bloque proporciona sugerencias de terminología para los segmentos del documento (consulte [Configuración — `ui`](/es/reference/configuration#ui)).
- `glossary.userGlossary` - CSV opcional para traducciones fijas de términos del producto; también lo usan las canalizaciones de UI y se puede editar en la pestaña [Glosario](/es/guide/translation-dashboard/glossary) del panel.

**Principal frente a suplementario:** Enfóquese en `contentPaths` para páginas localizadas. Establezca `docusaurusCatalogDir` cuando también necesite JSON del shell de Docusaurus desde `write-translations`. Omita `docusaurusCatalogDir` si solo traduce páginas.

<a id="step-2-translate-documents"></a>
## Paso 2: Traducir documentos

```bash
ai-i18n-tools translate-docs
```

Esto traduce todos los archivos en el `contentPaths` de cada bloque `docs[]` (y el JSON del catálogo de Docusaurus cuando se establece `docusaurusCatalogDir`) a todas las configuraciones regionales de documentación efectivas. Los segmentos ya traducidos se sirven desde la caché de SQLite; solo los segmentos nuevos o modificados se envían al LLM.

Para traducir un solo idioma:

```bash
ai-i18n-tools translate-docs --locale de
```

Para comprobar qué necesita traducción:

```bash
ai-i18n-tools status
```

Para conocer las banderas, el comportamiento de la caché y el formato de solicitud por lotes, consulte [Opciones de la CLI](/es/guide/documents/cli-options).

<a id="complex-markdown-and-failed-quality-checks"></a>
## Markdown complejo y comprobaciones de calidad fallidas

`translate-docs` comprueba que cada segmento traducido conserve la estructura de Markdown (incluido el énfasis analizado del documento) y que los tokens de marcador de posición internos se restauren limpiamente. Los párrafos que apilan muchos `bold` alrededor de `` `inline code` ``, anidan comillas invertidas dentro de negritas (por ejemplo, literales de plantilla como `` `fetch(\`/locales/${code}.json\`)` ``), o entrelazan negritas y código a través de una oración larga son frágiles: algunas configuraciones regionales necesitan un orden de palabras diferente, lo que puede cambiar cómo `**` y `` ` `` se alinean después de la traducción y desencadenar errores de CLI como `AST mismatch`.

Después de la restauración, `translate-docs` también rechaza los segmentos en los que se reutilizaron o eliminaron los marcadores de posición de etiquetas HTML (por lo que las etiquetas restauradas ya no coinciden con el mapa de origen) o donde el modelo inventó tokens de doble llave sobrantes que no estaban en el origen (por ejemplo, un token de estilo de glosario inventado). Las comprobaciones previas a la restauración requieren el mismo multiconjunto de tokens <code v-pre>{{…}}</code> y la misma subsecuencia ordenada de tokens estructurales (<code v-pre>{{HTM_N}}</code>, marcadores de advertencia); los tokens de contenido como <code v-pre>{{ILC_N}}</code>, <code v-pre>{{URL_N}}</code> y los marcadores de énfasis como <code v-pre>{{SE}}</code> pueden moverse con el orden natural de las palabras cuando cada ID/recuento de tipo sigue coincidiendo. Esos fallos utilizan la misma ruta de reserva del modelo que los tokens internos oficiales sobrantes.

**Si encuentra ese tipo de error de validación, prefiera simplificar el texto en el idioma de origen** (divida el párrafo, mueva un ejemplo a un bloque de código delimitado o describa la misma idea con menos pares de negrita/código en capas) en lugar de esperar que cada modelo y configuración regional reproduzcan perfectamente el marcado en línea denso.

Cuando todos los modelos configurados fallan con un `AST mismatch` en el mismo segmento, `translate-docs` puede dividir automáticamente ese segmento en partes más pequeñas (primero el punto medio de la lista, luego elementos individuales de la lista o fragmentos más cortos de párrafo), volver a intentar cada parte desde el primer modelo y volver a unir el resultado bajo la clave original de caché del segmento. Esta función está activada por defecto (`segmentSplitting.qualityRetrySplit`); establézcala en `false` para detenerse tras agotar todos los modelos. El resumen de ejecución informa `Quality split retries` cuando se ejecuta este mecanismo de respaldo.

Para ver **qué segmentos fallaron**, con qué frecuencia y los **mensajes de calidad/error** almacenados, use la pestaña **Fallos** del Panel de traducción ([Panel de traducción → Fallos](/es/guide/translation-dashboard/failures#failures-document-translation)).
