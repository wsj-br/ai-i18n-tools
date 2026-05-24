<a id="ai-i18n-tools-getting-started"></a>
# ai-i18n-tools : Prise en main

Le package `ai-i18n-tools` propose trois workflows modulaires distincts :

- **Workflow 1 - Traduction de l'interface utilisateur** : extraire les appels `t("…")` depuis n'importe quelle source JS/TS, les traduire via OpenRouter, puis générer des fichiers JSON plats par langue prêts à être utilisés avec i18next.
- **Workflow 2 - Traduction de documents** : traduire des pages en **markdown, MDX et `.astro`** listées dans `docs[].contentPaths` via `translate-docs`, avec mise en cache intelligente. Un **fichier JSON de catalogue Docusaurus** (`docs[].docusaurusCatalogDir`, provenant de `docusaurus write-translations`) est traduit dans la même commande lorsque `features.translateDocs` est activé — il s'agit des éléments d'interface du site (barre de navigation, pied de page, chaînes de thème), pas du contenu rédactionnel dans `docs/`.
- **Workflow 3 - Traduction de fichiers JSON** : traduire des bundles JSON arbitraires et imbriqués (par exemple `src/i18n/en/translation.json`) via les options de premier niveau `json[]`, `features.translateJson` et `translate-json` — destiné aux sites qui stockent les textes d'interface dans des fichiers JSON par langue au lieu de `t()` directement dans le code source.

Les ressources **SVG** utilisent `features.translateSVG`, le bloc de premier niveau `svg` et `translate-svg` (voir [référence CLI](#cli-reference)).

**Quel workflow choisir ?**

- Chaînes destinées aux utilisateurs dans le code source via `t()` → Workflow 1 (`extract` / `translate-ui`).
- Pages localisées ou fichiers JSON shell Docusaurus → Workflow 2 (`translate-docs`).
- Fichiers JSON localisés imbriqués uniquement → Workflow 3 (`translate-json`).

Les trois workflows utilisent OpenRouter (n'importe quel LLM compatible) et partagent un seul fichier de configuration.

<small>**Lire dans d'autres langues :** </small>
<small id="lang-list">[English (GB)](../../docs/GETTING_STARTED.md) · [Deutsch](./GETTING_STARTED.de.md) · [Español](./GETTING_STARTED.es.md) · [Français](./GETTING_STARTED.fr.md) · [हिन्दी](./GETTING_STARTED.hi.md) · [日本語](./GETTING_STARTED.ja.md) · [한국어](./GETTING_STARTED.ko.md) · [Português (Brasil)](./GETTING_STARTED.pt-BR.md) · [中文 (中国大陆)](./GETTING_STARTED.zh-CN.md) · [中文 (台灣)](./GETTING_STARTED.zh-TW.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table des matières**

- [Installation](#installation)
  - [Utilisation de l'interface en ligne de commande (CLI)](#using-the-cli)
- [Démarrage rapide](#quick-start)
  - [Scripts `package.json` recommandés](#recommended-packagejson-scripts)
- [Workflow 1 - Traduction de l'interface utilisateur](#workflow-1---ui-translation)
  - [Étape 1 : Initialisation](#step-1-initialise)
  - [Étape 2 : Extraction des chaînes](#step-2-extract-strings)
  - [Site web Astro (Astro classique, pas Starlight)](#astro-website-plain-astro-not-starlight)
  - [Chaînes d'interface utilisateur d'un site web Astro (SSG)](#astro-website-ui-strings-ssg)
  - [Pages d'un site web Astro (analyse et remplacement)](#astro-website-pages-parse-and-replace)
  - [Étape 3 : Traduire les chaînes d'interface](#step-3-translate-ui-strings)
  - [Export vers XLIFF 2.0 (facultatif)](#exporting-to-xliff-20-optional)
  - [Étape 4 : Intégration d'i18next au moment de l'exécution](#step-4-wire-i18next-at-runtime)
    - [Maintenir `SOURCE_LOCALE` synchronisé](#keeping-source_locale-aligned)
    - [Chargeurs de langue (locale loaders)](#locale-loaders)
    - [Référence des utilitaires d'exécution](#runtime-helpers-reference)
  - [Utilisation de `t()` dans le code source](#using-t-in-source-code)
  - [Interpolation](#interpolation)
  - [Pluriels cardinaux (`plurals: true`)](#cardinal-plurals-plurals-true)
    - [Stockage et génération des pluriels](#how-plurals-are-stored-and-emitted)
  - [Interface de changement de langue](#language-switcher-ui)
  - [Langues LTR](#rtl-languages)
- [Flux de travail 2 - Traduction de documents](#workflow-2---document-translation)
  - [Étape 1 : Initialiser pour la documentation](#step-1-initialise-for-documentation)
  - [Étape 2 : Traduction des documents](#step-2-translate-documents)
    - [Markdown complexe et échecs des contrôles qualité](#complex-markdown-and-failed-quality-checks)
    - [Comportement du cache et indicateurs (flags) `translate-docs`](#cache-behaviour-and-translate-docs-flags)
    - [Format des prompts par lot](#batch-prompt-format)
    - [Dédoublonnage des segments et chemins dans SQLite](#segment-dedupe-and-paths-in-sqlite)
  - [Organisations de sortie](#output-layouts)
    - [Liens d'ancrage lors de l'utilisation de `docsOutput.style = "flat"`](#anchor-links-when-docsoutputstyle--flat)
    - [Images et ressources matricielles dans les documents traduits](#images-and-raster-assets-in-translated-docs)
    - [Sélecteur de langue (`languageListBlock`)](#language-switcher-languagelistblock)
    - [Espaces réservés `pathTemplate` / `jsonPathTemplate`](#pathtemplate--jsonpathtemplate-placeholders)
  - [Dépannage](#troubleshooting)
- [Workflow 3 - Traduction de fichiers JSON](#workflow-3---json-file-translation)
  - [Étape 1 : Initialisation pour JSON imbriqué](#step-1-initialise-for-nested-json)
  - [Étape 2 : Configuration de `json[]`](#step-2-configure-json)
  - [Étape 3 : Traduction des lots JSON](#step-3-translate-json-bundles)
  - [Comparaison du workflow 3 avec d'autres pipelines](#workflow-3-vs-other-pipelines)
- [Workflow combiné (UI + Docs)](#combined-workflow-ui--docs)
  - [Workflow mixte de documentation (`docsOutput.style = "docusaurus"` + `"flat"`)](#mixed-documentation-workflow-docsoutputstyle--docusaurus--flat)
- [Tableau de bord de traduction](#translation-dashboard)
  - [Échecs (traduction de documents)](#failures-document-translation)
    - [Quand l'utiliser](#when-to-use-it)
    - [Pourquoi les modifications de la source sont importantes](#why-source-edits-matter)
    - [Comment utiliser l'onglet](#how-to-use-the-tab)
  - [Problèmes Markdown (vérifications statiques)](#markdown-issues-static-checks)
- [Référence de configuration](#configuration-reference)
  - [`sourceLocale`](#sourcelocale)
  - [`targetLocales`](#targetlocales)
  - [`uiLanguagesPath` (facultatif)](#uilanguagespath-optional)
  - [`concurrency` (facultatif)](#concurrency-optional)
  - [`batchConcurrency` (facultatif)](#batchconcurrency-optional)
  - [`fileConcurrency` (facultatif)](#fileconcurrency-optional)
  - [`batchSize` / `maxBatchChars` (facultatif)](#batchsize--maxbatchchars-optional)
  - [`openrouter`](#openrouter)
  - [`features`](#features)
  - [`ui`](#ui)
  - [`cacheDir`](#cachedir)
    - [Bonnes pratiques pour les exclusions git :](#best-practice-for-git-exclusions)
  - [`docs`](#docs)
  - [`json`](#json)
  - [`svg`](#svg)
  - [`glossary`](#glossary)
- [Référence CLI](#cli-reference)
  - [Options racine et globales](#root-and-global-options)
  - [Aide par commande](#per-command-help)
  - [Langues cibles (`-l` / `--locale`)](#target-locales--l----locale)
- [Variables d'environnement](#environment-variables)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="installation"></a>
## Installation

Le package publié est uniquement **ESM**. Utilisez `import`/`import()` dans Node.js ou votre outil de regroupement, et non `require('ai-i18n-tools')`. Le package déclare `engines.node` `>=22.16.0` ; les anciennes versions de Node.js ne sont pas prises en charge. L'archive tar de npm inclut uniquement les fichiers en anglais sous `docs/` ; les copies spécifiques aux paramètres régionaux situées sous `translated-docs/` se trouvent dans le [dépôt GitHub](https://github.com/wsj-br/ai-i18n-tools/tree/main/translated-docs).

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

ai-i18n-tools inclut son propre extracteur de chaînes. Si vous avez précédemment utilisé `i18next-scanner`, `babel-plugin-i18next-extract` ou des outils similaires, vous pouvez supprimer ces dépendances de développement après la migration.

<a id="using-the-cli"></a>
### Utilisation de l'interface en ligne de commande (CLI)

**Par projet (recommandé)** — installez comme dépendance ou dépendance de développement, puis appelez via `npx`, `pnpm exec`, ou un script `package.json`. Les scripts `package.json` s'exécutent déjà avec `node_modules/.bin` sur `PATH`, donc des commandes comme `pnpm run i18n:sync` invoquent l'interface CLI sans avoir à taper `npx`.

**Directement** `ai-i18n-tools` **dans le terminal :** Pour exécuter l'interface CLI directement dans un shell interactif (depuis la racine du projet, après une installation locale), ajoutez le répertoire binaire local à `PATH` :

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

Ou créez un fichier `.env` à la racine du projet :

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

<a id="quick-start"></a>
## Démarrage rapide

Le modèle par défaut `init` (`ui-markdown`) active uniquement l'extraction et la traduction de l'**interface utilisateur**. Les modèles `ui-docusaurus` et `ui-starlight` activent la traduction de **documents** (`translate-docs`). Le modèle `ui-astro-website` génère la structure nécessaire pour l'extraction de l'**interface utilisateur** dans les applications Astro classiques (y compris les fichiers `.astro`) ; ajoutez un bloc `docs[]` (voir [Astro website pages (parse-and-replace)](#astro-website-parse-and-replace)) si vous souhaitez également activer `translate-docs` pour le HTML des pages `.astro`. La référence [`examples/astro-website`](../../docs/../examples/astro-website/) utilise les **deux** pipelines. Utilisez `sync` lorsque vous souhaitez une seule commande qui exécute l'extraction, la traduction de l'interface utilisateur, la traduction facultative des fichiers SVG et la traduction de la documentation selon votre configuration.

```bash
# Workflow 1 - UI strings (default template enables extract + translate-ui)
npx ai-i18n-tools init
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui

# Workflow 2 - docs (Docusaurus-oriented template)
npx ai-i18n-tools init -t ui-docusaurus
# Astro Starlight docs: npx ai-i18n-tools init -t ui-starlight
# Plain Astro website UI: npx ai-i18n-tools init -t ui-astro-website
npx ai-i18n-tools translate-docs

# Workflow 3 - nested JSON bundles (no t() in source)
npx ai-i18n-tools init -t ui-json-bundles
npx ai-i18n-tools translate-json

# Combined: extract UI strings, then translate UI + SVG + docs + json[] (per config features)
npx ai-i18n-tools sync

# Translation status (UI strings per locale; markdown per file × locale in chunked tables)
npx ai-i18n-tools status
# npx ai-i18n-tools status --max-columns 12   # wider tables, fewer chunks
```

<a id="recommended-packagejson-scripts"></a>
### Scripts `package.json` recommandés

Une fois le package installé localement, vous pouvez utiliser directement les commandes CLI dans les scripts (pas besoin de `npx`).

**Préférez** `sync` pour tout ce qui consistait auparavant à « exécuter `translate-ui`, puis `translate-svg`, puis `translate-docs`, puis `translate-json` » : `ai-i18n-tools sync` exécute **extract** (quand activé), **translate-ui**, **translate-svg** (facultatif), **translate-docs**, puis **translate-json** (facultatif), dans le bon ordre et avec des indicateurs partagés, selon votre configuration. Enchaîner ces étapes manuellement est sujet à erreurs (ordre, extraction, indicateurs de langue). Utilisez `i18n:translate:ui`, `i18n:translate:svg`, `i18n:translate:docs` et `i18n:translate:json` uniquement lorsque vous avez besoin d'une **étape unique** isolée.

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:translate:json": "ai-i18n-tools translate-json",
  "i18n:status": "ai-i18n-tools status",
  "i18n:dashboard": "ai-i18n-tools dashboard",
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

- `sourceLocale` - code BCP-47 de votre langue source (par exemple `"en-GB"`). **Doit correspondre** à `SOURCE_LOCALE` exporté depuis votre fichier de configuration i18n au moment de l'exécution (`src/i18n.ts` / `src/i18n.js`).
- `targetLocales` - tableau de codes BCP-47 pour vos langues cibles (par exemple `["de", "fr", "pt-BR"]`). Exécutez `generate-ui-languages` pour créer le manifeste `ui-languages.json` à partir de cette liste.
- `ui.sourceRoots` - répertoires ou motifs glob à analyser pour les appels `t("…")` (par exemple `["src/"]`, `["src/**/*.ts"]`).
- `ui.stringsJson` - emplacement où écrire le catalogue principal (par exemple `"src/locales/strings.json"`).
- `ui.flatOutputDir` - emplacement où écrire `de.json`, `pt-BR.json`, etc. (par exemple `"src/locales/"`).
- `ui.preferredModel` (facultatif) - identifiant du modèle OpenRouter à essayer **en premier** uniquement pour `translate-ui` ; en cas d'échec, la CLI continue avec `openrouter.translationModels` (ou l'ancien `defaultModel` / `fallbackModel`) dans l'ordre, en sautant les doublons.

<a id="step-2-extract-strings"></a>
### Étape 2 : Extraire les chaînes

```bash
npx ai-i18n-tools extract
```

Analyse tous les fichiers JS/TS situés dans `ui.sourceRoots` à la recherche des appels `t("literal")` et `i18n.t("literal")`. Écrit (ou fusionne dans) `ui.stringsJson`.

Le scanner est configurable : ajoutez des noms de fonctions personnalisés via `ui.uiExtractor.funcNames` (ou l'ancien `ui.reactExtractor.funcNames`). Pour les pages et composants Astro, ajoutez `.astro` à `ui.uiExtractor.extensions`.

<a id="astro-website-plain-astro-not-starlight"></a>
### Site web Astro (Astro classique, pas Starlight)

Pour les sites marketing ou applicatifs Astro statiques, combinez le routage i18n intégré à Astro [Astro built-in i18n routing](https://docs.astro.build/en/guides/internationalization/) avec ai-i18n-tools. L'implémentation de référence est [`examples/astro-website`](../../docs/../examples/astro-website/) (voir aussi son [README](../../docs/../examples/astro-website/README.md)) : anglais à l'adresse `/`, neuf localisations cibles à `/{locale}/` (`de`, `fr`, `es`, `ar`, `ja`, `ko`, `zh-cn`, `zh-tw`, `pt-br`).

La plupart des équipes utilisent un pipeline **hybride** combinant les deux (ils ne sont pas en conflit) :

| Pipeline | À utiliser pour | Commandes | Sortie |
|----------|---------|----------|--------|
| **HTML des pages** | Titres, paragraphes, libellés de navigation, tableaux intégrés dans le corps du modèle | `translate-docs` | Un `src/pages/{locale}/index.astro` par localisation |
| **Chaînes d'interface utilisateur (`t()`)** | Données du frontmatter, libellés d'onglets de captures d'écran, tableaux partagés | `extract` → `translate-ui` | `public/locales/{locale}.json` (source anglaise utilisée comme clé) |

Gardez trois listes synchronisées lorsque vous ajoutez ou supprimez une langue : `targetLocales` dans `ai-i18n-tools.config.json`, `i18n.locales` dans `astro.config.mjs` (Astro utilise des codes de routage en **minuscules** comme `pt-br`), et `ui-languages.json` (via `generate-ui-languages`). Les **noms de fichiers** des bundles plats utilisent la casse définie dans la configuration (`pt-BR.json`) ; associez le chemin `pt-br` d'Astro à ce fichier via le champ `code` de votre manifeste (voir `examples/astro-website/src/i18n/locale.ts`).

Exemples de scripts `package.json` (issus du projet de référence) :

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:translate-ui": "ai-i18n-tools translate-ui",
  "i18n:translate": "ai-i18n-tools translate-docs",
  "i18n:locales": "ai-i18n-tools generate-ui-languages",
  "i18n:sync": "ai-i18n-tools sync"
}
```

<a id="astro-website-ui-strings-ssg"></a>
### Chaînes d'interface de site web Astro (SSG)

Générez l'extraction d'interface avec `init -t ui-astro-website`, puis fusionnez un bloc `docs[]` lorsque vous traduisez également le HTML des pages (voir ci-dessous). Encapsulez le texte avec `t('…')` dans les modules TypeScript et dans le frontmatter `.astro` (ainsi que dans les blocs de modèle `{expression}` si vous préférez les chaînes d'interface plutôt que des pages dupliquées par langue) :

```bash
npx ai-i18n-tools init -t ui-astro-website
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui
```

Définissez `sourceLocale` pour qu'il corresponde à `i18n.defaultLocale` dans `astro.config.mjs`. Écrivez les bundles plats dans un répertoire que Astro peut importer au moment de la construction (le modèle utilise `public/locales/`). Résolvez `t('…')` au **moment de la construction** en recherchant le texte source en anglais comme clé (voir `examples/astro-website/src/i18n/t.ts` ; `strings.json` est le cache d'extraction, pas le bundle au moment de l'exécution). Vous n'avez **pas besoin** de `ai-i18n-tools/runtime` ou d'i18next pour un site statique, sauf si vous ajoutez des îlots clients qui changent de langue après le chargement.

Connectez chaque page qui appelle `t()` (page racine en anglais et chaque copie `src/pages/{locale}/`) :

```astro
import { loadFlatBundle, makeT } from '../i18n/t';        // or ../../i18n/t in locale subfolders
import { resolvePageLocale, useTranslations } from '../i18n/utils';

const locale = resolvePageLocale(Astro.currentLocale);
const flat = await loadFlatBundle(Astro.currentLocale);
const t = useTranslations(locale, makeT(flat));
```

Les utilitaires d'assistance dans l'exemple : `src/i18n/utils.ts`, `src/i18n/locale.ts` et `ui-languages.json` pour les libellés, la direction et les codes BCP-47. Exécutez `generate-ui-languages` après avoir modifié `targetLocales` (vous pouvez éventuellement définir `ui.uiLanguagesPath` pour que le manifeste soit placé à côté de vos utilitaires, par exemple `src/i18n/ui-languages.json`). `MainLayout.astro` définit `<html lang>` et `<html dir>` à partir de `resolveUiLanguage(Astro.currentLocale)` ; `LanguagePicker.astro` utilise `getRelativeLocaleUrl` provenant de `astro:i18n`.

<a id="astro-website-pages-parse-and-replace"></a>
### Pages de site web Astro (analyse et remplacement)

Pour les pages marketing contenant du HTML en dur dans les fichiers `.astro`, laissez `translate-docs` extraire les nœuds de texte et les attributs (`alt`, `title`, `aria-label`, `placeholder`), les traduire à l'aide du cache de document, puis écrire des copies spécifiques à chaque localisation dans votre arborescence de pages. Vous n'avez **pas besoin** de `t()` pour la plupart des textes visibles.

Les attributs structurels et les valeurs de clés ne sont **pas** traduits par défaut : une protection intégrée couvre les attributs JSX/HTML tels que `class`, `id`, `style`, `src`, `href`, `data-*`, et la plupart des `aria-*`, ainsi que les clés d'objets comme `class`, `key` et `id` à l'intérieur des blocs de modèle `{expression}`. Utilisez `docs[].protectAttributes` et `docs[].protectKeys` pour étendre ces listes lorsque vous utilisez des attributs personnalisés (par exemple les attributs Tailwind `variant` ou les champs CMS `slug`). Les mêmes options s'appliquent au JSX dans MDX lors de la traduction markdown (voir [protectAttributes / protectKeys](#protectattributes-protectkeys)).

Activez `features.translateDocs` et ajoutez un bloc `docs[]`, par exemple :

```json
{
  "features": { "translateDocs": true },
  "docs": [{
    "contentPaths": ["src/pages/index.astro"],
    "outputDir": "src/pages",
    "docsOutput": {
      "style": "astro-starlight",
      "docsRoot": "src/pages"
    },
    "addFrontmatter": false
  }]
}
```

Exécutez `npx ai-i18n-tools translate-docs` (ou `pnpm i18n:translate` dans [`examples/astro-website`](../../docs/../examples/astro-website/)). La source en anglais reste dans `src/pages/index.astro` ; chaque langue cible obtient un `src/pages/{locale}/index.astro` avec les imports ajustés pour le niveau de répertoire supplémentaire (par exemple `../layouts/` → `../../layouts/`).

Dans le **corps du modèle**, les littéraux de chaînes dans les blocs `{expression}` (tableaux en ligne, champs `title`/`desc` d'objet) sont traduits lorsqu'ils sont destinés à l'utilisateur ; les valeurs entre guillemets sur les attributs/clés protégés, les littéraux à l'intérieur de `t('…')`, `<script>` et `<style>` restent inchangés. Le TypeScript du frontmatter n'est **pas traduit** par ce processus — conservez le frontmatter partagé (y compris les imports `t()` et les tableaux de données) identique sur les pages anglaises et localisées, ou relancez `translate-docs` après avoir modifié la page anglaise afin que les copies localisées intègrent les modifications du frontmatter. Pour les contenus uniquement dans le frontmatter, utilisez plutôt le [pipeline de chaînes d'interface](#astro-website-ui-strings).

Voir [`examples/astro-website`](../../docs/../examples/astro-website/) pour la page d'accueil hybride complète (HTML via `translate-docs`, libellés des onglets de capture d'écran via `t()` + `translate-ui`).

<a id="step-3-translate-ui-strings"></a>
### Étape 3 : Traduire les chaînes d'interface

```bash
npx ai-i18n-tools translate-ui
```

Lit `strings.json`, envoie des lots à OpenRouter pour chaque langue cible, puis écrit des fichiers JSON plats (`de.json`, `fr.json`, etc.) dans `ui.flatOutputDir`. Lorsque `ui.preferredModel` est défini, ce modèle est tenté en premier, avant la liste ordonnée dans `openrouter.translationModels` (les autres commandes, comme la traduction de documents, utilisent toujours uniquement `openrouter`).

Pour chaque entrée, `translate-ui` stocke l'**identifiant de modèle OpenRouter** ayant permis de traduire chaque langue dans un objet `models` facultatif (avec les mêmes clés de langue que `translated`). Les chaînes modifiées dans la commande locale `dashboard` sont marquées avec la valeur sentinelle `user-edited` dans `models` pour cette langue. Les fichiers plats par langue situés sous `ui.flatOutputDir` restent uniquement **chaîne source → traduction** ; ils n'incluent pas `models` (ainsi les paquets à l'exécution restent inchangés).

> **Remarque :** Si vous modifiez une entrée dans le Tableau de bord de traduction, vous devez exécuter un `sync --force-update` (ou la commande équivalente `translate` avec `--force-update`) pour réécrire les fichiers de sortie avec la nouvelle entrée du cache. De plus, gardez à l'esprit que si le texte source change ultérieurement, votre modification manuelle sera perdue car une nouvelle clé de cache (hachage) sera générée pour la nouvelle chaîne source.

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

<details>
<summary>Exemple complet d'initialisation i18n (src/i18n.js)</summary>

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

</details>

<a id="keeping-source_locale-aligned"></a>
#### Maintenir `SOURCE_LOCALE` synchronisé

**Gardez trois valeurs alignées :** `sourceLocale` dans `ai-i18n-tools.config.json`, `SOURCE_LOCALE` dans ce fichier, et le JSON plat pluriel que `translate-ui` écrit comme `{sourceLocale}.json` dans votre répertoire de sortie plat (souvent `public/locales/`). Utilisez ce même nom de base dans le fichier statique `import` (exemple ci-dessus : `en-GB` → `en-GB.json`). Le champ `lng` dans `sourcePluralFlatBundle` doit être égal à `SOURCE_LOCALE`. Les chemins ES statiques `import` ne peuvent pas utiliser de variables ; si vous modifiez la langue source, mettez à jour `SOURCE_LOCALE` et le chemin d'importation ensemble. Sinon, chargez ce fichier avec un `import(\` dynamique ./public/locales/${SOURCE_LOCALE}.json\`)`, `fetch`, ou `readFileSync` afin que le chemin soit construit à partir de `SOURCE_LOCALE`.

L'extrait utilise `./locales/…` et `./public/locales/…` comme si `i18n` était placé à côté de ces dossiers. Si votre fichier se trouve dans `src/` (cas typique), utilisez `../locales/…` et `../public/locales/…` pour que les imports correspondent aux mêmes chemins que `ui.stringsJson`, `uiLanguagesPath` et `ui.flatOutputDir`.

Importez `i18n.js` avant que React ne rende (par exemple, en haut de votre point d'entrée). Lorsque l'utilisateur change de langue, appelez `await loadLocale(code)`, puis `i18n.changeLanguage(code)`.

`SOURCE_LOCALE` est exporté afin que tout autre fichier qui en a besoin (par exemple, un sélecteur de langue) puisse l'importer directement depuis `'./i18n'`. Si vous migrez une configuration i18next existante, remplacez toutes les chaînes de langue source en dur (par exemple, des vérifications comme `'en-GB'` disséminées dans les composants) par des importations de `SOURCE_LOCALE` depuis votre fichier d'initialisation i18n.

Les importations nommées (`import { defaultI18nInitOptions, … } from 'ai-i18n-tools/runtime'`) fonctionnent de la même manière si vous préférez ne pas utiliser l'export par défaut.

<a id="locale-loaders"></a>
#### Chargeurs de langue

Gardez `localeLoaders` **synchronisé avec la configuration** en les dérivant de `ui-languages.json` à l'aide de `makeLocaleLoadersFromManifest` (cela filtre `SOURCE_LOCALE` en utilisant la même normalisation que `makeLoadLocale`). Lorsque vous ajoutez une langue à `targetLocales` et exécutez `generate-ui-languages`, le manifeste est mis à jour et vos chargeurs suivent automatiquement le changement — il n'est pas nécessaire de maintenir une carte codée en dur séparée.

Pour les paquets JSON situés sous `public/` (configuration Next.js typique), récupérez-les depuis votre chemin d'URL publique :

```js
(code) => () => fetch(`/locales/${code}.json`).then(res => res.json())
```

Pour les interfaces CLI Node sans emballeur, utilisez `readFileSync` dans une petite fonction d'assistance qui lit et analyse le fichier JSON pour chaque code.

<a id="runtime-helpers-reference"></a>
#### Référence des utilitaires d'exécution

`aiI18n.defaultI18nInitOptions(sourceLocale)` renvoie les options standard pour les configurations clé-comme-valeur-par-défaut :

- `parseMissingKeyHandler` renvoie la clé elle-même, donc les chaînes non traduites affichent le texte source.
- `nsSeparator: false` autorise les clés contenant des deux-points.
- `interpolation.escapeValue: false` — sécurisé à désactiver : React échappe les valeurs lui-même, et la sortie Node.js/CLI ne contient aucun HTML à échapper.

`setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` est le câblage **recommandé** pour les projets ai-i18n-tools : il applique le nettoyage des clés + la substitution de secours en locale source <code>"{{var}}"</code> (comportement identique à celui de `wrapI18nWithKeyTrim`, plus bas niveau), fusionne éventuellement les clés suffixées au pluriel `translate-ui` `{sourceLocale}.json` via `addResourceBundle`, puis installe `wrapT` prenant en compte le pluriel à partir de votre `strings.json`. Omettez `sourcePluralFlatBundle` uniquement pendant l'initialisation (fusionnez-le une fois que `translate-ui` a émis `{sourceLocale}.json`). `wrapI18nWithKeyTrim` seul est **déconseillé** pour le code applicatif — utilisez plutôt `setupKeyAsDefaultT`.

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

Utilisez l'interpolation native du second argument d’i18next pour les espaces réservés <code>"{{var}}"</code> :

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

La commande extract analyse le **deuxième argument** lorsqu'il s'agit d'un objet littéral simple et lit des indicateurs dédiés aux outils tels que `plurals: true` et `zeroDigit` (voir **Pluriels cardinaux** ci-dessous). Pour les chaînes ordinaires, seule la clé littérale est utilisée pour le hachage ; les options d'interpolation sont tout de même transmises à i18next au moment de l'exécution.

Si votre projet utilise un utilitaire d'interpolation personnalisé (par exemple appelant `t('key')` puis transmettant le résultat à une fonction modèle comme `interpolateTemplate(t('Hello {{name}}'), { name })`), `setupKeyAsDefaultT` (via `wrapI18nWithKeyTrim`) rend cela inutile — il applique l'interpolation <code>"{{var}}"</code> même si la langue source renvoie la clé brute. Migrez les appels vers `t('Hello {{name}}', { name })` et supprimez l'utilitaire personnalisé.

<a id="cardinal-plurals-plurals-true"></a>
### Pluriels cardinaux (`plurals: true`)

Utilisez le **même littéral** que vous souhaitez comme texte par défaut pour les développeurs, et passez `plurals: true` afin que extract + `translate-ui` traitent l'appel comme un **groupe pluriel cardinal** (formes `_zero` … `_other` au style i18next JSON v4).

```tsx
{t('{{count}} items in your cart', { plurals: true, count: n })}
```

- `zeroDigit` (facultatif) — uniquement pour les outils ; **non** lu par i18next. Lorsque `true`, les invites privilégient un `0` arabe littéral dans la chaîne `_zero` pour chaque langue où cette forme existe ; lorsque `false` ou omis, une formulation naturelle pour le zéro est utilisée. Supprimez ces clés avant d'appeler `i18next.t` (voir `wrapT` ci-dessous).

**Validation :** Si le message contient **deux ou plusieurs** espaces réservés `{{…}}` distincts, **l'un d'eux doit être** `{{count}}` (l'axe du pluriel). Sinon, `extract` **échoue** avec un message clair indiquant le fichier et la ligne.

**Deux compteurs indépendants** (par exemple, sections et pages) ne peuvent pas partager un même message pluriel — utilisez **deux** appels à `t()` (chacun avec `plurals: true` et son propre `count`) et concaténez-les dans l'interface utilisateur.

**Non inclus en v1 :** pluriels ordinaux (`_ordinal_*`, `ordinal: true`), pluriels par intervalle, pipelines uniquement ICU.

<a id="how-plurals-are-stored-and-emitted"></a>
#### Stockage et génération des pluriels

**Dans** `strings.json`, les groupes pluriels utilisent **une ligne par hachage** avec `"plural": true`, le littéral d'origine dans `source`, et `translated[locale]` sous forme d'objet mappant les catégories cardinales (`zero`, `one`, `two`, `few`, `many`, `other`) aux chaînes de caractères correspondant à ce paramètre régional.

**JSON plat par langue :** Les lignes non plurielles restent **phrase source → traduction**. Les lignes plurielles sont émises sous forme de `<groupId>_original` (égal à `source`, à titre de référence) et de `<groupId>_<form>` pour chaque suffixe, afin qu’i18next puisse résoudre les pluriels nativement. `translate-ui` écrit également `{sourceLocale}.json` contenant **uniquement** les clés plurielles plates (chargez ce bundle pour la langue source afin que les clés suffixées soient résolues ; les chaînes simples utilisent toujours la clé comme valeur par défaut). Pour chaque langue cible, les clés suffixées émises correspondent à `Intl.PluralRules` pour cette langue (`requiredCldrPluralForms`) : si `strings.json` a omis une catégorie car elle correspondait à une autre après compactage (par exemple, le `many` arabe identique à `other`), `translate-ui` écrit quand même chaque suffixe requis dans le fichier plat en le copiant depuis une chaîne de secours, afin qu'aucune clé ne soit manquée lors de la recherche au runtime.

Runtime (`ai-i18n-tools/runtime`) : **Appelez** `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle })` — cela exécute `wrapI18nWithKeyTrim`, enregistre le bundle pluriel facultatif `translate-ui` `{sourceLocale}.json`, puis `wrapT` en utilisant `buildPluralIndexFromStringsJson(stringsJson)`. `wrapT` supprime `plurals` / `zeroDigit`, réécrit la clé vers l'identifiant du groupe si nécessaire, et transmet `count` (facultatif : s'il existe un seul espace réservé non-`{{count}}`, `count` est copié depuis cette option numérique).

**Environnements anciens :** `Intl.PluralRules` est requis pour les outils et pour un comportement cohérent ; utilisez un polyfill si vous ciblez des navigateurs très anciens.

<a id="language-switcher-ui"></a>
### Interface de changement de langue

Utilisez le manifeste `ui-languages.json` pour créer un sélecteur de langue. `ai-i18n-tools` exporte deux utilitaires d'affichage :

<details>
<summary>Exemple de composant LanguageSelect (React)</summary>

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

</details>

<br />

`getUILanguageLabel(lang, t)` - affiche `t(englishName)` lorsqu'il est traduit, ou `englishName / t(englishName)` lorsque les deux diffèrent. Convient pour les écrans de paramètres.

`getUILanguageLabelNative(lang)` - affiche `englishName / label` (aucun appel `t()` sur chaque ligne). Convient pour les menus d'en-tête où vous souhaitez que le nom natif soit visible.

Le manifeste `ui-languages.json` est un tableau JSON d'entrées <code>"{ code, label, englishName, direction }"</code> (`direction` est `"ltr"` ou `"rtl"`). Exemple :

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

Conçu principalement pour la **documentation en markdown, MDX et `.astro`** sous `docs[].contentPaths`. Sur les sites Docusaurus, définissez `docs[].docusaurusCatalogDir` sur le dossier du catalogue `write-translations` (par exemple `docs-site/i18n/en`) afin que `translate-docs` traduise aussi le JSON du shell (barre de navigation, pied de page, chaînes de thème). Pour les images PNG et autres ressources matricielles intégrées en markdown, voir [Images et ressources matricielles dans la documentation traduite](#images-and-raster-assets-in-translated-docs). Pour un bloc facultatif de **sélecteur de langue** dans README ou la documentation avec `docsOutput.style = "flat"`, voir [Sélecteur de langue (`languageListBlock`)](#language-switcher-languagelistblock). Les fichiers SVG sont traduits via [`translate-svg`](#cli-reference) lorsque `features.translateSVG` est activé — et non via `docs[].contentPaths`. Les bundles JSON d'interface arbitraires imbriqués (non des catalogues Docusaurus) relèvent du [Workflow 3](#workflow-3---json-file-translation) (`json[]` / `translate-json`), et non de `docs[]`.

<a id="step-1-initialise-for-documentation"></a>
### Étape 1 : Initialiser pour la documentation

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

Pour les sites de documentation Astro Starlight :

```bash
npx ai-i18n-tools init -t ui-starlight
```

Pour une interface utilisateur Astro simple (sans Starlight) :

```bash
npx ai-i18n-tools init -t ui-astro-website
```

Ce modèle active uniquement l’extraction de l’interface. Pour la traduction du HTML des pages, définissez également `features.translateDocs` et ajoutez un bloc `docs[]` (voir [Pages de site Astro (analyse et remplacement)](#astro-website-parse-and-replace)). La configuration [`examples/astro-website`](../../docs/../examples/astro-website/) montre les deux pipelines combinés.

Modifiez le fichier `ai-i18n-tools.config.json` généré :

- `sourceLocale` - langue source (doit correspondre à `defaultLocale` dans `docusaurus.config.js`).
- `targetLocales` - tableau de codes de langue BCP-47 (par exemple `["de", "fr", "es"]`).
- `cacheDir` - répertoire de cache SQLite partagé pour tous les pipelines (et répertoire de journal par défaut pour `--write-logs`).
- `docs` - tableau de blocs de documentation. Chaque bloc possède des options `description`, `contentPaths` (chaîne ou tableau ; fichier, répertoire ou motif générique), `outputDir`, `docusaurusCatalogDir` facultatif, `docsOutput`, `segmentSplitting` facultatif, `translateFrontmatterFields`, `protectAttributes`, `protectKeys`, `targetLocales`, `addFrontmatter`, etc.
- `docs[].description` - note courte facultative destinée aux mainteneurs. Lorsqu’elle est définie, elle apparaît dans le titre `translate-docs` et dans les en-têtes de section `status`.
- `docs[].contentPaths` - sources markdown/MDX/`.astro` (et `docusaurusCatalogDir` facultatif pour le fichier JSON de l’interface Docusaurus).
- `docs[].outputDir` - répertoire racine de sortie pour les traductions de ce bloc.
- `docs[].docsOutput.style` - `"nested"` (par défaut), `"flat"`, `"doc-system"`, ou alias `"docusaurus"` / `"astro-starlight"` (voir [Dispositions de sortie](#output-layouts)).

**Principal contre secondaire :** Concentrez-vous sur `contentPaths` pour les pages localisées. Définissez `docusaurusCatalogDir` lorsque vous avez également besoin du JSON du shell Docusaurus depuis `write-translations`. Omettez `docusaurusCatalogDir` si vous traduisez uniquement les pages.

<a id="step-2-translate-documents"></a>
### Étape 2 : Traduire les documents

```bash
npx ai-i18n-tools translate-docs
```

Cela traduit tous les fichiers de chaque `docs[]` du bloc `contentPaths` (et le fichier JSON du catalogue Docusaurus lorsque `docusaurusCatalogDir` est défini) vers toutes les langues de documentation effectives. Les segments déjà traduits sont servis depuis le cache SQLite — seuls les segments nouveaux ou modifiés sont envoyés au LLM.

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

**Si vous rencontrez ce type d'échec de validation, privilégiez la simplification du texte source** — divisez le paragraphe, déplacez un exemple dans un bloc de code délimité, ou décrivez la même idée avec moins de paires imbriquées de gras/code — plutôt que d'attendre de chaque modèle et langue une reproduction parfaite d'un formatage dense en ligne. Ailleurs sur cette page (notamment dans les notes de l'étape 4 sur `SOURCE_LOCALE`, les chargeurs et les chemins `public/`), le formatage est volontairement réaliste ; lorsque vous réutilisez un wording similaire dans votre propre documentation, simplifiez-le lors de traductions à grande échelle.

Pour voir **quels segments ont échoué**, combien de fois, ainsi que les **messages d'erreur ou de qualité** stockés, utilisez l'onglet **Échecs** du tableau de bord de traduction ([Tableau de bord de traduction → Échecs](#failures-document-translation)).

<a id="cache-behaviour-and-translate-docs-flags"></a>
#### Comportement du cache et indicateurs `translate-docs`

L'interface en ligne de commande (CLI) conserve le **suivi des fichiers** dans SQLite (hachage source par fichier × langue) et des lignes de **segment** (hachage × langue par fragment traduisible). Une exécution normale ignore entièrement un fichier lorsque le hachage suivi correspond à la source actuelle **et** que le fichier de sortie existe déjà ; sinon, elle traite le fichier et utilise le cache de segments afin que le texte inchangé n'appelle pas l'API.

| Option                          | Effet                                                                                                                                                                                                                                                              |
|-------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| *(par défaut)*                   | Ignorer les fichiers inchangés lorsque le suivi et la sortie sur disque correspondent ; utiliser le cache de segments pour les autres.                                                                                                                                                                          |
| `-l, --locale <codes>`        | Locales cibles séparées par des virgules (quand omis, la valeur par défaut correspond à l'union de `targetLocales` racine et de chaque `docs[]` optionnel dans les blocs `targetLocales`).                                                                                                       |
| `-p, --path` / `-f, --file`   | Ne traduit que le markdown/JSON situé sous ce chemin (relatif au projet, absolu ou motif glob) ; `--file` est un alias pour `--path`.                                                                                                                                 |
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

| Mode                   | Message utilisateur                                                           | Réponse du modèle                                                 |
|------------------------|------------------------------------------------------------------------|-------------------------------------------------------------|
| `xml`                  | Pseudo-XML : un `<seg id="N">…</seg>` par segment (avec échappement XML). | Uniquement des blocs `<t id="N">…</t>`, un par index de segment.       |
| `json-array` (par défaut) | Un tableau JSON de chaînes, une entrée par segment, dans l'ordre.               | Un tableau JSON de la **même longueur** (même ordre).           |
| `json-object`          | Un objet JSON `{"0":"…","1":"…",…}` indexé par l'index du segment.            | Un objet JSON avec les **mêmes clés** et des valeurs traduites. |

L'en-tête de l'exécution affiche également `Batch prompt format: …`, afin que vous puissiez confirmer le mode actif. Les fichiers d'étiquettes JSON (`docusaurusCatalogDir`) et les lots de fichiers SVG utilisent le même paramètre lorsque ces étapes s'exécutent dans le cadre de `translate-docs` (ou de la phase docs de `sync` — `sync` n'expose pas ce drapeau ; il prend par défaut la valeur `json-array`).

<a id="segment-dedupe-and-paths-in-sqlite"></a>
#### Déduplication des segments et chemins dans SQLite

> **Remarque :** Cette section décrit les détails internes des clés de cache, utiles pour le débogage du comportement de `cleanup` ou pour des outils personnalisés. La plupart des utilisateurs peuvent l'ignorer.

- Les lignes de segment sont indexées globalement par `(source_hash, locale)` (hachage = contenu normalisé). Un texte identique dans deux fichiers partage une seule ligne ; `translations.filepath` est des métadonnées (dernier rédacteur), pas une entrée de cache supplémentaire par fichier.
- `file_tracking.filepath` utilise des clés avec espace de noms : `doc-block:{index}:{relPath}` par bloc `docs` (`relPath` est un chemin posix relatif à la racine du projet : chemins markdown tels que collectés ; **les fichiers JSON d'étiquettes utilisent le chemin relatif au répertoire courant (cwd) du fichier source**, par exemple `docs-site/i18n/en/code.json`, afin que le nettoyage puisse résoudre le fichier réel), `json-block:{index}:{relPath}` pour les sources `json[]` sous `translate-json`, et `svg-files:{relPath}` pour les fichiers SVG sous `translate-svg`.
- `translations.filepath` stocke les chemins posix relatifs au répertoire courant (cwd) pour les segments markdown, JSON et SVG (les SVG utilisent la même forme de chemin que les autres ressources ; le préfixe `svg-files:…` est **uniquement** sur `file_tracking`).
- Après une exécution, `last_hit_at` est effacé uniquement pour les lignes de segment **dans la même portée de traduction** (en respectant `--path` et les types activés) qui n'ont pas été atteintes, ainsi une exécution filtrée ou limitée aux docs n'indique pas comme obsolètes les fichiers non concernés.

<a id="output-layouts"></a>
### Dispositions de sortie

`docsOutput.style` contrôle l'emplacement où les fichiers markdown traduits sont écrits. Utilisez les valeurs de chaîne exactes ci-dessous dans `docs[].docsOutput.style` (les alias sont des dispositions prédéfinies, pas des moteurs distincts).

`docsOutput.style = "nested"` (par défaut lorsqu'omis) — reflète l'arborescence source sous `{outputDir}/{locale}/` (par exemple `docs/guide.md` → `i18n/de/docs/guide.md`).

`docsOutput.style = "doc-system"` — arborescence de documentation préfixée par la locale, destinée aux sites de documentation statique. Les fichiers situés sous `docsRoot` sont écrits dans `{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}`. Les chemins situés en dehors de `docsRoot` reviennent à la disposition imbriquée. Définissez `docs[].docsOutput.docsRoot` sur la racine de vos sources en anglais (par exemple `"docs"` ou `"src/content/docs"`). Lorsque `docsOutput.style = "doc-system"`, vous devez définir `localeSubpath` explicitement (utilisez un alias ci-dessous pour les configurations prédéfinies).

**Alias** (moteur de disposition identique, valeur prédéfinie pour `localeSubpath`) :

- `docsOutput.style = "docusaurus"` — `localeSubpath` prend par défaut la valeur `docusaurus-plugin-content-docs/current` (disposition du plugin i18n Docusaurus).
- `docsOutput.style = "astro-starlight"` — `localeSubpath` prend par défaut la valeur `""` (pages traduites directement sous `{outputDir}/{locale}/`, correspondant à [Starlight](https://starlight.astro.build/guides/i18n/) lorsque l'anglais se trouve à la racine du contenu et que `outputDir` est égal à `docsRoot`).

Préréglage Docusaurus (pages principales de documentation) :

```text
docs/guide.md  →  i18n/de/docusaurus-plugin-content-docs/current/guide.md
```

Préréglage Starlight (forme de bloc identique, chemins différents) :

```text
src/content/docs/guide.md  →  src/content/docs/de/guide.md
```

Étiquettes JSON facultatives — chaînes d'interface Docusaurus provenant de `docusaurusCatalogDir` (pas le contenu du corps MDX) :

```text
i18n/en/sidebar.json  →  i18n/de/sidebar.json
```

Starlight fournit des chaînes d'interface pour de nombreuses locales ; les remplacements personnalisés facultatifs utilisent `src/content/i18n/en.json` avec `jsonPathTemplate: "{outputDir}/{locale}.json"` dans un bloc `docs[]` séparé si nécessaire.

`docsOutput.style = "flat"` — place les fichiers traduits à côté du fichier source avec un suffixe de locale, ou dans un sous-répertoire. Les liens relatifs entre pages sont réécrits automatiquement lorsque `docsOutput.style = "flat"` (sauf si `rewriteRelativeLinks: false` ou un `pathTemplate` personnalisé est défini).

```text
docs/guide.md → i18n/guide.de.md
```

<a id="anchor-links-when-docsoutputstyle--flat"></a>
#### Liens d'ancre lorsque `docsOutput.style = "flat"`

Lorsque `docsOutput.style = "flat"`, la sortie réécrit les **chemins relatifs** entre les pages pour chaque locale (`guide.md` → `guide.de.md`). Les **liens d'ancre** — la forme habituelle en ligne dans le markdown avec un `#` après le chemin — permettent de sauter vers une section dans le fichier cible :

```markdown
Read the [installation checklist](../../docs/setup.md#first-run) before you deploy.
```

Ici, la cible du lien est `setup.md`, et `#first-run` est l'ancre : elle doit faire défiler jusqu'au bon titre à l'intérieur de ce fichier.

**Pourquoi les liens d'ancre nécessitent une attention particulière**

- `rewriteRelativeLinks` fixe le **nom de fichier** pour chaque langue (`setup.md` → `setup.de.md`).
- De nombreux moteurs de rendu dérivent le slug `#` du **texte visible du titre**. Après traduction, les titres diffèrent selon la langue, donc un slug généré automatiquement peut changer alors que le lien réécrit pourrait toujours indiquer `#first-run` — ou bien votre ancre anglaise `#…` ne correspond plus au slug que le moteur construit à partir du titre traduit.
- Résultat : les lecteurs arrivent sur le bon **fichier** mais à la mauvaise **ligne**, ou le navigateur ne trouve aucune correspondance pour le titre.

**Que faire**

1. Exécutez `ai-i18n-tools write-heading-ids` sur votre source `.md` / `.mdx` avant `translate-docs` (même `docs[]` / `contentPaths` que d'habitude). Cet outil insère des ancres HTML explicites sur la ligne précédant chaque en-tête, afin que les valeurs `id` soient partagées par chaque copie traduite. Réexécutez-le après avoir renommé des en-têtes afin que les identifiants d'ancre obsolètes soient actualisés pour correspondre au titre actuel.
2. Faites pointer vos **liens d'ancre** en markdown vers ces identifiants stables, par exemple `[label](../../docs/other.md#section-id)`, où `section-id` correspond à l'ancre insérée par l'outil — et non une déduction basée uniquement sur les mots anglais.

**Exemple**

`docs/overview.md`:

```markdown
See [TLS setup](../../docs/security.md#tls-configuration) for certificate steps.
```

`docs/security.md` après `write-heading-ids` (simplifié) :

```markdown
<a id="tls-configuration"></a>
## TLS configuration

Your CA and cert steps…
```

Après `translate-docs`, les chemins de fichiers et les ancres `#…` restent alignés dans chaque fichier de langue, par exemple :

```markdown
Siehe [TLS-Einrichtung](../../docs/security.de.md#tls-configuration) für die Zertifikatsschritte.
```

L'ancre `#tls-configuration` est identique dans toutes les langues car le `id` est fixé dans la source ; seuls le **texte** du titre et l'**étiquette** du lien sont traduits.

<a id="images-and-raster-assets-in-translated-docs"></a>
#### Images et ressources matricielles dans les documents traduits

`translate-docs` traduit les segments markdown, y compris le texte alternatif des images. Il ne copie pas les fichiers matriciels (PNG, JPEG, WebP, GIF) dans votre documentation `outputDir`. Vous devez placer les captures d'écran à l'emplacement où les URL traduites pointeront, ou utiliser `postProcessing.regexAdjustments` pour réécrire les chemins après traduction.

Pour les fichiers SVG contenant du texte traduisible, utilisez le bloc `svg` et `translate-svg` — voir [`svg`](#svg).

Consultez le [guide des ressources par locale](LOCALE-ASSETS-GUIDE.fr.md) pour obtenir un guide complet de décision, tous les modèles avec exemples de configuration et d'organisation de répertoires, les contrats des scripts de capture, des recommandations de conception et les erreurs fréquentes.

**Référence rapide — cinq modèles**

| Motif                        | Utilisation                                           | Mécanisme                                         |
|------------------------------|-------------------------------------------------------|---------------------------------------------------|
| A — Raster partagé           | Image unique, sans variantes par locale             | Réécriture de lien par fichier ; généralement sans regex          |
| B — Dossier par localité        | `"flat"`, `"docusaurus"`, `"astro-starlight"` README/docs | `regexAdjustments` substitution de segment de localité            |
| C — Colocalisé Docusaurus    | sites `docsOutput.style = "docusaurus"` | Le script de capture place les fichiers ; pas de regex          |
| D — SVG traduit           | Applications web intégrant des illustrations SVG                  | `translate-svg` avec `svg.style = "flat"`         |
| E — SVG traduit colocalisé   | docs `docsOutput.style = "docusaurus"`          | `translate-svg` avec `svg.style = "nested"` + `pathTemplate` |

**Le réécritureur de liens plat et le flux en deux étapes**

Lorsque `docsOutput.style = "flat"`, un réécriture intégrée s'exécute avant `postProcessing`. Elle calcule le préfixe de profondeur pour chaque fichier de sortie — le chemin relatif depuis le répertoire du fichier de sortie vers le répertoire du fichier source — et le préfixe aux URL des ressources non-markdown. `postProcessing` s'applique ensuite sur l'URL déjà préfixée — écrivez des motifs `search` qui correspondent au segment de locale à l'intérieur, et non au préfixe initial `../`.

Avec `flatPreserveRelativeDir: true`, les fichiers sources dans les sous-répertoires obtiennent automatiquement un préfixe spécifique au fichier. Par exemple, `docs/GETTING_STARTED.md` → `translated-docs/docs/GETTING_STARTED.<locale>.md` produit un préfixe `../../docs/`, donc `translation-dashboard.png` (un fichier frère du fichier source) devient `../../docs/translation-dashboard.png` — résolu correctement sans règle `postProcessing`.

Lorsque `docsOutput.style` vaut `"docusaurus"`, `"astro-starlight"`, `"nested"`, ou toute autre valeur que `"flat"`, le réécritureur de liens plats n'est pas exécuté. `postProcessing` voit l'URL markdown d'origine.

**Exemple du modèle A** — aucune configuration n'est nécessaire pour les ressources en chemin relatif situées à côté des fichiers sources lorsque `docsOutput.style = "flat"`. Les règles du modèle A `postProcessing` ne sont nécessaires que pour les ressources en URL absolue (par exemple `/img/...`) ou pour les remplacements ciblant un CDN.

**Exemple du modèle B — `docsOutput.style = "flat"` README** (`examples/nextjs-app`, deuxième bloc `docs[]`)

```json
{
  "description": "Per-locale screenshot folders under translated-docs",
  "search": "images/screenshots/[^/]+/",
  "replace": "images/screenshots/${translatedLocale}/"
}
```

Utilisez la forme générique `[^/]+`, et non une localité source en dur, afin que la règle continue de fonctionner si `sourceLocale` change un jour.

**Exemple du modèle B — `docsOutput.style = "docusaurus"`** (`examples/nextjs-app`, premier bloc `docs[]`)

```json
{
  "description": "Per-locale screenshot folders in docs-site static assets",
  "search": "screenshots/[^/]+/",
  "replace": "screenshots/${translatedLocale}/"
}
```

**Motif C — Colocalisé Docusaurus** (pas besoin de `regexAdjustments`)

Placez les captures d'écran en-GB dans `static/assets/` et créez un lien symbolique `docs/assets → ../static/assets`. Le script `take-screenshots` écrit directement les autres localités dans `i18n/<locale>/…/current/assets/`. Tous les documents dans toutes les localités font référence à `../assets/name.png` — le chemin est stable et aucune réécriture d'URL n'est nécessaire.

**Exemple du motif D** (`examples/nextjs-app`, `svg.style = "flat"`)

```json
"svg": {
  "sourcePath": "images",
  "outputDir": "public/assets",
  "style": "flat"
}
```

`images/*.svg` → fichiers par localité sous `public/assets/`. Application référencée par localité : `<img src={`/assets/icon.${locale}.svg`} />`.

**Exemple minimal avec seulement README** (`examples/console-app`)

`examples/console-app/ai-i18n-tools.config.json` traduit `README.md` en `translated-docs/` uniquement avec le [post-traitement du sélecteur de langue](#language-switcher-languagelistblock). Aucune règle d'image n'est définie — ce qui convient lorsque le README n'a pas de fichiers matriciels associés ou utilise uniquement des URL absolues que votre hébergeur sert déjà.

Les modèles de remplacement prennent en charge des espaces réservés tels que `${translatedLocale}` et `${translatedBasedir}` (liste complète dans la ligne `docsOutput.postProcessing.regexAdjustments` de la [référence de configuration](#configuration-reference)).

<a id="language-switcher-languagelistblock"></a>
#### Sélecteur de langue (`languageListBlock`)

Utilisez `docsOutput.postProcessing.languageListBlock` lorsque les fichiers markdown traduits doivent inclure une ligne de liens **« Lire dans d'autres langues »** — un lien par localité, avec des valeurs `href` calculées relativement à chaque fichier de sortie.

Ce dépôt l'utilise pour [README.md](../README.fr.md) et [docs/GETTING_STARTED.md](../../docs/GETTING_STARTED.md). Après `translate-docs`, chaque copie traduite obtient un bloc actualisé ; par exemple, [translated-docs/docs/GETTING_STARTED.de.md](../../docs/../translated-docs/docs/GETTING_STARTED.de.md) contient des liens vers les fichiers de langue associés dans `translated-docs/docs/` et vers la source anglaise dans `../../docs/GETTING_STARTED.md`.

**1. Marquer le bloc dans le fichier markdown source**

Encadrez le sélecteur dans du code HTML (ou toute autre ligne) délimité par les marqueurs de sous-chaîne `start` et `end`. Ce dépôt utilise :

```markdown
<small>**Read in other languages:** </small>
<small id="lang-list">[English (GB)](../../docs/GETTING_STARTED.md) · [Deutsch](../../docs/../translated-docs/docs/GETTING_STARTED.de.md) · …</small>
```

Le texte du lien initial est uniquement un espace réservé. `translate-docs` remplace entièrement la portion depuis la première ligne contenant `start` jusqu’à la première ligne ultérieure contenant `end` (les marqueurs situés à l’intérieur de blocs de code délimités sont ignorés, afin que les exemples de configuration dans le même fichier ne soient pas pris en compte).

**2. Configurer le bloc**

`start` et `end` sont des marqueurs de sous-chaîne arbitraires — ils n’ont pas besoin d’être `<small id="lang-list">` / `</small>`. Choisissez n’importe quel texte d’ouverture et de fermeture qui n’apparaît que dans la section du sélecteur de langue : une autre balise HTML (`<div class="lang-switcher">` … `</div>`), des commentaires HTML (`<!-- lang-list -->` … `<!-- /lang-list -->`), ou des délimiteurs en markdown uniquement (par exemple une ligne `**Languages:**` jusqu’à une ligne `---`). Définissez `start` et `end` dans la configuration exactement comme indiqué dans le fichier source.

Configuration racine ([ai-i18n-tools.config.json](../../docs/../ai-i18n-tools.config.json)) :

```json
"postProcessing": {
  "languageListBlock": {
    "start": "<small id=\"lang-list\">",
    "end": "</small>",
    "separator": " · "
  }
}
```

| Champ       | Rôle                                                                                                     |
|-------------|----------------------------------------------------------------------------------------------------------|
| `start`     | Sous-chaîne qui identifie la ligne d’ouverture du bloc                                                  |
| `end`       | Sous-chaîne sur la ligne de fermeture (peut être la même ligne que `start` si les deux sont sur une seule ligne)             |
| `separator` | Texte inséré entre les liens `[label](../../docs/href)` générés (ce dépôt utilise `" · "`)                                    |
| `label`     | Facultatif : `"local"` (par défaut) utilise l’endonyme de chaque langue provenant du manifeste ; `"english"` utilise `englishName` |

**3. Ce qui se produit au moment de l’exécution**

1. **Extraction** — la section contenant la liste des langues **n’est pas** envoyée au modèle (`translatable: false`).
2. **Par fichier traduit** — après la traduction des segments et la réécriture éventuelle des liens plats, `postProcessing` reconstruit le bloc : un lien markdown par langue, avec des libellés provenant de `ui-languages.json` s’ils sont présents (sinon du catalogue maître intégré, sinon de `localeDisplayNames`), et des chemins relatifs au fichier en cours d’écriture.
3. **Actualisation de la source** — à la fin d’un passage `translate-docs` / `sync` pour la documentation, le même bloc canonique est réinséré dans les **fichiers sources anglais** de `contentPaths`, de sorte qu’ajouter une langue met à jour le sélecteur dans le dépôt sans avoir à modifier manuellement chaque lien.

Si un fichier ne contient aucun bloc correspondant, l’interface en ligne de commande affiche un avertissement (quand `--verbose`) et laisse le contenu inchangé.

**4. Manifeste des libellés**

Pour les libellés en endonyme (`label: "local"`), générez ou mettez à jour `ui-languages.json` via `generate-ui-languages` (voir [`uiLanguagesPath`](#uilanguagespath-optional)). La configuration de ce dépôt, dédiée uniquement à la documentation, ne comporte pas de pipeline d’interface utilisateur ; les libellés proviennent donc du catalogue maître intégré pour `sourceLocale` + `targetLocales`.

**5. Exemples dans ce dépôt**

| Exemple                            | Fichiers                                                                                                                                                                                        |
|------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Ce package (documentation plate + sous-répertoires) | [ai-i18n-tools.config.json](../../docs/../ai-i18n-tools.config.json) (`docsOutput.style = "flat"`), [README.md](../README.fr.md), [docs/GETTING_STARTED.md](../../docs/GETTING_STARTED.md), sorties dans [translated-docs/](../../docs/../translated-docs/) |
| README minimal uniquement          | [examples/console-app/ai-i18n-tools.config.json](../../docs/../examples/console-app/ai-i18n-tools.config.json) (`docsOutput.style = "flat"`), [examples/console-app/README.md](../../docs/../examples/console-app/README.md)                     |
| README plat + documentation Docusaurus      | [examples/nextjs-app/ai-i18n-tools.config.json](../../docs/../examples/nextjs-app/ai-i18n-tools.config.json) (deuxième bloc : `docsOutput.style = "flat"` ; premier bloc : `docsOutput.style = "docusaurus"`)                                                     |

La ligne immédiatement avant `<small id="lang-list">` (par exemple `**Read in other languages:**`) est un segment normal traduisible et est localisée dans chaque langue cible ; seule la ligne de liens à l'intérieur des marqueurs est régénérée à l'identique, à l'exception de `href` et des libellés pilotés par le manifeste.

<a id="pathtemplate--jsonpathtemplate-placeholders"></a>
#### Espaces réservés `pathTemplate` / `jsonPathTemplate`

Remplacez l'emplacement d'écriture des fichiers traduits en définissant `docs[].docsOutput.pathTemplate` (markdown et MDX) ou `jsonPathTemplate` (fichiers de libellés JSON). Les deux acceptent les mêmes espaces réservés. Les chemins résolus doivent rester à l'intérieur du `outputDir` de ce bloc (l'interface en ligne de commande rejette les chemins qui en sortent).

Si vous utilisez un `pathTemplate` personnalisé, `rewriteRelativeLinks` prend par défaut la valeur `false` sauf si vous le définissez explicitement — la réécriture des liens relatifs est conçue pour `docsOutput.style = "flat"` sans modèle personnalisé.

Pour les mises en page intégrées (`nested`, `flat`, `doc-system` sans modèle personnalisé), définissez `docsOutput.localePathLowercase` sur `true` pour écrire des segments de dossier ou de nom de fichier en minuscules (par exemple `pt-br` au lieu de `pt-BR`). L'alias `astro-starlight` définit cela par défaut sur `true`. Les valeurs personnalisées de `pathTemplate` / `jsonPathTemplate` ne sont pas modifiées — utilisez `{llocale}` là où vous avez besoin de segments en minuscules tout en conservant `{locale}` au format BCP-47.

| Espace réservé            | Rôle                                                                                                       | Exemple                                                          |
|------------------------|------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| `{outputDir}`          | Chemin absolu résolu du `outputDir` de ce bloc de documentation                                           | `/home/acme/repo/i18n`                                           |
| `{locale}` | Code de langue cible (même forme que dans la configuration / CLI) | `de`, `pt-BR` |
| `{LOCALE}` | Même code langue en majuscules | `DE`, `PT-BR` |
| `{llocale}`            | Même paramètre régional en minuscules (correspond aux dossiers de routes Astro tels que `pt-br`, `zh-cn`)                               | `de`, `pt-br`                                                    |
| `{relPath}` | Chemin du fichier source relatif à la racine du projet, en notation POSIX `/` | `docs/guide.md`, `README.md` |
| `{stem}` | Nom du fichier **sans** l'extension | `guide` pour `docs/guide.md` |
| `{basename}` | Nom du fichier **avec** l'extension | `guide.md` |
| `{extension}` | Extension **incluant** le point | `.md`, `.mdx` |
| `{docsRoot}`           | Chemin absolu résolu de `docsOutput.docsRoot` (`docs` par défaut si omis)                            | `/home/acme/repo/docs`                                           |
| `{relativeToDocsRoot}` | `{relPath}` avec le préfixe `docsRoot` correspondant supprimé lorsque les chaînes de chemin coïncident (POSIX) ; sinon inchangé | `docs/guide.md` (courant) ; `guide.md` uniquement lorsque la suppression s'applique |

**Exemple**

Extrait de configuration :

```json
{
  "outputDir": "i18n",
  "docsOutput": {
    "pathTemplate": "{outputDir}/{locale}/{relPath}"
  }
}
```

Pour la langue `de` et la source `docs/guide.md`, avec un répertoire racine du projet `/home/acme/repo` et `outputDir` résolu en `/home/acme/repo/i18n`, le chemin développé est :

```text
/home/acme/repo/i18n/de/docs/guide.md
```

Avec `docsOutput.style = "flat"` et sans `pathTemplate` personnalisé, un modèle courant conserve uniquement le nom de fichier via `{stem}` et `{extension}`, par exemple `{outputDir}/{stem}.{locale}{extension}`, ce qui donne `…/guide.de.md` dans le `outputDir` résolu.

<a id="troubleshooting"></a>
### Dépannage

**Les liens d’ancre de section ne fonctionnent pas dans les documents traduits**

Un lien comme `[label](../../docs/other.md#section-id)` peut ouvrir le bon fichier traduit mais échouer à faire défiler jusqu’au titre visé — ou sauter vers une section incorrecte. Le fragment `#…` ne correspond plus à aucun attribut `id` de titre dans cette langue.

Causes fréquentes :

- Les titres sources n’avaient jamais d’identifiants d’ancre explicites ; le site dérive les slugs à partir du texte visible des titres, qui change après traduction.
- Vous avez renommé un titre dans le code source, mais la ligne `<a id="…"></a>` précédente est absente ou contient encore l’ancien identifiant.
- Les liens d’ancre utilisent un fragment `#…` deviné à partir de mots anglais au lieu de l’identifiant que `write-heading-ids` générerait.

**Correction**

1. Exécutez `ai-i18n-tools write-heading-ids` sur votre `.md` / `.mdx` **source** (même `docs[]` / `contentPaths` que `translate-docs`). Il insère `<a id="slug"></a>` avant chaque en-tête ATX, ou met à jour un ancre existante lorsque le texte de l'en-tête ne correspond plus au slug actuel.
2. Pointez les liens d'ancre vers ces identifiants — par exemple `[setup](../../docs/guide.md#first-run)` où `#first-run` correspond à la ligne d'ancre située au-dessus de l'en-tête cible, et non à un slug déduit uniquement du titre anglais.
3. Relancez `translate-docs` (ou `sync --force-update`) afin que chaque copie dans chaque langue inclue les lignes d'ancre mises à jour.

Utilisez d'abord `--dry-run` sur `write-heading-ids` pour prévisualiser les modifications. Consultez [Liens d'ancrage en disposition plate](#anchor-links-when-docsoutputstyle--flat) pour le modèle complet.

---

<a id="workflow-3---json-file-translation"></a>
## Flux de travail 3 - Traduction de fichiers JSON

Conçu pour les projets qui stockent les textes d'interface dans des **fichiers JSON imbriqués par langue** (par exemple `src/i18n/en/translation.json`) plutôt que dans le code source `t("…")`. L'interface en ligne de commande (CLI) parcourt les valeurs de chaînes dans ces fichiers, les traduit via OpenRouter, puis génère des sorties par langue en utilisant `json[].outputPathTemplate`. Elle utilise le même cache SQLite que `translate-docs`, `translate-svg` et `cacheDir`.

Ce flux de travail n'exécute **pas** `extract` — il n'y a pas de catalogue `strings.json`. Activez-le avec `features.translateJson` et une ou plusieurs entrées au niveau racine dans `json[]`.

<a id="step-1-initialise-for-nested-json"></a>
### Étape 1 : Initialiser pour JSON imbriqué

```bash
npx ai-i18n-tools init -t ui-json-bundles
```

Ce modèle définit `features.translateJson: true`, désactive l'extraction de l'interface et la traduction de documents, et met en place un bloc `json[]` pointant vers `src/i18n/en/translation.json` avec une sortie `src/i18n/{llocale}/translation.json`. Modifiez `sourceLocale`, `targetLocales`, `contentPaths` et `outputPathTemplate` selon l'organisation de votre dépôt.

<a id="step-2-configure-json"></a>
### Étape 2 : Configurer `json[]`

Chaque bloc `json[]` décrit un pipeline :

- `contentPaths` — un ou plusieurs fichiers `.json`, répertoires ou motifs génériques (par exemple `"src/i18n/en/translation.json"` ou `"src/i18n/en/overrides/*.json"`). Les chemins sont résolus à partir de la racine du projet.
- `outputPathTemplate` — obligatoire. Emplacement où écrire chaque fichier de langue cible. Variables disponibles : `{locale}`, `{LOCALE}`, `{llocale}` (code langue en minuscules, utile pour les dossiers de routes Astro), `{stem}`, `{basename}`, `{extension}`, `{relativeToSourceRoot}`.
- `targetLocales` (facultatif) — sous-ensemble spécifique à ce bloc uniquement ; sinon, le `targetLocales` racine s'applique.
- `keyPolicy` — indique quelles clés JSON contiennent du texte traduisible par rapport aux identifiants stables (voir ci-dessous).
- `description` (facultatif) — affiché dans les en-têtes CLI et dans la sortie `status`.

Exemple (plusieurs fichiers sources, dossiers de langue en minuscules) :

```json
{
  "sourceLocale": "en",
  "targetLocales": ["de", "fr", "pt-BR"],
  "features": {
    "translateJson": true
  },
  "cacheDir": ".translation-cache",
  "json": [
    {
      "description": "App UI bundle",
      "contentPaths": [
        "src/i18n/en/translation.json",
        "src/i18n/en/overrides/*.json"
      ],
      "outputPathTemplate": "src/i18n/{llocale}/{basename}",
      "keyPolicy": {
        "mode": "denylist",
        "skipKeys": ["id", "slug", "href", "url", "key", "code"],
        "translateKeys": []
      }
    }
  ]
}
```

**`keyPolicy`**

| `mode`      | Comportement |
|-------------|-----------|
| `allowlist` | Seules les clés correspondant à `translateKeys` (chemins avec points ; motifs minimatch) sont traduites. |
| `denylist`  | Traduit toutes les valeurs de type chaîne, sauf les clés correspondant à `skipKeys`. |
| `both`      | Applique d'abord `translateKeys`, puis retire les correspondances de `skipKeys`. |

Les chemins utilisent la notation par points (`nav.home.label`). Un nom simple comme `slug` correspond au segment final de la clé, à n'importe quelle profondeur.

<a id="step-3-translate-json-bundles"></a>
### Étape 3 : Traduire les bundles JSON

```bash
npx ai-i18n-tools translate-json
```

Options facultatives (mêmes principes que `translate-docs`) : `-l` / `--locale` pour un sous-ensemble de cibles, `-p` / `--path` pour limiter les fichiers, `--dry-run`, `--force` (efface le suivi des fichiers et le cache de segments pour les fichiers correspondants), `--force-update` (re-traite si le hachage du fichier correspond ; le cache de segments s'applique toujours), `-b` / `--batch-concurrency`, `--prompt-format` (`xml` \| `json-array` \| `json-object`).

Les projets uniquement JSON peuvent exécuter :

```bash
npx ai-i18n-tools sync --no-ui --no-svg --no-docs
```

Lorsque l'interface ou la documentation sont également activées, `sync` exécute **translate-json après translate-docs** (sauf si `--no-json`). Ignorez la traduction JSON avec `--no-json`.

Vérifiez la couverture par fichier et par langue :

```bash
npx ai-i18n-tools status
```

Lorsque `translateJson` est activé, `status` affiche une section `json[]` (✓ à jour, ● périmée ou manquante).

<a id="workflow-3-vs-other-pipelines"></a>
### Workflow 3 par rapport aux autres pipelines

| Situation | Utilisation |
|-----------|-----|
| Chaînes d'interface dans `t("…")` / `i18n.t("…")` en JS/TS/Astro | [Workflow 1](#workflow-1---ui-translation) — `extract` + `translate-ui` |
| Traduction de pages Markdown/MDX/`.astro` ou de README | [Workflow 2](#workflow-2---document-translation) — `translate-docs` |
| Catalogue `write-translations` Docusaurus (`{ "key": { "message": "…", "description": "…" } }`) | Workflow 2 — `docs[].docusaurusCatalogDir` + `translate-docs`, **pas** `json[]` |
| JSON localisé imbriqué autonome (arborescences `translation.json` style ZenBrowser) | Workflow 3 — `json[]` + `translate-json` |
| Fichiers `.svg` illustrés avec `<text>` / `<title>` / `<desc>` | `features.translateSVG` + [`svg`](#svg) + `translate-svg` (facultatif ; pas un workflow numéroté) |

Référence des champs : [`json`](#json) dans la [Référence de configuration](#configuration-reference). Les clés de cache pour le nettoyage utilisent `json-block:{blockIndex}:{projectRelPath}` dans `file_tracking`.

---

<a id="combined-workflow-ui--docs"></a>
## Flux de travail combiné (interface utilisateur + documentation)

Activez toutes les fonctionnalités dans une seule configuration pour exécuter les deux flux de travail ensemble :

<details>
<summary>Exemple de configuration combinée pour l'interface utilisateur et la documentation</summary>

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-CN"],
  "features": {
    "translateUIStrings": true,
    "translateDocs": true,
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
  "docs": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "docsOutput": { "style": "flat" }
    }
  ]
}
```

</details>

<br />

`glossary.uiGlossary` oriente la traduction des documents vers le même catalogue `strings.json` que l'interface utilisateur afin que la terminologie reste cohérente ; `glossary.userGlossary` ajoute des remplacements CSV pour les termes du produit.

Exécutez `npx ai-i18n-tools sync` pour lancer un pipeline : lorsque `features.translateUIStrings` est activé, **extraire**, puis **traduire les chaînes d'interface** ; traduction **SVG facultative** (bloc `features.translateSVG` + `svg`) ; **traduction de la documentation** (selon la configuration de `docs[]`) ; puis **traduction-json** facultative (`features.translateJson` + `json[]`). Ignorez certaines étapes avec `--no-ui`, `--no-svg`, `--no-docs` ou `--no-json`. Les étapes de documentation et `json[]` acceptent `--dry-run`, `-p` / `--path`, `--force` et `--force-update` (les indicateurs propres à la documentation sont ignorés quand `--no-docs` ; JSON utilise les mêmes indicateurs de cache quand `--no-json` n'est pas défini).

Utilisez `docs[].targetLocales` sur un bloc pour traduire les fichiers de ce bloc vers un **sous-ensemble plus restreint** que l'interface (les langues effectives de la documentation correspondent à l'**union** entre les blocs) :

```json
{
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-CN"],
  "docs": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "targetLocales": ["de", "fr", "es"]
    }
  ]
}
```

<a id="mixed-documentation-workflow-docsoutputstyle--docusaurus--flat"></a>
### Workflow mixte pour la documentation (`docsOutput.style = "docusaurus"` + `"flat"`)

Vous pouvez combiner plusieurs pipelines de documentation dans la même configuration en ajoutant plusieurs entrées dans `docs`. C’est une configuration courante lorsqu’un projet inclut un site Docusaurus (`docsOutput.style = "docusaurus"`) ainsi que des fichiers Markdown au niveau racine (par exemple, un README de dépôt avec `docsOutput.style = "flat"`) devant être traduits avec des noms de fichiers suffixés par la langue.

<details>
<summary>Exemple de configuration mixte Docusaurus et README plat</summary>

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["ar", "es", "fr", "de", "pt-BR"],
  "features": {
    "translateUIStrings": true,
    "translateDocs": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "locales/strings.json",
    "flatOutputDir": "public/locales/"
  },
  "cacheDir": ".translation-cache",
  "docs": [
    {
      "description": "Docusaurus site content (markdown)",
      "contentPaths": ["docs-site/docs/"],
      "outputDir": "docs-site/i18n",
      "docusaurusCatalogDir": "docs-site/i18n/en",
      "addFrontmatter": true,
      "docsOutput": {
        "style": "docusaurus",
        "docsRoot": "docs-site/docs"
      }
    },
    {
      "description": "Root README with docsOutput.style flat",
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "docsOutput": {
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

</details>

<br />

Comment cela s'exécute avec `npx ai-i18n-tools sync` :

- Les chaînes d'interface sont extraites/traduites depuis `src/` vers `public/locales/`.
- Le premier bloc de documentation traduit les fichiers **Markdown** depuis `docs-site/docs/` vers `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/` (pages de documentation localisées).
- Avec `docs[].docusaurusCatalogDir` défini et `features.translateDocs` activé, ce même bloc traduit également le **JSON du shell Docusaurus** situé dans `docs-site/i18n/en/` vers chaque dossier de langue cible — barre de navigation, pied de page et catalogues de thèmes/plugins, mais pas le contenu des fichiers MDX.
- Le second bloc de documentation traduit `README.md` en fichiers suffixés par la langue dans `translated-docs/` (`docsOutput.style = "flat"`).
- Tous les blocs de documentation partagent `cacheDir`, ainsi les segments inchangés sont réutilisés entre les exécutions afin de réduire le nombre d'appels API et les coûts.

---

<a id="translation-dashboard"></a>
## Tableau de bord de traduction

Exécutez :

```bash
ai-i18n-tools dashboard
# Optional: choose port, do not auto-open browser
# ai-i18n-tools dashboard -p 8765 --no-open
```

Cela démarre une interface web locale s'appuyant sur la base de données SQLite `cacheDir` configurée — le même dossier que celui utilisé par l'interface en ligne de commande pour les segments de documentation, les journaux et les métadonnées associées. Elle inclut les onglets **Documentation** (segments de documentation mis en cache), **Chaînes d'interface**, **Pluriels d'interface**, **Glossaire**, **Échecs**, **Problèmes Markdown** et **Statistiques**.

![Translation Dashboard](../../docs/translation-dashboard.png)

Si vous **modifiez des lignes du cache** dans cette application (par exemple des segments de documentation), exécutez `sync --force-update` ou la commande de traduction équivalente avec `--force-update` afin que les sorties sur disque correspondent au cache ; si le **texte source** dans le dépôt change ultérieurement, les hachages des segments changent et les modifications manuelles apportées à l'ancien texte sont remplacées.

<a id="failures-document-translation"></a>
### Échecs (traduction de documents)

L'onglet **Échecs** concerne uniquement la traduction de la **documentation**. Il lit les enregistrements d'échec écrits dans SQLite lorsqu'un segment n'a pas pu être traduit correctement pour une langue donnée — par exemple sortie du modèle vide ou invalide, erreurs de validation après traduction (`AST mismatch`, fuites de variables, et autres contrôles de **qualité**), ou une condition **fatale** ayant bloqué l'avancement. Cela vous aide à répondre à la question : *quel segment source a échoué, pour quelle langue et quel modèle, et quel message d'erreur a été enregistré ?*

<a id="when-to-use-it"></a>
#### Quand l'utiliser

- Après que `translate-docs` ou `sync` se termine avec des erreurs, des langues partielles ou des journaux peu clairs — vous pouvez trier et filtrer les échecs au lieu de simplement faire défiler la sortie du terminal.
- Lorsque vous souhaitez **prioriser la refonte** : triez par **# Échecs** afin que les segments ayant échoué plusieurs fois lors des tentatives répétées apparaissent en premier ; ce sont de bons candidats pour être **simplifiés ou reformattés** dans le markdown source afin que les exécutions futures réussissent.
- Lorsque vous avez besoin du **segment exact** — chemin du fichier, indication de ligne, hachage source et texte source complet — pour modifier le bon paragraphe dans votre dépôt.

<a id="why-source-edits-matter"></a>
#### Pourquoi les modifications du code source sont importantes

Un balisage intégré dense (**gras** mélangé à `` `code` ``, emphases imbriquées, phrases longues comportant de nombreux spans) rend plus difficile pour les modèles la production de traductions qui passent encore les contrôles structurels. Les segments ayant **plusieurs échecs enregistrés** s'améliorent généralement davantage par une **réécriture ou une division** du code source (ou en déplaçant les exemples dans des blocs de code délimités) plutôt que par une nouvelle exécution de la traduction sur un texte inchangé. Cela correspond à [Markdown complexe et échecs des contrôles de qualité](#complex-markdown-and-failed-quality-checks).

<a id="how-to-use-the-tab"></a>
#### Comment utiliser l'onglet

1. Ouvrez **Échecs** dans le tableau de bord (dans la même session navigateur que [Translation Dashboard](#translation-dashboard)).
2. Lisez la **barre de synthèse** (segments comportant un échec, ainsi que les comptages pour les segments avec **1**, **2** ou **3+** enregistrements d’échec).
3. Filtrez par **nom de fichier** partiel, **langue**, **modèle**, **erreur de qualité** (valeurs provenant de votre cache), **uniquement les erreurs fatales**, et éventuellement par **hachage source**, **texte source** ou **message d’erreur** (sous-chaîne) — puis cliquez sur **Appliquer**.
4. Choisissez **Trier : # Échecs** (par défaut) ou **Trier : chemin du fichier + numéro de ligne**.
5. Utilisez la pagination en haut ou en bas du tableau. **Cliquez sur une ligne** pour basculer l’affichage du texte source complet. Le contrôle de lien dans la ligne (quand activé) demande au serveur de journaliser des indices fichier/ligne dans le **terminal** où `ai-i18n-tools dashboard` est en cours d’exécution — utile pour passer du navigateur à votre éditeur.
6. Corrigez le **fichier source** dans votre projet, puis relancez `translate-docs` ou `sync`. Si la liste semble **obsolète** après une exécution réussie, lancez `ai-i18n-tools sync --force-update` et rechargez le tableau de bord (le panneau Échecs affiche le même indice).

Pour le débogage basé sur les fichiers en parallèle de l'interface utilisateur, vous pouvez toujours utiliser `translate-docs --debug-failed` pour écrire les détails `FAILED-TRANSLATION` sous `cacheDir` lors des nouvelles tentatives — voir [Comportement du cache et indicateurs `translate-docs`](#cache-behaviour-and-translate-docs-flags).

<a id="markdown-issues-static-checks"></a>
### Problèmes Markdown (vérifications statiques)

L'onglet **Problèmes Markdown** liste les lignes de la table SQLite `markdown_source_issues`. Chaque ligne correspond à une détection **avant traduction** : par exemple des séquences de délimiteurs qui ne forment jamais de paires correctes pour l'italique ou le barré selon les règles de type CommonMark que `translate-docs` utilise pour le masquage, une portion de code en ligne ouverte avec des accents graves mais jamais fermée, `STRONG_OUTSIDE_INLINE_CODE` lorsque `**` / `__` encadrent une portion `` `...` `` (placez l'italique à l'intérieur des accents graves ou utilisez un code simple), ou `STRONG_OUTSIDE_LINK` lorsque `**` / `__` encadrent un lien `[text](../../docs/url)` (placez le gras uniquement à l'intérieur du texte du lien). Ceci n'est **pas** identique aux **Échecs**, qui enregistrent les problèmes de sortie du modèle par langue et les validations après traduction (`AST mismatch`, fuites d'espaces réservés, etc.).

Utilisez cet onglet lorsque vous souhaitez corriger le **markdown source** avant de consommer des jetons — en particulier lorsque les vérifications de qualité échouent systématiquement sur la structure. Filtrez par chemin de fichier (correspondance partielle avec la clé du cache, incluant les préfixes `doc-block:{index}:`), par **code d'incident** ou par **hachage source** ; triez par chemin de fichier + ligne ou par horodatage de scan le plus récent. Le bouton de lien enregistre les indices fichier/ligne dans le terminal où `ai-i18n-tools dashboard` est en cours d'exécution (même principe que l'onglet Documentation).

**Actualisation des lignes :** exécutez `ai-i18n-tools check-markdown` (portée facultative `-p` / `--path`, `--no-cache` pour ignorer SQLite, `--json` pour une sortie lisible par machine sur stdout avec les messages lisibles sur stderr). Par défaut, chaque exécution d'un fichier `translate-docs` markdown rescane et remplace également les lignes associées à ce fichier, sauf si `docs[].warnMarkdownSourceIssues` est défini sur `false`. Supprimer toutes les traductions pour un chemin de cache supprime aussi les lignes de problèmes Markdown associées à ce chemin dans le cadre du même processus de nettoyage que les échecs.

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

- Le manifeste se trouve en dehors de `ui.flatOutputDir` et vous devez indiquer explicitement son emplacement à l'interface en ligne de commande.
- Vous souhaitez utiliser le [post-traitement du sélecteur de langue](#language-switcher-languagelistblock) (`languageListBlock`) pour construire les libellés de langue à partir du manifeste.
- `extract` doit fusionner les entrées `englishName` du manifeste dans `strings.json` (nécessite `ui.reactExtractor.includeUiLanguageEnglishNames: true`).

<a id="concurrency-optional"></a>
### `concurrency` (facultatif)

Nombre maximal de **paramètres régionaux cibles** traduits simultanément (`translate-ui`, `translate-docs`, `translate-svg` et les étapes correspondantes dans `sync`). En l'absence de cette option, la CLI utilise **4** pour la traduction de l'interface utilisateur et **3** pour la traduction de la documentation (valeurs par défaut intégrées). Remplaçable lors de l'exécution via `-j` / `--concurrency`.

<a id="batchconcurrency-optional"></a>
### `batchConcurrency` (facultatif)

**translate-docs** et **translate-svg** (ainsi que l'étape de documentation de `sync`) : nombre maximal de requêtes par lot (**batch**) OpenRouter en parallèle par fichier (chaque lot pouvant contenir de nombreux segments). Valeur par défaut : **4** si omis. Ignoré par `translate-ui`. Remplaçable avec `-b` / `--batch-concurrency`. Sur `sync`, `-b` s'applique uniquement à l'étape de traduction de la documentation.

<a id="fileconcurrency-optional"></a>
### `fileConcurrency` (facultatif)

Nombre maximal de fichiers traités simultanément **dans une même langue** pendant `translate-docs` et `sync`. Lorsqu’il est défini à une valeur supérieure à **1**, les fichiers de la même langue sont traités en parallèle à l’aide d’un sémaphore pour contrôler l’utilisation de la mémoire. Valeur par défaut : **1** (traitement séquentiel) si omis. Des valeurs plus élevées peuvent améliorer significativement le débit pour les opérations liées aux E/S, en particulier lorsque tous les segments sont déjà mis en cache (aucun appel API nécessaire).

**Exemple :**

```json
{
  "fileConcurrency": 4
}
```

**Cas d’usage :** Définissez cette valeur à `2-4` lors de l’exécution de `sync --force-update` avec 100 % de succès de cache pour réduire le temps total de traitement. L’amélioration est particulièrement notable avec de nombreux petits fichiers.

<a id="batchsize--maxbatchchars-optional"></a>
### `batchSize` / `maxBatchChars` (facultatif)

Regroupement des segments pour la traduction de documents : nombre de segments par requête API et seuil maximal en caractères. Valeurs par défaut : **20** segments, **4096** caractères (lorsque non spécifié).

<a id="openrouter"></a>
### `openrouter`

- `baseUrl`
  URL de base de l'API OpenRouter. Valeur par défaut : `https://openrouter.ai/api/v1`.
- `translationModels`
  Liste ordonnée préférée des identifiants de modèles. Le premier est essayé en premier ; les suivants servent de secours en cas d'erreur. Pour `translate-ui` uniquement, vous pouvez aussi définir `ui.preferredModel` pour essayer un modèle avant cette liste (voir `ui`).
- `defaultModel`
  Modèle principal unique hérité. Utilisé uniquement si `translationModels` n'est pas défini ou est vide.
- `fallbackModel`
  Modèle de secours unique hérité. Utilisé après `defaultModel` si `translationModels` n'est pas défini ou est vide.
- `maxTokens`
  Nombre maximal de jetons de complétion par requête. Par défaut : `8192`.
- `temperature`
  Température d'échantillonnage. Par défaut : `0.2`.
- `requestTimeoutMs`
  Délai maximal en millisecondes d'attente pour chaque requête HTTP vers OpenRouter (complétions de discussion et appels internes `GET /models`). Par défaut : `30000` (30 secondes).

**Pourquoi utiliser plusieurs modèles :** Différents fournisseurs et modèles ont des coûts variables et offrent des niveaux de qualité différents selon les langues et les paramètres régionaux. Configurez `openrouter.translationModels` **comme une chaîne de secours ordonnée** (plutôt qu'un seul modèle), afin que la CLI puisse essayer le modèle suivant en cas d'échec d'une requête.

Considérez la liste ci-dessous comme une **base** que vous pouvez étendre : si la traduction pour un paramètre régional spécifique est médiocre ou échoue, recherchez quels modèles prennent efficacement en charge cette langue ou ce script (consultez les ressources en ligne ou la documentation de votre fournisseur), puis ajoutez ces identifiants OpenRouter comme alternatives supplémentaires.

Cette liste a été **testée pour une couverture étendue des paramètres régionaux** dans un vaste projet de documentation comportant 36 paramètres régionaux cibles ; elle sert de valeur par défaut pratique, mais n'est pas garantie pour fonctionner correctement dans tous les paramètres régionaux.

Exemple `translationModels` (mêmes valeurs par défaut que `npx ai-i18n-tools init`) :

<details>
<summary>Liste de secours par défaut pour translationModels</summary>

```json
"translationModels": [
  "qwen/qwen3-235b-a22b-2507",
  "openai/gpt-4o-mini",
  "deepseek/deepseek-v4-flash",
  "anthropic/claude-3-haiku",
  "qwen/qwen3.6-plus",
  "anthropic/claude-3.5-haiku",
  "google/gemini-3-flash-preview",
  "~anthropic/claude-haiku-latest",
  "google/gemma-4-31b-it",
  "~anthropic/claude-sonnet-latest"
  // … add more fallback models as needed
]
```

</details>

<br />

Définissez `OPENROUTER_API_KEY` dans votre environnement ou dans le fichier `.env`.

Avant de changer `translationModels`, exécutez `npx ai-i18n-tools check-models` pour vérifier chaque identifiant de modèle configuré par rapport au catalogue en direct d'OpenRouter (`GET /models`). Il signale les identifiants manquants ou dépassés `expiration_date`, liste les modèles valides avec une estimation des prix d'entrée/sortie (USD par 1M de tokens), et se termine avec un statut non nul lorsque tout identifiant configuré est invalide. Nécessite `OPENROUTER_API_KEY`.

<a id="features"></a>
### `features`

| Champ | Flux de travail | Description |
|----------------------|----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `translateUIStrings` | 1 | Extraire `t("…")` / `i18n.t("…")` dans `strings.json`, puis traduire les entrées et générer des fichiers JSON plats par langue (l'extraction s'exécute automatiquement ; utilisez `extract` autonome pour actualiser uniquement le catalogue). |
| `translateDocs` | 2 | Traduire les pages `.md` / `.mdx` / `.astro` ; fichier conteneur Docusaurus en JSON lorsque `docs[].docusaurusCatalogDir` est défini. |
| `translateJson` | 3 | JSON arbitraire imbriqué sous `json[]` (`translate-json`). |
| `translateSVG` | — | Traduire les fichiers `.svg` (nécessite le bloc `svg` au niveau racine). |

Traduire les fichiers **SVG** avec `translate-svg` lorsque `features.translateSVG` est à true et qu'un bloc racine `svg` est configuré. La commande `sync` exécute cette étape lorsque les deux conditions sont remplies (sauf si `--no-svg`).

<a id="ui"></a>
### `ui`

- `sourceRoots`  
  Répertoires ou motifs glob (relatifs au répertoire courant) analysés pour les appels `t("…")`. Prend en charge des motifs comme `src/` ou `["src/**/*.ts"]`.
- `stringsJson`  
  Chemin vers le fichier du catalogue principal. Mis à jour par `extract`.
- `flatOutputDir`  
  Répertoire où sont écrits les fichiers JSON par langue (`de.json`, etc.).
- `preferredModel`  
  Facultatif. Identifiant de modèle OpenRouter essayé en premier pour `translate-ui` uniquement ; puis `openrouter.translationModels` (ou modèles anciens) dans l'ordre, sans dupliquer cet identifiant.
- `uiExtractor.funcNames` (ou l'ancien `reactExtractor.funcNames`)  
  Noms de fonctions supplémentaires à analyser (par défaut : `["t", "i18n.t"]`).
- `uiExtractor.extensions` (ou l'ancien `reactExtractor.extensions`)  
  Extensions de fichiers à inclure (par défaut : `[".js", ".jsx", ".ts", ".tsx"]`). Ajoutez `.astro` pour le frontmatter Astro et les expressions de modèle.
- `uiExtractor.includePackageDescription` (ou l'ancien `reactExtractor.includePackageDescription`)  
  Lorsque `true` (par défaut), `extract` inclut également `package.json` `description` comme chaîne d'interface quand elle est présente.
- `uiExtractor.packageJsonPath` (ou l'ancien `reactExtractor.packageJsonPath`)  
  Chemin personnalisé vers le fichier `package.json` utilisé pour cette extraction facultative de description.
- `uiExtractor.includeUiLanguageEnglishNames` (ou l'ancien `reactExtractor.includeUiLanguageEnglishNames`)

Lorsque `true` (par défaut `false`), `extract` ajoute également chaque `englishName` du manifeste situé à `uiLanguagesPath` à `strings.json` s'il n'est pas déjà présent dans l'analyse source (mêmes clés de hachage). Nécessite `uiLanguagesPath` pointant vers un fichier `ui-languages.json` valide.

<a id="cachedir"></a>
### `cacheDir`

- `cacheDir`
Répertoire de cache SQLite (partagé par tous les blocs `docs`). Réutilisé entre les exécutions. Si vous migrez depuis un cache personnalisé de traduction de documentation, archivez-le ou supprimez-le — `cacheDir` crée sa propre base de données SQLite et n'est pas compatible avec d'autres schémas.

<a id="best-practice-for-git-exclusions"></a>
#### Bonnes pratiques pour les exclusions git :

- Excluez le contenu du dossier de cache de traduction (par exemple, en utilisant `.gitignore` ou `.git/info/exclude`) afin d'éviter de valider des artefacts temporaires.
- Conservez `cache.db` (ne le supprimez pas systématiquement), car la préservation du cache SQLite évite de retraduire des segments inchangés. Cela permet d'économiser à la fois du temps d'exécution et des coûts d'API lors de la mise à jour ou de la modification d'un logiciel utilisant `ai-i18n-tools`.
- Excluez les fichiers temporaires et les fichiers journaux pour éviter de valider des fichiers de sauvegarde ou de débogage.

<br/>

**Exemple :**

```gitignore
# Translation cache directory
.translation-cache/*

# Keep SQLite cache for reuse
!.translation-cache/cache.db

# Temporary and log files
*.tmp
*.log
```

<a id="docs"></a>
### `docs`

Tableau de blocs du pipeline de documentation. `translate-docs` et la phase docs de `sync` **traitent chaque** bloc dans l'ordre. Les clés héritées (`documentations`, `markdownOutput`, `jsonSource`) sont encore acceptées au chargement et réécrites lorsque le fichier de configuration est modifiable ; privilégiez `docs`, `docsOutput` et `docusaurusCatalogDir` dans les nouvelles configurations.

**Sources de contenu**

- `description`
Note facultative lisible par l'humain pour ce bloc (non utilisée pour la traduction). Préfixe dans le titre `translate-docs` `🌐` lorsqu'elle est définie ; également affichée dans les en-têtes de section `status`.
- `contentPaths`
Corps de pages Markdown/MDX et modèles `.astro` à traduire (`translate-docs` analyse ceux-ci pour `.md`, `.mdx` et `.astro`). Prend en charge les **chemins de répertoire ou les motifs glob** (par exemple `"docs/**/*.md"`, `"guides/*.mdx"`, `"src/pages/index.astro"`). C'est là que provient la prose documentaire localisée.
- `sourceFiles`
Alias facultatif fusionné dans `contentPaths` au chargement.
- `targetLocales`
Sous-ensemble facultatif de paramètres régionaux pour ce bloc uniquement (sinon utilise `targetLocales` au niveau racine). Les paramètres régionaux de documentation effectifs sont l'union entre tous les blocs.
- `docusaurusCatalogDir`
Facultatif. Répertoire source des catalogues de libellés JSON Docusaurus pour ce bloc (par exemple `"i18n/en"` depuis `docusaurus write-translations`). Les corps de page proviennent toujours de `contentPaths` ; `docusaurusCatalogDir` fournit uniquement les fichiers JSON d'interface (shell/UI), pas les fichiers MDX.

**Disposition de sortie**

- `outputDir`
Répertoire racine pour la sortie traduite de ce bloc.
- `docsOutput.style`
`"nested"` (par défaut), `"flat"`, `"doc-system"`, ou les alias `"docusaurus"` / `"astro-starlight"`.
- `docsOutput.localeSubpath`
Segment de chemin entre `{locale}/` et `{relativeToDocsRoot}` pour `doc-system` (obligatoire lors de l'utilisation directe de `style: "doc-system"` ; prédéfini lors de l'utilisation d'un alias). Utilisez `""` pour des dossiers de paramètres régionaux au style Starlight.
- `docsOutput.docsRoot`
Répertoire racine de la documentation source pour la mise en page Docusaurus (par exemple `"docs"`).
- `docsOutput.pathTemplate`
Chemin personnalisé de sortie Markdown. Espaces réservés : <code>"{outputDir}"</code>, <code>"{locale}"</code>, <code>"{LOCALE}"</code>, <code>"{llocale}"</code>, <code>"{relPath}"</code>, <code>"{stem}"</code>, <code>"{basename}"</code>, <code>"{extension}"</code>, <code>"{docsRoot}"</code>, <code>"{relativeToDocsRoot}"</code>.
- `docsOutput.jsonPathTemplate`
Chemin personnalisé de sortie JSON pour les fichiers de libellés. Prend en charge les mêmes espaces réservés que `pathTemplate`.
- `docsOutput.localePathLowercase`
Lorsque `true`, les schémas de sortie intégrés (`nested`, `flat`, `doc-system` sans `pathTemplate`) utilisent des segments de paramètres régionaux en minuscules dans les chemins. Valeur par défaut `false` ; `astro-starlight` et `doc-system` avec `localeSubpath` vide prennent par défaut `true` au chargement de la configuration.
- `docsOutput.flatPreserveRelativeDir`
Lorsque `docsOutput.style = "flat"`, conserve les sous-répertoires sources afin que les fichiers ayant le même nom de base ne provoquent pas de conflit.
- `docsOutput.rewriteRelativeLinks`
Réécriture des liens relatifs après traduction (activée automatiquement lorsque `docsOutput.style = "flat"` et aucun `pathTemplate` personnalisé).
- `docsOutput.linkRewriteDocsRoot`
Racine du dépôt utilisée lors du calcul des préfixes de réécriture des liens plats. Laissez généralement cette valeur à `"."` sauf si vos documents traduits se trouvent sous une racine de projet différente.

**Post-traitement**

- `docsOutput.postProcessing`
Transformations facultatives appliquées au **corps markdown traduit** (les clés YAML et les valeurs de front matter non textuelles sont conservées). S'exécute après le réassemblage des segments et la réécriture des liens plats, et avant `addFrontmatter`.
- `docsOutput.postProcessing.regexAdjustments`
Liste ordonnée de `{ "description"?, "search", "replace" }`. `search` est un motif regex (une chaîne simple utilise le drapeau `g`, ou `/pattern/flags`). `replace` prend en charge des espaces réservés tels que `${translatedLocale}`, `${sourceLocale}`, `${sourceFullPath}`, `${translatedFullPath}`, `${sourceFilename}`, `${translatedFilename}`, `${sourceBasedir}`, `${translatedBasedir}`.
- `docsOutput.postProcessing.languageListBlock`
`{ "start", "end", "separator", "label"? }` — régénère une ligne limitée de liens « lire dans d'autres langues » dans les fichiers markdown source et traduits. Consultez [Sélecteur de langue (`languageListBlock`)](#language-switcher-languagelistblock) pour la configuration, le comportement et des exemples de dépôts.

**Comportement et métadonnées**

- `translateFrontmatterFields`
Même niveau que `docsOutput` (par bloc `docs[]`). Par défaut `true` : traduire le texte YAML destiné à l'utilisateur pour Starlight/Docusaurus (étiquettes `title`, `description`, `sidebar.label`, `sidebar_label`, `keywords`, `hero.title`, `hero.tagline`, `hero.image.alt`, `hero.actions[].text`, `pagination_label`, `prev`/`next`). Définir `false` pour conserver le bloc de front matter inchangé ; fournir un tableau de chaînes pour restreindre à des chemins pointés spécifiques.
- `segmentSplitting`
Même niveau que `docsOutput` (par bloc `docs[]`). Segments facultatifs plus précis pour l'extraction `translate-docs` : `{ "enabled", "maxCharsPerSegment"?, "splitPipeTables"?, "splitDenseParagraphs"?, "maxLinesPerParagraphChunk"?, "splitLongLists"?, "maxListItemsPerChunk"? }`. Lorsque `enabled` vaut `true` (par défaut si `segmentSplitting` est omis), les paragraphes denses, les tableaux GFM avec délimiteur (le premier segment inclut l'en-tête, le séparateur et la première ligne de données) et les longues listes sont divisés ; les sous-parties sont réunies avec des sauts de ligne simples (`tightJoinPrevious`). Définir `"enabled": false` pour utiliser un segment par bloc de texte délimité par une ligne vide uniquement.
- `warnMarkdownSourceIssues`
Lorsque `true` (par défaut si omis), chaque exécution de `translate-docs` analyse à nouveau les segments Markdown à la recherche de délimiteurs risqués ou de code en ligne non fermé, affiche des avertissements dans le terminal, et remplace les lignes `markdown_source_issues` pour le chemin du fichier cache de ce fichier. Définir `false` pour ignorer les avertissements et les mises à jour SQLite pour ce bloc.
- `addFrontmatter`
Lorsque `true` (par défaut si omis), les fichiers Markdown traduits incluent les clés YAML : `translation_last_updated`, `source_file_mtime`, `source_file_hash`, `translation_language`, `source_file_path`, et lorsqu'au moins un segment contient des métadonnées de modèle, `translation_models` (liste triée des identifiants de modèles OpenRouter utilisés). Définir sur `false` pour ignorer.

<a id="protectattributes-protectkeys"></a>
- `protectAttributes`
Facultatif. Noms d'attributs JSX/HTML supplémentaires dont les **valeurs chaînes entre guillemets** ne doivent pas être envoyées au traducteur. Fusionnés avec les valeurs par défaut intégrées (`class`, `id`, `style`, `src`, `href`, `type`, `data-*`, la plupart des `aria-*`, etc.). Insensible à la casse. S'applique à :

- `.astro` extraction de parse-and-replace (balises HTML statiques et littéraux de chaîne après `attr=` à l'intérieur des blocs `{expression}`).
  - Extraction de placeholder MDX lors de la traduction de segments markdown/Astro (`label`, `tooltip`, et `aria-label` sur les balises JSX en majuscules, plus `TabItem` `value` lorsque cela est applicable).

Exemple : `"protectAttributes": ["variant", "size"]` conserve `variant="primary"` à l'intérieur de `{items.map(...)}` inchangé quel que soit le paramètre régional.

Vous pouvez également lister des attributs normalement traduisibles (par exemple `"title"` ou `"aria-label"`) lorsque vous souhaitez que ces valeurs soient copiées telles quelles depuis l'anglais.

- `protectKeys`
Facultatif. Autres **noms de propriétés d'objet** dont les valeurs entre guillemets ne doivent pas être traduites à l'intérieur des blocs modèles `{expression}` et des littéraux objets MDX (par exemple `label:` à l'intérieur de `<Tabs values={[ … ]}>`). Fusionnés avec les valeurs par défaut intégrées (`class`, `key`, `id`, `href`, `src`, etc.). Insensible à la casse.

Exemple : `"protectKeys": ["slug", "code"]` ignore `{ slug: 'getting-started', title: 'Getting started' }` → seul `title` est traduit lorsque `slug` est protégé.

<br/>

**Exemple (`docsOutput.style = "flat"` — chemins des captures d'écran + enveloppe facultative de liste de langues) :**

<details>
<summary>Exemple de post-traitement en disposition plate (captures d'écran + bloc de liste des langues)</summary>

```json
"docsOutput": {
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

</details>

<a id="json"></a>
### `json`

Tableau de premier niveau contenant des pipelines JSON imbriqués de traduction. Utilisé uniquement lorsque `features.translateJson` est vrai (`translate-json` ou l'étape JSON de `sync`). Voir [Workflow 3 - Traduction de fichiers JSON](#workflow-3---json-file-translation).

| Champ | Description |
|-------|-------------|
| `description` | Note facultative pour CLI / `status` (non traduite). |
| `contentPaths` | Fichiers, répertoires ou motifs `.json` sources situés sous la racine du projet. |
| `outputPathTemplate` | Chemin de sortie requis par langue cible. Espaces réservés : `{locale}`, `{LOCALE}`, `{llocale}`, `{stem}`, `{basename}`, `{extension}`, `{relativeToSourceRoot}`. |
| `targetLocales` | Sous-ensemble facultatif pour ce bloc ; sinon racine `targetLocales`. |
| `keyPolicy.mode` | `allowlist`, `denylist` ou `both`. |
| `keyPolicy.translateKeys` | Chemins pointés / motifs à inclure lorsque le mode est `allowlist` ou `both`. |
| `keyPolicy.skipKeys` | Chemins pointés / motifs à exclure (la liste de refus par défaut inclut `id`, `slug`, `href`, `url`, `key`, `code`). |

<a id="svg"></a>
### `svg`

Chemins et structure de niveau supérieur pour les fichiers SVG. La traduction s'exécute uniquement lorsque `features.translateSVG` est vrai (via `translate-svg` ou l'étape SVG de `sync`).

| Champ            | Description                                                                                                                                                                                                                                                        |
|------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `sourcePath`     | Un ou plusieurs répertoires **ou motifs glob** (par exemple `"images/*.svg"`, `"**/icons/*.svg"`). Les motifs sont résolus par rapport à la racine du projet et analysés récursivement pour les fichiers `.svg`.                                                                         |
| `outputDir`                   | Répertoire racine pour la sortie SVG traduite.                                                                                                                                                                                                                                          |
| `style`                       | `"flat"` ou `"nested"` lorsque `pathTemplate` n'est pas défini.                                                                                                                                                                                                                               |
| `pathTemplate`   | Chemin de sortie personnalisé pour les fichiers SVG. Espaces réservés : <code>"{outputDir}"</code>, <code>"{locale}"</code>, <code>"{LOCALE}"</code>, <code>"{llocale}"</code>, <code>"{relPath}"</code>, <code>"{stem}"</code>, <code>"{basename}"</code>, <code>"{extension}"</code>, <code>"{relativeToSourceRoot}"</code>. |
| `localePathLowercase` | Lorsque `true`, les modèles SVG intégrés `flat` / `nested` utilisent des segments de paramètres régionaux en minuscules. Les valeurs personnalisées de `pathTemplate` restent inchangées ; utilisez `{llocale}` pour des segments en minuscules. |
| `forceLowercase` | Texte traduit en minuscules lors du réassemblage du SVG. Utile pour les designs qui reposent sur des libellés entièrement en minuscules.                                                                                                                                                                                |

<a id="glossary"></a>
### `glossary`

| Champ          | Description                                                                                                                                                                 |
|----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `uiGlossary`   | Chemin vers `strings.json` - génère automatiquement un glossaire à partir des traductions existantes.                                                                                                 |
| `userGlossary` | Chemin vers un fichier CSV avec les colonnes `Original language string` (ou `en`), `locale`, `Translation` - une ligne par terme source et langue cible (`locale` peut être `*` pour toutes les cibles). |

**Générer un fichier CSV de glossaire vide :**

```bash
npx ai-i18n-tools glossary-generate
```

---

<a id="cli-reference"></a>
## Référence CLI

| Command                                                                                                    | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
|------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `version`                                                                                                  | Affiche la version de l'interface en ligne de commande et l'horodatage de compilation (les mêmes informations que `-V` / `--version` du programme racine).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `init [-t ui-markdown\|ui-docusaurus\|ui-starlight\|ui-astro-website\|ui-json-bundles] [-o path] [--with-translate-ignore]` | Écrire un fichier de configuration initial (inclut `concurrency`, `batchConcurrency`, `batchSize`, `maxBatchChars` et `docs[].addFrontmatter`). `ui-json-bundles` génère le squelette du Workflow 3 (`json[]` uniquement). `--with-translate-ignore` crée un modèle `.translate-ignore` initial.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `check-models`                                                                           | Valider chaque identifiant de modèle OpenRouter configuré par rapport à `GET /models` (appartenance au catalogue, `expiration_date`, USD par million de jetons pour l'invite/réponse). Nécessite `OPENROUTER_API_KEY`. Quitte avec un code d'erreur si un identifiant configuré est manquant ou expiré. Respecte `openrouter.requestTimeoutMs` pour la requête de catalogue.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `extract` | Mettre à jour `strings.json` à partir des littéraux `t("…")` / `i18n.t("…")`, description facultative `package.json` et entrées facultatives du manifeste `englishName` (voir `ui.reactExtractor`). Nécessite `ui.sourceRoots` non vide. |
| `generate-ui-languages [--master <path>] [--dry-run]`                                    | Écrire `ui-languages.json` dans `ui.flatOutputDir` (ou `uiLanguagesPath` si défini) à l’aide de `sourceLocale` + `targetLocales` et du `data/ui-languages-complete.json` intégré (ou `--master`). Affiche un avertissement et émet des espaces réservés `TODO` pour les paramètres régionaux manquants dans le fichier maître. Si vous disposez d’un manifeste existant avec des valeurs personnalisées pour `label` ou `englishName`, elles seront remplacées par les valeurs par défaut du catalogue maître — examinez et ajustez le fichier généré par la suite.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `translate-docs …`                                                                                         | Traduire le markdown/MDX et le JSON pour chaque bloc `docs` (`contentPaths`, `docusaurusCatalogDir` facultatif). `-j` : nombre maximal de langues parallèles ; `-b` : nombre maximal d'appels API par lot par fichier. `--prompt-format` : format de transmission par lot (`xml` \| `json-array` \| `json-object`). Voir [Comportement du cache et indicateurs `translate-docs`](#cache-behaviour-and-translate-docs-flags) et [Format des invites par lot](#batch-prompt-format).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `write-heading-ids …`                                                                                      | Nécessite au moins un bloc `docs[]`. Rassemble les éléments `.md` / `.mdx` sous le `contentPaths` de chaque bloc (respecte `.translate-ignore`). Insère une ligne d'ancre HTML `<a id="slug"></a>` immédiatement **avant** chaque en-tête ATX plat `#` (saute les en-têtes situés dans les blocs de code délimités) ; lorsqu'une ligne d'ancre est déjà présente, met à jour le `id` si celui-ci ne correspond plus au slug dérivé du texte actuel de l'en-tête. `-p` / `--path` ou `-f` / `--file` : limite à un fichier ou un répertoire relatif au projet. `--slug-style` : `github` (par défaut ; doctoc / anchor-markdown-header), `bitbucket`, `gitlab`, `pymdown`, `azure-devops`. Avec `pymdown`, `--pymdown-case` facultatif, `--pymdown-normalize`, `--pymdown-percent-encode` / `--no-pymdown-percent-encode`. `--dry-run` : affiche uniquement les modifications.                                                                                                                                                                                                                                                                                                                                    |
| `strip-md-bold-inline …`                                                                                   | Nécessite au moins un bloc `docs[]`. Supprime les éléments `**` autour du code en ligne dans les éléments `.md` / `.mdx` sous le `contentPaths` de chaque bloc (respecte `.translate-ignore`). `-p` / `--path` ou `-f` / `--file`, `--dry-run`, `--no-backup` (ignore les éléments `.backup.*` horodatés avant écrasement).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `check-markdown …`                                                                                         | Analyse le markdown/MDX sous chaque bloc `docs[]` dans `contentPaths` (même découverte que `translate-docs`, respecte `.translate-ignore`) : paires de délimiteurs, code en ligne non fermé, et `STRONG_OUTSIDE_INLINE_CODE` / `STRONG_OUTSIDE_LINK` lorsque `**`/`__` encadrent un segment `` `...` `` ou un lien `[text](../../docs/url)`. `-p` / `--path` ou `-f` / `--file` : portée facultative. Affiche les lignes `relativePath:line: [ISSUE_CODE] message` sur **stderr** ; code de sortie **1** s’il y a un problème. `--json` : rapport JSON sur **stdout**. Écrit `markdown_source_issues` dans `cacheDir` sauf si `--no-cache`. `-v` ajoute les hachages des sources aux lignes stderr.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `translate-svg …`                                                                        | Traduit les fichiers SVG configurés dans `config.svg` (distincts de la documentation). Nécessite `features.translateSVG`. Mêmes principes de cache que pour la documentation ; prend en charge `--no-cache` pour ignorer les lectures/écritures SQLite lors de cette exécution. `-j`, `-b`, `--force`, `--force-update`, `-p` / `--path`, `--dry-run`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `translate-ui [-l <codes>] [--force] [--dry-run] [-j <n>]`                               | Traduire uniquement les chaînes d'interface utilisateur (`strings.json` → JSON de localisation). `-l` / `--locale` : listes de localisations cibles séparées par des virgules (par défaut depuis la configuration / `ui-languages.json`). `--force` : traduire à nouveau toutes les entrées par localisation (ignorer les traductions existantes). `--dry-run` : aucun enregistrement, aucun appel API. `-j` : nombre maximal de localisations en parallèle. Nécessite `features.translateUIStrings`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `translate-json …`                                                                                         | Traduit le JSON imbriqué selon `json[]` (nécessite `features.translateJson`). Cache SQLite partagé ; `-l`, `-p` / `--path`, `--dry-run`, `--force`, `--force-update`, `-b`, `--prompt-format`. Voir [Workflow 3](#workflow-3---json-file-translation).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `sync-ui [-l <codes>] [--force] [--dry-run] [-j <n>]`                                                      | Extrait, puis traduit les chaînes d’interface (nécessite `features.translateUIStrings`). Interface uniquement — pas de documentation, SVG ou `json[]`. Mêmes options `-l`, `--force`, `--dry-run` et `-j` que `translate-ui`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `lint-source [-l <code>] [--chunk <n>] [--dry-run] [--json] [-j <n>]`                                      | Exécute `extract` **en premier** (nécessite `features.translateUIStrings`) afin que `strings.json` corresponde à la source, puis analyse par un LLM des chaînes d'interface utilisateur **source-locale** (orthographe, grammaire). Les **indices de terminologie** proviennent uniquement du fichier CSV `glossary.userGlossary` (même périmètre que `translate-ui` — pas `strings.json` / `uiGlossary`, afin de ne pas renforcer une mauvaise formulation comme entrée de glossaire). Utilise OpenRouter (`OPENROUTER_API_KEY`). À titre indicatif uniquement (sortie avec code **0** à la fin de l'exécution). Génère `lint-source-results_<timestamp>.log` dans `cacheDir` sous forme de rapport **lisible par un humain** (résumé, problèmes, et lignes **OK** par chaîne) ; le terminal affiche uniquement les comptages récapitulatifs et les problèmes (pas de lignes `[ok]` par chaîne). Affiche le nom du fichier journal sur la dernière ligne. `--json` : génère uniquement sur la sortie standard un rapport JSON entièrement lisible par machine (le fichier journal reste lisible par un humain). `--dry-run` : exécute tout de même `extract`, puis affiche uniquement le plan de traitement par lots (pas d'appels API). `--chunk` : nombre de chaînes par lot d'API (par défaut **50**). `-j` : nombre maximal de lots en parallèle (par défaut `concurrency`). Avec `--json`, la sortie au format humain est redirigée vers stderr. Les liens utilisent `path:line`, comme le bouton « lien » dans les chaînes d'interface utilisateur `dashboard`. |
| `export-ui-xliff [-l <codes>] [-o <dir>] [--untranslated-only] [--dry-run]`              | Exporter `strings.json` vers XLIFF 2.0 (un `.xliff` par langue cible). `-o` / `--output-dir` : répertoire de sortie (par défaut : même dossier que le catalogue). `--untranslated-only` : uniquement les unités manquantes d'une traduction pour cette langue. Lecture seule ; aucune API.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `sync …`                                                                                                   | Extraction (si activée), puis traduction de l'interface utilisateur, puis `translate-svg` lorsque `features.translateSVG` et `config.svg` sont définis, puis traduction de la documentation, puis `translate-json` lorsque `features.translateJson` et `json[]` sont définis — sauf si ignoré avec `--no-ui`, `--no-svg`, `--no-docs` ou `--no-json`. Options partagées : `-l`, `-p` / `-f`, `--dry-run`, `-j`, `-b` (regroupement par lots de la documentation et du JSON), `--force` / `--force-update` (documentation et JSON). La phase de documentation transmet également `--emphasis-placeholders` et `--debug-failed` (même signification que `translate-docs`). `--prompt-format` n'est pas un indicateur `sync` ; les étapes de documentation et JSON utilisent la valeur par défaut intégrée (`json-array`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `status [--max-columns <n>]`                                                             | Lorsque `features.translateUIStrings` est activé, affiche le taux de couverture de l'interface utilisateur par langue (`Translated` / `Missing` / `Total`). Affiche ensuite l'état de la traduction Markdown par fichier × langue (aucun filtre `--locale` ; les langues proviennent de la configuration). Les listes importantes de langues sont divisées en plusieurs tableaux répétés d'au plus `n` colonnes de langues (par défaut **9**) afin que les lignes restent étroites dans le terminal.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `statistics [--max-columns <n>]`                                                         | Affiche le cache de la documentation et les statistiques de `strings.json` (agrégats identiques à ceux du Tableau de bord des traductions → **Statistiques**). `--max-columns` : nombre maximal de colonnes par modèle et par table de localisation (par défaut, correspond au tableau de bord).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `cleanup [--dry-run] [--no-backup] [--backup <path>]`                                    | Exécute d'abord `sync --force-update` (extraction, interface utilisateur, SVG, documentation), puis supprime les lignes de segments obsolètes (`last_hit_at` nul / chemin de fichier vide) ; supprime les lignes de `file_tracking` dont le chemin source résolu est manquant sur le disque ; supprime les lignes de traduction dont les métadonnées `filepath` pointent vers un fichier manquant. Affiche trois compteurs (segments obsolètes, `file_tracking` orphelins, traductions orphelines). Crée une sauvegarde SQLite horodatée dans le répertoire du cache, sauf si `--no-backup`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `clean-temp [-r\|--root <path>] [-f\|--force] [--dry-run]`                               | **Pas de configuration.** Parcourt l'arborescence d'un répertoire (par défaut : répertoire courant) à la recherche de `*.log` et de `cache.db.backup*.sqlite`, affiche les chemins `./…` comme `find -print`. S'il y a des correspondances : demande confirmation `Delete these files? (y/n)` sauf si `-f` / `--force` (suppression sans confirmation). S'il n'y a aucune correspondance : quitte sans demander confirmation. `--dry-run` : affichage uniquement, pas de confirmation ni de suppression (remplace `--force`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `dashboard [-p <port>] [--no-open]`                                                      | Lance le tableau de bord de traduction (interface web locale pour les segments du cache, `strings.json`, glossaire, échecs et statistiques). Avec `--no-open`, le navigateur par défaut n'est pas ouvert automatiquement. L'alias obsolète `editor` fonctionne toujours mais affiche un avertissement.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `glossary-generate [-o <path>]`                                                          | Écrit un modèle `glossary-user.csv` vide. `-o` : remplace le chemin de sortie (par défaut : `glossary.userGlossary` depuis la configuration, ou `glossary-user.csv`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `help [command]`                                                                         | Affiche l'aide pour une sous-commande (sortie identique à `ai-i18n-tools <command> --help`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

<a id="root-and-global-options"></a>
### Options racine et globales

| Option                       | Portée         | Description                                                                               |
|------------------------------|---------------|-------------------------------------------------------------------------------------------|
| `-V` / `--version`           | Programme racine  | Affiche le numéro de version et l'horodatage de compilation (même information que la sous-commande `version`). |
| `-h` / `--help`              | Programme racine  | Affiche l'aide pour le programme racine ou pour une sous-commande lorsqu'utilisé avec un nom de commande.      |
| `-c` / `--config <path>`     | Chaque commande | Chemin du fichier de configuration (par défaut : `ai-i18n-tools.config.json`).                                  |
| `-v` / `--verbose`           | Chaque commande | Journalisation détaillée.                                                                          |
| `-w` / `--write-logs [path]` | Chaque commande | Duplique la sortie console dans un fichier `.log` (chemin par défaut : dans le répertoire racine `cacheDir`).                |

<a id="per-command-help"></a>
### Aide par commande

| Utilisation                            | Description                        |
|----------------------------------|------------------------------------|
| `ai-i18n-tools <command> --help` | Toutes les options pour cette commande.      |
| `ai-i18n-tools help <command>`   | Même sortie que `<command> --help`. |

<a id="target-locales--l----locale"></a>
### Paramètres régionaux cibles (`-l` / `--locale`)

| Commandes                                                                                | Comportement                                                                                                                                              |
|-----------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| `translate-docs`, `translate-json`, `translate-svg`, `translate-ui`, `sync`, `sync-ui`, `export-ui-xliff` | `-l` / `--locale <codes>` — codes BCP-47 cibles séparés par des virgules (par exemple `de,fr,pt-BR`). En l'absence, les valeurs par défaut proviennent du fichier de configuration (les blocs `json[]` peuvent également définir un `targetLocales` par bloc). Les étapes d'interface utilisateur utilisent également `ui-languages.json`. |
| `lint-source`                                                                           | `-l` / `--locale <code>` — locale source unique à examiner (par défaut : configuration `sourceLocale`).                                                            |

---

<a id="environment-variables"></a>
## Variables d'environnement

| Variable               | Description                                                |
|------------------------|------------------------------------------------------------|
| `OPENROUTER_API_KEY`   | **Obligatoire.** Votre clé API OpenRouter.                     |
| `OPENROUTER_BASE_URL`   | Remplacer l'URL de base de l'API.                                 |
| `I18N_SOURCE_LOCALE`    | Remplacer `sourceLocale` au moment de l'exécution.                        |
| `I18N_TARGET_LOCALES`   | Codes de langue séparés par des virgules pour remplacer `targetLocales`.  |
| `I18N_LOG_LEVEL`        | Niveau du journaliseur (`debug`, `info`, `warn`, `error`, `silent`). |
| `NO_COLOR`              | Lorsque `1`, désactiver les couleurs ANSI dans la sortie du journal.              |
| `I18N_LOG_SESSION_MAX`  | Nombre maximal de lignes conservées par session de journal (par défaut `5000`).           |
