# ai-i18n-tools 1.10.0 Release Notes

## Highlights

- **Localize complete HTML sites:** `.html` and `.htm` pages now flow through `translate-docs`, with locale-aware output paths, rewritten page links, optional localized images and icons, generated language lists, and `hreflang` metadata. A new `docs-plain-html` template and example show the full workflow.
- **Add i18n to plain HTML interfaces:** The new browser runtime applies catalog strings and locale-specific image or link URLs without a framework. Built-in selectors can switch catalogs in place or navigate between localized documents, and the `ui-plain-html` template provides a ready-to-run starting point.
- **Manage independent UI catalogs:** Configure multiple `ui` blocks with their own source roots, catalogs, outputs, target locales, manifests, and glossary behavior. `--ui-block` selects a catalog across extraction, translation, synchronization, proofreading, XLIFF export, language generation, and locale cleanup.
- **Translate more Markdown callout formats safely:** MkDocs Material admonitions are translated as complete segments, while expanded recognition for VitePress, Pandoc, MyST, GitHub, and Obsidian callouts protects structural syntax and leaves custom titles translatable.
- **Cover accessible HTML text by default:** `mark-html` now includes `alt` text and ARIA labels in its standard marker set while keeping locale-specific URL attributes reserved for runtime asset switching.

## Why this release matters

Version 1.10.0 brings first-class localization workflows to plain HTML, whether a site uses one page with runtime catalogs or separate documents per locale. It also scales UI translation across multiple catalogs and improves the reliability of Markdown callout translation.

---

For the full list of changes, see [`dev/CHANGELOG.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/CHANGELOG.md) (`## [1.10.0] - 2026-10-03`).

---

## Documentation

- [Getting Started](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/GETTING_STARTED.md) — setup, CLI flags, and config reference.  
- [Locale assets guide](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/LOCALE-ASSETS-GUIDE.md) — screenshots and illustrated SVGs in translated docs.  
- [Package Overview](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/PACKAGE_OVERVIEW.md) — architecture and extension points.  
- [AI Agent Context (consumers)](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — concise context for apps **using** the npm package.

---

## License

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br/ai-i18n-tools)
