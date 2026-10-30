<a id="add-i18n-to-your-project"></a>
# Ajouter l'i18n à votre projet

Cette section contient l'ensemble des guides pas à pas pour un projet qui n'a actuellement qu'une seule langue. Commencez ici. Chaque page ci-dessous présente un type de projet, de la configuration aux premiers fichiers traduits. [Démarrer](/fr/guide/what-is-ai-i18n-tools) explique ce qu'est l'outil, les options d'installation, ainsi que les fournisseurs et les modèles. Vous pouvez ouvrir un guide pas à pas sans lire ces pages au préalable.

<a id="what-you-do-and-what-the-tool-does"></a>
## Ce que vous faites et ce que l'outil fait

| Vous | L'outil |
| --- | --- |
| Choisissez les langues, un fournisseur et les modèles à essayer | Extrait le texte, le traduit, vérifie le résultat et écrit des catalogues ou des pages |
| Rendez le texte visible : `t()` dans le code de l'application, l'i18n de votre framework de site, ou un marqueur de liste de langues dans un README | Met en cache chaque traduction et la réutilise lors de la prochaine exécution |
| Chargez les fichiers et vérifiez une langue | Affiche la progression et vous permet de réviser le libellé dans le [Tableau de bord de traduction](/fr/guide/translation-dashboard/) |

Les guides pas à pas indiquent quelles modifications de source vous incombent. Des invites d'agent de codage sont incluses lorsque ces modifications sont mécaniques. La CLI écrit les catalogues et les fichiers traduits. Elle n'installe pas i18next ni l'i18n de votre framework de site.

<a id="shared-setup"></a>
## Configuration partagée

Chaque guide pas à pas suit le même ordre. La page que vous choisissez fournit les détails.

1. Installez la CLI et définissez la clé API de votre fournisseur. Ollama n'a pas besoin de clé. [Installation](/fr/guide/installation) et [Fournisseur et clé API](/fr/guide/quick-start#provider-and-api-key).
2. Exécutez `init` avec le modèle nommé sur cette page. Ceci écrit `ai-i18n-tools.config.json`.
3. Préparez le projet afin que l'outil puisse voir le texte. Utilisez l'invite de l'agent de cette page, ou les étapes manuelles sur la même page.
4. Exécutez `ai-i18n-tools sync`, puis `ai-i18n-tools status`.
5. Chargez la sortie, vérifiez une langue cible et réexécutez `sync` lorsque la source change. Le cache n'envoie au modèle que le texte nouveau ou modifié.

<a id="pages-in-this-section"></a>
## Pages de cette section

| Vous avez | Page | Ce que cette page couvre |
| --- | --- | --- |
| Une application JS/TS (React, Next.js, Node, CLI) dont les boutons et messages sont encore en texte brut | [Ajouter l'i18n à une application JS/TS](/fr/guide/add-i18n-to-js) | Installez i18next, ajoutez le bootstrap, enveloppez les littéraux dans `t()`, et ajoutez un sélecteur de langue, puis `extract` et `translate-ui` |
| Une application Python (Streamlit, FastAPI, Flask, bureau, scripts) | [Ajouter l'i18n à une application Python](/fr/guide/add-i18n-to-python) | Placez l'aide `i18n.py`, enveloppez `t()` ou `_()`, ajoutez un sélecteur de langue. La CLI peut s'exécuter à partir d'un exécutable autonome sans installation de Node.js |
| Une application Django, Flask avec des catalogues Flask-Babel, ou toute application utilisant déjà GNU gettext | [Ajouter l'i18n à une application Django / Python gettext](/fr/guide/add-i18n-to-django-gettext) | Conservez vos fichiers `gettext`, `{% blocktranslate %}` et `.po`. L'outil remplit et compile les catalogues |
| Un site de documentation ou de marketing (VitePress, Starlight, Docusaurus, Nextra, Fumadocs, Astro, HTML simple) | [Ajouter l'i18n à un site web ou de documentation](/fr/guide/add-i18n-to-website) | Activez l'i18n du framework avec l'invite de l'agent de la page, puis `sync` pour traduire les pages et les étiquettes de thème |
| Un README de dépôt et d'autres fichiers Markdown, généralement à côté d'une application | [Ajouter l'i18n à votre README et à vos documents Markdown](/fr/guide/add-i18n-to-readme) | Un fichier par langue (`translated-docs/README.de.md`) et une ligne de langue dans le README. `init --with-readme` ajoute ce bloc à n'importe quel modèle |
| Plus d'un des éléments ci-dessus dans un seul dépôt | [Combiner les pipelines](/fr/guide/combining-pipelines) | Une configuration et un `sync`. La paire habituelle est les chaînes d'interface utilisateur de l'application plus le README |
| Des dictionnaires Intlayer, et vous souhaitez conserver Intlayer | [Traduire Intlayer sur place](/fr/guide/translating-intlayer) | `translate-intlayer` remplit les feuilles manquantes et obsolètes à l'intérieur de `*.content.ts` |
| Des dictionnaires Intlayer, et vous quittez Intlayer | [Migrer depuis Intlayer](/fr/guide/migrating-from-intlayer) | `migrate-intlayer` amorce les catalogues à partir des dictionnaires et réécrit les sites d'appel sûrs vers `t()` |

Une application qui a également un README utilise la page de l'application et la page du README ensemble. Un site qui a également un README utilise la page du site web, et `init … --with-readme` pour le bloc README.

<a id="where-to-go-deeper"></a>
## Pour aller plus loin

Les tutoriels s'arrêtent une fois que la première langue est configurée. Les pages de référence prennent le relais à partir de là :

- [Chaînes de l'UI](/fr/guide/ui-strings/), [Documents](/fr/guide/documents/), [JSON](/fr/guide/json) et [SVG](/fr/guide/svg-translation/) pour un pipeline à la fois.
- [Intégrations](/fr/guide/integrations/) pour les chaînes du shell du framework (navigation, barre latérale, thème).
- [Démarrage rapide](/fr/guide/quick-start) pour la liste des commandes et les scripts `package.json` recommandés.
- [Fournisseurs de LLM](/fr/guide/providers-and-models) pour les préréglages et les clés d'API.
- [Modèles d'IA](/fr/guide/ai-models) pour la liste restreinte classée et la chaîne de secours.
