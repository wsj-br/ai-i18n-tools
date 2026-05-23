<a id="ai-i18n-tools-package-overview"></a>
# ai-i18n-tools : Aperçu du package

Ce document décrit l'architecture interne de `ai-i18n-tools`, la manière dont chaque composant s'assemble, et la mise en œuvre des deux flux de travail principaux.

Pour des instructions d'utilisation pratiques, consultez [GETTING_STARTED.md](GETTING_STARTED.fr.md). Pour les captures d'écran et les fichiers SVG illustrés dans les documents traduits, consultez [LOCALE-ASSETS-GUIDE.md](LOCALE-ASSETS-GUIDE.fr.md).

<small>**Lire dans d'autres langues :** </small>
<small id="lang-list">[English (GB)](../../docs/PACKAGE_OVERVIEW.md) · [Deutsch](./PACKAGE_OVERVIEW.de.md) · [Español](./PACKAGE_OVERVIEW.es.md) · [Français](./PACKAGE_OVERVIEW.fr.md) · [हिन्दी](./PACKAGE_OVERVIEW.hi.md) · [日本語](./PACKAGE_OVERVIEW.ja.md) · [한국어](./PACKAGE_OVERVIEW.ko.md) · [Português (Brasil)](./PACKAGE_OVERVIEW.pt-BR.md) · [中文 (中国大陆)](./PACKAGE_OVERVIEW.zh-CN.md) · [中文 (台灣)](./PACKAGE_OVERVIEW.zh-TW.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table des matières**

- [Aperçu de l'architecture](#architecture-overview)
- [Arborescence source](#source-tree)
- [Workflow 1 - Internals de la traduction d'interface](#workflow-1---ui-translation-internals)
  - [`UIStringExtractor`](#uistringextractor)
  - [`strings.json`](#stringsjson)
  - [Fichiers localisés plats](#flat-locale-files)
  - [Invites de traduction d'interface](#ui-translation-prompts)
- [Workflow 2 - Internals de la traduction de documents](#workflow-2---document-translation-internals)
  - [Extracteurs](#extractors)
  - [Insertion d'ancre de titre (CLI `write-heading-ids`)](#heading-anchor-insertion-write-heading-ids-cli)
  - [Protection des espaces réservés](#placeholder-protection)
  - [Cache (`TranslationCache`)](#cache-translationcache)
  - [Résolution du chemin de sortie](#output-path-resolution)
  - [Réécriture de liens plats](#flat-link-rewriting)
- [Infrastructure partagée](#shared-infrastructure)
  - [`OpenRouterClient`](#openrouterclient)
  - [Chargement de la configuration](#config-loading)
  - [Logger](#logger)
- [API d'aide au runtime](#runtime-helpers-api)
  - [Aides RTL](#rtl-helpers)
  - [Fabriques de configuration i18next](#i18next-setup-factories)
  - [Aides d'affichage](#display-helpers)
  - [Aides de chaînes](#string-helpers)
- [API programmatique](#programmatic-api)
- [Points d'extension](#extension-points)
  - [Noms de fonctions personnalisés (extraction d'interface)](#custom-function-names-ui-extraction)
  - [Extracteurs personnalisés](#custom-extractors)
  - [Chemins de sortie personnalisés](#custom-output-paths)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

---

<a id="architecture-overview"></a>
## Aperçu de l'architecture

```text
ai-i18n-tools
├── CLI (src/cli/)             - commands: init, extract, translate-docs, write-heading-ids, translate-svg, translate-ui, sync, status, …
├── Core (src/core/)           - config, types, cache, prompts, output paths, UI languages
├── Extractors (src/extractors/)  - segment extraction from JS/TS, markdown, JSON, SVG
├── Processors (src/processors/)  - MDX placeholders, HTML tags, admonitions, anchors, URLs, batching, validation, link rewriting, emphasis
├── API (src/api/)             - OpenRouter HTTP client
├── Glossary (src/glossary/)   - glossary loading and term matching
├── Runtime (src/runtime/)     - i18next helpers, display helpers (no i18next import)
├── Server (src/server/)       - local Express web editor for cache / glossary
└── Utils (src/utils/)         - logger, hash, ignore parser
```

Tout ce dont les consommateurs peuvent avoir besoin de manière programmatique est re-exporté depuis `src/index.ts`.

---

<a id="source-tree"></a>
## Arborescence source

```text
src/
├── index.ts                        Public API re-exports
│
├── cli/
│   ├── index.ts                    CLI entry point (commander)
│   ├── extract-strings.ts          `extract` command implementation
│   ├── translate-ui-strings.ts     `translate-ui` command implementation
│   ├── doc-translate.ts            `translate-docs` command (documentation files only)
│   ├── translate-svg.ts            `translate-svg` command (SVG files from `config.svg`)
│   ├── write-heading-ids.ts        `write-heading-ids` command (markdown heading anchors)
│   ├── helpers.ts                  Shared CLI utilities
│   └── file-utils.ts               File collection helpers
│
├── markdown/
│   └── write-heading-ids-core.ts   Slug styles + `<a id="…">` insertion for `write-heading-ids`
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
│   ├── placeholder-handler.ts      Chain: HTML → admonitions → anchors → MDX → URLs → emphasis
│   ├── url-placeholders.ts         Markdown URL protection/restore
│   ├── admonition-placeholders.ts  Docusaurus admonition protection/restore
│   ├── anchor-placeholders.ts      HTML anchor / heading ID protection/restore
│   ├── html-tag-placeholders.ts    Lowercase HTML tag / comment protection ({{HTM_N}})
│   ├── mdx-placeholders.ts         MDX comments, JSX tags, brace expressions, JSX attribute extraction
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
├── dashboard-app/
│   ├── index.html                  Translation Dashboard static UI (HTML/CSS/JS)
│   ├── app.js
│   └── styles.css
│
├── server/
│   └── translation-dashboard.ts    Express app for Translation Dashboard (cache / strings.json / glossary)
│
└── utils/
    ├── logger.ts                   Leveled logger with ANSI support
    ├── hash.ts                     Segment hash (SHA-256 first 16 hex)
    └── ignore-parser.ts            .translate-ignore file parser
```

---

<a id="workflow-1---ui-translation-internals"></a>
## Workflow 1 - Fonctionnement interne de la traduction d'interface

```text
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

<a id="uistringextractor"></a>
### `UIStringExtractor`

Utilise `i18next-scanner` et `Parser.parseFuncFromString` pour détecter les appels à `t("literal")` et `i18n.t("literal")` dans n'importe quel fichier JS/TS. Les noms de fonctions et les extensions de fichiers sont configurables. `extract` **fusionne également les entrées non issues du scanneur dans le même catalogue :** le fichier `package.json` du projet `description` lorsque `reactExtractor.includePackageDescription` est activé (par défaut), et chaque `englishName` provenant de `ui-languages.json` lorsque `reactExtractor.includeUiLanguageEnglishNames` est défini à `true` et que `uiLanguagesPath` est configuré (les chaînes déjà présentes dans le code source ont la priorité). Les hachages des segments sont les **8 premiers caractères hexadécimaux du MD5** de la chaîne source (après suppression des espaces superflus) — ceux-ci deviennent les clés dans `strings.json`.

<a id="stringsjson"></a>
### `strings.json`

Le catalogue principal a la forme suivante :

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

`models` (facultatif) — par langue, indique quel modèle a produit cette traduction après la dernière exécution réussie de `translate-ui` pour cette langue (ou `user-edited` si le texte a été enregistré depuis l'interface web de `editor`). `locations` (facultatif) — indique où `extract` a trouvé la chaîne (scanneur + ligne de description du package ; les chaînes issues uniquement du manifeste `englishName` peuvent omettre `locations`).

`extract` ajoute de nouvelles clés et préserve les données existantes de `translated` / `models` pour les clés toujours présentes dans le scan (littéraux du scanneur, description facultative, manifeste `englishName` facultatif). `translate-ui` remplit les entrées `translated` manquantes, met à jour `models` pour les langues qu'il traduit, et écrit les fichiers de langue plats.

`ui-languages.json` **manifeste** — tableau JSON de `{ code, label, englishName, direction }` (BCP-47 `code`, interface `label`, référence `englishName`, `"ltr"` ou `"rtl"`). Utilisez `generate-ui-languages` pour générer un fichier projet à partir de `sourceLocale` + `targetLocales` et du catalogue maître intégré `data/ui-languages-complete.json`.

<a id="flat-locale-files"></a>
### Fichiers de locale plats

Chaque langue cible obtient un fichier JSON plat (`de.json`) qui associe chaîne source → traduction (sans champ `models`) :

```json
{
  "The English string": "Der deutsche Text",
  "Save": "Speichern"
}
```

i18next charge ces fichiers comme des bundles de ressources et recherche les traductions à partir de la chaîne source (modèle clé-par-défaut).

<a id="ui-translation-prompts"></a>
### Messages de traduction pour l'interface

`buildUIPromptMessages` construit des messages système et utilisateur qui :

- Identifier les langues source et cible (par nom d'affichage à partir de `localeDisplayNames` ou `ui-languages.json`).
- Envoyer un tableau JSON de chaînes et demander en retour un tableau JSON de traductions.
- Inclure des indices de glossaire quand disponibles.

`OpenRouterClient.translateUIBatch` essaie chaque modèle dans l'ordre, en cas d'échec sur une erreur d'analyse ou réseau. L'interface en ligne de commande (CLI) construit cette liste à partir de `openrouter.translationModels` (ou valeur par défaut/fallback héritée) ; pour `translate-ui`, `ui.preferredModel` facultatif est ajouté en début de liste lorsqu'il est défini (doublons supprimés par rapport au reste).

---

<a id="workflow-2---document-translation-internals"></a>
## Workflow 2 - Fonctionnement interne de la traduction de documents

```text
markdown/MDX/JSON files (`translate-docs`)
      │
      ▼  MarkdownExtractor / JsonExtractor
segments[]  ─────────────────── typed segments with hash + content
      │
      ▼  PlaceholderHandler
protected text  ──────────────── HTML tags, admonitions, anchors, MDX comments/JSX/braces,
                                URLs, inline code, emphasis masked as tokens
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

<a id="extractors"></a>
### Extracteurs

Tous les extracteurs étendent `BaseExtractor` et implémentent `extract(content, filepath): Segment[]`.

- `MarkdownExtractor` - divise le markdown en segments typés : `frontmatter`, `heading`, `paragraph`, `code`, `admonition`. Le frontmatter YAML est classé comme **non traduisible** (`slug`, `id` et d'autres clés de routage restent stables). Les blocs `export ...` de niveau supérieur (par exemple, les définitions de composants React) sont classés comme des segments `other` non traduisibles, au même titre que la gestion existante de `import ...`. Les blocs multilignes commençant par une balise JSX en majuscule (par exemple, un bloc `<Tabs>`) sont classés comme des paragraphes traduisibles. Les segments non traduisibles (blocs de code, HTML brut) sont conservés à l'identique.
- `JsonExtractor` - extrait les valeurs de chaînes à partir des fichiers d'étiquettes JSON de Docusaurus (catalogues d'interface utilisateur Docusaurus, pas le corps MDX).
- `SvgExtractor` - extrait le contenu `<text>`, `<title>` et `<desc>` des fichiers SVG (utilisé par `translate-svg` pour les fichiers situés sous `config.svg`, mais pas par `translate-docs`).

<a id="heading-anchor-insertion-write-heading-ids-cli"></a>
### Insertion d'ancre de titre (`write-heading-ids` CLI)

La commande `write-heading-ids` est un préprocesseur **local et non basé sur un LLM** pour les fichiers Markdown de documentation. Implémentation : `src/cli/write-heading-ids.ts` orchestre la découverte des fichiers ; `src/markdown/write-heading-ids-core.ts` analyse les lignes et insère les ancres.

Elle nécessite une configuration valide contenant **au moins un bloc `documentations[]`**. Pour chaque bloc, elle récupère les fichiers `.md` / `.mdx` situés sous `contentPaths`, applique les règles `.translate-ignore` du projet (même principe que pour la traduction de documentation), et peut éventuellement se limiter à un sous-arbre avec `--path` / `--file`. Chaque fichier est transformé via `applyHeadingAnchorsToMarkdown` : pour chaque **titre ATX plat** (`# …` à `###### …`) en dehors des blocs de code délimités, une ligne HTML vide `<a id="slug"></a>` est insérée sur la ligne précédente si elle est absente ou obsolète. Les algorithmes de génération des slugs correspondent aux écosystèmes courants — `github` (par défaut), `bitbucket`, `gitlab`, `pymdown` (avec options de normalisation Unicode et d'encodage en pourcentage), `azure-devops` — afin que les identifiants d'ancre restent cohérents avec les outils existants (doctoc, PyMdown, etc.). `--dry-run` affiche les modifications prévues sans les écrire.

Cette commande ne s'exécute **pas** dans `translate-docs` ou `sync` ; exécutez-la explicitement lorsque vous souhaitez des identifiants de fragment stables dans les fichiers sources avant traduction ou publication.

<a id="placeholder-protection"></a>
### Protection des espaces réservés

Avant la traduction, la syntaxe sensible est remplacée par des jetons opaques afin d'éviter toute corruption par le LLM, appliquée dans cet ordre (la restauration s'effectue dans l'ordre inverse) :

1. **Balises HTML et commentaires** (`<strong>`, `<!-- ... -->`, etc.) - les balises HTML en minuscules provenant d'une liste blanche connue sont remplacées par des jetons `{{HTM_N}}`. Les balises JSX en majuscules (`<Highlight>`, `<Tabs>`, `</Tab>`) sont traitées séparément par la couche MDX (étape 4).
2. **Marqueurs d'encadrés** (`:::note`, `:::`) - seul le préfixe de directive sur la ligne d'ouverture est remplacé par `{{ADM_OPEN_N}}` ; tout titre sur la même ligne est laissé pour être traduit par le modèle. La restauration se fait avec le texte original exact.
3. **Ancres de documentation** (HTML `<a id="…">`, ancre de titre Docusaurus `{#…}`) - conservées telles quelles.
4. **Constructions spécifiques à MDX** (`src/processors/mdx-placeholders.ts`) :
   - **Commentaires MDX** (`{/* … */}`, y compris la forme d'identifiant de titre Docusaurus `{/* #my-id */}`) remplacés par `{{MDX_N}}`.
   - **Balises JSX en majuscules** (`<Highlight>`, `<Tabs>`, `<TabItem>`, `<TOCInline />`, `</Highlight>`) - conservées sous forme de `{{MDX_N}}`, avec les attributs de chaîne traduisibles (`label`, `tooltip`, `aria-label`) réécrits en `{{JXA_N}}` à l'intérieur de la balise ; les `label:` à l'intérieur des littéraux d'objets `<Tabs values={[ { label: '…' } ]}>` et les `<TabItem value="…">` (lorsqu'aucun attribut `label` n'existe, en sautant les valeurs en minuscules de type slug) sont également extraits. Ajoutés au segment sous forme de lignes `||JXA_N: …||`, puis regroupés à nouveau par `restoreMdx`.
   - **Expressions entre accolades MDX** (`{frontMatter.title}`, `style={{…}}`) - correspondance sensible à la profondeur, remplacées par `{{MDX_N}}`.
5. **URLs en markdown** (`](url)`, `src="../../docs/…"`) - restaurées à partir d'une table après traduction.
6. **Portées de code en ligne** (`` `code` ``) et **code en ligne en gras** (`**`code`**`) - conservés tels quels.
7. **Mise en emphase en markdown** (facultatif, activé automatiquement pour les paramètres régionaux CJK/RTL) - les délimiteurs d'emphase sont masqués.

<a id="cache-translationcache"></a>
### Cache (`TranslationCache`)

Base de données SQLite (via `node:sqlite`) stockant des lignes indexées par `(source_hash, locale)` avec `translated_text`, `model`, `filepath`, `last_hit_at` et champs associés. Le hachage utilise les 16 premiers caractères hexadécimaux du SHA-256 du contenu normalisé (espaces réduits).

À chaque exécution, les segments sont recherchés par hachage × paramètres régionaux. Seuls les échecs de cache sont envoyés au LLM. Après la traduction, `last_hit_at` est réinitialisé pour les lignes de segments dans la portée actuelle de traduction qui n'ont pas été touchées. `cleanup` exécute d'abord `sync --force-update`, puis supprime les lignes de segments obsolètes (`last_hit_at` nul / chemin de fichier vide), élimine les clés `file_tracking` lorsque le chemin source résolu est absent du disque (`doc-block:…`, `svg-files:…`, etc.), et supprime les lignes de traduction dont le fichier de métadonnées pointe vers un fichier manquant ; il effectue d'abord une sauvegarde de `cache.db`, sauf si `--no-backup` est fourni.

La commande `translate-docs` utilise également un **suivi des fichiers** afin que les sources inchangées avec sorties existantes puissent ignorer complètement le traitement. `--force-update` relance le traitement des fichiers tout en utilisant toujours le cache des segments ; `--force` efface le suivi des fichiers et contourne les lectures du cache des segments pour la traduction via API. Consultez [Bien démarrer](GETTING_STARTED.fr.md#cache-behaviour-and-translate-docs-flags) pour le tableau complet des options.

**Format de prompt par lot :** `translate-docs --prompt-format` sélectionne un format XML (`<seg>` / `<t>`) ou des formes de tableau/objet JSON uniquement pour `OpenRouterClient.translateDocumentBatch` ; l'extraction, les espaces réservés et la validation restent inchangés. Voir [Format de prompt par lot](GETTING_STARTED.fr.md#batch-prompt-format).

<a id="output-path-resolution"></a>
### Résolution du chemin de sortie

`resolveDocumentationOutputPath(config, cwd, locale, relPath, kind)` associe un chemin relatif à la source au chemin de sortie :

- Style `nested` (par défaut) : `{outputDir}/{locale}/{relPath}` pour le markdown.
- Style `doc-system` : sous `docsRoot`, les sorties utilisent `{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}` ; les chemins situés en dehors de `docsRoot` reviennent au mode imbriqué. Alias : `docusaurus` (`localeSubpath` par défaut = chemin du plugin Docusaurus), `astro-starlight` (`localeSubpath` vide par défaut).
- Style `flat` : `{outputDir}/{stem}.{locale}{extension}`. Lorsque `flatPreserveRelativeDir` est défini sur `true`, les sous-répertoires sources sont conservés sous `outputDir`.
- **Personnalisé** `pathTemplate` : n’importe quelle disposition en markdown utilisant `{outputDir}`, `{locale}`, `{LOCALE}`, `{relPath}`, `{stem}`, `{basename}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}`.
- **Personnalisé** `jsonPathTemplate` : disposition personnalisée séparée pour les fichiers d'étiquettes JSON, utilisant les mêmes espaces réservés.
- `linkRewriteDocsRoot` aide le réécriture de liens plats à calculer les préfixes corrects lorsque la sortie traduite est située ailleurs que dans le répertoire racine par défaut du projet.

<a id="flat-link-rewriting"></a>
### Réécriture des liens plats

Lorsque `markdownOutput.style === "flat"`, les fichiers Markdown traduits sont placés aux côtés des fichiers sources avec des suffixes de langue. Les liens relatifs entre pages sont réécrits afin que `[Guide](../../docs/guide.md)` dans `readme.de.md` pointe vers `guide.de.md`. Contrôlé par `rewriteRelativeLinks` (activé automatiquement pour le style plat sans `pathTemplate` personnalisé). Ce même passage ajoute un préfixe de profondeur par fichier aux URL des ressources non-Markdown avant l'exécution de `postProcessing.regexAdjustments` — voir [Guide des ressources localisées](LOCALE-ASSETS-GUIDE.fr.md#the-flat-link-rewriter-and-two-step-flow).

---

<a id="shared-infrastructure"></a>
## Infrastructure partagée

<a id="openrouterclient"></a>
### `OpenRouterClient`

Encapsule l'API OpenRouter de complétion de chat. Comportements clés :

- **Rétrogradation du modèle** : tente chaque modèle de la liste résolue dans l'ordre ; passe au suivant en cas d'erreur HTTP ou d'échec d'analyse. La traduction de l'interface utilisateur résout d'abord `ui.preferredModel` lorsqu'il est présent, puis les modèles `openrouter`.
- **Délai d'expiration de la requête** : `openrouter.requestTimeoutMs` (par défaut 30 secondes) interrompt chaque requête de complétion conversationnelle via `AbortSignal.timeout`. La même valeur s'applique à `GET /models` lorsque l'interface en ligne de commande charge le catalogue (par exemple `check-models` et le filtre préalable facultatif qui rejette les identifiants de modèle inconnus).
- **Limitation de débit** : détecte les réponses 429, attend `retry-after` (ou 2 secondes), puis effectue une nouvelle tentative.
- **Journal de trafic de débogage** : si `debugTrafficFilePath` est défini, ajoute les données JSON de la requête et de la réponse à un fichier.

<a id="config-loading"></a>
### Chargement de la configuration

Pipeline `loadI18nConfigFromFile(configPath, cwd)` :

1. Lire et analyser `ai-i18n-tools.config.json` (JSON).
2. `mergeWithDefaults` - fusion profonde avec `defaultI18nConfigPartial`, et fusionner toutes les entrées `documentations[].sourceFiles` dans `contentPaths`.
3. `expandTargetLocalesFileReferenceInRawInput` - si `targetLocales` est un chemin de fichier, charger le manifeste et l'étendre aux codes de langue ; définir `uiLanguagesPath`.
4. `expandDocumentationTargetLocalesInRawInput` - même chose pour chaque entrée `documentations[].targetLocales`.
5. `parseI18nConfig` - validation Zod + `validateI18nBusinessRules`.
6. `applyEnvOverrides` - appliquer `OPENROUTER_API_KEY`, `I18N_SOURCE_LOCALE`, etc.
7. `augmentConfigWithUiLanguagesFile` - attacher les noms d'affichage du manifeste.

<a id="logger"></a>
### Journalisation (Logger)

`Logger` prend en charge les niveaux `debug`, `info`, `warn`, `error` avec sortie couleur ANSI. Le mode verbeux (`-v`) active `debug`. Lorsque `logFilePath` est défini, les lignes de journal sont également écrites dans ce fichier.

---

<a id="runtime-helpers-api"></a>
## API d'aides au runtime

Ces éléments sont exportés depuis `'ai-i18n-tools/runtime'` et fonctionnent dans tout environnement JavaScript (navigateur, Node.js, Deno, Edge). Ils n'importent **pas** depuis `i18next` ni `react-i18next`.

<a id="rtl-helpers"></a>
### Aides pour les langues de droite à gauche (RTL)

```ts
RTL_LANGS: ReadonlySet<string>
getTextDirection(lng: string): 'ltr' | 'rtl'
applyDirection(lng: string, element?: Element): void
```

<a id="i18next-setup-factories"></a>
### Usines de configuration i18next

```ts
defaultI18nInitOptions(sourceLocale?: string): i18nextInitOptions
setupKeyAsDefaultT(i18n: I18nLike & Partial<I18nWithResources>, options: SetupKeyAsDefaultTOptions): void
wrapI18nWithKeyTrim(i18n: I18nLike): void
wrapT(i18n: I18nLike, options: WrapTOptions): void
buildPluralIndexFromStringsJson(entries: Record<string, { plural?: boolean; source?: string }>): Record<string, string>
makeLocaleLoadersFromManifest(
  manifest: readonly { code: string }[],
  sourceLocale: string,
  makeLoaderForLocale: (localeCode: string) => () => Promise<unknown>
): Record<string, () => Promise<unknown>>
makeLoadLocale(
  i18n: I18nWithResources,
  localeLoaders: Record<string, () => Promise<unknown>>,
  sourceLocale?: string
): (lang: string) => Promise<void>
```

Utilisez `setupKeyAsDefaultT` comme point d'entrée habituel (suppression des espaces dans les clés + pluriel `wrapT` + `translate-ui` `{sourceLocale}.json` facultatif). L'appel à `wrapI18nWithKeyTrim` seul est **déconseillé** pour le câblage de l'application.

Construisez `localeLoaders` avec `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, …)` afin que les clés restent synchronisées avec `targetLocales` après `generate-ui-languages`. Consultez `docs/GETTING_STARTED.md` (câblage au runtime) et `examples/nextjs-app/` / `examples/console-app/`.

<a id="display-helpers"></a>
### Aides à l'affichage

```ts
getUILanguageLabel(lang: UiLanguageEntry, t: TranslateFn): string
getUILanguageLabelNative(lang: UiLanguageEntry): string
```

<a id="string-helpers"></a>
### Aides pour les chaînes de caractères

```ts
interpolateTemplate(str: string, vars: Record<string, string | number | boolean>): string
flipUiArrowsForRtl(text: string | null | undefined, isRtl: boolean): string | null | undefined
```

---

<a id="programmatic-api"></a>
## API programmatique

Tous les types et classes publics sont exportés depuis la racine du package. Exemple : exécuter l'étape de traduction d'interface depuis Node.js sans l'interface en ligne de commande :

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
| `loadI18nConfigFromFile` | Charge, fusionne et valide la configuration à partir d'un fichier JSON. |
| `parseI18nConfig` | Valide un objet de configuration brut. |
| `TranslationCache` | Cache SQLite - instancier avec un chemin `cacheDir`. |
| `UIStringExtractor` | Extraire les chaînes `t("…")` depuis la source JS/TS. |
| `MarkdownExtractor` | Extraire les segments traduisibles depuis le markdown. |
| `JsonExtractor` | Extraire des fichiers d'étiquettes JSON Docusaurus (catalogues d'interface, pas le corps MDX). |
| `SvgExtractor` | Extraire depuis les fichiers SVG. |
| `OpenRouterClient` | Effectuer des demandes de traduction vers OpenRouter. |
| `PlaceholderHandler` | Protéger et restaurer la syntaxe markdown autour de la traduction (balises HTML, encadrés, ancres, commentaires MDX/JSX/accolades, URL, code en ligne, emphase). |
| `protectMdx` / `restoreMdx` | Protéger et restaurer les commentaires MDX, les balises JSX, les expressions entre accolades et les attributs de chaîne JSX (appelé par `PlaceholderHandler` ; également exporté pour une utilisation directe). |
| `splitTranslatableIntoBatches` | Regrouper les segments en lots de taille adaptée aux LLM. |
| `validateTranslation` | Vérifications structurelles après traduction. |
| `resolveDocumentationOutputPath` | Résoudre le chemin du fichier de sortie pour un document traduit. |
| `Glossary` / `GlossaryMatcher` | Charger et appliquer les glossaires de traduction. |
| `runTranslateUI` | Point d'entrée programmatique pour l'interface de traduction. |

---

<a id="extension-points"></a>
## Points d'extension

<a id="custom-function-names-ui-extraction"></a>
### Noms de fonctions personnalisés (extraction de l'interface utilisateur)

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

<a id="custom-extractors"></a>
### Extracteurs personnalisés

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

Le transmettre au pipeline doc-translate en important les utilitaires `doc-translate.ts` par programme.

<a id="custom-output-paths"></a>
### Chemins de sortie personnalisés

Utiliser `markdownOutput.pathTemplate` pour n'importe quelle organisation de fichiers :

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
