# ai-i18n-tools: Visão Geral do Pacote

Este documento descreve a arquitetura interna do `ai-i18n-tools`, como cada componente se integra e como os dois fluxos de trabalho principais são implementados.

Para instruções práticas de uso, consulte [GETTING_STARTED.md](GETTING_STARTED.pt-BR.md).

<small>**Leia em outros idiomas:** </small>

<small id="lang-list">[English (GB)](../../docs/PACKAGE_OVERVIEW.md) · [German](./PACKAGE_OVERVIEW.de.md) · [Spanish](./PACKAGE_OVERVIEW.es.md) · [French](./PACKAGE_OVERVIEW.fr.md) · [Hindi](./PACKAGE_OVERVIEW.hi.md) · [Japanese](./PACKAGE_OVERVIEW.ja.md) · [Korean](./PACKAGE_OVERVIEW.ko.md) · [Portuguese (BR)](./PACKAGE_OVERVIEW.pt-BR.md) · [Chinese (CN)](./PACKAGE_OVERVIEW.zh-CN.md) · [Chinese (TW)](./PACKAGE_OVERVIEW.zh-TW.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
## Tabela de Conteúdos

- [Visão geral da arquitetura](#architecture-overview)
- [Árvore de origem](#source-tree)
- [Fluxo de trabalho 1 - Internals de tradução de interface](#workflow-1---ui-translation-internals)
  - [`UIStringExtractor`](#uistringextractor)
  - [`strings.json`](#stringsjson)
  - [Arquivos de localidade planos](#flat-locale-files)
  - [Solicitações de tradução de interface](#ui-translation-prompts)
- [Fluxo de trabalho 2 - Internals de tradução de documentos](#workflow-2---document-translation-internals)
  - [Extratores](#extractors)
  - [Proteção de marcadores de posição](#placeholder-protection)
  - [Cache (`TranslationCache`)](#cache-translationcache)
  - [Resolução de caminho de saída](#output-path-resolution)
  - [Reescrita plana de links](#flat-link-rewriting)
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
  - [Nomes personalizados de função (extração de interface)](#custom-function-names-ui-extraction)
  - [Extratores personalizados](#custom-extractors)
  - [Caminhos de saída personalizados](#custom-output-paths)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

---

## Visão geral da arquitetura

```text
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

Tudo que os consumidores podem precisar programaticamente é reexportado a partir do `src/index.ts`.

---

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

## Fluxo de trabalho 1 - Internals de tradução de interface

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

### `UIStringExtractor`

Utiliza o `i18next-scanner` do `Parser.parseFuncFromString` para localizar chamadas `t("literal")` e `i18n.t("literal")` em qualquer arquivo JS/TS. Os nomes das funções e extensões de arquivo são configuráveis. `extract` **também mescla entradas não provenientes do scanner no mesmo catálogo:** o `package.json` do projeto `description` quando `reactExtractor.includePackageDescription` está habilitado (padrão), e cada **`englishName`** de `ui-languages.json` quando `reactExtractor.includeUiLanguageEnglishNames` é `true` e `uiLanguagesPath` está definido (as strings já encontradas no código-fonte têm precedência). Os hashes dos segmentos são os **primeiros 8 caracteres hexadecimais do MD5** da string de origem recortada — esses tornam-se as chaves em `strings.json`.

### `strings.json`

O catálogo principal tem a seguinte estrutura:

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

`models` (opcional) — por localidade, indica qual modelo produziu aquela tradução após a última execução bem-sucedida do `translate-ui` para aquela localidade (ou `user-edited` se o texto foi salvo pela interface web do `editor`). `locations` (opcional) — onde `extract` encontrou a string (scanner + linha de descrição do pacote; strings apenas do manifesto `englishName` podem omitir `locations`).

`extract` adiciona novas chaves e preserva os dados existentes de `translated` / `models` para chaves ainda presentes na varredura (literais do scanner, descrição opcional, `englishName` opcional do manifesto). `translate-ui` preenche entradas `translated` ausentes, atualiza `models` para localidades que traduz e escreve arquivos de localidade planos.

**Manifesto `ui-languages.json`** — Array JSON de `{ code, label, englishName, direction }` (BCP-47 `code`, interface `label`, referência `englishName`, `"ltr"` ou `"rtl"`). Use `generate-ui-languages` para construir um arquivo de projeto a partir de `sourceLocale` + `targetLocales` e o `data/ui-languages-complete.json` mestre embutido.

### Arquivos de localidade planos

Cada localidade de destino recebe um arquivo JSON plano (`de.json`) mapeando string de origem → tradução (sem campo `models`):

```json
{
  "The English string": "Der deutsche Text",
  "Save": "Speichern"
}
```

O i18next carrega esses arquivos como pacotes de recursos e busca traduções pela string de origem (modelo de chave como padrão).

### Solicitações de tradução da interface

`buildUIPromptMessages` constrói mensagens do sistema e do usuário que:

- Identificam os idiomas de origem e destino (pelo nome de exibição de `localeDisplayNames` ou `ui-languages.json`).
- Envia um array JSON de strings e solicita um array JSON de traduções em retorno.
- Inclui dicas de glossário quando disponíveis.

`OpenRouterClient.translateUIBatch` tenta cada modelo em ordem, recorrendo a parse ou erros de rede. A CLI constrói essa lista a partir de `openrouter.translationModels` (ou padrão/hierarquia legado); para `translate-ui`, `ui.preferredModel` opcional é adicionado no início quando definido (duplicatas removidas em relação ao restante).

---

## Fluxo de trabalho 2 - Internals de tradução de documentos

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

### Extratores

Todos os extratores estendem `BaseExtractor` e implementam `extract(content, filepath): Segment[]`.

- `MarkdownExtractor` - divide o markdown em segmentos tipados: `frontmatter`, `heading`, `paragraph`, `code`, `admonition`. Segmentos não traduzíveis (blocos de código, HTML bruto) são preservados textualmente.
- `JsonExtractor` - extrai valores de string de arquivos JSON de rótulos do Docusaurus.
- `SvgExtractor` - extrai conteúdo `<text>`, `<title>` e `<desc>` de SVG (usado por `translate-svg` para ativos em `config.svg`, não por `translate-docs`).

### Proteção de marcadores

Antes da tradução, sintaxes sensíveis são substituídas por tokens opacos para evitar corrupção pelo LLM:

1. **Marcadores de advertência** (`:::note`, `:::`) - restaurados com o texto original exato.
2. **Âncoras de documento** (HTML `<a id="…">`, título do Docusaurus `{#…}`) - preservadas textualmente.
3. **URLs em Markdown** (`](url)`, `src="../…"`) - restauradas a partir de um mapa após a tradução.

### Cache (`TranslationCache`)

Banco de dados SQLite (via `node:sqlite`) armazena linhas indexadas por `(source_hash, locale)` com `translated_text`, `model`, `filepath`, `last_hit_at` e campos relacionados. O hash é os primeiros 16 caracteres hexadecimais SHA-256 do conteúdo normalizado (espaços em branco reduzidos).

Em cada execução, os segmentos são pesquisados por hash × localidade. Apenas falhas no cache vão para o LLM. Após a tradução, `last_hit_at` é redefinido para linhas de segmento no escopo atual de tradução que não foram atingidas. `cleanup` executa `sync --force-update` primeiro, depois remove linhas de segmento obsoletas (`last_hit_at` nulo / caminho de arquivo vazio), remove chaves `file_tracking` quando o caminho de origem resolvido está ausente no disco (`doc-block:…`, `svg-assets:…`, etc.), e remove linhas de tradução cujo caminho de arquivo nos metadados aponta para um arquivo ausente; faz backup de `cache.db` primeiro, a menos que `--no-backup` seja passado.

O comando `translate-docs` também usa **rastreamento de arquivos**, para que fontes inalteradas com saídas existentes possam pular trabalho completamente. `--force-update` reexecuta o processamento de arquivos mantendo o cache de segmentos; `--force` limpa o rastreamento de arquivos e ignora leituras do cache de segmentos para tradução via API. Veja [Introdução](GETTING_STARTED.pt-BR.md#cache-behaviour-and-translate-docs-flags) para a tabela completa de flags.

**Formato de prompt em lote:** `translate-docs --prompt-format` seleciona XML (`<seg>` / `<t>`) ou formatos de array/objeto JSON apenas para `OpenRouterClient.translateDocumentBatch`; extração, marcadores e validação permanecem inalteradas. Veja [Formato de prompt em lote](GETTING_STARTED.pt-BR.md#batch-prompt-format).

### Resolução de caminho de saída

`resolveDocumentationOutputPath(config, cwd, locale, relPath, kind)` mapeia um caminho relativo à fonte para o caminho de saída:

- Estilo `nested` (padrão): `{outputDir}/{locale}/{relPath}` para markdown.
- Estilo `docusaurus`: dentro de `docsRoot`, as saídas usam `{outputDir}/{locale}/docusaurus-plugin-content-docs/current/{relativeToDocsRoot}`; caminhos fora de `docsRoot` retornam ao layout aninhado.
- Estilo `flat`: `{outputDir}/{stem}.{locale}{extension}`. Quando `flatPreserveRelativeDir` é `true`, subdiretórios da fonte são mantidos sob `outputDir`.
- **Personalizado** `pathTemplate`: qualquer layout de markdown usando `{outputDir}`, `{locale}`, `{LOCALE}`, `{relPath}`, `{stem}`, `{basename}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}`.
- **Personalizado** `jsonPathTemplate`: layout personalizado separado para arquivos JSON de rótulos, usando os mesmos marcadores.
- `linkRewriteDocsRoot` ajuda o reescritor de links planos a calcular prefixos corretos quando a saída traduzida está enraizada em outro local além da raiz padrão do projeto.

### Reescrita de links plana

Quando `markdownOutput.style === "flat"`, os arquivos markdown traduzidos são colocados ao lado dos originais com sufixos de localidade. Os links relativos entre páginas são reescritos para que `[Guide](../guide.md)` em `readme.de.md` aponte para `guide.de.md`. Controlado por `rewriteRelativeLinks` (ativado automaticamente para estilo plano sem um `pathTemplate` personalizado).

---

## Infraestrutura compartilhada

### `OpenRouterClient`

Envolve a API de conclusão de chat do OpenRouter. Comportamentos principais:

- **Alternância de modelo**: tenta cada modelo na lista resolvida em ordem; recorre em caso de erros HTTP ou falhas de análise. A tradução da interface tenta primeiro `ui.preferredModel` quando presente, depois modelos `openrouter`.
- **Limitação de taxa**: detecta respostas 429, aguarda `retry-after` (ou 2s), tenta novamente uma vez.
- **Cache de prompt**: a mensagem do sistema é enviada com `cache_control: { type: "ephemeral" }` para habilitar o cache de prompt em modelos compatíveis.
- **Log de depuração de tráfego**: se `debugTrafficFilePath` estiver definido, acrescenta as requisições e respostas JSON a um arquivo.

### Carregamento de configuração

Pipeline `loadI18nConfigFromFile(configPath, cwd)`:

1. Ler e analisar `ai-i18n-tools.config.json` (JSON).
2. `mergeWithDefaults` - mesclar profundamente com `defaultI18nConfigPartial`, e mesclar quaisquer entradas `documentations[].sourceFiles` em `contentPaths`.
3. `expandTargetLocalesFileReferenceInRawInput` - se `targetLocales` for um caminho de arquivo, carregar o manifesto e expandir para códigos de localidade; definir `uiLanguagesPath`.
4. `expandDocumentationTargetLocalesInRawInput` - o mesmo para cada entrada `documentations[].targetLocales`.
5. `parseI18nConfig` - validação Zod + `validateI18nBusinessRules`.
6. `applyEnvOverrides` - aplicar `OPENROUTER_API_KEY`, `I18N_SOURCE_LOCALE`, etc.
7. `augmentConfigWithUiLanguagesFile` - anexar nomes de exibição do manifesto.

### Logger

`Logger` suporta níveis `debug`, `info`, `warn`, `error` com saída de cor ANSI. O modo detalhado (`-v`) habilita `debug`. Quando `logFilePath` é definido, as linhas de log também são gravadas nesse arquivo.

---

## API de auxiliares de tempo de execução

Estes são exportados de `'ai-i18n-tools/runtime'` e funcionam em qualquer ambiente JavaScript (navegador, Node.js, Deno, Edge). Eles **não** importam de `i18next` ou `react-i18next`.

### Auxiliares RTL

```ts
RTL_LANGS: ReadonlySet<string>
getTextDirection(lng: string): 'ltr' | 'rtl'
applyDirection(lng: string, element?: Element): void
```

### Fábricas de configuração i18next

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

Use **`setupKeyAsDefaultT`** como ponto de entrada usual do aplicativo (chave-trim + plural **`wrapT`** + opcional **`translate-ui`** `{sourceLocale}.json`). Chamar apenas **`wrapI18nWithKeyTrim`** é **desencorajado** para configuração de aplicativos.

Construa **`localeLoaders`** com **`makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, …)`** para manter as chaves alinhadas com **`targetLocales`** após **`generate-ui-languages`**. Veja **`docs/GETTING_STARTED.md`** (configuração em tempo de execução) e **`examples/nextjs-app/`** / **`examples/console-app/`**.

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

Todos os tipos e classes públicos são exportados da raiz do pacote. Exemplo: executar a etapa de tradução da interface do usuário no Node.js sem a CLI:

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
| `loadI18nConfigFromFile` | Carregar, mesclar e validar configuração de um arquivo JSON. |
| `parseI18nConfig` | Validar um objeto de configuração bruto. |
| `TranslationCache` | Cache SQLite - instanciar com um caminho `cacheDir`. |
| `UIStringExtractor` | Extrair strings `t("…")` de código-fonte JS/TS. |
| `MarkdownExtractor` | Extrair segmentos traduzíveis de markdown. |
| `JsonExtractor` | Extrair de arquivos JSON de rótulos do Docusaurus. |
| `SvgExtractor` | Extrair de arquivos SVG. |
| `OpenRouterClient` | Fazer solicitações de tradução ao OpenRouter. |
| `PlaceholderHandler` | Proteger/restaurar a sintaxe de markdown ao redor da tradução. |
| `splitTranslatableIntoBatches` | Agrupar segmentos em lotes com tamanho adequado para LLM. |
| `validateTranslation` | Verificações estruturais após a tradução. |
| `resolveDocumentationOutputPath` | Resolver o caminho do arquivo de saída para um documento traduzido. |
| `Glossary` / `GlossaryMatcher` | Carregar e aplicar glossários de tradução. |
| `runTranslateUI` | Ponto de entrada programático para a interface de tradução. |

---

## Pontos de extensão

### Nomes de funções personalizadas (extração de interface)

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

Passe-o para o pipeline doc-translate importando `doc-translate.ts` utilities programaticamente.

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
