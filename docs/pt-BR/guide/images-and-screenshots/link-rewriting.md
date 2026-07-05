<a id="the-flat-link-rewriter-and-two-step-flow"></a>
# O reescritor de links planos e o fluxo de duas etapas

Para `docsOutput.style = "flat"` (e a menos que `rewriteRelativeLinks: false` ou um `pathTemplate` personalizado seja definido), um reescritor integrado é executado antes de `postProcessing`. Ele trata links entre documentos (adicionando sufixos de localidade) e acrescenta um prefixo de profundidade às URLs de ativos não markdown.

<a id="two-step-flow-when-docsoutputstyle--flat"></a>
### Fluxo de duas etapas quando `docsOutput.style = "flat"`

```
source URL  →  [flat link rewriter: depth prefix]  →  [postProcessing: locale segment]  →  output URL
```

Exemplo com `outputDir: "translated-docs/"` e fonte `README.md` na raiz do repositório:

1. Reescritor de link plano: `images/screenshots/en-GB/foo.png` → `../images/screenshots/en-GB/foo.png` (um `../` para `translated-docs/`)
2. Expressão regular `postProcessing` `images/screenshots/[^/]+/` → `images/screenshots/${translatedLocale}/`: `../images/screenshots/de/foo.png`

Para `docsOutput.style = "doc-system"` (incluindo `"docusaurus"`, `"astro-starlight"` e `"nested"`), o reescritor de links planos não é executado. `postProcessing` recebe a URL original do markdown traduzido (normalmente um caminho absoluto como `/img/screenshots/en-GB/foo.png`).

<a id="vitepress-link-normalizer"></a>
### Normalizador de links do VitePress (`style: "vitepress"`)

Quando `docsOutput.rewriteVitepressLinks` é `true` (padrão quando `style` é `"vitepress"`), um normalizador separado é executado após a remontagem do segmento (em vez do reescritor plano). Ele visa sites VitePress / doc-system onde o inglês reside na raiz do conteúdo e os locais ficam em pastas irmãs (`docs/de/guide/…`).

```
source href  →  [VitePress link normalizer]  →  [postProcessing]  →  output href
```

Reescritas típicas:

| Padrão de origem | Destino normalizado |
|----------------|-------------------|
| `docs/guide/foo.md` | `/guide/foo` |
| `../guide/foo.md` (de um arquivo de localidade) | `/guide/foo` |
| `https://github.com/…/examples/console-app/` | inalterado (use URLs completas para caminhos de repositório) |

Para projetos que sincronizam `README.md` → `docs/index.md`, use URLs completas do GitHub em `README.md` para `LICENSE`, `examples/` e outros arquivos fora da árvore VitePress. Consulte [Integração VitePress — README como a página inicial da documentação](/guide/vitepress-integration#readme-as-homepage).

O reescritor "flat" e o normalizador VitePress são mutuamente exclusivos por bloco `docs[]` — apenas um é executado antes de `postProcessing`. Consulte [Integração VitePress — Convenções de links](/guide/vitepress-integration#link-conventions).

<a id="per-file-depth-prefix-with-flatpreserverelativedir"></a>
### Prefixo de profundidade por arquivo com `flatPreserveRelativeDir`

O prefixo de profundidade é calculado por arquivo de saída — não globalmente para todo o lote. Para cada arquivo de origem, o reescritor calcula o caminho relativo do diretório do arquivo de saída de volta ao diretório do arquivo de origem e usa esse caminho como prefixo.

Isso significa que, com `flatPreserveRelativeDir: true`, os arquivos de origem em subdiretórios obtêm o prefixo correto automaticamente. Por exemplo, `docs/guide/quick-start.md` gera `translated-docs/docs/guide/quick-start.<locale>.md`. O prefixo por arquivo é `../../docs/`, então um ativo `translation-dashboard.png` (um irmão da árvore de origem) se torna `../../docs/translation-dashboard.png` — que é resolvido corretamente de `translated-docs/docs/guide/` de volta para `docs/translation-dashboard.png`.

Nenhuma correção por expressão regular `postProcessing` é necessária para ativos com caminhos relativos localizados ao lado dos arquivos de origem.

<a id="rewriterelativelinks-and-linkrewritedocsroot"></a>
### `rewriteRelativeLinks` e `linkRewriteDocsRoot`

| Opção                                   | Efeito                                                                                                           |
|------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| `docsOutput.rewriteRelativeLinks`    | Habilita ou desabilita explicitamente o reescritor de links planos (substitui o padrão quando `docsOutput.style = "flat"`) |
| `docsOutput.linkRewriteDocsRoot`     | Diretório raiz a partir do qual `depthPrefix` é calculado (padrão `"."`)                                                        |
| `docsOutput.flatPreserveRelativeDir` | Afeta o layout do caminho de saída, que o reescritor utiliza ao calcular os caminhos de destino para arquivos traduzidos conhecidos       |

---

<a id="common-mistakes-and-troubleshooting"></a>
