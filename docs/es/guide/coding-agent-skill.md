<a id="coding-agent-skill"></a>
# Habilidad del agente de codificación

Una instalación copia todas las habilidades de consumidor. La [habilidad compartida](https://github.com/wsj-br/ai-i18n-tools/tree/main/skills/ai-i18n-tools) enseña a un agente cómo instalar y mantener `ai-i18n-tools` con `sync`, y carga solo la referencia que coincide con la tarea. Cada flujo de trabajo es un comando de barra diagonal separado, como `/ai-i18n-vitepress`.

La instalación del paquete npm o del ejecutable independiente no registra las habilidades. Utilice un método de instalación para cada agente.

<a id="install-with-the-skills-cli"></a>
## Instalar con la CLI de habilidades

Esta es la instalación que se debe usar cuando Node.js es 22.20 o posterior. La propia CLI de este paquete permite Node.js 22.16, lo cual es demasiado antiguo para la CLI de habilidades. En las versiones 22.16 a 22.19, o en una máquina sin Node.js, utilice [Descargar el directorio de habilidades](#download-the-skill-directory).

Desde el proyecto en el que desea que trabaje el agente:

```bash
npx skills add wsj-br/ai-i18n-tools
```

El comando instala cada directorio bajo `skills/`, incluyendo la habilidad compartida y cada comando de flujo de trabajo. No deja una copia de este repositorio en su proyecto. El alcance predeterminado es el proyecto actual. Añada `-g` para instalar para su usuario, en todos los proyectos.

```bash
npx skills add wsj-br/ai-i18n-tools --all -y
npx skills add wsj-br/ai-i18n-tools --list
npx skills add wsj-br/ai-i18n-tools --skill ai-i18n-vitepress -a cursor
npx skills update
```

`--all -y` es la instalación de un solo paso: todas las habilidades, sin solicitud. Sin `--all`, el instalador pregunta qué habilidades copiar. `--list` imprime las habilidades y no instala nada. `--skill` y `-a` omiten las solicitudes para una habilidad y un agente. `npx skills update` actualiza las habilidades instaladas de esta manera. Ejecute `add` de nuevo para detectar una habilidad que se añadió después de la primera instalación.

Para imprimir la habilidad como una solicitud, o para iniciar un agente compatible con ella, sin instalar:

```bash
npx skills use wsj-br/ai-i18n-tools@ai-i18n-tools
```

La CLI detecta los agentes de codificación instalados en la máquina. Las rutas de instalación para cada agente están en la [lista de agentes de la CLI de habilidades](https://github.com/vercel-labs/skills/blob/main/docs/agents.md). Esa lista cambia. Esta página no la repite y no afirma que cada herramienta de codificación lea una carpeta de habilidades.

La CLI de habilidades recopila datos de uso anónimos. Establezca `DISABLE_TELEMETRY=1` o `DO_NOT_TRACK=1` para desactivarlo.

Después de la instalación, inicie una nueva sesión de agente si ese producto requiere una recarga. Escriba un comando de flujo de trabajo como `/ai-i18n-vitepress`, o pida al agente que use la habilidad `ai-i18n-tools`. La habilidad compartida es la alternativa para una solicitud que no nombra un comando. Una habilidad descubierta no garantiza que el agente la invocará por sí mismo.

<a id="slash-commands"></a>
## Comandos de barra diagonal

La habilidad compartida `ai-i18n-tools` permanece disponible para el agente. Las otras habilidades son comandos explícitos. Cada una sigue la habilidad compartida, luego aplica solo su plantilla y comprobaciones.

| Comando | Flujo de trabajo |
| --- | --- |
| `/ai-i18n-js` | Interfaz de usuario de cadena de origen de JavaScript o TypeScript |
| `/ai-i18n-python` | Ayudante de Python generado y catálogos JSON planos |
| `/ai-i18n-django` | Django, Flask-Babel o gettext simple |
| `/ai-i18n-vitepress` | VitePress |
| `/ai-i18n-starlight` | Documentación de Astro Starlight |
| `/ai-i18n-docusaurus` | Docusaurus |
| `/ai-i18n-nextra` | Nextra |
| `/ai-i18n-fumadocs` | Fumadocs |
| `/ai-i18n-astro-website` | Sitio web de Astro Vanilla |
| `/ai-i18n-plain-html` | Un archivo HTML, cambiado en el navegador |
| `/ai-i18n-plain-html-docs` | Un árbol HTML por configuración regional |
| `/ai-i18n-readme` | README y Markdown del repositorio |
| `/ai-i18n-migrate-intlayer` | Migración única de Intlayer a llamadas `t()` |
| `/ai-i18n-translate-intlayer` | Rellenar los diccionarios de Intlayer in situ |

Las habilidades copiadas en `.agents/skills/` o `.cursor/skills/` aparecen como estos comandos. Un error actual de Cursor oculta las habilidades de los plugins del marketplace que configuran `disable-model-invocation` de la paleta `/`. Claude Code, Codex y Copilot siguen mostrando esos comandos. Usa la instalación de la CLI de habilidades cuando quieras los comandos en Cursor. Una solicitud en prosa sigue llegando a la habilidad compartida.

<a id="download-the-skill-directory"></a>
## Descargar el directorio de habilidades

Usa esto cuando la CLI de habilidades no esté disponible. Copia cada directorio de habilidades, no solo `ai-i18n-tools/`. Cada comando de flujo de trabajo es su propia carpeta con un `SKILL.md`. Un git clone y `npx degit` de una ruta de habilidad descargan el archivo fuente del repositorio, de unos 50 MB.

Elige un directorio de agente de la [lista de agentes de la CLI de habilidades](https://github.com/vercel-labs/skills/blob/main/docs/agents.md). Los ejemplos siguientes usan `.agents/skills/`, que varios agentes leen. Inspecciona ese destino antes de reemplazar una copia existente. Una copia por agente es suficiente. Una segunda copia en otra carpeta de descubrimiento para el mismo agente es un duplicado.

El paquete npm ya contiene los directorios. Cuando el paquete está instalado:

```bash
mkdir -p .agents/skills
cp -a node_modules/ai-i18n-tools/skills/. .agents/skills/
```

Sin `node_modules`, descarga el tarball de npm para la misma versión que informa la CLI. `ai-i18n-tools --version` imprime la versión y luego la marca de tiempo de la compilación. Usa solo el número de versión. El miembro del tarball es `package/skills/`.

```bash
mkdir -p .agents/skills
curl -fsSL https://registry.npmjs.org/ai-i18n-tools/-/ai-i18n-tools-1.12.0.tgz \
  | tar -xz --strip-components=2 -C .agents/skills package/skills
```

Reemplaza `1.12.0` con la versión que tienes instalada. Esto funciona para la versión actual. El ejecutable independiente no contiene los archivos de habilidad. Haz coincidir el tarball con `ai-i18n-tools --version`.

Desde la versión que lo añade, GitHub Releases también adjunta `ai-i18n-tools-skill.zip`. Ese zip contiene cada directorio de habilidades en su nivel superior. Descomprímelo en la carpeta de habilidades del agente para que el resultado incluya tanto `ai-i18n-tools/SKILL.md` como las carpetas de flujo de trabajo, como `ai-i18n-vitepress/SKILL.md`. Las versiones publicadas antes de ese zip no lo incluyen. Los zips más antiguos contienen solo `ai-i18n-tools/`. Usa el tarball de npm para esas versiones. La etiqueta es `v` más la versión de la CLI, por ejemplo `v1.12.0` una vez que la versión de esa etiqueta tenga el activo.

<a id="agents-the-skills-cli-installs"></a>
## Agentes que instala la CLI de habilidades

Pasa el ID a `-a` cuando quieras un agente. No se requiere nada más en este repositorio para estas herramientas.

Agentes de la CLI: Claude Code (`claude-code`), Codex CLI (`codex`), Gemini CLI (`gemini-cli`), Antigravity CLI (`antigravity-cli`), GitHub Copilot CLI (`github-copilot`), OpenCode (`opencode`), Goose (`goose`), Qwen Code (`qwen-code`), Kilo CLI (`kilo`), Grok Build (`grok`), Amp (`amp`), Crush (`crush`), Pi (`pi`), Kiro CLI (`kiro-cli`).

Editores e IDEs: Cursor (`cursor`), Windsurf (`windsurf`), Devin for Terminal (`devin`), Zed (`zed`), Antigravity (`antigravity`), Trae (`trae`), Junie (`junie`), Replit (`replit`), Cline (`cline`), Roo Code (`roo`), Kilo Code (`kilo`), Continue (`continue`), Augment (`augment`), Factory Droid (`droid`), Tabnine CLI (`tabnine-cli`). GitHub Copilot en un editor usa el mismo ID `github-copilot` que la CLI.

Dos detalles de ruta que son fáciles de pasar por alto:

- Cursor: una instalación de proyecto desde la CLI de skills va a `.agents/skills/`. `-g` va a `~/.cursor/skills/`. La propia documentación de Cursor también acepta `.cursor/skills/` en un proyecto. Usa una de esas.
- GitHub Copilot: la CLI de skills escribe `.agents/skills/` en el proyecto y `~/.copilot/skills/` para `-g`. La documentación del agente en la nube de GitHub también describe `.github/skills/`. Esa carpeta no es leída por todos los chats de Copilot. Usa solo la carpeta documentada para la superficie que utilizas.

El agente predeterminado de la CLI de Kiro carga `.kiro/skills/` y `~/.kiro/skills/` sin configuración adicional. Un agente Kiro personalizado necesita las skills instaladas listadas en `.kiro/agents/<agent>.json`:

```json
{
  "resources": ["skill://.kiro/skills/**/SKILL.md"]
}
```

<a id="native-catalogs"></a>
## Catálogos nativos

Algunos productos también instalan las skills desde un catálogo en este repositorio. Usa un canal para cada agente: el catálogo o la CLI de skills. Una actualización de paquete no actualiza una skill que fue copiada manualmente. `npx skills update` actualiza una instalación de la CLI de skills. Las instalaciones de catálogo siguen el comando de actualización de ese producto.

- Cursor Marketplace, después de que se apruebe el listado: instala `ai-i18n-tools` desde Cursor Marketplace. Hasta que ese listado exista, usa la CLI de skills. [Directorio de Cursor](https://cursor.directory) es un listado comunitario separado.
- Claude Code, desde una sesión de Claude Code:

```text
/plugin marketplace add wsj-br/ai-i18n-tools
/plugin install ai-i18n-tools@ai-i18n-tools
```

- GitHub Copilot CLI:

```bash
copilot plugin marketplace add wsj-br/ai-i18n-tools
```

Luego instala el plugin `ai-i18n-tools` desde ese marketplace. El ID del plugin es `ai-i18n-tools@ai-i18n-tools`. La CLI de Copilot lee el mismo archivo de catálogo que usa Claude Code.

- Codex:

```bash
codex plugin marketplace add wsj-br/ai-i18n-tools
```

Un listado de espacio de trabajo de ChatGPT es publicado por separado por un administrador del espacio de trabajo. Es una instalación diferente a la de este comando.

<a id="agents-without-a-skills-install"></a>
## Agentes sin una instalación de skills

Estos productos no están en la lista de agentes de la CLI de skills. Este repositorio no incluye una carpeta de skills separada para ellos. Dirige el agente al [contexto del consumidor](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) desde las instrucciones del proyecto, como `AGENTS.md`:

```markdown
Before installing or maintaining ai-i18n-tools, read
https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md
and follow only the linked reference that matches this project.
Use ai-i18n-tools sync for the configured workflow.
```

Ese archivo usa URLs de sitios de documentación y de repositorio, por lo que la instrucción sigue funcionando cuando el agente no puede leer este repositorio. Para una CLI más antigua, abre la misma ruta en la etiqueta de lanzamiento correspondiente. Los proyectos de consumidor usan este archivo de contexto. El mantenedor `AGENTS.md` se aplica al cambiar este repositorio.

Productos en este grupo: Aider, gptme, Amazon Q Developer CLI, DeepSeek Harness, JetBrains AI Assistant, Sourcegraph Cody, Qodo, el plugin de IDE de Tabnine, CodeGeeX y AskCodi. Junie es el agente de JetBrains que sí acepta una instalación de la CLI de skills. La CLI de Tabnine también. AiderDesk es una aplicación diferente de Aider.

CodeLayer y Superset no tienen un directorio de skills propio. CodeLayer ejecuta Claude Code, así que instala la skill para Claude Code. Superset ejecuta los agentes de la CLI que configures, así que instala la skill para esos agentes.

<a id="stay-on-the-same-version"></a>
## Mantente en la misma versión

Mantén la skill en la misma versión que el comando `ai-i18n-tools`. Una actualización de npm, y un ejecutable independiente más reciente, dejan una skill copiada manualmente donde estaba. Instala la skill de nuevo desde la versión correspondiente, o ejecuta `npx skills update` para una instalación de la CLI de skills.

La documentación en línea puede describir una versión más reciente que el comando que tienes instalado. Prefiere `ai-i18n-tools --help` para las opciones. Referencia adicional: [instalación](/es/guide/installation), [configuración](/es/reference/configuration), [proveedores](/es/guide/providers-and-models), [referencia de la CLI](/es/reference/cli-commands/).
