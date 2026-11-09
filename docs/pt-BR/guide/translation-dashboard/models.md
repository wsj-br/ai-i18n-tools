<a id="models"></a>
# Modelos

A guia **Modelos** classifica os modelos de chat do provedor ativo para que você possa escolher `translationModels` sem precisar copiar os IDs manualmente. Ela usa a mesma classificação do [`suggest-models`](/pt-BR/reference/cli-commands/models#suggest-models). O tutorial, incluindo o motivo pelo qual a lista contém mais de um modelo, está em [Modelos de IA](/pt-BR/guide/ai-models).

A página é dividida em dois painéis. **Configuração atual** é a cadeia de fallback já armazenada para o provedor selecionado. A primeira linha é tentada primeiro. **Sugestões** é o catálogo classificado que você pode verificar, reordenar e gravar. Alterar o provedor ou a prioridade recarrega ambos os painéis. Um ID configurado que está faltando no catálogo ainda aparece em **Configuração atual**, marcado como não estando no catálogo.

Escolha **Qualidade** ou **Preço**. Qualidade classifica pelo índice ChrF e Arena e trata a coluna de fronteira como um rótulo. Preço lista o nível 1 do mais barato para o mais caro, depois o nível 2 da mesma forma, e assim por diante. Ele ainda mantém um piso de qualidade, então um modelo barato sem medição permanece abaixo dos modelos que têm pontuações. Quando a configuração tem mais de um provedor, um menu **Provedor** aparece; o padrão é o provedor com o qual o painel foi iniciado (`provider`, ou `-P` / `--provider` no comando `dashboard`). Pesos opcionais estão em [`modelSuggestion`](/pt-BR/reference/configuration#modelsuggestion-optional).

Ambos os painéis compartilham as colunas de pontuação e preço: ID do modelo, índice (a pontuação de qualidade vezes 100), ChrF medido, Pontuação Arena medida, preço de entrada, preço de saída, preço combinado em USD por 1M de tokens e nível de fronteira. Uma medição ausente é um travessão. Passe o mouse sobre um cabeçalho de coluna em qualquer painel para ver uma breve descrição dessa coluna. Passe o mouse sobre um valor de fronteira de 2 ou superior para ver qual modelo de nível 1 domina essa linha. O número indica a profundidade dessa cadeia, não o quão distante o índice está do melhor modelo. Um ID que repete o ChrF, a Pontuação Arena e os preços de token de outra linha é omitido de **Sugestões**. O ID mais curto é mantido, e um ID sem data prevalece sobre um datado. Um alias configurado ainda aparece em **Configuração atual**. Um empate exato no preço combinado e no índice compartilha o nível. Como ler a coluna: [Lendo a coluna de fronteira](/pt-BR/guide/ai-models#reading-the-frontier-column).

**Configuração atual** adiciona uma coluna de ordem. Esse número é o lugar do modelo na cadeia armazenada.

**Sugestões** adiciona controles de reordenação, uma caixa de seleção e classificação. O número de classificação é o lugar do modelo na classificação completa, antes dos filtros abaixo. Arraste a alça de uma linha, ou use seus botões para cima e para baixo, para mudar seu lugar nesta tabela. **Atualizar** carrega a ordem de classificação novamente.

Os controles estão em três cartões. **Classificação** tem o menu de prioridade (e o menu do provedor quando a configuração tem mais de um provedor). **Filtros** tem **Preço combinado máximo**, **Delta de índice mínimo** e **Atualizar**. **Ações** tem **Copiar JSON** e **Atualizar configuração**. Pressione Enter em um campo numérico para atualizar a tabela. Alterar um menu faz o mesmo.

**Preço combinado máximo** mantém modelos cujo preço combinado `(3 × input + output) / 4` por 1M de tokens é no máximo aquele valor em USD. Um modelo sem preço combinado é omitido. **Delta mínimo do índice** mantém um modelo apenas quando seu índice difere do modelo anterior mantido por pelo menos aquela quantidade de pontos. O primeiro modelo restante é sempre mantido. Deixe qualquer uma das caixas vazia para pular esse filtro. Em um ranking de qualidade, defina ambos antes de **Atualizar configuração**: o limite de preço mantém um fallback dentro de um orçamento, e a lacuna do índice descarta um modelo que está apenas um pequeno passo do modelo acima dele. Uma linha dominada sob o limite ainda pode permanecer. A coluna de fronteira é o que mostra isso.

Marque os modelos que você deseja. A linha de status mostra quantos estão selecionados, por exemplo `8 models selected.` O número estreito no cabeçalho da coluna da caixa de seleção (padrão 8) indica quantas linhas iniciais essa caixa de seleção seleciona. Marcá-la seleciona essas linhas. Desmarcá-la desmarca todas as caixas de seleção. As linhas marcadas, de cima para baixo, são a ordem de fallback. **Atualizar configuração** pede confirmação, copia a configuração atual para `ai-i18n-tools.config.{timestamp}.backup.json` ao lado dela e então escreve essa ordem para `providers.<selected>.translationModels`. `uiModels` e `localeModels` permanecem inalterados. **Copiar JSON** coloca o mesmo fragmento `{ "translationModels": [...] }` na área de transferência. `suggest-models --apply` escreve o mesmo tipo de backup.

O primeiro carregamento baixa o languagebench, o Arena e o models.dev quando o cache está vazio, o que pode levar algum tempo. Carregamentos posteriores reutilizam o cache de 7 dias em `<cacheDir>/benchmark-scores.json`. A aba não possui um botão de atualização. Atualize o cache via CLI com `ai-i18n-tools suggest-models --refresh` e, em seguida, recarregue a aba. O mesmo comando pode imprimir ou aplicar a lista.

::: info Fontes de Benchmark Externas
As pontuações são calculadas a partir de fontes de dados externas:

- [languagebench ChrF](https://huggingface.co/spaces/fair-forward/languagebench) licenciado sob CC-BY-SA-4.0,
- [LMArena Arena Score](https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset) licenciado sob CC-BY-4.0, e
- preços [models.dev](https://models.dev/) licenciados sob MIT.
:::
