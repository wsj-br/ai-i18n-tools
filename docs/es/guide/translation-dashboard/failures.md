<a id="failures-document-translation"></a>
# Fallos (traducción de documentos)

La pestaña **Fallos** es solo para la traducción de **documentación**. Lee los registros de fallos escritos en SQLite cuando un segmento no pudo traducirse correctamente para una configuración regional, por ejemplo, una salida de modelo vacía o no válida, errores de validación post-traducción (`AST mismatch`, fugas de marcadores de posición y comprobaciones de **calidad** similares), o una condición **fatal** que bloqueó el progreso.

Le ayuda a responder: *¿qué segmento de origen falló, para qué configuración regional y modelo, y qué texto de error se registró?*

<a id="when-to-use-it"></a>
## Cuándo usarlo

- Después de que `translate-docs` o `sync` finalicen con errores, configuraciones regionales parciales o registros confusos: ordene y filtre los fallos en lugar de solo desplazarse por la salida del terminal.
- Cuando desee **priorizar la reelaboración**: ordene por **# Fallos** para que los segmentos que fallaron repetidamente en los reintentos aparezcan primero; estos son candidatos sólidos para **simplificar o reformatear** en el markdown de origen.
- Cuando necesite el **segmento exacto** (ruta de archivo, sugerencia de línea, hash de origen y texto de origen completo) para editar el párrafo correcto en su repositorio.

<a id="why-source-edits-matter"></a>
## Por qué son importantes las ediciones de origen

El marcado en línea denso (**negrita** mezclada con `` `code` ``, énfasis anidado, oraciones largas con muchos tramos) dificulta que los modelos devuelvan traducciones que aún pasen las comprobaciones estructurales. Los segmentos con **múltiples fallos registrados** generalmente mejoran más al **reescribir o dividir** el origen (o mover ejemplos a bloques de código cercados) que al volver a ejecutar la traducción en texto sin cambios. Esto se alinea con [Markdown complejo y comprobaciones de calidad fallidas](/guide/documents/#complex-markdown-and-failed-quality-checks).

<a id="how-to-use-the-tab"></a>
## Cómo usar la pestaña

1. Abra **Fallos** en el panel de control.
2. Lea la tira de **resumen**: segmentos con cualquier fallo, más recuentos de segmentos con **1**, **2** o **3+** registros de fallos.
3. Filtre por **nombre de archivo** parcial, **configuración regional**, **modelo**, **error de calidad** (los valores provienen de su caché), **solo fatal** y, opcionalmente, **hash de origen**, **texto de origen** o subcadena de **mensaje de error**, luego haga clic en **Aplicar**.
4. Elija **Ordenar: # Fallos** (predeterminado) o **Ordenar: ruta de archivo + número de línea**.
5. Use la paginación en la parte superior o inferior de la tabla. **Haga clic en una fila** para expandir el texto de origen completo. La columna **Modelo** muestra el modelo de fallo y, cuando está disponible, el modelo de una entrada de caché posterior exitosa.
6. El control de enlace 🔗 registra las sugerencias de archivo/línea en el **terminal** donde se ejecuta `ai-i18n-tools dashboard`.
7. Corrija el **archivo de origen** en su proyecto, luego ejecute `translate-docs` o `sync` nuevamente. Si la lista parece **desactualizada** después de una ejecución exitosa, ejecute `ai-i18n-tools sync --force-update` y recargue el panel de control.

Para la depuración basada en archivos junto con la interfaz de usuario, use `translate-docs --debug-failed` para escribir detalles de `FAILED-TRANSLATION` bajo `cacheDir` durante los reintentos; consulte [Comportamiento de la caché y banderas de `translate-docs`](/guide/documents/cli-options#cache-behaviour-and-translate-docs-flags).

<a id="failures-vs-markdown-issues"></a>
## Fallos vs. problemas de Markdown

| | **Fallos** | **Problemas de Markdown** |
| --- | --- | --- |
| Cuándo se registran | Durante la traducción (por configuración regional) | Antes de la traducción (escaneo de origen) |
| Causa típica | Mala salida del modelo, errores de validación | Énfasis no emparejado, tramos de código no cerrados, negrita fuera de los enlaces |
| Solución | Editar origen y volver a traducir | Corregir el markdown de origen, luego volver a traducir |

Consulte [Problemas de Markdown](/guide/translation-dashboard/markdown-issues) para las comprobaciones estáticas previas a la traducción.
