<a id="astro-integration"></a>
# Astro integration

Use ai-i18n-tools with [Astro](https://astro.build/) in two common setups: **Astro Starlight** documentation sites and **plain Astro** marketing or app sites. Both use Documents (`translate-docs`) for page content; plain Astro sites often combine that with UI strings (`extract` / `translate-ui`) for `t()` strings in frontmatter and shared data.

See also [UI strings](/guide/ui-strings/astro-website#astro-website-plain-astro-not-starlight), [Documents](/guide/documents/), and the runnable examples below.

<a id="astro-starlight"></a>
## Astro Starlight

Use `init -t ui-starlight` and `docsOutput.style: "astro-starlight"` for [Astro Starlight](https://starlight.astro.build/) documentation sites. The preset is an alias for `doc-system` with an empty `localeSubpath` — translated pages land under `src/content/docs/<locale>/` beside the English source tree.

<a id="quick-start"></a>
### Quick start

```bash
ai-i18n-tools init -t ui-starlight [-P <provider>]
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm dev             # Starlight dev server (project-specific script)
```

<a id="page-layout"></a>
### Page layout

English markdown and MDX live at the Starlight content root (typically `src/content/docs/`). Translated copies are written beside the source tree:

```text
src/content/docs/quick-start.md     →  src/content/docs/de/quick-start.md
src/content/docs/guide/setup.mdx    →  src/content/docs/fr/guide/setup.mdx
```

Configure one `docs[]` block:

```json
{
  "contentPaths": ["src/content/docs/"],
  "outputDir": "src/content/docs",
  "docsOutput": {
    "style": "astro-starlight",
    "docsRoot": "src/content/docs"
  }
}
```

Point `contentPaths` at your English `.md` / `.mdx` files and directories. Set `docsRoot` to the same folder Starlight uses as its content root.

Starlight UI overrides can use `src/content/i18n/en.json` with `jsonPathTemplate` in a separate `docs[]` block when needed — see [Documents — initialise for documentation](/guide/documents/#step-1-initialise-for-documentation).

Starlight ships built-in UI strings for many locales (nav labels, search placeholder, table of contents, and so on). There is no separate shell/theme pipeline to configure — use `translate-docs` for page content only. For other frameworks, see [Framework shell translation](/guide/integrations/#framework-shell-translation).

<a id="example-project"></a>
### Example project

[examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) — English sources at `src/content/docs/`, committed translations under `src/content/docs/<locale>/`, RTL locale (`ar`), and glossary-driven translation. Run `pnpm dev` on port 3050.

<a id="plain-astro-marketing-and-app-sites"></a>
## Plain Astro (marketing and app sites)

For static Astro marketing or app sites (not Starlight), combine [Astro built-in i18n routing](https://docs.astro.build/en/guides/internationalization/) with ai-i18n-tools. The reference implementation is [examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website): English at `/`, target locales at `/{locale}/`.

Most teams use a **hybrid** of two pipelines on the same page:

| Pipeline | Use for | Commands | Output |
|----------|---------|----------|--------|
| **Page HTML** | Headings, paragraphs, nav labels, inline arrays in the template body | `translate-docs` | `src/pages/{locale}/index.astro` per locale |
| **UI strings (`t()`)** | Frontmatter data, tab labels, shared arrays | `extract` → `translate-ui` | `public/locales/{locale}.json` (English source as key) |

<a id="quick-start-1"></a>
### Quick start

```bash
ai-i18n-tools init -t ui-astro-website [-P <provider>]
# enable features.translateDocs and add a docs[] block for page HTML (see below)
pnpm run i18n:sync
pnpm dev
```

Scaffold UI extraction with `init -t ui-astro-website`, then merge in a `docs[]` block when you also translate page HTML:

```json
{
  "features": {
    "translateUIStrings": true,
    "translateDocs": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "public/locales/strings.json",
    "flatOutputDir": "public/locales/"
  },
  "docs": [{
    "contentPaths": ["src/pages/index.astro"],
    "outputDir": "src/pages",
    "docsOutput": {
      "style": "astro-starlight",
      "docsRoot": "src/pages"
    },
    "addFrontmatter": false
  }]
}
```

Keep three lists aligned when you add or remove a language: `targetLocales` in `ai-i18n-tools.config.json`, `i18n.locales` in `astro.config.mjs` (Astro uses **lowercase** route codes such as `pt-br`), and `ui-languages.json` (via `generate-ui-languages`). Flat bundle **filenames** use config casing (`pt-BR.json`); map Astro's `pt-br` route to that file via your manifest `code` field.

Resolve `t('…')` at **build time** by looking up the English source literal as the key — see `examples/astro-website/src/i18n/t.ts`. You do not need `ai-i18n-tools/runtime` or i18next for a static site unless you add client islands that switch language after load.

<a id="example-project-1"></a>
### Example project

[examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) — hybrid landing page with HTML via `translate-docs` and screenshot tab labels via `t()` + `translate-ui`.

<a id="example-projects"></a>
## Example projects

| Project | Use case | Port |
|---------|----------|------|
| [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) | Starlight documentation | 3050 |
| [examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) | Plain Astro marketing site (HTML + `t()` hybrid) | (see README) |

Compare [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) with [examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs) — similar tutorial content, Docusaurus output style instead of Starlight.
