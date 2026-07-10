<a id="environment-variables"></a>
# Variáveis de ambiente

| Variável               | Descrição                                                |
|------------------------|------------------------------------------------------------|
| `OPENROUTER_API_KEY`   | Chave de API para o provedor `openrouter` (necessária quando ele está ativo). |
| Outras chaves de provedor    | Cada provedor lê sua própria variável de ambiente de chave: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `DEEPSEEK_API_KEY`, `CEREBRAS_API_KEY`, `GROQ_API_KEY`, `MISTRAL_API_KEY`, `XAI_API_KEY`, `NVIDIA_API_KEY`, `ALIBABA_API_KEY`, `APIFUN_API_KEY` (Ollama não precisa de nenhuma). Substitua por provedor com `providers.<name>.apiKeyEnv`. |
| `OPENROUTER_BASE_URL`  | Substitui `providers.openrouter.baseUrl` (apenas quando esse provedor está configurado). |
| `OLLAMA_BASE_URL`      | Substitui `providers.ollama.baseUrl` (apenas quando esse provedor está configurado). |
| `AI_I18N_LANG` | Idioma da interface do usuário da própria ferramenta (ajuda da CLI, logs, painel). Substituído por `-L` / `--ui-lang`; substitui a configuração `uiLanguage`. Consulte [Idioma da interface do usuário da ferramenta](/pt-BR/guide/tool-ui-language). |
| `I18N_SOURCE_LOCALE`    | Substitui `sourceLocale` em tempo de execução.                        |
| `I18N_TARGET_LOCALES`   | Códigos de localidade separados por vírgula para substituir `targetLocales`.  |
| `I18N_LOG_LEVEL` | Nível do logger (`debug`, `info`, `warn`, `error`). Valores desconhecidos (incluindo `silent`) retornam para `info`. |
| `NO_COLOR`              | Quando `1`, desativa as cores ANSI na saída de log.              |
| `I18N_LOG_SESSION_MAX`  | Número máximo de linhas mantidas por sessão de log (padrão `5000`).           |

Na inicialização, a CLI também carrega automaticamente um arquivo `.env` do diretório de trabalho atual (via `process.loadEnvFile` do Node), para que as chaves de API do provedor sejam capturadas em shells não interativos que não carregam `.envrc` / `direnv`. Variáveis já presentes no ambiente nunca são substituídas, então os valores reais de CI/produção ainda prevalecem.
