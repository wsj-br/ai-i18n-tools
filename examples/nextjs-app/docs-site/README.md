# ai-i18n-tools — example documentation site

This is a small [Docusaurus](https://docusaurus.io/) site bundled with the [Next.js example](../README.md). It mirrors the markdown files from the main repository’s `docs/` folder for convenient local reading.

Translated copies live under `i18n/<locale>/docusaurus-plugin-content-docs/current/` (committed so you can read them without running translate). Regenerate with `pnpm run i18n:translate` in `examples/nextjs-app/` when sources change. English stays in `docs/`; switch locale via the navbar.

Site shape follows [duplistatus](https://github.com/wsj-br/duplistatus)’s documentation package: explicit `docs.path`, `trailingSlash: false`, a **root redirect** (`src/pages/index.jsx` → `getting-started`, same idea as `duplistatus/documentation/src/pages/index.tsx` → `intro`), **`docSidebar`** in the navbar, and full **`localeConfigs`**. Avoid `slug: /` on the main guide page so every locale (including `pt-BR`) gets a stable `/getting-started` route.

**`localeConfigs[locale].path`** must match the folder name under `i18n/` (e.g. `path: "fr"` for `i18n/fr/`). The default English locale uses `path: "en"` so catalogs from `docusaurus write-translations` land in `i18n/en/` (if you only set `htmlLang` and omit `path`, Docusaurus may infer a different folder such as `en-GB` and skip your files). If you only set `htmlLang` to `fr-FR`, Docusaurus defaults `path` to `fr-FR` and will not load `i18n/fr/…` markdown, so localized pages fall back to English.

## Build and view the docs

From the **repository root**:

```bash
cd examples/nextjs-app/docs-site
pnpm install
```

**Development (hot reload, English default)** — browse at [http://localhost:3040](http://localhost:3040):

```bash
pnpm start
```

**Production build + preview** — output goes to `build/` (one subdirectory per locale). This runs the same link validation as CI (`onBrokenLinks: "throw"` in `docusaurus.config.mjs`), so a successful build means internal doc links resolve.

```bash
pnpm build
pnpm serve
```

Or build and serve in one step:

```bash
pnpm preview
```

Then open paths such as `/getting-started`, `/fr/getting-started`, or `/pt-BR/getting-started` on [http://localhost:3040](http://localhost:3040). English has no `/en/` prefix; other locales use `/es/`, `/fr/`, `/de/`, `/pt-BR/`, `/ar/`.

### `write-translations` (Docusaurus UI strings)

Run this from **`docs-site/`** when you upgrade `@docusaurus/*`, change the navbar/footer/theme, or add custom components with translatable labels. It extracts UI strings into JSON under the default locale folder (here `i18n/en/`), including [`code.json`](https://docusaurus.io/docs/cli#docusaurus-write-translations-sitedir) and theme/plugin catalogs:

```bash
pnpm install
pnpm run write-translations
```

Commit updated files under `i18n/en/` when they change. Then run `pnpm run i18n:translate` from [`examples/nextjs-app/`](../) so `ai-i18n-tools translate-docs` translates both markdown and these JSON files into `i18n/<locale>/` (see `documentation.jsonSource` in `ai-i18n-tools.config.json`).

### i18n and `pnpm start` (important)

Docusaurus **only loads one locale in development** at a time. `pnpm start` runs the **default** locale (`en`), so URLs under `/es/`, `/fr/`, `/de/`, `/pt-BR/` **return 404** until you start the dev server for that locale (same behavior as [duplistatus](https://github.com/wsj-br/duplistatus)’s `start:es`, etc.).

| Goal | Command |
|------|---------|
| English (default) | `pnpm start` → use `/getting-started` (no `/en/` prefix) |
| Spanish | `pnpm run start:es` → then open `/es/getting-started` |
| French | `pnpm run start:fr` → `/fr/...` |
| German | `pnpm run start:de` → `/de/...` |
| Portuguese (BR) | `pnpm run start:pt-BR` → `/pt-BR/...` |
| Arabic | `pnpm run start:ar` → `/ar/...` |

The **locale dropdown** in the navbar switches to another locale’s URL, but that route only exists in dev if you restarted with `--locale` matching that site, or after a **production build** (`pnpm build` then `pnpm serve` / `pnpm preview`), which bundles every locale.
