<a id="quick-start"></a>
# Inicio rápido

Esta página guía un proyecto monolingüe hasta sus primeros archivos traducidos. Es para una aplicación JS/TS, una aplicación Python, un sitio web o de documentación, o un README de repositorio y otros archivos Markdown. Se asume:

- Node.js `>=22.16.0`, o el [ejecutable independiente](/es/guide/installation#standalone-executables) para un proyecto Python.
- Una clave API para un proveedor de LLM, o una instalación local de Ollama.
- El proyecto está en control de versiones, para que puedas revisar lo que escribe la herramienta.

Dos cosas difieren entre proyectos: cómo la herramienta encuentra tu texto y cómo tu aplicación carga el resultado. [Elige tu ruta](#pick-your-path) a continuación te envía a la guía correcta para ello.

<a id="runnable-examples"></a>
## Ejemplos ejecutables

¿Prefieres ver un proyecto terminado primero? Copia uno sin clonar el repositorio:

```bash
npx degit wsj-br/ai-i18n-tools/examples/console-app console-app
cd console-app
pnpm install
pnpm run i18n:sync
```

Reemplaza `console-app` con cualquier otro ejemplo de Node.js. Los ejemplos de Python no tienen `package.json`; cópialos de la misma manera o descarga `ai-i18n-tools-python-examples.zip` de la versión de GitHub. La lista completa, con lo que muestra cada uno, está en la página de [Ejemplos](/es/examples).

<a id="install"></a>
## Instalar

```bash
pnpm add -D ai-i18n-tools
```

`npm install --save-dev ai-i18n-tools` y `yarn add --dev ai-i18n-tools` también funcionan. Los proyectos Python instalan el ejecutable independiente y no necesitan Node.js. Linux y macOS: `curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash`. Windows PowerShell: `irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex`. Otras opciones de instalación: [Instalación](/es/guide/installation).

<a id="provider-and-api-key"></a>
## Proveedor y clave API

Cada comando que llama a un LLM (`translate-ui`, `translate-docs`, `translate-json`, `translate-svg` y `sync`) necesita ambas cosas:

1. Al menos un proveedor en `ai-i18n-tools.config.json`: un bloque `providers.<name>` con `translationModels` y una clave `provider` de nivel superior cuando se configura más de un proveedor. `init -P <provider>` genera la estructura de ese preajuste. Para añadir proveedores, consulta [Proveedores de LLM](/es/guide/providers-and-models). Para elegir la lista de modelos, consulta [Modelos de IA](/es/guide/ai-models).
2. La clave de API correspondiente en tu entorno o en un archivo `.env` en la raíz del proyecto. Cada preajuste integrado lee una variable con nombre de la [tabla de preajustes](/es/guide/providers-and-models#built-in-providers), por ejemplo, `OPENROUTER_API_KEY` con `-P openrouter` o `OPENAI_API_KEY` con `-P openai`. Ollama utiliza un punto de conexión local y no necesita ninguna clave.

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

`extract`, `status` y otros comandos que no llaman al LLM no necesitan ninguna de las dos cosas. Más información sobre archivos de entorno y PATH: [Instalación](/es/guide/installation#using-the-cli).

<a id="pick-your-path"></a>
## Elige tu ruta

Encuentra lo que tienes, ejecuta los comandos en su bloque y luego continúa en la guía enlazada.

<a id="a-jsts-app"></a>
### Una aplicación JS/TS

Tus botones y mensajes siguen siendo texto plano en el código fuente, por lo que la herramienta aún no tiene nada que encontrar. Primero deben envolverse en `t()`, y la aplicación necesita un pequeño archivo de configuración de i18next.

```bash
ai-i18n-tools init -P openrouter
ai-i18n-tools suggest-models --apply
```

Luego sigue [Añadir i18n a una aplicación JS/TS](/es/guide/add-i18n-to-js). Cubre el paso de envoltura, con un prompt de agente, antes de `extract` y `translate-ui`.

<a id="a-python-app"></a>
### Una aplicación Python

```bash
ai-i18n-tools init -t ui-python -P openrouter
ai-i18n-tools suggest-models --apply
```

Luego siga [Añada i18n a una aplicación Python](/es/guide/add-i18n-to-python).

Una aplicación Django, Flask con catálogos Flask-Babel, o una aplicación que ya llama a `gettext` mantiene esas llamadas. Genere la estructura con `ui-python-django`, `ui-python-flask`, o `ui-python-gettext` en su lugar, luego siga [Añada i18n a una aplicación Django / Python gettext](/es/guide/add-i18n-to-django-gettext).

<a id="a-website-or-documentation-site"></a>
### Un sitio web o de documentación

Elige la plantilla para tu framework:

| Su sitio | Plantilla |
| --- | --- |
| Astro Starlight | `ui-starlight` |
| Docusaurus | `ui-docusaurus` |
| VitePress | `ui-vitepress` |
| Nextra | `ui-nextra` |
| Fumadocs | `ui-fumadocs` |
| Sitio web Astro simple | `ui-astro-website` |
| Páginas HTML simples | `ui-plain-html` o `docs-plain-html` |

```bash
ai-i18n-tools init -t ui-vitepress -P openrouter
```

A continuación, siga [Añadir i18n a un sitio web o sitio de documentación](/es/guide/add-i18n-to-website). Su prompt de agente habilita el enrutamiento i18n del framework. Ejecute `sync` después de revisar ese trabajo.

<a id="a-readme-or-markdown-docs"></a>
### Un README o documentos Markdown

La mayoría de los repositorios quieren esto junto con la aplicación: la plantilla `ui-markdown` predeterminada ya incluye un bloque README plano. Para cualquier otra plantilla, añada `--with-readme`. Un repositorio con solo Markdown usa `docs-markdown`.

```bash
ai-i18n-tools init -P openrouter
ai-i18n-tools init -t ui-python -P openrouter --with-readme
ai-i18n-tools init -t docs-markdown -P openrouter
```

Luego siga [Añadir i18n a su README y documentos Markdown](/es/guide/add-i18n-to-readme). Pegue el marcador de lista de idiomas en `README.md` antes de `sync`. La ruta de la aplicación, si tiene una, sigue siendo [Añadir i18n a una aplicación JS/TS](/es/guide/add-i18n-to-js) o [Añadir i18n a una aplicación Python](/es/guide/add-i18n-to-python).

<a id="something-else"></a>
### Algo más

- JSON i18next anidado que permanece tal cual: `ai-i18n-tools init -t ui-json-bundles -P openrouter`, luego [JSON](/es/guide/json).
- Diagramas SVG con etiquetas de texto: [Traducción de SVG](/es/guide/svg-translation/).
- Dejar de usar Intlayer: [Migrar de Intlayer](/es/guide/migrating-from-intlayer).
- Mantener Intlayer y solo rellenar sus traducciones: [Traducir Intlayer in situ](/es/guide/translating-intlayer).

La lista completa de plantillas, con cada opción `init`, se encuentra en la [referencia de configuración de la CLI](/es/reference/cli-commands/setup).

<a id="run-and-check"></a>
## Ejecución y verificación

Cuando su proyecto esté listo:

```bash
ai-i18n-tools doctor
ai-i18n-tools sync
ai-i18n-tools status
```

`doctor` comprueba que la configuración, las rutas, los proveedores y el entorno estén listos. También verifica los ID de modelo con el proveedor a menos que pase `--local`. `sync` ejecuta cada paso que su configuración habilita, en orden. `status` muestra lo que se traduce por configuración regional. Una primera ejecución en un proyecto en el que la herramienta no puede ver texto finaliza sin error y no escribe nada útil, así que si `status` no muestra cadenas, vuelva a la guía para su ruta.

`suggest-models` clasifica los modelos de chat del proveedor activo según las pruebas de rendimiento publicadas. `suggest-models --apply` reemplaza a `translationModels` y no modifica `uiModels` ni `localeModels`. La misma clasificación se encuentra en la pestaña **Modelos** del panel de control. Cómo funciona la clasificación y por qué la lista contiene más de un modelo: [Modelos de IA](/es/guide/ai-models). Referencia de comandos: [suggest-models](/es/reference/cli-commands/models#suggest-models).

<a id="keep-it-translated"></a>
## Mantenerlo traducido

Vuelva a ejecutar `sync` cada vez que cambie el texto fuente. Una caché de SQLite significa que solo el texto nuevo o modificado va al modelo, por lo que las nuevas ejecuciones son económicas. Ejecutar `sync` en CI evita que las traducciones se desvíen. `ai-i18n-tools dashboard` abre el [Panel de traducción](/es/guide/translation-dashboard/) para revisar y editar las traducciones en caché.

<a id="recommended-packagejson-scripts"></a>
### Scripts recomendados para package.json

Con el paquete instalado localmente, los scripts resuelven `ai-i18n-tools` desde `node_modules/.bin` sin configuración adicional del shell. Para un shell interactivo, configure PATH primero: consulte [Uso de la CLI](/es/guide/installation#using-the-cli).

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:translate:json": "ai-i18n-tools translate-json",
  "i18n:status": "ai-i18n-tools status",
  "i18n:statistics": "ai-i18n-tools statistics",
  "i18n:dashboard": "ai-i18n-tools dashboard",
  "i18n:cleanup": "ai-i18n-tools cleanup"
}
```

Prefiera `sync` en lugar de encadenar los scripts de traducción individuales. Utilice los scripts de un solo paso solo cuando necesite un paso de forma aislada.

Para mostrar la salida de la CLI y el panel de control en otro idioma, pase `-L <code>` o establezca `AI_I18N_LANG`: consulte [Idioma de la interfaz de usuario de la herramienta](/es/guide/tool-ui-language).

<a id="combined-sync"></a>

¿Está traduciendo más de un tipo de contenido, como cadenas de aplicaciones y un sitio de documentación juntos? Consulte [Combinación de pipelines](/es/guide/combining-pipelines).

A continuación: la guía para su ruta en [Elija su ruta](#pick-your-path).
