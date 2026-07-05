<a id="documentation-cache"></a>
# Cache de documentação

A guia **Documentação** lista as traduções de segmentos de documentação em cache armazenadas no SQLite sob seu `cacheDir` configurado. Cada linha é um segmento de origem (identificado por caminho do arquivo, dica de linha e hash de origem) traduzido para um local de destino.

Use esta guia quando quiser **revisar, substituir ou limpar** as traduções de documentos em cache sem executar o pipeline completo novamente.

<a id="filters"></a>
## Filtros

| Filtro | Finalidade |
| --- | --- |
| **Selecionar caminho do arquivo** / **Nome do arquivo (parcial)** | Restringir a um arquivo ou uma subcadeia de caracteres de caminho |
| **Todos os locais** | Local de destino |
| **Todos os modelos** | Modelo que produziu a tradução |
| **Hash de origem** | Hash de segmento exato |
| **Pesquisa de texto de origem** / **Pesquisa de texto traduzido** | Correspondência de subcadeia de caracteres |
| **Todas as entradas** | **Obsoletas** (nunca reutilizadas desde a criação) ou **Ativas** (têm um carimbo de data/hora `last_hit_at`) |

Clique em **Aplicar** após alterar os filtros. **Limpar** redefine todos os campos de filtro.

<a id="edit-a-translation"></a>
## Editar uma tradução

1. Clique no ícone de edição em uma linha.
2. Altere o texto traduzido no modal e salve.

O cache armazena o `user-edited` do modelo para essa linha. Execute `sync --force-update` ou `translate-docs --force-update` para que as saídas de markdown em disco correspondam ao cache.

Se o **texto de origem** em seu repositório for alterado posteriormente, o hash do segmento será alterado e as edições manuais para o texto antigo serão substituídas na próxima execução da tradução.

<a id="delete-rows"></a>
## Excluir linhas

- **Ícone de exclusão de linha** — remove uma entrada de cache (um local para um hash de origem).
- **Excluir filtrados** — remove todas as linhas que correspondem aos filtros atuais (confirmação necessária).
- **Excluir tudo para o caminho do arquivo** — remove todas as traduções em cache para o caminho do arquivo selecionado, incluindo linhas de falha e problemas de markdown relacionadas a esse arquivo.

Após exclusões em massa, execute `translate-docs` ou `sync` para regenerar as traduções ausentes.

<a id="table-columns"></a>
## Colunas da tabela

| Coluna | Significado |
| --- | --- |
| **Caminho do arquivo** | Chave de cache para o arquivo de origem |
| **Linha #** | Dica de linha no arquivo de origem |
| **Hash de origem** | Hash do texto do segmento de origem |
| **Texto de origem** | Segmento original (localidade de origem) |
| **Localidade** | Localidade de destino |
| **Texto traduzido** | Tradução em cache |
| **Modelo** | Modelo que produziu a tradução (ou `user-edited`) |
| **Criado** | Quando a linha foi escrita pela primeira vez |
| **Último acesso** | Última vez que esta entrada de cache foi reutilizada (traço vermelho = obsoleto) |

A paginação padrão é de 50 linhas por página (25 ou 100 também estão disponíveis).

<a id="log-links"></a>
## Links de log

O controle 🔗 em uma linha solicita ao servidor que imprima dicas de arquivo:linha no terminal onde o painel está sendo executado. Use-o para abrir o local de origem correto em seu editor.
