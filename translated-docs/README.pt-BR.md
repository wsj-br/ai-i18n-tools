<p align="center">
  <img src="../docs/public/ai-i18n-tools_logo.png" alt="ai-i18n-tools logo" width="128" />
</p>

<a id="ai-i18n-tools"></a>
# ai-i18n-tools

<small id="lang-list">[English (UK)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md)</small>

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg?event=release)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

[![Linux x64](https://img.shields.io/badge/Linux-x64-FCC624?logo=linux&logoColor=black)](https://github.com/wsj-br/ai-i18n-tools/releases) [![Linux arm64](https://img.shields.io/badge/Linux-arm64-FCC624?logo=linux&logoColor=black)](https://github.com/wsj-br/ai-i18n-tools/releases) [![macOS arm64](https://img.shields.io/badge/macOS-arm64-000000?logo=apple&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases) [![macOS x64](https://img.shields.io/badge/macOS-x64-000000?logo=apple&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases) [![Windows x64](https://img.shields.io/badge/Windows-x64-0078D6?logo=windows&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases)

**Traduza seu app, site e documentação com os modelos que você escolher em qualquer provedor de LLM. Uma única configuração, reexecuções em cache.**

CLI e kit de ferramentas que adiciona idiomas a aplicativos JavaScript/TypeScript, aplicativos Python e sites de documentação. O idioma de partida é `sourceLocale`, e pode ser qualquer idioma. Ele encontra o texto, o traduz e escreve os arquivos que seu projeto carrega. Predefinições integradas cobrem OpenAI, Anthropic, Gemini, OpenRouter, Ollama e qualquer API compatível com OpenAI. Alterne o provedor ou modelo por projeto ou por localidade.

Funciona com [VitePress](https://vitepress.dev/), [Starlight](https://starlight.astro.build/), [Docusaurus](https://docusaurus.io/), [Nextra](https://nextra.site/), [Fumadocs](https://www.fumadocs.dev/), [Astro](https://astro.build/), [Markdown simples](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/add-i18n-to-readme) (um README de repositório e outros arquivos `.md`), e HTML simples. Aplicativos Python usam `t()` / `_()` ou GNU gettext (Streamlit, FastAPI, Flask, Django e kits de ferramentas de desktop). Mantém seus catálogos [i18next](https://www.i18next.com/) existentes (JSON de namespace ou strings de origem `t()`). Funciona com [Intlayer](https://intlayer.org/) de duas maneiras: mantenha o Intlayer e preencha seus dicionários com `translate-intlayer`, ou migre para chamadas `t()` de string de origem com `migrate-intlayer`. O Intlayer continua sendo uma boa opção para dicionários de conteúdo tipados e sistemas de gerenciamento de tradução.

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

<a id="where-do-i-start"></a>
## Por onde começo?

| Você tem | Comece aqui |
| --- | --- |
| Um aplicativo JS/TS (React, Next.js, Node, CLI) com texto simples na origem | [Adicionar i18n a um aplicativo JS/TS](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/add-i18n-to-js) |
| Um aplicativo Python (Streamlit, FastAPI, Flask, Django, gettext) | [Adicionar i18n a um aplicativo Python](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/add-i18n-to-python) |
| Um site ou site de documentação (VitePress, Docusaurus, Starlight, Nextra, Fumadocs, Astro, HTML simples) | [Adicionar i18n a um site ou site de documentação](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/add-i18n-to-website) |
| Um README de repositório e outros arquivos Markdown (com ou sem um aplicativo) | [Adicionar i18n ao seu README e documentos Markdown](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/add-i18n-to-readme) |
| Código que já chama `t()` ou `_()` | [Strings de UI](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/ui-strings/) |
| Arquivos de localidade JSON aninhados autônomos | [JSON](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/json) |
| Diagramas SVG com rótulos de texto | [Tradução de SVG](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/svg-translation/) |
| Dicionários Intlayer (manter Intlayer, ou migrar para chamadas de string de origem) | [Traduzindo Intlayer no local](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/translating-intlayer) · [Migrando do Intlayer para chamadas de string de origem](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/migrating-from-intlayer) |

Veja [O que é ai-i18n-tools?](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/what-is-ai-i18n-tools) para entender como os pipelines se encaixam.

<a id="install"></a>
## Instalar

Somente ESM. Requer Node.js `>=22.16.0`.

```bash
pnpm add -D ai-i18n-tools
# or: npm install --save-dev ai-i18n-tools
```

Defina uma chave de API para o provedor que você passa para `init` (Ollama não precisa de nenhuma):

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# or, for OpenAI: export OPENAI_API_KEY=sk-your-key-here
```

Configure o comando `ai-i18n-tools` puro (direnv, PATH, scripts `package.json` ou `npx`) — consulte [Instalação](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/installation).

<a id="python-no-nodejs"></a>
### Python, sem Node.js

Linux e macOS:

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell):

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

O instalador seleciona o executável para esta máquina, verifica `SHA256SUMS.txt`, instala o comando como `ai-i18n-tools` e o adiciona a `PATH`. Os binários não são autenticados ou assinados com Authenticode. Etapas de download manual: [Executáveis autônomos](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/installation#standalone-executables).

Os quatro exemplos Python estão no repositório e em `ai-i18n-tools-python-examples.zip` no lançamento. Eles não estão dentro do tarball npm ou do executável.

<a id="quick-start"></a>
## Início rápido

Estruture a configuração para o que você tem, então siga o guia para seu caminho:

| Você tem | Estruturar | Então siga |
| --- | --- | --- |
| Um aplicativo JS/TS | `ai-i18n-tools init -P openrouter` | [Adicionar i18n a um aplicativo JS/TS](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/add-i18n-to-js) |
| Um aplicativo Python | `ai-i18n-tools init -t ui-python -P openrouter` | [Adicionar i18n a um aplicativo Python](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/add-i18n-to-python) |
| Um site ou site de documentação | `ai-i18n-tools init -t ui-vitepress -P openrouter` (troque o template pelo seu framework) | [Adicionar i18n a um site ou site de documentação](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/add-i18n-to-website) |
| Um README, com ou sem um aplicativo | `ai-i18n-tools init -P openrouter` (aplicativo JS/TS + README) ou `init -t docs-markdown` | [Adicionar i18n ao seu README e documentos Markdown](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/add-i18n-to-readme) |

Quando o projeto estiver pronto, execute `ai-i18n-tools sync`, depois `ai-i18n-tools status` para ver o que foi traduzido.

Um aplicativo JS/TS deve primeiro envolver seu texto em `t()`. Executado em texto simples, `sync` termina sem erro e não escreve nada útil. Seu framework de site também deve ter seu próprio roteamento i18n habilitado antes de `sync`.

Templates para sites: `ui-starlight`, `ui-docusaurus`, `ui-vitepress`, `ui-nextra`, `ui-fumadocs`, `ui-astro-website`, e `ui-plain-html` ou `docs-plain-html`. Somente README e Markdown: `docs-markdown`. Adicione `--with-readme` a qualquer outro template para incluir o bloco README. Outros templates Python: `ui-python-gettext`, `ui-python-flask`, `ui-python-django`. JSON i18next aninhado: `ui-json-bundles`. Lista completa: [Referência de configuração da CLI](https://wsj-br.github.io/ai-i18n-tools/pt-BR/reference/cli-commands/setup).

`suggest-models` classifica os modelos de chat do provedor ativo com base em benchmarks publicados, e `suggest-models --apply` substitui `translationModels`. A mesma classificação está na guia [Modelos](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/translation-dashboard/models). Guia: [Modelos de IA](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/ai-models). Referência de comando: [suggest-models](https://wsj-br.github.io/ai-i18n-tools/pt-BR/reference/cli-commands/models#suggest-models).

Prefira `sync` em vez de encadear comandos de tradução individuais. Passo a passo completo: [Início rápido](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/quick-start). Mais de um tipo de conteúdo em um projeto: [Combinando pipelines](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/combining-pipelines).

<a id="documentation"></a>
## Documentação

- [Site da documentação](https://wsj-br.github.io/ai-i18n-tools/pt-BR/) — guias, integrações e referência
- [Instalação](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/installation) · [Início rápido](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/quick-start) · [Provedores de LLM](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/providers-and-models) · [Modelos de IA](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/ai-models)
- [Strings de IU](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/ui-strings/) · [HTML simples](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/ui-strings/plain-html) · [Python](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/ui-strings/python) · [Documentos](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/documents/) · [Páginas HTML](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/documents/html-pages) · [JSON](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/json) · [SVG](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/svg-translation/)
- [Intlayer](https://intlayer.org/) — [traduzir dicionários no local](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/translating-intlayer) · [mover para chamadas de string de origem](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/migrating-from-intlayer)
- [Integrações](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/integrations/) — VitePress, Nextra, Fumadocs, Docusaurus, Astro e [Python](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/integrations/python)
- [Adicionar i18n ao seu projeto](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/add-i18n-to-your-project) — [aplicativo JS/TS](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/add-i18n-to-js) · [aplicativo Python](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/add-i18n-to-python) · [site ou site de documentação](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/add-i18n-to-website) · [README e documentos Markdown](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/add-i18n-to-readme) · [Combinando pipelines](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/combining-pipelines)
- [Referência da CLI](https://wsj-br.github.io/ai-i18n-tools/pt-BR/reference/cli-commands/) · [Configuração](https://wsj-br.github.io/ai-i18n-tools/pt-BR/reference/configuration) · [Auxiliares de tempo de execução](https://wsj-br.github.io/ai-i18n-tools/pt-BR/guide/runtime-helpers)
- [Exemplos](https://wsj-br.github.io/ai-i18n-tools/pt-BR/examples) — demos executáveis (`npx degit …`)
- [Contexto do Agente de IA](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — guia de integração para assistentes em repositórios de consumidor

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
