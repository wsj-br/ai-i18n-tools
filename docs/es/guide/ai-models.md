<a id="ai-models"></a>
# Modelos de IA

Un modelo es un sistema con nombre en tu proveedor, como `google/gemini-2.5-flash` o `gpt-5-mini`. `init` escribe una lista `translationModels` de inicio para el proveedor que has elegido. Considera esa lista como un punto de partida.

Elige la lista para este proyecto con `suggest-models` o con la misma clasificación en el panel de traducción, en **Modelos**. Ambos clasifican los modelos de chat del proveedor activo a partir de benchmarks publicados y pueden escribir el resultado en `translationModels`. Primero, configura el proveedor y su clave de API: [Proveedores de LLM](/es/guide/providers-and-models).

<a id="start-with-a-ranked-list"></a>
## Comenzar con una lista clasificada

<a id="from-the-command-line"></a>
### Desde la línea de comandos

`suggest-models` clasifica los modelos de chat que el proveedor activo ofrece actualmente e imprime una tabla corta. La calidad es el valor predeterminado: el índice es languagebench ChrF y Arena Score. El precio es una columna separada y un orden de clasificación, no parte del índice.

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --top 10 --max-price 6
```

Las columnas son: rango, ID de modelo, índice, ChrF medido, puntuación Arena medida, precio de entrada, precio de salida, precio combinado en USD por 1M de tokens y nivel de frontera. Una medición faltante es `—`. El índice es la puntuación de calidad multiplicada por 100. Un índice más alto indica una mejor coincidencia para los idiomas de este proyecto. Un ID que repite el ChrF, la puntuación Arena y los precios de tokens de otra fila se omite de esta tabla. `--list` aún lo imprime.

Escriba esa lista en la configuración cuando la tabla se vea correcta:

```bash
ai-i18n-tools suggest-models --apply
ai-i18n-tools suggest-models --apply --top 10 --max-price 6
```

`--apply` reemplaza a `providers.<active>.translationModels`. Primero copia la configuración actual a un archivo `ai-i18n-tools.config.{timestamp}.backup.json` hermano. `uiModels` y `localeModels` permanecen como están. `--top` (predeterminado 8) es la cantidad de ID que incluyen la tabla y `--apply`. El primer ID es el que la traducción intenta primero. Para esa lista, agregue `--max-price` y `--min-delta`. El límite de precio evita que un modelo de reserva cueste más que el presupuesto, y la brecha de índice descarta un modelo que está solo un pequeño paso por debajo del que se mantiene por encima.

`--price` enumera primero los modelos más baratos en la frontera calidad-precio y aún mantiene un umbral de calidad, por lo que un modelo barato sin medición permanece por debajo de los modelos que tienen puntuaciones. `--quality` es el valor predeterminado. Pasar ambas banderas es un error.

<a id="from-the-dashboard"></a>
### Desde el panel de control

La pestaña **Modelos** muestra la misma clasificación, con una casilla de verificación en cada fila.

```bash
ai-i18n-tools dashboard
```

Abre **Modelos**. Elige **Calidad** o **Precio**. Marca las filas que quieras. Las filas marcadas, de arriba abajo, establecen el orden en que se probará la traducción. **Actualizar configuración** pide confirmación, escribe el mismo tipo de copia de seguridad y guarda ese orden en `translationModels`. **Copiar JSON** pone el fragmento `{ "translationModels": [...] }` en el portapapeles por si prefieres pegarlo tú mismo.

**Precio combinado máximo** y **Delta de índice mínimo** coinciden con `suggest-models --max-price` y `--min-delta`. Controles y columnas: [Pestaña Modelos](/es/guide/translation-dashboard/models).

<a id="how-the-ranking-chooses"></a>
### Cómo elige la clasificación

La lista es una clasificación de referencia del catálogo de chat en vivo del proveedor. La primera ejecución descarga tres conjuntos de datos públicos y puede tardar un tiempo. Las ejecuciones posteriores reutilizan la caché de 7 días.

| Señal | Lo que aporta | Fuente |
| --- | --- | --- |
| ChrF | Calidad de traducción para los idiomas de su proyecto | [languagebench](https://huggingface.co/spaces/fair-forward/languagebench) (CC BY-SA 4.0) |
| Puntuación Arena | Preferencia general de comparaciones directas | [Puntuación Arena de LMArena](https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset) (CC BY 4.0) |
| USD por 1 millón de tokens | Precio de entrada, salida y combinado `(3 × input + output) / 4` | El catálogo del proveedor cuando publica tarifas; de lo contrario, [models.dev](https://models.dev/) (MIT) |

A partir de estas señales, la clasificación deriva dos valores para cada modelo candidato: el índice de calidad (que combina ChrF y Arena Score) y el nivel de la [frontera de Pareto](https://en.wikipedia.org/wiki/Pareto_frontier) (que evalúa la calidad frente al precio combinado del token).

ChrF utiliza las puntuaciones de traducción de languagebench para tus `sourceLocale` y `targetLocales`. Las configuraciones regionales se asignan a un código de idioma de languagebench: la subetiqueta principal, con alias como `pt-BR` para `pt` y `zh-Hant` para `zh`. Un modelo que traduce bien esos idiomas supera en la clasificación a uno que solo obtiene una buena puntuación general. Se omiten los modelos de embeddings, imagen, voz y otros que no sean de chat, así como los ID que hayan superado su fecha de caducidad.

El índice es ChrF y Arena Score. El precio no forma parte de él. La puntuación pondera ChrF (55% por defecto) y Arena Score (45% por defecto), cada uno normalizado con respecto a la puntuación más alta en el catálogo de chat del proveedor, redondeado a un decimal en una escala de 0 a 100. Los valores sustitutos (`0.35` para ChrF, `0.45` para Arena) se aplican solo cuando falta una medición; la tabla imprime `—`.

El umbral de calidad es un umbral mínimo de ChrF (70% por defecto del mejor ChrF del conjunto de candidatos para calidad, y 60% para precio). Los modelos por debajo de este umbral, incluyendo cualquier modelo sin medición de ChrF, se ordenan después de los modelos que lo superan y muestran `—` en la columna de frontera. Calidad, el perfil predeterminado, ordena por el índice y resuelve índices iguales con el precio combinado más barato. Precio ordena los modelos por nivel de frontera (el nivel 1 el más barato primero, luego el nivel 2, y así sucesivamente). Los pesos y el umbral personalizados opcionales se encuentran en [`modelSuggestion`](/es/reference/configuration#modelsuggestion-optional).

Dos ID que comparten ChrF, Arena Score, precio de entrada y precio de salida son alias. Las sugerencias mantienen el ID más corto, y un ID sin fecha sobre uno que tiene una fecha, como `preview-06-05` o `20241022`. Los otros ID permanecen en la clasificación completa, por lo que `--list` aún puede mostrar un alias configurado, y se omiten de la tabla, `--json` y `--apply`.

<a id="reading-the-frontier-column"></a>
#### Lectura de la columna de frontera

La columna de frontera es un nivel, no una puntuación. Un modelo está dominado cuando otro modelo no cuesta más (precio combinado) y tiene al menos el mismo índice, y es estrictamente más barato o estrictamente más alto en el índice. Un `2` no es el doble de malo que un `1`, y los números de nivel no comparan la calidad entre filas: solo el índice hace eso. Dos filas pueden mostrar `3` y `4` y aún así estar a un punto del modelo de nivel 1 que las supera a ambas.

- `1` significa que ningún otro modelo es a la vez más barato y más alto en el índice. En `--price`, el nivel 1 va del más barato al más caro, y cada paso cuesta más y tiene un índice más alto. `--min-delta` oculta un paso que añade solo una pequeña ganancia.
- `2` significa que el modelo está dominado, pero solo por modelos de nivel 1. La línea debajo de la tabla nombra el modelo de nivel 1 que supera a cada fila dominada. Pasa el ratón sobre el valor en el panel para ver el mismo modelo.
- `3` y superiores siguen la misma regla un paso más abajo. Cuanto mayor sea el número, más larga será la cadena, no más lejos estará el índice del mejor modelo.
- `—` significa que el modelo no tiene precio, está por debajo del umbral de calidad, o es un alias de otra fila. No se compara.

El nivel 1 es una verificación de eficiencia: nada más es a la vez estrictamente más barato y de mayor puntuación. Un nivel superior aún puede pertenecer a la lista. La diversidad de proveedores, los límites de velocidad, la latencia y la ventana de contexto quedan fuera del índice, y un respaldo de otro proveedor sigue siendo útil cuando un modelo de nivel 1 está limitado por velocidad o rechaza un lote. Otro ID para el mismo modelo no ayuda con eso.

Un empate exacto que no es un alias (el mismo precio combinado y el mismo índice, con diferentes precios de token o diferentes puntuaciones) comparte el nivel. El índice se compara como se muestra en la tabla, redondeado a un decimal.

Los niveles se calculan sobre todo el catálogo, por lo que `--max-price`, `--min-delta` y `--top` ocultan filas sin renumerarlas. Un modelo que es de nivel 1 en la lista completa permanece como nivel 1 después de un límite de precio. `--max-price` elimina modelos por encima de un presupuesto. No elimina todas las filas dominadas por debajo del límite. La columna de frontera y la línea debajo de la tabla muestran esos.

`--price` lista el nivel 1 del más barato al más caro, luego el nivel 2 de la misma manera, y así sucesivamente. Calidad, el predeterminado, ordena por el índice y trata la columna de frontera como una etiqueta.

`suggest-models --refresh` vuelve a descargar los conjuntos de datos. Después, vuelve a cargar la pestaña **Modelos**.

Todas las marcas, incluidas `--json`, `--list` y la fórmula de puntuación: [suggest-models](/es/reference/cli-commands/models#suggest-models).

<a id="why-the-list-has-more-than-one-model"></a>
## ¿Por qué la lista tiene más de un modelo?

<a id="model-fallback-chain"></a>
### Cadena de reserva de modelos

`translationModels` es una lista ordenada. La CLI prueba el primer modelo. Si una solicitud falla, si recibe una respuesta que no puede analizar o texto en el sistema de escritura incorrecto, prueba el siguiente ID para ese lote.

Un ID es un único punto de fallo. Un modelo puede agotar el tiempo de espera, devolver texto que esta herramienta rechaza, o traducir un idioma bien y otro mal. Un caso común es el hindi romanizado donde `hi` espera Devanagari. La salida romanizada se rechaza para las configuraciones regionales con escritura nativa. Una configuración regional que deba permanecer romanizada necesita una subetiqueta `-Latn` explícita, como `hi-Latn`.

Por eso la lista contiene varios ID, los más fuertes primero. El orden en la lista es el orden que la traducción prueba.

**Niveles de resolución** (deduplicados, orden conservado):

| Canalización | Orden |
| --- | --- |
| UI (`translate-ui`, plurales, `proofread-ui`) | `localeModels(locale)` → `uiModels` → `translationModels` |
| Documentos, JSON, SVG | `localeModels(locale)` → `translationModels` |

La mayoría de los proyectos solo establecen `translationModels`. Las otras dos listas existen para cuando un tipo de texto o un idioma deba probar primero modelos diferentes.

**Cadenas de la IU.** El `uiModels` opcional se prueba después de cualquier anulación por configuración regional que coincida y antes de `translationModels`. El texto de la IU es corto y visible, por lo que una división común es usar un modelo más potente en esa cadena. `suggest-models --apply` solo escribe `translationModels`.

**Una configuración regional.** El `localeModels` opcional asigna una etiqueta BCP-47 a los modelos que se prueban primero para esa configuración regional en todas las canalizaciones (`pt-br` coincide con `pt-BR`). El japonés, el coreano y el chino suelen funcionar mejor con modelos ajustados para esas escrituras, como `z-ai/glm-5.3` y `minimax/minimax-m2.7`, que con un modelo de reserva de uso general. Cuando ninguna entrada coincide, solo se aplican los niveles de canalización superiores.

Ejemplo (OpenRouter). Los ID muestran la forma de las tres listas. Toma `translationModels` de `suggest-models` o de la pestaña **Modelos**. Añade `uiModels` o `localeModels` cuando el texto de la IU o una configuración regional necesiten su propia cadena.

```json
{
  "provider": "openrouter",
  "providers": {
    "openrouter": {
      "translationModels": [
        "google/gemini-2.5-flash",
        "deepseek/deepseek-v4-flash",
        "openai/gpt-5-mini"
      ],
      "uiModels": [
        "anthropic/claude-sonnet-latest",
        "openai/gpt-5.4"
      ],
      "localeModels": [
        { "locale": "ja", "models": ["z-ai/glm-5.3", "minimax/minimax-m2.7"] },
        { "locale": "ko", "models": ["z-ai/glm-5.3", "minimax/minimax-m2.7"] },
        { "locale": "zh-Hans", "models": ["z-ai/glm-5.3", "minimax/minimax-m2.7"] },
        { "locale": "zh-Hant", "models": ["z-ai/glm-5.3", "minimax/minimax-m2.7"] }
      ]
    }
  }
}
```

Listas preestablecidas de `init`, y la referencia de campo: [Configuración —](/es/reference/configuration#provider-and-providers) `provider` [y](/es/reference/configuration#provider-and-providers) `providers`.

<a id="check-list-and-benchmark"></a>
## Comprobar, listar y comparar rendimiento

Una vez que la lista está en la configuración, estos comandos la inspeccionan. La traducción puede ejecutarse antes de que los use.

<a id="check-models"></a>
### `check-models`

Confirma que cada ID configurado sigue siendo ofrecido por el proveedor activo.

```bash
ai-i18n-tools check-models
```

Llama al punto de conexión `GET /models` del proveedor, comprueba cada ID en `translationModels`, `uiModels` y `localeModels`, informa de los ID que faltan o que han superado `expiration_date` y finaliza con un valor distinto de cero si algún ID configurado no es válido. Cuando el proveedor publica los precios (OpenRouter y Cheaper Inference lo hacen), también muestra los USD por cada millón de tokens.

<a id="list-models"></a>
### `list-models`

Imprime el catálogo completo que anuncia el proveedor, ordenado por ID. Úsalo para buscar un ID que la clasificación haya omitido.

```bash
ai-i18n-tools list-models
```

<a id="bench-models"></a>
### `bench-models`

Traduce una muestra a través de cada modelo configurado de forma individual e imprime los tokens de entrada y salida, el tiempo de reloj y el coste en USD. `suggest-models` usa las puntuaciones publicadas anteriormente. `bench-models` llama a los modelos, por lo que gasta crédito de la API y muestra la latencia y el precio en tu cuenta.

```bash
ai-i18n-tools bench-models
```

Cada ID único de `translationModels`, `uiModels` y `localeModels` se ejecuta sin reserva. Anula la muestra o los ID para una comparación específica:

```bash
ai-i18n-tools bench-models --text "Hello world" --source en --target de --model openai/gpt-5-mini,google/gemini-2.5-flash
```

Detalles del comando: [CLI: modelos e idiomas](/es/reference/cli-commands/models).

<a id="further-reference"></a>
## Referencias adicionales

- [Proveedores de LLM](/es/guide/providers-and-models) — ajustes preestablecidos, claves de API y cambio de proveedores con `-P`.
- [Pestaña Modelos](/es/guide/translation-dashboard/models) — la misma clasificación en el panel de control.
- [Configuración —](/es/reference/configuration#provider-and-providers) `provider` [y](/es/reference/configuration#provider-and-providers) `providers` — `translationModels`, `uiModels`, `localeModels`, tiempos de espera y tarifas de coste.
- [suggest-models](/es/reference/cli-commands/models#suggest-models) — indicadores, filtros y la fórmula de puntuación.

::: info Fuentes de Referencia Externas
Las puntuaciones se calculan a partir de fuentes de datos externas:

- [languagebench ChrF](https://huggingface.co/spaces/fair-forward/languagebench) con licencia CC-BY-SA-4.0,
- [LMArena Arena Score](https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset) con licencia CC-BY-4.0, y
- [models.dev](https://models.dev/) precios con licencia MIT.
:::
