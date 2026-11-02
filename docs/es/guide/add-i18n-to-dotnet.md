<a id="add-i18n-to-a-dotnet-app"></a>
# Añadir i18n a una aplicación .NET

Esta página toma una aplicación .NET (Avalonia, WPF, MAUI, WinForms, Blazor, ASP.NET o una herramienta de consola) que tiene un solo idioma y agrega configuraciones regionales con ai-i18n-tools. Sigue una ruta: la plantilla `ui-dotnet`, un pequeño asistente `I18n.cs` y archivos JSON de traducciones. `extract` registra una cadena de interfaz de usuario solo cuando es un literal de cadena dentro de `T()`, `Tn`, `Tp`, `N` o un `{loc:Tr '…'}` de XAML, por lo que un catálogo de texto fuente simple estaría vacío.

La forma más rápida es darle a un agente de codificación el mensaje de esta página. Coloca el asistente, incrusta el JSON de configuración regional, envuelve tus cadenas y puede agregar un selector de idioma. Tú instalas la CLI, eliges el proveedor e inicializas el proyecto tú mismo, porque eso necesita tu clave de API y tus elecciones. También ejecutas la traducción tú mismo, porque gasta dinero en tu cuenta.

Una aplicación que ya carga cadenas con `ResourceManager` o ASP.NET `IStringLocalizer` usa [Agregar i18n a una aplicación .NET ResourceManager](/es/guide/add-i18n-to-dotnet-resourcemanager). Esa ruta mantiene el cargador y escribe satélites `.resx`. ¿No estás seguro de cuál aplica? Consulta [¿No es tu caso?](#not-your-case) al final.

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

Usa el paquete npm cuando la máquina ya tenga Node.js `>=22.16.0` ([Instalación](/es/guide/installation)). Para un proyecto .NET, instala el ejecutable independiente (sin Node.js).

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

Luego elige un proveedor y establece su clave API en el shell que ejecutará la traducción. Por ejemplo, OpenRouter:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Ollama no necesita clave. Otros preajustes: [Proveedores integrados](/es/guide/providers-and-models#built-in-providers). Anota el nombre del proveedor, porque lo pasarás a `init` en el siguiente paso. El agente nunca necesita la clave: solo ejecuta comandos que no hacen llamadas a modelos. Usarás la clave más tarde, cuando [traduzcas](#choose-models-and-translate).

<a id="initialise-the-project"></a>
## Inicializar el proyecto

Esto se ejecuta una vez, antes del mensaje. Escribe la configuración y `I18n.cs`, y usa el proveedor que elegiste arriba.

Esta página usa una plantilla, `ui-dotnet`. Escribe la configuración, el asistente `I18n.cs` y los catálogos JSON. Se ajusta a estas aplicaciones:

| Tu aplicación | Notas |
| --- | --- |
| Avalonia, WPF, MAUI | Las etiquetas en XAML necesitan una extensión de marcado. El asistente no hace referencia a esos ensamblados |
| WinForms | Reconstruye el texto visible cuando cambia la configuración regional |
| Blazor y una aplicación ASP.NET de un solo usuario | El catálogo del asistente es estático, lo cual es suficiente para un usuario a la vez |
| Un servidor multiusuario | Mantén `IStringLocalizer` o `ResourceManager`. Usa la [página de ResourceManager](/es/guide/add-i18n-to-dotnet-resourcemanager) |
| Herramientas de consola | Una opción `--lang`, no un widget |

Ejecuta init con el proveedor que elegiste (OpenRouter en este ejemplo):

```bash
ai-i18n-tools init -t ui-dotnet -P openrouter
```

Pasa `--namespace` cuando el espacio de nombres del proyecto no sea el que `init` imprime en `I18n.cs`. Con un `.csproj` en el directorio y sin `--namespace`, `init` usa el `RootNamespace` de ese archivo, o el nombre del archivo del proyecto. De lo contrario, el espacio de nombres es `AiI18n`.

Luego edita `sourceLocale` y `targetLocales` en `ai-i18n-tools.config.json`. `sourceLocale` es el idioma de las cadenas en el código fuente. Cualquier idioma BCP-47 es válido; el andamio usa `en`. La misma lista está estampada en `I18n.cs` como `BuiltInLocales`, entre los marcadores `ai-i18n-tools-locales`, y `SourceLocale` es una constante. `SupportedLocales` lee ese arreglo. Después de cambiar la configuración, actualiza el sello o pasa un nuevo arreglo `Locales` a `I18n.Configure`. No vuelvas a ejecutar `init` en la aplicación para actualizar el asistente.

Ejecuta `init` una vez. Reescribe `ai-i18n-tools.config.json` cada vez, por lo que una segunda ejecución descarta las ediciones que hayas hecho. Si `I18n.cs` ya contiene el marcador `ai-i18n-tools-i18n-cs`, el proyecto ya está inicializado: omite este paso. `init` no sobrescribe un `I18n.cs` existente y no edita el `.csproj`.

`init` establece `ui.sourceRoots` en `"."`, por lo que `extract` escanearía todo el repositorio. El mensaje lo reduce a tu código de aplicación (manualmente, eso es [Paso 1](#step-1-place-the-helper-and-embed-the-catalogs)). El escaneo ya omite directorios llamados `bin`, `obj`, `.vs`, `TestResults` y `packages`, y la plantilla excluye `**/Tests/**` y `**/*.Tests/**`.

Formas de llamada: [Aplicaciones .NET](/es/guide/ui-strings/dotnet). Cada otra clave de configuración: [Configuración](/es/reference/configuration).

<a id="run-the-agent-prompt"></a>
## Ejecutar la instrucción del agente

Abre el proyecto en tu agente de codificación (Cursor, Claude Code, Copilot o similar), inicia un nuevo chat y pega la instrucción a continuación. El proyecto ya debe estar inicializado. No hay nada que editar. Si quieres omitir algo, por ejemplo, no cambiar de idioma, indícalo en el mismo mensaje.

El agente primero verifica que la CLI, la configuración y `I18n.cs` existan, y se detiene con instrucciones si falta alguno. Luego trabaja en tres partes:

- La parte 1 coloca `I18n.cs` y `locales/` donde el proyecto guarda su código, incrusta el JSON y apunta la configuración hacia ellos.
- La parte 2 envuelve las cadenas orientadas al usuario en `T()`, `Tn`, `Tp`, `N` y `{loc:Tr '…'}`, luego verifica llamadas inseguras con `migrate-dotnet-i18n`.
- La parte 3 agrega un selector de idioma o una opción de idioma de CLI.

No instala ni inicializa nada, lee tu clave de API, ni traduce. La traducción es el paso posterior a la revisión, y tú la ejecutas.

````markdown
# Add languages to this .NET app

## Before you start

The user must already have installed ai-i18n-tools and initialised this
project. Check that `ai-i18n-tools --version` runs, that
`ai-i18n-tools.config.json` exists with a `ui` block, and that an `I18n.cs`
containing `ai-i18n-tools-i18n-cs` exists. If any of them is missing, stop now
and tell the user to install ai-i18n-tools and run
`ai-i18n-tools init -t ui-dotnet -P <provider>`, then run this prompt again.
Pass `--namespace` when the printed namespace is wrong. Do not install or
initialise anything yourself. Do not overwrite an existing config or an
existing `I18n.cs`.

If the app already loads strings with `ResourceManager` or
`IStringLocalizer`, stop and tell the user to use the `ui-dotnet-resx`
template instead. Do not add `I18n.cs` beside that loader.

## Rules

- Do not read or search the ai-i18n-tools source. This prompt is complete.
- Never read, print, or write API keys, `.env` files, or the shell environment.
- Do not run `translate-ui`, `suggest-models`, or `sync`. They call the
  translation API and cost money. The user runs them after reviewing your work.
- Do not translate, reword, or rename source text. Do not edit `I18n.cs`
  except `SourceLocale` and the `BuiltInLocales` array between the
  `ai-i18n-tools-locales` markers, and only when `sourceLocale` or
  `targetLocales` changed after init. Do not edit generated files
  (`strings.json`, per-locale JSON, `ui-languages.json`, `.resx`). Do not add
  another helper module.
- Do not introduce semantic keys (`LoginButton`, `nav.home`). The literal in
  `T("…")` is the source-language sentence and the catalog key.
- Do not reformat unrelated code. Keep existing blank lines. Run the project's
  formatter and linter at the end. Leave unrelated edits in a dirty tree alone.
  Delete throwaway scripts and do not commit them.

## Part 1 — Place the helper and embed the catalogs

Skip this part when `I18n.cs` and `locales/` already sit with the code that
uses them, the config points at them, and the project embeds `locales/*.json`.

1. Move `I18n.cs` and `locales/` together into the application project. A
   single-project repo can leave them where `init` wrote them. `I18n.cs` loads
   embedded JSON by resource name. Do not edit paths inside it.
2. Add `<EmbeddedResource Include="locales/*.json" />` to that project's
   `.csproj`. The path is relative to the project file. Do not rewrite the
   rest of the project file. .NET Framework 4.8 also needs the
   `System.Text.Json` package before `I18n.cs` will compile.
3. In `ai-i18n-tools.config.json`, point `ui.stringsJson` and
   `ui.flatOutputDir` at the new `locales/`. Set `ui.sourceRoots` to the
   application project instead of `"."`.
4. Add `global using static <Namespace>.I18n;` in that project, or call
   `I18n.T` at each site. The namespace is the one already in `I18n.cs`.
5. `BuiltInLocales` inside `I18n.cs`, between the `ai-i18n-tools-locales`
   markers, is the list stamped at init. `SupportedLocales` reads it. If
   `sourceLocale` or `targetLocales` was edited after that, update
   `SourceLocale` and that array, or call `I18n.Configure` with a new
   `Locales` array. Do not rewrite the rest of the helper.
6. Run `ai-i18n-tools extract` and confirm the catalog is in the new place.

## Part 2 — Wrap strings

The literal in `T("…")` is the source-language sentence and the catalog key.
With the source locale active, the app must behave exactly as before. Text
that is already wrapped needs no change.

- Call shapes: `T("Sign in")`, `T("Saved to {0}", path)`,
  `Tn("1 sample", "{0} samples", count)`, `Tp("menu", "Open")`, `N("Light")`.
  `{0}` is the count in `Tn`. Extra arguments follow it (`{1}`, `{2}`).
  `Tp` is for one short word with two meanings (`Open` the window and `Open`
  the file). `N` returns its argument so a static field can hold a literal
  `extract` can see. Show it later with `T(label)`. `T(label)` is valid only
  when `label` comes from `N("literal")`.
- Placeholders are `{0}`, `{0,-10}`, `{0:C}`, and `{0,-10:C}`. `%` is ordinary
  text. Doubled braces (`{{` and `}}`) are literal braces and must be copied
  unchanged. `{name}` is an error: `extract` stops.
  `string.Format` throws on a named item.
- Look up first, then format. Never `T($"…")`, `T("a" + b)`, or
  `T(string.Format(…))`. The argument must be a string literal, so
  `T(variable)` is invisible apart from a warning.
- XAML and AXAML: `{loc:Tr 'Sign in'}`. The prefix does not matter. The type
  name must be `Tr`. `{Binding}`, `{DynamicResource}`, `{StaticResource}`,
  `{TemplateBinding}`, and `{x:Static}` stay as they are. Element content
  (`<TextBlock>Hello</TextBlock>`) is not extracted. Move it onto an attribute.
  A literal that contains an apostrophe uses `&quot;` so the XML attribute can
  stay in double quotes: `Content="{loc:Tr &quot;Don't&quot;}"`.
- Avalonia, WPF, and MAUI each have their own markup-extension base class. Add
  a `TrExtension` in the app. `ProvideValue` returns `I18n.T(Text)`. Do not
  reference those UI assemblies from `I18n.cs`.
- Wrap text a person sees: labels, titles, captions, messages, validation
  text that is shown, progress, accessibility names, dialogs. Also review
  returned labels, dictionaries, variable-backed captions, and XAML element
  content. Leave logs, JSON keys, file names, `nameof`, attribute arguments,
  comparisons, `Path` calls, and exception text that is not shown.
- A stored option keeps its source value. Translate the caption when the
  control is shown. Do not fill a static dictionary with `T(…)` at startup.
  `T()` at startup runs once and freezes.

```csharp
const string PresetLast12 = "Last 12 months";

string PresetCaption() => T("Last 12 months");
```

- Tray or menu items found by their header should use `Tp` and a stable tag,
  not the translated header.
- Text sent to a model stays in the source locale even when it is built from
  labels. Build that text before any user-locale `SetLocale`, or format it
  from the source strings. Do not change the static locale around asynchronous
  work. The catalog and the current locale are static. Setting
  `CurrentUICulture` does not give each request its own map. A multi-user
  server keeps `IStringLocalizer` or `ResourceManager`.

Work in passes: list string literals that are not passed to `T`, `Tn`, `Tp`,
or `N`, wrap the user-facing ones, then list again. Treat any bulk rewrite as
a draft and review its diff.

Then run `ai-i18n-tools extract`. Fix every warning. A literal that contains
`{name}` stops the run. Run `ai-i18n-tools migrate-dotnet-i18n` without
`--write` and read `migrate-dotnet-i18n-report.md`. It rewrites `T($"…")`,
concatenation, and `string.Format` inside `T` into `T("…{0}…", arg)`. Apply
`--write` only after reading the edits, run `extract` again, and repeat until
the dry run lists nothing you still need to fix. `--wrap` is an audit of
unmarked XAML label attributes and high-confidence C# sinks (`Text`, `Title`,
`Message`, `MessageBox.Show`). It does not edit logs, attributes, `nameof`,
comparisons, or `Path` calls. A clean report does not prove every sentence is
wrapped, so keep scanning. Do not commit the report.

A phrase that looks like a plural (`{0} samples`) should be `Tn`, not `T`.
Lines the command leaves in place (`await`, a raw `$$"""` string, a `? :`
hole, `ref` or `out`, a concatenation with no literal) are fixed by hand.

## Part 3 — Language switch

Skip this part only when the program shows no text a person reads, or when the
user asked you to leave language choice out. A console app still gets this
part: `--lang <code>` (and `-L` when that name is free), not a widget. Do not
read `AI_I18N_LANG`. That variable is only for the ai-i18n-tools CLI.

Goal: one chosen language applies to every `T()` in that process, and a screen
can remember the choice. Accept only codes from `I18n.SupportedLocales`
(`Code`, `NativeName`).

- Restore the saved locale at startup, before the first `T`. Set
  `CultureInfo.CurrentUICulture` and `CultureInfo.CurrentCulture` to that
  culture, then call `I18n.SetLocale`. `SetLocale` raises `LocaleChanged`
  immediately, so the cultures have to be set first. `string.Format` uses the
  current UI culture, so `{0:C}` follows it.
- Add a control labelled `T("Language")` whose options come from
  `SupportedLocales`. On change, set both cultures, then call `SetLocale`, and
  persist the choice.
- Refresh visible text from `LocaleChanged`. View-model properties that call
  `T` raise `PropertyChanged` from that event. WinForms and other toolkits
  that copy text into controls rebuild those properties in the handler. A
  markup extension that returns a plain string updates the next time the view
  is built.
- When the framework has a flow direction, set it from
  `I18n.IsRightToLeft(code)`.
- Do not use this helper as a per-user selector in a multi-user server. Keep
  `IStringLocalizer` or `ResourceManager` for that case.

## Verify and report

The project's build and tests pass. `extract` writes a non-empty catalog of
the sentences you wrapped, with no warnings. With the source locale, the
output is unchanged. A missing key returns the source string unless `Strict`
is set. A bad format in a translation can throw `FormatException`. A dropped
`{0}` can omit the value. `string.Format` does not fall back to the source
template.

Report the files changed, each string you skipped with file, line, surface,
and reason, the same word used with different meanings, sentences built from
translated pieces, plurals left as one string, and any `T()` that runs at
startup. With a locale file present, one test sets a target locale and asserts
that a validation message and a caption change, while the stored option value
stays in the source language. If `dotnet` is not installed, say the runtime
check was skipped.

Then list the commands for the user, and do not run them:
`ai-i18n-tools suggest-models` (optional), `ai-i18n-tools translate-ui`, then
restart the app. Remind the user to fill `glossary-user.csv` before the first
translation.
````

<a id="review-the-result"></a>
## Revisar el resultado

El agente finaliza con un informe. Revísalo antes de traducir:

- El diff. El texto encapsulado debe leerse igual que antes, sin reformateos no relacionados. `git diff --stat` muestra cuánto cambió. La ubicación del helper, el elemento `EmbeddedResource`, las llamadas encapsuladas y el selector de idioma son las ediciones esperadas.
- Los catálogos generados (`strings.json`, JSON por configuración regional, `ui-languages.json`) no se modifican, salvo lo que escribió `extract`. `I18n.cs` no se modifica, salvo por un sello de configuración regional que solicitó actualizar.
- `ai-i18n-tools extract` se ejecuta sin problemas, y `strings.json` enumera las oraciones que espera. No queda ninguna advertencia, y ningún literal contiene todavía `{name}`.
- La ejecución de prueba de `migrate-dotnet-i18n` no enumera nada que quede por corregir. Un informe limpio no prueba que todas las oraciones se hayan encapsulado. Las cadenas omitidas en el informe del agente son el resto de esa verificación.
- Sus pruebas pasan y la aplicación se ve igual en el idioma de origen.
- No se dejó ningún script desechable ni `migrate-dotnet-i18n-report.md`.
- `SourceLocale` en `I18n.cs` es igual a `sourceLocale` en la configuración, carácter por carácter. `BuiltInLocales` enumera los mismos idiomas que la configuración.

Las cadenas que el agente omitió aparecen como texto que permanece en el idioma de origen más tarde.

<a id="choose-models-and-translate"></a>
## Elegir modelos y traducir

Tú ejecutas esta parte. Utiliza tu clave de API y gasta dinero de tu cuenta.

La lista de modelos de `init` es un punto de partida. Clasifique los modelos de chat del proveedor activo y, cuando la lista corta parezca correcta, escríbala en `translationModels`:

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` solo reemplaza `translationModels`. La misma clasificación se encuentra en la pestaña [Modelos](/es/guide/translation-dashboard/models) de `ai-i18n-tools dashboard`.

Rellene el glosario antes del primer `translate-ui`. `init` apunta `glossary.userGlossary` a `glossary-user.csv` y no crea el archivo. Si falta el archivo, ejecute `ai-i18n-tools glossary-generate`, luego añada términos de dominio. Use **Force** para los nombres que deben copiarse sin cambios. Una segunda `translate-ui` de una cadena sin cambios puede volver redactada de manera diferente. El glosario es lo que hace que las dos ejecuciones coincidan.

Luego extrae y traduce:

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
ai-i18n-tools status
```

`extract` escribe `strings.json` y `ui-languages.json`. `translate-ui` escribe un archivo JSON por idioma de destino en `ui.flatOutputDir`. Deje esos archivos generados sin editar. `sync` ejecuta `extract` y `translate-ui` juntos cuando `features.translateUIStrings` está activado.

`T()` busca la oración de origen en el JSON de configuración regional. El ID en `strings.json` no es la clave de búsqueda. Un archivo o una clave faltante devuelve la oración de origen, a menos que `I18n.Strict` esté configurado. `string.Format` se ejecuta luego en la plantilla traducida. Un formato no válido puede lanzar `FormatException`. Un `{0}` omitido puede omitir el argumento. No hay un retorno a la plantilla de origen después de un error de formato.

<a id="check-one-language"></a>
### Comprobar un idioma

Reinicie la aplicación, cambie a un idioma de destino y abra una pantalla con algunas cadenas encapsuladas. Use el selector de idioma que añadió el agente, o configure ambas culturas y llame a `I18n.SetLocale` usted mismo. El texto que todavía está en el idioma de origen no se encapsuló, se copió en un control antes de `SetLocale` o no tiene ninguna entrada en el JSON de configuración regional. Compruebe el JSON para la oración antes de sospechar del código.

`SetLocale` recorre `CultureInfo.Parent` hasta que se abre un catálogo (`pt-BR` puede cargar `pt.json`). Los recursos incrustados se utilizan cuando ni `OpenLocale` ni `FlatDirectory` están configurados. Un `FlatDirectory` configurado no recurre al JSON incrustado cuando falta un archivo.

<a id="keep-it-translated"></a>
## Mantenerlo traducido

Vuelva a ejecutar `ai-i18n-tools sync` (o `extract` y luego `translate-ui`) después de cambiar el texto de origen. La caché significa que solo las cadenas nuevas o modificadas van al modelo. Ejecútelo en CI para que las traducciones no se desvíen. Recompile o reinicie la aplicación después de una ejecución de traducción para que se recoja el JSON incrustado. `ai-i18n-tools dashboard` abre el [Panel de traducción](/es/guide/translation-dashboard/) para revisar las traducciones.

Para actualizar un `I18n.cs` copiado, cree la misma plantilla en un directorio desechable y copie solo el archivo generado que desea reemplazar. No vuelva a ejecutar `init` en la aplicación para actualizar el helper.

Para traducir `README.md` en la misma ejecución, genera la estructura con `--with-readme` (o añade el bloque a una configuración existente). Consulta [Añadir i18n a tus archivos README y de Markdown](/es/guide/add-i18n-to-readme).

<a id="do-it-by-hand"></a>
## Hazlo manualmente

Sigue estos pasos si prefieres hacer los cambios tú mismo, o si quieres saber qué hace el prompt. Cada paso coincide con una parte del prompt. Aun así, [instalas la CLI](#install-and-choose-a-provider), [inicializas el proyecto](#initialise-the-project) y [traduces](#choose-models-and-translate) al final.

1. [Coloque el helper e incruste los catálogos](#step-1-place-the-helper-and-embed-the-catalogs).
2. [Encapsule cadenas](#step-2-wrap-strings) en `T()`, `Tn`, `Tp`, `N` o `{loc:Tr '…'}`.
3. [Compruebe las llamadas encapsuladas](#step-3-check-wrapped-calls) con `migrate-dotnet-i18n`.
4. [Añada un selector de idioma](#step-4-add-a-language-switch).

<a id="step-1-place-the-helper-and-embed-the-catalogs"></a>
## Paso 1: Coloque el helper e incruste los catálogos

`init` escribe esto en la raíz del repositorio:

| Archivo | Qué es | ¿Editarlo? |
| --- | --- | --- |
| `I18n.cs` | El helper que su código llama (`T`, `Tn`, `Tp`, `SetLocale`) | No. Se genera. `init` no lo sobrescribirá |
| `locales/strings.json` | La caché de extracción. La aplicación nunca la lee | No. `extract` la escribe |
| `locales/<code>.json` | Las traducciones que carga la aplicación, un archivo por idioma | No. `translate-ui` las escribe |
| `locales/ui-languages.json` | La lista de idiomas para la herramienta. El helper usa `BuiltInLocales` en `I18n.cs` | No. `extract` la escribe |

Mueva `I18n.cs` y `locales/` al proyecto de la aplicación. Añada la incrustación a ese `.csproj` y deje el resto del archivo intacto:

```xml
<ItemGroup>
  <EmbeddedResource Include="locales/*.json" />
</ItemGroup>
```

La ruta de inclusión es relativa al archivo del proyecto. .NET Framework 4.8 también necesita el paquete `System.Text.Json`. .NET 6 o posterior ya lo tiene.

Actualice la configuración a la nueva ubicación y apunte `sourceRoots` al proyecto de la aplicación para que las pruebas y la salida de la compilación se mantengan fuera del catálogo:

```json
{
  "ui": {
    "sourceRoots": ["src/MyApp"],
    "stringsJson": "src/MyApp/locales/strings.json",
    "flatOutputDir": "src/MyApp/locales"
  }
}
```

Agregue `global using static MyApp.I18n;` (use el espacio de nombres impreso en `I18n.cs`) o llame a `I18n.T` en cada sitio.

`SourceLocale` en el asistente debe ser igual a `sourceLocale` en la configuración. `BuiltInLocales`, entre los marcadores `ai-i18n-tools-locales`, es la lista `init` sellada. `SupportedLocales` la lee. Después de cambiar `targetLocales`, actualice esa matriz o pase una nueva matriz `Locales` a `I18n.Configure`. Cree un directorio desechable cuando necesite un asistente nuevo. No vuelva a ejecutar `init` aquí.

Confirme con `ai-i18n-tools extract`. El catálogo debería aparecer en la nueva carpeta `locales/`. Espere 0 cadenas hasta que se envuelva algo.

<a id="step-2-wrap-strings"></a>
## Paso 2: Envolver cadenas

`extract` registra una cadena solo cuando es un literal pasado a `T()`, `Tn`, `Tp`, `N` o `{loc:Tr '…'}`. Un receptor como `I18n.T` coincide porque el último nombre es `T`.

Busque primero la entrada del catálogo y luego pase el resultado a `string.Format`:

```csharp
T("Sign in")
T("Saved to {0}", path)
Tn("1 sample", "{0} samples", count)
Tp("menu", "Open")
N("Light")
```

Estos se extraen y luego se rechazan, porque el catálogo no coincidiría con lo que el programa busca:

```csharp
T($"Saved to {path}")
T("Last synced " + when)
T(variable)
T("Hello {name}")
```

`extract` imprime una advertencia para los tres primeros y se detiene en `{name}`. El [siguiente paso](#step-3-check-wrapped-calls) reescribe los tres primeros.

Los marcadores de posición permanecen en formato .NET: `{0}`, `{0,-10}`, `{0:C}`. `%` es texto ordinario, por lo que una traducción como `10% off` no es un token de printf. Las llaves dobles (<code v-pre>{{</code> y `}}`) son llaves literales y deben copiarse sin cambios. Más formas de llamada: [Llamadas que se traducen](/es/guide/ui-strings/dotnet#calls-that-translate).

XAML y AXAML:

```xml
<TextBlock Text="{loc:Tr 'Sign in'}" />
```

El prefijo se ignora. `{Binding}` y `{StaticResource}` se dejan intactos. El texto escrito como contenido de elemento no se extrae. Un literal que contiene un apóstrofo se escribe con `&quot;` para que el atributo pueda permanecer entre comillas dobles.

Avalonia, WPF y MAUI suministran cada uno su propia clase base `MarkupExtension`. Una forma, en el proyecto de la aplicación:

```csharp
public sealed class TrExtension : MarkupExtension
{
    public TrExtension(string text) { Text = text; }
    public string Text { get; }
    public override object ProvideValue(IServiceProvider serviceProvider) => I18n.T(Text);
}
```

Las oraciones formateadas permanecen en C# (`T("Saved to {0}", path)`), lo que mantiene el extractor en un solo literal. La misma llamada funciona desde un modelo de vista, una información sobre herramientas de la bandeja y un cuadro de diálogo.

Un valor que se almacena y se muestra conserva el valor almacenado en el idioma de origen. Traduzca el título cuando se cree el control. `N("Last 12 months")` existe para que un campo estático pueda contener un literal que el extractor ve. `T()` en un diccionario estático se ejecuta una vez, en la primera carga de tipo, y permanece en ese idioma.

Deje estos sin tocar: registros, nombres de propiedades JSON, nombres de archivos, `nameof`, argumentos de atributos, claves de objetos utilizadas como identificadores y texto de excepción que el programa coincide en lugar de mostrar.

Ejecute `ai-i18n-tools extract` de nuevo. El catálogo ahora debería listar las frases que envolvió.

<a id="step-3-check-wrapped-calls"></a>
## Paso 3: Comprobar llamadas envueltas

Use este paso cuando una llamada formatee la cadena antes de la búsqueda en el catálogo:

```csharp
T($"Saved to {path}")
T("Last synced " + date)
T(string.Format("Hello {0}", name))
```

`migrate-dotnet-i18n` los reescribe en una búsqueda que ocurre primero. Una segunda ejecución no cambia nada.

```csharp
T("Saved to {0}", path)
T("Last synced {0}", date)
T("Hello {0}", name)
```

El comando es una ejecución de prueba hasta que pase `--write`. Escribe `migrate-dotnet-i18n-report.md`. Lea ese informe. Cuando las ediciones parezcan correctas:

```bash
ai-i18n-tools migrate-dotnet-i18n --write
ai-i18n-tools extract
```

Vuelva a ejecutar la ejecución de prueba. Deténgase cuando no liste ninguna edición, luego ejecute las pruebas del proyecto. Las líneas que quedan en su lugar (`await`, una cadena sin formato interpolada sin formato, un hueco condicional, `ref` o `out`, una concatenación sin literal, un `IFormatProvider` pasado a `string.Format`) se corrigen a mano. Una frase que parece un plural pertenece a `Tn`. Se omite el `I18n.cs` generado. Elimine el informe o ignórelo con git.

`--wrap` también marca los XAML `Text`, `Header`, `Content` y los otros atributos de etiqueta sin marcar como `{loc:Tr '…'}`, además de las asignaciones de C# cuyo nombre termina en `Text`, `Title` o `Message`, y `MessageBox.Show`. Sin `--write` eso es una auditoría. No edita registros, atributos, `nameof`, comparaciones o llamadas a `Path`.

Un informe sin ediciones significa que las llamadas envueltas son seguras. No significa que cada oración orientada al usuario haya sido envuelta. Las etiquetas simples, las cadenas devueltas y el contenido de los elementos son invisibles para él. Detalles: [Reescribir llamadas inseguras](/es/guide/ui-strings/dotnet#migrate).

<a id="step-4-add-a-language-switch"></a>
## Paso 4: Agregar un selector de idioma

Establezca las configuraciones regionales antes de `SetLocale`, porque `LocaleChanged` se activa dentro de esa llamada:

```csharp
var culture = CultureInfo.GetCultureInfo(code);
CultureInfo.CurrentUICulture = culture;
CultureInfo.CurrentCulture = culture;
I18n.SetLocale(code);
```

Genere las opciones desde `I18n.SupportedLocales`. Cada fila tiene `Code`, `NativeName` y `EnglishName`. Etiquete el control con `T("Language")`. Conserve la elección y restáurela al inicio, antes del primer `T`. En `LocaleChanged`, genere `PropertyChanged` para las cadenas del modelo de vista, o reconstruya los controles que copiaron su texto. Cuando el marco de trabajo tenga una dirección de flujo, configúrela desde `I18n.IsRightToLeft(code)`.

Un programa de consola no tiene widget. Agregue `--lang <code>` (y `-L` cuando ese nombre esté libre). Acepte solo los códigos enumerados en `SupportedLocales`. No lea `AI_I18N_LANG`. Esa variable es solo para la CLI de ai-i18n-tools.

Omita este paso cuando el programa no muestre texto que una persona lea.

El catálogo y la configuración regional actual son estáticos. Eso es seguro para un proceso de escritorio. No es una configuración regional por solicitud para un servidor multiusuario. Mantenga `IStringLocalizer` o `ResourceManager` allí, y siga [Agregue i18n a una aplicación de .NET ResourceManager](/es/guide/add-i18n-to-dotnet-resourcemanager). Configurar `CurrentUICulture` no le da a cada solicitud su propio mapa.

Ese es el último paso manual. Continúe en [Elegir modelos y traducir](#choose-models-and-translate).

<a id="not-your-case"></a>
## ¿No es su caso?

| Su código actual | Leer |
| --- | --- |
| `ResourceManager`, satélites `.resx` o ASP.NET `IStringLocalizer` | [Agregue i18n a una aplicación de .NET ResourceManager](/es/guide/add-i18n-to-dotnet-resourcemanager) |
| Ya `T("…")` con la frase en el idioma de origen | [Cadenas de interfaz de usuario](/es/guide/ui-strings/) pasos 2–3, y [Aplicaciones .NET](/es/guide/ui-strings/dotnet) |
| Una aplicación JS/TS | [Añadir i18n a una aplicación JS/TS](/es/guide/add-i18n-to-js) |
| Una aplicación Python | [Añadir i18n a una aplicación Python](/es/guide/add-i18n-to-python) |
| Catálogos de Django, Flask-Babel o GNU gettext | [Agregue i18n a una aplicación gettext de Django / Python](/es/guide/add-i18n-to-django-gettext) |
| Un sitio web o sitio de documentación | [Añadir i18n a un sitio web o sitio de documentación](/es/guide/add-i18n-to-website) |
| Un archivo README de repositorio u otros archivos Markdown | [Añadir i18n a tus archivos README y de Markdown](/es/guide/add-i18n-to-readme) |

<a id="examples"></a>
## Ejemplos

| Ejemplo | Lo que muestra |
| --- | --- |
| [dotnet-console](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/dotnet-console) | Comprobaciones xUnit de `I18n.cs`: JSON incrustado, reserva cultural, `{0}`, plurales |

Estos directorios comprueban el asistente. No son aplicaciones para traducir y no necesitan una clave de API. `dotnet test` en ese directorio ejecuta las comprobaciones. Una aplicación real comienza desde `init` en esta página.
