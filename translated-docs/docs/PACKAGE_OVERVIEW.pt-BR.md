<a id="ai-i18n-tools-package-overview"></a>
# ai-i18n-tools: Visão Geral do Pacote

Este documento descreve a arquitetura interna do `ai-i18n-tools`, como cada componente se integra e como são implementados os três fluxos de trabalho componíveis (strings de interface, documentos e JSON aninhado), além da tradução opcional de SVG.

Para instruções práticas de uso, consulte [GETTING_STARTED.md](GETTING_STARTED.pt-BR.md). Para capturas de tela e SVGs ilustrados nos documentos traduzidos, veja [LOCALE-ASSETS-GUIDE.md](LOCALE-ASSETS-GUIDE.pt-BR.md).

<small>**Leia em outros idiomas:** </small>
<small id="lang-list">[English (UK)](../../docs/PACKAGE_OVERVIEW.md) · [Deutsch](./PACKAGE_OVERVIEW.de.md) · [Español](./PACKAGE_OVERVIEW.es.md) · [Français](./PACKAGE_OVERVIEW.fr.md) · [Hindi (Roman)](./PACKAGE_OVERVIEW.hi-Latn.md) · [日本語](./PACKAGE_OVERVIEW.ja.md) · [한국어](./PACKAGE_OVERVIEW.ko.md) · [Português (Brasil)](./PACKAGE_OVERVIEW.pt-BR.md) · [简体中文](./PACKAGE_OVERVIEW.zh-Hans.md) · [繁體中文](./PACKAGE_OVERVIEW.zh-Hant.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Tabela de Conteúdos**

- [Visão geral da arquitetura](#architecture-overview)
- [Árvore de origem](#source-tree)
- [Fluxo de trabalho 1 - Internals da tradução de interface](#workflow-1---ui-translation-internals)
  - [`UIStringExtractor`](#uistringextractor)
  - [`strings.json`](#stringsjson)
  - [Arquivos de localidade planos](#flat-locale-files)
  - [Solicitações de tradução de interface](#ui-translation-prompts)
- [Fluxo de trabalho 2 - Internals da tradução de documentos](#workflow-2---document-translation-internals)
- [Fluxo de trabalho 3 - Internals de JSON aninhado](#workflow-3---nested-json-internals)
  - [Extractores](#extractors)
  - [Sites híbridos Astro (UI + HTML da página)](#astro-hybrid-sites-ui--page-html)
  - [Inserção de âncoras nos títulos (CLI `write-heading-ids`)](#heading-anchor-insertion-write-heading-ids-cli)
  - [Proteção de marcadores](#placeholder-protection)
  - [Cache (`TranslationCache`)](#cache-translationcache)
  - [Resolução de caminho de saída](#output-path-resolution)
  - [Reescrita de links planos](#flat-link-rewriting)
- [Infraestrutura compartilhada](#shared-infrastructure)
  - [`LlmClient`](#openrouterclient)
  - [Carregamento de configuração](#config-loading)
  - [Logger](#logger)
- [API de auxiliares de tempo de execução](#runtime-helpers-api)
  - [Auxiliares RTL](#rtl-helpers)
  - [Fábricas de configuração i18next](#i18next-setup-factories)
  - [Auxiliares de exibição](#display-helpers)
  - [Auxiliares de string](#string-helpers)
- [API programática](#programmatic-api)
- [Pontos de extensão](#extension-points)
  - [Nomes personalizados de funções (extração de UI)](#custom-function-names-ui-extraction)
  - [Extractores personalizados](#custom-extractors)
  - [Caminhos de saída personalizados](#custom-output-paths)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

---

<a id="architecture-overview"></a>
## Visão geral da arquitetura

```text
ai-i18n-tools
├── CLI (src/cli/)             - commands: init, extract, mark-html, translate-ui, translate-svg, translate-docs, translate-json, sync, status, dashboard, …
├── Core (src/core/)           - config, types, cache, prompts, output paths, UI languages
├── Extractors (src/extractors/)  - segment extraction from JS/TS, markdown, JSON, SVG
├── Processors (src/processors/)  - MDX placeholders, HTML tags, admonitions, anchors, URLs, batching, validation, link rewriting, emphasis
├── API (src/api/)             - LlmClient: provider-agnostic chat client (Vercel AI SDK) with model fallback
├── Glossary (src/glossary/)   - glossary loading and term matching
├── Runtime (src/runtime/)     - i18next helpers, display helpers (no i18next import)
├── i18n (src/i18n/)           - self-localization runtime for the tool's own UI (t() + per-locale bundles)
├── Server (src/server/)       - local Express app for the Translation Dashboard (cache / glossary)
└── Utils (src/utils/)         - logger, hash, ignore parser, display-width table, .env loader
```

Tudo o que os consumidores podem precisar programaticamente é reexportado a partir do `src/index.ts`.

---

<a id="source-tree"></a>
## Árvore de origem

```text
src/
├── index.ts                        Public API re-exports
│
├── cli/
│   ├── index.ts                    CLI entry point (commander)
│   ├── extract-strings.ts          `extract` command implementation
│   ├── mark-html.ts                `mark-html` command (insert bare `data-i18n*` markers into HTML)
│   ├── translate-ui-strings.ts     `translate-ui` command implementation
│   ├── doc-translate.ts            `translate-docs` command (documentation files only)
│   ├── translate-json-run.ts       `translate-json` command (`json[]` nested locale bundles)
│   ├── translate-svg.ts            `translate-svg` command (SVG files from `config.svg`)
│   ├── write-heading-ids.ts        `write-heading-ids` command (markdown heading anchors)
│   ├── helpers.ts                  Shared CLI utilities
│   └── file-utils.ts               File collection helpers
│
├── markdown/
│   └── write-heading-ids-core.ts   Slug styles + `<a id="…">` insertion for `write-heading-ids`
│
├── core/
│   ├── types.ts                    Zod schemas + TypeScript types for all config shapes
│   ├── config.ts                   Config loading, merging, validation, init templates
│   ├── cache.ts                    SQLite translation cache (node:sqlite)
│   ├── prompt-builder.ts           LLM prompt construction for docs and UI strings
│   ├── output-paths.ts             Docusaurus / flat output path resolution
│   ├── ui-languages.ts             ui-languages.json loading and locale resolution
│   ├── ui-locale.ts                Resolve the tool's own UI locale (flag/env/config/OS → shipped bundle)
│   ├── locale-utils.ts             BCP-47 normalisation, locale list parsing, script/Han-variant validation
│   └── errors.ts                   Typed error classes
│
├── extractors/
│   ├── base-extractor.ts           Abstract base class for all extractors
│   ├── ui-string-extractor.ts      JS/TS source scanner (i18next-scanner + Babel for `.astro`)
│   ├── ui-string-babel.ts          Babel-based `t()` discovery in `.astro` frontmatter and `{expression}` blocks
│   ├── ui-string-locations.ts      Source locations for extracted UI strings
│   ├── html-i18n-marks.ts          HTML `data-i18n*` marker scanner + `mark-html` annotator
│   ├── classify-segment.ts         Heuristic segment type classification
│   ├── markdown-extractor.ts       Markdown / MDX segment extraction
│   ├── markdown-segment-split.ts   Optional segment splitting for long markdown blocks
│   ├── frontmatter-fields.ts       Selective YAML front matter field translation
│   ├── astro-template-extractor.ts `.astro` parse-and-replace (HTML + template expressions; used by `translate-docs`)
│   ├── json-extractor.ts           Docusaurus catalog JSON extraction (`translate-docs`)
│   ├── nested-json-extractor.ts    Arbitrary nested JSON leaves (`translate-json`, `json[]`)
│   └── svg-extractor.ts            SVG text extraction
│
├── processors/
│   ├── placeholder-handler.ts      Chain: HTML → admonitions → anchors → MDX → URLs → emphasis
│   ├── expression-attribute-protection.ts  Shared protected attribute/key lists (Astro + MDX JSX)
│   ├── url-placeholders.ts         Markdown URL protection/restore
│   ├── admonition-placeholders.ts  Docusaurus admonition protection/restore
│   ├── anchor-placeholders.ts      HTML anchor / heading ID protection/restore
│   ├── html-tag-placeholders.ts    Lowercase HTML tag / comment protection ({{HTM_N}})
│   ├── mdx-placeholders.ts         MDX comments, JSX tags, brace expressions, JSX attribute extraction
│   ├── batch-processor.ts          Segment → batch grouping (count + char limits)
│   ├── validator.ts                Post-translation structural checks
│   └── flat-link-rewrite.ts        Relative link rewriting for flat output
│
├── api/
│   ├── llm-client.ts               LlmClient: provider-agnostic chat client (AI SDK) with model fallback chain
│   └── provider-models-catalog.ts  Fetch/parse any provider's OpenAI-compatible GET /models catalog
│
├── glossary/
│   ├── glossary.ts                 Glossary loading (CSV + auto-build from strings.json)
│   └── matcher.ts                  Term hint extraction for prompts
│
├── runtime/
│   ├── index.ts                    Runtime re-exports
│   ├── template.ts                 interpolateTemplate, flipUiArrowsForRtl
│   ├── ui-language-display.ts      getUILanguageLabel, getUILanguageLabelNative
│   └── i18next-helpers.ts          RTL detection, i18next setup factories
│
├── i18n/                           Self-localization runtime for the tool's own UI
│   ├── index.ts                    t(source, vars) + bundle/manifest loaders (keyed by English source string)
│   └── locales/                    Shipped UI bundles (de.json, es.json, …; generated by `pnpm i18n:self`)
│
├── dashboard-app/
│   ├── index.html                  Translation Dashboard static UI (HTML/CSS/JS)
│   ├── app.js
│   └── styles.css
│
├── server/
│   └── translation-dashboard.ts    Express app for Translation Dashboard (cache / strings.json / glossary)
│
└── utils/
    ├── logger.ts                   Leveled logger with ANSI support
    ├── hash.ts                     Segment hash (SHA-256 first 16 hex)
    ├── table.ts                    Display-width aware table rendering (CJK/emoji column alignment)
    ├── load-dotenv.ts              Auto-load `.env` from the cwd at CLI startup (never overrides existing env)
    └── ignore-parser.ts            .translate-ignore file parser
```

---

<a id="workflow-1---ui-translation-internals"></a>
## Fluxo de trabalho 1 - Internals da tradução de interface

```text
source files (JS/TS, optional `.astro`)
      │
      ▼  UIStringExtractor (i18next-scanner Parser; `.astro` via ui-string-babel.ts)
strings.json  ─────────────────── master catalog
      │             { hash: { source, translated, models?, locations? } }
      ▼
LlmClient.translateUIBatch()
      │  sends JSON array of source strings, receives JSON array of translations (+ model id per batch)
      ▼
de.json, pt-BR.json …  ─────────── per-locale flat maps: source → translation (no model metadata)
```

<a id="uistringextractor"></a>
### `UIStringExtractor`

Utiliza o `i18next-scanner` do `Parser.parseFuncFromString` para localizar chamadas `t("literal")` e `i18n.t("literal")` em arquivos JS/TS. Para fontes `.astro` (quando listadas em `ui.uiExtractor.extensions`), o `ui-string-babel.ts` analisa o frontmatter e blocos de modelo `{expression}` com `@babel/parser` e aplica as mesmas regras de `funcNames`. Nomes de funções e extensões de arquivos são configuráveis por meio de `ui.uiExtractor` (`ui.reactExtractor` é um alias suportado). `extract` **também mescla entradas não provenientes do scanner no mesmo catálogo:** o `package.json` do projeto `description` quando `includePackageDescription` está habilitado (padrão), e cada `englishName` de `ui-languages.json` quando `includeUiLanguageEnglishNames` é `true` e `uiLanguagesPath` está definido (strings já encontradas no código-fonte têm precedência). Os hashes dos segmentos são os **primeiros 8 caracteres hexadecimais do MD5** da string-fonte recortada — esses tornam-se as chaves em `strings.json`.

Para fontes `.html` / `.htm` (quando listadas em `ui.uiExtractor.extensions`), `extract` em vez disso roteia o arquivo através de `html-i18n-marks.ts`, que escaneia atributos de marcador `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` (configurável via `ui.uiExtractor.htmlI18nAttributes`). Um marcador simples obtém seu texto de origem do próprio `textContent` / `title` / `placeholder` do elemento; um marcador com valor (`data-i18n="Key"`) usa o valor. O mesmo módulo alimenta o comando `mark-html`, que insere os marcadores simples automaticamente. Arquivos HTML nunca chegam às etapas do Babel / i18next-scanner.

Sites Astro SSG simples podem pular o i18next: carregue o `{locale}.json` plano em tempo de compilação e resolva `t('English')` pela chave de texto-fonte (veja `examples/astro-website/src/i18n/t.ts` e [GETTING_STARTED — site Astro](GETTING_STARTED.pt-BR.md#astro-website)).

Aplicativos HTML simples seguem o mesmo modelo de catálogo com atributos de marcador em vez de chamadas `t()` — veja [GETTING_STARTED — Marcando HTML para tradução](GETTING_STARTED.pt-BR.md#marking-html-for-translation).

<a id="stringsjson"></a>
### `strings.json`

O catálogo mestre tem a seguinte estrutura:

```json
{
  "<md5-8>": {
    "source": "The English string",
    "translated": {
      "de": "Der deutsche Text",
      "pt-BR": "O texto em português"
    },
    "models": {
      "de": "anthropic/claude-3.5-haiku",
      "pt-BR": "openai/gpt-4o"
    },
    "locations": [{ "file": "src/app/page.tsx", "line": 51 }]
  }
}
```

`models` (opcional) — por localidade, qual modelo produziu essa tradução após a última execução bem-sucedida do `translate-ui` para essa localidade (ou `user-edited` se o texto foi salvo no Painel de Tradução). `locations` (opcional) — onde o `extract` encontrou a string (scanner + linha de descrição do pacote; strings somente de manifesto `englishName` podem omitir `locations`).

`extract` adiciona novas chaves e preserva os dados existentes de `translated` / `models` para chaves ainda presentes na varredura (literais do scanner, descrição opcional, `englishName` opcional do manifesto). `translate-ui` preenche entradas `translated` ausentes, atualiza `models` para localidades que traduz e grava arquivos de localidade planos.

`ui-languages.json` **manifesto** — array JSON de `{ code, label, englishName, direction }` (BCP-47 `code`, UI `label`, referência `englishName`, `"ltr"` ou `"rtl"`). Use `generate-ui-languages` para construir um arquivo de projeto a partir do `sourceLocale` + `targetLocales` e do `data/ui-languages-complete.json` mestre embutido.

<a id="flat-locale-files"></a>
### Arquivos de localidade planos

Cada localidade de destino recebe um arquivo JSON plano (`de.json`) mapeando string de origem → tradução (sem campo `models`):

```json
{
  "The English string": "Der deutsche Text",
  "Save": "Speichern"
}
```

O i18next carrega esses arquivos como pacotes de recursos e procura traduções pela string de origem (modelo de chave como padrão).

<a id="ui-translation-prompts"></a>
### Solicitações de tradução de interface

`buildUIPromptMessages` constrói mensagens de sistema e do usuário que:

- Identifique os idiomas de origem e destino (pelo nome exibido em `localeDisplayNames` ou `ui-languages.json`).
- Envie um array JSON de strings e solicite um array JSON de traduções em retorno.
- Inclua dicas de glossário quando disponíveis.

`LlmClient.translateUIBatch` tenta cada modelo em ordem, recorrendo a erros de análise ou de rede. A CLI constrói essa lista a partir do `translationModels` do provedor ativo; para `translate-ui`, `ui.preferredModel` opcional é anexado quando definido (deduplicado contra o restante).

---

<a id="workflow-2---document-translation-internals"></a>
## Fluxo de trabalho 2 - Internals da tradução de documentos

```text
markdown / MDX / JSON / `.astro` files (`translate-docs`)
      │
      ▼  MarkdownExtractor / JsonExtractor / AstroTemplateExtractor
segments[]  ─────────────────── typed segments with hash + content
      │
      ▼  PlaceholderHandler
protected text  ──────────────── HTML tags, admonitions, anchors, MDX comments/JSX/braces,
                                URLs, inline code, emphasis masked as tokens
      │
      ▼  splitTranslatableIntoBatches
batches[]  ───────────────────── grouped by count + char limit
      │
      ▼  TranslationCache lookup
cache hit → skip, miss → LlmClient.translateDocumentBatch
      │
      ▼  PlaceholderHandler.restoreAfterTranslation
final text  ──────────────────── placeholders restored
      │
      ▼  resolveDocumentationOutputPath
output file  ─────────────────── Docusaurus layout or flat layout
```

<a id="extractors"></a>
### Extratores

Todos os extratores estendem `BaseExtractor` e implementam `extract(content, filepath): Segment[]`.

- `MarkdownExtractor` - divide o markdown em segmentos tipados: `frontmatter`, `heading`, `paragraph`, `code`, `admonition`. O frontmatter YAML é classificado como **não traduzível** (`slug`, `id` e outras chaves de roteamento permanecem estáveis). Blocos `export ...` de nível superior (por exemplo, definições de componentes React) são classificados como segmentos `other` não traduzíveis, juntamente com o tratamento existente de `import ...`. Blocos multilinha que começam com uma tag JSX maiúscula (por exemplo, um bloco `<Tabs>`) são classificados como parágrafos traduzíveis. Segmentos não traduzíveis (blocos de código, HTML bruto) são preservados textualmente.
- `AstroTemplateExtractor` - análise e substituição para páginas de marketing `.astro` (`translate-docs` via `translateAstroFile` em `doc-translate.ts`). Extrai nós de texto HTML voltados ao usuário e atributos traduzíveis (`alt`, `title`, `aria-label`, `placeholder`), além de literais de string dentro de blocos de modelo `{expression}` quando voltados ao usuário. Ignora TypeScript no frontmatter, `<script>`, `<style>`, valores de atributos/chaves protegidos e literais dentro de `t('…')`. A remontagem ajusta as importações relativas quando os caminhos de saída são mais profundos (por exemplo, `src/pages/de/index.astro`). Veja [GETTING_STARTED — páginas do site Astro](GETTING_STARTED.pt-BR.md#astro-website-parse-and-replace).
- `JsonExtractor` - extrai valores de string de arquivos JSON de rótulos do Docusaurus (catálogos da interface do Docusaurus, não o corpo MDX).
- `SvgExtractor` - extrai conteúdo `<text>`, `<title>` e `<desc>` de SVG (usado por `translate-svg` para arquivos em `config.svg`, não por `translate-docs`).
- `html-i18n-marks.ts` - um scanner focado de tags HTML usado por `extract` para fontes `.html` / `.htm` e pelo comando `mark-html`. `collectHtmlI18nStrings` / `collectHtmlI18nLocations` leem atributos de marcador `data-i18n*` (marcador simples → `textContent` / `title` / `placeholder` do elemento; marcador com valor → o valor), e `markHtmlContent` insere marcadores simples em texto folha / título / elementos de placeholder (idempotente, respeita `data-i18n-ignore`, pula elementos parecidos com código e de conteúdo misto). O helper compartilhado `normalizeI18nText` mantém as chaves de tempo de compilação idênticas ao runtime do navegador.

<a id="astro-hybrid-sites-ui--page-html"></a>
### Sites híbridos Astro (UI + HTML de página)

Aplicativos Astro simples geralmente habilitam **ambos** os fluxos de trabalho em uma única configuração (referência: `examples/astro-website/`):

| Camada | Mecanismo | Saída |
|-------|-----------|--------|
| Modelo HTML | `AstroTemplateExtractor` + `translate-docs` | `.astro` por localidade em `docs[].outputDir` |
| Frontmatter / `t('…')` | `ui-string-babel.ts` + `extract` + `translate-ui` | `public/locales/{locale}.json` plano (fonte em inglês como chave) |

O comando `sync` executa as etapas habilitadas em ordem: **extract** e depois **translate-ui** (quando `features.translateUIStrings`) → opcional **translate-svg** → **translate-docs** → opcional **translate-json** (a menos que pulado com `--no-ui`, `--no-svg`, `--no-docs` ou `--no-json`). O modelo init `ui-astro-website` configura apenas o Fluxo de trabalho 1; adicione `docs[]` e `features.translateDocs` para HTML de páginas.

<a id="heading-anchor-insertion-write-heading-ids-cli"></a>
### Inserção de âncoras de título (`write-heading-ids` CLI)

O comando `write-heading-ids` é um pré-processador **local, sem uso de LLM**, para arquivos markdown de documentação. Implementação: `src/cli/write-heading-ids.ts` coordena a descoberta de arquivos; `src/markdown/write-heading-ids-core.ts` analisa as linhas e insere âncoras.

Exige uma configuração válida com **pelo menos um bloco `docs[]`**. Para cada bloco, ele coleta arquivos `.md` / `.mdx` em `contentPaths`, aplica as regras `.translate-ignore` do projeto (mesma ideia da tradução de documentos) e, opcionalmente, restringe a uma subárvore com `--path` / `--file`. Cada arquivo é transformado com `applyHeadingAnchorsToMarkdown`: para cada **cabeçalho ATX plano** (`# …` até `###### …`) fora de blocos de código com delimitadores, uma linha HTML vazia `<a id="slug"></a>` é inserida na linha acima, quando ausente ou desatualizada. Os algoritmos de slug seguem ecossistemas comuns — `github` (padrão), `bitbucket`, `gitlab`, `pymdown` (sinalizadores opcionais de normalização Unicode / codificação porcentual), `azure-devops` — para que os IDs de âncora permaneçam consistentes com as ferramentas existentes (doctoc, PyMdown, etc.). `--dry-run` relata alterações previstas sem gravar.

Este comando **não** é executado dentro do `translate-docs` ou do `sync`; execute-o explicitamente quando desejar IDs de fragmento estáveis nos arquivos de origem antes da tradução ou publicação.

<a id="placeholder-protection"></a>
### Proteção de espaços reservados

Antes da tradução, a sintaxe sensível é substituída por tokens opacos para evitar corrupção pelo LLM, aplicado nesta ordem (a restauração é inversa):

1. **Tags HTML e comentários** (`<strong>`, `<!-- ... -->`, etc.) - tags HTML em letras minúsculas de uma lista de permissões conhecida são substituídas por tokens `{{HTM_N}}`. Tags JSX em maiúsculas (`<Highlight>`, `<Tabs>`, `</Tab>`) são tratadas separadamente pela camada MDX (etapa 4).
2. **Marcadores de advertência** (`:::note`, `:::`) - apenas o prefixo da diretiva na linha de abertura é substituído por `{{ADM_OPEN_N}}`; qualquer título na mesma linha é deixado para o modelo traduzir. Restaurado com o texto original exato.
3. **Âncoras de documento** (HTML `<a id="…">`, título do Docusaurus `{#…}`) - preservadas textualmente.
4. **Construções exclusivas MDX** (`src/processors/mdx-placeholders.ts`):
   - **Comentários MDX** (`{/* … */}`, incluindo a forma heading-id do Docusaurus `{/* #my-id */}`) substituídos por `{{MDX_N}}`.
   - **Tags JSX com letras maiúsculas** (`<Highlight>`, `<Tabs>`, `<TabItem>`, `<TOCInline />`, `</Highlight>`) - mantidas como `{{MDX_N}}` com atributos de string traduzíveis (`label`, `tooltip`, `aria-label`) reescritos para `{{JXA_N}}` dentro da tag, a menos que o nome do atributo apareça em `docs[].protectAttributes`; `label:` dentro de literais de objeto `<Tabs values={[ { label: '…' } ]}>` (ignoráveis via `docs[].protectKeys`) e `<TabItem value="…">` (quando não existe atributo `label`, ignorando valores em minúsculas semelhantes a slug) também são extraídos. Anexados ao segmento como linhas `||JXA_N: …||`, mescladas novamente por `restoreMdx`.
   - **Expressões entre chaves MDX** (`{frontMatter.title}`, `style={{…}}`) - correspondência com controle de profundidade, substituídas por `{{MDX_N}}`.
5. **URLs em Markdown** (`](url)`, `src="../../docs/…"`) - restauradas a partir de um mapa após a tradução.
6. **Trechos de código embutidos** (`` `code` ``) e **código embutido em negrito** (`**`code`**`) - preservados.
7. **Ênfase em markdown** (opcional, ativado automaticamente para localidades CJK/RTL) - delimitadores de ênfase mascarados.

A proteção compartilhada de atributos/chaves para modelos Astro e JSX MDX é implementada em `src/processors/expression-attribute-protection.ts` e controlada por bloco por meio de `docs[].protectAttributes` e `docs[].protectKeys` (veja [GETTING_STARTED — protectAttributes / protectKeys](GETTING_STARTED.pt-BR.md#protectattributes-protectkeys)).

<a id="cache-translationcache"></a>
### Cache (`TranslationCache`)

O banco de dados SQLite (via `node:sqlite`) armazena linhas indexadas por `(source_hash, locale)` com `translated_text`, `model`, `filepath`, `last_hit_at` e campos relacionados. O hash corresponde aos primeiros 16 caracteres hexadecimais SHA-256 do conteúdo normalizado (espaços em branco reduzidos).

A cada execução, os segmentos são pesquisados por hash × localidade. Apenas os erros de cache vão para o LLM. Após a tradução, `last_hit_at` é redefinido para as linhas de segmento no escopo de tradução atual que não foram atingidas. Os acertos de cache bem-sucedidos durante a tradução de documentos limpam as linhas `translation_failures` obsoletas para esse segmento. `cleanup` executa `sync --force-update` primeiro, depois remove as linhas de segmento obsoletas (`last_hit_at` nulo / caminho de arquivo vazio), remove as chaves `file_tracking` quando o caminho de origem resolvido está ausente no disco (`doc-block:…`, `json-block:…`, `svg-files:…`, etc.), remove as linhas de tradução cujo caminho de arquivo de metadados aponta para um arquivo ausente, remove as linhas `translation_failures` órfãs e remove as linhas `markdown_source_issues` órfãs cujo caminho de origem resolvido está ausente no disco; ele não faz backup de `cache.db` a menos que `--backup <path>` seja passado, o que grava um backup nesse caminho primeiro.

O comando `translate-docs` também usa **rastreamento de arquivos**, para que fontes inalteradas com saídas existentes possam pular trabalho completamente. `--force-update` reexecuta o processamento de arquivos mantendo o cache de segmentos; `--force` limpa o rastreamento de arquivos e ignora leituras do cache de segmentos para tradução de API. Quando todos os modelos configurados falham na validação AST em um segmento markdown, `translate-docs` pode dividir progressivamente o segmento e tentar partes menores novamente (`docs[].segmentSplitting.qualityRetrySplit`, ativado por padrão). Veja [Introdução](GETTING_STARTED.pt-BR.md#cache-behaviour-and-translate-docs-flags) para a tabela completa de flags.

**Formato de prompt em lote:** `translate-docs --prompt-format` seleciona formas de array/objeto XML (`<seg>` / `<t>`) ou JSON para `LlmClient.translateDocumentBatch` apenas; extração, placeholders e validação permanecem inalterados. Veja [Formato de prompt em lote](GETTING_STARTED.pt-BR.md#batch-prompt-format).

<a id="output-path-resolution"></a>
### Resolução de caminho de saída

`resolveDocumentationOutputPath(config, cwd, locale, relPath, kind)` mapeia um caminho relativo à fonte para o caminho de saída:

- Estilo `nested` (padrão): `{outputDir}/{locale}/{relPath}` para markdown.
- Estilo `doc-system`: dentro de `docsRoot`, as saídas usam `{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}`; caminhos fora de `docsRoot` retornam ao layout aninhado. Apelidos: `docusaurus` (padrão `localeSubpath` = caminho do plugin Docusaurus), `astro-starlight` (padrão `localeSubpath` vazio).
- Estilo `flat`: `{outputDir}/{stem}.{locale}{extension}`. Quando `flatPreserveRelativeDir` é `true`, os subdiretórios de origem são mantidos dentro de `outputDir`.
- `pathTemplate` **personalizado**: qualquer layout markdown usando `{outputDir}`, `{locale}`, `{LOCALE}`, `{relPath}`, `{stem}`, `{basename}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}`.
- **Personalizado** `jsonPathTemplate`: layout personalizado separado para arquivos de rótulos JSON, usando os mesmos espaços reservados.
- `linkRewriteDocsRoot` ajuda o reescritor de links planos a calcular os prefixos corretos quando a saída traduzida está localizada em outro lugar além da raiz padrão do projeto.

<a id="flat-link-rewriting"></a>
### Reescrita plana de links

Quando `docsOutput.style === "flat"`, os arquivos markdown traduzidos são colocados ao lado dos originais com sufixos de localidade. Links relativos entre páginas são reescritos para que `[Guide](../../docs/guide.md)` em `readme.de.md` aponte para `guide.de.md`. Controlado por `rewriteRelativeLinks` (ativado automaticamente para estilo plano sem um `pathTemplate` personalizado). A mesma etapa adiciona um prefixo de profundidade por arquivo às URLs de ativos não markdown antes da execução do `postProcessing.regexAdjustments` — consulte o [Guia de ativos por localidade](LOCALE-ASSETS-GUIDE.pt-BR.md#the-flat-link-rewriter-and-two-step-flow).

---

<a id="workflow-3---nested-json-internals"></a>
## Fluxo de trabalho 3 - Internals de JSON aninhado

```text
json[].contentPaths  →  resolve files (file | directory | glob)
      │
      ▼  NestedJsonExtractor
string leaves selected by keyPolicy (dot paths + minimatch)
      │
      ▼  PlaceholderHandler + batch + TranslationCache (shared SQLite)
cache hit → skip, miss → LlmClient.translateDocumentBatch
      │
      ▼  NestedJsonExtractor.reassemble
output file  ─────────── expandJsonBlockOutputPath(outputPathTemplate)
```

- `NestedJsonExtractor` (`src/extractors/nested-json-extractor.ts`) percorre JSON aninhado arbitrário e emite um segmento por folha de string traduzível. `keyPolicy.mode` (`allowlist`, `denylist` ou `both`) filtra caminhos com minimatch em notação de ponto (nomes simples como `slug` correspondem ao último segmento da chave).
- O rastreamento de cache de arquivos usa `json-block:{blockIndex}:{projectRelPath}` em `file_tracking` (mesmo `cacheDir` usado em documentos e SVG).
- **Não** para catálogos `write-translations` do Docusaurus (formato `{ message, description }`) — estes usam o Fluxo de trabalho 2 (`docs[].docusaurusCatalogDir` + `JsonExtractor` dentro de `translate-docs`).
- **Não** para strings de UI `t()` — Fluxo de trabalho 1 (`strings.json` + pacotes planos).
- CLI: `translate-json`; orquestração em `src/cli/translate-json-run.ts`. Modelo init: `ui-json-bundles`.

---

<a id="shared-infrastructure"></a>
## Infraestrutura compartilhada

<a id="openrouterclient"></a>
### `LlmClient`

Cliente de chat independente de provedor construído sobre o Vercel AI SDK (`ai` + `@ai-sdk/openai-compatible`). Ele resolve o provedor ativo a partir de `provider` / `providers`, constrói um cliente compatível com OpenAI (`createOpenAICompatible`) para o `baseUrl` + chave de API desse provedor e roteia todas as chamadas através de `generateText`. `OpenRouterClient` é mantido como um alias obsoleto. Comportamentos chave:

- **Fallback de modelo**: tenta cada modelo na lista resolvida em ordem; recorre a falhas de solicitação ou análise. A tradução da interface do usuário resolve `ui.preferredModel` primeiro, quando presente, depois o `translationModels` do provedor.
- **Tempo limite de solicitação**: o `requestTimeoutMs` ativo do provedor (padrão de 30 segundos) aborta cada solicitação via `AbortSignal.timeout`. O mesmo valor se aplica a `GET /models` quando a CLI carrega a lista de modelos de um provedor para `check-models` (qualquer provedor) e o filtro opcional de pré-verificação que descarta IDs de modelo desconhecidos (apenas OpenRouter).
- **Extras do OpenRouter** (apenas quando `openrouter` está ativo): roteamento de taxa de transferência através do campo de solicitação `provider`, cabeçalhos `HTTP-Referer` / `X-Title` e custo exato em USD lido de `usage.cost`. O uso de tokens é relatado para cada provedor; o custo exato apenas quando o provedor o retorna.
- **Log de tráfego de depuração**: se `debugTrafficFilePath` estiver definido, anexa JSON de solicitação e resposta a um arquivo.

<a id="config-loading"></a>
### Carregamento de configuração

Pipeline `loadI18nConfigFromFile(configPath, cwd)`:

1. Ler e analisar `ai-i18n-tools.config.json` (JSON).
2. `mergeWithDefaults` - mesclar profundamente com `defaultI18nConfigPartial`, e mesclar quaisquer entradas `docs[].sourceFiles` em `contentPaths`.
3. `expandTargetLocalesFileReferenceInRawInput` - se `targetLocales` for um caminho de arquivo, carregar o manifesto e expandir para códigos de localidade; definir `uiLanguagesPath`.
4. `expandDocumentationTargetLocalesInRawInput` - o mesmo para cada entrada `docs[].targetLocales`.
5. `parseI18nConfig` - Validação Zod + `validateI18nBusinessRules`.
6. `applyEnvOverrides` - aplicar `OPENROUTER_API_KEY`, `I18N_SOURCE_LOCALE`, etc.
7. `augmentConfigWithUiLanguagesFile` - anexar nomes de exibição do manifesto.

`init` escreve configurações iniciais a partir de `initConfigTemplates`: `ui-markdown` (UI + markdown opcional do app), `ui-docusaurus`, `ui-starlight`, `ui-astro-website` (UI Astro simples; adicione `docs[]` para tradução de páginas `.astro`), `ui-json-bundles` (apenas `json[]` do Fluxo de trabalho 3). Veja [GETTING_STARTED — Inicializar](GETTING_STARTED.pt-BR.md#step-1-initialise).

<a id="logger"></a>
### Registrador de eventos (Logger)

`Logger` suporta níveis `debug`, `info`, `warn`, `error` com saída de cores ANSI. O modo detalhado (`-v`) habilita `debug`. Quando `logFilePath` está definido, as linhas de log também são gravadas nesse arquivo.

<a id="self-localization-tool-ui"></a>
### Auto-localização (interface do usuário da ferramenta)

A ferramenta localiza sua própria interface — ajuda da CLI, mensagens de log/resumo/erro de alto tráfego e o Painel de Tradução — separadamente do conteúdo que ela traduz para você.

- **Resolução de localidade** (`resolveUiLocale` em `src/core/ui-locale.ts`): seleciona a localidade da interface a partir de `-L` / `--ui-lang` > `AI_I18N_LANG` > configuração `uiLanguage` > localidade do sistema operacional do host (`Intl.DateTimeFormat().resolvedOptions().locale`). O candidato é normalizado e comparado com o conjunto de pacotes fornecido exatamente ou por variação mais próxima (por exemplo, `pt-PT` → `pt-BR`, `en-US` → `en-GB`), voltando para a localidade de origem (`en-GB`). A CLI é resolvida uma vez antes que a ajuda seja criada (verificação pré-análise de argv) e novamente após o carregamento da configuração para que `uiLanguage` se aplique (a flag e a variável de ambiente ainda vencem).
- **Tempo de execução** (`src/i18n/index.ts`): um `t(source, vars)` mínimo com interpolação `{{name}}`, indexado pela string de origem em inglês contra pacotes planos por localidade em `src/i18n/locales/<code>.json` (copiados para `dist/i18n/locales` na compilação). Chaves ou pacotes ausentes retornam o texto de origem. Este é o mesmo modelo de chave-como-padrão do Fluxo de Trabalho 1 — não há pesquisa de hash.
- **Painel**: o servidor expõe `GET /api/ui-i18n` retornando `{ locale, dir, bundle }` para a localidade da interface resolvida; o frontend define `<html lang>` / `dir` e localiza o markup estático via atributos `data-i18n*`.
- **Dogfooding**: os pacotes são produzidos executando o próprio pipeline de extração → `translate-ui` do pacote contra `ai-i18n-self.config.json` (`pnpm i18n:self`). As chaves do catálogo vêm de chamadas `t()` em `src/cli/` e `src/i18n/`, mais os marcadores `data-i18n*` do painel em `src/dashboard-app/index.html`.

---

<a id="runtime-helpers-api"></a>
## API de auxiliares de tempo de execução

Estes são exportados de `'ai-i18n-tools/runtime'` e funcionam em qualquer ambiente JavaScript (navegador, Node.js, Deno, Edge). Eles **não** importam de `i18next` ou `react-i18next`.

<a id="rtl-helpers"></a>
### Auxiliares de RTL

```ts
RTL_LANGS: ReadonlySet<string>
getTextDirection(lng: string): 'ltr' | 'rtl'
applyDirection(lng: string, element?: Element): void
```

<a id="i18next-setup-factories"></a>
### Fábricas de configuração do i18next

```ts
defaultI18nInitOptions(sourceLocale?: string): i18nextInitOptions
setupKeyAsDefaultT(i18n: I18nLike & Partial<I18nWithResources>, options: SetupKeyAsDefaultTOptions): void
wrapI18nWithKeyTrim(i18n: I18nLike): void
wrapT(i18n: I18nLike, options: WrapTOptions): void
buildPluralIndexFromStringsJson(entries: Record<string, { plural?: boolean; source?: string }>): Record<string, string>
makeLocaleLoadersFromManifest(
  manifest: readonly { code: string }[],
  sourceLocale: string,
  makeLoaderForLocale: (localeCode: string) => () => Promise<unknown>
): Record<string, () => Promise<unknown>>
makeLoadLocale(
  i18n: I18nWithResources,
  localeLoaders: Record<string, () => Promise<unknown>>,
  sourceLocale?: string
): (lang: string) => Promise<void>
```

Use `setupKeyAsDefaultT` como ponto de entrada habitual do aplicativo (chave recortada + plural `wrapT` + opcional `translate-ui` `{sourceLocale}.json`). Chamar apenas `wrapI18nWithKeyTrim` é **obsoleto** para configuração de aplicativos.

Compile `localeLoaders` com `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, …)` para que as chaves permaneçam alinhadas com `targetLocales` após `generate-ui-languages`. Veja `docs/GETTING_STARTED.md` (conexão em tempo de execução), `examples/nextjs-app/`, `examples/console-app/` e `examples/astro-website/` (`makeT` personalizado sem i18next).

<a id="display-helpers"></a>
### Auxiliares de exibição

```ts
getUILanguageLabel(lang: UiLanguageEntry, t: TranslateFn): string
getUILanguageLabelNative(lang: UiLanguageEntry): string
```

<a id="string-helpers"></a>
### Auxiliares de string

```ts
interpolateTemplate(str: string, vars: Record<string, string | number | boolean>): string
flipUiArrowsForRtl(text: string | null | undefined, isRtl: boolean): string | null | undefined
```

---

<a id="programmatic-api"></a>
## API programática

Todos os tipos e classes públicos são exportados da raiz do pacote. Exemplo: executar a etapa translate-UI no Node.js sem a CLI:

```ts
import { loadI18nConfigFromFile, runTranslateUI } from 'ai-i18n-tools';

// Config must have features.translateUIStrings: true (and valid targetLocales, etc.).
const config = loadI18nConfigFromFile('ai-i18n-tools.config.json');

const summary = await runTranslateUI(config, {
  cwd: process.cwd(),
  locales: config.targetLocales,
  force: false,
  dryRun: false,
  verbose: false,
});
console.log(
  `Updated ${summary.stringsUpdated} string(s); locales touched: ${summary.localesTouched.join(', ')}`
);
```

Principais exportações:

| Exportação | Descrição |
|---|---|
| `loadI18nConfigFromFile` | Carrega, mescla e valida a configuração a partir de um arquivo JSON. |
| `parseI18nConfig` | Valida um objeto de configuração bruto. |
| `TranslationCache` | Cache SQLite - instanciar com um caminho `cacheDir`. |
| `UIStringExtractor` | Extrair strings `t("…")` do código-fonte JS/TS. |
| `collectHtmlI18nStrings` / `markHtmlContent` | Escaneia / insere marcadores `data-i18n*` em HTML (alimenta `extract` para `.html` e o comando `mark-html`). |
| `MarkdownExtractor` | Extrair segmentos traduzíveis do markdown. |
| `JsonExtractor` | Extrair de arquivos de rótulo JSON do Docusaurus (catálogos de interface, não corpo MDX). |
| `SvgExtractor` | Extrair de arquivos SVG. |
| `LlmClient` | Faz solicitações de tradução para o provedor LLM ativo (`OpenRouterClient` é um alias obsoleto). |
| `PlaceholderHandler` | Protege/restaura a sintaxe markdown ao redor da tradução (tags HTML, advertências, âncoras, comentários MDX/JSX/chaves, URLs, código embutido, ênfase). |
| `protectMdx` / `restoreMdx` | Protege/restaura comentários MDX, tags JSX, expressões entre chaves e atributos de string JSX (chamado por `PlaceholderHandler`; também exportado para uso direto). |
| `splitTranslatableIntoBatches` | Agrupar segmentos em lotes com tamanho adequado para LLMs. |
| `validateTranslation` | Verificações estruturais após a tradução. |
| `resolveDocumentationOutputPath` | Resolver o caminho do arquivo de saída para um documento traduzido. |
| `Glossary` / `GlossaryMatcher` | Carregar e aplicar glossários de tradução. |
| `runTranslateUI` | Ponto de entrada programático para a interface de tradução. |

---

<a id="extension-points"></a>
## Pontos de extensão

<a id="custom-function-names-ui-extraction"></a>
### Nomes personalizados de funções (extração da interface)

Adicione nomes não padrão de funções de tradução via configuração:

```json
{
  "ui": {
    "uiExtractor": {
      "funcNames": ["t", "i18n.t", "translate", "i18n.translate"],
      "extensions": [".js", ".jsx", ".ts", ".tsx", ".astro", ".html"],
      "htmlI18nAttributes": ["data-i18n", "data-i18n-title", "data-i18n-placeholder"]
    }
  }
}
```

(`ui.reactExtractor` é um alias totalmente suportado para `ui.uiExtractor`.)

Adicione `.html` / `.htm` a `extensions` para escanear atributos de marcador HTML durante `extract`. `ui.uiExtractor.htmlI18nAttributes` é opcional e usa o padrão `["data-i18n", "data-i18n-title", "data-i18n-placeholder"]`; `data-i18n` mapeia para o `textContent` do elemento e `data-i18n-<attr>` mapeia para o valor do atributo (por exemplo, `data-i18n-aria-label`).

<a id="custom-extractors"></a>
### Extratores personalizados

Implemente `ContentExtractor` a partir do pacote:

```ts
import { BaseExtractor, type Segment } from 'ai-i18n-tools';

class MyExtractor extends BaseExtractor {
  readonly name = 'my-format';
  canHandle(filepath: string) { return filepath.endsWith('.myext'); }
  extract(content: string): Segment[] { /* … */ }
  reassemble(segments: Segment[], translations: Map<string, string>): string { /* … */ }
}
```

Passe-o ao pipeline doc-translate importando utilitários `doc-translate.ts` programaticamente.

<a id="custom-output-paths"></a>
### Caminhos de saída personalizados

Use `docsOutput.pathTemplate` para qualquer estrutura de arquivos:

```json
{
  "docs": [
    {
      "docsOutput": {
        "pathTemplate": "{outputDir}/{locale}/{relativeToDocsRoot}"
      }
    }
  ]
}
```
