<a id="ai-i18n-tools-getting-started"></a>
# ai-i18n-tools: Primeiros Passos

`ai-i18n-tools` fornece dois fluxos de trabalho independentes e compostos:

- **Fluxo de trabalho 1 - Tradução de interface**: extrai chamadas `t("…")` de qualquer fonte JS/TS, traduz via OpenRouter e gera arquivos JSON planos por localidade, prontos para uso com i18next.
- **Fluxo de trabalho 2 - Tradução de documentos**: traduz arquivos markdown (MDX) e arquivos JSON de rótulos do Docusaurus para qualquer número de localidades, com cache inteligente. Ativos **SVG** usam `features.translateSVG`, o bloco `svg` de nível superior e `translate-svg` (veja [referência CLI](#cli-reference)).

Ambos os fluxos de trabalho utilizam o OpenRouter (qualquer LLM compatível) e compartilham um único arquivo de configuração.

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Tabela de Conteúdos**

- [Instalação](#installation)
- [Início Rápido](#quick-start)
  - [Scripts recomendados `package.json`](#recommended-packagejson-scripts)
- [Fluxo de trabalho 1 - Tradução de interface](#workflow-1---ui-translation)
  - [Etapa 1: Inicializar](#step-1-initialise)
  - [Etapa 2: Extrair strings](#step-2-extract-strings)
  - [Etapa 3: Traduzir strings da interface](#step-3-translate-ui-strings)
  - [Exportar para XLIFF 2.0 (opcional)](#exporting-to-xliff-20-optional)
  - [Etapa 4: Integrar i18next em tempo de execução](#step-4-wire-i18next-at-runtime)
  - [Usar `t()` no código-fonte](#using-t-in-source-code)
  - [Interpolação](#interpolation)
  - [Plurais cardinais (`plurals: true`)](#cardinal-plurals-plurals-true)
  - [Interface de troca de idioma](#language-switcher-ui)
  - [Idiomas RTL](#rtl-languages)
- [Fluxo de trabalho 2 - Tradução de documentos](#workflow-2---document-translation)
  - [Etapa 1: Inicializar para documentação](#step-1-initialise-for-documentation)
  - [Etapa 2: Traduzir documentos](#step-2-translate-documents)
    - [Markdown complexo e falhas nas verificações de qualidade](#complex-markdown-and-failed-quality-checks)
    - [Comportamento do cache e flags `translate-docs`](#cache-behaviour-and-translate-docs-flags)
    - [Formato de prompt em lote](#batch-prompt-format)
    - [Dedupe de segmentos e caminhos no SQLite](#segment-dedupe-and-paths-in-sqlite)
  - [Layouts de saída](#output-layouts)
    - [Links âncora no layout plano](#anchor-links-in-flat-layout)
    - [Placeholders `pathTemplate` / `jsonPathTemplate`](#pathtemplate--jsonpathtemplate-placeholders)
- [Fluxo de trabalho combinado (UI + Docs)](#combined-workflow-ui--docs)
  - [Fluxo de trabalho de documentação mista (Docusaurus + plano)](#mixed-documentation-workflow-docusaurus--flat)
- [Editor de Cache de Tradução](#translation-cache-editor)
  - [Falhas (tradução de documentos)](#failures-document-translation)
    - [Quando usá-lo](#when-to-use-it)
    - [Por que edições na origem são importantes](#why-source-edits-matter)
    - [Como usar a aba](#how-to-use-the-tab)
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

<a id="installation"></a>
## Instalação

O pacote publicado é **somente ESM**. Use `import`/`import()` no Node.js ou no seu empacotador; não use `require('ai-i18n-tools')`.

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

O ai-i18n-tools inclui seu próprio extrator de strings. Se você anteriormente usava `i18next-scanner`, `babel-plugin-i18next-extract` ou ferramentas semelhantes, pode remover essas dependências de desenvolvimento após a migração.

Defina sua chave de API do OpenRouter:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Ou crie um arquivo `.env` na raiz do projeto:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

<a id="quick-start"></a>
## Início Rápido

O modelo padrão `init` (`ui-markdown`) habilita apenas a extração e tradução da **interface (UI)**. O modelo `ui-docusaurus` habilita a tradução de **documentos** (`translate-docs`). Use `sync` quando desejar um único comando que execute extração, tradução da interface, tradução opcional de SVG autônomo e tradução de documentação de acordo com sua configuração.

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

<a id="recommended-packagejson-scripts"></a>
### Scripts recomendados do `package.json`

Com o pacote instalado localmente, você pode usar os comandos da CLI diretamente em scripts (sem necessidade do `npx`):

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

<a id="workflow-1---ui-translation"></a>
## Fluxo de trabalho 1 - Tradução da Interface (UI)

Projetado para qualquer projeto JS/TS que use i18next: aplicativos React, Next.js (componentes cliente e servidor), serviços Node.js, ferramentas CLI.

<a id="step-1-initialise"></a>
### Etapa 1: Inicializar

```bash
npx ai-i18n-tools init
```

Isso grava `ai-i18n-tools.config.json` com o modelo `ui-markdown`. Edite-o para definir:

- `sourceLocale` - o código BCP-47 do seu idioma de origem (por exemplo, `"en-GB"`). **Deve corresponder** ao `SOURCE_LOCALE` exportado do seu arquivo de configuração de i18n em tempo de execução (`src/i18n.ts` / `src/i18n.js`).
- `targetLocales` - array de códigos BCP-47 para os idiomas de destino (por exemplo, `["de", "fr", "pt-BR"]`). Execute `generate-ui-languages` para criar o manifesto `ui-languages.json` a partir dessa lista.
- `ui.sourceRoots` - diretórios a serem verificados em busca de chamadas `t("…")` (por exemplo, `["src/"]`).
- `ui.stringsJson` - onde gravar o catálogo principal (por exemplo, `"src/locales/strings.json"`).
- `ui.flatOutputDir` - onde gravar `de.json`, `pt-BR.json`, etc. (por exemplo, `"src/locales/"`).
- `ui.preferredModel` (opcional) - ID do modelo OpenRouter a tentar **primeiro** apenas para `translate-ui`; em caso de falha, a CLI continua com `openrouter.translationModels` (ou legado `defaultModel` / `fallbackModel`) em ordem, ignorando duplicatas.

<a id="step-2-extract-strings"></a>
### Etapa 2: Extrair strings

```bash
npx ai-i18n-tools extract
```

Verifica todos os arquivos JS/TS em `ui.sourceRoots` em busca de chamadas `t("literal")` e `i18n.t("literal")`. Grava (ou mescla em) `ui.stringsJson`.

O scanner é configurável: adicione nomes personalizados de funções via `ui.reactExtractor.funcNames`.

<a id="step-3-translate-ui-strings"></a>
### Etapa 3: Traduzir strings da interface

```bash
npx ai-i18n-tools translate-ui
```

Lê `strings.json`, envia lotes ao OpenRouter para cada localidade de destino, grava arquivos JSON planos (`de.json`, `fr.json`, etc.) em `ui.flatOutputDir`. Quando `ui.preferredModel` está definido, esse modelo é tentado antes da lista ordenada em `openrouter.translationModels` (a tradução de documentos e outros comandos ainda usam apenas `openrouter`).

Para cada entrada, `translate-ui` armazena o **ID do modelo OpenRouter** que traduziu com sucesso cada localidade em um objeto opcional `models` (com as mesmas chaves de localidade de `translated`). Strings editadas no comando local `editor` são marcadas com o valor sentinela `user-edited` em `models` para aquela localidade. Os arquivos planos por localidade em `ui.flatOutputDir` permanecem apenas como **string de origem → tradução**; eles não incluem `models` (assim, os pacotes em tempo de execução permanecem inalterados).

> **Observação sobre o uso do Editor de Cache:** Se você editar uma entrada no editor de cache, precisará executar um `sync --force-update` (ou o comando equivalente `translate` com `--force-update`) para reescrever os arquivos de saída com a entrada de cache atualizada. Além disso, tenha em mente que, se o texto de origem for alterado posteriormente, sua edição manual será perdida, pois uma nova chave de cache (hash) será gerada para a nova string de origem.

<a id="exporting-to-xliff-20-optional"></a>
### Exportar para XLIFF 2.0 (opcional)

Para entregar strings da interface a um fornecedor de tradução, TMS ou ferramenta CAT, exporte o catálogo como **XLIFF 2.0** (um arquivo por localidade de destino). Este comando é **somente leitura**: não modifica `strings.json` nem chama nenhuma API.

```bash
npx ai-i18n-tools export-ui-xliff
```

Por padrão, os arquivos são gravados ao lado de `ui.stringsJson`, com nomes como `strings.de.xliff`, `strings.pt-BR.xliff` (nome base do seu catálogo + localidade + `.xliff`). Use `-o` / `--output-dir` para gravar em outro local. Traduções existentes de `strings.json` aparecem em `<target>`; localidades ausentes usam `state="initial"` sem `<target>`, para que as ferramentas possam preenchê-las. Use `--untranslated-only` para exportar apenas unidades que ainda precisam de tradução para cada localidade (útil para lotes enviados a fornecedores). `--dry-run` exibe os caminhos sem gravar arquivos.

<a id="step-4-wire-i18next-at-runtime"></a>
### Etapa 4: Configurar o i18next em tempo de execução

Crie seu arquivo de configuração i18n usando os utilitários exportados por `'ai-i18n-tools/runtime'`:

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

// initialise i18n with the default options
void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));

// set up the key-as-default translation
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

<!--
  Translate-docs note: paragraphs here stack many `bold` / `` `code` `` patterns (nested backticks, long sentences).
  Some target locales fail AST-style validation; see "Complex Markdown and failed quality checks" under Workflow 2 — simplify source rather than forcing literal markup parity.
-->

**Mantenha três valores alinhados:** `sourceLocale` em `ai-i18n-tools.config.json`, `SOURCE_LOCALE` neste arquivo e o JSON plano de plurais que `translate-ui` escreve como `{sourceLocale}.json` no seu diretório de saída plano (geralmente `public/locales/`). Use o mesmo nome base no `import` estático (exemplo acima: `en-GB` → `en-GB.json`). O campo `lng` em `sourcePluralFlatBundle` deve ser igual a `SOURCE_LOCALE`. Os caminhos estáticos ES `import` não podem usar variáveis; se você alterar o idioma de origem, atualize `SOURCE_LOCALE` e o caminho de importação juntos. Alternativamente, carregue esse arquivo com um `import(\`./public/locales/${SOURCE_LOCALE}.json\`)`, `fetch` ou `readFileSync` para que o caminho seja construído a partir de `SOURCE_LOCALE`.

O trecho usa `./locales/…` e `./public/locales/…` como se `i18n` estivesse ao lado dessas pastas. Se seu arquivo estiver em `src/` (comum), use `../locales/…` e `../public/locales/…` para que os imports resolvam os mesmos caminhos que `ui.stringsJson`, `uiLanguagesPath` e `ui.flatOutputDir`.

Importe `i18n.js` antes do React renderizar (por exemplo, no início do seu ponto de entrada). Quando o usuário alterar o idioma, chame `await loadLocale(code)` e depois `i18n.changeLanguage(code)`.

Mantenha `localeLoaders` **alinhado com a configuração** derivando-os de `ui-languages.json` usando `makeLocaleLoadersFromManifest` (isso filtra `SOURCE_LOCALE` usando a mesma normalização que `makeLoadLocale`). Quando você adicionar um idioma a `targetLocales` e executar `generate-ui-languages`, o manifesto será atualizado e seus carregadores rastrearão a mudança automaticamente — não é necessário manter um mapa fixo separado.

Se seus pacotes JSON estiverem em `public/` (configuração típica do Next.js), implemente cada carregador para buscar o arquivo do seu caminho público, por exemplo:

```js
(code) => () => fetch(`/locales/${code}.json`).then(res => res.json())
```

Isso permite que o navegador carregue JSON estático.

Para CLIs Node sem empacotador, use `readFileSync` dentro de um pequeno utilitário `makeFileLoader` que leia e analise o arquivo JSON para cada código.

`SOURCE_LOCALE` é exportado para que qualquer outro arquivo que precise dele (por exemplo, um seletor de idioma) possa importá-lo diretamente de `'./i18n'`. Se você estiver migrando uma configuração i18next existente, substitua strings fixas de idioma de origem (por exemplo, verificações `'en-GB'` espalhadas pelos componentes) por imports de `SOURCE_LOCALE` do seu arquivo de inicialização i18n.

Imports nomeados (`import { defaultI18nInitOptions, … } from 'ai-i18n-tools/runtime'`) funcionam da mesma forma se você preferir não usar a exportação padrão.

`aiI18n.defaultI18nInitOptions(sourceLocale)` (ou `defaultI18nInitOptions(sourceLocale)` quando importado por nome) retorna as opções padrão para configurações com chave como valor padrão:

- `parseMissingKeyHandler` retorna a própria chave, então strings não traduzidas exibem o texto original.
- `nsSeparator: false` permite chaves que contenham dois pontos.
- `interpolation.escapeValue: false` - seguro desativar: o React escapa os valores por si só, e a saída Node.js/CLI não possui HTML para escapar.

`setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` é a configuração **recomendada** para projetos ai-i18n-tools: aplica o corte de chaves + fallback de interpolação <code>{"{{var}}"}</code> no idioma de origem (comportamento idêntico ao do `wrapI18nWithKeyTrim` de nível inferior), opcionalmente mescla chaves plurais com sufixo `translate-ui` via `{sourceLocale}.json` e `addResourceBundle`, depois instala o `wrapT` compatível com plurais a partir do seu `strings.json`. Esse arquivo agrupado deve ser o JSON plano plural do seu idioma de origem **configurado** — o mesmo `sourceLocale` usado em `ai-i18n-tools.config.json` e `SOURCE_LOCALE` no seu arquivo de inicialização i18n (veja a Etapa 4 acima). Omita `sourcePluralFlatBundle` apenas durante a inicialização (incorpore-o assim que `translate-ui` emitir `{sourceLocale}.json`). `wrapI18nWithKeyTrim` sozinho está **obsoleto** para código de aplicação — use `setupKeyAsDefaultT` em vez disso.

`makeLoadLocale(i18n, loaders, sourceLocale)` retorna uma função `loadLocale(lang)` assíncrona que importa dinamicamente o pacote JSON de um idioma e o registra no i18next.

<a id="using-t-in-source-code"></a>
### Usando `t()` no código-fonte

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

- Apenas esses formulários são extraídos: `t("…")`, `t('…')`, `t(`…`)`, `i18n.t("…")`.
- A chave deve ser uma **string literal** — nada de variáveis ou expressões como chave.
- Não use template literals para a chave: <code>{'t(`Hello ${name}`)'}</code> não é extraível.

<a id="interpolation"></a>
### Interpolação

Use a interpolação nativa do i18next com segundo argumento para marcadores de posição <code>{"{{var}}"}</code>:

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

O comando extract analisa o **segundo argumento** quando ele é um objeto literal simples e lê flags exclusivas para ferramentas, como `plurals: true` e `zeroDigit` (veja **Plurais cardinais** abaixo). Para strings comuns, apenas a chave literal é usada para gerar o hash; as opções de interpolação ainda são repassadas ao i18next em tempo de execução.

Se o seu projeto usa um utilitário personalizado de interpolação (por exemplo, chamar `t('key')` e depois passar o resultado por uma função de template como `interpolateTemplate(t('Hello {{name}}'), { name })`), `setupKeyAsDefaultT` (via `wrapI18nWithKeyTrim`) torna isso desnecessário — ele aplica a interpolação <code>{"{{var}}"}</code> mesmo quando o idioma de origem retorna a chave crua. Migre os pontos de chamada para `t('Hello {{name}}', { name })` e remova o utilitário personalizado.

<a id="cardinal-plurals-plurals-true"></a>
### Plurais cardinais (`plurals: true`)

Use o **mesmo literal** que deseja como texto padrão para desenvolvedores e passe `plurals: true` para que extract + `translate-ui` tratem a chamada como um único **grupo de plural cardinal** (formas estilo JSON v4 do i18next: `_zero` … `_other`).

```tsx
{t('{{count}} items in your cart', { plurals: true, count: n })}
```

- `zeroDigit` (opcional) — apenas para ferramentas; **não** lido pelo i18next. Quando `true`, as sugestões priorizam um `0` arábico literal na string `_zero` para cada idioma em que essa forma existir; quando `false` ou omitido, usa-se a formulação natural de zero. Remova essas chaves antes de chamar `i18next.t` (veja `wrapT` abaixo).

**Validação:** Se a mensagem contiver **dois ou mais** marcadores de posição `{{…}}` distintos, **um deles deve ser `{{count}}`** (o eixo do plural). Caso contrário, `extract` **falha** com uma mensagem clara indicando arquivo e linha.

**Dois contadores independentes** (por exemplo, seções e páginas) não podem compartilhar uma mesma mensagem no plural — use **duas** chamadas `t()` (cada uma com `plurals: true` e seu próprio `count`) e concatene na interface.

**Em** grupos plurais `strings.json`, use **uma linha por hash** com `"plural": true`, o literal original em `source` e `translated[locale]` como um objeto mapeando categorias cardinais (`zero`, `one`, `two`, `few`, `many`, `other`) para strings nesse idioma.

**JSON plano por idioma:** Linhas não plurais permanecem como **frase de origem → tradução**. Linhas plurais são emitidas como `<groupId>_original` (igual a `source`, para referência) e `<groupId>_<form>` para cada sufixo, para que o i18next resolva plurais nativamente. `translate-ui` também gera `{sourceLocale}.json` contendo **apenas** chaves planas de plurais (carregue este pacote para o idioma de origem para que chaves com sufixo sejam resolvidas; strings simples ainda usam a chave como padrão). Para cada idioma de destino, as chaves com sufixo emitidas correspondem a `Intl.PluralRules` para aquele idioma (`requiredCldrPluralForms`): se `strings.json` omitiu uma categoria porque ela coincidiu com outra após compactação (por exemplo, `many` árabe igual a `other`), `translate-ui` ainda escreve todos os sufixos necessários no arquivo plano copiando de uma string alternativa de fallback, garantindo que a busca em tempo de execução nunca falhe por falta de chave.

Tempo de execução (`ai-i18n-tools/runtime`): **Chame** `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle })` — ele executa `wrapI18nWithKeyTrim`, registra o pacote opcional de plurais `translate-ui` `{sourceLocale}.json`, e então `wrapT` usando `buildPluralIndexFromStringsJson(stringsJson)`. `wrapT` remove `plurals` / `zeroDigit`, reescreve a chave para o ID do grupo quando necessário e repassa `count` (opcional: se houver um único marcador de posição não-`{{count}}`, `count` é copiado dessa opção numérica).

**Ambientes mais antigos:** `Intl.PluralRules` é necessário para as ferramentas e para comportamento consistente; use polyfill se seu alvo forem navegadores muito antigos.

**Não disponível na v1:** plurais ordinais (`_ordinal_*`, `ordinal: true`), plurais por intervalo, pipelines exclusivos ICU.

<a id="language-switcher-ui"></a>
### Interface do seletor de idioma

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

`getUILanguageLabelNative(lang)` - mostra `englishName / label` (sem chamada `t()` em cada linha). Adequado para menus de cabeçalho onde você deseja que o nome nativo seja visível.

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

<a id="rtl-languages"></a>
### Idiomas RTL

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

<a id="workflow-2---document-translation"></a>
## Fluxo de trabalho 2 - Tradução de documentos

Projetado para documentação em markdown, sites Docusaurus e arquivos de rótulos JSON. Ativos SVG autônomos são traduzidos por meio de [`translate-svg`](#cli-reference) quando `features.translateSVG` está habilitado e o bloco `svg` no nível superior está definido — e não por meio de `documentations[].contentPaths`.

<a id="step-1-initialise-for-documentation"></a>
### Etapa 1: Inicializar para documentação

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

Edite o `ai-i18n-tools.config.json` gerado:

- `sourceLocale` - idioma de origem (deve corresponder a `defaultLocale` em `docusaurus.config.js`).
- `targetLocales` - array de códigos de idioma BCP-47 (por exemplo, `["de", "fr", "es"]`).
- `cacheDir` - diretório compartilhado de cache SQLite para todos os pipelines de documentação (e diretório padrão de logs para `--write-logs`).
- `documentations` - array de blocos de documentação. Cada bloco tem `description`, `contentPaths`, `outputDir`, opcional `jsonSource`, `markdownOutput`, opcional `segmentSplitting`, `targetLocales`, `addFrontmatter`, etc.
- `documentations[].description` - nota opcional para mantenedores (o que este bloco abrange). Quando definido, aparece no título `translate-docs` (`🌐 …: translating …`) e nos cabeçalhos das seções `status`.
- `documentations[].contentPaths` - diretórios ou arquivos fonte em markdown/MDX (veja também `documentations[].jsonSource` para rótulos JSON).
- `documentations[].outputDir` - raiz de saída traduzida para esse bloco.
- `documentations[].markdownOutput.style` - `"nested"` (padrão), `"docusaurus"` ou `"flat"` (veja [Layouts de saída](#output-layouts)).

<a id="step-2-translate-documents"></a>
### Etapa 2: Traduzir documentos

```bash
npx ai-i18n-tools translate-docs
```

Isso traduz todos os arquivos em `contentPaths` de cada bloco `documentations` para todos os idiomas de documentação efetivos (união dos `targetLocales` de cada bloco, quando definidos; caso contrário, `targetLocales` raiz). Segmentos já traduzidos são recuperados do cache SQLite — apenas segmentos novos ou alterados são enviados ao LLM.

Para traduzir um único idioma:

```bash
npx ai-i18n-tools translate-docs --locale de
```

Para verificar o que precisa ser traduzido:

```bash
npx ai-i18n-tools status
```

<a id="complex-markdown-and-failed-quality-checks"></a>
#### Markdown complexo e falhas em verificações de qualidade

`translate-docs` verifica se cada segmento traduzido preserva a estrutura do markdown (incluindo ênfases analisadas a partir do documento). Parágrafos que acumulam muitos spans `bold` em torno de `` `inline code` ``, aninham crases dentro de negrito (por exemplo, literais de modelo como `` `fetch(\`/locales/${code}.json\`)` ``), ou entrelaçam negrito e código em uma única frase longa são frágeis: alguns idiomas exigem ordem de palavras diferente, o que pode alterar como `**` e `` ` `` se alinham após a tradução e acionar erros na CLI como `AST mismatch`.

**Se você se deparar com esse tipo de falha de validação, prefira simplificar o texto no idioma original** — divida o parágrafo, mova um exemplo para um bloco de código com bordas, ou descreva a mesma ideia com menos pares sobrepostos de negrito/código — em vez de esperar que todos os modelos e idiomas reproduzam perfeitamente marcações embutidas densas. Em outras partes desta página (notadamente nas notas da Etapa 4 sobre `SOURCE_LOCALE`, loaders e caminhos `public/`), a formatação é intencionalmente realista; quando reutilizar redações semelhantes em sua própria documentação, mantenha-a mais simples ao traduzir amplamente.

Para ver **quais segmentos falharam**, com que frequência e as mensagens armazenadas de **qualidade / erro**, use a aba **Falhas** do Editor de Cache de Tradução ([Editor de Cache de Tradução → Falhas](#translation-cache-editor-failures)).

<a id="cache-behaviour-and-translate-docs-flags"></a>
#### Comportamento do cache e flags `translate-docs`

A CLI mantém o **rastreamento de arquivos** no SQLite (hash da fonte por arquivo × localidade) e linhas de **segmento** (hash × localidade por bloco traduzível). Uma execução normal ignora completamente um arquivo quando o hash rastreado corresponde à fonte atual **e** o arquivo de saída já existe; caso contrário, processa o arquivo e usa o cache de segmentos, de modo que texto inalterado não chame a API.

| Flag                          | Efeito                                                                                                                                                                                                                                                                  |
|-------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| *(padrão)*                   | Ignorar arquivos inalterados quando o rastreamento e a saída em disco coincidirem; usar cache de segmentos para o restante.                                                                                                                                                                              |
| `-l, --locale <codes>`        | Localidades de destino separadas por vírgula (quando omitidas, os padrões correspondem à união da `targetLocales` raiz e de cada `targetLocales` opcional em blocos `documentations[]`).                                                                                                                                                          |
| `-p, --path` / `-f, --file`   | Traduzir apenas markdown/JSON sob este caminho (relativo ao projeto ou absoluto); `--file` é um alias para `--path`.                                                                                                                                                         |
| `--dry-run`                   | Sem gravações de arquivos e sem chamadas à API.                                                                                                                                                                                                                                        |
| `--type <kind>`               | Restringir a `markdown` ou `json` (caso contrário, ambos quando habilitados na configuração).                                                                                                                                                                                               |
| `--json-only` / `--no-json`   | Traduzir apenas arquivos de rótulos JSON, ou ignorar JSON e traduzir apenas markdown.                                                                                                                                                                                              |
| `-j, --concurrency <n>`       | Número máximo de localidades de destino em paralelo (padrão da configuração ou valor padrão embutido na CLI).                                                                                                                                                                                              |
| `-b, --batch-concurrency <n>` | Número máximo de chamadas paralelas à API por lote por arquivo (documentos; padrão da configuração ou CLI).                                                                                                                                                                                               |
| `--emphasis-placeholders`     | Ocultar marcadores de ênfase do markdown como marcadores de posição antes da tradução (opcional; padrão desativado).                                                                                                                                                                              |
| `--debug-failed`              | Gravar logs detalhados `FAILED-TRANSLATION` em `cacheDir` quando a validação falhar.                                                                                                                                                                                        |
| `--force-update`              | Reprocessa todos os arquivos correspondentes (extrai, remonta, grava saídas), mesmo quando o rastreamento de arquivos os ignoraria. **O cache de segmentos ainda se aplica** — segmentos inalterados não são enviados ao LLM.                                                                                    |
| `--force`                     | Limpa o rastreamento de arquivos para cada arquivo processado e **não lê** o cache de segmentos para tradução via API (retradução completa). Os novos resultados ainda são **gravados** no cache de segmentos.                                                                                 |
| `--stats`                     | Exibe contagens de segmentos, contagem de arquivos rastreados e totais de segmentos por localidade, depois encerra.                                                                                                                                                                                    |
| `--clear-cache [locale]`      | Exclui traduções em cache (e o rastreamento de arquivos): todas as localidades ou uma única localidade, depois encerra.                                                                                                                                                                             |
| `--prompt-format <mode>`      | Define como cada **lote** de segmentos é enviado ao modelo e analisado (`xml`, `json-array` ou `json-object`). Padrão `json-array`. Não altera extração, marcadores de posição, validação, cache ou comportamento de fallback — consulte [Formato do prompt por lote](#batch-prompt-format). |

Você não pode combinar `--force` com `--force-update` (são mutuamente exclusivos).

<a id="batch-prompt-format"></a>
#### Formato do prompt por lote

`translate-docs` envia segmentos traduzíveis ao OpenRouter em **lotes** (agrupados por `batchSize` / `maxBatchChars`). A flag `--prompt-format` altera apenas o **formato de transmissão** desse lote; tokens `PlaceholderHandler`, verificações AST em markdown, chaves de cache SQLite e fallback por segmento quando a análise do lote falha permanecem inalterados.

| Modo                       | Mensagem do usuário                                                           | Resposta do modelo                                                 |
|----------------------------|------------------------------------------------------------------------|-------------------------------------------------------------|
| `xml`                  | Pseudo-XML: um `<seg id="N">…</seg>` por segmento (com escape XML). | Apenas blocos `<t id="N">…</t>`, um por índice de segmento.       |
| `json-array` (padrão) | Um array JSON de strings, uma entrada por segmento em ordem.               | Um array JSON do **mesmo comprimento** (mesma ordem).           |
| `json-object`          | Um objeto JSON `{"0":"…","1":"…",…}` indexado pelo índice do segmento.            | Um objeto JSON com as **mesmas chaves** e valores traduzidos. |

O cabeçalho da execução também exibe `Batch prompt format: …`, para que você possa confirmar o modo ativo. Arquivos de rótulos JSON (`jsonSource`) e lotes SVG autônomos usam a mesma configuração quando essas etapas são executadas como parte de `translate-docs` (ou da fase de docs do `sync` — `sync` não expõe essa flag; o padrão é `json-array`).

<a id="segment-dedupe-and-paths-in-sqlite"></a>
#### Deduplicação de segmentos e caminhos no SQLite

- As linhas de segmento são indexadas globalmente por `(source_hash, locale)` (hash = conteúdo normalizado). Texto idêntico em dois arquivos compartilha uma única linha; `translations.filepath` é metadado (último escritor), não uma entrada de cache adicional por arquivo.
- `file_tracking.filepath` usa chaves com namespace: `doc-block:{index}:{relPath}` por bloco `documentations` (`relPath` é caminho posix relativo à raiz do projeto: caminhos markdown conforme coletados; **arquivos de rótulos JSON usam o caminho relativo ao diretório atual do processo (cwd)**, ex: `docs-site/i18n/en/code.json`, para que a limpeza possa resolver o arquivo real), e `svg-assets:{relPath}` para ativos SVG autônomos sob `translate-svg`.
- `translations.filepath` armazena caminhos posix relativos ao cwd para segmentos markdown, JSON e SVG (SVG usa o mesmo formato de caminho que outros ativos; o prefixo `svg-assets:…` é **apenas** em `file_tracking`).
- Após uma execução, `last_hit_at` é limpo apenas para linhas de segmento **no mesmo escopo de tradução** (respeitando `--path` e tipos habilitados) que não foram acessadas, portanto uma execução filtrada ou apenas de docs não marca arquivos não relacionados como obsoletos.

<a id="output-layouts"></a>
### Layouts de saída

`"nested"` (padrão quando omitido) — espelha a árvore de origem sob `{outputDir}/{locale}/` (ex: `docs/guide.md` → `i18n/de/docs/guide.md`).

`"docusaurus"` — coloca arquivos que estão sob `docsRoot` em `i18n/<locale>/docusaurus-plugin-content-docs/current/<relativeToDocsRoot>`, compatível com o layout usual de i18n do Docusaurus. Defina `documentations[].markdownOutput.docsRoot` como a raiz do seu diretório de documentação (por exemplo, `"docs"`).

```text
docs/guide.md         → i18n/de/docusaurus-plugin-content-docs/current/guide.md
i18n/en/sidebar.json  → i18n/de/sidebar.json  (JSON label files)
```

`"flat"` - coloca os arquivos traduzidos ao lado dos originais com sufixo de localidade, ou em um subdiretório. Links relativos entre páginas são reescritos automaticamente.

```text
docs/guide.md → i18n/guide.de.md
```

<a id="anchor-links-in-flat-layout"></a>
#### Links de âncora no layout plano

A saída plana reescreve **caminhos relativos** entre páginas para cada localidade (`guide.md` → `guide.de.md`). **Links de âncora** — a forma usual em markdown com `#` após o caminho — saltam para uma seção dentro do arquivo de destino:

```markdown
Read the [installation checklist](../setup.md#first-run) before you deploy.
```

Aqui, o destino do link é `setup.md`, e `#first-run` é a âncora: deve rolar até o título correto dentro desse arquivo.

**Por que os links de âncora precisam de atenção**

- `rewriteRelativeLinks` corrige o **nome do arquivo** para cada localidade (`setup.md` → `setup.de.md`).
- Muitos renderizadores derivam o slug `#` do **texto visível do título**. Após a tradução, os títulos diferem por localidade, então um slug gerado automaticamente pode mudar enquanto o link reescrito ainda pode dizer `#first-run` — ou seu âncora em inglês `#…` não corresponde mais ao slug que o renderizador cria a partir do título traduzido.
- Resultado: os leitores chegam ao **arquivo** certo, mas na **linha errada**, ou o navegador não encontra um título correspondente.

**O que fazer**

1. Execute `ai-i18n-tools write-heading-ids` em sua documentação **original** `.md` / `.mdx` **antes** de `translate-docs` (mesmo `documentations[]` / `contentPaths` de costume). Ele insere âncoras HTML explícitas na linha anterior a cada título, garantindo que os valores `id` sejam compartilhados por todas as versões traduzidas.
2. Aponte seus **links de âncora** em markdown para esses IDs estáveis, por exemplo, `[label](../other.md#section-id)`, onde `section-id` corresponde à âncora escrita pela ferramenta — não apenas uma suposição baseada em palavras em inglês.

**Exemplo**

`docs/overview.md`:

```markdown
See [TLS setup](../security.md#tls-configuration) for certificate steps.
```

`docs/security.md` após `write-heading-ids` (simplificado):

```markdown
<a id="tls-configuration"></a>
## TLS configuration

Your CA and cert steps…
```

Após `translate-docs`, caminhos de arquivos e âncoras `#…` permanecem alinhados em todos os arquivos de localidade, por exemplo:

```markdown
Siehe [TLS-Einrichtung](../security.de.md#tls-configuration) für die Zertifikatsschritte.
```

A âncora `#tls-configuration` é a mesma em todas as localidades porque o `id` é fixo na fonte; apenas o **texto** do título e o **rótulo** do link são traduzidos.

<a id="markdown-output-path-template-placeholders"></a>
#### Placeholders `pathTemplate` / `jsonPathTemplate`

Substitua onde os arquivos traduzidos são gravados definindo `documentations[].markdownOutput.pathTemplate` (markdown e MDX) ou `jsonPathTemplate` (arquivos de rótulos JSON). Ambos aceitam os mesmos placeholders. Os caminhos resolvidos devem permanecer dentro do `outputDir` desse bloco (a CLI rejeita caminhos que saem dele).

Se você usar um `pathTemplate` personalizado, `rewriteRelativeLinks` assume como padrão `false` a menos que você o defina explicitamente — a reescrita de links no estilo plano é feita para o layout `flat` embutido.

| Placeholder | Função | Exemplo |
|-------------|------|---------|
| `{outputDir}` | Caminho absoluto resolvido da `outputDir` deste bloco de documentação | `/home/acme/repo/i18n` |
| `{locale}` | Código da localidade de destino (mesmo formato usado na configuração / CLI) | `de`, `pt-BR` |
| `{LOCALE}` | Mesma localidade em maiúsculas | `DE`, `PT-BR` |
| `{relPath}` | Caminho do arquivo de origem relativo à raiz do projeto, formato POSIX `/` | `docs/guide.md`, `README.md` |
| `{stem}` | Nome do arquivo **sem** extensão | `guide` para `docs/guide.md` |
| `{basename}` | Nome do arquivo **com** extensão | `guide.md` |
| `{extension}` | Extensão **incluindo** o ponto | `.md`, `.mdx` |
| `{docsRoot}` | Caminho absoluto resolvido de `markdownOutput.docsRoot` (padrão `docs` se omitido) | `/home/acme/repo/docs` |
| `{relativeToDocsRoot}` | `{relPath}` com prefixo `docsRoot` correspondente removido quando os caminhos coincidem (POSIX); caso contrário, inalterado | `docs/guide.md` (comum); `guide.md` somente quando a remoção é aplicada |

**Exemplo**

Trecho de configuração:

```json
{
  "outputDir": "i18n",
  "markdownOutput": {
    "pathTemplate": "{outputDir}/{locale}/{relPath}"
  }
}
```

Para a localidade `de` e origem `docs/guide.md`, com raiz do projeto `/home/acme/repo` e `outputDir` resolvido para `/home/acme/repo/i18n`, o caminho expandido é:

```text
/home/acme/repo/i18n/de/docs/guide.md
```

Um padrão no estilo `flat` que mantém apenas o nome do arquivo pode usar `{stem}` e `{extension}`, por exemplo `{outputDir}/{stem}.{locale}{extension}`, o que resulta em `…/guide.de.md` sob o `outputDir` resolvido.

---

<a id="combined-workflow-ui--docs"></a>
## Fluxo de trabalho combinado (UI + Documentação)

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

`glossary.uiGlossary` direciona a tradução de documentos ao mesmo catálogo `strings.json` da interface, mantendo a terminologia consistente; `glossary.userGlossary` adiciona substituições CSV para termos do produto.

Execute `npx ai-i18n-tools sync` para rodar um pipeline: **extrair** strings da interface (se `features.extractUIStrings`), **traduzir strings da interface** (se `features.translateUIStrings`), **traduzir ativos SVG autônomos** (se `features.translateSVG` e um bloco `svg` estiverem definidos), depois **traduzir documentação** (cada bloco `documentations`: markdown/JSON conforme configurado). Pule partes com `--no-ui`, `--no-svg` ou `--no-docs`. A etapa de documentação aceita `--dry-run`, `-p` / `--path`, `--force` e `--force-update` (os dois últimos só se aplicam quando a tradução de documentação é executada; são ignorados se você passar `--no-docs`).

Use `documentations[].targetLocales` em um bloco para traduzir os arquivos desse bloco para um **subconjunto menor** do que a interface (as localidades efetivas da documentação são a **união** entre os blocos):

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

<a id="mixed-documentation-workflow-docusaurus--flat"></a>
### Fluxo de trabalho misto de documentação (Docusaurus + plano)

Você pode combinar múltiplos pipelines de documentação na mesma configuração adicionando mais de uma entrada em `documentations`. Essa é uma configuração comum quando um projeto tem um site Docusaurus mais arquivos markdown no nível raiz (por exemplo, um arquivo readme do repositório) que devem ser traduzidos com saída plana.

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
- O segundo bloco de documentação traduz `README.md` para arquivos planos com sufixo de localidade em `translated-docs/`.
- Todos os blocos de documentação compartilham `cacheDir`, portanto segmentos inalterados são reutilizados entre execuções para reduzir chamadas à API e custos.

---

<a id="translation-cache-editor"></a>
## Editor de Cache de Tradução

Execute:

```bash
ai-i18n-tools editor
# Optional: choose port, do not auto-open browser
# ai-i18n-tools editor -p 8765 --no-open
```

Isso inicia uma interface web local alimentada pelo banco de dados **`cacheDir`** SQLite configurado — a mesma pasta usada pela CLI para segmentos de documentação, logs e metadados relacionados. Inclui as abas **Documentação** (segmentos de doc em cache), **Strings de UI**, **Plurais de UI**, **Glossário**, **Falhas** e **Estatísticas**.

Se você **editar linhas do cache** neste aplicativo (por exemplo, segmentos de documentação), execute `sync --force-update` ou o comando de tradução equivalente com `--force-update` para que as saídas em disco correspondam ao cache; se o **texto de origem** no repositório for alterado posteriormente, os hashes dos segmentos mudarão e as edições manuais para o texto antigo serão substituídas.

<a id="translation-cache-editor-failures"></a>
### Falhas (tradução de documentos)

A aba **Falhas** é destinada apenas à tradução de **documentação**. Ela lê registros de falhas escritos no SQLite quando um segmento não pôde ser traduzido com sucesso para um idioma — por exemplo, saída do modelo vazia ou inválida, erros de validação pós-tradução (`AST mismatch`, vazamentos de placeholders e verificações de **qualidade** semelhantes) ou uma condição **fatal** que impediu o progresso. Ela ajuda a responder: *qual segmento de origem falhou, para qual idioma e modelo, e qual mensagem de erro foi registrada?*

<a id="when-to-use-it"></a>
#### Quando usá-lo

- Depois que `translate-docs` ou `sync` terminar com erros, idiomas parciais ou logs confusos — você pode classificar e filtrar falhas em vez de apenas rolar a saída do terminal.
- Quando desejar **priorizar retrabalho**: ordene por **# Falhas** para que segmentos que falharam repetidamente em novas tentativas apareçam primeiro; esses são fortes candidatos para **simplificar ou reformatar** no markdown de origem, para que execuções futuras tenham sucesso.
- Quando precisar do **segmento exato** — caminho do arquivo, dica de linha, hash de origem e texto completo de origem — para editar o parágrafo correto no seu repositório.

<a id="why-source-edits-matter"></a>
#### Por que edições na origem são importantes

Marcação embutida densa (**negrito** misturado com `` `code` ``, ênfase aninhada, frases longas com muitos spans) dificulta que os modelos retornem traduções que ainda passem nas verificações estruturais. Segmentos com **múltiplas falhas registradas** geralmente melhoram mais com **reescrita ou divisão** da origem (ou movendo exemplos para blocos de código destacados) do que com a repetição da tradução em texto inalterado. Isso está alinhado com [Markdown complexo e falhas nas verificações de qualidade](#complex-markdown-and-failed-quality-checks).

<a id="how-to-use-the-tab"></a>
#### Como usar a aba

1. Abra **Falhas** no editor (mesma sessão do navegador que o [Editor de Cache de Tradução](#translation-cache-editor)).
2. Leia a faixa de **resumo** (segmentos com qualquer falha, mais contagens de segmentos com **1**, **2** ou **3+** registros de falha).
3. Filtre por **nome de arquivo** parcial, **localidade**, **modelo**, **erro de qualidade** (valores provenientes do seu cache), **somente fatais** e opcionalmente por **hash de origem**, **texto de origem** ou substring de **mensagem de erro** — depois clique em **Aplicar**.
4. Escolha **Ordenar: # Falhas** (padrão) ou **Ordenar: caminho do arquivo + número da linha**.
5. Use a paginação no topo ou na parte inferior da tabela. **Clique em uma linha** para alternar a exibição completa do texto de origem. O controle de link na linha (quando habilitado) solicita ao processo do servidor que registre dicas de arquivo/linha no **terminal** onde `ai-i18n-tools editor` está em execução — útil para saltar do navegador para o seu editor.
6. Corrija o **arquivo de origem** no seu projeto e execute `translate-docs` ou `sync` novamente. Se a lista parecer **desatualizada** após uma execução bem-sucedida, execute `ai-i18n-tools sync --force-update` e recarregue o editor (o painel de Falhas exibe a mesma dica).

Para depuração baseada em arquivos ao lado da interface, você ainda pode usar `translate-docs --debug-failed` para gravar detalhes de `FAILED-TRANSLATION` em `cacheDir` durante novas tentativas — consulte [Comportamento do cache e flags `translate-docs`](#cache-behaviour-and-translate-docs-flags).

---

<a id="configuration-reference"></a>
## Referência de configuração

<a id="sourcelocale"></a>
### `sourceLocale`

Código BCP-47 para o idioma de origem (por exemplo, `"en-GB"`, `"en"`, `"pt-BR"`). Nenhum arquivo de tradução é gerado para este locale — a própria string da chave é o texto de origem.

**Deve coincidir** com o `SOURCE_LOCALE` exportado do seu arquivo de configuração de i18n em tempo de execução (`src/i18n.ts` / `src/i18n.js`).

<a id="targetlocales"></a>
### `targetLocales`

Matriz de códigos de locale BCP-47 para os quais traduzir (por exemplo, `["de", "fr", "es", "pt-BR"]`).

`targetLocales` é a lista principal de locales para tradução da interface e a lista padrão de locales para blocos de documentação. Use `generate-ui-languages` para gerar o manifesto `ui-languages.json` a partir de `sourceLocale` + `targetLocales`.

<a id="uilanguagespath-optional"></a>
### `uiLanguagesPath` (opcional)

Caminho para o manifesto `ui-languages.json` usado para nomes exibidos, filtragem de locale e pós-processamento da lista de idiomas. Quando omitido, a CLI procura o manifesto em `ui.flatOutputDir/ui-languages.json`.

Use isso quando:

- O manifesto está fora de `ui.flatOutputDir` e você precisa indicar explicitamente seu local para a CLI.
- Você deseja que o `markdownOutput.postProcessing.languageListBlock` gere rótulos de locale a partir do manifesto.
- O `extract` deve mesclar entradas `englishName` do manifesto em `strings.json` (requer `ui.reactExtractor.includeUiLanguageEnglishNames: true`).

<a id="concurrency-optional"></a>
### `concurrency` (opcional)

Número máximo de **locales de destino** traduzidos simultaneamente (`translate-ui`, `translate-docs`, `translate-svg` e as etapas correspondentes dentro de `sync`). Se omitido, a CLI usa **4** para tradução de interface e **3** para tradução de documentação (padrões embutidos). Substitua por execução com `-j` / `--concurrency`.

<a id="batchconcurrency-optional"></a>
### `batchConcurrency` (opcional)

**translate-docs** e **translate-svg** (e a etapa de documentação do `sync`): número máximo de requisições paralelas em **lote** para OpenRouter por arquivo (cada lote pode conter muitos segmentos). Padrão é **4** quando omitido. Ignorado pelo `translate-ui`. Substitua com `-b` / `--batch-concurrency`. Em `sync`, `-b` aplica-se apenas à etapa de tradução de documentação.

<a id="batchsize--maxbatchchars-optional"></a>
### `batchSize` / `maxBatchChars` (opcional)

Agrupamento de segmentos para tradução de documentos: quantos segmentos por requisição à API e um limite máximo de caracteres. Padrões: **20** segmentos, **4096** caracteres (quando omitido).

<a id="openrouter"></a>
### `openrouter`

| Campo               | Descrição                                                                                                                                                                                                      |
|---------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `baseUrl`           | URL base da API OpenRouter. Padrão: `https://openrouter.ai/api/v1`.                                                                                                                                                |
| `translationModels` | Lista ordenada preferencial de IDs de modelos. O primeiro é tentado primeiro; entradas posteriores são usadas como alternativas em caso de erro. Para `translate-ui` apenas, você também pode definir `ui.preferredModel` para tentar um modelo antes desta lista (veja `ui`). |
| `defaultModel`      | Modelo principal único herdado. Usado somente quando `translationModels` não estiver definido ou estiver vazio.                                                                                                                               |
| `fallbackModel`     | Modelo de contingência único herdado. Usado após `defaultModel` quando `translationModels` não estiver definido ou estiver vazio.                                                                                                              |
| `maxTokens`         | Número máximo de tokens de conclusão por solicitação. Padrão: `8192`.                                                                                                                                                              |
| `temperature`       | Temperatura de amostragem. Padrão: `0.2`.                                                                                                                                                                            |

**Por que usar múltiplos modelos:** Diferentes provedores e modelos têm custos variados e oferecem níveis distintos de qualidade entre idiomas e localidades. Configure `openrouter.translationModels` **como uma cadeia de fallback ordenada** (em vez de um único modelo), para que a CLI possa tentar o próximo modelo caso uma solicitação falhe.

Considere a lista abaixo como uma **base** que você pode expandir: se a tradução para uma localidade específica for ruim ou falhar, pesquise quais modelos suportam efetivamente esse idioma ou script (consulte recursos online ou a documentação do seu provedor) e adicione esses IDs do OpenRouter como alternativas adicionais.

Essa lista foi **testada para ampla cobertura de localidades** (por exemplo, em **abril de 2026**, ao traduzir **36** localidades de destino em um grande projeto de documentação); ela serve como padrão prático, mas não há garantia de bom desempenho para todas as localidades.

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

<a id="features"></a>
### `features`

| Campo                | Fluxo de trabalho | Descrição                                                                                                                                                        |
|----------------------|----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `extractUIStrings`   | 1        | Escaneia a fonte em busca de `t("…")` / `i18n.t("…")`, mesclando a descrição opcional `package.json` e (se habilitado) os valores `ui-languages.json` `englishName` em `strings.json`. |
| `translateUIStrings` | 1        | Traduz as entradas `strings.json` e gera arquivos JSON por localidade.                                                                                                  |
| `translateMarkdown`  | 2        | Traduz arquivos `.md` / `.mdx`.                                                                                                                                    |
| `translateJSON`      | 2        | Traduz arquivos JSON de rótulos do Docusaurus.                                                                                                                             |
| `translateSVG`       | 2        | Traduz ativos `.svg` autônomos (requer o bloco `svg` no nível superior).                                                                                         |

**Traduza ativos** SVG autônomos com `translate-svg` quando `features.translateSVG` for verdadeiro e um bloco `svg` no nível superior estiver configurado. O comando `sync` executa essa etapa quando ambas as condições forem atendidas (a menos que `--no-svg`).

<a id="ui"></a>
### `ui`

| Campo                                          | Descrição                                                                                                                                                                                                                                                        |
|------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `sourceRoots`                                  | Diretórios (relativos ao diretório atual) escaneados em busca de chamadas `t("…")`.                                                                                                                                                                                                          |
| `stringsJson`                                  | Caminho para o arquivo de catálogo principal. Atualizado por `extract`.                                                                                                                                                                                                             |
| `flatOutputDir`                                | Diretório onde os arquivos JSON por localidade são escritos (`de.json`, etc.).                                                                                                                                                                                               |
| `preferredModel`                               | Opcional. ID do modelo OpenRouter tentado primeiro apenas para `translate-ui`; depois `openrouter.translationModels` (ou modelos legados) em ordem, sem duplicar este ID.                                                                                                   |
| `reactExtractor.funcNames`                     | Nomes adicionais de funções para verificar (padrão: `["t", "i18n.t"]`).                                                                                                                                                                                                    |
| `reactExtractor.extensions`                    | Extensões de arquivo a incluir (padrão: `[".js", ".jsx", ".ts", ".tsx"]`).                                                                                                                                                                                            |
| `reactExtractor.includePackageDescription`     | Quando `true` (padrão), `extract` também inclui `package.json` `description` como uma string de interface quando presente.                                                                                                                                                           |
| `reactExtractor.packageJsonPath`               | Caminho personalizado para o arquivo `package.json` usado para essa extração opcional de descrição.                                                                                                                                                                              |
| `reactExtractor.includeUiLanguageEnglishNames` | Quando `true` (padrão `false`), `extract` também adiciona cada `englishName` do manifesto em `uiLanguagesPath` ao `strings.json` quando ainda não presente na verificação de origem (mesmas chaves de hash). Requer `uiLanguagesPath` apontando para um `ui-languages.json` válido. |

<a id="cachedir"></a>
### `cacheDir`

| Campo      | Descrição                                                                 |
| ---------- | ----------------------------------------------------------------------------- |
| `cacheDir` | Diretório de cache SQLite (compartilhado por todos os blocos `documentations`). Reutilizado entre execuções. Se você estiver migrando de um cache personalizado de tradução de documentos, archive-o ou exclua-o — `cacheDir` cria seu próprio banco de dados SQLite e não é compatível com outros esquemas. |

Melhor prática para exclusões no VCS:

- Exclua o conteúdo da pasta de cache de tradução (por exemplo, via `.gitignore` ou `.git/info/exclude`) para evitar o commit de artefatos de cache transitórios.
- Mantenha `cache.db` disponível (não o exclua rotineiramente), pois preservar o cache SQLite evita a re-tradução de segmentos inalterados, economizando tempo de execução e custos de API ao alterar ou atualizar software que usa `ai-i18n-tools`.

Exemplo:

```gitignore
# Translation cache directory
.translation-cache/*

# Keep SQLite cache for reuse
!.translation-cache/cache.db
```

<a id="documentations"></a>
### `documentations`

Array de blocos do pipeline de documentação. `translate-docs` e a fase de docs do `sync` **processam cada** bloco em ordem.

| Campo                                             | Descrição                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
|---------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `description`                                     | Observação opcional de fácil leitura para este bloco (não usada para tradução). É exibida como prefixo no título `translate-docs` `🌐` quando definida; também é mostrada nos cabeçalhos da seção `status`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `contentPaths`                                    | Fontes em Markdown/MDX a serem traduzidas (`translate-docs` analisa esses arquivos em busca de `.md` / `.mdx`). Os rótulos JSON vêm do `jsonSource` no mesmo bloco.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `outputDir`                                       | Diretório raiz para a saída traduzida deste bloco.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `sourceFiles`                                     | Apelido opcional incorporado ao `contentPaths` durante o carregamento.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `targetLocales`                                   | Subconjunto opcional de localidades apenas para este bloco (caso contrário, usa a raiz `targetLocales`). As localidades de documentação efetivas são a união entre todos os blocos.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `jsonSource`                                      | Diretório de origem dos arquivos de rótulo JSON do Docusaurus para este bloco (por exemplo, `"i18n/en"`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `markdownOutput.style`                            | `"nested"` (padrão), `"docusaurus"` ou `"flat"`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `markdownOutput.docsRoot`                         | Diretório raiz da documentação de origem para o layout do Docusaurus (por exemplo, `"docs"`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `markdownOutput.pathTemplate`                     | Caminho personalizado de saída para markdown. Marcadores: <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{LOCALE}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{basename}"}</code>, <code>{"{extension}"}</code>, <code>{"{docsRoot}"}</code>, <code>{"{relativeToDocsRoot}"}</code>.                                                                                                                                                                                                                                                                                                                                                     |
| `markdownOutput.jsonPathTemplate`                 | Caminho personalizado de saída em JSON para arquivos de rótulos. Suporta os mesmos marcadores que `pathTemplate`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `markdownOutput.flatPreserveRelativeDir`          | Para o estilo `flat`, mantenha os subdiretórios de origem para que arquivos com o mesmo nome-base não entrem em conflito.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `markdownOutput.rewriteRelativeLinks`             | Reescrever links relativos após a tradução (ativado automaticamente para o estilo `flat`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `markdownOutput.linkRewriteDocsRoot`              | Raiz do repositório usada ao calcular os prefixos de reescrita de links planos. Normalmente, mantenha isso como `"."`, a menos que sua documentação traduzida esteja localizada sob uma raiz de projeto diferente.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `markdownOutput.postProcessing`                | Transformações opcionais no **corpo markdown** traduzido (o YAML front matter é preservado). Executado após a reunião dos segmentos e reescrita de links planos, e antes de `addFrontmatter`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `segmentSplitting`                             | Mesmo nível que `markdownOutput` (por bloco `documentations[]`). Segmentos opcionais mais granulares para extração de `translate-docs`: `{ "enabled", "maxCharsPerSegment"?, "splitPipeTables"?, "splitDenseParagraphs"?, "maxLinesPerParagraphChunk"?, "splitLongLists"?, "maxListItemsPerChunk"? }`. Quando `enabled` é `true` (padrão quando `segmentSplitting` é omitido), parágrafos densos, tabelas GFM com pipes (o primeiro bloco inclui o cabeçalho, separador e primeira linha de dados) e listas longas são divididos; as subpartes são reunidas com uma única quebra de linha (`tightJoinPrevious`). Defina `"enabled": false` para usar um segmento por bloco do corpo delimitado por linhas em branco apenas. |
| `markdownOutput.postProcessing.regexAdjustments`  | Lista ordenada de `{ "description"?, "search", "replace" }`. `search` é um padrão regex (string simples usa a flag `g`, ou `/pattern/flags`). `replace` suporta marcadores de posição como `${translatedLocale}`, `${sourceLocale}`, `${sourceFullPath}`, `${translatedFullPath}`, `${sourceFilename}`, `${translatedFilename}`, `${sourceBasedir}`, `${translatedBasedir}`.                                                                                                                                                                                                                                                                                                    |
| `markdownOutput.postProcessing.languageListBlock` | `{ "start", "end", "separator" }` — o tradutor localiza a primeira linha contendo `start` e a linha correspondente `end`, substituindo então esse trecho por um seletor de idioma canônico. Os links são gerados com caminhos relativos ao arquivo traduzido; os rótulos vêm de `uiLanguagesPath` / `ui-languages.json` quando configurados, caso contrário, de `localeDisplayNames` e códigos de localidade.                                                                                                                                                                                                                                                                                       |
| `addFrontmatter`                                  | Quando `true` (padrão quando omitido), os arquivos markdown traduzidos incluem chaves YAML: `translation_last_updated`, `source_file_mtime`, `source_file_hash`, `translation_language`, `source_file_path` e, quando pelo menos um segmento tiver metadados de modelo, `translation_models` (lista ordenada de IDs de modelos OpenRouter utilizados). Defina como `false` para pular.                                                                                                                                                                                                                                                                                                                           |

Exemplo (pipeline flat README — caminhos de capturas de tela + invólucro opcional de lista de idiomas):

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

<a id="svg-optional"></a>
### `svg` (opcional)

Caminhos e layout de nível superior para ativos SVG autônomos. A tradução é executada apenas quando `features.translateSVG` é verdadeiro (via `translate-svg` ou o estágio SVG de `sync`).

| Campo                         | Descrição                                                                                                                                                                                                                                                                        |
|-------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `sourcePath`                  | Um diretório ou um array de diretórios escaneados recursivamente em busca de arquivos `.svg`.                                                                                                                                                                                                     |
| `outputDir`                   | Diretório raiz para a saída de SVG traduzido.                                                                                                                                                                                                                                          |
| `style`                       | `"flat"` ou `"nested"` quando `pathTemplate` não estiver definido.                                                                                                                                                                                                                               |
| `pathTemplate`                | Caminho personalizado para saída de SVG. Substituições: <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{LOCALE}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{basename}"}</code>, <code>{"{extension}"}</code>, <code>{"{relativeToSourceRoot}"}</code>. |
| `svgExtractor.forceLowercase` | Texto traduzido em letras minúsculas na remontagem do SVG. Útil para designs que dependem de rótulos totalmente em letras minúsculas.                                                                                                                                                                                |

<a id="glossary"></a>
### `glossary`

| Campo          | Descrição                                                                                                                                                                 |
|----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `uiGlossary`   | Caminho para `strings.json` - gera automaticamente um glossário a partir das traduções existentes.                                                                                                 |
| `userGlossary` | Caminho para um CSV com colunas `Original language string` (ou `en`), `locale`, `Translation` - uma linha por termo de origem e localidade de destino (`locale` pode ser `*` para todos os destinos). |

A chave legada `uiGlossaryFromStringsJson` ainda é aceita e mapeada para `uiGlossary` ao carregar a configuração.

Gere um arquivo CSV de glossário vazio:

```bash
npx ai-i18n-tools glossary-generate
```

---

<a id="cli-reference"></a>
## Referência da CLI

| Comando                                                                     | Descrição                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
|-----------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `version`                                                                   | Exibe a versão da CLI e o carimbo de data/hora da compilação (as mesmas informações que `-V` / `--version` no programa raiz).
| `init [-t ui-markdown\|ui-docusaurus] [-o path] [--with-translate-ignore]`  | Escreva um arquivo de configuração inicial (inclui `concurrency`, `batchConcurrency`, `batchSize`, `maxBatchChars` e `documentations[].addFrontmatter`). `--with-translate-ignore` cria um `.translate-ignore` inicial.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `extract`                                                                   | Atualize `strings.json` a partir de literais `t("…")` / `i18n.t("…")`, descrição opcional `package.json` e entradas opcionais do manifesto `englishName` (consulte `ui.reactExtractor`). Requer `features.extractUIStrings`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `generate-ui-languages [--master <path>] [--dry-run]`                       | Grave `ui-languages.json` em `ui.flatOutputDir` (ou `uiLanguagesPath` quando definido) usando `sourceLocale` + `targetLocales` e o `data/ui-languages-complete.json` incluído (ou `--master`). Emite avisos e insere espaços reservados `TODO` para localidades ausentes no arquivo mestre. Se você tiver um manifesto existente com valores personalizados de `label` ou `englishName`, eles serão substituídos pelos padrões do catálogo mestre — revise e ajuste o arquivo gerado posteriormente.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `translate-docs …`                                                          | Traduz markdown/MDX e JSON para cada bloco `documentations` (`contentPaths`, `jsonSource` opcional). `-j`: número máximo de localidades em paralelo; `-b`: número máximo de chamadas à API em lote por arquivo. `--prompt-format`: formato de transmissão em lote (`xml` \| `json-array` \| `json-object`). Veja [Comportamento de cache e flags `translate-docs`](#cache-behaviour-and-translate-docs-flags) e [Formato do prompt em lote](#batch-prompt-format).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `write-heading-ids …`                                                       | **Sem API.** Requer pelo menos um bloco `documentations[]`. Coleta `.md` / `.mdx` em cada `contentPaths` do bloco (respeita `.translate-ignore`). Insere uma linha com âncora HTML `<a id="slug"></a>` imediatamente **antes** de cada título ATX simples (`#`) (ignora títulos dentro de blocos de código com delimitadores). `-p` / `--path` ou `-f` / `--file`: limita a um arquivo ou diretório relativo ao projeto. `--slug-style`: `github` (padrão; doctoc / anchor-markdown-header), `bitbucket`, `gitlab`, `pymdown`, `azure-devops`. Com `pymdown`, opcionais `--pymdown-case`, `--pymdown-normalize`, `--pymdown-percent-encode` / `--no-pymdown-percent-encode`. `--dry-run`: lista apenas alterações.                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `translate-svg …`                                                           | Traduz ativos SVG autônomos configurados em `config.svg` (separado da documentação). Requer `features.translateSVG`. Mesmas ideias de cache da documentação; suporta `--no-cache` para pular leituras/escritas no SQLite nesta execução. `-j`, `-b`, `--force`, `--force-update`, `-p` / `--path`, `--dry-run`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `translate-ui [--locale <code>] [--force] [--dry-run] [-j <n>]`             | Traduzir apenas strings da interface. `--force`: traduzir novamente todas as entradas por localidade (ignorar traduções existentes). `--dry-run`: sem gravações, sem chamadas à API. `-j`: número máximo de localidades em paralelo. Requer `features.translateUIStrings`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `lint-source [-l <code>] [--chunk <n>] [--dry-run] [--json] [-j <n>]`                                                                    | Executa `extract` **primeiro** (requer `features.extractUIStrings`) para que `strings.json` corresponda à origem, depois revisão por LLM das strings da interface **origem-localidade** (ortografia, gramática). **Dicas de terminologia** vêm apenas do CSV `glossary.userGlossary` (mesmo escopo que `translate-ui` — não `strings.json` / `uiGlossary`, para que textos ruins não sejam reforçados como glossário). Usa OpenRouter (`OPENROUTER_API_KEY`). Apenas informativo (sai com **0** ao finalizar). Grava `lint-source-results_<timestamp>.log` em `cacheDir` como relatório **legível por humanos** (resumo, problemas e linhas **OK** por string); o terminal imprime apenas contagens resumidas e problemas (sem linhas `[ok]` por string). Imprime o nome do arquivo de log na última linha. `--json`: relatório JSON totalmente legível por máquina apenas no stdout (o arquivo de log permanece legível por humanos). `--dry-run`: ainda executa `extract`, depois imprime apenas o plano do lote (sem chamadas à API). `--chunk`: strings por lote da API (padrão **50**). `-j`: número máximo de lotes em paralelo (padrão `concurrency`). Com `--json`, a saída no estilo humano vai para stderr. Os links usam `path:line` como o botão “link” nas strings da interface `editor`. |
| `export-ui-xliff [-l <codes>] [-o <dir>] [--untranslated-only] [--dry-run]` | Exportar `strings.json` para XLIFF 2.0 (um `.xliff` por localidade de destino). `-o` / `--output-dir`: diretório de saída (padrão: mesma pasta do catálogo). `--untranslated-only`: apenas unidades sem tradução para essa localidade. Somente leitura; sem API.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `sync …`                                                                    | Extração (se habilitada), depois tradução da interface, depois `translate-svg` quando `features.translateSVG` e `config.svg` estão definidos, depois tradução da documentação — a menos que seja ignorada com `--no-ui`, `--no-svg` ou `--no-docs`. Flags compartilhadas: `-l`, `-p` / `-f`, `--dry-run`, `-j`, `-b` (apenas agrupamento de documentação), `--force` / `--force-update` (apenas documentação; mutuamente exclusivas quando a documentação é executada). A fase de documentação também repassa `--emphasis-placeholders` e `--debug-failed` (com o mesmo significado de `translate-docs`). `--prompt-format` não é uma flag `sync`; a etapa de documentação usa o valor padrão embutido (`json-array`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `status [--max-columns <n>]`                                                | Quando `features.translateUIStrings` está ativado, exibe a cobertura da interface por localidade (`Translated` / `Missing` / `Total`). Em seguida, exibe o status da tradução em markdown por arquivo × localidade (sem filtro `--locale`; as localidades vêm da configuração). Listas grandes de localidades são divididas em tabelas repetidas com até `n` colunas de localidades (padrão **9**) para manter as linhas estreitas no terminal.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `cleanup [--dry-run] [--no-backup] [--backup <path>]`                       | Executa `sync --force-update` primeiro (extração, interface, SVG, documentação), depois remove linhas de segmentos obsoletos (`last_hit_at` nulo / caminho do arquivo vazio); descarta linhas `file_tracking` cujo caminho de origem resolvido não existe no disco; remove linhas de tradução cujos metadados `filepath` apontam para um arquivo ausente. Registra três contagens (obsoletos, `file_tracking` órfãos, traduções órfãs). Cria um backup do SQLite com carimbo de data no diretório de cache, a menos que `--no-backup`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `editor [-p <port>] [--no-open]`                                            | Inicia um editor da web local para o cache, `strings.json` e o arquivo CSV do glossário. `--no-open` não abrem o navegador padrão automaticamente.<br><br>**Observação:** Se você editar uma entrada no editor de cache, deve executar um `sync --force-update` para reescrever os arquivos de saída com a entrada de cache atualizada. Além disso, se o texto de origem for alterado posteriormente, a edição manual será perdida, pois uma nova chave de cache será gerada.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `glossary-generate [-o <path>]`                                             | Grava um modelo vazio de `glossary-user.csv`. `-o`: substitui o caminho de saída (padrão: `glossary.userGlossary` do arquivo de configuração, ou `glossary-user.csv`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

Todos os comandos aceitam `-c <path>` para especificar um arquivo de configuração não padrão, `-v` para saída detalhada e `-w` / `--write-logs [path]` para redirecionar a saída do console para um arquivo de log (caminho padrão: dentro do diretório raiz `cacheDir`). O programa principal também suporta `-V` / `--version` e `-h` / `--help`; `ai-i18n-tools help [command]` exibe a mesma ajuda por comando que `ai-i18n-tools <command> --help`.

---

<a id="environment-variables"></a>
## Variáveis de ambiente

| Variável                | Descrição                                                |
|-------------------------|------------------------------------------------------------|
| `OPENROUTER_API_KEY`    | **Obrigatório.** Sua chave de API do OpenRouter.                     |
| `OPENROUTER_BASE_URL`   | Substitui a URL base da API.                                 |
| `I18N_SOURCE_LOCALE`    | Substitui `sourceLocale` em tempo de execução.                        |
| `I18N_TARGET_LOCALES`   | Códigos de localidade separados por vírgula para substituir `targetLocales`.  |
| `I18N_LOG_LEVEL`        | Nível do logger (`debug`, `info`, `warn`, `error`, `silent`). |
| `NO_COLOR`              | Quando `1`, desativa as cores ANSI na saída de log.              |
| `I18N_LOG_SESSION_MAX`  | Número máximo de linhas mantidas por sessão de log (padrão `5000`).           |
