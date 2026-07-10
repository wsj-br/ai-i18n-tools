# ai-i18n-tools 1.5.0 Release Notes

## Highlights

- **Astro support:** Translate `.astro` page templates via `translate-docs` (HTML text and attributes) and extract `t()` calls from frontmatter and template expressions; new `init -t ui-astro-website` template and `examples/astro-website` hybrid workflow (pages via `translate-docs`, UI strings via `extract` / `translate-ui`).
- **Config modernization:** CLI-aligned naming (`docs`, `translateDocs`, `docsOutput`, `docusaurusCatalogDir`); top-level `json[]` and `translate-json` for arbitrary nested JSON bundles; `{llocale}` path placeholder and `localePathLowercase` for locale folder casing; legacy keys auto-migrate on load.
- **Translation Dashboard:** The `editor` command is now `dashboard` (with `editor` kept as a hidden alias); internal implementation renamed for consistency.
- **Locale assets guide:** New `docs/LOCALE-ASSETS-GUIDE.md` documents Patterns A–E for screenshots and illustrated SVGs in translated docs.
- **Doc translation quality:** Selective YAML front matter translation; configurable `protectAttributes` / `protectKeys` for Astro and MDX; tiered CJK length-ratio checks; flat link rewriter fix for subdirectory outputs with `flatPreserveRelativeDir`.
- **Examples and docs:** Starlight `examples/astro-docs`, expanded Getting Started and agent context, hybrid Astro workflow documentation.

## Why this release matters

Version 1.5.0 brings first-class Astro i18n (static page translation plus optional `t()` UI bundles), simplifies config to match CLI terminology, and adds practical guidance for locale-specific assets—making it easier to localize Astro sites and mixed doc/UI workflows without hand-maintaining parallel file trees.

## Detailed Changes

- **Added**: tests — unit coverage for `astro-template-extractor`, `nested-json-extractor`, `parse-glossary-csv`, `markdown-source-diagnostics`, `ui-languages-master-direction`, and `translation-dashboard` (new `parse-glossary-csv` and `ui-languages-master-direction` test files; expanded existing dashboard and extractor tests).
- **Changed**: examples — `examples/astro-website` bumps `astro` to `^6.3.1` and `@astrojs/tailwind` to `^6.0.2` (aligned with `astro-docs`) so `pnpm audit` is clean without workspace overrides.
- **Added**: Dev tooling — `markdown-link-check` with `pnpm run lint:md` (same non-recursive markdown paths as before); root `.markdown-link-check.json` ignores `npmjs.com` (403 from bot blocking) and enables 429 retries.
- **Removed**: Dev tooling — `markdownlint-cli`, root `.markdownlint.json`, and `pnpm run lint:md:fix`.
- **Added**: output paths - `{llocale}` placeholder (lowercased locale) for docs `pathTemplate` / `jsonPathTemplate`, SVG `pathTemplate`, and `json[]` `outputPathTemplate`; `localePathLowercase` on `docsOutput` and `svg` for built-in layouts; `astro-starlight` and empty `localeSubpath` `doc-system` default `localePathLowercase` to `true`; `init -t ui-json-bundles` uses `{llocale}` in the default template.
- **Fixed**: translate-json - `{LOCALE}` in `outputPathTemplate` is now uppercased (was previously left unchanged).
- **Changed**: config - removed `features.extractUIStrings`; extraction runs automatically before `translate-ui`, `sync-ui`, and `sync` when `features.translateUIStrings` is enabled; standalone `extract` only requires non-empty `ui.sourceRoots`. Legacy `extractUIStrings` is stripped on load and config rewrite.
- **Changed**: config - CLI-aligned naming: `documentations` → `docs`, `features.translateMarkdown` → `translateDocs`, `docs[].markdownOutput` → `docsOutput`, `docs[].jsonSource` → `docusaurusCatalogDir`; legacy keys preprocess at load and auto-rewrite `ai-i18n-tools.config.json` when writable; `features.translateJSON` removed (Docusaurus catalog JSON runs during `translate-docs` when `docusaurusCatalogDir` is set and `translateDocs` is true).
- **Added**: config - top-level `json[]` and `features.translateJson` for arbitrary nested JSON bundles; `translate-json` CLI and `sync --no-json`; `init -t ui-json-bundles`; `NestedJsonExtractor` with `keyPolicy` allowlist/denylist/both (minimatch); shared `resolveContentPathEntries` for file, directory, and glob `contentPaths`.
- **Changed**: core - `markdown-output-normalize` renamed to `docs-output-normalize` (`DocsOutputConfig`, `normalizeDocsOutputStyle`); deprecated aliases retained on public exports.
- **Changed**: docs - `PACKAGE_OVERVIEW.md` documents `AstroTemplateExtractor`, `.astro` UI extraction via `ui-string-babel.ts`, Astro hybrid sites, `sync` pipeline order, init templates (`ui-astro-website`), and `ui.uiExtractor` naming.
- **Changed**: scripts - `pnpm pre-release` also builds `examples/astro-website`; example builds use `pnpm --dir` for `docs-site`, `astro-docs`, and `astro-website`.
- **Changed**: docs - `GETTING_STARTED.md`, `ai-i18n-tools-context.md`, and `examples/astro-website/README.md` document the hybrid Astro workflow (`translate-docs` for page HTML, `extract`/`translate-ui` for `t()`), correct example script names (`i18n:translate`), frontmatter wiring, locale list alignment, and `languagesManifestPath` for the manifest.
- **Changed**: examples - `examples/astro-website/ai-i18n-tools.config.json` sets `languagesManifestPath` to `src/i18n/ui-languages.json` so `generate-ui-languages` writes the manifest next to other i18n helpers.
- **Added**: scripts - `scripts/screenshot-translation-dashboard.sh` captures `docs/translation-dashboard.png` via `chromium-headless-shell` (starts `ai-i18n-tools dashboard --no-open` by default, or uses `BASE_URL` when the server is already running).
- **Changed**: docs - `docs/ai-i18n-tools-context.md` documents catalog (`strings.json`, MD5-8 ids) vs flat locale bundles (English source as key), Astro hybrid workflow, and common agent mistakes; `.cursor/rules/project.mdc` requires reading that file before code changes.
- **Fixed**: examples - `examples/astro-website` `makeT` looks up flat `public/locales/{locale}.json` by English source string keys (as written by `translate-ui`), not MD5 hashes, so locales such as `pt-BR` resolve screenshot labels correctly at build time.
- **Added**: examples - `examples/astro-website` screenshot tab labels use inline `t('…')` in `index.astro` frontmatter with `src/i18n/t.ts` / `utils.ts` (Astro recipe `useTranslations` + `Astro.currentLocale`) and flat bundles in `public/locales/`; hybrid workflow documented (HTML via `translate-docs`, UI strings via `extract` / `translate-ui`).
- **Added**: config - `documentations[].protectAttributes` and `documentations[].protectKeys` extend Astro `{expression}` protection lists (merged with built-in defaults) so projects can skip translation for custom JSX attributes and object keys without code changes.
- **Changed**: processors - `protectMdx` and `PlaceholderHandler` honor the same `documentations[].protectAttributes` / `protectKeys` during markdown and Astro segment translation (e.g. skip MDX `label` / `tooltip` extraction when listed); shared logic lives in `expression-attribute-protection.ts`.
- **Fixed**: extractors - `AstroTemplateExtractor` skips string literals that are values for protected JSX/HTML attributes (`class`, `id`, `style`, `data-*`, most `aria-*`, etc.) inside `{expression}` blocks so Tailwind classes and layout hooks are not sent to the translator.
- **Fixed**: processors - doc translation quality checks use tiered length-ratio floors for short source text so compact CJK labels (e.g. `Installation` → `安装`, `Open Source` → `开源`) no longer fail with `lengthRatio` errors.
- **Added**: extractors - `AstroTemplateExtractor` now extracts user-facing string literals inside template `{expression}` blocks (inline arrays, object fields like `title`/`desc`, nav labels) while skipping URLs, anchors, `t()` keys, and code-like strings; reassembly escapes quotes in translated values.
- **Fixed**: examples - `examples/astro-website/src/pages/index.astro` no longer contains a duplicated truncated copy of the page (build failed with a parse error); hero banner uses `transrewrt_banner.svg` to match `public/`.
- **Changed**: examples - `examples/astro-website` nav includes `LanguagePicker` on English, French, and Portuguese pages; Astro `i18n.locales` aligned with `fr` and `pt-br` (replacing unused `de`).
- **Added**: extractors - `AstroTemplateExtractor` parses `.astro` templates for user-facing HTML text and translatable attributes, then `translate-docs` writes per-locale page copies (parse-and-replace) without wrapping copy in `t()`.
- **Added**: cli - `translate-docs` discovers `.astro` files under `documentations[].contentPaths`, runs the same cache/glossary/batch pipeline as markdown, and adjusts relative imports when output paths are deeper (e.g. `src/pages/de/index.astro`).
- **Changed**: examples - `examples/astro-website` uses static English in `src/pages/index.astro` and `pnpm i18n:translate:pages` (`translate-docs`) to generate `src/pages/{locale}/index.astro`; optional `t()` UI workflow remains available via `ui-astro-website` init template.
- **Added**: extractors - `.astro` source slicing in `ui-string-babel.ts` lets `extract` discover `t()` / `i18n.t()` calls in Astro frontmatter and template `{expression}` blocks when `.astro` is listed in `ui.uiExtractor.extensions`.
- **Added**: cli - `init -t ui-astro-website` scaffolds a plain Astro app config with `.astro` in the UI scanner and `public/locales/` flat output.
- **Changed**: types - `ui.uiExtractor` is the preferred config name for UI scanner options; `ui.reactExtractor` remains a fully supported alias.
- **Added**: examples - `examples/astro-website` demonstrates Astro built-in i18n routing (`/`, `/de/`, `/fr/`), `src/i18n/` helpers, and `ai-i18n-tools.config.json` for UI translation.
- **Changed**: cli — `editor` command renamed to `dashboard` with `editor` kept as a hidden backward-compat alias; display name changed to Translation Dashboard (CLI banner, web UI title, and server-unavailable overlay updated).
- **Changed**: dashboard — internal implementation renamed for consistency: `src/edit-cache-app` → `src/dashboard-app`, `translation-editor.ts` → `translation-dashboard.ts`, and related symbols (`createTranslationDashboardApp`, `resolveDashboardAppStaticDir`, `DEFAULT_DASHBOARD_PORT`, dashboard server-down overlay IDs/CSS).
- **Changed**: write-heading-ids — when an `<a id="…"></a>` line already precedes an ATX heading, refresh the id to match the current heading slug instead of leaving a stale anchor unchanged.
- **Fixed**: flat-link-rewrite — depth prefix for non-markdown asset URLs is now computed per output file rather than globally for the batch. When `flatPreserveRelativeDir: true` places a source file in a subdirectory (e.g. `docs/GETTING_STARTED.md` → `translated-docs/docs/GETTING_STARTED.<locale>.md`), the rewriter now produces `../../docs/figure.png` instead of the previous under-prefixed `../figure.png`, correctly resolving back to the source file's directory. No `postProcessing.regexAdjustments` workaround is needed for relative-path assets. Simple flat layouts (source at repo root) are unaffected.
- **Fixed**: examples — `examples/astro-docs/ai-i18n-tools.config.json` screenshot regex changed from hardcoded `screenshots/en-GB/` to generic `screenshots/[^/]+/`, matching the pattern in `examples/nextjs-app` and `GETTING_STARTED.md`; the old form would silently produce wrong paths if `sourceLocale` ever changed.
- **Added**: docs — new `docs/LOCALE-ASSETS-GUIDE.md` guide covering Patterns A–E (shared raster, per-locale folder, Docusaurus colocated, flat SVG, colocated SVG); includes end-to-end screenshot workflow, `getScreenshotDir` contract per pattern, the flat link rewriter two-step flow, per-framework setup recommendations, and common mistakes; shipped on npm under `docs/` and linked from `README.md`, `GETTING_STARTED.md`, `PACKAGE_OVERVIEW.md`, and `docs/ai-i18n-tools-context.md`.
- **Changed**: docs — `docs/GETTING_STARTED.md` images section condensed to a quick-reference table of Patterns A–E with a link to the new locale-assets guide; flat link rewriter description corrected (the depth prefix is sufficient for sources at repo root; the `flatPreserveRelativeDir` subdirectory case needs a full path fix via `postProcessing`, not just a locale swap); Pattern C (Docusaurus colocated) documented for the first time.
- **Added**: examples — `examples/nextjs-app/README.md` and `examples/astro-docs/README.md` now document the expected screenshot directory layout matching each config's `regexAdjustments` rule, with a note that no `take-screenshots` script is included and pointers to transrewrt (Pattern B) and duplistatus (Pattern C) as real-world references.
- **Changed**: npm publish — remove `translated-docs/` from `package.json` `files`; localized README and docs remain in the Git repository only (English `docs/` still ship on npm).
- **Security**: workspace — `pnpm-workspace.yaml` overrides bump transitive `qs` (≥6.15.2) and `ws` (≥8.20.1) to address moderate advisories in Express and Docusaurus dev-server chains.
- **Added**: NOTICES — `pnpm notices:write` generates `NOTICES` from production deps of `ai-i18n-tools` and workspace examples via `license-checker-rseidelsohn`; `3p-lic-clarifications.json` reuses transrewrt clarifications for overlapping packages (e.g. `esrecurse`, `spdy`, `@jsonjoy.com/json-pointer`).
- **Added**: translate-docs — selective YAML front matter translation via `documentations[].translateFrontmatterFields` (default `true`): built-in Starlight/Docusaurus prose fields (`title`, `description`, `sidebar.label`, `sidebar_label`, `keywords`, hero/pagination/prev-next labels, …) while routing keys (`slug`, `sidebar.order`, translation metadata) stay unchanged.
- **Fixed**: output-paths — `doc-system` / `astro-starlight` with empty `localeSubpath` now lowercases locale folder names (e.g. `pt-BR` → `pt-br`) to match Starlight’s content directory convention.
- **Added**: examples — `examples/astro-docs` Starlight documentation site (same locales as `docs-site`) demonstrating `style: "astro-starlight"`.
- **Changed**: workspace — allow `esbuild` postinstall in `pnpm-workspace.yaml` for Astro Starlight example builds.
- **Fixed**: editor — glossary tab hides add-row, filter, table, and pagination controls when `glossary.userGlossary` is not configured, instead of leaving them visible until an API error.
- **Changed**: pnpm - moved `overrides` and `allowBuilds` settings from `package.json#pnpm` into `pnpm-workspace.yaml` for pnpm 11 compatibility (restores previously ignored `i18next` and `uuid` overrides).
- **Fixed**: glossary - CSV parse failures now include the glossary filename in the error message (e.g. `glossary-user.csv: Invalid Closing Quote: …`) across CLI commands, stats, and the translation editor.

---

## Documentation

- [Getting Started](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/GETTING_STARTED.md) — setup, CLI flags, and config reference.  
- [Locale assets guide](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/LOCALE-ASSETS-GUIDE.md) — screenshots and illustrated SVGs in translated docs.  
- [Package Overview](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/PACKAGE_OVERVIEW.md) — architecture and extension points.  
- [AI Agent Context (consumers)](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — concise context for apps **using** the npm package.

---

## License

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br/ai-i18n-tools)
