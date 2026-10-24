---
layout: home
title: ai-i18n-tools
description: >-
  CLI e toolkit para internacionalizar aplicações JavaScript/TypeScript,
  aplicações Python e sites de documentação com o provedor de LLM de sua
  escolha.
hero:
  name: ai-i18n-tools
  text: Traduza aplicativos e documentos com qualquer LLM
  tagline: >-
    Extraia strings t() de JavaScript, TypeScript e Python. Traduza Markdown,
    MDX, páginas HTML, pacotes JSON e rótulos SVG — tudo a partir de uma única
    configuração, com OpenAI, Anthropic, Gemini, OpenRouter, Ollama ou qualquer
    API compatível com OpenAI. Alterne modelos por projeto ou por localidade sem
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
      Extraia t() e _() de JavaScript, TypeScript, Astro e Python, ou marcadores
      data-i18n em um arquivo HTML. JSON plano por localidade ou catálogos GNU
      gettext.
  - icon: 📄
    title: Documentos
    details: >-
      Traduza páginas Markdown, MDX, Astro e HTML para VitePress, Starlight,
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
  - icon: 🐍
    title: Python, sem Node.js
    details: >-
      Um executável independente em cada GitHub Release executa a CLI para
      aplicações Python. Streamlit, FastAPI, Flask, Django e gettext incluídos.
  - icon: 📊
    title: Lista de modelos classificados
    details: >-
      suggest-models classifica os modelos de chat do provedor ativo e pode
      gravar translationModels. A mesma classificação está na aba Models do
      painel.
---



<div class="home-badges">

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg?event=release)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

</div>

<a id="quick-install"></a>
## Instalação rápida

O pacote publicado é **somente ESM**. Node.js `>=22.16.0` é necessário.

```bash
pnpm add ai-i18n-tools
# Set the API key for the provider you pass to init — see the preset table
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# or, for OpenAI: export OPENAI_API_KEY=sk-your-key-here
ai-i18n-tools init -P openrouter
ai-i18n-tools suggest-models
ai-i18n-tools sync
```

`suggest-models` classifica os modelos do provedor ativo. Adicione `--apply` para substituir a lista `translationModels` gerada. Veja o [Início rápido](/pt-BR/guide/quick-start) e a aba [Modelos](/pt-BR/guide/translation-dashboard/models).

<a id="python-no-nodejs"></a>
### Python, sem Node.js

Baixe o arquivo correspondente do [lançamento do GitHub](https://github.com/wsj-br/ai-i18n-tools/releases): `ai-i18n-tools-linux-x64`, `ai-i18n-tools-linux-arm64`, `ai-i18n-tools-macos-arm64`, `ai-i18n-tools-macos-x64`, ou `ai-i18n-tools-win-x64.exe`. Verifique `SHA256SUMS.txt`, execute `chmod +x` no Unix e coloque o arquivo em `PATH`. Os binários não são assinados. Etapas: [Executáveis autônomos](/pt-BR/guide/installation#standalone-executables). Em seguida, `ai-i18n-tools init -t ui-python -P cheaperinference`. Passo a passo: [Adicionar i18n a um aplicativo Python](/pt-BR/guide/add-i18n-to-python).

Consulte [Instalação](/pt-BR/guide/installation) para [configurar o comando CLI básico](/pt-BR/guide/installation#using-the-cli) (incluindo [desenvolvimento de monorepo clonado](/pt-BR/guide/installation#cloned-monorepo)) e [Início rápido](/pt-BR/guide/quick-start) para modelos de scaffold.

<a id="which-pipeline-should-i-use"></a>
## Qual pipeline devo usar?

| Seu conteúdo | Comando |
| --- | --- |
| O código-fonte usa `t()` ou `_()` (JavaScript, TypeScript ou Python), gettext ou um arquivo HTML com marcadores | **Strings de interface** — `extract` / `translate-ui` |
| Páginas localizadas, sites de documentação ou um arquivo HTML por localidade | **Documentos** — `translate-docs` |
| Arquivos de localidade JSON aninhados autônomos | **JSON** — `translate-json` |

As ilustrações SVG usam um caminho `translate-svg` separado — não `docs[].contentPaths`. Consulte [O que é ai-i18n-tools?](/pt-BR/guide/what-is-ai-i18n-tools) para uma comparação completa.

<a id="explore-the-documentation"></a>
## Explorar a documentação

- [**Guia**](/pt-BR/guide/what-is-ai-i18n-tools) — modos de tradução, instalação, início rápido e integrações de framework
- [**Integrações**](/pt-BR/guide/integrations/) — VitePress, Nextra, Fumadocs, Docusaurus, Astro e Python
- [**Provedores e modelos**](/pt-BR/guide/providers-and-models) — predefinições, cadeias de fallback, sugestões classificadas (`suggest-models`) e substituições de `-P`
- [**Referência da CLI**](/pt-BR/reference/cli-commands/) — todos os comandos, sinalizadores e fluxos de trabalho
- [**Configuração**](/pt-BR/reference/configuration) — esquema completo de `ai-i18n-tools.config.json`
- [**Exemplos**](/pt-BR/examples) — dezessete projetos de demonstração executáveis (`npx degit` ou o zip de exemplos em Python)
- [**Arquitetura**](/pt-BR/reference/architecture) — internos, API programática e pontos de extensão

Integrando o pacote em seu próprio projeto? Comece com [AI Agent Context](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md). O [README do repositório](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md) é uma página de destino curta do GitHub/npm que direciona para cá para obter detalhes.

<br/>
<br/>

::: tip Aviso legal
Os nomes e ícones de produtos pertencem aos seus respectivos proprietários e são usados apenas para fins de identificação. Este software não é afiliado nem endossado por essas marcas.

Todos os idiomas da interface e da documentação, exceto o inglês (Reino Unido), foram traduzidos com IA usando este pacote (ai-i18n-tools); a redação pode ser imprecisa ou conter erros.
:::

<br/>
