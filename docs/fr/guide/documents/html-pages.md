<a id="html-pages"></a>
# Pages HTML

`translate-docs` peut générer un fichier HTML par locale. Placez les fichiers `.html` ou `.htm` sur une entrée `docs[]` `contentPaths` et exécutez `translate-docs` ou `sync`. Le fichier anglais reste la source. Les copies locales sont écrites sous `outputDir`.

Utilisez cette méthode lorsque chaque langue correspond à sa propre page (un site statique, un ensemble de documents HTML rédigés manuellement). Utilisez les [applications HTML simples](/fr/guide/ui-strings/plain-html) lorsqu'un seul fichier HTML reste en place et que le navigateur échange les chaînes à partir d'un JSON plat.

Générer la structure avec :

```bash
ai-i18n-tools init -t docs-plain-html [-P <provider>]
```

La démonstration exécutable est [`examples/plain-html-docs`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html-docs) (port 3092).

<a id="what-is-translated"></a>
## Ce qui est traduit

Traduit : le texte visible, `alt`, `title`, `aria-label`, `placeholder`, les `<title>`, `meta name="description"`, et `og:title` / `og:description`.

Laissé inchangé : les éléments `script`, `style`, `textarea`, `pre` et `code`, ainsi que les `src`, `href` et autres URL. Un paragraphe qui contient `<code>` ou `<em>` conserve ces balises et traduit les mots environnants.

`html lang` et `dir` sont définis sur le fichier de locale. La source anglaise conserve son propre `lang` jusqu'à ce que vous le modifiiez.

Les fichiers de locale générés sont ignorés lors de l'exécution suivante lorsqu'ils se trouvent sous `outputDir` (un répertoire `pt-BR/`, ou un `name.pt-BR.html` plat). Un avertissement est affiché lorsque le même fichier `.html` est également une source de catalogue d'interface utilisateur (`ui.sourceRoots`).

<a id="links-and-images"></a>
## Liens et images

Les liens vers d'autres pages HTML dans le même bloc `docs[]` sont réécrits vers la sortie de locale de cette page. Les autres URL relatives sont préfixées afin qu'elles soient toujours résolues à partir du fichier de locale.

`docsOutput.localizedAssets` renomme éventuellement les images et les icônes lorsqu'un fichier spécifique à la locale existe. Les `url()` CSS ne sont pas réécrits.

```json
"localizedAssets": {
  "include": ["img/**"],
  "pattern": "{stem}-{locale}{ext}",
  "onlyIfExists": true
}
```

| Espace réservé | Signification |
| --- | --- |
| `{stem}` | Nom de fichier sans l'extension |
| `{ext}` | Extension, y compris le point |
| `{basename}` | Nom de fichier avec l'extension |
| `{locale}` | Code de locale tel que configuré (`pt-BR`) |
| `{llocale}` | Locale en minuscules |
| `{LOCALE}` | Locale en majuscules |

`img/trulli.jpg` avec le modèle ci-dessus devient `img/trulli-pt-BR.jpg`. Avec `onlyIfExists: true` (la valeur par défaut), l'URL d'origine est conservée lorsque ce fichier est manquant. Les URL absolues, les URL `data:` et les fragments `#` sont ignorés. Les URL relatives à la racine (`/img/trulli.jpg`) sont testées sous `assetRoot`, ou sous le répertoire du fichier HTML lorsque `assetRoot` est omis.

`srcset`, `poster`, `<source src>`, les URL `<link>` d'icônes, et `og:image` / `twitter:image` utilisent les mêmes règles.

Pour le HTML, `docsOutput.docsRoot` est supprimé du chemin relatif au projet avant l'ajout du dossier de la locale. Avec `docsRoot: "site"` et `style: "nested"`, `site/index.html` est écrit dans `site/pt-BR/index.html`.

<a id="language-list-and-hreflang"></a>
## Liste des langues et hreflang

Deux paires de commentaires sont renseignées sur chaque copie de locale et sur la source en anglais (afin que les alternatives restent réciproques) :

```html
<nav>
  <ul>
    <!-- ai-i18n:lang-list -->
    <!-- /ai-i18n:lang-list -->
  </ul>
</nav>
<!-- ai-i18n:hreflang -->
<!-- /ai-i18n:hreflang -->
```

Les marqueurs à l'intérieur de `script`, `style`, `pre` et `code` sont ignorés. Une exécution en mode verbeux avertit lorsqu'une page n'a pas de paire. Les mêmes commentaires sont les valeurs par défaut lorsque `docsOutput.html` est omis.

```json
"html": {
  "languageList": {
    "format": "links",
    "label": "local",
    "separator": " · "
  },
  "hreflang": {
    "siteUrl": "https://example.com",
    "xDefault": "en",
    "stripIndexHtml": true
  }
}
```

`format: "links"` écrit les éléments `<a>`. À l'intérieur d'un `<ul>`, `<ol>` ou `<nav>`, chaque lien est encapsulé dans `<li>`. `format: "select"` écrit les lignes `<option>`. Placez les marqueurs à l'intérieur de votre propre `<select data-lang-select>` et chargez `lang-select.js` (fourni en tant que `ai-i18n-tools/html-runtime/lang-select.js`, et copié dans l'exemple). Un bloc utilise un seul format.

`label` est `local` (endonyme), `english`, ou `both` (`English / endonym` lorsqu'ils diffèrent). Les locales qui ne font pas partie de l'ensemble configuré sont omises.

`hreflang.siteUrl` préfixe les liens alternatifs. Lorsqu'il n'est pas défini, les liens sont relatifs et un avertissement est journalisé. `xDefault` a pour valeur par défaut `sourceLocale`. `stripIndexHtml` transforme `index.html` en URL de répertoire.

Il n'y a pas de fichier sitemap, pas d'injection automatique de `<head>`, et pas de réécriture de `canonical` ou `og:locale`. La langue du navigateur ne redirige pas le visiteur.

<a id="second-run"></a>
## Deuxième exécution

Les traductions de phrases restent dans le cache. Le hachage de suivi des fichiers inclut également la liste des locales et `docsOutput.html` / `localizedAssets`. L'ajout d'une locale réécrit la liste des langues et le bloc hreflang même lorsque chaque phrase est déjà en cache. Un hachage correspondant et un fichier de sortie à jour permettent de sauter la page.
