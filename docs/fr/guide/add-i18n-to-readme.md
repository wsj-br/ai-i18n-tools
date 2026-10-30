<a id="add-i18n-to-your-readme-and-markdown-docs"></a>
# Ajouter l'i18n à votre README et à vos documents Markdown

Cette page s'adresse aux dépôts sur GitHub, GitLab, Bitbucket ou tout autre hébergeur dont les lecteurs commencent par le fichier `README.md` et quelques autres fichiers Markdown. Il n'y a pas de framework de site de documentation à configurer. Le projet habituel comprend également une application ou une CLI, et le README doit utiliser les mêmes langues et les mêmes termes produit que cette application. Un dépôt de bibliothèque ou de documentation uniquement, sans chaînes d'interface utilisateur, est l'autre cas, abordé ci-dessous.

L'outil laisse `README.md` en place et écrit un fichier de locale par langue, par exemple `translated-docs/README.de.md`. Une ligne de langues à l'intérieur du README relie ces fichiers entre eux.

<a id="install-and-choose-a-provider"></a>
## Dans quelle configuration vous trouvez-vous ?

| Vous avez | Modèle | Alors |
| --- | --- | --- |
| Une application JS/TS plus un README | `ai-i18n-tools init -P openrouter` (`ui-markdown`, par défaut) | [Ajouter l'i18n à une application JS/TS](/fr/guide/add-i18n-to-js) pour `t()`, et cette page pour le README |
| Une application Python plus un README | `ai-i18n-tools init -t ui-python -P openrouter --with-readme` | [Ajouter l'i18n à une application Python](/fr/guide/add-i18n-to-python) pour l'application, et cette page pour le README |
| Tout autre modèle, plus un README | ajoutez `--with-readme` à cette commande `init` | Cette page pour le bloc README |
| README et Markdown uniquement | `ai-i18n-tools init -t docs-markdown -P openrouter` | Cette page |

`--with-readme` est sans effet sur `ui-markdown` et `docs-markdown`, car ces modèles incluent déjà le bloc README.

<a id="initialise-the-project"></a>
## Ce que vous obtenez

- `README.md` reste le fichier source. Les hébergeurs continuent de l'afficher comme page d'accueil du dépôt.
- Chaque locale cible est un fichier pair tel que `translated-docs/README.de.md`.
- La ligne de langues dans le fichier source et dans chaque traduction liste toutes les locales, avec des liens fonctionnels depuis le fichier que le lecteur consulte.

Ajoutez `CONTRIBUTING.md`, `CHANGELOG.md` ou un dossier `docs/` au même bloc lorsque ces fichiers doivent également être traduits. Voir [Plus que le README](#step-3-more-than-the-readme).

<a id="run-the-agent-prompt"></a>
## Installer

Installer la CLI ([Installation](/fr/guide/installation)) et définir la clé API pour votre fournisseur ([Fournisseur et clé API](/fr/guide/quick-start#provider-and-api-key)). Ollama n'a pas besoin de clé.

Un dépôt avec un `package.json` installe le paquet en tant que dépendance de développement. Un dépôt sans projet Node.js peut exécuter `npx ai-i18n-tools`, ou utiliser l'[exécutable autonome](/fr/guide/installation#standalone-executables).

<a id="review-the-result"></a>
## Génération

Application JS/TS et README (une seule commande ; `ui-markdown` est le modèle par défaut) :

```bash
ai-i18n-tools init -P openrouter
```

Python, Astro, HTML simple, VitePress, Docusaurus ou un autre modèle, avec le même bloc README ajouté :

```bash
ai-i18n-tools init -t ui-python -P openrouter --with-readme
```

Fichiers README et Markdown uniquement :

```bash
ai-i18n-tools init -t docs-markdown -P openrouter
```

`init` écrit uniquement `ai-i18n-tools.config.json`. Il ne modifie pas `README.md`. Lorsque la configuration inclut un bloc README, il affiche la ligne de marqueur à coller et avertit si `README.md` est manquant. Une configuration existante est laissée telle quelle : ajoutez le bloc manuellement, comme dans [Ajouter le bloc à une configuration existante](#add-the-block-to-a-config-you-already-have).

<a id="choose-models-and-translate"></a>
## Configurer

Quatre clés sont importantes :

- `sourceLocale` : la langue dans laquelle le README est rédigé. Toute langue est valide. L'anglais est un exemple courant dans ce guide.
- `targetLocales` : les langues à ajouter.
- `features.translateDocs` : doit être vrai. Une configuration hybride définit également `features.translateUIStrings`.
- `docs[].contentPaths` : les fichiers et dossiers Markdown à traduire. Le squelette liste `README.md`.

<details>
<summary>Hybride : chaînes d'interface utilisateur et README</summary>

`ui-markdown` écrit cette forme. `ui` est le catalogue d'applications. L'entrée `docs` est le README.

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "fr", "es", "pt-BR"],
  "features": {
    "translateUIStrings": true,
    "translateDocs": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "src/locales/strings.json",
    "flatOutputDir": "src/locales/"
  },
  "docs": [
    {
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "docsOutput": {
        "style": "flat",
        "flatPreserveRelativeDir": true,
        "linkRewriteDocsRoot": ".",
        "postProcessing": {
          "languageListBlock": {
            "start": "<small id=\"lang-list\">",
            "end": "</small>",
            "separator": " · "
          }
        }
      }
    }
  ]
}
```

</details>

<details>
<summary>README et Markdown uniquement</summary>

`docs-markdown` désactive les chaînes d'interface utilisateur et conserve le même bloc README.

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "fr", "es", "pt-BR"],
  "features": {
    "translateUIStrings": false,
    "translateDocs": true
  },
  "docs": [
    {
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "docsOutput": {
        "style": "flat",
        "flatPreserveRelativeDir": true,
        "linkRewriteDocsRoot": "."
      }
    }
  ]
}
```

Les paramètres de la liste de langues sont les mêmes que dans l'exemple hybride. Ils sont omis ici uniquement pour raccourcir l'extrait. `init -t docs-markdown` les écrit.

</details>

<a id="check-one-language"></a>
### Ajouter le bloc à une configuration existante

Ajoutez l'objet `docs` de l'exemple hybride et définissez `features.translateDocs` sur `true`. Si la configuration contient déjà un tableau `docs` (un site VitePress ou Docusaurus, par exemple), ajoutez l'objet README comme deuxième entrée. `sync` exécute chaque bloc. [examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app) fait ceci : un bloc pour le site de documentation, un bloc plat pour `README.md`.

<a id="keep-it-translated"></a>
## Ajouter la liste des langues

Placez cette ligne dans `README.md`, là où les lecteurs devraient voir les autres langues. Une courte étiquette sur la ligne au-dessus est une prose normale et sera traduite.

```markdown
**Read in other languages:**

<small id="lang-list"></small>
```

La ligne peut être vide. `translate-docs` remplace tout, du marqueur d'ouverture au marqueur de fermeture, par un lien par locale. Les marqueurs à l'intérieur des blocs de code clôturés sont ignorés, de sorte qu'un exemple de configuration dans le même fichier ne correspond pas. Détails : [Sélecteur de langue](/fr/guide/documents/language-switcher).

<a id="hybrid-tips"></a>
## Traduire

```bash
ai-i18n-tools sync
ai-i18n-tools status
```

`sync` exécute les étapes activées dans l'ordre : `extract` et `translate-ui` lorsque les chaînes d'interface utilisateur sont activées, puis `translate-docs`. Un cache est partagé, de sorte qu'une phrase déjà traduite pour l'application est réutilisée lorsqu'elle apparaît dans le README. Les catalogues d'interface utilisateur sont également transmis à la traduction de documents comme suggestions de glossaire (`ui[].uiGlossary`, activé par défaut), ce qui maintient la cohérence des noms de boutons et de fonctionnalités. Voir [Glossaire](/fr/guide/glossary).

Les noms de langues dans la ligne proviennent de `ui-languages.json`, que `extract` écrit à côté du catalogue d'interface utilisateur. Une configuration README uniquement n'a pas de catalogue d'interface utilisateur, donc la ligne utilise la liste de langues fournie à la place. Les étiquettes sont toujours les noms natifs. Exécutez `generate-ui-languages` uniquement si vous souhaitez un manifeste de projet qui vous est propre.

Commitez `translated-docs/` et ouvrez le README traduit sur l'hôte. Les liens relatifs entre le README source et `translated-docs/README.de.md` sont réécrits pour chaque fichier.

<a id="say-that-the-translation-is-automatic"></a>
## Conseils hybrides

- Traduisez le README dans moins de langues que l'application avec `docs[].targetLocales`. Voir [Moins de locales pour les documents](/fr/guide/combining-pipelines#fewer-locales-for-documents).
- Placez les termes du produit dans `glossary.userGlossary`. Le même CSV est utilisé pour les chaînes d'interface utilisateur et pour le README.
- Exécutez un seul côté avec `ai-i18n-tools sync --no-docs` ou `ai-i18n-tools sync --no-ui`.

<a id="do-it-by-hand"></a>
## Plus que le README

Ajoutez des chemins à `contentPaths`. `flatPreserveRelativeDir` conserve les dossiers, de sorte que `docs/guide.md` devient `translated-docs/docs/guide.de.md` au lieu d'entrer en collision avec un autre `guide.md`.

```json
"contentPaths": ["README.md", "CONTRIBUTING.md", "docs/"]
```

Un fichier `.translate-ignore` ignore les chemins que vous ne souhaitez pas traduire. `init --with-translate-ignore` écrit un fichier de démarrage. Les blocs de code, les URL et les ancres de titre ne sont pas traduits. Voir [Dispositions de sortie](/fr/guide/documents/output-layouts), [Liens d'ancrage](/fr/guide/documents/anchor-links) et [Réécriture de liens](/fr/guide/documents/link-rewriting).

Captures d'écran qui varient selon la langue : [Images et captures d'écran](/fr/guide/images-and-screenshots/).

<a id="step-1-configure-the-docs-block"></a>
## Liens sur l'hôte

Les liens vers d'autres fichiers du dépôt sont réécrits pour pointer vers le fichier de la locale. Un lien vers un site de documentation publié ne l'est pas. Ce dépôt préfixe les URL de ses sites de documentation avec la locale en utilisant `regexAdjustments` :

```json
"regexAdjustments": [
  {
    "search": "https://wsj-br\\.github\\.io/ai-i18n-tools/",
    "replace": "https://wsj-br.github.io/ai-i18n-tools/${translatedLocale}/"
  }
]
```

Le réécriveur de liens plat s'exécute en premier, puis ces remplacements. Voir [Réécriture de liens](/fr/guide/documents/link-rewriting).

<a id="add-the-block-to-a-config-you-already-have"></a>
## Maintenir la traduction

Réexécutez `sync` après la modification du fichier README source ou des chaînes de l'application. Le cache n'envoie au modèle que le texte nouveau ou modifié. Commitez les fichiers mis à jour sous `translated-docs/`.

Le workflow ci-dessous est un exemple, pas une action publiée. Il installe la CLI et exécute `sync` lorsque `README.md` change. Stockez la clé du fournisseur en tant que secret de dépôt. Examinez le diff de `translated-docs/` et commitez-le, ou poussez-le sur une branche et ouvrez une pull request.

```yaml
name: Translate README
on:
  push:
    paths:
      - "README.md"
      - "ai-i18n-tools.config.json"
  workflow_dispatch:
jobs:
  translate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
      - run: npm install --save-dev ai-i18n-tools
      - run: npx ai-i18n-tools sync
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
```

Utilisez la variable d'environnement pour le fournisseur que vous avez configuré. Ollama ne s'applique pas sur un runner hébergé à moins que vous ne l'y installiez.

<a id="step-2-add-the-language-list"></a>
## Indiquer que la traduction est automatique

Les traductions par IA peuvent être erronées. Une courte note au bas du fichier README, comme celle du [README de ce dépôt](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md), informe les lecteurs que les autres langues ont été traduites automatiquement et doivent être vérifiées avant de s'y fier.

<a id="step-3-more-than-the-readme"></a>
## Ce n'est pas votre cas ?

| Vous avez | Lisez |
| --- | --- |
| Chaînes d'interface utilisateur d'application et aucun README à traduire | [Ajouter l'i18n à une application JS/TS](/fr/guide/add-i18n-to-js) ou [Ajouter l'i18n à une application Python](/fr/guide/add-i18n-to-python) |
| Un site VitePress, Docusaurus, Starlight, Nextra, Fumadocs ou Astro | [Ajouter l'i18n à un site web ou de documentation](/fr/guide/add-i18n-to-website). Ajoutez `--with-readme` lorsque le fichier README du dépôt doit également être traduit |
| Un fichier HTML par locale | [Pages HTML](/fr/guide/documents/html-pages) |
| La référence complète de `translate-docs` | [Documents](/fr/guide/documents/) |

<a id="step-4-links-on-the-host"></a>
## Exemples

| Projet | Ce qu'il montre |
| --- | --- |
| [console-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app) | Une petite application Node plus un bloc README plat |
| [nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app) | Chaînes d'interface utilisateur, un site de documentation et un bloc README plat séparé |
| Ce dépôt | [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/ai-i18n-tools.config.json) : bloc README plat, puis le site VitePress |

<a id="not-your-case"></a>
## Invite de l'agent

Copiez ceci dans Cursor ou un autre agent de codage. Il prépare le dépôt. Il ne traduit pas le README.

````markdown
# Prepare README and Markdown translation

## Context

ai-i18n-tools translates Markdown listed in `docs[]` and writes one file per locale. The source README stays in place. Flat output for a README looks like `translated-docs/README.de.md`. Guide: https://wsj-br.github.io/ai-i18n-tools/guide/add-i18n-to-readme

## Scope

Edit `ai-i18n-tools.config.json` and the source Markdown files that should grow a language list. Do not edit anything under `translated-docs/` or other generated locale trees.

## Config

- If there is no config, run `ai-i18n-tools init -P <provider>` for a JS/TS app (this template already includes the README block), `ai-i18n-tools init -t docs-markdown -P <provider>` for Markdown only, or `ai-i18n-tools init -t <template> -P <provider> --with-readme` for any other template.
- If a config exists, set `features.translateDocs` to true and append one `docs` entry: `contentPaths` includes `README.md`, `outputDir` is `translated-docs`, `addFrontmatter` is false, `docsOutput.style` is `flat`, `flatPreserveRelativeDir` is true, and `postProcessing.languageListBlock` uses start `<small id="lang-list">`, end `</small>`, separator ` · `.
- Do not add a second block when one already lists `README.md`.
- Add other source files the user named (`CONTRIBUTING.md`, `docs/`) to that block's `contentPaths`.

## README

Add this line where the language row should appear, if it is not already there:

```markdown
<small id="lang-list"></small>
```

Do not fill in the links yourself. `translate-docs` replaces the marker range.

## Do not

- Do not translate, rewrite, or shorten the source README.
- Do not hand-edit `translated-docs/` or locale JSON.
- Do not run a translation yourself.

## Verify

`ai-i18n-tools.config.json` parses, `features.translateDocs` is true, and exactly one docs block lists `README.md`.

## Report back

List files changed and any Markdown file you left out of `contentPaths`, with a one-line reason.
````
