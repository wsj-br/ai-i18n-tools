<p align="center">
  <img src="../docs/public/ai-i18n-tools_logo.png" alt="ai-i18n-tools logo" width="128" />
</p>

<a id="ai-i18n-tools"></a>
# ai-i18n-tools

<small id="lang-list">[English (UK)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md)</small>

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg?event=release)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

**Traduza seu aplicativo e documentação com o modelo de IA de sua escolha — sem bloqueio, sem reescritas.**

CLI e toolkit para internacionalizar aplicações JavaScript/TypeScript, aplicações Python e sites de documentação. Extraia strings `t()`, traduza páginas Markdown, MDX e HTML, pacotes JSON e rótulos SVG — tudo a partir de uma única configuração, com predefinições integradas para OpenAI, Anthropic, Gemini, OpenRouter, Ollama e qualquer API compatível com OpenAI. Alterne o provedor ou o modelo por projeto ou por localidade sem alterar sua base de código.

Funciona com [VitePress](https://vitepress.dev/), [Starlight](https://starlight.astro.build/), [Docusaurus](https://docusaurus.io/), [Nextra](https://nextra.site/), [Fumadocs](https://www.fumadocs.dev/), [Astro](https://astro.build/), Markdown simples e HTML simples. Aplicações Python usam `t()` / `_()` ou GNU gettext (Streamlit, FastAPI, Flask, Django e toolkits de desktop). Mantém seus catálogos [i18next](https://www.i18next.com/) existentes (JSON de namespace ou strings de origem `t()`) e migra projetos [Intlayer](https://intlayer.org/) com `migrate-intlayer`.

<a id="features"></a>
## Recursos

| | |
| --- | --- |
| **Strings de UI** | Extraia `t("…")` / `_()` de JS/TS/Astro e Python, ou `data-i18n*` em um arquivo HTML → JSON simples por localidade ou GNU gettext |
| **Documentos** | Traduza páginas Markdown, MDX, `.astro` e HTML (um arquivo por localidade) |
| **JSON** | Traduza pacotes de localidade aninhados quando a cópia estiver fora das chamadas `t()` |
| **SVG** | Traduza rótulos SVG ilustrados via `translate-svg` |
| **Cache inteligente** | Cache SQLite compartilhado — apenas segmentos novos ou alterados atingem o modelo |
| **Um `sync`** | Executa extração → UI → SVG → docs → JSON na ordem correta a partir de uma configuração |
| **Python** | Executável independente em cada GitHub Release — a CLI é executada sem a instalação do Node.js |
| **Modelos classificados** | `suggest-models` classifica os modelos de chat do provedor ativo e pode escrever `translationModels` |

<a id="which-pipeline"></a>
## Qual pipeline?

| Seu conteúdo | Comando |
| --- | --- |
| A origem usa `t()` ou `_()` (JavaScript, TypeScript ou Python), gettext ou um arquivo HTML com marcadores `data-i18n*` | **Strings de UI** — `extract` / `translate-ui` |
| Páginas localizadas, sites de documentação ou um arquivo HTML por localidade | **Documentos** — `translate-docs` |
| Arquivos de localidade JSON aninhados autônomos | **JSON** — `translate-json` |
| Diagramas ou ilustrações com rótulos em SVG | **SVG** — `translate-svg` |

Consulte [O que é o ai-i18n-tools?](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/what-is-ai-i18n-tools) para uma comparação completa.

<a id="install"></a>
## Instalar

Somente ESM. Requer Node.js `>=22.16.0`.

```bash
pnpm add ai-i18n-tools
# or: npm install ai-i18n-tools
```

Defina uma chave de API para o provedor que você passa para `init` (Ollama não precisa de nenhuma):

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# or, for OpenAI: export OPENAI_API_KEY=sk-your-key-here
```

Configure o comando `ai-i18n-tools` puro (direnv, PATH, scripts `package.json` ou `npx`) — consulte [Instalação](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/installation).

<a id="python-no-nodejs"></a>
### Python, sem Node.js

Baixe o ativo correspondente no [GitHub Release](https://github.com/wsj-br/ai-i18n-tools/releases): `ai-i18n-tools-linux-x64`, `ai-i18n-tools-linux-arm64`, `ai-i18n-tools-macos-arm64`, `ai-i18n-tools-macos-x64` ou `ai-i18n-tools-win-x64.exe`. Verifique `SHA256SUMS.txt`, execute `chmod +x` no Unix e coloque o arquivo em `PATH`. Os binários não são autenticados (notarized) nem assinados com Authenticode. Os quatro exemplos em Python estão no repositório e em `ai-i18n-tools-python-examples.zip` no release. Eles não estão dentro do tarball npm ou do executável. Passos completos: [Executáveis independentes](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/installation#standalone-executables).

<a id="quick-start"></a>
## Início rápido

```bash
ai-i18n-tools init -P openrouter   # scaffold config (UI strings template)
ai-i18n-tools suggest-models         # optional ranked shortlist
ai-i18n-tools suggest-models --apply # write that list to translationModels
ai-i18n-tools sync                   # extract + translate per features
```

A lista de `init` é um ponto de partida. `suggest-models` classifica os modelos de chat do provedor ativo. `--apply` substitui `translationModels`. A mesma classificação está na aba [Modelos](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/translation-dashboard/models). Referência de comando: [suggest-models](https://wsj-br.github.io/ai-i18n-tools/pt-BR/reference/cli-commands/models#suggest-models).

Outros scaffolds: `-t ui-docusaurus`, `ui-starlight`, `ui-vitepress`, `ui-nextra`, `ui-fumadocs`, `ui-astro-website`, `ui-plain-html`, `docs-plain-html`, `ui-json-bundles`, `ui-python`, `ui-python-gettext`, `ui-python-django` ou `ui-python-flask`.

Prefira `sync` em vez de encadear comandos de tradução individuais. Passo a passo completo: [Início rápido](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/quick-start). Python: [Adicionar i18n a uma aplicação Python](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/add-i18n-to-python).

<a id="documentation"></a>
## Documentação

- [Site de documentação](https://wsj-br.github.io/ai-i18n-tools/pt-BR/) — guias, integrações e referência
- [Instalação](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/installation) · [Início rápido](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/quick-start) · [Provedores e modelos](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/providers-and-models)
- [Strings de UI](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/ui-strings/) · [HTML simples](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/ui-strings/plain-html) · [Python](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/ui-strings/python) · [Documentos](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/documents/) · [Páginas HTML](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/documents/html-pages) · [JSON](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/json) · [SVG](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/svg-translation/)
- [Integrações](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/integrations/) — VitePress, Nextra, Fumadocs, Docusaurus, Astro e [Python](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/integrations/python)
- [Adicionar i18n a uma aplicação Python](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/add-i18n-to-python)
- [Referência da CLI](https://wsj-br.github.io/ai-i18n-tools/pt-BR/reference/cli-commands/) · [Configuração](https://wsj-br.github.io/ai-i18n-tools/pt-BR/reference/configuration) · [Helpers de tempo de execução](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/runtime-helpers)
- [Exemplos](https://wsj-br.github.io/ai-i18n-tools/pt-BR/examples) — demos executáveis (`npx degit …`)
- [Contexto de Agente de IA](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — guia de integração para assistentes em repositórios de consumo

<a id="contributing"></a>
## Contribuindo

Problemas e pull requests são bem-vindos. Fluxos de trabalho do mantenedor para este repositório: [`AGENTS.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/AGENTS.md) e [`dev/DEVEL.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md).

<a id="license"></a>
## Licença

MIT — consulte [LICENSE](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE).

Copyright © 2026 Waldemar Scudeller Jr.

<br/>

Os nomes e ícones dos produtos pertencem a seus respectivos proprietários e são usados apenas para fins de identificação. Este software não é afiliado nem endossado por essas marcas.

<small>

> **Nota sobre as traduções da interface e da documentação:** Todos os idiomas da interface e da documentação, exceto o inglês (Reino Unido), foram traduzidos por IA usando este pacote (ai-i18n-tools); a redação pode ser imprecisa ou conter erros.

</small>
