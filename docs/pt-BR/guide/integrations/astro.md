<a id="astro-integration"></a>
# Integração Astro

Use ai-i18n-tools com [Astro](https://astro.build/) em duas configurações comuns: sites de documentação **Astro Starlight** e sites de marketing ou aplicativos **Astro simples**. Ambos usam Documentos (`translate-docs`) para o conteúdo da página; sites Astro simples geralmente combinam isso com strings de UI (`extract` / `translate-ui`) para strings `t()` em frontmatter e dados compartilhados.

Consulte também [strings da UI](/pt-BR/guide/ui-strings/astro-website), [Documentos](/pt-BR/guide/documents/) e os exemplos executáveis abaixo.

<a id="astro-starlight"></a>
## Astro Starlight

Use `init -t ui-starlight` e `docsOutput.style: "astro-starlight"` para sites de documentação do [Astro Starlight](https://starlight.astro.build/). A predefinição é um alias para `doc-system` com um `localeSubpath` vazio — as páginas traduzidas ficam em `src/content/docs/<locale>/` ao lado da árvore de localidade de origem. `sourceLocale` pode ser qualquer idioma.

<a id="quick-start"></a>
### Início rápido

```bash
ai-i18n-tools init -t ui-starlight -P cheaperinference
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

Aponte `contentPaths` para os arquivos e diretórios `.md` / `.mdx` escritos em `sourceLocale`. Esse pode ser qualquer idioma. Defina `docsRoot` para a mesma pasta que o Starlight usa como sua raiz de conteúdo.

As substituições da UI do Starlight podem usar `src/content/i18n/en.json` com `jsonPathTemplate` em um bloco `docs[]` separado quando necessário — consulte [Documentos — inicializar para documentação](/pt-BR/guide/documents/#step-1-initialise-for-documentation).

O Starlight fornece strings de UI integradas para muitos idiomas (rótulos de navegação, placeholder de pesquisa, sumário e assim por diante). Não há um pipeline separado de shell/tema para configurar — use `translate-docs` apenas para o conteúdo da página. Para outros frameworks, consulte [Tradução do shell do Framework](/pt-BR/guide/integrations/#framework-shell-translation).

`label`s explícitos da barra lateral, o `title` do site e `social[].label` em `astro.config.mjs` são literais em inglês que esta ferramenta não traduz. Prefira entradas `slug` para que o rótulo venha do frontmatter traduzido da página (`title`). Um grupo ou um link externo que precisa de seu próprio texto usa o mapa `translations` por localidade do Starlight (`label` para a localidade padrão, `translations['pt-BR']` para as outras). `social[].label` não tem um campo de traduções no esquema atual do Starlight; ele permanece como está escrito. Consulte a [barra lateral do Starlight](https://starlight.astro.build/guides/sidebar/#internationalization) e [examples/astro-docs/astro.config.mjs](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/astro-docs/astro.config.mjs), que usa entradas `slug`.

<a id="enable-i18n-in-an-existing-site"></a>
### Habilitar i18n em um site existente

A configuração inicial utiliza o prompt em [Adicionar i18n a um site ou site de documentação](/pt-BR/guide/add-i18n-to-website#run-the-agent-prompt). A lista de verificação abaixo é o mesmo trabalho feito manualmente.

- `locales` na configuração do Starlight, incluindo uma entrada `root` quando o inglês não deve ter prefixo (`label` e o `lang` obrigatório).
- `defaultLocale: 'root'` quando o idioma padrão é essa localidade raiz. Omita `defaultLocale` somente se o padrão do Starlight já corresponder.
- As páginas em inglês permanecem em `src/content/docs/`; `translate-docs` grava em `src/content/docs/<locale>/`.
- `targetLocales` alinhado com as chaves de localidade não raiz (atenção às maiúsculas e minúsculas: as chaves de diretório do Starlight geralmente são minúsculas, como `pt-br`).

<a id="example-project"></a>
### Projeto de exemplo

[examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) — fontes em inglês em `src/content/docs/`, traduções commitadas em `src/content/docs/<locale>/`, localidade RTL (`ar`) e tradução orientada por glossário. Execute `pnpm dev` na porta 3050.

<a id="plain-astro-marketing-and-app-sites"></a>
## Astro simples (sites de marketing e aplicativos)

Para sites estáticos de marketing ou aplicativos Astro (não Starlight), combine [Roteamento i18n integrado do Astro](https://docs.astro.build/en/guides/internationalization/) com ai-i18n-tools. A configuração inicial utiliza o prompt em [Adicionar i18n a um site ou site de documentação](/pt-BR/guide/add-i18n-to-website#run-the-agent-prompt). A implementação de referência é [examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website): Inglês em `/`, locales de destino em `/{locale}/`.

A maioria das equipes usa um **híbrido** de dois pipelines na mesma página:

| Pipeline | Uso para | Comandos | Saída |
|----------|---------|----------|--------|
| **HTML da página** | Cabeçalhos, parágrafos, rótulos de navegação, arrays embutidos no corpo do template | `translate-docs` | `src/pages/{locale}/index.astro` por localidade |
| **Strings da UI (`t()`)** | Dados do frontmatter, rótulos de abas, arrays compartilhados | `extract` → `translate-ui` | `public/locales/{locale}.json` (string do idioma de origem como chave) |

<a id="quick-start-1"></a>
### Início rápido

```bash
ai-i18n-tools init -t ui-astro-website -P ollama
# enable features.translateDocs and add a docs[] block for page HTML (see below)
pnpm run i18n:sync
pnpm dev
```

Estruture a extração da UI com `init -t ui-astro-website -P ollama`, depois mescle em um bloco `docs[]` quando você também traduzir o HTML da página:

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

Resolva `t('…')` em **tempo de compilação** procurando o literal do idioma de origem como a chave — consulte `examples/astro-website/src/i18n/t.ts`. `sourceLocale` pode ser qualquer idioma. O exemplo usa inglês. Você não precisa de `ai-i18n-tools/runtime` ou i18next para um site estático, a menos que você adicione ilhas de cliente que trocam de idioma após o carregamento.

<a id="example-project-1"></a>
### Projeto de exemplo

[examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) — página de destino híbrida com HTML via `translate-docs` e rótulos de guia de captura de tela via `t()` + `translate-ui`.

<a id="example-projects"></a>
## Projetos de exemplo

| Projeto | Caso de uso | Porta |
|---------|----------|------|
| [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) | Documentação Starlight | 3050 |
| [examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) | Site de marketing Astro simples (HTML + híbrido `t()`) | (ver README) |

Compare [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) com [examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs) — conteúdo de tutorial semelhante, estilo de saída do Docusaurus em vez de Starlight.
