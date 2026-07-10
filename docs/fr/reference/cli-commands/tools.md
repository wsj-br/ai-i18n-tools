<a id="cli--tools"></a>
# CLI — Outils

<a id="dashboard"></a>
### `dashboard`

**Synopsis :** `ai-i18n-tools dashboard [-p <port>] [--no-open]`

Lance le tableau de bord de traduction (interface utilisateur web locale pour les segments de cache, `strings.json`, le glossaire, les échecs et les statistiques). Port par défaut **8675** (réessaie le port suivant s'il n'est pas disponible). Avec `--no-open`, le navigateur par défaut n'est pas ouvert automatiquement. L'alias déprécié `editor` fonctionne toujours mais affiche un avertissement.

**Options clés :** `-p` / `--port`, `--no-open`

**Voir aussi :** [Tableau de bord de traduction](/guide/translation-dashboard/)

---

<a id="glossary-generate"></a>
### `glossary-generate`

**Synopsis :** `ai-i18n-tools glossary-generate [-o <path>]`

Écrit un modèle `glossary-user.csv` vide. Refuse d'écraser un fichier existant (quitte avec le code **1**).

**Options clés :** `-o` / `--output`

`-o` : remplace le chemin de sortie (par défaut : `glossary.userGlossary` de la configuration, ou `glossary-user.csv`).

**Voir aussi :** [Glossaire du tableau de bord](/guide/translation-dashboard/glossary)

---

<a id="help"></a>
### `help`

**Synopsis :** `ai-i18n-tools help [command]`

Affiche l'aide pour une sous-commande (même sortie que `ai-i18n-tools <command> --help`).
