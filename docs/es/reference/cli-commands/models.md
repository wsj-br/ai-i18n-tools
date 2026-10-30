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

**Sinopsis:** `ai-i18n-tools suggest-models [--quality | --price] [--top <n>] [--json] [--apply] [--list] [--max-output-price <usd>] [--min-delta <points>] [--refresh]`

Clasifica los modelos de chat del proveedor activo e imprime los mejores (8 por defecto). Las columnas de la tabla, en orden, son: clasificación, ID del modelo, índice (la puntuación ponderada multiplicada por 100, un decimal), ChrF de languagebench medido, Puntuación de Arena medida, y precio de entrada y salida en USD por 1M de tokens. Una medición faltante es `—`. El comando necesita la clave API de ese proveedor (ninguna para proveedores sin clave como Ollama). El proveedor activo sigue la configuración `provider`; anúlala con `-P` / `--provider`.

Los candidatos provienen de la lista `GET /models` del proveedor. Cuando `providers.cheaperinference.zeroDataRetention` es verdadero, esa solicitud es `GET /v1/models?zdr=true`. Se omiten las filas caducadas y las filas que no son de chat (embeddings, voz, imagen, vídeo, moderación, rerankers). Si esa solicitud de catálogo falla, el comando termina con el código de salida 1.

`--quality` es el predeterminado. Prioriza ChrF y Arena Score por encima del precio. `--price` prioriza el precio por encima de esas puntuaciones y aun así mantiene un umbral de calidad, para que un modelo barato no medido no salte a la lista. Pasar ambas banderas es un error. No pasar ninguna significa calidad. Las ponderaciones opcionales de `modelSuggestion` en la configuración reemplazan cualquiera de los perfiles. Consulta [Configuración](/es/reference/configuration#modelsuggestion-optional). Las mismas ponderaciones son utilizadas por la [pestaña Modelos del panel de control](/es/guide/translation-dashboard/models).

ChrF es la media de las filas `translation_from` y `translation_to` de languagebench cuya métrica es `chrf`, limitada a `sourceLocale` y `targetLocales` de este proyecto. Las configuraciones regionales se asignan a un código de idioma de languagebench (la subetiqueta principal, con algunos alias como `pt-BR` a `pt` y `zh-Hant` a `zh` y `yue`). Un conjunto vacío utiliza `en`. Arena es la puntuación general de Arena de LMArena, no Elo.

El precio de clasificación es de `(3 × input + output) / 4` USD por 1M de tokens. Su origen se resuelve en este orden: una tarifa de catálogo distinta de cero, luego las tarifas de entrada y salida de models.dev, y luego la cifra de costo única de languagebench. Un precio de catálogo de `0` no tiene precio, no es gratuito. Un precio desconocido es neutral en el perfil de calidad y el peor en el perfil de precio.

Un ChrF faltante se ordena por debajo del umbral de calidad. Los sustitutos `0.35` y `0.45` utilizados para un ChrF o Arena faltante afectan solo al índice; la tabla imprime `—` en su lugar.

Las filas que superan el umbral van primero, luego un índice más alto, luego un precio combinado más barato. `--top` (por defecto `8`, un número entero de al menos 1) limita la tabla, el fragmento `--json` y `--apply` juntos, después de los filtros siguientes.

`--list` imprime las mismas columnas para los `translationModels` configurados del proveedor activo, en ese orden, e ignora `--top`. La columna de rango sigue siendo la posición de cada modelo en la clasificación completa. Un ID configurado que no esté en el catálogo, que haya caducado o que no sea un modelo de chat se sigue listando, con `—` para las mediciones. `--list` no se puede combinar con `--apply`.

`--max-output-price` mantiene los modelos cuyo precio de salida por cada millón de tokens es menor o igual a esa cantidad en USD. Se excluye cualquier modelo sin precio de salida. `--min-delta` recorre entonces las filas restantes y mantiene un modelo solo cuando su índice es al menos esa cantidad de puntos inferior al modelo anterior conservado. El primer modelo restante siempre se conserva. Un delta de `0` no descarta filas. Las filas sin índice se excluyen cuando el delta es mayor que `0`. Los números de rango siguen siendo los de la lista completa. Con `--list`, el recorrido sigue el orden `translationModels`. Ambos filtros también se aplican a `--json` y `--apply`. La [pestaña Modelos](/es/guide/translation-dashboard/models) tiene los mismos dos controles.

`--json` escribe este objeto en stdout (péguelo dentro del bloque del proveedor) y envía la tabla y el pie de página de atribución a stderr:

```json
{
  "translationModels": ["model-a", "model-b"]
}
```

`--apply` copia la configuración actual a un `ai-i18n-tools.config.{timestamp}.backup.json` hermano (o `{name}.{timestamp}.backup.json` cuando `-c` nombra otro archivo), luego reemplaza `providers.<active>.translationModels` con esos ID. Una colisión de nombres añade `-2`, `-3`, y así sucesivamente antes de `.backup.json`. Si la copia falla, el archivo de configuración permanece sin cambios. `uiModels` y `localeModels` permanecen sin cambios. Las puntuaciones no se escriben en el archivo de configuración. El botón **Actualizar configuración** del panel de control escribe la misma copia de seguridad.

Los datos de referencia se almacenan en caché en `<cacheDir>/benchmark-scores.json` (normalmente `.translation-cache/benchmark-scores.json`) durante siete días. Los conjuntos de datos sin procesar se descargan en tiempo de ejecución y no se incluyen en el paquete. `--refresh` vuelve a descargar languagebench, Arena y models.dev. Una fuente que falla durante `--refresh` no se rellena desde la caché anterior. Sin `--refresh`, una descarga fallida reutiliza la porción en caché. Si uno de languagebench o Arena falla, el comando clasifica con el otro e indica qué fuente falló. Si ambos fallan, sale con código 1. Un fallo de models.dev deja los precios del catálogo en su lugar. El panel de control no tiene control de actualización; ejecuta `--refresh` desde la CLI y luego recarga la pestaña Modelos.

El pie de página atribuye languagebench (CC BY-SA 4.0), LMArena Arena Score (CC BY 4.0) y models.dev (MIT).

**Opciones clave:** `--quality`, `--price`, `--top`, `--json`, `--apply`, `--list`, `--max-output-price`, `--min-delta`, `--refresh`, `-P` / `--provider`

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
