<a id="vitepress-integration"></a>
# VitePress integration

Use `init -t ui-vitepress` and `docsOutput.style: "vitepress"` for [VitePress](https://vitepress.dev/) documentation sites. The preset is an alias for `doc-system` with an empty `localeSubpath` and BCP-47 locale folder names preserved (`localePathLowercase` defaults to `false`, so folders stay `pt-BR`, `zh-Hans`, etc.).

See also [Documents](/guide/documents/), [JSON](/guide/json) (theme strings), and the runnable [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) demo. This repository's own documentation site under `docs/` is a full VitePress + ai-i18n-tools reference (nine locales, theme JSON, GitHub Pages).

<a id="quick-start"></a>
## Quick start

```bash
npx ai-i18n-tools init -t ui-vitepress
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm run docs:build  # VitePress build (project-specific script)
```

Enable both `features.translateDocs` and `features.translateJson` when you translate page content and VitePress chrome strings in one `sync` run.

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

VitePress nav, sidebar, footer, search placeholder, and other `themeConfig` labels are not extracted from markdown. Author a nested JSON catalog (for example `docs/.vitepress/i18n/theme.en.json`) and translate it with JSON:

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

Load the per-locale file in `.vitepress/config.mts` and build `locales[code].themeConfig` from the translated JSON (nav text, sidebar group titles, footer message, and so on). Do not hard-code translated labels in `config.mts` — regenerate them with `sync` / `translate-json` when English changes.

This package loads `theme.{locale}.json` in [docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/.vitepress/config.mts); compare with [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) for a minimal two-locale setup.

<a id="docusaurus-vs-vitepress-shell-json"></a>
## Docusaurus vs VitePress shell JSON

| Framework | Shell / theme strings | Pipeline |
|-----------|----------------------|----------|
| Docusaurus | `write-translations` catalog (`{ message, description }`) | Documents — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | Custom nested JSON catalog you author | JSON — `json[]` + `translate-json` (or `sync` when `translateJson` is on) |

Do not put VitePress theme JSON in `docs[]`; use `json[]` instead.

<a id="example-project"></a>
## Example project

[examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) — English sources at `docs/`, committed `pt-BR` and `zh-Hans` page trees, plus `theme.pt-BR.json` / `theme.zh-Hans.json`. Run `pnpm run docs:dev` on port 3060.

<a id="readme-as-homepage"></a>
## README as the docs homepage

Some projects copy `README.md` into the VitePress site as `docs/index.md` (this repo uses `scripts/sync-readme-to-docs.mjs` before `docs:build`). That pattern shares one file between GitHub and the documentation site, but link rules differ:

| Link type | Works on GitHub | Works on VitePress |
|-----------|-----------------|-------------------|
| `docs/guide/foo.md` | Yes | No — use site routes or let the normalizer rewrite during sync |
| `./LICENSE`, `examples/demo/` | Yes (repo-relative) | No — use **full URLs** |
| `/guide/foo` | No | Yes |

**Recommendation:** In `README.md`, use **full URLs** for anything outside the VitePress content tree (`LICENSE`, `examples/`, config files, agent context files) and for translated README copies under `translated-docs/`. Use `docs/guide/…` paths (or site routes in English docs under `docs/`) for in-site documentation links; the sync script and `rewriteVitepressLinks` normalizer convert those to `/guide/…` routes.

Example:

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

| Author in English source | After normalizer |
|--------------------------|------------------|
| `[JSON](docs/guide/json.md)` | `[JSON](/guide/json)` |
| `[Home](./README.md)` on locale index | `/` |
| `[Demo](https://github.com/org/repo/tree/main/examples/console-app/)` | unchanged (full URL) |

**Authoring rules**

- Cross-page doc links: use **site routes** (`/guide/…`, `/reference/…`) in English markdown under `docs/`, or `docs/guide/…` paths when syncing from `README.md`.
- Runnable demos, `LICENSE`, and other repo files: use **full GitHub URLs** in `README.md` and in docs (see [README as the docs homepage](#readme-as-homepage)).
- Do **not** hand-edit links in `docs/<locale>/` — regenerate with `sync` / `translate-docs`.

See also [Link rewriting](/guide/images-and-screenshots/link-rewriting) (flat vs VitePress) and [Configuration — `docsOutput`](/reference/configuration#docsoutput).
