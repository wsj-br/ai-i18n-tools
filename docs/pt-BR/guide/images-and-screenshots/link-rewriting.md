<a id="the-flat-link-rewriter-and-two-step-flow"></a>
# O reescritor de links planos e o fluxo de duas etapas

Para `docsOutput.style = "flat"` (e a menos que `rewriteRelativeLinks: false` ou um `pathTemplate` personalizado seja definido), um reescritor integrado é executado antes de `postProcessing`. Ele lida com links entre documentos (adicionando sufixos de localidade) e adiciona um prefixo de profundidade a URLs de ativos que não são markdown. Os caminhos de ativos específicos da localidade (capturas de tela, pontes `/img/…`) são então reescritos por `docsOutput.postProcessing.regexAdjustments`.

<a id="two-step-flow-when-docsoutputstyle--flat"></a>
### Fluxo de duas etapas quando `docsOutput.style = "flat"`

```
source URL  →  [flat link rewriter: depth prefix]  →  [regexAdjustments: locale segment]  →  output URL
```

Exemplo com `outputDir: "translated-docs/"` e fonte `README.md` na raiz do repositório:

1. Reescritor de link plano: `images/screenshots/en-GB/foo.png` → `../images/screenshots/en-GB/foo.png` (um `../` para `translated-docs/`)
2. Regra `regexAdjustments` `images/screenshots/[^/]+/` → `images/screenshots/${translatedLocale}/`: `../images/screenshots/de/foo.png`

Para `docsOutput.style = "doc-system"` (incluindo `"docusaurus"`, `"astro-starlight"` e `"nested"`), o reescritor de link plano não é executado. `regexAdjustments` vê a URL original do markdown traduzido (geralmente um caminho absoluto como `/img/screenshots/en-GB/foo.png`).

<a id="vitepress-link-normalizer-style-vitepress"></a>
### Normalizador de links do VitePress (`style: "vitepress"`)

Quando `docsOutput.rewriteVitepressLinks` é `true` (padrão quando `style` é `"vitepress"`), um normalizador separado é executado após a remontagem do segmento (em vez do reescritor plano). Ele visa sites VitePress / doc-system onde o inglês reside na raiz do conteúdo e os locais ficam em pastas irmãs (`docs/de/guide/…`).

```
source href  →  [VitePress link normalizer]  →  [regexAdjustments]  →  output href
```

Reescritas típicas:

| Padrão de origem | Destino normalizado |
|----------------|-------------------|
| `docs/guide/foo.md` | `/guide/foo` |
| `../guide/foo.md` (de um arquivo de localidade) | `/guide/foo` |
| `https://github.com/…/examples/console-app/` | inalterado (use URLs completas para caminhos de repositório) |

Para projetos que sincronizam `README.md` → `docs/index.md`, use URLs completas do GitHub em `README.md` para `LICENSE`, `examples/` e outros arquivos fora da árvore do VitePress. Consulte [Integração VitePress — README como a página inicial da documentação](/pt-BR/guide/integrations/vitepress#readme-as-homepage).

O reescritor "flat" e o normalizador VitePress são mutuamente exclusivos por bloco `docs[]` — apenas um é executado antes de `regexAdjustments`. Consulte [Integração VitePress — Convenções de link](/pt-BR/guide/integrations/vitepress#link-conventions).

<a id="nextra-link-normalizer-style-nextra"></a>
### Normalizador de links do Nextra (`style: "nextra"`)

Quando `docsOutput.rewriteNextraLinks` é `true` (padrão quando `style` é `"nextra"`), um normalizador separado é executado após a remontagem do segmento. Ele reescreve `content/en/…` e caminhos `.mdx` relativos para rotas neutras em relação ao local (`/guide/…`). Consulte [Integração Nextra — Convenções de link](/pt-BR/guide/integrations/nextra#link-conventions).

<a id="fumadocs-link-normalizer-style-fumadocs"></a>
### Normalizador de links do Fumadocs (`style: "fumadocs"`)

Quando `docsOutput.rewriteFumadocsLinks` é `true` (padrão quando `style` é `"fumadocs"`), um normalizador separado é executado após a remontagem do segmento. Ele reescreve `content/docs/…` e caminhos `.mdx` relativos para rotas neutras em relação ao local (`/docs/…`). Consulte [Integração Fumadocs — Convenções de link](/pt-BR/guide/integrations/fumadocs#link-conventions).

<a id="per-file-depth-prefix-with-flatpreserverelativedir"></a>
### Prefixo de profundidade por arquivo com `flatPreserveRelativeDir`

O prefixo de profundidade é calculado por arquivo de saída — não globalmente para todo o lote. Para cada arquivo de origem, o reescritor calcula o caminho relativo do diretório do arquivo de saída de volta ao diretório do arquivo de origem e usa esse caminho como prefixo.

Isso significa que, com `flatPreserveRelativeDir: true`, os arquivos de origem em subdiretórios obtêm o prefixo correto automaticamente. Por exemplo, `docs/guide/quick-start.md` gera `translated-docs/docs/guide/quick-start.<locale>.md`. O prefixo por arquivo é `../../docs/`, então um ativo `translation-dashboard.png` (um irmão da árvore de origem) se torna `../../docs/translation-dashboard.png` — que é resolvido corretamente de `translated-docs/docs/guide/` de volta para `docs/translation-dashboard.png`.

Nenhuma correção de `regexAdjustments` é necessária para ativos de caminho relativo junto com arquivos de origem.

<a id="rewriterelativelinks-and-linkrewritedocsroot"></a>
### `rewriteRelativeLinks` e `linkRewriteDocsRoot`

| Opção                                   | Efeito                                                                                                           |
|------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| `docsOutput.rewriteRelativeLinks`    | Habilita ou desabilita explicitamente o reescritor de links planos (substitui o padrão quando `docsOutput.style = "flat"`) |
| `docsOutput.linkRewriteDocsRoot`     | Diretório raiz a partir do qual `depthPrefix` é calculado (padrão `"."`)                                                        |
| `docsOutput.flatPreserveRelativeDir` | Afeta o layout do caminho de saída, que o reescritor utiliza ao calcular os caminhos de destino para arquivos traduzidos conhecidos       |

<a id="docsoutputpostprocessingregexadjustments"></a>
### `docsOutput.postProcessing.regexAdjustments`

Configure regras `{ "description"?, "search", "replace" }` ordenadas em `docs[].docsOutput.postProcessing` para reescrever URLs de imagens, capturas de tela e outros ativos que os reescritores integrados não manipulam — geralmente trocando um segmento de pasta de localidade (`screenshots/en-GB/` → `screenshots/de/`) ou fazendo a ponte de caminhos estáticos absolutos (`/img/…` → `../assets/…`).

As regras são executadas no **corpo** do markdown traduzido após a remontagem do segmento e a reescrita de links integrada (plana ou VitePress), e antes de `addFrontmatter`. No layout plano, escreva padrões `search` contra URLs **depois** que o prefixo de profundidade for aplicado — corresponda ao segmento de localidade dentro do caminho, não ao `../` inicial.

**Pastas de captura de tela por localidade (layout plano):**

```json
"docsOutput": {
  "style": "flat",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders",
        "search": "images/screenshots/[^/]+/",
        "replace": "images/screenshots/${translatedLocale}/"
      }
    ]
  }
}
```

Use `[^/]+` em vez de codificar sua localidade de origem (`en-GB`) para que a regra sobreviva a uma alteração de `sourceLocale`. O espaço reservado mais comum é `${translatedLocale}`; `${sourceLocale}`, `${sourceFilename}`, `${translatedFilename}` e variáveis de caminho também estão disponíveis — consulte [Documentos — Reescrevendo links](/pt-BR/guide/documents/link-rewriting#replace-placeholders).

Exemplos específicos de layout (plano, sistema de documentos, Docusaurus, Starlight): [Pasta por localidade](/pt-BR/guide/images-and-screenshots/per-locale-folder). Regras gerais de links entre páginas: [Documentos — Reescrevendo links](/pt-BR/guide/documents/link-rewriting). Referência de campo: [Configuração — `docs`](/pt-BR/reference/configuration#docs).

---

<a id="common-mistakes-and-troubleshooting"></a>

Consulte [Erros comuns e solução de problemas](/pt-BR/guide/images-and-screenshots/troubleshooting) para regexes de localidade codificadas, diretórios de captura de tela ausentes e ponte `/img/` do Docusaurus.
