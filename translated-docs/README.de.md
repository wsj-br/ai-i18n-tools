<p align="center">
  <img src="../docs/public/ai-i18n-tools_logo.png" alt="ai-i18n-tools logo" width="128" />
</p>

# ai-i18n-tools

<small id="lang-list">[English (UK)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md)</small>

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

**Übersetzen Sie Ihre App und Dokumentation mit dem KI-Modell Ihrer Wahl – ohne Bindung, ohne Neuschreiben.**

CLI und Toolkit zur Internationalisierung von JavaScript/TypeScript-Apps und Dokumentationsseiten (VitePress, Starlight, Docusaurus, Nextra, Fumadocs, Astro, einfaches Markdown/MDX). Verwenden Sie integrierte Voreinstellungen für OpenAI, Anthropic, Gemini, OpenRouter, Ollama und mehr – oder jede OpenAI-kompatible API. Wechseln Sie den Anbieter oder das Modell pro Projekt oder pro Gebietsschema, ohne Ihre Codebasis zu ändern.

## Funktionen

| | |
| --- | --- |
| **UI-Strings** | Extrahieren Sie `t("…")` aus JS/TS/Astro (und `data-i18n*` in HTML) → flaches JSON pro Gebietsschema |
| **Dokumente** | Übersetzen Sie Markdown-, MDX- und `.astro`-Seiten für gängige Dokumentations-Frameworks |
| **JSON** | Übersetzen Sie verschachtelte Gebietsschema-Bundles, wenn der Inhalt außerhalb von `t()`-Aufrufen liegt |
| **SVG** | Übersetzen Sie illustrierte SVG-Beschriftungen über `translate-svg` |
| **Intelligenter Cache** | Geteilter SQLite-Cache – nur neue oder geänderte Segmente erreichen das Modell |
| **Ein `sync`** | Führt Extract → UI → SVG → Docs → JSON in der richtigen Reihenfolge aus einer Konfiguration aus |

## Welche Pipeline?

| Ihr Inhalt | Befehl |
| --- | --- |
| Quelle verwendet `t()` oder HTML-Marker | **UI-Strings** – `extract` / `translate-ui` |
| Lokalisierte Seiten oder Dokumentationsseiten | **Dokumente** — `translate-docs` |
| Eigenständige verschachtelte JSON-Gebietsschemadateien | **JSON** — `translate-json` |

Einen vollständigen Vergleich finden Sie unter [Was ist ai-i18n-tools?](../docs/guide/what-is-ai-i18n-tools.md).

## Installation

Nur ESM. Erfordert Node.js `>=22.16.0`.

```bash
pnpm add ai-i18n-tools
# or: npm install ai-i18n-tools
```

Legen Sie einen API-Schlüssel für Ihren Anbieter fest (Standard `init` verwendet OpenRouter; Ollama benötigt keinen):

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Konfigurieren Sie den reinen `ai-i18n-tools`-Befehl (direnv, PATH, `package.json`-Skripte oder `npx`) – siehe [Installation](../docs/guide/installation.md).

## Schnellstart

```bash
ai-i18n-tools init [-P <provider>]   # scaffold config (default: UI strings)
ai-i18n-tools sync                   # extract + translate per features
```

Dokumentationsorientierte Gerüste: `-t ui-docusaurus`, `ui-starlight`, `ui-vitepress`, `ui-nextra`, `ui-fumadocs`, `ui-astro-website` oder `ui-json-bundles`.

Bevorzugen Sie `sync` gegenüber dem Verketten einzelner Übersetzungsbefehle. Vollständige Anleitung: [Schnellstart](../docs/guide/quick-start.md).

## Dokumentation

- [Dokumentationsseite](https://wsj-br.github.io/ai-i18n-tools/) – Anleitungen, Integrationen und Referenz
- [Installation](../docs/guide/installation.md) · [Schnellstart](../docs/guide/quick-start.md) · [Anbieter und Modelle](../docs/guide/providers-and-models.md)
- [UI-Strings](../docs/guide/ui-strings/) · [Dokumente](../docs/guide/documents/) · [JSON](../docs/guide/json.md) · [SVG](../docs/guide/svg-translation/)
- [Integrationen](../docs/guide/integrations/) – VitePress, Nextra, Fumadocs, Docusaurus, Astro
- [CLI-Referenz](../docs/reference/cli-commands/) · [Konfiguration](../docs/reference/configuration.md) · [Laufzeit-Helfer](../docs/guide/runtime-helpers.md)
- [Beispiele](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/) – ausführbare Demos (`npx degit …`)
- [AI Agent Context](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) – Integrationsanleitung für Assistenten in Consumer-Repos

## Mitwirken

Probleme und Pull-Requests sind willkommen. Workflows für Maintainer für dieses Repository: [`AGENTS.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/AGENTS.md) und [`dev/DEVEL.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md).

## Lizenz

MIT – siehe [LICENSE](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE).

Copyright © 2026 Waldemar Scudeller Jr.
