<a id="installation"></a>
# Instalación

Esta página instala la CLI y hace que el comando `ai-i18n-tools` básico funcione. ¿Ya está instalada? Ve a [Inicio rápido](/es/guide/quick-start).

El paquete publicado es solo ESM. Use `import` o `import()` en Node.js o su empaquetador; no use `require('ai-i18n-tools')`. El paquete declara `engines.node` `>=22.16.0`; las versiones anteriores de Node.js no son compatibles. El tarball de npm incluye el contexto del consumidor en `docs/ai-i18n-tools-context.md` y el árbol completo de `skills/`, no el sitio de documentación completo; las copias específicas de la configuración regional en `translated-docs/` están en el [repositorio de GitHub](https://github.com/wsj-br/ai-i18n-tools/tree/main/translated-docs).

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

Linux y macOS:

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell):

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

El instalador detecta el sistema, descarga el ejecutable correspondiente, comprueba `SHA256SUMS.txt`, instala el comando como `ai-i18n-tools` (`ai-i18n-tools.exe` en Windows) y añade el directorio de instalación a `PATH`. El directorio predeterminado es `~/.local/bin`. Abre una nueva terminal si el comando aún no se encuentra. Establece `AI_I18N_VERSION` (por ejemplo, `v1.11.0`) para fijar una versión, o `AI_I18N_INSTALL_DIR` para elegir otro directorio.

Los binarios no están notarizados ni firmados con Authenticode. macOS puede pedirle que apruebe un programa sin firmar. Windows SmartScreen puede mostrar una advertencia. El instalador de macOS borra la bandera de cuarentena después de que la suma de verificación coincida.

Cada lanzamiento también adjunta `SHA256SUMS.txt` y `ai-i18n-tools-python-examples.zip` (los cuatro ejemplos de Python). A partir del lanzamiento que lo añade, la misma página incluye `ai-i18n-tools-skill.zip`, cada directorio de habilidad del agente de codificación. Los lanzamientos publicados antes de ese zip no lo incluyen, y el primer zip contiene solo `ai-i18n-tools/`. `install.sh` y `install.ps1` permanecen en la raíz del repositorio, y los comandos anteriores los descargan desde allí. El tarball de npm y el ejecutable no contienen los ejemplos de Python ni el zip de habilidades. Los ejemplos permanecen en el repositorio. Los directorios de habilidades están dentro del tarball de npm. Consulte [Habilidad del agente de codificación](/es/guide/coding-agent-skill#download-the-skill-directory).

<details>
<summary>Instrucciones manuales para instalar el ejecutable <code>ai-i18n-tools</code></summary>

| Plataforma | Recurso |
| --- | --- |
| Linux x64 | `ai-i18n-tools-linux-x64` |
| Linux arm64 | `ai-i18n-tools-linux-arm64` |
| macOS arm64 | `ai-i18n-tools-macos-arm64` |
| macOS x64 | `ai-i18n-tools-macos-x64` |
| Windows x64 | `ai-i18n-tools-win-x64.exe` |

1. Descarga el recurso que coincida con la máquina y `SHA256SUMS.txt`, desde la página [GitHub Releases](https://github.com/wsj-br/ai-i18n-tools/releases).
2. Comprueba la suma de comprobación. En Linux, `grep ' ai-i18n-tools-linux-x64$' SHA256SUMS.txt | sha256sum -c -` (usa el nombre del recurso que descargaste). En macOS, la misma línea con `shasum -a 256 -c -`. En Windows, `(Get-FileHash -Algorithm SHA256 .\ai-i18n-tools-win-x64.exe).Hash` y compáralo con el hash en `SHA256SUMS.txt`.
3. Renombra el archivo descargado a `ai-i18n-tools` y coloca ese directorio en `PATH`.

Linux y macOS, usando el recurso Linux x64 como ejemplo (sustituye el recurso que descargaste):

```bash
mkdir -p "$HOME/.local/bin"
mv ai-i18n-tools-linux-x64 "$HOME/.local/bin/ai-i18n-tools"
chmod +x "$HOME/.local/bin/ai-i18n-tools"
```

Si `$HOME/.local/bin` aún no está en `PATH`, añade esto al perfil de shell (`.bashrc`, `.bash_profile`, `.profile` o `.zshrc`) y abre una nueva terminal:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

Windows (PowerShell), renombrando `ai-i18n-tools-win-x64.exe` a `ai-i18n-tools.exe`:

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.local\bin" | Out-Null
Move-Item -Force .\ai-i18n-tools-win-x64.exe "$env:USERPROFILE\.local\bin\ai-i18n-tools.exe"
$installDir = "$env:USERPROFILE\.local\bin"
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ([string]::IsNullOrEmpty($userPath)) {
  [Environment]::SetEnvironmentVariable("Path", $installDir, "User")
} elseif ($userPath -notlike "*${installDir}*") {
  [Environment]::SetEnvironmentVariable("Path", "$installDir;$userPath", "User")
}
```

Abre una nueva terminal y ejecuta `ai-i18n-tools --version`. El nombre del comando es `ai-i18n-tools` en todas las plataformas.

</details>

Establece la clave de API para el proveedor activo de la misma manera que una instalación de npm (consulta a continuación). Luego:

```bash
ai-i18n-tools init -t ui-python -P cheaperinference
ai-i18n-tools suggest-models --apply
ai-i18n-tools sync
```

Use `init` solo para una nueva configuración: sobrescribe el archivo de configuración seleccionado. Para proyectos existentes, edite la configuración en su lugar. `sync` gestiona todas las canalizaciones de traducción configuradas/habilitadas, incluida la extracción de la interfaz de usuario.

Tutorial: [Add i18n to a Python app](/es/guide/add-i18n-to-python). Referencia de comandos: [suggest-models](/es/reference/cli-commands/models#suggest-models).

<a id="set-the-api-key"></a>
### Establecer la clave de API

Los comandos de traducción (`translate-ui`, `translate-docs`, `translate-json`, `translate-svg`, `sync`) requieren la configuración del proveedor en `ai-i18n-tools.config.json` y una clave de API para el proveedor activo. Ejecuta `ai-i18n-tools init -P <provider>` para generar ese preset. Presets de proveedor y claves de API: [Proveedores de LLM](/es/guide/providers-and-models). La lista de modelos de `init` es un punto de partida. Reemplázala desde [Modelos de IA](/es/guide/ai-models) con `suggest-models` o la pestaña **Modelos** del panel de control. Ollama es el único preset integrado que no necesita una clave de API.

Establece la clave que coincida con el proveedor que pasas a `init` (consulta la [tabla de preajustes](/es/guide/providers-and-models#built-in-providers)):

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

<a id="using-the-cli"></a>
### Uso de la CLI

Instale `ai-i18n-tools` como dependencia o devDependency en su proyecto (consulte la parte superior de esta página). Si el código de la aplicación importa `ai-i18n-tools/runtime`, manténgalo disponible en el entorno de tiempo de ejecución/compilación de producción; una CLI global o un binario independiente no pueden satisfacer esa importación. El paquete declara una entrada `bin` que su gestor de paquetes enlaza a `node_modules/.bin/ai-i18n-tools`. Ese shim (`bin/ai-i18n-tools.mjs` dentro del paquete instalado) carga la CLI compilada.

Para escribir el comando simple `ai-i18n-tools` en un shell interactivo, configure una de las opciones siguientes. Sin configuración, el shell no puede encontrar el binario incluso después de una instalación local.

direnv — añade a un `.envrc` en la raíz del proyecto (bash/zsh; consulta [direnv.net](https://direnv.net/)):

```bash
PATH_add node_modules/.bin
```

Después de `direnv allow`, el comando simple estará disponible cada vez que acceda al proyecto con `cd`.

PATH manual — ejecuta esto desde la raíz del proyecto (el directorio que contiene `node_modules/.bin`). Los subdirectorios seguirán funcionando siempre que dejes esa entrada `PATH` en su lugar; volver a ejecutar la exportación desde una carpeta anidada fallará porque `$PWD` ya no apunta a la raíz del proyecto.

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

Instalación global — instala la CLI una vez e invócala desde cualquier directorio:

```bash
npm install -g ai-i18n-tools
# or
pnpm add -g ai-i18n-tools
```

Con pnpm, ejecute `pnpm setup` una vez por máquina (y abra un nuevo shell) si faltan comandos globales; pnpm requiere su directorio bin global en `PATH`. Una instalación global utiliza la versión fijada globalmente. Para fijar la versión por proyecto, prefiera direnv o PATH manual para que `node_modules/.bin` se resuelva en la dependencia del proyecto.

scripts de package.json — cuando npm o pnpm ejecutan un script, anteponen `node_modules/.bin` a `PATH`, por lo que el nombre del comando básico funciona dentro de los scripts sin cambios en el PATH del shell:

```json
"scripts": {
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:dashboard": "ai-i18n-tools dashboard"
}
```

Luego ejecuta, p. ej., `pnpm run i18n:sync`. Consulta [Scripts recomendados en package.json](/es/guide/quick-start#recommended-packagejson-scripts) para ver el conjunto completo recomendado.

Alternativas — si prefieres no ajustar `PATH`: `npx ai-i18n-tools …` (npm) o `pnpm exec ai-i18n-tools …` (pnpm). Para una ejecución única sin instalación y sin entrada `package.json`: `npx ai-i18n-tools <cmd>` o `pnpm dlx ai-i18n-tools <cmd>`.

<a id="coding-agent-skill"></a>
### Habilidad del agente de codificación

La instalación del paquete npm o del ejecutable independiente no registra la habilidad con un agente. Los métodos de instalación, los catálogos nativos y los agentes que no tienen una carpeta de habilidades están en [Habilidad del agente de codificación](/es/guide/coding-agent-skill).

Obtenga cada directorio de habilidad, cada uno una carpeta que contiene `SKILL.md`, sin clonar este repositorio:

1. Node.js 22.20 o posterior: `npx skills add wsj-br/ai-i18n-tools --all -y` instala esos directorios en la carpeta de habilidades del agente.
2. Paquete ya instalado: copie `node_modules/ai-i18n-tools/skills/.` en esa carpeta.
3. Sin Node.js: extraiga `package/skills/` del tarball de npm para la versión en `ai-i18n-tools --version`. A partir del lanzamiento que lo añade, `ai-i18n-tools-skill.zip` en ese lanzamiento de GitHub contiene los mismos directorios. Los lanzamientos publicados antes del zip no lo incluyen. El primer zip contiene solo `ai-i18n-tools/`.

Los comandos y las carpetas del agente están en [Habilidad del agente de codificación](/es/guide/coding-agent-skill#download-the-skill-directory).

<a id="cloned-monorepo"></a>
### Monorepo clonado

Al desarrollar el paquete o ejecutar ejemplos del espacio de trabajo desde un clon completo de [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools):

- Ejemplos del espacio de trabajo (`examples/console-app`, `examples/nextjs-app` y los otros paquetes listados en [`pnpm-workspace.yaml`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml)) — ejecuta `pnpm install` en la raíz del repositorio, luego `cd examples/<name>`. Usa los scripts `pnpm run i18n:*` del ejemplo, o configura PATH (consulta [Uso de la CLI](#using-the-cli)) y ejecuta `ai-i18n-tools …` directamente. El espacio de trabajo [`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) enlaza `ai-i18n-tools` a tu copia local.
- Raíz del repositorio — pnpm no enlaza el propio `bin` del paquete raíz en `node_modules/.bin`. El `.envrc` de esta copia añade `bin/` a `PATH` para que el wrapper `bin/ai-i18n-tools` (junto al shim `bin/ai-i18n-tools.mjs` publicado) proporcione el comando directo después de `direnv allow`. Sin direnv, usa `node bin/ai-i18n-tools.mjs …`, `./bin/ai-i18n-tools …` o los scripts `pnpm i18n:*` de la raíz (o un alias de shell / `pnpm add -g .`).
- Fixtures independientes (`multi-provider`, `test-markdown`) — desde la carpeta de fixtures, usa `node ../../bin/ai-i18n-tools.mjs …`.

Ejecuta `pnpm run build` en la raíz del repositorio después de cambiar el código fuente de la CLI. Consulta la [Guía de desarrollo](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development) para ver los pasos de compilación y las soluciones alternativas opcionales de instalación global.

En Linux, macOS y WSL, las instalaciones desde el registro establecen automáticamente el bit ejecutable en el script de la CLI. En Windows, los gestores de paquetes generan shim `.cmd` y `.ps1` que invocan Node explícitamente.

Siguiente: [Inicio rápido](/es/guide/quick-start).
