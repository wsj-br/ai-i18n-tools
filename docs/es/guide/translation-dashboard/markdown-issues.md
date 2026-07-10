<a id="markdown-issues-static-checks"></a>
# Problemas de Markdown (comprobaciones estáticas)

La pestaña **Problemas de Markdown** enumera las filas de la tabla `markdown_source_issues` SQLite. Cada fila es un hallazgo de **pre-traducción**: por ejemplo, secuencias de delimitadores que nunca se emparejan como énfasis/tachado bajo las mismas reglas de estilo CommonMark que `translate-docs` usa para el enmascaramiento, un tramo de código en línea abierto con comillas invertidas pero nunca cerrado, o `STRONG_OUTSIDE_LINK` cuando `**` / `__` envuelven un enlace `[text](url)` (ponga negrita solo dentro del texto del enlace).

Esto **no** es lo mismo que **Fallos**, que registra la salida del modelo por configuración regional y los problemas de validación post-traducción (`AST mismatch`, fugas de marcadores de posición y similares).

<a id="when-to-use-it"></a>
## Cuándo usarlo

Utilice esta pestaña cuando desee corregir el **Markdown de origen** antes de gastar tokens, especialmente cuando las comprobaciones de calidad sigan fallando en la estructura en la pestaña [Fallos](/es/guide/translation-dashboard/failures).

<a id="how-to-use-the-tab"></a>
## Cómo usar la pestaña

1. Lea la tira de **resumen**: el total de filas de problemas y los recuentos por código de problema.
2. Filtre por ruta de archivo (coincidencia parcial con la clave de caché, incluidos los prefijos `doc-block:{index}:`), **código de problema** o **hash de origen**.
3. Ordene por **ruta de archivo + línea** (predeterminado) o por **hora de escaneo más reciente**.
4. El botón de enlace 🔗 registra sugerencias de archivo/línea en la terminal donde se está ejecutando `ai-i18n-tools dashboard`.

Corrija el archivo de origen y luego vuelva a ejecutar la traducción.

<a id="refreshing-rows"></a>
## Actualizando filas

| Comando / evento | Efecto |
| --- | --- |
| `ai-i18n-tools check-markdown` | Volver a escanear documentos configurados; ámbito opcional `-p` / `--path`, `--no-cache`, `--json` |
| `translate-docs` (predeterminado) | Vuelve a escanear y reemplaza las filas de cada archivo Markdown cuando `docs[].warnMarkdownSourceIssues` no es `false` |
| Eliminar todas las traducciones de una ruta de archivo | Elimina las filas de problemas de Markdown para esa ruta de archivo (misma limpieza que los fallos) |
| `cleanup` | Borra toda la tabla `markdown_source_issues` y luego ejecuta `sync --force-update` para volver a llenar las filas |

<a id="common-issue-codes"></a>
## Códigos de problemas comunes

| Código | Significado |
| --- | --- |
| Énfasis / tachado sin emparejar | Secuencias de delimitadores que nunca se cierran según las reglas de CommonMark |
| Código en línea sin cerrar | Tramo de comillas invertidas abierto pero no cerrado |
| `STRONG_OUTSIDE_LINK` | Los marcadores en negrita envuelven un enlace Markdown; mueva la negrita dentro del texto del enlace |

Consulte también [Markdown complejo y comprobaciones de calidad fallidas](/es/guide/documents/#complex-markdown-and-failed-quality-checks).
