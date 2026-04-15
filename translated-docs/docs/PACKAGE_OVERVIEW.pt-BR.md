# ai-i18n-tools: Visão Geral do Pacote

Este documento descreve a arquitetura interna do `ai-i18n-tools`, como cada componente se encaixa e como os dois fluxos de trabalho principais são implementados.

Para instruções de uso prático, consulte [GETTING_STARTED.md](GETTING_STARTED.pt-BR.md).

<small>**Leia em outros idiomas:** </small>

<small id="lang-list">[English (GB)](../../docs/PACKAGE_OVERVIEW.md) · [German](./PACKAGE_OVERVIEW.de.md) · [Spanish](./PACKAGE_OVERVIEW.es.md) · [French](./PACKAGE_OVERVIEW.fr.md) · [Hindi](./PACKAGE_OVERVIEW.hi.md) · [Japanese](./PACKAGE_OVERVIEW.ja.md) · [Korean](./PACKAGE_OVERVIEW.ko.md) · [Portuguese (BR)](./PACKAGE_OVERVIEW.pt-BR.md) · [Chinese (CN)](./PACKAGE_OVERVIEW.zh-CN.md) · [Chinese (TW)](./PACKAGE_OVERVIEW.zh-TW.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- NÃO EDITE ESTA SEÇÃO, EM VEZ DISSO, REEXECUTE doctoc PARA ATUALIZAR -->
**Tabela de Conteúdos**

- [Visão geral da arquitetura](#architecture-overview)
- [Árvore de código-fonte](#source-tree)
- [Fluxo de Trabalho 1 - Internos de Tradução de UI](#workflow-1---ui-translation-internals)
  - [`UIStringExtractor`](#uistringextractor)
  - [`strings.json`](#stringsjson)
  - [Arquivos de localidade plana](#flat-locale-files)
  - [Prompts de Tradução de UI](#ui-translation-prompts)
- [Fluxo de Trabalho 2 - Internos de Tradução de Documentos](#workflow-2---document-translation-internals)
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
  - [Helpers RTL](#rtl-helpers)
  - [Fábricas de configuração do i18next](#i18next-setup-factories)
  - [Helpers de exibição](#display-helpers)
  - [Helpers de string](#string-helpers)
- [API programática](#programmatic-api)
- [Pontos de extensão](#extension-points)
  - [Nomes de funções personalizadas (extração de UI)](#custom-function-names-ui-extraction)
  - [Extratores personalizados](#custom-extractors)
  - [Caminhos de saída personalizados](#custom-output-paths)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

---

## Visão geral da arquitetura

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

## Árvore de código-fonte

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

## Fluxo de Trabalho 1 - Internos de Tradução de UI

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

### `UIStringExtractor`

Utiliza o `i18next-scanner` do `Parser.parseFuncFromString` para localizar chamadas `t("literal")` e `i18n.t("literal")` em qualquer arquivo JS/TS. Os nomes das funções e as extensões dos arquivos são configuráveis. **`extract` também mescla entradas não provenientes do scanner no mesmo catálogo:** o `package.json` `description` do projeto quando `reactExtractor.includePackageDescription` está habilitado (padrão), e cada **`englishName`** do `ui-languages.json` quando `reactExtractor.includeUiLanguageEnglishNames` é `true` e `uiLanguagesPath` está definido (as strings já encontradas no código-fonte têm precedência). Os hashes dos segmentos são os **primeiros 8 caracteres hexadecimais do MD5** da string-fonte recortada — esses se tornam as chaves no `strings.json`.

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

`models` (opcional) — por localidade, qual modelo produziu essa tradução após a última execução bem-sucedida do `translate-ui` para essa localidade (ou `user-edited` se o texto foi salvo a partir da interface web `editor`). `locations` (opcional) — onde `extract` encontrou a string (scanner + linha de descrição do pacote; strings apenas de manifesto `englishName` podem omitir `locations`).

`extract` adiciona novas chaves e preserva os dados existentes de `translated` / `models` para chaves ainda presentes na varredura (literais do scanner, descrição opcional, `englishName` opcional do manifesto). `translate-ui` preenche entradas `translated` ausentes, atualiza `models` para as localidades que traduz e gera arquivos de localidade planos.

**manifesto `ui-languages.json`** — array JSON de `{ code, label, englishName, direction }` (BCP-47 `code`, interface do usuário `label`, referência `englishName`, `"ltr"` ou `"rtl"`). Use `generate-ui-languages` para criar um arquivo de projeto a partir do `sourceLocale` + `targetLocales` e do `data/ui-languages-complete.json` mestre incluído.

### Arquivos de localidade plana

Cada localidade de destino recebe um arquivo JSON plano (`de.json`) mapeando string de origem → tradução (sem o campo `models`):

```json
{
  "The English string": "Der deutsche Text",
  "Save": "Speichern"
}
```

i18next carrega esses como pacotes de recursos e procura traduções pela string de origem (modelo chave-como-padrão).

### Prompts de Tradução de UI

`buildUIPromptMessages` constrói mensagens do sistema + do usuário que:
- Identificam os idiomas de origem e destino (pelo nome de exibição de `localeDisplayNames` ou `ui-languages.json`).
- Enviam um array JSON de strings e solicitam um array JSON de traduções em retorno.
- Incluem dicas de glossário quando disponíveis.

`OpenRouterClient.translateUIBatch` tenta cada modelo em ordem, recorrendo a análise ou erros de rede. A CLI constrói essa lista a partir de `openrouter.translationModels` (ou padrão/hierarquia legado); para `translate-ui`, o opcional `ui.preferredModel` é adicionado no início quando definido (removendo duplicatas em relação ao restante).

---

## Fluxo de Trabalho 2 - Internos de Tradução de Documentos

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

### Extratores

Todos os extratores estendem `BaseExtractor` e implementam `extract(content, filepath): Segment[]`.

- `MarkdownExtractor` - divide o markdown em segmentos tipados: `frontmatter`, `heading`, `paragraph`, `code`, `admonition`. Segmentos não traduzíveis (blocos de código, HTML bruto) são preservados textualmente.
- `JsonExtractor` - extrai valores de string dos arquivos de rótulos JSON do Docusaurus.
- `SvgExtractor` - extrai conteúdo de `<text>`, `<title>` e `<desc>` do SVG (usado pelo `translate-svg` para ativos em `config.svg`, não pelo `translate-docs`).

### Proteção de placeholders

Antes da tradução, a sintaxe sensível é substituída por tokens opacos para evitar a corrupção do LLM:

1. **Marcadores de admonição** (`:::note`, `:::`) - restaurados com o texto original exato.
2. **Âncoras de documento** (HTML `<a id="…">`, cabeçalho do Docusaurus `{#…}`) - preservados literalmente.
3. **URLs Markdown** (`](url)`, `src="../…"`) - restaurados de um mapa após a tradução.

### Cache (`TranslationCache`)

O banco de dados SQLite (via `node:sqlite`) armazena linhas indexadas por `(source_hash, locale)` com `translated_text`, `model`, `filepath`, `last_hit_at` e campos relacionados. O hash é SHA-256 dos primeiros 16 caracteres hexadecimais do conteúdo normalizado (espaços em branco colapsados).

Em cada execução, os segmentos são procurados por hash × locale. Apenas os erros de cache vão para o LLM. Após a tradução, `last_hit_at` é redefinido para as linhas de segmento no escopo de tradução atual que não foram acessadas. `cleanup` executa `sync --force-update` primeiro, depois remove linhas de segmento obsoletas (null `last_hit_at` / filepath vazio), poda chaves de `file_tracking` quando o caminho de origem resolvido está ausente no disco (`doc-block:…`, `svg-assets:…`, etc.), e remove linhas de tradução cuja metadata filepath aponta para um arquivo ausente; faz um backup de `cache.db` primeiro, a menos que `--no-backup` seja passado.

O comando `translate-docs` também usa **rastreamento de arquivos** para que fontes inalteradas com saídas existentes possam pular o trabalho completamente. `--force-update` reexecuta o processamento de arquivos enquanto ainda usa o cache de segmentos; `--force` limpa o rastreamento de arquivos e ignora as leituras do cache de segmentos para tradução de API. Veja [Getting Started](GETTING_STARTED.pt-BR.md#cache-behaviour-and-translate-docs-flags) para a tabela completa de flags.

**Formato do prompt em lote:** `translate-docs --prompt-format` seleciona o formato XML (`<seg>` / `<t>`) ou formato de array/objeto JSON apenas para `OpenRouterClient.translateDocumentBatch`; extração, marcadores de posição e validação permanecem inalterados. Veja [Formato do prompt em lote](GETTING_STARTED.pt-BR.md#batch-prompt-format).

### Resolução do caminho de saída

`resolveDocumentationOutputPath(config, cwd, locale, relPath, kind)` mapeia um caminho relativo à fonte para o caminho de saída:

- Estilo `nested` (padrão): `{outputDir}/{locale}/{relPath}` para markdown.
- Estilo `docusaurus`: dentro de `docsRoot`, as saídas usam `{outputDir}/{locale}/docusaurus-plugin-content-docs/current/{relativeToDocsRoot}`; caminhos fora de `docsRoot` retornam ao layout aninhado.
- Estilo `flat`: `{outputDir}/{stem}.{locale}{extension}`. Quando `flatPreserveRelativeDir` é `true`, os subdiretórios de origem são mantidos sob `outputDir`.
- **Personalizado** `pathTemplate`: qualquer layout markdown usando `{outputDir}`, `{locale}`, `{LOCALE}`, `{relPath}`, `{stem}`, `{basename}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}`.
- **Personalizado** `jsonPathTemplate`: layout personalizado separado para arquivos de rótulos JSON, usando os mesmos marcadores de posição.
- `linkRewriteDocsRoot` ajuda o reescritor de links planos a calcular os prefixos corretos quando a saída traduzida está enraizada em outro local além da raiz padrão do projeto.

### Reescrita de links planos

Quando `markdownOutput.style === "flat"`, arquivos markdown traduzidos são colocados ao lado da fonte com sufixos de localidade. Links relativos entre páginas são reescritos para que `[Guide](../guide.md)` em `readme.de.md` aponte para `guide.de.md`. Controlado por `rewriteRelativeLinks` (habilitado automaticamente para estilo plano sem um `pathTemplate` personalizado).

---

## Infraestrutura compartilhada

### `OpenRouterClient`

Envolve a API de conclusões de chat do OpenRouter. Comportamentos principais:

- **Fallback de modelo**: tenta cada modelo na lista resolvida em ordem; recorre a erros HTTP ou falhas de análise. A tradução da interface do usuário resolve `ui.preferredModel` primeiro quando presente, depois os modelos `openrouter`.
- **Limitação de taxa**: detecta respostas 429, aguarda `retry-after` (ou 2s), tenta novamente uma vez.
- **Cache de prompt**: a mensagem do sistema é enviada com `cache_control: { type: "ephemeral" }` para habilitar o cache de prompt em modelos suportados.
- **Registro de tráfego de depuração**: se `debugTrafficFilePath` estiver definido, anexa a solicitação e a resposta JSON a um arquivo.

### Carregamento de configuração

`loadI18nConfigFromFile(configPath, cwd)` pipeline:

1. Ler e analisar `ai-i18n-tools.config.json` (JSON).
2. `mergeWithDefaults` - mesclar profundamente com `defaultI18nConfigPartial` e mesclar quaisquer entradas de `documentations[].sourceFiles` em `contentPaths`.
3. `expandTargetLocalesFileReferenceInRawInput` - se `targetLocales` for um caminho de arquivo, carregar o manifesto e expandir para códigos de localidade; definir `uiLanguagesPath`.
4. `expandDocumentationTargetLocalesInRawInput` - o mesmo para cada entrada de `documentations[].targetLocales`.
5. `parseI18nConfig` - validação Zod + `validateI18nBusinessRules`.
6. `applyEnvOverrides` - aplicar `OPENROUTER_API_KEY`, `I18N_SOURCE_LOCALE`, etc.
7. `augmentConfigWithUiLanguagesFile` - anexar nomes de exibição do manifesto.

### Logger

`Logger` suporta níveis `debug`, `info`, `warn`, `error` com saída de cor ANSI. O modo detalhado (`-v`) ativa `debug`. Quando `logFilePath` está definido, as linhas de log também são escritas naquele arquivo.

---

## API de auxiliares em tempo de execução

Esses são exportados de `'ai-i18n-tools/runtime'` e funcionam em qualquer ambiente JavaScript (navegador, Node.js, Deno, Edge). Eles **não** importam de `i18next` ou `react-i18next`.

### Auxiliares RTL

```ts
RTL_LANGS: ReadonlySet<string>
getTextDirection(lng: string): 'ltr' | 'rtl'
applyDirection(lng: string, element?: Element): void
```

### Fábricas de configuração do i18next

```ts
defaultI18nInitOptions(sourceLocale?: string): i18nextInitOptions
wrapI18nWithKeyTrim(i18n: I18nLike): void
makeLoadLocale(
  i18n: I18nWithResources,
  localeLoaders: Record<string, () => Promise<unknown>>,
  sourceLocale?: string
): (lang: string) => Promise<void>
```

### Auxiliares de exibição

```ts
getUILanguageLabel(lang: UiLanguageEntry, t: TranslateFn): string
getUILanguageLabelNative(lang: UiLanguageEntry): string
```

### Auxiliares de string

```ts
interpolateTemplate(str: string, vars: Record<string, string | number | boolean>): string
flipUiArrowsForRtl(text: string | null | undefined, isRtl: boolean): string | null | undefined
```

---

## API programática

Todos os tipos e classes públicos são exportados da raiz do pacote. Exemplo: executando a etapa de tradução da interface do usuário a partir do Node.js sem a CLI:

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
| `splitTranslatableIntoBatches` | Agrupar segmentos em lotes do tamanho LLM. |
| `validateTranslation` | Verificações estruturais após a tradução. |
| `resolveDocumentationOutputPath` | Resolver o caminho do arquivo de saída para um documento traduzido. |
| `Glossary` / `GlossaryMatcher` | Carregar e aplicar glossários de tradução. |
| `runTranslateUI` | Ponto de entrada programático para tradução da interface do usuário. |

---

## Pontos de extensão

### Nomes de funções personalizadas (extração de UI)

Adicionar nomes de funções de tradução não padrão via configuração:

```json
{
  "ui": {
    "reactExtractor": {
      "funcNames": ["t", "i18n.t", "translate", "i18n.translate"]
    }
  }
}
```

### Extratores personalizados

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

Passe-o para o pipeline de tradução de documentos importando as utilidades de `doc-translate.ts` programaticamente.

### Caminhos de saída personalizados

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
