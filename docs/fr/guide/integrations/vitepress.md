<a id="vitepress-integration"></a>
# Intégration de VitePress

Utilisez `init -t ui-vitepress` et `docsOutput.style: "vitepress"` pour les sites de documentation [VitePress](https://vitepress.dev/). Le préréglage est un alias pour `doc-system` avec un `localeSubpath` vide et les noms de dossiers de paramètres régionaux BCP-47 conservés (`localePathLowercase` par défaut `false`, de sorte que les dossiers restent `pt-BR`, `zh-Hans`, etc.).

Voir aussi [Documents](/fr/guide/documents/) et la démo exécutable [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/). Le site de documentation de ce référentiel sous `docs/` est une référence complète VitePress + ai-i18n-tools (neuf paramètres régionaux, catalogue de thèmes, pages GitHub).

<a id="quick-start"></a>
## Démarrage rapide

```bash
ai-i18n-tools init -t ui-vitepress -P anthropic
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

Pointez `contentPaths` vers les fichiers et répertoires `.md` écrits en `sourceLocale`. Cette langue peut être n'importe quelle langue. Définissez `docsRoot` sur le même dossier que celui utilisé par VitePress comme racine de contenu.

Connectez l'[internationalisation](https://vitepress.dev/guide/i18n) de VitePress : la locale source à `root`, chaque locale cible sous `locales[code].link` (par exemple `/pt-BR/`). Maintenez `targetLocales` dans `ai-i18n-tools.config.json` aligné avec les clés `locales` dans `.vitepress/config.mts`.

<a id="enable-i18n-in-an-existing-site"></a>
### Activer l'i18n dans un site existant

Une configuration VitePress en anglais seulement nécessite ces éléments avant que les pages traduites n'apparaissent. L'[invite de l'agent](#wire-configmts-to-generated-theme-json-one-off) couvre la moitié du catalogue de thèmes.

- `locales.root` pour l'anglais (`label`, `lang` et `themeConfig`).
- Une entrée `locales[code]` par locale cible : `label`, `lang`, `link: '/${code}/'`, et `title` / `description` par locale.
- Liens `themeConfig` et `activeMatch` préfixés par locale avec `prefixVitepressThemeConfigLinks` (voir [Liens de navigation/barre latérale du thème](#theme-navsidebar-links)).
- `targetLocales` aligné avec ces clés `locales`, puis `sync` pour que `docs/<locale>/` et `theme.<locale>.json` existent.

<a id="theme-strings"></a>
## Chaînes de thème

Les libellés de navigation, de barre latérale, de pied de page, d'espace réservé de recherche et autres libellés `themeConfig` de VitePress ne sont pas extraits du markdown. Configurez **`docsOutput.vitepressThemeCatalog`** pour que **`translate-docs`** amorce le catalogue de la locale source à partir de `.vitepress/config.mts` (lorsque les chaînes sont en ligne) et traduise les fichiers JSON de thème de locale :

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

- **`catalogPath`** — JSON imbriqué en anglais. L'amorçage depuis `config.mts` s'applique uniquement tant que ces chaînes anglaises sont encore en ligne dans la configuration. Après que `themeConfigFor` ait lu le catalogue, `mergeThemeCatalogs` conserve le fichier existant, et `theme.en.json` est la source de vérité. Modifiez ce fichier lorsque le libellé change (ou remettez l'anglais dans `config.mts` pour un `sync`). Renommer une clé modifie le hachage du segment (`path`, un octet NUL, puis la valeur), de sorte que le prochain `sync` retraduise cette chaîne une fois pour chaque locale cible.
- **`outputPathTemplate`** (facultatif) — sorties par locale ; par défaut : même répertoire que `catalogPath` avec `theme.{locale}.json`.

`init -t ui-vitepress` échafaude également les fichiers de démarrage `docs/.vitepress/config.mts` et `docs/.vitepress/i18n/theme.en.json` lorsque ces fichiers n'existent pas encore. La configuration charge le catalogue via `loadTheme()` et connecte les étiquettes i18n standard de VitePress (y compris `langMenuLabel`) dans `themeConfigFor()`.

Chargez le fichier par paramètre régional dans `.vitepress/config.mts` via `loadTheme()` et construisez `locales[code].themeConfig` à partir du JSON traduit. Voir [examples/vitepress-docs/docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts).

**Chaînes du menu de langue :** `locales[code].label` est le nom visible de chaque langue dans le menu déroulant (par exemple `Português (Brasil)`). `themeConfig.langMenuLabel` est l'**aria-label** sur le bouton de changement de langue. VitePress utilise `Change language` lorsque l'option est omise. Le catalogue d'exemple stocke `Language` à la place, et `theme.en.json` ainsi que `config.hardcoded.example.mts` utilisent cette même phrase. Placez `langMenuLabel` dans le catalogue de thèmes et connectez `langMenuLabel: t.langMenuLabel` à l'intérieur de `themeConfigFor()` — ne le confondez pas avec les chaînes `label` par locale.

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

<details class="agent-prompt">
<summary>Invite du catalogue de thèmes</summary>

````markdown
# Load VitePress theme strings from the catalog

## Context

ai-i18n-tools translates VitePress chrome through
`docsOutput.vitepressThemeCatalog`. `extractVitepressThemeCatalog` writes
positional keys while English is still inline in `config.mts`
(`themeConfig.nav.0.text`, `themeConfig.sidebar.0.items.0.text`,
`locales.root.label`). The runnable example uses stable names instead
(`nav.guide`, `sidebar.gettingStarted`, `site.title`):
https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts

Reshape to named keys once and keep those names. Renaming changes the segment
hash, so the next `sync` re-translates the theme catalog for every locale (a few
dozen short strings, once). After the refactor, `config.mts` has no inline
display literals, `mergeThemeCatalogs` keeps `theme.en.json`, and that file is
the source of truth. Do not tell the user to refresh the catalog from
`config.mts` after this edit.

`translate-docs` does not rewrite links in `config.mts`. Locale pages must
prefix `link` and `activeMatch` or they point at English routes.

## Scope

Edit `.vitepress/config.mts` and `theme.en.json` only. Skip markdown bodies,
route paths, `base`, search provider choice, collapsed flags, and external URLs.

## Call shape

Precondition: `docsOutput.vitepressThemeCatalog` is set and `sync` has already
written `catalogPath`. If `theme.en.json` is missing, stop and ask for that
`sync` first.

1. Add `ai-i18n-tools` as a devDependency. Import
   `prefixVitepressThemeConfigLinks` from `ai-i18n-tools`.
2. Add `loadTheme(localeFile)` that reads `docs/.vitepress/i18n/` via
   `import.meta.url` and `fileURLToPath`. If a locale file is missing
   (`fs.existsSync`), fall back to the English theme so a fresh checkout does
   not crash before the first translation.
3. Rename positional keys in `theme.en.json` to short stable names. Update
   `themeConfigFor` to read those names. Keep links and structure in TypeScript.
   Only display strings come from the catalog.
4. If you keep positional keys instead, read them with string indexes:
   `t.themeConfig.nav["0"].text`. A numeric index `nav[0]` is invisible to the
   unused-key check and warns for every nav and sidebar entry.
5. Wrap the object `themeConfigFor` returns with
   `prefixVitepressThemeConfigLinks(themeConfig, localeRoutePrefix)`. Pass
   `/${code}` for each target locale and `null` for root. That prefixes `link`
   and `activeMatch`.
6. Per locale entry: `label` (native language name), `lang`,
   `link: '/${code}/'`, and that locale's `title` and `description` from the
   catalog.
7. Keys the extractor does not collect must be added to `theme.en.json` by hand,
   then referenced from `themeConfigFor`. That includes local-search copy under
   `search.options.locales.<code>.translations` (`button.buttonText`,
   `modal.noResultsText`, and the rest of that tree). Current VitePress docs do
   not use `options.placeholder` for local search. Also add
   `socialLinks[].ariaLabel`. A `notFound.title` inline in config is collected
   because `title` is a known key; `notFound.quote`, `notFound.linkText`,
   `notFound.linkLabel`, and `notFound.code` are not.

## Order

1. Confirm the catalog file exists.
2. Reshape keys, wire `loadTheme` and `themeConfigFor`, prefix links.
3. Ask the user to run `sync` so locale theme files are regenerated from the new
   key names. Do not hand-translate them.

## Do not

- Do not translate strings yourself.
- Do not leave a second copy of the same label in `config.mts` and in
  `theme.en.json`.
- Do not hand-edit `theme.<locale>.json`.
- Do not change markdown paths, `base`, or the path of internal links (only the
  locale prefix).

## Verify

- `pnpm docs:dev`: English and one target locale show translated nav, sidebar,
  footer, and search chrome.
- A locale page's nav `link` and `activeMatch` include the locale prefix
  (`/pt-BR/guide/`, not `/guide/`).
- `pnpm docs:build` passes.
- Removing a locale theme file still builds, because `loadTheme` falls back to
  English.

## Report back

List files changed, the old path key and the new name for each rename, any
string you added by hand because the extractor skips it, and anything you left
inline on purpose.
````

</details>

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

**Ce dépôt** conserve `README.md` et `docs/index.md` en tant que **fichiers indépendants** : le README est une page d’accueil GitHub/npm concise ; `docs/index.md` est le point d’entrée du site de documentation qui renvoie vers `/guide/` et `/reference/`. Les guides détaillés se trouvent sous `docs/` — ne dupliquez pas de longs documents de référence dans le README. Mettez à jour chacun d’eux en fonction de son public lorsque les faits partagés changent.

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

| Auteur dans la locale source | Après normalisation (sortie racine de la locale source) | Après normalisation (sortie `docs/<locale>/` traduite) |
|--------------------------|----------------------------------------|------------------------------------------------------|
| `[JSON](/fr/guide/json)` | `[JSON](/fr/guide/json)` | `[JSON](/pt-BR/guide/json)` (le préfixe de locale correspond au dossier) |
| `[Quick start](/fr/guide/quick-start)` dans le corps ou `hero.actions[].link` | inchangé (`/guide/quick-start`) | `/pt-BR/guide/quick-start` |
| `[Home](./README.md)` sur l'index de la locale | `/` | `/pt-BR/` |
| `hero.image.src: /ai-i18n-tools_logo.svg` | inchangé | inchangé (ressource partagée `docs/public/`) |
| `[Demo](https://github.com/org/repo/tree/main/examples/console-app/)` | inchangé (URL complète) | inchangé (URL complète) |

Les fichiers de la locale source sous `docs/` conservent les routes de site **neutres en locale** (`/guide/…`). Cet exemple utilise l'anglais comme `sourceLocale`. Toute langue est valide. Les fichiers écrits dans `docs/<locale>/…` obtiennent automatiquement le préfixe de locale sur les routes de contenu internes — y compris le **frontmatter de la mise en page d'accueil** (`hero.actions[].link`, `features[].link`, `prev`/`next`). Les ressources publiques partagées telles que `/ai-i18n-tools_logo.svg` et `/translation-dashboard.png` restent sans préfixe pour chaque locale.

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

- Liens inter-pages de la documentation : utilisez les **routes du site** (`/guide/…`, `/reference/…`) dans le markdown en anglais sous `docs/`, ou les chemins `docs/guide/…` lors de la rédaction d'un README qui sera synchronisé dans `docs/index.md` d'un autre projet.
- Démonstrations exécutables, `LICENSE` et autres fichiers du dépôt : utilisez les **URL GitHub complètes** dans `README.md` et dans la documentation (voir [README et page d'accueil de la documentation](#readme-and-the-docs-homepage)).
- Ne modifiez **pas** manuellement les liens dans `docs/<locale>/` — régénérez-les avec `sync` / `translate-docs`.

Voir aussi [Réécriture de liens](/fr/guide/images-and-screenshots/link-rewriting) (plat vs VitePress) et [Configuration — `docsOutput`](/fr/reference/configuration#docsoutput).
