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

<a id="standalone-executables"></a>
### Ejecutables independientes

Las versiones de GitHub incluyen una compilación de ejecutable único de Node.js. Los proyectos de Python ejecutan la CLI desde ese binario, incluidos `extract`, `translate-ui` y `suggest-models`, sin necesidad de instalar Node.js.

| Plataforma | Recurso |
| --- | --- |
| Linux x64 | `ai-i18n-tools-linux-x64` |
| Linux arm64 | `ai-i18n-tools-linux-arm64` |
| macOS arm64 | `ai-i18n-tools-macos-arm64` |
| macOS x64 | `ai-i18n-tools-macos-x64` |
| Windows x64 | `ai-i18n-tools-win-x64.exe` |

Cada versión también incluye `SHA256SUMS.txt` y `ai-i18n-tools-python-examples.zip` (los cuatro ejemplos de Python). El tarball de npm y el ejecutable no contienen esos ejemplos. Estos permanecen también en el repositorio.

1. Descargue el recurso que coincida con su equipo desde la página de [GitHub Releases](https://github.com/wsj-br/ai-i18n-tools/releases).
2. Compruebe la suma de verificación con `SHA256SUMS.txt`.
3. En Linux y macOS, ejecute `chmod +x` en el archivo y muévalo a `PATH` (o llámelo por su ruta).
4. En Windows, coloque `ai-i18n-tools-win-x64.exe` en `PATH`. Cambiarle el nombre a `ai-i18n-tools.exe` permite usar el mismo nombre de comando que en las otras plataformas.

Los binarios no están notariados ni firmados con Authenticode. Es posible que macOS le pida que apruebe un programa sin firmar. Windows SmartScreen puede mostrar una advertencia.

Configure la clave de API para el proveedor activo de la misma forma que en una instalación de npm (mediante una variable de entorno o un archivo `.env` en el directorio de trabajo). La lista de modelos de `init` es un punto de partida. `suggest-models` imprime una lista corta clasificada. `suggest-models --apply` la escribe en `translationModels`. La misma clasificación se encuentra en la pestaña [Models](/es/guide/translation-dashboard/models).

```bash
ai-i18n-tools init -t ui-python -P cheaperinference
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
ai-i18n-tools extract
ai-i18n-tools translate-ui
```

Tutorial: [Add i18n to a Python app](/es/guide/add-i18n-to-python). Referencia de comandos: [suggest-models](/es/reference/cli-commands/models#suggest-models).

ai-i18n-tools incluye su propio extractor de cadenas. Si anteriormente utilizaba `i18next-scanner`, `babel-plugin-i18next-extract` o similar, puede eliminar esas dependencias de desarrollo después de la migración. Los archivos **JSON de espacio de nombres** de i18next existentes pueden permanecer en la [canalización JSON](/es/guide/json#i18next-namespace-files). Los diccionarios `.content.ts` de Intlayer se pueden importar con `migrate-intlayer`; consulte [Migración desde Intlayer](/es/guide/migrating-from-intlayer).

<a id="using-the-cli"></a>
### Uso de la CLI

Instale `ai-i18n-tools` como dependencia o devDependency en su proyecto (consulte [Instalación](#installation) arriba). El paquete declara una entrada `bin` que su gestor de paquetes enlaza a `node_modules/.bin/ai-i18n-tools`. Ese shim (`bin/ai-i18n-tools.mjs` dentro del paquete instalado) carga la CLI compilada.

Para escribir el comando simple `ai-i18n-tools` en un shell interactivo, configure una de las opciones siguientes. Sin configuración, el shell no puede encontrar el binario incluso después de una instalación local.

**direnv** — añádalo a un `.envrc` en la raíz del proyecto (bash/zsh; consulte [direnv.net](https://direnv.net/)):

```bash
PATH_add node_modules/.bin
```

Después de `direnv allow`, el comando simple estará disponible cada vez que acceda al proyecto con `cd`.

**Ruta manual** — ejecute estos comandos desde la **raíz del proyecto** (el directorio que contiene `node_modules/.bin`). Los subdirectorios seguirán funcionando después, siempre que deje esa entrada `PATH` en su lugar; volver a ejecutar la exportación desde una carpeta anidada fallará porque `$PWD` ya no apunta a la raíz del proyecto.

```bash
# bash/zsh — from the project root
export PATH="$PWD/node_modules/.bin:$PATH"
ai-i18n-tools sync
```

```powershell
# Windows PowerShell — from the project root
$env:Path = "$PWD\node_modules\.bin;$env:Path"
ai-i18n-tools sync
```

**Instalación global** — instale la CLI una vez e invóquela desde cualquier directorio:

```bash
npm install -g ai-i18n-tools
# or
pnpm add -g ai-i18n-tools
```

Con pnpm, ejecute `pnpm setup` una vez por máquina (y abra un nuevo shell) si faltan comandos globales; pnpm requiere su directorio bin global en `PATH`. Una instalación global utiliza la versión fijada globalmente. Para fijar la versión por proyecto, prefiera direnv o PATH manual para que `node_modules/.bin` se resuelva en la dependencia del proyecto.

**`package.json` scripts** — cuando npm o pnpm ejecutan un script, anteponen `node_modules/.bin` a `PATH`, por lo que el nombre del comando base funciona dentro de los scripts sin cambios en la ruta del shell. Prefiera `sync` en lugar de encadenar manualmente los pasos de traducción — el orden y las banderas de características son fáciles de confundir cuando se ejecutan manualmente:

```json
"scripts": {
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:translate:json": "ai-i18n-tools translate-json",
  "i18n:dashboard": "ai-i18n-tools dashboard"
}
```

Luego ejecute, por ejemplo, `pnpm run i18n:sync`. Consulte [Scripts `package.json` recomendados](/es/guide/quick-start#recommended-packagejson-scripts) para ver el conjunto completo recomendado.

**Alternativas** — si prefiere no ajustar `PATH`: `npx ai-i18n-tools …` (npm) o `pnpm exec ai-i18n-tools …` (pnpm). Para una instalación única sin entrada `package.json`: `npx ai-i18n-tools <cmd>` o `pnpm dlx ai-i18n-tools <cmd>`.

<a id="cloned-ai-i18n-tools-monorepo"></a>
### Monorepo ai-i18n-tools clonado

Al desarrollar el paquete o ejecutar los **ejemplos** del espacio de trabajo desde un clon completo de [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools):

- **Ejemplos de espacio de trabajo** (`examples/console-app`, `examples/nextjs-app` y los otros paquetes listados en [`pnpm-workspace.yaml`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml)) — ejecute `pnpm install` en la raíz del repositorio, luego `cd examples/<name>`. Utilice los scripts `pnpm run i18n:*` del ejemplo, o configure PATH (consulte [Uso de la CLI](#using-the-cli)) y ejecute `ai-i18n-tools …` directamente. El enlace `ai-i18n-tools` del espacio de trabajo [`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) a su copia local.
- **Raíz del repositorio** — pnpm no vincula el propio `bin` del paquete raíz a `node_modules/.bin`. El `.envrc` de esta copia añade `bin/` a `PATH` para que el wrapper `bin/ai-i18n-tools` comprometido (junto al shim `bin/ai-i18n-tools.mjs` publicado) proporcione el comando directo después de `direnv allow`. Sin direnv, use `node bin/ai-i18n-tools.mjs …`, `./bin/ai-i18n-tools …` o los scripts `pnpm i18n:*` raíz (o un alias de shell / `pnpm add -g .` — consulte [Guía de desarrollo](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development)).
- **Fixtures independientes** (`multi-provider`, `test-markdown`) — desde la carpeta de fixtures, use `node ../../bin/ai-i18n-tools.mjs …`.

Ejecuta `pnpm run build` en la raíz del repositorio después de cambiar el código fuente de la CLI. Consulta la [Guía de desarrollo](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development) para ver los pasos de compilación y las soluciones alternativas opcionales de instalación global.

En Linux, macOS y WSL, las instalaciones desde el registro establecen automáticamente el bit ejecutable en el script de la CLI. En Windows, los gestores de paquetes generan shim `.cmd` y `.ps1` que invocan Node explícitamente.

Los comandos de traducción (`translate-ui`, `translate-docs`, `translate-json`, `translate-svg`, `sync`) requieren **configuración del proveedor** en `ai-i18n-tools.config.json` y **una clave de API** para el proveedor activo. Ejecuta `ai-i18n-tools init -P <provider>` para generar ese preajuste; edita `provider` / `providers` para añadir modelos — consulta [Proveedores y modelos de LLM](/es/guide/providers-and-models). La lista de modelos de `init` es un punto de partida. `ai-i18n-tools suggest-models` clasifica los modelos de chat del proveedor activo, y `suggest-models --apply` reemplaza a `translationModels`. La misma clasificación está en la pestaña [Modelos](/es/guide/translation-dashboard/models). Referencia de comandos: [suggest-models](/es/reference/cli-commands/models#suggest-models). Ollama es el único preajuste integrado que no necesita clave de API.

Establece la clave de API que coincida con el proveedor que pasas a `init` (consulta la [tabla de preajustes](/es/guide/providers-and-models#built-in-providers)):

```bash
# init -P openrouter
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# init -P openai
# export OPENAI_API_KEY=sk-your-key-here
```

O crea un archivo `.env` en la raíz del proyecto:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

<a id="tool-ui-language"></a>
### Idioma de la interfaz de usuario de la herramienta

La CLI localiza su propio texto de ayuda, resúmenes de registro y el Panel de traducción independientemente de las configuraciones regionales que traduzca. De forma predeterminada, sigue la configuración regional de su sistema operativo. Anule con `-L pt-BR`, `export AI_I18N_LANG=es` o `"uiLanguage"` en la configuración. Consulte [Idioma de la interfaz de usuario de la herramienta](/es/guide/tool-ui-language).
