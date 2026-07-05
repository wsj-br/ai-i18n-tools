<a id="colocated-translated-svg-doc-system"></a>
# SVG traduit colocalisé (système de documentation)

Utilisez pour les sites de systèmes de documentation où les illustrations SVG traduites doivent apparaître aux côtés de la documentation traduite dans le répertoire de contenu de chaque localisation — au même emplacement que les [captures d'écran colocatées](/guide/images-and-screenshots/colocated-screenshots). Le preset Docusaurus est l'exemple principal.

<a id="config"></a>
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

`translate-svg` écrit un SVG par localisation dans le même répertoire `current/assets/` que les captures d'écran colocatées utilisent pour les PNG :

```
documentation/i18n/de/docusaurus-plugin-content-docs/current/assets/diagram.svg
documentation/i18n/fr/docusaurus-plugin-content-docs/current/assets/diagram.svg
```

<a id="source-markdown"></a>
### Markdown source

Tous les documents dans toutes les langues utilisent le même chemin relatif :

```markdown
![Diagram](../assets/diagram.svg)
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

Référence complète dans le [tableau de configuration svg](/reference/configuration#svg).

<a id="implementation-example"></a>
### Exemple de mise en œuvre

[duplistatus](https://github.com/wsj-br/duplistatus) — bloc `svg` imbriqué avec `pathTemplate` dans [ai-i18n-tools.config.json](https://github.com/wsj-br/duplistatus/blob/master/ai-i18n-tools.config.json) ; les SVG sources sont répertoriés sous `documentation/static/img/` (par exemple [duplistatus_toolbar.svg](https://github.com/wsj-br/duplistatus/blob/master/documentation/static/img/duplistatus_toolbar.svg)) ; `translate-svg` écrit les fichiers par localisation dans `documentation/i18n/<locale>/…/current/assets/` à côté des PNG colocatées ; les documents les intègrent actuellement via `/img/duplistatus_*.svg` (par exemple [overview.md](https://github.com/wsj-br/duplistatus/blob/master/documentation/docs/user-guide/overview.md)). Voir [task-locale-assets-simplification.md](https://github.com/wsj-br/duplistatus/blob/master/dev/task-locale-assets-simplification.md) pour le déplacement planifié vers les chemins `../assets/` et la suppression du pont SVG `regexAdjustments`.

---

<a id="the-flat-link-rewriter-and-two-step-flow"></a>
