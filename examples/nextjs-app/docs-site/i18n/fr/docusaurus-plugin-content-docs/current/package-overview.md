---
translation_last_updated: '2026-04-13T00:28:35.827Z'
source_file_mtime: '2026-04-13T00:28:15.569Z'
source_file_hash: 8cb494fb19654fd14572478692aec0c22bd75c6a5c37c0ab229cfc0a1145cd16
translation_language: fr
source_file_path: docs-site/docs/package-overview.md
---
# ai-i18n-tools : Vue d'ensemble du package

Ce document décrit l'architecture interne de `ai-i18n-tools`, comment chaque composant s'intègre et comment les deux flux de travail principaux sont implémentés.

Pour des instructions d'utilisation pratiques, voir [Prise en main](./getting-started.md).

<small>**Lire dans d'autres langues :** </small>
<small id="lang-list">[en-GB](./PACKAGE_OVERVIEW.md) · [de](../translated-docs/docs/PACKAGE_OVERVIEW.de.md) · [es](../translated-docs/docs/PACKAGE_OVERVIEW.es.md) · [fr](../translated-docs/docs/PACKAGE_OVERVIEW.fr.md) · [hi](../translated-docs/docs/PACKAGE_OVERVIEW.hi.md) · [ja](../translated-docs/docs/PACKAGE_OVERVIEW.ja.md) · [ko](../translated-docs/docs/PACKAGE_OVERVIEW.ko.md) · [pt-BR](../translated-docs/docs/PACKAGE_OVERVIEW.pt-BR.md) · [zh-CN](../translated-docs/docs/PACKAGE_OVERVIEW.zh-CN.md) · [zh-TW](../translated-docs/docs/PACKAGE_OVERVIEW.zh-TW.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table des matières**

- [Vue d'ensemble de l'architecture](#architecture-overview)
- [Arbre source](#source-tree)
- [Flux de travail 1 - Internes de la traduction UI](#workflow-1---ui-translation-internals)
  - [`UIStringExtractor`](#uistringextractor)
  - [`strings.json`](#stringsjson)
  - [Fichiers de locale plats](#flat-locale-files)
  - [Invites de traduction UI](#ui-translation-prompts)
- [Flux de travail 2 - Internes de la traduction de documents](#workflow-2---document-translation-internals)
  - [Extracteurs](#extractors)
  - [Protection des espaces réservés](#placeholder-protection)
  - [Cache (`TranslationCache`)](#cache-translationcache)
  - [Résolution du chemin de sortie](#output-path-resolution)
  - [Réécriture de liens plats](#flat-link-rewriting)
- [Infrastructure partagée](#shared-infrastructure)
  - [`OpenRouterClient`](#openrouterclient)
  - [Chargement de la configuration](#config-loading)
  - [Journaliseur](#logger)
- [API des helpers d'exécution](#runtime-helpers-api)
  - [Helpers RTL](#rtl-helpers)
  - [Usines de configuration i18next](#i18next-setup-factories)
  - [Helpers d'affichage](#display-helpers)
  - [Helpers de chaîne](#string-helpers)
- [API programmatique](#programmatic-api)
- [Points d'extension](#extension-points)
  - [Noms de fonctions personnalisées (extraction UI)](#custom-function-names-ui-extraction)
  - [Extracteurs personnalisés](#custom-extractors)
  - [Chemins de sortie personnalisés](#custom-output-paths)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

---

## Vue d'ensemble de l'architecture {#architecture-overview}

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

Tout ce dont les consommateurs peuvent avoir besoin de manière programmatique est ré-exporté depuis `src/index.ts`.

---

## Arbre source {#source-tree}

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

## Flux de travail 1 - Internes de la traduction UI {#workflow-1---ui-translation-internals}

```
source files (JS/TS)
      │
      ▼  UIStringExtractor (i18next-scanner Parser)
strings.json  ─────────────────── master catalog
      │             { hash: { source, translated, models?, locations? } }
      ▼
OpenRouterClient.translateUIBatch()
      │  sends JSON array of source strings, receives JSON array of translations (+ model id per batch)
      ▼
de.json, pt-BR.json …  ─────────── per-locale flat maps: source → translation (no model metadata)
```

### `UIStringExtractor` {#uistringextractor}

Utilise `i18next-scanner`'s `Parser.parseFuncFromString` pour trouver les appels `t("literal")` et `i18n.t("literal")` dans n'importe quel fichier JS/TS. Les noms de fonctions et les extensions de fichiers sont configurables, et l'extraction peut également inclure la `description` du projet `package.json` lorsque `reactExtractor.includePackageDescription` est activé. Les hachages de segment sont les **8 premiers caractères hexadécimaux MD5** de la chaîne source tronquée - ceux-ci deviennent les clés dans `strings.json`.

### `strings.json` {#stringsjson}

Le catalogue maître a la forme :

```json
{
  "<md5-8>": {
    "source": "The English string",
    "translated": {
      "de": "Der deutsche Text",
      "pt-BR": "O texto em português"
    },
    "models": {
      "de": "anthropic/claude-3.5-haiku",
      "pt-BR": "openai/gpt-4o"
    },
    "locations": [{ "file": "src/app/page.tsx", "line": 51 }]
  }
}
```

`models` (optionnel) — par locale, quel modèle a produit cette traduction après le dernier `translate-ui` réussi pour cette locale (ou `user-edited` si le texte a été enregistré depuis l'interface web `editor`). `locations` (optionnel) — où `extract` a trouvé la chaîne.

`extract` ajoute de nouvelles clés et préserve les données `translated` / `models` existantes pour les clés encore présentes dans le scan. `translate-ui` remplit les entrées `translated` manquantes, met à jour `models` pour les locales qu'il traduit, et écrit des fichiers de locale plats.

### Fichiers de locale plats {#flat-locale-files}

Chaque locale cible obtient un fichier JSON plat (`de.json`) mappant la chaîne source → traduction (sans champ `models`) :

```json
{
  "The English string": "Der deutsche Text",
  "Save": "Speichern"
}
```

i18next charge ces fichiers en tant que bundles de ressources et recherche des traductions par la chaîne source (modèle par défaut clé).

### Invites de traduction UI {#ui-translation-prompts}

`buildUIPromptMessages` construit des messages système + utilisateur qui :
- Identifient les langues source et cible (par nom d'affichage depuis `localeDisplayNames` ou `ui-languages.json`).
- Envoient un tableau JSON de chaînes et demandent un tableau JSON de traductions en retour.
- Incluent des indices de glossaire lorsque disponibles.

`OpenRouterClient.translateUIBatch` essaie chaque modèle dans l'ordre, se rabattant sur les erreurs de parsing ou de réseau. La CLI construit cette liste à partir de `openrouter.translationModels` (ou par défaut/retour hérité) ; pour `translate-ui`, le `ui.preferredModel` optionnel est ajouté lorsqu'il est défini (dédupliqué par rapport au reste).

---

## Workflow 2 - Internes de la traduction de documents {#workflow-2---document-translation-internals}

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

- `MarkdownExtractor` - divise le markdown en segments typés : `frontmatter`, `heading`, `paragraph`, `code`, `admonition`. Les segments non traduisibles (blocs de code, HTML brut) sont préservés tels quels.
- `JsonExtractor` - extrait les valeurs de chaîne des fichiers de labels JSON de Docusaurus.
- `SvgExtractor` - extrait le contenu `<text>`, `<title>`, et `<desc>` des SVG (utilisé par `translate-svg` pour les actifs sous `config.svg`, pas par `translate-docs`).

### Protection des espaces réservés {#placeholder-protection}

Avant la traduction, la syntaxe sensible est remplacée par des jetons opaques pour éviter toute corruption par le LLM :

1. **Marqueurs d'admonition** (`:::note`, `:::`) - restaurés avec le texte original exact.
2. **Ancres de document** (HTML `<a id="…">`, titre Docusaurus `{#…}`) - préservés tels quels.
3. **URLs Markdown** (`](url)`, `src="…"`) - restaurées à partir d'une table de correspondance après la traduction.

### Cache (`TranslationCache`) {#cache-translationcache}

Une base de données SQLite (via `node:sqlite`) stocke les lignes indexées par `(source_hash, locale)` avec `translated_text`, `model`, `filepath`, `last_hit_at` et des champs associés. Le hash correspond aux 16 premiers caractères hexadécimaux du SHA-256 du contenu normalisé (espaces réduits).

À chaque exécution, les segments sont recherchés par hash × locale. Seuls les échecs de cache sont envoyés au LLM. Après la traduction, `last_hit_at` est réinitialisé pour les lignes de segment dans le périmètre de traduction actuel qui n'ont pas été atteintes. `cleanup` exécute d'abord `sync --force-update`, puis supprime les lignes de segment obsolètes (`last_hit_at` nul / filepath vide), nettoie les clés `file_tracking` lorsque le chemin source résolu est absent du disque (`doc-block:…`, `svg-assets:…`, etc.), et supprime les lignes de traduction dont le filepath des métadonnées pointe vers un fichier manquant ; il sauvegarde `cache.db` au préalable, sauf si `--no-backup` est passé.

La commande `translate-docs` utilise également le **suivi de fichiers** afin que les sources inchangées avec des sorties existantes puissent ignorer tout travail. `--force-update` relance le traitement des fichiers tout en continuant d'utiliser le cache de segments ; `--force` efface le suivi de fichiers et contourne les lectures du cache de segments pour la traduction via API. Voir [Démarrage](./getting-started.md#cache-behaviour-and-translate-docs-flags) pour le tableau complet des options.

**Format de prompt par lot :** `translate-docs --prompt-format` sélectionne les formes XML (`<seg>` / `<t>`) ou JSON tableau/objet uniquement pour `OpenRouterClient.translateDocumentBatch` ; l'extraction, les espaces réservés et la validation restent inchangés. Voir [Format de prompt par lot](./getting-started.md#batch-prompt-format).

### Résolution du chemin de sortie {#output-path-resolution}

`resolveDocumentationOutputPath(config, cwd, locale, relPath, kind)` fait correspondre un chemin relatif à la source avec le chemin de sortie :

- style `nested` (par défaut) : `{outputDir}/{locale}/{relPath}` pour le markdown.
- style `docusaurus` : sous `docsRoot`, les sorties utilisent `{outputDir}/{locale}/docusaurus-plugin-content-docs/current/{relativeToDocsRoot}` ; les chemins en dehors de `docsRoot` reviennent au format imbriqué.
- style `flat` : `{outputDir}/{stem}.{locale}{extension}`. Lorsque `flatPreserveRelativeDir` est `true`, les sous-répertoires source sont conservés sous `outputDir`.
- **Personnalisé** `pathTemplate` : tout format markdown utilisant `{outputDir}`, `{locale}`, `{LOCALE}`, `{relPath}`, `{stem}`, `{basename}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}`.
- **Personnalisé** `jsonPathTemplate` : mise en page personnalisée séparée pour les fichiers de labels JSON, utilisant les mêmes espaces réservés.
- `linkRewriteDocsRoot` aide le réécrivain de liens plats à calculer les préfixes corrects lorsque la sortie traduite est ancrée ailleurs que dans le répertoire racine du projet par défaut.

### Réécriture de liens plats {#flat-link-rewriting}

Lorsque `markdownOutput.style === "flat"`, les fichiers markdown traduits sont placés à côté de la source avec des suffixes de locale. Les liens relatifs entre les pages sont réécrits de sorte que `[Guide](./guide.md)` dans `readme.de.md` pointe vers `guide.de.md`. Contrôlé par `rewriteRelativeLinks` (activé automatiquement pour le style flat sans `pathTemplate` personnalisé).

---

## Infrastructure partagée {#shared-infrastructure}

### `OpenRouterClient` {#openrouterclient}

Enveloppe l'API de complétion de chat OpenRouter. Comportements clés :

- **Fallback du modèle** : essaie chaque modèle dans la liste résolue dans l'ordre ; revient en arrière en cas d'erreurs HTTP ou d'échecs d'analyse. La traduction de l'interface utilisateur résout d'abord `ui.preferredModel` lorsqu'il est présent, puis les modèles `openrouter`.
- **Limitation de taux** : détecte les réponses 429, attend `retry-after` (ou 2s), réessaie une fois.
- **Mise en cache des invites** : le message système est envoyé avec `cache_control: { type: "ephemeral" }` pour activer la mise en cache des invites sur les modèles pris en charge.
- **Journal de trafic de débogage** : si `debugTrafficFilePath` est défini, ajoute les requêtes et les réponses JSON dans un fichier.

### Chargement de la configuration {#config-loading}

`loadI18nConfigFromFile(configPath, cwd)` pipeline :

1. Lire et analyser `ai-i18n-tools.config.json` (JSON).
2. `mergeWithDefaults` - fusion profonde avec `defaultI18nConfigPartial`, et fusionner toutes les entrées `documentations[].sourceFiles` dans `contentPaths`.
3. `expandTargetLocalesFileReferenceInRawInput` - si `targetLocales` est un chemin de fichier, charger le manifeste et développer en codes de locale ; définir `uiLanguagesPath`.
4. `expandDocumentationTargetLocalesInRawInput` - même pour chaque entrée `documentations[].targetLocales`.
5. `parseI18nConfig` - validation Zod + `validateI18nBusinessRules`.
6. `applyEnvOverrides` - appliquer `OPENROUTER_API_KEY`, `I18N_SOURCE_LOCALE`, etc.
7. `augmentConfigWithUiLanguagesFile` - attacher les noms d'affichage du manifeste.

### Journal {#logger}

`Logger` prend en charge les niveaux `debug`, `info`, `warn`, `error` avec sortie couleur ANSI. Le mode verbeux (`-v`) active `debug`. Lorsque `logFilePath` est défini, les lignes de journal sont également écrites dans ce fichier.

---

## API des helpers d'exécution {#runtime-helpers-api}

Ceux-ci sont exportés depuis `'ai-i18n-tools/runtime'` et fonctionnent dans n'importe quel environnement JavaScript (navigateur, Node.js, Deno, Edge). Ils **ne** s'importent pas depuis `i18next` ou `react-i18next`.

### Helpers RTL {#rtl-helpers}

```ts
RTL_LANGS: ReadonlySet<string>
getTextDirection(lng: string): 'ltr' | 'rtl'
applyDirection(lng: string, element?: Element): void
```

### Usines de configuration i18next {#i18next-setup-factories}

```ts
defaultI18nInitOptions(sourceLocale?: string): i18nextInitOptions
wrapI18nWithKeyTrim(i18n: I18nLike): void
makeLoadLocale(
  i18n: I18nWithResources,
  localeLoaders: Record<string, () => Promise<unknown>>,
  sourceLocale?: string
): (lang: string) => Promise<void>
```

### Helpers d'affichage {#display-helpers}

```ts
getUILanguageLabel(lang: UiLanguageEntry, t: TranslateFn): string
getUILanguageLabelNative(lang: UiLanguageEntry): string
```

### Helpers de chaîne {#string-helpers}

```ts
interpolateTemplate(str: string, vars: Record<string, string | number | boolean>): string
flipUiArrowsForRtl(text: string | null | undefined, isRtl: boolean): string | null | undefined
```

---

## API programmatique {#programmatic-api}

Tous les types et classes publics sont exportés depuis la racine du package. Exemple : exécuter l'étape translate-UI depuis Node.js sans l'interface en ligne de commande :

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

Exports clés :

| Export | Description |
|---|---|
| `loadI18nConfigFromFile` | Charger, fusionner, valider la configuration à partir d'un fichier JSON. |
| `parseI18nConfig` | Valider un objet de configuration brut. |
| `TranslationCache` | Cache SQLite - instancier avec un chemin `cacheDir`. |
| `UIStringExtractor` | Extraire les chaînes `t("…")` des sources JS/TS. |
| `MarkdownExtractor` | Extraire les segments traduisibles du markdown. |
| `JsonExtractor` | Extraire des fichiers d'étiquettes JSON Docusaurus. |
| `SvgExtractor` | Extraire des fichiers SVG. |
| `OpenRouterClient` | Faire des demandes de traduction à OpenRouter. |
| `PlaceholderHandler` | Protéger/restaurer la syntaxe markdown autour de la traduction. |
| `splitTranslatableIntoBatches` | Regrouper les segments en lots de taille LLM. |
| `validateTranslation` | Vérifications structurelles après la traduction. |
| `resolveDocumentationOutputPath` | Résoudre le chemin du fichier de sortie pour un document traduit. |
| `Glossary` / `GlossaryMatcher` | Charger et appliquer des glossaires de traduction. |
| `runTranslateUI` | Point d'entrée programmatique pour translate-UI. |

---

## Points d'extension {#extension-points}

### Noms de fonctions personnalisées (extraction UI) {#custom-function-names-ui-extraction}

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

Passez-le au pipeline de doc-translate en important les utilitaires `doc-translate.ts` de manière programmatique.

### Chemins de sortie personnalisés {#custom-output-paths}

Utilisez `markdownOutput.pathTemplate` pour toute mise en page de fichier :

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
