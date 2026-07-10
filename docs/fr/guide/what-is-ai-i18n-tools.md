<a id="what-is-ai-i18n-tools"></a>
# Qu'est-ce que ai-i18n-tools?

ai-i18n-tools est un outil en ligne de commande et une boîte à outils qui vous aide à traduire votre application et votre documentation à l'aide de votre fournisseur LLM préféré. Vous contrôlez tout à partir d'un seul fichier de configuration, en choisissant les fonctionnalités de traduction à activer. Utilisez la commande « sync » pour exécuter les modes dont vous avez besoin en une seule fois.

<a id="translation-modes"></a>
## Modes de traduction

- **Chaînes d'interface utilisateur** — Extrait les appels `t("…")` (et les marqueurs similaires) du code source JS/TS et écrit des fichiers JSON plats par locale pour i18next ou une recherche statique. Commandes : `extract`, `translate-ui`. Guide : [Chaînes d'interface utilisateur](/fr/guide/ui-strings/).
- **Documents** — Traduit les pages Markdown, MDX et `.astro` listées dans `docs[].contentPaths`. Fonctionne avec VitePress, Starlight, Docusaurus, Nextra, Fumadocs, Astro et d'autres sites de documentation statiques. Commande : `translate-docs`. Guide : [Documents](/fr/guide/documents/).
- **JSON** — Traduit les bundles de locales JSON imbriqués (libellés de thème, remplacements i18n, copie d'application non présente dans la source) définis dans `json[]` de niveau supérieur. Commande : `translate-json`. Guide : [JSON](/fr/guide/json).
- **SVG** — Traduit le texte visible dans les illustrations SVG (`<text>`, `<title>`, `<desc>`) et écrit un fichier de sortie par locale. Séparé de la traduction de documents — `translate-docs` ne modifie pas les ressources SVG. Commande : `translate-svg`. Guide : [Traduction SVG](/fr/guide/svg-translation/).

Les quatre modes utilisent le [fournisseur LLM](/fr/guide/providers-and-models) actif, partagent le même fichier de configuration et réutilisent un cache SQLite afin que les réexécutions n'envoient que le texte nouveau ou modifié au modèle.

<a id="which-should-i-use"></a>
## Lequel dois-je utiliser ?

| Votre contenu | Mode | Commande |
| --- | --- | --- |
| Le code source utilise les marqueurs `t()` ou HTML `data-i18n` | Chaînes d'interface utilisateur | `extract` / `translate-ui` |
| Pages localisées ou sites de documentation | Documents | `translate-docs` |
| Fichiers de langue JSON imbriqués autonomes | JSON | `translate-json` |
| Diagrammes ou illustrations avec des étiquettes en SVG | SVG | `translate-svg` |

De nombreux projets combinent les modes — par exemple, les chaînes d'interface utilisateur et les documents pour un site VitePress, ou les documents et le SVG pour des guides illustrés. Consultez [Démarrage rapide](/fr/guide/quick-start) pour les modèles de squelette et [Configuration](/fr/reference/configuration) pour le schéma de configuration complet.

<a id="examples"></a>
## Exemples

Le dépôt contient des exemples de projets exécutables sous `examples/` — chacun avec sa propre configuration, ses sorties de langue validées et son fichier README. Vous pouvez explorer les fichiers traduits sans clé API ; la réexécution de la traduction nécessite une clé de fournisseur (voir [Fournisseurs et modèles](/fr/guide/providers-and-models)).

| Exemple | Ce qu'il montre |
| --- | --- |
| [console-app](/fr/examples#console-app) | Plus petite application de bout en bout : chaînes d'interface utilisateur `t()` et traduction du README |
| [nextjs-app](/fr/examples#nextjs-app) | Interface utilisateur Next.js, pluriels, SVG, documentation Docusaurus imbriquée, README plat, tableau de bord |
| [docusaurus-docs](/fr/examples#docusaurus-docs) | Site de documentation Docusaurus autonome |
| [astro-website](/fr/examples#astro-website) | Site marketing Astro : traduction HTML pleine page et chaînes `t()` |
| [astro-docs](/fr/examples#astro-docs) | Site de documentation Astro Starlight |
| [vitepress-docs](/fr/examples#vitepress-docs) | Documentation VitePress et catalogue de thèmes |
| [nextra-docs](/fr/examples#nextra-docs) | Documentation Nextra, plus les libellés de la barre latérale `_meta.ts` et le dictionnaire de thèmes |
| [fumadocs-docs](/fr/examples#fumadocs-docs) | Documentation Fumadocs plus les libellés de la barre latérale `meta.json` et le catalogue d'interface utilisateur |
| [multi-provider](/fr/examples#multi-provider) | Comparer les fournisseurs LLM sur le même document |
| [test-markdown](/fr/examples#test-markdown) | Tests de stress du pipeline Markdown (CJK, Devanagari, cas limites) |

Voir [Exemples](/fr/examples) pour les commandes de copie `npx degit` et un guide de choix.

<a id="next-steps"></a>
## Prochaines étapes

1. [Installation](/fr/guide/installation) — installez le package et définissez votre clé API de fournisseur.
2. [Démarrage rapide](/fr/guide/quick-start) — créez une configuration et exécutez votre première traduction.
3. [Fournisseurs et modèles](/fr/guide/providers-and-models) — choisissez un fournisseur, une chaîne de secours de modèle et une substitution `-P`.
