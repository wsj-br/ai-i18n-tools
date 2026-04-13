---
translation_last_updated: '2026-04-13T00:28:34.182Z'
source_file_mtime: '2026-04-13T00:28:15.565Z'
source_file_hash: c8918e0004d77e154c0fa0f750e67e8d78e9c673ca048942b309582cb3f5c8b8
translation_language: pt-BR
source_file_path: docs-site/docs/getting-started.md
---
# ai-i18n-tools: Introdução

`ai-i18n-tools` fornece dois fluxos de trabalho independentes e compostáveis:

- **Fluxo de Trabalho 1 - Tradução de UI**: extrai chamadas `t("…")` de qualquer fonte JS/TS, traduzindo-as via OpenRouter e escrevendo arquivos JSON planos por localidade prontos para i18next.
- **Fluxo de Trabalho 2 - Tradução de Documentos**: traduz arquivos markdown (MDX) e arquivos de rótulo JSON do Docusaurus para qualquer número de localidades, com cache inteligente. **Ativos** SVG usam um comando separado (`translate-svg`) e configuração `svg` opcional (veja [referência CLI](#cli-reference)).

Ambos os fluxos de trabalho usam OpenRouter (qualquer LLM compatível) e compartilham um único arquivo de configuração.

<small>**Leia em outros idiomas:** </small>
<small id="lang-list">[en-GB](./GETTING_STARTED.md) · [de](../translated-docs/docs/GETTING_STARTED.de.md) · [es](../translated-docs/docs/GETTING_STARTED.es.md) · [fr](../translated-docs/docs/GETTING_STARTED.fr.md) · [hi](../translated-docs/docs/GETTING_STARTED.hi.md) · [ja](../translated-docs/docs/GETTING_STARTED.ja.md) · [ko](../translated-docs/docs/GETTING_STARTED.ko.md) · [pt-BR](../translated-docs/docs/GETTING_STARTED.pt-BR.md) · [zh-CN](../translated-docs/docs/GETTING_STARTED.zh-CN.md) · [zh-TW](../translated-docs/docs/GETTING_STARTED.zh-TW.md)</small>

---

<!-- INÍCIO da TOC gerada pelo doctoc, mantenha o comentário aqui para permitir atualização automática -->
<!-- NÃO EDITE ESTA SEÇÃO, EM VEZ DISSO, REEXECUTE o doctoc PARA ATUALIZAR -->
**Tabela de Conteúdos**

- [Instalação](#installation)
- [Início Rápido](#quick-start)
- [Fluxo de Trabalho 1 - Tradução de UI](#workflow-1---ui-translation)
  - [Passo 1: Inicializar](#step-1-initialise)
  - [Passo 2: Extrair strings](#step-2-extract-strings)
  - [Passo 3: Traduzir strings de UI](#step-3-translate-ui-strings)
  - [Passo 4: Conectar i18next em tempo de execução](#step-4-wire-i18next-at-runtime)
  - [Usando `t()` no código fonte](#using-t-in-source-code)
  - [Interpolação](#interpolation)
  - [UI do seletor de idiomas](#language-switcher-ui)
  - [Idiomas RTL](#rtl-languages)
- [Fluxo de Trabalho 2 - Tradução de Documentos](#workflow-2---document-translation)
  - [Passo 1: Inicializar](#step-1-initialise-1)
  - [Passo 2: Traduzir documentos](#step-2-translate-documents)
    - [Comportamento de cache e flags `translate-docs`](#cache-behaviour-and-translate-docs-flags)
  - [Layouts de saída](#output-layouts)
- [Fluxo de trabalho combinado (UI + Docs)](#combined-workflow-ui--docs)
- [Referência de configuração](#configuration-reference)
  - [`sourceLocale`](#sourcelocale)
  - [`targetLocales`](#targetlocales)
  - [`uiLanguagesPath` (opcional)](#uilanguagespath-optional)
  - [`concurrency` (opcional)](#concurrency-optional)
  - [`batchConcurrency` (opcional)](#batchconcurrency-optional)
  - [`batchSize` / `maxBatchChars` (opcional)](#batchsize--maxbatchchars-optional)
  - [`openrouter`](#openrouter)
  - [`features`](#features)
  - [`ui`](#ui)
  - [`cacheDir`](#cachedir)
  - [`documentations`](#documentations)
  - [`svg` (opcional)](#svg-optional)
  - [`glossary`](#glossary)
- [Referência CLI](#cli-reference)
- [Variáveis de ambiente](#environment-variables)

<!-- FIM da TOC gerada pelo doctoc, mantenha o comentário aqui para permitir atualização automática -->

## Instalação {#installation}

O pacote publicado é **apenas ESM**. Use `import`/`import()` no Node.js ou no seu empacotador; **não use `require('ai-i18n-tools')`.**

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

Defina sua chave de API do OpenRouter:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Ou crie um arquivo `.env` na raiz do projeto:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

## Início Rápido {#quick-start}

O template `init` padrão (`ui-markdown`) habilita apenas a extração e tradução de **UI**. O template `ui-docusaurus` habilita a tradução de **documentos** (`translate-docs`). Use `sync` quando você quiser um comando que execute extração, tradução de UI, tradução SVG opcional independente e tradução de documentação de acordo com sua configuração.

```bash
# Workflow 1 - UI strings (default template enables extract + translate-ui)
npx ai-i18n-tools init
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui

# Workflow 2 - docs (Docusaurus-oriented template)
npx ai-i18n-tools init -t ui-docusaurus
npx ai-i18n-tools translate-docs

# Combined: extract UI strings, then translate UI + docs (per config features)
npx ai-i18n-tools sync

# Markdown translation status (per file × locale)
npx ai-i18n-tools status
```

---

## Fluxo de Trabalho 1 - Tradução de UI {#workflow-1---ui-translation}

Projetado para qualquer projeto JS/TS que use i18next: aplicativos React, Next.js (componentes do cliente e do servidor), serviços Node.js, ferramentas CLI.

### Passo 1: Inicializar {#step-1-initialise}

```bash
npx ai-i18n-tools init
```

Isso escreve `ai-i18n-tools.config.json` com o template `ui-markdown`. Edite-o para definir:

- `sourceLocale` - seu código de idioma de origem BCP-47 (por exemplo, `"en-GB"`). **Deve corresponder** a `SOURCE_LOCALE` exportado do seu arquivo de configuração i18n em tempo de execução (`src/i18n.ts` / `src/i18n.js`).
- `targetLocales` - caminho para seu manifesto `ui-languages.json` OU um array de códigos BCP-47.
- `ui.sourceRoots` - diretórios a serem escaneados para chamadas `t("…")` (por exemplo, `["src/"]`).
- `ui.stringsJson` - onde escrever o catálogo mestre (por exemplo, `"src/locales/strings.json"`).
- `ui.flatOutputDir` - onde escrever `de.json`, `pt-BR.json`, etc. (por exemplo, `"src/locales/"`).
- `ui.preferredModel` (opcional) - id do modelo OpenRouter a ser tentado **primeiro** para `translate-ui` apenas; em caso de falha, o CLI continua com `openrouter.translationModels` (ou os legados `defaultModel` / `fallbackModel`) em ordem, pulando duplicatas.

### Etapa 2: Extrair strings {#step-2-extract-strings}

```bash
npx ai-i18n-tools extract
```

Escaneia todos os arquivos JS/TS sob `ui.sourceRoots` em busca de chamadas `t("literal")` e `i18n.t("literal")`. Escreve (ou mescla) em `ui.stringsJson`.

O scanner é configurável: adicione nomes de funções personalizadas via `ui.reactExtractor.funcNames`.

### Etapa 3: Traduzir strings da UI {#step-3-translate-ui-strings}

```bash
npx ai-i18n-tools translate-ui
```

Lê `strings.json`, envia lotes para o OpenRouter para cada localidade alvo, escreve arquivos JSON planos (`de.json`, `fr.json`, etc.) em `ui.flatOutputDir`. Quando `ui.preferredModel` está definido, esse modelo é tentado antes da lista ordenada em `openrouter.translationModels` (a tradução de documentos e outros comandos ainda usam apenas `openrouter`).

Para cada entrada, `translate-ui` armazena o **ID do modelo OpenRouter** que traduziu com sucesso cada local em um objeto `models` opcional (mesmas chaves de local que `translated`). Strings editadas no comando local `editor` são marcadas com o valor sentinela `user-edited` em `models` para aquele local. Os arquivos planos por local sob `ui.flatOutputDir` permanecem **string de origem → tradução** apenas; eles não incluem `models` (portanto, os pacotes em tempo de execução permanecem inalterados).

> **Nota sobre o uso do Editor de Cache:** Se você editar uma entrada no editor de cache, precisará executar um `sync --force-update` (ou o comando `translate` equivalente com `--force-update`) para reescrever os arquivos de saída com a entrada de cache atualizada. Além disso, tenha em mente que se o texto de origem mudar posteriormente, sua edição manual será perdida porque uma nova chave de cache (hash) será gerada para a nova string de origem.

### Etapa 4: Conectar i18next em tempo de execução {#step-4-wire-i18next-at-runtime}

Crie seu arquivo de configuração i18n usando os helpers exportados por `'ai-i18n-tools/runtime'`:

```js
// src/i18n.js  (or src/i18n.ts)
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import uiLanguages from './locales/ui-languages.json';
import {
  defaultI18nInitOptions,
  wrapI18nWithKeyTrim,
  makeLoadLocale,
  applyDirection,
} from 'ai-i18n-tools/runtime';

// Must match sourceLocale in ai-i18n-tools.config.json
export const SOURCE_LOCALE = 'en-GB';

void i18n.use(initReactI18next).init(defaultI18nInitOptions(SOURCE_LOCALE));
wrapI18nWithKeyTrim(i18n);
i18n.on('languageChanged', applyDirection);
applyDirection(i18n.language);

const localeLoaders = Object.fromEntries(
  uiLanguages
    .filter(({ code }) => code !== SOURCE_LOCALE)
    .map(({ code }) => [code, () => import(`./locales/${code}.json`)])
);

export const loadLocale = makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);
export default i18n;
```

Importe `i18n.js` antes do React renderizar (por exemplo, no topo do seu ponto de entrada). Quando o usuário mudar de idioma, chame `await loadLocale(code)` e depois `i18n.changeLanguage(code)`.

`SOURCE_LOCALE` é exportado para que qualquer outro arquivo que precise dele (por exemplo, um alternador de idioma) possa importá-lo diretamente de `'./i18n'`.

`defaultI18nInitOptions(sourceLocale)` retorna as opções padrão para configurações de chave como padrão:

- `parseMissingKeyHandler` retorna a chave em si, para que strings não traduzidas exibam o texto de origem.
- `nsSeparator: false` permite chaves que contêm dois pontos.
- `interpolation.escapeValue: false` - seguro para desativar: o React escapa valores por conta própria, e a saída do Node.js/CLI não tem HTML para escapar.

`wrapI18nWithKeyTrim(i18n)` envolve `i18n.t` de modo que: (1) as chaves sejam cortadas antes da busca, correspondendo a como o script de extração as armazena; (2) a interpolação <code>{"{{var}}"}</code> é aplicada quando o local de origem retorna a chave bruta - assim <code>{"t('Olá {{name}}', { name })"}</code> funciona corretamente mesmo para o idioma de origem.

`makeLoadLocale(i18n, loaders, sourceLocale)` retorna uma função assíncrona `loadLocale(lang)` que importa dinamicamente o pacote JSON para um local e o registra com o i18next.

### Usando `t()` no código fonte {#using-t-in-source-code}

Chame `t()` com uma **string literal** para que o script de extração possa encontrá-la:

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <button>{t('Save')}</button>;
}
```

O mesmo padrão funciona fora do React (Node.js, componentes de servidor, CLI):

```js
import i18n from './i18n.js';
console.log(i18n.t('Processing complete'));
```

**Regras:**

- Apenas estas formas são extraídas: `t("…")`, `t('…')`, `t(`…`)`, `i18n.t("…")`.
- A chave deve ser uma **string literal** - sem variáveis ou expressões como chave.
- Não use literais de template para a chave: <code>{'t(`Hello ${name}`)'}</code> não é extraível.

### Interpolação {#interpolation}

Use a interpolação nativa do segundo argumento do i18next para <code>{"{{var}}"}</code> placeholders:

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

O script de extração ignora o segundo argumento - apenas a string literal da chave <code>{"\"Hello {{name}}, você tem {{count}} mensagens\""}</code> é extraída e enviada para tradução. Os tradutores são instruídos a preservar os tokens <code>{"{{...}}"}</code>.

### UI do seletor de idioma {#language-switcher-ui}

Use o manifesto `ui-languages.json` para construir um seletor de idiomas. `ai-i18n-tools` exporta dois auxiliares de exibição:

```tsx
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getUILanguageLabel,
  getUILanguageLabelNative,
  type UiLanguageEntry,
} from 'ai-i18n-tools/runtime';
import uiLanguages from './locales/ui-languages.json';
import { loadLocale } from './i18n';

function LanguageSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  const { t, i18n } = useTranslation();

  const options = useMemo(
    () =>
      (uiLanguages as UiLanguageEntry[]).map((lang) => ({
        code: lang.code,
        // Settings/content dropdowns: shows translated name when available
        label: getUILanguageLabel(lang, t),
        // Header globe menu: shows "English / Deutsch"-style label, no t() call
        nativeLabel: getUILanguageLabelNative(lang),
      })),
    [t]
  );

  const handleChange = async (code: string) => {
    await loadLocale(code);
    i18n.changeLanguage(code);
    onChange(code);
  };

  return (
    <select value={value} onChange={(e) => handleChange(e.target.value)}>
      {options.map((row) => (
        <option key={row.code} value={row.code}>
          {row.label}
        </option>
      ))}
    </select>
  );
}
```

`getUILanguageLabel(lang, t)` - mostra `t(englishName)` quando traduzido, ou `englishName / t(englishName)` quando ambos diferem. Adequado para telas de configurações.

`getUILanguageLabelNative(lang)` - mostra `englishName / label` (sem chamada `t()` em cada linha). Adequado para menus de cabeçalho onde você deseja que o nome nativo esteja visível.

O manifesto `ui-languages.json` é um array JSON de <code>{"{ code, label, englishName }"}</code> entradas. Exemplo:

```json
[
  { "code": "en-GB", "label": "English (UK)", "englishName": "English (UK)" },
  { "code": "pt-BR", "label": "Português (BR)", "englishName": "Portuguese (BR)" },
  { "code": "de",    "label": "Deutsch",        "englishName": "German" },
  { "code": "fr",    "label": "Français",       "englishName": "French" },
  { "code": "ar",    "label": "العربية",         "englishName": "Arabic" }
]
```

Defina `targetLocales` na configuração para o caminho deste arquivo para que o comando de tradução use a mesma lista.

### Idiomas RTL {#rtl-languages}

`ai-i18n-tools` exporta `getTextDirection(lng)` e `applyDirection(lng)`:

```js
import { getTextDirection, applyDirection } from 'ai-i18n-tools/runtime';

getTextDirection('ar')    // 'rtl'
getTextDirection('en-GB') // 'ltr'

// Applied automatically via i18n.on('languageChanged', applyDirection) - see Step 4
```

`applyDirection` define `document.documentElement.dir` (navegador) ou é um no-op (Node.js). Passe um argumento `element` opcional para direcionar um elemento específico.

Para strings que podem conter setas `→`, inverta-as para layouts RTL:

```js
import { flipUiArrowsForRtl } from 'ai-i18n-tools/runtime';
const { i18n } = useTranslation();
const isRtl = getTextDirection(i18n.language) === 'rtl';
const label = flipUiArrowsForRtl(t('Next → Step'), isRtl);
```

---

## Fluxo de Trabalho 2 - Tradução de Documentos {#workflow-2---document-translation}

Projetado para documentação em markdown, sites Docusaurus e arquivos de rótulos JSON. Diagramas SVG são traduzidos via [`translate-svg`](#cli-reference) e `svg` na configuração, não via `documentations[].contentPaths`.

### Passo 1: Inicializar {#step-1-initialise-1}

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

Edite o `ai-i18n-tools.config.json` gerado:

- `sourceLocale` - idioma de origem (deve corresponder a `defaultLocale` em `docusaurus.config.js`).
- `targetLocales` - array de códigos de localidade ou caminho para um manifesto.
- `cacheDir` - diretório de cache SQLite compartilhado para todos os pipelines de documentação (e diretório de log padrão para `--write-logs`).
- `documentations` - array de blocos de documentação. Cada bloco tem uma `description` opcional, `contentPaths`, `outputDir`, `jsonSource` opcional, `markdownOutput`, `targetLocales`, `injectTranslationMetadata`, etc.
- `documentations[].description` - nota curta opcional para mantenedores (o que este bloco cobre). Quando definido, aparece na manchete `translate-docs` (`🌐 …: traduzindo …`) e nos cabeçalhos da seção `status`.
- `documentations[].contentPaths` - diretórios ou arquivos de origem markdown/MDX (veja também `documentations[].jsonSource` para rótulos JSON).
- `documentations[].outputDir` - raiz de saída traduzida para aquele bloco.
- `documentations[].markdownOutput.style` - `"nested"` (padrão), `"docusaurus"`, ou `"flat"` (veja [Layouts de Saída](#output-layouts)).

### Passo 2: Traduzir documentos {#step-2-translate-documents}

```bash
npx ai-i18n-tools translate-docs
```

Isso traduz todos os arquivos em cada bloco de `documentations` nos `contentPaths` para todos os locais de documentação efetivos (união de cada `targetLocales` do bloco quando definido, caso contrário, os `targetLocales` raiz). Segmentos já traduzidos são servidos do cache SQLite - apenas segmentos novos ou alterados são enviados para o LLM.

Para traduzir um único local:

```bash
npx ai-i18n-tools translate-docs --locale de
```

Para verificar o que precisa ser traduzido:

```bash
npx ai-i18n-tools status
```

#### Comportamento do cache e flags `translate-docs` {#cache-behaviour-and-translate-docs-flags}

O CLI mantém **rastreamento de arquivos** no SQLite (hash de origem por arquivo × local) e linhas de **segmento** (hash × local por bloco traduzível). Uma execução normal ignora um arquivo completamente quando o hash rastreado corresponde à fonte atual **e** o arquivo de saída já existe; caso contrário, ele processa o arquivo e usa o cache de segmentos para que o texto inalterado não chame a API.

| Bandeira                  | Efeito                                                                                                                                                                                                  |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| *(padrão)*              | Ignorar arquivos inalterados ao rastrear + correspondência de saída em disco; usar cache de segmentos para o restante.                                                                                  |
| `--force-update`         | Reprocessar todos os arquivos correspondentes (extrair, reassemblar, escrever saídas) mesmo quando o rastreamento de arquivos ignoraria. **O cache de segmentos ainda se aplica** - segmentos inalterados não são enviados para o LLM.                   |
| `--force`                | Limpa o rastreamento de arquivos para cada arquivo processado e **não lê** o cache de segmentos para tradução de API (re-tradução completa). Novos resultados ainda são **escritos** no cache de segmentos.                 |
| `--stats`                | Imprime contagens de segmentos, contagens de arquivos rastreados e totais de segmentos por local, e então sai.                                                                                       |
| `--clear-cache [locale]` | Exclui traduções em cache (e rastreamento de arquivos): todos os locais ou um único local, e então sai.                                                                                              |
| `--prompt-format <mode>` | Como cada **lote** de segmentos é enviado para o modelo e analisado (`xml`, `json-array` ou `json-object`). Padrão **`xml`**. Não altera a extração, espaços reservados, validação, comportamento de cache ou fallback — veja [Formato de prompt em lote](#batch-prompt-format). |

Você não pode combinar `--force` com `--force-update` (eles são mutuamente exclusivos).

#### Formato de prompt em lote {#batch-prompt-format}

`translate-docs` envia segmentos traduzíveis para o OpenRouter em **lotes** (agrupados por `batchSize` / `maxBatchChars`). A flag **`--prompt-format`** apenas altera o **formato de transmissão** daquele lote; a divisão de segmentos, tokens `PlaceholderHandler`, verificações de AST markdown, chaves de cache SQLite e fallback por segmento quando a análise do lote falha permanecem inalterados.

| Modo | Mensagem do usuário | Resposta do modelo |
| ---- | ------------ | ----------- |
| **`xml`** (padrão) | Pseudo-XML: um `<seg id="N">…</seg>` por segmento (com escape XML). | Apenas blocos `<t id="N">…</t>`, um por índice de segmento. |
| **`json-array`** | Um array JSON de strings, uma entrada por segmento na ordem. | Um array JSON da **mesma extensão** (mesma ordem). |
| **`json-object`** | Um objeto JSON `{"0":"…","1":"…",…}` indexado pelo índice do segmento. | Um objeto JSON com as **mesmas chaves** e valores traduzidos. |

O cabeçalho da execução também imprime `Batch prompt format: …` para que você possa confirmar o modo ativo. Arquivos de rótulo JSON (`jsonSource`) e lotes SVG independentes usam a mesma configuração quando essas etapas são executadas como parte do `translate-docs` (ou da fase de documentos do `sync` — `sync` não expõe essa flag; ela é padrão para **`xml`**).

**Deduplicação de segmentos e caminhos no SQLite**

- As linhas de segmento são indexadas globalmente por `(source_hash, locale)` (hash = conteúdo normalizado). Texto idêntico em dois arquivos compartilha uma linha; `translations.filepath` é metadado (último escritor), não uma segunda entrada de cache por arquivo.
- `file_tracking.filepath` usa chaves com namespace: `doc-block:{index}:{relPath}` por bloco de `documentations` (`relPath` é relativo à raiz do projeto posix: caminhos markdown conforme coletados; **arquivos de rótulo JSON usam o caminho relativo ao cwd para o arquivo de origem**, por exemplo, `docs-site/i18n/en/code.json`, para que a limpeza possa resolver o arquivo real), e `svg-assets:{relPath}` para ativos SVG independentes sob `translate-svg`.
- `translations.filepath` armazena caminhos posix relativos ao cwd para segmentos markdown, JSON e SVG (SVG usa a mesma estrutura de caminho que outros ativos; o prefixo `svg-assets:…` é **apenas** em `file_tracking`).
- Após uma execução, `last_hit_at` é limpo apenas para linhas de segmento **no mesmo escopo de tradução** (respeitando `--path` e tipos habilitados) que não foram acessadas, de modo que uma execução filtrada ou apenas de documentos não marque arquivos não relacionados como obsoletos.

### Layouts de saída {#output-layouts}

`"nested"` (padrão quando omitido) — espelha a árvore de origem sob `{outputDir}/{locale}/` (por exemplo, `docs/guide.md` → `i18n/de/docs/guide.md`).

`"docusaurus"` — coloca arquivos que estão sob `docsRoot` em `i18n/<locale>/docusaurus-plugin-content-docs/current/<relativeToDocsRoot>`, correspondendo ao layout i18n usual do Docusaurus. Defina `documentations[].markdownOutput.docsRoot` como sua raiz de origem de documentos (por exemplo, `"docs"`).

```
docs/guide.md         → i18n/de/docusaurus-plugin-content-docs/current/guide.md
i18n/en/sidebar.json  → i18n/de/sidebar.json  (JSON label files)
```

`"flat"` - coloca arquivos traduzidos ao lado da origem com um sufixo de localidade, ou em um subdiretório. Links relativos entre páginas são reescritos automaticamente.

```
docs/guide.md → i18n/guide.de.md
```

Você pode substituir caminhos completamente com `documentations[].markdownOutput.pathTemplate`. Placeholders: <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{LOCALE}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{basename}"}</code>, <code>{"{extension}"}</code>, <code>{"{docsRoot}"}</code>, <code>{"{relativeToDocsRoot}"}</code>.

---

## Fluxo de trabalho combinado (UI + Docs) {#combined-workflow-ui--docs}

Ative todos os recursos em uma única configuração para executar ambos os fluxos de trabalho juntos:

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": "src/locales/ui-languages.json",
  "features": {
    "extractUIStrings": true,
    "translateUIStrings": true,
    "translateMarkdown": true,
    "translateJSON": false
  },
  "glossary": {
    "uiGlossary": "src/locales/strings.json",
    "userGlossary": "glossary-user.csv"
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "src/locales/strings.json",
    "flatOutputDir": "src/locales/"
  },
  "cacheDir": ".translation-cache",
  "documentations": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "markdownOutput": { "style": "flat" }
    }
  ]
}
```

`glossary.uiGlossary` aponta a tradução de documentos para o mesmo catálogo `strings.json` que a UI, para que a terminologia permaneça consistente; `glossary.userGlossary` adiciona substituições CSV para termos de produto.

Execute `npx ai-i18n-tools sync` para rodar um pipeline: **extrair** strings da UI (se `features.extractUIStrings`), **traduzir UI** strings (se `features.translateUIStrings`), **traduzir ativos SVG independentes** (se um bloco `svg` estiver presente na configuração), e então **traduzir documentação** (cada bloco `documentations`: markdown/JSON conforme configurado). Pule partes com `--no-ui`, `--no-svg`, ou `--no-docs`. A etapa de docs aceita `--dry-run`, `-p` / `--path`, `--force`, e `--force-update` (os dois últimos se aplicam apenas quando a tradução de documentação é executada; eles são ignorados se você passar `--no-docs`).

Use `documentations[].targetLocales` em um bloco para traduzir os arquivos desse bloco para um **subconjunto menor** do que a UI (os locais de documentação efetivos são a **união** entre os blocos):

```json
{
  "targetLocales": "src/locales/ui-languages.json",
  "documentations": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "targetLocales": ["de", "fr", "es"]
    }
  ]
}
```

---

## Referência de configuração {#configuration-reference}

### `sourceLocale` {#sourcelocale}

Código BCP-47 para o idioma de origem (por exemplo, `"en-GB"`, `"en"`, `"pt-BR"`). Nenhum arquivo de tradução é gerado para esta localidade - a string chave em si é o texto de origem.

**Deve corresponder** `SOURCE_LOCALE` exportado do seu arquivo de configuração de i18n em tempo de execução (`src/i18n.ts` / `src/i18n.js`).

### `targetLocales` {#targetlocales}

Quais localidades traduzir. Aceita:

- **Caminho de string** para um manifesto `ui-languages.json` (`"src/locales/ui-languages.json"`). O arquivo é carregado e os códigos de localidade são extraídos.
- **Array de códigos BCP-47** (`["de", "fr", "es"]`).
- **Array de um elemento com um caminho** (`["src/locales/ui-languages.json"]`) - mesmo comportamento que a forma de string.

`targetLocales` é a lista de localidades primária para tradução da UI e a lista de localidades padrão para blocos de documentação. Se você preferir manter um array explícito aqui, mas ainda quiser rótulos e filtragem de localidades baseados em manifesto, defina também `uiLanguagesPath`.

### `uiLanguagesPath` (opcional) {#uilanguagespath-optional}

Caminho para um manifesto `ui-languages.json` usado para nomes de exibição, filtragem de localidades e pós-processamento da lista de idiomas.

Use isso quando:

- `targetLocales` é um array explícito, mas você ainda quer rótulos em inglês/nativos do manifesto.
- Você quer que `markdownOutput.postProcessing.languageListBlock` construa rótulos de localidades a partir do mesmo manifesto.
- Apenas a tradução da UI está ativada e você quer que o manifesto forneça a lista efetiva de localidades da UI.

### `concurrency` (opcional) {#concurrency-optional}

Máximo de **locales de destino** traduzidos ao mesmo tempo (`translate-ui`, `translate-docs`, `translate-svg` e as etapas correspondentes dentro de `sync`). Se omitido, a CLI usa **4** para tradução de UI e **3** para tradução de documentação (padrões internos). Substitua por execução com `-j` / `--concurrency`.

### `batchConcurrency` (opcional) {#batchconcurrency-optional}

**translate-docs** e **translate-svg** (e a etapa de documentação de `sync`): máximo de solicitações **batch** paralelas do OpenRouter por arquivo (cada batch pode conter muitos segmentos). Padrão **4** quando omitido. Ignorado por `translate-ui`. Substitua com `-b` / `--batch-concurrency`. No `sync`, `-b` se aplica apenas à etapa de tradução de documentação.

### `batchSize` / `maxBatchChars` (opcional) {#batchsize--maxbatchchars-optional}

Agrupamento de segmentos para tradução de documentos: quantos segmentos por solicitação de API e um teto de caracteres. Padrões: **20** segmentos, **4096** caracteres (quando omitido).

### `openrouter` {#openrouter}

| Campo               | Descrição                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------- |
| `baseUrl`           | URL base da API OpenRouter. Padrão: `https://openrouter.ai/api/v1`.                        |
| `translationModels` | Lista ordenada preferencial de IDs de modelo. O primeiro é tentado primeiro; entradas posteriores são alternativas em caso de erro. Para `translate-ui` apenas**, você também pode definir `ui.preferredModel` para tentar um modelo antes desta lista (veja `ui`). |
| `defaultModel`      | Modelo primário único legado. Usado apenas quando `translationModels` está indefinido ou vazio.       |
| `fallbackModel`     | Modelo de fallback único legado. Usado após `defaultModel` quando `translationModels` está indefinido ou vazio. |
| `maxTokens`         | Máximo de tokens de conclusão por solicitação. Padrão: `8192`.                                      |
| `temperature`       | Temperatura de amostragem. Padrão: `0.2`.                                                    |

Defina `OPENROUTER_API_KEY` em seu ambiente ou arquivo `.env`.

### `features` {#features}

| Campo                | Fluxo de Trabalho | Descrição                                                     |
| -------------------- | ------------------ | ------------------------------------------------------------ |
| `extractUIStrings`   | 1                  | Escanear a fonte para `t("…")` e escrever/mesclar `strings.json`.          |
| `translateUIStrings` | 1                  | Traduzir entradas de `strings.json` e escrever arquivos JSON por locale. |
| `translateMarkdown`  | 2                  | Traduzir arquivos `.md` / `.mdx`.                           |
| `translateJSON`      | 2                  | Traduzir arquivos de rótulo JSON do Docusaurus.            |

Não há sinalizador `features.translateSVG`. Traduza ativos SVG **independentes** com `translate-svg` e um bloco `svg` de nível superior na configuração. O comando `sync` executa essa etapa quando `svg` está presente (a menos que `--no-svg`).

### `ui` {#ui}

| Campo                       | Descrição                                                             |
| --------------------------- | ----------------------------------------------------------------------- |
| `sourceRoots`               | Diretórios (relativos ao cwd) escaneados para chamadas `t("…")`.               |
| `stringsJson`               | Caminho para o arquivo de catálogo mestre. Atualizado por `extract`.                  |
| `flatOutputDir`             | Diretório onde os arquivos JSON por localidade são escritos (`de.json`, etc.).    |
| `preferredModel`            | Opcional. ID do modelo OpenRouter testado primeiro para `translate-ui` apenas; depois `openrouter.translationModels` (ou modelos legados) em ordem, sem duplicar este ID. |
| `reactExtractor.funcNames`  | Nomes de funções adicionais a serem escaneados (padrão: `["t", "i18n.t"]`).         |
| `reactExtractor.extensions` | Extensões de arquivo a incluir (padrão: `[".js", ".jsx", ".ts", ".tsx"]`). |
| `reactExtractor.includePackageDescription` | Quando `true` (padrão), `extract` também inclui `package.json` `description` como uma string de UI quando presente. |
| `reactExtractor.packageJsonPath` | Caminho personalizado para o arquivo `package.json` usado para essa extração opcional de descrição. |

### `cacheDir` {#cachedir}

| Campo      | Descrição                                                               |
| ---------- | --------------------------------------------------------------------- |
| `cacheDir` | Diretório de cache SQLite (compartilhado por todos os blocos `documentations`). Reutilizar entre execuções. |

### `documentations` {#documentations}

Array de blocos de pipeline de documentação. `translate-docs` e a fase de docs do processo `sync` **cada** bloco em ordem.

| Campo                                       | Descrição                                                                                                                                                                                                                 |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `description`                                | Nota opcional legível por humanos para este bloco (não utilizada para tradução). Prefixada no cabeçalho `🌐` de `translate-docs` quando definida; também exibida nos cabeçalhos da seção `status`.                          |
| `contentPaths`                               | Fontes Markdown/MDX a serem traduzidas (`translate-docs` escaneia estas para `.md` / `.mdx`). Rótulos JSON vêm de `jsonSource` no mesmo bloco.                                                                                  |
| `outputDir`                                  | Diretório raiz para a saída traduzida deste bloco.                                                                                                                                                                      |
| `sourceFiles`                                | Alias opcional mesclado em `contentPaths` na carga.                                                                                                                                                                        |
| `targetLocales`                              | Subconjunto opcional de locais apenas para este bloco (caso contrário, locais de `targetLocales` raiz). Os locais de documentação efetivos são a união entre os blocos.                                                     |
| `jsonSource`                                 | Diretório de origem para arquivos de rótulo JSON do Docusaurus para este bloco (por exemplo, `"i18n/en"`).                                                                                                                                       |
| `markdownOutput.style`                       | `"nested"` (padrão), `"docusaurus"`, ou `"flat"`.                                                                                                                                                                        |
| `markdownOutput.docsRoot`                    | Raiz de documentos de origem para o layout do Docusaurus (por exemplo, `"docs"`).                                                                                                                                                                   |
| `markdownOutput.pathTemplate`                | Caminho de saída markdown personalizado. Placeholders: <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{LOCALE}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{basename}"}</code>, <code>{"{extension}"}</code>, <code>{"{docsRoot}"}</code>, <code>{"{relativeToDocsRoot}"}</code>. |
| `markdownOutput.jsonPathTemplate`            | Caminho de saída JSON personalizado para arquivos de rótulo. Suporta os mesmos placeholders que `pathTemplate`.                                                                                                                                |
| `markdownOutput.flatPreserveRelativeDir`     | Para o estilo `flat`, mantenha subdiretórios de origem para que arquivos com o mesmo nome base não colidam.                                                                                                                              |
| `markdownOutput.rewriteRelativeLinks` | Reescreva links relativos após a tradução (ativado automaticamente para o estilo `flat`).                                                                                                                                                 |
| `markdownOutput.linkRewriteDocsRoot` | Raiz do repositório usada ao calcular os prefixos de reescrita de links planos. Normalmente, deixe isso como `"."` a menos que seus documentos traduzidos estejam sob uma raiz de projeto diferente. |
| `markdownOutput.postProcessing` | Transformações opcionais no **corpo** markdown traduzido (o front matter YAML é preservado). Executa após a remontagem do segmento e reescrita de links planos, e antes de `injectTranslationMetadata`. |
| `markdownOutput.postProcessing.regexAdjustments` | Lista ordenada de `{ "description"?, "search", "replace" }`. `search` é um padrão regex (string simples usa a flag `g`, ou `/padrão/flags`). `replace` suporta placeholders como `${translatedLocale}`, `${sourceLocale}`, `${sourceFullPath}`, `${translatedFullPath}`, `${sourceFilename}`, `${translatedFilename}`, `${sourceBasedir}`, `${translatedBasedir}` (mesma ideia que os `additional-adjustments` de referência). |
| `markdownOutput.postProcessing.languageListBlock` | `{ "start", "end", "separator" }` — o tradutor encontra a primeira linha contendo `start` e a linha correspondente `end`, então substitui esse trecho por um seletor de idiomas canônico. Links são construídos com caminhos relativos ao arquivo traduzido; rótulos vêm de `uiLanguagesPath` / `ui-languages.json` quando configurados, caso contrário, de `localeDisplayNames` e códigos de localidade. |
| `injectTranslationMetadata`                  | Quando `true` (padrão quando omitido), arquivos markdown traduzidos incluem chaves YAML: `translation_last_updated`, `source_file_mtime`, `source_file_hash`, `translation_language`, `source_file_path`. Defina como `false` para pular. |

Exemplo (pipeline README plano — caminhos de captura de tela + wrapper de lista de idiomas opcional):

```json
"markdownOutput": {
  "style": "flat",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders",
        "search": "images/screenshots/[^/]+/",
        "replace": "images/screenshots/${translatedLocale}/"
      }
    ],
    "languageListBlock": {
      "start": "<small id=\"lang-list\">",
      "end": "</small>",
      "separator": " · "
    }
  }
}
```

### `svg` (opcional) {#svg-optional}

Configuração de nível superior para ativos SVG autônomos traduzidos por `translate-svg` e a etapa SVG de `sync`.

| Campo                       | Descrição |
| --------------------------- | ----------- |
| `sourcePath`                | Um diretório ou um array de diretórios escaneados recursivamente em busca de arquivos `.svg`. |
| `outputDir`                 | Diretório raiz para a saída SVG traduzida. |
| `style`                     | `"flat"` ou `"nested"` quando `pathTemplate` não está definido. |
| `pathTemplate`              | Caminho de saída SVG personalizado. Placeholders: <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{LOCALE}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{basename}"}</code>, <code>{"{extension}"}</code>, <code>{"{relativeToSourceRoot}"}</code>. |
| `svgExtractor.forceLowercase` | Texto traduzido em letras minúsculas na remontagem do SVG. Útil para designs que dependem de rótulos totalmente em minúsculas. |

### `glossary` {#glossary}

| Campo          | Descrição                                                                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `uiGlossary`   | Caminho para `strings.json` - cria automaticamente um glossário a partir das traduções existentes.                                                                                                                 |
| `userGlossary` | Caminho para um CSV com colunas `Original language string` (ou `en`), `locale`, `Translation` - uma linha por termo fonte e localidade alvo (`locale` pode ser `*` para todos os alvos). |

A chave legada `uiGlossaryFromStringsJson` ainda é aceita e mapeada para `uiGlossary` ao carregar a configuração.

Gere um CSV de glossário vazio:

```bash
npx ai-i18n-tools glossary-generate
```

---

## Referência CLI {#cli-reference}

| Comando                                                                  | Descrição                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `init [-t ui-markdown|ui-docusaurus] [-o path] [--with-translate-ignore]` | Escreve um arquivo de configuração inicial (inclui `concurrency`, `batchConcurrency`, `batchSize`, `maxBatchChars` e `documentations[].injectTranslationMetadata`). `--with-translate-ignore` cria um `.translate-ignore` inicial.                                                                            |
| `extract`                                                                 | Escaneia a fonte em busca de chamadas `t("…")` e atualiza `strings.json`. Requer `features.extractUIStrings`.                                                                                                                                                                                                    |
| `translate-docs …`                                                        | Traduz markdown/MDX e JSON para cada bloco `documentations` (`contentPaths`, `jsonSource` opcional). `-j`: max locais paralelos; `-b`: max chamadas de API em lote paralelas por arquivo. `--prompt-format`: formato de lote (`xml` \| `json-array` \| `json-object`). Veja [Comportamento de cache e flags `translate-docs`](#cache-behaviour-and-translate-docs-flags) e [Formato de prompt em lote](#batch-prompt-format). |
| `translate-svg …`                                                         | Traduz ativos SVG independentes configurados em `config.svg` (separados dos docs). Mesmas ideias de cache que os docs; suporta `--no-cache` para pular leituras/escritas SQLite para aquela execução. `-j`, `-b`, `--force`, `--force-update`, `-p` / `--path`, `--dry-run`.                                                    |
| `translate-ui [--locale <code>] [--force] [--dry-run] [-j <n>]`           | Traduz apenas strings da interface do usuário. `--force`: retraduz todas as entradas por localidade (ignora traduções existentes). `--dry-run`: sem gravações, sem chamadas de API. `-j`: max locais paralelos. Requer `features.translateUIStrings`.                                                                                 |
| `sync …`                                                                  | Extrai (se habilitado), então tradução da UI, depois `translate-svg` quando `config.svg` existe, e então tradução da documentação - a menos que pulado com `--no-ui`, `--no-svg` ou `--no-docs`. Flags compartilhadas: `-l`, `-p`, `--dry-run`, `-j`, `-b` (apenas para agrupamento de docs), `--force` / `--force-update` (apenas para docs; mutuamente exclusivos quando docs são executados).                         |
| `status`                                                                  | Mostra o status da tradução em markdown por arquivo × localidade (sem filtro `--locale`; as localidades vêm da configuração).                                                                                                                                                                                               |
| `cleanup [--dry-run] [--no-backup] [--backup <path>]`                  | Executa `sync --force-update` primeiro (extração, UI, SVG, docs), depois remove linhas de segmento obsoletas (null `last_hit_at` / caminho de arquivo vazio); descarta linhas de `file_tracking` cujo caminho de origem resolvido está faltando no disco; remove linhas de tradução cuja metadata `filepath` aponta para um arquivo ausente. Registra três contagens (obsoletas, `file_tracking` órfãs, traduções órfãs). Cria um backup SQLite com timestamp no diretório de cache, a menos que `--no-backup`. |
| `editor [-p <port>] [--no-open]`                                          | Lança um editor web local para o cache, `strings.json` e CSV do glossário. `--no-open`: não abre automaticamente o navegador padrão.<br><br>**Nota:** Se você editar uma entrada no editor de cache, deve executar um `sync --force-update` para reescrever os arquivos de saída com a entrada de cache atualizada. Além disso, se o texto fonte mudar depois, a edição manual será perdida, pois uma nova chave de cache é gerada. |
| `glossary-generate [-o <path>]`                                           | Escreve um template vazio `glossary-user.csv`. `-o`: substitui o caminho de saída (padrão: `glossary.userGlossary` da configuração, ou `glossary-user.csv`).                                                                                                                                                |

Todos os comandos aceitam `-c <path>` para especificar um arquivo de configuração não padrão, `-v` para saída detalhada, e `-w` / `--write-logs [path]` para redirecionar a saída do console para um arquivo de log (caminho padrão: sob o diretório raiz `cacheDir`).

---

## Variáveis de ambiente {#environment-variables}

| Variável               | Descrição                                                |
| ---------------------- | ---------------------------------------------------------- |
| `OPENROUTER_API_KEY`   | **Obrigatório.** Sua chave de API do OpenRouter.          |
| `OPENROUTER_BASE_URL`  | Substituir a URL base da API.                             |
| `I18N_SOURCE_LOCALE`   | Substituir `sourceLocale` em tempo de execução.          |
| `I18N_TARGET_LOCALES`  | Códigos de localidade separados por vírgula para substituir `targetLocales`.  |
| `I18N_LOG_LEVEL`       | Nível do logger (`debug`, `info`, `warn`, `error`, `silent`). |
| `NO_COLOR`             | Quando `1`, desabilita cores ANSI na saída do log.      |
| `I18N_LOG_SESSION_MAX` | Máximo de linhas mantidas por sessão de log (padrão `5000`). |
