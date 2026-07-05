<a id="llm-providers-and-models"></a>
# Proveedores y modelos de LLM

Cada canal de traducción —`translate-ui`, `translate-docs`, `translate-json` y `translate-svg`— envía texto a un LLM a través del mismo cliente independiente del proveedor. Se configura **qué punto final de API llamar** y **qué modelos probar** una vez en `ai-i18n-tools.config.json`; todos los comandos comparten esa configuración y la misma caché de SQLite.

La CLI resuelve el proveedor activo a partir de la clave `provider` de nivel superior (o la única entrada en `providers` cuando solo hay uno configurado). Cada bloque de proveedor enumera una cadena de reserva `translationModels` ordenada; los ajustes preestablecidos incorporados heredan `baseUrl` y la variable de entorno de clave de API automáticamente (anúlelos por proveedor cuando sea necesario).

<a id="built-in-providers"></a>
### Proveedores integrados

Las claves de proveedor preestablecidas solo necesitan `translationModels`: la URL base y la variable de entorno de la clave de API se rellenan automáticamente:

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
| `ollama` | `http://localhost:11434/v1` | (ninguno) |

Para cualquier clave **no preestablecida**, configure `baseUrl` y `apiKeyEnv` explícitamente en la configuración.

Establezca la clave de API del proveedor activo en su entorno o en el archivo `.env`. La CLI carga automáticamente `.env` desde el directorio de trabajo sin anular las variables ya establecidas en el shell. Consulte [Variables de entorno](/reference/environment-variables).

<a id="model-fallback-chain"></a>
### Cadena de reserva de modelos

`translationModels` es una **lista ordenada**, no una única opción. La CLI prueba el primer modelo; si la solicitud o el análisis fallan, pasa a la siguiente entrada. Configure varios modelos para que una interrupción transitoria o un modelo que tenga dificultades con una configuración regional no bloquee toda la ejecución.

Solo para `translate-ui`, se intenta el `ui.preferredModel` opcional **antes** de la lista `translationModels` del proveedor (sin duplicados).

Los diferentes proveedores y modelos varían en costo, velocidad y calidad entre idiomas. Trate la lista predeterminada de `npx ai-i18n-tools init` como un punto de partida; amplíela cuando una configuración regional produzca resultados consistentemente deficientes. Valores predeterminados completos y justificación: [Configuración — `provider` y `providers`](/reference/configuration#provider-and-providers).

Ejemplo de configuración mínima (OpenRouter):

```json
{
  "provider": "openrouter",
  "providers": {
    "openrouter": {
      "translationModels": [
        "qwen/qwen3-235b-a22b-2507",
        "openai/gpt-4o-mini",
        "deepseek/deepseek-v4-flash"
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

`check-models` llama al punto final `GET /models` del proveedor, informa las ID que faltan o que superan `expiration_date`, y sale con un valor distinto de cero si alguna ID configurada no es válida. Cuando el proveedor devuelve precios (OpenRouter lo hace), también muestra el USD estimado por 1 millón de tokens.

Explore el catálogo completo anunciado por un proveedor:

```bash
npx ai-i18n-tools list-models
```

Compare los modelos configurados en una muestra de traducción real: cada modelo se ejecuta de forma aislada para que pueda comparar el tiempo real, el uso de tokens y el costo:

```bash
npx ai-i18n-tools bench-models
```

Anule el texto de muestra, las configuraciones regionales o la lista de modelos:

```bash
npx ai-i18n-tools bench-models --text "Hello world" --source en --target de --models openai/gpt-4o-mini,anthropic/claude-3-haiku
```

Detalles del comando: [Referencia de la CLI](/reference/cli-commands).

<a id="multiple-providers"></a>
### Múltiples proveedores

Cuando se configura más de un proveedor, establezca la clave `provider` de nivel superior para seleccionar el predeterminado. Cambie por ejecución sin editar la configuración:

```bash
npx ai-i18n-tools translate-docs -P anthropic
npx ai-i18n-tools bench-models -P deepseek
```

Cada bloque de proveedor puede definir sus propios `translationModels`, `maxTokens`, `temperature` y `requestTimeoutMs`. Un bloque `openrouter` heredado de nivel superior todavía se acepta y se migra automáticamente a `providers.openrouter` al cargarse.

Ejemplo ejecutable con cuatro proveedores en el mismo documento: [`examples/multi-provider`](/examples#multi-provider).

<a id="further-reference"></a>
### Referencia adicional

- [Configuración — `provider` y `providers`](/reference/configuration#provider-and-providers) — tabla preestablecida, puntos finales personalizados, tiempos de espera de solicitud, comportamiento específico de OpenRouter.
- [Arquitectura — Cliente LLM](/reference/architecture) — cómo funcionan internamente la reserva de modelos, el procesamiento por lotes y la notificación de costos.
- [Variables de entorno](/reference/environment-variables) — variables de entorno de clave API y anulaciones de URL base.
