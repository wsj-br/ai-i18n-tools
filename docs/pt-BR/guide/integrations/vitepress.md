<a id="vitepress-integration"></a>
# Integração com VitePress

Use `init -t ui-vitepress` e `docsOutput.style: "vitepress"` para sites de documentação [VitePress](https://vitepress.dev/). O preset é um alias para `doc-system` com um `localeSubpath` vazio e nomes de pastas de localidade BCP-47 preservados (`localePathLowercase` assume o padrão `false`, então as pastas permanecem `pt-BR`, `zh-Hans`, etc.).

Consulte também [Documentos](/pt-BR/guide/documents/) e a demonstração executável [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/). O próprio site de documentação deste repositório em `docs/` é uma referência completa de VitePress + ai-i18n-tools (nove localidades, catálogo de temas, GitHub Pages).

<a id="quick-start"></a>
## Início rápido

```bash
ai-i18n-tools init -t ui-vitepress -P anthropic
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

Aponte `contentPaths` para os arquivos e diretórios `.md` escritos em `sourceLocale`. Esse idioma pode ser qualquer um. Defina `docsRoot` como a mesma pasta que o VitePress usa como sua raiz de conteúdo.

Configure a [internacionalização](https://vitepress.dev/guide/i18n) do VitePress: a localidade de origem em `root`, cada localidade de destino em `locales[code].link` (por exemplo, `/pt-BR/`). Mantenha `targetLocales` em `ai-i18n-tools.config.json` alinhado com as chaves `locales` em `.vitepress/config.mts`.

<a id="enable-i18n-in-an-existing-site"></a>
### Habilitar i18n em um site existente

Uma configuração do VitePress somente em inglês precisa destes itens antes que as páginas traduzidas apareçam. O [prompt do agente](#wire-configmts-to-generated-theme-json-one-off) cobre a metade do catálogo de temas.

- `locales.root` para inglês (`label`, `lang` e `themeConfig`).
- Uma entrada `locales[code]` por localidade de destino: `label`, `lang`, `link: '/${code}/'` e `title` / `description` por localidade.
- Links `themeConfig` e `activeMatch` com prefixo por localidade com `prefixVitepressThemeConfigLinks` (consulte [Links de navegação/barra lateral do tema](#theme-navsidebar-links)).
- `targetLocales` alinhado com essas chaves `locales` e, em seguida, `sync` para que `docs/<locale>/` e `theme.<locale>.json` existam.

<a id="theme-strings"></a>
## Strings do tema

Os rótulos de navegação, barra lateral, rodapé, placeholder de pesquisa e outros `themeConfig` do VitePress não são extraídos do markdown. Configure **`docsOutput.vitepressThemeCatalog`** para que **`translate-docs`** inicialize o catálogo da localidade de origem de `.vitepress/config.mts` (quando as strings são inline) e traduza os arquivos JSON do tema da localidade:

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

- **`catalogPath`** — JSON aninhado em inglês. A inicialização de `config.mts` se aplica somente enquanto essas strings em inglês ainda estiverem inline na configuração. Depois que `themeConfigFor` lê o catálogo, `mergeThemeCatalogs` mantém o arquivo existente, e `theme.en.json` é a fonte da verdade. Edite esse arquivo quando o texto mudar (ou coloque o inglês de volta em `config.mts` para um `sync`). Renomear uma chave altera o hash do segmento (`path`, um byte NUL e, em seguida, o valor), então o próximo `sync` retraduz essa string uma vez para cada localidade de destino.
- **`outputPathTemplate`** (opcional) — saídas por localidade; padrão: mesmo diretório que `catalogPath` com `theme.{locale}.json`.

`init -t ui-vitepress` também estrutura `docs/.vitepress/config.mts` e `docs/.vitepress/i18n/theme.en.json` iniciais quando esses arquivos ainda não existem. A configuração carrega o catálogo via `loadTheme()` e conecta os rótulos de i18n padrão do VitePress (incluindo `langMenuLabel`) em `themeConfigFor()`.

Carregue o arquivo por localidade em `.vitepress/config.mts` via `loadTheme()` e construa `locales[code].themeConfig` a partir do JSON traduzido. Veja [examples/vitepress-docs/docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts).

**Strings do menu de idiomas:** `locales[code].label` é o nome visível de cada idioma no menu suspenso (por exemplo, `Português (Brasil)`). `themeConfig.langMenuLabel` é o **aria-label** no botão seletor de idioma. O VitePress usa `Change language` quando a opção é omitida. O catálogo de exemplo armazena `Language`, e tanto `theme.en.json` quanto `config.hardcoded.example.mts` usam essa mesma frase. Coloque `langMenuLabel` no catálogo de temas e configure `langMenuLabel: t.langMenuLabel` dentro de `themeConfigFor()` — não o confunda com as strings `label` por localidade.

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

<details class="agent-prompt">
<summary>Prompt do catálogo de temas</summary>

````markdown
# Load VitePress theme strings from the catalog

## Context

ai-i18n-tools translates VitePress chrome through
`docsOutput.vitepressThemeCatalog`. `extractVitepressThemeCatalog` writes
positional keys while English is still inline in `config.mts`
(`themeConfig.nav.0.text`, `themeConfig.sidebar.0.items.0.text`,
`locales.root.label`). The runnable example uses stable names instead
(`nav.guide`, `sidebar.gettingStarted`, `site.title`):
https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts

Reshape to named keys once and keep those names. Renaming changes the segment
hash, so the next `sync` re-translates the theme catalog for every locale (a few
dozen short strings, once). After the refactor, `config.mts` has no inline
display literals, `mergeThemeCatalogs` keeps `theme.en.json`, and that file is
the source of truth. Do not tell the user to refresh the catalog from
`config.mts` after this edit.

`translate-docs` does not rewrite links in `config.mts`. Locale pages must
prefix `link` and `activeMatch` or they point at English routes.

## Scope

Edit `.vitepress/config.mts` and `theme.en.json` only. Skip markdown bodies,
route paths, `base`, search provider choice, collapsed flags, and external URLs.

## Call shape

Precondition: `docsOutput.vitepressThemeCatalog` is set and `sync` has already
written `catalogPath`. If `theme.en.json` is missing, stop and ask for that
`sync` first.

1. Add `ai-i18n-tools` as a devDependency. Import
   `prefixVitepressThemeConfigLinks` from `ai-i18n-tools`.
2. Add `loadTheme(localeFile)` that reads `docs/.vitepress/i18n/` via
   `import.meta.url` and `fileURLToPath`. If a locale file is missing
   (`fs.existsSync`), fall back to the English theme so a fresh checkout does
   not crash before the first translation.
3. Rename positional keys in `theme.en.json` to short stable names. Update
   `themeConfigFor` to read those names. Keep links and structure in TypeScript.
   Only display strings come from the catalog.
4. If you keep positional keys instead, read them with string indexes:
   `t.themeConfig.nav["0"].text`. A numeric index `nav[0]` is invisible to the
   unused-key check and warns for every nav and sidebar entry.
5. Wrap the object `themeConfigFor` returns with
   `prefixVitepressThemeConfigLinks(themeConfig, localeRoutePrefix)`. Pass
   `/${code}` for each target locale and `null` for root. That prefixes `link`
   and `activeMatch`.
6. Per locale entry: `label` (native language name), `lang`,
   `link: '/${code}/'`, and that locale's `title` and `description` from the
   catalog.
7. Keys the extractor does not collect must be added to `theme.en.json` by hand,
   then referenced from `themeConfigFor`. That includes local-search copy under
   `search.options.locales.<code>.translations` (`button.buttonText`,
   `modal.noResultsText`, and the rest of that tree). Current VitePress docs do
   not use `options.placeholder` for local search. Also add
   `socialLinks[].ariaLabel`. A `notFound.title` inline in config is collected
   because `title` is a known key; `notFound.quote`, `notFound.linkText`,
   `notFound.linkLabel`, and `notFound.code` are not.

## Order

1. Confirm the catalog file exists.
2. Reshape keys, wire `loadTheme` and `themeConfigFor`, prefix links.
3. Ask the user to run `sync` so locale theme files are regenerated from the new
   key names. Do not hand-translate them.

## Do not

- Do not translate strings yourself.
- Do not leave a second copy of the same label in `config.mts` and in
  `theme.en.json`.
- Do not hand-edit `theme.<locale>.json`.
- Do not change markdown paths, `base`, or the path of internal links (only the
  locale prefix).

## Verify

- `pnpm docs:dev`: English and one target locale show translated nav, sidebar,
  footer, and search chrome.
- A locale page's nav `link` and `activeMatch` include the locale prefix
  (`/pt-BR/guide/`, not `/guide/`).
- `pnpm docs:build` passes.
- Removing a locale theme file still builds, because `loadTheme` falls back to
  English.

## Report back

List files changed, the old path key and the new name for each rename, any
string you added by hand because the extractor skips it, and anything you left
inline on purpose.
````

</details>

<a id="example-project"></a>
## Projeto de exemplo

[examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) — Fontes em inglês em `docs/`, `pt-BR` e `zh-Hans` árvores de páginas commitadas, mais `theme.pt-BR.json` / `theme.zh-Hans.json`. Execute `pnpm run docs:dev` na porta 3060.

<a id="readme-and-the-docs-homepage"></a>
## README e a página inicial da documentação

Projetos downstream às vezes copiam `README.md` para o site VitePress como `docs/index.md` (via um script de build ou sincronização manual). Esse padrão compartilha um arquivo entre o GitHub e o site de documentação, mas as regras de link diferem:

| Tipo de link | Funciona no GitHub | Funciona no VitePress |
|-----------|-----------------|-------------------|
| `docs/guide/foo.md` | Sim | Não — use rotas do site ou deixe o normalizador reescrever durante a sincronização |
| `./LICENSE`, `examples/demo/` | Sim (relativo ao repositório) | Não — use **URLs completas** |
| `/guide/foo` | Não | Sim |

**Recomendação para README sincronizado → índice:** Em `README.md`, use **URLs completas** para qualquer coisa fora da árvore de conteúdo do VitePress (`LICENSE`, `examples/`, arquivos de configuração, arquivos de contexto do agente) e para cópias traduzidas do README em `translated-docs/`. Use caminhos `docs/guide/…` (ou rotas do site na documentação em inglês em `docs/`) para links de documentação internos ao site; um script de sincronização ou normalizador `rewriteVitepressLinks` pode converter esses para rotas `/guide/…`.

**Este repositório** mantém `README.md` e `docs/index.md` como **arquivos independentes**: README é uma página de destino concisa do GitHub/npm; `docs/index.md` é o ponto de entrada do site de documentação que se vincula a `/guide/` e `/reference/`. Guias detalhados ficam em `docs/` — não duplique material de referência longo no README. Atualize cada um de acordo com seu público quando os fatos compartilhados mudarem.

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

| Autor na localidade de origem | Após o normalizador (saída raiz da localidade de origem) | Após o normalizador (saída `docs/<locale>/` traduzida) |
|--------------------------|----------------------------------------|------------------------------------------------------|
| `[JSON](/pt-BR/guide/json)` | `[JSON](/pt-BR/guide/json)` | `[JSON](/pt-BR/guide/json)` (o prefixo da localidade corresponde à pasta) |
| `[Quick start](/pt-BR/guide/quick-start)` no corpo ou `hero.actions[].link` | inalterado (`/guide/quick-start`) | `/pt-BR/guide/quick-start` |
| `[Home](./README.md)` no índice de localidade | `/` | `/pt-BR/` |
| `hero.image.src: /ai-i18n-tools_logo.svg` | inalterado | inalterado (ativo `docs/public/` compartilhado) |
| `[Demo](https://github.com/org/repo/tree/main/examples/console-app/)` | inalterado (URL completa) | inalterado (URL completa) |

Os arquivos da localidade de origem em `docs/` mantêm rotas de site **neutras de localidade** (`/guide/…`). Este exemplo usa inglês como `sourceLocale`. Qualquer idioma é válido. Os arquivos gravados em `docs/<locale>/…` recebem o prefixo da localidade nas rotas de conteúdo internas automaticamente — incluindo o **frontmatter do layout da página inicial** (`hero.actions[].link`, `features[].link`, `prev`/`next`). Ativos públicos compartilhados, como `/ai-i18n-tools_logo.svg` e `/translation-dashboard.png`, permanecem sem prefixo em todas as localidades.

<a id="theme-navsidebar-links"></a>
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

Adicione `ai-i18n-tools` como uma **devDependency** no projeto VitePress (consulte `examples/vitepress-docs/package.json`) para que `config.mts` possa importar `prefixVitepressThemeConfigLinks`. O site de documentação principal do ai-i18n-tools importa diretamente de `src/processors/…` porque ele usa o checkout do monorepo; cópias autônomas (degit) devem usar o pacote npm.

**Regras de autoria**

- Links de documentação entre páginas: use **rotas do site** (`/guide/…`, `/reference/…`) no markdown em inglês em `docs/`, ou caminhos `docs/guide/…` ao escrever um README que será sincronizado em `docs/index.md` em outro projeto.
- Demonstrações executáveis, `LICENSE` e outros arquivos do repositório: use **URLs completas do GitHub** em `README.md` e na documentação (consulte o [README e a página inicial da documentação](#readme-and-the-docs-homepage)).
- **Não** edite manualmente os links em `docs/<locale>/` — regenere com `sync` / `translate-docs`.

Consulte também [Reescrita de links](/pt-BR/guide/images-and-screenshots/link-rewriting) (flat vs VitePress) e [Configuração — `docsOutput`](/pt-BR/reference/configuration#docsoutput).
