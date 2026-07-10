<a id="docusaurus-integration"></a>
# Intégration Docusaurus

Utilisez `init -t ui-docusaurus` et `docsOutput.style: "docusaurus"` pour les sites de documentation [Docusaurus](https://docusaurus.io/). Le préréglage génère un bloc `docs[]` avec `docusaurusCatalogDir` afin que `translate-docs` puisse traduire à la fois le markdown de la page et le JSON de l'interface Docusaurus en une seule commande.

Voir aussi [Documents](/guide/documents/), la démo exécutable [examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app) (application Next.js plus `docs-site/` imbriqué) et [examples/nextjs-app/docs-site](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/docs-site) pour une présentation ciblée de Docusaurus uniquement.

<a id="quick-start"></a>
## Démarrage rapide

```bash
npx ai-i18n-tools init -t ui-docusaurus
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths, docusaurusCatalogDir)
pnpm run i18n:sync   # or: ai-i18n-tools sync
cd docs-site && pnpm build   # Docusaurus build (project-specific script)
```

Activez `features.translateDocs` et définissez `docs[].docusaurusCatalogDir` lorsque vous traduisez à la fois les pages de documentation et l'interface du site (barre de navigation, pied de page, chaînes de thème). Exécutez `docusaurus write-translations` dans votre projet Docusaurus lorsque vous mettez à niveau `@docusaurus/*` ou modifiez les étiquettes de la barre de navigation/pied de page/thème — puis réexécutez `translate-docs` ou `sync` afin que le JSON de l'interface soit traduit dans chaque dossier de locale.

<a id="page-layout"></a>
## Disposition de la page

Le markdown et le MDX anglais se trouvent dans le dossier `docs/` de votre Docusaurus (par exemple `docs-site/docs/`). Les copies traduites sont écrites dans l'arborescence de contenu du plugin de chaque locale :

```text
docs-site/docs/getting-started.md
  →  docs-site/i18n/de/docusaurus-plugin-content-docs/current/getting-started.md
docs-site/docs/guide/quick-start.md
  →  docs-site/i18n/fr/docusaurus-plugin-content-docs/current/guide/quick-start.md
```

Configurez un bloc `docs[]` :

```json
{
  "contentPaths": ["docs-site/docs/"],
  "outputDir": "docs-site/i18n",
  "docusaurusCatalogDir": "docs-site/i18n/en",
  "addFrontmatter": true,
  "docsOutput": {
    "style": "docusaurus",
    "docsRoot": "docs-site/docs"
  }
}
```

Pointez `contentPaths` vers vos fichiers et répertoires `.md` / `.mdx` anglais. Définissez `docsRoot` sur le même dossier que Docusaurus utilise comme racine de contenu. Définissez `outputDir` sur le parent de chaque dossier de locale sous `i18n/`.

Connectez l'[internationalisation](https://docusaurus.io/docs/i18n/introduction) de Docusaurus : maintenez `targetLocales` dans `ai-i18n-tools.config.json` aligné avec le tableau `locales` dans `docusaurus.config.js`. Chaque `localeConfigs[locale].path` doit correspondre au nom du dossier sous `i18n/` (par exemple `path: "fr"` pour `i18n/fr/`).

<a id="shell-strings-write-translations"></a>
## Chaînes de l'interface (write-translations)

La barre de navigation, le pied de page, l'espace réservé à la recherche et les autres étiquettes de thème/plugin de Docusaurus ne sont pas extraits du markdown. Exécutez `docusaurus write-translations` dans votre projet Docusaurus pour générer des catalogues JSON sous le dossier de locale par défaut (généralement `i18n/en/`). Ensuite, pointez `docs[].docusaurusCatalogDir` vers ce dossier :

```json
{
  "features": {
    "translateDocs": true
  },
  "docs": [
    {
      "description": "Docusaurus pages + shell JSON",
      "contentPaths": ["docs-site/docs/"],
      "outputDir": "docs-site/i18n",
      "docusaurusCatalogDir": "docs-site/i18n/en",
      "docsOutput": {
        "style": "docusaurus",
        "docsRoot": "docs-site/docs"
      }
    }
  ]
}
```

Lorsque `docusaurusCatalogDir` est défini et `features.translateDocs` est activé, `translate-docs` traduit les deux :

- **Pages de documentation** — markdown/MDX de `contentPaths` vers `i18n/<locale>/docusaurus-plugin-content-docs/current/`
- **JSON de l'interface** — catalogues de la barre de navigation, du pied de page et du thème/plugin de `i18n/en/` vers les dossiers de locale frères

Ne placez pas le JSON de l'interface Docusaurus dans `json[]` ; utilisez plutôt `docs[].docusaurusCatalogDir` avec Documents.

<a id="framework-shell-translation"></a>
## Traduction de l'interface du framework

| Framework | Chaînes de l'interface / du thème | Pipeline |
|-----------|----------------------|----------|
| Docusaurus | Catalogue `write-translations` (`{ message, description }`) | Documents — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | Catalogue thème/nav/barre latérale | Documents — `docsOutput.vitepressThemeCatalog` + `translate-docs` |
| Nextra | Étiquettes de la barre latérale `_meta.ts` | Documents — auto lorsque `style: "nextra"` + `translate-docs` |
| Nextra | Dictionnaire de thème `.ts` | Documents — `docs[].nextraDictionaryPath` + `translate-docs` |
| Fumadocs | étiquettes de barre latérale `meta.json` | Documents — auto lorsque `style: "fumadocs"` + `translate-docs` |
| Fumadocs | catalogue de remplacements d'interface utilisateur | Documents — `docsOutput.fumadocsUiCatalog` + `translate-docs` |
| Astro Starlight | Chaînes d'interface utilisateur intégrées (nombreuses langues) ; pas de pipeline d'interface supplémentaire | Documents — `translate-docs` (pages uniquement) |

Ne mettez **pas** les chaînes de shell/thème du framework dans `json[]` — ce pipeline est destiné aux bundles de paramètres régionaux d'applications non liés. Voir [intégration VitePress](/guide/integrations/vitepress), [intégration Nextra](/guide/integrations/nextra) et [intégration Fumadocs](/guide/integrations/fumadocs) pour les autres modèles de framework.

<a id="example-project"></a>
## Exemple de projet

[examples/nextjs-app/docs-site](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/docs-site) — Sources anglaises à `docs/`, traductions validées sous `i18n/<locale>/docusaurus-plugin-content-docs/current/`, plus le JSON de l'interface traduit. Exécutez `pnpm start` sur le port 3040 pour le développement ; utilisez `pnpm run start:fr` (et similaire) pour prévisualiser une seule locale en mode développement.
