---
sidebar_position: 2
title: Schnellstart
description: >-
  Erhalten Sie Ihr erstes übersetztes Dokument in unter fünf Minuten mithilfe
  von ai-i18n-tools mit diesem Next.js-Beispielprojekt.
translation_last_updated: '2026-04-13T15:45:39.064Z'
source_file_mtime: '2026-04-13T12:37:25.386Z'
source_file_hash: f28037e8c747358d722aeab10f171799df8f1dc59513a8295af098c8c30f9fa5
translation_language: de
source_file_path: docs-site/docs/quick-start.md
translation_models:
  - qwen/qwen3-235b-a22b-2507
---



# Schnellstart

Folgen Sie den unten stehenden Schritten, um Ihre erste Übersetzung mit `ai-i18n-tools` durchzuführen. Diese Anleitung verwendet das Beispiel-Next.js-Projekt, das Sie gerade lesen – alle Befehle sollten aus dem Verzeichnis `examples/nextjs-app/` ausgeführt werden.

---

## Voraussetzungen

Bevor Sie beginnen, stellen Sie sicher, dass Sie Folgendes haben:

- **Node.js 18+** — überprüfen Sie mit `node --version`
- **Ein OpenRouter-API-Schlüssel** — melden Sie sich unter [openrouter.ai](https://openrouter.ai) an und kopieren Sie Ihren Schlüssel aus dem Dashboard
- **npm oder pnpm** — beide Paketmanager funktionieren

---

## Schritt 1 – Abhängigkeiten installieren

```bash
cd examples/nextjs-app
npm install
```

Dies installiert `ai-i18n-tools` zusammen mit den Next.js- und Docusaurus-Paketen, die in diesem Beispiel verwendet werden.

---

## Schritt 2 – API-Schlüssel festlegen

Erstellen Sie eine `.env`-Datei im Verzeichnis `examples/nextjs-app/`:

```bash
echo "OPENROUTER_API_KEY=sk-or-..." > .env
```

`ai-i18n-tools` liest diese Variable automatisch. Committen Sie niemals `.env` in die Versionskontrolle.

---

## Schritt 3 – Konfiguration überprüfen

Öffnen Sie `ai-i18n-tools.config.json`. Der relevante Abschnitt für die Dokumentationsübersetzung sieht folgendermaßen aus:

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["es", "fr", "de", "pt-BR"],
  "features": {
    "translateMarkdown": true,
    "translateJSON": true
  },
  "documentations": [
    {
      "description": "Docusaurus docs and JSON UI strings under docs-site",
      "contentPaths": ["docs-site/docs/"],
      "outputDir": "docs-site/i18n",
      "markdownOutput": {
        "style": "docusaurus",
        "docsRoot": "docs-site/docs"
      }
    }
  ]
}
```

Das `contentPaths`-Array teilt dem Tool mit, welche Verzeichnisse (oder einzelnen Dateien) übersetzt werden sollen. Das `outputDir` ist das Verzeichnis, in das die übersetzten Dateien geschrieben werden.

---

## Schritt 4 – Sync ausführen

Übersetzen Sie nur die Dokumentation (überspringen Sie vorerst UI-Texte und SVGs):

```bash
npx ai-i18n-tools sync --no-ui --no-svg
```

Sie erhalten eine ähnliche Ausgabe wie:

```
[docs] Scanning docs-site/docs/ — 2 files found
[docs] Translating to: es, fr, de, pt-BR
[docs] feature-showcase.md — 14 segments translated (4 locales)
[docs] quick-start.md — 11 segments translated (4 locales)
[docs] Done in 8.3 s (cache: 0 hits, 100 misses)
```

Beim zweiten Durchlauf werden die meisten Segmente **Cache-Treffer** sein und die Übersetzung wird in unter einer Sekunde abgeschlossen sein.

---

## Schritt 5 – Ausgabe prüfen

Übersetzte Dateien werden nach `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/` geschrieben. Öffnen Sie eine, um sie mit der Quelle zu vergleichen:

```bash
# Compare Spanish translation with English source
diff docs-site/docs/quick-start.md \
     docs-site/i18n/es/docusaurus-plugin-content-docs/current/quick-start.md
```

Wichtige Dinge zur Überprüfung:

- Codeblöcke sind **identisch** mit der Quelle — kein Code wurde übersetzt.
- Front-Matter-Werte (`title`, `description`) sind übersetzt.
- Inline-`Code-Abschnitte` innerhalb des Fließtexts bleiben unverändert erhalten.
- Links behalten ihr ursprüngliches `href`; nur der Anker-Text wird übersetzt.

---

## Schritt 6 — Docusaurus starten

```bash
cd docs-site
npm run start -- --locale de
```

Dies startet den Docusaurus-Entwicklungsserver auf Deutsch. Öffnen Sie [http://localhost:3000/de/](http://localhost:3000/de/) in Ihrem Browser, um die übersetzten Dokumente durchzusehen.

---

## Was Sie als Nächstes erkunden können

- Lesen Sie das [Beispiel zur Übersetzungsfunktion](./feature-showcase), um alle Markdown-Elemente zu sehen, die `ai-i18n-tools` verarbeiten kann.
- Bearbeiten Sie einen Satz in `docs-site/docs/feature-showcase.md` und führen Sie erneut `sync` aus — nur dieses Segment wird an das LLM gesendet; der Rest wird aus dem Cache bereitgestellt.
- Fügen Sie einen Begriff zu `glossary-user.csv` hinzu, um eine einheitliche Terminologie über alle Sprachen hinweg sicherzustellen.
- Aktivieren Sie die UI-String-Pipeline, indem Sie `"translateUIStrings": true` setzen und `sync` ohne das Flag `--no-ui` ausführen.
