<a id="usage--costs"></a>
# Uso e custos

A aba **Uso e custos** resume as chamadas de API de modelo faturadas que este projeto fez — incluindo retentativas que foram posteriormente descartadas — com contagens de tokens e um único custo em USD.

Os mesmos agregados estão disponíveis na linha de comando como `ai-i18n-tools usage`.

Use-o para responder: *quantas chamadas fizemos, quais modelos e operações gastaram tokens e qual foi o custo?*

<a id="what-is-recorded"></a>
## O que é registrado

Cada linha de detalhe é uma conclusão HTTP que retornou uso (mesmo que a tradução tenha sido posteriormente rejeitada por análise/script/qualidade e o próximo modelo de fallback tenha sido tentado). Falhas de transporte que nunca produziram um corpo faturado não são registradas.

Após a conclusão de um comando que chamou a API, as linhas anteriores a **sete dias corridos completos em UTC** (a partir das 00:00 UTC de hoje menos 7 dias) são consolidadas em totais mensais (`api_totals`) e removidas do log de detalhes. A última semana permanece como linhas `api_calls` individuais. As tabelas de resumo combinam ambas as fontes para o intervalo de tempo selecionado.

<a id="cost-reporting"></a>
## Relatório de custos

Cada chamada, cartão de resumo e tabela mostra **um** custo em USD:

1. O `usage.cost` do provedor quando a resposta o incluiu (OpenRouter hoje).
2. Caso contrário, o valor de `providers.<name>.modelPricing` ou o `pricing` padrão de todo o provedor, aplicado aos tokens de entrada e saída dessa chamada.

Novas chamadas armazenam esse valor na linha `api_calls`. Linhas mais antigas que foram armazenadas sem custo são precificadas da mesma forma quando o relatório é aberto, e então adicionadas ao mesmo valor de Custo — elas não são mostradas como uma segunda coluna. Se nenhuma das fontes se aplicar, a célula é `—`, nunca `$0.00`. Alterar as taxas configuradas posteriormente não reescreve as linhas que já têm um custo armazenado. Os rollups mensais ainda mantêm uma contagem de chamadas que armazenaram um custo (`ncost_acc` / `ncost_dis`) para que `$0.00` permaneça distinto de “desconhecido” após a compactação.

<a id="filters"></a>
## Filtros

Filtre por janela de tempo, provedor, modelo, operação (`translate-docs`, `translate-ui`, `translate-json`, `translate-svg`, `proofread-ui`, `bench-models`), localidade e resultado (aceito vs. descartado).

Janelas de tempo:

- Intervalos curtos (`Last 30 minutes` a `Last 30 days`) usam durações contínuas. **Uso ao longo do tempo** mostra uma linha por dia do calendário UTC que ainda tem detalhes nesse intervalo.
- `Last 2 months` / `Last 3 months` começam às 00:00 UTC no primeiro dia do mês calendário atual menos 1 / 2 meses. **Uso ao longo do tempo** mostra as linhas diárias retidas mais uma linha por mês.
- `All time` inclui todos os totais mensais e as linhas diárias retidas.

Para remover o uso antigo, escolha uma janela em **Excluir entradas anteriores a** (`> 1 month`, `> 2 months`, `> 3 months`, `> 6 months`, `> 1 year` ou `all data (clear)`) e, em seguida, **Excluir dados**. O menu começa em `-`, o que deixa **Excluir dados** desabilitado até que uma janela seja escolhida. As mesmas janelas estão disponíveis como `ai-i18n-tools usage --clear [--older-than 1mo|2mo|3mo|6mo|1y|all]`. Os limites de calendário mantêm o mês atual (`1mo`) ou o mês atual mais os meses anteriores.

<a id="command-line"></a>
## Linha de comando

```bash
ai-i18n-tools usage
# ai-i18n-tools usage --since 7d --operation translate-docs
# ai-i18n-tools usage --since 2mo
# ai-i18n-tools usage --clear --older-than 3mo --dry-run
```
