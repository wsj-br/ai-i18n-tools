<a id="astro-integration"></a>
# Integração Astro

Use ai-i18n-tools com [Astro](https://astro.build/) em duas configurações comuns: sites de documentação **Astro Starlight** e sites de marketing ou aplicativos **Astro simples**. Ambos usam Documentos (`translate-docs`) para o conteúdo da página; sites Astro simples geralmente combinam isso com strings de UI (`extract` / `translate-ui`) para strings `t()` em frontmatter e dados compartilhados.

Consulte também [strings da UI](/guide/ui-strings/astro-website#astro-website-plain-astro-not-starlight), [Documentos](/guide/documents/) e os exemplos executáveis abaixo.

<a id="astro-starlight"></a>
## Astro Starlight

Use `init -t ui-starlight` e `docsOutput.style: "astro-starlight"` para sites de documentação [Astro Starlight](https://starlight.astro.build/). O preset é um alias para `doc-system` com um `localeSubpath` vazio — páginas traduzidas ficam em `src/content/docs/<locale>/` ao lado da árvore de origem em inglês.

<a id="quick-start"></a>
### Início rápido

```bash
npx ai-i18n-tools init -t ui-starlight
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm dev             # Starlight dev server (project-specific script)
```

<a id="page-layout"></a>
### Layout da página

Markdown e MDX em inglês ficam na raiz do conteúdo do Starlight (geralmente `src/content/docs/`). Cópias traduzidas são escritas ao lado da árvore de origem:

```text
src/content/docs/quick-start.md     →  src/content/docs/de/quick-start.md
src/content/docs/guide/setup.mdx    →  src/content/docs/fr/guide/setup.mdx
```

Configure um bloco `docs[]`:

```json
{
  "contentPaths": ["src/content/docs/"],
  "outputDir": "src/content/docs",
  "docsOutput": {
    "style": "astro-starlight",
    "docsRoot": "src/content/docs"
  }
}
```

Aponte `contentPaths` para seus arquivos e diretórios `.md` / `.mdx` em inglês. Defina `docsRoot` para a mesma pasta que o Starlight usa como sua raiz de conteúdo.

As substituições da UI do Starlight podem usar `src/content/i18n/en.json` com `jsonPathTemplate` em um bloco `docs[]` separado quando necessário — consulte [Documentos — inicializar para documentação](/guide/documents/#step-1-initialise-for-documentation).

<a id="framework-shell-translation"></a>
### Tradução do shell do framework

O Starlight fornece suas próprias strings de UI integradas para muitos idiomas (rótulos de navegação, espaço reservado de pesquisa, sumário e assim por diante) — não há um pipeline de shell/tema separado para configurar, ao contrário do Docusaurus, VitePress ou Nextra:

| Framework | Strings de shell / tema | Pipeline |
|-----------|----------------------|----------|
| Astro Starlight | Strings de UI integradas (muitos idiomas); nenhum pipeline de shell adicional | Documentos — `translate-docs` (somente páginas) |
| Docusaurus | Catálogo `write-translations` (`{ message, description }`) | Documentos — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | Catálogo de tema/navegação/barra lateral | Documentos — `docsOutput.vitepressThemeCatalog` + `translate-docs` |
| Nextra | `_meta.ts` rótulos da barra lateral + dicionário de tema `.ts` | Documentos — consulte [Integração Nextra](/guide/integrations/nextra) |
| Fumadocs | `meta.json` rótulos da barra lateral + catálogo de substituições de UI | Documentos — consulte [Integração Fumadocs](/guide/integrations/fumadocs) |

Consulte [integração Docusaurus](/guide/integrations/docusaurus), [integração VitePress](/guide/integrations/vitepress), [integração Nextra](/guide/integrations/nextra) e [integração Fumadocs](/guide/integrations/fumadocs) para os outros padrões de framework.

<a id="example-project"></a>
### Projeto de exemplo

[examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) — fontes em inglês em `src/content/docs/`, traduções commitadas em `src/content/docs/<locale>/`, localidade RTL (`ar`) e tradução orientada por glossário. Execute `pnpm dev` na porta 3050.

<a id="plain-astro-marketing-and-app-sites"></a>
## Astro simples (sites de marketing e aplicativos)

Para sites estáticos de marketing ou aplicativos Astro (não Starlight), combine [roteamento i18n integrado do Astro](https://docs.astro.build/en/guides/internationalization/) com ai-i18n-tools. A implementação de referência é [examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website): inglês em `/`, localidades de destino em `/{locale}/`.

A maioria das equipes usa um **híbrido** de dois pipelines na mesma página:

| Pipeline | Uso para | Comandos | Saída |
|----------|---------|----------|--------|
| **HTML da página** | Cabeçalhos, parágrafos, rótulos de navegação, arrays embutidos no corpo do template | `translate-docs` | `src/pages/{locale}/index.astro` por localidade |
| **Strings de interface (`t()`)** | Dados frontmatter, rótulos de abas, arrays compartilhados | `extract` → `translate-ui` | `public/locales/{locale}.json` (fonte em inglês como chave) |

<a id="quick-start-1"></a>
### Início rápido

```bash
npx ai-i18n-tools init -t ui-astro-website
# enable features.translateDocs and add a docs[] block for page HTML (see below)
pnpm run i18n:sync
pnpm dev
```

Estruture a extração da UI com `init -t ui-astro-website`, depois mescle em um bloco `docs[]` quando você também traduzir o HTML da página:

```json
{
  "features": {
    "translateUIStrings": true,
    "translateDocs": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "public/locales/strings.json",
    "flatOutputDir": "public/locales/"
  },
  "docs": [{
    "contentPaths": ["src/pages/index.astro"],
    "outputDir": "src/pages",
    "docsOutput": {
      "style": "astro-starlight",
      "docsRoot": "src/pages"
    },
    "addFrontmatter": false
  }]
}
```

Mantenha três listas alinhadas ao adicionar ou remover um idioma: `targetLocales` em `ai-i18n-tools.config.json`, `i18n.locales` em `astro.config.mjs` (Astro usa códigos de rota em **minúsculas**, como `pt-br`), e `ui-languages.json` (via `generate-ui-languages`). Os **nomes de arquivo** do pacote plano usam o casing da configuração (`pt-BR.json`); mapeie a rota `pt-br` do Astro para esse arquivo através do campo `code` do seu manifesto.

Resolva `t('…')` no **tempo de compilação** procurando o literal da fonte em inglês como a chave — consulte `examples/astro-website/src/i18n/t.ts`. Você não precisa de `ai-i18n-tools/runtime` ou i18next para um site estático, a menos que adicione ilhas de cliente que mudam de idioma após o carregamento.

<a id="example-project-1"></a>
### Projeto de exemplo

[examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) — página de destino híbrida com HTML via `translate-docs` e rótulos de guia de captura de tela via `t()` + `translate-ui`.

<a id="example-projects"></a>
## Projetos de exemplo

| Projeto | Caso de uso | Porta |
|---------|----------|------|
| [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) | Documentação Starlight | 3050 |
| [examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) | Site de marketing Astro simples (HTML + híbrido `t()`) | (ver README) |

Compare [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) com [examples/nextjs-app/docs-site](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/docs-site) — conteúdo de tutorial semelhante, estilo de saída Docusaurus em vez de Starlight.
