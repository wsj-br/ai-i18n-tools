<a id="vitepress-integration"></a>
# VitePress integration

Use `init -t ui-vitepress` and `docsOutput.style: "vitepress"` for [VitePress](https://vitepress.dev/) documentation sites. The preset is an alias for `doc-system` with an empty `localeSubpath` and BCP-47 locale folder names preserved (`localePathLowercase` defaults to `false`, so folders stay `pt-BR`, `zh-Hans`, etc.).

See also [Documents](/guide/documents/) and the runnable [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) demo. This repository's own documentation site under `docs/` is a full VitePress + ai-i18n-tools reference (nine locales, theme catalog, GitHub Pages).

<a id="quick-start"></a>
## Quick start

```bash
ai-i18n-tools init -t ui-vitepress -P anthropic
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm run docs:build  # VitePress build (project-specific script)
```

Enable `features.translateDocs` when you translate page content and VitePress chrome strings in one `sync` run.

<a id="page-layout"></a>
## Page layout

English markdown lives at the VitePress content root (typically `docs/`). Translated copies are written beside the source tree:

```text
docs/index.md           →  docs/de/index.md
docs/guide/quick-start.md  →  docs/de/guide/quick-start.md
```

Configure one `docs[]` block:

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

Point `contentPaths` at your English `.md` files and directories. Set `docsRoot` to the same folder VitePress uses as its content root.

Wire VitePress [internationalization](https://vitepress.dev/guide/i18n): English at `root`, each target locale under `locales[code].link` (for example `/pt-BR/`). Keep `targetLocales` in `ai-i18n-tools.config.json` aligned with the `locales` keys in `.vitepress/config.mts`.

<a id="enable-i18n-in-an-existing-site"></a>
### Enable i18n in an existing site

An English-only VitePress config needs these pieces before translated pages show up. The [agent prompt](#wire-configmts-to-generated-theme-json-one-off) covers the theme-catalog half.

- `locales.root` for English (`label`, `lang`, and `themeConfig`).
- One `locales[code]` entry per target locale: `label`, `lang`, `link: '/${code}/'`, and per-locale `title` / `description`.
- `themeConfig` links and `activeMatch` prefixed per locale with `prefixVitepressThemeConfigLinks` (see [Theme nav/sidebar links](#theme-navsidebar-links)).
- `targetLocales` aligned with those `locales` keys, then `sync` so `docs/<locale>/` and `theme.<locale>.json` exist.

<a id="theme-strings"></a>
## Theme strings

VitePress nav, sidebar, footer, search placeholder, and other `themeConfig` labels are not extracted from markdown. Configure **`docsOutput.vitepressThemeCatalog`** so **`translate-docs`** bootstraps the English catalog from `.vitepress/config.mts` (when strings are inline) and translates locale theme JSON files:

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

- **`catalogPath`** — English nested JSON. The bootstrap from `config.mts` applies only while those English strings are still inline in the config. After `themeConfigFor` reads the catalog, `mergeThemeCatalogs` keeps the existing file, and `theme.en.json` is the source of truth. Edit that file when the wording changes (or put the English back into `config.mts` for one `sync`). Renaming a key changes the segment hash (`path`, a NUL byte, then the value), so the next `sync` re-translates that string once for every target locale.
- **`outputPathTemplate`** (optional) — per-locale outputs; default: same directory as `catalogPath` with `theme.{locale}.json`.

`init -t ui-vitepress` also scaffolds starter `docs/.vitepress/config.mts` and `docs/.vitepress/i18n/theme.en.json` when those files do not exist yet. The config loads the catalog via `loadTheme()` and wires standard VitePress i18n labels (including `langMenuLabel`) in `themeConfigFor()`.

Load the per-locale file in `.vitepress/config.mts` via `loadTheme()` and build `locales[code].themeConfig` from the translated JSON. See [examples/vitepress-docs/docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts).

**Language menu strings:** `locales[code].label` is the visible name of each language in the dropdown (for example `Português (Brasil)`). `themeConfig.langMenuLabel` is the **aria-label** on the language-switcher button. VitePress uses `Change language` when the option is omitted. The example catalog stores `Language` instead, and both `theme.en.json` and `config.hardcoded.example.mts` use that same sentence. Put `langMenuLabel` in the theme catalog and wire `langMenuLabel: t.langMenuLabel` inside `themeConfigFor()` — do not confuse it with per-locale `label` strings.

During `sync` / `translate-docs`, ai-i18n-tools warns when a catalog key in `theme.en.json` is not referenced from `config.mts` (for example a missing `t.langMenuLabel` in `themeConfigFor()`).

**Do not** use `json[]` for VitePress theme strings — that pattern is for unrelated app locale bundles only.

<a id="wire-configmts-to-generated-theme-json-one-off"></a>
## Wire config.mts to generated theme JSON (one-off)

After the first successful `i18n:sync` / `translate-docs` run with `vitepressThemeCatalog`, the repo has generated `theme.en.json` and `theme.{locale}.json`, but an **existing** site may still have hardcoded `text:` / `message:` strings in `config.mts`. VitePress will not use translated JSON until config loads it via `loadTheme()`.

**Not in tool scope:** automatic codemod. Use the prompt below once per project (or refactor manually using the example config).

1. **When** — after first sync produced `catalogPath` and locale theme files; before expecting translated nav/sidebar in dev/build.
2. **Keep unchanged** — route links (`/guide/…`), locale keys, `defineConfig` structure, non-string options (search provider, collapsed flags).
3. **Reference** — [examples/vitepress-docs/docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts) and generated `theme.en.json` shape.
4. **Verify** — `pnpm docs:dev`, switch locale in nav, confirm sidebar/footer/search placeholder translate; `pnpm docs:build` passes.

**Example AI agent prompt** (copy into Cursor or another coding agent):

<details class="agent-prompt">
<summary>Theme catalog prompt</summary>

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
## Example project

[examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) — English sources at `docs/`, committed `pt-BR` and `zh-Hans` page trees, plus `theme.pt-BR.json` / `theme.zh-Hans.json`. Run `pnpm run docs:dev` on port 3060.

<a id="readme-and-the-docs-homepage"></a>
## README and the docs homepage

Downstream projects sometimes copy `README.md` into the VitePress site as `docs/index.md` (via a build script or manual sync). That pattern shares one file between GitHub and the documentation site, but link rules differ:

| Link type | Works on GitHub | Works on VitePress |
|-----------|-----------------|-------------------|
| `docs/guide/foo.md` | Yes | No — use site routes or let the normalizer rewrite during sync |
| `./LICENSE`, `examples/demo/` | Yes (repo-relative) | No — use **full URLs** |
| `/guide/foo` | No | Yes |

**Recommendation for synced README → index:** In `README.md`, use **full URLs** for anything outside the VitePress content tree (`LICENSE`, `examples/`, config files, agent context files) and for translated README copies under `translated-docs/`. Use `docs/guide/…` paths (or site routes in English docs under `docs/`) for in-site documentation links; a sync script or `rewriteVitepressLinks` normalizer can convert those to `/guide/…` routes.

**This repository** keeps `README.md` and `docs/index.md` as **independent files**: README is a concise GitHub/npm landing page; `docs/index.md` is the docs-site entry point that links into `/guide/` and `/reference/`. Detailed guides live under `docs/` — do not duplicate long reference material in the README. Update each according to its audience when shared facts change.

Example links for a synced README in another project:

```markdown
[console-app demo](https://github.com/your-org/your-repo/tree/main/examples/console-app/)
[License](https://github.com/your-org/your-repo/blob/main/LICENSE)
[Quick start](docs/guide/quick-start.md)
```

<a id="link-conventions"></a>
## Link conventions

VitePress serves English pages from the content root and locale copies from `docs/<locale>/…`, but **in-page links must use site routes** (`/guide/quick-start`, `/reference/configuration`) — not repo-relative paths like `docs/guide/quick-start.md` or `../guide/quick-start.md`. Those README-style paths work in GitHub but break inside VitePress (404 in dev and on GitHub Pages).

Enable the built-in normalizer so `translate-docs` fixes links in every translated file automatically:

```json
"docsOutput": {
  "style": "vitepress",
  "docsRoot": "docs",
  "rewriteVitepressLinks": true
}
```

`rewriteVitepressLinks` defaults to enabled when `style` is `"vitepress"`.

| Author in English source | After normalizer (English root output) | After normalizer (translated `docs/<locale>/` output) |
|--------------------------|----------------------------------------|------------------------------------------------------|
| `[JSON](docs/guide/json.md)` | `[JSON](/guide/json)` | `[JSON](/pt-BR/guide/json)` (locale prefix matches folder) |
| `[Quick start](/guide/quick-start)` in body or `hero.actions[].link` | unchanged (`/guide/quick-start`) | `/pt-BR/guide/quick-start` |
| `[Home](./README.md)` on locale index | `/` | `/pt-BR/` |
| `hero.image.src: /ai-i18n-tools_logo.svg` | unchanged | unchanged (shared `docs/public/` asset) |
| `[Demo](https://github.com/org/repo/tree/main/examples/console-app/)` | unchanged (full URL) | unchanged (full URL) |

English root sources under `docs/` keep **locale-neutral** site routes (`/guide/…`). Files written to `docs/<locale>/…` get the locale prefix on internal content routes automatically — including **home layout frontmatter** (`hero.actions[].link`, `features[].link`, `prev`/`next`). Shared public assets such as `/ai-i18n-tools_logo.svg` and `/translation-dashboard.png` stay unprefixed on every locale.

<a id="theme-navsidebar-links"></a>
### Theme nav/sidebar links

`translate-docs` does **not** rewrite links in `.vitepress/config.mts`. Navbar and sidebar `link` values are authored once in TypeScript and must be prefixed per locale at config build time.

VitePress [`themeConfig.i18nRouting`](https://vitepress.dev/reference/default-theme-config#i18nrouting) only controls the **locale switcher** (mapping the equivalent page when the user picks another language). It does **not** rewrite static `nav` / `sidebar` hrefs on the current locale page.

Use `prefixVitepressThemeConfigLinks` from `ai-i18n-tools` (same prefix rules as markdown link rewriting):

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

Prefix **`activeMatch`** alongside **`link`** so nav highlighting works on locale routes (`/pt-BR/guide/` not `/guide/`). External URLs and shared public assets stay unchanged.

Add `ai-i18n-tools` as a **devDependency** in the VitePress project (see `examples/vitepress-docs/package.json`) so `config.mts` can import `prefixVitepressThemeConfigLinks`. The main ai-i18n-tools documentation site imports from `src/processors/…` directly because it dogfoods the monorepo checkout; standalone copies (degit) should use the npm package.

**Authoring rules**

- Cross-page doc links: use **site routes** (`/guide/…`, `/reference/…`) in English markdown under `docs/`, or `docs/guide/…` paths when authoring a README that will be synced into `docs/index.md` in another project.
- Runnable demos, `LICENSE`, and other repo files: use **full GitHub URLs** in `README.md` and in docs (see [README and the docs homepage](#readme-and-the-docs-homepage)).
- Do **not** hand-edit links in `docs/<locale>/` — regenerate with `sync` / `translate-docs`.

See also [Link rewriting](/guide/images-and-screenshots/link-rewriting) (flat vs VitePress) and [Configuration — `docsOutput`](/reference/configuration#docsoutput).
