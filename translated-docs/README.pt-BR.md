<p align="center">
  <img src="../docs/public/ai-i18n-tools_logo.png" alt="ai-i18n-tools logo" width="128" />
</p>

<a id="ai-i18n-tools"></a>
# ai-i18n-tools

<small id="lang-list">[English (UK)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md)</small>

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg?event=release)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

**Traduza seu aplicativo e documentação com o modelo de IA de sua escolha — sem bloqueio, sem reescritas.**

CLI e kit de ferramentas para internacionalizar aplicativos JavaScript/TypeScript e sites de documentação. Extraia strings `t()`, traduza páginas Markdown/MDX, pacotes JSON e rótulos SVG — tudo a partir de uma única configuração, com predefinições integradas para OpenAI, Anthropic, Gemini, OpenRouter, Ollama e qualquer API compatível com OpenAI. Alterne o provedor ou modelo por projeto ou por localidade sem alterar sua base de código.

Funciona com [VitePress](https://vitepress.dev/), [Starlight](https://starlight.astro.build/), [Docusaurus](https://docusaurus.io/), [Nextra](https://nextra.site/), [Fumadocs](https://www.fumadocs.dev/), [Astro](https://astro.build/) e Markdown puro. Mantém seus catálogos existentes do [i18next](https://www.i18next.com/) (JSON de namespace ou strings de origem `t()`) e migra projetos do [Intlayer](https://intlayer.org/) com `migrate-intlayer`.

<a id="features"></a>
## Recursos

| | |
| --- | --- |
| **Strings de UI** | Extraia `t("…")` de JS/TS/Astro (e `data-i18n*` em HTML) → JSON plano por localidade |
| **Documentos** | Traduza páginas Markdown, MDX e `.astro` para os principais frameworks de documentação |
| **JSON** | Traduza pacotes de localidade aninhados quando a cópia estiver fora das chamadas `t()` |
| **SVG** | Traduza rótulos SVG ilustrados via `translate-svg` |
| **Cache inteligente** | Cache SQLite compartilhado — apenas segmentos novos ou alterados atingem o modelo |
| **Um `sync`** | Executa extração → UI → SVG → docs → JSON na ordem correta a partir de uma configuração |

<a id="which-pipeline"></a>
## Qual pipeline?

| Seu conteúdo | Comando |
| --- | --- |
| A fonte usa `t()` ou marcadores HTML | **Strings de UI** — `extract` / `translate-ui` |
| Páginas localizadas ou sites de documentos | **Documentos** — `translate-docs` |
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

Defina uma chave de API para seu provedor (o padrão `init` usa OpenRouter; Ollama não precisa de nenhuma):

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Configure o comando `ai-i18n-tools` puro (direnv, PATH, scripts `package.json` ou `npx`) — consulte [Instalação](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/installation).

<a id="quick-start"></a>
## Início rápido

```bash
ai-i18n-tools init [-P <provider>]   # scaffold config (default: UI strings)
ai-i18n-tools sync                   # extract + translate per features
```

Scaffolds orientados a documentos: `-t ui-docusaurus`, `ui-starlight`, `ui-vitepress`, `ui-nextra`, `ui-fumadocs`, `ui-astro-website` ou `ui-json-bundles`.

Prefira `sync` em vez de encadear comandos de tradução individuais. Passo a passo completo: [Início rápido](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/quick-start).

<a id="documentation"></a>
## Documentação

- [Site de documentação](https://wsj-br.github.io/ai-i18n-tools/pt-BR/) — guias, integrações e referência
- [Instalação](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/installation) · [Início rápido](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/quick-start) · [Provedores e modelos](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/providers-and-models)
- [Strings de UI](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/ui-strings/) · [Documentos](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/documents/) · [JSON](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/json) · [SVG](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/svg-translation/)
- [Integrações](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/integrations/) — VitePress, Nextra, Fumadocs, Docusaurus, Astro
- [Referência da CLI](https://wsj-br.github.io/ai-i18n-tools/pt-BR/reference/cli-commands/) · [Configuração](https://wsj-br.github.io/ai-i18n-tools/pt-BR/reference/configuration) · [Helpers de runtime](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/runtime-helpers)
- [Exemplos](https://wsj-br.github.io/ai-i18n-tools/pt-BR/examples) — demos executáveis (`npx degit …`)
- [Contexto do Agente de IA](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — guia de integração para assistentes em repositórios consumidores

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
