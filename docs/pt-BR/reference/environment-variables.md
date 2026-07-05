<a id="environment-variables"></a>
# Variáveis de ambiente

| Variável               | Descrição                                                |
|------------------------|------------------------------------------------------------|
| `OPENROUTER_API_KEY`   | Chave de API para o provedor `openrouter` (necessária quando ele está ativo). |
| Outras chaves de provedor    | Cada provedor lê sua própria variável de ambiente de chave: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `DEEPSEEK_API_KEY`, `CEREBRAS_API_KEY`, `GROQ_API_KEY`, `MISTRAL_API_KEY`, `XAI_API_KEY`, `NVIDIA_API_KEY`, `ALIBABA_API_KEY`, `APIFUN_API_KEY` (Ollama não precisa de nenhuma). Substitua por provedor com `providers.<name>.apiKeyEnv`. |
| `OPENROUTER_BASE_URL`  | Substitui `providers.openrouter.baseUrl` (apenas quando esse provedor está configurado). |
| `OLLAMA_BASE_URL`      | Substitui `providers.ollama.baseUrl` (apenas quando esse provedor está configurado). |
| `AI_I18N_LANG`         | Idioma da própria interface do usuário da ferramenta (ajuda da CLI, logs, painel). Substituído por `-L` / `--ui-lang`; substitui a configuração `uiLanguage`. Veja [Idioma da interface do usuário da ferramenta](#tool-ui-language). |
| `I18N_SOURCE_LOCALE`    | Substitui `sourceLocale` em tempo de execução.                        |
| `I18N_TARGET_LOCALES`   | Códigos de localidade separados por vírgula para substituir `targetLocales`.  |
| `I18N_LOG_LEVEL` | Nível do logger (`debug`, `info`, `warn`, `error`). Valores desconhecidos (incluindo `silent`) retornam para `info`. |
| `NO_COLOR`              | Quando `1`, desativa as cores ANSI na saída de log.              |
| `I18N_LOG_SESSION_MAX`  | Número máximo de linhas mantidas por sessão de log (padrão `5000`).           |

Na inicialização, a CLI também carrega automaticamente um arquivo `.env` do diretório de trabalho atual (via `process.loadEnvFile` do Node), para que as chaves de API do provedor sejam capturadas em shells não interativos que não carregam `.envrc` / `direnv`. Variáveis já presentes no ambiente nunca são substituídas, então os valores reais de CI/produção ainda prevalecem.

<a id="tool-ui-language"></a>
## Idioma da interface do usuário da ferramenta

A ferramenta localiza sua própria interface de usuário — texto de ajuda da CLI, mensagens de log/resumo/erro de alto tráfego e o Painel de Tradução — independentemente do `sourceLocale` / `targetLocales` do seu projeto. A localidade da interface do usuário é resolvida a partir destas fontes, com a maior prioridade primeiro:

1. Flag global `-L` / `--ui-lang <code>` (ex: `-L pt-BR`).
2. Variável de ambiente `AI_I18N_LANG` (ex: `export AI_I18N_LANG=es`).
3. A chave de configuração `uiLanguage` em `ai-i18n-tools.config.json` (string BCP-47).
4. O local do sistema operacional do host (via `Intl.DateTimeFormat().resolvedOptions().locale`).

A localidade solicitada é comparada exatamente com os idiomas de interface do usuário fornecidos ou por variação mais próxima (por exemplo, `pt-PT` resolve para `pt-BR`, e `en-US` resolve para `en-GB`); quando nada corresponde, ele volta para a localidade de origem (`en-GB`). Quando um idioma de interface do usuário é solicitado explicitamente (via sinalizador, variável de ambiente ou `uiLanguage`) mas nenhum pacote fornecido corresponde, a CLI exibe um aviso único de que a localidade padrão será usada; uma localidade inferida apenas do sistema operacional do host nunca gera aviso.

Idiomas de interface do usuário fornecidos: `en-GB` (origem) mais `de`, `es`, `fr`, `hi-Latn`, `ja`, `ko`, `pt-BR`, `zh-Hans` e `zh-Hant`. O Painel de Tradução lê a localidade resolvida, a direção do layout e o pacote de tradução de `GET /api/ui-i18n` e os aplica ao carregar (ele define `<html lang>` / `dir` e localiza o markup estático via atributos `data-i18n*`). Este recurso não requer nenhuma configuração — por padrão, a ferramenta segue a localidade do seu sistema operacional.
