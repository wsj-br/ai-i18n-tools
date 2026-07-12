<a id="what-ai-i18n-tools-does-and-does-not-do-with-assets"></a>
# Ce que ai-i18n-tools fait (et ne fait pas) avec les ressources

`translate-docs` traduit le contenu markdown/MDX — y compris le texte alternatif des images — mais il ne copie pas, ne génère pas et n'émet pas de fichiers raster. Si une page traduite nécessite une capture d'écran spécifique à une langue, vous devez placer ce fichier à l'emplacement référencé par le markdown traduit.

`translate-svg` est la seule commande qui émet des fichiers binaires spécifiques à une langue. Elle lit les fichiers SVG sources, traduit les éléments textuels (`<text>`, `<title>`, `<desc>`), et écrit un fichier SVG de sortie par langue. Les fichiers raster (PNG, JPEG, WebP, GIF) ne sont jamais écrits par l'outil.

---

<a id="design-for-i18n-from-the-start"></a>
# Concevoir pour l'i18n dès le départ

Le choix de la structure de répertoire avant même la création des captures d'écran est le facteur le plus déterminant pour la facilité de gestion des ressources spécifiques à chaque langue. Adapter la structure après avoir ajouté des dizaines de captures d'écran implique de restructurer les chemins et de mettre à jour chaque référence dans les fichiers markdown.

<a id="markdown-with-docsoutputstyle--flat-readme-user-guide"></a>
### Markdown avec `docsOutput.style = "flat"` (README, GUIDE-UTILISATEUR)

Stockez les captures d'écran dans un sous-répertoire codé par langue dès le départ :

```
images/screenshots/en-GB/translate.png
images/screenshots/en-GB/settings.png
```

Lorsque vous ajoutez l'i18n ultérieurement, votre script `take-screenshots` écrit dans `images/screenshots/<locale>/` pour chaque langue, et une seule règle `regexAdjustments` gère tous les cas :

```json
{
  "search": "images/screenshots/[^/]+/",
  "replace": "images/screenshots/${translatedLocale}/"
}
```

L'expression régulière générique `[^/]+` correspond à n'importe quel nom de dossier de paramètres régionaux — ne codez pas en dur vos paramètres régionaux source (par exemple, `screenshots/en-GB/`), car cela ne fonctionnerait plus si `sourceLocale` changeait.

Si vous commencez avec des chemins qui omettent le sous-répertoire des paramètres régionaux (`images/screenshots/translate.png`), vous devrez restructurer l'ensemble de l'arborescence avant que la réécriture [par dossier de paramètres régionaux](/fr/guide/images-and-screenshots/per-locale-folder) puisse fonctionner.

<a id="doc-system-sites-docsoutputstyle--doc-system"></a>
### Sites de système de documentation (`docsOutput.style = "doc-system"`)

À utiliser pour les sites de documentation statique qui stockent les pages traduites dans une arborescence préfixée par langue — Docusaurus i18n, Astro Starlight, et générateurs personnalisés suivant la même structure. Les fichiers situés sous `docsRoot` sont écrits dans :

```text
{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}
```

Définissez `docs[].docsOutput.docsRoot` sur la racine de votre source anglaise (par exemple, `"docs"` ou `"src/content/docs"`). Lorsque vous définissez `style: "doc-system"` directement, vous devez également définir `localeSubpath` sur le segment de chemin que votre site utilise entre `{locale}/` et le fichier traduit. Les alias `"docusaurus"`, `"astro-starlight"` et `"vitepress"` sont des mises en page `doc-system` prédéfinies avec des valeurs `localeSubpath` par défaut (voir [Mises en page de sortie](/fr/guide/documents/output-layouts)).

| Alias prédéfini | `localeSubpath` par défaut | Exemple de sortie |
|--------------|-------------------------|----------------|
| `"docusaurus"` | `docusaurus-plugin-content-docs/current` | `i18n/de/docusaurus-plugin-content-docs/current/guide.md` |
| `"astro-starlight"` | `""` (vide) | `src/content/docs/de/guide.md` |
| `"vitepress"` | `""` (vide) | `docs/de/guide/quick-start.md` |

Le réécritureur de liens plat ne s'exécute **pas** pour `doc-system` (contrairement à `"flat"`). `postProcessing.regexAdjustments` voit l'URL d'origine du markdown source — généralement un chemin absolu ou racine du site comme `/img/screenshots/en-GB/foo.png`.

La mise en page **par dossier de paramètres régionaux** s'applique lorsque les captures d'écran se trouvent dans une arborescence d'URL statique partagée : utilisez un dossier codé par paramètres régionaux dès le premier jour et une règle générique `screenshots/[^/]+/` → `screenshots/${translatedLocale}/` (voir [Configuration — système de documentation](#config---docsoutputstyle--doc-system)).

Les **captures d'écran colocalisées** s'appliquent lorsque les documents traduits de chaque paramètre régional stockent les ressources à côté du markdown (pas de réécriture d'URL). Votre script de capture d'écran doit écrire les fichiers PNG dans des chemins dérivés de `{outputDir}`, `{locale}` et `{localeSubpath}` — le préréglage Docusaurus ci-dessous est la mise en page de référence.

<a id="docusaurus-preset"></a>
#### Configuration prédéfinie Docusaurus

Deux habitudes lors de la configuration du projet éliminent tous les ponts regex ultérieurs :

1. Créez un lien symbolique `documentation/docs/assets → ../static/assets` avant d'ajouter des captures d'écran. Webpack de Docusaurus suit les liens symboliques par défaut, ce qui permet aux documents sources d'utiliser des chemins relatifs que les documents traduits utiliseront également.

2. Placez toutes les ressources de documentation — PNG et SVG — dans `static/assets/` (un seul répertoire). Ne les séparez pas entre `static/img/` (SVGs) et `static/assets/` (PNGs). Un emplacement unique signifie que chaque page de documentation, en anglais ou traduite, peut référencer le même chemin relatif `../assets/name.ext`.

Référencez chaque ressource avec le chemin relatif stable `../assets/name.ext` dans le markdown source. N'utilisez jamais d'URL absolue `/img/` ou `/assets/` pour les ressources de documentation — ces URL diffèrent entre la source anglaise (servie depuis `static/`) et les versions traduites (colocalisées avec les documents traduits), ce qui oblige à utiliser une règle `regexAdjustments` pour combler l'écart.

Lorsque vous ajoutez l'i18n plus tard, le script de capture d'écran adopte la division `getScreenshotDir` (voir [Captures d'écran colocalisées](/fr/guide/images-and-screenshots/colocated-screenshots)) et `translate-svg` utilise un `pathTemplate`. Aucun ajustement d'expression régulière n'est nécessaire.

> **Remarque :** `resolve.symlinks = false` dans un `next.config.ts` désactive la résolution des liens symboliques uniquement pour la construction webpack de l'application Next.js. Cela n'affecte pas la construction du site de documentation Docusaurus, qui utilise une instance webpack distincte.

<a id="astrostarlight-preset"></a>
#### Préréglage Astro/Starlight

Équivalent à `docsOutput.style = "doc-system"` avec `localeSubpath: ""` — les pages traduites se trouvent directement sous `{outputDir}/{locale}/`.

Stockez les captures d'écran sous un chemin codé par langue dès le départ :

```
public/img/screenshots/en-GB/screenshot.png
```

Utilisez l'expression régulière générique dans `regexAdjustments` :

```json
{
  "search": "screenshots/[^/]+/",
  "replace": "screenshots/${translatedLocale}/"
}
```

<a id="web-apps-nextjs-vite-etc-with-svg-assets"></a>
### Applications web (Next.js, Vite, etc.) avec ressources SVG

Conservez les fichiers sources SVG dans un répertoire dédié (par exemple `images/` ou `src/assets/`) et configurez `svg.outputDir` vers un répertoire de distribution séparé (par exemple `public/assets/`). Ne mélangez jamais les fichiers SVG sources et les fichiers de sortie `translate-svg` dans le même dossier — il devient alors impossible de distinguer les fichiers générés.

Concevez les SVG pour qu'ils soient traduisibles dès le départ : utilisez les éléments `<text>`, `<title>` et `<desc>` pour tous les libellés lisibles par l'humain. Évitez d'intégrer du texte sous forme de données de chemin.

Activez `forceLowercase: true` dans le bloc de configuration `svg` pour éviter les incohérences de casse entre systèmes de fichiers et CDNs.

---

<a id="decision-guide"></a>
# Guide de décision

**L'actif est-il un SVG avec du texte ou des étiquettes traduisibles ?**
  - **Oui** → [Application Web SVG](/fr/guide/svg-translation/translated-svg-web-app) ou [SVG Colocalisé](/fr/guide/svg-translation/translated-svg-colocated)
  - **Non** (capture d'écran raster ou SVG décoratif) →
    - **Le site du système de documentation comporte-t-il des actifs colocalisés à côté des documents traduits ?**
      - **Oui** → [Captures d'écran colocalisées](/fr/guide/images-and-screenshots/colocated-screenshots) (rasters) + [SVG Colocalisé](/fr/guide/svg-translation/translated-svg-colocated) (SVG)
    - **Un seul paramètre régional nécessite l'image** (pas de variantes par paramètre régional) ?
      - **Oui** → [Image partagée](/fr/guide/images-and-screenshots/shared-image)
    - **Sinon** → [Dossier par paramètre régional](/fr/guide/images-and-screenshots/per-locale-folder)

Les mises en page SVG sont couvertes dans le guide [Traduction SVG](/fr/guide/svg-translation/).

| Disposition                                                                        | Type d'actif                  | Type de site                                                              | Mécanisme de l'outil                                               |
|----------------------------------------------------------------------------------|-----------------------------|------------------------------------------------------------------------|--------------------------------------------------------------|
| [Captures d'écran colocalisées](/fr/guide/images-and-screenshots/colocated-screenshots) | Raster (colocalisé)          | `"doc-system"` avec des actifs colocalisés (préréglage Docusaurus)               | Script de capture d'écran place les fichiers ; pas de regex                     |
| [Dossier par paramètres régionaux](/fr/guide/images-and-screenshots/per-locale-folder) | Raster (par paramètres régionaux) | `"flat"` ou `"doc-system"` (y compris `"docusaurus"`, `"astro-starlight"`) | Échange de segment de paramètres régionaux `regexAdjustments` |
| [Image partagée](/fr/guide/images-and-screenshots/shared-image)                   | Raster (partagé)             | `docsOutput.style = "flat"` docs                                       | Réécriveur de lien par fichier ; généralement pas de regex                     |
| [SVG colocalisé](/fr/guide/svg-translation/translated-svg-colocated) | SVG (traduit, colocalisé) | `"doc-system"` avec ressources colocalisées (préréglage Docusaurus) | `translate-svg` avec `svg.style = "nested"` + `pathTemplate` |
| [SVG d'application web](/fr/guide/svg-translation/translated-svg-web-app) | SVG (traduit) | Application web | `translate-svg` avec `svg.style = "flat"` |
