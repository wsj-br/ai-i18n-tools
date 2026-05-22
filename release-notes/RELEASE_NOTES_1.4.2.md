# ai-i18n-tools 1.4.2 Release Notes

## Highlights

- **Enhanced SVG reassembly:** The `translate-svg` command now decodes XML entities in model output before writing, preventing double-escaping issues and ensuring SVGs are correctly formed.
- **Config simplification:** Introduced `svg.forceLowercase` as a top-level configuration key, replacing the nested `svg.svgExtractor.forceLowercase` for better clarity while maintaining backward compatibility.
- **Improved CLI robustness:** Fixed glob handling in `collectFilesByExtension` for single-file resolutions and corrected `ui-languages.json` generation to only include `isSourceLocale: true` for the source locale.
- **New `sync-ui` command:** Added a dedicated `sync-ui` command to extract and translate UI strings in a single step, supporting the same options as `translate-ui` for a more efficient UI-only workflow.

## Why this release matters

This release improves the reliability of SVG translations and streamlines the UI internationalization workflow with the new `sync-ui` command and cleaner configuration. It also addresses edge cases in CLI file collection and localized language metadata, ensuring a more stable experience across different project structures.

## Detailed Changes

- **Fixed**: SVG — `translate-svg` reassembly decodes XML entities in model output (`&gt;`, `&amp;`, etc.) before writing, matching batch XML unescape behavior so text is not double-escaped (e.g. `&amp;gt;`).
- **Changed**: config — `svg.forceLowercase` replaces nested `svg.svgExtractor.forceLowercase` (`translate-svg`); legacy nested keys are still accepted and hoisted when loading config.
- **Fixed**: cli — `collectFilesByExtension` glob handling when the pattern resolves to a single file (`fullPath` / `relFromCwd` were undefined in that branch).
- **Added**: CLI `sync-ui` — run extract (if `features.extractUIStrings` is enabled) then translate UI strings (if `features.translateUIStrings` is enabled); same `-l/--locale`, `--force`, `--dry-run`, and `-j/--concurrency` options as `translate-ui` for syncing just UI without documentation or SVG translation.
- **Changed**: ui-languages — `isSourceLocale` is now only included in `ui-languages.json` for the source locale (previously it was included for all locales as `true`/`false`).

---

## Documentation

- [Getting Started](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/GETTING_STARTED.md) — setup, CLI flags, and config reference.  
- [Package Overview](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/PACKAGE_OVERVIEW.md) — architecture and extension points.  
- [AI Agent Context (consumers)](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — concise context for apps **using** the npm package.

---

## License

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br/ai-i18n-tools)
