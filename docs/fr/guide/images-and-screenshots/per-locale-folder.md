<a id="per-locale-folder-url-rewriting"></a>
# Dossier par locale (réécriture d'URL)

À utiliser pour les fichiers README/GUIDE-UTILISATEUR avec `docsOutput.style = "flat"`, et pour les sites de systèmes de documentation (`docsOutput.style = "doc-system"` ou les alias `"docusaurus"` / `"astro-starlight"`) et pour les préréglages `"vitepress"` / autres systèmes de documentation qui servent des captures d'écran à partir d'une arborescence d'URL statique partagée. Détails de la réécriture de liens pour VitePress : [Réécriture de liens — VitePress](/fr/guide/images-and-screenshots/link-rewriting#vitepress-link-normalizer-style-vitepress).

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
![Translate tab](images/screenshots/en-GB/translate.png)
```

<a id="screenshot-script-contract"></a>
### Contrat du script de captures d'écran

Le script `take-screenshots` doit écrire des fichiers pour chaque locale, pas seulement pour la locale source. La commande `translate-docs` réécrit les chemins mais ne crée pas de fichiers. Un assistant typique :

```js
function getScreenshotDir(locale) {
  return `images/screenshots/${locale}`;
}
```

Voir un exemple simple de `bash` dans le [script de capture d'écran dans examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/scripts/screenshot-locales.sh), ou un exemple plus complexe dans [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) du projet [duplistatus](https://github.com/wsj-br/duplistatus) (également utilisé en production par [Transrewrt](https://github.com/wsj-br/transrewrt)).

> **Remarque :** Les quatre sous-sections ci-dessous partagent le même échange de segment de locale `regexAdjustments` (`screenshots/[^/]+/` → `screenshots/${translatedLocale}/`). Seuls la disposition de la sortie et le fait que le réécriveur de liens plat s'exécute en premier diffèrent — passez à la sous-section qui correspond à votre `docsOutput.style`.
>
> **Remarque :** `regexAdjustments` s'exécute sur le corps Markdown traduit complet, y compris les blocs de code clôturés. Si une page de documentation intègre un exemple de configuration qui contient un chemin correspondant (par exemple `screenshots/en-GB/`), cet extrait sera également réécrit dans la sortie traduite. Préférez la forme générique `screenshots/[^/]+/` dans les exemples réutilisables.

<a id="config---docsoutputstyle--flat"></a>
### Configuration - `docsOutput.style = "flat"`

Le réécritureur de liens plats s'exécute en premier lorsque `docsOutput.style = "flat"` et ajoute un préfixe de profondeur aux URL non markdown. Pour un `README.md` à la racine du dépôt avec `outputDir: "translated-docs/"`, il ajoute `../` :

```
images/screenshots/en-GB/translate.png  →  ../images/screenshots/en-GB/translate.png
```

La règle `regexAdjustments` remplace ensuite le segment de locale dans l'URL déjà préfixée :

<details>
<summary>Exemple de regexAdjustments pour une disposition plate</summary>

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

</details>

Résultat : `../images/screenshots/de/translate.png` — chemin relatif correct depuis `translated-docs/README.de.md` jusqu'à la racine du dépôt.

L'étape `postProcessing` s'exécute après le réécriveur de liens plats. Écrivez des expressions régulières `search` qui correspondent au segment de locale n'importe où dans l'URL déjà préfixée — pas besoin d'inclure le préfixe `../` dans l'expression régulière.

Exemple d'implémentation (production) : [Transrewrt](https://github.com/wsj-br/transrewrt) — URL de captures d'écran dans [README.md](https://github.com/wsj-br/transrewrt/blob/main/README.md) (`images/screenshots/en-GB/…`), réécriture de locale dans [ai-i18n-tools.config.json](https://github.com/wsj-br/transrewrt/blob/main/ai-i18n-tools.config.json), script de capture basé sur [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) de duplistatus (voir le [contrat de script de capture d'écran](#screenshot-script-contract) ci-dessus).

Exemple d'implémentation (configuration de démonstration) : [examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/) — deuxième bloc `docs[]` dans [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/ai-i18n-tools.config.json) (`images/screenshots/[^/]+/` → `${translatedLocale}`) ; script d'aide [screenshot-locales.sh](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/scripts/screenshot-locales.sh).

<a id="config---docsoutputstyle--doc-system"></a>
### Configuration - `docsOutput.style = "doc-system"`

Même approche de dossier par locale pour tout site de système de documentation qui référence des captures d'écran via un préfixe d'URL statique partagé. Le réécriveur de liens plats ne s'exécute pas ; `postProcessing` réécrit le segment de locale dans l'URL markdown d'origine.

<details>
<summary>Exemple de regexAdjustments pour une disposition de système de documentation</summary>

```json
"docsOutput": {
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
![Screenshot](/img/screenshots/en-GB/screenshot.png)
```

Fournissez des fichiers PNG correspondants au même chemin pour chaque locale cible (par exemple `static/img/screenshots/de/screenshot.png`). Préférez `screenshots/[^/]+/` plutôt que de coder en dur `screenshots/en-GB/` afin que la règle reste valide en cas de changement de `sourceLocale`.

<a id="preset---docsoutputstyle--docusaurus"></a>
### Préréglage - `docsOutput.style = "docusaurus"`

Identique à `"doc-system"` avec `localeSubpath = "docusaurus-plugin-content-docs/current"` par défaut. Le réécritureur d'URL plat n'est pas exécuté. `postProcessing` voit l'URL markdown d'origine. Les pages en anglais utilisent généralement un chemin absolu incluant la locale source :

```markdown
![Screenshot](/img/screenshots/en-GB/screenshot.png)
```

<details>
<summary>Exemple de regexAdjustments pour le préréglage Docusaurus</summary>

```json
"docsOutput": {
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

Exemple d'implémentation : [examples/docusaurus-docs/docs/feature-showcase.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/docusaurus-docs/docs/feature-showcase.md) (`/img/screenshots/en-GB/screenshot.png`) avec [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/docusaurus-docs/ai-i18n-tools.config.json).

<a id="preset---docsoutputstyle--astro-starlight"></a>
### Préréglage - `docsOutput.style = "astro-starlight"`

Identique à `"doc-system"` avec `localeSubpath: ""` — les pages traduites se trouvent directement sous `{outputDir}/{locale}/`. Même approche de dossier par locale que la configuration générique du système de documentation ci-dessus. Le markdown source utilise `/img/screenshots/en-GB/screenshot.png` :

<details>
<summary>Exemple de regexAdjustments pour le préréglage Astro Starlight</summary>

```json
"docsOutput": {
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

Expédiez les PNG à `public/img/screenshots/<locale>/screenshot.png`. L'espace réservé `${translatedLocale}` utilise votre chaîne de locale de configuration (par exemple `pt-BR`). Le préréglage `astro-starlight` met par défaut les **chemins de sortie** de la locale en minuscules (`pt-br/`), mais les dossiers d'actifs statiques sous `public/img/screenshots/` doivent correspondre au segment de locale écrit dans les URL Markdown — maintenez les répertoires de captures d'écran alignés avec `${translatedLocale}`, pas nécessairement avec la casse des routes Astro.

Exemple d'implémentation : [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs/) — [feature-showcase.mdx](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/astro-docs/src/content/docs/feature-showcase.mdx) et [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/astro-docs/ai-i18n-tools.config.json) (`screenshots/[^/]+/`).
