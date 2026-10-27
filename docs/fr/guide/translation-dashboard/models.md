<a id="models"></a>
# Modèles

L'onglet **Modèles** classe les modèles de chat du fournisseur actif afin que vous puissiez choisir `translationModels` sans copier manuellement leurs ID. Il utilise le même classement que [`suggest-models`](/fr/reference/cli-commands/models#suggest-models). La présentation détaillée, qui explique notamment pourquoi la liste contient plusieurs modèles, se trouve dans [Modèles d'IA](/fr/guide/ai-models).

Choisissez **Qualité** ou **Prix**. La qualité privilégie le score ChrF de languagebench et l'Arena Score. Le prix privilégie un tarif en USD plus bas tout en conservant un seuil de qualité. Lorsque la configuration comporte plusieurs fournisseurs, un menu **Fournisseur** apparaît ; la valeur par défaut est le fournisseur avec lequel le tableau de bord a été démarré (`provider`, ou `-P` / `--provider` lors de la commande `dashboard`). Changer de fournisseur ou de priorité recharge le tableau. Les pondérations optionnelles se trouvent dans [`modelSuggestion`](/fr/reference/configuration#modelsuggestion).

Les colonnes du tableau sont des commandes de réorganisation, une case à cocher, le rang, l'ID du modèle, l'index (le score pondéré multiplié par 100), le ChrF mesuré, le Score Arena mesuré, et le prix d'entrée/sortie en USD par million de jetons. Une mesure manquante est un tiret cadratin. Le numéro de rang est la place du modèle dans le classement complet, avant les filtres ci-dessous. Faites glisser la poignée d'une ligne, ou utilisez ses boutons haut et bas, pour modifier sa place dans ce tableau. **Mettre à jour** charge à nouveau l'ordre de classement.

Les contrôles sont répartis en trois cartes. **Classement** contient le menu de priorité (et le menu du fournisseur lorsque la configuration contient plus d'un fournisseur). **Filtres** contient **Prix de sortie max.**, **Delta d'index min.** et **Mettre à jour**. **Actions** contient **Copier le JSON** et **Mettre à jour la configuration**. Appuyez sur Entrée dans un champ numérique pour actualiser le tableau. Changer de menu fait de même.

**Prix de sortie max** conserve les modèles dont le prix de sortie par million de jetons est au maximum de ce nombre d'USD. Un modèle sans prix de sortie est exclu. **Delta d'index min** conserve un modèle seulement si son index est au moins de ce nombre de points inférieur au modèle précédemment conservé. Le premier modèle restant est toujours conservé. Laissez l'une ou l'autre case vide pour ignorer ce filtre.

Cochez les modèles que vous souhaitez. La ligne d'état indique combien sont sélectionnés, par exemple `8 models selected.`. Le nombre affiché dans l'en-tête de colonne de la case à cocher (par défaut 8) indique combien de premières lignes cette case à cocher sélectionne. La cocher sélectionne ces lignes. La décocher décoche toutes les cases à cocher. Les lignes cochées, de haut en bas, constituent l'ordre de repli. **Mettre à jour la configuration** demande confirmation, copie la configuration actuelle vers `ai-i18n-tools.config.{timestamp}.backup.json` à côté, puis écrit cet ordre dans `providers.<selected>.translationModels`. `uiModels` et `localeModels` restent inchangés. **Copier le JSON** place le même fragment `{ "translationModels": [...] }` dans le presse-papiers. `suggest-models --apply` écrit le même type de sauvegarde.

Le premier chargement télécharge languagebench, Arena et models.dev lorsque le cache est vide, ce qui peut prendre un certain temps. Les chargements ultérieurs réutilisent le cache de 7 jours situé à `<cacheDir>/benchmark-scores.json`. L'onglet ne possède pas de bouton d'actualisation. Actualisez le cache depuis l'interface en ligne de commande avec `ai-i18n-tools suggest-models --refresh`, puis rechargez l'onglet. La même commande peut afficher ou appliquer la liste.

::: info Sources de référence externes
  Les scores sont calculés à partir de sources de données externes :
  - [languagebench ChrF](https://languagebench.github.io/) sous licence CC-BY-SA-4.0,
  - [LMArena Arena Score](https://github.com/lm-arena/lm-arena) sous licence CC-BY-4.0, et
  - [models.dev](https://models.dev/) prix sous licence MIT.
:::
