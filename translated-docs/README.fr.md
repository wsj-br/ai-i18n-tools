<a id="ai-i18n-tools"></a>
# ai-i18n-tools

[![Version de npm](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![Téléchargements de npm](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/)
[![Licence : MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

Un CLI et une boîte à outils pour l'internationalisation des applications JavaScript/TypeScript et des sites de documentation à l'aide de grands modèles linguistiques. Il fonctionne avec [OpenRouter](https://openrouter.ai/) et tout fournisseur compatible OpenAI (OpenAI, Anthropic, Gemini, DeepSeek, Groq, Mistral, xAI, Cerebras, NVIDIA, Alibaba, APIFUN, Ollama, et plus encore). Trois flux de travail modulaires, partageant tous un seul fichier de configuration, prennent en charge différents besoins de traduction :

- **Flux de travail 1 — Traduction de l'interface utilisateur :** extrait les appels `t("…")` depuis JS/TS (et éventuellement depuis les fichiers `.astro`) et génère un JSON plat par langue pour i18next ou une recherche SSG statique.
- **Flux de travail 2 — Traduction de documents :** traduit les pages markdown, MDX et `.astro` (pour sites web et Starlight) listées dans `docs[].contentPaths` à l'aide de `translate-docs`.
- **Flux de travail 3 — Traduction de fichiers JSON :** traduit des bundles JSON arbitraires imbriqués définis dans `json[]`. Utilisez `translate-json` lorsque le texte de l'interface est stocké dans des fichiers JSON par langue au lieu d'utiliser `t()` dans le code source.

Les ressources **SVG** sont traduites à l'aide de `features.translateSVG`, du bloc `svg` de niveau supérieur et de `translate-svg` — et non de `docs[].contentPaths`.

**Quel flux de travail dois-je utiliser ?**
- Le code source utilise `t()` → **Flux de travail 1** (`extract` / `translate-ui`)
- Pages localisées ou JSON de catalogue Docusaurus → **Flux de travail 2** (`translate-docs`)
- Uniquement des fichiers de langue JSON autonomes et imbriqués → **Flux de travail 3** (`translate-json`)

Tous les flux de travail conservent un cache fichier/SQLite afin de garantir que seuls les segments nouveaux ou modifiés (chaînes ou blocs de texte) sont envoyés au LLM.

<small>**Lire dans d'autres langues :** </small>
<small id="lang-list">[English (UK)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [Hindi (Roman)](./README.hi-Latn.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md)</small>

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table des matières**

- [Flux de travail principaux](#core-workflows)
- [Installation](#installation)
  - [Utilisation du CLI](#using-the-cli)
- [Fournisseurs LLM](#openrouter)
- [Démarrage rapide](#quick-start)
  - [Flux de travail 1 - Traduction de l'interface utilisateur](#workflow-1---ui-translation)
  - [Flux de travail 2 - Traduction de documents](#workflow-2---document-translation)
  - [Astro (Astro classique et Starlight)](#astro-plain-astro--starlight)
  - [Flux de travail combiné](#combined-workflow)
- [Aides à l'exécution](#runtime-helpers)
- [Commandes CLI](#cli-commands)
- [Documentation](#documentation)
- [Licence](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="core-workflows"></a>
## Flux de travail principaux

**Flux de travail 1 - Traduction de l'interface utilisateur** — pour tout projet JS/TS utilisant i18next (React, Next.js, Node.js, CLIs) ou Astro SSG statique

Analyse les fichiers sources à la recherche de littéraux `t("…")` / `i18n.t("…")` (ajoutez `.astro` à `ui.uiExtractor.extensions` pour les frontmatter et expressions de modèle Astro), construit un catalogue maître (`strings.json`), traduit les entrées manquantes par langue via OpenRouter, puis génère des fichiers JSON plats (`de.json`, `pt-BR.json`, etc.). Le texte source en anglais sert de clé de recherche au moment de l'exécution dans ces lots — `strings.json` est le cache d'extraction, pas le lot utilisé au moment de l'exécution.

**Flux de travail 2 - Traduction de documents** — pour les fichiers markdown, MDX et `.astro` sous `docs[].contentPaths`

Conçu principalement pour la **documentation en markdown, MDX et `.astro`** (Docusaurus, [Astro Starlight](https://starlight.astro.build/), fichiers README simples, pages marketing Astro classiques). `translate-docs` génère des copies localisées avec un cache SQLite partagé. Sur les sites Docusaurus, définissez `docs[].docusaurusCatalogDir` sur le dossier du catalogue `write-translations` afin que le JSON de structure (menu, pied de page, chaînes de thème) soit traduit dans la même commande. `docs[].docsOutput.style` prend en charge `"nested"`, `"flat"`, `"doc-system"` et les alias `"docusaurus"` / `"astro-starlight"` (voir [Dispositions de sortie](docs/GETTING_STARTED.fr.md#output-layouts) dans Démarrage rapide). Les fichiers JSON imbriqués arbitraires pour l'interface utilisateur qui ne sont pas un catalogue Docusaurus relèvent du flux de travail 3 (`json[]` / `translate-json`), pas de `docs[]`.

**Flux de travail 3 - Traduction de fichiers JSON** — fichiers JSON localisés imbriqués sans `t()` dans le code source

Traduire des fichiers tels que `src/i18n/en/translation.json` via `json[]` de niveau supérieur, `features.translateJson`, et `translate-json`. Générer la structure avec `init -t ui-json-bundles`.

Tous les flux de travail partagent `ai-i18n-tools.config.json` et peuvent être combinés ; `sync` exécute l'extraction, la traduction de l'interface utilisateur, la traduction SVG, `translate-docs` et `translate-json` dans l'ordre selon vos indicateurs `features`.

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
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:translate:json": "ai-i18n-tools translate-json",
  "i18n:translate": "ai-i18n-tools translate-docs",
  "i18n:dashboard": "ai-i18n-tools dashboard"
}
```

Vous pouvez également utiliser directement les commandes CLI ai-i18n-tools, par exemple `ai-i18n-tools sync`.

Préférez `sync` plutôt que d'enchaîner manuellement `extract`, `translate-ui`, `translate-svg`, `translate-docs` et `translate-json` — l'ordre et les indicateurs de fonctionnalités sont faciles à mal configurer lorsqu'ils sont exécutés manuellement. Voir [Scripts `package.json` recommandés](docs/GETTING_STARTED.fr.md#recommended-packagejson-scripts) dans Démarrage rapide.

**Exécution unique sans installation** — utiliser `npx ai-i18n-tools <cmd>` ou `pnpm dlx ai-i18n-tools <cmd>` (téléchargement uniquement pour cette exécution).

> **Astuce :** Pour exécuter `ai-i18n-tools` directement dans un shell interactif sans `npx`, ajouter `node_modules/.bin` à votre `PATH` (bash/zsh : `export PATH="$PWD/node_modules/.bin:$PATH"`). Voir [Bien démarrer](docs/GETTING_STARTED.fr.md#installation) pour les instructions concernant direnv et Windows.

Définissez votre clé API du fournisseur (OpenRouter montré ; utilisez la variable correspondante pour votre fournisseur) :

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

<a id="openrouter"></a>
## Fournisseurs LLM

Les commandes de traduction (`translate-ui`, `translate-docs`, `translate-json`, `sync`, `check-models`, et scripts associés) appellent un fournisseur LLM ; `check-markdown` ne le fait pas.

Configurez les fournisseurs sous une carte de niveau supérieur `providers` et choisissez celui actif avec un sélecteur de niveau supérieur `provider` (facultatif lorsqu'un seul fournisseur est configuré). La plupart des fournisseurs n'ont besoin que d'une liste `translationModels` — `baseUrl` et la variable d'environnement de la clé API proviennent d'un préréglage intégré ; vous pouvez remplacer `baseUrl`, `apiKeyEnv`, `headers`, `maxTokens`, `temperature`, et `requestTimeoutMs` par fournisseur. `requestTimeoutMs` est le temps maximum en millisecondes à attendre pour chaque requête (par défaut `30000`).

Pour changer de fournisseur pour une seule exécution sans modifier la configuration, passez l'option globale `-P` / `--provider <name>` (par exemple `ai-i18n-tools -P groq translate-ui`) ; le nom doit être l'une des clés `providers` configurées.

```jsonc
{
  "provider": "openrouter",
  "providers": {
    "openrouter": { "translationModels": ["qwen/qwen3-235b-a22b-2507", "openai/gpt-4o-mini"] },
    "groq": { "translationModels": ["llama-3.3-70b-versatile"] },
    "ollama": { "baseUrl": "http://localhost:11434/v1", "translationModels": ["llama3.2"] }
  }
}
```

Préréglages de fournisseurs intégrés (clé — URL de base — variable d'environnement de la clé API) :

| Fournisseur | URL de base | Variable d'environnement de la clé API |
| --- | --- | --- |
| `openrouter` | `https://openrouter.ai/api/v1` | `OPENROUTER_API_KEY` |
| `openai` | `https://api.openai.com/v1` | `OPENAI_API_KEY` |
| `anthropic` | `https://api.anthropic.com/v1` | `ANTHROPIC_API_KEY` |
| `gemini` | `https://generativelanguage.googleapis.com/v1beta/openai` | `GOOGLE_API_KEY` |
| `deepseek` | `https://api.deepseek.com` | `DEEPSEEK_API_KEY` |
| `cerebras` | `https://api.cerebras.ai/v1` | `CEREBRAS_API_KEY` |
| `groq` | `https://api.groq.com/openai/v1` | `GROQ_API_KEY` |
| `mistral` | `https://api.mistral.ai/v1` | `MISTRAL_API_KEY` |
| `xai` | `https://api.x.ai/v1` | `XAI_API_KEY` |
| `nvidia` | `https://integrate.api.nvidia.com/v1` | `NVIDIA_API_KEY` |
| `alibaba` | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` | `ALIBABA_API_KEY` |
| `apifun` | `https://api.apikey.fun/v1` | `APIFUN_API_KEY` |
| `ollama` | `http://localhost:11434/v1` | (aucun) |

Définissez un fournisseur personnalisé compatible avec OpenAI en ajoutant une nouvelle clé avec `baseUrl` (et `apiKeyEnv` sauf si aucune clé n'est nécessaire). Les identifiants de modèle sont des identifiants directs en amont — le fournisseur est choisi au niveau de la configuration, donc aucun préfixe `provider/` n'est nécessaire (les identifiants OpenRouter conservent leur forme native `vendor/model`).

L'utilisation des jetons est signalée pour chaque fournisseur ; le coût exact en USD n'est affiché que lorsque le fournisseur le renvoie (OpenRouter). `ai-i18n-tools check-models` valide les identifiants de modèle configurés par rapport à la liste `GET /models` active du fournisseur (n'importe quel fournisseur), et affiche la tarification lorsque le fournisseur la renvoie (par ex. OpenRouter). `ai-i18n-tools list-models` liste tous les modèles annoncés par le fournisseur actif (utilisez `-P` / `--provider` pour inspecter un autre fournisseur configuré).

Un bloc de configuration de niveau supérieur hérité `openrouter` est toujours accepté et est automatiquement migré vers `providers.openrouter` (avec `provider: "openrouter"`) au chargement.

Pour une démonstration pratique du changement de fournisseur avec `-P` sur un seul document, consultez [`examples/multi-provider`](../examples/multi-provider/) (une configuration avec `openai`, `anthropic`, `nvidia` et `deepseek`).

---

<a id="quick-start"></a>
## Démarrage rapide

<a id="workflow-1---ui-translation"></a>
### Flux de travail 1 - Traduction d'interface utilisateur

```bash
# 1. Create config (default ui-markdown; plain Astro: init -t ui-astro-website)
npx ai-i18n-tools init

# 2. Extract UI strings to strings.json
npx ai-i18n-tools extract

# 3. Translate to all target locales
npx ai-i18n-tools translate-ui
```

Ensuite, configurez i18next dans votre application en utilisant les utilitaires fournis par `'ai-i18n-tools/runtime'`. Consultez [Étape 4 : Configurer i18next au moment de l'exécution](docs/GETTING_STARTED.fr.md#step-4-wire-i18next-at-runtime) dans le guide de démarrage pour la configuration complète.

<a id="workflow-2---document-translation"></a>
### Flux de travail 2 - Traduction de documents

Le modèle `init` par défaut (`ui-markdown`) active uniquement l'extraction de l'interface. Utilisez un modèle orienté documentation (ou activez `features.translateDocs` et ajoutez `docs[]`) avant `translate-docs` :

```bash
# Docusaurus docs + optional write-translations catalog
npx ai-i18n-tools init -t ui-docusaurus

# Astro Starlight documentation
# npx ai-i18n-tools init -t ui-starlight

# Plain Astro website — UI extraction for t() in .astro; add docs[] for page HTML (see Astro below)
# npx ai-i18n-tools init -t ui-astro-website

npx ai-i18n-tools translate-docs
npx ai-i18n-tools status
# npx ai-i18n-tools translate-docs --locale de   # single locale
```

Modifiez `ai-i18n-tools.config.json` : définissez `docs[].contentPaths` sur les sources markdown, MDX et/ou `.astro` ; `docs[].outputDir` et `docs[].docsOutput.style` (`"docusaurus"`, `"astro-starlight"`, `"flat"`, etc.). Référence complète des champs : [Flux de travail 2 - Traduction de documents](docs/GETTING_STARTED.fr.md#workflow-2---document-translation).

<a id="astro-plain-astro--starlight"></a>
### Astro (Astro classique et Starlight)

**Astro Starlight** — `init -t ui-starlight`, puis `translate-docs`. Les remplacements d’interface utilisateur Starlight peuvent utiliser `src/content/i18n/en.json` avec `jsonPathTemplate` dans un bloc `docs[]` séparé si nécessaire ([Démarrage → Workflow 2](docs/GETTING_STARTED.fr.md#step-1-initialise-for-documentation)).

**Astro classique** (sites marketing ou applicatifs, non Starlight) — combiner le [routage i18n intégré à Astro](https://docs.astro.build/en/guides/internationalization/) avec ai-i18n-tools. Projet de référence : [`examples/astro-website`](../examples/astro-website/) (anglais à `/`, locales dans `/{locale}/`).

La plupart des équipes utilisent un modèle **hybride** combinant deux pipelines :

| Pipeline | À utiliser pour | Commandes | Sortie |
|----------|---------|----------|--------|
| **HTML des pages** | Titres, paragraphes, libellés de navigation, tableaux intégrés dans le corps du modèle | `translate-docs` | Un `src/pages/{locale}/index.astro` par localisation |
| **Chaînes d’interface (`t()`)** | Données frontmatter, libellés d’onglets, tableaux partagés | `extract` → `translate-ui` | `public/locales/{locale}.json` (texte anglais en tant que clé) |

Générez l’interface avec `init -t ui-astro-website`. Pour le HTML en dur dans les pages `.astro`, activez `features.translateDocs` et ajoutez un bloc `docs[]` avec `docsOutput.style: "astro-starlight"` (voir [Pages du site Astro (analyse et remplacement)](docs/GETTING_STARTED.fr.md#astro-website-pages-parse-and-replace)). Gardez `targetLocales`, `i18n.locales` dans `astro.config.mjs` et `ui-languages.json` synchronisés (les routes Astro utilisent des codes en minuscules comme `pt-br` ; les noms de fichiers de bundle plat suivent la casse de la configuration, par ex. `pt-BR.json`).

Connectez `t()` au moment de la construction sans i18next, sauf si vous ajoutez des îlots côté client — voir [Chaînes d’interface du site Astro (SSG)](docs/GETTING_STARTED.fr.md#astro-website-ui-strings-ssg) et le `src/i18n/t.ts` de l’exemple.

<a id="combined-workflow"></a>
### Workflow combiné

```bash
npx ai-i18n-tools sync   # extract → translate-ui → translate-svg → translate-docs → translate-json (per features)
```

---

<a id="runtime-helpers"></a>
## Aides au moment de l'exécution

Les utilitaires suivants sont exportés depuis `'ai-i18n-tools/runtime'` et fonctionnent dans n'importe quel environnement JavaScript. Vous n'avez pas besoin d'importer i18next pour les utiliser :

| Assistant                                                              | Description                                                                                                                            |
|------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| `defaultI18nInitOptions(sourceLocale)`                                 | Options d'initialisation standard d'i18next pour les configurations clé-comme-valeur-par-défaut.                                       |
| `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` | Connexion recommandée : suppression des clés + pluriel `wrapT` à partir de `strings.json`, fusionne éventuellement les clés plurielles `translate-ui` `{sourceLocale}.json`. |
| `wrapT(i18n, options)`                                                 | Enveloppe `t()` de bas niveau prenant en compte le pluriel (généralement installée par `setupKeyAsDefaultT`).                                                    |
| `buildPluralIndexFromStringsJson(entries)`                               | Construit l'index du groupe pluriel utilisé par `wrapT` à partir des lignes du catalogue avec `"plural": true`.                                                    |
| `extractInterpolationNamesForWrap(key)`                                  | Analyse les noms `{{var}}` à partir d'une clé source pour `wrapT` / repli par suppression de clé.                                                              |
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
ai-i18n-tools check-models
ai-i18n-tools list-models
ai-i18n-tools list-languages [search]
ai-i18n-tools init [-t ui-markdown|ui-docusaurus|ui-starlight|ui-astro-website|ui-json-bundles] [-o path] [--with-translate-ignore]
ai-i18n-tools write-heading-ids …
ai-i18n-tools extract
ai-i18n-tools translate-docs …
ai-i18n-tools translate-json …
ai-i18n-tools translate-svg …
ai-i18n-tools translate-ui …
ai-i18n-tools sync-ui …
ai-i18n-tools lint-source …
ai-i18n-tools check-markdown [-p|--path <path>] [-f|--file <path>] [--json] [--no-cache]
ai-i18n-tools export-ui-xliff …
ai-i18n-tools sync …
ai-i18n-tools status …
ai-i18n-tools statistics …
ai-i18n-tools cleanup …
ai-i18n-tools clean-temp …
ai-i18n-tools dashboard …
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]
ai-i18n-tools glossary-generate
ai-i18n-tools help [command]
```

Les listes complètes des options par commande sont disponibles dans [Bien démarrer — Référence CLI](docs/GETTING_STARTED.fr.md#cli-reference). Exécutez `ai-i18n-tools <command> --help` pour afficher l'aide intégrée.

Options globales sur chaque commande : `-c <config>` (par défaut : `ai-i18n-tools.config.json`), `-v` (verbeux), `-P` / `--provider <name>` (remplace le fournisseur LLM actif ; doit être configuré sous `providers`), optionnel `-w` / `--write-logs [path]` pour dupliquer la sortie de la console vers un fichier journal (par défaut : sous le répertoire de cache de traduction), `-V` / `--version`, et `-h` / `--help`. Plusieurs commandes acceptent `-l` / `--locale <codes>` (BCP-47 séparé par des virgules) pour limiter les locales cibles ; `lint-source` utilise une seule locale source. Voir [Démarrage rapide](docs/GETTING_STARTED.fr.md#cli-reference) pour le tableau récapitulatif des commandes.

---

<a id="documentation"></a>
## Documentation

- [Démarrage](docs/GETTING_STARTED.fr.md) - configuration complète pour tous les workflows (interface, docs/`.astro`, bundles JSON, Astro Starlight et Astro classique), référence CLI et référence des champs de configuration.
- [Guide des ressources localisées](docs/LOCALE-ASSETS-GUIDE.fr.md) - illustrations SVG et captures d’écran dans la documentation traduite (modèles A–E, réécriture de liens plats, scripts de captures).
- [Aperçu du package](docs/PACKAGE_OVERVIEW.fr.md) - architecture, composants internes, API programmatique et points d’extension.
- [Contexte de l’agent IA](../docs/ai-i18n-tools-context.md) - **pour les applications utilisant le package :** invites d’intégration pour projets en aval (à copier dans les règles d’agent de votre dépôt).
- Composants internes pour la maintenance de **ce** dépôt : `dev/package-context.md` (réservé au clonage ; non publié sur npm).

---

<a id="license"></a>
## Licence

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br)
