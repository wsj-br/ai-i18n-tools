<a id="integrations"></a>
# Integraciones

Guías específicas de cada framework para integrar ai-i18n-tools en sitios de documentación y proyectos Astro. Cada integración utiliza la canalización [Documentos](/es/guide/documents/) (`translate-docs` / `sync`) para el contenido de la página; las cadenas de shell (navegación, barra lateral, tema) se manejan dentro de esa misma canalización cuando se indica, no a través de la canalización [JSON](/es/guide/json) separada.

<a id="which-guide-to-read"></a>
## Qué guía leer

| Su sitio | Plantilla de inicio | Empiece aquí |
| --- | --- | --- |
| Astro Starlight o Astro simple | Cadenas de UI `ui-starlight` / híbridas | [Astro](/es/guide/integrations/astro) |
| Docusaurus | `ui-docusaurus` | [Docusaurus](/es/guide/integrations/docusaurus) |
| VitePress | `ui-vitepress` | [VitePress](/es/guide/integrations/vitepress) |
| Nextra 4 (Next.js App Router) | `ui-nextra` | [Nextra](/es/guide/integrations/nextra) |
| Fumadocs 4 (Next.js App Router) | `ui-fumadocs` | [Fumadocs](/es/guide/integrations/fumadocs) |

<a id="shared-concepts"></a>
## Conceptos compartidos

Todas las integraciones de frameworks de documentación comparten el mismo modelo de bloque `docs[]` descrito en [Documentos](/es/guide/documents/). Establezca `docsOutput.style` para que coincida con su framework (`"docusaurus"`, `"vitepress"`, `"nextra"`, `"fumadocs"` o `"astro-starlight"`). Para el diseño de la carpeta de salida y el comportamiento de reescritura de enlaces, consulte [Diseños de salida](/es/guide/documents/output-layouts) y [Reescritura de enlaces](/es/guide/documents/link-rewriting).

Cada plantilla `init -t ui-*` genera un bloque de proveedor de LLM predeterminado (`openrouter` a menos que pase `-P <provider>`). Antes de `translate-docs` o `sync`, configure `provider` / `providers` si es necesario y establezca la clave API correspondiente; consulte [Proveedor y clave API](/es/guide/quick-start#provider-and-api-key).

Consulte [Traducción de shell de framework](#framework-shell-translation) para una comparación entre frameworks. Cada guía enlazada a continuación cubre la configuración para ese framework.

<a id="framework-shell-translation"></a>
## Traducción del shell del framework

| Framework | Cadenas de shell / tema | Pipeline |
|-----------|----------------------|----------|
| Docusaurus | Catálogo `write-translations` (`{ message, description }`) | Documentos — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | Catálogo de tema/navegación/barra lateral | Documentos — `docsOutput.vitepressThemeCatalog` + `translate-docs` |
| Nextra | Etiquetas de barra lateral `_meta.ts` | Documentos — automático cuando `style: "nextra"` + `translate-docs` |
| Nextra | Diccionario de tema `.ts` | Documentos — `docs[].nextraDictionaryPath` + `translate-docs` |
| Fumadocs | Etiquetas de barra lateral `meta.json` | Documentos — automático cuando `style: "fumadocs"` + `translate-docs` |
| Fumadocs | Catálogo de anulaciones de UI | Documentos — `docsOutput.fumadocsUiCatalog` + `translate-docs` |
| Astro Starlight | Cadenas de UI integradas (muchas configuraciones regionales); sin pipeline de shell adicional | Documentos — `translate-docs` (solo páginas) |

**No** ponga cadenas de shell/tema de framework en `json[]`; esa canalización es para paquetes de configuración regional de aplicaciones no relacionados. Los detalles de configuración por framework se encuentran en las guías enlazadas desde [Qué guía leer](#which-guide-to-read).

<a id="runnable-examples"></a>
## Ejemplos ejecutables

| Framework | Repositorio de ejemplo |
| --- | --- |
| Astro Starlight | [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) |
| Sitio web de Astro simple | [examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) |
| Docusaurus | [examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs) |
| VitePress | [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs) |
| Nextra | [examples/nextra-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs) |
| Fumadocs | [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs) |
