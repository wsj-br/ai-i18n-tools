# ai-i18n-tools: Primeiros Passos

`ai-i18n-tools` fornece dois fluxos de trabalho independentes e compostos:

- **Fluxo de trabalho 1 - Tradução de interface**: extrai chamadas `t("…")` de qualquer fonte JS/TS, traduz via OpenRouter e gera arquivos JSON planos por localidade, prontos para o i18next.
- **Fluxo de trabalho 2 - Tradução de documentos**: traduz arquivos markdown (MDX) e arquivos JSON de rótulos do Docusaurus para qualquer número de localidades, com cache inteligente. Ativos **SVG** usam `features.translateSVG`, o bloco `svg` de nível superior e `translate-svg` (veja [referência CLI](#cli-reference)).

Ambos os fluxos de trabalho usam o OpenRouter (qualquer LLM compatível) e compartilham um único arquivo de configuração.

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
## Sumário

- [Instalação](#installation)
- [Início Rápido](#quick-start)
- [Fluxo de trabalho 1 - Tradução de interface](#workflow-1---ui-translation)
  - [Etapa 1: Inicializar](#step-1-initialise)
  - [Etapa 2: Extrair strings](#step-2-extract-strings)
  - [Etapa 3: Traduzir strings da interface](#step-3-translate-ui-strings)
  - [Exportar para XLIFF 2.0 (opcional)](#exporting-to-xliff-20-optional)
  - [Etapa 4: Integrar i18next em tempo de execução](#step-4-wire-i18next-at-runtime)
  - [Usando `t()` no código-fonte](#using-t-in-source-code)
  - [Interpolação](#interpolation)
  - [Interface de troca de idioma](#language-switcher-ui)
  - [Idiomas RTL](#rtl-languages)
- [Fluxo de trabalho 2 - Tradução de documentos](#workflow-2---document-translation)
  - [Etapa 1: Inicializar para documentação](#step-1-initialise-for-documentation)
  - [Etapa 2: Traduzir documentos](#step-2-translate-documents)
    - [Comportamento do cache e flags `translate-docs`](#cache-behaviour-and-translate-docs-flags)
  - [Layouts de saída](#output-layouts)
- [Fluxo combinado (UI + Docs)](#combined-workflow-ui--docs)
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

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Instalação

O pacote publicado é **somente ESM**. Use `import`/`import()` no Node.js ou no seu empacotador; não use `require('ai-i18n-tools')` **.**

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

ai-i18n-tools inclui seu próprio extrator de strings. Se você anteriormente usava `i18next-scanner`, `babel-plugin-i18next-extract` ou similares, pode remover essas dependências de desenvolvimento após migrar.

Defina sua chave de API do OpenRouter:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Ou crie um arquivo `.env` na raiz do projeto:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

## Início Rápido

O modelo padrão `init` (`ui-markdown`) habilita apenas a extração e tradução de **interface**. O modelo `ui-docusaurus` habilita a tradução de **documentos** (`translate-docs`). Use `sync` quando desejar um único comando que execute extração, tradução da interface, tradução opcional autônoma de SVG e tradução de documentação conforme sua configuração.

```bash
# Workflow 1 - UI strings (default template enables extract + translate-ui)
npx ai-i18n-tools init
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui

# Workflow 2 - docs (Docusaurus-oriented template)
npx ai-i18n-tools init -t ui-docusaurus
npx ai-i18n-tools translate-docs

# Combined: extract UI strings, then translate UI + SVG + docs (per config features)
npx ai-i18n-tools sync

# Translation status (UI strings per locale; markdown per file × locale in chunked tables)
npx ai-i18n-tools status
# npx ai-i18n-tools status --max-columns 12   # wider tables, fewer chunks
```

### Scripts recomendados `package.json`

Com o pacote instalado localmente, você pode usar os comandos CLI diretamente em scripts (não é necessário `npx`):

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate": "ai-i18n-tools translate-ui && ai-i18n-tools translate-svg && ai-i18n-tools translate-docs",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:status": "ai-i18n-tools status",
  "i18n:editor": "ai-i18n-tools editor",
  "i18n:cleanup": "ai-i18n-tools cleanup"
}
```

---

## Fluxo de trabalho 1 - Tradução de interface

Projetado para qualquer projeto JS/TS que use i18next: aplicativos React, Next.js (componentes cliente e servidor), serviços Node.js, ferramentas CLI.

### Etapa 1: Inicializar

```bash
npx ai-i18n-tools init
```

Isso escreve `ai-i18n-tools.config.json` com o modelo `ui-markdown`. Edite para definir:

- `sourceLocale` - seu código BCP-47 do idioma de origem (por exemplo, `"en-GB"`). **Deve coincidir** com `SOURCE_LOCALE` exportado do seu arquivo de configuração de i18n em tempo de execução (`src/i18n.ts` / `src/i18n.js`).
- `targetLocales` - array de códigos BCP-47 para seus idiomas de destino (por exemplo, `["de", "fr", "pt-BR"]`). Execute `generate-ui-languages` para criar o manifesto `ui-languages.json` a partir desta lista.
- `ui.sourceRoots` - diretórios para verificar chamadas `t("…")` (por exemplo, `["src/"]`).
- `ui.stringsJson` - onde gravar o catálogo principal (por exemplo, `"src/locales/strings.json"`).
- `ui.flatOutputDir` - onde gravar `de.json`, `pt-BR.json`, etc. (por exemplo, `"src/locales/"`).
- `ui.preferredModel` (opcional) - ID do modelo OpenRouter para tentar **primeiro** apenas para `translate-ui`; em caso de falha, a CLI continua com `openrouter.translationModels` (ou legado `defaultModel` / `fallbackModel`) em ordem, ignorando duplicatas.

### Etapa 2: Extrair strings

```bash
npx ai-i18n-tools extract
```

Verifica todos os arquivos JS/TS em `ui.sourceRoots` por chamadas `t("literal")` e `i18n.t("literal")`. Grava (ou mescla em) `ui.stringsJson`.

O scanner é configurável: adicione nomes personalizados de funções via `ui.reactExtractor.funcNames`.

### Etapa 3: Traduzir strings da interface

```bash
npx ai-i18n-tools translate-ui
```

Lê `strings.json`, envia lotes ao OpenRouter para cada localidade de destino, grava arquivos JSON planos (`de.json`, `fr.json`, etc.) em `ui.flatOutputDir`. Quando `ui.preferredModel` é definido, esse modelo é tentado antes da lista ordenada em `openrouter.translationModels` (a tradução de documentos e outros comandos ainda usam apenas `openrouter`).

Para cada entrada, `translate-ui` armazena o **ID do modelo OpenRouter** que traduziu com sucesso cada localidade em um objeto opcional `models` (com as mesmas chaves de localidade que `translated`). Strings editadas no comando local `editor` são marcadas com o valor sentinela `user-edited` em `models` para aquela localidade. Os arquivos planos por localidade em `ui.flatOutputDir` permanecem apenas como **string de origem → tradução**; eles não incluem `models` (assim, os pacotes em tempo de execução permanecem inalterados).

> **Observação sobre o uso do Editor de Cache:** Se você editar uma entrada no editor de cache, precisa executar um `sync --force-update` (ou o comando equivalente `translate` com `--force-update`) para reescrever os arquivos de saída com a entrada de cache atualizada. Além disso, lembre-se de que se o texto de origem mudar posteriormente, sua edição manual será perdida porque uma nova chave de cache (hash) será gerada para a nova string de origem.

### Exportar para XLIFF 2.0 (opcional)

Para entregar strings da interface a um fornecedor de tradução, TMS ou ferramenta CAT, exporte o catálogo como **XLIFF 2.0** (um arquivo por localidade de destino). Este comando é **somente leitura**: não modifica `strings.json` nem chama nenhuma API.

```bash
npx ai-i18n-tools export-ui-xliff
```

Por padrão, os arquivos são gravados ao lado de `ui.stringsJson`, nomeados como `strings.de.xliff`, `strings.pt-BR.xliff` (nome base do seu catálogo + localidade + `.xliff`). Use `-o` / `--output-dir` para gravar em outro local. Traduções existentes de `strings.json` aparecem em `<target>`; localidades ausentes usam `state="initial"` sem `<target>` para que as ferramentas possam preenchê-las. Use `--untranslated-only` para exportar apenas unidades que ainda precisam de tradução para cada localidade (útil para lotes de fornecedores). `--dry-run` exibe os caminhos sem gravar arquivos.

### Etapa 4: Configurar o i18next em tempo de execução

Crie seu arquivo de configuração de i18n usando os auxiliares exportados por `'ai-i18n-tools/runtime'`:

```js
// src/i18n.js or src/i18n.ts — use ../locales and ../public/locales instead of ./ when this file is under src/
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import aiI18n from 'ai-i18n-tools/runtime';

// Project locale files — paths must match `ui` in ai-i18n-tools.config.json (paths there are relative to the project root).
import uiLanguages from './locales/ui-languages.json'; // `ui.uiLanguagesPath` (defaults to `{ui.flatOutputDir}/ui-languages.json`)
import stringsJson from './locales/strings.json'; // `ui.stringsJson`
import sourcePluralFlat from './public/locales/en-GB.json'; // `{ui.flatOutputDir}/{SOURCE_LOCALE}.json` from translate-ui

// Must match `sourceLocale` in ai-i18n-tools.config.json (same string as in the import path above)
export const SOURCE_LOCALE = 'en-GB';

// initialize i18n with the default options
void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));

// setup the key-as-default translation
aiI18n.setupKeyAsDefaultT(i18n, {
  stringsJson,
  sourcePluralFlatBundle: { lng: SOURCE_LOCALE, bundle: sourcePluralFlat },
});

// apply the direction to the i18n instance
i18n.on('languageChanged', aiI18n.applyDirection);
aiI18n.applyDirection(i18n.language);

// create the locale loaders
const localeLoaders = aiI18n.makeLocaleLoadersFromManifest(
  uiLanguages,
  SOURCE_LOCALE,
  (code) => () => import(`./locales/${code}.json`),
);

// create the loadLocale function
export const loadLocale = aiI18n.makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);

// export the i18n instance
export default i18n;
```

**Mantenha três valores alinhados:** `sourceLocale` em **`ai-i18n-tools.config.json`**, **`SOURCE_LOCALE`** neste arquivo e o JSON plano de plural que **`translate-ui`** grava como **`{sourceLocale}.json`** no seu diretório de saída plano (geralmente `public/locales/`). Use o mesmo nome base em **`import`** estático (exemplo acima: `en-GB` → `en-GB.json`). O campo **`lng`** em **`sourcePluralFlatBundle`** deve ser igual a **`SOURCE_LOCALE`**. Caminhos ES estáticos **`import`** não podem usar variáveis; se você alterar o idioma de origem, atualize **`SOURCE_LOCALE`** e o caminho de importação juntos. Alternativamente, carregue esse arquivo com um **`import(\`./public/locales/${SOURCE_LOCALE}.json\`)`** dinâmico, **`fetch`**, ou **`readFileSync`** para que o caminho seja construído a partir de **`SOURCE_LOCALE`**.

O trecho usa **`./locales/…`** e **`./public/locales/…`** como se **`i18n`** estivesse ao lado dessas pastas. Se seu arquivo estiver em **`src/`** (típico), use **`../locales/…`** e **`../public/locales/…`** para que as importações resolvam para os mesmos caminhos que **`ui.stringsJson`**, **`uiLanguagesPath`** e **`ui.flatOutputDir`**.

Importe `i18n.js` antes do React renderizar (por exemplo, no topo do seu ponto de entrada). Quando o usuário alterar o idioma, chame `await loadLocale(code)` e depois `i18n.changeLanguage(code)`.

Mantenha `localeLoaders` **alinhado com a configuração** derivando-os de **`ui-languages.json`** com **`makeLocaleLoadersFromManifest`** (filtra **`SOURCE_LOCALE`** usando a mesma normalização que **`makeLoadLocale`**). Depois de adicionar um locale a **`targetLocales`** e executar **`generate-ui-languages`**, o manifesto é atualizado e seus carregadores acompanham sem manter um mapa codificado separadamente. Se os pacotes JSON estiverem em **`public/`** (típico do Next.js), implemente cada carregador com **`fetch(\`/locales/${code}.json\`)`** em vez de **`import()`** para que o navegador carregue o JSON estático do seu caminho URL público. Para CLIs Node sem um empacotador, carregue arquivos de locale com **`readFileSync`** dentro de um pequeno auxiliar **`makeFileLoader`** que retorna o JSON analisado para cada código.

`SOURCE_LOCALE` é exportado para que qualquer outro arquivo que precise dele (por exemplo, um seletor de idioma) possa importá-lo diretamente de `'./i18n'`. Se você estiver migrando uma configuração existente do i18next, substitua quaisquer strings de locale fonte codificadas (por exemplo, verificações `'en-GB'` espalhadas pelos componentes) por importações de `SOURCE_LOCALE` do seu arquivo de inicialização do i18n.

Importações nomeadas (`import { defaultI18nInitOptions, … } from 'ai-i18n-tools/runtime'`) funcionam da mesma forma se você preferir não usar a exportação padrão.

`aiI18n.defaultI18nInitOptions(sourceLocale)` (ou `defaultI18nInitOptions(sourceLocale)` quando importado por nome) retorna as opções padrão para configurações com chave como padrão:

- `parseMissingKeyHandler` retorna a própria chave, então strings não traduzidas exibem o texto fonte.
- `nsSeparator: false` permite chaves que contenham dois pontos.
- `interpolation.escapeValue: false` - seguro desativar: o React escapa os valores por si só, e a saída do Node.js/CLI não possui HTML para escapar.

`setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` é a configuração **recomendada** para projetos ai-i18n-tools: aplica o corte de chave + fallback de interpolação <code>{"{{var}}"}</code> do locale fonte (mesmo comportamento do **`wrapI18nWithKeyTrim`** de nível inferior), opcionalmente mescla chaves plurais com sufixo **`translate-ui`** **`{sourceLocale}.json`** via **`addResourceBundle`**, e então instala **`wrapT`** com suporte a plural a partir do seu **`strings.json`**. Esse arquivo agrupado deve ser o plural plano para o seu locale fonte **configurado** — o mesmo **`sourceLocale`** usado em **`ai-i18n-tools.config.json`** e **`SOURCE_LOCALE`** na inicialização do seu i18n (veja o Passo 4 acima). Omita **`sourcePluralFlatBundle`** apenas durante a inicialização (una-o assim que **`translate-ui`** emitir **`{sourceLocale}.json`**). **`wrapI18nWithKeyTrim`** sozinho está **obsoleto** para código de aplicação — use **`setupKeyAsDefaultT`** em vez disso.

`makeLoadLocale(i18n, loaders, sourceLocale)` retorna uma função `loadLocale(lang)` assíncrona que importa dinamicamente o pacote JSON de um locale e o registra com o i18next.

### Usando `t()` no código fonte

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
- A chave deve ser uma **string literal** — nada de variáveis ou expressões como chave.
- Não use literais de modelo para a chave: <code>{'t(`Hello ${name}`)'}</code> não é extraível.

### Interpolação

Use a interpolação nativa do i18next com segundo argumento para os espaços reservados <code>{"{{var}}"}</code>:

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

O comando de extração analisa o **segundo argumento** quando ele é um objeto literal simples e lê flags apenas para ferramentas, como **`plurals: true`** e **`zeroDigit`** (veja **Plurais cardinais** abaixo). Para strings comuns, apenas a chave literal é usada para hashing; as opções de interpolação ainda são passadas ao i18next em tempo de execução.

Se o seu projeto usa um utilitário personalizado de interpolação (por exemplo, chamar `t('key')` e depois passar o resultado por uma função de modelo como `interpolateTemplate(t('Hello {{name}}'), { name })`), **`setupKeyAsDefaultT`** (via **`wrapI18nWithKeyTrim`**) torna isso desnecessário — ele aplica interpolação <code>{"{{var}}"}</code> mesmo quando o locale fonte retorna a chave bruta. Migre os locais de chamada para `t('Hello {{name}}', { name })` e remova o utilitário personalizado.

### Plurais cardinais (`plurals: true`)

Use o **mesmo literal** que deseja como texto padrão do desenvolvedor e passe **`plurals: true`** para que extração + `translate-ui` tratem a chamada como um **grupo plural cardinal** (formas estilo JSON v4 do i18next `_zero` … `_other`).

```tsx
{t('{{count}} items in your cart', { plurals: true, count: n })}
```

- **`zeroDigit`** (opcional) — apenas para ferramentas; **não** lido pelo i18next. Quando `true`, as sugestões preferem um **`0`** arábico literal na string `_zero` para cada locale onde essa forma existir; quando `false` ou omitido, usa-se a frase natural para zero. Remova essas chaves antes de chamar `i18next.t` (veja `wrapT` abaixo).

**Validação:** Se a mensagem contiver **dois ou mais** placeholders `{{…}}` distintos, **um deles deve ser `{{count}}`** (o eixo plural). Caso contrário, `extract` **falha** com uma mensagem clara de arquivo/linha.

**Duas contagens independentes** (por exemplo, seções e páginas) não podem compartilhar uma mesma mensagem plural — use **duas** chamadas `t()` (cada uma com `plurals: true` e seu próprio `count`) e concatene na interface.

`strings.json` **:** Grupos plurais usam **uma linha por hash** com `"plural": true`, o literal original em **`source`** e **`translated[locale]`** como um objeto que mapeia categorias cardinais (`zero`, `one`, `two`, `few`, `many`, `other`) para strings nesse idioma.

**JSON plano de idioma:** Linhas não plurais permanecem como **frase original → tradução**. Linhas plurais são emitidas como **`<groupId>_original`** (igual a `source`, para referência) e **`<groupId>_<form>`** para cada sufixo, para que o i18next resolva plurais nativamente. **`translate-ui`** também escreve **`{sourceLocale}.json`** contendo **apenas** chaves planas plurais (carregue este pacote para o idioma original para que chaves com sufixo sejam resolvidas; strings simples ainda usam a chave como padrão). Para cada idioma de destino, as chaves com sufixo emitidas correspondem a **`Intl.PluralRules`** para aquele idioma (`requiredCldrPluralForms`): se `strings.json` omitiu uma categoria porque ela coincidiu com outra após compactação (por exemplo, árabe **`many`** igual a **`other`**), **`translate-ui`** ainda escreve todos os sufixos necessários no arquivo plano copiando de uma string irmã de fallback, para que a busca em tempo de execução nunca perca uma chave.

Tempo de execução (`ai-i18n-tools/runtime` **):** Chame **`setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle })`** — ele executa **`wrapI18nWithKeyTrim`**, registra o pacote plural opcional **`translate-ui`** `{sourceLocale}.json`, e então **`wrapT`** usando **`buildPluralIndexFromStringsJson(stringsJson)`**. `wrapT` remove `plurals` / `zeroDigit`, reescreve a chave para o ID do grupo quando necessário e encaminha **`count`** (opcional: se houver um único placeholder não-`{{count}}`, `count` é copiado dessa opção numérica).

**Ambientes mais antigos:** `Intl.PluralRules` é necessário para as ferramentas e para comportamento consistente; use polyfill se você for direcionado a navegadores muito antigos.

**Não está na v1:** plurais ordinais (`_ordinal_*`, `ordinal: true`), plurais de intervalo, pipelines apenas ICU.

### Interface do seletor de idioma

Use o manifesto `ui-languages.json` para criar um seletor de idioma. `ai-i18n-tools` exporta dois auxiliares de exibição:

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

`getUILanguageLabel(lang, t)` - exibe `t(englishName)` quando traduzido, ou `englishName / t(englishName)` quando ambos diferem. Adequado para telas de configurações.

`getUILanguageLabelNative(lang)` - exibe `englishName / label` (sem chamada `t()` em cada linha). Adequado para menus de cabeçalho onde você deseja que o nome nativo seja visível.

O manifesto `ui-languages.json` é um array JSON de entradas <code>{"{ code, label, englishName, direction }"}</code> (`direction` é `"ltr"` ou `"rtl"`). Exemplo:

```json
[
  { "code": "en-GB", "label": "English (UK)", "englishName": "English (UK)", "direction": "ltr" },
  { "code": "pt-BR", "label": "Português (BR)", "englishName": "Portuguese (BR)", "direction": "ltr" },
  { "code": "de",    "label": "Deutsch",        "englishName": "German", "direction": "ltr" },
  { "code": "fr",    "label": "Français",       "englishName": "French", "direction": "ltr" },
  { "code": "ar",    "label": "العربية",         "englishName": "Arabic", "direction": "rtl" }
]
```

O manifesto é gerado por `generate-ui-languages` a partir de `sourceLocale` + `targetLocales` e do catálogo mestre empacotado. Ele é escrito em `ui.flatOutputDir`. Se você alterar qualquer um dos idiomas na configuração, execute `generate-ui-languages` para atualizar o arquivo `ui-languages.json`.

### Idiomas RTL

`ai-i18n-tools` exporta `getTextDirection(lng)` e `applyDirection(lng)`:

```js
import { getTextDirection, applyDirection } from 'ai-i18n-tools/runtime';

getTextDirection('ar')    // 'rtl'
getTextDirection('en-GB') // 'ltr'

// Applied automatically via i18n.on('languageChanged', applyDirection) - see Step 4
```

`applyDirection` define `document.documentElement.dir` (navegador) ou é um no-op (Node.js). Passe um argumento opcional `element` para direcionar um elemento específico.

Para strings que podem conter setas `→`, inverta-as para layouts RTL:

```js
import { flipUiArrowsForRtl } from 'ai-i18n-tools/runtime';
const { i18n } = useTranslation();
const isRtl = getTextDirection(i18n.language) === 'rtl';
const label = flipUiArrowsForRtl(t('Next → Step'), isRtl);
```

---

## Fluxo de trabalho 2 - Tradução de documentos

Projetado para documentação em markdown, sites Docusaurus e arquivos de rótulos JSON. Ativos SVG autônomos são traduzidos via [`translate-svg`](#cli-reference) quando `features.translateSVG` está habilitado e o bloco `svg` de nível superior está definido — não via `documentations[].contentPaths`.

### Etapa 1: Inicializar para documentação

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

Edite o `ai-i18n-tools.config.json` gerado:

- `sourceLocale` - idioma de origem (deve corresponder a `defaultLocale` em `docusaurus.config.js`).
- `targetLocales` - array de códigos de localidade BCP-47 (por exemplo, `["de", "fr", "es"]`).
- `cacheDir` - diretório de cache compartilhado do SQLite para todos os pipelines de documentação (e diretório padrão de log para `--write-logs`).
- `documentations` - array de blocos de documentação. Cada bloco possui `description`, `contentPaths`, `outputDir`, opcional `jsonSource`, `markdownOutput`, opcional `segmentSplitting`, `targetLocales`, `addFrontmatter`, etc.
- `documentations[].description` - nota opcional curta para mantenedores (o que este bloco abrange). Quando definido, aparece no título `translate-docs` (`🌐 …: translating …`) e nos cabeçalhos da seção `status`.
- `documentations[].contentPaths` - diretórios ou arquivos de origem em markdown/MDX (veja também `documentations[].jsonSource` para rótulos JSON).
- `documentations[].outputDir` - raiz de saída traduzida para esse bloco.
- `documentations[].markdownOutput.style` - `"nested"` (padrão), `"docusaurus"` ou `"flat"` (veja [Layouts de saída](#output-layouts)).

### Etapa 2: Traduzir documentos

```bash
npx ai-i18n-tools translate-docs
```

Isso traduz todos os arquivos em cada `documentations` do bloco `contentPaths` para todos os idiomas de documentação efetivos (união dos `targetLocales` de cada bloco quando definidos, caso contrário, `targetLocales` raiz). Segmentos já traduzidos são fornecidos a partir do cache do SQLite — somente segmentos novos ou alterados são enviados ao LLM.

Para traduzir um único idioma:

```bash
npx ai-i18n-tools translate-docs --locale de
```

Para verificar o que precisa ser traduzido:

```bash
npx ai-i18n-tools status
```

#### Comportamento do cache e flags `translate-docs`

A CLI mantém o **rastreamento de arquivos** no SQLite (hash de origem por arquivo × idioma) e linhas de **segmento** (hash × idioma por trecho traduzível). Uma execução normal ignora completamente um arquivo quando o hash rastreado corresponde à fonte atual **e** o arquivo de saída já existe; caso contrário, processa o arquivo e usa o cache de segmento para que textos inalterados não chamem a API.

| Flag                     | Efeito                                                                                                                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| *(padrão)*               | Ignora arquivos inalterados quando o rastreamento + saída em disco coincidem; usa o cache de segmento para o restante.                                                                                   |
| `-l, --locale <codes>`   | Idiomas-alvo separados por vírgula (os padrões seguem `documentation.targetLocales` / `targetLocales` quando omitidos).                                                                                           |
| `-p, --path` / `-f, --file` | Traduz apenas markdown/JSON sob este caminho (relativo ao projeto ou absoluto); `--file` é um alias para `--path`.                                                                                     |
| `--dry-run`              | Sem gravações de arquivos e sem chamadas à API.                                                                                                                                                        |
| `--type <kind>`          | Restringe a `markdown` ou `json` (caso contrário ambos quando habilitados na configuração).                                                                                                                              |
| `--json-only` / `--no-json` | Traduz apenas arquivos de rótulos JSON, ou ignora JSON e traduz apenas markdown.                                                                                                                         |
| `-j, --concurrency <n>`  | Número máximo de idiomas-alvo em paralelo (padrão da configuração ou padrão embutido da CLI).                                                                                                                             |
| `-b, --batch-concurrency <n>` | Número máximo de chamadas à API em lote por arquivo (documentos; padrão da configuração ou CLI).                                                                                                                          |
| `--emphasis-placeholders` | Substitui marcadores de ênfase em markdown por espaços reservados antes da tradução (opcional; padrão desativado).                                                                                                         |
| `--debug-failed`         | Escreva logs detalhados de `FAILED-TRANSLATION` em `cacheDir` quando a validação falhar.                                                                                                                       |
| `--force-update`         | Re-processa cada arquivo correspondente (extrai, remonta, escreve saídas) mesmo quando o rastreamento de arquivos pularia. **O cache de segmentos ainda se aplica** - segmentos inalterados não são enviados ao LLM.                   |
| `--force`                | Limpa o rastreamento de arquivos para cada arquivo processado e **não lê** o cache de segmentos para tradução da API (re-tradução completa). Os novos resultados ainda são **gravados** no cache de segmentos.                 |
| `--stats`                | Exibe contagens de segmentos, contagens de arquivos rastreados e totais de segmentos por localidade, depois encerra.                                                                                                                   |
| `--clear-cache [locale]` | Exclui traduções em cache (e rastreamento de arquivos): todas as localidades ou uma única localidade, depois encerra.                                                                                                            |
| `--prompt-format <mode>` | Como cada **lote** de segmentos é enviado ao modelo e analisado (`xml`, `json-array` ou `json-object`). Padrão **`json-array`**. Não altera extração, marcadores de posição, validação, cache ou comportamento de fallback — veja [Formato do prompt do lote](#batch-prompt-format). |

Você não pode combinar `--force` com `--force-update` (são mutuamente exclusivos).

#### Formato do prompt do lote

`translate-docs` envia segmentos traduzíveis ao OpenRouter em **lotes** (agrupados por `batchSize` / `maxBatchChars`). A flag **`--prompt-format`** apenas altera o **formato de transmissão** desse lote; tokens `PlaceholderHandler`, verificações AST de markdown, chaves de cache SQLite e fallback por segmento quando a análise do lote falha permanecem inalterados.

| Modo | Mensagem do usuário | Resposta do modelo |
| ---- | ------------ | ----------- |
| **`xml`** | Pseudo-XML: um `<seg id="N">…</seg>` por segmento (com escape XML). | Apenas blocos `<t id="N">…</t>`, um por índice de segmento. |
| **`json-array`** (padrão) | Um array JSON de strings, uma entrada por segmento em ordem. | Um array JSON do **mesmo comprimento** (mesma ordem). |
| **`json-object`** | Um objeto JSON `{"0":"…","1":"…",…}` indexado pelo índice do segmento. | Um objeto JSON com as **mesmas chaves** e valores traduzidos. |

O cabeçalho da execução também exibe `Batch prompt format: …` para que você possa confirmar o modo ativo. Arquivos de rótulos JSON (`jsonSource`) e lotes SVG autônomos usam a mesma configuração quando essas etapas são executadas como parte de `translate-docs` (ou da fase de docs do `sync` — `sync` não expõe essa flag; ela usa **`json-array`** por padrão).

#### Deduplicação de segmentos e caminhos no SQLite

- As linhas de segmento são indexadas globalmente por `(source_hash, locale)` (hash = conteúdo normalizado). Texto idêntico em dois arquivos compartilha uma linha; `translations.filepath` é metadado (último escritor), não uma entrada de cache adicional por arquivo.
- `file_tracking.filepath` usa chaves com namespace: `doc-block:{index}:{relPath}` por bloco `documentations` (`relPath` é posix relativo à raiz do projeto: caminhos markdown conforme coletados; **arquivos de rótulos JSON usam o caminho relativo ao diretório atual do arquivo de origem**, por exemplo `docs-site/i18n/en/code.json`, para que a limpeza possa resolver o arquivo real), e `svg-assets:{relPath}` para ativos SVG autônomos sob `translate-svg`.
- `translations.filepath` armazena caminhos posix relativos ao diretório atual para segmentos markdown, JSON e SVG (SVG usa a mesma forma de caminho que outros ativos; o prefixo `svg-assets:…` é **apenas** em `file_tracking`).
- Após uma execução, `last_hit_at` é limpo apenas para linhas de segmento **no mesmo escopo de tradução** (respeitando `--path` e tipos habilitados) que não foram acessadas, portanto uma execução filtrada ou apenas de docs não marca arquivos não relacionados como obsoletos.

### Layouts de saída

`"nested"` (padrão quando omitido) — espelha a árvore de origem sob `{outputDir}/{locale}/` (por exemplo, `docs/guide.md` → `i18n/de/docs/guide.md`).

`"docusaurus"` — coloca arquivos que estão sob `docsRoot` em `i18n/<locale>/docusaurus-plugin-content-docs/current/<relativeToDocsRoot>`, correspondendo ao layout i18n usual do Docusaurus. Defina `documentations[].markdownOutput.docsRoot` como a raiz da sua fonte de docs (por exemplo, `"docs"`).

```text
docs/guide.md         → i18n/de/docusaurus-plugin-content-docs/current/guide.md
i18n/en/sidebar.json  → i18n/de/sidebar.json  (JSON label files)
```

`"flat"` - coloca arquivos traduzidos ao lado do original com sufixo de localidade, ou em um subdiretório. Links relativos entre páginas são reescritos automaticamente.

```text
docs/guide.md → i18n/guide.de.md
```

Você pode substituir caminhos completamente com `documentations[].markdownOutput.pathTemplate`. Substituições: <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{LOCALE}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{basename}"}</code>, <code>{"{extension}"}</code>, <code>{"{docsRoot}"}</code>, <code>{"{relativeToDocsRoot}"}</code>.

---

## Fluxo de trabalho combinado (UI + Docs)

Habilite todos os recursos em uma única configuração para executar ambos os fluxos de trabalho juntos:

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-CN"],
  "features": {
    "extractUIStrings": true,
    "translateUIStrings": true,
    "translateMarkdown": true,
    "translateJSON": false,
    "translateSVG": false
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

`glossary.uiGlossary` direciona a tradução de documentos para o mesmo catálogo `strings.json` da interface, mantendo a terminologia consistente; `glossary.userGlossary` adiciona substituições CSV para termos de produto.

Execute `npx ai-i18n-tools sync` para rodar um único pipeline: **extrair** strings da interface (se `features.extractUIStrings`), **traduzir strings da interface** (se `features.translateUIStrings`), **traduzir ativos SVG autônomos** (se `features.translateSVG` e um bloco `svg` estiverem definidos), depois **traduzir documentação** (cada bloco `documentations`: markdown/JSON conforme configurado). Pule partes com `--no-ui`, `--no-svg` ou `--no-docs`. A etapa de documentação aceita `--dry-run`, `-p` / `--path`, `--force` e `--force-update` (os dois últimos só se aplicam quando a tradução da documentação é executada; são ignorados se você passar `--no-docs`).

Use `documentations[].targetLocales` em um bloco para traduzir os arquivos desse bloco para um **subconjunto menor** do que a interface (os idiomas efetivos da documentação são a **união** entre blocos):

```json
{
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-CN"],
  "documentations": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "targetLocales": ["de", "fr", "es"]
    }
  ]
}
```

### Fluxo de trabalho misto de documentação (Docusaurus + flat)

Você pode combinar múltiplos pipelines de documentação na mesma configuração adicionando mais de uma entrada em `documentations`. Essa é uma configuração comum quando um projeto possui um site Docusaurus mais arquivos markdown no nível raiz (por exemplo, um arquivo readme do repositório) que devem ser traduzidos com saída plana.

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["ar", "es", "fr", "de", "pt-BR"],
  "features": {
    "extractUIStrings": true,
    "translateUIStrings": true,
    "translateMarkdown": true,
    "translateJSON": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "locales/strings.json",
    "flatOutputDir": "public/locales/"
  },
  "cacheDir": ".translation-cache",
  "documentations": [
    {
      "description": "Docusaurus docs and JSON labels",
      "contentPaths": ["docs-site/docs/"],
      "outputDir": "docs-site/i18n",
      "jsonSource": "docs-site/i18n/en",
      "addFrontmatter": true,
      "markdownOutput": {
        "style": "docusaurus",
        "docsRoot": "docs-site/docs"
      }
    },
    {
      "description": "Root README in flat output",
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "markdownOutput": {
        "style": "flat",
        "postProcessing": {
          "languageListBlock": {
            "start": "<small id=\"lang-list\">",
            "end": "</small>",
            "separator": " · "
          }
        }
      }
    }
  ]
}
```

Como isso é executado com `npx ai-i18n-tools sync`:

- Strings da interface são extraídas/traduzidas de `src/` para `public/locales/`.
- O primeiro bloco de documentação traduz markdown e rótulos JSON para o layout Docusaurus `i18n/<locale>/...`.
- O segundo bloco de documentação traduz `README.md` para arquivos planos com sufixo de idioma em `translated-docs/`.
- Todos os blocos de documentação compartilham `cacheDir`, então segmentos inalterados são reutilizados entre execuções para reduzir chamadas à API e custos.

---

## Referência de configuração

### `sourceLocale`

Código BCP-47 para o idioma de origem (por exemplo, `"en-GB"`, `"en"`, `"pt-BR"`). Nenhum arquivo de tradução é gerado para este idioma — a própria chave da string é o texto de origem.

**Deve corresponder** ao `SOURCE_LOCALE` exportado do seu arquivo de configuração de i18n em tempo de execução (`src/i18n.ts` / `src/i18n.js`).

### `targetLocales`

Array de códigos de idioma BCP-47 para os quais traduzir (por exemplo, `["de", "fr", "es", "pt-BR"]`).

`targetLocales` é a lista principal de idiomas para tradução da interface e a lista padrão de idiomas para blocos de documentação. Use `generate-ui-languages` para gerar o manifesto `ui-languages.json` a partir de `sourceLocale` + `targetLocales`.

### `uiLanguagesPath` (opcional)

Caminho para o manifesto `ui-languages.json` usado para nomes de exibição, filtragem de idiomas e pós-processamento da lista de idiomas. Quando omitido, a CLI procura o manifesto em `ui.flatOutputDir/ui-languages.json`.

Use isso quando:

- O manifesto está fora de `ui.flatOutputDir` e você precisa indicar explicitamente o caminho para a CLI.
- Você deseja que `markdownOutput.postProcessing.languageListBlock` gere rótulos de idioma a partir do manifesto.
- `extract` deve mesclar entradas `englishName` do manifesto em `strings.json` (requer `ui.reactExtractor.includeUiLanguageEnglishNames: true`).

### `concurrency` (opcional)

Número máximo de **localidades de destino** traduzidas ao mesmo tempo (`translate-ui`, `translate-docs`, `translate-svg` e as etapas correspondentes dentro de `sync`). Se omitido, a CLI usa **4** para tradução de interface e **3** para tradução de documentação (padrões embutidos). Substitua por execução com `-j` / `--concurrency`.

### `batchConcurrency` (opcional)

**translate-docs** e **translate-svg** (e a etapa de documentação do `sync`): número máximo de requisições paralelas em **lote** do OpenRouter por arquivo (cada lote pode conter muitos segmentos). Padrão **4** quando omitido. Ignorado pelo `translate-ui`. Substitua com `-b` / `--batch-concurrency`. No `sync`, `-b` se aplica somente à etapa de tradução da documentação.

### `batchSize` / `maxBatchChars` (opcional)

Loteamento de segmentos para tradução de documentos: quantos segmentos por requisição à API e um limite máximo de caracteres. Padrões: **20** segmentos, **4096** caracteres (quando omitido).

### `openrouter`

| Campo               | Descrição                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------- |
| `baseUrl`           | URL base da API OpenRouter. Padrão: `https://openrouter.ai/api/v1`.                        |
| `translationModels` | Lista ordenada preferencial de IDs de modelos. O primeiro é tentado primeiro; entradas posteriores são usadas como alternativas em caso de erro. Apenas para `translate-ui`, você também pode definir `ui.preferredModel` para tentar um modelo antes desta lista (veja `ui`). |
| `defaultModel`      | Modelo principal único legado. Usado somente quando `translationModels` não estiver definido ou estiver vazio.       |
| `fallbackModel`     | Modelo de contingência único legado. Usado após `defaultModel` quando `translationModels` não estiver definido ou estiver vazio. |
| `maxTokens`         | Número máximo de tokens de conclusão por requisição. Padrão: `8192`.                                      |
| `temperature`       | Temperatura de amostragem. Padrão: `0.2` **.                                                    |**Por que usar múltiplos modelos:** Diferentes provedores e modelos têm custos variados e oferecem diferentes níveis de qualidade entre idiomas e localidades. Configure **`openrouter.translationModels` como uma cadeia ordenada de contingência** (em vez de um único modelo), para que a CLI possa tentar o próximo modelo caso uma requisição falhe.

Considere a lista abaixo como uma **base** que você pode expandir: se a tradução para uma localidade específica for ruim ou mal-sucedida, pesquise quais modelos suportam bem esse idioma ou script (consulte recursos online ou a documentação do seu provedor) e adicione esses IDs do OpenRouter como alternativas adicionais.

Esta lista foi **testada para cobertura ampla de localidades** (por exemplo, no projeto Transrewrt traduzindo **36** localidades de destino) em **abril de 2026; ela serve como um padrão prático, mas não é garantida para funcionar bem em todas as localidades.

Exemplo de `translationModels` (mesmos padrões do `npx ai-i18n-tools init`):

```json
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
]
```

Defina `OPENROUTER_API_KEY` no seu ambiente ou no arquivo `.env`.

### `features`

| Campo                | Fluxo de trabalho | Descrição                                                       |
| -------------------- | -------- | ----------------------------------------------------------------- |
| `extractUIStrings`   | 1        | Analisar a fonte em busca de `t("…")` / `i18n.t("…")`, mesclar descrição opcional `package.json` e (se habilitado) valores `ui-languages.json` `englishName` em `strings.json`. |
| `translateUIStrings` | 1        | Traduzir entradas `strings.json` e gravar arquivos JSON por localidade. |
| `translateMarkdown`  | 2        | Traduzir arquivos `.md` / `.mdx`.                                   |
| `translateJSON`      | 2        | Traduzir arquivos JSON de rótulos do Docusaurus.                            |
| `translateSVG`       | 2        | Traduzir ativos `.svg` autônomos (requer o bloco `svg` **no nível superior). |

Traduza ativos SVG**autônomos com `translate-svg` quando `features.translateSVG` for verdadeiro e um bloco `svg` no nível superior estiver configurado. O comando `sync` executa essa etapa quando ambos estiverem definidos (a menos que `--no-svg`).

### `ui`

| Campo                       | Descrição                                                             |
| --------------------------- | ----------------------------------------------------------------------- |
| `sourceRoots`               | Diretórios (relativos ao diretório atual) verificados em busca de chamadas `t("…")`.               |
| `stringsJson`               | Caminho para o arquivo de catálogo mestre. Atualizado por `extract`.                  |
| `flatOutputDir`             | Diretório onde os arquivos JSON por localidade são gravados (`de.json`, etc.).    |
| `preferredModel`            | Opcional. ID do modelo OpenRouter tentado primeiro apenas para `translate-ui`; depois `openrouter.translationModels` (ou modelos legados) em ordem, sem duplicar esse ID. |
| `reactExtractor.funcNames`  | Nomes adicionais de funções para verificação (padrão: `["t", "i18n.t"]`).         |
| `reactExtractor.extensions` | Extensões de arquivo a incluir (padrão: `[".js", ".jsx", ".ts", ".tsx"]`). |
| `reactExtractor.includePackageDescription` | Quando `true` (padrão), `extract` também inclui `package.json` `description` como uma string de interface quando presente. |
| `reactExtractor.packageJsonPath` | Caminho personalizado para o arquivo `package.json` usado para essa extração opcional de descrição. |
| `reactExtractor.includeUiLanguageEnglishNames` | Quando `true` (padrão `false`), `extract` também adiciona cada `englishName` do manifesto em `uiLanguagesPath` ao `strings.json` quando ainda não estiver presente na verificação de origem (mesmas chaves de hash). Requer `uiLanguagesPath` apontando para um `ui-languages.json` válido. |

### `cacheDir`

| Campo      | Descrição                                                                 |
| ---------- | ----------------------------------------------------------------------------- |
| `cacheDir` | Diretório de cache SQLite (compartilhado por todos os blocos `documentations`). Reutilizado entre execuções. Se você estiver migrando de um cache personalizado de tradução de documentos, arquive ou exclua-o — `cacheDir` cria seu próprio banco de dados SQLite e não é compatível com outros esquemas. |

Boas práticas para exclusões no VCS:

- Exclua o conteúdo da pasta de cache de tradução (por exemplo, via `.gitignore` ou `.git/info/exclude`) para evitar o commit de artefatos de cache transitórios.
- Mantenha `cache.db` disponível (não exclua rotineiramente), pois preservar o cache SQLite evita a re-tradução de segmentos inalterados, economizando tempo de execução e custos de API ao alterar ou atualizar softwares que usam `ai-i18n-tools`.

Exemplo:

```gitignore
# Translation cache directory
.translation-cache/*

# Keep SQLite cache for reuse
!.translation-cache/cache.db
```

### `documentations`

Matriz de blocos do pipeline de documentação. `translate-docs` e a fase de docs de `sync` **processam**cada bloco em ordem.

| Campo                                        | Descrição                                                                                                                                                                                                               |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `description`                                | Nota opcional legível por humanos para este bloco (não usada para tradução). Prefixada no título `translate-docs` `🌐` quando definida; também exibida nos cabeçalhos da seção `status`.                                                     |
| `contentPaths`                               | Fontes Markdown/MDX a serem traduzidas (`translate-docs` verifica esses por `.md` / `.mdx`). Rótulos JSON vêm de `jsonSource` no mesmo bloco.                                                                                  |
| `outputDir`                                  | Diretório raiz para a saída traduzida deste bloco.                                                                                                                                                                      |
| `sourceFiles`                                | Alias opcional mesclado em `contentPaths` durante o carregamento.                                                                                                                                                                        |
| `targetLocales`                              | Subconjunto opcional de localidades apenas para este bloco (caso contrário, usa a raiz `targetLocales`). As localidades efetivas para documentação são a união entre todos os blocos.                                                                             |
| `jsonSource`                                 | Diretório de origem dos arquivos de rótulo JSON do Docusaurus para este bloco (por exemplo, `"i18n/en"`).                                                                                                                                       |
| `markdownOutput.style`                       | `"nested"` (padrão), `"docusaurus"` ou `"flat"`.                                                                                                                                                                        |
| `markdownOutput.docsRoot`                    | Diretório raiz da documentação de origem para o layout do Docusaurus (por exemplo, `"docs"`).                                                                                                                                                                   |
| `markdownOutput.pathTemplate`                | Caminho personalizado de saída em markdown. Substituições disponíveis: <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{LOCALE}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{basename}"}</code>, <code>{"{extension}"}</code>, <code>{"{docsRoot}"}</code>, <code>{"{relativeToDocsRoot}"}</code>. |
| `markdownOutput.jsonPathTemplate`            | Caminho personalizado de saída para arquivos de rótulo em JSON. Suporta os mesmos substitutos que `pathTemplate`.                                                                                                                                |
| `markdownOutput.flatPreserveRelativeDir`     | Para o estilo `flat`, mantém os subdiretórios de origem para que arquivos com o mesmo nome não entrem em conflito.                                                                                                                              |
| `markdownOutput.rewriteRelativeLinks` | Reescreve links relativos após a tradução (ativado automaticamente para o estilo `flat`).                                                                                                                                                 |
| `markdownOutput.linkRewriteDocsRoot` | Diretório raiz do repositório usado ao calcular os prefixos de reescrita de links planos. Geralmente mantenha como `"."`, a menos que sua documentação traduzida esteja em uma raiz de projeto diferente. |
| `markdownOutput.postProcessing` **| Transformações opcionais no**corpo do markdown traduzido (o cabeçalho YAML é preservado). Executado após a remontagem dos segmentos e a reescrita de links planos, e antes de `addFrontmatter`. |
| `segmentSplitting` **| Mesmo nível que**`markdownOutput` (por bloco `documentations[]` **). Segmentos opcionais mais granulares para extração no**translate-docs: `{ "enabled", "maxCharsPerSegment"?, "splitPipeTables"?, "splitDenseParagraphs"?, "maxLinesPerParagraphChunk"?, "splitLongLists"?, "maxListItemsPerChunk"? }` **. Quando**`enabled`** é **`true`** (padrão quando **`segmentSplitting`** é omitido), parágrafos densos, tabelas GFM com pipes (o primeiro bloco inclui cabeçalho, separador e primeira linha de dados) e listas longas são divididos; subpartes são recombinadas com uma única quebra de linha (**`tightJoinPrevious`**). Defina **`"enabled": false` para usar um segmento por bloco de corpo delimitado por linhas em branco apenas. |
| `markdownOutput.postProcessing.regexAdjustments` | Lista ordenada de `{ "description"?, "search", "replace" }`. `search` é um padrão regex (string simples usa a flag `g`, ou `/pattern/flags`). `replace` suporta substituições como `${translatedLocale}`, `${sourceLocale}`, `${sourceFullPath}`, `${translatedFullPath}`, `${sourceFilename}`, `${translatedFilename}`, `${sourceBasedir}`, `${translatedBasedir}`. |
| `markdownOutput.postProcessing.languageListBlock` | `{ "start", "end", "separator" }` — o tradutor localiza a primeira linha contendo `start` e a linha correspondente `end`, substituindo esse trecho por um seletor de idioma canônico. Os links são gerados com caminhos relativos ao arquivo traduzido; os rótulos vêm de `uiLanguagesPath` / `ui-languages.json` quando configurados, caso contrário, de `localeDisplayNames` e códigos de localidade. |
| `addFrontmatter`                  | Quando `true` (padrão quando omitido), os arquivos markdown traduzidos incluem chaves YAML: `translation_last_updated`, `source_file_mtime`, `source_file_hash`, `translation_language`, `source_file_path` e, quando pelo menos um segmento tiver metadados de modelo, `translation_models` (lista ordenada de IDs de modelos OpenRouter utilizados). Defina como `false` para pular. |

Exemplo (pipeline de README plano — caminhos de capturas de tela + invólucro opcional com lista de idiomas):

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

### `svg` **(opcional)

Caminhos de nível superior e layout para ativos SVG autônomos. A tradução é executada apenas quando**`features.translateSVG` for verdadeiro (via `translate-svg` ou o estágio SVG de `sync`).

| Campo                       | Descrição |
| --------------------------- | ----------- |
| `sourcePath`                | Um diretório ou uma matriz de diretórios escaneados recursivamente em busca de arquivos `.svg`. |
| `outputDir`                 | Diretório raiz para a saída SVG traduzida. |
| `style`                     | `"flat"` ou `"nested"` quando `pathTemplate` não estiver definido. |
| `pathTemplate`              | Caminho personalizado para saída SVG. Substituições: <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{LOCALE}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{basename}"}</code>, <code>{"{extension}"}</code>, <code>{"{relativeToSourceRoot}"}</code>. |
| `svgExtractor.forceLowercase` | Texto traduzido em letras minúsculas na remontagem do SVG. Útil para designs que dependem de rótulos totalmente em minúsculas. |

### `glossary`

| Campo          | Descrição                                                                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `uiGlossary`   | Caminho para `strings.json` - cria automaticamente um glossário a partir das traduções existentes.                                                                                                                 |
| `userGlossary` | Caminho para um CSV com colunas `Original language string` (ou `en`), `locale`, `Translation` - uma linha por termo de origem e idioma de destino (`locale` pode ser `*` para todos os alvos). |

A chave legada `uiGlossaryFromStringsJson` ainda é aceita e mapeada para `uiGlossary` ao carregar a configuração.

Gerar um arquivo CSV de glossário vazio:

```bash
npx ai-i18n-tools glossary-generate
```

---

## Referência CLI

| Comando                                                                   | Descrição                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `version`                                                                 | Exibe a versão CLI e o carimbo de data/hora da compilação (mesmas informações que `-V` / `--version` no programa raiz).                                                                                                                                                                                                  |
| `init [-t ui-markdown\|ui-docusaurus] [-o path] [--with-translate-ignore]` | Grava um arquivo de configuração inicial (inclui `concurrency`, `batchConcurrency`, `batchSize`, `maxBatchChars` e `documentations[].addFrontmatter`). `--with-translate-ignore` cria um `.translate-ignore` inicial.                                                                            |
| `extract`                                                                 | Atualiza `strings.json` a partir de literais `t("…")` / `i18n.t("…")`, descrição opcional `package.json` e entradas opcionais de manifesto `englishName` (consulte `ui.reactExtractor`). Requer `features.extractUIStrings`.                                                                                                                                                                                                    |
| `generate-ui-languages [--master <path>] [--dry-run]`                     | Escreva `ui-languages.json` em `ui.flatOutputDir` (ou `uiLanguagesPath` quando definido) usando `sourceLocale` + `targetLocales` e o `data/ui-languages-complete.json` incluído (ou `--master`). Emite avisos e cria espaços reservados `TODO` para localidades ausentes no arquivo principal. Se você tiver um manifesto existente com valores personalizados de `label` ou `englishName`, eles serão substituídos pelos padrões do catálogo principal — revise e ajuste o arquivo gerado posteriormente. |
| `translate-docs …`                                                        | Traduz arquivos markdown/MDX e JSON para cada bloco `documentations` (`contentPaths`, `jsonSource` opcional). `-j`: número máximo de localidades em paralelo; `-b`: número máximo de chamadas à API em lote por arquivo. `--prompt-format`: formato do lote (`xml` \| `json-array` \| `json-object`). Veja [Comportamento do cache e flags `translate-docs`](#cache-behaviour-and-translate-docs-flags) e [Formato do prompt em lote](#batch-prompt-format). |
| `translate-svg …`                                                         | Traduz ativos SVG autônomos configurados em `config.svg` (separado da documentação). Requer `features.translateSVG`. Mesmas ideias de cache da documentação; suporta `--no-cache` para pular leituras/escritas no SQLite nesta execução. `-j`, `-b`, `--force`, `--force-update`, `-p` / `--path`, `--dry-run`.                                                    |
| `translate-ui [--locale <code>] [--force] [--dry-run] [-j <n>]`           | Traduz apenas as strings da interface. `--force`: traduz novamente todas as entradas por localidade (ignora traduções existentes). `--dry-run`: sem gravações, sem chamadas à API. `-j`: número máximo de localidades em paralelo. Requer `features.translateUIStrings`.                                                                                 |
| `lint-source [-l <code>] [--chunk <n>] [--dry-run] [--json] [-j <n>]` **| Executa**`extract`** primeiro (requer **`features.extractUIStrings`**) para que **`strings.json`** corresponda à origem, depois faz revisão por LLM das strings da interface **origem-localidade** (ortografia, gramática). **Dicas de terminologia** vêm apenas do CSV **`glossary.userGlossary`** (mesmo escopo que **`translate-ui` — não `strings.json` / `uiGlossary`, para que textos ruins não sejam reforçados como glossário). Usa OpenRouter (`OPENROUTER_API_KEY` **). Apenas informativo (sai com**0** ao finalizar). Grava **`lint-source-results_<timestamp>.log`** em **`cacheDir`** como um relatório **legível por humanos** (resumo, problemas e linhas **OK** por string); o terminal exibe apenas contagens resumidas e problemas (sem linhas **`[ok]`** por string). Imprime o nome do arquivo de log na última linha. **`--json`**: relatório JSON totalmente legível por máquina apenas no stdout (o arquivo de log permanece legível por humanos). **`--dry-run`**: ainda executa **`extract`**, mas imprime apenas o plano do lote (sem chamadas à API). **`--chunk`**: strings por lote da API (padrão **50). `-j` **: número máximo de lotes em paralelo (padrão**`concurrency`**). Com **`--json`**, a saída no estilo humano vai para stderr. Os links usam **`path:line`** como o botão “link” das strings da interface **`editor`. |
| `export-ui-xliff [-l <codes>] [-o <dir>] [--untranslated-only] [--dry-run]` | Exporta `strings.json` para XLIFF 2.0 (uma `.xliff` por localidade de destino). `-o` / `--output-dir`: diretório de saída (padrão: mesma pasta do catálogo). `--untranslated-only`: apenas unidades sem tradução para essa localidade. Somente leitura; sem API.                                                        |
| `sync …`                                                                  | Extrai (se habilitado), depois tradução da interface, depois `translate-svg` quando `features.translateSVG` e `config.svg` estão definidos, depois tradução da documentação — a menos que pulada com `--no-ui`, `--no-svg` ou `--no-docs`. Flags compartilhadas: `-l`, `-p` / `-f`, `--dry-run`, `-j`, `-b` (apenas agrupamento da documentação), `--force` / `--force-update` (apenas documentação; mutuamente exclusivas quando a documentação é executada). A fase de documentação também repassa `--emphasis-placeholders` e `--debug-failed` (mesmo significado que `translate-docs`). `--prompt-format` não é uma flag `sync`; a etapa de documentação usa o padrão embutido (`json-array`).                         |
| `status [--max-columns <n>]`                                   | Quando `features.translateUIStrings` está ativado, exibe a cobertura da interface por localidade (`Translated` / `Missing` / `Total`). Depois exibe o status da tradução markdown por arquivo × localidade (sem filtro `--locale`; as localidades vêm da configuração). Listas grandes de localidades são divididas em tabelas repetidas com até `n` **colunas de localidades (padrão**9) para manter as linhas estreitas no terminal.                                                                                                                                                                                               |
| `cleanup [--dry-run] [--no-backup] [--backup <path>]`                  | Executa `sync --force-update` primeiro (extração, UI, SVG, docs), depois remove linhas de segmentos obsoletas (`last_hit_at` nulo / caminho do arquivo vazio); descarta linhas `file_tracking` cujo caminho de origem resolvido está ausente no disco; remove linhas de tradução cujos metadados `filepath` apontam para um arquivo ausente. Registra três contagens (obsoletas, `file_tracking` órfãs, traduções órfãs). Cria um backup do SQLite com carimbo de data e hora no diretório de cache, a menos que `--no-backup`. |
| `editor [-p <port>] [--no-open]`                                          | Inicia um editor da web local para o cache, `strings.json` e CSV do glossário. `--no-open` **: não abre automaticamente o navegador padrão.<br><br>**Observação: Se você editar uma entrada no editor de cache, deve executar um `sync --force-update` para reescrever os arquivos de saída com a entrada de cache atualizada. Além disso, se o texto de origem mudar posteriormente, a edição manual será perdida, pois uma nova chave de cache é gerada. |
| `glossary-generate [-o <path>]`                                           | Grava um modelo `glossary-user.csv` vazio. `-o`: substitui o caminho de saída (padrão: `glossary.userGlossary` da configuração, ou `glossary-user.csv`).                                                                                                                                                |

Todos os comandos aceitam `-c <path>` para especificar um arquivo de configuração não padrão, `-v` para saída detalhada e `-w` / `--write-logs [path]` para duplicar a saída do console em um arquivo de log (caminho padrão: dentro do diretório raiz `cacheDir`). O programa principal também suporta `-V` / `--version` e `-h` / `--help`; `ai-i18n-tools help [command]` mostra a mesma ajuda por comando que `ai-i18n-tools <command> --help`.

---

## Variáveis de ambiente

| Variável               | Descrição                                                |
| ---------------------- | ---------------------------------------------------------- |
| `OPENROUTER_API_KEY` **|**Obrigatório.** Sua chave de API do OpenRouter.                     |
| `OPENROUTER_BASE_URL`  | Substitui a URL base da API.                                 |
| `I18N_SOURCE_LOCALE`   | Substitui `sourceLocale` em tempo de execução.                        |
| `I18N_TARGET_LOCALES`  | Códigos de localidade separados por vírgula para substituir `targetLocales`.  |
| `I18N_LOG_LEVEL`       | Nível do logger (`debug`, `info`, `warn`, `error`, `silent`). |
| `NO_COLOR`             | Quando `1`, desativa as cores ANSI na saída de log.            |
| `I18N_LOG_SESSION_MAX` | Número máximo de linhas mantidas por sessão de log (padrão `5000`).           |
