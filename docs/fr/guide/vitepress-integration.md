<a id="vitepress-integration"></a>
# Intégration de VitePress

Utilisez `init -t ui-vitepress` et `docsOutput.style: "vitepress"` pour les sites de documentation [VitePress](https://vitepress.dev/). Le préréglage est un alias pour `doc-system` avec un `localeSubpath` vide et les noms de dossiers de paramètres régionaux BCP-47 préservés (`localePathLowercase` est défini par défaut sur `false`, de sorte que les dossiers restent `pt-BR`, `zh-Hans`, etc.).

Voir aussi [Documents](/guide/documents/) et la démo exécutable [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/). Le site de documentation de ce dépôt sous `docs/` est une référence complète VitePress + ai-i18n-tools (neuf langues, catalogue de thèmes, GitHub Pages).

<a id="quick-start"></a>
## Démarrage rapide

```bash
npx ai-i18n-tools init -t ui-vitepress
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm run docs:build  # VitePress build (project-specific script)
```

Activez `features.translateDocs` lorsque vous traduisez le contenu de la page et les chaînes d'interface de VitePress en une seule exécution de `sync`.

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

La navigation, la barre latérale, le pied de page, l'espace réservé à la recherche et les autres étiquettes `themeConfig` de VitePress ne sont pas extraits du markdown. Configurez **`docsOutput.vitepressThemeCatalog`** pour que **`translate-docs`** amorce le catalogue anglais à partir de `.vitepress/config.mts` (lorsque les chaînes sont en ligne) et traduise les fichiers JSON de thème localisés :

```json
{
  "features": {
    "translateDocs": true
  },
  "docs": [
    {
      "contentPaths": ["docs/index.md", "docs/guide"],
      "outputDir": "docs",
      "docsOutput": {
        "style": "vitepress",
        "docsRoot": "docs",
        "vitepressThemeCatalog": {
          "configPath": "docs/.vitepress/config.mts",
          "catalogPath": "docs/.vitepress/i18n/theme.en.json"
        }
      }
    }
  ]
}
```

- **`catalogPath`** — JSON imbriqué anglais généré (sortie d'amorçage). Les auteurs ne maintiennent pas ce fichier manuellement lorsque l'anglais se trouve dans `config.mts` ; réexécutez `sync` pour le rafraîchir.
- **`outputPathTemplate`** (facultatif) — sorties par locale ; par défaut : même répertoire que `catalogPath` avec `theme.{locale}.json`.

Chargez le fichier par locale dans `.vitepress/config.mts` via `loadTheme()` et construisez `locales[code].themeConfig` à partir du JSON traduit. Voir [examples/vitepress-docs/docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts).

**N'utilisez pas** `json[]` pour les chaînes de thème VitePress — ce modèle est uniquement destiné aux bundles de locales d'applications non liés.

<a id="wire-config-mts-to-generated-theme-json"></a>
## Connecter config.mts au JSON de thème généré (ponctuel)

Après la première exécution réussie de `i18n:sync` / `translate-docs` avec `vitepressThemeCatalog`, le dépôt a généré `theme.en.json` et `theme.{locale}.json`, mais un site **existant** peut encore avoir des chaînes `text:` / `message:` codées en dur dans `config.mts`. VitePress n'utilisera pas le JSON traduit tant que la configuration ne l'aura pas chargé via `loadTheme()`.

**Hors du champ d'application de l'outil :** codemod automatique. Utilisez l'invite ci-dessous une fois par projet (ou refactorisez manuellement en utilisant l'exemple de configuration).

1. **Quand** — après la première synchronisation ayant produit `catalogPath` et les fichiers de thème locaux ; avant de s'attendre à une navigation/barre latérale traduite en dev/build.
2. **Garder inchangé** — liens de route (`/guide/…`), clés de locale, structure `defineConfig`, options non-chaînes (fournisseur de recherche, drapeaux réduits).
3. **Référence** — [examples/vitepress-docs/docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts) et la forme générée de `theme.en.json`.
4. **Vérifier** — `pnpm docs:dev`, changer de locale dans la navigation, confirmer que la barre latérale/le pied de page/l'espace réservé à la recherche sont traduits ; `pnpm docs:build` passe.

**Exemple d'invite d'agent IA** (copier dans Cursor ou un autre agent de codage) :

```markdown
Refactor our VitePress config to load theme strings from generated JSON files instead of hardcoded literals.

Context:
- ai-i18n-tools already generated English and locale theme catalogs via `docsOutput.vitepressThemeCatalog`.
- English catalog: `docs/.vitepress/i18n/theme.en.json`
- Locale catalogs: `docs/.vitepress/i18n/theme.{locale}.json` (e.g. pt-BR, zh-Hans)
- Target file: `docs/.vitepress/config.mts` (or our project's equivalent path)
- Reference pattern: https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/docs/.vitepress/config.mts

Requirements:
1. Add `loadTheme(localeFile: string)` that reads JSON from `docs/.vitepress/i18n/` (use `import.meta.url` / `fileURLToPath` for ESM paths).
2. Add `themeConfigFor(t)` that builds VitePress `themeConfig` from the catalog — keep all **links and structure** in TypeScript; only **display strings** come from JSON keys matching `theme.en.json`.
3. Wire `locales.root` and each target locale in `locales[code]` to `loadTheme('theme.en.json')` or `loadTheme('theme.{code}.json')`, then `themeConfig: themeConfigFor(theme)`.
4. Align locale codes with `ai-i18n-tools.config.json` `targetLocales` and existing VitePress `locales` keys.
5. Do **not** change markdown content paths, `base`, or link targets — only move translatable labels out of inline string literals.
6. Preserve any project-specific options (ignoreDeadLinks, head config, etc.).

After editing:
- Run `pnpm docs:dev` (or our docs dev script) and confirm English + at least one translated locale show correct nav/sidebar/footer/search placeholder.
- If a string exists in config but not in `theme.en.json`, add a matching key to the JSON shape in `themeConfigFor` and note that the user should re-run `i18n:sync` to refresh catalogs from config if needed.

Do not introduce a hand-maintained duplicate of theme strings — config must read from the generated JSON files only.
```

<a id="framework-shell-translation"></a>
## Traduction de l'interface du framework

| Framework | Chaînes de l'interface / du thème | Pipeline |
|-----------|----------------------|----------|
| Docusaurus | Catalogue `write-translations` (`{ message, description }`) | Documents — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | Catalogue thème/nav/barre latérale | Documents — `docsOutput.vitepressThemeCatalog` + `translate-docs` |
| Nextra | Étiquettes de la barre latérale `_meta.ts` | Documents — auto lorsque `style: "nextra"` + `translate-docs` |
| Nextra | Dictionnaire de thème `.ts` | Documents — `docs[].nextraDictionaryPath` + `translate-docs` |
| Astro Starlight | Chaînes d'interface utilisateur intégrées (nombreuses langues) ; pas de pipeline d'interface supplémentaire | Documents — `translate-docs` (pages uniquement) |

Ne mettez **pas** les chaînes de shell/thème du framework dans `json[]` — ce pipeline est destiné aux bundles de paramètres régionaux d'applications non liés. Consultez [Intégration Docusaurus](/guide/docusaurus-integration) et [Intégration Nextra](/guide/nextra-integration) pour les autres modèles de framework.

<a id="example-project"></a>
## Exemple de projet

[examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) — sources anglaises à `docs/`, arborescences de pages `pt-BR` et `zh-Hans` validées, plus `theme.pt-BR.json` / `theme.zh-Hans.json`. Exécutez `pnpm run docs:dev` sur le port 3060.

<a id="readme-as-the-docs-homepage"></a>
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
