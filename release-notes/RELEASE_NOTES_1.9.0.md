# ai-i18n-tools 1.9.0 Release Notes

## Highlights

- **See what translation runs cost:** Every billed model call is recorded, including accepted attempts and discarded retries. The new `usage` command and the dashboard **Usage & costs** tab report tokens and a single **Cost** — the provider-reported `usage.cost` when the API returns one, otherwise a USD estimate from `providers.<name>.pricing` or per-model `modelPricing`. Calls older than seven UTC days roll into monthly totals. Time windows cover minutes through the last few calendar months, and deletion uses calendar presets.
- **Request timeouts you can set in seconds:** Top-level `requestTimeout` and `requestTimeoutMs` apply to every provider unless that provider sets its own `requestTimeout`.
- **Glossary context reaches the model:** Optional CSV `Context` notes and `glossary.contextFiles` briefs are injected into UI, docs, JSON, SVG, and proofread prompts. Changing that guidance invalidates matching cache and file-tracking rows on the next run.
- **A path off Intlayer:** `migrate-intlayer` imports `*.content.ts` dictionaries into `strings.json` and flat locale files, rewrites simple `useIntlayer` / `getIntlayer` call sites to `t()`, and writes an agent-ready report. Dry run is the default; `--write` applies. The report ends with a step-by-step TODO and concrete call sites, and it does not list catalog hashes.
- **Proofreading ignores misaligned replies:** `proofread-ui` no longer treats a short model response as aligned. Suggestions apply by `index` only when every object has one; a suggestion that is a different string, or that changes placeholder counts, is dropped. Style nits and singular/plural flips on `{{count}}` strings are ignored, and one retry runs when a batch is not fully aligned.
- **Heading-id repairs survive the next sync:** When `write-heading-ids` repositions or repairs a heading id in translated markdown, it updates the matching cached segment, so `sync --force-update` reassembles the file from that cache instead of restoring the stale id.

## Why this release matters

Version 1.9.0 makes translation spend visible — recorded calls, one cost figure, and configurable timeouts — and gives Intlayer projects a concrete migration path, while stopping short or misaligned proofread replies from rewriting UI strings.

---

For the full list of changes, see [`dev/CHANGELOG.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/CHANGELOG.md) (`## [1.9.0] - 2026-09-22`).

---

## Documentation

- [Getting Started](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/GETTING_STARTED.md) — setup, CLI flags, and config reference.  
- [Locale assets guide](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/LOCALE-ASSETS-GUIDE.md) — screenshots and illustrated SVGs in translated docs.  
- [Package Overview](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/PACKAGE_OVERVIEW.md) — architecture and extension points.  
- [AI Agent Context (consumers)](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — concise context for apps **using** the npm package.

---

## License

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br/ai-i18n-tools)
