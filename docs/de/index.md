---
layout: home
title: ai-i18n-tools
description: >-
  CLI und Toolkit zur Internationalisierung von
  JavaScript/TypeScript-Anwendungen und Dokumentationsseiten mit LLMs.
hero:
  name: ai-i18n-tools
  text: Apps & Docs mit jedem LLM übersetzen
  tagline: >-
    Eine Konfigurationsdatei, drei Übersetzungsmodi und der von Ihnen gewählte
    Anbieter – OpenAI, Anthropic, Gemini, OpenRouter, Ollama oder jede
    OpenAI-kompatible API. Wechseln Sie Modelle pro Projekt oder pro
    Gebietsschema, ohne Ihren Code neu schreiben zu müssen.
  image:
    src: /logo.svg
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
      Extrahieren Sie t()-Aufrufe aus JS, TS und Astro. Generieren Sie flaches
      JSON pro Gebietsschema für i18next oder statische SSG-Suche.
  - icon: 📄
    title: Dokumente
    details: >-
      Übersetzen Sie Markdown-, MDX- und Astro-Seiten für VitePress, Starlight,
      Docusaurus, Nextra, Fumadocs und einfache statische Websites.
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
---



<div class="home-badges">

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

</div>

<a id="quick-install"></a>
## Schnellinstallation

Das veröffentlichte Paket ist **nur ESM**. Node.js `>=22.16.0` ist erforderlich.

```bash
pnpm add ai-i18n-tools
export OPENROUTER_API_KEY=sk-or-v1-your-key-here   # or your provider's env var
npx ai-i18n-tools init
npx ai-i18n-tools sync
```

Siehe [Installation](/de/guide/installation) für Details zum CLI-Aufruf und [Schnellstart](/de/guide/quick-start) für Gerüstvorlagen.

<a id="which-pipeline-should-i-use"></a>
## Welche Pipeline soll ich verwenden?

| Ihr Inhalt | Befehl |
| --- | --- |
| Quellcode verwendet `t()` | **UI-Strings** — `extract` / `translate-ui` |
| Lokalisierte Seiten oder Dokumentationsseiten | **Dokumente** — `translate-docs` |
| Eigenständige verschachtelte JSON-Gebietsschemadateien | **JSON** — `translate-json` |

SVG-Illustrationen verwenden einen separaten `translate-svg`-Pfad – nicht `docs[].contentPaths`. Einen vollständigen Vergleich finden Sie unter [Was ist ai-i18n-tools?](/de/guide/what-is-ai-i18n-tools).

<a id="explore-the-documentation"></a>
## Dokumentation erkunden

- [**Leitfaden**](/de/guide/what-is-ai-i18n-tools) – Übersetzungsmodi, Installation, Schnellstart und Framework-Integrationen
- [**Integrationen**](/de/guide/integrations/) – VitePress, Nextra, Fumadocs, Docusaurus und Astro
- [**Anbieter und Modelle**](/de/guide/providers-and-models) – Voreinstellungen, Fallback-Ketten und `-P`-Überschreibungen
- [**CLI-Referenz**](/de/reference/cli-commands/) – jeder Befehl, jedes Flag und jeder Workflow
- [**Konfiguration**](/de/reference/configuration) – vollständiges `ai-i18n-tools.config.json`-Schema
- [**Beispiele**](/de/examples) – neun ausführbare Demo-Projekte mit `npx degit`
- [**Architektur**](/de/reference/architecture) – Interna, programmatische API und Erweiterungspunkte

Die vollständige Anleitung im npm-Stil (Anbietertabelle, CLI-Befehlsliste, Framework-Schnellstarts) finden Sie im [Repository README](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md). Möchten Sie das Paket in Ihr eigenes Projekt integrieren? Beginnen Sie mit [AI Agent Context](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md).
