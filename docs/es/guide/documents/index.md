<a id="documents"></a>
# Documentos

Diseñado principalmente para **documentación de markdown, MDX y `.astro`** gestionada a través de bloques de configuración de `docs[]`. El campo `contentPaths` de cada bloque enumera los archivos o carpetas a traducir.

En los sitios de Docusaurus, también configure `docusaurusCatalogDir` en su carpeta de catálogo de `write-translations` (por ejemplo, `docs-site/i18n/en`). Entonces `translate-docs` también incluye JSON de shell — cadenas de la barra de navegación, el pie de página y el tema.

En los sitios de [VitePress](/guide/vitepress-integration), los cuerpos de las páginas utilizan la misma canalización `docs[]`. Las etiquetas de navegación, barra lateral y pie de página se encuentran en `docsOutput.vitepressThemeCatalog`; `translate-docs` arranca el catálogo en inglés y lo traduce junto con las páginas, sin una canalización separada.

En los sitios de [Nextra](/guide/nextra-integration), los cuerpos de las páginas utilizan la misma canalización `docs[]` con `docsOutput.style: "nextra"`. Las etiquetas de la barra lateral de `_meta.ts` son recopiladas y traducidas automáticamente por `translate-docs`; las cadenas del diccionario del tema se traducen a través de `docs[].nextraDictionaryPath` en la misma canalización.

En los sitios de [Fumadocs](/guide/fumadocs-integration), los cuerpos de las páginas usan `docsOutput.style: "fumadocs"` con `fumadocsParser` `"dot"` (predeterminado) o `"dir"`. Las etiquetas de la barra lateral de `meta.json` se recopilan automáticamente; las anulaciones de la interfaz de usuario se traducen a través de `docsOutput.fumadocsUiCatalog`.

Para imágenes PNG y otras imágenes rasterizadas incrustadas en markdown, consulte [Imágenes y capturas de pantalla](/guide/images-and-screenshots/). `translate-docs` solo traduce el texto alternativo; no copia archivos rasterizados.

Para un bloque opcional de **selector de idioma** en README o documentos, configure `docsOutput.style` en `"flat"` — consulte [Selector de idioma](/guide/documents/language-switcher).

Los archivos SVG se traducen a través de [`translate-svg`](/reference/cli-commands) cuando `features.translateSVG` está habilitado — no a través de `docs[]` / `contentPaths`.

Los paquetes JSON de interfaz de usuario anidados arbitrarios no relacionados con las cadenas de shell/tema de un framework de documentación pertenecen a la canalización [JSON](/guide/json), no a `docs[]`.

<a id="per-locale-model-overrides"></a>
### Anulaciones de modelo por configuración regional

`translate-docs` y el paso de documentación de `sync` resuelven los modelos **por configuración regional de destino**: primero `localeModels(locale)` cuando está configurado, luego la cadena global `translationModels` del proveedor. Utilice esto cuando un idioma específico necesite un modelo diferente al de su lista de reserva predeterminada; por ejemplo, prefiriendo Gemini para la documentación de `pt-BR` cuando la cadena global tiene dificultades con el portugués. Consulte [Proveedores y modelos](/guide/providers-and-models#model-fallback-chain) y [Configuración — `localeModels`](/reference/configuration#provider-and-providers).

<a id="which-guide-to-read"></a>
## Qué guía leer

| Su configuración | Empiece aquí |
| --- | --- |
| Sitio de Docusaurus | `init -t ui-docusaurus`, `docsOutput.style = "docusaurus"` — [Paso 1](#step-1-initialise-for-documentation) |
| Sitio de VitePress | `init -t ui-vitepress` + `vitepressThemeCatalog` para el tema — [Integración de VitePress](/guide/vitepress-integration) |
| Sitio de Nextra | `init -t ui-nextra` + `nextraDictionaryPath` para el diccionario (la barra lateral `_meta.ts` es automática) — [Integración de Nextra](/guide/nextra-integration) |
| Sitio de Fumadocs | `init -t ui-fumadocs` + `fumadocsUiCatalog` para la interfaz de usuario (la `meta.json` de la barra lateral es automática) — [Integración de Fumadocs](/guide/fumadocs-integration) |
| Astro Starlight | `init -t ui-starlight` — [Paso 1](#step-1-initialise-for-documentation) |
| Documentos planos (README, registros de cambios, etc.) | `docsOutput.style = "flat"` — [Diseños de salida](/guide/documents/output-layouts), [selector de idioma](/guide/documents/language-switcher) opcional |
| Dónde aterrizan los archivos traducidos | [Diseños de salida](/guide/documents/output-layouts) |
| Enlaces `#anchor` entre páginas | [Enlaces de anclaje](/guide/documents/anchor-links) |
| Reescritura de URL de enlaces y activos (`regexAdjustments`) | [Reescritura de enlaces](/guide/documents/link-rewriting) |
| Capturas de pantalla en documentos | [Imágenes y capturas de pantalla](/guide/images-and-screenshots/) |
| Banderas y caché de `translate-docs` | [Opciones de CLI](/guide/documents/cli-options) |

<a id="step-1-initialise-for-documentation"></a>
## Paso 1: Inicializar para la documentación

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

Para sitios de documentación Astro Starlight:

```bash
npx ai-i18n-tools init -t ui-starlight
```

Para sitios de documentación de VitePress:

```bash
npx ai-i18n-tools init -t ui-vitepress
```

Establezca `docsOutput.vitepressThemeCatalog` para las cadenas de navegación/barra lateral/pie de página — consulte [Integración de VitePress](/guide/vitepress-integration).

Para sitios de documentación de Nextra:

```bash
npx ai-i18n-tools init -t ui-nextra
```

Establezca `docs[].nextraDictionaryPath` para las cadenas del diccionario de temas; consulte [Integración de Nextra](/guide/nextra-integration). Las etiquetas `_meta.ts` de la barra lateral se recopilan automáticamente.

Para sitios de documentación de Fumadocs:

```bash
npx ai-i18n-tools init -t ui-fumadocs
```

Establezca `docsOutput.fumadocsUiCatalog` para las anulaciones de la interfaz de usuario; consulte [Integración de Fumadocs](/guide/fumadocs-integration). Las etiquetas `meta.json` de la barra lateral se recopilan automáticamente.

Para la interfaz de un sitio web Astro plano (sin Starlight):

```bash
npx ai-i18n-tools init -t ui-astro-website
```

Esa plantilla solo permite la extracción de la interfaz de usuario. Para la traducción de HTML de páginas, también configure `features.translateDocs` y agregue un bloque `docs[]` (consulte [Páginas del sitio web de Astro (analizar y reemplazar)](/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace)). La configuración de [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) muestra ambas canalizaciones juntas.

Edite el `ai-i18n-tools.config.json` generado:

- `sourceLocale` - idioma de origen (debe coincidir con `defaultLocale` en `docusaurus.config.js`).
- `targetLocales` - matriz de códigos de localización BCP-47 (por ejemplo, `["de", "fr", "es"]`).
- `cacheDir` - directorio compartido de caché SQLite para todas las canalizaciones (y directorio predeterminado de registros para `--write-logs`).
- `docs` - matriz de bloques de documentación. Cada bloque tiene `description`, `contentPaths` (cadena o matriz; archivo, directorio o patrón), `outputDir`, `docusaurusCatalogDir` opcional, `docsOutput`, `segmentSplitting` opcional, `translateFrontmatterFields`, `protectAttributes`, `protectKeys`, `targetLocales`, `addFrontmatter`, etc.
- `docs[].description` - nota corta opcional para los mantenedores. Cuando se establece, aparece en el titular de `translate-docs` y en los encabezados de sección de `status`.
- `docs[].contentPaths` - fuentes markdown/MDX/`.astro` (y `docusaurusCatalogDir` opcional para JSON de shell de Docusaurus).
- `docs[].outputDir` - raíz de salida traducida para ese bloque.
- `docs[].docsOutput.style` - `"nested"` (predeterminado), `"flat"`, `"doc-system"`, o los alias `"docusaurus"` / `"astro-starlight"` / `"vitepress"` / `"nextra"` / `"fumadocs"` (ver [Diseños de salida](/guide/documents/output-layouts)).

**Principal frente a suplementario:** Enfóquese en `contentPaths` para páginas localizadas. Establezca `docusaurusCatalogDir` cuando también necesite JSON del shell de Docusaurus desde `write-translations`. Omita `docusaurusCatalogDir` si solo traduce páginas.

<a id="step-2-translate-documents"></a>
## Paso 2: Traducir documentos

```bash
npx ai-i18n-tools translate-docs
```

Esto traduce todos los archivos en el `docs[]` de cada bloque `contentPaths` (y el JSON del catálogo de Docusaurus cuando se establece `docusaurusCatalogDir`) a todas las configuraciones regionales de documentación efectivas. Los segmentos ya traducidos se sirven desde la caché de SQLite; solo los segmentos nuevos o modificados se envían al LLM.

Para traducir un solo idioma:

```bash
npx ai-i18n-tools translate-docs --locale de
```

Para comprobar qué necesita traducción:

```bash
npx ai-i18n-tools status
```

Para conocer las banderas, el comportamiento de la caché y el formato de solicitud por lotes, consulte [Opciones de la CLI](/guide/documents/cli-options).

<a id="complex-markdown-and-failed-quality-checks"></a>
## Markdown complejo y comprobaciones de calidad fallidas

`translate-docs` verifica que cada segmento traducido preserve la estructura de markdown (incluido el énfasis analizado desde el documento). Párrafos que acumulan muchos elementos `bold` alrededor de `` `inline code` ``, anidan comillas invertidas dentro de negritas (por ejemplo, literales de plantilla como `` `fetch(\`/locales/${code}.json\`)` ``), o entrelazan negritas y código en una oración larga son frágiles: algunas configuraciones regionales necesitan un orden de palabras diferente, lo cual puede alterar cómo coinciden `**` y `` ` `` tras la traducción y provocar errores en la CLI como `AST mismatch`.

**Si encuentra este tipo de error de validación, prefiera simplificar el texto en el idioma de origen** —divida el párrafo, mueva un ejemplo a un bloque de código cercado o describa la misma idea con menos pares de negrita/código en capas— en lugar de esperar que cada modelo y configuración regional reproduzca perfectamente el marcado en línea denso.

Cuando todos los modelos configurados fallan con un `AST mismatch` en el mismo segmento, `translate-docs` puede dividir automáticamente ese segmento en partes más pequeñas (primero el punto medio de la lista, luego elementos individuales de la lista o fragmentos más cortos de párrafo), volver a intentar cada parte desde el primer modelo y volver a unir el resultado bajo la clave original de caché del segmento. Esta función está activada por defecto (`segmentSplitting.qualityRetrySplit`); establézcala en `false` para detenerse tras agotar todos los modelos. El resumen de ejecución informa `Quality split retries` cuando se ejecuta este mecanismo de respaldo.

Para ver **qué segmentos fallaron**, con qué frecuencia y los **mensajes de calidad/error** almacenados, use la pestaña **Fallos** del Panel de traducción ([Panel de traducción → Fallos](/guide/translation-dashboard/failures#failures-document-translation)).
