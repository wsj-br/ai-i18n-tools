<a id="programmatic-api"></a>
# Programmatische API

Alle öffentlichen Typen und Klassen werden aus der Paketwurzel exportiert. Beispiel: Ausführen des UI-Übersetzungsschritts aus Node.js heraus ohne die CLI:

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

Schlüsselexporte (häufig verwendet – siehe `src/index.ts` für die vollständige öffentliche Oberfläche):

| Export | Beschreibung |
|---|---|
| `loadI18nConfigFromFile` | Lädt, fusioniert und validiert die Konfiguration aus einer JSON-Datei. |
| `parseI18nConfig` | Validiert ein rohes Konfigurationsobjekt. |
| `TranslationCache` | SQLite-Cache – Instanziierung mit einem `cacheDir` Pfad. |
| `UIStringExtractor` | Extrahiere `t("…")`-Zeichenketten aus JS/TS-Quellcode. |
| `collectHtmlI18nStrings` / `markHtmlContent` | Scannt / fügt `data-i18n*`-Marker in HTML ein (treibt `extract` für `.html` und den `mark-html`-Befehl an). |
| `MarkdownExtractor` | Extrahiere übersetzbare Segmente aus Markdown. |
| `JsonExtractor` | Aus Docusaurus JSON-Beschriftungsdateien extrahieren (Benutzeroberflächenkataloge, nicht MDX-Inhalt). |
| `SvgExtractor` | Extrahiere aus SVG-Dateien. |
| `LlmClient` | Senden Sie Übersetzungsanfragen an den aktiven LLM-Anbieter (`OpenRouterClient` ist ein veralteter Alias). |
| `PlaceholderHandler` | Schützt und stellt Markdown-Syntax um die Übersetzung herum wieder her (HTML-Tags, Hinweise, Anker, MDX-Kommentare/JSX/Geschweifte Klammern, URLs, Inline-Code, Hervorhebungen). |
| `protectMdx` / `restoreMdx` | Schützt und stellt MDX-Kommentare, JSX-Tags, geschweifte Ausdrücke und JSX-String-Attribute wieder her (wird von `PlaceholderHandler` aufgerufen; auch für direkte Nutzung exportiert). |
| `splitTranslatableIntoBatches` | Gruppiere Segmente in LLM-gerechte Batches. |
| `validateTranslation` | Strukturelle Prüfungen nach der Übersetzung (**asynchron** – muss erwartet werden). |
| `resolveDocumentationOutputPath` | Ermittle Ausgabedateipfad für ein übersetztes Dokument. |
| `Glossary` / `GlossaryMatcher` | Lade und wende Übersetzungsglossare an. |
| `runTranslateUI` | Programmatischer Einstiegspunkt für die Übersetzungs-UI. |
| `PROVIDER_PRESETS` | Vordefinierte Anbieter-Voreinstellungskarte (`baseUrl`, `apiKeyEnv`). |
