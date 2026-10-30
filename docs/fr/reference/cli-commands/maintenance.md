<a id="cli--cache-maintenance"></a>
# CLI — Maintenance du cache

<a id="cleanup"></a>
### `cleanup`

**Synopsis :** `ai-i18n-tools cleanup [--dry-run] [--backup <path>]`

Vide l'intégralité de la table `markdown_source_issues`, puis exécute `sync --force-update` (extraction, UI, SVG, documentation et `translate-json` si activé) afin que les problèmes Markdown soient repeuplés pour les documents actuellement configurés. Il effectue ensuite les opérations suivantes :

- supprime les lignes de segment obsolètes (`last_hit_at` nul / chemin de fichier vide) ;
- supprime les lignes `file_tracking` dont le chemin source résolu est manquant sur le disque ;
- supprime les lignes de traduction dont les métadonnées `filepath` pointent vers un fichier manquant ;
- élague les lignes `translation_failures` orphelines ;
- supprime les lignes de cache pour les locales absentes de la configuration (`sourceLocale`, `targetLocales` racine et tout `docs[]` / `json[]` `targetLocales` par bloc).

Cache uniquement pour les locales retirées — les documents générés, les fichiers d'interface utilisateur plats et les entrées `strings.json` sont laissés intacts (utilisez [`purge-locale`](#purge-locale) pour les supprimer). Enregistre les nombres d'élagage après la synchronisation (segments obsolètes, `file_tracking` orphelins, traductions orphelines, échecs orphelins, locales non configurées) plus le nombre initial de suppressions de problèmes Markdown.

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

Supprime toutes les lignes mises en cache pour la ou les locales données de `translations`, `file_tracking` et `translation_failures`, ainsi que les artefacts générés pour cette locale : documents traduits (sorties `.md` / `.mdx` / `.astro` résolues à partir de la `docs[]`, y compris les sorties orphelines dont la source a été supprimée — trouvées en balayant l'arborescence de sortie de chaque bloc, sauf lorsqu'un `pathTemplate` personnalisé est configuré), le fichier d'interface utilisateur plat par locale (`<flatOutputDir>/<locale>.json`), et les entrées de la locale dans `strings.json`.

Les locales sont passées via les options répétables `-l` / `--locale` (normalisées en BCP-47). Affiche les nombres par locale (lignes de cache, documents, entrées `strings.json`, fichier plat) ; avertit (ne génère pas d'erreur) pour les locales n'ayant rien à purger. Demande confirmation sauf si `-y` / `--yes` / `-f` / `--force`. `--dry-run` : affiche les nombres et les fichiers qui seraient supprimés, ne supprime rien. `--keep-files` : purge uniquement le cache SQLite, laissant les fichiers générés et `strings.json` intacts. Aucune sauvegarde SQLite n'est effectuée sauf si `--backup <path>` est passé, ce qui écrit une sauvegarde à ce chemin avant la suppression.

**Options clés :** `-l` / `--locale`, `--dry-run`, `-y` / `--yes`, `-f` / `--force`, `--keep-files`, `--backup`
