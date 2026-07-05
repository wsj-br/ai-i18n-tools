<a id="what-is-ai-i18n-tools"></a>
# Qu'est-ce que ai-i18n-tools?

Le package `ai-i18n-tools` offre trois surfaces de traduction :

- **Chaînes d'interface utilisateur** : extraire les appels `t("…")` de toute source JS/TS, les traduire via le [fournisseur LLM](/guide/providers-and-models) actif et écrire des fichiers JSON plats par locale, prêts pour i18next.
- **Documents** : traduire les **pages markdown, MDX et `.astro`** listées dans `docs[].contentPaths` via `translate-docs`, avec mise en cache intelligente. Le **JSON de catalogue Docusaurus** facultatif (`docs[].docusaurusCatalogDir`, depuis `docusaurus write-translations`) est traduit dans la même commande lorsque `features.translateDocs` est activé — il s'agit des éléments d'interface du site (barre de navigation, pied de page, chaînes de thème), et non du texte dans `docs/`. Les corps de page **VitePress** utilisent le même pipeline `docs[]` ; les étiquettes de navigation/barre latérale/pied de page utilisent JSON (`json[]` / `translate-json`) — voir [intégration VitePress](/guide/vitepress-integration).
- **JSON** : traduire des bundles JSON imbriqués arbitraires (par exemple `src/i18n/en/translation.json`) via les clés de premier niveau `json[]`, `features.translateJson` et `translate-json` — pour les sites qui conservent le texte de l'interface utilisateur dans des fichiers JSON par locale au lieu de `t()` dans le code source.
- **Interface utilisateur de l'outil (intégrée)** — l'aide de la CLI, les journaux et le tableau de bord de traduction sont disponibles en plusieurs langues ; ceci est distinct de la traduction des chaînes d'interface utilisateur ou des documents de **votre** application.

Les ressources **SVG** utilisent `features.translateSVG`, le bloc `svg` de niveau supérieur et `translate-svg` (voir [référence CLI](/reference/cli-commands)).

**Lequel dois-je utiliser ?**

- Chaînes visibles par l'utilisateur dans le code source via `t()` → Chaînes d'interface utilisateur (`extract` / `translate-ui`).
- Pages localisées, JSON de l'habillage Docusaurus ou markdown VitePress → Documents (`translate-docs`).
- JSON de thème VitePress ou autres fichiers de locale imbriqués autonomes → JSON (`translate-json`).

Tous trois utilisent le fournisseur LLM actif (voir [Fournisseurs et modèles](/guide/providers-and-models)) et partagent un seul fichier de configuration.

<a id="next-steps"></a>
## Prochaines étapes

1. [Installation](/guide/installation) — installez le package et définissez votre clé API de fournisseur.
2. [Démarrage rapide](/guide/quick-start) — créez une configuration et exécutez votre première traduction.
3. [Fournisseurs et modèles](/guide/providers-and-models) — choisissez un fournisseur, une chaîne de secours de modèle et une substitution `-P`.
