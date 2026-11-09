<a id="programmatic-api"></a>
# Programmatische API

Alle öffentlichen Typen und Klassen werden aus dem Paket-Root exportiert. Beispiel: Ausführen des translate-ui-Schritts von Node.js ohne die CLI:

```ts
import { loadI18nConfigFromFile, runTranslateUI } from 'ai-i18n-tools';

// Config must have features.translateUIStrings: true (and valid targetLocales, etc.).
const config = loadI18nConfigFromFile('ai-i18n-tools.config.json');

const summary = await runTranslateUI(config, {
  cwd: process.cwd(),
  locales: config.targetLocales,
  force: false,
  dryRun: false,
  verbose: false,
});
console.log(
  `Updated ${summary.stringsUpdated} string(s); locales touched: ${summary.localesTouched.join(', ')}`
);
```

Eine Konfiguration aus Node.js generieren. Das vierte Argument ist das integrierte Preset (`cwd` ist das dritte). Ein optionales fünftes Argument `{ withReadme: true }` fügt den flachen README-Dokumentationsblock an, wenn die Vorlage `README.md` noch nicht auflistet, und gibt zurück, ob dieser Block hinzugefügt wurde:

```ts
import { writeInitConfigFile } from 'ai-i18n-tools';

writeInitConfigFile('ai-i18n-tools.config.json', 'uiMarkdown', process.cwd(), 'anthropic');
writeInitConfigFile('ai-i18n-tools.config.json', 'docsMarkdown', process.cwd(), 'openrouter');
writeInitConfigFile('ai-i18n-tools.config.json', 'uiPython', process.cwd(), 'openrouter', {
  withReadme: true,
});
```

Schlüsselexporte (häufig verwendet – siehe `src/index.ts` für die vollständige öffentliche Oberfläche):

| Export | Beschreibung |
|---|---|
| `loadI18nConfigFromFile` | Lädt, fusioniert und validiert die Konfiguration aus einer JSON-Datei. |
| `parseI18nConfig` | Validiert ein rohes Konfigurationsobjekt. |
| `TranslationCache` | SQLite-Cache – Instanziierung mit einem `cacheDir` Pfad. |
| `UIStringExtractor` | Extrahiere `t("…")`-Zeichenketten aus JS/TS-Quellcode. |
| `collectHtmlI18nStrings` / `markHtmlContent` | Scannt / fügt `data-i18n*`-Marker in HTML ein (treibt `extract` für `.html` und den `mark-html`-Befehl an). |
| `MarkdownExtractor` | Extrahiere übersetzbare Segmente aus Markdown. |
| `HtmlTemplateExtractor` | Einfache HTML-Dokumente extrahieren und wieder zusammenfügen (Text und übersetzbare Attribute; `src` / `href` bleiben an Ort und Stelle). |
| `JsonExtractor` | Aus Docusaurus JSON-Beschriftungsdateien extrahieren (Benutzeroberflächenkataloge, nicht MDX-Inhalt). |
| `SvgExtractor` | Extrahiere aus SVG-Dateien. |
| `LlmClient` | Senden Sie Übersetzungsanfragen an den aktiven LLM-Anbieter (`OpenRouterClient` ist ein veralteter Alias). |
| `rankProviderModels` / `resolveSuggestionWeights` | Bewertet den Chat-Katalog eines Anbieters. Der Index ist ChrF und Arena; das Qualitätsprofil sortiert nach diesem Index, und das Preisprofil bewegt sich entlang der Pareto-Grenze. Gibt die Konfiguration nicht aus oder schreibt sie nicht. |
| `PlaceholderHandler` | Schützt und stellt Markdown-Syntax um die Übersetzung herum wieder her (HTML-Tags, Hinweise, Anker, MDX-Kommentare/JSX/Geschweifte Klammern, URLs, Inline-Code, Hervorhebungen). |
| `protectMdx` / `restoreMdx` | Schützt und stellt MDX-Kommentare, JSX-Tags, geschweifte Ausdrücke und JSX-String-Attribute wieder her (wird von `PlaceholderHandler` aufgerufen; auch für direkte Nutzung exportiert). |
| `splitTranslatableIntoBatches` | Gruppiere Segmente in LLM-gerechte Batches. |
| `validateTranslation` | Strukturelle Prüfungen nach der Übersetzung (**asynchron** – muss erwartet werden). |
| `resolveDocumentationOutputPath` | Ermittle Ausgabedateipfad für ein übersetztes Dokument. |
| `Glossary` / `GlossaryMatcher` | Laden und Anwenden von Übersetzungsglossaren, einschließlich optionaler `Context`-Hinweise. |
| `loadTranslationContext` / `computeGuidanceFingerprint` | Laden von `glossary.contextFiles` und Fingerabdruck-Anleitung zur Cache-Invalidierung. |
| `runTranslateUI` | Programmatischer translate-ui-Einstiegspunkt. |
| `writeInitConfigFile` | Schreibt eine Starter-Konfigurations-JSON (`template`, `cwd`, ein erforderliches `providerKey` und ein optionales `{ withReadme }`). Gibt `{ readmeBlockAdded, hasReadmeBlock }` zurück. |
| `DEFAULT_INIT_MODELS_BY_PROVIDER` | Starter-`translationModels` pro integriertem Preset, das von `init -P` verwendet wird. |
| `PROVIDER_PRESETS` | Vordefinierte Anbieter-Voreinstellungskarte (`baseUrl`, `apiKeyEnv`). |

<a id="python-runtime-i18npy"></a>
## Python-Laufzeit (`i18n.py`)

`init -t ui-python`, `ui-python-gettext` und `ui-python-flask` schreiben dieses Modul in das Projekt, wenn `i18n.py` fehlt. Es handelt sich um einen Standardbibliotheks-Helfer für Python 3.10 oder neuer. Importieren Sie ihn aus dieser Datei. Die unten aufgeführten Funktionen sind von den Node-Exporten in der obigen Tabelle getrennt. Django-Projekte behalten Djangos gettext bei, daher schreibt `ui-python-django` kein `i18n.py`.

Aufrufformen, unsichere f-Strings und frameworkspezifische Locale-Anbindung: [Python-Anwendungen](/de/guide/ui-strings/python).

| Funktion | Verhalten |
| --- | --- |
| `set_locale(locale)` | Legt die aktuelle Locale fest. Unterstriche im Code werden als Bindestriche gespeichert (`pt_BR` wird zu `pt-BR`). Gibt ein `ContextVar`-Token zurück. |
| `reset_locale(token)` | Stellt die Locale aus diesem Token wieder her. Rufen Sie dies in `finally` auf, einschließlich FastAPI- und Flask-Middleware. |
| `get_locale()` | Gibt die aktuelle Locale zurück. |
| `set_backend(backend)` | Wählt `"auto"`, `"json"` oder `"gettext"` aus. |
| `get_ui_languages()` | Liest `ui-languages.json` neben dem flachen JSON-Verzeichnis oder dem gettext-Verzeichnis, wenn die flache Ausgabe deaktiviert ist. |
| `get_direction(locale=None)` | Gibt `"rtl"` oder `"ltr"` aus der Manifest-Zeile für diese Locale zurück (aktuelle Locale, wenn weggelassen). |
| `_(message)` | Sucht ein Literal nach und gibt dann den Katalog-String oder die Nachricht selbst zurück. |
| `t(template, *, plurals=False, count=None, **values)` | Sucht das Literal nach und interpoliert dann. `translate` ist dieselbe Funktion. Unter Python 3.14 behält `translate(t"Hello, {name}!")` die Vorlage und ihre Werte bei. Schlüsselwortargumente überschreiben Werte, die aus einem Vorlagen-String stammen. |
| `ngettext(singular, plural, n, **values)` | Plural-Suche, dann Interpolation. `count` steht für den Format-String zur Verfügung. |
| `pgettext(context, message, **values)` | Kontextsuche (`msgctxt` oder `context` + U+0004 + den Quellsprachen-String in flachem JSON), dann interpolieren. |
| `streamlit_language_selector(sidebar=True, key="lang_selector")` | Streamlit-Auswahlfeld. Schreibt `st.session_state.locale` und `st.query_params["lang"]`, ruft `set_locale` auf und gibt den gewählten Code zurück. |

<a id="net-runtime-i18ncs"></a>
## .NET-Laufzeitumgebung (`I18n.cs`)

`init -t ui-dotnet` kopiert `assets/dotnet/I18n.cs` in das Projekt, wenn `I18n.cs` fehlt. Es ist ein abhängigkeitsfreier Helfer für .NET 6 oder neuer. Die unten aufgeführten Mitglieder sind von den Node-Exporten in der obigen Tabelle getrennt. Aufrufstrukturen und XAML-Markup: [.NET-Anwendungen](/de/guide/ui-strings/dotnet).

| Mitglied | Verhalten |
| --- | --- |
| `SetLocale(locale)` | Lädt das Flat-JSON dieses Locales und durchläuft `CultureInfo.Parent`, wenn die exakte Datei fehlt. Löst `LocaleChanged` aus. |
| `T(source, args)` | Sucht nach dem gekürzten Literal, formatiert mit `string.Format` und fügt die führenden und nachfolgenden Leerzeichen der Quelle wieder ein. |
| `Tn(singular, plural, count, args)` | Plural-Nachschlagevorgang. `{0}` ist die Anzahl. Der Katalogschlüssel ist der MD5-8 des gekürzten Singulars plus `_` und die CLDR-Form. |
| `Tp(context, source, args)` | Sucht nach Kontext + U+0004 + Quelle und formatiert dann. |
| `N(source)` | Gibt `source` zurück. Extrahiert, damit statische Bezeichnungen katalogisiert werden können. |
| `Loc[source]` | Indexer, der `T` aufruft. `Loc` ist ein statisches Feld vom Typ `StringSourceLocalizer`. |
| `Configure(options)` | Die Quell-Locale festlegen, wenn `SourceLocale` nicht leer ist. Jeder Aufruf ersetzt `Strict`, `FlatDirectory` und `OpenLocale` (null löscht das Verzeichnis und den Stream-Loader). `Locales` ersetzt die Sprachliste nur, wenn das Array nicht null ist. |
| `SupportedLocales` | `BuiltInLocales` bis ein nicht-null `Locales`-Array übergeben wird. Nativer Name und englischer Name. Ein null `Locales`-Array stellt den Stempel nicht wieder her. |
| `IsRightToLeft(locale)` | `CultureInfo.TextInfo.IsRightToLeft`. |
| `PluralForm(locale, n)` | CLDR-Formname aus denselben GNU-Regeln wie `.po`-Dateien. |

`init -t ui-dotnet-resx` kopiert `I18nResx.cs` stattdessen. `T`, `Tn` und `Tp` rufen `ResourceManager` mit denselben Quellzeichenfolgen-Schlüsseln auf. `SetLocale` legt `CurrentUICulture` und `CurrentCulture` fest. Details: [i18n zu einer .NET ResourceManager-App hinzufügen](/de/guide/add-i18n-to-dotnet-resourcemanager).
