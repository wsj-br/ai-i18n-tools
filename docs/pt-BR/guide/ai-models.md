<a id="ai-models"></a>
# Modelos de IA

Um modelo é um sistema nomeado no seu provedor, como `google/gemini-2.5-flash` ou `gpt-5-mini`. `init` grava uma lista `translationModels` inicial para o provedor que você escolheu. Considere essa lista como um ponto de partida.

Escolha a lista para este projeto com `suggest-models` ou com a mesma classificação no Painel de Tradução em **Modelos**. Ambos classificam os modelos de chat do provedor ativo a partir de benchmarks publicados e podem gravar o resultado em `translationModels`. Primeiro, configure o provedor e sua chave de API: [Provedores de LLM](/pt-BR/guide/providers-and-models).

<a id="start-with-a-ranked-shortlist"></a>
## Comece com uma lista restrita classificada

<a id="from-the-command-line"></a>
### Da linha de comando

`suggest-models` classifica os modelos de chat que o provedor ativo oferece no momento e imprime uma tabela curta. A qualidade é o padrão: as medições de tradução e uma pontuação de preferência geral contam mais do que o preço.

```bash
ai-i18n-tools suggest-models
```

As colunas são classificação, ID do modelo, índice, ChrF medido, Arena Score medido e preço de entrada e saída em USD por 1 milhão de tokens. Uma medição ausente é `—`. O índice é a pontuação ponderada multiplicada por 100. Na classificação por qualidade, um índice mais alto indica uma correspondência mais forte para este projeto.

Grave essa lista restrita na configuração quando a tabela parecer correta:

```bash
ai-i18n-tools suggest-models --apply
```

`--apply` substitui `providers.<active>.translationModels`. Primeiro, ele copia a configuração atual para um arquivo irmão `ai-i18n-tools.config.{timestamp}.backup.json`. `uiModels` e `localeModels` permanecem como estão. `--top` (padrão 8) é quantos IDs a tabela e `--apply` incluem. O primeiro ID é o que a tradução tenta primeiro.

`--price` prioriza uma taxa mais baixa e ainda mantém um piso de qualidade, de modo que um modelo barato sem medição fica abaixo dos modelos que têm pontuações. `--quality` é o padrão. Passar ambas as flags é um erro.

<a id="from-the-dashboard"></a>
### Do painel

A guia **Modelos** mostra a mesma classificação, com uma caixa de seleção em cada linha.

```bash
ai-i18n-tools dashboard
```

Abra **Modelos**. Escolha **Qualidade** ou **Preço**. Marque as linhas que você deseja. As linhas marcadas, de cima para baixo, definem a ordem que a tradução tentará. **Atualizar configuração** pede confirmação, grava o mesmo tipo de backup e salva essa ordem em `translationModels`. **Copiar JSON** coloca o fragmento `{ "translationModels": [...] }` na área de transferência quando você preferir colá-lo.

**Preço máximo de saída** e **Delta mínimo do índice** correspondem a `suggest-models --max-output-price` e `--min-delta`. Controles e colunas: [Guia Modelos](/pt-BR/guide/translation-dashboard/models).

<a id="how-the-ranking-chooses"></a>
### Como a classificação escolhe

A lista restrita é um ranking de benchmark do catálogo de chat ao vivo do provedor. A primeira execução baixa três conjuntos de dados públicos e pode levar algum tempo. Execuções posteriores reutilizam o cache de 7 dias em `<cacheDir>/benchmark-scores.json` (geralmente `.translation-cache/benchmark-scores.json`).

| Sinal | O que contribui | Fonte |
| --- | --- | --- |
| ChrF | Qualidade da tradução para os idiomas do seu projeto | [languagebench](https://languagebench.github.io/) (CC BY-SA 4.0) |
| Arena Score | Preferência geral de comparações diretas | [LMArena Arena Score](https://github.com/lm-arena/lm-arena) (CC BY 4.0) |
| USD por 1 milhão de tokens | Preço de entrada e saída | O catálogo do provedor quando ele publica as taxas, caso contrário, [models.dev](https://models.dev/) (MIT) |

O ChrF usa as pontuações de tradução do languagebench para seus `sourceLocale` e `targetLocales`. As localidades são mapeadas para um código de idioma do languagebench: a subtag primária, com aliases como `pt-BR` para `pt` e `zh-Hant` para `zh`. Um modelo que traduz bem esses idiomas supera um que só tem uma boa pontuação geral. Modelos de embeddings, imagem, fala e outros que não são de chat são ignorados, assim como os IDs que já passaram da data de validade.

Qualidade, o perfil padrão, dá mais peso ao ChrF e à Pontuação da Arena do que ao preço. Preço inverte essa ênfase e mantém o piso de qualidade descrito acima. Os pesos opcionais são [`modelSuggestion`](/pt-BR/reference/configuration#modelsuggestion).

`suggest-models --refresh` baixa novamente os conjuntos de dados. Recarregue a guia **Modelos** depois.

Todas as flags, incluindo `--json`, `--list` e a fórmula de pontuação: [suggest-models](/pt-BR/reference/cli-commands/models#suggest-models).

<a id="why-the-list-has-more-than-one-model"></a>
## Por que a lista tem mais de um modelo

<a id="model-fallback-chain"></a>
### Cadeia de fallback de modelo

`translationModels` é uma lista ordenada. A CLI tenta o primeiro modelo. Em caso de falha na solicitação, uma resposta que não consegue analisar ou um texto no sistema de escrita errado, ela tenta o próximo id para aquele lote.

Um id é um ponto único de falha. Um modelo pode exceder o tempo limite, retornar um texto que esta ferramenta rejeita ou traduzir bem um idioma e mal outro. Um caso comum é o hindi romanizado, em que `hi` espera o Devanagari. A saída romanizada é rejeitada para localidades com escrita nativa. Uma localidade que deve permanecer romanizada precisa de uma subtag `-Latn` explícita, como `hi-Latn`.

É por isso que a lista de preferência contém vários ids, com os mais fortes primeiro. A ordem na lista é a ordem em que a tradução tenta.

**Camadas de resolução** (deduplicadas, ordem preservada):

| Pipeline | Ordem |
| --- | --- |
| UI (`translate-ui`, plurais, `proofread-ui`) | `localeModels(locale)` → `uiModels` → `translationModels` |
| Documentos, JSON, SVG | `localeModels(locale)` → `translationModels` |

A maioria dos projetos define apenas `translationModels`. As outras duas listas existem para quando um tipo de texto, ou um idioma, deve tentar modelos diferentes primeiro.

**Strings de UI.** O `uiModels` opcional é tentado após qualquer substituição correspondente por localidade e antes de `translationModels`. O texto da UI é curto e visível, então usar um modelo mais forte nessa cadeia é uma divisão comum. `suggest-models --apply` grava apenas `translationModels`.

**Uma localidade.** O `localeModels` opcional mapeia uma tag BCP-47 para modelos tentados primeiro para essa localidade em todos os pipelines (`pt-br` corresponde a `pt-BR`). Japonês, coreano e chinês geralmente se saem melhor com modelos ajustados para essas escritas, como `z-ai/glm-5.3` e `minimax/minimax-m2.7`, do que com um fallback de uso geral. Quando nenhuma entrada corresponde, apenas as camadas de pipeline acima se aplicam.

Exemplo (OpenRouter). Os ids mostram o formato das três listas. Obtenha `translationModels` de `suggest-models` ou da guia **Modelos**. Adicione `uiModels` ou `localeModels` quando o texto da UI ou uma localidade precisar de sua própria cadeia.

```json
{
  "provider": "openrouter",
  "providers": {
    "openrouter": {
      "translationModels": [
        "google/gemini-2.5-flash",
        "deepseek/deepseek-v4-flash",
        "openai/gpt-5-mini"
      ],
      "uiModels": [
        "anthropic/claude-sonnet-latest",
        "openai/gpt-5.4"
      ],
      "localeModels": [
        { "locale": "ja", "models": ["z-ai/glm-5.3", "minimax/minimax-m2.7"] },
        { "locale": "ko", "models": ["z-ai/glm-5.3", "minimax/minimax-m2.7"] },
        { "locale": "zh-Hans", "models": ["z-ai/glm-5.3", "minimax/minimax-m2.7"] },
        { "locale": "zh-Hant", "models": ["z-ai/glm-5.3", "minimax/minimax-m2.7"] }
      ]
    }
  }
}
```

Listas predefinidas de `init` e a referência de campo: [Configuração — `provider` e `providers`](/pt-BR/reference/configuration#provider-and-providers).

<a id="check-list-and-benchmark"></a>
## Verifique, liste e faça benchmark

Depois que a lista de preferência estiver na configuração, estes comandos a inspecionam. A tradução pode ser executada antes de você usá-los.

<a id="check-models"></a>
### `check-models`

Confirma que cada id configurado ainda é oferecido pelo provedor ativo.

```bash
ai-i18n-tools check-models
```

Ele chama o endpoint `GET /models` do provedor, verifica todos os ids em `translationModels`, `uiModels` e `localeModels`, relata os ids que estão faltando ou que passaram de `expiration_date` e sai com um código diferente de zero quando qualquer id configurado é inválido. Quando o provedor publica preços (OpenRouter e Cheaper Inference o fazem), ele também mostra o valor em USD por 1 milhão de tokens.

<a id="list-models"></a>
### `list-models`

Imprime o catálogo completo que o provedor anuncia, classificado por id. Use-o para procurar um id que a classificação deixou de fora.

```bash
ai-i18n-tools list-models
```

<a id="bench-models"></a>
### `bench-models`

Traduz uma amostra por meio de cada modelo configurado individualmente e imprime os tokens de entrada e saída, o tempo de relógio e o custo em USD. `suggest-models` usa as pontuações publicadas acima. `bench-models` chama os modelos, então gasta crédito da API e mostra a latência e o preço na sua conta.

```bash
ai-i18n-tools bench-models
```

Cada id exclusivo de `translationModels`, `uiModels` e `localeModels` é executado sem fallback. Substitua a amostra ou os ids para uma comparação específica:

```bash
ai-i18n-tools bench-models --text "Hello world" --source en --target de --model openai/gpt-5-mini,google/gemini-2.5-flash
```

Com a [retenção zero de dados](/pt-BR/guide/providers-and-models#cheaperinference-zero-data-retention) ativada para o Cheaper Inference, `check-models`, `list-models` e `suggest-models` leem `GET /models?zdr=true`.

Detalhes do comando: [CLI — Modelos e idiomas](/pt-BR/reference/cli-commands/models).

<a id="further-reference"></a>
## Referências adicionais

- [Provedores de LLM](/pt-BR/guide/providers-and-models) — predefinições, chaves de API e como alternar entre provedores com `-P`.
- [Aba Modelos](/pt-BR/guide/translation-dashboard/models) — a mesma classificação no dashboard.
- [Configuração — `provider` e `providers`](/pt-BR/reference/configuration#provider-and-providers) — `translationModels`, `uiModels`, `localeModels`, timeouts e taxas de custo.
- [suggest-models](/pt-BR/reference/cli-commands/models#suggest-models) — flags, filtros e a fórmula de pontuação.
