<a id="cli--models--languages"></a>
# CLI — Modelos e idiomas

<a id="check-models"></a>
### `check-models`

**Sinopse:** `ai-i18n-tools check-models`

Valida cada ID de modelo configurado em relação à lista `GET /models` do provedor ativo (associação e `expiration_date`). Requer a chave de API desse provedor (nenhuma para provedores sem chave como Ollama). Retorna um código de saída diferente de zero quando qualquer ID configurado está ausente ou expirado, e respeita o tempo limite de solicitação resolvido (`requestTimeout` ou `requestTimeoutMs` no provedor, caso contrário, o valor de nível superior). Quando o provedor retorna preços (por exemplo, OpenRouter), também mostra USD por 1M de tokens para prompt/conclusão. Quando `providers.cheaperinference.zeroDataRetention` é verdadeiro, a verificação usa `GET /v1/models?zdr=true` e falha um ID que o catálogo omite.

**Consulte também:** [Modelos de IA](/pt-BR/guide/ai-models#check-models), [Provedores de LLM](/pt-BR/guide/providers-and-models)

---

<a id="list-models"></a>
### `list-models`

**Sinopse:** `ai-i18n-tools list-models`

Lista todos os modelos que o provedor ativo anuncia por meio de sua lista `GET /models` (ordenado por ID; o provedor ativo segue a chave de configuração `provider`, substitua com `-P` / `--provider`). Requer a chave de API desse provedor (nenhuma para provedores sem chave como Ollama). Quando o provedor retorna preços (por exemplo, OpenRouter), também mostra USD por 1M de tokens para prompt/conclusão, e marca as entradas após `expiration_date`. Quando `providers.cheaperinference.zeroDataRetention` é verdadeiro, a lista é `GET /v1/models?zdr=true`.

**Opções principais:** `-P` / `--provider`

**Consulte também:** [Modelos de IA](/pt-BR/guide/ai-models#list-models), [Provedores de LLM](/pt-BR/guide/providers-and-models)

---

<a id="suggest-models"></a>
### `suggest-models`

**Sinopse:** `ai-i18n-tools suggest-models [--quality | --price] [--top <n>] [--json] [--apply] [--list] [--max-output-price <usd>] [--min-delta <points>] [--refresh]`

Classifique os modelos de chat do provedor ativo e imprima os melhores (padrão 8). As colunas da tabela, em ordem, são: classificação, ID do modelo, índice (a pontuação ponderada vezes 100, uma casa decimal), ChrF do languagebench medido, Pontuação Arena medida e preço de entrada e saída em USD por 1M de tokens. Uma medição ausente é `—`. O comando precisa da chave de API desse provedor (nenhuma para provedores sem chave, como Ollama). O provedor ativo segue a configuração `provider`; substitua-a com `-P` / `--provider`.

Os candidatos vêm da lista `GET /models` do provedor. Quando `providers.cheaperinference.zeroDataRetention` é verdadeiro, essa solicitação é `GET /v1/models?zdr=true`. Linhas expiradas e linhas não-chat (embeddings, fala, imagem, vídeo, moderação, rerankers) são omitidas. Se essa solicitação de catálogo falhar, o comando sai com 1.

`--quality` é o padrão. Ele pondera ChrF e Arena Score acima do preço. `--price` pondera o preço acima dessas pontuações e ainda mantém um piso de qualidade, para que um modelo barato não medido não se classifique mais alto do que deveria. Passar ambas as flags é um erro. Não passar nenhuma significa qualidade. Pesos opcionais `modelSuggestion` na configuração substituem qualquer um dos perfis. Consulte [Configuração](/pt-BR/reference/configuration#modelsuggestion-optional). Os mesmos pesos são usados pela [aba Modelos do painel](/pt-BR/guide/translation-dashboard/models).

ChrF é a média das linhas `translation_from` e `translation_to` do languagebench cuja métrica é `chrf`, limitada a `sourceLocale` e `targetLocales` deste projeto. Locales mapeiam para um código de idioma do languagebench (a subtag primária, com alguns aliases como `pt-BR` para `pt` e `zh-Hant` para `zh` e `yue`). Um conjunto vazio usa `en`. Arena é o Arena Score geral do LMArena, não Elo.

O preço de classificação é de `(3 × input + output) / 4` USD por 1M de tokens. Sua origem é resolvida nesta ordem: uma taxa de catálogo não zero, depois as taxas de entrada e saída de models.dev, depois o valor de custo único do languagebench. Um preço de catálogo de `0` significa sem preço, não gratuito. Um preço desconhecido é neutro no perfil de qualidade e o pior no perfil de preço.

Um ChrF ausente é classificado abaixo do piso de qualidade. Os valores de placeholder `0.35` e `0.45` usados quando ChrF ou Arena estão ausentes afetam apenas o índice; a tabela imprime `—` em vez disso.

As linhas que superam o limite vêm primeiro, depois o índice mais alto, depois um preço combinado mais barato. `--top` (padrão `8`, um número inteiro de pelo menos 1) limita a tabela, o fragmento `--json` e `--apply` juntos, após os filtros abaixo.

`--list` imprime as mesmas colunas para os `translationModels` configurados do provedor ativo, nessa ordem, e ignora `--top`. A coluna de classificação ainda é a posição de cada modelo na classificação completa. Um ID configurado que esteja ausente do catálogo, expirado ou que não seja um modelo de chat ainda é listado, com `—` para as medições. `--list` não pode ser combinado com `--apply`.

`--max-output-price` mantém modelos cujo preço de saída por 1 milhão de tokens é menor ou igual a esse valor em USD. Um modelo sem preço de saída é deixado de fora. `--min-delta` então percorre as linhas restantes e mantém um modelo apenas quando seu índice está pelo menos esse número de pontos abaixo do modelo mantido anteriormente. O primeiro modelo restante é sempre mantido. Um delta de `0` não descarta linhas. Linhas sem índice são deixadas de fora quando o delta é maior que `0`. Os números de classificação permanecem os da lista completa. Com `--list`, o percurso segue a ordem `translationModels`. Ambos os filtros também se aplicam a `--json` e `--apply`. A [aba Modelos](/pt-BR/guide/translation-dashboard/models) possui os mesmos dois controles.

`--json` grava este objeto na saída padrão (cole-o dentro do bloco do provedor) e envia a tabela e o rodapé de atribuição para a saída de erro padrão:

```json
{
  "translationModels": ["model-a", "model-b"]
}
```

`--apply` copia a configuração atual para um `ai-i18n-tools.config.{timestamp}.backup.json` irmão (ou `{name}.{timestamp}.backup.json` quando `-c` nomeia outro arquivo), então substitui `providers.<active>.translationModels` por esses IDs. Uma colisão de nome adiciona `-2`, `-3` e assim por diante antes de `.backup.json`. Se a cópia falhar, o arquivo de configuração permanece inalterado. `uiModels` e `localeModels` permanecem inalterados. As pontuações não são gravadas no arquivo de configuração. O botão **Atualizar configuração** do painel grava o mesmo backup.

Os dados de benchmark são armazenados em cache em `<cacheDir>/benchmark-scores.json` (geralmente `.translation-cache/benchmark-scores.json`) por sete dias. Os conjuntos de dados brutos são baixados em tempo de execução e não são enviados no pacote. `--refresh` baixa novamente languagebench, Arena e models.dev. Uma fonte que falha durante `--refresh` não é preenchida a partir do cache anterior. Sem `--refresh`, um download falho reutiliza a fatia em cache. Se um dos languagebench ou Arena falhar, o comando classifica com o outro e informa qual fonte falhou. Se ambos falharem, ele sai com 1. Uma falha em models.dev mantém os preços do catálogo. O painel não possui controle de atualização; execute `--refresh` a partir da CLI e, em seguida, recarregue a aba Modelos.

O rodapé atribui o languagebench (CC BY-SA 4.0), o LMArena Arena Score (CC BY 4.0) e o models.dev (MIT).

**Opções principais:** `--quality`, `--price`, `--top`, `--json`, `--apply`, `--list`, `--max-output-price`, `--min-delta`, `--refresh`, `-P` / `--provider`

**Consulte também:** [Modelos de IA](/pt-BR/guide/ai-models), [Guia Modelos](/pt-BR/guide/translation-dashboard/models)

---

<a id="bench-models"></a>
### `bench-models`

**Sinopse:** `ai-i18n-tools bench-models [--model <ids>] [--text <text> | --file <path>] [--source <locale>] [--target <locale>]`

Avalia cada modelo configurado traduzindo uma amostra isoladamente (cliente de modelo único, sem cadeia de fallback). Imprime uma tabela com ID do modelo, tokens de entrada/saída, tempo de tradução (wall-clock) e custo em USD (`—` para provedores que não informam o custo), além de uma linha de totais e falhas por modelo.

Os modelos padrão são a união dos IDs `translationModels`, `uiModels` e `localeModels` do provedor ativo (substitua por `--model`); a amostra padrão é um bloco de markdown em inglês integrado (substitua por `--text` / `--file`); a origem/destino padrão é a configuração `sourceLocale` e o primeiro local de destino `docs[]`, retornando ao `targetLocales` de nível superior (substitua por `--source` / `--target`). Executa modelos em paralelo, limitado pela configuração `concurrency` (padrão 4); cada modelo ainda é cronometrado individualmente. Requer a chave de API do provedor ativo.

**Opções principais:** `--model`, `--text`, `--file`, `--source`, `--target`

**Consulte também:** [Modelos de IA](/pt-BR/guide/ai-models#bench-models)

---

<a id="list-languages"></a>
### `list-languages`

**Sinopse:** `ai-i18n-tools list-languages [search]`

Lista o catálogo de idiomas da UI (`data/ui-languages-complete.json`) como uma tabela legível (código, direção do texto, nome em inglês, nome nativo). Não requer configuração ou chave de API. Passe um termo `search` opcional para manter apenas as entradas cujo código, nome nativo, nome em inglês ou direção o contenham (sem distinção entre maiúsculas e minúsculas), por exemplo, `list-languages portuguese`, `list-languages rtl`, `list-languages zh`.
