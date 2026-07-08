---
layout: doc
title: ai-i18n-tools
description: >-
  CLI e kit de ferramentas para internacionalizar aplicativos
  JavaScript/TypeScript e sites de documentação usando LLMs.
---



# ai-i18n-tools

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

**Traduza seu aplicativo e documentação usando o modelo de IA de sua escolha: sem bloqueio, sem reescritas.**

`ai-i18n-tools` é uma CLI e um kit de ferramentas para internacionalizar aplicativos e sites de documentação JavaScript/TypeScript — incluindo Docusaurus, Astro, Starlight, VitePress e Markdown/MDX puro — usando grandes modelos de linguagem.

Aponte-o para qualquer provedor e comece a traduzir: **OpenAI**, **Anthropic**, **Google Gemini**, **NVIDIA**, **DeepSeek**, **Groq**, **Mistral**, **xAI**, **Cerebras**, **Alibaba**, **APIFUN**, qualquer modelo [OpenRouter](https://openrouter.ai/) (centenas para escolher com uma única chave de API), ou **Ollama** para tradução totalmente auto-hospedada e offline. Alterne provedores ou modelos por projeto — ou mesmo por idioma — sem modificar sua base de código.

Um arquivo de configuração controla três modos de tradução, para que você possa misturar e combinar com base em como seu conteúdo está estruturado:

- **Strings de UI** — Extrai chamadas `t("…")` de JS/TS (e opcionalmente arquivos `.astro`) e gera JSON plano, por localidade, para i18next ou pesquisa estática SSG.
- **Documentos** — Traduz páginas Markdown, MDX e `.astro` listadas em `docs[].contentPaths` usando `translate-docs`. Funciona com **VitePress**, **Starlight**, **Docusaurus**, sites baseados em Astro ou qualquer gerador de site estático que leia de arquivos de origem Markdown/MDX/`.astro`.
- **JSON** — Traduz pacotes JSON aninhados arbitrários definidos em `json[]`. Use `translate-json` quando a cópia da UI estiver em arquivos JSON por localidade em vez de chamadas `t()` na origem.

Ativos **SVG** têm seu próprio caminho: `features.translateSVG`, o bloco `svg` de nível superior e `translate-svg` — não `docs[].contentPaths`.

**Qual devo usar?**

| Seu conteúdo                                                                  | Comando                                     |
|-------------------------------------------------------------------------------|---------------------------------------------|
| O código-fonte usa `t()`                                                        | **Strings de UI** — `extract` / `translate-ui` |
| Páginas localizadas ou sites de documentos (VitePress, Starlight, Docusaurus, Astro, etc.) | **Documentos** — `translate-docs`            |
| Arquivos de localidade JSON aninhados e autônomos                                          | **JSON** — `translate-json`                 |

Todos os três compartilham um cache de arquivo/SQLite, então apenas segmentos novos ou alterados (strings ou blocos de texto) são reenviados ao modelo — as execuções são rápidas e baratas, independentemente do provedor que você estiver usando.

<a id="translation-types"></a>
## Tipos de tradução

Cada tipo de tradução tem seu próprio guia com detalhes completos de configuração: [Strings de UI](/guide/ui-strings/), [Documentos](/guide/documents/) e [JSON](/guide/json). Consulte [O que são as ai-i18n-tools?](/guide/what-is-ai-i18n-tools) para uma comparação lado a lado.

Algumas coisas que vale a pena saber de antemão: Strings de UI traduz entradas ausentes por localidade por meio do provedor LLM ativo (consulte [Provedores LLM](#llm-providers)) e grava arquivos JSON simples (`de.json`, `pt-BR.json`, …), com o texto de origem em inglês como a chave de pesquisa em tempo de execução — `strings.json` é o cache de extração, não o pacote de tempo de execução. Documentos suporta os valores `docs[].docsOutput.style`, `"nested"`, `"flat"`, `"doc-system"` e os aliases `"docusaurus"` / `"astro-starlight"` / `"vitepress"` (consulte [Layouts de saída](/guide/documents/output-layouts)). Todos os três compartilham `ai-i18n-tools.config.json` e podem ser combinados; `sync` executa extração, tradução de UI, tradução de SVG, `translate-docs` e `translate-json` em ordem de acordo com suas flags `features`.

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

**Scripts `package.json` (recomendado)** — npm e pnpm adicionam `node_modules/.bin` ao `PATH` ao executar scripts, então você pode chamar o nome do comando diretamente:

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

Em seguida, execute, por exemplo, `pnpm run i18n:sync` — sem a necessidade do prefixo `npx`.

**Shell interativo** — a partir da raiz do seu projeto (após uma instalação local):

```bash
npx ai-i18n-tools sync        # npm
pnpm exec ai-i18n-tools sync  # pnpm
```

Para digitar o comando `ai-i18n-tools` puro em bash/zsh, adicione o diretório bin local ao `PATH` (consulte [Usando a CLI](/guide/installation#using-the-cli) para notas sobre PowerShell, direnv e Windows):

```bash
export PATH="$PWD/node_modules/.bin:$PATH"
ai-i18n-tools sync
```

Prefira `sync` em vez de encadear manualmente `extract`, `translate-ui`, `translate-svg`, `translate-docs` e `translate-json` — a ordem e as flags de recursos são fáceis de errar quando executadas manualmente. Consulte [Scripts `package.json` recomendados](/guide/quick-start#recommended-packagejson-scripts) no guia de início rápido.

**Execução única sem instalação** — `npx ai-i18n-tools <cmd>` ou `pnpm dlx ai-i18n-tools <cmd>` (baixa o pacote apenas para essa invocação; nenhuma entrada em `package.json`).

Defina sua chave de API do provedor (OpenRouter mostrado; use a variável correspondente para seu provedor):

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

<a id="llm-providers"></a>
## Provedores LLM

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

| Provedor     | URL Base                                                  | Variável de ambiente da chave de API      |
|--------------|-----------------------------------------------------------|----------------------|
| `openrouter` | `https://openrouter.ai/api/v1`                            | `OPENROUTER_API_KEY` |
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

O uso de tokens é relatado para cada provedor; o custo exato em USD é mostrado apenas quando o provedor o retorna (OpenRouter). `ai-i18n-tools check-models` valida os IDs de modelo configurados em relação à lista `GET /models` ativa do provedor (qualquer provedor) e mostra os preços quando o provedor os retorna (por exemplo, OpenRouter). `ai-i18n-tools list-models` lista todos os modelos que o provedor ativo anuncia (use `-P` / `--provider` para inspecionar outro provedor configurado). `ai-i18n-tools bench-models` compara cada modelo configurado traduzindo uma amostra isoladamente (os modelos são executados em paralelo, limitados por `concurrency`) e imprime tokens de entrada/saída por modelo, tempo de execução e custo em USD.

Um bloco de configuração `openrouter` de nível superior legado ainda é aceito e é migrado automaticamente para `providers.openrouter` (com `provider: "openrouter"`) ao carregar.

Para uma demonstração prática de como alternar provedores com `-P` em um único documento, consulte [`examples/multi-provider`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/multi-provider/).

---

<a id="quick-start"></a>
## Primeiros passos

<a id="ui-strings"></a>
### Strings de UI

```bash
# 1. Create config (default ui-markdown; plain Astro: init -t ui-astro-website)
npx ai-i18n-tools init

# 2. Extract UI strings to strings.json
npx ai-i18n-tools extract

# 3. Translate to all target locales
npx ai-i18n-tools translate-ui
```

Em seguida, conecte o i18next em seu aplicativo usando os auxiliares de `'ai-i18n-tools/runtime'`. Consulte [Etapa 4: Conectar o i18next em tempo de execução](/guide/ui-strings/i18next-runtime) no guia de strings de UI para a configuração completa.

<a id="documents"></a>
### Documentos

O modelo padrão `init` (`ui-markdown`) habilita apenas a extração de interface. Use um modelo voltado para documentação (ou habilite `features.translateDocs` e adicione `docs[]`) antes de `translate-docs`:

```bash
# Docusaurus docs + optional write-translations catalog
npx ai-i18n-tools init -t ui-docusaurus

# Astro Starlight documentation
# npx ai-i18n-tools init -t ui-starlight

# VitePress documentation (pages + theme JSON)
# npx ai-i18n-tools init -t ui-vitepress

# Plain Astro website — UI extraction for t() in .astro; add docs[] for page HTML (see Astro below)
# npx ai-i18n-tools init -t ui-astro-website

npx ai-i18n-tools translate-docs
npx ai-i18n-tools status
# npx ai-i18n-tools translate-docs --locale de   # single locale
```

Edite `ai-i18n-tools.config.json`: defina `docs[].contentPaths` para markdown, MDX e/ou fontes `.astro`; `docs[].outputDir` e `docs[].docsOutput.style` (`"docusaurus"`, `"astro-starlight"`, `"vitepress"`, `"flat"`, etc.). Referência completa de campos: [Documentos](/guide/documents/).

<a id="vitepress"></a>
### VitePress

`init -t ui-vitepress` estrutura `docsOutput.style: "vitepress"` mais um bloco `json[]` para strings de tema/navegação/barra lateral. Execute `sync` para traduzir o markdown da página e `theme.{locale}.json` juntos. Consulte [Integração com VitePress](/guide/vitepress-integration) e [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/).

<a id="astro-plain-astro--starlight"></a>
### Astro (Astro puro e Starlight)

**Astro Starlight** — `init -t ui-starlight`, então `translate-docs`. As substituições da interface do usuário do Starlight podem usar `src/content/i18n/en.json` com `jsonPathTemplate` em um bloco `docs[]` separado quando necessário ([Documentos — inicializar para documentação](/guide/documents/#step-1-initialise-for-documentation)).

**Astro puro** (sites de marketing ou aplicativos, não Starlight) — combine [roteamento i18n integrado do Astro](https://docs.astro.build/en/guides/internationalization/) com ai-i18n-tools. Projeto de referência: [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) (inglês em `/`, localidades em `/{locale}/`).

A maioria das equipes usa um modelo **híbrido** com dois pipelines:

| Pipeline               | Usar para                                                              | Comandos                   | Saída                                                 |
|------------------------|----------------------------------------------------------------------|----------------------------|--------------------------------------------------------|
| **HTML da Página**          | Títulos, parágrafos, rótulos de navegação, arrays inline no corpo do template | `translate-docs`           | `src/pages/{locale}/index.astro` por localidade            |
| **Strings de interface (`t()`)** | Dados frontmatter, rótulos de abas, arrays compartilhados | `extract` → `translate-ui` | `public/locales/{locale}.json` (fonte em inglês como chave) |

Estruture a UI com `init -t ui-astro-website`. Para HTML codificado em páginas `.astro`, habilite `features.translateDocs` e adicione um bloco `docs[]` com `docsOutput.style: "astro-starlight"` (consulte [Páginas do site Astro (analisar e substituir)](/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace)). Mantenha `targetLocales`, `i18n.locales` em `astro.config.mjs` e `ui-languages.json` alinhados (as rotas do Astro usam códigos minúsculos como `pt-br`; os nomes de arquivo do pacote simples seguem o uso de maiúsculas e minúsculas da configuração, por exemplo, `pt-BR.json`).

Conecte `t()` no tempo de compilação sem i18next, a menos que você adicione ilhas de cliente — consulte [Strings de UI do site Astro (SSG)](/guide/ui-strings/astro-website#astro-website-ui-strings-ssg) e o `src/i18n/t.ts` do exemplo.

<a id="combined-sync"></a>
### Sincronização combinada

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
| `extractInterpolationNamesForWrap(key)`                                | Analisa nomes <code v-pre>{{var}}</code> de uma chave de origem para `wrapT` / fallback de corte de chave.                                                              |
| `wrapI18nWithKeyTrim(i18n)` | Apenas um invólucro de nível inferior para key-trim (obsoleto para conexão de aplicativo; prefira `setupKeyAsDefaultT`). |
| `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, makeLoader)` | Gera o mapa `localeLoaders` para `makeLoadLocale` a partir de `ui-languages.json` (cada `code` exceto `sourceLocale`). |
| `makeLoadLocale(i18n, loaders, sourceLocale)` | Fábrica para carregamento assíncrono de arquivos de localidade. |
| `getTextDirection(lng)` | Retorna `'ltr'` ou `'rtl'` para um código BCP-47. |
| `applyDirection(lng, element?)` | Define o atributo `dir` em `document.documentElement`. |
| `getUILanguageLabel(lang, t)` | Rótulo exibido para uma linha no menu de idiomas (com i18n). |
| `getUILanguageLabelNative(lang)` | Rótulo exibido sem chamar `t()` (estilo cabeçalho). |
| `interpolateTemplate(str, vars)`                                       | Substituição de <code v-pre>{{var}}</code> de baixo nível em uma string simples (usado internamente; o código do aplicativo deve usar `t()` em vez disso).                               |
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
ai-i18n-tools init [-t ui-markdown|ui-docusaurus|ui-starlight|ui-vitepress|ui-astro-website|ui-json-bundles] [-o path] [--with-translate-ignore]
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

Para aplicativos HTML simples, anote os elementos com marcadores `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` puros (o texto de origem é retirado do próprio textContent / title / placeholder do elemento, escrito uma vez); `mark-html` os insere para você e `extract` os captura em `strings.json`. Consulte [Marcando HTML para tradução](/guide/ui-strings/plain-html#marking-html-for-translation).

Listas completas de flags por comando estão em [Referência da CLI](/reference/cli-commands). Execute `ai-i18n-tools <command> --help` para o texto de uso integrado.

Opções globais: `-c <config>` (padrão: `ai-i18n-tools.config.json`), `-v` (detalhado), `-P` / `--provider <name>` (substitui o provedor LLM ativo; deve ser configurado em `providers`), `-L` / `--ui-lang <code>` (idioma para a UI/logs da ferramenta), `-V` / `--version`, e `-h` / `--help` — aceitas em todos os comandos. `-w` / `--write-logs [path]` redireciona a saída do console para um arquivo de log (padrão: no diretório de cache de tradução), mas só tem efeito nos comandos de tradução e sincronização (`translate-docs`, `translate-json`, `translate-svg`, `translate-ui`, `sync-ui`, `sync`, `cleanup`). Vários comandos aceitam `-l` / `--locale <codes>` (BCP-47 separado por vírgulas) para limitar os locais de destino; `proofread-ui` usa um único local de origem. Consulte [referência da CLI](/reference/cli-commands) para a tabela de visão geral dos comandos.

<a id="tool-ui-language-logs-help-dashboard"></a>
### Idioma da interface do usuário da ferramenta (logs, ajuda, painel)

A ferramenta localiza sua própria ajuda da CLI, mensagens de log/resumo de alto tráfego e o Painel de Tradução. O local da interface é resolvido destas fontes, com a maior prioridade primeiro:

1. Flag global `-L` / `--ui-lang <code>` (ex: `-L pt-BR`).
2. Variável de ambiente `AI_I18N_LANG` (ex: `export AI_I18N_LANG=es`).
3. A chave de configuração `uiLanguage` em `ai-i18n-tools.config.json` (string BCP-47).
4. O local do sistema operacional do host (via `Intl.DateTimeFormat().resolvedOptions().locale`).

O local solicitado é comparado com os idiomas de UI fornecidos exatamente ou pela variação mais próxima (por exemplo, `pt-PT` resolve para `pt-BR`, e `en-US` resolve para `en-GB`); quando nada corresponde, ele retorna ao local de origem (`en-GB`). Quando um idioma de UI é solicitado explicitamente (via flag, variável de ambiente ou `uiLanguage`), mas nenhum pacote fornecido corresponde, a CLI imprime um aviso único de que o local padrão será usado; um local inferido apenas do sistema operacional do host nunca avisa. Isso é independente do `sourceLocale` / `targetLocales` do seu projeto. Idiomas de UI fornecidos: `en-GB` (origem) mais `de`, `es`, `fr`, `hi-Latn`, `ja`, `ko`, `pt-BR`, `zh-Hans` e `zh-Hant`. Nenhuma configuração é necessária — por padrão, a ferramenta segue o local do seu sistema operacional. Consulte [Idioma da UI da ferramenta](/reference/environment-variables#tool-ui-language) para obter detalhes.

---

<a id="documentation"></a>
## Documentação

- [Site de documentação](https://wsj-br.github.io/ai-i18n-tools/) — guia completo do VitePress (9 locais no GitHub Pages).
- [Início rápido](/guide/quick-start) — configuração para strings de UI, documentos e JSON (UI, docs/`.astro`, pacotes JSON, Astro Starlight e Astro simples).
- [Guia de ativos de localidade](/guide/images-and-screenshots/) - capturas de tela e SVGs ilustrados em documentos traduzidos (reescritor de link plano, scripts de captura de tela).
- [Arquitetura](/reference/architecture) - arquitetura, internos, API programática e pontos de extensão.
- [Contexto do Agente de IA](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) - **para aplicativos que usam o pacote:** prompts de integração para projetos downstream (copie para as regras do agente do seu repositório).
- Internos do mantenedor para **este** repositório: `dev/package-context.md` (somente clone; não no npm).

---

<a id="license"></a>
## Licença

Este projeto é licenciado sob a Licença MIT.  
Consulte o arquivo [LICENSE](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) para obter detalhes.

Copyright &copy; 2026 Waldemar Scudeller Jr.
