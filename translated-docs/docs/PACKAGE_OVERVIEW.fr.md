<a id="ai-i18n-tools-package-overview"></a>
# ai-i18n-tools : Aperçu du package

Ce document décrit l'architecture interne de `ai-i18n-tools`, la manière dont chaque composant s'assemble, et la mise en œuvre des trois workflows composites (chaînes d'interface utilisateur, documents, JSON imbriqué) ainsi que la traduction SVG facultative.

Pour des instructions d'utilisation pratiques, consultez [GETTING_STARTED.md](GETTING_STARTED.fr.md). Pour les captures d'écran et les fichiers SVG illustrés dans les documents traduits, consultez [LOCALE-ASSETS-GUIDE.md](LOCALE-ASSETS-GUIDE.fr.md).

<small>**Lire dans d'autres langues :** </small>
<small id="lang-list">[English (UK)](../../docs/PACKAGE_OVERVIEW.md) · [Deutsch](./PACKAGE_OVERVIEW.de.md) · [Español](./PACKAGE_OVERVIEW.es.md) · [Français](./PACKAGE_OVERVIEW.fr.md) · [Hindi (Roman)](./PACKAGE_OVERVIEW.hi-Latn.md) · [日本語](./PACKAGE_OVERVIEW.ja.md) · [한국어](./PACKAGE_OVERVIEW.ko.md) · [Português (Brasil)](./PACKAGE_OVERVIEW.pt-BR.md) · [简体中文](./PACKAGE_OVERVIEW.zh-Hans.md) · [繁體中文](./PACKAGE_OVERVIEW.zh-Hant.md)</small>

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
- [Workflow 3 - Internes du JSON imbriqué](#workflow-3---nested-json-internals)
  - [Extracteurs](#extractors)
  - [Sites hybrides Astro (IU + HTML des pages)](#astro-hybrid-sites-ui--page-html)
  - [Insertion d'ancre pour les titres (CLI `write-heading-ids`)](#heading-anchor-insertion-write-heading-ids-cli)
  - [Protection des espaces réservés](#placeholder-protection)
  - [Cache (`TranslationCache`)](#cache-translationcache)
  - [Résolution du chemin de sortie](#output-path-resolution)
  - [Réécriture des liens plats](#flat-link-rewriting)
- [Infrastructure partagée](#shared-infrastructure)
  - [`LlmClient`](#openrouterclient)
  - [Chargement de la configuration](#config-loading)
  - [Journaliseur](#logger)
- [API d'aides au runtime](#runtime-helpers-api)
  - [Aides RTL](#rtl-helpers)
  - [Fabriques de configuration i18next](#i18next-setup-factories)
  - [Aides d'affichage](#display-helpers)
  - [Aides sur les chaînes](#string-helpers)
- [API programmatique](#programmatic-api)
- [Points d'extension](#extension-points)
  - [Noms de fonctions personnalisés (extraction IU)](#custom-function-names-ui-extraction)
  - [Extracteurs personnalisés](#custom-extractors)
  - [Chemins de sortie personnalisés](#custom-output-paths)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

---

<a id="architecture-overview"></a>
## Aperçu de l'architecture

```text
ai-i18n-tools
├── CLI (src/cli/)             - commands: init, extract, mark-html, translate-ui, translate-svg, translate-docs, translate-json, sync, status, dashboard, …
├── Core (src/core/)           - config, types, cache, prompts, output paths, UI languages
├── Extractors (src/extractors/)  - segment extraction from JS/TS, markdown, JSON, SVG
├── Processors (src/processors/)  - MDX placeholders, HTML tags, admonitions, anchors, URLs, batching, validation, link rewriting, emphasis
├── API (src/api/)             - LlmClient: provider-agnostic chat client (Vercel AI SDK) with model fallback
├── Glossary (src/glossary/)   - glossary loading and term matching
├── Runtime (src/runtime/)     - i18next helpers, display helpers (no i18next import)
├── i18n (src/i18n/)           - self-localization runtime for the tool's own UI (t() + per-locale bundles)
├── Server (src/server/)       - local Express app for the Translation Dashboard (cache / glossary)
└── Utils (src/utils/)         - logger, hash, ignore parser, display-width table, .env loader
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
│   ├── mark-html.ts                `mark-html` command (insert bare `data-i18n*` markers into HTML)
│   ├── translate-ui-strings.ts     `translate-ui` command implementation
│   ├── doc-translate.ts            `translate-docs` command (documentation files only)
│   ├── translate-json-run.ts       `translate-json` command (`json[]` nested locale bundles)
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
│   ├── ui-locale.ts                Resolve the tool's own UI locale (flag/env/config/OS → shipped bundle)
│   ├── locale-utils.ts             BCP-47 normalisation, locale list parsing, script/Han-variant validation
│   └── errors.ts                   Typed error classes
│
├── extractors/
│   ├── base-extractor.ts           Abstract base class for all extractors
│   ├── ui-string-extractor.ts      JS/TS source scanner (i18next-scanner + Babel for `.astro`)
│   ├── ui-string-babel.ts          Babel-based `t()` discovery in `.astro` frontmatter and `{expression}` blocks
│   ├── ui-string-locations.ts      Source locations for extracted UI strings
│   ├── html-i18n-marks.ts          HTML `data-i18n*` marker scanner + `mark-html` annotator
│   ├── classify-segment.ts         Heuristic segment type classification
│   ├── markdown-extractor.ts       Markdown / MDX segment extraction
│   ├── markdown-segment-split.ts   Optional segment splitting for long markdown blocks
│   ├── frontmatter-fields.ts       Selective YAML front matter field translation
│   ├── astro-template-extractor.ts `.astro` parse-and-replace (HTML + template expressions; used by `translate-docs`)
│   ├── json-extractor.ts           Docusaurus catalog JSON extraction (`translate-docs`)
│   ├── nested-json-extractor.ts    Arbitrary nested JSON leaves (`translate-json`, `json[]`)
│   └── svg-extractor.ts            SVG text extraction
│
├── processors/
│   ├── placeholder-handler.ts      Chain: HTML → admonitions → anchors → MDX → URLs → emphasis
│   ├── expression-attribute-protection.ts  Shared protected attribute/key lists (Astro + MDX JSX)
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
│   ├── llm-client.ts               LlmClient: provider-agnostic chat client (AI SDK) with model fallback chain
│   └── provider-models-catalog.ts  Fetch/parse any provider's OpenAI-compatible GET /models catalog
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
├── i18n/                           Self-localization runtime for the tool's own UI
│   ├── index.ts                    t(source, vars) + bundle/manifest loaders (keyed by English source string)
│   └── locales/                    Shipped UI bundles (de.json, es.json, …; generated by `pnpm i18n:self`)
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
    ├── table.ts                    Display-width aware table rendering (CJK/emoji column alignment)
    ├── load-dotenv.ts              Auto-load `.env` from the cwd at CLI startup (never overrides existing env)
    └── ignore-parser.ts            .translate-ignore file parser
```

---

<a id="workflow-1---ui-translation-internals"></a>
## Workflow 1 - Fonctionnement interne de la traduction d'interface

```text
source files (JS/TS, optional `.astro`)
      │
      ▼  UIStringExtractor (i18next-scanner Parser; `.astro` via ui-string-babel.ts)
strings.json  ─────────────────── master catalog
      │             { hash: { source, translated, models?, locations? } }
      ▼
LlmClient.translateUIBatch()
      │  sends JSON array of source strings, receives JSON array of translations (+ model id per batch)
      ▼
de.json, pt-BR.json …  ─────────── per-locale flat maps: source → translation (no model metadata)
```

<a id="uistringextractor"></a>
### `UIStringExtractor`

Utilise `i18next-scanner` de `Parser.parseFuncFromString` pour détecter les appels `t("literal")` et `i18n.t("literal")` dans les fichiers JS/TS. Pour les sources `.astro` (lorsqu'elles sont listées dans `ui.uiExtractor.extensions`), `ui-string-babel.ts` analyse le frontmatter et les blocs de modèle `{expression}` avec `@babel/parser` et applique les mêmes règles `funcNames`. Les noms de fonctions et les extensions de fichiers sont configurables via `ui.uiExtractor` (`ui.reactExtractor` est un alias pris en charge). `extract` **fusionne également les entrées non issues du scanner dans le même catalogue** : le `package.json` du projet `description` lorsque `includePackageDescription` est activé (par défaut), et chaque `englishName` provenant de `ui-languages.json` lorsque `includeUiLanguageEnglishNames` vaut `true` et que `uiLanguagesPath` est défini (les chaînes déjà présentes dans le code source ont priorité). Les hachages des segments sont les **8 premiers caractères hexadécimaux du hachage MD5** de la chaîne source tronquée — ceux-ci deviennent les clés dans `strings.json`.

Pour les sources `.html` / `.htm` (lorsqu'elles sont listées dans `ui.uiExtractor.extensions`), `extract` achemine le fichier via `html-i18n-marks.ts`, qui analyse les attributs de marqueur `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` (configurables via `ui.uiExtractor.htmlI18nAttributes`). Un marqueur nu tire son texte source du `textContent` / `title` / `placeholder` de l'élément ; un marqueur valorisé (`data-i18n="Key"`) utilise la valeur. Le même module alimente la commande `mark-html`, qui insère automatiquement les marqueurs nus. Les fichiers HTML n'atteignent jamais les passes Babel / i18next-scanner.

Les sites Astro SSG simples peuvent ignorer i18next : charger le `{locale}.json` plat au moment de la construction et résoudre `t('English')` par clé de texte source (voir `examples/astro-website/src/i18n/t.ts` et [GETTING_STARTED — site Astro](GETTING_STARTED.fr.md#astro-website)).

Les applications HTML simples suivent le même modèle de catalogue avec des attributs de marqueur au lieu des appels `t()` — voir [GETTING_STARTED — Marquage HTML pour la traduction](GETTING_STARTED.fr.md#marking-html-for-translation).

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

`models` (facultatif) — par langue, indique quel modèle a produit cette traduction après la dernière exécution réussie de `translate-ui` pour cette langue (ou `user-edited` si le texte a été enregistré depuis le tableau de bord de traduction). `locations` (facultatif) — indique où `extract` a trouvé la chaîne (scanner + ligne de description du package ; les chaînes `englishName` uniquement dans le manifeste peuvent omettre `locations`).

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

`LlmClient.translateUIBatch` essaie chaque modèle dans l'ordre, en se rabattant sur les erreurs d'analyse ou réseau. La CLI construit cette liste à partir de la `translationModels` du fournisseur actif ; pour `translate-ui`, une `ui.preferredModel` optionnelle est ajoutée au début lorsqu'elle est définie (supprimée en double par rapport au reste).

---

<a id="workflow-2---document-translation-internals"></a>
## Workflow 2 - Fonctionnement interne de la traduction de documents

```text
markdown / MDX / JSON / `.astro` files (`translate-docs`)
      │
      ▼  MarkdownExtractor / JsonExtractor / AstroTemplateExtractor
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
cache hit → skip, miss → LlmClient.translateDocumentBatch
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

- `MarkdownExtractor` — divise le markdown en segments typés : `frontmatter`, `heading`, `paragraph`, `code`, `admonition`. Le frontmatter YAML est classé comme **non traduisible** (`slug`, `id` et d'autres clés de routage restent stables). Les blocs `export ...` de niveau supérieur (par exemple, les définitions de composants React) sont classés comme segments `other` non traduisibles, en complément du traitement existant de `import ...`. Les blocs multilignes commençant par une balise JSX en majuscule (par exemple, un bloc `<Tabs>`) sont classés comme paragraphes traduisibles. Les segments non traduisibles (blocs de code, HTML brut) sont conservés tels quels.
- `AstroTemplateExtractor` — analyse et remplacement pour les pages marketing `.astro` (`translate-docs` via `translateAstroFile` dans `doc-translate.ts`). Extrait les nœuds de texte HTML destinés à l'utilisateur et les attributs traduisibles (`alt`, `title`, `aria-label`, `placeholder`), ainsi que les littéraux de chaîne à l'intérieur des blocs de modèle `{expression}` lorsqu'ils sont destinés à l'utilisateur. Ignore le TypeScript du frontmatter, `<script>`, `<style>`, les valeurs d'attributs ou de clés protégées, et les littéraux à l'intérieur de `t('…')`. Le remontage ajuste les chemins d'import relatifs lorsque les chemins de sortie sont plus profonds (par exemple, `src/pages/de/index.astro`). Voir [GETTING_STARTED — pages du site Astro](GETTING_STARTED.fr.md#astro-website-parse-and-replace).
- `JsonExtractor` — extrait les valeurs de chaîne des fichiers d'étiquettes JSON Docusaurus (catalogues d'interface Docusaurus, pas le corps MDX).
- `SvgExtractor` — extrait le contenu `<text>`, `<title>` et `<desc>` des fichiers SVG (utilisé par `translate-svg` pour les fichiers situés sous `config.svg`, pas par `translate-docs`).
- `html-i18n-marks.ts` - un analyseur de balises HTML ciblé utilisé par `extract` pour les sources `.html` / `.htm` et par la commande `mark-html`. `collectHtmlI18nStrings` / `collectHtmlI18nLocations` lisent les attributs de marqueur `data-i18n*` (marqueur nu → `textContent` / `title` / `placeholder` de l'élément ; marqueur valorisé → la valeur), et `markHtmlContent` insère les marqueurs nus dans les éléments de texte feuille / titre / placeholder (idempotent, respecte `data-i18n-ignore`, ignore les éléments de type code et à contenu mixte). L'utilitaire partagé `normalizeI18nText` maintient les clés de build identiques à celles du runtime du navigateur.

<a id="astro-hybrid-sites-ui--page-html"></a>
### Sites hybrides Astro (IU + HTML des pages)

Les applications Astro simples activent souvent **les deux** flux de travail dans une même configuration (référence : `examples/astro-website/`) :

| Couche | Mécanisme | Sortie |
|-------|-----------|--------|
| Modèle HTML | `AstroTemplateExtractor` + `translate-docs` | `.astro` par langue dans `docs[].outputDir` |
| Frontmatter / `t('…')` | `ui-string-babel.ts` + `extract` + `translate-ui` | `public/locales/{locale}.json` plat (texte anglais comme clé) |

La commande `sync` exécute les étapes activées dans l'ordre suivant : **extract** puis **translate-ui** (quand `features.translateUIStrings`) → **translate-svg** facultatif → **translate-docs** → **translate-json** facultatif (sauf si ignoré avec `--no-ui`, `--no-svg`, `--no-docs` ou `--no-json`). Le modèle d'initialisation `ui-astro-website` configure uniquement le Workflow 1 ; ajoutez `docs[]` et `features.translateDocs` pour la traduction du HTML des pages.

<a id="heading-anchor-insertion-write-heading-ids-cli"></a>
### Insertion d'ancre de titre (`write-heading-ids` CLI)

La commande `write-heading-ids` est un préprocesseur **local et non basé sur un LLM** pour les fichiers Markdown de documentation. Implémentation : `src/cli/write-heading-ids.ts` orchestre la découverte des fichiers ; `src/markdown/write-heading-ids-core.ts` analyse les lignes et insère les ancres.

Elle nécessite une configuration valide contenant **au moins un bloc `docs[]`**. Pour chaque bloc, elle récupère les fichiers `.md` / `.mdx` situés dans `contentPaths`, applique les règles `.translate-ignore` du projet (même principe que pour la traduction des documents), et peut limiter le traitement à un sous-arbre via `--path` / `--file`. Chaque fichier est transformé par `applyHeadingAnchorsToMarkdown` : pour chaque **titre ATX plat** (de `# …` à `###### …`) en dehors des blocs de code, une ligne HTML vide `<a id="slug"></a>` est insérée au-dessus si elle est absente ou obsolète. Les algorithmes de génération des slugs s'appuient sur les écosystèmes courants — `github` (par défaut), `bitbucket`, `gitlab`, `pymdown` (avec options de normalisation Unicode et d'encodage en pourcentage), `azure-devops` — afin que les identifiants d'ancrage restent compatibles avec les outils existants (doctoc, PyMdown, etc.). L'option `--dry-run` affiche les modifications prévues sans les écrire.

Cette commande ne s'exécute **pas** dans `translate-docs` ou `sync` ; exécutez-la explicitement lorsque vous souhaitez des identifiants de fragment stables dans les fichiers sources avant traduction ou publication.

<a id="placeholder-protection"></a>
### Protection des espaces réservés

Avant la traduction, la syntaxe sensible est remplacée par des jetons opaques afin d'éviter toute corruption par le LLM, appliquée dans cet ordre (la restauration s'effectue dans l'ordre inverse) :

1. **Balises HTML et commentaires** (`<strong>`, `<!-- ... -->`, etc.) - les balises HTML en minuscules provenant d'une liste blanche connue sont remplacées par des jetons `{{HTM_N}}`. Les balises JSX en majuscules (`<Highlight>`, `<Tabs>`, `</Tab>`) sont traitées séparément par la couche MDX (étape 4).
2. **Marqueurs d'encadrés** (`:::note`, `:::`) - seul le préfixe de directive sur la ligne d'ouverture est remplacé par `{{ADM_OPEN_N}}` ; tout titre sur la même ligne est laissé pour être traduit par le modèle. La restauration se fait avec le texte original exact.
3. **Ancres de documentation** (HTML `<a id="…">`, ancre de titre Docusaurus `{#…}`) - conservées telles quelles.
4. **Constructions spécifiques à MDX** (`src/processors/mdx-placeholders.ts`) :
- **Commentaires MDX** (`{/* … */}`, y compris la forme d'ID d'en-tête de Docusaurus `{/* #my-id */}`) remplacés par `{{MDX_N}}`.
- **Balises JSX en majuscules** (`<Highlight>`, `<Tabs>`, `<TabItem>`, `<TOCInline />`, `</Highlight>`) - conservées en tant que `{{MDX_N}}` avec des attributs de chaîne de caractères traduisibles (`label`, `tooltip`, `aria-label`) réécrits en `{{JXA_N}}` à l'intérieur de la balise, sauf si le nom de l'attribut apparaît dans `docs[].protectAttributes` ; `label:` à l'intérieur des objets littéraux `<Tabs values={[ { label: '…' } ]}>` (ignorables via `docs[].protectKeys`) et `<TabItem value="…">` (lorsqu'il n'y a pas d'attribut `label`, en ignorant les valeurs de type slug en minuscules) sont également extraits. Ajouté au segment en tant que lignes `||JXA_N: …||`, fusionné à nouveau par `restoreMdx`.
- **Expressions d'accolades MDX** (`{frontMatter.title}`, `style={{…}}`) - correspondance sensible à la profondeur, remplacées par `{{MDX_N}}`.
5. **URLs Markdown** (`](url)`, `src="../../docs/…"`) - restaurées à partir d'une carte après la traduction.
6. **Portées de code en ligne** (`` `code` ``) et **code en ligne en gras** (`**`code`**`) - conservés tels quels.
7. **Mise en emphase en markdown** (facultatif, activé automatiquement pour les paramètres régionaux CJK/RTL) - les délimiteurs d'emphase sont masqués.

La protection partagée des attributs/clés pour les modèles Astro et le JSX MDX est implémentée dans `src/processors/expression-attribute-protection.ts` et pilotée par bloc via `docs[].protectAttributes` et `docs[].protectKeys` (voir [GETTING_STARTED — protectAttributes / protectKeys](GETTING_STARTED.fr.md#protectattributes-protectkeys)).

<a id="cache-translationcache"></a>
### Cache (`TranslationCache`)

Une base de données SQLite (via `node:sqlite`) stocke des lignes indexées par `(source_hash, locale)`, avec `translated_text`, `model`, `filepath`, `last_hit_at` et des champs associés. Le hachage correspond aux 16 premiers caractères hexadécimaux SHA-256 du contenu normalisé (espaces réduits).

À chaque exécution, les segments sont recherchés par hachage × paramètres régionaux. Seules les erreurs de cache sont transmises au LLM. Après la traduction, `last_hit_at` est réinitialisé pour les lignes de segment dans la portée de traduction actuelle qui n'ont pas été atteintes. Les succès de cache lors de la traduction de documents effacent les lignes `translation_failures` obsolètes pour ce segment. `cleanup` exécute d'abord `sync --force-update`, puis supprime les lignes de segment obsolètes (`last_hit_at` nul / chemin de fichier vide), élague les clés `file_tracking` lorsque le chemin source résolu est manquant sur le disque (`doc-block:…`, `json-block:…`, `svg-files:…`, etc.), supprime les lignes de traduction dont le chemin de fichier de métadonnées pointe vers un fichier manquant, élague les lignes `translation_failures` orphelines et élague les lignes `markdown_source_issues` orphelines dont le chemin source résolu est manquant sur le disque ; il ne sauvegarde pas `cache.db` à moins que `--backup <path>` ne soit passé, ce qui écrit d'abord une sauvegarde à ce chemin.

La commande `translate-docs` utilise également le **suivi des fichiers**, afin que les sources inchangées avec des sorties existantes puissent ignorer complètement le traitement. `--force-update` relance le traitement des fichiers tout en utilisant toujours le cache de segments ; `--force` efface le suivi des fichiers et contourne les lectures du cache de segments pour la traduction via l'API. Lorsque chaque modèle configuré échoue à la validation AST sur un segment markdown, `translate-docs` peut progressivement diviser le segment et réessayer des parties plus petites (`docs[].segmentSplitting.qualityRetrySplit`, activé par défaut). Consultez [Bien démarrer](GETTING_STARTED.fr.md#cache-behaviour-and-translate-docs-flags) pour le tableau complet des options.

**Format de prompt par lots :** `translate-docs --prompt-format` sélectionne des formes XML (`<seg>` / `<t>`) ou de tableau/objet JSON pour `LlmClient.translateDocumentBatch` uniquement ; l'extraction, les espaces réservés et la validation restent inchangés. Voir [Format de prompt par lots](GETTING_STARTED.fr.md#batch-prompt-format).

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

Lorsque `docsOutput.style === "flat"`, les fichiers Markdown traduits sont placés à côté des fichiers sources avec des suffixes de langue. Les liens relatifs entre pages sont réécrits afin que `[Guide](../../docs/guide.md)` dans `readme.de.md` pointe vers `guide.de.md`. Contrôlé par `rewriteRelativeLinks` (activé automatiquement pour le style plat sans `pathTemplate` personnalisé). Ce même passage ajoute un préfixe de profondeur spécifique au fichier aux URL des ressources non-Markdown avant l’exécution de `postProcessing.regexAdjustments` — voir le [guide des ressources par langue](LOCALE-ASSETS-GUIDE.fr.md#the-flat-link-rewriter-and-two-step-flow).

---

<a id="workflow-3---nested-json-internals"></a>
## Workflow 3 - Internes du JSON imbriqué

```text
json[].contentPaths  →  resolve files (file | directory | glob)
      │
      ▼  NestedJsonExtractor
string leaves selected by keyPolicy (dot paths + minimatch)
      │
      ▼  PlaceholderHandler + batch + TranslationCache (shared SQLite)
cache hit → skip, miss → LlmClient.translateDocumentBatch
      │
      ▼  NestedJsonExtractor.reassemble
output file  ─────────── expandJsonBlockOutputPath(outputPathTemplate)
```

- `NestedJsonExtractor` (`src/extractors/nested-json-extractor.ts`) parcourt un JSON arbitrairement imbriqué et émet un segment par chaîne traduisible au niveau feuille. `keyPolicy.mode` (`allowlist`, `denylist` ou `both`) filtre les chemins avec minimatch en notation pointée (les noms simples comme `slug` correspondent au dernier segment de clé).
- Le suivi des fichiers dans le cache utilise `json-block:{blockIndex}:{projectRelPath}` dans `file_tracking` (même `cacheDir` que pour les documents et SVG).
- **Non** destiné aux catalogues `write-translations` de Docusaurus (forme `{ message, description }`) — ceux-ci utilisent le Workflow 2 (`docs[].docusaurusCatalogDir` + `JsonExtractor` à l'intérieur de `translate-docs`).
- **Non** destiné aux chaînes d'interface utilisateur `t()` — Workflow 1 (`strings.json` + bundles plats).
- CLI : `translate-json` ; orchestration dans `src/cli/translate-json-run.ts`. Modèle d'initialisation : `ui-json-bundles`.

---

<a id="shared-infrastructure"></a>
## Infrastructure partagée

<a id="openrouterclient"></a>
### `LlmClient`

Client de chat indépendant du fournisseur, basé sur le Vercel AI SDK (`ai` + `@ai-sdk/openai-compatible`). Il résout le fournisseur actif à partir de `provider` / `providers`, construit un client compatible OpenAI (`createOpenAICompatible`) pour la `baseUrl` et la clé API de ce fournisseur, et achemine tous les appels via `generateText`. `OpenRouterClient` est conservé comme alias obsolète. Comportements clés :

- **Replacment de modèle** : essaie chaque modèle dans la liste résolue dans l'ordre ; se rabat en cas d'échec de requête ou d'analyse. La traduction de l'interface utilisateur résout d'abord `ui.preferredModel` lorsqu'il est présent, puis le `translationModels` du fournisseur.
- **Délai d'attente de requête** : le `requestTimeoutMs` du fournisseur actif (par défaut 30 secondes) interrompt chaque requête via `AbortSignal.timeout`. La même valeur s'applique à `GET /models` lorsque la CLI charge la liste des modèles d'un fournisseur pour `check-models` (n'importe quel fournisseur) et le filtre facultatif de pré-vérification qui supprime les identifiants de modèle inconnus (OpenRouter uniquement).
- **Extras OpenRouter** (uniquement lorsque `openrouter` est actif) : routage du débit via le champ de requête `provider`, les en-têtes `HTTP-Referer` / `X-Title`, et le coût exact en USD lu à partir de `usage.cost`. L'utilisation des jetons est signalée pour chaque fournisseur ; le coût exact uniquement lorsque le fournisseur le renvoie.
- **Journal du trafic de débogage** : si `debugTrafficFilePath` est défini, ajoute le JSON des requêtes et des réponses à un fichier.

<a id="config-loading"></a>
### Chargement de la configuration

Pipeline `loadI18nConfigFromFile(configPath, cwd)` :

1. Lecture et analyse de `ai-i18n-tools.config.json` (JSON).
2. `mergeWithDefaults` - fusion profonde avec `defaultI18nConfigPartial`, et fusion des entrées `docs[].sourceFiles` dans `contentPaths`.
3. `expandTargetLocalesFileReferenceInRawInput` - si `targetLocales` est un chemin de fichier, charger le manifeste et l'étendre aux codes de langue ; définir `uiLanguagesPath`.
4. `expandDocumentationTargetLocalesInRawInput` - même traitement pour chaque entrée `docs[].targetLocales`.
5. `parseI18nConfig` - validation Zod + `validateI18nBusinessRules`.
6. `applyEnvOverrides` - appliquer `OPENROUTER_API_KEY`, `I18N_SOURCE_LOCALE`, etc.
7. `augmentConfigWithUiLanguagesFile` - attacher les noms d'affichage du manifeste.

`init` écrit les configurations initiales à partir de `initConfigTemplates` : `ui-markdown` (IU + markdown d'application facultatif), `ui-docusaurus`, `ui-starlight`, `ui-astro-website` (IU Astro simple ; ajoutez `docs[]` pour la traduction des pages `.astro`), `ui-json-bundles` (Workflow 3 `json[]` uniquement). Consultez [GETTING_STARTED — Initialise](GETTING_STARTED.fr.md#step-1-initialise).

<a id="logger"></a>
### Journalisation (Logger)

`Logger` prend en charge les niveaux `debug`, `info`, `warn`, `error` avec sortie couleur ANSI. Le mode verbeux (`-v`) active `debug`. Lorsque `logFilePath` est défini, les lignes de journal sont également écrites dans ce fichier.

<a id="self-localization-tool-ui"></a>
### Auto-localisation (interface utilisateur de l'outil)

L'outil localise sa propre interface utilisateur — aide en ligne de commande, messages de journalisation/résumé/erreur à fort trafic, et le tableau de bord de traduction — séparément du contenu qu'il traduit pour vous.

- **Résolution de locale** (`resolveUiLocale` dans `src/core/ui-locale.ts`) : sélectionne la locale de l'interface utilisateur à partir de `-L` / `--ui-lang` > `AI_I18N_LANG` > configuration `uiLanguage` > locale du système d'exploitation hôte (`Intl.DateTimeFormat().resolvedOptions().locale`). Le candidat est normalisé et comparé à l'ensemble des bundles expédiés, soit exactement, soit par variation la plus proche (par ex. `pt-PT` → `pt-BR`, `en-US` → `en-GB`), en se rabattant sur la locale source (`en-GB`). La ligne de commande se résout une fois avant la génération de l'aide (analyse préliminaire des arguments) et une fois après le chargement de la configuration afin que `uiLanguage` s'applique (le drapeau et la variable d'environnement priment toujours).
- **Exécution** (`src/i18n/index.ts`) : un minimum de `t(source, vars)` avec interpolation `{{name}}`, indexé par la chaîne source anglaise contre des bundles plats par locale dans `src/i18n/locales/<code>.json` (copiés vers `dist/i18n/locales` lors de la compilation). Les clés ou bundles manquants renvoient le texte source. C'est le même modèle clé-par-défaut que le Workflow 1 — il n'y a pas de recherche par hachage.
- **Tableau de bord** : le serveur expose `GET /api/ui-i18n` renvoyant `{ locale, dir, bundle }` pour la locale de l'interface utilisateur résolue ; le frontend définit `<html lang>` / `dir` et localise le balisage statique via les attributs `data-i18n*`.
- **Dogfooding** : les bundles sont produits en exécutant le pipeline extract → `translate-ui` du package lui-même contre `ai-i18n-self.config.json` (`pnpm i18n:self`). Les clés de catalogue proviennent des appels `t()` dans `src/cli/` et `src/i18n/` plus les marqueurs `data-i18n*` du tableau de bord dans `src/dashboard-app/index.html`.

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

Construisez `localeLoaders` avec `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, …)` afin que les clés restent alignées avec `targetLocales` après `generate-ui-languages`. Voir `docs/GETTING_STARTED.md` (intégration au moment de l'exécution), `examples/nextjs-app/`, `examples/console-app/` et `examples/astro-website/` (`makeT` personnalisé sans i18next).

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
| `collectHtmlI18nStrings` / `markHtmlContent` | Analyse / insère des marqueurs `data-i18n*` dans le HTML (alimente `extract` pour `.html` et la commande `mark-html`). |
| `MarkdownExtractor` | Extraire les segments traduisibles depuis le markdown. |
| `JsonExtractor` | Extraire des fichiers d'étiquettes JSON Docusaurus (catalogues d'interface, pas le corps MDX). |
| `SvgExtractor` | Extraire depuis les fichiers SVG. |
| `LlmClient` | Effectuer des requêtes de traduction auprès du fournisseur LLM actif (`OpenRouterClient` est un alias obsolète). |
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
    "uiExtractor": {
      "funcNames": ["t", "i18n.t", "translate", "i18n.translate"],
      "extensions": [".js", ".jsx", ".ts", ".tsx", ".astro", ".html"],
      "htmlI18nAttributes": ["data-i18n", "data-i18n-title", "data-i18n-placeholder"]
    }
  }
}
```

(`ui.reactExtractor` est un alias entièrement pris en charge pour `ui.uiExtractor`.)

Ajoutez `.html` / `.htm` à `extensions` pour analyser les attributs de marqueur HTML pendant `extract`. `ui.uiExtractor.htmlI18nAttributes` est facultatif et vaut par défaut `["data-i18n", "data-i18n-title", "data-i18n-placeholder"]` ; `data-i18n` correspond au `textContent` de l'élément et `data-i18n-<attr>` correspond à la valeur de cet attribut (par exemple, `data-i18n-aria-label`).

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

Utilisez `docsOutput.pathTemplate` pour n’importe quelle disposition de fichiers :

```json
{
  "docs": [
    {
      "docsOutput": {
        "pathTemplate": "{outputDir}/{locale}/{relativeToDocsRoot}"
      }
    }
  ]
}
```
