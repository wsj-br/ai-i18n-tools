<a id="documents"></a>
# Documents

Conçu principalement pour la **documentation markdown, MDX et `.astro`** gérée via les blocs de configuration `docs[]`. Le champ `contentPaths` de chaque bloc liste les fichiers ou dossiers à traduire.

Sur les sites [Docusaurus](/fr/guide/integrations/docusaurus), définissez également `docusaurusCatalogDir` sur votre dossier de catalogue `write-translations` (par exemple `docs-site/i18n/en`). Ensuite, `translate-docs` inclut également le JSON shell - la barre de navigation, le pied de page et les chaînes de thème.

Sur les sites [VitePress](/fr/guide/integrations/vitepress), les corps de page utilisent le même pipeline `docs[]`. Les étiquettes de navigation, de barre latérale et de pied de page se trouvent dans `docsOutput.vitepressThemeCatalog` - `translate-docs` amorce le catalogue anglais et le traduit en même temps que les pages, sans pipeline séparé.

Sur les sites [Nextra](/fr/guide/integrations/nextra), les corps de page utilisent le même pipeline `docs[]` avec `docsOutput.style: "nextra"`. Les étiquettes de barre latérale `_meta.ts` sont collectées et traduites automatiquement par `translate-docs` ; les chaînes du dictionnaire de thèmes sont traduites via `docs[].nextraDictionaryPath` dans le même pipeline.

Sur les sites [Fumadocs](/fr/guide/integrations/fumadocs), les corps de page utilisent `docsOutput.style: "fumadocs"` avec `fumadocsParser` `"dot"` (par défaut) ou `"dir"`. Les étiquettes de barre latérale `meta.json` sont collectées automatiquement ; les remplacements d'interface utilisateur sont traduits via `docsOutput.fumadocsUiCatalog`.

Sur les sites [Astro Starlight](/fr/guide/integrations/astro#astro-starlight), les corps de page utilisent `docsOutput.style: "astro-starlight"` avec `docsRoot` à la racine de votre contenu Starlight (généralement `src/content/docs/`). `translate-docs` écrit du markdown/MDX localisé sous `src/content/docs/<locale>/` à côté de l'arborescence anglaise. Starlight fournit des chaînes d'interface utilisateur intégrées pour de nombreux paramètres régionaux — pas de pipeline de catalogue de thème séparé ; les remplacements d'interface utilisateur facultatifs peuvent utiliser `jsonPathTemplate` sur un bloc `docs[]` pour `src/content/i18n/en.json`.

Pour les images PNG et autres images matricielles intégrées dans le markdown, voir [Images et captures d'écran](/fr/guide/images-and-screenshots/). `translate-docs` ne traduit que le texte alternatif ; il ne copie pas les fichiers matriciels.

Pour un bloc **sélecteur de langue** facultatif dans README ou les documents, définissez `docsOutput.style` sur `"flat"` - voir [Sélecteur de langue](/fr/guide/documents/language-switcher).

Les fichiers [SVG](/fr/guide/svg-translation/) sont traduits via [`translate-svg`](/fr/reference/cli-commands/content#translate-svg) lorsque `features.translateSVG` est activé - pas via `docs[]` / `contentPaths`.

Les paquets JSON d'interface utilisateur imbriqués arbitraires, sans rapport avec les chaînes de l'habillage/thème d'un framework de documentation, appartiennent au pipeline [JSON](/fr/guide/json), et non à `docs[]`.

Pour la **cohérence terminologique** entre l'interface utilisateur et la documentation, définissez `glossary.uiGlossary` sur votre chemin `strings.json` — `translate-docs` réutilise les traductions d'interface utilisateur existantes comme indices dans les invites LLM lorsque des termes correspondants apparaissent dans un segment. `glossary.userGlossary` facultatif ajoute des remplacements CSV pour les termes de produit (partagés avec `translate-ui` et `proofread-ui`). Générez un fichier CSV de démarrage avec `glossary-generate`, modifiez les lignes dans l'onglet **Glossaire** du tableau de bord de traduction, ou consultez [Configuration — `glossary`](/fr/reference/configuration#glossary) et [Glossaire](/fr/guide/translation-dashboard/glossary).

<a id="per-locale-model-overrides"></a>
### Substitutions de modèle par locale

`translate-docs` et l'étape de documentation de `sync` résolvent les modèles **par locale cible** : `localeModels(locale)` d'abord si configuré, puis la chaîne `translationModels` globale du fournisseur. Utilisez ceci lorsqu'une langue spécifique a besoin d'un modèle différent de votre liste de secours par défaut - par exemple, préférer Gemini pour la documentation `pt-BR` lorsque la chaîne globale a des difficultés avec le portugais. Voir [Fournisseurs et modèles](/fr/guide/providers-and-models#model-fallback-chain) et [Configuration - `localeModels`](/fr/reference/configuration#provider-and-providers).

<a id="which-guide-to-read"></a>
## Quel guide lire

| Votre configuration | Commencez ici |
| --- | --- |
| Site Docusaurus | `init -t ui-docusaurus`, `docsOutput.style = "docusaurus"` - [Docusaurus](/fr/guide/integrations/docusaurus) |
| Site VitePress | `init -t ui-vitepress` + `vitepressThemeCatalog` pour le thème - [VitePress](/fr/guide/integrations/vitepress) |
| Site Nextra | `init -t ui-nextra` + `nextraDictionaryPath` pour le dictionnaire (la barre latérale `_meta.ts` est automatique) - [Nextra](/fr/guide/integrations/nextra) |
| Site Fumadocs | `init -t ui-fumadocs` + `fumadocsUiCatalog` pour l'interface utilisateur (la barre latérale `meta.json` est automatique) - [Fumadocs](/fr/guide/integrations/fumadocs) |
| Astro Starlight | `init -t ui-starlight` - [Astro Starlight](/fr/guide/integrations/astro#astro-starlight) |
| Documents plats (README, journaux de modifications, etc.) | `docsOutput.style = "flat"` - [Dispositions de sortie](/fr/guide/documents/output-layouts), [sélecteur de langue](/fr/guide/documents/language-switcher) facultatif |
| Où les fichiers traduits atterrissent | [Dispositions de sortie](/fr/guide/documents/output-layouts) |
| Liens `#anchor` entre pages | [Liens d'ancrage](/fr/guide/documents/anchor-links) |
| Réécriture d'URL de liens et d'actifs (`regexAdjustments`) | [Réécriture de liens](/fr/guide/documents/link-rewriting) |
| Captures d'écran dans la documentation | [Images et captures d'écran](/fr/guide/images-and-screenshots/) |
| Terminologie produit et cohérence UI/doc | [Configuration — `glossary`](/fr/reference/configuration#glossary), [Glossaire](/fr/guide/translation-dashboard/glossary) |
| Drapeaux et cache `translate-docs` | [Options CLI](/fr/guide/documents/cli-options) |

<a id="step-1-initialise-for-documentation"></a>
## Étape 1 : Initialisation pour la documentation

```bash
ai-i18n-tools init -t ui-docusaurus [-P <provider>]
```

Pour les sites de documentation Astro Starlight :

```bash
ai-i18n-tools init -t ui-starlight [-P <provider>]
```

Pour les sites de documentation VitePress :

```bash
ai-i18n-tools init -t ui-vitepress [-P <provider>]
```

Définissez `docsOutput.vitepressThemeCatalog` pour les chaînes de navigation/barre latérale/pied de page - voir [Intégration VitePress](/fr/guide/integrations/vitepress).

Pour les sites de documentation Nextra :

```bash
ai-i18n-tools init -t ui-nextra [-P <provider>]
```

Définissez `docs[].nextraDictionaryPath` pour les chaînes du dictionnaire de thème - voir [Intégration Nextra](/fr/guide/integrations/nextra). Les étiquettes de la barre latérale `_meta.ts` sont collectées automatiquement.

Pour les sites de documentation Fumadocs :

```bash
ai-i18n-tools init -t ui-fumadocs [-P <provider>]
```

Définissez `docsOutput.fumadocsUiCatalog` pour les remplacements d'interface utilisateur - voir [Intégration Fumadocs](/fr/guide/integrations/fumadocs). Les étiquettes de la barre latérale `meta.json` sont collectées automatiquement.

Pour une interface utilisateur Astro simple (sans Starlight) :

```bash
ai-i18n-tools init -t ui-astro-website [-P <provider>]
```

Ce modèle n'active que l'extraction de l'interface utilisateur. Pour la traduction HTML de page, définissez également `features.translateDocs` et ajoutez un bloc `docs[]` (voir [Pages de site Web Astro (analyse et remplacement)](/fr/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace)). La configuration [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) montre les deux pipelines ensemble.

Modifiez le fichier `ai-i18n-tools.config.json` généré :

- `provider` et `providers` — `init` échafaude un bloc de fournisseur par défaut (`openrouter` sauf si vous passez `-P <provider>`) ; configurez au moins un fournisseur et définissez sa clé API avant `translate-docs` ou `sync` (Ollama n'a pas besoin de clé). Voir [Fournisseur et clé API](/fr/guide/quick-start#provider-and-api-key) et [Fournisseurs et modèles LLM](/fr/guide/providers-and-models).
- `sourceLocale` - langue source (doit correspondre à `defaultLocale` dans `docusaurus.config.js`).
- `targetLocales` - tableau de codes de locale BCP-47 (par exemple `["de", "fr", "es"]`).
- `cacheDir` - répertoire de cache SQLite partagé pour tous les pipelines (et répertoire de journal par défaut pour `--write-logs`).
- `docs` - tableau de blocs de documentation. Chaque bloc a un `description` facultatif, `contentPaths` (chaîne ou tableau ; fichier, répertoire ou glob), `outputDir`, `docusaurusCatalogDir` facultatif, `docsOutput`, `segmentSplitting` facultatif, `translateFrontmatterFields`, `protectAttributes`, `protectKeys`, `targetLocales`, `addFrontmatter`, etc.
- `docs[].description` - courte note facultative pour les mainteneurs. Lorsqu'elle est définie, elle apparaît dans le titre `translate-docs` et dans les en-têtes de section `status`.
- `docs[].contentPaths` - sources markdown/MDX/`.astro` (et `docusaurusCatalogDir` facultatif pour le JSON shell de Docusaurus).
- `docs[].outputDir` - racine de sortie traduite pour ce bloc.
- `docs[].docsOutput.style` - `"nested"` (par défaut), `"flat"`, `"doc-system"`, ou les alias `"docusaurus"` / `"astro-starlight"` / `"vitepress"` / `"nextra"` / `"fumadocs"` (voir [Dispositions de sortie](/fr/guide/documents/output-layouts)).
- `glossary.uiGlossary` - chemin vers `strings.json` afin que les segments de document obtiennent des indices terminologiques de votre catalogue d'interface utilisateur (voir [Configuration — `glossary`](/fr/reference/configuration#glossary)).
- `glossary.userGlossary` - CSV facultatif pour les traductions de termes de produit fixes ; également utilisé par les pipelines d'interface utilisateur et modifiable dans l'onglet du tableau de bord [Glossaire](/fr/guide/translation-dashboard/glossary).

**Principal contre secondaire :** Concentrez-vous sur `contentPaths` pour les pages localisées. Définissez `docusaurusCatalogDir` lorsque vous avez également besoin du JSON du shell Docusaurus depuis `write-translations`. Omettez `docusaurusCatalogDir` si vous traduisez uniquement les pages.

<a id="step-2-translate-documents"></a>
## Étape 2 : Traduire les documents

```bash
ai-i18n-tools translate-docs
```

Ceci traduit tous les fichiers de chaque bloc `docs[]` `contentPaths` (et le JSON du catalogue Docusaurus lorsque `docusaurusCatalogDir` est défini) dans toutes les locales de documentation effectives. Les segments déjà traduits sont servis à partir du cache SQLite – seuls les segments nouveaux ou modifiés sont envoyés au LLM.

Pour traduire une seule langue :

```bash
ai-i18n-tools translate-docs --locale de
```

Pour vérifier ce qui doit être traduit :

```bash
ai-i18n-tools status
```

Pour les drapeaux, le comportement du cache et le format d'invite par lots, consultez [Options CLI](/fr/guide/documents/cli-options).

<a id="complex-markdown-and-failed-quality-checks"></a>
## Markdown complexe et échecs de contrôle qualité

`translate-docs` vérifie que chaque segment traduit préserve la structure Markdown (y compris l'emphase analysée à partir du document) et que les jetons d'espace réservé internes sont restaurés correctement. Les paragraphes qui empilent de nombreuses étendues `bold` autour de `` `inline code` ``, imbriquent des apostrophes inversées dans du gras (par exemple, des littéraux de modèle tels que `` `fetch(\`/locales/${code}.json\`)` ``), ou entrelacent du gras et du code dans une longue phrase sont fragiles : certaines langues nécessitent un ordre des mots différent, ce qui peut modifier la façon dont `**` et `` ` `` s'alignent après la traduction et déclencher des erreurs CLI telles que `AST mismatch`.

Après la restauration, `translate-docs` rejette également les segments où les espaces réservés des balises HTML ont été réutilisés ou supprimés (de sorte que les balises restaurées ne correspondent plus à la carte source) ou lorsque le modèle a inventé des jetons à double accolade restants qui n'étaient pas dans la source (par exemple, un jeton de style glossaire inventé). Ces échecs utilisent le même chemin de repli du modèle que les jetons internes officiels restants.

**Si vous rencontrez ce type d'échec de validation, préférez simplifier le texte source** – divisez le paragraphe, déplacez un exemple dans un bloc de code clôturé, ou décrivez la même idée avec moins de paires gras/code superposées – plutôt que de vous attendre à ce que chaque modèle et locale reproduise parfaitement le balisage en ligne dense.

Lorsque chaque modèle configuré échoue avec un `AST mismatch` sur le même segment, `translate-docs` peut automatiquement diviser ce segment en parties plus petites (d'abord le milieu de la liste, puis les éléments individuels ou des morceaux de paragraphe plus courts), relancer chaque partie à partir du premier modèle, puis réassembler le résultat sous la clé de cache du segment d'origine. Cette fonction est activée par défaut (`segmentSplitting.qualityRetrySplit`) ; définissez-la sur `false` pour arrêter après l'épuisement des modèles. Le résumé de l'exécution signale `Quality split retries` lorsque ce mécanisme de secours est utilisé.

Pour voir **quels segments ont échoué**, à quelle fréquence, et les **messages de qualité/erreur** stockés, utilisez l'onglet **Échecs** du tableau de bord de traduction ([Tableau de bord de traduction → Échecs](/fr/guide/translation-dashboard/failures#failures-document-translation)).
