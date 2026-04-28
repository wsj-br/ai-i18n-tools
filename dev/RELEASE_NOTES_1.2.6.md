# ai-i18n-tools 1.2.6 Release Notes

## Highlights

- **Windows / PowerShell:** `sync` and `translate-ui` no longer fail with `EPERM` when replacing `strings.json`. Parallel locale workers used to each perform an atomic rename to the same file; the catalog is now written once per parallel batch (and after a single-locale run). Atomic file writes also retry the rename on Windows when the destination is briefly locked (indexer, antivirus, etc.).


## Why this release matters

Running UI translation with multiple locales on Windows is reliable: `strings.json` is no longer contended by concurrent atomic replace operations, and transient locks during rename are retried.


---

## Documentation

- [Getting Started](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/GETTING_STARTED.md) — setup, CLI flags, and config reference.  
- [Package Overview](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/PACKAGE_OVERVIEW.md) — architecture and extension points.  
- [AI Agent Context (consumers)](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — concise context for apps **using** the npm package.


---

## License

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br/ai-i18n-tools)
