<a id="statistics"></a>
# Statistiques

L'onglet **Statistiques** affiche des agrégats en lecture seule pour votre cache de documentation et votre catalogue de chaînes d'interface utilisateur. Les données correspondent à `ai-i18n-tools statistics` sur la ligne de commande.

Utilisez-le pour répondre à la question : *quelle est la quantité traduite, quels modèles ont été utilisés et où sont les lacunes ?*

<a id="documentation-cache"></a>
## Cache de documentation

**Cartes récapitulatives :**

| Carte | Signification |
| --- | --- |
| Total des segments | Toutes les lignes de segment de document mises en cache |
| Obsolètes / Actifs | Segments jamais réutilisés depuis leur création vs réutilisés au moins une fois |
| Fichiers suivis / Chemins de fichiers uniques | Nombre de fichiers dans le cache |
| Modèles utilisés | Modèles de traduction distincts |
| Entrées de glossaire | Nombre de lignes dans le CSV du glossaire utilisateur (lorsqu'il est configuré) |

**Tableaux :**

- **Segments par locale** — nombre par locale cible, avec répartition obsolète/active
- **Segments par modèle** — nombre par modèle
- **Matrice Modèle × locale** — tableau croisé complet (identique à la limite `--max-columns` de la CLI sur la sortie du terminal)

<a id="ui-strings"></a>
## Chaînes d'interface utilisateur

Affiché lorsque `strings.json` est disponible :

| Section | Signification |
| --- | --- |
| Nombres simples vs pluriels | Total des entrées non-plurielles et des groupes pluriels |
| Couverture simple par locale | Combien de chaînes simples ont une traduction par locale |
| Complétude plurielle par locale | Combien de groupes pluriels ont toutes les formes CLDR requises |
| Par modèle / modèle × locale | Même disposition matricielle que le cache de documentation |

<a id="no-editing-on-this-tab"></a>
## Pas de modification sur cet onglet

Les statistiques sont en lecture seule. Pour modifier les données, utilisez les autres onglets du tableau de bord ou réexécutez les commandes de traduction, puis rechargez le tableau de bord.

Pour la sortie scriptée, exécutez :

```bash
ai-i18n-tools statistics
# Optional: widen model × locale tables
# ai-i18n-tools statistics --max-columns 12
```
