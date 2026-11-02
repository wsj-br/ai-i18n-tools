<a id="add-i18n-to-a-net-resourcemanager-app"></a>
# Añadir i18n a una aplicación .NET ResourceManager

Esta página es para una aplicación .NET que ya carga cadenas con `ResourceManager` o ASP.NET `IStringLocalizer`, o una que lo hará. Usted mantiene ese cargador. ai-i18n-tools lee `T("…")` y `{loc:Tr '…'}`, traduce los mensajes y escribe satélites `.resx` cuyas claves son esas cadenas de origen. El asistente es `I18nResx.cs`, copiado por `init -t ui-dotnet-resx`.

La forma más rápida es darle a un agente de codificación la instrucción de esta página. Apunta la configuración a sus recursos, envuelve sus cadenas, verifica el resultado y puede agregar un selector de idioma. Usted instala la CLI, elige el proveedor e inicializa el proyecto usted mismo, porque eso necesita su clave API y sus elecciones. También ejecuta la traducción usted mismo, porque gasta dinero en su cuenta y reescribe sus archivos `.resx`.

Una nueva aplicación Avalonia, WPF, MAUI, WinForms o de consola sin archivos de recursos aún utiliza [Agregar i18n a una aplicación .NET](/es/guide/add-i18n-to-dotnet). Esa ruta agrega `I18n.cs` y JSON incrustado. ¿No está seguro de cuál se aplica? Consulte [¿No es su caso?](#not-your-case) al final.

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

Ejecuta esto una vez, antes de la instrucción. Escribe la configuración y `I18nResx.cs`, y utiliza el proveedor que eligió anteriormente.

```bash
ai-i18n-tools init -t ui-dotnet-resx -P openrouter
```

Pase `--namespace` cuando el espacio de nombres del proyecto no sea el que `init` imprime en `I18nResx.cs`. Con un `.csproj` en el directorio y sin `--namespace`, `init` usa el `RootNamespace` de ese archivo, o el nombre del archivo del proyecto. De lo contrario, el espacio de nombres es `AiI18n`.

La plantilla establece `ui.flatOutput` en false y `ui.resx` en:

| Campo | Predeterminado |
| --- | --- |
| `outputDir` | `Resources` |
| `baseName` | `SharedResource` |
| `writeNeutral` | true, por lo que `SharedResource.resx` contiene el texto de origen |
| `localeFormat` | `bcp47`, por lo que el archivo alemán es `SharedResource.de.resx` y el portugués brasileño es `SharedResource.pt-BR.resx` |
| `ingestExistingResx` | true |

`init` escribe `I18nResx.cs` cuando falta ese archivo. `ResourceBaseName` es el espacio de nombres, la carpeta de salida y el nombre base unidos con puntos (`MyApp.Resources.SharedResource`). El SDK incrusta un resx bajo ese nombre de manifiesto cuando el archivo se encuentra en esa carpeta. Si mueve los archivos, cambie `ResourceBaseName` para que coincida. `init` no edita el `.csproj`. Los ensamblados satélite se producen a partir de `*.{culture}.resx` en la compilación. Implemente esos satélites junto a la aplicación.

Ejecute `init` una vez. Reescribe `ai-i18n-tools.config.json` cada vez, por lo que una segunda ejecución elimina las ediciones que haya realizado. Si `I18nResx.cs` ya contiene el marcador `ai-i18n-tools-i18n-cs`, el proyecto ya está inicializado: omita este paso. `init` no sobrescribe un asistente existente.

Luego edite `sourceLocale` y `targetLocales`. `sourceLocale` es el idioma de las cadenas en el origen. Cualquier idioma BCP-47 es válido; el andamiaje usa `en`. Apunte `ui.resx` a la carpeta y el nombre base que su aplicación ya carga (manualmente, es decir, [Paso 1](#step-1-point-the-config-at-your-resources)). `neutralFile` es el resx neutral que asigna un nombre heredado como `LoginButton` a su texto de origen. Cuando se omite, se usa `{outputDir}/{baseName}.resx` si ese archivo existe.

El mismo bloque `ui` también puede escribir JSON plano. Vuelva a establecer `flatOutput` en true. Ambas salidas comparten un catálogo. Esta plantilla deja `flatOutput` en false para que solo se escriba `.resx`.

Formas de llamada y el asistente JSON: [Aplicaciones .NET](/es/guide/ui-strings/dotnet). Todas las demás claves de configuración: [Configuración](/es/reference/configuration).

<a id="run-the-agent-prompt"></a>
## Ejecutar la instrucción del agente

Abre el proyecto en tu agente de codificación (Cursor, Claude Code, Copilot o similar), inicia un nuevo chat y pega la instrucción a continuación. El proyecto ya debe estar inicializado. No hay nada que editar. Si quieres omitir algo, por ejemplo, no cambiar de idioma, indícalo en el mismo mensaje.

El agente primero verifica que la CLI, la configuración y `I18nResx.cs` existan, y se detiene con instrucciones si falta alguno. Luego trabaja en tres partes:

- La Parte 1 apunta `ui.resx` a los catálogos que la aplicación ya carga, y verifica `ResourceBaseName`.
- La Parte 2 envuelve las cadenas visibles para el usuario en `T()` y `{loc:Tr '…'}`, y aplica sugerencias de claves con nombre manualmente.
- La Parte 3 agrega un selector de idioma que permanece en `ResourceManager` o `IStringLocalizer`.

No instala ni inicializa nada, no lee su clave API ni traduce. No reescribe archivos `.resx`. La traducción es el paso posterior a la revisión, y usted la ejecuta.

````markdown
# Add languages to this .NET ResourceManager app

## Before you start

The user must already have installed ai-i18n-tools and initialised this
project. Check that `ai-i18n-tools --version` runs, that
`ai-i18n-tools.config.json` exists with a `ui.resx` block, and that an
`I18nResx.cs` containing `ai-i18n-tools-i18n-cs` exists. If any of them is
missing, stop now and tell the user to install ai-i18n-tools and run
`ai-i18n-tools init -t ui-dotnet-resx -P <provider>`, then run this prompt
again. Do not install or initialise anything yourself. Do not overwrite an
existing config or an existing `I18nResx.cs`.

An app with no `.resx` and no `IStringLocalizer` belongs on the `ui-dotnet`
template (`I18n.cs` and embedded JSON). Stop and say so. Do not add both
helpers unless the user asked for both outputs.

## Rules

- Do not read or search the ai-i18n-tools source. This prompt is complete.
- Never read, print, or write API keys, `.env` files, or the shell environment.
- `init` already adds `.gitignore` patterns for the default `cacheDir`
  `.translation-cache`: `.translation-cache/*`, `!.translation-cache/cache.db`,
  `benchmark-scores.json`, `.env`, `.env.local`, `.env.*.local`, `*.tmp`, and
  `*.backup.*`. Do not replace those lines. Do not ignore the cache directory
  itself (`<cacheDir>/` drops `cache.db`). If `cacheDir` is not
  `.translation-cache`, the two cache lines must use that directory
  (`<cacheDir>/*` and `!<cacheDir>/cache.db`). If `doctor` reports a missing
  pattern, append only that pattern. Keep the negation so `cache.db` stays
  tracked.
- Do not run `translate-ui`, `suggest-models`, or `sync`. They call the
  translation API, cost money, and `translate-ui` rewrites the `.resx` files.
  The user runs them after reviewing your work.
- Do not translate, reword, or rename source text. Do not hand-edit `.resx`,
  `strings.json`, or per-locale JSON. Do not edit `I18nResx.cs` except
  `ResourceBaseName` when the files move.
- Do not introduce new semantic keys. The literal in `T("…")` is the source
  sentence and the resx name. Existing names such as `LoginButton` are
  migrated by hand from the report. Do not let the tool rewrite those lines.
- Do not reformat unrelated code. Keep existing blank lines. Run the project's
  formatter and linter at the end. Leave unrelated edits in a dirty tree alone.
  Delete throwaway scripts and do not commit them.

## Part 1 — Point the config at your resources

Skip a piece of this part when it is already done.

1. Make `ui.resx.outputDir` and `ui.resx.baseName` match the folder and the
   file stem the app already loads. `localeFormat` stays `bcp47` unless the
   satellites use `pt_BR` names, in which case set `posix`.
2. Set `neutralFile` when the neutral resx is not `{outputDir}/{baseName}.resx`.
   Leave `ingestExistingResx` and `writeNeutral` on so `extract` keeps
   translations that are already in the satellites and `ResourceManager` can
   fall back to the source text.
3. `ResourceBaseName` in `I18nResx.cs` is the namespace, the output folder, and
   the base name joined with dots. The SDK embeds a resx under that manifest
   name when the file sits in that folder. Change the constant when you move
   the files. Change nothing else in the helper.
4. Set `ui.sourceRoots` to the application project instead of `"."`. Point
   `ui.stringsJson` and `ui.flatOutputDir` at the resources folder.
5. Add `global using static <Namespace>.I18nResx;` or call `I18nResx.T` at
   each site. The namespace is the one already in `I18nResx.cs`.
6. `init` does not edit the `.csproj`. Satellite assemblies come from
   `*.{culture}.resx` on build. Do not add an `EmbeddedResource` item for
   JSON unless the user also turned `flatOutput` on.

## Part 2 — Wrap strings

Keep the loader. The new calls use the source sentence as the key. With the
source locale active, the app must behave exactly as before.

- Call shapes: `T("Sign in")`, `T("Saved to {0}", path)`,
  `Tn("1 sample", "{0} samples", count)`, `Tp("menu", "Open")`, `N("Light")`.
  Placeholders are `{0}`, `{0,-10}`, and `{0:C}`. `{name}` stops `extract`.
  Look up first. Never `T($"…")`, `T("a" + b)`, or `T(string.Format(…))`.
- XAML and AXAML: `{loc:Tr 'Sign in'}`. Leave `{Binding}` and
  `{StaticResource}` alone. Element content is not extracted. A literal that
  contains an apostrophe uses `&quot;`.
- `IStringLocalizer` already treats the name you pass as the key and returns
  that name when the resource is missing. `extract` records `T`, `Tn`, `Tp`,
  `N`, `Tr`, and `Loc`. A field named `_localizer` is invisible until that
  name is added to `ui.uiExtractor.funcNames`. Prefer `T("Sign in")` or
  `I18nResx.T("Sign in")` so the default names match.
- Do not rewrite `Resources.LoginButton` yourself in bulk. After `extract`,
  `migrate-dotnet-i18n-report.md` lists those sites as suggestions, for
  example `Resources.LoginButton` → `T("Sign in")`. Apply that list by hand.
  The command does not edit those lines.
- Wrap text a person sees. Leave logs, JSON keys, file names, `nameof`,
  attribute arguments, and exception text that is not shown. A stored option
  keeps its source value. Translate the caption when it is shown. Do not fill
  a static dictionary with `T(…)` at startup.
- resx has no plural forms. Each CLDR form is its own entry, named
  `{singular}[{form}]`, for example `1 sample[one]`. `Tn` selects the form.
  You do not type the plural suffix yourself. Context uses U+2404 between the
  context and the source, because U+0004 is illegal in XML. `Tp("menu", "Open")`
  looks that key up. You do not type the separator.

Work in passes: wrap, run `ai-i18n-tools extract`, read the named-key
suggestions, apply them by hand, then run `extract` again.

Then run `ai-i18n-tools migrate-dotnet-i18n` without `--write` and read the
report. Apply `--write` only for the unsafe `T($"…")` and concatenation
edits, after reading them. Never expect `--write` to rewrite
`Resources.LoginButton`. `--wrap` audits unmarked XAML and high-confidence C#
sinks. A clean report is not coverage. Do not commit the report. Do not edit
`.resx` files. `translate-ui` regenerates the neutral file and every satellite.

## Part 3 — Language switch

Skip this part only when the program shows no text a person reads, or when the
user asked you to leave language choice out. A console app gets `--lang <code>`
(and `-L` when that name is free), not a widget. Do not read `AI_I18N_LANG`.

`T` looks up with `CultureInfo.CurrentUICulture`, so a framework that sets the
UI culture for the request or the window gets the right satellite.
`I18nResx.SetLocale` sets `CurrentUICulture` and `CurrentCulture` together, then
raises `LocaleChanged`. It also stores one locale in a static field, and `Tn`
reads that field when it picks a plural form. Do not call `SetLocale` as a
per-user switch while other requests are in flight. A multi-user server keeps
`IStringLocalizer` and the request culture for ordinary strings.

- ASP.NET Core: `AddLocalization` with `ResourcesPath` set to the resx folder.
  An empty `SharedResource` class is the type argument of
  `IStringLocalizer<SharedResource>`. Its manifest name must equal
  `ResourceBaseName`. Set the request culture from the explicit choice, then
  the cookie, then `Accept-Language`, then the source locale. Accept only
  `sourceLocale` and `targetLocales`.
- Desktop: restore the saved culture before the first `T`, call
  `I18nResx.SetLocale`, and refresh visible text from `LocaleChanged`. Build
  the menu from the configured cultures. Label it `T("Language")`. When the
  framework has a flow direction, set it from `CultureInfo.TextInfo.IsRightToLeft`.
  `I18nResx` has no `SupportedLocales` list.
- `I18nResx.cs` does not reference `Microsoft.Extensions.Localization`. A
  console or desktop project does not take that dependency. Add the package
  only in the ASP.NET project, and put plural helpers there:

```csharp
public static LocalizedString Plural(
    this IStringLocalizer localizer,
    string singular,
    string plural,
    int count)
{
    return new LocalizedString(singular, I18nResx.Tn(singular, plural, count), false);
}
```

## Verify and report

The project's build and tests pass. `extract` writes a catalog of the
sentences you wrapped and keeps values ingested from the existing resx. With
the source locale, the output is unchanged. Your `.resx` files are untouched.

Report the files changed, each string you skipped with file, line, surface,
and reason, named keys you did not apply, one word with two meanings, and
plurals left as one string. With a satellite present, one test sets a target
culture and asserts that a shown validation message and a caption change,
while the stored value stays in the source language. If `dotnet` is not
installed, say the runtime check was skipped.

Then list the commands for the user, and do not run them:
`ai-i18n-tools suggest-models` (optional), `ai-i18n-tools translate-ui`, then
rebuild so the satellites are embedded. Remind the user to commit first,
because `translate-ui` rewrites the `.resx` files, and to fill
`glossary-user.csv` before that run.
````

<a id="review-the-result"></a>
## Revisar el resultado

El agente finaliza con un informe. Revísalo antes de traducir:

- La diferencia. Las llamadas envueltas, la configuración, `ResourceBaseName` si los archivos se movieron, y el selector de idioma deberían haber cambiado. Sus archivos `.resx` deberían permanecer intactos hasta que traduzca.
- `ai-i18n-tools.config.json`: `resx.outputDir` y `baseName` apuntan a los catálogos que carga su aplicación, y `sourceRoots` cubre el proyecto de la aplicación.
- `ResourceBaseName` coincide con el nombre del manifiesto que incrustará el SDK.
- `ai-i18n-tools extract` enumera los nuevos mensajes y mantiene las traducciones ya existentes en los satélites.
- La ejecución de prueba de `migrate-dotnet-i18n` no muestra nada que corregir, excepto las sugerencias de claves con nombre que elegiste posponer. Esas líneas siguen siendo `Resources.LoginButton` hasta que las edites.
- Tus pruebas pasan y la aplicación se ve igual en el idioma de origen.
- No se dejó ningún script desechable ni `migrate-dotnet-i18n-report.md`.

Confirma este estado. `translate-ui` reescribe tus archivos `.resx`, por lo que querrás una diferencia limpia para revisar.

<a id="choose-models-and-translate"></a>
## Elegir modelos y traducir

Tú ejecutas esta parte. Utiliza tu clave de API, gasta dinero de tu cuenta y reescribe tus archivos `.resx`, así que confirma primero.

La lista de modelos de `init` es un punto de partida. Clasifique los modelos de chat del proveedor activo y, cuando la lista corta parezca correcta, escríbala en `translationModels`:

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` solo reemplaza `translationModels`. La misma clasificación se encuentra en la pestaña [Modelos](/es/guide/translation-dashboard/models) de `ai-i18n-tools dashboard`.

Rellena el glosario antes del primer `translate-ui`. `init` apunta `glossary.userGlossary` a `glossary-user.csv` y no crea el archivo. Si el archivo falta, ejecuta `ai-i18n-tools glossary-generate` y luego añade los términos de dominio. Usa **Force** para los nombres que deben copiarse sin cambios.

Luego extrae y traduce:

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
ai-i18n-tools status
```

`translate-ui` escribe el archivo neutro y un satélite por cada idioma de destino. Las claves son las cadenas de origen. El `<comment>` registra el contexto y la primera ubicación de origen. Una edición manual en un satélite se mantiene solo si `extract` la ingiere antes de la siguiente traducción, el mismo contrato que los archivos `.po`. Deja los archivos generados sin editar a partir de ahora, porque la siguiente ejecución los regenerará. Revisa la primera diferencia antes de confirmarla.

Se omiten las entradas con un `type` o `mimetype` (imágenes y otros binarios). `ResourceManager.GetString` devuelve el valor neutro cuando esa cultura no tiene entrada.

Recompila para que el SDK incruste los nuevos satélites y luego reinicia la aplicación.

<a id="check-one-language"></a>
### Comprobar un idioma

Cambia a un idioma de destino y abre una pantalla con algunas cadenas envueltas. El texto que aún está en el idioma de origen no se envolvió, todavía usa una clave con nombre que no se aplicó, o el satélite no se reconstruyó. Una traducción que elimina `{0}` o lo renombra puede lanzar `FormatException` u omitir el valor. `string.Format` no recurre a la plantilla de origen. Verifica el satélite para esa oración antes de sospechar del código.

<a id="keep-it-translated"></a>
## Mantenerlo traducido

Vuelve a ejecutar `ai-i18n-tools sync` (o `extract` y luego `translate-ui`) después de cambiar el texto de origen. La caché significa que solo las cadenas nuevas o modificadas van al modelo. Ejecútalo en CI para que las traducciones no se desvíen. Recompila después de una ejecución de traducción para que los satélites se incrusten de nuevo. `ai-i18n-tools dashboard` abre el [Panel de traducción](/es/guide/translation-dashboard/) para revisar las traducciones.

`purge-locale` elimina `SharedResource.<culture>.resx` y deja `SharedResource.resx`.

Para actualizar un `I18nResx.cs` copiado, genera la misma plantilla en un directorio desechable y copia solo el archivo generado que deseas reemplazar. No vuelvas a ejecutar `init` en la aplicación para actualizar el asistente.

Para traducir `README.md` en la misma ejecución, genera la estructura con `--with-readme` (o añade el bloque a una configuración existente). Consulta [Añadir i18n a tus archivos README y de Markdown](/es/guide/add-i18n-to-readme).

<a id="do-it-by-hand"></a>
## Hazlo manualmente

Sigue estos pasos si prefieres hacer los cambios tú mismo, o si quieres saber qué hace el prompt. Cada paso coincide con una parte del prompt. Aun así, [instalas la CLI](#install-and-choose-a-provider), [inicializas el proyecto](#initialise-the-project) y [traduces](#choose-models-and-translate) al final.

1. [Apuntar la configuración a tus recursos](#step-1-point-the-config-at-your-resources).
2. [Envolver cadenas](#step-2-wrap-strings) en `T()` o `{loc:Tr '…'}`.
3. [Aplicar claves de recursos con nombre](#step-3-apply-named-resource-keys).
4. [Cambiar idioma en tiempo de ejecución](#step-4-switch-language-at-runtime).

<a id="step-1-point-the-config-at-your-resources"></a>
## Paso 1: Apunta la configuración a tus recursos

La plantilla escribe esta forma. Cambia la carpeta y el nombre base a los catálogos que tu aplicación ya carga:

```json
{
  "ui": {
    "sourceRoots": ["."],
    "stringsJson": "Resources/strings.json",
    "flatOutputDir": "Resources",
    "flatOutput": false,
    "resx": {
      "outputDir": "Resources",
      "baseName": "SharedResource",
      "writeNeutral": true,
      "ingestExistingResx": true,
      "localeFormat": "bcp47"
    }
  }
}
```

Verifica cuatro cosas en tu proyecto:

- `outputDir` y `baseName` son donde ya residen el archivo neutro y los satélites. El alemán es `SharedResource.de.resx`. El portugués brasileño es `SharedResource.pt-BR.resx` cuando `localeFormat` es `bcp47`.
- `neutralFile` se establece cuando ese archivo neutro no es `{outputDir}/{baseName}.resx`. La ingesta mapea un nombre heredado (`LoginButton`) a través del valor neutro (`Sign in`). El valor alemán `LoginButton` se almacena entonces bajo la cadena de origen `Sign in`.
- `ResourceBaseName` en `I18nResx.cs` es el espacio de nombres, la carpeta de salida y el nombre base unidos con puntos. Mueve la constante cuando los archivos se muevan. Deja el resto del asistente intacto.
- `sourceRoots` es el proyecto de la aplicación, no `"."`.

El nombre resx de una cadena simple es el texto de origen: `Sign in`, `Saved to {0}`, un valor que contiene una comilla o un ampersand. El contexto usa U+2404 entre el contexto y el origen. resx no tiene formas plurales. Cada forma CLDR es su propia entrada, llamada `{singular}[{form}]`. `Tn` selecciona la forma con las mismas reglas que el escritor `.po`. No escribes el separador ni el sufijo plural.

Confirma con `ai-i18n-tools extract`. El catálogo debería listar las cadenas ingeridas del archivo neutro.

<a id="step-2-wrap-strings"></a>
## Paso 2: Envolver cadenas

`extract` registra una cadena solo cuando es un literal pasado a `T()`, `Tn`, `Tp`, `N` o `{loc:Tr '…'}`. Se aplican las mismas formas que el [asistente JSON](/es/guide/add-i18n-to-dotnet#step-2-wrap-strings). Los marcadores de posición son `{0}`, no `{name}`.

```csharp
T("Sign in")
T("Saved to {0}", path)
Tn("1 sample", "{0} samples", count)
Tp("menu", "Open")
```

`IStringLocalizer` busca el nombre que le pases y devuelve ese nombre cuando el recurso falta. Los nombres de extractor predeterminados son `T`, `Tn`, `Tp`, `N`, `Tr` y `Loc`. Una llamada como `_localizer["Sign in"]` es invisible hasta que se añade `_localizer` a `ui.uiExtractor.funcNames`. Llamar a `T("Sign in")` o `I18nResx.T("Sign in")` no necesita ningún nombre adicional.

XAML usa `{loc:Tr '…'}`. El contenido del elemento no se extrae. Deja `{Binding}` y `{StaticResource}` tal cual.

Deja los registros, las claves JSON, los nombres de archivo, `nameof` y el texto de excepción que no se muestra. Un valor almacenado permanece en el idioma de origen. Traduce el título en el control.

Las llamadas no seguras (`T($"…")`, concatenación, `string.Format` dentro de `T`) son el informe del siguiente paso, junto con nombres heredados como `Resources.LoginButton`.

<a id="step-3-apply-named-resource-keys"></a>
## Paso 3: Aplicar claves de recurso con nombre

`migrate-dotnet-i18n` es una ejecución de prueba hasta que pases `--write`. Reescribe los argumentos de `T` que se construyeron antes de la búsqueda, las mismas ediciones que [Comprobar llamadas envueltas](/es/guide/add-i18n-to-dotnet#step-3-check-wrapped-calls).

Cuando `extract` ha ingerido un `.resx` neutral, el informe también obtiene una sección de claves con nombre:

```text
- MainWindow.axaml.cs:40 Resources.LoginButton → T("Sign in")
```

Esa lista es para que la apliques. El comando no edita esas líneas. `--write` tampoco lo hace. Después de cambiar una llamada a `T("Sign in")`, ejecuta `extract` de nuevo.

```bash
ai-i18n-tools extract
ai-i18n-tools migrate-dotnet-i18n
```

Lee `migrate-dotnet-i18n-report.md`. Cuando las ediciones de llamadas no seguras parezcan correctas:

```bash
ai-i18n-tools migrate-dotnet-i18n --write
ai-i18n-tools extract
```

Ejecuta la ejecución de prueba de nuevo. Detente cuando no liste ediciones de llamadas no seguras. Las claves con nombre que aún no has aplicado permanecen en la lista de sugerencias. Elimina el informe o ignóralo con Git. No edites los archivos `.resx` en este paso.

<a id="step-4-switch-language-at-runtime"></a>
## Paso 4: Cambiar el idioma en tiempo de ejecución

`T` lee `CultureInfo.CurrentUICulture`. `I18nResx.SetLocale` establece esa referencia cultural y `CurrentCulture`, luego genera `LocaleChanged`. La configuración regional que almacena para `Tn` es estática, por lo que un servidor que maneja solicitudes concurrentes no debería usar `SetLocale` como el conmutador por usuario.

<a id="aspnet-core"></a>
### ASP.NET Core

`IStringLocalizer` es local a la solicitud. Apúntalo al archivo resx que la herramienta escribe. La clase vacía es solo el argumento de tipo. El nombre base del manifiesto tiene que coincidir con `ResourceBaseName`.

```csharp
builder.Services.AddLocalization(options => options.ResourcesPath = "Resources");

public sealed class SharedResource
{
}
```

En una página Razor o un servicio, llama a `T` para que `extract` vea el literal. Mantén un `IStringLocalizer<SharedResource>` existente cuando un sitio de llamada ya lo usa. Añade el nombre de ese receptor a `ui.uiExtractor.funcNames` si la búsqueda permanece en el indexador.

```csharp
public string Label => T("Sign in");
```

`IStringLocalizer` no tiene parámetro plural ni de contexto. Una extensión puede llamar a `I18nResx`, que lee los mismos satélites. Ponlo en el proyecto de ASP.NET. `I18nResx.cs` no hace referencia a `Microsoft.Extensions.Localization`, por lo que un proyecto de consola o de escritorio no toma ese paquete.

```csharp
public static LocalizedString Plural(
    this IStringLocalizer localizer,
    string singular,
    string plural,
    int count)
{
    return new LocalizedString(singular, I18nResx.Tn(singular, plural, count), false);
}
```

Elige la referencia cultural de la solicitud en este orden: la elección explícita del visitante (`?lang=` o un envío de formulario), la cookie que lo recuerda, el encabezado `Accept-Language`, luego la configuración regional de origen. Ignora los códigos que no estén en `sourceLocale` o `targetLocales`. `pt-BR` es el nombre del satélite. Un encabezado que envía `pt-br` todavía tiene que coincidir con ese nombre antes de asignar `CurrentUICulture`.

<a id="desktop-and-console"></a>
### Escritorio y consola

Restaura la referencia cultural guardada antes de que se construya la ventana, llama a `I18nResx.SetLocale` y actualiza el texto visible desde `LocaleChanged`. Crea el menú a partir de `sourceLocale` y `targetLocales`. Etiquétalo como `T("Language")`. La dirección del flujo proviene de `CultureInfo.TextInfo.IsRightToLeft`. No hay lista de `SupportedLocales` en este asistente.

Un programa de consola no tiene widget. Añade `--lang <code>` (y `-L` cuando ese nombre esté libre), luego llama a `SetLocale` antes del primer `T`. No leas `AI_I18N_LANG`.

Omita este paso cuando el programa no muestre texto que una persona lea.

Ese es el último paso manual. Continúe en [Elegir modelos y traducir](#choose-models-and-translate).

<a id="not-your-case"></a>
## ¿No es su caso?

| Tu código hoy | Leer |
| --- | --- |
| Todavía no hay `.resx` ni `IStringLocalizer` | [Añadir i18n a una aplicación .NET](/es/guide/add-i18n-to-dotnet) |
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
| [dotnet-resx](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/dotnet-resx) | Comprobaciones xUnit de `I18nResx.cs`: claves de cadena de origen, comillas, contexto, plurales, satélites reales |
| [dotnet-console](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/dotnet-console) | El asistente JSON, para una aplicación que no está en `ResourceManager` |

Estos directorios comprueban las utilidades. No son aplicaciones para traducir y no necesitan una clave de API. `dotnet test` en `dotnet-resx` ejecuta las comprobaciones satélite. Una aplicación real comienza desde `init` en esta página. Copie una con `npx degit`, o descargue `ai-i18n-tools-dotnet-examples.zip` desde la versión de GitHub. Ese zip también contiene `assets/dotnet`, que el proyecto compila. Comandos: [Ejemplos](/es/examples#net-examples).
