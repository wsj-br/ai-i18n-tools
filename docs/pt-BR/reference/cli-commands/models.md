<a id="cli--models--catalog"></a>
# CLI — Modelos e catálogo

<a id="check-models"></a>
### `check-models`

**Sinopse:** `ai-i18n-tools check-models`

Valida cada ID de modelo configurado em relação à lista `GET /models` do provedor ativo (associação e `expiration_date`). Requer a chave de API desse provedor (nenhuma para provedores sem chave, como o Ollama). Sai com código de erro diferente de zero quando qualquer ID configurado está ausente ou expirado, e respeita o `requestTimeoutMs` do provedor. Quando o provedor retorna preços (por exemplo, OpenRouter), também mostra USD por 1M de tokens para prompt/conclusão.

**Ver também:** [Provedores LLM](/pt-BR/guide/providers-and-models)

---

<a id="list-models"></a>
### `list-models`

**Sinopse:** `ai-i18n-tools list-models`

Lista todos os modelos que o provedor ativo anuncia através de sua lista `GET /models` (ordenados por ID; o provedor ativo segue a chave de configuração `provider`, substitua por `-P` / `--provider`). Requer a chave de API desse provedor (nenhuma para provedores sem chave, como o Ollama). Quando o provedor retorna preços (por exemplo, OpenRouter), também mostra USD por 1M de tokens para prompt/conclusão, e marca as entradas após `expiration_date`.

**Opções principais:** `-P` / `--provider`

**Ver também:** [Provedores LLM](/pt-BR/guide/providers-and-models)

---

<a id="bench-models"></a>
### `bench-models`

**Sinopse:** `ai-i18n-tools bench-models [--model <ids>] [--text <text> | --file <path>] [--source <locale>] [--target <locale>]`

Avalia cada modelo configurado traduzindo uma amostra isoladamente (cliente de modelo único, sem cadeia de fallback). Imprime uma tabela com ID do modelo, tokens de entrada/saída, tempo de tradução (wall-clock) e custo em USD (`—` para provedores que não informam o custo), além de uma linha de totais e falhas por modelo.

Os modelos padrão são a união dos IDs `translationModels`, `uiModels` e `localeModels` do provedor ativo (substitua por `--model`); a amostra padrão é um bloco de markdown em inglês integrado (substitua por `--text` / `--file`); a origem/destino padrão é a configuração `sourceLocale` e o primeiro local de destino `docs[]`, retornando ao `targetLocales` de nível superior (substitua por `--source` / `--target`). Executa modelos em paralelo, limitado pela configuração `concurrency` (padrão 4); cada modelo ainda é cronometrado individualmente. Requer a chave de API do provedor ativo.

**Opções principais:** `--model`, `--text`, `--file`, `--source`, `--target`

---

<a id="list-languages"></a>
### `list-languages`

**Sinopse:** `ai-i18n-tools list-languages [search]`

Lista o catálogo de idiomas da UI (`data/ui-languages-complete.json`) como uma tabela legível (código, direção do texto, nome em inglês, nome nativo). Não requer configuração ou chave de API. Passe um termo `search` opcional para manter apenas as entradas cujo código, nome nativo, nome em inglês ou direção o contenham (sem distinção entre maiúsculas e minúsculas), por exemplo, `list-languages portuguese`, `list-languages rtl`, `list-languages zh`.
