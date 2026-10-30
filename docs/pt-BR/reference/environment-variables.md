<a id="environment-variables"></a>
# Variáveis de ambiente

<a id="provider-api-keys"></a>
## Chaves de API do provedor

`init -P <provider>` seleciona essa predefinição integrada e a chave de API na tabela abaixo. Sobrescreva o nome da variável para um provedor com `providers.<name>.apiKeyEnv`. Ollama não possui chave de API.

| Variável | Provedor |
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

A chave é necessária quando esse provedor está ativo. URLs predefinidas: [Provedores integrados](/pt-BR/guide/providers-and-models#built-in-providers).

<a id="provider-base-urls"></a>
## URLs base do provedor

Estas duas variáveis substituem `baseUrl` para um provedor configurado. Todos os outros predefinidos alteram sua URL na configuração (`providers.<name>.baseUrl`), não por meio de uma variável de ambiente.

| Variável | Substitui |
| --- | --- |
| `OPENROUTER_BASE_URL` | `providers.openrouter.baseUrl` (apenas quando esse provedor estiver configurado) |
| `OLLAMA_BASE_URL` | `providers.ollama.baseUrl` (apenas quando esse provedor estiver configurado) |

<a id="tool-and-run"></a>
## Ferramenta e execução

| Variável | Descrição |
| --- | --- |
| `AI_I18N_LANG` | Idioma da própria interface da ferramenta (ajuda da CLI, logs, painel). Substituído por `-L` / `--ui-lang`; substitui a configuração `uiLanguage`. Consulte [Idioma da interface da ferramenta](/pt-BR/guide/tool-ui-language). |
| `I18N_SOURCE_LOCALE`    | Substitui `sourceLocale` em tempo de execução.                        |
| `I18N_TARGET_LOCALES`   | Códigos de localidade separados por vírgula para substituir `targetLocales`.  |
| `I18N_LOG_LEVEL` | Nível do logger (`debug`, `info`, `warn`, `error`). Valores desconhecidos (incluindo `silent`) retornam para `info`. |
| `NO_COLOR`              | Quando `1`, desativa as cores ANSI na saída de log.              |
| `I18N_LOG_SESSION_MAX`  | Número máximo de linhas mantidas por sessão de log (padrão `5000`).           |

Na inicialização, a CLI também carrega automaticamente um arquivo `.env` do diretório de trabalho atual (via `process.loadEnvFile` do Node), para que as chaves de API do provedor sejam carregadas em shells não interativos que não carregam `.envrc` via `direnv`. Variáveis já presentes no ambiente nunca são sobrescritas, para que os valores reais de CI/produção tenham precedência.
