=== ai-i18n-tools translation failure ===
logFilePath: /home/wsj/src/duplistatus/.translation-cache/2026-09-15T00-16-09.243Z-FAILED-TRANSLATION_src_locales_strings.json_anthropic_claude-sonnet-5_batch_1789431369243.log
isoTime: 2026-09-15T00:16:09.244Z
locale: en-GB
document: src/locales/strings.json
segments: plural-batch
outcome: retrying_next_model
failedModel: anthropic/claude-sonnet-5:batch
nextModel: qwen/qwen-2.5-72b-instruct
--- quality / validation errors ---
  openrouter API error for model anthropic/claude-sonnet-5:batch: This model is only available through the Batch API. Use the /api/beta/batches endpoint instead.
--- per-segment validation ---
  (none)
--- system prompt ---
You are a professional UI/UX linguist writing cardinal plural variants for software interfaces.

TERMINOLOGY:
- Use conventional software wording (errors, counts, list summaries, confirmations) as in mainstream apps and OS dialogs for the target language—clear, terse, and familiar—not literary or unusual phrasing.

RULES:
- Output ONLY a single JSON object (not an array). First non-whitespace character must be { and the object must end with }.
- Keys must be exactly the cardinal plural category names requested (CLDR / Intl.PluralRules: zero, one, two, few, many, other). Include only the keys you are asked for.
- Include every requested key exactly once — do not omit a category because another category could use the same wording; duplicate string values across keys are allowed and often required.
- Each value is one UI string for that plural category in the target language described in the user message.
- Copy every placeholder that appears in the original developer string into EVERY requested category value, including "one". Do not drop {{count}} (or any other {{…}}, {0}, %s, %d) from singular forms. Category "one" is not permission to omit a number token.
- If the original has no {{count}} / %d / {n} and no digit, inflect the noun only. Do not insert {{count}}, {{n}}, a literal 1/0, or any other quantity. Runtime count only selects the category; it is not a request to print a number (the UI may already show the number beside the label).
- This is NOT gettext ("%d file" / "%d files") and NOT ICU {count, plural, …}. Output only the requested flat JSON object of UI strings.
- When the user message allows zeroDigit, a literal 0 may appear in the "zero" value only (where a quantity would appear). Other categories must not use 0 as a substitute for {{count}}.
- No markdown, no code fences, no commentary outside the JSON object.
--- user content ---
Language — write every output string in this language: English (United Kingdom)

Original UI string from source code (context):
"Cleared all additional destinations from {{count}} backups. Inheritance maintained."

PLACEHOLDERS in the original string (copy character-for-character into EVERY category value, including "one"; do not add any other {{…}} / %d / {n} tokens): {{count}}

Generate cardinal plural variants for exactly these categories: one, other.
For the "zero" category, use natural zero-quantity phrasing for this language; still copy every listed original placeholder (do not invent {{count}}).

Intl.PluralRules reference for locale en-GB: one: n=1; other: n=0. These n= values only show which count selects that category. Do not write them into the UI strings unless the original already contains that quantity or placeholder.

Reply with ONLY one JSON object whose keys are exactly those category names (strings: zero, one, two, few, many, other as applicable) and whose values are the UI text for English (United Kingdom).
--- raw assistant response ---