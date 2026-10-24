<a id="models"></a>
# Modelos

A aba **Modelos** classifica os modelos de chat do provedor ativo para que você possa escolher `translationModels` sem copiar IDs manualmente. Ela utiliza a mesma classificação do [`suggest-models`](/pt-BR/reference/cli-commands/models#suggest-models).

Escolha **Qualidade** ou **Preço**. Qualidade prioriza o languagebench ChrF e o Arena Score. Preço prioriza uma taxa em USD mais baixa, mantendo um nível mínimo de qualidade. Quando a configuração possui mais de um provedor, um menu **Provedor** aparece; o padrão é o provedor com o qual o painel foi iniciado (`provider`, ou `-P` / `--provider` no comando `dashboard`). Alterar o provedor ou a prioridade recarrega a tabela. Pesos opcionais estão em [`modelSuggestion`](/pt-BR/reference/configuration#modelsuggestion).

As colunas da tabela são controles de reordenação, uma caixa de seleção, classificação, ID do modelo, índice (a pontuação ponderada vezes 100), ChrF medido, Pontuação Arena medida e preço de entrada/saída em USD por 1M de tokens. Uma medição ausente é um travessão. O número da classificação é a posição do modelo na classificação completa, antes dos filtros abaixo. Arraste a alça de uma linha, ou use seus botões para cima e para baixo, para mudar sua posição nesta tabela. **Atualizar** carrega a ordem de classificação novamente.

Os controles ficam em três cartões. **Classificação** tem o menu de prioridade (e o menu de provedor quando a configuração tem mais de um provedor). **Filtros** tem **Preço máximo de saída**, **Delta mínimo do índice** e **Atualizar**. **Ações** tem **Copiar JSON** e **Atualizar configuração**. Pressione Enter em um campo numérico para atualizar a tabela. Alterar um menu faz o mesmo.

**Preço máximo de saída** mantém modelos cujo preço de saída por 1M de tokens é no máximo aquele valor em USD. Um modelo sem preço de saída é excluído. **Delta mínimo do índice** mantém um modelo apenas quando seu índice está pelo menos tantos pontos abaixo do modelo anterior mantido. O primeiro modelo restante é sempre mantido. Deixe qualquer uma das caixas vazia para ignorar aquele filtro.

Marque os modelos que você deseja. A linha de status mostra quantos estão selecionados, por exemplo `8 models selected.` O número estreito no cabeçalho da coluna da caixa de seleção (padrão 8) indica quantas linhas iniciais essa caixa de seleção seleciona. Marcá-la seleciona essas linhas. Desmarcá-la desmarca todas as caixas de seleção. As linhas marcadas, de cima para baixo, são a ordem de fallback. **Atualizar configuração** pede confirmação, copia a configuração atual para `ai-i18n-tools.config.{timestamp}.backup.json` ao lado dela e então escreve essa ordem para `providers.<selected>.translationModels`. `uiModels` e `localeModels` permanecem inalterados. **Copiar JSON** coloca o mesmo fragmento `{ "translationModels": [...] }` na área de transferência. `suggest-models --apply` escreve o mesmo tipo de backup.

O primeiro carregamento baixa o languagebench, o Arena e o models.dev quando o cache está vazio, o que pode levar algum tempo. Carregamentos posteriores reutilizam o cache de 7 dias em `<cacheDir>/benchmark-scores.json`. A aba não possui um botão de atualização. Atualize o cache via CLI com `ai-i18n-tools suggest-models --refresh` e, em seguida, recarregue a aba. O mesmo comando pode imprimir ou aplicar a lista.

::: info Fontes de Benchmark Externas
  As pontuações são calculadas a partir de fontes de dados externas:
  - [languagebench ChrF](https://languagebench.github.io/) licenciado sob CC-BY-SA-4.0,
  - [LMArena Arena Score](https://github.com/lm-arena/lm-arena) licenciado sob CC-BY-4.0, e
  - [models.dev](https://models.dev/) preços licenciados sob MIT.
:::
