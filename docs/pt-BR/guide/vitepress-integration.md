<a id="vitepress-integration"></a>
# Integração com VitePress

Use `init -t ui-vitepress` e `docsOutput.style: "vitepress"` para sites de documentação [VitePress](https://vitepress.dev/). O preset é um alias para `doc-system` com um `localeSubpath` vazio e nomes de pastas de localidade BCP-47 preservados (`localePathLowercase` assume o padrão `false`, então as pastas permanecem `pt-BR`, `zh-Hans`, etc.).

Consulte também [Documentos](/guide/documents/), [JSON](/guide/json) (strings de tema) e a demonstração executável [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/). O próprio site de documentação deste repositório em `docs/` é uma referência completa do VitePress + ai-i18n-tools (nove locais, JSON de tema, GitHub Pages).

<a id="quick-start"></a>
## Primeiros passos

```bash
npx ai-i18n-tools init -t ui-vitepress
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm run docs:build  # VitePress build (project-specific script)
```

Habilite `features.translateDocs` e `features.translateJson` ao traduzir o conteúdo da página e as strings do chrome do VitePress em uma única execução de `sync`.

<a id="page-layout"></a>
## Layout da página

O markdown em inglês fica na raiz do conteúdo do VitePress (geralmente `docs/`). Cópias traduzidas são gravadas ao lado da árvore de origem:

```text
docs/index.md           →  docs/de/index.md
docs/guide/quick-start.md  →  docs/de/guide/quick-start.md
```

Configure um bloco `docs[]`:

```json
{
  "contentPaths": ["docs/index.md", "docs/guide"],
  "outputDir": "docs",
  "docsOutput": {
    "style": "vitepress",
    "docsRoot": "docs",
    "rewriteVitepressLinks": true
  }
}
```

Aponte `contentPaths` para seus arquivos e diretórios `.md` em inglês. Defina `docsRoot` para a mesma pasta que o VitePress usa como sua raiz de conteúdo.

Conecte a [internacionalização](https://vitepress.dev/guide/i18n) do VitePress: inglês em `root`, cada localidade de destino em `locales[code].link` (por exemplo, `/pt-BR/`). Mantenha `targetLocales` em `ai-i18n-tools.config.json` alinhado com as chaves `locales` em `.vitepress/config.mts`.

<a id="theme-strings"></a>
## Strings de tema

Os rótulos de navegação, barra lateral, rodapé, placeholder de pesquisa e outros `themeConfig` do VitePress não são extraídos do markdown. Crie um catálogo JSON aninhado (por exemplo `docs/.vitepress/i18n/theme.en.json`) e traduza-o com JSON:

```json
{
  "features": {
    "translateJson": true
  },
  "json": [
    {
      "description": "VitePress theme/nav/sidebar strings",
      "contentPaths": "docs/.vitepress/i18n/theme.en.json",
      "outputPathTemplate": "docs/.vitepress/i18n/theme.{locale}.json"
    }
  ]
}
```

Carregue o arquivo por localidade em `.vitepress/config.mts` e construa `locales[code].themeConfig` a partir do JSON traduzido (texto de navegação, títulos de grupo da barra lateral, mensagem de rodapé e assim por diante). Não codifique rótulos traduzidos em `config.mts` — regenere-os com `sync` / `translate-json` quando o inglês mudar.

Este pacote carrega `theme.{locale}.json` em [docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/.vitepress/config.mts); compare com [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) para uma configuração mínima de dois locais.

<a id="docusaurus-vs-vitepress-shell-json"></a>
## Docusaurus vs. JSON shell do VitePress

| Framework | Strings Shell / tema | Pipeline |
|-----------|----------------------|----------|
| Docusaurus | Catálogo `write-translations` (`{ message, description }`) | Documentos — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | Catálogo JSON aninhado personalizado que você cria | JSON — `json[]` + `translate-json` (ou `sync` quando `translateJson` está ativado) |

Não coloque o JSON do tema VitePress em `docs[]`; use `json[]` em vez disso.

<a id="example-project"></a>
## Projeto de exemplo

[examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) — Fontes em inglês em `docs/`, árvores de páginas `pt-BR` e `zh-Hans` confirmadas, mais `theme.pt-BR.json` / `theme.zh-Hans.json`. Execute `pnpm run docs:dev` na porta 3060.

<a id="readme-as-homepage"></a>
## README como a página inicial da documentação

Alguns projetos copiam `README.md` para o site VitePress como `docs/index.md` (este repositório usa `scripts/sync-readme-to-docs.mjs` antes de `docs:build`). Esse padrão compartilha um arquivo entre o GitHub e o site de documentação, mas as regras de link diferem:

| Tipo de link | Funciona no GitHub | Funciona no VitePress |
|-----------|-----------------|-------------------|
| `docs/guide/foo.md` | Sim | Não — use rotas do site ou deixe o normalizador reescrever durante a sincronização |
| `./LICENSE`, `examples/demo/` | Sim (relativo ao repositório) | Não — use **URLs completas** |
| `/guide/foo` | Não | Sim |

**Recomendação:** Em `README.md`, use **URLs completas** para qualquer coisa fora da árvore de conteúdo do VitePress (`LICENSE`, `examples/`, arquivos de configuração, arquivos de contexto do agente) e para cópias traduzidas do README em `translated-docs/`. Use caminhos `docs/guide/…` (ou rotas do site na documentação em inglês em `docs/`) para links de documentação internos ao site; o script de sincronização e o normalizador `rewriteVitepressLinks` os convertem em rotas `/guide/…`.

Exemplo:

```markdown
[console-app demo](https://github.com/your-org/your-repo/tree/main/examples/console-app/)
[License](https://github.com/your-org/your-repo/blob/main/LICENSE)
[Quick start](/guide/quick-start)
```

<a id="link-conventions"></a>
## Convenções de link

O VitePress serve páginas em inglês a partir da raiz do conteúdo e cópias localizadas de `docs/<locale>/…`, mas **os links internos da página devem usar rotas do site** (`/guide/quick-start`, `/reference/configuration`) — não caminhos relativos ao repositório como `docs/guide/quick-start.md` ou `../guide/quick-start.md`. Esses caminhos estilo README funcionam no GitHub, mas quebram dentro do VitePress (404 no desenvolvimento e no GitHub Pages).

Habilite o normalizador integrado para que `translate-docs` corrija os links em cada arquivo traduzido automaticamente:

```json
"docsOutput": {
  "style": "vitepress",
  "docsRoot": "docs",
  "rewriteVitepressLinks": true
}
```

`rewriteVitepressLinks` é ativado por padrão quando `style` é `"vitepress"`.

| Autor na fonte em inglês | Após o normalizador |
|--------------------------|------------------|
| `[JSON](/guide/json)` | `[JSON](/guide/json)` |
| `[Home](./README.md)` no índice de localidade | `/` |
| `[Demo](https://github.com/org/repo/tree/main/examples/console-app/)` | inalterado (URL completa) |

**Regras de autoria**

- Links de documentos entre páginas: use **rotas do site** (`/guide/…`, `/reference/…`) em markdown em inglês em `docs/`, ou caminhos `docs/guide/…` ao sincronizar de `README.md`.
- Demonstrações executáveis, `LICENSE` e outros arquivos de repositório: use **URLs completas do GitHub** em `README.md` e na documentação (consulte [README como a página inicial da documentação](#readme-as-homepage)).
- **Não** edite links manualmente em `docs/<locale>/` — regenere com `sync` / `translate-docs`.

Veja também [Reescrita de links](/guide/images-and-screenshots/link-rewriting) (flat vs VitePress) e [Configuração — `docsOutput`](/reference/configuration#docsoutput).
