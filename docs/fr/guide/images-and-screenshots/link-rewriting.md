<a id="the-flat-link-rewriter-and-two-step-flow"></a>
# Le réécriveur de liens plats et le flux en deux étapes

Pour `docsOutput.style = "flat"` (et sauf si `rewriteRelativeLinks: false` ou un `pathTemplate` personnalisé est défini), un réécriture intégré s'exécute avant `postProcessing`. Il gère les liens inter-documents (en ajoutant les suffixes de langue) et ajoute un préfixe de profondeur aux URL des ressources non markdown.

<a id="two-step-flow-when-docsoutputstyle--flat"></a>
### Flux en deux étapes lorsque `docsOutput.style = "flat"`

```
source URL  →  [flat link rewriter: depth prefix]  →  [postProcessing: locale segment]  →  output URL
```

Exemple avec `outputDir: "translated-docs/"` et une source `README.md` située à la racine du dépôt :

1. Réécritureur de liens plats : `images/screenshots/en-GB/foo.png` → `../images/screenshots/en-GB/foo.png` (un `../` pour `translated-docs/`)
2. Expression régulière `postProcessing` `images/screenshots/[^/]+/` → `images/screenshots/${translatedLocale}/` : `../images/screenshots/de/foo.png`

Pour `docsOutput.style = "doc-system"` (y compris `"docusaurus"`, `"astro-starlight"` et `"nested"`), le réécriture de liens plats ne s'exécute pas. `postProcessing` voit l'URL d'origine issue du markdown traduit (généralement un chemin absolu tel que `/img/screenshots/en-GB/foo.png`).

<a id="vitepress-link-normalizer"></a>
### Normaliseur de liens VitePress (`style: "vitepress"`)

Lorsque `docsOutput.rewriteVitepressLinks` est `true` (par défaut lorsque `style` est `"vitepress"`), un normaliseur distinct s'exécute après le réassemblage du segment (au lieu du réécriveur plat). Il cible les sites VitePress / doc-system où l'anglais se trouve à la racine du contenu et les locales se trouvent dans des dossiers frères (`docs/de/guide/…`).

```
source href  →  [VitePress link normalizer]  →  [postProcessing]  →  output href
```

Réécritures typiques :

| Modèle source | Cible normalisée |
|----------------|-------------------|
| `docs/guide/foo.md` | `/guide/foo` |
| `../guide/foo.md` (à partir d'un fichier de locale) | `/guide/foo` |
| `https://github.com/…/examples/console-app/` | inchangé (utiliser des URL complètes pour les chemins de dépôt) |

Pour les projets qui synchronisent `README.md` → `docs/index.md`, utilisez des URL GitHub complètes dans `README.md` pour `LICENSE`, `examples/` et d'autres fichiers en dehors de l'arborescence VitePress. Voir [Intégration de VitePress — README comme page d'accueil de la documentation](/guide/vitepress-integration#readme-as-homepage).

Le réécriveur plat et le normaliseur VitePress s'excluent mutuellement par bloc `docs[]` — un seul s'exécute avant `postProcessing`. Voir [Intégration VitePress — Conventions de liens](/guide/vitepress-integration#link-conventions).

<a id="per-file-depth-prefix-with-flatpreserverelativedir"></a>
### Préfixe de profondeur par fichier avec `flatPreserveRelativeDir`

Le préfixe de profondeur est calculé pour chaque fichier de sortie — pas globalement pour l'ensemble du traitement. Pour chaque fichier source, le réécritureur calcule le chemin relatif depuis le répertoire du fichier de sortie vers le répertoire du fichier source, et utilise ce chemin comme préfixe.

Cela signifie qu'avec `flatPreserveRelativeDir: true`, les fichiers source des sous-répertoires obtiennent automatiquement le préfixe correct. Par exemple, `docs/guide/quick-start.md` génère `translated-docs/docs/guide/quick-start.<locale>.md`. Le préfixe par fichier est `../../docs/`, donc un actif `translation-dashboard.png` (un élément frère de l'arborescence source) devient `../../docs/translation-dashboard.png` — ce qui se résout correctement de `translated-docs/docs/guide/` à `docs/translation-dashboard.png`.

Aucune correction par expression régulière `postProcessing` n'est nécessaire pour les ressources en chemin relatif placées aux côtés des fichiers sources.

<a id="rewriterelativelinks-and-linkrewritedocsroot"></a>
### `rewriteRelativeLinks` et `linkRewriteDocsRoot`

| Option                                   | Effet                                                                                                           |
|------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| `docsOutput.rewriteRelativeLinks`    | Active ou désactive explicitement le réécriture de liens plats (remplace la valeur par défaut lorsque `docsOutput.style = "flat"`) |
| `docsOutput.linkRewriteDocsRoot`     | Répertoire racine à partir duquel `depthPrefix` est calculé (valeur par défaut `"."`)                                                        |
| `docsOutput.flatPreserveRelativeDir` | Affecte la structure du chemin de sortie, que le réécriture utilise lors du calcul des chemins cibles pour les fichiers traduits connus       |

---

<a id="common-mistakes-and-troubleshooting"></a>
