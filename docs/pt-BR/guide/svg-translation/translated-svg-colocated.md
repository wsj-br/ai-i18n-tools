<a id="colocated-translated-svg-doc-system"></a>
# SVG traduzido e colocalizado (sistema de documentação)

Use para sites de sistema de documentação onde ilustrações SVG traduzidas devem aparecer junto com documentos traduzidos no diretório de conteúdo de cada localidade — o mesmo local das [capturas de tela colocalizadas](/pt-BR/guide/images-and-screenshots/colocated-screenshots). O preset Docusaurus é o principal exemplo.

<a id="config"></a>
### Configuração

```json
"features": {
  "translateSVG": true
},
"svg": {
  "sourcePath": [
    "documentation/static/assets/diagram.svg"
  ],
  "outputDir": "documentation/i18n",
  "style": "nested",
  "pathTemplate": "{outputDir}/{locale}/docusaurus-plugin-content-docs/current/assets/{basename}",
  "forceLowercase": true
}
```

`translate-svg` grava um SVG por localidade no mesmo diretório `current/assets/` que as capturas de tela colocalizadas usam para PNGs:

```
documentation/i18n/de/docusaurus-plugin-content-docs/current/assets/diagram.svg
documentation/i18n/fr/docusaurus-plugin-content-docs/current/assets/diagram.svg
```

<a id="source-markdown"></a>
### Markdown de origem

Todos os documentos em todas as localidades usam o mesmo caminho relativo:

```markdown
![Diagram](../assets/diagram.svg)
```

Para a localidade em inglês, o link simbólico `docs/assets → ../static/assets` resolve isso. Para localidades traduzidas, ele resolve diretamente para `current/assets/`.

Nenhuma regra `regexAdjustments` é necessária porque os documentos de origem em inglês e os documentos de saída traduzidos usam caminhos idênticos.

<a id="svg-source-location"></a>
### Localização do código-fonte SVG

Recomendado: armazenar os SVGs de origem em `documentation/static/assets/` ao lado dos PNGs em en-GB. Isso mantém todos os ativos da documentação em um único local, e o mesmo link simbólico `docs/assets` cobre ambos. As entradas `svg.sourcePath` apontam então para `documentation/static/assets/name.svg`.

<a id="pathtemplate-placeholders"></a>
### Espaços reservados `pathTemplate`

| Substituto               | Valor                                                  |
|--------------------------|--------------------------------------------------------|
| `{outputDir}`            | Caminho absoluto resolvido de `svg.outputDir`              |
| `{locale}` | Código da localidade de destino |
| `{LOCALE}` | Código da localidade em maiúsculas |
| `{relPath}` | Caminho relativo da raiz `sourcePath` até o SVG de origem |
| `{stem}` | Nome do arquivo sem extensão |
| `{basename}` | Nome do arquivo com extensão |
| `{extension}` | Extensão incluindo o ponto |
| `{relativeToSourceRoot}` | Caminho relativo da raiz `sourcePath` mais próxima |

Referência completa na [tabela de configuração svg](/pt-BR/reference/configuration#svg).

<a id="implementation-example"></a>
### Exemplo de implementação

[duplistatus](https://github.com/wsj-br/duplistatus) — bloco `svg` aninhado com `pathTemplate` em [ai-i18n-tools.config.json](https://github.com/wsj-br/duplistatus/blob/master/ai-i18n-tools.config.json); SVGs de origem listados em `documentation/static/img/` (por exemplo, [duplistatus_toolbar.svg](https://github.com/wsj-br/duplistatus/blob/master/documentation/static/img/duplistatus_toolbar.svg)); `translate-svg` grava arquivos por localidade em `documentation/i18n/<locale>/…/current/assets/` ao lado de PNGs colocalizados; os documentos os incorporam hoje via `/img/duplistatus_*.svg` (por exemplo, [overview.md](https://github.com/wsj-br/duplistatus/blob/master/documentation/docs/user-guide/overview.md)). Consulte [task-locale-assets-simplification.md](https://github.com/wsj-br/duplistatus/blob/master/dev/task-locale-assets-simplification.md) para a mudança planejada para caminhos `../assets/` e remoção da ponte `regexAdjustments` SVG.

---

<a id="the-flat-link-rewriter-and-two-step-flow"></a>
