<a id="dotnet-applications"></a>
# .NET-Anwendungen

`ai-i18n-tools` extrahiert UI-Strings aus C#, Razor, cshtml, XAML und AXAML und schreibt dann flaches JSON, dessen Schlüssel der Quellsprachen-String ist. `sourceLocale` kann jede beliebige Sprache sein. Der Laufzeit-Helfer ist `I18n.cs` (.NET 6 oder neuer, keine NuGet-Pakete). Avalonia-, WPF-, MAUI-, WinForms-, ASP.NET-, Blazor- und Konsolen-Apps rufen diesen Helfer auf. .NET Framework 4.8 benötigt das `System.Text.Json`-Paket, bevor die Datei kompiliert wird.

Hinzufügen von Lokalisierungen zu einer bestehenden einsprachigen App: [i18n zu einer .NET-App hinzufügen](/de/guide/add-i18n-to-dotnet).

<a id="scaffold"></a>
## Gerüst

```bash
ai-i18n-tools init -t ui-dotnet -P openrouter
ai-i18n-tools init -t ui-dotnet -P openrouter --namespace CursorPace
```

`ui-dotnet` schreibt `ai-i18n-tools.config.json` und kopiert, wenn `I18n.cs` fehlt, [assets/dotnet/I18n.cs](https://github.com/wsj-br/ai-i18n-tools/blob/main/assets/dotnet/I18n.cs) in das Projekt. `--namespace` legt den C#-Namespace fest. Wenn er weggelassen wird und das Verzeichnis eine `.csproj` enthält, verwendet `init` den `RootNamespace` dieser Datei oder den Namen der Projektdatei. Andernfalls ist der Namespace `AiI18n`.

`init` bearbeitet die Projektdatei nicht. Fügen Sie das Lokalisierungs-JSON zur Assembly hinzu:

```xml
<EmbeddedResource Include="locales/*.json" />
```

Der Scan überspringt Verzeichnisse mit den Namen `bin`, `obj`, `.vs`, `TestResults` und `packages`. Die Vorlage setzt `uiExtractor.exclude` auch auf `**/bin/**`, `**/obj/**`, `**/Tests/**` und `**/*.Tests/**`.

<a id="calls-that-translate"></a>
## Aufrufe, die übersetzen

Suchen Sie zuerst den Katalogeintrag, und übergeben Sie das Ergebnis dann an `string.Format`. Die Standardnamen sind `T`, `Tn`, `Tp`, `N`, `Tr` und `Loc`. Ein Empfänger wie `I18n.T` stimmt überein, da der letzte Name `T` ist.

```csharp
T("Sign in")
T("Saved to {0}", path)
Tn("1 sample", "{0} samples", count)
Tp("menu", "Open")
N("Light")
I18n.Loc["Show token"]
```

`N` gibt sein Argument zurück und ist nur dazu da, damit ein statisches Feld, ein Enum-Label oder ein Attribut ein Literal enthalten kann, das der Extraktor sehen kann. Zeigen Sie es später mit `T(label)`.

`Tn` behandelt `{0}` als Zähler. Zusätzliche Argumente folgen darauf (`{1}`, `{2}`).

`Tp` speichert den Kontext und den Quell-String unter einem Schlüssel (Kontext, U+0004, Quelle), denselben Trennzeichen, die flaches JSON bereits verwendet. Verwenden Sie es, wenn dasselbe kurze Wort unterschiedliche Bedeutungen hat (`Open` das Fenster und `Open` die Datei).

XAML und AXAML verwenden eine Markup-Erweiterung, deren Typname in `funcNames` steht. Das Präfix wird ignoriert:

```xml
<TextBlock Text="{loc:Tr 'Sign in'}" />
<TabItem Header="{loc:Tr 'Startup &amp; Display'}" />
```

`{Binding}`, `{DynamicResource}`, `{StaticResource}`, `{TemplateBinding}` und `{x:Static}` werden nicht extrahiert. Text, der als Elementinhalt (`<TextBlock>Hello</TextBlock>`) geschrieben wird, wird nicht extrahiert. Ein Literal, das einen Apostroph enthält, wird mit dem Argument in `&quot;` geschrieben, damit das XML-Attribut in doppelten Anführungszeichen bleiben kann: `Content="{loc:Tr &quot;Don't&quot;}"`.

Diese werden extrahiert und dann abgelehnt, da der Katalog nicht mit dem übereinstimmen würde, was das Programm nachschlägt:

```csharp
T($"Saved to {path}")
T("Last synced " + when)
T(variable)
T("Hello {name}")
```

Übergeben Sie ein Literal, und verwenden Sie `{0}` anstelle von `{name}`. `string.Format` wirft bei einem benannten Element eine Ausnahme. `extract` gibt eine Warnung für die ersten drei aus und stoppt bei `{name}`.

Ein Literal mit führenden oder nachgestellten Leerzeichen wird weiterhin katalogisiert. `I18n.T` kürzt den Schlüssel, schlägt ihn nach und fügt die Leerzeichen wieder zum Ergebnis hinzu. Bevorzugen Sie `T("Updated: {0}", value)`, damit Übersetzer das Trennzeichen sehen.

<a id="placeholders"></a>
## Platzhalter

`ui-dotnet` setzt `uiExtractor.placeholderStyle` auf `dotnet`. Dieser Stil behält `{0}`, `{0,-10}`, `{0:C}` und `{0,-10:C}`. `%` ist gewöhnlicher Text, daher wird eine Übersetzung wie `10% e 20%` nicht als printf-Token behandelt. Doppelte geschweifte Klammern (<code v-pre>{{</code> und `}}`) sind literale geschweifte Klammern und müssen unverändert kopiert werden. `{name}` ist ein Fehler zur Extraktionszeit.

Der Standardstil, der von JavaScript und Python verwendet wird, bleibt unverändert.

<a id="runtime"></a>
## Laufzeit

`I18n.SetLocale("pt-BR")` durchläuft `CultureInfo.Parent`, bis ein Katalog geöffnet wird. `OpenLocale` wird verwendet, wenn es gesetzt ist. Andernfalls ist ein konfiguriertes `FlatDirectory` die einzige Quelle: Eine dort fehlende Datei fällt nicht auf eingebettetes JSON zurück. Eingebettete Ressourcen werden nur verwendet, wenn weder `OpenLocale` noch `FlatDirectory` gesetzt ist. Ein fehlender Schlüssel gibt den Quellstring zurück. `I18n.Strict = true` wirft stattdessen eine Ausnahme, was in Tests nützlich ist. `string.Format` wird auf der übersetzten Vorlage aufgerufen. Ein ungültiges Format kann `FormatException` werfen. Ein weggelassenes `{0}` kann das Argument weglassen. Nach einem Formatierungsfehler gibt es keinen Rückgriff auf die Quellvorlage.

`I18n.SupportedLocales` ist die Liste, die bei der Initialisierung (nativer Name und englischer Name) gestempelt wird. `I18n.IsRightToLeft` liest `CultureInfo.TextInfo`. Die App setzt `CultureInfo.CurrentUICulture` und `CultureInfo.CurrentCulture` selbst. `string.Format` verwendet die aktuelle UI-Kultur, daher folgt `{0:C}` dieser Kultur.

`LocaleChanged` wird innerhalb von `SetLocale` ausgelöst. Setzen Sie zuerst `CurrentUICulture` und `CurrentCulture`, damit ein Aktualisierungs-Handler mit der neuen Kultur formatiert. Viewmodel-Eigenschaften, die `T` aufrufen, sollten `PropertyChanged` von diesem Ereignis auslösen. Eine Markup-Erweiterung, die einen einfachen String zurückgibt, wird beim nächsten Erstellen der Ansicht aktualisiert. Der Katalog und das aktuelle Gebietsschema sind statisch. Das ist sicher für einen Desktop-Prozess. Es ist kein pro-Anfrage-Gebietsschema für einen Mehrbenutzer-Server. Behalten Sie `IStringLocalizer` oder `ResourceManager` dort. Das Setzen von `CurrentUICulture` gibt nicht jeder Anfrage ihre eigene Zuordnung.

Um einen kopierten Helfer zu aktualisieren, gerüsten Sie dieselbe Vorlage in einem temporären Verzeichnis und kopieren Sie nur die generierte Datei, die Sie ersetzen möchten. Führen Sie `init` nicht erneut in der App aus, um den Helfer zu aktualisieren.

Die Datei beginnt mit `ai-i18n-tools-i18n-cs:`, daher überspringt `extract` sie.

<a id="desktop-recipe"></a>
## Desktop-Rezept

Avalonia, WPF und MAUI haben jeweils ihre eigene Basisklasse für Markup-Erweiterungen. Das Hilfsprogramm referenziert diese Assemblies nicht. Ein Avalonia-Beispiel:

```csharp
public sealed class TrExtension : MarkupExtension
{
    public TrExtension(string text) { Text = text; }
    public string Text { get; }
    public override object ProvideValue(IServiceProvider serviceProvider) => I18n.T(Text);
}
```

Formatierte Sätze bleiben in C# (`T("Cursor {0}", value)`), was den Extractor auf einem einzigen Literal hält. Derselbe Aufruf funktioniert von einem View-Model, einem Tray-Tooltip und einem Dialog.

<a id="migrate"></a>
## Unsichere Aufrufe umschreiben

`migrate-dotnet-i18n` ist ein Probelauf, bis Sie `--write` übergeben. Es schreibt Argumente von `T`, `Tn` und `Tp` um, die vor der Suche erstellt werden:

```csharp
T($"Saved to {path}")
T("Last synced " + date)
T(string.Format("Hello {0}", name))
```

werden zu `T("Saved to {0}", path)`, `T("Last synced {0}", date)` und `T("Hello {0}", name)`. Ein wiederholter einfacher Name bleibt ein Argument. Eine Umwandlung wie `(int)status` behält ihren eigenen Index. Der Bericht `migrate-dotnet-i18n-report.md` listet alles auf, was an Ort und Stelle verblieben ist: `await`, ein roher `$$"""`-String, ein `? :`-Platzhalter, `ref` oder `out`, eine Verkettung ohne Literal, ein an `string.Format` übergebenes `IFormatProvider` und eine Phrase, die wie ein Plural aussieht (`{0} samples` sollte `Tn` sein).

`--wrap` markiert auch unmarkierte XAML `Text`, `Header`, `Content` und die anderen Beschriftungsattribute als `{loc:Tr '...'}`, sowie C#-Zuweisungen, deren Name auf `Text`, `Title`, `Message` und die anderen Suffixe mit hoher Konfidenz endet, plus `MessageBox.Show` und `ConfirmDialog.Show`. Ohne `--write` ist das ein Audit. Es bearbeitet keine Protokolle, Attribute, `nameof`, Vergleiche oder `Path`-Aufrufe. Ein zweiter Durchlauf ändert nichts.

Wenn `extract` ein neutrales `.resx` aufnimmt, erhält derselbe Bericht einen Abschnitt „Benannte Ressourcenschlüssel“. Eine Zeile wie `Resources.LoginButton` wird als `T("Sign in")` aufgeführt. Diese Zeilen sind Vorschläge. Der Befehl bearbeitet sie nicht.
