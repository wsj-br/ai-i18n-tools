<a id="installation"></a>
# Instalación

El paquete publicado es solo **ESM**. Utilice `import`/`import()` en Node.js o en su empaquetador; no use `require('ai-i18n-tools')`. El paquete declara `engines.node` `>=22.16.0`; no se admiten versiones antiguas de Node.js. El tarball de npm incluye archivos en inglés solo bajo `docs/`; las copias específicas de configuración regional bajo `translated-docs/` están en el [repositorio de GitHub](https://github.com/wsj-br/ai-i18n-tools/tree/main/translated-docs).

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

ai-i18n-tools incluye su propio extractor de cadenas. Si anteriormente usabas `i18next-scanner`, `babel-plugin-i18next-extract` o herramientas similares, puedes eliminar esas dependencias de desarrollo tras migrar.

<a id="using-the-cli"></a>
### Uso de la CLI

Instale `ai-i18n-tools` como dependencia o devDependency en su proyecto (consulte [Instalación](#installation) arriba). El paquete declara una entrada `bin` que su gestor de paquetes enlaza a `node_modules/.bin/ai-i18n-tools`. Ese shim (`bin/ai-i18n-tools.mjs` dentro del paquete instalado) carga la CLI compilada.

**Scripts de `package.json` (recomendado)** — cuando npm o pnpm ejecutan un script, anteponen `node_modules/.bin` a `PATH`, por lo que comandos como `pnpm run i18n:sync` invocan `ai-i18n-tools` sin un prefijo `npx` o `pnpm exec`:

```json
"scripts": {
  "i18n:sync": "ai-i18n-tools sync"
}
```

**Shell interactivo** — desde la raíz de su proyecto, después de una instalación local:

```bash
npx ai-i18n-tools sync        # npm
pnpm exec ai-i18n-tools sync  # pnpm
yarn ai-i18n-tools sync       # yarn (Berry: yarn dlx ai-i18n-tools … for one-off)
```

**Solo** `ai-i18n-tools` **en la terminal** — para escribir el nombre del comando directamente en un shell interactivo, anteponga el directorio bin local a `PATH`:

```bash
# bash/zsh — project root
export PATH="$PWD/node_modules/.bin:$PATH"
ai-i18n-tools sync
```

```powershell
# Windows PowerShell — project root
$env:Path = "$PWD\node_modules\.bin;$env:Path"
ai-i18n-tools sync
```

Con [**direnv**](https://direnv.net/), añada `PATH_add node_modules/.bin` a un `.envrc` en la raíz del proyecto para que el comando "en seco" esté disponible después de `cd` en el proyecto. Sin ajustar `PATH`, siga usando `npx ai-i18n-tools …` o `pnpm exec ai-i18n-tools …`.

**Ejecución única sin instalación** — `npx ai-i18n-tools <cmd>` o `pnpm dlx ai-i18n-tools <cmd>` (descarga el paquete para esa invocación; sin entrada en `package.json`).

<a id="cloned-ai-i18n-tools-monorepo"></a>
### Monorepo ai-i18n-tools clonado

Al desarrollar el paquete o ejecutar los **ejemplos** del espacio de trabajo desde un clon completo de [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools):

- **Ejemplos del espacio de trabajo** (`examples/console-app`, `examples/nextjs-app` y los otros paquetes listados en [`pnpm-workspace.yaml`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml)) — ejecuta `pnpm install` en la raíz del repositorio, luego `cd examples/<name>` y usa `pnpm exec ai-i18n-tools …` o los scripts `pnpm run i18n:*` del ejemplo. El [`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) del espacio de trabajo enlaza `ai-i18n-tools` a tu copia local.
- **Raíz del repositorio** — pnpm no enlaza el propio `bin` del paquete raíz en `node_modules/.bin`, y `npx ai-i18n-tools` en la raíz ejecuta el paquete **npm publicado**, no tu árbol de trabajo. Usa `node bin/ai-i18n-tools.mjs …` o los scripts `pnpm i18n:*` de la raíz en su lugar.
- **Fixtures independientes** (`multi-provider`, `test-markdown`) — desde la carpeta de fixtures, usa `node ../../bin/ai-i18n-tools.mjs …`.

Ejecuta `pnpm run build` en la raíz del repositorio después de cambiar el código fuente de la CLI. Consulta la [Guía de desarrollo](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development) para ver los pasos de compilación y las soluciones alternativas opcionales de instalación global.

En Linux, macOS y WSL, las instalaciones desde el registro establecen automáticamente el bit ejecutable en el script de la CLI. En Windows, los gestores de paquetes generan shim `.cmd` y `.ps1` que invocan Node explícitamente.

Los comandos de traducción (`translate-ui`, `translate-docs`, `translate-json`, `translate-svg`, `sync`) requieren **configuración del proveedor** en `ai-i18n-tools.config.json` y **una clave API** para el proveedor activo. Ejecute `ai-i18n-tools init` para generar un bloque OpenRouter predeterminado; edite `provider` / `providers` para cambiar los preajustes o modelos — consulte [Proveedores y modelos de LLM](/es/guide/providers-and-models). Ollama es el único preajuste integrado que no necesita clave API.

Establezca su clave de API de proveedor (se muestra OpenRouter; use la variable de entorno que coincida con su proveedor activo; consulte la [tabla de preajustes](/es/guide/providers-and-models#built-in-providers)):

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

O crea un archivo `.env` en la raíz del proyecto:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

<a id="tool-ui-language"></a>
### Idioma de la interfaz de usuario de la herramienta

La CLI localiza su propio texto de ayuda, resúmenes de registro y el Panel de traducción independientemente de las configuraciones regionales que traduzca. De forma predeterminada, sigue la configuración regional de su sistema operativo. Anule con `-L pt-BR`, `export AI_I18N_LANG=es` o `"uiLanguage"` en la configuración. Consulte [Idioma de la interfaz de usuario de la herramienta](/es/guide/tool-ui-language).
