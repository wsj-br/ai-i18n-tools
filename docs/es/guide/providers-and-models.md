<a id="llm-providers-and-models"></a>
# Proveedores y modelos de LLM

Cada pipeline de traducción —`translate-ui`, `translate-docs`, `translate-json` y `translate-svg`— envía texto a un LLM a través del mismo cliente independiente del proveedor. Antes de que cualquiera de esos comandos pueda ejecutarse, configure **al menos un proveedor** en `ai-i18n-tools.config.json` y establezca la **clave API** correspondiente en su entorno o `.env` (ajustes preestablecidos integrados excepto **Ollama**). `init` escribe un bloque inicial `provider` / `providers`; aún debe proporcionar credenciales para el ajuste preestablecido activo.

Usted configura **qué punto final de API llamar** y **qué modelos probar** una vez en la configuración; todos los comandos de traducción comparten esa configuración y la misma caché de SQLite.

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

Establezca la clave de API del proveedor activo en su entorno o en el archivo `.env`. La CLI carga automáticamente `.env` desde el directorio de trabajo sin anular las variables ya establecidas en el shell. Consulte [Variables de entorno](/es/reference/environment-variables).

<a id="model-fallback-chain"></a>
### Cadena de reserva de modelos

`translationModels` es una **lista ordenada**, no una opción única. La CLI prueba el primer modelo; si falla la solicitud, el análisis o el script incorrecto, pasa a la siguiente entrada. Configure varios modelos para que una interrupción transitoria o un modelo que tenga dificultades con una configuración regional (por ejemplo, hindi romanizado en lugar de devanagari) no bloquee toda la ejecución. La salida romanizada se rechaza para las configuraciones regionales de script nativo; una configuración regional que deba permanecer romanizada debe configurarse con una subetiqueta `-Latn` explícita (por ejemplo, `hi-Latn`).

**Niveles de resolución** (deduplicados, orden conservado):

| Canalización | Orden |
| --- | --- |
| UI (`translate-ui`, plurales, `proofread-ui`) | `localeModels(locale)` → `uiModels` → `translationModels` |
| Documentos, JSON, SVG | `localeModels(locale)` → `translationModels` |

La `providers.<active>.uiModels` opcional es una lista solo de UI que se prueba después de cualquier anulación por configuración regional coincidente y antes de la cadena global `translationModels`. La `providers.<active>.localeModels` opcional asigna una configuración regional BCP-47 a los modelos que se prueban **primero** para esa configuración regional en cada canalización (`pt-br` coincide con `pt-BR`). Cuando ninguna entrada `localeModels` coincide, solo se aplican los niveles específicos de la canalización.

Los diferentes proveedores y modelos varían en costo, velocidad y calidad entre idiomas. Trate la lista predeterminada de `npx ai-i18n-tools init` como un punto de partida: amplíela cuando una configuración regional produzca resultados consistentemente deficientes, o agregue una entrada `localeModels` para esa configuración regional. Valores predeterminados completos y justificación: [Configuración — `provider` y `providers`](/es/reference/configuration#provider-and-providers).

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

`check-models` llama al punto final `GET /models` del proveedor, valida cada ID de `translationModels`, `uiModels` y `localeModels`, informa las ID que faltan o que superan `expiration_date`, y sale con un valor distinto de cero cuando cualquier ID configurada no es válida. Cuando el proveedor devuelve precios (OpenRouter lo hace), también muestra el USD estimado por 1 millón de tokens.

Explore el catálogo completo anunciado por un proveedor:

```bash
npx ai-i18n-tools list-models
```

Compare el rendimiento de los modelos configurados con una muestra de traducción real: cada ID único de `translationModels`, `uiModels` y `localeModels` se ejecuta de forma aislada para que pueda comparar el tiempo real, el uso de tokens y el costo:

```bash
npx ai-i18n-tools bench-models
```

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

Los `pricing` y `modelPricing` opcionales establecen el costo en USD por 1.000.000 de tokens (`inputPerMTokens` y `outputPerMTokens`) cuando el proveedor omite `usage.cost`. `pricing` es el valor predeterminado a nivel de proveedor; una entrada `modelPricing` lo anula para un ID de modelo. OpenRouter ya devuelve un costo por llamada, por lo que debe dejar ambos sin definir en ese proveedor. Un costo reportado por el proveedor se conserva tal como se devuelve. El importe se incluye en el resumen de traducción, [`usage`](/es/reference/cli-commands/workflows#usage) y [Uso y costos](/es/guide/translation-dashboard/usage).

Ejemplo ejecutable con cuatro proveedores en el mismo documento, incluyendo tarifas de ejemplo: [`examples/multi-provider`](/es/examples#multi-provider).

<a id="further-reference"></a>
### Referencia adicional

- [Configuración — `provider` y `providers`](/es/reference/configuration#provider-and-providers) — tabla de valores predefinidos, endpoints personalizados, tiempos de espera de solicitud, tasas de coste, comportamiento específico de OpenRouter.
- [Arquitectura — cliente LLM](/es/reference/architecture) — cómo funcionan internamente el fallback de modelos, el procesamiento por lotes y el reporte de costes.
- [Variables de entorno](/es/reference/environment-variables) — variables de entorno de clave de API y anulaciones de URL base.
