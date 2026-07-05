<a id="colocated-raster-doc-system"></a>
# Raster colocalisé (`doc-system`)

À utiliser lorsqu'un site `doc-system` place les ressources spécifiques à chaque paramètre régional à côté des fichiers markdown traduits — aucune réécriture d'URL n'est nécessaire. Le préréglage Docusaurus (`docsOutput.style = "docusaurus"`) constitue l'implémentation de référence ; d'autres générateurs utilisant `"doc-system"` avec un `localeSubpath` personnalisé suivent la même logique : les ressources anglaises se trouvent dans un chemin de paramètre régional source, les ressources traduites se trouvent sous `{outputDir}/{locale}/[localeSubpath/]assets/`.

<a id="directory-layout"></a>
### Organisation des répertoires

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
![Dashboard](../assets/screen-dashboard.png)
```

Pour la locale anglaise (`en-GB`), `../assets/` est résolu via le lien symbolique vers `static/assets/`. Pour les locales traduites, cela pointe directement vers le répertoire `current/assets/` propre à la locale.

<a id="screenshot-script-contract"></a>
### Contrat du script de captures d'écran

Le script doit écrire les fichiers PNG dans le répertoire correct pour chaque langue. La fonction `getScreenshotDir` encode la répartition :

```js
function getScreenshotDir(locale) {
  if (locale === 'en-GB') return 'documentation/static/assets';
  return `documentation/i18n/${locale}/docusaurus-plugin-content-docs/current/assets`;
}
```

Voir une implémentation réelle dans [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) du dépôt [duplistatus](https://github.com/wsj-br/duplistatus).

<a id="config"></a>
### Configuration

Aucune règle `regexAdjustments` n'est nécessaire pour les fichiers matriciels. `translate-docs` traduit le texte alternatif dans le markdown, mais l'URL reste inchangée :

```json
{
  "docsOutput": {
    "style": "docusaurus",
    "docsRoot": "documentation/docs"
  }
}
```

Si le projet utilise également des SVG traduits, la [traduction SVG colocalisée](/guide/svg-translation/translated-svg-colocated) les gère et ils atterrissent à côté des PNG dans `current/assets/` sans expression régulière supplémentaire.

<a id="prerequisites"></a>
### Prérequis

- Le lien symbolique `docs/assets` doit exister : `ln -s ../static/assets documentation/docs/assets`
- Webpack de Docusaurus suit les liens symboliques par défaut (`resolve.symlinks` a pour valeur par défaut `true` dans les builds Docusaurus)
- Le lien symbolique doit uniquement exister pour la langue source — les builds traduits ne l'utilisent pas

<a id="implementation-example"></a>
### Exemple de mise en œuvre

[duplistatus](https://github.com/wsj-br/duplistatus) — `getScreenshotDir(locale)` dans [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) ; la documentation anglaise fait référence aux PNG colocalisés (par exemple, [dashboard.md](https://github.com/wsj-br/duplistatus/blob/master/documentation/docs/user-guide/dashboard.md) avec `../assets/screen-dashboard-summary.png`). Les SVG colocalisés du même projet atterrissent dans les mêmes répertoires `current/assets/` — voir [SVG colocalisé](/guide/svg-translation/translated-svg-colocated).
