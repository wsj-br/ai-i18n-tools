<a id="models"></a>
# Modèles

L'onglet **Modèles** classe les modèles de chat du fournisseur actif afin que vous puissiez choisir `translationModels` sans copier manuellement les identifiants. Il utilise le même classement que [`suggest-models`](/fr/reference/cli-commands/models#suggest-models).

Choisissez **Qualité** ou **Prix**. La qualité privilégie le score ChrF de languagebench et l'Arena Score. Le prix privilégie un tarif en USD plus bas tout en conservant un seuil de qualité. Lorsque la configuration comporte plusieurs fournisseurs, un menu **Fournisseur** apparaît ; la valeur par défaut est le fournisseur avec lequel le tableau de bord a été démarré (`provider`, ou `-P` / `--provider` lors de la commande `dashboard`). Changer de fournisseur ou de priorité recharge le tableau. Les pondérations optionnelles se trouvent dans [`modelSuggestion`](/fr/reference/configuration#modelsuggestion).

Les colonnes du tableau sont le rang, l'identifiant du modèle, l'index (le score pondéré multiplié par 100), le ChrF mesuré, l'Arena Score mesuré, et le prix d'entrée/sortie en USD pour 1 million de jetons. Une mesure manquante est indiquée par un tiret cadratin. Le numéro de rang correspond à la place du modèle dans le classement complet, avant l'application des filtres ci-dessous.

**Prix de sortie max** conserve les modèles dont le prix de sortie par million de jetons est au maximum égal à ce montant en USD. Un modèle sans prix de sortie est exclu. **Delta d'index min** ne conserve un modèle que si son index est inférieur d'au moins ce nombre de points au modèle conservé précédent. Le premier modèle restant est toujours conservé. Laissez l'une ou l'autre case vide pour ignorer ce filtre. La modification de l'une ou l'autre valeur recharge le tableau.

Cochez les modèles souhaités. **Utiliser les N premiers** (5 par défaut) sélectionne les N premières lignes de la liste filtrée et réinitialise leur ordre. Déplacez un identifiant sélectionné vers le haut ou le bas pour définir l'ordre de secours. **Mettre à jour la config** écrit cet ordre dans `providers.<selected>.translationModels` et laisse `uiModels` et `localeModels` inchangés. **Copier JSON** place le même fragment `{ "translationModels": [...] }` dans le presse-papiers.

Le premier chargement télécharge languagebench, Arena et models.dev lorsque le cache est vide, ce qui peut prendre un certain temps. Les chargements ultérieurs réutilisent le cache de 7 jours situé à `<cacheDir>/benchmark-scores.json`. L'onglet ne possède pas de bouton d'actualisation. Actualisez le cache depuis l'interface en ligne de commande avec `ai-i18n-tools suggest-models --refresh`, puis rechargez l'onglet. La même commande peut afficher ou appliquer la liste.

Le pied de page attribue languagebench (CC BY-SA 4.0), l'Arena Score de LMArena (CC BY 4.0) et models.dev (MIT).
