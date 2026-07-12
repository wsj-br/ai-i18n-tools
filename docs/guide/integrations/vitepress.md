<a id="vitepress-integration"></a>
# VitePress integration

Use `init -t ui-vitepress` and `docsOutput.style: "vitepress"` for [VitePress](https://vitepress.dev/) documentation sites. The preset is an alias for `doc-system` with an empty `localeSubpath` and BCP-47 locale folder names preserved (`localePathLowercase` defaults to `false`, so folders stay `pt-BR`, `zh-Hans`, etc.).

See also [Documents](/guide/documents/) and the runnable [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) demo. This repository's own documentation site under `docs/` is a full VitePress + ai-i18n-tools reference (nine locales, theme catalog, GitHub Pages).

<a id="quick-start"></a>
## Quick start

```bash
ai-i18n-tools init -t ui-vitepress [-P <provider>]
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

- **`catalogPath`** — generated English nested JSON (bootstrap output). Authors do not maintain this file by hand when English lives in `config.mts`; re-run `sync` to refresh it.
- **`outputPathTemplate`** (optional) — per-locale outputs; default: same directory as `catalogPath` with `theme.{locale}.json`.

`init -t ui-vitepress` also scaffolds starter `docs/.vitepress/config.mts` and `docs/.vitepress/i18n/theme.en.json` when those files do not exist yet. The config loads the catalog via `loadTheme()` and wires standard VitePress i18n labels (including `langMenuLabel`) in `themeConfigFor()`.

Load the per-locale file in `.vitepress/config.mts` via `loadTheme()` and build `locales[code].themeConfig` from the translated JSON. See [examples/vitepress-docs/docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts).

**Language menu strings:** `locales[code].label` is the visible name of each language in the dropdown (for example `Português (Brasil)`). `themeConfig.langMenuLabel` is the **aria-label** on the language-switcher button (VitePress default: `Change language`). Put `langMenuLabel` in the theme catalog and wire `langMenuLabel: t.langMenuLabel` inside `themeConfigFor()` — do not confuse it with per-locale `label` strings.

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

**This repository** keeps `README.md` and `docs/index.md` as **independent files**: README is the full npm/GitHub landing; `docs/index.md` is a slim docs-site entry point that links into `/guide/` and `/reference/`. Update each according to its audience when shared facts change.

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
| `hero.image.src: /logo.svg` | unchanged | unchanged (shared `docs/public/` asset) |
| `[Demo](https://github.com/org/repo/tree/main/examples/console-app/)` | unchanged (full URL) | unchanged (full URL) |

English root sources under `docs/` keep **locale-neutral** site routes (`/guide/…`). Files written to `docs/<locale>/…` get the locale prefix on internal content routes automatically — including **home layout frontmatter** (`hero.actions[].link`, `features[].link`, `prev`/`next`). Shared public assets such as `/logo.svg` and `/translation-dashboard.png` stay unprefixed on every locale.

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
- Runnable demos, `LICENSE`, and other repo files: use **full GitHub URLs** in `README.md` and in docs (see [README and the docs homepage](#readme-as-the-docs-homepage)).
- Do **not** hand-edit links in `docs/<locale>/` — regenerate with `sync` / `translate-docs`.

See also [Link rewriting](/guide/images-and-screenshots/link-rewriting) (flat vs VitePress) and [Configuration — `docsOutput`](/reference/configuration#docsoutput).
