<a id="ai-models"></a>
# Modelos de IA

Um modelo é um sistema nomeado no seu provedor, como `google/gemini-2.5-flash` ou `gpt-5-mini`. `init` grava uma lista `translationModels` inicial para o provedor que você escolheu. Considere essa lista como um ponto de partida.

Escolha a lista para este projeto com `suggest-models` ou com a mesma classificação no Painel de Tradução em **Modelos**. Ambos classificam os modelos de chat do provedor ativo a partir de benchmarks publicados e podem gravar o resultado em `translationModels`. Primeiro, configure o provedor e sua chave de API: [Provedores de LLM](/pt-BR/guide/providers-and-models).

<a id="start-with-a-ranked-list"></a>
## Comece com uma lista classificada

<a id="from-the-command-line"></a>
### Pela linha de comando

`suggest-models` classifica os modelos de chat que o provedor ativo oferece atualmente e imprime uma tabela curta. Qualidade é o padrão: o índice é languagebench ChrF e Arena Score. Preço é uma coluna separada e uma ordem de classificação, não parte do índice.

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --top 10 --max-price 6
```

As colunas são classificação, ID do modelo, índice, ChrF medido, Arena Score medido, preço de entrada, preço de saída, preço combinado em USD por 1M de tokens e nível de fronteira. Uma medição ausente é `—`. O índice é a pontuação de qualidade vezes 100. Um índice mais alto significa uma correspondência mais forte para os idiomas deste projeto. Um ID que repete o ChrF, Arena Score e preços de token de outra linha é omitido desta tabela. `--list` ainda o imprime.

Grave essa lista na configuração quando a tabela parecer correta:

```bash
ai-i18n-tools suggest-models --apply
ai-i18n-tools suggest-models --apply --top 10 --max-price 6
```

`--apply` substitui `providers.<active>.translationModels`. Ele copia a configuração atual para um `ai-i18n-tools.config.{timestamp}.backup.json` irmão primeiro. `uiModels` e `localeModels` permanecem como estão. `--top` (padrão 8) é quantos IDs a tabela e `--apply` incluem. O primeiro ID é o que a tradução tenta primeiro. Para essa lista, adicione `--max-price` e `--min-delta`. O limite de preço impede que um fallback custe mais do que o orçamento, e a lacuna de índice descarta um modelo que está apenas um pequeno passo de distância do que foi mantido acima dele.

`--price` lista os modelos mais baratos na fronteira qualidade-preço primeiro e ainda mantém um piso de qualidade, então um modelo barato sem medição permanece abaixo dos modelos que têm pontuações. `--quality` é o padrão. Passar ambas as flags é um erro.

<a id="from-the-dashboard"></a>
### Pelo painel

A guia **Modelos** mostra a mesma classificação, com uma caixa de seleção em cada linha.

```bash
ai-i18n-tools dashboard
```

Abra **Modelos**. Escolha **Qualidade** ou **Preço**. Marque as linhas que você deseja. As linhas marcadas, de cima para baixo, definem a ordem que a tradução tentará. **Atualizar configuração** pede confirmação, grava o mesmo tipo de backup e salva essa ordem em `translationModels`. **Copiar JSON** coloca o fragmento `{ "translationModels": [...] }` na área de transferência quando você preferir colá-lo.

**Preço combinado máximo** e **Delta mínimo do índice** correspondem a `suggest-models --max-price` e `--min-delta`. Controles e colunas: [guia Modelos](/pt-BR/guide/translation-dashboard/models).

<a id="how-the-ranking-chooses"></a>
### Como a classificação escolhe

A lista é uma classificação de benchmark do catálogo de chat ao vivo do provedor. A primeira execução baixa três conjuntos de dados públicos e pode demorar um pouco. Execuções posteriores reutilizam o cache de 7 dias.

| Sinal | O que ele contribui | Fonte |
| --- | --- | --- |
| ChrF | Qualidade da tradução para os idiomas do seu projeto | [languagebench](https://huggingface.co/spaces/fair-forward/languagebench) (CC BY-SA 4.0) |
| Arena Score | Preferência geral de comparações diretas | [LMArena Arena Score](https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset) (CC BY 4.0) |
| USD por 1M de tokens | Preço de entrada, saída e combinado `(3 × input + output) / 4` | O catálogo do provedor quando ele publica as taxas, caso contrário [models.dev](https://models.dev/) (MIT) |

A partir desses sinais, o ranking deriva dois valores para cada modelo candidato: o índice de qualidade (combinando ChrF e Arena Score) e o nível da [fronteira de Pareto](https://en.wikipedia.org/wiki/Pareto_frontier) (avaliando a qualidade em relação ao preço combinado do token).

O ChrF usa as pontuações de tradução do languagebench para seus `sourceLocale` e `targetLocales`. As localidades são mapeadas para um código de idioma do languagebench: a subtag primária, com aliases como `pt-BR` para `pt` e `zh-Hant` para `zh`. Um modelo que traduz bem esses idiomas supera um que só tem uma boa pontuação geral. Modelos de embeddings, imagem, fala e outros que não são de chat são ignorados, assim como os IDs que já passaram da data de validade.

O índice é ChrF e Arena Score. O preço não faz parte dele. A pontuação pondera ChrF (padrão 55%) e Arena Score (padrão 45%), cada um normalizado em relação à pontuação mais alta no catálogo de chat do provedor, arredondado para uma casa decimal em uma escala de 0 a 100. Valores substitutos (`0.35` para ChrF, `0.45` para Arena) aplicam-se apenas quando uma medição está ausente; a tabela imprime `—`.

O piso de qualidade é um limite mínimo de ChrF (padrão 70% do melhor ChrF do pool de candidatos para qualidade e 60% para preço). Modelos abaixo deste piso, incluindo qualquer modelo sem medição de ChrF, são classificados após os modelos que o superam e mostram `—` na coluna de fronteira. Qualidade, o perfil padrão, classifica pelo índice e desempata índices iguais com o preço combinado mais barato. Preço ordena os modelos por nível de fronteira (nível 1 mais barato primeiro, depois nível 2, e assim por diante). Pesos e piso personalizados opcionais estão em [`modelSuggestion`](/pt-BR/reference/configuration#modelsuggestion-optional).

Dois IDs que compartilham ChrF, Arena Score, preço de entrada e preço de saída são aliases. As sugestões mantêm o ID mais curto e um ID sem data em vez de um que tenha uma data, como `preview-06-05` ou `20241022`. Os outros IDs permanecem no ranking completo, então `--list` ainda pode mostrar um alias configurado, e eles são omitidos da tabela, `--json` e `--apply`.

<a id="reading-the-frontier-column"></a>
#### Lendo a coluna de fronteira

A coluna de fronteira é um nível, não uma pontuação. Um modelo é dominado quando outro modelo não custa mais (preço combinado) e tem pelo menos o mesmo índice, e é estritamente mais barato ou estritamente mais alto no índice. Um `2` não é duas vezes pior que um `1`, e os números de nível não comparam a qualidade entre as linhas: apenas o índice faz isso. Duas linhas podem mostrar `3` e `4` e ainda estar a um ponto do modelo de nível 1 que as supera.

- `1` significa que nenhum outro modelo é mais barato e tem um índice mais alto. Em `--price`, o nível 1 vai do mais barato ao mais caro, e cada etapa custa mais e tem um índice mais alto. `--min-delta` oculta uma etapa que adiciona apenas um pequeno ganho.
- `2` significa que o modelo é dominado, mas apenas por modelos de nível 1. A linha abaixo da tabela nomeia o modelo de nível 1 que supera cada linha dominada. Passe o mouse sobre o valor no painel para ver o mesmo modelo.
- `3` e superiores seguem a mesma regra um passo adiante. Quanto maior o número, mais longa a cadeia, não mais distante o índice está do melhor modelo.
- `—` significa que o modelo não tem preço, está abaixo do piso de qualidade ou é um alias de outra linha. Ele não é comparado.

O nível 1 é uma verificação de eficiência: nada mais é estritamente mais barato e com pontuação mais alta. Um nível superior ainda pode pertencer à lista. Diversidade de fornecedores, limites de taxa, latência e janela de contexto estão fora do índice, e um fallback de outro fornecedor ainda ajuda quando um modelo de nível 1 atinge o limite de taxa ou rejeita um lote. Outro ID para o mesmo modelo não ajuda nisso.

Um empate exato que não é um alias (o mesmo preço combinado e o mesmo índice, com preços de token diferentes ou pontuações diferentes) compartilha o nível. O índice é comparado conforme mostrado na tabela, arredondado para uma casa decimal.

Os níveis são calculados sobre todo o catálogo, então `--max-price`, `--min-delta` e `--top` ocultam linhas sem renumerá-las. Um modelo que é nível 1 na lista completa permanece nível 1 após um limite de preço. `--max-price` remove modelos acima de um orçamento. Ele não remove todas as linhas dominadas abaixo do limite. A coluna de fronteira e a linha abaixo da tabela mostram isso.

`--price` lista o nível 1 do mais barato ao mais caro, depois o nível 2 da mesma forma, e assim por diante. Qualidade, o padrão, classifica pelo índice e trata a coluna de fronteira como um rótulo.

`suggest-models --refresh` baixa novamente os conjuntos de dados. Recarregue a guia **Modelos** depois.

Todas as flags, incluindo `--json`, `--list` e a fórmula de pontuação: [suggest-models](/pt-BR/reference/cli-commands/models#suggest-models).

<a id="why-the-list-has-more-than-one-model"></a>
## Por que a lista tem mais de um modelo

<a id="model-fallback-chain"></a>
### Cadeia de fallback do modelo

`translationModels` é uma lista ordenada. A CLI tenta o primeiro modelo. Em caso de falha na solicitação, uma resposta que não consegue analisar ou um texto no sistema de escrita errado, ela tenta o próximo id para aquele lote.

Um ID é um único ponto de falha. Um modelo pode atingir o tempo limite, retornar texto que esta ferramenta rejeita ou traduzir um idioma bem e outro mal. Um caso comum é o hindi romanizado onde `hi` espera Devanagari. A saída romanizada é rejeitada para localidades com script nativo. Uma localidade que deve permanecer romanizada precisa de uma subtag `-Latn` explícita, como `hi-Latn`.

É por isso que a lista contém vários IDs, os mais fortes primeiro. A ordem na lista é a ordem que a tradução tenta.

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

Listas predefinidas de `init`, e a referência de campo: [Configuração —](/pt-BR/reference/configuration#provider-and-providers) `provider` [e](/pt-BR/reference/configuration#provider-and-providers) `providers`.

<a id="check-list-and-benchmark"></a>
## Verificar, listar e comparar desempenho

Depois que a lista estiver na configuração, esses comandos a inspecionam. A tradução pode ser executada antes de você usá-los.

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

Detalhes do comando: [CLI — Modelos e idiomas](/pt-BR/reference/cli-commands/models).

<a id="further-reference"></a>
## Referência adicional

- [Provedores de LLM](/pt-BR/guide/providers-and-models) — predefinições, chaves de API e troca de provedores com `-P`.
- [Guia Modelos](/pt-BR/guide/translation-dashboard/models) — a mesma classificação no painel.
- [Configuração —](/pt-BR/reference/configuration#provider-and-providers) `provider` [e](/pt-BR/reference/configuration#provider-and-providers) `providers` — `translationModels`, `uiModels`, `localeModels`, tempos limite e taxas de custo.
- [suggest-models](/pt-BR/reference/cli-commands/models#suggest-models) — sinalizadores, filtros e a fórmula de pontuação.

::: info Fontes de Benchmark Externas
As pontuações são calculadas a partir de fontes de dados externas:

- [languagebench ChrF](https://huggingface.co/spaces/fair-forward/languagebench) licenciado sob CC-BY-SA-4.0,
- [LMArena Arena Score](https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset) licenciado sob CC-BY-4.0, e
- preços [models.dev](https://models.dev/) licenciados sob MIT.
:::
