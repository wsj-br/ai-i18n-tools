<a id="cli-options"></a>
# Options de la CLI

Référence pour le comportement du cache `translate-docs`, les drapeaux, le format d'invite de lot et les clés de chemin SQLite internes.

<a id="cache-behaviour-and-translate-docs-flags"></a>
## Comportement du cache et drapeaux `translate-docs`

La CLI conserve le **suivi des fichiers** dans SQLite (hachage source par fichier × locale) et les lignes de **segment** (hachage × locale par bloc traduisible). Une exécution normale ignore entièrement un fichier lorsque le hachage suivi correspond à la source actuelle, que le fichier de sortie existe déjà **et** que l'heure de modification de la sortie est au moins aussi récente que celle de la source ; sinon, elle traite le fichier et utilise le cache de segments afin que le texte inchangé n'appelle pas l'API.

| Option                          | Effet                                                                                                                                                                                                                                                              |
|-------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| *(par défaut)*                   | Ignorer les fichiers inchangés lorsque le suivi et la sortie sur disque correspondent ; utiliser le cache de segments pour les autres.                                                                                                                                                                          |
| `-l, --locale <codes>`        | Locales cibles séparées par des virgules (lorsqu'elles sont omises, les valeurs par défaut correspondent à l'union de la racine `targetLocales` et du `docs[]` facultatif de chaque bloc `targetLocales`).                                                                                                       |
| `-p, --path` / `-f, --file`   | Ne traduit que le markdown/JSON situé sous ce chemin (relatif au projet, absolu ou motif glob) ; `--file` est un alias pour `--path`.                                                                                                                                 |
| `--dry-run`                   | Aucune écriture de fichier ni appel d'API.                                                                                                                                                                                                                                        |
| `--type <kind>`               | Limiter à `markdown` ou `json` (sinon les deux si activé dans la configuration).                                                                                                                                                                                               |
| `--json-only` / `--no-json`   | Traduire uniquement les fichiers de libellés JSON, ou ignorer JSON et traduire uniquement le markdown.                                                                                                                                                                                              |
| `-j, --concurrency <n>`       | Nombre maximal de langues cibles en parallèle (valeur par défaut issue de la configuration ou de la CLI).                                                                                                                                                                                              |
| `-b, --batch-concurrency <n>` | Nombre maximal d'appels API par lot par fichier (docs ; valeur par défaut issue de la configuration ou de la CLI).                                                                                                                                                                                               |
| `--emphasis-placeholders`     | Masquer les marqueurs d'emphase Markdown en tant qu'espaces réservés avant la traduction. Activé automatiquement pour les locales CJK et RTL, sauf si cela est remplacé par bloc via `docs[].emphasisPlaceholders` ou désactivé avec `--no-emphasis-placeholders`.                                                                                                                                                                          |
| `--debug-failed`              | Écrire des journaux détaillés `FAILED-TRANSLATION` dans `cacheDir` en cas d'échec de validation.                                                                                                                                                                                        |
| `--force-update`              | Traiter à nouveau chaque fichier correspondant (extraction, réassemblage, écriture des sorties) même si le suivi des fichiers aurait dû le sauter. **Le cache de segments s'applique toujours** — les segments inchangés ne sont pas envoyés au LLM.                                                                                    |
| `--force`                     | Efface le suivi des fichiers pour chaque fichier traité et **ne lit pas** le cache de segments pour la traduction API (retraduction complète). Les nouveaux résultats sont néanmoins **écrits** dans le cache de segments.                                                                                 |
| `--stats`                     | Affiche les nombres de segments, le nombre de fichiers suivis et les totaux de segments par langue, puis quitte.                                                                                                                                                                                    |
| `--clear-cache [locale]`      | Supprime les traductions mises en cache (et le suivi des fichiers) : toutes les langues, ou une seule langue, puis quitte.                                                                                                                                                                             |
| `--prompt-format <mode>`      | Comment chaque **lot** de segments est envoyé au modèle et analysé (`xml`, `json-array` ou `json-object`). Par défaut `json-array`. Ne modifie pas l'extraction, les espaces réservés, la validation, le cache ou le comportement de secours — voir [Format de l'invite par lot](#batch-prompt-format). |

Vous ne pouvez pas combiner `--force` avec `--force-update` (ils sont mutuellement exclusifs).

<a id="batch-prompt-format"></a>
## Format d'invite de lot

`translate-docs` envoie les segments traduisibles au fournisseur LLM actif par **lots** (groupés par `batchSize` / `maxBatchChars`). Le drapeau `--prompt-format` ne modifie que le **format filaire** de ce lot ; les jetons `PlaceholderHandler`, les vérifications AST Markdown, les clés de cache SQLite et le repli par segment en cas d'échec de l'analyse par lot restent inchangés.

| Mode                   | Message utilisateur                                                           | Réponse du modèle                                                 |
|------------------------|------------------------------------------------------------------------|-------------------------------------------------------------|
| `xml`                  | Pseudo-XML : un `<seg id="N">…</seg>` par segment (avec échappement XML). | Uniquement des blocs `<t id="N">…</t>`, un par index de segment.       |
| `json-array` (par défaut) | Un tableau JSON de chaînes, une entrée par segment, dans l'ordre.               | Un tableau JSON de la **même longueur** (même ordre).           |
| `json-object`          | Un objet JSON `{"0":"…","1":"…",…}` indexé par l'index du segment.            | Un objet JSON avec les **mêmes clés** et des valeurs traduites. |

L'en-tête d'exécution affiche également `Batch prompt format: …` afin que vous puissiez confirmer le mode actif. Les fichiers d'étiquettes JSON (`docusaurusCatalogDir`) et les lots de fichiers SVG utilisent le même paramètre lorsque ces étapes sont exécutées dans le cadre de `translate-docs` (ou de la phase de documentation de `sync` — `sync` n'expose pas ce drapeau ; il est par défaut à `json-array`).
