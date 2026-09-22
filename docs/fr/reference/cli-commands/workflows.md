<a id="cli--workflows--reporting"></a>
# CLI — Flux de travail et rapports

<a id="sync"></a>
### `sync`

**Synopsis :** `ai-i18n-tools sync [options]`

Extraction (si activée), puis traduction de l'interface utilisateur, puis `translate-svg` lorsque `features.translateSVG` et `config.svg` sont définis, puis traduction de la documentation, puis `translate-json` lorsque `features.translateJson` et `json[]` sont définis — sauf si ignoré avec `--no-ui`, `--no-svg`, `--no-docs` ou `--no-json`.

**Options clés :** `-l`, `-p` / `-f`, `--dry-run`, `-j`, `-b`, `--force`, `--force-update`, `--check-cache`, `--no-ui`, `--no-svg`, `--no-docs`, `--no-json`

`--force` est transmis aux étapes UI et SVG ainsi qu'à docs/JSON ; `--force-update` s'applique à docs, JSON et SVG (pas à l'interface utilisateur). `--check-cache` est transmis à docs, JSON et SVG : il revalide les segments mis en cache pour les paramètres régionaux avec un script natif appliqué, même lorsque le suivi des fichiers ignorerait. La phase docs transmet également `--emphasis-placeholders` (même signification que `translate-docs`). Le `--debug-failed` global écrit les journaux `FAILED-TRANSLATION` sous `cacheDir` pour chaque tentative de modèle ignorée (y compris les retours en arrière de script SVG/docs), pas seulement lorsque chaque modèle de la chaîne échoue. `--prompt-format` n'est pas un indicateur `sync` ; les étapes docs et JSON utilisent la valeur par défaut intégrée (`json-array`).

---

<a id="status"></a>
### `status`

**Synopsis :** `ai-i18n-tools status [--max-columns <n>]`

Lorsque `features.translateUIStrings` est activé, affiche la couverture de l'interface utilisateur par locale (`Translated` / `Missing` / `Total`). Ensuite, affiche l'état de la traduction Markdown par fichier × locale (pas de filtre `--locale` ; les locales proviennent de la configuration). Lorsque `features.translateJson` est activé et que `json[]` est configuré, affiche également l'état du bundle JSON par bloc. Les grandes listes de locales sont divisées en tableaux répétés de jusqu'à `n` colonnes de locales (par défaut **9**) afin que les lignes restent étroites dans le terminal.

**Options clés :** `--max-columns`

---

<a id="statistics"></a>
### `statistics`

**Synopsis :** `ai-i18n-tools statistics [--max-columns <n>]`

Affiche les statistiques du cache de documentation et de `strings.json` (mêmes agrégats que Tableau de bord de traduction → Statistiques). `--max-columns` : nombre maximal de colonnes de locales par tableau modèle × locale (par défaut **6**).

**Options clés :** `--max-columns`

**Voir aussi :** [Statistiques du tableau de bord](/fr/guide/translation-dashboard/statistics)

---

<a id="usage"></a>
### `usage`

**Synopsis :** `ai-i18n-tools usage [--since <when>] [--provider <name>] [--model <id>] [--operation <name>] [-l <code>] [--outcome accepted|discarded] [--clear] [--older-than <when>] [--dry-run]`

Affiche les statistiques d'appels d'API de modèle enregistrées (appels, jetons et un coût unique en USD). Le coût est le `usage.cost` du fournisseur lorsqu'il est présent, sinon le montant de `providers.<name>.modelPricing` ou la valeur par défaut `providers.<name>.pricing` à l'échelle du fournisseur (stockée lors de nouveaux appels ; appliquée au moment du rapport pour les lignes plus anciennes qui n'ont pas de coût stocké). Mêmes agrégats que Tableau de bord de traduction → Utilisation et coûts. Les lignes de détail de plus de sept jours calendaires UTC sont regroupées en `api_totals` mensuels ; les rapports combinent les deux tables. `--since` accepte `YYYY-MM-DD`, une durée (`30m`, `1h`, `6h`, `12h`, `24h`, `7d`, `30d`) ou une fenêtre de mois calendaire (`1mo`, `2mo`, `3mo`). `--clear` supprime les lignes de détail et les totaux mensuels (`--older-than` est `1mo`, `2mo`, `3mo`, `6mo`, `1y` ou `all` ; `--dry-run` signale le nombre sans supprimer).

**Options clés :** `--since`, `--provider`, `--model`, `--operation`, `-l` / `--locale`, `--outcome`, `--clear`, `--older-than`, `--dry-run`

**Voir aussi :** [Utilisation et coûts du tableau de bord](/fr/guide/translation-dashboard/usage)
