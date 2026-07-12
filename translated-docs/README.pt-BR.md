<center>

![Logotipo ai-i18n-tools](../docs/public/ai-i18n-tools_logo.png)

</center>

<a id="ai-i18n-tools"></a>
# ai-i18n-tools

<small id="lang-list">[English (UK)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [Hindi (Roman)](./README.hi-Latn.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md)</small>

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

**Traduza seu aplicativo e documentação usando o modelo de IA de sua escolha: sem bloqueio, sem reescritas.**

`ai-i18n-tools` é uma CLI e um kit de ferramentas para internacionalizar aplicativos e sites de documentação JavaScript/TypeScript — incluindo Docusaurus, Astro, Starlight, VitePress, Nextra, Fumadocs e Markdown/MDX simples — usando grandes modelos de linguagem.

Escolha entre predefinições integradas (**OpenAI**, **Anthropic**, **Google Gemini**, **NVIDIA**, **DeepSeek**, **Groq**, **Mistral**, **xAI**, **Cerebras**, **Alibaba**, **APIFUN**, **OpenRouter**, **Ollama**) ou aponte para qualquer API compatível com OpenAI. Alterne provedores ou modelos por projeto — ou até mesmo por idioma — sem modificar sua base de código.

Um arquivo de configuração controla três modos de tradução, para que você possa misturar e combinar com base em como seu conteúdo está estruturado:

- **Strings de UI** — Extrai chamadas `t("…")` de JS/TS (e opcionalmente arquivos `.astro`) e gera JSON plano por localidade para i18next ou pesquisa SSG estática.
- **Documentos** — Traduz páginas Markdown, MDX e `.astro` listadas em `docs[].contentPaths` usando `translate-docs`. Funciona com **VitePress**, **Starlight**, **Docusaurus**, **Nextra**, **Fumadocs**, sites baseados em Astro ou qualquer gerador de site estático que leia de arquivos-fonte Markdown/MDX/`.astro`.
- **JSON** — Traduz pacotes JSON aninhados arbitrários definidos em `json[]`. Use `translate-json` quando a cópia da UI estiver em arquivos JSON por localidade, em vez de chamadas `t()` na fonte.

Ativos **SVG** têm seu próprio caminho: `features.translateSVG`, o bloco `svg` de nível superior e `translate-svg` — não `docs[].contentPaths`.

**Qual devo usar?**

| Seu conteúdo                                                                  | Comando                                     |
|-------------------------------------------------------------------------------|---------------------------------------------|
| O código-fonte usa `t()`                                                        | **Strings de UI** — `extract` / `translate-ui` |
| Páginas localizadas ou sites de documentos (VitePress, Starlight, Docusaurus, Nextra, Fumadocs, Astro, etc.) | **Documentos** — `translate-docs` |
| Arquivos de localidade JSON aninhados e autônomos                                          | **JSON** — `translate-json`                 |

Todos os três compartilham um cache de arquivo/SQLite, então apenas segmentos novos ou alterados (strings ou blocos de texto) são reenviados ao modelo — as execuções são rápidas e baratas, independentemente do provedor que você estiver usando.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Tabela de Conteúdos**

- [Tipos de tradução](#translation-types)
- [Instalação](#installation)
  - [Usando a CLI](#using-the-cli)
- [Provedores LLM](#llm-providers)
- [Início rápido](#quick-start)
  - [Strings de UI](#ui-strings)
  - [Documentos](#documents)
  - [VitePress](#vitepress)
  - [Nextra](#nextra)
  - [Fumadocs](#fumadocs)
  - [Astro (Astro simples e Starlight)](#astro-plain-astro--starlight)
  - [Sincronização combinada](#combined-sync)
- [Auxiliares de tempo de execução](#runtime-helpers)
- [Comandos CLI](#cli-commands)
  - [Idioma da UI da ferramenta (logs, ajuda, painel)](#tool-ui-language-logs-help-dashboard)
- [Documentação](#documentation)
- [Licença](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="translation-types"></a>
## Tipos de tradução

Cada tipo de tradução tem seu próprio guia com detalhes completos de configuração: [Strings de UI](../docs/guide/ui-strings/), [Documentos](../docs/guide/documents/) e [JSON](../docs/guide/json.md). Consulte [O que é ai-i18n-tools?](../docs/guide/what-is-ai-i18n-tools.md) para uma comparação lado a lado.

Algumas coisas que vale a pena saber de antemão: as strings da UI traduzem entradas ausentes por localidade por meio do provedor LLM ativo (consulte [Provedores LLM](#llm-providers)) e gravam arquivos JSON planos (`de.json`, `pt-BR.json`, …), com o texto-fonte em inglês como chave de pesquisa em tempo de execução — `strings.json` é o cache de extração, não o pacote de tempo de execução. Documentos suportam valores `docs[].docsOutput.style` `"nested"`, `"flat"`, `"doc-system"` e aliases `"docusaurus"` / `"astro-starlight"` / `"vitepress"` / `"nextra"` / `"fumadocs"` (consulte [Layouts de saída](../docs/guide/documents/output-layouts.md)). Todos os três compartilham `ai-i18n-tools.config.json` e podem ser combinados; `sync` executa extração, tradução de UI, tradução de SVG, `translate-docs` e `translate-json` em ordem de acordo com suas sinalizações `features`.

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

Depois de instalar o pacote em seu projeto, use npm/pnpm/yarn para vincular a entrada bin publicada (`bin/ai-i18n-tools.mjs`) em `node_modules/.bin/ai-i18n-tools`. Esse shim carrega a CLI compilada do pacote instalado.

Para digitar o comando `ai-i18n-tools` em um shell interativo, configure uma das opções abaixo. Sem configuração, o shell não consegue encontrar o binário mesmo após uma instalação local.

**direnv** — adicione a um `.envrc` na raiz do projeto (bash/zsh; consulte [direnv.net](https://direnv.net/)):

```bash
PATH_add node_modules/.bin
```

Após `direnv allow`, o comando simples estará disponível sempre que você `cd` no projeto.

**PATH manual** — a partir da raiz do projeto em um shell interativo:

```bash
# bash/zsh
export PATH="$PWD/node_modules/.bin:$PATH"
ai-i18n-tools sync
```

```powershell
# Windows PowerShell
$env:Path = "$PWD\node_modules\.bin;$env:Path"
ai-i18n-tools sync
```

**Instalação global** — instale a CLI uma vez e invoque-a de qualquer diretório:

```bash
npm install -g ai-i18n-tools
# or
pnpm add -g ai-i18n-tools
```

Uma instalação global usa a versão globalmente fixada. Para fixação de versão por projeto, prefira direnv ou PATH manual para que `node_modules/.bin` seja resolvido para a dependência do projeto.

**Scripts `package.json`** — quando o npm ou pnpm executa um script, ele adiciona `node_modules/.bin` ao `PATH`, então o nome do comando simples funciona dentro dos scripts sem alterações no PATH do shell:

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

Em seguida, execute, por exemplo, `pnpm run i18n:sync` — os scripts resolvem o binário local sem configuração extra do shell.

**Alternativas** — se você preferir não ajustar `PATH`: `npx ai-i18n-tools …` (npm) ou `pnpm exec ai-i18n-tools …` (pnpm). Para uma execução única sem instalação e sem entrada `package.json`: `npx ai-i18n-tools <cmd>` ou `pnpm dlx ai-i18n-tools <cmd>`.

Prefira `sync` em vez de encadear manualmente `extract`, `translate-ui`, `translate-svg`, `translate-docs` e `translate-json` — a ordem e as flags de recursos são fáceis de errar quando executadas manualmente. Consulte [Scripts `package.json` recomendados](../docs/guide/quick-start.md#recommended-packagejson-scripts) no guia de Início rápido.

Defina a chave de API para o provedor escolhido (os nomes das variáveis de ambiente estão em [Provedores de LLM](#llm-providers)):

```bash
export PROVIDER_API_KEY=sk-your-key-here
```

---

<a id="llm-providers"></a>
## Provedores LLM

Os comandos de tradução (`translate-ui`, `translate-docs`, `translate-json`, `sync`, `check-models` e scripts relacionados) chamam um provedor de LLM; `check-markdown`, `mark-html` e `extract` não.

Configure provedores sob um mapa de nível superior `providers` e escolha o ativo com um seletor de nível superior `provider` (opcional quando exatamente um provedor é configurado). A maioria dos provedores precisa apenas de uma lista `translationModels` — `baseUrl` e a variável de ambiente da chave de API vêm de um preset integrado; você pode substituir `baseUrl`, `apiKeyEnv`, `headers`, `maxTokens`, `temperature` e `requestTimeoutMs` por provedor. `requestTimeoutMs` é o tempo máximo em milissegundos para esperar por cada solicitação (padrão `30000`).

Níveis de modelo opcionais em cada bloco de provedor:

- `translationModels` — cadeia de fallback global ordenada (obrigatória para recursos de tradução).
- `uiModels` — cadeia exclusiva para UI (`translate-ui`, geração de plurais, `proofread-ui`): tentada após qualquer entrada `localeModels` correspondente, antes de `translationModels`.
- `localeModels` — substituições por localidade para **todos** os pipelines: cada entrada mapeia uma localidade BCP-47 para uma lista ordenada de modelos tentada primeiro apenas para aquela localidade (`pt-br` corresponde a `pt-BR`).

Ordem de resolução: **UI** → `localeModels(locale)` → `uiModels` → `translationModels`; **docs / JSON / SVG** → `localeModels(locale)` → `translationModels`. IDs de modelos duplicados são ignorados, preservando a ordem.

Para alternar provedores para uma única execução sem editar a configuração, passe a opção global `-P` / `--provider <name>` (por exemplo, `ai-i18n-tools -P groq translate-ui`); o nome deve ser uma das chaves de `providers` configuradas.

```jsonc
{
  "provider": "ollama",
  "providers": {
    "groq": { "translationModels": ["llama-3.3-70b-versatile"] },
    "openrouter": {
      "translationModels": ["qwen/qwen3-235b-a22b-2507", "openai/gpt-4o-mini"],
      "uiModels": ["anthropic/claude-sonnet-latest"],
      "localeModels": [
        { "locale": "pt-BR", "models": ["google/gemini-3-flash-preview"] }
      ]
    },
    "ollama": { "baseUrl": "http://localhost:11434/v1", "translationModels": ["llama3.2"] }
  }
}
```

Presets de provedores integrados (chave — URL base — variável de ambiente da chave de API):

| Provedor     | URL Base                                                  | Variável de ambiente da chave de API      |
|--------------|-----------------------------------------------------------|----------------------|
| `alibaba`    | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`  | `ALIBABA_API_KEY`    |
| `anthropic` | `https://api.anthropic.com/v1` | `ANTHROPIC_API_KEY` |
| `apifun` | `https://api.apikey.fun/v1` | `APIFUN_API_KEY` |
| `cerebras` | `https://api.cerebras.ai/v1` | `CEREBRAS_API_KEY` |
| `deepseek` | `https://api.deepseek.com` | `DEEPSEEK_API_KEY` |
| `gemini` | `https://generativelanguage.googleapis.com/v1beta/openai` | `GOOGLE_API_KEY` |
| `groq` | `https://api.groq.com/openai/v1` | `GROQ_API_KEY` |
| `mistral` | `https://api.mistral.ai/v1` | `MISTRAL_API_KEY` |
| `nvidia` | `https://integrate.api.nvidia.com/v1` | `NVIDIA_API_KEY` |
| `ollama` | `http://localhost:11434/v1` | (nenhum) |
| `openai` | `https://api.openai.com/v1` | `OPENAI_API_KEY` |
| `openrouter` | `https://openrouter.ai/api/v1`                            | `OPENROUTER_API_KEY` |
| `xai` | `https://api.x.ai/v1` | `XAI_API_KEY` |

Defina um provedor personalizado compatível com OpenAI adicionando uma nova chave com `baseUrl` (e `apiKeyEnv` a menos que não precise de chave). IDs de modelo são IDs diretos do upstream — o provedor é escolhido no nível de configuração, portanto, nenhum prefixo `provider/` é necessário (IDs do OpenRouter mantêm sua forma nativa `vendor/model`).

O uso de tokens é relatado para cada provedor; o custo exato em USD é mostrado apenas quando o provedor o retorna. `ai-i18n-tools check-models` valida todos os IDs de modelo configurados (`translationModels`, `uiModels` e cada entrada `localeModels`) em relação à lista `GET /models` ativa do provedor e mostra os preços quando o provedor os retorna. `ai-i18n-tools list-models` lista todos os modelos que o provedor ativo anuncia (use `-P` / `--provider` para inspecionar outro provedor configurado). `ai-i18n-tools bench-models` avalia cada ID de modelo configurado exclusivo (`translationModels`, `uiModels` e `localeModels`) traduzindo uma amostra isoladamente (os modelos são executados em paralelo, limitados por `concurrency`) e imprime os tokens de entrada/saída por modelo, o tempo de execução e o custo em USD.

Para uma demonstração prática de como alternar provedores com `-P` em um único documento, consulte [`examples/multi-provider`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/multi-provider/).

---

<a id="quick-start"></a>
## Início rápido

Primeiro, configure seu shell para o comando simples — consulte [Usando a CLI](#using-the-cli).

<a id="ui-strings"></a>
### Strings de UI

```bash
# 1. Create config (default ui-markdown; plain Astro: init -t ui-astro-website)
ai-i18n-tools init [-P <provider>]

# 2. Extract UI strings to strings.json
ai-i18n-tools extract

# 3. Translate to all target locales
ai-i18n-tools translate-ui
```

Em seguida, conecte o i18next em seu aplicativo usando os auxiliares de `'ai-i18n-tools/runtime'`. Consulte [Etapa 4: Conectar o i18next em tempo de execução](../docs/guide/ui-strings/i18next-runtime.md) no guia de strings de UI para a configuração completa.

<a id="documents"></a>
### Documentos

O modelo padrão `init` (`ui-markdown`) habilita apenas a extração de interface. Use um modelo voltado para documentação (ou habilite `features.translateDocs` e adicione `docs[]`) antes de `translate-docs`:

```bash
# Docusaurus docs + optional write-translations catalog
ai-i18n-tools init -t ui-docusaurus [-P <provider>]

# Astro Starlight documentation
# ai-i18n-tools init -t ui-starlight [-P <provider>]

# VitePress documentation (pages + theme catalog)
# ai-i18n-tools init -t ui-vitepress [-P <provider>]

# Nextra documentation (pages + _meta.ts + theme dictionary)
# ai-i18n-tools init -t ui-nextra [-P <provider>]

# Fumadocs documentation (pages + meta.json + UI catalog)
# ai-i18n-tools init -t ui-fumadocs [-P <provider>]

# Plain Astro website — UI extraction for t() in .astro; add docs[] for page HTML (see Astro below)
# ai-i18n-tools init -t ui-astro-website [-P <provider>]

ai-i18n-tools translate-docs
ai-i18n-tools status
# ai-i18n-tools translate-docs --locale de   # single locale
```

Edite `ai-i18n-tools.config.json`: defina `docs[].contentPaths` para fontes markdown, MDX e/ou `.astro`; `docs[].outputDir` e `docs[].docsOutput.style` (`"docusaurus"`, `"astro-starlight"`, `"vitepress"`, `"nextra"`, `"fumadocs"`, `"flat"`, etc.). Referência de campo completa: [Documentos](../docs/guide/documents/).

<a id="vitepress"></a>
### VitePress

`init -t ui-vitepress` estrutura `docsOutput.style: "vitepress"` mais `docsOutput.vitepressThemeCatalog` para strings de navegação/barra lateral/rodapé. Execute `sync` para traduzir o markdown da página e o catálogo do tema juntos — sem pipeline JSON separado. Consulte [Integração VitePress](../docs/guide/integrations/vitepress.md) e [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/).

<a id="nextra"></a>
### Nextra

`init -t ui-nextra` estrutura `docsOutput.style: "nextra"`. `translate-docs` coleta e traduz automaticamente os rótulos da barra lateral `_meta.ts`; defina `docs[].nextraDictionaryPath` para também traduzir o módulo de dicionário do tema (por exemplo, `app/_dictionaries/en.ts`) — tudo na mesma execução `sync`, sem sidecars JSON. Consulte [Integração Nextra](../docs/guide/integrations/nextra.md) e [examples/nextra-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs/).

<a id="fumadocs"></a>
### Fumadocs

`init -t ui-fumadocs` estrutura `docsOutput.style: "fumadocs"` com o analisador de ponto (padrão) ou analisador de diretório para pastas de localidade estilo Nextra. `translate-docs` coleta e traduz automaticamente os rótulos da barra lateral `meta.json`; defina `docsOutput.fumadocsUiCatalog` para também traduzir as substituições de UI em `lib/layout.shared.ts` — tudo na mesma execução `sync`, sem sidecars JSON. Consulte [Integração Fumadocs](../docs/guide/integrations/fumadocs.md) e [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/).

<a id="astro-plain-astro--starlight"></a>
### Astro (Astro puro e Starlight)

**Astro Starlight** — `init -t ui-starlight`, depois `translate-docs`. As substituições da interface do usuário do Starlight podem usar `src/content/i18n/en.json` com `jsonPathTemplate` em um bloco `docs[]` separado quando necessário ([Documentos — inicializar para documentação](../docs/guide/documents/index.md#step-1-initialise-for-documentation)).

**Astro puro** (sites de marketing ou aplicativos, não Starlight) — combine [roteamento i18n integrado do Astro](https://docs.astro.build/en/guides/internationalization/) com ai-i18n-tools. Projeto de referência: [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) (inglês em `/`, localidades em `/{locale}/`).

A maioria das equipes usa um modelo **híbrido** com dois pipelines:

| Pipeline               | Usar para                                                              | Comandos                   | Saída                                                 |
|------------------------|----------------------------------------------------------------------|----------------------------|--------------------------------------------------------|
| **HTML da Página**          | Títulos, parágrafos, rótulos de navegação, arrays inline no corpo do template | `translate-docs`           | `src/pages/{locale}/index.astro` por localidade            |
| **Strings de interface (`t()`)** | Dados frontmatter, rótulos de abas, arrays compartilhados | `extract` → `translate-ui` | `public/locales/{locale}.json` (fonte em inglês como chave) |

Estruture a interface do usuário com `init -t ui-astro-website`. Para HTML codificado em páginas `.astro`, ative `features.translateDocs` e adicione um bloco `docs[]` com `docsOutput.style: "astro-starlight"` (consulte [Páginas do site Astro (analisar e substituir)](../docs/guide/ui-strings/astro-website.md#astro-website-pages-parse-and-replace)). Mantenha `targetLocales`, `i18n.locales` em `astro.config.mjs` e `ui-languages.json` alinhados (as rotas Astro usam códigos minúsculos como `pt-br`; os nomes de arquivo de pacote simples seguem o uso de maiúsculas e minúsculas da configuração, por exemplo, `pt-BR.json`).

Conecte `t()` no momento da compilação sem i18next, a menos que você adicione ilhas de cliente — consulte [Cadeias de caracteres da interface do usuário do site Astro (SSG)](../docs/guide/ui-strings/astro-website.md#astro-website-ui-strings-ssg) e o `src/i18n/t.ts` do exemplo.

<a id="combined-sync"></a>
### Sincronização combinada

```bash
ai-i18n-tools sync   # extract → translate-ui → translate-svg → translate-docs → translate-json (per features)
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
ai-i18n-tools bench-models [--model <ids>] [--text <text>|--file <path>] [--source <locale>] [--target <locale>]
ai-i18n-tools list-languages [search]
ai-i18n-tools init [-t ui-markdown|ui-docusaurus|ui-starlight|ui-vitepress|ui-nextra|ui-fumadocs|ui-astro-website|ui-json-bundles] [-o path] [-P <provider>] [--with-translate-ignore]
ai-i18n-tools write-heading-ids …
ai-i18n-tools mark-html [paths...] [--write]
ai-i18n-tools extract
ai-i18n-tools translate-docs …
ai-i18n-tools translate-json …
ai-i18n-tools translate-svg …
ai-i18n-tools translate-ui …
ai-i18n-tools sync-ui …
ai-i18n-tools proofread-ui …
ai-i18n-tools check-markdown [-p|--path <path>] [-f|--file <path>] [--json] [--no-cache]
ai-i18n-tools export-ui-xliff …
ai-i18n-tools sync …
ai-i18n-tools status …
ai-i18n-tools statistics …
ai-i18n-tools cleanup …
ai-i18n-tools clean-temp …
ai-i18n-tools purge-locale -l <code> [-l <code> …] [--dry-run] [-y|--yes] [-f|--force] [--keep-files] [--backup <path>]
ai-i18n-tools dashboard …
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]
ai-i18n-tools glossary-generate
ai-i18n-tools help [command]
```

Para aplicativos HTML simples, anote os elementos com marcadores `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` (o texto de origem é retirado do próprio textContent / título / placeholder do elemento, escrito uma vez); `mark-html` os insere para você e `extract` os captura em `strings.json`. Consulte [Marcando HTML para tradução](../docs/guide/ui-strings/plain-html.md#marking-html-for-translation).

As listas completas de sinalizadores por comando estão na [referência da CLI](../docs/reference/cli-commands/). Execute `ai-i18n-tools <command> --help` para obter o texto de uso integrado.

Opções globais: `-c <config>` (padrão: `ai-i18n-tools.config.json`), `-v` (detalhado), `-P` / `--provider <name>` (substitui o provedor LLM ativo; deve ser configurado em `providers`), `-L` / `--ui-lang <code>` (idioma para a própria UI/logs da ferramenta), `-V` / `--version` e `-h` / `--help` — aceitas em todos os comandos. `-w` / `--write-logs [path]` direciona a saída do console para um arquivo de log (padrão: no diretório de cache de tradução), mas só entra em vigor nos comandos de tradução e sincronização (`translate-docs`, `translate-json`, `translate-svg`, `translate-ui`, `sync-ui`, `sync`, `cleanup`). Vários comandos aceitam `-l` / `--locale <codes>` (BCP-47 separado por vírgulas) para limitar os locais de destino; `proofread-ui` usa um único local de origem. Consulte a [referência da CLI](../docs/reference/cli-commands/) para obter a visão geral do comando.

<a id="tool-ui-language-logs-help-dashboard"></a>
### Idioma da interface do usuário da ferramenta (logs, ajuda, painel)

A ferramenta localiza sua própria ajuda de CLI, resumos de log e Painel de Tradução independentemente das localidades que você traduz. Por padrão, ela segue a localidade do seu sistema operacional; substitua com `-L pt-BR`, `export AI_I18N_LANG=es` ou `"uiLanguage"` na configuração. Consulte [Idioma da IU da ferramenta](../docs/guide/tool-ui-language.md) para resolução de localidade, idiomas enviados e comportamento do painel.

---

<a id="documentation"></a>
## Documentação

- [Site de documentação](https://wsj-br.github.io/ai-i18n-tools/) — guia VitePress (9 localidades no GitHub Pages); ponto de entrada simplificado com links para o guia completo.
- [Início rápido](../docs/guide/quick-start.md) — configuração para strings de UI, documentos e JSON (UI, docs/`.astro`, pacotes JSON, VitePress, Nextra, Fumadocs, Astro Starlight e Astro simples).
- [Guia de ativos de localidade](../docs/guide/images-and-screenshots/) - capturas de tela e SVGs ilustrados em documentos traduzidos (reescritor de link plano, scripts de captura de tela).
- [Arquitetura](../docs/reference/architecture.md) - arquitetura, componentes internos, API programática e pontos de extensão.
- [Contexto do Agente de IA](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) - **para aplicativos que usam o pacote:** prompts de integração para projetos downstream (copie para as regras do agente do seu repositório).
- Guia do mantenedor para **este** repositório: `AGENT.md` (regras e fluxos de trabalho; somente clone; não no npm). Referência de pipeline: `docs/reference/`. Desenvolvimento local e publicação: `dev/DEVEL.md`.

---

<a id="license"></a>
## Licença

Este projeto é licenciado sob a Licença MIT.  
Consulte o arquivo [LICENSE](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) para obter detalhes.

Copyright &copy; 2026 Waldemar Scudeller Jr.
