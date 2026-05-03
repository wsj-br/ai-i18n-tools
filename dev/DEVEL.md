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
    - [Starting a release](#starting-a-release)
    - [Pre-release checklist](#pre-release-checklist)
    - [Bumping the version](#bumping-the-version)
    - [Release notes and changelog](#release-notes-and-changelog)
    - [Creating the GitHub release (`scripts/release.sh`)](#creating-the-github-release-scriptsreleasesh)
    - [npm package dry run (optional)](#npm-package-dry-run-optional)
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

| Command                   | Description                                                                                 |
|---------------------------|---------------------------------------------------------------------------------------------|
| `pnpm build`              | Compile TypeScript and copy static assets to `dist/`                                        |
| `pnpm dev`                | Watch mode — recompiles on file changes                                                     |
| `pnpm test`               | Run the full test suite with coverage                                                       |
| `pnpm test:watch`         | Run tests in watch mode                                                                     |
| `pnpm lint`               | Lint the codebase with ESLint                                                               |
| `pnpm lint:fix`           | Auto-fix lint issues                                                                        |
| `pnpm format`             | Format source files with Prettier                                                           |
| `pnpm format:check`       | Check formatting without writing                                                            |
| `pnpm clean`              | Remove the `dist/` directory                                                                |
| `pnpm update-all`         | Build, then run `cleanup` on the root and both example projects                             |
| `pnpm clean-temp`         | List temp `*.log` / `cache.db.backup*.sqlite` files; delete after confirm, or pass `-f` for no prompt |
| `pnpm release:github`     | Create the GitHub release from `dev/RELEASE_NOTES_<version>.md` (runs `scripts/release.sh`) |
| `pnpm release:github:dry` | Dry-run the release script (validate inputs; no tag push or GitHub release)                 |

## Project Structure

```text
src/            TypeScript source (compiles to dist/)
tests/          Vitest test files
data/           Bundled JSON (e.g. ui-languages master catalog; published to npm)
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

### Starting a release

When you start a new release, make sure all documents are translated and the pre-release check is successful:

```bash
pnpm update-all
pnpm pre-release
```

That script runs format, lint, clean, build, and tests (see the `pre-release` script in `package.json`). Resolve any failures locally; CI applies the same checks before npm publish.

### Pre-release checklist

- [ ] `pnpm i18n:sync` completed successfully
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

Before you run the release script, the repo must contain **`dev/RELEASE_NOTES_<version>.md`** for the exact version in `package.json` (for example `dev/RELEASE_NOTES_1.2.8.md` when the package version is `1.2.8`).

Copy and paste **[`dev/release-new-version-prompt.md`](release-new-version-prompt.md)** into a Cursor chat to:

1. Draft **`dev/RELEASE_NOTES_<version>.md`** in the same style as prior `dev/RELEASE_NOTES_*.md` files.
2. Update **`dev/CHANGELOG.md`**: move the `## [Unreleased]` bullets into a new `## [x.y.z] - YYYY-MM-DD` section and leave an empty `[Unreleased]` section for the next cycle.

Commit the new or updated release-notes file and changelog together with any other release prep so **`git status` is clean** before you publish the GitHub release.

### Creating the GitHub release (`scripts/release.sh`)

Publishing the GitHub release is done with the release script (wrapper: **`pnpm release:github`**, which runs `bash scripts/release.sh` from the repository root).

**Prerequisites**

- [GitHub CLI](https://cli.github.com/) (`gh`) installed and authenticated (`gh auth login`).
- Working tree clean unless you intentionally pass `--verify-clean=false` to the script.
- **`dev/RELEASE_NOTES_<version>.md`** present for the current `package.json` version.

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

The script creates an annotated tag **`v<version>`** at **HEAD**, pushes it to **`origin`**, and creates a GitHub release whose body is **`dev/RELEASE_NOTES_<version>.md`**. If that tag or a GitHub release for it already exists, the script removes them and recreates the tag at the current HEAD so you can fix a mistaken tag or add follow-up commits before releasing.

That GitHub release triggers CI, which runs lint, format check, build, and tests; if all checks pass, it publishes the package to npm. Check the **Actions** tab to verify.

**Manual alternative:** you can still create a release from the GitHub **Releases** UI if needed; prefer the script so the tag, title, and notes stay aligned with `package.json` and `dev/RELEASE_NOTES_<version>.md`.

### npm package dry run (optional)

Inspect what will be included in the tarball:

```bash
pnpm publish --dry-run
```

Verify that the output includes `dist/`, `data/`, `docs/`, `translated-docs/`, `README.md`, and `LICENSE`.

### What gets published

Controlled by the `files` field in `package.json`:

| Path               | Contents                                                           |
|--------------------|--------------------------------------------------------------------|
| `dist/`            | Compiled JavaScript, type declarations, source maps                |
| `data/`            | Bundled data (for example `ui-languages-complete.json` for `generate-ui-languages`) |
| `README.md`        | Main English README                                                |
| `docs/`            | English docs (GETTING_STARTED, PACKAGE_OVERVIEW, AI agent context) |
| `translated-docs/` | All translated READMEs and docs                                    |
| `LICENSE`          | MIT licence                                                        |

Everything else (source, tests, examples, dev files) is excluded from the published package.
