<a id="svg-troubleshooting"></a>
# Solução de problemas de SVG

Consulte também [Solução de problemas de imagens e capturas de tela](/pt-BR/guide/images-and-screenshots/troubleshooting).

- **Fontes e saídas SVG no mesmo diretório** — mantenha `svg.sourcePath` e `svg.outputDir` separados.
- **URLs estáticas absolutas do Docusaurus para SVGs colocalizados** — use caminhos `../assets/` relativos desde o início.
- **Tag de fechamento inesperada `text` vs `g` após a tradução** — o Inkscape geralmente emite `<text … />` vazias de fechamento automático ao lado de rótulos reais. Expressões regulares de extratores mais antigos abrangiam essas tags até a próxima `</text>` e escreviam um fechamento perdido. Atualize e execute novamente `translate-svg` (ou `sync`) para regenerar o SVG do local.
- **Rótulos romanizados ou apenas latinos em SVGs em hindi, árabe, CJK ou cirílico** — a mesma política de sistema de escrita dos documentos se aplica; linhas de cache de script incorretas são rejeitadas no próximo `translate-svg` / `sync`. Execute novamente com `--debug-failed` global para gravar um log `FAILED-TRANSLATION` em `cacheDir` para **cada** modelo descartado (prompt, saída bruta, erro de script), não apenas quando todos os modelos falham. Consulte [Saída em hindi, árabe, CJK ou cirílico é romanizada](/pt-BR/guide/documents/troubleshooting#wrong-script-or-romanized-output).
