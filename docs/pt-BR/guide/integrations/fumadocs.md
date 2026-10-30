<a id="fumadocs-integration"></a>
# Integração com Fumadocs

Use `init -t ui-fumadocs` e `docsOutput.style: "fumadocs"` para sites de documentação [Fumadocs](https://www.fumadocs.dev/) 4 no Next.js App Router. O preset é um alias para `doc-system` com um `localeSubpath` vazio e códigos de localidade BCP-47 ou curtos preservados (`localePathLowercase` assume `false` por padrão).

Consulte também [Documentos](/pt-BR/guide/documents/) e a demonstração executável [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/) (dot parser, porta 3080).

<a id="quick-start"></a>
## Início rápido

```bash
ai-i18n-tools init -t ui-fumadocs -P groq
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm run build       # Next.js build (project-specific script)
```

Habilite `features.translateDocs` ao traduzir o conteúdo da página, os rótulos da barra lateral `meta.json` e as substituições da interface do usuário do Fumadocs em uma única execução de `sync`.

<a id="page-layout"></a>
## Layout da página

Fumadocs suporta dois layouts de conteúdo i18n via `docsOutput.fumadocsParser`. O parser **dot** é o padrão (Fumadocs integrado e sites de produção como [SWR](https://github.com/vercel/swr-site)).

<a id="dot-parser-default"></a>
### Analisador Dot (padrão)

O MDX em inglês reside na raiz da coleção. Cópias traduzidas usam um sufixo de localidade no mesmo diretório:

```text
content/docs/index.mdx                    →  content/docs/index.pt.mdx
content/docs/guide/getting-started.mdx    →  content/docs/guide/getting-started.zh.mdx
```

```json
{
  "contentPaths": ["content/docs"],
  "outputDir": "content/docs",
  "docsOutput": {
    "style": "fumadocs",
    "docsRoot": "content/docs",
    "fumadocsParser": "dot",
    "rewriteFumadocsLinks": true
  }
}
```

Alinhe `targetLocales` com `defineI18n().languages` em `lib/i18n.ts` exatamente (o exemplo usa códigos curtos `pt` e `zh`).

<a id="enable-i18n-in-an-existing-site"></a>
### Habilitar i18n em um site existente

Um aplicativo Fumadocs somente em inglês precisa de uma rota de localidade e `defineI18n` antes que `translate-docs` possa gravar arquivos irmãos. A configuração inicial usa o prompt em [Adicionar i18n a um site ou site de documentação](/pt-BR/guide/add-i18n-to-website#run-the-agent-prompt). O [prompt do agente](#agent-prompt) nesta página é o acompanhamento que conecta o catálogo da UI. Lista de verificação:

- `defineI18n` em `lib/i18n.ts` com `languages`, `defaultLanguage` e `parser: "dot"` ou `"dir"`.
- Rotas `app/[lang]/` e `createI18nMiddleware` de `proxy.ts` (o arquivo do exemplo).
- `i18n.translations()` em `lib/layout.shared.ts`, passado para `i18nProvider`.
- MDX em inglês na raiz da coleção (ponto) ou em `content/docs/en/` (diretório).
- `targetLocales` igual a `languages` menos o idioma padrão, depois `sync`.

<a id="dir-parser-nextra-style"></a>
### Dir parser (estilo Nextra)

Para equipes acostumadas a pastas de localidade (`content/docs/en/` → `content/docs/pt-BR/`), defina `fumadocsParser` como `"dir"`:

```text
content/docs/en/index.mdx           →  content/docs/pt-BR/index.mdx
content/docs/en/guide/foo.mdx       →  content/docs/zh-Hans/guide/foo.mdx
```

```json
{
  "contentPaths": ["content/docs/en"],
  "outputDir": "content/docs",
  "docsOutput": {
    "style": "fumadocs",
    "docsRoot": "content/docs/en",
    "fumadocsParser": "dir",
    "rewriteFumadocsLinks": true
  }
}
```

Consulte `ai-i18n-tools.config.dir.example.json` em [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/) para uma configuração de diretório de copiar e colar. O modelo mental corresponde à [integração Nextra](/pt-BR/guide/integrations/nextra#page-layout).

<a id="sidebar-metajson"></a>
## Barra lateral (`meta.json`)

Fumadocs usa arquivos JSON `meta.json` para estrutura e títulos da barra lateral. Quando `docsOutput.style` é `"fumadocs"`, `translate-docs` coleta `meta.json` sob `docsRoot` (ou `docs[].fumadocsMetaGlob`), traduz valores de string para chaves listadas em `docs[].fumadocsMetaTranslatableKeys` (padrão: `title`, `description`) e grava saídas de localidade:

| Analisador | Localidade de origem | Saída |
|--------|----------------|--------|
| **dot** | `content/docs/**/meta.json` | `content/docs/**/meta.{locale}.json` |
| **dir** | `content/docs/en/**/meta.json` | `content/docs/{locale}/**/meta.json` |

**Não** traduza arrays de slug `pages`, `root`, `icon`, `defaultOpen` ou outras chaves estruturais — apenas rótulos legíveis por humanos.

<a id="ui-catalog"></a>
## Catálogo da UI

Os elementos de interface do layout do Fumadocs (texto de espaço reservado da pesquisa, nomes de exibição da localidade e outras substituições de `defineTranslations` / `i18n.translations()` em `lib/layout.shared.ts`) não são extraídos do markdown. Configure `docsOutput.fumadocsUiCatalog` para que `translate-docs` inicialize o catálogo da localidade de origem a partir de `sourcePath` e traduza o JSON por localidade:

```json
{
  "features": {
    "translateDocs": true
  },
  "docs": [
    {
      "contentPaths": ["content/docs"],
      "outputDir": "content/docs",
      "docsOutput": {
        "style": "fumadocs",
        "docsRoot": "content/docs",
        "fumadocsParser": "dot",
        "fumadocsUiCatalog": {
          "sourcePath": "lib/layout.shared.ts",
          "catalogPath": "lib/i18n/ui.en.json"
        }
      }
    }
  ]
}
```

- `catalogPath` — JSON plano em inglês. A inicialização lê apenas o objeto `en` de `.add({ … })` em `sourcePath`. Literais de string nesse objeto tornam-se chaves do catálogo (`displayName`, `Search(search trigger)`). `.add()` aceita apenas chaves que as predefinições da UI do Fumadocs registraram, então um título de navegação como `site.title` não pode residir lá. O exemplo mantém `site.title` no JSON e lê `catalog["site.title"]` para `nav.title`. Chaves já no arquivo, mas ausentes do objeto `en`, permanecem: a mesclagem é `{ ...existing, ...extracted }`. Execute novamente `sync` quando os literais em inglês mudarem.
- `outputPathTemplate` (opcional) — saídas por localidade; padrão: `ui.{locale}.json` ao lado de `catalogPath`.

Uma chave traduzida não faz nada até que o app a leia. `i18n.translations().get(lang)` retorna apenas as chaves registradas com `.extend()` (as predefinições da UI do Fumadocs). Espalhe (spread) o catálogo de localidades em `.add()` para que essas chaves sejam aplicadas e coloque o `displayName` nativo **após** o spread para que uma tradução do nome em inglês não o substitua:

```ts
"pt-BR": {
  ...loadUiCatalog("pt-BR"),
  displayName: "Português (Brasil)",
},
```

`site.title` não é uma chave da UI do Fumadocs. O exemplo a lê do catálogo para `nav.title`. Um rótulo de pesquisa que existe apenas em `ui.pt-BR.json` permanece na predefinição integrada até que esse spread (ou outra leitura) o utilize.

Consulte [examples/fumadocs-docs/lib/layout.shared.ts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/fumadocs-docs/lib/layout.shared.ts).

Locais padrão podem ser cobertos por presets `@fumadocs/language/*` sem custo de LLM; o catálogo traduz **sobrescritas de projeto** no bloco em inglês apenas.

<a id="agent-prompt"></a>
## Prompt do agente

Copie isto quando um site Fumadocs somente em inglês precisar adicionar localidades. Isso conecta o roteamento e o catálogo da UI. Isso não traduz strings.

<details class="agent-prompt">
<summary>Prompt do catálogo da UI</summary>

````markdown
# Enable Fumadocs i18n and the UI catalog

## Context

ai-i18n-tools translates Fumadocs MDX, `meta.json` titles, and the English block
of `i18n.translations().add({ en: { … } })` via `translate-docs` and
`docsOutput.fumadocsUiCatalog`. The literal in that `en` object is the source
string. Locale JSON takes effect only for keys the app reads: either a catalog
spread into `.add()` for registered UI keys, or a direct read such as
`catalog["site.title"]` for the nav title. Do not translate any string.

Reference:
https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs

## Scope

Edit `lib/i18n.ts`, `lib/layout.shared.ts`, `proxy.ts`, `app/[lang]/` routes,
and `ai-i18n-tools.config.json`. Skip URLs, slugs, and native language names
(`displayName` on each locale entry).

## Call shape

- `defineI18n({ languages, defaultLanguage, parser })`. Use `"dot"` unless the
  project already keeps English under a locale folder (`"dir"`).
- `export default createI18nMiddleware(i18n)` from `proxy.ts`.
- Move pages under `app/[lang]/…` and pass `lang` into `baseOptions` and
  `i18nProvider(translations, lang)`.
- In `lib/layout.shared.ts`, keep English UI overrides as string literals inside
  `.add({ en: { … } })`. For each other locale, spread `loadUiCatalog(locale)`
  and then set `displayName` to the native name.
- Config: `features.translateDocs`, `docsOutput.style: "fumadocs"`,
  `fumadocsParser` matching `defineI18n`, and `fumadocsUiCatalog.sourcePath`
  pointing at `lib/layout.shared.ts`. `targetLocales` must equal `languages`
  except the default language, character for character.

## Order

1. Routing and `defineI18n`.
2. English literals in the `en` block, and the catalog spread for other locales.
3. Ask the user to run `sync`. Do not hand-write `ui.<locale>.json` or
   translated MDX.

## Do not

- Do not translate, rename, or reword the English literals.
- Do not put native language names only in the `en` block (they would be
  extracted and translated).
- Do not hand-edit locale JSON, `meta.<locale>.json`, or locale MDX.
- Do not use `json[]` for this catalog.

## Verify

- `pnpm build` passes.
- The default locale still shows the English overrides.
- After `sync`, one other locale shows the translated search trigger and nav
  title, and `displayName` in the language menu is still the native name.

## Report back

List files changed, each key you added to the `en` block, each key you left
unread (and so unused) with a one-line reason, and whether the parser is `dot`
or `dir`.
````

</details>

**Não** use `json[]` para strings de interface do usuário Fumadocs — esse pipeline é para bundles de locale de aplicativos não relacionados.

<a id="link-conventions"></a>
## Convenções de link

Fumadocs serve rotas com prefixo de locale via middleware do Next.js (`/docs/getting-started`, `/pt/docs/getting-started`). **Links dentro da página devem permanecer neutros em relação ao locale** (`/docs/getting-started`) para que o prefixo do locale ativo seja aplicado automaticamente.

Habilite o normalizador integrado para que `translate-docs` corrija links em cada arquivo traduzido automaticamente:

```json
"docsOutput": {
  "style": "fumadocs",
  "docsRoot": "content/docs",
  "rewriteFumadocsLinks": true
}
```

`rewriteFumadocsLinks` é habilitado por padrão quando `style` é `"fumadocs"`.

| Autor na localidade de origem | Após o normalizador |
|--------------------------|------------------|
| `[Guide](content/docs/guide/getting-started.mdx)` | `[Guide](/docs/guide/getting-started)` |
| `[Home](content/docs/index.mdx)` | `[Home](/docs)` |
| `[Guide](/pt-BR/guide/getting-started.mdx)` | `[Guide](/docs/guide/getting-started)` |
| `[Demo](https://github.com/org/repo)` | inalterado (URL completa) |

**Regras de autoria**

- Links de documentos entre páginas: use **rotas de site neutras em relação à localidade** (`/docs/…`) em MDX em inglês, ou `content/docs/…` / caminhos relativos `.mdx` e deixe o normalizador reescrevê-los durante `sync`.
- Arquivos do repositório fora da árvore de conteúdo: use **URLs completas**.
- **Não** edite links manualmente em cópias com sufixo de localidade (`*.pt.mdx`) ou árvores `content/{locale}/` — regenere com `sync` / `translate-docs`.

Veja também [Documentos — reescrita de links](/pt-BR/guide/documents/link-rewriting) e [Configuração — `docsOutput`](/pt-BR/reference/configuration#docsoutput).

<a id="locale-codes"></a>
## Códigos de locale

Mantenha `targetLocales` em `ai-i18n-tools.config.json` alinhado com `defineI18n().languages` em seu aplicativo Fumadocs **exatamente**. O exemplo de ponto usa códigos curtos (`pt`, `zh`); as configurações de diretório podem usar pastas BCP-47 (`pt-BR`, `zh-Hans`). Não há normalização forçada — códigos incompatíveis produzem caminhos de saída incorretos ou páginas ausentes.

<a id="multiple-collections"></a>
## Múltiplas coleções

Projetos Fumadocs podem definir vários blocos `defineDocs` em `source.config.ts` (documentos, blog, exemplos). Adicione um bloco `docs[]` por coleção que você traduz, cada um com seu próprio `contentPaths`, `outputDir` e `docsRoot`.

<a id="example-project"></a>
## Projeto de exemplo

[exemplos/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/) — MDX em inglês em `content/docs/`, comprometido `pt` e `zh` páginas com sufixo de ponto, `meta.json` e `lib/i18n/ui.{locale}.json`. Execute `pnpm run dev` na porta **3080**.

<a id="cross-references"></a>
## Referências cruzadas

- [Configuração — `docsOutput`](/pt-BR/reference/configuration#docsoutput)
- [Layouts de saída](/pt-BR/guide/documents/output-layouts)
- [Integração Docusaurus](/pt-BR/guide/integrations/docusaurus)
- [Integração Nextra](/pt-BR/guide/integrations/nextra) (modelo mental do analisador de diretório)
- [Integração VitePress](/pt-BR/guide/integrations/vitepress) (padrão de inicialização do catálogo de UI)
