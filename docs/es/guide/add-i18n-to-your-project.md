<a id="add-i18n-to-your-project"></a>
# Añadir i18n a tu proyecto

Esta sección es el conjunto de tutoriales para un proyecto que actualmente solo tiene un idioma. Empieza aquí. Cada página a continuación aborda un tipo de proyecto, desde la configuración hasta los primeros archivos traducidos. [Introducción](/es/guide/what-is-ai-i18n-tools) explica qué es la herramienta, las opciones de instalación, y los proveedores y modelos. Puedes abrir un tutorial sin leer esas páginas primero.

<a id="what-you-do-and-what-the-tool-does"></a>
## Qué haces tú y qué hace la herramienta

| Tú | La herramienta |
| --- | --- |
| Elige los idiomas, un proveedor y los modelos que probar | Extrae el texto, lo traduce, comprueba el resultado y escribe los catálogos o las páginas |
| Haz visible el texto: `t()` en el código de la aplicación, en la i18n de tu framework de sitio, o un marcador de lista de idiomas en un README | Almacena en caché cada traducción y la reutiliza en la próxima ejecución |
| Carga los archivos y comprueba un idioma | Muestra el progreso y te permite revisar la redacción en el [Panel de traducción](/es/guide/translation-dashboard/) |

Los tutoriales indican qué ediciones de código fuente te corresponden. Se incluyen indicaciones del agente de codificación cuando esas ediciones son mecánicas. La CLI escribe los catálogos y los archivos traducidos. No instala i18next ni la i18n de tu framework de sitio.

<a id="shared-setup"></a>
## Configuración compartida

Cada tutorial sigue el mismo orden. La página que elijas completa los detalles.

1. Instale la CLI y configure la clave API de su proveedor. Ollama no necesita clave. [Instalación](/es/guide/installation) y [Proveedor y clave API](/es/guide/quick-start#provider-and-api-key).
2. Ejecute `init` con la plantilla que nombra esa página. Esto escribe `ai-i18n-tools.config.json`.
3. Prepare el proyecto para que la herramienta pueda ver el texto. Use la instrucción del agente de esa página o los pasos manuales en la misma página.
4. Ejecute `ai-i18n-tools sync`, luego `ai-i18n-tools status`.
5. Carga la salida, comprueba un idioma de destino y vuelve a ejecutar `sync` cuando el código fuente cambie. La caché solo envía texto nuevo o modificado al modelo.

<a id="pages-in-this-section"></a>
## Páginas de esta sección

| Usted tiene | Página | Lo que cubre esa página |
| --- | --- | --- |
| Una aplicación JS/TS (React, Next.js, Node, CLI) cuyos botones y mensajes aún son texto sin formato | [Añadir i18n a una aplicación JS/TS](/es/guide/add-i18n-to-js) | Instale i18next, añada el bootstrap, envuelva los literales en `t()` y añada un selector de idioma, luego `extract` y `translate-ui` |
| Una aplicación Python (Streamlit, FastAPI, Flask, de escritorio, scripts) | [Añadir i18n a una aplicación Python](/es/guide/add-i18n-to-python) | Coloque el asistente `i18n.py`, envuelva `t()` o `_()`, añada un selector de idioma. La CLI puede ejecutarse desde un ejecutable independiente sin necesidad de instalar Node.js |
| Una aplicación Django, Flask con catálogos Flask-Babel, o cualquier aplicación que ya use GNU gettext | [Añadir i18n a una aplicación Django / Python gettext](/es/guide/add-i18n-to-django-gettext) | Conserve los archivos `gettext`, `{% blocktranslate %}` y `.po`. La herramienta rellena y compila los catálogos |
| Un sitio de documentación o marketing (VitePress, Starlight, Docusaurus, Nextra, Fumadocs, Astro, HTML plano) | [Añadir i18n a un sitio web o de documentación](/es/guide/add-i18n-to-website) | Habilite la i18n del framework con la instrucción del agente de la página, luego `sync` para traducir páginas y etiquetas de tema |
| Un README de repositorio y otros archivos Markdown, normalmente junto a una aplicación | [Añadir i18n a tu README y documentos Markdown](/es/guide/add-i18n-to-readme) | Un archivo por idioma (`translated-docs/README.de.md`) y una fila de idioma en el README. `init --with-readme` añade ese bloque a cualquier plantilla |
| Más de uno de los anteriores en un solo repositorio | [Combinar pipelines](/es/guide/combining-pipelines) | Una configuración y un `sync`. El par habitual son las cadenas de la interfaz de usuario de la aplicación más el README |
| Diccionarios de Intlayer, y quieres mantener Intlayer | [Traducir Intlayer in situ](/es/guide/translating-intlayer) | `translate-intlayer` rellena las hojas faltantes y obsoletas dentro de `*.content.ts` |
| Diccionarios de Intlayer, y estás migrando de Intlayer | [Migrar de Intlayer](/es/guide/migrating-from-intlayer) | `migrate-intlayer` inicializa catálogos a partir de los diccionarios y reescribe los sitios de llamada seguros a `t()` |

Una aplicación que también tiene un README utiliza la página de la aplicación y la página del README juntas. Un sitio que también tiene un README utiliza la página del sitio web, y `init … --with-readme` para el bloque del README.

<a id="where-to-go-deeper"></a>
## Dónde profundizar

Las guías paso a paso terminan una vez que el primer idioma está configurado. Las páginas de referencia toman el relevo a partir de ahí:

- [Cadenas de la IU](/es/guide/ui-strings/), [Documentos](/es/guide/documents/), [JSON](/es/guide/json) y [SVG](/es/guide/svg-translation/) para una canalización a la vez.
- [Integraciones](/es/guide/integrations/) para las cadenas del shell del framework (navegación, barra lateral, tema).
- [Inicio rápido](/es/guide/quick-start) para la lista de comandos y los scripts `package.json` recomendados.
- [Proveedores de LLM](/es/guide/providers-and-models) para los preajustes y las claves de API.
- [Modelos de IA](/es/guide/ai-models) para la lista de selección clasificada y la cadena de respaldo.
