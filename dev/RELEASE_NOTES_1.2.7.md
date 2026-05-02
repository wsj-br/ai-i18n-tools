# ai-i18n-tools 1.2.7 Release Notes

## Highlights

- **Translation Cache Editor — failures:** Doc translation failures can record optional `filepath` and `source_text`. List and summary queries join sensibly with `translations` so the editor shows file and source text even when a segment never had a cached translation row (for example after fatal quality or API errors). The SQLite cache upgrades to schema v3 on open.
- **CLI `editor`:** The default HTTP listen port is **8675** (the previous default often conflicted with Windows Hyper-V–reserved TCP ranges). If binding fails, the server tries the next port automatically (up to 1000 attempts) and logs the port it chose.


## Why this release matters

Failure rows in the cache editor are easier to diagnose because you see where each failure came from and the source segment text when applicable. Local editor startup is more dependable on Windows and busy machines thanks to a safer default port and automatic port fallback.

---

## Documentation

- [Getting Started](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/GETTING_STARTED.md) — setup, CLI flags, and config reference.  
- [Package Overview](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/PACKAGE_OVERVIEW.md) — architecture and extension points.  
- [AI Agent Context (consumers)](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — concise context for apps **using** the npm package.


---

## License

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br/ai-i18n-tools)
