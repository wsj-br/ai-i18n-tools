<a id="environment-variables"></a>
# Variables de entorno

<a id="provider-api-keys"></a>
## Claves de API de proveedor

`init -P <provider>` selecciona ese preajuste integrado y la clave de API en la tabla siguiente. Sobrescriba el nombre de la variable para un proveedor con `providers.<name>.apiKeyEnv`. Ollama no tiene clave de API.

| Variable | Proveedor |
| --- | --- |
| `OPENROUTER_API_KEY` | `openrouter` |
| `OPENAI_API_KEY` | `openai` |
| `ANTHROPIC_API_KEY` | `anthropic` |
| `GOOGLE_API_KEY` | `gemini` |
| `DEEPSEEK_API_KEY` | `deepseek` |
| `CEREBRAS_API_KEY` | `cerebras` |
| `GROQ_API_KEY` | `groq` |
| `MISTRAL_API_KEY` | `mistral` |
| `XAI_API_KEY` | `xai` |
| `NVIDIA_API_KEY` | `nvidia` |
| `ALIBABA_API_KEY` | `alibaba` |
| `APIFUN_API_KEY` | `apifun` |
| `CHEAPERINFERENCE_API_KEY` | `cheaperinference` |

La clave es obligatoria cuando ese proveedor está activo. URLs de ajustes preestablecidos: [Proveedores integrados](/es/guide/providers-and-models#built-in-providers).

<a id="provider-base-urls"></a>
## URLs base de proveedor

Estas dos variables sustituyen a `baseUrl` para un proveedor configurado. Cualquier otro ajuste preestablecido cambia su URL en la configuración (`providers.<name>.baseUrl`), no mediante una variable de entorno.

| Variable | Sustituye a |
| --- | --- |
| `OPENROUTER_BASE_URL` | `providers.openrouter.baseUrl` (solo cuando ese proveedor está configurado) |
| `OLLAMA_BASE_URL` | `providers.ollama.baseUrl` (solo cuando ese proveedor está configurado) |

<a id="tool-and-run"></a>
## Herramienta y ejecución

| Variable | Descripción |
| --- | --- |
| `AI_I18N_LANG` | Idioma para la propia interfaz de usuario de la herramienta (ayuda de la CLI, registros, panel de control). Sustituido por `-L` / `--ui-lang`; sobrescribe la configuración `uiLanguage`. Consulte [Idioma de la interfaz de usuario de la herramienta](/es/guide/tool-ui-language). |
| `I18N_SOURCE_LOCALE`    | Anula `sourceLocale` en tiempo de ejecución.               |
| `I18N_TARGET_LOCALES`   | Códigos de configuración regional separados por comas para anular `targetLocales`.  |
| `I18N_LOG_LEVEL` | Nivel del registrador (`debug`, `info`, `warn`, `error`). Los valores desconocidos (incluido `silent`) vuelven a `info`. |
| `NO_COLOR`              | Cuando vale `1`, desactiva los colores ANSI en la salida del registro.             |
| `I18N_LOG_SESSION_MAX`  | Número máximo de líneas guardadas por sesión de registro (por defecto `5000`).           |

Al iniciar, la CLI también carga automáticamente un archivo `.env` del directorio de trabajo actual (a través de `process.loadEnvFile` de Node), de modo que las claves de API del proveedor se cargan en shells no interactivos que no cargan `.envrc` a través de `direnv`. Las variables ya presentes en el entorno nunca se sobrescriben, por lo que los valores reales de CI/producción tienen prioridad.
