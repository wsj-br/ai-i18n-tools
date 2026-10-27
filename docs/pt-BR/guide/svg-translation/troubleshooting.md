<a id="svg-troubleshooting"></a>
# Solução de problemas de SVG

Consulte também [Solução de problemas de imagens e capturas de tela](/pt-BR/guide/images-and-screenshots/troubleshooting).

- **Arquivos de origem e de saída de SVG no mesmo diretório** — mantenha `svg.sourcePath` e `svg.outputDir` separados.
- **URLs estáticas absolutas do Docusaurus para SVGs colocalizados** — use caminhos `../assets/` relativos desde o início.
- **Tag de fechamento inesperada `text` vs `g` após a tradução** — O Inkscape geralmente emite `<text … />` vazias de fechamento automático ao lado de rótulos reais. Regexes de extrator mais antigas abrangiam essas até o próximo `</text>` e gravavam uma tag de fechamento avulsa. Atualize e execute novamente `translate-svg` (ou `sync`) para regenerar o SVG da localidade.
- **Rótulos romanizados ou apenas em latim em SVGs em hindi, árabe, CJK ou cirílico** — a mesma política de sistema de escrita dos documentos se aplica; linhas de cache com o script errado são rejeitadas na próxima execução de `translate-svg` / `sync`. Execute novamente com o `--debug-failed` global para gravar um log `FAILED-TRANSLATION` em `cacheDir` para **cada** modelo descartado (prompt, saída bruta, erro de script), não apenas quando todos os modelos falham. Consulte [A saída em hindi, árabe, CJK ou cirílico está romanizada](/pt-BR/guide/documents/troubleshooting#hindi-arabic-cjk-or-cyrillic-output-is-romanized-latin-letters).
