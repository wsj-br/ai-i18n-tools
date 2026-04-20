---
sidebar_position: 1
title: Vorführung der Übersetzungsfunktionen
description: >-
  Ein Referenzdokument, das jedes Markdown-Element zeigt, das ai-i18n-tools
  übersetzen kann.
translation_last_updated: '2026-04-20T16:41:24.901Z'
source_file_mtime: '2026-04-19T22:02:25.720Z'
source_file_hash: 4cd8d12313cf2fabc4090fad6b6c2b117c3483b6a324be245b134b1f4b94a013
translation_language: de
source_file_path: docs-site/docs/feature-showcase.md
translation_models:
  - qwen/qwen3-235b-a22b-2507
---



Diese Seite dient dazu, zu demonstrieren, wie `ai-i18n-tools` jede gängige Markdown-Konstruktion verarbeitet. Führen Sie `sync` darauf aus und vergleichen Sie die Ausgabe in jedem Sprachordner, um genau zu sehen, was übersetzt wird und was unverändert bleibt.

---

## Einfacher Fließtext

Internationalisierung bedeutet mehr als nur das Austauschen von Wörtern. Eine gute Übersetzungspipeline erhält die Dokumentstruktur bei, bewahrt technische Bezeichner und sendet nur menschenlesbaren Text an das Sprachmodell.

`ai-i18n-tools` teilt jedes Dokument in **Segmente** auf, bevor es an das LLM gesendet wird. Jedes Segment wird unabhängig übersetzt und anschließend wieder zusammengesetzt, sodass eine Änderung an einem Absatz nicht die zwischengespeicherten Übersetzungen des restlichen Dokuments ungültig macht.

---

## Inline-Formatierung

Der Übersetzer sollte sämtliche Inline-Formatierungen übernehmen, ohne die Auszeichnung zu verändern:

- **Fetter Text** signalisiert Wichtigkeit und sollte nach der Übersetzung fett bleiben.
- _Kursiver Text_ wird zur Hervorhebung oder für Titel verwendet; die Bedeutung ist beizubehalten.
- ~~Durchgestrichen~~ kennzeichnet veraltete oder entfernte Inhalte.
- `inline code` wird **niemals** übersetzt – Bezeichner, Funktionsnamen und Dateipfade müssen unverändert bleiben.
- Ein [Hyperlink](https://github.com/your-org/ai-i18n-tools) behält seine ursprüngliche URL; nur die Ankerbezeichnung wird übersetzt.

---

## Überschriften auf jeder Ebene

### H3 — Konfiguration

#### H4 — Ausgabeverzeichnis

##### H5 — Dateibenennung

###### H6 — Erweiterungsbehandlung

Alle Überschriftsebenen übersetzen den Text, lassen aber die Anker-IDs unverändert, damit bestehende Deep-Links weiterhin funktionieren.

---

## Tabellen

Tabellen sind eine häufige Quelle für Übersetzungsfehler. Jede Zelle wird einzeln übersetzt; Spaltentrennzeichen und Ausrichtungssyntax bleiben erhalten.

| Funktion | Status | Hinweise |
|---|---|---|
| Markdown-Übersetzung | ✅ Stabil | Segmente im SQLite-Cache gespeichert |
| UI-String-Extraktion | ✅ Stabil | Liest `t("…")`-Aufrufe |
| Kardinal-Plural-UI-Strings | ✅ Stabil | `t("…", { plurals: true, count })`; Katalog + flache JSON-Endungen |
| JSON-Label-Übersetzung | ✅ Stabil | Docusaurus Sidebar/Navbar JSON |
| SVG-Text-Übersetzung | ✅ Stabil | Behält SVG-Struktur bei |
| Glossar-Erzwingung | ✅ Stabil | Pro Projekt CSV-Glossar |
| Stapelverarbeitung Parallelität | ✅ Konfigurierbar | `batchConcurrency`-Schlüssel |

### Ausrichtungsvarianten

| Linksbündig | Zentriert | Rechtsbündig |
|:---|:---:|---:|
| Quelllocale | `en-GB` | erforderlich |
| Ziellocales | bis zu 20 | empfohlen |
| Parallelität | 4 | Standard |

---

## Listen

### Ungeordnet

- Der Übersetzungscache speichert einen Hash jedes Quellsegments.
- Nur Segmente, deren Hash sich seit dem letzten Durchlauf geändert hat, werden an das LLM gesendet.
- Dadurch sind inkrementelle Durchläufe sehr schnell – typischerweise nur wenige API-Aufrufe für kleine Änderungen.

### Geordnet

1. Fügen Sie `ai-i18n-tools` als Entwicklungsabhängigkeit hinzu.
2. Erstellen Sie `ai-i18n-tools.config.json` im Stammverzeichnis Ihres Projekts.
3. Führen Sie `npx ai-i18n-tools sync` aus, um die erste vollständige Übersetzung durchzuführen.
4. Committen Sie die generierten Lokalisierungsdateien zusammen mit Ihrem Quellcode.
5. Bei nachfolgenden Durchläufen werden nur geänderte Segmente erneut übersetzt.

### Geschachtelt

- **Dokumenten-Pipeline**
  - Quelle: jede `.md`- oder `.mdx`-Datei
  - Ausgabe: Docusaurus `i18n/`-Baum oder flache übersetzte Kopien
  - Cache: SQLite, indiziert nach Dateipfad + Segment-Hash
- **UI-Strings-Pipeline**
  - Quelle: JS/TS-Dateien mit `t("…")`-Aufrufen (einschließlich Kardinal-Plural über `{ plurals: true, count }`)
  - Ausgabe: flache JSON-Dateien pro Locale (`de.json`, `fr.json`, …) mit angehängten Schlüsseln für Plural-Kategorien, falls zutreffend
  - Cache: der Master-`strings.json`-Katalog selbst

---

## Kardinale Plural-UI-Strings (Next.js-Begleit-App)

Markdown-Dokumente auf dieser Seite zeigen die **Dokument**-Übersetzung. Das Verhalten von **kardinalen Pluralen** für UI-Texte lässt sich am besten im **gebündelten Next.js-Beispiel** beobachten, das neben `docs-site/` unter `examples/nextjs-app/` liegt.

Die Startseite dieser App (`src/app/page.tsx`) enthält einen Abschnitt **Plural-Demo** und wiederholt eine Nachricht bei mehreren Beispielanzahlen, sodass Sie die Grammatik zwischen Sprachen vergleichen können (z. B. Arabisch vs. Englisch). Jede Zeile ruft auf:

```typescript
t("This page has {{count}} sections", { plurals: true, count })
```

Verwenden Sie **`plurals: true`**, damit **`extract`** eine Pluralgruppe in `locales/strings.json` aufzeichnet und **`translate-ui`** die flachen Dateien pro Sprache unter `public/locales/` füllt. Zur Laufzeit löst i18next den richtigen suffigierten Schlüssel für das aktive **`count`** auf; das Next.js-Beispiel bindet Hilfsfunktionen in **`src/lib/i18n.ts`** ein.

Für Screenshots, Sprach-URLs und die Dateistruktur siehe **Beispiel für kardinale Plurale** im [Next.js-Beispiel-README](../../README.md).

---

## Codeblöcke

Codeblöcke werden **niemals** übersetzt. Der umgebende Text wird übersetzt, aber jedes Zeichen innerhalb des umschlossenen Blocks wird unverändert übernommen.

### Shell

```bash
# Install the package
npm install --save-dev ai-i18n-tools

# Run a full sync
npx ai-i18n-tools sync

# Translate only documentation
npx ai-i18n-tools sync --no-ui --no-svg
```

### JSON-Konfiguration

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "es", "fr", "pt-BR"],
  "features": {
    "translateMarkdown": true,
    "translateJSON": true
  },
  "documentations": [
    {
      "contentPaths": ["docs-site/docs/"],
      "outputDir": "docs-site/i18n",
      "markdownOutput": { "style": "docusaurus", "docsRoot": "docs-site/docs" }
    }
  ]
}
```

### TypeScript

```typescript
import { createI18nConfig } from 'ai-i18n-tools/runtime';

const config = createI18nConfig({
  defaultLocale: 'en-GB',
  supportedLocales: ['de', 'es', 'fr', 'pt-BR'],
  fallback: 'en-GB',
});

export default config;
```

---

## Blockzitate

> „Die beste Internationalisierung ist für den Benutzer unsichtbar – er sieht einfach seine Sprache.“
>
> Eine ordnungsgemäße Übersetzung geht über den Wortschatz hinaus. Sie passt Ton, Datumsformate, Zahlenformatierung und Leserichtung an, um in jeder Sprachregion natürlich zu wirken.

---

## Hinweise (Docusaurus)

Docusaurus-Hinweistitel werden übersetzt; die `:::`-Umrandungen und Typ-Schlüsselwörter bleiben erhalten.

:::note
Dieses Dokument enthält absichtlich viele Markdown-Elemente. Sein Hauptzweck ist es, als Übersetzungstestfall zu dienen – führen Sie `sync` aus und prüfen Sie die Ausgabe, um sicherzustellen, dass jedes Element korrekt verarbeitet wird.
:::

:::tip
Sie können die übersetzte Formulierung für jedes Segment überschreiben, indem Sie die Ausgabedatei bearbeiten und anschließend erneut `sync` ausführen. Das Tool erkennt Ihre Änderungen und fügt die korrigierte Formulierung automatisch dem Projektglossar hinzu.
:::

:::warning
Committen Sie das Verzeichnis `.translation-cache/` nicht in die Versionskontrolle. Der Cache ist maschinenspezifisch und wird bei jedem frischen Checkout neu generiert.
:::

:::danger
Wenn Sie das Cache-Verzeichnis löschen, werden alle Segmente von Grund auf neu übersetzt. Dies kann bei großen Dokumenten kostenintensiv sein. Verwenden Sie `sync --no-cache-write`, um einen Testlauf ohne Speichern der Ergebnisse durchzuführen.
:::

---

## Bilder und länderspezifische Pfadumsetzung

Der Alternativtext für Bilder wird in jede Sprache übersetzt. Darüber hinaus kann `ai-i18n-tools` auch **Bildpfade** in der übersetzten Ausgabe über `postProcessing.regexAdjustments` umschreiben – sodass jede Sprachversion auf einen eigenen Screenshot verweist, anstatt immer die englische Version anzuzeigen.

Das Quelldokument (Englisch) verweist auf:

```markdown
![The example Next.js app running in English](/img/screenshots/de/screenshot.png)
```

Der Konfigurationseintrag für diese Dokumentationsseite enthält:

```json
"regexAdjustments": [
  {
    "description": "Per-locale screenshot folders in docs-site static assets",
    "search": "screenshots/de/",
    "replace": "screenshots/${translatedLocale}/"
  }
]
```

Nach der Übersetzung lautet die deutsche Ausgabe:

```markdown
![Die Beispiel-Next.js-App auf Deutsch](/img/screenshots/de/screenshot.png)
```

Hier ist der eigentliche englische Screenshot – wenn Sie dies in einer übersetzten Sprachversion lesen, sollte das Bild unten die Anwendung in Ihrer Sprache zeigen:

![The example Next.js app — UI strings and this page translated by ai-i18n-tools](/img/screenshots/de/screenshot.png)

---

## Horizontale Trennlinien und Zeilenumbrüche

Eine horizontale Trennlinie (`---`) ist ein strukturelles Element und wird nicht übersetzt.

Der Inhalt oberhalb und unterhalb davon wird als separater Segment behandelt, wodurch das LLM klarere Kontextfenster erhält.
