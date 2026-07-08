---
layout: doc
title: ai-i18n-tools
description: >-
  CLI et boîte à outils pour l'internationalisation des applications et des
  sites de documentation JavaScript/TypeScript à l'aide de LLM.
---



# ai-i18n-tools

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

**Traduisez votre application et votre documentation à l'aide du modèle d'IA de votre choix : pas de verrouillage, pas de réécriture.**

`ai-i18n-tools` est un CLI et une boîte à outils pour internationaliser les applications et les sites de documentation JavaScript/TypeScript – y compris Docusaurus, Astro, Starlight, VitePress et Markdown/MDX simple – à l'aide de grands modèles linguistiques.

Pointez-le vers n'importe quel fournisseur et commencez à traduire : **OpenAI**, **Anthropic**, **Google Gemini**, **NVIDIA**, **DeepSeek**, **Groq**, **Mistral**, **xAI**, **Cerebras**, **Alibaba**, **APIFUN**, n'importe quel modèle [OpenRouter](https://openrouter.ai/) (des centaines de choix avec une seule clé API), ou **Ollama** pour une traduction entièrement auto-hébergée et hors ligne. Changez de fournisseur ou de modèle par projet – ou même par langue – sans modifier votre base de code.

Un fichier de configuration pilote trois modes de traduction, vous pouvez donc les combiner en fonction de la structure de votre contenu :

- **Chaînes d'interface utilisateur** — Extrait les appels `t("…")` de JS/TS (et éventuellement des fichiers `.astro`) et génère du JSON plat par locale pour i18next ou une recherche SSG statique.
- **Documents** — Traduit les pages Markdown, MDX et `.astro` listées dans `docs[].contentPaths` à l'aide de `translate-docs`. Fonctionne avec **VitePress**, **Starlight**, **Docusaurus**, les sites basés sur Astro, ou tout générateur de site statique qui lit à partir de fichiers source Markdown/MDX/`.astro`.
- **JSON** — Traduit des paquets JSON imbriqués arbitraires définis dans `json[]`. Utilisez `translate-json` lorsque le texte de l'interface utilisateur se trouve dans des fichiers JSON par locale au lieu d'appels `t()` dans le code source.

Les ressources **SVG** ont leur propre chemin : `features.translateSVG`, le bloc `svg` de niveau supérieur et `translate-svg` – pas `docs[].contentPaths`.

**Lequel dois-je utiliser ?**

| Votre contenu                                                                 | Commande                                    |
|-------------------------------------------------------------------------------|---------------------------------------------|
| Le code source utilise `t()`                                                | **Chaînes d'interface utilisateur** — `extract` / `translate-ui` |
| Pages localisées ou sites de documentation (VitePress, Starlight, Docusaurus, Astro, etc.) | **Documents** — `translate-docs`            |
| Fichiers de locale JSON autonomes et imbriqués                                | **JSON** — `translate-json`                 |

Les trois partagent un cache fichier/SQLite, de sorte que seuls les segments (chaînes ou blocs de texte) nouveaux ou modifiés sont renvoyés au modèle – les réexécutions sont rapides et peu coûteuses, quel que soit le fournisseur que vous utilisez.

<a id="translation-types"></a>
## Types de traduction

Chaque type de traduction possède son propre guide avec les détails de configuration complets : [Chaînes d'interface utilisateur](/guide/ui-strings/), [Documents](/guide/documents/) et [JSON](/guide/json). Consultez [Qu'est-ce que ai-i18n-tools ?](/guide/what-is-ai-i18n-tools) pour une comparaison côte à côte.

Quelques points à connaître d'emblée : les chaînes d'interface utilisateur traduisent les entrées manquantes par locale via le fournisseur LLM actif (voir [Fournisseurs LLM](#llm-providers)) et écrivent des fichiers JSON plats (`de.json`, `pt-BR.json`, …), avec le texte source anglais comme clé de recherche d'exécution — `strings.json` est le cache d'extraction, pas le bundle d'exécution. Les documents prennent en charge les valeurs `docs[].docsOutput.style` `"nested"`, `"flat"`, `"doc-system"`, et les alias `"docusaurus"` / `"astro-starlight"` / `"vitepress"` (voir [Dispositions de sortie](/guide/documents/output-layouts)). Les trois partagent `ai-i18n-tools.config.json` et peuvent être combinés ; `sync` exécute l'extraction, la traduction d'interface utilisateur, la traduction SVG, `translate-docs` et `translate-json` dans l'ordre selon vos drapeaux `features`.

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

Après avoir installé le package dans votre projet, npm/pnpm/yarn lie l'entrée bin publiée (`bin/ai-i18n-tools.mjs`) dans `node_modules/.bin/ai-i18n-tools`. Ce shim charge l'interface de ligne de commande compilée à partir du package installé.

**Scripts `package.json` (recommandé)** — npm et pnpm ajoutent `node_modules/.bin` à `PATH` lors de l'exécution de scripts, vous pouvez donc appeler le nom de commande nu :

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

Ensuite, exécutez par exemple `pnpm run i18n:sync` — aucun préfixe `npx` n'est nécessaire.

**Shell interactif** — depuis la racine de votre projet (après une installation locale) :

```bash
npx ai-i18n-tools sync        # npm
pnpm exec ai-i18n-tools sync  # pnpm
```

Pour taper la commande `ai-i18n-tools` brute dans bash/zsh, ajoutez le répertoire bin local à `PATH` (voir [Utilisation de la CLI](/guide/installation#using-the-cli) pour les notes sur PowerShell, direnv et Windows) :

```bash
export PATH="$PWD/node_modules/.bin:$PATH"
ai-i18n-tools sync
```

Préférez `sync` à l'enchaînement manuel de `extract`, `translate-ui`, `translate-svg`, `translate-docs` et `translate-json` — l'ordre et les indicateurs de fonctionnalité sont faciles à mal configurer lorsqu'ils sont exécutés manuellement. Voir [Scripts `package.json` recommandés](/guide/quick-start#recommended-packagejson-scripts) dans le guide de démarrage rapide.

**Utilisation unique sans installation** — `npx ai-i18n-tools <cmd>` ou `pnpm dlx ai-i18n-tools <cmd>` (télécharge le package pour cette invocation uniquement ; aucune entrée dans `package.json`).

Définissez votre clé API du fournisseur (OpenRouter montré ; utilisez la variable correspondante pour votre fournisseur) :

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

<a id="llm-providers"></a>
## Fournisseurs LLM

Les commandes de traduction (`translate-ui`, `translate-docs`, `translate-json`, `sync`, `check-models`, et scripts associés) appellent un fournisseur LLM ; `check-markdown`, `mark-html`, et `extract` ne le font pas.

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

| Fournisseur | URL de base | Variable d'environnement de clé API |
|--------------|-----------------------------------------------------------|----------------------|
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

L'utilisation des jetons est signalée pour chaque fournisseur ; le coût exact en USD n'est affiché que lorsque le fournisseur le renvoie (OpenRouter). `ai-i18n-tools check-models` valide les ID de modèle configurés par rapport à la liste `GET /models` en direct du fournisseur actif (tout fournisseur), et affiche les prix lorsque le fournisseur les renvoie (par exemple, OpenRouter). `ai-i18n-tools list-models` répertorie tous les modèles annoncés par le fournisseur actif (utilisez `-P` / `--provider` pour inspecter un autre fournisseur configuré). `ai-i18n-tools bench-models` évalue chaque modèle configuré en traduisant un échantillon de manière isolée (les modèles s'exécutent en parallèle, limités par `concurrency`) et affiche les jetons d'entrée/sortie par modèle, le temps réel et le coût en USD.

Un bloc de configuration de niveau supérieur hérité `openrouter` est toujours accepté et est automatiquement migré vers `providers.openrouter` (avec `provider: "openrouter"`) au chargement.

Pour une démonstration pratique du changement de fournisseur avec `-P` sur un seul document, consultez [`examples/multi-provider`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/multi-provider/).

---

<a id="quick-start"></a>
## Démarrage rapide

<a id="ui-strings"></a>
### Chaînes d'interface utilisateur

```bash
# 1. Create config (default ui-markdown; plain Astro: init -t ui-astro-website)
npx ai-i18n-tools init

# 2. Extract UI strings to strings.json
npx ai-i18n-tools extract

# 3. Translate to all target locales
npx ai-i18n-tools translate-ui
```

Ensuite, connectez i18next dans votre application en utilisant les assistants de `'ai-i18n-tools/runtime'`. Voir [Étape 4 : Connecter i18next à l'exécution](/guide/ui-strings/i18next-runtime) dans le guide des chaînes d'interface utilisateur pour la configuration complète.

<a id="documents"></a>
### Documents

Le modèle `init` par défaut (`ui-markdown`) active uniquement l'extraction de l'interface. Utilisez un modèle orienté documentation (ou activez `features.translateDocs` et ajoutez `docs[]`) avant `translate-docs` :

```bash
# Docusaurus docs + optional write-translations catalog
npx ai-i18n-tools init -t ui-docusaurus

# Astro Starlight documentation
# npx ai-i18n-tools init -t ui-starlight

# VitePress documentation (pages + theme JSON)
# npx ai-i18n-tools init -t ui-vitepress

# Plain Astro website — UI extraction for t() in .astro; add docs[] for page HTML (see Astro below)
# npx ai-i18n-tools init -t ui-astro-website

npx ai-i18n-tools translate-docs
npx ai-i18n-tools status
# npx ai-i18n-tools translate-docs --locale de   # single locale
```

Modifiez `ai-i18n-tools.config.json` : définissez `docs[].contentPaths` sur les sources markdown, MDX et/ou `.astro` ; `docs[].outputDir` et `docs[].docsOutput.style` (`"docusaurus"`, `"astro-starlight"`, `"vitepress"`, `"flat"`, etc.). Référence complète des champs : [Documents](/guide/documents/).

<a id="vitepress"></a>
### VitePress

`init -t ui-vitepress` échafaude `docsOutput.style: "vitepress"` plus un bloc `json[]` pour les chaînes de thème/navigation/barre latérale. Exécutez `sync` pour traduire le markdown de la page et `theme.{locale}.json` ensemble. Voir [Intégration VitePress](/guide/vitepress-integration) et [exemples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/).

<a id="astro-plain-astro--starlight"></a>
### Astro (Astro classique et Starlight)

**Astro Starlight** — `init -t ui-starlight`, puis `translate-docs`. Les remplacements d'interface utilisateur Starlight peuvent utiliser `src/content/i18n/en.json` avec `jsonPathTemplate` dans un bloc `docs[]` distinct si nécessaire ([Documents — initialiser pour la documentation](/guide/documents/#step-1-initialise-for-documentation)).

**Astro simple** (sites marketing ou d'applications, pas Starlight) — combinez [le routage i18n intégré d'Astro](https://docs.astro.build/en/guides/internationalization/) avec ai-i18n-tools. Projet de référence : [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) (anglais à `/`, locales à `/{locale}/`).

La plupart des équipes utilisent un modèle **hybride** combinant deux pipelines :

| Pipeline | Utilisation pour | Commandes | Sortie |
|------------------------|----------------------------------------------------------------------|----------------------------|--------------------------------------------------------|
| **HTML de la page** | Titres, paragraphes, étiquettes de navigation, tableaux en ligne dans le corps du modèle | `translate-docs` | `src/pages/{locale}/index.astro` par locale |
| **Chaînes d’interface (`t()`)** | Données frontmatter, libellés d’onglets, tableaux partagés | `extract` → `translate-ui` | `public/locales/{locale}.json` (texte anglais en tant que clé) |

Échafaudez l'interface utilisateur avec `init -t ui-astro-website`. Pour le HTML codé en dur dans les pages `.astro`, activez `features.translateDocs` et ajoutez un bloc `docs[]` avec `docsOutput.style: "astro-starlight"` (voir [Pages de site web Astro (analyse et remplacement)](/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace)). Maintenez `targetLocales`, `i18n.locales` dans `astro.config.mjs` et `ui-languages.json` alignés (les routes Astro utilisent des codes en minuscules tels que `pt-br` ; les noms de fichiers de bundle plats suivent la casse de la configuration, par exemple `pt-BR.json`).

Connectez `t()` au moment de la construction sans i18next, sauf si vous ajoutez des îles clientes — voir [Chaînes d'interface utilisateur de site web Astro (SSG)](/guide/ui-strings/astro-website#astro-website-ui-strings-ssg) et le `src/i18n/t.ts` de l'exemple.

<a id="combined-sync"></a>
### Synchronisation combinée

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
| `extractInterpolationNamesForWrap(key)` | Analyse les noms <code v-pre>{{var}}</code> à partir d'une clé source pour le repli `wrapT` / key-trim. |
| `wrapI18nWithKeyTrim(i18n)` | Enrobage bas niveau uniquement pour la suppression des clés (obsolète pour la connexion applicative ; privilégier `setupKeyAsDefaultT`). |
| `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, makeLoader)` | Construit la table `localeLoaders` pour `makeLoadLocale` à partir de `ui-languages.json` (chaque `code` sauf `sourceLocale`). |
| `makeLoadLocale(i18n, loaders, sourceLocale)` | Fabrique pour le chargement asynchrone des fichiers de langue. |
| `getTextDirection(lng)` | Renvoie `'ltr'` ou `'rtl'` pour un code BCP-47. |
| `applyDirection(lng, element?)` | Définit l'attribut `dir` sur `document.documentElement`. |
| `getUILanguageLabel(lang, t)` | Libellé d'affichage pour une ligne de menu de langue (avec i18n). |
| `getUILanguageLabelNative(lang)` | Libellé d'affichage sans appel à `t()` (style en-tête). |
| `interpolateTemplate(str, vars)` | Substitution <code v-pre>{{var}}</code> de bas niveau sur une chaîne simple (utilisée en interne ; le code de l'application doit utiliser `t()` à la place). |
| `flipUiArrowsForRtl(text, isRtl)` | Inverse `→` en `←` pour les dispositions RTL. |

---

<a id="cli-commands"></a>
## Commandes CLI

```bash
ai-i18n-tools version
ai-i18n-tools check-models
ai-i18n-tools list-models
ai-i18n-tools bench-models [--model <ids>] [--text <text>|--file <path>] [--source <locale>] [--target <locale>]
ai-i18n-tools list-languages [search]
ai-i18n-tools init [-t ui-markdown|ui-docusaurus|ui-starlight|ui-vitepress|ui-astro-website|ui-json-bundles] [-o path] [--with-translate-ignore]
ai-i18n-tools write-heading-ids …
ai-i18n-tools mark-html [paths...] [--write]
ai-i18n-tools extract
ai-i18n-tools translate-docs …
ai-i18n-tools translate-json …
ai-i18n-tools translate-svg …
ai-i18n-tools translate-ui …
ai-i18n-tools sync-ui …
ai-i18n-tools proofread-ui …
ai-i18n-tools check-markdown [-p|--path <path>] [-f|--file <path>] [--json] [--no-cache]
ai-i18n-tools export-ui-xliff …
ai-i18n-tools sync …
ai-i18n-tools status …
ai-i18n-tools statistics …
ai-i18n-tools cleanup …
ai-i18n-tools clean-temp …
ai-i18n-tools purge-locale -l <code> [-l <code> …] [--dry-run] [-y|--yes] [-f|--force] [--keep-files] [--backup <path>]
ai-i18n-tools dashboard …
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]
ai-i18n-tools glossary-generate
ai-i18n-tools help [command]
```

Pour les applications HTML simples, annotez les éléments avec des marqueurs `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` bruts (le texte source est tiré du textContent / titre / placeholder de l'élément, écrit une fois) ; `mark-html` les insère pour vous et `extract` les capture ensuite dans `strings.json`. Voir [Marquage HTML pour la traduction](/guide/ui-strings/plain-html#marking-html-for-translation).

Les listes complètes des drapeaux par commande se trouvent dans [Référence CLI](/reference/cli-commands). Exécutez `ai-i18n-tools <command> --help` pour le texte d'utilisation intégré.

Options globales : `-c <config>` (par défaut : `ai-i18n-tools.config.json`), `-v` (verbeux), `-P` / `--provider <name>` (remplace le fournisseur LLM actif ; doit être configuré sous `providers`), `-L` / `--ui-lang <code>` (langue pour l'interface utilisateur/les journaux de l'outil), `-V` / `--version`, et `-h` / `--help` — acceptées sur chaque commande. `-w` / `--write-logs [path]` redirige la sortie de la console vers un fichier journal (par défaut : sous le répertoire du cache de traduction), mais ne prend effet que sur les commandes de traduction et de synchronisation (`translate-docs`, `translate-json`, `translate-svg`, `translate-ui`, `sync-ui`, `sync`, `cleanup`). Plusieurs commandes acceptent `-l` / `--locale <codes>` (BCP-47 séparé par des virgules) pour limiter les paramètres régionaux cibles ; `proofread-ui` utilise un seul paramètre régional source. Voir [Référence CLI](/reference/cli-commands) pour le tableau d'aperçu des commandes.

<a id="tool-ui-language-logs-help-dashboard"></a>
### Langue de l'interface utilisateur de l'outil (journaux, aide, tableau de bord)

L'outil localise son aide CLI, ses messages de journal/résumé à fort trafic et le tableau de bord de traduction. La locale de l'interface utilisateur est déterminée à partir des sources suivantes, par ordre de priorité décroissante :

1. Indicateur global `-L` / `--ui-lang <code>` (par ex. `-L pt-BR`).
2. Variable d'environnement `AI_I18N_LANG` (par ex. `export AI_I18N_LANG=es`).
3. La clé de configuration `uiLanguage` dans `ai-i18n-tools.config.json` (chaîne BCP-47).
4. La locale du système d'exploitation hôte (via `Intl.DateTimeFormat().resolvedOptions().locale`).

Les paramètres régionaux demandés sont mis en correspondance avec les langues d'interface utilisateur fournies, soit exactement, soit par la variation la plus proche (par exemple, `pt-PT` se résout en `pt-BR`, et `en-US` se résout en `en-GB`) ; si aucune correspondance n'est trouvée, il revient aux paramètres régionaux source (`en-GB`). Lorsqu'une langue d'interface utilisateur est demandée explicitement (via l'indicateur, la variable d'environnement ou `uiLanguage`) mais qu'aucun bundle fourni ne correspond, la CLI affiche un avertissement unique indiquant que les paramètres régionaux par défaut seront utilisés ; des paramètres régionaux déduits uniquement du système d'exploitation hôte n'avertissent jamais. Ceci est indépendant de votre projet `sourceLocale` / `targetLocales`. Langues d'interface utilisateur fournies : `en-GB` (source) plus `de`, `es`, `fr`, `hi-Latn`, `ja`, `ko`, `pt-BR`, `zh-Hans`, et `zh-Hant`. Aucune configuration requise — par défaut, l'outil suit les paramètres régionaux de votre système d'exploitation. Voir [Langue de l'interface utilisateur de l'outil](/reference/environment-variables#tool-ui-language) pour plus de détails.

---

<a id="documentation"></a>
## Documentation

- [Site de documentation](https://wsj-br.github.io/ai-i18n-tools/) — guide complet de VitePress (9 langues sur GitHub Pages).
- [Démarrage rapide](/guide/quick-start) — configuration pour les chaînes d'interface utilisateur, les documents et JSON (interface utilisateur, documents/`.astro`, bundles JSON, Astro Starlight et Astro simple).
- [Guide des ressources locales](/guide/images-and-screenshots/) - captures d'écran et SVG illustrés dans les documents traduits (réécriveur de liens plats, scripts de capture d'écran).
- [Architecture](/reference/architecture) - architecture, composants internes, API programmatique et points d'extension.
- [Contexte de l'agent IA](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) - **pour les applications utilisant le package :** invites d'intégration pour les projets en aval (à copier dans les règles d'agent de votre dépôt).
- Internes du mainteneur pour **ce** dépôt : `dev/package-context.md` (clone uniquement ; pas sur npm).

---

<a id="license"></a>
## Licence

Ce projet est sous licence MIT.  
Consultez le fichier [LICENSE](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) pour plus de détails.

Copyright &copy; 2026 Waldemar Scudeller Jr.
