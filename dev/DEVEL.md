<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Development Guide](#development-guide)
  - [Prerequisites](#prerequisites)
    - [Optional: locale screenshots (`examples/nextjs-app`)](#optional-locale-screenshots-examplesnextjs-app)
  - [Setting Up the Workspace](#setting-up-the-workspace)
    - [Exposing the CLI globally during development](#exposing-the-cli-globally-during-development)
  - [Common Scripts](#common-scripts)
  - [Project Structure](#project-structure)
  - [Running Examples](#running-examples)
  - [Testing](#testing)
  - [Publishing to npm](#publishing-to-npm)
    - [One-time setup: `NPM_TOKEN` secret](#one-time-setup-npm_token-secret)
    - [Pre-release checklist](#pre-release-checklist)
    - [Bumping the version](#bumping-the-version)
    - [Dry run (optional)](#dry-run-optional)
    - [Creating a GitHub Release](#creating-a-github-release)
    - [What gets published](#what-gets-published)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Development Guide

## Prerequisites

| Tool        | Minimum version | Install                                                      |
|-------------|-----------------|--------------------------------------------------------------|
| **Node.js** | >= 22.16.0      | [nodejs.org](https://nodejs.org/) or via `nvm install 22`    |
| **pnpm**    | >= 10.33.0      | `corepack enable && corepack prepare pnpm@latest --activate` |
| **Git**     | any recent      | [git-scm.com](https://git-scm.com/)                          |

> **Tip:** [Corepack](https://nodejs.org/api/corepack.html) ships with Node.js and is the recommended way to manage pnpm.

### Optional: locale screenshots (`examples/nextjs-app`)

[`examples/nextjs-app/scripts/screenshot-locales.sh`](../examples/nextjs-app/scripts/screenshot-locales.sh) captures headless PNGs (`images/screenshots/<locale>/screenshot.png`) for **`sourceLocale`** plus each **`targetLocales`** entry in `examples/nextjs-app/ai-i18n-tools.config.json` (source first; skips any target that duplicates the source). Extra prerequisites:

| Dependency | Role |
|------------|------|
| **`jq`** | Builds the locale list from the JSON config (`sourceLocale`, then **`targetLocales`** minus duplicates). |
| **`chromium-headless-shell`** | Runs **`--screenshot`** (1300×900); set **`CHROME_BIN`** if your binary lives elsewhere. |
| **Next.js dev server** | Must be reachable while the script runs — from **`examples/nextjs-app`**, run **`pnpm dev`** (default **<http://localhost:3030>**). Override with **`BASE_URL`** if the app listens elsewhere. |

Optional tuning: **`VIRTUAL_TIME_MS`** (default **8000**) delays capture so locale JSON and fonts can load before the screenshot.

## Setting Up the Workspace

```bash
git clone https://github.com/wsj-br/ai-i18n-tools.git
cd ai-i18n-tools
pnpm install
pnpm build
```

After building, the CLI is available locally via `pnpm exec ai-i18n-tools` or through the npm scripts (e.g. `pnpm i18n:extract`).

### Exposing the CLI globally during development

`pnpm exec ai-i18n-tools` and the `pnpm i18n:*` scripts work from inside this repo without any extra setup (after `pnpm build`, which also sets mode `0o755` on `dist/cli/index.js` via `scripts/chmod-cli-bin.mjs`). To call the bare `ai-i18n-tools` command from any directory against your local working tree:

```bash
pnpm install
pnpm build
pnpm link --global
which ai-i18n-tools          # expect: $(pnpm bin -g)/ai-i18n-tools
```

If `pnpm link --global` fails with:

```text
ERR_PNPM_NO_GLOBAL_BIN_DIR  Unable to find the global bin directory
```

pnpm has never set up a global bin on this account. Run the one-time bootstrap and then open a new shell so the updated `PATH` is loaded:

```bash
pnpm setup                   # appends PNPM_HOME + PATH to ~/.bashrc (or ~/.zshrc)
exec $SHELL -l               # reload the shell
pnpm bin -g                  # sanity check: prints e.g. /home/<user>/.local/share/pnpm
pnpm link --global           # retry from the repo root
```

Undo with `pnpm uninstall -g ai-i18n-tools`.

**Cross-platform notes**

- Linux, macOS, and WSL: the CLI needs the executable bit on `dist/cli/index.js`; `pnpm build` sets it (see `scripts/chmod-cli-bin.mjs`).
- Windows (PowerShell, CMD, Git Bash): file mode is irrelevant; pnpm generates `ai-i18n-tools.cmd` and `.ps1` shims that call `node` explicitly. `pnpm setup` is still required once per Windows account.

## Common Scripts

| Command             | Description                                                     |
|---------------------|-----------------------------------------------------------------|
| `pnpm build`        | Compile TypeScript and copy static assets to `dist/`            |
| `pnpm dev`          | Watch mode — recompiles on file changes                         |
| `pnpm test`         | Run the full test suite with coverage                           |
| `pnpm test:watch`   | Run tests in watch mode                                         |
| `pnpm lint`         | Lint the codebase with ESLint                                   |
| `pnpm lint:fix`     | Auto-fix lint issues                                            |
| `pnpm format`       | Format source files with Prettier                               |
| `pnpm format:check` | Check formatting without writing                                |
| `pnpm clean`        | Remove the `dist/` directory                                    |
| `pnpm update-all`   | Build, then run `cleanup` on the root and both example projects |
| `pnpm clean-temp`   | Interactively delete log files and SQLite backups               |

## Project Structure

```text
src/            TypeScript source (compiles to dist/)
tests/          Vitest test files
docs/           English documentation (published to npm)
translated-docs/  Translated docs (published to npm)
dev/            Developer-only files (changelog, this guide)
examples/       Example projects (console-app, nextjs-app)
scripts/        Build helper scripts
```

## Running Examples

Both example projects live under `examples/` and use the locally-built CLI.

```bash
pnpm build
cd examples/console-app
ai-i18n-tools cleanup

cd ../nextjs-app
ai-i18n-tools cleanup
```

## Testing

Tests use [Vitest](https://vitest.dev/) with V8 coverage:

```bash
pnpm test              # single run + coverage report
pnpm test:watch        # re-run on changes
```

---

## Publishing to npm

Publishing is automated via GitHub Actions. When you create a GitHub release,
the CI workflow runs lint, format check, build, and tests across the Node.js
matrix. If all checks pass, it publishes the package to npm automatically.

You can also run the same workflow **manually** from the **Actions** tab
(**Run workflow**). Choose the branch (usually `main`), then:

- Leave **Tag this build as 'latest'** unchecked to run lint, format, build, and
  tests only (no npm publish).
- Turn it **on** to run the full pipeline and **publish** the current
  `package.json` version to npm with the `latest` dist-tag — useful to retry or
  fix a failed release after correcting the branch. Ensure the version in
  `package.json` matches what you intend to ship; npm rejects duplicate
  versions.

### One-time setup: `NPM_TOKEN` secret

The GitHub Actions workflow authenticates with the npm registry using a secret
named `NPM_TOKEN`. You only need to set this up once.

1. Go to [npmjs.com](https://www.npmjs.com/) > **Access Tokens** > **Generate New Token**.
2. Choose **Granular Access Token** with publish permission scoped to
   `ai-i18n-tools` (or use the **Automation** token type, which bypasses 2FA
   for CI).
3. Copy the token.
4. Go to **github.com/wsj-br/ai-i18n-tools** > **Settings** > **Secrets and
   variables** > **Actions** > **New repository secret**.
5. Name: `NPM_TOKEN`, Value: paste the token from step 2.

### Pre-release checklist

- [ ] Run the pre-release script  (`pnpm pre-release`)
- [ ] All tests pass (`pnpm test`)
- [ ] Linting is clean (`pnpm lint`)
- [ ] Version number in `package.json` is correct
- [ ] `dev/CHANGELOG.md` is up to date

### Bumping the version

Use `pnpm version` to bump and create a git tag in one step:

```bash
pnpm version patch   # 1.0.0 → 1.0.1  (bug fixes)
pnpm version minor   # 1.0.0 → 1.1.0  (new features, backward-compatible)
pnpm version major   # 1.0.0 → 2.0.0  (breaking changes)
```

Then push the commit and tag:

```bash
git push && git push --tags
```

### Dry run (optional)

Inspect what will be included in the tarball before creating the release:

```bash
pnpm publish --dry-run
```

Verify that the output includes `dist/`, `docs/`, `translated-docs/`, `README.md`, and `LICENSE`.

### Creating a GitHub Release

1. Go to **Releases** on the GitHub repo:
   <https://github.com/wsj-br/ai-i18n-tools/releases/new>
2. In **Choose a tag**, select the tag you just pushed (e.g. `v1.0.1`).
3. Set the **Release title** to the same tag name (e.g. `v1.0.1`).
4. In the description, paste or summarize the matching section from
   `dev/CHANGELOG.md`. You can also click **Generate release notes** to
   auto-include the commit list.
5. Click **Publish release**.

This triggers the CI workflow which:

1. Runs lint, format check, build, and tests on Node.js 22.x and 24.x.
2. If all checks pass, publishes the package to npm.

Check the **Actions** tab to verify everything passes.

### What gets published

Controlled by the `files` field in `package.json`:

| Path               | Contents                                                           |
|--------------------|--------------------------------------------------------------------|
| `dist/`            | Compiled JavaScript, type declarations, source maps                |
| `README.md`        | Main English README                                                |
| `docs/`            | English docs (GETTING_STARTED, PACKAGE_OVERVIEW, AI agent context) |
| `translated-docs/` | All translated READMEs and docs                                    |
| `LICENSE`          | MIT license                                                        |

Everything else (source, tests, examples, dev files) is excluded from the published package.
