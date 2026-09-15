<a id="cli--documents"></a>
# CLI — Documentos

<a id="translate-docs"></a>
### `translate-docs`

**Sinopse:** `ai-i18n-tools translate-docs [options]`

Traduz markdown, MDX, `.astro`, JSON de catálogo Docusaurus opcional (`docusaurusCatalogDir`), `_meta.ts`/dicionário Nextra opcional `.ts` e catálogo de tema VitePress opcional para cada bloco `docs`.

**Opções principais:** `-l`, `-j`, `-b`, `--prompt-format`, `--force`, `--force-update`, `-p` / `-f`, `--dry-run`

`-j`: número máximo de localidades paralelas; `-b`: número máximo de chamadas de API em lote paralelas por arquivo. `--prompt-format`: formato de transmissão em lote (`xml` | `json-array` | `json-object`).

**Ver também:** [Comportamento do cache e sinalizadores `translate-docs`](/pt-BR/guide/documents/cli-options#cache-behaviour-and-translate-docs-flags), [Formato de prompt em lote](/pt-BR/guide/documents/cli-options#batch-prompt-format)

---

<a id="write-heading-ids"></a>
### `write-heading-ids`

**Sinopse:** `ai-i18n-tools write-heading-ids [options]`

Requer pelo menos um bloco `docs[]`. Coleta `.md` / `.mdx` sob o `contentPaths` de cada bloco (respeita `.translate-ignore`). Por padrão, insere uma linha de âncora HTML `<a id="slug"></a>` imediatamente antes de cada título ATX `#` simples (ignora títulos dentro de blocos de código cercados). IDs de título existentes de qualquer forma (linha de âncora HTML, sufixo `{#id}` clássico, comentário MDX `{/* #id */}`) são substituídos pelo estilo selecionado; o slug é sempre derivado do texto do título atual. Com `--slug-style mdx-comment`, escreve um sufixo de comentário MDX do Docusaurus na linha do título (mesmo algoritmo de slug estilo github) e remove uma âncora HTML precedente, se presente. `--remove` remove todas essas formas de ID de título e não escreve nada em seu lugar.

**Opções principais:** `-p` / `--path`, `-f` / `--file`, `--slug-style`, `--remove`, `--dry-run`

`--slug-style`: `github` (padrão; doctoc / anchor-markdown-header), `bitbucket`, `gitlab`, `pymdown`, `azure-devops`, `mdx-comment` (sufixo `{/* #… */}` do Docusaurus). Com `pymdown`, `--pymdown-case` opcional, `--pymdown-normalize`, `--pymdown-percent-encode` / `--no-pymdown-percent-encode`. `--remove` não pode ser combinado com `--pymdown-*`.

**Ver também:** [Links de âncora](/pt-BR/guide/documents/anchor-links)

---

<a id="check-markdown"></a>
### `check-markdown`

**Sinopse:** `ai-i18n-tools check-markdown [options]`

Verifica markdown/MDX em cada `contentPaths` do bloco `docs[]` (mesma descoberta que `translate-docs`, respeita `.translate-ignore`): emparelhamento de delimitadores, código inline não fechado e `STRONG_OUTSIDE_LINK` quando `**`/`__` envolvem um link `[text](url)`.

Imprime linhas `relativePath:line: [ISSUE_CODE] message` para stderr; código de saída **1** se houver algum problema. `--json`: relatório JSON para stdout. Grava `markdown_source_issues` em `cacheDir`, a menos que `--no-cache`. `-v` adiciona hashes de origem às linhas de stderr.

**Opções principais:** `-p` / `--path`, `-f` / `--file`, `--json`, `--no-cache`

**Ver também:** [Problemas de Markdown](/pt-BR/guide/translation-dashboard/markdown-issues)
