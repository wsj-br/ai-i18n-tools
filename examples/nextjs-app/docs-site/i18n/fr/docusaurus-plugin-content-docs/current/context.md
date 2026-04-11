---
translation_last_updated: '2026-04-11T03:31:23.218Z'
source_file_mtime: '2026-04-11T03:30:13.297Z'
source_file_hash: 5f9c6a0c2a3bfe9a86da9ff07c86e5c69480ada8a3908d87506d35d7fe8ae368
translation_language: fr
source_file_path: docs-site/docs/context.md
---
# ai-i18n-tools : contexte de l'agent IA

Ce document fournit à un agent IA le modèle mental, les décisions clés et les schémas nécessaires pour travailler efficacement avec `ai-i18n-tools` sans avoir à consulter tous les autres documents au préalable. Lisez ceci avant d'apporter des modifications au code ou à la configuration.

<!-- DOCTOC SKIP -->

---

## Ce que fait ce package {#what-this-package-does}

`ai-i18n-tools` est un outil en ligne de commande (CLI) et une bibliothèque qui automatisent l'internationalisation pour les projets JavaScript/TypeScript. Il :

1. **Extrait** les chaînes d'interface utilisateur depuis le code source (appels `t("…")`) vers un catalogue maître.
2. **Traduit** ce catalogue et les fichiers de documentation via des modèles linguistiques (LLM) via OpenRouter.
3. **Génère** des fichiers JSON prêts à l'emploi par locale pour i18next, ainsi que des copies traduites des documents au format markdown/SVG/JSON.
4. **Exporte des utilitaires à exécution** pour intégrer i18next, le support RTL et la sélection de langue dans n'importe quel environnement JS.

Tout est piloté par un seul fichier de configuration : `ai-i18n-tools.config.json`.

---

## Deux flux de travail indépendants {#two-independent-workflows}

| | Flux de travail 1 - Chaînes d'interface | Flux de travail 2 - Documents |
|---|---|---|
| **Entrée** | Fichiers JS/TS contenant des appels `t("…")` | Fichiers `.md`, `.mdx`, fichiers JSON d'étiquettes Docusaurus, `.svg` |
| **Sortie** | `strings.json` (catalogue) + fichiers JSON plats par locale (`de.json`, etc.) | Copies traduites de ces fichiers aux chemins de sortie configurés |
| **Cache** | Le fichier `strings.json` lui-même (les traductions existantes sont conservées) | Base de données SQLite (`cacheDir`) - seuls les segments nouveaux ou modifiés sont envoyés au LLM |
| **Commande principale** | `translate-ui` | `translate-docs` |
| **Commande de synchronisation** | `sync` | `sync` |
| **Indicateurs de fonctionnalités** | `extractUIStrings`, `translateUIStrings` | `translateMarkdown`, `translateJSON`, `translateSVG` |

Ces flux peuvent être utilisés indépendamment ou ensemble dans la même configuration. La commande **`sync`** exécute, dans l'ordre : `extract` (si activé), `translate-ui` (si activé, sauf avec `--no-ui`), `translate-svg` lorsque `config.svg` existe (sauf avec `--no-svg`), puis `translate-docs` (sauf avec `--no-docs`). Consultez la [feuille de référence CLI](#cli-commands-cheat-sheet) pour les indicateurs.

---

## Référence rapide du fichier de configuration {#config-file-quick-reference}

Fichier : `ai-i18n-tools.config.json` (emplacement par défaut - remplaçable avec `-c <chemin>`)

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": "src/locales/ui-languages.json",

  "openrouter": {
    "translationModels": [
      "qwen/qwen3-235b-a22b-2507",
      "stepfun/step-3.5-flash",
      "anthropic/claude-3-haiku",
      "anthropic/claude-3.5-haiku"
    ],
    "maxTokens": 8192,
    "temperature": 0.2
  },

  "features": {
    "extractUIStrings": true,
    "translateUIStrings": true,
    "translateMarkdown": true,
    "translateJSON": false,
    "translateSVG": false
  },

  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "src/locales/strings.json",
    "flatOutputDir": "src/locales/",
    "reactExtractor": {
      "funcNames": ["t", "i18n.t"],
      "extensions": [".js", ".jsx", ".ts", ".tsx"]
    }
  },

  "documentation": {
    "contentPaths": ["docs/"],
    "outputDir": "i18n/",
    "cacheDir": ".translation-cache",
    "targetLocales": ["de", "fr"],
    "jsonSource": "i18n/en",
    "markdownOutput": {
      "style": "docusaurus",
      "docsRoot": "docs"
    }
  },

  "glossary": {
    "uiGlossary": "src/locales/strings.json",
    "userGlossary": "glossary-user.csv"
  }
}
```

### Contraintes principales {#key-constraints}

- `sourceLocale` **doit correspondre exactement** à la constante `SOURCE_LOCALE` exportée depuis le fichier d'initialisation i18n à exécution (`src/i18n.ts` / `src/i18n.js`).
- `targetLocales` peut être un chemin vers un manifeste `ui-languages.json` OU un tableau de codes BCP-47.
- `documentation.targetLocales` remplace `targetLocales` uniquement pour les documents - utile lorsque vous souhaitez moins de locales pour les documents que pour l'interface.
- Tous les chemins sont relatifs au répertoire courant (cwd, là où la CLI est exécutée).
- `OPENROUTER_API_KEY` doit être définie dans l'environnement ou dans un fichier `.env`.

---

## Le manifeste `ui-languages.json` {#the-ui-languagesjson-manifest}

Lorsque `targetLocales` est un chemin de fichier, ce fichier doit être un tableau JSON de cette structure :

```json
[
  { "code": "en-GB", "label": "English (UK)", "englishName": "English (UK)" },
  { "code": "de",    "label": "Deutsch",       "englishName": "German" },
  { "code": "ar",    "label": "العربية",        "englishName": "Arabic" }
]
```

- `code` - code de locale BCP-47 utilisé dans les noms de fichiers et par i18next.
- `label` - nom natif affiché dans les sélecteurs de langue.
- `englishName` - nom en anglais utilisé pour les aides d'affichage et les invites de traduction.

Ce fichier alimente à la fois le pipeline de traduction et l'interface utilisateur du sélecteur de langue à l'exécution. Conservez-le comme source unique de vérité pour les locales prises en charge.

---

## Feuille de référence des commandes CLI {#cli-commands-cheat-sheet}

```
npx ai-i18n-tools init [-t ui-markdown|ui-docusaurus]
    Write a starter config file. ui-markdown = React/UI-only template.
    ui-docusaurus = combined UI + docs template.

npx ai-i18n-tools extract
    Scan source for t("…") calls, write/merge strings.json.
    Safe to re-run - preserves existing translations.

npx ai-i18n-tools translate-ui [--locale <code>]
    Translate UI strings only. Reads strings.json, writes flatOutputDir/de.json etc.

npx ai-i18n-tools translate-docs [--locale <code>] [--force | --force-update] …
    Translate markdown/JSON/SVG under documentation paths. Default: skip unchanged files + use segment SQLite cache.
    --force-update: re-run every file output; segment cache still used (no API for unchanged text).
    --force: clear file tracking and ignore segment cache reads (full re-translation); new results still write to cache.
    --stats: print cache stats and exit. --clear-cache [locale]: wipe cache (all or one locale) and exit.
    Do not combine --force with --force-update (when the docs step runs).

npx ai-i18n-tools translate-svg [--locale <code>] [--force | --force-update] [--no-cache] …
    Standalone SVG assets from config.svg. --no-cache: skip SQLite reads/writes for this run only.

npx ai-i18n-tools sync [--locale <code>] [--force | --force-update] [--no-ui] [--no-svg] [--no-docs] …
    extract (if enabled), translate-ui (unless --no-ui), translate-svg when config.svg exists (unless --no-svg),
    translate-docs (unless --no-docs). --force / --force-update apply to the docs step only; if --no-docs, both can be passed without conflict.

npx ai-i18n-tools status [--locale <code>]
    Show translation coverage per file × locale.

npx ai-i18n-tools editor
    Launch a local web editor for the SQLite cache, strings.json, and glossary.

npx ai-i18n-tools cleanup [--dry-run] [--no-backup] [--backup <path>] [--yes]
    Maintain the SQLite cache: removes stale rows and orphaned filepath rows.
    Prompts before DB writes (unless --dry-run or --yes): run translate-docs --force-update first.
    Backs up cache.db under the cache dir before modifications unless --no-backup. Use --yes in CI.

npx ai-i18n-tools glossary-generate
    Write an empty glossary-user.csv template.
```

Indicateurs globaux : `-c <config>` (chemin de configuration), `-v` (sortie détaillée/debug).

---

## Workflow 1 - Chaînes d'interface utilisateur : le flux des données {#workflow-1---ui-strings-how-data-flows}

```
source files (JS/TS)
    │  i18next-scanner Parser finds t("literal") and i18n.t("literal")
    ▼
strings.json  - master catalog
    {
      "<md5-8-hex>": {
        "source": "The English string",
        "translated": { "de": "Der deutsche Text", "pt-BR": "O texto em português" }
      }
    }
    │  translate-ui reads this, sends batches to OpenRouter, fills missing locales
    ▼
src/locales/de.json    - flat map: source string → translation
    { "The English string": "Der deutsche Text", "Save": "Speichern" }
src/locales/pt-BR.json
    ...
```

**Seules les chaînes littérales sont extractibles.** Les variables, expressions ou littéraux de gabarits utilisés comme clés ne sont pas détectés :

```js
t('Save')                   // ✓ extracted
t('Hello {{name}}', {name}) // ✓ extracted as "Hello {{name}}"
t(labelVar)                 // ✗ not extracted - variable key
t(`Hello ${name}`)          // ✗ not extracted - template literal
```

i18next utilise le modèle « clé comme valeur par défaut » : les traductions manquantes reviennent à la clé elle-même (la chaîne source en anglais). Le `parseMissingKeyHandler` dans `defaultI18nInitOptions` gère ce comportement.

---

## Workflow 2 - Traduction de documents : le flux des données {#workflow-2---document-translation-how-data-flows}

```
source files (md/mdx/json/svg)
    │  Extractor produces typed segments with SHA-256 hash
    ▼
PlaceholderHandler  - replaces URLs, admonitions, anchors with opaque tokens
    ▼
TranslationCache lookup (SQLite)
    │  cache hit → use stored translation
    │  cache miss → send batch to OpenRouter
    ▼
PlaceholderHandler.restore  - tokens replaced back with original syntax
    ▼
resolveDocumentationOutputPath  → write to output file
```

**Clé de cache** : 16 premiers caractères hexadécimaux du hachage SHA-256 du contenu du segment normalisé (espaces compris) × paramètre régional. Le cache se trouve dans `documentation.cacheDir` (un fichier `.db` SQLite).

**CLI** : `--force-update` contourne uniquement le saut au niveau *fichier* (reconstruction des sorties) tout en utilisant toujours le cache des segments. `--force` efface le suivi par fichier et ignore les lectures du cache de segments pour les appels API. Consultez le guide de démarrage pour le tableau complet des indicateurs.

**Styles de sortie** (`markdownOutput.style`) :

| Style | Exemple |
|---|---|
| `"docusaurus"` | `docs/guide.md` → `i18n/de/docusaurus-plugin-content-docs/current/guide.md` |
| `"flat"` | `docs/guide.md` → `i18n/guide.de.md` |
| `pathTemplate` personnalisé | n'importe quelle structure utilisant `{outputDir}`, `{locale}`, `{relPath}`, `{stem}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}` |

La sortie en style plat réécrit automatiquement les liens relatifs entre pages (par exemple `[Guide](./guide.md)` → `guide.de.md`).

---

## Intégration au moment de l'exécution - configuration d'i18next {#runtime-integration---wiring-i18next}

Le package exporte des utilitaires depuis `'ai-i18n-tools/runtime'` qui suppriment le code redondant. Configuration minimale :

```ts
// src/i18n.ts  - import this at the top of your entry point
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import uiLanguages from './locales/ui-languages.json';
import {
  defaultI18nInitOptions,
  wrapI18nWithKeyTrim,
  makeLoadLocale,
  applyDirection,
} from 'ai-i18n-tools/runtime';

// Must match sourceLocale in ai-i18n-tools.config.json exactly
export const SOURCE_LOCALE = 'en-GB';

void i18n.use(initReactI18next).init(defaultI18nInitOptions(SOURCE_LOCALE));
wrapI18nWithKeyTrim(i18n);
i18n.on('languageChanged', applyDirection);
applyDirection(i18n.language);

// Dynamic imports for non-source locales
const localeLoaders = Object.fromEntries(
  uiLanguages
    .filter(({ code }) => code !== SOURCE_LOCALE)
    .map(({ code }) => [code, () => import(`./locales/${code}.json`)])
);

export const loadLocale = makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);
export default i18n;
```

**Chargement d'un paramètre régional à la demande** (par exemple lorsque l'utilisateur change de langue) :

```ts
await loadLocale(code);
i18n.changeLanguage(code);
```

`loadLocale` est une opération nulle pour le paramètre régional source - il ne récupère que les paramètres régionaux non sources.

---

## Référence des utilitaires au moment de l'exécution {#runtime-helpers-reference}

Tous exportés depuis `'ai-i18n-tools/runtime'`. Fonctionnent dans tout environnement JS (navigateur, Node.js, Edge, Deno). Aucune dépendance paritaire i18next requise.

| Export | Signature | Objectif |
|---|---|---|
| `defaultI18nInitOptions` | `(sourceLocale?: string) => i18nextInitOptions` | Initialisation standard d'i18next pour une configuration clé-comme-valeur-par-défaut |
| `wrapI18nWithKeyTrim` | `(i18n: I18nLike) => void` | Supprime les espaces des clés avant recherche et applique l'interpolation `{{var}}` pour le paramètre régional source (là où `parseMissingKeyHandler` renvoie la clé brute) |
| `makeLoadLocale` | `(i18n, loaders, sourceLocale?) => (lang: string) => Promise<void>` | Fabrique pour le chargement asynchrone des paramètres régionaux |
| `getTextDirection` | `(lng: string) => 'ltr' \| 'rtl'` | Détection RTL par code BCP-47 |
| `applyDirection` | `(lng: string, element?: Element) => void` | Définit `dir` sur `document.documentElement` (opération nulle dans Node.js) |
| `getUILanguageLabel` | `(lang: UiLanguageEntry, t: TranslateFn) => string` | Libellé traduit pour les menus déroulants des paramètres |
| `getUILanguageLabelNative` | `(lang: UiLanguageEntry) => string` | Libellé natif pour les menus d'en-tête (sans appel à `t()`) |
| `interpolateTemplate` | `(str: string, vars: Record<string, string \| number \| boolean>) => string` | Substitution bas niveau de `{{var}}` sur une chaîne simple (utilisée en interne par `wrapI18nWithKeyTrim` ; rarement nécessaire dans le code applicatif) |
| `flipUiArrowsForRtl` | `(text, isRtl: boolean) => string` | Inverse `→` en `←` pour les mises en page RTL |
| `RTL_LANGS` | `ReadonlySet<string>` | Ensemble des codes BCP-47 considérés comme RTL |

---

## API programmatique {#programmatic-api}

Importer depuis `'ai-i18n-tools'`. Utile lorsque vous devez appeler des étapes de traduction depuis un script de construction ou un pipeline CI.

```ts
import {
  loadI18nConfigFromFile,
  runTranslateUI,
  Logger,
} from 'ai-i18n-tools';

const config = loadI18nConfigFromFile('ai-i18n-tools.config.json');
const logger = new Logger({ level: 'info' });

const summary = await runTranslateUI({
  config,
  cwd: process.cwd(),
  logger,
  apiKey: process.env.OPENROUTER_API_KEY,
});
// summary.translated - number of newly translated strings
// summary.locales   - number of locales processed
```

Autres exports utiles pour des pipelines personnalisés :

| Exporter | Utilisation |
|---|---|
| `loadI18nConfigFromFile(path, cwd?)` | Charger et valider la configuration |
| `parseI18nConfig(rawObject)` | Valider un objet de configuration que vous avez construit dans le code |
| `TranslationCache` | Accès direct au cache SQLite |
| `UIStringExtractor` | Extraire les appels `t("…")` des fichiers JS/TS |
| `MarkdownExtractor` | Analyser le markdown en segments traduisibles |
| `JsonExtractor` | Analyser les fichiers d'étiquettes JSON de Docusaurus |
| `SvgExtractor` | Analyser les éléments texte SVG |
| `OpenRouterClient` | Effectuer directement des requêtes de traduction |
| `PlaceholderHandler` | Protéger/restaurer la syntaxe markdown autour de la traduction |
| `splitTranslatableIntoBatches` | Grouper les segments en lots de taille adaptée aux LLM |
| `validateTranslation` | Vérifications structurelles après un appel de traduction |
| `resolveDocumentationOutputPath` | Calculer le chemin du fichier de sortie pour un document traduit |
| `Glossary` / `GlossaryMatcher` | Charger et appliquer un glossaire de traduction |

---

## Glossaire {#glossary}

Le glossaire garantit une terminologie cohérente dans l'ensemble des traductions.

- **Glossaire généré automatiquement** (`glossary.uiGlossary`) : lit `strings.json` et utilise les traductions existantes comme source d'indices. Aucun fichier CSV requis.
- **Glossaire utilisateur** (`glossary.userGlossary`) : un fichier CSV avec les colonnes `term,translation,locale`. Générez un modèle vide avec `npx ai-i18n-tools glossary-generate`.

Les suggestions du glossaire sont injectées dans l’invite système du LLM – il s’agit de suggestions, pas de remplacements obligatoires.

---

## Points d'extension {#extension-points}

### Noms de fonctions personnalisés {#custom-function-names}

```json
{ "ui": { "reactExtractor": { "funcNames": ["t", "i18n.t", "translate"] } } }
```

### Extracteur personnalisé {#custom-extractor}

```ts
import { BaseExtractor, type Segment } from 'ai-i18n-tools';

class MyExtractor extends BaseExtractor {
  readonly name = 'my-format';
  canHandle(filepath: string) { return filepath.endsWith('.myext'); }
  extract(content: string): Segment[] { /* return typed segments */ }
  reassemble(segments: Segment[], translations: Map<string, string>): string { /* rebuild file */ }
}
```

### Chemin de sortie personnalisé {#custom-output-path}

```json
{
  "documentation": {
    "markdownOutput": {
      "pathTemplate": "{outputDir}/{locale}/{relativeToDocsRoot}"
    }
  }
}
```

Variables disponibles : `{outputDir}`, `{locale}`, `{relPath}`, `{stem}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}`.

---

## Tâches courantes et actions à effectuer {#common-tasks-and-what-to-do}

| Tâche | Commande à exécuter / modification à apporter |
|---|---|
| Ajouter une nouvelle langue | Ajoutez-la à `ui-languages.json` (ou au tableau `targetLocales`), puis exécutez `translate-docs` / `translate-ui` / `sync` |
| Traduire une seule langue | `npx ai-i18n-tools translate-docs --locale de` (ou `translate-ui`, `sync`) |
| Ajouter une nouvelle chaîne d'interface | Écrivez `t('Ma nouvelle chaîne')` dans le code source, puis exécutez `extract`, puis `translate-ui` |
| Mettre à jour une traduction manuellement | Modifiez directement `strings.json` (dans l'objet `translated`), puis exécutez `translate-ui` (cela ne remplacera pas les entrées existantes) |
| Traduire uniquement les documents nouveaux/mis à jour | Exécutez `translate-docs` - le cache des fichiers et des segments ignore automatiquement les éléments inchangés |
| Recréer les sorties de documentation sans rappeler l'API pour les segments inchangés | `npx ai-i18n-tools translate-docs --force-update` |
| Traduction complète des documents (ignorer le cache des segments) | `npx ai-i18n-tools translate-docs --force` |
| Libérer de l'espace dans le cache | `npx ai-i18n-tools cleanup` ou `translate-docs --clear-cache` |
| Vérifier ce qui n'est pas traduit | `npx ai-i18n-tools status` |
| Changer le modèle de traduction | Modifiez `openrouter.translationModels` dans la configuration (le premier modèle est principal, les autres sont des secours) |
| Intégrer i18next dans un nouveau projet | Consultez [Intégration au runtime](#runtime-integration---wiring-i18next) ci-dessus |
| Traduire les documents vers moins de langues que l'interface | Définissez `documentation.targetLocales` avec un tableau plus petit |
| Exécuter extract + UI + SVG + docs en une seule commande | `npx ai-i18n-tools sync` - utilisez `--no-ui`, `--no-svg` ou `--no-docs` pour ignorer une étape (par exemple, uniquement UI + SVG : `--no-docs`) |

---

## Variables d'environnement {#environment-variables}

| Variable | Effet |
|---|---|
| `OPENROUTER_API_KEY` | **Obligatoire.** Votre clé API OpenRouter. |
| `OPENROUTER_BASE_URL` | Remplacer l'URL de base de l'API. |
| `I18N_SOURCE_LOCALE` | Remplacer `sourceLocale` au moment de l'exécution. |
| `I18N_TARGET_LOCALES` | Codes de langue séparés par des virgules pour remplacer `targetLocales`. |

---

## Fichiers générés / maintenus par l'outil {#files-generated--maintained-by-the-tool}

| Fichier | Propriétaire | Remarques |
|---|---|---|
| `ai-i18n-tools.config.json` | Vous | Configuration principale. À modifier manuellement. |
| `ui-languages.json` (à l'emplacement configuré) | Vous | Manifeste des paramètres régionaux. À modifier manuellement pour ajouter/supprimer des paramètres régionaux. |
| `strings.json` (à l'emplacement configuré) | Outil (`extract`) | Catalogue principal de l'interface utilisateur. Il est sûr de modifier les valeurs `translated`. Ne pas renommer les clés. |
| `{flatOutputDir}/de.json`, etc. | Outil (`translate-ui`) | Mappages plats par paramètre régional. Ne pas modifier — régénérés à chaque exécution de `translate-ui`. |
| `{cacheDir}/*.db` | Outil | Cache de traduction SQLite. Ne pas modifier directement ; utiliser la commande `editor` ou `cleanup`. |
| `glossary-user.csv` | Vous | Substitutions de termes. Générer le modèle avec `glossary-generate`. |

---

## Résumé de l'organisation des sources {#source-layout-summary}

```
src/
├── index.ts               Public API (all programmatic exports)
├── cli/                   CLI command implementations
├── core/                  Config loading, types (Zod), SQLite cache, prompt builder, output paths
├── extractors/            Segment extractors: JS/TS, Markdown, JSON, SVG
├── processors/            Placeholder protection, batch splitting, post-translation validation, link rewriting
├── api/openrouter.ts      HTTP client for OpenRouter with model fallback and rate-limit handling
├── glossary/              Glossary loading (CSV + auto from strings.json) and term matching
├── runtime/               i18next helpers, RTL helpers, display helpers (no i18next import)
├── server/                Local Express web editor for cache/glossary
└── utils/                 Logger, SHA-256 hash, .translate-ignore parser
```

Le point d'entrée pour tous les types et fonctions publics est `src/index.ts`.
