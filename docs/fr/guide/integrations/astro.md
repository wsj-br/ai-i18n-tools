<a id="astro-integration"></a>
# Intégration Astro

Utilisez ai-i18n-tools avec [Astro](https://astro.build/) dans deux configurations courantes : les sites de documentation **Astro Starlight** et les sites marketing ou d'applications **Astro simples**. Les deux utilisent des documents (`translate-docs`) pour le contenu des pages ; les sites Astro simples combinent souvent cela avec des chaînes d'interface utilisateur (`extract` / `translate-ui`) pour les chaînes `t()` dans le frontmatter et les données partagées.

Voir aussi [Chaînes d'interface utilisateur](/fr/guide/ui-strings/astro-website), [Documents](/fr/guide/documents/) et les exemples exécutables ci-dessous.

<a id="astro-starlight"></a>
## Astro Starlight

Utilisez `init -t ui-starlight` et `docsOutput.style: "astro-starlight"` pour les sites de documentation [Astro Starlight](https://starlight.astro.build/). Le préréglage est un alias pour `doc-system` avec un `localeSubpath` vide — les pages traduites se retrouvent sous `src/content/docs/<locale>/` à côté de l'arborescence de la locale source. `sourceLocale` peut être n'importe quelle langue.

<a id="quick-start"></a>
### Démarrage rapide

```bash
ai-i18n-tools init -t ui-starlight -P cheaperinference
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

Configurez un bloc `docs[]` :

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

Pointez `contentPaths` vers les fichiers et répertoires `.md` / `.mdx` écrits en `sourceLocale`. Cette langue peut être n'importe quelle langue. Définissez `docsRoot` sur le même dossier que Starlight utilise comme racine de contenu.

Les remplacements d'interface utilisateur de Starlight peuvent utiliser `src/content/i18n/en.json` avec `jsonPathTemplate` dans un bloc `docs[]` séparé si nécessaire — voir [Documents — initialiser pour la documentation](/fr/guide/documents/#step-1-initialise-for-documentation).

Starlight fournit des chaînes d'interface utilisateur intégrées pour de nombreuses langues (libellés de navigation, espace réservé de recherche, table des matières, etc.). Il n'y a pas de pipeline shell/thème distinct à configurer — utilisez `translate-docs` uniquement pour le contenu des pages. Pour les autres frameworks, consultez [Traduction du shell du framework](/fr/guide/integrations/#framework-shell-translation).

Les `label` de la barre latérale explicites, le `title` du site et les `social[].label` dans `astro.config.mjs` sont des littéraux anglais que cet outil ne traduit pas. Préférez les entrées `slug` afin que l'étiquette provienne du frontmatter traduit de la page (`title`). Un groupe ou un lien externe qui nécessite sa propre formulation utilise la carte `translations` par locale de Starlight (`label` pour la locale par défaut, `translations['pt-BR']` pour les autres). `social[].label` n'a pas de champ de traductions dans le schéma Starlight actuel ; il reste tel quel. Voir [Barre latérale de Starlight](https://starlight.astro.build/guides/sidebar/#internationalization) et [examples/astro-docs/astro.config.mjs](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/astro-docs/astro.config.mjs), qui utilise des entrées `slug`.

<a id="enable-i18n-in-an-existing-site"></a>
### Activer l'i18n dans un site existant

- `locales` dans la configuration Starlight, y compris une entrée `root` lorsque l'anglais ne doit pas être préfixé (`label` et `lang` requis).
- `defaultLocale: 'root'` lorsque la langue par défaut est cette locale racine. N'omettez `defaultLocale` que si la valeur par défaut de Starlight correspond déjà.
- Les pages anglaises restent dans `src/content/docs/` ; `translate-docs` écrit `src/content/docs/<locale>/`.
- `targetLocales` aligné avec les clés de locale non-racine (attention à la casse : les clés de répertoire Starlight sont souvent en minuscules, comme `pt-br`).

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
| **Chaînes d'interface utilisateur (`t()`)** | Données de frontmatter, étiquettes d'onglets, tableaux partagés | `extract` → `translate-ui` | `public/locales/{locale}.json` (chaîne de la langue source comme clé) |

<a id="quick-start-1"></a>
### Démarrage rapide

```bash
ai-i18n-tools init -t ui-astro-website -P ollama
# enable features.translateDocs and add a docs[] block for page HTML (see below)
pnpm run i18n:sync
pnpm dev
```

Générer l'extraction de l'interface utilisateur avec `init -t ui-astro-website -P ollama`, puis fusionner dans un bloc `docs[]` lorsque vous traduisez également le HTML de la page :

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

Résolvez `t('…')` au **moment de la construction** en recherchant le littéral de la langue source comme clé — voir `examples/astro-website/src/i18n/t.ts`. `sourceLocale` peut être n'importe quelle langue. L'exemple utilise l'anglais. Vous n'avez pas besoin de `ai-i18n-tools/runtime` ou d'i18next pour un site statique, sauf si vous ajoutez des îles clientes qui changent de langue après le chargement.

<a id="example-project-1"></a>
### Exemple de projet

[examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) — page de destination hybride avec HTML via `translate-docs` et étiquettes d'onglets de capture d'écran via `t()` + `translate-ui`.

<a id="example-projects"></a>
## Exemples de projets

| Projet | Cas d'utilisation | Port |
|---------|----------|------|
| [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) | Documentation Starlight | 3050 |
| [examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) | Site marketing Astro simple (hybride HTML + `t()`) | (voir README) |

Compare [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) avec [examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs) — contenu de tutoriel similaire, style de sortie Docusaurus au lieu de Starlight.
