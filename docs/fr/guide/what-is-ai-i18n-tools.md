<a id="what-is-ai-i18n-tools"></a>
# Qu'est-ce que ai-i18n-tools?

Vous avez une application, un site web, un site de documentation ou un fichier README de dépôt dans une seule langue, et vous souhaitez en ajouter d'autres. Cette langue est `sourceLocale`, et il peut s'agir de n'importe quelle langue. L'anglais est un exemple courant dans ces guides. ai-i18n-tools trouve le texte, le traduit avec les modèles du fournisseur de LLM que vous choisissez et écrit les fichiers que votre projet charge déjà. Il met en cache chaque résultat, de sorte que les réexécutions n'envoient au modèle que le texte nouveau ou modifié.

<a id="what-you-do-and-what-the-tool-does"></a>
## Ce que vous faites et ce que l'outil fait

| Vous | L'outil |
| --- | --- |
| Choisissez les langues, un fournisseur et les modèles à essayer | Extrait le texte, le traduit, valide le résultat et écrit des catalogues ou des pages |
| Rendez le texte destiné à l'utilisateur visible par l'outil : appels `t()` dans le code de l'application, l'i18n propre à votre framework pour un site, ou un marqueur de liste de langues dans un fichier README | Met en cache les traductions et les réutilise à chaque réexécution |
| Intégrez le résultat dans l'application, le routage du site ou la ligne de langue du fichier README | Affiche la progression et vous permet de réviser les traductions dans le tableau de bord |

L'outil ne réécrit pas votre code source. Des invites d'agent de codage sont fournies pour l'étape d'encapsulation. Il n'installe pas i18next ni l'i18n de votre framework de site, et il ne construit pas votre sélecteur de langue, bien que des assistants d'exécution soient fournis à cet effet.

<a id="where-do-i-start"></a>
## Par où commencer ?

Les guides pas à pas sont regroupés dans [Ajouter l'i18n à votre projet](/fr/guide/add-i18n-to-your-project), avec la configuration partagée et une page pour chaque type de projet. Choisissez une ligne :

| Vous avez | Commencez ici |
| --- | --- |
| Une application JS/TS (React, Next.js, Node, CLI) avec du texte brut dans le code source | [Ajouter l'i18n à une application JS/TS](/fr/guide/add-i18n-to-js) |
| Une application Python (Streamlit, FastAPI, Flask, Django, gettext, desktop) | [Ajouter l'i18n à une application Python](/fr/guide/add-i18n-to-python) |
| Un site web ou un site de documentation (VitePress, Docusaurus, Starlight, Nextra, Fumadocs, Astro, HTML simple) | [Ajouter l'i18n à un site web ou un site de documentation](/fr/guide/add-i18n-to-website) |
| Un fichier README de dépôt et d'autres fichiers Markdown, généralement à côté d'une application | [Ajouter l'i18n à votre README et à vos documents Markdown](/fr/guide/add-i18n-to-readme) |
| Fichiers de locale JSON imbriqués autonomes | [JSON](/fr/guide/json) |
| Diagrammes SVG avec des étiquettes de texte | [Traduction SVG](/fr/guide/svg-translation/) |
| Dictionnaires Intlayer (quitter Intlayer) | [Migration depuis Intlayer](/fr/guide/migrating-from-intlayer) |
| Dictionnaires Intlayer (garder Intlayer, traduire sur place) | [Traduction d'Intlayer sur place](/fr/guide/translating-intlayer) |

<a id="how-it-works"></a>
## Fonctionnement

1. Installez la CLI et définissez la clé API de votre fournisseur : [Installation](/fr/guide/installation).
2. Exécutez `init` pour écrire `ai-i18n-tools.config.json` : [Démarrage rapide](/fr/guide/quick-start).
3. Préparez le projet : encapsulez les chaînes dans `t()`, activez l'i18n de votre framework de site, ou ajoutez le marqueur de liste de langues à un fichier README.
4. Exécutez `sync`. Il extrait le texte, traduit ce qui est nouveau et écrit la sortie.
5. Chargez la sortie dans votre application ou site, ajoutez un sélecteur de langue, et réexécutez `sync` lorsque le code source change.

<a id="translation-modes"></a>
## Modes de traduction

En coulisses, l'outil exécute quatre pipelines. Votre configuration active ceux dont vous avez besoin, et `sync` les exécute dans l'ordre.

- Chaînes d'interface utilisateur — Extrait les appels `t("…")` et `_()` du code source JS/TS et Python (et des marqueurs similaires, y compris GNU gettext) et écrit des catalogues JSON plats par locale ou `.po` / `.mo`. Commandes : `extract`, `translate-ui`. Guide : [Chaînes d'interface utilisateur](/fr/guide/ui-strings/). Python : [Applications Python](/fr/guide/ui-strings/python).
- Documents — Traduit les pages Markdown, MDX et `.astro` listées dans `docs[].contentPaths`. Fonctionne avec VitePress, Starlight, Docusaurus, Nextra, Fumadocs, Astro et d'autres sites de documentation statiques, ainsi qu'avec un fichier README de dépôt (`docsOutput.style` de `flat`). Commande : `translate-docs`. Guides : [Documents](/fr/guide/documents/) et [Ajouter l'i18n à votre README et à vos documents Markdown](/fr/guide/add-i18n-to-readme).
- JSON — Traduit les paquets de locale JSON imbriqués (étiquettes de thème, remplacements i18n, copie d'application non présente dans le code source) définis dans `json[]` de niveau supérieur. Commande : `translate-json`. Guide : [JSON](/fr/guide/json).
- SVG — Traduit le texte visible à l'intérieur des illustrations SVG (`<text>`, `<title>`, `<desc>`) et écrit un fichier de sortie par locale. Séparé de la traduction de documents. Commande : `translate-svg`. Guide : [Traduction SVG](/fr/guide/svg-translation/).

De nombreux projets combinent des modes. La paire courante est les chaînes d'interface utilisateur et le fichier README du dépôt. Un site de documentation tel que VitePress est l'autre paire fréquente. Voir [Combiner les pipelines](/fr/guide/combining-pipelines) et [Ajouter l'i18n à votre README et à vos documents Markdown](/fr/guide/add-i18n-to-readme).

<a id="examples"></a>
## Exemples

Le dépôt contient des projets d'exemple exécutables sous `examples/`, chacun avec sa propre configuration, ses sorties de locales validées et son fichier README. Explorez les fichiers traduits sans clé API ; la réexécution de la traduction nécessite une clé de fournisseur.

| Si vous avez | Exemple |
| --- | --- |
| Une application JS/TS | [console-app](/fr/examples#console-app), [nextjs-app](/fr/examples#nextjs-app) |
| Un fichier README de dépôt à côté d'une application | [console-app](/fr/examples#console-app), [nextjs-app](/fr/examples#nextjs-app) |
| Une application Python | [python-streamlit](/fr/examples#python-streamlit), [python-fastapi](/fr/examples#python-fastapi), [python-gettext](/fr/examples#python-gettext) |
| Un site de documentation | [docusaurus-docs](/fr/examples#docusaurus-docs), [vitepress-docs](/fr/examples#vitepress-docs), [astro-docs](/fr/examples#astro-docs) |
| Un site web ou du HTML simple | [astro-website](/fr/examples#astro-website), [plain-html](/fr/examples#plain-html) |

Voir [Exemples](/fr/examples) pour la liste complète et les commandes de copie `npx degit`.

<a id="next-steps"></a>
## Prochaines étapes

1. [Installation](/fr/guide/installation) — installez le paquet npm ou téléchargez l'[exécutable autonome](/fr/guide/installation#standalone-executables) pour un projet Python, et définissez votre clé d'API de fournisseur.
2. [Démarrage rapide](/fr/guide/quick-start) — générez une configuration et exécutez votre première traduction.
3. [Fournisseurs de LLM](/fr/guide/providers-and-models) — choisissez un fournisseur, une clé d'API et une substitution `-P`.
4. [Modèles d'IA](/fr/guide/ai-models) — classez une sélection avec `suggest-models` ou l'onglet **Modèles** du tableau de bord, et conservez plusieurs modèles afin qu'une traduction ayant échoué puisse essayer le suivant.
