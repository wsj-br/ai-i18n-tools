<a id="link-rewriting"></a>
# Réécriture de liens

`translate-docs` réécrit les URL dans le Markdown traduit afin que les liens restent fonctionnels après le déplacement des fichiers vers des chemins spécifiques à la locale. La plupart des liens inter-pages sont gérés automatiquement ; si votre site utilise une arborescence d'URL statique partagée ou des dossiers d'actifs codés par locale, ajoutez des règles `docsOutput.postProcessing.regexAdjustments`.

<a id="built-in-rewriters"></a>
## Réécriveurs intégrés

Le réécriveur qui s'exécute dépend de `docsOutput.style` :

| Disposition | Réécriveur intégré | Ce qu'il corrige |
| --- | --- | --- |
| `"flat"` (par défaut si pas de `pathTemplate` personnalisé) | Réécriveur de liens plats (`rewriteRelativeLinks`, activé par défaut) | Liens relatifs inter-pages (`guide.md` → `guide.de.md`) et préfixes de profondeur pour les URL d'actifs non-Markdown |
| `"vitepress"` | Normalisateur de liens VitePress (`rewriteVitepressLinks`, activé par défaut) | Chemins `docs/guide/…` de style README → routes du site (`/guide/…`) |
| `"nextra"` | Normaliseur de liens Nextra (`rewriteNextraLinks`, activé par défaut) | Chemins `content/en/…` et `.mdx` relatifs → routes indépendantes de la locale (`/guide/…`) |
| `"fumadocs"` | Normaliseur de liens Fumadocs (`rewriteFumadocsLinks`, activé par défaut) | Chemins `content/docs/…` et `.mdx` relatifs → routes indépendantes de la locale (`/docs/…`) |
| `"doc-system"`, `"docusaurus"`, `"astro-starlight"` | Aucun | Les URL source passent inchangées jusqu'à `postProcessing` |

Un `pathTemplate` personnalisé désactive le réécriveur plat, sauf si vous définissez `rewriteRelativeLinks: true` explicitement. Voir [Dispositions de sortie](/guide/documents/output-layouts) et [Liens d'ancrage](/guide/documents/anchor-links) pour la gestion des `#anchor` inter-pages.

Pour les règles de rédaction spécifiques à VitePress, voir [Intégration VitePress — Conventions de liens](/guide/vitepress-integration#link-conventions).

Pour les règles de rédaction spécifiques à Nextra, consultez [Intégration Nextra — Conventions de liens](/guide/nextra-integration#link-conventions).

Pour les règles de rédaction spécifiques à Fumadocs, consultez [Intégration Fumadocs — Conventions de liens](/guide/fumadocs-integration#link-conventions).

<a id="postprocessingregexadjustments"></a>
## `postProcessing.regexAdjustments`

Ajoutez des règles `{ "description"?, "search", "replace" }` ordonnées sous `docs[].docsOutput.postProcessing` lorsque les réécriveurs intégrés ne suffisent pas — par exemple :

- URL de captures d'écran ou d'images qui incluent un **segment de dossier de locale** (`screenshots/en-GB/` → `screenshots/de/`)
- Chemins absolus à la racine du site (`/img/…`) qui diffèrent entre la source anglaise et les arborescences de sortie traduites
- Tout modèle d'URL qui doit changer par locale cible mais n'est pas un simple lien Markdown relatif

`postProcessing` s'exécute sur le **corps Markdown traduit réassemblé** (les clés du front matter YAML et les valeurs non-prose sont conservées). Il s'exécute **après** le réassemblage des segments et la réécriture de liens intégrée, et **avant** `addFrontmatter`.

<a id="two-step-flow-with-flat-layout"></a>
### Flux en deux étapes avec disposition plate

Lorsque `docsOutput.style = "flat"`, le réécriveur de liens plats s'exécute en premier, puis `regexAdjustments` :

```
source URL  →  [flat link rewriter]  →  [regexAdjustments]  →  output URL
```

Exemple avec `outputDir: "translated-docs/"` et une source `README.md` située à la racine du dépôt :

1. Réécriveur plat : `images/screenshots/en-GB/foo.png` → `../images/screenshots/en-GB/foo.png`
2. `regexAdjustments` : `images/screenshots/[^/]+/` → `images/screenshots/${translatedLocale}/` → `../images/screenshots/de/foo.png`

Écrivez les modèles `search` pour correspondre au segment de locale **à l'intérieur de l'URL déjà préfixée** — vous n'avez pas besoin d'inclure le préfixe de profondeur `../` dans l'expression régulière.

Pour les dispositions `doc-system`, le réécriveur plat ne s'exécute pas. `regexAdjustments` voit l'URL originale du Markdown source (généralement un chemin absolu comme `/img/screenshots/en-GB/foo.png`).

Voir [Le réécriveur de liens plats et le flux en deux étapes](/guide/images-and-screenshots/link-rewriting#the-flat-link-rewriter-and-two-step-flow) pour le comportement du préfixe de profondeur et `flatPreserveRelativeDir`.

<a id="replace-placeholders"></a>
### Espaces réservés `replace`

Les chaînes `replace` prennent en charge les variables de modèle étendues par fichier et par paramètre régional :

| Espace réservé | Valeur |
| --- | --- |
| `${translatedLocale}` | Paramètres régionaux cibles (BCP-47 normalisé) |
| `${sourceLocale}` | Paramètres régionaux source |
| `${sourceFullPath}` | Chemin de fichier source absolu (POSIX `/`) |
| `${translatedFullPath}` | Chemin de sortie traduit absolu |
| `${sourceFilename}` / `${translatedFilename}` | Nom de base avec extension |
| `${sourceBasedir}` / `${translatedBasedir}` | Répertoire parent du fichier source / de sortie |

`search` est un modèle d'expression régulière. Une chaîne simple utilise l'indicateur `g` ; utilisez `/pattern/flags` lorsque vous avez besoin d'autres indicateurs (le modèle ne doit pas contenir de caractères `/` non échappés).

<a id="common-patterns"></a>
## Modèles courants

<a id="per-locale-asset-folder"></a>
### Dossier d'actifs par paramètres régionaux

Stockez les actifs dans un sous-répertoire codé par paramètres régionaux dès le premier jour et échangez le segment avec une règle générique :

```json
"postProcessing": {
  "regexAdjustments": [
    {
      "description": "Per-locale screenshot folders",
      "search": "images/screenshots/[^/]+/",
      "replace": "images/screenshots/${translatedLocale}/"
    }
  ]
}
```

Utilisez `[^/]+` plutôt que de coder en dur vos paramètres régionaux source (`en-GB`) afin que la règle fonctionne toujours si `sourceLocale` change.

Procédure complète : [Images et captures d'écran — Dossier par paramètres régionaux](/guide/images-and-screenshots/per-locale-folder).

<a id="doc-system-static-urls"></a>
### URL statiques du système de documentation

Pour Docusaurus, Starlight ou d'autres sites `doc-system` qui diffusent des captures d'écran à partir d'une arborescence statique partagée :

```json
"postProcessing": {
  "regexAdjustments": [
    {
      "description": "Locale segment in static screenshot URLs",
      "search": "screenshots/[^/]+/",
      "replace": "screenshots/${translatedLocale}/"
    }
  ]
}
```

Préférez les chemins relatifs colocalisés (`../assets/name.png`) dans le markdown source lorsque votre générateur le prend en charge — alors aucun pont `regexAdjustments` n'est nécessaire. Voir [Images et captures d'écran](/guide/images-and-screenshots/) pour les choix de mise en page.

<a id="when-regex-is-not-needed"></a>
### Quand les expressions régulières ne sont pas nécessaires

Vous n'avez généralement **pas** besoin de `regexAdjustments` lorsque :

- Les liens entre pages sont de simples chemins markdown relatifs et `docsOutput.style = "flat"` (le réécriveur intégré ajoute des suffixes de paramètres régionaux)
- Les actifs se trouvent à côté des fichiers source et le préfixe de profondeur par fichier du réécriveur plat les résout correctement
- L'anglais et chaque copie traduite utilisent la **même** URL (images partagées à la racine du site, actifs colocalisés, routes de site VitePress après normalisation)
- Les liens internes de VitePress utilisent les routes du site ou les chemins `docs/guide/…` avec `rewriteVitepressLinks: true`
- Les liens internes à la page de Nextra et Fumadocs utilisent des routes indépendantes de la locale (`/guide/…`, `/docs/…`) ou des chemins de racine de contenu avec `rewriteNextraLinks` / `rewriteFumadocsLinks: true`

<a id="full-config-example"></a>
## Exemple de configuration complète

README plat avec captures d'écran par langue et un bloc de sélection de langue facultatif :

<details>
<summary>Mise en page plate : regexAdjustments + languageListBlock</summary>

```json
"docsOutput": {
  "style": "flat",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders",
        "search": "images/screenshots/[^/]+/",
        "replace": "images/screenshots/${translatedLocale}/"
      }
    ],
    "languageListBlock": {
      "start": "<small id=\"lang-list\">",
      "end": "</small>",
      "separator": " · ",
      "label": "local"
    }
  }
}
```

</details>

Référence de champ : [Configuration — `docs`](/reference/configuration#docs) (`docsOutput.postProcessing`).

<a id="troubleshooting"></a>
## Dépannage

| Symptôme | Cause probable | Que vérifier |
| --- | --- | --- |
| La page traduite renvoie une erreur 404 sur une image ou un actif statique | `regexAdjustments` manquant ou incorrect pour votre structure d'URL | [Images et captures d'écran — Dépannage](/guide/images-and-screenshots/troubleshooting) |
| Le lien ouvre le bon fichier mais le mauvais `#section` | Dérive du slug d'ancre, pas de réécriture d'URL | [Liens d'ancrage](/guide/documents/anchor-links) |
| La règle `regexAdjustments` n'a aucun effet sur la mise en page plate | `search` attend l'URL avant la réécriture, mais la mise en page plate a déjà ajouté un préfixe de profondeur | Faites correspondre le segment à l'intérieur du chemin préfixé (voir [flux en deux étapes](#two-step-flow-with-flat-layout)) |
| Regex invalide ignorée à l'exécution | Modèle `search` mal formé | La CLI avertit avec la règle `description` ; testez les modèles par rapport à la sortie traduite d'exemple |
