<a id="models"></a>
# Modelos

A aba **Modelos** classifica os modelos de chat do provedor ativo para que você possa escolher `translationModels` sem copiar IDs manualmente. Ela utiliza a mesma classificação do [`suggest-models`](/pt-BR/reference/cli-commands/models#suggest-models).

Escolha **Qualidade** ou **Preço**. Qualidade prioriza o languagebench ChrF e o Arena Score. Preço prioriza uma taxa em USD mais baixa, mantendo um nível mínimo de qualidade. Quando a configuração possui mais de um provedor, um menu **Provedor** aparece; o padrão é o provedor com o qual o painel foi iniciado (`provider`, ou `-P` / `--provider` no comando `dashboard`). Alterar o provedor ou a prioridade recarrega a tabela. Pesos opcionais estão em [`modelSuggestion`](/pt-BR/reference/configuration#modelsuggestion).

As colunas da tabela são classificação, ID do modelo, índice (a pontuação ponderada multiplicada por 100), ChrF medido, Arena Score medido e preço de entrada/saída em USD por 1 milhão de tokens. Uma medição ausente é representada por um travessão. O número da classificação é a posição do modelo no ranking completo, antes dos filtros abaixo.

**Preço máximo de saída** mantém modelos cujo preço de saída por 1 milhão de tokens seja, no máximo, esse valor em USD. Um modelo sem preço de saída é excluído. **Delta mínimo do índice** mantém um modelo apenas quando seu índice estiver pelo menos esse número de pontos abaixo do modelo mantido anteriormente. O primeiro modelo restante é sempre mantido. Deixe qualquer uma das caixas vazia para ignorar esse filtro. Alterar qualquer um dos valores recarrega a tabela.

Marque os modelos que você deseja. **Usar top** (padrão 5) seleciona as primeiras N linhas da lista filtrada e redefine sua ordem. Mova um ID selecionado para cima ou para baixo para definir a ordem de fallback. **Atualizar configuração** grava essa ordem em `providers.<selected>.translationModels` e deixa `uiModels` e `localeModels` inalterados. **Copiar JSON** coloca o mesmo fragmento `{ "translationModels": [...] }` na área de transferência.

O primeiro carregamento baixa o languagebench, o Arena e o models.dev quando o cache está vazio, o que pode levar algum tempo. Carregamentos posteriores reutilizam o cache de 7 dias em `<cacheDir>/benchmark-scores.json`. A aba não possui um botão de atualização. Atualize o cache via CLI com `ai-i18n-tools suggest-models --refresh` e, em seguida, recarregue a aba. O mesmo comando pode imprimir ou aplicar a lista.

O rodapé atribui o languagebench (CC BY-SA 4.0), o LMArena Arena Score (CC BY 4.0) e o models.dev (MIT).
