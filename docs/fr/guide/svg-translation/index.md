<a id="svg-translation"></a>
# Traduction SVG

Conçu pour les **illustrations et diagrammes SVG** qui contiennent des étiquettes lisibles par l'homme. La commande `translate-svg` lit les fichiers source `.svg`, extrait le texte des éléments `<text>`, `<title>` et `<desc>`, traduit ces chaînes via le fournisseur LLM actif, et écrit **un fichier SVG de sortie par locale cible**.

C'est le seul pipeline qui émet des fichiers SVG **binaires** spécifiques à la locale. `translate-docs` traduit le texte alternatif markdown et les références de liens, mais il ne modifie ni ne copie les ressources SVG. Lorsqu'une page a besoin d'un diagramme avec des étiquettes traduites, activez `features.translateSVG` et configurez le bloc `svg` de niveau supérieur.

<a id="per-locale-model-overrides"></a>
### Substitutions de modèle par locale

`translate-svg` résout les modèles **par paramètre régional cible** : `localeModels(locale)` en premier lorsqu'il est configuré, puis `translationModels`. Chaque exécution SVG de paramètre régional utilise sa propre chaîne de secours — utile lorsque les étiquettes de diagramme dans les paramètres régionaux CJK nécessitent un modèle adapté au script (par exemple `ja`). Voir [Fournisseurs et modèles](/guide/providers-and-models#model-fallback-chain).

La traduction SVG utilise le même cache SQLite que `translate-docs` et `translate-json` (`cacheDir`). Les segments de texte déjà traduits sont servis à partir du cache ; seul le texte source nouveau ou modifié est envoyé au LLM.

<a id="when-to-use-svg-translation"></a>
### Quand utiliser la traduction SVG

Utilisez `translate-svg` lorsque :

- Un SVG contient des étiquettes, des titres ou des descriptions visibles qui doivent changer selon la locale.
- Une application web charge des fichiers de diagrammes spécifiques à la locale au moment de l'exécution (par exemple `dashboard.de.svg`).
- Un site de système de documentation (Docusaurus, Astro Starlight, VitePress) co-localise les SVG traduits à côté du markdown traduit.

N'utilisez **pas** `translate-svg` pour :

- Les SVG décoratifs sans texte traduisible (icônes, logos, arrière-plans).
- Les captures d'écran raster (PNG, JPEG, WebP) — celles-ci sont gérées via [Images et captures d'écran](/guide/images-and-screenshots/).
- Le texte intégré dans les données de chemin au lieu des éléments `<text>` — l'extracteur ne peut pas lire les contours de chemin.

<a id="design-for-i18n-from-the-start"></a>
### Concevoir pour l'i18n dès le départ

Les SVG sont plus faciles à traduire lorsque les étiquettes sont de véritables éléments de texte dès le premier jour :

- Placez le texte lisible par l'homme dans `<text>`, `<title>` et `<desc>`.
- Évitez de convertir les étiquettes en chemins dans votre outil de conception — les données de chemin sont opaques pour le traducteur.
- Conservez les **SVG source** dans un répertoire dédié, séparé de `svg.outputDir`. Le mélange des sources et des fichiers de locale générés rend impossible de savoir quels fichiers peuvent être modifiés ou régénérés en toute sécurité.

Pour les applications web, activez `forceLowercase: true` lorsque votre conception utilise des étiquettes en minuscules — cela évite les problèmes de casse entre les systèmes de fichiers et les CDN.

<a id="output-layouts"></a>
### Dispositions de sortie

`translate-svg` prend en charge deux formes de sortie courantes. Choisissez en fonction de la manière dont votre application ou votre site de documentation référence les fichiers SVG au moment de l'exécution.

| Disposition | `svg.style` | Idéal pour | Guide enfant |
|--------|-------------|----------|-------------|
| **Plat (application web)** | `"flat"` | Next.js, Vite et d'autres applications qui intègrent des SVG par nom de fichier codé par locale | [Application web (SVG plat)](/guide/svg-translation/translated-svg-web-app) |
| **Co-localisé (système de documentation)** | `"nested"` + `pathTemplate` | Docusaurus et d'autres sites de système de documentation où les ressources traduites se trouvent à côté des pages traduites | [SVG co-localisé](/guide/svg-translation/translated-svg-colocated) |

La **disposition plate** écrit des fichiers comme `public/assets/diagram.de.svg` à côté de `diagram.en-GB.svg`. Votre application les référence avec un suffixe de locale :

```tsx
<img src={`/assets/diagram.${locale}.svg`} alt="Architecture diagram" />
```

La **disposition co-localisée** écrit le SVG de chaque locale dans l'arborescence de contenu de cette locale (par exemple `i18n/de/.../assets/diagram.svg`). Le markdown source et traduit utilise le même chemin relatif (`../assets/diagram.svg`) — aucune règle `regexAdjustments` n'est nécessaire.

Consultez le [guide de décision Images et captures d'écran](/guide/images-and-screenshots/#decision-guide) pour savoir comment les dispositions SVG s'intègrent aux stratégies de captures d'écran raster.

<a id="step-1-enable-and-configure"></a>
### Étape 1 : Activer et configurer

Activez la fonctionnalité et pointez `translate-svg` vers vos fichiers source et votre racine de sortie :

```json
{
  "features": {
    "translateSVG": true
  },
  "svg": {
    "sourcePath": "images",
    "outputDir": "public/assets",
    "style": "flat"
  }
}
```

Champs clés `svg` :

- `sourcePath` — un ou plusieurs répertoires ou modèles glob (par exemple `"images/*.svg"`, `"**/icons/*.svg"`). Analysé de manière récursive à partir de la racine du projet.
- `outputDir` — répertoire racine pour la sortie SVG traduite.
- `style` — `"flat"` ou `"nested"` lorsque vous n'utilisez pas de `pathTemplate` personnalisé.
- `pathTemplate` — chemin de sortie personnalisé facultatif avec les espaces réservés `{outputDir}`, `{locale}`, `{llocale}`, `{basename}`, `{stem}` et d'autres (requis pour les mises en page de système de documentation colocalisées).
- `forceLowercase` — texte traduit en minuscules lors du réassemblage.

Référence complète du champ : [Configuration — `svg`](/reference/configuration#svg).

<a id="step-2-translate"></a>
### Étape 2 : Traduire

```bash
npx ai-i18n-tools translate-svg
```

Traduire une seule locale :

```bash
npx ai-i18n-tools translate-svg --locale de
```

Aperçu sans écrire de fichiers :

```bash
npx ai-i18n-tools translate-svg --dry-run
```

`sync` exécute l'étape SVG automatiquement lorsque `features.translateSVG` et `svg` sont tous deux définis (ignorer avec `--no-svg`). Les drapeaux partagés incluent `-l` / `--locale`, `-p` / `--path`, `-j` / `--concurrency` et `--force` / `--force-update`.

<a id="troubleshooting"></a>
### Dépannage

Les problèmes SVG courants — répertoires source/sortie mixtes, URL statiques absolues sur Docusaurus et erreurs de mise en page de chemin — sont traités dans [Dépannage SVG](/guide/svg-translation/troubleshooting). Pour les ressources raster et la réécriture de liens, voir [Dépannage des images et captures d'écran](/guide/images-and-screenshots/troubleshooting).
