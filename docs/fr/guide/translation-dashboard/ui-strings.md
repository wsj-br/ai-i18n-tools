<a id="ui-strings--plurals"></a>
# Chaînes d'interface utilisateur et pluriels

Les onglets **Chaînes d'interface utilisateur** et **Pluriels d'interface utilisateur** modifient les lignes de votre catalogue `strings.json`. Les modifications du tableau de bord sont écrites directement dans ce fichier, et non dans le cache de documentation SQLite.

Utilisez ces onglets lorsqu'une étiquette d'interface utilisateur ou une forme plurielle nécessite une correction manuelle après `translate-ui` ou `sync`.

<a id="ui-strings-tab"></a>
## Onglet Chaînes d'interface utilisateur

Liste les entrées non plurielles de `strings.json` — une ligne par identifiant de chaîne et par locale.

<a id="filters"></a>
### Filtres

| Filtre | Objectif |
| --- | --- |
| **Id / hachage** | Id de chaîne ou hachage |
| **Nom de fichier (partiel)** / **Sélectionner le chemin du fichier** | Portée du fichier source |
| **La source contient** / **Le texte traduit contient** | Sous-chaîne de texte |
| **Locale** | Locale unique ou toutes |
| **Modèle** | Modèle ayant produit la traduction |

<a id="edit"></a>
### Modifier

1. Cliquez sur l'icône de modification sur une ligne.
2. Modifiez le texte traduit et enregistrez.

Le `models[locale]` de l'entrée est défini sur `user-edited`. Exécutez `sync` ou `translate-ui` pour actualiser les fichiers de locale plats (`de.json`, etc.). N'utilisez **pas** `--force` — il retraduit chaque entrée et peut écraser les corrections manuelles.

Lorsque `glossary.autoAddUserEditedToGlossary` est `true` (par défaut), le prochain `translate-ui` ou `sync` peut ajouter automatiquement votre modification au fichier CSV du glossaire utilisateur — voir [Configuration](/fr/reference/configuration#glossary).

<a id="delete"></a>
### Supprimer

- **Icône de suppression de ligne** — supprime un compartiment de locale d'une entrée.
- **Supprimer les éléments filtrés** — supprime en masse tous les compartiments de locale correspondant aux filtres actuels.

<a id="log-links"></a>
### Liens de journal

Le contrôle 🔗 imprime les emplacements fichier source:ligne du tableau `locations` de l'entrée dans le terminal.

<a id="ui-plurals-tab"></a>
## Onglet Pluriels d'interface utilisateur

Répertorie les entrées de groupe pluriel (`"plural": true` dans `strings.json`). Chaque ligne affiche les formes cardinales d'un paramètre régional (`one`, `other` et les formes spécifiques au paramètre régional).

<a id="filters-1"></a>
### Filtres

Identique à l'onglet Chaînes d'interface utilisateur, plus :

| Filtre | Objectif |
| --- | --- |
| **Complet / Incomplet** | Indique si toutes les formes CLDR requises sont présentes pour le paramètre régional sélectionné |

Il manque une ou plusieurs formes requises pour ce paramètre régional dans les lignes incomplètes.

<a id="edit-1"></a>
### Modifier

1. Cliquez sur l'icône de modification sur une ligne.
2. Modifiez chaque forme CLDR dans la modale (une zone de texte par forme).
3. Enregistrez — les chaînes de formulaire vides sont supprimées lors de l'enregistrement.

Le `models[locale]` de l'entrée est défini sur `user-edited`. Exécutez ensuite `sync` ou `translate-ui` (pas `--force`).

<a id="other-columns"></a>
### Autres colonnes

- **Formes** — affiche `one: "…"`, `other: "…"`, etc.
- **Badge `zeroDigit`** — indicateur en lecture seule lorsque la source utilise un modèle de pluriel à chiffre zéro.

Les formulaires requis proviennent des règles CLDR par paramètre régional (`requiredPluralFormsByLocale`).

<a id="delete-1"></a>
### Supprimer

Identique aux chaînes d'interface utilisateur : suppression par paramètre régional ou action groupée **Supprimer les éléments filtrés**.
