# Examples

Runnable projects and fixtures that show how to use [ai-i18n-tools](../README.md) in real applications. Each subdirectory focuses on a different use case, framework, or testing scenario.

Most examples need an LLM API key (typically [OpenRouter](https://openrouter.ai/)) when you re-run translation. Committed locale files and translated docs are included so you can explore outputs without calling the API first.

## Before you start

### Run one example standalone (`npx degit`)

Each folder under `examples/` can be copied without cloning the full repository. Every example declares `"ai-i18n-tools": "^1.7.2"` and installs the CLI from npm. Copy the example, install dependencies, then follow that example's README for run and translation commands:

```bash
npx degit wsj-br/ai-i18n-tools/examples/<name> <name>
cd <name>
pnpm install
```

Replace `<name>` with one of the folders below. Each example README repeats the same three commands with the folder name filled in, then documents how to run it (for example `pnpm start`, `pnpm dev`, or `pnpm run docs:dev`).

| Example | Copy with degit |
| --- | --- |
| [console-app](./console-app/) | `npx degit wsj-br/ai-i18n-tools/examples/console-app console-app` |
| [nextjs-app](./nextjs-app/) | `npx degit wsj-br/ai-i18n-tools/examples/nextjs-app nextjs-app` |
| [astro-website](./astro-website/) | `npx degit wsj-br/ai-i18n-tools/examples/astro-website astro-website` |
| [astro-docs](./astro-docs/) | `npx degit wsj-br/ai-i18n-tools/examples/astro-docs astro-docs` |
| [vitepress-docs](./vitepress-docs/) | `npx degit wsj-br/ai-i18n-tools/examples/vitepress-docs vitepress-docs` |
| [multi-provider](./multi-provider/) | `npx degit wsj-br/ai-i18n-tools/examples/multi-provider multi-provider` |
| [test-markdown](./test-markdown/) | `npx degit wsj-br/ai-i18n-tools/examples/test-markdown test-markdown` |

### From the full ai-i18n-tools repository

If you cloned the **whole** [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools) repository, install from the **repository root**:

```bash
pnpm install
pnpm run build
```

Examples listed as **workspace packages** in [`pnpm-workspace.yaml`](../pnpm-workspace.yaml) declare `"ai-i18n-tools": "^1.7.2"` in their `package.json`. When you install from the **monorepo root**, the workspace [`overrides`](../pnpm-workspace.yaml) entry (`ai-i18n-tools: workspace:*`) forces that dependency to the local workspace copy, so edits to the library are picked up without a manual link step. **Standalone fixtures** (`multi-provider`, `test-markdown`) use the same published semver range and install `ai-i18n-tools` into their own `node_modules`.

| Example                             | Type               | Translation types                        | Framework / runtime              |
|-------------------------------------|--------------------|------------------------------------------|----------------------------------|
| [console-app](./console-app/)       | Workspace app      | UI strings + flat README docs            | Node.js console (i18next)        |
| [nextjs-app](./nextjs-app/)         | Workspace app      | UI + SVG + Docusaurus docs + flat README | Next.js + nested Docusaurus site |
| [astro-website](./astro-website/)   | Workspace app      | UI + `.astro` page HTML (hybrid)         | Astro (static marketing site)    |
| [astro-docs](./astro-docs/)         | Workspace app      | Starlight / MDX docs only                | Astro Starlight                  |
| [vitepress-docs](./vitepress-docs/) | Workspace app      | VitePress docs only (`vitepress` preset) | VitePress                        |
| [multi-provider](./multi-provider/) | Standalone fixture | Document translation only                | CLI (compare LLM providers)      |
| [test-markdown](./test-markdown/)   | Standalone fixture | Document translation only                | CLI (markdown stress test)       |

Each example has its own README with setup, commands, and project layout. Use the links above for full walkthroughs.

---

## [console-app](./console-app/)

Minimal **Node.js console application** using i18next and `t()` for UI strings.

**What it demonstrates**

- UI strings: `extract` → `translate-ui` → flat JSON in `locales/`
- Documents: translate `README.md` into `translated-docs/` (flat markdown output)
- Runtime locale switching with `--locale`
- Simple glossary and `ui-languages.json` manifest

**Good starting point if** you want the smallest end-to-end app (no web framework) or a README-only document translation config.

→ [console-app/README.md](./console-app/README.md)

---

## [nextjs-app](./nextjs-app/)

**Next.js** (TypeScript) app on port 3030, plus a nested **Docusaurus** docs site on port 3040.

**What it demonstrates**

- UI extraction from React/TSX and flat bundles under `public/locales/`
- Cardinal plurals (`t("…", { plurals: true, count })`)
- SVG translation (`translate-svg`) with per-locale assets in `public/assets/`
- Docusaurus doc pages (`docsOutput.style: "docusaurus"`) and shell JSON catalogs
- Flat README translations in `translated-docs/`
- Translation dashboard (`i18n:dashboard`)
- Locale-specific screenshot URL rewriting (config demo; PNGs not committed)

**Good starting point if** you use React/Next.js, need Docusaurus integration, or want to see UI + docs + SVG in one config.

→ [nextjs-app/README.md](./nextjs-app/README.md) · [docs-site/README.md](./nextjs-app/docs-site/README.md)

---

## [astro-website](./astro-website/)

**Astro marketing site** that combines Astro built-in i18n routing with two translation pipelines on the same page.

**What it demonstrates**

- **Pipeline 1 — `translate-docs`:** English source at `src/pages/index.astro`; locale copies under `src/pages/{locale}/`
- **Pipeline 2 — `t()` + `translate-ui`:** Frontmatter data (e.g. screenshot tab labels) via flat JSON in `public/locales/`
- `markdownOutput.style: "astro-starlight"` for `.astro` page output
- Keeping `targetLocales`, `astro.config.mjs` `i18n.locales`, and `ui-languages.json` in sync
- Build-time `t()` lookup without `ai-i18n-tools/runtime`

**Good starting point if** you have a static Astro site and need both full-page HTML translation and dynamic UI strings on the same pages.

→ [astro-website/README.md](./astro-website/README.md)

---

## [astro-docs](./astro-docs/)

Multilingual **Astro Starlight** documentation site (port 3050).

**What it demonstrates**

- English sources at `src/content/docs/`; committed translations under `src/content/docs/<locale>/`
- `markdownOutput.style: "astro-starlight"` (same content model as Docusaurus demo, different layout)
- RTL locale (`ar`) and glossary-driven translation
- Locale-specific screenshot path rewriting in MDX (config demo; PNGs not committed)

Compare with [`nextjs-app/docs-site/`](./nextjs-app/docs-site/) — same tutorial topics, Docusaurus output style instead of Starlight.

**Good starting point if** you document a product with Starlight and want committed translated MDX in the repo.

→ [astro-docs/README.md](./astro-docs/README.md)

---

## [vitepress-docs](./vitepress-docs/)

Minimal **[VitePress](https://vitepress.dev/)** documentation site (port 3060) using `docsOutput.style: "vitepress"`.

**What it demonstrates**

- English sources at `docs/`; committed translations under `docs/pt-BR/` and `docs/zh-Hans/` only (small demo locale set)
- Same content model as the main package docs site, with two target locales for a quick read
- `init -t ui-vitepress` style config and `pnpm run i18n:sync` to refresh translations

**Good starting point if** you document a product with VitePress and want committed translated markdown in the repo.

→ [vitepress-docs/README.md](./vitepress-docs/README.md)

---

## [multi-provider](./multi-provider/)

Minimal fixture for **comparing LLM providers** on the same Portuguese markdown document.

**What it demonstrates**

- Multiple providers in one config (`openai`, `anthropic`, `nvidia`, `deepseek`)
- Switching provider per run with `-P` / `--provider`
- `check-models`, `list-models`, and `bench-models` against live provider catalogs
- Document translation only — no UI extraction

**Good starting point if** you are choosing a model or provider, or validating that configured model IDs still exist.

→ [multi-provider/README.md](./multi-provider/README.md)

---

## [test-markdown](./test-markdown/)

Markdown **stress-test fixture** for the document translation pipeline.

**What it demonstrates**

- Default config (`ai-i18n-tools.config.json`) runs Portuguese markdown plus MDX placeholder stress test together; English config covers the `en-GB` → CJK / Devanagari pair
- Hard cases for CJK and Devanagari targets: nested emphasis, code inside formatting, tables, long mixed paragraphs; plus Docusaurus MDX, admonitions, and every placeholder kind
- `check-markdown` on each config
- Targets include `ja`, `ko`, `zh-Hans`, `hi`, and cross-locale pairs (`pt-BR` ↔ `en-GB`)

**Good starting point if** you are tuning markdown extraction, placeholders, or translation quality for non-Latin scripts.

→ [test-markdown/README.md](./test-markdown/README.md)

---

## Choosing an example

| Your goal | Start here |
| --- | --- |
| Smallest working app with `t()` and README translation | [console-app](./console-app/) |
| React / Next.js + plurals + dashboard | [nextjs-app](./nextjs-app/) |
| Docusaurus docs + flat README + SVG assets | [nextjs-app](./nextjs-app/) |
| Astro landing page (HTML + `t()` hybrid) | [astro-website](./astro-website/) |
| Astro Starlight docs site | [astro-docs](./astro-docs/) |
| VitePress docs site | [vitepress-docs](./vitepress-docs/) |
| Pick or benchmark an LLM provider | [multi-provider](./multi-provider/) |
| Regression-test markdown / CJK translation | [test-markdown](./test-markdown/) |

For conceptual background (catalog vs flat bundles, translation overview, config schema), see the [documentation site](https://wsj-br.github.io/ai-i18n-tools/) and [docs/ai-i18n-tools-context.md](../docs/ai-i18n-tools-context.md).
