# ai-i18n-tools 1.4.4 Release Notes

## Highlights

- **ReDoS protection:** Added comprehensive safeguards against Regular Expression Denial of Service attacks in glob pattern matching, including pattern length limits, wildcard count restrictions, and execution timeouts.
- **Supply chain security:** Eliminated wildcard dependency vulnerability by pinning `i18next` to a specific version via pnpm overrides, preventing potential supply chain attacks.
- **Dependency reliability:** Switched from `gray-matter-es` to the official `gray-matter` package for markdown front-matter parsing, ensuring better stability and community support.

## Why this release matters

This release strengthens the security posture of the package against ReDoS attacks and supply chain vulnerabilities while maintaining full backward compatibility. Users benefit from safer glob pattern handling and more reliable dependency resolution without any changes to existing workflows.

## Detailed Changes

- **Security**: ReDoS protection in glob pattern matching:
  - `src/core/svg-asset-paths.ts` — `matchesGlobPattern()` now validates patterns for length (max 500 chars), wildcard count (max 10 stars), suspicious nested structures (`***`, multiple `**`), and unbalanced brackets; applies regex execution timeout (1s)
  - `src/cli/file-utils.ts` — `matchGlob()` receives identical protections
  - Throws `GlobPatternError` for invalid patterns instead of risking catastrophic backtracking

- **Security**: dependencies — eliminated wildcard dependency vulnerability:
  - Added `pnpm.overrides` to pin `i18next` to `^26.1.0` (was `*` wildcard in `i18next-scanner@4.6.0`)
  - Prevents supply chain attacks via unbounded version range

- **Security**: dependencies — switched from `gray-matter-es@0.2.1` to `gray-matter@^4.0.3`:
  - Eliminates AI-detected typosquat warning (false positive, but using official package is clearer)
  - Updated imports in `markdown-extractor.ts`, `doc-postprocess.ts`, `doc-translate.ts`, `write-heading-ids-core.ts`

---

## Documentation

- [Getting Started](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/GETTING_STARTED.md) — setup, CLI flags, and config reference.  
- [Package Overview](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/PACKAGE_OVERVIEW.md) — architecture and extension points.  
- [AI Agent Context (consumers)](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — concise context for apps **using** the npm package.

---

## License

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br/ai-i18n-tools)
