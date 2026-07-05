<a id="what-is-ai-i18n-tools"></a>
# ¿Qué es ai-i18n-tools?

El paquete `ai-i18n-tools` ofrece tres superficies de traducción:

- **Cadenas de interfaz de usuario**: extrae llamadas `t("…")` de cualquier fuente JS/TS, las traduce a través del [proveedor de LLM](/guide/providers-and-models) activo y escribe archivos JSON planos por configuración regional listos para i18next.
- **Documentos**: traduce **páginas markdown, MDX y `.astro`** listadas en `docs[].contentPaths` a través de `translate-docs`, con almacenamiento en caché inteligente. El **JSON de catálogo de Docusaurus** opcional (`docs[].docusaurusCatalogDir`, de `docusaurus write-translations`) se traduce en el mismo comando cuando `features.translateDocs` está habilitado — el "site chrome" (barra de navegación, pie de página, cadenas de tema), no la prosa en `docs/`. Los cuerpos de las páginas de **VitePress** usan la misma canalización `docs[]`; las etiquetas de navegación/barra lateral/pie de página usan JSON (`json[]` / `translate-json`) — consulta [Integración de VitePress](/guide/vitepress-integration).
- **JSON**: traduce paquetes JSON anidados arbitrarios (por ejemplo, `src/i18n/en/translation.json`) a través de `json[]`, `features.translateJson` y `translate-json` de nivel superior — para sitios que mantienen la copia de la interfaz de usuario en archivos JSON por configuración regional en lugar de `t()` en el código fuente.
- **Interfaz de usuario de la herramienta (integrada)** — la ayuda de la CLI, los registros y el Panel de traducción se envían en varios idiomas; esto es independiente de la traducción de las cadenas de la interfaz de usuario o los documentos **de tu** aplicación.

Los activos **SVG** usan `features.translateSVG`, el bloque `svg` de nivel superior y `translate-svg` (consulta la [referencia de la CLI](/reference/cli-commands)).

**¿Cuál debo usar?**

- Cadenas orientadas al usuario en el código fuente a través de `t()` → Cadenas de interfaz de usuario (`extract` / `translate-ui`).
- Páginas localizadas, JSON de shell de Docusaurus o markdown de VitePress → Documentos (`translate-docs`).
- JSON de tema de VitePress u otros archivos de configuración regional anidados independientes → JSON (`translate-json`).

Los tres usan el proveedor de LLM activo (consulta [Proveedores y modelos](/guide/providers-and-models)) y comparten un único archivo de configuración.

<a id="next-steps"></a>
## Próximos pasos

1. [Instalación](/guide/installation) — instala el paquete y establece tu clave API de proveedor.
2. [Inicio rápido](/guide/quick-start) — crea una configuración y ejecuta tu primera traducción.
3. [Proveedores y modelos](/guide/providers-and-models) — elige un proveedor, una cadena de reserva de modelo y una anulación de `-P`.
