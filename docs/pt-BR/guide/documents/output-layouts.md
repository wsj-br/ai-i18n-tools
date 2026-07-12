<a id="output-layouts"></a>
# Layouts de saída

`docsOutput.style` controla onde os arquivos markdown traduzidos são gravados. Use os valores de string exatos abaixo em `docs[].docsOutput.style`. Aliases são layouts `doc-system` predefinidos (ou layout de sufixo de ponto Fumadocs), não mecanismos separados — o carregamento da configuração pode reescrever os valores de alias `style` para `"doc-system"` canônicos, preservando o preset original em `stylePreset`.

Defina `docs[].docsOutput.pathTemplate` (markdown/MDX) ou `jsonPathTemplate` (arquivos de rótulo JSON) para substituir qualquer layout integrado. Veja [placeholders pathTemplate](#pathtemplate--jsonpathtemplate-placeholders) abaixo.

<a id="layout-overview"></a>
## Visão geral do layout

| `docsOutput.style` | Mecanismo | Uso típico |
| --- | --- | --- |
| `"nested"` | A pasta de localidade espelha a árvore de origem completa | Padrão; saída i18n genérica em `{outputDir}/{locale}/` |
| `"flat"` | Sufixo de localidade no nome do arquivo (subdiretórios opcionais) | README, changelogs, docs na raiz do repositório, [trocador de idioma](/pt-BR/guide/documents/language-switcher) |
| `"doc-system"` | Pasta de localidade + `localeSubpath` opcional em `docsRoot` | Geradores de docs estáticos personalizados |
| `"docusaurus"` | Preset `doc-system` | Layout de plugin i18n do [Docusaurus](/pt-BR/guide/integrations/docusaurus) |
| `"astro-starlight"` | Preset `doc-system` (`localeSubpath: ""`) | [Astro Starlight](/pt-BR/guide/integrations/astro#astro-starlight), páginas de localidade Astro simples |
| `"vitepress"` | Preset `doc-system` (`localeSubpath: ""`) | Pastas de localidade do [VitePress](/pt-BR/guide/integrations/vitepress) ao lado do inglês |
| `"nextra"` | Preset `doc-system` (`localeSubpath: ""`) | Pastas de localidade do [Nextra](/pt-BR/guide/integrations/nextra) (`content/en/` → `content/{locale}/`) |
| `"fumadocs"` | Sufixo de ponto (padrão) ou `doc-system` quando `fumadocsParser: "dir"` | Layout de conteúdo de ponto ou diretório do [Fumadocs](/pt-BR/guide/integrations/fumadocs) |

<a id="nested-default"></a>
## `nested` (padrão)

`docsOutput.style = "nested"` (padrão quando omitido) — espelha a árvore de origem em `{outputDir}/{locale}/`.

```text
docs/guide.md  →  i18n/de/docs/guide.md
README.md      →  i18n/de/README.md
```

Caminhos fora de um `docsRoot` (quando definido) usam a mesma forma aninhada.

<a id="flat"></a>
## `flat`

`docsOutput.style = "flat"` — grava arquivos traduzidos em `outputDir` com um sufixo de localidade no nome do arquivo. Por padrão, apenas o nome base é mantido (`{outputDir}/{stem}.{locale}{extension}`), então `docs/guide.md` e `docs/other/guide.md` colidiriam a menos que você ative `flatPreserveRelativeDir`.

```text
README.md           →  translated-docs/README.de.md
docs/guide.md       →  translated-docs/guide.de.md   (default: basename only)
```

Links relativos entre páginas são reescritos automaticamente quando `docsOutput.style = "flat"` (a menos que `rewriteRelativeLinks: false` ou um `pathTemplate` personalizado seja definido). Veja [Links de âncora](/pt-BR/guide/documents/anchor-links) para tratamento de `#anchor` entre páginas.

<a id="flat-with-flatpreserverelativedir"></a>
### `flat` com `flatPreserveRelativeDir`

Defina `docsOutput.flatPreserveRelativeDir` como `true` para manter os subdiretórios de origem em `outputDir`. Use isso ao traduzir vários arquivos markdown que compartilham nomes base em pastas diferentes, ou quando as saídas planas devem espelhar uma árvore rasa (por exemplo, README na raiz do repositório mais `docs/*.md`).

```text
docs/guide.md       →  translated-docs/docs/guide.de.md
docs/sub/page.md    →  translated-docs/docs/sub/page.de.md
```

O reescritor de links planos usa o caminho de saída por arquivo ao calcular prefixos de profundidade para URLs de ativos — veja [Reescrita de links](/pt-BR/guide/images-and-screenshots/link-rewriting#per-file-depth-prefix-with-flatpreserverelativedir).

<a id="doc-system"></a>
## `doc-system`

`docsOutput.style = "doc-system"` — árvore de documentação com prefixo de localidade para sites de documentos estáticos. Os arquivos em `docsRoot` são gravados em:

```text
{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}
```

Caminhos fora de `docsRoot` retornam ao layout [aninhado](#nested) (`{outputDir}/{locale}/{relPath}`).

Defina `docs[].docsOutput.docsRoot` como sua raiz de origem em inglês (por exemplo, `"docs"`, `"src/content/docs"` ou `"content/en"`). Quando `docsOutput.style = "doc-system"`, você deve definir `localeSubpath` explicitamente (use um alias abaixo para predefinições). Use `localeSubpath: ""` quando as páginas traduzidas estiverem diretamente em `{outputDir}/{locale}/` (estilo Starlight).

O JSON shell do Docusaurus de `docusaurusCatalogDir` e outros artefatos JSON em predefinições do sistema de documentos seguem o mesmo layout de pasta que o markdown. Com `style: "flat"`, os arquivos de rótulo JSON ainda usam o formato aninhado, a menos que você defina `jsonPathTemplate`.

<a id="doc-system-aliases"></a>
## Aliases do sistema de documentos

**Aliases** (mesmo motor `doc-system`, predefinição `localeSubpath` e padrões):

- `docsOutput.style = "docusaurus"` — `localeSubpath` assume como padrão `docusaurus-plugin-content-docs/current` (layout do plugin i18n do Docusaurus).
- `docsOutput.style = "astro-starlight"` — `localeSubpath` assume como padrão `""`; `localePathLowercase` assume como padrão `true`. Páginas traduzidas em `{outputDir}/{locale}/`, correspondendo a [Starlight](https://starlight.astro.build/guides/i18n/) quando o inglês está na raiz do conteúdo e `outputDir` é igual a `docsRoot`. Também usado para páginas de localidade Astro simples (`src/pages/index.astro` → `src/pages/{locale}/index.astro`) — veja [páginas do site Astro](/pt-BR/guide/ui-strings/astro-website#pages-parse-and-replace).
- `docsOutput.style = "vitepress"` — mesmo layout que `doc-system` com `localeSubpath` vazio; os nomes das pastas de localidade BCP-47 são preservados (`localePathLowercase` assume como padrão `false`). Veja [integração VitePress](/pt-BR/guide/integrations/vitepress).
- `docsOutput.style = "nextra"` — mesmo layout que `doc-system` com `localeSubpath` vazio; a fonte em inglês fica em uma pasta de localidade (por exemplo, `content/en/`). Veja [integração Nextra](/pt-BR/guide/integrations/nextra).

Predefinição Docusaurus (páginas principais de documentação):

```text
docs/guide.md  →  i18n/de/docusaurus-plugin-content-docs/current/guide.md
```

Predefinição Starlight (mesma estrutura de bloco, caminhos diferentes):

```text
src/content/docs/guide.md  →  src/content/docs/de/guide.md
```

Predefinição VitePress (inglês na raiz do conteúdo, pastas de localidade ao lado da fonte):

```text
docs/guide/quick-start.md  →  docs/de/guide/quick-start.md
```

Predefinição Nextra (inglês em uma pasta de localidade, pastas de localidade irmãs para destinos):

```text
content/en/guide/getting-started.mdx  →  content/pt-BR/guide/getting-started.mdx
```

Rótulos JSON opcionais — strings do shell Docusaurus de `docusaurusCatalogDir` (não o corpo do MDX):

```text
i18n/en/sidebar.json  →  i18n/de/sidebar.json
```

O Starlight fornece strings de interface em vários idiomas; substituições personalizadas opcionais usam `src/content/i18n/en.json` com `jsonPathTemplate: "{outputDir}/{locale}.json"` em um bloco `docs[]` separado quando necessário.

As strings de navegação/barra lateral/rodapé do VitePress não estão em markdown — configure `docsOutput.vitepressThemeCatalog` e traduza dentro de **`translate-docs`**. Consulte [integração com VitePress](/pt-BR/guide/integrations/vitepress).

O dicionário de tema Nextra (`.ts`) e os rótulos da barra lateral `_meta.ts` não estão em markdown — use `docs[].nextraDictionaryPath` e a coleta automática de `_meta` quando `style: "nextra"`, tudo dentro de **`translate-docs`**. Consulte [integração com Nextra](/pt-BR/guide/integrations/nextra).

<a id="fumadocs"></a>
## `fumadocs`

`docsOutput.style = "fumadocs"` — Layout de conteúdo Fumadocs via `docsOutput.fumadocsParser`:

- **`"dot"` (padrão)** — sufixo de localidade no nome do arquivo ao lado das fontes em inglês em `outputDir` (não é uma pasta de localidade). Isso é separado do formato de caminho `doc-system`.

```text
content/docs/guide/getting-started.mdx  →  content/docs/guide/getting-started.pt.mdx
```

- **`"dir"`** — pastas de localidade estilo Nextra; usa o mesmo motor `doc-system` com `localeSubpath` vazio.

```text
content/docs/en/guide/getting-started.mdx  →  content/docs/pt-BR/guide/getting-started.mdx
```

As substituições da interface do usuário do Fumadocs (`lib/layout.shared.ts`) e os rótulos da barra lateral `meta.json` não estão em markdown — use `docsOutput.fumadocsUiCatalog` e a coleta automática de `meta.json` quando `style: "fumadocs"`, tudo dentro de **`translate-docs`**. Consulte [integração com Fumadocs](/pt-BR/guide/integrations/fumadocs).

Para reescrita de URL de link e ativo além das correções de link relativo integradas, consulte [Reescrita de link](/pt-BR/guide/documents/link-rewriting) (`docsOutput.postProcessing.regexAdjustments`).

Para capturas de tela e ativos rasterizados em páginas traduzidas, consulte [Imagens e Capturas de Tela](/pt-BR/guide/images-and-screenshots/).

<a id="pathtemplate--jsonpathtemplate-placeholders"></a>
## Espaços reservados `pathTemplate` / `jsonPathTemplate`

Substitua onde os arquivos traduzidos são gravados definindo `docs[].docsOutput.pathTemplate` (markdown e MDX) ou `jsonPathTemplate` (arquivos de rótulo JSON). Ambos aceitam os mesmos espaços reservados. Os caminhos resolvidos devem permanecer dentro do `outputDir` desse bloco (a CLI rejeita caminhos que escapam dele).

Se você usar um `pathTemplate` personalizado, `rewriteRelativeLinks` assume como padrão `false` a menos que você o defina explicitamente — a reescrita de links relativos é feita para `docsOutput.style = "flat"` sem um modelo personalizado.

Para layouts integrados (`nested`, `flat`, `doc-system` sem um modelo personalizado), defina `docsOutput.localePathLowercase` como `true` para gravar segmentos de pasta ou nome de arquivo de localidade em minúsculas (por exemplo, `pt-br` em vez de `pt-BR`). O alias `astro-starlight` e `doc-system` com `localeSubpath` vazio definem isso como `true` no carregamento da configuração. Os valores personalizados `pathTemplate` / `jsonPathTemplate` permanecem inalterados — use `{llocale}` lá quando precisar de segmentos em minúsculas, mantendo `{locale}` como BCP-47.

| Espaço reservado       | Função                                                                                                     | Exemplo                                                          |
|------------------------|------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| `{outputDir}`          | Caminho absoluto resolvido do `outputDir` deste bloco de documentação                                      | `/home/acme/repo/i18n`                                           |
| `{locale}` | Código da localidade de destino (mesmo formato usado na configuração / CLI) | `de`, `pt-BR` |
| `{LOCALE}` | Mesma localidade em maiúsculas | `DE`, `PT-BR` |
| `{llocale}`            | Mesmo idioma em letras minúsculas (corresponde às pastas de rotas Astro como `pt-br`, `zh-cn`)                               | `de`, `pt-br`                                                    |
| `{relPath}` | Caminho do arquivo de origem relativo à raiz do projeto, formato POSIX `/` | `docs/guide.md`, `README.md` |
| `{stem}` | Nome do arquivo **sem** extensão | `guide` para `docs/guide.md` |
| `{basename}` | Nome do arquivo **com** extensão | `guide.md` |
| `{extension}` | Extensão **incluindo** o ponto | `.md`, `.mdx` |
| `{docsRoot}`           | Caminho absoluto resolvido de `docsOutput.docsRoot` (padrão `docs` se omitido)                            | `/home/acme/repo/docs`                                           |
| `{relativeToDocsRoot}` | `{relPath}` com prefixo `docsRoot` correspondente removido quando os caminhos coincidem (POSIX); caso contrário, inalterado | `docs/guide.md` (comum); `guide.md` somente quando a remoção é aplicada |

**Exemplo**

Trecho de configuração:

```json
{
  "outputDir": "i18n",
  "docsOutput": {
    "pathTemplate": "{outputDir}/{locale}/{relPath}"
  }
}
```

Para a localidade `de` e origem `docs/guide.md`, com raiz do projeto `/home/acme/repo` e `outputDir` resolvido para `/home/acme/repo/i18n`, o caminho expandido é:

```text
/home/acme/repo/i18n/de/docs/guide.md
```

Com `docsOutput.style = "flat"` e sem `pathTemplate` personalizado, um padrão comum mantém apenas o nome do arquivo via `{stem}` e `{extension}`, por exemplo `{outputDir}/{stem}.{locale}{extension}`, o que resulta em `…/guide.de.md` sob o `outputDir` resolvido.
