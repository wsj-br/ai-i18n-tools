<a id="integrations"></a>
# Intégrations

Guides spécifiques aux frameworks pour les sites de documentation, les projets Astro et les applications Python. Les intégrations de documentation utilisent le pipeline [Documents](/fr/guide/documents/) (`translate-docs` / `sync`) pour le contenu des pages ; les chaînes de caractères de l'interface (navigation, barre latérale, thème) sont gérées au sein de ce même pipeline là où indiqué — et non via le pipeline [JSON](/fr/guide/json) séparé. Les applications Python utilisent le pipeline [UI strings](/fr/guide/ui-strings/python) (`extract` / `translate-ui`).

<a id="which-guide-to-read"></a>
## Quel guide lire

| Votre site | Modèle d'initialisation | Commencer ici |
| --- | --- | --- |
| Astro Starlight ou Astro simple | `ui-starlight` / chaînes d'interface utilisateur hybrides | [Astro](/fr/guide/integrations/astro) |
| Docusaurus | `ui-docusaurus` | [Docusaurus](/fr/guide/integrations/docusaurus) |
| VitePress | `ui-vitepress` | [VitePress](/fr/guide/integrations/vitepress) |
| Nextra 4 (Next.js App Router) | `ui-nextra` | [Nextra](/fr/guide/integrations/nextra) |
| Fumadocs 4 (Next.js App Router) | `ui-fumadocs` | [Fumadocs](/fr/guide/integrations/fumadocs) |
| Python (Streamlit, FastAPI, Flask, Django, gettext, bureau) | `ui-python` / `ui-python-gettext` / `ui-python-flask` / `ui-python-django` | [Python](/fr/guide/integrations/python) |

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
