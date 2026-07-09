<a id="what-is-ai-i18n-tools"></a>
# ¿Qué es ai-i18n-tools?

ai-i18n-tools es una herramienta de línea de comandos y un kit de herramientas que le ayuda a traducir su aplicación y documentación utilizando su proveedor de LLM preferido. Usted controla todo desde un único archivo de configuración, eligiendo qué funciones de traducción habilitar. Utilice el comando "sync" para ejecutar los modos que necesite de una sola vez.

<a id="translation-modes"></a>
## Modos de traducción

- **Cadenas de interfaz de usuario** — Extraiga las llamadas a `t("…")` (y marcadores similares) del código fuente JS/TS y escriba archivos JSON planos por configuración regional para i18next o búsqueda estática. Comandos: `extract`, `translate-ui`. Guía: [Cadenas de interfaz de usuario](/guide/ui-strings/).
- **Documentos** — Traduzca las páginas Markdown, MDX y `.astro` que aparecen en `docs[].contentPaths`. Funciona con VitePress, Starlight, Docusaurus, Nextra, Astro y otros sitios de documentación estática. Comando: `translate-docs`. Guía: [Documentos](/guide/documents/).
- **JSON** — Traduzca los paquetes de configuración regional JSON anidados (etiquetas de tema, anulaciones de i18n, copias de aplicaciones que no están en el código fuente) definidos en `json[]` de nivel superior. Comando: `translate-json`. Guía: [JSON](/guide/json).
- **SVG** — Traduzca el texto visible dentro de las ilustraciones SVG (`<text>`, `<title>`, `<desc>`) y escriba un archivo de salida por configuración regional. Separado de la traducción de documentos — `translate-docs` no modifica los activos SVG. Comando: `translate-svg`. Guía: [Traducción de SVG](/guide/svg-translation/).

Los cuatro modos utilizan el [proveedor de LLM](/guide/providers-and-models) activo, comparten el mismo archivo de configuración y reutilizan una caché de SQLite para que las nuevas ejecuciones solo envíen texto nuevo o modificado al modelo.

<a id="which-should-i-use"></a>
## ¿Cuál debo usar?

| Su contenido | Modo | Comando |
| --- | --- | --- |
| El código fuente utiliza marcadores `t()` o HTML `data-i18n` | Cadenas de interfaz de usuario | `extract` / `translate-ui` |
| Páginas localizadas o sitios de documentación | Documentos | `translate-docs` |
| Archivos de configuración regional JSON anidados independientes | JSON | `translate-json` |
| Diagramas o ilustraciones con etiquetas en SVG | SVG | `translate-svg` |

Muchos proyectos combinan modos, por ejemplo, cadenas de interfaz de usuario más documentos para un sitio de VitePress, o documentos más SVG para guías ilustradas. Consulte [Inicio rápido](/guide/quick-start) para plantillas de andamiaje y [Configuración](/reference/configuration) para el esquema de configuración completo.

<a id="examples"></a>
## Ejemplos

El repositorio incluye proyectos de ejemplo ejecutables en `examples/`, cada uno con su propia configuración, salidas de configuración regional confirmadas y README. Puede explorar archivos traducidos sin una clave API; la repetición de la traducción requiere una clave de proveedor (consulte [Proveedores y modelos](/guide/providers-and-models)).

| Ejemplo | Lo que muestra |
| --- | --- |
| [console-app](/examples#console-app) | Aplicación de extremo a extremo más pequeña: cadenas de interfaz de usuario `t()` más traducción de README |
| [nextjs-app](/examples#nextjs-app) | Interfaz de usuario de Next.js, plurales, SVG, sitio de documentos de Docusaurus, panel de control |
| [astro-website](/examples#astro-website) | Sitio de marketing de Astro: traducción de HTML de página completa más cadenas `t()` |
| [astro-docs](/examples#astro-docs) | Sitio de documentación de Astro Starlight |
| [vitepress-docs](/examples#vitepress-docs) | Documentos de VitePress más catálogo de temas |
| [nextra-docs](/examples#nextra-docs) | Documentos de Nextra más etiquetas de barra lateral `_meta.ts` y diccionario de temas |
| [multi-provider](/examples#multi-provider) | Comparar proveedores de LLM en el mismo documento |
| [test-markdown](/examples#test-markdown) | Pruebas de estrés de la canalización de Markdown (CJK, Devanagari, casos extremos) |

Consulte [Ejemplos](/examples) para comandos de copia `npx degit` y una guía de elección.

<a id="next-steps"></a>
## Próximos pasos

1. [Instalación](/guide/installation) — instala el paquete y establece tu clave API de proveedor.
2. [Inicio rápido](/guide/quick-start) — crea una configuración y ejecuta tu primera traducción.
3. [Proveedores y modelos](/guide/providers-and-models) — elige un proveedor, una cadena de reserva de modelo y una anulación de `-P`.
