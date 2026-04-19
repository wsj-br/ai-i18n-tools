<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table des matières**  *générée avec [DocToc](https://github.com/thlorenz/doctoc)*

- [ai-i18n-tools](#ai-i18n-tools)
  - [Deux flux de travail principaux](#two-core-workflows)
  - [Installation](#installation)
  - [Démarrage rapide](#quick-start)
    - [Flux de travail 1 - Chaînes d'interface](#workflow-1---ui-strings)
    - [Flux de travail 2 - Documentation](#workflow-2---documentation)
    - [Les deux flux de travail](#both-workflows)
  - [Assistants d'exécution](#runtime-helpers)
  - [Commandes CLI](#cli-commands)
  - [Documentation](#documentation)
  - [Licence](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# ai-i18n-tools

Outil en ligne de commande et programme pour l'internationalisation d'applications JavaScript/TypeScript et de sites de documentation. Extrait les chaînes d'interface utilisateur, les traduit à l'aide de modèles linguistiques (LLM) via OpenRouter, puis génère des fichiers JSON prêts pour les paramètres régionaux destinés à i18next, ainsi que des pipelines pour le markdown, le JSON Docusaurus et (via `features.translateSVG`, `translate-svg` et le bloc `svg`) des ressources SVG autonomes.

<small>**Lire dans d'autres langues :** </small>

<small id="lang-list">[English (GB)](../README.md) · [German](./README.de.md) · [Spanish](./README.es.md) · [French](./README.fr.md) · [Hindi](./README.hi.md) · [Japanese](./README.ja.md) · [Korean](./README.ko.md) · [Portuguese (BR)](./README.pt-BR.md) · [Chinese (CN)](./README.zh-CN.md) · [Chinese (TW)](./README.zh-TW.md)</small>

## Deux flux de travail principaux

**Flux de travail 1 - Traduction de l'UI** (React, Next.js, Node.js, tout projet i18next)

Crée un catalogue principal (`strings.json` avec des métadonnées par langue facultatives **`models`**) à partir de **littéraux** `t("…")` / `i18n.t("…")`, éventuellement **`package.json` `description`**, et éventuellement chaque **`englishName`** provenant de `ui-languages.json` lorsque cette option est activée dans la configuration. Traduit les entrées manquantes par langue via OpenRouter et génère des fichiers JSON plats (`de.json`, `pt-BR.json`, …) prêts à être utilisés avec i18next.

**Flux de travail 2 - Traduction de documents** (Markdown, Docusaurus JSON)

Traduit les fichiers `.md` et `.mdx` à partir des `contentPaths` de chaque bloc `documentations` et les fichiers JSON d'étiquettes à partir du `jsonSource` de ce bloc lorsque cette fonction est activée. Prend en charge les structures de dossiers localisés au style Docusaurus ou plates, par bloc (`documentations[].markdownOutput`). Le `cacheDir` racine partagé contient le cache SQLite afin que seuls les segments nouveaux ou modifiés soient envoyés au LLM. **SVG :** activez `features.translateSVG`, ajoutez le bloc `svg` au niveau supérieur, puis utilisez `translate-svg` (également exécuté depuis `sync` lorsque les deux sont configurés).

Les deux flux de travail partagent un seul fichier `ai-i18n-tools.config.json` et peuvent être utilisés indépendamment ou conjointement. La traduction SVG autonome utilise `features.translateSVG` ainsi que le bloc `svg` au niveau supérieur et s'exécute via `translate-svg` (ou l'étape SVG à l'intérieur de `sync`).

---

## Installation

Le package publié est uniquement en format **ESM** (`"type": "module"`). Utilisez `import` depuis Node.js, des outils de regroupement ou `import()` — `require('ai-i18n-tools')` **n'est pas pris en charge.**

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
```

Définissez votre clé API OpenRouter :

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

## Démarrage rapide

### Flux de travail 1 - Chaînes UI

```bash
# 1. Create config
npx ai-i18n-tools init

# 2. Extract UI strings to strings.json (t(…) literals + optional package.json / manifest strings)
npx ai-i18n-tools extract

# 3. Translate to all target locales
npx ai-i18n-tools translate-ui
```

Connectez i18next dans votre application en utilisant les helpers de `'ai-i18n-tools/runtime'` :

```js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import uiLanguages from './locales/ui-languages.json';
import stringsJson from './locales/strings.json';
// Plural flat: ./public/locales/{SOURCE_LOCALE}.json — must match config sourceLocale
import sourcePluralFlat from './public/locales/en-GB.json';
import aiI18n from 'ai-i18n-tools/runtime';

// Must match sourceLocale in ai-i18n-tools.config.json
export const SOURCE_LOCALE = 'en-GB';

void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));
aiI18n.setupKeyAsDefaultT(i18n, {
  stringsJson,
  sourcePluralFlatBundle: { lng: SOURCE_LOCALE, bundle: sourcePluralFlat },
});
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

### Flux de travail 2 - Documentation

```bash
# 1. Create config for Docusaurus
npx ai-i18n-tools init -t ui-docusaurus

# 2. Translate all docs
npx ai-i18n-tools translate-docs

# 3. Check status
npx ai-i18n-tools status
```

### Les deux flux de travail

```bash
npx ai-i18n-tools sync   # Extract UI strings, then translate UI strings, SVG, and docs
```

---

## Helpers d'exécution

Exportés de `'ai-i18n-tools/runtime'` - fonctionnent dans n'importe quel environnement JS, aucune importation i18next requise :

| Assistant | Description |
|---|---|
| `defaultI18nInitOptions(sourceLocale)` | Options d'initialisation standard i18next pour les configurations où la clé sert de valeur par défaut. |
| `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` | Configuration recommandée : suppression du préfixe de clé + pluriel **`wrapT`** depuis **`strings.json`**, fusionne éventuellement les clés plurielles **`translate-ui`** `{sourceLocale}.json`. |
| `wrapI18nWithKeyTrim(i18n)` | Enveloppe bas niveau pour la suppression du préfixe de clé uniquement (obsolète pour le câblage applicatif ; privilégiez **`setupKeyAsDefaultT`**). |
| `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, makeLoader)` | Construit la carte **`localeLoaders`** pour **`makeLoadLocale`** à partir de **`ui-languages.json`** (chaque **`code`** sauf **`sourceLocale`**). |
| `makeLoadLocale(i18n, loaders, sourceLocale)` | Fabrique pour le chargement asynchrone des fichiers de langue. |
| `getTextDirection(lng)` | Renvoie `'ltr'` ou `'rtl'` pour un code BCP-47. |
| `applyDirection(lng, element?)` | Définit l'attribut `dir` sur `document.documentElement`. |
| `getUILanguageLabel(lang, t)` | Libellé d'affichage pour une ligne de menu de langue (avec i18n). |
| `getUILanguageLabelNative(lang)` | Libellé d'affichage sans appel à `t()` (style en-tête). |
| `interpolateTemplate(str, vars)` | Substitution bas niveau `{{var}}` sur une chaîne simple (utilisée en interne ; le code applicatif devrait utiliser `t()` à la place). |
| `flipUiArrowsForRtl(text, isRtl)` | Inverse `→` en `←` pour les mises en page RTL. |

---

## Commandes CLI

```text
ai-i18n-tools version                               Print version and build timestamp
ai-i18n-tools help [command]                        Show global or per-command help (same as -h)
ai-i18n-tools init [-t ui-markdown|ui-docusaurus]   Create config file
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]   Build ui-languages.json from locales + master catalog (needs uiLanguagesPath)
ai-i18n-tools extract                               Merge scanner output, optional package.json description, optional manifest englishName into strings.json
ai-i18n-tools translate-docs [--locale <code>]      Translate documentation (markdown, JSON); see docs for
                                                    --force-update, --force, --stats, --clear-cache,
                                                    --prompt-format (xml | json-array | json-object)
ai-i18n-tools translate-svg [--locale <code>]       Standalone SVG assets (features.translateSVG + config.svg); see --no-cache
ai-i18n-tools translate-ui [--locale <code>]        Translate UI strings only; see --force, --dry-run
ai-i18n-tools export-ui-xliff [--locale <code>]     Export UI strings to XLIFF 2.0 (one file per locale); see --untranslated-only, -o
ai-i18n-tools sync                                  Extract UI strings, then translate UI strings, SVG, and docs
ai-i18n-tools status [--max-columns <n>]   UI strings per locale; markdown per file × locale in tables of up to n locales (default 9)
ai-i18n-tools editor                                Open cache/glossary web editor
ai-i18n-tools cleanup [--dry-run] [--no-backup] [--backup <path>]   Runs sync --force-update, then cleans stale + orphaned cache rows; backs up SQLite by default
ai-i18n-tools glossary-generate                     Create empty glossary CSV template
```

Options globales pour chaque commande : `-c <config>` (par défaut : `ai-i18n-tools.config.json`), `-v` (mode verbeux), `-w` / `--write-logs [path]` facultatifs pour rediriger la sortie console vers un fichier journal (par défaut : dans le répertoire du cache de traduction), `-V` / `--version`, et `-h` / `--help`. Consultez [Démarrage](docs/GETTING_STARTED.fr.md#cli-reference) pour les indicateurs propres à chaque commande.

---

## Documentation

- [Démarrage](docs/GETTING_STARTED.fr.md) - guide complet de configuration pour les deux flux de travail, référence CLI et référence des champs de configuration.
- [Aperçu du package](docs/PACKAGE_OVERVIEW.fr.md) - architecture, composants internes, API programmatique et points d'extension.
- [Contexte de l'agent IA](../docs/ai-i18n-tools-context.md) - **pour les applications utilisant le package :** invites d'intégration destinées aux projets en aval (à copier dans les règles d'agent de votre dépôt).
- Composants internes pour la maintenance de **ce** dépôt : `dev/package-context.md` (clone uniquement ; non publié sur npm).

---

## Licence

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br)
