<a id="cli--workflows--status"></a>
# CLI — Workflows et statut

<a id="sync"></a>
### `sync`

**Synopsis :** `ai-i18n-tools sync [options]`

Extraction (si activée), puis traduction de l'interface utilisateur, puis `translate-svg` lorsque `features.translateSVG` et `config.svg` sont définis, puis traduction de la documentation, puis `translate-json` lorsque `features.translateJson` et `json[]` sont définis — sauf si ignoré avec `--no-ui`, `--no-svg`, `--no-docs` ou `--no-json`.

**Options clés :** `-l`, `-p` / `-f`, `--dry-run`, `-j`, `-b`, `--force`, `--force-update`, `--no-ui`, `--no-svg`, `--no-docs`, `--no-json`

`--force` est transmis aux étapes UI et SVG ainsi qu'aux documents/JSON ; `--force-update` s'applique aux documents, JSON et SVG (pas à l'UI). La phase des documents transmet également `--emphasis-placeholders` et `--debug-failed` (même signification que `translate-docs`). `--prompt-format` n'est pas un drapeau `sync` ; les étapes des documents et JSON utilisent la valeur par défaut intégrée (`json-array`).

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

**Voir aussi :** [Statistiques du tableau de bord](/guide/translation-dashboard/statistics)
