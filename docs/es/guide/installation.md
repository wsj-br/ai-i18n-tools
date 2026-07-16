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

Para escribir el comando simple `ai-i18n-tools` en un shell interactivo, configure una de las opciones siguientes. Sin configuración, el shell no puede encontrar el binario incluso después de una instalación local.

**direnv** — añádalo a un `.envrc` en la raíz del proyecto (bash/zsh; consulte [direnv.net](https://direnv.net/)):

```bash
PATH_add node_modules/.bin
```

Después de `direnv allow`, el comando simple estará disponible cada vez que acceda al proyecto con `cd`.

**PATH manual** — desde la raíz del proyecto en un shell interactivo:

```bash
# bash/zsh
export PATH="$PWD/node_modules/.bin:$PATH"
ai-i18n-tools sync
```

```powershell
# Windows PowerShell
$env:Path = "$PWD\node_modules\.bin;$env:Path"
ai-i18n-tools sync
```

**Instalación global** — instale la CLI una vez e invóquela desde cualquier directorio:

```bash
npm install -g ai-i18n-tools
# or
pnpm add -g ai-i18n-tools
```

Una instalación global utiliza la versión globalmente fijada. Para fijar la versión por proyecto, prefiera direnv o PATH manual para que `node_modules/.bin` se resuelva en la dependencia del proyecto.

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

- **Ejemplos de espacio de trabajo** (`examples/console-app`, `examples/nextjs-app` y los otros paquetes listados en [`pnpm-workspace.yaml`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml)) — ejecute `pnpm install` en la raíz del repositorio, luego `cd examples/<name>`. Use los scripts `pnpm run i18n:*` del ejemplo, o configure PATH (vea [Uso de la CLI](#using-the-cli)) y ejecute `ai-i18n-tools …` directamente. El espacio de trabajo [`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) enlaza `ai-i18n-tools` a su copia local.
- **Raíz del repositorio** — pnpm no enlaza los propios `bin` del paquete raíz a `node_modules/.bin`. Use `node bin/ai-i18n-tools.mjs …` o scripts `pnpm i18n:*` de la raíz en su lugar (o un alias de shell / `pnpm add -g .` — vea [Guía de desarrollo](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development)).
- **Fixtures independientes** (`multi-provider`, `test-markdown`) — desde la carpeta de fixture, use `node ../../bin/ai-i18n-tools.mjs …`.

Ejecuta `pnpm run build` en la raíz del repositorio después de cambiar el código fuente de la CLI. Consulta la [Guía de desarrollo](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development) para ver los pasos de compilación y las soluciones alternativas opcionales de instalación global.

En Linux, macOS y WSL, las instalaciones desde el registro establecen automáticamente el bit ejecutable en el script de la CLI. En Windows, los gestores de paquetes generan shim `.cmd` y `.ps1` que invocan Node explícitamente.

Los comandos de traducción (`translate-ui`, `translate-docs`, `translate-json`, `translate-svg`, `sync`) requieren **configuración del proveedor** en `ai-i18n-tools.config.json` y **una clave API** para el proveedor activo. Ejecute `ai-i18n-tools init [-P <provider>]` para generar un bloque de proveedor predeterminado (`openrouter` si se omite); edite `provider` / `providers` para cambiar los preajustes o modelos — vea [Proveedores y modelos de LLM](/es/guide/providers-and-models). Ollama es el único preajuste incorporado que no necesita una clave API.

Establezca la clave API que coincida con su proveedor activo (vea la [tabla de preajustes](/es/guide/providers-and-models#built-in-providers)):

```bash
# Default init (openrouter)
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# Example: init -P anthropic
# export ANTHROPIC_API_KEY=sk-ant-your-key-here
```

O crea un archivo `.env` en la raíz del proyecto:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

<a id="tool-ui-language"></a>
### Idioma de la interfaz de usuario de la herramienta

La CLI localiza su propio texto de ayuda, resúmenes de registro y el Panel de traducción independientemente de las configuraciones regionales que traduzca. De forma predeterminada, sigue la configuración regional de su sistema operativo. Anule con `-L pt-BR`, `export AI_I18N_LANG=es` o `"uiLanguage"` en la configuración. Consulte [Idioma de la interfaz de usuario de la herramienta](/es/guide/tool-ui-language).
