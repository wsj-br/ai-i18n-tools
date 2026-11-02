<a id="what-is-ai-i18n-tools"></a>
# ¿Qué es ai-i18n-tools?

Tienes una aplicación, un sitio web, un sitio de documentación o un archivo README de un repositorio en un idioma y quieres añadir más idiomas. Ese idioma es `sourceLocale` y puede ser cualquier idioma. El inglés es un ejemplo común en estas guías. ai-i18n-tools encuentra el texto, lo traduce con los modelos del proveedor de LLM que elijas y escribe los archivos que tu proyecto ya carga. Almacena en caché cada resultado, por lo que las reejecuciones solo envían el texto nuevo o modificado al modelo.

<a id="what-you-do-and-what-the-tool-does"></a>
## Qué haces tú y qué hace la herramienta

| Tú | La herramienta |
| --- | --- |
| Elige los idiomas, un proveedor y los modelos que probar | Extrae el texto, lo traduce, valida el resultado y escribe los catálogos o las páginas |
| Haz que el texto visible para el usuario sea visible para la herramienta: llamadas a `t()` en el código de la aplicación, la propia i18n de tu framework para un sitio, o un marcador de lista de idiomas en un README | Almacena en caché las traducciones y las reutiliza en cada nueva ejecución |
| Conecta el resultado a la aplicación, el enrutamiento del sitio o la fila de idioma del archivo README | Muestra el progreso y permite revisar las traducciones en el panel |

La herramienta no reescribe su código fuente a menos que ejecute `migrate-python-i18n` o `migrate-dotnet-i18n` con `--write`. Se proporcionan indicaciones del agente de codificación para el paso de encapsulado. No instala i18next ni la i18n de su framework de sitio, y no construye su selector de idioma, aunque se proporcionan ayudantes en tiempo de ejecución para ello.

<a id="where-do-i-start"></a>
## ¿Por dónde empiezo?

Los tutoriales están agrupados en [Añadir i18n a tu proyecto](/es/guide/add-i18n-to-your-project), con la configuración compartida y una página para cada tipo de proyecto. Elige una fila:

| Tienes | Empieza aquí |
| --- | --- |
| Una aplicación JS/TS (React, Next.js, Node, CLI) con texto plano en el código fuente | [Añadir i18n a una aplicación JS/TS](/es/guide/add-i18n-to-js) |
| Una aplicación Python (Streamlit, FastAPI, Flask, de escritorio, scripts) | [Añadir i18n a una aplicación Python](/es/guide/add-i18n-to-python) |
| Una aplicación .NET (Avalonia, WPF, MAUI, ASP.NET, Blazor, consola) | [Añadir i18n a una aplicación .NET](/es/guide/add-i18n-to-dotnet) |
| Una aplicación .NET que ya usa `ResourceManager` o `IStringLocalizer` | [Añadir i18n a una aplicación .NET ResourceManager](/es/guide/add-i18n-to-dotnet-resourcemanager) |
| Una aplicación Django, catálogos de Flask-Babel, o una aplicación que ya usa GNU gettext | [Añadir i18n a una aplicación Django / Python gettext](/es/guide/add-i18n-to-django-gettext) |
| Un sitio web o sitio de documentación (VitePress, Docusaurus, Starlight, Nextra, Fumadocs, Astro, HTML plano) | [Añadir i18n a un sitio web o de documentación](/es/guide/add-i18n-to-website) |
| Un README de repositorio y otros archivos Markdown, normalmente junto a una aplicación | [Añadir i18n a tu README y documentos Markdown](/es/guide/add-i18n-to-readme) |
| Archivos de localización JSON anidados independientes | [JSON](/es/guide/json) |
| Diagramas SVG con etiquetas de texto | [Traducción SVG](/es/guide/svg-translation/) |
| Diccionarios de Intlayer (migrar de Intlayer) | [Migrar de Intlayer](/es/guide/migrating-from-intlayer) |
| Diccionarios de Intlayer (mantener Intlayer, traducir in situ) | [Traducir Intlayer in situ](/es/guide/translating-intlayer) |

<a id="how-it-works"></a>
## Cómo funciona

1. Instala la CLI y configura la clave API de tu proveedor: [Instalación](/es/guide/installation).
2. Ejecuta `init` para escribir `ai-i18n-tools.config.json`: [Inicio rápido](/es/guide/quick-start).
3. Prepara el proyecto: encapsula cadenas en `t()`, habilita la i18n de tu framework de sitio o añade el marcador de lista de idiomas a un README.
4. Ejecuta `sync`. Extrae texto, traduce lo que es nuevo y escribe la salida.
5. Carga la salida en tu aplicación o sitio, añade un selector de idioma y vuelve a ejecutar `sync` cuando cambie el código fuente.

<a id="translation-modes"></a>
## Modos de traducción

Internamente, la herramienta ejecuta cuatro pipelines. Tu configuración habilita los que necesitas, y `sync` los ejecuta en orden.

- Cadenas de interfaz de usuario — Extraer llamadas a `t("…")` y `_()` de JS/TS y Python, y `T("…")` / `{loc:Tr '…'}` de C# y XAML (incluyendo GNU gettext y satélites `.resx` de .NET) y escribir JSON plano por configuración regional, `.po` / `.mo`, o `.resx`. Comandos: `extract`, `translate-ui`, `migrate-dotnet-i18n`. Guía: [Cadenas de interfaz de usuario](/es/guide/ui-strings/). Python: [Aplicaciones Python](/es/guide/ui-strings/python). .NET: [Aplicaciones .NET](/es/guide/ui-strings/dotnet) y [Añadir i18n a una aplicación .NET ResourceManager](/es/guide/add-i18n-to-dotnet-resourcemanager).
- Documentos — Traducir páginas Markdown, MDX y `.astro` listadas en `docs[].contentPaths`. Funciona con VitePress, Starlight, Docusaurus, Nextra, Fumadocs, Astro y otros sitios de documentación estática, y con un README de repositorio (`docsOutput.style` de `flat`). Comando: `translate-docs`. Guías: [Documentos](/es/guide/documents/) y [Añadir i18n a su README y documentos Markdown](/es/guide/add-i18n-to-readme).
- JSON — Traducir paquetes de configuración regional JSON anidados (etiquetas de tema, anulaciones de i18n, texto de aplicación no en el código fuente) definidos en el nivel superior `json[]`. Comando: `translate-json`. Guía: [JSON](/es/guide/json).
- SVG — Traducir texto visible dentro de ilustraciones SVG (`<text>`, `<title>`, `<desc>`) y escribir un archivo de salida por configuración regional. Separado de la traducción de documentos. Comando: `translate-svg`. Guía: [Traducción de SVG](/es/guide/svg-translation/).

Muchos proyectos combinan modos. La combinación común es cadenas de interfaz de usuario más el README del repositorio. Un sitio de documentación como VitePress es la otra combinación frecuente. Consulta [Combinar pipelines](/es/guide/combining-pipelines) y [Añadir i18n a tu README y documentos Markdown](/es/guide/add-i18n-to-readme).

<a id="examples"></a>
## Ejemplos

El repositorio incluye proyectos de ejemplo ejecutables en `examples/`, cada uno con su propia configuración, salidas de localización confirmadas y README. Explora los archivos traducidos sin una clave de API; volver a ejecutar la traducción requiere una clave de proveedor.

| Si tienes | Ejemplo |
| --- | --- |
| Una aplicación JS/TS | [console-app](/es/examples#console-app), [nextjs-app](/es/examples#nextjs-app) |
| Un README de repositorio junto a una aplicación | [console-app](/es/examples#console-app), [nextjs-app](/es/examples#nextjs-app) |
| Una aplicación Python | [python-streamlit](/es/examples#python-streamlit), [python-fastapi](/es/examples#python-fastapi), [python-gettext](/es/examples#python-gettext) |
| Un ayudante de .NET | [dotnet-console](/es/examples#dotnet-console), [dotnet-resx](/es/examples#dotnet-resx) |
| Un sitio de documentación | [docusaurus-docs](/es/examples#docusaurus-docs), [vitepress-docs](/es/examples#vitepress-docs), [astro-docs](/es/examples#astro-docs) |
| Un sitio web o HTML simple | [astro-website](/es/examples#astro-website), [plain-html](/es/examples#plain-html) |

Consulta [Ejemplos](/es/examples) para ver la lista completa y los comandos de copia `npx degit`.

<a id="next-steps"></a>
## Próximos pasos

1. [Instalación](/es/guide/installation): instala el paquete npm o descarga el [ejecutable independiente](/es/guide/installation#standalone-executables) para un proyecto de Python y configura la clave de API de tu proveedor.
2. [Inicio rápido](/es/guide/quick-start): crea una configuración inicial y ejecuta tu primera traducción.
3. [Proveedores de LLM](/es/guide/providers-and-models): elige un proveedor, una clave de API y una anulación de `-P`.
4. [Modelos de IA](/es/guide/ai-models): clasifica una lista de preseleccionados con `suggest-models` o la pestaña **Modelos** del panel de control y mantén varios modelos para que una traducción fallida pueda probar con el siguiente.
