---
translation_last_updated: '2026-04-11T01:50:10.657Z'
source_file_mtime: '2026-04-11T01:49:54.976Z'
source_file_hash: 2da126d2fe624a4d86e9a84e69d5128bea51a57be4b185213215d6b17c3fd83e
translation_language: pt-BR
source_file_path: docs-site/docs/package-overview.md
---
# ai-i18n-tools: Visão Geral do Pacote

Este documento descreve a arquitetura interna do `ai-i18n-tools`, como cada componente se integra e como os dois fluxos de trabalho principais são implementados.

Para instruções práticas de uso, consulte [Introdução](./getting-started.md).

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Sumário

- [Visão geral da arquitetura](#architecture-overview)
- [Árvore de origem](#source-tree)
- [Fluxo de trabalho 1 - Internals da Tradução de UI](#workflow-1---ui-translation-internals)
  - [`UIStringExtractor`](#uistringextractor)
  - [`strings.json`](#stringsjson)
  - [Arquivos de localidade planos](#flat-locale-files)
  - [Instruções de tradução de UI](#ui-translation-prompts)
- [Fluxo de trabalho 2 - Internals da Tradução de Documentos](#workflow-2---document-translation-internals)
  - [Extratores](#extractors)
  - [Proteção de espaços reservados](#placeholder-protection)
  - [Cache (`TranslationCache`)](#cache-translationcache)
  - [Resolução de caminho de saída](#output-path-resolution)
  - [Reescrita plana de links](#flat-link-rewriting)
- [Infraestrutura compartilhada](#shared-infrastructure)
  - [`OpenRouterClient`](#openrouterclient)
  - [Carregamento de configuração](#config-loading)
  - [Logger](#logger)
- [API de auxiliares de tempo de execução](#runtime-helpers-api)
  - [Auxiliares RTL](#rtl-helpers)
  - [Fábricas de configuração do i18next](#i18next-setup-factories)
  - [Auxiliares de exibição](#display-helpers)
  - [Auxiliares de string](#string-helpers)
- [API programática](#programmatic-api)
- [Pontos de extensão](#extension-points)
  - [Nomes personalizados de funções (extração de UI)](#custom-function-names-ui-extraction)
  - [Extratores personalizados](#custom-extractors)
  - [Caminhos de saída personalizados](#custom-output-paths)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

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

Tudo o que os consumidores podem precisar programaticamente é reexportado a partir de `src/index.ts`.

---

## Árvore de origem {#source-tree}

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

## Fluxo de trabalho 1 - Internals da Tradução de UI {#workflow-1---ui-translation-internals}

```
source files (JS/TS)
      │
      ▼  UIStringExtractor (i18next-scanner Parser)
strings.json  ─────────────────── master catalog
      │             { hash: { source, translated: { de: "…" } } }
      ▼
OpenRouterClient.translateUIBatch()
      │  sends JSON array of source strings, receives JSON array of translations
      ▼
de.json, pt-BR.json …  ─────────── per-locale flat maps: source → translation
```

### `UIStringExtractor` {#uistringextractor}

Utiliza o `Parser.parseFuncFromString` do `i18next-scanner` para localizar chamadas `t("literal")` e `i18n.t("literal")` em qualquer arquivo JS/TS. Nomes de funções e extensões de arquivos configuráveis. Os hashes dos segmentos são os **primeiros 8 caracteres hexadecimais do MD5** da string de origem recortada — esses se tornam as chaves em `strings.json`.

### `strings.json` {#stringsjson}

O catálogo mestre tem a seguinte estrutura:

```json
{
  "<md5-8>": {
    "source": "The English string",
    "translated": {
      "de": "Der deutsche Text",
      "pt-BR": "O texto em português"
    }
  }
}
```

O `extract` adiciona novas chaves e preserva traduções existentes. O `translate-ui` preenche entradas `translated` ausentes e gera arquivos de localidade planos.

### Arquivos de localidade planos {#flat-locale-files}

Cada localidade de destino recebe um arquivo JSON plano (`de.json`) mapeando string de origem → tradução:

```json
{
  "The English string": "Der deutsche Text",
  "Save": "Speichern"
}
```

O i18next carrega esses arquivos como pacotes de recursos e procura traduções pela string de origem (modelo de chave como padrão).

### Instruções de tradução de UI {#ui-translation-prompts}

`buildUIPromptMessages` constrói mensagens do sistema e do usuário que:
- Identificam os idiomas de origem e destino (pelo nome de exibição de `localeDisplayNames` ou `ui-languages.json`).
- Envia um array JSON de strings e solicita um array JSON de traduções em retorno.
- Inclui dicas de glossário quando disponíveis.

`OpenRouterClient.translateUIBatch` tenta cada modelo em `translationModels` em ordem, recorrendo em caso de erro de análise ou de rede.

---

## Fluxo de trabalho 2 - Internals da Tradução de Documentos {#workflow-2---document-translation-internals}

```
markdown/MDX/JSON/SVG files
      │
      ▼  MarkdownExtractor / JsonExtractor / SvgExtractor
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

- **`MarkdownExtractor`** - divide o markdown em segmentos tipados: `frontmatter`, `heading`, `paragraph`, `code`, `admonition`. Segmentos não traduzíveis (blocos de código, HTML bruto) são preservados textualmente.
- **`JsonExtractor`** - extrai valores de string de arquivos JSON de rótulos do Docusaurus.
- **`SvgExtractor`** - extrai o conteúdo dos elementos `<text>` e `<title>` do SVG.

### Proteção de marcadores {#placeholder-protection}

Antes da tradução, sintaxes sensíveis são substituídas por tokens opacos para evitar corrupção pelo LLM:

1. **Marcadores de admonição** (`:::note`, `:::`) - restaurados com o texto original exato.
2. **Âncoras de documento** (HTML `<a id="…">`, cabeçalho Docusaurus `{#…}`) - preservados textualmente.
3. **URLs em Markdown** (`](url)`, `src="…"`) - restauradas a partir de um mapa após a tradução.

### Cache (`TranslationCache`) {#cache-translationcache}

Banco de dados SQLite (via `node:sqlite`) armazena `(source_hash, locale, translated_content, model, cost, last_hit_at)`. O hash é os primeiros 16 caracteres hexadecimais do SHA-256 do conteúdo normalizado (espaços em branco colapsados).

Em cada execução, os segmentos são pesquisados por hash × locale. Apenas segmentos ausentes no cache são enviados ao LLM. Após a tradução, `last_hit_at` é redefinido para segmentos não utilizados — o `cleanup` remove linhas obsoletas (com `last_hit_at` nulo / filepath vazio) e linhas órfãs cujo arquivo de origem não existe mais; ele faz backup de `cache.db` primeiro, a menos que `--no-backup` seja informado.

O comando `translate-docs` também usa **rastreamento de arquivos**, de modo que fontes inalteradas com saídas existentes podem pular o processamento completamente. `--force-update` reexecuta o processamento de arquivos, mas ainda usa o cache de segmentos; `--force` limpa o rastreamento de arquivos e ignora leituras do cache de segmentos para tradução via API. Veja [Introdução](./getting-started.md#cache-behavior-and-translate-docs-flags) para a tabela completa de flags.

### Resolução de caminho de saída {#output-path-resolution}

`resolveDocumentationOutputPath(config, cwd, locale, relPath, kind)` mapeia um caminho relativo à fonte para o caminho de saída:

- Estilo **`docusaurus`**: `{outputDir}/{locale}/docusaurus-plugin-content-docs/current/{relativeToDocsRoot}`.
- Estilo **`flat`**: `{outputDir}/{stem}.{locale}{extension}` (com `flatPreserveRelativeDir` opcional).
- Modelo personalizado `pathTemplate`: qualquer estrutura usando `{outputDir}`, `{locale}`, `{relPath}`, `{stem}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}`.

### Reescrita de links planos {#flat-link-rewriting}

Quando `markdownOutput.style === "flat"`, os arquivos markdown traduzidos são colocados ao lado do original com sufixos de idioma. Links relativos entre páginas são reescritos para que `[Guide](./guide.md)` em `readme.de.md` aponte para `guide.de.md`. Controlado por `rewriteRelativeLinks` (ativado automaticamente para estilo plano sem um `pathTemplate` personalizado).

---

## Infraestrutura compartilhada {#shared-infrastructure}

### `OpenRouterClient` {#openrouterclient}

Envolve a API de conclusão de chat do OpenRouter. Comportamentos principais:

- **Alternância de modelo**: tenta cada modelo em `translationModels` em ordem; recorre em caso de erro HTTP ou falha de análise.
- **Limitação de taxa**: detecta respostas 429, aguarda `retry-after` (ou 2s), tenta novamente uma vez.
- **Cache de prompt**: a mensagem do sistema é enviada com `cache_control: { type: "ephemeral" }` para habilitar o cache de prompt em modelos compatíveis.
- **Log de tráfego de depuração**: se `debugTrafficFilePath` for definido, anexa as requisições e respostas JSON a um arquivo.

### Carregamento de configuração {#config-loading}

Pipeline `loadI18nConfigFromFile(configPath, cwd)`:

1. Ler e analisar `ai-i18n-tools.config.json` (JSON).  
2. `mergeWithDefaults` - mesclar profundamente com `defaultI18nConfigPartial`.  
3. `expandTargetLocalesFileReferenceInRawInput` - se `targetLocales` for um caminho de arquivo, carregar o manifesto e expandir para códigos de localidade; definir `uiLanguagesPath`.  
4. `expandDocumentationTargetLocalesInRawInput` - mesmo comportamento para `documentation.targetLocales`.  
5. `parseI18nConfig` - validação com Zod + `validateI18nBusinessRules`.  
6. `applyEnvOverrides` - aplicar `OPENROUTER_API_KEY`, `I18N_SOURCE_LOCALE`, etc.  
7. `augmentConfigWithUiLanguagesFile` - anexar nomes de exibição do manifesto.

### Logger {#logger}

`Logger` suporta níveis `debug`, `info`, `warn`, `error` com saída colorida ANSI. O modo detalhado (`-v`) habilita `debug`. A saída de log pode ser duplicada em um arquivo passando `logFilePath`.

---

## API de auxiliares de tempo de execução {#runtime-helpers-api}

Estes são exportados de `'ai-i18n-tools/runtime'` e funcionam em qualquer ambiente JavaScript (navegador, Node.js, Deno, Edge). Eles **não** importam de `i18next` ou `react-i18next`.

### Auxiliares de RTL {#rtl-helpers}

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

## API programática {#programmatic-api}

Todos os tipos e classes públicos são exportados da raiz do pacote. Exemplo: executar a etapa de tradução da interface do usuário no Node.js sem a CLI:

```ts
import {
  loadI18nConfigFromFile,
  runTranslateUI,
  Logger,
} from 'ai-i18n-tools';

const config = loadI18nConfigFromFile('ai-i18n-tools.config.json');
const logger = new Logger({ level: 'info' });

const summary = await runTranslateUI({
  config,
  cwd: process.cwd(),
  logger,
  apiKey: process.env.OPENROUTER_API_KEY,
});
console.log(`Translated ${summary.translated} strings across ${summary.locales} locales`);
```

Principais exportações:

| Exportação | Descrição |
|---|---|
| `loadI18nConfigFromFile` | Carrega, mescla e valida a configuração a partir de um arquivo JSON. |
| `parseI18nConfig` | Valida um objeto de configuração bruto. |
| `TranslationCache` | Cache SQLite - instanciar com um caminho `cacheDir`. |
| `UIStringExtractor` | Extrai strings `t("…")` do código-fonte JS/TS. |
| `MarkdownExtractor` | Extrai segmentos traduzíveis do markdown. |
| `JsonExtractor` | Extrai dos arquivos de rótulos JSON do Docusaurus. |
| `SvgExtractor` | Extrai de arquivos SVG. |
| `OpenRouterClient` | Faz requisições de tradução ao OpenRouter. |
| `PlaceholderHandler` | Protege/restaura a sintaxe do markdown durante a tradução. |
| `splitTranslatableIntoBatches` | Agrupa segmentos em lotes compatíveis com LLMs. |
| `validateTranslation` | Verificações estruturais após a tradução. |
| `resolveDocumentationOutputPath` | Resolve o caminho do arquivo de saída para um documento traduzido. |
| `Glossary` / `GlossaryMatcher` | Carrega e aplica glossários de tradução. |
| `runTranslateUI` | Ponto de entrada programático para traduzir a interface do usuário. |

---

## Pontos de extensão {#extension-points}

### Nomes de funções personalizadas (extração da interface) {#custom-function-names-ui-extraction}

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

### Extratores personalizados {#custom-extractors}

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

Passe-o ao pipeline doc-translate importando programaticamente os utilitários de `doc-translate.ts`.

### Caminhos de saída personalizados {#custom-output-paths}

Use `markdownOutput.pathTemplate` para qualquer estrutura de arquivos:

```json
{
  "documentation": {
    "markdownOutput": {
      "pathTemplate": "{outputDir}/{locale}/{relativeToDocsRoot}"
    }
  }
}
```
