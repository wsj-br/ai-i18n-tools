<p align="center">
  <img src="../docs/public/ai-i18n-tools_logo.png" alt="ai-i18n-tools logo" width="128" />
</p>

<a id="ai-i18n-tools"></a>
# ai-i18n-tools

<small id="lang-list">[English (UK)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md)</small>

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg?event=release)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

**Übersetzen Sie Ihre App und Dokumentation mit dem KI-Modell Ihrer Wahl – ohne Bindung, ohne Neuschreiben.**

CLI und Toolkit zur Internationalisierung von JavaScript/TypeScript-Apps und Dokumentationswebsites. Extrahieren Sie `t()`-Strings, übersetzen Sie Markdown/MDX-Seiten, JSON-Bundles und SVG-Labels – alles über eine einzige Konfiguration, mit integrierten Presets für OpenAI, Anthropic, Gemini, OpenRouter, Ollama und jede OpenAI-kompatible API. Wechseln Sie den Anbieter oder das Modell pro Projekt oder pro Locale, ohne Ihre Codebasis zu ändern.

Funktioniert mit [VitePress](https://vitepress.dev/), [Starlight](https://starlight.astro.build/), [Docusaurus](https://docusaurus.io/), [Nextra](https://nextra.site/), [Fumadocs](https://www.fumadocs.dev/), [Astro](https://astro.build/) und reinem Markdown. Erhält Ihre bestehenden [i18next](https://www.i18next.com/)-Kataloge (Namespace-JSON oder `t()`-Quellstrings) und migriert [Intlayer](https://intlayer.org/)-Projekte mit `migrate-intlayer`.

<a id="features"></a>
## Funktionen

| | |
| --- | --- |
| **UI-Strings** | Extrahieren Sie `t("…")` aus JS/TS/Astro (und `data-i18n*` in HTML) → flaches JSON pro Gebietsschema |
| **Dokumente** | Übersetzen Sie Markdown-, MDX- und `.astro`-Seiten für gängige Dokumentations-Frameworks |
| **JSON** | Übersetzen Sie verschachtelte Gebietsschema-Bundles, wenn der Inhalt außerhalb von `t()`-Aufrufen liegt |
| **SVG** | Übersetzen Sie illustrierte SVG-Beschriftungen über `translate-svg` |
| **Intelligenter Cache** | Geteilter SQLite-Cache – nur neue oder geänderte Segmente erreichen das Modell |
| **Ein `sync`** | Führt Extract → UI → SVG → Docs → JSON in der richtigen Reihenfolge aus einer Konfiguration aus |

<a id="which-pipeline"></a>
## Welche Pipeline?

| Ihr Inhalt | Befehl |
| --- | --- |
| Quelle verwendet `t()` oder HTML-Marker | **UI-Strings** – `extract` / `translate-ui` |
| Lokalisierte Seiten oder Dokumentationsseiten | **Dokumente** — `translate-docs` |
| Eigenständige verschachtelte JSON-Gebietsschemadateien | **JSON** — `translate-json` |
| Diagramme oder Illustrationen mit Beschriftungen in SVG | **SVG** — `translate-svg` |

Siehe [Was ist ai-i18n-tools?](https://wsj-br.github.io/ai-i18n-tools/de/guide/what-is-ai-i18n-tools) für einen vollständigen Vergleich.

<a id="install"></a>
## Installieren

Nur ESM. Erfordert Node.js `>=22.16.0`.

```bash
pnpm add ai-i18n-tools
# or: npm install ai-i18n-tools
```

Legen Sie einen API-Schlüssel für Ihren Anbieter fest (Standard `init` verwendet OpenRouter; Ollama benötigt keinen):

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Konfigurieren Sie den reinen `ai-i18n-tools`-Befehl (direnv, PATH, `package.json`-Skripte oder `npx`) — siehe [Installation](https://wsj-br.github.io/ai-i18n-tools/de/guide/installation).

<a id="quick-start"></a>
## Schnellstart

```bash
ai-i18n-tools init [-P <provider>]   # scaffold config (default: UI strings)
ai-i18n-tools sync                   # extract + translate per features
```

Dokumentationsorientierte Gerüste: `-t ui-docusaurus`, `ui-starlight`, `ui-vitepress`, `ui-nextra`, `ui-fumadocs`, `ui-astro-website` oder `ui-json-bundles`.

Bevorzugen Sie `sync` gegenüber der Verkettung einzelner Übersetzungsbefehle. Vollständige Anleitung: [Schnellstart](https://wsj-br.github.io/ai-i18n-tools/de/guide/quick-start).

<a id="documentation"></a>
## Dokumentation

- [Dokumentationswebsite](https://wsj-br.github.io/ai-i18n-tools/de/) — Anleitungen, Integrationen und Referenz
- [Installation](https://wsj-br.github.io/ai-i18n-tools/de/guide/installation) · [Schnellstart](https://wsj-br.github.io/ai-i18n-tools/de/guide/quick-start) · [Anbieter und Modelle](https://wsj-br.github.io/ai-i18n-tools/de/guide/providers-and-models)
- [UI-Strings](https://wsj-br.github.io/ai-i18n-tools/de/guide/ui-strings/) · [Dokumente](https://wsj-br.github.io/ai-i18n-tools/de/guide/documents/) · [JSON](https://wsj-br.github.io/ai-i18n-tools/de/guide/json) · [SVG](https://wsj-br.github.io/ai-i18n-tools/de/guide/svg-translation/)
- [Integrationen](https://wsj-br.github.io/ai-i18n-tools/de/guide/integrations/) — VitePress, Nextra, Fumadocs, Docusaurus, Astro
- [CLI-Referenz](https://wsj-br.github.io/ai-i18n-tools/de/reference/cli-commands/) · [Konfiguration](https://wsj-br.github.io/ai-i18n-tools/de/reference/configuration) · [Laufzeit-Helper](https://wsj-br.github.io/ai-i18n-tools/de/guide/runtime-helpers)
- [Beispiele](https://wsj-br.github.io/ai-i18n-tools/de/examples) — ausführbare Demos (`npx degit …`)
- [KI-Agenten-Kontext](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — Integrationsleitfaden für Assistenten in Consumer-Repos

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
