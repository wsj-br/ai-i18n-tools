<a id="what-is-ai-i18n-tools"></a>
# ¿Qué es ai-i18n-tools?

ai-i18n-tools es una herramienta de línea de comandos y un kit de herramientas que le ayuda a traducir su aplicación y documentación utilizando su proveedor de LLM preferido. Usted controla todo desde un único archivo de configuración, eligiendo qué funciones de traducción habilitar. Utilice el comando "sync" para ejecutar los modos que necesite de una sola vez.

<a id="translation-modes"></a>
## Modos de traducción

- **Cadenas de la interfaz de usuario (UI)** — Extraiga las llamadas `t("…")` y `_()` del código fuente JS/TS y Python (y marcadores similares, incluyendo GNU gettext) y escriba catálogos JSON o `.po` / `.mo` planos por configuración regional. Comandos: `extract`, `translate-ui`. Guía: [Cadenas de la interfaz de usuario](/es/guide/ui-strings/). Python: [Aplicaciones Python](/es/guide/ui-strings/python).
- **Documentos** — Traduzca páginas Markdown, MDX y `.astro` enumeradas en `docs[].contentPaths`. Funciona con VitePress, Starlight, Docusaurus, Nextra, Fumadocs, Astro y otros sitios de documentación estática. Comando: `translate-docs`. Guía: [Documentos](/es/guide/documents/).
- **JSON** — Traduzca paquetes JSON de configuración regional anidados (etiquetas de temas, anulaciones de i18n, copias de aplicaciones que no están en el código fuente) definidos en `json[]` de nivel superior. Comando: `translate-json`. Guía: [JSON](/es/guide/json).
- **SVG** — Traduzca el texto visible dentro de ilustraciones SVG (`<text>`, `<title>`, `<desc>`) y escriba un archivo de salida por configuración regional. Independiente de la traducción de documentos: `translate-docs` no modifica los activos SVG. Comando: `translate-svg`. Guía: [Traducción de SVG](/es/guide/svg-translation/).

Los cuatro modos utilizan el [proveedor de LLM](/es/guide/providers-and-models) activo, comparten el mismo archivo de configuración y reutilizan una caché de SQLite para que las nuevas ejecuciones solo envíen texto nuevo o modificado al modelo.

<a id="which-should-i-use"></a>
## ¿Cuál debo usar?

| Su contenido | Modo | Comando |
| --- | --- | --- |
| El código fuente utiliza marcadores `t()`, `_()`, gettext o HTML `data-i18n` | Cadenas de la interfaz de usuario | `extract` / `translate-ui` |
| Páginas localizadas o sitios de documentación | Documentos | `translate-docs` |
| Archivos de configuración regional JSON anidados independientes | JSON | `translate-json` |
| Diagramas o ilustraciones con etiquetas en SVG | SVG | `translate-svg` |

Muchos proyectos combinan modos, por ejemplo, cadenas de interfaz de usuario más documentos para un sitio de VitePress, o documentos más SVG para guías ilustradas. Consulte [Inicio rápido](/es/guide/quick-start) para plantillas de andamiaje y [Configuración](/es/reference/configuration) para el esquema de configuración completo.

<a id="examples"></a>
## Ejemplos

El repositorio incluye proyectos de ejemplo ejecutables en `examples/`, cada uno con su propia configuración, salidas de configuración regional confirmadas y README. Puede explorar archivos traducidos sin una clave API; la repetición de la traducción requiere una clave de proveedor (consulte [Proveedores y modelos](/es/guide/providers-and-models)).

| Ejemplo | Lo que muestra |
| --- | --- |
| [console-app](/es/examples#console-app) | Aplicación de extremo a extremo más pequeña: cadenas de interfaz de usuario `t()` más traducción de README |
| [nextjs-app](/es/examples#nextjs-app) | Interfaz de usuario de Next.js, plurales, SVG, documentos anidados de Docusaurus, README plano, panel de control |
| [docusaurus-docs](/es/examples#docusaurus-docs) | Sitio de documentación independiente de Docusaurus |
| [astro-website](/es/examples#astro-website) | Sitio de marketing de Astro: traducción de HTML de página completa más cadenas `t()` |
| [astro-docs](/es/examples#astro-docs) | Sitio de documentación de Astro Starlight |
| [vitepress-docs](/es/examples#vitepress-docs) | Documentos de VitePress más catálogo de temas |
| [nextra-docs](/es/examples#nextra-docs) | Documentos de Nextra más etiquetas de barra lateral `_meta.ts` y diccionario de temas |
| [fumadocs-docs](/es/examples#fumadocs-docs) | Documentos de Fumadocs más etiquetas de barra lateral `meta.json` y catálogo de interfaz de usuario |
| [HTML plano](/es/examples#plain-html) | HTML estático con marcadores `data-i18n*` y JSON de locale |
| [multi-provider](/es/examples#multi-provider) | Comparar proveedores de LLM en el mismo documento |
| [test-markdown](/es/examples#test-markdown) | Pruebas de estrés de la canalización de Markdown (CJK, Devanagari, casos extremos) |
| [migración de Intlayer](/es/examples#intlayer-migration) | Intlayer `.content.ts` → `t()` mediante `migrate-intlayer` |
| [python-streamlit](/es/examples#python-streamlit) | Panel de control de Streamlit, `t()` / `_()`, JSON con claves en inglés |
| [python-flask](/es/examples#python-flask) | Flask + Jinja, `t()` / `_()`, JSON con claves en inglés |
| [python-fastapi](/es/examples#python-fastapi) | FastAPI, configuración regional con ámbito de solicitud, JSON con claves en inglés |
| [python-gettext](/es/examples#python-gettext) | GNU gettext existente; `extract` / `translate-ui` actualiza `.po` y `.mo` |

Consulte [Ejemplos](/es/examples) para comandos de copia `npx degit` y una guía de elección.

<a id="next-steps"></a>
## Próximos pasos

1. [Instalación](/es/guide/installation) — instale el paquete npm, o descargue el [ejecutable independiente](/es/guide/installation#standalone-executables) para un proyecto de Python, y configure su clave de API del proveedor.
2. [Inicio rápido](/es/guide/quick-start) — cree una configuración y ejecute su primera traducción.
3. [Proveedores y modelos](/es/guide/providers-and-models) — elija un proveedor, una cadena de reserva de modelos y una anulación de `-P`.
