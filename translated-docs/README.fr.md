<a id="ai-i18n-tools"></a>
# ai-i18n-tools

[![Version de npm](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![Téléchargements de npm](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/)
[![Licence : MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

CLI et toolkit pour l'internationalisation d'applications JavaScript/TypeScript et de sites de documentation. Extrait les chaînes d'interface utilisateur, les traduit à l'aide de grands modèles linguistiques via OpenRouter, puis génère des fichiers JSON prêts pour les paramètres régionaux utilisés par i18next. Inclut également des pipelines pour le markdown, les fichiers JSON Docusaurus et les ressources SVG autonomes.

<small>**Lire dans d'autres langues :** </small>
<small id="lang-list">[English (GB)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [中文 (中国大陆)](./README.zh-CN.md) · [中文 (台灣)](./README.zh-TW.md)</small>

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table des matières**

- [Deux flux de travail principaux](#two-core-workflows)
- [Installation](#installation)
  - [Utilisation de l'interface en ligne de commande (CLI)](#using-the-cli)
- [OpenRouter](#openrouter)
- [Démarrage rapide](#quick-start)
  - [Flux de travail 1 - Chaînes d'interface utilisateur](#workflow-1---ui-strings)
  - [Flux de travail 2 - Documentation](#workflow-2---documentation)
  - [Les deux flux de travail](#both-workflows)
- [Aides au runtime](#runtime-helpers)
- [Commandes CLI](#cli-commands)
- [Documentation](#documentation)
- [Licence](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="two-core-workflows"></a>
## Deux flux de travail principaux

**Flux de travail 1 - Traduction de l'interface utilisateur** (React, Next.js, Node.js, tout projet utilisant i18next)

Construit un catalogue principal (`strings.json` avec des métadonnées optionnelles par langue `models`) à partir des **littéraux** `t("…")` / `i18n.t("…")`, éventuellement `package.json` `description`, et éventuellement chaque `englishName` provenant de `ui-languages.json` lorsque cette fonction est activée dans la configuration. Traduit les entrées manquantes par langue via OpenRouter et génère des fichiers JSON plats (`de.json`, `pt-BR.json`, …) prêts à être utilisés avec i18next.

**Flux de travail 2 - Traduction de la documentation** (Markdown, JSON Docusaurus)

Traduit les contenus `.md` et `.mdx` de chaque bloc `documentations` provenant de `contentPaths`, ainsi que les fichiers JSON d'étiquettes issus du bloc `jsonSource` lorsque cette fonction est activée. Prend en charge les structures de dossiers par bloc au style Docusaurus ou à plat avec suffixe de langue (`documentations[].markdownOutput`). Un fichier `cacheDir` racine partagé contient le cache SQLite afin que seuls les segments nouveaux ou modifiés soient envoyés au LLM. **SVG :** activez `features.translateSVG`, ajoutez le bloc `svg` au niveau supérieur, puis utilisez `translate-svg` (également exécuté depuis `sync` lorsque les deux sont configurés).

Les deux flux de travail partagent un même fichier `ai-i18n-tools.config.json` et peuvent être utilisés indépendamment ou conjointement. La traduction autonome des fichiers SVG utilise `features.translateSVG` ainsi que le bloc `svg` au niveau supérieur, et s'exécute via `translate-svg` (ou l'étape SVG incluse dans `sync`).

---

<a id="installation"></a>
## Installation

Le package publié est uniquement en format **ESM** (`"type": "module"`). Utilisez `import` depuis Node.js, des outils de regroupement ou `import()` — `require('ai-i18n-tools')` **n'est pas pris en charge.** Le package déclare `engines.node`  `>=22.16.0` ; les anciennes versions de Node.js ne sont pas prises en charge.

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
```

### Utilisation de l'interface en ligne de commande

**Par projet (recommandé)** — installez en tant que dépendance ou dépendance de développement, puis appelez via `npx`, `pnpm exec` ou un script `package.json` :

```bash
pnpm add -D ai-i18n-tools     # or: npm i -D ai-i18n-tools
npx ai-i18n-tools sync        # or: pnpm exec ai-i18n-tools sync
```

```json
"scripts": {
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate": "ai-i18n-tools translate-docs"
}
```

Le gestionnaire de paquets écrit `node_modules/.bin/ai-i18n-tools` avec les autorisations correctes sous Linux et macOS, et crée des shim `.cmd` / `.ps1` sous Windows ; les exécuteurs de scripts les détectent automatiquement.

**En mode brut** `ai-i18n-tools` **dans le terminal :** `package.json` les scripts s'exécutent déjà avec `node_modules/.bin` sur `PATH`, donc des commandes comme `pnpm run i18n:sync` appellent l'interface en ligne de commande sans avoir à taper `npx`. Pour exécuter `ai-i18n-tools` directement dans un interpréteur de commandes interactif (depuis la racine du projet, après une installation locale), ajoutez le répertoire binaire local à `PATH` :

```bash
# bash/zsh — project root
export PATH="$PWD/node_modules/.bin:$PATH"
ai-i18n-tools sync
```

```powershell
# Windows PowerShell — project root
$env:Path = "$PWD\node_modules\.bin;$env:Path"
ai-i18n-tools sync
```

Avec [**direnv**](https://direnv.net/), ajoutez `PATH_add node_modules/.bin` à un `.envrc` situé à la racine du projet afin que la commande simple soit disponible après être entré `cd` dans le dépôt. Sans modifier `PATH`, continuez à utiliser `npx ai-i18n-tools …` ou `pnpm exec ai-i18n-tools …`.

**Exécution unique sans installation** — `npx ai-i18n-tools <cmd>` ou `pnpm dlx ai-i18n-tools <cmd>` (télécharge le package pour cet appel ; aucune entrée dans `package.json`).

Sous Linux, macOS et WSL, les installations depuis le registre définissent automatiquement le bit d'exécution sur le script CLI. Sous Windows, les gestionnaires de paquets génèrent des shim `.cmd` et `.ps1` qui invoquent explicitement Node.

Définissez votre clé API OpenRouter :

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

<a id="openrouter"></a>
## OpenRouter

Les commandes qui appellent OpenRouter (`translate-ui`, `translate-docs`, `sync`, `check-models` et les scripts associés) nécessitent la présence de `OPENROUTER_API_KEY` dans l'environnement. `check-markdown` n'utilise pas OpenRouter.

Dans `ai-i18n-tools.config.json`, l'objet `openrouter` inclut les listes de modèles, `baseUrl`, `maxTokens`, `temperature` et `requestTimeoutMs` : le temps maximal, en millisecondes, d'attente pour chaque requête HTTP vers OpenRouter (génération de conversations et appels internes `GET /models`). La valeur par défaut est `30000` (30 secondes).

Exécutez `ai-i18n-tools check-models` pour vérifier chaque identifiant de modèle configuré par rapport au catalogue en direct d'OpenRouter. Il signale les identifiants qui manquent ou qui sont dépassés `expiration_date`, liste les modèles valides avec une estimation des prix d'entrée/sortie (USD par 1M de tokens) et se termine avec un statut non nul lorsque tout identifiant configuré est invalide. Il nécessite `OPENROUTER_API_KEY`.

---

<a id="quick-start"></a>
## Démarrage rapide

<a id="workflow-1---ui-strings"></a>
### Flux de travail 1 - Chaînes d'interface

```bash
# 1. Create config
npx ai-i18n-tools init

# 2. Extract UI strings to strings.json (t(…) literals + optional package.json / manifest strings)
npx ai-i18n-tools extract

# 3. Translate to all target locales
npx ai-i18n-tools translate-ui
```

Intégrez i18next dans votre application en utilisant les utilitaires fournis par `'ai-i18n-tools/runtime'` :

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

<a id="workflow-2---documentation"></a>
### Flux de travail 2 - Documentation

```bash
# 1. Create config for Docusaurus
npx ai-i18n-tools init -t ui-docusaurus

# 2. Translate all docs
npx ai-i18n-tools translate-docs

# 3. Check status
npx ai-i18n-tools status
```

<a id="both-workflows"></a>
### Les deux flux de travail

```bash
npx ai-i18n-tools sync   # Extract UI strings, then translate UI strings, SVG, and docs
```

---

<a id="runtime-helpers"></a>
## Aides au moment de l'exécution

Les utilitaires suivants sont exportés depuis `'ai-i18n-tools/runtime'` et fonctionnent dans n'importe quel environnement JavaScript. Vous n'avez pas besoin d'importer i18next pour les utiliser :

| Aide | Description |
|---|---|
| `defaultI18nInitOptions(sourceLocale)` | Options d'initialisation i18next standard pour les configurations clé-comme-valeur-par-défaut. |
| `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` | Connexion recommandée : suppression des clés + pluriel `wrapT` à partir de `strings.json`, fusionne éventuellement les clés plurielles `translate-ui` `{sourceLocale}.json`. |
| `wrapI18nWithKeyTrim(i18n)` | Enrobage bas niveau uniquement pour la suppression des clés (obsolète pour la connexion applicative ; privilégier `setupKeyAsDefaultT`). |
| `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, makeLoader)` | Construit la table `localeLoaders` pour `makeLoadLocale` à partir de `ui-languages.json` (chaque `code` sauf `sourceLocale`). |
| `makeLoadLocale(i18n, loaders, sourceLocale)` | Fabrique pour le chargement asynchrone des fichiers de langue. |
| `getTextDirection(lng)` | Renvoie `'ltr'` ou `'rtl'` pour un code BCP-47. |
| `applyDirection(lng, element?)` | Définit l'attribut `dir` sur `document.documentElement`. |
| `getUILanguageLabel(lang, t)` | Libellé d'affichage pour une ligne de menu de langue (avec i18n). |
| `getUILanguageLabelNative(lang)` | Libellé d'affichage sans appel à `t()` (style en-tête). |
| `interpolateTemplate(str, vars)` | Substitution `{{var}}` bas niveau sur une chaîne simple (utilisée en interne ; le code applicatif devrait utiliser `t()` à la place). |
| `flipUiArrowsForRtl(text, isRtl)` | Inverse `→` en `←` pour les dispositions RTL. |

---

<a id="cli-commands"></a>
## Commandes CLI

```text
ai-i18n-tools version                               Print version and build timestamp
ai-i18n-tools help [command]                        Show global or per-command help (same as -h)
ai-i18n-tools init [-t ui-markdown|ui-docusaurus] [-o path] [--with-translate-ignore]   Create config file
ai-i18n-tools check-models                          Validate configured OpenRouter model ids against GET /models (pricing, expiration); requires OPENROUTER_API_KEY
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]   Build ui-languages.json from locales + master catalog (needs uiLanguagesPath)
ai-i18n-tools extract                               Merge scanner output, optional package.json description, optional manifest englishName into strings.json
ai-i18n-tools translate-docs [--locale <code>]      Translate documentation (markdown, JSON); see docs for
                                                    --force-update, --force, --stats, --clear-cache,
                                                    --prompt-format (xml | json-array | json-object)
ai-i18n-tools write-heading-ids …                   Insert HTML anchor lines before ATX headings in .md/.mdx (documentations[])
ai-i18n-tools strip-md-bold-inline …              Remove bold (**) around inline code in markdown/MDX (documentations[])
ai-i18n-tools check-markdown [-p|--path <path>] [--json] [--no-cache]   Scan documentation markdown for delimiter / inline-code issues and strong-outside-code or strong-outside-link patterns; refresh SQLite markdown_source_issues; exit 1 if any issue
ai-i18n-tools translate-svg [--locale <code>]       Standalone SVG assets (features.translateSVG + config.svg); see --no-cache
ai-i18n-tools translate-ui [--locale <code>]        Translate UI strings only; see --force, --dry-run
ai-i18n-tools lint-source …                         Run extract, then LLM review of source-locale UI strings (OpenRouter)
ai-i18n-tools export-ui-xliff [--locale <code>]     Export UI strings to XLIFF 2.0 (one file per locale); see --untranslated-only, -o
ai-i18n-tools sync                                  Extract UI strings, then translate UI strings, SVG, and docs
ai-i18n-tools status [--max-columns <n>]   UI strings per locale; markdown per file × locale in tables of up to n locales (default 9)
ai-i18n-tools statistics [--max-columns <n>]        Documentation cache + strings.json aggregates (same as editor Statistics)
ai-i18n-tools editor                                Open cache/glossary web editor
ai-i18n-tools cleanup [--dry-run] [--no-backup] [--backup <path>]   Runs sync --force-update, then cleans stale + orphaned cache rows; backs up SQLite by default
ai-i18n-tools clean-temp [-r|--root <path>] [-f|--force] [--dry-run]   List *.log and cache.db.backup*.sqlite; delete after `y`, with `-f`, or skip if none match
ai-i18n-tools glossary-generate                     Create empty glossary CSV template
```

Options globales pour chaque commande : `-c <config>` (par défaut : `ai-i18n-tools.config.json`), `-v` (mode verbeux), optionnel `-w` / `--write-logs [path]` pour rediriger la sortie console vers un fichier journal (par défaut : dans le répertoire du cache de traduction), `-V` / `--version`, et `-h` / `--help`. Voir [Bien démarrer](docs/GETTING_STARTED.fr.md#cli-reference) pour les indicateurs spécifiques à chaque commande.

---

<a id="documentation"></a>
## Documentation

- [Bien démarrer](docs/GETTING_STARTED.fr.md) - guide complet de configuration pour les deux flux de travail, référence CLI et référence des champs de configuration.
- [Aperçu du package](docs/PACKAGE_OVERVIEW.fr.md) - architecture, composants internes, API programmatique et points d'extension.
- [Contexte Agent IA](../docs/ai-i18n-tools-context.md) - **pour les applications utilisant le package :** invites d'intégration pour projets en aval (à copier dans les règles d'agent de votre dépôt).
- Composants internes pour les mainteneurs de **ce** dépôt : `dev/package-context.md` (clone uniquement ; non publié sur npm).

---

<a id="license"></a>
## Licence

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br)
