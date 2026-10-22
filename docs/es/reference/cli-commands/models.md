<a id="cli--models--languages"></a>
# CLI — Modelos e idiomas

<a id="check-models"></a>
### `check-models`

**Resumen:** `ai-i18n-tools check-models`

Valide cada ID de modelo configurado con la lista `GET /models` del proveedor activo (pertenencia y `expiration_date`). Requiere la clave API de ese proveedor (ninguna para proveedores sin clave como Ollama). Sale con un valor distinto de cero cuando falta o ha caducado algún ID configurado, y respeta el tiempo de espera de la solicitud resuelto (`requestTimeout` o `requestTimeoutMs` en el proveedor, de lo contrario el valor de nivel superior). Cuando el proveedor devuelve precios (por ejemplo, OpenRouter), también muestra USD por 1M de tokens para la solicitud/finalización.

**Véase también:** [Proveedores de LLM](/es/guide/providers-and-models)

---

<a id="list-models"></a>
### `list-models`

**Resumen:** `ai-i18n-tools list-models`

Enumera todos los modelos que el proveedor activo anuncia a través de su lista `GET /models` (ordenados por id; el proveedor activo sigue la clave de configuración `provider`, anula con `-P` / `--provider`). Requiere la clave de API del proveedor (ninguna para proveedores sin clave como Ollama). Cuando el proveedor devuelve precios (por ejemplo, OpenRouter), también muestra el precio en USD por 1 millón de tokens para el prompt/completado y etiqueta las entradas pasadas `expiration_date`.

**Opciones clave:** `-P` / `--provider`

**Véase también:** [Proveedores de LLM](/es/guide/providers-and-models)

---

<a id="suggest-models"></a>
### `suggest-models`

**Sinopsis:** `ai-i18n-tools suggest-models [--quality | --price] [--top <n>] [--json] [--apply] [--list] [--max-output-price <usd>] [--min-delta <points>] [--refresh]`

Clasifica los modelos de chat del proveedor activo y muestra los mejores (por defecto, 5). Las columnas de la tabla, en orden, son: rango, ID del modelo, índice (puntuación ponderada multiplicada por 100, con un decimal), ChrF de languagebench medido, puntuación Arena medida, y precio de entrada y salida en USD por cada millón de tokens. Una medición ausente se muestra como `—`. El comando requiere la clave de API de dicho proveedor (ninguna para proveedores sin clave como Ollama). El proveedor activo sigue la configuración `provider`; puede anularla con `-P` / `--provider`.

Los candidatos provienen de la lista `GET /models` del proveedor. Se excluyen las filas caducadas y las que no son de chat (embeddings, voz, imagen, vídeo, moderación, rerankers). Si la solicitud de catálogo falla, el comando termina con código 1.

`--quality` es el valor predeterminado. Pondera el ChrF y la puntuación Arena por encima del precio. `--price` pondera el precio por encima de dichas puntuaciones y mantiene un umbral de calidad, de modo que un modelo barato sin medir no ascienda en la lista. Pasar ambas banderas es un error. No pasar ninguna implica calidad. Las ponderaciones opcionales `modelSuggestion` en la configuración reemplazan a cualquiera de los perfiles. Consulte [Configuración](/es/reference/configuration#modelsuggestion). Las mismas ponderaciones se utilizan en la [pestaña Modelos del panel de control](/es/guide/translation-dashboard/models).

ChrF es la media de las filas `translation_from` y `translation_to` de languagebench cuya métrica es `chrf`, limitada a `sourceLocale` y `targetLocales` de este proyecto. Las configuraciones regionales se asignan a un código de idioma de languagebench (el subetiqueta principal, con algunos alias como `pt-BR` a `pt` y `zh-Hant` a `zh` y `yue`). Un conjunto vacío utiliza `en`. Arena es la puntuación Arena general de LMArena, no Elo. El precio de clasificación es `(3 × input + output) / 4` USD por cada millón de tokens. La fuente del precio es una tarifa de catálogo distinta de cero, seguida de las tarifas de entrada y salida de models.dev, y finalmente la cifra de coste único de languagebench. Un precio de catálogo de `0` indica que no tiene precio, no que sea gratuito. Un precio desconocido es neutral en el perfil de calidad y el peor en el perfil de precio. Un ChrF ausente se clasifica por debajo del umbral de calidad. Los sustitutos `0.35` y `0.45` utilizados para un ChrF o Arena ausente solo afectan al índice; la tabla imprime `—` en su lugar.

Las filas que superan el umbral aparecen primero, seguidas de un índice mayor y luego un precio combinado más barato. `--top` (por defecto `5`, un número entero de al menos 1) limita la tabla, el fragmento `--json` y `--apply` juntos, después de aplicar los filtros siguientes.

`--list` imprime las mismas columnas para los `translationModels` configurados del proveedor activo, en ese orden, e ignora `--top`. La columna de rango sigue siendo la posición de cada modelo en la clasificación completa. Un ID configurado que no esté en el catálogo, que haya caducado o que no sea un modelo de chat se sigue listando, con `—` para las mediciones. `--list` no se puede combinar con `--apply`.

`--max-output-price` mantiene los modelos cuyo precio de salida por cada millón de tokens es menor o igual a esa cantidad en USD. Se excluye cualquier modelo sin precio de salida. `--min-delta` recorre entonces las filas restantes y mantiene un modelo solo cuando su índice es al menos esa cantidad de puntos inferior al modelo anterior conservado. El primer modelo restante siempre se conserva. Un delta de `0` no descarta filas. Las filas sin índice se excluyen cuando el delta es mayor que `0`. Los números de rango siguen siendo los de la lista completa. Con `--list`, el recorrido sigue el orden `translationModels`. Ambos filtros también se aplican a `--json` y `--apply`. La [pestaña Modelos](/es/guide/translation-dashboard/models) tiene los mismos dos controles.

`--json` escribe este objeto en stdout (péguelo dentro del bloque del proveedor) y envía la tabla y el pie de página de atribución a stderr:

```json
{
  "translationModels": ["model-a", "model-b"]
}
```

`--apply` reemplaza `providers.<active>.translationModels` con esos IDs. `uiModels` y `localeModels` se dejan sin cambios. Las puntuaciones no se escriben en el archivo de configuración.

Los datos de referencia se almacenan en caché en `<cacheDir>/benchmark-scores.json` (normalmente `.translation-cache/benchmark-scores.json`) durante 7 días. Los conjuntos de datos sin procesar se descargan en tiempo de ejecución y no se incluyen en el paquete. `--refresh` vuelve a descargar languagebench, Arena y models.dev. Una fuente que falle durante `--refresh` no se completa desde la caché anterior. Sin `--refresh`, una descarga fallida reutiliza el fragmento almacenado en caché. Si falla languagebench o Arena, el comando realiza la clasificación con el otro y especifica qué fuente falló. Si ambos fallan, sale con código 1. Un fallo en models.dev mantiene los precios del catálogo tal cual. El panel no tiene control de actualización; ejecute `--refresh` desde la CLI y, a continuación, recargue la pestaña Models.

El pie de página atribuye languagebench (CC BY-SA 4.0), LMArena Arena Score (CC BY 4.0) y models.dev (MIT).

**Opciones clave:** `--quality`, `--price`, `--top`, `--json`, `--apply`, `--list`, `--max-output-price`, `--min-delta`, `--refresh`, `-P` / `--provider`

**Véase también:** [Proveedores de LLM](/es/guide/providers-and-models), [Pestaña Models](/es/guide/translation-dashboard/models)

---

<a id="bench-models"></a>
### `bench-models`

**Resumen:** `ai-i18n-tools bench-models [--model <ids>] [--text <text> | --file <path>] [--source <locale>] [--target <locale>]`

Realiza un benchmark de cada modelo configurado traduciendo una muestra en aislamiento (cliente de un solo modelo, sin cadena de respaldo). Imprime una tabla con el id del modelo, tokens de entrada/salida, tiempo de traducción en el reloj de pared y costo en USD (`—` para proveedores que no informan el costo), más una fila de totales y fallos por modelo.

Los modelos predeterminados son la unión de los id `translationModels`, `uiModels` y `localeModels` del proveedor activo (anula con `--model`); la muestra predeterminada es un bloque de markdown en inglés integrado (anula con `--text` / `--file`); la fuente/destino predeterminadas son la configuración `sourceLocale` y la primera `docs[]` configuración de idioma de destino, con un valor predeterminado de `targetLocales` (anula con `--source` / `--target`). Ejecuta los modelos en paralelo, limitado por la configuración `concurrency` (predeterminado 4); cada modelo sigue siendo cronometrado individualmente. Requiere la clave de API del proveedor activo.

**Opciones clave:** `--model`, `--text`, `--file`, `--source`, `--target`

---

<a id="list-languages"></a>
### `list-languages`

**Resumen:** `ai-i18n-tools list-languages [search]`

Enumera el catálogo de idiomas de la interfaz de usuario integrada (`data/ui-languages-complete.json`) como una tabla legible para humanos (código, dirección del texto, nombre en inglés, nombre nativo). No requiere configuración ni clave de API. Puede pasar un término `search` opcional para conservar solo las entradas cuyo código, nombre nativo, nombre en inglés o dirección contengan el término (sin distinguir mayúsculas y minúsculas), por ejemplo `list-languages portuguese`, `list-languages rtl`, `list-languages zh`.
