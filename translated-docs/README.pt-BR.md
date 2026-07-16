<p align="center">
  <img src="../docs/public/ai-i18n-tools_logo.png" alt="ai-i18n-tools logo" width="128" />
</p>

# ai-i18n-tools

<small id="lang-list">[English (UK)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md)</small>

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

**Traduza seu aplicativo e documentação com o modelo de IA de sua escolha — sem bloqueio, sem reescritas.**

CLI e kit de ferramentas para internacionalizar aplicativos e sites de documentação JavaScript/TypeScript (VitePress, Starlight, Docusaurus, Nextra, Fumadocs, Astro, Markdown/MDX simples). Use predefinições integradas para OpenAI, Anthropic, Gemini, OpenRouter, Ollama e muito mais — ou qualquer API compatível com OpenAI. Troque de provedor ou modelo por projeto ou por localidade sem alterar sua base de código.

## Recursos

| | |
| --- | --- |
| **Strings de UI** | Extraia `t("…")` de JS/TS/Astro (e `data-i18n*` em HTML) → JSON plano por localidade |
| **Documentos** | Traduza páginas Markdown, MDX e `.astro` para os principais frameworks de documentação |
| **JSON** | Traduza pacotes de localidade aninhados quando a cópia estiver fora das chamadas `t()` |
| **SVG** | Traduza rótulos SVG ilustrados via `translate-svg` |
| **Cache inteligente** | Cache SQLite compartilhado — apenas segmentos novos ou alterados atingem o modelo |
| **Um `sync`** | Executa extração → UI → SVG → docs → JSON na ordem correta a partir de uma configuração |

## Qual pipeline?

| Seu conteúdo | Comando |
| --- | --- |
| A fonte usa `t()` ou marcadores HTML | **Strings de UI** — `extract` / `translate-ui` |
| Páginas localizadas ou sites de documentos | **Documentos** — `translate-docs` |
| Arquivos de localidade JSON aninhados autônomos | **JSON** — `translate-json` |

Consulte [O que é ai-i18n-tools?](../docs/guide/what-is-ai-i18n-tools.md) para uma comparação completa.

## Instalar

Somente ESM. Requer Node.js `>=22.16.0`.

```bash
pnpm add ai-i18n-tools
# or: npm install ai-i18n-tools
```

Defina uma chave de API para seu provedor (o padrão `init` usa OpenRouter; Ollama não precisa de nenhuma):

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Configure o comando `ai-i18n-tools` básico (direnv, PATH, scripts `package.json` ou `npx`) — consulte [Instalação](../docs/guide/installation.md).

## Início rápido

```bash
ai-i18n-tools init [-P <provider>]   # scaffold config (default: UI strings)
ai-i18n-tools sync                   # extract + translate per features
```

Scaffolds orientados a documentos: `-t ui-docusaurus`, `ui-starlight`, `ui-vitepress`, `ui-nextra`, `ui-fumadocs`, `ui-astro-website` ou `ui-json-bundles`.

Prefira `sync` em vez de encadear comandos de tradução individuais. Passo a passo completo: [Início rápido](../docs/guide/quick-start.md).

## Documentação

- [Site da documentação](https://wsj-br.github.io/ai-i18n-tools/) — guias, integrações e referência
- [Instalação](../docs/guide/installation.md) · [Início rápido](../docs/guide/quick-start.md) · [Provedores e modelos](../docs/guide/providers-and-models.md)
- [Strings da UI](../docs/guide/ui-strings/) · [Documentos](../docs/guide/documents/) · [JSON](../docs/guide/json.md) · [SVG](../docs/guide/svg-translation/)
- [Integrações](../docs/guide/integrations/) — VitePress, Nextra, Fumadocs, Docusaurus, Astro
- [Referência da CLI](../docs/reference/cli-commands/) · [Configuração](../docs/reference/configuration.md) · [Auxiliares de tempo de execução](../docs/guide/runtime-helpers.md)
- [Exemplos](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/) — demonstrações executáveis (`npx degit …`)
- [Contexto do Agente de IA](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — guia de integração para assistentes em repositórios de consumidores

## Contribuindo

Problemas e pull requests são bem-vindos. Fluxos de trabalho do mantenedor para este repositório: [`AGENTS.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/AGENTS.md) e [`dev/DEVEL.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md).

## Licença

MIT — consulte [LICENSE](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE).

Copyright © 2026 Waldemar Scudeller Jr.
