<a id="cli--documents"></a>
# CLI — Documents

<a id="translate-docs"></a>
### `translate-docs`

**Synopsis :** `ai-i18n-tools translate-docs [options]`

Traduit le Markdown, le MDX, `.astro`, le JSON de catalogue Docusaurus facultatif (`docusaurusCatalogDir`), le `_meta.ts`/dictionnaire Nextra facultatif (`.ts`) et le catalogue de thèmes VitePress facultatif pour chaque bloc `docs`.

**Options clés :** `-l`, `-j`, `-b`, `--prompt-format`, `--force`, `--force-update`, `--check-cache`, `-p` / `-f`, `--dry-run`

`-j` : nombre maximal de locales parallèles ; `-b` : nombre maximal d'appels d'API par lot parallèles par fichier. `--prompt-format` : format de transmission par lot (`xml` | `json-array` | `json-object`).

**Voir aussi :** [Comportement du cache et indicateurs `translate-docs`](/fr/guide/documents/cli-options#cache-behaviour-and-translate-docs-flags), [Format d'invite par lot](/fr/guide/documents/cli-options#batch-prompt-format)

---

<a id="write-heading-ids"></a>
### `write-heading-ids`

**Synopsis :** `ai-i18n-tools write-heading-ids [options]`

Nécessite au moins un bloc `docs[]`. Collecte `.md` / `.mdx` sous le `contentPaths` de chaque bloc (respecte `.translate-ignore`). Par défaut, insère une ligne d'ancrage HTML `<a id="slug"></a>` immédiatement avant chaque titre ATX plat `#` (ignore les titres à l'intérieur des blocs de code clôturés). Les ID de titre existants de toute forme (ligne d'ancrage HTML, suffixe `{#id}` classique, commentaire MDX `{/* #id */}`) sont remplacés par le style sélectionné ; le slug est toujours dérivé du texte du titre actuel. Avec `--slug-style mdx-comment`, écrit un suffixe de commentaire MDX Docusaurus sur la ligne du titre à la place (même algorithme de slug de style GitHub) et supprime une ancre HTML précédente si elle est présente. `--remove` supprime toutes ces formes d'ID de titre et n'écrit rien à leur place.

Après la mise à jour des fichiers source, la commande parcourt également le markdown traduit existant de chaque locale (même mappage de chemin `docsOutput` que `translate-docs`). Elle copie les identifiants d'en-tête **anglais** sur les en-têtes ATX correspondants dans l'ordre du document — elle ne transforme jamais le titre traduit en slug — et déplace un `{#id}` / `{/* #id */}` (ou un `<a id>` HTML égaré) au milieu de l'en-tête vers la forme attendue par Docusaurus / le style choisi. Les fichiers traduits manquants sont ignorés. `--remove` supprime également les identifiants d'en-tête de ces fichiers traduits, y compris les jetons mal placés en milieu de ligne.

Lorsque les identifiants des titres d'un fichier traduit sont repositionnés ou corrigés, le segment traduit en cache correspondant (indexé par le hachage de la source en anglais) est également mis à jour, si la source en anglais ainsi que l'ancien et le nouveau contenu traduit comportent le même nombre de segments. En cas de divergence de comptage, ce fichier et cette locale sont ignorés. Un `sync --force-update` ultérieur réassemble ensuite le fichier à partir de la ligne de cache mise à jour.

**Options clés :** `-p` / `--path`, `-f` / `--file`, `--slug-style`, `--remove`, `--dry-run`

`--slug-style` : `github` (par défaut ; doctoc / anchor-markdown-header), `bitbucket`, `gitlab`, `pymdown`, `azure-devops`, `mdx-comment` (suffixe Docusaurus `{/* #… */}`). Avec `pymdown`, `--pymdown-case` facultatif, `--pymdown-normalize`, `--pymdown-percent-encode` / `--no-pymdown-percent-encode`. `--remove` ne peut pas être combiné avec `--pymdown-*`.

**Voir aussi :** [Liens d'ancrage](/fr/guide/documents/anchor-links)

---

<a id="check-markdown"></a>
### `check-markdown`

**Synopsis :** `ai-i18n-tools check-markdown [options]`

Analyse le Markdown/MDX sous le `contentPaths` de chaque bloc `docs[]` (même découverte que `translate-docs`, respecte `.translate-ignore`) : appariement des délimiteurs, code en ligne non fermé et `STRONG_OUTSIDE_LINK` lorsque `**`/`__` enveloppent un lien `[text](url)`.

Affiche les lignes `relativePath:line: [ISSUE_CODE] message` dans stderr ; code de sortie **1** en cas de problème. `--json` : rapport JSON sur stdout. Écrit `markdown_source_issues` dans `cacheDir` sauf si `--no-cache`. `-v` ajoute des hachages source aux lignes stderr.

**Options clés :** `-p` / `--path`, `-f` / `--file`, `--json`, `--no-cache`

**Voir aussi :** [Problèmes Markdown](/fr/guide/translation-dashboard/markdown-issues)
