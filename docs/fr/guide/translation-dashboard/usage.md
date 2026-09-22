<a id="usage--costs"></a>
# Utilisation et coûts

L'onglet **Utilisation et coûts** résume les appels d'API de modèle facturés effectués par ce projet — y compris les tentatives ultérieurement abandonnées — avec le nombre de jetons et un coût unique en USD.

Les mêmes agrégats sont disponibles en ligne de commande sous la forme `ai-i18n-tools usage`.

Utilisez-le pour répondre à la question : *combien d'appels avons-nous effectués, quels modèles et opérations ont consommé des jetons, et combien cela a-t-il coûté ?*

<a id="what-is-recorded"></a>
## Ce qui est enregistré

Chaque ligne de détail correspond à une complétion HTTP qui a renvoyé une utilisation (même si la traduction a été ultérieurement rejetée pour des raisons d'analyse/script/qualité et que le modèle de secours suivant a été essayé). Les échecs de transport qui n'ont jamais produit de corps facturé ne sont pas enregistrés.

Une fois qu'une commande ayant appelé l'API se termine, les lignes antérieures à **sept jours calendaires complets en UTC** (à partir de 00:00 UTC aujourd'hui moins 7 jours) sont intégrées aux totaux mensuels (`api_totals`) et supprimées du journal détaillé. La dernière semaine reste sous forme de lignes `api_calls` individuelles. Les tableaux de synthèse combinent les deux sources pour la période sélectionnée.

<a id="cost-reporting"></a>
## Rapports de coûts

Chaque appel, carte récapitulative et tableau affiche **un** coût en USD :

1. Le `usage.cost` du fournisseur lorsque la réponse l'incluait (OpenRouter aujourd'hui).
2. Sinon, le montant provenant de `providers.<name>.modelPricing` ou de la valeur par défaut `pricing` à l'échelle du fournisseur, appliqué aux jetons d'entrée et de sortie de cet appel.

Les nouveaux appels stockent ce montant sur la ligne `api_calls`. Les lignes plus anciennes qui ont été stockées sans coût sont tarifées de la même manière lorsque le rapport est ouvert, puis ajoutées au même chiffre de coût — elles ne sont pas affichées comme une deuxième colonne. Si aucune des deux sources ne s'applique, la cellule est `—`, jamais `$0.00`. La modification ultérieure des tarifs configurés ne réécrit pas les lignes qui ont déjà un coût stocké. Les récapitulatifs mensuels conservent toujours un compte des appels qui ont stocké un coût (`ncost_acc` / `ncost_dis`) afin que `$0.00` reste distinct de « inconnu » après la compaction.

<a id="filters"></a>
## Filtres

Filtrer par fenêtre de temps, fournisseur, modèle, opération (`translate-docs`, `translate-ui`, `translate-json`, `translate-svg`, `proofread-ui`, `bench-models`), locale et résultat (accepté vs ignoré).

Fenêtres de temps :

- Les plages courtes (`Last 30 minutes` à `Last 30 days`) utilisent des durées glissantes. **Utilisation au fil du temps** affiche une ligne par jour calendaire UTC qui a encore des détails dans cette plage.
- `Last 2 months` / `Last 3 months` commencent à 00:00 UTC le premier jour du mois calendaire en cours moins 1 / 2 mois. **Utilisation au fil du temps** affiche les lignes quotidiennes conservées plus une ligne par mois.
- `All time` inclut chaque total mensuel et les lignes quotidiennes conservées.

Pour supprimer les anciennes utilisations, choisissez une période sous **Supprimer les entrées antérieures à** (`> 1 month`, `> 2 months`, `> 3 months`, `> 6 months`, `> 1 year` ou `all data (clear)`), puis cliquez sur **Supprimer les données**. Le menu commence à `-`, ce qui laisse **Supprimer les données** désactivé jusqu'à ce qu'une période soit choisie. Les mêmes périodes sont disponibles sous forme de `ai-i18n-tools usage --clear [--older-than 1mo|2mo|3mo|6mo|1y|all]`. Les dates de coupure calendaires conservent le mois en cours (`1mo`) ou le mois en cours plus les mois précédents.

<a id="command-line"></a>
## Ligne de commande

```bash
ai-i18n-tools usage
# ai-i18n-tools usage --since 7d --operation translate-docs
# ai-i18n-tools usage --since 2mo
# ai-i18n-tools usage --clear --older-than 3mo --dry-run
```
