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

**No** coloque las cadenas de shell o tema del framework en `json[]`; esa canalización es para paquetes de configuración regional de aplicaciones no relacionados. Cada página de integración explica qué rutas de catálogo y banderas de CLI cubren las etiquetas de navegación, barra lateral y tema para ese framework.

<a id="runnable-examples"></a>
## Ejemplos ejecutables

| Framework | Repositorio de ejemplo |
| --- | --- |
| Astro Starlight | [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) |
| Sitio web de Astro simple | [examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) |
| Docusaurus | [examples/nextjs-app/docs-site](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/docs-site) |
| VitePress | [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs) |
| Nextra | [examples/nextra-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs) |
| Fumadocs | [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs) |
