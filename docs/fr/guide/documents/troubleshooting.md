<a id="troubleshooting"></a>
# Dépannage

<a id="section-anchor-links-do-not-work-in-translated-docs"></a>
## Les liens d'ancrage de section ne fonctionnent pas dans les documents traduits

Un lien comme `[label](other.md#section-id)` peut ouvrir le bon fichier traduit mais échouer à faire défiler jusqu’au titre visé — ou sauter vers une section incorrecte. Le fragment `#…` ne correspond plus à aucun attribut `id` de titre dans cette langue.

Causes fréquentes :

- Les titres sources n’avaient jamais d’identifiants d’ancre explicites ; le site dérive les slugs à partir du texte visible des titres, qui change après traduction.
- Vous avez renommé un titre dans le code source, mais la ligne `<a id="…"></a>` précédente est absente ou contient encore l’ancien identifiant.
- Les liens d’ancre utilisent un fragment `#…` deviné à partir de mots anglais au lieu de l’identifiant que `write-heading-ids` générerait.

**Correction**

1. Exécutez `ai-i18n-tools write-heading-ids` sur votre `.md` / `.mdx` **source** (même `docs[]` / `contentPaths` que `translate-docs`). Il insère `<a id="slug"></a>` avant chaque en-tête ATX, ou met à jour un ancre existante lorsque le texte de l'en-tête ne correspond plus au slug actuel.
2. Pointez les liens d'ancre vers ces identifiants — par exemple `[setup](guide.md#first-run)` où `#first-run` correspond à la ligne d'ancre située au-dessus de l'en-tête cible, et non à un slug déduit uniquement du titre anglais.
3. Relancez `translate-docs` (ou `sync --force-update`) afin que chaque copie dans chaque langue inclue les lignes d'ancre mises à jour.

Utilisez `--dry-run` sur `write-heading-ids` d'abord pour prévisualiser les modifications. Voir [Liens d'ancrage](/fr/guide/documents/anchor-links) pour le modèle complet.

<a id="image-or-asset-links-404-in-translated-docs"></a>
## Liens d'image ou d'actif 404 dans les documents traduits

Un lien Markdown ou `![alt](url)` fonctionne en anglais mais renvoie une erreur 404 dans les copies traduites, souvent parce que l'URL pointe toujours vers le dossier de la langue source ou un chemin statique uniquement en anglais.

**Correction**

1. Confirmez que la disposition de votre actif correspond à votre `docsOutput.style` (plate ou système de documentation). Voir [Réécriture de liens](/fr/guide/documents/link-rewriting) et [Images et captures d'écran](/fr/guide/images-and-screenshots/).
2. Ajoutez ou ajustez `docsOutput.postProcessing.regexAdjustments` pour échanger des segments de locale ou relier des chemins `/img/…` absolus. Pour une disposition plate, rappelez-vous que le réécriveur de liens plats s'exécute **avant** `regexAdjustments` — faites correspondre les modèles à l'URL déjà préfixée.
3. Assurez-vous que les fichiers d'actifs spécifiques à la locale existent aux chemins référencés par le Markdown réécrit (`translate-docs` réécrit les URL mais ne copie pas les fichiers raster).
