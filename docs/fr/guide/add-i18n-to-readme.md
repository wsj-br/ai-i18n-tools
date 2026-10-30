<a id="add-i18n-to-your-readme-and-markdown-docs"></a>
# Ajouter l'i18n à votre README et à vos documents Markdown

Cette page prend un dépôt sur GitHub, GitLab, Bitbucket ou tout autre hôte dont les lecteurs commencent par `README.md` et ajoute un fichier par langue. Il n’y a pas de framework de site de documentation à configurer. Le projet habituel a également une application ou une CLI, et le README doit utiliser les mêmes langues et les mêmes termes de produit que cette application. Un dépôt de bibliothèque ou de documentation uniquement, sans chaînes d’interface utilisateur, est l’autre cas, couvert ci-dessous.

<a id="what-you-get"></a>

L’outil laisse `README.md` en place. Les hôtes continuent de le rendre comme page d’accueil du dépôt. Chaque locale cible est un fichier frère tel que `translated-docs/README.de.md`. Une ligne de langue à l’intérieur du README relie ces fichiers entre eux, et la même ligne est écrite dans chaque traduction, avec des liens qui fonctionnent à partir du fichier que le lecteur consulte. `translate-docs` remplit cette ligne. Il remplace tout, du marqueur d’ouverture au marqueur de fermeture, par un lien par locale. Ajoutez `CONTRIBUTING.md`, `CHANGELOG.md` ou un dossier `docs/` au même bloc lorsque ces fichiers doivent également être traduits. Voir [Plus que le README](#step-3-more-than-the-readme).

Le moyen le plus rapide est de donner à un agent de codage l’invite de cette page. Il vérifie la configuration et ajoute le marqueur de liste de langues. Vous installez la CLI, choisissez le fournisseur et initialisez le projet vous-même, car cela nécessite votre clé API et vos choix. Vous exécutez également la traduction vous-même, car cela dépense de l’argent sur votre compte.

Un site VitePress, Docusaurus, Starlight, Nextra, Fumadocs ou Astro utilise [Ajouter l’i18n à un site web ou un site de documentation](/fr/guide/add-i18n-to-website). Ajoutez `--with-readme` lorsque le README du dépôt doit également être traduit. Vous ne savez pas lequel s’applique ? Voir [Pas votre cas ?](#not-your-case) à la fin.

Le flux :

1. [Installer la CLI et choisir un fournisseur](#install-and-choose-a-provider).
2. [Initialiser le projet](#initialise-the-project) avec `init`.
3. [Exécuter l'invite de l'agent](#run-the-agent-prompt).
4. [Examiner le résultat](#review-the-result).
5. [Choisir les modèles et traduire](#choose-models-and-translate), puis vérifier une langue.
6. [Maintenir la traduction](#keep-it-translated).

Vous préférez effectuer les modifications vous-même, ou vous voulez savoir ce que fait l'invite ? [Faites-le manuellement](#do-it-by-hand) parcourt les mêmes étapes une par une.

<a id="install-and-choose-a-provider"></a>
## Installer et choisir un fournisseur

Vous faites cette partie, pas l'agent. L'installateur modifie votre machine, et la clé API est un secret qui doit rester dans votre shell, pas dans une invite.

Un dépôt avec un `package.json` installe le package en tant que dépendance de développement. Autres options d’installation : [Installation](/fr/guide/installation).

```bash
pnpm add -D ai-i18n-tools
```

`npm install --save-dev ai-i18n-tools` et `yarn add --dev ai-i18n-tools` fonctionnent aussi.

Un dépôt sans projet Node.js peut utiliser l’exécutable autonome. Linux et macOS :

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell) :

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

L’installateur vérifie `SHA256SUMS.txt`, installe la commande en tant que `ai-i18n-tools` et l’ajoute à `PATH`. Les binaires ne sont ni notariés ni signés Authenticode. Étapes manuelles et noms d’actifs : [Exécutables autonomes](/fr/guide/installation#standalone-executables). `npx ai-i18n-tools` fonctionne également lorsque Node.js est installé et que vous ne voulez pas de dépendance de projet.

Vérifier l'installation :

```bash
ai-i18n-tools --version
```

Ensuite, choisissez un fournisseur et définissez sa clé API dans le shell qui exécutera la traduction. Par exemple, OpenRouter :

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Ollama n'a pas besoin de clé. Autres préréglages : [Fournisseurs intégrés](/fr/guide/providers-and-models#built-in-providers). Notez le nom du fournisseur, car vous le passerez à `init` à l'étape suivante. L'agent n'a jamais besoin de la clé : il exécute uniquement des commandes qui n'effectuent aucun appel de modèle. Vous utiliserez la clé plus tard, lorsque vous [traduirez](#choose-models-and-translate).

<a id="initialise-the-project"></a>
## Initialiser le projet

Vous exécutez ceci une fois, avant l’invite. Il écrit la configuration et utilise le fournisseur que vous avez choisi ci-dessus. Il ne modifie pas `README.md`. Lorsque la configuration inclut un bloc README, il imprime la ligne de marqueur à coller et avertit si `README.md` est manquant.

| Vous avez | Modèle | Alors |
| --- | --- | --- |
| Une application JS/TS plus un README | `ai-i18n-tools init -P openrouter` (`ui-markdown`, par défaut) | [Ajouter l'i18n à une application JS/TS](/fr/guide/add-i18n-to-js) pour `t()`, et cette page pour le README |
| Une application Python plus un README | `ai-i18n-tools init -t ui-python -P openrouter --with-readme` | [Ajouter l'i18n à une application Python](/fr/guide/add-i18n-to-python) pour l'application, et cette page pour le README |
| Tout autre modèle, plus un README | ajoutez `--with-readme` à cette commande `init` | Cette page pour le bloc README |
| README et Markdown uniquement | `ai-i18n-tools init -t docs-markdown -P openrouter` | Cette page |

`--with-readme` n'a aucun effet sur `ui-markdown` et `docs-markdown`, car ces modèles incluent déjà le bloc README.

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

Ensuite, modifiez `sourceLocale` et `targetLocales` dans `ai-i18n-tools.config.json`. `sourceLocale` est la langue dans laquelle le README est écrit. Toute langue BCP-47 est valide. `features.translateDocs` doit être vrai. Une configuration hybride définit également `features.translateUIStrings`. `docs[].contentPaths` liste les fichiers et dossiers Markdown à traduire. L’échafaudage liste `README.md`.

Exécutez `init` une fois. Il réécrit `ai-i18n-tools.config.json` à chaque fois, donc une deuxième exécution annule les modifications que vous avez apportées. Une configuration existante est laissée telle quelle si vous ignorez `init` : l’invite ajoute le bloc README, et [Étape 1](#step-1-configure-the-docs-block) montre la même modification à la main.

<a id="run-the-agent-prompt"></a>
## Exécuter l'invite de l'agent

Ouvrez le projet dans votre agent de codage (Cursor, Claude Code, Copilot ou similaire), démarrez une nouvelle conversation et collez l’invite ci-dessous. Le projet doit déjà être initialisé. Il n’y a rien à modifier. Si d’autres fichiers Markdown doivent être traduits, nommez-les dans le même message.

L’agent vérifie d’abord que la CLI et la configuration existent, et s’arrête avec des instructions si l’un d’eux est manquant. Ensuite, il fonctionne en deux parties :

- La partie 1 ajoute le bloc README plat lorsque la configuration ne liste pas déjà `README.md`.
- La partie 2 ajoute le marqueur de liste de langues au README source.

Il n’installe pas la CLI, n’initialise pas la configuration, ne lit pas votre clé API, ne remplit pas les liens linguistiques et ne traduit pas. La traduction est l’étape après la révision, et c’est vous qui l’exécutez.

````markdown
# Prepare README and Markdown translation

## Before you start

The user must already have installed ai-i18n-tools and initialised this
project. Check that `ai-i18n-tools --version` runs (or
`pnpm exec ai-i18n-tools --version` when the binary is only in
`node_modules/.bin`) and that
`ai-i18n-tools.config.json` exists. If either is missing, stop now and tell
the user which command to run, then run this prompt again:

- JS/TS app plus a README: `ai-i18n-tools init -P <provider>`
- README and Markdown only: `ai-i18n-tools init -t docs-markdown -P <provider>`
- Any other template: `ai-i18n-tools init -t <template> -P <provider> --with-readme`

Do not install or initialise anything yourself.

## Rules

- Do not read or search the ai-i18n-tools source. This prompt is complete.
- Never read, print, or write API keys, `.env` files, or the shell environment.
- Do not run `sync`, `translate-docs`, `translate-ui`, or `suggest-models`.
  They call the translation API and cost money. The user runs them after
  reviewing your work.
- Do not translate, rewrite, or shorten the source README or any other source
  Markdown. Do not edit anything under `translated-docs/` or other generated
  locale trees. Do not hand-edit locale JSON.
- Do not reformat unrelated files. Leave unrelated edits in a dirty tree alone.

## Part 1 — Config

Skip this part when one `docs` entry already lists `README.md`. Do not add a
second block for the same file.

Otherwise set `features.translateDocs` to true and append one `docs` entry:

- `contentPaths` includes `README.md`
- `outputDir` is `translated-docs`
- `addFrontmatter` is false
- `docsOutput.style` is `flat`
- `docsOutput.flatPreserveRelativeDir` is true
- `docsOutput.linkRewriteDocsRoot` is `.`
- `docsOutput.postProcessing.languageListBlock` uses start
  `<small id="lang-list">`, end `</small>`, separator ` · `

```json
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
```

Leave `features.translateUIStrings` as it is. Add other source files the user
named (`CONTRIBUTING.md`, `docs/`) to that block's `contentPaths`.

## Part 2 — Language list

In `README.md`, where readers should see the other languages, add this marker
if it is not already there. A short label on the line above it is normal
prose. Add that label only when the spot has no heading of its own.

```markdown
**Read in other languages:**

<small id="lang-list"></small>
```

Do not fill in the links yourself. `translate-docs` replaces the marker range.
Markers inside fenced code blocks are ignored, so a config sample in the same
file does not match. Do not put the real marker inside a fence.

## Verify and report

`ai-i18n-tools.config.json` parses, `features.translateDocs` is true, and
exactly one docs block lists `README.md`. The marker is in the source README
and not inside a fence. Nothing under `translated-docs/` changed.

Report the files changed and any Markdown file you left out of `contentPaths`,
with a one-line reason. Then list the commands for the user, and do not run
them: `ai-i18n-tools suggest-models` (optional), `ai-i18n-tools sync`.
````

<a id="review-the-result"></a>
## Réviser le résultat

L'agent termine avec un rapport. Vérifiez-le avant de traduire :

- Le diff. Il devrait s’agir de la configuration et du marqueur. Le texte source devrait être le même qu’avant. `git diff --stat` montre l’étendue des changements.
- Rien sous `translated-docs/` ou un autre arbre de locales généré n’a été modifié.
- `ai-i18n-tools.config.json` analyse, `features.translateDocs` est vrai, et exactement un bloc de documentation liste `README.md`.
- Le marqueur est dans `README.md` et non à l’intérieur d’un bloc de code clôturé. Un échantillon du marqueur à l’intérieur d’une clôture est acceptable. Le vrai est à l’extérieur.

<a id="choose-models-and-translate"></a>
## Choisir les modèles et traduire

C'est vous qui exécutez cette partie. Elle utilise votre clé API et dépense de l'argent sur votre compte.

La liste des modèles fournie par `init` constitue un point de départ. Classez les modèles de chat du fournisseur actif et, une fois la sélection finale validée, enregistrez-la dans `translationModels` :

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` ne remplace que `translationModels`. Le même classement se trouve dans l'onglet [Modèles](/fr/guide/translation-dashboard/models) de `ai-i18n-tools dashboard`.

Ensuite, traduisez :

```bash
ai-i18n-tools sync
ai-i18n-tools status
```

`sync` exécute les étapes activées dans l'ordre : `extract` et `translate-ui` lorsque les chaînes d'interface utilisateur sont activées, puis `translate-docs`. Un cache est partagé, de sorte qu'une phrase déjà traduite pour l'application est réutilisée lorsqu'elle apparaît dans le README. Les catalogues d'interface utilisateur sont également transmis à la traduction de documents comme suggestions de glossaire (`ui[].uiGlossary`, activé par défaut), ce qui maintient la cohérence des noms de boutons et de fonctionnalités. Voir [Glossaire](/fr/guide/glossary).

Les noms de langues dans la ligne proviennent de `ui-languages.json`, que `extract` écrit à côté du catalogue d'interface utilisateur. Une configuration README uniquement n'a pas de catalogue d'interface utilisateur, donc la ligne utilise la liste de langues fournie à la place. Les étiquettes sont toujours les noms natifs. Exécutez `generate-ui-languages` uniquement si vous souhaitez un manifeste de projet qui vous est propre.

Commitez `translated-docs/` et ouvrez le README traduit sur l'hôte. Les liens relatifs entre le README source et `translated-docs/README.de.md` sont réécrits pour chaque fichier.

<a id="check-one-language"></a>
### Vérifier une langue

Ouvrez `translated-docs/README.de.md` (ou le code cible que vous avez choisi) sur l'hôte et dans le fichier lui-même. La ligne de langue doit lister chaque locale, avec des liens fonctionnels depuis le fichier que vous consultez. Une phrase qui est toujours dans la langue source était à l'intérieur d'un bloc de code, d'une URL ou d'une ancre de titre, ou elle n'était pas dans `contentPaths`.

<a id="keep-it-translated"></a>
## Maintenir la traduction

Réexécutez `ai-i18n-tools sync` après la modification du fichier README source ou des chaînes de l'application. Le cache n'envoie au modèle que le texte nouveau ou modifié. Commitez les fichiers mis à jour sous `translated-docs/`. `ai-i18n-tools dashboard` ouvre le [Tableau de bord de traduction](/fr/guide/translation-dashboard/) pour réviser les traductions.

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

<a id="hybrid-tips"></a>
### Conseils hybrides

- Traduisez le README dans moins de langues que l'application avec `docs[].targetLocales`. Voir [Moins de locales pour les documents](/fr/guide/combining-pipelines#fewer-locales-for-documents).
- Placez les termes du produit dans `glossary.userGlossary`. Le même CSV est utilisé pour les chaînes d'interface utilisateur et pour le README.
- Exécutez un seul côté avec `ai-i18n-tools sync --no-docs` ou `ai-i18n-tools sync --no-ui`.

<a id="say-that-the-translation-is-automatic"></a>
### Indiquer que la traduction est automatique

Les traductions par IA peuvent être erronées. Une courte note au bas du fichier README, comme celle du [README de ce dépôt](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md), informe les lecteurs que les autres langues ont été traduites automatiquement et doivent être vérifiées avant de s'y fier.

<a id="do-it-by-hand"></a>
## Faire manuellement

Suivez ces étapes si vous préférez apporter les modifications vous-même, ou si vous voulez savoir ce que fait l'invite. Les deux premières correspondent aux parties de l'invite. Les deux dernières concernent les fichiers supplémentaires et les liens qui pointent vers un site publié. Vous devez toujours [installer la CLI](#install-and-choose-a-provider), [initialiser le projet](#initialise-the-project) et [traduire](#choose-models-and-translate) à la fin.

1. [Configurer le bloc de documentation](#step-1-configure-the-docs-block).
2. [Ajouter la liste des langues](#step-2-add-the-language-list).
3. [Plus que le README](#step-3-more-than-the-readme).
4. [Liens sur l'hôte](#step-4-links-on-the-host).

<a id="step-1-configure-the-docs-block"></a>
## Étape 1 : Configurer le bloc de documentation

Quatre clés sont importantes :

- `sourceLocale` : la langue dans laquelle le README est rédigé. Toute langue est valide. L'anglais est un exemple courant dans ce guide.
- `targetLocales` : les langues à ajouter.
- `features.translateDocs` : doit être vrai. Une configuration hybride définit également `features.translateUIStrings`.
- `docs[].contentPaths` : les fichiers et dossiers Markdown à traduire. Le squelette liste `README.md`.

Ignorez cette étape lorsque `init` a déjà écrit le bloc README. Utilisez-la lorsque vous modifiez une configuration existante.

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

<a id="add-the-block-to-a-config-you-already-have"></a>
### Ajouter le bloc à une configuration existante

Ajoutez l'objet `docs` de l'exemple hybride et définissez `features.translateDocs` sur `true`. Si la configuration contient déjà un tableau `docs` (un site VitePress ou Docusaurus, par exemple), ajoutez l'objet README comme deuxième entrée. `sync` exécute chaque bloc. [examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app) fait ceci : un bloc pour le site de documentation, un bloc plat pour `README.md`.

N'ajoutez pas un deuxième bloc lorsqu'un bloc liste déjà `README.md`.

<a id="step-2-add-the-language-list"></a>
## Étape 2 : Ajouter la liste des langues

Placez cette ligne dans `README.md`, là où les lecteurs devraient voir les autres langues. Une courte étiquette sur la ligne au-dessus est une prose normale et sera traduite.

```markdown
**Read in other languages:**

<small id="lang-list"></small>
```

La ligne peut être vide. `translate-docs` remplace tout, du marqueur d'ouverture au marqueur de fermeture, par un lien par locale. Les marqueurs à l'intérieur des blocs de code clôturés sont ignorés, de sorte qu'un exemple de configuration dans le même fichier ne correspond pas. Détails : [Sélecteur de langue](/fr/guide/documents/language-switcher).

<a id="step-3-more-than-the-readme"></a>
## Étape 3 : Plus que le README

Ajoutez des chemins à `contentPaths`. `flatPreserveRelativeDir` conserve les dossiers, de sorte que `docs/guide.md` devient `translated-docs/docs/guide.de.md` au lieu d'entrer en collision avec un autre `guide.md`.

```json
"contentPaths": ["README.md", "CONTRIBUTING.md", "docs/"]
```

Un fichier `.translate-ignore` ignore les chemins que vous ne souhaitez pas traduire. `init --with-translate-ignore` écrit un fichier de démarrage. Les blocs de code, les URL et les ancres de titre ne sont pas traduits. Voir [Dispositions de sortie](/fr/guide/documents/output-layouts), [Liens d'ancrage](/fr/guide/documents/anchor-links) et [Réécriture de liens](/fr/guide/documents/link-rewriting).

Captures d'écran qui varient selon la langue : [Images et captures d'écran](/fr/guide/images-and-screenshots/).

<a id="step-4-links-on-the-host"></a>
## Étape 4 : Liens sur l'hôte

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

C'est la dernière étape manuelle. Continuez à [Choisir les modèles et traduire](#choose-models-and-translate).

<a id="not-your-case"></a>
## Ce n'est pas votre cas ?

| Vous avez | Lisez |
| --- | --- |
| Chaînes d'interface utilisateur d'application et aucun README à traduire | [Ajouter l'i18n à une application JS/TS](/fr/guide/add-i18n-to-js) ou [Ajouter l'i18n à une application Python](/fr/guide/add-i18n-to-python) |
| Catalogues Django, Flask-Babel, ou une application qui utilise déjà GNU gettext | [Ajouter l'i18n à une application Django / Python gettext](/fr/guide/add-i18n-to-django-gettext) |
| Un site VitePress, Docusaurus, Starlight, Nextra, Fumadocs ou Astro | [Ajouter l'i18n à un site web ou de documentation](/fr/guide/add-i18n-to-website). Ajoutez `--with-readme` lorsque le fichier README du dépôt doit également être traduit |
| Un fichier HTML par locale | [Pages HTML](/fr/guide/documents/html-pages) |
| La référence complète de `translate-docs` | [Documents](/fr/guide/documents/) |

<a id="examples"></a>
## Exemples

| Projet | Ce qu'il montre |
| --- | --- |
| [console-app](/fr/examples#console-app) | Une petite application Node et un bloc README plat |
| [nextjs-app](/fr/examples#nextjs-app) | Chaînes d'interface utilisateur, un site de documentation et un bloc README plat séparé |
| Ce dépôt | [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/ai-i18n-tools.config.json) : bloc README plat, puis le site VitePress |
