<a id="ai-i18n-tools"></a>
# ai-i18n-tools

[![Version de npm](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![Téléchargements de npm](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/)
[![Licence : MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

CLI et toolkit pour l'internalisation d'applications JavaScript/TypeScript et de sites de documentation utilisant des modèles linguistiques de grande taille via [OpenRouter](https://openrouter.ai/). Deux flux de travail indépendants : **Traduction d'interface utilisateur** extrait les appels `t("…")` et génère des fichiers JSON prêts pour i18next ; **Traduction de documents** traduit les fichiers markdown, MDX et SVG avec un cache intelligent SQLite afin que seuls les segments modifiés soient renvoyés au LLM.

<small>**Lire dans d'autres langues :** </small>
<small id="lang-list">[English (GB)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [中文 (中国大陆)](./README.zh-CN.md) · [中文 (台灣)](./README.zh-TW.md)</small>

<small>Les README et documents traduits sont soumis sous [`translated-docs/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/translated-docs) sur GitHub ; le package npm distribue uniquement le `docs/` en anglais.</small>

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table des matières**

- [Deux flux de travail principaux](#two-core-workflows)
- [Installation](#installation)
  - [Utilisation de l'interface en ligne de commande (CLI)](#using-the-cli)
- [OpenRouter](#openrouter)
- [Démarrage rapide](#quick-start)
  - [Flux de travail 1 - Traduction d'interface utilisateur](#workflow-1---ui-translation)
  - [Flux de travail 2 - Traduction de documents](#workflow-2---document-translation)
  - [Les deux flux de travail](#both-workflows)
- [Aides au runtime](#runtime-helpers)
- [Commandes CLI](#cli-commands)
- [Documentation](#documentation)
- [Licence](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="two-core-workflows"></a>
## Deux flux de travail principaux

**Flux de travail 1 - Traduction d'interface utilisateur** — pour tout projet JS/TS utilisant i18next (React, Next.js, Node.js, CLIs)

Analyse les fichiers sources à la recherche de littéraux `t("…")` / `i18n.t("…")`, construit un catalogue maître (`strings.json`), traduit les entrées manquantes par langue via OpenRouter, puis génère des fichiers JSON plats (`de.json`, `pt-BR.json`, etc.) prêts à être utilisés avec i18next.

**Flux de travail 2 - Traduction de documents** — pour la documentation en markdown/MDX (Docusaurus, Astro Starlight, fichiers README simples)

Traduit les fichiers sources `.md` et `.mdx` dans chaque langue cible en utilisant un cache SQLite partagé — seuls les segments nouveaux ou modifiés sont envoyés au LLM. Un fichier JSON optionnel pour Docusaurus (`jsonSource`, issu de `write-translations`) couvre les chaînes d'interface comme la barre de navigation, le pied de page et les éléments du thème. La traduction des fichiers SVG est activée via `features.translateSVG` et le bloc `svg` au niveau racine.

Les deux flux de travail partagent un seul fichier `ai-i18n-tools.config.json` et peuvent être utilisés indépendamment ou ensemble.

---

<a id="installation"></a>
## Installation

Le package publié est uniquement en format **ESM** (`"type": "module"`). Node.js `>=22.16.0` requis.

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
```

<a id="using-the-cli"></a>
### Utilisation de l'interface en ligne de commande (CLI)

**Par projet (recommandé)** — installer comme dépendance de développement, puis exécuter via `npx`, `pnpm exec`, ou un script `package.json` :

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

**Exécution unique sans installation** — utiliser `npx ai-i18n-tools <cmd>` ou `pnpm dlx ai-i18n-tools <cmd>` (téléchargement uniquement pour cette exécution).

> **Astuce :** Pour exécuter `ai-i18n-tools` directement dans un shell interactif sans `npx`, ajouter `node_modules/.bin` à votre `PATH` (bash/zsh : `export PATH="$PWD/node_modules/.bin:$PATH"`). Voir [Bien démarrer](docs/GETTING_STARTED.fr.md#installation) pour les instructions concernant direnv et Windows.

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

<a id="workflow-1---ui-translation"></a>
### Flux de travail 1 - Traduction d'interface utilisateur

```bash
# 1. Create config
npx ai-i18n-tools init

# 2. Extract UI strings to strings.json
npx ai-i18n-tools extract

# 3. Translate to all target locales
npx ai-i18n-tools translate-ui
```

Ensuite, configurez i18next dans votre application en utilisant les utilitaires fournis par `'ai-i18n-tools/runtime'`. Consultez [Étape 4 : Configurer i18next au moment de l'exécution](docs/GETTING_STARTED.fr.md#step-4-wire-i18next-at-runtime) dans le guide de démarrage pour la configuration complète.

<a id="workflow-2---document-translation"></a>
### Flux de travail 2 - Traduction de documents

```bash
# 1. Create config for Docusaurus
npx ai-i18n-tools init -t ui-docusaurus
# Astro Starlight: npx ai-i18n-tools init -t ui-starlight

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

| Assistant                                                              | Description                                                                                                                            |
|------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| `defaultI18nInitOptions(sourceLocale)`                                 | Options d'initialisation standard d'i18next pour les configurations clé-comme-valeur-par-défaut.                                       |
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

```bash
ai-i18n-tools version
ai-i18n-tools help [command]
ai-i18n-tools init [-t ui-markdown|ui-docusaurus] [-o path] [--with-translate-ignore]
ai-i18n-tools check-models
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]
ai-i18n-tools extract
ai-i18n-tools translate-docs …
ai-i18n-tools write-heading-ids …
ai-i18n-tools strip-md-bold-inline …
ai-i18n-tools check-markdown [-p|--path <path>] [--json] [--no-cache]
ai-i18n-tools translate-svg …
ai-i18n-tools translate-ui …
ai-i18n-tools lint-source …
ai-i18n-tools export-ui-xliff …
ai-i18n-tools sync …
ai-i18n-tools status [--max-columns <n>]
ai-i18n-tools statistics [--max-columns <n>]
ai-i18n-tools dashboard
ai-i18n-tools cleanup [--dry-run] [--no-backup] [--backup <path>]
ai-i18n-tools clean-temp [-r|--root <path>] [-f|--force] [--dry-run]
ai-i18n-tools glossary-generate
```

Les listes complètes des options par commande sont disponibles dans [Bien démarrer — Référence CLI](docs/GETTING_STARTED.fr.md#cli-reference). Exécutez `ai-i18n-tools <command> --help` pour afficher l'aide intégrée.

Options globales disponibles pour chaque commande : `-c <config>` (par défaut : `ai-i18n-tools.config.json`), `-v` (mode verbeux), `-w` / `--write-logs [path]` (facultatif) pour rediriger la sortie console vers un fichier journal (par défaut : dans le répertoire du cache de traduction), `-V` / `--version`, ainsi que `-h` / `--help`. Consultez [Bien démarrer](docs/GETTING_STARTED.fr.md#cli-reference) pour le tableau de présentation des commandes.

---

<a id="documentation"></a>
## Documentation

- [Bien démarrer](docs/GETTING_STARTED.fr.md) - guide complet de configuration pour les deux flux de travail, référence CLI et référence des champs de configuration.
- [Guide des ressources par langue](docs/LOCALE-ASSETS-GUIDE.fr.md) - captures d'écran et SVG illustrés dans les documents traduits (schémas A–E, réécriture automatique des liens, scripts de captures).
- [Aperçu du package](docs/PACKAGE_OVERVIEW.fr.md) - architecture, composants internes, API programmatique et points d'extension.
- [Contexte pour agents IA](../docs/ai-i18n-tools-context.md) - **pour les applications utilisant ce package :** invites d'intégration destinées aux projets consommateurs (à copier dans les règles d'agent de votre dépôt).
- Composants internes pour la maintenance de **ce** dépôt : `dev/package-context.md` (réservé au clonage ; non publié sur npm).

---

<a id="license"></a>
## Licence

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br)
