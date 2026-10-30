<a id="add-i18n-to-a-website-or-docs-site"></a>
# Ajouter l'i18n à un site web ou un site de documentation

Cette page concerne un site de documentation (Markdown ou MDX) ou un site marketing ou statique (un site web Astro ou du HTML simple) en une seule langue. L'outil traduit le contenu de votre page avec les modèles de votre fournisseur de LLM et écrit une copie localisée par langue. Le framework de votre site sert ces copies et fournit le sélecteur de langue.

Pour une application dont les chaînes d'UI se trouvent dans des appels `t()`, utilisez plutôt [Ajouter l'i18n à une application JS/TS](/fr/guide/add-i18n-to-js) ou [Ajouter l'i18n à une application Python](/fr/guide/add-i18n-to-python).

<a id="install-and-choose-a-provider"></a>
## De quoi disposez-vous ?

| Votre site | Modèle d'initialisation | Commencer ici |
| --- | --- | --- |
| Astro Starlight ou Astro simple | `ui-starlight` / chaînes d'interface utilisateur hybrides | [Astro](/fr/guide/integrations/astro) |
| Docusaurus | `ui-docusaurus` | [Docusaurus](/fr/guide/integrations/docusaurus) |
| VitePress | `ui-vitepress` | [VitePress](/fr/guide/integrations/vitepress) |
| Nextra 4 (Next.js App Router) | `ui-nextra` | [Nextra](/fr/guide/integrations/nextra) |
| Fumadocs 4 (Next.js App Router) | `ui-fumadocs` | [Fumadocs](/fr/guide/integrations/fumadocs) |
| Pages HTML simples | `ui-plain-html` ou `docs-plain-html` | [Applications HTML simples](/fr/guide/ui-strings/plain-html) |
| Pas de framework de site, juste un README et des fichiers Markdown | `docs-markdown`, ou n'importe quel modèle plus `--with-readme` | [Ajouter l'i18n à votre README et à vos documents Markdown](/fr/guide/add-i18n-to-readme) |

<details class="agent-prompt">
<summary>Prompts d'agent</summary>

- Astro Starlight : notes uniquement. Fichiers Astro `t()` : [prompt JS/TS](/fr/guide/add-i18n-to-js#run-the-agent-prompt) (ignorer i18next).
- Docusaurus : notes uniquement (`<Translate>` est l'API propre à Docusaurus).
- VitePress : [prompt de catalogue de thème](/fr/guide/integrations/vitepress#wire-configmts-to-generated-theme-json-one-off).
- Nextra : [prompt de dictionnaire](/fr/guide/integrations/nextra#agent-prompt-dictionary-and-routes) et [prompt hybride `t()`](/fr/guide/integrations/nextra#optional-t-for-app-react-hybrid).
- Fumadocs : [prompt de catalogue d'UI](/fr/guide/integrations/fumadocs#agent-prompt).
- Fichiers README et Markdown : [prompt README](/fr/guide/add-i18n-to-readme#run-the-agent-prompt).

</details>

<a id="initialise-the-project"></a>
## Étapes

La même structure fonctionne pour chaque framework ; les détails se trouvent dans le guide du framework lié ci-dessus.

1. Installez la CLI et définissez la clé API : [Installation](/fr/guide/installation), [Fournisseur et clé API](/fr/guide/quick-start#provider-and-api-key).
2. Initialisez : `ai-i18n-tools init -t <template> -P <provider>`.
3. Définissez `sourceLocale`, `targetLocales` et `docs[].contentPaths` (les pages et dossiers écrits dans votre langue source). `sourceLocale` peut être n'importe quelle langue. Le guide du framework indique le bon `docsOutput.style`.
4. Activez l'i18n de votre framework afin qu'il serve et lie les pages localisées. Chaque guide contient une section « Activer l'i18n dans un site existant » : [VitePress](/fr/guide/integrations/vitepress#enable-i18n-in-an-existing-site), [Docusaurus](/fr/guide/integrations/docusaurus#enable-i18n-in-an-existing-site), [Nextra](/fr/guide/integrations/nextra#enable-i18n-in-an-existing-site), [Fumadocs](/fr/guide/integrations/fumadocs#enable-i18n-in-an-existing-site), [Astro](/fr/guide/integrations/astro#enable-i18n-in-an-existing-site).
5. Exécutez `ai-i18n-tools sync` (ou `translate-docs`), puis construisez le site.
6. Vérifiez une route localisée dans le navigateur. Le menu déroulant de locale du framework est le sélecteur. Pour un fichier Markdown plat tel qu'un README, ajoutez une ligne de lien avec [languageListBlock](/fr/guide/documents/language-switcher).

<a id="run-the-agent-prompt"></a>
## Ce qui est traduit

Les corps de page passent toujours par le pipeline [Documents](/fr/guide/documents/). L'interface du framework (navigation, barre latérale, étiquettes de thème) est gérée dans la même exécution lorsque le framework le prend en charge, et non via le pipeline [JSON](/fr/guide/json) séparé.

| Framework | Chaînes de l'interface et du thème | Comment |
| --- | --- | --- |
| Docusaurus | Catalogue `write-translations` (`{ message, description }`) | `docs[].docusaurusCatalogDir` plus `translate-docs` |
| VitePress | Catalogue de thème, de navigation et de barre latérale | `docsOutput.vitepressThemeCatalog` plus `translate-docs` |
| Nextra | Étiquettes de barre latérale `_meta.ts` | Automatique avec `style: "nextra"` |
| Nextra | Dictionnaire de thème `.ts` | `docs[].nextraDictionaryPath` |
| Fumadocs | Étiquettes de barre latérale `meta.json` | Automatique avec `style: "fumadocs"` |
| Fumadocs | Catalogue de personnalisations d'interface utilisateur | `docsOutput.fumadocsUiCatalog` |
| Astro Starlight | Chaînes d'interface utilisateur intégrées pour de nombreux paramètres régionaux | Pages uniquement |

Les images et les captures d'écran ne sont pas traduites par `translate-docs`. Pour les fichiers spécifiques à un paramètre régional, voir [Images et captures d'écran](/fr/guide/images-and-screenshots/).

<a id="review-the-result"></a>
## HTML simple

Deux options, selon le comportement attendu de la page :

- Une page qui change de langue dans le navigateur : marquez le texte avec les attributs `data-i18n*` et utilisez le runtime des chaînes d'interface utilisateur (`ui-plain-html`). Voir [Applications HTML simples](/fr/guide/ui-strings/plain-html).
- Un fichier HTML traduit par paramètre régional : utilisez le pipeline de documents (`docs-plain-html`). Voir [Pages HTML](/fr/guide/documents/html-pages).

Un fichier appartient à un seul chemin d'accès.

<a id="choose-models-and-translate"></a>
## Ce n'est pas votre cas ?

- Chaînes d'interface utilisateur d'application : [Ajouter l'i18n à une application JS/TS](/fr/guide/add-i18n-to-js) ou [Ajouter l'i18n à une application Python](/fr/guide/add-i18n-to-python).
- Un fichier README de dépôt à côté du site, ou des fichiers Markdown sans framework de site : [Ajouter l'i18n à vos documents README et Markdown](/fr/guide/add-i18n-to-readme). `init … --with-readme` ajoute ce bloc à côté d'un modèle de site.
- JSON de paramètres régionaux imbriqués autonomes : [JSON](/fr/guide/json).
- Traduction des chaînes d'un site et d'une application : [Combinaison de pipelines](/fr/guide/combining-pipelines).

Référence pour les options partagées et les différences par framework : [Intégrations](/fr/guide/integrations/).
