<a id="quick-start"></a>
# Démarrage rapide

Le modèle `init` par défaut (`ui-markdown`) permet uniquement l'extraction et la traduction de l'**interface utilisateur**. Les modèles `ui-docusaurus`, `ui-starlight`, `ui-vitepress` et `ui-nextra` permettent la traduction de **documents** (`translate-docs`) ; `ui-vitepress` échafaude également `docsOutput.vitepressThemeCatalog` pour les chaînes de thème VitePress, et `ui-nextra` échafaude `docs[].nextraDictionaryPath` pour le dictionnaire de thème Nextra (la barre latérale `_meta.ts` est collectée automatiquement). Le modèle `ui-astro-website` échafaude l'extraction de l'**interface utilisateur** pour les applications Astro simples (y compris les fichiers `.astro`) ; ajoutez un bloc `docs[]` (voir [Pages de site Web Astro (analyse et remplacement)](/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace)) lorsque vous souhaitez également `translate-docs` pour le HTML de la page `.astro`. La référence [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) utilise **les deux** pipelines. Utilisez `sync` lorsque vous souhaitez une commande qui exécute l'extraction, la traduction de l'interface utilisateur, la traduction facultative des fichiers SVG et la traduction de la documentation selon votre configuration.

<a id="runnable-examples"></a>
### Exemples exécutables

Neuf projets et fixtures exécutables se trouvent sous [`examples/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/). Voir le catalogue [Exemples](/examples) (application console, Next.js + Docusaurus, site Web Astro, documentation Astro Starlight, documentation VitePress, documentation Nextra, comparaison multi-fournisseurs, test de stress Markdown).

**Exécuter un exemple de manière autonome** (sans cloner l'ensemble du monorepo) :

```bash
npx degit wsj-br/ai-i18n-tools/examples/console-app console-app
cd console-app
pnpm install
```

Remplacez `console-app` par n'importe quel nom de dossier d'exemple. Chaque exemple déclare `"ai-i18n-tools": "^1.7.2"` et installe la CLI depuis npm. Les fichiers README de chaque exemple incluent le même extrait avec le nom du dossier rempli.

**Depuis le dépôt complet ai-i18n-tools :** si vous avez cloné l'ensemble du dépôt (pas seulement un dossier d'exemple avec degit), exécutez `pnpm install` depuis la racine du dépôt ; l'entrée de l'espace de travail [`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) (`ai-i18n-tools: workspace:*`) lie automatiquement les exemples à votre copie locale.

```bash
# UI strings (default template enables extract + translate-ui)
npx ai-i18n-tools init
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui

# Documents (Docusaurus-oriented template)
npx ai-i18n-tools init -t ui-docusaurus
# Astro Starlight docs: npx ai-i18n-tools init -t ui-starlight
# VitePress docs: npx ai-i18n-tools init -t ui-vitepress
# Nextra docs: npx ai-i18n-tools init -t ui-nextra
# Plain Astro website UI: npx ai-i18n-tools init -t ui-astro-website
npx ai-i18n-tools translate-docs

# JSON (no t() in source)
npx ai-i18n-tools init -t ui-json-bundles
npx ai-i18n-tools translate-json

# Combined: extract UI strings, then translate UI + SVG + docs + json[] (per config features)
npx ai-i18n-tools sync

# Translation status (UI strings per locale; markdown per file × locale in chunked tables)
npx ai-i18n-tools status
# npx ai-i18n-tools status --max-columns 12   # wider tables, fewer chunks
```

<a id="recommended-packagejson-scripts"></a>
### Scripts `package.json` recommandés

Une fois le package installé localement, vous pouvez utiliser directement les commandes CLI dans les scripts (pas besoin de `npx`).

**Préférez** `sync` pour tout ce qui consistait auparavant à « exécuter `translate-ui`, puis `translate-svg`, puis `translate-docs`, puis `translate-json` » : `ai-i18n-tools sync` exécute **extract** (quand activé), **translate-ui**, **translate-svg** (facultatif), **translate-docs**, puis **translate-json** (facultatif), dans le bon ordre et avec des indicateurs partagés, selon votre configuration. Enchaîner ces étapes manuellement est sujet à erreurs (ordre, extraction, indicateurs de langue). Utilisez `i18n:translate:ui`, `i18n:translate:svg`, `i18n:translate:docs` et `i18n:translate:json` uniquement lorsque vous avez besoin d'une **étape unique** isolée.

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:translate:json": "ai-i18n-tools translate-json",
  "i18n:status": "ai-i18n-tools status",
  "i18n:dashboard": "ai-i18n-tools dashboard",
  "i18n:cleanup": "ai-i18n-tools cleanup"
}
```

**Conseil :** Passez `-L <code>` ou définissez `AI_I18N_LANG` si vous souhaitez la sortie CLI et le tableau de bord dans une autre langue — voir [Langue de l'interface utilisateur de l'outil](/reference/environment-variables#tool-ui-language).

<a id="combined-sync"></a>
## Synchronisation combinée

Activez toutes les fonctionnalités dans une seule configuration pour exécuter les chaînes d'interface utilisateur et les documents ensemble :

<details>
<summary>Exemple de configuration combinée pour l'interface utilisateur et la documentation</summary>

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-Hans"],
  "features": {
    "translateUIStrings": true,
    "translateDocs": true,
    "translateSVG": false
  },
  "glossary": {
    "uiGlossary": "src/locales/strings.json",
    "userGlossary": "glossary-user.csv"
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "src/locales/strings.json",
    "flatOutputDir": "src/locales/"
  },
  "cacheDir": ".translation-cache",
  "docs": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "docsOutput": { "style": "flat" }
    }
  ]
}
```

</details>

<br />

`glossary.uiGlossary` oriente la traduction des documents vers le même catalogue `strings.json` que l'interface utilisateur afin que la terminologie reste cohérente ; `glossary.userGlossary` ajoute des remplacements CSV pour les termes du produit.

Exécutez `npx ai-i18n-tools sync` pour lancer un pipeline : lorsque `features.translateUIStrings` est activé, **extraire**, puis **traduire les chaînes d'interface** ; traduction **SVG facultative** (bloc `features.translateSVG` + `svg`) ; **traduction de la documentation** (selon la configuration de `docs[]`) ; puis **traduction-json** facultative (`features.translateJson` + `json[]`). Ignorez certaines étapes avec `--no-ui`, `--no-svg`, `--no-docs` ou `--no-json`. Les étapes de documentation et `json[]` acceptent `--dry-run`, `-p` / `--path`, `--force` et `--force-update` (les indicateurs propres à la documentation sont ignorés quand `--no-docs` ; JSON utilise les mêmes indicateurs de cache quand `--no-json` n'est pas défini).

Utilisez `docs[].targetLocales` sur un bloc pour traduire les fichiers de ce bloc vers un **sous-ensemble plus restreint** que l'interface (les langues effectives de la documentation correspondent à l'**union** entre les blocs) :

```json
{
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-Hans"],
  "docs": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "targetLocales": ["de", "fr", "es"]
    }
  ]
}
```

<a id="mixed-documentation-config-docsoutputstyle--docusaurus--flat"></a>
### Configuration de documentation mixte (`docsOutput.style = "docusaurus"` + `"flat"`)

Vous pouvez combiner plusieurs pipelines de documentation dans la même configuration en ajoutant plusieurs entrées dans `docs`. C’est une configuration courante lorsqu’un projet inclut un site Docusaurus (`docsOutput.style = "docusaurus"`) ainsi que des fichiers Markdown au niveau racine (par exemple, un README de dépôt avec `docsOutput.style = "flat"`) devant être traduits avec des noms de fichiers suffixés par la langue.

<details>
<summary>Exemple de configuration mixte Docusaurus et README plat</summary>

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["ar", "es", "fr", "de", "pt-BR"],
  "features": {
    "translateUIStrings": true,
    "translateDocs": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "locales/strings.json",
    "flatOutputDir": "public/locales/"
  },
  "cacheDir": ".translation-cache",
  "docs": [
    {
      "description": "Docusaurus site content (markdown)",
      "contentPaths": ["docs-site/docs/"],
      "outputDir": "docs-site/i18n",
      "docusaurusCatalogDir": "docs-site/i18n/en",
      "addFrontmatter": true,
      "docsOutput": {
        "style": "docusaurus",
        "docsRoot": "docs-site/docs"
      }
    },
    {
      "description": "Root README with docsOutput.style flat",
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "docsOutput": {
        "style": "flat",
        "postProcessing": {
          "languageListBlock": {
            "start": "<small id=\"lang-list\">",
            "end": "</small>",
            "separator": " · ",
            "label": "local"
          }
        }
      }
    }
  ]
}
```

</details>

<br />

Comment cela s'exécute avec `npx ai-i18n-tools sync` :

- Les chaînes d'interface sont extraites/traduites depuis `src/` vers `public/locales/`.
- Le premier bloc de documentation traduit les fichiers **Markdown** depuis `docs-site/docs/` vers `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/` (pages de documentation localisées).
- Avec `docs[].docusaurusCatalogDir` défini et `features.translateDocs` activé, ce même bloc traduit également le **JSON du shell Docusaurus** situé dans `docs-site/i18n/en/` vers chaque dossier de langue cible — barre de navigation, pied de page et catalogues de thèmes/plugins, mais pas le contenu des fichiers MDX.
- Le second bloc de documentation traduit `README.md` en fichiers suffixés par la langue dans `translated-docs/` (`docsOutput.style = "flat"`).
- Tous les blocs de documentation partagent `cacheDir`, ainsi les segments inchangés sont réutilisés entre les exécutions afin de réduire le nombre d'appels API et les coûts.
