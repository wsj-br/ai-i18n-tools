<p align="center">
  <img src="../docs/public/ai-i18n-tools_logo.png" alt="ai-i18n-tools logo" width="128" />
</p>

# ai-i18n-tools

<small id="lang-list">[English (UK)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [Italiano](./README.it.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md)</small>

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

**Traduci la tua app e la tua documentazione con il modello AI di tua scelta, senza vincoli o riscritture.**

CLI e toolkit per l'internazionalizzazione di app JavaScript/TypeScript e siti di documentazione (VitePress, Starlight, Docusaurus, Nextra, Fumadocs, Astro, Markdown/MDX semplice). Usa preset integrati per OpenAI, Anthropic, Gemini, OpenRouter, Ollama e altro ancora, o qualsiasi API compatibile con OpenAI. Cambia provider o modello per progetto o per locale senza modificare la tua codebase.

## Funzionalità

| | |
| --- | --- |
| **Stringhe UI** | Estrai `t("…")` da JS/TS/Astro (e `data-i18n*` in HTML) → JSON flat per locale |
| **Documenti** | Traduci pagine Markdown, MDX e `.astro` per i principali framework di documentazione |
| **JSON** | Traduci bundle di locale JSON annidati quando il testo si trova al di fuori delle chiamate `t()` |
| **SVG** | Traduci etichette SVG illustrate tramite `translate-svg` |
| **Cache intelligente** | Cache SQLite condivisa — solo i segmenti nuovi o modificati raggiungono il modello |
| **Un `sync`** | Esegue extract → UI → SVG → docs → JSON nell'ordine corretto da una singola configurazione |

## Quale pipeline?

| Il tuo contenuto | Comando |
| --- | --- |
| La sorgente usa `t()` o marcatori HTML | **Stringhe UI** — `extract` / `translate-ui` |
| Pagine localizzate o siti di documentazione | **Documenti** — `translate-docs` |
| File di locale JSON annidati autonomi | **JSON** — `translate-json` |

Vedi [Cos'è ai-i18n-tools?](../docs/guide/what-is-ai-i18n-tools.md) per un confronto completo.

## Installa

Solo ESM. Richiede Node.js `>=22.16.0`.

```bash
pnpm add ai-i18n-tools
# or: npm install ai-i18n-tools
```

Imposta una chiave API per il tuo provider (il valore predefinito `init` usa OpenRouter; Ollama non ne ha bisogno):

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Configura il comando `ai-i18n-tools` di base (direnv, PATH, script `package.json` o `npx`) — vedi [Installazione](../docs/guide/installation.md).

## Avvio rapido

```bash
ai-i18n-tools init [-P <provider>]   # scaffold config (default: UI strings)
ai-i18n-tools sync                   # extract + translate per features
```

Scaffold orientati alla documentazione: `-t ui-docusaurus`, `ui-starlight`, `ui-vitepress`, `ui-nextra`, `ui-fumadocs`, `ui-astro-website` o `ui-json-bundles`.

Preferire `sync` all'incatenamento di singoli comandi di traduzione. Guida completa: [Avvio rapido](../docs/guide/quick-start.md).

## Documentazione

- [Sito della documentazione](https://wsj-br.github.io/ai-i18n-tools/) — guide, integrazioni e riferimenti
- [Installazione](../docs/guide/installation.md) · [Avvio rapido](../docs/guide/quick-start.md) · [Provider e modelli](../docs/guide/providers-and-models.md)
- [Stringhe UI](../docs/guide/ui-strings/) · [Documenti](../docs/guide/documents/) · [JSON](../docs/guide/json.md) · [SVG](../docs/guide/svg-translation/)
- [Integrazioni](../docs/guide/integrations/) — VitePress, Nextra, Fumadocs, Docusaurus, Astro
- [Riferimento CLI](../docs/reference/cli-commands/) · [Configurazione](../docs/reference/configuration.md) · [Helper di runtime](../docs/guide/runtime-helpers.md)
- [Esempi](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/) — demo eseguibili (`npx degit …`)
- [Contesto agente AI](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — guida all'integrazione per gli assistenti nei repository dei consumatori

## Contributo

Problemi e richieste pull sono benvenuti. Flussi di lavoro del manutentore per questo repository: [`AGENTS.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/AGENTS.md) e [`dev/DEVEL.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md).

## Licenza

MIT — vedi [LICENSE](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE).

Copyright © 2026 Waldemar Scudeller Jr.
