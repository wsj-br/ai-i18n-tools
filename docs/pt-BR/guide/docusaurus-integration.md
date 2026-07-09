<a id="docusaurus-integration"></a>
# Integração com Docusaurus

Use `init -t ui-docusaurus` e `docsOutput.style: "docusaurus"` para sites de documentação [Docusaurus](https://docusaurus.io/). O preset estrutura um bloco `docs[]` com `docusaurusCatalogDir` para que `translate-docs` possa traduzir tanto o markdown da página quanto o JSON shell do Docusaurus em um único comando.

Consulte também [Documentos](/guide/documents/), a demonstração executável [examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app) (aplicativo Next.js mais `docs-site/` aninhado) e [examples/nextjs-app/docs-site](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/docs-site) para um passo a passo focado apenas no Docusaurus.

<a id="quick-start"></a>
## Primeiros passos

```bash
npx ai-i18n-tools init -t ui-docusaurus
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths, docusaurusCatalogDir)
pnpm run i18n:sync   # or: ai-i18n-tools sync
cd docs-site && pnpm build   # Docusaurus build (project-specific script)
```

Habilite `features.translateDocs` e defina `docs[].docusaurusCatalogDir` ao traduzir tanto as páginas de documentação quanto o "chrome" do site (barra de navegação, rodapé, strings do tema). Execute `docusaurus write-translations` em seu projeto Docusaurus ao atualizar `@docusaurus/*` ou alterar rótulos da barra de navegação/rodapé/tema — então execute novamente `translate-docs` ou `sync` para que o JSON shell seja traduzido para cada pasta de localidade.

<a id="page-layout"></a>
## Layout da página

Markdown e MDX em inglês ficam na pasta `docs/` do seu Docusaurus (por exemplo, `docs-site/docs/`). Cópias traduzidas são gravadas na árvore de conteúdo do plugin de cada localidade:

```text
docs-site/docs/getting-started.md
  →  docs-site/i18n/de/docusaurus-plugin-content-docs/current/getting-started.md
docs-site/docs/guide/quick-start.md
  →  docs-site/i18n/fr/docusaurus-plugin-content-docs/current/guide/quick-start.md
```

Configure um bloco `docs[]`:

```json
{
  "contentPaths": ["docs-site/docs/"],
  "outputDir": "docs-site/i18n",
  "docusaurusCatalogDir": "docs-site/i18n/en",
  "addFrontmatter": true,
  "docsOutput": {
    "style": "docusaurus",
    "docsRoot": "docs-site/docs"
  }
}
```

Aponte `contentPaths` para seus arquivos e diretórios `.md` / `.mdx` em inglês. Defina `docsRoot` para a mesma pasta que o Docusaurus usa como sua raiz de conteúdo. Defina `outputDir` para o pai de cada pasta de localidade em `i18n/`.

Conecte a [internacionalização](https://docusaurus.io/docs/i18n/introduction) do Docusaurus: mantenha `targetLocales` em `ai-i18n-tools.config.json` alinhado com o array `locales` em `docusaurus.config.js`. Cada `localeConfigs[locale].path` deve corresponder ao nome da pasta em `i18n/` (por exemplo, `path: "fr"` para `i18n/fr/`).

<a id="shell-strings-write-translations"></a>
## Strings Shell (write-translations)

A barra de navegação, rodapé, placeholder de pesquisa e outros rótulos de tema/plugin do Docusaurus não são extraídos do markdown. Execute `docusaurus write-translations` em seu projeto Docusaurus para gerar catálogos JSON na pasta de localidade padrão (geralmente `i18n/en/`). Em seguida, aponte `docs[].docusaurusCatalogDir` para essa pasta:

```json
{
  "features": {
    "translateDocs": true
  },
  "docs": [
    {
      "description": "Docusaurus pages + shell JSON",
      "contentPaths": ["docs-site/docs/"],
      "outputDir": "docs-site/i18n",
      "docusaurusCatalogDir": "docs-site/i18n/en",
      "docsOutput": {
        "style": "docusaurus",
        "docsRoot": "docs-site/docs"
      }
    }
  ]
}
```

Quando `docusaurusCatalogDir` é definido e `features.translateDocs` está habilitado, `translate-docs` traduz ambos:

- **Páginas de documentação** — markdown/MDX de `contentPaths` para `i18n/<locale>/docusaurus-plugin-content-docs/current/`
- **JSON Shell** — catálogos de barra de navegação, rodapé e tema/plugin de `i18n/en/` para pastas de localidade irmãs

Não coloque o JSON shell do Docusaurus em `json[]`; use `docs[].docusaurusCatalogDir` com Documentos em vez disso.

<a id="framework-shell-translation"></a>
## Tradução do shell do framework

| Framework | Strings Shell / tema | Pipeline |
|-----------|----------------------|----------|
| Docusaurus | Catálogo `write-translations` (`{ message, description }`) | Documentos — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | Catálogo de tema/navegação/barra lateral | Documentos — `docsOutput.vitepressThemeCatalog` + `translate-docs` |
| Nextra | Rótulos da barra lateral `_meta.ts` | Documentos — automático quando `style: "nextra"` + `translate-docs` |
| Nextra | Dicionário de tema `.ts` | Documentos — `docs[].nextraDictionaryPath` + `translate-docs` |
| Astro Starlight | Strings de UI integradas (muitos idiomas); sem pipeline de shell adicional | Documentos — `translate-docs` (somente páginas) |

**Não** coloque strings de shell/tema do framework em `json[]` — esse pipeline é para pacotes de localização de aplicativos não relacionados. Consulte [integração VitePress](/guide/vitepress-integration) e [integração Nextra](/guide/nextra-integration) para os padrões VitePress/Nextra.

<a id="example-project"></a>
## Projeto de exemplo

[examples/nextjs-app/docs-site](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/docs-site) — Fontes em inglês em `docs/`, traduções commitadas em `i18n/<locale>/docusaurus-plugin-content-docs/current/`, mais JSON shell traduzido. Execute `pnpm start` na porta 3040 para desenvolvimento; use `pnpm run start:fr` (e similar) para pré-visualizar uma única localidade no modo de desenvolvimento.
