<a id="nextra-integration"></a>
# Integração Nextra

Use `init -t ui-nextra` e `docsOutput.style: "nextra"` para sites de documentação [Nextra](https://nextra.site/) 4 no Next.js App Router. O preset é um alias para `doc-system` com um `localeSubpath` vazio e nomes de pastas de localidade BCP-47 preservados (`localePathLowercase` assume o padrão `false`, então as pastas permanecem `pt-BR`, `zh-Hans`, etc.).

Veja também [Documentos](/pt-BR/guide/documents/) e a demonstração executável [examples/nextra-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs/).

<a id="quick-start"></a>
## Início rápido

```bash
ai-i18n-tools init -t ui-nextra -P gemini
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm run build       # Next.js build (project-specific script)
```

Habilite `features.translateDocs` ao traduzir o conteúdo da página, os rótulos da barra lateral `_meta.ts` e os módulos do dicionário de temas em uma execução `sync`.

<a id="page-layout"></a>
## Layout da página

O Nextra 4 com i18n mantém o **MDX do local de origem em uma pasta de localidade** (geralmente `content/en/` quando o inglês é o idioma de origem). `sourceLocale` pode ser qualquer idioma. Cópias traduzidas são gravadas em pastas de localidade irmãs:

```text
content/en/index.mdx              →  content/pt-BR/index.mdx
content/en/guide/getting-started.mdx  →  content/zh-Hans/guide/getting-started.mdx
```

Configure um bloco `docs[]`:

```json
{
  "contentPaths": ["content/en"],
  "outputDir": "content",
  "docsOutput": {
    "style": "nextra",
    "docsRoot": "content/en",
    "rewriteNextraLinks": true
  }
}
```

Aponte `contentPaths` para os arquivos e diretórios de `.mdx` escritos em `sourceLocale`. Esse idioma pode ser qualquer um. Defina `docsRoot` como a pasta do local de origem dentro de `content/` (por exemplo, `content/en` quando o inglês é o idioma de origem).

Conecte a [internacionalização](https://nextra.site/docs/guide/i18n) do Nextra: defina `i18n.locales` e `defaultLocale` em `next.config`, e mantenha `targetLocales` em `ai-i18n-tools.config.json` alinhado com esses códigos de localidade e os nomes das pastas `content/{locale}/`.

<a id="enable-i18n-in-an-existing-site"></a>
### Habilitar i18n em um site existente

Um site Nextra 4 somente em inglês precisa de uma pasta de localidade, um parâmetro de rota e a configuração i18n do Next.js antes que `translate-docs` tenha onde escrever. A configuração inicial usa o prompt em [Adicionar i18n a um site ou site de documentação](/pt-BR/guide/add-i18n-to-website#run-the-agent-prompt). O [prompt de dicionário](#agent-prompt-dictionary-and-routes) é o acompanhamento detalhado para as mesmas rotas e dicionário. Lista de verificação:

- Mova o MDX para `content/en/` (o inglês é uma pasta de localidade, não a raiz do conteúdo).
- `i18n.locales` e `defaultLocale` em `next.config`.
- Uma rota `app/[lang]/`, `getPageMap('/${lang}')` e `<Layout i18n={…}>`.
- `app/_dictionaries/en.ts` mais `get-dictionary.ts`, passados para `<Layout>`, `<Navbar>` e `<Footer>`.
- `proxy.ts` opcional que reexporta `nextra/locales` (consulte [Proxy de localidade opcional](#optional-locale-proxy)).
- `targetLocales` alinhado com esses códigos de localidade, depois `sync`.

<a id="theme-strings"></a>
## Strings do tema

Strings do tema Nextra (`editLink`, placeholder de pesquisa, rodapé e assim por diante) não são extraídas do markdown. Crie strings em inglês em um módulo de dicionário TypeScript (por exemplo, `app/_dictionaries/en.ts`) e traduza-o dentro de `translate-docs`:

```json
{
  "features": {
    "translateDocs": true
  },
  "docs": [
    {
      "contentPaths": ["content/en"],
      "outputDir": "content",
      "nextraDictionaryPath": "app/_dictionaries/en.ts",
      "docsOutput": {
        "style": "nextra",
        "docsRoot": "content/en"
      }
    }
  ]
}
```

A ferramenta grava `app/_dictionaries/{locale}.ts` (modelo padrão: `{dir}/{locale}.ts`). Carregue o módulo por localidade em `app/_dictionaries/get-dictionary.ts` e passe as strings traduzidas para `<Layout>`, `<Search>`, `<Footer>` e componentes de tema relacionados.

**Não** use `json[]` para strings de dicionário de tema Nextra — esse padrão é apenas para pacotes de localidade de aplicativos não relacionados.

<a id="sidebar-labels-_metats"></a>
## Rótulos da barra lateral (`_meta.ts`)

Nextra 3+ usa arquivos TypeScript `_meta.ts` / `_meta.tsx` para a estrutura e títulos da barra lateral. Quando `docsOutput.style` é `"nextra"`, `translate-docs` coleta automaticamente `_meta.ts`, `_meta.tsx` e `_meta.js` em `docsRoot`, traduz literais de string no mapa de metadados `export default { … }` e grava arquivos espelhados em `content/{locale}/**`.

**Padrão recomendado:** mantenha literais em inglês em linha em `content/en/**/_meta.ts` (o mesmo que [swr-site](https://github.com/shuding/nextra/tree/main/examples/swr-site)):

```text
content/en/_meta.ts           English sidebar labels (source)
content/pt-BR/_meta.ts        Translated copy (generated by translate-docs)
```

Opcional: substitua a coleta com `docs[].nextraMetaGlob` ou restrinja os nomes de propriedades traduzíveis com `docs[].nextraMetaTranslatableKeys` (padrão: `title`, `display`, `breadcrumb`).

**Não** crie sidecars JSON (`i18n/meta.en.json`) ou arquivos `_meta.ts` finos que importam JSON traduzido — regenere arquivos `_meta` de localidade com `sync` / `translate-docs` quando o inglês mudar.

<a id="example-project"></a>
## Projeto de exemplo

[examples/nextra-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs/) — Fontes em inglês em `content/en/`, árvores de página `pt-BR` e `zh-Hans` commitadas, arquivos `_meta.ts` embutidos e `app/_dictionaries/{locale}.ts`. Um componente de servidor (`app/_components/feedback-links.tsx`) usa `t()` através de uma pesquisa de pacote plano para que as strings de shell personalizadas possam ficar ao lado do dicionário. Execute `pnpm run dev` na porta 3070.

<a id="agent-prompt-dictionary-and-routes"></a>
## Prompt do agente: dicionário e rotas

Use isto quando o site ainda tiver strings de layout codificadas (hardcoded) e nenhuma árvore `content/en/`. Ele segue o caminho padrão (dicionário + `_meta.ts` + `translate-docs`). Ele não introduz `t()`.

<details class="agent-prompt">
<summary>Prompt de dicionário e rotas</summary>

````markdown
# Add Nextra 4 i18n with a theme dictionary

## Context

ai-i18n-tools translates Nextra page bodies, `_meta.ts` object literals, and the
theme dictionary module (`nextraDictionaryPath`, usually
`app/_dictionaries/en.ts`) with `translate-docs`. The English sentence in that
dictionary is the source text. Do not translate strings yourself. Reference:
https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs

## Scope

Edit `next.config`, `app/[lang]/layout.tsx`, `app/_dictionaries/en.ts`,
`app/_dictionaries/get-dictionary.ts`, and move MDX under `content/en/`. Skip
`docsRepositoryBase` (a URL). Keep native language names in a `LOCALE_LABELS`
map untranslated (`English`, `Português (Brasil)`). Do not move `_meta.ts`
sidebar labels into the dictionary or into `t()`.

## Call shape

- `next.config`: `i18n.locales` and `defaultLocale`.
- English MDX and `_meta.ts` live under `content/en/`. `getPageMap('/${lang}')`
  loads the matching tree.
- `app/_dictionaries/en.ts` exports the English shell strings (`siteTitle`, `footer`,
  `editLink`, search placeholder, table-of-contents title, last-updated label).
  `get-dictionary.ts` dynamically imports `./${locale}`.
- Pass those fields into `<Layout>`, `<Navbar>`, and `<Footer>`. Set
  `<Layout i18n>` from `LOCALE_LABELS`.
- Config: `features.translateDocs`, `docsOutput.style: "nextra"`,
  `docsRoot: "content/en"`, `nextraDictionaryPath: "app/_dictionaries/en.ts"`.
  `targetLocales` matches `i18n.locales` except the default locale.

## Order

1. Route, config, and dictionary wiring.
2. Move existing MDX into `content/en/` and point `contentPaths` at that folder.
3. Ask the user to run `sync`. Do not write `app/_dictionaries/pt-BR.ts` or
   `content/pt-BR/` by hand.

## Do not

- Do not translate, rename, or reword the English dictionary strings.
- Do not add `t()`, `getRequestConfig`, or a `dictionary.ts` filename. The
  English module is `app/_dictionaries/en.ts`.
- Do not duplicate a string in both the dictionary and a later `t()` call.
- Do not hand-edit generated locale dictionaries or locale `_meta.ts` files.

## Verify

- `pnpm build` passes.
- `/` shows the English dictionary strings. After `sync`, one non-English route
  shows translated shell strings and page titles.
- Sidebar labels come from `content/en/**/_meta.ts`, not from the dictionary.

## Report back

List files changed, each layout string you left untranslated and why (URLs,
native language names), and any MDX you were not sure belonged under
`content/en/`.
````

</details>

<a id="optional-t-for-app-react-hybrid"></a>
## Opcional: `t()` para `app/` React (híbrido)

**Padrão:** Literais de objeto `_meta.ts` e `app/_dictionaries/en.ts` são traduzidos por `translate-docs`. Nenhum `t()` é necessário para essas strings de shell.

**Híbrido opcional:** componentes de servidor personalizados podem chamar `t("source sentence")` e `translate-ui`. A frase é escrita em `sourceLocale`, que pode ser qualquer idioma. Não copie strings de dicionário ou títulos de `_meta.ts` para essas chamadas. `extract` só vê literais dentro de `t()`, portanto, `ui.sourceRoots` deve listar apenas as pastas que contêm essas chamadas (o exemplo usa `app/_components`), não `app/_dictionaries`.

Um singleton i18next em nível de módulo com `changeLanguage` não é seguro em um componente de servidor: solicitações simultâneas o compartilham. Em vez disso, o exemplo usa uma pesquisa sem estado (stateless). `getT(lang)` carrega `locales/{lang}.json` para uma localidade de destino, trata a rota de origem como um pacote vazio (o literal em inglês já é o texto) e interpola com `interpolateTemplate` de `ai-i18n-tools/runtime`. Os placeholders são <code v-pre>{{name}}</code> com chaves de palavras ASCII. Esta é a mesma ideia de [examples/astro-website/src/i18n/t.ts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/astro-website/src/i18n/t.ts).

Essa pesquisa não seleciona formas plurais. Um componente que precisa de `plurals: true` deve usar o caminho do i18next de [Conectar i18next](/pt-BR/guide/ui-strings/i18next-runtime) em um componente de cliente, ou um `createInstance()` por solicitação.

Configuração para o híbrido, ao lado do bloco de documentação existente:

- `features.translateUIStrings`
- `ui.sourceRoots` — pastas que contêm chamadas `t()`
- `ui.stringsJson`
- `ui.flatOutputDir`

O `sourceLocale` do exemplo é `en-GB` e a rota do site é `en`. Com a pesquisa sem estado (stateless), a rota `en` não precisa de pacote, então essa incompatibilidade não importa. Só importa se você mudar este componente para o bootstrap do i18next, que usa `sourceLocale` como chave para os pacotes.

| Conteúdo | Pipeline padrão | Alternativa opcional |
|---------|------------------|----------------------|
| Corpos de página MDX | `translate-docs` | — |
| Títulos de objeto `_meta.ts` / `_meta.tsx` | `translate-docs` | refatorar para `t()` em JSX (híbrido) |
| Layout `app/`, `_components/` | `nextraDictionaryPath` + dicionário `.ts` | `t()` + `translate-ui` |

Consulte `app/_components/feedback-links.tsx` e `lib/ui-t.ts` em [examples/nextra-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs/). `pnpm run i18n:sync-ui` nesse exemplo executa a extração e `translate-ui` sem tocar no pipeline de documentação.

**Exemplo de prompt para agente de IA** (copie no Cursor ou em outro agente de codificação ao adicionar `t()` ao lado do dicionário):

<details class="agent-prompt">
<summary>Prompt híbrido t()</summary>

````markdown
# Add a stateless t() lookup to a Nextra 4 server component

## Context

MDX pages, `_meta.ts`, and `app/_dictionaries/en.ts` stay on `translate-docs`.
Do not duplicate those strings in `t()`. This task adds `t("source sentence")`
only in custom components that the dictionary does not cover. The literal is the
catalog key and is written in `sourceLocale`, which can be any language. Do not translate any string.

Follow `lib/ui-t.ts` and `app/_components/feedback-links.tsx` in
https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs

## Scope

Edit the named components and `ai-i18n-tools.config.json`. Do not edit
`app/_dictionaries`, `content/**/_meta.ts`, or generated locale trees. Skip
URLs, native language names, and `docsRepositoryBase`.

## Call shape

Create `lib/ui-t.ts`. `getT(lang)` loads `locales/{lang}.json` through a
dynamic-import map for target locales, uses an empty bundle for the source
route, and returns
`(source, vars) => interpolateTemplate(flat[source] ?? source, vars ?? {})` with
`interpolateTemplate` imported from `ai-i18n-tools/runtime`.

Replace hardcoded sentences in the named server components with `t("source sentence")`. The sentence is written in `sourceLocale`, which can be any language.
A placeholder is `t("You are reading {{page}}.", { page })`.

Do not use `getRequestConfig` (that is a next-intl API) and do not call
`changeLanguage` on a shared i18next instance. This lookup does not resolve
plurals. Leave plural copy on the i18next client path.

Set `features.translateUIStrings`, `ui.sourceRoots` to only the folders that
contain `t()` calls, `ui.stringsJson`, and `ui.flatOutputDir`.

## Order

1. Add `lib/ui-t.ts` and the `t()` calls.
2. Set the four `ui` config keys.
3. Run `ai-i18n-tools extract` (or `sync-ui`). Do not hand-write
   `locales/*.json`.

## Do not

- Do not translate, rename, or reword the source sentences.
- Do not put `t()` keys in `app/_dictionaries` or move `_meta.ts` titles into
  `t()`.
- Do not hand-edit `strings.json` or flat locale files.
- Do not change layout or Nextra theme props that already receive dictionary
  strings.

## Verify

- `extract` writes a non-empty catalog containing the new sentences and nothing
  from the dictionary.
- The project build passes.
- The source route still shows the English sentences. After `translate-ui`, one
  non-English route renders the translated component.

## Report back

List files changed, each string you left in the dictionary on purpose, and any
plural or server-concurrency case you did not convert.
````

</details>

<a id="link-conventions"></a>
## Convenções de link

O Nextra serve rotas com prefixo de localidade via Next.js `i18n` (`/guide/getting-started`, `/pt-BR/guide/getting-started`). **Os links na página devem permanecer neutros em relação à localidade** (`/guide/getting-started`) para que o Next.js possa prefixar a localidade ativa automaticamente.

Habilite o normalizador integrado para que `translate-docs` corrija os links em cada arquivo traduzido automaticamente:

```json
"docsOutput": {
  "style": "nextra",
  "docsRoot": "content/en",
  "rewriteNextraLinks": true
}
```

`rewriteNextraLinks` é ativado por padrão quando `style` é `"nextra"`.

| Autor na localidade de origem | Após o normalizador |
|--------------------------|------------------|
| `[Guide](content/en/guide/getting-started.mdx)` | `[Guide](/pt-BR/guide/getting-started)` |
| `[Guide](/pt-BR/guide/getting-started.mdx)` | `[Guide](/pt-BR/guide/getting-started)` |
| `[Demo](https://github.com/org/repo)` | inalterado (URL completa) |

**Regras de autoria**

- Links de documentos entre páginas: use **rotas de site neutras em relação à localidade** (`/guide/…`) em MDX em inglês, ou caminhos `content/en/…` / `.mdx` relativos e deixe o normalizador reescrevê-los durante `sync`.
- Arquivos do repositório fora da árvore de conteúdo: use **URLs completas**.
- **Não** edite links manualmente em `content/<locale>/` — regenere com `sync` / `translate-docs`.

<a id="optional-locale-proxy"></a>
## Proxy de localidade opcional

O Nextra fornece um proxy de detecção de localidade para sites i18n. Exporte-o de `proxy.ts` na raiz do seu projeto:

```ts
export { proxy } from 'nextra/locales'

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|manifest|_pagefind).*)',
  ],
}
```

**Códigos de localidade do site vs `sourceLocale`:** Nextra e Next.js usam códigos de rota curtos (`en`, `pt-BR`, `zh-Hans`) em `next.config`, `content/{locale}/` e no cookie `NEXT_LOCALE`. `sourceLocale` em `ai-i18n-tools.config.json` pode ser uma tag BCP-47, como `en-GB`, para qualidade de tradução — essa tag **não** é uma rota de site. Se o cookie do navegador ou `Accept-Language` resolver para uma tag fora de `i18n.locales` (por exemplo, `en-GB` quando apenas `en` está configurado), o proxy padrão do Nextra pode redirecionar em loop. A demonstração [examples/nextra-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs/) envolve `nextra/locales` para redefinir cookies e caminhos inválidos para a localidade padrão do site antes de delegar.

Isso não funciona com exportações estáticas `output: 'export'`. Consulte [Documentos i18n do Nextra](https://nextra.site/docs/guide/i18n).

Consulte também [Configuração — `docsOutput`](/pt-BR/reference/configuration#docsoutput) e [Layouts de saída](/pt-BR/guide/documents/output-layouts).
