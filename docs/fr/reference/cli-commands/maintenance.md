<a id="cli--cache--maintenance"></a>
# CLI — Cache et maintenance

<a id="cleanup"></a>
### `cleanup`

**Synopsis :** `ai-i18n-tools cleanup [--dry-run] [--backup <path>]`

Efface toute la table `markdown_source_issues`, puis exécute `sync --force-update` (extraction, UI, SVG, documents et `translate-json` si activé) afin que les problèmes de markdown soient repeuplés pour les documents actuellement configurés ; puis supprime les lignes de segment obsolètes (`last_hit_at` nul / chemin de fichier vide) ; supprime les lignes `file_tracking` dont le chemin source résolu est manquant sur le disque ; supprime les lignes de traduction dont les métadonnées `filepath` pointent vers un fichier manquant ; élague les lignes `translation_failures` orphelines. Enregistre quatre décomptes d'élagage après la synchronisation (segments obsolètes, `file_tracking` orphelins, traductions orphelines, échecs orphelins) plus le décompte initial d'effacement des problèmes de markdown.

**Options clés :** `--dry-run`, `--backup`

`--backup <path>` écrit une sauvegarde SQLite à ce chemin avant les modifications (pas de sauvegarde à moins que cet indicateur ne soit défini).

---

<a id="clean-temp"></a>
### `clean-temp`

**Synopsis :** `ai-i18n-tools clean-temp [-r | --root <path>] [-f | --force] [--dry-run]`

Pas de configuration. Parcourt une arborescence de répertoires (par défaut : répertoire de travail actuel) pour `*.log`, `*.tmp` et `cache.db.backup*.sqlite`, affiche les chemins `./…` comme `find -print`. Avec des correspondances : invite `Delete these files? (y/n)` sauf si `-f` / `--force` (supprimer sans invite). Sans correspondances : quitte sans invite. `--dry-run` : liste seulement, pas d'invite ni de suppressions (outrepasse `--force`).

**Options clés :** `-r` / `--root`, `-f` / `--force`, `--dry-run`

---

<a id="purge-locale"></a>
### `purge-locale`

**Synopsis :** `ai-i18n-tools purge-locale -l <code> [-l <code> …] [options]`

Supprime toutes les lignes mises en cache pour les paramètres régionaux donnés de `translations`, `file_tracking` et `translation_failures`, ainsi que les artefacts générés pour ces paramètres régionaux : documents traduits (sorties `.md` / `.mdx` / `.astro` résolues à partir de `docs[]`, y compris les sorties orphelines dont la source a été supprimée — trouvées en balayant l'arborescence de sortie de chaque bloc, sauf lorsqu'un `pathTemplate` personnalisé est configuré), le fichier d'interface utilisateur plat par paramètres régionaux (`<flatOutputDir>/<locale>.json`), et les entrées des paramètres régionaux dans `strings.json`.

Les paramètres régionaux sont passés via `-l` / `--locale` répétables (normalisés en BCP-47). Affiche les décomptes par paramètres régionaux (lignes de cache, documents, entrées `strings.json`, fichier plat) ; avertit (ne génère pas d'erreur) pour les paramètres régionaux sans rien à purger. Demande confirmation sauf si `-y` / `--yes` / `-f` / `--force`. `--dry-run` : rapporte les décomptes et les fichiers qui seraient supprimés, ne supprime rien. `--keep-files` : purge uniquement le cache SQLite, laissant les fichiers générés et `strings.json` intacts. Aucune sauvegarde SQLite n'est effectuée à moins que `--backup <path>` ne soit passé, ce qui écrit une sauvegarde à ce chemin avant la suppression.

**Options clés :** `-l` / `--locale`, `--dry-run`, `-y` / `--yes`, `-f` / `--force`, `--keep-files`, `--backup`
