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
| `APIKEYFAN_API_KEY` | `apikeyfan` |
| `CHEAPERINFERENCE_API_KEY` | `cheaperinference` |

A chave é necessária quando esse provedor está ativo. Para `apikeyfan`, o `APIFUN_API_KEY` legado é aceito quando `APIKEYFAN_API_KEY` não está definido ou está vazio. Um `apiKeyEnv` personalizado desabilita esse fallback. URLs predefinidas: [Provedores integrados](/pt-BR/guide/providers-and-models#built-in-providers).

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

Quando nenhuma chave de API de provedor é definida, a CLI e `doctor` leem `.env` e `.env.local` do diretório que contém `ai-i18n-tools.config.json`. Apenas as variáveis nas tabelas acima (além de um `providers.*.apiKeyEnv` personalizado) são copiadas, e somente quando essa variável não está definida. `.env.local` prevalece quando ambos os arquivos definem o mesmo nome. Um aviso nomeia o arquivo e as variáveis que foram lidas. `doctor` repete um aviso por arquivo na seção Ambiente e conta cada um no resumo. Esse aviso sai com código 0, a menos que `--strict` esteja definido, o que sai com código 1. Um erro sai com código 2. Se alguma chave de API de provedor já tiver um valor, nenhum dos arquivos é lido.
