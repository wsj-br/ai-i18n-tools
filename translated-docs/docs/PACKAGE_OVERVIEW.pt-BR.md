<a id="ai-i18n-tools-package-overview"></a>
# ai-i18n-tools: Visão Geral do Pacote

Este documento descreve a arquitetura interna do `ai-i18n-tools`, como cada componente se integra e como os dois fluxos de trabalho principais são implementados.

Para instruções práticas de uso, consulte [GETTING_STARTED.md](GETTING_STARTED.pt-BR.md).

<small>**Leia em outros idiomas:** </small>
<small id="lang-list">[English (GB)](../../docs/PACKAGE_OVERVIEW.md) · [Deutsch](./PACKAGE_OVERVIEW.de.md) · [Español](./PACKAGE_OVERVIEW.es.md) · [Français](./PACKAGE_OVERVIEW.fr.md) · [हिन्दी](./PACKAGE_OVERVIEW.hi.md) · [日本語](./PACKAGE_OVERVIEW.ja.md) · [한국어](./PACKAGE_OVERVIEW.ko.md) · [Português (Brasil)](./PACKAGE_OVERVIEW.pt-BR.md) · [中文 (中国大陆)](./PACKAGE_OVERVIEW.zh-CN.md) · [中文 (台灣)](./PACKAGE_OVERVIEW.zh-TW.md)</small>

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
  - [Extratores](#extractors)
  - [Inserção de âncoras de títulos (`write-heading-ids` CLI)](#heading-anchor-insertion-write-heading-ids-cli)
  - [Proteção de espaços reservados](#placeholder-protection)
  - [Cache (`TranslationCache`)](#cache-translationcache)
  - [Resolução de caminho de saída](#output-path-resolution)
  - [Reescrita de links planos](#flat-link-rewriting)
- [Infraestrutura compartilhada](#shared-infrastructure)
  - [`OpenRouterClient`](#openrouterclient)
  - [Carregamento de configuração](#config-loading)
  - [Registrador (Logger)](#logger)
- [API de auxiliares de tempo de execução](#runtime-helpers-api)
  - [Auxiliares RTL](#rtl-helpers)
  - [Fábricas de configuração do i18next](#i18next-setup-factories)
  - [Auxiliares de exibição](#display-helpers)
  - [Auxiliares de string](#string-helpers)
- [API programática](#programmatic-api)
- [Pontos de extensão](#extension-points)
  - [Nomes personalizados de funções (extração de interface)](#custom-function-names-ui-extraction)
  - [Extratores personalizados](#custom-extractors)
  - [Caminhos de saída personalizados](#custom-output-paths)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

---

<a id="architecture-overview"></a>
## Visão geral da arquitetura

```text
ai-i18n-tools
├── CLI (src/cli/)             - commands: init, extract, translate-docs, write-heading-ids, translate-svg, translate-ui, sync, status, …
├── Core (src/core/)           - config, types, cache, prompts, output paths, UI languages
├── Extractors (src/extractors/)  - segment extraction from JS/TS, markdown, JSON, SVG
├── Processors (src/processors/)  - placeholders, batching, validation, link rewriting
├── API (src/api/)             - OpenRouter HTTP client
├── Glossary (src/glossary/)   - glossary loading and term matching
├── Runtime (src/runtime/)     - i18next helpers, display helpers (no i18next import)
├── Server (src/server/)       - local Express web editor for cache / glossary
└── Utils (src/utils/)         - logger, hash, ignore parser
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
│   ├── translate-ui-strings.ts     `translate-ui` command implementation
│   ├── doc-translate.ts            `translate-docs` command (documentation files only)
│   ├── translate-svg.ts            `translate-svg` command (standalone assets from `config.svg`)
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
│   ├── locale-utils.ts             BCP-47 normalization and locale list parsing
│   └── errors.ts                   Typed error classes
│
├── extractors/
│   ├── base-extractor.ts           Abstract base class for all extractors
│   ├── ui-string-extractor.ts      JS/TS source scanner (i18next-scanner)
│   ├── classify-segment.ts         Heuristic segment type classification
│   ├── markdown-extractor.ts       Markdown / MDX segment extraction
│   ├── json-extractor.ts           JSON label file extraction
│   └── svg-extractor.ts            SVG text extraction
│
├── processors/
│   ├── placeholder-handler.ts      Chain: admonitions → anchors → URLs
│   ├── url-placeholders.ts         Markdown URL protection/restore
│   ├── admonition-placeholders.ts  Docusaurus admonition protection/restore
│   ├── anchor-placeholders.ts      HTML anchor / heading ID protection/restore
│   ├── batch-processor.ts          Segment → batch grouping (count + char limits)
│   ├── validator.ts                Post-translation structural checks
│   └── flat-link-rewrite.ts        Relative link rewriting for flat output
│
├── api/
│   └── openrouter.ts               OpenRouter HTTP client with model fallback chain
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
├── server/
│   └── translation-editor.ts       Express app for cache / strings.json / glossary editor
│
└── utils/
    ├── logger.ts                   Leveled logger with ANSI support
    ├── hash.ts                     Segment hash (SHA-256 first 16 hex)
    └── ignore-parser.ts            .translate-ignore file parser
```

---

<a id="workflow-1---ui-translation-internals"></a>
## Fluxo de trabalho 1 - Internals da tradução de interface

```text
source files (JS/TS)
      │
      ▼  UIStringExtractor (i18next-scanner Parser)
strings.json  ─────────────────── master catalog
      │             { hash: { source, translated, models?, locations? } }
      ▼
OpenRouterClient.translateUIBatch()
      │  sends JSON array of source strings, receives JSON array of translations (+ model id per batch)
      ▼
de.json, pt-BR.json …  ─────────── per-locale flat maps: source → translation (no model metadata)
```

<a id="uistringextractor"></a>
### `UIStringExtractor`

Utiliza o `i18next-scanner` do `Parser.parseFuncFromString` para localizar chamadas `t("literal")` e `i18n.t("literal")` em qualquer arquivo JS/TS. Os nomes das funções e as extensões dos arquivos são configuráveis. O `extract` **também mescla entradas não provenientes do scanner no mesmo catálogo:** o `package.json` `description` do projeto quando `reactExtractor.includePackageDescription` está habilitado (padrão), e cada `englishName` do `ui-languages.json` quando `reactExtractor.includeUiLanguageEnglishNames` é `true` e `uiLanguagesPath` está definido (as strings já encontradas no código-fonte têm precedência). Os hashes dos segmentos são os **primeiros 8 caracteres hexadecimais do MD5** da string de origem recortada — esses tornam-se as chaves no `strings.json`.

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

`models` (opcional) — por localidade, qual modelo produziu aquela tradução após a última execução bem-sucedida do `translate-ui` para aquela localidade (ou `user-edited` se o texto foi salvo a partir da interface web do `editor`). `locations` (opcional) — onde o `extract` encontrou a string (scanner + linha de descrição do pacote; strings somente de manifesto `englishName` podem omitir o `locations`).

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

`OpenRouterClient.translateUIBatch` tenta cada modelo em ordem, recorrendo em caso de erros de análise ou de rede. A CLI constrói essa lista a partir de `openrouter.translationModels` (ou padrão/hierarquia legado); para `translate-ui`, `ui.preferredModel` opcional é anteposto quando definido (duplicatas são removidas em relação ao restante).

---

<a id="workflow-2---document-translation-internals"></a>
## Fluxo de trabalho 2 - Internals da tradução de documentos

```text
markdown/MDX/JSON files (`translate-docs`)
      │
      ▼  MarkdownExtractor / JsonExtractor
segments[]  ─────────────────── typed segments with hash + content
      │
      ▼  PlaceholderHandler
protected text  ──────────────── URLs, admonitions, anchors replaced with tokens
      │
      ▼  splitTranslatableIntoBatches
batches[]  ───────────────────── grouped by count + char limit
      │
      ▼  TranslationCache lookup
cache hit → skip, miss → OpenRouterClient.translateDocumentBatch
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

- `MarkdownExtractor` - divide markdown em segmentos tipados: `frontmatter`, `heading`, `paragraph`, `code`, `admonition`. Segmentos não traduzíveis (blocos de código, HTML bruto) são preservados textualmente.
- `JsonExtractor` - extrai valores de string de arquivos de rótulos JSON do Docusaurus.
- `SvgExtractor` - extrai conteúdo `<text>`, `<title>` e `<desc>` de SVG (usado por `translate-svg` para ativos em `config.svg`, não por `translate-docs`).

<a id="heading-anchor-insertion-write-heading-ids"></a>
### Inserção de âncoras de títulos (CLI `write-heading-ids`)

O comando `write-heading-ids` é um pré-processador **local, sem uso de LLM**, para arquivos markdown de documentação. Implementação: `src/cli/write-heading-ids.ts` coordena a descoberta de arquivos; `src/markdown/write-heading-ids-core.ts` analisa as linhas e insere âncoras.

Requer uma configuração válida com **pelo menos um bloco `documentations[]`**. Para cada bloco, ele coleta arquivos `.md` / `.mdx` em `contentPaths`, aplica as regras `.translate-ignore` do projeto (mesma ideia da tradução de documentos) e, opcionalmente, restringe a uma subárvore com `--path` / `--file`. Cada arquivo é transformado com `applyHeadingAnchorsToMarkdown`: para cada **título ATX plano** (`# …` até `###### …`) fora de blocos de código com delimitadores, uma linha HTML vazia `<a id="slug"></a>` é inserida na linha acima, quando ausente ou desatualizada. Os algoritmos de slug seguem ecossistemas comuns — `github` (padrão), `bitbucket`, `gitlab`, `pymdown` (sinalizadores opcionais de normalização Unicode / codificação porcentual), `azure-devops` — para que os IDs das âncoras permaneçam consistentes com as ferramentas existentes (doctoc, PyMdown, etc.). `--dry-run` mostra as edições previstas sem gravar.

Este comando **não** é executado dentro do `translate-docs` ou do `sync`; execute-o explicitamente quando desejar IDs de fragmento estáveis nos arquivos de origem antes da tradução ou publicação.

<a id="placeholder-protection"></a>
### Proteção de espaços reservados

Antes da tradução, sintaxes sensíveis são substituídas por tokens opacos para evitar corrupção pelo LLM:

1. **Marcadores de admonição** (`:::note`, `:::`) - restaurados com o texto original exato.
2. **Âncoras de documento** (HTML `<a id="…">`, título do Docusaurus `{#…}`) - preservadas textualmente.
3. **URLs em Markdown** (`](url)`, `src="../…"`) - restauradas a partir de um mapa após a tradução.

<a id="cache-translationcache"></a>
### Cache (`TranslationCache`)

Banco de dados SQLite (via `node:sqlite`) armazena linhas indexadas por `(source_hash, locale)` com `translated_text`, `model`, `filepath`, `last_hit_at` e campos relacionados. O hash é os primeiros 16 caracteres hexadecimais SHA-256 do conteúdo normalizado (espaços em branco reduzidos).

Em cada execução, os segmentos são pesquisados por hash × localidade. Apenas falhas no cache vão para o LLM. Após a tradução, `last_hit_at` é redefinido para linhas de segmento no escopo atual de tradução que não foram atingidas. `cleanup` executa `sync --force-update` primeiro, depois remove linhas de segmento obsoletas (`last_hit_at` nulo / caminho de arquivo vazio), remove chaves `file_tracking` quando o caminho fonte resolvido está ausente no disco (`doc-block:…`, `svg-assets:…`, etc.), e remove linhas de tradução cujo caminho de metadados aponta para um arquivo ausente; faz backup de `cache.db` primeiro, a menos que `--no-backup` seja fornecido.

O comando `translate-docs` também usa **rastreamento de arquivos**, de modo que fontes inalteradas com saídas existentes podem pular trabalho completamente. `--force-update` reexecuta o processamento de arquivos mantendo o cache de segmentos; `--force` limpa o rastreamento de arquivos e ignora leituras do cache de segmentos para tradução de API. Veja [Introdução](GETTING_STARTED.pt-BR.md#cache-behaviour-and-translate-docs-flags) para a tabela completa de flags.

**Formato de prompt em lote:** `translate-docs --prompt-format` seleciona XML (`<seg>` / `<t>`) ou formatos de array/objeto JSON apenas para `OpenRouterClient.translateDocumentBatch`; extração, marcadores e validação permanecem inalteradas. Veja [Formato de prompt em lote](GETTING_STARTED.pt-BR.md#batch-prompt-format).

<a id="output-path-resolution"></a>
### Resolução de caminho de saída

`resolveDocumentationOutputPath(config, cwd, locale, relPath, kind)` mapeia um caminho relativo à fonte para o caminho de saída:

- Estilo `nested` (padrão): `{outputDir}/{locale}/{relPath}` para markdown.
- Estilo `docusaurus`: dentro de `docsRoot`, as saídas usam `{outputDir}/{locale}/docusaurus-plugin-content-docs/current/{relativeToDocsRoot}`; caminhos fora de `docsRoot` retornam ao layout aninhado.
- Estilo `flat`: `{outputDir}/{stem}.{locale}{extension}`. Quando `flatPreserveRelativeDir` é `true`, os subdiretórios de origem são mantidos dentro de `outputDir`.
- **Personalizado** `pathTemplate`: qualquer layout markdown usando `{outputDir}`, `{locale}`, `{LOCALE}`, `{relPath}`, `{stem}`, `{basename}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}`.
- **Personalizado** `jsonPathTemplate`: layout personalizado separado para arquivos de rótulos JSON, usando os mesmos espaços reservados.
- `linkRewriteDocsRoot` ajuda o reescritor de links planos a calcular os prefixos corretos quando a saída traduzida está localizada em outro lugar além da raiz padrão do projeto.

<a id="flat-link-rewriting"></a>
### Reescrita plana de links

Quando `markdownOutput.style === "flat"`, arquivos markdown traduzidos são colocados ao lado da fonte com sufixos de localidade. Links relativos entre páginas são reescritos para que `[Guide](../guide.md)` em `readme.de.md` aponte para `guide.de.md`. Controlado por `rewriteRelativeLinks` (ativado automaticamente para estilo plano sem um `pathTemplate` personalizado).

---

<a id="shared-infrastructure"></a>
## Infraestrutura compartilhada

<a id="openrouterclient"></a>
### `OpenRouterClient`

Envolve a API de conclusão de chat do OpenRouter. Principais comportamentos:

- **Fallback de modelo**: tenta cada modelo na lista resolvida em ordem; recorre a erros HTTP ou falhas de análise. A tradução da interface tenta primeiro `ui.preferredModel`, quando presente, e depois os modelos `openrouter`.
- **Tempo limite da solicitação**: `openrouter.requestTimeoutMs` (padrão de 30 segundos) aborta cada solicitação de conclusão de chat por meio de `AbortSignal.timeout`. O mesmo valor se aplica a `GET /models` quando a CLI carrega o catálogo (por exemplo, `check-models` e o filtro opcional de pré-verificação que descarta IDs de modelos desconhecidos).
- **Limitação de taxa**: detecta respostas 429, aguarda `retry-after` (ou 2s), tenta novamente uma vez.
- **Log de depuração de tráfego**: se `debugTrafficFilePath` estiver definido, acrescenta as solicitações e as respostas JSON a um arquivo.

<a id="config-loading"></a>
### Carregamento de configuração

Pipeline `loadI18nConfigFromFile(configPath, cwd)`:

1. Ler e analisar `ai-i18n-tools.config.json` (JSON).
2. `mergeWithDefaults` - mesclar profundamente com `defaultI18nConfigPartial`, e mesclar quaisquer entradas `documentations[].sourceFiles` em `contentPaths`.
3. `expandTargetLocalesFileReferenceInRawInput` - se `targetLocales` for um caminho de arquivo, carregar o manifesto e expandir para códigos de localidade; definir `uiLanguagesPath`.
4. `expandDocumentationTargetLocalesInRawInput` - o mesmo para cada entrada `documentations[].targetLocales`.
5. `parseI18nConfig` - Validação Zod + `validateI18nBusinessRules`.
6. `applyEnvOverrides` - aplicar `OPENROUTER_API_KEY`, `I18N_SOURCE_LOCALE`, etc.
7. `augmentConfigWithUiLanguagesFile` - anexar nomes de exibição do manifesto.

<a id="logger"></a>
### Registrador de eventos (Logger)

`Logger` suporta níveis `debug`, `info`, `warn`, `error` com saída de cores ANSI. O modo detalhado (`-v`) habilita `debug`. Quando `logFilePath` está definido, as linhas de log também são gravadas nesse arquivo.

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

Construa o `localeLoaders` com `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, …)` para manter as chaves alinhadas com o `targetLocales` após o `generate-ui-languages`. Consulte `docs/GETTING_STARTED.md` (configuração em tempo de execução) e `examples/nextjs-app/` / `examples/console-app/`.

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
| `MarkdownExtractor` | Extrair segmentos traduzíveis do markdown. |
| `JsonExtractor` | Extrair de arquivos JSON de rótulos do Docusaurus. |
| `SvgExtractor` | Extrair de arquivos SVG. |
| `OpenRouterClient` | Fazer solicitações de tradução para o OpenRouter. |
| `PlaceholderHandler` | Proteger/restaurar a sintaxe do markdown ao redor da tradução. |
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
    "reactExtractor": {
      "funcNames": ["t", "i18n.t", "translate", "i18n.translate"]
    }
  }
}
```

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

Use `markdownOutput.pathTemplate` para qualquer estrutura de arquivos:

```json
{
  "documentations": [
    {
      "markdownOutput": {
        "pathTemplate": "{outputDir}/{locale}/{relativeToDocsRoot}"
      }
    }
  ]
}
```
