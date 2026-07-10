<a id="vitepress-integration"></a>
# Integração com VitePress

Use `init -t ui-vitepress` e `docsOutput.style: "vitepress"` para sites de documentação [VitePress](https://vitepress.dev/). O preset é um alias para `doc-system` com um `localeSubpath` vazio e nomes de pastas de localidade BCP-47 preservados (`localePathLowercase` assume o padrão `false`, então as pastas permanecem `pt-BR`, `zh-Hans`, etc.).

Consulte também [Documentos](/pt-BR/guide/documents/) e a demonstração executável [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/). O próprio site de documentação deste repositório em `docs/` é uma referência completa de VitePress + ai-i18n-tools (nove localidades, catálogo de temas, GitHub Pages).

<a id="quick-start"></a>
## Início rápido

```bash
npx ai-i18n-tools init -t ui-vitepress
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm run docs:build  # VitePress build (project-specific script)
```

Habilite `features.translateDocs` ao traduzir o conteúdo da página e as strings do "chrome" do VitePress em uma única execução de `sync`.

<a id="page-layout"></a>
## Layout da página

O markdown em inglês fica na raiz do conteúdo do VitePress (geralmente `docs/`). As cópias traduzidas são escritas ao lado da árvore de origem:

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
## Strings do tema

A navegação, barra lateral, rodapé, placeholder de pesquisa e outros rótulos `themeConfig` do VitePress não são extraídos do markdown. Configure **`docsOutput.vitepressThemeCatalog`** para que **`translate-docs`** inicialize o catálogo em inglês de `.vitepress/config.mts` (quando as strings estão embutidas) e traduza os arquivos JSON do tema da localidade:

```json
{
  "features": {
    "translateDocs": true
  },
  "docs": [
    {
      "contentPaths": ["docs/index.md", "docs/guide"],
      "outputDir": "docs",
      "docsOutput": {
        "style": "vitepress",
        "docsRoot": "docs",
        "vitepressThemeCatalog": {
          "configPath": "docs/.vitepress/config.mts",
          "catalogPath": "docs/.vitepress/i18n/theme.en.json"
        }
      }
    }
  ]
}
```

- **`catalogPath`** — JSON aninhado em inglês gerado (saída de inicialização). Os autores não mantêm este arquivo manualmente quando o inglês está em `config.mts`; execute novamente `sync` para atualizá-lo.
- **`outputPathTemplate`** (opcional) — saídas por localidade; padrão: mesmo diretório que `catalogPath` com `theme.{locale}.json`.

`init -t ui-vitepress` também estrutura `docs/.vitepress/config.mts` e `docs/.vitepress/i18n/theme.en.json` iniciais quando esses arquivos ainda não existem. A configuração carrega o catálogo via `loadTheme()` e conecta os rótulos de i18n padrão do VitePress (incluindo `langMenuLabel`) em `themeConfigFor()`.

Carregue o arquivo por localidade em `.vitepress/config.mts` via `loadTheme()` e construa `locales[code].themeConfig` a partir do JSON traduzido. Veja [examples/vitepress-docs/docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts).

**Strings do menu de idioma:** `locales[code].label` é o nome visível de cada idioma no menu suspenso (por exemplo, `Português (Brasil)`). `themeConfig.langMenuLabel` é o **aria-label** no botão de troca de idioma (padrão do VitePress: `Change language`). Coloque `langMenuLabel` no catálogo de temas e conecte `langMenuLabel: t.langMenuLabel` dentro de `themeConfigFor()` — não o confunda com strings `label` por localidade.

Durante `sync` / `translate-docs`, as ferramentas ai-i18n-tools avisam quando uma chave de catálogo em `theme.en.json` não é referenciada de `config.mts` (por exemplo, um `t.langMenuLabel` ausente em `themeConfigFor()`).

**Não** use `json[]` para strings de tema do VitePress — esse padrão é apenas para pacotes de localidade de aplicativos não relacionados.

<a id="wire-configmts-to-generated-theme-json-one-off"></a>
## Conectar config.mts ao JSON do tema gerado (uma única vez)

Após a primeira execução bem-sucedida de `i18n:sync` / `translate-docs` com `vitepressThemeCatalog`, o repositório gerou `theme.en.json` e `theme.{locale}.json`, mas um site **existente** ainda pode ter strings `text:` / `message:` codificadas em `config.mts`. O VitePress não usará o JSON traduzido até que a configuração o carregue via `loadTheme()`.

**Não está no escopo da ferramenta:** codemod automático. Use o prompt abaixo uma vez por projeto (ou refatore manualmente usando o exemplo de configuração).

1. **Quando** — após a primeira sincronização produzir `catalogPath` e arquivos de tema de localidade; antes de esperar navegação/barra lateral traduzidas em dev/build.
2. **Manter inalterado** — links de rota (`/guide/…`), chaves de localidade, estrutura `defineConfig`, opções não-string (provedor de pesquisa, sinalizadores recolhidos).
3. **Referência** — [examples/vitepress-docs/docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts) e o formato `theme.en.json` gerado.
4. **Verificar** — `pnpm docs:dev`, alternar localidade na navegação, confirmar tradução da barra lateral/rodapé/espaço reservado da pesquisa; `pnpm docs:build` passa.

**Exemplo de prompt de agente de IA** (copie para o Cursor ou outro agente de codificação):

```markdown
Refactor our VitePress config to load theme strings from generated JSON files instead of hardcoded literals.

Context:
- ai-i18n-tools already generated English and locale theme catalogs via `docsOutput.vitepressThemeCatalog`.
- English catalog: `docs/.vitepress/i18n/theme.en.json`
- Locale catalogs: `docs/.vitepress/i18n/theme.{locale}.json` (e.g. pt-BR, zh-Hans)
- Target file: `docs/.vitepress/config.mts` (or our project's equivalent path)
- Reference pattern: https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/docs/.vitepress/config.mts

Requirements:
1. Add `loadTheme(localeFile: string)` that reads JSON from `docs/.vitepress/i18n/` (use `import.meta.url` / `fileURLToPath` for ESM paths).
2. Add `themeConfigFor(t)` that builds VitePress `themeConfig` from the catalog — keep all **links and structure** in TypeScript; only **display strings** come from JSON keys matching `theme.en.json`.
3. Wire `locales.root` and each target locale in `locales[code]` to `loadTheme('theme.en.json')` or `loadTheme('theme.{code}.json')`, then `themeConfig: themeConfigFor(theme)`.
4. Align locale codes with `ai-i18n-tools.config.json` `targetLocales` and existing VitePress `locales` keys.
5. Do **not** change markdown content paths, `base`, or link targets — only move translatable labels out of inline string literals.
6. Preserve any project-specific options (ignoreDeadLinks, head config, etc.).

After editing:
- Run `pnpm docs:dev` (or our docs dev script) and confirm English + at least one translated locale show correct nav/sidebar/footer/search placeholder.
- If a string exists in config but not in `theme.en.json`, add a matching key to the JSON shape in `themeConfigFor` and note that the user should re-run `i18n:sync` to refresh catalogs from config if needed.

Do not introduce a hand-maintained duplicate of theme strings — config must read from the generated JSON files only.
```

<a id="framework-shell-translation"></a>
## Tradução do shell do framework

| Framework | Strings do shell / tema | Pipeline |
|-----------|----------------------|----------|
| Docusaurus | Catálogo `write-translations` (`{ message, description }`) | Documentos — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | Catálogo de tema/navegação/barra lateral | Documentos — `docsOutput.vitepressThemeCatalog` + `translate-docs` |
| Nextra | Rótulos da barra lateral `_meta.ts` | Documentos — automático quando `style: "nextra"` + `translate-docs` |
| Nextra | Dicionário de tema `.ts` | Documentos — `docs[].nextraDictionaryPath` + `translate-docs` |
| Fumadocs | Rótulos da barra lateral `meta.json` | Documentos — automático quando `style: "fumadocs"` + `translate-docs` |
| Fumadocs | Catálogo de substituições de UI | Documentos — `docsOutput.fumadocsUiCatalog` + `translate-docs` |
| Astro Starlight | Strings de UI integradas (muitas localidades); sem pipeline de shell adicional | Documentos — `translate-docs` (somente páginas) |

**Não** coloque strings do shell/tema do framework em `json[]` — esse pipeline é para pacotes de localidade de aplicativos não relacionados. Consulte [integração Docusaurus](/pt-BR/guide/integrations/docusaurus) e [integração Fumadocs](/pt-BR/guide/integrations/fumadocs) para os outros padrões de framework.

<a id="example-project"></a>
## Projeto de exemplo

[examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) — Fontes em inglês em `docs/`, `pt-BR` e `zh-Hans` árvores de páginas commitadas, mais `theme.pt-BR.json` / `theme.zh-Hans.json`. Execute `pnpm run docs:dev` na porta 3060.

<a id="readme-as-the-docs-homepage"></a>
## README e a página inicial da documentação

Projetos downstream às vezes copiam `README.md` para o site VitePress como `docs/index.md` (via um script de build ou sincronização manual). Esse padrão compartilha um arquivo entre o GitHub e o site de documentação, mas as regras de link diferem:

| Tipo de link | Funciona no GitHub | Funciona no VitePress |
|-----------|-----------------|-------------------|
| `docs/guide/foo.md` | Sim | Não — use rotas do site ou deixe o normalizador reescrever durante a sincronização |
| `./LICENSE`, `examples/demo/` | Sim (relativo ao repositório) | Não — use **URLs completas** |
| `/guide/foo` | Não | Sim |

**Recomendação para README sincronizado → índice:** Em `README.md`, use **URLs completas** para qualquer coisa fora da árvore de conteúdo do VitePress (`LICENSE`, `examples/`, arquivos de configuração, arquivos de contexto do agente) e para cópias traduzidas do README em `translated-docs/`. Use caminhos `docs/guide/…` (ou rotas do site na documentação em inglês em `docs/`) para links de documentação internos ao site; um script de sincronização ou normalizador `rewriteVitepressLinks` pode converter esses para rotas `/guide/…`.

**Este repositório** mantém `README.md` e `docs/index.md` como **arquivos independentes**: README é a página inicial completa do npm/GitHub; `docs/index.md` é um ponto de entrada simplificado do site de documentação que se conecta a `/guide/` e `/reference/`. Atualize cada um de acordo com seu público quando os fatos compartilhados mudarem.

Exemplos de links para um README sincronizado em outro projeto:

```markdown
[console-app demo](https://github.com/your-org/your-repo/tree/main/examples/console-app/)
[License](https://github.com/your-org/your-repo/blob/main/LICENSE)
[Quick start](/pt-BR/guide/quick-start)
```

<a id="link-conventions"></a>
## Convenções de link

O VitePress serve páginas em inglês a partir da raiz do conteúdo e cópias de localização a partir de `docs/<locale>/…`, mas **os links na página devem usar rotas do site** (`/guide/quick-start`, `/reference/configuration`) — não caminhos relativos ao repositório como `docs/guide/quick-start.md` ou `../guide/quick-start.md`. Esses caminhos estilo README funcionam no GitHub, mas quebram dentro do VitePress (404 no desenvolvimento e nas Páginas do GitHub).

Habilite o normalizador integrado para que `translate-docs` corrija os links em cada arquivo traduzido automaticamente:

```json
"docsOutput": {
  "style": "vitepress",
  "docsRoot": "docs",
  "rewriteVitepressLinks": true
}
```

`rewriteVitepressLinks` é ativado por padrão quando `style` é `"vitepress"`.

| Autor na fonte em inglês | Após normalizador (saída raiz em inglês) | Após normalizador (saída `docs/<locale>/` traduzida) |
|--------------------------|----------------------------------------|------------------------------------------------------|
| `[JSON](/pt-BR/guide/json)` | `[JSON](/pt-BR/guide/json)` | `[JSON](/pt-BR/guide/json)` (prefixo de localidade corresponde à pasta) |
| `[Quick start](/pt-BR/guide/quick-start)` no corpo ou `hero.actions[].link` | inalterado (`/guide/quick-start`) | `/pt-BR/guide/quick-start` |
| `[Home](./README.md)` no índice de localidade | `/` | `/pt-BR/` |
| `hero.image.src: /logo.svg` | inalterado | inalterado (ativo `docs/public/` compartilhado) |
| `[Demo](https://github.com/org/repo/tree/main/examples/console-app/)` | inalterado (URL completa) | inalterado (URL completa) |

As fontes raiz em inglês em `docs/` mantêm rotas de site **neutras em relação à localidade** (`/guide/…`). Os arquivos gravados em `docs/<locale>/…` recebem o prefixo de localidade nas rotas de conteúdo interno automaticamente — incluindo **frontmatter de layout inicial** (`hero.actions[].link`, `features[].link`, `prev`/`next`). Ativos públicos compartilhados, como `/logo.svg` e `/translation-dashboard.png`, permanecem sem prefixo em todas as localidades.

<a id="theme-nav-sidebar-links"></a>
### Links de navegação/barra lateral do tema

`translate-docs` **não** reescreve links em `.vitepress/config.mts`. Os valores `link` da barra de navegação e da barra lateral são criados uma vez em TypeScript e devem ser prefixados por localidade no momento da construção da configuração.

O VitePress [`themeConfig.i18nRouting`](https://vitepress.dev/reference/default-theme-config#i18nrouting) controla apenas o **seletor de localidade** (mapeando a página equivalente quando o usuário escolhe outro idioma). Ele **não** reescreve os hrefs estáticos `nav` / `sidebar` na página da localidade atual.

Use `prefixVitepressThemeConfigLinks` de `ai-i18n-tools` (as mesmas regras de prefixo da reescrita de links markdown):

```typescript
import { prefixVitepressThemeConfigLinks } from "ai-i18n-tools";

function themeConfigFor(t: ThemeCatalog, localeCode: string | null = null) {
  const localeRoutePrefix = localeCode ? `/${localeCode}` : null;
  return prefixVitepressThemeConfigLinks(
    {
      nav: [{ text: t.nav.guide, link: "/guide/getting-started", activeMatch: "/guide/" }],
      sidebar: [/* … locale-neutral /guide/… links … */],
      /* footer, search, etc. */
    },
    localeRoutePrefix
  );
}

// root English
themeConfig: themeConfigFor(enTheme)

// each target locale
themeConfig: themeConfigFor(theme, code)
```

Prefixe **`activeMatch`** junto com **`link`** para que o destaque da navegação funcione nas rotas de localidade (`/pt-BR/guide/` e não `/guide/`). URLs externas e ativos públicos compartilhados permanecem inalterados.

**Regras de autoria**

- Links de documentos entre páginas: use **rotas do site** (`/guide/…`, `/reference/…`) em markdown em inglês em `docs/`, ou caminhos `docs/guide/…` ao criar um README que será sincronizado em `docs/index.md` em outro projeto.
- Demos executáveis, `LICENSE` e outros arquivos de repositório: use **URLs completas do GitHub** em `README.md` e na documentação (consulte [README e a página inicial da documentação](#readme-as-the-docs-homepage)).
- **Não** edite links manualmente em `docs/<locale>/` — regenere com `sync` / `translate-docs`.

Consulte também [Reescrita de links](/pt-BR/guide/images-and-screenshots/link-rewriting) (flat vs VitePress) e [Configuração — `docsOutput`](/pt-BR/reference/configuration#docsoutput).
