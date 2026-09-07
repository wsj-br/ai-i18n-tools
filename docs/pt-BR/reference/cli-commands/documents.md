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

Requer pelo menos um bloco `docs[]`. Coleta `.md` / `.mdx` sob o `contentPaths` de cada bloco (respeita `.translate-ignore`). Por padrão, insere uma linha de âncora HTML `<a id="slug"></a>` imediatamente antes de cada cabeçalho ATX plano `#` (ignora cabeçalhos dentro de blocos de código cercados); quando uma linha de âncora já está presente, atualiza o `id` se ele não corresponder mais ao slug derivado do texto do cabeçalho atual. Com `--slug-style mdx-comment`, anexa um sufixo de comentário MDX do Docusaurus `{/* #slug */}` na linha do cabeçalho (mesmo algoritmo de slug estilo GitHub), atualizando um comentário obsoleto quando o texto do cabeçalho muda.

**Opções principais:** `-p` / `--path`, `-f` / `--file`, `--slug-style`, `--dry-run`

`--slug-style`: `github` (padrão; doctoc / anchor-markdown-header), `bitbucket`, `gitlab`, `pymdown`, `azure-devops`, `mdx-comment` (sufixo `{/* #… */}` do Docusaurus). Com `pymdown`, `--pymdown-case`, `--pymdown-normalize`, `--pymdown-percent-encode` / `--no-pymdown-percent-encode` opcionais.

**Ver também:** [Links de âncora](/pt-BR/guide/documents/anchor-links)

---

<a id="check-markdown"></a>
### `check-markdown`

**Sinopse:** `ai-i18n-tools check-markdown [options]`

Verifica markdown/MDX em cada `contentPaths` do bloco `docs[]` (mesma descoberta que `translate-docs`, respeita `.translate-ignore`): emparelhamento de delimitadores, código inline não fechado e `STRONG_OUTSIDE_LINK` quando `**`/`__` envolvem um link `[text](url)`.

Imprime linhas `relativePath:line: [ISSUE_CODE] message` para stderr; código de saída **1** se houver algum problema. `--json`: relatório JSON para stdout. Grava `markdown_source_issues` em `cacheDir`, a menos que `--no-cache`. `-v` adiciona hashes de origem às linhas de stderr.

**Opções principais:** `-p` / `--path`, `-f` / `--file`, `--json`, `--no-cache`

**Ver também:** [Problemas de Markdown](/pt-BR/guide/translation-dashboard/markdown-issues)
