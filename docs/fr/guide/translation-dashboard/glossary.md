<a id="glossary"></a>
# Glossaire

L'onglet **Glossaire** modifie votre fichier CSV de glossaire utilisateur (`glossary.userGlossary` dans la configuration). Les entrées ici sont des suggestions terminologiques pour `translate-ui` et `proofread-ui` — elles ne sont **pas** utilisées par la traduction de la documentation.

L'onglet est masqué lorsque `glossary.userGlossary` n'est pas configuré.

<a id="csv-columns"></a>
## Colonnes CSV

| Colonne | Signification |
| --- | --- |
| **Chaîne de langue originale** | Terme ou expression source |
| **locale** | Locale cible, ou `*` pour toutes les locales |
| **Traduction** | Traduction préférée |
| **Forcer** | Lorsque cette option est cochée, le terme doit être traduit exactement tel qu'il est donné |

<a id="add-a-row"></a>
## Ajouter une ligne

Utilisez le formulaire en haut de l'onglet :

1. Saisissez **Original**, **locale** (`*` ou un code de locale cible) et **Traduction**.
2. Cochez éventuellement **Forcer**.
3. Cliquez sur **Ajouter**.

Le fichier CSV est créé lors du premier ajout s'il n'existe pas encore.

<a id="edit-or-delete"></a>
## Modifier ou supprimer

- **Modification en ligne** — modifiez les champs directement dans le tableau et cliquez sur **Enregistrer** sur cette ligne.
- **Supprimer** — supprimez une ligne avec le contrôle de suppression.

Les modifications prennent effet à la prochaine étape de l'interface utilisateur `translate-ui`, `proofread-ui` ou `sync`.

<a id="filters"></a>
## Filtres

Filtrez par **texte original**, **locale** (y compris `*`) ou sous-chaîne de **texte de traduction**, puis cliquez sur **Appliquer**.

<a id="dashboard-edits-and-glossary-auto-add"></a>
## Modifications du tableau de bord et ajout automatique au glossaire

Lorsque vous corrigez une chaîne d'interface utilisateur dans l'onglet **Chaînes d'interface utilisateur** ou **Pluriels d'interface utilisateur**, la prochaine exécution de `translate-ui` peut ajouter automatiquement cette correction au glossaire si `glossary.autoAddUserEditedToGlossary` est `true`. Utilisez l'onglet Glossaire pour examiner, ajuster ou supprimer ces lignes ajoutées automatiquement.
