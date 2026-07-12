---
layout: home
title: ai-i18n-tools
description: >-
  CLI e toolkit para internacionalizar aplicações JavaScript/TypeScript e sites
  de documentação usando LLMs.
hero:
  name: ai-i18n-tools
  text: Traduza aplicativos e documentos com qualquer LLM
  tagline: >-
    Um arquivo de configuração, três modos de tradução e o provedor que você
    escolher — OpenAI, Anthropic, Gemini, OpenRouter, Ollama ou qualquer API
    compatível com OpenAI. Alterne modelos por projeto ou por localidade sem
    reescrever sua base de código.
  image:
    src: /ai-i18n-tools_logo.svg
    alt: Logotipo ai-i18n-tools
  actions:
    - theme: brand
      text: Começar
      link: /pt-BR/guide/quick-start
    - theme: alt
      text: Ver no GitHub
      link: https://github.com/wsj-br/ai-i18n-tools
    - theme: alt
      text: Pacote npm
      link: https://www.npmjs.com/package/ai-i18n-tools
features:
  - icon: 🌐
    title: Strings da UI
    details: >-
      Extraia chamadas t() de JS, TS e Astro. Gere JSON plano por localidade
      para i18next ou pesquisa SSG estática.
  - icon: 📄
    title: Documentos
    details: >-
      Traduza páginas Markdown, MDX e Astro para VitePress, Starlight,
      Docusaurus, Nextra, Fumadocs e sites estáticos simples.
  - icon: 📦
    title: Pacotes JSON
    details: >-
      JSON de localidade aninhada quando a cópia da UI reside fora das chamadas
      t() de origem — rótulos de tema, catálogos e substituições de aplicativos.
  - icon: 🔄
    title: Cache inteligente
    details: >-
      Cache SQLite compartilhado em cada pipeline. Apenas segmentos novos ou
      alterados são enviados ao modelo em novas execuções.
  - icon: 🔌
    title: Independente de provedor
    details: >-
      Predefinições integradas para as principais APIs LLM, além de endpoints
      personalizados compatíveis com OpenAI. Substitua o provedor ativo com -P.
  - icon: ⚡
    title: Um comando de sincronização
    details: >-
      Execute extract, translate-ui, translate-svg, translate-docs e
      translate-json na ordem correta a partir de uma única configuração.
---



<div class="home-badges">

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

</div>

<a id="quick-install"></a>
## Instalação rápida

O pacote publicado é **somente ESM**. Node.js `>=22.16.0` é necessário.

```bash
pnpm add ai-i18n-tools
# Set API key for your active provider — see preset table (default init: openrouter)
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
ai-i18n-tools init [-P <provider>]
ai-i18n-tools sync
```

Consulte [Instalação](/pt-BR/guide/installation) para [configurar o comando CLI básico](/pt-BR/guide/installation#using-the-cli) (incluindo [desenvolvimento de monorepo clonado](/pt-BR/guide/installation#cloned-monorepo)) e [Início rápido](/pt-BR/guide/quick-start) para modelos de scaffold.

<a id="which-pipeline-should-i-use"></a>
## Qual pipeline devo usar?

| Seu conteúdo | Comando |
| --- | --- |
| O código-fonte usa `t()` | **Strings de UI** — `extract` / `translate-ui` |
| Páginas localizadas ou sites de documentos | **Documentos** — `translate-docs` |
| Arquivos de localidade JSON aninhados autônomos | **JSON** — `translate-json` |

As ilustrações SVG usam um caminho `translate-svg` separado — não `docs[].contentPaths`. Consulte [O que é ai-i18n-tools?](/pt-BR/guide/what-is-ai-i18n-tools) para uma comparação completa.

<a id="explore-the-documentation"></a>
## Explorar a documentação

- [**Guia**](/pt-BR/guide/what-is-ai-i18n-tools) — modos de tradução, instalação, início rápido e integrações de framework
- [**Integrações**](/pt-BR/guide/integrations/) — VitePress, Nextra, Fumadocs, Docusaurus e Astro
- [**Provedores e modelos**](/pt-BR/guide/providers-and-models) — predefinições, cadeias de fallback e substituições `-P`
- [**Referência da CLI**](/pt-BR/reference/cli-commands/) — todos os comandos, sinalizadores e fluxos de trabalho
- [**Configuração**](/pt-BR/reference/configuration) — esquema `ai-i18n-tools.config.json` completo
- [**Exemplos**](/pt-BR/examples) — nove projetos de demonstração executáveis com `npx degit`
- [**Arquitetura**](/pt-BR/reference/architecture) — componentes internos, API programática e pontos de extensão

Para o guia completo no estilo npm (tabela de provedores, lista de comandos da CLI, inícios rápidos de framework), consulte o [README do repositório](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md). Integrando o pacote em seu próprio projeto? Comece com [Contexto do Agente de IA](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md).
