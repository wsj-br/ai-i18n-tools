---
translation_last_updated: '2026-04-13T00:28:35.838Z'
source_file_mtime: '2026-04-13T00:28:15.569Z'
source_file_hash: 8cb494fb19654fd14572478692aec0c22bd75c6a5c37c0ab229cfc0a1145cd16
translation_language: pt-BR
source_file_path: docs-site/docs/package-overview.md
---
# ai-i18n-tools: Visão Geral do Pacote

Este documento descreve a arquitetura interna do `ai-i18n-tools`, como cada componente se encaixa e como os dois fluxos de trabalho principais são implementados.

Para instruções de uso prático, veja [Introdução](./getting-started.md).

<small>**Leia em outros idiomas:** </small>
<small id="lang-list">[en-GB](./PACKAGE_OVERVIEW.md) · [de](../translated-docs/docs/PACKAGE_OVERVIEW.de.md) · [es](../translated-docs/docs/PACKAGE_OVERVIEW.es.md) · [fr](../translated-docs/docs/PACKAGE_OVERVIEW.fr.md) · [hi](../translated-docs/docs/PACKAGE_OVERVIEW.hi.md) · [ja](../translated-docs/docs/PACKAGE_OVERVIEW.ja.md) · [ko](../translated-docs/docs/PACKAGE_OVERVIEW.ko.md) · [pt-BR](../translated-docs/docs/PACKAGE_OVERVIEW.pt-BR.md) · [zh-CN](../translated-docs/docs/PACKAGE_OVERVIEW.zh-CN.md) · [zh-TW](../translated-docs/docs/PACKAGE_OVERVIEW.zh-TW.md)</small>

---

<!-- INÍCIO da TOC gerada pelo doctoc, mantenha o comentário aqui para permitir atualização automática -->
<!-- NÃO EDITE ESTA SEÇÃO, EM VEZ DISSO, REEXECUTE o doctoc PARA ATUALIZAR -->
**Tabela de Conteúdos**

- [Visão geral da arquitetura](#architecture-overview)
- [Árvore de código-fonte](#source-tree)
- [Fluxo de Trabalho 1 - Internos da Tradução de UI](#workflow-1---ui-translation-internals)
  - [`UIStringExtractor`](#uistringextractor)
  - [`strings.json`](#stringsjson)
  - [Arquivos de localidade plana](#flat-locale-files)
  - [Mensagens de prompt de Tradução de UI](#ui-translation-prompts)
- [Fluxo de Trabalho 2 - Internos da Tradução de Documentos](#workflow-2---document-translation-internals)
  - [Extratores](#extractors)
  - [Proteção de placeholders](#placeholder-protection)
  - [Cache (`TranslationCache`)](#cache-translationcache)
  - [Resolução de caminho de saída](#output-path-resolution)
  - [Reescrita de links planos](#flat-link-rewriting)
- [Infraestrutura compartilhada](#shared-infrastructure)
  - [`OpenRouterClient`](#openrouterclient)
  - [Carregamento de configuração](#config-loading)
  - [Logger](#logger)
- [API de helpers em tempo de execução](#runtime-helpers-api)
  - [Helpers para RTL](#rtl-helpers)
  - [Fábricas de configuração do i18next](#i18next-setup-factories)
  - [Helpers de exibição](#display-helpers)
  - [Helpers de string](#string-helpers)
- [API Programática](#programmatic-api)
- [Pontos de extensão](#extension-points)
  - [Nomes de funções personalizadas (extração de UI)](#custom-function-names-ui-extraction)
  - [Extratores personalizados](#custom-extractors)
  - [Caminhos de saída personalizados](#custom-output-paths)

<!-- FIM da TOC gerada pelo doctoc, mantenha o comentário aqui para permitir atualização automática -->

---

## Visão geral da arquitetura {#architecture-overview}

```
ai-i18n-tools
├── CLI (src/cli/)             - commands: init, extract, translate-docs, translate-svg, translate-ui, sync, status, …
├── Core (src/core/)           - config, types, cache, prompts, output paths, UI languages
├── Extractors (src/extractors/)  - segment extraction from JS/TS, markdown, JSON, SVG
├── Processors (src/processors/)  - placeholders, batching, validation, link rewriting
├── API (src/api/)             - OpenRouter HTTP client
├── Glossary (src/glossary/)   - glossary loading and term matching
├── Runtime (src/runtime/)     - i18next helpers, display helpers (no i18next import)
├── Server (src/server/)       - local Express web editor for cache / glossary
└── Utils (src/utils/)         - logger, hash, ignore parser
```

Tudo que os consumidores podem precisar programaticamente é re-exportado de `src/index.ts`.

---

## Árvore de código-fonte {#source-tree}

```
src/
├── index.ts                        Public API re-exports
│
├── cli/
│   ├── index.ts                    CLI entry point (commander)
│   ├── extract-strings.ts          `extract` command implementation
│   ├── translate-ui-strings.ts     `translate-ui` command implementation
│   ├── doc-translate.ts            `translate-docs` command (documentation files only)
│   ├── translate-svg.ts            `translate-svg` command (standalone assets from `config.svg`)
│   ├── helpers.ts                  Shared CLI utilities
│   └── file-utils.ts               File collection helpers
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

## Fluxo de Trabalho 1 - Internos da Tradução de UI {#workflow-1---ui-translation-internals}

```
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

### `UIStringExtractor` {#uistringextractor}

Usa `Parser.parseFuncFromString` do `i18next-scanner` para encontrar chamadas `t("literal")` e `i18n.t("literal")` em qualquer arquivo JS/TS. Nomes de funções e extensões de arquivo são configuráveis, e a extração também pode incluir a `description` do `package.json` do projeto quando `reactExtractor.includePackageDescription` está habilitado. Hashes de segmento são **os primeiros 8 caracteres hexadecimais do MD5** da string de origem aparada - esses se tornam as chaves em `strings.json`.

### `strings.json` {#stringsjson}

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

`models` (opcional) — por localidade, qual modelo produziu essa tradução após a última execução bem-sucedida do `translate-ui` para essa localidade (ou `user-edited` se o texto foi salvo da interface web do `editor`). `locations` (opcional) — onde `extract` encontrou a string.

`extract` adiciona novas chaves e preserva os dados existentes de `translated` / `models` para chaves ainda presentes na varredura. `translate-ui` preenche entradas `translated` ausentes, atualiza `models` para localidades que traduz, e escreve arquivos de localidade em formato plano.

### Arquivos de localidade plana {#flat-locale-files}

Cada localidade alvo recebe um arquivo JSON plano (`de.json`) mapeando string de origem → tradução (sem campo `models`):

```json
{
  "The English string": "Der deutsche Text",
  "Save": "Speichern"
}
```

i18next carrega esses como pacotes de recursos e procura traduções pela string de origem (modelo chave-como-padrão).

### Mensagens de prompt de Tradução de UI {#ui-translation-prompts}

`buildUIPromptMessages` constrói mensagens do sistema + do usuário que:
- Identificam os idiomas de origem e destino (pelo nome de exibição de `localeDisplayNames` ou `ui-languages.json`).
- Enviam um array JSON de strings e solicitam um array JSON de traduções em retorno.
- Incluem dicas de glossário quando disponíveis.

`OpenRouterClient.translateUIBatch` tenta cada modelo na ordem, recorrendo a erros de análise ou de rede. O CLI constrói essa lista a partir de `openrouter.translationModels` (ou padrão/recuperação legado); para `translate-ui`, o `ui.preferredModel` opcional é prependido quando definido (deduplicado em relação ao restante).

---

## Fluxo de Trabalho 2 - Internos de Tradução de Documentos {#workflow-2---document-translation-internals}

```
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

### Extratores {#extractors}

Todos os extratores estendem `BaseExtractor` e implementam `extract(content, filepath): Segment[]`.

- `MarkdownExtractor` - divide markdown em segmentos tipados: `frontmatter`, `heading`, `paragraph`, `code`, `admonition`. Segmentos não traduzíveis (blocos de código, HTML bruto) são preservados literalmente.
- `JsonExtractor` - extrai valores de string dos arquivos de rótulo JSON do Docusaurus.
- `SvgExtractor` - extrai conteúdo de `<text>`, `<title>` e `<desc>` de SVG (usado pelo `translate-svg` para ativos sob `config.svg`, não pelo `translate-docs`).

### Proteção de Placeholders {#placeholder-protection}

Antes da tradução, a sintaxe sensível é substituída por tokens opacos para evitar corrupção do LLM:

1. **Marcadores de Admonição** (`:::note`, `:::`) - restaurados com o texto original exato.
2. **Âncoras de Documento** (HTML `<a id="…">`, cabeçalho do Docusaurus `{#…}`) - preservadas literalmente.
3. **URLs Markdown** (`](url)`, `src="…"`) - restauradas de um mapa após a tradução.

### Cache (`TranslationCache`) {#cache-translationcache}

O banco de dados SQLite (via `node:sqlite`) armazena linhas indexadas por `(source_hash, locale)` com `translated_text`, `model`, `filepath`, `last_hit_at` e campos relacionados. O hash é os primeiros 16 caracteres hexadecimais SHA-256 do conteúdo normalizado (espaços em branco colapsados).

Em cada execução, os segmentos são buscados por hash × locale. Apenas falhas de cache vão para o LLM. Após a tradução, `last_hit_at` é redefinido para linhas de segmento no escopo de tradução atual que não foram acessadas. `cleanup` executa `sync --force-update` primeiro, depois remove linhas de segmento obsoletas (null `last_hit_at` / filepath vazio), poda chaves `file_tracking` quando o caminho de origem resolvido está ausente no disco (`doc-block:…`, `svg-assets:…`, etc.), e remove linhas de tradução cuja metadata filepath aponta para um arquivo ausente; faz um backup de `cache.db` primeiro, a menos que `--no-backup` seja passado.

O comando `translate-docs` também usa **rastreamento de arquivos** para que fontes inalteradas com saídas existentes possam pular todo o trabalho. `--force-update` reexecuta o processamento de arquivos enquanto ainda usa o cache de segmentos; `--force` limpa o rastreamento de arquivos e ignora leituras de cache de segmentos para tradução de API. Veja [Introdução](./getting-started.md#cache-behaviour-and-translate-docs-flags) para a tabela completa de flags.

**Formato de prompt em lote:** `translate-docs --prompt-format` seleciona formas XML (`<seg>` / `<t>`) ou array/objeto JSON apenas para `OpenRouterClient.translateDocumentBatch`; extração, placeholders e validação permanecem inalterados. Veja [Formato de prompt em lote](./getting-started.md#batch-prompt-format).

### Resolução de Caminho de Saída {#output-path-resolution}

`resolveDocumentationOutputPath(config, cwd, locale, relPath, kind)` mapeia um caminho relativo à fonte para o caminho de saída:

- estilo `nested` (padrão): `{outputDir}/{locale}/{relPath}` para markdown.
- estilo `docusaurus`: sob `docsRoot`, as saídas usam `{outputDir}/{locale}/docusaurus-plugin-content-docs/current/{relativeToDocsRoot}`; caminhos fora de `docsRoot` recorrem ao layout aninhado.
- estilo `flat`: `{outputDir}/{stem}.{locale}{extension}`. Quando `flatPreserveRelativeDir` é `true`, subdiretórios de origem são mantidos sob `outputDir`.
- **Personalizado** `pathTemplate`: qualquer layout markdown usando `{outputDir}`, `{locale}`, `{LOCALE}`, `{relPath}`, `{stem}`, `{basename}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}`.
- **Personalizado** `jsonPathTemplate`: layout personalizado separado para arquivos de rótulo JSON, usando os mesmos placeholders.
- `linkRewriteDocsRoot` ajuda o reescritor de links planos a calcular prefixos corretos quando a saída traduzida está enraizada em algum lugar diferente do diretório raiz do projeto padrão.

### Reescrita de Links Planos {#flat-link-rewriting}

Quando `markdownOutput.style === "flat"`, arquivos markdown traduzidos são colocados ao lado da fonte com sufixos de localidade. Links relativos entre páginas são reescritos para que `[Guia](./guide.md)` em `readme.de.md` aponte para `guide.de.md`. Controlado por `rewriteRelativeLinks` (ativado automaticamente para estilo plano sem um `pathTemplate` personalizado).

---

## Infraestrutura Compartilhada {#shared-infrastructure}

### `OpenRouterClient` {#openrouterclient}

Envolve a API de conclusões de chat do OpenRouter. Comportamentos principais:

- **Fallback do modelo**: tenta cada modelo na lista resolvida em ordem; recorre a erros HTTP ou falhas de análise. A tradução da interface do usuário resolve `ui.preferredModel` primeiro quando presente, depois os modelos `openrouter`.
- **Limitação de taxa**: detecta respostas 429, aguarda `retry-after` (ou 2s), tenta novamente uma vez.
- **Cache de prompt**: a mensagem do sistema é enviada com `cache_control: { type: "ephemeral" }` para habilitar o cache de prompt em modelos suportados.
- **Registro de tráfego de depuração**: se `debugTrafficFilePath` estiver definido, anexa JSON de solicitação e resposta a um arquivo.

### Carregamento de configuração {#config-loading}

`loadI18nConfigFromFile(configPath, cwd)` pipeline:

1. Ler e analisar `ai-i18n-tools.config.json` (JSON).
2. `mergeWithDefaults` - mesclar profundamente com `defaultI18nConfigPartial` e mesclar quaisquer entradas de `documentations[].sourceFiles` em `contentPaths`.
3. `expandTargetLocalesFileReferenceInRawInput` - se `targetLocales` for um caminho de arquivo, carregar o manifesto e expandir para códigos de localidade; definir `uiLanguagesPath`.
4. `expandDocumentationTargetLocalesInRawInput` - o mesmo para cada entrada de `documentations[].targetLocales`.
5. `parseI18nConfig` - validação Zod + `validateI18nBusinessRules`.
6. `applyEnvOverrides` - aplicar `OPENROUTER_API_KEY`, `I18N_SOURCE_LOCALE`, etc.
7. `augmentConfigWithUiLanguagesFile` - anexar nomes de exibição do manifesto.

### Logger {#logger}

`Logger` suporta níveis `debug`, `info`, `warn`, `error` com saída de cor ANSI. O modo verboso (`-v`) ativa `debug`. Quando `logFilePath` está definido, as linhas de log também são escritas nesse arquivo.

---

## API de auxiliares em tempo de execução {#runtime-helpers-api}

Esses são exportados de `'ai-i18n-tools/runtime'` e funcionam em qualquer ambiente JavaScript (navegador, Node.js, Deno, Edge). Eles **não** importam de `i18next` ou `react-i18next`.

### Auxiliares RTL {#rtl-helpers}

```ts
RTL_LANGS: ReadonlySet<string>
getTextDirection(lng: string): 'ltr' | 'rtl'
applyDirection(lng: string, element?: Element): void
```

### Fábricas de configuração do i18next {#i18next-setup-factories}

```ts
defaultI18nInitOptions(sourceLocale?: string): i18nextInitOptions
wrapI18nWithKeyTrim(i18n: I18nLike): void
makeLoadLocale(
  i18n: I18nWithResources,
  localeLoaders: Record<string, () => Promise<unknown>>,
  sourceLocale?: string
): (lang: string) => Promise<void>
```

### Auxiliares de exibição {#display-helpers}

```ts
getUILanguageLabel(lang: UiLanguageEntry, t: TranslateFn): string
getUILanguageLabelNative(lang: UiLanguageEntry): string
```

### Auxiliares de string {#string-helpers}

```ts
interpolateTemplate(str: string, vars: Record<string, string | number | boolean>): string
flipUiArrowsForRtl(text: string | null | undefined, isRtl: boolean): string | null | undefined
```

---

## API Programática {#programmatic-api}

Todos os tipos e classes públicos são exportados da raiz do pacote. Exemplo: executando a etapa de traduzir-UI do Node.js sem o CLI:

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
| `loadI18nConfigFromFile` | Carregar, mesclar, validar configuração de um arquivo JSON. |
| `parseI18nConfig` | Validar um objeto de configuração bruto. |
| `TranslationCache` | Cache SQLite - instanciar com um caminho `cacheDir`. |
| `UIStringExtractor` | Extrair strings `t("…")` de código fonte JS/TS. |
| `MarkdownExtractor` | Extrair segmentos traduzíveis de markdown. |
| `JsonExtractor` | Extrair de arquivos de rótulo JSON do Docusaurus. |
| `SvgExtractor` | Extrair de arquivos SVG. |
| `OpenRouterClient` | Fazer solicitações de tradução para OpenRouter. |
| `PlaceholderHandler` | Proteger/restaurar a sintaxe markdown em torno da tradução. |
| `splitTranslatableIntoBatches` | Agrupar segmentos em lotes do tamanho do LLM. |
| `validateTranslation` | Verificações estruturais após a tradução. |
| `resolveDocumentationOutputPath` | Resolver o caminho do arquivo de saída para um documento traduzido. |
| `Glossary` / `GlossaryMatcher` | Carregar e aplicar glossários de tradução. |
| `runTranslateUI` | Ponto de entrada programático para traduzir-UI. |

---

## Pontos de extensão {#extension-points}

### Nomes de funções personalizadas (extração de UI) {#custom-function-names-ui-extraction}

Adicione nomes de funções de tradução não padrão via configuração:

```json
{
  "ui": {
    "reactExtractor": {
      "funcNames": ["t", "i18n.t", "translate", "i18n.translate"]
    }
  }
}
```

### Extratores personalizados {#custom-extractors}

Implemente `ContentExtractor` do pacote:

```ts
import { BaseExtractor, type Segment } from 'ai-i18n-tools';

class MyExtractor extends BaseExtractor {
  readonly name = 'my-format';
  canHandle(filepath: string) { return filepath.endsWith('.myext'); }
  extract(content: string): Segment[] { /* … */ }
  reassemble(segments: Segment[], translations: Map<string, string>): string { /* … */ }
}
```

Passe-o para o pipeline de doc-translate importando utilitários `doc-translate.ts` programaticamente.

### Caminhos de saída personalizados {#custom-output-paths}

Use `markdownOutput.pathTemplate` para qualquer layout de arquivo:

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
