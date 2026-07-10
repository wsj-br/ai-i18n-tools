<a id="environment-variables"></a>
# Environment variables

| Variable               | Description                                                |
|------------------------|------------------------------------------------------------|
| `OPENROUTER_API_KEY`   | `openrouter` provider ke liye API key (jab yeh active ho tab zaroori). |
| Other provider keys    | Har provider apni key env var padhta hai: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `DEEPSEEK_API_KEY`, `CEREBRAS_API_KEY`, `GROQ_API_KEY`, `MISTRAL_API_KEY`, `XAI_API_KEY`, `NVIDIA_API_KEY`, `ALIBABA_API_KEY`, `APIFUN_API_KEY` (Ollama ko kisi ki zaroorat nahi). `providers.<name>.apiKeyEnv` ke saath har provider ke liye override karein. |
| `OPENROUTER_BASE_URL`  | `providers.openrouter.baseUrl` ko override karein (sirf tab jab vah provider configure kiya gaya ho). |
| `OLLAMA_BASE_URL`      | `providers.ollama.baseUrl` ko override karein (sirf tab jab vah provider configure kiya gaya ho). |
| `AI_I18N_LANG`         | Tool ke apne UI (CLI help, logs, dashboard) ke liye bhasha. `-L` / `--ui-lang` dwara override kiya gaya; config `uiLanguage` ko override karta hai. [Tool UI bhasha](/guide/tool-ui-language) dekhen. |
| `I18N_SOURCE_LOCALE`   | Runtime par `sourceLocale` ko override karein.                        |
| `I18N_TARGET_LOCALES`  | `targetLocales` ko override karne ke liye comma-separated locale codes.  |
| `I18N_LOG_LEVEL` | Logger level (`debug`, `info`, `warn`, `error`). Anjaan values (jismein `silent` bhi shaamil hai) `info` par wapas aa jaate hain. |
| `NO_COLOR`             | Jab `1` ho, to log output mein ANSI colours ko disable karein.              |
| `I18N_LOG_SESSION_MAX` | Prati log session mein rakhi gayi adhiktam lines (default `5000`).           |

Startup par CLI vartamaan working directory se `.env` file ko bhi auto-load karta hai (Node ke `process.loadEnvFile` ke dwara), isliye provider API keys non-interactive shells mein utha li jaati hain jo `.envrc` / `direnv` ko source nahin karti hain. Environment mein pehle se maujood variables kabhi override nahin kiye jaate hain, isliye real CI/production maanon ki jeet hoti hai.
