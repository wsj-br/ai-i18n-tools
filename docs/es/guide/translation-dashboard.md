<a id="translation-dashboard"></a>
# Panel de traducción

Ejecuta:

```bash
ai-i18n-tools dashboard
# Optional: choose port, do not auto-open browser
# ai-i18n-tools dashboard -p 8765 --no-open
```

El puerto de escucha predeterminado es **8675**. Si ese puerto no está disponible, el servidor intenta el siguiente puerto (hasta 1000 intentos) y registra el puerto que eligió. El alias obsoleto `editor` aún funciona, pero muestra una advertencia; se recomienda usar `dashboard`.

Esto inicia una interfaz web local respaldada por su base de datos SQLite `cacheDir` configurada — la misma carpeta que la CLI usa para segmentos de documentación, registros y metadatos relacionados. Incluye las pestañas **Documentación** (segmentos de doc en caché), **Cadenas de interfaz**, **Plurales de interfaz**, **Glosario**, **Errores**, **Problemas en Markdown** y **Estadísticas**.

![Translation Dashboard](/translation-dashboard.png)

Si **edita filas de caché** en esta aplicación (por ejemplo, segmentos de documentación), ejecute `sync --force-update` o el comando de traducción equivalente con `--force-update` para que las salidas en disco coincidan con el caché; si el **texto fuente** en el repositorio cambia más adelante, los hashes de los segmentos cambian y las ediciones manuales del texto anterior quedan obsoletas.

<a id="failures-document-translation"></a>
### Errores (traducción de documentos)

La pestaña **Errores** es exclusiva para la traducción de **documentación**. Lee los registros de fallos escritos en SQLite cuando un segmento no pudo traducirse correctamente para un idioma — por ejemplo, salida del modelo vacía o inválida, errores de validación tras la traducción (`AST mismatch`, fugas de marcadores de posición y controles de **calidad** similares), o una condición **fatal** que bloqueó el progreso. Ayuda a responder: *¿qué segmento de origen falló, para qué idioma y modelo, y qué texto de error se registró?*

<a id="when-to-use-it"></a>
#### Cuándo usarlo

- Después de que `translate-docs` o `sync` finalice con errores, configuraciones regionales parciales o registros confusos, puede ordenar y filtrar los fallos en lugar de desplazarse solo por la salida del terminal.
- Cuando desea **priorizar el trabajo de rehacer**: ordene por **# Fallos** para que los segmentos que fallaron repetidamente en varios intentos aparezcan primero; estos son candidatos fuertes para **simplificar o reformatear** en el markdown de origen, de modo que futuras ejecuciones tengan éxito.
- Cuando necesita el **segmento exacto** —ruta del archivo, indicación de línea, hash de origen y texto completo del origen— para editar el párrafo correcto en su repositorio.

<a id="why-source-edits-matter"></a>
#### Por qué son importantes las ediciones del origen

El marcado en línea denso (**negrita** mezclada con `` `code` ``, énfasis anidados, oraciones largas con muchos fragmentos) dificulta que los modelos devuelvan traducciones que aún pasen las comprobaciones estructurales. Los segmentos con **múltiples fallos registrados** suelen mejorar más si se **reescribe o divide** el origen (o se mueven ejemplos a bloques de código delimitados) que si se vuelve a ejecutar la traducción sobre texto sin cambios. Esto concuerda con [Markdown complejo y comprobaciones de calidad fallidas](#complex-markdown-and-failed-quality-checks).

<a id="how-to-use-the-tab"></a>
#### Cómo usar la pestaña

1. Abra **Errores** en el panel (misma sesión del navegador que [Panel de traducción](#translation-dashboard)).
2. Lea la franja de **resumen** (segmentos con algún error, más recuentos de segmentos con **1**, **2** o **3+** registros de error).
3. Filtre por **nombre de archivo** parcial, **configuración regional**, **modelo**, **error de calidad** (los valores provienen de su caché), **solo errores fatales**, y opcionalmente por **hash de origen**, **texto de origen** o subcadena de **mensaje de error**; luego haga clic en **Aplicar**.
4. Elija **Ordenar: # de errores** (predeterminado) o **Ordenar: ruta de archivo + número de línea**.
5. Use la paginación en la parte superior o inferior de la tabla. **Haga clic en una fila** para alternar la visualización del texto completo de origen. El control de enlace en la fila (cuando está habilitado) solicita al servidor que registre pistas de archivo/línea en la **terminal** donde se está ejecutando `ai-i18n-tools dashboard`; útil para saltar desde el navegador a su editor.
6. Corrija el **archivo de origen** en su proyecto y luego vuelva a ejecutar `translate-docs` o `sync`. Si la lista parece **desactualizada** tras una ejecución exitosa, ejecute `ai-i18n-tools sync --force-update` y vuelva a cargar el panel (el panel Errores muestra la misma sugerencia).

Para depuración basada en archivos junto con la interfaz, aún puede usar `translate-docs --debug-failed` para escribir detalles de `FAILED-TRANSLATION` bajo `cacheDir` durante los reintentos — consulte [Comportamiento del caché y banderas `translate-docs`](#cache-behaviour-and-translate-docs-flags).

<a id="markdown-issues-static-checks"></a>
### Problemas de Markdown (comprobaciones estáticas)

La pestaña **Problemas de Markdown** muestra filas de la tabla `markdown_source_issues` en SQLite. Cada fila es un hallazgo **previo a la traducción**: por ejemplo, secuencias de delimitadores que nunca se emparejan como énfasis/tachado según las mismas reglas tipo CommonMark que `translate-docs` usa para el enmascaramiento, un fragmento de código en línea abierto con comillas invertidas pero nunca cerrado, o `STRONG_OUTSIDE_LINK` cuando `**` / `__` envuelven un enlace `[text](url)` (coloque el texto en negrita solo dentro del texto del enlace). Esto **no** es lo mismo que **Errores**, que registra problemas de salida por modelo por configuración regional y validación posterior a la traducción (`AST mismatch`, fugas de marcadores de posición y similares).

Utilice esta pestaña cuando desee corregir el **markdown fuente** antes de consumir tokens, especialmente cuando las comprobaciones de calidad fallen repetidamente en la estructura. Filtre por ruta de archivo (coincidencia parcial con la clave de caché, incluyendo prefijos `doc-block:{index}:`), **código de problema** o **hash fuente**; ordene por ruta de archivo + línea o por la hora más reciente de escaneo. El botón de enlace registra sugerencias de archivo/línea en la terminal donde se está ejecutando `ai-i18n-tools dashboard` (misma idea que en la pestaña Documentación).

**Actualización de filas:** ejecute `ai-i18n-tools check-markdown` (ámbito opcional `-p` / `--path`, `--no-cache` para omitir SQLite, `--json` para salida legible por máquina en stdout con líneas legibles por humanos en stderr). De forma predeterminada, cada archivo markdown `translate-docs` ejecutado también vuelve a escanear y reemplaza las filas de ese archivo cuando `docs[].warnMarkdownSourceIssues` no está configurado en `false`. Borrar todas las traducciones de una ruta de archivo de caché elimina las filas de problemas de markdown para esa ruta de archivo como parte de la misma ruta de limpieza que los errores. `cleanup` además purga las filas de problemas de markdown cuya ruta de origen resuelta falta en el disco, por lo que los diagnósticos de archivos eliminados o renombrados (incluso los que solo fueron escaneados por `check-markdown`, nunca traducidos) no persisten.
