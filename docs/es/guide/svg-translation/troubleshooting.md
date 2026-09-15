<a id="svg-troubleshooting"></a>
# Solución de problemas de SVG

Consulte también [Solución de problemas de imágenes y capturas de pantalla](/es/guide/images-and-screenshots/troubleshooting).

- **Fuentes y salidas SVG en el mismo directorio** — mantenga `svg.sourcePath` y `svg.outputDir` separados.
- **URLs estáticas absolutas de Docusaurus para SVG colocados** — use rutas `../assets/` relativas desde el principio.
- **Etiqueta de cierre inesperada `text` vs `g` después de la traducción** — Inkscape a menudo emite `<text … />` vacíos que se cierran solos junto a etiquetas reales. Las expresiones regulares de extractores más antiguos abarcaban esos hasta el siguiente `</text>` y escribían un cierre extraviado. Actualice y vuelva a ejecutar `translate-svg` (o `sync`) para regenerar el SVG local.
- **Etiquetas romanizadas o solo latinas en SVG en hindi, árabe, CJK o cirílico** — se aplica la misma política de sistema de escritura que a los documentos; las filas de caché de script incorrecto se rechazan en el siguiente `translate-svg` / `sync`. Vuelva a ejecutar con `--debug-failed` global para escribir un registro `FAILED-TRANSLATION` en `cacheDir` para **cada** modelo descartado (solicitud, salida sin procesar, error de script), no solo cuando todos los modelos fallan. Consulte [La salida en hindi, árabe, CJK o cirílico está romanizada](/es/guide/documents/troubleshooting#wrong-script-or-romanized-output).
