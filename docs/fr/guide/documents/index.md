<a id="documents"></a>
# Documents

Conçu principalement pour la **documentation markdown, MDX et `.astro`** gérée via les blocs de configuration `docs[]`. Le champ `contentPaths` de chaque bloc liste les fichiers ou dossiers à traduire.

Sur les sites Docusaurus, définissez également `docusaurusCatalogDir` sur votre dossier de catalogue `write-translations` (par exemple, `docs-site/i18n/en`). Ensuite, `translate-docs` inclut également le JSON de l'interface utilisateur — la barre de navigation, le pied de page et les chaînes de thème.

Sur les sites [VitePress](/guide/vitepress-integration), les corps de page utilisent le même pipeline `docs[]`. Les étiquettes de navigation, de barre latérale et de pied de page se trouvent dans `docsOutput.vitepressThemeCatalog` — `translate-docs` amorce le catalogue anglais et le traduit en même temps que les pages, sans pipeline séparé.

Sur les sites [Nextra](/guide/nextra-integration), les corps de page utilisent le même pipeline `docs[]` avec `docsOutput.style: "nextra"`. Les étiquettes de la barre latérale `_meta.ts` sont collectées et traduites automatiquement par `translate-docs` ; les chaînes du dictionnaire de thème sont traduites via `docs[].nextraDictionaryPath` dans le même pipeline.

Sur les sites [Fumadocs](/guide/fumadocs-integration), les corps de page utilisent `docsOutput.style: "fumadocs"` avec `fumadocsParser` `"dot"` (par défaut) ou `"dir"`. Les étiquettes de la barre latérale `meta.json` sont collectées automatiquement ; les remplacements d'interface utilisateur sont traduits via `docsOutput.fumadocsUiCatalog`.

Pour les images PNG et autres images matricielles intégrées dans le markdown, voir [Images et captures d'écran](/guide/images-and-screenshots/). `translate-docs` ne traduit que le texte alternatif ; il ne copie pas les fichiers matriciels.

Pour un bloc **sélecteur de langue** facultatif dans le README ou la documentation, définissez `docsOutput.style` sur `"flat"` — voir [Sélecteur de langue](/guide/documents/language-switcher).

Les fichiers SVG sont traduits via [`translate-svg`](/reference/cli-commands) lorsque `features.translateSVG` est activé — et non via `docs[]` / `contentPaths`.

Les paquets JSON d'interface utilisateur imbriqués arbitraires, sans rapport avec les chaînes de l'habillage/thème d'un framework de documentation, appartiennent au pipeline [JSON](/guide/json), et non à `docs[]`.

<a id="per-locale-model-overrides"></a>
### Substitutions de modèle par locale

`translate-docs` et l'étape de documentation de `sync` résolvent les modèles **par locale cible** : `localeModels(locale)` en premier lorsqu'il est configuré, puis la chaîne globale `translationModels` du fournisseur. Utilisez ceci lorsqu'une langue spécifique nécessite un modèle différent de votre liste de secours par défaut — par exemple, préférer Gemini pour la documentation `pt-BR` lorsque la chaîne globale a des difficultés avec le portugais. Voir [Fournisseurs et modèles](/guide/providers-and-models#model-fallback-chain) et [Configuration — `localeModels`](/reference/configuration#provider-and-providers).

<a id="which-guide-to-read"></a>
## Quel guide lire

| Votre configuration | Commencez ici |
| --- | --- |
| Site Docusaurus | `init -t ui-docusaurus`, `docsOutput.style = "docusaurus"` — [Étape 1](#step-1-initialise-for-documentation) |
| Site VitePress | `init -t ui-vitepress` + `vitepressThemeCatalog` pour le thème — [Intégration VitePress](/guide/vitepress-integration) |
| Site Nextra | `init -t ui-nextra` + `nextraDictionaryPath` pour le dictionnaire (la barre latérale `_meta.ts` est automatique) — [Intégration Nextra](/guide/nextra-integration) |
| Site Fumadocs | `init -t ui-fumadocs` + `fumadocsUiCatalog` pour l'interface utilisateur (la `meta.json` de la barre latérale est automatique) — [Intégration Fumadocs](/guide/fumadocs-integration) |
| Astro Starlight | `init -t ui-starlight` — [Étape 1](#step-1-initialise-for-documentation) |
| Documents plats (README, changelogs, etc.) | `docsOutput.style = "flat"` — [Mises en page de sortie](/guide/documents/output-layouts), [sélecteur de langue](/guide/documents/language-switcher) facultatif |
| Où les fichiers traduits atterrissent | [Dispositions de sortie](/guide/documents/output-layouts) |
| Liens `#anchor` entre pages | [Liens d'ancrage](/guide/documents/anchor-links) |
| Réécriture d'URL de liens et d'actifs (`regexAdjustments`) | [Réécriture de liens](/guide/documents/link-rewriting) |
| Captures d'écran dans la documentation | [Images et captures d'écran](/guide/images-and-screenshots/) |
| Drapeaux et cache `translate-docs` | [Options CLI](/guide/documents/cli-options) |

<a id="step-1-initialise-for-documentation"></a>
## Étape 1 : Initialisation pour la documentation

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

Pour les sites de documentation Astro Starlight :

```bash
npx ai-i18n-tools init -t ui-starlight
```

Pour les sites de documentation VitePress :

```bash
npx ai-i18n-tools init -t ui-vitepress
```

Définissez `docsOutput.vitepressThemeCatalog` pour les chaînes de navigation/barre latérale/pied de page — voir [Intégration VitePress](/guide/vitepress-integration).

Pour les sites de documentation Nextra :

```bash
npx ai-i18n-tools init -t ui-nextra
```

Définissez `docs[].nextraDictionaryPath` pour les chaînes du dictionnaire de thèmes — voir [Intégration Nextra](/guide/nextra-integration). Les étiquettes `_meta.ts` de la barre latérale sont collectées automatiquement.

Pour les sites de documentation Fumadocs :

```bash
npx ai-i18n-tools init -t ui-fumadocs
```

Définissez `docsOutput.fumadocsUiCatalog` pour les remplacements d'interface utilisateur — voir [Intégration Fumadocs](/guide/fumadocs-integration). Les étiquettes `meta.json` de la barre latérale sont collectées automatiquement.

Pour une interface utilisateur Astro simple (sans Starlight) :

```bash
npx ai-i18n-tools init -t ui-astro-website
```

Ce modèle n'active que l'extraction de l'interface utilisateur. Pour la traduction HTML de page, définissez également `features.translateDocs` et ajoutez un bloc `docs[]` (voir [Pages de site Web Astro (analyse et remplacement)](/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace)). La configuration [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) montre les deux pipelines ensemble.

Modifiez le fichier `ai-i18n-tools.config.json` généré :

- `sourceLocale` - langue source (doit correspondre à `defaultLocale` dans `docusaurus.config.js`).
- `targetLocales` - tableau de codes de langue BCP-47 (par exemple `["de", "fr", "es"]`).
- `cacheDir` - répertoire de cache SQLite partagé pour tous les pipelines (et répertoire de journal par défaut pour `--write-logs`).
- `docs` - tableau de blocs de documentation. Chaque bloc possède des options `description`, `contentPaths` (chaîne ou tableau ; fichier, répertoire ou motif générique), `outputDir`, `docusaurusCatalogDir` facultatif, `docsOutput`, `segmentSplitting` facultatif, `translateFrontmatterFields`, `protectAttributes`, `protectKeys`, `targetLocales`, `addFrontmatter`, etc.
- `docs[].description` - courte note facultative pour les mainteneurs. Lorsqu'elle est définie, elle apparaît dans le titre `translate-docs` et dans les en-têtes de section `status`.
- `docs[].contentPaths` - sources markdown/MDX/`.astro` (et `docusaurusCatalogDir` facultatif pour le JSON de l'interpréteur de commandes Docusaurus).
- `docs[].outputDir` - racine de sortie traduite pour ce bloc.
- `docs[].docsOutput.style` - `"nested"` (par défaut), `"flat"`, `"doc-system"`, ou les alias `"docusaurus"` / `"astro-starlight"` / `"vitepress"` / `"nextra"` / `"fumadocs"` (voir [Dispositions de sortie](/guide/documents/output-layouts)).

**Principal contre secondaire :** Concentrez-vous sur `contentPaths` pour les pages localisées. Définissez `docusaurusCatalogDir` lorsque vous avez également besoin du JSON du shell Docusaurus depuis `write-translations`. Omettez `docusaurusCatalogDir` si vous traduisez uniquement les pages.

<a id="step-2-translate-documents"></a>
## Étape 2 : Traduire les documents

```bash
npx ai-i18n-tools translate-docs
```

Ceci traduit tous les fichiers dans le bloc `docs[]` de chaque `contentPaths` (et le JSON du catalogue Docusaurus lorsque `docusaurusCatalogDir` est défini) dans toutes les locales de documentation effectives. Les segments déjà traduits sont servis à partir du cache SQLite — seuls les segments nouveaux ou modifiés sont envoyés au LLM.

Pour traduire une seule langue :

```bash
npx ai-i18n-tools translate-docs --locale de
```

Pour vérifier ce qui doit être traduit :

```bash
npx ai-i18n-tools status
```

Pour les drapeaux, le comportement du cache et le format d'invite par lots, consultez [Options CLI](/guide/documents/cli-options).

<a id="complex-markdown-and-failed-quality-checks"></a>
## Markdown complexe et échecs de contrôle qualité

`translate-docs` vérifie que chaque segment traduit préserve la structure markdown (y compris l'accentuation analysée depuis le document). Les paragraphes qui accumulent de nombreux éléments `bold` autour de `` `inline code` ``, imbriquent des backticks dans du gras (par exemple des littéraux de gabarits comme `` `fetch(\`/locales/${code}.json\`)` ``), ou entrelacent gras et code dans une longue phrase sont fragiles : certaines langues nécessitent un ordre différent des mots, ce qui peut modifier l'alignement de `**` et `` ` `` après traduction et déclencher des erreurs CLI telles que `AST mismatch`.

**Si vous rencontrez ce type d'échec de validation, préférez simplifier le texte de la langue source** — divisez le paragraphe, déplacez un exemple dans un bloc de code clôturé, ou décrivez la même idée avec moins de paires gras/code superposées — plutôt que de vous attendre à ce que chaque modèle et locale reproduise parfaitement le balisage en ligne dense.

Lorsque chaque modèle configuré échoue avec un `AST mismatch` sur le même segment, `translate-docs` peut automatiquement diviser ce segment en parties plus petites (d'abord le milieu de la liste, puis les éléments individuels ou des morceaux de paragraphe plus courts), relancer chaque partie à partir du premier modèle, puis réassembler le résultat sous la clé de cache du segment d'origine. Cette fonction est activée par défaut (`segmentSplitting.qualityRetrySplit`) ; définissez-la sur `false` pour arrêter après l'épuisement des modèles. Le résumé de l'exécution signale `Quality split retries` lorsque ce mécanisme de secours est utilisé.

Pour voir **quels segments ont échoué**, à quelle fréquence, et les **messages de qualité/erreur** stockés, utilisez l'onglet **Échecs** du tableau de bord de traduction ([Tableau de bord de traduction → Échecs](/guide/translation-dashboard/failures#failures-document-translation)).
