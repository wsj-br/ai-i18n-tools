<a id="shared-raster"></a>
# Raster compartilhado

Use quando uma única imagem é compartilhada entre todas as localidades (sem variante por localidade).

- **`docsOutput.style = "flat"`** — o reescritor de link "flat" calcula o prefixo de profundidade por arquivo de saída, então um ativo relativo ao lado do arquivo de origem (por exemplo, `docs/figure.png` referenciado como `figure.png` de `docs/page.md`) é resolvido corretamente em cada saída traduzida — nenhuma regra `postProcessing.regexAdjustments` é necessária. Quando os arquivos de origem estão em subdiretórios, habilite `flatPreserveRelativeDir: true` para que os caminhos de saída preservem a árvore de origem (consulte [Prefixo de profundidade por arquivo](/pt-BR/guide/images-and-screenshots/link-rewriting#per-file-depth-prefix-with-flatpreserverelativedir)).
- **`docsOutput.style = "vitepress"`** (e outras predefinições do sistema de documentação com um normalizador de link) — caminhos absolutos da raiz do site, como `/translation-dashboard.png`, permanecem inalterados quando o URL é idêntico em todas as localidades — nenhuma regra `regexAdjustments` é necessária.

**Exemplo "flat":** um projeto traduz `docs/guide/quick-start.md` para `translated-docs/docs/guide/quick-start.<locale>.md`. Isso assume `flatPreserveRelativeDir: true` para que `docs/guide/quick-start.md` seja enviado para `translated-docs/docs/guide/quick-start.<locale>.md` (não `translated-docs/quick-start.<locale>.md`). Uma imagem irmã `docs/translation-dashboard.png` é referenciada de `quick-start.md` como `../translation-dashboard.png`. O reescritor calcula o prefixo por arquivo do diretório do arquivo de saída de volta para o diretório de origem (`../../docs/`), produzindo `../../docs/translation-dashboard.png`. De `translated-docs/docs/guide/`, isso é resolvido corretamente de volta para `docs/translation-dashboard.png`.

Uma regra `postProcessing` ainda é necessária quando:
- O ativo é referenciado por meio de um URL absoluto em **`docsOutput.style = "flat"`** (por exemplo, `/img/figure.png`) — o reescritor "flat" lida apenas com caminhos relativos
- Você deseja alterar o URL do ativo por outros motivos (por exemplo, mudar para um CDN)

<a id="implementation-example"></a>
### Exemplo de implementação

A própria documentação deste repositório usa a variante de URL absoluto de imagens compartilhadas: o [guia do Painel de Tradução](/pt-BR/guide/translation-dashboard/) referencia sua captura de tela como `![Translation Dashboard](/translation-dashboard.png)` — um caminho absoluto da raiz do site servido de [`docs/public/translation-dashboard.png`](https://github.com/wsj-br/ai-i18n-tools/tree/main/docs/public/translation-dashboard.png). Como o URL é idêntico para cada localidade, nenhuma regra `postProcessing.regexAdjustments` é necessária.
