<a id="environment-variables"></a>
# Variables de entorno

| Variable               | Descripción                                                |
|------------------------|------------------------------------------------------------|
| `OPENROUTER_API_KEY`   | Clave API para el proveedor `openrouter` (requerida cuando está activo). |
| Otras claves de proveedor    | Cada proveedor lee su propia variable de entorno de clave: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `DEEPSEEK_API_KEY`, `CEREBRAS_API_KEY`, `GROQ_API_KEY`, `MISTRAL_API_KEY`, `XAI_API_KEY`, `NVIDIA_API_KEY`, `ALIBABA_API_KEY`, `APIFUN_API_KEY` (Ollama no necesita ninguna). Anula por proveedor con `providers.<name>.apiKeyEnv`. |
| `OPENROUTER_BASE_URL`  | Anula `providers.openrouter.baseUrl` (solo cuando ese proveedor está configurado). |
| `OLLAMA_BASE_URL`      | Anula `providers.ollama.baseUrl` (solo cuando ese proveedor está configurado). |
| `AI_I18N_LANG`         | Idioma de la interfaz de usuario de la herramienta (ayuda de la CLI, registros, panel). Anulado por `-L` / `--ui-lang`; anula la configuración `uiLanguage`. Consulte [Idioma de la interfaz de usuario de la herramienta](#tool-ui-language). |
| `I18N_SOURCE_LOCALE`    | Anula `sourceLocale` en tiempo de ejecución.               |
| `I18N_TARGET_LOCALES`   | Códigos de configuración regional separados por comas para anular `targetLocales`.  |
| `I18N_LOG_LEVEL` | Nivel del registrador (`debug`, `info`, `warn`, `error`). Los valores desconocidos (incluido `silent`) vuelven a `info`. |
| `NO_COLOR`              | Cuando vale `1`, desactiva los colores ANSI en la salida del registro.             |
| `I18N_LOG_SESSION_MAX`  | Número máximo de líneas guardadas por sesión de registro (por defecto `5000`).           |

Al inicio, la CLI también carga automáticamente un archivo `.env` desde el directorio de trabajo actual (a través de `process.loadEnvFile` de Node), por lo que las claves API del proveedor se capturan en shells no interactivos que no cargan `.envrc` / `direnv`. Las variables que ya están presentes en el entorno nunca se anulan, por lo que los valores reales de CI/producción siguen teniendo prioridad.

<a id="tool-ui-language"></a>
## Idioma de la interfaz de usuario de la herramienta

La herramienta localiza su propia interfaz de usuario —texto de ayuda de la CLI, mensajes de registro/resumen/error de alto tráfico y el Panel de traducción— independientemente de `sourceLocale` / `targetLocales` de su proyecto. La configuración regional de la interfaz de usuario se resuelve a partir de las siguientes fuentes, en orden de prioridad:

1. Indicador global `-L` / `--ui-lang <code>` (por ejemplo, `-L pt-BR`).
2. Variable de entorno `AI_I18N_LANG` (por ejemplo, `export AI_I18N_LANG=es`).
3. La clave de configuración `uiLanguage` en `ai-i18n-tools.config.json` (cadena BCP-47).
4. La locale del sistema operativo anfitrión (a través de `Intl.DateTimeFormat().resolvedOptions().locale`).

La configuración regional solicitada se compara exactamente con los idiomas de interfaz de usuario distribuidos o por la variación más cercana (por ejemplo, `pt-PT` se resuelve en `pt-BR`, y `en-US` se resuelve en `en-GB`); cuando nada coincide, recurre a la configuración regional de origen (`en-GB`). Cuando se solicita explícitamente un idioma de interfaz de usuario (a través del indicador, la variable de entorno o `uiLanguage`) pero no coincide ningún paquete distribuido, la CLI imprime una advertencia única de que se utilizará la configuración regional predeterminada; una configuración regional inferida solo del sistema operativo anfitrión nunca advierte.

Idiomas de interfaz de usuario distribuidos: `en-GB` (origen) más `de`, `es`, `fr`, `hi-Latn`, `ja`, `ko`, `pt-BR`, `zh-Hans` y `zh-Hant`. El Panel de traducción lee la configuración regional resuelta, la dirección del diseño y el paquete de traducción de `GET /api/ui-i18n` y los aplica al cargar (establece `<html lang>` / `dir` y localiza el marcado estático a través de los atributos `data-i18n*`). Esta función no requiere ninguna configuración; de forma predeterminada, la herramienta sigue la configuración regional de su sistema operativo.
