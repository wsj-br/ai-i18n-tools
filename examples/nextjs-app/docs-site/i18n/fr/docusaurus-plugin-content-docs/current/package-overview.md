---
translation_last_updated: '2026-04-11T03:31:28.433Z'
source_file_mtime: '2026-04-11T03:30:13.297Z'
source_file_hash: cc126df0f102c515c7e7b274fcf133efca9733834d7836fbb6433cb58703842f
translation_language: fr
source_file_path: docs-site/docs/package-overview.md
---
# ai-i18n-tools : Aperçu du package

Ce document décrit l'architecture interne de `ai-i18n-tools`, la manière dont chaque composant s'assemble, et la mise en œuvre des deux flux de travail principaux.

Pour des instructions pratiques d'utilisation, consultez [Bien démarrer](./getting-started.md).

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table des matières**

- [Aperçu de l'architecture](#architecture-overview)
- [Arborescence des sources](#source-tree)
- [Flux de travail 1 - Internes de la traduction d'interface](#workflow-1---ui-translation-internals)
  - [`UIStringExtractor`](#uistringextractor)
  - [`strings.json`](#stringsjson)
  - [Fichiers de langue plats](#flat-locale-files)
  - [Invites de traduction d'interface](#ui-translation-prompts)
- [Flux de travail 2 - Internes de la traduction de documents](#workflow-2---document-translation-internals)
  - [Extracteurs](#extractors)
  - [Protection des espaces réservés](#placeholder-protection)
  - [Cache (`TranslationCache`)](#cache-translationcache)
  - [Résolution des chemins de sortie](#output-path-resolution)
  - [Réécriture des liens plats](#flat-link-rewriting)
- [Infrastructure partagée](#shared-infrastructure)
  - [`OpenRouterClient`](#openrouterclient)
  - [Chargement de la configuration](#config-loading)
  - [Logger](#logger)
- [API d'assistance au runtime](#runtime-helpers-api)
  - [Assistants RTL](#rtl-helpers)
  - [Fabriques de configuration i18next](#i18next-setup-factories)
  - [Assistants d'affichage](#display-helpers)
  - [Assistants de chaînes](#string-helpers)
- [API programmatique](#programmatic-api)
- [Points d'extension](#extension-points)
  - [Noms de fonctions personnalisés (extraction d'interface)](#custom-function-names-ui-extraction)
  - [Extracteurs personnalisés](#custom-extractors)
  - [Chemins de sortie personnalisés](#custom-output-paths)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

---

## Aperçu de l'architecture {#architecture-overview}

```
ai-i18n-tools
├── CLI (src/cli/)             - commands: init, extract, translate-docs, translate-svg, translate-ui, sync, status, …
├── Core (src/core/)           - config, types, cache, prompts, output paths, UI languages
├── Extractors (src/extractors/)  - segment extraction from JS/TS, markdown, JSON, SVG
├── Processors (src/processors/)  - placeholders, batching, validation, link rewriting
├── API (src/api/)             - OpenRouter HTTP client
├── Glossary (src/glossary/)   - glossary loading and term matching
├── Runtime (src/runtime/)     - i18next helpers, display helpers (no i18next import)
├── Server (src/server/)       - local Express web editor for cache / glossary
└── Utils (src/utils/)         - logger, hash, ignore parser
```

Tout ce dont les consommateurs peuvent avoir besoin de manière programmatique est réexporté depuis `src/index.ts`.

---

## Arborescence des sources {#source-tree}

```
src/
├── index.ts                        Public API re-exports
│
├── cli/
│   ├── index.ts                    CLI entry point (commander)
│   ├── extract-strings.ts          `extract` command implementation
│   ├── translate-ui-strings.ts     `translate-ui` command implementation
│   ├── doc-translate.ts            `translate-docs` command (documentation files only)
│   ├── translate-svg.ts            `translate-svg` command (standalone assets from `config.svg`)
│   ├── helpers.ts                  Shared CLI utilities
│   └── file-utils.ts               File collection helpers
│
├── core/
│   ├── types.ts                    Zod schemas + TypeScript types for all config shapes
│   ├── config.ts                   Config loading, merging, validation, init templates
│   ├── cache.ts                    SQLite translation cache (node:sqlite)
│   ├── prompt-builder.ts           LLM prompt construction for docs and UI strings
│   ├── output-paths.ts             Docusaurus / flat output path resolution
│   ├── ui-languages.ts             ui-languages.json loading and locale resolution
│   ├── locale-utils.ts             BCP-47 normalization and locale list parsing
│   └── errors.ts                   Typed error classes
│
├── extractors/
│   ├── base-extractor.ts           Abstract base class for all extractors
│   ├── ui-string-extractor.ts      JS/TS source scanner (i18next-scanner)
│   ├── classify-segment.ts         Heuristic segment type classification
│   ├── markdown-extractor.ts       Markdown / MDX segment extraction
│   ├── json-extractor.ts           JSON label file extraction
│   └── svg-extractor.ts            SVG text extraction
│
├── processors/
│   ├── placeholder-handler.ts      Chain: admonitions → anchors → URLs
│   ├── url-placeholders.ts         Markdown URL protection/restore
│   ├── admonition-placeholders.ts  Docusaurus admonition protection/restore
│   ├── anchor-placeholders.ts      HTML anchor / heading ID protection/restore
│   ├── batch-processor.ts          Segment → batch grouping (count + char limits)
│   ├── validator.ts                Post-translation structural checks
│   └── flat-link-rewrite.ts        Relative link rewriting for flat output
│
├── api/
│   └── openrouter.ts               OpenRouter HTTP client with model fallback chain
│
├── glossary/
│   ├── glossary.ts                 Glossary loading (CSV + auto-build from strings.json)
│   └── matcher.ts                  Term hint extraction for prompts
│
├── runtime/
│   ├── index.ts                    Runtime re-exports
│   ├── template.ts                 interpolateTemplate, flipUiArrowsForRtl
│   ├── ui-language-display.ts      getUILanguageLabel, getUILanguageLabelNative
│   └── i18next-helpers.ts          RTL detection, i18next setup factories
│
├── server/
│   └── translation-editor.ts       Express app for cache / strings.json / glossary editor
│
└── utils/
    ├── logger.ts                   Leveled logger with ANSI support
    ├── hash.ts                     Segment hash (SHA-256 first 16 hex)
    └── ignore-parser.ts            .translate-ignore file parser
```

---

## Flux de travail 1 - Internes de la traduction d'interface {#workflow-1---ui-translation-internals}

```
source files (JS/TS)
      │
      ▼  UIStringExtractor (i18next-scanner Parser)
strings.json  ─────────────────── master catalog
      │             { hash: { source, translated: { de: "…" } } }
      ▼
OpenRouterClient.translateUIBatch()
      │  sends JSON array of source strings, receives JSON array of translations
      ▼
de.json, pt-BR.json …  ─────────── per-locale flat maps: source → translation
```

### `UIStringExtractor` {#uistringextractor}

Utilise `i18next-scanner`'s `Parser.parseFuncFromString` pour trouver les appels `t("literal")` et `i18n.t("literal")` dans n'importe quel fichier JS/TS. Noms de fonctions et extensions de fichiers configurables. Les hachages de segment sont les **8 premiers caractères hexadécimaux MD5** de la chaîne source tronquée — ceux-ci deviennent les clés dans `strings.json`.

### `strings.json` {#stringsjson}

Le catalogue principal a la forme suivante :

```json
{
  "<md5-8>": {
    "source": "The English string",
    "translated": {
      "de": "Der deutsche Text",
      "pt-BR": "O texto em português"
    }
  }
}
```

`extract` ajoute de nouvelles clés et préserve les traductions existantes. `translate-ui` remplit les entrées `translated` manquantes et écrit les fichiers de langue plats.

### Fichiers de langue plats {#flat-locale-files}

Chaque langue cible obtient un fichier JSON plat (`de.json`) qui associe la chaîne source → traduction :

```json
{
  "The English string": "Der deutsche Text",
  "Save": "Speichern"
}
```

i18next charge ces fichiers comme des bundles de ressources et recherche les traductions à partir de la chaîne source (modèle clé-comme-valeur-par-défaut).

### Invites de traduction d'interface {#ui-translation-prompts}

`buildUIPromptMessages` construit des messages système et utilisateur qui :
- Identifient les langues source et cible (par nom d'affichage depuis `localeDisplayNames` ou `ui-languages.json`).
- Envoient un tableau JSON de chaînes et demandent en retour un tableau JSON de traductions.
- Incluent des indices de glossaire quand ceux-ci sont disponibles.

`OpenRouterClient.translateUIBatch` essaie chaque modèle dans `translationModels` dans l'ordre, en cas de repli sur les erreurs d'analyse ou de réseau.

---

## Flux de travail 2 - Internes de la traduction de documents {#workflow-2---document-translation-internals}

```
markdown/MDX/JSON files (`translate-docs`)
      │
      ▼  MarkdownExtractor / JsonExtractor
segments[]  ─────────────────── typed segments with hash + content
      │
      ▼  PlaceholderHandler
protected text  ──────────────── URLs, admonitions, anchors replaced with tokens
      │
      ▼  splitTranslatableIntoBatches
batches[]  ───────────────────── grouped by count + char limit
      │
      ▼  TranslationCache lookup
cache hit → skip, miss → OpenRouterClient.translateDocumentBatch
      │
      ▼  PlaceholderHandler.restoreAfterTranslation
final text  ──────────────────── placeholders restored
      │
      ▼  resolveDocumentationOutputPath
output file  ─────────────────── Docusaurus layout or flat layout
```

### Extracteurs {#extractors}

Tous les extracteurs étendent `BaseExtractor` et implémentent `extract(content, filepath): Segment[]`.

- **`MarkdownExtractor`** - divise le markdown en segments typés : `frontmatter`, `heading`, `paragraph`, `code`, `admonition`. Les segments non traduisibles (blocs de code, HTML brut) sont conservés tels quels.
- **`JsonExtractor`** - extrait les valeurs chaînes des fichiers JSON d'étiquettes Docusaurus.
- **`SvgExtractor`** - extrait le contenu des éléments `<text>` et `<title>` du SVG (utilisé par `translate-svg` pour les ressources situées sous `config.svg`, mais pas par `translate-docs`).

### Protection des espaces réservés {#placeholder-protection}

Avant la traduction, la syntaxe sensible est remplacée par des jetons opaques afin d'éviter toute corruption par le LLM :

1. **Marqueurs d'encadré** (`:::note`, `:::`) - restaurés avec le texte original exact.
2. **Ancres de document** (HTML `<a id="…">`, en-tête Docusaurus `{#…}`) - conservés tels quels.
3. **URL Markdown** (`](url)`, `src="…"`) - restaurées à partir d'une table après traduction.

### Cache (`TranslationCache`) {#cache-translationcache}

Base de données SQLite (via `node:sqlite`) stockant des lignes indexées par `(source_hash, locale)` avec `translated_text`, `model`, `filepath`, `last_hit_at` et autres champs associés. Le hachage correspond aux 16 premiers caractères hexadécimaux du contenu normalisé (espaces réduits) via SHA-256.

À chaque exécution, les segments sont recherchés par hachage × locale. Seuls les segments absents du cache sont envoyés au LLM. Après traduction, `last_hit_at` est réinitialisé pour les segments non modifiés — la commande `cleanup` supprime les lignes obsolètes (avec `last_hit_at` nul ou `filepath` vide) ainsi que les lignes orphelines dont le fichier source n'existe plus ; elle sauvegarde d'abord `cache.db`, sauf si l'option `--no-backup` est activée.

La commande `translate-docs` utilise également un **suivi des fichiers** afin de sauter entièrement le traitement des sources inchangées ayant déjà un résultat. L'option `--force-update` relance le traitement des fichiers tout en utilisant le cache de segments ; `--force` efface le suivi des fichiers et ignore les lectures du cache de segments pour la traduction via API. Consultez [Démarrage rapide](./getting-started.md#cache-behaviour-and-translate-docs-flags) pour le tableau complet des options.

### Résolution du chemin de sortie {#output-path-resolution}

`resolveDocumentationOutputPath(config, cwd, locale, relPath, kind)` associe un chemin relatif à la source au chemin de sortie :

- Style **`nested`** (par défaut) : `{outputDir}/{locale}/{relPath}` pour le markdown.
- Style **`docusaurus`** : sous `docsRoot`, les sorties utilisent `{outputDir}/{locale}/docusaurus-plugin-content-docs/current/{relativeToDocsRoot}` ; les chemins en dehors de `docsRoot` reviennent au layout `nested`.
- Style **`flat`** : `{outputDir}/{stem}.{locale}{extension}` (avec option `flatPreserveRelativeDir`).
- **Personnalisé** via `pathTemplate` : n'importe quel agencement utilisant `{outputDir}`, `{locale}`, `{relPath}`, `{stem}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}`.

### Réécriture des liens plats {#flat-link-rewriting}

Lorsque `markdownOutput.style === "flat"`, les fichiers markdown traduits sont placés à côté des sources avec un suffixe de langue. Les liens relatifs entre pages sont réécrits afin que `[Guide](./guide.md)` dans `readme.de.md` pointe vers `guide.de.md`. Contrôlé par `rewriteRelativeLinks` (activé automatiquement pour le style plat sans `pathTemplate` personnalisé).

---

## Infrastructure partagée {#shared-infrastructure}

### `OpenRouterClient` {#openrouterclient}

Encapsule l'API de complétion conversationnelle OpenRouter. Comportements clés :

- **Rétrogradation de modèle** : tente chaque modèle dans `translationModels` dans l'ordre ; passe au suivant en cas d'erreur HTTP ou d'échec d'analyse.
- **Limitation de débit** : détecte les réponses 429, attend `retry-after` (ou 2s), puis réessaie une fois.
- **Cache de prompt** : le message système est envoyé avec `cache_control: { type: "ephemeral" }` pour activer le cache de prompt sur les modèles compatibles.
- **Journal de trafic de débogage** : si `debugTrafficFilePath` est défini, ajoute les JSON de requête et de réponse à un fichier.

### Chargement de la configuration {#config-loading}

Pipeline `loadI18nConfigFromFile(configPath, cwd)` :

1. Lire et analyser `ai-i18n-tools.config.json` (JSON).
2. `mergeWithDefaults` - fusion profonde avec `defaultI18nConfigPartial`.
3. `expandTargetLocalesFileReferenceInRawInput` - si `targetLocales` est un chemin de fichier, charger le manifeste et l'étendre en codes de langue ; définir `uiLanguagesPath`.
4. `expandDocumentationTargetLocalesInRawInput` - même opération pour `documentation.targetLocales`.
5. `parseI18nConfig` - validation Zod + `validateI18nBusinessRules`.
6. `applyEnvOverrides` - appliquer `OPENROUTER_API_KEY`, `I18N_SOURCE_LOCALE`, etc.
7. `augmentConfigWithUiLanguagesFile` - attacher les noms d'affichage du manifeste.

### Logger {#logger}

`Logger` prend en charge les niveaux `debug`, `info`, `warn`, `error` avec sortie couleur ANSI. Le mode verbeux (`-v`) active le niveau `debug`. Lorsque `logFilePath` est défini, les lignes de log sont également écrites dans ce fichier.

---

## API des utilitaires d'exécution {#runtime-helpers-api}

Ces éléments sont exportés depuis `'ai-i18n-tools/runtime'` et fonctionnent dans tout environnement JavaScript (navigateur, Node.js, Deno, Edge). Ils **n'importent pas** depuis `i18next` ou `react-i18next`.

### Utilitaires RTL {#rtl-helpers}

```ts
RTL_LANGS: ReadonlySet<string>
getTextDirection(lng: string): 'ltr' | 'rtl'
applyDirection(lng: string, element?: Element): void
```

### Fabriques de configuration i18next {#i18next-setup-factories}

```ts
defaultI18nInitOptions(sourceLocale?: string): i18nextInitOptions
wrapI18nWithKeyTrim(i18n: I18nLike): void
makeLoadLocale(
  i18n: I18nWithResources,
  localeLoaders: Record<string, () => Promise<unknown>>,
  sourceLocale?: string
): (lang: string) => Promise<void>
```

### Utilitaires d'affichage {#display-helpers}

```ts
getUILanguageLabel(lang: UiLanguageEntry, t: TranslateFn): string
getUILanguageLabelNative(lang: UiLanguageEntry): string
```

### Utilitaires de chaînes de caractères {#string-helpers}

```ts
interpolateTemplate(str: string, vars: Record<string, string | number | boolean>): string
flipUiArrowsForRtl(text: string | null | undefined, isRtl: boolean): string | null | undefined
```

---

## API programmatique {#programmatic-api}

Tous les types et classes publics sont exportés depuis la racine du package. Exemple : exécuter l'étape translate-UI depuis Node.js sans l'interface CLI :

```ts
import { loadI18nConfigFromFile, runTranslateUI } from 'ai-i18n-tools';

// Config must have features.translateUIStrings: true (and valid targetLocales, etc.).
const config = loadI18nConfigFromFile('ai-i18n-tools.config.json');

const summary = await runTranslateUI(config, {
  cwd: process.cwd(),
  locales: config.targetLocales,
  force: false,
  dryRun: false,
  verbose: false,
});
console.log(
  `Updated ${summary.stringsUpdated} string(s); locales touched: ${summary.localesTouched.join(', ')}`
);
```

Exports principaux :

| Export | Description |
|---|---|
| `loadI18nConfigFromFile` | Charger, fusionner et valider la configuration à partir d'un fichier JSON. |
| `parseI18nConfig` | Valider un objet de configuration brut. |
| `TranslationCache` | Cache SQLite - instancier avec un chemin `cacheDir`. |
| `UIStringExtractor` | Extraire les chaînes `t("…")` depuis les sources JS/TS. |
| `MarkdownExtractor` | Extraire les segments traduisibles depuis le markdown. |
| `JsonExtractor` | Extraire depuis les fichiers JSON d'étiquettes Docusaurus. |
| `SvgExtractor` | Extraire depuis les fichiers SVG. |
| `OpenRouterClient` | Effectuer des requêtes de traduction vers OpenRouter. |
| `PlaceholderHandler` | Protéger/restaurer la syntaxe markdown autour de la traduction. |
| `splitTranslatableIntoBatches` | Grouper les segments en lots de taille adaptée aux LLM. |
| `validateTranslation` | Vérifications structurelles après traduction. |
| `resolveDocumentationOutputPath` | Résoudre le chemin du fichier de sortie pour un document traduit. |
| `Glossary` / `GlossaryMatcher` | Charger et appliquer les glossaires de traduction. |
| `runTranslateUI` | Point d'entrée programmatique pour translate-UI. |

---

## Points d'extension {#extension-points}

### Noms de fonctions personnalisés (extraction UI) {#custom-function-names-ui-extraction}

Ajouter des noms de fonctions de traduction non standard via la configuration :

```json
{
  "ui": {
    "reactExtractor": {
      "funcNames": ["t", "i18n.t", "translate", "i18n.translate"]
    }
  }
}
```

### Extracteurs personnalisés {#custom-extractors}

Implémenter `ContentExtractor` depuis le package :

```ts
import { BaseExtractor, type Segment } from 'ai-i18n-tools';

class MyExtractor extends BaseExtractor {
  readonly name = 'my-format';
  canHandle(filepath: string) { return filepath.endsWith('.myext'); }
  extract(content: string): Segment[] { /* … */ }
  reassemble(segments: Segment[], translations: Map<string, string>): string { /* … */ }
}
```

Le transmettre au pipeline doc-translate en important les utilitaires de `doc-translate.ts` de manière programmatique.

### Chemins de sortie personnalisés {#custom-output-paths}

Utiliser `markdownOutput.pathTemplate` pour tout agencement de fichiers :

```json
{
  "documentation": {
    "markdownOutput": {
      "pathTemplate": "{outputDir}/{locale}/{relativeToDocsRoot}"
    }
  }
}
```
