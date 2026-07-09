<a id="configuration-reference"></a>
# Référence de configuration

<a id="sourcelocale"></a>
### `sourceLocale`

Code BCP-47 pour la langue source (par exemple `"en-GB"`, `"en"`, `"pt-BR"`). Aucun fichier de traduction n'est généré pour cette langue — la chaîne clé elle-même est le texte source.

**Doit correspondre** à `SOURCE_LOCALE` exporté depuis votre fichier de configuration i18n au moment de l'exécution (`src/i18n.ts` / `src/i18n.js`).

<a id="targetlocales"></a>
### `targetLocales`

Tableau de codes de langue BCP-47 vers lesquels traduire (par exemple, `["de", "fr", "es", "pt-BR"]`).

`targetLocales` est la liste principale des paramètres régionaux pour la traduction de l'interface utilisateur et la liste par défaut des blocs de documentation. Utilisez `generate-ui-languages` pour générer le manifeste `ui-languages.json` à partir de `sourceLocale` + `targetLocales`.

<a id="uilanguage-optional"></a>
### `uiLanguage` (facultatif)

Code BCP-47 pour la langue de l'interface utilisateur de l'outil (aide CLI, journaux/résumés et tableau de bord de traduction). Il est indépendant de `sourceLocale` / `targetLocales` et est remplacé par l'indicateur `-L` / `--ui-lang` et la variable d'environnement `AI_I18N_LANG`. Les valeurs inconnues se dégradent gracieusement vers les paramètres régionaux source (`en-GB`) — il n'y a pas de validation stricte. Voir [Langue de l'interface utilisateur de l'outil](/reference/environment-variables#tool-ui-language).

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

**translate-docs**, **translate-svg** et **translate-json** (et les étapes correspondantes dans `sync`) : nombre maximal de requêtes LLM **par lots** parallèles par fichier (chaque lot peut contenir de nombreux segments). La valeur par défaut est **4** si omise. Ignoré par `translate-ui`. Remplacé par `-b` / `--batch-concurrency`.

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

Traitement par lots des segments pour **translate-docs**, **translate-svg** et **translate-json** : nombre de segments par requête API et plafond de caractères. Valeurs par défaut : **20** segments, **4096** caractères (si omises).

<a id="provider-and-providers"></a>
### `provider` et `providers`

`provider` (niveau supérieur, facultatif) sélectionne la clé du fournisseur actif parmi `providers`. Il est facultatif lorsqu'un seul fournisseur est configuré ; requis lorsque plus d'un est configuré.

`providers` (niveau supérieur) mappe une clé de fournisseur à son bloc. Les clés intégrées (voir le tableau des préréglages ci-dessous) n'ont besoin que de `translationModels` ; toute autre clé définit un point de terminaison personnalisé compatible OpenAI et nécessite `baseUrl` (plus `apiKeyEnv` sauf si le point de terminaison n'a pas besoin de clé).

Chaque bloc `providers.<name>` accepte :

- `translationModels`
  Liste ordonnée préférée des ID de modèle (ID en amont simples, sans préfixe `provider/` ; les ID OpenRouter conservent leur forme native `vendor/model`). Le premier est essayé en premier ; les entrées suivantes sont des solutions de repli en cas d'erreur. Il s'agit de la chaîne par défaut globale pour chaque pipeline lorsqu'aucun niveau plus spécifique ne s'applique.
- `uiModels` (facultatif)
  Liste de modèles ordonnée, réservée à l'interface utilisateur, pour `translate-ui`, la génération plurielle (Étape 0 et Passe B) et `proofread-ui`. Essayée après toute entrée `localeModels` correspondante pour le paramètre régional cible, avant `translationModels`.
- `localeModels` (facultatif)
  Remplacements par paramètre régional pour **tous** les pipelines de traduction. Tableau d'objets `{ "locale": "<BCP-47>", "models": ["…"] }`. Les balises de paramètre régional sont mises en correspondance sans tenir compte de la casse (`pt-br` = `pt-BR`). La liste de chaque paramètre régional est essayée en premier pour ce paramètre régional uniquement, puis les niveaux spécifiques au pipeline (`uiModels` pour l'interface utilisateur) et `translationModels`. Les clés de paramètre régional normalisées en double sont rejetées lors du chargement de la configuration.
- `baseUrl`
  URL de base compatible OpenAI. Remplace l'URL de base prédéfinie ; requise pour un fournisseur non prédéfini.
- `apiKeyEnv`
  Variable d'environnement contenant la clé API. Remplace la variable d'environnement prédéfinie.
- `headers`
  En-têtes HTTP supplémentaires envoyés avec chaque requête à ce fournisseur.
- `maxTokens`
  Nombre maximal de jetons de complétion par requête. Par défaut : `8192`.
- `temperature`
  Température d'échantillonnage. Par défaut : `0.2`.
- `requestTimeoutMs`
  Temps maximal en millisecondes à attendre pour chaque requête. Par défaut : `30000` (30 secondes).

Préréglages de fournisseurs intégrés (clé — URL de base — variable d'environnement de la clé API) :

| Fournisseur | URL de base | Variable d'environnement de la clé API |
| --- | --- | --- |
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

Un bloc `openrouter` hérité de niveau supérieur (avec `baseUrl`, `translationModels`, `defaultModel`, `fallbackModel`, `maxTokens`, `temperature`, `requestTimeoutMs`) est toujours accepté et est automatiquement migré vers `providers.openrouter` (avec `provider: "openrouter"`) au chargement ; `defaultModel` / `fallbackModel` sont intégrés dans `translationModels`.

Pour un exemple exécutable qui configure plusieurs fournisseurs dans une seule configuration et bascule entre eux avec `-P`, voir [`examples/multi-provider`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/multi-provider/) (`openai`, `anthropic`, `nvidia` et `deepseek` sur le même document).

**Pourquoi utiliser plusieurs modèles :** Différents fournisseurs et modèles ont des coûts variables et offrent différents niveaux de qualité selon les langues et les locales. Configurez `translationModels` **comme une chaîne de repli ordonnée** (plutôt qu'un seul modèle) afin que la CLI puisse tenter le modèle suivant si une requête échoue.

Considérez la liste ci-dessous comme une **base** que vous pouvez étendre : si la traduction pour une langue spécifique est médiocre ou infructueuse, recherchez les modèles qui prennent en charge cette langue ou ce script efficacement (référez-vous aux ressources en ligne ou à la documentation de votre fournisseur), et ajoutez ces identifiants de modèle comme alternatives supplémentaires.

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
  "~anthropic/claude-sonnet-latest",
  "openai/gpt-5.3-codex"
  // … add more fallback models as needed
]
```

</details>

<br />

Définissez la variable d'environnement de la clé API du fournisseur actif (par ex. `OPENROUTER_API_KEY`) dans votre environnement ou dans le fichier `.env`.

Avant de modifier les listes de modèles, exécutez `npx ai-i18n-tools check-models`. Pour chaque fournisseur, il vérifie chaque ID de modèle configuré (`translationModels`, `uiModels` et toutes les entrées `localeModels`) par rapport à la liste de modèles en direct de ce fournisseur (`GET /models`), signale les ID manquants ou obsolètes (plus anciens que `expiration_date`), liste les modèles valides et se termine avec un code d'erreur si un ID configuré est invalide. Lorsque le fournisseur renvoie des informations de tarification (par exemple, OpenRouter), il affiche également les prix estimés d'entrée/sortie (USD par million de jetons).

Pour comparer les modèles configurés sur un travail de traduction réel, exécutez `npx ai-i18n-tools bench-models`. Il évalue chaque ID de modèle unique à partir de `translationModels`, `uiModels` et `localeModels` en traduisant un échantillon à travers chacun d'eux de manière isolée (en parallèle, limité par `concurrency`) et affiche les jetons d'entrée/sortie par modèle, le temps réel et le coût en USD, afin que vous puissiez évaluer la vitesse par rapport au prix avant de choisir les listes de modèles.

<a id="features"></a>
### `features`

| Champ                | Pipeline | Description                                                                                                                                                        |
|----------------------|----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `translateUIStrings` | 1        | Extrait `t("…")` / `i18n.t("…")` dans `strings.json`, puis traduit les entrées et écrit un JSON plat par locale (l'extraction s'exécute automatiquement ; utilisez `extract` autonome pour actualiser le catalogue uniquement). |
| `translateDocs`      | 2        | Traduire `.md` / `.mdx` / `.astro` pages ; JSON de Docusaurus lorsqu'il est défini `docs[].docusaurusCatalogDir` ; Nextra `_meta` / dictionnaire lorsqu'il est configuré ; thème VitePress lorsqu'il est défini `docsOutput.vitepressThemeCatalog` ; Fumadocs `meta.json` / catalogue d'interface utilisateur lorsqu'il est défini `docsOutput.style` est `"fumadocs"`. |
| `translateJson` | 3 | JSON arbitraire imbriqué sous `json[]` (`translate-json`). |
| `translateSVG` | — | Traduire les fichiers `.svg` (nécessite le bloc `svg` au niveau racine). |

Traduire les fichiers **SVG** avec `translate-svg` lorsque `features.translateSVG` est à true et qu'un bloc racine `svg` est configuré. La commande `sync` exécute cette étape lorsque les deux conditions sont remplies (sauf si `--no-svg`).

<a id="ui"></a>
### `ui`

- `sourceRoots`  
  Répertoires ou modèles de glob (relatifs au répertoire de travail actuel) analysés pour les appels `t("…")`. Prend en charge des modèles comme `src/` ou `["src/**/*.ts"]`.
- `stringsJson`  
  Chemin d'accès au fichier de catalogue principal. Mis à jour par `extract`.
- `flatOutputDir`  
  Répertoire où les fichiers JSON par paramètre régional sont écrits (`de.json`, etc.).
- `uiExtractor.funcNames` (ou l'ancien `reactExtractor.funcNames`)  
  Noms de fonctions supplémentaires à analyser (par défaut : `["t", "i18n.t"]`).
- `uiExtractor.extensions` (ou l'ancien `reactExtractor.extensions`)  
  Extensions de fichier à inclure (par défaut : `[".js", ".jsx", ".ts", ".tsx"]`). Ajoutez `.astro` pour le frontmatter et les expressions de modèle Astro.
- `uiExtractor.includePackageDescription` (ou l'ancien `reactExtractor.includePackageDescription`)  
  Lorsque `true` (par défaut), `extract` inclut également `package.json` `description` comme chaîne d'interface utilisateur si présente.
- `uiExtractor.packageJsonPath` (ou l'ancien `reactExtractor.packageJsonPath`)  
  Chemin personnalisé vers le fichier `package.json` utilisé pour cette extraction de description facultative.
- `uiExtractor.includeUiLanguageEnglishNames` (ou l'ancien `reactExtractor.includeUiLanguageEnglishNames`)

Lorsque `true` (par défaut `false`), `extract` ajoute également chaque `englishName` du catalogue principal des langues d'interface utilisateur (construit à partir de `sourceLocale` + `targetLocales`) à `strings.json` s'il n'est pas déjà présent à partir de l'analyse source (mêmes clés de hachage). Ne lit pas `uiLanguagesPath`.

<a id="cachedir"></a>
### `cacheDir`

- `cacheDir`
Répertoire du cache SQLite (partagé par tous les blocs `docs`). Par défaut `.translation-cache`. Réutiliser entre les exécutions. Si vous migrez depuis un cache de traduction de documents personnalisé, archivez-le ou supprimez-le — `cacheDir` crée sa propre base de données SQLite et n'est pas compatible avec d'autres schémas.

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

Tableau de blocs de pipeline de documentation. `translate-docs` et la phase de documentation de `sync` **traitent chaque** bloc dans l'ordre. Les clés héritées sont toujours acceptées au moment du chargement et réécrites lorsque le fichier de configuration est inscriptible ; préférez les noms actuels dans les nouvelles configurations.

| Clé héritée | Clé/comportement actuel |
| --- | --- |
| `documentations` | `docs` |
| `markdownOutput` | `docs[].docsOutput` |
| `jsonSource` | `docs[].docusaurusCatalogDir` |
| `openrouter` de niveau supérieur | `providers.openrouter` + `provider: "openrouter"` |
| `features.translateMarkdown` | `features.translateDocs` |
| `features.translateJSON` | supprimé (utiliser `docs[].docusaurusCatalogDir` ou `json[]`) |
| `features.extractUIStrings` | supprimé (`extract` s'exécute avant la traduction de l'interface utilisateur) |
| `glossary.uiGlossaryFromStringsJson` | `glossary.uiGlossary` |
| `ui.reactExtractor` | `ui.uiExtractor` (l'alias est toujours accepté) |
| `svg.svgExtractor.forceLowercase` | `svg.forceLowercase` |

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
Facultatif. Répertoire source des catalogues d'étiquettes JSON Docusaurus pour ce bloc (par exemple, `"i18n/en"` de `docusaurus write-translations`). Les corps de page proviennent toujours de `contentPaths` ; `docusaurusCatalogDir` ne fournit que le JSON de l'interface/shell, pas le MDX.
- `nextraMetaGlob`
Glob(s) facultatif(s) pour `_meta.ts` / `_meta.tsx` / `_meta.js` Nextra sous `docsRoot`. Lorsque `docsOutput.style` est `"nextra"` et que ceci est omis, tous les fichiers `_meta` sous `docsRoot` sont collectés automatiquement.
- `nextraMetaTranslatableKeys`
Noms de propriétés facultatifs dont les valeurs de chaîne sont traduites dans les objets `_meta` Nextra (par défaut : `title`, `display`, `breadcrumb`).
- `nextraDictionaryPath`
Module de dictionnaire de thème Nextra anglais facultatif (par exemple, `"app/_dictionaries/en.ts"`). Traduit en `{dir}/{locale}.ts` pendant `translate-docs`.
- `nextraDictionaryOutputTemplate`
Modèle de sortie facultatif pour les modules de dictionnaire de locale (par défaut : `{dir}/{locale}.ts` par rapport au répertoire du dictionnaire).

**Disposition de sortie**

- `outputDir`
Répertoire racine pour la sortie traduite de ce bloc.
- `docsOutput.style`
`"nested"` (par défaut), `"flat"`, `"doc-system"`, ou les alias `"docusaurus"` / `"astro-starlight"` / `"vitepress"` / `"nextra"`.
- `docsOutput.localeSubpath`
Segment de chemin entre `{locale}/` et `{relativeToDocsRoot}` pour `doc-system` (obligatoire lors de l'utilisation directe de `style: "doc-system"` ; prédéfini lors de l'utilisation d'un alias). Utilisez `""` pour les dossiers de locale de style Starlight.
- `docsOutput.docsRoot`
Racine des documents source pour la mise en page Docusaurus (par exemple, `"docs"`). Par défaut `"docs"` si omis.
- `docsOutput.pathTemplate`
Chemin de sortie Markdown personnalisé. Espaces réservés : <code>"{outputDir}"</code>, <code>"{locale}"</code>, <code>"{LOCALE}"</code>, <code>"{llocale}"</code>, <code>"{relPath}"</code>, <code>"{stem}"</code>, <code>"{basename}"</code>, <code>"{extension}"</code>, <code>"{docsRoot}"</code>, <code>"{relativeToDocsRoot}"</code>.
- `docsOutput.jsonPathTemplate`
Chemin de sortie JSON personnalisé pour les fichiers d'étiquettes. Prend en charge les mêmes espaces réservés que `pathTemplate`.
- `docsOutput.localePathLowercase`
Lorsque `true`, les mises en page de sortie intégrées (`nested`, `flat`, `doc-system` sans `pathTemplate`) utilisent des segments de paramètres régionaux en minuscules dans les chemins. Par défaut `false` ; `astro-starlight` et `doc-system` avec `localeSubpath` vide par défaut à `true` au chargement de la configuration.
- `docsOutput.flatPreserveRelativeDir`
Lorsque `docsOutput.style = "flat"`, conserve les sous-répertoires source afin que les fichiers avec le même nom de base n'entrent pas en collision. Par défaut `false`.
- `docsOutput.rewriteRelativeLinks`
Réécrire les liens relatifs après la traduction (activé automatiquement lorsque `docsOutput.style = "flat"` et aucune `pathTemplate` personnalisée).
- `docsOutput.linkRewriteDocsRoot`
Racine du dépôt utilisée lors du calcul des préfixes de réécriture de liens plats. Laissez généralement ceci comme `"."`, sauf si vos documents traduits se trouvent sous une racine de projet différente.
- `docsOutput.rewriteVitepressLinks`
Lorsque `true`, exécutez le normalisateur de liens VitePress après la traduction. Par défaut, activé lorsque `docsOutput.style` est `"vitepress"`. À utiliser avec toute mise en page `doc-system` où les dossiers de locale se trouvent à côté de l'anglais sous `docsRoot`. Réécrit les chemins `docs/guide/…` de style README vers les routes du site (`/guide/…`) et les liens `../guide/…` relatifs à la locale. Pour les liens vers des fichiers de dépôt en dehors de l'arborescence VitePress (`LICENSE`, `examples/`), utilisez des URL complètes dans la source anglaise — voir [Intégration VitePress — README comme page d'accueil des documents](/guide/vitepress-integration#readme-as-homepage).
- `docsOutput.rewriteNextraLinks`
Lorsque `true`, exécutez le normalisateur de liens Nextra après la traduction. Par défaut, activé lorsque `docsOutput.style` est `"nextra"`. Réécrit `content/en/…` et les chemins relatifs `.mdx` vers des routes de site neutres en locale (`/guide/…`) pour Next.js `i18n`. Voir [Intégration Nextra — Conventions de liens](/guide/nextra-integration#link-conventions).
- `docsOutput.fumadocsParser`
`"dot"` (par défaut) ou `"dir"`. Dot écrit `stem.{locale}.mdx` à côté des sources anglaises ; dir écrit des dossiers de locale comme Nextra. Voir [Intégration de Fumadocs — Mise en page](/guide/fumadocs-integration#page-layout).
- `docsOutput.rewriteFumadocsLinks`
Lorsque `true`, exécutez le normaliseur de lien Fumadocs après la traduction. Par défaut, activé lorsque `docsOutput.style` est `"fumadocs"`. Réécrit les chemins de contenu et les liens relatifs `.mdx` vers les routes `/docs/…`.
- `docsOutput.fumadocsUiCatalog`
Facultatif. Catalogue de remplacement d'interface utilisateur Fumadocs bootstrap + traduction à l'intérieur `translate-docs`. Champs : `sourcePath` (par exemple `lib/layout.shared.ts`), `catalogPath` (JSON anglais généré), facultatif `outputPathTemplate` (par défaut : `ui.{locale}.json` à côté de `catalogPath`).
- `docs[].fumadocsMetaGlob`
Facultatif glob(s) pour la collection `meta.json` lorsque `docsOutput.style` est `"fumadocs"`. Par défaut : récursif `meta.json` sous `docsOutput.docsRoot`.
- `docs[].fumadocsMetaTranslatableKeys`
Noms de propriétés dont les valeurs de chaîne sont traduites dans Fumadocs `meta.json` (par défaut : `title`, `description`).
- `docsOutput.vitepressThemeCatalog`
Facultatif. Catalogue de thème/nav/barre latérale VitePress bootstrap + traduction à l'intérieur `translate-docs`. Champs : `configPath` (configuration VitePress avec des chaînes de thème), `catalogPath` (JSON anglais nested généré), facultatif `outputPathTemplate` (par défaut : `theme.{locale}.json` à côté de `catalogPath`).

**Post-traitement**

- `docsOutput.postProcessing`
Transformations facultatives sur le **corps Markdown** traduit (les clés YAML et les valeurs de "front matter" non-prose sont conservées). S'exécute après le réassemblage des segments et la réécriture des liens (plats ou VitePress), et avant `addFrontmatter`.
- `docsOutput.postProcessing.regexAdjustments`
Liste ordonnée de `{ "description"?, "search", "replace" }`. `search` est un motif d'expression régulière (une chaîne simple utilise l'indicateur `g`, ou `/pattern/flags`). `replace` prend en charge les espaces réservés tels que `${translatedLocale}`, `${sourceLocale}`, `${sourceFullPath}`, `${translatedFullPath}`, `${sourceFilename}`, `${translatedFilename}`, `${sourceBasedir}`, `${translatedBasedir}`.
<a id="language-switcher-languagelistblock"></a>
- `docsOutput.postProcessing.languageListBlock`
`{ "start", "end", "separator", "label"? }` — régénère une ligne de liens "lire dans d'autres langues" délimitée dans le Markdown source et traduit. Nécessite `uiLanguagesPath` (ou un manifeste à `ui.flatOutputDir/ui-languages.json`) pour les étiquettes endonymes lorsque `label: "local"`.

**Comportement et métadonnées**

- `translateFrontmatterFields`
Même niveau que `docsOutput` (par bloc `docs[]`). Par défaut `true` : traduire la prose YAML destinée à l'utilisateur pour Starlight/Docusaurus (`title`, `description`, `sidebar.label`, `sidebar_label`, `keywords`, `hero.title`, `hero.tagline`, `hero.image.alt`, `hero.actions[].text`, `pagination_label`, étiquettes `prev`/`next`). Définissez `false` pour conserver l'intégralité du bloc d'en-tête inchangé ; passez un tableau de chaînes pour le restreindre à des chemins de points spécifiques.
- `segmentSplitting`
Même niveau que `docsOutput` (par bloc `docs[]`). Segments facultatifs plus précis pour l'extraction `translate-docs` : `{ "enabled", "maxCharsPerSegment"?, "splitPipeTables"?, "splitDenseParagraphs"?, "maxLinesPerParagraphChunk"?, "splitLongLists"?, "maxListItemsPerChunk"?, "qualityRetrySplit"?, "maxQualityRetrySplitDepth"? }`. Lorsque `enabled` est `true` (par défaut lorsque `segmentSplitting` est omis), les paragraphes denses, les tableaux GFM (le premier bloc inclut l'en-tête, le séparateur et la première ligne de données) et les longues listes sont divisés ; les sous-parties se rejoignent avec des sauts de ligne uniques (`tightJoinPrevious`). Définissez `"enabled": false` pour utiliser un segment par bloc de corps délimité par une ligne vide uniquement. Lorsque `qualityRetrySplit` est `true` (par défaut), les segments markdown qui échouent à la validation AST après l'épuisement de tous les modèles sont divisés progressivement et réessayés à partir du premier modèle ; `maxQualityRetrySplitDepth` (par défaut `3`) limite les divisions récursives.
- `warnMarkdownSourceIssues`
Lorsque `true` (par défaut si omis), chaque exécution de `translate-docs` rescane les segments markdown pour les délimiteurs risqués / le code en ligne non fermé, affiche des avertissements dans le terminal et remplace les lignes `markdown_source_issues` pour le chemin de fichier du cache de ce fichier. Définissez `false` pour ignorer les avertissements et les mises à jour SQLite pour ce bloc.
- `addFrontmatter`
Lorsque `true` (par défaut si omis), les fichiers markdown traduits incluent les clés YAML : `translation_last_updated`, `source_file_mtime`, `source_file_hash`, `translation_language`, `source_file_path`, et lorsqu'au moins un segment a des métadonnées de modèle, `translation_models` (liste triée des identifiants de modèle du fournisseur actif). Définissez sur `false` pour ignorer.
- `emphasisPlaceholders`
Par bloc `docs[]`. Lorsque `true`, masque les délimiteurs d'emphase markdown en tant qu'espaces réservés avant la traduction. Par défaut à `true` pour les paramètres régionaux CJK (`zh`, `ja`, `ko`) et pour les paramètres régionaux listés dans `rtlLocales` ; sinon, par défaut à `false`. Peut être remplacé via CLI `--emphasis-placeholders` / `--no-emphasis-placeholders`.
- `rtlLocales`
Tableau facultatif de codes BCP-47 traités comme RTL pour les valeurs par défaut des espaces réservés d'emphase (fusionné avec la détection RTL intégrée).

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

Tableau de premier niveau de pipelines de traduction JSON imbriqués. Utilisé uniquement lorsque `features.translateJson` est vrai (`translate-json` ou l'étape JSON de `sync`). Voir [JSON](/guide/json).

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
| `autoAddUserEditedToGlossary` | Lorsque `true`, les modifications du tableau de bord apportées aux chaînes de l'interface utilisateur peuvent être automatiquement ajoutées au glossaire de l'utilisateur. |

**Générer un fichier CSV de glossaire vide :**

```bash
npx ai-i18n-tools glossary-generate
```
