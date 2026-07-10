<a id="language-switcher-languagelistblock"></a>
# Sélecteur de langue (`languageListBlock`)

Utilisez `docsOutput.postProcessing.languageListBlock` lorsque les fichiers Markdown traduits doivent inclure une ligne de liens **« Lire dans d’autres langues »** — un lien par paramètre régional, avec des valeurs `href` calculées par rapport à chaque fichier de sortie.

Ce référentiel l’utilise pour [README.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md) (sortie à plat sous `translated-docs/`). Après `translate-docs`, chaque copie traduite reçoit un bloc actualisé ; par exemple, [translated-docs/README.de.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/translated-docs/README.de.md) renvoie aux fichiers de paramètres régionaux frères sous `translated-docs/` et à la source anglaise à la racine du référentiel.

Nécessite `docsOutput.style = "flat"` (ou une autre disposition où les fichiers de paramètres régionaux frères sont accessibles par chemin relatif). Voir [Dispositions de sortie](/guide/documents/output-layouts).

<a id="1-mark-the-block-in-source-markdown"></a>
## 1. Marquer le bloc dans le Markdown source

Encadrez le sélecteur dans du code HTML (ou toute autre ligne) délimité par les marqueurs de sous-chaîne `start` et `end`. Ce dépôt utilise :

```markdown
<small>**Read in other languages:** </small>
<small id="lang-list">[English (GB)](/) · [Deutsch](./README.de.md) · …</small>
```

Le texte du lien initial est uniquement un espace réservé. `translate-docs` remplace entièrement la portion depuis la première ligne contenant `start` jusqu’à la première ligne ultérieure contenant `end` (les marqueurs situés à l’intérieur de blocs de code délimités sont ignorés, afin que les exemples de configuration dans le même fichier ne soient pas pris en compte).

<a id="2-configure-the-block"></a>
## 2. Configurer le bloc

`start` et `end` sont des marqueurs de sous-chaîne arbitraires — ils n’ont pas besoin d’être `<small id="lang-list">` / `</small>`. Choisissez n’importe quel texte d’ouverture et de fermeture qui n’apparaît que dans la section du sélecteur de langue : une autre balise HTML (`<div class="lang-switcher">` … `</div>`), des commentaires HTML (`<!-- lang-list -->` … `<!-- /lang-list -->`), ou des délimiteurs en markdown uniquement (par exemple une ligne `**Languages:**` jusqu’à une ligne `---`). Définissez `start` et `end` dans la configuration exactement comme indiqué dans le fichier source.

Configuration racine ([ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/ai-i18n-tools.config.json)) :

```json
"postProcessing": {
  "languageListBlock": {
    "start": "<small id=\"lang-list\">",
    "end": "</small>",
    "separator": " · "
  }
}
```

| Champ       | Rôle                                                                                                     |
|-------------|----------------------------------------------------------------------------------------------------------|
| `start`     | Sous-chaîne qui identifie la ligne d’ouverture du bloc                                                  |
| `end`       | Sous-chaîne sur la ligne de fermeture (peut être la même ligne que `start` si les deux sont sur une seule ligne)             |
| `separator` | Texte inséré entre les liens `[label](href)` générés (ce dépôt utilise `" · "`)                                    |
| `label`     | Facultatif : `"local"` (par défaut) utilise l’endonyme de chaque langue provenant du manifeste ; `"english"` utilise `englishName` |

<a id="3-what-happens-at-runtime"></a>
## 3. Ce qui se passe à l’exécution

1. **Extraction** — la section contenant la liste des langues **n’est pas** envoyée au modèle (`translatable: false`).
2. **Par fichier traduit** — après la traduction des segments et la réécriture éventuelle des liens plats, `postProcessing` reconstruit le bloc : un lien markdown par langue, avec des libellés provenant de `ui-languages.json` s’ils sont présents (sinon du catalogue maître intégré, sinon de `localeDisplayNames`), et des chemins relatifs au fichier en cours d’écriture.
3. **Actualisation de la source** — à la fin d’un passage `translate-docs` / `sync` pour la documentation, le même bloc canonique est réinséré dans les **fichiers sources anglais** de `contentPaths`, de sorte qu’ajouter une langue met à jour le sélecteur dans le dépôt sans avoir à modifier manuellement chaque lien.

Si un fichier ne contient aucun bloc correspondant, l’interface en ligne de commande affiche un avertissement (quand `--verbose`) et laisse le contenu inchangé.

<a id="4-label-manifest"></a>
## 4. Manifeste d’étiquettes

Pour les libellés d'endonyme (`label: "local"`), générer ou maintenir `ui-languages.json` via `generate-ui-languages` (écrit dans [`languagesManifestPath`](/reference/configuration#languagesmanifestpath-optional), qui par défaut est `{ui.flatOutputDir}/ui-languages.json`). La configuration docs-only de ce référentiel n'a pas de pipeline d'interface utilisateur et pas de manifeste de projet sur disque, les libellés proviennent donc du catalogue maître regroupé pour `sourceLocale` + `targetLocales`.

<a id="5-examples-in-this-repository"></a>
## 5. Exemples dans ce référentiel

| Exemple | Fichiers |
|---|---|
| Ce package (README plat + site VitePress) | [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/ai-i18n-tools.config.json) (bloc README : `docsOutput.style = "flat"` ; bloc site : `docsOutput.style = "vitepress"` + `vitepressThemeCatalog`) |
| README à plat + documents Docusaurus | [examples/nextjs-app/ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/ai-i18n-tools.config.json) (deuxième bloc : `docsOutput.style = "flat"` ; premier bloc : `docsOutput.style = "docusaurus"`) |
| Docs VitePress (démo minimale) | [examples/vitepress-docs/ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/ai-i18n-tools.config.json) (`docsOutput.style = "vitepress"` + `vitepressThemeCatalog`) |

La ligne immédiatement avant `<small id="lang-list">` (par exemple `**Read in other languages:**`) est un segment normal traduisible et est localisée dans chaque langue cible ; seule la ligne de liens à l'intérieur des marqueurs est régénérée à l'identique, à l'exception de `href` et des libellés pilotés par le manifeste.
