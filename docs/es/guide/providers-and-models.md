<a id="llm-providers"></a>
# Proveedores de LLM

Cada pipeline de traducción —`translate-ui`, `translate-docs`, `translate-json` y `translate-svg`— envía texto a un LLM a través del mismo cliente independiente del proveedor. Antes de que cualquiera de esos comandos pueda ejecutarse, configure **al menos un proveedor** en `ai-i18n-tools.config.json` y establezca la **clave API** correspondiente en su entorno o `.env` (ajustes preestablecidos integrados excepto **Ollama**). `init` escribe un bloque inicial `provider` / `providers`; aún debe proporcionar credenciales para el ajuste preestablecido activo.

Configuras **qué punto de conexión de la API llamar** una vez en la configuración; todos los comandos de traducción comparten esa configuración y la misma caché de SQLite. Qué modelos intenta ese proveedor es un paso aparte: [Modelos de IA](/es/guide/ai-models).

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

<a id="zero-data-retention-cheaper-inference"></a>
### Sin retención de datos (inferencia más económica)

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
<a id="models"></a>
### Modelos

La elección de modelos, la lista de respaldo y `suggest-models`, `check-models`, `list-models` y `bench-models` están en [Modelos de IA](/es/guide/ai-models).

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

- [Modelos de IA](/es/guide/ai-models): lista de preselección clasificada, lista de respaldo y los comandos del modelo.
- [Configuración — `provider` y `providers`](/es/reference/configuration#provider-and-providers): tabla preestablecida, puntos de conexión personalizados, tiempos de espera de la solicitud, tarifas de coste, retención de datos cero de Cheaper Inference, comportamiento específico de OpenRouter.
- [Arquitectura — Cliente LLM](/es/reference/architecture): cómo funcionan internamente el respaldo de modelos, el procesamiento por lotes y los informes de costes.
- [Variables de entorno](/es/reference/environment-variables): variables de entorno de clave de API y anulaciones de la URL base.
