# ai-i18n-tools 1.8.7 Release Notes

## Highlights

- **CJK-friendly placeholder integrity:** Document translation pre-restore checks now allow emphasis markers such as `{{SE}}` / `{{IT}}` to move relative to numbered tokens (`{{URL_N}}`, `{{ILC_N}}`, …) when per-type counts still match, so natural CJK word-order reorderings no longer fail as `placeholderTagMap` token-sequence mismatches. Numbered-token order and HTML reuse/drop checks are unchanged.

## Why this release matters

Version 1.8.7 stops valid CJK document translations from being rejected when emphasis markers shift around URLs and other numbered placeholders while the token inventory stays intact.

## Detailed Changes

- **Fixed**: docs — pre-restore placeholder integrity allows `{{SE}}` / `{{IT}}` / other emphasis markers to move relative to numbered tokens (`{{URL_N}}`, `{{ILC_N}}`, …) when per-type counts match, so CJK word-order reorderings no longer fail as `placeholderTagMap` token-sequence mismatches; numbered-token order and HTM reuse/drop checks are unchanged.

---

## Documentation

- [Getting Started](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/GETTING_STARTED.md) — setup, CLI flags, and config reference.  
- [Locale assets guide](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/LOCALE-ASSETS-GUIDE.md) — screenshots and illustrated SVGs in translated docs.  
- [Package Overview](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/PACKAGE_OVERVIEW.md) — architecture and extension points.  
- [AI Agent Context (consumers)](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — concise context for apps **using** the npm package.

---

## License

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br/ai-i18n-tools)
