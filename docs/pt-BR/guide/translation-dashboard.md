<a id="translation-dashboard"></a>
# Painel de Tradução

Execute:

```bash
ai-i18n-tools dashboard
# Optional: choose port, do not auto-open browser
# ai-i18n-tools dashboard -p 8765 --no-open
```

A porta de escuta padrão é **8675**. Se essa porta estiver indisponível, o servidor tenta a próxima porta (até 1000 tentativas) e registra a porta escolhida. O alias obsoleto `editor` ainda funciona, mas exibe um aviso — prefira usar `dashboard`.

Isso inicia uma interface web local apoiada pelo banco de dados SQLite `cacheDir` configurado — a mesma pasta que a CLI usa para segmentos de documentação, logs e metadados relacionados. Inclui as abas **Documentação** (segmentos de doc em cache), **Strings de interface**, **Plurais de interface**, **Glossário**, **Falhas**, **Problemas em Markdown** e **Estatísticas**.

![Translation Dashboard](/translation-dashboard.png)

Se você **editar linhas do cache** neste aplicativo (por exemplo, segmentos de documentação), execute `sync --force-update` ou o comando de tradução equivalente com `--force-update` para que as saídas em disco correspondam ao cache; se o **texto de origem** no repositório for alterado posteriormente, os hashes dos segmentos mudarão e as edições manuais para o texto antigo serão substituídas.

<a id="failures-document-translation"></a>
### Falhas (tradução de documentos)

A aba **Falhas** é exclusiva para tradução de **documentação**. Ela lê registros de falhas escritos no SQLite quando um segmento não pôde ser traduzido com sucesso para uma localidade — por exemplo, saída vazia ou inválida do modelo, erros de validação pós-tradução (`AST mismatch`, vazamento de marcadores e verificações de **qualidade** semelhantes), ou uma condição **fatal** que impediu o progresso. Ajuda a responder: *qual segmento de origem falhou, para qual localidade e modelo, e qual texto de erro foi registrado?*

<a id="when-to-use-it"></a>
#### Quando usá-lo

- Após `translate-docs` ou `sync` terminar com erros, idiomas parciais ou logs confusos — você pode classificar e filtrar falhas em vez de apenas rolar a saída do terminal.
- Quando deseja **priorizar retrabalho**: ordene por **# Falhas** para que segmentos que falharam repetidamente em várias tentativas apareçam primeiro; esses são fortes candidatos para **simplificação ou reformatação** no markdown de origem, para que execuções futuras tenham sucesso.
- Quando você precisa do **segmento exato** — caminho do arquivo, dica de linha, hash da origem e texto completo da origem — para editar o parágrafo correto no seu repositório.

<a id="why-source-edits-matter"></a>
#### Por que edições na origem são importantes

Marcação embutida densa (**negrito** misturado com `` `code` ``, ênfase aninhada, frases longas com muitos spans) dificulta que os modelos retornem traduções que ainda passem nas verificações estruturais. Segmentos com **múltiplas falhas registradas** geralmente melhoram mais com **reescrita ou divisão** da origem (ou movendo exemplos para blocos de código destacados) do que com a repetição da tradução em texto inalterado. Isso está alinhado com [Markdown complexo e falhas nas verificações de qualidade](#complex-markdown-and-failed-quality-checks).

<a id="how-to-use-the-tab"></a>
#### Como usar a aba

1. Abra **Falhas** no painel (mesma sessão do navegador que [Translation Dashboard](#translation-dashboard)).
2. Leia a faixa de **resumo** (segmentos com qualquer falha, mais contagens de segmentos com **1**, **2** ou **3+** registros de falha).
3. Filtre por **nome de arquivo** parcial, **localidade**, **modelo**, **erro de qualidade** (valores provenientes do seu cache), **somente fatais** e opcionalmente por **hash de origem**, **texto de origem** ou substring de **mensagem de erro** — depois clique em **Aplicar**.
4. Escolha **Ordenar: # Falhas** (padrão) ou **Ordenar: caminho do arquivo + número da linha**.
5. Use a paginação no topo ou na parte inferior da tabela. **Clique em uma linha** para alternar o texto completo da origem. O controle de link na linha (quando habilitado) solicita ao processo do servidor que registre dicas de arquivo/linha no **terminal** onde `ai-i18n-tools dashboard` está em execução — útil para saltar do navegador para seu editor.
6. Corrija o **arquivo de origem** em seu projeto, depois execute `translate-docs` ou `sync` novamente. Se a lista parecer **desatualizada** após uma execução bem-sucedida, execute `ai-i18n-tools sync --force-update` e recarregue o painel (o painel Falhas exibe a mesma dica).

Para depuração baseada em arquivos ao lado da interface, você ainda pode usar `translate-docs --debug-failed` para gravar detalhes de `FAILED-TRANSLATION` em `cacheDir` durante novas tentativas — consulte [Comportamento do cache e flags `translate-docs`](#cache-behaviour-and-translate-docs-flags).

<a id="markdown-issues-static-checks"></a>
### Problemas de Markdown (verificações estáticas)

A aba **Problemas no Markdown** lista linhas da tabela `markdown_source_issues` do SQLite. Cada linha é uma descoberta **pré-tradução**: por exemplo, sequências de delimitadores que nunca formam pares como ênfase ou riscado sob as mesmas regras estilo CommonMark que o `translate-docs` usa para mascaramento, um trecho de código embutido aberto com crases mas nunca fechado, ou `STRONG_OUTSIDE_LINK` quando `**` / `__` envolvem um link `[text](url)` (coloque negrito apenas dentro do texto do link). Isso **não** é o mesmo que **Falhas**, que registra saídas por localidade e problemas de validação pós-tradução (`AST mismatch`, vazamentos de marcadores de posição e similares).

Use esta guia quando quiser corrigir o **markdown de origem** antes de gastar tokens—especialmente quando verificações de qualidade falham repetidamente na estrutura. Filtre por caminho de arquivo (correspondência parcial com a chave de cache, incluindo prefixos `doc-block:{index}:`), **código do problema** ou **hash de origem**; ordene por caminho de arquivo + linha ou pelo horário mais recente da verificação. O botão de link registra dicas de arquivo/linha no terminal onde `ai-i18n-tools dashboard` está em execução (mesma ideia da guia Documentação).

**Atualizando linhas:** execute `ai-i18n-tools check-markdown` (escopo opcional `-p` / `--path`, `--no-cache` para ignorar SQLite, `--json` para saída legível por máquina em stdout com linhas legíveis por humanos em stderr). Por padrão, cada arquivo markdown `translate-docs` executado também verifica novamente e substitui as linhas desse arquivo quando `docs[].warnMarkdownSourceIssues` não está definido como `false`. Limpar todas as traduções para um caminho de arquivo de cache remove as linhas de problemas de markdown para esse caminho de arquivo como parte do mesmo caminho de limpeza que as falhas. `cleanup` adicionalmente remove linhas de problemas de markdown cujo caminho de origem resolvido está ausente no disco, para que os diagnósticos para arquivos excluídos ou renomeados (mesmo aqueles que foram apenas verificados por `check-markdown`, nunca traduzidos) não permaneçam.
