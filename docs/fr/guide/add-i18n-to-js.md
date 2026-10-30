<a id="add-i18n-to-a-jsts-app"></a>
# Ajouter l'i18n à une application JS/TS

Cette page prend une application JS/TS (React, Next.js, Node, ou une CLI) qui a une seule langue et ajoute des locales avec ai-i18n-tools. Elle suit un chemin : i18next, un petit fichier de bootstrap, et des fichiers JSON de traductions. `extract` enregistre une chaîne d'interface utilisateur uniquement lorsqu'il s'agit d'un littéral de chaîne à l'intérieur de `t()` ou `i18n.t()`, de sorte qu'un catalogue de texte source brut serait vide.

Le moyen le plus rapide est de donner à un agent de codage l'invite de cette page. Il installe i18next, ajoute le bootstrap, enveloppe vos chaînes et peut ajouter un sélecteur de langue. Vous installez la CLI, choisissez le fournisseur et initialisez le projet vous-même, car cela nécessite votre clé API et vos choix. Vous exécutez également la traduction vous-même, car cela dépense de l'argent sur votre compte.

Un site web ou un site de documentation utilise [Ajouter l'i18n à un site web ou un site de documentation](/fr/guide/add-i18n-to-website). Une application Python utilise [Ajouter l'i18n à une application Python](/fr/guide/add-i18n-to-python). Vous ne savez pas lequel s'applique ? Voir [Pas votre cas ?](#not-your-case) à la fin.

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

Installez le paquet en tant que dépendance de développement. Le bootstrap importe `ai-i18n-tools/runtime`, et une CLI globale ou un exécutable autonome ne peut pas satisfaire cette importation. Autres options d'installation : [Installation](/fr/guide/installation).

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

Vous exécutez ceci une seule fois, avant l'invite. Il écrit la configuration et utilise le fournisseur que vous avez choisi ci-dessus.

```bash
ai-i18n-tools init -P openrouter
```

Le modèle par défaut est `ui-markdown`. Il écrit `ai-i18n-tools.config.json` avec un bloc d'interface utilisateur et un bloc README plat. Quatre clés sont importantes pour l'application :

- `sourceLocale` : la langue des chaînes dans la source. Toute langue BCP-47 est valide ; l'échafaudage utilise souvent `en-GB`.
- `targetLocales` : les langues à ajouter.
- `ui.sourceRoots` : les dossiers que `extract` scanne, par exemple `src/`.
- `ui.stringsJson` et `ui.flatOutputDir` : où le catalogue et les fichiers par locale sont écrits.

`init` n'installe pas i18next et n'ajoute pas le bootstrap. C'est l'invite (manuellement, [Étape 1](#step-1-install-the-runtime-libraries) et [Étape 2](#step-2-extract-once-and-add-the-bootstrap)).

Exécutez `init` une seule fois. Il réécrit `ai-i18n-tools.config.json` à chaque fois, donc une deuxième exécution annule les modifications que vous avez apportées.

Le même modèle liste `README.md` pour la traduction de documents. Le marqueur de liste de langues et les fichiers README se trouvent dans [Ajouter l'i18n à vos fichiers README et Markdown](/fr/guide/add-i18n-to-readme). Cette page est le chemin `t()`.

Toutes les autres clés se trouvent dans [Configuration](/fr/reference/configuration). Formes d'appel : [Appels t() et pluriels](/fr/guide/ui-strings/t-calls-and-plurals). La référence du bootstrap : [Câbler i18next](/fr/guide/ui-strings/i18next-runtime).

<a id="run-the-agent-prompt"></a>
## Exécuter l'invite de l'agent

Ouvrez le projet dans votre agent de codage (Cursor, Claude Code, Copilot ou similaire), démarrez une nouvelle conversation et collez l'invite ci-dessous. Le projet doit déjà être initialisé. Il n'y a rien à modifier. Si vous voulez omettre quelque chose, par exemple pas de sélecteur de langue, précisez-le dans le même message.

L'agent vérifie d'abord que la CLI et la configuration existent, et s'arrête avec des instructions si l'un d'eux est manquant. Ensuite, il procède en trois parties :

- La partie 1 installe i18next, exécute `extract` une fois et ajoute le bootstrap.
- La partie 2 enveloppe les chaînes destinées à l'utilisateur dans `t()` ou `i18n.t()`.
- La partie 3 ajoute un sélecteur de langue, ou une option de langue CLI.

Il n'installe pas la CLI, n'initialise pas la configuration, ne lit pas votre clé API, ni ne traduit. La traduction est l'étape après la révision, et c'est vous qui l'exécutez.

````markdown
# Add languages to this JS/TS app

## Before you start

The user must already have installed ai-i18n-tools and initialised this
project. Check that `ai-i18n-tools --version` runs (or
`pnpm exec ai-i18n-tools --version` when the binary is only in
`node_modules/.bin`) and that
`ai-i18n-tools.config.json` exists with a `ui` block. If either is missing,
stop now and tell the user to install ai-i18n-tools as a dev dependency and
run `ai-i18n-tools init -P <provider>`, then run this prompt again. Do not
install the CLI or initialise the config yourself.

## Rules

- Do not read or search the ai-i18n-tools source. This prompt is complete.
- Never read, print, or write API keys, `.env` files, or the shell environment.
- Do not run `translate-ui`, `suggest-models`, or `sync`. They call the
  translation API and cost money. The user runs them after reviewing your work.
- Do not translate, reword, or rename source text. Do not edit generated files
  (`strings.json`, per-locale JSON, `ui-languages.json`).
- Do not introduce semantic keys (`saveButton`, `nav.home`). The literal in
  `t("…")` is the source-language sentence and the catalog key.
- Do not reformat unrelated code. Keep existing blank lines. Run the project's
  formatter and linter at the end. Leave unrelated edits in a dirty tree alone.
  Delete throwaway scripts and do not commit them.

## Part 1 — Runtime

Skip a piece of this part when it is already done.

1. Install `i18next` with the project's package manager. Install
   `react-i18next` only when a component uses `useTranslation()`.
2. Run `ai-i18n-tools extract` once. It writes `strings.json` and
   `ui-languages.json` even when it finds no `t()` calls, so the app compiles.
   Expect 0 strings, or 1 when `package.json` has a `description`
   (`ui.uiExtractor.includePackageDescription` is on by default).
3. Add the bootstrap below. Put it where this repository keeps its app code,
   and point the JSON imports at `ui.stringsJson`, `ui.flatOutputDir`, and
   `languagesManifestPath` when that key is set. `SOURCE_LOCALE` must equal
   config `sourceLocale`, character for character. The sample uses `en-GB`
   only as the shape.
4. Import the bootstrap from the app entry before the first render. In
   Next.js, import it from a client module. Do not call `changeLanguage` on a
   shared i18next instance inside a server component. Concurrent requests
   share that singleton. Use a per-request `createInstance()`, or a stateless
   lookup of the flat bundle.

Not using React? Drop the `react-i18next` import and the `.use(initReactI18next)` call.

```js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import aiI18n from 'ai-i18n-tools/runtime';
import uiLanguages from './locales/ui-languages.json';
import stringsJson from './locales/strings.json';

export const SOURCE_LOCALE = 'en-GB';

void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));
aiI18n.setupKeyAsDefaultT(i18n, { stringsJson });

i18n.on('languageChanged', aiI18n.applyDirection);
aiI18n.applyDirection(i18n.language);

const localeLoaders = aiI18n.makeLocaleLoadersFromManifest(
  uiLanguages,
  SOURCE_LOCALE,
  (code) => () => import(`./locales/${code}.json`),
);

export const loadLocale = aiI18n.makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);
export default i18n;
```

For JSON under `public/`, the loader fetches `/locales/<code>.json` and
parses the response. For a Node CLI with no bundler, read the file with
`readFileSync` inside that function. A call that uses `{ plurals: true, count }`
also needs the
source-locale flat file under `flatOutputDir`. That file does not exist until
the user runs `translate-ui`, so leave `sourcePluralFlatBundle` out and name
the plural calls in the report.

## Part 2 — Wrap strings

The literal in `t("…")` is the source-language sentence and the catalog key.
With the source locale active, the app must behave exactly as before. Text
that is already wrapped needs no change.

Read `ui.sourceRoots` and edit only those trees (JS, JSX, TS, TSX). Leave
`className`, URLs and routes, import paths, ids, test ids, enum and error
codes, object keys used as identifiers, log field names, CSS, regexes, and
comments.

- React components: `const { t } = useTranslation()` and `{t("Save")}`.
- Module-level constants and non-React files: `i18n.t("…")`. A constant that
  would call `t()` at import time must move into a function or
  `useMemo(..., [t])`, so `t()` runs after the locale loads.
- Placeholders: `t("Hello {{name}}", { name })`. The argument must be a string
  literal. `t(variable)` and a template literal as the key are not extracted.
- Plurals: `t("{{count}} items", { plurals: true, count })`. Do not invent
  `_one` / `_other` keys.
- One `t()` per sentence. Split only where the text already branches.

Before:

```jsx
<button>Save</button>
```

After:

```jsx
<button>{t("Save")}</button>
```

Before:

```js
console.log(`Hello ${name}`);
```

After:

```js
console.log(t("Hello {{name}}", { name }));
```

Work in passes: list string literals that are not passed to `t` or `i18n.t`,
wrap the user-facing ones, then list again. Treat any bulk rewrite as a draft
and review its diff. Then run `ai-i18n-tools extract` again.

## Part 3 — Language switch

Skip this part only when the program shows no text a person reads, or when the
user asked you to leave language choice out. A command-line program still gets
this part: a language option, not a widget.

Goal: one chosen language applies to every `t()` in that run, and a screen can
remember the choice. Accept only codes listed in `ui-languages.json`.

- Restore a saved locale before the first render, then draw a control labelled
  `t("Language")` whose options come from that manifest. On change, call
  `await loadLocale(code)` and then `await i18n.changeLanguage(code)`.
- In Next.js, reading `localStorage` in an effect after hydration paints the
  source locale first. Prefer a cookie the server can read, or load the saved
  locale in the client module before the first client render. Do not call
  `changeLanguage` on a shared instance inside a server component.
- A CLI: add `--lang <code>` and `-L <code>` unless those names are taken.
  Read the option before help text is built, so help can be translated too.
  After the option, read a language environment variable the app already owns.
  Do not read `AI_I18N_LANG`. Then the source locale.

## Verify and report

The project's build, type check, and tests pass. `extract` writes a non-empty
catalog of the sentences you wrapped. With the source locale, the output is
unchanged.

Report the files changed, each string you skipped with a one-line reason, the
same word used with different meanings, sentences built from translated pieces,
plurals that still need `sourcePluralFlatBundle` after the user translates,
and any `t()` that runs at import time. Then list the commands for the user,
and do not run them: `ai-i18n-tools suggest-models` (optional),
`ai-i18n-tools translate-ui`, then reload the app.
````

<a id="review-the-result"></a>
## Réviser le résultat

L'agent termine avec un rapport. Vérifiez-le avant de traduire :

- Le diff. Le texte enveloppé devrait se lire de la même manière qu'avant, sans reformatage non lié. `git diff --stat` montre ce qui a changé. Le bootstrap, son import, les appels enveloppés et le sélecteur de langue sont les modifications attendues.
- Les catalogues générés (`strings.json`, JSON par locale, `ui-languages.json`) sont intacts, à l'exception de ce que `extract` a écrit.
- `ai-i18n-tools extract` s'exécute sans erreur, et `strings.json` liste les phrases que vous attendez.
- Vos tests réussissent, et l'application a le même aspect dans la langue source.
- Les chaînes ignorées et les cas ambigus dans le rapport : un mot utilisé avec des significations différentes, des phrases construites à partir de fragments et les pluriels. Décidez-les manuellement.
- `SOURCE_LOCALE` dans le bootstrap est égal à `sourceLocale` dans la configuration.

Les chaînes que l'agent a manquées apparaissent comme du texte qui reste dans la langue source par la suite.

<a id="choose-models-and-translate"></a>
## Choisir les modèles et traduire

C'est vous qui exécutez cette partie. Elle utilise votre clé API et dépense de l'argent sur votre compte.

La liste des modèles fournie par `init` constitue un point de départ. Classez les modèles de chat du fournisseur actif et, une fois la sélection finale validée, enregistrez-la dans `translationModels` :

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` ne remplace que `translationModels`. Le même classement se trouve dans l'onglet [Modèles](/fr/guide/translation-dashboard/models) de `ai-i18n-tools dashboard`.

Ensuite, extrayez et traduisez :

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
ai-i18n-tools status
```

`extract` écrit `strings.json` et `ui-languages.json`. `translate-ui` écrit un fichier JSON par langue cible sous `ui.flatOutputDir`. Laissez ces fichiers générés non modifiés. `sync` exécute `extract` et `translate-ui` ensemble lorsque `features.translateUIStrings` est activé. Ce que `extract` scanne et écrit : [Chaînes d'interface utilisateur, Étape 2](/fr/guide/ui-strings/#step-2-extract-strings).

`t()` recherche la phrase source dans le JSON de la locale. L'ID dans `strings.json` n'est pas la clé de recherche. Un fichier manquant ou une clé manquante renvoie la phrase source.

<a id="check-one-language"></a>
### Vérifier une langue

Rechargez l'application, passez à une langue cible et ouvrez un écran avec quelques chaînes enveloppées. Utilisez le sélecteur de langue ajouté par l'agent, ou appelez `loadLocale` et `changeLanguage` vous-même. Le texte qui est toujours dans la langue source n'a pas été enveloppé, s'exécute au moment de l'importation, ou n'a pas d'entrée dans le JSON de la locale. Vérifiez le JSON pour la phrase avant de suspecter le code.

Lorsqu'un appel enveloppé utilise `{ plurals: true, count }`, ajoutez le fichier plat de la locale source afin que les formes plurielles soient résolues. Cela ajoute un import de `{sourceLocale}.json` depuis `flatOutputDir` et une option `sourcePluralFlatBundle`, présenté dans [Câbler i18next](/fr/guide/ui-strings/i18next-runtime).

<a id="keep-it-translated"></a>
## Maintenir la traduction

Réexécutez `ai-i18n-tools sync` (ou `extract` puis `translate-ui`) après avoir modifié le texte source. Le cache signifie que seules les chaînes nouvelles ou modifiées sont envoyées au modèle. Ajoutez les scripts de [Scripts package.json recommandés](/fr/guide/quick-start#recommended-packagejson-scripts), et exécutez `sync` en CI afin que les traductions ne divergent pas. Rechargez l'application après une exécution de traduction afin qu'elle prenne en compte le nouveau JSON. `ai-i18n-tools dashboard` ouvre le [Tableau de bord de traduction](/fr/guide/translation-dashboard/) pour examiner les traductions.

Le modèle `init` par défaut liste également `README.md`. Collez le marqueur de liste de langues avant que `sync` ne le traduise. Voir [Ajouter l'i18n à votre README et à vos documents Markdown](/fr/guide/add-i18n-to-readme).

<a id="do-it-by-hand"></a>
## Faire manuellement

Suivez ces étapes si vous préférez effectuer les modifications vous-même, ou si vous voulez savoir ce que fait l'invite. Les étapes correspondent aux parties de l'invite. Vous devez toujours [installer la CLI](#install-and-choose-a-provider), [initialiser le projet](#initialise-the-project), et [traduire](#choose-models-and-translate) à la fin.

1. [Installer les bibliothèques d'exécution](#step-1-install-the-runtime-libraries).
2. [Extraire une fois et ajouter le bootstrap](#step-2-extract-once-and-add-the-bootstrap).
3. [Envelopper les chaînes](#step-3-wrap-strings) dans `t()` ou `i18n.t()`.
4. [Ajouter un sélecteur de langue](#step-4-add-a-language-switch).

<a id="step-1-install-the-runtime-libraries"></a>
## Étape 1 : Installer les bibliothèques d'exécution

ai-i18n-tools ne dépend pas de `i18next` ou `react-i18next`. L'application les installe.

- Toute application JS/TS qui recherche des chaînes à l'exécution : `i18next`.
- Les composants React qui appellent `useTranslation()` : `react-i18next` également.

```bash
pnpm add i18next
# React components:
pnpm add react-i18next
```

<a id="step-2-extract-once-and-add-the-bootstrap"></a>
## Étape 2 : Extraire une fois et ajouter le bootstrap

Le bootstrap importe `strings.json` et `ui-languages.json`, et seul `extract` les écrit. Il écrit les deux même s'il ne trouve aucun appel à `t()`, afin que l'application compile.

```bash
ai-i18n-tools extract
```

Attendez-vous à 0 chaîne, ou 1 si votre `package.json` contient un `description`, car l'extracteur l'inclut par défaut (`ui.uiExtractor.includePackageDescription`).

Créez le fichier de configuration i18n. Cette version est suffisante pour envelopper les chaînes et les traduire. `SOURCE_LOCALE` doit être égal à `sourceLocale` dans `ai-i18n-tools.config.json`. Ajustez les chemins d'importation afin qu'ils correspondent à `ui.stringsJson` et `ui.flatOutputDir`.

```js
// src/i18n.js — adjust the import paths to match `ui` in your config
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import aiI18n from 'ai-i18n-tools/runtime';
import uiLanguages from './locales/ui-languages.json';
import stringsJson from './locales/strings.json';

export const SOURCE_LOCALE = 'en-GB';

void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));
aiI18n.setupKeyAsDefaultT(i18n, { stringsJson });

i18n.on('languageChanged', aiI18n.applyDirection);
aiI18n.applyDirection(i18n.language);

const localeLoaders = aiI18n.makeLocaleLoadersFromManifest(
  uiLanguages,
  SOURCE_LOCALE,
  (code) => () => import(`./locales/${code}.json`),
);

export const loadLocale = aiI18n.makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);
export default i18n;
```

Vous n'utilisez pas React ? Supprimez l'importation de `react-i18next` et l'appel à `.use(initReactI18next)`.

Pour les bundles JSON sous `public/`, le chargeur récupère `/locales/${code}.json`. Pour une CLI Node sans bundler, lisez le fichier avec `readFileSync`. Les deux formes se trouvent dans [Chargeurs de locale](/fr/guide/ui-strings/i18next-runtime#locale-loaders).

Importez ce fichier depuis le point d'entrée de l'application avant le premier rendu. Dans Next.js, importez-le depuis un module client, selon le même modèle que [examples/nextjs-app/src/lib/i18n.ts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/src/lib/i18n.ts).

<a id="step-3-wrap-strings"></a>
## Étape 3 : Envelopper les chaînes

L'argument de `t()` est la phrase en langue source que l'utilisateur devrait voir. Les fichiers de locale plats sont indexés par cette phrase.

JSX :

```jsx
<button>Save</button>
<button>{t("Save")}</button>
```

Node, une CLI, ou tout module non-React :

```js
console.log(`Hello ${name}`);
console.log(t("Hello {{name}}", { name }));
```

Règles (également dans les [appels t() et les pluriels](/fr/guide/ui-strings/t-calls-and-plurals)) :

- La clé est un littéral. `t(variable)` et <code>{'t(`Hello ${name}`)'}</code> ne sont pas extraits, et les appels non littéraux sont ignorés sans avertissement.
- Les placeholders à l'intérieur du littéral utilisent le format i18next <code v-pre>{{name}}</code>, passé dans le deuxième argument.
- Pluriels : une phrase source plus `{ plurals: true, count }`. Voir [Pluriels cardinaux](/fr/guide/ui-strings/t-calls-and-plurals#cardinal-plurals-plurals-true). N'inventez pas vous-même les clés `_one` / `_other`.
- Les composants React prennent `t` de `useTranslation()`. Les autres fichiers appellent `i18n.t`. Une constante évaluée au moment de l'importation doit être déplacée dans une fonction ou `useMemo(..., [t])`, afin que `t()` s'exécute après le chargement de la locale.
- Les composants serveur Next.js ne doivent pas appeler `changeLanguage` sur une instance i18next partagée. Les requêtes concurrentes partagent ce singleton. Utilisez un `createInstance()` par requête, ou une recherche sans état du bundle plat (voir l'[hybride Nextra](/fr/guide/integrations/nextra#optional-t-for-app-react-hybrid)).

Laissez-les tels quels : `className`, `href` et autres URL, chemins d'importation, identifiants, identifiants de test, codes d'erreur, clés d'objet utilisées comme identifiants, et texte à l'intérieur des commentaires.

Exécutez `ai-i18n-tools extract` à nouveau. Le catalogue devrait maintenant lister les phrases que vous avez enveloppées.

<a id="step-4-add-a-language-switch"></a>
## Étape 4 : Ajouter un sélecteur de langue

Restaurez une locale enregistrée avant le premier rendu, comme décrit dans [Connecter i18next](/fr/guide/ui-strings/i18next-runtime#startup-locale). Ensuite, ajoutez un contrôle qui appelle `await loadLocale(code)` suivi de `await i18n.changeLanguage(code)`. Construisez les options à partir de `ui-languages.json`. Le widget, les étiquettes et la disposition de droite à gauche : [Sélecteur de langue et RTL](/fr/guide/ui-strings/language-switcher).

Un programme en ligne de commande n'a pas de widget. Ajoutez `--lang <code>` (et `-L` lorsque ce nom est libre), puis une variable d'environnement de langue que l'application possède déjà. Ne lisez pas `AI_I18N_LANG` ; cette variable est uniquement destinée à la CLI ai-i18n-tools. Acceptez uniquement les codes listés dans `ui-languages.json`.

Ignorez cette étape lorsque le programme n'affiche aucun texte lisible par une personne.

C'est la dernière étape manuelle. Continuez à [Choisir les modèles et traduire](#choose-models-and-translate).

<a id="coming-from-another-tool"></a>
## Venir d'un autre outil

ai-i18n-tools inclut son propre extracteur de chaînes. Si vous avez utilisé `i18next-scanner`, `babel-plugin-i18next-extract`, ou similaire, vous pouvez supprimer ces dépendances de développement après la migration. Les fichiers JSON de namespace i18next existants peuvent rester sur le [pipeline JSON](/fr/guide/json#i18next-namespace-files). Les dictionnaires `.content.ts` Intlayer peuvent être importés avec `migrate-intlayer` : voir [Migration depuis Intlayer](/fr/guide/migrating-from-intlayer). Pour conserver Intlayer à l'exécution et ne remplir que ses traductions, utilisez `translate-intlayer` : voir [Traduire Intlayer sur place](/fr/guide/translating-intlayer).

<a id="not-your-case"></a>
## Ce n'est pas votre cas ?

| Votre code actuel | Consulter |
| --- | --- |
| Déjà `t("…")` ou `i18n.t("…")` avec la phrase en langue source | [Chaînes d'UI](/fr/guide/ui-strings/) étapes 2 à 3, puis [Intégrer i18next](/fr/guide/ui-strings/i18next-runtime) |
| JSON de l'espace de noms i18next (`t("saveButton")` plus `en/translation.json`) | [JSON](/fr/guide/json). Ne modifiez pas ces clés pour utiliser des phrases en langue source, à moins que vous ne soyez prêt à modifier chaque appel |
| Dictionnaires Intlayer, abandonner Intlayer | [Migration depuis Intlayer](/fr/guide/migrating-from-intlayer) |
| Dictionnaires Intlayer, conserver Intlayer | [Traduction d'Intlayer sur place](/fr/guide/translating-intlayer) |
| Un seul fichier HTML | [HTML brut](/fr/guide/ui-strings/plain-html) et `mark-html` |
| Sites de documentation, ou HTML de page Astro | [Ajouter l'i18n à un site web ou un site de documentation](/fr/guide/add-i18n-to-website) et [Site web Astro](/fr/guide/ui-strings/astro-website). `t()` est uniquement destiné aux données partagées et au frontmatter |
| Une application Python | [Ajouter l'i18n à une application Python](/fr/guide/add-i18n-to-python) |
| Catalogues Django, Flask-Babel, ou une application qui utilise déjà GNU gettext | [Ajouter l'i18n à une application Django / Python gettext](/fr/guide/add-i18n-to-django-gettext) |
| Un fichier README de dépôt ou d'autres fichiers Markdown | [Ajouter l'i18n à vos documents README et Markdown](/fr/guide/add-i18n-to-readme) |

<a id="examples"></a>
## Exemples

| Exemple | Description |
| --- | --- |
| [console-app](/fr/examples#console-app) | La plus petite application Node, `t()` déjà encapsulé, plus un bloc README |
| [nextjs-app](/fr/examples#nextjs-app) | Bootstrap React, pluriels, un site de documentation et un bloc README |

Copiez-en un avec `npx degit`. Commandes : [Exemples](/fr/examples#nodejs-examples).
