# ai-i18n-tools 1.8.3 Release Notes

## Highlights

- **Windows install and CLI bootstrap:** `pnpm install` no longer fails with `spawnSync pnpm ENOENT` when `dist/` is missing, and the CLI entry loads compiled modules via `pathToFileURL` so Windows absolute paths no longer hit `ERR_UNSUPPORTED_ESM_URL_SCHEME`.
- **Windows-safe TypeScript build:** When `core.symlinks=false` leaves `src/runtime/ui-languages-complete.json` as a text pointer, the build materializes the real JSON from `data/` before `tsc` runs.
- **Cross-platform release tooling:** `pnpm pre-release` and `pnpm release:github` run Node scripts instead of bash, so the release checklist and GitHub release publishing work on Windows and Linux alike.

## Why this release matters

Version 1.8.3 is a Windows reliability patch: install, build, CLI entry, and release publishing now work without bash or working git symlinks, so contributors on Windows can develop and release on the same footing as Linux.

## Detailed Changes

- **Changed**: scripts — `pnpm release:github` / `release:github:dry` now run `scripts/release.mjs` (Node) instead of `scripts/release.sh`, so GitHub release publishing works on Windows and Linux without bash.
- **Changed**: scripts — `pnpm pre-release` now runs `scripts/pre-release.mjs` (Node) instead of `scripts/pre-release.sh`, so the release gate works on Windows and Linux without bash.
- **Fixed**: install — `scripts/ensure-built.mjs` invokes the build via `node $npm_execpath` (or a shell `pnpm` fallback) and guards nested `prepare` runs, so Windows `pnpm install` no longer fails with `spawnSync pnpm ENOENT` when `dist/` is missing.
- **Fixed**: build — `scripts/ensure-src-ui-languages-json.mjs` materializes `src/runtime/ui-languages-complete.json` from `data/` when the git symlink is a plain text pointer (common on Windows with `core.symlinks=false`), so `tsc` no longer fails on that import.
- **Fixed**: cli — `bin/ai-i18n-tools.mjs` dynamically imports the compiled entry via `pathToFileURL(...).href` so Windows absolute paths no longer trigger `ERR_UNSUPPORTED_ESM_URL_SCHEME` (Node treats bare `C:\...` as an unsupported URL protocol).

---

## Documentation

- [Getting Started](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/GETTING_STARTED.md) — setup, CLI flags, and config reference.  
- [Locale assets guide](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/LOCALE-ASSETS-GUIDE.md) — screenshots and illustrated SVGs in translated docs.  
- [Package Overview](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/PACKAGE_OVERVIEW.md) — architecture and extension points.  
- [AI Agent Context (consumers)](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — concise context for apps **using** the npm package.

---

## License

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br/ai-i18n-tools)
