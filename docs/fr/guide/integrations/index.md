<a id="integrations"></a>
# Intégrations

Guides spécifiques au framework pour intégrer les outils ai-i18n dans les sites de documentation et les projets Astro. Chaque intégration utilise le pipeline [Documents](/guide/documents/) (`translate-docs` / `sync`) pour le contenu des pages ; les chaînes de shell (navigation, barre latérale, thème) sont gérées dans ce même pipeline, le cas échéant — et non via le pipeline [JSON](/guide/json) séparé.

<a id="which-guide-to-read"></a>
## Quel guide lire

| Votre site | Modèle d'initialisation | Commencer ici |
| --- | --- | --- |
| Astro Starlight ou Astro simple | `ui-starlight` / chaînes d'interface utilisateur hybrides | [Astro](/guide/integrations/astro) |
| Docusaurus | `ui-docusaurus` | [Docusaurus](/guide/integrations/docusaurus) |
| VitePress | `ui-vitepress` | [VitePress](/guide/integrations/vitepress) |
| Nextra 4 (Next.js App Router) | `ui-nextra` | [Nextra](/guide/integrations/nextra) |
| Fumadocs 4 (Next.js App Router) | `ui-fumadocs` | [Fumadocs](/guide/integrations/fumadocs) |

<a id="shared-concepts"></a>
## Concepts partagés

Toutes les intégrations de framework de documentation partagent le même modèle de bloc `docs[]` décrit dans [Documents](/guide/documents/). Définissez `docsOutput.style` pour correspondre à votre framework (`"docusaurus"`, `"vitepress"`, `"nextra"`, `"fumadocs"` ou `"astro-starlight"`). Pour la disposition des dossiers de sortie et le comportement de réécriture des liens, consultez [Dispositions de sortie](/guide/documents/output-layouts) et [Réécriture des liens](/guide/documents/link-rewriting).

Ne mettez **pas** les chaînes de shell ou de thème du framework dans `json[]` — ce pipeline est destiné aux bundles de locales d'application non liés. Chaque page d'intégration explique quels chemins de catalogue et quels indicateurs CLI couvrent les étiquettes de navigation, de barre latérale et de thème pour ce framework.

<a id="examples"></a>
## Exemples exécutables

| Framework | Dépôt d'exemple |
| --- | --- |
| Astro Starlight | [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) |
| Site web Astro simple | [examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) |
| Docusaurus | [examples/nextjs-app/docs-site](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/docs-site) |
| VitePress | [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs) |
| Nextra | [examples/nextra-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs) |
| Fumadocs | [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs) |
