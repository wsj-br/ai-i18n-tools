<a id="cli--dashboard--glossary"></a>
# CLI — Tableau de bord et glossaire

<a id="dashboard"></a>
### `dashboard`

**Synopsis :** `ai-i18n-tools dashboard [-p <port>] [--no-open]`

Lancez le tableau de bord de traduction (interface Web locale pour les segments de cache, `strings.json`, glossaire, échecs, statistiques, utilisation et suggestions de modèles). Le port par défaut est **8675** (le port suivant est utilisé en cas d'indisponibilité). Avec `--no-open`, le navigateur par défaut ne s'ouvre pas automatiquement. `dash` est un alias équivalent. L'alias obsolète `editor` fonctionne toujours mais affiche un avertissement.

**Options clés :** `-p` / `--port`, `--no-open`

**Voir aussi :** [Tableau de bord de traduction](/fr/guide/translation-dashboard/)

---

<a id="glossary-generate"></a>
### `glossary-generate`

**Synopsis :** `ai-i18n-tools glossary-generate [-o <path>]`

Écrit un modèle `glossary-user.csv` vide. Refuse d'écraser un fichier existant (quitte avec le code **1**).

**Options clés :** `-o` / `--output`

`-o` : remplace le chemin de sortie (par défaut : `glossary.userGlossary` de la configuration, ou `glossary-user.csv`).

**Voir aussi :** [Glossaire](/fr/guide/glossary), [Glossaire du tableau de bord](/fr/guide/translation-dashboard/glossary)
