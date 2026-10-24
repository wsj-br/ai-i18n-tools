---
layout: home
title: ai-i18n-tools
description: >-
  CLI und Toolkit zur Internationalisierung von
  JavaScript/TypeScript-Anwendungen, Python-Anwendungen und
  Dokumentations-Websites mit dem LLM-Anbieter Ihrer Wahl.
hero:
  name: ai-i18n-tools
  text: Apps & Docs mit jedem LLM übersetzen
  tagline: >-
    Extrahieren Sie t()-Strings aus JavaScript, TypeScript und Python.
    Übersetzen Sie Markdown, MDX, HTML-Seiten, JSON-Bundles und
    SVG-Beschriftungen – alles über eine einzige Konfiguration, mit OpenAI,
    Anthropic, Gemini, OpenRouter, Ollama oder jeder OpenAI-kompatiblen API.
    Wechseln Sie die Modelle pro Projekt oder pro Gebietsschema, ohne Ihre
    Codebasis umschreiben zu müssen.
  image:
    src: /ai-i18n-tools_logo.svg
    alt: ai-i18n-tools-Logo
  actions:
    - theme: brand
      text: Erste Schritte
      link: /de/guide/quick-start
    - theme: alt
      text: Auf GitHub ansehen
      link: https://github.com/wsj-br/ai-i18n-tools
    - theme: alt
      text: npm-Paket
      link: https://www.npmjs.com/package/ai-i18n-tools
features:
  - icon: 🌐
    title: UI-Strings
    details: >-
      Extrahieren Sie t() und _() aus JavaScript, TypeScript, Astro und Python
      oder data-i18n-Marker in einer HTML-Datei. Flache JSON-Dateien pro
      Gebietsschema oder GNU-gettext-Kataloge.
  - icon: 📄
    title: Dokumente
    details: >-
      Übersetzen Sie Markdown-, MDX-, Astro- und HTML-Seiten für VitePress,
      Starlight, Docusaurus, Nextra, Fumadocs und einfache statische Websites.
  - icon: 📦
    title: JSON-Bundles
    details: >-
      Verschachteltes JSON für Gebietsschemas, wenn UI-Texte außerhalb von
      Quell-t()-Aufrufen liegen – Themenbeschriftungen, Kataloge und
      App-Überschreibungen.
  - icon: 🔄
    title: Intelligentes Caching
    details: >-
      Gemeinsamer SQLite-Cache über jede Pipeline hinweg. Nur neue oder
      geänderte Segmente werden bei erneuten Ausführungen an das Modell
      gesendet.
  - icon: 🔌
    title: Anbieterunabhängig
    details: >-
      Integrierte Voreinstellungen für wichtige LLM-APIs sowie
      benutzerdefinierte OpenAI-kompatible Endpunkte. Überschreiben Sie den
      aktiven Anbieter mit -P.
  - icon: ⚡
    title: Ein Synchronisierungsbefehl
    details: >-
      Führen Sie extract, translate-ui, translate-svg, translate-docs und
      translate-json in der richtigen Reihenfolge aus einer einzigen
      Konfiguration aus.
  - icon: 🐍
    title: Python, kein Node.js
    details: >-
      Eine eigenständige ausführbare Datei in jedem GitHub-Release führt die CLI
      für Python-Apps aus. Streamlit, FastAPI, Flask, Django und gettext sind
      enthalten.
  - icon: 📊
    title: Rangliste der Modelle
    details: >-
      suggest-models bewertet die Chat-Modelle des aktiven Anbieters und kann
      translationModels schreiben. Die gleiche Rangliste befindet sich auf dem
      Tab „Models“ im Dashboard.
---



<div class="home-badges">

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg?event=release)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

</div>

<a id="quick-install"></a>
## Schnellinstallation

Das veröffentlichte Paket ist **nur ESM**. Node.js `>=22.16.0` ist erforderlich.

```bash
pnpm add ai-i18n-tools
# Set the API key for the provider you pass to init — see the preset table
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# or, for OpenAI: export OPENAI_API_KEY=sk-your-key-here
ai-i18n-tools init -P openrouter
ai-i18n-tools suggest-models
ai-i18n-tools sync
```

`suggest-models` bewertet die Modelle des aktiven Anbieters. Fügen Sie `--apply` hinzu, um die erstellte `translationModels`-Liste zu ersetzen. Siehe [Schnellstart](/de/guide/quick-start) und den Tab [Modelle](/de/guide/translation-dashboard/models).

<a id="python-no-nodejs"></a>
### Python, kein Node.js

Laden Sie die passende Datei von der [GitHub-Veröffentlichung](https://github.com/wsj-br/ai-i18n-tools/releases) herunter: `ai-i18n-tools-linux-x64`, `ai-i18n-tools-linux-arm64`, `ai-i18n-tools-macos-arm64`, `ai-i18n-tools-macos-x64` oder `ai-i18n-tools-win-x64.exe`. Überprüfen Sie `SHA256SUMS.txt`, führen Sie `chmod +x` unter Unix aus und legen Sie die Datei auf `PATH` ab. Die Binärdateien sind nicht signiert. Schritte: [Eigenständige ausführbare Dateien](/de/guide/installation#standalone-executables). Danach `ai-i18n-tools init -t ui-python -P cheaperinference`. Anleitung: [i18n zu einer Python-App hinzufügen](/de/guide/add-i18n-to-python).

Siehe [Installation](/de/guide/installation) zum [Konfigurieren des reinen CLI-Befehls](/de/guide/installation#using-the-cli) (einschließlich [Entwicklung geklonter Monorepos](/de/guide/installation#cloned-monorepo)) und [Schnellstart](/de/guide/quick-start) für Gerüstvorlagen.

<a id="which-pipeline-should-i-use"></a>
## Welche Pipeline soll ich verwenden?

| Ihr Inhalt | Befehl |
| --- | --- |
| Quellcode verwendet `t()` oder `_()` (JavaScript, TypeScript oder Python), gettext oder eine HTML-Datei mit Markern | **UI-Strings** — `extract` / `translate-ui` |
| Lokalisierte Seiten, Dokumentationsseiten oder eine HTML-Datei pro Locale | **Dokumente** — `translate-docs` |
| Eigenständige verschachtelte JSON-Gebietsschemadateien | **JSON** — `translate-json` |

SVG-Illustrationen verwenden einen separaten `translate-svg`-Pfad – nicht `docs[].contentPaths`. Einen vollständigen Vergleich finden Sie unter [Was ist ai-i18n-tools?](/de/guide/what-is-ai-i18n-tools).

<a id="explore-the-documentation"></a>
## Dokumentation erkunden

- [**Anleitung**](/de/guide/what-is-ai-i18n-tools) — Übersetzungsmodi, Installation, Schnellstart und Framework-Integrationen
- [**Integrationen**](/de/guide/integrations/) — VitePress, Nextra, Fumadocs, Docusaurus, Astro und Python
- [**Anbieter und Modelle**](/de/guide/providers-and-models) — Voreinstellungen, Fallback-Ketten, bewertete Vorschläge (`suggest-models`) und `-P`-Überschreibungen
- [**CLI-Referenz**](/de/reference/cli-commands/) — jeder Befehl, jedes Flag und jeder Workflow
- [**Konfiguration**](/de/reference/configuration) — vollständiges `ai-i18n-tools.config.json`-Schema
- [**Beispiele**](/de/examples) — siebzehn ausführbare Demoprojekte (`npx degit` oder die Python-Beispiele als ZIP)
- [**Architektur**](/de/reference/architecture) — Interna, programmatische API und Erweiterungspunkte

Möchten Sie das Paket in Ihr eigenes Projekt integrieren? Beginnen Sie mit [AI Agent Context](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md). Die [Repository-README](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md) ist eine kurze GitHub/npm-Landingpage, die für Details hierher verlinkt.

<br/>
<br/>

::: tip Haftungsausschluss
Produktnamen und Icons sind Eigentum ihrer jeweiligen Inhaber und werden ausschließlich zu Identifikationszwecken verwendet. Diese Software ist weder mit diesen Marken verbunden noch wird sie von ihnen unterstützt.

Alle Sprachen der Benutzeroberfläche und Dokumentation außer Englisch (UK) wurden mithilfe dieses Pakets (ai-i18n-tools) mit KI übersetzt; die Formulierungen können ungenau sein oder Fehler enthalten.
:::

<br/>
