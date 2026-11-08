<a id="add-i18n-to-a-net-app"></a>
# i18n zu einer .NET-App hinzufügen

Diese Seite beschreibt, wie man eine .NET-App (Avalonia, WPF, MAUI, WinForms, Blazor, ASP.NET oder ein Konsolentool), die eine einzelne Sprache verwendet, mit ai-i18n-tools um Lokalisierungen erweitert. Sie folgt einem Pfad: der `ui-dotnet`-Vorlage, einem kleinen `I18n.cs`-Hilfsprogramm und JSON-Dateien mit Übersetzungen. `extract` erfasst einen UI-String nur, wenn es sich um ein String-Literal innerhalb von `T()`, `Tn`, `Tp`, `N` oder einem XAML-`{loc:Tr '…'}` handelt, sodass ein Katalog mit reinem Quelltext leer wäre.

Der schnellste Weg ist, einem Coding-Agenten den Prompt auf dieser Seite zu geben. Er platziert das Hilfsprogramm, bettet die Locale-JSON ein, umschließt Ihre Strings und kann einen Sprachumschalter hinzufügen. Sie installieren die CLI, wählen den Anbieter und initialisieren das Projekt selbst, da dies Ihren API-Schlüssel und Ihre Entscheidungen erfordert. Sie führen die Übersetzung auch selbst aus, da dabei Kosten auf Ihrem Konto anfallen.

Eine App, die bereits Strings mit `ResourceManager` oder ASP.NET `IStringLocalizer` lädt, verwendet [i18n zu einer .NET ResourceManager-App hinzufügen](/de/guide/add-i18n-to-dotnet-resourcemanager). Dieser Pfad behält den Loader bei und schreibt `.resx`-Satelliten. Nicht sicher, was zutrifft? Siehe [Nicht Ihr Fall?](#not-your-case) am Ende.

Der Ablauf:

1. [CLI installieren und einen Anbieter auswählen](#install-and-choose-a-provider).
2. [Projekt initialisieren](#initialise-the-project) mit `init`.
3. [Agent-Prompt ausführen](#run-the-agent-prompt).
4. [Ergebnis überprüfen](#review-the-result).
5. [Modelle auswählen und übersetzen](#choose-models-and-translate), dann eine Sprache prüfen.
6. [Übersetzt halten](#keep-it-translated).

Möchten Sie die Änderungen lieber selbst vornehmen oder wissen, was der Prompt tut? [Manuell vorgehen](#do-it-by-hand) führt die gleichen Schritte einzeln durch.

<a id="install-and-choose-a-provider"></a>
## Anbieter installieren und auswählen

Diesen Teil erledigen Sie, nicht der Agent. Der Installer nimmt Änderungen an Ihrem System vor, und der API-Schlüssel ist ein Geheimnis, das in Ihre Shell gehört, nicht in einen Prompt.

Verwenden Sie das npm-Paket, wenn der Rechner bereits Node.js `>=22.16.0` installiert hat ([Installation](/de/guide/installation)). Für ein .NET-Projekt installieren Sie die eigenständige ausführbare Datei (kein Node.js).

Linux und macOS:

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell):

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

Der Installer prüft `SHA256SUMS.txt`, installiert den Befehl als `ai-i18n-tools` und fügt ihn zu `PATH` hinzu. Die Binärdateien sind nicht notariell beglaubigt oder Authenticode-signiert. Manuelle Schritte und Asset-Namen: [Eigenständige ausführbare Dateien](/de/guide/installation#standalone-executables).

Installation überprüfen:

```bash
ai-i18n-tools --version
```

Wählen Sie dann einen Anbieter und legen Sie dessen API-Schlüssel in der Shell fest, die die Übersetzung ausführen wird. Zum Beispiel OpenRouter:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Ollama benötigt keinen Schlüssel. Andere Voreinstellungen: [Integrierte Anbieter](/de/guide/providers-and-models#built-in-providers). Merken Sie sich den Anbieternamen, da Sie ihn im nächsten Schritt an `init` übergeben. Der Agent benötigt den Schlüssel nie: Er führt nur Befehle aus, die keine Modellaufrufe tätigen. Sie verwenden den Schlüssel später, wenn Sie [übersetzen](#choose-models-and-translate).

<a id="initialise-the-project"></a>
## Projekt initialisieren

Dies führen Sie einmalig vor dem Prompt aus. Es schreibt die Konfiguration und `I18n.cs` und verwendet den oben ausgewählten Anbieter.

Diese Seite verwendet eine Vorlage, `ui-dotnet`. Sie schreibt die Konfiguration, das `I18n.cs`-Hilfsprogramm und JSON-Kataloge. Sie passt zu diesen Apps:

| Ihre App | Hinweise |
| --- | --- |
| Avalonia, WPF, MAUI | Labels in XAML benötigen eine Markup-Erweiterung. Das Hilfsprogramm referenziert diese Assemblies nicht |
| WinForms | Sichtbaren Text neu erstellen, wenn sich die Lokalisierung ändert |
| Blazor und eine Single-User ASP.NET-App | Der Katalog des Hilfsprogramms ist statisch, was für einen Benutzer gleichzeitig ausreicht |
| Ein Multi-User-Server | Behalten Sie `IStringLocalizer` oder `ResourceManager` bei. Verwenden Sie die [ResourceManager-Seite](/de/guide/add-i18n-to-dotnet-resourcemanager) |
| Konsolentools | Eine `--lang`-Option, kein Widget |

Führen Sie init mit dem von Ihnen gewählten Anbieter aus (OpenRouter in diesem Beispiel):

```bash
ai-i18n-tools init -t ui-dotnet -P openrouter
```

Übergeben Sie `--namespace`, wenn der Projekt-Namespace nicht derjenige ist, den `init` in `I18n.cs` ausgibt. Mit einer `.csproj` im Verzeichnis und keiner `--namespace` verwendet `init` den `RootNamespace` dieser Datei oder den Projektdateinamen. Andernfalls ist der Namespace `AiI18n`.

Bearbeiten Sie dann `sourceLocale` und `targetLocales` in `ai-i18n-tools.config.json`. `sourceLocale` ist die Sprache der Strings in der Quelle. Jede BCP-47-Sprache ist gültig; das Scaffold verwendet `en`. `init` stempelt diese Liste als `BuiltInLocales` in `I18n.cs` ein, zwischen den `ai-i18n-tools-locales`-Markierungen, und `SourceLocale` ist eine Konstante. Dieser Stempel ist nicht das Sprachmenü. `extract` schreibt `locales/ui-languages.json` aus der Konfiguration neu, und die App liest diese Datei beim Start. Führen Sie `init` nicht erneut in der App aus, um den Helper zu aktualisieren.

Führen Sie `init` einmal aus. Es überschreibt `ai-i18n-tools.config.json` jedes Mal, sodass ein zweiter Durchlauf von Ihnen vorgenommene Änderungen verwirft. Wenn `I18n.cs` bereits den Marker `ai-i18n-tools-i18n-cs` enthält, ist das Projekt bereits initialisiert: Überspringen Sie diesen Schritt. `init` überschreibt keine vorhandene `I18n.cs` und bearbeitet die `.csproj` nicht.

`init` setzt `ui.sourceRoots` auf `"."`, sodass `extract` das gesamte Repository scannen würde. Die Eingabeaufforderung schränkt es auf Ihren Anwendungscode ein (manuell, das ist [Schritt 1](#step-1-place-the-helper-and-embed-the-catalogs)). Der Scan überspringt bereits Verzeichnisse namens `bin`, `obj`, `.vs`, `TestResults` und `packages`, und die Vorlage schließt `**/Tests/**`, `**/*.Tests/**` und `**/TrExtension.cs` aus.

Aufruf-Formen: [.NET-Anwendungen](/de/guide/ui-strings/dotnet). Jeder andere Konfigurationsschlüssel: [Konfiguration](/de/reference/configuration).

<a id="run-the-agent-prompt"></a>
## Agent-Prompt ausführen

Öffnen Sie das Projekt in Ihrem Coding-Agenten (Cursor, Claude Code, Copilot oder ähnlich), starten Sie einen neuen Chat und fügen Sie den unten stehenden Prompt ein. Das Projekt muss bereits initialisiert sein. Es gibt nichts zu bearbeiten. Wenn Sie etwas weglassen möchten, zum Beispiel keinen Sprachumschalter, geben Sie dies in derselben Nachricht an.

Der Agent prüft zunächst, ob die CLI, die Konfiguration und `I18n.cs` vorhanden sind, und stoppt mit Anweisungen, falls eines fehlt. Dann arbeitet er in drei Teilen:

- Teil 1 platziert `I18n.cs` und `locales/` dort, wo das Projekt seinen Code speichert, bettet die JSON ein und verweist die Konfiguration darauf.
- Teil 2 umschließt die benutzerspezifischen Strings in `T()`, `Tn`, `Tp`, `N` und `{loc:Tr '…'}` und prüft dann unsichere Aufrufe mit `migrate-dotnet-i18n`.
- Teil 3 fügt einen Sprachumschalter oder eine CLI-Sprachoption hinzu.

Er installiert oder initialisiert nichts, liest Ihren API-Schlüssel nicht und übersetzt nicht. Die Übersetzung ist der Schritt nach der Überprüfung, und Sie führen sie aus.

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
- `init` already adds `.gitignore` patterns for the default `cacheDir`
  `.translation-cache`: `.translation-cache/*`, `!.translation-cache/cache.db`,
  `benchmark-scores.json`, `.env`, `.env.local`, `.env.*.local`, `*.tmp`, and
  `*.backup.*`. Do not replace those lines. Do not ignore the cache directory
  itself (`<cacheDir>/` drops `cache.db`). If `cacheDir` is not
  `.translation-cache`, the two cache lines must use that directory
  (`<cacheDir>/*` and `!<cacheDir>/cache.db`). If `doctor` reports a missing
  pattern, run `ai-i18n-tools doctor --fix-gitignore`. That appends a blank
  line, `# ai-i18n-tools doctor fix`, and only the missing lines. Keep the
  negation so `cache.db` stays tracked.
- Do not run `translate-ui`, `suggest-models`, `sync`, or `glossary-generate`.
  The first three call the translation API and cost money. `glossary-generate`
  only writes an empty CSV and does not call the translator. The user runs
  them after reviewing your work, and fills `glossary-user.csv` before the
  first `translate-ui`. Do not read `.env` or the environment to fill it.
- Do not translate, reword, or rename source text. Do not edit `I18n.cs`
  except `SourceLocale` and the `BuiltInLocales` array between the
  `ai-i18n-tools-locales` markers, and only when `sourceLocale` drifted after
  init. That stamp is not the language menu. Loading
  `locales/ui-languages.json` does not require editing the helper. Do not edit
  generated files (`strings.json`, per-locale JSON, `ui-languages.json`,
  `.resx`). Do not add another helper module.
- Follow that project's changelog and user-doc rules in the same session when
  visible behaviour changes.
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
5. `BuiltInLocales`, between the `ai-i18n-tools-locales` markers, is only the
   list stamped at init. It is not the language menu. If `sourceLocale`
   drifted after init, update the `SourceLocale` const so it matches the
   config. Leave the rest of the helper alone. Part 3 loads the menu from
   `locales/ui-languages.json`.
6. Run `ai-i18n-tools extract` and confirm the catalog is in the new place.

## Part 2 — Wrap strings

The literal in `T("…")` is the source-language sentence and the catalog key.
With the source locale active, the app must behave exactly as before. The
exception is `Tn`: it may correct a sentence that was always plural
(`1 samples` becomes the singular form). Text that is already wrapped needs
no change.

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
  a `TrExtension` in the app. Do not reference those UI assemblies from
  `I18n.cs`. `ProvideValue` returns `I18n.T(Text)` and sets that same property
  again on `LocaleChanged`, so a screen that is already open updates.
  Unsubscribe when the control leaves the visual tree. Add `**/TrExtension.cs`
  to `ui.uiExtractor.exclude`. `extract` otherwise warns that `T(Text)` is not
  a literal. The XAML literals are already extracted through `Tr`. `{loc:Tr}`
  can only call `T`. When one short word has two meanings, set those controls
  in code with `Tp`.
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

- `StringFormat` on a binding (`StringFormat='Cursor {0}'`) is invisible to
  `extract`. Move it to the view model as `T("Cursor {0}", value)`, and raise
  `PropertyChanged` from `LocaleChanged`.
- A combo bound to an enum (`System`, `Light`, `Dark`) shows `ToString()`.
  Keep the stored enum. Return `T("Light")` from the caption, and rebuild the
  item list on `LocaleChanged` so the old caption is not cached.
- Tray or menu items use `Tp("tray", "Open")` and a stable `CommandParameter`.
  Match the parameter, not the translated header.
- An error built in a service and shown later stays in the source language
  until the display site. Store the English sentence. The display site maps
  known sentences through `T`, so a later `LocaleChanged` can translate them.
  `T()` at the moment of the failure freezes that sentence.
- Linux `.desktop` `Name=` and `Comment=` are launcher metadata. Leave them in
  the source language. Translating `Name=` replaces the desktop file's default
  name.
- Compact durations that are compared before display (`2d`, `7h 47m`) stay as
  tokens. Translate `T("now")` and `T("in {0}", duration)` at the display
  site. Do not translate the tokens inside the comparison.
- A literal with leading or trailing spaces (`Updated: `) is an extract
  warning. Move the space into the format string (`T("Updated: {0}", value)`)
  or into the layout. The helper trims the catalog key and puts the spaces
  back. Clear the warning anyway.
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
`Tn` may change the source-locale sentence when the old text was always
plural (`1 samples`).

Lines the command leaves in place (`await`, a raw `$$"""` string, a `? :`
hole, `ref` or `out`, a concatenation with no literal) are fixed by hand.

## Part 3 — Language switch

Skip this part only when the program shows no text a person reads, or when the
user asked you to leave language choice out. A console app still gets this
part: `--lang <code>` (and `-L` when that name is free), not a widget. Do not
read `AI_I18N_LANG`. That variable is only for the ai-i18n-tools CLI.

Goal: one chosen language applies to every `T()` in that process, and a screen
can remember the choice. Persist the locale code, not the native name.

Load the language menu from `locales/ui-languages.json` on disk at startup,
before the first `T()`. Search upward from `AppContext.BaseDirectory`, then
from the current directory, at most 8 directories each. The first
`locales/ui-languages.json` wins. Map `code`, `label`, and `englishName` to
`LocaleInfo` (`label` is `NativeName`) and pass that array to `I18n.Configure`
as `Locales`. When the file is found, set `FlatDirectory` to that `locales`
directory in the same call. `Configure` replaces `Strict`, `FlatDirectory`,
and `OpenLocale` on every call, even when the caller only set `Locales`. A
later call that sets the language list clears a `FlatDirectory` set earlier.
`Locales: null` does not restore the previous list.

If `ui-languages.json` is missing, pass a one-element `Locales` array for the
source language and do not set `FlatDirectory`. The menu is the source
language only. Do not show `BuiltInLocales`. In development, `FlatDirectory`
is the `locales` folder that contained the manifest, so `sync` updates
sentences without a rebuild. A published build with no manifest nearby uses
the embedded catalogs and shows the source language only. An installer that
should follow `sync` must ship `ui-languages.json` and the locale JSON next
to the app.

Accept only codes from the list just passed. Set
`CultureInfo.CurrentUICulture` and `CultureInfo.CurrentCulture`, then call
`I18n.SetLocale`, before the first `T()`. `SetLocale` raises `LocaleChanged`
immediately, so the cultures have to be set first. `string.Format` uses the
current UI culture, so `{0:C}` follows it. Restore the saved code the same
way at startup.

Add a control labelled `T("Language")` whose options are that list (`Code`,
`NativeName`). On change, set both cultures, then call `SetLocale`, and
persist the code.

On `LocaleChanged`, refresh view-model properties that call `T`. WinForms and
other toolkits that copy text into controls rebuild those properties in the
handler. For Avalonia, WPF, and MAUI, `TrExtension` returns `I18n.T(Text)` and
updates the target property on `LocaleChanged`. Exclude `TrExtension.cs` from
extraction. When the framework has a flow direction, set it from
`I18n.IsRightToLeft(code)`.

Avalonia only: ignore `SelectionChanged` unless `e.Source` is the control that
owns the handler. Do not assign `ItemsSource`, `SelectedItem`, or other combo
state inside a `SelectionChanged` handler, including from `LocaleChanged` if
that event was raised by the combo. Post the refresh with
`Dispatcher.UIThread.Post` so it runs after the selection event returns. Guard
the language handler with a flag while the code itself sets `SelectedItem`,
or the refresh will set the locale again. Avalonia will crash (exit code 139,
`SIGSEGV`, no managed stack in `crash.log`) if a parent `TabControl` handles
a child combo's `SelectionChanged` by setting `ItemsSource` again.

Do not use this helper as a per-user selector in a multi-user server. Keep
`IStringLocalizer` or `ResourceManager` for that case.

## Verify and report

The project's build and tests pass. `extract` writes a non-empty catalog of
the sentences you wrapped, with no warnings. With the source locale, the
output is unchanged, except a `Tn` singular that corrects a sentence that was
always plural. A missing key returns the source string unless `Strict` is
set. A bad format in a translation can throw `FormatException`. A dropped
`{0}` can omit the value. `string.Format` does not fall back to the source
template.

`I18n` and the two cultures are process-global. xUnit runs test classes in
parallel by default. When a test calls `SetLocale`, turn assembly
parallelization off and restore `CurrentCulture`, `CurrentUICulture`, the
locale, and the previous `Locales` array before the test returns. `Configure`
with `Locales: null` does not restore the list. With a locale file present,
one test sets a target locale and asserts that a validation message and a
caption change, while the stored option value stays in the source language,
then restores that static state. Do not add a test that only checks the menu
against `ui-languages.json` unless the user asks. If `dotnet` is not
installed, say the runtime check was skipped.

Report the files changed, each string you skipped with file, line, surface,
and reason, the same word used with different meanings, sentences built from
translated pieces, plurals left as one string, and any `T()` that runs at
startup.

Then list the commands for the user, and do not run them:
`ai-i18n-tools suggest-models` (optional), `ai-i18n-tools glossary-generate`
when `glossary-user.csv` is missing, then fill that file,
`ai-i18n-tools translate-ui`, then restart the app. With `FlatDirectory`
pointed at the `locales` folder, a restart picks up new sentences. A rebuild
is needed only when the manifest was not found and the app is still reading
embedded JSON. Also list these checks, and do not perform them: change
`targetLocales`, run `sync`, and launch with no further code edit (the menu
matches `ui-languages.json` and the sentences match the new locale file);
hide `ui-languages.json` and launch again (the menu is the source language
only); switch language from a combo inside a `TabControl` with that page
already open (the process stays up and the open labels change).
````

<a id="review-the-result"></a>
## Ergebnis überprüfen

Der Agent schließt mit einem Bericht ab. Überprüfen Sie ihn, bevor Sie übersetzen:

- Der Diff. Umwickelter Text sollte sich wie zuvor lesen, ohne irrelevante Neuformatierung. `git diff --stat` zeigt, wie viel sich geändert hat. Die Helper-Platzierung, das `EmbeddedResource`-Element, die umwickelten Aufrufe und der Sprachwechsel sind die erwarteten Bearbeitungen.
- Generierte Kataloge (`strings.json`, pro-Locale JSON, `ui-languages.json`) sind unberührt, abgesehen von dem, was `extract` geschrieben hat. `I18n.cs` ist unberührt, abgesehen von einem `SourceLocale`-Stempel, wenn diese Konstante abgewichen ist. Das Menü wird aus `ui-languages.json` geladen. Ein `Configure`-Aufruf setzt `Locales` und `FlatDirectory` zusammen, wenn diese Datei gefunden wurde. `TrExtension` ist von der Extraktion ausgeschlossen und aktualisiert die offene Ansicht auf `LocaleChanged`.
- `ai-i18n-tools extract` läuft sauber durch, und `strings.json` listet die Sätze auf, die Sie erwarten. Es bleibt keine Warnung übrig, und kein Literal enthält noch `{name}`.
- Der Probelauf von `migrate-dotnet-i18n` listet nichts auf, was noch zu beheben ist. Ein sauberer Bericht beweist nicht, dass jeder Satz umwickelt wurde. Die übersprungenen Strings im Bericht des Agenten sind der Rest dieser Überprüfung.
- Ihre Tests sind erfolgreich, und die App sieht in der Ausgangssprache gleich aus.
- Es wurde kein Wegwerfskript oder `migrate-dotnet-i18n-report.md` zurückgelassen.
- `SourceLocale` in `I18n.cs` entspricht `sourceLocale` in der Konfiguration, Zeichen für Zeichen. Das Sprachmenü liest `BuiltInLocales` nicht.

Vom Agenten übersehene Zeichenketten erscheinen später als Text, der in der Ausgangssprache verbleibt.

<a id="choose-models-and-translate"></a>
## Modelle auswählen und übersetzen

Sie führen diesen Teil aus. Er verwendet Ihren API-Schlüssel und verursacht Kosten auf Ihrem Konto.

Die Modellliste von `init` ist ein Ausgangspunkt. Bewerten Sie die Chat-Modelle des aktiven Anbieters und schreiben Sie die Auswahl in `translationModels`, sobald die engere Auswahl korrekt aussieht:

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` ersetzt nur `translationModels`. Dieselbe Rangfolge finden Sie auf der Registerkarte [Modelle](/de/guide/translation-dashboard/models) von `ai-i18n-tools dashboard`.

Füllen Sie das Glossar vor dem ersten `translate-ui`. `init` verweist `glossary.userGlossary` auf `glossary-user.csv` und erstellt die Datei nicht. Wenn die Datei fehlt, führen Sie `ai-i18n-tools glossary-generate` aus und fügen Sie dann Domänenbegriffe hinzu. Verwenden Sie **Force** für Namen, die unverändert kopiert werden müssen. Ein zweiter `translate-ui` einer unveränderten Zeichenfolge kann anders formuliert zurückkommen. Das Glossar ist das, was die beiden Läufe übereinstimmen lässt.

Dann extrahieren und übersetzen:

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
ai-i18n-tools status
```

`extract` schreibt `strings.json` und `ui-languages.json`. `translate-ui` schreibt eine JSON-Datei pro Zielsprache unter `ui.flatOutputDir`. Lassen Sie diese generierten Dateien unbearbeitet. `sync` führt `extract` und `translate-ui` zusammen aus, wenn `features.translateUIStrings` aktiviert ist.

`T()` sucht den Quellsatz in der Locale-JSON. Die ID in `strings.json` ist nicht der Suchschlüssel. Eine fehlende Datei oder ein fehlender Schlüssel gibt den Quellsatz zurück, es sei denn, `I18n.Strict` ist gesetzt. `string.Format` läuft dann auf der übersetzten Vorlage. Ein ungültiges Format kann `FormatException` auslösen. Ein weggelassenes `{0}` kann das Argument weglassen. Nach einem Formatfehler gibt es keinen Rückgriff auf die Quellvorlage.

<a id="check-one-language"></a>
### Eine Sprache überprüfen

Starten Sie die App neu, wechseln Sie zu einer Zielsprache und öffnen Sie einen Bildschirm mit einigen umbrochenen Zeichenfolgen. Verwenden Sie den vom Agenten hinzugefügten Sprachwechsel, oder legen Sie beide Kulturen fest und rufen Sie `I18n.SetLocale` selbst auf. Text, der sich noch in der Ausgangssprache befindet, wurde nicht umbrochen, wurde vor `SetLocale` in ein Steuerelement kopiert oder hat keinen Eintrag in der Locale-JSON. Überprüfen Sie die JSON-Datei auf den Satz, bevor Sie den Code verdächtigen.

`SetLocale` durchläuft `CultureInfo.Parent`, bis ein Katalog geöffnet wird (`pt-BR` kann `pt.json` laden). Eingebettete Ressourcen werden verwendet, wenn weder `OpenLocale` noch `FlatDirectory` gesetzt ist. Eine konfigurierte `FlatDirectory` greift nicht auf eingebettete JSON zurück, wenn eine Datei fehlt.

Wenn der Start `locales/ui-languages.json` gefunden hat, ist `FlatDirectory` dieses Verzeichnis, sodass die Sätze, die Sie sehen, die Dateien sind, die `sync` gerade geschrieben hat. Verstecken Sie dieses Manifest und starten Sie erneut: Das Menü bietet nur die Ausgangssprache an, und Strings stammen aus den eingebetteten Ressourcen, die in den letzten Build integriert wurden. Ein installierter Build, der `sync` folgen sollte, muss `ui-languages.json` und das Locale-JSON neben der App ausliefern.

<a id="keep-it-translated"></a>
## Übersetzt halten

Führen Sie `ai-i18n-tools sync` (oder `extract` und dann `translate-ui`) erneut aus, nachdem Sie den Quelltext geändert haben. Der Cache bedeutet, dass nur neue oder geänderte Strings an das Modell gehen. Führen Sie es in CI aus, damit Übersetzungen nicht abweichen. Wenn `FlatDirectory` auf den `locales`-Ordner zeigt, starten Sie die App neu. Ein erneuter Build ist nur erforderlich, wenn das Manifest nicht gefunden wurde und die App immer noch eingebettetes JSON liest. `ai-i18n-tools dashboard` öffnet das [Übersetzungs-Dashboard](/de/guide/translation-dashboard/), um Übersetzungen zu überprüfen.

Um eine kopierte `I18n.cs` zu aktualisieren, erstellen Sie dieselbe Vorlage in einem temporären Verzeichnis und kopieren Sie nur die generierte Datei, die Sie ersetzen möchten. Führen Sie `init` in der App nicht erneut aus, um den Helper zu aktualisieren.

Um `README.md` im selben Durchlauf zu übersetzen, erstellen Sie ein Gerüst mit `--with-readme` (oder fügen Sie den Block zu einer bestehenden Konfiguration hinzu). Siehe [i18n zu Ihrer README und Markdown-Dokumentation hinzufügen](/de/guide/add-i18n-to-readme).

<a id="do-it-by-hand"></a>
## Machen Sie es manuell

Arbeiten Sie diese Schritte durch, wenn Sie die Änderungen lieber selbst vornehmen oder wissen möchten, was die Eingabeaufforderung bewirkt. Jeder Schritt entspricht einem Teil der Eingabeaufforderung. Sie [installieren die CLI](#install-and-choose-a-provider), [initialisieren das Projekt](#initialise-the-project) und [übersetzen](#choose-models-and-translate) am Ende trotzdem.

1. [Den Helper platzieren und die Kataloge einbetten](#step-1-place-the-helper-and-embed-the-catalogs).
2. [Zeichenfolgen umbrechen](#step-2-wrap-strings) in `T()`, `Tn`, `Tp`, `N` oder `{loc:Tr '…'}`.
3. [Umbrochene Aufrufe überprüfen](#step-3-check-wrapped-calls) mit `migrate-dotnet-i18n`.
4. [Einen Sprachwechsel hinzufügen](#step-4-add-a-language-switch).

<a id="step-1-place-the-helper-and-embed-the-catalogs"></a>
## Schritt 1: Den Helper platzieren und die Kataloge einbetten

`init` schreibt diese im Repository-Stammverzeichnis:

| Datei | Was es ist | Bearbeiten? |
| --- | --- | --- |
| `I18n.cs` | Der Helper, den Ihr Code aufruft (`T`, `Tn`, `Tp`, `SetLocale`) | Nein. Er wird generiert. `init` wird ihn nicht überschreiben |
| `locales/strings.json` | Der Extraktions-Cache. Die App liest ihn nie | Nein. `extract` schreibt ihn |
| `locales/<code>.json` | Die Übersetzungen, die die App lädt, eine Datei pro Sprache | Nein. `translate-ui` schreibt sie |
| `locales/ui-languages.json` | Das Sprachmenü. Die App liest `code`, `label` und `englishName` beim Start | Nein. `extract` schreibt es |

Verschieben Sie `I18n.cs` und `locales/` in das Anwendungsprojekt. Fügen Sie die Einbettung zu diesem `.csproj` hinzu und lassen Sie den Rest der Datei unverändert:

```xml
<ItemGroup>
  <EmbeddedResource Include="locales/*.json" />
</ItemGroup>
```

Der Include-Pfad ist relativ zur Projektdatei. .NET Framework 4.8 benötigt auch das Paket `System.Text.Json`. .NET 6 oder neuer hat es bereits.

Aktualisieren Sie die Konfiguration an den neuen Speicherort und richten Sie `sourceRoots` auf das Anwendungsprojekt aus, damit Tests und Build-Ausgaben nicht im Katalog landen:

```json
{
  "ui": {
    "sourceRoots": ["src/MyApp"],
    "stringsJson": "src/MyApp/locales/strings.json",
    "flatOutputDir": "src/MyApp/locales"
  }
}
```

Fügen Sie `global using static MyApp.I18n;` hinzu (verwenden Sie den in `I18n.cs` ausgegebenen Namespace) oder rufen Sie `I18n.T` an jeder Stelle auf.

`SourceLocale` im Helper muss `sourceLocale` in der Konfiguration entsprechen. `BuiltInLocales`, zwischen den `ai-i18n-tools-locales`-Markierungen, ist die Liste, die `init` gestempelt hat. Es ist nicht das Menü. Nachdem Sie `targetLocales` geändert haben, schreibt `extract` `ui-languages.json` neu, und die App liest diese Datei. Scaffolden Sie ein temporäres Verzeichnis, wenn Sie einen neuen Helper benötigen. Führen Sie `init` hier nicht erneut aus.

Bestätigen Sie mit `ai-i18n-tools extract`. Der Katalog sollte im neuen Ordner `locales/` erscheinen. Erwarten Sie 0 Zeichenfolgen, bis etwas umbrochen wird.

<a id="step-2-wrap-strings"></a>
## Schritt 2: Zeichenketten umschließen

`extract` zeichnet eine Zeichenfolge nur dann auf, wenn sie ein Literal ist, das an `T()`, `Tn`, `Tp`, `N` oder `{loc:Tr '…'}` übergeben wird. Ein Empfänger wie `I18n.T` stimmt überein, weil der Nachname `T` ist.

Suchen Sie zuerst den Katalogeintrag und übergeben Sie das Ergebnis dann an `string.Format`:

```csharp
T("Sign in")
T("Saved to {0}", path)
Tn("1 sample", "{0} samples", count)
Tp("menu", "Open")
N("Light")
```

Diese werden extrahiert und dann abgelehnt, da der Katalog nicht mit dem übereinstimmen würde, was das Programm nachschlägt:

```csharp
T($"Saved to {path}")
T("Last synced " + when)
T(variable)
T("Hello {name}")
```

`extract` gibt eine Warnung für die ersten drei aus und stoppt bei `{name}`. Der [nächste Schritt](#step-3-check-wrapped-calls) schreibt die ersten drei neu.

Platzhalter bleiben im .NET-Format: `{0}`, `{0,-10}`, `{0:C}`. `%` ist gewöhnlicher Text, daher ist eine Übersetzung wie `10% off` kein Printf-Token. Doppelte geschweifte Klammern (<code v-pre>{{</code> und `}}`) sind Literal-Klammern und müssen unverändert kopiert werden. Weitere Aufruf-Formen: [Aufrufe, die übersetzen](/de/guide/ui-strings/dotnet#calls-that-translate).

XAML und AXAML:

```xml
<TextBlock Text="{loc:Tr 'Sign in'}" />
```

Das Präfix wird ignoriert. `{Binding}` und `{StaticResource}` bleiben unverändert. Als Elementinhalt geschriebener Text wird nicht extrahiert. Ein Literal, das ein Apostroph enthält, wird mit `&quot;` geschrieben, damit das Attribut in doppelten Anführungszeichen bleiben kann.

Avalonia, WPF und MAUI stellen jeweils ihre eigene `MarkupExtension`-Basisklasse bereit. Der Helper referenziert diese Assemblies nicht. `ProvideValue` gibt `I18n.T(Text)` zurück und setzt diese Eigenschaft erneut auf `LocaleChanged`, dann meldet es sich ab, wenn das Steuerelement den visuellen Baum verlässt. Eine Avalonia-Form (`IProvideValueTarget` ist in `Avalonia.Metadata`):

```csharp
public sealed class TrExtension : MarkupExtension
{
    public TrExtension(string text) { Text = text; }
    public string Text { get; }

    public override object ProvideValue(IServiceProvider serviceProvider)
    {
        var text = I18n.T(Text);
        if (serviceProvider.GetService(typeof(IProvideValueTarget)) is IProvideValueTarget target
            && target.TargetObject is AvaloniaObject control
            && target.TargetProperty is AvaloniaProperty property)
        {
            void Refresh() => control.SetValue(property, I18n.T(Text));
            I18n.LocaleChanged += Refresh;
            if (control is StyledElement element)
            {
                element.DetachedFromVisualTree += (_, _) => I18n.LocaleChanged -= Refresh;
            }
        }
        return text;
    }
}
```

WPF und MAUI tun dasselbe mit ihren eigenen Eigenschaftstypen. Fügen Sie `**/TrExtension.cs` zu `ui.uiExtractor.exclude` hinzu. `T(Text)` ist kein Literal, und die XAML-Literale werden bereits durch `Tr` extrahiert. `{loc:Tr}` kann nur `T` aufrufen. Zwei Bedeutungen eines kurzen Wortes werden im Code mit `Tp` festgelegt.

Formatierte Sätze bleiben in C# (`T("Cursor {0}", value)`), was den Extractor auf einem einzelnen Literal hält. `StringFormat` an einem Binding ist für `extract` unsichtbar. Derselbe Aufruf funktioniert von einem View Model, einem Tray-Tooltip und einem Dialog aus. Lösen Sie `PropertyChanged` von `LocaleChanged` für View-Model-Strings aus.

Ein Wert, der sowohl gespeichert als auch angezeigt wird, behält den gespeicherten Wert in der Ausgangssprache. Eine Enum-Kombination behält die Enum und gibt `T("Light")` aus ihrer Beschriftung zurück, dann baut sie die Elemente bei `LocaleChanged` neu auf. `N("Last 12 months")` existiert, damit ein statisches Feld ein Literal aufnehmen kann, das der Extraktor sieht. `T()` in einem statischen Wörterbuch wird einmal beim ersten Laden des Typs ausgeführt und bleibt bei dieser Sprache. Ein Dienst speichert den englischen Fehlersatz. Die Anzeigeseite ordnet bekannte Sätze über `T` zu, sodass eine spätere Gebietsänderung sie übersetzen kann. `T()` beim Fehler friert diesen Satz ein.

Ein Tray-Element verwendet `Tp("tray", "Open")` und ein stabiles `CommandParameter`. Den Parameter abgleichen, nicht den Header. Linux `.desktop` `Name=` und `Comment=` bleiben in der Ausgangssprache. Dauer-Tokens, die verglichen werden (`2d`, `7h 47m`), bleiben unübersetzt. Übersetzen Sie `T("now")` und `T("in {0}", duration)`, wo der Text angezeigt wird. Ein Literal mit einem führenden oder nachgestellten Leerzeichen (`Updated: `) ist immer noch eine Extraktionswarnung. Verschieben Sie das Leerzeichen in den Formatstring oder das Layout. `Tn` kann einen Ausgangssatz ändern, der immer im Plural stand (`1 samples`).

Lassen Sie diese unverändert: Protokolle, JSON-Eigenschaftsnamen, Dateinamen, `nameof`, Attributargumente, als Bezeichner verwendete Objektschlüssel und Ausnahmetext, den das Programm abgleicht, anstatt ihn anzuzeigen.

Führen Sie `ai-i18n-tools extract` erneut aus. Der Katalog sollte nun die von Ihnen umwickelten Sätze auflisten.

<a id="step-3-check-wrapped-calls"></a>
## Schritt 3: Umschlossene Aufrufe prüfen

Verwenden Sie diesen Schritt, wenn ein Aufruf die Zeichenfolge vor der Katalogsuche formatiert:

```csharp
T($"Saved to {path}")
T("Last synced " + date)
T(string.Format("Hello {0}", name))
```

`migrate-dotnet-i18n` schreibt diese in eine Suche um, die zuerst stattfindet. Ein zweiter Durchlauf ändert nichts.

```csharp
T("Saved to {0}", path)
T("Last synced {0}", date)
T("Hello {0}", name)
```

Der Befehl ist ein Probelauf, bis Sie `--write` übergeben. Er schreibt `migrate-dotnet-i18n-report.md`. Lesen Sie diesen Bericht. Wenn die Bearbeitungen richtig aussehen:

```bash
ai-i18n-tools migrate-dotnet-i18n --write
ai-i18n-tools extract
```

Führen Sie den Probelauf erneut aus. Halten Sie an, wenn keine Bearbeitungen aufgeführt sind, und führen Sie dann die Tests des Projekts aus. An Ort und Stelle belassene Zeilen (`await`, ein roher interpolierter Rohstring, eine bedingte Lücke, `ref` oder `out`, eine Verkettung ohne Literal, ein an `string.Format` übergebenes `IFormatProvider`) werden manuell korrigiert. Eine Phrase, die wie ein Plural aussieht, gehört in `Tn`, was einen Ausgangssatz korrigieren kann, der immer im Plural stand. Generiertes `I18n.cs` wird übersprungen. Löschen Sie den Bericht oder ignorieren Sie ihn mit Git.

`--wrap` markiert auch unmarkiertes XAML `Text`, `Header`, `Content` und die anderen Beschriftungsattribute als `{loc:Tr '…'}`, plus C#-Zuweisungen, deren Name auf `Text`, `Title` oder `Message` endet, und `MessageBox.Show`. Ohne `--write` ist das ein Audit. Es bearbeitet keine Protokolle, Attribute, `nameof`, Vergleiche oder `Path`-Aufrufe.

Ein Bericht ohne Bearbeitungen bedeutet, dass die umschlossenen Aufrufe sicher sind. Das bedeutet nicht, dass jeder benutzeroberflächennahe Satz umschlossen wurde. Einzelne Bezeichnungen, zurückgegebene Zeichenfolgen und Elementinhalte sind für ihn unsichtbar. Details: [Unsichere Aufrufe umschreiben](/de/guide/ui-strings/dotnet#rewrite-unsafe-calls).

<a id="step-4-add-a-language-switch"></a>
## Schritt 4: Sprachumschalter hinzufügen

Vor dem ersten `T()` finden Sie `locales/ui-languages.json`. Suchen Sie aufwärts von `AppContext.BaseDirectory`, dann vom aktuellen Verzeichnis aus, jeweils maximal 8 Verzeichnisse. Die erste Datei gewinnt. Parsen Sie `code`, `label` und `englishName` in `LocaleInfo` (`label` ist `NativeName`). Rufen Sie `Configure` einmal mit diesem Array als `Locales` und mit `FlatDirectory` auf, das auf das `locales`-Verzeichnis gesetzt ist, das die Datei enthielt. `Configure` ersetzt `Strict`, `FlatDirectory` und `OpenLocale` bei jedem Aufruf. Ein späterer Aufruf, der nur `Locales` setzt, löscht `FlatDirectory`. `Locales: null` stellt die vorherige Liste nicht wieder her.

Wenn die Datei fehlt, übergeben Sie ein ein-elementiges `Locales`-Array für die Ausgangssprache und setzen Sie `FlatDirectory` nicht. Das Menü ist nur in der Ausgangssprache. Zeigen Sie `BuiltInLocales` nicht an. Die Entwicklung liest dann die Kataloge, die `sync` gerade geschrieben hat. Ein veröffentlichter Build ohne Manifest in der Nähe behält die eingebetteten Kataloge. Ein Installer, der `sync` folgen soll, liefert `ui-languages.json` und das Locale-JSON neben der App aus.

Speichern Sie den Gebietsschema-Code, nicht den nativen Namen. Setzen Sie beide Kulturen vor `SetLocale`, da `LocaleChanged` innerhalb dieses Aufrufs ausgelöst wird:

```csharp
var culture = CultureInfo.GetCultureInfo(code);
CultureInfo.CurrentUICulture = culture;
CultureInfo.CurrentCulture = culture;
I18n.SetLocale(code);
```

Beschriften Sie das Steuerelement mit `T("Language")`. Akzeptieren Sie nur Codes aus der übergebenen Liste. Bei `LocaleChanged` lösen Sie `PropertyChanged` für View-Model-Strings aus oder bauen Steuerelemente neu auf, die ihren Text kopiert haben. `TrExtension` aktualisiert die offene Ansicht, wie in [Schritt 2](#step-2-wrap-strings). Wenn das Framework eine Flussrichtung hat, setzen Sie diese von `I18n.IsRightToLeft(code)`.

Avalonia: Ignorieren Sie `SelectionChanged`, es sei denn, `e.Source` ist das Steuerelement, das den Handler besitzt. Weisen Sie `ItemsSource` oder `SelectedItem` nicht innerhalb dieses Handlers zu, oder innerhalb eines `LocaleChanged`, das das `SetLocale` dieser Kombination ausgelöst hat. Posten Sie die Aktualisierung mit `Dispatcher.UIThread.Post`. Schützen Sie den Handler, während Code `SelectedItem` setzt. Ein übergeordnetes `TabControl`, das das gebubbelte Ereignis als Tab-Wechsel behandelt und `ItemsSource` erneut zuweist, lässt den Prozess abstürzen (Exit-Code 139, leeres `crash.log`).

Ein Konsolenprogramm hat kein Widget. Fügen Sie `--lang <code>` hinzu (und `-L`, wenn dieser Name frei ist). Akzeptieren Sie nur Codes aus der oben geladenen Liste. Lesen Sie `AI_I18N_LANG` nicht. Diese Variable ist nur für die ai-i18n-tools CLI.

Überspringen Sie diesen Schritt, wenn das Programm keinen Text anzeigt, den eine Person liest.

Der Katalog und das aktuelle Gebietsschema sind statisch. Das ist sicher für einen Desktop-Prozess. Es ist kein pro-Anfrage-Gebietsschema für einen Mehrbenutzer-Server. Behalten Sie `IStringLocalizer` oder `ResourceManager` dort und folgen Sie [i18n zu einer .NET ResourceManager-App hinzufügen](/de/guide/add-i18n-to-dotnet-resourcemanager). Das Festlegen von `CurrentUICulture` gibt nicht jeder Anfrage eine eigene Zuordnung.

Das ist der letzte manuelle Schritt. Fahren Sie fort unter [Modelle auswählen und übersetzen](#choose-models-and-translate).

<a id="not-your-case"></a>
## Nicht Ihr Fall?

| Ihr Code heute | Lesen |
| --- | --- |
| `ResourceManager`, `.resx` Satelliten oder ASP.NET `IStringLocalizer` | [i18n zu einer .NET ResourceManager-App hinzufügen](/de/guide/add-i18n-to-dotnet-resourcemanager) |
| Bereits `T("…")` mit dem Ausgangssprachen-Satz | [UI-Strings](/de/guide/ui-strings/) Schritte 2–3 und [.NET-Anwendungen](/de/guide/ui-strings/dotnet) |
| Eine JS/TS-App | [i18n zu einer JS/TS-App hinzufügen](/de/guide/add-i18n-to-js) |
| Eine Python-App | [i18n zu einer Python-App hinzufügen](/de/guide/add-i18n-to-python) |
| Django, Flask-Babel-Kataloge oder GNU gettext | [i18n zu einer Django-/Python-gettext-App hinzufügen](/de/guide/add-i18n-to-django-gettext) |
| Eine Website oder Dokumentationsseite | [i18n zu einer Website oder Dokumentationsseite hinzufügen](/de/guide/add-i18n-to-website) |
| Eine Repository-README oder andere Markdown-Dateien | [i18n zu Ihrer README und Markdown-Dokumentation hinzufügen](/de/guide/add-i18n-to-readme) |

<a id="examples"></a>
## Beispiele

| Beispiel | Was es zeigt |
| --- | --- |
| [dotnet-console](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/dotnet-console) | xUnit-Prüfungen von `I18n.cs`: eingebettetes JSON, Kultur-Fallback, `{0}`, Pluralformen und `Configure` |

Diese Verzeichnisse prüfen den Helfer. Dies sind keine zu übersetzenden Apps und sie benötigen keinen API-Schlüssel. `dotnet test` in diesem Verzeichnis führt die Prüfungen aus. Eine echte App beginnt mit `init` auf dieser Seite. Kopieren Sie eine mit `npx degit`, oder laden Sie `ai-i18n-tools-dotnet-examples.zip` vom GitHub Release herunter. Dieses Zip enthält auch `assets/dotnet`, das das Projekt kompiliert. Befehle: [Beispiele](/de/examples#net-examples).
