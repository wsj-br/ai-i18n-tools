<a id="fumadocs-integration"></a>
# Integração com Fumadocs

Use `init -t ui-fumadocs` e `docsOutput.style: "fumadocs"` para sites de documentação [Fumadocs](https://www.fumadocs.dev/) 4 no Next.js App Router. O preset é um alias para `doc-system` com um `localeSubpath` vazio e códigos de localidade BCP-47 ou curtos preservados (`localePathLowercase` assume `false` por padrão).

Consulte também [Documentos](/guide/documents/) e a demonstração executável [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/) (dot parser, porta 3080).

<a id="quick-start"></a>
## Primeiros passos

```bash
npx ai-i18n-tools init -t ui-fumadocs
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm run build       # Next.js build (project-specific script)
```

Habilite `features.translateDocs` ao traduzir o conteúdo da página, os rótulos da barra lateral `meta.json` e as substituições da interface do usuário do Fumadocs em uma única execução de `sync`.

<a id="page-layout"></a>
## Layout da página

Fumadocs suporta dois layouts de conteúdo i18n via `docsOutput.fumadocsParser`. O parser **dot** é o padrão (Fumadocs integrado e sites de produção como [SWR](https://github.com/vercel/swr-site)).

### Dot parser (padrão)

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

Consulte `ai-i18n-tools.config.dir.example.json` em [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/) para uma configuração de diretório de copiar e colar. O modelo mental corresponde à [integração Nextra](/guide/nextra-integration#page-layout).

<a id="meta-json-sidebar"></a>
## Barra lateral (`meta.json`)

Fumadocs usa arquivos JSON `meta.json` para a estrutura e títulos da barra lateral. Quando `docsOutput.style` é `"fumadocs"`, **`translate-docs`** coleta `meta.json` sob `docsRoot` (ou `docs[].fumadocsMetaGlob`), traduz valores de string para chaves listadas em `docs[].fumadocsMetaTranslatableKeys` (padrão: `title`, `description`) e escreve as saídas de localidade:

| Parser | Fonte em inglês | Saída |
|--------|----------------|--------|
| **dot** | `content/docs/**/meta.json` | `content/docs/**/meta.{locale}.json` |
| **dir** | `content/docs/en/**/meta.json` | `content/docs/{locale}/**/meta.json` |

**Não** traduza arrays de slug `pages`, `root`, `icon`, `defaultOpen` ou outras chaves estruturais — apenas rótulos legíveis por humanos.

<a id="ui-catalog"></a>
## Catálogo da UI

O "chrome" do layout do Fumadocs (espaço reservado para pesquisa, nomes de exibição de localidade e outras substituições de `defineTranslations` / `i18n.translations()` em `lib/layout.shared.ts`) não é extraído do markdown. Configure **`docsOutput.fumadocsUiCatalog`** para que **`translate-docs`** inicialize o catálogo em inglês a partir de `sourcePath` e traduza o JSON por localidade:

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

- **`catalogPath`** — JSON plano em inglês gerado (saída de inicialização). Execute `sync` novamente quando as substituições em inglês em `layout.shared.ts` mudarem.
- **`outputPathTemplate`** (opcional) — saídas por localidade; padrão: `ui.{locale}.json` ao lado de `catalogPath`.

Carregue o JSON por localidade em `layout.shared.ts` via `loadUiCatalog(locale)` e mescle com `i18nProvider(translations, lang)` em seu layout raiz. Consulte [examples/fumadocs-docs/lib/layout.shared.ts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/fumadocs-docs/lib/layout.shared.ts).

Locais padrão podem ser cobertos por presets `@fumadocs/language/*` sem custo de LLM; o catálogo traduz **sobrescritas de projeto** no bloco em inglês apenas.

**Não** use `json[]` para strings de interface do usuário Fumadocs — esse pipeline é para bundles de locale de aplicativos não relacionados.

<a id="framework-shell-translation"></a>
## Tradução do shell do framework

| Framework | Strings de shell / tema | Pipeline |
|-----------|----------------------|----------|
| Docusaurus | Catálogo `write-translations` | Documentos — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | Catálogo de tema/navegação/barra lateral | Documentos — `docsOutput.vitepressThemeCatalog` + `translate-docs` |
| Nextra | Rótulos da barra lateral `_meta.ts` | Documentos — automático quando `style: "nextra"` + `translate-docs` |
| Nextra | Dicionário de tema `.ts` | Documentos — `docs[].nextraDictionaryPath` + `translate-docs` |
| Fumadocs | Rótulos de barra lateral `meta.json` | Documentos — auto quando `style: "fumadocs"` + `translate-docs` |
| Fumadocs | Catálogo de sobrescritas de interface do usuário | Documentos — `docsOutput.fumadocsUiCatalog` + `translate-docs` |
| Astro Starlight | Strings de UI integradas (muitos idiomas); sem pipeline de shell adicional | Documentos — `translate-docs` (somente páginas) |

Não **coloque** strings de shell/tema de framework em `json[]` — esse pipeline é para pacotes de localidade de aplicativo não relacionados. Veja [integração do Docusaurus](/guide/docusaurus-integration), [integração do VitePress](/guide/vitepress-integration) e [integração do Nextra](/guide/nextra-integration) para os outros padrões de framework.

<a id="link-conventions"></a>
## Convenções de link

Fumadocs serve rotas com prefixo de locale via middleware do Next.js (`/docs/getting-started`, `/pt/docs/getting-started`). **Links dentro da página devem permanecer neutros em relação ao locale** (`/docs/getting-started`) para que o prefixo do locale ativo seja aplicado automaticamente.

Habilite o normalizador integrado para que `translate-docs` corrija os links em cada arquivo traduzido automaticamente:

```json
"docsOutput": {
  "style": "fumadocs",
  "docsRoot": "content/docs",
  "rewriteFumadocsLinks": true
}
```

`rewriteFumadocsLinks` é habilitado por padrão quando `style` é `"fumadocs"`.

| Autor em fonte em inglês | Após normalizador |
|--------------------------|------------------|
| `[Guide](content/docs/guide/getting-started.mdx)` | `[Guide](/docs/guide/getting-started)` |
| `[Home](content/docs/index.mdx)` | `[Home](/docs)` |
| `[Guide](/guide/getting-started.mdx)` | `[Guide](/docs/guide/getting-started)` |
| `[Demo](https://github.com/org/repo)` | inalterado (URL completa) |

**Regras de autoria**

- Links de documentação entre páginas: use **rotas de site neutras em local** (`/docs/…`) em MDX em inglês, ou `content/docs/…` / caminhos relativos `.mdx` e deixe o normalizador reescrevê-los durante `sync`.
- Arquivos de repositório fora da árvore de conteúdo: use **URLs completas**.
- Não edite **manualmente** links em cópias com sufixo de local (`*.pt.mdx`) ou árvores `content/{locale}/` — regenere com `sync` / `translate-docs`.

Veja também [Documentos — reescrita de links](/guide/documents/link-rewriting) e [Configuração — `docsOutput`](/reference/configuration#docsoutput).

<a id="locale-codes"></a>
## Códigos de locale

Mantenha `targetLocales` em `ai-i18n-tools.config.json` alinhado com `defineI18n().languages` no seu aplicativo Fumadocs **exatamente**. O exemplo de ponto usa códigos curtos (`pt`, `zh`); configurações de diretório podem usar pastas BCP-47 (`pt-BR`, `zh-Hans`). Não há normalização forçada — códigos não coincidentes produzem caminhos de saída errados ou páginas faltantes.

<a id="multiple-collections"></a>
## Múltiplas coleções

Projetos Fumadocs podem definir vários blocos `defineDocs` em `source.config.ts` (documentos, blog, exemplos). Adicione um bloco `docs[]` por coleção que você traduz, cada um com seu próprio `contentPaths`, `outputDir` e `docsRoot`.

<a id="example-project"></a>
## Projeto de exemplo

[exemplos/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/) — MDX em inglês em `content/docs/`, comprometido `pt` e `zh` páginas com sufixo de ponto, `meta.json` e `lib/i18n/ui.{locale}.json`. Execute `pnpm run dev` na porta **3080**.

<a id="cross-references"></a>
## Referências cruzadas

- [Configuração — `docsOutput`](/reference/configuration#docsoutput)
- [Layouts de saída](/guide/documents/output-layouts)
- [Integração com Docusaurus](/guide/docusaurus-integration)
- [Integração com Nextra](/guide/nextra-integration) (modelo mental do parser de diretório)
- [Integração com VitePress](/guide/vitepress-integration) (padrão de bootstrap do catálogo de UI)
