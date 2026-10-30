<p align="center">
  <img src="../docs/public/ai-i18n-tools_logo.png" alt="ai-i18n-tools logo" width="128" />
</p>

<a id="ai-i18n-tools"></a>
# ai-i18n-tools

<small id="lang-list">[English (UK)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md)</small>

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg?event=release)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

[![Linux x64](https://img.shields.io/badge/Linux-x64-FCC624?logo=linux&logoColor=black)](https://github.com/wsj-br/ai-i18n-tools/releases) [![Linux arm64](https://img.shields.io/badge/Linux-arm64-FCC624?logo=linux&logoColor=black)](https://github.com/wsj-br/ai-i18n-tools/releases) [![macOS arm64](https://img.shields.io/badge/macOS-arm64-000000?logo=apple&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases) [![macOS x64](https://img.shields.io/badge/macOS-x64-000000?logo=apple&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases) [![Windows x64](https://img.shields.io/badge/Windows-x64-0078D6?logo=windows&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases)

**Übersetzen Sie Ihre App, Website und Dokumentation mit den Modellen Ihrer Wahl bei jedem LLM-Anbieter. Eine Konfiguration, gecachte Wiederholungen.**

CLI und Toolkit, das Sprachen zu JavaScript/TypeScript-Apps, Python-Apps und Dokumentations-Websites hinzufügt. Die Ausgangssprache ist `sourceLocale`, und es kann jede beliebige Sprache sein. Es findet den Text, übersetzt ihn und schreibt die Dateien, die Ihr Projekt lädt. Integrierte Voreinstellungen umfassen OpenAI, Anthropic, Gemini, OpenRouter, Ollama und jede OpenAI-kompatible API. Wechseln Sie den Anbieter oder das Modell pro Projekt oder pro Gebietsschema.

Funktioniert mit [VitePress](https://vitepress.dev/), [Starlight](https://starlight.astro.build/), [Docusaurus](https://docusaurus.io/), [Nextra](https://nextra.site/), [Fumadocs](https://www.fumadocs.dev/), [Astro](https://astro.build/), [reinem Markdown](https://wsj-br.github.io/ai-i18n-tools/de/guide/add-i18n-to-readme) (einer Repository-README und anderen `.md`-Dateien) und reinem HTML. Python-Apps verwenden `t()` / `_()` oder GNU gettext (Streamlit, FastAPI, Flask, Django und Desktop-Toolkits). Behält Ihre bestehenden [i18next](https://www.i18next.com/)-Kataloge (Namespace-JSON oder `t()`-Quellstrings). Funktioniert mit [Intlayer](https://intlayer.org/) auf zwei Arten: Behalten Sie Intlayer bei und füllen Sie dessen Dictionaries mit `translate-intlayer`, oder wechseln Sie zu Quellstring-`t()`-Aufrufen mit `migrate-intlayer`. Intlayer bleibt eine gute Wahl für typisierte Inhalts-Dictionaries und Übersetzungsmanagement-Systeme.

<a id="features"></a>
## Funktionen

| | |
| --- | --- |
| **UI-Strings** | Extrahieren Sie `t("…")` / `_()` aus JS/TS/Astro und Python oder `data-i18n*` in einer HTML-Datei → flaches JSON pro Locale oder GNU gettext |
| **Dokumente** | Übersetzen Sie Markdown-, MDX-, `.astro`- und HTML-Seiten (eine Datei pro Locale) |
| **JSON** | Übersetzen Sie verschachtelte Gebietsschema-Bundles, wenn der Inhalt außerhalb von `t()`-Aufrufen liegt |
| **SVG** | Übersetzen Sie illustrierte SVG-Beschriftungen über `translate-svg` |
| **Intelligenter Cache** | Geteilter SQLite-Cache – nur neue oder geänderte Segmente erreichen das Modell |
| **Ein `sync`** | Führt Extract → UI → SVG → Docs → JSON in der richtigen Reihenfolge aus einer Konfiguration aus |
| **Python** | Eigenständige ausführbare Datei bei jedem GitHub-Release – die CLI läuft ohne Node.js-Installation |
| **Ranglisten-Modelle** | `suggest-models` bewertet die Chat-Modelle des aktiven Providers und kann `translationModels` schreiben |

<a id="where-do-i-start"></a>
## Wo fange ich an?

| Sie haben | Beginnen Sie hier |
| --- | --- |
| Eine JS/TS-App (React, Next.js, Node, CLI) mit Klartext im Quellcode | [i18n zu einer JS/TS-App hinzufügen](https://wsj-br.github.io/ai-i18n-tools/de/guide/add-i18n-to-js) |
| Eine Python-App (Streamlit, FastAPI, Flask, Desktop, Skripte) | [i18n zu einer Python-App hinzufügen](https://wsj-br.github.io/ai-i18n-tools/de/guide/add-i18n-to-python) |
| Eine Django-App, Flask-Babel-Kataloge oder eine App, die bereits GNU gettext verwendet | [i18n zu einer Django-/Python-gettext-App hinzufügen](https://wsj-br.github.io/ai-i18n-tools/de/guide/add-i18n-to-django-gettext) |
| Eine Website oder Dokumentationsseite (VitePress, Docusaurus, Starlight, Nextra, Fumadocs, Astro, reines HTML) | [i18n zu einer Website oder Dokumentationsseite hinzufügen](https://wsj-br.github.io/ai-i18n-tools/de/guide/add-i18n-to-website) |
| Eine Repository-README und andere Markdown-Dateien (mit oder ohne App) | [i18n zu Ihrer README und Markdown-Dokumentation hinzufügen](https://wsj-br.github.io/ai-i18n-tools/de/guide/add-i18n-to-readme) |
| Code, der bereits `t()` oder `_()` aufruft | [UI-Strings](https://wsj-br.github.io/ai-i18n-tools/de/guide/ui-strings/) |
| Eigenständige verschachtelte JSON-Gebietsschema-Dateien | [JSON](https://wsj-br.github.io/ai-i18n-tools/de/guide/json) |
| SVG-Diagramme mit Textbeschriftungen | [SVG-Übersetzung](https://wsj-br.github.io/ai-i18n-tools/de/guide/svg-translation/) |
| Intlayer-Dictionaries (Intlayer beibehalten oder zu Quellstring-Aufrufen wechseln) | [Intlayer vor Ort übersetzen](https://wsj-br.github.io/ai-i18n-tools/de/guide/translating-intlayer) · [Migration von Intlayer zu Quellstring-Aufrufen](https://wsj-br.github.io/ai-i18n-tools/de/guide/migrating-from-intlayer) |

Siehe [Was ist ai-i18n-tools?](https://wsj-br.github.io/ai-i18n-tools/de/guide/what-is-ai-i18n-tools), um zu erfahren, wie die Pipelines zusammenpassen.

<a id="install"></a>
## Installieren

Nur ESM. Erfordert Node.js `>=22.16.0`.

```bash
pnpm add -D ai-i18n-tools
# or: npm install --save-dev ai-i18n-tools
```

Legen Sie einen API-Schlüssel für den Anbieter fest, den Sie an `init` übergeben (Ollama benötigt keinen):

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# or, for OpenAI: export OPENAI_API_KEY=sk-your-key-here
```

Konfigurieren Sie den reinen `ai-i18n-tools`-Befehl (direnv, PATH, `package.json`-Skripte oder `npx`) — siehe [Installation](https://wsj-br.github.io/ai-i18n-tools/de/guide/installation).

<a id="python-no-nodejs"></a>
### Python, kein Node.js

Linux und macOS:

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell):

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

Das Installationsprogramm wählt die ausführbare Datei für diesen Computer aus, prüft `SHA256SUMS.txt`, installiert den Befehl als `ai-i18n-tools` und fügt ihn zu `PATH` hinzu. Die Binärdateien sind nicht notariell beglaubigt oder Authenticode-signiert. Manuelle Download-Schritte: [Eigenständige ausführbare Dateien](https://wsj-br.github.io/ai-i18n-tools/de/guide/installation#standalone-executables).

Die vier Python-Beispiele befinden sich im Repository und in `ai-i18n-tools-python-examples.zip` im Release. Sie sind nicht im npm-Tarball oder in der ausführbaren Datei enthalten.

<a id="quick-start"></a>
## Schnellstart

Erstellen Sie die Konfiguration für Ihre Anforderungen, dann folgen Sie der Anleitung für Ihren Weg:

| Sie haben | Gerüst erstellen | Dann folgen Sie |
| --- | --- | --- |
| Eine JS/TS-App | `ai-i18n-tools init -P openrouter` | [i18n zu einer JS/TS-App hinzufügen](https://wsj-br.github.io/ai-i18n-tools/de/guide/add-i18n-to-js) |
| Eine Python-App | `ai-i18n-tools init -t ui-python -P openrouter` | [i18n zu einer Python-App hinzufügen](https://wsj-br.github.io/ai-i18n-tools/de/guide/add-i18n-to-python) |
| Eine Django- oder GNU-gettext-App | `ai-i18n-tools init -t ui-python-django -P openrouter` (oder `ui-python-gettext`, `ui-python-flask`) | [i18n zu einer Django-/Python-gettext-App hinzufügen](https://wsj-br.github.io/ai-i18n-tools/de/guide/add-i18n-to-django-gettext) |
| Eine Website oder Dokumentationsseite | `ai-i18n-tools init -t ui-vitepress -P openrouter` (tauschen Sie die Vorlage für Ihr Framework aus) | [i18n zu einer Website oder Dokumentationsseite hinzufügen](https://wsj-br.github.io/ai-i18n-tools/de/guide/add-i18n-to-website) |
| Eine README-Datei, mit oder ohne App | `ai-i18n-tools init -P openrouter` (JS/TS-App + README) oder `init -t docs-markdown` | [i18n zu Ihrer README-Datei und Markdown-Dokumentation hinzufügen](https://wsj-br.github.io/ai-i18n-tools/de/guide/add-i18n-to-readme) |

Wenn das Projekt bereit ist, führen Sie `ai-i18n-tools sync` aus, dann `ai-i18n-tools status`, um zu sehen, was übersetzt wurde.

Eine JS/TS-App muss ihren Text zuerst in `t()` einschließen. Wenn es auf Klartext ausgeführt wird, beendet `sync` den Vorgang fehlerfrei und schreibt nichts Nützliches. Ihr Site-Framework muss auch sein eigenes i18n-Routing aktiviert haben, bevor `sync`.

Templates für Websites: `ui-starlight`, `ui-docusaurus`, `ui-vitepress`, `ui-nextra`, `ui-fumadocs`, `ui-astro-website` und `ui-plain-html` oder `docs-plain-html`. Nur README und Markdown: `docs-markdown`. Fügen Sie `--with-readme` zu jeder anderen Vorlage hinzu, um den README-Block einzuschließen. Python-gettext-Apps: `ui-python-django`, `ui-python-flask`, `ui-python-gettext`. Verschachteltes i18next-JSON: `ui-json-bundles`. Vollständige Liste: [CLI-Setup-Referenz](https://wsj-br.github.io/ai-i18n-tools/de/reference/cli-commands/setup).

`suggest-models` erstellt eine Rangfolge für die Chat-Modelle des aktiven Anbieters anhand veröffentlichter Benchmarks und `suggest-models --apply` ersetzt `translationModels`. Die gleiche Rangfolge befindet sich auf der Registerkarte [Modelle](https://wsj-br.github.io/ai-i18n-tools/de/guide/translation-dashboard/models). Anleitung: [KI-Modelle](https://wsj-br.github.io/ai-i18n-tools/de/guide/ai-models). Befehlsreferenz: [suggest-models](https://wsj-br.github.io/ai-i18n-tools/de/reference/cli-commands/models#suggest-models).

Bevorzugen Sie `sync` gegenüber dem Verketten einzelner Übersetzungsbefehle. Vollständige Anleitung: [Schnellstart](https://wsj-br.github.io/ai-i18n-tools/de/guide/quick-start). Mehr als eine Art von Inhalt in einem Projekt: [Pipelines kombinieren](https://wsj-br.github.io/ai-i18n-tools/de/guide/combining-pipelines).

<a id="documentation"></a>
## Dokumentation

- [Dokumentationswebsite](https://wsj-br.github.io/ai-i18n-tools/de/) — Anleitungen, Integrationen und Referenz
- [Installation](https://wsj-br.github.io/ai-i18n-tools/de/guide/installation) · [Schnellstart](https://wsj-br.github.io/ai-i18n-tools/de/guide/quick-start) · [LLM-Anbieter](https://wsj-br.github.io/ai-i18n-tools/de/guide/providers-and-models) · [KI-Modelle](https://wsj-br.github.io/ai-i18n-tools/de/guide/ai-models)
- [UI-Zeichenfolgen](https://wsj-br.github.io/ai-i18n-tools/de/guide/ui-strings/) · [Reines HTML](https://wsj-br.github.io/ai-i18n-tools/de/guide/ui-strings/plain-html) · [Python](https://wsj-br.github.io/ai-i18n-tools/de/guide/ui-strings/python) · [Dokumente](https://wsj-br.github.io/ai-i18n-tools/de/guide/documents/) · [HTML-Seiten](https://wsj-br.github.io/ai-i18n-tools/de/guide/documents/html-pages) · [JSON](https://wsj-br.github.io/ai-i18n-tools/de/guide/json) · [SVG](https://wsj-br.github.io/ai-i18n-tools/de/guide/svg-translation/)
- [Intlayer](https://intlayer.org/) — [Wörterbücher direkt übersetzen](https://wsj-br.github.io/ai-i18n-tools/de/guide/translating-intlayer) · [auf Aufrufe mit Quellzeichenfolgen umstellen](https://wsj-br.github.io/ai-i18n-tools/de/guide/migrating-from-intlayer)
- [Integrationen](https://wsj-br.github.io/ai-i18n-tools/de/guide/integrations/) — VitePress, Nextra, Fumadocs, Docusaurus, Astro und [Python](https://wsj-br.github.io/ai-i18n-tools/de/guide/integrations/python)
- [i18n zu Ihrem Projekt hinzufügen](https://wsj-br.github.io/ai-i18n-tools/de/guide/add-i18n-to-your-project) — [JS/TS-App](https://wsj-br.github.io/ai-i18n-tools/de/guide/add-i18n-to-js) · [Python-App](https://wsj-br.github.io/ai-i18n-tools/de/guide/add-i18n-to-python) · [Django-/gettext-App](https://wsj-br.github.io/ai-i18n-tools/de/guide/add-i18n-to-django-gettext) · [Website oder Dokumentationsseite](https://wsj-br.github.io/ai-i18n-tools/de/guide/add-i18n-to-website) · [README- und Markdown-Dokumente](https://wsj-br.github.io/ai-i18n-tools/de/guide/add-i18n-to-readme) · [Pipelines kombinieren](https://wsj-br.github.io/ai-i18n-tools/de/guide/combining-pipelines)
- [CLI-Referenz](https://wsj-br.github.io/ai-i18n-tools/de/reference/cli-commands/) · [Konfiguration](https://wsj-br.github.io/ai-i18n-tools/de/reference/configuration) · [Laufzeit-Helfer](https://wsj-br.github.io/ai-i18n-tools/de/guide/runtime-helpers)
- [Beispiele](https://wsj-br.github.io/ai-i18n-tools/de/examples) — ausführbare Demos (`npx degit …`)
- [KI-Agent-Kontext](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — prägnanter Prompt / `AGENTS.md` Einstiegspunkt für Verbraucherprojekte
- [Portable Agent Skills](https://github.com/wsj-br/ai-i18n-tools/tree/main/skills) — eine Installation, dann ein Slash-Befehl pro Workflow: `npx skills add wsj-br/ai-i18n-tools --all -y` (Node.js 22.20+); [Installationsanleitung](https://wsj-br.github.io/ai-i18n-tools/de/guide/coding-agent-skill)

<a id="contributing"></a>
## Mitwirken

Probleme und Pull-Requests sind willkommen. Workflows für Maintainer für dieses Repository: [`AGENTS.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/AGENTS.md) und [`dev/DEVEL.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md).

<a id="license"></a>
## Lizenz

MIT – siehe [LICENSE](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE).

Copyright © 2026 Waldemar Scudeller Jr.

<br/>

Produktnamen und Icons sind Eigentum der jeweiligen Rechteinhaber und werden ausschließlich zu Identifikationszwecken verwendet. Diese Software ist weder mit diesen Marken verbunden noch wird sie von diesen unterstützt.

<small>

> **Hinweis zu UI- und Dokumentationsübersetzungen:** Alle Sprachen der Benutzeroberfläche und der Dokumentation, mit Ausnahme von Englisch (UK), wurden mithilfe von KI unter Verwendung dieses Pakets (ai-i18n-tools) übersetzt; die Formulierungen können ungenau sein oder Fehler enthalten.

</small>
