<a id="llm-providers-and-models"></a>
# Provedores e modelos de LLM

Cada pipeline de tradução — `translate-ui`, `translate-docs`, `translate-json` e `translate-svg` — envia texto para um LLM através do mesmo cliente agnóstico de provedor. Antes que qualquer um desses comandos possa ser executado, configure **pelo menos um provedor** em `ai-i18n-tools.config.json` e defina a **chave de API** correspondente em seu ambiente ou `.env` (predefinições integradas, exceto **Ollama**). `init` escreve um bloco inicial `provider` / `providers`; você ainda deve fornecer credenciais para a predefinição ativa.

Você configura **qual endpoint de API chamar** e **quais modelos tentar** uma vez na configuração; todos os comandos de tradução compartilham essa configuração e o mesmo cache SQLite.

A CLI resolve o provedor ativo a partir da chave `provider` de nível superior (ou da única entrada em `providers` quando apenas um está configurado). Cada bloco de provedor lista uma cadeia de fallback `translationModels` ordenada; predefinições incorporadas herdam `baseUrl` e a variável de ambiente da chave de API automaticamente (substitua-as por provedor quando necessário).

<a id="built-in-providers"></a>
### Provedores integrados

As chaves de provedor predefinidas precisam apenas de `translationModels` — URL base e variável de ambiente da chave de API são preenchidas automaticamente:

| Provedor | URL Base | Variável de ambiente da chave de API |
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
| `ollama` | `http://localhost:11434/v1` | (nenhum) |

Para qualquer chave **não predefinida**, defina `baseUrl` e `apiKeyEnv` explicitamente na configuração.

Defina a chave de API do provedor ativo em seu ambiente ou arquivo `.env`. A CLI carrega automaticamente `.env` do diretório de trabalho sem substituir variáveis já definidas no shell. Consulte [Variáveis de ambiente](/pt-BR/reference/environment-variables).

<a id="model-fallback-chain"></a>
### Cadeia de fallback de modelo

`translationModels` é uma **lista ordenada**, não uma única escolha. A CLI tenta o primeiro modelo; em caso de falha de solicitação ou análise, ela passa para a próxima entrada. Configure vários modelos para que uma interrupção transitória ou um modelo que tenha dificuldades com um local não bloqueie toda a execução.

**Camadas de resolução** (deduplicadas, ordem preservada):

| Pipeline | Ordem |
| --- | --- |
| UI (`translate-ui`, plurais, `proofread-ui`) | `localeModels(locale)` → `uiModels` → `translationModels` |
| Documentos, JSON, SVG | `localeModels(locale)` → `translationModels` |

O `providers.<active>.uiModels` opcional é uma lista exclusiva da UI tentada após qualquer substituição por localidade e antes da cadeia global `translationModels`. O `providers.<active>.localeModels` opcional mapeia uma localidade BCP-47 para modelos tentados **primeiro** para essa localidade em cada pipeline (`pt-br` corresponde a `pt-BR`). Quando nenhuma entrada de `localeModels` corresponde, apenas as camadas específicas do pipeline se aplicam.

Diferentes provedores e modelos variam em custo, velocidade e qualidade entre os idiomas. Trate a lista padrão de `npx ai-i18n-tools init` como um ponto de partida — expanda-a quando uma localidade produzir resultados consistentemente ruins ou adicione uma entrada de `localeModels` para essa localidade. Padrões completos e justificativa: [Configuração — `provider` e `providers`](/pt-BR/reference/configuration#provider-and-providers).

**Strings de UI:** o `uiModels` opcional permite rotear `translate-ui`, geração plural e `proofread-ui` por meio de modelos premium antes da cadeia global de `translationModels` — útil porque o texto da UI é curto, mas voltado para o usuário.

**Localidades asiáticas:** entradas opcionais de `localeModels` para `ja`, `ko`, `zh-Hans` e `zh-Hant` são tentadas primeiro em cada pipeline; modelos como `z-ai/glm-5.2` e `minimax/minimax-m2.7` geralmente têm melhor desempenho em scripts CJK do que em substitutos de uso geral.

Exemplo de configuração (OpenRouter):

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
### Validar e comparar modelos

Antes de alterar `translationModels`, confirme se cada ID ainda está disponível no provedor ativo:

```bash
npx ai-i18n-tools check-models
```

`check-models` chama o endpoint `GET /models` do provedor, valida cada id de `translationModels`, `uiModels` e `localeModels`, relata ids que estão ausentes ou após `expiration_date` e encerra com erro (non-zero) quando qualquer id configurado é inválido. Quando o provedor retorna preços (como o OpenRouter), ele também mostra o valor estimado em USD por 1 milhão de tokens.

Navegue pelo catálogo completo anunciado por um provedor:

```bash
npx ai-i18n-tools list-models
```

Compare modelos configurados em uma amostra de tradução real — cada ID exclusivo de `translationModels`, `uiModels` e `localeModels` é executado isoladamente para que você possa comparar o tempo real, o uso de tokens e o custo:

```bash
npx ai-i18n-tools bench-models
```

Substitua o texto de exemplo, os locais ou a lista de modelos:

```bash
npx ai-i18n-tools bench-models --text "Hello world" --source en --target de --model openai/gpt-4o-mini,anthropic/claude-3-haiku
```

Detalhes do comando: [referência da CLI](/pt-BR/reference/cli-commands/).

<a id="multiple-providers"></a>
### Vários provedores

Quando mais de um provedor estiver configurado, defina a chave `provider` de nível superior para selecionar o padrão. Alterne por execução sem editar a configuração:

```bash
npx ai-i18n-tools translate-docs -P anthropic
npx ai-i18n-tools bench-models -P deepseek
```

Cada bloco de provedor pode definir seu próprio `translationModels`, `uiModels` e `localeModels` opcionais, `maxTokens`, `temperature` e `requestTimeoutMs`. Um bloco `openrouter` legado de nível superior ainda é aceito e migrado automaticamente para `providers.openrouter` ao carregar.

Exemplo executável com quatro provedores no mesmo documento: [`examples/multi-provider`](/pt-BR/examples#multi-provider).

<a id="further-reference"></a>
### Referência adicional

- [Configuração — `provider` e `providers`](/pt-BR/reference/configuration#provider-and-providers) — tabela predefinida, endpoints personalizados, tempos limite de solicitação, comportamento específico do OpenRouter.
- [Arquitetura — cliente LLM](/pt-BR/reference/architecture) — como o fallback do modelo, o agrupamento e o relatório de custos funcionam internamente.
- [Variáveis de ambiente](/pt-BR/reference/environment-variables) — variáveis de ambiente de chave de API e substituições de URL base.
