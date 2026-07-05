<a id="translation-dashboard"></a>
# Tableau de bord de traduction

Exécutez :

```bash
ai-i18n-tools dashboard
# Optional: choose port, do not auto-open browser
# ai-i18n-tools dashboard -p 8765 --no-open
```

Le port d'écoute par défaut est **8675**. Si ce port est indisponible, le serveur essaie le port suivant (jusqu'à 1000 tentatives) et enregistre dans les journaux le port choisi. L'alias obsolète `editor` fonctionne encore mais affiche un avertissement — privilégiez `dashboard`.

Cela démarre une interface web locale s'appuyant sur la base de données SQLite `cacheDir` configurée — le même dossier que celui utilisé par l'interface en ligne de commande pour les segments de documentation, les journaux et les métadonnées associées. Elle inclut les onglets **Documentation** (segments de documentation mis en cache), **Chaînes d'interface**, **Pluriels d'interface**, **Glossaire**, **Échecs**, **Problèmes Markdown** et **Statistiques**.

![Translation Dashboard](/translation-dashboard.png)

Si vous **modifiez des lignes du cache** dans cette application (par exemple des segments de documentation), exécutez `sync --force-update` ou la commande de traduction équivalente avec `--force-update` afin que les sorties sur disque correspondent au cache ; si le **texte source** dans le dépôt change ultérieurement, les hachages des segments changent et les modifications manuelles apportées à l'ancien texte sont remplacées.

<a id="failures-document-translation"></a>
### Échecs (traduction de documents)

L'onglet **Échecs** concerne uniquement la traduction de la **documentation**. Il lit les enregistrements d'échec écrits dans SQLite lorsqu'un segment n'a pas pu être traduit correctement pour une langue donnée — par exemple sortie du modèle vide ou invalide, erreurs de validation après traduction (`AST mismatch`, fuites de variables, et autres contrôles de **qualité**), ou une condition **fatale** ayant bloqué l'avancement. Cela vous aide à répondre à la question : *quel segment source a échoué, pour quelle langue et quel modèle, et quel message d'erreur a été enregistré ?*

<a id="when-to-use-it"></a>
#### Quand l'utiliser

- Après que `translate-docs` ou `sync` se termine avec des erreurs, des langues partielles ou des journaux peu clairs — vous pouvez trier et filtrer les échecs au lieu de simplement faire défiler la sortie du terminal.
- Lorsque vous souhaitez **prioriser la refonte** : triez par **# Échecs** afin que les segments ayant échoué plusieurs fois lors des tentatives répétées apparaissent en premier ; ce sont de bons candidats pour être **simplifiés ou reformattés** dans le markdown source afin que les exécutions futures réussissent.
- Lorsque vous avez besoin du **segment exact** — chemin du fichier, indication de ligne, hachage source et texte source complet — pour modifier le bon paragraphe dans votre dépôt.

<a id="why-source-edits-matter"></a>
#### Pourquoi les modifications du code source sont importantes

Un balisage intégré dense (**gras** mélangé à `` `code` ``, emphases imbriquées, phrases longues comportant de nombreux spans) rend plus difficile pour les modèles la production de traductions qui passent encore les contrôles structurels. Les segments ayant **plusieurs échecs enregistrés** s'améliorent généralement davantage par une **réécriture ou une division** du code source (ou en déplaçant les exemples dans des blocs de code délimités) plutôt que par une nouvelle exécution de la traduction sur un texte inchangé. Cela correspond à [Markdown complexe et échecs des contrôles de qualité](#complex-markdown-and-failed-quality-checks).

<a id="how-to-use-the-tab"></a>
#### Comment utiliser l'onglet

1. Ouvrez **Échecs** dans le tableau de bord (dans la même session navigateur que [Translation Dashboard](#translation-dashboard)).
2. Lisez la **barre de synthèse** (segments comportant un échec, ainsi que les comptages pour les segments avec **1**, **2** ou **3+** enregistrements d’échec).
3. Filtrez par **nom de fichier** partiel, **langue**, **modèle**, **erreur de qualité** (valeurs provenant de votre cache), **uniquement les erreurs fatales**, et éventuellement par **hachage source**, **texte source** ou **message d’erreur** (sous-chaîne) — puis cliquez sur **Appliquer**.
4. Choisissez **Trier : # Échecs** (par défaut) ou **Trier : chemin du fichier + numéro de ligne**.
5. Utilisez la pagination en haut ou en bas du tableau. **Cliquez sur une ligne** pour basculer l’affichage du texte source complet. Le contrôle de lien dans la ligne (quand activé) demande au serveur de journaliser des indices fichier/ligne dans le **terminal** où `ai-i18n-tools dashboard` est en cours d’exécution — utile pour passer du navigateur à votre éditeur.
6. Corrigez le **fichier source** dans votre projet, puis relancez `translate-docs` ou `sync`. Si la liste semble **obsolète** après une exécution réussie, lancez `ai-i18n-tools sync --force-update` et rechargez le tableau de bord (le panneau Échecs affiche le même indice).

Pour le débogage basé sur les fichiers en parallèle de l'interface utilisateur, vous pouvez toujours utiliser `translate-docs --debug-failed` pour écrire les détails `FAILED-TRANSLATION` sous `cacheDir` lors des nouvelles tentatives — voir [Comportement du cache et indicateurs `translate-docs`](#cache-behaviour-and-translate-docs-flags).

<a id="markdown-issues-static-checks"></a>
### Problèmes Markdown (vérifications statiques)

L'onglet **Problèmes Markdown** liste les lignes de la table SQLite `markdown_source_issues`. Chaque ligne correspond à une détection **pré-traduction** : par exemple des séries de délimiteurs qui ne s'apparient jamais comme emphase/barré selon les mêmes règles de type CommonMark que `translate-docs` utilise pour le masquage, une portion de code en ligne ouverte avec des accents graves mais jamais fermée, ou `STRONG_OUTSIDE_LINK` lorsque `**` / `__` encadrent un lien `[text](url)` (placez le gras uniquement à l'intérieur du texte du lien). Ce n'est **pas** la même chose que **Échecs**, qui enregistre les sorties par modèle par langue et les problèmes de validation post-traduction (`AST mismatch`, fuites de variables, et similaires).

Utilisez cet onglet lorsque vous souhaitez corriger le **markdown source** avant de consommer des jetons — en particulier lorsque les vérifications de qualité échouent systématiquement sur la structure. Filtrez par chemin de fichier (correspondance partielle avec la clé du cache, incluant les préfixes `doc-block:{index}:`), par **code d'incident** ou par **hachage source** ; triez par chemin de fichier + ligne ou par horodatage de scan le plus récent. Le bouton de lien enregistre les indices fichier/ligne dans le terminal où `ai-i18n-tools dashboard` est en cours d'exécution (même principe que l'onglet Documentation).

**Actualisation des lignes :** exécutez `ai-i18n-tools check-markdown` (portée facultative `-p` / `--path`, `--no-cache` pour ignorer SQLite, `--json` pour une sortie lisible par machine sur stdout avec des lignes lisibles par l’homme sur stderr). Par défaut, chaque fichier markdown `translate-docs` exécuté réanalyse et remplace également les lignes de ce fichier lorsque `docs[].warnMarkdownSourceIssues` n’est pas défini sur `false`. L’effacement de toutes les traductions pour un chemin de fichier de cache supprime les lignes de problème markdown pour ce chemin de fichier dans le cadre du même chemin de nettoyage que les échecs. `cleanup` élague en outre les lignes de problème markdown dont le chemin source résolu est manquant sur le disque, de sorte que les diagnostics pour les fichiers supprimés ou renommés (même ceux qui n’ont été analysés que par `check-markdown`, jamais traduits) ne persistent pas.
