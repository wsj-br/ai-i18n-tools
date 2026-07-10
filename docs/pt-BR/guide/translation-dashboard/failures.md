<a id="failures-document-translation"></a>
# Falhas (tradução de documentos)

A aba **Falhas** é apenas para tradução de **documentação**. Ela lê os registros de falha gravados no SQLite quando um segmento não pôde ser traduzido com sucesso para um local — por exemplo, saída de modelo vazia ou inválida, erros de validação pós-tradução (`AST mismatch`, vazamentos de placeholder e verificações de **qualidade** semelhantes), ou uma condição **fatal** que bloqueou o progresso.

Ela ajuda você a responder: *qual segmento de origem falhou, para qual local e modelo, e qual texto de erro foi registrado?*

<a id="when-to-use-it"></a>
## Quando usar

- Depois que `translate-docs` ou `sync` termina com erros, locais parciais ou logs confusos — classifique e filtre as falhas em vez de apenas rolar a saída do terminal.
- Quando você quiser **priorizar o retrabalho**: classifique por **# Falhas** para que os segmentos que falharam repetidamente em várias tentativas apareçam primeiro; esses são fortes candidatos a **simplificar ou reformatar** no markdown de origem.
- Quando você precisar do **segmento exato** — caminho do arquivo, dica de linha, hash de origem e texto de origem completo — para editar o parágrafo correto em seu repositório.

<a id="why-source-edits-matter"></a>
## Por que as edições de origem importam

Marcação inline densa (**negrito** misturado com `` `code` ``, ênfase aninhada, frases longas com muitos spans) torna mais difícil para os modelos retornarem traduções que ainda passem nas verificações estruturais. Segmentos com **múltiplas falhas registradas** geralmente melhoram mais com a **reescrita ou divisão** da origem (ou movendo exemplos para blocos de código cercados) do que com a reexecução da tradução em texto inalterado. Isso se alinha com [Markdown complexo e verificações de qualidade falhas](/pt-BR/guide/documents/#complex-markdown-and-failed-quality-checks).

<a id="how-to-use-the-tab"></a>
## Como usar a aba

1. Abra **Falhas** no painel.
2. Leia a faixa de **resumo** — segmentos com qualquer falha, mais contagens para segmentos com **1**, **2** ou **3+** registros de falha.
3. Filtre por **nome de arquivo** parcial, **local**, **modelo**, **erro de qualidade** (os valores vêm do seu cache), **somente fatal** e, opcionalmente, **hash de origem**, **texto de origem** ou substring de **mensagem de erro** — então clique em **Aplicar**.
4. Escolha **Classificar: # Falhas** (padrão) ou **Classificar: caminho do arquivo + linha #**.
5. Use a paginação na parte superior ou inferior da tabela. **Clique em uma linha** para expandir o texto de origem completo. A coluna **Modelo** mostra o modelo de falha e, quando disponível, o modelo de uma entrada de cache bem-sucedida posterior.
6. O controle de link 🔗 registra dicas de arquivo/linha no **terminal** onde `ai-i18n-tools dashboard` está sendo executado.
7. Corrija o **arquivo de origem** em seu projeto e execute `translate-docs` ou `sync` novamente. Se a lista parecer **desatualizada** após uma execução bem-sucedida, execute `ai-i18n-tools sync --force-update` e recarregue o painel.

Para depuração baseada em arquivo junto com a interface do usuário, use `translate-docs --debug-failed` para gravar detalhes de `FAILED-TRANSLATION` em `cacheDir` durante as tentativas — consulte [Comportamento do cache e sinalizadores `translate-docs`](/pt-BR/guide/documents/cli-options#cache-behaviour-and-translate-docs-flags).

<a id="failures-vs-markdown-issues"></a>
## Falhas vs. Problemas de Markdown

| | **Falhas** | **Problemas de Markdown** |
| --- | --- | --- |
| Quando registrado | Durante a tradução (por local) | Antes da tradução (verificação de origem) |
| Causa típica | Saída de modelo ruim, erros de validação | Ênfase não pareada, spans de código não fechados, negrito fora dos links |
| Correção | Edite a origem e re-traduza | Corrija o markdown de origem e re-traduza |

Consulte [Problemas de Markdown](/pt-BR/guide/translation-dashboard/markdown-issues) para verificações estáticas pré-tradução.
