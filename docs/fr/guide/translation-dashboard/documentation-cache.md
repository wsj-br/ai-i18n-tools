<a id="documentation-cache"></a>
# Cache de documentation

L'onglet **Documentation** répertorie les traductions de segments de documentation mises en cache et stockées dans SQLite sous votre `cacheDir` configuré. Chaque ligne représente un segment source (identifié par le chemin du fichier, l'indice de ligne et le hachage source) traduit dans un paramètre régional cible.

Utilisez cet onglet lorsque vous souhaitez **examiner, remplacer ou nettoyer** les traductions de documents mises en cache sans réexécuter le pipeline complet.

<a id="filters"></a>
## Filtres

| Filtre | Objectif |
| --- | --- |
| **Sélectionner le chemin du fichier** / **Nom du fichier (partiel)** | Réduire à un seul fichier ou à une sous-chaîne de chemin |
| **Tous les paramètres régionaux** | Paramètres régionaux cibles |
| **Tous les modèles** | Modèle ayant produit la traduction |
| **Hachage source** | Hachage de segment exact |
| **Recherche de texte source** / **Recherche de texte traduit** | Correspondance de sous-chaîne |
| **Toutes les entrées** | **Obsolètes** (jamais réutilisées depuis la création) ou **Actives** (ont un horodatage `last_hit_at`) |

Cliquez sur **Appliquer** après avoir modifié les filtres. **Effacer** réinitialise tous les champs de filtre.

<a id="edit-a-translation"></a>
## Modifier une traduction

1. Cliquez sur l'icône de modification sur une ligne.
2. Modifiez le texte traduit dans la fenêtre modale et enregistrez.

Le cache stocke le `user-edited` du modèle pour cette ligne. Exécutez `sync --force-update` ou `translate-docs --force-update` pour que les sorties Markdown sur disque correspondent au cache.

Si le **texte source** de votre référentiel change ultérieurement, le hachage du segment change et les modifications manuelles de l'ancien texte sont remplacées lors de la prochaine exécution de la traduction.

<a id="delete-rows"></a>
## Supprimer des lignes

- **Icône de suppression de ligne** — supprime une entrée de cache (un paramètre régional pour un hachage source).
- **Supprimer les éléments filtrés** — supprime toutes les lignes correspondant aux filtres actuels (confirmation requise).
- **Supprimer tout pour le chemin du fichier** — supprime toutes les traductions mises en cache pour le chemin du fichier sélectionné, y compris les lignes d'échec et de problème Markdown associées pour ce fichier.

Après des suppressions en masse, exécutez `translate-docs` ou `sync` pour régénérer les traductions manquantes.

<a id="table-columns"></a>
## Colonnes du tableau

| Colonne | Signification |
| --- | --- |
| **Chemin du fichier** | Clé de cache pour le fichier source |
| **Ligne n°** | Indication de ligne dans le fichier source |
| **Hachage source** | Hachage du texte du segment source |
| **Texte source** | Segment original (locale source) |
| **Locale** | Locale cible |
| **Texte traduit** | Traduction mise en cache |
| **Modèle** | Modèle ayant produit la traduction (ou `user-edited`) |
| **Créé** | Date de la première écriture de la ligne |
| **Dernier accès** | Dernière réutilisation de cette entrée de cache (tiret rouge = obsolète) |

La pagination est définie par défaut sur 50 lignes par page (25 ou 100 sont également disponibles).

<a id="log-links"></a>
## Liens de journal

Le contrôle 🔗 dans une ligne demande au serveur d'imprimer des indications de fichier:ligne dans le terminal où le tableau de bord est en cours d'exécution. Utilisez-le pour ouvrir l'emplacement source correct dans votre éditeur.
