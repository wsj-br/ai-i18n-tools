<a id="fumadocs-integration"></a>
# Intégration de Fumadocs

Utilisez `init -t ui-fumadocs` et `docsOutput.style: "fumadocs"` pour les sites de documentation [Fumadocs](https://www.fumadocs.dev/) 4 sur Next.js App Router. Le préréglage est un alias pour `doc-system` avec un `localeSubpath` vide et des codes de paramètres régionaux BCP-47 ou courts conservés (`localePathLowercase` est par défaut `false`).

Voir aussi [Documents](/fr/guide/documents/) et la démo exécutable [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/) (analyseur de points, port 3080).

<a id="quick-start"></a>
## Démarrage rapide

```bash
npx ai-i18n-tools init -t ui-fumadocs
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm run build       # Next.js build (project-specific script)
```

Activez `features.translateDocs` lorsque vous traduisez le contenu des pages, les étiquettes de la barre latérale `meta.json` et les remplacements de l'interface utilisateur de Fumadocs en une seule exécution `sync`.

<a id="page-layout"></a>
## Disposition de la page

Fumadocs prend en charge deux mises en page de contenu i18n via `docsOutput.fumadocsParser`. L'analyseur **dot** est celui par défaut (Fumadocs intégré et sites de production tels que [SWR](https://github.com/vercel/swr-site)).

<a id="dot-parser-default"></a>
### Analyseur de points (par défaut)

Le MDX anglais se trouve à la racine de la collection. Les copies traduites utilisent un suffixe de paramètres régionaux dans le même répertoire :

```text
content/docs/index.mdx                    →  content/docs/index.pt.mdx
content/docs/guide/getting-started.mdx    →  content/docs/guide/getting-started.zh.mdx
```

```json
{
  "contentPaths": ["content/docs"],
  "outputDir": "content/docs",
  "docsOutput": {
    "style": "fumadocs",
    "docsRoot": "content/docs",
    "fumadocsParser": "dot",
    "rewriteFumadocsLinks": true
  }
}
```

Alignez `targetLocales` avec `defineI18n().languages` dans `lib/i18n.ts` exactement (l'exemple utilise les codes courts `pt` et `zh`).

<a id="dir-parser-nextra-style"></a>
### Analyseur de répertoires (style Nextra)

Pour les équipes habituées aux dossiers de paramètres régionaux (`content/docs/en/` → `content/docs/pt-BR/`), définissez `fumadocsParser` sur `"dir"` :

```text
content/docs/en/index.mdx           →  content/docs/pt-BR/index.mdx
content/docs/en/guide/foo.mdx       →  content/docs/zh-Hans/guide/foo.mdx
```

```json
{
  "contentPaths": ["content/docs/en"],
  "outputDir": "content/docs",
  "docsOutput": {
    "style": "fumadocs",
    "docsRoot": "content/docs/en",
    "fumadocsParser": "dir",
    "rewriteFumadocsLinks": true
  }
}
```

Voir `ai-i18n-tools.config.dir.example.json` dans [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/) pour une configuration de répertoire par copier-coller. Le modèle mental correspond à l'[intégration Nextra](/fr/guide/integrations/nextra#page-layout).

<a id="sidebar-metajson"></a>
## Barre latérale (`meta.json`)

Fumadocs utilise des fichiers JSON `meta.json` pour la structure et les titres de la barre latérale. Lorsque `docsOutput.style` est `"fumadocs"`, **`translate-docs`** collecte `meta.json` sous `docsRoot` (ou `docs[].fumadocsMetaGlob`), traduit les valeurs de chaîne pour les clés listées dans `docs[].fumadocsMetaTranslatableKeys` (par défaut : `title`, `description`) et écrit les sorties de paramètres régionaux :

| Analyseur | Source anglaise | Sortie |
|--------|----------------|--------|
| **dot** | `content/docs/**/meta.json` | `content/docs/**/meta.{locale}.json` |
| **dir** | `content/docs/en/**/meta.json` | `content/docs/{locale}/**/meta.json` |

**Ne traduisez pas** les tableaux de slugs `pages`, `root`, `icon`, `defaultOpen` ou d'autres clés structurelles — seulement les étiquettes lisibles par l'homme.

<a id="ui-catalog"></a>
## Catalogue d'interface utilisateur

Le chrome de la mise en page de Fumadocs (espace réservé de recherche, noms d'affichage des paramètres régionaux et autres remplacements `defineTranslations` / `i18n.translations()` dans `lib/layout.shared.ts`) n'est pas extrait du markdown. Configurez **`docsOutput.fumadocsUiCatalog`** de sorte que **`translate-docs`** amorce le catalogue anglais à partir de `sourcePath` et traduise le JSON par paramètre régional :

```json
{
  "features": {
    "translateDocs": true
  },
  "docs": [
    {
      "contentPaths": ["content/docs"],
      "outputDir": "content/docs",
      "docsOutput": {
        "style": "fumadocs",
        "docsRoot": "content/docs",
        "fumadocsParser": "dot",
        "fumadocsUiCatalog": {
          "sourcePath": "lib/layout.shared.ts",
          "catalogPath": "lib/i18n/ui.en.json"
        }
      }
    }
  ]
}
```

- **`catalogPath`** — JSON plat anglais généré (sortie d'amorçage). Réexécutez `sync` lorsque les remplacements anglais dans `layout.shared.ts` changent.
- **`outputPathTemplate`** (facultatif) — sorties par paramètre régional ; par défaut : `ui.{locale}.json` à côté de `catalogPath`.

Chargez le JSON par paramètre régional dans `layout.shared.ts` via `loadUiCatalog(locale)` et fusionnez-le avec `i18nProvider(translations, lang)` dans votre mise en page racine. Voir [examples/fumadocs-docs/lib/layout.shared.ts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/fumadocs-docs/lib/layout.shared.ts).

Les paramètres régionaux standard peuvent être couverts par les préréglages `@fumadocs/language/*` sans coût LLM ; le catalogue traduit les **remplacements de projet** uniquement dans le bloc anglais.

**N'utilisez pas** `json[]` pour les chaînes d'interface utilisateur Fumadocs — ce pipeline est destiné aux bundles de paramètres régionaux d'applications non liés.

<a id="framework-shell-translation"></a>
## Traduction du shell du framework

| Framework | Chaînes de shell / thème | Pipeline |
|-----------|----------------------|----------|
| Docusaurus | catalogue `write-translations` | Documents — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | Catalogue Thème/nav/barre latérale | Documents — `docsOutput.vitepressThemeCatalog` + `translate-docs` |
| Nextra | Étiquettes de barre latérale `_meta.ts` | Documents — auto quand `style: "nextra"` + `translate-docs` |
| Nextra | Dictionnaire de thème `.ts` | Documents — `docs[].nextraDictionaryPath` + `translate-docs` |
| Fumadocs | Étiquettes de barre latérale `meta.json` | Documents — auto quand `style: "fumadocs"` + `translate-docs` |
| Fumadocs | Catalogue de surcharges d'interface utilisateur | Documents — `docsOutput.fumadocsUiCatalog` + `translate-docs` |
| Astro Starlight | Chaînes d'interface utilisateur intégrées (nombreuses locales) ; pas de pipeline de shell supplémentaire | Documents — `translate-docs` (pages uniquement) |

Ne mettez **pas** les chaînes de l'interface/thème du framework dans `json[]` — ce pipeline est destiné aux bundles de locales d'applications non liés. Voir [intégration Docusaurus](/fr/guide/integrations/docusaurus), [intégration VitePress](/fr/guide/integrations/vitepress) et [intégration Nextra](/fr/guide/integrations/nextra) pour les autres modèles de framework.

<a id="link-conventions"></a>
## Conventions de lien

Fumadocs sert des routes préfixées par les paramètres régionaux via le middleware Next.js (`/docs/getting-started`, `/pt/docs/getting-started`). **Les liens dans la page doivent rester neutres par rapport aux paramètres régionaux** (`/docs/getting-started`) afin que le préfixe des paramètres régionaux actifs soit appliqué automatiquement.

Activez le normaliseur intégré pour que `translate-docs` corrige automatiquement les liens dans chaque fichier traduit :

```json
"docsOutput": {
  "style": "fumadocs",
  "docsRoot": "content/docs",
  "rewriteFumadocsLinks": true
}
```

`rewriteFumadocsLinks` est activé par défaut lorsque `style` est `"fumadocs"`.

| Auteur dans la source anglaise | Après le normalisateur |
|--------------------------|------------------|
| `[Guide](content/docs/guide/getting-started.mdx)` | `[Guide](/docs/guide/getting-started)` |
| `[Home](content/docs/index.mdx)` | `[Home](/docs)` |
| `[Guide](/fr/guide/getting-started.mdx)` | `[Guide](/docs/guide/getting-started)` |
| `[Demo](https://github.com/org/repo)` | inchangé (URL complète) |

**Règles de rédaction**

- Liens de documentation inter-pages : utilisez des **routes de site neutres par rapport aux paramètres régionaux** (`/docs/…`) dans le MDX anglais, ou des chemins `content/docs/…` / `.mdx` relatifs et laissez le normalisateur les réécrire pendant `sync`.
- Fichiers de dépôt en dehors de l'arborescence de contenu : utilisez des **URL complètes**.
- Ne modifiez **pas** manuellement les liens dans les copies suffixées par les paramètres régionaux (`*.pt.mdx`) ou les arborescences `content/{locale}/` — régénérez avec `sync` / `translate-docs`.

Voir aussi [Documents — réécriture de liens](/fr/guide/documents/link-rewriting) et [Configuration — `docsOutput`](/fr/reference/configuration#docsoutput).

<a id="locale-codes"></a>
## Codes de paramètres régionaux

Gardez `targetLocales` dans `ai-i18n-tools.config.json` aligné avec `defineI18n().languages` dans votre application Fumadocs **exactement**. L'exemple de point utilise des codes courts (`pt`, `zh`) ; les configurations de répertoire peuvent utiliser des dossiers BCP-47 (`pt-BR`, `zh-Hans`). Il n'y a pas de normalisation forcée — des codes non concordants produisent des chemins de sortie incorrects ou des pages manquantes.

<a id="multiple-collections"></a>
## Collections multiples

Les projets Fumadocs peuvent définir plusieurs blocs `defineDocs` dans `source.config.ts` (docs, blog, exemples). Ajoutez un bloc `docs[]` par collection que vous traduisez, chacun avec ses propres `contentPaths`, `outputDir` et `docsRoot`.

<a id="example-project"></a>
## Exemple de projet

[examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/) — MDX anglais à `content/docs/`, pages avec suffixe de point `pt` et `zh` validées, `meta.json` et `lib/i18n/ui.{locale}.json`. Exécutez `pnpm run dev` sur le port **3080**.

<a id="cross-references"></a>
## Références croisées

- [Configuration — `docsOutput`](/fr/reference/configuration#docsoutput)
- [Dispositions de sortie](/fr/guide/documents/output-layouts)
- [Intégration Docusaurus](/fr/guide/integrations/docusaurus)
- [Intégration Nextra](/fr/guide/integrations/nextra) (modèle mental de l'analyseur de répertoires)
- [Intégration VitePress](/fr/guide/integrations/vitepress) (modèle de démarrage du catalogue d'interface utilisateur)
