---
sidebar_position: 2
title: Schnellstart
description: >-
  Erhalten Sie Ihr erstes übersetztes Dokument innerhalb von fünf Minuten
  mithilfe von ai-i18n-tools mit diesem Next.js-Beispielprojekt.
translation_last_updated: '2026-04-20T20:45:14.781Z'
source_file_mtime: '2026-04-20T20:03:51.319Z'
source_file_hash: 3781b3b6f01b12a0aa8b7f15cc792f0282715729066828ccf371d959d933a447
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
npm install
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
[docs] Translating to: es, fr, de, pt-BR
[docs] feature-showcase.md — 14 segments translated (4 locales)
[docs] quick-start.md — 11 segments translated (4 locales)
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
npm run start -- --locale de
```

Damit wird der Docusaurus-Entwicklungsserver auf Deutsch gestartet. Öffnen Sie [http://localhost:3000/de/](http://localhost:3000/de/) in Ihrem Browser, um die übersetzten Dokumente anzuzeigen.

---

## Schritt 7 — Next.js-Demo erkunden (Sprachumgebung + Kardinal-Pluralformen) {#step-7--explore-the-nextjs-demo-locale--cardinal-plurals}

Die Übersetzung der Dokumentation in diesem Tutorial verwendet **ausschließlich Markdown**. Das gleiche Beispiel-Repository enthält außerdem eine **Next.js**-Benutzeroberfläche auf Port **3030**, in der Sie **`t()`**-Aufrufe, **`?locale=`**-URLs und eine Demo zu **kardinalen Pluralformen** sehen können.

Aus `examples/nextjs-app/`:

```bash
npm run dev
```

Öffnen Sie anschließend [http://localhost:3030](http://localhost:3030).

- Wechseln Sie die Sprache über das Dropdown-Menü **Locale** oder fügen Sie **`?locale=<code>`** an (z. B. `http://localhost:3030/?locale=ar`). Die Benutzeroberfläche hält die Abfragezeichenfolge und das Dropdown synchron.
- Scrollen Sie zu **Plural: Beispiel für die Verwendung der automatischen Generierung**. Die Seite wiederholt „This page has … sections“ für feste Beispielanzahlen (**1**, **2**, **5**, **50**), sodass Sie die Pluralregeln zwischen verschiedenen Sprachumgebungen vergleichen können (einschließlich Sprachen mit mehreren Pluralformen).
- Die Aufrufe verwenden **`t("…", { plurals: true, count })`**. Mit **`extract`** / **`translate-ui`** wird dieser Schlüssel zu einer Pluralgruppe in `locales/strings.json`; flache **`public/locales/*.json`**-Dateien enthalten die suffigierten Formen. Die Laufzeit-Verknüpfung befindet sich in **`src/lib/i18n.ts`** — siehe den Abschnitt **Cardinal plurals example** in der [Beispiel-README](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/README.md) für eine kurze Anleitung.

---

## Was Sie als Nächstes erkunden können {#what-to-explore-next}

- Lesen Sie das [Übersetzungs-Feature-Beispiel](./feature-showcase), um alle Markdown-Elemente zu sehen, die `ai-i18n-tools` verarbeiten kann – einschließlich der Beziehung zwischen **kardinalen Plural-Texten in der Benutzeroberfläche** und dieser Dokumentations-Pipeline.
- Bearbeiten Sie einen Satz in `docs-site/docs/feature-showcase.md` und führen Sie `sync` erneut aus – nur dieses Segment wird an das LLM gesendet; der Rest wird aus dem Cache geliefert.
- Fügen Sie einen Begriff zu `glossary-user.csv` hinzu, um eine konsistente Terminologie in allen Sprachumgebungen sicherzustellen.
- Aktivieren Sie die Pipeline für Benutzeroberflächentexte, indem Sie `"translateUIStrings": true` setzen und `sync` ohne das `--no-ui`-Flag ausführen.
