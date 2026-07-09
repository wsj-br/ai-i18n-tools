



**Table of Contents** 

- [Development Guide](#development-guide)
  - [Related guides](#related-guides)
  - [Prerequisites](#prerequisites)
    - [Optional: locale screenshots (](#optional-locale-screenshots-examplesnextjs-app)`examples/nextjs-app`[)](#optional-locale-screenshots-examplesnextjs-app)
    - [Optional: Translation Dashboard screenshot](#optional-translation-dashboard-screenshot)
  - [Setting Up the Workspace](#setting-up-the-workspace)
    - [Running the CLI during development](#running-the-cli-during-development)
  - [Common Scripts](#common-scripts)
    - [Build and quality](#build-and-quality)
    - [Documentation site](#documentation-site)
    - [In-repo translation](#in-repo-translation)
    - [Release](#release)
  - [Project Structure](#project-structure)
  - [Running Examples](#running-examples)
  - [Testing](#testing)
    - [Testing Placeholders Handling](#testing-placeholders-handling)
    - [Test the translation end-to-end on the ai-i18n-tools documentation and the example projects](#test-the-translation-end-to-end-on-the-ai-i18n-tools-documentation-and-the-example-projects)
  - [Publishing documentation to GitHub Pages](#publishing-documentation-to-github-pages)
    - [One-time setup: GitHub Pages](#one-time-setup-github-pages)
    - [How deployment is triggered](#how-deployment-is-triggered)
    - [Local development and build](#local-development-and-build)
    - [Pre-publish checklist (docs)](#pre-publish-checklist-docs)
    - [VitePress and GitHub Pages URL](#vitepress-and-github-pages-url)
    - [What the docs site includes](#what-the-docs-site-includes)
  - [Publishing to npm](#publishing-to-npm)
    - [One-time setup: npm publish authentication](#one-time-setup-npm-publish-authentication)
    - [Starting a release](#starting-a-release)
    - [Pre-release checklist](#pre-release-checklist)
    - [Bumping the version](#bumping-the-version)
    - [Release notes and changelog](#release-notes-and-changelog)
    - [Creating the GitHub release (](#creating-the-github-release-scriptsreleasesh)`scripts/release.sh`[)](#creating-the-github-release-scriptsreleasesh)
    - [npm package dry run (optional)](#npm-package-dry-run-optional)
    - [What gets published](#what-gets-published)



# Development Guide

Local development setup, examples, testing, and publishing for [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools). For architecture, invariants, and agent-oriented maintainer rules, see `[AGENT.md](../AGENT.md)` at the repository root.

## Related guides


| Guide                    | Path                                                                | Use when                                                                      |
| ------------------------ | ------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Maintainer / agent guide | `[AGENT.md](../AGENT.md)`                                           | Changing source, tests, config, or docs — invariants, layout, changelog rules |
| Consumer integration     | `[docs/ai-i18n-tools-context.md](../docs/ai-i18n-tools-context.md)` | Integrating the published npm package into another project                    |
| Example walkthroughs     | `[examples/README.md](../examples/README.md)`                       | Choosing and running a specific example project                               |
| Reference docs           | `[docs/reference/](../docs/reference/)`                             | CLI, config schema, programmatic API, architecture                            |




## Prerequisites


| Tool        | Minimum version | Install                                                                                                         |
| ----------- | --------------- | --------------------------------------------------------------------------------------------------------------- |
| **Node.js** | >= 22.16.0      | [nodejs.org](https://nodejs.org/) or via `nvm install 22`                                                       |
| **pnpm**    | >= 11.0.0       | `corepack enable` (uses `packageManager` in root `package.json`, currently [pnpm@11.10.0](mailto:pnpm@11.10.0)) |
| **Git**     | any recent      | [git-scm.com](https://git-scm.com/)                                                                             |


> **Tip:** [Corepack](https://nodejs.org/api/corepack.html) ships with Node.js and is the recommended way to manage pnpm.



### Optional: locale screenshots (`examples/nextjs-app`)

`[examples/nextjs-app/scripts/screenshot-locales.sh](../examples/nextjs-app/scripts/screenshot-locales.sh)` captures headless PNGs (`images/screenshots/<locale>/screenshot.png`) for `sourceLocale` plus each `targetLocales` entry in `examples/nextjs-app/ai-i18n-tools.config.json` (source first; skips any target that duplicates the source). Extra prerequisites:


| Dependency                | Role                                                                                                                                                                                                      |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `jq`                      | Builds the locale list from the JSON config (`sourceLocale`, then `targetLocales` minus duplicates).                                                                                                      |
| `chromium-headless-shell` | Runs `--screenshot` (1300×900); set `CHROME_BIN` if your binary lives elsewhere.                                                                                                                          |
| **Next.js dev server**    | Must be reachable while the script runs — from `examples/nextjs-app`, run `pnpm dev` (default **[http://localhost:3030](http://localhost:3030)**). Override with `BASE_URL` if the app listens elsewhere. |


Optional tuning: `VIRTUAL_TIME_MS` (default **8000**) delays capture so locale JSON and fonts can load before the screenshot.

### Optional: Translation Dashboard screenshot

`[scripts/screenshot-translation-dashboard.sh](../scripts/screenshot-translation-dashboard.sh)` refreshes `docs/public/translation-dashboard.png` for the [Translation Dashboard](../docs/guide/translation-dashboard.md) guide page.


| Dependency                | Role                                                               |
| ------------------------- | ------------------------------------------------------------------ |
| `chromium-headless-shell` | `--screenshot` (default **1300×900**); set `CHROME_BIN` if needed. |
| `curl`                    | Waits until the dashboard URL responds before capture.             |
| **Built CLI**             | Run `pnpm build` so `dist/cli/index.js` exists.                    |


By default the script starts `ai-i18n-tools dashboard --no-open` on port **8675**, captures, then stops the server. If the dashboard is already running, set `BASE_URL` (for example `http://127.0.0.1:8675/`) and `SKIP_DASHBOARD_START=1`. Optional tuning: `VIRTUAL_TIME_MS`, `WINDOW_SIZE`, `PORT`.

## Setting Up the Workspace

```bash
git clone https://github.com/wsj-br/ai-i18n-tools.git
cd ai-i18n-tools
pnpm install
pnpm build
```

After building, invoke the CLI using one of the options in [Running the CLI during development](#running-the-cli-during-development) below, or use the root `pnpm i18n:*` scripts (they call the shim directly and work without a global install).

### Running the CLI during development

The published `bin` entry is `bin/ai-i18n-tools.mjs` — a stable shim that dynamically imports the compiled CLI at `dist/cli/index.js`.

`pnpm build` runs, in order:

1. `scripts/write-build-info.mjs` — writes `src/build-info.generated.ts` (gitignored)
2. `tsc` — compiles `src/` to `dist/` (CLI entry: `src/cli/index.ts`)
3. `scripts/chmod-cli-bin.mjs` — sets mode `0o755` on the shim and `dist/cli/index.js`
4. `scripts/copy-runtime-ui-languages-json.mjs` — copies `data/ui-languages-complete.json` into `dist/runtime/`
5. `scripts/copy-dashboard-app.mjs` — copies `src/dashboard-app/` into `dist/dashboard-app/`
6. `scripts/copy-i18n-locales.mjs` — copies `src/i18n/locales/` into `dist/i18n/locales/`

The root `prepare` script runs `scripts/ensure-built.mjs`, which builds when `dist/cli/index.js` is missing after `pnpm install`.

Root `pnpm i18n:*` scripts invoke `node bin/ai-i18n-tools.mjs` directly, so they work at the repository root without a global install or shell alias.

**Why bare** `ai-i18n-tools` **and** `pnpm exec ai-i18n-tools` **do not work at the repo root:** pnpm links a package's `bin` into `node_modules/.bin` only for *dependents*, not for the package itself. At the monorepo root there is no `node_modules/.bin/ai-i18n-tools`, so bare `ai-i18n-tools` and `pnpm exec ai-i18n-tools` fail unless you use one of the workarounds below. Workspace examples that list `"ai-i18n-tools": "workspace:^"` do get the bin link — there `pnpm exec ai-i18n-tools` works as documented for consumer projects.

**Option 1 — call the shim directly (always works after** `pnpm build`**):**

```bash
node bin/ai-i18n-tools.mjs status
./bin/ai-i18n-tools.mjs status   # Linux/macOS/WSL after chmod
```

Some in-repo examples use this form explicitly, e.g. `node ../../bin/ai-i18n-tools.mjs …` in `examples/multi-provider`.

**Option 2 — shell alias (bare command in any directory while developing):**

From the repository root:

```bash
alias ai-i18n-tools='node "$(pwd)/bin/ai-i18n-tools.mjs"'
```

Or with a fixed clone path (adjust to your checkout):

```bash
alias ai-i18n-tools='node "$HOME/src/ai-i18n-tools/bin/ai-i18n-tools.mjs"'
```

Add the alias to `~/.bashrc` or `~/.zshrc` if you want it in every new shell. Rebuild (`pnpm build`) after CLI changes before invoking.

**Option 3 — global install from the working tree (bare command everywhere):**

Requires pnpm ≥ 11 (this repo uses pnpm 11.x). pnpm 11 removed `pnpm link --global`; register the local package with `pnpm add -g .` instead:

```bash
pnpm install
pnpm build
pnpm add -g .
which ai-i18n-tools          # expect: $(pnpm bin -g)/ai-i18n-tools
```

If global commands fail before or after `pnpm add -g .`, pnpm may report one of:

```text
ERR_PNPM_NO_GLOBAL_BIN_DIR  Unable to find the global bin directory
```

or (when `PNPM_HOME` is set but `$PNPM_HOME/bin` is not on `PATH`):

```text
The configured global bin directory "<path>/bin" is not in PATH
Run "pnpm setup" to update your shell configuration.
```

Run the one-time bootstrap, then open a new shell so the updated `PATH` is loaded:

```bash
pnpm setup                   # appends PNPM_HOME and $PNPM_HOME/bin to ~/.bashrc (or ~/.zshrc)
exec $SHELL -l               # reload the shell
pnpm bin -g                  # sanity check: prints e.g. /home/<user>/.local/share/pnpm/bin
pnpm add -g .                # retry from the repo root
```

Undo with `pnpm remove -g ai-i18n-tools` (alias: `pnpm uninstall -g ai-i18n-tools`).

**Cross-platform notes**

- Linux, macOS, and WSL: the CLI needs the executable bit on `dist/cli/index.js`; `pnpm build` sets it (see `scripts/chmod-cli-bin.mjs`).
- Windows (PowerShell, CMD, Git Bash): file mode is irrelevant; pnpm generates `ai-i18n-tools.cmd` and `.ps1` shims that call `node` explicitly. `pnpm setup` is still required once per Windows account. Prefer `node bin/ai-i18n-tools.mjs` or a PowerShell function over a bash `alias`.



## Common Scripts



### Build and quality


| Command                | Description                                                                                           |
| ---------------------- | ----------------------------------------------------------------------------------------------------- |
| `pnpm build`           | Compile TypeScript and copy static assets to `dist/` (see build steps above)                          |
| `pnpm dev`             | Copy runtime assets, then `tsc --watch`                                                               |
| `pnpm test`            | Run the full test suite with coverage                                                                 |
| `pnpm test:watch`      | Run tests in watch mode                                                                               |
| `pnpm typecheck`       | `tsc --noEmit` for `src/` and `tests/`                                                                |
| `pnpm lint`            | ESLint plus typecheck                                                                                 |
| `pnpm lint:fix`        | Auto-fix ESLint issues                                                                                |
| `pnpm lint:md`         | Markdown link check on collected doc targets                                                          |
| `pnpm format`          | Format `src/**/*.ts` and `tests/**/*.ts` with Prettier                                                |
| `pnpm format:check`    | Check formatting without writing                                                                      |
| `pnpm clean`           | Remove the `dist/` directory                                                                          |
| `pnpm clean:workspace` | Remove install/build artifacts across the monorepo (`scripts/clean-workspace.sh`)                     |
| `pnpm clean-temp`      | List temp `*.log` / `cache.db.backup*.sqlite` files; delete after confirm, or pass `-f` for no prompt |
| `pnpm pre-release`     | Full release gate: `i18n:self`, format, lint, clean, build, test, docs build, example site builds     |




### Documentation site


| Command                 | Description                                                            |
| ----------------------- | ---------------------------------------------------------------------- |
| `pnpm docs:dev`         | Sync README → `docs/index.md`, escape Vue braces, start VitePress dev  |
| `pnpm docs:build`       | Build the VitePress site to `docs/.vitepress/dist`                     |
| `pnpm docs:preview`     | Preview the built docs site                                            |
| `pnpm docs:publish`     | Trigger the **Deploy Docs** GitHub Actions workflow (see below)        |
| `pnpm update-tocs`      | Regenerate doctoc TOCs in root `*.md` and `dev/*.md` (heading changes) |
| `pnpm docs:sync` | Copy `README.md` → `docs/index.md` only                                |


The docs site deploys to GitHub Pages on release via `.github/workflows/docs.yml` (separate from the npm tarball). See [Publishing documentation to GitHub Pages](#publishing-documentation-to-github-pages) for setup, `pnpm docs:publish`, and the pre-publish checklist.

### In-repo translation


| Command                     | Description                                                                                               |
| --------------------------- | --------------------------------------------------------------------------------------------------------- |
| `pnpm i18n:self`            | Regenerate the tool's own UI bundles (`src/i18n/locales/`) via `sync-ui`                                  |
| `pnpm i18n:sync`            | Sync README → `docs/index.md`, then `sync` (docs + theme JSON)                                            |
| `pnpm i18n:update-headings` | Run `write-heading-ids` — insert or refresh HTML anchor lines before ATX headings in configured doc paths |
| `pnpm i18n:translate:ui`    | Run `translate-ui` against the root config                                                                |
| `pnpm i18n:translate:svg`   | Run `translate-svg`                                                                                       |
| `pnpm i18n:translate:docs`  | Run `translate-docs`                                                                                      |
| `pnpm i18n:status`          | Run `status`                                                                                              |
| `pnpm i18n:dashboard`       | Run `dashboard`                                                                                           |
| `pnpm i18n:cleanup`         | Run `cleanup`                                                                                             |
| `pnpm update-all`           | Build, then `cleanup` on the root, `console-app`, `nextjs-app`, and `astro-docs`                          |


Run `pnpm i18n:self` after changing user-facing CLI, log, or dashboard strings (`t()` or `data-i18n*` markers). Run `pnpm i18n:update-headings` after adding, renaming, or removing headings in English docs under configured `contentPaths`, then `pnpm update-tocs` for `README.md` / `dev/*.md` TOCs. Run `pnpm i18n:sync` after changing English documentation under `docs/` or `README.md`.

### Release


| Command                   | Description                                                                                           |
| ------------------------- | ----------------------------------------------------------------------------------------------------- |
| `pnpm release:github`     | Create the GitHub release from `release-notes/RELEASE_NOTES_<version>.md` (runs `scripts/release.sh`) |
| `pnpm release:github:dry` | Dry-run the release script (validate inputs; no tag push or GitHub release)                           |
| `pnpm notices:write`      | Regenerate third-party notices                                                                        |




## Project Structure

```text
bin/              Stable CLI shim (published to npm)
src/              TypeScript source (compiles to dist/)
  cli/            CLI command implementations
  core/           Config, cache, output paths, prompts
  extractors/     UI, markdown, JSON, SVG extractors
  processors/     Placeholders, batching, link rewriting
  api/            LLM client
  glossary/       Glossary loading and matching
  runtime/        Consumer runtime helpers (ai-i18n-tools/runtime)
  i18n/           Tool's own UI localization (t() + locale bundles)
  server/         Translation Dashboard (Express)
  dashboard-app/  Static dashboard UI (copied to dist/ on build)
tests/            Vitest test files
data/             Bundled JSON (ui-languages-complete.json; published to npm)
docs/             VitePress documentation site (GitHub Pages on release)
translated-docs/  Flat README translations (Git repo only; not in the npm tarball)
dev/              Developer-only files (changelog, this guide)
examples/         Example projects — see examples/README.md
scripts/          Build helper scripts
```

Workspace packages are listed in `pnpm-workspace.yaml`: root, `examples/console-app`, `examples/nextjs-app`, `examples/nextjs-app/docs-site`, `examples/astro-docs`, `examples/astro-website`, and `examples/vitepress-docs`. Standalone fixtures (`multi-provider`, `test-markdown`) install `ai-i18n-tools` from npm when copied with `degit`.

## Running Examples

See `[examples/README.md](../examples/README.md)` for a full comparison table and per-example READMEs. All workspace examples resolve `ai-i18n-tools` to the local workspace copy when you `pnpm install` from the repository root.

```bash
pnpm build

# Smallest end-to-end app (Node.js console)
cd examples/console-app
pnpm exec ai-i18n-tools sync --force-update
pnpm start

# Next.js app (port 3030) + nested Docusaurus docs (port 3040)
cd ../nextjs-app
pnpm exec ai-i18n-tools sync --force-update
pnpm dev
cd docs-site && pnpm preview

# Astro marketing site (hybrid HTML + t() UI strings)
cd ../../astro-website
pnpm exec ai-i18n-tools sync --force-update
pnpm dev

# Astro Starlight docs (port 3050)
cd ../astro-docs
pnpm exec ai-i18n-tools sync --force-update
pnpm dev

# VitePress docs (port 3060)
cd ../vitepress-docs
pnpm exec ai-i18n-tools sync --force-update
pnpm run docs:dev
```

Standalone fixtures (`multi-provider`, `test-markdown`) use `node ../../bin/ai-i18n-tools.mjs` or a globally installed CLI — they are not workspace packages.

## Testing

Tests use [Vitest](https://vitest.dev/) with V8 coverage:

```bash
pnpm test              # single run + coverage report
pnpm test:watch        # re-run on changes
```



### Testing Placeholders Handling

```bash
cd examples/test-markdown
node ../../bin/ai-i18n-tools.mjs translate-docs \
  -c ai-i18n-tools.config.json \
  --path test-markdown-stress-test.md \
  --locale=en-GB \
  --force
```

Check the output in `examples/test-markdown/translated-docs/test-markdown-stress-test.en-GB.md`.

### Test the translation end-to-end on the ai-i18n-tools documentation and the example projects

```bash
pnpm i18n:sync
cd examples/nextjs-app && pnpm exec ai-i18n-tools sync --force-update
cd ../console-app && pnpm exec ai-i18n-tools sync --force-update
```

Check that translations are correct in `translated-docs/` and under `docs/<locale>/` for the root package.

---



## Publishing documentation to GitHub Pages

The full VitePress site under `docs/` is **not** shipped on npm. It is published to GitHub Pages at **[https://wsj-br.github.io/ai-i18n-tools/](https://wsj-br.github.io/ai-i18n-tools/)** (English plus translated locales under `docs/<locale>/`).

Deployment is separate from the npm release workflow (`.github/workflows/ci.yml`). The docs workflow lives in `[.github/workflows/docs.yml](../.github/workflows/docs.yml)`.

### One-time setup: GitHub Pages

1. Open **github.com/wsj-br/ai-i18n-tools** → **Settings** → **Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions** (not “Deploy from a branch”).
3. No `gh-pages` branch or personal access token is required — the workflow uses OIDC (`permissions: pages: write`, `id-token: write`) and [actions/deploy-pages](https://github.com/actions/deploy-pages).

After the first successful run, the **github-pages** environment appears under **Settings** → **Environments**; the workflow deploy job targets that environment.

### How deployment is triggered


| Trigger                             | When it runs                                                                                                                                                                                                                      |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **GitHub release** `published`      | Automatically when you publish a release (same release that can trigger npm publish via CI).                                                                                                                                      |
| `pnpm docs:publish`                 | Manually from the CLI — triggers the same **Deploy Docs** workflow as **Actions** → **Run workflow** (default: current branch; use `-- --ref=main` for `main`). Requires [GitHub CLI](https://cli.github.com/) (`gh auth login`). |
| `workflow_dispatch` **(GitHub UI)** | Same as `pnpm docs:publish`, but from **Actions** → **Deploy Docs** → **Run workflow** (pick branch, usually `main`). Use either method to refresh the live site without a new npm version.                                       |


The workflow checks out the repo, runs `pnpm install --frozen-lockfile`, builds with `pnpm run docs:build`, uploads `docs/.vitepress/dist`, and deploys via GitHub Pages. Check the **Actions** tab for the **Deploy Docs** workflow; the deploy job prints the live URL.

**CLI examples** (implemented in `[scripts/publish-docs.sh](../scripts/publish-docs.sh)`):

```bash
pnpm docs:publish                  # deploy from the current branch (push first)
pnpm docs:publish -- --ref=main    # deploy from main
pnpm docs:publish -- --watch       # trigger and stream the workflow log
```

GitHub builds the **remote** ref — push your branch before running if your changes are only local.

### Local development and build


| Command             | Purpose                                                                                                                                      |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm docs:dev`     | Sync `README.md` → `docs/index.md`, escape Vue braces, start VitePress dev server                                                            |
| `pnpm docs:build`   | Production build to `docs/.vitepress/dist` (same command CI uses)                                                                            |
| `pnpm docs:preview` | Serve the built output locally before publishing                                                                                             |
| `pnpm docs:publish` | Trigger GitHub Pages deployment via the **Deploy Docs** workflow (see [How deployment is triggered](#how-deployment-is-triggered))           |
| `pnpm update-tocs`  | Refresh doctoc table-of-contents blocks in `README.md` and other root `*.md` / `dev/*.md` files that contain `<!-- START doctoc -->` markers |


After changing English content under `docs/` or `README.md`, run `pnpm i18n:sync` so locale trees and theme JSON stay in sync before you build or release. After adding or removing headings in `README.md` or `dev/*.md`, run `pnpm update-tocs` so the generated TOC stays accurate.

### Pre-publish checklist (docs)

- [ ] `pnpm i18n:sync` completed successfully (if English docs or `README.md` changed)
- [ ] `pnpm docs:build` succeeds locally (included in `pnpm pre-release`)
- [ ] Optional: `pnpm docs:preview` and spot-check routes and locale switcher
- [ ] Changes are pushed to the branch you will deploy (`pnpm docs:publish` uses the remote ref; default is the current branch, or pass `-- --ref=main`)



### VitePress and GitHub Pages URL

Project Pages are served at `https://<user>.github.io/<repo>/`. VitePress must use a matching `base` path in `[docs/.vitepress/config.mts](../docs/.vitepress/config.mts)`:

```ts
base: "/ai-i18n-tools/",
```

If the repository is renamed or you move to a custom domain, update `base`, `head` favicon paths, and any hard-coded `wsj-br.github.io/ai-i18n-tools` links in `README.md` / docs.

### What the docs site includes


| Included on GitHub Pages                                   | Not on GitHub Pages / not in npm tarball                                                        |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Built static HTML from `docs/.vitepress/dist`              | `docs/.vitepress/` source, dev server assets                                                    |
| All locale trees under `docs/<locale>/`                    | `src/`, `tests/`, `examples/`                                                                   |
| Theme/nav strings from `docs/.vitepress/i18n/theme.*.json` | `translated-docs/` flat README translations (linked from the site, stored in the Git repo only) |


Consumer integration docs shipped on npm remain only `[docs/ai-i18n-tools-context.md](../docs/ai-i18n-tools-context.md)` — see [What gets published](#what-gets-published) under npm publishing below.

---



## Publishing to npm

Publishing is automated via GitHub Actions (`.github/workflows/ci.yml`). When you create a GitHub release, the CI workflow runs lint, format check, build, and tests on Node.js **22.x** and **24.x**. If all checks pass, it publishes the package to npm automatically.

A separate workflow (`.github/workflows/docs.yml`) builds and deploys the VitePress site to GitHub Pages on release.

You can also run the CI workflow **manually** from the **Actions** tab (**Run workflow**). Choose the branch (usually `main`), then:

- Leave **Tag this build as 'latest'** unchecked to run lint, format, build, and tests only (no npm publish).
- Turn it **on** to run the full pipeline and **publish** the current `package.json` version to npm with the `latest` dist-tag — useful to retry or fix a failed release after correcting the branch. Ensure the version in `package.json` matches what you intend to ship; npm rejects duplicate versions.



### One-time setup: npm publish authentication

CI prefers [npm Trusted Publishers](https://docs.npmjs.com/trusted-publishers/) (OIDC) configured on npmjs.com for workflow file `ci.yml`. If OIDC is not set up, add a repository secret named `NPM_TOKEN`:

1. Go to [npmjs.com](https://www.npmjs.com/) > **Access Tokens** > **Generate New Token**.
2. Choose **Granular Access Token** with publish permission scoped to `ai-i18n-tools` (or use the **Automation** token type, which bypasses 2FA for CI).
3. Copy the token.
4. Go to **github.com/wsj-br/ai-i18n-tools** > **Settings** > **Secrets and variables** > **Actions** > **New repository secret**.
5. Name: `NPM_TOKEN`, Value: paste the token from step 2.



### Starting a release

When you start a new release, make sure all documents are translated and the pre-release check is successful:

```bash
pnpm update-all
pnpm pre-release
```

`pre-release` runs `pnpm i18n:self`, format, lint, clean, build, tests, `pnpm docs:build`, and example site builds (`examples/nextjs-app/docs-site`, `examples/astro-docs`, `examples/astro-website`, `examples/vitepress-docs`). Resolve any failures locally; CI applies the same checks before npm publish.

### Pre-release checklist

- [ ] `pnpm i18n:update-headings` completed successfully (if English doc headings changed)
- [ ] `pnpm update-tocs` completed successfully (if headings changed in `README.md` or `dev/*.md`)
- [ ] `pnpm i18n:self` completed successfully (if CLI/dashboard strings changed)
- [ ] `pnpm i18n:sync` completed successfully (if English docs changed)
- [ ] `pnpm pre-release` completed successfully
- [ ] You have a clear target version and `dev/CHANGELOG.md` still has everything under `## [Unreleased]` that belongs in this release



### Bumping the version

If the version in `package.json` is not yet set for this release, use `pnpm version` to bump it and create a git commit:

```bash
pnpm version patch   # 1.0.0 → 1.0.1  (bug fixes)
pnpm version minor   # 1.0.0 → 1.1.0  (new features, backward-compatible)
pnpm version major   # 1.0.0 → 2.0.0  (breaking changes)
```



### Release notes and changelog

Before you run the release script, the repo must contain `release-notes/RELEASE_NOTES_<version>.md` for the exact version in `package.json` (for example `release-notes/RELEASE_NOTES_1.2.8.md` when the package version is `1.2.8`).

Copy and paste `[dev/release-new-version-prompt.md](release-new-version-prompt.md)` into a Cursor chat to:

1. Draft `release-notes/RELEASE_NOTES_<version>.md` in the same style as prior `release-notes/RELEASE_NOTES_*.md` files.
2. Update `dev/CHANGELOG.md`: move the `## [Unreleased]` bullets into a new `## [x.y.z] - YYYY-MM-DD` section and leave an empty `[Unreleased]` section for the next cycle.

Commit the new or updated release-notes file and changelog together with any other release prep so `git status` **is clean** before you publish the GitHub release.

### Creating the GitHub release (`scripts/release.sh`)

Publishing the GitHub release is done with the release script (wrapper: `pnpm release:github`, which runs `bash scripts/release.sh` from the repository root).

**Prerequisites**

- [GitHub CLI](https://cli.github.com/) (`gh`) installed and authenticated (`gh auth login`).
- Working tree clean unless you intentionally pass `--verify-clean=false` to the script.
- `release-notes/RELEASE_NOTES_<version>.md` present for the current `package.json` version.

**Steps**

1. Push your release branch to `origin` (include all commits for the release, including changelog and release notes).
  ```bash
   git push origin HEAD
  ```
2. Suggested: dry-run (prints planned steps; no tag deletion, push, or release):
  ```bash
   pnpm release:github:dry
  ```
3. Create the release:
  ```bash
   pnpm release:github
  ```
   Equivalent: `./scripts/release.sh` from the repo root. Use `./scripts/release.sh --help` for flags (`--dry-run`, `--verify-clean=false`).

The script creates an annotated tag `v<version>` at **HEAD**, pushes it to `origin`, and creates a GitHub release whose body is `release-notes/RELEASE_NOTES_<version>.md`. If that tag or a GitHub release for it already exists, the script removes them and recreates the tag at the current HEAD so you can fix a mistaken tag or add follow-up commits before releasing.

That GitHub release triggers CI, which runs lint, format check, build, and tests; if all checks pass, it publishes the package to npm. Check the **Actions** tab to verify.

**Manual alternative:** you can still create a release from the GitHub **Releases** UI if needed; prefer the script so the tag, title, and notes stay aligned with `package.json` and `release-notes/RELEASE_NOTES_<version>.md`.

### npm package dry run (optional)

Inspect what will be included in the tarball:

```bash
pnpm publish --dry-run
```

Verify that the output includes `bin/`, `dist/`, `data/`, `docs/ai-i18n-tools-context.md`, `README.md`, and `LICENSE` — and does **not** include `translated-docs/`, the full `docs/` tree, `src/`, `tests/`, or `examples/`.

### What gets published

Controlled by the `files` field in `package.json`:


| Path                            | Contents                                                                         |
| ------------------------------- | -------------------------------------------------------------------------------- |
| `bin/`                          | CLI shim (`ai-i18n-tools.mjs`)                                                   |
| `dist/`                         | Compiled JavaScript, type declarations, source maps, dashboard app, i18n locales |
| `data/`                         | Bundled data (`ui-languages-complete.json` for `generate-ui-languages`)          |
| `README.md`                     | Main English README                                                              |
| `docs/ai-i18n-tools-context.md` | Consumer integration guide (shipped on npm)                                      |
| `LICENSE`                       | MIT licence                                                                      |


The full VitePress documentation site under `docs/` is **not** in the npm tarball — it deploys to GitHub Pages on release. Translated READMEs live under `translated-docs/` in the Git repository only (see links in `README.md` / `docs/*.md` on GitHub).

Everything else (source, tests, examples, dev files) is excluded from the published package.