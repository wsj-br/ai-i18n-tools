<a id="locale-assets-guide"></a>
# Guide des ressources localisées

Ce guide explique comment gérer les ressources spécifiques à une locale — captures d'écran (PNG, JPEG, WebP) et fichiers SVG illustrés — dans les projets utilisant `ai-i18n-tools`. Il décrit chaque modèle disponible, le moment de l'utiliser, et comment configurer un projet dès le départ afin qu'ajouter d'autres locales ultérieurement ne nécessite aucune refonte structurelle.

Pour la référence de configuration SVG, consultez la section [`svg`](#svg) dans [GETTING_STARTED.md](GETTING_STARTED.fr.md). Pour l'option `postProcessing.regexAdjustments`, consultez la [référence de configuration](GETTING_STARTED.fr.md#configuration-reference).

| Chemin de configuration | Valeur | Cas d'utilisation | Notes |
|------------------------|-------|------------------|------|
| `documentations[].markdownOutput.style` | `"flat"` | Fichiers README / USER-GUIDE avec suffixe de locale | Active le réécritureur de liens plats ; à associer avec `flatPreserveRelativeDir` lorsque les sources se trouvent dans des sous-répertoires |
| `documentations[].markdownOutput.style` | `"nested"` (par défaut) | Sous-dossiers simples par locale sous `outputDir` | Pas de réécritureur de liens plats |
| `documentations[].markdownOutput.style` | `"doc-system"` | Arborescences de documentation préfixées par locale (générateurs personnalisés) | Définir `docsRoot` et `localeSubpath` ; le réécritureur de liens plats n'est pas exécuté |
| `documentations[].markdownOutput.style` | `"docusaurus"` / `"astro-starlight"` | Dispositions prédéfinies `doc-system` | Alias avec valeurs par défaut spécifiques au générateur pour `localeSubpath` |
| `svg.style` | `"flat"` | Applications web (`name.<locale>.svg` dans `public/assets/`) | Séparé des `style` en markdown ; utilisé par `translate-svg` |
| `svg.style` | `"nested"` | Sortie SVG colocalisée dans le système de documentation | Souvent associé à `pathTemplate` (modèle E) |

Ce guide utilise les chaînes JSON exactes provenant de la configuration — pas uniquement des mots anglais — afin que les versions traduites restent sans ambiguïté.

<small>**Lire dans d'autres langues :** </small>
<small id="lang-list">[English (GB)](../../docs/LOCALE-ASSETS-GUIDE.md) · [Deutsch](./LOCALE-ASSETS-GUIDE.de.md) · [Español](./LOCALE-ASSETS-GUIDE.es.md) · [Français](./LOCALE-ASSETS-GUIDE.fr.md) · [हिन्दी](./LOCALE-ASSETS-GUIDE.hi.md) · [日本語](./LOCALE-ASSETS-GUIDE.ja.md) · [한국어](./LOCALE-ASSETS-GUIDE.ko.md) · [Português (Brasil)](./LOCALE-ASSETS-GUIDE.pt-BR.md) · [中文 (中国大陆)](./LOCALE-ASSETS-GUIDE.zh-CN.md) · [中文 (台灣)](./LOCALE-ASSETS-GUIDE.zh-TW.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Ce que fait (et ne fait pas) ai-i18n-tools avec les ressources](#what-ai-i18n-tools-does-and-does-not-do-with-assets)
- [Concevoir pour l'i18n dès le départ](#design-for-i18n-from-the-start)
  - [Markdown avec `markdownOutput.style = "flat"` (README, USER-GUIDE)](#markdown-with-markdownoutputstyle--flat-readme-user-guide)
  - [Sites du système de documentation (`markdownOutput.style = "doc-system"`)](#doc-system-sites-markdownoutputstyle--doc-system)
    - [Préréglage Docusaurus](#docusaurus-preset)
    - [Préréglage Astro/Starlight](#astrostarlight-preset)
  - [Applications web (Next.js, Vite, etc.) avec ressources SVG](#web-apps-nextjs-vite-etc-with-svg-assets)
- [Guide de décision](#decision-guide)
- [Modèle A - Raster partagé](#pattern-a--shared-raster)
  - [Exemple d'implémentation](#implementation-example)
- [Modèle B - Dossier par locale (réécriture d'URL)](#pattern-b--per-locale-folder-url-rewriting)
  - [Organisation des répertoires](#directory-layout)
  - [Contrat du script de capture d'écran](#screenshot-script-contract)
  - [Configuration - `markdownOutput.style = "flat"`](#config--markdownoutputstyle--flat)
  - [Configuration - `markdownOutput.style = "doc-system"`](#config--markdownoutputstyle--doc-system)
  - [Préréglage - `markdownOutput.style = "docusaurus"`](#preset--markdownoutputstyle--docusaurus)
  - [Préréglage - `markdownOutput.style = "astro-starlight"`](#preset--markdownoutputstyle--astro-starlight)
- [Modèle C - Raster colocalisé (`doc-system`)](#pattern-c--colocated-raster-doc-system)
  - [Organisation des répertoires](#directory-layout-1)
  - [Contrat du script de capture d'écran](#screenshot-script-contract-1)
  - [Configuration](#config)
  - [Prérequis](#prerequisites)
  - [Exemple d'implémentation](#implementation-example-1)
- [Modèle D - SVG traduits avec `svg.style = "flat"`](#pattern-d--translated-svg-with-svgstyle--flat)
  - [Configuration](#config-1)
  - [Référence de l'application](#app-reference)
  - [Recommandation d'organisation des sources](#source-layout-recommendation)
  - [Exemple d'implémentation](#implementation-example-2)
- [Modèle E - SVG traduits colocalisés (système de documentation)](#pattern-e--colocated-translated-svg-doc-system)
  - [Configuration](#config-2)
  - [Markdown source](#source-markdown)
  - [Emplacement source du SVG](#svg-source-location)
  - [Espaces réservés `pathTemplate`](#pathtemplate-placeholders)
  - [Exemple d'implémentation](#implementation-example-3)
- [Le réécritureur de liens plats et le flux en deux étapes](#the-flat-link-rewriter-and-two-step-flow)
  - [Flux en deux étapes quand `markdownOutput.style = "flat"`](#two-step-flow-when-markdownoutputstyle--flat)
  - [Préfixe de profondeur par fichier avec `flatPreserveRelativeDir`](#per-file-depth-prefix-with-flatpreserverelativedir)
  - [`rewriteRelativeLinks` et `linkRewriteDocsRoot`](#rewriterelativelinks-and-linkrewritedocsroot)
- [Erreurs fréquentes et dépannage](#common-mistakes-and-troubleshooting)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

---

<a id="what-ai-i18n-tools-does-and-does-not-do-with-assets"></a>
## Ce que fait (et ne fait pas) ai-i18n-tools avec les ressources

`translate-docs` traduit le contenu markdown/MDX — y compris le texte alternatif des images — mais il ne copie pas, ne génère pas et n'émet pas de fichiers raster. Si une page traduite nécessite une capture d'écran spécifique à une langue, vous devez placer ce fichier à l'emplacement référencé par le markdown traduit.

`translate-svg` est la seule commande qui émet des fichiers binaires spécifiques à une langue. Elle lit les fichiers SVG sources, traduit les éléments textuels (`<text>`, `<title>`, `<desc>`), et écrit un fichier SVG de sortie par langue. Les fichiers raster (PNG, JPEG, WebP, GIF) ne sont jamais écrits par l'outil.

---

<a id="design-for-i18n-from-the-start"></a>
## Concevoir pour l'internationalisation dès le départ

Le choix de la structure de répertoire avant même la création des captures d'écran est le facteur le plus déterminant pour la facilité de gestion des ressources spécifiques à chaque langue. Adapter la structure après avoir ajouté des dizaines de captures d'écran implique de restructurer les chemins et de mettre à jour chaque référence dans les fichiers markdown.

<a id="markdown-with-markdownoutputstyle--flat-readme-user-guide"></a>
### Markdown avec `markdownOutput.style = "flat"` (README, GUIDE-UTILISATEUR)

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

Le modèle générique `[^/]+` correspond à n'importe quel nom de dossier de langue — n'inscrivez pas en dur la langue source (par exemple `screenshots/en-GB/`), car cela provoquerait une erreur si `sourceLocale` changeait un jour.

Si vous commencez avec des chemins qui omettent le sous-répertoire de langue (`images/screenshots/translate.png`), vous devrez restructurer l'arborescence entière avant que le modèle B puisse fonctionner.

<a id="doc-system-sites-markdownoutputstyle--doc-system"></a>
### Sites de documentation (`markdownOutput.style = "doc-system"`)

À utiliser pour les sites de documentation statique qui stockent les pages traduites dans une arborescence préfixée par langue — Docusaurus i18n, Astro Starlight, et générateurs personnalisés suivant la même structure. Les fichiers situés sous `docsRoot` sont écrits dans :

```text
{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}
```

Définissez `documentations[].markdownOutput.docsRoot` comme racine de vos sources en anglais (par exemple `"docs"` ou `"src/content/docs"`). Lorsque vous définissez `style: "doc-system"` directement, vous devez aussi définir `localeSubpath` comme le segment de chemin que votre site utilise entre `{locale}/` et le fichier traduit. Les alias `"docusaurus"` et `"astro-starlight"` sont des configurations prédéfinies `doc-system` avec des valeurs par défaut pour `localeSubpath` (voir [Dispositions de sortie](GETTING_STARTED.fr.md#output-layouts)).

| Alias prédéfini | `localeSubpath` par défaut | Exemple de sortie |
|--------------|-------------------------|----------------|
| `"docusaurus"` | `docusaurus-plugin-content-docs/current` | `i18n/de/docusaurus-plugin-content-docs/current/guide.md` |
| `"astro-starlight"` | `""` (vide) | `src/content/docs/de/guide.md` |

Le réécritureur de liens plat ne s'exécute **pas** pour `doc-system` (contrairement à `"flat"`). `postProcessing.regexAdjustments` voit l'URL d'origine du markdown source — généralement un chemin absolu ou racine du site comme `/img/screenshots/en-GB/foo.png`.

**Modèle B** s'applique lorsque les captures d'écran se trouvent dans une arborescence URL statique partagée : utilisez un dossier codé par langue dès le départ et une règle générique `screenshots/[^/]+/` → `screenshots/${translatedLocale}/` (voir [Configuration — doc-system](#config--markdownoutputstyle--doc-system)).

**Modèle C** s'applique lorsque les ressources de chaque langue sont placées à côté du markdown (sans réécriture d'URL). Votre script de capture doit écrire les fichiers PNG dans des chemins dérivés de `{outputDir}`, `{locale}` et `{localeSubpath}` — la configuration prédéfinie Docusaurus ci-dessous est la disposition de référence.

<a id="docusaurus-preset"></a>
#### Configuration prédéfinie Docusaurus

Deux habitudes lors de la configuration du projet éliminent tous les ponts regex ultérieurs :

1. Créez un lien symbolique `documentation/docs/assets → ../static/assets` avant d'ajouter des captures d'écran. Webpack de Docusaurus suit les liens symboliques par défaut, ce qui permet aux documents sources d'utiliser des chemins relatifs que les documents traduits utiliseront également.

2. Placez toutes les ressources de documentation — PNG et SVG — dans `static/assets/` (un seul répertoire). Ne les séparez pas entre `static/img/` (SVGs) et `static/assets/` (PNGs). Un emplacement unique signifie que chaque page de documentation, en anglais ou traduite, peut référencer le même chemin relatif `../assets/name.ext`.

Référencez chaque ressource avec le chemin relatif stable `../assets/name.ext` dans le markdown source. N'utilisez jamais d'URL absolue `/img/` ou `/assets/` pour les ressources de documentation — ces URL diffèrent entre la source anglaise (servie depuis `static/`) et les versions traduites (colocalisées avec les documents traduits), ce qui oblige à utiliser une règle `regexAdjustments` pour combler l'écart.

Lorsque vous ajouterez ultérieurement l'i18n, le script de capture adoptera la séparation `getScreenshotDir` (voir [Modèle C](#pattern-c--docusaurus-colocated)) et `translate-svg` utilisera un `pathTemplate`. Aucun ajustement regex n'est nécessaire.

> **Remarque :** `resolve.symlinks = false` dans un `next.config.ts` désactive la résolution des liens symboliques uniquement pour la construction webpack de l'application Next.js. Cela n'affecte pas la construction du site de documentation Docusaurus, qui utilise une instance webpack distincte.

<a id="astrostarlight-preset"></a>
#### Préréglage Astro/Starlight

Équivalent à `markdownOutput.style = "doc-system"` avec `localeSubpath: ""` — les pages traduites se trouvent directement sous `{outputDir}/{locale}/`.

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
## Guide de décision

```
Is the asset an SVG with translatable text or labels?
  Yes → Pattern D (web app) or Pattern E (doc-system colocated)
  No (raster screenshot or decorative SVG) →
    doc-system site with assets colocated beside translated docs?
      Yes → Pattern C (rasters) + Pattern E (SVGs)
    Only one locale needs the image (no per-locale variants)?
      Yes → Pattern A
    Otherwise → Pattern B
```

| Modèle | Type de ressource           | Type de site                                                              | Mécanisme de l'outil                                       |
|--------|-----------------------------|---------------------------------------------------------------------------|------------------------------------------------------------|
| A      | Raster (partagé)            | `markdownOutput.style = "flat"` docs                                      | Réécriture de lien par fichier ; généralement pas de regex |
| B      | Raster (par langue)         | `"flat"` ou `"doc-system"` (incl. `"docusaurus"`, `"astro-starlight"`)    | Échange de segment de langue via `regexAdjustments`        |
| C      | Raster (colocalisé)         | `"doc-system"` avec ressources colocalisées (préréglage Docusaurus)                  | Le script de capture place les fichiers ; pas de regex     |
| D      | SVG (traduit)               | Application web                                                           | `translate-svg` avec `svg.style = "flat"`                    |
| E      | SVG (traduit, colocalisé)   | `"doc-system"` avec ressources colocalisées (préréglage Docusaurus)                  | `translate-svg` avec `svg.style = "nested"` + `pathTemplate` |

---

<a id="pattern-a--shared-raster"></a>
## Motif A - Raster partagé

À utiliser lorsqu'une seule image est partagée entre toutes les locales (aucune variante par locale). Lorsque `markdownOutput.style = "flat"`, le réécritureur de liens plats calcule le préfixe de profondeur pour chaque fichier de sortie, de sorte qu'une ressource située à côté du fichier source (par exemple `docs/figure.png` référencée comme `figure.png` depuis `docs/page.md`) est correctement résolue dans chaque sortie traduite — aucune règle `postProcessing.regexAdjustments` n'est nécessaire.

Exemple : ce package traduit `docs/GETTING_STARTED.md` en `translated-docs/docs/GETTING_STARTED.<locale>.md`. L'image sœur `docs/translation-dashboard.png` est référencée comme `translation-dashboard.png`. Le réécritureur calcule le préfixe par fichier depuis le répertoire du fichier de sortie jusqu'au répertoire source (`../../docs/`), produisant `../../docs/translation-dashboard.png`. Depuis `translated-docs/docs/`, cela se résout correctement en `docs/translation-dashboard.png`.

Aucun script de capture d'écran n'est nécessaire — le fichier est placé une fois et ne change jamais selon la locale.

Une règle `postProcessing` est tout de même nécessaire lorsque :
- La ressource est référencée via une URL absolue (par exemple `/img/figure.png`) — le réécritureur ne gère que les chemins relatifs
- Vous souhaitez modifier l'URL de la ressource pour d'autres raisons (par exemple passer à un CDN)

<a id="implementation-example"></a>
### Exemple de mise en œuvre

Ce dépôt utilise le motif A pour la capture d'écran du tableau de bord de traduction : [GETTING_STARTED.md](GETTING_STARTED.fr.md#translation-dashboard) fait référence à l'image [translation-dashboard.png](../../docs/../docs/translation-dashboard.png) située dans le même dossier. [ai-i18n-tools.config.json](../../docs/../ai-i18n-tools.config.json) définit `markdownOutput.style = "flat"` et `flatPreserveRelativeDir: true` ; le préfixe de profondeur par fichier résout le chemin de l'image sans nécessiter de règle `regexAdjustments` pour les captures d'écran.

---

<a id="pattern-b--per-locale-folder-url-rewriting"></a>
## Motif B - Dossier par locale (réécriture d'URL)

À utiliser pour les fichiers README/USER-GUIDE avec `markdownOutput.style = "flat"`, et pour les sites de documentation (`markdownOutput.style = "doc-system"` ou alias `"docusaurus"` / `"astro-starlight"`) qui servent des captures d'écran depuis une arborescence d'URL statiques partagée.

<a id="directory-layout"></a>
### Organisation des répertoires

<details>
<summary>Exemple d'arborescence de répertoire de captures d'écran par langue</summary>

```
images/screenshots/
├── en-GB/
│   ├── translate.png
│   └── settings.png
├── de/
│   ├── translate.png
│   └── settings.png
└── fr/
    ├── translate.png
    └── settings.png
```

</details>

Les fichiers markdown sources référencent le répertoire de la locale source :

```markdown
![Translate tab](../../docs/images/screenshots/en-GB/translate.png)
```

<a id="screenshot-script-contract"></a>
### Contrat du script de captures d'écran

Le script `take-screenshots` doit écrire les fichiers pour chaque locale — pas seulement pour la locale source. La commande `translate-docs` réécrit les chemins mais ne crée pas les fichiers. Un motif courant :

```js
function getScreenshotDir(locale) {
  return `images/screenshots/${locale}`;
}
```

Voir un exemple simple de `bash` dans le [script de capture d'écran dans examples/nextjs-app](../../docs/../examples/nextjs-app/scripts/screenshot-locales.sh), ou un exemple plus complexe dans [take-screenshots.js](https://github.com/wsj-br/transrewrt/blob/main/scripts/take-screenshots.js) du dépôt [projet Transrewrt](https://github.com/wsj-br/transrewrt).

> **Remarque :** Les quatre sous-sections ci-dessous partagent le même remplacement de segment de locale `regexAdjustments` (`screenshots/[^/]+/` → `screenshots/${translatedLocale}/`). Seule la structure de sortie et l'ordre d'exécution du réécritureur de liens plats diffèrent — rendez-vous à la sous-section correspondant à votre `markdownOutput.style`.

<a id="config--markdownoutputstyle--flat"></a>
### Configuration - `markdownOutput.style = "flat"`

Le réécritureur de liens plats s'exécute en premier lorsque `markdownOutput.style = "flat"` et ajoute un préfixe de profondeur aux URL non markdown. Pour un `README.md` à la racine du dépôt avec `outputDir: "translated-docs/"`, il ajoute `../` :

```
images/screenshots/en-GB/translate.png  →  ../images/screenshots/en-GB/translate.png
```

La règle `regexAdjustments` remplace ensuite le segment de locale dans l'URL déjà préfixée :

<details>
<summary>Exemple de regexAdjustments pour une disposition plate</summary>

```json
"markdownOutput": {
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

</details>

Résultat : `../images/screenshots/de/translate.png` — chemin relatif correct depuis `translated-docs/README.de.md` jusqu'à la racine du dépôt.

L'étape `postProcessing` s'exécute après le réécritureur de liens plats. Écrivez les motifs `search` pour qu'ils correspondent au segment de locale n'importe où dans l'URL déjà préfixée — inutile d'inclure le préfixe `../` dans le motif.

Exemple d'implémentation (production) : [Transrewrt](https://github.com/wsj-br/transrewrt) — URL des captures d'écran dans [README.md](https://github.com/wsj-br/transrewrt/blob/main/README.md) (`images/screenshots/en-GB/…`), réécriture de la locale dans [ai-i18n-tools.config.json](https://github.com/wsj-br/transrewrt/blob/main/ai-i18n-tools.config.json), script de capture [take-screenshots.js](https://github.com/wsj-br/transrewrt/blob/main/scripts/take-screenshots.js) (voir le [contrat du script de capture d'écran](#screenshot-script-contract) ci-dessus).

Exemple d'implémentation (configuration de démonstration) : [examples/nextjs-app](../../docs/../examples/nextjs-app/) — deuxième bloc `documentations[]` dans [ai-i18n-tools.config.json](../../docs/../examples/nextjs-app/ai-i18n-tools.config.json) (`images/screenshots/[^/]+/` → `${translatedLocale}`) ; script d'assistance [screenshot-locales.sh](../../docs/../examples/nextjs-app/scripts/screenshot-locales.sh).

<a id="config--markdownoutputstyle--doc-system"></a>
### Config - `markdownOutput.style = "doc-system"`

Modèle générique B pour tout site de documentation qui référence des captures d'écran via un préfixe d'URL statique partagé. Le réécritureur d'URL plat n'est pas exécuté ; `postProcessing` réécrit le segment de la locale dans l'URL markdown d'origine.

<details>
<summary>Exemple de regexAdjustments pour une disposition de système de documentation</summary>

```json
"markdownOutput": {
  "style": "doc-system",
  "docsRoot": "docs",
  "localeSubpath": "your-generator/locale/content/path",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders in static assets",
        "search": "screenshots/[^/]+/",
        "replace": "screenshots/${translatedLocale}/"
      }
    ]
  }
}
```

</details>

Définissez `localeSubpath` pour qu'il corresponde à la structure de votre générateur entre `{locale}/` et le fichier traduit, ou utilisez un alias prédéfini (`"docusaurus"`, `"astro-starlight"`) à la place de `"doc-system"` lorsque les valeurs par défaut conviennent. Le markdown source intègre généralement la locale source dans l'URL :

```markdown
![Screenshot](../../docs//img/screenshots/en-GB/screenshot.png)
```

Fournissez des fichiers PNG correspondants au même chemin pour chaque locale cible (par exemple `static/img/screenshots/de/screenshot.png`). Préférez `screenshots/[^/]+/` plutôt que de coder en dur `screenshots/en-GB/` afin que la règle reste valide en cas de changement de `sourceLocale`.

<a id="preset--markdownoutputstyle--docusaurus"></a>
### Préréglage - `markdownOutput.style = "docusaurus"`

Identique à `"doc-system"` avec `localeSubpath = "docusaurus-plugin-content-docs/current"` par défaut. Le réécritureur d'URL plat n'est pas exécuté. `postProcessing` voit l'URL markdown d'origine. Les pages en anglais utilisent généralement un chemin absolu incluant la locale source :

```markdown
![Screenshot](../../docs//img/screenshots/en-GB/screenshot.png)
```

<details>
<summary>Exemple de regexAdjustments pour le préréglage Docusaurus</summary>

```json
"markdownOutput": {
  "style": "docusaurus",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders in docs-site static assets",
        "search": "screenshots/[^/]+/",
        "replace": "screenshots/${translatedLocale}/"
      }
    ]
  }
}
```

</details>

Fournissez les fichiers PNG correspondants dans `docs-site/static/img/screenshots/<locale>/screenshot.png`. Pour les configurations indépendantes de la locale source, préférez `screenshots/[^/]+/` à `screenshots/en-GB/`.

Exemple d'implémentation : [examples/nextjs-app/docs-site/docs/feature-showcase.md](../../docs/../examples/nextjs-app/docs-site/docs/feature-showcase.md) (`/img/screenshots/en-GB/screenshot.png`) avec le premier bloc `documentations[]` dans [ai-i18n-tools.config.json](../../docs/../examples/nextjs-app/ai-i18n-tools.config.json).

<a id="preset--markdownoutputstyle--astro-starlight"></a>
### Préréglage - `markdownOutput.style = "astro-starlight"`

Identique à `"doc-system"` avec `localeSubpath: ""` — les pages traduites se situent directement sous `{outputDir}/{locale}/`. Même principe de modèle B que la configuration générique de site de documentation ci-dessus. Le markdown source utilise `/img/screenshots/en-GB/screenshot.png` :

<details>
<summary>Exemple de regexAdjustments pour le préréglage Astro Starlight</summary>

```json
"markdownOutput": {
  "style": "astro-starlight",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders in public assets",
        "search": "screenshots/[^/]+/",
        "replace": "screenshots/${translatedLocale}/"
      }
    ]
  }
}
```

</details>

Fournissez les PNG dans `public/img/screenshots/<locale>/screenshot.png`.

Exemple d'implémentation : [examples/astro-docs](../../docs/../examples/astro-docs/) — [feature-showcase.mdx](../../docs/../examples/astro-docs/src/content/docs/feature-showcase.mdx) et [ai-i18n-tools.config.json](../../docs/../examples/astro-docs/ai-i18n-tools.config.json) (`screenshots/[^/]+/`).

---

<a id="pattern-c--colocated-raster-doc-system"></a>
## Modèle C - Raster colocalisé (`doc-system`)

À utiliser lorsqu'un site `doc-system` colocalise les ressources spécifiques à la locale à côté du markdown traduit — aucune réécriture d'URL n'est nécessaire. Le préréglage Docusaurus (`markdownOutput.style = "docusaurus"`) est l'implémentation de référence ; d'autres générateurs utilisant `"doc-system"` avec un `localeSubpath` personnalisé suivent la même logique : les ressources en anglais se trouvent dans un chemin de locale source, les ressources traduites se trouvent sous `{outputDir}/{locale}/[localeSubpath/]assets/`.

<a id="directory-layout-1"></a>
### Structure de répertoire

<details>
<summary>Exemple d'arborescence de répertoire d'éléments multimédias colocalisés (Docusaurus)</summary>

```
documentation/
├── static/
│   └── assets/
│       ├── screen-dashboard.png   ← en-GB screenshots (source locale)
│       └── screen-toolbar.png
├── docs/
│   └── assets → ../static/assets  ← symlink; webpack follows it
└── i18n/
    ├── de/
    │   └── docusaurus-plugin-content-docs/current/assets/
    │       ├── screen-dashboard.png   ← de screenshots
    │       └── screen-toolbar.png
    └── fr/
        └── docusaurus-plugin-content-docs/current/assets/
            ├── screen-dashboard.png
            └── screen-toolbar.png
```

</details>

Tous les documents dans chaque locale utilisent le même chemin relatif :

```markdown
![Dashboard](../../docs/../assets/screen-dashboard.png)
```

Pour la locale anglaise (`en-GB`), `../assets/` est résolu via le lien symbolique vers `static/assets/`. Pour les locales traduites, cela pointe directement vers le répertoire `current/assets/` propre à la locale.

<a id="screenshot-script-contract-1"></a>
### Contrat du script de capture d'écran

Le script doit écrire les fichiers PNG dans le répertoire correct pour chaque langue. La fonction `getScreenshotDir` encode la répartition :

```js
function getScreenshotDir(locale) {
  if (locale === 'en-GB') return 'documentation/static/assets';
  return `documentation/i18n/${locale}/docusaurus-plugin-content-docs/current/assets`;
}
```

Voir l'implémentation en production dans [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/main/scripts/take-screenshots.ts) depuis le dépôt [duplistatus](https://github.com/wsj-br/duplistatus) (copie de référence locale : [references/duplistatus/scripts/take-screenshots.ts](../../docs/../references/duplistatus/scripts/take-screenshots.ts)).

<a id="config"></a>
### Configuration

Aucune règle `regexAdjustments` n'est nécessaire pour les fichiers matriciels. `translate-docs` traduit le texte alternatif dans le markdown, mais l'URL reste inchangée :

```json
{
  "markdownOutput": {
    "style": "docusaurus",
    "docsRoot": "documentation/docs"
  }
}
```

Si le projet utilise également des SVG traduits, le modèle E les gère et ils sont placés aux côtés des PNG dans `current/assets/` sans expression régulière supplémentaire.

<a id="prerequisites"></a>
### Prérequis

- Le lien symbolique `docs/assets` doit exister : `ln -s ../static/assets documentation/docs/assets`
- Webpack de Docusaurus suit les liens symboliques par défaut (`resolve.symlinks` a pour valeur par défaut `true` dans les builds Docusaurus)
- Le lien symbolique doit uniquement exister pour la langue source — les builds traduits ne l'utilisent pas

<a id="implementation-example-1"></a>
### Exemple d'implémentation

[duplistatus](https://github.com/wsj-br/duplistatus) — `getScreenshotDir(locale)` dans [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/main/scripts/take-screenshots.ts) ; la documentation anglaise fait référence à des PNG colocalisés (par exemple [dashboard.md](../../docs/../references/duplistatus/documentation/docs/user-guide/dashboard.md) avec `../assets/screen-dashboard-summary.png`) ; aucun `regexAdjustments` de PNG dans [ai-i18n-tools.config.json](../../docs/../references/duplistatus/ai-i18n-tools.config.json). Les SVG du modèle E issus du même projet sont placés dans les mêmes répertoires `current/assets/` (voir ci-dessous).

---

<a id="pattern-d--translated-svg-with-svgstyle--flat"></a>
## Modèle D - SVG traduit avec `svg.style = "flat"`

À utiliser lorsqu'une application web intègre des illustrations ou diagrammes SVG spécifiques à une langue et y fait référence par code de langue au moment de l'exécution.

<a id="config-1"></a>
### Configuration

```json
"features": {
  "translateSVG": true
},
"svg": {
  "sourcePath": "images",
  "outputDir": "public/assets",
  "style": "flat"
}
```

`translate-svg` lit chaque `.svg` situé sous `images/` et écrit un fichier par langue :

```
public/assets/
├── dashboard.en-GB.svg
├── dashboard.de.svg
├── dashboard.fr.svg
└── dashboard.es.svg
```

<a id="app-reference"></a>
### Référence dans l'application

```tsx
<img src={`/assets/dashboard.${locale}.svg`} alt="Dashboard diagram" />
```

<a id="source-layout-recommendation"></a>
### Recommandation d'organisation des sources

Gardez les SVG sources séparés du répertoire de sortie. Avec `sourcePath: "images"` et `outputDir: "public/assets"`, les deux répertoires sont distincts. Ne jamais définir les deux comme étant le même répertoire.

<a id="implementation-example-2"></a>
### Exemple d'implémentation

[examples/nextjs-app](../../docs/../examples/nextjs-app/) — bloc `svg` dans [ai-i18n-tools.config.json](../../docs/../examples/nextjs-app/ai-i18n-tools.config.json) (`sourcePath: "images"`, `outputDir: "public/assets"`, `svg.style = "flat"`) ; source [translation_demo_svg.svg](../../docs/../examples/nextjs-app/images/translation_demo_svg.svg) ; fichiers générés par langue sous [public/assets/](../../docs/../examples/nextjs-app/public/assets/) (par exemple `translation_demo_svg.de.svg`) ; URL au moment de l'exécution dans [page.tsx](../../docs/../examples/nextjs-app/src/app/page.tsx) (`/assets/translation_demo_svg.${locale}.svg`).

---

<a id="pattern-e--colocated-translated-svg-doc-system"></a>
## Modèle E - SVG traduits colocalisés (système de documentation)

À utiliser pour les sites de documentation où les illustrations SVG traduites doivent apparaître aux côtés des documents traduits dans le répertoire de contenu de chaque langue — au même emplacement que les captures d'écran matricielles du modèle C. Le preset Docusaurus en est l'exemple principal.

<a id="config-2"></a>
### Configuration

```json
"features": {
  "translateSVG": true
},
"svg": {
  "sourcePath": [
    "documentation/static/assets/diagram.svg"
  ],
  "outputDir": "documentation/i18n",
  "style": "nested",
  "pathTemplate": "{outputDir}/{locale}/docusaurus-plugin-content-docs/current/assets/{basename}",
  "forceLowercase": true
}
```

`translate-svg` écrit un SVG par langue dans le même répertoire `current/assets/` que celui que Pattern C utilise pour les PNG :

```
documentation/i18n/de/docusaurus-plugin-content-docs/current/assets/diagram.svg
documentation/i18n/fr/docusaurus-plugin-content-docs/current/assets/diagram.svg
```

<a id="source-markdown"></a>
### Markdown source

Tous les documents dans toutes les langues utilisent le même chemin relatif :

```markdown
![Diagram](../../docs/../assets/diagram.svg)
```

Pour la langue anglaise, le lien symbolique `docs/assets → ../static/assets` résout cela. Pour les langues traduites, il pointe directement vers `current/assets/`.

Aucune règle `regexAdjustments` n'est nécessaire car les documents sources en anglais et les documents traduits en sortie utilisent des chemins identiques.

<a id="svg-source-location"></a>
### Emplacement source des SVG

Recommandé : stocker les SVG sources dans `documentation/static/assets/`, aux côtés des PNG en-GB. Cela regroupe tous les éléments multimédias de la documentation au même endroit, et le même lien symbolique `docs/assets` couvre les deux types. Les entrées `svg.sourcePath` pointent ensuite vers `documentation/static/assets/name.svg`.

<a id="pathtemplate-placeholders"></a>
### Espaces réservés `pathTemplate`

| Espace réservé             | Valeur                                                  |
|--------------------------|--------------------------------------------------------|
| `{outputDir}`            | Chemin absolu résolu de `svg.outputDir`              |
| `{locale}`               | Code de la langue cible                                     |
| `{LOCALE}`               | Code de langue en majuscules                                 |
| `{relPath}`              | Chemin relatif depuis la racine `sourcePath` vers le SVG source |
| `{stem}`                 | Nom de fichier sans extension                             |
| `{basename}`             | Nom de fichier avec extension                                |
| `{extension}`            | Extension incluant le point                                |
| `{relativeToSourceRoot}` | Chemin relatif depuis la racine `sourcePath` la plus proche       |

Référence complète dans le [tableau de configuration SVG](GETTING_STARTED.fr.md#svg).

<a id="implementation-example-3"></a>
### Exemple d'implémentation

[duplistatus](https://github.com/wsj-br/duplistatus) — bloc `svg` imbriqué avec `pathTemplate` dans [ai-i18n-tools.config.json](../../docs/../references/duplistatus/ai-i18n-tools.config.json) ; les SVG sources sont listés sous `documentation/static/img/` (par exemple [duplistatus_toolbar.svg](../../docs/../references/duplistatus/documentation/static/img/duplistatus_toolbar.svg)) ; `translate-svg` écrit des fichiers par langue dans `documentation/i18n/<locale>/…/current/assets/`, à côté des PNG de Pattern C ; les documents les intègrent aujourd'hui via `/img/duplistatus_*.svg` (par exemple [overview.md](../../docs/../references/duplistatus/documentation/docs/user-guide/overview.md)). Voir [task-locale-assets-simplification.md](../../docs/../references/duplistatus/dev/task-locale-assets-simplification.md) pour le passage prévu aux chemins `../assets/` et la suppression du pont SVG `regexAdjustments`.

---

<a id="the-flat-link-rewriter-and-two-step-flow"></a>
## Le réécritureur de liens plats et le flux en deux étapes

Pour `markdownOutput.style = "flat"` (et sauf si `rewriteRelativeLinks: false` ou un `pathTemplate` personnalisé est défini), un réécritureur intégré s'exécute avant `postProcessing`. Il gère les liens inter-documents (en ajoutant des suffixes de langue) et préfixe les URL des ressources non markdown avec un préfixe de profondeur.

<a id="two-step-flow-when-markdownoutputstyle--flat"></a>
### Flux en deux étapes avec `markdownOutput.style = "flat"`

```
source URL  →  [flat link rewriter: depth prefix]  →  [postProcessing: locale segment]  →  output URL
```

Exemple avec `outputDir: "translated-docs/"` et une source `README.md` située à la racine du dépôt :

1. Réécritureur de liens plats : `images/screenshots/en-GB/foo.png` → `../images/screenshots/en-GB/foo.png` (un `../` pour `translated-docs/`)
2. Expression régulière `postProcessing` `images/screenshots/[^/]+/` → `images/screenshots/${translatedLocale}/` : `../images/screenshots/de/foo.png`

Pour `markdownOutput.style = "doc-system"` (y compris `"docusaurus"`, `"astro-starlight"` et `"nested"`), le réécritureur de liens plats n'est pas exécuté. `postProcessing` reçoit l'URL d'origine du markdown traduit (généralement un chemin absolu comme `/img/screenshots/en-GB/foo.png`).

<a id="per-file-depth-prefix-with-flatpreserverelativedir"></a>
### Préfixe de profondeur par fichier avec `flatPreserveRelativeDir`

Le préfixe de profondeur est calculé pour chaque fichier de sortie — pas globalement pour l'ensemble du traitement. Pour chaque fichier source, le réécritureur calcule le chemin relatif depuis le répertoire du fichier de sortie vers le répertoire du fichier source, et utilise ce chemin comme préfixe.

Cela signifie qu'avec `flatPreserveRelativeDir: true`, les fichiers sources situés dans des sous-répertoires obtiennent automatiquement le bon préfixe. Par exemple, `docs/GETTING_STARTED.md` est exporté vers `translated-docs/docs/GETTING_STARTED.<locale>.md`. Le préfixe par fichier est `../../docs/`, donc une ressource `translation-dashboard.png` (relative au fichier source) devient `../../docs/translation-dashboard.png` — ce qui permet une résolution correcte depuis `translated-docs/docs/` vers `docs/translation-dashboard.png`.

Aucune correction par expression régulière `postProcessing` n'est nécessaire pour les ressources en chemin relatif placées aux côtés des fichiers sources.

<a id="rewriterelativelinks-and-linkrewritedocsroot"></a>
### `rewriteRelativeLinks` et `linkRewriteDocsRoot`

| Option                                   | Effet                                                                                                           |
|------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| `markdownOutput.rewriteRelativeLinks`    | Active ou désactive explicitement le réécritureur de liens plats (remplace la valeur par défaut quand `markdownOutput.style = "flat"`) |
| `markdownOutput.linkRewriteDocsRoot`     | Répertoire racine à partir duquel `depthPrefix` est calculé (par défaut `"."`)                                                        |
| `markdownOutput.flatPreserveRelativeDir` | Affecte la structure des chemins de sortie, que le réécritureur utilise lors du calcul des chemins cibles pour les fichiers traduits connus       |

---

<a id="troubleshooting"></a>
<a id="common-mistakes-and-troubleshooting"></a>
<a id="common-mistakes"></a>
## Erreurs fréquentes et dépannage

**Absence de répertoire de langue dans les chemins de captures d'écran**
`images/screenshots/screenshot.png` — impossible de distinguer les variantes linguistiques et donc de réécrire les chemins. Restructurer en `images/screenshots/<locale>/screenshot.png` avant d'appliquer le modèle B.

**Langue source en dur dans les expressions régulières**
`"search": "screenshots/en-GB/"` — échoue silencieusement si `sourceLocale` change. Utiliser plutôt `"search": "screenshots/[^/]+/"`.

**Fichiers SVG sources et fichiers générés dans le même répertoire**
Si `svg.sourcePath` et `svg.outputDir` se chevauchent, les fichiers générés se mélangent avec les sources modifiées manuellement. Conserver des répertoires séparés.

**URLs statiques Docusaurus absolues pour des SVGs colocalisés**
`/img/diagram.svg` (depuis `static/img/`) nécessite une règle `regexAdjustments` pour réécrire vers `../assets/` dans la sortie traduite. Placer les SVGs sources dans `static/assets/` et utiliser dès le départ des chemins relatifs `../assets/diagram.svg` pour éviter entièrement ce problème.

**Lien symbolique `docs/assets` manquant dans Docusaurus**
Sans le lien symbolique, les documents sources dans `docs/user-guide/` ne peuvent pas faire référence aux PNG ou SVG dans `static/assets/` via un chemin relatif. Configurer le lien symbolique dès la création du projet : `ln -s ../static/assets documentation/docs/assets`.

**`take-screenshots` capture uniquement les fichiers du lieu source**
Le modèle B nécessite des fichiers PNG pour chaque lieu. Si le script ne capture que `en-GB`, les documents traduits auront des chemins réécrits pointant vers des fichiers manquants.
