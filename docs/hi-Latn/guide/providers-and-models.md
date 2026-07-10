<a id="llm-providers-and-models"></a>
# LLM pradata aur model

Har ek translation pipeline — `translate-ui`, `translate-docs`, `translate-json`, aur `translate-svg` — text ko ek LLM ke through bhejta hai jo same provider-agnostic client hai. Inmein se koi bhi command chalane se pehle, **kam se kam ek provider** ko `ai-i18n-tools.config.json` mein configure karein aur matching **API key** ko aapke environment ya `.env` (built-in presets ke alawa **Ollama**) mein set karein. `init` ek starter `provider` / `providers` block likhta hai; aapko abhi bhi active preset ke liye credentials provide karni hongi.

Aap config mein **kis API endpoint ko call karna hai** aur **kin models ko try karna hai** ek baar configure karte hain; sabhi translation commands us setup aur usi SQLite cache ko share karte hain.

CLI top-level `provider` key se active provider ko resolve karta hai (ya `providers` mein ekmatra entry jab kewal ek configure kiya gaya ho). Har provider block ek ordered `translationModels` fallback chain ko list karta hai; built-in presets swatah `baseUrl` aur API-key environment variable ko inherit karte hain (jab aavashyak ho to unhe har provider ke liye override karen).

<a id="built-in-providers"></a>
### Built-in providers

Preset provider keys ko kewal `translationModels` ki aavashyakta hoti hai — base URL aur API-key env var swatah bhar diye jaate hain:

| Provider | Base URL | API-key env var |
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
| `ollama` | `http://localhost:11434/v1` | (koi nahi) |

Kisi bhi **non-preset** key ke liye, config mein `baseUrl` aur `apiKeyEnv` ko spasht roop se set karen.

Apne environment ya `.env` file mein active provider ki API key set karen. CLI working directory se `.env` ko swatah load karta hai bina shell mein pahle se set kiye gaye variables ko override kiye. Dekhen [Environment variables](/hi-Latn/reference/environment-variables).

<a id="model-fallback-chain"></a>
### Model fallback chain

`translationModels` ek **ordered list** hai, na ki ek single choice. CLI pahle model ko try karta hai; request ya parse failure par yah agali entry par chala jata hai. Kai models ko configure karen taki ek transient outage ya ek model jo kisi locale ke saath sangharsh karta hai, poore run ko block na kare.

**Resolution tiers** (deduplicated, order preserved):

| Pipeline | Order |
| --- | --- |
| UI (`translate-ui`, plurals, `proofread-ui`) | `localeModels(locale)` → `uiModels` → `translationModels` |
| Documents, JSON, SVG | `localeModels(locale)` → `translationModels` |

Optional `providers.<active>.uiModels` ek UI-only list hai jo kisi bhi matching per-locale override ke baad aur global `translationModels` chain se pehle try ki jaati hai. Optional `providers.<active>.localeModels` ek BCP-47 locale ko models se map karta hai jo har pipeline mein us locale ke liye **sabse pehle** try kiye jaate hain (`pt-br` `pt-BR` se match karta hai). Jab koi `localeModels` entry match nahi karti, toh sirf pipeline-specific tiers apply hote hain.

Alag-alag providers aur models ki cost, speed, aur quality languages mein alag-alag hoti hai. `npx ai-i18n-tools init` se default list ko ek shuruaati point maanein — jab koi locale consistently kharab results deta hai, toh ise badhaayein, ya us locale ke liye ek `localeModels` entry jodein. Poore defaults aur rationale: [Configuration — `provider` aur `providers`](/hi-Latn/reference/configuration#provider-and-providers).

**UI strings:** vikalpik `uiModels` aapko `translate-ui`, bahuvachan utpatti, aur `proofread-ui` ko global `translationModels` chain se pahle premium model ke madhyam se route karne deta hai — upyogi hai kyuki UI copy chhota hota hai lekin upyogakarta-samne hota hai.

**Asian locales:** `ja`, `ko`, `zh-Hans`, aur `zh-Hant` ke liye vikalpik `localeModels` entries ko har pipeline mein pahle prayas kiya jata hai; `z-ai/glm-5.2` aur `minimax/minimax-m2.7` jaise model aksar CJK scripts par general-purpose fallbacks se behtar pradarshan karte hain.

Udaharan config (OpenRouter):

```json
{
  "provider": "openrouter",
  "providers": {
    "openrouter": {
      "translationModels": [
        "google/gemini-2.5-flash",
        "meta-llama/llama-3.3-70b-instruct",
        "openai/gpt-4o-mini",
        "google/gemma-4-26b-a4b-it",
        "anthropic/claude-3-haiku",
        "z-ai/glm-5.2",
        "google/gemini-3-flash-preview",
        "~anthropic/claude-sonnet-latest"
      ],
      "uiModels": [
        "~anthropic/claude-sonnet-latest",
        "z-ai/glm-5.2"
      ],
      "localeModels": [
        { "locale": "ja",      "models": [ "z-ai/glm-5.2", "minimax/minimax-m2.7" ] },
        { "locale": "ko",      "models": [ "z-ai/glm-5.2", "minimax/minimax-m2.7" ] },
        { "locale": "zh-Hans", "models": [ "z-ai/glm-5.2", "minimax/minimax-m2.7" ] },
        { "locale": "zh-Hant", "models": [ "z-ai/glm-5.2", "minimax/minimax-m2.7" ] }
      ]
    }
  }
}
```

<a id="validate-and-compare-models"></a>
### Models ko validate aur compare karen

`translationModels` badalne se pahle, pushti karen ki har id active provider par abhi bhi uplabdh hai:

```bash
npx ai-i18n-tools check-models
```

`check-models` provider ke `GET /models` endpoint ko call karta hai, `translationModels`, `uiModels`, aur `localeModels` se har id ko validate karta hai, missing ya `expiration_date` se aage ki ids ko report karta hai, aur jab koi configured id invalid hoti hai toh non-zero exit karta hai. Jab provider pricing return karta hai (OpenRouter karta hai), toh yeh 1M tokens ke liye anumaanit USD bhi dikhata hai.

Ek provider dwara vigyapit poori catalog browse karen:

```bash
npx ai-i18n-tools list-models
```

Ek vastavik anuvaad sample par configure kiye gaye models ka benchmark karein — `translationModels`, `uiModels`, aur `localeModels` se har ek unique ID alag se chalti hai taaki aap wall-clock samay, token upyog, aur laagat ki tulna kar sakein:

```bash
npx ai-i18n-tools bench-models
```

Sample text, locales, ya model list ko override karen:

```bash
npx ai-i18n-tools bench-models --text "Hello world" --source en --target de --model openai/gpt-4o-mini,anthropic/claude-3-haiku
```

Command details: [CLI reference](/hi-Latn/reference/cli-commands/).

<a id="multiple-providers"></a>
### Multiple providers

Jab ek se adhik provider configure kiye jaate hain, to default chunne ke liye top-level `provider` key set karen. Config ko edit kiye bina har run ke liye switch karen:

```bash
npx ai-i18n-tools translate-docs -P anthropic
npx ai-i18n-tools bench-models -P deepseek
```

Har provider block apni khud ki `translationModels`, optional `uiModels` aur `localeModels`, `maxTokens`, `temperature`, aur `requestTimeoutMs` define kar sakta hai. Ek legacy top-level `openrouter` block abhi bhi accept kiya jaata hai aur load hone par `providers.openrouter` mein auto-migrate ho jaata hai.

Ek hi document par chaar providers ke saath chalne wala udaharan: [`examples/multi-provider`](/hi-Latn/examples#multi-provider).

<a id="further-reference"></a>
### Aage ka sandarbh

- [Configuration — `provider` aur `providers`](/hi-Latn/reference/configuration#provider-and-providers) — preset table, custom endpoints, request timeouts, OpenRouter-specific vyavahar.
- [Architecture — LLM client](/hi-Latn/reference/architecture) — kaise model fallback, batching, aur cost reporting aantarik roop se kaam karte hain.
- [Environment variables](/hi-Latn/reference/environment-variables) — API-key env vars aur base-URL overrides.
