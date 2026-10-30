<a id="combining-pipelines"></a>
# Combinaison de pipelines

Lisez ceci lorsqu'un projet nécessite plus d'un type de traduction : chaînes d'interface utilisateur d'application et documentation, un site de documentation et un fichier README racine, ou des documents et des illustrations SVG. Si vous ne traduisez qu'un seul type de contenu, [Démarrage rapide](/fr/guide/quick-start) est suffisant.

Une application et son fichier README de dépôt constituent l'approche hybride courante. Échafaudez-le avec `init` (le modèle `ui-markdown`) ou `init -t <template> --with-readme`, puis suivez [Ajouter l'i18n à votre README et à vos documents Markdown](/fr/guide/add-i18n-to-readme). La configuration mixte plus loin sur cette page est la même idée à côté d'un site de documentation.

Ce dépôt est ce type de projet. [`ai-i18n-tools.config.json`](https://github.com/wsj-br/ai-i18n-tools/blob/main/ai-i18n-tools.config.json) traduit les chaînes d'interface utilisateur de la CLI et du tableau de bord de traduction, ainsi que ce site VitePress, en un seul `sync`. Le bloc d'IU couvre `src/cli`, `src/server`, `src/dashboard-app` et `src/api`, et écrit du JSON plat sous `src/i18n/locales`. Le bloc VitePress utilise `docsOutput.style: "vitepress"` pour `docs/` et le catalogue de thèmes. Le même fichier écrit également des traductions `README.md` sous `translated-docs/`. Câblage du site : [VitePress](/fr/guide/integrations/vitepress).

<a id="what-sync-runs"></a>
## Ce que la synchronisation exécute

`ai-i18n-tools sync` exécute les étapes activées dans cet ordre :

1. `extract`, puis `translate-ui`, lorsque `features.translateUIStrings` est activé.
2. `translate-svg`, lorsque `features.translateSVG` est activé et qu'un bloc `svg` existe.
3. `translate-docs`, lorsque `features.translateDocs` est activé ou que tout `docs[].docusaurusCatalogDir` est défini.
4. `translate-json`, lorsque `features.translateJson` est activé et que `json[]` contient des entrées.

Ignorez les parties avec `--no-ui`, `--no-svg`, `--no-docs` ou `--no-json`. Les étapes de documentation et `json[]` acceptent `--dry-run`, `-p` / `--path`, `--force`, `--force-update` et `--check-cache`. Les drapeaux spécifiques à la documentation sont ignorés lorsque `--no-docs` est défini. JSON utilise les mêmes drapeaux de cache lorsque `--no-json` n'est pas défini.

Préférez `sync` plutôt que d'enchaîner les commandes individuelles manuellement. L'ordre, l'extraction et les drapeaux de locale sont faciles à mal configurer lorsqu'ils sont exécutés manuellement.

<a id="ui-strings-and-documents-together"></a>
## Chaînes d'interface utilisateur et documents ensemble

Activez les deux fonctionnalités dans une seule configuration pour exécuter les chaînes d'interface utilisateur et les documents en une seule passe :

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

<a id="fewer-locales-for-documents"></a>
## Moins de locales pour les documents

Utilisez `docs[].targetLocales` sur un bloc pour traduire les fichiers de ce bloc vers un sous-ensemble plus petit que l'IU. Les locales de documentation effectives sont l'union de tous les blocs :

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

<a id="mixed-documentation-config"></a>
## Configuration de documentation mixte

Vous pouvez combiner plusieurs pipelines de documentation dans la même configuration en ajoutant plus d'une entrée dans `docs`. C'est une configuration courante lorsqu'un projet possède un site Docusaurus (`docsOutput.style = "docusaurus"`) et des fichiers Markdown de niveau racine, tels qu'un fichier README de dépôt avec `docsOutput.style = "flat"`, qui doivent être traduits avec des noms de fichiers suffixés par la locale.

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

- Les chaînes d'interface utilisateur sont extraites et traduites de `src/` vers `public/locales/`.
- Le premier bloc de documentation traduit le Markdown de `docs-site/docs/` vers `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/` (pages de documentation localisées).
- Avec `docs[].docusaurusCatalogDir` défini et `features.translateDocs` activé, ce même bloc traduit également le JSON de l'enveloppe Docusaurus sous `docs-site/i18n/en/` dans chaque dossier de locale cible : barres de navigation, pieds de page et catalogues de thèmes/plugins, et non le corps de texte MDX.
- Le deuxième bloc de documentation traduit `README.md` en fichiers suffixés par la locale sous `translated-docs/` (`docsOutput.style = "flat"`).
- Tous les blocs de documentation partagent `cacheDir`, ainsi les segments inchangés sont réutilisés entre les exécutions afin de réduire le nombre d'appels API et les coûts.

Suivant : retour à [Démarrage rapide](/fr/guide/quick-start), ou consultez [Configuration](/fr/reference/configuration) pour le schéma complet.
