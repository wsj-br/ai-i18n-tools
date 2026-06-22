<a id="ai-i18n-tools"></a>
# ai-i18n-tools

[![Versão do npm](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![Downloads do npm](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/)
[![Licença: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

Uma CLI e um kit de ferramentas para internacionalizar aplicações e sites de documentação JavaScript/TypeScript usando modelos de linguagem grandes. Funciona com [OpenRouter](https://openrouter.ai/) e qualquer provedor compatível com OpenAI (OpenAI, Anthropic, Gemini, DeepSeek, Groq, Mistral, xAI, Cerebras, NVIDIA, Alibaba, APIFUN, Ollama e mais). Três fluxos de trabalho modulares, todos compartilhando um único arquivo de configuração, suportam diferentes necessidades de tradução:

- **Fluxo de trabalho 1 — Tradução de UI:** Extrai chamadas `t("…")` do JS/TS (e opcionalmente de arquivos `.astro`) e gera JSON plano por localidade para consulta no i18next ou SSG estático.
- **Fluxo de trabalho 2 — Tradução de Documento:** Traduz páginas markdown, MDX e `.astro` (para sites e Starlight) listadas em `docs[].contentPaths` usando `translate-docs`.
- **Fluxo de trabalho 3 — Tradução de Arquivo JSON:** Traduz pacotes JSON aninhados arbitrários definidos em `json[]`. Use `translate-json` quando o texto da interface estiver armazenado em arquivos JSON por localidade, em vez de usar `t()` no código-fonte.

Ativos **SVG** são traduzidos usando `features.translateSVG`, o bloco `svg` de nível superior e `translate-svg`—não `docs[].contentPaths`.

**Qual fluxo de trabalho devo usar?**
- Código-fonte usa `t()` → **Fluxo de trabalho 1** (`extract` / `translate-ui`)
- Páginas localizadas ou JSON de catálogo do Docusaurus → **Fluxo de trabalho 2** (`translate-docs`)
- Apenas arquivos JSON de localidade autônomos e aninhados → **Fluxo de trabalho 3** (`translate-json`)

Todos os fluxos de trabalho mantêm um cache em arquivo ou SQLite para garantir que apenas segmentos novos ou alterados (cadeias ou blocos de texto) sejam enviados ao LLM.

<small>**Leia em outros idiomas:** </small>
<small id="lang-list">[English (UK)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [Hindi (Roman)](./README.hi-Latn.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md)</small>

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Tabela de Conteúdos**

- [Fluxos de trabalho principais](#core-workflows)
- [Instalação](#installation)
  - [Usando a CLI](#using-the-cli)
- [Provedores de LLM](#openrouter)
- [Primeiros passos](#quick-start)
  - [Fluxo de trabalho 1 - Tradução de UI](#workflow-1---ui-translation)
  - [Fluxo de trabalho 2 - Tradução de Documento](#workflow-2---document-translation)
  - [Astro (Astro puro e Starlight)](#astro-plain-astro--starlight)
  - [Fluxo de trabalho combinado](#combined-workflow)
- [Auxiliares de tempo de execução](#runtime-helpers)
- [Comandos CLI](#cli-commands)
- [Documentação](#documentation)
- [Licença](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="core-workflows"></a>
## Fluxos de trabalho principais

**Fluxo de trabalho 1 - Tradução de UI** — para qualquer projeto JS/TS que use i18next (React, Next.js, Node.js, CLIs) ou SSG estático do Astro

Analisa arquivos-fonte em busca de literais `t("…")` / `i18n.t("…")` (adicione `.astro` a `ui.uiExtractor.extensions` para frontmatter do Astro e expressões de modelo), cria um catálogo mestre (`strings.json`), traduz entradas ausentes por localidade via OpenRouter e gera arquivos JSON planos (`de.json`, `pt-BR.json`, …). O texto-fonte em inglês é a chave de consulta em tempo de execução nesses pacotes — `strings.json` é o cache de extração, não o pacote de tempo de execução.

**Fluxo de trabalho 2 - Tradução de Documento** — para markdown, MDX e `.astro` sob `docs[].contentPaths`

Projetado principalmente para documentação em **markdown, MDX e `.astro`** (Docusaurus, [Astro Starlight](https://starlight.astro.build/), arquivos README simples e páginas de marketing Astro simples). `translate-docs` gera cópias localizadas com um cache SQLite compartilhado. Em sites Docusaurus, defina `docs[].docusaurusCatalogDir` como a pasta do catálogo `write-translations` para que o JSON de estrutura (barra de navegação, rodapé, strings de tema) seja traduzido no mesmo comando. `docs[].docsOutput.style` suporta `"nested"`, `"flat"`, `"doc-system"` e apelidos `"docusaurus"` / `"astro-starlight"` (veja [Layouts de saída](docs/GETTING_STARTED.pt-BR.md#output-layouts) em Primeiros Passos). JSON de UI aninhado arbitrário que não seja um catálogo Docusaurus pertence ao Fluxo de trabalho 3 (`json[]` / `translate-json`), não ao `docs[]`.

**Fluxo de trabalho 3 - Tradução de arquivo JSON** — JSON de localidade aninhado sem `t()` no código-fonte

Traduz arquivos como `src/i18n/en/translation.json` por meio de `json[]` de nível superior, `features.translateJson`, e `translate-json`. Crie a estrutura com `init -t ui-json-bundles`.

Todos os fluxos de trabalho compartilham `ai-i18n-tools.config.json` e podem ser combinados; `sync` executa extração, tradução de UI, tradução de SVG, `translate-docs` e `translate-json` em ordem, de acordo com suas flags em `features`.

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
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:translate:json": "ai-i18n-tools translate-json",
  "i18n:translate": "ai-i18n-tools translate-docs",
  "i18n:dashboard": "ai-i18n-tools dashboard"
}
```

Você também pode usar diretamente os comandos CLI do ai-i18n-tools, por exemplo `ai-i18n-tools sync`.

Prefira `sync` a encadear manualmente `extract`, `translate-ui`, `translate-svg`, `translate-docs` e `translate-json` — a ordem e as flags de funcionalidade são fáceis de errar quando executadas manualmente. Veja [Scripts recomendados `package.json`](docs/GETTING_STARTED.pt-BR.md#recommended-packagejson-scripts) em Primeiros Passos.

**Execução única sem instalação** — use `npx ai-i18n-tools <cmd>` ou `pnpm dlx ai-i18n-tools <cmd>` (faz download apenas para aquela execução).

> **Dica:** Para executar `ai-i18n-tools` diretamente em um shell interativo sem `npx`, adicione `node_modules/.bin` ao seu `PATH` (bash/zsh: `export PATH="$PWD/node_modules/.bin:$PATH"`). Veja [Introdução](docs/GETTING_STARTED.pt-BR.md#installation) para instruções sobre direnv e Windows.

Defina sua chave de API do provedor (OpenRouter mostrado; use a variável correspondente para seu provedor):

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

<a id="openrouter"></a>
## Provedores de LLM

Os comandos de tradução (`translate-ui`, `translate-docs`, `translate-json`, `sync`, `check-models` e scripts relacionados) chamam um provedor de LLM; `check-markdown`, `mark-html` e `extract` não.

Configure provedores sob um mapa de nível superior `providers` e escolha o ativo com um seletor de nível superior `provider` (opcional quando exatamente um provedor é configurado). A maioria dos provedores precisa apenas de uma lista `translationModels` — `baseUrl` e a variável de ambiente da chave de API vêm de um preset integrado; você pode substituir `baseUrl`, `apiKeyEnv`, `headers`, `maxTokens`, `temperature` e `requestTimeoutMs` por provedor. `requestTimeoutMs` é o tempo máximo em milissegundos para esperar por cada solicitação (padrão `30000`).

Para alternar provedores para uma única execução sem editar a configuração, passe a opção global `-P` / `--provider <name>` (por exemplo, `ai-i18n-tools -P groq translate-ui`); o nome deve ser uma das chaves de `providers` configuradas.

```jsonc
{
  "provider": "openrouter",
  "providers": {
    "openrouter": { "translationModels": ["qwen/qwen3-235b-a22b-2507", "openai/gpt-4o-mini"] },
    "groq": { "translationModels": ["llama-3.3-70b-versatile"] },
    "ollama": { "baseUrl": "http://localhost:11434/v1", "translationModels": ["llama3.2"] }
  }
}
```

Presets de provedores integrados (chave — URL base — variável de ambiente da chave de API):

| Provedor | URL Base | Variável de ambiente da chave de API |
| --- | --- | --- |
| `openrouter` | `https://openrouter.ai/api/v1` | `OPENROUTER_API_KEY` |
| `openai` | `https://api.openai.com/v1` | `OPENAI_API_KEY` |
| `anthropic` | `https://api.anthropic.com/v1` | `ANTHROPIC_API_KEY` |
| `gemini` | `https://generativelanguage.googleapis.com/v1beta/openai` | `GOOGLE_API_KEY` |
| `deepseek` | `https://api.deepseek.com` | `DEEPSEEK_API_KEY` |
| `cerebras` | `https://api.cerebras.ai/v1` | `CEREBRAS_API_KEY` |
| `groq` | `https://api.groq.com/openai/v1` | `GROQ_API_KEY` |
| `mistral` | `https://api.mistral.ai/v1` | `MISTRAL_API_KEY` |
| `xai` | `https://api.x.ai/v1` | `XAI_API_KEY` |
| `nvidia` | `https://integrate.api.nvidia.com/v1` | `NVIDIA_API_KEY` |
| `alibaba` | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` | `ALIBABA_API_KEY` |
| `apifun` | `https://api.apikey.fun/v1` | `APIFUN_API_KEY` |
| `ollama` | `http://localhost:11434/v1` | (nenhum) |

Defina um provedor personalizado compatível com OpenAI adicionando uma nova chave com `baseUrl` (e `apiKeyEnv` a menos que não precise de chave). IDs de modelo são IDs diretos do upstream — o provedor é escolhido no nível de configuração, portanto, nenhum prefixo `provider/` é necessário (IDs do OpenRouter mantêm sua forma nativa `vendor/model`).

O uso de tokens é relatado para cada provedor; o custo exato em USD é mostrado apenas quando o provedor o retorna (OpenRouter). `ai-i18n-tools check-models` valida os IDs de modelo configurados contra a lista ativa de `GET /models` do provedor ativo (qualquer provedor) e mostra os preços quando o provedor os retorna (por exemplo, OpenRouter). `ai-i18n-tools list-models` lista todos os modelos que o provedor ativo anuncia (use `-P` / `--provider` para inspecionar outro provedor configurado).

Um bloco de configuração `openrouter` de nível superior legado ainda é aceito e é migrado automaticamente para `providers.openrouter` (com `provider: "openrouter"`) ao carregar.

Para uma demonstração prática de como alternar provedores com `-P` em um único documento, consulte [`examples/multi-provider`](../examples/multi-provider/) (uma configuração com `openai`, `anthropic`, `nvidia` e `deepseek`).

---

<a id="quick-start"></a>
## Primeiros passos

<a id="workflow-1---ui-translation"></a>
### Fluxo de trabalho 1 - Tradução de UI

```bash
# 1. Create config (default ui-markdown; plain Astro: init -t ui-astro-website)
npx ai-i18n-tools init

# 2. Extract UI strings to strings.json
npx ai-i18n-tools extract

# 3. Translate to all target locales
npx ai-i18n-tools translate-ui
```

Em seguida, configure o i18next em seu aplicativo usando os auxiliares de `'ai-i18n-tools/runtime'`. Veja [Etapa 4: Configurar i18next em tempo de execução](docs/GETTING_STARTED.pt-BR.md#step-4-wire-i18next-at-runtime) no guia de Introdução para a configuração completa.

<a id="workflow-2---document-translation"></a>
### Fluxo de trabalho 2 - Tradução de Documentos

O modelo padrão `init` (`ui-markdown`) habilita apenas a extração de interface. Use um modelo voltado para documentação (ou habilite `features.translateDocs` e adicione `docs[]`) antes de `translate-docs`:

```bash
# Docusaurus docs + optional write-translations catalog
npx ai-i18n-tools init -t ui-docusaurus

# Astro Starlight documentation
# npx ai-i18n-tools init -t ui-starlight

# Plain Astro website — UI extraction for t() in .astro; add docs[] for page HTML (see Astro below)
# npx ai-i18n-tools init -t ui-astro-website

npx ai-i18n-tools translate-docs
npx ai-i18n-tools status
# npx ai-i18n-tools translate-docs --locale de   # single locale
```

Edite `ai-i18n-tools.config.json`: defina `docs[].contentPaths` como fontes markdown, MDX e/ou `.astro`; `docs[].outputDir` e `docs[].docsOutput.style` (`"docusaurus"`, `"astro-starlight"`, `"flat"`, etc.). Referência completa dos campos: [Workflow 2 - Tradução de Documentos](docs/GETTING_STARTED.pt-BR.md#workflow-2---document-translation).

<a id="astro-plain-astro--starlight"></a>
### Astro (Astro puro e Starlight)

**Astro Starlight** — `init -t ui-starlight`, depois `translate-docs`. As substituições de interface do Starlight podem usar `src/content/i18n/en.json` com `jsonPathTemplate` em um bloco `docs[]` separado quando necessário ([Introdução → Workflow 2](docs/GETTING_STARTED.pt-BR.md#step-1-initialise-for-documentation)).

**Astro Puro** (sites institucionais ou aplicativos, não Starlight) — combine o roteamento i18n interno do [Astro](https://docs.astro.build/en/guides/internationalization/) com o ai-i18n-tools. Projeto de referência: [`examples/astro-website`](../examples/astro-website/) (inglês em `/`, idiomas em `/{locale}/`).

A maioria das equipes usa um modelo **híbrido** com dois pipelines:

| Pipeline | Uso para | Comandos | Saída |
|----------|---------|----------|--------|
| **HTML da página** | Cabeçalhos, parágrafos, rótulos de navegação, arrays embutidos no corpo do template | `translate-docs` | `src/pages/{locale}/index.astro` por localidade |
| **Strings de interface (`t()`)** | Dados frontmatter, rótulos de abas, arrays compartilhados | `extract` → `translate-ui` | `public/locales/{locale}.json` (fonte em inglês como chave) |

Estruture a interface com `init -t ui-astro-website`. Para HTML embutido em páginas `.astro`, habilite `features.translateDocs` e adicione um bloco `docs[]` com `docsOutput.style: "astro-starlight"` (veja [Páginas de site Astro (analisar-e-substituir)](docs/GETTING_STARTED.pt-BR.md#astro-website-pages-parse-and-replace)). Mantenha `targetLocales`, `i18n.locales` em `astro.config.mjs` e `ui-languages.json` alinhados (rotas Astro usam códigos em letras minúsculas como `pt-br`; nomes de arquivos de pacote plano seguem a capitalização da configuração, por exemplo, `pt-BR.json`).

Conecte `t()` no momento da compilação sem i18next, a menos que você adicione ilhas do lado do cliente — veja [Strings de interface de site Astro (SSG)](docs/GETTING_STARTED.pt-BR.md#astro-website-ui-strings-ssg) e o `src/i18n/t.ts` do exemplo.

<a id="combined-workflow"></a>
### Fluxo de trabalho combinado

```bash
npx ai-i18n-tools sync   # extract → translate-ui → translate-svg → translate-docs → translate-json (per features)
```

---

<a id="runtime-helpers"></a>
## Auxiliares de tempo de execução

Os seguintes auxiliares são exportados de `'ai-i18n-tools/runtime'` e funcionam em qualquer ambiente JavaScript. Você não precisa importar o i18next para usá-los:

| Auxiliar                                                               | Descrição                                                                                                                              |
|------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| `defaultI18nInitOptions(sourceLocale)`                                 | Opções padrão de inicialização do i18next para configurações com chave como valor padrão.                                              |
| `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` | Conexão recomendada: key-trim + plural `wrapT` de `strings.json`, opcionalmente mescla chaves plurais `translate-ui` `{sourceLocale}.json`. |
| `wrapT(i18n, options)`                                                 | Wrapper de nível inferior com suporte a plurais `t()` (geralmente instalado por `setupKeyAsDefaultT`).                                                    |
| `buildPluralIndexFromStringsJson(entries)`                               | Cria o índice do grupo de plurais que `wrapT` utiliza a partir das linhas do catálogo com `"plural": true`.                                                    |
| `extractInterpolationNamesForWrap(key)`                                  | Analisa nomes `{{var}}` a partir de uma chave de origem para `wrapT` / fallback de corte de chave.                                                              |
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
ai-i18n-tools check-models
ai-i18n-tools list-models
ai-i18n-tools list-languages [search]
ai-i18n-tools init [-t ui-markdown|ui-docusaurus|ui-starlight|ui-astro-website|ui-json-bundles] [-o path] [--with-translate-ignore]
ai-i18n-tools write-heading-ids …
ai-i18n-tools mark-html [paths...] [--write]
ai-i18n-tools extract
ai-i18n-tools translate-docs …
ai-i18n-tools translate-json …
ai-i18n-tools translate-svg …
ai-i18n-tools translate-ui …
ai-i18n-tools sync-ui …
ai-i18n-tools lint-source …
ai-i18n-tools check-markdown [-p|--path <path>] [-f|--file <path>] [--json] [--no-cache]
ai-i18n-tools export-ui-xliff …
ai-i18n-tools sync …
ai-i18n-tools status …
ai-i18n-tools statistics …
ai-i18n-tools cleanup …
ai-i18n-tools clean-temp …
ai-i18n-tools dashboard …
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]
ai-i18n-tools glossary-generate
ai-i18n-tools help [command]
```

Para aplicativos HTML simples, anote os elementos com marcadores `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` brutos (o texto de origem é retirado do textContent / title / placeholder do próprio elemento, escrito uma vez); `mark-html` os insere para você e `extract` os captura em `strings.json`. Veja [Introdução — Marcando HTML para tradução](docs/GETTING_STARTED.pt-BR.md#marking-html-for-translation).

Listas completas de flags por comando estão em [Introdução — Referência CLI](docs/GETTING_STARTED.pt-BR.md#cli-reference). Execute `ai-i18n-tools <command> --help` para ver o texto de uso integrado.

Opções globais em todos os comandos: `-c <config>` (padrão: `ai-i18n-tools.config.json`), `-v` (verboso), `-P` / `--provider <name>` (substitui o provedor de LLM ativo; deve ser configurado em `providers`), `-L` / `--ui-lang <code>` (idioma da própria interface/logs da ferramenta), `-w` / `--write-logs [path]` opcionais para espelhar a saída do console em um arquivo de log (padrão: no diretório de cache de tradução), `-V` / `--version`, e `-h` / `--help`. Vários comandos aceitam `-l` / `--locale <codes>` (BCP-47 separado por vírgulas) para limitar os locais de destino; `lint-source` usa um único local de origem. Veja [Introdução](docs/GETTING_STARTED.pt-BR.md#cli-reference) para a tabela de visão geral dos comandos.

### Idioma da interface da ferramenta (logs, ajuda, painel)

A ferramenta localiza sua própria ajuda da CLI, mensagens de log/resumo de alto tráfego e o Painel de Tradução. O local da interface é resolvido destas fontes, com a maior prioridade primeiro:

1. Flag global `-L` / `--ui-lang <code>` (ex: `-L pt-BR`).
2. Variável de ambiente `AI_I18N_LANG` (ex: `export AI_I18N_LANG=es`).
3. A chave de configuração `uiLanguage` em `ai-i18n-tools.config.json` (string BCP-47).
4. O local do sistema operacional do host (via `Intl.DateTimeFormat().resolvedOptions().locale`).

O local solicitado é comparado exatamente com os idiomas da interface enviados ou por variação mais próxima (por exemplo, `pt-PT` resolve para `pt-BR`, e `en-US` resolve para `en-GB`); quando nada corresponde, ele volta para o local de origem (`en-GB`). Isso é independente do `sourceLocale` / `targetLocales` do seu projeto. Idiomas da interface enviados: `en-GB` (origem) mais `de`, `es`, `fr`, `hi-Latn`, `ja`, `ko`, `pt-BR`, `zh-Hans` e `zh-Hant`.

---

<a id="documentation"></a>
## Documentação

- [Introdução](docs/GETTING_STARTED.pt-BR.md) - configuração completa para todos os fluxos de trabalho (interface, docs/`.astro`, pacotes JSON, Astro Starlight e Astro puro), referência CLI e referência de campos de configuração.
- [Guia de ativos de idioma](docs/LOCALE-ASSETS-GUIDE.pt-BR.md) - capturas de tela e SVGs ilustrados na documentação traduzida (Padrões A–E, reescritor de links plano, scripts de captura).
- [Visão Geral do Pacote](docs/PACKAGE_OVERVIEW.pt-BR.md) - arquitetura, componentes internos, API programática e pontos de extensão.
- [Contexto do Agente de IA](../docs/ai-i18n-tools-context.md) - **para aplicativos que usam o pacote:** prompts de integração para projetos downstream (copie para as regras do agente no seu repositório).
- Internals do mantenedor para **este** repositório: `dev/package-context.md` (somente clone; não está no npm).

---

<a id="license"></a>
## Licença

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br)
