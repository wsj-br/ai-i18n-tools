<a id="cli-options"></a>
# Opciones de la CLI

Referencia para el comportamiento de la caché de `translate-docs`, los indicadores, el formato de solicitud por lotes y las claves de ruta internas de SQLite.

<a id="cache-behaviour-and-translate-docs-flags"></a>
## Comportamiento de la caché e indicadores de `translate-docs`

La CLI mantiene el **seguimiento de archivos** en SQLite (hash de origen por archivo × configuración regional) y las filas de **segmentos** (hash × configuración regional por fragmento traducible). Una ejecución normal omite un archivo por completo cuando el hash rastreado coincide con el origen actual, el archivo de salida ya existe **y** la hora de modificación de la salida es al menos tan reciente como la del origen; de lo contrario, procesa el archivo y utiliza la caché de segmentos para que el texto sin cambios no llame a la API.

| Bandera                         | Efecto                                                                                                                                                                                                                                                              |
|-------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| *(predeterminado)*              | Omite archivos sin cambios cuando la huella + la salida en disco coinciden; usa la caché de segmentos para el resto.                                                                                                                                                  |
| `-l, --locale <codes>`        | Configuraciones regionales de destino separadas por comas (cuando se omiten, los valores predeterminados coinciden con la unión de la raíz `targetLocales` y el `targetLocales` opcional de cada bloque `docs[]`).                                                                                                       |
| `-p, --path` / `-f, --file`   | Traduce únicamente markdown/JSON bajo esta ruta (relativa al proyecto, absoluta o patrón glob); `--file` es un alias para `--path`.                                                                                                                                 |
| `--dry-run`                   | Sin escritura de archivos ni llamadas a la API.                                                                                                                                                                                                                                        |
| `--type <kind>`               | Restringe a `markdown` o `json` (de lo contrario ambos cuando están habilitados en la configuración).                                                                                                                                                                                               |
| `--json-only` / `--no-json`   | Traduce solo archivos de etiquetas JSON, o salta JSON y traduce solo markdown.                                                                                                                                                                                              |
| `-j, --concurrency <n>`       | Número máximo de idiomas objetivo en paralelo (valor predeterminado desde la configuración o valor integrado por defecto en CLI).                                                                                                                                                                                              |
| `-b, --batch-concurrency <n>` | Número máximo de llamadas API por lotes en paralelo por archivo (documentos; valor predeterminado desde la configuración o CLI).                                                                                                                                                                                               |
| `--emphasis-placeholders`     | Enmascara los marcadores de énfasis de Markdown como marcadores de posición antes de la traducción. Se habilita automáticamente para las configuraciones regionales CJK y RTL a menos que se anule por bloque a través de `docs[].emphasisPlaceholders` o se deshabilite con `--no-emphasis-placeholders`.                                                                                                                                                                          |
| `--debug-failed`              | Escribe registros detallados `FAILED-TRANSLATION` en `cacheDir` cuando la validación falla.                                                                                                                                                                                        |
| `--force-update`              | Vuelve a procesar cada archivo coincidente (extrae, reensambla y escribe salidas) incluso cuando el seguimiento de archivos lo omitiría. **La caché de segmentos sigue aplicándose** — los segmentos sin cambios no se envían al LLM.                                                                                    |
| `--force`                     | Borra el seguimiento de archivos para cada archivo procesado y **no lee** la caché de segmentos para la traducción API (retraducción completa). Los nuevos resultados aún se **escriben** en la caché de segmentos.                                                                                 |
| `--stats`                     | Muestra recuentos de segmentos, recuentos de archivos rastreados y totales de segmentos por idioma, luego finaliza.                                                                                                                                                                                    |
| `--clear-cache [locale]`      | Elimina las traducciones en caché (y el seguimiento de archivos): todos los idiomas, o un solo idioma, luego finaliza.                                                                                                                                                                             |
| `--prompt-format <mode>`      | Cómo se envía cada **lote** de segmentos al modelo y se analiza (`xml`, `json-array`, o `json-object`). Por defecto `json-array`. No cambia la extracción, marcadores de posición, validación, caché ni el comportamiento de respaldo — véase [Formato de indicación por lotes](#batch-prompt-format). |

No puedes combinar `--force` con `--force-update` (son mutuamente excluyentes).

<a id="batch-prompt-format"></a>
## Formato de solicitud por lotes

`translate-docs` envía segmentos traducibles al proveedor de LLM activo en **lotes** (agrupados por `batchSize` / `maxBatchChars`). El indicador `--prompt-format` solo cambia el **formato de conexión** de ese lote; los tokens `PlaceholderHandler`, las comprobaciones AST de Markdown, las claves de caché de SQLite y la reserva por segmento cuando falla el análisis por lotes no cambian.

| Modo                   | Mensaje del usuario                                                           | Respuesta del modelo                                                 |
|------------------------|------------------------------------------------------------------------|-------------------------------------------------------------|
| `xml`                  | Pseudo-XML: un `<seg id="N">…</seg>` por segmento (con escape XML). | Solo bloques `<t id="N">…</t>`, uno por índice de segmento.       |
| `json-array` (por defecto) | Un array JSON de cadenas, una entrada por segmento en orden.               | Un array JSON de la **misma longitud** (mismo orden).           |
| `json-object`          | Un objeto JSON `{"0":"…","1":"…",…}` con clave por índice de segmento.            | Un objeto JSON con las **mismas claves** y valores traducidos. |

Algunos modelos siguen un formato de forma más fiable que otro, así que prueba un modo diferente si un modelo devuelve con frecuencia lotes mal formados o ID de segmento que no coinciden. `json-array` es el predeterminado porque es un formato común y sencillo que los modelos suelen manejar bien.

El encabezado de ejecución también imprime `Batch prompt format: …` para que pueda confirmar el modo activo. Los archivos de etiquetas JSON (`docusaurusCatalogDir`) y los lotes de archivos SVG usan la misma configuración cuando esos pasos se ejecutan como parte de `translate-docs` (o la fase de documentos de `sync` — `sync` no expone este indicador; su valor predeterminado es `json-array`).
