<a id="cli--documents"></a>
# CLI — Documents

<a id="translate-docs"></a>
### `translate-docs`

**Synopsis :** `ai-i18n-tools translate-docs [options]`

Traduit le Markdown, le MDX, `.astro`, le JSON de catalogue Docusaurus facultatif (`docusaurusCatalogDir`), le `_meta.ts`/dictionnaire Nextra facultatif (`.ts`) et le catalogue de thèmes VitePress facultatif pour chaque bloc `docs`.

**Options clés :** `-l`, `-j`, `-b`, `--prompt-format`, `--force`, `--force-update`, `-p` / `-f`, `--dry-run`

`-j` : nombre maximal de locales parallèles ; `-b` : nombre maximal d'appels d'API par lot parallèles par fichier. `--prompt-format` : format de transmission par lot (`xml` | `json-array` | `json-object`).

**Voir aussi :** [Comportement du cache et indicateurs `translate-docs`](/guide/documents/cli-options#cache-behaviour-and-translate-docs-flags), [Format d'invite par lot](/guide/documents/cli-options#batch-prompt-format)

---

<a id="write-heading-ids"></a>
### `write-heading-ids`

**Synopsis :** `ai-i18n-tools write-heading-ids [options]`

Nécessite au moins un bloc `docs[]`. Collecte `.md` / `.mdx` sous le `contentPaths` de chaque bloc (respecte `.translate-ignore`). Insère une ligne d'ancrage HTML `<a id="slug"></a>` immédiatement avant chaque en-tête ATX plat `#` (ignore les en-têtes à l'intérieur des blocs de code clôturés) ; lorsqu'une ligne d'ancrage est déjà présente, met à jour le `id` s'il ne correspond plus au slug dérivé du texte de l'en-tête actuel.

**Options clés :** `-p` / `--path`, `-f` / `--file`, `--slug-style`, `--dry-run`

`--slug-style` : `github` (par défaut ; doctoc / anchor-markdown-header), `bitbucket`, `gitlab`, `pymdown`, `azure-devops`. Avec `pymdown`, `--pymdown-case`, `--pymdown-normalize`, `--pymdown-percent-encode` / `--no-pymdown-percent-encode` facultatifs.

**Voir aussi :** [Liens d'ancrage](/guide/documents/anchor-links)

---

<a id="check-markdown"></a>
### `check-markdown`

**Synopsis :** `ai-i18n-tools check-markdown [options]`

Analyse le Markdown/MDX sous le `contentPaths` de chaque bloc `docs[]` (même découverte que `translate-docs`, respecte `.translate-ignore`) : appariement des délimiteurs, code en ligne non fermé et `STRONG_OUTSIDE_LINK` lorsque `**`/`__` enveloppent un lien `[text](url)`.

Affiche les lignes `relativePath:line: [ISSUE_CODE] message` dans stderr ; code de sortie **1** en cas de problème. `--json` : rapport JSON sur stdout. Écrit `markdown_source_issues` dans `cacheDir` sauf si `--no-cache`. `-v` ajoute des hachages source aux lignes stderr.

**Options clés :** `-p` / `--path`, `-f` / `--file`, `--json`, `--no-cache`

**Voir aussi :** [Problèmes Markdown](/guide/translation-dashboard/markdown-issues)
