<a id="svg-troubleshooting"></a>
# Solución de problemas de SVG

Consulte también [Solución de problemas de imágenes y capturas de pantalla](/es/guide/images-and-screenshots/troubleshooting).

- **Fuentes y salidas SVG en el mismo directorio** — mantenga `svg.sourcePath` y `svg.outputDir` separados.
- **URL estáticas absolutas de Docusaurus para SVG colocados** — use rutas `../assets/` relativas desde el principio.
- **Etiqueta de cierre inesperada `text` frente a `g` después de la traducción** — Inkscape a menudo emite `<text … />` vacías de autocierre junto a etiquetas reales. Las expresiones regulares de extractores más antiguas abarcaban esas a través del siguiente `</text>` y escribían un cierre extraviado. Actualice y vuelva a ejecutar `translate-svg` (o `sync`) para regenerar el SVG local.
- **Etiquetas romanizadas o solo en latín en SVG en hindi, árabe, CJK o cirílico** — se aplica la misma política de sistema de escritura que a los documentos; las filas de caché con script incorrecto se rechazan en el siguiente `translate-svg` / `sync`. Vuelva a ejecutar con `--debug-failed` global para escribir un registro `FAILED-TRANSLATION` bajo `cacheDir` para **cada** modelo descartado (solicitud, salida sin procesar, error de script), no solo cuando todos los modelos fallan. Consulte [La salida en hindi, árabe, CJK o cirílico está romanizada](/es/guide/documents/troubleshooting#hindi-arabic-cjk-or-cyrillic-output-is-romanised-latin-letters).
