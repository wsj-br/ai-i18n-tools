---
translation_last_updated: '2026-04-11T01:50:10.159Z'
source_file_mtime: '2026-04-11T01:49:54.976Z'
source_file_hash: 2da126d2fe624a4d86e9a84e69d5128bea51a57be4b185213215d6b17c3fd83e
translation_language: fr
source_file_path: docs-site/docs/package-overview.md
---
# ai-i18n-tools : Aperçu du package

Ce document décrit l'architecture interne de `ai-i18n-tools`, la manière dont chaque composant s'assemble, et la mise en œuvre des deux flux de travail principaux.

Pour des instructions d'utilisation pratique, consultez [Bien démarrer](./getting-started.md).

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table des matières**

- [Aperçu de l'architecture](#architecture-overview)
- [Arborescence source](#source-tree)
- [Flux de travail 1 - Internes de la traduction d'interface](#workflow-1---ui-translation-internals)
  - [`UIStringExtractor`](#uistringextractor)
  - [`strings.json`](#stringsjson)
  - [Fichiers de langue plats](#flat-locale-files)
  - [Invites de traduction d'interface](#ui-translation-prompts)
- [Flux de travail 2 - Internes de la traduction de documents](#workflow-2---document-translation-internals)
  - [Extracteurs](#extractors)
  - [Protection des espaces réservés](#placeholder-protection)
  - [Cache (`TranslationCache`)](#cache-translationcache)
  - [Résolution du chemin de sortie](#output-path-resolution)
  - [Réécriture des liens plats](#flat-link-rewriting)
- [Infrastructure partagée](#shared-infrastructure)
  - [`OpenRouterClient`](#openrouterclient)
  - [Chargement de la configuration](#config-loading)
  - [Logger](#logger)
- [API d'assistance au moment de l'exécution](#runtime-helpers-api)
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

## Arborescence source {#source-tree}

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

Utilise `i18next-scanner`'s `Parser.parseFuncFromString` pour trouver les appels `t("literal")` et `i18n.t("literal")` dans n'importe quel fichier JS/TS. Noms de fonctions et extensions de fichiers configurables. Les hachages de segment sont les **8 premiers caractères hexadécimaux MD5** de la chaîne source tronquée — ils deviennent les clés dans `strings.json`.

### `strings.json` {#stringsjson}

Le catalogue principal a la structure suivante :

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

Chaque langue cible obtient un fichier JSON plat (`de.json`) mappant la chaîne source → traduction :

```json
{
  "The English string": "Der deutsche Text",
  "Save": "Speichern"
}
```

i18next charge ces fichiers comme des lots de ressources et recherche les traductions par la chaîne source (modèle clé-par-défaut).

### Invites de traduction d'interface {#ui-translation-prompts}

`buildUIPromptMessages` construit des messages système et utilisateur qui :
- Identifient les langues source et cible (par nom d'affichage provenant de `localeDisplayNames` ou `ui-languages.json`).
- Envoient un tableau JSON de chaînes et demandent en retour un tableau JSON de traductions.
- Incluent des indices de glossaire quand disponibles.

`OpenRouterClient.translateUIBatch` essaie chaque modèle dans `translationModels` dans l'ordre, en cas de retour sur erreur d'analyse ou réseau.

---

## Flux de travail 2 - Internes de la traduction de documents {#workflow-2---document-translation-internals}

```
markdown/MDX/JSON/SVG files
      │
      ▼  MarkdownExtractor / JsonExtractor / SvgExtractor
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
- **`JsonExtractor`** - extrait les valeurs de chaîne des fichiers d'étiquettes JSON Docusaurus.
- **`SvgExtractor`** - extrait le contenu des éléments `<text>` et `<title>` depuis le SVG.

### Protection des espaces réservés {#placeholder-protection}

Avant la traduction, la syntaxe sensible est remplacée par des jetons opaques afin d'éviter la corruption par le LLM :

1. **Marqueurs d'encadré** (`:::note`, `:::`) - restaurés avec le texte original exact.
2. **Ancres de document** (HTML `<a id="…">`, en-tête Docusaurus `{#…}`) - conservés tels quels.
3. **URL Markdown** (`](url)`, `src="…"`) - restaurées à partir d'une table après traduction.

### Cache (`TranslationCache`) {#cache-translationcache}

Base de données SQLite (via `node:sqlite`) stockant `(source_hash, locale, translated_content, model, cost, last_hit_at)`. Le hachage correspond aux 16 premiers caractères hexadécimaux SHA-256 du contenu normalisé (espaces réduits).

À chaque exécution, les segments sont recherchés par hachage × locale. Seuls les segments absents du cache sont envoyés au LLM. Après traduction, `last_hit_at` est réinitialisé pour les segments non modifiés ; `cleanup` supprime les lignes obsolètes (avec `last_hit_at` nul ou `filepath` vide) et les lignes orphelines dont le fichier source n'existe plus ; il sauvegarde d'abord `cache.db`, sauf si l'option `--no-backup` est activée.

La commande `translate-docs` utilise également un **suivi des fichiers** afin que les sources inchangées avec sorties existantes puissent ignorer complètement le traitement. L'option `--force-update` relance le traitement des fichiers tout en utilisant le cache de segments ; `--force` efface le suivi des fichiers et ignore les lectures du cache de segments pour la traduction via API. Voir [Démarrage rapide](./getting-started.md#cache-behavior-and-translate-docs-flags) pour le tableau complet des options.

### Résolution du chemin de sortie {#output-path-resolution}

`resolveDocumentationOutputPath(config, cwd, locale, relPath, kind)` associe un chemin relatif à la source au chemin de sortie :

- Style **`docusaurus`** : `{outputDir}/{locale}/docusaurus-plugin-content-docs/current/{relativeToDocsRoot}`.
- Style **`flat`** : `{outputDir}/{stem}.{locale}{extension}` (avec option `flatPreserveRelativeDir`).
- `pathTemplate` **personnalisé** : n'importe quelle structure utilisant `{outputDir}`, `{locale}`, `{relPath}`, `{stem}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}`.

### Réécriture des liens plats {#flat-link-rewriting}

Lorsque `markdownOutput.style === "flat"`, les fichiers markdown traduits sont placés à côté des sources avec des suffixes de langue. Les liens relatifs entre pages sont réécrits afin que `[Guide](./guide.md)` dans `readme.de.md` pointe vers `guide.de.md`. Contrôlé par `rewriteRelativeLinks` (activé automatiquement pour le style plat sans `pathTemplate` personnalisé).

---

## Infrastructure partagée {#shared-infrastructure}

### `OpenRouterClient` {#openrouterclient}

Encapsule l'API OpenRouter de complétion conversationnelle. Comportements clés :

- **Modèle de secours** : tente chaque modèle dans `translationModels` dans l'ordre ; passe au suivant en cas d'erreur HTTP ou d'échec d'analyse.
- **Limitation de débit** : détecte les réponses 429, attend `retry-after` (ou 2 secondes), puis réessaie une fois.
- **Cache de prompt** : le message système est envoyé avec `cache_control: { type: "ephemeral" }` pour activer le cache de prompt sur les modèles compatibles.
- **Journal de trafic de débogage** : si `debugTrafficFilePath` est défini, ajoute les JSON de requête et de réponse à un fichier.

### Chargement de la configuration {#config-loading}

`loadI18nConfigFromFile(configPath, cwd)` pipeline :

1. Lire et analyser `ai-i18n-tools.config.json` (JSON).
2. `mergeWithDefaults` - fusion profonde avec `defaultI18nConfigPartial`.
3. `expandTargetLocalesFileReferenceInRawInput` - si `targetLocales` est un chemin de fichier, charger le manifeste et développer en codes de langue ; définir `uiLanguagesPath`.
4. `expandDocumentationTargetLocalesInRawInput` - identique pour `documentation.targetLocales`.
5. `parseI18nConfig` - Validation Zod + `validateI18nBusinessRules`.
6. `applyEnvOverrides` - appliquer `OPENROUTER_API_KEY`, `I18N_SOURCE_LOCALE`, etc.
7. `augmentConfigWithUiLanguagesFile` - attacher les noms d'affichage du manifeste.

### Journaliseur {#logger}

Le `Logger` prend en charge les niveaux `debug`, `info`, `warn`, `error` avec une sortie en couleur ANSI. Le mode verbose (`-v`) active le `debug`. La sortie du journal peut être redirigée vers un fichier en passant `logFilePath`.

---

## API des assistants d'exécution {#runtime-helpers-api}

Ceux-ci sont exportés depuis `'ai-i18n-tools/runtime'` et fonctionnent dans n'importe quel environnement JavaScript (navigateur, Node.js, Deno, Edge). Ils n'importent **pas** depuis `i18next` ou `react-i18next`.

### Assistants RTL {#rtl-helpers}

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

### Assistants d'affichage {#display-helpers}

```ts
getUILanguageLabel(lang: UiLanguageEntry, t: TranslateFn): string
getUILanguageLabelNative(lang: UiLanguageEntry): string
```

### Assistants de chaîne {#string-helpers}

```ts
interpolateTemplate(str: string, vars: Record<string, string | number | boolean>): string
flipUiArrowsForRtl(text: string | null | undefined, isRtl: boolean): string | null | undefined
```

---

## API programmatique {#programmatic-api}

Tous les types et classes publics sont exportés depuis la racine du package. Exemple : exécuter l'étape de traduction de l'interface utilisateur depuis Node.js sans l'interface en ligne de commande :

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
console.log(`Translated ${summary.translated} strings across ${summary.locales} locales`);
```

Exportations clés :

| Exportation | Description |
|---|---|
| `loadI18nConfigFromFile` | Charger, fusionner, valider la configuration à partir d'un fichier JSON. |
| `parseI18nConfig` | Valider un objet de configuration brut. |
| `TranslationCache` | Cache SQLite - instancier avec un chemin `cacheDir`. |
| `UIStringExtractor` | Extraire les chaînes `t("…")` des sources JS/TS. |
| `MarkdownExtractor` | Extraire les segments traduisibles du markdown. |
| `JsonExtractor` | Extraire des fichiers d'étiquettes JSON Docusaurus. |
| `SvgExtractor` | Extraire des fichiers SVG. |
| `OpenRouterClient` | Effectuer des demandes de traduction vers OpenRouter. |
| `PlaceholderHandler` | Protéger/restaurer la syntaxe markdown autour de la traduction. |
| `splitTranslatableIntoBatches` | Regrouper les segments en lots adaptés aux LLM. |
| `validateTranslation` | Vérifications structurelles après traduction. |
| `resolveDocumentationOutputPath` | Résoudre le chemin de fichier de sortie pour un document traduit. |
| `Glossary` / `GlossaryMatcher` | Charger et appliquer les glossaires de traduction. |
| `runTranslateUI` | Point d'entrée programmatique pour traduire l'interface utilisateur. |

---

## Points d'extension {#extension-points}

### Noms de fonctions personnalisés (extraction d'interface utilisateur) {#custom-function-names-ui-extraction}

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

Le transmettre au pipeline de traduction de documents en important programmatiquement les utilitaires `doc-translate.ts`.

### Chemins de sortie personnalisés {#custom-output-paths}

Utiliser `markdownOutput.pathTemplate` pour n'importe quelle disposition de fichier :

```json
{
  "documentation": {
    "markdownOutput": {
      "pathTemplate": "{outputDir}/{locale}/{relativeToDocsRoot}"
    }
  }
}
```
