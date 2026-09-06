# ai-i18n-tools 1.8.8 Release Notes

## Highlights

- **Docs build brace escaping:** `escapeVueBracesInMarkdown` now parses CommonMark multi-backtick inline spans (`` `…` ``), so double-backtick examples no longer desync scanning and leave broken `` `<code v-pre>{{…}}</code>` `` markup that fails `pnpm docs:build` with Vue `Invalid Character \`…\``.

## Why this release matters

Version 1.8.8 keeps the VitePress docs site build reliable when English or translated pages use double-backtick inline code around Vue/`{{…}}` placeholders.

## Detailed Changes

- **Fixed**: docs — `escapeVueBracesInMarkdown` parses CommonMark multi-backtick inline spans (`` `…` ``), so double-backtick examples no longer desync scanning and leave `` `<code v-pre>{{…}}</code>` `` that breaks `pnpm docs:build` with Vue `Invalid Character \`…\``.

---

## Documentation

- [Getting Started](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/GETTING_STARTED.md) — setup, CLI flags, and config reference.  
- [Locale assets guide](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/LOCALE-ASSETS-GUIDE.md) — screenshots and illustrated SVGs in translated docs.  
- [Package Overview](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/PACKAGE_OVERVIEW.md) — architecture and extension points.  
- [AI Agent Context (consumers)](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — concise context for apps **using** the npm package.

---

## License

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br/ai-i18n-tools)
