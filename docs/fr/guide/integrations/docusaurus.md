<a id="docusaurus-integration"></a>
# Intégration Docusaurus

Utilisez `init -t ui-docusaurus` et `docsOutput.style: "docusaurus"` pour les sites de documentation [Docusaurus](https://docusaurus.io/). Le préréglage génère un bloc `docs[]` avec `docusaurusCatalogDir` afin que `translate-docs` puisse traduire à la fois le markdown de la page et le JSON de l'interface Docusaurus en une seule commande.

Voir aussi [Documents](/fr/guide/documents/), la démo exécutable [examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs), et [examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app) pour une application Next.js combinée avec des documents Docusaurus imbriqués, un fichier README plat et des ressources SVG.

<a id="quick-start"></a>
## Démarrage rapide

```bash
ai-i18n-tools init -t ui-docusaurus -P openai
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths, docusaurusCatalogDir)
pnpm run i18n:sync   # or: ai-i18n-tools sync
cd docs-site && pnpm build   # or: cd examples/docusaurus-docs && pnpm build
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

Configurez un bloc `docs[]` :

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

Pointez `contentPaths` vers les fichiers et répertoires `.md` / `.mdx` écrits en `sourceLocale`. Cette langue peut être n'importe quelle langue. Définissez `docsRoot` sur le même dossier que celui que Docusaurus utilise comme racine de contenu. Définissez `outputDir` sur le parent de chaque dossier de locale sous `i18n/`.

Connectez l'[internationalisation](https://docusaurus.io/docs/i18n/introduction) de Docusaurus : maintenez `targetLocales` dans `ai-i18n-tools.config.json` aligné avec le tableau `locales` dans `docusaurus.config.js`. Chaque `localeConfigs[locale].path` doit correspondre au nom du dossier sous `i18n/` (par exemple `path: "fr"` pour `i18n/fr/`).

<a id="enable-i18n-in-an-existing-site"></a>
### Activer l'i18n dans un site existant

La configuration initiale s'appuie sur l'invite de [Ajouter l'i18n à un site web ou un site de documentation](/fr/guide/add-i18n-to-website#run-the-agent-prompt). La liste de contrôle ci-dessous correspond au même travail effectué manuellement.

- Ajoutez le bloc `i18n` dans `docusaurus.config.js` : `defaultLocale`, `locales` et `localeConfigs[locale].path` lorsque le chemin de l'URL doit différer du code de locale.
- Exécutez `docusaurus write-translations` afin que `i18n/<defaultLocale>/` existe, puis pointez `docusaurusCatalogDir` vers ce dossier et exécutez `sync`.
- Le React personnalisé dans `src/pages` et `src/components` n'est pas du markdown. Marquez le texte destiné à l'utilisateur avec `<Translate>` ou `translate()` de `@docusaurus/Translate` afin que `write-translations` puisse le collecter dans `code.json`. Le message doit être une chaîne statique. `write-translations` écrit `i18n/<locale>/code.json`; avec `docusaurusCatalogDir` défini, `translate-docs` traduit ce JSON avec le reste du catalogue shell. ai-i18n-tools ne scanne pas ces arborescences JSX pour `t()`.

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

<a id="example-project"></a>
## Exemple de projet

[examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs) — sources anglaises à `docs/`, traductions validées sous `i18n/<locale>/docusaurus-plugin-content-docs/current/`, plus JSON de shell traduit. Exécutez `pnpm start` sur le port 3100 (build + serve) pour que le menu déroulant des langues fonctionne ; utilisez `pnpm dev` pour le rechargement à chaud en anglais uniquement.

Pour les chaînes d'interface utilisateur, la traduction SVG et un fichier README plat dans la même disposition de dépôt, voir [examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app) (`docs-site/` imbriqué sur le port 3040).
