# Docs translation: HTML token swaps and invented `{{…}}` leftovers

**Status:** regression corpus (observed in a consumer project; not yet fixed in the tool)  
**Seen in:** duplistatus Docusaurus docs, `ai-i18n-tools` 1.8.4 (`translate-docs`)  
**Models that wrote the bad segments:** `mistralai/codestral-2508` (1.1 `de` HTML swap), `google/gemma-4-26b-a4b-it` (1.2 `es` `{{TAM}}`) via OpenRouter; see [Cache records](#cache-records-same-models-for-live-reproduction)  
**Consumer build:** Docusaurus 3.10.2 MDX / SSG  
**Related code:** [`src/processors/html-tag-placeholders.ts`](../src/processors/html-tag-placeholders.ts), [`src/processors/placeholder-handler.ts`](../src/processors/placeholder-handler.ts), [`src/processors/translation-placeholder-leaks.ts`](../src/processors/translation-placeholder-leaks.ts), [`src/processors/glossary-force-placeholders.ts`](../src/processors/glossary-force-placeholders.ts), [`src/cli/doc-translate.ts`](../src/cli/doc-translate.ts)

These failures landed in `documentation/i18n/` after `pnpm i18n:translate:docs`. They were **not** hand-edited. Both passed the current post-restore leak check and were written to disk.

Use this file as the acceptance corpus when tightening docs-translation validation. A later improvement has worked if **every “want: fail” row below is rejected** (retry / do not persist) and **every “want: pass” row is accepted**.

## Problem

`translate-docs` masks HTML (and other syntax) as opaque `{{HTM_N}}` tokens, sends the masked segment to the LLM, then restores from the map. Quality control after restore is `hasInternalPlaceholderLeak()`, which only looks for **known leftover token names**.

Two opposite bugs slipped through:

1. **Token reuse / swap** — the model keeps a valid `{{HTM_N}}` spelling but uses the **wrong index**. Restore injects a different real tag. The output has **no leftover tokens**, so the leak checker is silent, but the HTML/MDX is no longer well-formed.
2. **Invented `{{WORD}}`** — the model emits a `{{…}}` that is **not** in the official token set (`HTM_`, `GLS_`, `MDX_`, …). The leak regex does not match it. Docusaurus MDX then treats `{WORD}` as a JavaScript identifier.

Prompt-only “preserve placeholders” is not enough. The same pass produced both failures.

## Current behaviour (what already works)

| Layer | What it does |
| --- | --- |
| `protectHtmlTags` | Replaces allowlisted tags/comments with `{{HTM_0}}`, `{{HTM_1}}`, … |
| `restoreHtmlTags` | `split('{{HTM_i}}').join(htmlTagMap[i])` — **every** occurrence of that token becomes that tag (duplicates allowed; unused map entries are dropped) |
| Glossary force | Forced CSV rows become `{{GLS_N}}` then restore to the target wording |
| `hasInternalPlaceholderLeak` | After restore, flags leftover `{{HTM_N}}`, `{{GLS_N}}`, `{{MDX_N}}`, `{{JXA_N}}`, `{{ADM_*}}`, `{{HDG_N}}`, `{{ANC_N}}`, `{{URL_N}}`, `{{BLD_N}}`, `{{ILC_N}}`, `{{IT}}` / `{{IU}}` / `{{SE}}` / `{{SU}}` / `{{ST}}` |
| LLM fallback | Retries on empty/invalid output and on leak / AST quality errors |

Missing:

- After restore, the **multiset of restored HTML tags** must match the source map (no reuse, no drop).
- After restore, leftover `{{IDENT}}` that is **not** author-source interpolation must fail even when `IDENT` is not a known internal prefix.
- Optional: restored HTML/MDX must still parse (tag balance / MDX compile).

Replay of bug 1 (no LLM; confirmed on this repo):

```text
source:   <li><a href="display-settings.md">Display Settings</a>: …</li>
protected:
  {{HTM_0}}{{HTM_1}}Display Settings{{HTM_2}}: …{{HTM_3}}
map:      ["<li>", "<a href=\"display-settings.md\">", "</a>", "</li>"]

# model reuses {{HTM_3}} where {{HTM_2}} belonged
swapped:  {{HTM_0}}{{HTM_1}}Anzeigeeinstellungen{{HTM_3}}: …{{HTM_3}}
restored: <li><a href="display-settings.md">Anzeigeeinstellungen</li>: …</li>

hasInternalPlaceholderLeak(swapped)  === true   # tokens still present
hasInternalPlaceholderLeak(restored) === false  # current check runs here
```

That restored line is exactly the German file that broke `docusaurus build`.

---

## Observed consumer failures (duplistatus, 1.8.4)

Only these two segments are known from that pass. Keep them as the first fixtures.

### 1.1 German settings overview — `</a>` replaced by `</li>`

| | |
| --- | --- |
| Locale | `de` |
| File | `documentation/i18n/de/docusaurus-plugin-content-docs/current/user-guide/settings/overview.md` (line 36) |
| English source file | `documentation/docs/user-guide/settings/overview.md` (admin table starts line 13; the broken `<li>` is line 40) |
| Cached segment | Whole admin-view `<table>…</table>` (`start_line` 13), not the isolated list item |
| Model | `mistralai/codestral-2508` (OpenRouter) |
| Cache | duplistatus `.translation-cache/cache.db` → `translations` |
| `source_hash` | `b581569225d1c84c` |
| Written | `2026-09-06 01:59:39` UTC |
| Consumer symptom | MDX compile: `Unexpected closing tag </li>, expected corresponding closing tag for <a>` (`mdast-util-mdx-jsx` / `end-tag-mismatch`) |
| Want | **fail-tag-swap** (do not persist) |

**English source segment:**

```html
<li><a href="display-settings.md">Display Settings</a>: Configure theme, chart time range, chart style, format locale, auto-refresh interval, card sort order, and week start</li>
```

**Protected form** (`protectHtmlTags` only; same tokens through `PlaceholderHandler` for this line):

```text
{{HTM_0}}{{HTM_1}}Display Settings{{HTM_2}}: Configure theme, chart time range, chart style, format locale, auto-refresh interval, card sort order, and week start{{HTM_3}}
```

| Token | Original |
| --- | --- |
| `{{HTM_0}}` | `<li>` |
| `{{HTM_1}}` | `<a href="display-settings.md">` |
| `{{HTM_2}}` | `</a>` |
| `{{HTM_3}}` | `</li>` |

**Bad model output (reconstructed; restore matches the file on disk):**

```text
{{HTM_0}}{{HTM_1}}Anzeigeeinstellungen{{HTM_3}}: Konfigurieren Sie Design, Diagramm-Zeitbereich, Diagrammstil, Gebietsschema-Format, automatisches Aktualisierungsintervall, Karten-Sortierreihenfolge und Wochenstart{{HTM_3}}
```

**Bad restored output (exactly what was written):**

```html
<li><a href="display-settings.md">Anzeigeeinstellungen</li>: Konfigurieren Sie Design, Diagramm-Zeitbereich, Diagrammstil, Gebietsschema-Format, automatisches Aktualisierungsintervall, Karten-Sortierreihenfolge und Wochenstart</li>
```

**Acceptable restored output** (translation may vary; tags must match the source map):

```html
<li><a href="display-settings.md">Anzeigeeinstellungen</a>: Konfigurieren Sie Design, Diagramm-Zeitbereich, Diagrammstil, Gebietsschema-Format, automatisches Aktualisierungsintervall, Karten-Sortierreihenfolge und Wochenstart</li>
```

Sibling locales in the same pass kept `</a>` correctly (`fr`, `es`, `pt-BR`, `zh-Hans`, `hi`). Treat those as **pass** controls, not as extra fail cases.

### 1.2 Spanish user-guide overview — invented `{{TAM}}`

| | |
| --- | --- |
| Locale | `es` |
| File | `documentation/i18n/es/docusaurus-plugin-content-docs/current/user-guide/overview.md` (line 14) |
| English source file | `documentation/docs/user-guide/overview.md` (`start_line` 15; the `{{TAM}}` bullet is line 16) |
| Cached segment | Feature-list bullets from “Flexible notification system…” through the language-support line |
| Model | `google/gemma-4-26b-a4b-it` (OpenRouter) |
| Cache | duplistatus `.translation-cache/cache.db` → `translations` |
| `source_hash` | `37a373297e954ad9` |
| Written | `2026-09-06 00:11:00` UTC |
| Consumer symptom | SSG `ReferenceError: TAM is not defined` on `/es/user-guide/overview` (MDX treats `{TAM}` as JS) |
| Want | **fail-invented-braces** (do not persist) |

**English source segment:**

```markdown
- Optional [API keys](settings/api-keys-settings.md) for Duplicati uploads and Homepage widgets, with upload size and rate limits
```

**Bad output (exactly what was written):**

```markdown
- [Claves de API](settings/api-keys-settings.md) opcionales para las subidas de Duplicati y los widgets de Homepage, con límites de tasa y de {{TAM}} de subida
```

**Acceptable output** (wording may vary; no leftover `{{TAM}}`):

```markdown
- [Claves de API](settings/api-keys-settings.md) opcionales para las subidas de Duplicati y los widgets de Homepage, con límites de tasa y de tamaño de subida
```

**Glossary context (hint, not a forced row):** consumer `glossary-user.csv` maps dashboard column abbreviations:

```csv
"Size","es","Tam"
"Size","pt-BR","Tam."
```

Those rows have no `Force` column, so this segment was **not** wrapped as `{{GLS_N}}`. Official force tokens are `{{GLS_0}}`, not `{{TAM}}`. Current leak regex:

```text
{{TAM}}     → not a leak (false negative)
{{GLS_0}}   → leak
{{HTM_0}}   → leak
{{HTM_3}}   → leak only if it survives restore
```

Likely model behaviour: glossary hint “Size → Tam” plus the tool’s `{{TOKEN}}` style produced a made-up `{{TAM}}`. A corrupted `{{GLS_N}}` / `{{HTM_N}}` renamed to `{{TAM}}` would look the same after restore.

`pt-BR` in the same pass translated the line as `limites de tamanho e taxa de upload` (no leftover token). Use as a **pass** control. The `Size` → `Tam` row is still a poor global glossary for running text such as “upload size”; that is a consumer-config issue, not a substitute for leak detection.

### Cache records (same models for live reproduction)

Source: duplistatus `.translation-cache/cache.db` (gitignored; `cacheDir` in that project’s `ai-i18n-tools.config.json`). Provider was **OpenRouter**. `translation_failures` has **no rows** for these hashes — the current quality check accepted both writes.

| Case | `source_hash` | Locale | Model | `start_line` | `created_at` | Distinctive `translated_text` marker |
| --- | --- | --- | --- | --- | --- | --- |
| 1.1 bad | `b581569225d1c84c` | `de` | `mistralai/codestral-2508` | 13 | `2026-09-06 01:59:39` | `Anzeigeeinstellungen</li>:` (no `Anzeigeeinstellungen</a>`) |
| 1.1 earlier OK | `569cc1d2bf19c421` | `de` | `mistralai/codestral-2508` | 13 | `2026-09-06 00:11:21` | Same file, previous English hash; tags were correct |
| 1.2 bad | `37a373297e954ad9` | `es` | `google/gemma-4-26b-a4b-it` | 15 | `2026-09-06 00:11:00` | `{{TAM}}` |

Same-hash siblings (useful as pass controls; they do **not** show that the model is safe):

| `source_hash` | Locale | Model | Outcome |
| --- | --- | --- | --- |
| `b581569225d1c84c` | `fr`, `hi`, `pt-BR` | `mistralai/codestral-2508` | `</a>` intact |
| `b581569225d1c84c` | `es`, `zh-Hans` | `google/gemma-4-26b-a4b-it` | `</a>` intact |
| `37a373297e954ad9` | `de`, `fr`, `hi`, `pt-BR`, `zh-Hans` | `mistralai/codestral-2508` | no `{{TAM}}` |

Codestral produced **both** the good earlier German table (`569cc1d2…`) and the broken later one (`b5815692…`). Gemma invented `{{TAM}}` only for `es` of `37a37329…`.

Lookup (metadata only):

```sql
SELECT source_hash, locale, model, start_line, created_at,
       (translated_text LIKE '%Anzeigeeinstellungen</li>%') AS has_broken_a_tag,
       (translated_text LIKE '%{{TAM}}%') AS has_tam_token
FROM translations
WHERE source_hash IN ('b581569225d1c84c', '569cc1d2bf19c421', '37a373297e954ad9')
ORDER BY source_hash, locale;
```

To replay against the same model, load `source_text` for that `(source_hash, locale)`, run it through `protectSegmentForTranslation` (same glossary / markdown placeholders as `translate-docs`), and call OpenRouter with that model id. Do not rely on a single sample: Codestral was fine on the previous hash and on other locales of the broken hash.

Consumer model list at the time (`ai-i18n-tools.config.json` → `providers.openrouter.translationModels`): first `mistralai/codestral-2508`, then `google/gemma-4-26b-a4b-it`, then others. That matches the cache: Codestral usually wrote the segment; Gemma wrote 1.2 `es` and the 1.1 `es` / `zh-Hans` siblings.

---

## Test corpus

Legend for **want**:

- **pass** — accept and persist
- **fail-tag-swap** — restored HTML tag multiset ≠ source map (reuse, drop, or reorder that changes tags)
- **fail-invented-braces** — output contains `{{…}}` that is not an author-source interpolation and not a successfully restored internal token
- **fail-leak** — leftover official token (`{{HTM_0}}`, …) — already implemented

### 2. HTML tag map (drive `protectHtmlTags` → mutate → `restoreHtmlTags` → validator)

Use the exact 1.1 source as fixture `2.1`.

| # | Model text after protect (then restore) | Want | Notes |
| --- | --- | --- | --- |
| 2.1 | `{{HTM_0}}{{HTM_1}}Anzeigeeinstellungen{{HTM_3}}: …{{HTM_3}}` | fail-tag-swap | Observed. `</a>` (`HTM_2`) dropped; `</li>` used twice. |
| 2.2 | `{{HTM_0}}{{HTM_1}}Anzeigeeinstellungen{{HTM_2}}: …{{HTM_3}}` | pass | Correct token set, translated prose. |
| 2.3 | `{{HTM_0}}{{HTM_1}}Display Settings{{HTM_2}}: …{{HTM_3}}` | pass | Untranslated prose is copy quality, not this check. |
| 2.4 | `{{HTM_0}}{{HTM_1}}Anzeigeeinstellungen{{HTM_2}}: …` (no `{{HTM_3}}`) | fail-tag-swap | Dropped closing `</li>`. |
| 2.5 | `{{HTM_1}}Anzeigeeinstellungen{{HTM_2}}: …{{HTM_3}}` (no `{{HTM_0}}`) | fail-tag-swap | Dropped opening `<li>`. |
| 2.6 | `{{HTM_0}}{{HTM_1}}Anzeigeeinstellungen</a>: …{{HTM_3}}` | fail-tag-swap | Literal `</a>` plus unused `HTM_2`; or treat as invented raw tag. After restore the map’s `</a>` is missing. |
| 2.7 | `{{HTM_0}}{{HTM_2}}Anzeigeeinstellungen{{HTM_1}}: …{{HTM_3}}` | fail-tag-swap | Open `<a>` and `</a>` swapped — still well-formed? No: `</a>` before `<a>`. |
| 2.8 | `{{HTM_3}}{{HTM_2}}{{HTM_1}}{{HTM_0}}` + prose | fail-tag-swap | All tokens present once but order/tag sequence ≠ source. |

Suggested mechanical rule for 2.*:

1. Count occurrences of each `{{HTM_i}}` in the model output **before** restore. Require **exactly one** of each index `0 … map.length-1`.
2. After restore, `protectHtmlTags(output).htmlTagMap` must equal the original map (same tags, same order).

Rule 1 alone catches 2.1 (two `HTM_3`, zero `HTM_2`). Rule 2 catches reordering.

### 3. Invented or corrupted `{{…}}` (drive `hasInternalPlaceholderLeak` + a broader `{{IDENT}}` scan)

Author-source interpolations that must **pass** if they already exist in the English segment (docs rarely have these; UI strings do). For docs, any `{{…}}` that was not in the **protected** source should fail.

| # | Restored text fragment | Want | Notes |
| --- | --- | --- | --- |
| 3.1 | `… de {{TAM}} de subida` | fail-invented-braces | Observed 1.2. Current leak checker: **false**. |
| 3.2 | `… de {{tam}} de subida` | fail-invented-braces | Case variant. |
| 3.3 | `… de {{Tam}} de subida` | fail-invented-braces | Glossary spelling. |
| 3.4 | `… de {{GLS_0}} de subida` | fail-leak | Already detected. |
| 3.5 | `… de {{HTM_0}} de subida` | fail-leak | Already detected. |
| 3.6 | `… de {{HTM-0}} de subida` | fail-leak | Already detected (hyphen form). |
| 3.7 | `… de tamaño de subida` | pass | Fixed 1.2. |
| 3.8 | `… de Tam de subida` | pass *(this validator)* | Glossary abbreviation applied as plain text. Copy quality / glossary scope, not a token leak. |
| 3.9 | `t("{{count}} backups selected")` in a fenced code block | pass | Source already contains `{{count}}`; must not be treated as a leak. |
| 3.10 | `![versión](https://img.shields.io/badge/version-{VERSION}-blue)` | pass | Single braces in a URL; not `{{VERSION}}`. |
| 3.11 | `{{MDX_0}}` leftover | fail-leak | Already detected. |
| 3.12 | `{{FOO}}` | fail-invented-braces | Unknown name. |
| 3.13 | `{{ count }}` | fail-invented-braces unless source had that exact token | Inner whitespace. |
| 3.14 | `{TAM}` (single braces, no double) | optional fail | MDX would still throw `TAM is not defined`. Broader than `{{…}}`; include if the checker scans JSX identifiers. |

Minimum viable invented-braces detector:

1. Collect `{{…}}` tokens from the **protected source** (official internals + any author `{{name}}`).
2. After restore, collect `{{…}}` from the output.
3. Fail if the output set is not a subset of the source-author set (official internals should already have been restored away).

That flags `{{TAM}}` without needing a Tam-specific rule.

### 4. MDX / HTML parse (optional second line of defence)

Even if token counts are perfect, persist only if the restored segment still parses as the source flavour.

| # | Restored snippet | Want | Consumer |
| --- | --- | --- | --- |
| 4.1 | Example 1.1 bad HTML | fail (MDX/HTML) | Docusaurus MDX `end-tag-mismatch` |
| 4.2 | Example 1.2 with `{{TAM}}` | fail (MDX JS) | `ReferenceError: TAM is not defined` |
| 4.3 | Example 1.1 good HTML | pass | — |
| 4.4 | Example 1.2 good Spanish | pass | — |

Do not require a full Docusaurus build in unit tests. Compile the segment with the same MDX pipeline the consumer uses, or a well-formed-HTML check plus a `{{IDENT}}` / `{IDENT}` scan.

### 5. Must still pass (false-positive guards)

| Source / output | Why it must pass |
| --- | --- |
| 1.1 sibling locales (`fr` / `es` / `pt-BR` / `zh-Hans` / `hi`) with intact `</a>` | Same HTML, different prose |
| Markdown `[API keys](settings/api-keys-settings.md)` | No HTML tags; URL placeholders already protected |
| `<br/>` / `<strong id="system">` on the same settings page | Extra tags on **other** segments; each segment has its own map |
| Fenced examples of `{{count}}` / `{{HTM_0}}` in development docs | Tokens exist in the **source** |
| `{/* #heading-id */}` / `{#overview}` | Handled by MDX / heading-id protection; restored form is valid |
| `style={{verticalAlign: 'top'}}` in the Spanish overview table | Author MDX expression; must restore as in source |

---

## Suggested fix (for when this is implemented)

### A. Token-multiset check (required for 1.1)

Before `restoreHtmlTags`, require each `{{HTM_i}}` to appear **exactly once**. After restore, re-protect and compare `htmlTagMap` to the original. On mismatch: quality error → model fallback (same path as today’s leak).

Apply the same once-each rule to `{{GLS_N}}`, `{{MDX_N}}`, `{{URL_N}}`, and the other numbered maps.

### B. Unknown `{{…}}` after restore (required for 1.2)

Extend leak detection (or add a sibling check) so **any** remaining `{{IDENT}}` fails unless that exact token existed in the **unprotected source**. `{{TAM}}` must fail. Official leftovers stay fail-leak.

### C. Tests

Table-driven unit tests, no LLM:

- `protectHtmlTags` + swap 1.1 → restore equals the bad German line; new validator **fails**.
- Correct token set + German prose → **pass**.
- `hasInternalPlaceholderLeak('… {{TAM}} …')` today is `false`; new check is `true`.
- `{{GLS_0}}` / `{{HTM_0}}` still fail as today.
- Source that already contains `{{count}}` still passes.

Optional: mocked `translate-docs` segment that discards 2.1 / 3.1 and accepts the next model.

Fixture ids: `1.1`, `1.2`, `2.1`–`2.8`, `3.1`–`3.14`, `4.1`–`4.4`.

## Out of scope

- Hand-editing consumer `documentation/i18n/**` (generated; fix belongs in the tool).
- Changing the meaning of user-glossary abbreviations (`Size` → `Tam`). Call that out in consumer docs if short labels are applied to running text.
- Prompt-only tweaks without mechanical validation (the 1.8.4 pass already had “preserve placeholders”).

## Acceptance

`translate-docs` does not persist:

- restored HTML whose tag map does not match the source (1.1 / 2.1), or
- leftover `{{TAM}}` / other unknown `{{IDENT}}` that the source did not contain (1.2 / 3.1).

Re-running the duplistatus docs build after a clean translate must not fail MDX compile on the German settings overview or SSG on the Spanish user-guide overview for these two reasons.
