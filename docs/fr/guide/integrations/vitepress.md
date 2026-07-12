<a id="vitepress-integration"></a>
# Intégration de VitePress

Utilisez `init -t ui-vitepress` et `docsOutput.style: "vitepress"` pour les sites de documentation [VitePress](https://vitepress.dev/). Le préréglage est un alias pour `doc-system` avec un `localeSubpath` vide et les noms de dossiers de paramètres régionaux BCP-47 conservés (`localePathLowercase` par défaut `false`, de sorte que les dossiers restent `pt-BR`, `zh-Hans`, etc.).

Voir aussi [Documents](/fr/guide/documents/) et la démo exécutable [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/). Le site de documentation de ce référentiel sous `docs/` est une référence complète VitePress + ai-i18n-tools (neuf paramètres régionaux, catalogue de thèmes, pages GitHub).

<a id="quick-start"></a>
## Démarrage rapide

```bash
ai-i18n-tools init -t ui-vitepress [-P <provider>]
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm run docs:build  # VitePress build (project-specific script)
```

Activez `features.translateDocs` lorsque vous traduisez le contenu de la page et les chaînes de chrome VitePress en une seule exécution de `sync`.

<a id="page-layout"></a>
## Disposition de la page

Le markdown anglais se trouve à la racine du contenu de VitePress (généralement `docs/`). Les copies traduites sont écrites à côté de l'arborescence source :

```text
docs/index.md           →  docs/de/index.md
docs/guide/quick-start.md  →  docs/de/guide/quick-start.md
```

Configurez un bloc `docs[]` :

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

Pointez `contentPaths` vers vos fichiers et répertoires `.md` anglais. Définissez `docsRoot` sur le même dossier que celui que VitePress utilise comme racine de son contenu.

Connectez l'[internationalisation](https://vitepress.dev/guide/i18n) de VitePress : l'anglais à `root`, chaque paramètre régional cible sous `locales[code].link` (par exemple `/pt-BR/`). Maintenez `targetLocales` dans `ai-i18n-tools.config.json` aligné avec les clés `locales` dans `.vitepress/config.mts`.

<a id="theme-strings"></a>
## Chaînes de thème

La navigation, la barre latérale, le pied de page, l'espace réservé à la recherche et les autres étiquettes `themeConfig` de VitePress ne sont pas extraits du markdown. Configurez **`docsOutput.vitepressThemeCatalog`** pour que **`translate-docs`** amorce le catalogue anglais à partir de `.vitepress/config.mts` (lorsque les chaînes sont en ligne) et traduise les fichiers JSON de thème des paramètres régionaux :

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

- **`catalogPath`** — JSON imbriqué anglais généré (sortie d'amorçage). Les auteurs ne gèrent pas ce fichier à la main lorsque l'anglais se trouve dans `config.mts` ; réexécutez `sync` pour le rafraîchir.
- **`outputPathTemplate`** (facultatif) — sorties par paramètre régional ; par défaut : même répertoire que `catalogPath` avec `theme.{locale}.json`.

`init -t ui-vitepress` échafaude également les fichiers de démarrage `docs/.vitepress/config.mts` et `docs/.vitepress/i18n/theme.en.json` lorsque ces fichiers n'existent pas encore. La configuration charge le catalogue via `loadTheme()` et connecte les étiquettes i18n standard de VitePress (y compris `langMenuLabel`) dans `themeConfigFor()`.

Chargez le fichier par paramètre régional dans `.vitepress/config.mts` via `loadTheme()` et construisez `locales[code].themeConfig` à partir du JSON traduit. Voir [examples/vitepress-docs/docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts).

**Chaînes de menu de langue :** `locales[code].label` est le nom visible de chaque langue dans la liste déroulante (par exemple `Português (Brasil)`). `themeConfig.langMenuLabel` est l'**aria-label** sur le bouton de changement de langue (VitePress par défaut : `Change language`). Placez `langMenuLabel` dans le catalogue de thèmes et connectez `langMenuLabel: t.langMenuLabel` à l'intérieur de `themeConfigFor()` — ne le confondez pas avec les chaînes `label` par paramètre régional.

Pendant `sync` / `translate-docs`, ai-i18n-tools avertit lorsqu'une clé de catalogue dans `theme.en.json` n'est pas référencée à partir de `config.mts` (par exemple, un `t.langMenuLabel` manquant dans `themeConfigFor()`).

**N'utilisez pas** `json[]` pour les chaînes de thème VitePress — ce modèle est uniquement destiné aux bundles de paramètres régionaux d'applications non liés.

<a id="wire-configmts-to-generated-theme-json-one-off"></a>
## Connecter config.mts au JSON de thème généré (ponctuel)

Après la première exécution réussie de `i18n:sync` / `translate-docs` avec `vitepressThemeCatalog`, le dépôt a généré `theme.en.json` et `theme.{locale}.json`, mais un site **existant** peut toujours avoir des chaînes `text:` / `message:` codées en dur dans `config.mts`. VitePress n'utilisera pas le JSON traduit tant que la configuration ne l'aura pas chargé via `loadTheme()`.

**Hors du champ d'application de l'outil :** codemod automatique. Utilisez l'invite ci-dessous une fois par projet (ou refactorisez manuellement en utilisant l'exemple de configuration).

1. **Quand** — après la première synchronisation ayant produit `catalogPath` et les fichiers de thème de locale ; avant de s'attendre à une navigation/barre latérale traduite en dev/build.
2. **Garder inchangé** — les liens de route (`/guide/…`), les clés de locale, la structure `defineConfig`, les options non-chaînes (fournisseur de recherche, drapeaux réduits).
3. **Référence** — [examples/vitepress-docs/docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts) et la forme générée de `theme.en.json`.
4. **Vérifier** — `pnpm docs:dev`, changer de locale dans la navigation, confirmer la traduction de la barre latérale/pied de page/placeholder de recherche ; `pnpm docs:build` passe.

**Exemple d'invite d'agent IA** (à copier dans Cursor ou un autre agent de codage) :

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

<a id="example-project"></a>
## Exemple de projet

[examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) — Sources anglaises à `docs/`, arbres de pages `pt-BR` et `zh-Hans` validés, plus `theme.pt-BR.json` / `theme.zh-Hans.json`. Exécutez `pnpm run docs:dev` sur le port 3060.

<a id="readme-and-the-docs-homepage"></a>
## Fichier README et page d'accueil de la documentation

Les projets en aval copient parfois `README.md` dans le site VitePress sous le nom `docs/index.md` (via un script de build ou une synchronisation manuelle). Ce modèle partage un fichier entre GitHub et le site de documentation, mais les règles de lien diffèrent :

| Type de lien | Fonctionne sur GitHub | Fonctionne sur VitePress |
|-----------|-----------------|-------------------|
| `docs/guide/foo.md` | Oui | Non — utilisez les routes du site ou laissez le normalisateur réécrire pendant la synchronisation |
| `./LICENSE`, `examples/demo/` | Oui (relatif au dépôt) | Non — utilisez des **URL complètes** |
| `/guide/foo` | Non | Oui |

**Recommandation pour README → index synchronisé :** Dans `README.md`, utilisez des **URL complètes** pour tout ce qui se trouve en dehors de l'arborescence de contenu VitePress (`LICENSE`, `examples/`, fichiers de configuration, fichiers de contexte d'agent) et pour les copies traduites de README sous `translated-docs/`. Utilisez les chemins `docs/guide/…` (ou les routes du site dans la documentation anglaise sous `docs/`) pour les liens de documentation internes au site ; un script de synchronisation ou le normalisateur `rewriteVitepressLinks` peut les convertir en routes `/guide/…`.

**Ce dépôt** conserve `README.md` et `docs/index.md` comme **fichiers indépendants** : le README est la page d'accueil complète de npm/GitHub ; `docs/index.md` est un point d'entrée allégé du site de documentation qui renvoie vers `/guide/` et `/reference/`. Mettez à jour chacun d'eux en fonction de son public lorsque les faits partagés changent.

Exemples de liens pour un README synchronisé dans un autre projet :

```markdown
[console-app demo](https://github.com/your-org/your-repo/tree/main/examples/console-app/)
[License](https://github.com/your-org/your-repo/blob/main/LICENSE)
[Quick start](/fr/guide/quick-start)
```

<a id="link-conventions"></a>
## Conventions de lien

VitePress sert les pages anglaises à partir de la racine du contenu et les copies localisées à partir de `docs/<locale>/…`, mais **les liens intra-page doivent utiliser les routes du site** (`/guide/quick-start`, `/reference/configuration`) — et non des chemins relatifs au dépôt comme `docs/guide/quick-start.md` ou `../guide/quick-start.md`. Ces chemins de style README fonctionnent sur GitHub mais sont rompus dans VitePress (erreur 404 en développement et sur GitHub Pages).

Activez le normaliseur intégré pour que `translate-docs` corrige automatiquement les liens dans chaque fichier traduit :

```json
"docsOutput": {
  "style": "vitepress",
  "docsRoot": "docs",
  "rewriteVitepressLinks": true
}
```

`rewriteVitepressLinks` est activé par défaut lorsque `style` est `"vitepress"`.

| Auteur dans la source anglaise | Après le normaliseur (sortie racine anglaise) | Après le normaliseur (sortie `docs/<locale>/` traduite) |
|--------------------------|----------------------------------------|------------------------------------------------------|
| `[JSON](/fr/guide/json)` | `[JSON](/fr/guide/json)` | `[JSON](/pt-BR/guide/json)` (le préfixe de la locale correspond au dossier) |
| `[Quick start](/fr/guide/quick-start)` dans le corps ou `hero.actions[].link` | inchangé (`/guide/quick-start`) | `/pt-BR/guide/quick-start` |
| `[Home](./README.md)` sur l'index de la locale | `/` | `/pt-BR/` |
| `hero.image.src: /logo.svg` | inchangé | inchangé (ressource `docs/public/` partagée) |
| `[Demo](https://github.com/org/repo/tree/main/examples/console-app/)` | inchangé (URL complète) | inchangé (URL complète) |

Les sources racines anglaises sous `docs/` conservent des routes de site **neutres en termes de locale** (`/guide/…`). Les fichiers écrits dans `docs/<locale>/…` obtiennent automatiquement le préfixe de la locale sur les routes de contenu internes, y compris le **frontmatter de la mise en page d'accueil** (`hero.actions[].link`, `features[].link`, `prev`/`next`). Les ressources publiques partagées telles que `/logo.svg` et `/translation-dashboard.png` restent sans préfixe pour chaque locale.

<a id="theme-navsidebar-links"></a>
### Liens de navigation/barre latérale du thème

`translate-docs` ne réécrit **pas** les liens dans `.vitepress/config.mts`. Les valeurs `link` de la barre de navigation et de la barre latérale sont créées une seule fois en TypeScript et doivent être préfixées par locale au moment de la compilation de la configuration.

VitePress [`themeConfig.i18nRouting`](https://vitepress.dev/reference/default-theme-config#i18nrouting) contrôle uniquement le **sélecteur de locale** (mappage de la page équivalente lorsque l'utilisateur choisit une autre langue). Il ne réécrit **pas** les hrefs statiques `nav` / `sidebar` sur la page de la locale actuelle.

Utilisez `prefixVitepressThemeConfigLinks` de `ai-i18n-tools` (mêmes règles de préfixe que la réécriture de liens markdown) :

```typescript
import { prefixVitepressThemeConfigLinks } from "ai-i18n-tools";

function themeConfigFor(t: ThemeCatalog, localeCode: string | null = null) {
  const localeRoutePrefix = localeCode ? `/${localeCode}` : null;
  return prefixVitepressThemeConfigLinks(
    {
      nav: [{ text: t.nav.guide, link: "/guide/getting-started", activeMatch: "/guide/" }],
      sidebar: [/* … locale-neutral /guide/… links … */],
      /* footer, search, etc. */
    },
    localeRoutePrefix
  );
}

// root English
themeConfig: themeConfigFor(enTheme)

// each target locale
themeConfig: themeConfigFor(theme, code)
```

Préfixez **`activeMatch`** avec **`link`** afin que la mise en surbrillance de la navigation fonctionne sur les routes de locale (`/pt-BR/guide/` et non `/guide/`). Les URL externes et les ressources publiques partagées restent inchangées.

Ajoutez `ai-i18n-tools` en tant que **devDependency** dans le projet VitePress (voir `examples/vitepress-docs/package.json`) afin que `config.mts` puisse importer `prefixVitepressThemeConfigLinks`. Le site de documentation principal d'ai-i18n-tools importe directement depuis `src/processors/…` car il utilise le monorepo ; les copies autonomes (degit) doivent utiliser le package npm.

**Règles de rédaction**

- Liens de documentation inter-pages : utilisez les **routes du site** (`/guide/…`, `/reference/…`) dans le markdown anglais sous `docs/`, ou les chemins `docs/guide/…` lors de la rédaction d'un README qui sera synchronisé dans `docs/index.md` dans un autre projet.
- Démos exécutables, `LICENSE` et autres fichiers de dépôt : utilisez les **URL GitHub complètes** dans `README.md` et dans la documentation (voir [README et la page d'accueil de la documentation](#readme-as-the-docs-homepage)).
- Ne modifiez **pas** manuellement les liens dans `docs/<locale>/` — régénérez-les avec `sync` / `translate-docs`.

Voir aussi [Réécriture de liens](/fr/guide/images-and-screenshots/link-rewriting) (plat vs VitePress) et [Configuration — `docsOutput`](/fr/reference/configuration#docsoutput).
