<a id="add-i18n-to-a-website-or-docs-site"></a>
# Añadir i18n a un sitio web o sitio de documentación

Esta página está pensada para un sitio de documentación (Markdown o MDX) o un sitio de marketing o estático (un sitio web de Astro o HTML simple) en un solo idioma. La herramienta traduce el contenido de tu página con los modelos de tu proveedor de LLM y escribe una copia localizada por cada idioma. El framework de tu sitio sirve esas copias y proporciona el selector de idioma.

Para una aplicación cuyas cadenas de interfaz de usuario residen en llamadas a `t()`, usa [Añadir i18n a una aplicación JS/TS](/es/guide/add-i18n-to-js) o [Añadir i18n a una aplicación Python](/es/guide/add-i18n-to-python) en su lugar.

<a id="what-do-you-have"></a>
## ¿Qué tienes?

| Su sitio | Plantilla de inicio | Empiece aquí |
| --- | --- | --- |
| Astro Starlight o Astro simple | Cadenas de UI `ui-starlight` / híbridas | [Astro](/es/guide/integrations/astro) |
| Docusaurus | `ui-docusaurus` | [Docusaurus](/es/guide/integrations/docusaurus) |
| VitePress | `ui-vitepress` | [VitePress](/es/guide/integrations/vitepress) |
| Nextra 4 (Next.js App Router) | `ui-nextra` | [Nextra](/es/guide/integrations/nextra) |
| Fumadocs 4 (Next.js App Router) | `ui-fumadocs` | [Fumadocs](/es/guide/integrations/fumadocs) |
| Páginas HTML planas | `ui-plain-html` o `docs-plain-html` | [Aplicaciones HTML planas](/es/guide/ui-strings/plain-html) |
| Sin framework de sitio, solo un README y archivos Markdown | `docs-markdown`, o cualquier plantilla más `--with-readme` | [Añadir i18n a tu README y documentos Markdown](/es/guide/add-i18n-to-readme) |

<details class="agent-prompt">
<summary>Prompts del agente</summary>

- Astro Starlight: solo notas. Archivos Astro `t()`: [prompt JS/TS](/es/guide/add-i18n-to-js#agent-prompt) (omitir i18next).
- Docusaurus: solo notas (`<Translate>` es la propia API de Docusaurus).
- VitePress: [prompt de catálogo de temas](/es/guide/integrations/vitepress#wire-configmts-to-generated-theme-json-one-off).
- Nextra: [prompt de diccionario](/es/guide/integrations/nextra#agent-prompt-dictionary) y [prompt híbrido `t()`](/es/guide/integrations/nextra#optional-t-for-app-react-hybrid).
- Fumadocs: [prompt de catálogo de UI](/es/guide/integrations/fumadocs#agent-prompt).
- Archivos README y Markdown: [prompt de README](/es/guide/add-i18n-to-readme#agent-prompt).

</details>

<a id="steps"></a>
## Pasos

La misma estructura funciona para cada framework; los detalles se encuentran en la guía del framework enlazada anteriormente.

1. Instala la CLI y configura la clave API: [Instalación](/es/guide/installation), [Proveedor y clave API](/es/guide/quick-start#provider-and-api-key).
2. Genera el esqueleto: `ai-i18n-tools init -t <template> -P <provider>`.
3. Configura `sourceLocale`, `targetLocales` y `docs[].contentPaths` (las páginas y carpetas escritas en tu idioma de origen). `sourceLocale` puede ser cualquier idioma. La guía del framework muestra el `docsOutput.style` correcto.
4. Habilita la i18n de tu framework para que sirva y enlace las páginas localizadas. Cada guía tiene una sección "Habilitar i18n en un sitio existente": [VitePress](/es/guide/integrations/vitepress#enable-i18n-in-an-existing-site), [Docusaurus](/es/guide/integrations/docusaurus#enable-i18n-in-an-existing-site), [Nextra](/es/guide/integrations/nextra#enable-i18n-in-an-existing-site), [Fumadocs](/es/guide/integrations/fumadocs#enable-i18n-in-an-existing-site), [Astro](/es/guide/integrations/astro#enable-i18n-in-an-existing-site).
5. Ejecuta `ai-i18n-tools sync` (o `translate-docs`), luego compila el sitio.
6. Verifica una ruta localizada en el navegador. El desplegable de idioma del propio framework es el selector. Para un archivo markdown plano como un README, añade una fila de enlace con [languageListBlock](/es/guide/documents/language-switcher).

<a id="what-gets-translated"></a>
## ¿Qué se traduce?

Los cuerpos de las páginas siempre pasan por el pipeline de [Documentos](/es/guide/documents/). Los elementos de interfaz del framework (navegación, barra lateral, etiquetas de tema) se gestionan en la misma ejecución donde el framework lo soporta, no a través del pipeline de [JSON](/es/guide/json) separado.

| Framework | Cadenas de shell y tema | Cómo |
| --- | --- | --- |
| Docusaurus | Catálogo `write-translations` (`{ message, description }`) | `docs[].docusaurusCatalogDir` más `translate-docs` |
| VitePress | Catálogo de tema, navegación y barra lateral | `docsOutput.vitepressThemeCatalog` más `translate-docs` |
| Nextra | Etiquetas de barra lateral `_meta.ts` | Automático con `style: "nextra"` |
| Nextra | Diccionario de tema `.ts` | `docs[].nextraDictionaryPath` |
| Fumadocs | Etiquetas de barra lateral `meta.json` | Automático con `style: "fumadocs"` |
| Fumadocs | Catálogo de anulaciones de interfaz de usuario | `docsOutput.fumadocsUiCatalog` |
| Astro Starlight | Cadenas de interfaz de usuario integradas en varias configuraciones regionales | Solo páginas |

Las imágenes y capturas de pantalla no son traducidas por `translate-docs`. Para archivos específicos de la configuración regional, consulta [Imágenes y capturas de pantalla](/es/guide/images-and-screenshots/).

<a id="plain-html"></a>
## HTML sin formato

Dos opciones, dependiendo de cómo deba comportarse la página:

- Una página que cambia de idioma en el navegador: marca el texto con atributos `data-i18n*` y usa el tiempo de ejecución de cadenas de interfaz de usuario (`ui-plain-html`). Consulta [Aplicaciones HTML sin formato](/es/guide/ui-strings/plain-html).
- Un archivo HTML traducido por configuración regional: usa la canalización de documentos (`docs-plain-html`). Consulta [Páginas HTML](/es/guide/documents/html-pages).

Un archivo pertenece a una ruta.

<a id="not-your-case"></a>
## ¿No es su caso?

- Cadenas de interfaz de usuario de la aplicación: [Añadir i18n a una aplicación JS/TS](/es/guide/add-i18n-to-js) o [Añadir i18n a una aplicación Python](/es/guide/add-i18n-to-python).
- Un README de repositorio junto al sitio, o archivos Markdown y sin un framework de sitio: [Añadir i18n a tus documentos README y Markdown](/es/guide/add-i18n-to-readme). `init … --with-readme` añade ese bloque junto a una plantilla de sitio.
- JSON de configuración regional anidado independiente: [JSON](/es/guide/json).
- Traducción de cadenas de un sitio y de una aplicación: [Combinar canalizaciones](/es/guide/combining-pipelines).

Referencia para las opciones compartidas y las diferencias por framework: [Integraciones](/es/guide/integrations/).
