<a id="vitepress-integration"></a>
# Intégration de VitePress

Utilisez `init -t ui-vitepress` et `docsOutput.style: "vitepress"` pour les sites de documentation [VitePress](https://vitepress.dev/). Le préréglage est un alias pour `doc-system` avec un `localeSubpath` vide et les noms de dossiers de paramètres régionaux BCP-47 préservés (`localePathLowercase` est défini par défaut sur `false`, de sorte que les dossiers restent `pt-BR`, `zh-Hans`, etc.).

Voir aussi [Documents](/guide/documents/), [JSON](/guide/json) (chaînes de thème) et la démo exécutable [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/). Le site de documentation de ce dépôt sous `docs/` est une référence complète VitePress + ai-i18n-tools (neuf locales, thème JSON, GitHub Pages).

<a id="quick-start"></a>
## Démarrage rapide

```bash
npx ai-i18n-tools init -t ui-vitepress
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm run docs:build  # VitePress build (project-specific script)
```

Activez à la fois `features.translateDocs` et `features.translateJson` lorsque vous traduisez le contenu des pages et les chaînes de chrome VitePress en une seule exécution de `sync`.

<a id="page-layout"></a>
## Disposition de la page

Le markdown anglais se trouve à la racine du contenu de VitePress (généralement `docs/`). Les copies traduites sont écrites à côté de l'arborescence source :

```text
docs/index.md           →  docs/de/index.md
docs/guide/quick-start.md  →  docs/de/guide/quick-start.md
```

Configurez un bloc `docs[]` :

```json
{
  "contentPaths": ["docs/index.md", "docs/guide"],
  "outputDir": "docs",
  "docsOutput": {
    "style": "vitepress",
    "docsRoot": "docs",
    "rewriteVitepressLinks": true
  }
}
```

Pointez `contentPaths` vers vos fichiers et répertoires `.md` anglais. Définissez `docsRoot` sur le même dossier que celui utilisé par VitePress comme racine de son contenu.

Connectez l'[internationalisation](https://vitepress.dev/guide/i18n) de VitePress : l'anglais à `root`, chaque paramètre régional cible sous `locales[code].link` (par exemple `/pt-BR/`). Maintenez `targetLocales` dans `ai-i18n-tools.config.json` aligné avec les clés `locales` dans `.vitepress/config.mts`.

<a id="theme-strings"></a>
## Chaînes de thème

Les libellés de navigation VitePress, de barre latérale, de pied de page, de placeholder de recherche et d'autres `themeConfig` ne sont pas extraits du markdown. Créez un catalogue JSON imbriqué (par exemple `docs/.vitepress/i18n/theme.en.json`) et traduisez-le avec JSON :

```json
{
  "features": {
    "translateJson": true
  },
  "json": [
    {
      "description": "VitePress theme/nav/sidebar strings",
      "contentPaths": "docs/.vitepress/i18n/theme.en.json",
      "outputPathTemplate": "docs/.vitepress/i18n/theme.{locale}.json"
    }
  ]
}
```

Chargez le fichier par paramètre régional dans `.vitepress/config.mts` et construisez `locales[code].themeConfig` à partir du JSON traduit (texte de navigation, titres de groupe de la barre latérale, message de pied de page, etc.). Ne codez pas en dur les étiquettes traduites dans `config.mts` — régénérez-les avec `sync` / `translate-json` lorsque l'anglais change.

Ce package charge `theme.{locale}.json` dans [docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/.vitepress/config.mts); comparez avec [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) pour une configuration minimale à deux locales.

<a id="docusaurus-vs-vitepress-shell-json"></a>
## JSON de l'interface Docusaurus vs VitePress

| Framework | Chaînes de l'interface / du thème | Pipeline |
|-----------|----------------------|----------|
| Docusaurus | Catalogue `write-translations` (`{ message, description }`) | Documents — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | Catalogue JSON imbriqué personnalisé que vous créez | JSON — `json[]` + `translate-json` (ou `sync` lorsque `translateJson` est activé) |

Ne mettez pas le JSON de thème VitePress dans `docs[]` ; utilisez plutôt `json[]`.

<a id="example-project"></a>
## Exemple de projet

[examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) — sources anglaises à `docs/`, arborescences de pages `pt-BR` et `zh-Hans` validées, plus `theme.pt-BR.json` / `theme.zh-Hans.json`. Exécutez `pnpm run docs:dev` sur le port 3060.

<a id="readme-as-homepage"></a>
## README comme page d'accueil de la documentation

Certains projets copient `README.md` dans le site VitePress en tant que `docs/index.md` (ce dépôt utilise `scripts/sync-readme-to-docs.mjs` avant `docs:build`). Ce modèle partage un fichier entre GitHub et le site de documentation, mais les règles de lien diffèrent :

| Type de lien | Fonctionne sur GitHub | Fonctionne sur VitePress |
|-----------|-----------------|-------------------|
| `docs/guide/foo.md` | Oui | Non — utilisez les routes du site ou laissez le normaliseur réécrire pendant la synchronisation |
| `./LICENSE`, `examples/demo/` | Oui (relatif au dépôt) | Non — utilisez des **URL complètes** |
| `/guide/foo` | Non | Oui |

**Recommandation :** Dans `README.md`, utilisez des **URL complètes** pour tout ce qui se trouve en dehors de l'arborescence de contenu VitePress (`LICENSE`, `examples/`, fichiers de configuration, fichiers de contexte d'agent) et pour les copies traduites de README sous `translated-docs/`. Utilisez les chemins `docs/guide/…` (ou les routes du site dans la documentation anglaise sous `docs/`) pour les liens de documentation internes au site ; le script de synchronisation et le normaliseur `rewriteVitepressLinks` les convertissent en routes `/guide/…`.

Exemple :

```markdown
[console-app demo](https://github.com/your-org/your-repo/tree/main/examples/console-app/)
[License](https://github.com/your-org/your-repo/blob/main/LICENSE)
[Quick start](/guide/quick-start)
```

<a id="link-conventions"></a>
## Conventions de lien

VitePress sert les pages anglaises à partir de la racine du contenu et les copies localisées à partir de `docs/<locale>/…`, mais **les liens internes à la page doivent utiliser les routes du site** (`/guide/quick-start`, `/reference/configuration`) — et non des chemins relatifs au dépôt comme `docs/guide/quick-start.md` ou `../guide/quick-start.md`. Ces chemins de style README fonctionnent sur GitHub mais se cassent dans VitePress (404 en développement et sur GitHub Pages).

Activez le normaliseur intégré pour que `translate-docs` corrige automatiquement les liens dans chaque fichier traduit :

```json
"docsOutput": {
  "style": "vitepress",
  "docsRoot": "docs",
  "rewriteVitepressLinks": true
}
```

`rewriteVitepressLinks` est activé par défaut lorsque `style` est `"vitepress"`.

| Auteur dans la source anglaise | Après le normaliseur |
|--------------------------|------------------|
| `[JSON](/guide/json)` | `[JSON](/guide/json)` |
| `[Home](./README.md)` sur l'index de la locale | `/` |
| `[Demo](https://github.com/org/repo/tree/main/examples/console-app/)` | inchangé (URL complète) |

**Règles de rédaction**

- Liens de documentation inter-pages : utilisez les **routes du site** (`/guide/…`, `/reference/…`) dans le markdown anglais sous `docs/`, ou les chemins `docs/guide/…` lors de la synchronisation depuis `README.md`.
- Démos exécutables, `LICENSE` et autres fichiers de dépôt : utilisez les **URL GitHub complètes** dans `README.md` et dans la documentation (voir [README comme page d'accueil de la documentation](#readme-as-homepage)).
- Ne modifiez **pas** manuellement les liens dans `docs/<locale>/` — régénérez avec `sync` / `translate-docs`.

Voir aussi [Réécriture de liens](/guide/images-and-screenshots/link-rewriting) (plat vs VitePress) et [Configuration — `docsOutput`](/reference/configuration#docsoutput).
