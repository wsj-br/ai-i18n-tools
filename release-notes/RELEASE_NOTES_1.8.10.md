# ai-i18n-tools 1.8.10 Release Notes

## Highlights

- **Native-script locales stay in native script:** Translation prompts and validation now enforce the target writing system for unambiguous catalog defaults such as `hi`, `ar`, `bn`, `te`, `ru`, `ja`, and `ko` — not only Hindi. Fully romanized or copied-English output is rejected and retried on the next model; cached UI, docs, JSON, and SVG rows that fail the same check are retranslated. Locales that should stay romanized need an explicit `-Latn` subtag (for example `hi-Latn`).
- **Smarter romanization detection:** Per-string script checks flag only Latin words that are absent from the source, so preserved names, emails, hostnames, and code pass. A batch with enough source prose and zero target-script letters is still rejected as untranslated.
- **Faster UI batches:** New `uiBatchConcurrency` (default **2**) parallelizes LLM batches within a locale during `translate-ui` / `sync-ui`. It is independent of `concurrency` (locales) and `batchConcurrency` (docs/JSON/SVG).
- **`--debug-failed` across every pipeline:** The flag is now a global option and writes `FAILED-TRANSLATION` logs under `cacheDir` for UI, docs, JSON, and SVG failures — including each discarded model attempt (wrong script, parse, or API error), not only the final “all models failed” line.
- **Safer `--force` for UI plurals:** `translate-ui --force` (and `sync` / `sync-ui --force`) no longer regenerates populated `sourceLocale` plural forms in Step 0. Use programmatic `TranslateUIOptions.forceSourcePlurals` when you really want that rewrite.
- **SVG self-closing text:** `translate-svg` no longer treats Inkscape self-closing `<text />` as the start of the next `</text>`, which had produced mismatched `text`/`g` tags.

## Why this release matters

Version 1.8.10 stops native-script locales from silently shipping romanized English, while making UI translation faster to run and failed-model debugging usable across every pipeline.

## Detailed Changes

- **Changed**: scripts — `pnpm pre-release` rewrites example `ai-i18n-tools` pins to `^<root version>` as its first step, instead of failing when they are stale.
- **Added**: config/cli — `uiBatchConcurrency` (default **2**) parallelizes LLM batches within a locale during `translate-ui` / `sync-ui` (plain chunks of 50 and plural groups). Distinct from `concurrency` (locales) and `batchConcurrency` (docs/JSON/SVG).
- **Fixed**: locale-utils — per-string script validation flags only Latin words that are absent from the source (romanization). Preserved names, emails, hostnames, and code pass. A batch with enough source prose and zero target-script letters is still rejected as untranslated. Locales that should stay romanized must use an explicit `-Latn` subtag (for example `hi-Latn`).
- **Changed**: locale-utils/prompts — enforce the target writing system for native-script locales, not only Hindi. Bare `hi`/`ar`/`bn`/`te`/`ru`/`ja`/`ko` (and other unambiguous catalog defaults) now get a script directive that names the locale and forbids Latin transliteration; Japanese and Korean are validated as Kanji/Kana and Hangul/Hanja families. Model output that is fully romanized or copied English is rejected (brand/code/URL tokens still pass) and retried on the next model. Cached UI, docs, JSON, and SVG rows that fail the same check are retranslated; file-level skip is disabled for locales with an expected script so stale romanized cache cannot bypass the policy.
- **Changed**: cli — `--debug-failed` is a global option (listed in `ai-i18n-tools --help`) and writes `FAILED-TRANSLATION` logs under `cacheDir` for UI, docs, JSON, and SVG translation failures (prompt, raw model output, and validation errors), not only `translate-docs` / `sync` markdown quality retries.
- **Fixed**: cli — `--debug-failed` now writes a `FAILED-TRANSLATION` log for each discarded model attempt (wrong script, parse, or API error), including SVG/docs romanization fallbacks such as `⚠️ zh-Hans … failed (… Latin/Roman letters …)`, not only the terminal `❌ All translation models failed for batch` line.
- **Fixed**: SVG — `translate-svg` no longer treats self-closing `<text />` (Inkscape flow text) as the start of the next `</text>`, which produced mismatched `text`/`g` tags in the output file.
- **Fixed**: ui-strings — `translate-ui --force` (and `sync` / `sync-ui --force`) no longer re-runs plural Step 0 for `sourceLocale`. `--force` scopes to the target locales in `-l` / `targetLocales`, so forcing one locale stops spending a source-locale plural call per group, stops overwriting curated or `user-edited` source forms, and stops changing the source of truth that Pass B translates every other locale from. Step 0 still fills source forms that are missing or empty.
- **Added**: api — `TranslateUIOptions.forceSourcePlurals` opts into regenerating populated `sourceLocale` plural forms in Step 0 (previously implied by `force`); no CLI flag, default off.

---

## Documentation

- [Getting Started](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/GETTING_STARTED.md) — setup, CLI flags, and config reference.  
- [Locale assets guide](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/LOCALE-ASSETS-GUIDE.md) — screenshots and illustrated SVGs in translated docs.  
- [Package Overview](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/PACKAGE_OVERVIEW.md) — architecture and extension points.  
- [AI Agent Context (consumers)](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — concise context for apps **using** the npm package.

---

## License

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br/ai-i18n-tools)
