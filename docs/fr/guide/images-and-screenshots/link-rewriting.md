<a id="the-flat-link-rewriter-and-two-step-flow"></a>
# Le réécriveur de liens plats et le flux en deux étapes

Pour `docsOutput.style = "flat"` (et sauf si `rewriteRelativeLinks: false` ou un `pathTemplate` personnalisé est défini), un réécriveur intégré s'exécute avant `postProcessing`. Il gère les liens inter-documents (en ajoutant des suffixes de paramètres régionaux) et ajoute un préfixe de profondeur aux URL d'actifs non-markdown. Les chemins d'actifs spécifiques aux paramètres régionaux (captures d'écran, ponts `/img/…`) sont ensuite réécrits par `docsOutput.postProcessing.regexAdjustments`.

<a id="two-step-flow-when-docsoutputstyle--flat"></a>
### Flux en deux étapes lorsque `docsOutput.style = "flat"`

```
source URL  →  [flat link rewriter: depth prefix]  →  [regexAdjustments: locale segment]  →  output URL
```

Exemple avec `outputDir: "translated-docs/"` et une source `README.md` située à la racine du dépôt :

1. Réécriveur de liens plats : `images/screenshots/en-GB/foo.png` → `../images/screenshots/en-GB/foo.png` (un `../` pour `translated-docs/`)
2. Règle `regexAdjustments` `images/screenshots/[^/]+/` → `images/screenshots/${translatedLocale}/` : `../images/screenshots/de/foo.png`

Pour `docsOutput.style = "doc-system"` (y compris `"docusaurus"`, `"astro-starlight"` et `"nested"`), le réécriveur de liens plats ne s'exécute pas. `regexAdjustments` voit l'URL d'origine du markdown traduit (généralement un chemin absolu comme `/img/screenshots/en-GB/foo.png`).

<a id="vitepress-link-normalizer-style-vitepress"></a>
### Normaliseur de liens VitePress (`style: "vitepress"`)

Lorsque `docsOutput.rewriteVitepressLinks` est `true` (par défaut lorsque `style` est `"vitepress"`), un normaliseur distinct s'exécute après le réassemblage du segment (au lieu du réécriveur plat). Il cible les sites VitePress / doc-system où l'anglais se trouve à la racine du contenu et les locales se trouvent dans des dossiers frères (`docs/de/guide/…`).

```
source href  →  [VitePress link normalizer]  →  [regexAdjustments]  →  output href
```

Réécritures typiques :

| Modèle source | Cible normalisée |
|----------------|-------------------|
| `docs/guide/foo.md` | `/guide/foo` |
| `../guide/foo.md` (à partir d'un fichier de locale) | `/guide/foo` |
| `https://github.com/…/examples/console-app/` | inchangé (utiliser des URL complètes pour les chemins de dépôt) |

Pour les projets qui synchronisent `README.md` → `docs/index.md`, utilisez des URL GitHub complètes dans `README.md` pour `LICENSE`, `examples/` et d'autres fichiers en dehors de l'arborescence VitePress. Voir [Intégration de VitePress — README comme page d'accueil de la documentation](/guide/vitepress-integration#readme-as-homepage).

Le réécriveur plat et le normaliseur VitePress s'excluent mutuellement par bloc `docs[]` — un seul s'exécute avant `regexAdjustments`. Voir [Intégration VitePress — Conventions de liens](/guide/vitepress-integration#link-conventions).

<a id="nextra-link-normalizer-style-nextra"></a>
### Normaliseur de liens Nextra (`style: "nextra"`)

Lorsque `docsOutput.rewriteNextraLinks` est `true` (par défaut quand `style` est `"nextra"`), un normaliseur distinct s'exécute après le réassemblage des segments. Il réécrit les chemins `content/en/…` et les chemins `.mdx` relatifs en routes neutres vis-à-vis des locales (`/guide/…`). Voir [Intégration Nextra — Conventions de liens](/guide/nextra-integration#link-conventions).

<a id="fumadocs-link-normalizer-style-fumadocs"></a>
### Normaliseur de liens Fumadocs (`style: "fumadocs"`)

Lorsque `docsOutput.rewriteFumadocsLinks` est `true` (par défaut quand `style` est `"fumadocs"`), un normaliseur distinct s'exécute après le réassemblage des segments. Il réécrit les chemins `content/docs/…` et les chemins `.mdx` relatifs en routes neutres vis-à-vis des locales (`/docs/…`). Voir [Intégration Fumadocs — Conventions de liens](/guide/fumadocs-integration#link-conventions).

<a id="per-file-depth-prefix-with-flatpreserverelativedir"></a>
### Préfixe de profondeur par fichier avec `flatPreserveRelativeDir`

Le préfixe de profondeur est calculé pour chaque fichier de sortie — pas globalement pour l'ensemble du traitement. Pour chaque fichier source, le réécritureur calcule le chemin relatif depuis le répertoire du fichier de sortie vers le répertoire du fichier source, et utilise ce chemin comme préfixe.

Cela signifie qu'avec `flatPreserveRelativeDir: true`, les fichiers source des sous-répertoires obtiennent automatiquement le préfixe correct. Par exemple, `docs/guide/quick-start.md` génère `translated-docs/docs/guide/quick-start.<locale>.md`. Le préfixe par fichier est `../../docs/`, donc un actif `translation-dashboard.png` (un élément frère de l'arborescence source) devient `../../docs/translation-dashboard.png` — ce qui se résout correctement de `translated-docs/docs/guide/` à `docs/translation-dashboard.png`.

Aucune correction `regexAdjustments` n'est nécessaire pour les actifs à chemin relatif à côté des fichiers source.

<a id="rewriterelativelinks-and-linkrewritedocsroot"></a>
### `rewriteRelativeLinks` et `linkRewriteDocsRoot`

| Option                                   | Effet                                                                                                           |
|------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| `docsOutput.rewriteRelativeLinks`    | Active ou désactive explicitement le réécriture de liens plats (remplace la valeur par défaut lorsque `docsOutput.style = "flat"`) |
| `docsOutput.linkRewriteDocsRoot`     | Répertoire racine à partir duquel `depthPrefix` est calculé (valeur par défaut `"."`)                                                        |
| `docsOutput.flatPreserveRelativeDir` | Affecte la structure du chemin de sortie, que le réécriture utilise lors du calcul des chemins cibles pour les fichiers traduits connus       |

<a id="docsoutputpostprocessingregexadjustments"></a>
### `docsOutput.postProcessing.regexAdjustments`

Configurez des règles `{ "description"?, "search", "replace" }` ordonnées sous `docs[].docsOutput.postProcessing` pour réécrire les URL d'images, de captures d'écran et d'autres actifs que les réécriveurs intégrés ne gèrent pas — généralement en échangeant un segment de dossier de paramètres régionaux (`screenshots/en-GB/` → `screenshots/de/`) ou en reliant des chemins statiques absolus (`/img/…` → `../assets/…`).

Les règles s'exécutent sur le **corps** du markdown traduit après le réassemblage des segments et la réécriture des liens intégrés (plat ou VitePress), et avant `addFrontmatter`. Sur une mise en page plate, écrivez des motifs `search` par rapport aux URL **après** l'application du préfixe de profondeur — faites correspondre le segment de paramètres régionaux à l'intérieur du chemin, et non le `../` de début.

**Dossiers de captures d'écran par paramètres régionaux (mise en page plate) :**

```json
"docsOutput": {
  "style": "flat",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders",
        "search": "images/screenshots/[^/]+/",
        "replace": "images/screenshots/${translatedLocale}/"
      }
    ]
  }
}
```

Utilisez `[^/]+` au lieu de coder en dur vos paramètres régionaux source (`en-GB`) afin que la règle survive à un changement de `sourceLocale`. Le substitut le plus courant est `${translatedLocale}` ; `${sourceLocale}`, `${sourceFilename}`, `${translatedFilename}` et les variables de chemin sont également disponibles — voir [Documents — Réécriture de liens](/guide/documents/link-rewriting#replace-placeholders).

Exemples spécifiques à la mise en page (plat, système de documentation, Docusaurus, Starlight) : [Dossier par paramètres régionaux](/guide/images-and-screenshots/per-locale-folder). Règles générales de liens inter-pages : [Documents — Réécriture de liens](/guide/documents/link-rewriting). Référence de champ : [Configuration — `docs`](/reference/configuration#docs).

---

<a id="common-mistakes-and-troubleshooting"></a>

Voir [Erreurs courantes et dépannage](/guide/images-and-screenshots/troubleshooting) pour les expressions régulières de paramètres régionaux codées en dur, les répertoires de captures d'écran manquants et le pontage `/img/` de Docusaurus.
