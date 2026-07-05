<a id="markdown-issues-static-checks"></a>
# Problemas de Markdown (verificações estáticas)

A aba **Problemas de Markdown** lista as linhas da tabela SQLite `markdown_source_issues`. Cada linha é um achado de **pré-tradução**: por exemplo, sequências de delimitadores que nunca se emparelham como ênfase/riscado sob as mesmas regras estilo CommonMark que `translate-docs` usa para mascaramento, um trecho de código inline aberto com crases, mas nunca fechado, ou `STRONG_OUTSIDE_LINK` quando `**` / `__` envolvem um link `[text](url)` (coloque o negrito apenas dentro do texto do link).

Isso **não** é o mesmo que **Falhas**, que registra a saída do modelo por localidade e problemas de validação pós-tradução (`AST mismatch`, vazamentos de placeholders e similares).

<a id="when-to-use-it"></a>
## Quando usar

Use esta aba quando quiser corrigir o **markdown de origem** antes de gastar tokens — especialmente quando as verificações de qualidade continuam falhando na estrutura na aba [Falhas](/guide/translation-dashboard/failures).

<a id="how-to-use-the-tab"></a>
## Como usar a aba

1. Leia a faixa de **resumo** — total de linhas de problemas e contagens por código de problema.
2. Filtre por caminho do arquivo (correspondência parcial com a chave de cache, incluindo prefixos `doc-block:{index}:`), **código do problema** ou **hash de origem**.
3. Classifique por **caminho do arquivo + linha** (padrão) ou por **tempo de varredura mais recente**.
4. O botão de link 🔗 registra dicas de arquivo/linha no terminal onde `ai-i18n-tools dashboard` está sendo executado.

Corrija o arquivo de origem e, em seguida, execute a tradução novamente.

<a id="refreshing-rows"></a>
## Atualizando linhas

| Comando / evento | Efeito |
| --- | --- |
| `ai-i18n-tools check-markdown` | Reescaneia documentos configurados; escopo opcional `-p` / `--path`, `--no-cache`, `--json` |
| `translate-docs` (padrão) | Reescaneia e substitui linhas para cada arquivo markdown quando `docs[].warnMarkdownSourceIssues` não é `false` |
| Excluir todas as traduções para um caminho de arquivo | Remove linhas de problemas de markdown para esse caminho de arquivo (mesma limpeza que falhas) |
| `cleanup` | Limpa toda a tabela `markdown_source_issues` e, em seguida, executa `sync --force-update` para repopular as linhas |

<a id="common-issue-codes"></a>
## Códigos de problema comuns

| Código | Significado |
| --- | --- |
| Ênfase / riscado não pareados | Sequências de delimitadores que nunca fecham sob as regras CommonMark |
| Código inline não fechado | Trecho de crase aberto, mas não fechado |
| `STRONG_OUTSIDE_LINK` | Marcadores em negrito envolvem um link markdown — mova o negrito para dentro do texto do link |

Veja também [Markdown complexo e verificações de qualidade falhas](/guide/documents/#complex-markdown-and-failed-quality-checks).
