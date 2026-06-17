# ai-i18n-tools 1.6.1 Release Notes

## Highlights

- **Front matter parser hardened against a YAML DoS:** Replaced `gray-matter` (which pins the vulnerable `js-yaml@3.x`) with the maintained `@11ty/gray-matter` fork on `js-yaml@^4.2.0`, clearing the merge-key denial-of-service advisory (CVE-2026-53550 / GHSA-q7cg-457f-vx79) for which no `js-yaml@3.x` patch exists. A workspace override routes transitive (Docusaurus) usage to the fork as well.
- **`pnpm audit` is clean again:** Bumped `astro` to `^6.4.6` in the example sites to close the Host header SSRF advisory (GHSA-2pvr-wf23-7pc7), and added overrides for `vite`, `esbuild`, and `joi` to clear the remaining advisories.
- **Dependency refresh:** Upgraded `@babel/parser` and `@babel/types` to `^8.0.0` and `csv-parse` to `^7.0.0` (no change to the API surface we use), refreshed dev dependencies, and set `packageManager` to `pnpm@11.7.0`.
- **Leaner workspace overrides:** Pruned stale `pnpm-workspace.yaml` overrides whose advisories are now fixed upstream, keeping only the load-bearing pins.
- **More accurate third-party `NOTICES`:** Reworked notices generation to select each package's actual license file (and never fall back to a `README.md`), and to emit the standard license text for packages that ship no license file. Dropped the `license-checker-rseidelsohn` dependency in the process.

## Why this release matters

Version 1.6.1 is a security-focused maintenance release that eliminates known dependency advisories—most notably a `js-yaml` denial-of-service path in markdown front matter parsing—so the package and its example sites install with a clean `pnpm audit`. There are no user-facing translation or CLI behavior changes.

## Detailed Changes

- **Security**: dependencies — replaced `gray-matter@4.0.3` (which pins the vulnerable `js-yaml@3.x`) with the maintained fork `@11ty/gray-matter@^2.1.0` (uses `js-yaml@^4.2.0`); updated `matter` imports in `doc-translate.ts`, `doc-postprocess.ts`, `markdown-extractor.ts`, and `write-heading-ids-core.ts`. Added a workspace override `gray-matter: npm:@11ty/gray-matter@^2.1.0` so transitive (Docusaurus) usage also resolves to the fork, clearing the `js-yaml` merge-key DoS advisory (CVE-2026-53550 / GHSA-q7cg-457f-vx79), for which no `js-yaml@3.x` patch exists.

- **Security**: examples — bumped `astro` to `^6.4.6` in `examples/astro-docs` and `examples/astro-website` to clear the Host header SSRF advisory (GHSA-2pvr-wf23-7pc7); resolves to `6.4.7`.

- **Security**: dependencies — added `pnpm-workspace.yaml` overrides `vite@>=8.0.0 <8.0.16` → `^8.0.16`, `esbuild@>=0.27.3 <0.28.1` → `^0.28.1`, and `joi@>=17.0.0 <17.13.4` → `^17.13.4` to clear remaining `pnpm audit` advisories. `pnpm audit` is now clean.

- **Changed**: dependencies — upgraded `@babel/parser` and `@babel/types` to `^8.0.0` and `csv-parse` to `^7.0.0` (no API surface we use changed); refreshed dev dependencies and set `packageManager` to `pnpm@11.7.0`.

- **Removed**: tooling — pruned stale/redundant `pnpm-workspace.yaml` overrides whose advisories are fixed upstream (they now resolve to safe versions on their own): `fast-uri`, `@babel/plugin-transform-modules-systemjs`, `qs`, `ws`, plus the redundant subset pins `serialize-javascript@<=7.0.2` and `fast-uri@<=3.1.0`; trimmed the matching `minimumReleaseAgeExclude` entries. Load-bearing overrides (`postcss`, `serialize-javascript@<7.0.5`, `uuid`) are kept; `pnpm audit` remains clean.

- **Changed**: scripts — rewrote `scripts/write-third-party-notices.js` to resolve the production dependency trees via `pnpm licenses list --prod --json` (per first-party root) and select the license body ourselves, in order: a `scripts/write-third-party-notices.json` `packageOverrides` entry (matched by name + semver range), else a real license file (`LICENSE`/`LICENCE`/`COPYING`/`UNLICENSE`, including suffixed variants such as `LICENSE.MIT` and `COPYING.LESSER`), never `README.md`, else the standard license text for the package's SPDX id.

- **Changed**: tooling — replaced the root `3p-lic-clarifications.json` with `scripts/write-third-party-notices.json` (co-located with its script) and generalized it to carry `spdxLicenseTexts` (canonical license text per SPDX id, e.g. `MIT`, `ISC`, `BSD-2-Clause`, `Apache-2.0`, `LGPL-3.0-or-later`), replacing the previous per-package license-text entries. Packages that ship no license file now render the standard text for their license, with the copyright line filled from the package `author` (and omitted when no author is declared); `OR` expressions like `(MIT OR CC0-1.0)` resolve to the first known license.

- **Removed**: dependencies — dropped the `license-checker-rseidelsohn` dev dependency (and `scripts/license-checker-custom-format.json`) now that `NOTICES` generation no longer relies on it; added `semver` as a dev dependency for `packageOverrides` range matching.

---

## Documentation

- [Getting Started](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/GETTING_STARTED.md) — setup, CLI flags, and config reference.  
- [Locale assets guide](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/LOCALE-ASSETS-GUIDE.md) — screenshots and illustrated SVGs in translated docs.  
- [Package Overview](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/PACKAGE_OVERVIEW.md) — architecture and extension points.  
- [AI Agent Context (consumers)](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — concise context for apps **using** the npm package.

---

## License

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br/ai-i18n-tools)
