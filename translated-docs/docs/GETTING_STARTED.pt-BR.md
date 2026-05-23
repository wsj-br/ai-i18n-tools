<a id="ai-i18n-tools-getting-started"></a>
# ai-i18n-tools: Primeiros Passos

`ai-i18n-tools` fornece dois fluxos de trabalho independentes e compostos:

- **Fluxo de trabalho 1 - Tradução de interface**: extrair chamadas `t("…")` de qualquer fonte JS/TS, traduzi-las via OpenRouter e gerar arquivos JSON planos por localidade, prontos para uso com i18next.
- **Fluxo de trabalho 2 - Tradução de documentos**: traduzir **páginas em markdown e MDX** listadas em `contentPaths` para qualquer número de localidades, com cache inteligente — ou seja, a documentação localizada que os leitores abrem no site. O formato **JSON do Docusaurus** (`jsonSource`, de `docusaurus write-translations`) é opcional e cobre elementos da **interface do site** (barra de navegação, rodapé, strings de tema/plugin), não o texto nas `docs/`. Arquivos **SVG** usam `features.translateSVG`, o bloco `svg` de nível superior e `translate-svg` (veja [referência da CLI](#cli-reference)).

Ambos os fluxos de trabalho utilizam o OpenRouter (qualquer LLM compatível) e compartilham um único arquivo de configuração.

<small>**Leia em outros idiomas:** </small>
<small id="lang-list">[English (GB)](../../docs/GETTING_STARTED.md) · [Deutsch](./GETTING_STARTED.de.md) · [Español](./GETTING_STARTED.es.md) · [Français](./GETTING_STARTED.fr.md) · [हिन्दी](./GETTING_STARTED.hi.md) · [日本語](./GETTING_STARTED.ja.md) · [한국어](./GETTING_STARTED.ko.md) · [Português (Brasil)](./GETTING_STARTED.pt-BR.md) · [中文 (中国大陆)](./GETTING_STARTED.zh-CN.md) · [中文 (台灣)](./GETTING_STARTED.zh-TW.md)</small>

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
    - [Comportamento de cache e flags `translate-docs`](#cache-behaviour-and-translate-docs-flags)
    - [Formato de prompt em lote](#batch-prompt-format)
    - [Dedupe de segmentos e caminhos no SQLite](#segment-dedupe-and-paths-in-sqlite)
  - [Layouts de saída](#output-layouts)
    - [Links âncora quando `markdownOutput.style = "flat"`](#anchor-links-when-markdownoutputstyle--flat)
    - [Imagens e ativos rasterizados em documentos traduzidos](#images-and-raster-assets-in-translated-docs)
    - [Seletor de idioma (`languageListBlock`)](#language-switcher-languagelistblock)
    - [Placeholders `pathTemplate` / `jsonPathTemplate`](#pathtemplate--jsonpathtemplate-placeholders)
  - [Solução de problemas](#troubleshooting)
- [Fluxo de trabalho combinado (UI + Docs)](#combined-workflow-ui--docs)
  - [Fluxo de trabalho de documentação mista (`markdownOutput.style = "docusaurus"` + `"flat"`)](#mixed-documentation-workflow-markdownoutputstyle--docusaurus--flat)
- [Painel de Tradução](#translation-dashboard)
  - [Falhas (tradução de documentos)](#failures-document-translation)
    - [Quando usá-lo](#when-to-use-it)
    - [Por que edições na origem são importantes](#why-source-edits-matter)
    - [Como usar a aba](#how-to-use-the-tab)
  - [Problemas com Markdown (verificações estáticas)](#markdown-issues-static-checks)
- [Referência de configuração](#configuration-reference)
  - [`sourceLocale`](#sourcelocale)
  - [`targetLocales`](#targetlocales)
  - [`uiLanguagesPath` (opcional)](#uilanguagespath-optional)
  - [`concurrency` (opcional)](#concurrency-optional)
  - [`batchConcurrency` (opcional)](#batchconcurrency-optional)
  - [`fileConcurrency` (opcional)](#fileconcurrency-optional)
  - [`batchSize` / `maxBatchChars` (opcional)](#batchsize--maxbatchchars-optional)
  - [`openrouter`](#openrouter)
  - [`features`](#features)
  - [`ui`](#ui)
  - [`cacheDir`](#cachedir)
    - [Melhor prática para exclusões no git:](#best-practice-for-git-exclusions)
  - [`documentations`](#documentations)
  - [`svg`](#svg)
  - [`glossary`](#glossary)
- [Referência CLI](#cli-reference)
- [Variáveis de ambiente](#environment-variables)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="installation"></a>
## Instalação

O pacote publicado é apenas **ESM**. Use `import`/`import()` no Node.js ou no seu empacotador; não use `require('ai-i18n-tools')`. O pacote declara `engines.node` `>=22.16.0`; versões mais antigas do Node.js não são suportadas. O tarball do npm inclui apenas arquivos em inglês em `docs/`; cópias específicas de localidade em `translated-docs/` estão no [repositório do GitHub](https://github.com/wsj-br/ai-i18n-tools/tree/main/translated-docs).

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

O ai-i18n-tools inclui seu próprio extrator de strings. Se você anteriormente usava `i18next-scanner`, `babel-plugin-i18next-extract` ou ferramentas semelhantes, pode remover essas dependências de desenvolvimento após a migração.

<a id="using-the-cli"></a>
### Usando a CLI

**Por projeto (recomendado)** — instale como dependência ou devDependency, depois chame via `npx`, `pnpm exec` ou um script `package.json`. Scripts `package.json` já são executados com `node_modules/.bin` no `PATH`, então comandos como `pnpm run i18n:sync` invocam a CLI sem precisar digitar `npx`.

**Bare** `ai-i18n-tools` **no terminal:** Para executar a CLI diretamente em um shell interativo (a partir da raiz do projeto, após uma instalação local), adicione o diretório bin local ao `PATH`:

```bash
# bash/zsh — project root
export PATH="$PWD/node_modules/.bin:$PATH"
ai-i18n-tools sync
```

```powershell
# Windows PowerShell — project root
$env:Path = "$PWD\node_modules\.bin;$env:Path"
ai-i18n-tools sync
```

Com [**direnv**](https://direnv.net/), adicione `PATH_add node_modules/.bin` a um `.envrc` na raiz do projeto para que o comando direto esteja disponível após `cd` no repositório. Sem ajustar `PATH`, continue usando `npx ai-i18n-tools …` ou `pnpm exec ai-i18n-tools …`.

**Execução única sem instalação** — use `npx ai-i18n-tools <cmd>` ou `pnpm dlx ai-i18n-tools <cmd>` (faz o download do pacote para aquela execução; sem entrada em `package.json`).

No Linux, macOS e WSL, as instalações do registro definem automaticamente o bit executável no script CLI. No Windows, os gerenciadores de pacotes geram `.cmd` e `.ps1` shims que invocam o Node explicitamente.

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

O modelo padrão `init` (`ui-markdown`) habilita apenas a extração e tradução da **interface (UI)**. Os modelos `ui-docusaurus` e `ui-starlight` habilitam a tradução de **documentos** (`translate-docs`). Use `sync` quando desejar um único comando que execute extração, tradução da interface, tradução opcional de arquivos SVG e tradução de documentação de acordo com sua configuração.

```bash
# Workflow 1 - UI strings (default template enables extract + translate-ui)
npx ai-i18n-tools init
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui

# Workflow 2 - docs (Docusaurus-oriented template)
npx ai-i18n-tools init -t ui-docusaurus
# Astro Starlight: npx ai-i18n-tools init -t ui-starlight
npx ai-i18n-tools translate-docs

# Combined: extract UI strings, then translate UI + SVG + docs (per config features)
npx ai-i18n-tools sync

# Translation status (UI strings per locale; markdown per file × locale in chunked tables)
npx ai-i18n-tools status
# npx ai-i18n-tools status --max-columns 12   # wider tables, fewer chunks
```

<a id="recommended-packagejson-scripts"></a>
### Scripts recomendados do `package.json`

Com o pacote instalado localmente, você pode usar os comandos da CLI diretamente em scripts (não é necessário `npx`).

**Prefira** `sync` para qualquer coisa que antes era “execute `translate-ui`, depois `translate-svg`, depois `translate-docs`”: `ai-i18n-tools sync` executa **extract** (quando habilitado), **translate-ui**, opcionalmente **translate-svg** e depois **translate-docs** — na ordem correta e com flags compartilhadas — de acordo com sua configuração. Encadear manualmente esses três comandos de tradução é fácil de fazer errado (ordem, extração, flags de localidade). Use `i18n:translate:ui`, `i18n:translate:svg` e `i18n:translate:docs` apenas quando precisar de um **único** passo isoladamente.

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:status": "ai-i18n-tools status",
  "i18n:dashboard": "ai-i18n-tools dashboard",
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

- `sourceLocale` - seu código BCP-47 do idioma de origem (por exemplo, `"en-GB"`). **Deve corresponder** a `SOURCE_LOCALE` exportado do seu arquivo de configuração i18n em tempo de execução (`src/i18n.ts` / `src/i18n.js`).
- `targetLocales` - matriz de códigos BCP-47 para os idiomas de destino (por exemplo, `["de", "fr", "pt-BR"]`). Execute `generate-ui-languages` para criar o manifesto `ui-languages.json` a partir desta lista.
- `ui.sourceRoots` - diretórios ou padrões glob para procurar chamadas `t("…")` (por exemplo, `["src/"]`, `["src/**/*.ts"]`).
- `ui.stringsJson` - onde escrever o catálogo mestre (por exemplo, `"src/locales/strings.json"`).
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

Para cada entrada, `translate-ui` armazena o **ID do modelo OpenRouter** que traduziu com sucesso cada localidade em um objeto opcional `models` (com as mesmas chaves de localidade que `translated`). Strings editadas no comando local `dashboard` são marcadas com o valor sentinela `user-edited` em `models` para aquela localidade. Os arquivos planos por localidade em `ui.flatOutputDir` permanecem apenas como **string de origem → tradução**; eles não incluem `models` (assim, os pacotes de execução permanecem inalterados).

> **Observação:** Se você editar uma entrada no Painel de Tradução, é necessário executar um `sync --force-update` (ou o comando equivalente `translate` com `--force-update`) para reescrever os arquivos de saída com a entrada atualizada no cache. Além disso, lembre-se de que, se o texto de origem for alterado posteriormente, sua edição manual será perdida, pois uma nova chave de cache (hash) será gerada para a nova string de origem.

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

<details>
<summary>Exemplo completo de inicialização i18n (src/i18n.js)</summary>

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

</details>

#### Mantendo `SOURCE_LOCALE` alinhado

**Mantenha três valores alinhados:** `sourceLocale` em `ai-i18n-tools.config.json`, `SOURCE_LOCALE` neste arquivo e o JSON plano de plurais que `translate-ui` escreve como `{sourceLocale}.json` no seu diretório de saída plano (geralmente `public/locales/`). Use o mesmo nome base no `import` estático (exemplo acima: `en-GB` → `en-GB.json`). O campo `lng` em `sourcePluralFlatBundle` deve ser igual a `SOURCE_LOCALE`. Os caminhos estáticos ES `import` não podem usar variáveis; se você alterar o idioma de origem, atualize `SOURCE_LOCALE` e o caminho de importação juntos. Alternativamente, carregue esse arquivo com um `import(\`./public/locales/${SOURCE_LOCALE}.json\`)`, `fetch` ou `readFileSync` para que o caminho seja construído a partir de `SOURCE_LOCALE`.

O trecho usa `./locales/…` e `./public/locales/…` como se `i18n` estivesse ao lado dessas pastas. Se seu arquivo estiver em `src/` (comum), use `../locales/…` e `../public/locales/…` para que os imports resolvam os mesmos caminhos que `ui.stringsJson`, `uiLanguagesPath` e `ui.flatOutputDir`.

Importe `i18n.js` antes do React renderizar (por exemplo, no início do seu ponto de entrada). Quando o usuário alterar o idioma, chame `await loadLocale(code)` e depois `i18n.changeLanguage(code)`.

`SOURCE_LOCALE` é exportado para que qualquer outro arquivo que precise dele (por exemplo, um seletor de idioma) possa importá-lo diretamente de `'./i18n'`. Se você estiver migrando uma configuração i18next existente, substitua strings fixas de idioma de origem (por exemplo, verificações `'en-GB'` espalhadas pelos componentes) por imports de `SOURCE_LOCALE` do seu arquivo de inicialização i18n.

Imports nomeados (`import { defaultI18nInitOptions, … } from 'ai-i18n-tools/runtime'`) funcionam da mesma forma se você preferir não usar a exportação padrão.

#### Carregadores de localidade

Mantenha `localeLoaders` **alinhado com a configuração** derivando-os de `ui-languages.json` usando `makeLocaleLoadersFromManifest` (isso filtra `SOURCE_LOCALE` usando a mesma normalização que `makeLoadLocale`). Quando você adiciona uma localidade a `targetLocales` e executa `generate-ui-languages`, o manifesto é atualizado e seus carregadores acompanham automaticamente a alteração — não é necessário manter um mapa fixo separado.

Para pacotes JSON em `public/` (configuração típica do Next.js), busque do seu caminho de URL pública:

```js
(code) => () => fetch(`/locales/${code}.json`).then(res => res.json())
```

Para CLIs Node sem empacotador, use `readFileSync` dentro de um pequeno auxiliar que leia e analise o arquivo JSON para cada código.

#### Referência de auxiliares de tempo de execução

`aiI18n.defaultI18nInitOptions(sourceLocale)` retorna as opções padrão para configurações com chave como padrão:

- `parseMissingKeyHandler` retorna a própria chave, então strings não traduzidas exibem o texto original.
- `nsSeparator: false` permite chaves que contenham dois pontos.
- `interpolation.escapeValue: false` — seguro para desativar: o React escapa os valores por si só, e a saída do Node.js/CLI não possui HTML para escapar.

`setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` é a fiação **recomendada** para projetos ai-i18n-tools: aplica o key-trim + fallback de interpolação de locale de origem <code>"{{var}}"</code> (comportamento idêntico ao do `wrapI18nWithKeyTrim` de nível inferior), opcionalmente mescla chaves com sufixos plurais `translate-ui` `{sourceLocale}.json` por meio do `addResourceBundle`, e então instala o `wrapT` com suporte a plural a partir do seu `strings.json`. Omita `sourcePluralFlatBundle` apenas durante a inicialização (incorpore-o assim que `translate-ui` emitir `{sourceLocale}.json`). O uso de `wrapI18nWithKeyTrim` isoladamente está **obsoleto** para código de aplicação — use `setupKeyAsDefaultT` em seu lugar.

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

Use a interpolação nativa de segundo argumento do i18next para placeholders <code>"{{var}}"</code>:

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

O comando extract analisa o **segundo argumento** quando ele é um objeto literal simples e lê flags exclusivas para ferramentas, como `plurals: true` e `zeroDigit` (veja **Plurais cardinais** abaixo). Para strings comuns, apenas a chave literal é usada para gerar o hash; as opções de interpolação ainda são repassadas ao i18next em tempo de execução.

Se o seu projeto usa um utilitário de interpolação personalizado (por exemplo, chamando `t('key')` e então passando o resultado por uma função de template como `interpolateTemplate(t('Hello {{name}}'), { name })`), `setupKeyAsDefaultT` (via `wrapI18nWithKeyTrim`) torna isso desnecessário — ele aplica interpolação <code>"{{var}}"</code> mesmo quando o idioma de origem retorna a chave bruta. Migre os locais de chamada para `t('Hello {{name}}', { name })` e remova o utilitário personalizado.

<a id="cardinal-plurals-plurals-true"></a>
### Plurais cardinais (`plurals: true`)

Use o **mesmo literal** que deseja como texto padrão para desenvolvedores e passe `plurals: true` para que extract + `translate-ui` tratem a chamada como um único **grupo de plural cardinal** (formas estilo JSON v4 do i18next: `_zero` … `_other`).

```tsx
{t('{{count}} items in your cart', { plurals: true, count: n })}
```

- `zeroDigit` (opcional) — apenas para ferramentas; **não** lido pelo i18next. Quando `true`, as sugestões priorizam um `0` arábico literal na string `_zero` para cada idioma em que essa forma existir; quando `false` ou omitido, usa-se a formulação natural de zero. Remova essas chaves antes de chamar `i18next.t` (veja `wrapT` abaixo).

**Validação:** Se a mensagem contiver **dois ou mais** marcadores de posição `{{…}}` distintos, **um deles deve ser** `{{count}}` (o eixo plural). Caso contrário, `extract` **falha** com uma mensagem clara indicando arquivo/linha.

**Dois contadores independentes** (por exemplo, seções e páginas) não podem compartilhar uma mesma mensagem no plural — use **duas** chamadas `t()` (cada uma com `plurals: true` e seu próprio `count`) e concatene na interface.

**Não disponível na v1:** plurais ordinais (`_ordinal_*`, `ordinal: true`), plurais por intervalo, pipelines exclusivos ICU.

#### Como os plurais são armazenados e emitidos

**Em** grupos plurais `strings.json`, use **uma linha por hash** com `"plural": true`, o literal original em `source` e `translated[locale]` como um objeto mapeando categorias cardinais (`zero`, `one`, `two`, `few`, `many`, `other`) para strings nesse idioma.

**JSON plano por idioma:** Linhas não plurais permanecem como **frase de origem → tradução**. Linhas plurais são emitidas como `<groupId>_original` (igual a `source`, para referência) e `<groupId>_<form>` para cada sufixo, para que o i18next resolva plurais nativamente. `translate-ui` também gera `{sourceLocale}.json` contendo **apenas** chaves planas de plurais (carregue este pacote para o idioma de origem para que chaves com sufixo sejam resolvidas; strings simples ainda usam a chave como padrão). Para cada idioma de destino, as chaves com sufixo emitidas correspondem a `Intl.PluralRules` para aquele idioma (`requiredCldrPluralForms`): se `strings.json` omitiu uma categoria porque ela coincidiu com outra após compactação (por exemplo, `many` árabe igual a `other`), `translate-ui` ainda escreve todos os sufixos necessários no arquivo plano copiando de uma string alternativa de fallback, garantindo que a busca em tempo de execução nunca falhe por falta de chave.

Tempo de execução (`ai-i18n-tools/runtime`): **Chame** `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle })` — ele executa `wrapI18nWithKeyTrim`, registra o pacote opcional de plurais `translate-ui` `{sourceLocale}.json`, e então `wrapT` usando `buildPluralIndexFromStringsJson(stringsJson)`. `wrapT` remove `plurals` / `zeroDigit`, reescreve a chave para o ID do grupo quando necessário e repassa `count` (opcional: se houver um único marcador de posição não-`{{count}}`, `count` é copiado dessa opção numérica).

**Ambientes mais antigos:** `Intl.PluralRules` é necessário para as ferramentas e para comportamento consistente; use polyfill se seu alvo forem navegadores muito antigos.

<a id="language-switcher-ui"></a>
### Interface do seletor de idioma

Use o manifesto `ui-languages.json` para construir um seletor de idiomas. `ai-i18n-tools` exporta dois auxiliares de exibição:

<details>
<summary>Componente LanguageSelect de exemplo (React)</summary>

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

</details>

<br />

`getUILanguageLabel(lang, t)` - mostra `t(englishName)` quando traduzido, ou `englishName / t(englishName)` quando ambos diferem. Adequado para telas de configurações.

`getUILanguageLabelNative(lang)` - mostra `englishName / label` (sem chamada `t()` em cada linha). Adequado para menus de cabeçalho onde você deseja que o nome nativo seja visível.

O manifesto `ui-languages.json` é uma matriz JSON de entradas <code>"{ code, label, englishName, direction }"</code> (`direction` é `"ltr"` ou `"rtl"`). Exemplo:

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

Projetado principalmente para **documentação em markdown e MDX** sob `contentPaths` (as páginas que os leitores consideram importantes). Em sites Docusaurus, você também pode traduzir **arquivos de rótulos JSON** gerados pelo `docusaurus write-translations` — eles contêm strings de tema, navbar, rodapé e plugins da interface (i18n do shell), distintas do texto principal em `docs/`. Para imagens PNG e outros ativos rasterizados embutidos em markdown, consulte [Imagens e ativos rasterizados em documentos traduzidos](#images-and-raster-assets-in-translated-docs). Para um bloco opcional de **seleção de idioma** em README ou documentação com `markdownOutput.style = "flat"`, veja [Seletor de idioma (`languageListBlock`)](#language-list-block). Arquivos SVG são traduzidos por meio de [`translate-svg`](#cli-reference) quando `features.translateSVG` está habilitado e o bloco `svg` de nível superior está definido — não por meio do `documentations[].contentPaths`.

<a id="step-1-initialise-for-documentation"></a>
### Etapa 1: Inicializar para documentação

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

Para sites de documentação Astro Starlight:

```bash
npx ai-i18n-tools init -t ui-starlight
```

Edite o `ai-i18n-tools.config.json` gerado:

- `sourceLocale` - idioma de origem (deve corresponder a `defaultLocale` em `docusaurus.config.js`).
- `targetLocales` - matriz de códigos de localidade BCP-47 (por exemplo, `["de", "fr", "es"]`).
- `cacheDir` - diretório compartilhado de cache SQLite para todos os pipelines de documentação (e diretório padrão de logs para `--write-logs`).
- `documentations` - matriz de blocos de documentação. Cada bloco possui `description`, `contentPaths`, `outputDir`, opcional `jsonSource`, `markdownOutput`, opcional `segmentSplitting`, `translateFrontmatterFields`, `targetLocales`, `addFrontmatter`, etc.
- `documentations[].description` - nota opcional curta para mantenedores (o que este bloco abrange). Quando definido, aparece no título `translate-docs` (`🌐 …: translating …`) e nos cabeçalhos de seção `status`.
- `documentations[].contentPaths` - diretórios ou arquivos fonte em markdown/MDX (consulte também `documentations[].jsonSource` para rótulos JSON).
- `documentations[].outputDir` - raiz de saída traduzida para esse bloco.
- `documentations[].markdownOutput.style` - `"nested"` (padrão), `"flat"`, `"doc-system"`, ou aliases `"docusaurus"` / `"astro-starlight"` (consulte [Layouts de saída](#output-layouts)).

**Primário versus complementar:** Concentre os esforços de criação e tradução em `contentPaths` — essa saída é a documentação localizada. `jsonSource` é para equipes que localizam o **shell do Docusaurus**; execute `docusaurus write-translations` quando atualizar o Docusaurus ou alterar strings da barra de navegação, rodapé ou tema para manter os catálogos-fonte na pasta da localidade padrão atualizados. Você pode definir `features.translateJSON` como `false` se precisar apenas de páginas traduzidas e tratar as strings de interface de outra forma.

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

Para ver **quais segmentos falharam**, com que frequência e as mensagens armazenadas de **qualidade / erro**, use a aba **Falhas** do Painel de Tradução ([Painel de Tradução → Falhas](#failures-document-translation)).

<a id="cache-behaviour-and-translate-docs-flags"></a>
#### Comportamento do cache e flags `translate-docs`

A CLI mantém o **rastreamento de arquivos** no SQLite (hash da fonte por arquivo × localidade) e linhas de **segmento** (hash × localidade por bloco traduzível). Uma execução normal ignora completamente um arquivo quando o hash rastreado corresponde à fonte atual **e** o arquivo de saída já existe; caso contrário, processa o arquivo e usa o cache de segmentos, de modo que texto inalterado não chame a API.

| Flag                          | Efeito                                                                                                                                                                                                                                                              |
|-------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| *(padrão)*                   | Ignorar arquivos inalterados quando o rastreamento + saída em disco coincidirem; usar cache de segmento para o restante.                                                                                                                                                                          |
| `-l, --locale <codes>`        | Localidades de destino separadas por vírgula (quando omitidas, os padrões correspondem à união da `targetLocales` raiz e de cada `targetLocales` opcional em blocos `documentations[]`).                                                                                                                                                          |
| `-p, --path` / `-f, --file`   | Traduzir apenas markdown/JSON sob este caminho (relativo ao projeto, absoluto ou padrão glob); `--file` é um alias para `--path`.                                                                                                                                 |
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

| Modo                   | Mensagem do usuário                                                           | Resposta do modelo                                                 |
|------------------------|------------------------------------------------------------------------|-------------------------------------------------------------|
| `xml`                  | Pseudo-XML: um `<seg id="N">…</seg>` por segmento (com escape XML). | Apenas blocos `<t id="N">…</t>`, um por índice de segmento.       |
| `json-array` (padrão) | Um array JSON de strings, uma entrada por segmento em ordem.               | Um array JSON do **mesmo comprimento** (mesma ordem).           |
| `json-object`          | Um objeto JSON `{"0":"…","1":"…",…}` indexado pelo índice do segmento.            | Um objeto JSON com as **mesmas chaves** e valores traduzidos. |

O cabeçalho da execução também exibe `Batch prompt format: …`, para que você possa confirmar o modo ativo. Os arquivos de rótulos JSON (`jsonSource`) e lotes de arquivos SVG usam a mesma configuração quando essas etapas são executadas como parte de `translate-docs` (ou da fase de documentos do `sync` — `sync` não expõe essa opção; o valor padrão é `json-array`).

<a id="segment-dedupe-and-paths-in-sqlite"></a>
#### Deduplicação de segmentos e caminhos no SQLite

> **Observação:** Esta seção aborda detalhes internos da chave de cache, úteis para depurar o comportamento do `cleanup` ou ferramentas personalizadas. A maioria dos usuários pode pular esta parte.

- As linhas de segmento são indexadas globalmente por `(source_hash, locale)` (hash = conteúdo normalizado). Texto idêntico em dois arquivos compartilha uma única linha; `translations.filepath` é metadado (último escritor), não uma segunda entrada de cache por arquivo.
- `file_tracking.filepath` usa chaves com namespace: `doc-block:{index}:{relPath}` por bloco `documentations` (`relPath` é posix relativo à raiz do projeto: caminhos markdown conforme coletados; **arquivos JSON de rótulos usam o caminho relativo ao diretório atual do arquivo de origem**, por exemplo, `docs-site/i18n/en/code.json`, para que a limpeza possa resolver o arquivo real), e `svg-files:{relPath}` para arquivos SVG sob `translate-svg`.
- `translations.filepath` armazena caminhos posix relativos ao diretório atual para segmentos markdown, JSON e SVG (SVG usa o mesmo formato de caminho que outros ativos; o prefixo `svg-files:…` é **apenas** para `file_tracking`).
- Após uma execução, `last_hit_at` é limpo apenas para linhas de segmento **no mesmo escopo de tradução** (respeitando `--path` e tipos habilitados) que não foram acessadas, portanto, uma execução filtrada ou apenas de documentação não marca arquivos não relacionados como obsoletos.

<a id="output-layouts"></a>
### Layouts de saída

`markdownOutput.style` controla onde os arquivos markdown traduzidos são gravados. Use exatamente os valores de string abaixo em `documentations[].markdownOutput.style` (os apelidos são layouts predefinidos, não mecanismos separados).

`markdownOutput.style = "nested"` (padrão quando omitido) — espelha a árvore de origem sob `{outputDir}/{locale}/` (por exemplo, `docs/guide.md` → `i18n/de/docs/guide.md`).

`markdownOutput.style = "doc-system"` — árvore de documentação com prefixo de locale para sites de documentação estática. Arquivos sob `docsRoot` são gravados em `{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}`. Caminhos fora de `docsRoot` retornam ao layout aninhado. Defina `documentations[].markdownOutput.docsRoot` como a raiz da sua origem em inglês (por exemplo, `"docs"` ou `"src/content/docs"`). Quando `markdownOutput.style = "doc-system"`, você deve definir `localeSubpath` explicitamente (use um apelido abaixo para configurações predefinidas).

**Aliases** (mesmo mecanismo de layout, `localeSubpath` predefinido):

- `markdownOutput.style = "docusaurus"` — `localeSubpath` assume como padrão `docusaurus-plugin-content-docs/current` (layout do plugin i18n do Docusaurus).
- `markdownOutput.style = "astro-starlight"` — `localeSubpath` assume como padrão `""` (páginas traduzidas diretamente sob `{outputDir}/{locale}/`, compatível com [Starlight](https://starlight.astro.build/guides/i18n/) quando o inglês está na raiz do conteúdo e `outputDir` é igual a `docsRoot`).

Predefinição Docusaurus (páginas principais de documentação):

```text
docs/guide.md  →  i18n/de/docusaurus-plugin-content-docs/current/guide.md
```

Predefinição Starlight (mesma estrutura de bloco, caminhos diferentes):

```text
src/content/docs/guide.md  →  src/content/docs/de/guide.md
```

Rótulos JSON opcionais — strings do shell do Docusaurus de `jsonSource` (não o conteúdo do MDX):

```text
i18n/en/sidebar.json  →  i18n/de/sidebar.json
```

O Starlight fornece strings de interface para várias localidades; substituições personalizadas opcionais de interface usam `src/content/i18n/en.json` com `jsonPathTemplate: "{outputDir}/{locale}.json"` em um bloco `documentations[]` separado, quando necessário.

`markdownOutput.style = "flat"` — coloca os arquivos traduzidos ao lado do arquivo de origem com sufixo de locale, ou em um subdiretório. Links relativos entre páginas são reescritos automaticamente quando `markdownOutput.style = "flat"` (a menos que `rewriteRelativeLinks: false` ou um `pathTemplate` personalizado esteja definido).

```text
docs/guide.md → i18n/guide.de.md
```

<a id="anchor-links-when-markdownoutputstyle--flat"></a>
#### Links âncora quando `markdownOutput.style = "flat"`

Quando `markdownOutput.style = "flat"`, a saída reescreve **caminhos relativos** entre páginas para cada locale (`guide.md` → `guide.de.md`). **Links âncora** — a forma usual em markdown com `#` após o caminho — direcionam para uma seção dentro do arquivo de destino:

```markdown
Read the [installation checklist](../../docs/setup.md#first-run) before you deploy.
```

Aqui, o destino do link é `setup.md`, e `#first-run` é a âncora: deve rolar até o título correto dentro desse arquivo.

**Por que os links de âncora precisam de atenção**

- `rewriteRelativeLinks` corrige o **nome do arquivo** para cada localidade (`setup.md` → `setup.de.md`).
- Muitos renderizadores derivam o slug `#` do **texto visível do título**. Após a tradução, os títulos diferem por localidade, então um slug gerado automaticamente pode mudar enquanto o link reescrito ainda pode dizer `#first-run` — ou seu âncora em inglês `#…` não corresponde mais ao slug que o renderizador cria a partir do título traduzido.
- Resultado: os leitores chegam ao **arquivo** certo, mas na **linha errada**, ou o navegador não encontra um título correspondente.

**O que fazer**

1. Execute `ai-i18n-tools write-heading-ids` no seu `.md` / `.mdx` de origem antes de `translate-docs` (mesmo `documentations[]` / `contentPaths` de costume). Ele insere âncoras HTML explícitas na linha anterior a cada título, de modo que os valores `id` sejam compartilhados por todas as cópias traduzidas. Execute novamente após renomear títulos para atualizar os IDs de âncora desatualizados de acordo com o título atual.
2. Aponte seus **links âncora** em markdown para esses IDs estáveis, por exemplo, `[label](../../docs/other.md#section-id)`, onde `section-id` corresponde à âncora escrita pela ferramenta — não apenas uma suposição baseada em palavras em inglês.

**Exemplo**

`docs/overview.md`:

```markdown
See [TLS setup](../../docs/security.md#tls-configuration) for certificate steps.
```

`docs/security.md` após `write-heading-ids` (simplificado):

```markdown
<a id="tls-configuration"></a>
## TLS configuration

Your CA and cert steps…
```

Após `translate-docs`, caminhos de arquivos e âncoras `#…` permanecem alinhados em todos os arquivos de localidade, por exemplo:

```markdown
Siehe [TLS-Einrichtung](../../docs/security.de.md#tls-configuration) für die Zertifikatsschritte.
```

A âncora `#tls-configuration` é a mesma em todas as localidades porque o `id` é fixo na fonte; apenas o **texto** do título e o **rótulo** do link são traduzidos.

<a id="images-and-raster-assets-in-translated-docs"></a>
#### Imagens e ativos raster em documentos traduzidos

`translate-docs` traduz segmentos markdown, incluindo o texto alternativo de imagens. Ele não copia arquivos raster (PNG, JPEG, WebP, GIF) para o seu diretório de documentação `outputDir`. Você deve posicionar os arquivos de captura de tela nos locais para onde as URLs traduzidas apontarão, ou usar `postProcessing.regexAdjustments` para reescrever os caminhos após a tradução.

Para arquivos SVG com texto traduzível, use o bloco `svg` e `translate-svg` — consulte [`svg`](#svg).

Consulte o [Guia de ativos de locale](LOCALE-ASSETS-GUIDE.pt-BR.md) para obter o guia completo de decisões, todos os padrões com exemplos de configuração e layouts de diretórios, contratos de scripts de captura, recomendações de design e erros comuns.

**Referência rápida — cinco padrões**

| Padrão                      | Uso para                                               | Mecanismo                                         |
|------------------------------|-------------------------------------------------------|---------------------------------------------------|
| A — Raster compartilhado     | Imagem única, sem variantes por localidade            | `regexAdjustments` fixação de caminho completo            |
| B — Pasta por localidade   | `"flat"`, `"docusaurus"`, `"astro-starlight"` README/documentação | Substituição de segmento de localidade via `regexAdjustments` |
| C — Co-localizado Docusaurus | `markdownOutput.style = "docusaurus"` sites | Script de captura coloca arquivos; sem regex     |
| D — SVG traduzido          | Aplicativos web incorporando ilustrações SVG         | `translate-svg` com `svg.style = "flat"`                         |
| E — SVG traduzido co-localizado | `markdownOutput.style = "docusaurus"` documentação          | `translate-svg` com `svg.style = "nested"` + `pathTemplate`             |

**O reescritor de links plano e o fluxo de duas etapas**

Quando `markdownOutput.style = "flat"`, um reescritor interno é executado antes de `postProcessing`. Ele calcula o prefixo de profundidade por arquivo de saída — o caminho relativo do diretório do arquivo de saída de volta ao diretório do arquivo de origem — e o acrescenta aos URLs de ativos que não são markdown. `postProcessing` então é executado no URL já prefixado — escreva padrões `search` que correspondam ao segmento de localidade dentro dele, não ao prefixo inicial `../`.

Com `flatPreserveRelativeDir: true`, arquivos de origem em subdiretórios recebem automaticamente um prefixo específico por arquivo. Por exemplo, `docs/GETTING_STARTED.md` → `translated-docs/docs/GETTING_STARTED.<locale>.md` produz um prefixo de `../../docs/`, então `translation-cache-editor.png` (um arquivo irmão do original) se torna `../../docs/translation-cache-editor.png` — resolvido corretamente sem nenhuma regra `postProcessing`.

Quando `markdownOutput.style` é `"docusaurus"`, `"astro-starlight"`, `"nested"`, ou qualquer valor diferente de `"flat"`, o reescritor de links plano não é executado. `postProcessing` recebe o URL markdown original.

**Exemplo do padrão A** — nenhuma configuração necessária para ativos com caminhos relativos ao lado dos arquivos de origem quando `markdownOutput.style = "flat"`. Regras do padrão A `postProcessing` são necessárias apenas para ativos com URL absoluto (por exemplo, `/img/...`) ou substituições direcionadas a CDN.

**Exemplo do padrão B — `markdownOutput.style = "flat"` README** (`examples/nextjs-app`, segundo bloco `documentations[]`)

```json
{
  "description": "Per-locale screenshot folders under translated-docs",
  "search": "images/screenshots/[^/]+/",
  "replace": "images/screenshots/${translatedLocale}/"
}
```

Use a forma genérica `[^/]+`, não uma localidade de origem fixa, para que a regra continue funcionando caso `sourceLocale` mude no futuro.

**Exemplo do padrão B — `markdownOutput.style = "docusaurus"`** (`examples/nextjs-app`, primeiro bloco `documentations[]`)

```json
{
  "description": "Per-locale screenshot folders in docs-site static assets",
  "search": "screenshots/[^/]+/",
  "replace": "screenshots/${translatedLocale}/"
}
```

**Padrão C — Co-localizado Docusaurus** (não requer `regexAdjustments`)

Coloque as capturas de tela em en-GB em `static/assets/` e crie um link simbólico `docs/assets → ../static/assets`. O script `take-screenshots` grava diretamente as outras localidades em `i18n/<locale>/…/current/assets/`. Todos os documentos em todas as localidades referenciam `../assets/name.png` — o caminho é estável e nenhuma reescrita de URL é necessária.

**Exemplo do padrão D** (`examples/nextjs-app`, `svg.style = "flat"`)

```json
"svg": {
  "sourcePath": "images",
  "outputDir": "public/assets",
  "style": "flat"
}
```

`images/*.svg` → arquivos por localidade em `public/assets/`. Aplicativo referencia por localidade: `<img src={`/assets/icon.${locale}.svg`} />`.

**Exemplo mínimo somente com README** (`examples/console-app`)

`examples/console-app/ai-i18n-tools.config.json` traduz `README.md` para `translated-docs/` apenas com [pós-processamento do seletor de idioma](#language-list-block). Nenhuma regra de imagem é definida — apropriado quando o README não tem arquivos raster irmãos ou usa apenas URLs absolutos que seu host já fornece.

Modelos de substituição suportam placeholders como `${translatedLocale}` e `${translatedBasedir}` (lista completa na linha `markdownOutput.postProcessing.regexAdjustments` em [Referência de configuração](#configuration-reference)).

<a id="language-switcher-languagelistblock"></a>
#### Seletor de idioma (`languageListBlock`)

Use `markdownOutput.postProcessing.languageListBlock` quando arquivos markdown traduzidos devem incluir uma linha **“Leia em outros idiomas”** com links — um link por localidade, com valores `href` calculados em relação a cada arquivo de saída.

Este repositório usa isso para [README.md](../README.pt-BR.md) e [docs/GETTING_STARTED.md](../../docs/GETTING_STARTED.md). Após `translate-docs`, cada cópia traduzida recebe um bloco atualizado; por exemplo, [translated-docs/docs/GETTING_STARTED.de.md](../../docs/../translated-docs/docs/GETTING_STARTED.de.md) faz link para arquivos de idioma irmãos em `translated-docs/docs/` e de volta à fonte em inglês em `../../docs/GETTING_STARTED.md`.

**1. Marque o bloco no markdown de origem**

Envolva o seletor de idiomas em HTML (ou quaisquer linhas) delimitadas pelos marcadores de substring `start` e `end`. Este repositório usa:

```markdown
<small>**Read in other languages:** </small>
<small id="lang-list">[English (GB)](../../docs/GETTING_STARTED.md) · [Deutsch](../../docs/../translated-docs/docs/GETTING_STARTED.de.md) · …</small>
```

O texto inicial do link é apenas um espaço reservado. `translate-docs` substitui toda a seção desde a primeira linha contendo `start` até a primeira linha posterior contendo `end` (marcadores dentro de blocos de código cercados são ignorados, portanto exemplos de configuração no mesmo arquivo não correspondem).

**2. Configure o bloco**

`start` e `end` são marcadores de substring arbitrários — não precisam ser `<small id="lang-list">` / `</small>`. Escolha qualquer texto de abertura e fechamento que apareça apenas na seção do seletor de idiomas: outra tag HTML (`<div class="lang-switcher">` … `</div>`), comentários HTML (`<!-- lang-list -->` … `<!-- /lang-list -->`) ou delimitadores apenas em markdown (por exemplo, uma linha `**Languages:**` até uma linha `---`). Defina `start` e `end` na configuração para corresponder exatamente ao que você colocou no arquivo de origem.

Configuração raiz ([ai-i18n-tools.config.json](../../docs/../ai-i18n-tools.config.json)):

```json
"postProcessing": {
  "languageListBlock": {
    "start": "<small id=\"lang-list\">",
    "end": "</small>",
    "separator": " · "
  }
}
```

| Campo       | Função                                                                                                     |
|-------------|----------------------------------------------------------------------------------------------------------|
| `start`     | Substring que identifica a linha de abertura do bloco                                                  |
| `end`       | Substring na linha de fechamento (pode ser a mesma linha que `start` quando ambos aparecem em uma linha)             |
| `separator` | Texto entre os links `[label](../../docs/href)` gerados (este repositório usa `" · "`)                                    |
| `label`     | Opcional: `"local"` (padrão) usa o endônimo de cada idioma do manifesto; `"english"` usa `englishName` |

**3. O que acontece em tempo de execução**

1. **Extração** — o trecho da lista de idiomas **não** é enviado ao modelo (`translatable: false`).
2. **Por arquivo traduzido** — após a tradução dos segmentos e reescrita opcional de links planos, `postProcessing` reconstrói o bloco: um link em markdown por idioma, com rótulos de `ui-languages.json` quando presentes (senão do catálogo mestre embutido, senão `localeDisplayNames`), caminhos relativos ao arquivo sendo escrito.
3. **Atualização da fonte** — ao final de uma execução `translate-docs` / `sync` para documentos, o mesmo bloco canônico é reescrito nos **arquivos fonte em inglês** em `contentPaths`, de modo que adicionar um idioma atualiza o seletor no repositório sem precisar editar manualmente todos os links.

Se um arquivo não tiver um bloco correspondente, a CLI registra um aviso (quando `--verbose`) e mantém o conteúdo inalterado.

**4. Manifesto de rótulos**

Para rótulos em endônimos (`label: "local"`), gere ou mantenha `ui-languages.json` via `generate-ui-languages` (veja [`uiLanguagesPath`](#uilanguagespath-optional)). A configuração deste repositório, voltada apenas para documentos, não possui um pipeline de interface, portanto os rótulos vêm do catálogo mestre embutido para `sourceLocale` + `targetLocales`.

**5. Exemplos neste repositório**

| Exemplo                            | Arquivos                                                                                                                                                                                        |
|------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Este pacote (documentação plana + subdiretórios) | [ai-i18n-tools.config.json](../../docs/../ai-i18n-tools.config.json) (`markdownOutput.style = "flat"`), [README.md](../README.pt-BR.md), [docs/GETTING_STARTED.md](../../docs/GETTING_STARTED.md), saídas em [translated-docs/](../../docs/../translated-docs/) |
| Apenas README mínimo               | [examples/console-app/ai-i18n-tools.config.json](../../docs/../examples/console-app/ai-i18n-tools.config.json) (`markdownOutput.style = "flat"`), [examples/console-app/README.md](../../docs/../examples/console-app/README.md)                     |
| README plano + documentação Docusaurus      | [examples/nextjs-app/ai-i18n-tools.config.json](../../docs/../examples/nextjs-app/ai-i18n-tools.config.json) (segundo bloco: `markdownOutput.style = "flat"`; primeiro bloco: `markdownOutput.style = "docusaurus"`)                                                     |

A linha imediatamente antes de `<small id="lang-list">` (por exemplo, `**Read in other languages:**`) é um segmento normal traduzível e é localizado em cada localidade de destino; apenas a linha de link dentro dos marcadores é regenerada literalmente, exceto por `href` e rótulos orientados por manifesto.

<a id="pathtemplate--jsonpathtemplate-placeholders"></a>
#### Espaços reservados `pathTemplate` / `jsonPathTemplate`

Substitua onde os arquivos traduzidos são gravados definindo `documentations[].markdownOutput.pathTemplate` (markdown e MDX) ou `jsonPathTemplate` (arquivos de rótulos JSON). Ambos aceitam os mesmos placeholders. Os caminhos resolvidos devem permanecer dentro do `outputDir` desse bloco (a CLI rejeita caminhos que saem dele).

Se você usar um `pathTemplate` personalizado, `rewriteRelativeLinks` assume como padrão `false` a menos que você o defina explicitamente — a reescrita de links relativos é projetada para funcionar com `markdownOutput.style = "flat"` sem um modelo personalizado.

| Marcador            | Função                                                                                                       | Exemplo                                                          |
|------------------------|------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| `{outputDir}`          | Caminho absoluto resolvido do `outputDir` deste bloco de documentação                                           | `/home/acme/repo/i18n`                                           |
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

Com `markdownOutput.style = "flat"` e sem `pathTemplate` personalizado, um padrão comum mantém apenas o nome do arquivo por meio de `{stem}` e `{extension}`, por exemplo `{outputDir}/{stem}.{locale}{extension}`, o que resulta em `…/guide.de.md` sob o `outputDir` resolvido.

<a id="troubleshooting"></a>
### Solução de problemas

**Links de âncora de seção não funcionam nos documentos traduzidos**

Um link como `[label](../../docs/other.md#section-id)` pode abrir o arquivo traduzido correto, mas falhar ao rolar até o título pretendido — ou saltar para a seção errada. O fragmento `#…` não corresponde mais a nenhum título `id` nessa localidade.

Causas comuns:

- Os títulos de origem nunca tiveram IDs de âncora explícitas; o site gera slugs a partir do texto visível do título, que muda após a tradução.
- Você renomeou um título na origem, mas a linha `<a id="…"></a>` anterior está ausente ou ainda possui o ID antigo.
- Os links de âncora usam um fragmento `#…` adivinhado a partir de palavras em inglês, em vez do ID que `write-heading-ids` geraria.

**Correção**

1. Execute `ai-i18n-tools write-heading-ids` no seu `.md` de **origem** / `.mdx` (mesmo `documentations[]` / `contentPaths` que `translate-docs`). Ele insere `<a id="slug"></a>` antes de cada título ATX, ou atualiza uma âncora existente quando o texto do título não corresponde mais ao slug atual.
2. Aponte os links de âncora para esses IDs — por exemplo, `[setup](../../docs/guide.md#first-run)`, onde `#first-run` corresponde à linha de âncora acima do título de destino, não a um slug inferido apenas do título em inglês.
3. Execute novamente `translate-docs` (ou `sync --force-update`) para que cada cópia em todas as localidades inclua as linhas de âncora atualizadas.

Use `--dry-run` em `write-heading-ids` primeiro para visualizar as alterações. Veja [Anchor links in flat layout](#anchor-links-when-markdownoutputstyle--flat) para o padrão completo.

---

<a id="combined-workflow-ui--docs"></a>
## Fluxo de trabalho combinado (UI + Documentação)

Habilite todos os recursos em uma única configuração para executar ambos os fluxos de trabalho juntos:

<details>
<summary>Exemplo de configuração combinada de UI + docs</summary>

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

</details>

<br />

`glossary.uiGlossary` direciona a tradução de documentos ao mesmo catálogo `strings.json` da interface, mantendo a terminologia consistente; `glossary.userGlossary` adiciona substituições CSV para termos do produto.

Execute `npx ai-i18n-tools sync` para rodar um pipeline: **extrair** strings de interface (se `features.extractUIStrings`), **traduzir** strings de interface (se `features.translateUIStrings`), **traduzir arquivos SVG** (se `features.translateSVG` e um bloco `svg` estiverem definidos), depois **traduzir documentação** (cada bloco `documentations`: markdown/JSON conforme configurado). Pule etapas com `--no-ui`, `--no-svg` ou `--no-docs`. A etapa de documentação aceita `--dry-run`, `-p` / `--path`, `--force` e `--force-update` (os dois últimos só se aplicam quando a tradução de documentação é executada; são ignorados se você passar `--no-docs`).

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

<a id="mixed-documentation-workflow-markdownoutputstyle--docusaurus--flat"></a>
### Fluxo de trabalho de documentação mista (`markdownOutput.style = "docusaurus"` + `"flat"`)

Você pode combinar vários pipelines de documentação na mesma configuração adicionando mais de uma entrada em `documentations`. Essa é uma configuração comum quando um projeto possui um site Docusaurus (`markdownOutput.style = "docusaurus"`) mais arquivos markdown no nível raiz (por exemplo, um arquivo readme do repositório com `markdownOutput.style = "flat"`) que devem ser traduzidos com nomes de arquivo com sufixo de localidade.

<details>
<summary>Exemplo de configuração mista Docusaurus + README plana</summary>

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
      "description": "Docusaurus site content (markdown)",
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
      "description": "Root README with markdownOutput.style flat",
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "markdownOutput": {
        "style": "flat",
        "postProcessing": {
          "languageListBlock": {
            "start": "<small id=\"lang-list\">",
            "end": "</small>",
            "separator": " · ",
            "label": "local"
          }
        }
      }
    }
  ]
}
```

</details>

<br />

Como isso é executado com `npx ai-i18n-tools sync`:

- As strings da interface são extraídas/traduzidas de `src/` para `public/locales/`.
- O primeiro bloco de documentos traduz **markdown** de `docs-site/docs/` para `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/` (páginas de documentação localizadas).
- Com `features.translateJSON` e `jsonSource`, esse mesmo bloco também traduz **JSON do shell Docusaurus** em `docs-site/i18n/en/` para cada pasta de localidade de destino — barra de navegação, rodapé e catálogos de tema/plugin, não o conteúdo do corpo MDX.
- O segundo bloco de documentos traduz `README.md` para arquivos com sufixo de localidade em `translated-docs/` (`markdownOutput.style = "flat"`).
- Todos os blocos de docs compartilham `cacheDir`, portanto segmentos inalterados são reutilizados entre execuções para reduzir chamadas à API e custos.

---

<a id="translation-dashboard"></a>
## Painel de Tradução

Execute:

```bash
ai-i18n-tools dashboard
# Optional: choose port, do not auto-open browser
# ai-i18n-tools dashboard -p 8765 --no-open
```

Isso inicia uma interface web local alimentada pelo seu banco de dados SQLite `cacheDir` configurado — a mesma pasta que a CLI usa para segmentos de documentação, logs e metadados relacionados. Inclui as abas **Documentação** (segmentos de doc em cache), **Strings de interface**, **Plurais de interface**, **Glossário**, **Falhas**, **Problemas em Markdown** e **Estatísticas**.

![Translation Dashboard](../../docs/translation-cache-editor.png)

Se você **editar linhas do cache** neste aplicativo (por exemplo, segmentos de documentação), execute `sync --force-update` ou o comando de tradução equivalente com `--force-update` para que as saídas em disco correspondam ao cache; se o **texto de origem** no repositório for alterado posteriormente, os hashes dos segmentos mudarão e as edições manuais para o texto antigo serão substituídas.

<a id="failures-document-translation"></a>
### Falhas (tradução de documentos)

A aba **Falhas** é destinada apenas à tradução de **documentação**. Ela lê registros de falhas escritos no SQLite quando um segmento não pôde ser traduzido com sucesso para um idioma — por exemplo, saída do modelo vazia ou inválida, erros de validação pós-tradução (`AST mismatch`, vazamentos de placeholders e verificações de **qualidade** semelhantes) ou uma condição **fatal** que impediu o progresso. Ela ajuda a responder: *qual segmento de origem falhou, para qual idioma e modelo, e qual mensagem de erro foi registrada?*

<a id="when-to-use-it"></a>
#### Quando usá-lo

- Após `translate-docs` ou `sync` terminar com erros, idiomas parciais ou logs confusos — você pode classificar e filtrar falhas em vez de apenas rolar a saída do terminal.
- Quando deseja **priorizar retrabalho**: ordene por **# Falhas** para que segmentos que falharam repetidamente em várias tentativas apareçam primeiro; esses são fortes candidatos para **simplificação ou reformatação** no markdown de origem, para que execuções futuras tenham sucesso.
- Quando você precisa do **segmento exato** — caminho do arquivo, dica de linha, hash da origem e texto completo da origem — para editar o parágrafo correto no seu repositório.

<a id="why-source-edits-matter"></a>
#### Por que edições na origem são importantes

Marcação embutida densa (**negrito** misturado com `` `code` ``, ênfase aninhada, frases longas com muitos spans) dificulta que os modelos retornem traduções que ainda passem nas verificações estruturais. Segmentos com **múltiplas falhas registradas** geralmente melhoram mais com **reescrita ou divisão** da origem (ou movendo exemplos para blocos de código destacados) do que com a repetição da tradução em texto inalterado. Isso está alinhado com [Markdown complexo e falhas nas verificações de qualidade](#complex-markdown-and-failed-quality-checks).

<a id="how-to-use-the-tab"></a>
#### Como usar a aba

1. Abra **Falhas** no painel (mesma sessão do navegador que [Translation Dashboard](#translation-dashboard)).
2. Leia a faixa de **resumo** (segmentos com qualquer falha, mais contagens de segmentos com **1**, **2** ou **3+** registros de falha).
3. Filtre por **nome de arquivo** parcial, **localidade**, **modelo**, **erro de qualidade** (valores provenientes do seu cache), **somente fatais** e opcionalmente por **hash de origem**, **texto de origem** ou substring de **mensagem de erro** — depois clique em **Aplicar**.
4. Escolha **Ordenar: # Falhas** (padrão) ou **Ordenar: caminho do arquivo + número da linha**.
5. Use a paginação no topo ou na parte inferior da tabela. **Clique em uma linha** para alternar o texto completo da origem. O controle de link na linha (quando habilitado) solicita ao processo do servidor que registre dicas de arquivo/linha no **terminal** onde `ai-i18n-tools dashboard` está em execução — útil para saltar do navegador para seu editor.
6. Corrija o **arquivo de origem** em seu projeto, depois execute `translate-docs` ou `sync` novamente. Se a lista parecer **desatualizada** após uma execução bem-sucedida, execute `ai-i18n-tools sync --force-update` e recarregue o painel (o painel Falhas exibe a mesma dica).

Para depuração baseada em arquivos ao lado da interface, você ainda pode usar `translate-docs --debug-failed` para gravar detalhes de `FAILED-TRANSLATION` em `cacheDir` durante novas tentativas — consulte [Comportamento do cache e flags `translate-docs`](#cache-behaviour-and-translate-docs-flags).

<a id="markdown-issues-static-checks"></a>
### Problemas de Markdown (verificações estáticas)

A aba **Problemas em Markdown** lista linhas da tabela `markdown_source_issues` do SQLite. Cada linha é uma detecção **pré-tradução**: por exemplo, delimitadores consecutivos que nunca formam pares como ênfase/risco sob as mesmas regras estilo CommonMark que `translate-docs` usa para mascaramento, um trecho de código embutido aberto com crases mas nunca fechado, `STRONG_OUTSIDE_INLINE_CODE` quando `**` / `__` envolvem um trecho `` `...` `` (coloque a ênfase dentro das crases ou use código simples), ou `STRONG_OUTSIDE_LINK` quando `**` / `__` envolvem um link `[text](../../docs/url)` (coloque o negrito apenas dentro do texto do link). Isso **não** é o mesmo que **Falhas**, que registra saídas do modelo por localidade e problemas de validação pós-tradução (`AST mismatch`, vazamento de marcadores de posição, etc.).

Use esta guia quando quiser corrigir o **markdown de origem** antes de gastar tokens—especialmente quando verificações de qualidade falham repetidamente na estrutura. Filtre por caminho de arquivo (correspondência parcial com a chave de cache, incluindo prefixos `doc-block:{index}:`), **código do problema** ou **hash de origem**; ordene por caminho de arquivo + linha ou pelo horário mais recente da verificação. O botão de link registra dicas de arquivo/linha no terminal onde `ai-i18n-tools dashboard` está em execução (mesma ideia da guia Documentação).

**Atualizando linhas:** execute `ai-i18n-tools check-markdown` (escopo opcional `-p` / `--path`, `--no-cache` para pular o SQLite, `--json` para saída legível por máquina no stdout com linhas legíveis por humanos no stderr). Por padrão, cada execução `translate-docs` em arquivos markdown também reanalisa e substitui linhas para esse arquivo quando `documentations[].warnMarkdownSourceIssues` não está definido como `false`. Limpar todas as traduções para um caminho de arquivo em cache remove as linhas de problemas de markdown para esse caminho como parte do mesmo caminho de limpeza usado para falhas.

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

- O manifesto está fora do `ui.flatOutputDir` e você precisa apontar a CLI para ele explicitamente.
- Você deseja o [pós-processamento do seletor de idiomas](#language-list-block) (`languageListBlock`) para criar rótulos de localidade a partir do manifesto.
- `extract` deve mesclar entradas `englishName` do manifesto em `strings.json` (requer `ui.reactExtractor.includeUiLanguageEnglishNames: true`).

<a id="concurrency-optional"></a>
### `concurrency` (opcional)

Número máximo de **locales de destino** traduzidos simultaneamente (`translate-ui`, `translate-docs`, `translate-svg` e as etapas correspondentes dentro de `sync`). Se omitido, a CLI usa **4** para tradução de interface e **3** para tradução de documentação (padrões embutidos). Substitua por execução com `-j` / `--concurrency`.

<a id="batchconcurrency-optional"></a>
### `batchConcurrency` (opcional)

**translate-docs** e **translate-svg** (e a etapa de documentação do `sync`): número máximo de requisições paralelas em **lote** para OpenRouter por arquivo (cada lote pode conter muitos segmentos). Padrão é **4** quando omitido. Ignorado pelo `translate-ui`. Substitua com `-b` / `--batch-concurrency`. Em `sync`, `-b` aplica-se apenas à etapa de tradução de documentação.

<a id="fileconcurrency-optional"></a>
### `fileConcurrency` (opcional)

Número máximo de arquivos processados simultaneamente **dentro de um único idioma** durante `translate-docs` e `sync`. Quando definido como um valor maior que **1**, os arquivos dentro do mesmo idioma são processados em paralelo usando um semáforo para controlar o uso de memória. O valor padrão é **1** (processamento sequencial) quando omitido. Valores mais altos podem melhorar significativamente o desempenho em operações limitadas por E/S, especialmente quando todos os segmentos já estão em cache (sem chamadas à API necessárias).

**Exemplo:**

```json
{
  "fileConcurrency": 4
}
```

**Caso de uso:** Defina isso como `2-4` ao executar `sync --force-update` com 100% de acertos no cache para reduzir o tempo total de processamento. A melhoria é mais perceptível com muitos arquivos pequenos.

<a id="batchsize--maxbatchchars-optional"></a>
### `batchSize` / `maxBatchChars` (opcional)

Agrupamento de segmentos para tradução de documentos: quantos segmentos por requisição à API e um limite máximo de caracteres. Padrões: **20** segmentos, **4096** caracteres (quando omitido).

<a id="openrouter"></a>
### `openrouter`

- `baseUrl`
  URL base da API OpenRouter. Padrão: `https://openrouter.ai/api/v1`.
- `translationModels`
  Lista ordenada preferencial de IDs de modelos. O primeiro é tentado primeiro; entradas posteriores são usadas como alternativas em caso de erro. Apenas para `translate-ui`, você também pode definir `ui.preferredModel` para tentar um modelo antes dessa lista (veja `ui`).
- `defaultModel`
  Modelo principal único legado. Usado apenas quando `translationModels` não está definido ou está vazio.
- `fallbackModel`
  Modelo de fallback único legado. Usado após `defaultModel` quando `translationModels` não está definido ou está vazio.
- `maxTokens`
  Número máximo de tokens de conclusão por requisição. Padrão: `8192`.
- `temperature`
  Temperatura de amostragem. Padrão: `0.2`.
- `requestTimeoutMs`
  Tempo máximo em milissegundos para aguardar cada requisição HTTP ao OpenRouter (completions de chat e chamadas internas `GET /models`). Padrão: `30000` (30 segundos).

**Por que usar múltiplos modelos:** Diferentes provedores e modelos têm custos variados e oferecem níveis distintos de qualidade entre idiomas e localidades. Configure `openrouter.translationModels` **como uma cadeia de fallback ordenada** (em vez de um único modelo), para que a CLI possa tentar o próximo modelo caso uma solicitação falhe.

Considere a lista abaixo como uma **base** que você pode expandir: se a tradução para uma localidade específica for ruim ou falhar, pesquise quais modelos suportam efetivamente esse idioma ou script (consulte recursos online ou a documentação do seu provedor) e adicione esses IDs do OpenRouter como alternativas adicionais.

Esta lista foi **testada quanto à ampla cobertura de localidades** em um grande projeto de documentação com 36 localidades de destino; serve como um padrão prático, mas não há garantia de bom desempenho para todas as localidades.

Exemplo de `translationModels` (mesmos padrões do `npx ai-i18n-tools init`):

<details>
<summary>Lista padrão de fallback para translationModels</summary>

```json
"translationModels": [
  "qwen/qwen3-235b-a22b-2507",
  "openai/gpt-4o-mini",
  "deepseek/deepseek-v4-flash",
  "anthropic/claude-3-haiku",
  "qwen/qwen3.6-plus",
  "anthropic/claude-3.5-haiku",
  "google/gemini-3-flash-preview",
  "~anthropic/claude-haiku-latest",
  "google/gemma-4-31b-it",
  "~anthropic/claude-sonnet-latest"
  // … add more fallback models as needed
]
```

</details>

<br />

Defina `OPENROUTER_API_KEY` no seu ambiente ou no arquivo `.env`.

Antes de mudar `translationModels`, execute `npx ai-i18n-tools check-models` para verificar cada id de modelo configurado contra o catálogo ao vivo do OpenRouter (`GET /models`). Ele relata ids que estão ausentes ou ultrapassados `expiration_date`, lista modelos válidos com preços estimados de entrada/saída (USD por 1M de tokens) e sai com um status diferente de zero quando qualquer id configurado é inválido. Requer `OPENROUTER_API_KEY`.

<a id="features"></a>
### `features`

| Campo                | Fluxo de trabalho | Descrição                                                                                                                                                        |
|----------------------|----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `extractUIStrings`   | 1        | Escaneia a fonte em busca de `t("…")` / `i18n.t("…")`, mesclando a descrição opcional `package.json` e (se habilitado) os valores `ui-languages.json` `englishName` em `strings.json`. |
| `translateUIStrings` | 1        | Traduz as entradas `strings.json` e gera arquivos JSON por localidade.                                                                                                  |
| `translateMarkdown`  | 2        | Traduz arquivos `.md` / `.mdx` (planos ou documentos Docusaurus).                                                                                                                                   |
| `translateJSON`      | 2        | JSON de rótulos do Docusaurus de `docusaurus write-translations` (interface de tema/barra de navegação/rodapé/plugin), **não** corpos de páginas markdown.                                             |
| `translateSVG`       | 2        | Traduz arquivos `.svg` (requer o bloco `svg` no nível superior).                                                                                                       |

**Traduz** arquivos SVG com `translate-svg` quando `features.translateSVG` é verdadeiro e um bloco `svg` de nível superior está configurado. O comando `sync` executa essa etapa quando ambos estiverem definidos (a menos que `--no-svg`).

<a id="ui"></a>
### `ui`

- `sourceRoots`  
  Diretórios ou padrões glob (relativos ao cwd) verificados em busca de chamadas `t("…")`. Suporta padrões como `src/` ou `["src/**/*.ts"]`.
- `stringsJson`  
  Caminho para o arquivo de catálogo mestre. Atualizado por `extract`.
- `flatOutputDir`  
  Diretório onde os arquivos JSON por idioma são escritos (`de.json`, etc.).
- `preferredModel`  
  Opcional. ID do modelo OpenRouter tentado primeiro apenas para `translate-ui`; depois `openrouter.translationModels` (ou modelos legados) em ordem, sem duplicar este ID.
- `reactExtractor.funcNames`  
  Nomes adicionais de funções para verificar (padrão: `["t", "i18n.t"]`).
- `reactExtractor.extensions`  
  Extensões de arquivo a incluir (padrão: `[".js", ".jsx", ".ts", ".tsx"]`).
- `reactExtractor.includePackageDescription`  
  Quando `true` (padrão), `extract` também inclui `package.json` `description` como uma string de interface quando presente.
- `reactExtractor.packageJsonPath`  
  Caminho personalizado para o arquivo `package.json` usado para essa extração opcional de descrição.
- `reactExtractor.includeUiLanguageEnglishNames`

Quando `true` (padrão `false`), `extract` também adiciona cada `englishName` do manifesto em `uiLanguagesPath` a `strings.json` quando ainda não presente na verificação de origem (mesmas chaves de hash). Requer `uiLanguagesPath` apontando para um `ui-languages.json` válido.

<a id="cachedir"></a>
### `cacheDir`

- `cacheDir`
Diretório de cache SQLite (compartilhado por todos os blocos `documentations`). Reutilizado entre execuções. Se você estiver migrando de um cache personalizado de tradução de documentos, arquive ou exclua-o — `cacheDir` cria seu próprio banco de dados SQLite e não é compatível com outros esquemas.

<a id="best-practice-for-git-exclusions"></a>
#### Melhor prática para exclusões no git:

- Exclua o conteúdo da pasta de cache de tradução (por exemplo, usando `.gitignore` ou `.git/info/exclude`) para evitar o commit de artefatos temporários de cache.
- Mantenha `cache.db` (não exclua rotineiramente), pois preservar o cache SQLite evita a re-tradução de segmentos inalterados. Isso economiza tempo de execução e custos de API ao atualizar ou modificar software que usa `ai-i18n-tools`.
- Exclua arquivos temporários e de log para evitar o commit de arquivos de backup e depuração.

<br/>

**Exemplo:**

```gitignore
# Translation cache directory
.translation-cache/*

# Keep SQLite cache for reuse
!.translation-cache/cache.db

# Temporary and log files
*.tmp
*.log
```

<a id="documentations"></a>
### `documentations`

Array de blocos do pipeline de documentação. `translate-docs` e a fase de docs do `sync` **processam cada** bloco em ordem.

**Fontes de conteúdo**

- `description`
Observação opcional legível por humanos para este bloco (não usada para tradução). É prefixada no título `translate-docs` `🌐` quando definida; também exibida nos cabeçalhos da seção `status`.
- `contentPaths`
Corpos de páginas Markdown/MDX a serem traduzidos (`translate-docs` verifica esses por `.md` / `.mdx`). Suporta **caminhos de diretório ou padrões glob** (por exemplo, `"docs/**/*.md"`, `"guides/*.mdx"`). É de onde vem o texto da documentação localizada.
- `sourceFiles`
Alias opcional mesclado em `contentPaths` durante o carregamento.
- `targetLocales`
Subconjunto opcional de localidades apenas para este bloco (caso contrário, usa a raiz `targetLocales`). As localidades efetivas de documentação são a união entre os blocos.
- `jsonSource`
Opcional. Diretório de origem para catálogos de rótulos JSON do Docusaurus para este bloco (por exemplo, `"i18n/en"` de `docusaurus write-translations`). Os corpos das páginas sempre vêm de `contentPaths`; `jsonSource` fornece apenas JSON da interface/casca, não MDX.

**Layout de saída**

- `outputDir`
Diretório raiz para a saída traduzida deste bloco.
- `markdownOutput.style`
`"nested"` (padrão), `"flat"`, `"doc-system"`, ou aliases `"docusaurus"` / `"astro-starlight"`.
- `markdownOutput.localeSubpath`
Segmento de caminho entre `{locale}/` e `{relativeToDocsRoot}` para `doc-system` (obrigatório ao usar `style: "doc-system"` diretamente; predefinido ao usar um alias). Use `""` para pastas de localidade no estilo Starlight.
- `markdownOutput.docsRoot`
Diretório raiz da documentação de origem para o layout do Docusaurus (por exemplo, `"docs"`).
- `markdownOutput.pathTemplate`
Caminho personalizado de saída para markdown. Substituições: <code>"{outputDir}"</code>, <code>"{locale}"</code>, <code>"{LOCALE}"</code>, <code>"{relPath}"</code>, <code>"{stem}"</code>, <code>"{basename}"</code>, <code>"{extension}"</code>, <code>"{docsRoot}"</code>, <code>"{relativeToDocsRoot}"</code>.
- `markdownOutput.jsonPathTemplate`
Caminho personalizado de saída JSON para arquivos de rótulos. Suporta os mesmos substituições que `pathTemplate`.
- `markdownOutput.flatPreserveRelativeDir`
Quando `markdownOutput.style = "flat"`, mantenha os subdiretórios de origem para que arquivos com o mesmo nome não entrem em conflito.
- `markdownOutput.rewriteRelativeLinks`
Reescreva links relativos após a tradução (ativado automaticamente quando `markdownOutput.style = "flat"` e sem `pathTemplate` personalizado).
- `markdownOutput.linkRewriteDocsRoot`
Raiz do repositório usada ao calcular prefixos de reescrita de links planos. Geralmente mantenha como `"."`, a menos que sua documentação traduzida esteja sob uma raiz de projeto diferente.

**Pós-processamento**

- `markdownOutput.postProcessing`
Transformações opcionais no **corpo markdown traduzido** (chaves YAML e valores de front matter não textuais são preservados). Executado após a remontagem dos segmentos e a reescrita de links planos, e antes de `addFrontmatter`.
- `markdownOutput.postProcessing.regexAdjustments`
Lista ordenada de `{ "description"?, "search", "replace" }`. `search` é um padrão regex (string simples usa a flag `g`, ou `/pattern/flags`). `replace` suporta substituições como `${translatedLocale}`, `${sourceLocale}`, `${sourceFullPath}`, `${translatedFullPath}`, `${sourceFilename}`, `${translatedFilename}`, `${sourceBasedir}`, `${translatedBasedir}`.
- `markdownOutput.postProcessing.languageListBlock`
`{ "start", "end", "separator", "label"? }` — regera uma linha limitada de "leia em outros idiomas" no markdown de origem e traduzido. Veja [Seletor de idiomas (`languageListBlock`)](#language-list-block) para configuração, comportamento e exemplos de repositório.

**Comportamento e metadados**

- `translateFrontmatterFields`
Mesmo nível que `markdownOutput` (por bloco `documentations[]`). Padrão `true`: traduzir o texto YAML voltado ao usuário para Starlight/Docusaurus (rótulos `title`, `description`, `sidebar.label`, `sidebar_label`, `keywords`, `hero.title`, `hero.tagline`, `hero.image.alt`, `hero.actions[].text`, `pagination_label`, `prev`/`next`). Defina `false` para manter todo o bloco de front matter inalterado; passe um array de strings para restringir a caminhos específicos com notação por ponto.
- `segmentSplitting`
Mesmo nível que `markdownOutput` (por bloco `documentations[]`). Segmentos opcionais mais granulares para extração de `translate-docs`: `{ "enabled", "maxCharsPerSegment"?, "splitPipeTables"?, "splitDenseParagraphs"?, "maxLinesPerParagraphChunk"?, "splitLongLists"?, "maxListItemsPerChunk"? }`. Quando `enabled` é `true` (padrão quando `segmentSplitting` é omitido), parágrafos densos, tabelas GFM com pipes (o primeiro bloco inclui cabeçalho, separador e primeira linha de dados) e listas longas são divididos; subpartes são unidas com uma única quebra de linha (`tightJoinPrevious`). Defina `"enabled": false` para usar um segmento por bloco do corpo separado por linha em branco apenas.
- `warnMarkdownSourceIssues`
Quando `true` (padrão quando omitido), cada execução de `translate-docs` reanalisa os segmentos markdown em busca de delimitadores arriscados ou códigos embutidos não fechados, exibe avisos no terminal e substitui as linhas `markdown_source_issues` no caminho do arquivo de cache desse arquivo. Defina `false` para pular avisos e atualizações do SQLite para este bloco.
- `addFrontmatter`
Quando `true` (padrão quando omitido), os arquivos markdown traduzidos incluem chaves YAML: `translation_last_updated`, `source_file_mtime`, `source_file_hash`, `translation_language`, `source_file_path` e, quando pelo menos um segmento tiver metadados de modelo, `translation_models` (lista ordenada de IDs de modelos do OpenRouter utilizados). Defina como `false` para omitir.

<br/>

**Exemplo (`markdownOutput.style = "flat"` — caminhos de capturas de tela + invólucro opcional de lista de idiomas):**

<details>
<summary>Exemplo de pós-processamento com layout plano (capturas de tela + bloco languageListBlock)</summary>

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
      "separator": " · ",
      "label": "local"
    }
  }
}
```

</details>

<a id="svg"></a>
### `svg`

Caminhos e estrutura de nível superior para arquivos SVG. A tradução é executada apenas quando `features.translateSVG` é verdadeiro (via `translate-svg` ou o estágio SVG de `sync`).

| Campo            | Descrição                                                                                                                                                                                                                                                        |
|------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `sourcePath`     | Um ou mais diretórios **ou padrões glob** (por exemplo, `"images/*.svg"`, `"**/icons/*.svg"`). Os padrões são resolvidos em relação à raiz do projeto e escaneados recursivamente em busca de arquivos `.svg`.                                                                         |
| `outputDir`                   | Diretório raiz para a saída de SVG traduzido.                                                                                                                                                                                                                                          |
| `style`                       | `"flat"` ou `"nested"` quando `pathTemplate` não estiver definido.                                                                                                                                                                                                                               |
| `pathTemplate`                | Caminho personalizado de saída SVG. Substituições: <code>"{outputDir}"</code>, <code>"{locale}"</code>, <code>"{LOCALE}"</code>, <code>"{relPath}"</code>, <code>"{stem}"</code>, <code>"{basename}"</code>, <code>"{extension}"</code>, <code>"{relativeToSourceRoot}"</code>. |
| `forceLowercase` | Texto traduzido em letras minúsculas na remontagem SVG. Útil para designs que dependem de rótulos totalmente em letras minúsculas.                                                                                                                                                                                |

<a id="glossary"></a>
### `glossary`

| Campo          | Descrição                                                                                                                                                                 |
|----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `uiGlossary`   | Caminho para `strings.json` - gera automaticamente um glossário a partir das traduções existentes.                                                                                                 |
| `userGlossary` | Caminho para um CSV com colunas `Original language string` (ou `en`), `locale`, `Translation` - uma linha por termo de origem e localidade de destino (`locale` pode ser `*` para todos os destinos). |

**Gere um arquivo CSV de glossário vazio:**

```bash
npx ai-i18n-tools glossary-generate
```

---

<a id="cli-reference"></a>
## Referência da CLI

- `version`
Exibe versão da CLI e carimbo de data da compilação (mesmas informações que `-V` / `--version` no programa raiz).

- `init [-t ui-markdown\|ui-docusaurus\|ui-starlight] [-o path] [--with-translate-ignore]`
Gravar um arquivo de configuração inicial (inclui `concurrency`, `batchConcurrency`, `batchSize`, `maxBatchChars` e `documentations[].addFrontmatter`). `--with-translate-ignore` cria um `.translate-ignore` inicial.

- `check-models`
Valida cada ID de modelo OpenRouter configurado contra `GET /models` (membro do catálogo, `expiration_date`, USD por 1 milhão de tokens para prompt/complemento). Requer `OPENROUTER_API_KEY`. Encerra com erro se algum ID configurado estiver ausente ou expirado. Respeita `openrouter.requestTimeoutMs` para a requisição do catálogo.

- `extract`
Atualiza `strings.json` a partir de literais `t("…")` / `i18n.t("…")`, descrição opcional `package.json` e entradas opcionais `englishName` do manifesto (veja `ui.reactExtractor`). Requer `features.extractUIStrings`.

- `generate-ui-languages [--master <path>] [--dry-run]`
Grava `ui-languages.json` em `ui.flatOutputDir` (ou `uiLanguagesPath` se definido) usando `sourceLocale` + `targetLocales` e o `data/ui-languages-complete.json` embutido (ou `--master`). Emite avisos e insere marcadores `TODO` para localidades ausentes no arquivo mestre. Se você já tiver um manifesto com valores personalizados em `label` ou `englishName`, eles serão substituídos pelos padrões do catálogo mestre — revise e ajuste o arquivo gerado posteriormente.

- `translate-docs …`
Traduz markdown/MDX e JSON para cada bloco `documentations` (`contentPaths`, opcional `jsonSource`). `-j`: número máximo de localidades em paralelo; `-b`: número máximo de chamadas à API em lote por arquivo. `--prompt-format`: formato de transmissão em lote (`xml` \| `json-array` \| `json-object`). Veja [Comportamento de cache e flags `translate-docs`](#cache-behaviour-and-translate-docs-flags) e [Formato de prompt em lote](#batch-prompt-format).

- `write-heading-ids …`
Requer pelo menos um bloco `documentations[]`. Coleta `.md` / `.mdx` em cada bloco `contentPaths` (respeita `.translate-ignore`). Insere uma linha de âncora HTML `<a id="slug"></a>` imediatamente **antes** de cada título ATX plano (`#`) (ignora títulos dentro de blocos de código com delimitadores); quando uma linha de âncora já estiver presente, atualiza o `id` se ele não corresponder mais ao slug derivado do texto atual do título. `-p` / `--path` ou `-f` / `--file`: limita a um arquivo ou diretório relativo ao projeto. `--slug-style`: `github` (padrão; doctoc / anchor-markdown-header), `bitbucket`, `gitlab`, `pymdown`, `azure-devops`. Com `pymdown`, opcionais `--pymdown-case`, `--pymdown-normalize`, `--pymdown-percent-encode` / `--no-pymdown-percent-encode`. `--dry-run`: mostra apenas alterações.

- `strip-md-bold-inline …`
Requer pelo menos um bloco `documentations[]`. Remove `**` ao redor de códigos embutidos em `.md` / `.mdx` sob o `contentPaths` de cada bloco (respeita `.translate-ignore`). `-p` / `--path` ou `-f` / `--file`, `--dry-run`, `--no-backup` (ignora `.backup.*` com carimbo de data antes da sobrescrita).

- `check-markdown …`
Analisa markdown/MDX nos arquivos sob o `contentPaths` de cada bloco `documentations[]` (mesma descoberta que `translate-docs`, respeita `.translate-ignore`): pares de delimitadores, códigos embutidos não fechados e `STRONG_OUTSIDE_INLINE_CODE` / `STRONG_OUTSIDE_LINK` quando `**`/`__` envolvem um trecho `` `...` `` ou um link `[text](../../docs/url)`. `-p` / `--path` ou `-f` / `--file`: escopo opcional. Exibe linhas `relativePath:line: [ISSUE_CODE] message` no **stderr**; código de saída **1** se houver algum problema. `--json`: relatório JSON no **stdout**. Grava `markdown_source_issues` em `cacheDir` exceto quando `--no-cache`. `-v` adiciona hashes da origem às linhas do stderr.

- `translate-svg …`
Traduz arquivos SVG configurados em `config.svg` (separado da documentação). Exige `features.translateSVG`. Mesmas ideias de cache da documentação; suporta `--no-cache` para pular leituras/escritas no SQLite nesta execução. `-j`, `-b`, `--force`, `--force-update`, `-p` / `--path`, `--dry-run`.

- `translate-ui [--locale <code>] [--force] [--dry-run] [-j <n>]`
Traduz apenas strings da interface. `--force`: traduz novamente todas as entradas por localidade (ignora traduções existentes). `--dry-run`: sem gravações, sem chamadas à API. `-j`: número máximo de localidades em paralelo. Exige `features.translateUIStrings`.

- `lint-source [-l <code>] [--chunk <n>] [--dry-run] [--json] [-j <n>]`
Executa `extract` **primeiro** (requer `features.extractUIStrings`) para que `strings.json` corresponda à origem, depois revisão por LLM das strings da interface de usuário em **origem-local** (ortografia, gramática). **Dicas de terminologia** vêm apenas do CSV `glossary.userGlossary` (mesmo escopo de `translate-ui` — não de `strings.json` / `uiGlossary`, para que textos incorretos não sejam reforçados como glossário). Usa OpenRouter (`OPENROUTER_API_KEY`). Apenas informativo (sai com **0** ao concluir a execução). Grava `lint-source-results_<timestamp>.log` em `cacheDir` como um relatório **legível por humanos** (resumo, problemas e linhas **OK** por string); o terminal imprime apenas contagens resumidas e problemas (sem linhas `[ok]` por string). Imprime o nome do arquivo de log na última linha. `--json`: relatório JSON totalmente legível por máquina apenas no stdout (o arquivo de log permanece legível por humanos). `--dry-run`: ainda executa `extract`, depois imprime apenas o plano do lote (sem chamadas à API). `--chunk`: strings por lote da API (padrão **50**). `-j`: lotes paralelos máximos (padrão `concurrency`). Com `--json`, a saída no estilo humano vai para stderr. Os links usam `path:line` como o botão “link” nas strings da interface do `dashboard`.

- `export-ui-xliff [-l <codes>] [-o <dir>] [--untranslated-only] [--dry-run]`
Exporta `strings.json` para XLIFF 2.0 (uma `.xliff` por localidade de destino). `-o` / `--output-dir`: diretório de saída (padrão: mesma pasta do catálogo). `--untranslated-only`: apenas unidades sem tradução para essa localidade. Somente leitura; sem API.

- `sync …`
Extração (se habilitada), depois tradução da interface, depois `translate-svg` quando `features.translateSVG` e `config.svg` estão definidos, depois tradução da documentação — exceto se pulada com `--no-ui`, `--no-svg` ou `--no-docs`. Flags compartilhadas: `-l`, `-p` / `-f`, `--dry-run`, `-j`, `-b` (apenas agrupamento de documentação), `--force` / `--force-update` (apenas documentação; mutuamente exclusivas quando a documentação é executada). A fase de documentação também repassa `--emphasis-placeholders` e `--debug-failed` (mesmo significado que `translate-docs`). `--prompt-format` não é uma flag `sync`; a etapa de documentação usa o padrão embutido (`json-array`).

- `status [--max-columns <n>]`
Quando `features.translateUIStrings` está ativado, imprime cobertura da interface por localidade (`Translated` / `Missing` / `Total`). Depois imprime o status da tradução em markdown por arquivo × localidade (sem filtro `--locale`; as localidades vêm da configuração). Listas grandes de localidades são divididas em tabelas repetidas com até `n` colunas de localidade (padrão **9**) para manter as linhas estreitas no terminal.

- `statistics [--max-columns <n>]`
Exibe cache de documentação e estatísticas `strings.json` (mesmas agregações do Painel de Tradução → **Estatísticas**). `--max-columns`: número máximo de colunas por localidade na tabela modelo × localidade (padrão igual ao painel).

- `cleanup [--dry-run] [--no-backup] [--backup <path>]`
Executa primeiro o `sync --force-update` (extração, UI, SVG, docs), depois remove linhas de segmentos obsoletos (`last_hit_at` nulo / caminho de arquivo vazio); descarta linhas do `file_tracking` cujo caminho de origem resolvido está ausente no disco; remove linhas de tradução cujos metadados `filepath` apontam para um arquivo ausente. Registra três contagens (obsoletos, `file_tracking` órfãos, traduções órfãs). Cria um backup SQLite com carimbo de data/hora no diretório de cache, a menos que `--no-backup`.

- `clean-temp [-r|--root <path>] [-f|--force] [--dry-run]`
**Sem configuração.** Percorre uma árvore de diretórios (padrão: diretório atual) em busca de `*.log` e `cache.db.backup*.sqlite`, exibe caminhos `./…` como `find -print`. Com correspondências: solicita confirmação do `Delete these files? (y/n)` a menos que `-f` / `--force` (exclui sem solicitar confirmação). Sem correspondências: sai sem solicitar confirmação. `--dry-run`: lista apenas, sem solicitação ou exclusões (substitui `--force`).

- `dashboard [-p <port>] [--no-open]`
Inicia o Painel de Tradução (interface web local para segmentos do cache, `strings.json`, glossário, falhas e estatísticas). Com `--no-open`, o navegador padrão não é aberto automaticamente. O alias obsoleto `editor` ainda funciona, mas exibe um aviso.

- `glossary-generate [-o <path>]`
Grava um modelo `glossary-user.csv` vazio. `-o`: substitui o caminho de saída (padrão: `glossary.userGlossary` da configuração, ou `glossary-user.csv`).

Todos os comandos aceitam `-c <path>` para especificar um arquivo de configuração não padrão, `-v` para saída detalhada e `-w` / `--write-logs [path]` para redirecionar a saída do console para um arquivo de log (caminho padrão: no diretório raiz `cacheDir`).

O programa raiz também suporta `-V` / `--version` e `-h` / `--help`; `ai-i18n-tools help [command]` exibe a mesma ajuda por comando que `ai-i18n-tools <command> --help`.

---

<a id="environment-variables"></a>
## Variáveis de ambiente

| Variável               | Descrição                                                |
|------------------------|------------------------------------------------------------|
| `OPENROUTER_API_KEY`   | **Obrigatório.** Sua chave de API do OpenRouter.                     |
| `OPENROUTER_BASE_URL`   | Substitui a URL base da API.                                 |
| `I18N_SOURCE_LOCALE`    | Substitui `sourceLocale` em tempo de execução.                        |
| `I18N_TARGET_LOCALES`   | Códigos de localidade separados por vírgula para substituir `targetLocales`.  |
| `I18N_LOG_LEVEL`        | Nível do logger (`debug`, `info`, `warn`, `error`, `silent`). |
| `NO_COLOR`              | Quando `1`, desativa as cores ANSI na saída de log.              |
| `I18N_LOG_SESSION_MAX`  | Número máximo de linhas mantidas por sessão de log (padrão `5000`).           |
