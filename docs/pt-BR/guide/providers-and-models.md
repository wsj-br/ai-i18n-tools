<a id="llm-providers"></a>
# Provedores de LLM

Cada pipeline de tradução — `translate-ui`, `translate-docs`, `translate-json` e `translate-svg` — envia texto para um LLM através do mesmo cliente agnóstico de provedor. Antes que qualquer um desses comandos possa ser executado, configure **pelo menos um provedor** em `ai-i18n-tools.config.json` e defina a **chave de API** correspondente em seu ambiente ou `.env` (predefinições integradas, exceto **Ollama**). `init` escreve um bloco inicial `provider` / `providers`; você ainda deve fornecer credenciais para a predefinição ativa.

Você configura **qual endpoint de API chamar** uma vez na configuração; todos os comandos de tradução compartilham essa configuração e o mesmo cache SQLite. Quais modelos esse provedor tenta usar é uma etapa separada: [Modelos de IA](/pt-BR/guide/ai-models).

A CLI resolve o provedor ativo a partir da chave `provider` de nível superior (ou da única entrada em `providers` quando apenas um está configurado). Cada bloco de provedor lista uma cadeia de fallback `translationModels` ordenada; predefinições incorporadas herdam `baseUrl` e a variável de ambiente da chave de API automaticamente (substitua-as por provedor quando necessário).

<a id="built-in-providers"></a>
### Provedores integrados

As chaves de provedor predefinidas precisam apenas de `translationModels` — URL base e variável de ambiente da chave de API são preenchidas automaticamente:

<div class="provider-presets">

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
| `cheaperinference` | `https://api.cheaperinference.com/v1` | `CHEAPERINFERENCE_API_KEY` |
| `ollama` | `http://localhost:11434/v1` | (nenhum) |

</div>

Para qualquer chave **não predefinida**, defina `baseUrl` e `apiKeyEnv` explicitamente na configuração.

Defina a chave de API do provedor ativo em seu ambiente ou arquivo `.env`. A CLI carrega automaticamente `.env` do diretório de trabalho sem substituir variáveis já definidas no shell. Consulte [Variáveis de ambiente](/pt-BR/reference/environment-variables).

<a id="zero-data-retention-cheaper-inference"></a>
### Retenção zero de dados (inferência mais barata)

`providers.cheaperinference.zeroDataRetention` é opcional e está desativado por padrão. Defina-o quando este projeto precisar enviar prompts apenas por meio de provedores que não os armazenam.

```json
"cheaperinference": {
  "zeroDataRetention": true,
  "translationModels": ["gemini-2.5-flash", "deepseek-v4-flash"]
}
```

Com a flag ativada, cada solicitação de chat inclui `"zdr": true`, e `list-models`, `check-models` e `suggest-models` (incluindo a aba Modelos do painel) exibem `GET /v1/models?zdr=true`. Esse catálogo lista os modelos que uma solicitação de retenção de dados zero pode usar, pelo preço de retenção de dados zero. `check-models` trata um ID ausente desse catálogo como inválido. A flag não cria uma rota para um modelo que o catálogo omite. Remova esse ID de `translationModels`, `uiModels` ou `localeModels`.

Deixe a flag desativada quando a conta Cheaper Inference não exigir retenção zero de dados. Se a [Proteção de Dados](https://platform.cheaperinference.com/dashboard/data-protection) já estiver ativada para a conta, Cheaper Inference ainda recusa um modelo sem uma rota de retenção zero de dados. O erro nomeia esse modelo. Para manter a política da conta, defina `zeroDataRetention` como `true` e mude para um modelo do catálogo de retenção zero de dados. Para manter o modelo recusado, desative a retenção zero de dados naquela página. A cadeia de fallback então tenta o próximo modelo configurado.

<a id="models"></a>
### Modelos

A escolha de modelos, a lista de fallback e `suggest-models`, `check-models`, `list-models` e `bench-models` estão em [Modelos de IA](/pt-BR/guide/ai-models).

<a id="multiple-providers"></a>
### Vários provedores

Quando mais de um provedor estiver configurado, defina a chave `provider` de nível superior para selecionar o padrão. Alterne por execução sem editar a configuração:

```bash
npx ai-i18n-tools translate-docs -P anthropic
npx ai-i18n-tools bench-models -P deepseek
```

Cada bloco de provedor pode definir seu próprio `translationModels`, `uiModels` e `localeModels` opcionais, `maxTokens`, `temperature` e `requestTimeout` (segundos) ou `requestTimeoutMs`. Um tempo limite no provedor substitui o `requestTimeout` / `requestTimeoutMs` de nível superior. Um bloco `openrouter` de nível superior legado ainda é aceito e migrado automaticamente para `providers.openrouter` no carregamento.

`pricing` e `modelPricing` opcionais definem o custo em USD por 1M de tokens (`inputPerMTokens` e `outputPerMTokens`) quando o provedor omite `usage.cost`. `pricing` é o padrão para todo o provedor; uma entrada `modelPricing` o sobrescreve para um ID de modelo. OpenRouter e Cheaper Inference já retornam um custo por chamada, então não defina ambos nesses provedores. Um custo relatado pelo provedor é mantido como retornado. O valor está incluído no resumo da tradução, [`usage`](/pt-BR/reference/cli-commands/workflows#usage), e [Uso e custos](/pt-BR/guide/translation-dashboard/usage).

Exemplo executável com quatro provedores no mesmo documento, incluindo taxas de exemplo: [`examples/multi-provider`](/pt-BR/examples#multi-provider).

<a id="further-reference"></a>
### Referência adicional

- [Modelos de IA](/pt-BR/guide/ai-models) — lista de prioridades, lista de fallback e os comandos de modelo.
- [Configuração — `provider` e `providers`](/pt-BR/reference/configuration#provider-and-providers) — tabela de predefinições, endpoints personalizados, tempos limite de solicitação, taxas de custo, retenção zero de dados da Inferência Mais Barata, comportamento específico do OpenRouter.
- [Arquitetura — cliente LLM](/pt-BR/reference/architecture) — como o fallback de modelo, o envio em lote e os relatórios de custo funcionam internamente.
- [Variáveis de ambiente](/pt-BR/reference/environment-variables) — variáveis de ambiente de chave de API e substituições de URL base.
