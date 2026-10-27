<a id="ai-models"></a>
# Modelos de IA

Un modelo es un sistema con nombre en tu proveedor, como `google/gemini-2.5-flash` o `gpt-5-mini`. `init` escribe una lista `translationModels` de inicio para el proveedor que has elegido. Considera esa lista como un punto de partida.

Elige la lista para este proyecto con `suggest-models` o con la misma clasificación en el panel de traducción, en **Modelos**. Ambos clasifican los modelos de chat del proveedor activo a partir de benchmarks publicados y pueden escribir el resultado en `translationModels`. Primero, configura el proveedor y su clave de API: [Proveedores de LLM](/es/guide/providers-and-models).

<a id="suggest-models"></a>
## Empezar con una preselección clasificada

<a id="suggest-models-cli"></a>
### Desde la línea de comandos

`suggest-models` clasifica los modelos de chat que el proveedor activo ofrece actualmente e imprime una tabla breve. La calidad es la opción predeterminada: las mediciones de traducción y una puntuación de preferencia general cuentan más que el precio.

```bash
ai-i18n-tools suggest-models
```

Las columnas son la clasificación, el ID del modelo, el índice, el ChrF medido, la puntuación Arena medida y el precio de entrada y salida en USD por cada millón de tokens. Una medición que falta es `—`. El índice es la puntuación ponderada multiplicada por 100. En la clasificación por calidad, un índice más alto indica una mayor compatibilidad con este proyecto.

Escribe esa preselección en la configuración cuando la tabla se vea bien:

```bash
ai-i18n-tools suggest-models --apply
```

`--apply` reemplaza a `providers.<active>.translationModels`. Primero, copia la configuración actual a un archivo `ai-i18n-tools.config.{timestamp}.backup.json` en el mismo directorio. `uiModels` y `localeModels` se mantienen como están. `--top` (8 por defecto) es el número de ID que incluyen la tabla y `--apply`. El primer ID es el que la traducción prueba primero.

`--price` prioriza una tarifa más baja y aun así mantiene un mínimo de calidad, por lo que un modelo barato sin medición se mantiene por debajo de los modelos que sí tienen puntuaciones. `--quality` es la opción predeterminada. Pasar ambos indicadores es un error.

<a id="suggest-models-dashboard"></a>
### Desde el panel

La pestaña **Modelos** muestra la misma clasificación, con una casilla de verificación en cada fila.

```bash
ai-i18n-tools dashboard
```

Abre **Modelos**. Elige **Calidad** o **Precio**. Marca las filas que quieras. Las filas marcadas, de arriba abajo, establecen el orden en que se probará la traducción. **Actualizar configuración** pide confirmación, escribe el mismo tipo de copia de seguridad y guarda ese orden en `translationModels`. **Copiar JSON** pone el fragmento `{ "translationModels": [...] }` en el portapapeles por si prefieres pegarlo tú mismo.

**Precio máximo de salida** y **Delta de índice mínimo** se corresponden con `suggest-models --max-output-price` y `--min-delta`. Controles y columnas: [Pestaña Modelos](/es/guide/translation-dashboard/models).

<a id="how-models-are-ranked"></a>
### Cómo elige la clasificación

La preselección es una clasificación de benchmarks del catálogo de chat en vivo del proveedor. La primera ejecución descarga tres conjuntos de datos públicos y puede tardar un rato. Las ejecuciones posteriores reutilizan la caché de 7 días en `<cacheDir>/benchmark-scores.json` (normalmente `.translation-cache/benchmark-scores.json`).

| Señal | Qué aporta | Fuente |
| --- | --- | --- |
| ChrF | Calidad de la traducción para los idiomas de tu proyecto | [languagebench](https://languagebench.github.io/) (CC BY-SA 4.0) |
| Arena Score | Preferencia general a partir de comparaciones directas | [LMArena Arena Score](https://github.com/lm-arena/lm-arena) (CC BY 4.0) |
| USD por cada millón de tokens | Precio de entrada y salida | El catálogo del proveedor cuando publica las tarifas; si no, [models.dev](https://models.dev/) (MIT) |

ChrF utiliza las puntuaciones de traducción de languagebench para tus `sourceLocale` y `targetLocales`. Las configuraciones regionales se asignan a un código de idioma de languagebench: la subetiqueta principal, con alias como `pt-BR` para `pt` y `zh-Hant` para `zh`. Un modelo que traduce bien esos idiomas supera en la clasificación a uno que solo obtiene una buena puntuación general. Se omiten los modelos de embeddings, imagen, voz y otros que no sean de chat, así como los ID que hayan superado su fecha de caducidad.

"Calidad", el perfil predeterminado, pondera ChrF y Arena Score por encima del precio. "Precio" invierte ese énfasis y mantiene el umbral de calidad descrito anteriormente. Las ponderaciones opcionales son [`modelSuggestion`](/es/reference/configuration#modelsuggestion).

`suggest-models --refresh` vuelve a descargar los conjuntos de datos. Después, vuelve a cargar la pestaña **Modelos**.

Todas las marcas, incluidas `--json`, `--list` y la fórmula de puntuación: [suggest-models](/es/reference/cli-commands/models#suggest-models).

<a id="why-more-than-one-model"></a>
## Por qué la lista tiene más de un modelo

<a id="model-fallback-chain"></a>
### Cadena de reserva de modelos

`translationModels` es una lista ordenada. La CLI prueba el primer modelo. Si una solicitud falla, si recibe una respuesta que no puede analizar o texto en el sistema de escritura incorrecto, prueba el siguiente ID para ese lote.

Un solo ID es un único punto de fallo. Un modelo puede exceder el tiempo de espera, devolver texto que esta herramienta rechaza o traducir bien un idioma y mal otro. Un caso común es el hindi romanizado cuando `hi` espera devanagari. El resultado romanizado se rechaza para las configuraciones regionales con escritura nativa. Una configuración regional que deba permanecer romanizada necesita una subetiqueta `-Latn` explícita, como `hi-Latn`.

Por eso la preselección contiene varios ID, los más potentes primero. El orden en la lista es el orden en que se intentan las traducciones.

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

Listas preestablecidas de `init` y la referencia de campos: [Configuración: `provider` y `providers`](/es/reference/configuration#provider-and-providers).

<a id="validate-and-compare-models"></a>
## Comprobar, listar y evaluar

Una vez que la preselección esté en la configuración, estos comandos la inspeccionan. La traducción puede ejecutarse antes de que los uses.

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

Con la [retención de datos cero](/es/guide/providers-and-models#cheaperinference-zero-data-retention) activada para Cheaper Inference, `check-models`, `list-models` y `suggest-models` leen `GET /models?zdr=true`.

Detalles del comando: [CLI: modelos e idiomas](/es/reference/cli-commands/models).

<a id="further-reference"></a>
## Referencias adicionales

- [Proveedores de LLM](/es/guide/providers-and-models): preajustes, claves de API y cambio de proveedor con `-P`.
- [Pestaña Modelos](/es/guide/translation-dashboard/models): la misma clasificación en el panel de control.
- [Configuración: `provider` y `providers`](/es/reference/configuration#provider-and-providers): `translationModels`, `uiModels`, `localeModels`, tiempos de espera y tarifas de coste.
- [suggest-models](/es/reference/cli-commands/models#suggest-models): indicadores, filtros y la fórmula de puntuación.
