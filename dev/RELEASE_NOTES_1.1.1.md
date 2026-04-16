# v1.1.1 — Example app install reliability, upgrade script, and security hardening

This patch release improves the **nested Docusaurus example** (`examples/nextjs-app/docs-site`) for **pnpm v10** installs, expands **`scripts/upgrade-dependencies.sh`** so dependency upgrades and audits cover the repo root and all examples (including the standalone docs-site lockfile), and raises **dependency overrides** in the example app for patched upstream releases. The published CLI also includes a **readability-focused refactor** in core translation and extraction code (no intentional behavior changes).

For the authoritative per-change list, see [`dev/CHANGELOG.md`](https://github.com/wsj-br/ai-i18n-tools/blob/v1.1.1/dev/CHANGELOG.md) (`## [1.1.1] - 2026-04-16`).

---

## Highlights

- **`examples/nextjs-app/docs-site`** — `pnpm.onlyBuiltDependencies` lists **`core-js`** so pnpm v10 runs its postinstall (avoids the misleading “run `pnpm approve-builds`” banner when approving from that folder would target the workspace root and often show nothing).
- **`scripts/upgrade-dependencies.sh`** — runs `npm-check-updates` and `pnpm audit` (with a fix pass) for the repository root, `examples/console-app`, `examples/nextjs-app`, and `examples/nextjs-app/docs-site`; keeps `workspace:^` for `ai-i18n-tools` in examples; uses nested `pnpm install` / `pnpm audit --ignore-workspace` where the Docusaurus app has its own lockfile; comments document nested install vs `approve-builds`.
- **Security (example app)** — pnpm **overrides** pull **`webpack`**, **`serialize-javascript`**, and **`follow-redirects`** to patched versions; **`webpack`** is pinned to **`5.105.0`** because **`5.106.x`** rejects webpackbar’s legacy `ProgressPlugin` options and breaks `docusaurus build`.

---

## Upgrade notes

- **Consumers of the npm package** — no breaking API or CLI changes are intended in this patch; upgrade as usual.
- **Contributors running the Next.js + Docusaurus examples** — if you install from `examples/nextjs-app/docs-site`, use the app’s own install flow (nested lockfile). After this release, `pnpm install` there should no longer nag about `core-js` builds in a confusing way, and `docusaurus build` should remain compatible with the pinned webpack line.

---

## Fixed

### Examples

- **`examples/nextjs-app/docs-site`** — declare `core-js` under `pnpm.onlyBuiltDependencies` so pnpm v10 executes its build scripts as intended.

---

## Changed

### Tooling

- **`scripts/upgrade-dependencies.sh`** — multi-package upgrade and audit pass across root and example projects; preserves `workspace:^` for `ai-i18n-tools` in examples; documents automation env vars and why the docs-site uses `--ignore-workspace`.

### Code quality (library)

- Minor **formatting and readability** adjustments in CLI and core modules (e.g. `doc-translate`, `extract-strings`, `generate-ui-languages`, placeholder processors) and related unit tests — intended as maintainability-only edits.

---

## Security

- **`examples/nextjs-app/docs-site`** — dependency **overrides** for **`webpack`**, **`serialize-javascript`**, and **`follow-redirects`**; **`webpack`** pinned to **`5.105.0`** for Docusaurus/webpackbar compatibility.

---

## Requirements

- **Node.js** >= 22.16.0  
- **pnpm** >= 10.33.0 (for developing this package)  
- **OpenRouter API key** (`OPENROUTER_API_KEY`) — for translation commands that call the API

---

## Installation

```bash
npm install ai-i18n-tools@1.1.1
# or
pnpm add ai-i18n-tools@1.1.1
```

---

## Documentation

- [Getting Started](https://github.com/wsj-br/ai-i18n-tools/blob/v1.1.1/docs/GETTING_STARTED.md) — setup, CLI flags, and config reference.  
- [Package Overview](https://github.com/wsj-br/ai-i18n-tools/blob/v1.1.1/docs/PACKAGE_OVERVIEW.md) — architecture and extension points.  
- [AI Agent Context (consumers)](https://github.com/wsj-br/ai-i18n-tools/blob/v1.1.1/docs/ai-i18n-tools-context.md) — concise context for apps **using** the npm package.

---

## License

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br/ai-i18n-tools)
