<a id="cli-options"></a>
# Opções da CLI

Referência para o comportamento do cache `translate-docs`, sinalizadores, formato de prompt em lote e chaves de caminho internas do SQLite.

<a id="cache-behaviour-and-translate-docs-flags"></a>
## Comportamento do cache e sinalizadores `translate-docs`

A CLI mantém o **rastreamento de arquivos** no SQLite (hash de origem por arquivo × localidade) e linhas de **segmento** (hash × localidade por bloco traduzível). Uma execução normal ignora um arquivo completamente quando o hash rastreado corresponde à origem atual, o arquivo de saída já existe **e** o tempo de modificação da saída é pelo menos tão novo quanto o da origem; caso contrário, ele processa o arquivo e usa o cache de segmento para que o texto inalterado não chame a API.

| Flag                          | Efeito                                                                                                                                                                                                                                                              |
|-------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| *(padrão)*                   | Ignorar arquivos inalterados quando o rastreamento + saída em disco coincidirem; usar cache de segmento para o restante.                                                                                                                                                                          |
| `-l, --locale <codes>`        | Localidades de destino separadas por vírgulas (quando omitidas, os padrões correspondem à união da raiz `targetLocales` e do `docs[]` opcional de cada bloco `targetLocales`).                                                                                                       |
| `-p, --path` / `-f, --file`   | Traduzir apenas markdown/JSON sob este caminho (relativo ao projeto, absoluto ou padrão glob); `--file` é um alias para `--path`.                                                                                                                                 |
| `--dry-run`                   | Sem gravações de arquivos e sem chamadas à API.                                                                                                                                                                                                                                        |
| `--type <kind>`               | Restringir a `markdown` ou `json` (caso contrário, ambos quando habilitados na configuração).                                                                                                                                                                                               |
| `--json-only` / `--no-json`   | Traduzir apenas arquivos de rótulos JSON, ou ignorar JSON e traduzir apenas markdown.                                                                                                                                                                                              |
| `-j, --concurrency <n>`       | Número máximo de localidades de destino em paralelo (padrão da configuração ou valor padrão embutido na CLI).                                                                                                                                                                                              |
| `-b, --batch-concurrency <n>` | Número máximo de chamadas paralelas à API por lote por arquivo (documentos; padrão da configuração ou CLI).                                                                                                                                                                                               |
| `--emphasis-placeholders`     | Mascara marcadores de ênfase markdown como espaços reservados antes da tradução. Ativado automaticamente para localidades CJK e RTL, a menos que substituído por bloco via `docs[].emphasisPlaceholders` ou desativado com `--no-emphasis-placeholders`.                                                                                                                                                                          |
| `--debug-failed`              | Gravar logs detalhados `FAILED-TRANSLATION` em `cacheDir` quando a validação falhar.                                                                                                                                                                                        |
| `--force-update`              | Reprocessa todos os arquivos correspondentes (extrai, remonta, grava saídas), mesmo quando o rastreamento de arquivos os ignoraria. **O cache de segmentos ainda se aplica** — segmentos inalterados não são enviados ao LLM.                                                                                    |
| `--force`                     | Limpa o rastreamento de arquivos para cada arquivo processado e **não lê** o cache de segmentos para tradução via API (retradução completa). Os novos resultados ainda são **gravados** no cache de segmentos.                                                                                 |
| `--stats`                     | Exibe contagens de segmentos, contagem de arquivos rastreados e totais de segmentos por localidade, depois encerra.                                                                                                                                                                                    |
| `--clear-cache [locale]`      | Exclui traduções em cache (e o rastreamento de arquivos): todas as localidades ou uma única localidade, depois encerra.                                                                                                                                                                             |
| `--prompt-format <mode>`      | Define como cada **lote** de segmentos é enviado ao modelo e analisado (`xml`, `json-array` ou `json-object`). Padrão `json-array`. Não altera extração, marcadores de posição, validação, cache ou comportamento de fallback — consulte [Formato do prompt por lote](#batch-prompt-format). |

Você não pode combinar `--force` com `--force-update` (são mutuamente exclusivos).

<a id="batch-prompt-format"></a>
## Formato do prompt em lote

`translate-docs` envia segmentos traduzíveis para o provedor LLM ativo em **lotes** (agrupados por `batchSize` / `maxBatchChars`). O sinalizador `--prompt-format` apenas altera o **formato de transmissão** desse lote; os tokens `PlaceholderHandler`, as verificações AST do markdown, as chaves de cache do SQLite e o fallback por segmento quando a análise em lote falha permanecem inalterados.

| Modo                   | Mensagem do usuário                                                           | Resposta do modelo                                                 |
|------------------------|------------------------------------------------------------------------|-------------------------------------------------------------|
| `xml`                  | Pseudo-XML: um `<seg id="N">…</seg>` por segmento (com escape XML). | Apenas blocos `<t id="N">…</t>`, um por índice de segmento.       |
| `json-array` (padrão) | Um array JSON de strings, uma entrada por segmento em ordem.               | Um array JSON do **mesmo comprimento** (mesma ordem).           |
| `json-object`          | Um objeto JSON `{"0":"…","1":"…",…}` indexado pelo índice do segmento.            | Um objeto JSON com as **mesmas chaves** e valores traduzidos. |

O cabeçalho da execução também imprime `Batch prompt format: …` para que você possa confirmar o modo ativo. Os arquivos de rótulo JSON (`docusaurusCatalogDir`) e os lotes de arquivos SVG usam a mesma configuração quando essas etapas são executadas como parte de `translate-docs` (ou da fase de documentos de `sync` — `sync` não expõe esse sinalizador; ele assume como padrão `json-array`).

<a id="segment-dedupe-and-paths-in-sqlite"></a>
## Desduplicação de segmentos e caminhos no SQLite

> **Observação:** Esta seção aborda detalhes internos da chave de cache, úteis para depurar o comportamento do `cleanup` ou ferramentas personalizadas. A maioria dos usuários pode pular esta parte.

- As linhas de segmento são indexadas globalmente por `(source_hash, locale)` (hash = conteúdo normalizado). Texto idêntico em dois arquivos compartilha uma única linha; `translations.filepath` é metadado (último escritor), não uma entrada de cache separada por arquivo.
- `file_tracking.filepath` usa chaves com namespace: `doc-block:{index}:{relPath}` por bloco `docs` (`relPath` é o caminho posix relativo à raiz do projeto: caminhos markdown conforme coletados; **arquivos de rótulo JSON usam o caminho relativo ao diretório de trabalho atual (cwd) do arquivo de origem**, por exemplo, `docs-site/i18n/en/code.json`, para que a limpeza possa resolver o arquivo real), `json-block:{index}:{relPath}` para fontes `json[]` sob `translate-json`, e `svg-files:{relPath}` para arquivos SVG sob `translate-svg`.
- `translations.filepath` armazena caminhos posix relativos ao cwd para segmentos markdown, JSON e SVG (SVG usa o mesmo formato de caminho que outros ativos; o prefixo `svg-files:…` está presente **apenas** em `file_tracking`).
- Após uma execução, `last_hit_at` é limpo apenas para linhas de segmento **no mesmo escopo de tradução** (respeitando `--path` e tipos habilitados) que não foram acessadas, portanto, uma execução filtrada ou apenas de documentos não marca arquivos não relacionados como obsoletos.
