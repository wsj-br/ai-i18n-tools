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

1. Exécutez `ai-i18n-tools write-heading-ids` sur votre **source** `.md` / `.mdx` (même `docs[]` / `contentPaths` que `translate-docs`). Par défaut, il insère `<a id="slug"></a>` avant chaque en-tête ATX, ou actualise une ancre existante lorsque le texte de l'en-tête ne correspond plus au slug actuel. Pour les identifiants de commentaire Docusaurus MDX, utilisez `--slug-style mdx-comment`.
2. Pointez les liens d'ancrage vers ces identifiants — par exemple `[setup](guide.md#first-run)` où `#first-run` correspond à la ligne d'ancrage au-dessus de l'en-tête cible, et non à un slug déduit du titre anglais seul.
3. Réexécutez `translate-docs` (ou `sync --force-update`) afin que chaque copie de locale inclue les lignes d'ancrage mises à jour.

Utilisez `--dry-run` sur `write-heading-ids` d'abord pour prévisualiser les modifications. Voir [Liens d'ancrage](/fr/guide/documents/anchor-links) pour le modèle complet.

<a id="image-or-asset-links-404-in-translated-docs"></a>
## Liens d'image ou d'actif 404 dans les documents traduits

Un lien Markdown ou `![alt](url)` fonctionne en anglais mais renvoie une erreur 404 dans les copies traduites, souvent parce que l'URL pointe toujours vers le dossier de la langue source ou un chemin statique uniquement en anglais.

**Correction**

1. Confirmez que la disposition de votre actif correspond à votre `docsOutput.style` (plate ou système de documentation). Voir [Réécriture de liens](/fr/guide/documents/link-rewriting) et [Images et captures d'écran](/fr/guide/images-and-screenshots/).
2. Ajoutez ou ajustez `docsOutput.postProcessing.regexAdjustments` pour échanger des segments de locale ou relier des chemins `/img/…` absolus. Pour une disposition plate, rappelez-vous que le réécriveur de liens plats s'exécute **avant** `regexAdjustments` — faites correspondre les modèles à l'URL déjà préfixée.
3. Assurez-vous que les fichiers d'actifs spécifiques à la locale existent aux chemins référencés par le Markdown réécrit (`translate-docs` réécrit les URL mais ne copie pas les fichiers raster).

<a id="hindi-arabic-cjk-or-cyrillic-output-is-romanized-latin-letters"></a>
## La sortie en hindi, arabe, CJK ou cyrillique est romanisée (lettres latines)

Certains modèles traduisent le sens mais écrivent le résultat en lettres latines/romaines (par exemple l'hindi en `Namaste` au lieu de `नमस्ते`). `hi` seul signifie Devanagari ; utilisez `hi-Latn` uniquement si vous souhaitez de l'hindi romanisé.

**Correction**

1. Vérifiez que le code de la locale correspond au script souhaité (`hi` vs `hi-Latn`, `zh-Hans` vs `zh-Hant`, `sr` vs `sr-Latn`).
2. Relancez la traduction afin que les lignes de cache de script incorrectes soient rejetées : `translate-ui --force` pour les chaînes d’interface utilisateur, ou `translate-docs --check-cache` / `sync --check-cache` (l’ignorance au niveau du fichier n’est contournée que pour les locales avec un script attendu ; le cache de segment valide est toujours réutilisé). `--force-update` retraite chaque locale.
3. Si un modèle continue d’échouer à la vérification du script, ajoutez une entrée `localeModels` pour cette locale afin qu’un modèle plus robuste soit essayé en premier — voir [Fournisseurs et modèles](/fr/guide/providers-and-models#model-fallback-chain).
