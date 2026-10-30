<a id="fumadocs-integration"></a>
# Intégration de Fumadocs

Utilisez `init -t ui-fumadocs` et `docsOutput.style: "fumadocs"` pour les sites de documentation [Fumadocs](https://www.fumadocs.dev/) 4 sur Next.js App Router. Le préréglage est un alias pour `doc-system` avec un `localeSubpath` vide et des codes de paramètres régionaux BCP-47 ou courts conservés (`localePathLowercase` est par défaut `false`).

Voir aussi [Documents](/fr/guide/documents/) et la démo exécutable [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/) (analyseur de points, port 3080).

<a id="quick-start"></a>
## Démarrage rapide

```bash
ai-i18n-tools init -t ui-fumadocs -P groq
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

<a id="enable-i18n-in-an-existing-site"></a>
### Activer l'i18n dans un site existant

Une application Fumadocs en anglais uniquement nécessite une route de locale et `defineI18n` avant que `translate-docs` puisse écrire des fichiers frères. La configuration initiale utilise l'invite sur [Ajouter l'i18n à un site web ou un site de documentation](/fr/guide/add-i18n-to-website#run-the-agent-prompt). L'[invite de l'agent](#agent-prompt) sur cette page est le suivi qui connecte le catalogue d'interface utilisateur. Liste de contrôle :

- `defineI18n` dans `lib/i18n.ts` avec `languages`, `defaultLanguage` et `parser: "dot"` ou `"dir"`.
- Routes `app/[lang]/` et `createI18nMiddleware` depuis `proxy.ts` (le fichier de l'exemple).
- `i18n.translations()` dans `lib/layout.shared.ts`, passé à `i18nProvider`.
- MDX anglais à la racine de la collection (point) ou sous `content/docs/en/` (répertoire).
- `targetLocales` égal à `languages` moins la langue par défaut, puis `sync`.

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

Fumadocs utilise des fichiers JSON `meta.json` pour la structure et les titres de la barre latérale. Lorsque `docsOutput.style` est `"fumadocs"`, `translate-docs` collecte `meta.json` sous `docsRoot` (ou `docs[].fumadocsMetaGlob`), traduit les valeurs de chaîne pour les clés listées dans `docs[].fumadocsMetaTranslatableKeys` (par défaut : `title`, `description`), et écrit les sorties de locale :

| Analyseur | Locale source | Sortie |
|--------|----------------|--------|
| **dot** | `content/docs/**/meta.json` | `content/docs/**/meta.{locale}.json` |
| **dir** | `content/docs/en/**/meta.json` | `content/docs/{locale}/**/meta.json` |

**Ne traduisez pas** les tableaux de slugs `pages`, `root`, `icon`, `defaultOpen` ou d'autres clés structurelles — seulement les étiquettes lisibles par l'homme.

<a id="ui-catalog"></a>
## Catalogue d'interface utilisateur

L'habillage de la mise en page de Fumadocs (espace réservé de recherche, noms d'affichage de locale, et autres remplacements `defineTranslations` / `i18n.translations()` dans `lib/layout.shared.ts`) n'est pas extrait du markdown. Configurez `docsOutput.fumadocsUiCatalog` afin que `translate-docs` amorce le catalogue de la locale source à partir de `sourcePath` et traduise le JSON par locale :

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

- `catalogPath` — JSON plat anglais. Le bootstrap lit uniquement l'objet `en` de `.add({ … })` dans `sourcePath`. Les littéraux de chaîne dans cet objet deviennent des clés de catalogue (`displayName`, `Search(search trigger)`). `.add()` n'accepte que les clés enregistrées par les préréglages de l'interface utilisateur de Fumadocs, donc un titre de navigation tel que `site.title` ne peut pas y résider. L'exemple conserve `site.title` dans le JSON et lit `catalog["site.title"]` pour `nav.title`. Les clés déjà présentes dans le fichier mais absentes de l'objet `en` restent : la fusion est `{ ...existing, ...extracted }`. Réexécutez `sync` lorsque les littéraux anglais changent.
- `outputPathTemplate` (facultatif) — sorties par locale ; par défaut : `ui.{locale}.json` à côté de `catalogPath`.

Une clé traduite ne fait rien tant que l'application ne la lit pas. `i18n.translations().get(lang)` ne renvoie que les clés enregistrées avec `.extend()` (les préréglages de l'interface utilisateur de Fumadocs). Étendez le catalogue de locales dans `.add()` afin que ces clés s'appliquent, et placez `displayName` natif **après** l'extension pour qu'une traduction du nom anglais ne le remplace pas :

```ts
"pt-BR": {
  ...loadUiCatalog("pt-BR"),
  displayName: "Português (Brasil)",
},
```

`site.title` n'est pas une clé d'interface utilisateur Fumadocs. L'exemple le lit depuis le catalogue pour `nav.title`. Une étiquette de recherche qui n'existe que dans `ui.pt-BR.json` reste sur le préréglage intégré jusqu'à ce que cette extension (ou une autre lecture) l'utilise.

Voir [examples/fumadocs-docs/lib/layout.shared.ts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/fumadocs-docs/lib/layout.shared.ts).

Les paramètres régionaux standard peuvent être couverts par les préréglages `@fumadocs/language/*` sans coût LLM ; le catalogue traduit les **remplacements de projet** uniquement dans le bloc anglais.

<a id="agent-prompt"></a>
## Invite de l'agent

Copiez ceci lorsqu'un site Fumadocs uniquement en anglais doit acquérir des locales. Cela connecte le routage et le catalogue de l'interface utilisateur. Cela ne traduit pas les chaînes de caractères.

<details class="agent-prompt">
<summary>Invite du catalogue d'interface utilisateur</summary>

````markdown
# Enable Fumadocs i18n and the UI catalog

## Context

ai-i18n-tools translates Fumadocs MDX, `meta.json` titles, and the English block
of `i18n.translations().add({ en: { … } })` via `translate-docs` and
`docsOutput.fumadocsUiCatalog`. The literal in that `en` object is the source
string. Locale JSON takes effect only for keys the app reads: either a catalog
spread into `.add()` for registered UI keys, or a direct read such as
`catalog["site.title"]` for the nav title. Do not translate any string.

Reference:
https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs

## Scope

Edit `lib/i18n.ts`, `lib/layout.shared.ts`, `proxy.ts`, `app/[lang]/` routes,
and `ai-i18n-tools.config.json`. Skip URLs, slugs, and native language names
(`displayName` on each locale entry).

## Call shape

- `defineI18n({ languages, defaultLanguage, parser })`. Use `"dot"` unless the
  project already keeps English under a locale folder (`"dir"`).
- `export default createI18nMiddleware(i18n)` from `proxy.ts`.
- Move pages under `app/[lang]/…` and pass `lang` into `baseOptions` and
  `i18nProvider(translations, lang)`.
- In `lib/layout.shared.ts`, keep English UI overrides as string literals inside
  `.add({ en: { … } })`. For each other locale, spread `loadUiCatalog(locale)`
  and then set `displayName` to the native name.
- Config: `features.translateDocs`, `docsOutput.style: "fumadocs"`,
  `fumadocsParser` matching `defineI18n`, and `fumadocsUiCatalog.sourcePath`
  pointing at `lib/layout.shared.ts`. `targetLocales` must equal `languages`
  except the default language, character for character.

## Order

1. Routing and `defineI18n`.
2. English literals in the `en` block, and the catalog spread for other locales.
3. Ask the user to run `sync`. Do not hand-write `ui.<locale>.json` or
   translated MDX.

## Do not

- Do not translate, rename, or reword the English literals.
- Do not put native language names only in the `en` block (they would be
  extracted and translated).
- Do not hand-edit locale JSON, `meta.<locale>.json`, or locale MDX.
- Do not use `json[]` for this catalog.

## Verify

- `pnpm build` passes.
- The default locale still shows the English overrides.
- After `sync`, one other locale shows the translated search trigger and nav
  title, and `displayName` in the language menu is still the native name.

## Report back

List files changed, each key you added to the `en` block, each key you left
unread (and so unused) with a one-line reason, and whether the parser is `dot`
or `dir`.
````

</details>

**N'utilisez pas** `json[]` pour les chaînes d'interface utilisateur Fumadocs — ce pipeline est destiné aux bundles de paramètres régionaux d'applications non liés.

<a id="link-conventions"></a>
## Conventions de lien

Fumadocs sert des routes préfixées par les paramètres régionaux via le middleware Next.js (`/docs/getting-started`, `/pt/docs/getting-started`). **Les liens dans la page doivent rester neutres par rapport aux paramètres régionaux** (`/docs/getting-started`) afin que le préfixe des paramètres régionaux actifs soit appliqué automatiquement.

Activez le normaliseur intégré afin que `translate-docs` corrige automatiquement les liens dans chaque fichier traduit :

```json
"docsOutput": {
  "style": "fumadocs",
  "docsRoot": "content/docs",
  "rewriteFumadocsLinks": true
}
```

`rewriteFumadocsLinks` est activé par défaut lorsque `style` est `"fumadocs"`.

| Auteur dans la locale source | Après normalisation |
|--------------------------|------------------|
| `[Guide](content/docs/guide/getting-started.mdx)` | `[Guide](/docs/guide/getting-started)` |
| `[Home](content/docs/index.mdx)` | `[Home](/docs)` |
| `[Guide](/fr/guide/getting-started.mdx)` | `[Guide](/docs/guide/getting-started)` |
| `[Demo](https://github.com/org/repo)` | inchangé (URL complète) |

**Règles de rédaction**

- Liens de documentation inter-pages : utilisez des **routes de site neutres à la locale** (`/docs/…`) dans le MDX anglais, ou des chemins `content/docs/…` / `.mdx` relatifs et laissez le normaliseur les réécrire pendant `sync`.
- Fichiers du dépôt en dehors de l'arborescence de contenu : utilisez des **URL complètes**.
- Ne modifiez **pas** manuellement les liens dans les copies suffixées par la locale (`*.pt.mdx`) ou les arborescences `content/{locale}/` — régénérez avec `sync` / `translate-docs`.

Voir aussi [Documents — réécriture de liens](/fr/guide/documents/link-rewriting) et [Configuration — `docsOutput`](/fr/reference/configuration#docsoutput).

<a id="locale-codes"></a>
## Codes de paramètres régionaux

Maintenez `targetLocales` dans `ai-i18n-tools.config.json` aligné avec `defineI18n().languages` dans votre application Fumadocs **exactement**. L'exemple de point utilise des codes courts (`pt`, `zh`) ; les configurations de répertoire peuvent utiliser des dossiers BCP-47 (`pt-BR`, `zh-Hans`). Il n'y a pas de normalisation forcée — les codes non concordants produisent des chemins de sortie incorrects ou des pages manquantes.

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
