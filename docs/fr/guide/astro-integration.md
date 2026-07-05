<a id="astro-integration"></a>
# Intégration Astro

Utilisez ai-i18n-tools avec [Astro](https://astro.build/) dans deux configurations courantes : les sites de documentation **Astro Starlight** et les sites marketing ou d'applications **Astro simples**. Les deux utilisent des documents (`translate-docs`) pour le contenu des pages ; les sites Astro simples combinent souvent cela avec des chaînes d'interface utilisateur (`extract` / `translate-ui`) pour les chaînes `t()` dans le frontmatter et les données partagées.

Voir aussi [Chaînes d'interface utilisateur](/guide/ui-strings/astro-website#astro-website-plain-astro-not-starlight), [Documents](/guide/documents/) et les exemples exécutables ci-dessous.

<a id="astro-starlight"></a>
## Astro Starlight

Utilisez `init -t ui-starlight` et `docsOutput.style: "astro-starlight"` pour les sites de documentation [Astro Starlight](https://starlight.astro.build/). Le préréglage est un alias pour `doc-system` avec un `localeSubpath` vide — les pages traduites se trouvent sous `src/content/docs/<locale>/` à côté de l'arborescence source anglaise.

<a id="quick-start"></a>
### Démarrage rapide

```bash
npx ai-i18n-tools init -t ui-starlight
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm dev             # Starlight dev server (project-specific script)
```

<a id="page-layout"></a>
### Disposition de la page

Le markdown et le MDX anglais se trouvent à la racine du contenu de Starlight (généralement `src/content/docs/`). Les copies traduites sont écrites à côté de l'arborescence source :

```text
src/content/docs/quick-start.md     →  src/content/docs/de/quick-start.md
src/content/docs/guide/setup.mdx    →  src/content/docs/fr/guide/setup.mdx
```

Configurez un bloc `docs[]` :

```json
{
  "contentPaths": ["src/content/docs/"],
  "outputDir": "src/content/docs",
  "docsOutput": {
    "style": "astro-starlight",
    "docsRoot": "src/content/docs"
  }
}
```

Pointez `contentPaths` vers vos fichiers et répertoires `.md` / `.mdx` anglais. Définissez `docsRoot` sur le même dossier que Starlight utilise comme racine de contenu.

Les remplacements d'interface utilisateur de Starlight peuvent utiliser `src/content/i18n/en.json` avec `jsonPathTemplate` dans un bloc `docs[]` séparé si nécessaire — voir [Documents — initialiser pour la documentation](/guide/documents/#step-1-initialise-for-documentation).

<a id="example-project"></a>
### Exemple de projet

[examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) — Sources anglaises à `src/content/docs/`, traductions validées sous `src/content/docs/<locale>/`, locale RTL (`ar`), et traduction basée sur le glossaire. Exécutez `pnpm dev` sur le port 3050.

<a id="plain-astro-marketing-and-app-sites"></a>
## Astro simple (sites marketing et d'applications)

Pour les sites marketing ou d'applications Astro statiques (pas Starlight), combinez le [routage i18n intégré d'Astro](https://docs.astro.build/en/guides/internationalization/) avec ai-i18n-tools. L'implémentation de référence est [examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) : anglais à `/`, locales cibles à `/{locale}/`.

La plupart des équipes utilisent un **hybride** de deux pipelines sur la même page :

| Pipeline | À utiliser pour | Commandes | Sortie |
|----------|---------|----------|--------|
| **HTML des pages** | Titres, paragraphes, libellés de navigation, tableaux intégrés dans le corps du modèle | `translate-docs` | Un `src/pages/{locale}/index.astro` par localisation |
| **Chaînes d’interface (`t()`)** | Données frontmatter, libellés d’onglets, tableaux partagés | `extract` → `translate-ui` | `public/locales/{locale}.json` (texte anglais en tant que clé) |

<a id="quick-start-1"></a>
### Démarrage rapide

```bash
npx ai-i18n-tools init -t ui-astro-website
# enable features.translateDocs and add a docs[] block for page HTML (see below)
pnpm run i18n:sync
pnpm dev
```

Échafaudez l'extraction de l'interface utilisateur avec `init -t ui-astro-website`, puis fusionnez dans un bloc `docs[]` lorsque vous traduisez également le HTML de la page :

```json
{
  "features": {
    "translateUIStrings": true,
    "translateDocs": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "public/locales/strings.json",
    "flatOutputDir": "public/locales/"
  },
  "docs": [{
    "contentPaths": ["src/pages/index.astro"],
    "outputDir": "src/pages",
    "docsOutput": {
      "style": "astro-starlight",
      "docsRoot": "src/pages"
    },
    "addFrontmatter": false
  }]
}
```

Maintenez trois listes alignées lorsque vous ajoutez ou supprimez une langue : `targetLocales` dans `ai-i18n-tools.config.json`, `i18n.locales` dans `astro.config.mjs` (Astro utilise des codes de route en **minuscules** tels que `pt-br`), et `ui-languages.json` (via `generate-ui-languages`). Les **noms de fichiers** du bundle plat utilisent la casse de la configuration (`pt-BR.json`) ; mappez la route `pt-br` d'Astro à ce fichier via votre champ `code` de manifeste.

Résolvez `t('…')` au **moment de la construction** en recherchant le littéral source anglais comme clé — voir `examples/astro-website/src/i18n/t.ts`. Vous n'avez pas besoin de `ai-i18n-tools/runtime` ou d'i18next pour un site statique, sauf si vous ajoutez des îles clientes qui changent de langue après le chargement.

<a id="example-project-1"></a>
### Exemple de projet

[examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) — page de destination hybride avec HTML via `translate-docs` et étiquettes d'onglets de capture d'écran via `t()` + `translate-ui`.

<a id="example-projects"></a>
## Exemples de projets

| Projet | Cas d'utilisation | Port |
|---------|----------|------|
| [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) | Documentation Starlight | 3050 |
| [examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) | Site marketing Astro simple (hybride HTML + `t()`) | (voir README) |

Comparez [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) avec [examples/nextjs-app/docs-site](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/docs-site) — contenu de tutoriel similaire, style de sortie Docusaurus au lieu de Starlight.
