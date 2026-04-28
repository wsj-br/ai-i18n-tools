# ai-i18n-tools 1.2.5 Release Notes

## Highlights

- HTML entity decoding for the Wikimedia-backed UI language catalog build no longer leaves stray literal references when the wiki double-escapes ampersands (for example `&amp;#160;`). Decoding peels `&amp;` before numeric/hex entities and repeats until stable (`scripts/lib/decode-html-entities-ui-languages.mjs`).


## Why this release matters

Regenerating `data/ui-languages-complete.json` stays deterministic: English names from the wiki resolve to plain Unicode instead of accidental `&#160;`-style fragments in labels.


---

## Documentation

- [Getting Started](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/GETTING_STARTED.md) — setup, CLI flags, and config reference.  
- [Package Overview](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/PACKAGE_OVERVIEW.md) — architecture and extension points.  
- [AI Agent Context (consumers)](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — concise context for apps **using** the npm package.


---

## License

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br/ai-i18n-tools)
