# ai-i18n-tools 1.8.5 Release Notes

## Highlights

- **Stricter document placeholder integrity:** `translate-docs` now rejects HTML placeholder reuse/drop and invented `{{IDENT}}` tokens after restore (token-sequence, tag-kind, and source-aware brace checks), with the same quality-retry / model-fallback loop used for leaks.
- **Safer plural UI translations:** `translate-ui` Step 0 and Pass B reject cardinal forms that drop or invent source placeholders, or inject digits / `{{count}}` into noun-only labels. Failures retry via the existing model-fallback loop.
- **Clearer plural prompts:** System and Step 0 / Pass B prompts include a per-request `PLACEHOLDERS` inventory (or an explicit noun-only constraint), anti-gettext/ICU guidance, and an Intl `n=` hint so sample counts are treated as selectors only — aimed at code models that previously invented quantities or dropped `{{count}}`.
- **Richer live smokes:** Docs and plural OpenRouter live tests can dump prompts, model returns, usage, and integrity / placeholder check results when run with `pnpm test:live -- --verbose`.
- **npm Trusted Publishers:** The publish job uses OIDC only (no `NODE_AUTH_TOKEN` / `NPM_TOKEN` fallback) and bumps `actions/setup-node` to `v7`.

## Why this release matters

Version 1.8.5 hardens translation quality for documents and plurals by catching placeholder and invented-token failures before they ship, and tightens CI publishing to npm Trusted Publishers (OIDC).

## Detailed Changes

- **Changed**: tests/live — docs and plural OpenRouter smokes can dump the system/user prompt sent, model return (raw + parsed/restored), usage, and detailed integrity / placeholder check results; off by default, enable with `pnpm test:live -- --verbose` (or `-v`).
- **Added**: api — `translatePluralCardinalBatch` returns optional `rawAssistantContent` for live/debug dumps of the assistant reply before parse.
- **Fixed**: docs — reject HTML placeholder reuse/drop and invented `{{IDENT}}` after `translate-docs` restore (token-sequence + tag-kind + source-aware brace checks; quality retry cycles models as for leaks).
- **Changed**: docs prompt — require each `{{…}}` token once in the same order, forbid inventing new `{{…}}` (glossary targets stay plain text), list `{{JXA_N}}` / `{{ADM_TCLOSE_N}}`, and use `{{HTM_0}}` in the markdown example instead of a fake `{{PLACEHOLDER}}`.
- **Fixed**: ui/plurals — `translate-ui` Step 0 and Pass B now reject cardinal forms that drop or invent source placeholders (or inject digits / `{{count}}` into noun-only labels such as `Minutes`). Failures throw `PluralFormsPlaceholderError` so the existing model-fallback loop retries. New helpers: `pluralFormPlaceholderIssues` / `assertPluralFormsPlaceholders` (`src/core/plural-placeholders.ts`); shared token extraction in `src/core/ui-placeholders.ts`.
- **Changed**: prompts — plural system rules and Step 0 / Pass B user text now include a per-request `PLACEHOLDERS` inventory (or an explicit noun-only constraint), anti-gettext/ICU guidance, and an Intl `n=` hint that sample counts are selectors only — aimed at code models (e.g. `mistralai/codestral-2508`) that previously invented quantities or dropped `{{count}}` from `_one`.
- **Changed**: ci — bump `actions/setup-node` from `v6` to `v7` in `ci.yml` and `docs.yml`.
- **Changed**: ci — publish with npm Trusted Publishers (OIDC) only: drop `setup-node` `registry-url` and `NODE_AUTH_TOKEN` / `NPM_TOKEN` fallback from the publish job.

---

## Documentation

- [Getting Started](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/GETTING_STARTED.md) — setup, CLI flags, and config reference.  
- [Locale assets guide](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/LOCALE-ASSETS-GUIDE.md) — screenshots and illustrated SVGs in translated docs.  
- [Package Overview](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/PACKAGE_OVERVIEW.md) — architecture and extension points.  
- [AI Agent Context (consumers)](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — concise context for apps **using** the npm package.

---

## License

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br/ai-i18n-tools)
