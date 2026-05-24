---
sidebar_position: 2
title: Schnellstart
description: >-
  Erhalten Sie Ihr erstes übersetzte Dokument in unter fünf Minuten mithilfe von
  ai-i18n-tools mit diesem Next.js-Beispielprojekt.
translation_last_updated: '2026-05-24T01:01:39.168Z'
source_file_mtime: '2026-05-04T22:22:41.551Z'
source_file_hash: bfe5380d21559e2ebd12913020cd7a9e50b1e85a76bc4436c438e90e9c09e1cf
translation_language: de
source_file_path: docs-site/docs/quick-start.md
translation_models:
  - qwen/qwen3-235b-a22b-2507
---



Folgen Sie den unten stehenden Schritten, um Ihre erste Übersetzung mit `ai-i18n-tools` durchzuführen. Diese Anleitung verwendet das Beispiel-Next.js-Projekt, das Sie gerade lesen – alle Befehle sollten aus dem Verzeichnis `examples/nextjs-app/` heraus ausgeführt werden.

---

## Voraussetzungen {#prerequisites}

Bevor Sie beginnen, stellen Sie sicher, dass Sie Folgendes haben:

- **Node.js 22.16+** — überprüfen mit `node --version`
- **Ein OpenRouter-API-Schlüssel** — registrieren Sie sich unter [openrouter.ai](https://openrouter.ai) und kopieren Sie Ihren Schlüssel aus dem Dashboard
- **pnpm 10.33+** — überprüfen mit `pnpm --version`

---

## Schritt 1 — Abhängigkeiten installieren {#step-1--install-dependencies}

```bash
cd examples/nextjs-app
pnpm install
```

Dadurch werden `ai-i18n-tools` sowie die von diesem Beispiel verwendeten Next.js- und Docusaurus-Pakete installiert.

---

## Schritt 2 — API-Schlüssel festlegen {#step-2--set-your-api-key}

Erstellen Sie eine `.env`-Datei im Verzeichnis `examples/nextjs-app/`:

```bash
echo "OPENROUTER_API_KEY=sk-or-..." > .env
```

`ai-i18n-tools` liest diese Variable automatisch. Führen Sie `.env` niemals in die Versionskontrolle ein.

---

## Schritt 3 — Konfiguration überprüfen {#step-3--review-the-configuration}

Öffnen Sie `ai-i18n-tools.config.json`. Der relevante Abschnitt für die Dokumentationsübersetzung sieht folgendermaßen aus:

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["ar", "es", "fr", "de", "pt-BR"],
    "features": {
    "extractUIStrings": true,
    "translateUIStrings": true,
    "translateMarkdown": true,
    "translateJSON": true,
    "translateSVG": true
  },
  "glossary": {
    "uiGlossary": "locales/strings.json",
    "userGlossary": "glossary-user.csv",
    "autoAddUserEditedToGlossary": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "locales/strings.json",
    "flatOutputDir": "public/locales/"
  },
  "cacheDir": ".translation-cache",
  "documentations": [
    {
      "description": "Docusaurus docs and JSON UI strings under docs-site",
      "contentPaths": ["docs-site/docs/"],
      "outputDir": "docs-site/i18n",
      "jsonSource": "docs-site/i18n/en",
      "addFrontmatter": true,
      "markdownOutput": {
        "style": "docusaurus",
        "docsRoot": "docs-site/docs",
        "postProcessing": {
          "regexAdjustments": [
            {
              "description": "Per-locale screenshot folders in docs-site static assets",
              "search": "screenshots/de/",
              "replace": "screenshots/${translatedLocale}/"
            }
          ]
        }
      }
    },
    {
      "description": "Root README only (flat markdown output)",
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "markdownOutput": {
        "style": "flat",
        "postProcessing": {
          "regexAdjustments": [
            {
              "description": "Per-locale screenshot folders under translated-docs",
              "search": "images/screenshots/[^/]+/",
              "replace": "images/screenshots/${translatedLocale}/"
            }
          ],
          "languageListBlock": {
            "start": "<small id=\"lang-list\">",
            "end": "</small>",
            "separator": " · "
          }
        }
      }
    }
  ],
  "svg": {
    "sourcePath": "images",
    "outputDir": "public/assets",
    "style": "flat"
  }
}
```

Das `contentPaths`-Array gibt an, welche Verzeichnisse (oder einzelnen Dateien) übersetzt werden sollen. In `outputDir` werden die übersetzten Dateien gespeichert.

---

## Schritt 4 — Sync ausführen {#step-4--run-the-sync}

Übersetzen Sie nur die Dokumentation (UI-Texte und SVGs werden vorerst übersprungen):

```bash
npx ai-i18n-tools sync --no-ui --no-svg
```

Die Ausgabe sieht in etwa so aus:

```text
[docs] Scanning docs-site/docs/ — 2 files found
[docs] Translating to: ar, es, fr, de, pt-BR
[docs] feature-showcase.md — 14 segments translated (5 locales)
[docs] quick-start.md — 11 segments translated (5 locales)
[docs] Done in 8.3 s (cache: 0 hits, 100 misses)
```

Beim zweiten Durchlauf werden die meisten Segmente **Cache-Treffer** sein und die Übersetzung wird in unter einer Sekunde abgeschlossen sein.

---

## Schritt 5 — Ausgabe prüfen {#step-5--inspect-the-output}

Übersetzte Dateien werden nach `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/` geschrieben. Öffnen Sie eine, um sie mit der Quelle zu vergleichen:

```bash
# Compare Spanish translation with English source
diff docs-site/docs/quick-start.md \
     docs-site/i18n/es/docusaurus-plugin-content-docs/current/quick-start.md
```

Wichtige Dinge zur Überprüfung:

- Codeblöcke sind **identisch** mit der Quelle – kein Code wurde übersetzt.
- Werte im Front Matter (`title`, `description`) werden übersetzt.
- Inline-`code spans` im Fließtext bleiben unverändert.
- Links behalten ihre ursprüngliche `href`; nur der Anker-Text ändert sich.

---

## Schritt 6 — Docusaurus starten {#step-6--start-docusaurus}

```bash
cd docs-site
pnpm start -- --locale de
```

Dies startet den Docusaurus-Entwicklungsserver auf Deutsch. Öffnen Sie [http://localhost:3040/de/](http://localhost:3040/de/) in Ihrem Browser, um die übersetzten Dokumente durchzublättern.

---

## Schritt 7 — Next.js-Demo erkunden (Sprachumgebung + Kardinal-Pluralformen) {#step-7--explore-the-nextjs-demo-locale--cardinal-plurals}

Die Dokumentationsübersetzung in diesem Tutorial verwendet **nur Markdown**. Das gleiche Beispiel-Repository enthält außerdem eine **Next.js**-Benutzeroberfläche auf Port **3030**, in der Sie `t()`-Aufrufe, `?locale=`-URLs und eine Demo für **kardinalen Plural** sehen können.

Aus `examples/nextjs-app/`:

```bash
pnpm dev
```

Öffnen Sie anschließend [http://localhost:3030](http://localhost:3030).

- Wechseln Sie die Sprache über das Dropdown-Menü **Locale** oder fügen Sie `?locale=<code>` an (z. B. `http://localhost:3030/?locale=ar`). Die Benutzeroberfläche hält Abfragezeichenfolge und Dropdown synchron.
- Scrollen Sie zu **Plural: Beispiel für die Verwendung der automatischen Generierung**. Die Seite wiederholt „This page has … sections“ für feste Beispielanzahlen (**1**, **2**, **5**, **50**), sodass Sie Pluralregeln zwischen verschiedenen Sprachgebieten vergleichen können (einschließlich Sprachen mit mehreren Pluralformen).
- Die Aufrufe verwenden `t("…", { plurals: true, count })`. Mit `extract` / `translate-ui` wird dieser Schlüssel zu einer Pluralgruppe in `locales/strings.json`; flache `public/locales/*.json`-Dateien enthalten die suffigierten Formen. Die Laufzeitintegration befindet sich in `src/lib/i18n.ts` – siehe den Abschnitt **Cardinal plurals example** in der [Beispiel-README](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/README.md) für eine kurze Anleitung.

---

## Was Sie als Nächstes erkunden können {#what-to-explore-next}

- Lesen Sie das [Übersetzungs-Feature-Beispiel](./feature-showcase), um alle Markdown-Elemente zu sehen, die `ai-i18n-tools` verarbeiten kann – einschließlich der Beziehung zwischen **kardinalen Plural-Texten in der Benutzeroberfläche** und dieser Dokumentations-Pipeline.
- Bearbeiten Sie einen Satz in `docs-site/docs/feature-showcase.md` und führen Sie `sync` erneut aus – nur dieses Segment wird an das LLM gesendet; der Rest wird aus dem Cache geliefert.
- Fügen Sie einen Begriff zu `glossary-user.csv` hinzu, um eine konsistente Terminologie in allen Sprachumgebungen sicherzustellen.
- Aktivieren Sie die Pipeline für Benutzeroberflächentexte, indem Sie `"translateUIStrings": true` setzen und `sync` ohne das `--no-ui`-Flag ausführen.
