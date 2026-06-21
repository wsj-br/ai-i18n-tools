---
title: Schnellstart
description: >-
  Erhalten Sie Ihr erstes übersetztes Dokument in unter fünf Minuten mithilfe
  von ai-i18n-tools anhand dieses Astro-Starlight-Beispiels.
sidebar:
  order: 2
translation_last_updated: '2026-06-21T00:43:36.714Z'
source_file_mtime: '2026-05-22T21:44:09.987Z'
source_file_hash: 2e7e3283a7dc1df486ce3088aa4f1bec3dac1bbce14d43f8d513a52fb0cd1cd9
translation_language: de
source_file_path: src/content/docs/quick-start.md
translation_models:
  - qwen/qwen3-235b-a22b-2507
---



Folgen Sie den unten stehenden Schritten, um Ihre erste Übersetzung mit `ai-i18n-tools` auszuführen. In dieser Anleitung wird das Starlight-Beispiel verwendet, das Sie gerade lesen – jeder Befehl sollte aus dem Verzeichnis `examples/astro-docs/` heraus ausgeführt werden.

---

<a id="prerequisites"></a>

## Voraussetzungen
Bevor Sie beginnen, stellen Sie sicher, dass Sie Folgendes haben:

- **Node.js 22.16+** – prüfen mit `node --version`
- **Ein OpenRouter-API-Schlüssel** – registrieren Sie sich unter [openrouter.ai](https://openrouter.ai) und kopieren Sie Ihren Schlüssel aus dem Dashboard
- **pnpm 10.33+** – prüfen mit `pnpm --version`

---

<a id="step-1--install-dependencies"></a>

## Schritt 1 – Abhängigkeiten installieren

```bash
cd examples/astro-docs
pnpm install
```

Dadurch werden `ai-i18n-tools` (über den Workspace), Astro und Starlight installiert.

---

<a id="step-2--set-your-api-key"></a>

## Schritt 2 – API-Schlüssel festlegen
Erstellen Sie eine Datei namens `.env` im Verzeichnis `examples/astro-docs/`:

```bash
echo "OPENROUTER_API_KEY=sk-or-..." > .env
```

`ai-i18n-tools` liest diese Variable automatisch. Führen Sie `.env` niemals in die Versionskontrolle ein.

---

<a id="step-3--review-the-configuration"></a>

## Schritt 3 – Konfiguration überprüfen
Öffnen Sie `ai-i18n-tools.config.json`. Der relevante Abschnitt für die Dokumentationsübersetzung sieht folgendermaßen aus:

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["ar", "es", "fr", "de", "pt-BR"],
  "features": {
    "translateMarkdown": true,
    "translateJSON": false
  },
  "documentations": [
    {
      "description": "Starlight docs under src/content/docs",
      "contentPaths": [
        "src/content/docs/quick-start.md",
        "src/content/docs/feature-showcase.mdx"
      ],
      "outputDir": "src/content/docs",
      "addFrontmatter": true,
      "markdownOutput": {
        "style": "astro-starlight",
        "docsRoot": "src/content/docs",
        "postProcessing": {
          "regexAdjustments": [
            {
              "description": "Per-locale screenshot folders in public assets",
              "search": "screenshots/de/",
              "replace": "screenshots/de/"
            }
          ]
        }
      }
    }
  ]
}
```

Das Array `contentPaths` teilt dem Tool mit, welche Dateien übersetzt werden sollen. Die übersetzten Kopien werden unter `src/content/docs/<locale>/` (den Sprachordnern von Starlight) abgelegt.

---

<a id="step-4--run-the-sync"></a>

## Schritt 4 – Sync ausführen
Übersetzen Sie die Dokumentation:

```bash
npx ai-i18n-tools sync --no-ui --no-svg
```

Die Ausgabe sieht in etwa so aus:

```text
[docs] Scanning src/content/docs/ — 2 files found
[docs] Translating to: ar, es, fr, de, pt-BR
[docs] feature-showcase.mdx — segments translated (5 locales)
[docs] quick-start.md — segments translated (5 locales)
```

Beim zweiten Durchlauf werden die meisten Segmente **Cache-Treffer** sein und die Übersetzung wird schnell abgeschlossen sein.

---

<a id="step-5--inspect-the-output"></a>

## Schritt 5 – Ausgabe überprüfen
Die übersetzten Dateien werden nach `src/content/docs/<locale>/` geschrieben. Öffnen Sie eine davon, um sie mit der Quelle zu vergleichen:

```bash
# Compare Spanish translation with English source
diff src/content/docs/quick-start.md \
     src/content/docs/es/quick-start.mdx
```

Wichtige Dinge zur Überprüfung:

- Codeblöcke sind **identisch** mit der Quelle – kein Code wurde übersetzt.
- Werte im Front Matter (`title`, `description`) werden übersetzt.
- Inline-`code spans` im Fließtext bleiben unverändert.
- Links behalten ihre ursprüngliche `href`; nur der Anker-Text ändert sich.

---

<a id="step-6--start-starlight"></a>

## Schritt 6 — Starlight starten

```bash
pnpm dev
```

Öffnen Sie [http://localhost:3050/de/quick-start](http://localhost:3050/de/quick-start) (oder wählen Sie ein anderes Gebietsschema über den Sprachumschalter), um die übersetzten Dokumente anzuzeigen.

---

<a id="step-7--explore-the-nextjs-demo-locale--cardinal-plurals"></a>

## Schritt 7 — Erkunden der Next.js-Demo (Gebietsschema + kardinale Plurale)
Die Übersetzung der Dokumentation in diesem Tutorial verwendet **ausschließlich Markdown**. Das Repository enthält außerdem eine **Next.js**-Benutzeroberfläche unter `examples/nextjs-app/` auf Port **3030**, in der Sie `t()`-Aufrufe, `?locale=`-URLs und eine Demo zu **kardinalen Pluralformen** sehen können.

```bash
cd ../nextjs-app
pnpm dev
```

Öffnen Sie anschließend [http://localhost:3030](http://localhost:3030).

- Wechseln Sie die Sprache über das Dropdown-Menü **Locale** oder fügen Sie `?locale=<code>` an (z. B. `http://localhost:3030/?locale=ar`).
- Scrollen Sie zu **Plurals: automatic generation usage example** und vergleichen Sie die Pluralregeln zwischen verschiedenen Gebietsschemata.
- Sehen Sie sich den Abschnitt **Cardinal plurals example** in der [Next.js-Beispiel-README](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/README.md) an.

---

<a id="what-to-explore-next"></a>

## Was Sie als Nächstes erkunden können
- Lesen Sie das [Translation Feature Showcase](./feature-showcase), um alle Markdown-Elemente zu sehen, die `ai-i18n-tools` verarbeiten kann.
- Bearbeiten Sie einen Satz in `src/content/docs/feature-showcase.mdx` und führen Sie `sync` erneut aus – nur dieses Segment wird an das LLM gesendet.
- Fügen Sie einen Begriff zu `glossary-user.csv` hinzu, um eine einheitliche Terminologie in allen Gebietsschemata sicherzustellen.
- Vergleichen Sie diese Starlight-Website mit der Docusaurus-Demo unter `examples/nextjs-app/docs-site/` (gleicher Inhalt, `style: "docusaurus"` vs. `style: "astro-starlight"`).
