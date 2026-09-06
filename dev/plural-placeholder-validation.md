# Plural forms: validate placeholders after the LLM (not prompt-only)

**Status:** proposal  
**Seen in:** duplistatus first real `{ plurals: true }` pass (`ai-i18n-tools` 1.8.4)  
**Related code:** [`src/core/prompts.ts`](../src/core/prompts.ts) (`pluralFormsSystemPrompt`), [`src/core/prompt-builder.ts`](../src/core/prompt-builder.ts) (`buildPluralStep0Prompt`, `buildPluralPassBPrompt`, `parsePluralFormsJsonResponse`), [`src/api/llm-client.ts`](../src/api/llm-client.ts) (`translatePluralCardinalForms`), [`src/cli/proofread-ui.ts`](../src/cli/proofread-ui.ts) (`extractUiPlaceholderTokens` / `proofreadSuggestionPreservesPlaceholders`)

## Problem

`translate-ui` asks the model to preserve interpolation tokens, then **accepts any JSON object** whose keys match the requested CLDR categories. `parsePluralFormsJsonResponse` only checks that each required key is a string. There is no mechanical check that each form keeps (and does not invent) the source string’s placeholders.

That is weaker than **proofread-ui**, which already drops suggested rewrites that would break placeholders.

Prompt-only rules are not enough. The same pass produced two opposite bugs.

### 1. Dropped placeholders

Source (plural group):

```text
Merge Selected Servers ({{count}})
```

Step 0 / Pass B `_one` often became:

```text
Merge Selected Server
```

with `{{count}}` removed. Singular wording can omit the number in natural language, but **if the source contains a placeholder, every CLDR form must still contain it** or i18next interpolation is silently lost (button shows no count when `count === 1`).

### 2. Invented numbers / `{{count}}`

Source (plural group, **no** `{{count}}` in the literal):

```text
Minutes
```

Call site uses `{ plurals: true, count }` only so i18next can pick Minute vs Minutes next to a separate numeric input.

Step 0 wrote:

```text
one:   "1 minute"
other: "{{count}} minutes"
```

The unit dropdown then duplicated the adjacent number (`5` + `5 minutes`).

This is encouraged by the current plural system prompt:

> For messages that include a numeric quantity, use `{{count}}` where a number must appear unless the category is zero and instructions say to use the literal digit 0.

The model infers “this is a plural group, so a number must appear,” even when the **source literal has no quantity placeholder**. `zeroDigit` is the only opt-in for a literal `0` in `_zero`; there is no corresponding rule for “noun-only inflection.”

## Current behaviour (what already works)

| Layer | What it does |
| --- | --- |
| Extract | Fails if a plural string has **two or more** distinct `{{…}}` names and none is `count`. |
| Plural prompt | “Preserve placeholders exactly: `{{variable}}`, `{{count}}`, …” |
| `parsePluralFormsJsonResponse` | JSON object + required CLDR keys are strings. |
| LLM fallback loop | Retries the next model on **parse** / **script** errors only. |
| proofread-ui | Strips suggestions that drop `{{…}}`, `{0}`, `%s` / `%d`. |

Missing: treat placeholder mismatch on a **plural form** as a parse/validation failure so the existing model-fallback loop retries.

## Suggested fix

### A. Mechanical validation (required)

After `parsePluralFormsJsonResponse`, compare each form to the **original source literal** (Step 0) or to a defined reference string (Pass B — see below).

Reuse or share the token set from `extractUiPlaceholderTokens` / `extractInterpolationNames`:

1. **Missing:** every `{{name}}` (and `{0}`, `%s`, `%d` if present) in the source must appear unchanged in **every** returned form.
2. **Extra:** a form must not introduce a `{{name}}` that the source does not have (blocks invented `{{count}}` on noun-only labels).
3. **Literal `1` / `0` injection** when the source has no digit and no `{{count}}`: reject forms that add a leading quantity (`1 minute`, `{{count}} minutes`). Exception: `zeroDigit === true` may use a literal `0` in the **`zero`** form only.

On mismatch: throw a dedicated error (same family as `PluralFormsParseError` / `ScriptValidationError`) so `translatePluralCardinalForms` falls through to the next model, the same way a bad JSON shape already does.

**Pass B reference:** validate each **target** form against the **source-locale form for the same category** when that category exists; also require that the union of placeholders still matches the original developer literal. That way a bad Step 0 `_one` without `{{count}}` cannot be copied into every locale.

### B. Prompt tightening (required, cheap)

In `pluralFormsSystemPrompt` / Step 0 user text, replace the “use `{{count}}` where a number must appear” line with something like:

- If the original string **contains** `{{count}}` (or another `{{…}}`), copy every placeholder into **every** category, including `one`. Do not drop `{{count}}` from singular forms.
- If the original string **does not** contain `{{count}}`, inflect the noun only (`Minute` / `Minutes`). Do **not** insert `{{count}}`, a literal `1`, or any other quantity. `count` is a runtime selector only.
- `zeroDigit` still allows a literal `0` in `_zero` when that flag is set.

### C. Tests

Drive the comparator with the corpus below (no LLM). Optional: one mocked `LlmClient` retry that discards a bad `_one` and accepts the next model.

Legend for **want**:

- **pass** — accept the forms
- **fail-missing** — a source placeholder is absent in at least one form
- **fail-extra** — a form invents a `{{…}}` the source does not have
- **fail-qty** — noun-only source; a form injects a literal quantity (`1`, `0`, `{{count}}`, `{{count}} minutes`, `5 minutes`, …)
- **extract-fail** — `extract` should reject before translate (not this validator)

Forms are `one` / `other` unless extra CLDR keys are listed. English shown; the same placeholder rules apply to `de`, `fr`, `es`, `pt-BR`, `ar`, `zh-Hans`, `hi`, etc.

---

## Test corpus

### 1. Observed LLM failures (duplistatus, 1.8.4)

These actually landed in `strings.json` / flat locale JSON before any hand edit.

| # | Source literal | Bad form(s) | Want | Notes |
| --- | --- | --- | --- | --- |
| 1.1 | `Merge Selected Servers ({{count}})` | one: `Merge Selected Server` | fail-missing | `{{count}}` dropped. Same shape in de (`Ausgewählten Server zusammenführen`), fr, es, pt-BR (`Mesclar Servidor Selecionado`), hi. |
| 1.2 | `Minutes` | one: `1 minute`; other: `{{count}} minutes` | fail-qty + fail-extra | Unit label beside a separate number input. de: `1 Minute` / `{{count}} Minuten`. fr/es/pt-BR: `1 minute`/`1 minuto` + `{{count}} minutes`/`minutos`. zh-Hans: other `{{count}}分钟`. hi: `1 मिनट` / `{{count}} मिनट`. |
| 1.3 | `Hours` | *(this group was generated correctly: Hour / Hours)* | pass | Contrast with Minutes — same pattern, model was inconsistent. Still include as a regression: if Hours ever becomes `1 hour` / `{{count}} hours`, fail-qty. |
| 1.4 | `Showing all messages ({{count}})` | one: `Showing all message ({{count}})` | pass | Placeholder intact. Ungrammatical “all message” is **copy quality**, not this validator. |
| 1.5 | `sent {{count}} notifications.` | one: `sent {{count}} notification` (period dropped) | pass | Placeholder intact. Trailing punctuation is **copy quality**, not this validator. |

**Good forms for 1.1 / 1.2** (must pass):

```text
# 1.1
one:   Merge Selected Server ({{count}})
other: Merge Selected Servers ({{count}})

# 1.2
one:   Minute
other: Minutes
```

### 2. Noun-only sources (no `{{count}}` in the literal)

`count` is a runtime selector only. Do not insert a number or `{{count}}`.

Sources from duplistatus Backup Monitoring unit dropdowns:

| Source | Pass `one` / `other` | Fail examples |
| --- | --- | --- |
| `Minutes` | `Minute` / `Minutes` | `1 minute`; `{{count}} minutes`; `{{count}} Minute`; `5 minutes`; `0 minutes` |
| `Hours` | `Hour` / `Hours` | `1 hour`; `{{count}} hours`; `1h`; `{{count}} h` |
| `Days` | `Day` / `Days` | `1 day`; `{{count}} days` |
| `Weeks` | `Week` / `Weeks` | `1 week`; `{{count}} weeks` |
| `Months` | `Month` / `Months` | `1 month`; `{{count}} months` |
| `Years` | `Year` / `Years` | `1 year`; `{{count}} years` |

Synthetic noun-only:

| Source | Pass | Fail |
| --- | --- | --- |
| `item` | `item` / `items` | `1 item`; `{{count}} items` |
| `file` | `file` / `files` | `{{count}} file` |
| `Server` | `Server` / `Servers` | `{{count}} Servers` |
| `row` | `row` / `rows` | `{{count}} row` |

Pass B (same rule vs original literal). Example **fail**:

```text
source literal: Minutes
en-GB one/other: Minute / Minutes   # already valid
de one: "1 Minute"                  # fail-qty
de other: "{{count}} Minuten"       # fail-extra
```

Pass B **pass**:

```text
de one: Minute
de other: Minuten
fr one: Minute
fr other: Minutes
es one: Minuto
es other: Minutos
zh-Hans other: 分钟
```

### 3. Source has only `{{count}}`

Every form must contain `{{count}}` exactly (same spelling). Inflect the noun; do not drop the placeholder from `one`.

**Pass shape:** `one` uses singular noun, `other` plural noun, both keep `{{count}}`.

#### Short labels (duplistatus)

| Source | Pass `one` | Pass `other` | Fail `one` (missing) |
| --- | --- | --- | --- |
| `{{count}} backups selected` | `{{count}} backup selected` | `{{count}} backups selected` | `1 backup selected`; `backup selected` |
| `{{count}} backups` | `{{count}} backup` | `{{count}} backups` | `{{count}}`; `one backup` |
| `{{count}} rows` | `{{count}} row` | `{{count}} rows` | `{{count}} rows` is fine for **one** too (same string both forms) |
| `({{count}} servers)` | `({{count}} server)` | `({{count}} servers)` | `(1 server)`; `(servers)` |
| `({{count}} backups will inherit)` | `({{count}} backup will inherit)` | `({{count}} backups will inherit)` | `(backup will inherit)` |
| `Processed: {{count}} backups` | `Processed: {{count}} backup` | `Processed: {{count}} backups` | `Processed: {{count}}` |
| `Skipped: {{count}} duplicates` | `Skipped: {{count}} duplicate` | `Skipped: {{count}} duplicates` | `Skipped duplicates` |
| `Checked {{count}} backups` | `Checked {{count}} backup` | `Checked {{count}} backups` | `Checked backups` |
| `found {{count}} backups needing attention` | `found {{count}} backup needing attention` | `found {{count}} backups needing attention` | `found {{count}} needing attention` |
| `sent {{count}} notifications.` | `sent {{count}} notification.` | `sent {{count}} notifications.` | `sent notifications.` |
| `Updated {{count}} backups` | `Updated {{count}} backup` | `Updated {{count}} backups` | `Updated {{count}} backup(s)` still **pass** if `{{count}}` remains (hedge is copy, not this check) |
| `and {{count}} individual backups` | `and {{count}} individual backup` | `and {{count}} individual backups` | `and individual backups` |
| `Applied to {{count}} server defaults` | `Applied to {{count}} server default` | `Applied to {{count}} server defaults` | `Applied to server default` |
| `Successfully merged {{count}} servers` | `Successfully merged {{count}} server` | `Successfully merged {{count}} servers` | `Successfully merged servers` |
| `across {{count}} server groups.` | `across {{count}} server group.` | `across {{count}} server groups.` | `across server groups.` |
| `Collect from {{count}} servers` | `Collect from {{count}} server` | `Collect from {{count}} servers` | `Collect from {{count}} Servers` **pass** (capital S is copy) |
| `Collecting from {{count}} servers...` | `Collecting from {{count}} server...` | `Collecting from {{count}} servers...` | `Collecting from {{count}} server` (ellipsis dropped) **pass** if `{{count}}` remains |
| `Collect backup logs from {{count}} servers` | `… {{count}} server` | `… {{count}} servers` | drop `{{count}}` |
| `Showing all messages ({{count}})` | same or `Showing {{count}} message` | `Showing all messages ({{count}})` | `Showing all messages` |
| `Test email sent to {{count}} addresses` | `… {{count}} address` | `… {{count}} addresses` | `Test email sent to {{count}} address(es)` **pass** if token present |
| `All {{count}} backups now inherit from server defaults` | keep `{{count}}` | keep `{{count}}` | `All backups now inherit…` |
| `This page has {{count}} sections` | `This page has {{count}} section` | `This page has {{count}} sections` | from `examples/nextjs-app` |

#### Longer sentences (duplistatus)

| Source | Fail if |
| --- | --- |
| `Cleared all additional destinations from {{count}} backups. Inheritance maintained.` | `{{count}}` removed from `one` |
| `Cleared all additional destinations for server and {{count}} backups.` | `{{count}}` removed |
| `Extract backup logs from {{count}} servers using the same port and password` | `{{count}}` removed |
| `Update additional destination settings for {{count}} selected backups.` | `{{count}}` removed |
| `Are you sure you want to clear all additional notification settings for {{count}} selected backups?` | `{{count}}` removed |
| `This will also clear additional destination settings from the server defaults for {{count}} affected servers.` | `{{count}}` removed |
| `This will merge {{count}} server groups. For each group, all old server IDs will be merged into the target server (newest by creation date). All backup records and configurations will be transferred to the target servers. The old server entries will be deleted. This action cannot be undone.` | `{{count}}` removed. Extra noun inflection (`target server` vs `target servers` in `one`) is **copy**, not this validator, as long as `{{count}}` stays. |

**Also fail-extra** on any of the above if a form adds `{{total}}`, `{{n}}`, `{{name}}`, etc.

**Renamed placeholder** is fail-missing + fail-extra:

```text
source:  {{count}} backups selected
one:     {{n}} backup selected          # fail
one:     {{Count}} backup selected      # fail (case)
one:     {{ count }} backup selected    # see §6 — prefer treating as different token unless normaliser trims
```

### 4. Source has `{{count}}` plus other interpolations

Extract already requires `{{count}}` when there are two or more distinct `{{…}}` names. This validator still must keep **every** name in **every** form.

| Source | Must keep | Fail examples |
| --- | --- | --- |
| `Showing only the first {{shown}} of {{count}} messages` | `{{shown}}`, `{{count}}` | drop `{{shown}}`; drop `{{count}}`; swap to `{{total}}` |
| `Tested {{count}} connections: {{success}} successful, {{failed}} failed` | `{{count}}`, `{{success}}`, `{{failed}}` | drop `{{failed}}`; `{{count}}` only; invent `{{errors}}` |
| `Hello {{name}}, you have {{count}} messages` | `{{name}}`, `{{count}}` | `Hello {{name}}`; `you have {{count}} messages` |
| `{{user}} uploaded {{count}} files to {{folder}}` | all three | drop any one; add `{{path}}` |

**Pass** (duplistatus-style):

```text
one:   Showing only the first {{shown}} of {{count}} message
other: Showing only the first {{shown}} of {{count}} messages

one:   Tested {{count}} connection: {{success}} successful, {{failed}} failed
other: Tested {{count}} connections: {{success}} successful, {{failed}} failed
```

Duplicate placeholder in source (rare):

```text
source: {{count}} of {{count}} items
# both occurrences should remain; at minimum the token {{count}} must appear (count ≥ 1).
# Prefer requiring occurrence count ≥ source occurrence count so "{{count}} items" fails.
```

### 5. `wrapT` injected `count` (single non-count placeholder)

Documented runtime: `t("{{pages}} pages", { plurals: true, pages: 5 })` forwards `count: 5`. Source literal has `{{pages}}` only.

| Source | Pass | Fail |
| --- | --- | --- |
| `{{pages}} pages` | `{{pages}} page` / `{{pages}} pages` | `{{count}} pages` (renamed); `pages`; `{{pages}} {{count}} pages` |

### 6. Whitespace and spelling of `{{…}}`

| Source | Form | Want |
| --- | --- | --- |
| `{{count}} items` | `{{count}} item` | pass |
| `{{count}} items` | `{{ count }} item` | fail-missing (unless you explicitly normalise inner whitespace to `count`) |
| `{{count}} items` | `{{Count}} item` | fail-missing |
| `{{count}} items` | `{{count }} item` | fail-missing without normalise |
| `Hello {{name}}` | `Hello {{name}}` | pass (noun-only besides name; no qty injection check unless you also treat this as noun-only — it is **not**: it has a placeholder) |

Recommendation: compare **canonical** names (`trim` inner `{{ … }}`), but require the **same spelled token family**. Do not accept `{{n}}` as a substitute for `{{count}}`.

### 7. Other placeholder styles (align with proofread-ui)

`extractUiPlaceholderTokens` already collects `{{…}}`, `{0}` / `{1}`, `%s` / `%d`.

| Source | Pass | Fail |
| --- | --- | --- |
| `%d files selected` | `%d file selected` / `%d files selected` | `files selected`; `%s files selected` |
| `{0} items in cart` | `{0} item in cart` / `{0} items in cart` | `{1} items`; `items in cart` |
| `Page %d of %d` | keep both `%d` | one `%d` only |
| `Hello {{name}}, %d messages` | keep `{{name}}` and `%d` | drop either |

If v1 UI extract never emits `%d` / `{0}` plurals, still unit-test the comparator so proofread-ui and translate-ui share one helper.

### 8. `zeroDigit`

Source: `You have {{count}} items` (or noun-only `items` — unlikely with zeroDigit).

| Flag | Form | Want |
| --- | --- | --- |
| `zeroDigit: false` | zero: `You have no items` (no `{{count}}`) | fail-missing if source has `{{count}}` |
| `zeroDigit: false` | zero: `You have {{count}} items` | pass |
| `zeroDigit: true` | zero: `You have 0 items` | pass **only for `zero`**; still fail if `{{count}}` is dropped **and** no `0` — decide explicitly: recommended rule is **either** keep `{{count}}` **or** (zero + zeroDigit) use digit `0` in place of the quantity |
| `zeroDigit: true` | one: `You have 0 items` | fail (literal 0 only allowed on `zero`) |
| `zeroDigit: true` | other: `You have 0 items` | fail |
| noun-only `Minutes`, `zeroDigit: true` | zero: `0 minutes` | pass for `zero` only |
| noun-only `Minutes`, `zeroDigit: true` | one: `0 minute` | fail-qty |

Spell out the chosen `zero` rule in the implementation and lock it with these rows.

### 9. Extra CLDR categories (`few`, `many`, `two`, `zero`)

Arabic (`ar`) typically needs `zero`, `one`, `two`, `few`, `many`, `other`. Every requested key is validated.

```text
source: {{count}} items
# pass: each of zero/one/two/few/many/other contains {{count}}
# fail: few omits {{count}}; many uses {{n}}
```

French/Spanish/pt-BR often emit `many` in flat JSON. Validate `many` the same as `other`.

```text
source: Minutes
fr many: "{{count}} minutes"    # fail-extra
fr many: "Minutes"              # pass
```

Chinese (`zh-Hans`) may only return `other`. Only requested keys are checked; do not require `one`.

### 10. Pass B: target vs source-locale forms vs original literal

| Step | Input | Want |
| --- | --- | --- |
| Step 0 produced valid en-GB `Merge Selected Server ({{count}})` | Pass B de `Ausgewählten Server zusammenführen` (no placeholder) | fail-missing |
| Step 0 **invalid** en-GB one `Merge Selected Server` (no placeholder) | Pass B copies it to pt-BR | fail against **original literal**, so a bad Step 0 cannot poison targets. Do not use the bad en-GB one as the only reference. |
| Original `Tested {{count}} connections: {{success}} successful, {{failed}} failed` | de other drops `{{failed}}` | fail-missing |
| Original `Minutes` | hi other `{{count}} मिनट` | fail-extra |

### 11. Must still pass (valid inflection, punctuation, identical forms)

These are easy false positives — lock them as **pass**:

| Source | Forms |
| --- | --- |
| `{{count}} rows` | one and other both `{{count}} rows` (page-size options never use 1) |
| `Showing all messages ({{count}})` | one === other, both with `{{count}}` |
| `Collecting from {{count}} servers...` | ellipsis kept or dropped; `{{count}}` kept |
| `{{count}} backups selected` | `{{count}} backup selected` (verb agreement) |
| `All {{count}} backups now inherit from server defaults` | `All {{count}} backup now inherits from server defaults` (verb agreement) |
| Long merge confirm | `one` inflects later nouns (`target server`, `old server entry`) but keeps `{{count}}` |
| `Minutes` | `Minute` / `Minutes` with no digits |

### 12. Quantity-injection heuristics (noun-only only)

Apply **fail-qty** only when the source has **no** digits and **no** `{{count}}` / `%d` / `{0}`.

| Source | Form | Want |
| --- | --- | --- |
| `Minutes` | `Minute` | pass |
| `Minutes` | `1 minute` | fail-qty |
| `Minutes` | `1 Minute` | fail-qty |
| `Minutes` | `{{count}} minutes` | fail-extra (and fail-qty) |
| `Minutes` | `one minute` | fail-qty (word “one” as quantity — optional; at least catch leading `1`/`0` and `{{count}}`) |
| `Minutes` | `a minute` | pass or fail-qty — **optional**; document the chosen rule. Recommended: do not flag English articles. |
| `{{count}} backups` | `1 backup` | fail-missing (`{{count}}` gone), not fail-qty |
| `Port 22` as a **plain** string | n/a | not a plural group |
| Source that already contains `2FA` / `HTTP 500` | plural unlikely | if it ever is a plural group, do not treat those digits as fail-qty |

Minimum viable fail-qty detector:

1. Source has no `{{count}}`, `%d`, `{n}`, and no digit `0`–`9`.
2. Reject a form if it contains `{{count}}` **or** a digit `0`–`9` (except `zero` + `zeroDigit`).

That catches `1 minute`, `{{count}} minutes`, `5 minutes`, zh-Hans `{{count}}分钟`, without needing a language-specific parser.

### 13. Extract-time (do not re-test in this validator)

| Source + flags | Want |
| --- | --- |
| `Hello {{name}}, you have {{total}} messages` with `plurals: true` (no `{{count}}`) | **extract-fail** (`pluralMultiPlaceholderMissingCount`) |
| Two independent counts in one string | extract-fail; app must use two `t()` calls (duplistatus split `Applied to {{count}} server defaults` + `({{count}} backups will inherit)`) |

### 14. Suggested fixture shape

Table-driven unit test (names illustrative):

```ts
type Case = {
  id: string;
  source: string;
  zeroDigit?: boolean;
  requiredForms: Array<"zero" | "one" | "two" | "few" | "many" | "other">;
  forms: Partial<Record<"zero" | "one" | "two" | "few" | "many" | "other", string>>;
  want: "pass" | "fail-missing" | "fail-extra" | "fail-qty";
};
```

Seed `id`s `1.1`, `1.2`, `2.Minutes.bad`, `3.backups-selected.good`, `4.shown-count.drop-shown`, `8.zeroDigit.zero-ok`, `9.ar.few-drop`, `10.passB.de-merge` from the tables above.

Include at least:

- All six noun-only unit words (`Minutes` … `Years`) once pass + once fail-qty.
- All duplistatus `{{count}}` sources once pass (good `one`/`other` from `src/locales/en-GB.json` after correction) + one fail-missing (`one` with placeholder stripped).
- Multi-placeholder: `{{shown}}`+`{{count}}` and `{{count}}`+`{{success}}`+`{{failed}}`.
- `zeroDigit` true/false on `zero` vs `one`.
- `ar` with `few`/`many`.
- `%d` and `{0}`.
- `{{pages}} pages` wrapT case.

## Out of scope


- Hand-editing app locale JSON (`de.json`, `pt-BR.json`, …) in consuming projects. Catalogs are generated; this check belongs in the tool.
- Changing extract rules for `plurals: true` without `{{count}}` in the literal (that pattern is valid for unit labels).
- Ordinals / ICU (still not in v1).

## Acceptance

`translate-ui` Step 0 and Pass B do not persist a plural group whose forms drop or invent source placeholders. Noun-only plural sources stay noun-only. Failures retry the model list instead of writing bad `strings.json` / `{locale}.json` keys.
