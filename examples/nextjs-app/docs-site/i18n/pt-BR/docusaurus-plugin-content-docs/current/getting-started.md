---
translation_last_updated: '2026-04-11T03:31:26.575Z'
source_file_mtime: '2026-04-11T03:30:13.293Z'
source_file_hash: d90b2b1044bb86a41adcd98b63e7d0fcccc9d3735de82bcee90754647f0d1b15
translation_language: pt-BR
source_file_path: docs-site/docs/getting-started.md
---
# ai-i18n-tools: Primeiros Passos

`ai-i18n-tools` fornece dois fluxos de trabalho independentes e compostos:

- **Fluxo de trabalho 1 - Tradução de interface**: extrai chamadas `t("…")` de qualquer fonte JS/TS, traduz através do OpenRouter e gera arquivos JSON planos por localidade, prontos para o i18next.
- **Fluxo de trabalho 2 - Tradução de documentos**: traduz arquivos markdown (MDX) e arquivos JSON de rótulos do Docusaurus para qualquer número de localidades, com cache inteligente. Ativos **SVG** usam um comando separado (`translate-svg`) e configuração `svg` opcional (veja [referência CLI](#cli-reference)).

Ambos os fluxos de trabalho utilizam o OpenRouter (qualquer LLM compatível) e compartilham um único arquivo de configuração.

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Sumário

- [Instalação](#installation)
- [Primeiros passos](#quick-start)
- [Fluxo de trabalho 1 - Tradução de interface](#workflow-1---ui-translation)
  - [Etapa 1: Inicializar](#step-1-initialize)
  - [Etapa 2: Extrair strings](#step-2-extract-strings)
  - [Etapa 3: Traduzir strings da interface](#step-3-translate-ui-strings)
  - [Etapa 4: Integrar i18next em tempo de execução](#step-4-wire-i18next-at-runtime)
  - [Usando `t()` no código-fonte](#using-t-in-source-code)
  - [Interpolação](#interpolation)
  - [Interface de troca de idioma](#language-switcher-ui)
  - [Idiomas RTL](#rtl-languages)
- [Fluxo de trabalho 2 - Tradução de documentos](#workflow-2---document-translation)
  - [Etapa 1: Inicializar](#step-1-initialize-1)
  - [Etapa 2: Traduzir documentos](#step-2-translate-documents)
    - [Comportamento do cache e flags do `translate-docs`](#cache-behaviour-and-translate-docs-flags)
  - [Layouts de saída](#output-layouts)
- [Fluxo de trabalho combinado (UI + Docs)](#combined-workflow-ui--docs)
- [Referência de configuração](#configuration-reference)
  - [`sourceLocale`](#sourcelocale)
  - [`targetLocales`](#targetlocales)
  - [`concurrency` (opcional)](#concurrency-optional)
  - [`batchConcurrency` (opcional)](#batchconcurrency-optional)
  - [`batchSize` / `maxBatchChars` (opcional)](#batchsize--maxbatchchars-optional)
  - [`openrouter`](#openrouter)
  - [`features`](#features)
  - [`ui`](#ui)
  - [`documentation`](#documentation)
  - [`glossary`](#glossary)
- [Referência CLI](#cli-reference)
- [Variáveis de ambiente](#environment-variables)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Instalação {#installation}

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

O modelo `init` padrão (`ui-markdown`) habilita apenas a extração/tradução de **interface**. O modelo `ui-docusaurus` habilita a tradução de **documentos** (`translate-docs`). Use `sync` quando desejar extrair + UI + documentos (e SVG autônomo opcional quando `svg` estiver configurado) em uma única chamada.

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

## Fluxo de trabalho 1 - Tradução de interface {#workflow-1---ui-translation}

Projetado para qualquer projeto JS/TS que use i18next: aplicações React, Next.js (componentes cliente e servidor), serviços Node.js, ferramentas CLI.

### Etapa 1: Inicializar {#step-1-initialize}

```bash
npx ai-i18n-tools init
```

Isso gera o arquivo `ai-i18n-tools.config.json` com o modelo `ui-markdown`. Edite-o para definir:

- `sourceLocale` - código BCP-47 do seu idioma de origem (ex: `"en-GB"`). **Deve corresponder** ao `SOURCE_LOCALE` exportado do seu arquivo de configuração de i18n em tempo de execução (`src/i18n.ts` / `src/i18n.js`).
- `targetLocales` - caminho para seu manifesto `ui-languages.json` OU um array de códigos BCP-47.
- `ui.sourceRoots` - diretórios a serem verificados em busca de chamadas `t("…")` (ex: `["src/"]`).
- `ui.stringsJson` - onde gravar o catálogo principal (ex: `"src/locales/strings.json"`).
- `ui.flatOutputDir` - onde gravar `de.json`, `pt-BR.json`, etc. (ex: `"src/locales/"`).

### Etapa 2: Extrair strings {#step-2-extract-strings}

```bash
npx ai-i18n-tools extract
```

Verifica todos os arquivos JS/TS em `ui.sourceRoots` em busca de chamadas `t("literal")` e `i18n.t("literal")`. Grava (ou mescla em) `ui.stringsJson`.

O scanner é configurável: adicione nomes de funções personalizadas via `ui.reactExtractor.funcNames`.

### Etapa 3: Traduzir strings da interface {#step-3-translate-ui-strings}

```bash
npx ai-i18n-tools translate-ui
```

Lê o `strings.json`, envia lotes ao OpenRouter para cada localidade de destino e grava arquivos JSON planos (`de.json`, `fr.json`, etc.) no diretório `ui.flatOutputDir`.

### Etapa 4: Integrar o i18next em tempo de execução {#step-4-wire-i18next-at-runtime}

Crie seu arquivo de configuração i18n usando os auxiliares exportados por `'ai-i18n-tools/runtime'`:

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

Importe o `i18n.js` antes do React renderizar (por exemplo, no início do seu ponto de entrada). Quando o usuário alterar o idioma, chame `await loadLocale(code)` e, em seguida, `i18n.changeLanguage(code)`.

`SOURCE_LOCALE` é exportado para que qualquer outro arquivo que precise dele (por exemplo, um seletor de idioma) possa importá-lo diretamente de `'./i18n'`.

**`defaultI18nInitOptions(sourceLocale)`** retorna as opções padrão para configurações com chave como valor padrão:

- `parseMissingKeyHandler` retorna a própria chave, fazendo com que strings não traduzidas exibam o texto original.
- `nsSeparator: false` permite chaves que contenham dois-pontos.
- `interpolation.escapeValue: false` - seguro desativar: o React escapa os valores por si só, e a saída do Node.js/CLI não possui HTML que precise ser escapado.

**`wrapI18nWithKeyTrim(i18n)`** envolve `i18n.t` para que: (1) as chaves sejam cortadas antes da consulta, correspondendo à forma como o script de extração as armazena; (2) a interpolação <code>{"{{var}}"}</code> seja aplicada quando o idioma de origem retornar a chave bruta - assim <code>{"t('Hello {{name}}', { name })"}</code> funciona corretamente mesmo no idioma de origem.

**`makeLoadLocale(i18n, loaders, sourceLocale)`** retorna uma função assíncrona `loadLocale(lang)` que importa dinamicamente o pacote JSON de um idioma e o registra no i18next.

### Usando `t()` no código-fonte {#using-t-in-source-code}

Chame `t()` com uma **string literal** para que o script de extração possa encontrá-la:

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <button>{t('Save')}</button>;
}
```

O mesmo padrão funciona fora do React (Node.js, componentes do servidor, CLI):

```js
import i18n from './i18n.js';
console.log(i18n.t('Processing complete'));
```

**Regras:**

- Apenas essas formas são extraídas: `t("…")`, `t('…')`, `t(`…`)`, `i18n.t("…")`.
- A chave deve ser uma **string literal** - nada de variáveis ou expressões como chave.
- Não use literais de modelo para a chave: <code>{'t(`Hello ${name}`)'}</code> não é extraível.

### Interpolação {#interpolation}

Use a interpolação nativa do i18next com o segundo argumento para os espaços reservados <code>{"{{var}}"}</code>:

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

O script de extração ignora o segundo argumento - apenas a string literal <code>{"\"Hello {{name}}, you have {{count}} messages\""}</code> é extraída e enviada para tradução. Os tradutores são instruídos a preservar os tokens <code>{"{{...}}"}</code>.

### Interface do seletor de idioma {#language-switcher-ui}

Use o manifesto `ui-languages.json` para criar um seletor de idiomas. O `ai-i18n-tools` exporta dois auxiliares de exibição:

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

**`getUILanguageLabel(lang, t)`** - exibe `t(englishName)` quando traduzido, ou `englishName / t(englishName)` quando ambos diferem. Adequado para telas de configurações.

**`getUILanguageLabelNative(lang)`** - exibe `englishName / label` (sem chamada `t()` em cada linha). Adequado para menus de cabeçalho onde se deseja que o nome nativo seja visível.

O manifesto `ui-languages.json` é um array JSON de entradas <code>{"{ code, label, englishName }"}</code>. Exemplo:

```json
[
  { "code": "en-GB", "label": "English (UK)", "englishName": "English (UK)" },
  { "code": "pt-BR", "label": "Português (BR)", "englishName": "Portuguese (BR)" },
  { "code": "de",    "label": "Deutsch",        "englishName": "German" },
  { "code": "fr",    "label": "Français",       "englishName": "French" },
  { "code": "ar",    "label": "العربية",         "englishName": "Arabic" }
]
```

Defina `targetLocales` na configuração como o caminho desse arquivo para que o comando de tradução use a mesma lista.

### Idiomas RTL {#rtl-languages}

`ai-i18n-tools` exporta `getTextDirection(lng)` e `applyDirection(lng)`:

```js
import { getTextDirection, applyDirection } from 'ai-i18n-tools/runtime';

getTextDirection('ar')    // 'rtl'
getTextDirection('en-GB') // 'ltr'

// Applied automatically via i18n.on('languageChanged', applyDirection) - see Step 4
```

`applyDirection` define `document.documentElement.dir` (navegador) ou não faz nada (Node.js). Passe um argumento opcional `element` para direcionar a um elemento específico.

Para strings que podem conter setas `→`, inverta-as para layouts RTL:

```js
import { flipUiArrowsForRtl } from 'ai-i18n-tools/runtime';
const { i18n } = useTranslation();
const isRtl = getTextDirection(i18n.language) === 'rtl';
const label = flipUiArrowsForRtl(t('Next → Step'), isRtl);
```

---

## Fluxo de trabalho 2 - Tradução de Documentos {#workflow-2---document-translation}

Projetado para documentação em markdown, sites Docusaurus e arquivos JSON de rótulos. Diagramas SVG são traduzidos via [`translate-svg`](#cli-reference) e `svg` na configuração, não por meio de `documentation.contentPaths`.

### Etapa 1: Inicializar {#step-1-initialize-1}

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

Edite o arquivo gerado `ai-i18n-tools.config.json`:

- `sourceLocale` - idioma de origem (deve corresponder a `defaultLocale` em `docusaurus.config.js`).
- `targetLocales` - array de códigos de localidade ou caminho para um manifesto.
- `documentation.contentPaths` - diretórios ou arquivos fonte em markdown/MDX (veja também `documentation.jsonSource` para rótulos JSON).
- `documentation.outputDir` - diretório raiz de saída traduzida.
- `documentation.markdownOutput.style` - `"nested"` (padrão), `"docusaurus"` ou `"flat"` (veja [Layouts de saída](#output-layouts)).

### Etapa 2: Traduzir documentos {#step-2-translate-documents}

```bash
npx ai-i18n-tools translate-docs
```

Isso traduz todos os arquivos em `documentation.contentPaths` para todas as `targetLocales` (ou `documentation.targetLocales` quando definido). Segmentos já traduzidos são recuperados do cache SQLite - apenas segmentos novos ou alterados são enviados ao LLM.

Para traduzir um único idioma:

```bash
npx ai-i18n-tools translate-docs --locale de
```

Para verificar o que precisa ser traduzido:

```bash
npx ai-i18n-tools status
```

#### Comportamento do cache e flags do `translate-docs` {#cache-behaviour-and-translate-docs-flags}

A CLI mantém **rastreamento de arquivos** no SQLite (hash de origem por arquivo × localidade) e linhas de **segmentos** (hash × localidade por bloco traduzível). Uma execução normal ignora completamente um arquivo quando o hash rastreado corresponde à fonte atual **e** o arquivo de saída já existe; caso contrário, processa o arquivo e usa o cache de segmentos, de modo que texto inalterado não chama a API.

| Flag                     | Efeito                                                                                                                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| *(padrão)*               | Ignora arquivos inalterados quando o rastreamento + saída em disco coincidem; usa o cache de segmentos para o restante.                                                                                   |
| `--force-update`         | Re-processa todos os arquivos correspondentes (extrai, remonta, escreve saídas) mesmo quando o rastreamento de arquivo pularia. **O cache de segmentos ainda se aplica** - segmentos inalterados não são enviados ao LLM. |
| `--force`                | Limpa o rastreamento de arquivos para cada arquivo processado e **não lê** o cache de segmentos para tradução via API (re-tradução completa). Os novos resultados ainda são **gravados** no cache de segmentos. |
| `--stats`                | Exibe contagens de segmentos, contagens de arquivos rastreados e totais de segmentos por localidade, depois sai.                                                                                         |
| `--clear-cache [locale]` | Exclui traduções em cache (e rastreamento de arquivos): todas as localidades ou uma única localidade, depois sai.                                                                                        |

Não é possível combinar `--force` com `--force-update` (eles são mutuamente exclusivos).

### Layouts de saída {#output-layouts}

`**"nested"`** (padrão quando omitido) - espelha a árvore de origem em `{outputDir}/{locale}/` (por exemplo, `docs/guide.md` → `i18n/de/docs/guide.md`).

`**"docusaurus"`** - coloca os arquivos que estão sob `docsRoot` em `i18n/<locale>/docusaurus-plugin-content-docs/current/<relativeToDocsRoot>`, compatível com o layout usual de i18n do Docusaurus. Defina `documentation.markdownOutput.docsRoot` como a raiz do seu conteúdo de documentação (por exemplo, `"docs"`).

```
docs/guide.md         → i18n/de/docusaurus-plugin-content-docs/current/guide.md
i18n/en/sidebar.json  → i18n/de/sidebar.json  (JSON label files)
```

**`"flat"`** - coloca os arquivos traduzidos ao lado dos originais com sufixo de idioma, ou em um subdiretório. Links relativos entre páginas são reescritos automaticamente.

```
docs/guide.md → i18n/guide.de.md
```

Você pode substituir os caminhos completamente com `documentation.markdownOutput.pathTemplate`. Marcadores de posição: <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{extension}"}</code>, <code>{"{docsRoot}"}</code>, <code>{"{relativeToDocsRoot}"}</code>.

---

## Fluxo de trabalho combinado (UI + Docs) {#combined-workflow-ui--docs}

Habilite todos os recursos em uma única configuração para executar ambos os fluxos de trabalho juntos:

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
  "documentation": {
    "contentPaths": ["docs/"],
    "outputDir": "i18n/",
    "cacheDir": ".translation-cache",
    "markdownOutput": { "style": "flat" }
  }
}
```

`glossary.uiGlossary` direciona a tradução do documento para o mesmo catálogo `strings.json` usado pela interface, garantindo consistência terminológica; `glossary.userGlossary` adiciona substituições em CSV para termos do produto.

Execute `npx ai-i18n-tools sync` para rodar um único pipeline: **extrair** strings da interface (se `features.extractUIStrings` estiver habilitado), **traduzir** strings da interface (se `features.translateUIStrings` estiver habilitado), **traduzir ativos SVG autônomos** (se houver um bloco `svg` na configuração) e, em seguida, **traduzir a documentação** (markdown/JSON em `documentation`). Pule partes com `--no-ui`, `--no-svg` ou `--no-docs`. A etapa de docs aceita `--dry-run`, `-p` / `--path`, `--force` e `--force-update` (os dois últimos só se aplicam quando a tradução da documentação é executada; são ignorados se você usar `--no-docs`).

Use `documentation.targetLocales` para traduzir a documentação para um **subconjunto menor** do que a interface:

```json
{
  "targetLocales": "src/locales/ui-languages.json",
  "documentation": {
    "targetLocales": ["de", "fr", "es"]
  }
}
```

---

## Referência de configuração {#configuration-reference}

### `sourceLocale` {#sourcelocale}

Código BCP-47 para o idioma de origem (por exemplo, `"en-GB"`, `"en"`, `"pt-BR"`). Nenhum arquivo de tradução é gerado para este idioma — a própria string-chave é o texto original.

**Deve corresponder** ao `SOURCE_LOCALE` exportado do seu arquivo de configuração de i18n em tempo de execução (`src/i18n.ts` / `src/i18n.js`).

### `targetLocales` {#targetlocales}

Para quais idiomas traduzir. Aceita:

- **Caminho como string** para um manifesto `ui-languages.json` (`"src/locales/ui-languages.json"`). O arquivo é carregado e os códigos de localidade são extraídos.
- **Array de códigos BCP-47** (`["de", "fr", "es"]`).
- **Array com um único elemento contendo um caminho** (`["src/locales/ui-languages.json"]`) - comportamento idêntico à forma string.

### `concurrency` (opcional) {#concurrency-optional}

Número máximo de **idiomas de destino** traduzidos simultaneamente (`translate-ui`, `translate-docs`, `translate-svg` e as etapas correspondentes dentro de `sync`). Se omitido, a CLI usa **4** para tradução da interface e **3** para tradução da documentação (padrões embutidos). Pode ser substituído em cada execução com `-j` / `--concurrency`.

### `batchConcurrency` (opcional) {#batchconcurrency-optional}

**translate-docs** e **translate-svg** (e a etapa de documentação do `sync`): número máximo de requisições paralelas em lote (batch) do OpenRouter por arquivo (cada lote pode conter muitos segmentos). Padrão **4** quando omitido. Ignorado pelo `translate-ui`. Substitua com `-b` / `--batch-concurrency`. No `sync`, `-b` se aplica somente à etapa de tradução da documentação.

### `batchSize` / `maxBatchChars` (opcional) {#batchsize--maxbatchchars-optional}

Agrupamento de segmentos para tradução de documentos: quantos segmentos por requisição à API e um limite máximo de caracteres. Padrões: **20** segmentos, **4096** caracteres (quando omitidos).

### `openrouter` {#openrouter}

| Campo               | Descrição                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------- |
| `baseUrl`           | URL base da API OpenRouter. Padrão: `https://openrouter.ai/api/v1`.                        |
| `translationModels` | Lista ordenada de IDs de modelos. O primeiro é tentado primeiro; os subsequentes são usados como alternativas em caso de erro. |
| `maxTokens`         | Número máximo de tokens de conclusão por requisição. Padrão: `8192`.                                      |
| `temperature`       | Temperatura de amostragem. Padrão: `0.2`.                                                    |

Defina `OPENROUTER_API_KEY` no seu ambiente ou no arquivo `.env`.

### `features` {#features}

| Campo                | Fluxo de trabalho | Descrição                                                       |
| -------------------- | --------------- | ----------------------------------------------------------------- |
| `extractUIStrings`   | 1               | Analisa a origem em busca de `t("…")` e escreve/funde `strings.json`.          |
| `translateUIStrings` | 1               | Traduz as entradas de `strings.json` e gera arquivos JSON por localidade. |
| `translateMarkdown`  | 2               | Traduz arquivos `.md` / `.mdx`.                                   |
| `translateJSON`      | 2               | Traduz arquivos JSON de rótulos do Docusaurus.                            |

Não existe a flag `features.translateSVG`. Traduza ativos SVG **autônomos** com `translate-svg` e um bloco `svg` de nível superior na configuração. O comando `sync` executa essa etapa quando `svg` está presente (a menos que `--no-svg`).

### `ui` {#ui}

| Campo                       | Descrição                                                             |
| --------------------------- | ----------------------------------------------------------------------- |
| `sourceRoots`               | Diretórios (relativos ao diretório atual) escaneados em busca de chamadas `t("…")`.               |
| `stringsJson`               | Caminho para o arquivo de catálogo principal. Atualizado pelo comando `extract`.                  |
| `flatOutputDir`             | Diretório onde os arquivos JSON por idioma são gerados (`de.json`, etc.).    |
| `reactExtractor.funcNames`  | Nomes adicionais de funções para escanear (padrão: `["t", "i18n.t"]`).         |
| `reactExtractor.extensions` | Extensões de arquivos a incluir (padrão: `[".js", ".jsx", ".ts", ".tsx"]`). |

### `documentation` {#documentation}

| Campo                                        | Descrição                                                                                                                                                                                                               |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `contentPaths`                               | Fontes Markdown/MDX para traduzir (`translate-docs` verifica esses diretórios por arquivos `.md` / `.mdx`). Os rótulos JSON vêm de `jsonSource`.                                                                        |
| `outputDir`                                  | Diretório raiz para a saída traduzida.                                                                                                                                                                                    |
| `cacheDir`                                   | Diretório de cache SQLite. Reutilize entre execuções para tradução incremental.                                                                                                                                           |
| `targetLocales`                              | Subconjunto opcional de idiomas apenas para documentos (substitui o `targetLocales` raiz).                                                                                                                                |
| `jsonSource`                                 | Diretório de origem para arquivos JSON de rótulos do Docusaurus (por exemplo, `"i18n/en"`).                                                                                                                                    |
| `markdownOutput.style`                       | `"nested"` (padrão), `"docusaurus"` ou `"flat"`.                                                                                                                                                                          |
| `markdownOutput.docsRoot`                    | Diretório raiz de documentos de origem para o layout do Docusaurus (por exemplo, `"docs"`).                                                                                                                                     |
| `markdownOutput.pathTemplate`                | Caminho de saída personalizado. Substituições: <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{extension}"}</code>.                                                                                                                        |
| `markdownOutput.rewriteRelativeLinks` | Reescreve links relativos após a tradução (ativado automaticamente no estilo `flat`).                                                                                                                                     |
| `injectTranslationMetadata`                  | Quando `true` (padrão se omitido), arquivos Markdown traduzidos incluem chaves YAML: `translation_last_updated`, `source_file_mtime`, `source_file_hash`, `translation_language`, `source_file_path`. Defina como `false` para pular. |

### `glossary` {#glossary}

| Campo          | Descrição                                                                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `uiGlossary`   | Caminho para `strings.json` - cria automaticamente um glossário a partir das traduções existentes.                                                                                                                 |
| `userGlossary` | Caminho para um CSV com colunas **`Original language string`** (ou `**en**`), `**locale**`, `**Translation`** - uma linha por termo original e idioma de destino (`locale` pode ser `*` para todos os destinos). |

A chave legada `uiGlossaryFromStringsJson` ainda é aceita e mapeada para `uiGlossary` ao carregar a configuração.

Gerar um CSV de glossário vazio:

```bash
npx ai-i18n-tools glossary-generate
```

---

## Referência da CLI {#cli-reference}

| Comando                                                                   | Descrição                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `init [-t ui-markdown|ui-docusaurus] [-o path] [--with-translate-ignore]` | Grava um arquivo de configuração inicial (inclui `concurrency`, `batchConcurrency`, `batchSize`, `maxBatchChars` e `documentation.injectTranslationMetadata`). `--with-translate-ignore` cria um arquivo `.translate-ignore` inicial.                                                                            |
| `extract`                                                                 | Analisa o código-fonte em busca de chamadas `t("…")` e atualiza o `strings.json`. Requer `features.extractUIStrings`.                                                                                                                                                                                                    |
| `translate-docs …`                                                        | Traduz arquivos markdown/MDX em `documentation.contentPaths` e arquivos JSON em `documentation.jsonSource`, quando habilitado. `-j`: número máximo de localidades em paralelo; `-b`: número máximo de chamadas paralelas à API por arquivo. Veja [Comportamento do cache e flags do `translate-docs`](#cache-behaviour-and-translate-docs-flags) para `--force`, `--force-update`, `--stats`, `--clear-cache`. |
| `translate-svg …`                                                         | Traduz ativos SVG autônomos configurados em `config.svg` (separados da documentação). Mesma lógica de cache dos documentos; suporta `--no-cache` para pular leituras/escritas no SQLite nesta execução. `-j`, `-b`, `--force`, `--force-update`, `-p` / `--path`, `--dry-run`.                                                    |
| `translate-ui [--locale <code>] [-j <n>]`                                 | Traduz apenas as strings da interface. `-j`: número máximo de localidades em paralelo. Requer `features.translateUIStrings`.                                                                                                                                                                                                     |
| `sync …`                                                                  | Extrai (se habilitado), depois traduz a interface, depois executa `translate-svg` quando `config.svg` existe e, por fim, traduz a documentação — a menos que pulado com `--no-ui`, `--no-svg` ou `--no-docs`. Flags compartilhadas: `-l`, `-p`, `--dry-run`, `-j`, `-b` (apenas agrupamento de documentos), `--force` / `--force-update` (apenas documentos; mutuamente exclusivos quando documentos são processados).                         |
| `status`                                                                  | Mostra o status de tradução dos arquivos markdown por arquivo × localidade (sem filtro `--locale`; as localidades vêm da configuração).                                                                                                                                                                                               |
| `cleanup [--dry-run] [--no-backup] [--backup <path>] [-y]`                  | Remove linhas obsoletas (com `last_hit_at` nulo / caminho de arquivo vazio) e linhas órfãs (arquivos ausentes). Antes de modificar o banco de dados, exibe um aviso (a menos que `--dry-run` ou `--yes`): execute `translate-docs --force-update` primeiro para garantir que o rastreamento e os acertos no cache estejam atualizados. Cria um backup do SQLite com carimbo de data na pasta de cache, a menos que `--no-backup`. Use `--yes` quando a entrada padrão não for um TTY. |
| `editor [-p <port>]`                                                      | Inicia um editor web local para o cache, `strings.json` e o CSV de glossário.                                                                                                                                                                                                                         |
| `glossary-generate`                                                       | Grava um modelo vazio de `glossary-user.csv`.                                                                                                                                                                                                                                                       |

Todos os comandos aceitam `-c <path>` para especificar um arquivo de configuração não padrão, `-v` para saída detalhada e `-w` / `--write-logs [path]` para redirecionar a saída do console para um arquivo de log (caminho padrão: dentro de `documentation.cacheDir`).

---

## Variáveis de ambiente {#environment-variables}

| Variável               | Descrição                                                |
| ---------------------- | ---------------------------------------------------------- |
| `OPENROUTER_API_KEY`   | **Obrigatório.** Sua chave de API do OpenRouter.           |
| `OPENROUTER_BASE_URL`  | Substitui a URL base da API.                               |
| `I18N_SOURCE_LOCALE`   | Substitui `sourceLocale` em tempo de execução.             |
| `I18N_TARGET_LOCALES`  | Códigos de localidade separados por vírgula para substituir `targetLocales`. |
| `I18N_LOG_LEVEL`       | Nível do logger (`debug`, `info`, `warn`, `error`, `silent`). |
| `NO_COLOR`             | Quando `1`, desativa as cores ANSI na saída de log.       |
| `I18N_LOG_SESSION_MAX` | Número máximo de linhas mantidas por sessão de log (padrão `5000`). |
