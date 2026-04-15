# ai-i18n-tools : Prise en main

`ai-i18n-tools` fournit deux flux de travail indépendants et composables :

- **Flux de travail 1 - Traduction de l'UI** : extraire les appels `t("…")` de toute source JS/TS, les traduire via OpenRouter, et écrire des fichiers JSON plats par locale prêts pour i18next.  
- **Flux de travail 2 - Traduction de documents** : traduire des fichiers markdown (MDX) et des fichiers de labels JSON Docusaurus vers n'importe quel nombre de locales, avec un cache intelligent. Les actifs **SVG** utilisent `features.translateSVG`, le bloc `svg` de niveau supérieur, et `translate-svg` (voir [référence CLI](#cli-reference)).

Les deux flux de travail utilisent OpenRouter (tout LLM compatible) et partagent un seul fichier de configuration.

<small>**Lire dans d'autres langues :** </small>

<small id="lang-list">[English (GB)](../../docs/GETTING_STARTED.md) · [German](./GETTING_STARTED.de.md) · [Spanish](./GETTING_STARTED.es.md) · [French](./GETTING_STARTED.fr.md) · [Hindi](./GETTING_STARTED.hi.md) · [Japanese](./GETTING_STARTED.ja.md) · [Korean](./GETTING_STARTED.ko.md) · [Portuguese (BR)](./GETTING_STARTED.pt-BR.md) · [Chinese (CN)](./GETTING_STARTED.zh-CN.md) · [Chinese (TW)](./GETTING_STARTED.zh-TW.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table des matières**

- [Installation](#installation)
- [Démarrage rapide](#quick-start)
- [Flux de travail 1 - Traduction de l'interface utilisateur](#workflow-1---ui-translation)
  - [Étape 1 : Initialiser](#step-1-initialise)
  - [Étape 2 : Extraire les chaînes](#step-2-extract-strings)
  - [Étape 3 : Traduire les chaînes d'interface](#step-3-translate-ui-strings)
  - [Exporter vers XLIFF 2.0 (facultatif)](#exporting-to-xliff-20-optional)
  - [Étape 4 : Connecter i18next au moment de l'exécution](#step-4-wire-i18next-at-runtime)
  - [Utilisation de `t()` dans le code source](#using-t-in-source-code)
  - [Interpolation](#interpolation)
  - [Interface de commutateur de langue](#language-switcher-ui)
  - [Langues RTL](#rtl-languages)
- [Flux de travail 2 - Traduction de documents](#workflow-2---document-translation)
  - [Étape 1 : Initialiser](#step-1-initialise-1)
  - [Étape 2 : Traduire les documents](#step-2-translate-documents)
    - [Comportement du cache et indicateurs `translate-docs`](#cache-behaviour-and-translate-docs-flags)
  - [Dispositions de sortie](#output-layouts)
- [Flux de travail combiné (UI + Docs)](#combined-workflow-ui--docs)
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

Le package publié est **uniquement ESM**. Utilisez `import`/`import()` dans Node.js ou votre bundler ; **ne pas utiliser `require('ai-i18n-tools')`.**

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

`SOURCE_LOCALE` est exporté afin que tout autre fichier qui en a besoin (par exemple un sélecteur de langue) puisse l'importer directement depuis `'./i18n'`. Si vous migrez une configuration i18next existante, remplacez toutes les chaînes de localisation source en dur (par exemple des vérifications `'en-GB'` dispersées dans les composants) par des importations de `SOURCE_LOCALE` depuis votre fichier d'initialisation i18n.

`defaultI18nInitOptions(sourceLocale)` renvoie les options standard pour les configurations où la clé sert de valeur par défaut :

- `parseMissingKeyHandler` retourne la clé elle-même, de sorte que les chaînes non traduites affichent le texte source.
- `nsSeparator: false` permet des clés contenant des deux-points.
- `interpolation.escapeValue: false` - sûr à désactiver : React échappe les valeurs lui-même, et la sortie Node.js/CLI n'a pas de HTML à échapper.

`wrapI18nWithKeyTrim(i18n)` enveloppe `i18n.t` de sorte que : (1) les clés soient tronquées avant la recherche, ce qui correspond à la manière dont le script d'extraction les stocke ; (2) l'interpolation <code>{"{{var}}"}</code> soit appliquée lorsque la locale source renvoie la clé brute - ainsi <code>{"t('Hello {{name}}', { name })"}</code> fonctionne correctement même pour la langue source.

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
- La clé doit être une **chaîne littérale** - pas de variables ou d'expressions comme clé.
- N'utilisez pas de littéraux de modèle pour la clé : <code>{'t(`Hello ${name}`)'}</code> n'est pas extractible.

### Interpolation

Utilisez l'interpolation native du deuxième argument d'i18next pour les espaces réservés <code>{"{{var}}"}</code> :

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

Le script d'extraction ignore le deuxième argument - seule la chaîne clé littérale <code>{"\"Hello {{name}}, vous avez {{count}} messages\""}</code> est extraite et envoyée pour traduction. Les traducteurs sont instruits de préserver les jetons <code>{"{{...}}"}</code>.

Si votre projet utilise un utilitaire d'interpolation personnalisé (par exemple appeler `t('key')` puis transmettre le résultat à une fonction de modèle comme `interpolateTemplate(t('Hello {{name}}'), { name })`), `wrapI18nWithKeyTrim` rend cela inutile — il applique l'interpolation <code>{"{{var}}"}</code> même lorsque la langue source renvoie la clé brute. Migrez les appels vers `t('Hello {{name}}', { name })` et supprimez l'utilitaire personnalisé.

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

Le manifeste est généré par `generate-ui-languages` à partir de `sourceLocale` + `targetLocales` et du catalogue maître intégré. Il est écrit dans `ui.flatOutputDir`.

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

### Étape 1 : Initialiser

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

Modifiez le fichier généré `ai-i18n-tools.config.json` :

- `sourceLocale` - langue source (doit correspondre à `defaultLocale` dans `docusaurus.config.js`).
- `targetLocales` - tableau de codes de locale BCP-47 (par exemple `["de", "fr", "es"]`).
- `cacheDir` - répertoire de cache SQLite partagé pour tous les pipelines de documentation (et répertoire de journal par défaut pour `--write-logs`).
- `documentations` - tableau de blocs de documentation. Chaque bloc possède des champs facultatifs `description`, `contentPaths`, `outputDir`, `jsonSource` facultatif, `markdownOutput`, `targetLocales`, `addFrontmatter`, etc.
- `documentations[].description` - note courte facultative pour les mainteneurs (ce que couvre ce bloc). Lorsqu'elle est définie, elle apparaît dans le titre `translate-docs` (`🌐 …: translating …`) et dans les en-têtes de section `status`.
- `documentations[].contentPaths` - répertoires ou fichiers sources en markdown/MDX (voir aussi `documentations[].jsonSource` pour les libellés JSON).
- `documentations[].outputDir` - répertoire de sortie traduit pour ce bloc.
- `documentations[].markdownOutput.style` - `"nested"` (par défaut), `"docusaurus"` ou `"flat"` (voir [Dispositions de sortie](#output-layouts)).

### Étape 2 : Traduire des documents

```bash
npx ai-i18n-tools translate-docs
```

Cela traduit tous les fichiers dans chaque bloc `documentations` dans les `contentPaths` vers toutes les locales de documentation effectives (union de chaque bloc `targetLocales` lorsqu'il est défini, sinon les `targetLocales` racine). Les segments déjà traduits sont servis depuis le cache SQLite - seuls les segments nouveaux ou modifiés sont envoyés au LLM.

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

| Drapeau                  | Effet                                                                                                                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| *(par défaut)*            | Ignorer les fichiers inchangés lorsque le suivi et la sortie sur disque correspondent ; utiliser le cache de segments pour le reste.                                                                                                             |
| `-l, --locale <codes>`   | Locales cibles séparées par des virgules (les valeurs par défaut suivent `documentation.targetLocales` / `targetLocales` lorsqu'omises).                                                                                           |
| `-p, --path` / `-f, --file` | Traduire uniquement le markdown/JSON situé sous ce chemin (relatif au projet ou absolu) ; `--file` est un alias pour `--path`.                                                                                     |
| `--dry-run`              | Aucune écriture de fichier ni appel API.                                                                                                                                                                       |
| `--type <kind>`          | Restreindre à `markdown` ou `json` (sinon les deux lorsque activé dans la configuration).                                                                                                                              |
| `--json-only` / `--no-json` | Traduire uniquement les fichiers JSON de libellés, ou ignorer JSON et traduire uniquement le markdown.                                                                                                                         |
| `-j, --concurrency <n>`  | Nombre maximal de locales cibles en parallèle (valeur par défaut issue de la configuration ou valeur intégrée par défaut du CLI).                                                                                                                             |
| `-b, --batch-concurrency <n>` | Nombre maximal d'appels API par lot par fichier (docs ; valeur par défaut issue de la configuration ou du CLI).                                                                                                                          |
| `--emphasis-placeholders` | Masquer les marqueurs d'accentuation markdown comme des espaces réservés avant traduction (optionnel ; désactivé par défaut).                                                                                                         |
| `--debug-failed`         | Écrire des journaux détaillés `FAILED-TRANSLATION` sous `cacheDir` en cas d'échec de validation.                                                                                                                       |
| `--force-update`         | Reprocesser chaque fichier correspondant (extraction, réassemblage, écriture des sorties) même si le suivi de fichiers aurait dû l'ignorer. **Le cache de segments s'applique toujours** - les segments inchangés ne sont pas envoyés au LLM.                   |
| `--force`                | Efface le suivi des fichiers pour chaque fichier traité et **ne lit pas** le cache de segments pour la traduction API (re-traduction complète). Les nouveaux résultats sont néanmoins **écrits** dans le cache de segments.                 |
| `--stats`                | Afficher les nombres de segments, les nombres de fichiers suivis et les totaux de segments par locale, puis quitter.                                                                                                                   |
| `--clear-cache [locale]` | Supprimer les traductions mises en cache (et le suivi des fichiers) : toutes les locales, ou une seule locale, puis quitter.                                                                                                            |
| `--prompt-format <mode>` | Détermine comment chaque **lot** de segments est envoyé au modèle et analysé (`xml`, `json-array`, ou `json-object`). Par défaut **`json-array`**. Ne modifie pas l'extraction, les espaces réservés, la validation, le cache ou le comportement de secours — voir [Format du prompt par lot](#batch-prompt-format). |

Vous ne pouvez pas combiner `--force` avec `--force-update` (ils sont mutuellement exclusifs).

#### Format du prompt par lot

`translate-docs` envoie les segments traduisibles à OpenRouter par **lots** (groupés par `batchSize` / `maxBatchChars`). Le drapeau **`--prompt-format`** modifie uniquement le **format de transmission** de ce lot ; la segmentation, les jetons `PlaceholderHandler`, les vérifications AST Markdown, les clés de cache SQLite et le secours par segment en cas d'échec d'analyse du lot restent inchangés.

| Mode | Message utilisateur | Réponse du modèle |
| ---- | ------------ | ----------- |
| **`xml`** | Pseudo-XML : un `<seg id="N">…</seg>` par segment (avec échappement XML). | Seulement les blocs `<t id="N">…</t>`, un par index de segment. |
| **`json-array`** (par défaut) | Un tableau JSON de chaînes, une entrée par segment dans l'ordre. | Un tableau JSON de la **même longueur** (même ordre). |
| **`json-object`** | Un objet JSON `{"0":"…","1":"…",…}` indexé par l'index du segment. | Un objet JSON avec les **mêmes clés** et des valeurs traduites. |

L'en-tête d'exécution affiche également `Batch prompt format: …` afin que vous puissiez confirmer le mode actif. Les fichiers d'étiquettes JSON (`jsonSource`) et les lots SVG autonomes utilisent le même paramètre lorsque ces étapes s'exécutent dans le cadre de `translate-docs` (ou de la phase de documentation de `sync` — `sync` n'expose pas ce drapeau ; il utilise par défaut **`json-array`**).

**Dédoublonnage des segments et chemins dans SQLite**

- Les lignes de segment sont indexées globalement par `(source_hash, locale)` (hash = contenu normalisé). Un texte identique dans deux fichiers partage une même ligne ; `translations.filepath` est une métadonnée (dernier rédacteur), pas une entrée de cache supplémentaire par fichier.
- `file_tracking.filepath` utilise des clés avec espace de noms : `doc-block:{index}:{relPath}` par bloc `documentations` (`relPath` est un chemin posix relatif à la racine du projet : les chemins markdown tels que collectés ; **les fichiers d'étiquettes JSON utilisent le chemin relatif au répertoire courant du fichier source**, par exemple `docs-site/i18n/en/code.json`, afin que le nettoyage puisse résoudre le fichier réel), et `svg-assets:{relPath}` pour les ressources SVG autonomes situées sous `translate-svg`.
- `translations.filepath` stocke les chemins posix relatifs au répertoire courant pour les segments markdown, JSON et SVG (SVG utilise la même forme de chemin que les autres ressources ; le préfixe `svg-assets:…` est **uniquement** présent dans `file_tracking`).
- Après une exécution, `last_hit_at` est effacé uniquement pour les lignes de segment **dans la même portée de traduction** (respectant `--path` et les types activés) qui n'ont pas été touchées, ainsi une exécution filtrée ou uniquement docs ne marque pas comme obsolètes les fichiers non concernés.

### Dispositions de sortie

`"nested"` (par défaut lorsqu'omis) — reflète l'arborescence source sous `{outputDir}/{locale}/` (par exemple `docs/guide.md` → `i18n/de/docs/guide.md`).

`"docusaurus"` — place les fichiers situés sous `docsRoot` dans `i18n/<locale>/docusaurus-plugin-content-docs/current/<relativeToDocsRoot>`, conformément à la structure i18n Docusaurus habituelle. Définissez `documentations[].markdownOutput.docsRoot` sur la racine source de votre documentation (par exemple `"docs"`).

```
docs/guide.md         → i18n/de/docusaurus-plugin-content-docs/current/guide.md
i18n/en/sidebar.json  → i18n/de/sidebar.json  (JSON label files)
```

`"flat"` - place les fichiers traduits à côté du fichier source avec un suffixe de langue, ou dans un sous-répertoire. Les liens relatifs entre pages sont réécrits automatiquement.

```
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

---

## Référence de configuration

### `sourceLocale`

Code BCP-47 pour la langue source (par exemple `"en-GB"`, `"en"`, `"pt-BR"`). Aucun fichier de traduction n'est généré pour cette locale - la chaîne clé elle-même est le texte source.

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

| Champ               | Description                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------- |
| `baseUrl`           | URL de base de l'API OpenRouter. Par défaut : `https://openrouter.ai/api/v1`.                        |
| `translationModels` | Liste ordonnée préférée d'identifiants de modèles. Le premier est essayé en priorité ; les entrées suivantes servent de secours en cas d'erreur. Pour `translate-ui` uniquement**, vous pouvez également définir `ui.preferredModel` pour essayer un modèle avant cette liste (voir `ui`). |
| `defaultModel`      | Modèle principal unique hérité. Utilisé uniquement lorsque `translationModels` n'est pas défini ou vide.       |
| `fallbackModel`     | Modèle de secours unique hérité. Utilisé après `defaultModel` lorsque `translationModels` n'est pas défini ou vide. |
| `maxTokens`         | Nombre maximal de jetons de complétion par requête. Par défaut : `8192`.                                      |
| `temperature`       | Température d'échantillonnage. Par défaut : `0.2`.                                                    |

**Pourquoi utiliser plusieurs modèles :** Différents fournisseurs et modèles ont des coûts variables et offrent des niveaux de qualité différents selon les langues et les régions. Configurez **`openrouter.translationModels` comme une chaîne de secours ordonnée** (plutôt qu'un seul modèle), afin que l'interface en ligne de commande puisse essayer le modèle suivant en cas d'échec d'une requête.

Considérez la liste ci-dessous comme une **base** que vous pouvez étendre : si la traduction pour une région spécifique est médiocre ou infructueuse, renseignez-vous sur les modèles qui prennent efficacement en charge cette langue ou ce script (consultez les ressources en ligne ou la documentation de votre fournisseur) et ajoutez ces identifiants OpenRouter comme alternatives supplémentaires.

Cette liste a été **testée pour une couverture étendue des régions** (par exemple, dans le projet Transrewrt traduisant **36** régions cibles) en **avril 2026** ; elle constitue une valeur par défaut pratique, mais ne garantit pas des performances optimales pour chaque région.

Exemple `translationModels` (identique à `npx ai-i18n-tools init` et aux exemples du package) :

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

| Champ                | Workflow | Description                                                       |
| -------------------- | -------- | ----------------------------------------------------------------- |
| `extractUIStrings`   | 1        | Analyser la source pour les `t("…")` / `i18n.t("…")`, fusionner la description facultative `package.json` et (si activé) les valeurs `ui-languages.json` `englishName` dans `strings.json`. |
| `translateUIStrings` | 1        | Traduire les entrées `strings.json` et écrire les fichiers JSON par paramètre régional. |
| `translateMarkdown`  | 2        | Traduire les fichiers `.md` / `.mdx`.                                   |
| `translateJSON`      | 2        | Traduire les fichiers d'étiquettes JSON de Docusaurus.                            |
| `translateSVG`       | 2        | Traduire les ressources autonomes `.svg` (nécessite le bloc de niveau supérieur `svg`). |

Traduisez les actifs **SVG** autonomes avec `translate-svg` lorsque `features.translateSVG` est vrai et qu'un bloc `svg` de niveau supérieur est configuré. La commande `sync` exécute cette étape lorsque les deux sont définis (à moins que `--no-svg`).

### `ui`

| Champ                       | Description                                                             |
| --------------------------- | ----------------------------------------------------------------------- |
| `sourceRoots`               | Répertoires (relatifs au répertoire courant) analysés pour les appels `t("…")`.               |
| `stringsJson`               | Chemin vers le fichier de catalogue principal. Mis à jour par `extract`.                  |
| `flatOutputDir`             | Répertoire où sont écrits les fichiers JSON par paramètre régional (`de.json`, etc.).    |
| `preferredModel`            | Facultatif. Identifiant de modèle OpenRouter essayé en premier pour `translate-ui` uniquement ; puis `openrouter.translationModels` (ou modèles obsolètes) dans l'ordre, sans dupliquer cet identifiant. |
| `reactExtractor.funcNames`  | Noms de fonctions supplémentaires à analyser (par défaut : `["t", "i18n.t"]`).         |
| `reactExtractor.extensions` | Extensions de fichiers à inclure (par défaut : `[".js", ".jsx", ".ts", ".tsx"]`). |
| `reactExtractor.includePackageDescription` | Lorsque `true` (par défaut), `extract` inclut également `package.json` `description` comme chaîne d'interface utilisateur lorsqu'elle est présente. |
| `reactExtractor.packageJsonPath` | Chemin personnalisé vers le fichier `package.json` utilisé pour cette extraction facultative de description. |
| `reactExtractor.includeUiLanguageEnglishNames` | Lorsque `true` (par défaut `false`), `extract` ajoute également chaque `englishName` du manifeste situé à `uiLanguagesPath` à `strings.json` lorsqu'il n'est pas déjà présent dans l'analyse de la source (mêmes clés de hachage). Nécessite `uiLanguagesPath` pointant vers un `ui-languages.json` valide. |

### `cacheDir`

| Champ      | Description                                                                 |
| ---------- | ----------------------------------------------------------------------------- |
| `cacheDir` | Répertoire du cache SQLite (partagé par tous les blocs `documentations`). À réutiliser entre les exécutions. Si vous migrez depuis un cache personnalisé de traduction de documentation, archivez-le ou supprimez-le — `cacheDir` crée sa propre base de données SQLite et n'est pas compatible avec d'autres schémas. |

### `documentations`

Tableau des blocs de pipeline de documentation. `translate-docs` et la phase de documentation du processus `sync` **chaque** bloc dans l'ordre.

| Champ                                        | Description                                                                                                                                                                                                               |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `description`                                | Note facultative lisible par l'humain pour ce bloc (non utilisée pour la traduction). Préfixée dans le titre `translate-docs` avec l'icône `🌐` lorsqu'elle est définie ; également affichée dans les en-têtes de section `status`.                                                     |
| `contentPaths`                               | Sources Markdown/MDX à traduire (`translate-docs` analyse ces fichiers pour les extensions `.md` / `.mdx`). Les libellés JSON proviennent de `jsonSource` sur le même bloc.                                                                                  |
| `outputDir`                                  | Répertoire racine pour la sortie traduite de ce bloc.                                                                                                                                                                      |
| `sourceFiles`                                | Alias facultatif fusionné à `contentPaths` au chargement.                                                                                                                                                                        |
| `targetLocales`                              | Sous-ensemble facultatif de paramètres régionaux pour ce bloc uniquement (sinon, utilise les `targetLocales` racines). Les paramètres régionaux effectifs pour la documentation sont l'union entre tous les blocs.                                                                             |
| `jsonSource`                                 | Répertoire source pour les fichiers de libellés JSON Docusaurus de ce bloc (par exemple, `"i18n/en"`).                                                                                                                                       |
| `markdownOutput.style`                       | `"nested"` (par défaut), `"docusaurus"` ou `"flat"`.                                                                                                                                                                        |
| `markdownOutput.docsRoot`                    | Répertoire source docs pour la structure Docusaurus (par exemple, `"docs"`).                                                                                                                                                                   |
| `markdownOutput.pathTemplate`                | Chemin personnalisé de sortie Markdown. Espaces réservés : <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{LOCALE}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{basename}"}</code>, <code>{"{extension}"}</code>, <code>{"{docsRoot}"}</code>, <code>{"{relativeToDocsRoot}"}</code>. |
| `markdownOutput.jsonPathTemplate`            | Chemin personnalisé de sortie JSON pour les fichiers de libellés. Prend en charge les mêmes espaces réservés que `pathTemplate`.                                                                                                                                |
| `markdownOutput.flatPreserveRelativeDir`     | Pour le style `flat`, conserve les sous-répertoires sources afin d'éviter les conflits entre fichiers ayant le même nom de base.                                                                                                                              |
| `markdownOutput.rewriteRelativeLinks` | Réécrit les liens relatifs après la traduction (activé automatiquement pour le style `flat`).                                                                                                                                                 |
| `markdownOutput.linkRewriteDocsRoot` | Racine du dépôt utilisée lors du calcul des préfixes de réécriture des liens plats. Laissez généralement à `"."` sauf si vos documents traduits se trouvent sous une racine de projet différente. |
| `markdownOutput.postProcessing` | Transformations facultatives appliquées au **corps** Markdown traduit (le front matter YAML est préservé). S'exécute après le réassemblage des segments et la réécriture des liens plats, et avant `addFrontmatter`. |
| `markdownOutput.postProcessing.regexAdjustments` | Liste ordonnée de `{ "description"?, "search", "replace" }`. `search` est un motif regex (une chaîne simple utilise le drapeau `g`, ou `/pattern/flags`). `replace` prend en charge des espaces réservés tels que `${translatedLocale}`, `${sourceLocale}`, `${sourceFullPath}`, `${translatedFullPath}`, `${sourceFilename}`, `${translatedFilename}`, `${sourceBasedir}`, `${translatedBasedir}` (même principe que la référence `additional-adjustments`). |
| `markdownOutput.postProcessing.languageListBlock` | `{ "start", "end", "separator" }` — le traducteur recherche la première ligne contenant `start` et la ligne `end` correspondante, puis remplace cet extrait par un sélecteur de langue canonique. Les liens sont construits avec des chemins relatifs au fichier traduit ; les libellés proviennent de `uiLanguagesPath` / `ui-languages.json` si configuré, sinon de `localeDisplayNames` et des codes de paramètres régionaux. |
| `addFrontmatter`                  | Lorsque `true` (par défaut si omis), les fichiers Markdown traduits incluent les clés YAML : `translation_last_updated`, `source_file_mtime`, `source_file_hash`, `translation_language`, `source_file_path`, et lorsqu'au moins un segment possède des métadonnées de modèle, `translation_models` (liste triée des identifiants de modèles OpenRouter utilisés). Définir à `false` pour ignorer. |

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

| Champ                       | Description |
| --------------------------- | ----------- |
| `sourcePath`                | Un répertoire ou un tableau de répertoires scannés récursivement pour les fichiers `.svg`. |
| `outputDir`                 | Répertoire racine pour la sortie SVG traduite. |
| `style`                     | `"plat"` ou `"imbriqué"` lorsque `pathTemplate` n'est pas défini. |
| `pathTemplate`              | Chemin de sortie SVG personnalisé. Espaces réservés : <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{LOCALE}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{basename}"}</code>, <code>{"{extension}"}</code>, <code>{"{relativeToSourceRoot}"}</code>. |
| `svgExtractor.forceLowercase` | Texte traduit en minuscules lors du réassemblage SVG. Utile pour les designs qui dépendent d'étiquettes entièrement en minuscules. |

### `glossary`

| Champ          | Description                                                                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `uiGlossary`   | Chemin vers `strings.json` - construit automatiquement un glossaire à partir des traductions existantes.                                                                                                                 |
| `userGlossary` | Chemin vers un fichier CSV avec les colonnes `Original language string` (ou `en`), `locale`, `Translation` - une ligne par terme source et langue cible (`locale` peut être `*` pour toutes les cibles).

La clé héritée `uiGlossaryFromStringsJson` est toujours acceptée et mappée à `uiGlossary` lors du chargement de la configuration.

Générer un CSV de glossaire vide :

```bash
npx ai-i18n-tools glossary-generate
```

---

## Référence CLI

| Command                                                                   | Description                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `version`                                                                 | Affiche la version CLI et l'horodatage de compilation (même information que `-V` / `--version` sur le programme racine).                                                                                                                                                                                                  |
| `init [-t ui-markdown|ui-docusaurus] [-o path] [--with-translate-ignore]` | Écrit un fichier de configuration de démarrage (inclut `concurrency`, `batchConcurrency`, `batchSize`, `maxBatchChars` et `documentations[].addFrontmatter`). `--with-translate-ignore` crée un `.translate-ignore` de démarrage.                                                                            |
| `extract`                                                                 | Met à jour `strings.json` à partir de littéraux `t("…")` / `i18n.t("…")`, une description facultative `package.json` et des entrées facultatives du manifeste `englishName` (voir `ui.reactExtractor`). Nécessite `features.extractUIStrings`.                                                                                                                                                                                                    |
| `generate-ui-languages [--master <path>] [--dry-run]`                     | Écrit `ui-languages.json` dans `ui.flatOutputDir` (ou `uiLanguagesPath` s'il est défini) en utilisant `sourceLocale` + `targetLocales` et le `data/ui-languages-complete.json` intégré (ou `--master`). Affiche un avertissement et émet des espaces réservés `TODO` pour les paramètres régionaux manquants dans le fichier maître. Si vous avez un manifeste existant avec des valeurs `label` ou `englishName` personnalisées, elles seront remplacées par les valeurs par défaut du catalogue maître — vérifiez et ajustez le fichier généré par la suite. |
| `translate-docs …`                                                        | Traduit les fichiers markdown/MDX et JSON pour chaque bloc `documentations` (`contentPaths`, `jsonSource` facultatif). `-j` : nombre maximal de paramètres régionaux en parallèle ; `-b` : nombre maximal d'appels d'API par lot par fichier. `--prompt-format` : format de transmission par lot (`xml` \| `json-array` \| `json-object`). Voir [Comportement du cache et indicateurs `translate-docs`](#cache-behaviour-and-translate-docs-flags) et [Format de prompt par lot](#batch-prompt-format). |
| `translate-svg …`                                                         | Traduit les ressources SVG autonomes configurées dans `config.svg` (distinctes de la documentation). Nécessite `features.translateSVG`. Mêmes principes de cache que pour la documentation ; prend en charge `--no-cache` pour ignorer les lectures/écritures SQLite pendant cette exécution. `-j`, `-b`, `--force`, `--force-update`, `-p` / `--path`, `--dry-run`.                                                    |
| `translate-ui [--locale <code>] [--force] [--dry-run] [-j <n>]`           | Traduit uniquement les chaînes d'interface utilisateur. `--force` : traduit à nouveau toutes les entrées par paramètre régional (ignore les traductions existantes). `--dry-run` : aucune écriture, aucun appel API. `-j` : nombre maximal de paramètres régionaux en parallèle. Nécessite `features.translateUIStrings`.                                                                                 |
| `export-ui-xliff [-l <codes>] [-o <dir>] [--untranslated-only] [--dry-run]` | Exporte `strings.json` vers XLIFF 2.0 (un `.xliff` par paramètre régional cible). `-o` / `--output-dir` : répertoire de sortie (par défaut : même dossier que le catalogue). `--untranslated-only` : uniquement les unités manquantes d'une traduction pour ce paramètre régional. Lecture seule ; pas d'API.                                                        |
| `sync …`                                                                  | Extraction (si activée), puis traduction de l'interface utilisateur, puis `translate-svg` lorsque `features.translateSVG` et `config.svg` sont définis, puis traduction de la documentation — sauf si sautée avec `--no-ui`, `--no-svg` ou `--no-docs`. Indicateurs partagés : `-l`, `-p` / `-f`, `--dry-run`, `-j`, `-b` (uniquement pour le regroupement de la documentation), `--force` / `--force-update` (uniquement pour la documentation ; mutuellement exclusifs lorsque la documentation est exécutée). La phase de documentation transmet également `--emphasis-placeholders` et `--debug-failed` (même signification que `translate-docs`). `--prompt-format` n'est pas un indicateur `sync` ; l'étape de documentation utilise la valeur par défaut intégrée (`json-array`).                         |
| `status [--max-columns <n>]`                                   | Lorsque `features.translateUIStrings` est activé, affiche la couverture de l'interface utilisateur par paramètre régional (`Translated` / `Missing` / `Total`). Affiche ensuite l'état de traduction du markdown par fichier × paramètre régional (pas de filtre `--locale` ; les paramètres régionaux proviennent de la configuration). Les listes importantes de paramètres régionaux sont divisées en plusieurs tableaux répétés d'au plus `n` colonnes de paramètres régionaux (par défaut **9**) afin que les lignes restent étroites dans le terminal.                                                                                                                                                                                               |
| `cleanup [--dry-run] [--no-backup] [--backup <path>]`                  | Exécute d'abord `sync --force-update` (extraction, interface utilisateur, SVG, documentation), puis supprime les lignes de segments obsolètes (`last_hit_at` nul / chemin de fichier vide) ; supprime les lignes `file_tracking` dont le chemin source résolu est manquant sur le disque ; supprime les lignes de traduction dont les métadonnées `filepath` pointent vers un fichier manquant. Affiche trois comptages (obsolètes, `file_tracking` orphelins, traductions orphelines). Crée une sauvegarde SQLite horodatée dans le répertoire du cache sauf si `--no-backup` est utilisé. |
| `editor [-p <port>] [--no-open]`                                          | Lance un éditeur web local pour le cache, `strings.json` et le fichier CSV du glossaire. `--no-open` : n'ouvre pas automatiquement le navigateur par défaut.<br><br>**Remarque :** Si vous modifiez une entrée dans l'éditeur de cache, vous devez exécuter un `sync --force-update` pour réécrire les fichiers de sortie avec l'entrée de cache mise à jour. De plus, si le texte source change ultérieurement, la modification manuelle sera perdue car une nouvelle clé de cache est générée. |
| `glossary-generate [-o <path>]`                                           | Écrit un modèle `glossary-user.csv` vide. `-o` : remplace le chemin de sortie (par défaut : `glossary.userGlossary` de la configuration, ou `glossary-user.csv`).                                                                                                                                                |

Toutes les commandes acceptent `-c <path>` pour spécifier un fichier de configuration non par défaut, `-v` pour une sortie détaillée, et `-w` / `--write-logs [path]` pour rediriger la sortie console vers un fichier journal (chemin par défaut : sous `cacheDir` racine). Le programme principal prend également en charge `-V` / `--version` et `-h` / `--help` ; `ai-i18n-tools help [command]` affiche la même aide par commande que `ai-i18n-tools <command> --help`.

---

## Variables d'environnement

| Variable               | Description                                                |
| ---------------------- | ---------------------------------------------------------- |
| `OPENROUTER_API_KEY`   | **Requis.** Votre clé API OpenRouter.                     |
| `OPENROUTER_BASE_URL`  | Remplacer l'URL de base de l'API.                         |
| `I18N_SOURCE_LOCALE`   | Remplacer `sourceLocale` à l'exécution.                   |
| `I18N_TARGET_LOCALES`  | Codes de locale séparés par des virgules pour remplacer `targetLocales`.  |
| `I18N_LOG_LEVEL`       | Niveau du journal (`debug`, `info`, `warn`, `error`, `silent`). |
| `NO_COLOR`             | Lorsque `1`, désactiver les couleurs ANSI dans la sortie du journal.            |
| `I18N_LOG_SESSION_MAX` | Nombre maximum de lignes conservées par session de journal (par défaut `5000`).           |
