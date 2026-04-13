---
translation_last_updated: '2026-04-13T00:28:31.025Z'
source_file_mtime: '2026-04-13T00:28:15.573Z'
source_file_hash: d362c2411cab836c5035efd2135f097efeb4477a3f61cd225850c323e0cc7071
translation_language: pt-BR
source_file_path: docs-site/docs/context.md
---
# ai-i18n-tools: Contexto do Agente de IA

Este documento fornece a um agente de IA o modelo mental, as decisões-chave e os padrões necessários para trabalhar de forma eficaz com `ai-i18n-tools` sem consultar todos os outros documentos primeiro. Leia isto antes de fazer alterações no código ou na configuração.

<!-- DOCTOC SKIP -->

---

## O que este pacote faz {#what-this-package-does}

`ai-i18n-tools` é uma CLI + biblioteca que automatiza a internacionalização para projetos JavaScript/TypeScript. Ele:

1. **Extrai** strings da interface do usuário do código-fonte (`t("…")` chamadas) para um catálogo mestre.
2. **Traduz** esse catálogo e arquivos de documentação via LLMs (através do OpenRouter).
3. **Escreve** arquivos JSON prontos para localidade para i18next, além de markdown traduzido, rótulos JSON do Docusaurus e ativos SVG independentes.
4. **Exporta auxiliares em tempo de execução** para conectar i18next, suporte a RTL e seleção de idioma em qualquer ambiente JS.

Tudo é controlado por um único arquivo de configuração: `ai-i18n-tools.config.json`.

---

## Dois fluxos de trabalho independentes {#two-independent-workflows}

| | Fluxo de Trabalho 1 - Strings da UI | Fluxo de Trabalho 2 - Documentos |
|---|---|---|
| **Entrada** | Arquivos fonte JS/TS com chamadas `t("…")` | Arquivos `.md`, `.mdx`, rótulos JSON do Docusaurus |
| **Saída** | `strings.json` (catálogo) + arquivos JSON planos por localidade (`de.json`, etc.) | Cópias traduzidas desses arquivos nos caminhos de saída configurados |
| **Cache** | `strings.json` em si (as traduções existentes são preservadas) | Banco de dados SQLite (`cacheDir`) - apenas segmentos novos/alterados vão para LLM |
| **Comando chave** | `translate-ui` | `translate-docs` |
| **Comando de sincronização** | `sync` | `sync` |
| **Flags de recurso** | `extractUIStrings`, `translateUIStrings` | `translateMarkdown`, `translateJSON` |

Eles podem ser usados independentemente ou juntos na mesma configuração. `sync` executa, em ordem: `extract` (se habilitado), `translate-ui` (se habilitado, a menos que `--no-ui`), `translate-svg` quando `config.svg` existe (a menos que `--no-svg`), depois `translate-docs` (a menos que `--no-docs`). A tradução de SVG autônoma é configurada via o bloco de nível superior `svg`, não uma flag de funcionalidade. Veja a [folha de dicas da CLI](#cli-commands-cheat-sheet) para as flags.

---

## Referência rápida do arquivo de configuração {#config-file-quick-reference}

Arquivo: `ai-i18n-tools.config.json` (localização padrão - substitua com `-c <path>`)

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": "src/locales/ui-languages.json",

  "openrouter": {
    "translationModels": [
      "qwen/qwen3-235b-a22b-2507",
      "openai/gpt-4o-mini",
      "deepseek/deepseek-v3.2",
      "anthropic/claude-3-haiku",
      "qwen/qwen3.6-plus",
      "anthropic/claude-3.5-haiku",
      "openai/gpt-5.3-codex",
      "anthropic/claude-sonnet-4.6",
      "google/gemini-3-flash-preview"
    ],
    "maxTokens": 8192,
    "temperature": 0.2
  },

  "features": {
    "extractUIStrings": true,
    "translateUIStrings": true,
    "translateMarkdown": true,
    "translateJSON": false
  },

  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "src/locales/strings.json",
    "flatOutputDir": "src/locales/",
    "preferredModel": "anthropic/claude-3.5-haiku",
    "reactExtractor": {
      "funcNames": ["t", "i18n.t"],
      "extensions": [".js", ".jsx", ".ts", ".tsx"]
    }
  },

  "cacheDir": ".translation-cache",
  "documentations": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "targetLocales": ["de", "fr"],
      "jsonSource": "i18n/en",
      "markdownOutput": {
        "style": "docusaurus",
        "docsRoot": "docs"
      }
    }
  ],

  "svg": {
    "sourcePath": "images",
    "outputDir": "public/assets",
    "style": "flat"
  },

  "glossary": {
    "uiGlossary": "src/locales/strings.json",
    "userGlossary": "glossary-user.csv"
  }
}
```

### Restrições principais {#key-constraints}

- `sourceLocale` **deve corresponder exatamente** à constante `SOURCE_LOCALE` exportada do arquivo de configuração i18n em tempo de execução (`src/i18n.ts` / `src/i18n.js`).
- `targetLocales` pode ser um caminho de string para um manifesto `ui-languages.json` OU um array de códigos BCP-47.
- `uiLanguagesPath` é opcional, mas útil quando `targetLocales` é um array explícito e você ainda deseja rótulos baseados em manifesto e filtragem de localidade.
- `documentations[].description` é um texto opcional para mantenedores (para que o bloco serve); não afeta a tradução. Quando definido, é incluído no cabeçalho `translate-docs` e nos cabeçalhos `status`.
- `documentations[].targetLocales` limita aquele bloco a um subconjunto; as localidades de documentação efetivas são a **união** entre blocos (útil quando diferentes árvores precisam de conjuntos de localidades diferentes).
- `documentations[].markdownOutput.postProcessing` pode ajustar o markdown traduzido após a reassemblagem, por exemplo, reescrevendo caminhos de capturas de tela ou reconstruindo um bloco de lista de idiomas.
- Todos os caminhos são relativos ao diretório de trabalho atual (onde a CLI é invocada).
- `OPENROUTER_API_KEY` deve ser configurado no ambiente ou em um arquivo `.env`.

---

## O manifesto `ui-languages.json` {#the-ui-languagesjson-manifest}

Quando `targetLocales` é um caminho de arquivo, esse arquivo deve ser um array JSON com esta estrutura:

```json
[
  { "code": "en-GB", "label": "English (UK)", "englishName": "English (UK)" },
  { "code": "de",    "label": "Deutsch",       "englishName": "German" },
  { "code": "ar",    "label": "العربية",        "englishName": "Arabic" }
]
```

- `code` - código de localidade BCP-47 usado em nomes de arquivos e pelo i18next.
- `label` - nome nativo exibido em seletores de idioma.
- `englishName` - nome em inglês usado para auxiliares de exibição e prompts de tradução.

Este arquivo controla tanto o pipeline de tradução quanto a interface do usuário do alternador de idioma em tempo de execução. Mantenha-o como a única fonte de verdade para localidades suportadas.

---

## Folha de dicas dos comandos da CLI {#cli-commands-cheat-sheet}

```
npx ai-i18n-tools init [-t ui-markdown|ui-docusaurus]
    Write a starter config file. ui-markdown = React/UI-only template.
    ui-docusaurus = combined UI + docs template.

npx ai-i18n-tools extract
    Scan source for t("…") calls, write/merge strings.json.
    Safe to re-run - preserves existing translations.

npx ai-i18n-tools translate-ui [--locale <code>] [--force] [--dry-run] [-j <n>]
    Translate UI strings only. Reads strings.json, writes flatOutputDir/de.json etc.
    --force: re-translate all entries per locale. --dry-run: no writes, no API calls. -j: max parallel locales.

npx ai-i18n-tools translate-docs [--locale <code>] [--force | --force-update] …
    Translate markdown and JSON under documentation paths. Default: skip unchanged files + use segment SQLite cache.
    --force-update: re-run every file output; segment cache still used (no API for unchanged text).
    --force: clear file tracking and ignore segment cache reads (full re-translation); new results still write to cache.
    --stats: print cache stats and exit. --clear-cache [locale]: wipe cache (all or one locale) and exit.
    --prompt-format xml|json-array|json-object: batch wire format to the model (default xml); does not change validation or cache.
    Do not combine --force with --force-update (when the docs step runs).

npx ai-i18n-tools translate-svg [--locale <code>] [--force | --force-update] [--no-cache] …
    Standalone SVG assets from config.svg. --no-cache: skip SQLite reads/writes for this run only.

npx ai-i18n-tools sync [--locale <code>] [--force | --force-update] [--no-ui] [--no-svg] [--no-docs] …
    extract (if enabled), translate-ui (unless --no-ui), translate-svg when config.svg exists (unless --no-svg),
    translate-docs (unless --no-docs). --force / --force-update apply to the docs step only; if --no-docs, both can be passed without conflict.

npx ai-i18n-tools status
    Show markdown translation coverage per file × locale.

npx ai-i18n-tools editor
    Launch a local web editor for the SQLite cache, strings.json, and glossary.

npx ai-i18n-tools cleanup [--dry-run] [--no-backup] [--backup <path>]
    Runs sync --force-update first, then maintains the SQLite cache: stale segment rows; orphaned file_tracking keys (doc-block:, svg-assets:, …);
    orphaned translation rows whose filepath metadata points at a missing file.
    Backs up cache.db under the cache dir before modifications unless --no-backup.

npx ai-i18n-tools glossary-generate
    Write an empty glossary-user.csv template.
```

Flags globais: `-c <config>` (caminho da configuração), `-v` (saída detalhada/debug), `-w` / `--write-logs [path]` (grava a saída do console em um arquivo de log; caminho padrão: sob `cacheDir`).

---

## Fluxo de Trabalho 1 - Strings da UI: como os dados fluem {#workflow-1---ui-strings-how-data-flows}

```
source files (JS/TS)
    │  i18next-scanner Parser finds t("literal") and i18n.t("literal")
    ▼
strings.json  - master catalog
    {
      "<md5-8-hex>": {
        "source": "The English string",
        "translated": { "de": "Der deutsche Text", "pt-BR": "O texto em português" },
        "models": { "de": "…", "pt-BR": "…" }
      }
    }
    │  translate-ui reads this, sends batches to OpenRouter, fills missing locales and records model ids per locale
    ▼
src/locales/de.json    - flat map: source string → translation
    { "The English string": "Der deutsche Text", "Save": "Speichern" }
src/locales/pt-BR.json
    ...
```

**Apenas strings literais são extraíveis.** Variáveis, expressões ou literais de template como chave não são encontradas:

```js
t('Save')                   // ✓ extracted
t('Hello {{name}}', {name}) // ✓ extracted as "Hello {{name}}"
t(labelVar)                 // ✗ not extracted - variable key
t(`Hello ${name}`)          // ✗ not extracted - template literal
```

i18next usa o modelo chave-como-padrão: traduções ausentes retornam à própria chave (a string fonte em inglês). O `parseMissingKeyHandler` em `defaultI18nInitOptions` lida com isso.

---

## Fluxo de Trabalho 2 - Tradução de documentos: como os dados fluem {#workflow-2---document-translation-how-data-flows}

```
source files (md/mdx/json)
    │  Extractor produces typed segments with SHA-256 hash
    ▼
PlaceholderHandler  - replaces URLs, admonitions, anchors with opaque tokens
    ▼
TranslationCache lookup (SQLite)
    │  cache hit → use stored translation
    │  cache miss → send batch to OpenRouter
    ▼
PlaceholderHandler.restore  - tokens replaced back with original syntax
    ▼
resolveDocumentationOutputPath  → write to output file
```

**Chave do cache**: Primeiros 16 caracteres hexadecimais do SHA-256 do conteúdo do segmento normalizado em espaços × locale. O cache reside sob o `cacheDir` raiz (um arquivo SQLite `cache.db`), compartilhado por todos os blocos `documentations`. Cada linha armazena o `model` que traduziu o segmento por último; salvar uma edição no `editor` define `model` como `user-edited` (mesmo sentinela que `models` do UI `strings.json`).

**CLI**: `--force-update` ignora apenas o *nível de arquivo* (reconstrói saídas) enquanto ainda usa o cache de segmentos. `--force` limpa o rastreamento por arquivo e ignora leituras de cache de segmentos para chamadas de API. Consulte o guia de introdução para a tabela completa de flags.

**SVGs autônomos**: tratados por `translate-svg` com o bloco de configuração `svg` de nível superior. Eles usam as mesmas ideias de OpenRouter/cache, mas não o pipeline de `documentations`.

**Estilos de saída** (`markdownOutput.style`):

| Estilo | Exemplo |
|---|---|
| `"nested"` (padrão) | `docs/guide.md` → `i18n/de/docs/guide.md` |
| `"docusaurus"` | `docs/guide.md` → `i18n/de/docusaurus-plugin-content-docs/current/guide.md` |
| `"flat"` | `docs/guide.md` → `i18n/guide.de.md` |
| template de caminho customizado `pathTemplate` | qualquer layout usando `{outputDir}`, `{locale}`, `{LOCALE}`, `{relPath}`, `{stem}`, `{basename}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}` |

A saída em estilo flat reescreve automaticamente links relativos entre páginas (por exemplo, `[Guia](./guide.md)` → `guide.de.md`).

---

## Integração em tempo de execução - conectando i18next {#runtime-integration---wiring-i18next}

O pacote exporta helpers de `'ai-i18n-tools/runtime'` que removem boilerplate. A configuração mínima:

```ts
// src/i18n.ts  - import this at the top of your entry point
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import uiLanguages from './locales/ui-languages.json';
import {
  defaultI18nInitOptions,
  wrapI18nWithKeyTrim,
  makeLoadLocale,
  applyDirection,
} from 'ai-i18n-tools/runtime';

// Must match sourceLocale in ai-i18n-tools.config.json exactly
export const SOURCE_LOCALE = 'en-GB';

void i18n.use(initReactI18next).init(defaultI18nInitOptions(SOURCE_LOCALE));
wrapI18nWithKeyTrim(i18n);
i18n.on('languageChanged', applyDirection);
applyDirection(i18n.language);

// Dynamic imports for non-source locales
const localeLoaders = Object.fromEntries(
  uiLanguages
    .filter(({ code }) => code !== SOURCE_LOCALE)
    .map(({ code }) => [code, () => import(`./locales/${code}.json`)])
);

export const loadLocale = makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);
export default i18n;
```

**Carregando uma localidade sob demanda** (por exemplo, quando o usuário troca de idioma):

```ts
await loadLocale(code);
i18n.changeLanguage(code);
```

`loadLocale` é um no-op para a localidade fonte - ele apenas busca localidades não fontes.

---

## Referência de helpers em tempo de execução {#runtime-helpers-reference}

Todos exportados de `'ai-i18n-tools/runtime'`. Funcionam em qualquer ambiente JS (navegador, Node.js, Edge, Deno). Nenhuma dependência peer do i18next é necessária.

| Exportar | Assinatura | Propósito |
|---|---|---|
| `defaultI18nInitOptions` | `(sourceLocale?: string) => i18nextInitOptions` | Inicialização padrão do i18next para configuração chave-como-padrão |
| `wrapI18nWithKeyTrim` | `(i18n: I18nLike) => void` | Remove espaços das chaves antes da busca e aplica a interpolação `{{var}}` para a localidade fonte (onde `parseMissingKeyHandler` retorna a chave bruta) |
| `makeLoadLocale` | `(i18n, loaders, sourceLocale?) => (lang: string) => Promise<void>` | Fábrica para carregamento assíncrono de localidades |
| `getTextDirection` | `(lng: string) => 'ltr' \| 'rtl'` | Detecção de RTL pelo código BCP-47 |
| `applyDirection` | `(lng: string, element?: Element) => void` | Define `dir` em `document.documentElement` (no-op em Node.js) |
| `getUILanguageLabel` | `(lang: UiLanguageEntry, t: TranslateFn) => string` | Rótulo traduzido para dropdowns da página de configurações |
| `getUILanguageLabelNative` | `(lang: UiLanguageEntry) => string` | Rótulo nativo para menus de cabeçalho (sem chamada `t()`) |
| `interpolateTemplate` | `(str: string, vars: Record<string, string \| number \| boolean>) => string` | Substituição de baixo nível `{{var}}` em uma string simples (usado internamente por `wrapI18nWithKeyTrim`; raramente necessário no código do aplicativo) |
| `flipUiArrowsForRtl` | `(text, isRtl: boolean) => string` | Inverte `→` para `←` para layouts RTL |
| `RTL_LANGS` | `ReadonlySet<string>` | Conjunto de códigos BCP-47 tratados como RTL |

---

## API Programática {#programmatic-api}

Importar de `'ai-i18n-tools'`. Útil quando você precisa chamar etapas de tradução de um script de construção ou pipeline CI.

```ts
import {
  loadI18nConfigFromFile,
  runTranslateUI,
} from 'ai-i18n-tools';

const config = loadI18nConfigFromFile('ai-i18n-tools.config.json');
const summary = await runTranslateUI(config, {
  cwd: process.cwd(),
  locales: config.targetLocales,
  force: false,
  dryRun: false,
  verbose: false,
});
// summary.stringsUpdated - number of newly translated strings
// summary.localesTouched - locale codes processed
```

Outros exports úteis para pipelines customizados:

| Exportar | Usar quando |
|---|---|
| `loadI18nConfigFromFile(path, cwd?)` | Carregar e validar a configuração |
| `parseI18nConfig(rawObject)` | Validar um objeto de configuração que você construiu no código |
| `TranslationCache` | Acesso direto ao cache SQLite |
| `UIStringExtractor` | Extrair chamadas `t("…")` de arquivos JS/TS |
| `MarkdownExtractor` | Analisar markdown em segmentos traduzíveis |
| `JsonExtractor` | Analisar arquivos de rótulo JSON do Docusaurus |
| `SvgExtractor` | Analisar elementos de texto SVG |
| `OpenRouterClient` | Fazer solicitações de tradução diretamente |
| `PlaceholderHandler` | Proteger/restaurar a sintaxe markdown em torno da tradução |
| `splitTranslatableIntoBatches` | Agrupar segmentos em lotes do tamanho do LLM |
| `validateTranslation` | Verificações estruturais após uma chamada de tradução |
| `resolveDocumentationOutputPath` | Calcular o caminho do arquivo de saída para um documento traduzido |
| `Glossary` / `GlossaryMatcher` | Carregar e aplicar um glossário de tradução |

---

## Glossário {#glossary}

O glossário garante uma terminologia consistente em todas as traduções.

- **Glossário auto-construído** (`glossary.uiGlossary`): lê `strings.json` e usa traduções existentes como fonte de dicas. Nenhum CSV necessário.
- **Glossário do usuário** (`glossary.userGlossary`): um arquivo CSV com colunas `String original`, `locale`, `Tradução` (ou `en`, `locale`, `Tradução`). Gere um template vazio com `npx ai-i18n-tools glossary-generate`.

Dicas do glossário são injetadas no prompt do sistema LLM - são sugestões, não substituições rígidas.

---

## Pontos de extensão {#extension-points}

### Nomes de funções personalizadas {#custom-function-names}

```json
{ "ui": { "reactExtractor": { "funcNames": ["t", "i18n.t", "translate"] } } }
```

### Extrator personalizado {#custom-extractor}

```ts
import { BaseExtractor, type Segment } from 'ai-i18n-tools';

class MyExtractor extends BaseExtractor {
  readonly name = 'my-format';
  canHandle(filepath: string) { return filepath.endsWith('.myext'); }
  extract(content: string): Segment[] { /* return typed segments */ }
  reassemble(segments: Segment[], translations: Map<string, string>): string { /* rebuild file */ }
}
```

### Caminho de saída personalizado {#custom-output-path}

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

Placeholders disponíveis: `{outputDir}`, `{locale}`, `{LOCALE}`, `{relPath}`, `{stem}`, `{basename}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}`.

---

## Tarefas comuns e o que fazer {#common-tasks-and-what-to-do}

| Tarefa | O que executar / alterar |
|---|---|
| Adicionar um novo locale | Adicione-o ao `ui-languages.json` (ou array `targetLocales`), depois execute `translate-docs` / `translate-ui` / `sync` |
| Traduzir apenas um locale | `npx ai-i18n-tools translate-docs --locale de` (ou `translate-ui`, `sync`) |
| Adicionar uma nova string de UI | Escreva `t('Minha nova string')` no código-fonte, depois execute `extract` e então `translate-ui` |
| Atualizar uma tradução manualmente | Edite `strings.json` diretamente (`translated`), ou use `editor` (define `models[locale]` como `user-edited`). `translate-ui` ignora locales que já têm texto, a menos que use `--force` |
| Traduzir apenas docs novos/atualizados | Execute `translate-docs` - o cache de arquivo + segmento ignora automaticamente o trabalho inalterado |
| Reconstruir saídas de docs sem chamar a API novamente para segmentos inalterados | `npx ai-i18n-tools sync  --force-update` |
| Retradução completa de docs (ignorar cache de segmentos) | `npx ai-i18n-tools translate-docs --force` |
| Liberar espaço do cache | `npx ai-i18n-tools cleanup` ou `translate-docs --clear-cache` |
| Inspecionar o que não está traduzido | `npx ai-i18n-tools status` |
| Alterar o modelo de tradução | Edite `openrouter.translationModels` (o primeiro é o primário, os demais são fallbacks). Para **UI apenas**, o opcional `ui.preferredModel` é tentado antes dessa lista. |
| Conectar i18next em um novo projeto | Veja [Integração em runtime](#runtime-integration---wiring-i18next) acima |
| Traduzir docs para menos locales que a UI | Defina `documentations[].targetLocales` no(s) bloco(s) relevante(s), ou use uma união menor |
| Executar extract + UI + SVG + docs em um comando | `npx ai-i18n-tools sync` - use `--no-ui`, `--no-svg` ou `--no-docs` para pular uma etapa (ex.: apenas UI + SVG: `--no-docs`) |

---

## Variáveis de ambiente {#environment-variables}

| Variável | Efeito |
|---|---|
| `OPENROUTER_API_KEY` | **Obrigatório.** Sua chave de API do OpenRouter. |
| `OPENROUTER_BASE_URL` | Substituir a URL base da API. |
| `I18N_SOURCE_LOCALE` | Substituir `sourceLocale` em tempo de execução. |
| `I18N_TARGET_LOCALES` | Códigos de localidade separados por vírgula para substituir `targetLocales`. |
| `I18N_LOG_LEVEL` | Nível do logger (`debug`, `info`, `warn`, `error`, `silent`). |
| `NO_COLOR` | Quando `1`, desabilitar cores ANSI na saída do log. |
| `I18N_LOG_SESSION_MAX` | Máximo de linhas mantidas por sessão de log (padrão `5000`). |

---

## Arquivos gerados / mantidos pela ferramenta {#files-generated--maintained-by-the-tool}

| Arquivo | Pertence a | Observações |
|---|---|---|
| `ai-i18n-tools.config.json` | Você | Configuração principal. Edite manualmente. |
| `ui-languages.json` (onde configurado) | Você | Manifesto de locales. Edite manualmente para adicionar/remover locales. |
| `strings.json` (onde configurado) | Ferramenta (`extract` / `translate-ui` / `editor`) | Catálogo mestre da UI: `source`, `translated`, opcional `models` (por locale: id do modelo OpenRouter ou `user-edited`), opcional `locations`. Seguro editar `translated`; não renomeie as chaves. |
| `{flatOutputDir}/de.json`, etc. | Ferramenta (`translate-ui`) | Mapas planos por locale (source → tradução apenas, sem `models`). Não edite — regenerado a cada `translate-ui`. |
| `{cacheDir}/*.db` | Ferramenta | Cache de tradução SQLite (metadados `model` por segmento; `user-edited` após salvamentos manuais no `editor`). Não edite diretamente; use `editor` ou `cleanup`. |
| `glossary-user.csv` | Você | Sobrescritas de termos. Gere o modelo com `glossary-generate`. |

---

## Resumo do layout de origem {#source-layout-summary}

```
src/
├── index.ts               Public API (all programmatic exports)
├── cli/                   CLI command implementations
├── core/                  Config loading, types (Zod), SQLite cache, prompt builder, output paths
├── extractors/            Segment extractors: JS/TS, Markdown, JSON, SVG
├── processors/            Placeholder protection, batch splitting, post-translation validation, link rewriting
├── api/openrouter.ts      HTTP client for OpenRouter with model fallback and rate-limit handling
├── glossary/              Glossary loading (CSV + auto from strings.json) and term matching
├── runtime/               i18next helpers, RTL helpers, display helpers (no i18next import)
├── server/                Local Express web editor for cache/glossary
└── utils/                 Logger, SHA-256 hash, .translate-ignore parser
```

O ponto de entrada para todos os tipos e funções públicas é `src/index.ts`.
