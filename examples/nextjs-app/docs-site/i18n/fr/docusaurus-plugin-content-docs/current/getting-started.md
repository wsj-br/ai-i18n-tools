---
translation_last_updated: '2026-04-13T00:28:34.174Z'
source_file_mtime: '2026-04-13T00:28:15.565Z'
source_file_hash: c8918e0004d77e154c0fa0f750e67e8d78e9c673ca048942b309582cb3f5c8b8
translation_language: fr
source_file_path: docs-site/docs/getting-started.md
---
# ai-i18n-tools : Prise en main

`ai-i18n-tools` fournit deux flux de travail indépendants et composables :

- **Flux de travail 1 - Traduction UI** : extraire les appels `t("…")` de n'importe quelle source JS/TS, les traduire via OpenRouter et écrire des fichiers JSON plats par locale prêts pour i18next.
- **Flux de travail 2 - Traduction de documents** : traduire des fichiers markdown (MDX) et des fichiers d'étiquettes JSON Docusaurus vers n'importe quel nombre de locales, avec un cache intelligent. Les actifs **SVG** utilisent une commande séparée (`translate-svg`) et une configuration `svg` optionnelle (voir [référence CLI](#cli-reference)).

Les deux flux de travail utilisent OpenRouter (n'importe quel LLM compatible) et partagent un seul fichier de configuration.

<small>**Lire dans d'autres langues :** </small>
<small id="lang-list">[en-GB](./GETTING_STARTED.md) · [de](../translated-docs/docs/GETTING_STARTED.de.md) · [es](../translated-docs/docs/GETTING_STARTED.es.md) · [fr](../translated-docs/docs/GETTING_STARTED.fr.md) · [hi](../translated-docs/docs/GETTING_STARTED.hi.md) · [ja](../translated-docs/docs/GETTING_STARTED.ja.md) · [ko](../translated-docs/docs/GETTING_STARTED.ko.md) · [pt-BR](../translated-docs/docs/GETTING_STARTED.pt-BR.md) · [zh-CN](../translated-docs/docs/GETTING_STARTED.zh-CN.md) · [zh-TW](../translated-docs/docs/GETTING_STARTED.zh-TW.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table des matières**

- [Installation](#installation)
- [Prise en main rapide](#quick-start)
- [Flux de travail 1 - Traduction UI](#workflow-1---ui-translation)
  - [Étape 1 : Initialiser](#step-1-initialise)
  - [Étape 2 : Extraire les chaînes](#step-2-extract-strings)
  - [Étape 3 : Traduire les chaînes UI](#step-3-translate-ui-strings)
  - [Étape 4 : Connecter i18next à l'exécution](#step-4-wire-i18next-at-runtime)
  - [Utiliser `t()` dans le code source](#using-t-in-source-code)
  - [Interpolation](#interpolation)
  - [Interface utilisateur de changement de langue](#language-switcher-ui)
  - [Langues RTL](#rtl-languages)
- [Flux de travail 2 - Traduction de documents](#workflow-2---document-translation)
  - [Étape 1 : Initialiser](#step-1-initialise-1)
  - [Étape 2 : Traduire des documents](#step-2-translate-documents)
    - [Comportement du cache et drapeaux `translate-docs`](#cache-behaviour-and-translate-docs-flags)
  - [Mises en page de sortie](#output-layouts)
- [Flux de travail combiné (UI + Docs)](#combined-workflow-ui--docs)
- [Référence de configuration](#configuration-reference)
  - [`sourceLocale`](#sourcelocale)
  - [`targetLocales`](#targetlocales)
  - [`uiLanguagesPath` (optionnel)](#uilanguagespath-optional)
  - [`concurrency` (optionnel)](#concurrency-optional)
  - [`batchConcurrency` (optionnel)](#batchconcurrency-optional)
  - [`batchSize` / `maxBatchChars` (optionnel)](#batchsize--maxbatchchars-optional)
  - [`openrouter`](#openrouter)
  - [`features`](#features)
  - [`ui`](#ui)
  - [`cacheDir`](#cachedir)
  - [`documentations`](#documentations)
  - [`svg` (optionnel)](#svg-optional)
  - [`glossary`](#glossary)
- [Référence CLI](#cli-reference)
- [Variables d'environnement](#environment-variables)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Installation {#installation}

Le package publié est **uniquement ESM**. Utilisez `import`/`import()` dans Node.js ou votre bundler ; **ne pas utiliser `require('ai-i18n-tools')`.**

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

Définissez votre clé API OpenRouter :

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Ou créez un fichier `.env` à la racine du projet :

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

## Prise en main rapide {#quick-start}

Le modèle `init` par défaut (`ui-markdown`) permet uniquement l'extraction et la traduction **UI**. Le modèle `ui-docusaurus` permet la traduction **de documents** (`translate-docs`). Utilisez `sync` lorsque vous souhaitez une commande qui exécute l'extraction, la traduction UI, la traduction SVG autonome optionnelle et la traduction de documentation selon votre configuration.

```bash
# Workflow 1 - UI strings (default template enables extract + translate-ui)
npx ai-i18n-tools init
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui

# Workflow 2 - docs (Docusaurus-oriented template)
npx ai-i18n-tools init -t ui-docusaurus
npx ai-i18n-tools translate-docs

# Combined: extract UI strings, then translate UI + docs (per config features)
npx ai-i18n-tools sync

# Markdown translation status (per file × locale)
npx ai-i18n-tools status
```

---

## Flux de travail 1 - Traduction UI {#workflow-1---ui-translation}

Conçu pour tout projet JS/TS utilisant i18next : applications React, Next.js (composants client et serveur), services Node.js, outils CLI.

### Étape 1 : Initialiser {#step-1-initialise}

```bash
npx ai-i18n-tools init
```

Cela écrit `ai-i18n-tools.config.json` avec le modèle `ui-markdown`. Modifiez-le pour définir :

- `sourceLocale` - votre code de langue source BCP-47 (par exemple, `"en-GB"`). **Doit correspondre** à `SOURCE_LOCALE` exporté depuis votre fichier de configuration i18n (`src/i18n.ts` / `src/i18n.js`).
- `targetLocales` - chemin vers votre manifeste `ui-languages.json` OU un tableau de codes BCP-47.
- `ui.sourceRoots` - répertoires à scanner pour les appels `t("…")` (par exemple, `["src/"]`).
- `ui.stringsJson` - où écrire le catalogue maître (par exemple, `"src/locales/strings.json"`).
- `ui.flatOutputDir` - où écrire `de.json`, `pt-BR.json`, etc. (par exemple, `"src/locales/"`).
- `ui.preferredModel` (optionnel) - identifiant du modèle OpenRouter à essayer **en premier** uniquement pour `translate-ui` ; en cas d'échec, la CLI continue avec `openrouter.translationModels` (ou les modèles hérités `defaultModel` / `fallbackModel`) dans l'ordre, en sautant les doublons.

### Étape 2 : Extraire les chaînes {#step-2-extract-strings}

```bash
npx ai-i18n-tools extract
```

Scanne tous les fichiers JS/TS sous `ui.sourceRoots` pour les appels `t("literal")` et `i18n.t("literal")`. Écrit (ou fusionne dans) `ui.stringsJson`.

Le scanner est configurable : ajoutez des noms de fonctions personnalisés via `ui.reactExtractor.funcNames`.

### Étape 3 : Traduire les chaînes de l'UI {#step-3-translate-ui-strings}

```bash
npx ai-i18n-tools translate-ui
```

Lit `strings.json`, envoie des lots à OpenRouter pour chaque langue cible, écrit des fichiers JSON plats (`de.json`, `fr.json`, etc.) dans `ui.flatOutputDir`. Lorsque `ui.preferredModel` est défini, ce modèle est tenté avant la liste ordonnée dans `openrouter.translationModels` (la traduction de documents et d'autres commandes utilisent toujours uniquement `openrouter`).

Pour chaque entrée, `translate-ui` stocke l'**identifiant du modèle OpenRouter** qui a réussi à traduire chaque locale dans un objet `models` optionnel (mêmes clés de locale que `translated`). Les chaînes modifiées dans la commande `editor` locale sont marquées avec la valeur sentinelle `user-edited` dans `models` pour cette locale. Les fichiers plats par locale sous `ui.flatOutputDir` restent **chaîne source → traduction** uniquement ; ils n'incluent pas `models` (donc les bundles d'exécution restent inchangés).

> **Remarque sur l'utilisation de l'éditeur de cache :** Si vous éditez une entrée dans l'éditeur de cache, vous devez exécuter une `sync --force-update` (ou la commande `translate` équivalente avec `--force-update`) pour réécrire les fichiers de sortie avec l'entrée de cache mise à jour. De plus, gardez à l'esprit que si le texte source change plus tard, votre modification manuelle sera perdue car une nouvelle clé de cache (hash) sera générée pour la nouvelle chaîne source.

### Étape 4 : Connecter i18next à l'exécution {#step-4-wire-i18next-at-runtime}

Créez votre fichier de configuration i18n en utilisant les helpers exportés par `'ai-i18n-tools/runtime'` :

```js
// src/i18n.js  (or src/i18n.ts)
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import uiLanguages from './locales/ui-languages.json';
import {
  defaultI18nInitOptions,
  wrapI18nWithKeyTrim,
  makeLoadLocale,
  applyDirection,
} from 'ai-i18n-tools/runtime';

// Must match sourceLocale in ai-i18n-tools.config.json
export const SOURCE_LOCALE = 'en-GB';

void i18n.use(initReactI18next).init(defaultI18nInitOptions(SOURCE_LOCALE));
wrapI18nWithKeyTrim(i18n);
i18n.on('languageChanged', applyDirection);
applyDirection(i18n.language);

const localeLoaders = Object.fromEntries(
  uiLanguages
    .filter(({ code }) => code !== SOURCE_LOCALE)
    .map(({ code }) => [code, () => import(`./locales/${code}.json`)])
);

export const loadLocale = makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);
export default i18n;
```

Importez `i18n.js` avant que React ne rende (par exemple, en haut de votre point d'entrée). Lorsque l'utilisateur change de langue, appelez `await loadLocale(code)` puis `i18n.changeLanguage(code)`.

`SOURCE_LOCALE` est exporté afin que tout autre fichier qui en a besoin (par exemple, un sélecteur de langue) puisse l'importer directement depuis `'./i18n'`.

`defaultI18nInitOptions(sourceLocale)` retourne les options standard pour les configurations clé-en-par défaut :

- `parseMissingKeyHandler` retourne la clé elle-même, donc les chaînes non traduites affichent le texte source.
- `nsSeparator: false` permet des clés contenant des deux-points.
- `interpolation.escapeValue: false` - sûr à désactiver : React échappe les valeurs lui-même, et la sortie Node.js/CLI n'a pas de HTML à échapper.

`wrapI18nWithKeyTrim(i18n)` enveloppe `i18n.t` de sorte que : (1) les clés sont tronquées avant la recherche, correspondant à la façon dont le script d'extraction les stocke ; (2) l'interpolation <code>{"{{var}}"}</code> est appliquée lorsque la locale source retourne la clé brute - donc <code>{"t('Hello {{name}}', { name })"}</code> fonctionne correctement même pour la langue source.

`makeLoadLocale(i18n, loaders, sourceLocale)` retourne une fonction asynchrone `loadLocale(lang)` qui importe dynamiquement le bundle JSON pour une locale et l'enregistre avec i18next.

### Utiliser `t()` dans le code source {#using-t-in-source-code}

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
- La clé doit être une **chaîne littérale** - pas de variables ou d'expressions comme clé.
- Ne pas utiliser de littéraux de modèle pour la clé : <code>{'t(`Hello ${name}`)'}</code> n'est pas extractible.

### Interpolation {#interpolation}

Utilisez l'interpolation native du deuxième argument d'i18next pour les espaces réservés <code>{"{{var}}"}</code> :

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

Le script d'extraction ignore le deuxième argument - seule la chaîne de clé littérale <code>{"\"Hello {{name}}, vous avez {{count}} messages\""}</code> est extraite et envoyée pour traduction. Les traducteurs sont instruits de préserver les jetons <code>{"{{...}}"}</code>.

### Interface de changement de langue {#language-switcher-ui}

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

`getUILanguageLabel(lang, t)` - affiche `t(englishName)` lorsqu'il est traduit, ou `englishName / t(englishName)` lorsque les deux diffèrent. Convient pour les écrans de paramètres.

`getUILanguageLabelNative(lang)` - affiche `englishName / label` (pas d'appel `t()` sur chaque ligne). Convient pour les menus d'en-tête où vous souhaitez que le nom natif soit visible.

Le manifeste `ui-languages.json` est un tableau JSON d'entrées <code>{"{ code, label, englishName }"}</code>. Exemple :

```json
[
  { "code": "en-GB", "label": "English (UK)", "englishName": "English (UK)" },
  { "code": "pt-BR", "label": "Português (BR)", "englishName": "Portuguese (BR)" },
  { "code": "de",    "label": "Deutsch",        "englishName": "German" },
  { "code": "fr",    "label": "Français",       "englishName": "French" },
  { "code": "ar",    "label": "العربية",         "englishName": "Arabic" }
]
```

Définissez `targetLocales` dans la configuration sur le chemin de ce fichier afin que la commande de traduction utilise la même liste.

### Langues RTL {#rtl-languages}

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

## Flux de travail 2 - Traduction de documents {#workflow-2---document-translation}

Conçu pour la documentation markdown, les sites Docusaurus et les fichiers d'étiquettes JSON. Les diagrammes SVG sont traduits via [`translate-svg`](#cli-reference) et `svg` dans la configuration, pas via `documentations[].contentPaths`.

### Étape 1 : Initialiser {#step-1-initialise-1}

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

Modifiez le fichier généré `ai-i18n-tools.config.json` :

- `sourceLocale` - langue source (doit correspondre à `defaultLocale` dans `docusaurus.config.js`).
- `targetLocales` - tableau de codes de locale ou chemin vers un manifeste.
- `cacheDir` - répertoire de cache SQLite partagé pour tous les pipelines de documentation (et répertoire de log par défaut pour `--write-logs`).
- `documentations` - tableau de blocs de documentation. Chaque bloc a une `description` optionnelle, `contentPaths`, `outputDir`, `jsonSource` optionnel, `markdownOutput`, `targetLocales`, `injectTranslationMetadata`, etc.
- `documentations[].description` - note courte optionnelle pour les mainteneurs (ce que couvre ce bloc). Lorsqu'elle est définie, elle apparaît dans le titre `translate-docs` (`🌐 …: traduction de …`) et dans les en-têtes de section `status`.
- `documentations[].contentPaths` - répertoires ou fichiers source markdown/MDX (voir aussi `documentations[].jsonSource` pour les étiquettes JSON).
- `documentations[].outputDir` - racine de sortie traduite pour ce bloc.
- `documentations[].markdownOutput.style` - `"nested"` (par défaut), `"docusaurus"`, ou `"flat"` (voir [Mises en page de sortie](#output-layouts)).

### Étape 2 : Traduire des documents {#step-2-translate-documents}

```bash
npx ai-i18n-tools translate-docs
```

Cela traduit tous les fichiers dans chaque bloc `documentations` de `contentPaths` vers toutes les locales de documentation effectives (union de chaque bloc de `targetLocales` lorsqu'il est défini, sinon les `targetLocales` racine). Les segments déjà traduits sont servis depuis le cache SQLite - seuls les segments nouveaux ou modifiés sont envoyés au LLM.

Pour traduire une seule locale :

```bash
npx ai-i18n-tools translate-docs --locale de
```

Pour vérifier ce qui doit être traduit :

```bash
npx ai-i18n-tools status
```

#### Comportement du cache et drapeaux `translate-docs` {#cache-behaviour-and-translate-docs-flags}

L'interface en ligne de commande conserve le **suivi des fichiers** dans SQLite (hash source par fichier × locale) et les lignes de **segment** (hash × locale par morceau traduisible). Un fonctionnement normal ignore complètement un fichier lorsque le hash suivi correspond à la source actuelle **et** que le fichier de sortie existe déjà ; sinon, il traite le fichier et utilise le cache de segments afin que le texte inchangé ne fasse pas appel à l'API.

| Drapeau                  | Effet                                                                                                                                                                                                  |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| *(par défaut)*              | Ignorer les fichiers inchangés lors du suivi + correspondance de sortie sur disque ; utiliser le cache de segments pour le reste.                                                                 |
| `--force-update`         | Re-traiter chaque fichier correspondant (extraire, réassembler, écrire les sorties) même lorsque le suivi de fichiers serait ignoré. **Le cache de segments s'applique toujours** - les segments inchangés ne sont pas envoyés au LLM.                   |
| `--force`                | Efface le suivi de fichiers pour chaque fichier traité et **ne lit pas** le cache de segments pour la traduction API (re-traduction complète). Les nouveaux résultats sont toujours **écrits** dans le cache de segments.                 |
| `--stats`                | Imprime les comptes de segments, les comptes de fichiers suivis et les totaux de segments par locale, puis quitte.                                                                                  |
| `--clear-cache [locale]` | Supprime les traductions mises en cache (et le suivi de fichiers) : toutes les locales, ou une seule locale, puis quitte.                                                                            |
| `--prompt-format <mode>` | Comment chaque **lot** de segments est envoyé au modèle et analysé (`xml`, `json-array`, ou `json-object`). Par défaut **`xml`**. Ne change pas le comportement d'extraction, de placeholders, de validation, de cache, ou de fallback — voir [Format de prompt par lot](#batch-prompt-format). |

Vous ne pouvez pas combiner `--force` avec `--force-update` (ils sont mutuellement exclusifs).

#### Format de prompt par lot {#batch-prompt-format}

`translate-docs` envoie des segments traduisibles à OpenRouter en **lots** (groupés par `batchSize` / `maxBatchChars`). Le **`--prompt-format`** ne change que le **format de transmission** de ce lot ; la division des segments, les jetons `PlaceholderHandler`, les vérifications de l'AST markdown, les clés de cache SQLite et le fallback par segment lorsque l'analyse du lot échoue restent inchangés.

| Mode | Message utilisateur | Réponse du modèle |
| ---- | ------------ | ----------- |
| **`xml`** (par défaut) | Pseudo-XML : un `<seg id="N">…</seg>` par segment (avec échappement XML). | Seulement des blocs `<t id="N">…</t>`, un par index de segment. |
| **`json-array`** | Un tableau JSON de chaînes, une entrée par segment dans l'ordre. | Un tableau JSON de la **même longueur** (même ordre). |
| **`json-object`** | Un objet JSON `{"0":"…","1":"…",…}` indexé par l'index de segment. | Un objet JSON avec les **mêmes clés** et les valeurs traduites. |

L'en-tête d'exécution imprime également `Batch prompt format: …` afin que vous puissiez confirmer le mode actif. Les fichiers d'étiquettes JSON (`jsonSource`) et les lots SVG autonomes utilisent le même paramètre lorsque ces étapes s'exécutent dans le cadre de `translate-docs` (ou la phase de documents de `sync` — `sync` n'expose pas ce paramètre ; il par défaut à **`xml`**).

**Dédoublonnage des segments et chemins dans SQLite**

- Les lignes de segment sont indexées globalement par `(source_hash, locale)` (hash = contenu normalisé). Un texte identique dans deux fichiers partage une ligne ; `translations.filepath` est des métadonnées (dernier écrivain), pas une seconde entrée de cache par fichier.
- `file_tracking.filepath` utilise des clés de noms de domaine : `doc-block:{index}:{relPath}` par bloc `documentations` (`relPath` est relatif à la racine du projet : chemins markdown tels que collectés ; **les fichiers d'étiquettes JSON utilisent le chemin relatif au cwd vers le fichier source**, par exemple `docs-site/i18n/en/code.json`, afin que le nettoyage puisse résoudre le vrai fichier), et `svg-assets:{relPath}` pour les actifs SVG autonomes sous `translate-svg`.
- `translations.filepath` stocke des chemins posix relatifs au cwd pour les segments markdown, JSON et SVG (SVG utilise la même forme de chemin que les autres actifs ; le préfixe `svg-assets:…` est **uniquement** sur `file_tracking`).
- Après une exécution, `last_hit_at` est effacé uniquement pour les lignes de segment **dans la même portée de traduction** (respectant `--path` et les types activés) qui n'ont pas été touchées, de sorte qu'une exécution filtrée ou uniquement de documents ne marque pas les fichiers non liés comme obsolètes.

### Dispositions de sortie {#output-layouts}

`"nested"` (par défaut lorsqu'il est omis) — reflète l'arborescence source sous `{outputDir}/{locale}/` (par exemple `docs/guide.md` → `i18n/de/docs/guide.md`).

`"docusaurus"` — place les fichiers qui se trouvent sous `docsRoot` à `i18n/<locale>/docusaurus-plugin-content-docs/current/<relativeToDocsRoot>`, correspondant à la disposition i18n habituelle de Docusaurus. Définissez `documentations[].markdownOutput.docsRoot` sur votre racine de source de documents (par exemple `"docs"`).

```
docs/guide.md         → i18n/de/docusaurus-plugin-content-docs/current/guide.md
i18n/en/sidebar.json  → i18n/de/sidebar.json  (JSON label files)
```

`"flat"` - place les fichiers traduits à côté de la source avec un suffixe de locale, ou dans un sous-répertoire. Les liens relatifs entre les pages sont réécrits automatiquement.

```
docs/guide.md → i18n/guide.de.md
```

Vous pouvez remplacer complètement les chemins avec `documentations[].markdownOutput.pathTemplate`. Espaces réservés : <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{LOCALE}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{basename}"}</code>, <code>{"{extension}"}</code>, <code>{"{docsRoot}"}</code>, <code>{"{relativeToDocsRoot}"}</code>.

---

## Flux de travail combiné (UI + Docs) {#combined-workflow-ui--docs}

Activez toutes les fonctionnalités dans une seule configuration pour exécuter les deux flux de travail ensemble :

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": "src/locales/ui-languages.json",
  "features": {
    "extractUIStrings": true,
    "translateUIStrings": true,
    "translateMarkdown": true,
    "translateJSON": false
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

Exécutez `npx ai-i18n-tools sync` pour exécuter un pipeline : **extraire** les chaînes UI (si `features.extractUIStrings`), **traduire les chaînes UI** (si `features.translateUIStrings`), **traduire les actifs SVG autonomes** (si un bloc `svg` est présent dans la configuration), puis **traduire la documentation** (chaque bloc `documentations` : markdown/JSON comme configuré). Ignorez les parties avec `--no-ui`, `--no-svg`, ou `--no-docs`. L'étape de documentation accepte `--dry-run`, `-p` / `--path`, `--force`, et `--force-update` (les deux derniers ne s'appliquent que lorsque la traduction de la documentation est exécutée ; ils sont ignorés si vous passez `--no-docs`).

Utilisez `documentations[].targetLocales` sur un bloc pour traduire les fichiers de ce bloc dans un **sous-ensemble plus petit** que l'UI (les locales de documentation effectives sont l'**union** à travers les blocs) :

```json
{
  "targetLocales": "src/locales/ui-languages.json",
  "documentations": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "targetLocales": ["de", "fr", "es"]
    }
  ]
}
```

---

## Référence de configuration {#configuration-reference}

### `sourceLocale` {#sourcelocale}

Code BCP-47 pour la langue source (par exemple, `"en-GB"`, `"en"`, `"pt-BR"`). Aucun fichier de traduction n'est généré pour cette locale - la chaîne clé elle-même est le texte source.

**Doit correspondre** à `SOURCE_LOCALE` exporté de votre fichier de configuration i18n d'exécution (`src/i18n.ts` / `src/i18n.js`).

### `targetLocales` {#targetlocales}

Quelles locales traduire. Accepte :

- **Chemin de chaîne** vers un manifeste `ui-languages.json` (`"src/locales/ui-languages.json"`). Le fichier est chargé et les codes de locale sont extraits.
- **Tableau de codes BCP-47** (`["de", "fr", "es"]`).
- **Tableau à un élément avec un chemin** (`["src/locales/ui-languages.json"]`) - même comportement que la forme de chaîne.

`targetLocales` est la liste de locales principale pour la traduction de l'UI et la liste de locales par défaut pour les blocs de documentation. Si vous préférez garder un tableau explicite ici mais souhaitez toujours des étiquettes et un filtrage de locale basés sur le manifeste, définissez également `uiLanguagesPath`.

### `uiLanguagesPath` (optionnel) {#uilanguagespath-optional}

Chemin vers un manifeste `ui-languages.json` utilisé pour les noms d'affichage, le filtrage de locale et le post-traitement de la liste des langues.

Utilisez ceci lorsque :

- `targetLocales` est un tableau explicite, mais vous souhaitez toujours des étiquettes en anglais/natives du manifeste.
- Vous souhaitez que `markdownOutput.postProcessing.languageListBlock` construise des étiquettes de locale à partir du même manifeste.
- Seule la traduction de l'UI est activée et vous souhaitez que le manifeste fournisse la liste effective des locales de l'UI.

### `concurrency` (optionnel) {#concurrency-optional}

Maximum **locales cibles** traduites en même temps (`translate-ui`, `translate-docs`, `translate-svg`, et les étapes correspondantes à l'intérieur de `sync`). Si omis, la CLI utilise **4** pour la traduction de l'interface utilisateur et **3** pour la traduction de la documentation (valeurs par défaut intégrées). Remplacez par exécution avec `-j` / `--concurrency`.

### `batchConcurrency` (optionnel) {#batchconcurrency-optional}

**translate-docs** et **translate-svg** (et l'étape de documentation de `sync`) : maximum de requêtes **batch** OpenRouter parallèles par fichier (chaque batch peut contenir de nombreux segments). Par défaut **4** lorsqu'omis. Ignoré par `translate-ui`. Remplacez avec `-b` / `--batch-concurrency`. Sur `sync`, `-b` s'applique uniquement à l'étape de traduction de la documentation.

### `batchSize` / `maxBatchChars` (optionnel) {#batchsize--maxbatchchars-optional}

Regroupement de segments pour la traduction de documents : combien de segments par requête API, et un plafond de caractères. Valeurs par défaut : **20** segments, **4096** caractères (lorsqu'omis).

### `openrouter` {#openrouter}

| Champ               | Description                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------- |
| `baseUrl`           | URL de base de l'API OpenRouter. Par défaut : `https://openrouter.ai/api/v1`.                        |
| `translationModels` | Liste ordonnée préférée des ID de modèles. Le premier est essayé en premier ; les entrées suivantes sont des fallback en cas d'erreur. Pour `translate-ui` uniquement**, vous pouvez également définir `ui.preferredModel` pour essayer un modèle avant cette liste (voir `ui`). |
| `defaultModel`      | Modèle principal unique hérité. Utilisé uniquement lorsque `translationModels` est non défini ou vide.       |
| `fallbackModel`     | Modèle de secours unique hérité. Utilisé après `defaultModel` lorsque `translationModels` est non défini ou vide. |
| `maxTokens`         | Nombre maximum de tokens de complétion par demande. Par défaut : `8192`.                                      |
| `temperature`       | Température d'échantillonnage. Par défaut : `0.2`.                                                    |

Définissez `OPENROUTER_API_KEY` dans votre environnement ou fichier `.env`.

### `features` {#features}

| Champ                | Flux de travail | Description                                                       |
| -------------------- | ---------------- | ----------------------------------------------------------------- |
| `extractUIStrings`   | 1                | Scanner la source pour `t("…")` et écrire/fusionner `strings.json`.          |
| `translateUIStrings` | 1                | Traduire les entrées de `strings.json` et écrire des fichiers JSON par locale. |
| `translateMarkdown`  | 2                | Traduire les fichiers `.md` / `.mdx`.                                   |
| `translateJSON`      | 2                | Traduire les fichiers d'étiquettes JSON de Docusaurus.                            |

Il n'y a pas de drapeau `features.translateSVG`. Traduisez les actifs SVG **autonomes** avec `translate-svg` et un bloc `svg` de niveau supérieur dans la configuration. La commande `sync` exécute cette étape lorsque `svg` est présent (à moins que `--no-svg`).

### `ui` {#ui}

| Champ                       | Description                                                             |
| --------------------------- | ----------------------------------------------------------------------- |
| `sourceRoots`               | Répertoires (relatifs au cwd) scannés pour les appels `t("…")`.               |
| `stringsJson`               | Chemin vers le fichier de catalogue principal. Mis à jour par `extract`.                  |
| `flatOutputDir`             | Répertoire où les fichiers JSON par locale sont écrits (`de.json`, etc.).    |
| `preferredModel`            | Optionnel. Identifiant du modèle OpenRouter essayé en premier pour `translate-ui` uniquement ; puis `openrouter.translationModels` (ou modèles hérités) dans l'ordre, sans dupliquer cet identifiant. |
| `reactExtractor.funcNames`  | Noms de fonctions supplémentaires à scanner (par défaut : `["t", "i18n.t"]`).         |
| `reactExtractor.extensions` | Extensions de fichiers à inclure (par défaut : `[".js", ".jsx", ".ts", ".tsx"]`). |
| `reactExtractor.includePackageDescription` | Lorsque `true` (par défaut), `extract` inclut également `package.json` `description` comme chaîne UI lorsqu'elle est présente. |
| `reactExtractor.packageJsonPath` | Chemin personnalisé vers le fichier `package.json` utilisé pour cette extraction de description optionnelle. |

### `cacheDir` {#cachedir}

| Champ      | Description                                                                 |
| ---------- | ----------------------------------------------------------------------------- |
| `cacheDir` | Répertoire de cache SQLite (partagé par tous les blocs `documentations`). Réutilisable entre les exécutions. |

### `documentations` {#documentations}

Tableau de blocs de pipeline de documentation. `translate-docs` et la phase de docs du processus `sync` traitent **chaque** bloc dans l'ordre.

| Champ                                       | Description                                                                                                                                                                                                               |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `description`                                | Note facultative lisible par l'homme pour ce bloc (non utilisée pour la traduction). Préfixée dans le `translate-docs` `🌐` en-tête lorsqu'elle est définie ; également affichée dans les en-têtes de section `status`.                                                     |
| `contentPaths`                               | Sources Markdown/MDX à traduire (`translate-docs` les scanne pour `.md` / `.mdx`). Les étiquettes JSON proviennent de `jsonSource` sur le même bloc.                                                                                  |
| `outputDir`                                  | Répertoire racine pour la sortie traduite de ce bloc.                                                                                                                                                                      |
| `sourceFiles`                                | Alias facultatif fusionné dans `contentPaths` lors du chargement.                                                                                                                                                                        |
| `targetLocales`                              | Sous-ensemble facultatif de locales uniquement pour ce bloc (sinon locales cibles racines `targetLocales`). Les locales de documentation effectives sont l'union à travers les blocs.                                                                             |
| `jsonSource`                                 | Répertoire source pour les fichiers d'étiquettes JSON Docusaurus pour ce bloc (par exemple `"i18n/en"`).                                                                                                                                       |
| `markdownOutput.style`                       | `"nested"` (par défaut), `"docusaurus"`, ou `"flat"`.                                                                                                                                                                        |
| `markdownOutput.docsRoot`                    | Racine des docs source pour la mise en page Docusaurus (par exemple `"docs"`).                                                                                                                                                                   |
| `markdownOutput.pathTemplate`                | Chemin de sortie markdown personnalisé. Espaces réservés : <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{LOCALE}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{basename}"}</code>, <code>{"{extension}"}</code>, <code>{"{docsRoot}"}</code>, <code>{"{relativeToDocsRoot}"}</code>. |
| `markdownOutput.jsonPathTemplate`            | Chemin de sortie JSON personnalisé pour les fichiers d'étiquettes. Prend en charge les mêmes espaces réservés que `pathTemplate`.                                                                                                                                |
| `markdownOutput.flatPreserveRelativeDir`     | Pour le style `flat`, conserver les sous-répertoires source afin que les fichiers avec le même nom de base ne se chevauchent pas.                                                                                                                              |
| `markdownOutput.rewriteRelativeLinks` | Réécrire les liens relatifs après traduction (activé automatiquement pour le style `flat`).                                                                                                                                                 |
| `markdownOutput.linkRewriteDocsRoot` | Racine du dépôt utilisée lors du calcul des préfixes de réécriture de lien plat. Généralement, laissez ceci comme `"."` à moins que vos docs traduits ne se trouvent sous une racine de projet différente. |
| `markdownOutput.postProcessing` | Transformations facultatives sur le **corps** markdown traduit (les métadonnées YAML sont préservées). S'exécute après le réassemblage des segments et la réécriture des liens plats, et avant `injectTranslationMetadata`. |
| `markdownOutput.postProcessing.regexAdjustments` | Liste ordonnée de `{ "description"?, "search", "replace" }`. `search` est un motif regex (la chaîne simple utilise le drapeau `g`, ou `/pattern/flags`). `replace` prend en charge les espaces réservés tels que `${translatedLocale}`, `${sourceLocale}`, `${sourceFullPath}`, `${translatedFullPath}`, `${sourceFilename}`, `${translatedFilename}`, `${sourceBasedir}`, `${translatedBasedir}` (même idée que les `additional-adjustments` de référence). |
| `markdownOutput.postProcessing.languageListBlock` | `{ "start", "end", "separator" }` — le traducteur trouve la première ligne contenant `start` et la ligne `end` correspondante, puis remplace cette tranche par un sélecteur de langue canonique. Les liens sont construits avec des chemins relatifs au fichier traduit ; les étiquettes proviennent de `uiLanguagesPath` / `ui-languages.json` lorsqu'elles sont configurées, sinon des `localeDisplayNames` et des codes de locale. |
| `injectTranslationMetadata`                  | Lorsque `true` (valeur par défaut lorsqu'oubliée), les fichiers markdown traduits incluent les clés YAML : `translation_last_updated`, `source_file_mtime`, `source_file_hash`, `translation_language`, `source_file_path`. Réglez sur `false` pour ignorer. |

Exemple (pipeline README plat — chemins de capture d'écran + wrapper de liste de langues optionnel) :

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

### `svg` (optionnel) {#svg-optional}

Configuration de niveau supérieur pour les actifs SVG autonomes traduits par `translate-svg` et l'étape SVG de `sync`.

| Champ                       | Description |
| --------------------------- | ----------- |
| `sourcePath`                | Un répertoire ou un tableau de répertoires analysés récursivement pour les fichiers `.svg`. |
| `outputDir`                 | Répertoire racine pour la sortie SVG traduite. |
| `style`                     | `"plat"` ou `"nested"` lorsque `pathTemplate` n'est pas défini. |
| `pathTemplate`              | Chemin de sortie SVG personnalisé. Espaces réservés : <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{LOCALE}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{basename}"}</code>, <code>{"{extension}"}</code>, <code>{"{relativeToSourceRoot}"}</code>. |
| `svgExtractor.forceLowercase` | Texte traduit en minuscules lors de la réassemblage SVG. Utile pour les designs qui reposent sur des étiquettes entièrement en minuscules. |

### `glossaire` {#glossary}

| Champ          | Description                                                                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `uiGlossary`   | Chemin vers `strings.json` - construit automatiquement un glossaire à partir des traductions existantes.                                                                                                                 |
| `userGlossary` | Chemin vers un CSV avec les colonnes `Chaîne en langue originale` (ou `en`), `locale`, `Traduction` - une ligne par terme source et locale cible (`locale` peut être `*` pour toutes les cibles). |

La clé héritée `uiGlossaryFromStringsJson` est toujours acceptée et mappée à `uiGlossary` lors du chargement de la configuration.

Générer un CSV de glossaire vide :

```bash
npx ai-i18n-tools glossary-generate
```

---

## Référence CLI {#cli-reference}

| Command                                                                   | Description                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `init [-t ui-markdown|ui-docusaurus] [-o path] [--with-translate-ignore]` | Écrire un fichier de configuration de démarrage (inclut `concurrency`, `batchConcurrency`, `batchSize`, `maxBatchChars`, et `documentations[].injectTranslationMetadata`). `--with-translate-ignore` crée un fichier `.translate-ignore` de démarrage.                                                                            |
| `extract`                                                                 | Scanner la source pour les appels `t("…")` et mettre à jour `strings.json`. Nécessite `features.extractUIStrings`.                                                                                                                                                                                                    |
| `translate-docs …`                                                        | Traduire markdown/MDX et JSON pour chaque bloc `documentations` (`contentPaths`, `jsonSource` optionnel). `-j`: max locales parallèles; `-b`: max appels API par lot parallèles par fichier. `--prompt-format`: format de lot (`xml` \| `json-array` \| `json-object`). Voir [Comportement du cache et drapeaux `translate-docs`](#cache-behaviour-and-translate-docs-flags) et [Format de prompt par lot](#batch-prompt-format). |
| `translate-svg …`                                                         | Traduire les actifs SVG autonomes configurés dans `config.svg` (séparés des docs). Idées de cache similaires à celles des docs; prend en charge `--no-cache` pour ignorer les lectures/écritures SQLite pour cette exécution. `-j`, `-b`, `--force`, `--force-update`, `-p` / `--path`, `--dry-run`.                                                    |
| `translate-ui [--locale <code>] [--force] [--dry-run] [-j <n>]`           | Traduire uniquement les chaînes de l'interface utilisateur. `--force`: retraduire toutes les entrées par locale (ignorer les traductions existantes). `--dry-run`: pas d'écritures, pas d'appels API. `-j`: max locales parallèles. Nécessite `features.translateUIStrings`.                                                                                 |
| `sync …`                                                                  | Extraire (si activé), puis traduction de l'interface utilisateur, puis `translate-svg` lorsque `config.svg` existe, puis traduction de la documentation - sauf si ignoré avec `--no-ui`, `--no-svg`, ou `--no-docs`. Drapeaux partagés : `-l`, `-p`, `--dry-run`, `-j`, `-b` (battage de docs uniquement), `--force` / `--force-update` (uniquement pour les docs ; mutuellement exclusifs lors de l'exécution des docs).                         |
| `status`                                                                  | Afficher l'état de traduction markdown par fichier × locale (pas de filtre `--locale` ; les locales proviennent de la configuration).                                                                                                                                                                                               |
| `cleanup [--dry-run] [--no-backup] [--backup <path>]`                  | Exécute d'abord `sync --force-update` (extraction, UI, SVG, docs), puis supprime les lignes de segments obsolètes (null `last_hit_at` / chemin de fichier vide) ; supprime les lignes de `file_tracking` dont le chemin source résolu est manquant sur le disque ; supprime les lignes de traduction dont les métadonnées `filepath` pointent vers un fichier manquant. Journalise trois comptes (obsolètes, orphelins `file_tracking`, traductions orphelines). Crée une sauvegarde SQLite horodatée sous le répertoire de cache, sauf si `--no-backup`. |
| `editor [-p <port>] [--no-open]`                                          | Lance un éditeur web local pour le cache, `strings.json`, et le CSV du glossaire. `--no-open`: ne pas ouvrir automatiquement le navigateur par défaut.<br><br>**Remarque :** Si vous modifiez une entrée dans l'éditeur de cache, vous devez exécuter un `sync --force-update` pour réécrire les fichiers de sortie avec l'entrée de cache mise à jour. De plus, si le texte source change plus tard, la modification manuelle sera perdue car une nouvelle clé de cache est générée. |
| `glossary-generate [-o <path>]`                                           | Écrire un modèle vide `glossary-user.csv`. `-o`: remplacer le chemin de sortie (par défaut : `glossary.userGlossary` de la configuration, ou `glossary-user.csv`).                                                                                                                                                |

Toutes les commandes acceptent `-c <path>` pour spécifier un fichier de configuration non par défaut, `-v` pour une sortie verbeuse, et `-w` / `--write-logs [path]` pour rediriger la sortie de la console vers un fichier journal (chemin par défaut : sous `cacheDir` racine).

---

## Variables d'environnement {#environment-variables}

| Variable               | Description                                                |
| ---------------------- | ---------------------------------------------------------- |
| `OPENROUTER_API_KEY`   | **Requis.** Votre clé API OpenRouter.                      |
| `OPENROUTER_BASE_URL`  | Remplacer l'URL de base de l'API.                         |
| `I18N_SOURCE_LOCALE`   | Remplacer `sourceLocale` à l'exécution.                   |
| `I18N_TARGET_LOCALES`  | Codes de locale séparés par des virgules pour remplacer `targetLocales`. |
| `I18N_LOG_LEVEL`       | Niveau du journal (`debug`, `info`, `warn`, `error`, `silent`). |
| `NO_COLOR`             | Lorsque `1`, désactiver les couleurs ANSI dans la sortie du journal. |
| `I18N_LOG_SESSION_MAX` | Nombre maximum de lignes conservées par session de journal (par défaut `5000`). |
