<a id="markdown-issues-static-checks"></a>
# Problèmes de Markdown (vérifications statiques)

L'onglet **Problèmes de Markdown** liste les lignes de la table SQLite `markdown_source_issues`. Chaque ligne est une découverte de **pré-traduction** : par exemple, des séquences de délimiteurs qui ne s'apparient jamais comme emphase/barré selon les mêmes règles de style CommonMark que `translate-docs` utilise pour le masquage, une étendue de code en ligne ouverte avec des apostrophes inversées mais jamais fermée, ou `STRONG_OUTSIDE_LINK` lorsque `**` / `__` enveloppent un lien `[text](url)` (placez le gras uniquement à l'intérieur du texte du lien).

Ce n'est **pas** la même chose que les **Échecs**, qui enregistrent la sortie du modèle par locale et les problèmes de validation post-traduction (`AST mismatch`, fuites de placeholders, etc.).

<a id="when-to-use-it"></a>
## Quand l'utiliser

Utilisez cet onglet lorsque vous souhaitez corriger le **markdown source** avant de dépenser des jetons — en particulier lorsque les contrôles de qualité continuent d'échouer sur la structure dans l'onglet [Échecs](/guide/translation-dashboard/failures).

<a id="how-to-use-the-tab"></a>
## Comment utiliser l'onglet

1. Lisez la bande de **résumé** — nombre total de lignes de problèmes et de décomptes par code de problème.
2. Filtrez par chemin de fichier (correspondance partielle avec la clé de cache, y compris les préfixes `doc-block:{index}:`), **code de problème** ou **hachage source**.
3. Triez par **chemin de fichier + ligne** (par défaut) ou par **heure de scan la plus récente**.
4. Le bouton de lien 🔗 enregistre les indices de fichier/ligne dans le terminal où `ai-i18n-tools dashboard` est en cours d'exécution.

Corrigez le fichier source, puis relancez la traduction.

<a id="refreshing-rows"></a>
## Actualisation des lignes

| Commande / événement | Effet |
| --- | --- |
| `ai-i18n-tools check-markdown` | Rescanne les documents configurés ; portée optionnelle `-p` / `--path`, `--no-cache`, `--json` |
| `translate-docs` (par défaut) | Rescanne et remplace les lignes pour chaque fichier markdown lorsque `docs[].warnMarkdownSourceIssues` n'est pas `false` |
| Supprimer toutes les traductions pour un chemin de fichier | Supprime les lignes de problèmes markdown pour ce chemin de fichier (même nettoyage que les échecs) |
| `cleanup` | Efface toute la table `markdown_source_issues`, puis exécute `sync --force-update` pour repeupler les lignes |

<a id="common-issue-codes"></a>
## Codes de problème courants

| Code | Signification |
| --- | --- |
| Emphase / barré non apparié | Séquences de délimiteurs qui ne se ferment jamais selon les règles CommonMark |
| Code en ligne non fermé | Étendue d'apostrophes inversées ouverte mais non fermée |
| `STRONG_OUTSIDE_LINK` | Les marqueurs gras enveloppent un lien markdown — déplacez le gras à l'intérieur du texte du lien |

Voir aussi [Markdown complexe et échecs des contrôles de qualité](/guide/documents/#complex-markdown-and-failed-quality-checks).
