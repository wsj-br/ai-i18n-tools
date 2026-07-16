<a id="cli--cache--maintenance"></a>
# CLI — Cache e manutenção

<a id="cleanup"></a>
### `cleanup`

**Sinopse:** `ai-i18n-tools cleanup [--dry-run] [--backup <path>]`

Limpa a tabela `markdown_source_issues` inteira e, em seguida, executa `sync --force-update` (extração, IU, SVG, documentos e `translate-json` quando ativado) para que os problemas de markdown sejam repopulados para os documentos configurados atualmente; em seguida, remove linhas de segmento obsoletas (`last_hit_at` nulo / caminho de arquivo vazio); descarta linhas `file_tracking` cujo caminho de origem resolvido está ausente no disco; remove linhas de tradução cujos metadados `filepath` apontam para um arquivo ausente; remove linhas `translation_failures` órfãs; e descarta linhas de cache para localidades ausentes da configuração (`sourceLocale`, raiz `targetLocales` e qualquer `docs[]` / `json[]` `targetLocales` por bloco). Somente cache para localidades desativadas — documentos gerados, arquivos de IU simples e entradas `strings.json` são deixados intactos (use [`purge-locale`](#purge-locale) para removê-los). Registra as contagens de remoção após a sincronização (segmentos obsoletos, `file_tracking` órfãos, traduções órfãs, falhas órfãs, localidades não configuradas) mais a contagem de limpeza de problemas de markdown antecipada.

**Opções principais:** `--dry-run`, `--backup`

`--backup <path>` grava um backup SQLite nesse caminho antes das modificações (nenhum backup, a menos que este sinalizador esteja definido).

---

<a id="clean-temp"></a>
### `clean-temp`

**Sinopse:** `ai-i18n-tools clean-temp [-r | --root <path>] [-f | --force] [--dry-run]`

Nenhuma configuração. Percorre uma árvore de diretórios (padrão: diretório de trabalho atual) para `*.log`, `*.tmp` e `cache.db.backup*.sqlite`, imprime caminhos `./…` como `find -print`. Com correspondências: solicita `Delete these files? (y/n)`, a menos que `-f` / `--force` (excluir sem prompt). Sem correspondências: sai sem solicitar. `--dry-run`: apenas lista, sem prompt ou exclusões (substitui `--force`).

**Opções principais:** `-r` / `--root`, `-f` / `--force`, `--dry-run`

---

<a id="purge-locale"></a>
### `purge-locale`

**Sinopse:** `ai-i18n-tools purge-locale -l <code> [-l <code> …] [options]`

Exclui todas as linhas em cache para os locais fornecidos de `translations`, `file_tracking` e `translation_failures`, e os artefatos gerados para esse local: documentos traduzidos (saídas `.md` / `.mdx` / `.astro` resolvidas de `docs[]`, incluindo saídas órfãs cuja origem foi removida — encontradas varrendo a árvore de saída de cada bloco, exceto quando um `pathTemplate` personalizado é configurado), o arquivo de UI plano por local (`<flatOutputDir>/<locale>.json`) e as entradas do local em `strings.json`.

Os locais são passados via `-l` / `--locale` repetíveis (normalizados para BCP-47). Imprime contagens por local (linhas de cache, documentos, entradas `strings.json`, arquivo plano); avisa (não gera erro) para locais sem nada para limpar. Solicita confirmação, a menos que `-y` / `--yes` / `-f` / `--force`. `--dry-run`: relata contagens e os arquivos que seriam removidos, não exclui nada. `--keep-files`: limpa apenas o cache SQLite, deixando os arquivos gerados e `strings.json` intocados. Nenhum backup SQLite é feito, a menos que `--backup <path>` seja passado, o que grava um backup nesse caminho antes da exclusão.

**Opções principais:** `-l` / `--locale`, `--dry-run`, `-y` / `--yes`, `-f` / `--force`, `--keep-files`, `--backup`
