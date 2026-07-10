<a id="failures-document-translation"></a>
# Échecs (traduction de documentation)

L'onglet **Échecs** est réservé à la traduction de la **documentation** uniquement. Il lit les enregistrements d'échec écrits dans SQLite lorsque qu'un segment ne peut pas être traduit avec succès pour une locale — par exemple, une sortie de modèle vide ou invalide, des erreurs de validation post-traduction (`AST mismatch`, fuites de placeholders, et des vérifications de **qualité** similaires), ou une condition **fatale** qui a bloqué la progression.

Il vous aide à répondre à : *quel segment source a échoué, pour quelle locale et quel modèle, et quel texte d'erreur a été enregistré ?*

<a id="when-to-use-it"></a>
## Quand l'utiliser

- Après que `translate-docs` ou `sync` se termine avec des erreurs, des locales partielles ou des journaux confus — trier et filtrer les échecs au lieu de faire défiler la sortie du terminal seul.
- Lorsque vous voulez **prioriser les révisions** : trier par **# Échecs** afin que les segments qui ont échoué à plusieurs reprises à travers les réessais apparaissent en premier ; ceux-ci sont des candidats forts pour **simplifier ou reformatter** le markdown source.
- Lorsque vous avez besoin du **segment exact** — chemin de fichier, indice de ligne, hachage source et texte source complet — pour éditer le paragraphe correct dans votre référentiel.

<a id="why-source-edits-matter"></a>
## Pourquoi les éditions de source sont importantes

La mise en page dense avec des balises intégrées (**bold** mélangé avec `` `code` ``, emphase imbriquée, longues phrases avec de nombreuses étendues) rend plus difficile pour les modèles de retourner des traductions qui passent toujours les vérifications structurelles. Les segments avec **plusieurs échecs enregistrés** s'améliorent généralement plus en **réécrivant ou en divisant** la source (ou en déplaçant les exemples dans des blocs de code avec clôture) que en réexécutant la traduction sur du texte inchangé. Cela correspond à [Markdown complexe et vérifications de qualité échouées](/fr/guide/documents/#complex-markdown-and-failed-quality-checks).

<a id="how-to-use-the-tab"></a>
## Comment utiliser l'onglet

1. Ouvrez **Échecs** dans le tableau de bord.
2. Lisez la **synthèse** — segments avec tout échec, plus des comptes pour les segments avec **1**, **2**, ou **3+** enregistrements d'échec.
3. Filtrez par nom de **fichier partiel**, **locale**, **modèle**, **erreur de qualité** (valeurs provenant de votre cache), **fatale uniquement**, et **hachage source**, **texte source**, ou **message d'erreur** facultatif — puis cliquez **Appliquer**.
4. Choisissez **Trier : # Échecs** (par défaut) ou **Trier : chemin de fichier + numéro de ligne**.
5. Utilisez la pagination en haut ou en bas du tableau. **Cliquez sur une ligne** pour développer le texte source complet. La colonne **Modèle** affiche le modèle d'échec et, lorsqu'il est disponible, le modèle d'une entrée de cache réussie ultérieure.
6. Le contrôle de lien 🔗 enregistre les indices de fichier/ligne dans le **terminal** où `ai-i18n-tools dashboard` s'exécute.
7. Corrigez le **fichier source** dans votre projet, puis exécutez `translate-docs` ou `sync` à nouveau. Si la liste semble **obsolète** après une exécution réussie, exécutez `ai-i18n-tools sync --force-update` et rechargez le tableau de bord.

Pour le débogage basé sur les fichiers en plus de l'interface utilisateur, utilisez `translate-docs --debug-failed` pour écrire `FAILED-TRANSLATION` détail sous `cacheDir` pendant les réessais — voir [Comportement du cache et drapeaux `translate-docs`](/fr/guide/documents/cli-options#cache-behaviour-and-translate-docs-flags).

<a id="failures-vs-markdown-issues"></a>
## Échecs vs Problèmes de Markdown

| | **Échecs** | **Problèmes de Markdown** |
| --- | --- | --- |
| Quand enregistré | Pendant la traduction (par locale) | Avant la traduction (analyse de source) |
| Cause typique | Mauvaise sortie de modèle, erreurs de validation | Émphasis non apparié, étendues de code non fermées, gras en dehors des liens |
| Correction | Éditez la source et rétraduisez | Corrigez la mise en page Markdown source, puis rétraduisez |

Voir [Problèmes de Markdown](/fr/guide/translation-dashboard/markdown-issues) pour les vérifications statiques pré-traduction.
