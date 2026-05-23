<a id="ai-i18n-tools"></a>
# ai-i18n-tools

[![Versão do npm](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![Downloads do npm](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/)
[![Licença: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

CLI e toolkit para internacionalização de aplicações JavaScript/TypeScript e sites de documentação usando modelos de linguagem grandes por meio do [OpenRouter](https://openrouter.ai/). Dois fluxos de trabalho independentes: **Tradução de UI** extrai chamadas `t("…")` e gera JSON pronto para uso com i18next; **Tradução de Documentos** traduz arquivos markdown, MDX e SVG com um cache inteligente em SQLite, enviando ao LLM apenas os segmentos alterados.

<small>**Leia em outros idiomas:** </small>
<small id="lang-list">[English (GB)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [中文 (中国大陆)](./README.zh-CN.md) · [中文 (台灣)](./README.zh-TW.md)</small>

<small>Os READMEs e documentos traduzidos são enviados em [`translated-docs/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/translated-docs) no GitHub; o pacote npm inclui apenas `docs/` em inglês.</small>

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Tabela de Conteúdos**

- [Dois fluxos de trabalho principais](#two-core-workflows)
- [Instalação](#installation)
  - [Usando a CLI](#using-the-cli)
- [OpenRouter](#openrouter)
- [Primeiros passos](#quick-start)
  - [Fluxo de trabalho 1 - Tradução de UI](#workflow-1---ui-translation)
  - [Fluxo de trabalho 2 - Tradução de Documentos](#workflow-2---document-translation)
  - [Ambos os fluxos de trabalho](#both-workflows)
- [Auxiliares de tempo de execução](#runtime-helpers)
- [Comandos da CLI](#cli-commands)
- [Documentação](#documentation)
- [Licença](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="two-core-workflows"></a>
## Dois fluxos de trabalho principais

**Fluxo de trabalho 1 - Tradução de UI** — para qualquer projeto JS/TS que use i18next (React, Next.js, Node.js, CLIs)

Analisa arquivos-fonte em busca de literais `t("…")` / `i18n.t("…")`, cria um catálogo mestre (`strings.json`), traduz entradas ausentes por localidade via OpenRouter e gera arquivos JSON planos (`de.json`, `pt-BR.json`, …) prontos para uso com i18next.

**Fluxo de trabalho 2 - Tradução de Documentos** — para documentos em markdown/MDX (Docusaurus, Astro Starlight, arquivos README simples)

Traduz arquivos-fonte `.md` e `.mdx` para todas as localidades de destino com um cache compartilhado em SQLite — apenas segmentos novos ou alterados são enviados ao LLM. JSON opcional de estrutura do Docusaurus (`jsonSource`, proveniente de `write-translations`) cobre strings da interface como navbar, rodapé e temas. A tradução de arquivos SVG é habilitada por meio de `features.translateSVG` e do bloco `svg` no nível superior.

Ambos os fluxos de trabalho compartilham um único arquivo `ai-i18n-tools.config.json` e podem ser usados de forma independente ou conjunta.

---

<a id="installation"></a>
## Instalação

O pacote publicado é **somente ESM** (`"type": "module"`). Requer Node.js `>=22.16.0`.

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
```

<a id="using-the-cli"></a>
### Usando a CLI

**Por projeto (recomendado)** — instale como dependência de desenvolvimento e execute via `npx`, `pnpm exec` ou um script `package.json`:

```bash
pnpm add -D ai-i18n-tools     # or: npm i -D ai-i18n-tools
npx ai-i18n-tools sync        # or: pnpm exec ai-i18n-tools sync
```

```json
"scripts": {
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate": "ai-i18n-tools translate-docs"
}
```

**Execução única sem instalação** — use `npx ai-i18n-tools <cmd>` ou `pnpm dlx ai-i18n-tools <cmd>` (faz download apenas para aquela execução).

> **Dica:** Para executar `ai-i18n-tools` diretamente em um shell interativo sem `npx`, adicione `node_modules/.bin` ao seu `PATH` (bash/zsh: `export PATH="$PWD/node_modules/.bin:$PATH"`). Veja [Introdução](docs/GETTING_STARTED.pt-BR.md#installation) para instruções sobre direnv e Windows.

Defina sua chave de API do OpenRouter:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

<a id="openrouter"></a>
## OpenRouter

Comandos que chamam o OpenRouter (`translate-ui`, `translate-docs`, `sync`, `check-models` e scripts relacionados) precisam de `OPENROUTER_API_KEY` no ambiente. `check-markdown` não utiliza o OpenRouter.

Em `ai-i18n-tools.config.json`, o objeto `openrouter` inclui listas de modelos, `baseUrl`, `maxTokens`, `temperature` e `requestTimeoutMs`: o tempo máximo em milissegundos para aguardar cada requisição HTTP ao OpenRouter (conclusões de chat e chamadas internas `GET /models`). O padrão é `30000` (30 segundos).

Execute `ai-i18n-tools check-models` para verificar cada ID de modelo configurado em relação ao catálogo atualizado do OpenRouter. Ele informa os IDs ausentes ou expirados `expiration_date`, lista os modelos válidos com preços estimados de entrada/saída (USD por 1 milhão de tokens) e encerra com um status diferente de zero caso algum ID configurado seja inválido. Requer `OPENROUTER_API_KEY`.

---

<a id="quick-start"></a>
## Primeiros passos

<a id="workflow-1---ui-translation"></a>
### Fluxo de trabalho 1 - Tradução de UI

```bash
# 1. Create config
npx ai-i18n-tools init

# 2. Extract UI strings to strings.json
npx ai-i18n-tools extract

# 3. Translate to all target locales
npx ai-i18n-tools translate-ui
```

Em seguida, configure o i18next em seu aplicativo usando os auxiliares de `'ai-i18n-tools/runtime'`. Veja [Etapa 4: Configurar i18next em tempo de execução](docs/GETTING_STARTED.pt-BR.md#step-4-wire-i18next-at-runtime) no guia de Introdução para a configuração completa.

<a id="workflow-2---document-translation"></a>
### Fluxo de trabalho 2 - Tradução de Documentos

```bash
# 1. Create config for Docusaurus
npx ai-i18n-tools init -t ui-docusaurus
# Astro Starlight: npx ai-i18n-tools init -t ui-starlight

# 2. Translate all docs
npx ai-i18n-tools translate-docs

# 3. Check status
npx ai-i18n-tools status
```

<a id="both-workflows"></a>
### Ambos os fluxos de trabalho

```bash
npx ai-i18n-tools sync   # Extract UI strings, then translate UI strings, SVG, and docs
```

---

<a id="runtime-helpers"></a>
## Auxiliares de tempo de execução

Os seguintes auxiliares são exportados de `'ai-i18n-tools/runtime'` e funcionam em qualquer ambiente JavaScript. Você não precisa importar o i18next para usá-los:

| Auxiliar                                                               | Descrição                                                                                                                              |
|------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| `defaultI18nInitOptions(sourceLocale)`                                 | Opções padrão de inicialização do i18next para configurações com chave como valor padrão.                                              |
| `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` | Conexão recomendada: key-trim + plural `wrapT` de `strings.json`, opcionalmente mescla chaves plurais `translate-ui` `{sourceLocale}.json`. |
| `wrapI18nWithKeyTrim(i18n)` | Apenas um invólucro de nível inferior para key-trim (obsoleto para conexão de aplicativo; prefira `setupKeyAsDefaultT`). |
| `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, makeLoader)` | Gera o mapa `localeLoaders` para `makeLoadLocale` a partir de `ui-languages.json` (cada `code` exceto `sourceLocale`). |
| `makeLoadLocale(i18n, loaders, sourceLocale)` | Fábrica para carregamento assíncrono de arquivos de localidade. |
| `getTextDirection(lng)` | Retorna `'ltr'` ou `'rtl'` para um código BCP-47. |
| `applyDirection(lng, element?)` | Define o atributo `dir` em `document.documentElement`. |
| `getUILanguageLabel(lang, t)` | Rótulo exibido para uma linha no menu de idiomas (com i18n). |
| `getUILanguageLabelNative(lang)` | Rótulo exibido sem chamar `t()` (estilo cabeçalho). |
| `interpolateTemplate(str, vars)` | Substituição de baixo nível `{{var}}` em uma string simples (usado internamente; o código do aplicativo deve usar `t()`). |
| `flipUiArrowsForRtl(text, isRtl)` | Inverte `→` para `←` em layouts da direita para a esquerda (RTL). |

---

<a id="cli-commands"></a>
## Comandos da CLI

```bash
ai-i18n-tools version
ai-i18n-tools help [command]
ai-i18n-tools init [-t ui-markdown|ui-docusaurus] [-o path] [--with-translate-ignore]
ai-i18n-tools check-models
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]
ai-i18n-tools extract
ai-i18n-tools translate-docs …
ai-i18n-tools write-heading-ids …
ai-i18n-tools strip-md-bold-inline …
ai-i18n-tools check-markdown [-p|--path <path>] [--json] [--no-cache]
ai-i18n-tools translate-svg …
ai-i18n-tools translate-ui …
ai-i18n-tools lint-source …
ai-i18n-tools export-ui-xliff …
ai-i18n-tools sync …
ai-i18n-tools status [--max-columns <n>]
ai-i18n-tools statistics [--max-columns <n>]
ai-i18n-tools dashboard
ai-i18n-tools cleanup [--dry-run] [--no-backup] [--backup <path>]
ai-i18n-tools clean-temp [-r|--root <path>] [-f|--force] [--dry-run]
ai-i18n-tools glossary-generate
```

Listas completas de flags por comando estão em [Introdução — Referência CLI](docs/GETTING_STARTED.pt-BR.md#cli-reference). Execute `ai-i18n-tools <command> --help` para ver o texto de uso integrado.

Opções globais em todos os comandos: `-c <config>` (padrão: `ai-i18n-tools.config.json`), `-v` (verboso), opcional `-w` / `--write-logs [path]` para duplicar a saída do console em um arquivo de log (padrão: dentro do diretório de cache de tradução), `-V` / `--version`, e `-h` / `--help`. Veja [Getting Started](docs/GETTING_STARTED.pt-BR.md#cli-reference) para a tabela com visão geral dos comandos.

---

<a id="documentation"></a>
## Documentação

- [Introdução](docs/GETTING_STARTED.pt-BR.md) - guia completo de configuração para ambos os fluxos de trabalho, referência da CLI e dos campos de configuração.
- [Guia de ativos por localidade](docs/LOCALE-ASSETS-GUIDE.pt-BR.md) - imagens e SVGs ilustrados em documentos traduzidos (Padrões A–E, reescrita de links plana, scripts para capturas de tela).
- [Visão geral do pacote](docs/PACKAGE_OVERVIEW.pt-BR.md) - arquitetura, componentes internos, API programática e pontos de extensão.
- [Contexto do agente de IA](../docs/ai-i18n-tools-context.md) - **para aplicações que usam o pacote:** prompts de integração para projetos downstream (copie para as regras do agente no seu repositório).
- Internals do mantenedor para **este** repositório: `dev/package-context.md` (somente clone; não está no npm).

---

<a id="license"></a>
## Licença

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br)
