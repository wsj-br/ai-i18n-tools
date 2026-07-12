<a id="integrations"></a>
# Intégrations

Guides spécifiques au framework pour intégrer les outils ai-i18n dans les sites de documentation et les projets Astro. Chaque intégration utilise le pipeline [Documents](/fr/guide/documents/) (`translate-docs` / `sync`) pour le contenu des pages ; les chaînes de shell (navigation, barre latérale, thème) sont gérées dans ce même pipeline, le cas échéant — et non via le pipeline [JSON](/fr/guide/json) séparé.

<a id="which-guide-to-read"></a>
## Quel guide lire

| Votre site | Modèle d'initialisation | Commencer ici |
| --- | --- | --- |
| Astro Starlight ou Astro simple | `ui-starlight` / chaînes d'interface utilisateur hybrides | [Astro](/fr/guide/integrations/astro) |
| Docusaurus | `ui-docusaurus` | [Docusaurus](/fr/guide/integrations/docusaurus) |
| VitePress | `ui-vitepress` | [VitePress](/fr/guide/integrations/vitepress) |
| Nextra 4 (Next.js App Router) | `ui-nextra` | [Nextra](/fr/guide/integrations/nextra) |
| Fumadocs 4 (Next.js App Router) | `ui-fumadocs` | [Fumadocs](/fr/guide/integrations/fumadocs) |

<a id="shared-concepts"></a>
## Concepts partagés

Toutes les intégrations de framework de documentation partagent le même modèle de bloc `docs[]` décrit dans [Documents](/fr/guide/documents/). Définissez `docsOutput.style` pour correspondre à votre framework (`"docusaurus"`, `"vitepress"`, `"nextra"`, `"fumadocs"` ou `"astro-starlight"`). Pour la disposition des dossiers de sortie et le comportement de réécriture des liens, consultez [Dispositions de sortie](/fr/guide/documents/output-layouts) et [Réécriture des liens](/fr/guide/documents/link-rewriting).

Chaque modèle `init -t ui-*` génère un bloc de fournisseur LLM par défaut (`openrouter` sauf si vous passez `-P <provider>`). Avant `translate-docs` ou `sync`, configurez `provider` / `providers` si nécessaire et définissez la clé API correspondante — voir [Fournisseur et clé API](/fr/guide/quick-start#provider-and-api-key).

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
