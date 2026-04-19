# ai-i18n-tools : Prise en main

`ai-i18n-tools` fournit deux flux de travail indépendants et composables :

- **Flux de travail 1 - Traduction de l'UI** : extraire les appels `t("…")` de toute source JS/TS, les traduire via OpenRouter, et écrire des fichiers JSON plats par locale prêts pour i18next.  
- **Flux de travail 2 - Traduction de documents** : traduire des fichiers markdown (MDX) et des fichiers de labels JSON Docusaurus vers n'importe quel nombre de locales, avec un cache intelligent. Les actifs **SVG** utilisent `features.translateSVG`, le bloc `svg` de niveau supérieur, et `translate-svg` (voir [référence CLI](#cli-reference)).

Les deux flux de travail utilisent OpenRouter (tout LLM compatible) et partagent un seul fichier de configuration.

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
## Table des matières

- [Installation](#installation)
- [Démarrage rapide](#quick-start)
- [Workflow 1 - Traduction de l'interface](#workflow-1---ui-translation)
  - [Étape 1 : Initialiser](#step-1-initialise)
  - [Étape 2 : Extraire les chaînes](#step-2-extract-strings)
  - [Étape 3 : Traduire les chaînes de l'interface](#step-3-translate-ui-strings)
  - [Exportation vers XLIFF 2.0 (facultatif)](#exporting-to-xliff-20-optional)
  - [Étape 4 : Connecter i18next au moment de l'exécution](#step-4-wire-i18next-at-runtime)
  - [Utilisation de `t()` dans le code source](#using-t-in-source-code)
  - [Interpolation](#interpolation)
  - [Interface de changement de langue](#language-switcher-ui)
  - [Langues RTL](#rtl-languages)
- [Workflow 2 - Traduction de documents](#workflow-2---document-translation)
  - [Étape 1 : Initialiser pour la documentation](#step-1-initialise-for-documentation)
  - [Étape 2 : Traduire les documents](#step-2-translate-documents)
    - [Comportement du cache et indicateurs `translate-docs`](#cache-behaviour-and-translate-docs-flags)
  - [Organisations de sortie](#output-layouts)
- [Workflow combiné (interface + documentation)](#combined-workflow-ui--docs)
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

## Installation

Le package publié est **uniquement ESM**. Utilisez `import`/`import()` dans Node.js ou votre outil de regroupement ; n'utilisez pas `require('ai-i18n-tools')`.

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

ai-i18n-tools inclut son propre extracteur de chaînes. Si vous utilisiez auparavant `i18next-scanner`, `babel-plugin-i18next-extract` ou des outils similaires, vous pouvez supprimer ces dépendances de développement après la migration.

Définissez votre clé API OpenRouter :

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Ou créez un fichier `.env` à la racine du projet :

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

## Prise en main rapide

Le modèle `init` par défaut (`ui-markdown`) permet uniquement l'extraction et la traduction **UI**. Le modèle `ui-docusaurus` permet la traduction **de documents** (`translate-docs`). Utilisez `sync` lorsque vous souhaitez une commande qui exécute l'extraction, la traduction UI, la traduction SVG autonome optionnelle et la traduction de documentation selon votre configuration.

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

### Scripts `package.json` recommandés

Une fois le package installé localement, vous pouvez utiliser directement les commandes CLI dans les scripts (aucun `npx` nécessaire) :

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

## Flux de travail 1 - Traduction UI

Conçu pour tout projet JS/TS qui utilise i18next : applications React, Next.js (composants client et serveur), services Node.js, outils CLI.

### Étape 1 : Initialiser

```bash
npx ai-i18n-tools init
```

Cela écrit `ai-i18n-tools.config.json` avec le modèle `ui-markdown`. Modifiez-le pour définir :

- `sourceLocale` - le code BCP-47 de votre langue source (par exemple `"en-GB"`). **Doit correspondre** à `SOURCE_LOCALE` exporté depuis votre fichier de configuration i18n au moment de l'exécution (`src/i18n.ts` / `src/i18n.js`).
- `targetLocales` - tableau de codes BCP-47 pour vos langues cibles (par exemple `["de", "fr", "pt-BR"]`). Exécutez `generate-ui-languages` pour créer le manifeste `ui-languages.json` à partir de cette liste.
- `ui.sourceRoots` - répertoires à analyser pour les appels `t("…")` (par exemple `["src/"]`).
- `ui.stringsJson` - emplacement où écrire le catalogue maître (par exemple `"src/locales/strings.json"`).
- `ui.flatOutputDir` - emplacement où écrire `de.json`, `pt-BR.json`, etc. (par exemple `"src/locales/"`).
- `ui.preferredModel` (facultatif) - Identifiant de modèle OpenRouter à essayer **en premier** pour `translate-ui` uniquement ; en cas d'échec, la CLI continue avec `openrouter.translationModels` (ou l'ancien `defaultModel` / `fallbackModel`) dans l'ordre, en ignorant les doublons.

### Étape 2 : Extraire les chaînes

```bash
npx ai-i18n-tools extract
```

Scanne tous les fichiers JS/TS sous `ui.sourceRoots` pour les appels `t("literal")` et `i18n.t("literal")`. Écrit (ou fusionne dans) `ui.stringsJson`.

Le scanner est configurable : ajoutez des noms de fonctions personnalisées via `ui.reactExtractor.funcNames`.

### Étape 3 : Traduire les chaînes de l'interface utilisateur

```bash
npx ai-i18n-tools translate-ui
```

Lit `strings.json`, envoie des lots à OpenRouter pour chaque locale cible, écrit des fichiers JSON plats (`de.json`, `fr.json`, etc.) dans `ui.flatOutputDir`. Lorsque `ui.preferredModel` est défini, ce modèle est tenté avant la liste ordonnée dans `openrouter.translationModels` (la traduction de documents et d'autres commandes utilisent toujours uniquement `openrouter`).

Pour chaque entrée, `translate-ui` stocke l'**identifiant de modèle OpenRouter** qui a correctement traduit chaque locale dans un objet facultatif `models` (avec les mêmes clés de locale que dans `translated`). Les chaînes modifiées dans la commande locale `editor` sont marquées avec la valeur sentinelle `user-edited` dans `models` pour cette locale. Les fichiers plats par locale situés sous `ui.flatOutputDir` restent au format **chaîne source → traduction** uniquement ; ils n'incluent pas `models` (ainsi les bundles au moment de l'exécution restent inchangés).

> **Remarque sur l'utilisation de l'éditeur de cache :** Si vous modifiez une entrée dans l'éditeur de cache, vous devez exécuter un `sync --force-update` (ou la commande `translate` équivalente avec `--force-update`) pour réécrire les fichiers de sortie avec l'entrée de cache mise à jour. De plus, gardez à l'esprit que si le texte source change plus tard, votre modification manuelle sera perdue car une nouvelle clé de cache (hash) sera générée pour la nouvelle chaîne source.

### Exporter vers XLIFF 2.0 (facultatif)

Pour transmettre les chaînes d'interface à un prestataire de traduction, un système de gestion de la traduction (TMS) ou un outil de traduction assistée par ordinateur (CAT), exportez le catalogue au format **XLIFF 2.0** (un fichier par langue cible). Cette commande est **en lecture seule** : elle ne modifie pas `strings.json` ni n'appelle aucune API.

```bash
npx ai-i18n-tools export-ui-xliff
```

Par défaut, les fichiers sont écrits à côté de `ui.stringsJson`, nommés comme `strings.de.xliff`, `strings.pt-BR.xliff` (nom de base de votre catalogue + langue + `.xliff`). Utilisez `-o` / `--output-dir` pour écrire ailleurs. Les traductions existantes provenant de `strings.json` apparaissent dans `<target>` ; les langues manquantes utilisent `state="initial"` sans `<target>`, afin que les outils puissent les compléter. Utilisez `--untranslated-only` pour exporter uniquement les unités qui nécessitent encore une traduction pour chaque langue (utile pour les lots envoyés aux prestataires). `--dry-run` affiche les chemins sans écrire les fichiers.

### Étape 4 : Connecter i18next à l'exécution

Créez votre fichier de configuration i18n en utilisant les helpers exportés par `'ai-i18n-tools/runtime'` :

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

**Conserver trois valeurs alignées :** `sourceLocale` dans **`ai-i18n-tools.config.json`**, **`SOURCE_LOCALE`** dans ce fichier, et le JSON plat pluriel que **`translate-ui`** écrit comme **`{sourceLocale}.json`** dans votre répertoire de sortie plat (souvent `public/locales/`). Utilisez ce même nom de base dans le **`import`** statique (exemple ci-dessus : `en-GB` → `en-GB.json`). Le champ **`lng`** dans **`sourcePluralFlatBundle`** doit être égal à **`SOURCE_LOCALE`**. Les chemins ES statiques **`import`** ne peuvent pas utiliser de variables ; si vous modifiez la langue source, mettez à jour **`SOURCE_LOCALE`** et le chemin d'importation ensemble. Sinon, chargez ce fichier avec un **`import(\`./public/locales/${SOURCE_LOCALE}.json\`)`** dynamique, **`fetch`**, ou **`readFileSync`** afin que le chemin soit construit à partir de **`SOURCE_LOCALE`**.

L'extrait de code utilise **`./locales/…`** et **`./public/locales/…`** comme si **`i18n`** se trouvait à côté de ces dossiers. Si votre fichier se trouve dans **`src/`** (cas typique), utilisez **`../locales/…`** et **`../public/locales/…`** afin que les imports correspondent aux mêmes chemins que **`ui.stringsJson`**, **`uiLanguagesPath`** et **`ui.flatOutputDir`**.

Importez `i18n.js` avant que React ne rende (par exemple, en haut de votre point d'entrée). Lorsque l'utilisateur change de langue, appelez `await loadLocale(code)` puis `i18n.changeLanguage(code)`.

Gardez `localeLoaders` **alignés avec la configuration** en les dérivant de **`ui-languages.json`** avec **`makeLocaleLoadersFromManifest`** (filtre les **`SOURCE_LOCALE`** en utilisant la même normalisation que **`makeLoadLocale`**). Après avoir ajouté une langue à **`targetLocales`** et exécuté **`generate-ui-languages`**, le manifeste est mis à jour et vos chargeurs le suivent sans avoir à maintenir une carte codée en dur séparée. Si les bundles JSON se trouvent sous **`public/`** (typique pour Next.js), implémentez chaque chargeur avec **`fetch(\`/locales/${code}.json\`)`** au lieu de **`import()`**, afin que le navigateur charge le JSON statique depuis votre chemin d'URL public. Pour les CLI Node sans outil de regroupement, chargez les fichiers de langue avec **`readFileSync`** dans une petite fonction utilitaire **`makeFileLoader`** qui renvoie le JSON analysé pour chaque code.

`SOURCE_LOCALE` est exporté afin que tout autre fichier qui en a besoin (par exemple un sélecteur de langue) puisse l'importer directement depuis `'./i18n'`. Si vous migrez une configuration i18next existante, remplacez toutes les chaînes de localisation source en dur (par exemple des vérifications `'en-GB'` dispersées dans les composants) par des importations de `SOURCE_LOCALE` depuis votre fichier d'initialisation i18n.

Les imports nommés (`import { defaultI18nInitOptions, … } from 'ai-i18n-tools/runtime'`) fonctionnent de la même manière si vous préférez ne pas utiliser l'export par défaut.

`aiI18n.defaultI18nInitOptions(sourceLocale)` (ou `defaultI18nInitOptions(sourceLocale)` lorsqu'importé par nom) renvoie les options standard pour les configurations avec clé par défaut :

- `parseMissingKeyHandler` retourne la clé elle-même, de sorte que les chaînes non traduites affichent le texte source.
- `nsSeparator: false` permet des clés contenant des deux-points.
- `interpolation.escapeValue: false` - sûr à désactiver : React échappe les valeurs lui-même, et la sortie Node.js/CLI n'a pas de HTML à échapper.

`setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` est le câblage **recommandé** pour les projets ai-i18n-tools : il applique le nettoyage des clés + le remplacement par interpolation <code>{"{{var}}"}</code> pour la langue source (comportement identique à celui de **`wrapI18nWithKeyTrim`** de niveau inférieur), fusionne éventuellement les clés plurielles suffixées **`translate-ui`** **`{sourceLocale}.json`** via **`addResourceBundle`**, puis installe le **`wrapT`** prenant en compte le pluriel à partir de votre **`strings.json`**. Ce fichier groupé doit être le plat pluriel pour votre langue source **configurée** — le même **`sourceLocale`** que dans **`ai-i18n-tools.config.json`** et **`SOURCE_LOCALE`** dans votre amorçage i18n (voir Étape 4 ci-dessus). Omettez **`sourcePluralFlatBundle`** uniquement pendant l'amorçage (fusionnez-le une fois que **`translate-ui`** a émis **`{sourceLocale}.json`**). **`wrapI18nWithKeyTrim`** seul est **déconseillé** pour le code applicatif — utilisez plutôt **`setupKeyAsDefaultT`**.

`makeLoadLocale(i18n, loaders, sourceLocale)` renvoie une fonction asynchrone `loadLocale(lang)` qui importe dynamiquement le bundle JSON pour une locale et l'enregistre auprès d'i18next.

### Utiliser `t()` dans le code source

Appelez `t()` avec une **chaîne littérale** afin que le script d'extraction puisse la trouver :

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
- N'utilisez pas de littéraux de gabarit pour la clé : <code>{'t(`Hello ${name}`)'}</code> n'est pas extractible.

### Interpolation

Utilisez l'interpolation native du deuxième argument d'i18next pour les espaces réservés <code>{"{{var}}"}</code> :

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

La commande extract analyse le **deuxième argument** lorsqu'il s'agit d'un objet littéral simple et lit des indicateurs réservés à l'outil comme **`plurals: true`** et **`zeroDigit`** (voir **Pluriels cardinaux** ci-dessous). Pour les chaînes ordinaires, seule la clé littérale est utilisée pour le hachage ; les options d'interpolation sont tout de même transmises à i18next au moment de l'exécution.

Si votre projet utilise un utilitaire d'interpolation personnalisé (par exemple, appeler `t('key')` puis transmettre le résultat via une fonction modèle comme `interpolateTemplate(t('Hello {{name}}'), { name })`), **`setupKeyAsDefaultT`** (via **`wrapI18nWithKeyTrim`**) rend cela inutile — il applique l'interpolation <code>{"{{var}}"}</code> même lorsque la langue source renvoie la clé brute. Migrez les appels vers `t('Hello {{name}}', { name })` et supprimez l'utilitaire personnalisé.

### Pluriels cardinaux (`plurals: true`)

Utilisez le **même littéral** que vous souhaitez comme texte par défaut pour le développeur, et passez **`plurals: true`** afin que extract + `translate-ui` traitent l'appel comme un **groupe pluriel cardinal** (formes `_zero` … `_other` au style i18next JSON v4).

```tsx
{t('{{count}} items in your cart', { plurals: true, count: n })}
```

- **`zeroDigit`** (facultatif) — réservé à l'outil ; **non** lu par i18next. Quand `true`, les invites privilégient un **`0`** arabe littéral dans la chaîne `_zero` pour chaque langue où cette forme existe ; quand `false` ou omis, une formulation naturelle du zéro est utilisée. Supprimez ces clés avant d'appeler `i18next.t` (voir `wrapT` ci-dessous).

**Validation :** Si le message contient **deux ou plus** de `{{…}}` distincts, **l'un d'eux doit être `{{count}}`** (l'axe du pluriel). Sinon, `extract` **échoue** avec un message clair indiquant le fichier et la ligne.

**Deux comptes indépendants** (par exemple sections et pages) ne peuvent pas partager un même message pluriel — utilisez **deux** appels `t()` (chacun avec `plurals: true` et son propre `count`) et concaténez dans l'interface.

**Dans `strings.json`,** les groupes pluriels utilisent **une ligne par hachage** avec `"plural": true`, le littéral d'origine dans **`source`**, et **`translated[locale]`** comme objet mappant les catégories cardinales (`zero`, `one`, `two`, `few`, `many`, `other`) aux chaînes pour cette langue.

**JSON plat par paramètre régional :** Les lignes non plurielles restent au format **phrase source → traduction**. Les lignes plurielles sont émises sous forme de **`<groupId>_original`** (égal à `source`, à titre de référence) et de **`<groupId>_<form>`** pour chaque suffixe, afin qu’i18next puisse résoudre les pluriels de manière native. **`translate-ui`** écrit également **`{sourceLocale}.json`** contenant **uniquement** les clés plurielles plates (chargez ce bundle pour la langue source afin que les clés suffixées soient résolues ; les chaînes simples utilisent toujours la clé comme valeur par défaut). Pour chaque paramètre régional cible, les clés suffixées émises correspondent à **`Intl.PluralRules`** pour ce paramètre régional (`requiredCldrPluralForms`) : si `strings.json` a omis une catégorie car elle correspondait à une autre après compactage (par exemple, en arabe **`many`** identique à **`other`**), **`translate-ui`** écrit tout de même chaque suffixe requis dans le fichier plat en le copiant depuis une chaîne de secours, afin qu’aucune clé ne soit jamais manquée lors de la recherche au moment de l’exécution.

Exécution (`ai-i18n-tools/runtime`) : **Appelez** `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle })` — cela exécute **`wrapI18nWithKeyTrim`**, enregistre le bundle pluriel optionnel **`translate-ui`** `{sourceLocale}.json`, puis **`wrapT`** en utilisant **`buildPluralIndexFromStringsJson(stringsJson)`**. `wrapT` supprime `plurals` / `zeroDigit`, réécrit la clé en identifiant du groupe si nécessaire, et transmet **`count`** (facultatif : s'il existe un seul paramètre non-`{{count}}`, `count` est copié depuis cette option numérique).

**Environnements plus anciens :** `Intl.PluralRules` est requis pour les outils et pour un comportement cohérent ; utilisez un polyfill si vous ciblez des navigateurs très anciens.

**Non inclus dans la v1 :** pluriels ordinaux (`_ordinal_*`, `ordinal: true`), pluriels par intervalle, pipelines uniquement ICU.

### Interface de sélection de langue

Utilisez le manifeste `ui-languages.json` pour construire un sélecteur de langue. `ai-i18n-tools` exporte deux helpers d'affichage :

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

`getUILanguageLabel(lang, t)` - affiche `t(englishName)` lorsque traduit, ou `englishName / t(englishName)` lorsque les deux diffèrent. Convient pour les écrans de paramètres.

`getUILanguageLabelNative(lang)` - affiche `englishName / label` (pas d'appel à `t()` sur chaque ligne). Convient pour les menus d'en-tête où vous souhaitez que le nom natif soit visible.

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

Le manifeste est généré par `generate-ui-languages` à partir de `sourceLocale` + `targetLocales` et du catalogue maître regroupé. Il est écrit dans `ui.flatOutputDir`. Si vous modifiez l'une des langues dans la configuration, exécutez `generate-ui-languages` pour mettre à jour le fichier `ui-languages.json`.

### Langues RTL

`ai-i18n-tools` exporte `getTextDirection(lng)` et `applyDirection(lng)` :

```js
import { getTextDirection, applyDirection } from 'ai-i18n-tools/runtime';

getTextDirection('ar')    // 'rtl'
getTextDirection('en-GB') // 'ltr'

// Applied automatically via i18n.on('languageChanged', applyDirection) - see Step 4
```

`applyDirection` définit `document.documentElement.dir` (navigateur) ou est une opération sans effet (Node.js). Passez un argument `element` optionnel pour cibler un élément spécifique.

Pour les chaînes qui peuvent contenir des flèches `→`, inversez-les pour les mises en page RTL :

```js
import { flipUiArrowsForRtl } from 'ai-i18n-tools/runtime';
const { i18n } = useTranslation();
const isRtl = getTextDirection(i18n.language) === 'rtl';
const label = flipUiArrowsForRtl(t('Next → Step'), isRtl);
```

---

## Flux de travail 2 - Traduction de documents

Conçu pour la documentation markdown, les sites Docusaurus, et les fichiers de labels JSON. Les actifs SVG autonomes sont traduits via [`translate-svg`](#cli-reference) lorsque `features.translateSVG` est activé et que le bloc `svg` de niveau supérieur est défini — pas via `documentations[].contentPaths`.

### Étape 1 : Initialiser pour la documentation

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

Modifiez le fichier généré `ai-i18n-tools.config.json` :

- `sourceLocale` - langue source (doit correspondre à `defaultLocale` dans `docusaurus.config.js`).
- `targetLocales` - tableau de codes de langue BCP-47 (par exemple `["de", "fr", "es"]`).
- `cacheDir` - répertoire partagé de cache SQLite pour tous les pipelines de documentation (et répertoire par défaut des journaux pour `--write-logs`).
- `documentations` - tableau de blocs de documentation. Chaque bloc comporte des champs facultatifs `description`, `contentPaths`, `outputDir`, `jsonSource` facultatif, `markdownOutput`, `segmentSplitting` facultatif, `targetLocales`, `addFrontmatter`, etc.
- `documentations[].description` - note courte facultative à destination des mainteneurs (indiquant la portée de ce bloc). Lorsqu'elle est définie, elle apparaît dans le titre `translate-docs` (`🌐 …: translating …`) et dans les en-têtes de section `status`.
- `documentations[].contentPaths` - répertoires ou fichiers sources en markdown/MDX (voir aussi `documentations[].jsonSource` pour les fichiers d'étiquettes JSON).
- `documentations[].outputDir` - répertoire racine de sortie traduit pour ce bloc.
- `documentations[].markdownOutput.style` - `"nested"` (par défaut), `"docusaurus"` ou `"flat"` (voir [Dispositions de sortie](#output-layouts)).

### Étape 2 : Traduire des documents

```bash
npx ai-i18n-tools translate-docs
```

Cela traduit tous les fichiers de chaque bloc `documentations` dans `contentPaths` vers toutes les langues de documentation effectives (union des `targetLocales` de chaque bloc s'ils sont définis, sinon `targetLocales` à la racine). Les segments déjà traduits sont servis depuis le cache SQLite — seuls les segments nouveaux ou modifiés sont envoyés au LLM.

Pour traduire une seule locale :

```bash
npx ai-i18n-tools translate-docs --locale de
```

Pour vérifier ce qui doit être traduit :

```bash
npx ai-i18n-tools status
```

#### Comportement du cache et drapeaux `translate-docs`

La CLI garde une **suivi des fichiers** dans SQLite (hash source par fichier × locale) et des lignes de **segment** (hash × locale par morceau traduisible). Un fonctionnement normal ignore complètement un fichier lorsque le hash suivi correspond à la source actuelle **et** que le fichier de sortie existe déjà ; sinon, il traite le fichier et utilise le cache de segments afin que le texte inchangé n'appelle pas l'API.

| Indicateur                    | Effet                                                                                                                                                                                                                                                                  |
|-------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| *(par défaut)*                  | Ignorer les fichiers inchangés lorsque le suivi et la sortie sur disque correspondent ; utiliser le cache de segments pour le reste.                                                                                                                                                                              |
| `-l, --locale <codes>`        | Langues cibles séparées par des virgules (en l'absence, la valeur par défaut correspond à l'union de `targetLocales` à la racine et des `targetLocales` facultatifs de chaque bloc `documentations[]`).                                                                                                                                                          |
| `-p, --path` / `-f, --file`   | Ne traduire que le markdown/JSON situé sous ce chemin (relatif au projet ou absolu) ; `--file` est un alias pour `--path`.                                                                                                                                                         |
| `--dry-run`                   | Aucune écriture de fichiers ni appel d'API.                                                                                                                                                                                                                                        |
| `--type <kind>`               | Limiter à `markdown` ou `json` (sinon les deux, si activés dans la configuration).                                                                                                                                                                                               |
| `--json-only` / `--no-json`   | Ne traduire que les fichiers d'étiquettes JSON, ou ignorer les fichiers JSON et traduire uniquement le markdown.                                                                                                                                                                                              |
| `-j, --concurrency <n>`       | Nombre maximal de langues cibles en parallèle (valeur par défaut provenant de la configuration ou de la valeur intégrée par défaut du CLI).                                                                                                                                                                                              |
| `-b, --batch-concurrency <n>` | Nombre maximal d'appels d'API par lot en parallèle par fichier (documentation ; valeur par défaut provenant de la configuration ou du CLI).                                                                                                                                                                                               |
| `--emphasis-placeholders`     | Masque les marqueurs d'accentuation Markdown en tant que placeholders avant la traduction (facultatif ; désactivé par défaut).                                                                                                                                                                              |
| `--debug-failed`              | Écrit des journaux `FAILED-TRANSLATION` détaillés dans `cacheDir` en cas d'échec de validation.                                                                                                                                                                                        |
| `--force-update`              | Traite à nouveau chaque fichier correspondant (extraction, réassemblage, écriture des sorties) même si le suivi des fichiers aurait permis de l'ignorer. **Le cache de segments s'applique toujours** — les segments inchangés ne sont pas envoyés au LLM.                                                                                    |
| `--force`                     | Efface le suivi des fichiers pour chaque fichier traité et **ne lit pas** le cache de segments pour la traduction API (retraduction complète). Les nouveaux résultats sont néanmoins **écrits** dans le cache de segments.                                                                                 |
| `--stats`                     | Affiche les nombres de segments, le nombre de fichiers suivis et les totaux par langue, puis quitte.                                                                                                                                                                                    |
| `--clear-cache [locale]`      | Supprime les traductions mises en cache (et le suivi des fichiers) : pour toutes les langues, ou pour une langue spécifique, puis quitte.                                                                                                                                                                             |
| `--prompt-format <mode>`      | Définit la manière dont chaque **lot** de segments est envoyé au modèle et analysé (`xml`, `json-array` ou `json-object`). Par défaut : **`json-array`**. Ne modifie pas l'extraction, les placeholders, la validation, le cache ou le comportement de secours — voir [Format du prompt par lot](#batch-prompt-format). |

Vous ne pouvez pas combiner `--force` avec `--force-update` (ils sont mutuellement exclusifs).

#### Format du prompt par lot

`translate-docs` envoie les segments traduisibles à OpenRouter par **lots** (groupés par `batchSize` / `maxBatchChars`). L'option **`--prompt-format`** ne modifie que le **format de transmission** de ce lot ; les jetons `PlaceholderHandler`, les vérifications AST Markdown, les clés de cache SQLite et le secours par segment en cas d'échec d'analyse par lot restent inchangés.

| Mode                       | Message utilisateur                                                           | Réponse du modèle                                                 |
|----------------------------|------------------------------------------------------------------------|-------------------------------------------------------------|
| **`xml`**                  | Pseudo-XML : un `<seg id="N">…</seg>` par segment (avec échappement XML). | Uniquement des blocs `<t id="N">…</t>`, un par index de segment.       |
| **`json-array`** (par défaut) | Un tableau JSON de chaînes, une entrée par segment dans l'ordre.               | Un tableau JSON de la **même longueur** (même ordre).           |
| **`json-object`**          | Un objet JSON `{"0":"…","1":"…",…}` indexé par l'index du segment.            | Un objet JSON avec les **mêmes clés** et des valeurs traduites. |

L'en-tête d'exécution affiche également `Batch prompt format: …` afin que vous puissiez confirmer le mode actif. Les fichiers d'étiquettes JSON (`jsonSource`) et les lots SVG autonomes utilisent le même paramètre lorsque ces étapes s'exécutent dans le cadre de `translate-docs` (ou de la phase de documentation de `sync` — `sync` n'expose pas ce drapeau ; il utilise par défaut **`json-array`**).

#### Dédoublonnage des segments et chemins dans SQLite

- Les lignes de segment sont indexées globalement par `(source_hash, locale)` (hash = contenu normalisé). Un texte identique dans deux fichiers partage une même ligne ; `translations.filepath` est une métadonnée (dernier rédacteur), pas une entrée de cache supplémentaire par fichier.
- `file_tracking.filepath` utilise des clés avec espace de noms : `doc-block:{index}:{relPath}` par bloc `documentations` (`relPath` est un chemin posix relatif à la racine du projet : les chemins markdown tels que collectés ; **les fichiers d'étiquettes JSON utilisent le chemin relatif au répertoire courant du fichier source**, par exemple `docs-site/i18n/en/code.json`, afin que le nettoyage puisse résoudre le fichier réel), et `svg-assets:{relPath}` pour les ressources SVG autonomes situées sous `translate-svg`.
- `translations.filepath` stocke les chemins posix relatifs au répertoire courant pour les segments markdown, JSON et SVG (SVG utilise la même forme de chemin que les autres ressources ; le préfixe `svg-assets:…` est **uniquement** présent dans `file_tracking`).
- Après une exécution, `last_hit_at` est effacé uniquement pour les lignes de segment **dans la même portée de traduction** (respectant `--path` et les types activés) qui n'ont pas été touchées, ainsi une exécution filtrée ou uniquement docs ne marque pas comme obsolètes les fichiers non concernés.

### Dispositions de sortie

`"nested"` (par défaut lorsqu'omis) — reflète l'arborescence source sous `{outputDir}/{locale}/` (par exemple `docs/guide.md` → `i18n/de/docs/guide.md`).

`"docusaurus"` — place les fichiers situés sous `docsRoot` dans `i18n/<locale>/docusaurus-plugin-content-docs/current/<relativeToDocsRoot>`, conformément à la structure i18n Docusaurus habituelle. Définissez `documentations[].markdownOutput.docsRoot` sur la racine source de votre documentation (par exemple `"docs"`).

```text
docs/guide.md         → i18n/de/docusaurus-plugin-content-docs/current/guide.md
i18n/en/sidebar.json  → i18n/de/sidebar.json  (JSON label files)
```

`"flat"` - place les fichiers traduits à côté du fichier source avec un suffixe de langue, ou dans un sous-répertoire. Les liens relatifs entre pages sont réécrits automatiquement.

```text
docs/guide.md → i18n/guide.de.md
```

Vous pouvez remplacer complètement les chemins avec `documentations[].markdownOutput.pathTemplate`. Espaces réservés : <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{LOCALE}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{basename}"}</code>, <code>{"{extension}"}</code>, <code>{"{docsRoot}"}</code>, <code>{"{relativeToDocsRoot}"}</code>.

---

## Flux de travail combiné (UI + Docs)

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

`glossary.uiGlossary` pointe la traduction des documents vers le même catalogue `strings.json` que l'UI afin que la terminologie reste cohérente ; `glossary.userGlossary` ajoute des remplacements CSV pour les termes produits.

Exécutez `npx ai-i18n-tools sync` pour exécuter un pipeline : **extraire** les chaînes UI (si `features.extractUIStrings`), **traduire les chaînes UI** (si `features.translateUIStrings`), **traduire les actifs SVG autonomes** (si `features.translateSVG` et un bloc `svg` sont définis), puis **traduire la documentation** (chaque bloc `documentations` : markdown/JSON comme configuré). Ignorez les parties avec `--no-ui`, `--no-svg`, ou `--no-docs`. L'étape de documentation accepte `--dry-run`, `-p` / `--path`, `--force`, et `--force-update` (les deux dernières ne s'appliquent que lorsque la traduction de la documentation est exécutée ; elles sont ignorées si vous passez `--no-docs`).

Utilisez `documentations[].targetLocales` sur un bloc pour traduire les fichiers de ce bloc vers un **sous-ensemble plus petit** que l'UI (les locales de documentation effectives sont l'**union** des blocs) :

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

### Flux de travail de documentation mixte (Docusaurus + plat)

Vous pouvez combiner plusieurs pipelines de documentation dans la même configuration en ajoutant plusieurs entrées dans `documentations`. C’est une configuration courante lorsqu’un projet dispose d’un site Docusaurus ainsi que de fichiers markdown au niveau racine (par exemple, un fichier Lisez-moi de dépôt) devant être traduits avec une sortie plate.

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
            "separator": " · "
          }
        }
      }
    }
  ]
}
```

Comment cela s’exécute avec `npx ai-i18n-tools sync` :

- Les chaînes d’interface sont extraites/traduites depuis `src/` vers `public/locales/`.
- Le premier bloc de documentation traduit les fichiers markdown et les libellés JSON dans une structure `i18n/<locale>/...` Docusaurus.
- Le second bloc de documentation traduit `README.md` en fichiers plats suffixés par paramètre régional sous `translated-docs/`.
- Tous les blocs de documentation partagent `cacheDir`, de sorte que les segments inchangés sont réutilisés entre les exécutions, réduisant ainsi les appels API et les coûts.

---

## Référence de configuration

### `sourceLocale`

Code BCP-47 pour la langue source (par exemple `"en-GB"`, `"en"`, `"pt-BR"`). Aucun fichier de traduction n'est généré pour cette langue — la chaîne clé elle-même constitue le texte source.

**Doit correspondre** à `SOURCE_LOCALE` exporté de votre fichier de configuration i18n d'exécution (`src/i18n.ts` / `src/i18n.js`).

### `targetLocales`

Tableau de codes de langue BCP-47 vers lesquels traduire (par exemple `["de", "fr", "es", "pt-BR"]`).

`targetLocales` est la liste principale des paramètres régionaux pour la traduction de l'interface utilisateur et la liste par défaut des paramètres régionaux pour les blocs de documentation. Utilisez `generate-ui-languages` pour générer le manifeste `ui-languages.json` à partir de `sourceLocale` + `targetLocales`.

### `uiLanguagesPath` (optionnel)

Chemin vers le manifeste `ui-languages.json` utilisé pour les noms d'affichage, le filtrage des paramètres régionaux et le post-traitement de la liste des langues. En l'absence de valeur, l'interface en ligne de commande cherche le manifeste à l'emplacement `ui.flatOutputDir/ui-languages.json`.

Utilisez ceci lorsque :

- Le manifeste se trouve en dehors de `ui.flatOutputDir` et vous devez indiquer explicitement son emplacement à l'interface en ligne de commande.
- Vous souhaitez que `markdownOutput.postProcessing.languageListBlock` génère les étiquettes des paramètres régionaux à partir du manifeste.
- `extract` doit fusionner les entrées `englishName` du manifeste dans `strings.json` (nécessite `ui.reactExtractor.includeUiLanguageEnglishNames: true`).

### `concurrency` (optionnel)

Nombre maximum de **locales cibles** traduites en même temps (`translate-ui`, `translate-docs`, `translate-svg`, et les étapes correspondantes à l'intérieur de `sync`). Si omis, le CLI utilise **4** pour la traduction de l'UI et **3** pour la traduction de la documentation (valeurs par défaut intégrées). Remplacez par exécution avec `-j` / `--concurrency`.

### `batchConcurrency` (optionnel)

**translate-docs** et **translate-svg** (et l'étape de documentation de `sync`) : nombre maximum de requêtes **batch** OpenRouter en parallèle par fichier (chaque batch peut contenir plusieurs segments). Par défaut **4** si omis. Ignoré par `translate-ui`. Remplacez avec `-b` / `--batch-concurrency`. Sur `sync`, `-b` s'applique uniquement à l'étape de traduction de la documentation.

### `batchSize` / `maxBatchChars` (optionnel)

Regroupement de segments pour la traduction de documents : combien de segments par requête API, et un plafond de caractères. Valeurs par défaut : **20** segments, **4096** caractères (si omis).

### `openrouter`

| Champ               | Description                                                                                                                                                                                                      |
|---------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `baseUrl`           | URL de base de l'API OpenRouter. Par défaut : `https://openrouter.ai/api/v1`.                                                                                                                                                |
| `translationModels` | Liste ordonnée préférée des identifiants de modèles. Le premier est essayé en premier ; les entrées suivantes sont utilisées en cas d'erreur. Pour `translate-ui` uniquement, vous pouvez également définir `ui.preferredModel` pour essayer un modèle avant cette liste (voir `ui`). |
| `defaultModel`      | Modèle principal unique hérité. Utilisé uniquement lorsque `translationModels` n'est pas défini ou est vide.                                                                                                                               |
| `fallbackModel`     | Modèle de secours unique hérité. Utilisé après `defaultModel` lorsque `translationModels` n'est pas défini ou est vide.                                                                                                              |
| `maxTokens`         | Nombre maximal de jetons de complétion par requête. Par défaut : `8192`.                                                                                                                                                              |
| `temperature`       | Température d'échantillonnage. Par défaut : `0.2`.                                                                                                                                                                            |

**Pourquoi utiliser plusieurs modèles :** Différents fournisseurs et modèles ont des coûts variables et offrent des niveaux de qualité différents selon les langues et les localisations. Configurez `openrouter.translationModels` **comme une chaîne de secours ordonnée** (plutôt qu'un seul modèle) afin que l'interface en ligne de commande puisse essayer le modèle suivant en cas d'échec d'une requête.

Considérez la liste ci-dessous comme une **base** que vous pouvez étendre : si la traduction pour une région spécifique est médiocre ou infructueuse, renseignez-vous sur les modèles qui prennent efficacement en charge cette langue ou ce script (consultez les ressources en ligne ou la documentation de votre fournisseur) et ajoutez ces identifiants OpenRouter comme alternatives supplémentaires.

Cette liste a **été testée pour une couverture étendue des localisations** (par exemple, en **avril 2026**, lors de la traduction de **36** localisations cibles dans un vaste projet de documentation) ; elle constitue une valeur par défaut pratique, mais n'est pas garantie pour fonctionner correctement dans toutes les localisations.

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

Définissez `OPENROUTER_API_KEY` dans votre environnement ou fichier `.env`.

### `features`

| Champ                | Flux de travail | Description                                                                                                                                                        |
|----------------------|----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `extractUIStrings`   | 1        | Analyser la source pour `t("…")` / `i18n.t("…")`, fusionner la description facultative `package.json` et (si activé) les valeurs `ui-languages.json` `englishName` dans `strings.json`. |
| `translateUIStrings` | 1        | Traduire les entrées `strings.json` et générer des fichiers JSON par localisation.                                                                                                  |
| `translateMarkdown`  | 2        | Traduire les fichiers `.md` / `.mdx`.                                                                                                                                    |
| `translateJSON`      | 2        | Traduire les fichiers de libellés JSON Docusaurus.                                                                                                                             |
| `translateSVG`       | 2        | Traduire les ressources autonomes `.svg` (nécessite un bloc **`svg`** au niveau supérieur).                                                                                         |

**Traduire des ressources autonomes** SVG avec `translate-svg` lorsque `features.translateSVG` est à true et qu'un bloc `svg` au niveau supérieur est configuré. La commande `sync` exécute cette étape lorsque les deux conditions sont remplies (sauf si `--no-svg`).

### `ui`

| Champ                                          | Description                                                                                                                                                                                                                                                        |
|------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `sourceRoots`                                  | Répertoires (relatifs au répertoire de travail courant) analysés pour les appels `t("…")`.                                                                                                                                                                                                          |
| `stringsJson`                                  | Chemin vers le fichier catalogue principal. Mis à jour par `extract`.                                                                                                                                                                                                             |
| `flatOutputDir`                                | Répertoire dans lequel les fichiers JSON par langue sont écrits (`de.json`, etc.).                                                                                                                                                                                               |
| `preferredModel`                               | Facultatif. Identifiant du modèle OpenRouter essayé en premier pour `translate-ui` uniquement ; puis `openrouter.translationModels` (ou modèles antérieurs) dans l'ordre, sans dupliquer cet identifiant.                                                                                                   |
| `reactExtractor.funcNames`                     | Noms de fonctions supplémentaires à analyser (par défaut : `["t", "i18n.t"]`).                                                                                                                                                                                                    |
| `reactExtractor.extensions`                    | Extensions de fichiers à inclure (par défaut : `[".js", ".jsx", ".ts", ".tsx"]`).                                                                                                                                                                                            |
| `reactExtractor.includePackageDescription`     | Lorsque `true` (par défaut), `extract` inclut également `package.json` `description` comme chaîne d'interface utilisateur lorsqu'elle est présente.                                                                                                                                                           |
| `reactExtractor.packageJsonPath`               | Chemin personnalisé vers le fichier `package.json` utilisé pour l'extraction facultative de cette description.                                                                                                                                                                              |
| `reactExtractor.includeUiLanguageEnglishNames` | Lorsque `true` (par défaut `false`), `extract` ajoute également chaque `englishName` du manifeste situé à `uiLanguagesPath` à `strings.json` lorsqu'il n'est pas déjà présent dans l'analyse source (mêmes clés de hachage). Nécessite que `uiLanguagesPath` pointe vers un `ui-languages.json` valide. |

### `cacheDir`

| Champ      | Description                                                                 |
| ---------- | ----------------------------------------------------------------------------- |
| `cacheDir` | Répertoire du cache SQLite (partagé par tous les blocs `documentations`). À réutiliser entre les exécutions. Si vous migrez depuis un cache personnalisé de traduction de documentation, archivez-le ou supprimez-le — `cacheDir` crée sa propre base de données SQLite et n'est pas compatible avec d'autres schémas. |

Meilleures pratiques pour les exclusions dans le contrôle de version (VCS) :

- Excluez le contenu du dossier de cache de traduction (par exemple via `.gitignore` ou `.git/info/exclude`) afin d’éviter de valider des artefacts de cache temporaires.
- Conservez `cache.db` disponible (ne le supprimez pas systématiquement), car la préservation du cache SQLite évite de retraduire les segments inchangés, ce qui permet d’économiser à la fois le temps d’exécution et les coûts API lors de modifications ou mises à niveau de logiciels utilisant `ai-i18n-tools`.

Exemple :

```gitignore
# Translation cache directory
.translation-cache/*

# Keep SQLite cache for reuse
!.translation-cache/cache.db
```

### `documentations`

Tableau de blocs du pipeline de documentation. `translate-docs` et la phase de documentation de `sync` **traitent chaque** bloc dans l'ordre.

| Champ                                             | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
|---------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `description`                                     | Note facultative, lisible par l'humain, pour ce bloc (non utilisée pour la traduction). Préfixée dans le titre `translate-docs` `🌐` lorsqu'elle est définie ; également affichée dans les en-têtes de section `status`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `contentPaths`                                    | Sources Markdown/MDX à traduire (`translate-docs` les analyse pour détecter les éléments `.md` / `.mdx`). Les libellés JSON proviennent de `jsonSource` sur le même bloc.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `outputDir`                                       | Répertoire racine pour la sortie traduite de ce bloc.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `sourceFiles`                                     | Alias facultatif fusionné dans `contentPaths` au chargement.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `targetLocales`                                   | Sous-ensemble facultatif de paramètres régionaux pour ce bloc uniquement (sinon paramètres régionaux racine `targetLocales`). Les paramètres régionaux documentés effectifs sont l'union entre tous les blocs.                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `jsonSource`                                      | Répertoire source des fichiers d'étiquettes JSON Docusaurus pour ce bloc (par exemple `"i18n/en"`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `markdownOutput.style`                            | `"nested"` (par défaut), `"docusaurus"` ou `"flat"`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `markdownOutput.docsRoot`                         | Répertoire source de la documentation pour la disposition Docusaurus (par exemple `"docs"`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `markdownOutput.pathTemplate`                     | Chemin personnalisé de sortie pour le markdown. Espaces réservés : <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{LOCALE}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{basename}"}</code>, <code>{"{extension}"}</code>, <code>{"{docsRoot}"}</code>, <code>{"{relativeToDocsRoot}"}</code>.                                                                                                                                                                                                                                                                                                                                                     |
| `markdownOutput.jsonPathTemplate`                 | Chemin personnalisé de sortie au format JSON pour les fichiers d'étiquettes. Prend en charge les mêmes espaces réservés que `pathTemplate`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `markdownOutput.flatPreserveRelativeDir`          | Pour le style `flat`, conserver les sous-répertoires sources afin d'éviter les conflits entre fichiers ayant le même nom de base.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `markdownOutput.rewriteRelativeLinks`             | Réécrire les liens relatifs après traduction (activé automatiquement pour le style `flat`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `markdownOutput.linkRewriteDocsRoot`              | Racine du dépôt utilisée lors du calcul des préfixes de réécriture des liens plats. Laissez généralement cette valeur à `"."`, sauf si vos documents traduits se trouvent sous une racine de projet différente.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `markdownOutput.postProcessing`                | Transformations facultatives appliquées au **corps en markdown** traduit (le front matter YAML est préservé). S'exécute après le réassemblage des segments et la réécriture des liens plats, et avant `addFrontmatter`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `segmentSplitting`                             | Niveau identique à `markdownOutput` (par bloc `documentations[]`). Segments facultatifs plus fins pour l'extraction **`translate-docs`** : `{ "enabled", "maxCharsPerSegment"?, "splitPipeTables"?, "splitDenseParagraphs"?, "maxLinesPerParagraphChunk"?, "splitLongLists"?, "maxListItemsPerChunk"? }`. Lorsque **`enabled`** vaut **`true`** (valeur par défaut si **`segmentSplitting`** est omis), les paragraphes denses, les tableaux GFM avec pipes (le premier segment inclut l'en-tête, le séparateur et la première ligne de données) et les longues listes sont divisés ; les sous-parties sont réassemblées avec des sauts de ligne simples (**`tightJoinPrevious`**). Définir **`"enabled": false`** pour utiliser un segment par bloc de texte séparé uniquement par des lignes vides. |
| `markdownOutput.postProcessing.regexAdjustments`  | Liste ordonnée de `{ "description"?, "search", "replace" }`. `search` est un motif regex (une chaîne simple utilise le drapeau `g`, ou `/pattern/flags`). `replace` prend en charge des espaces réservés tels que `${translatedLocale}`, `${sourceLocale}`, `${sourceFullPath}`, `${translatedFullPath}`, `${sourceFilename}`, `${translatedFilename}`, `${sourceBasedir}`, `${translatedBasedir}`.                                                                                                                                                                                                                                                                                                    |
| `markdownOutput.postProcessing.languageListBlock` | `{ "start", "end", "separator" }` — le traducteur recherche la première ligne contenant `start` et la ligne `end` correspondante, puis remplace cette portion par un sélecteur de langue normalisé. Les liens sont construits avec des chemins relatifs au fichier traduit ; les libellés proviennent de `uiLanguagesPath` / `ui-languages.json` si configurés, sinon de `localeDisplayNames` et des codes de langue.                                                                                                                                                                                                                                                                                       |
| `addFrontmatter`                                  | Lorsque `true` (valeur par défaut si omis), les fichiers markdown traduits incluent les clés YAML : `translation_last_updated`, `source_file_mtime`, `source_file_hash`, `translation_language`, `source_file_path`, et lorsqu'au moins un segment contient des métadonnées de modèle, `translation_models` (liste triée des identifiants de modèles OpenRouter utilisés). Définir sur `false` pour ignorer.                                                                                                                                                                                                                                                                                                                           |

Exemple (pipeline README plat — chemins des captures d'écran + wrapper de liste de langues optionnel) :

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
      "separator": " · "
    }
  }
}
```

### `svg` (optionnel)

Chemins de niveau supérieur et mise en page pour les actifs SVG autonomes. La traduction s'exécute uniquement lorsque **`features.translateSVG`** est vrai (via `translate-svg` ou l'étape SVG de `sync`).

| Champ                         | Description                                                                                                                                                                                                                                                                        |
|-------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `sourcePath`                  | Un répertoire ou un tableau de répertoires analysés récursivement pour les fichiers `.svg`.                                                                                                                                                                                                     |
| `outputDir`                   | Répertoire racine pour la sortie SVG traduite.                                                                                                                                                                                                                                          |
| `style`                       | `"flat"` ou `"nested"` lorsque `pathTemplate` n'est pas défini.                                                                                                                                                                                                                               |
| `pathTemplate`                | Chemin personnalisé de sortie SVG. Espaces réservés : <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{LOCALE}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{basename}"}</code>, <code>{"{extension}"}</code>, <code>{"{relativeToSourceRoot}"}</code>. |
| `svgExtractor.forceLowercase` | Texte traduit en minuscules lors de la réassemblage SVG. Utile pour les conceptions qui reposent sur des libellés entièrement en minuscules.                                                                                                                                                                                |

### `glossary`

| Champ          | Description                                                                                                                                                                 |
|----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `uiGlossary`   | Chemin vers `strings.json` - crée automatiquement un glossaire à partir des traductions existantes.                                                                                                 |
| `userGlossary` | Chemin vers un fichier CSV avec les colonnes `Original language string` (ou `en`), `locale`, `Translation` - une ligne par terme source et langue cible (`locale` peut être `*` pour toutes les cibles). |

La clé héritée `uiGlossaryFromStringsJson` est toujours acceptée et mappée à `uiGlossary` lors du chargement de la configuration.

Générer un CSV de glossaire vide :

```bash
npx ai-i18n-tools glossary-generate
```

---

## Référence CLI

| Command                                                                     | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
|-----------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `version`                                                                   | Affiche la version de l'interface en ligne de commande et l'horodatage de compilation (les mêmes informations que `-V` / `--version` du programme racine).
| `init [-t ui-markdown\|ui-docusaurus] [-o path] [--with-translate-ignore]`  | Écrire un fichier de configuration de démarrage (inclut `concurrency`, `batchConcurrency`, `batchSize`, `maxBatchChars` et `documentations[].addFrontmatter`). `--with-translate-ignore` crée un `.translate-ignore` de démarrage.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `extract`                                                                   | Mettre à jour `strings.json` à partir des littéraux `t("…")` / `i18n.t("…")`, d'une description facultative `package.json` et d'entrées facultatives de manifeste `englishName` (voir `ui.reactExtractor`). Nécessite `features.extractUIStrings`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `generate-ui-languages [--master <path>] [--dry-run]`                       | Écrire `ui-languages.json` dans `ui.flatOutputDir` (ou `uiLanguagesPath` si défini) en utilisant `sourceLocale` + `targetLocales` et le `data/ui-languages-complete.json` intégré (ou `--master`). Affiche un avertissement et émet des espaces réservés `TODO` pour les paramètres régionaux manquants dans le fichier maître. Si vous disposez d'un manifeste existant avec des valeurs personnalisées pour `label` ou `englishName`, celles-ci seront remplacées par les valeurs par défaut du catalogue maître — veuillez examiner et ajuster le fichier généré par la suite.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `translate-docs …`                                                          | Traduire le markdown/MDX et le JSON pour chaque bloc `documentations` (`contentPaths`, `jsonSource` facultatif). `-j` : nombre maximal de langues en parallèle ; `-b` : nombre maximal d'appels d'API par lot par fichier en parallèle. `--prompt-format` : format de transmission par lot (`xml` \| `json-array` \| `json-object`). Voir [Comportement du cache et indicateurs `translate-docs`](#cache-behaviour-and-translate-docs-flags) et [Format du message par lot](#batch-prompt-format).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `translate-svg …`                                                           | Traduire les ressources SVG autonomes configurées dans `config.svg` (distinctes de la documentation). Nécessite `features.translateSVG`. Mêmes principes de cache que pour la documentation ; prend en charge `--no-cache` pour ignorer les lectures/écritures SQLite lors de cette exécution. `-j`, `-b`, `--force`, `--force-update`, `-p` / `--path`, `--dry-run`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `translate-ui [--locale <code>] [--force] [--dry-run] [-j <n>]`             | Traduire uniquement les chaînes d'interface utilisateur. `--force` : retraduire toutes les entrées par langue (ignorer les traductions existantes). `--dry-run` : pas d'écritures, pas d'appels API. `-j` : nombre maximal de langues en parallèle. Nécessite `features.translateUIStrings`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `lint-source [-l <code>] [--chunk <n>] [--dry-run] [--json] [-j <n>]`                                                                    | Exécute `extract` en **premier** (nécessite **`features.extractUIStrings`**) afin que **`strings.json`** corresponde à la source, puis relecture par LLM des chaînes d'interface **source-locale** (orthographe, grammaire). Les **indices de terminologie** proviennent uniquement du fichier CSV **`glossary.userGlossary`** (même étendue que **`translate-ui`** — pas `strings.json` / `uiGlossary`, afin de ne pas renforcer une mauvaise formulation comme glossaire). Utilise OpenRouter (`OPENROUTER_API_KEY`). À titre indicatif uniquement (sortie avec code **0** à la fin de l'exécution). Génère **`lint-source-results_<timestamp>.log`** dans **`cacheDir`** sous forme de rapport **lisible par un humain** (résumé, problèmes, et lignes **OK** par chaîne) ; le terminal affiche uniquement les comptages récapitulatifs et les problèmes (pas de lignes **`[ok]`** par chaîne). Affiche le nom du fichier journal sur la dernière ligne. **`--json`** : génère uniquement le rapport JSON complet, lisible par machine, sur stdout (le fichier journal reste lisible par un humain). **`--dry-run`** : exécute quand même **`extract`**, puis affiche uniquement le plan du lot (pas d'appels API). **`--chunk`** : nombre de chaînes par lot d'API (par défaut **50**). **`-j`** : nombre maximal de lots parallèles (par défaut **`concurrency`**). Avec **`--json`**, la sortie au format humain est dirigée vers stderr. Les liens utilisent **`path:line`**, comme le bouton « lien » des chaînes d'interface **`editor`**. |
| `export-ui-xliff [-l <codes>] [-o <dir>] [--untranslated-only] [--dry-run]` | Exporte `strings.json` vers XLIFF 2.0 (un `.xliff` par langue cible). `-o` / `--output-dir` : répertoire de sortie (par défaut : même dossier que le catalogue). `--untranslated-only` : uniquement les unités dont la traduction pour cette langue est manquante. Lecture seule ; aucune API utilisée.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `sync …`                                                                    | Extraction (si activée), puis traduction de l'interface utilisateur, puis `translate-svg` lorsque `features.translateSVG` et `config.svg` sont définis, puis traduction de la documentation — sauf si ignorée avec `--no-ui`, `--no-svg` ou `--no-docs`. Options partagées : `-l`, `-p` / `-f`, `--dry-run`, `-j`, `-b` (uniquement pour le regroupement de la documentation), `--force` / `--force-update` (uniquement pour la documentation ; mutuellement exclusives lorsque la documentation est exécutée). La phase de documentation transmet également `--emphasis-placeholders` et `--debug-failed` (même signification que `translate-docs`). `--prompt-format` n'est pas une option `sync` ; l'étape de documentation utilise la valeur par défaut intégrée (`json-array`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `status [--max-columns <n>]`                                                | Lorsque `features.translateUIStrings` est activé, affiche la couverture de l'interface utilisateur par langue (`Translated` / `Missing` / `Total`). Ensuite, affiche l'état des traductions Markdown par fichier × langue (aucun filtre `--locale` ; les langues proviennent de la configuration). Les listes longues de langues sont divisées en plusieurs tableaux répétés d'au plus **`n`** colonnes de langues (par défaut **9**) afin que les lignes restent étroites dans le terminal.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `cleanup [--dry-run] [--no-backup] [--backup <path>]`                       | Exécute d'abord `sync --force-update` (extraction, interface utilisateur, SVG, documentation), puis supprime les lignes de segments obsolètes (`last_hit_at` nul / chemin de fichier vide) ; supprime les lignes `file_tracking` dont le chemin source résolu est absent du disque ; supprime les lignes de traduction dont les métadonnées `filepath` font référence à un fichier manquant. Affiche trois compteurs (obsolètes, `file_tracking` orphelines, traductions orphelines). Crée une sauvegarde SQLite horodatée dans le répertoire de cache, sauf si `--no-backup`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `editor [-p <port>] [--no-open]`                                            | Lance un éditeur web local pour le cache, `strings.json` et le fichier CSV du glossaire. **`--no-open` :** n'ouvre pas automatiquement le navigateur par défaut.<br><br>**Remarque :** Si vous modifiez une entrée dans l'éditeur de cache, vous devez exécuter un `sync --force-update` pour réécrire les fichiers de sortie avec l'entrée de cache mise à jour. En outre, si le texte source change ultérieurement, la modification manuelle sera perdue, car une nouvelle clé de cache est générée.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `glossary-generate [-o <path>]`                                             | Écrire un modèle `glossary-user.csv` vide. `-o` : remplacer le chemin de sortie (par défaut : `glossary.userGlossary` depuis la configuration, ou `glossary-user.csv`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

Toutes les commandes acceptent `-c <path>` pour spécifier un fichier de configuration non par défaut, `-v` pour une sortie détaillée, et `-w` / `--write-logs [path]` pour rediriger la sortie console vers un fichier journal (chemin par défaut : sous `cacheDir` racine). Le programme principal prend également en charge `-V` / `--version` et `-h` / `--help` ; `ai-i18n-tools help [command]` affiche la même aide par commande que `ai-i18n-tools <command> --help`.

---

## Variables d'environnement

| Variable                | Description                                                |
|-------------------------|------------------------------------------------------------|
| `OPENROUTER_API_KEY`    | **Requis.** Votre clé API OpenRouter.                     |
| `OPENROUTER_BASE_URL`   | Remplacer l'URL de base de l'API.                                 |
| `I18N_SOURCE_LOCALE`    | Remplacer `sourceLocale` au moment de l'exécution.                        |
| `I18N_TARGET_LOCALES`   | Codes de localisation séparés par des virgules pour remplacer `targetLocales`.  |
| `I18N_LOG_LEVEL`        | Niveau du journal (`debug`, `info`, `warn`, `error`, `silent`). |
| `NO_COLOR`              | Lorsque `1`, désactiver les couleurs ANSI dans la sortie du journal.              |
| `I18N_LOG_SESSION_MAX`  | Nombre maximal de lignes conservées par session de journal (par défaut `5000`).           |
