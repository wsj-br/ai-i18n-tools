---
sidebar_position: 1
title: Funktionsübersicht der Übersetzung
description: >-
  Ein Referenzdokument, das jedes Markdown-Element demonstriert, das
  ai-i18n-tools übersetzen kann.
translation_last_updated: '2026-09-03T22:52:20.679Z'
source_file_mtime: '2026-07-12T19:44:59.019Z'
source_file_hash: ad61e5d62a39cb332852533980c1de8417791746e8053814b32c4d3785e41215
translation_language: de
source_file_path: docs/feature-showcase.md
translation_models:
  - google/gemini-2.5-flash
---



import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Diese Seite dient dazu, zu demonstrieren, wie `ai-i18n-tools` mit jeder gängigen Markdown-Konstruktion umgeht. Führen Sie `sync` dagegen aus und vergleichen Sie die Ausgabe in jedem Gebietsschema-Ordner, um genau zu sehen, was übersetzt wird und was unberührt bleibt.

---

## Klartext {#plain-text}

Internationalisierung ist mehr als der Austausch von Wörtern. Eine gute Übersetzungs-Pipeline bewahrt die Dokumentstruktur, hält technische Bezeichner intakt und sendet nur menschenlesbaren Text an das Sprachmodell.

`ai-i18n-tools` teilt jedes Dokument in **Segmente** auf, bevor es an das LLM gesendet wird. Jedes Segment wird unabhängig übersetzt und dann wieder zusammengesetzt, sodass eine Änderung an einem Absatz die zwischengespeicherten Übersetzungen des restlichen Teils der Datei nicht ungültig macht.

---

## Textformatierung {#text-formatting}

Der Übersetzer sollte alle Inline-Formatierungen ohne Änderung des Markups übernehmen:

- **Fetter Text** signalisiert Wichtigkeit und sollte nach der Übersetzung fett bleiben.
- *Kursiver Text* wird zur Hervorhebung oder für Titel verwendet; die Bedeutung sollte erhalten bleiben.
- ~~Durchgestrichener Text~~ kennzeichnet veraltete oder entfernte Inhalte.
- `inline code` wird **niemals** übersetzt – Bezeichner, Funktionsnamen und Dateipfade müssen unverändert bleiben.
- Ein [Hyperlink](https://github.com/wsj-br/ai-i18n-tools) behält seine ursprüngliche URL; nur die Ankerbeschriftung wird übersetzt.

---

## Überschriften auf jeder Ebene {#headings-at-every-level}

### H3 — Konfiguration {#h3--configuration}

#### H4 — Ausgabeverzeichnis {#h4--output-directory}

##### H5 — Dateibenennung {#h5--file-naming}

###### H6 — Erweiterungsbehandlung {#h6--extension-handling}

Alle Überschriftenebenen übersetzen den Text, lassen aber Anker-IDs unverändert, damit bestehende Ankerlinks weiterhin funktionieren.

---

## Tabellen {#tables}

Tabellen sind eine häufige Quelle für Übersetzungsfehler. Jede Zelle wird einzeln übersetzt; Spaltentrenner und Ausrichtungssyntax bleiben erhalten.

| Funktion                 | Status         | Hinweise                                                         |
|--------------------------|----------------|------------------------------------------------------------------|
| Markdown-Übersetzung     | ✅ Stabil       | Segmente in SQLite zwischengespeichert                           |
| UI-String-Extraktion     | ✅ Stabil       | Liest `t("…")`-Aufrufe                                          |
| Plurale UI-Strings | ✅ Stabil | `t("…", { plurals: true, count })`; Katalog + flache JSON-Suffixe |
| JSON-Label-Übersetzung | ✅ Stabil | Docusaurus Sidebar/Navbar JSON |
| SVG-Textübersetzung | ✅ Stabil | Bewahrt die SVG-Struktur |
| Glossar-Erzwingung | ✅ Stabil | Projektbezogenes CSV-Glossar |
| Batch-Parallelität | ✅ Konfigurierbar | `batchConcurrency`-Schlüssel |

### Unterstützung von Links-nach-Rechts und Rechts-nach-Links {#left-to-right-and-right-to-left-support}

Die moderne Internationalisierung muss sowohl Links-nach-Rechts- (LTR) als auch Rechts-nach-Links- (RTL) Sprachen berücksichtigen. `ai-i18n-tools` gewährleistet die korrekte Handhabung der Textrichtung im gesamten Übersetzungsworkflow:

- Die Pipeline bewahrt automatisch die Leserichtung jedes Gebietsschemas. Zum Beispiel wird Arabisch (`ar`) RTL gerendert, während Englisch (`en-GB`), Portugiesisch (`pt`) und andere LTR bleiben.
- Beim Übersetzen von Markdown-Tabellen, Codebeispielen oder UI-Strings behalten die Tools die Ausrichtung und Inhaltsstruktur bei, sodass Tabellen und formatierte Blöcke sowohl in LTR- als auch in RTL-Kontexten natürlich angezeigt werden.
- Docusaurus und die Beispiel-Next.js-App respektieren beide die Leserichtung des Gebietsschemas im Browser und passen das Layout und die Textausrichtung entsprechend an.

| Leserichtung | Beispiel für Gebietsschema | Anzeige |
|:--------------:|:-----------------------|:-----------------------|
| LTR | `en-GB`, `es`, `pt-BR` | Standard Links-nach-Rechts |
| RTL | `ar`, `fa`, `he` | Rechts-nach-Links-Layout |

Dies stellt sicher, dass Dokumente und Schnittstellen korrekt aussehen, unabhängig von der Sprache oder Leserichtung des Benutzers.

---

## Listen {#lists}

### Ungeordnete Listen {#unordered}

- Der Übersetzungscache speichert einen Hash jedes Quellsegments.
- Nur Segmente, deren Hash sich seit dem letzten Durchlauf geändert hat, werden an das LLM gesendet.
- Dies macht inkrementelle Läufe sehr schnell – typischerweise nur wenige API-Aufrufe für kleine Bearbeitungen.

### Geordnete Listen {#ordered}

1. Fügen Sie `ai-i18n-tools` als Entwicklungsabhängigkeit hinzu.
2. Erstellen Sie `ai-i18n-tools.config.json` in Ihrem Projektstammverzeichnis.
3. Führen Sie `npx ai-i18n-tools sync` aus, um die erste vollständige Übersetzung durchzuführen.
4. Committen Sie die generierten Gebietsschemadateien zusammen mit Ihrer Quelle.
5. Bei nachfolgenden Läufen werden nur geänderte Segmente neu übersetzt.

### Verschachtelte Listen {#nested}

- **Dokumenten-Pipeline**
  - Quelle: jede `.md`- oder `.mdx`-Datei
  - Ausgabe: Docusaurus `i18n/`-Baum oder flache übersetzte Kopien
  - Cache: SQLite, indiziert nach Dateipfad + Segment-Hash
- **UI-Strings-Pipeline**
  - Quelle: JS/TS-Dateien mit `t("…")`-Aufrufen (einschließlich Pluralformen über `{ plurals: true, count }`)
  - Ausgabe: pro-Gebietsschema flaches JSON (`de.json`, `fr.json`, …) mit angehängten Schlüsseln für Pluralkategorien, falls zutreffend
  - Cache: der Master-`strings.json`-Katalog selbst

---

## Plurale UI-Strings {#plural-ui-strings}

Markdown-Dokumente auf dieser Website zeigen die Übersetzung von **Dokumenten**. Das **Pluralverhalten** für UI-Texte ist am einfachsten im [Next.js-Beispiel](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app) (`examples/nextjs-app/`) zu sehen, das eine React-App mit demselben Docusaurus-Inhaltsmodell kombiniert.

Die Startseite dieser App (`src/app/page.tsx`) enthält einen Abschnitt zur **Plural-Demo** und wiederholt eine Nachricht bei mehreren Beispielzählungen, damit Sie die Grammatik über verschiedene Sprachen hinweg vergleichen können (zum Beispiel Arabisch vs. Englisch). Jede Zeile ruft auf:

```typescript
t("This page has {{count}} sections", { plurals: true, count })
```

Verwenden Sie `plurals: true`, damit `extract` eine Pluralgruppe in `locales/strings.json` aufzeichnet und `translate-ui` die sprachspezifischen Flatfiles unter `public/locales/` füllt. Zur Laufzeit löst i18next den richtigen suffigierten Schlüssel für die aktive `count` auf; das Next-Beispiel verbindet Helfer in `src/lib/i18n.ts`.

Für Screenshots, Locale-URLs und Dateistruktur siehe **Plural-Beispiel** in der [Next.js-Beispiel-README](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/README.md).

---

## Codeblöcke {#code-blocks}

Codeblöcke werden **niemals** übersetzt. Der umgebende Text wird übersetzt, aber jedes Zeichen innerhalb des umzäunten Blocks wird wörtlich übernommen.

### Shell {#shell}

```bash
# Install the package
npm install --save-dev ai-i18n-tools

# Run a full sync
npx ai-i18n-tools sync

# Translate only documentation
npx ai-i18n-tools sync --no-ui --no-svg
```

### JSON-Konfiguration {#json-configuration}

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

### TypeScript {#typescript}

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

## Blockzitate {#blockquotes}

> „Die beste Internationalisierung ist für den Benutzer unsichtbar – er sieht einfach seine Sprache.“
>
> Eine korrekte Übersetzung geht über den Wortschatz hinaus. Sie passt Ton, Datumsformate, Zahlenformate und Leserichtung an, um sich in jeder Sprache nativ anzufühlen.

---

## Tabs (Docusaurus) {#tabs-docusaurus}

<Tabs>
  <TabItem value="apple" label="Apfel" default>
    Das ist ein Apfel 🍎
  </TabItem>
  <TabItem value="orange" label="Orange">
    Das ist eine Orange 🍊
  </TabItem>
  <TabItem value="banana" label="Banane">
    Das ist eine Banane 🍌
  </TabItem>
</Tabs>

---

## Hinweise (Docusaurus) {#admonitions-docusaurus}

Docusaurus-Hinweistitel werden übersetzt; die `:::`-Begrenzer und Typ-Schlüsselwörter bleiben erhalten.

:::note
Dieses Dokument ist bewusst reich an Markdown-Funktionen. Sein Hauptzweck ist es, als Testvorlage für Übersetzungen zu dienen – führen Sie `sync` aus und überprüfen Sie die Ausgabe, um sicherzustellen, dass jedes Element korrekt behandelt wird.
:::

:::tip
Sie können die übersetzte Formulierung für jedes Segment überschreiben, indem Sie die Ausgabedatei bearbeiten und `sync` erneut ausführen. Das Tool erkennt Ihre Bearbeitungen und fügt die korrigierte Formulierung automatisch dem Projektglossar hinzu.
:::

:::warning
Übertragen Sie das Verzeichnis `.translation-cache/` nicht in die Versionskontrolle. Der Cache ist maschinenspezifisch und wird bei jedem neuen Checkout neu generiert.
:::

:::danger
Das Löschen des Cache-Verzeichnisses erzwingt die Neuübersetzung jedes Segments von Grund auf. Dies kann teuer sein, wenn Ihre Dokumente groß sind. Verwenden Sie `sync --no-cache-write`, um einen Probelauf ohne Speicherung der Ergebnisse durchzuführen.
:::

---

## Bilder und lokalisierungsbewusstes Umschreiben von Pfaden {#images-and-locale-aware-path-rewriting}

Der alternative Bildtext wird in jede Sprache übersetzt. Darüber hinaus kann `ai-i18n-tools` auch **Bildpfade umschreiben** in der übersetzten Ausgabe über `postProcessing.regexAdjustments` – so kann jede Sprache auf ihren eigenen Screenshot verweisen, anstatt immer die englische Version anzuzeigen.

Das Quelldokument (Englisch) verweist auf:

```markdown
![The example Next.js app running in English](/img/screenshots/de/screenshot.png)
```

Der Konfigurationseintrag für diese Dokumentationsseite enthält:

```json
"regexAdjustments": [
  {
    "description": "Per-locale screenshot folders in docs-site static assets",
    "search": "screenshots/de/]+/",
    "replace": "screenshots/de/"
  }
]
```

Nach der Übersetzung wird die deutsche Ausgabe zu:

```markdown
![Die Beispiel-Next.js-App auf Deutsch](/img/screenshots/de/screenshot.png)
```

Hier ist der tatsächliche Screenshot der Next.js-App – er ist standardmäßig auf Englisch, aber wenn Sie dies in einer übersetzten Sprache lesen, sollte das Bild unten die App in Ihrer Sprache zeigen:

![Die Beispiel-Next.js-App – UI-Strings und diese Seite übersetzt von ai-i18n-tools](/img/screenshots/de/screenshot.png)

---

## Horizontale Linien und Zeilenumbrüche {#horizontal-rules-and-line-breaks}

Eine horizontale Linie (`---`) ist ein strukturelles Element und wird nicht übersetzt.

Der Inhalt darüber und darunter wird als separate Segmente behandelt, was dem LLM sauberere Kontextfenster bietet.
