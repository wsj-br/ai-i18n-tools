<a id="cli--models--catalog"></a>
# CLI — Modelos y catálogo

<a id="check-models"></a>
### `check-models`

**Resumen:** `ai-i18n-tools check-models`

Valida cada id de modelo configurado contra la lista `GET /models` del proveedor activo (miembros y `expiration_date`). Requiere la clave de API del proveedor (ninguna para proveedores sin clave como Ollama). Sale con un código de salida distinto de cero cuando algún id configurado esté ausente o haya expirado, y respeta las `requestTimeoutMs` del proveedor. Cuando el proveedor devuelve precios (por ejemplo, OpenRouter), también muestra el precio en USD por 1 millón de tokens para el prompt/completado.

**Véase también:** [Proveedores de LLM](/guide/providers-and-models)

---

<a id="list-models"></a>
### `list-models`

**Resumen:** `ai-i18n-tools list-models`

Enumera todos los modelos que el proveedor activo anuncia a través de su lista `GET /models` (ordenados por id; el proveedor activo sigue la clave de configuración `provider`, anula con `-P` / `--provider`). Requiere la clave de API del proveedor (ninguna para proveedores sin clave como Ollama). Cuando el proveedor devuelve precios (por ejemplo, OpenRouter), también muestra el precio en USD por 1 millón de tokens para el prompt/completado y etiqueta las entradas pasadas `expiration_date`.

**Opciones clave:** `-P` / `--provider`

**Véase también:** [Proveedores de LLM](/guide/providers-and-models)

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
