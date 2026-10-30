<a id="add-i18n-to-a-jsts-app"></a>
# Adicionar i18n a um aplicativo JS/TS

Esta página pega um aplicativo JS/TS (React, Next.js, Node ou um CLI) que tem um único idioma e adiciona localidades com ai-i18n-tools. Ela segue um caminho: i18next, um pequeno arquivo bootstrap e arquivos JSON de traduções. `extract` registra uma string de UI apenas quando é um literal de string dentro de `t()` ou `i18n.t()`, então um catálogo de texto-fonte simples estaria vazio.

A maneira mais rápida é dar a um agente de codificação o prompt desta página. Ele instala o i18next, adiciona o bootstrap, envolve suas strings e pode adicionar um seletor de idioma. Você instala o CLI, escolhe o provedor e inicializa o projeto por conta própria, porque isso requer sua chave de API e suas escolhas. Você também executa a tradução por conta própria, porque ela gasta dinheiro em sua conta.

Um site ou site de documentação usa [Adicionar i18n a um site ou site de documentação](/pt-BR/guide/add-i18n-to-website). Um aplicativo Python usa [Adicionar i18n a um aplicativo Python](/pt-BR/guide/add-i18n-to-python). Não tem certeza de qual se aplica? Veja [Não é o seu caso?](#not-your-case) no final.

O fluxo:

1. [Instale o CLI e escolha um provedor](#install-and-choose-a-provider).
2. [Inicialize o projeto](#initialise-the-project) com `init`.
3. [Execute o prompt do agente](#run-the-agent-prompt).
4. [Revise o resultado](#review-the-result).
5. [Escolha modelos e traduza](#choose-models-and-translate), depois verifique um idioma.
6. [Mantenha-o traduzido](#keep-it-translated).

Prefere fazer as alterações você mesmo, ou quer saber o que o prompt faz? [Faça manualmente](#do-it-by-hand) percorre os mesmos passos um por um.

<a id="install-and-choose-a-provider"></a>
## Instalar e escolher um provedor

Você faz esta parte, não o agente. O instalador altera sua máquina, e a chave de API é um segredo que pertence ao seu shell, não a um prompt.

Instale o pacote como uma dependência de desenvolvimento. O bootstrap importa `ai-i18n-tools/runtime`, e um CLI global ou um executável autônomo não pode satisfazer essa importação. Outras opções de instalação: [Instalação](/pt-BR/guide/installation).

```bash
pnpm add -D ai-i18n-tools
```

`npm install --save-dev ai-i18n-tools` e `yarn add --dev ai-i18n-tools` também funcionam. Os exemplos abaixo usam o comando `ai-i18n-tools` puro. Uma instalação local precisa de `node_modules/.bin` em `PATH`, ou `pnpm exec` na frente de cada comando. Veja [Usando o CLI](/pt-BR/guide/installation#using-the-cli).

Verifique a instalação:

```bash
ai-i18n-tools --version
```

Em seguida, escolha um provedor e defina sua chave de API no shell que executará a tradução. Por exemplo, OpenRouter:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

O Ollama não precisa de chave. Outras predefinições: [Provedores integrados](/pt-BR/guide/providers-and-models#built-in-providers). Anote o nome do provedor, porque você o passará para `init` na próxima etapa. O agente nunca precisa da chave: ele apenas executa comandos que não fazem chamadas de modelo. Você usa a chave mais tarde, quando [traduz](#choose-models-and-translate).

<a id="initialise-the-project"></a>
## Inicializar o projeto

Você executa isso uma vez, antes do prompt. Ele escreve a configuração e usa o provedor que você escolheu acima.

```bash
ai-i18n-tools init -P openrouter
```

O modelo padrão é `ui-markdown`. Ele escreve `ai-i18n-tools.config.json` com um bloco de UI e um bloco README plano. Quatro chaves são importantes para o aplicativo:

- `sourceLocale`: o idioma das strings na fonte. Qualquer idioma BCP-47 é válido; o scaffold geralmente usa `en-GB`.
- `targetLocales`: os idiomas a serem adicionados.
- `ui.sourceRoots`: as pastas que `extract` escaneia, por exemplo `src/`.
- `ui.stringsJson` e `ui.flatOutputDir`: onde o catálogo e os arquivos por localidade são gravados.

`init` não instala o i18next e não adiciona o bootstrap. Isso é o prompt (manualmente, [Etapa 1](#step-1-install-the-runtime-libraries) e [Etapa 2](#step-2-extract-once-and-add-the-bootstrap)).

Execute `init` uma vez. Ele reescreve `ai-i18n-tools.config.json` toda vez, então uma segunda execução descarta as edições que você fez.

O mesmo modelo lista `README.md` para tradução de documentos. O marcador da lista de idiomas e os arquivos README estão em [Adicionar i18n aos seus documentos README e Markdown](/pt-BR/guide/add-i18n-to-readme). Esta página é o caminho `t()`.

Todas as outras chaves estão em [Configuração](/pt-BR/reference/configuration). Formas de chamada: [Chamadas t() e plurais](/pt-BR/guide/ui-strings/t-calls-and-plurals). A referência de bootstrap: [Configurar i18next](/pt-BR/guide/ui-strings/i18next-runtime).

<a id="run-the-agent-prompt"></a>
## Executar o prompt do agente

Abra o projeto em seu agente de codificação (Cursor, Claude Code, Copilot ou similar), inicie um novo chat e cole o prompt abaixo. O projeto já deve estar inicializado. Não há nada para editar. Se você quiser que algo seja omitido, por exemplo, nenhuma troca de idioma, diga isso na mesma mensagem.

O agente primeiro verifica se a CLI e a configuração existem e para com instruções se uma delas estiver faltando. Em seguida, ele trabalha em três partes:

- A Parte 1 instala o i18next, executa `extract` uma vez e adiciona o bootstrap.
- A Parte 2 envolve as strings voltadas para o usuário em `t()` ou `i18n.t()`.
- A Parte 3 adiciona uma troca de idioma ou uma opção de idioma da CLI.

Ele não instala a CLI, inicializa a configuração, lê sua chave de API ou traduz. A tradução é a etapa após a revisão, e você a executa.

````markdown
# Add languages to this JS/TS app

## Before you start

The user must already have installed ai-i18n-tools and initialised this
project. Check that `ai-i18n-tools --version` runs (or
`pnpm exec ai-i18n-tools --version` when the binary is only in
`node_modules/.bin`) and that
`ai-i18n-tools.config.json` exists with a `ui` block. If either is missing,
stop now and tell the user to install ai-i18n-tools as a dev dependency and
run `ai-i18n-tools init -P <provider>`, then run this prompt again. Do not
install the CLI or initialise the config yourself.

## Rules

- Do not read or search the ai-i18n-tools source. This prompt is complete.
- Never read, print, or write API keys, `.env` files, or the shell environment.
- Do not run `translate-ui`, `suggest-models`, or `sync`. They call the
  translation API and cost money. The user runs them after reviewing your work.
- Do not translate, reword, or rename source text. Do not edit generated files
  (`strings.json`, per-locale JSON, `ui-languages.json`).
- Do not introduce semantic keys (`saveButton`, `nav.home`). The literal in
  `t("…")` is the source-language sentence and the catalog key.
- Do not reformat unrelated code. Keep existing blank lines. Run the project's
  formatter and linter at the end. Leave unrelated edits in a dirty tree alone.
  Delete throwaway scripts and do not commit them.

## Part 1 — Runtime

Skip a piece of this part when it is already done.

1. Install `i18next` with the project's package manager. Install
   `react-i18next` only when a component uses `useTranslation()`.
2. Run `ai-i18n-tools extract` once. It writes `strings.json` and
   `ui-languages.json` even when it finds no `t()` calls, so the app compiles.
   Expect 0 strings, or 1 when `package.json` has a `description`
   (`ui.uiExtractor.includePackageDescription` is on by default).
3. Add the bootstrap below. Put it where this repository keeps its app code,
   and point the JSON imports at `ui.stringsJson`, `ui.flatOutputDir`, and
   `languagesManifestPath` when that key is set. `SOURCE_LOCALE` must equal
   config `sourceLocale`, character for character. The sample uses `en-GB`
   only as the shape.
4. Import the bootstrap from the app entry before the first render. In
   Next.js, import it from a client module. Do not call `changeLanguage` on a
   shared i18next instance inside a server component. Concurrent requests
   share that singleton. Use a per-request `createInstance()`, or a stateless
   lookup of the flat bundle.

Not using React? Drop the `react-i18next` import and the `.use(initReactI18next)` call.

```js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import aiI18n from 'ai-i18n-tools/runtime';
import uiLanguages from './locales/ui-languages.json';
import stringsJson from './locales/strings.json';

export const SOURCE_LOCALE = 'en-GB';

void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));
aiI18n.setupKeyAsDefaultT(i18n, { stringsJson });

i18n.on('languageChanged', aiI18n.applyDirection);
aiI18n.applyDirection(i18n.language);

const localeLoaders = aiI18n.makeLocaleLoadersFromManifest(
  uiLanguages,
  SOURCE_LOCALE,
  (code) => () => import(`./locales/${code}.json`),
);

export const loadLocale = aiI18n.makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);
export default i18n;
```

For JSON under `public/`, the loader fetches `/locales/<code>.json` and
parses the response. For a Node CLI with no bundler, read the file with
`readFileSync` inside that function. A call that uses `{ plurals: true, count }`
also needs the
source-locale flat file under `flatOutputDir`. That file does not exist until
the user runs `translate-ui`, so leave `sourcePluralFlatBundle` out and name
the plural calls in the report.

## Part 2 — Wrap strings

The literal in `t("…")` is the source-language sentence and the catalog key.
With the source locale active, the app must behave exactly as before. Text
that is already wrapped needs no change.

Read `ui.sourceRoots` and edit only those trees (JS, JSX, TS, TSX). Leave
`className`, URLs and routes, import paths, ids, test ids, enum and error
codes, object keys used as identifiers, log field names, CSS, regexes, and
comments.

- React components: `const { t } = useTranslation()` and `{t("Save")}`.
- Module-level constants and non-React files: `i18n.t("…")`. A constant that
  would call `t()` at import time must move into a function or
  `useMemo(..., [t])`, so `t()` runs after the locale loads.
- Placeholders: `t("Hello {{name}}", { name })`. The argument must be a string
  literal. `t(variable)` and a template literal as the key are not extracted.
- Plurals: `t("{{count}} items", { plurals: true, count })`. Do not invent
  `_one` / `_other` keys.
- One `t()` per sentence. Split only where the text already branches.

Before:

```jsx
<button>Save</button>
```

After:

```jsx
<button>{t("Save")}</button>
```

Before:

```js
console.log(`Hello ${name}`);
```

After:

```js
console.log(t("Hello {{name}}", { name }));
```

Work in passes: list string literals that are not passed to `t` or `i18n.t`,
wrap the user-facing ones, then list again. Treat any bulk rewrite as a draft
and review its diff. Then run `ai-i18n-tools extract` again.

## Part 3 — Language switch

Skip this part only when the program shows no text a person reads, or when the
user asked you to leave language choice out. A command-line program still gets
this part: a language option, not a widget.

Goal: one chosen language applies to every `t()` in that run, and a screen can
remember the choice. Accept only codes listed in `ui-languages.json`.

- Restore a saved locale before the first render, then draw a control labelled
  `t("Language")` whose options come from that manifest. On change, call
  `await loadLocale(code)` and then `await i18n.changeLanguage(code)`.
- In Next.js, reading `localStorage` in an effect after hydration paints the
  source locale first. Prefer a cookie the server can read, or load the saved
  locale in the client module before the first client render. Do not call
  `changeLanguage` on a shared instance inside a server component.
- A CLI: add `--lang <code>` and `-L <code>` unless those names are taken.
  Read the option before help text is built, so help can be translated too.
  After the option, read a language environment variable the app already owns.
  Do not read `AI_I18N_LANG`. Then the source locale.

## Verify and report

The project's build, type check, and tests pass. `extract` writes a non-empty
catalog of the sentences you wrapped. With the source locale, the output is
unchanged.

Report the files changed, each string you skipped with a one-line reason, the
same word used with different meanings, sentences built from translated pieces,
plurals that still need `sourcePluralFlatBundle` after the user translates,
and any `t()` that runs at import time. Then list the commands for the user,
and do not run them: `ai-i18n-tools suggest-models` (optional),
`ai-i18n-tools translate-ui`, then reload the app.
````

<a id="review-the-result"></a>
## Revisar o resultado

O agente termina com um relatório. Verifique-o antes de traduzir:

- O diff. O texto envolvido deve ser lido da mesma forma que antes, sem reformatação não relacionada. `git diff --stat` mostra o quanto mudou. O bootstrap, sua importação, as chamadas envolvidas e a troca de idioma são as edições esperadas.
- Os catálogos gerados (`strings.json`, JSON por localidade, `ui-languages.json`) estão intocados, exceto pelo que `extract` escreveu.
- `ai-i18n-tools extract` é executado sem problemas, e `strings.json` lista as frases que você espera.
- Seus testes passam e o aplicativo parece o mesmo no idioma de origem.
- As strings ignoradas e os casos ambíguos no relatório: uma palavra usada com diferentes significados, frases construídas a partir de pedaços e plurais. Decida-os manualmente.
- `SOURCE_LOCALE` no bootstrap é igual a `sourceLocale` na configuração.

Strings que o agente perdeu aparecem como texto que permanece no idioma de origem posteriormente.

<a id="choose-models-and-translate"></a>
## Escolha os modelos e traduza

Você executa esta parte. Ela usa sua chave de API e gasta dinheiro em sua conta.

A lista de modelos do `init` é um ponto de partida. Classifique os modelos de chat do provedor ativo e, quando a lista final parecer correta, grave-a no `translationModels`:

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` substitui apenas `translationModels`. O mesmo ranking está na aba [Modelos](/pt-BR/guide/translation-dashboard/models) de `ai-i18n-tools dashboard`.

Em seguida, extraia e traduza:

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
ai-i18n-tools status
```

`extract` escreve `strings.json` e `ui-languages.json`. `translate-ui` escreve um arquivo JSON por idioma de destino em `ui.flatOutputDir`. Deixe esses arquivos gerados sem edição. `sync` executa `extract` e `translate-ui` juntos quando `features.translateUIStrings` está ativado. O que `extract` escaneia e escreve: [Strings da UI, Etapa 2](/pt-BR/guide/ui-strings/#step-2-extract-strings).

`t()` procura a frase de origem no JSON da localidade. O ID em `strings.json` não é a chave de pesquisa. Um arquivo ausente ou uma chave ausente retorna a frase de origem.

<a id="check-one-language"></a>
### Verificar um idioma

Recarregue o aplicativo, mude para um idioma de destino e abra uma tela com algumas strings envolvidas. Use a troca de idioma que o agente adicionou ou chame `loadLocale` e `changeLanguage` você mesmo. O texto que ainda está no idioma de origem não foi envolvido, é executado no momento da importação ou não tem uma entrada no JSON da localidade. Verifique o JSON para a frase antes de suspeitar do código.

Quando uma chamada envolvida usa `{ plurals: true, count }`, adicione o arquivo simples da localidade de origem para que as formas plurais sejam resolvidas. Isso adiciona uma importação de `{sourceLocale}.json` de `flatOutputDir` e uma opção `sourcePluralFlatBundle`, mostrada em [Configurar i18next](/pt-BR/guide/ui-strings/i18next-runtime).

<a id="keep-it-translated"></a>
## Mantenha traduzido

Execute novamente `ai-i18n-tools sync` (ou `extract` e depois `translate-ui`) após alterar o texto de origem. O cache significa que apenas strings novas ou alteradas vão para o modelo. Adicione os scripts de [Scripts package.json recomendados](/pt-BR/guide/quick-start#recommended-packagejson-scripts) e execute `sync` na CI para que as traduções não se desviem. Recarregue o aplicativo após uma execução de tradução para que ele carregue o novo JSON. `ai-i18n-tools dashboard` abre o [Painel de Tradução](/pt-BR/guide/translation-dashboard/) para revisar as traduções.

O template padrão `init` também lista `README.md`. Cole o marcador da lista de idiomas antes que `sync` o traduza. Consulte [Adicionar i18n aos seus documentos README e Markdown](/pt-BR/guide/add-i18n-to-readme).

<a id="do-it-by-hand"></a>
## Faça isso manualmente

Siga estes passos se preferir fazer as alterações por conta própria, ou se quiser saber o que o prompt faz. Os passos correspondem às partes do prompt. Você ainda [instala a CLI](#install-and-choose-a-provider), [inicializa o projeto](#initialise-the-project) e [traduz](#choose-models-and-translate) no final.

1. [Instale as bibliotecas de tempo de execução](#step-1-install-the-runtime-libraries).
2. [Extraia uma vez e adicione o bootstrap](#step-2-extract-once-and-add-the-bootstrap).
3. [Encapsule strings](#step-3-wrap-strings) em `t()` ou `i18n.t()`.
4. [Adicione um seletor de idioma](#step-4-add-a-language-switch).

<a id="step-1-install-the-runtime-libraries"></a>
## Passo 1: Instalar as bibliotecas de tempo de execução

O ai-i18n-tools não depende do `i18next` nem do `react-i18next`. O aplicativo os instala.

- Todo aplicativo JS/TS que consulta strings em tempo de execução: `i18next`.
- Componentes React que chamam `useTranslation()`: `react-i18next` também.

```bash
pnpm add i18next
# React components:
pnpm add react-i18next
```

<a id="step-2-extract-once-and-add-the-bootstrap"></a>
## Passo 2: Extrair uma vez e adicionar o bootstrap

O bootstrap importa `strings.json` e `ui-languages.json`, e apenas `extract` os escreve. Ele escreve ambos mesmo quando não encontra chamadas para `t()`, para que o aplicativo compile.

```bash
ai-i18n-tools extract
```

Espere 0 strings, ou 1 se seu `package.json` tiver um `description`, porque o extrator o inclui por padrão (`ui.uiExtractor.includePackageDescription`).

Crie o arquivo de configuração i18n. Esta versão é suficiente para encapsular strings e traduzi-las. `SOURCE_LOCALE` deve ser igual a `sourceLocale` em `ai-i18n-tools.config.json`. Ajuste os caminhos de importação para que correspondam a `ui.stringsJson` e `ui.flatOutputDir`.

```js
// src/i18n.js — adjust the import paths to match `ui` in your config
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import aiI18n from 'ai-i18n-tools/runtime';
import uiLanguages from './locales/ui-languages.json';
import stringsJson from './locales/strings.json';

export const SOURCE_LOCALE = 'en-GB';

void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));
aiI18n.setupKeyAsDefaultT(i18n, { stringsJson });

i18n.on('languageChanged', aiI18n.applyDirection);
aiI18n.applyDirection(i18n.language);

const localeLoaders = aiI18n.makeLocaleLoadersFromManifest(
  uiLanguages,
  SOURCE_LOCALE,
  (code) => () => import(`./locales/${code}.json`),
);

export const loadLocale = aiI18n.makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);
export default i18n;
```

Não está usando React? Remova a importação `react-i18next` e a chamada `.use(initReactI18next)`.

Para pacotes JSON em `public/`, o carregador busca `/locales/${code}.json`. Para uma CLI Node sem um empacotador, leia o arquivo com `readFileSync`. Ambos os formatos estão em [Carregadores de locale](/pt-BR/guide/ui-strings/i18next-runtime#locale-loaders).

Importe este arquivo a partir do ponto de entrada do aplicativo antes da primeira renderização. No Next.js, importe-o de um módulo do cliente, o mesmo padrão de [examples/nextjs-app/src/lib/i18n.ts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/src/lib/i18n.ts).

<a id="step-3-wrap-strings"></a>
## Passo 3: Encapsular strings

O argumento para `t()` é a frase no idioma de origem que o usuário deve ver. Arquivos de locale planos são indexados por essa frase.

JSX:

```jsx
<button>Save</button>
<button>{t("Save")}</button>
```

Node, uma CLI ou qualquer módulo que não seja React:

```js
console.log(`Hello ${name}`);
console.log(t("Hello {{name}}", { name }));
```

Regras (também em [chamadas t() e plurais](/pt-BR/guide/ui-strings/t-calls-and-plurals)):

- A chave é um literal. `t(variable)` e <code>{'t(`Hello ${name}`)'}</code> não são extraídos, e chamadas não literais são ignoradas sem aviso.
- Placeholders dentro do literal usam o formato i18next <code v-pre>{{name}}</code>, passado no segundo argumento.
- Plurais: uma frase de origem mais `{ plurals: true, count }`. Consulte [Plurais cardinais](/pt-BR/guide/ui-strings/t-calls-and-plurals#cardinal-plurals-plurals-true). Não invente chaves `_one` / `_other` por conta própria.
- Componentes React usam `t` de `useTranslation()`. Outros arquivos chamam `i18n.t`. Uma constante avaliada no momento da importação deve ser movida para uma função ou `useMemo(..., [t])`, para que `t()` seja executado após o carregamento da localidade.
- Componentes de servidor do Next.js não devem chamar `changeLanguage` em uma instância compartilhada do i18next. Requisições concorrentes compartilham esse singleton. Use um `createInstance()` por requisição ou uma consulta sem estado (stateless) do pacote simples (flat bundle) (consulte o [híbrido Nextra](/pt-BR/guide/integrations/nextra#optional-t-for-app-react-hybrid)).

Não altere: `className`, `href` e outros URLs, caminhos de importação, IDs, IDs de teste, códigos de erro, chaves de objeto usadas como identificadores e texto dentro de comentários.

Execute `ai-i18n-tools extract` novamente. O catálogo agora deve listar as frases que você encapsulou.

<a id="step-4-add-a-language-switch"></a>
## Passo 4: Adicionar um seletor de idioma

Restaure um locale salvo antes da primeira renderização, conforme descrito em [Conectar i18next](/pt-BR/guide/ui-strings/i18next-runtime#startup-locale). Em seguida, adicione um controle que chama `await loadLocale(code)` seguido por `await i18n.changeLanguage(code)`. Construa as opções a partir de `ui-languages.json`. O widget, rótulos e layout da direita para a esquerda: [Seletor de idioma e RTL](/pt-BR/guide/ui-strings/language-switcher).

Um programa de linha de comando não tem widget. Adicione `--lang <code>` (e `-L` quando esse nome estiver livre), e então uma variável de ambiente de idioma que o aplicativo já possui. Não leia `AI_I18N_LANG`; essa variável é apenas para a CLI ai-i18n-tools. Aceite apenas os códigos listados em `ui-languages.json`.

Pule esta etapa quando o programa não exibir texto que uma pessoa possa ler.

Este é o último passo manual. Continue em [Escolher modelos e traduzir](#choose-models-and-translate).

<a id="coming-from-another-tool"></a>
## Vindo de outra ferramenta

O ai-i18n-tools inclui seu próprio extrator de strings. Se você usou `i18next-scanner`, `babel-plugin-i18next-extract` ou similar, pode remover essas dependências de desenvolvimento após a migração. Arquivos JSON de namespace do i18next existentes podem permanecer no [pipeline JSON](/pt-BR/guide/json#i18next-namespace-files). Dicionários `.content.ts` do Intlayer podem ser importados com `migrate-intlayer`: consulte [Migrando do Intlayer](/pt-BR/guide/migrating-from-intlayer). Para manter o Intlayer em tempo de execução e apenas preencher suas traduções, use `translate-intlayer`: consulte [Traduzindo o Intlayer no lugar](/pt-BR/guide/translating-intlayer).

<a id="not-your-case"></a>
## Não é o seu caso?

| Seu código hoje | Leia |
| --- | --- |
| Já usa `t("…")` ou `i18n.t("…")` com a frase no idioma de origem | [Strings de IU](/pt-BR/guide/ui-strings/) passos 2–3, depois [Conectar o i18next](/pt-BR/guide/ui-strings/i18next-runtime) |
| JSON de namespace do i18next (`t("saveButton")` mais `en/translation.json`) | [JSON](/pt-BR/guide/json). Não altere essas chaves para frases no idioma de origem a menos que você esteja preparado para alterar todas as chamadas |
| Dicionários do Intlayer, migrando do Intlayer | [Migrando do Intlayer](/pt-BR/guide/migrating-from-intlayer) |
| Dicionários do Intlayer, mantendo o Intlayer | [Traduzindo o Intlayer no local](/pt-BR/guide/translating-intlayer) |
| Um arquivo HTML | [HTML simples](/pt-BR/guide/ui-strings/plain-html) e `mark-html` |
| Sites de documentação ou HTML de página do Astro | [Adicionar i18n a um site ou site de documentação](/pt-BR/guide/add-i18n-to-website) e [Site Astro](/pt-BR/guide/ui-strings/astro-website). `t()` é apenas para dados compartilhados e frontmatter |
| Um aplicativo Python | [Adicionar i18n a um aplicativo Python](/pt-BR/guide/add-i18n-to-python) |
| Catálogos Django, Flask-Babel, ou um aplicativo que já usa GNU gettext | [Adicionar i18n a um aplicativo Django / Python gettext](/pt-BR/guide/add-i18n-to-django-gettext) |
| Um README de repositório ou outros arquivos Markdown | [Adicionar i18n ao seu README e documentos Markdown](/pt-BR/guide/add-i18n-to-readme) |

<a id="examples"></a>
## Exemplos

| Exemplo | O que ele mostra |
| --- | --- |
| [console-app](/pt-BR/examples#console-app) | Menor aplicativo Node, `t()` já empacotado, além de um bloco README |
| [nextjs-app](/pt-BR/examples#nextjs-app) | Bootstrap React, plurais, um site de documentação e um bloco README |

Copie um com `npx degit`. Comandos: [Exemplos](/pt-BR/examples#nodejs-examples).
