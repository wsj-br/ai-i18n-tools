---
translation_last_updated: '2026-04-11T01:50:05.394Z'
source_file_mtime: '2026-04-11T01:49:54.980Z'
source_file_hash: bbe062d908fc9ffb78ef01c82109ef171a341b28d31299b453571cb1324d5799
translation_language: pt-BR
source_file_path: docs-site/docs/context.md
---
# ai-i18n-tools: Contexto do Agente de IA

Este documento fornece ao agente de IA o modelo mental, decisões principais e padrões necessários para trabalhar efetivamente com o `ai-i18n-tools` sem precisar consultar todos os outros documentos antes. Leia isto antes de fazer alterações em código ou configuração.

<!-- DOCTOC SKIP -->

---

## O que este pacote faz {#what-this-package-does}

`ai-i18n-tools` é uma CLI + biblioteca que automatiza a internacionalização para projetos JavaScript/TypeScript. Ele:

1. **Extrai** strings de interface do código-fonte (chamadas `t("…")`) para um catálogo principal.
2. **Traduz** esse catálogo e arquivos de documentação por meio de LLMs (através do OpenRouter).
3. **Gera** arquivos JSON prontos para uso por locale no i18next, e cópias traduzidas de documentos markdown/SVG/JSON.
4. **Exporta helpers de tempo de execução** para integrar i18next, suporte a RTL e seleção de idioma em qualquer ambiente JS.

Tudo é controlado por um único arquivo de configuração: `ai-i18n-tools.config.json`.

---

## Dois fluxos de trabalho independentes {#two-independent-workflows}

| | Fluxo de Trabalho 1 - Strings de UI | Fluxo de Trabalho 2 - Documentos |
|---|---|---|
| **Entrada** | Arquivos fonte JS/TS com chamadas `t("…")` | `.md`, `.mdx`, arquivos JSON de rótulos do Docusaurus, `.svg` |
| **Saída** | `strings.json` (catálogo) + arquivos JSON planos por locale (`de.json`, etc.) | Cópias traduzidas desses arquivos nos caminhos de saída configurados |
| **Cache** | O próprio `strings.json` (traduções existentes são preservadas) | Banco de dados SQLite (`cacheDir`) - apenas segmentos novos/alterados vão para o LLM |
| **Comando principal** | `translate-ui` | `translate-docs` |
| **Comando de sincronização** | `sync` | `sync` |
| **Flags de funcionalidade** | `extractUIStrings`, `translateUIStrings` | `translateMarkdown`, `translateJSON`, `translateSVG` |

Eles podem ser usados independentemente ou juntos na mesma configuração. **`sync`** executa, em ordem: `extract` (se habilitado), `translate-ui` (se habilitado, a menos que `--no-ui`), `translate-svg` quando `config.svg` existir (a menos que `--no-svg`), depois `translate-docs` (a menos que `--no-docs`). Veja a [referência rápida da CLI](#cli-commands-cheat-sheet) para flags.

---

## Referência rápida do arquivo de configuração {#config-file-quick-reference}

Arquivo: `ai-i18n-tools.config.json` (localização padrão - sobrescreva com `-c <caminho>`)

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": "src/locales/ui-languages.json",

  "openrouter": {
    "translationModels": ["google/gemini-2.5-flash", "openai/gpt-4o-mini"],
    "maxTokens": 8192,
    "temperature": 0.2
  },

  "features": {
    "extractUIStrings": true,
    "translateUIStrings": true,
    "translateMarkdown": true,
    "translateJSON": false,
    "translateSVG": false
  },

  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "src/locales/strings.json",
    "flatOutputDir": "src/locales/",
    "reactExtractor": {
      "funcNames": ["t", "i18n.t"],
      "extensions": [".js", ".jsx", ".ts", ".tsx"]
    }
  },

  "documentation": {
    "contentPaths": ["docs/"],
    "outputDir": "i18n/",
    "cacheDir": ".translation-cache",
    "targetLocales": ["de", "fr"],
    "jsonSource": "i18n/en",
    "markdownOutput": {
      "style": "docusaurus",
      "docsRoot": "docs"
    }
  },

  "glossary": {
    "uiGlossary": "src/locales/strings.json",
    "userGlossary": "glossary-user.csv"
  }
}
```

### Restrições principais {#key-constraints}

- `sourceLocale` **deve corresponder exatamente** à constante `SOURCE_LOCALE` exportada do arquivo de configuração de i18n em tempo de execução (`src/i18n.ts` / `src/i18n.js`).
- `targetLocales` pode ser um caminho de string para um manifesto `ui-languages.json` OU um array de códigos BCP-47.
- `documentation.targetLocales` substitui `targetLocales` apenas para documentos - útil quando deseja menos locales para documentos do que para a interface.
- Todos os caminhos são relativos ao diretório de trabalho atual (cwd, onde a CLI é executada).
- `OPENROUTER_API_KEY` deve estar definida no ambiente ou em um arquivo `.env`.

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

- `code` - código de locale BCP-47 usado em nomes de arquivos e pelo i18next.
- `label` - nome nativo exibido nos seletores de idioma.
- `englishName` - nome em inglês usado por helpers de exibição e prompts de tradução.

Este arquivo orienta tanto o pipeline de tradução quanto a interface de troca de idioma em tempo de execução. Mantenha-o como a única fonte de verdade para os locales suportados.

---

## Referência rápida dos comandos da CLI {#cli-commands-cheat-sheet}

```
npx ai-i18n-tools init [-t ui-markdown|ui-docusaurus]
    Write a starter config file. ui-markdown = React/UI-only template.
    ui-docusaurus = combined UI + docs template.

npx ai-i18n-tools extract
    Scan source for t("…") calls, write/merge strings.json.
    Safe to re-run - preserves existing translations.

npx ai-i18n-tools translate-ui [--locale <code>]
    Translate UI strings only. Reads strings.json, writes flatOutputDir/de.json etc.

npx ai-i18n-tools translate-docs [--locale <code>] [--force | --force-update] …
    Translate markdown/JSON/SVG under documentation paths. Default: skip unchanged files + use segment SQLite cache.
    --force-update: re-run every file output; segment cache still used (no API for unchanged text).
    --force: clear file tracking and ignore segment cache reads (full re-translation); new results still write to cache.
    --stats: print cache stats and exit. --clear-cache [locale]: wipe cache (all or one locale) and exit.
    Do not combine --force with --force-update (when the docs step runs).

npx ai-i18n-tools translate-svg [--locale <code>] [--force | --force-update] [--no-cache] …
    Standalone SVG assets from config.svg. --no-cache: skip SQLite reads/writes for this run only.

npx ai-i18n-tools sync [--locale <code>] [--force | --force-update] [--no-ui] [--no-svg] [--no-docs] …
    extract (if enabled), translate-ui (unless --no-ui), translate-svg when config.svg exists (unless --no-svg),
    translate-docs (unless --no-docs). --force / --force-update apply to the docs step only; if --no-docs, both can be passed without conflict.

npx ai-i18n-tools status [--locale <code>]
    Show translation coverage per file × locale.

npx ai-i18n-tools editor
    Launch a local web editor for the SQLite cache, strings.json, and glossary.

npx ai-i18n-tools cleanup [--dry-run] [--no-backup] [--backup <path>] [--yes]
    Maintain the SQLite cache: removes stale rows and orphaned filepath rows.
    Prompts before DB writes (unless --dry-run or --yes): run translate-docs --force-update first.
    Backs up cache.db under the cache dir before modifications unless --no-backup. Use --yes in CI.

npx ai-i18n-tools glossary-generate
    Write an empty glossary-user.csv template.
```

Flags globais: `-c <config>` (caminho da configuração), `-v` (saída detalhada/de depuração).

---

## Fluxo de trabalho 1 - Strings de interface: como os dados fluem {#workflow-1---ui-strings-how-data-flows}

```
source files (JS/TS)
    │  i18next-scanner Parser finds t("literal") and i18n.t("literal")
    ▼
strings.json  - master catalog
    {
      "<md5-8-hex>": {
        "source": "The English string",
        "translated": { "de": "Der deutsche Text", "pt-BR": "O texto em português" }
      }
    }
    │  translate-ui reads this, sends batches to OpenRouter, fills missing locales
    ▼
src/locales/de.json    - flat map: source string → translation
    { "The English string": "Der deutsche Text", "Save": "Speichern" }
src/locales/pt-BR.json
    ...
```

**Apenas strings literais são extraíveis.** Variáveis, expressões ou literais de modelo como chave não são encontradas:

```js
t('Save')                   // ✓ extracted
t('Hello {{name}}', {name}) // ✓ extracted as "Hello {{name}}"
t(labelVar)                 // ✗ not extracted - variable key
t(`Hello ${name}`)          // ✗ not extracted - template literal
```

O i18next usa o modelo de chave como padrão: traduções ausentes retornam para a própria chave (a string fonte em inglês). O `parseMissingKeyHandler` em `defaultI18nInitOptions` trata disso.

---

## Fluxo de trabalho 2 - Tradução de documentos: como os dados fluem {#workflow-2---document-translation-how-data-flows}

```
source files (md/mdx/json/svg)
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

**Chave de cache**: primeiros 16 caracteres hexadecimais SHA-256 do conteúdo do segmento normalizado por espaços em branco × localidade. O cache está em `documentation.cacheDir` (um arquivo SQLite `.db`).

**CLI**: `--force-update` ignora apenas a ignoração no nível de *arquivo* (reconstrói as saídas), mas ainda usa o cache de segmentos. `--force` limpa o controle por arquivo e ignora leituras do cache de segmentos para chamadas de API. Veja o guia de início rápido para a tabela completa de flags.

**Estilos de saída** (`markdownOutput.style`):

| Estilo | Exemplo |
|---|---|
| `"docusaurus"` | `docs/guide.md` → `i18n/de/docusaurus-plugin-content-docs/current/guide.md` |
| `"flat"` | `docs/guide.md` → `i18n/guide.de.md` |
| `pathTemplate` personalizado | qualquer layout usando `{outputDir}`, `{locale}`, `{relPath}`, `{stem}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}` |

A saída no estilo plano reescreve automaticamente links relativos entre páginas (por exemplo, `[Guia](./guide.md)` → `guide.de.md`).

---

## Integração em tempo de execução - integração do i18next {#runtime-integration---wiring-i18next}

O pacote exporta utilitários de `'ai-i18n-tools/runtime'` que eliminam código repetitivo. A configuração mínima:

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

**Carregar um idioma sob demanda** (por exemplo, quando o usuário altera o idioma):

```ts
await loadLocale(code);
i18n.changeLanguage(code);
```

`loadLocale` não faz nada para o idioma fonte - ele só busca idiomas não fonte.

---

## Referência de utilitários em tempo de execução {#runtime-helpers-reference}

Todos exportados de `'ai-i18n-tools/runtime'`. Funcionam em qualquer ambiente JS (navegador, Node.js, Edge, Deno). Não requer dependência par do i18next.

| Exportação | Assinatura | Finalidade |
|---|---|---|
| `defaultI18nInitOptions` | `(sourceLocale?: string) => i18nextInitOptions` | Inicialização padrão do i18next para configuração com chave como padrão |
| `wrapI18nWithKeyTrim` | `(i18n: I18nLike) => void` | Remove espaços das chaves antes da busca e aplica interpolação `{{var}}` para o idioma fonte (onde `parseMissingKeyHandler` retorna a chave bruta) |
| `makeLoadLocale` | `(i18n, loaders, sourceLocale?) => (lang: string) => Promise<void>` | Fábrica para carregamento assíncrono de idiomas |
| `getTextDirection` | `(lng: string) => 'ltr' \| 'rtl'` | Detecção de direção RTL por código BCP-47 |
| `applyDirection` | `(lng: string, element?: Element) => void` | Define `dir` em `document.documentElement` (não faz nada no Node.js) |
| `getUILanguageLabel` | `(lang: UiLanguageEntry, t: TranslateFn) => string` | Rótulo traduzido para menus suspensos em páginas de configurações |
| `getUILanguageLabelNative` | `(lang: UiLanguageEntry) => string` | Rótulo nativo para menus de cabeçalho (sem chamada `t()`) |
| `interpolateTemplate` | `(str: string, vars: Record<string, string \| number \| boolean>) => string` | Substituição de baixo nível `{{var}}` em uma string simples (usado internamente por `wrapI18nWithKeyTrim`; raramente necessário no código da aplicação) |
| `flipUiArrowsForRtl` | `(text, isRtl: boolean) => string` | Inverte `→` para `←` em layouts RTL |
| `RTL_LANGS` | `ReadonlySet<string>` | Conjunto de códigos BCP-47 tratados como RTL |

---

## API programática {#programmatic-api}

Importe de `'ai-i18n-tools'`. Útil quando você precisa chamar etapas de tradução a partir de um script de build ou pipeline de CI.

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
// summary.translated - number of newly translated strings
// summary.locales   - number of locales processed
```

Outras exportações úteis para pipelines personalizados:

| Exportar | Uso |
|---|---|
| `loadI18nConfigFromFile(path, cwd?)` | Carregar e validar a configuração |
| `parseI18nConfig(rawObject)` | Validar um objeto de configuração criado no código |
| `TranslationCache` | Acesso direto ao cache SQLite |
| `UIStringExtractor` | Extrair chamadas `t("…")` de arquivos JS/TS |
| `MarkdownExtractor` | Analisar markdown em segmentos traduzíveis |
| `JsonExtractor` | Analisar arquivos de rótulos JSON do Docusaurus |
| `SvgExtractor` | Analisar elementos de texto SVG |
| `OpenRouterClient` | Fazer solicitações de tradução diretamente |
| `PlaceholderHandler` | Proteger/restaurar a sintaxe markdown ao redor da tradução |
| `splitTranslatableIntoBatches` | Agrupar segmentos em lotes do tamanho adequado para o LLM |
| `validateTranslation` | Verificações estruturais após uma chamada de tradução |
| `resolveDocumentationOutputPath` | Calcular o caminho do arquivo de saída para um documento traduzido |
| `Glossary` / `GlossaryMatcher` | Carregar e aplicar um glossário de tradução |

---

## Glossário {#glossary}

O glossário garante terminologia consistente em todas as traduções.

- **Glossário gerado automaticamente** (`glossary.uiGlossary`): lê `strings.json` e usa traduções existentes como fonte de sugestões. Nenhum CSV necessário.
- **Glossário do usuário** (`glossary.userGlossary`): um arquivo CSV com colunas `term,translation,locale`. Gere um modelo vazio com `npx ai-i18n-tools glossary-generate`.

As sugestões do glossário são injetadas no prompt do sistema do LLM — são apenas sugestões, não substituições obrigatórias.

---

## Pontos de extensão {#extension-points}

### Nomes personalizados de funções {#custom-function-names}

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
  "documentation": {
    "markdownOutput": {
      "pathTemplate": "{outputDir}/{locale}/{relativeToDocsRoot}"
    }
  }
}
```

Marcadores disponíveis: `{outputDir}`, `{locale}`, `{relPath}`, `{stem}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}`.

---

## Tarefas comuns e o que fazer {#common-tasks-and-what-to-do}

| Tarefa | O que executar / alterar |
|---|---|
| Adicionar um novo idioma | Adicione-o ao `ui-languages.json` (ou ao array `targetLocales`), depois execute `translate-docs` / `translate-ui` / `sync` |
| Traduzir apenas um idioma | `npx ai-i18n-tools translate-docs --locale de` (ou `translate-ui`, `sync`) |
| Adicionar uma nova string de interface | Escreva `t('Minha nova string')` no código-fonte, depois execute `extract` e então `translate-ui` |
| Atualizar uma tradução manualmente | Edite diretamente o `strings.json` (objeto `translated`), depois execute `translate-ui` (não sobrescreverá entradas existentes) |
| Traduzir apenas documentos novos/atualizados | Execute `translate-docs` — o cache de arquivos e segmentos ignora automaticamente o trabalho inalterado |
| Reconstruir saídas de documentos sem chamar novamente a API para segmentos inalterados | `npx ai-i18n-tools translate-docs --force-update` |
| Revisão completa da tradução de documentos (ignorar o cache de segmentos) | `npx ai-i18n-tools translate-docs --force` |
| Liberar espaço de cache | `npx ai-i18n-tools cleanup` ou `translate-docs --clear-cache` |
| Verificar o que não foi traduzido | `npx ai-i18n-tools status` |
| Alterar o modelo de tradução | Edite `openrouter.translationModels` na configuração (o primeiro modelo é o principal, os demais são de contingência) |
| Integrar i18next em um novo projeto | Veja [Integração em tempo de execução](#runtime-integration---wiring-i18next) acima |
| Traduzir documentos para menos idiomas do que a interface | Defina `documentation.targetLocales` como um array menor |
| Executar extrair + UI + SVG + documentos em um único comando | `npx ai-i18n-tools sync` — use `--no-ui`, `--no-svg` ou `--no-docs` para pular uma etapa (por exemplo, apenas UI + SVG: `--no-docs`) |

---

## Variáveis de ambiente {#environment-variables}

| Variável | Efeito |
|---|---|
| `OPENROUTER_API_KEY` | **Obrigatório.** Sua chave de API do OpenRouter. |
| `OPENROUTER_BASE_URL` | Substitui a URL base da API. |
| `I18N_SOURCE_LOCALE` | Substitui `sourceLocale` em tempo de execução. |
| `I18N_TARGET_LOCALES` | Códigos de idioma separados por vírgula para substituir `targetLocales`. |

---

## Arquivos gerados / mantidos pela ferramenta {#files-generated--maintained-by-the-tool}

| Arquivo | Propriedade de | Observações |
|---|---|---|
| `ai-i18n-tools.config.json` | Você | Configuração principal. Edite manualmente. |
| `ui-languages.json` (onde quer que esteja configurado) | Você | Manifesto de localidades. Edite manualmente para adicionar/remover localidades. |
| `strings.json` (onde quer que esteja configurado) | Ferramenta (`extract`) | Catálogo mestre da interface. É seguro editar os valores de `translated`. Não renomeie as chaves. |
| `{flatOutputDir}/de.json`, etc. | Ferramenta (`translate-ui`) | Mapas planos por localidade. Não edite — são regenerados a cada execução do comando `translate-ui`. |
| `{cacheDir}/*.db` | Ferramenta | Cache de tradução em SQLite. Não edite diretamente; use o comando `editor` ou `cleanup`. |
| `glossary-user.csv` | Você | Substituições de termos. Gere o modelo com o comando `glossary-generate`. |

---

## Resumo da estrutura de origem {#source-layout-summary}

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

O ponto de entrada para todos os tipos e funções públicos é `src/index.ts`.
