<a id="net-applications"></a>
# .NET-Anwendungen

`ai-i18n-tools` extrahiert UI-Strings aus C#, Razor, cshtml, XAML und AXAML und schreibt dann flaches JSON, dessen Schlüssel der Quellsprachen-String ist. `sourceLocale` kann jede beliebige Sprache sein. Der Laufzeit-Helfer ist `I18n.cs` (.NET 6 oder neuer, keine NuGet-Pakete). Avalonia-, WPF-, MAUI-, WinForms-, ASP.NET-, Blazor- und Konsolen-Apps rufen diesen Helfer auf. .NET Framework 4.8 benötigt das `System.Text.Json`-Paket, bevor die Datei kompiliert wird.

Hinzufügen von Lokalisierungen zu einer bestehenden einsprachigen App: [i18n zu einer .NET-App hinzufügen](/de/guide/add-i18n-to-dotnet).

Ausführbare Kopien befinden sich in `examples/dotnet-console` und `examples/dotnet-resx`. Es handelt sich um xUnit-Projekte, nicht um zu übersetzende Anwendungen. Das Release-Archiv `ai-i18n-tools-dotnet-examples.zip` enthält diese beiden Verzeichnisse und `assets/dotnet`, die die Projekte kompilieren. Der npm-Tarball und die eigenständige ausführbare Datei tun dies nicht. Vor diesem Zip veröffentlichte Releases enthalten es nicht.

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

Der Scan überspringt Verzeichnisse mit den Namen `bin`, `obj`, `.vs`, `TestResults` und `packages`. Die Vorlage setzt außerdem `uiExtractor.exclude` auf `**/bin/**`, `**/obj/**`, `**/Tests/**`, `**/*.Tests/**` und `**/TrExtension.cs`.

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

`Tn` behandelt `{0}` als die Anzahl. Zusätzliche Argumente folgen darauf (`{1}`, `{2}`). Der Singular kann diese Anzahl als Literal (`1 sample`) angeben, während der Plural `{0}` beibehält. Die Übersetzung behält `{0}` für die Pluralkategorien bei und belässt die Literalzahl beim Singular.

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

`I18n.SupportedLocales` beginnt als die bei der Initialisierung gestempelte Liste (`BuiltInLocales`: nativer Name und englischer Name). Das Sprachmenü liest diesen Stempel nicht. Suchen Sie vor dem ersten `T()` von `AppContext.BaseDirectory` aus und dann vom aktuellen Verzeichnis aus, jeweils maximal 8 Verzeichnisse nach oben, nach `locales/ui-languages.json`. Die erste Datei gewinnt. Ordnen Sie `code`, `label` und `englishName` dem `LocaleInfo` zu (`label` ist der native Name) und übergeben Sie sie an `Configure` als `Locales`, wobei `FlatDirectory` in demselben Aufruf auf dieses `locales`-Verzeichnis gesetzt wird. Jeder `Configure`-Aufruf ersetzt `Strict`, `FlatDirectory` und `OpenLocale`. Ein späterer Aufruf, der nur `Locales` setzt, löscht `FlatDirectory`. Ein leeres `Locales`-Array belässt die aktuelle Liste und stellt `BuiltInLocales` nicht wieder her. Wenn das Manifest fehlt, übergeben Sie eine Liste mit einem Element für die Quellsprache und setzen Sie `FlatDirectory` nicht. Das Menü ist dann nur in der Quellsprache, und Kataloge bleiben eingebettet. Die Entwicklung liest die Dateien, die `sync` gerade geschrieben hat. Ein Installationsprogramm, das `sync` folgen soll, liefert `ui-languages.json` und das Locale-JSON neben der App aus.

`I18n.IsRightToLeft` liest `CultureInfo.TextInfo`. Die App setzt `CultureInfo.CurrentUICulture` und `CultureInfo.CurrentCulture` selbst und speichert den Gebietsschemabezeichner. `string.Format` verwendet die aktuelle UI-Kultur, sodass `{0:C}` dieser Kultur folgt.

`LocaleChanged` wird innerhalb von `SetLocale` ausgelöst. Setzen Sie zuerst `CurrentUICulture` und `CurrentCulture`, damit ein Aktualisierungs-Handler mit der neuen Kultur formatiert. View-Model-Eigenschaften, die `T` aufrufen, sollten `PropertyChanged` von diesem Ereignis auslösen. Für Avalonia, WPF und MAUI gibt die Markup-Erweiterung `I18n.T(Text)` zurück und setzt diese Eigenschaft bei `LocaleChanged` erneut, um sich dann abzumelden, wenn das Steuerelement den visuellen Baum verlässt. Der Katalog und das aktuelle Gebietsschema sind statisch. Das ist sicher für einen Desktop-Prozess. Es ist kein pro-Anfrage-Gebietsschema für einen Mehrbenutzer-Server. Behalten Sie `IStringLocalizer` oder `ResourceManager` dort. Das Setzen von `CurrentUICulture` gibt nicht jeder Anfrage ihre eigene Zuordnung.

Um einen kopierten Helfer zu aktualisieren, gerüsten Sie dieselbe Vorlage in einem temporären Verzeichnis und kopieren Sie nur die generierte Datei, die Sie ersetzen möchten. Führen Sie `init` nicht erneut in der App aus, um den Helfer zu aktualisieren.

Die Datei beginnt mit `ai-i18n-tools-i18n-cs:`, daher überspringt `extract` sie.

<a id="desktop-recipe"></a>
## Desktop-Rezept

Avalonia, WPF und MAUI haben jeweils ihre eigene Basisklasse für Markup-Erweiterungen. Der Helfer referenziert diese Assemblies nicht. `ProvideValue` gibt `I18n.T(Text)` zurück und setzt diese Eigenschaft bei `LocaleChanged` erneut. Melden Sie sich ab, wenn das Steuerelement den visuellen Baum verlässt. Fügen Sie `**/TrExtension.cs` zu `ui.uiExtractor.exclude` hinzu, damit `T(Text)` nicht als Nicht-Literal gemeldet wird. Die XAML-Literale sind bereits durch `Tr` extrahiert. `{loc:Tr}` kann nur `T` aufrufen. Zwei Bedeutungen eines kurzen Wortes werden im Code mit `Tp` festgelegt.

Eine Avalonia-Form (`IProvideValueTarget` ist in `Avalonia.Metadata`):

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

WPF und MAUI verwenden dieselbe Idee mit ihren eigenen Eigenschaftstypen. Nur Avalonia: Ignorieren Sie `SelectionChanged`, es sei denn, `e.Source` ist das Steuerelement, das den Handler besitzt. Weisen Sie `ItemsSource` oder `SelectedItem` nicht innerhalb dieses Handlers oder innerhalb eines `LocaleChanged` zu, das durch `SetLocale` dieser Kombination ausgelöst wurde. Posten Sie die Aktualisierung mit `Dispatcher.UIThread.Post` und sichern Sie den Handler, während der Code `SelectedItem` setzt. Ein übergeordnetes `TabControl`, das `ItemsSource` erneut aus dem gebubbelten Ereignis zuweist, lässt den Prozess abstürzen (Exit-Code 139, leeres `crash.log`).

Formatierte Sätze bleiben in C# (`T("Cursor {0}", value)`), was den Extraktor auf einem einzelnen Literal hält. `StringFormat` an einer Bindung ist unsichtbar. Derselbe Aufruf funktioniert von einem View-Model, einem Tray-Tooltip und einem Dialog aus. Eine Enum-Combo behält die Enum, gibt `T("Light")` aus ihrer Beschriftung zurück und baut die Elemente bei `LocaleChanged` neu auf. Ein Tray-Element verwendet `Tp("tray", "Open")` und ein stabiles `CommandParameter`. Passen Sie den Parameter an, nicht den Header. Ein Dienst speichert den englischen Fehlersatz, und die Anzeigestelle ordnet bekannte Sätze über `T` zu. Linux `.desktop` `Name=` und `Comment=` bleiben in der Quellsprache. Dauer-Tokens, die verglichen werden (`2d`, `7h 47m`), bleiben unübersetzt. Übersetzen Sie `T("now")` und `T("in {0}", duration)` an der Anzeigestelle. Ein führendes oder nachgestelltes Leerzeichen bei einem Literal ist immer noch eine Extraktionswarnung. Verschieben Sie es in den Formatstring oder das Layout. `Tn` kann einen Quellsatz korrigieren, der immer im Plural war (`1 samples`).

<a id="rewrite-unsafe-calls"></a>
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
