<a id="quick-start"></a>
# Démarrage rapide

Le modèle `init` par défaut (`ui-markdown`) active uniquement l'extraction et la traduction de l'**UI**. Les modèles `ui-docusaurus`, `ui-starlight`, `ui-vitepress`, `ui-nextra` et `ui-fumadocs` activent la traduction de **documents** (`translate-docs`) ; `ui-vitepress` génère également `docsOutput.vitepressThemeCatalog` pour les chaînes de caractères du thème VitePress, `ui-nextra` génère `docs[].nextraDictionaryPath` pour le dictionnaire du thème Nextra (la barre latérale `_meta.ts` est collectée automatiquement), et `ui-fumadocs` génère `docsOutput.fumadocsUiCatalog` pour les remplacements d'UI Fumadocs (la barre latérale `meta.json` est collectée automatiquement). Le modèle `ui-astro-website` génère l'extraction de l'**UI** pour les applications Astro simples (y compris les fichiers `.astro`) ; ajoutez un bloc `docs[]` (voir [Pages du site Astro (parse-and-replace)](/fr/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace)) si vous souhaitez également `translate-docs` pour le HTML des pages `.astro`. La référence [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) utilise les **deux** pipelines. Les modèles Python sont `ui-python`, `ui-python-gettext`, `ui-python-flask` et `ui-python-django` — voir [Ajouter l'i18n à une application Python](/fr/guide/add-i18n-to-python). Utilisez `sync` lorsque vous souhaitez une commande unique qui exécute l'extraction, la traduction de l'UI, la traduction optionnelle de fichiers SVG et la traduction de la documentation conformément à votre configuration.

Les projets Python peuvent utiliser l'exécutable autonome et éviter l'installation de Node.js. Étapes de téléchargement : [Installation — Exécutables autonomes](/fr/guide/installation#standalone-executables).

<a id="runnable-examples"></a>
### Exemples exécutables

Les projets exécutables et les fixtures se trouvent sous [`examples/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/). Consultez le catalogue [Exemples](/fr/examples) pour obtenir la liste complète, les commandes de copie et savoir quels dossiers utilisent `pnpm` par rapport à un environnement virtuel Python.

**Exécuter un exemple Node.js de manière autonome** (sans cloner l'intégralité du monorepo) :

```bash
npx degit wsj-br/ai-i18n-tools/examples/console-app console-app
cd console-app
pnpm install
pnpm run i18n:sync    # example scripts call the locally installed CLI
```

Remplacez `console-app` par le nom de n'importe quel autre dossier d'exemple Node.js. Chacun de ces exemples déclare une plage de versions publiée `ai-i18n-tools` correspondant à la version actuelle du package et installe la CLI depuis npm. Les exemples Python n'ont pas de `package.json`. Copiez-les avec la même commande `degit`, ou utilisez `ai-i18n-tools-python-examples.zip` depuis la version GitHub, puis suivez [Exemples — Python](/fr/examples#python-examples).

**Depuis le dépôt complet ai-i18n-tools** — si vous avez cloné l'intégralité du dépôt (pas seulement un dossier d'exemple avec degit) :

```bash
pnpm install          # repository root
pnpm run build        # after changing CLI source
cd examples/console-app
pnpm run i18n:sync    # preferred — uses the workspace-linked CLI
# or: ai-i18n-tools sync   # after PATH setup — see Using the CLI
```

L'entrée de l'espace de travail [`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) (`ai-i18n-tools: workspace:*`) lie automatiquement les exemples d'espace de travail à votre copie locale. Les fixtures autonomes (`multi-provider`, `test-markdown`) ne sont pas des packages d'espace de travail — depuis leur dossier, utilisez `node ../../bin/ai-i18n-tools.mjs …`. Pour exécuter la CLI depuis la **racine du dépôt** (les propres docs/i18n de ce package), utilisez `ai-i18n-tools` nu après `direnv allow`, ou `pnpm i18n:sync` / `node bin/ai-i18n-tools.mjs …` — voir [Installation — Monorepo cloné](/fr/guide/installation#cloned-monorepo) et le [Guide de développement](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development).

<a id="provider-and-api-key-required-for-translation"></a>
### Fournisseur et clé API (obligatoire pour la traduction)

Chaque commande qui appelle un LLM — `translate-ui`, `translate-docs`, `translate-json`, `translate-svg` et `sync` — nécessite **les deux** :

1. **Au moins un fournisseur** dans `ai-i18n-tools.config.json` : un bloc `providers.<name>` avec `translationModels`, et une clé `provider` de niveau supérieur lorsque plusieurs fournisseurs sont configurés. `init -P <provider>` génère ce préréglage ; ajoutez des fournisseurs ou ajustez les listes de modèles — voir [Fournisseurs et modèles LLM](/fr/guide/providers-and-models).
2. **La clé API correspondante** dans votre environnement ou un fichier `.env` à la racine du projet. Chaque préréglage intégré lit une variable d'environnement nommée à partir du [tableau des préréglages](/fr/guide/providers-and-models#built-in-providers) (par exemple `OPENROUTER_API_KEY` avec `-P openrouter`, ou `OPENAI_API_KEY` avec `-P openai`) ; **Ollama** est l'exception — il utilise un point de terminaison local et n'a pas besoin de clé. Voir [Installation — définissez votre clé API de fournisseur](/fr/guide/installation#using-the-cli).

`extract`, `status` et les autres commandes qui n'appellent pas le LLM n'ont pas besoin de fournisseur ou de clé API.

<a id="core-cli-commands"></a>
### Commandes CLI principales

Exécutez depuis la **racine de votre projet** après avoir installé `ai-i18n-tools` et [configuré votre shell pour la commande brute](/fr/guide/installation#using-the-cli). Les exemples ci-dessous utilisent directement `ai-i18n-tools`.

```bash
# Set the API key for the provider you pass to init (see preset table; skip for local Ollama)
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# export OPENAI_API_KEY=sk-your-key-here
# export CHEAPERINFERENCE_API_KEY=your-key-here

# UI strings (ui-markdown template enables extract + translate-ui)
ai-i18n-tools init -P openrouter
ai-i18n-tools suggest-models          # optional: ranked shortlist
ai-i18n-tools suggest-models --apply  # replace translationModels
ai-i18n-tools extract
ai-i18n-tools translate-ui

# Documents (Docusaurus-oriented template)
ai-i18n-tools init -t ui-docusaurus -P openai
# Astro Starlight docs: ai-i18n-tools init -t ui-starlight -P cheaperinference
# VitePress docs: ai-i18n-tools init -t ui-vitepress -P anthropic
# Nextra docs: ai-i18n-tools init -t ui-nextra -P gemini
# Fumadocs docs: ai-i18n-tools init -t ui-fumadocs -P groq
# Plain Astro website UI: ai-i18n-tools init -t ui-astro-website -P ollama
# Plain HTML catalog: ai-i18n-tools init -t ui-plain-html -P openrouter
# Plain HTML documents: ai-i18n-tools init -t docs-plain-html -P openai
# Python flat JSON: ai-i18n-tools init -t ui-python -P cheaperinference
# Python JSON + gettext: ai-i18n-tools init -t ui-python-gettext -P anthropic
# Django catalogs: ai-i18n-tools init -t ui-python-django -P gemini
# Flask / Jinja gettext: ai-i18n-tools init -t ui-python-flask -P groq
ai-i18n-tools translate-docs

# JSON (no t() in source)
ai-i18n-tools init -t ui-json-bundles -P ollama
ai-i18n-tools translate-json

# Combined: extract UI strings, then translate UI + SVG + docs + json[] (per config features)
ai-i18n-tools sync

# Translation status (UI strings per locale; markdown per file × locale in chunked tables)
ai-i18n-tools status
# ai-i18n-tools status --max-columns 12   # wider tables, fewer chunks
```

La liste de modèles écrite par `init` est un point de départ. `suggest-models` classe les modèles de chat du fournisseur actif. `suggest-models --apply` remplace `translationModels` et laisse `uiModels` et `localeModels` inchangés. Le même classement se trouve sur l'onglet [Modèles](/fr/guide/translation-dashboard/models). Référence des commandes : [suggest-models](/fr/reference/cli-commands/models#suggest-models).

<a id="recommended-packagejson-scripts"></a>
### Scripts `package.json` recommandés

Avec le package installé localement, les scripts `package.json` résolvent `ai-i18n-tools` à partir de `node_modules/.bin` sans configuration de shell supplémentaire. Pour les shells interactifs, configurez d'abord le PATH — voir [Utilisation de la CLI](/fr/guide/installation#using-the-cli).

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
  "i18n:statistics": "ai-i18n-tools statistics",
  "i18n:dashboard": "ai-i18n-tools dashboard",
  "i18n:cleanup": "ai-i18n-tools cleanup"
}
```

**Conseil :** Transmettez `-L <code>` ou définissez `AI_I18N_LANG` si vous souhaitez que la sortie CLI et le tableau de bord soient dans une autre langue — consultez [Langue de l'interface utilisateur de l'outil](/fr/guide/tool-ui-language).

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

Les blocs d'interface utilisateur incluent par défaut leurs catalogues `strings.json` comme suggestions de glossaire pour la documentation (`uiGlossary`). `glossary.userGlossary` ajoute des surcharges CSV pour les termes du produit. Consultez le [Glossaire](/fr/guide/glossary).

Exécutez `ai-i18n-tools sync` pour exécuter un pipeline : lorsque `features.translateUIStrings` est activé, **extrayez** puis **traduisez** les chaînes d’interface utilisateur ; **traduisez** éventuellement les SVG (blocs `features.translateSVG` + `svg`) ; **traduisez la documentation** (`docs[]` tel que configuré) ; puis **traduisez** éventuellement le JSON (`features.translateJson` + `json[]`). Ignorez des parties avec `--no-ui`, `--no-svg`, `--no-docs` ou `--no-json`. Les étapes de documentation et `json[]` acceptent `--dry-run`, `-p` / `--path`, `--force`, `--force-update` et `--check-cache` (les indicateurs de documentation uniquement sont ignorés lorsque `--no-docs` ; JSON utilise les mêmes indicateurs de cache lorsque `--no-json` n’est pas défini).

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

Comment cela s'exécute avec `ai-i18n-tools sync` :

- Les chaînes d'interface sont extraites/traduites depuis `src/` vers `public/locales/`.
- Le premier bloc de documentation traduit les fichiers **Markdown** depuis `docs-site/docs/` vers `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/` (pages de documentation localisées).
- Avec `docs[].docusaurusCatalogDir` défini et `features.translateDocs` activé, ce même bloc traduit également le **JSON du shell Docusaurus** situé dans `docs-site/i18n/en/` vers chaque dossier de langue cible — barre de navigation, pied de page et catalogues de thèmes/plugins, mais pas le contenu des fichiers MDX.
- Le second bloc de documentation traduit `README.md` en fichiers suffixés par la langue dans `translated-docs/` (`docsOutput.style = "flat"`).
- Tous les blocs de documentation partagent `cacheDir`, ainsi les segments inchangés sont réutilisés entre les exécutions afin de réduire le nombre d'appels API et les coûts.
