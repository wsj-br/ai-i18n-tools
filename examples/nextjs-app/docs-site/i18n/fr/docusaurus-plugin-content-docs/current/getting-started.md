---
translation_last_updated: '2026-04-11T01:50:07.482Z'
source_file_mtime: '2026-04-11T01:49:54.972Z'
source_file_hash: 42cdce1d92b5dfdb22af93d450a8a9ca909c0ec4aa06ddfe5cf89bde8acd698b
translation_language: fr
source_file_path: docs-site/docs/getting-started.md
---
# ai-i18n-tools : prise en main

`ai-i18n-tools` fournit deux workflows indépendants et composable :

- **Workflow 1 - Traduction de l'interface utilisateur** : extraire les appels `t("…")` à partir de n'importe quelle source JS/TS, les traduire via OpenRouter, puis générer des fichiers JSON plats par langue, prêts à être utilisés avec i18next.
- **Workflow 2 - Traduction de documents** : traduire des fichiers Markdown (MDX), des fichiers JSON d'étiquettes Docusaurus et des fichiers SVG vers un nombre quelconque de langues, avec une mise en cache intelligente.

Les deux workflows utilisent OpenRouter (n'importe quel LLM compatible) et partagent un seul fichier de configuration.

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table des matières**

- [Installation](#installation)
- [Démarrage rapide](#quick-start)
- [Workflow 1 - Traduction de l'interface utilisateur](#workflow-1---ui-translation)
  - [Étape 1 : Initialiser](#step-1-initialize)
  - [Étape 2 : Extraire les chaînes](#step-2-extract-strings)
  - [Étape 3 : Traduire les chaînes d'interface utilisateur](#step-3-translate-ui-strings)
  - [Étape 4 : Intégrer i18next au moment de l'exécution](#step-4-wire-i18next-at-runtime)
  - [Utilisation de `t()` dans le code source](#using-t-in-source-code)
  - [Interpolation](#interpolation)
  - [Interface de changement de langue](#language-switcher-ui)
  - [Langues RTL](#rtl-languages)
- [Workflow 2 - Traduction de documents](#workflow-2---document-translation)
  - [Étape 1 : Initialiser](#step-1-initialize-1)
  - [Étape 2 : Traduire les documents](#step-2-translate-documents)
    - [Comportement du cache et indicateurs `translate-docs`](#cache-behavior-and-translate-docs-flags)
  - [Dispositions de sortie](#output-layouts)
- [Workflow combiné (UI + Docs)](#combined-workflow-ui--docs)
- [Référence de configuration](#configuration-reference)
  - [`sourceLocale`](#sourcelocale)
  - [`targetLocales`](#targetlocales)
  - [`concurrency` (facultatif)](#concurrency-optional)
  - [`batchConcurrency` (facultatif)](#batchconcurrency-optional)
  - [`batchSize` / `maxBatchChars` (facultatif)](#batchsize--maxbatchchars-optional)
  - [`openrouter`](#openrouter)
  - [`features`](#features)
  - [`ui`](#ui)
  - [`documentation`](#documentation)
  - [`glossary`](#glossary)
- [Référence CLI](#cli-reference)
- [Variables d'environnement](#environment-variables)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Installation {#installation}

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

Définissez votre clé API OpenRouter :

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Ou créez un fichier `.env` à la racine du projet :

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

## Démarrage rapide {#quick-start}

Le modèle `init` par défaut (`ui-markdown`) active uniquement l'extraction et la traduction **UI**. Le modèle `ui-docusaurus` active la traduction de **documents** (`translate-docs`). Utilisez `sync` lorsque vous souhaitez effectuer extraction + UI + docs (et SVG autonome facultatif lorsque `svg` est configuré) en un seul appel.

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

## Workflow 1 - Traduction de l'interface utilisateur {#workflow-1---ui-translation}

Conçu pour tout projet JS/TS utilisant i18next : applications React, Next.js (composants client et serveur), services Node.js, outils CLI.

### Étape 1 : Initialiser {#step-1-initialize}

```bash
npx ai-i18n-tools init
```

Cela écrit `ai-i18n-tools.config.json` avec le modèle `ui-markdown`. Modifiez-le pour définir :

- `sourceLocale` - le code BCP-47 de votre langue source (par exemple `"en-GB"`). **Doit correspondre** à `SOURCE_LOCALE` exporté depuis votre fichier de configuration i18n au moment de l'exécution (`src/i18n.ts` / `src/i18n.js`).
- `targetLocales` - chemin vers votre manifeste `ui-languages.json` OU un tableau de codes BCP-47.
- `ui.sourceRoots` - répertoires à analyser pour les appels `t("…")` (par exemple `["src/"]`).
- `ui.stringsJson` - emplacement où écrire le catalogue maître (par exemple `"src/locales/strings.json"`).
- `ui.flatOutputDir` - emplacement où écrire les fichiers `de.json`, `pt-BR.json`, etc. (par exemple `"src/locales/"`).

### Étape 2 : Extraire les chaînes {#step-2-extract-strings}

```bash
npx ai-i18n-tools extract
```

Analyse tous les fichiers JS/TS situés sous `ui.sourceRoots` à la recherche d'appels `t("littéral")` et `i18n.t("littéral")`. Écrit (ou fusionne dans) `ui.stringsJson`.

L'analyseur est configurable - vous pouvez ajouter des noms de fonctions personnalisés via `ui.reactExtractor.funcNames`.

### Étape 3 : Traduire les chaînes d'interface utilisateur {#step-3-translate-ui-strings}

```bash
npx ai-i18n-tools translate-ui
```

Lit le fichier `strings.json`, envoie des lots à OpenRouter pour chaque langue cible, puis écrit des fichiers JSON plats (`de.json`, `fr.json`, etc.) dans `ui.flatOutputDir`.

### Étape 4 : Intégrer i18next au moment de l'exécution {#step-4-wire-i18next-at-runtime}

Créez votre fichier de configuration i18n en utilisant les utilitaires exportés par `'ai-i18n-tools/runtime'` :

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

Importez `i18n.js` avant que React ne rende l'interface (par exemple, en haut de votre point d'entrée). Lorsque l'utilisateur change de langue, appelez `await loadLocale(code)`, puis `i18n.changeLanguage(code)`.

`SOURCE_LOCALE` est exporté afin que tout autre fichier qui en a besoin (par exemple, un sélecteur de langue) puisse l'importer directement depuis `'./i18n'`.

`**defaultI18nInitOptions(sourceLocale)**` renvoie les options standard pour les configurations où la clé sert de texte par défaut :

- `parseMissingKeyHandler` renvoie la clé elle-même, de sorte que les chaînes non traduites affichent le texte source.
- `nsSeparator: false` permet aux clés de contenir des deux-points.
- `interpolation.escapeValue: false` - désactiver ceci est sans danger : React échappe les valeurs lui-même, et la sortie Node.js/CLI ne contient pas de HTML à échapper.

`**wrapI18nWithKeyTrim(i18n)**` enveloppe `i18n.t` de manière à ce que : (1) les clés soient tronquées avant la recherche, ce qui correspond à la façon dont le script d'extraction les stocke ; (2) l'interpolation <code>{"{{var}}"}</code> soit appliquée lorsque la langue source renvoie la clé brute - ainsi <code>{"t('Hello {{name}}', { name })"}</code> fonctionne correctement même pour la langue source.

`**makeLoadLocale(i18n, loaders, sourceLocale)**` renvoie une fonction asynchrone `loadLocale(lang)` qui importe dynamiquement le bundle JSON d'une langue et l'enregistre auprès d'i18next.

### Utilisation de `t()` dans le code source {#using-t-in-source-code}

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

- Seules les formes suivantes sont extraites : `t("…")`, `t('…')`, `t(`…`)`, `i18n.t("…")`.
- La clé doit être une **chaîne littérale** - aucune variable ou expression ne peut servir de clé.
- N'utilisez pas de littéraux de gabarit pour la clé : <code>{'t(`Hello ${name}`)'}</code> n'est pas extractible.

### Interpolation {#interpolation}

Utilisez l'interpolation native d'i18next via le deuxième argument pour les espaces réservés <code>{"{{var}}"}</code> :

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

Le script d'extraction ignore le deuxième argument - seule la chaîne littérale <code>{"\"Hello {{name}}, you have {{count}} messages\""}</code> est extraite et envoyée pour traduction. Les traducteurs sont instruits de préserver les tokens <code>{"{{...}}"}</code>.

### Interface du sélecteur de langue {#language-switcher-ui}

Utilisez le manifeste `ui-languages.json` pour construire un sélecteur de langue. `ai-i18n-tools` exporte deux utilitaires d'affichage :

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

`**getUILanguageLabel(lang, t)**` - affiche `t(englishName)` lors de la traduction, ou `englishName / t(englishName)` lorsque les deux diffèrent. Convient aux écrans de paramètres.

`**getUILanguageLabelNative(lang)**` - affiche `englishName / label` (pas d'appel `t()` sur chaque ligne). Convient aux menus d'en-tête où vous voulez que le nom natif soit visible.

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

`applyDirection` définit `document.documentElement.dir` (navigateur) ou est une opération sans effet (Node.js). Passez un argument `element` facultatif pour cibler un élément spécifique.

Pour les chaînes qui peuvent contenir des flèches `→`, inversez-les pour les mises en page RTL :

```js
import { flipUiArrowsForRtl } from 'ai-i18n-tools/runtime';
const { i18n } = useTranslation();
const isRtl = getTextDirection(i18n.language) === 'rtl';
const label = flipUiArrowsForRtl(t('Next → Step'), isRtl);
```

---

## Workflow 2 - Traduction de documents {#workflow-2---document-translation}

Conçu pour la documentation Markdown, les sites Docusaurus, les fichiers d'étiquettes JSON et les diagrammes SVG.

### Étape 1 : Initialiser {#step-1-initialize-1}

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

Modifiez le `ai-i18n-tools.config.json` généré :

- `sourceLocale` - langue source (doit correspondre à `defaultLocale` dans `docusaurus.config.js`).
- `targetLocales` - tableau de codes de paramètres régionaux ou chemin vers un manifeste.
- `documentation.contentPaths` - répertoires/fichiers sources Markdown/SVG.
- `documentation.outputDir` - racine de sortie traduite.
- `documentation.markdownOutput.style` - `"docusaurus"` ou `"flat"` (voir [Dispositions de sortie](#output-layouts)).

### Étape 2 : Traduire les documents {#step-2-translate-documents}

```bash
npx ai-i18n-tools translate-docs
```

Cela traduit tous les fichiers dans `documentation.contentPaths` vers tous les `targetLocales` (ou `documentation.targetLocales` lorsqu'il est défini). Les segments déjà traduits sont servis à partir du cache SQLite - seuls les segments nouveaux ou modifiés sont envoyés au LLM.

Pour traduire une seule langue :

```bash
npx ai-i18n-tools translate-docs --locale de
```

Pour vérifier ce qui doit être traduit :

```bash
npx ai-i18n-tools status
```

#### Comportement du cache et drapeaux `translate-docs` {#cache-behavior-and-translate-docs-flags}

L'interface de ligne de commande conserve le **suivi des fichiers** dans SQLite (hachage source par fichier × langue) et les lignes de **segments** (hachage × langue par fragment traduisible). Une exécution normale ignore complètement un fichier lorsque le hachage suivi correspond à la source actuelle **et** que le fichier de sortie existe déjà ; sinon, il traite le fichier et utilise le cache des segments afin que le texte inchangé n'appelle pas l'API.

| Drapeau                  | Effet                                                                                                                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| *(par défaut)*           | Ignorer les fichiers inchangés lorsque le suivi et la correspondance de la sortie sur disque ; utiliser le cache des segments pour le reste.                                                             |
| `--force-update`         | Retraiter chaque fichier correspondant (extraire, réassembler, écrire les sorties) même lorsque le suivi des fichiers l'ignorerait. **Le cache des segments s'applique encore** - les segments inchangés ne sont pas envoyés au LLM.   |
| `--force`                | Efface le suivi des fichiers pour chaque fichier traité et **ne lit pas** le cache des segments pour la traduction API (retraduction complète). Les nouveaux résultats sont toujours **écrits** dans le cache des segments. |
| `--stats`                | Imprimer les comptages de segments, les comptages de fichiers suivis et les totaux de segments par langue, puis quitter.                                                                                  |
| `--clear-cache [locale]` | Supprimer les traductions mises en cache (et le suivi des fichiers) : toutes les langues, ou une seule langue, puis quitter.                                                                             |

Vous ne pouvez pas combiner `--force` avec `--force-update` (ils sont mutuellement exclusifs).

### Dispositions de sortie {#output-layouts}

`**"docusaurus"`** - place les fichiers traduits dans `i18n/<locale>/docusaurus-plugin-content-docs/current/<relPath>`, en miroir de la structure de dossiers i18n standard de Docusaurus. Définissez `documentation.markdownOutput.docsRoot` à la racine source de votre documentation (par exemple `"docs"`).

```
docs/guide.md         → i18n/de/docusaurus-plugin-content-docs/current/guide.md
i18n/en/sidebar.json  → i18n/de/sidebar.json  (JSON label files)
```

`**"flat"**` - place les fichiers traduits à côté des fichiers sources avec un suffixe de langue, ou dans un sous-répertoire. Les liens relatifs entre pages sont réécrits automatiquement.

```
docs/guide.md → i18n/guide.de.md
```

Vous pouvez remplacer complètement les chemins avec `documentation.markdownOutput.pathTemplate`. Paramètres disponibles : <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{extension}"}</code>, <code>{"{docsRoot}"}</code>, <code>{"{relativeToDocsRoot}"}</code>.

---

## Flux de travail combiné (UI + Docs) {#combined-workflow-ui--docs}

Activez toutes les fonctionnalités dans une seule configuration pour exécuter les deux flux simultanément :

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": "src/locales/ui-languages.json",
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
  "documentation": {
    "contentPaths": ["docs/"],
    "outputDir": "i18n/",
    "cacheDir": ".translation-cache",
    "markdownOutput": { "style": "flat" }
  }
}
```

`glossary.uiGlossary` oriente la traduction des documents vers le même catalogue `strings.json` que l'interface utilisateur afin que la terminologie reste cohérente ; `glossary.userGlossary` ajoute des remplacements CSV pour les termes produits.

Exécutez `npx ai-i18n-tools sync` pour lancer un pipeline : **extraire** les chaînes d'interface (si `features.extractUIStrings`), **traduire** les chaînes d'interface (si `features.translateUIStrings`), **traduire** les ressources SVG autonomes (si un bloc `svg` est présent dans la configuration), puis **traduire la documentation** (markdown/JSON sous `documentation`). Ignorez certaines parties avec `--no-ui`, `--no-svg` ou `--no-docs`. L'étape docs accepte `--dry-run`, `-p` / `--path`, `--force` et `--force-update` (les deux derniers s'appliquent uniquement lorsque la traduction de documentation est exécutée ; ils sont ignorés si vous passez `--no-docs`).

Utilisez `documentation.targetLocales` pour traduire la documentation vers un **sous-ensemble plus restreint** que celui de l'interface utilisateur :

```json
{
  "targetLocales": "src/locales/ui-languages.json",
  "documentation": {
    "targetLocales": ["de", "fr", "es"]
  }
}
```

---

## Référence de configuration {#configuration-reference}

### `sourceLocale` {#sourcelocale}

Code BCP-47 pour la langue source (par exemple `"en-GB"`, `"en"`, `"pt-BR"`). Aucun fichier de traduction n'est généré pour ce paramètre régional — la chaîne clé elle-même est le texte source.

**Doit correspondre** à `SOURCE_LOCALE` exporté depuis votre fichier de configuration i18n au moment de l'exécution (`src/i18n.ts` / `src/i18n.js`).

### `targetLocales` {#targetlocales}

Les paramètres régionaux vers lesquels traduire. Accepte :

- **Chemin sous forme de chaîne** vers un manifeste `ui-languages.json` (`"src/locales/ui-languages.json"`). Le fichier est chargé et les codes de paramètres régionaux sont extraits.
- **Tableau de codes BCP-47** (`["de", "fr", "es"]`).
- **Tableau à un seul élément contenant un chemin** (`["src/locales/ui-languages.json"]`) - comportement identique à la forme chaîne.

### `concurrency` (facultatif) {#concurrency-optional}

Nombre maximal de **paramètres régionaux cibles** traduits simultanément (`translate-ui`, `translate-docs`, `translate-svg`, et les étapes correspondantes dans `sync`). En l'absence de valeur, l'interface en ligne de commande utilise **4** pour la traduction de l'interface et **3** pour la traduction de la documentation (valeurs par défaut intégrées). Remplacez-la lors d'une exécution avec `-j` / `--concurrency`.

### `batchConcurrency` (facultatif) {#batchconcurrency-optional}

**translate-docs** et **translate-svg** (et l'étape de documentation de `sync`) : nombre maximal de requêtes par lot (batch) OpenRouter par fichier (chaque lot peut contenir de nombreux segments). Valeur par défaut : **4** lorsqu'omis. Ignoré par `translate-ui`. Remplacer avec `-b` / `--batch-concurrency`. Sur `sync`, `-b` s'applique uniquement à l'étape de traduction de la documentation.

### `batchSize` / `maxBatchChars` (facultatif) {#batchsize--maxbatchchars-optional}

Regroupement des segments pour la traduction de documents : nombre de segments par requête API et plafond en caractères. Valeurs par défaut : **20** segments, **4096** caractères (lorsqu'omis).

### `openrouter` {#openrouter}

| Champ                   | Description                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| `baseUrl`               | URL de base de l'API OpenRouter. Par défaut : `https://openrouter.ai/api/v1`.            |
| `translationModels`     | Liste ordonnée des identifiants de modèles. Le premier est essayé en premier ; les suivants servent de secours en cas d'erreur. |
| `maxTokens`             | Nombre maximal de jetons de complétion par requête. Par défaut : `8192`.                 |
| `temperature`           | Température d'échantillonnage. Par défaut : `0.2`.                                        |

Définissez `OPENROUTER_API_KEY` dans votre environnement ou fichier `.env`.

### `features` {#features}

| Champ                    | Workflow | Description                                                       |
| ------------------------ | -------- | ----------------------------------------------------------------- |
| `extractUIStrings`       | 1        | Analyse la source pour les `t("…")` et écrit/fusionne `strings.json`.          |
| `translateUIStrings`     | 1        | Traduit les entrées de `strings.json` et écrit les fichiers JSON par langue. |
| `translateMarkdown`      | 2        | Traduit les fichiers `.md` / `.mdx`.                                   |
| `translateJSON`          | 2        | Traduit les fichiers JSON d'étiquettes Docusaurus.                            |
| `translateSVG`           | 2        | Traduit le contenu textuel des fichiers `.svg`.                           |

### `ui` {#ui}

| Champ                         | Description                                                             |
| ----------------------------- | ----------------------------------------------------------------------- |
| `sourceRoots`                 | Répertoires (relatifs au répertoire courant) analysés pour les appels `t("…")`.               |
| `stringsJson`                 | Chemin vers le fichier catalogue principal. Mis à jour par `extract`.                  |
| `flatOutputDir`               | Répertoire où sont écrits les fichiers JSON par langue (`de.json`, etc.).    |
| `reactExtractor.funcNames`    | Noms de fonctions supplémentaires à analyser (par défaut : `["t", "i18n.t"]`).         |
| `reactExtractor.extensions`   | Extensions de fichiers à inclure (par défaut : `[".js", ".jsx", ".ts", ".tsx"]`). |

### `documentation` {#documentation}

| Champ                                        | Description                                                                                                                                                                                                               |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `contentPaths`                               | Fichiers/dossiers sources à traduire (markdown, JSON, SVG).                                                                                                                                                              |
| `outputDir`                                  | Répertoire racine pour la sortie traduite.                                                                                                                                                                                     |
| `cacheDir`                                   | Répertoire du cache SQLite. À réutiliser entre les exécutions pour une traduction incrémentielle.                                                                                                                                                    |
| `targetLocales`                              | Sous-ensemble facultatif de paramètres régionaux pour la documentation uniquement (remplace `targetLocales` racine).                                                                                                                                                |
| `jsonSource`                                 | Répertoire source des fichiers d'étiquettes JSON Docusaurus (par exemple, `"i18n/en"`).                                                                                                                                                      |
| `markdownOutput.style`                       | `"docusaurus"` ou `"flat"`.                                                                                                                                                                                               |
| `markdownOutput.docsRoot`                    | Répertoire source de la documentation pour la disposition Docusaurus (par exemple, `"docs"`).                                                                                                                                                                   |
| `markdownOutput.pathTemplate`                | Modèle de chemin de sortie personnalisé. Espaces réservés : <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{extension}"}</code>.                                                                                                                        |
| `markdownOutput.rewriteRelativeLinks` | Réécriture des liens relatifs après traduction (activée automatiquement pour le style `flat`).                                                                                                                                                 |
| `injectTranslationMetadata`                  | Lorsque `true` (par défaut si omis), les fichiers markdown traduits incluent les clés YAML : `translation_last_updated`, `source_file_mtime`, `source_file_hash`, `translation_language`, `source_file_path`. Définir sur `false` pour ignorer. |

### `glossary` {#glossary}

| Champ          | Description                                                                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `uiGlossary`   | Chemin vers `strings.json` - construit automatiquement un glossaire à partir des traductions existantes.                                                                                                                 |
| `userGlossary` | Chemin vers un fichier CSV avec les colonnes `**Original language string**` (ou `**en**`), `**locale**`, `**Translation**` - une ligne par terme source et langue cible (`locale` peut être `*` pour toutes les cibles). |

L'ancienne clé `uiGlossaryFromStringsJson` est toujours acceptée et mappée à `uiGlossary` lors du chargement de la configuration.

Générer un fichier CSV de glossaire vide :

```bash
npx ai-i18n-tools glossary-generate
```

---

## Référence CLI {#cli-reference}

| Command                                                                   | Description                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `init [-t ui-markdown|ui-docusaurus] [-o path] [--with-translate-ignore]` | Écrit un fichier de configuration de démarrage (inclut `concurrency`, `batchConcurrency`, `batchSize`, `maxBatchChars`, et `documentation.injectTranslationMetadata`). L'option `--with-translate-ignore` crée un fichier `.translate-ignore` de base.                                                                            |
| `extract`                                                                 | Analyse les sources à la recherche des appels `t("…")` et met à jour `strings.json`. Nécessite `features.extractUIStrings`.                                                                                                                                                                                                    |
| `translate-docs …`                                                        | Traduit les fichiers de documentation situés dans `documentation.contentPaths` (markdown, MDX, fichiers d'étiquettes JSON, et tout `.svg` inclus là-dedans). `-j` : nombre maximal de langues en parallèle ; `-b` : nombre maximal d'appels parallèles à l'API par lot par fichier. Voir [Comportement du cache et options de `translate-docs`](#cache-behavior-and-translate-docs-flags) pour `--force`, `--force-update`, `--stats`, `--clear-cache`. |
| `translate-svg …`                                                         | Traduit les ressources SVG autonomes configurées dans `config.svg` (distinctes des docs). Même logique de cache que pour les docs ; prend en charge `--no-cache` pour ignorer les lectures/écritures SQLite lors de cette exécution. `-j`, `-b`, `--force`, `--force-update`, `-p` / `--path`, `--dry-run`.                                                    |
| `translate-ui [--locale <code>] [-j <n>]`                                 | Traduit uniquement les chaînes d'interface utilisateur. `-j` : nombre maximal de langues en parallèle. Nécessite `features.translateUIStrings`.                                                                                                                                                                                                     |
| `sync …`                                                                  | Extraction (si activée), puis traduction de l'interface, puis `translate-svg` si `config.svg` existe, puis traduction de la documentation – sauf si ignorée avec `--no-ui`, `--no-svg` ou `--no-docs`. Options partagées : `-l`, `-p`, `--dry-run`, `-j`, `-b` (uniquement pour le traitement par lots des docs), `--force` / `--force-update` (uniquement pour les docs ; s'excluent mutuellement lorsque les docs sont traités).                         |
| `status`                                                                  | Affiche l'état de traduction des fichiers markdown par fichier × langue (pas de filtre `--locale` ; les langues proviennent de la configuration).                                                                                                                                                                                               |
| `cleanup [--dry-run] [--no-backup] [--backup <path>] [-y]`                  | Supprime les lignes obsolètes (valeur `last_hit_at` nulle / chemin de fichier vide) et les lignes orphelines (fichiers manquants). Avant de modifier la base de données, demande confirmation (sauf avec `--dry-run` ou `--yes`) : exécutez d'abord `translate-docs --force-update` afin que le suivi et les hits de cache soient à jour. Crée une sauvegarde SQLite horodatée dans le répertoire du cache, sauf si `--no-backup` est utilisé. Utilisez `--yes` lorsque l'entrée standard n'est pas un TTY. |
| `editor [-p <port>]`                                                      | Lance un éditeur web local pour le cache, `strings.json` et le fichier CSV du glossaire.                                                                                                                                                                                                                         |
| `glossary-generate`                                                       | Crée un modèle vide de fichier `glossary-user.csv`.                                                                                                                                                                                                                                                       |

Toutes les commandes acceptent `-c <chemin>` pour spécifier un fichier de configuration non par défaut, `-v` pour une sortie détaillée, et `-w` / `--write-logs [chemin]` pour rediriger la sortie console vers un fichier journal (chemin par défaut : sous `documentation.cacheDir`).

---

## Variables d'environnement {#environment-variables}

| Variable               | Description                                                |
| ---------------------- | ---------------------------------------------------------- |
| `OPENROUTER_API_KEY`   | **Requis.** Votre clé API OpenRouter.                     |
| `OPENROUTER_BASE_URL`  | Remplace l'URL de base de l'API.                                 |
| `I18N_SOURCE_LOCALE`   | Remplace `sourceLocale` au moment de l'exécution.                        |
| `I18N_TARGET_LOCALES`  | Codes de langue séparés par des virgules pour remplacer `targetLocales`.  |
| `I18N_LOG_LEVEL`       | Niveau du journaliseur (`debug`, `info`, `warn`, `error`, `silent`). |
| `NO_COLOR`             | Lorsque `1`, désactive les couleurs ANSI dans la sortie des journaux.               |
| `I18N_LOG_SESSION_MAX` | Nombre maximal de lignes conservées par session de journal (par défaut `5000`).           |
