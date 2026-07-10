<a id="environment-variables"></a>
# Variables de entorno

| Variable               | Descripción                                                |
|------------------------|------------------------------------------------------------|
| `OPENROUTER_API_KEY`   | Clave API para el proveedor `openrouter` (requerida cuando está activo). |
| Otras claves de proveedor    | Cada proveedor lee su propia variable de entorno de clave: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `DEEPSEEK_API_KEY`, `CEREBRAS_API_KEY`, `GROQ_API_KEY`, `MISTRAL_API_KEY`, `XAI_API_KEY`, `NVIDIA_API_KEY`, `ALIBABA_API_KEY`, `APIFUN_API_KEY` (Ollama no necesita ninguna). Anula por proveedor con `providers.<name>.apiKeyEnv`. |
| `OPENROUTER_BASE_URL`  | Anula `providers.openrouter.baseUrl` (solo cuando ese proveedor está configurado). |
| `OLLAMA_BASE_URL`      | Anula `providers.ollama.baseUrl` (solo cuando ese proveedor está configurado). |
| `AI_I18N_LANG` | Idioma de la propia interfaz de usuario de la herramienta (ayuda de la CLI, registros, panel de control). Anulado por `-L` / `--ui-lang`; anula la configuración `uiLanguage`. Consulte [Idioma de la interfaz de usuario de la herramienta](/es/guide/tool-ui-language). |
| `I18N_SOURCE_LOCALE`    | Anula `sourceLocale` en tiempo de ejecución.               |
| `I18N_TARGET_LOCALES`   | Códigos de configuración regional separados por comas para anular `targetLocales`.  |
| `I18N_LOG_LEVEL` | Nivel del registrador (`debug`, `info`, `warn`, `error`). Los valores desconocidos (incluido `silent`) vuelven a `info`. |
| `NO_COLOR`              | Cuando vale `1`, desactiva los colores ANSI en la salida del registro.             |
| `I18N_LOG_SESSION_MAX`  | Número máximo de líneas guardadas por sesión de registro (por defecto `5000`).           |

Al inicio, la CLI también carga automáticamente un archivo `.env` desde el directorio de trabajo actual (a través de `process.loadEnvFile` de Node), por lo que las claves API del proveedor se capturan en shells no interactivos que no cargan `.envrc` / `direnv`. Las variables que ya están presentes en el entorno nunca se anulan, por lo que los valores reales de CI/producción siguen teniendo prioridad.
