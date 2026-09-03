---
sidebar_position: 2
title: Schnellstart
description: >-
  Erstellen Sie Ihr erstes übersetztes Dokument in weniger als fünf Minuten mit
  ai-i18n-tools und diesem Docusaurus-Beispielprojekt.
translation_last_updated: '2026-09-03T22:52:20.721Z'
source_file_mtime: '2026-07-10T22:50:38.005Z'
source_file_hash: bb346aef23ab36ff210d39e8af7bbe4359fe6fcc88ad584942ebe6504f2a0f7f
translation_language: de
source_file_path: docs/quick-start.md
translation_models:
  - google/gemini-2.5-flash
---



Befolgen Sie die folgenden Schritte, um Ihre erste Übersetzung mit `ai-i18n-tools` auszuführen. Dieser Leitfaden verwendet das Docusaurus-Beispiel, das Sie bereits lesen – jeder Befehl sollte aus dem Verzeichnis `examples/docusaurus-docs/` ausgeführt werden.

---

## Voraussetzungen {#prerequisites}

Stellen Sie vor dem Start sicher, dass Sie Folgendes haben:

- **Node.js 22.16+** – überprüfen Sie dies mit `node --version`
- **Einen OpenRouter API-Schlüssel** – registrieren Sie sich unter [openrouter.ai](https://openrouter.ai) und kopieren Sie Ihren Schlüssel vom Dashboard
- **pnpm 10.33+** – überprüfen Sie dies mit `pnpm --version`

---

## Schritt 1 – Abhängigkeiten installieren {#step-1--install-dependencies}

```bash
cd examples/docusaurus-docs
pnpm install
```

Dadurch wird `ai-i18n-tools` zusammen mit den von diesem Beispiel verwendeten Docusaurus-Paketen installiert.

---

## Schritt 2 – API-Schlüssel festlegen {#step-2--set-your-api-key}

Erstellen Sie eine Datei `.env` im Verzeichnis `examples/docusaurus-docs/`:

```bash
echo "OPENROUTER_API_KEY=sk-or-..." > .env
```

`ai-i18n-tools` liest diese Variable automatisch. Committen Sie `.env` niemals in die Versionskontrolle.

---

## Schritt 3 – Konfiguration überprüfen {#step-3--review-the-configuration}

Öffnen Sie `ai-i18n-tools.config.json`. Der relevante Abschnitt für die Dokumentationsübersetzung sieht wie folgt aus:

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["ar", "es", "fr", "de", "pt-BR"],
  "features": {
    "translateDocs": true
  },
  "docs": [
    {
      "description": "Docusaurus docs and shell JSON catalogs",
      "contentPaths": ["docs/"],
      "outputDir": "i18n",
      "docusaurusCatalogDir": "i18n/en",
      "addFrontmatter": true,
      "docsOutput": {
        "style": "docusaurus",
        "docsRoot": "docs",
        "postProcessing": {
          "regexAdjustments": [
            {
              "description": "Per-locale screenshot folders in static assets",
              "search": "screenshots/de/]+/",
              "replace": "screenshots/de/"
            }
          ]
        }
      }
    }
  ]
}
```

Das Array `contentPaths` weist das Tool an, welche Verzeichnisse (oder einzelne Dateien) übersetzt werden sollen. `outputDir` ist der Ort, an dem übersetzte Dateien geschrieben werden.

---

## Schritt 4 – Synchronisierung ausführen {#step-4--run-the-sync}

Übersetzen Sie die Dokumentation und Docusaurus-Shell-JSON:

```bash
pnpm run i18n:sync
```

Sie werden eine ähnliche Ausgabe sehen wie:

```text
[docs] Scanning docs/ — 2 files found
[docs] Translating to: ar, es, fr, de, pt-BR
[docs] feature-showcase.md — 14 segments translated (5 locales)
[docs] quick-start.md — 11 segments translated (5 locales)
[docs] Done in 8.3 s (cache: 0 hits, 100 misses)
```

Beim zweiten Durchlauf werden die meisten Segmente **Cache-Treffer** sein und die Übersetzung wird in weniger als einer Sekunde abgeschlossen sein.

---

## Schritt 5 – Ausgabe überprüfen {#step-5--inspect-the-output}

Übersetzte Dateien werden nach `i18n/<locale>/docusaurus-plugin-content-docs/current/` geschrieben. Öffnen Sie eine, um sie mit der Quelle zu vergleichen:

```bash
# Compare Spanish translation with English source
diff docs/quick-start.md \
     i18n/es/docusaurus-plugin-content-docs/current/quick-start.md
```

Wichtige Punkte zur Überprüfung:

- Codeblöcke sind **identisch** mit der Quelle – kein Code wurde übersetzt.
- Front-Matter-Werte (`title`, `description`) sind übersetzt.
- Inline-`code spans` innerhalb des Textes bleiben unverändert erhalten.
- Links behalten ihre ursprüngliche `href`; nur der Ankertext ändert sich.

---

## Schritt 6 – Docusaurus {#step-6--start-docusaurus} starten

```bash
pnpm start
```

Dies erstellt jedes Gebietsschema und stellt die Site bereit, sodass das Sprachmenü der Navigationsleiste funktioniert. Öffnen Sie [http://localhost:3100/quick-start](http://localhost:3100/quick-start) und wechseln Sie dann zu Portugiesisch (Brasilien) – zum Beispiel [http://localhost:3100/pt-BR/feature-showcase](http://localhost:3100/pt-BR/feature-showcase).

Während der Bearbeitung englischer Quellen bietet `pnpm dev` nur für das Standard-Gebietsschema ein Hot-Reload; führen Sie `pnpm start` erneut aus, um alle Gebietsschemas nach Änderungen zu aktualisieren.

---

## Was Sie als Nächstes erkunden sollten {#what-to-explore-next}

- Lesen Sie das [Translation Feature Showcase](./feature-showcase), um jedes Markdown-Element zu sehen, das `ai-i18n-tools` verarbeiten kann.
- Bearbeiten Sie einen Satz in `docs/feature-showcase.md` und führen Sie `pnpm run i18n:sync` erneut aus – nur dieses Segment wird an das LLM gesendet; der Rest wird aus dem Cache bereitgestellt.
- Fügen Sie einen Begriff zu `glossary-user.csv` hinzu, um eine konsistente Terminologie in allen Gebietsschemas zu gewährleisten.
- Für UI-Strings, Kardinalplurale, SVG-Übersetzung und eine flache README im selben Repository siehe das kombinierte [Next.js-Beispiel](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app).
