<a id="output-layouts"></a>
# Dispositions de sortie

`docsOutput.style` contrôle l'emplacement où les fichiers markdown traduits sont écrits. Utilisez les valeurs de chaîne exactes ci-dessous dans `docs[].docsOutput.style` (les alias sont des dispositions prédéfinies, pas des moteurs distincts).

`docsOutput.style = "nested"` (par défaut lorsqu'omis) — reflète l'arborescence source sous `{outputDir}/{locale}/` (par exemple `docs/guide.md` → `i18n/de/docs/guide.md`).

`docsOutput.style = "doc-system"` — arborescence de documentation préfixée par la locale, destinée aux sites de documentation statique. Les fichiers situés sous `docsRoot` sont écrits dans `{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}`. Les chemins situés en dehors de `docsRoot` reviennent à la disposition imbriquée. Définissez `docs[].docsOutput.docsRoot` sur la racine de vos sources en anglais (par exemple `"docs"` ou `"src/content/docs"`). Lorsque `docsOutput.style = "doc-system"`, vous devez définir `localeSubpath` explicitement (utilisez un alias ci-dessous pour les configurations prédéfinies).

**Alias** (moteur de disposition identique, valeur prédéfinie pour `localeSubpath`) :

- `docsOutput.style = "docusaurus"` — `localeSubpath` est par défaut `docusaurus-plugin-content-docs/current` (disposition du plugin i18n de Docusaurus).
- `docsOutput.style = "astro-starlight"` — `localeSubpath` est par défaut `""` (pages traduites directement sous `{outputDir}/{locale}/`, correspondant à [Starlight](https://starlight.astro.build/guides/i18n/) lorsque l'anglais se trouve à la racine du contenu et que `outputDir` est égal à `docsRoot`).
- `docsOutput.style = "vitepress"` — même disposition que `doc-system` avec `localeSubpath` vide ; les noms de dossiers de paramètres régionaux BCP-47 sont conservés (`localePathLowercase` est par défaut `false`). Voir [intégration VitePress](/guide/integrations/vitepress).
- `docsOutput.style = "nextra"` — même disposition que `doc-system` avec `localeSubpath` vide ; la source anglaise se trouve sous un dossier de paramètres régionaux (par exemple `content/en/`). Voir [intégration Nextra](/guide/integrations/nextra).
- `docsOutput.style = "fumadocs"` — même disposition que `doc-system` avec `localeSubpath` vide ; la source anglaise utilise des fichiers avec suffixe de point (par défaut) ou un dossier de paramètres régionaux lorsque `fumadocsParser` est `"dir"`. Voir [intégration Fumadocs](/guide/integrations/fumadocs).

Préréglage Docusaurus (pages principales de documentation) :

```text
docs/guide.md  →  i18n/de/docusaurus-plugin-content-docs/current/guide.md
```

Préréglage Starlight (forme de bloc identique, chemins différents) :

```text
src/content/docs/guide.md  →  src/content/docs/de/guide.md
```

Préréglage VitePress (anglais à la racine du contenu, dossiers de locale à côté de la source) :

```text
docs/guide/quick-start.md  →  docs/de/guide/quick-start.md
```

Préréglage Nextra (anglais sous un dossier de paramètres régionaux, dossiers de paramètres régionaux frères pour les cibles) :

```text
content/en/guide/getting-started.mdx  →  content/pt-BR/guide/getting-started.mdx
```

Préréglage Fumadocs — analyseur de points (par défaut ; suffixe de locale à côté de la source anglaise) :

```text
content/docs/guide/getting-started.mdx  →  content/docs/guide/getting-started.pt.mdx
```

Préréglage Fumadocs — analyseur de répertoires (dossiers de locale de style Nextra) :

```text
content/docs/en/guide/getting-started.mdx  →  content/docs/pt-BR/guide/getting-started.mdx
```

Étiquettes JSON facultatives — chaînes d'interface Docusaurus provenant de `docusaurusCatalogDir` (pas le contenu du corps MDX) :

```text
i18n/en/sidebar.json  →  i18n/de/sidebar.json
```

Starlight fournit des chaînes d'interface pour de nombreuses locales ; les remplacements personnalisés facultatifs utilisent `src/content/i18n/en.json` avec `jsonPathTemplate: "{outputDir}/{locale}.json"` dans un bloc `docs[]` séparé si nécessaire.

Les chaînes de navigation/barre latérale/pied de page de VitePress ne sont pas en markdown — configurez `docsOutput.vitepressThemeCatalog` et traduisez à l'intérieur de **`translate-docs`**. Voir [intégration VitePress](/guide/integrations/vitepress).

Le dictionnaire de thème Nextra (`.ts`) et les étiquettes de barre latérale `_meta.ts` ne sont pas en markdown — utilisez `docs[].nextraDictionaryPath` et la collecte automatique `_meta` lorsque `style: "nextra"`, le tout à l'intérieur de **`translate-docs`**. Voir [intégration Nextra](/guide/integrations/nextra).

Les remplacements d'interface utilisateur de Fumadocs (`lib/layout.shared.ts`) et les étiquettes de barre latérale `meta.json` ne sont pas en markdown — utilisez `docsOutput.fumadocsUiCatalog` et la collecte automatique `meta.json` lorsque `style: "fumadocs"`, le tout à l'intérieur de **`translate-docs`**. Voir [intégration Fumadocs](/guide/integrations/fumadocs).

`docsOutput.style = "flat"` — place les fichiers traduits à côté du fichier source avec un suffixe de locale, ou dans un sous-répertoire. Les liens relatifs entre pages sont réécrits automatiquement lorsque `docsOutput.style = "flat"` (sauf si `rewriteRelativeLinks: false` ou un `pathTemplate` personnalisé est défini).

```text
docs/guide.md → i18n/guide.de.md
```

Pour les liens d'ancrage inter-pages dans une disposition "à plat", voir [Liens d'ancrage](/guide/documents/anchor-links).

Pour la réécriture d'URL de liens et de ressources au-delà des corrections de liens relatifs intégrées, consultez [Réécriture de liens](/guide/documents/link-rewriting) (`docsOutput.postProcessing.regexAdjustments`).

Pour les captures d'écran et les ressources raster dans les pages traduites, voir [Images et captures d'écran](/guide/images-and-screenshots/).

<a id="pathtemplate--jsonpathtemplate-placeholders"></a>
## Espaces réservés `pathTemplate` / `jsonPathTemplate`

Remplacez l'emplacement d'écriture des fichiers traduits en définissant `docs[].docsOutput.pathTemplate` (markdown et MDX) ou `jsonPathTemplate` (fichiers d'étiquettes JSON). Les deux acceptent les mêmes espaces réservés. Les chemins résolus doivent rester à l'intérieur du `outputDir` de ce bloc (la CLI rejette les chemins qui en sortent).

Si vous utilisez un `pathTemplate` personnalisé, `rewriteRelativeLinks` prend par défaut la valeur `false` sauf si vous le définissez explicitement — la réécriture des liens relatifs est conçue pour `docsOutput.style = "flat"` sans modèle personnalisé.

Pour les mises en page intégrées (`nested`, `flat`, `doc-system` sans modèle personnalisé), définissez `docsOutput.localePathLowercase` sur `true` pour écrire des segments de dossier ou de nom de fichier en minuscules (par exemple `pt-br` au lieu de `pt-BR`). L'alias `astro-starlight` définit cela par défaut sur `true`. Les valeurs personnalisées de `pathTemplate` / `jsonPathTemplate` ne sont pas modifiées — utilisez `{llocale}` là où vous avez besoin de segments en minuscules tout en conservant `{locale}` au format BCP-47.

| Espace réservé            | Rôle                                                                                                       | Exemple                                                          |
|------------------------|------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| `{outputDir}`          | Chemin absolu résolu du `outputDir` de ce bloc de documentation                                           | `/home/acme/repo/i18n`                                           |
| `{locale}` | Code de langue cible (même forme que dans la configuration / CLI) | `de`, `pt-BR` |
| `{LOCALE}` | Même code langue en majuscules | `DE`, `PT-BR` |
| `{llocale}`            | Même paramètre régional en minuscules (correspond aux dossiers de routes Astro tels que `pt-br`, `zh-cn`)                               | `de`, `pt-br`                                                    |
| `{relPath}` | Chemin du fichier source relatif à la racine du projet, en notation POSIX `/` | `docs/guide.md`, `README.md` |
| `{stem}` | Nom du fichier **sans** l'extension | `guide` pour `docs/guide.md` |
| `{basename}` | Nom du fichier **avec** l'extension | `guide.md` |
| `{extension}` | Extension **incluant** le point | `.md`, `.mdx` |
| `{docsRoot}`           | Chemin absolu résolu de `docsOutput.docsRoot` (`docs` par défaut si omis)                            | `/home/acme/repo/docs`                                           |
| `{relativeToDocsRoot}` | `{relPath}` avec le préfixe `docsRoot` correspondant supprimé lorsque les chaînes de chemin coïncident (POSIX) ; sinon inchangé | `docs/guide.md` (courant) ; `guide.md` uniquement lorsque la suppression s'applique |

**Exemple**

Extrait de configuration :

```json
{
  "outputDir": "i18n",
  "docsOutput": {
    "pathTemplate": "{outputDir}/{locale}/{relPath}"
  }
}
```

Pour la langue `de` et la source `docs/guide.md`, avec un répertoire racine du projet `/home/acme/repo` et `outputDir` résolu en `/home/acme/repo/i18n`, le chemin développé est :

```text
/home/acme/repo/i18n/de/docs/guide.md
```

Avec `docsOutput.style = "flat"` et sans `pathTemplate` personnalisé, un modèle courant conserve uniquement le nom de fichier via `{stem}` et `{extension}`, par exemple `{outputDir}/{stem}.{locale}{extension}`, ce qui donne `…/guide.de.md` dans le `outputDir` résolu.
