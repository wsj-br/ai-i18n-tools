<a id="architecture"></a>
# Architecture

<a id="architecture-overview"></a>
## Aperçu de l'architecture

Le code est organisé en quatre couches. Utilisez cette section pour le modèle mental ; ouvrez l'[arborescence des sources](#source-tree) lorsque vous avez besoin de détails au niveau du fichier.

<a id="how-a-sync-run-fits-together"></a>
### Comment une exécution `sync` s'articule

`sync` (et les commandes de traduction individuelles) exécutent les fonctionnalités activées dans l'ordre :

| Étape | Commande | Ce qu'elle fait |
| --- | --- | --- |
| 1 | `extract` → `translate-ui` | Analyser les sources de l'interface utilisateur → mettre à jour `strings.json` → remplir le JSON de locale plat (`de.json`, …) |
| 2 | `translate-svg` *(facultatif)* | Traduire le texte SVG sous `config.svg` |
| 3 | `translate-docs` | Traduire les pages Markdown, MDX, `.astro` ; le JSON du catalogue Docusaurus ; le dictionnaire `_meta` / `.ts` de Nextra ; le catalogue de thèmes VitePress |
| 4 | `translate-json` *(facultatif)* | Traduire les feuilles JSON imbriquées sous `json[]` |

Chaque pipeline suit la même boucle principale : **extraire les segments → protéger la syntaxe → regrouper → rechercher dans le cache ou appeler le LLM → écrire la sortie**. Les services partagés au milieu — configuration, espaces réservés, cache, glossaire, `LlmClient` — sont décrits sous [Infrastructure partagée](#shared-infrastructure).

<a id="module-map"></a>
### Carte des modules

| Couche | Dossier | Rôle |
| --- | --- | --- |
| **Entrée** | `src/cli/` | Commandes CLI : `init`, `extract`, `mark-html`, `translate-ui`, `translate-docs`, `translate-json`, `translate-svg`, `sync`, `status`, `dashboard`, … |
| **Pipelines** | `src/extractors/` | Extraction de segments à partir de JS/TS, marqueurs HTML, markdown, JSON, SVG, `.astro` |
| | `src/processors/` | Protection des espaces réservés, regroupement, validation, réécriture de liens |
| **Partagé** | `src/core/` | Configuration, types, cache SQLite, invites, chemins de sortie, utilitaires de locale |
| | `src/api/` | `LlmClient` — client de chat agnostique du fournisseur (Vercel AI SDK) avec repli de modèle |
| | `src/glossary/` | Chargement du glossaire et suggestions de termes pour les invites |
| | `src/utils/` | Logger, hachage, analyseur d'ignorance, tables de largeur d'affichage, chargeur `.env` |
| **Runtime de votre application** | `src/runtime/` | Assistants i18next et utilitaires d'affichage — exportés sous le nom de `'ai-i18n-tools/runtime'` ([Assistants d'exécution](/guide/runtime-helpers)) |
| **Interface utilisateur de l'outil** *(dogfooding)* | `src/i18n/`, `src/dashboard-app/`, `src/server/` | Localise la CLI et le tableau de bord de traduction de ce package — séparé du contenu de votre projet ([Auto-localisation](#self-localization-tool-ui)) |

Tout ce qui est destiné à un usage programmatique est réexporté depuis `src/index.ts` ([API programmatique](/reference/programmatic-api)).

<a id="pipeline-summaries"></a>
### Résumés des pipelines

| Pipeline | Section | Entrée → sortie |
| --- | --- | --- |
| Chaînes d'interface utilisateur | [Internes des chaînes d'interface utilisateur](#ui-strings-internals) | Fichiers source → `strings.json` → `{locale}.json` plat |
| Documents | [Internes des documents](#documents-internals) | Markdown / MDX / `.astro` / Docusaurus JSON → fichiers par locale sous `docs[].outputDir` |
| Bundles JSON | [Internes JSON](#json-internals) | JSON imbriqué sous `json[]` → fichiers JSON par locale |
| SVG | [Internes des documents — extracteurs](#extractors) | Fichiers SVG sous `config.svg` → copies SVG traduites |

---

<a id="ui-strings-internals"></a>
## Internes des chaînes d’interface utilisateur

| Étape | Composant | Résultat |
| --- | --- | --- |
| 1 | Fichiers source (JS/TS ; `.astro` / `.html` facultatifs) | Fichiers sur disque |
| 2 | `UIStringExtractor` (i18next-scanner ; `.astro` via `ui-string-babel.ts`) | Segments indexés par hachage MD5 |
| 3 | `strings.json` | Catalogue maître : `{ hash: { source, translated, models?, locations? } }` |
| 4 | `LlmClient.translateUIBatch()` | Tableau JSON de chaînes source → traductions (+ ID de modèle par lot) |
| 5 | `de.json`, `pt-BR.json`, … | Mappages plats : chaîne source → traduction (pas de métadonnées de modèle) |

<a id="uistringextractor"></a>
### `UIStringExtractor`

Utilise le `i18next-scanner` de `Parser.parseFuncFromString` pour trouver les appels `t("literal")` et `i18n.t("literal")` dans les fichiers JS/TS. Pour les sources `.astro` (lorsqu'elles sont listées dans `ui.uiExtractor.extensions`), `ui-string-babel.ts` analyse le frontmatter et les blocs `{expression}` de modèle avec `@babel/parser` et applique les mêmes règles `funcNames`. Les noms de fonctions et les extensions de fichiers sont configurables via `ui.uiExtractor` (`ui.reactExtractor` est un alias pris en charge). `extract` **fusionne également les entrées non-scanner dans le même catalogue :** le `package.json` du projet `description` lorsque `includePackageDescription` est activé (par défaut), et chaque `englishName` du catalogue maître ui-languages fourni (construit à partir de `sourceLocale` + `targetLocales`) lorsque `includeUiLanguageEnglishNames` est `true` (les chaînes déjà trouvées dans la source ont la priorité ; ne lit pas `languagesManifestPath`). `extract` régénère également `ui-languages.json` à `languagesManifestPath`. Les hachages de segments sont les **8 premiers caractères hexadécimaux MD5** de la chaîne source tronquée — ceux-ci deviennent les clés dans `strings.json`.

Pour les sources `.html` / `.htm` (lorsqu'elles sont listées dans `ui.uiExtractor.extensions`), `extract` achemine le fichier via `html-i18n-marks.ts`, qui analyse les attributs de marqueur `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` (configurables via `ui.uiExtractor.htmlI18nAttributes`). Un marqueur nu tire son texte source du `textContent` / `title` / `placeholder` de l'élément ; un marqueur valorisé (`data-i18n="Key"`) utilise la valeur. Le même module alimente la commande `mark-html`, qui insère automatiquement les marqueurs nus. Les fichiers HTML n'atteignent jamais les passes Babel / i18next-scanner.

Les sites SSG Astro simples peuvent ignorer i18next : chargez des `{locale}.json` plats au moment de la construction et résolvez les `t('English')` par clé de texte source (voir `examples/astro-website/src/i18n/t.ts` et [Chaînes d’interface utilisateur — site web Astro](/guide/ui-strings/astro-website#astro-website-plain-astro-not-starlight)).

Les applications HTML simples suivent le même modèle de catalogue avec des attributs de marqueur au lieu d’appels `t()` — voir [Marquage HTML pour la traduction](/guide/ui-strings/plain-html#marking-html-for-translation).

<a id="stringsjson"></a>
### `strings.json`

Le catalogue principal a la forme suivante :

```json
{
  "a1b2c3d4": {
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

`models` (facultatif) — par locale, quel modèle a produit cette traduction après la dernière exécution réussie de `translate-ui` pour cette locale (ou `user-edited` si le texte a été enregistré depuis le tableau de bord de traduction). `locations` (facultatif) — où `extract` a trouvé la chaîne (scanner + ligne de description du package ; les chaînes `englishName` du maître fourni peuvent omettre `locations`).

`extract` ajoute de nouvelles clés et préserve les données `translated` / `models` existantes pour les clés toujours présentes dans l'analyse (littéraux du scanner, description facultative, `englishName` du maître fourni facultatif). `translate-ui` remplit les entrées `translated` manquantes, met à jour `models` pour les locales qu'il traduit, et écrit les fichiers de locale plats.

`ui-languages.json` **manifeste** — tableau JSON de `{ code, label, englishName, direction }` (BCP-47 `code`, UI `label`, référence `englishName`, `"ltr"` ou `"rtl"`). Utilisez `generate-ui-languages` ou `extract` pour construire un fichier de projet à partir de `sourceLocale` + `targetLocales` et du `data/ui-languages-complete.json` maître fourni.

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

`LlmClient.translateUIBatch` essaie chaque modèle dans l'ordre, en se rabattant sur les erreurs d'analyse ou de réseau. La CLI construit cette liste par locale cible à partir de `localeModels`, de `uiModels` facultatifs et de `translationModels` (voir [Fournisseurs et modèles](/guide/providers-and-models#model-fallback-chain)).

---

<a id="documents-internals"></a>
## Internes des documents

| Étape | Composant | Résultat |
| --- | --- | --- |
| 1 | Fichiers Markdown / MDX / JSON / `.astro` (`translate-docs`) | Fichiers source |
| 2 | `MarkdownExtractor` / `JsonExtractor` / `AstroTemplateExtractor` | `segments[]` — segments typés avec hachage + contenu |
| 3 | `PlaceholderHandler` | Texte protégé — HTML, avertissements, ancres, MDX, URL, code en ligne, emphase masquée en tant que jetons |
| 4 | `splitTranslatableIntoBatches` | `batches[]` — regroupés par nombre + limite de caractères |
| 5 | Recherche `TranslationCache` | Cache hit → ignorer ; miss → `LlmClient.translateDocumentBatch` |
| 6 | `PlaceholderHandler.restoreAfterTranslation` | Texte final — espaces réservés restaurés |
| 7 | `resolveDocumentationOutputPath` | Fichier de sortie — mise en page Docusaurus ou mise en page plate |

<a id="extractors"></a>
### Extracteurs

Tous les extracteurs étendent `BaseExtractor` et implémentent `extract(content, filepath): Segment[]`.

- `MarkdownExtractor` - divise le markdown en segments typés : `frontmatter`, `heading`, `paragraph`, `code`, `admonition`. Le frontmatter YAML est classé comme **non traduisible** (`slug`, `id` et les autres clés de routage restent stables). Les blocs `export ...` de niveau supérieur (par exemple, les définitions de composants React) sont classés comme segments `other` non traduisibles, parallèlement à la gestion `import ...` existante. Les blocs multilignes commençant par une balise JSX majuscule (par exemple, un bloc `<Tabs>`) sont classés comme paragraphes traduisibles. Les segments non traduisibles (blocs de code, HTML brut) sont conservés tels quels.
- `AstroTemplateExtractor` - analyse et remplace pour les pages marketing `.astro` (`translate-docs` via `translateAstroFile` dans `doc-translate.ts`). Extrait les nœuds de texte HTML visibles par l’utilisateur et les attributs traduisibles (`alt`, `title`, `aria-label`, `placeholder`), ainsi que les littéraux de chaîne à l’intérieur des blocs de modèle `{expression}` lorsqu’ils sont visibles par l’utilisateur. Ignore le TypeScript de frontmatter, `<script>`, `<style>`, les valeurs d’attribut/clé protégées et les littéraux à l’intérieur de `t('…')`. Le réassemblage ajuste les importations relatives lorsque les chemins de sortie sont plus profonds (par exemple, `src/pages/de/index.astro`). Voir [Pages du site web Astro](/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace).
- `JsonExtractor` - extrait les valeurs de chaîne des fichiers d’étiquettes JSON de Docusaurus (catalogues d’interface utilisateur de Docusaurus, pas le corps MDX).
- `SvgExtractor` - extrait le contenu `<text>`, `<title>` et `<desc>` du SVG (utilisé par `translate-svg` pour les fichiers sous `config.svg`, pas par `translate-docs`).
- `html-i18n-marks.ts` - un analyseur de balises HTML ciblé utilisé par `extract` pour les sources `.html` / `.htm` et par la commande `mark-html`. `collectHtmlI18nStrings` / `collectHtmlI18nLocations` lisent les attributs de marqueur `data-i18n*` (marqueur nu → `textContent` / `title` / `placeholder` de l'élément ; marqueur valorisé → la valeur), et `markHtmlContent` insère les marqueurs nus dans les éléments de texte feuille / titre / placeholder (idempotent, respecte `data-i18n-ignore`, ignore les éléments de type code et à contenu mixte). L'utilitaire partagé `normalizeI18nText` maintient les clés de build identiques à celles du runtime du navigateur.

<a id="astro-hybrid-sites-ui--page-html"></a>
### Sites hybrides Astro (IU + HTML des pages)

Les applications Astro simples activent souvent **à la fois** les chaînes d’interface utilisateur et les documents dans une seule configuration (référence : `examples/astro-website/`) :

| Couche | Mécanisme | Sortie |
| --- | --- | --- |
| HTML de modèle | `AstroTemplateExtractor` + `translate-docs` | `.astro` par locale sous `docs[].outputDir` |
| Frontmatter / `t('…')` | `ui-string-babel.ts` + `extract` + `translate-ui` | `public/locales/{locale}.json` plat (texte anglais comme clé) |

La commande `sync` exécute les étapes activées dans l’ordre : **extraction** puis **traduction de l’interface utilisateur** (lorsque `features.translateUIStrings`) → **traduction SVG** facultative → **traduction des documents** → **traduction JSON** facultative (sauf si ignorée avec `--no-ui`, `--no-svg`, `--no-docs` ou `--no-json`). Le modèle d’initialisation `ui-astro-website` ne génère que les chaînes d’interface utilisateur ; ajoutez `docs[]` et `features.translateDocs` pour le HTML de la page.

<a id="heading-anchor-insertion-write-heading-ids-cli"></a>
### Insertion d'ancre de titre (`write-heading-ids` CLI)

La commande `write-heading-ids` est un préprocesseur **local et non basé sur un LLM** pour les fichiers Markdown de documentation. Implémentation : `src/cli/write-heading-ids.ts` orchestre la découverte des fichiers ; `src/markdown/write-heading-ids-core.ts` analyse les lignes et insère les ancres.

Il nécessite une configuration valide avec **au moins un bloc `docs[]`**. Pour chaque bloc, il collecte les fichiers `.md` / `.mdx` sous `contentPaths`, applique les règles `.translate-ignore` du projet (même idée que la traduction de documents), et se restreint éventuellement à une sous-arborescence avec `--path` / `--file`. Chaque fichier est transformé avec `applyHeadingAnchorsToMarkdown` : pour chaque **titre ATX plat** (`# …` à `###### …`) en dehors des blocs de code clôturés, une ligne HTML vide `<a id="slug"></a>` est insérée sur la ligne supérieure si elle est manquante ou obsolète. Les algorithmes de slug correspondent aux écosystèmes courants — `github` (par défaut), `bitbucket`, `gitlab`, `pymdown` (normalisation Unicode facultative / drapeaux d'encodage en pourcentage), `azure-devops` — afin que les ID d'ancrage restent cohérents avec les outils existants (doctoc, PyMdown, etc.). `--dry-run` signale les modifications potentielles sans les écrire.

Cette commande ne s'exécute **pas** dans `translate-docs` ou `sync` ; exécutez-la explicitement lorsque vous souhaitez des identifiants de fragment stables dans les fichiers sources avant traduction ou publication.

<a id="placeholder-protection"></a>
### Protection des espaces réservés

Avant la traduction, la syntaxe sensible est remplacée par des jetons opaques afin d'éviter toute corruption par le LLM, appliquée dans cet ordre (la restauration s'effectue dans l'ordre inverse) :

1. **Balises et commentaires HTML** (`<strong>`, `<!-- ... -->`, etc.) - les balises HTML en minuscules d'une liste blanche connue sont remplacées par des jetons ```{{HTM_N}}```. Les balises JSX capitalisées (`<Highlight>`, `<Tabs>`, `</Tab>`) sont gérées séparément par la couche MDX (étape 4).
2. **Marqueurs d'admonition** (`:::note`, `:::`) - seul le préfixe de la directive sur la ligne d'ouverture est remplacé par ```{{ADM_OPEN_N}}``` ; tout titre sur la même ligne est laissé au modèle pour traduction. Restauré avec le texte original exact.
3. **Ancres de document** (HTML `<a id="…">`, en-tête Docusaurus `{#…}`) - conservées telles quelles.
4. **Constructions spécifiques à MDX** (`src/processors/mdx-placeholders.ts`) :
   - **Commentaires MDX** (`{/* … */}`, y compris le format d'ID d'en-tête Docusaurus `{/* #my-id */}`) remplacés par ```{{MDX_N}}```.
   - **Balises JSX capitalisées** (`<Highlight>`, `<Tabs>`, `<TabItem>`, `<TOCInline />`, `</Highlight>`) - conservées comme ```{{MDX_N}}``` avec des attributs de chaîne traduisibles (`label`, `tooltip`, `aria-label`) réécrits en ```{{JXA_N}}``` à l'intérieur de la balise, sauf si le nom de l'attribut apparaît dans `docs[].protectAttributes` ; `label:` à l'intérieur des littéraux d'objet `<Tabs values={[ { label: '…' } ]}>` (sautables via `docs[].protectKeys`) et `<TabItem value="…">` (lorsqu'aucun attribut `label` n'existe, en ignorant les valeurs de type slug en minuscules) sont également extraits. Ajoutés au segment sous forme de lignes `||JXA_N: …||`, fusionnés par `restoreMdx`.
   - **Expressions d'accolades MDX** (`{frontMatter.title}`, <code v-pre>style={{…}}</code>) - correspondance sensible à la profondeur, remplacées par ```{{MDX_N}}```.
5. **URL Markdown** (`](url)`, `src="…"`) - restaurées à partir d'une carte après la traduction.
6. **Portées de code en ligne** (`` `code` ``) et **code en ligne en gras** (`**`code`**`) - conservés tels quels.
7. **Mise en emphase en markdown** (facultatif, activé automatiquement pour les paramètres régionaux CJK/RTL) - les délimiteurs d'emphase sont masqués.

La protection partagée des attributs/clés pour les modèles Astro et MDX JSX est implémentée dans `src/processors/expression-attribute-protection.ts` et pilotée par bloc par `docs[].protectAttributes` et `docs[].protectKeys` (voir [protectAttributes / protectKeys](/reference/configuration#protectattributes-protectkeys)).

<a id="cache-translationcache"></a>
### Cache (`TranslationCache`)

Une base de données SQLite (via `node:sqlite`) stocke des lignes indexées par `(source_hash, locale)`, avec `translated_text`, `model`, `filepath`, `last_hit_at` et des champs associés. Le hachage correspond aux 16 premiers caractères hexadécimaux SHA-256 du contenu normalisé (espaces réduits).

À chaque exécution, les segments sont recherchés par hachage × paramètres régionaux. Seules les erreurs de cache sont transmises au LLM. Après la traduction, `last_hit_at` est réinitialisé pour les lignes de segment dans la portée de traduction actuelle qui n'ont pas été atteintes. Les succès de cache lors de la traduction de documents effacent les lignes `translation_failures` obsolètes pour ce segment. `cleanup` exécute d'abord `sync --force-update`, puis supprime les lignes de segment obsolètes (`last_hit_at` nul / chemin de fichier vide), élague les clés `file_tracking` lorsque le chemin source résolu est manquant sur le disque (`doc-block:…`, `json-block:…`, `svg-files:…`, etc.), supprime les lignes de traduction dont le chemin de fichier de métadonnées pointe vers un fichier manquant, élague les lignes `translation_failures` orphelines et élague les lignes `markdown_source_issues` orphelines dont le chemin source résolu est manquant sur le disque ; il ne sauvegarde pas `cache.db` à moins que `--backup <path>` ne soit passé, ce qui écrit d'abord une sauvegarde à ce chemin.

La commande `translate-docs` utilise également le **suivi de fichiers** afin que les sources inchangées avec des sorties existantes et à jour puissent ignorer complètement le travail. `--force-update` relance le traitement des fichiers tout en utilisant le cache de segments ; `--force` efface le suivi des fichiers et contourne les lectures du cache de segments pour la traduction d'API. Lorsque chaque modèle configuré échoue à la validation AST sur un segment markdown, `translate-docs` peut progressivement diviser le segment et réessayer des parties plus petites (`docs[].segmentSplitting.qualityRetrySplit`, activé par défaut). Voir [Documents — comportement du cache et drapeaux](/guide/documents/cli-options#cache-behaviour-and-translate-docs-flags) pour le tableau complet des drapeaux.

**Format d'invite de lot :** `translate-docs --prompt-format` sélectionne les formes XML (`<seg>` / `<t>`) ou tableau/objet JSON pour `LlmClient.translateDocumentBatch` uniquement ; l'extraction, les espaces réservés et la validation restent inchangés. Voir [Format d'invite de lot](/guide/documents/cli-options#batch-prompt-format).

<a id="output-path-resolution"></a>
### Résolution du chemin de sortie

`resolveDocumentationOutputPath(config, cwd, locale, relPath, kind)` associe un chemin relatif à la source au chemin de sortie :

- Style `nested` (par défaut) : `{outputDir}/{locale}/{relPath}` pour le markdown.
- Style `doc-system` : sous `docsRoot`, les sorties utilisent `{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}` ; les chemins en dehors de `docsRoot` reviennent à la disposition imbriquée. Alias : `docusaurus` (par défaut `localeSubpath` = chemin du plugin Docusaurus), `astro-starlight` (par défaut vide `localeSubpath`), `vitepress` (identique à `doc-system` avec `localeSubpath` vide ; préserve la casse des dossiers BCP-47).
- Style `flat` : `{outputDir}/{stem}.{locale}{extension}`. Lorsque `flatPreserveRelativeDir` est `true`, les sous-répertoires source sont conservés sous `outputDir`.
- **Personnalisé** `pathTemplate` : toute disposition markdown utilisant `{outputDir}`, `{locale}`, `{LOCALE}`, `{relPath}`, `{stem}`, `{basename}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}`.
- **Personnalisé** `jsonPathTemplate` : disposition personnalisée séparée pour les fichiers d'étiquettes JSON, utilisant les mêmes espaces réservés.
- `linkRewriteDocsRoot` aide le réécriture de liens plats à calculer les préfixes corrects lorsque la sortie traduite est située ailleurs que dans le répertoire racine par défaut du projet.

<a id="flat-link-rewriting"></a>
### Réécriture des liens plats

Lorsque `docsOutput.style === "flat"`, les fichiers markdown traduits sont placés à côté de la source avec des suffixes de paramètres régionaux. Les liens relatifs entre les pages sont réécrits de sorte que `[Guide](./guide.md)` dans `readme.de.md` pointe vers `guide.de.md`. Contrôlé par `rewriteRelativeLinks` (activé automatiquement pour le style plat sans `pathTemplate` personnalisé). Le même passage ajoute un préfixe de profondeur par fichier aux URL d’actifs non-markdown avant l’exécution de `postProcessing.regexAdjustments` — voir [Réécriture de liens plats](/guide/images-and-screenshots/link-rewriting#the-flat-link-rewriter-and-two-step-flow).

---

<a id="json-internals"></a>
## Internes JSON

| Étape | Composant | Résultat |
| --- | --- | --- |
| 1 | `json[].contentPaths` | Fichiers résolus (fichier, répertoire ou glob) |
| 2 | `NestedJsonExtractor` | Feuilles de chaîne sélectionnées par `keyPolicy` (chemins de points + minimatch) |
| 3 | `PlaceholderHandler` + lot + `TranslationCache` | Cache hit → ignorer ; miss → `LlmClient.translateDocumentBatch` (SQLite partagé) |
| 4 | `NestedJsonExtractor.reassemble` | Fichier de sortie via `expandJsonBlockOutputPath(outputPathTemplate)` |

- `NestedJsonExtractor` (`src/extractors/nested-json-extractor.ts`) parcourt un JSON imbriqué arbitraire et émet un segment par feuille de chaîne traduisible. `keyPolicy.mode` (`allowlist`, `denylist` ou `both`) filtre les chemins avec minimatch sur la notation par points (les noms simples comme `slug` correspondent au segment de clé final).
- Le suivi des fichiers de cache utilise `json-block:{blockIndex}:{projectRelPath}` dans `file_tracking` (même `cacheDir` que les documents et SVG).
- **Pas** pour les catalogues `write-translations` de Docusaurus (forme `{ message, description }`) — ceux-ci utilisent les documents (`docs[].docusaurusCatalogDir` + `JsonExtractor` à l’intérieur de `translate-docs`).
- **Pas** pour les chaînes d’interface utilisateur `t()` — chaînes d’interface utilisateur (`strings.json` + paquets plats).
- CLI : `translate-json` ; orchestration dans `src/cli/translate-json-run.ts`. Modèle d'initialisation : `ui-json-bundles`.

---

<a id="shared-infrastructure"></a>
## Infrastructure partagée

<a id="llmclient"></a>
### `LlmClient`

Client de chat indépendant du fournisseur, basé sur le Vercel AI SDK (`ai` + `@ai-sdk/openai-compatible`). Il résout le fournisseur actif à partir de `provider` / `providers`, construit un client compatible OpenAI (`createOpenAICompatible`) pour la `baseUrl` et la clé API de ce fournisseur, et achemine tous les appels via `generateText`. `OpenRouterClient` est conservé comme alias obsolète. Comportements clés :

- **Repli de modèle** : essaie chaque modèle de la liste résolue dans l'ordre ; se replie en cas d'échec de requête ou d'analyse. Chaque locale cible obtient sa propre chaîne résolue : `localeModels(locale)` en premier lorsqu'il est configuré, puis `uiModels` (pipelines d'interface utilisateur uniquement), puis `translationModels`. La traduction de documents, JSON et SVG crée un client par locale avec la chaîne non-UI. La commande `bench-models` construit plutôt un client à modèle unique par ID configuré (union de `translationModels`, `uiModels` et `localeModels` ; `translationModels: [id]`, sans repli) afin de pouvoir chronométrer et évaluer chaque modèle indépendamment.
- **Délai d'attente de la requête** : le `requestTimeoutMs` du fournisseur actif (30 secondes par défaut) annule chaque requête via `AbortSignal.timeout`. La même valeur s'applique à `GET /models` lorsque la CLI charge la liste des modèles d'un fournisseur pour `check-models` (tout fournisseur). Le filtre de pré-vol facultatif qui supprime les ID de modèle inconnus ne s'exécute que lorsque le fournisseur actif est OpenRouter.
- **Extras OpenRouter** (uniquement lorsque `openrouter` est actif) : routage du débit via le champ de requête `provider`, les en-têtes `HTTP-Referer` / `X-Title` et le coût exact en USD lu à partir de `usage.cost`. L'utilisation des jetons est signalée pour chaque fournisseur ; le coût exact uniquement lorsque le fournisseur le renvoie.
- **Journal de trafic de débogage** : si `debugTrafficFilePath` est défini, ajoute le JSON de la requête et de la réponse à un fichier.

<a id="config-loading"></a>
### Chargement de la configuration

Pipeline `loadI18nConfigFromFile(configPath, cwd)` :

1. Lire et analyser `ai-i18n-tools.config.json` (JSON).
2. `mergeWithDefaults` - fusion profonde avec `defaultI18nConfigPartial`, et fusionner toutes les entrées `docs[].sourceFiles` dans `contentPaths`.
3. `expandTargetLocalesFileReferenceInRawInput` - convertir `targetLocales` en tableau et rejeter les entrées de type chemin (doivent être des codes BCP-47, pas un chemin vers `ui-languages.json`) ; `languagesManifestPath` prend par défaut `{ui.flatOutputDir}/ui-languages.json` pendant `mergeWithDefaults`.
4. `expandDocumentationTargetLocalesInRawInput` - idem pour chaque entrée `docs[].targetLocales`.
5. `expandJsonTargetLocalesInRawInput` - idem pour chaque entrée `json[].targetLocales`.
6. `parseI18nConfig` - validation Zod + `validateI18nBusinessRules`.
7. `applyProviderOverrideToRawInput` - lorsque `-P` / `--provider` est passé sur la CLI.
8. `applyEnvOverrides` - appliquer `OPENROUTER_BASE_URL`, `OLLAMA_BASE_URL`, `I18N_SOURCE_LOCALE` et `I18N_TARGET_LOCALES` si définis (les clés API sont résolues séparément par fournisseur dans `LlmClient`).
9. `augmentConfigWithUiLanguagesMaster` - attacher les noms d'affichage du manifeste à partir du catalogue principal fourni.
10. `assertEffectiveLocalesInUiLanguagesMaster` - valider les codes de locale par rapport au catalogue principal, le cas échéant.

`init` écrit des configurations de démarrage à partir de `initConfigTemplates` : `ui-markdown` (UI + Markdown d'application facultatif), `ui-docusaurus`, `ui-starlight`, `ui-vitepress` (documentation VitePress + `vitepressThemeCatalog`), `ui-nextra` (documentation Nextra + `nextraDictionaryPath`), `ui-astro-website` (UI Astro simple ; ajouter `docs[]` pour la traduction de pages `.astro`), `ui-json-bundles` (`json[]` JSON uniquement). Voir [Démarrage rapide — Initialiser](/guide/quick-start#step-1-initialise).

<a id="logger"></a>
### Journalisation (Logger)

`Logger` prend en charge les niveaux `debug`, `info`, `warn`, `error` avec sortie couleur ANSI. Le mode verbeux (`-v`) active `debug`. Lorsque `logFilePath` est défini, les lignes de journal sont également écrites dans ce fichier.

<a id="self-localization-tool-ui"></a>
### Auto-localisation (interface utilisateur de l'outil)

L'outil localise sa propre interface utilisateur — aide en ligne de commande, messages de journalisation/résumé/erreur à fort trafic, et le tableau de bord de traduction — séparément du contenu qu'il traduit pour vous.

- **Résolution de la locale** (`resolveUiLocale` dans `src/core/ui-locale.ts`) : sélectionne la locale de l'interface utilisateur à partir de `-L` / `--ui-lang` > `AI_I18N_LANG` > configuration `uiLanguage` > locale du système d'exploitation hôte (`Intl.DateTimeFormat().resolvedOptions().locale`). Le candidat est normalisé et mis en correspondance avec l'ensemble de bundles fourni exactement ou par la variation la plus proche (par exemple `pt-PT` → `pt-BR`, `en-US` → `en-GB`), en revenant à la locale source (`en-GB`). La CLI résout une fois avant la construction de l'aide (analyse argv pré-analyse) et à nouveau après le chargement de la configuration afin que `uiLanguage` s'applique (le drapeau et la variable d'environnement l'emportent toujours).
- **Exécution** (`src/i18n/index.ts`) : un `t(source, vars)` minimal avec interpolation ```{{name}}```, indexé par la chaîne source anglaise par rapport aux bundles plats par locale dans `src/i18n/locales/<code>.json` (copiés dans `dist/i18n/locales` lors de la construction). Les clés ou bundles manquants renvoient le texte source. Il s'agit du même modèle clé-comme-défaut que les chaînes de l'interface utilisateur — il n'y a pas de recherche par hachage.
- **Tableau de bord** : le serveur expose `GET /api/ui-i18n` renvoyant `{ locale, dir, bundle }` pour la locale de l'interface utilisateur résolue ; le frontend définit `<html lang>` / `dir` et localise le balisage statique via les attributs `data-i18n*`.
- **Dogfooding** : les bundles sont produits en exécutant le propre pipeline d'extraction → `translate-ui` du package par rapport à `ai-i18n-self.config.json` (`pnpm i18n:self`). Les clés de catalogue proviennent des appels `t()` à travers `src/cli/` et `src/i18n/` plus les marqueurs `data-i18n*` du tableau de bord dans `src/dashboard-app/index.html`.

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
  extract(content: string, filepath: string): Segment[] { /* … */ }
  reassemble(segments: Segment[], translations: Map<string, string>): string { /* … */ }
}
```

Enregistrez des extracteurs personnalisés en étendant les classes d'extracteurs publiques exportées depuis `'ai-i18n-tools'` (par exemple, sous-classe `MarkdownExtractor`). La CLI connecte les extracteurs intégrés en interne ; il n'y a pas d'importation profonde prise en charge de `doc-translate.ts`.

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

---

<a id="source-tree"></a>
## Arborescence source

<details>
<summary>Disposition complète <code>src/</code> (référence au niveau du fichier)</summary>

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
│   ├── bench-models.ts             `bench-models` command (per-model translate latency/token/cost benchmark)
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

</details>
