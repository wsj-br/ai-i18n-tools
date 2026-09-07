<a id="documents"></a>
# Documentos

Diseñado principalmente para **documentación de markdown, MDX y `.astro`** gestionada a través de bloques de configuración de `docs[]`. El campo `contentPaths` de cada bloque enumera los archivos o carpetas a traducir.

En los sitios de [Docusaurus](/es/guide/integrations/docusaurus), también configure `docusaurusCatalogDir` en su carpeta de catálogo `write-translations` (por ejemplo, `docs-site/i18n/en`). Entonces `translate-docs` también incluye JSON de shell: barra de navegación, pie de página y cadenas de tema.

En los sitios de [VitePress](/es/guide/integrations/vitepress), los cuerpos de las páginas utilizan la misma canalización `docs[]`. Las etiquetas de navegación, barra lateral y pie de página se encuentran en `docsOutput.vitepressThemeCatalog`: `translate-docs` arranca el catálogo en inglés y lo traduce junto con las páginas, sin una canalización separada.

En los sitios de [Nextra](/es/guide/integrations/nextra), los cuerpos de las páginas utilizan la misma canalización `docs[]` con `docsOutput.style: "nextra"`. Las etiquetas de la barra lateral de `_meta.ts` son recopiladas y traducidas automáticamente por `translate-docs`; las cadenas del diccionario del tema se traducen a través de `docs[].nextraDictionaryPath` en la misma canalización.

En los sitios de [Fumadocs](/es/guide/integrations/fumadocs), los cuerpos de las páginas utilizan `docsOutput.style: "fumadocs"` con `fumadocsParser` `"dot"` (predeterminado) o `"dir"`. Las etiquetas de la barra lateral de `meta.json` se recopilan automáticamente; las anulaciones de la interfaz de usuario se traducen a través de `docsOutput.fumadocsUiCatalog`.

En los sitios de [Astro Starlight](/es/guide/integrations/astro#astro-starlight), los cuerpos de las páginas usan `docsOutput.style: "astro-starlight"` con `docsRoot` en la raíz de su contenido de Starlight (normalmente `src/content/docs/`). `translate-docs` escribe markdown/MDX localizado bajo `src/content/docs/<locale>/` junto al árbol en inglés. Starlight incluye cadenas de interfaz de usuario integradas para muchas configuraciones regionales; no hay una canalización de catálogo de temas separada; las anulaciones opcionales de la interfaz de usuario pueden usar `jsonPathTemplate` en un bloque `docs[]` para `src/content/i18n/en.json`.

Para imágenes PNG y otras imágenes rasterizadas incrustadas en markdown, consulte [Imágenes y capturas de pantalla](/es/guide/images-and-screenshots/). `translate-docs` solo traduce el texto alternativo; no copia archivos rasterizados.

Para un bloque opcional de **selector de idioma** en README o documentos, configure `docsOutput.style` en `"flat"`; consulte [Selector de idioma](/es/guide/documents/language-switcher).

Los archivos [SVG](/es/guide/svg-translation/) se traducen a través de [`translate-svg`](/es/reference/cli-commands/content#translate-svg) cuando `features.translateSVG` está habilitado, no a través de `docs[]` / `contentPaths`.

Los paquetes JSON de interfaz de usuario anidados arbitrarios no relacionados con las cadenas de shell/tema de un framework de documentación pertenecen a la canalización [JSON](/es/guide/json), no a `docs[]`.

Para lograr una **coherencia terminológica** entre la interfaz de usuario y la documentación, configure `glossary.uiGlossary` en la ruta de su `strings.json`; `translate-docs` reutiliza las traducciones de interfaz de usuario existentes como sugerencias en las indicaciones del LLM cuando aparecen términos coincidentes en un segmento. La opción `glossary.userGlossary` añade anulaciones de CSV para los términos del producto (compartidos con `translate-ui` y `proofread-ui`). Las abreviaturas compactas de etiquetas de interfaz de usuario utilizadas para ajustarse a columnas estrechas (por ejemplo, `Size` → `Tam`) permanecen disponibles para la traducción de la interfaz de usuario, pero se omiten de las sugerencias del glosario del documento. Genere un CSV inicial con `glossary-generate`, edite las filas en la pestaña **Glosario** del Panel de traducción, o consulte [Configuración — `glossary`](/es/reference/configuration#glossary) y [Glosario](/es/guide/translation-dashboard/glossary).

<a id="per-locale-model-overrides"></a>
### Anulaciones de modelo por configuración regional

`translate-docs` y el paso de documentos de `sync` resuelven modelos **por configuración regional de destino**: primero `localeModels(locale)` cuando está configurado, luego la cadena global `translationModels` del proveedor. Use esto cuando un idioma específico necesite un modelo diferente a su lista de reserva predeterminada; por ejemplo, prefiriendo Gemini para la documentación de `pt-BR` cuando la cadena global tiene dificultades con el portugués. Consulte [Proveedores y modelos](/es/guide/providers-and-models#model-fallback-chain) y [Configuración - `localeModels`](/es/reference/configuration#provider-and-providers).

<a id="which-guide-to-read"></a>
## Qué guía leer

| Su configuración | Empiece aquí |
| --- | --- |
| Sitio de Docusaurus | `init -t ui-docusaurus`, `docsOutput.style = "docusaurus"` - [Docusaurus](/es/guide/integrations/docusaurus) |
| Sitio de VitePress | `init -t ui-vitepress` + `vitepressThemeCatalog` para el tema - [VitePress](/es/guide/integrations/vitepress) |
| Sitio de Nextra | `init -t ui-nextra` + `nextraDictionaryPath` para el diccionario (la barra lateral `_meta.ts` es automática) - [Nextra](/es/guide/integrations/nextra) |
| Sitio de Fumadocs | `init -t ui-fumadocs` + `fumadocsUiCatalog` para la interfaz de usuario (la barra lateral `meta.json` es automática) - [Fumadocs](/es/guide/integrations/fumadocs) |
| Astro Starlight | `init -t ui-starlight` - [Astro Starlight](/es/guide/integrations/astro#astro-starlight) |
| Documentos planos (README, registros de cambios, etc.) | `docsOutput.style = "flat"` - [Diseños de salida](/es/guide/documents/output-layouts), [selector de idioma](/es/guide/documents/language-switcher) opcional |
| Dónde aterrizan los archivos traducidos | [Diseños de salida](/es/guide/documents/output-layouts) |
| Enlaces `#anchor` entre páginas | [Enlaces de anclaje](/es/guide/documents/anchor-links) |
| Reescritura de URL de enlaces y activos (`regexAdjustments`) | [Reescritura de enlaces](/es/guide/documents/link-rewriting) |
| Capturas de pantalla en documentos | [Imágenes y capturas de pantalla](/es/guide/images-and-screenshots/) |
| Terminología de productos y coherencia de UI/documentos | [Configuración — `glossary`](/es/reference/configuration#glossary), [Glosario](/es/guide/translation-dashboard/glossary) |
| Banderas y caché de `translate-docs` | [Opciones de CLI](/es/guide/documents/cli-options) |

<a id="step-1-initialise-for-documentation"></a>
## Paso 1: Inicializar para la documentación

```bash
ai-i18n-tools init -t ui-docusaurus [-P <provider>]
```

Para sitios de documentación Astro Starlight:

```bash
ai-i18n-tools init -t ui-starlight [-P <provider>]
```

Para sitios de documentación de VitePress:

```bash
ai-i18n-tools init -t ui-vitepress [-P <provider>]
```

Configure `docsOutput.vitepressThemeCatalog` para las cadenas de navegación/barra lateral/pie de página; consulte [Integración de VitePress](/es/guide/integrations/vitepress).

Para sitios de documentación de Nextra:

```bash
ai-i18n-tools init -t ui-nextra [-P <provider>]
```

Configure `docs[].nextraDictionaryPath` para las cadenas del diccionario de temas; consulte [Integración de Nextra](/es/guide/integrations/nextra). Las etiquetas de la barra lateral `_meta.ts` se recopilan automáticamente.

Para sitios de documentación de Fumadocs:

```bash
ai-i18n-tools init -t ui-fumadocs [-P <provider>]
```

Configure `docsOutput.fumadocsUiCatalog` para las anulaciones de la interfaz de usuario; consulte [Integración de Fumadocs](/es/guide/integrations/fumadocs). Las etiquetas de la barra lateral `meta.json` se recopilan automáticamente.

Para la interfaz de un sitio web Astro plano (sin Starlight):

```bash
ai-i18n-tools init -t ui-astro-website [-P <provider>]
```

Esa plantilla solo permite la extracción de la interfaz de usuario. Para la traducción de HTML de páginas, también configure `features.translateDocs` y agregue un bloque `docs[]` (consulte [Páginas del sitio web de Astro (analizar y reemplazar)](/es/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace)). La configuración de [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) muestra ambas canalizaciones juntas.

Edite el `ai-i18n-tools.config.json` generado:

- `provider` y `providers` — `init` genera un bloque de proveedor predeterminado (`openrouter` a menos que pase `-P <provider>`); configure al menos un proveedor y establezca su clave API antes de `translate-docs` o `sync` (Ollama no necesita clave). Consulte [Proveedor y clave API](/es/guide/quick-start#provider-and-api-key) y [Proveedores y modelos de LLM](/es/guide/providers-and-models).
- `sourceLocale` - idioma de origen (debe coincidir con `defaultLocale` en `docusaurus.config.js`).
- `targetLocales` - matriz de códigos de configuración regional BCP-47 (por ejemplo, `["de", "fr", "es"]`).
- `cacheDir` - directorio de caché SQLite compartido para todas las canalizaciones (y directorio de registro predeterminado para `--write-logs`).
- `docs` - array de bloques de documentación. Cada bloque tiene `description` opcional, `contentPaths` (cadena o array; archivo, directorio o patrón), `outputDir`, `docusaurusCatalogDir` opcional, `docsOutput`, `segmentSplitting` opcional, `translateFrontmatterFields`, `protectAttributes`, `protectKeys`, `targetLocales`, `addFrontmatter`, etc.
- `docs[].description` - nota breve opcional para los mantenedores. Cuando se establece, aparece en el titular de `translate-docs` y en los encabezados de sección de `status`.
- `docs[].contentPaths` - fuentes de markdown/MDX/`.astro` (y `docusaurusCatalogDir` opcional para JSON de shell de Docusaurus).
- `docs[].outputDir` - raíz de salida traducida para ese bloque.
- `docs[].docsOutput.style` - `"nested"` (predeterminado), `"flat"`, `"doc-system"`, o alias `"docusaurus"` / `"astro-starlight"` / `"vitepress"` / `"nextra"` / `"fumadocs"` (consulte [Diseños de salida](/es/guide/documents/output-layouts)).
- `glossary.uiGlossary` - ruta a `strings.json` para que los segmentos de documentos obtengan sugerencias de terminología de su catálogo de UI (consulte [Configuración — `glossary`](/es/reference/configuration#glossary)).
- `glossary.userGlossary` - CSV opcional para traducciones de términos de productos fijos; también utilizado por las canalizaciones de UI y editable en la pestaña del panel [Glosario](/es/guide/translation-dashboard/glossary).

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
