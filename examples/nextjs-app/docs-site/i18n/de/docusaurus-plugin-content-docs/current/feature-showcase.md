---
sidebar_position: 1
title: Übersicht der Übersetzungsfunktionen
description: >-
  Ein Referenzdokument, das jedes Markdown-Element zeigt, das ai-i18n-tools
  übersetzen kann.
translation_last_updated: '2026-05-24T19:47:32.675Z'
source_file_mtime: '2026-05-04T21:42:57.361Z'
source_file_hash: fc1e59d495d99d93de4381fb9475734f0221307ceac660a82ac03cdc06acc320
translation_language: de
source_file_path: docs-site/docs/feature-showcase.md
translation_models:
  - qwen/qwen3-235b-a22b-2507
---



import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Diese Seite dient dazu, zu demonstrieren, wie `ai-i18n-tools` jede gängige Markdown-Konstruktion behandelt. Führen Sie `sync` darauf aus und vergleichen Sie die Ausgabe in jedem Locale-Ordner, um genau zu sehen, was übersetzt wird und was unverändert bleibt.

---

## Nur-Text {#plain-text}

Internationalisierung bedeutet mehr als nur das Austauschen von Wörtern. Eine gute Übersetzungs-Pipeline erhält die Dokumentstruktur bei, bewahrt technische Kennungen und sendet nur menschlich lesbare Texte an das Sprachmodell.

`ai-i18n-tools` teilt jedes Dokument vor dem Senden an das LLM in **Segmente** auf. Jedes Segment wird unabhängig übersetzt und anschließend wieder zusammengesetzt, sodass eine Änderung an einem Absatz nicht die zwischengespeicherten Übersetzungen des restlichen Dokuments ungültig macht.

---

## Textformatierung {#text-formatting}

Der Übersetzer sollte alle Inline-Formatierungen übernehmen, ohne die Auszeichnung zu verändern:

- **Fetter Text** signalisiert Wichtigkeit und sollte nach der Übersetzung fett bleiben.
- _Kursiver Text_ wird für Betonung oder Titel verwendet; die Bedeutung sollte erhalten bleiben.
- ~~Durchgestrichen~~ markiert veraltete oder entfernte Inhalte.
- `inline code` wird **niemals** übersetzt — Kennungen, Funktionsnamen und Dateipfade müssen unverändert bleiben.
- Ein [Hyperlink](https://github.com/wsj-br/ai-i18n-tools) behält seine ursprüngliche URL bei; nur die Ankerbezeichnung wird übersetzt.

---

## Überschriften auf jeder Ebene {#headings-at-every-level}

### H3 — Konfiguration {#h3--configuration}

#### H4 — Ausgabeverzeichnis {#h4--output-directory}

##### H5 — Dateibenennung {#h5--file-naming}

###### H6 — Erweiterungshandling {#h6--extension-handling}

Alle Überschriftenebenen übersetzen den Text, lassen aber Anker-IDs unverändert, sodass vorhandene Ankerlinks weiterhin funktionieren.

---

## Tabellen {#tables}

Tabellen sind eine häufige Quelle für Übersetzungsfehler. Jede Zelle wird einzeln übersetzt; Spaltentrennzeichen und Ausrichtungssyntax bleiben erhalten.

| Funktion               | Status         | Hinweise                                                         |
|------------------------|----------------|------------------------------------------------------------------|
| Markdown-Übersetzung   | ✅ Stabil       | Segmente im SQLite-Cache gespeichert                             |
| UI-String-Extraktion | ✅ Stabil | Liest `t("…")`-Aufrufe |
| Plural-UI-Strings      | ✅ Stabil       | `t("…", { plurals: true, count })`; Katalog + flache JSON-Endungen |
| JSON-Label-Übersetzung | ✅ Stabil | Docusaurus-Seitenleiste/-Navbar JSON |
| SVG-Textübersetzung | ✅ Stabil | Behält die SVG-Struktur bei |
| Glossar-Einhaltung | ✅ Stabil | Projektbezogenes CSV-Glossar |
| Stapelverarbeitungskonkurrenz | ✅ Konfigurierbar | `batchConcurrency`-Schlüssel |

### Unterstützung für links-nach-rechts und rechts-nach-links {#left-to-right-and-right-to-left-support}

Moderne Internationalisierung muss sowohl Sprachen von links nach rechts (LTR) als auch von rechts nach links (RTL) unterstützen. `ai-i18n-tools` stellt sicher, dass die Textausrichtung im gesamten Übersetzungsprozess korrekt behandelt wird:

- Die Pipeline behält automatisch die Schreibrichtung jeder Locale bei. Beispielsweise wird Arabisch (`ar`) rechtsbündig dargestellt, während Englisch (`en-GB`), Portugiesisch (`pt`) und andere weiterhin linksbündig bleiben.
- Bei der Übersetzung von Markdown-Tabellen, Code-Beispielen oder UI-Strings bewahren die Tools die Ausrichtung und Struktur des Inhalts, sodass Tabellen und formatierte Blöcke sowohl in LTR- als auch in RTL-Kontexten natürlich angezeigt werden.
- Docusaurus und die beispielhafte Next.js-Anwendung berücksichtigen jeweils die Schreibrichtung der Locale im Browser und wechseln Layout und Textausrichtung entsprechend.

| Schreibrichtung | Beispiel-Locale        | Anzeige                |
|:--------------:|:-----------------------|:-----------------------|
|      LTR       | `en-GB`, `es`, `pt-BR` | Standard links-nach-rechts |
|      RTL       | `ar`, `fa`, `he`       | Rechts-nach-links-Layout   |

Dadurch wird sichergestellt, dass Dokumente und Schnittstellen korrekt aussehen, unabhängig von der Sprache oder Leserichtung des Benutzers.

---

## Listen {#lists}

### Ungeordnet {#unordered}

- Der Übersetzungs-Cache speichert einen Hash jedes Quellsegments.
- Nur Segmente, deren Hash sich seit dem letzten Durchlauf geändert hat, werden an das LLM gesendet.
- Dadurch sind inkrementelle Durchläufe sehr schnell – typischerweise nur wenige API-Aufrufe bei kleinen Änderungen.

### Geordnet {#ordered}

1. Fügen Sie `ai-i18n-tools` als Entwicklungsabhängigkeit hinzu.
2. Erstellen Sie `ai-i18n-tools.config.json` im Stammverzeichnis Ihres Projekts.
3. Führen Sie `npx ai-i18n-tools sync` aus, um die erste vollständige Übersetzung durchzuführen.
4. Committen Sie die generierten Lokalisierungsdateien zusammen mit Ihrem Quellcode.
5. Bei nachfolgenden Durchläufen werden nur geänderte Segmente erneut übersetzt.

### Geschachtelt {#nested}

- **Dokumenten-Pipeline**
  - Quelle: jede `.md`- oder `.mdx`-Datei
  - Ausgabe: Docusaurus `i18n/`-Baum oder flache übersetzte Kopien
  - Cache: SQLite, indiziert nach Dateipfad + Segment-Hash
- **UI-Strings-Pipeline**
  - Quelle: JS/TS-Dateien mit `t("…")`-Aufrufen (einschließlich Pluralformen über `{ plurals: true, count }`)
  - Ausgabe: flache JSON-Dateien pro Locale (`de.json`, `fr.json`, …) mit angehängten Schlüsseln für Plural-Kategorien, falls zutreffend
  - Cache: der Master-`strings.json`-Katalog selbst

---

## Plural-UI-Strings {#plural-ui-strings}

Markdown-Dokumente auf dieser Seite zeigen die **Dokument**-Übersetzung. Das **Plural**-Verhalten für UI-Texte lässt sich am besten im **beigelegten Next.js-Beispiel** nachvollziehen, das neben `docs-site/` unter `examples/nextjs-app/` liegt.

Die Startseite dieser App (`src/app/page.tsx`) enthält einen **Plural-Demo**-Abschnitt und wiederholt eine Nachricht mit mehreren Beispielanzahlen, sodass Sie die Grammatik zwischen verschiedenen Locales vergleichen können (z. B. Arabisch vs. Englisch). Jede Zeile ruft auf:

```typescript
t("This page has {{count}} sections", { plurals: true, count })
```

Verwenden Sie `plurals: true`, damit `extract` eine Pluralgruppe in `locales/strings.json` aufzeichnet und `translate-ui` die flachen Dateien pro Gebietsschema unter `public/locales/` füllt. Zur Laufzeit löst i18next den richtigen suffigierten Schlüssel für das aktive `count` auf; das Next-Beispiel verbindet Hilfsfunktionen in `src/lib/i18n.ts`.

Für Screenshots, Locale-URLs und die Dateistruktur siehe **Plural-Beispiel** in der [Next.js-Beispiel-README](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/README.md).

---

## Codeblöcke {#code-blocks}

Codeblöcke werden **niemals** übersetzt. Der umgebende Text wird übersetzt, aber jedes Zeichen innerhalb des umrahmten Blocks wird unverändert übernommen.

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
> Eine korrekte Übersetzung geht über den Wortschatz hinaus. Sie passt Tonlage, Datumsformate, Zahlenformate und Leserichtung an, sodass sie in jeder Sprachregion natürlich wirkt.

---

## Register (Docusaurus) {#tabs-docusaurus}

<Tabs>
  <TabItem value="apple" label="Apfel" default>
    Dies ist ein Apfel 🍎
  </TabItem>
  <TabItem value="orange" label="Orange">
    Dies ist eine Orange 🍊
  </TabItem>
  <TabItem value="banana" label="Banane">
    Dies ist eine Banane 🍌
  </TabItem>
</Tabs>

---

## Hinweise (Docusaurus) {#admonitions-docusaurus}

Docusaurus-Hinweistitel werden übersetzt; die `:::`-Umrahmungen und Typ-Schlüsselwörter bleiben erhalten.

:::note
Dieses Dokument enthält absichtlich viele Markdown-Elemente. Sein Hauptzweck ist es, als Testfall für Übersetzungen zu dienen – führen Sie `sync` aus und prüfen Sie die Ausgabe, um sicherzustellen, dass jedes Element korrekt verarbeitet wird.
:::

:::tip
Sie können die übersetzte Formulierung für jedes Segment überschreiben, indem Sie die Ausgabedatei bearbeiten und `sync` erneut ausführen. Das Tool erkennt Ihre Änderungen und fügt die korrigierte Formulierung automatisch dem Projektglossar hinzu.
:::

:::warning
Committen Sie das Verzeichnis `.translation-cache/` nicht in die Versionskontrolle. Der Cache ist maschinenspezifisch und wird bei jedem neuen Checkout neu generiert.
:::

:::danger
Wenn Sie das Cache-Verzeichnis löschen, muss jedes Segment von Grund auf neu übersetzt werden. Dies kann zeitaufwändig sein, wenn Ihre Dokumente groß sind. Verwenden Sie `sync --no-cache-write`, um einen Trockenlauf ohne Speicherung der Ergebnisse durchzuführen.
:::

---

## Bilder und lokalitätsbewusste Pfadumsetzung {#images-and-locale-aware-path-rewriting}

Alternativtexte für Bilder werden in jede Sprache übersetzt. Darüber hinaus kann `ai-i18n-tools` auch **Bildpfade in der übersetzten Ausgabe umschreiben** über `postProcessing.regexAdjustments` – sodass jede Sprachversion auf ihren eigenen Screenshot verweisen kann, anstatt immer die englische Version anzuzeigen.

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

Hier ist der eigentliche Screenshot der Next.js-App – sie ist standardmäßig auf Englisch, aber wenn Sie dies in einer übersetzten Sprachversion lesen, sollte das untenstehende Bild die App in Ihrer Sprache anzeigen:

![The example Next.js app — UI strings and this page translated by ai-i18n-tools](/img/screenshots/de/screenshot.png)

---

## Horizontale Linien und Zeilenumbrüche {#horizontal-rules-and-line-breaks}

Eine horizontale Linie (`---`) ist ein strukturelles Element und wird nicht übersetzt.

Der Inhalt oberhalb und unterhalb davon wird als separater Abschnitt behandelt, wodurch das KI-Modell klarere Kontextfenster erhält.
