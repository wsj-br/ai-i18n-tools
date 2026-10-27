<a id="integrations"></a>
# Intégrations

Référence pour les intégrations de frameworks : ce qu'elles partagent et comment leurs chaînes d'interface diffèrent. Pour ajouter des langues à un site, commencez par [Ajouter l'i18n à un site web ou un site de documentation](/fr/guide/add-i18n-to-website). Pour une application, commencez par [Ajouter l'i18n à une application JS/TS](/fr/guide/add-i18n-to-js) ou [Ajouter l'i18n à une application Python](/fr/guide/add-i18n-to-python). Pour un fichier README de dépôt et d'autres fichiers Markdown, commencez par [Ajouter l'i18n à votre README et à vos documents Markdown](/fr/guide/add-i18n-to-readme).

Les intégrations de documentation utilisent le pipeline [Documents](/fr/guide/documents/) (`translate-docs` / `sync`) pour le contenu des pages ; les chaînes d'interface (navigation, barre latérale, thème) sont gérées dans ce même pipeline là où c'est indiqué — et non via le pipeline [JSON](/fr/guide/json) séparé. Les applications Python utilisent le pipeline [Chaînes d'interface utilisateur](/fr/guide/ui-strings/python) (`extract` / `translate-ui`).

<a id="which-guide-to-read"></a>
## Quel guide lire

Le tableau de sélection, avec les modèles d'initialisation et les invites d'agent par framework, se trouve dans [Ajouter l'i18n à un site web ou un site de documentation](/fr/guide/add-i18n-to-website#what-do-you-have). Frameworks Python : [Python](/fr/guide/integrations/python).

<a id="shared-concepts"></a>
## Concepts partagés

Les intégrations de frameworks de documentation partagent le même modèle de bloc `docs[]` décrit dans [Documents](/fr/guide/documents/). Définissez `docsOutput.style` pour correspondre à votre framework (`"docusaurus"`, `"vitepress"`, `"nextra"`, `"fumadocs"` ou `"astro-starlight"`). Pour la disposition du dossier de sortie et le comportement de réécriture des liens, consultez [Output layouts](/fr/guide/documents/output-layouts) et [Link rewriting](/fr/guide/documents/link-rewriting). La configuration Python est distincte : [Python](/fr/guide/integrations/python).

Chaque `init -t ui-* -P <provider>` scaffold écrit le bloc de fournisseur LLM de ce préréglage. Avant `translate-docs` ou `sync`, définissez la clé API correspondante — consultez [Fournisseur et clé API](/fr/guide/quick-start#provider-and-api-key).

Voir [Traduction du shell du framework](#framework-shell-translation) pour une comparaison entre les frameworks. Chaque guide lié ci-dessous couvre la configuration de ce framework.

<a id="framework-shell-translation"></a>
## Traduction du shell du framework

| Framework | Chaînes de shell / thème | Pipeline |
|-----------|----------------------|----------|
| Docusaurus | Catalogue `write-translations` (`{ message, description }`) | Documents — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | Catalogue Thème/nav/barre latérale | Documents — `docsOutput.vitepressThemeCatalog` + `translate-docs` |
| Nextra | Étiquettes de barre latérale `_meta.ts` | Documents — auto quand `style: "nextra"` + `translate-docs` |
| Nextra | Dictionnaire de thème `.ts` | Documents — `docs[].nextraDictionaryPath` + `translate-docs` |
| Fumadocs | Étiquettes de barre latérale `meta.json` | Documents — auto quand `style: "fumadocs"` + `translate-docs` |
| Fumadocs | Catalogue de surcharges d'interface utilisateur | Documents — `docsOutput.fumadocsUiCatalog` + `translate-docs` |
| Astro Starlight | Chaînes d'interface utilisateur intégrées (nombreuses locales) ; pas de pipeline de shell supplémentaire | Documents — `translate-docs` (pages uniquement) |

Ne placez **pas** les chaînes de shell/thème du framework dans `json[]` — ce pipeline est destiné aux bundles de paramètres régionaux d'applications non liés. Les détails de configuration par framework se trouvent dans les guides liés à partir de [Quel guide lire](#which-guide-to-read).

<a id="runnable-examples"></a>
## Exemples exécutables

| Framework | Dépôt d'exemple |
| --- | --- |
| Astro Starlight | [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) |
| Site web Astro simple | [examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) |
| Docusaurus | [examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs) |
| VitePress | [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs) |
| Nextra | [examples/nextra-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs) |
| Fumadocs | [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs) |
| Streamlit | [examples/python-streamlit](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-streamlit) |
| Flask | [examples/python-flask](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-flask) |
| FastAPI | [examples/python-fastapi](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-fastapi) |
| GNU gettext | [examples/python-gettext](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-gettext) |
