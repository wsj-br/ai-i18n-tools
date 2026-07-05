<a id="environment-variables"></a>
# Environment variables

| Variable               | Description                                                |
|------------------------|------------------------------------------------------------|
| `OPENROUTER_API_KEY`   | `openrouter` provider ke liye API key (jab yeh active ho tab zaroori). |
| Other provider keys    | Har provider apni key env var padhta hai: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `DEEPSEEK_API_KEY`, `CEREBRAS_API_KEY`, `GROQ_API_KEY`, `MISTRAL_API_KEY`, `XAI_API_KEY`, `NVIDIA_API_KEY`, `ALIBABA_API_KEY`, `APIFUN_API_KEY` (Ollama ko kisi ki zaroorat nahi). `providers.<name>.apiKeyEnv` ke saath har provider ke liye override karein. |
| `OPENROUTER_BASE_URL`  | `providers.openrouter.baseUrl` ko override karein (sirf tab jab vah provider configure kiya gaya ho). |
| `OLLAMA_BASE_URL`      | `providers.ollama.baseUrl` ko override karein (sirf tab jab vah provider configure kiya gaya ho). |
| `AI_I18N_LANG`         | Tool ke khud ke UI ke liye bhasha (CLI madad, logs, dashboard). `-L` / `--ui-lang` dwara override kiya jaata hai; config `uiLanguage` ko override karta hai. [Tool UI bhasha](#tool-ui-language) dekhen. |
| `I18N_SOURCE_LOCALE`   | Runtime par `sourceLocale` ko override karein.                        |
| `I18N_TARGET_LOCALES`  | `targetLocales` ko override karne ke liye comma-separated locale codes.  |
| `I18N_LOG_LEVEL` | Logger level (`debug`, `info`, `warn`, `error`). Anjaan values (jismein `silent` bhi shaamil hai) `info` par wapas aa jaate hain. |
| `NO_COLOR`             | Jab `1` ho, to log output mein ANSI colours ko disable karein.              |
| `I18N_LOG_SESSION_MAX` | Prati log session mein rakhi gayi adhiktam lines (default `5000`).           |

Startup par CLI vartamaan working directory se `.env` file ko bhi auto-load karta hai (Node ke `process.loadEnvFile` ke dwara), isliye provider API keys non-interactive shells mein utha li jaati hain jo `.envrc` / `direnv` ko source nahin karti hain. Environment mein pehle se maujood variables kabhi override nahin kiye jaate hain, isliye real CI/production maanon ki jeet hoti hai.

<a id="tool-ui-language"></a>
## Tool UI bhasha

Tool apana user interface — CLI madad text, uchch-traffic log/saraansh/error sandesh, aur Translation Dashboard — ko aapake project ke `sourceLocale` / `targetLocales` se svatantr roop se localise karta hai. UI locale in sources se resolve kiya jaata hai, sarvochch prathmikta pehle:

1. `-L` / `--ui-lang <code>` global flag (e.g. `-L pt-BR`).
2. `AI_I18N_LANG` environment variable (e.g. `export AI_I18N_LANG=es`).
3. `ai-i18n-tools.config.json` mein `uiLanguage` config key (BCP-47 string).
4. Host OS locale (`Intl.DateTimeFormat().resolvedOptions().locale` ke through).

Anurodh kiya gaya locale shipped UI bhashaon ke khilaaf ya sabse qareebi variation dwara match kiya jaata hai (udaharan ke liye `pt-PT` `pt-BR` mein resolve hota hai, aur `en-US` `en-GB` mein resolve hota hai); jab kuchh bhi match nahin hota hai to yah source locale (`en-GB`) par fallback ho jaata hai. Jab UI bhasha spasht roop se anurodh ki jaati hai (flag, env var, ya `uiLanguage` ke dwara) lekin koi shipped bundle match nahin hota hai, to CLI ek-baar ka warning print karta hai ki default locale ka upayog kiya jaayega; keval host OS se anumaanit locale kabhi warning nahin deta hai.

Shipped UI bhashaen: `en-GB` (source) aur `de`, `es`, `fr`, `hi-Latn`, `ja`, `ko`, `pt-BR`, `zh-Hans`, aur `zh-Hant`. Translation Dashboard resolved locale, layout direction, aur translation bundle ko `GET /api/ui-i18n` se padhta hai aur load hone par unhen laagoo karta hai (yah `<html lang>` / `dir` set karta hai aur `data-i18n*` attributes ke dwara static markup ko localise karta hai). Is suvidha ke liye kisi configuration ki avashyakta nahin hai — default roop se tool aapke OS locale ka anupalan karta hai.
