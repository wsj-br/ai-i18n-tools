<a id="add-i18n-to-a-jsts-app"></a>
# Ajouter l'i18n à une application JS/TS

Cette page est destinée à une application JS/TS (React, Next.js, Node, ou une CLI) dont les boutons, les étiquettes et les messages sont encore du texte brut dans la langue source. `extract` enregistre une chaîne d'interface utilisateur uniquement lorsqu'il s'agit d'un littéral de chaîne à l'intérieur de `t()` ou `i18n.t()`, donc aujourd'hui le catalogue serait vide et `translate-ui` n'aurait rien à traduire.

Les étapes : installer l'outil, installer i18next, exécuter `extract` une fois, ajouter un petit fichier de configuration pour que `t` existe, encapsuler le texte destiné à l'utilisateur, puis traduire. Vous n'êtes pas sûr que ce soit votre cas ? Voir [Pas votre cas ?](#not-your-case) à la fin.

<a id="install-the-tool-and-set-the-key"></a>
## Installer l'outil et définir la clé

Installer la CLI ([Installation](/fr/guide/installation)) et définir la clé API pour votre fournisseur ([Fournisseur et clé API](/fr/guide/quick-start#provider-and-api-key)). Ollama n'a pas besoin de clé.

<a id="initialise-the-config"></a>
## Initialiser la configuration

```bash
ai-i18n-tools init -P openrouter
```

Ceci écrit `ai-i18n-tools.config.json`. Quatre clés sont importantes pour l'instant :

- `sourceLocale`: la langue dans laquelle votre texte est écrit. Toute langue est valide. L'anglais est un exemple courant dans ce guide.
- `targetLocales`: les langues à ajouter.
- `ui.sourceRoots`: les dossiers que `extract` scanne, par exemple `src/`.
- `ui.stringsJson` et `ui.flatOutputDir`: où le catalogue et les fichiers par locale sont écrits.

Toute autre clé se trouve dans [Configuration](/fr/reference/configuration).

<a id="install-the-runtime-libraries"></a>
## Installer les bibliothèques d'exécution

ai-i18n-tools ne dépend pas de `i18next` ou `react-i18next`. L'application les installe.

- Toute application JS/TS qui recherche des chaînes à l'exécution : `i18next`.
- Les composants React qui appellent `useTranslation()` : `react-i18next` également.

```bash
pnpm add i18next
# React components:
pnpm add react-i18next
```

<a id="run-extract-once"></a>
## Exécuter l'extraction une fois

```bash
ai-i18n-tools extract
```

Le fichier de configuration de l'étape suivante importe `strings.json` et `ui-languages.json`, et seul `extract` les écrit. Il écrit les deux même s'il ne trouve aucun appel à `t()`, afin que l'application compile. Attendez-vous à 0 chaîne, ou 1 si votre `package.json` a un `description`, car l'extracteur l'inclut par défaut (`ui.uiExtractor.includePackageDescription`).

<a id="add-the-bootstrap"></a>
## Ajouter le bootstrap

Créez le fichier de configuration i18n. Cette version minimale est suffisante pour encapsuler les chaînes et les traduire. `SOURCE_LOCALE` doit être égal à `sourceLocale` dans `ai-i18n-tools.config.json`.

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

Lorsque l'application commence à utiliser les pluriels, ajoutez le fichier plat de la locale source afin que les formes plurielles soient résolues. Cela ajoute une troisième importation et une option `sourcePluralFlatBundle`, comme indiqué dans [Câbler i18next](/fr/guide/ui-strings/i18next-runtime).

Importez ce fichier depuis le point d'entrée de l'application avant le premier rendu. Dans Next.js, importez-le depuis un module client, selon le même modèle que [examples/nextjs-app/src/lib/i18n.ts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/src/lib/i18n.ts).

<a id="replace-hardcoded-copy"></a>
## Remplacer le texte en dur

Faites-le à la main, ou collez le [prompt JS/TS](#agent-prompt) dans un agent de codage. L'argument de `t()` est la phrase en langue source que l'utilisateur doit voir. Les fichiers de locale plats sont indexés par cette phrase.

<details class="agent-prompt" id="agent-prompt">
<summary>Prompt de l'agent JS/TS</summary>

Copiez ceci dans Cursor ou un autre agent de codage. Il enveloppe les littéraux destinés à l'utilisateur. Il ne les traduit pas.

````markdown
# Wrap user-facing JS/TS strings in t()

## Context

ai-i18n-tools extracts only string literals passed to `t()` or `i18n.t()`. The
literal is the source-language sentence and the catalog key (`t("Save")`, not
`t("saveButton")`). After this edit the app must behave the same when the active
locale is the source locale. Do not translate any string.

Bootstrap and call-shape reference:
https://wsj-br.github.io/ai-i18n-tools/guide/ui-strings/i18next-runtime
https://wsj-br.github.io/ai-i18n-tools/guide/ui-strings/t-calls-and-plurals

## Scope

Read `ui.sourceRoots` in `ai-i18n-tools.config.json` and edit only those trees
(JS/JSX/TS/TSX). Skip `className`, URLs and routes, import paths, ids, test ids,
enum and error codes, object keys used as identifiers, log field names, CSS,
regexes, comments, and text that is already inside `t()` or `i18n.t()`.

## Call shape

Install `i18next`. Install `react-i18next` when a component uses
`useTranslation()`. Run `ai-i18n-tools extract` once so `strings.json` and
`ui-languages.json` exist, then add the bootstrap from the Wire i18next guide.
`SOURCE_LOCALE` must equal config `sourceLocale`.

- React components: `const { t } = useTranslation()` and `{t("Save")}`.
- Module-level constants and non-React files: `i18n.t("…")`. Move a constant
  that would call `t()` at import time into a function or `useMemo(..., [t])`.
- Placeholders: `t("Hello {{name}}", { name })`. No template literal as a key.
- Plurals: `t("{{count}} items", { plurals: true, count })`.
- Next.js: import the bootstrap from a client module before render. Do not call
  `changeLanguage` on a shared i18next instance inside a server component. Use a
  per-request `createInstance()`, or a stateless flat-bundle lookup.

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

## Order

1. Install the libraries.
2. Run `ai-i18n-tools extract` once.
3. Add the bootstrap.
4. Wrap call sites.
5. Run `ai-i18n-tools extract` again. Do not run a translation yourself and do
   not hand-edit catalogs.

## Do not

- Do not translate, rename, or reword the source text.
- Do not introduce semantic keys (`saveButton`, `nav.home`).
- Do not hand-edit `strings.json`, flat locale JSON, or `ui-languages.json`.
- Do not change behaviour, layout, or test selectors.

## Verify

- `ai-i18n-tools extract` writes a non-empty catalog of the sentences you
  wrapped.
- The project's build, type check, and tests pass.
- With the source locale active, every wrapped string still shows the original
  sentence. Switch one target locale after `translate-ui` and confirm those
  sentences change.

## Report back

List files changed, each string you deliberately skipped with a one-line reason,
and any ambiguous case you left for a human (the same word used with different
meanings, concatenated sentences, or a plural you were not sure about).
````

</details>

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

<a id="extract-and-translate"></a>
## Extraire et traduire

Une fois les littéraux en place :

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
ai-i18n-tools status
```

`sync` exécute `extract` et `translate-ui` ensemble lorsque `features.translateUIStrings` est activé. `extract` devrait maintenant lister les phrases que vous avez enveloppées. Ouvrez un fichier de locale généré sous `ui.flatOutputDir` et confirmez que les traductions sont présentes. Ensuite : [Chaînes d'interface utilisateur, Étape 2](/fr/guide/ui-strings/#step-2-extract-strings) pour savoir ce que `extract` scanne et écrit.

[examples/console-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app) est une petite application Node dont le `src/main.js` est déjà enveloppé. L'exemple Next.js est le bootstrap React.

<a id="language-switching"></a>
## Changement de langue

Restaurez une locale enregistrée avant le premier rendu, comme décrit dans [Connecter i18next](/fr/guide/ui-strings/i18next-runtime#startup-locale). Ajoutez ensuite un contrôle qui appelle `await loadLocale(code)` suivi de `await i18n.changeLanguage(code)` : [Sélecteur de langue et RTL](/fr/guide/ui-strings/language-switcher).

<a id="keep-it-translated"></a>
## Maintenir la traduction

Réexécutez `sync` après avoir modifié le texte source. Le cache signifie que seules les chaînes nouvelles ou modifiées sont envoyées au modèle. Ajoutez les scripts de [Scripts package.json recommandés](/fr/guide/quick-start#recommended-packagejson-scripts), et exécutez `sync` en CI afin que les traductions ne divergent pas.

Le modèle `init` par défaut traduit également `README.md`. Voir [Ajouter l'i18n à votre README et à votre documentation Markdown](/fr/guide/add-i18n-to-readme).

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
| Un fichier README de dépôt ou d'autres fichiers Markdown | [Ajouter l'i18n à vos documents README et Markdown](/fr/guide/add-i18n-to-readme) |
