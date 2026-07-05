<a id="llm-providers-and-models"></a>
# LLM pradata aur model

Har anuvaad pipeline — `translate-ui`, `translate-docs`, `translate-json`, aur `translate-svg` — ek hi provider-agnostic client ke madhyam se LLM ko text bhejta hai. Aap `ai-i18n-tools.config.json` mein ek baar **kis API endpoint ko call karna hai** aur **kin models ko try karna hai** configure karte hain; sabhi commands us setup aur usi SQLite cache ko share karte hain.

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

Apne environment ya `.env` file mein active provider ki API key set karen. CLI working directory se `.env` ko swatah load karta hai bina shell mein pahle se set kiye gaye variables ko override kiye. Dekhen [Environment variables](/reference/environment-variables).

<a id="model-fallback-chain"></a>
### Model fallback chain

`translationModels` ek **ordered list** hai, na ki ek single choice. CLI pahle model ko try karta hai; request ya parse failure par yah agali entry par chala jata hai. Kai models ko configure karen taki ek transient outage ya ek model jo kisi locale ke saath sangharsh karta hai, poore run ko block na kare.

Kewal `translate-ui` ke liye, optional `ui.preferredModel` ko provider ki `translationModels` list se **pahle** try kiya jata hai (deduplicated).

Vibhinn providers aur models ki laagat, gati aur gunvatta alag-alag bhashaon mein bhinn hoti hai. `npx ai-i18n-tools init` se default list ko ek shuruaati bindu ke roop mein dekhen — jab koi locale lagatar kharab parinaam deta hai to ise badhaen. Poore defaults aur rationale: [Configuration — `provider` and `providers`](/reference/configuration#provider-and-providers).

Udaaharan minimal config (OpenRouter):

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
### Models ko validate aur compare karen

`translationModels` badalne se pahle, pushti karen ki har id active provider par abhi bhi uplabdh hai:

```bash
npx ai-i18n-tools check-models
```

`check-models` provider ke `GET /models` endpoint ko call karta hai, un ids ki report karta hai jo gayab hain ya `expiration_date` se aage hain, aur jab koi configured id invalid hoti hai to non-zero exit karta hai. Jab provider pricing wapas karta hai (OpenRouter karta hai), to yah 1M tokens ke liye anumanit USD bhi dikhata hai.

Ek provider dwara vigyapit poori catalog browse karen:

```bash
npx ai-i18n-tools list-models
```

Ek vastavik anuvaad sample par configured models ka benchmark karen — har model alag-alag chalta hai taki aap wall-clock time, token usage, aur cost ki tulna kar saken:

```bash
npx ai-i18n-tools bench-models
```

Sample text, locales, ya model list ko override karen:

```bash
npx ai-i18n-tools bench-models --text "Hello world" --source en --target de --models openai/gpt-4o-mini,anthropic/claude-3-haiku
```

Command details: [CLI reference](/reference/cli-commands).

<a id="multiple-providers"></a>
### Multiple providers

Jab ek se adhik provider configure kiye jaate hain, to default chunne ke liye top-level `provider` key set karen. Config ko edit kiye bina har run ke liye switch karen:

```bash
npx ai-i18n-tools translate-docs -P anthropic
npx ai-i18n-tools bench-models -P deepseek
```

Har ek provider block apni khud ki `translationModels`, `maxTokens`, `temperature`, aur `requestTimeoutMs` define kar sakta hai. Ek legacy top-level `openrouter` block abhi bhi swikar kiya jata hai aur load hone par `providers.openrouter` mein auto-migrate ho jata hai.

Ek hi document par chaar providers ke saath chalne wala udaharan: [`examples/multi-provider`](/examples#multi-provider).

<a id="further-reference"></a>
### Aage ka sandarbh

- [Configuration — `provider` aur `providers`](/reference/configuration#provider-and-providers) — preset table, custom endpoints, request timeouts, OpenRouter-specific vyavahar.
- [Architecture — LLM client](/reference/architecture) — kaise model fallback, batching, aur cost reporting aantarik roop se kaam karte hain.
- [Environment variables](/reference/environment-variables) — API-key env vars aur base-URL overrides.
