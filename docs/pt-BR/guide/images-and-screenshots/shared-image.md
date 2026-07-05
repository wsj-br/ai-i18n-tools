<a id="shared-raster"></a>
# Raster compartilhado

Use quando uma única imagem for compartilhada entre todos os idiomas (sem variantes por idioma). Quando `docsOutput.style = "flat"`, o reescritor de links planos calcula o prefixo de profundidade para cada arquivo de saída, de modo que um ativo ao lado do arquivo de origem (por exemplo, `docs/figure.png` referenciado como `figure.png` a partir de `docs/page.md`) seja resolvido corretamente em todas as saídas traduzidas — nenhuma regra `postProcessing.regexAdjustments` é necessária.

Exemplo: um projeto traduz `docs/guide/quick-start.md` para `translated-docs/docs/guide/quick-start.<locale>.md`. Uma imagem irmã `docs/translation-dashboard.png` é referenciada de `quick-start.md` como `../translation-dashboard.png`. O reescritor calcula o prefixo por arquivo do diretório do arquivo de saída de volta para o diretório de origem (`../../docs/`), produzindo `../../docs/translation-dashboard.png`. De `translated-docs/docs/guide/`, isso resolve corretamente de volta para `docs/translation-dashboard.png`.

Uma regra `postProcessing` ainda é necessária quando:
- O ativo é referenciado por meio de uma URL absoluta (por exemplo, `/img/figure.png`) — o reescritor trata apenas caminhos relativos
- Você deseja alterar a URL do ativo por outros motivos (por exemplo, mudar para uma CDN)

<a id="implementation-example"></a>
### Exemplo de implementação

A própria documentação deste repositório usa a variante de URL absoluto de imagens compartilhadas: o [guia do Painel de Tradução](/guide/translation-dashboard/) referencia sua captura de tela como `![Translation Dashboard](/translation-dashboard.png)` — um caminho absoluto, raiz do site, servido de [`docs/public/translation-dashboard.png`](https://github.com/wsj-br/ai-i18n-tools/tree/main/docs/public/translation-dashboard.png). Como o URL é idêntico para cada localidade, nenhuma regra `postProcessing.regexAdjustments` é necessária; atualize o PNG com [`scripts/screenshot-translation-dashboard.sh`](https://github.com/wsj-br/ai-i18n-tools/tree/main/scripts/screenshot-translation-dashboard.sh) quando a interface do usuário do painel mudar.
