<a id="add-i18n-to-a-python-app"></a>
# Añadir i18n a una aplicación Python

Esta página toma una aplicación Python que tiene un solo idioma y le añade configuraciones regionales con ai-i18n-tools. Sigue una ruta: la plantilla `ui-python`, un pequeño asistente `i18n.py` y archivos JSON de traducciones. Esa ruta se adapta a Streamlit, FastAPI, Flask, aplicaciones de escritorio y scripts.

La forma más rápida es darle a un agente de codificación la instrucción de esta página. Configura la configuración, envuelve tus cadenas de texto, comprueba el resultado y puede añadir un menú de idiomas. Tú instalas la CLI, eliges el proveedor e inicializas el proyecto tú mismo, porque eso requiere tu clave API y tus elecciones. También ejecutas la traducción tú mismo, porque gasta dinero de tu cuenta.

¿Usas Django, catálogos de Flask-Babel o GNU gettext, y quieres mantener esas llamadas? Usa [Añadir i18n a una aplicación Django / Python gettext](/es/guide/add-i18n-to-django-gettext) en su lugar. Mantiene `gettext` y escribe archivos `.po` y `.mo`, sin asistente. ¿No estás seguro de cuál aplica? Consulta [¿No es tu caso?](#not-your-case) al final.

El flujo:

1. [Instala la CLI y elige un proveedor](#install-and-choose-a-provider).
2. [Inicializa el proyecto](#initialise-the-project) con `init`.
3. [Ejecuta la instrucción del agente](#run-the-agent-prompt).
4. [Revisa el resultado](#review-the-result).
5. [Elige modelos y traduce](#choose-models-and-translate), luego comprueba un idioma.
6. [Mantenlo traducido](#keep-it-translated).

¿Prefieres hacer los cambios tú mismo o quieres saber qué hace la instrucción? [Hazlo manualmente](#do-it-by-hand) recorre los mismos pasos uno por uno.

<a id="install-and-choose-a-provider"></a>
## Instalar y elegir un proveedor

Tú haces esta parte, no el agente. El instalador cambia tu máquina, y la clave API es un secreto que pertenece a tu shell, no a una instrucción.

Usa el paquete npm cuando la máquina ya tiene Node.js `>=22.16.0` ([Instalación](/es/guide/installation)). Para un proyecto de Python, instala el ejecutable independiente (sin Node.js).

Linux y macOS:

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell):

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

El instalador comprueba `SHA256SUMS.txt`, instala el comando como `ai-i18n-tools` y lo añade a `PATH`. Los binarios no están notariados ni firmados con Authenticode. Pasos manuales y nombres de activos: [Ejecutables independientes](/es/guide/installation#standalone-executables).

Comprueba la instalación:

```bash
ai-i18n-tools --version
```

Luego, elige un proveedor y configura su clave API en el shell que ejecutará la traducción. Por ejemplo, Cheaper Inference:

```bash
export CHEAPERINFERENCE_API_KEY=your-key-here
```

Ollama no necesita clave. Otros preajustes: [Proveedores integrados](/es/guide/providers-and-models#built-in-providers). Anota el nombre del proveedor, porque lo pasarás a `init` en el siguiente paso. El agente nunca necesita la clave: solo ejecuta comandos que no hacen llamadas a modelos. Usarás la clave más tarde, cuando [traduzcas](#choose-models-and-translate).

<a id="initialise-the-project"></a>
## Inicializar el proyecto

Esto se ejecuta una vez, antes de la instrucción. Escribe la configuración y el asistente `i18n.py`, y utiliza el proveedor que elegiste anteriormente.

Esta página utiliza una plantilla, `ui-python`. Escribe la configuración, el asistente `i18n.py` y los catálogos JSON. Se adapta a estas aplicaciones:

| Tu aplicación | Notas |
| --- | --- |
| Streamlit | El menú de idiomas requiere unas pocas líneas en la aplicación; consulta [Añadir un selector de idioma](#step-4-add-a-language-switch) |
| FastAPI | La configuración regional se establece por solicitud |
| Flask | Catálogos JSON planos. Para catálogos de Flask-Babel en `translations/`, usa la [página de gettext](/es/guide/add-i18n-to-django-gettext) |
| Pyramid | Misma conexión que Flask |
| Aplicaciones de escritorio (Tkinter, PyQt, PySide) | Reconstruye el texto visible después de que cambie la configuración regional |
| PyWebView | La plantilla cubre el shell de Python. Traduce su página HTML por separado |
| Herramientas de línea de comandos y scripts | El caso más simple |

Ejecuta init con el proveedor que elegiste (Cheaper Inference en este ejemplo):

```bash
ai-i18n-tools init -t ui-python -P cheaperinference
```

Luego edita `sourceLocale` y `targetLocales` en `ai-i18n-tools.config.json`. `sourceLocale` es el idioma de las cadenas de texto en el origen. Cualquier idioma BCP-47 es válido; los ejemplos suelen usar `en`.

Ejecuta `init` una vez. Reescribe `ai-i18n-tools.config.json` cada vez, por lo que una segunda ejecución descarta las ediciones que hayas hecho. Si `i18n.py` ya contiene el marcador `ai-i18n-tools-i18n-py`, el proyecto ya está inicializado: omite este paso.

`init` establece `ui.sourceRoots` en `"."`, por lo que `extract` escanearía todo el repositorio (pruebas, scripts, documentos). La instrucción lo restringe al código de tu aplicación (manualmente, es decir, [Paso 1](#place-the-helper)).

Conexión del framework: [Integraciones de Python](/es/guide/integrations/python). Formas de llamada y diseño del catálogo: [Aplicaciones de Python](/es/guide/ui-strings/python).

<a id="run-the-agent-prompt"></a>
## Ejecutar el prompt del agente

Abre el proyecto en tu agente de codificación (Cursor, Claude Code, Copilot o similar), inicia un nuevo chat y pega la instrucción a continuación. El proyecto ya debe estar inicializado. No hay nada que editar. Si quieres que se omita algo, por ejemplo, que no haya menú de idiomas, indícalo en el mismo mensaje.

El agente primero verifica que la CLI, la configuración y `i18n.py` existan, y se detiene con instrucciones si falta alguno. Luego funciona en tres partes:

- La Parte 1 coloca `i18n.py` y `locales/` donde el repositorio guarda su código, y apunta la configuración hacia ellos.
- La Parte 2 envuelve las cadenas de texto orientadas al usuario en `t()` y `_()`, ejecuta `extract` y verifica las llamadas envueltas con `migrate-python-i18n`.
- La Parte 3 añade un menú de idioma, o una opción de idioma de la CLI y la configuración regional del entorno.

No instala ni inicializa nada, lee tu clave de API, ni traduce. La traducción es el paso posterior a la revisión, y tú la ejecutas.

````markdown
# Add languages to this Python app

## Before you start

The user must already have installed ai-i18n-tools and initialised this
project. Check that `ai-i18n-tools --version` runs, that
`ai-i18n-tools.config.json` exists, and that an `i18n.py` containing
`ai-i18n-tools-i18n-py` exists. If any of them is missing, stop now and tell
the user to install ai-i18n-tools and run
`ai-i18n-tools init -t ui-python -P <provider>`, then run this prompt again.
Do not install or initialise anything yourself.

## Rules

- Do not read or search the ai-i18n-tools source. This prompt is complete.
- Never read, print, or write API keys, `.env` files, or the shell environment.
- Do not run `translate-ui` or `suggest-models`. They call the translation API
  and cost money. The user runs them after reviewing your work.
- Do not translate, reword, or rename source text. Do not edit `i18n.py` or
  generated files (`strings.json`, per-locale JSON, `ui-languages.json`). Do not
  add another helper module.
- Do not reformat unrelated code. Keep existing blank lines. Run the project's
  formatter and linter at the end. Leave unrelated edits in a dirty tree alone.
  Delete throwaway scripts and do not commit them.

## Part 1 — Place the helper and the catalogs

Skip this part when `i18n.py` and `locales/` already sit with the code that
uses them and the config points at them.

1. Move `i18n.py` and `locales/` together to where this repository keeps its
   code. A script: leave them at the root. A package or `src/` layout: put them
   in the package, beside the modules that import them. `i18n.py` loads
   `locales/` from its own folder, so do not edit paths inside it.
2. In `ai-i18n-tools.config.json`, point `ui.stringsJson`, `ui.flatOutputDir`,
   and `languagesManifestPath` (if it is set) at the new `locales/`. Set
   `ui.sourceRoots` to the application code instead of `"."`.
3. Update imports (`from i18n import t`, or `from mypkg.i18n import t`). If the
   app is installed or shipped (wheel, container), include `locales/*.json` as
   package data.
4. Run `ai-i18n-tools extract` and confirm the catalog is in the new place.

## Part 2 — Wrap strings

The literal in `t("…")` is the source-language sentence and the catalog key.
With the source locale active, the app must behave exactly as before. Text that
is already wrapped needs no change.

- Wrap text a person sees: labels, titles, captions, messages, errors,
  validation text, progress lines, emails. Leave SQL, regexes, file formats, log
  messages, CSS, identifiers, widget keys, status and enum codes, number and
  date formats, and prompts sent to a model.
- Call shapes: `t("Hello, {name}!", name=name)` and `_("Hello, %s!") % name`.
  Placeholders are `{name}`, `{price:,.2f}`, `{rate:.2%}`, or `{item!r}`, passed
  as keyword arguments. No dotted fields: pass `rate=row.rate`. Keep a literal
  `%` away from a printf letter such as `%d`.
- Look up first, then format. Never `_(f"…")`, `_("…" % x)`, or
  `_("…".format(…))`.
- The argument must be a string literal, so `t(variable)` is invisible. Use one
  `t()` per sentence or paragraph, with values as placeholders. Split only where
  the text already branches. Keep markers that the code detects outside `t()`.
- A value that is both stored and shown keeps its source-language value.
  Translate the label where it is displayed, and compare against the stored
  value.
- `t()` at module level runs once and freezes. Call it where the text is shown.
- Put the import with the project's other first-party imports.

Work in passes: list string literals that are not passed to `t` or `_` (a
throwaway script is fine), wrap the user-facing ones, then list again. Treat any
bulk rewrite as a draft and review its diff.

Then run `ai-i18n-tools extract` and `ai-i18n-tools migrate-python-i18n`
without `--write`, and read `migrate-python-i18n-report.md`. It finds calls that
format before the lookup. Apply its edits with `--write` only after reading
them, run `extract` again, and repeat until the dry run lists nothing. Fix
manual-review lines by hand. A clean report does not prove every sentence is
wrapped, so keep scanning. Do not commit the report.

## Part 3 — Language switch

Skip this part only when the program shows no text a person reads (a silent
job or a JSON-only API), or when the user asked you to leave language choice
out. A command-line program still gets this part: it has no menu, but it gets
a language option and the process locale, the same idea as the ai-i18n-tools
CLI (`-L` / `--ui-lang`, then `AI_I18N_LANG`, then a saved setting, then the
operating-system locale).

Goal: one chosen language applies to every `t()` in that run, and a screen can
remember the choice. Work out how this project's framework does it, using these
rules:

1. Choose the locale where one unit of work starts (process start, a request,
   a script rerun, window start-up, a UI event), and call `set_locale` before
   the first `t()`. That includes CLI help, usage errors, and page titles set
   before the body.
2. Choose in this order: the explicit choice (CLI option, selector, `?lang=`),
   the stored choice (settings, cookie, session), the environment, then the
   source locale. Accept only codes from `get_ui_languages()`, matched
   case-insensitively and by language (`pt-br` and `pt` become `pt-BR`).
   `set_locale` does not match. An explicit option or the app's own language
   variable that names an unavailable language warns once, then uses the source
   locale. A locale taken only from the operating system does not warn.
3. Keep the locale local to the unit of work: keep the token from `set_locale`
   and call `reset_locale(token)` in `finally` or a teardown hook. A new thread
   starts in the source locale.
4. On a screen, add a selector built from `get_ui_languages()` (each row has
   `code` and `label`), labelled `t("Language")`, on every screen that should
   switch, and store the choice. A CLI does not get a selector.
5. Make the change visible on the next command, a page reload, `st.rerun()`, or
   a function that re-applies every visible string. Each string is a
   `t("literal")` so the extractor sees it.
6. Set the text direction from `get_direction()` where the framework needs it.

Command-line programs:

- Add `--lang <code>`, `-L <code>`, and `--lang=<code>`, unless the program
  already uses those names. Read the option from the raw arguments before
  argparse builds help, so `--help` is translated too. Document the option in
  that help.
- After the option, read a language environment variable the app already owns.
  Do not read `AI_I18N_LANG`; that variable is only for the ai-i18n-tools CLI.
  With no such variable, use `LC_ALL`, then `LC_MESSAGES`, then `LANG`, and
  ignore a value of `C` or `POSIX`.
- After the environment, use a language already stored in the app's config.
  Then the host locale, then the source locale. Do not add a new config file
  just to remember the language.

Hints, to adapt rather than copy. Web apps: a middleware or before-request hook
chooses the locale, an after-request hook stores the cookie, and templates get
`t`, `_`, and the language helpers. Streamlit: set the locale at the top of the
entry script, before `st.set_page_config`, with a selectbox that has a fixed
`key`, sets `?lang=`, and calls `st.rerun()`; `streamlit_language_selector()`
sets the locale only after it is drawn. Desktop: set the saved locale before
building the window, and refresh the visible text in the selector handler.

## Verify and report

The tests pass, and none leaves a non-source locale active (`reset_locale` needs
the token from `set_locale`). `extract` writes a non-empty catalog. With the
source locale, the output is unchanged.

Report the files changed, skipped strings grouped by reason, plurals left as one
string, one word with several meanings, sentences built from translated pieces,
and any `t()` that runs at import time. Then list the commands for the user, and
do not run them: `ai-i18n-tools suggest-models` (optional),
`ai-i18n-tools translate-ui`, then restart the app.
````

<a id="review-the-result"></a>
## Revisar el resultado

El agente finaliza con un informe. Revísalo antes de traducir:

- La diferencia. El texto envuelto debe leerse igual que antes, sin reformateos no relacionados. `git diff --stat` muestra cuánto cambió.
- Las cadenas omitidas y los casos ambiguos en el informe: plurales dejados como una sola cadena, una palabra usada como valor almacenado y como título, y oraciones construidas a partir de piezas traducidas. Decide esos a mano.
- `ai-i18n-tools extract` se ejecuta sin problemas, y `strings.json` está en la carpeta que esperas.
- Tus pruebas pasan, y la aplicación se ve igual en el idioma de origen.
- No se dejó ningún script desechable o `migrate-python-i18n-report.md`.

Las cadenas que el agente omitió aparecen como texto que permanece en el idioma de origen más tarde. [Paso 2](#wrap-strings) tiene un script opcional que imprime texto que no está envuelto.

<a id="choose-models-and-translate"></a>
## Elegir modelos y traducir

Tú ejecutas esta parte. Utiliza tu clave de API y gasta dinero de tu cuenta.

La lista de modelos de `init` es un punto de partida. Clasifique los modelos de chat del proveedor activo y, cuando la lista corta parezca correcta, escríbala en `translationModels`:

```bash
ai-i18n-tools suggest-models 
ai-i18n-tools suggest-models --apply
```

`--apply` reemplaza solo `translationModels`. Usa `--max-output-price` para excluir modelos cuyo precio de salida exceda un límite. Si prefieres una GUI, usa `ai-i18n-tools dashboard` para seleccionar los [modelos](/es/guide/translation-dashboard/models).

Luego extrae y traduce:

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
```

`extract` escribe `strings.json` y `ui-languages.json`. `translate-ui` escribe un archivo JSON por idioma de destino. Deja esos archivos generados sin editar.

`t()` busca la oración de origen en el JSON de configuración regional. El ID en `strings.json` no es la clave de búsqueda. Un archivo faltante o una clave faltante devuelve la oración de origen. El ayudante mantiene el JSON cargado en memoria para el proceso, incluyendo un mapa vacío cuando el archivo faltaba en la primera búsqueda, así que reinicia la aplicación después de `translate-ui`.

<a id="check-one-language"></a>
### Comprobar un idioma

Reinicia la aplicación, cambia a un idioma de destino y abre una página con algunas cadenas envueltas. Usa el menú de idioma que añadió el agente, o configura la configuración regional manualmente. El texto que todavía está en el idioma de origen no fue envuelto, se ejecuta en el momento de la importación o no tiene entrada en `locales/<code>.json`. Verifica el JSON para la oración antes de sospechar del código.

<a id="keep-it-translated"></a>
## Mantenerlo traducido

Vuelve a ejecutar `ai-i18n-tools sync` (o `extract` y luego `translate-ui`) después de cambiar el texto de origen. La caché significa que solo las cadenas nuevas o modificadas van al modelo. Ejecútalo en CI para que las traducciones no se desvíen. Reinicia la aplicación después de una ejecución de traducción para que recargue el JSON. `ai-i18n-tools dashboard` abre el [Panel de Traducción](/es/guide/translation-dashboard/) para revisar las traducciones.

Para traducir `README.md` en la misma ejecución, genera la estructura con `--with-readme` (o añade el bloque a una configuración existente). Consulta [Añadir i18n a tus archivos README y de Markdown](/es/guide/add-i18n-to-readme).

<a id="do-it-by-hand"></a>
## Hágalo manualmente

Sigue estos pasos si prefieres hacer los cambios tú mismo, o si quieres saber qué hace el prompt. Cada paso coincide con una parte del prompt. Aun así, [instalas la CLI](#install-and-choose-a-provider), [inicializas el proyecto](#initialise-the-project) y [traduces](#choose-models-and-translate) al final.

1. [Coloca el ayudante y los catálogos](#place-the-helper) donde este repositorio guarda su código.
2. [Envuelve cadenas](#wrap-strings) en `t()` o `_()`.
3. [Verifica las llamadas envueltas](#step-3-check-wrapped-calls) con `migrate-python-i18n`.
4. [Añade un selector de idioma](#step-4-add-a-language-switch).

<a id="step-1-place-the-helper-and-the-catalogs"></a>
## Paso 1: Coloca el ayudante y los catálogos

`init` escribe esto en la raíz del repositorio:

| Archivo | Qué es | ¿Editar? |
| --- | --- | --- |
| `i18n.py` | El ayudante que tu código importa (`t`, `_`, `set_locale`) | No. Es generado |
| `locales/strings.json` | La caché de extracción. La aplicación nunca la lee | No. Es generada por el extractor |
| `locales/<code>.json` | Las traducciones que carga la aplicación, un archivo por idioma | No. `translate-ui` las escribe |
| `locales/ui-languages.json` | La lista de idiomas, para un menú de idioma | No. Es generada por el extractor |

`i18n.py` carga `locales/` desde la carpeta en la que se encuentra. Mueve el ayudante y la carpeta `locales/` juntos, y deja las rutas dentro de `i18n.py` sin cambios.

| Su repositorio | Dónde van |
| --- | --- |
| Un script en la raíz del repositorio | Deje `i18n.py` y `locales/` donde `init` los escribió |
| Un paquete, incluyendo un diseño `src/` | Mueva ambos al paquete, junto al código que los importa |

Ejemplo: un paquete instalable `mypkg` bajo `src/mypkg/` mantiene `src/mypkg/i18n.py` y `src/mypkg/locales/`.

Actualice la configuración a la nueva ubicación:

```json
{
  "ui": {
    "sourceRoots": ["src/mypkg"],
    "stringsJson": "src/mypkg/locales/strings.json",
    "flatOutputDir": "src/mypkg/locales"
  }
}
```

`sourceRoots` es la carpeta que `extract` escanea. Manténgala en el paquete de la aplicación para que las pruebas y los archivos de datos queden fuera del catálogo. La ruta de la lista de idiomas, `languagesManifestPath`, sigue a `flatOutputDir` cuando no está configurada. Si la configuración ya la establece, cámbiela para que coincida.

Importe `t` desde la ruta del módulo que eligió: `from i18n import t` en la raíz del repositorio, o `from mypkg.i18n import t` dentro de un paquete.

Cuando la aplicación se instala o se envía en un contenedor, el JSON de la configuración regional debe viajar con el paquete. Agréguelo a los datos del paquete (el patrón es relativo al directorio del paquete):

```toml
[tool.setuptools.package-data]
mypkg = ["locales/*.json"]
```

Confirme con `ai-i18n-tools extract`. El catálogo debería aparecer en la nueva carpeta `locales/`.

<a id="step-2-wrap-strings"></a>
## Paso 2: Envolver cadenas

`extract` registra una cadena solo cuando es un literal pasado a `t()` o `_()`. Impórtelos desde el módulo generado.

Busque primero la entrada del catálogo, luego interpole:

```python
t("Hello, {name}!", name=name)
_("Hello, %s!") % name
_("Total: {price:,.2f}").format(price=price)
```

Estos ejecutan el formato antes de cualquier búsqueda, por lo que el extractor los marca como inseguros. El [siguiente paso](#step-3-check-wrapped-calls) los encuentra:

```python
_(f"Hello, {name}!")
_("Hello, %s!" % name)
_("Hello, {name}!".format(name=name))
```

Envuelva el texto que ve una persona: etiquetas de widgets, títulos de página, subtítulos, errores mostrados en la interfaz de usuario, líneas de progreso, mensajes de validación y párrafos que incluyen algunos números. Un párrafo con números interpolados sigue siendo una llamada a `t()`. Los marcadores de posición son nombres como `{name}`, `{price:,.2f}` o `{rate:.2%}`. Pase `rate=row.rate`. Un marcador de posición como `{row.rate:.2%}` es rechazado.

Deje la redacción original tal como está. Una traducción faltante devuelve esa frase, por lo que la aplicación permanece igual en el idioma original.

Omita el texto que el programa coincide o registra: SQL, expresiones regulares, encabezados de archivo, líneas de registro, CSS, claves de widgets, códigos de enumeración y mensajes que envía a un modelo. Cuando un valor se almacena y se muestra (un cuadro de selección cuya opción también se compara en el código), mantenga el valor almacenado en el idioma original y traduzca la etiqueta con `format_func`.

`t()` en el momento de la importación se ejecuta una vez y mantiene el idioma original hasta que ese módulo se importa de nuevo. Llame a `t()` cuando se construya el widget.

<a id="find-unwrapped-strings"></a>

Trabaje en pases: liste los literales que no son argumentos de `t()` o `_()`, envuelva los que son para el usuario, luego liste de nuevo. El script a continuación es opcional. Imprime candidatos, incluyendo f-strings y texto unido con `+`. Omite docstrings, SQL y texto sin espacios, por lo que una etiqueta corta como `Overview` aún necesita una revisión. Elimínelo cuando haya terminado. Un script que reescribe archivos es un borrador: mantenga las líneas en blanco existentes, coloque la nueva importación con las otras importaciones del proyecto, ejecute el formateador del proyecto y revise la diferencia antes de conservarlo.

<details>
<summary>Opcional: listar cadenas que no están envueltas</summary>

```python
"""List string literals that are not passed to t() or _().

Usage: python scan_unwrapped.py path/to/package
"""

import ast
import sys
from pathlib import Path

WRAPPERS = {"t", "_", "translate", "gettext", "ngettext", "pgettext"}
SKIP_DIRS = {".venv", "venv", "env", "site-packages", "__pycache__", "node_modules"}
SQL_START = ("SELECT ", "INSERT ", "UPDATE ", "DELETE ", "WITH ", "PRAGMA ")


class Scanner(ast.NodeVisitor):
    def __init__(self) -> None:
        self.hits: list[tuple[int, str]] = []
        self.skip: set[int] = set()

    def mark_docstring(self, body: list[ast.stmt]) -> None:
        first = body[0] if body else None
        if isinstance(first, ast.Expr) and isinstance(first.value, ast.Constant):
            self.skip.add(id(first.value))

    def visit_Module(self, node: ast.Module) -> None:
        self.mark_docstring(node.body)
        self.generic_visit(node)

    def visit_FunctionDef(self, node: ast.FunctionDef) -> None:
        self.mark_docstring(node.body)
        self.generic_visit(node)

    visit_AsyncFunctionDef = visit_FunctionDef
    visit_ClassDef = visit_FunctionDef

    def visit_Call(self, node: ast.Call) -> None:
        func = node.func
        name = func.id if isinstance(func, ast.Name) else getattr(func, "attr", "")
        if name in WRAPPERS and node.args:
            self.skip.add(id(node.args[0]))
        self.generic_visit(node)

    def visit_BinOp(self, node: ast.BinOp) -> None:
        if id(node) in self.skip:
            return
        if not isinstance(node.op, ast.Add):
            self.generic_visit(node)
            return
        pieces: list[ast.expr] = []

        def flatten(item: ast.expr) -> None:
            if isinstance(item, ast.BinOp) and isinstance(item.op, ast.Add):
                flatten(item.left)
                flatten(item.right)
            else:
                pieces.append(item)

        flatten(node)
        texts = [p for p in pieces if isinstance(p, ast.Constant) and isinstance(p.value, str)]
        if not texts:
            self.generic_visit(node)
            return
        joined = "".join(p.value if p in texts else "{...}" for p in pieces)  # type: ignore[union-attr]
        for piece in texts:
            self.skip.add(id(piece))
        self.report(node.lineno, joined)
        for piece in pieces:
            if piece not in texts:
                self.visit(piece)

    def visit_JoinedStr(self, node: ast.JoinedStr) -> None:
        if id(node) not in self.skip:
            parts = [v.value if isinstance(v, ast.Constant) else "{...}" for v in node.values]
            self.report(node.lineno, "".join(str(p) for p in parts))
        # Never report the pieces of an f-string on their own.

    def visit_Constant(self, node: ast.Constant) -> None:
        if id(node) not in self.skip and isinstance(node.value, str):
            self.report(node.lineno, node.value)

    def report(self, line: int, text: str) -> None:
        if " " not in text.strip() or not any(ch.isalpha() for ch in text):
            return
        if text.startswith(SQL_START):
            return
        preview = " ".join(text.split())
        self.hits.append((line, preview if len(preview) <= 140 else preview[:137] + "..."))


def main() -> None:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
    for path in sorted(root.rglob("*.py")):
        if path.name == "i18n.py" or SKIP_DIRS & set(path.parts):
            continue
        scanner = Scanner()
        try:
            tree = ast.parse(path.read_text(encoding="utf-8"))
        except SyntaxError as error:
            print(f"\n# {path}\nskipped, cannot parse with this Python: {error.msg} (line {error.lineno})")
            continue
        scanner.visit(tree)
        if scanner.hits:
            print(f"\n# {path}")
            for line, preview in scanner.hits:
                print(f"{line}: {preview}")


if __name__ == "__main__":
    main()
```

</details>

<a id="step-3-check-wrapped-calls"></a>
## Paso 3: Comprobar llamadas envueltas

Utilice este paso cuando el código contenga llamadas que formateen la cadena antes de la búsqueda en el catálogo. Esto es típico de los "wrappers" antiguos y de un "agent slip":

```python
_(f"Hello, {name}!")
_("Hello, %s!" % name)
_("Hello, {name}!".format(name=name))
```

`migrate-python-i18n` los reescribe en una búsqueda que ocurre primero. Una segunda ejecución no cambia nada.

```python
t("Hello, {name}!", name=name)
_("Hello, %s!") % name
t("Hello, {name}!", name=name)
```

Las cadenas simples como `st.write(f"Hello, {name}!")` permanecen como están. Envolverlas es [Envolver cadenas](#wrap-strings). Si `extract` está limpio y el código no tiene ninguna de las tres formas anteriores, no hay nada que reescribir.

Ejecútelo después de `extract` y antes de `translate-ui`, para que el catálogo nunca almacene una f-string como clave.

```bash
ai-i18n-tools extract
ai-i18n-tools migrate-python-i18n
```

El comando es una ejecución de prueba hasta que pase `--write`. Escribe `migrate-python-i18n-report.md`. Lea ese informe. Cuando las ediciones parezcan correctas:

```bash
ai-i18n-tools migrate-python-i18n --write
ai-i18n-tools extract
```

Vuelva a ejecutar la ejecución de prueba. Deténgase cuando no liste ninguna edición, luego ejecute las pruebas del proyecto.

Las líneas que el comando deja en su lugar (campos de depuración como `{value=}`, especificaciones de formato anidadas) se enumeran en el informe. Corríjalas manualmente y vuelva a ejecutar la ejecución de prueba. Se omite el `i18n.py` generado. El informe es un artefacto de compilación: elimínelo o ignórelo con git.

Un informe sin ediciones significa que las llamadas envueltas son seguras. No significa que todas las frases orientadas al usuario hayan sido envueltas. La [lista de literales sin envolver](#find-unwrapped-strings) es la verificación para eso.

El `--report <path>` opcional cambia la ruta del informe. El `--ui-block` opcional limita el escaneo a un bloque de interfaz de usuario.

<a id="step-4-add-a-language-switch"></a>
## Paso 4: Agregar un selector de idioma

Cada framework necesita las mismas cuatro cosas:

1. Elija la configuración regional al inicio de cada solicitud, ejecución de script o evento de ventana, y llame a `set_locale` antes del primer `t()`.
2. Acepte solo los idiomas listados en `ui-languages.json` (`get_ui_languages()`), y hágalo de forma flexible. Los navegadores envían `pt-br`, mientras que el catálogo es `pt-BR`.
3. Ofrezca un selector construido a partir de `get_ui_languages()`.
4. Recuerde la elección.

Abrir `?lang=pt-BR` no hace nada hasta que la aplicación lo lee. El [aviso del agente](#run-the-agent-prompt) hace todo esto para las aplicaciones que tienen una interfaz de usuario, y determina el framework por sí mismo. Las secciones siguientes muestran el resultado para Streamlit, FastAPI, Flask y Tkinter. Otros frameworks siguen las mismas reglas.

<a id="streamlit"></a>
### Streamlit

Un script de Streamlit se vuelve a ejecutar en cada interacción, por lo que la configuración regional se elige en la parte superior del script en cada ejecución. Orden:

1. Lea el valor del selector de la ejecución anterior, luego `?lang=`, luego la configuración regional almacenada.
2. Llame a `set_locale` con ese código, antes de `st.set_page_config`.
3. Llame a `st.set_page_config(page_title=t("…"))`.
4. Dibuje el selector. Al cambiar, almacene el código, establezca `?lang=` y `st.rerun()`.

El valor del selector prevalece una vez que el usuario ha elegido. `?lang=` se aplica en una visita nueva, antes de que exista ese valor. El menú reside en la aplicación, no en `i18n.py`, por lo que su etiqueta puede ser `t("Language")`. Muéstrelo en cada pantalla que deba cambiar, incluida una página de inicio de sesión.

<details>
<summary>Código del widget</summary>

```python
import streamlit as st
from i18n import get_locale, get_ui_languages, set_locale, t


def apply_requested_locale() -> str:
    rows = [row for row in get_ui_languages() if row.get("code")]
    codes = [str(row["code"]) for row in rows] or [get_locale()]
    requested = (
        st.session_state.get("lang_selector")
        or st.query_params.get("lang")
        or st.session_state.get("locale")
        or get_locale()
    )
    choice = requested if requested in codes else codes[0]
    set_locale(choice)
    st.session_state["locale"] = choice
    if st.query_params.get("lang") != choice:
        st.query_params["lang"] = choice
    return choice


def render_language_selector() -> None:
    rows = [row for row in get_ui_languages() if row.get("code")]
    codes = [str(row["code"]) for row in rows]
    if len(codes) < 2:
        return
    labels = {str(row["code"]): str(row.get("label") or row["code"]) for row in rows}
    current = get_locale()
    choice = st.sidebar.selectbox(
        t("Language"),
        options=codes,
        index=codes.index(current),
        format_func=lambda code: labels.get(code, code),
        key="lang_selector",
    )
    if choice != current:
        st.session_state["locale"] = choice
        st.query_params["lang"] = choice
        set_locale(choice)
        st.rerun()


apply_requested_locale()
st.set_page_config(page_title=t("My app"))


def main() -> None:
    render_language_selector()
    st.write(t("Hello"))


main()
```

</details>

Cambie `from i18n import …` a la ruta del paquete de [Colocar el ayudante y los catálogos](#place-the-helper). Dé a cada otro widget un `key` fijo y llame a `t()` cuando se construya el widget. Las etiquetas calculadas en el momento de la importación permanecen en el idioma de origen después de un cambio. Cuando un título de página se compara más tarde, envuelva ambos lados: `nav.title != t("Forecast settings")`, porque `nav.title` ya está traducido.

`streamlit_language_selector()` de `i18n.py` es suficiente para un script corto cuyo título es una cadena simple. Llama a `set_locale` cuando se dibuja el widget, por lo que un `page_title` traducido encima de él permanece en el idioma anterior para esa ejecución, y su etiqueta permanece en inglés. Consulte `examples/python-streamlit`.

<a id="fastapi-flask-and-tkinter"></a>
### FastAPI, Flask y Tkinter

<a id="choose-the-locale-for-a-request"></a>
#### Elegir la configuración regional para una solicitud

Una aplicación web tiene tres fuentes para el idioma, en este orden: la elección explícita del visitante (`?lang=`), la cookie que lo recuerda y el encabezado `Accept-Language` del navegador. El idioma de origen es el idioma de reserva.

`set_locale` no valida ni normaliza lo que se le proporciona. Un navegador que envía `pt-br` o `pt` obtendría silenciosamente el idioma de origen, porque el archivo de catálogo es `pt-BR.json`. El módulo siguiente realiza la coincidencia e ignora los códigos que no están en `ui-languages.json`. Guárdalo junto a `i18n.py` e impórtalo desde el middleware o el gancho (usa la ruta del paquete cuando `i18n.py` esté dentro de un paquete).

<details>
<summary>request_locale.py</summary>

```python
"""Choose the UI language for a request. Works with any web framework."""

from __future__ import annotations

from i18n import get_ui_languages


def _codes() -> list[str]:
    return [str(row["code"]) for row in get_ui_languages() if row.get("code")]


def source_locale() -> str:
    for row in get_ui_languages():
        if row.get("isSourceLocale"):
            return str(row["code"])
    return (_codes() or ["en"])[0]


def match(candidate: str | None) -> str | None:
    """Map "pt", "pt_br" or "PT-br" onto a language listed in ui-languages.json."""
    if not candidate:
        return None
    wanted = candidate.strip().replace("_", "-").lower()
    codes = _codes()
    for code in codes:
        if code.lower() == wanted:
            return code
    for code in codes:
        if code.lower().split("-")[0] == wanted.split("-")[0]:
            return code
    return None


def from_accept_language(header: str) -> str | None:
    ranked = []
    for part in header.split(","):
        code, _, params = part.strip().partition(";")
        quality = 1.0
        if params.strip().startswith("q="):
            try:
                quality = float(params.strip()[2:])
            except ValueError:
                quality = 0.0
        if code and code != "*" and quality > 0:
            ranked.append((quality, code))
    for _quality, code in sorted(ranked, key=lambda item: -item[0]):
        found = match(code)
        if found:
            return found
    return None


def pick(query: str | None, cookie: str | None, accept_language: str = "") -> str:
    """An explicit choice (?lang=, then the cookie) beats the browser header."""
    return match(query) or match(cookie) or from_accept_language(accept_language) or source_locale()
```

</details>

<a id="fastapi"></a>
#### FastAPI

Elige la configuración regional en el middleware HTTP. Mantén el token de `set_locale` y restablécelo en `finally`, para que las solicitudes concurrentes mantengan su propio idioma. El middleware también guarda la cookie cuando `?lang=` está presente, y envía `Content-Language` y `Vary` para que las cachés mantengan una copia por idioma. Las rutas llaman a `t()` y `_()` como de costumbre. Para las páginas HTML, añade las funciones de ayuda al entorno de la plantilla una sola vez.

<details>
<summary>Middleware y plantillas de FastAPI</summary>

```python
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates

from i18n import _, get_direction, get_locale, get_ui_languages, reset_locale, set_locale, t
from request_locale import pick

app = FastAPI()
templates = Jinja2Templates(directory="templates")
templates.env.globals.update(
    _=_, t=t, current_locale=get_locale, ui_languages=get_ui_languages, direction=get_direction
)


@app.middleware("http")
async def locale_middleware(request: Request, call_next):
    code = pick(
        request.query_params.get("lang"),
        request.cookies.get("lang"),
        request.headers.get("accept-language", ""),
    )
    token = set_locale(code)
    try:
        response = await call_next(request)
        if request.query_params.get("lang"):
            response.set_cookie("lang", code, max_age=60 * 60 * 24 * 365, samesite="lax")
        response.headers["Content-Language"] = code
        response.headers.append("Vary", "Accept-Language, Cookie")
        return response
    finally:
        reset_locale(token)


@app.get("/greeting/{name}")
def greeting(name: str) -> JSONResponse:
    return JSONResponse({"message": t("Hello, {name}!", name=name), "locale": get_locale()})


@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse(request, "home.html", {"name": "Ada"})
```

</details>

Una API que devuelve solo JSON no necesita menú. Los clientes envían `Accept-Language` o `?lang=`. El texto construido después de que el middleware regresa, como en una tarea en segundo plano o mientras se envía una respuesta de streaming, puede ejecutarse después del restablecimiento. Constrúyelo antes de devolver la respuesta.

<a id="flask"></a>
#### Flask

Flask tiene un gancho para cada tarea. `before_request` elige la configuración regional y mantiene el token, `after_request` almacena la cookie, `teardown_request` restablece la configuración regional, y un procesador de contexto proporciona a las plantillas `t`, `_`, `get_locale`, `get_ui_languages` y `get_direction`. Pyramid utiliza la misma estructura con un suscriptor `NewRequest`.

<details>
<summary>Ganchos de Flask</summary>

```python
from flask import Flask, g, render_template, request

from i18n import _, get_direction, get_locale, get_ui_languages, reset_locale, set_locale, t
from request_locale import pick

app = Flask(__name__)


@app.before_request
def choose_locale():
    g.locale = pick(
        request.args.get("lang"),
        request.cookies.get("lang"),
        request.headers.get("Accept-Language", ""),
    )
    g.locale_token = set_locale(g.locale)


@app.after_request
def remember_locale(response):
    if request.args.get("lang"):
        response.set_cookie("lang", g.locale, max_age=60 * 60 * 24 * 365, samesite="Lax")
    response.headers["Content-Language"] = g.locale
    response.vary.add("Accept-Language")
    response.vary.add("Cookie")
    return response


@app.teardown_request
def clear_locale(_error):
    token = g.pop("locale_token", None)
    if token is not None:
        reset_locale(token)


@app.context_processor
def inject_i18n():
    return {
        "_": _,
        "t": t,
        "current_locale": get_locale,
        "ui_languages": get_ui_languages,
        "direction": get_direction,
    }


@app.get("/")
def home():
    return render_template("home.html", name="Ada")
```

</details>

<a id="the-language-menu-in-a-template"></a>
#### El menú de idioma en una plantilla

Tanto `Jinja2Templates` de FastAPI como Flask renderizan esto. Un enlace que lleva `?lang=` mantiene la página y establece la cookie, para que la elección persista en páginas posteriores. El atributo `dir` utiliza `get_direction()` para idiomas de derecha a izquierda.

<details>
<summary>Plantilla</summary>

```html
<!doctype html>
<html lang="{{ current_locale() }}" dir="{{ direction() }}">
  <body>
    <p>{{ t("Hello, {name}!", name=name) }}</p>
    <nav>
      {% for language in ui_languages() %}
        <a href="?lang={{ language.code }}"{% if language.code == current_locale() %} aria-current="true"{% endif %}>{{ language.label }}</a>
      {% endfor %}
    </nav>
  </body>
</html>
```

</details>

<a id="tkinter"></a>
#### Tkinter

Tkinter crea sus widgets una sola vez, por lo que un cambio de idioma tiene que actualizarlos. Escribe cada texto visible como una función que llama a `t("…")` con el literal dentro, registra el widget con esa función y llama a `refresh()` después de `set_locale`. `extract` sigue viendo cada literal. Guarda el código elegido en el archivo de configuración de la aplicación y llama a `set_locale` con él antes de que se construya la ventana.

<details>
<summary>Ventana de Tkinter con un menú de idioma</summary>

```python
import tkinter as tk
from collections.abc import Callable
from tkinter import ttk

from i18n import get_locale, get_ui_languages, set_locale, t


class App(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self._texts: list[tuple[tk.Misc, Callable[[], str]]] = []
        rows = [row for row in get_ui_languages() if row.get("code")]
        self._codes = [str(row["code"]) for row in rows]
        labels = [str(row.get("label") or row["code"]) for row in rows]
        self.language = ttk.Combobox(self, values=labels, state="readonly")
        self.language.current(self._codes.index(get_locale()))
        self.language.bind("<<ComboboxSelected>>", self._on_language)
        self.language.pack()
        self.greeting = ttk.Label(self)
        self.greeting.pack()
        self.bind_text(self.greeting, lambda: t("Hello, {name}!", name="Ada"))
        self.refresh()

    def bind_text(self, widget: tk.Misc, text: Callable[[], str]) -> None:
        self._texts.append((widget, text))

    def refresh(self) -> None:
        self.title(t("My app"))
        for widget, text in self._texts:
            widget.configure(text=text())

    def _on_language(self, _event: object) -> None:
        set_locale(self._codes[self.language.current()])
        self.refresh()
```

</details>

Un nuevo hilo se inicia en el idioma de origen, no en el de la ventana. Traduce en el hilo principal, o llama a `set_locale` al inicio de la función del hilo. Otros kits de herramientas necesitan las mismas piezas: una función que establece cada texto visible y un manejador de menú que llama a `set_locale` y luego a esa función. PyQt y PySide tienen sus propios ganchos de retraducción; consulta [Configuración regional en cada framework](/es/guide/ui-strings/python#locale-in-each-framework).

Ese es el último paso manual. Continúe en [Elegir modelos y traducir](#choose-models-and-translate).

<a id="not-your-case"></a>
## ¿No es su caso?

| Tienes | Lee |
| --- | --- |
| Django, catálogos de Flask-Babel, o una aplicación que ya usa GNU gettext | [Añadir i18n a una aplicación Django / Python gettext](/es/guide/add-i18n-to-django-gettext) |
| Una aplicación JS/TS | [Añadir i18n a una aplicación JS/TS](/es/guide/add-i18n-to-js) |
| Un sitio web o sitio de documentación | [Añadir i18n a un sitio web o sitio de documentación](/es/guide/add-i18n-to-website) |
| Un archivo README de repositorio u otros archivos Markdown | [Añadir i18n a tus archivos README y de Markdown](/es/guide/add-i18n-to-readme) |
| JSON de configuración regional anidado | [JSON](/es/guide/json) |

<a id="examples"></a>
## Ejemplos

| Ejemplo | Qué muestra |
| --- | --- |
| [python-streamlit](/es/examples#python-streamlit) | Panel, `t()` / `_()`, JSON plano |
| [python-fastapi](/es/examples#python-fastapi) | Configuración regional con ámbito de solicitud, JSON plano |
| [python-flask](/es/examples#python-flask) | Flask + Jinja, JSON plano |

Copia uno con `npx degit`, o descarga `ai-i18n-tools-python-examples.zip` desde la versión de GitHub. Comandos: [Ejemplos](/es/examples#python-examples). Para una aplicación que usa gettext, consulta el [ejemplo de gettext](/es/examples#python-gettext).
