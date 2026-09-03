# ai-i18n-tools 1.8.4 Release Notes

## Highlights

- **Dependency refresh:** Core libraries move forward (`ai` `^7.0.92`, `zod` `^4.5.4`, `chalk` `^6`, `csv-parse` `^7`, `ignore` `^7.0.8`, `minimatch` `^10.2.6`, and related packages). Tooling follows: Vitest 5, ESLint 10, `typescript-eslint` `^8.69.0`, Prettier `^3.9.6`. Root TypeScript stays on `^6.0.3` because `typescript-eslint` does not yet support TypeScript 7.
- **Examples stay current:** Example apps bump Astro 7.3, Starlight 0.42, Next 16.3, Fumadocs 16.15, i18next 26.4, and React 19.2. `nextjs-app` and `fumadocs-docs` move to TypeScript 7; `nextra-docs` stays on TypeScript 5.9 (Nextra twoslash).
- **Security pins:** `pnpm audit --fix override` covers `brace-expansion`, `dompurify`, `fast-uri`, `js-yaml`, `mermaid`, `qs`, `svgo`, and related transitives. Archived `image-size` (CVE-2025-71329 / CVE-2025-71330) is routed to the drop-in fork `image-size-next@2.1.1`.
- **VitePress alpha.19:** Root and `examples/vitepress-docs` pin VitePress `2.0.0-alpha.19`.
- **Safer upgrades:** `upgrade-dependencies` no longer runs `ncu --doctor` against TypeScript in packages that depend on `typescript-eslint`, so a TypeScript 7 bump no longer fails lint and falsely reverts every other upgrade.

## Why this release matters

Version 1.8.4 is a maintenance release: dependencies and examples stay current, known transitive CVEs are pinned or forked, and the upgrade script no longer treats a blocked TypeScript 7 bump as a reason to roll back the rest of the stack.

## Detailed Changes

- **Changed**: dependencies — bump `@11ty/gray-matter` to `^3.0.0`, `ai` to `^7.0.92`, `@ai-sdk/openai-compatible` to `^3.0.43`, `chalk` to `^6.0.0`, `csv-parse` to `^7.0.2`, `ignore` to `^7.0.8`, `minimatch` to `^10.2.6`, `remove-markdown` to `^0.7.0`, `zod` to `^4.5.4`, and tooling (`vitest` / `@vitest/coverage-v8` `^5.0.0`, `eslint` `^10.9.1`, `typescript-eslint` `^8.69.0`, `prettier` `^3.9.6`, `globals` `^17.12.0`, `@types/node` `^26.4.1`). Root `typescript` stays on `^6.0.3` because `typescript-eslint` does not support TypeScript 7.0.
- **Changed**: examples — refresh example app dependencies (`astro` `^7.3.1`, `@astrojs/starlight` `^0.42.0`, `next` `^16.3.4`, Fumadocs `16.15`, `i18next` `^26.4.2`, React `19.2.8`, and matching type packages). `examples/nextjs-app` and `examples/fumadocs-docs` move to TypeScript 7; `examples/nextra-docs` stays on TypeScript 5.9 because Nextra's twoslash loader breaks on TS 7.
- **Security**: workspace — `pnpm audit --fix override` pins for `brace-expansion`, `dompurify`, `fast-uri`, `js-yaml`, `mermaid`, `qs`, `svgo`, and related transitives; route archived `image-size` (CVE-2025-71329 / CVE-2025-71330, no patched `2.0.3`) to the drop-in fork `image-size-next@2.1.1`.
- **Changed**: scripts — `upgrade-dependencies.sh` / `.ps1` exclude `typescript` from `ncu --doctor` in packages that depend on `typescript-eslint`, so a TypeScript 7 bump no longer fails lint and falsely marks every other upgrade as reverted.
- **Removed**: deps — dropped unused root `package.json` `overrides` for `glob` and `test-exclude`. pnpm 11 reads workspace overrides only; `glob@13.0.6` already resolves via `rimraf`, and `test-exclude` is not in the lockfile.
- **Changed**: workspace — refreshed `minimumReleaseAgeExclude` pins to versions present in `pnpm-lock.yaml` (sharp/`@img/sharp-*` `0.35.4` and libvips `1.3.3`, `@types/node@26.4.1`, `ignore@7.0.8`, Fumadocs `16.15.5`, `ai@7.0.92`, `@ai-sdk/gateway@4.0.74`, `i18next@26.3.6 || 26.4.2`, `@11ty/gray-matter@3.0.0`).
- **Changed**: dependencies — bump `vitepress` from `2.0.0-alpha.17` to `2.0.0-alpha.19` (root exact pin and `examples/vitepress-docs`).

---

## Documentation

- [Getting Started](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/GETTING_STARTED.md) — setup, CLI flags, and config reference.  
- [Locale assets guide](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/LOCALE-ASSETS-GUIDE.md) — screenshots and illustrated SVGs in translated docs.  
- [Package Overview](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/PACKAGE_OVERVIEW.md) — architecture and extension points.  
- [AI Agent Context (consumers)](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — concise context for apps **using** the npm package.

---

## License

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br/ai-i18n-tools)
