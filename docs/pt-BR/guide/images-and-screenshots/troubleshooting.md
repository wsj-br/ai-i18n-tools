<a id="common-mistakes-and-troubleshooting"></a>
# Erros comuns e solução de problemas

**Nenhum diretório de localidade nos caminhos das capturas de tela**
`images/screenshots/screenshot.png` — não é possível distinguir variantes de localidade e não pode ser reescrito. Reestruture para `images/screenshots/<locale>/screenshot.png` antes de usar a reescrita [de pasta por localidade](/guide/images-and-screenshots/per-locale-folder).

**Localidade de origem codificada diretamente na expressão regular**
`"search": "screenshots/en-GB/"` — falha silenciosamente se `sourceLocale` mudar. Use `"search": "screenshots/[^/]+/"` em vez disso.

**Arquivos SVG de origem e saída no mesmo diretório**
Se `svg.sourcePath` e `svg.outputDir` se sobrepuserem, arquivos gerados se misturam com arquivos de origem editados manualmente. Mantenha-os em diretórios separados.

**URLs estáticas absolutas do Docusaurus para SVGs co-localizados**
`/img/diagram.svg` (de `static/img/`) exige uma regra `regexAdjustments` para reescrever para `../assets/` na saída traduzida. Coloque os SVGs de origem em `static/assets/` e use `../assets/diagram.svg` relativo desde o início para evitar isso completamente.

**Link simbólico ausente `docs/assets` no Docusaurus**
Sem o link simbólico, documentos de origem em `docs/user-guide/` não podem referenciar PNGs ou SVGs em `static/assets/` por meio de um caminho relativo. Configure o link simbólico na criação do projeto: `ln -s ../static/assets documentation/docs/assets`.

**O script `take-screenshots` captura apenas a localidade de origem**
O layout de pasta por localidade requer arquivos PNG para cada localidade. Se o script capturar apenas `en-GB`, os documentos traduzidos terão caminhos reescritos apontando para arquivos ausentes.
