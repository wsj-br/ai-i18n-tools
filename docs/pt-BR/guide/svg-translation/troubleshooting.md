<a id="svg-troubleshooting"></a>
# Solução de problemas de SVG

Consulte também [Solução de problemas de imagens e capturas de tela](/pt-BR/guide/images-and-screenshots/troubleshooting).

- **Fontes e saídas SVG no mesmo diretório** — mantenha `svg.sourcePath` e `svg.outputDir` separados.
- **URLs estáticas absolutas do Docusaurus para SVGs colocalizados** — use caminhos `../assets/` relativos desde o início.
- **Tag de fechamento inesperada `text` vs `g` após a tradução** — O Inkscape frequentemente emite tags `<text … />` vazias e de auto-fechamento ao lado de rótulos reais. Expressões regulares de extratores mais antigos abrangiam essas tags até a próxima `</text>` e escreviam um fechamento extra. Atualize e execute novamente `translate-svg` (ou `sync`) para regenerar o SVG da localidade.
- **Rótulos romanizados ou apenas em latim em SVGs em hindi, árabe, CJK ou cirílico** — a mesma política de sistema de escrita que para documentos se aplica; linhas de cache com script incorreto são rejeitadas na próxima `translate-svg` / `sync`. Execute novamente com `--debug-failed` global para gravar um log `FAILED-TRANSLATION` em `cacheDir` para **cada** modelo descartado (prompt, saída bruta, erro de script), não apenas quando todos os modelos falham. Consulte [Saída em hindi, árabe, CJK ou cirílico está romanizada](/pt-BR/guide/documents/troubleshooting#hindi-arabic-cjk-or-cyrillic-output-is-romanised-latin-letters).
