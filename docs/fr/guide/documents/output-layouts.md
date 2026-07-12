<a id="output-layouts"></a>
# Dispositions de sortie

`docsOutput.style` contrôle l'emplacement d'écriture des fichiers Markdown traduits. Utilisez les valeurs de chaîne exactes ci-dessous dans `docs[].docsOutput.style`. Les alias sont des mises en page prédéfinies `doc-system` (ou la mise en page avec suffixe en points de Fumadocs), et non des moteurs distincts. Le chargement de la configuration peut réécrire les valeurs d'alias `style` en `"doc-system"` canoniques tout en conservant le préréglage d'origine dans `stylePreset`.

Définissez `docs[].docsOutput.pathTemplate` (Markdown/MDX) ou `jsonPathTemplate` (fichiers d'étiquettes JSON) pour remplacer toute mise en page intégrée. Voir les [placeholders pathTemplate](#pathtemplate--jsonpathtemplate-placeholders) ci-dessous.

<a id="layout-overview"></a>
## Aperçu de la mise en page

| `docsOutput.style` | Moteur | Utilisation typique |
| --- | --- | --- |
| `"nested"` | Le dossier de la locale reflète l'arborescence source complète | Par défaut ; sortie i18n générique sous `{outputDir}/{locale}/` |
| `"flat"` | Suffixe de locale dans le nom de fichier (sous-répertoires facultatifs) | README, journaux de modifications, documents à la racine du dépôt, [sélecteur de langue](/fr/guide/documents/language-switcher) |
| `"doc-system"` | Dossier de locale + `localeSubpath` facultatif sous `docsRoot` | Générateurs de documents statiques personnalisés |
| `"docusaurus"` | Préréglage `doc-system` | Mise en page du plugin i18n [Docusaurus](/fr/guide/integrations/docusaurus) |
| `"astro-starlight"` | Préréglage `doc-system` (`localeSubpath: ""`) | [Astro Starlight](/fr/guide/integrations/astro#astro-starlight), pages de locale Astro simples |
| `"vitepress"` | Préréglage `doc-system` (`localeSubpath: ""`) | Dossiers de locale [VitePress](/fr/guide/integrations/vitepress) à côté de l'anglais |
| `"nextra"` | Préréglage `doc-system` (`localeSubpath: ""`) | Dossiers de locale [Nextra](/fr/guide/integrations/nextra) (`content/en/` → `content/{locale}/`) |
| `"fumadocs"` | Suffixe en points (par défaut) ou `doc-system` lorsque `fumadocsParser: "dir"` | Mise en page de contenu en points ou en répertoires [Fumadocs](/fr/guide/integrations/fumadocs) |

<a id="nested-default"></a>
## `nested` (par défaut)

`docsOutput.style = "nested"` (par défaut si omis) — reflète l'arborescence source sous `{outputDir}/{locale}/`.

```text
docs/guide.md  →  i18n/de/docs/guide.md
README.md      →  i18n/de/README.md
```

Les chemins en dehors d'un `docsRoot` (lorsqu'il est défini) utilisent la même forme imbriquée.

<a id="flat"></a>
## `flat`

`docsOutput.style = "flat"` — écrit les fichiers traduits sous `outputDir` avec un suffixe de locale dans le nom de fichier. Par défaut, seul le nom de base est conservé (`{outputDir}/{stem}.{locale}{extension}`), de sorte que `docs/guide.md` et `docs/other/guide.md` entreraient en collision à moins que vous n'activiez `flatPreserveRelativeDir`.

```text
README.md           →  translated-docs/README.de.md
docs/guide.md       →  translated-docs/guide.de.md   (default: basename only)
```

Les liens relatifs entre les pages sont réécrits automatiquement lorsque `docsOutput.style = "flat"` (sauf si `rewriteRelativeLinks: false` ou un `pathTemplate` personnalisé est défini). Voir [Liens d'ancrage](/fr/guide/documents/anchor-links) pour la gestion des `#anchor` entre les pages.

<a id="flat-with-flatpreserverelativedir"></a>
### `flat` avec `flatPreserveRelativeDir`

Définissez `docsOutput.flatPreserveRelativeDir` sur `true` pour conserver les sous-répertoires source sous `outputDir`. Utilisez ceci lorsque vous traduisez plusieurs fichiers Markdown qui partagent des noms de base dans différents dossiers, ou lorsque les sorties plates doivent refléter une arborescence peu profonde (par exemple, README à la racine du dépôt plus `docs/*.md`).

```text
docs/guide.md       →  translated-docs/docs/guide.de.md
docs/sub/page.md    →  translated-docs/docs/sub/page.de.md
```

Le réécriveur de liens plats utilise le chemin de sortie par fichier lors du calcul des préfixes de profondeur pour les URL d'actifs — voir [Réécriture de liens](/fr/guide/images-and-screenshots/link-rewriting#per-file-depth-prefix-with-flatpreserverelativedir).

<a id="doc-system"></a>
## `doc-system`

`docsOutput.style = "doc-system"` — arborescence de documentation préfixée par la locale pour les sites de documentation statiques. Les fichiers sous `docsRoot` sont écrits dans :

```text
{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}
```

Les chemins en dehors de `docsRoot` reviennent à la mise en page [imbriquée](#nested) (`{outputDir}/{locale}/{relPath}`).

Définissez `docs[].docsOutput.docsRoot` sur la racine de votre source anglaise (par exemple, `"docs"`, `"src/content/docs"` ou `"content/en"`). Lorsque `docsOutput.style = "doc-system"`, vous devez définir `localeSubpath` explicitement (utilisez un alias ci-dessous pour les préréglages). Utilisez `localeSubpath: ""` lorsque les pages traduites se trouvent directement sous `{outputDir}/{locale}/` (style Starlight).

Le JSON de l'interpréteur de commandes Docusaurus de `docusaurusCatalogDir` et d'autres artefacts JSON sous les préréglages du système de documentation suivent la même disposition de dossiers que le markdown. Avec `style: "flat"`, les fichiers d'étiquettes JSON utilisent toujours la forme imbriquée, sauf si vous définissez `jsonPathTemplate`.

<a id="doc-system-aliases"></a>
## Alias du système de documentation

**Alias** (même moteur `doc-system`, préréglage `localeSubpath` et valeurs par défaut) :

- `docsOutput.style = "docusaurus"` — `localeSubpath` est par défaut `docusaurus-plugin-content-docs/current` (disposition du plugin i18n de Docusaurus).
- `docsOutput.style = "astro-starlight"` — `localeSubpath` est par défaut `""` ; `localePathLowercase` est par défaut `true`. Pages traduites sous `{outputDir}/{locale}/`, correspondant à [Starlight](https://starlight.astro.build/guides/i18n/) lorsque l'anglais se trouve à la racine du contenu et que `outputDir` est égal à `docsRoot`. Également utilisé pour les pages de locale Astro simples (`src/pages/index.astro` → `src/pages/{locale}/index.astro`) — voir [pages du site web Astro](/fr/guide/ui-strings/astro-website#pages-parse-and-replace).
- `docsOutput.style = "vitepress"` — même disposition que `doc-system` avec `localeSubpath` vide ; les noms de dossiers de locale BCP-47 sont conservés (`localePathLowercase` est par défaut `false`). Voir [intégration VitePress](/fr/guide/integrations/vitepress).
- `docsOutput.style = "nextra"` — même disposition que `doc-system` avec `localeSubpath` vide ; la source anglaise se trouve sous un dossier de locale (par exemple `content/en/`). Voir [intégration Nextra](/fr/guide/integrations/nextra).

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

Étiquettes JSON facultatives — chaînes d'interface Docusaurus provenant de `docusaurusCatalogDir` (pas le contenu du corps MDX) :

```text
i18n/en/sidebar.json  →  i18n/de/sidebar.json
```

Starlight fournit des chaînes d'interface pour de nombreuses locales ; les remplacements personnalisés facultatifs utilisent `src/content/i18n/en.json` avec `jsonPathTemplate: "{outputDir}/{locale}.json"` dans un bloc `docs[]` séparé si nécessaire.

Les chaînes de navigation/barre latérale/pied de page de VitePress ne sont pas en markdown — configurez `docsOutput.vitepressThemeCatalog` et traduisez à l'intérieur de **`translate-docs`**. Voir [intégration VitePress](/fr/guide/integrations/vitepress).

Le dictionnaire de thème Nextra (`.ts`) et les étiquettes de barre latérale `_meta.ts` ne sont pas en markdown — utilisez `docs[].nextraDictionaryPath` et la collecte automatique `_meta` lorsque `style: "nextra"`, le tout à l'intérieur de **`translate-docs`**. Voir [intégration Nextra](/fr/guide/integrations/nextra).

<a id="fumadocs"></a>
## `fumadocs`

`docsOutput.style = "fumadocs"` — disposition du contenu Fumadocs via `docsOutput.fumadocsParser` :

- **`"dot"` (par défaut)** — suffixe de locale dans le nom de fichier à côté des sources anglaises sous `outputDir` (pas un dossier de locale). Ceci est distinct de la forme de chemin `doc-system`.

```text
content/docs/guide/getting-started.mdx  →  content/docs/guide/getting-started.pt.mdx
```

- **`"dir"`** — dossiers de locale de style Nextra ; utilise le même moteur `doc-system` avec `localeSubpath` vide.

```text
content/docs/en/guide/getting-started.mdx  →  content/docs/pt-BR/guide/getting-started.mdx
```

Les remplacements d'interface utilisateur de Fumadocs (`lib/layout.shared.ts`) et les étiquettes de barre latérale `meta.json` ne sont pas en markdown — utilisez `docsOutput.fumadocsUiCatalog` et la collecte automatique `meta.json` lorsque `style: "fumadocs"`, le tout à l'intérieur de **`translate-docs`**. Voir [intégration Fumadocs](/fr/guide/integrations/fumadocs).

Pour la réécriture d'URL de liens et de ressources au-delà des corrections de liens relatifs intégrées, consultez [Réécriture de liens](/fr/guide/documents/link-rewriting) (`docsOutput.postProcessing.regexAdjustments`).

Pour les captures d'écran et les ressources raster dans les pages traduites, voir [Images et captures d'écran](/fr/guide/images-and-screenshots/).

<a id="pathtemplate--jsonpathtemplate-placeholders"></a>
## Espaces réservés `pathTemplate` / `jsonPathTemplate`

Remplacez l'emplacement d'écriture des fichiers traduits en définissant `docs[].docsOutput.pathTemplate` (markdown et MDX) ou `jsonPathTemplate` (fichiers d'étiquettes JSON). Les deux acceptent les mêmes espaces réservés. Les chemins résolus doivent rester à l'intérieur du `outputDir` de ce bloc (la CLI rejette les chemins qui en sortent).

Si vous utilisez un `pathTemplate` personnalisé, `rewriteRelativeLinks` prend par défaut la valeur `false` sauf si vous le définissez explicitement — la réécriture des liens relatifs est conçue pour `docsOutput.style = "flat"` sans modèle personnalisé.

Pour les dispositions intégrées (`nested`, `flat`, `doc-system` sans modèle personnalisé), définissez `docsOutput.localePathLowercase` sur `true` pour écrire des segments de dossier ou de nom de fichier de locale en minuscules (par exemple `pt-br` au lieu de `pt-BR`). L'alias `astro-starlight` et `doc-system` avec `localeSubpath` vide définissent cette valeur par défaut sur `true` lors du chargement de la configuration. Les valeurs personnalisées `pathTemplate` / `jsonPathTemplate` sont inchangées — utilisez `{llocale}` là où vous avez besoin de segments en minuscules tout en conservant `{locale}` comme BCP-47.

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
