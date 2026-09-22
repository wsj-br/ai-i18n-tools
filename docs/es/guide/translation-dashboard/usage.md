<a id="usage--costs"></a>
# Uso y costos

La pestaña **Uso y costos** resume las llamadas a la API de modelos facturadas que ha realizado este proyecto —incluidos los reintentos que luego se descartaron— con el recuento de tokens y un único costo en USD.

Los mismos agregados están disponibles en la línea de comandos como `ai-i18n-tools usage`.

Úselo para responder: *¿cuántas llamadas hicimos, qué modelos y operaciones gastaron tokens y cuánto costó?*

<a id="what-is-recorded"></a>
## Qué se registra

Cada fila de detalles es una finalización HTTP que devolvió el uso (incluso si la traducción fue rechazada posteriormente por análisis/script/calidad y se probó el siguiente modelo de respaldo). Los fallos de transporte que nunca produjeron un cuerpo facturado no se registran.

Después de que finaliza un comando que llamó a la API, las filas anteriores a **siete días calendario UTC completos** (desde las 00:00 UTC de hoy menos 7 días) se agrupan en totales mensuales (`api_totals`) y se eliminan del registro de detalles. La última semana se mantiene como filas `api_calls` individuales. Las tablas de resumen combinan ambas fuentes para el intervalo de tiempo seleccionado.

<a id="cost-reporting"></a>
## Informes de costes

Cada llamada, tarjeta de resumen y tabla muestra **un** coste en USD:

1. El `usage.cost` del proveedor cuando la respuesta lo incluía (OpenRouter hoy).
2. De lo contrario, el importe de `providers.<name>.modelPricing` o el valor predeterminado `pricing` de todo el proveedor, aplicado a los tokens de entrada y salida de esa llamada.

Las nuevas llamadas almacenan esa cantidad en la fila `api_calls`. Las filas más antiguas que se almacenaron sin un coste se valoran de la misma manera cuando se abre el informe, y luego se añaden a la misma cifra de Coste; no se muestran como una segunda columna. Si ninguna de las fuentes se aplica, la celda es `—`, nunca `$0.00`. Cambiar las tarifas configuradas posteriormente no reescribe las filas que ya tienen un coste almacenado. Los resúmenes mensuales aún mantienen un recuento de las llamadas que almacenaron un coste (`ncost_acc` / `ncost_dis`) para que `$0.00` se mantenga distinto de "desconocido" después de la compactación.

<a id="filters"></a>
## Filtros

Filtre por ventana de tiempo, proveedor, modelo, operación (`translate-docs`, `translate-ui`, `translate-json`, `translate-svg`, `proofread-ui`, `bench-models`), configuración regional y resultado (aceptado vs. descartado).

Ventanas de tiempo:

- Los rangos cortos (`Last 30 minutes` a `Last 30 days`) utilizan duraciones móviles. **Uso a lo largo del tiempo** muestra una fila por día natural UTC que aún tiene detalles en ese rango.
- `Last 2 months` / `Last 3 months` comienzan a las 00:00 UTC del primer día del mes natural actual menos 1 / 2 meses. **Uso a lo largo del tiempo** muestra las filas diarias retenidas más una fila por mes.
- `All time` incluye cada total mensual y las filas diarias retenidas.

Para eliminar el uso antiguo, elija un período en **Eliminar entradas anteriores a** (`> 1 month`, `> 2 months`, `> 3 months`, `> 6 months`, `> 1 year` o `all data (clear)`) y luego **Eliminar datos**. El menú comienza en `-`, lo que deja **Eliminar datos** deshabilitado hasta que se elige un período. Los mismos períodos están disponibles como `ai-i18n-tools usage --clear [--older-than 1mo|2mo|3mo|6mo|1y|all]`. Los límites de calendario conservan el mes actual (`1mo`) o el mes actual más los meses anteriores.

<a id="command-line"></a>
## Línea de comandos

```bash
ai-i18n-tools usage
# ai-i18n-tools usage --since 7d --operation translate-docs
# ai-i18n-tools usage --since 2mo
# ai-i18n-tools usage --clear --older-than 3mo --dry-run
```
