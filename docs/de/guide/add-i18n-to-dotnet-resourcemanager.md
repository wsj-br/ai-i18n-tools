<a id="add-i18n-to-a-net-resourcemanager-app"></a>
# i18n zu einer .NET ResourceManager-App hinzufügen

Diese Seite ist für eine .NET-Anwendung, die bereits Zeichenfolgen mit `ResourceManager` oder ASP.NET `IStringLocalizer` lädt oder dies in Zukunft tun wird. Sie behalten diesen Loader bei. ai-i18n-tools liest `T("…")` und `{loc:Tr '…'}`, übersetzt die Nachrichten und schreibt `.resx`-Satelliten, deren Schlüssel diese Quellzeichenfolgen sind. Der Helfer ist `I18nResx.cs`, kopiert von `init -t ui-dotnet-resx`.

Der schnellste Weg ist, einem Coding-Agenten die Aufforderung auf dieser Seite zu geben. Er richtet die Konfiguration auf Ihre Ressourcen aus, umschließt Ihre Zeichenfolgen, überprüft das Ergebnis und kann einen Sprachumschalter hinzufügen. Sie installieren die CLI, wählen den Anbieter und initialisieren das Projekt selbst, da dies Ihren API-Schlüssel und Ihre Entscheidungen erfordert. Sie führen die Übersetzung auch selbst aus, da sie Geld auf Ihrem Konto ausgibt und Ihre `.resx`-Dateien neu schreibt.

Eine neue Avalonia-, WPF-, MAUI-, WinForms- oder Konsolen-App ohne Ressourcendateien verwendet [i18n zu einer .NET-App hinzufügen](/de/guide/add-i18n-to-dotnet). Dieser Pfad fügt `I18n.cs` und eingebettetes JSON hinzu. Sie sind sich nicht sicher, was zutrifft? Siehe [Nicht Ihr Fall?](#not-your-case) am Ende.

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

Sie führen dies einmal aus, vor der Aufforderung. Es schreibt die Konfiguration und `I18nResx.cs`, und es verwendet den Anbieter, den Sie oben gewählt haben.

```bash
ai-i18n-tools init -t ui-dotnet-resx -P openrouter
```

Übergeben Sie `--namespace`, wenn der Projekt-Namespace nicht derjenige ist, den `init` in `I18nResx.cs` ausgibt. Mit einer `.csproj` im Verzeichnis und keiner `--namespace` verwendet `init` den `RootNamespace` dieser Datei oder den Projektdateinamen. Andernfalls ist der Namespace `AiI18n`.

Die Vorlage setzt `ui.flatOutput` auf false und `ui.resx` auf:

| Feld | Standard |
| --- | --- |
| `outputDir` | `Resources` |
| `baseName` | `SharedResource` |
| `writeNeutral` | true, sodass `SharedResource.resx` den Quelltext enthält |
| `localeFormat` | `bcp47`, sodass die deutsche Datei `SharedResource.de.resx` und brasilianisches Portugiesisch `SharedResource.pt-BR.resx` ist |
| `ingestExistingResx` | true |

`init` schreibt `I18nResx.cs`, wenn diese Datei fehlt. `ResourceBaseName` ist der Namespace, der Ausgabeordner und der Basisname, verbunden mit Punkten (`MyApp.Resources.SharedResource`). Das SDK bettet eine Resx unter diesem Manifestnamen ein, wenn die Datei in diesem Ordner liegt. Wenn Sie die Dateien verschieben, ändern Sie `ResourceBaseName` entsprechend. `init` bearbeitet die `.csproj` nicht. Satelliten-Assemblies werden aus `*.{culture}.resx` beim Build erstellt. Stellen Sie diese Satelliten neben der App bereit.

Führen Sie `init` einmal aus. Es schreibt `ai-i18n-tools.config.json` jedes Mal neu, sodass ein zweiter Durchlauf von Ihnen vorgenommene Änderungen verwirft. Wenn `I18nResx.cs` bereits den Marker `ai-i18n-tools-i18n-cs` enthält, ist das Projekt bereits initialisiert: Überspringen Sie diesen Schritt. `init` überschreibt keinen vorhandenen Helfer.

Bearbeiten Sie dann `sourceLocale` und `targetLocales`. `sourceLocale` ist die Sprache der Zeichenfolgen in der Quelle. Jede BCP-47-Sprache ist gültig; das Scaffold verwendet `en`. Richten Sie `ui.resx` auf den Ordner und den Basisnamen aus, die Ihre App bereits lädt (manuell, das ist [Schritt 1](#step-1-point-the-config-at-your-resources)). `neutralFile` ist die neutrale Resx, die einen Legacy-Namen wie `LoginButton` ihrem Quelltext zuordnet. Wenn sie weggelassen wird, wird `{outputDir}/{baseName}.resx` verwendet, wenn diese Datei existiert.

Derselbe `ui`-Block kann auch flaches JSON schreiben. Setzen Sie `flatOutput` wieder auf true. Beide Ausgaben teilen sich einen Katalog. Diese Vorlage lässt `flatOutput` auf false, sodass nur `.resx` geschrieben wird.

Aufruf-Shapes und der JSON-Helfer: [.NET-Anwendungen](/de/guide/ui-strings/dotnet). Jeder andere Konfigurationsschlüssel: [Konfiguration](/de/reference/configuration).

<a id="run-the-agent-prompt"></a>
## Agent-Prompt ausführen

Öffnen Sie das Projekt in Ihrem Coding-Agenten (Cursor, Claude Code, Copilot oder ähnlich), starten Sie einen neuen Chat und fügen Sie den unten stehenden Prompt ein. Das Projekt muss bereits initialisiert sein. Es gibt nichts zu bearbeiten. Wenn Sie etwas weglassen möchten, zum Beispiel keinen Sprachumschalter, geben Sie dies in derselben Nachricht an.

Der Agent prüft zuerst, ob die CLI, die Konfiguration und `I18nResx.cs` existieren, und stoppt mit Anweisungen, falls eines fehlt. Dann arbeitet er in drei Teilen:

- Teil 1 richtet `ui.resx` auf die Kataloge aus, die die App bereits lädt, und prüft `ResourceBaseName`.
- Teil 2 umschließt benutzerorientierte Zeichenfolgen in `T()` und `{loc:Tr '…'}` und wendet Vorschläge für benannte Schlüssel manuell an.
- Teil 3 fügt einen Sprachumschalter hinzu, der auf `ResourceManager` oder `IStringLocalizer` bleibt.

Es installiert oder initialisiert nichts, liest Ihren API-Schlüssel nicht und übersetzt nicht. Es schreibt keine `.resx`-Dateien neu. Die Übersetzung ist der Schritt nach der Überprüfung, und Sie führen sie aus.

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
  pattern, run `ai-i18n-tools doctor --fix-gitignore`. That appends a blank
  line, `# ai-i18n-tools doctor fix`, and only the missing lines. Keep the
  negation so `cache.db` stays tracked.
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
## Ergebnis überprüfen

Der Agent schließt mit einem Bericht ab. Überprüfen Sie ihn, bevor Sie übersetzen:

- Der Diff. Umschlossene Aufrufe, die Konfiguration, `ResourceBaseName`, falls die Dateien verschoben wurden, und der Sprachumschalter sollten sich geändert haben. Ihre `.resx`-Dateien sollten unberührt bleiben, bis Sie übersetzen.
- `ai-i18n-tools.config.json`: `resx.outputDir` und `baseName` zeigen auf die Kataloge, die Ihre App lädt, und `sourceRoots` deckt das Anwendungsprojekt ab.
- `ResourceBaseName` stimmt mit dem Manifestnamen überein, den das SDK einbetten wird.
- `ai-i18n-tools extract` listet die neuen Nachrichten auf und behält Übersetzungen bei, die bereits in den Satelliten vorhanden sind.
- Der Probelauf von `migrate-dotnet-i18n` listet nichts mehr auf, was behoben werden müsste, außer Vorschläge für benannte Schlüssel, die Sie aufgeschoben haben. Diese Zeilen bleiben `Resources.LoginButton`, bis Sie sie bearbeiten.
- Ihre Tests bestehen, und die App sieht in der Ausgangssprache gleich aus.
- Es wurde kein Wegwerfskript oder `migrate-dotnet-i18n-report.md` zurückgelassen.

Übernehmen Sie diesen Zustand. `translate-ui` schreibt Ihre `.resx`-Dateien neu, daher möchten Sie einen sauberen Diff zur Überprüfung.

<a id="choose-models-and-translate"></a>
## Modelle auswählen und übersetzen

Diesen Teil führen Sie aus. Er verwendet Ihren API-Schlüssel, verbraucht Geld auf Ihrem Konto und schreibt Ihre `.resx`-Dateien neu, also committen Sie zuerst.

Die Modellliste von `init` ist ein Ausgangspunkt. Bewerten Sie die Chat-Modelle des aktiven Anbieters und schreiben Sie die Auswahl in `translationModels`, sobald die engere Auswahl korrekt aussieht:

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` ersetzt nur `translationModels`. Dieselbe Rangfolge finden Sie auf der Registerkarte [Modelle](/de/guide/translation-dashboard/models) von `ai-i18n-tools dashboard`.

Füllen Sie das Glossar vor dem ersten `translate-ui`. `init` verweist `glossary.userGlossary` auf `glossary-user.csv` und erstellt die Datei nicht. Wenn die Datei fehlt, führen Sie `ai-i18n-tools glossary-generate` aus und fügen Sie dann Domänenbegriffe hinzu. Verwenden Sie **Force** für Namen, die unverändert kopiert werden müssen.

Dann extrahieren und übersetzen:

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
ai-i18n-tools status
```

`translate-ui` schreibt die neutrale Datei und eine Satelliten-Datei pro Zielsprache. Schlüssel sind die Quellzeichenfolgen. Die `<comment>` zeichnet den Kontext und den ersten Quellspeicherort auf. Eine manuelle Bearbeitung in einer Satelliten-Datei wird nur beibehalten, wenn `extract` sie vor der nächsten Übersetzung aufnimmt, derselbe Vertrag wie bei `.po`-Dateien. Lassen Sie die generierten Dateien von nun an unbearbeitet, da der nächste Lauf sie neu generiert. Überprüfen Sie den ersten Diff, bevor Sie ihn committen.

Einträge mit einem `type` oder `mimetype` (Bilder und andere Binärdateien) werden übersprungen. `ResourceManager.GetString` gibt den neutralen Wert zurück, wenn diese Kultur keinen Eintrag hat.

Erstellen Sie neu, damit das SDK die neuen Satelliten-Dateien einbettet, und starten Sie dann die App neu.

<a id="check-one-language"></a>
### Eine Sprache überprüfen

Wechseln Sie zu einer Zielsprache und öffnen Sie einen Bildschirm mit einigen umbrochenen Zeichenfolgen. Text, der noch in der Ausgangssprache ist, wurde nicht umbrochen, verwendet immer noch einen benannten Schlüssel, der nicht angewendet wurde, oder die Satelliten-Datei wurde nicht neu erstellt. Eine Übersetzung, die `{0}` weglässt oder umbenennt, kann `FormatException` auslösen oder den Wert weglassen. `string.Format` greift nicht auf die Quellvorlage zurück. Überprüfen Sie die Satelliten-Datei für diesen Satz, bevor Sie den Code verdächtigen.

<a id="keep-it-translated"></a>
## Übersetzt halten

Führen Sie `ai-i18n-tools sync` (oder `extract` und dann `translate-ui`) erneut aus, nachdem Sie den Quelltext geändert haben. Der Cache bedeutet, dass nur neue oder geänderte Zeichenfolgen an das Modell gesendet werden. Führen Sie es in CI aus, damit Übersetzungen nicht abweichen. Erstellen Sie nach einem Übersetzungslauf neu, damit die Satelliten-Dateien wieder eingebettet werden. `ai-i18n-tools dashboard` öffnet das [Übersetzungs-Dashboard](/de/guide/translation-dashboard/), um Übersetzungen zu überprüfen.

`purge-locale` löscht `SharedResource.<culture>.resx` und belässt `SharedResource.resx`.

Um eine kopierte `I18nResx.cs` zu aktualisieren, erstellen Sie dieselbe Vorlage in einem temporären Verzeichnis und kopieren Sie nur die generierte Datei, die Sie ersetzen möchten. Führen Sie `init` in der App nicht erneut aus, um den Helfer zu aktualisieren.

Um `README.md` im selben Durchlauf zu übersetzen, erstellen Sie ein Gerüst mit `--with-readme` (oder fügen Sie den Block zu einer bestehenden Konfiguration hinzu). Siehe [i18n zu Ihrer README und Markdown-Dokumentation hinzufügen](/de/guide/add-i18n-to-readme).

<a id="do-it-by-hand"></a>
## Machen Sie es manuell

Arbeiten Sie diese Schritte durch, wenn Sie die Änderungen lieber selbst vornehmen oder wissen möchten, was die Eingabeaufforderung bewirkt. Jeder Schritt entspricht einem Teil der Eingabeaufforderung. Sie [installieren die CLI](#install-and-choose-a-provider), [initialisieren das Projekt](#initialise-the-project) und [übersetzen](#choose-models-and-translate) am Ende trotzdem.

1. [Konfiguration auf Ihre Ressourcen verweisen](#step-1-point-the-config-at-your-resources).
2. [Zeichenfolgen umbrechen](#step-2-wrap-strings) in `T()` oder `{loc:Tr '…'}`.
3. [Benannte Ressourcenschlüssel anwenden](#step-3-apply-named-resource-keys).
4. [Sprache zur Laufzeit wechseln](#step-4-switch-language-at-runtime).

<a id="step-1-point-the-config-at-your-resources"></a>
## Schritt 1: Konfiguration auf Ihre Ressourcen verweisen

Die Vorlage schreibt diese Form. Ändern Sie den Ordner und den Basisnamen in die Kataloge, die Ihre App bereits lädt:

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

Überprüfen Sie vier Punkte in Bezug auf Ihr Projekt:

- `outputDir` und `baseName` sind die Orte, an denen die neutrale Datei und die Satelliten-Dateien bereits liegen. Deutsch ist `SharedResource.de.resx`. Brasilianisches Portugiesisch ist `SharedResource.pt-BR.resx`, wenn `localeFormat` `bcp47` ist.
- `neutralFile` wird gesetzt, wenn diese neutrale Datei nicht `{outputDir}/{baseName}.resx` ist. Die Aufnahme ordnet einen alten Namen (`LoginButton`) über den neutralen Wert (`Sign in`) zu. Der deutsche `LoginButton`-Wert wird dann unter der Quellzeichenfolge `Sign in` gespeichert.
- `ResourceBaseName` in `I18nResx.cs` ist der Namespace, der Ausgabeordner und der Basisname, verbunden mit Punkten. Verschieben Sie die Konstante, wenn sich die Dateien verschieben. Lassen Sie den Rest des Helfers unverändert.
- `sourceRoots` ist das Anwendungsprojekt, nicht `"."`.

Der Resx-Name einer einfachen Zeichenfolge ist der Quelltext: `Sign in`, `Saved to {0}`, ein Wert, der ein Anführungszeichen oder ein Et-Zeichen enthält. Der Kontext verwendet U+2404 zwischen Kontext und Quelle. Resx hat keine Pluralformen. Jede CLDR-Form ist ein eigener Eintrag, benannt `{singular}[{form}]`. `Tn` wählt die Form mit denselben Regeln wie der `.po`-Writer. Sie geben das Trennzeichen oder den Pluralsuffix nicht ein.

Bestätigen Sie mit `ai-i18n-tools extract`. Der Katalog sollte Zeichenfolgen auflisten, die aus der neutralen Datei aufgenommen wurden.

<a id="step-2-wrap-strings"></a>
## Schritt 2: Zeichenketten umschließen

`extract` zeichnet eine Zeichenfolge nur auf, wenn es sich um ein Literal handelt, das an `T()`, `Tn`, `Tp`, `N` oder `{loc:Tr '…'}` übergeben wird. Es gelten dieselben Formen wie beim [JSON-Helfer](/de/guide/add-i18n-to-dotnet#step-2-wrap-strings). Platzhalter sind `{0}`, nicht `{name}`.

```csharp
T("Sign in")
T("Saved to {0}", path)
Tn("1 sample", "{0} samples", count)
Tp("menu", "Open")
```

`IStringLocalizer` sucht den übergebenen Namen und gibt diesen Namen zurück, wenn die Ressource fehlt. Die Standard-Extraktornamen sind `T`, `Tn`, `Tp`, `N`, `Tr` und `Loc`. Ein Aufruf wie `_localizer["Sign in"]` ist unsichtbar, bis `_localizer` zu `ui.uiExtractor.funcNames` hinzugefügt wird. Der Aufruf von `T("Sign in")` oder `I18nResx.T("Sign in")` erfordert keinen zusätzlichen Namen.

XAML verwendet `{loc:Tr '…'}`. Elementinhalte werden nicht extrahiert. Lassen Sie `{Binding}` und `{StaticResource}` unverändert.

Lassen Sie Protokolle, JSON-Schlüssel, Dateinamen, `nameof` und nicht angezeigten Ausnahmetext unverändert. Ein gespeicherter Wert bleibt in der Ausgangssprache. Übersetzen Sie die Beschriftung am Steuerelement.

Unsichere Aufrufe (`T($"…")`, Verkettung, `string.Format` innerhalb von `T`) sind der Bericht des nächsten Schritts, zusammen mit Legacy-Namen wie `Resources.LoginButton`.

<a id="step-3-apply-named-resource-keys"></a>
## Schritt 3: Benannte Ressourcenschlüssel anwenden

`migrate-dotnet-i18n` ist ein Probelauf, bis Sie `--write` übergeben. Es schreibt Argumente von `T` um, die vor der Suche erstellt wurden, dieselben Bearbeitungen wie [Umschlossene Aufrufe prüfen](/de/guide/add-i18n-to-dotnet#step-3-check-wrapped-calls).

Wenn `extract` ein neutrales `.resx` aufgenommen hat, erhält der Bericht auch einen Abschnitt für benannte Schlüssel:

```text
- MainWindow.axaml.cs:40 Resources.LoginButton → T("Sign in")
```

Diese Liste ist für Sie zur Anwendung. Der Befehl bearbeitet diese Zeilen nicht. `--write` auch nicht. Nachdem Sie einen Aufruf in `T("Sign in")` geändert haben, führen Sie `extract` erneut aus.

```bash
ai-i18n-tools extract
ai-i18n-tools migrate-dotnet-i18n
```

Lesen Sie `migrate-dotnet-i18n-report.md`. Wenn die Bearbeitungen der unsicheren Aufrufe korrekt aussehen:

```bash
ai-i18n-tools migrate-dotnet-i18n --write
ai-i18n-tools extract
```

Führen Sie den Probelauf erneut aus. Halten Sie an, wenn keine Bearbeitungen unsicherer Aufrufe aufgeführt sind. Benannte Schlüssel, die Sie noch nicht angewendet haben, bleiben in der Vorschlagsliste. Löschen Sie den Bericht oder ignorieren Sie ihn mit Git. Bearbeiten Sie die `.resx`-Dateien in diesem Schritt nicht.

<a id="step-4-switch-language-at-runtime"></a>
## Schritt 4: Sprache zur Laufzeit wechseln

`T` liest `CultureInfo.CurrentUICulture`. `I18nResx.SetLocale` legt diese Kultur und `CurrentCulture` fest und löst dann `LocaleChanged` aus. Das für `Tn` gespeicherte Gebietsschema ist statisch, daher sollte ein Server, der gleichzeitige Anfragen verarbeitet, `SetLocale` nicht als benutzerspezifischen Schalter verwenden.

<a id="aspnet-core"></a>
### ASP.NET Core

`IStringLocalizer` ist anforderungsbezogen. Verweisen Sie es auf die von dem Tool geschriebene Resx-Datei. Die leere Klasse ist nur das Typargument. Der Basisname des Manifests muss mit `ResourceBaseName` übereinstimmen.

```csharp
builder.Services.AddLocalization(options => options.ResourcesPath = "Resources");

public sealed class SharedResource
{
}
```

Rufen Sie auf einer Razor-Seite oder in einem Dienst `T` auf, damit `extract` das Literal sieht. Behalten Sie ein vorhandenes `IStringLocalizer<SharedResource>` bei, wenn eine Aufrufstelle es bereits verwendet. Fügen Sie den Namen dieses Empfängers zu `ui.uiExtractor.funcNames` hinzu, wenn die Suche auf dem Indexer bleibt.

```csharp
public string Label => T("Sign in");
```

`IStringLocalizer` hat keinen Plural- oder Kontextparameter. Eine Erweiterung kann `I18nResx` aufrufen, das dieselben Satelliten liest. Fügen Sie es dem ASP.NET-Projekt hinzu. `I18nResx.cs` verweist nicht auf `Microsoft.Extensions.Localization`, daher benötigt ein Konsolen- oder Desktop-Projekt dieses Paket nicht.

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

Wählen Sie die Anforderungskultur in dieser Reihenfolge: die explizite Wahl des Besuchers (`?lang=` oder ein Formular-Post), das Cookie, das sie speichert, der `Accept-Language`-Header, dann das Quellgebietsschema. Ignorieren Sie Codes, die nicht in `sourceLocale` oder `targetLocales` enthalten sind. `pt-BR` ist der Satellitenname. Ein Header, der `pt-br` sendet, muss immer noch mit diesem Namen abgeglichen werden, bevor Sie `CurrentUICulture` zuweisen.

<a id="desktop-and-console"></a>
### Desktop und Konsole

Stellen Sie die gespeicherte Kultur wieder her, bevor das Fenster erstellt wird, rufen Sie `I18nResx.SetLocale` auf und aktualisieren Sie den sichtbaren Text aus `LocaleChanged`. Erstellen Sie das Menü aus `sourceLocale` und `targetLocales`. Beschriften Sie es mit `T("Language")`. Die Flussrichtung kommt von `CultureInfo.TextInfo.IsRightToLeft`. Es gibt keine `SupportedLocales`-Liste für diesen Helfer.

Ein Konsolenprogramm hat kein Widget. Fügen Sie `--lang <code>` hinzu (und `-L`, wenn dieser Name frei ist), rufen Sie dann `SetLocale` vor dem ersten `T` auf. Lesen Sie `AI_I18N_LANG` nicht.

Überspringen Sie diesen Schritt, wenn das Programm keinen Text anzeigt, den eine Person liest.

Das ist der letzte manuelle Schritt. Fahren Sie fort unter [Modelle auswählen und übersetzen](#choose-models-and-translate).

<a id="not-your-case"></a>
## Nicht Ihr Fall?

| Ihr Code heute | Lesen |
| --- | --- |
| Noch kein `.resx` und kein `IStringLocalizer` | [i18n zu einer .NET-App hinzufügen](/de/guide/add-i18n-to-dotnet) |
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
| [dotnet-resx](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/dotnet-resx) | xUnit-Prüfungen von `I18nResx.cs`: Quellstring-Schlüssel, Anführungszeichen, Kontext, Pluralformen, echte Satelliten |
| [dotnet-console](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/dotnet-console) | Der JSON-Helfer, für eine App, die nicht auf `ResourceManager` ist |

Diese Verzeichnisse überprüfen die Helfer. Sie sind keine zu übersetzenden Apps und benötigen keinen API-Schlüssel. `dotnet test` in `dotnet-resx` führt die Satellitenprüfungen aus. Eine echte App beginnt auf dieser Seite mit `init`. Kopieren Sie eine davon mit `npx degit` oder laden Sie `ai-i18n-tools-dotnet-examples.zip` vom GitHub Release herunter. Diese Zip-Datei enthält auch `assets/dotnet`, die das Projekt kompiliert. Befehle: [Beispiele](/de/examples#net-examples).
