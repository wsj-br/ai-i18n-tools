<a id="add-i18n-to-a-jsts-app"></a>
# Adicionar i18n a um aplicativo JS/TS

Esta página é para um aplicativo JS/TS (React, Next.js, Node ou uma CLI) cujos botões, rótulos e mensagens ainda são texto simples no idioma de origem. O `extract` registra uma string da UI somente quando ela é um literal de string dentro de `t()` ou `i18n.t()`, portanto, hoje o catálogo estaria vazio e o `translate-ui` não teria nada para traduzir.

As etapas são: instalar a ferramenta, instalar o i18next, executar o `extract` uma vez, adicionar um pequeno arquivo de configuração para que o `t` exista, envolver o texto voltado para o usuário e, em seguida, traduzir. Não tem certeza se este é o seu caso? Consulte [Não é o seu caso?](#not-your-case) no final.

<a id="install-and-choose-a-provider"></a>
## Instalar a ferramenta e definir a chave

Instale a CLI ([Instalação](/pt-BR/guide/installation)) e defina a chave de API para o seu provedor ([Provedor e chave de API](/pt-BR/guide/quick-start#provider-and-api-key)). O Ollama não precisa de chave.

<a id="initialise-the-project"></a>
## Inicializar a configuração

```bash
ai-i18n-tools init -P openrouter
```

Isso grava o `ai-i18n-tools.config.json`. Quatro chaves são importantes por enquanto:

- `sourceLocale`: o idioma em que seu texto está escrito. Qualquer idioma é válido. O inglês é um exemplo comum neste guia.
- `targetLocales`: os idiomas a serem adicionados.
- `ui.sourceRoots`: as pastas que o `extract` escaneia, por exemplo, `src/`.
- `ui.stringsJson` e `ui.flatOutputDir`: onde o catálogo e os arquivos por localidade são gravados.

Todas as outras chaves estão em [Configuração](/pt-BR/reference/configuration).

<a id="run-the-agent-prompt"></a>
## Instalar as bibliotecas de tempo de execução

O ai-i18n-tools não depende do `i18next` nem do `react-i18next`. O aplicativo os instala.

- Todo aplicativo JS/TS que consulta strings em tempo de execução: `i18next`.
- Componentes React que chamam `useTranslation()`: `react-i18next` também.

```bash
pnpm add i18next
# React components:
pnpm add react-i18next
```

<a id="review-the-result"></a>
## Executar a extração uma vez

```bash
ai-i18n-tools extract
```

O arquivo de configuração na próxima etapa importa o `strings.json` e o `ui-languages.json`, e somente o `extract` os grava. Ele grava ambos mesmo quando não encontra nenhuma chamada `t()`, para que o aplicativo compile. Espere 0 strings, ou 1 se o seu `package.json` tiver um `description`, porque o extrator o inclui por padrão (`ui.uiExtractor.includePackageDescription`).

<a id="choose-models-and-translate"></a>
## Adicionar a inicialização

Crie o arquivo de configuração do i18n. Esta versão mínima é suficiente para envolver as strings e traduzi-las. `SOURCE_LOCALE` deve ser igual a `sourceLocale` em `ai-i18n-tools.config.json`.

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

Quando o aplicativo começar a usar plurais, adicione o arquivo simples (flat file) da localidade de origem para que as formas plurais sejam resolvidas. Isso adiciona uma terceira importação e uma opção `sourcePluralFlatBundle`, mostrado em [Conectar o i18next](/pt-BR/guide/ui-strings/i18next-runtime).

Importe este arquivo a partir do ponto de entrada do aplicativo antes da primeira renderização. No Next.js, importe-o de um módulo do cliente, o mesmo padrão de [examples/nextjs-app/src/lib/i18n.ts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/src/lib/i18n.ts).

<a id="check-one-language"></a>
## Substituir texto fixo no código

Faça isso manualmente ou cole o [prompt JS/TS](#run-the-agent-prompt) em um agente de codificação. O argumento para `t()` é a frase no idioma de origem que o usuário deve ver. Os arquivos de localidade simples (flat) são indexados por essa frase.

<details class="agent-prompt" id="agent-prompt">
<summary>Prompt do agente JS/TS</summary>

Copie isso no Cursor ou em outro agente de codificação. Ele envolve os literais voltados para o usuário. Ele não os traduz.

````markdown
# Wrap user-facing JS/TS strings in t()

## Context

ai-i18n-tools extracts only string literals passed to `t()` or `i18n.t()`. The
literal is the source-language sentence and the catalog key (`t("Save")`, not
`t("saveButton")`). After this edit the app must behave the same when the active
locale is the source locale. Do not translate any string.

Bootstrap and call-shape reference:
https://wsj-br.github.io/ai-i18n-tools/guide/ui-strings/i18next-runtime
https://wsj-br.github.io/ai-i18n-tools/guide/ui-strings/t-calls-and-plurals

## Scope

Read `ui.sourceRoots` in `ai-i18n-tools.config.json` and edit only those trees
(JS/JSX/TS/TSX). Skip `className`, URLs and routes, import paths, ids, test ids,
enum and error codes, object keys used as identifiers, log field names, CSS,
regexes, comments, and text that is already inside `t()` or `i18n.t()`.

## Call shape

Install `i18next`. Install `react-i18next` when a component uses
`useTranslation()`. Run `ai-i18n-tools extract` once so `strings.json` and
`ui-languages.json` exist, then add the bootstrap from the Wire i18next guide.
`SOURCE_LOCALE` must equal config `sourceLocale`.

- React components: `const { t } = useTranslation()` and `{t("Save")}`.
- Module-level constants and non-React files: `i18n.t("…")`. Move a constant
  that would call `t()` at import time into a function or `useMemo(..., [t])`.
- Placeholders: `t("Hello {{name}}", { name })`. No template literal as a key.
- Plurals: `t("{{count}} items", { plurals: true, count })`.
- Next.js: import the bootstrap from a client module before render. Do not call
  `changeLanguage` on a shared i18next instance inside a server component. Use a
  per-request `createInstance()`, or a stateless flat-bundle lookup.

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

## Order

1. Install the libraries.
2. Run `ai-i18n-tools extract` once.
3. Add the bootstrap.
4. Wrap call sites.
5. Run `ai-i18n-tools extract` again. Do not run a translation yourself and do
   not hand-edit catalogs.

## Do not

- Do not translate, rename, or reword the source text.
- Do not introduce semantic keys (`saveButton`, `nav.home`).
- Do not hand-edit `strings.json`, flat locale JSON, or `ui-languages.json`.
- Do not change behaviour, layout, or test selectors.

## Verify

- `ai-i18n-tools extract` writes a non-empty catalog of the sentences you
  wrapped.
- The project's build, type check, and tests pass.
- With the source locale active, every wrapped string still shows the original
  sentence. Switch one target locale after `translate-ui` and confirm those
  sentences change.

## Report back

List files changed, each string you deliberately skipped with a one-line reason,
and any ambiguous case you left for a human (the same word used with different
meanings, concatenated sentences, or a plural you were not sure about).
````

</details>

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

<a id="keep-it-translated"></a>
## Extrair e traduzir

Quando os literais estiverem no lugar:

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
ai-i18n-tools status
```

`sync` executa `extract` e `translate-ui` juntos quando `features.translateUIStrings` está ativado. `extract` agora deve listar as frases que você envolveu. Abra um arquivo de localidade gerado em `ui.flatOutputDir` e confirme se as traduções estão lá. A seguir: [Strings de UI, Passo 2](/pt-BR/guide/ui-strings/#step-2-extract-strings) para saber o que `extract` escaneia e grava.

[examples/console-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app) é um pequeno aplicativo Node cujo `src/main.js` já está envolvido. O exemplo do Next.js é o bootstrap do React.

<a id="do-it-by-hand"></a>
## Troca de idioma

Restaure uma localidade salva antes da primeira renderização, conforme descrito em [Conectar o i18next](/pt-BR/guide/ui-strings/i18next-runtime#startup-locale). Em seguida, adicione um controle que chame `await loadLocale(code)` seguido por `await i18n.changeLanguage(code)`: [Seletor de idioma e RTL](/pt-BR/guide/ui-strings/language-switcher).

<a id="step-1-install-the-runtime-libraries"></a>
## Mantenha traduzido

Execute novamente `sync` após alterar o texto de origem. O cache garante que apenas strings novas ou alteradas sejam enviadas para o modelo. Adicione os scripts de [Scripts recomendados para package.json](/pt-BR/guide/quick-start#recommended-packagejson-scripts) e execute `sync` em CI para que as traduções não fiquem defasadas.

O template padrão `init` também traduz `README.md`. Consulte [Adicionar i18n ao seu README e documentos Markdown](/pt-BR/guide/add-i18n-to-readme).

<a id="step-2-extract-once-and-add-the-bootstrap"></a>
## Vindo de outra ferramenta

O ai-i18n-tools inclui seu próprio extrator de strings. Se você usou `i18next-scanner`, `babel-plugin-i18next-extract` ou similar, pode remover essas dependências de desenvolvimento após a migração. Arquivos JSON de namespace do i18next existentes podem permanecer no [pipeline JSON](/pt-BR/guide/json#i18next-namespace-files). Dicionários `.content.ts` do Intlayer podem ser importados com `migrate-intlayer`: consulte [Migrando do Intlayer](/pt-BR/guide/migrating-from-intlayer). Para manter o Intlayer em tempo de execução e apenas preencher suas traduções, use `translate-intlayer`: consulte [Traduzindo o Intlayer no lugar](/pt-BR/guide/translating-intlayer).

<a id="step-3-wrap-strings"></a>
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
| Um README de repositório ou outros arquivos Markdown | [Adicionar i18n ao seu README e documentos Markdown](/pt-BR/guide/add-i18n-to-readme) |
