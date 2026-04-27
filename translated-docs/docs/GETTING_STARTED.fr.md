<a id="ai-i18n-tools-getting-started"></a>
# ai-i18n-tools : Prise en main

`ai-i18n-tools` propose deux flux de travail indépendants et composable :

- **Flux de travail 1 - Traduction d'interface utilisateur** : extraction des appels `t("…")` à partir de toute source JS/TS, traduction via OpenRouter, et écriture de fichiers JSON plats par langue prêts à l'emploi avec i18next.
- **Flux de travail 2 - Traduction de documents** : traduction de fichiers Markdown (MDX) et de fichiers d'étiquettes JSON Docusaurus vers un nombre quelconque de langues, avec mise en cache intelligente. Les ressources **SVG** utilisent `features.translateSVG`, le bloc `svg` de niveau supérieur, et `translate-svg` (voir [référence CLI](#cli-reference)).

Les deux flux de travail utilisent OpenRouter (n'importe quel LLM compatible) et partagent un seul fichier de configuration.

<small>**Lire dans d'autres langues :** </small>
<small id="lang-list">[English (GB)](../../docs/GETTING_STARTED.md) · [Deutsch](./GETTING_STARTED.de.md) · [Español](./GETTING_STARTED.es.md) · [Français](./GETTING_STARTED.fr.md) · [हिन्दी](./GETTING_STARTED.hi.md) · [日本語](./GETTING_STARTED.ja.md) · [한국어](./GETTING_STARTED.ko.md) · [Português (Brasil)](./GETTING_STARTED.pt-BR.md) · [中文 (中国大陆)](./GETTING_STARTED.zh-CN.md) · [中文 (台灣)](./GETTING_STARTED.zh-TW.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table des matières**

- [Installation](#installation)
- [Démarrage rapide](#quick-start)
  - [Scripts `package.json` recommandés](#recommended-packagejson-scripts)
- [Flux de travail 1 - Traduction de l'interface utilisateur](#workflow-1---ui-translation)
  - [Étape 1 : Initialiser](#step-1-initialise)
  - [Étape 2 : Extraire les chaînes](#step-2-extract-strings)
  - [Étape 3 : Traduire les chaînes d'interface](#step-3-translate-ui-strings)
  - [Exporter vers XLIFF 2.0 (facultatif)](#exporting-to-xliff-20-optional)
  - [Étape 4 : Intégrer i18next au moment de l'exécution](#step-4-wire-i18next-at-runtime)
  - [Utilisation de `t()` dans le code source](#using-t-in-source-code)
  - [Interpolation](#interpolation)
  - [Pluriels cardinaux (`plurals: true`)](#cardinal-plurals-plurals-true)
  - [Interface de changement de langue](#language-switcher-ui)
  - [Langues LTR](#rtl-languages)
- [Flux de travail 2 - Traduction de documents](#workflow-2---document-translation)
  - [Étape 1 : Initialiser pour la documentation](#step-1-initialise-for-documentation)
  - [Étape 2 : Traduire les documents](#step-2-translate-documents)
    - [Markdown complexe et échecs des contrôles de qualité](#complex-markdown-and-failed-quality-checks)
    - [Comportement du cache et indicateurs `translate-docs`](#cache-behaviour-and-translate-docs-flags)
    - [Format de prompt par lot](#batch-prompt-format)
    - [Dédoublonnage des segments et chemins dans SQLite](#segment-dedupe-and-paths-in-sqlite)
  - [Dispositions de sortie](#output-layouts)
    - [Liens d'ancre en disposition plate](#anchor-links-in-flat-layout)
    - [Espaces réservés `pathTemplate` / `jsonPathTemplate`](#pathtemplate--jsonpathtemplate-placeholders)
- [Flux de travail combiné (UI + Docs)](#combined-workflow-ui--docs)
  - [Flux de documentation mixte (Docusaurus + plat)](#mixed-documentation-workflow-docusaurus--flat)
- [Éditeur de cache de traduction](#translation-cache-editor)
  - [Échecs (traduction de documents)](#failures-document-translation)
    - [Quand l'utiliser](#when-to-use-it)
    - [Pourquoi les modifications de la source sont importantes](#why-source-edits-matter)
    - [Comment utiliser l'onglet](#how-to-use-the-tab)
- [Référence de configuration](#configuration-reference)
  - [`sourceLocale`](#sourcelocale)
  - [`targetLocales`](#targetlocales)
  - [`uiLanguagesPath` (facultatif)](#uilanguagespath-optional)
  - [`concurrency` (facultatif)](#concurrency-optional)
  - [`batchConcurrency` (facultatif)](#batchconcurrency-optional)
  - [`batchSize` / `maxBatchChars` (facultatif)](#batchsize--maxbatchchars-optional)
  - [`openrouter`](#openrouter)
  - [`features`](#features)
  - [`ui`](#ui)
  - [`cacheDir`](#cachedir)
  - [`documentations`](#documentations)
  - [`svg` (facultatif)](#svg-optional)
  - [`glossary`](#glossary)
- [Référence CLI](#cli-reference)
- [Variables d'environnement](#environment-variables)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="installation"></a>
## Installation

Le package publié est **ESM uniquement**. Utilisez `import`/`import()` dans Node.js ou votre outil d'empaquetage ; n'utilisez pas `require('ai-i18n-tools')`.

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

ai-i18n-tools inclut son propre extracteur de chaînes. Si vous avez précédemment utilisé `i18next-scanner`, `babel-plugin-i18next-extract` ou des outils similaires, vous pouvez supprimer ces dépendances de développement après la migration.

Définissez votre clé API OpenRouter :

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Ou créez un fichier `.env` à la racine du projet :

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

<a id="quick-start"></a>
## Démarrage rapide

Le modèle `init` par défaut (`ui-markdown`) active uniquement l'extraction et la traduction **UI**. Le modèle `ui-docusaurus` active la traduction de **documents** (`translate-docs`). Utilisez `sync` lorsque vous souhaitez une seule commande qui exécute l'extraction, la traduction UI, la traduction SVG autonome (facultative) et la traduction de documentation selon votre configuration.

```bash
# Workflow 1 - UI strings (default template enables extract + translate-ui)
npx ai-i18n-tools init
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui

# Workflow 2 - docs (Docusaurus-oriented template)
npx ai-i18n-tools init -t ui-docusaurus
npx ai-i18n-tools translate-docs

# Combined: extract UI strings, then translate UI + SVG + docs (per config features)
npx ai-i18n-tools sync

# Translation status (UI strings per locale; markdown per file × locale in chunked tables)
npx ai-i18n-tools status
# npx ai-i18n-tools status --max-columns 12   # wider tables, fewer chunks
```

<a id="recommended-packagejson-scripts"></a>
### Scripts `package.json` recommandés

Une fois le package installé localement, vous pouvez utiliser directement les commandes CLI dans les scripts (pas besoin de `npx`) :

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate": "ai-i18n-tools translate-ui && ai-i18n-tools translate-svg && ai-i18n-tools translate-docs",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:status": "ai-i18n-tools status",
  "i18n:editor": "ai-i18n-tools editor",
  "i18n:cleanup": "ai-i18n-tools cleanup"
}
```

---

<a id="workflow-1---ui-translation"></a>
## Flux de travail 1 - Traduction de l'interface utilisateur

Conçu pour tout projet JS/TS utilisant i18next : applications React, Next.js (composants client et serveur), services Node.js, outils CLI.

<a id="step-1-initialise"></a>
### Étape 1 : Initialiser

```bash
npx ai-i18n-tools init
```

Cela écrit `ai-i18n-tools.config.json` avec le modèle `ui-markdown`. Modifiez-le pour définir :

- `sourceLocale` - votre code BCP-47 de langue source (par exemple `"en-GB"`). **Doit correspondre** à `SOURCE_LOCALE` exporté depuis votre fichier de configuration i18n au moment de l'exécution (`src/i18n.ts` / `src/i18n.js`).
- `targetLocales` - tableau de codes BCP-47 pour vos langues cibles (par exemple `["de", "fr", "pt-BR"]`). Exécutez `generate-ui-languages` pour créer le manifeste `ui-languages.json` à partir de cette liste.
- `ui.sourceRoots` - répertoires à analyser pour les appels `t("…")` (par exemple `["src/"]`).
- `ui.stringsJson` - emplacement où écrire le catalogue principal (par exemple `"src/locales/strings.json"`).
- `ui.flatOutputDir` - emplacement où écrire `de.json`, `pt-BR.json`, etc. (par exemple `"src/locales/"`).
- `ui.preferredModel` (facultatif) - identifiant du modèle OpenRouter à essayer **en premier** uniquement pour `translate-ui` ; en cas d'échec, la CLI continue avec `openrouter.translationModels` (ou l'ancien `defaultModel` / `fallbackModel`) dans l'ordre, en sautant les doublons.

<a id="step-2-extract-strings"></a>
### Étape 2 : Extraire les chaînes

```bash
npx ai-i18n-tools extract
```

Analyse tous les fichiers JS/TS situés dans `ui.sourceRoots` à la recherche des appels `t("literal")` et `i18n.t("literal")`. Écrit (ou fusionne dans) `ui.stringsJson`.

L'analyseur est configurable : ajoutez des noms de fonctions personnalisés via `ui.reactExtractor.funcNames`.

<a id="step-3-translate-ui-strings"></a>
### Étape 3 : Traduire les chaînes d'interface

```bash
npx ai-i18n-tools translate-ui
```

Lit `strings.json`, envoie des lots à OpenRouter pour chaque langue cible, puis écrit des fichiers JSON plats (`de.json`, `fr.json`, etc.) dans `ui.flatOutputDir`. Lorsque `ui.preferredModel` est défini, ce modèle est tenté en premier, avant la liste ordonnée dans `openrouter.translationModels` (les autres commandes, comme la traduction de documents, utilisent toujours uniquement `openrouter`).

Pour chaque entrée, `translate-ui` stocke l'**identifiant du modèle OpenRouter** ayant correctement traduit chaque langue dans un objet `models` facultatif (avec les mêmes clés de langue que `translated`). Les chaînes modifiées via la commande locale `editor` sont marquées avec la valeur sentinelle `user-edited` dans `models` pour cette langue. Les fichiers plats par langue situés dans `ui.flatOutputDir` restent au format **chaîne source → traduction** uniquement ; ils n'incluent pas `models` (ainsi, les bundles au moment de l'exécution restent inchangés).

> **Remarque sur l'utilisation de l'éditeur de cache :** Si vous modifiez une entrée dans l'éditeur de cache, vous devez exécuter une commande `sync --force-update` (ou la commande équivalente `translate` avec `--force-update`) pour réécrire les fichiers de sortie avec l'entrée de cache mise à jour. De plus, gardez à l'esprit que si le texte source change ultérieurement, votre modification manuelle sera perdue, car une nouvelle clé de cache (hachage) sera générée pour la nouvelle chaîne source.

<a id="exporting-to-xliff-20-optional"></a>
### Exporter vers XLIFF 2.0 (facultatif)

Pour transmettre les chaînes d'interface à un prestataire de traduction, un système de gestion de la traduction (TMS) ou un outil CAT, exportez le catalogue au format **XLIFF 2.0** (un fichier par langue cible). Cette commande est **en lecture seule** : elle ne modifie pas `strings.json` ni n'appelle aucune API.

```bash
npx ai-i18n-tools export-ui-xliff
```

Par défaut, les fichiers sont écrits à côté de `ui.stringsJson`, avec des noms comme `strings.de.xliff`, `strings.pt-BR.xliff` (nom de base de votre catalogue + langue + `.xliff`). Utilisez `-o` / `--output-dir` pour écrire ailleurs. Les traductions existantes provenant de `strings.json` apparaissent dans `<target>` ; les langues manquantes utilisent `state="initial"` sans `<target>`, afin que les outils puissent les compléter. Utilisez `--untranslated-only` pour n'exporter que les unités nécessitant encore une traduction pour chaque langue (pratique pour les lots envoyés aux prestataires). `--dry-run` affiche les chemins sans écrire les fichiers.

<a id="step-4-wire-i18next-at-runtime"></a>
### Étape 4 : Intégrer i18next au moment de l'exécution

Créez votre fichier de configuration i18n en utilisant les utilitaires exportés par `'ai-i18n-tools/runtime'` :

```js
// src/i18n.js or src/i18n.ts — use ../locales and ../public/locales instead of ./ when this file is under src/
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import aiI18n from 'ai-i18n-tools/runtime';

// Project locale files — paths must match `ui` in ai-i18n-tools.config.json (paths there are relative to the project root).
import uiLanguages from './locales/ui-languages.json'; // `ui.uiLanguagesPath` (defaults to `{ui.flatOutputDir}/ui-languages.json`)
import stringsJson from './locales/strings.json'; // `ui.stringsJson`
import sourcePluralFlat from './public/locales/en-GB.json'; // `{ui.flatOutputDir}/{SOURCE_LOCALE}.json` from translate-ui

// Must match `sourceLocale` in ai-i18n-tools.config.json (same string as in the import path above)
export const SOURCE_LOCALE = 'en-GB';

// initialise i18n with the default options
void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));

// set up the key-as-default translation
aiI18n.setupKeyAsDefaultT(i18n, {
  stringsJson,
  sourcePluralFlatBundle: { lng: SOURCE_LOCALE, bundle: sourcePluralFlat },
});

// apply the direction to the i18n instance
i18n.on('languageChanged', aiI18n.applyDirection);
aiI18n.applyDirection(i18n.language);

// create the locale loaders
const localeLoaders = aiI18n.makeLocaleLoadersFromManifest(
  uiLanguages,
  SOURCE_LOCALE,
  (code) => () => import(`./locales/${code}.json`),
);

// create the loadLocale function
export const loadLocale = aiI18n.makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);

// export the i18n instance
export default i18n;
```

<!--
  Translate-docs note: paragraphs here stack many `bold` / `` `code` `` patterns (nested backticks, long sentences).
  Some target locales fail AST-style validation; see "Complex Markdown and failed quality checks" under Workflow 2 — simplify source rather than forcing literal markup parity.
-->

**Gardez trois valeurs alignées :** `sourceLocale` dans `ai-i18n-tools.config.json`, `SOURCE_LOCALE` dans ce fichier, et le JSON plat pluriel que `translate-ui` écrit comme `{sourceLocale}.json` dans votre répertoire de sortie plat (souvent `public/locales/`). Utilisez ce même nom de base dans le fichier statique `import` (exemple ci-dessus : `en-GB` → `en-GB.json`). Le champ `lng` dans `sourcePluralFlatBundle` doit être égal à `SOURCE_LOCALE`. Les chemins ES statiques `import` ne peuvent pas utiliser de variables ; si vous modifiez la langue source, mettez à jour `SOURCE_LOCALE` et le chemin d'importation ensemble. Sinon, chargez ce fichier avec un `import(\` dynamique ./public/locales/${SOURCE_LOCALE}.json\`)`, `fetch`, ou `readFileSync` afin que le chemin soit construit à partir de `SOURCE_LOCALE`.

L'extrait utilise `./locales/…` et `./public/locales/…` comme si `i18n` était placé à côté de ces dossiers. Si votre fichier se trouve dans `src/` (cas typique), utilisez `../locales/…` et `../public/locales/…` pour que les imports correspondent aux mêmes chemins que `ui.stringsJson`, `uiLanguagesPath` et `ui.flatOutputDir`.

Importez `i18n.js` avant que React ne rende (par exemple, en haut de votre point d'entrée). Lorsque l'utilisateur change de langue, appelez `await loadLocale(code)`, puis `i18n.changeLanguage(code)`.

Gardez `localeLoaders` **aligné avec la configuration** en les dérivant de `ui-languages.json` à l'aide de `makeLocaleLoadersFromManifest` (cela filtre `SOURCE_LOCALE` en utilisant la même normalisation que `makeLoadLocale`). Lorsque vous ajoutez une langue à `targetLocales` et exécutez `generate-ui-languages`, le manifeste est mis à jour et vos chargeurs suivent automatiquement le changement — il n'est pas nécessaire de maintenir une carte codée en dur séparée.

Si vos bundles JSON se trouvent dans `public/` (configuration Next.js typique), implémentez chaque chargeur pour récupérer le fichier depuis votre chemin d'URL publique, par exemple :

```js
(code) => () => fetch(`/locales/${code}.json`).then(res => res.json())
```

Cela permet au navigateur de charger le JSON statique.

Pour les CLI Node sans emballeur, utilisez `readFileSync` dans une petite fonction d'assistance `makeFileLoader` qui lit et analyse le fichier JSON pour chaque code.

`SOURCE_LOCALE` est exporté afin que tout autre fichier qui en a besoin (par exemple, un sélecteur de langue) puisse l'importer directement depuis `'./i18n'`. Si vous migrez une configuration i18next existante, remplacez toutes les chaînes de langue source en dur (par exemple, des vérifications comme `'en-GB'` disséminées dans les composants) par des importations de `SOURCE_LOCALE` depuis votre fichier d'initialisation i18n.

Les importations nommées (`import { defaultI18nInitOptions, … } from 'ai-i18n-tools/runtime'`) fonctionnent de la même manière si vous préférez ne pas utiliser l'export par défaut.

`aiI18n.defaultI18nInitOptions(sourceLocale)` (ou `defaultI18nInitOptions(sourceLocale)` lorsqu'il est importé par son nom) renvoie les options standard pour les configurations où la clé sert de valeur par défaut :

- `parseMissingKeyHandler` renvoie la clé elle-même, de sorte que les chaînes non traduites affichent le texte source.
- `nsSeparator: false` autorise les clés contenant des deux-points.
- `interpolation.escapeValue: false` - sécurisé à désactiver : React échappe les valeurs lui-même, et la sortie Node.js/CLI ne contient aucun HTML à échapper.

`setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` est le câblage **recommandé** pour les projets ai-i18n-tools : il applique le retrait des clés + la substitution d'interpolation <code>{"{{var}}"}</code> pour la langue source (comportement identique à celui de `wrapI18nWithKeyTrim` de niveau inférieur), fusionne éventuellement les clés plurielles suffixées `translate-ui` `{sourceLocale}.json` via `addResourceBundle`, puis installe `wrapT` prenant en compte le pluriel à partir de votre `strings.json`. Ce fichier groupé doit être le format plat pluriel pour votre langue source **configurée** — le même `sourceLocale` que dans `ai-i18n-tools.config.json` et `SOURCE_LOCALE` dans votre amorçage i18n (voir Étape 4 ci-dessus). Omettez `sourcePluralFlatBundle` uniquement pendant l'amorçage (fusionnez-le une fois que `translate-ui` a émis `{sourceLocale}.json`). `wrapI18nWithKeyTrim` seul est **déconseillé** pour le code applicatif — utilisez plutôt `setupKeyAsDefaultT`.

`makeLoadLocale(i18n, loaders, sourceLocale)` renvoie une fonction `loadLocale(lang)` asynchrone qui importe dynamiquement le bundle JSON pour une langue donnée et l'enregistre auprès d'i18next.

<a id="using-t-in-source-code"></a>
### Utilisation de `t()` dans le code source

Appelez `t()` avec une **chaîne littérale** afin que le script d'extraction puisse la repérer :

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <button>{t('Save')}</button>;
}
```

Le même modèle fonctionne en dehors de React (Node.js, composants serveur, CLI) :

```js
import i18n from './i18n.js';
console.log(i18n.t('Processing complete'));
```

**Règles :**

- Seules ces formes sont extraites : `t("…")`, `t('…')`, `t(`…`)`, `i18n.t("…")`.
- La clé doit être une **chaîne littérale** — aucune variable ou expression ne peut servir de clé.
- N'utilisez pas de littéraux de gabarit (template literals) pour la clé : <code>{'t(`Hello ${name}`)'}</code> n'est pas extractible.

<a id="interpolation"></a>
### Interpolation

Utilisez l'interpolation native d'i18next via le deuxième argument pour les espaces réservés <code>{"{{var}}"}</code> :

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

La commande extract analyse le **deuxième argument** lorsqu'il s'agit d'un objet littéral simple et lit des indicateurs dédiés aux outils tels que `plurals: true` et `zeroDigit` (voir **Pluriels cardinaux** ci-dessous). Pour les chaînes ordinaires, seule la clé littérale est utilisée pour le hachage ; les options d'interpolation sont tout de même transmises à i18next au moment de l'exécution.

Si votre projet utilise un utilitaire d'interpolation personnalisé (par exemple, appel de `t('key')` puis passage du résultat à une fonction de modèle comme `interpolateTemplate(t('Hello {{name}}'), { name })`), `setupKeyAsDefaultT` (via `wrapI18nWithKeyTrim`) rend cela inutile — il applique l'interpolation <code>{"{{var}}"}</code> même lorsque la langue source renvoie la clé brute. Migrez les appels vers `t('Hello {{name}}', { name })` et supprimez l'utilitaire personnalisé.

<a id="cardinal-plurals-plurals-true"></a>
### Pluriels cardinaux (`plurals: true`)

Utilisez le **même littéral** que vous souhaitez comme texte par défaut pour les développeurs, et passez `plurals: true` afin que extract + `translate-ui` traitent l'appel comme un **groupe pluriel cardinal** (formes `_zero` … `_other` au style i18next JSON v4).

```tsx
{t('{{count}} items in your cart', { plurals: true, count: n })}
```

- `zeroDigit` (facultatif) — uniquement pour les outils ; **non** lu par i18next. Lorsque `true`, les invites privilégient un `0` arabe littéral dans la chaîne `_zero` pour chaque langue où cette forme existe ; lorsque `false` ou omis, une formulation naturelle pour le zéro est utilisée. Supprimez ces clés avant d'appeler `i18next.t` (voir `wrapT` ci-dessous).

**Validation :** Si le message contient **deux ou plusieurs** espaces réservés `{{…}}` distincts, **l'un d'eux doit être `{{count}}`** (l'axe pluriel). Sinon, la validation `extract` **échoue** avec un message clair indiquant le fichier et la ligne.

**Deux compteurs indépendants** (par exemple, sections et pages) ne peuvent pas partager un même message pluriel — utilisez **deux** appels à `t()` (chacun avec `plurals: true` et son propre `count`) et concaténez-les dans l'interface utilisateur.

**Dans** `strings.json`, les groupes pluriels utilisent **une ligne par hachage** avec `"plural": true`, le littéral d'origine dans `source`, et `translated[locale]` sous forme d'objet mappant les catégories cardinales (`zero`, `one`, `two`, `few`, `many`, `other`) aux chaînes de caractères correspondant à ce paramètre régional.

**JSON plat par langue :** Les lignes non plurielles restent **phrase source → traduction**. Les lignes plurielles sont émises sous forme de `<groupId>_original` (égal à `source`, à titre de référence) et de `<groupId>_<form>` pour chaque suffixe, afin qu’i18next puisse résoudre les pluriels nativement. `translate-ui` écrit également `{sourceLocale}.json` contenant **uniquement** les clés plurielles plates (chargez ce bundle pour la langue source afin que les clés suffixées soient résolues ; les chaînes simples utilisent toujours la clé comme valeur par défaut). Pour chaque langue cible, les clés suffixées émises correspondent à `Intl.PluralRules` pour cette langue (`requiredCldrPluralForms`) : si `strings.json` a omis une catégorie car elle correspondait à une autre après compactage (par exemple, le `many` arabe identique à `other`), `translate-ui` écrit quand même chaque suffixe requis dans le fichier plat en le copiant depuis une chaîne de secours, afin qu'aucune clé ne soit manquée lors de la recherche au runtime.

Runtime (`ai-i18n-tools/runtime`) : **Appelez** `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle })` — cela exécute `wrapI18nWithKeyTrim`, enregistre le bundle pluriel facultatif `translate-ui` `{sourceLocale}.json`, puis `wrapT` en utilisant `buildPluralIndexFromStringsJson(stringsJson)`. `wrapT` supprime `plurals` / `zeroDigit`, réécrit la clé vers l'identifiant du groupe si nécessaire, et transmet `count` (facultatif : s'il existe un seul espace réservé non-`{{count}}`, `count` est copié depuis cette option numérique).

**Environnements anciens :** `Intl.PluralRules` est requis pour les outils et pour un comportement cohérent ; utilisez un polyfill si vous ciblez des navigateurs très anciens.

**Non inclus en v1 :** pluriels ordinaux (`_ordinal_*`, `ordinal: true`), pluriels par intervalle, pipelines uniquement ICU.

<a id="language-switcher-ui"></a>
### Interface de changement de langue

Utilisez le manifeste `ui-languages.json` pour créer un sélecteur de langue. `ai-i18n-tools` exporte deux utilitaires d'affichage :

```tsx
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getUILanguageLabel,
  getUILanguageLabelNative,
  type UiLanguageEntry,
} from 'ai-i18n-tools/runtime';
import uiLanguages from './locales/ui-languages.json';
import { loadLocale } from './i18n';

function LanguageSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  const { t, i18n } = useTranslation();

  const options = useMemo(
    () =>
      (uiLanguages as UiLanguageEntry[]).map((lang) => ({
        code: lang.code,
        // Settings/content dropdowns: shows translated name when available
        label: getUILanguageLabel(lang, t),
        // Header globe menu: shows "English / Deutsch"-style label, no t() call
        nativeLabel: getUILanguageLabelNative(lang),
      })),
    [t]
  );

  const handleChange = async (code: string) => {
    await loadLocale(code);
    i18n.changeLanguage(code);
    onChange(code);
  };

  return (
    <select value={value} onChange={(e) => handleChange(e.target.value)}>
      {options.map((row) => (
        <option key={row.code} value={row.code}>
          {row.label}
        </option>
      ))}
    </select>
  );
}
```

`getUILanguageLabel(lang, t)` - affiche `t(englishName)` lorsqu'il est traduit, ou `englishName / t(englishName)` lorsque les deux diffèrent. Convient pour les écrans de paramètres.

`getUILanguageLabelNative(lang)` - affiche `englishName / label` (aucun appel `t()` sur chaque ligne). Convient pour les menus d'en-tête où vous souhaitez que le nom natif soit visible.

Le manifeste `ui-languages.json` est un tableau JSON d'entrées <code>{"{ code, label, englishName, direction }"}</code> (`direction` est `"ltr"` ou `"rtl"`). Exemple :

```json
[
  { "code": "en-GB", "label": "English (UK)", "englishName": "English (UK)", "direction": "ltr" },
  { "code": "pt-BR", "label": "Português (BR)", "englishName": "Portuguese (BR)", "direction": "ltr" },
  { "code": "de",    "label": "Deutsch",        "englishName": "German", "direction": "ltr" },
  { "code": "fr",    "label": "Français",       "englishName": "French", "direction": "ltr" },
  { "code": "ar",    "label": "العربية",         "englishName": "Arabic", "direction": "rtl" }
]
```

Le manifeste est généré par `generate-ui-languages` à partir de `sourceLocale` + `targetLocales` et du catalogue maître intégré. Il est écrit dans `ui.flatOutputDir`. Si vous modifiez l'un des paramètres régionaux dans la configuration, exécutez `generate-ui-languages` pour mettre à jour le fichier `ui-languages.json`.

<a id="rtl-languages"></a>
### Langues de droite à gauche

`ai-i18n-tools` exporte `getTextDirection(lng)` et `applyDirection(lng)` :

```js
import { getTextDirection, applyDirection } from 'ai-i18n-tools/runtime';

getTextDirection('ar')    // 'rtl'
getTextDirection('en-GB') // 'ltr'

// Applied automatically via i18n.on('languageChanged', applyDirection) - see Step 4
```

`applyDirection` définit `document.documentElement.dir` (navigateur) ou n'effectue aucune opération (Node.js). Passez un argument `element` facultatif pour cibler un élément spécifique.

Pour les chaînes pouvant contenir des flèches `→`, inversez-les dans les mises en page RTL :

```js
import { flipUiArrowsForRtl } from 'ai-i18n-tools/runtime';
const { i18n } = useTranslation();
const isRtl = getTextDirection(i18n.language) === 'rtl';
const label = flipUiArrowsForRtl(t('Next → Step'), isRtl);
```

---

<a id="workflow-2---document-translation"></a>
## Flux de travail 2 - Traduction de documents

Conçu pour la documentation en markdown, les sites Docusaurus et les fichiers d'étiquettes JSON. Les ressources SVG autonomes sont traduites via [`translate-svg`](#cli-reference) lorsque `features.translateSVG` est activé et que le bloc `svg` de niveau supérieur est défini — et non via `documentations[].contentPaths`.

<a id="step-1-initialise-for-documentation"></a>
### Étape 1 : Initialiser pour la documentation

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

Modifiez le fichier `ai-i18n-tools.config.json` généré :

- `sourceLocale` - langue source (doit correspondre à `defaultLocale` dans `docusaurus.config.js`).
- `targetLocales` - tableau de codes de localité BCP-47 (par exemple `["de", "fr", "es"]`).
- `cacheDir` - répertoire de cache SQLite partagé pour tous les pipelines de documentation (et répertoire de journalisation par défaut pour `--write-logs`).
- `documentations` - tableau de blocs de documentation. Chaque bloc possède des champs facultatifs `description`, `contentPaths`, `outputDir`, `jsonSource` facultatif, `markdownOutput`, `segmentSplitting` facultatif, `targetLocales`, `addFrontmatter`, etc.
- `documentations[].description` - note courte facultative destinée aux mainteneurs (ce que couvre ce bloc). Lorsqu'elle est définie, elle apparaît dans le titre `translate-docs` (`🌐 …: translating …`) et dans les en-têtes de section `status`.
- `documentations[].contentPaths` - répertoires ou fichiers sources en markdown/MDX (voir aussi `documentations[].jsonSource` pour les libellés JSON).
- `documentations[].outputDir` - racine de sortie traduite pour ce bloc.
- `documentations[].markdownOutput.style` - `"nested"` (par défaut), `"docusaurus"` ou `"flat"` (voir [Dispositions de sortie](#output-layouts)).

<a id="step-2-translate-documents"></a>
### Étape 2 : Traduire les documents

```bash
npx ai-i18n-tools translate-docs
```

Cela traduit tous les fichiers de chaque bloc `documentations` vers `contentPaths` dans toutes les langues de documentation effectives (union des `targetLocales` de chaque bloc s'ils sont définis, sinon `targetLocales` racine). Les segments déjà traduits sont servis depuis le cache SQLite — seuls les segments nouveaux ou modifiés sont envoyés au LLM.

Pour traduire une seule langue :

```bash
npx ai-i18n-tools translate-docs --locale de
```

Pour vérifier ce qui doit être traduit :

```bash
npx ai-i18n-tools status
```

<a id="complex-markdown-and-failed-quality-checks"></a>
#### Markdown complexe et échecs des contrôles de qualité

`translate-docs` vérifie que chaque segment traduit préserve la structure markdown (y compris l'accentuation analysée depuis le document). Les paragraphes qui accumulent de nombreux éléments `bold` autour de `` `inline code` ``, imbriquent des backticks dans du gras (par exemple des littéraux de gabarits comme `` `fetch(\`/locales/${code}.json\`)` ``), ou entrelacent gras et code dans une longue phrase sont fragiles : certaines langues nécessitent un ordre différent des mots, ce qui peut modifier l'alignement de `**` et `` ` `` après traduction et déclencher des erreurs CLI telles que `AST mismatch`.

**Si vous rencontrez ce type d'échec de validation, privilégiez la simplification du texte source** — divisez le paragraphe, déplacez un exemple dans un bloc de code délimité, ou décrivez la même idée avec moins de paires imbriquées de gras/code — plutôt que d'attendre de chaque modèle et langue qu'ils reproduisent parfaitement un balisage en ligne dense. Ailleurs sur cette page (notamment dans les notes de l'étape 4 sur `SOURCE_LOCALE`, les chargeurs et les chemins `public/`), le formatage est intentionnellement réaliste ; lorsque vous réutilisez des formulations similaires dans vos propres documents, simplifiez-les lorsque vous traduisez pour un large public.

Pour voir **quels segments ont échoué**, combien de fois, et les **messages d'erreur / de qualité** stockés, utilisez l'onglet **Échecs** de l'Éditeur de cache de traduction ([Éditeur de cache de traduction → Échecs](#translation-cache-editor-failures)).

<a id="cache-behaviour-and-translate-docs-flags"></a>
#### Comportement du cache et indicateurs `translate-docs`

L'interface en ligne de commande (CLI) conserve le **suivi des fichiers** dans SQLite (hachage source par fichier × langue) et des lignes de **segment** (hachage × langue par fragment traduisible). Une exécution normale ignore entièrement un fichier lorsque le hachage suivi correspond à la source actuelle **et** que le fichier de sortie existe déjà ; sinon, elle traite le fichier et utilise le cache de segments afin que le texte inchangé n'appelle pas l'API.

| Drapeau                          | Effet                                                                                                                                                                                                                                                                  |
|-------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| *(par défaut)*                   | Ignorer les fichiers inchangés lorsque le suivi et la sortie sur disque correspondent ; utiliser le cache de segments pour le reste.                                                                                                                                                                              |
| `-l, --locale <codes>`        | Langues cibles séparées par des virgules (lorsqu'omis, les valeurs par défaut correspondent à l'union de `targetLocales` racine et des `targetLocales` optionnels de chaque bloc `documentations[]`).                                                                                                                                                          |
| `-p, --path` / `-f, --file`   | Ne traduire que le markdown/JSON situé sous ce chemin (relatif au projet ou absolu) ; `--file` est un alias pour `--path`.                                                                                                                                                         |
| `--dry-run`                   | Aucune écriture de fichier ni appel d'API.                                                                                                                                                                                                                                        |
| `--type <kind>`               | Limiter à `markdown` ou `json` (sinon les deux si activé dans la configuration).                                                                                                                                                                                               |
| `--json-only` / `--no-json`   | Traduire uniquement les fichiers de libellés JSON, ou ignorer JSON et traduire uniquement le markdown.                                                                                                                                                                                              |
| `-j, --concurrency <n>`       | Nombre maximal de langues cibles en parallèle (valeur par défaut issue de la configuration ou de la CLI).                                                                                                                                                                                              |
| `-b, --batch-concurrency <n>` | Nombre maximal d'appels API par lot par fichier (docs ; valeur par défaut issue de la configuration ou de la CLI).                                                                                                                                                                                               |
| `--emphasis-placeholders`     | Masquer les marqueurs d'accentuation markdown en tant que placeholders avant traduction (facultatif ; désactivé par défaut).                                                                                                                                                                              |
| `--debug-failed`              | Écrire des journaux détaillés `FAILED-TRANSLATION` dans `cacheDir` en cas d'échec de validation.                                                                                                                                                                                        |
| `--force-update`              | Traiter à nouveau chaque fichier correspondant (extraction, réassemblage, écriture des sorties) même si le suivi des fichiers aurait dû le sauter. **Le cache de segments s'applique toujours** — les segments inchangés ne sont pas envoyés au LLM.                                                                                    |
| `--force`                     | Efface le suivi des fichiers pour chaque fichier traité et **ne lit pas** le cache de segments pour la traduction API (retraduction complète). Les nouveaux résultats sont néanmoins **écrits** dans le cache de segments.                                                                                 |
| `--stats`                     | Affiche les nombres de segments, le nombre de fichiers suivis et les totaux de segments par langue, puis quitte.                                                                                                                                                                                    |
| `--clear-cache [locale]`      | Supprime les traductions mises en cache (et le suivi des fichiers) : toutes les langues, ou une seule langue, puis quitte.                                                                                                                                                                             |
| `--prompt-format <mode>`      | Comment chaque **lot** de segments est envoyé au modèle et analysé (`xml`, `json-array` ou `json-object`). Par défaut `json-array`. Ne modifie pas l'extraction, les espaces réservés, la validation, le cache ou le comportement de secours — voir [Format de l'invite par lot](#batch-prompt-format). |

Vous ne pouvez pas combiner `--force` avec `--force-update` (ils sont mutuellement exclusifs).

<a id="batch-prompt-format"></a>
#### Format des invites par lots

`translate-docs` envoie les segments traduisibles à OpenRouter par **lots** (groupés par `batchSize` / `maxBatchChars`). Le drapeau `--prompt-format` modifie uniquement le **format sur le réseau** de ce lot ; les jetons `PlaceholderHandler`, les vérifications AST markdown, les clés de cache SQLite et le secours par segment en cas d'échec d'analyse par lot restent inchangés.

| Mode                       | Message utilisateur                                                           | Réponse du modèle                                                 |
|----------------------------|------------------------------------------------------------------------|-------------------------------------------------------------|
| `xml`                  | Pseudo-XML : un `<seg id="N">…</seg>` par segment (avec échappement XML). | Uniquement des blocs `<t id="N">…</t>`, un par index de segment.       |
| `json-array` (par défaut) | Un tableau JSON de chaînes, une entrée par segment, dans l'ordre.               | Un tableau JSON de la **même longueur** (même ordre).           |
| `json-object`          | Un objet JSON `{"0":"…","1":"…",…}` indexé par l'index du segment.            | Un objet JSON avec les **mêmes clés** et des valeurs traduites. |

L'en-tête de l'exécution imprime également `Batch prompt format: …` afin que vous puissiez confirmer le mode actif. Les fichiers d'étiquettes JSON (`jsonSource`) et les lots SVG autonomes utilisent le même paramètre lorsque ces étapes s'exécutent dans le cadre de `translate-docs` (ou de la phase de documentation de `sync` — `sync` n'expose pas ce drapeau ; il prend par défaut la valeur `json-array`).

<a id="segment-dedupe-and-paths-in-sqlite"></a>
#### Déduplication des segments et chemins dans SQLite

- Les lignes de segment sont indexées globalement par `(source_hash, locale)` (hachage = contenu normalisé). Un même texte dans deux fichiers partage une seule ligne ; `translations.filepath` est un métadonnée (dernier rédacteur), pas une entrée de cache supplémentaire par fichier.
- `file_tracking.filepath` utilise des clés avec espace de noms : `doc-block:{index}:{relPath}` par bloc `documentations` (`relPath` est un chemin posix relatif à la racine du projet : les chemins markdown tels que collectés ; **les fichiers d'étiquettes JSON utilisent le chemin relatif au répertoire courant du fichier source**, par exemple `docs-site/i18n/en/code.json`, afin que le nettoyage puisse résoudre le fichier réel), et `svg-assets:{relPath}` pour les ressources SVG autonomes situées sous `translate-svg`.
- `translations.filepath` stocke les chemins posix relatifs au répertoire courant pour les segments markdown, JSON et SVG (SVG utilise la même forme de chemin que les autres ressources ; le préfixe `svg-assets:…` est **uniquement** sur `file_tracking`).
- Après une exécution, `last_hit_at` est effacé uniquement pour les lignes de segment **dans la même portée de traduction** (en respectant `--path` et les types activés) qui n'ont pas été touchées, ainsi une exécution filtrée ou uniquement docs n'indique pas comme obsolètes les fichiers non concernés.

<a id="output-layouts"></a>
### Dispositions de sortie

`"nested"` (par défaut lorsqu'omis) — reflète l'arborescence source sous `{outputDir}/{locale}/` (par exemple, `docs/guide.md` → `i18n/de/docs/guide.md`).

`"docusaurus"` — place les fichiers situés sous `docsRoot` dans `i18n/<locale>/docusaurus-plugin-content-docs/current/<relativeToDocsRoot>`, conformément à la disposition i18n Docusaurus habituelle. Définissez `documentations[].markdownOutput.docsRoot` sur la racine source de votre documentation (par exemple, `"docs"`).

```text
docs/guide.md         → i18n/de/docusaurus-plugin-content-docs/current/guide.md
i18n/en/sidebar.json  → i18n/de/sidebar.json  (JSON label files)
```

`"flat"` - place les fichiers traduits à côté du fichier source avec un suffixe de langue, ou dans un sous-répertoire. Les liens relatifs entre pages sont réécrits automatiquement.

```text
docs/guide.md → i18n/guide.de.md
```

<a id="anchor-links-in-flat-layout"></a>
#### Liens d'ancre dans la disposition plate

La sortie plate réécrit les **chemins relatifs** entre les pages pour chaque langue (`guide.md` → `guide.de.md`). Les **liens d'ancre** — la forme habituelle en ligne dans le markdown avec un `#` après le chemin — permettent de sauter vers une section à l'intérieur du fichier cible :

```markdown
Read the [installation checklist](../setup.md#first-run) before you deploy.
```

Ici, la cible du lien est `setup.md`, et `#first-run` est l'ancre : elle doit faire défiler jusqu'au bon titre à l'intérieur de ce fichier.

**Pourquoi les liens d'ancre nécessitent une attention particulière**

- `rewriteRelativeLinks` fixe le **nom de fichier** pour chaque langue (`setup.md` → `setup.de.md`).
- De nombreux moteurs de rendu dérivent le slug `#` du **texte visible du titre**. Après traduction, les titres diffèrent selon la langue, donc un slug généré automatiquement peut changer alors que le lien réécrit pourrait toujours indiquer `#first-run` — ou bien votre ancre anglaise `#…` ne correspond plus au slug que le moteur construit à partir du titre traduit.
- Résultat : les lecteurs arrivent sur le bon **fichier** mais à la mauvaise **ligne**, ou le navigateur ne trouve aucune correspondance pour le titre.

**Que faire**

1. Exécutez `ai-i18n-tools write-heading-ids` sur votre `.md` **source** / `.mdx` **avant** `translate-docs` (même `documentations[]` / `contentPaths` que d'habitude). Cet outil insère des ancres HTML explicites sur la ligne précédant chaque en-tête, afin que les valeurs `id` soient partagées par chaque version traduite.  
2. Faites pointer vos **liens d’ancre** Markdown vers ces identifiants stables, par exemple `[label](../other.md#section-id)`, où `section-id` correspond exactement à l’ancre insérée par l’outil — et non à une déduction basée uniquement sur les mots anglais.

**Exemple**

`docs/overview.md`:

```markdown
See [TLS setup](../security.md#tls-configuration) for certificate steps.
```

`docs/security.md` après `write-heading-ids` (simplifié) :

```markdown
<a id="tls-configuration"></a>
## TLS configuration

Your CA and cert steps…
```

Après `translate-docs`, les chemins de fichiers et les ancres `#…` restent alignés dans chaque fichier de langue, par exemple :

```markdown
Siehe [TLS-Einrichtung](../security.de.md#tls-configuration) für die Zertifikatsschritte.
```

L'ancre `#tls-configuration` est identique dans toutes les langues car le `id` est fixé dans la source ; seuls le **texte** du titre et l'**étiquette** du lien sont traduits.

<a id="markdown-output-path-template-placeholders"></a>
#### Espaces réservés `pathTemplate` / `jsonPathTemplate`

Remplacez l'emplacement où les fichiers traduits sont écrits en définissant `documentations[].markdownOutput.pathTemplate` (markdown et MDX) ou `jsonPathTemplate` (fichiers d'étiquettes JSON). Les deux acceptent les mêmes espaces réservés. Les chemins résolus doivent rester à l'intérieur du `outputDir` de ce bloc (l'interface en ligne de commande rejette les chemins qui en sortent).

Si vous utilisez un `pathTemplate` personnalisé, `rewriteRelativeLinks` prend par défaut la valeur `false` sauf si vous le définissez explicitement — la réécriture des liens en mode plat est conçue pour la disposition intégrée `flat`.

| Espace réservé | Rôle | Exemple |
|-------------|------|---------|
| `{outputDir}` | Chemin absolu résolu du `outputDir` de ce bloc de documentation | `/home/acme/repo/i18n` |
| `{locale}` | Code de langue cible (même forme que dans la configuration / CLI) | `de`, `pt-BR` |
| `{LOCALE}` | Même code langue en majuscules | `DE`, `PT-BR` |
| `{relPath}` | Chemin du fichier source relatif à la racine du projet, en notation POSIX `/` | `docs/guide.md`, `README.md` |
| `{stem}` | Nom du fichier **sans** l'extension | `guide` pour `docs/guide.md` |
| `{basename}` | Nom du fichier **avec** l'extension | `guide.md` |
| `{extension}` | Extension **incluant** le point | `.md`, `.mdx` |
| `{docsRoot}` | Chemin absolu résolu de `markdownOutput.docsRoot` (`docs` par défaut si omis) | `/home/acme/repo/docs` |
| `{relativeToDocsRoot}` | `{relPath}` avec le préfixe `docsRoot` correspondant supprimé lorsque les chaînes de chemin coïncident (POSIX) ; sinon inchangé | `docs/guide.md` (courant) ; `guide.md` uniquement lorsque la suppression s'applique |

**Exemple**

Extrait de configuration :

```json
{
  "outputDir": "i18n",
  "markdownOutput": {
    "pathTemplate": "{outputDir}/{locale}/{relPath}"
  }
}
```

Pour la langue `de` et la source `docs/guide.md`, avec un répertoire racine du projet `/home/acme/repo` et `outputDir` résolu en `/home/acme/repo/i18n`, le chemin développé est :

```text
/home/acme/repo/i18n/de/docs/guide.md
```

Un modèle de type `flat` qui conserve uniquement le nom du fichier pourrait utiliser `{stem}` et `{extension}`, par exemple `{outputDir}/{stem}.{locale}{extension}`, ce qui donne `…/guide.de.md` dans le `outputDir` résolu.

---

<a id="combined-workflow-ui--docs"></a>
## Flux de travail combiné (interface utilisateur + documentation)

Activez toutes les fonctionnalités dans une seule configuration pour exécuter les deux flux de travail ensemble :

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-CN"],
  "features": {
    "extractUIStrings": true,
    "translateUIStrings": true,
    "translateMarkdown": true,
    "translateJSON": false,
    "translateSVG": false
  },
  "glossary": {
    "uiGlossary": "src/locales/strings.json",
    "userGlossary": "glossary-user.csv"
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "src/locales/strings.json",
    "flatOutputDir": "src/locales/"
  },
  "cacheDir": ".translation-cache",
  "documentations": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "markdownOutput": { "style": "flat" }
    }
  ]
}
```

`glossary.uiGlossary` oriente la traduction des documents vers le même catalogue `strings.json` que l'interface utilisateur afin que la terminologie reste cohérente ; `glossary.userGlossary` ajoute des remplacements CSV pour les termes du produit.

Exécutez `npx ai-i18n-tools sync` pour lancer un pipeline : **extraire** les chaînes d'interface (si `features.extractUIStrings`), **traduire** les chaînes d'interface (si `features.translateUIStrings`), **traduire les ressources SVG autonomes** (si `features.translateSVG` et un bloc `svg` sont définis), puis **traduire la documentation** (chaque bloc `documentations` : markdown/JSON selon la configuration). Ignorez certaines parties avec `--no-ui`, `--no-svg` ou `--no-docs`. L'étape docs accepte `--dry-run`, `-p` / `--path`, `--force` et `--force-update` (les deux derniers s'appliquent uniquement lorsque la traduction de documentation est lancée ; ils sont ignorés si vous passez `--no-docs`).

Utilisez `documentations[].targetLocales` sur un bloc pour traduire les fichiers de ce bloc vers un **sous-ensemble plus restreint** que l'interface (les langues effectives de la documentation sont l'**union** entre les blocs) :

```json
{
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-CN"],
  "documentations": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "targetLocales": ["de", "fr", "es"]
    }
  ]
}
```

<a id="mixed-documentation-workflow-docusaurus--flat"></a>
### Flux de travail de documentation mixte (Docusaurus + plat)

Vous pouvez combiner plusieurs pipelines de documentation dans la même configuration en ajoutant plusieurs entrées dans `documentations`. C'est une configuration courante lorsqu'un projet dispose d'un site Docusaurus ainsi que de fichiers markdown au niveau racine (par exemple, un fichier readme de dépôt) qui doivent être traduits avec une sortie plate.

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["ar", "es", "fr", "de", "pt-BR"],
  "features": {
    "extractUIStrings": true,
    "translateUIStrings": true,
    "translateMarkdown": true,
    "translateJSON": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "locales/strings.json",
    "flatOutputDir": "public/locales/"
  },
  "cacheDir": ".translation-cache",
  "documentations": [
    {
      "description": "Docusaurus docs and JSON labels",
      "contentPaths": ["docs-site/docs/"],
      "outputDir": "docs-site/i18n",
      "jsonSource": "docs-site/i18n/en",
      "addFrontmatter": true,
      "markdownOutput": {
        "style": "docusaurus",
        "docsRoot": "docs-site/docs"
      }
    },
    {
      "description": "Root README in flat output",
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "markdownOutput": {
        "style": "flat",
        "postProcessing": {
          "languageListBlock": {
            "start": "<small id=\"lang-list\">",
            "end": "</small>",
            "separator": " · ",
            "label": "local"
          }
        }
      }
    }
  ]
}
```

Comment cela s'exécute avec `npx ai-i18n-tools sync` :

- Les chaînes d'interface sont extraites/traduites depuis `src/` vers `public/locales/`.
- Le premier bloc docs traduit les fichiers markdown et les étiquettes JSON selon la disposition Docusaurus `i18n/<locale>/...`.
- Le second bloc docs traduit `README.md` en fichiers plats suffixés par langue sous `translated-docs/`.
- Tous les blocs docs partagent `cacheDir`, de sorte que les segments inchangés sont réutilisés entre les exécutions pour réduire les appels API et les coûts.

---

<a id="translation-cache-editor"></a>
## Éditeur de cache de traduction

Exécutez :

```bash
ai-i18n-tools editor
# Optional: choose port, do not auto-open browser
# ai-i18n-tools editor -p 8765 --no-open
```

Cela démarre une interface web locale alimentée par votre base de données SQLite **`cacheDir`** configurée — le même dossier que celui utilisé par la CLI pour les segments de documentation, les journaux et les métadonnées associées. Elle inclut les onglets **Documentation** (segments de doc mis en cache), **Chaînes d'interface**, **Pluriels d'interface**, **Glossaire**, **Échecs** et **Statistiques**.

Si vous **modifiez des lignes du cache** dans cette application (par exemple des segments de documentation), exécutez `sync --force-update` ou la commande de traduction équivalente avec `--force-update` afin que les sorties sur disque correspondent au cache ; si le **texte source** dans le dépôt change ultérieurement, les hachages des segments changent et les modifications manuelles apportées à l'ancien texte sont remplacées.

<a id="translation-cache-editor-failures"></a>
### Échecs (traduction de la documentation)

L’onglet **Échecs** concerne uniquement la traduction de la **documentation**. Il lit les enregistrements d'échec écrits dans SQLite lorsqu'un segment n'a pas pu être traduit correctement pour une locale — par exemple une sortie de modèle vide ou invalide, des erreurs de validation après traduction (`AST mismatch`, fuites de placeholders, et contrôles de **qualité** similaires), ou une condition **fatale** ayant bloqué l'avancement. Il vous aide à répondre à la question : *quel segment source a échoué, pour quelle locale et quel modèle, et quel message d'erreur a été enregistré ?*

<a id="when-to-use-it"></a>
#### Quand l'utiliser

- Après que `translate-docs` ou `sync` se termine avec des erreurs, des locales partielles ou des journaux peu clairs — vous pouvez trier et filtrer les échecs au lieu de simplement parcourir la sortie du terminal.
- Lorsque vous souhaitez **prioriser les corrections** : triez par **# Échecs** afin que les segments ayant échoué plusieurs fois lors des nouvelles tentatives apparaissent en premier ; ce sont de bons candidats pour être **simplifiés ou reformattés** dans le markdown source afin que les futures exécutions réussissent.
- Lorsque vous avez besoin du **segment exact** — chemin du fichier, indication de ligne, hachage source et texte source complet — pour modifier le bon paragraphe dans votre dépôt.

<a id="why-source-edits-matter"></a>
#### Pourquoi les modifications du code source sont importantes

Un balisage intégré dense (**gras** mélangé à `` `code` ``, emphases imbriquées, phrases longues comportant de nombreux spans) rend plus difficile pour les modèles la production de traductions qui passent encore les contrôles structurels. Les segments ayant **plusieurs échecs enregistrés** s'améliorent généralement davantage par une **réécriture ou une division** du code source (ou en déplaçant les exemples dans des blocs de code délimités) plutôt que par une nouvelle exécution de la traduction sur un texte inchangé. Cela correspond à [Markdown complexe et échecs des contrôles de qualité](#complex-markdown-and-failed-quality-checks).

<a id="how-to-use-the-tab"></a>
#### Comment utiliser l'onglet

1. Ouvrez **Échecs** dans l'éditeur (même session navigateur que [Éditeur de cache de traduction](#translation-cache-editor)).
2. Lisez la barre de **résumé** (segments ayant un échec, ainsi que les comptages pour les segments avec **1**, **2** ou **3+** enregistrements d'échec).
3. Filtrez par **nom de fichier** partiel, **locale**, **modèle**, **erreur de qualité** (valeurs provenant de votre cache), **uniquement les fatals**, et éventuellement par **hachage source**, **texte source** ou sous-chaîne de **message d'erreur** — puis cliquez sur **Appliquer**.
4. Choisissez **Trier : # Échecs** (par défaut) ou **Trier : chemin du fichier + numéro de ligne**.
5. Utilisez la pagination en haut ou en bas du tableau. **Cliquez sur une ligne** pour afficher/masquer le texte source complet. Le contrôle de lien dans la ligne (quand activé) demande au processus serveur de consigner les indications fichier/ligne dans le **terminal** où `ai-i18n-tools editor` est en cours d'exécution — utile pour passer du navigateur à votre éditeur.
6. Corrigez le **fichier source** dans votre projet, puis relancez `translate-docs` ou `sync`. Si la liste semble **obsolète** après une exécution réussie, exécutez `ai-i18n-tools sync --force-update` et rechargez l'éditeur (le panneau Échecs affiche le même indicateur).

Pour le débogage basé sur les fichiers en parallèle de l'interface utilisateur, vous pouvez toujours utiliser `translate-docs --debug-failed` pour écrire les détails `FAILED-TRANSLATION` sous `cacheDir` lors des nouvelles tentatives — voir [Comportement du cache et indicateurs `translate-docs`](#cache-behaviour-and-translate-docs-flags).

---

<a id="configuration-reference"></a>
## Référence de configuration

<a id="sourcelocale"></a>
### `sourceLocale`

Code BCP-47 pour la langue source (par exemple `"en-GB"`, `"en"`, `"pt-BR"`). Aucun fichier de traduction n'est généré pour cette langue — la chaîne clé elle-même est le texte source.

**Doit correspondre** à `SOURCE_LOCALE` exporté depuis votre fichier de configuration i18n au moment de l'exécution (`src/i18n.ts` / `src/i18n.js`).

<a id="targetlocales"></a>
### `targetLocales`

Tableau de codes de langue BCP-47 vers lesquels traduire (par exemple, `["de", "fr", "es", "pt-BR"]`).

`targetLocales` est la liste principale des paramètres régionaux pour la traduction de l'interface utilisateur et la liste par défaut des blocs de documentation. Utilisez `generate-ui-languages` pour générer le manifeste `ui-languages.json` à partir de `sourceLocale` + `targetLocales`.

<a id="uilanguagespath-optional"></a>
### `uiLanguagesPath` (facultatif)

Chemin vers le manifeste `ui-languages.json` utilisé pour les noms d'affichage, le filtrage des paramètres régionaux et le post-traitement de la liste des langues. En l'absence de cette option, l'interface en ligne de commande (CLI) recherche le manifeste à l'emplacement `ui.flatOutputDir/ui-languages.json`.

Utilisez cette option lorsque :

- Le manifeste se trouve en dehors de `ui.flatOutputDir` et que vous devez indiquer explicitement son emplacement à la CLI.
- Vous souhaitez que `markdownOutput.postProcessing.languageListBlock` génère les libellés de paramètres régionaux à partir du manifeste.
- `extract` doit fusionner les entrées `englishName` du manifeste dans `strings.json` (nécessite `ui.reactExtractor.includeUiLanguageEnglishNames: true`).

<a id="concurrency-optional"></a>
### `concurrency` (facultatif)

Nombre maximal de **paramètres régionaux cibles** traduits simultanément (`translate-ui`, `translate-docs`, `translate-svg` et les étapes correspondantes dans `sync`). En l'absence de cette option, la CLI utilise **4** pour la traduction de l'interface utilisateur et **3** pour la traduction de la documentation (valeurs par défaut intégrées). Remplaçable lors de l'exécution via `-j` / `--concurrency`.

<a id="batchconcurrency-optional"></a>
### `batchConcurrency` (facultatif)

**translate-docs** et **translate-svg** (ainsi que l'étape de documentation de `sync`) : nombre maximal de requêtes par lot (**batch**) OpenRouter en parallèle par fichier (chaque lot pouvant contenir de nombreux segments). Valeur par défaut : **4** si omis. Ignoré par `translate-ui`. Remplaçable avec `-b` / `--batch-concurrency`. Sur `sync`, `-b` s'applique uniquement à l'étape de traduction de la documentation.

<a id="batchsize--maxbatchchars-optional"></a>
### `batchSize` / `maxBatchChars` (facultatif)

Regroupement des segments pour la traduction de documents : nombre de segments par requête API et seuil maximal en caractères. Valeurs par défaut : **20** segments, **4096** caractères (lorsque non spécifié).

<a id="openrouter"></a>
### `openrouter`

| Champ               | Description                                                                                                                                                                                                      |
|---------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `baseUrl`           | URL de base de l'API OpenRouter. Par défaut : `https://openrouter.ai/api/v1`.                                                                                                                                                |
| `translationModels` | Liste ordonnée préférée des identifiants de modèles. Le premier est essayé en premier ; les suivants servent de secours en cas d'erreur. Pour `translate-ui` uniquement, vous pouvez également définir `ui.preferredModel` pour essayer un modèle avant cette liste (voir `ui`). |
| `defaultModel`      | Modèle principal unique (obsolète). Utilisé uniquement si `translationModels` n'est pas défini ou vide.                                                                                                                               |
| `fallbackModel`     | Modèle de secours unique (obsolète). Utilisé après `defaultModel` si `translationModels` n'est pas défini ou vide.                                                                                                              |
| `maxTokens`         | Nombre maximal de jetons de complétion par requête. Par défaut : `8192`.                                                                                                                                                              |
| `temperature`       | Température d'échantillonnage. Par défaut : `0.2`.                                                                                                                                                                            |

**Pourquoi utiliser plusieurs modèles :** Différents fournisseurs et modèles ont des coûts variables et offrent des niveaux de qualité différents selon les langues et les paramètres régionaux. Configurez `openrouter.translationModels` **comme une chaîne de secours ordonnée** (plutôt qu'un seul modèle), afin que la CLI puisse essayer le modèle suivant en cas d'échec d'une requête.

Considérez la liste ci-dessous comme une **base** que vous pouvez étendre : si la traduction pour un paramètre régional spécifique est médiocre ou échoue, recherchez quels modèles prennent efficacement en charge cette langue ou ce script (consultez les ressources en ligne ou la documentation de votre fournisseur), puis ajoutez ces identifiants OpenRouter comme alternatives supplémentaires.

Cette liste a été **testée pour une couverture étendue des paramètres régionaux** (par exemple, en **avril 2026**, lors de la traduction de **36** paramètres régionaux dans le cadre d'un important projet de documentation) ; elle constitue une valeur par défaut pratique, mais il n'est pas garanti qu'elle fonctionne bien pour tous les paramètres régionaux.

Exemple `translationModels` (mêmes valeurs par défaut que `npx ai-i18n-tools init`) :

```json
"translationModels": [
  "qwen/qwen3-235b-a22b-2507",
  "openai/gpt-4o-mini",
  "deepseek/deepseek-v3.2",
  "anthropic/claude-3-haiku",
  "qwen/qwen3.6-plus",
  "anthropic/claude-3.5-haiku",
  "openai/gpt-5.3-codex",
  "anthropic/claude-sonnet-4.6",
  "google/gemini-3-flash-preview"
]
```

Définissez `OPENROUTER_API_KEY` dans votre environnement ou dans le fichier `.env`.

<a id="features"></a>
### `features`

| Champ                | Workflow | Description                                                                                                                                                        |
|----------------------|----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `extractUIStrings`   | 1        | Analyser la source pour `t("…")` / `i18n.t("…")`, fusionner la description facultative `package.json` et (si activé) les valeurs `ui-languages.json` `englishName` dans `strings.json`.
| `translateUIStrings` | 1        | Traduire les entrées `strings.json` et générer des fichiers JSON par paramètre régional.                                                                                                  |
| `translateMarkdown`  | 2        | Traduire les fichiers `.md` / `.mdx`.                                                                                                                                    |
| `translateJSON`      | 2        | Traduire les fichiers JSON d'étiquettes Docusaurus.                                                                                                                             |
| `translateSVG`       | 2        | Traduire les ressources autonomes `.svg` (nécessite un bloc de niveau supérieur `svg`).                                                                                         |

**Traduire les ressources autonomes** SVG avec `translate-svg` lorsque `features.translateSVG` est défini à true et qu'un bloc `svg` au niveau supérieur est configuré. La commande `sync` exécute cette étape lorsque les deux conditions sont remplies (sauf si `--no-svg`).

<a id="ui"></a>
### `ui`

| Champ                                          | Description                                                                                                                                                                                                                                                        |
|------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `sourceRoots`                                  | Répertoires (relatifs au répertoire de travail courant) analysés pour les appels `t("…")`.
| `stringsJson`                                  | Chemin vers le fichier catalogue principal. Mis à jour par `extract`.
| `flatOutputDir`                                | Répertoire dans lequel les fichiers JSON par paramètre régional sont écrits (`de.json`, etc.).
| `preferredModel`                               | Facultatif. Identifiant de modèle OpenRouter essayé en premier uniquement pour `translate-ui` ; puis `openrouter.translationModels` (ou les modèles hérités) dans l'ordre, sans dupliquer cet identifiant.
| `reactExtractor.funcNames`                     | Noms de fonctions supplémentaires à analyser (par défaut : `["t", "i18n.t"]`).
| `reactExtractor.extensions`                    | Extensions de fichiers à inclure (par défaut : `[".js", ".jsx", ".ts", ".tsx"]`).                                                                                                                                                                                            |
| `reactExtractor.includePackageDescription`     | Lorsque `true` (par défaut), `extract` inclut également `package.json` `description` en tant que chaîne d'interface utilisateur si elle est présente.                                                                                                                                                           |
| `reactExtractor.packageJsonPath`               | Chemin personnalisé vers le fichier `package.json` utilisé pour l'extraction facultative de la description.                                                                                                                                                                              |
| `reactExtractor.includeUiLanguageEnglishNames` | Lorsque `true` (par défaut `false`), `extract` ajoute également chaque `englishName` du manifeste situé à `uiLanguagesPath` à `strings.json` s'il n'est pas déjà présent dans l'analyse source (mêmes clés de hachage). Nécessite que `uiLanguagesPath` pointe vers un fichier `ui-languages.json` valide. |

<a id="cachedir"></a>
### `cacheDir`

| Champ      | Description                                                                 |
| ---------- | ----------------------------------------------------------------------------- |
| `cacheDir` | Répertoire du cache SQLite (partagé par tous les blocs `documentations`). Réutilisé entre les exécutions. Si vous migrez depuis un cache personnalisé de traduction de documentation, archivez-le ou supprimez-le — `cacheDir` crée sa propre base de données SQLite et n'est pas compatible avec d'autres schémas. |

Bonnes pratiques pour les exclusions de VCS :

- Excluez le contenu du dossier de cache de traduction (par exemple via `.gitignore` ou `.git/info/exclude`) afin d'éviter de valider des artefacts temporaires.
- Conservez `cache.db` (ne le supprimez pas systématiquement), car la préservation du cache SQLite évite de retraduire des segments inchangés, ce qui réduit à la fois le temps d'exécution et le coût des API lors de modifications ou mises à jour de logiciels utilisant `ai-i18n-tools`.

Exemple :

```gitignore
# Translation cache directory
.translation-cache/*

# Keep SQLite cache for reuse
!.translation-cache/cache.db
```

<a id="documentations"></a>
### `documentations`

Tableau de blocs de pipeline de documentation. `translate-docs` et la phase docs de `sync` **traitent chacun** des blocs dans l'ordre.

| Champ                                             | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
|---------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `description`                                     | Note facultative, lisible par l'humain, pour ce bloc (non utilisée pour la traduction). Préfixée dans le titre `translate-docs` `🌐` lorsqu'elle est définie ; également affichée dans les en-têtes de section `status`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `contentPaths`                                    | Sources Markdown/MDX à traduire (`translate-docs` analyse celles-ci pour `.md` / `.mdx`). Les libellés JSON proviennent de `jsonSource` sur le même bloc.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `outputDir`                                       | Répertoire racine pour la sortie traduite de ce bloc.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `sourceFiles`                                     | Alias facultatif fusionné dans `contentPaths` au chargement.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `targetLocales`                                   | Sous-ensemble facultatif de paramètres régionaux pour ce bloc uniquement (sinon paramètres régionaux racine `targetLocales`). Les paramètres régionaux de documentation effectifs correspondent à l'union entre tous les blocs.                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `jsonSource`                                      | Répertoire source des fichiers d'étiquettes JSON Docusaurus pour ce bloc (par exemple, `"i18n/en"`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `markdownOutput.style`                            | `"nested"` (par défaut), `"docusaurus"` ou `"flat"`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `markdownOutput.docsRoot`                         | Répertoire source de la documentation pour la mise en page Docusaurus (par exemple, `"docs"`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `markdownOutput.pathTemplate`                     | Chemin personnalisé de sortie pour le markdown. Espaces réservés : <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{LOCALE}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{basename}"}</code>, <code>{"{extension}"}</code>, <code>{"{docsRoot}"}</code>, <code>{"{relativeToDocsRoot}"}</code>.                                                                                                                                                                                                                                                                                                                                                     |
| `markdownOutput.jsonPathTemplate`                 | Chemin personnalisé de sortie au format JSON pour les fichiers de libellés. Prend en charge les mêmes espaces réservés que `pathTemplate`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `markdownOutput.flatPreserveRelativeDir`          | Pour le style `flat`, conserver les sous-répertoires sources afin d'éviter les conflits entre fichiers ayant le même nom de base.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `markdownOutput.rewriteRelativeLinks`             | Réécrire les liens relatifs après traduction (activé automatiquement pour le style `flat`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `markdownOutput.linkRewriteDocsRoot`              | Racine du dépôt utilisée lors du calcul des préfixes de réécriture des liens plats. Conservez généralement la valeur `"."`, sauf si vos documents traduits se trouvent sous une racine de projet différente.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `markdownOutput.postProcessing`                | Transformations facultatives appliquées au **corps markdown** traduit (le YAML front matter est préservé). S'exécute après le réassemblage des segments et la réécriture des liens plats, et avant `addFrontmatter`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `segmentSplitting`                             | Même niveau que `markdownOutput` (selon le bloc `documentations[]`). Segments facultatifs plus précis pour l'extraction `translate-docs` : `{ "enabled", "maxCharsPerSegment"?, "splitPipeTables"?, "splitDenseParagraphs"?, "maxLinesPerParagraphChunk"?, "splitLongLists"?, "maxListItemsPerChunk"? }`. Lorsque `enabled` vaut `true` (valeur par défaut si `segmentSplitting` est omis), les paragraphes denses, les tableaux GFM avec barres verticales (le premier fragment inclut l'en-tête, le séparateur et la première ligne de données) et les longues listes sont divisés ; les sous-parties sont réunies avec des sauts de ligne simples (`tightJoinPrevious`). Définir `"enabled": false` pour utiliser un segment par bloc de texte délimité par une ligne vide uniquement. |
| `markdownOutput.postProcessing.regexAdjustments`  | Liste ordonnée de `{ "description"?, "search", "replace" }`. `search` est un motif regex (une chaîne simple utilise le drapeau `g`, ou `/pattern/flags`). `replace` prend en charge des espaces réservés tels que `${translatedLocale}`, `${sourceLocale}`, `${sourceFullPath}`, `${translatedFullPath}`, `${sourceFilename}`, `${translatedFilename}`, `${sourceBasedir}`, `${translatedBasedir}`.                                                                                                                                                                                                                                                                                                    |
| `markdownOutput.postProcessing.languageListBlock` | `{ "start", "end", "separator", "label" }` — le traducteur recherche la première ligne contenant `start` et la ligne `end` correspondante, puis remplace cet extrait par un sélecteur de langue normalisé. `label` contrôle la source de l'étiquette du manifeste : `"local"` (par défaut, utilise `ui-languages.json` `label`) ou `"english"` (utilise `englishName`). Les liens sont construits avec des chemins relatifs au fichier traduit ; lorsqu'aucun manifeste n'est configuré, les étiquettes proviennent de `localeDisplayNames` et des codes de langue. |
| `addFrontmatter`                                  | Lorsque `true` (valeur par défaut si omis), les fichiers markdown traduits incluent les clés YAML : `translation_last_updated`, `source_file_mtime`, `source_file_hash`, `translation_language`, `source_file_path`, et, lorsqu'au moins un segment contient des métadonnées de modèle, `translation_models` (liste triée des identifiants de modèles OpenRouter utilisés). Définir sur `false` pour ignorer.                                                                                                                                                                                                                                                                                                                           |

Exemple (pipeline README plat — chemins des captures d'écran + wrapper facultatif de liste de langues) :

```json
"markdownOutput": {
  "style": "flat",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders",
        "search": "images/screenshots/[^/]+/",
        "replace": "images/screenshots/${translatedLocale}/"
      }
    ],
    "languageListBlock": {
      "start": "<small id=\"lang-list\">",
      "end": "</small>",
      "separator": " · ",
      "label": "local"
    }
  }
}
```

<a id="svg-optional"></a>
### `svg` (facultatif)

Chemins de niveau supérieur et disposition pour les ressources SVG autonomes. La traduction s'exécute uniquement lorsque `features.translateSVG` est vrai (via `translate-svg` ou l'étape SVG de `sync`).

| Champ                         | Description                                                                                                                                                                                                                                                                        |
|-------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `sourcePath`                  | Un répertoire ou un tableau de répertoires analysés récursivement pour les fichiers `.svg`.                                                                                                                                                                                                     |
| `outputDir`                   | Répertoire racine pour la sortie SVG traduite.                                                                                                                                                                                                                                          |
| `style`                       | `"flat"` ou `"nested"` lorsque `pathTemplate` n'est pas défini.                                                                                                                                                                                                                               |
| `pathTemplate`                | Chemin personnalisé de sortie SVG. Espaces réservés : <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{LOCALE}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{basename}"}</code>, <code>{"{extension}"}</code>, <code>{"{relativeToSourceRoot}"}</code>. |
| `svgExtractor.forceLowercase` | Texte traduit en minuscules lors de la réassemblage SVG. Utile pour les conceptions qui reposent sur des libellés entièrement en minuscules.                                                                                                                                                                                |

<a id="glossary"></a>
### `glossary`

| Champ          | Description                                                                                                                                                                 |
|----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `uiGlossary`   | Chemin vers `strings.json` - génère automatiquement un glossaire à partir des traductions existantes.                                                                                                 |
| `userGlossary` | Chemin vers un fichier CSV avec les colonnes `Original language string` (ou `en`), `locale`, `Translation` - une ligne par terme source et langue cible (`locale` peut être `*` pour toutes les cibles). |

L'ancienne clé `uiGlossaryFromStringsJson` est encore acceptée et mappée à `uiGlossary` lors du chargement de la configuration.

Générer un fichier CSV de glossaire vide :

```bash
npx ai-i18n-tools glossary-generate
```

---

<a id="cli-reference"></a>
## Référence CLI

| Command                                                                     | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
|-----------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `version`                                                                   | Affiche la version de l'interface en ligne de commande et l'horodatage de compilation (les mêmes informations que `-V` / `--version` du programme racine).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `init [-t ui-markdown\|ui-docusaurus] [-o path] [--with-translate-ignore]`  | Écrire un fichier de configuration de démarrage (inclut `concurrency`, `batchConcurrency`, `batchSize`, `maxBatchChars` et `documentations[].addFrontmatter`). `--with-translate-ignore` crée un `.translate-ignore` de démarrage.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `extract`                                                                   | Mettre à jour `strings.json` à partir des littéraux `t("…")` / `i18n.t("…")`, d'une description facultative `package.json` et d'entrées facultatives du manifeste `englishName` (voir `ui.reactExtractor`). Nécessite `features.extractUIStrings`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `generate-ui-languages [--master <path>] [--dry-run]`                       | Écrire `ui-languages.json` dans `ui.flatOutputDir` (ou `uiLanguagesPath` si défini) en utilisant `sourceLocale` + `targetLocales` et le `data/ui-languages-complete.json` intégré (ou `--master`). Affiche un avertissement et émet des espaces réservés `TODO` pour les paramètres régionaux manquants dans le fichier maître. Si vous disposez d'un manifeste existant avec des valeurs personnalisées pour `label` ou `englishName`, celles-ci seront remplacées par les valeurs par défaut du catalogue maître — veuillez examiner et ajuster le fichier généré par la suite.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `translate-docs …`                                                          | Traduire le markdown/MDX et le JSON pour chaque bloc `documentations` (`contentPaths`, `jsonSource` facultatif). `-j` : nombre maximal de langues en parallèle ; `-b` : nombre maximal d'appels d'API par lot par fichier. `--prompt-format` : format de transmission par lot (`xml` \| `json-array` \| `json-object`). Voir [Comportement du cache et indicateurs `translate-docs`](#cache-behaviour-and-translate-docs-flags) et [Format des invites par lot](#batch-prompt-format).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `write-heading-ids …`                                                       | **Pas d'API.** Nécessite au moins un bloc `documentations[]`. Rassemble `.md` / `.mdx` sous le `contentPaths` de chaque bloc (respecte `.translate-ignore`). Insère une ligne d'ancre HTML `<a id="slug"></a>` immédiatement **avant** chaque en-tête ATX plat `#` (ignore les en-têtes à l'intérieur des blocs de code délimités). `-p` / `--path` ou `-f` / `--file` : limiter à un fichier ou répertoire relatif au projet. `--slug-style` : `github` (par défaut ; doctoc / anchor-markdown-header), `bitbucket`, `gitlab`, `pymdown`, `azure-devops`. Avec `pymdown`, facultatif `--pymdown-case`, `--pymdown-normalize`, `--pymdown-percent-encode` / `--no-pymdown-percent-encode`. `--dry-run` : liste uniquement les modifications.                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `translate-svg …`                                                           | Traduire les ressources SVG autonomes configurées dans `config.svg` (distinctes de la documentation). Nécessite `features.translateSVG`. Mêmes principes de cache que pour la documentation ; prend en charge `--no-cache` pour ignorer les lectures/écritures SQLite lors de cette exécution. `-j`, `-b`, `--force`, `--force-update`, `-p` / `--path`, `--dry-run`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `translate-ui [--locale <code>] [--force] [--dry-run] [-j <n>]`             | Traduire uniquement les chaînes d'interface utilisateur. `--force` : retraduire toutes les entrées par langue (ignorer les traductions existantes). `--dry-run` : pas d'écritures, pas d'appels API. `-j` : nombre maximal de langues en parallèle. Nécessite `features.translateUIStrings`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `lint-source [-l <code>] [--chunk <n>] [--dry-run] [--json] [-j <n>]`                                                                    | Exécute `extract` **en premier** (nécessite `features.extractUIStrings`) afin que `strings.json` corresponde à la source, puis effectue une relecture par LLM des chaînes d'interface utilisateur en **langue source** (orthographe, grammaire). Les **indices de terminologie** proviennent uniquement du fichier CSV `glossary.userGlossary` (même portée que `translate-ui` — pas `strings.json` / `uiGlossary`, afin d'éviter de renforcer une mauvaise formulation comme entrée de glossaire). Utilise OpenRouter (`OPENROUTER_API_KEY`). À titre indicatif uniquement (sort avec le code **0** à la fin de l'exécution). Génère `lint-source-results_<timestamp>.log` dans `cacheDir` sous forme de rapport **lisible par un humain** (résumé, problèmes, et lignes **OK** par chaîne) ; le terminal affiche uniquement les comptages récapitulatifs et les problèmes (pas de lignes `[ok]` par chaîne). Affiche le nom du fichier journal sur la dernière ligne. `--json` : rapport JSON entièrement lisible par machine uniquement sur stdout (le fichier journal reste lisible par un humain). `--dry-run` : exécute tout de même `extract`, puis affiche uniquement le plan du lot (pas d'appels API). `--chunk` : nombre de chaînes par lot d'API (par défaut **50**). `-j` : nombre maximal de lots en parallèle (par défaut `concurrency`). Avec `--json`, la sortie au format humain est dirigée vers stderr. Les liens utilisent `path:line` comme le bouton « lien » des chaînes d'interface utilisateur `editor`. |
| `export-ui-xliff [-l <codes>] [-o <dir>] [--untranslated-only] [--dry-run]` | Exporte `strings.json` vers XLIFF 2.0 (un `.xliff` par langue cible). `-o` / `--output-dir` : répertoire de sortie (par défaut : même dossier que le catalogue). `--untranslated-only` : uniquement les unités sans traduction pour cette langue. Lecture seule ; aucune API utilisée.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `sync …`                                                                    | Extraction (si activée), puis traduction de l'interface utilisateur, puis `translate-svg` lorsque `features.translateSVG` et `config.svg` sont définis, puis traduction de la documentation — sauf si ignorée avec `--no-ui`, `--no-svg` ou `--no-docs`. Options partagées : `-l`, `-p` / `-f`, `--dry-run`, `-j`, `-b` (uniquement pour le regroupement des documents), `--force` / `--force-update` (documents uniquement ; exclusives l'une de l'autre lorsque les documents sont traités). La phase de documentation transmet également `--emphasis-placeholders` et `--debug-failed` (même signification que `translate-docs`). `--prompt-format` n'est pas un indicateur `sync` ; l'étape de documentation utilise la valeur par défaut intégrée (`json-array`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `status [--max-columns <n>]`                                                | Lorsque `features.translateUIStrings` est activé, affiche la couverture de l'interface utilisateur par langue (`Translated` / `Missing` / `Total`). Ensuite, affiche l'état des traductions Markdown par fichier × langue (aucun filtre `--locale` ; les langues proviennent de la configuration). Les listes importantes de langues sont divisées en plusieurs tableaux répétés comportant jusqu'à `n` colonnes de langues (par défaut **9**) afin que les lignes restent étroites dans le terminal.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `cleanup [--dry-run] [--no-backup] [--backup <path>]`                       | Exécute d'abord `sync --force-update` (extraction, interface utilisateur, SVG, documentation), puis supprime les lignes de segments obsolètes (`last_hit_at` nul / chemin de fichier vide) ; supprime les lignes `file_tracking` dont le chemin source résolu est manquant sur le disque ; supprime les lignes de traduction dont les métadonnées `filepath` pointent vers un fichier manquant. Affiche trois compteurs (obsolètes, `file_tracking` orphelins, traductions orphelines). Crée une sauvegarde SQLite horodatée dans le répertoire du cache, sauf si `--no-backup`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `editor [-p <port>] [--no-open]`                                            | Lance un éditeur web local pour le cache, `strings.json` et le fichier CSV du glossaire. `--no-open` n'ouvrent pas automatiquement le navigateur par défaut.<br><br>**Remarque :** Si vous modifiez une entrée dans l'éditeur de cache, vous devez exécuter un `sync --force-update` pour réécrire les fichiers de sortie avec l'entrée de cache mise à jour. En outre, si le texte source change ultérieurement, la modification manuelle sera perdue, car une nouvelle clé de cache est générée.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `glossary-generate [-o <path>]`                                             | Écrire un modèle `glossary-user.csv` vide. `-o` : remplacer le chemin de sortie (par défaut : `glossary.userGlossary` depuis la configuration, ou `glossary-user.csv`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

Toutes les commandes acceptent `-c <path>` pour spécifier un fichier de configuration non par défaut, `-v` pour une sortie détaillée, et `-w` / `--write-logs [path]` pour rediriger la sortie console vers un fichier journal (chemin par défaut : dans le répertoire racine `cacheDir`). Le programme principal prend également en charge `-V` / `--version` et `-h` / `--help` ; `ai-i18n-tools help [command]` affiche la même aide par commande que `ai-i18n-tools <command> --help`.

---

<a id="environment-variables"></a>
## Variables d'environnement

| Variable                | Description                                                |
|-------------------------|------------------------------------------------------------|
| `OPENROUTER_API_KEY`    | **Requis.** Votre clé API OpenRouter.                     |
| `OPENROUTER_BASE_URL`   | Remplacer l'URL de base de l'API.                                 |
| `I18N_SOURCE_LOCALE`    | Remplacer `sourceLocale` au moment de l'exécution.                        |
| `I18N_TARGET_LOCALES`   | Codes de langue séparés par des virgules pour remplacer `targetLocales`.  |
| `I18N_LOG_LEVEL`        | Niveau du journaliseur (`debug`, `info`, `warn`, `error`, `silent`). |
| `NO_COLOR`              | Lorsque `1`, désactiver les couleurs ANSI dans la sortie du journal.              |
| `I18N_LOG_SESSION_MAX`  | Nombre maximal de lignes conservées par session de journal (par défaut `5000`).           |
