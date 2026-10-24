<a id="integrations"></a>
# Integraciones

Guías específicas de framework para sitios de documentación, proyectos Astro y aplicaciones Python. Las integraciones de documentación utilizan la canalización [Documents](/es/guide/documents/) (`translate-docs` / `sync`) para el contenido de las páginas; las cadenas de shell (navegación, barra lateral, tema) se gestionan dentro de esa misma canalización donde se indique, no a través de la canalización [JSON](/es/guide/json) independiente. Las aplicaciones Python utilizan la canalización [UI strings](/es/guide/ui-strings/python) (`extract` / `translate-ui`).

<a id="which-guide-to-read"></a>
## Qué guía leer

| Su sitio | Plantilla de inicio | Empiece aquí |
| --- | --- | --- |
| Astro Starlight o Astro simple | Cadenas de UI `ui-starlight` / híbridas | [Astro](/es/guide/integrations/astro) |
| Docusaurus | `ui-docusaurus` | [Docusaurus](/es/guide/integrations/docusaurus) |
| VitePress | `ui-vitepress` | [VitePress](/es/guide/integrations/vitepress) |
| Nextra 4 (Next.js App Router) | `ui-nextra` | [Nextra](/es/guide/integrations/nextra) |
| Fumadocs 4 (Next.js App Router) | `ui-fumadocs` | [Fumadocs](/es/guide/integrations/fumadocs) |
| Python (Streamlit, FastAPI, Flask, Django, gettext, escritorio) | `ui-python` / `ui-python-gettext` / `ui-python-flask` / `ui-python-django` | [Python](/es/guide/integrations/python) |

<a id="shared-concepts"></a>
## Conceptos compartidos

Las integraciones de frameworks de documentación comparten el mismo modelo de bloque `docs[]` descrito en [Documents](/es/guide/documents/). Establezca `docsOutput.style` para que coincida con su framework (`"docusaurus"`, `"vitepress"`, `"nextra"`, `"fumadocs"` o `"astro-starlight"`). Para conocer el diseño de la carpeta de salida y el comportamiento de reescritura de enlaces, consulte [Output layouts](/es/guide/documents/output-layouts) y [Link rewriting](/es/guide/documents/link-rewriting). La configuración de Python es independiente: [Python](/es/guide/integrations/python).

Cada andamiaje `init -t ui-* -P <provider>` escribe el bloque del proveedor de LLM de ese preajuste. Antes de `translate-docs` o `sync`, establezca la clave de API correspondiente — consulte [Proveedor y clave de API](/es/guide/quick-start#provider-and-api-key).

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
| Streamlit | [examples/python-streamlit](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-streamlit) |
| Flask | [examples/python-flask](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-flask) |
| FastAPI | [examples/python-fastapi](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-fastapi) |
| GNU gettext | [examples/python-gettext](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-gettext) |
