<a id="models"></a>
# Modelos

La pestaña **Modelos** clasifica los modelos de chat del proveedor activo para que pueda elegir `translationModels` sin tener que copiar los identificadores manualmente. Utiliza la misma clasificación que [`suggest-models`](/es/reference/cli-commands/models#suggest-models).

Elija **Calidad** o **Precio**. La calidad favorece las métricas languagebench ChrF y Arena Score. El precio favorece una tarifa en USD más baja manteniendo un nivel mínimo de calidad. Cuando la configuración tiene más de un proveedor, aparece un menú **Proveedor**; el valor predeterminado es el proveedor con el que se inició el panel (`provider`, o `-P` / `--provider` en el comando `dashboard`). Cambiar el proveedor o la prioridad recarga la tabla. Las ponderaciones opcionales se encuentran en [`modelSuggestion`](/es/reference/configuration#modelsuggestion).

Las columnas de la tabla son rango, id del modelo, índice (la puntuación ponderada multiplicada por 100), ChrF medido, Arena Score medido y precio de entrada/salida en USD por cada 1 millón de tokens. Una medición faltante se indica con una raya (em dash). El número de rango es la posición del modelo en la clasificación completa, antes de aplicar los filtros siguientes.

**Precio máximo de salida** mantiene los modelos cuyo precio de salida por cada 1 millón de tokens es, como máximo, esa cantidad en USD. Un modelo sin precio de salida se excluye. **Delta mínimo de índice** mantiene un modelo solo cuando su índice está al menos esa cantidad de puntos por debajo del modelo anterior conservado. El primer modelo restante siempre se conserva. Deje cualquiera de los cuadros vacío para omitir ese filtro. Cambiar cualquiera de los valores recarga la tabla.

Marque los modelos que desee. **Usar los mejores** (predeterminado 5) selecciona las primeras N filas de la lista filtrada y restablece su orden. Mueva un id seleccionado hacia arriba o hacia abajo para establecer el orden de reserva. **Actualizar configuración** escribe ese orden en `providers.<selected>.translationModels` y deja `uiModels` y `localeModels` sin cambios. **Copiar JSON** coloca el mismo fragmento `{ "translationModels": [...] }` en el portapapeles.

La primera carga descarga languagebench, Arena y models.dev cuando la caché está vacía, y puede llevar tiempo. Las cargas posteriores reutilizan la caché de 7 días en `<cacheDir>/benchmark-scores.json`. La pestaña no tiene botón de actualización. Actualice la caché desde la CLI con `ai-i18n-tools suggest-models --refresh` y, a continuación, recargue la pestaña. El mismo comando puede imprimir o aplicar la lista.

El pie de página atribuye languagebench (CC BY-SA 4.0), LMArena Arena Score (CC BY 4.0) y models.dev (MIT).
