<a id="llm-providers-and-models"></a>
# Proveedores y modelos de LLM

Cada pipeline de traducción —`translate-ui`, `translate-docs`, `translate-json` y `translate-svg`— envía texto a un LLM a través del mismo cliente independiente del proveedor. Antes de que cualquiera de esos comandos pueda ejecutarse, configure **al menos un proveedor** en `ai-i18n-tools.config.json` y establezca la **clave API** correspondiente en su entorno o `.env` (ajustes preestablecidos integrados excepto **Ollama**). `init` escribe un bloque inicial `provider` / `providers`; aún debe proporcionar credenciales para el ajuste preestablecido activo.

Usted configura **qué punto final de API llamar** y **qué modelos probar** una vez en la configuración; todos los comandos de traducción comparten esa configuración y la misma caché de SQLite.

La CLI resuelve el proveedor activo a partir de la clave `provider` de nivel superior (o la única entrada en `providers` cuando solo hay uno configurado). Cada bloque de proveedor enumera una cadena de reserva `translationModels` ordenada; los ajustes preestablecidos incorporados heredan `baseUrl` y la variable de entorno de clave de API automáticamente (anúlelos por proveedor cuando sea necesario).

<a id="built-in-providers"></a>
### Proveedores integrados

Las claves de proveedor preestablecidas solo necesitan `translationModels`: la URL base y la variable de entorno de la clave de API se rellenan automáticamente:

<div class="provider-presets">

| Proveedor | URL base | Variable de entorno de clave API |
| --- | --- | --- |
| `openrouter` | `https://openrouter.ai/api/v1` | `OPENROUTER_API_KEY` |
| `openai` | `https://api.openai.com/v1` | `OPENAI_API_KEY` |
| `anthropic` | `https://api.anthropic.com/v1` | `ANTHROPIC_API_KEY` |
| `gemini` | `https://generativelanguage.googleapis.com/v1beta/openai` | `GOOGLE_API_KEY` |
| `deepseek` | `https://api.deepseek.com` | `DEEPSEEK_API_KEY` |
| `cerebras` | `https://api.cerebras.ai/v1` | `CEREBRAS_API_KEY` |
| `groq` | `https://api.groq.com/openai/v1` | `GROQ_API_KEY` |
| `mistral` | `https://api.mistral.ai/v1` | `MISTRAL_API_KEY` |
| `xai` | `https://api.x.ai/v1` | `XAI_API_KEY` |
| `nvidia` | `https://integrate.api.nvidia.com/v1` | `NVIDIA_API_KEY` |
| `alibaba` | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` | `ALIBABA_API_KEY` |
| `apifun` | `https://api.apikey.fun/v1` | `APIFUN_API_KEY` |
| `cheaperinference` | `https://api.cheaperinference.com/v1` | `CHEAPERINFERENCE_API_KEY` |
| `ollama` | `http://localhost:11434/v1` | (ninguno) |

</div>

Para cualquier clave **no preestablecida**, configure `baseUrl` y `apiKeyEnv` explícitamente en la configuración.

Establezca la clave de API del proveedor activo en su entorno o en el archivo `.env`. La CLI carga automáticamente `.env` desde el directorio de trabajo sin anular las variables ya establecidas en el shell. Consulte [Variables de entorno](/es/reference/environment-variables).

<a id="cheaperinference-zero-data-retention"></a>
### Retención de datos cero (Inferencia más económica)

`providers.cheaperinference.zeroDataRetention` es opcional y está desactivado por defecto. Actívalo cuando este proyecto deba enviar las indicaciones solo a través de proveedores que no las conserven.

```json
"cheaperinference": {
  "zeroDataRetention": true,
  "translationModels": ["gemini-2.5-flash", "deepseek-v4-flash"]
}
```

Con el indicador activado, cada solicitud de chat incluye `"zdr": true`, y `list-models`, `check-models` y `suggest-models` (incluida la pestaña Modelos del panel) muestran `GET /v1/models?zdr=true`. Ese catálogo enumera los modelos que una solicitud de cero retención de datos puede usar, al precio de cero retención de datos. `check-models` considera un ID que falta en ese catálogo como no válido. El indicador no crea una ruta para un modelo que el catálogo omite. Elimine ese ID de `translationModels`, `uiModels` o `localeModels`.

Deja la opción desactivada cuando la cuenta de Inferencia más económica no requiera retención de datos cero. Si la [Protección de datos](https://platform.cheaperinference.com/dashboard/data-protection) ya está activada para la cuenta, Inferencia más económica sigue rechazando un modelo sin una ruta de retención de datos cero. El error nombra a ese modelo. Para mantener la política de la cuenta, establece `zeroDataRetention` en `true` y cambia a un modelo del catálogo de retención de datos cero. Para mantener el modelo rechazado, desactiva la retención de datos cero en esa página. La cadena de reserva intenta entonces el siguiente modelo configurado.

<a id="model-fallback-chain"></a>
### Cadena de reserva de modelos

`translationModels` es una **lista ordenada**, no una opción única. La CLI prueba el primer modelo; si falla la solicitud, el análisis o el script incorrecto, pasa a la siguiente entrada. Configure varios modelos para que una interrupción transitoria o un modelo que tenga dificultades con una configuración regional (por ejemplo, hindi romanizado en lugar de devanagari) no bloquee toda la ejecución. La salida romanizada se rechaza para las configuraciones regionales de script nativo; una configuración regional que deba permanecer romanizada debe configurarse con una subetiqueta `-Latn` explícita (por ejemplo, `hi-Latn`).

**Niveles de resolución** (deduplicados, orden conservado):

| Canalización | Orden |
| --- | --- |
| UI (`translate-ui`, plurales, `proofread-ui`) | `localeModels(locale)` → `uiModels` → `translationModels` |
| Documentos, JSON, SVG | `localeModels(locale)` → `translationModels` |

La `providers.<active>.uiModels` opcional es una lista solo de UI que se prueba después de cualquier anulación por configuración regional coincidente y antes de la cadena global `translationModels`. La `providers.<active>.localeModels` opcional asigna una configuración regional BCP-47 a los modelos que se prueban **primero** para esa configuración regional en cada canalización (`pt-br` coincide con `pt-BR`). Cuando ninguna entrada `localeModels` coincide, solo se aplican los niveles específicos de la canalización.

Distintos proveedores y modelos varían en coste, velocidad y calidad entre idiomas. Considere la lista de modelos de `npx ai-i18n-tools init -P <provider>` como punto de partida; amplíela cuando una configuración regional produzca resultados consistentemente deficientes, o añada una entrada `localeModels` para esa configuración regional. Listas preestablecidas y justificación: [Configuración — `provider` y `providers`](/es/reference/configuration#provider-and-providers).

**Cadenas de interfaz de usuario:** la `uiModels` opcional le permite enrutar `translate-ui`, la generación plural y `proofread-ui` a través de modelos premium antes de la cadena `translationModels` global, lo que es útil porque el texto de la interfaz de usuario es corto pero está orientado al usuario.

**Locales asiáticos:** las entradas `localeModels` opcionales para `ja`, `ko`, `zh-Hans` y `zh-Hant` se prueban primero en cada pipeline; los modelos como `z-ai/glm-5.3` y `minimax/minimax-m2.7` suelen ofrecer un mejor rendimiento en scripts CJK que las opciones de respaldo de propósito general.

Configuración de ejemplo (OpenRouter). `translationModels` y `uiModels` son las listas que utiliza este repositorio en `ai-i18n-tools.config.json`. `localeModels` es un complemento opcional recomendado para configuraciones regionales CJK; este repositorio no lo configura.

```json
{
  "provider": "openrouter",
  "providers": {
    "openrouter": {
      "translationModels": [
        "qwen/qwen3.7-max",
        "~anthropic/claude-sonnet-latest",
        "openai/gpt-5.4",
        "google/gemini-3.5-flash",
        "tencent/hy-mt2-30b-a3b",
        "mistralai/mistral-large",
        "openai/gpt-4o-mini",
        "cohere/command-r-plus-08-2024",
        "qwen/qwen-2.5-72b-instruct"  
      ],
      "uiModels": [
        "~anthropic/claude-sonnet-latest",
        "openai/gpt-5.4"
      ],
      "localeModels": [
        { "locale": "ja",      "models": [ "z-ai/glm-5.3", "minimax/minimax-m2.7" ] },
        { "locale": "ko",      "models": [ "z-ai/glm-5.3", "minimax/minimax-m2.7" ] },
        { "locale": "zh-Hans", "models": [ "z-ai/glm-5.3", "minimax/minimax-m2.7" ] },
        { "locale": "zh-Hant", "models": [ "z-ai/glm-5.3", "minimax/minimax-m2.7" ] }
      ]
    }
  }
}
```

<a id="validate-and-compare-models"></a>
### Validar y comparar modelos

Antes de cambiar `translationModels`, confirme que cada ID todavía esté disponible en el proveedor activo:

```bash
npx ai-i18n-tools check-models
```

`check-models` llama al endpoint `GET /models` del proveedor, valida cada ID de `translationModels`, `uiModels` y `localeModels`, informa de los ID que faltan o que han caducado `expiration_date`, y sale con un código distinto de cero cuando cualquier ID configurado no es válido. Cuando el proveedor devuelve los precios (OpenRouter e Inferencia más económica lo hacen), también muestra USD por 1 millón de tokens. Con [`zeroDataRetention`](/es/guide/providers-and-models#cheaperinference-zero-data-retention) activado, `check-models` y `list-models` usan `GET /models?zdr=true`.

Explore el catálogo completo anunciado por un proveedor:

```bash
npx ai-i18n-tools list-models
```

Compare el rendimiento de los modelos configurados con una muestra de traducción real: cada ID único de `translationModels`, `uiModels` y `localeModels` se ejecuta de forma aislada para que pueda comparar el tiempo real, el uso de tokens y el costo:

```bash
npx ai-i18n-tools bench-models
```

Solicite una lista corta clasificada (calidad por defecto, o `--price`) y, opcionalmente, escriba los ids principales en `translationModels`. La [pestaña Modelos](/es/guide/translation-dashboard/models) muestra la misma clasificación, filtros y actualización de configuración.

```bash
npx ai-i18n-tools suggest-models
npx ai-i18n-tools suggest-models --list
npx ai-i18n-tools suggest-models --max-output-price 2 --min-delta 2
npx ai-i18n-tools suggest-models --price --top 8 --json
npx ai-i18n-tools suggest-models --apply
npx ai-i18n-tools suggest-models --refresh
```

Las columnas de la tabla son rango, ID de modelo, índice, ChrF medido, Puntuación Arena medida y USD de entrada/salida por 1M de tokens. Una medición faltante es `—`. `--list` imprime esas columnas para los modelos que ya están en `translationModels`. `--max-output-price` mantiene los modelos con un USD de salida por 1M de tokens igual o inferior a ese valor y excluye un modelo sin precio de salida. `--min-delta` mantiene un modelo solo cuando su índice está al menos esa cantidad de puntos por debajo del modelo anterior mantenido. `--top` (predeterminado 8) limita la tabla, `--json` y `--apply` después de esos filtros. `--apply` reemplaza solo `translationModels`. `--refresh` vuelve a descargar la caché de referencia de 7 días. Los pesos opcionales son [`modelSuggestion`](/es/reference/configuration#modelsuggestion). Consulte [suggest-models](/es/reference/cli-commands/models#suggest-models).

Anule el texto de muestra, las configuraciones regionales o la lista de modelos:

```bash
npx ai-i18n-tools bench-models --text "Hello world" --source en --target de --model openai/gpt-4o-mini,anthropic/claude-3-haiku
```

Detalles del comando: [referencia de la CLI](/es/reference/cli-commands/).

<a id="multiple-providers"></a>
### Múltiples proveedores

Cuando se configura más de un proveedor, establezca la clave `provider` de nivel superior para seleccionar el predeterminado. Cambie por ejecución sin editar la configuración:

```bash
npx ai-i18n-tools translate-docs -P anthropic
npx ai-i18n-tools bench-models -P deepseek
```

Cada bloque de proveedor puede definir su propio `translationModels`, `uiModels` y `localeModels` opcionales, `maxTokens`, `temperature` y `requestTimeout` (segundos) o `requestTimeoutMs`. Un tiempo de espera en el proveedor anula el `requestTimeout` / `requestTimeoutMs` de nivel superior. Un bloque `openrouter` de nivel superior heredado todavía se acepta y se migra automáticamente a `providers.openrouter` al cargarse.

Los parámetros opcionales `pricing` y `modelPricing` establecen el valor en USD por cada 1.000.000 de tokens (`inputPerMTokens` y `outputPerMTokens`) cuando el proveedor omite `usage.cost`. `pricing` es el valor predeterminado para todo el proveedor; una entrada `modelPricing` lo anula para un id de modelo específico. OpenRouter y Cheaper Inference ya devuelven un coste por llamada, por lo que debe dejar ambos sin configurar en esos proveedores. El coste reportado por el proveedor se mantiene tal cual se recibe. El importe se incluye en el resumen de la traducción, [`usage`](/es/reference/cli-commands/workflows#usage), y en [Uso y costes](/es/guide/translation-dashboard/usage).

Ejemplo ejecutable con cuatro proveedores en el mismo documento, incluyendo tarifas de ejemplo: [`examples/multi-provider`](/es/examples#multi-provider).

<a id="further-reference"></a>
### Referencia adicional

- [Configuración — `provider` y `providers`](/es/reference/configuration#provider-and-providers) — tabla de preajustes, endpoints personalizados, tiempos de espera de solicitud, tarifas de coste, retención de datos cero de Inferencia más económica, comportamiento específico de OpenRouter.
- [Arquitectura — cliente LLM](/es/reference/architecture) — cómo funcionan internamente la reserva de modelos, el procesamiento por lotes y la notificación de costes.
- [Variables de entorno](/es/reference/environment-variables) — variables de entorno de clave API y anulaciones de URL base.
