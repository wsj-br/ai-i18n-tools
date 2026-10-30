<a id="add-i18n-to-a-website-or-docs-site"></a>
# Ajouter l'i18n à un site web ou un site de documentation

Cette page prend un site de documentation (Markdown ou MDX) ou un site marketing ou statique (un site web Astro ou du HTML simple) qui a une seule langue et y ajoute des locales avec ai-i18n-tools. L'outil traduit le contenu des pages avec les modèles de votre fournisseur LLM et écrit une copie localisée par langue. Votre framework de site sert ces copies et fournit le sélecteur de langue.

Le moyen le plus rapide est de donner à un agent de codage l'invite de cette page. Il active l'i18n de ce framework et vérifie la configuration. Vous installez la CLI, choisissez le fournisseur et initialisez le projet vous-même, car cela nécessite votre clé API et vos choix. Vous exécutez également la traduction vous-même, car cela dépense de l'argent sur votre compte.

Pour une application dont les chaînes d'interface utilisateur se trouvent dans des appels `t()`, utilisez [Ajouter l'i18n à une application JS/TS](/fr/guide/add-i18n-to-js) ou [Ajouter l'i18n à une application Python](/fr/guide/add-i18n-to-python). Un fichier README de dépôt sans framework de site utilise [Ajouter l'i18n à votre README et à vos documents Markdown](/fr/guide/add-i18n-to-readme). Vous ne savez pas lequel s'applique ? Voir [Ce n'est pas votre cas ?](#not-your-case) à la fin.

<a id="steps"></a>

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

Installez le package en tant que dépendance de développement. La configuration de VitePress importe `prefixVitepressThemeConfigLinks` depuis `ai-i18n-tools`, et une page HTML simple copie `i18n.js` depuis le package. Un exécutable autonome est suffisant uniquement lorsque le site n'importe jamais `ai-i18n-tools/runtime` et n'importe jamais le package depuis sa configuration. Autres options d'installation : [Installation](/fr/guide/installation).

```bash
pnpm add -D ai-i18n-tools
```

`npm install --save-dev ai-i18n-tools` et `yarn add --dev ai-i18n-tools` fonctionnent aussi. Les exemples ci-dessous utilisent la commande `ai-i18n-tools` seule. Une installation locale nécessite `node_modules/.bin` sur `PATH`, ou `pnpm exec` devant chaque commande. Voir [Utilisation de la CLI](/fr/guide/installation#using-the-cli).

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

Vous exécutez ceci une fois, avant l'invite. Il écrit `ai-i18n-tools.config.json` et utilise le fournisseur que vous avez choisi ci-dessus. Il n'active pas l'i18n dans un site existant. C'est le rôle de l'invite.

| Votre site | Modèle d'initialisation | Guide pour les détails |
| --- | --- | --- |
| Astro Starlight | `ui-starlight` | [Astro](/fr/guide/integrations/astro) |
| Docusaurus | `ui-docusaurus` | [Docusaurus](/fr/guide/integrations/docusaurus) |
| VitePress | `ui-vitepress` | [VitePress](/fr/guide/integrations/vitepress) |
| Nextra 4 (Next.js App Router) | `ui-nextra` | [Nextra](/fr/guide/integrations/nextra) |
| Fumadocs 4 (Next.js App Router) | `ui-fumadocs` | [Fumadocs](/fr/guide/integrations/fumadocs) |
| Site web Astro simple | `ui-astro-website` | [Astro](/fr/guide/integrations/astro#plain-astro-marketing-and-app-sites) |
| Un fichier HTML qui change de langue dans le navigateur | `ui-plain-html` | [Applications HTML simples](/fr/guide/ui-strings/plain-html) |
| Un fichier HTML traduit par locale | `docs-plain-html` | [Pages HTML](/fr/guide/documents/html-pages) |
| Pas de framework de site, juste un README et des fichiers Markdown | `docs-markdown`, ou n'importe quel modèle plus `--with-readme` | [Ajouter l'i18n à votre README et à vos documents Markdown](/fr/guide/add-i18n-to-readme) |

```bash
ai-i18n-tools init -t ui-vitepress -P openrouter
```

Remplacez `ui-vitepress` par le modèle du tableau. Ensuite, modifiez `sourceLocale`, `targetLocales` et `docs[].contentPaths`. `sourceLocale` est la langue des pages. Toute langue BCP-47 est valide. `contentPaths` doit correspondre aux pages et aux dossiers écrits dans cette langue. Les chemins dans le modèle sont des points de départ. `docsOutput.style` est déjà défini pour le modèle. `ui-astro-website` et `ui-plain-html` écrivent un bloc `ui` et un tableau `docs` vide. L'invite ajoute un bloc `docs` HTML de page pour un site Astro simple lorsque vous traduisez le HTML de la page.

Exécutez `init` une seule fois. Il réécrit `ai-i18n-tools.config.json` à chaque fois, donc une deuxième exécution annule les modifications que vous avez apportées.

<a id="run-the-agent-prompt"></a>
## Exécuter l'invite de l'agent

Ouvrez le projet dans votre agent de codage (Cursor, Claude Code, Copilot, ou similaire), démarrez un nouveau chat et collez l'invite ci-dessous. Le projet doit déjà être initialisé. Il n'y a rien à modifier. Si vous souhaitez qu'un détail du framework soit omis, indiquez-le dans le même message.

L'agent vérifie d'abord que la CLI et la configuration existent, et s'arrête avec des instructions si l'un d'eux est manquant. Ensuite, il détecte le framework et active le routage de locale de ce framework. Il n'installe pas la CLI, n'initialise pas la configuration, ne lit pas votre clé API et ne traduit pas. La traduction est l'étape après la révision, et c'est vous qui l'exécutez.

````markdown
# Enable i18n on this website or docs site

## Before you start

The user must already have installed ai-i18n-tools and initialised this
project. Check that `ai-i18n-tools --version` runs (or
`pnpm exec ai-i18n-tools --version` when the binary is only in
`node_modules/.bin`) and that
`ai-i18n-tools.config.json` exists. If either is missing, stop now and tell
the user to install ai-i18n-tools as a dev dependency and run
`ai-i18n-tools init -t <template> -P <provider>`, then run this prompt again.
The template is `ui-vitepress`, `ui-docusaurus`, `ui-starlight`, `ui-nextra`,
`ui-fumadocs`, `ui-astro-website`, `ui-plain-html`, or `docs-plain-html`.
Do not install or initialise anything yourself.

`ui-plain-html` and `ui-astro-website` are valid when `docs` is empty. Every
other template needs one `docs` entry. If that entry is missing, stop and name
the init command.

## Rules

- Do not read or search the ai-i18n-tools source. This prompt is complete.
- Never read, print, or write API keys, `.env` files, or the shell environment.
- Do not run `sync`, `translate-docs`, `translate-ui`, or `suggest-models`.
  They call the translation API and cost money. The user runs them after
  reviewing your work.
- Do not translate, reword, or rename source pages, nav labels, or dictionary
  strings. Do not edit generated locale trees (`docs/<locale>/`,
  `i18n/<locale>/` other than the source catalog from `write-translations`,
  `theme.<locale>.json`, `content/<locale>/`, locale MDX, or locale HTML).
- Do not reformat unrelated code. Leave unrelated edits in a dirty tree alone.
- Apply one branch. If the framework is unclear, stop and ask.

Detect the branch from `docsOutput.style`, then from the config file and
`package.json`: `vitepress`, `docusaurus`, `nextra`, `fumadocs`,
`astro-starlight` with pages under `src/content/docs` (Starlight), `nested`
with HTML `contentPaths` (`docs-plain-html`), a `ui` block whose extractor
extensions include `.html` (`ui-plain-html`), or an Astro site that is not
Starlight (`ui-astro-website`).

Point `contentPaths` and `docsRoot` at the source-language pages that exist
in this repository. The paths written by `init` are starters.

## VitePress

- In `.vitepress/config`, set `locales.root` for the source locale (`label`,
  `lang`, and the existing `themeConfig`). Add one `locales[code]` per
  `targetLocales` entry: `label`, `lang`, `link: '/<code>/'`, and per-locale
  `title` / `description`. Keep `targetLocales` equal to those keys.
- Author nav and sidebar links once, without a locale prefix. Prefix `link`
  and `activeMatch` per locale with `prefixVitepressThemeConfigLinks` from
  `ai-i18n-tools`. `translate-docs` does not rewrite links inside the config.
- Leave `docsOutput.vitepressThemeCatalog` as `init` wrote it. If the config
  already loads `theme.en.json`, keep that loader and add `locales[code]` the
  same way. If theme strings are still inline, leave them inline. Do not
  create `theme.en.json` or `theme.<locale>.json` yourself, and do not load a
  theme file that is not on disk. The first `sync` bootstraps a missing
  catalog.
- `docsOutput.style` is `vitepress`. `outputDir` is the docs root.

## Docusaurus

- Add the `i18n` block in `docusaurus.config.js`: `defaultLocale`, `locales`
  (source plus each target), and `localeConfigs[locale].path` when the URL
  path differs from the locale code. The path must match the folder under
  `i18n/`.
- Point `docusaurusCatalogDir` at `i18n/<defaultLocale>`. `docsOutput.style`
  is `docusaurus`. `contentPaths` and `docsRoot` are the source docs folder.
  `outputDir` is the parent of the locale folders.
- Run this project's `docusaurus write-translations` so
  `i18n/<defaultLocale>/` exists. That command does not call a model. Do not
  run `sync` or `translate-docs`.
- Custom React in `src/pages` and `src/components` is not markdown. Mark
  user-facing copy with `<Translate>` or `translate()` from
  `@docusaurus/Translate`. The message has to be a static string. Do not wrap
  those calls in `t()`.

## Nextra

- Move source MDX to `content/<sourceLocale>/` (usually `content/en/`). The
  source locale is a folder, not the content root. Leave `_meta.ts` beside
  the pages it labels.
- Set `i18n.locales` and `defaultLocale` in `next.config`. `targetLocales`
  matches `i18n.locales` except the default locale.
- Add an `app/[lang]/` route, `getPageMap('/' + lang)`, and `<Layout i18n>`.
- Add `app/_dictionaries/<source>.ts` (usually `en.ts`) with the English
  shell strings as string literals (`siteTitle`, footer, `editLink`, search
  placeholder, table-of-contents title, last-updated label), and
  `get-dictionary.ts` that imports `./${locale}`. Pass those fields into
  `<Layout>`, `<Navbar>`, and `<Footer>`. Keep native language names in a
  labels map, untranslated.
- Config: `features.translateDocs`, `docsOutput.style` `nextra`, `docsRoot`
  `content/<sourceLocale>`, `nextraDictionaryPath` the source dictionary.
- Optional: `proxy.ts` that re-exports `nextra/locales`.
- Do not write `app/_dictionaries/pt-BR.ts`, `content/pt-BR/`, or any other
  locale tree.

## Fumadocs

- `defineI18n` in `lib/i18n.ts` with `languages`, `defaultLanguage`, and
  `parser: "dot"` or `"dir"`. Use `"dot"` unless the source pages already live
  under a locale folder. Set `docsOutput.fumadocsParser` to the same value.
- Add `app/[lang]/` routes. Export `createI18nMiddleware(i18n)` from
  `proxy.ts`.
- Dot: source MDX stays at the collection root (`content/docs/`). Dir: source
  MDX lives under `content/docs/<sourceLocale>/`. Point `contentPaths` and
  `docsRoot` at that source tree. `docsOutput.style` is `fumadocs`.
- `targetLocales` equals `languages` minus the default language, character
  for character.
- Leave English UI overrides as they are. Do not write `ui.<locale>.json` or
  translated MDX. Do not put this catalog in `json[]`.

## Astro Starlight

- In the Starlight config, set `locales`, including a `root` entry when the
  source language should be unprefixed (`label` and required `lang`). Set
  `defaultLocale: 'root'` when that root entry is the source language.
- Source pages stay in `src/content/docs/`. `translate-docs` writes
  `src/content/docs/<locale>/`. Point `contentPaths` at the source pages, not
  at locale folders. `outputDir` and `docsRoot` are `src/content/docs`.
  `docsOutput.style` is `astro-starlight`.
- Align `targetLocales` with the non-root locale keys. Starlight directory
  keys are often lowercase (`pt-br`). If you change case to match, say so in
  the report.
- Prefer sidebar `slug` entries so the label comes from the page title. Do
  not hand-translate sidebar `label` maps or `social[].label`. There is no
  shell catalog to add.

## Plain Astro

- Enable Astro i18n routing: `i18n.locales` includes the source locale and
  each target. Astro route codes are lowercase (`pt-br`). In the report, list
  `targetLocales`, `i18n.locales`, and the note that flat JSON filenames use
  the casing in `targetLocales`.
- `init -t ui-astro-website` leaves `docs` empty and turns on UI strings. When
  page HTML should be translated, set `features.translateDocs` to true and
  append one `docs` entry: `contentPaths` the source pages (for example
  `src/pages/index.astro`), `outputDir` `src/pages`, `addFrontmatter` false,
  `docsOutput.style` `astro-starlight`, `docsRoot` `src/pages`. Leave
  `features.translateUIStrings` as it is.
- If frontmatter or shared data calls `t()`, stop that part and tell the user
  to run the JS/TS prompt and skip i18next. Astro resolves `t` at build time.
  Do not wrap those calls here, and do not install i18next.

## Plain HTML

Each file belongs to only one pipeline. If the same file is both a `docs[]` source and
under `ui.sourceRoots`, stop and ask.

`ui-plain-html` (one page, language switches in the browser):

- Run `ai-i18n-tools mark-html` with no `--write`, read the report, then
  run it again with `--write`. It inserts `data-i18n` markers. It does not
  call a model.
- Copy `node_modules/ai-i18n-tools/dist/html-runtime/i18n.js` next to the page.
  Load it at the end of `<body>` with `data-source-locale` equal to
  `sourceLocale`, `data-locales-base` pointing at `flatOutputDir` as a URL
  relative to the script, and `data-locale-select` pointing at an empty
  `<select>`. Do not add a `docs` block for the same file.

`docs-plain-html` (one HTML file per locale):

- Confirm `contentPaths`, `outputDir`, and `docsRoot`. `docsOutput.style` is
  `nested`. Do not add `data-i18n` markers. Do not fill a language list by
  hand. `translate-docs` writes the locale files and the list.

## Verify and report

The framework's locale config matches `targetLocales`. `contentPaths` point
at source-language pages. No generated locale tree was edited. Run the
project's build or typecheck when it has one, and do not run a translation.

Report the branch you applied, the files changed, and any page you left out
of `contentPaths`, with a one-line reason. Then list the commands for the
user, and do not run them: `ai-i18n-tools suggest-models` (optional),
`ai-i18n-tools sync`, then build the site and open one localised route.
````

<a id="review-the-result"></a>
## Réviser le résultat

L'agent termine avec un rapport. Vérifiez-le avant de traduire :

- Le diff. Il doit s'agir de la configuration de locale du framework, de `contentPaths` et du routage décrit par la branche. Le texte de la page source doit être le même qu'avant. `git diff --stat` indique l'ampleur du changement.
- `targetLocales` correspond aux clés de locale que le framework servira.
- `contentPaths` pointe vers les pages en langue source, et non vers un dossier de locale que l'outil est censé écrire.
- Aucun arbre de locale généré n'a été modifié : `docs/<locale>/`, HTML de locale, `content/<locale>/`, `theme.<locale>.json`, ou un dossier Docusaurus `i18n/<locale>/` autre que le catalogue source de `write-translations`.
- La construction ou la vérification de type du projet passe toujours.

<a id="choose-models-and-translate"></a>
## Choisir les modèles et traduire

C'est vous qui exécutez cette partie. Elle utilise votre clé API et dépense de l'argent sur votre compte.

La liste des modèles fournie par `init` constitue un point de départ. Classez les modèles de chat du fournisseur actif et, une fois la sélection finale validée, enregistrez-la dans `translationModels` :

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` ne remplace que `translationModels`. Le même classement se trouve dans l'onglet [Modèles](/fr/guide/translation-dashboard/models) de `ai-i18n-tools dashboard`.

Ensuite, traduisez et construisez :

```bash
ai-i18n-tools sync
```

`sync` exécute `translate-docs` lorsque `features.translateDocs` est activé, et `extract` plus `translate-ui` lorsque les chaînes d'interface utilisateur sont activées (`ui-plain-html`, et un site Astro simple qui utilise également `t()`). `ai-i18n-tools translate-docs` exécute l'étape des documents seul.

<a id="what-gets-translated"></a>
### Ce qui est traduit

Les corps de page passent par le pipeline [Documents](/fr/guide/documents/). Les chaînes d'habillage du framework (navigation, barre latérale, étiquettes de thème) sont gérées dans la même exécution lorsque le framework le prend en charge. Il ne s'agit pas du pipeline [JSON](/fr/guide/json) distinct. Une page HTML simple qui change de langue dans le navigateur constitue l'exception : `mark-html` et `translate-ui` écrivent du JSON plat, et le script du navigateur l'applique. Un fichier HTML par locale reste sur le pipeline Documents.

| Framework | Chaînes de l'interface et du thème | Comment |
| --- | --- | --- |
| Docusaurus | Catalogue `write-translations` (`{ message, description }`) | `docs[].docusaurusCatalogDir` plus `translate-docs` |
| VitePress | Catalogue de thème, de navigation et de barre latérale | `docsOutput.vitepressThemeCatalog` plus `translate-docs` |
| Nextra | Étiquettes de barre latérale `_meta.ts` | Automatique avec `style: "nextra"` |
| Nextra | Dictionnaire de thème `.ts` | `docs[].nextraDictionaryPath` |
| Fumadocs | Étiquettes de barre latérale `meta.json` | Automatique avec `style: "fumadocs"` |
| Fumadocs | Catalogue de personnalisations d'interface utilisateur | `docsOutput.fumadocsUiCatalog` |
| Astro Starlight | Chaînes d'interface utilisateur intégrées pour de nombreux paramètres régionaux | Pages uniquement |

Les images et les captures d'écran ne sont pas traduites par `translate-docs`. Pour les fichiers spécifiques à un paramètre régional, voir [Images et captures d'écran](/fr/guide/images-and-screenshots/).

Après le premier `sync`, quelques frameworks ont encore besoin de la configuration pour charger le catalogue que la commande vient d'écrire. Ces invites restent sur les pages d'intégration : [catalogue de thèmes VitePress](/fr/guide/integrations/vitepress#wire-configmts-to-generated-theme-json-one-off), [dictionnaire Nextra](/fr/guide/integrations/nextra#agent-prompt-dictionary-and-routes) et [catalogue d'interface utilisateur Fumadocs](/fr/guide/integrations/fumadocs#agent-prompt).

<a id="check-one-language"></a>
### Vérifier une langue

Construisez le site et ouvrez une route localisée dans le navigateur. Le menu déroulant de locale du framework est le sélecteur. Pour un fichier HTML qui bascule dans le navigateur, utilisez le sélecteur que le runtime remplit. Pour un fichier HTML par locale, ouvrez le fichier dans le dossier de locale.

Le texte qui est encore dans la langue source a été omis de `contentPaths`, est un bloc de code, une URL, une ancre d'en-tête, ou la route n'est pas câblée. Une étiquette de navigation VitePress qui est encore dans la langue source est le catalogue de thèmes : exécutez `sync` d'abord, puis l'[invite du catalogue de thèmes](/fr/guide/integrations/vitepress#wire-configmts-to-generated-theme-json-one-off) si les chaînes sont toujours en ligne dans la configuration.

<a id="keep-it-translated"></a>
## Maintenir la traduction

Réexécutez `ai-i18n-tools sync` après la modification des pages source. Le cache signifie que seul le texte nouveau ou modifié est envoyé au modèle. Commitez les arborescences de locales que le pipeline écrit. `ai-i18n-tools dashboard` ouvre le [Tableau de bord de traduction](/fr/guide/translation-dashboard/) pour réviser les traductions.

Pour traduire `README.md` dans la même exécution, générez avec `--with-readme` (ou ajoutez le bloc à une configuration existante). Consultez [Ajouter l'i18n à vos documents README et Markdown](/fr/guide/add-i18n-to-readme).

<a id="do-it-by-hand"></a>
## Faire manuellement

Suivez ces étapes si vous préférez effectuer les modifications vous-même, ou si vous voulez savoir ce que fait l'invite. Vous [installez toujours la CLI](#install-and-choose-a-provider), [initialisez le projet](#initialise-the-project) et [traduisez](#choose-models-and-translate) à la fin.

1. Pointez `contentPaths` et `docsRoot` vers les pages en langue source. Les chemins de modèle sont des points de départ.
2. Activez le routage de locale du framework. Utilisez la branche qui correspond au modèle. La page d'intégration contient la référence complète.

Les chaînes de base que le framework lit à partir d'un catalogue sont câblées après le premier `sync`. Chaque branche ci-dessous lie ce suivi.

<a id="vitepress"></a>
### VitePress

Ajoutez `locales.root` et un `locales[code]` par cible, et préfixez les liens de navigation et de barre latérale avec `prefixVitepressThemeConfigLinks`. Laissez les chaînes de thème en ligne pour le premier `sync`. Liste de contrôle : [Activer l'i18n sur un site existant](/fr/guide/integrations/vitepress#enable-i18n-in-an-existing-site). Après que `sync` ait écrit `theme.<locale>.json`, collez l'[invite du catalogue de thèmes](/fr/guide/integrations/vitepress#wire-configmts-to-generated-theme-json-one-off) si la configuration contient toujours les chaînes en ligne.

<a id="docusaurus"></a>
### Docusaurus

Ajoutez le bloc `i18n`, pointez `docusaurusCatalogDir` vers le catalogue source, et exécutez `docusaurus write-translations`. Liste de contrôle : [Activer l'i18n sur un site existant](/fr/guide/integrations/docusaurus#enable-i18n-in-an-existing-site). JSON de base : [Chaînes de base](/fr/guide/integrations/docusaurus#shell-strings-write-translations).

<a id="nextra"></a>
### Nextra

Déplacez MDX sous `content/<sourceLocale>/`, ajoutez `app/[lang]/`, et ajoutez le module de dictionnaire source. Liste de contrôle : [Activer l'i18n sur un site existant](/fr/guide/integrations/nextra#enable-i18n-in-an-existing-site). L'[invite du dictionnaire](/fr/guide/integrations/nextra#agent-prompt-dictionary-and-routes) est le passage plus long pour le même câblage. Application React qui nécessite `t()` : [invite hybride](/fr/guide/integrations/nextra#optional-t-for-app-react-hybrid).

<a id="fumadocs"></a>
### Fumadocs

Ajoutez `defineI18n`, `app/[lang]/` et le middleware. Faites correspondre `fumadocsParser` à `dot` ou `dir`. Liste de contrôle : [Activer l'i18n sur un site existant](/fr/guide/integrations/fumadocs#enable-i18n-in-an-existing-site). L'[invite du catalogue d'interface utilisateur](/fr/guide/integrations/fumadocs#agent-prompt) câble `i18n.translations()` après l'existence des routes.

<a id="astro-starlight"></a>
### Astro Starlight

Ajoutez `locales`, y compris `root` lorsque la langue source n'est pas préfixée. Les pages restent dans `src/content/docs/`. Liste de contrôle : [Activer l'i18n sur un site existant](/fr/guide/integrations/astro#enable-i18n-in-an-existing-site). Starlight fournit ses propres chaînes d'interface utilisateur. Préférez les entrées de barre latérale `slug`.

<a id="plain-astro"></a>
### Plain Astro

Activez `i18n.locales` d'Astro et, lorsque le HTML de la page doit être traduit, ajoutez le bloc `docs` de [Plain Astro](/fr/guide/integrations/astro#plain-astro-marketing-and-app-sites). Les appels Frontmatter `t()` utilisent l'[invite JS/TS](/fr/guide/add-i18n-to-js#run-the-agent-prompt) sans installer i18next. Astro résout `t` au moment de la construction.

<a id="plain-html"></a>
### HTML brut

Deux options, et un fichier appartient à l'une d'elles :

- Une page qui change de langue dans le navigateur : `ui-plain-html`. Exécutez `ai-i18n-tools mark-html` (simulation, puis `--write`) et chargez `i18n.js`. Voir [Applications HTML simples](/fr/guide/ui-strings/plain-html).
- Un fichier HTML traduit par locale : `docs-plain-html`. Voir [Pages HTML](/fr/guide/documents/html-pages).

C'est la dernière étape manuelle. Continuez à [Choisir les modèles et traduire](#choose-models-and-translate).

<a id="not-your-case"></a>
## Ce n'est pas votre cas ?

| Vous avez | Lisez |
| --- | --- |
| Chaînes d'interface utilisateur d'application | [Ajouter l'i18n à une application JS/TS](/fr/guide/add-i18n-to-js) ou [Ajouter l'i18n à une application Python](/fr/guide/add-i18n-to-python) |
| Catalogues Django, Flask-Babel, ou une application qui utilise déjà GNU gettext | [Ajouter l'i18n à une application Django / Python gettext](/fr/guide/add-i18n-to-django-gettext) |
| Un fichier README de dépôt à côté du site, ou des fichiers Markdown sans framework de site | [Ajouter l'i18n à votre README et à vos documents Markdown](/fr/guide/add-i18n-to-readme). `init … --with-readme` ajoute ce bloc à côté d'un modèle de site |
| JSON de locale imbriquée autonome | [JSON](/fr/guide/json) |
| Un site et des chaînes d'application dans une seule configuration | [Combinaison de pipelines](/fr/guide/combining-pipelines) |

Référence pour les options partagées et les différences par framework : [Intégrations](/fr/guide/integrations/).

<a id="examples"></a>
## Exemples

| Exemple | Ce qu'il montre |
| --- | --- |
| [vitepress-docs](/fr/examples#vitepress-docs) | Pages VitePress et le catalogue de thèmes |
| [docusaurus-docs](/fr/examples#docusaurus-docs) | Pages Docusaurus et JSON de shell |
| [astro-docs](/fr/examples#astro-docs) | Pages Starlight |
| [nextra-docs](/fr/examples#nextra-docs) | Routes Nextra 4 et le dictionnaire |
| [fumadocs-docs](/fr/examples#fumadocs-docs) | Routes Fumadocs et le catalogue d'IU |
| [astro-website](/fr/examples#astro-website) | Page de destination Astro, HTML plus `t()` |
| [plain-html](/fr/examples#plain-html) | Un fichier HTML, marqueurs `data-i18n` |
| [plain-html-docs](/fr/examples#plain-html-docs) | Un fichier HTML par locale |

Copiez-en un avec `npx degit`. Commandes : [Exemples](/fr/examples#nodejs-examples).
