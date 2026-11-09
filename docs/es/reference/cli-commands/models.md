<a id="cli--models--languages"></a>
# CLI — Modelos e idiomas

<a id="check-models"></a>
### `check-models`

**Resumen:** `ai-i18n-tools check-models`

Valida cada ID de modelo configurado con la lista `GET /models` del proveedor activo (pertenencia y `expiration_date`). Requiere la clave de API de ese proveedor (ninguna para proveedores sin clave como Ollama). Termina con un código de salida distinto de cero cuando falta o ha caducado algún ID configurado, y respeta el tiempo de espera de la solicitud resuelto (`requestTimeout` o `requestTimeoutMs` en el proveedor; de lo contrario, el valor de nivel superior). Cuando el proveedor devuelve precios (por ejemplo, OpenRouter), también muestra USD por 1M de tokens para prompt/completion. Cuando `providers.cheaperinference.zeroDataRetention` es verdadero, la comprobación usa `GET /v1/models?zdr=true` y falla un ID que el catálogo omite.

**Véase también:** [Modelos de IA](/es/guide/ai-models#check-models), [Proveedores de LLM](/es/guide/providers-and-models)

---

<a id="list-models"></a>
### `list-models`

**Resumen:** `ai-i18n-tools list-models`

Lista todos los modelos que el proveedor activo anuncia a través de su lista `GET /models` (ordenados por ID; el proveedor activo sigue la clave de configuración `provider`, anular con `-P` / `--provider`). Requiere la clave de API de ese proveedor (ninguna para proveedores sin clave como Ollama). Cuando el proveedor devuelve precios (por ejemplo, OpenRouter), también muestra USD por 1M de tokens para prompt/completion, y etiqueta las entradas posteriores a `expiration_date`. Cuando `providers.cheaperinference.zeroDataRetention` es verdadero, la lista es `GET /v1/models?zdr=true`.

**Opciones clave:** `-P` / `--provider`

**Véase también:** [Modelos de IA](/es/guide/ai-models#list-models), [Proveedores de LLM](/es/guide/providers-and-models)

---

<a id="suggest-models"></a>
### `suggest-models`

**Sinopsis:** `ai-i18n-tools suggest-models [--quality | --price] [--top <n>] [--json] [--apply] [--list] [--max-price <usd>] [--min-delta <points>] [--refresh]`

Clasifica los modelos de chat del proveedor activo e imprime los principales (8 por defecto). Las columnas de la tabla, en orden, son: clasificación, ID de modelo, índice (puntuación de calidad multiplicada por 100, un decimal), ChrF de languagebench medido, Puntuación de Arena medida, precio de entrada, precio de salida, precio combinado en USD por 1M de tokens y nivel de frontera. Una medición faltante es `—`. El comando necesita la clave API de ese proveedor (ninguna para proveedores sin clave como Ollama). El proveedor activo sigue la configuración `provider`; anúlala con `-P` / `--provider`.

Los candidatos provienen de la lista `GET /models` del proveedor. Cuando `providers.cheaperinference.zeroDataRetention` es verdadero, esa solicitud es `GET /v1/models?zdr=true`. Se omiten las filas caducadas y las filas que no son de chat (embeddings, voz, imagen, vídeo, moderación, rerankers). Si esa solicitud de catálogo falla, el comando termina con el código de salida 1.

El índice es solo de calidad: ChrF de languagebench y Puntuación de Arena. El precio no forma parte del índice. `--quality` es el valor predeterminado. Ordena por índice y luego por el precio combinado más económico cuando dos modelos muestran el mismo índice. `--price` enumera la frontera de Pareto de calidad-precio, con los más económicos primero. Un modelo está dominado cuando otro modelo no cuesta más y tiene al menos el mismo índice, y es estrictamente más económico o estrictamente superior en el índice. Un empate exacto en precio combinado e índice comparte el nivel. Los modelos no dominados son de nivel 1, luego nivel 2, y así sucesivamente. El nivel es esa profundidad, no la distancia desde el mejor índice. Los modelos sin precio, y luego los modelos por debajo del umbral de calidad, siguen la frontera. Pasar ambas banderas es un error. No pasar ninguna significa calidad. Los pesos opcionales `modelSuggestion` en la configuración reemplazan la mezcla ChrF/Arena y el umbral de calidad de cualquiera de los perfiles. Consulta [Configuración](/es/reference/configuration#modelsuggestion-optional). La misma clasificación es utilizada por la [pestaña Modelos del panel de control](/es/guide/translation-dashboard/models).

ChrF es la media de las filas `translation_from` y `translation_to` de languagebench cuya métrica es `chrf`, limitada a `sourceLocale` y `targetLocales` de este proyecto. Las configuraciones regionales se asignan a un código de idioma de languagebench (la subetiqueta principal, con algunos alias como `pt-BR` a `pt` y `zh-Hant` a `zh` y `yue`). Un conjunto vacío utiliza `en`. Arena es la puntuación general de Arena de LMArena, no Elo.

El precio combinado es de `(3 × input + output) / 4` USD por 1M de tokens. Su origen se resuelve en este orden: una tarifa de catálogo no nula, luego las tarifas de entrada y salida de models.dev, y luego la cifra de costo única de languagebench. Un precio de catálogo de `0` no tiene precio, no es gratuito. Un precio desconocido no cambia el índice. En `--quality` se ordena al final entre índices iguales. En `--price`, un modelo sin precio que supera el umbral viene después de cada nivel de frontera.

Un ChrF faltante se ordena por debajo del umbral de calidad. Los valores de marcador de posición `0.35` y `0.45` utilizados cuando falta ChrF o Arena afectan solo al índice; la tabla imprime `—` en su lugar. La columna `frontier` es `1` para un modelo con precio no dominado que supera el umbral, `2` para el siguiente nivel, y `—` cuando el modelo no tiene precio, está por debajo del umbral o es un alias. Dos ID que comparten ChrF, Puntuación de Arena, precio de entrada y precio de salida son alias. Se mantiene el ID más corto, y un ID sin fecha prevalece sobre uno con fecha (`preview-06-05`, `20241022`). Las filas de alias permanecen en la clasificación completa y se excluyen de la tabla, `--json` y `--apply`. `--list` todavía las muestra. Cuando las filas impresas incluyen un modelo dominado, una línea debajo de la tabla nombra el modelo de nivel 1 que lo supera.

`--quality` coloca primero los modelos que superan el umbral, luego los de índice más alto, y luego los de precio combinado más barato. `--top` (valor predeterminado `8`, un número entero de al menos 1) limita la tabla, el fragmento `--json` y `--apply` juntos, después de los filtros siguientes.

`--list` imprime las mismas columnas para los `translationModels` configurados del proveedor activo, en ese orden, e ignora `--top`. La columna de rango sigue siendo la posición de cada modelo en la clasificación completa. Un ID configurado que no esté en el catálogo, que haya caducado o que no sea un modelo de chat se sigue listando, con `—` para las mediciones. `--list` no se puede combinar con `--apply`.

Las filas de alias se eliminan primero, excepto con `--list`. `--max-price` luego mantiene los modelos cuyo precio combinado por 1M de tokens es menor o igual a esa cantidad de USD. Se excluye un modelo sin precio combinado. `--min-delta` luego recorre las filas restantes y mantiene un modelo solo cuando su índice difiere del modelo mantenido anterior en al menos esa cantidad de puntos. El primer modelo restante siempre se mantiene. Un delta de `0` no elimina filas. Las filas sin índice se excluyen cuando el delta es mayor que `0`. Los números de clasificación se mantienen los de la lista completa. Con `--list`, el recorrido sigue el orden `translationModels` y mantiene los alias. Ambos filtros también se aplican a `--json` y `--apply`. Para una lista de calidad que se aplicará, `--max-price` mantiene una alternativa dentro de un presupuesto y `--min-delta` elimina un pequeño paso de índice. Una fila dominada por debajo del límite puede permanecer; la columna de frontera y la línea debajo de la tabla lo muestran. La [pestaña Modelos](/es/guide/translation-dashboard/models) tiene los mismos dos controles y también omite los alias.

`--json` escribe este objeto en stdout (péguelo dentro del bloque del proveedor) y envía la tabla y el pie de página de atribución a stderr:

```json
{
  "translationModels": ["model-a", "model-b"]
}
```

`--apply` copia la configuración actual a un `ai-i18n-tools.config.{timestamp}.backup.json` hermano (o `{name}.{timestamp}.backup.json` cuando `-c` nombra otro archivo), luego reemplaza `providers.<active>.translationModels` con esos ID. Una colisión de nombres añade `-2`, `-3`, y así sucesivamente antes de `.backup.json`. Si la copia falla, el archivo de configuración permanece sin cambios. `uiModels` y `localeModels` permanecen sin cambios. Las puntuaciones no se escriben en el archivo de configuración. El botón **Actualizar configuración** del panel de control escribe la misma copia de seguridad.

Los datos de referencia se almacenan en caché en `<cacheDir>/benchmark-scores.json` (normalmente `.translation-cache/benchmark-scores.json`) durante siete días. Los conjuntos de datos sin procesar se descargan en tiempo de ejecución y no se incluyen en el paquete. `--refresh` vuelve a descargar languagebench, Arena y models.dev. Una fuente que falla durante `--refresh` no se rellena desde la caché anterior. Sin `--refresh`, una descarga fallida reutiliza la porción en caché. Si uno de languagebench o Arena falla, el comando clasifica con el otro e indica qué fuente falló. Si ambos fallan, sale con código 1. Un fallo de models.dev deja los precios del catálogo en su lugar. El panel de control no tiene control de actualización; ejecuta `--refresh` desde la CLI y luego recarga la pestaña Modelos.

El pie de página atribuye languagebench (CC BY-SA 4.0), LMArena Arena Score (CC BY 4.0) y models.dev (MIT).

**Opciones clave:** `--quality`, `--price`, `--top`, `--json`, `--apply`, `--list`, `--max-price`, `--min-delta`, `--refresh`, `-P` / `--provider`

**Véase también:** [Modelos de IA](/es/guide/ai-models), [Pestaña Modelos](/es/guide/translation-dashboard/models)

---

<a id="bench-models"></a>
### `bench-models`

**Resumen:** `ai-i18n-tools bench-models [--model <ids>] [--text <text> | --file <path>] [--source <locale>] [--target <locale>]`

Realiza un benchmark de cada modelo configurado traduciendo una muestra en aislamiento (cliente de un solo modelo, sin cadena de respaldo). Imprime una tabla con el id del modelo, tokens de entrada/salida, tiempo de traducción en el reloj de pared y costo en USD (`—` para proveedores que no informan el costo), más una fila de totales y fallos por modelo.

Los modelos predeterminados son la unión de los id `translationModels`, `uiModels` y `localeModels` del proveedor activo (anula con `--model`); la muestra predeterminada es un bloque de markdown en inglés integrado (anula con `--text` / `--file`); la fuente/destino predeterminadas son la configuración `sourceLocale` y la primera `docs[]` configuración de idioma de destino, con un valor predeterminado de `targetLocales` (anula con `--source` / `--target`). Ejecuta los modelos en paralelo, limitado por la configuración `concurrency` (predeterminado 4); cada modelo sigue siendo cronometrado individualmente. Requiere la clave de API del proveedor activo.

**Opciones clave:** `--model`, `--text`, `--file`, `--source`, `--target`

**Véase también:** [Modelos de IA](/es/guide/ai-models#bench-models)

---

<a id="list-languages"></a>
### `list-languages`

**Resumen:** `ai-i18n-tools list-languages [search]`

Enumera el catálogo de idiomas de la interfaz de usuario integrada (`data/ui-languages-complete.json`) como una tabla legible para humanos (código, dirección del texto, nombre en inglés, nombre nativo). No requiere configuración ni clave de API. Puede pasar un término `search` opcional para conservar solo las entradas cuyo código, nombre nativo, nombre en inglés o dirección contengan el término (sin distinguir mayúsculas y minúsculas), por ejemplo `list-languages portuguese`, `list-languages rtl`, `list-languages zh`.
