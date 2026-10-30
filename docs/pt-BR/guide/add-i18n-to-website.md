<a id="add-i18n-to-a-website-or-docs-site"></a>
# Adicionar i18n a um site ou site de documentação

Esta página pega um site de documentação (Markdown ou MDX) ou um site de marketing ou estático (um site Astro ou HTML puro) que tem um único idioma e adiciona localidades com ai-i18n-tools. A ferramenta traduz o conteúdo da página com os modelos do seu provedor LLM e escreve uma cópia localizada por idioma. A estrutura do seu site serve essas cópias e fornece o seletor de idioma.

A maneira mais rápida é dar a um agente de codificação o prompt desta página. Ele habilita o i18n dessa estrutura e verifica a configuração. Você instala a CLI, escolhe o provedor e inicializa o projeto por conta própria, porque isso precisa da sua chave de API e de suas escolhas. Você também executa a tradução por conta própria, porque ela gasta dinheiro na sua conta.

Para um aplicativo cujas strings de UI vivem em chamadas `t()`, use [Adicionar i18n a um aplicativo JS/TS](/pt-BR/guide/add-i18n-to-js) ou [Adicionar i18n a um aplicativo Python](/pt-BR/guide/add-i18n-to-python). Um README de repositório sem estrutura de site usa [Adicionar i18n ao seu README e documentos Markdown](/pt-BR/guide/add-i18n-to-readme). Não tem certeza de qual se aplica? Veja [Não é o seu caso?](#not-your-case) no final.

<a id="steps"></a>

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

Instale o pacote como uma dependência de desenvolvimento. A configuração do VitePress importa `prefixVitepressThemeConfigLinks` de `ai-i18n-tools`, e uma página HTML pura copia `i18n.js` do pacote. Um executável autônomo é suficiente apenas quando o site nunca importa `ai-i18n-tools/runtime` e nunca importa o pacote de sua configuração. Outras opções de instalação: [Instalação](/pt-BR/guide/installation).

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

Você executa isso uma vez, antes do prompt. Ele escreve `ai-i18n-tools.config.json` e usa o provedor que você escolheu acima. Ele não ativa o i18n em um site existente. Isso é o prompt.

| Seu site | Modelo de inicialização | Guia para os detalhes |
| --- | --- | --- |
| Astro Starlight | `ui-starlight` | [Astro](/pt-BR/guide/integrations/astro) |
| Docusaurus | `ui-docusaurus` | [Docusaurus](/pt-BR/guide/integrations/docusaurus) |
| VitePress | `ui-vitepress` | [VitePress](/pt-BR/guide/integrations/vitepress) |
| Nextra 4 (Next.js App Router) | `ui-nextra` | [Nextra](/pt-BR/guide/integrations/nextra) |
| Fumadocs 4 (Next.js App Router) | `ui-fumadocs` | [Fumadocs](/pt-BR/guide/integrations/fumadocs) |
| Site Astro puro | `ui-astro-website` | [Astro](/pt-BR/guide/integrations/astro#plain-astro-marketing-and-app-sites) |
| Um arquivo HTML que troca o idioma no navegador | `ui-plain-html` | [Aplicativos HTML puros](/pt-BR/guide/ui-strings/plain-html) |
| Um arquivo HTML traduzido por localidade | `docs-plain-html` | [Páginas HTML](/pt-BR/guide/documents/html-pages) |
| Nenhum framework de site, apenas um README e arquivos Markdown | `docs-markdown`, ou qualquer template mais `--with-readme` | [Adicionar i18n ao seu README e documentos Markdown](/pt-BR/guide/add-i18n-to-readme) |

```bash
ai-i18n-tools init -t ui-vitepress -P openrouter
```

Troque `ui-vitepress` pelo modelo na tabela. Em seguida, edite `sourceLocale`, `targetLocales` e `docs[].contentPaths`. `sourceLocale` é o idioma das páginas. Qualquer idioma BCP-47 é válido. `contentPaths` devem ser as páginas e pastas escritas nesse idioma. Os caminhos no modelo são iniciais. `docsOutput.style` já está definido para o modelo. `ui-astro-website` e `ui-plain-html` escrevem um bloco `ui` e um array `docs` vazio. O prompt adiciona um bloco `docs` de HTML de página para um site Astro puro quando você está traduzindo HTML de página.

Execute `init` uma vez. Ele reescreve `ai-i18n-tools.config.json` toda vez, então uma segunda execução descarta as edições que você fez.

<a id="run-the-agent-prompt"></a>
## Executar o prompt do agente

Abra o projeto em seu agente de codificação (Cursor, Claude Code, Copilot ou similar), inicie um novo chat e cole o prompt abaixo. O projeto já deve estar inicializado. Não há nada para editar. Se você quiser que um detalhe da estrutura seja omitido, diga isso na mesma mensagem.

O agente primeiro verifica se a CLI e a configuração existem e para com instruções se uma delas estiver faltando. Em seguida, ele detecta a estrutura e habilita o roteamento de localidade dessa estrutura. Ele não instala a CLI, inicializa a configuração, lê sua chave de API ou traduz. A tradução é a etapa após a revisão, e você a executa.

````markdown
# Enable i18n on this website or docs site

## Before you start

The user must already have installed ai-i18n-tools and initialised this
project. Check that `ai-i18n-tools --version` runs (or
`pnpm exec ai-i18n-tools --version` when the binary is only in
`node_modules/.bin`) and that
`ai-i18n-tools.config.json` exists. If either is missing, stop now and tell
the user to install ai-i18n-tools as a dev dependency and run
`ai-i18n-tools init -t <template> -P <provider>`, then run this prompt again.
The template is `ui-vitepress`, `ui-docusaurus`, `ui-starlight`, `ui-nextra`,
`ui-fumadocs`, `ui-astro-website`, `ui-plain-html`, or `docs-plain-html`.
Do not install or initialise anything yourself.

`ui-plain-html` and `ui-astro-website` are valid when `docs` is empty. Every
other template needs one `docs` entry. If that entry is missing, stop and name
the init command.

## Rules

- Do not read or search the ai-i18n-tools source. This prompt is complete.
- Never read, print, or write API keys, `.env` files, or the shell environment.
- Do not run `sync`, `translate-docs`, `translate-ui`, or `suggest-models`.
  They call the translation API and cost money. The user runs them after
  reviewing your work.
- Do not translate, reword, or rename source pages, nav labels, or dictionary
  strings. Do not edit generated locale trees (`docs/<locale>/`,
  `i18n/<locale>/` other than the source catalog from `write-translations`,
  `theme.<locale>.json`, `content/<locale>/`, locale MDX, or locale HTML).
- Do not reformat unrelated code. Leave unrelated edits in a dirty tree alone.
- Apply one branch. If the framework is unclear, stop and ask.

Detect the branch from `docsOutput.style`, then from the config file and
`package.json`: `vitepress`, `docusaurus`, `nextra`, `fumadocs`,
`astro-starlight` with pages under `src/content/docs` (Starlight), `nested`
with HTML `contentPaths` (`docs-plain-html`), a `ui` block whose extractor
extensions include `.html` (`ui-plain-html`), or an Astro site that is not
Starlight (`ui-astro-website`).

Point `contentPaths` and `docsRoot` at the source-language pages that exist
in this repository. The paths written by `init` are starters.

## VitePress

- In `.vitepress/config`, set `locales.root` for the source locale (`label`,
  `lang`, and the existing `themeConfig`). Add one `locales[code]` per
  `targetLocales` entry: `label`, `lang`, `link: '/<code>/'`, and per-locale
  `title` / `description`. Keep `targetLocales` equal to those keys.
- Author nav and sidebar links once, without a locale prefix. Prefix `link`
  and `activeMatch` per locale with `prefixVitepressThemeConfigLinks` from
  `ai-i18n-tools`. `translate-docs` does not rewrite links inside the config.
- Leave `docsOutput.vitepressThemeCatalog` as `init` wrote it. If the config
  already loads `theme.en.json`, keep that loader and add `locales[code]` the
  same way. If theme strings are still inline, leave them inline. Do not
  create `theme.en.json` or `theme.<locale>.json` yourself, and do not load a
  theme file that is not on disk. The first `sync` bootstraps a missing
  catalog.
- `docsOutput.style` is `vitepress`. `outputDir` is the docs root.

## Docusaurus

- Add the `i18n` block in `docusaurus.config.js`: `defaultLocale`, `locales`
  (source plus each target), and `localeConfigs[locale].path` when the URL
  path differs from the locale code. The path must match the folder under
  `i18n/`.
- Point `docusaurusCatalogDir` at `i18n/<defaultLocale>`. `docsOutput.style`
  is `docusaurus`. `contentPaths` and `docsRoot` are the source docs folder.
  `outputDir` is the parent of the locale folders.
- Run this project's `docusaurus write-translations` so
  `i18n/<defaultLocale>/` exists. That command does not call a model. Do not
  run `sync` or `translate-docs`.
- Custom React in `src/pages` and `src/components` is not markdown. Mark
  user-facing copy with `<Translate>` or `translate()` from
  `@docusaurus/Translate`. The message has to be a static string. Do not wrap
  those calls in `t()`.

## Nextra

- Move source MDX to `content/<sourceLocale>/` (usually `content/en/`). The
  source locale is a folder, not the content root. Leave `_meta.ts` beside
  the pages it labels.
- Set `i18n.locales` and `defaultLocale` in `next.config`. `targetLocales`
  matches `i18n.locales` except the default locale.
- Add an `app/[lang]/` route, `getPageMap('/' + lang)`, and `<Layout i18n>`.
- Add `app/_dictionaries/<source>.ts` (usually `en.ts`) with the English
  chrome as string literals (`siteTitle`, footer, `editLink`, search
  placeholder, table-of-contents title, last-updated label), and
  `get-dictionary.ts` that imports `./${locale}`. Pass those fields into
  `<Layout>`, `<Navbar>`, and `<Footer>`. Keep native language names in a
  labels map, untranslated.
- Config: `features.translateDocs`, `docsOutput.style` `nextra`, `docsRoot`
  `content/<sourceLocale>`, `nextraDictionaryPath` the source dictionary.
- Optional: `proxy.ts` that re-exports `nextra/locales`.
- Do not write `app/_dictionaries/pt-BR.ts`, `content/pt-BR/`, or any other
  locale tree.

## Fumadocs

- `defineI18n` in `lib/i18n.ts` with `languages`, `defaultLanguage`, and
  `parser: "dot"` or `"dir"`. Use `"dot"` unless the source pages already live
  under a locale folder. Set `docsOutput.fumadocsParser` to the same value.
- Add `app/[lang]/` routes. Export `createI18nMiddleware(i18n)` from
  `proxy.ts`.
- Dot: source MDX stays at the collection root (`content/docs/`). Dir: source
  MDX lives under `content/docs/<sourceLocale>/`. Point `contentPaths` and
  `docsRoot` at that source tree. `docsOutput.style` is `fumadocs`.
- `targetLocales` equals `languages` minus the default language, character
  for character.
- Leave English UI overrides as they are. Do not write `ui.<locale>.json` or
  translated MDX. Do not put this catalog in `json[]`.

## Astro Starlight

- In the Starlight config, set `locales`, including a `root` entry when the
  source language should be unprefixed (`label` and required `lang`). Set
  `defaultLocale: 'root'` when that root entry is the source language.
- Source pages stay in `src/content/docs/`. `translate-docs` writes
  `src/content/docs/<locale>/`. Point `contentPaths` at the source pages, not
  at locale folders. `outputDir` and `docsRoot` are `src/content/docs`.
  `docsOutput.style` is `astro-starlight`.
- Align `targetLocales` with the non-root locale keys. Starlight directory
  keys are often lowercase (`pt-br`). If you change case to match, say so in
  the report.
- Prefer sidebar `slug` entries so the label comes from the page title. Do
  not hand-translate sidebar `label` maps or `social[].label`. There is no
  shell catalog to add.

## Plain Astro

- Enable Astro i18n routing: `i18n.locales` includes the source locale and
  each target. Astro route codes are lowercase (`pt-br`). In the report, list
  `targetLocales`, `i18n.locales`, and the note that flat JSON filenames use
  the casing in `targetLocales`.
- `init -t ui-astro-website` leaves `docs` empty and turns on UI strings. When
  page HTML should be translated, set `features.translateDocs` to true and
  append one `docs` entry: `contentPaths` the source pages (for example
  `src/pages/index.astro`), `outputDir` `src/pages`, `addFrontmatter` false,
  `docsOutput.style` `astro-starlight`, `docsRoot` `src/pages`. Leave
  `features.translateUIStrings` as it is.
- If frontmatter or shared data calls `t()`, stop that part and tell the user
  to run the JS/TS prompt and skip i18next. Astro resolves `t` at build time.
  Do not wrap those calls here, and do not install i18next.

## Plain HTML

Each file belongs to only one pipeline. If the same file is both a `docs[]` source and
under `ui.sourceRoots`, stop and ask.

`ui-plain-html` (one page, language switches in the browser):

- Run `ai-i18n-tools mark-html` with no `--write`, read the report, then
  run it again with `--write`. It inserts `data-i18n` markers. It does not
  call a model.
- Copy `node_modules/ai-i18n-tools/dist/html-runtime/i18n.js` next to the page.
  Load it at the end of `<body>` with `data-source-locale` equal to
  `sourceLocale`, `data-locales-base` pointing at `flatOutputDir` as a URL
  relative to the script, and `data-locale-select` pointing at an empty
  `<select>`. Do not add a `docs` block for the same file.

`docs-plain-html` (one HTML file per locale):

- Confirm `contentPaths`, `outputDir`, and `docsRoot`. `docsOutput.style` is
  `nested`. Do not add `data-i18n` markers. Do not fill a language list by
  hand. `translate-docs` writes the locale files and the list.

## Verify and report

The framework's locale config matches `targetLocales`. `contentPaths` point
at source-language pages. No generated locale tree was edited. Run the
project's build or typecheck when it has one, and do not run a translation.

Report the branch you applied, the files changed, and any page you left out
of `contentPaths`, with a one-line reason. Then list the commands for the
user, and do not run them: `ai-i18n-tools suggest-models` (optional),
`ai-i18n-tools sync`, then build the site and open one localised route.
````

<a id="review-the-result"></a>
## Revisar o resultado

O agente termina com um relatório. Verifique-o antes de traduzir:

- O diff. Deve ser a configuração de localidade da estrutura, `contentPaths`, e o roteamento que o branch descreve. A prosa da página de origem deve ser a mesma de antes. `git diff --stat` mostra o quanto mudou.
- `targetLocales` corresponde às chaves de localidade que a estrutura servirá.
- `contentPaths` aponta para páginas no idioma de origem, não para uma pasta de localidade que a ferramenta deveria escrever.
- Nenhuma árvore de localidade gerada foi editada: `docs/<locale>/`, HTML de localidade, `content/<locale>/`, `theme.<locale>.json`, ou uma pasta `i18n/<locale>/` do Docusaurus diferente do catálogo de origem de `write-translations`.
- A compilação ou verificação de tipo do projeto ainda passa.

<a id="choose-models-and-translate"></a>
## Escolha os modelos e traduza

Você executa esta parte. Ela usa sua chave de API e gasta dinheiro em sua conta.

A lista de modelos do `init` é um ponto de partida. Classifique os modelos de chat do provedor ativo e, quando a lista final parecer correta, grave-a no `translationModels`:

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` substitui apenas `translationModels`. O mesmo ranking está na aba [Modelos](/pt-BR/guide/translation-dashboard/models) de `ai-i18n-tools dashboard`.

Em seguida, traduza e compile:

```bash
ai-i18n-tools sync
```

`sync` executa `translate-docs` quando `features.translateDocs` está ativado, e `extract` mais `translate-ui` quando as strings de UI estão ativadas (`ui-plain-html`, e um site Astro puro que também usa `t()`). `ai-i18n-tools translate-docs` executa a etapa de documentos por conta própria.

<a id="what-gets-translated"></a>
### O que é traduzido

Os corpos das páginas passam pelo pipeline de [Documentos](/pt-BR/guide/documents/). O 'chrome' do framework (navegação, barra lateral, rótulos de tema) é tratado na mesma execução onde o framework o suporta. Esse não é o pipeline de [JSON](/pt-BR/guide/json) separado. Uma página HTML simples que muda de idioma no navegador é a exceção: `mark-html` e `translate-ui` escrevem JSON plano, e o script do navegador o aplica. Um arquivo HTML por localidade permanece no pipeline de Documentos.

| Framework | Strings do shell e do tema | Como |
| --- | --- | --- |
| Docusaurus | catálogo `write-translations` (`{ message, description }`) | `docs[].docusaurusCatalogDir` mais `translate-docs` |
| VitePress | Catálogo de tema, navegação e barra lateral | `docsOutput.vitepressThemeCatalog` mais `translate-docs` |
| Nextra | Rótulos da barra lateral `_meta.ts` | Automático com `style: "nextra"` |
| Nextra | Dicionário de tema `.ts` | `docs[].nextraDictionaryPath` |
| Fumadocs | Rótulos da barra lateral `meta.json` | Automático com `style: "fumadocs"` |
| Fumadocs | Catálogo de substituições da UI | `docsOutput.fumadocsUiCatalog` |
| Astro Starlight | Strings de UI integradas em várias localidades | Apenas páginas |

Imagens e capturas de tela não são traduzidas por `translate-docs`. Para arquivos específicos da localidade, consulte [Imagens e capturas de tela](/pt-BR/guide/images-and-screenshots/).

Após o primeiro `sync`, alguns frameworks ainda precisam da configuração para carregar o catálogo que o comando acabou de escrever. Esses prompts permanecem nas páginas de integração: [catálogo de temas do VitePress](/pt-BR/guide/integrations/vitepress#wire-configmts-to-generated-theme-json-one-off), [dicionário do Nextra](/pt-BR/guide/integrations/nextra#agent-prompt-dictionary-and-routes) e [catálogo de UI do Fumadocs](/pt-BR/guide/integrations/fumadocs#agent-prompt).

<a id="check-one-language"></a>
### Verificar um idioma

Crie o site e abra uma rota localizada no navegador. O menu suspenso de localidade do próprio framework é o seletor. Para um arquivo HTML que muda no navegador, use o seletor que o tempo de execução preenche. Para um arquivo HTML por localidade, abra o arquivo na pasta da localidade.

O texto que ainda está no idioma de origem foi deixado de fora de `contentPaths`, é um bloco de código, uma URL, uma âncora de título, ou a rota não está configurada. Um rótulo de navegação do VitePress que ainda está no idioma de origem é o catálogo de temas: execute `sync` primeiro, depois o [prompt do catálogo de temas](/pt-BR/guide/integrations/vitepress#wire-configmts-to-generated-theme-json-one-off) se as strings ainda estiverem embutidas na configuração.

<a id="keep-it-translated"></a>
## Mantenha traduzido

Execute `ai-i18n-tools sync` novamente após as páginas de origem serem alteradas. O cache significa que apenas texto novo ou alterado vai para o modelo. Confirme as árvores de localidade que o pipeline escreve. `ai-i18n-tools dashboard` abre o [Painel de Tradução](/pt-BR/guide/translation-dashboard/) para revisar as traduções.

Para traduzir `README.md` na mesma execução, faça o scaffold com `--with-readme` (ou adicione o bloco a uma configuração existente). Consulte [Adicionar i18n ao seu README e documentos Markdown](/pt-BR/guide/add-i18n-to-readme).

<a id="do-it-by-hand"></a>
## Faça isso manualmente

Siga estas etapas se preferir fazer as alterações você mesmo, ou se quiser saber o que o prompt faz. Você ainda [instala a CLI](#install-and-choose-a-provider), [inicializa o projeto](#initialise-the-project) e [traduz](#choose-models-and-translate) no final.

1. Aponte `contentPaths` e `docsRoot` para as páginas no idioma de origem. Os caminhos dos modelos são pontos de partida.
2. Habilite o roteamento de localidade do framework. Use a ramificação que corresponde ao modelo. A página de integração tem a referência completa.

As strings 'shell' que o framework lê de um catálogo são configuradas após o primeiro `sync`. Cada ramificação abaixo vincula esse acompanhamento.

<a id="vitepress"></a>
### VitePress

Adicione `locales.root` e um `locales[code]` por destino, e prefixe os links de navegação e barra lateral com `prefixVitepressThemeConfigLinks`. Deixe as strings de tema embutidas para o primeiro `sync`. Lista de verificação: [Habilitar i18n em um site existente](/pt-BR/guide/integrations/vitepress#enable-i18n-in-an-existing-site). Depois que `sync` tiver escrito `theme.<locale>.json`, cole o [prompt do catálogo de temas](/pt-BR/guide/integrations/vitepress#wire-configmts-to-generated-theme-json-one-off) se a configuração ainda tiver as strings embutidas.

<a id="docusaurus"></a>
### Docusaurus

Adicione o bloco `i18n`, aponte `docusaurusCatalogDir` para o catálogo de origem e execute `docusaurus write-translations`. Lista de verificação: [Habilitar i18n em um site existente](/pt-BR/guide/integrations/docusaurus#enable-i18n-in-an-existing-site). JSON 'shell': [Strings 'shell'](/pt-BR/guide/integrations/docusaurus#shell-strings-write-translations).

<a id="nextra"></a>
### Nextra

Mova o MDX para `content/<sourceLocale>/`, adicione `app/[lang]/` e adicione o módulo de dicionário de origem. Lista de verificação: [Habilitar i18n em um site existente](/pt-BR/guide/integrations/nextra#enable-i18n-in-an-existing-site). O [prompt do dicionário](/pt-BR/guide/integrations/nextra#agent-prompt-dictionary-and-routes) é a passagem mais longa para a mesma configuração. React de aplicativo que precisa de `t()`: [prompt híbrido](/pt-BR/guide/integrations/nextra#optional-t-for-app-react-hybrid).

<a id="fumadocs"></a>
### Fumadocs

Adicione `defineI18n`, `app/[lang]/` e o middleware. Combine `fumadocsParser` com `dot` ou `dir`. Lista de verificação: [Habilitar i18n em um site existente](/pt-BR/guide/integrations/fumadocs#enable-i18n-in-an-existing-site). O [prompt do catálogo de UI](/pt-BR/guide/integrations/fumadocs#agent-prompt) configura `i18n.translations()` depois que as rotas existem.

<a id="astro-starlight"></a>
### Astro Starlight

Adicione `locales`, incluindo `root` quando o idioma de origem não tiver prefixo. As páginas permanecem em `src/content/docs/`. Lista de verificação: [Habilitar i18n em um site existente](/pt-BR/guide/integrations/astro#enable-i18n-in-an-existing-site). Starlight fornece suas próprias strings de UI. Prefira as entradas da barra lateral `slug`.

<a id="plain-astro"></a>
### Plain Astro

Ative o `i18n.locales` do Astro e, quando o HTML da página precisar ser traduzido, adicione o bloco `docs` de [Plain Astro](/pt-BR/guide/integrations/astro#plain-astro-marketing-and-app-sites). As chamadas de frontmatter `t()` usam o [prompt JS/TS](/pt-BR/guide/add-i18n-to-js#run-the-agent-prompt) sem instalar o i18next. O Astro resolve `t` em tempo de compilação.

<a id="plain-html"></a>
### HTML puro

Duas opções, e um arquivo pertence a uma delas:

- Uma página que alterna o idioma no navegador: `ui-plain-html`. Execute `ai-i18n-tools mark-html` (execução de teste, depois `--write`) e carregue `i18n.js`. Consulte [aplicativos HTML simples](/pt-BR/guide/ui-strings/plain-html).
- Um arquivo HTML traduzido por localidade: `docs-plain-html`. Consulte [páginas HTML](/pt-BR/guide/documents/html-pages).

Este é o último passo manual. Continue em [Escolher modelos e traduzir](#choose-models-and-translate).

<a id="not-your-case"></a>
## Não é o seu caso?

| Você tem | Leia |
| --- | --- |
| Strings da UI do aplicativo | [Adicionar i18n a um aplicativo JS/TS](/pt-BR/guide/add-i18n-to-js) ou [Adicionar i18n a um aplicativo Python](/pt-BR/guide/add-i18n-to-python) |
| Catálogos Django, Flask-Babel, ou um aplicativo que já usa GNU gettext | [Adicionar i18n a um aplicativo Django / Python gettext](/pt-BR/guide/add-i18n-to-django-gettext) |
| Um README de repositório ao lado do site, ou arquivos Markdown e nenhum framework de site | [Adicionar i18n aos seus documentos README e Markdown](/pt-BR/guide/add-i18n-to-readme). `init … --with-readme` adiciona esse bloco ao lado de um modelo de site |
| JSON de localidade aninhado autônomo | [JSON](/pt-BR/guide/json) |
| Um site e strings de aplicativo em uma única configuração | [Combinando pipelines](/pt-BR/guide/combining-pipelines) |

Referência para as opções compartilhadas e diferenças por framework: [Integrações](/pt-BR/guide/integrations/).

<a id="examples"></a>
## Exemplos

| Exemplo | O que ele mostra |
| --- | --- |
| [vitepress-docs](/pt-BR/examples#vitepress-docs) | Páginas VitePress e o catálogo de temas |
| [docusaurus-docs](/pt-BR/examples#docusaurus-docs) | Páginas Docusaurus e JSON de shell |
| [astro-docs](/pt-BR/examples#astro-docs) | Páginas Starlight |
| [nextra-docs](/pt-BR/examples#nextra-docs) | Rotas Nextra 4 e o dicionário |
| [fumadocs-docs](/pt-BR/examples#fumadocs-docs) | Rotas Fumadocs e o catálogo da UI |
| [astro-website](/pt-BR/examples#astro-website) | Página de destino Astro, HTML mais `t()` |
| [plain-html](/pt-BR/examples#plain-html) | Um arquivo HTML, marcadores `data-i18n` |
| [plain-html-docs](/pt-BR/examples#plain-html-docs) | Um arquivo HTML por localidade |

Copie um com `npx degit`. Comandos: [Exemplos](/pt-BR/examples#nodejs-examples).
