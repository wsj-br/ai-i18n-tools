<a id="html-pages"></a>
# Pages HTML

Utilisez le pipeline Documents lorsqu'un site statique nécessite un fichier `.html` ou `.htm` traduit par locale. `translate-docs` traduit la page source, réécrit ses liens relatifs et écrit les copies de locale sous `outputDir`. Aucun environnement d'exécution i18n de navigateur ni marqueur `data-i18n*` n'est requis.

Utilisez plutôt les [applications HTML simples](/fr/guide/ui-strings/plain-html) lorsqu'un seul fichier HTML reste en place et qu'un script de navigateur échange des chaînes à partir de JSON plat à la volée. Ne placez pas le même fichier dans les deux pipelines ; l'interface CLI émet un avertissement lorsqu'un fichier HTML est à la fois une source `docs[]` et une source de catalogue `ui.sourceRoots`.

Le site exécutable [`examples/plain-html-docs`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html-docs) sert l'anglais sur le port 3092 et écrit le portugais dans `site/pt-BR/`.

<a id="quick-start"></a>
## Démarrage rapide

Générez une configuration fonctionnelle :

```bash
ai-i18n-tools init -t docs-plain-html [-P <provider>]
```

Ou ajoutez cette partie HTML à un `ai-i18n-tools.config.json` qui possède déjà un [fournisseur](/fr/guide/providers-and-models) LLM :

```json
{
  "sourceLocale": "en",
  "targetLocales": ["pt-BR"],
  "features": {
    "translateDocs": true,
    "translateUIStrings": false
  },
  "docs": [
    {
      "description": "Static HTML pages",
      "contentPaths": ["site/"],
      "outputDir": "site",
      "addFrontmatter": false,
      "docsOutput": {
        "style": "nested",
        "docsRoot": "site",
        "localizedAssets": {
          "include": ["img/**"],
          "pattern": "{stem}-{locale}{ext}",
          "onlyIfExists": true
        },
        "html": {
          "languageList": {
            "format": "links",
            "label": "local"
          },
          "hreflang": {
            "siteUrl": "https://example.com",
            "xDefault": "en",
            "stripIndexHtml": true
          }
        }
      }
    }
  ]
}
```

`docsRoot` doit être l'arborescence source à l'intérieur de `contentPaths`. Elle est supprimée avant l'insertion du répertoire de locale. Avec la configuration ci-dessus :

```text
site/index.html       → site/pt-BR/index.html
site/about.html       → site/pt-BR/about.html
```

Ajoutez éventuellement les [marqueurs language-list et hreflang](#language-list-and-hreflang) à chaque page source, puis exécutez :

```bash
ai-i18n-tools translate-docs
# Or run every enabled pipeline:
ai-i18n-tools sync
```

La commande actualise également le contenu des marqueurs dans les fichiers de la langue source. Considérez les fichiers de locale sous `outputDir` comme une sortie générée ; modifiez les pages source et exécutez à nouveau la commande.

<a id="what-is-translated"></a>
## Ce qui est traduit

L'extracteur HTML traduit :

- le texte visible contenant des lettres, y compris `<title>` et le texte autour du balisage en ligne
- les valeurs des attributs `alt`, `title`, `aria-label` et `placeholder`
- `value` sur `<input type="submit">` et `<input type="button">`
- `content` sur `meta name="description"`, `meta property="og:title"` et `meta property="og:description"`

Les éléments en ligne tels que `<a>`, `<em>`, `<strong>`, `<span>`, `<img>` et `<br>` sont préservés tandis que la phrase environnante est traduite. Les éléments en ligne de type code tels que `<code>` et `<kbd>` sont conservés intacts :

```html
<p>Run <code>pnpm build</code> before deployment.</p>
```

Les sous-arborescences entières `script`, `style`, `textarea`, `pre` et `code` sont copiées sans modification. Les autres attributs, y compris `class`, `id`, `src`, `href` et les métadonnées contenant des URL, ne sont pas envoyés au modèle.

Sur chaque copie de locale, le pipeline définit `<html lang="…">` et la `dir` de la locale (`ltr` ou `rtl`). La page source conserve ses `lang` et `dir` d'origine. Utilisez du HTML en UTF-8 ; l'interface CLI émet un avertissement lorsqu'un `<meta charset>` déclare un autre encodage.

<a id="output-layout"></a>
## Disposition de la sortie

Pour la disposition habituelle d'un site statique, définissez :

```json
{
  "outputDir": "site",
  "docsOutput": {
    "style": "nested",
    "docsRoot": "site"
  }
}
```

`style: "nested"` écrit `{outputDir}/{locale}/{path relative to docsRoot}`. `style: "flat"` écrit des fichiers suffixés par la locale tels que `site/about.pt-BR.html`. Consultez [Dispositions de sortie](/fr/guide/documents/output-layouts) pour tous les styles et modèles de chemin personnalisés.

Les répertoires de locale générés et les noms de fichiers de locale plats sous `outputDir` sont exclus de la découverte future des sources. Cela empêche `site/pt-BR/index.html` ou `site/index.pt-BR.html` d'être traduits à nouveau.

<a id="links-and-images"></a>
## Liens et images

Les liens relatifs se terminant par `.html` ou `.htm` sont réécrits lorsque leur cible est une autre page source dans le même bloc `docs[]`. Les chaînes de requête et les fragments sont préservés. Par exemple, `href="about.html#history"` dans `site/index.html` devient `href="./about.html#history"` dans `site/pt-BR/index.html`.

Les autres URL relatives `href`, `src`, `srcset` et `poster` sont préfixées par la profondeur afin que les fichiers partagés soient toujours résolus à partir de la page de locale. Les URL absolues, les URL relatives au protocole, les URL `data:` et les liens uniquement composés de fragments restent inchangés. Les URL relatives à la racine restent relatives à la racine.

`docsOutput.localizedAssets` peut sélectionner un nom de fichier d'image ou d'icône spécifique à la locale :

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

`img/trulli.jpg` devient `img/trulli-pt-BR.jpg`. Avec `onlyIfExists: true` (valeur par défaut), cette URL n'est utilisée que si le fichier localisé existe ; sinon, la ressource partagée d'origine est conservée. Définissez `onlyIfExists: false` uniquement lorsqu'une autre étape de build ou de CDN garantit ces fichiers.

`include` correspond aux chemins d'URL tels que `img/**`. Utilisez `assetRoot` pour définir le répertoire du système de fichiers par rapport auquel les candidats localisés — en particulier les URL relatives à la racine telles que `/img/trulli.jpg` — sont vérifiés.

Les mêmes règles de localisation s'appliquent à `srcset`, `poster`, `<source src>`, l'icône `<link href>`, et `og:image` / `twitter:image`. Le pipeline réécrit les références mais ne crée, ne traduit ni ne copie les fichiers de ressources. Les valeurs CSS `url()` ne sont pas réécrites.

<a id="language-list-and-hreflang"></a>
## Liste des langues et hreflang

Placez une paire de liste de langues là où la navigation visible doit apparaître, et une paire hreflang à l'intérieur de `<head>` :

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

À chaque exécution, le pipeline remplace uniquement le contenu entre chaque paire. Il met à jour chaque copie de locale et la page source, en maintenant les liens alternatifs réciproques. Les marqueurs à l'intérieur de `script`, `style`, `pre` et `code` sont ignorés. Avec `--verbose`, l'interface CLI émet un avertissement lorsqu'une paire configurée est manquante.

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

Les commentaires par défaut fonctionnent même lorsque `docsOutput.html` est omis. Définissez `languageList.start` / `end` ou `hreflang.start` / `end` uniquement lorsque la source utilise un texte de marqueur différent.

<a id="visible-language-navigation"></a>
### Navigation linguistique visible

- `format: "links"` écrit les éléments `<a>`. À l'intérieur d'un `<ul>`, `<ol>` ou `<nav>`, chaque lien est encapsulé dans `<li>` ; ailleurs, `separator` joint les liens.
- `format: "select"` écrit les lignes `<option>`. Placez les marqueurs à l'intérieur de votre propre `<select data-lang-select>`, copiez `node_modules/ai-i18n-tools/dist/html-runtime/lang-select.js` dans le site, et chargez ce script classique. Il navigue vers l'URL générée de l'option sélectionnée.
- `label` est `local` (endonyme), `english`, ou `both` (`English / endonym` lorsqu'ils diffèrent). Les libellés proviennent de `ui-languages.json` si disponible, puis de la liste des locales intégrée au package.

Un bloc de marqueurs utilise un seul format. Les liens générés incluent `lang`, `hreflang` et `aria-current` ; l'option générée pour la page actuelle possède `selected`.

<a id="search-engine-alternates"></a>
### Alternatives pour les moteurs de recherche

`hreflang.siteUrl` préfixe les URL alternatives. Définissez-le sur l'origine publique du site avant le déploiement. Lorsqu'il est omis, le pipeline écrit des liens alternatifs relatifs et journalise un avertissement.

`xDefault` a pour valeur par défaut `sourceLocale` ; il n'est émis que lorsque cette locale est configurée pour la page. `stripIndexHtml: true` transforme une alternative `index.html` en URL de répertoire.

Le bloc de marqueurs est requis : le pipeline n'injecte pas automatiquement de balises dans `<head>`. Il ne génère pas non plus de plan de site, d'URL canonique ou de `og:locale`, et ne redirige pas en fonction de la langue du navigateur.

Seules les locales source et cible configurées sont éligibles pour les blocs de langue. Lorsque `ui-languages.json` existe, ses lignes et leur ordre déterminent les locales éligibles qui apparaissent, alors maintenez le manifeste aligné avec la configuration. Si vous traduisez avec `--locale` pour générer uniquement un sous-ensemble, ne publiez pas avant que chaque sortie de locale liée n'existe.

<a id="second-run"></a>
## Deuxième exécution

Les traductions de phrases restent dans le cache. Le hachage de suivi des fichiers inclut également la liste des locales, le style de sortie, `docsOutput.html` et `localizedAssets`. L'ajout d'une locale ou la modification de ces options réécrit les blocs et liens générés même lorsque chaque phrase est déjà en cache. Un hachage correspondant et un fichier de sortie à jour permettent d'ignorer cette page de locale.

<a id="troubleshooting"></a>
## Dépannage

| Symptôme | Vérifications à effectuer |
| --- | --- |
| La sortie est `site/pt-BR/site/index.html` | Définissez `docsOutput.docsRoot` sur `"site"` afin que le préfixe source soit supprimé. |
| Le lien pointe toujours vers la page en anglais | Utilisez un lien `.html` / `.htm` relatif, et incluez la page cible dans le même bloc `docs[]`. |
| Le chemin de l'image est rompu depuis une page de locale | Conservez-le relatif pour que la réécriture de profondeur puisse s'appliquer ; rappelez-vous que le CSS `url()` n'est pas réécrit. |
| L'image localisée n'est pas sélectionnée | Vérifiez `localizedAssets.include`, le nom de fichier `pattern`, et si le candidat existe lorsque `onlyIfExists` est vrai. |
| La liste des langues est vide ou inchangée | Conservez les deux commentaires de marqueur dans le bon ordre et en dehors de `script`, `style`, `pre` et `code`. |
| Le menu déroulant ne permet pas de naviguer | Ajoutez `data-lang-select` à `<select>` et chargez `html-runtime/lang-select.js`. |
| Les URL hreflang utilisent le mauvais hôte | Définissez `hreflang.siteUrl` sur l'origine publique finale. |
| Une page traduite est traduite à nouveau | Conservez les fichiers de locale générés sous le `outputDir` configuré ; ne les ajoutez pas en tant que sources distinctes. |
