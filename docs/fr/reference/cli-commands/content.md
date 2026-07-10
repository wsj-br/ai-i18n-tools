<a id="cli--other-content"></a>
# CLI — Autre contenu

<a id="translate-json"></a>
### `translate-json`

**Synopsis :** `ai-i18n-tools translate-json [options]`

Traduire les JSON imbriqués par `json[]` (requiert `features.translateJson`). Cache SQLite partagé.

**Options clés :** `-l`, `-p` / `--path`, `--dry-run`, `--force`, `--force-update`, `-b`, `--prompt-format`

**Voir également :** [JSON](/guide/json)

---

<a id="translate-svg"></a>
### `translate-svg`

**Synopsis :** `ai-i18n-tools translate-svg [options]`

Traduire les fichiers SVG configurés dans `config.svg` (séparés des docs). Nécessite `features.translateSVG`. Mêmes idées de cache que les docs ; prend en charge `--no-cache` pour ignorer les lectures/écritures SQLite pour cette exécution.

**Options clés :** `-j`, `-b`, `--force`, `--force-update`, `-p` / `--path`, `--dry-run`, `--no-cache`

**Voir également :** [Traduction SVG](/guide/svg-translation/)
