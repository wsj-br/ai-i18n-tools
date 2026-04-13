---
translation_last_updated: '2026-04-13T00:28:31.015Z'
source_file_mtime: '2026-04-13T00:28:15.573Z'
source_file_hash: d362c2411cab836c5035efd2135f097efeb4477a3f61cd225850c323e0cc7071
translation_language: fr
source_file_path: docs-site/docs/context.md
---
# ai-i18n-tools : Contexte de l'agent IA

Ce document fournit à un agent IA le modèle mental, les décisions clés et les schémas nécessaires pour travailler efficacement avec `ai-i18n-tools` sans consulter chaque autre document au préalable. Lisez ceci avant d'apporter des modifications au code ou à la configuration.

<!-- DOCTOC SKIP -->

---

## Ce que fait ce package {#what-this-package-does}

`ai-i18n-tools` est un CLI + bibliothèque qui automatise l'internationalisation pour les projets JavaScript/TypeScript. Il :

1. **Extrait** les chaînes UI du code source (`t("…")` appels) dans un catalogue maître.
2. **Traduit** ce catalogue et les fichiers de documentation via des LLM (via OpenRouter).
3. **Écrit** des fichiers JSON prêts pour les locales pour i18next, ainsi que des markdown traduits, des étiquettes JSON Docusaurus et des actifs SVG autonomes.
4. **Exporte des helpers d'exécution** pour connecter i18next, le support RTL et la sélection de langue dans n'importe quel environnement JS.

Tout est piloté par un seul fichier de configuration : `ai-i18n-tools.config.json`.

---

## Deux workflows indépendants {#two-independent-workflows}

| | Workflow 1 - Chaînes UI | Workflow 2 - Documents |
|---|---|---|
| **Entrée** | Fichiers source JS/TS avec des appels `t("…")` | Fichiers `.md`, `.mdx`, étiquettes JSON Docusaurus |
| **Sortie** | `strings.json` (catalogue) + fichiers JSON plats par locale (`de.json`, etc.) | Copies traduites de ces fichiers aux chemins de sortie configurés |
| **Cache** | `strings.json` lui-même (les traductions existantes sont préservées) | Base de données SQLite (`cacheDir`) - seuls les segments nouveaux/modifiés vont vers LLM |
| **Commande clé** | `translate-ui` | `translate-docs` |
| **Commande de synchronisation** | `sync` | `sync` |
| **Drapeaux de fonctionnalités** | `extractUIStrings`, `translateUIStrings` | `translateMarkdown`, `translateJSON` |

Ils peuvent être utilisés indépendamment ou ensemble dans la même configuration. `sync` s'exécute, dans l'ordre : `extract` (si activé), `translate-ui` (si activé, sauf `--no-ui`), `translate-svg` lorsque `config.svg` existe (sauf `--no-svg`), puis `translate-docs` (sauf `--no-docs`). La traduction SVG autonome est configurée via le bloc `svg` de niveau supérieur, pas un drapeau de fonctionnalité. Consultez la [fiche de triche CLI](#cli-commands-cheat-sheet) pour les drapeaux.

---

## Référence rapide du fichier de configuration {#config-file-quick-reference}

Fichier : `ai-i18n-tools.config.json` (emplacement par défaut - remplacer par `-c <path>`)

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": "src/locales/ui-languages.json",

  "openrouter": {
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
    ],
    "maxTokens": 8192,
    "temperature": 0.2
  },

  "features": {
    "extractUIStrings": true,
    "translateUIStrings": true,
    "translateMarkdown": true,
    "translateJSON": false
  },

  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "src/locales/strings.json",
    "flatOutputDir": "src/locales/",
    "preferredModel": "anthropic/claude-3.5-haiku",
    "reactExtractor": {
      "funcNames": ["t", "i18n.t"],
      "extensions": [".js", ".jsx", ".ts", ".tsx"]
    }
  },

  "cacheDir": ".translation-cache",
  "documentations": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "targetLocales": ["de", "fr"],
      "jsonSource": "i18n/en",
      "markdownOutput": {
        "style": "docusaurus",
        "docsRoot": "docs"
      }
    }
  ],

  "svg": {
    "sourcePath": "images",
    "outputDir": "public/assets",
    "style": "flat"
  },

  "glossary": {
    "uiGlossary": "src/locales/strings.json",
    "userGlossary": "glossary-user.csv"
  }
}
```

### Contraintes clés {#key-constraints}

- `sourceLocale` **doit correspondre exactement** à la constante `SOURCE_LOCALE` exportée depuis le fichier de configuration i18n d'exécution (`src/i18n.ts` / `src/i18n.js`).
- `targetLocales` peut être un chemin de fichier vers un manifeste `ui-languages.json` OU un tableau de codes BCP-47.
- `uiLanguagesPath` est optionnel, mais utile lorsque `targetLocales` est un tableau explicite et que vous souhaitez toujours des étiquettes pilotées par manifeste et un filtrage des locales.
- `documentations[].description` est un texte optionnel pour les mainteneurs (à quoi sert le bloc) ; cela n'affecte pas la traduction. Lorsqu'il est défini, il est inclus dans le titre `translate-docs` et les en-têtes `status`.
- `documentations[].targetLocales` limite ce bloc à un sous-ensemble ; les locales de documentation effectives sont l'**union** à travers les blocs (utile lorsque différents arbres nécessitent différents ensembles de locales).
- `documentations[].markdownOutput.postProcessing` peut ajuster le markdown traduit après réassemblage, par exemple en réécrivant les chemins des captures d'écran ou en reconstruisant un bloc de liste de langues.
- Tous les chemins sont relatifs au répertoire de travail actuel (où le CLI est invoqué).
- `OPENROUTER_API_KEY` doit être défini dans l'environnement ou dans un fichier `.env`.

---

## Le manifeste `ui-languages.json` {#the-ui-languagesjson-manifest}

Lorsque `targetLocales` est un chemin de fichier, ce fichier doit être un tableau JSON de cette forme :

```json
[
  { "code": "en-GB", "label": "English (UK)", "englishName": "English (UK)" },
  { "code": "de",    "label": "Deutsch",       "englishName": "German" },
  { "code": "ar",    "label": "العربية",        "englishName": "Arabic" }
]
```

- `code` - code de locale BCP-47 utilisé dans les noms de fichiers et par i18next.
- `label` - nom natif affiché dans les sélecteurs de langue.
- `englishName` - nom anglais utilisé pour les helpers d'affichage et les invites de traduction.

Ce fichier pilote à la fois le pipeline de traduction et l'interface utilisateur du sélecteur de langue d'exécution. Gardez-le comme la seule source de vérité pour les locales prises en charge.

---

## Fiche de triche des commandes CLI {#cli-commands-cheat-sheet}

```
npx ai-i18n-tools init [-t ui-markdown|ui-docusaurus]
    Write a starter config file. ui-markdown = React/UI-only template.
    ui-docusaurus = combined UI + docs template.

npx ai-i18n-tools extract
    Scan source for t("…") calls, write/merge strings.json.
    Safe to re-run - preserves existing translations.

npx ai-i18n-tools translate-ui [--locale <code>] [--force] [--dry-run] [-j <n>]
    Translate UI strings only. Reads strings.json, writes flatOutputDir/de.json etc.
    --force: re-translate all entries per locale. --dry-run: no writes, no API calls. -j: max parallel locales.

npx ai-i18n-tools translate-docs [--locale <code>] [--force | --force-update] …
    Translate markdown and JSON under documentation paths. Default: skip unchanged files + use segment SQLite cache.
    --force-update: re-run every file output; segment cache still used (no API for unchanged text).
    --force: clear file tracking and ignore segment cache reads (full re-translation); new results still write to cache.
    --stats: print cache stats and exit. --clear-cache [locale]: wipe cache (all or one locale) and exit.
    --prompt-format xml|json-array|json-object: batch wire format to the model (default xml); does not change validation or cache.
    Do not combine --force with --force-update (when the docs step runs).

npx ai-i18n-tools translate-svg [--locale <code>] [--force | --force-update] [--no-cache] …
    Standalone SVG assets from config.svg. --no-cache: skip SQLite reads/writes for this run only.

npx ai-i18n-tools sync [--locale <code>] [--force | --force-update] [--no-ui] [--no-svg] [--no-docs] …
    extract (if enabled), translate-ui (unless --no-ui), translate-svg when config.svg exists (unless --no-svg),
    translate-docs (unless --no-docs). --force / --force-update apply to the docs step only; if --no-docs, both can be passed without conflict.

npx ai-i18n-tools status
    Show markdown translation coverage per file × locale.

npx ai-i18n-tools editor
    Launch a local web editor for the SQLite cache, strings.json, and glossary.

npx ai-i18n-tools cleanup [--dry-run] [--no-backup] [--backup <path>]
    Runs sync --force-update first, then maintains the SQLite cache: stale segment rows; orphaned file_tracking keys (doc-block:, svg-assets:, …);
    orphaned translation rows whose filepath metadata points at a missing file.
    Backs up cache.db under the cache dir before modifications unless --no-backup.

npx ai-i18n-tools glossary-generate
    Write an empty glossary-user.csv template.
```

Drapeaux globaux : `-c <config>` (chemin de configuration), `-v` (sortie verbeuse/debug), `-w` / `--write-logs [path]` (rediriger la sortie de la console vers un fichier journal ; chemin par défaut : sous `cacheDir`).

---

## Flux de travail 1 - Chaînes UI : comment les données circulent {#workflow-1---ui-strings-how-data-flows}

```
source files (JS/TS)
    │  i18next-scanner Parser finds t("literal") and i18n.t("literal")
    ▼
strings.json  - master catalog
    {
      "<md5-8-hex>": {
        "source": "The English string",
        "translated": { "de": "Der deutsche Text", "pt-BR": "O texto em português" },
        "models": { "de": "…", "pt-BR": "…" }
      }
    }
    │  translate-ui reads this, sends batches to OpenRouter, fills missing locales and records model ids per locale
    ▼
src/locales/de.json    - flat map: source string → translation
    { "The English string": "Der deutsche Text", "Save": "Speichern" }
src/locales/pt-BR.json
    ...
```

**Seules les chaînes littérales sont extractibles.** Les variables, expressions ou littéraux de modèle en tant que clé ne sont pas trouvés :

```js
t('Save')                   // ✓ extracted
t('Hello {{name}}', {name}) // ✓ extracted as "Hello {{name}}"
t(labelVar)                 // ✗ not extracted - variable key
t(`Hello ${name}`)          // ✗ not extracted - template literal
```

i18next utilise le modèle clé-comme-par-défaut : les traductions manquantes reviennent à la clé elle-même (la chaîne source en anglais). Le `parseMissingKeyHandler` dans `defaultI18nInitOptions` gère cela.

---

## Flux de travail 2 - Traduction de documents : comment les données circulent {#workflow-2---document-translation-how-data-flows}

```
source files (md/mdx/json)
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

**Clé de cache** : premiers 16 caractères hexadécimaux SHA-256 du contenu de segment normalisé par les espaces × locale. Le cache se trouve sous `cacheDir` racine (un fichier SQLite `cache.db`), partagé par tous les blocs `documentations`. Chaque ligne stocke le `model` qui a traduit le segment en dernier ; enregistrer une modification dans l'`éditeur` définit `model` sur `user-edited` (même sentinelle que `strings.json` `models` de l'UI).

**CLI** : `--force-update` contourne uniquement le *niveau de fichier* de saut (reconstruire les sorties) tout en utilisant toujours le cache de segment. `--force` efface le suivi par fichier et saute les lectures de cache de segment pour les appels API. Consultez le guide de démarrage pour le tableau complet des drapeaux.

**SVG autonomes** : gérés par `translate-svg` avec le bloc de configuration `svg` de niveau supérieur. Ils utilisent les mêmes idées OpenRouter/cache, mais pas le pipeline `documentations`.

**Styles de sortie** (`markdownOutput.style`) :

| Style | Exemple |
|---|---|
| `"nested"` (par défaut) | `docs/guide.md` → `i18n/de/docs/guide.md` |
| `"docusaurus"` | `docs/guide.md` → `i18n/de/docusaurus-plugin-content-docs/current/guide.md` |
| `"flat"` | `docs/guide.md` → `i18n/guide.de.md` |
| modèle de chemin personnalisé `pathTemplate` | tout agencement utilisant `{outputDir}`, `{locale}`, `{LOCALE}`, `{relPath}`, `{stem}`, `{basename}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}` |

La sortie de style plat réécrit automatiquement les liens relatifs entre les pages (par exemple, `[Guide](./guide.md)` → `guide.de.md`).

---

## Intégration à l'exécution - câblage i18next {#runtime-integration---wiring-i18next}

Le package exporte des helpers de `'ai-i18n-tools/runtime'` qui suppriment le code standard. La configuration minimale :

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

**Chargement d'une locale à la demande** (par exemple, lorsque l'utilisateur change de langue) :

```ts
await loadLocale(code);
i18n.changeLanguage(code);
```

`loadLocale` est une opération no-op pour la locale source - elle ne récupère que les locales non sources.

---

## Référence des helpers à l'exécution {#runtime-helpers-reference}

Tous exportés de `'ai-i18n-tools/runtime'`. Fonctionnent dans n'importe quel environnement JS (navigateur, Node.js, Edge, Deno). Aucune dépendance i18next requise.

| Export | Signature | But |
|---|---|---|
| `defaultI18nInitOptions` | `(sourceLocale?: string) => i18nextInitOptions` | Initialisation standard d'i18next pour la configuration clé-comme-par-défaut |
| `wrapI18nWithKeyTrim` | `(i18n: I18nLike) => void` | Couper les clés avant la recherche et appliquer l'interpolation `{{var}}` pour la locale source (où `parseMissingKeyHandler` renvoie la clé brute) |
| `makeLoadLocale` | `(i18n, loaders, sourceLocale?) => (lang: string) => Promise<void>` | Usine pour le chargement asynchrone de locale |
| `getTextDirection` | `(lng: string) => 'ltr' \| 'rtl'` | Détection RTL par code BCP-47 |
| `applyDirection` | `(lng: string, element?: Element) => void` | Définir `dir` sur `document.documentElement` (no-op dans Node.js) |
| `getUILanguageLabel` | `(lang: UiLanguageEntry, t: TranslateFn) => string` | Étiquette traduite pour les menus déroulants de la page des paramètres |
| `getUILanguageLabelNative` | `(lang: UiLanguageEntry) => string` | Étiquette native pour les menus d'en-tête (pas d'appel `t()`) |
| `interpolateTemplate` | `(str: string, vars: Record<string, string \| number \| boolean>) => string` | Substitution de bas niveau `{{var}}` sur une chaîne simple (utilisé en interne par `wrapI18nWithKeyTrim`; rarement nécessaire dans le code de l'application) |
| `flipUiArrowsForRtl` | `(text, isRtl: boolean) => string` | Inverser `→` en `←` pour les mises en page RTL |
| `RTL_LANGS` | `ReadonlySet<string>` | Ensemble de codes BCP-47 traités comme RTL |

---

## API programmatique {#programmatic-api}

Importer depuis `'ai-i18n-tools'`. Utile lorsque vous devez appeler des étapes de traduction depuis un script de construction ou un pipeline CI.

```ts
import {
  loadI18nConfigFromFile,
  runTranslateUI,
} from 'ai-i18n-tools';

const config = loadI18nConfigFromFile('ai-i18n-tools.config.json');
const summary = await runTranslateUI(config, {
  cwd: process.cwd(),
  locales: config.targetLocales,
  force: false,
  dryRun: false,
  verbose: false,
});
// summary.stringsUpdated - number of newly translated strings
// summary.localesTouched - locale codes processed
```

Autres exports utiles pour des pipelines personnalisés :

| Exporter | Utiliser quand |
|---|---|
| `loadI18nConfigFromFile(path, cwd?)` | Charger et valider la configuration |
| `parseI18nConfig(rawObject)` | Valider un objet de configuration que vous avez construit dans le code |
| `TranslationCache` | Accès direct au cache SQLite |
| `UIStringExtractor` | Extraire les appels `t("…")` des fichiers JS/TS |
| `MarkdownExtractor` | Analyser le markdown en segments traduisibles |
| `JsonExtractor` | Analyser les fichiers d'étiquettes JSON de Docusaurus |
| `SvgExtractor` | Analyser les éléments de texte SVG |
| `OpenRouterClient` | Faire des demandes de traduction directement |
| `PlaceholderHandler` | Protéger/restaurer la syntaxe markdown autour de la traduction |
| `splitTranslatableIntoBatches` | Regrouper les segments en lots de taille LLM |
| `validateTranslation` | Vérifications structurelles après un appel de traduction |
| `resolveDocumentationOutputPath` | Calculer le chemin du fichier de sortie pour un document traduit |
| `Glossary` / `GlossaryMatcher` | Charger et appliquer un glossaire de traduction |

---

## Glossaire {#glossary}

Le glossaire garantit une terminologie cohérente à travers les traductions.

- **Glossaire auto-construit** (`glossary.uiGlossary`): lit `strings.json` et utilise les traductions existantes comme source d'indice. Aucun CSV nécessaire.
- **Glossaire utilisateur** (`glossary.userGlossary`): un fichier CSV avec les colonnes `Chaîne de langue originale`, `locale`, `Traduction` (ou `en`, `locale`, `Traduction`). Générez un modèle vide avec `npx ai-i18n-tools glossary-generate`.

Les indices du glossaire sont injectés dans l'invite système LLM - ce sont des suggestions, pas des remplacements obligatoires.

---

## Points d'extension {#extension-points}

### Noms de fonctions personnalisées {#custom-function-names}

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
  "documentations": [
    {
      "markdownOutput": {
        "pathTemplate": "{outputDir}/{locale}/{relativeToDocsRoot}"
      }
    }
  ]
}
```

Espaces réservés disponibles : `{outputDir}`, `{locale}`, `{LOCALE}`, `{relPath}`, `{stem}`, `{basename}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}`.

---

## Tâches courantes et que faire {#common-tasks-and-what-to-do}

| Tâche | Ce qu'il faut exécuter / changer |
|---|---|
| Ajouter une nouvelle locale | Ajoutez-la à `ui-languages.json` (ou au tableau `targetLocales`), puis exécutez `translate-docs` / `translate-ui` / `sync` |
| Traduire uniquement une locale | `npx ai-i18n-tools translate-docs --locale de` (ou `translate-ui`, `sync`) |
| Ajouter une nouvelle chaîne UI | Écrivez `t('Ma nouvelle chaîne')` dans la source, puis exécutez `extract` puis `translate-ui` |
| Mettre à jour une traduction manuellement | Modifiez directement `strings.json` (`translated`), ou utilisez `editor` (définit `models[locale]` sur `user-edited`). `translate-ui` ignore les locales qui ont déjà du texte, sauf si vous utilisez `--force` |
| Traduire uniquement les docs nouveaux/mis à jour | Exécutez `translate-docs` - le cache de fichiers + segments ignore automatiquement le travail inchangé |
| Reconstruire les sorties de doc sans rappeler l'API pour les segments inchangés | `npx ai-i18n-tools sync  --force-update` |
| Re-traduction complète des docs (ignorer le cache de segment) | `npx ai-i18n-tools translate-docs --force` |
| Libérer de l'espace de cache | `npx ai-i18n-tools cleanup` ou `translate-docs --clear-cache` |
| Inspecter ce qui n'est pas traduit | `npx ai-i18n-tools status` |
| Changer le modèle de traduction | Modifiez `openrouter.translationModels` (le premier est primaire, les autres sont des secours). Pour **UI uniquement**, le `ui.preferredModel` optionnel est essayé avant cette liste. |
| Connecter i18next dans un nouveau projet | Voir [Intégration Runtime](#runtime-integration---wiring-i18next) ci-dessus |
| Traduire les docs dans moins de locales que l'UI | Définissez `documentations[].targetLocales` sur le(s) bloc(s) pertinent(s), ou utilisez une union plus petite |
| Exécuter extract + UI + SVG + docs en une seule commande | `npx ai-i18n-tools sync` - utilisez `--no-ui`, `--no-svg`, ou `--no-docs` pour sauter une étape (par exemple, uniquement UI + SVG : `--no-docs`) |

---

## Variables d'environnement {#environment-variables}

| Variable | Effet |
|---|---|
| `OPENROUTER_API_KEY` | **Requis.** Votre clé API OpenRouter. |
| `OPENROUTER_BASE_URL` | Remplacer l'URL de base de l'API. |
| `I18N_SOURCE_LOCALE` | Remplacer `sourceLocale` à l'exécution. |
| `I18N_TARGET_LOCALES` | Codes de locale séparés par des virgules pour remplacer `targetLocales`. |
| `I18N_LOG_LEVEL` | Niveau du logger (`debug`, `info`, `warn`, `error`, `silent`). |
| `NO_COLOR` | Lorsque `1`, désactiver les couleurs ANSI dans la sortie du log. |
| `I18N_LOG_SESSION_MAX` | Nombre maximal de lignes conservées par session de log (par défaut `5000`). |

---

## Fichiers générés / maintenus par l'outil {#files-generated--maintained-by-the-tool}

| Fichier | Possédé par | Remarques |
|---|---|---|
| `ai-i18n-tools.config.json` | Vous | Configuration principale. Modifiez manuellement. |
| `ui-languages.json` (où qu'il soit configuré) | Vous | Manifest de locale. Modifiez manuellement pour ajouter/retirer des locales. |
| `strings.json` (où qu'il soit configuré) | Outil (`extract` / `translate-ui` / `editor`) | Catalogue UI maître : `source`, `translated`, `models` optionnels (par locale : identifiant de modèle OpenRouter ou `user-edited`), `locations` optionnels. Sûr de modifier `translated` ; ne renommez pas les clés. |
| `{flatOutputDir}/de.json`, etc. | Outil (`translate-ui`) | Cartes plates par locale (source → traduction uniquement, pas de `models`). Ne modifiez pas — régénéré à chaque `translate-ui`. |
| `{cacheDir}/*.db` | Outil | Cache de traduction SQLite (métadonnées `model` par segment ; `user-edited` après enregistrements manuels dans `editor`). Ne modifiez pas directement ; utilisez `editor` ou `cleanup`. |
| `glossary-user.csv` | Vous | Remplacements de termes. Générez un modèle avec `glossary-generate`. |

---

## Résumé de la mise en page source {#source-layout-summary}

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
