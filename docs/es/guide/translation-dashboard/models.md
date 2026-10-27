<a id="models"></a>
# Modelos

La pestaña **Modelos** clasifica los modelos de chat del proveedor activo para que puedas elegir `translationModels` sin tener que copiar los ID manualmente. Utiliza la misma clasificación que en [`suggest-models`](/es/reference/cli-commands/models#suggest-models). El tutorial, que incluye por qué la lista contiene más de un modelo, se encuentra en [Modelos de IA](/es/guide/ai-models).

Elija **Calidad** o **Precio**. La calidad favorece las métricas languagebench ChrF y Arena Score. El precio favorece una tarifa en USD más baja manteniendo un nivel mínimo de calidad. Cuando la configuración tiene más de un proveedor, aparece un menú **Proveedor**; el valor predeterminado es el proveedor con el que se inició el panel (`provider`, o `-P` / `--provider` en el comando `dashboard`). Cambiar el proveedor o la prioridad recarga la tabla. Las ponderaciones opcionales se encuentran en [`modelSuggestion`](/es/reference/configuration#modelsuggestion).

Las columnas de la tabla son: controles de reordenación, una casilla de verificación, clasificación, ID del modelo, índice (la puntuación ponderada multiplicada por 100), ChrF medido, Puntuación Arena medida y precio de entrada/salida en USD por 1 millón de tokens. Una medición faltante se indica con un guion largo. El número de clasificación es el lugar del modelo en la clasificación completa, antes de los filtros siguientes. Arrastre el controlador de una fila, o use sus botones de subir y bajar, para cambiar su posición en esta tabla. **Actualizar** carga el orden de clasificación de nuevo.

Los controles se encuentran en tres tarjetas. **Clasificación** tiene el menú de prioridad (y el menú de proveedor cuando la configuración tiene más de un proveedor). **Filtros** tiene **Precio máximo de salida**, **Delta mínimo del índice** y **Actualizar**. **Acciones** tiene **Copiar JSON** y **Actualizar configuración**. Pulsa Intro en un campo numérico para actualizar la tabla. Cambiar un menú hace lo mismo.

**Precio máximo de salida** mantiene los modelos cuyo precio de salida por 1 millón de tokens es como máximo esa cantidad de USD. Un modelo sin precio de salida se excluye. **Delta mínimo del índice** mantiene un modelo solo cuando su índice está al menos esa cantidad de puntos por debajo del modelo anterior mantenido. El primer modelo restante siempre se mantiene. Deje cualquiera de las casillas vacías para omitir ese filtro.

Marca los modelos que quieras. La línea de estado muestra cuántos están seleccionados, por ejemplo `8 models selected.` El número estrecho en el encabezado de columna de casilla de verificación (predeterminado 8) indica cuántas filas principales selecciona esa casilla de verificación. Al marcarla, se seleccionan esas filas. Al desmarcarla, se desmarcan todas las casillas de verificación. Las filas marcadas, de arriba abajo, son el orden de reserva. **Actualizar configuración** pide confirmación, copia la configuración actual a `ai-i18n-tools.config.{timestamp}.backup.json` a su lado y luego escribe ese orden en `providers.<selected>.translationModels`. `uiModels` y `localeModels` permanecen sin cambios. **Copiar JSON** pone el mismo fragmento `{ "translationModels": [...] }` en el portapapeles. `suggest-models --apply` escribe el mismo tipo de copia de seguridad.

La primera carga descarga languagebench, Arena y models.dev cuando la caché está vacía, y puede llevar tiempo. Las cargas posteriores reutilizan la caché de 7 días en `<cacheDir>/benchmark-scores.json`. La pestaña no tiene botón de actualización. Actualice la caché desde la CLI con `ai-i18n-tools suggest-models --refresh` y, a continuación, recargue la pestaña. El mismo comando puede imprimir o aplicar la lista.

::: info Fuentes de referencia externas
  Las puntuaciones se calculan a partir de fuentes de datos externas:
  - [languagebench ChrF](https://languagebench.github.io/) con licencia CC-BY-SA-4.0,
  - [LMArena Arena Score](https://github.com/lm-arena/lm-arena) con licencia CC-BY-4.0, y
  - precios de [models.dev](https://models.dev/) con licencia MIT.
:::
