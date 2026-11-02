# Notes for the ai-i18n-tools Python guides

Evidence from two wraps of the same Streamlit app (Portfolio BTG), both from parent `38f9d74`.

| Pass     | Tree      | Prompt                                                                                                                                                                   |
| -------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| October  | `a32b9d2` | Wrap literals in `t()` only. The language switch was added afterwards.                                                                                                   |
| November | `ff511b7` | The current prompt on [Add i18n to a Python app](https://wsj-br.github.io/ai-i18n-tools/guide/add-i18n-to-python): place the helper, wrap, then add the language switch. |

`i18n.py` is the same generated helper in both. Both catalogs are flat JSON, source `en`, target `pt-BR`, and almost every string was translated by `gemini-2.5-flash`. The November prompt produced the better language switch and the thinner wrap.

| | October | November |
| --- | ---: | ---: |
| `t()` calls | 1,425 | 1,332 |
| Distinct source sentences | 1,206 | 1,096 |
| Same sentence, placeholder renamed | — | 74 |
| Sentence skeletons only on that side | ~160 | ~57 |
| Portuguese that renames a `{placeholder}` | 1 | 3 |
| `t()` calls in the settings validator | 30 | 1 |
| `t()` calls in the benchmark client | 47 | 26 |

The November agent reported a clean `migrate-python-i18n` dry run, 1,097 catalog entries, and a passing test suite. About 160 user-facing sentences from the October catalog were still English. The prompt already says a clean migrate report does not prove coverage. The agent treated it as the end of the wrap, because the only automated check it had was that report.

These notes are for the English guide pages. Translated copies of those pages should follow the English source.

The three November placeholder renames (`{schedule}`, `{state}`, `{value}`) were fixed by hand in Portfolio BTG after this report. The committed catalogs no longer show them. The October catalog still has `{help}` rewritten as `{ajuda}`. The released CLI accepted that rewrite: the batch placeholder check existed but was not called from `translate-ui`, and nothing re-checked a row already in the catalog.

## What to keep

The November prompt is the right specification. Do not go back to a wrap-only prompt.

These parts behaved as written:

- `i18n.py` and `locales/` moved into the installable package, `ui.sourceRoots` narrowed from `"."` to `src`, and `locales/*.json` shipped as package data. [Step 1](https://wsj-br.github.io/ai-i18n-tools/guide/add-i18n-to-python#place-the-helper) is sufficient.
- The locale order was `?lang=`, then the session, then `LC_ALL` / `LC_MESSAGES` / `LANG` (ignoring `C` and `POSIX`), then the process locale, then the source locale. `pt-br` and `pt` matched `pt-BR`. An unknown explicit code warned once and stayed on the source locale. An operating-system locale that did not match did not warn.
- `set_locale` ran before `st.set_page_config`. `reset_locale` ran after `st.navigation`’s `run()`, so the page script still saw the chosen locale.
- Column labels that used to be translated at import were moved into a function and cached per locale.
- Streamlit color markup was left outside the catalog: `":green[" + t("Validation OK") + "]"`.
- Text sent to a model was pinned back to the source locale with `set_locale("en")` and `reset_locale` in `finally`, because that text includes labels that go through `t()`.
- A command-line entry point read `-L`, `--lang`, and `--lang=` from raw argv before argparse built `--help`.
- Logger lines and the OpenAI request trace were left unwrapped. The October catalog had translated those. The “leave log messages” rule is right.

## 1. The wrap checklist stops at Streamlit widgets

**Pages:** [Part 2 of the prompt](https://wsj-br.github.io/ai-i18n-tools/guide/add-i18n-to-python#run-the-agent-prompt) and [Step 2](https://wsj-br.github.io/ai-i18n-tools/guide/add-i18n-to-python#wrap-strings). The optional scanner already prints f-strings. The agent still wrote a rewriter that only visited `st.title`, `st.error`, `st.button`, and the other widget methods, then stopped when `migrate-python-i18n` was clean.

`migrate-python-i18n` only rewrites calls that are already wrapped and that format before the lookup. Bare `st.status.update(label="Forecast ready")`, `raise ValueError(f"Deposit {index} month must be YYYY-MM.")`, and a dict of labels are invisible to it. [Step 3](https://wsj-br.github.io/ai-i18n-tools/guide/add-i18n-to-python#step-3-check-wrapped-calls) says this. The prompt’s “keep scanning” line is not specific enough to survive a bulk rewrite.

Sentences the November wrap left in English, all of which the October wrap had in `t()`:

- Validation errors raised as `ValueError` (`Cash buffer must be a fraction from 0 to 1…`, deposit and retirement checks).
- HTTP errors returned as f-strings (`BCB returned an HTML page instead of JSON.`).
- Labels returned from a function (`Deposit / purchase`, `Tax (come-cotas)`, `Collateral pledge`).
- Progress text (`Checking cache / starting simulation…`, `Forecast ready`).
- Buttons whose label is a plain variable (`Back to Asset returns`, `Add to Decisions`).

Add this list to Part 2, after the existing “labels, titles, captions…” bullet, and repeat it above the scanner in Step 2:

> A rewriter that only visits `st.*` methods is not a wrap. After it runs, search again for f-strings and string literals that are raised, returned, or passed to progress and status APIs. Those are the calls `migrate-python-i18n` cannot see. Include them when a person reads the text: `ValueError` and `st.error` messages, `st.status` / progress labels, values returned as a badge or a table cell, and dict entries shown with `format_func`. Leave logger calls, SQL, widget `key=` values, and text sent to a model.

Add one line to the prompt’s “Verify and report” section: the report must include the count of remaining f-strings that contain a letter and are raised, returned, or passed to a status widget, grouped as wrapped, skipped (log / identifier), or still on screen in the source language.

## 2. Stored values need a `format_func` example made of literals

**Pages:** the prompt bullet “A value that is both stored and shown…” and the one sentence in Step 2 that mentions `format_func`.

The November agent kept the stored values in English and also left the labels in English. Monthly range controls show `All`, `Last 12`, and `YTD`. The October wrap kept those strings as the option values and translated them only in `format_func`.

A dict at module level in an imported module freezes on the first import. Each label still has to be its own string literal or the extractor misses it. Add this next to the Step 2 sentence, and a shortened copy in the prompt:

```python
PRESET_ALL = "All"
PRESET_LAST_12 = "Last 12"
PRESET_YTD = "YTD"

def preset_label(value: str) -> str:
    if value == PRESET_LAST_12:
        return t("Last 12")
    if value == PRESET_YTD:
        return t("YTD")
    return t("All")

st.segmented_control(
    t("Range"),
    options=[PRESET_ALL, PRESET_LAST_12, PRESET_YTD],
    format_func=preset_label,
    key="monthly_preset",
)
```

Comparisons stay on `PRESET_YTD`. The widget shows the translation. The same shape covers classification captions (`hold` stored, `t("Hold")` shown).

## 3. Keep framework markup outside the catalog

**Page:** [Step 2](https://wsj-br.github.io/ai-i18n-tools/guide/add-i18n-to-python#wrap-strings). This is not in the prompt today. The November wrap did it, and it is the one wrap detail that is better than October.

October stored keys such as `:red[Errors {errors}] · Warnings {warnings}` and `:green-background[Closed]`. A translation that breaks the colon-markup shows the raw token. November built the badge in code:

```python
errors_label = ":red[" + t("Errors {errors}", errors=errors) + "]"
if warnings and not acknowledged:
    return errors_label + " · " + t("Warnings {warnings}", warnings=warnings)
return errors_label
```

Add that example under Step 2. One sentence is enough: widget markup, HTML tags, and markdown emphasis that the framework parses stay outside `t()`. The translator receives the sentence only. Splitting one visual line into two `t()` calls is appropriate when the split is the markup boundary. It is not a reason to split a paragraph.

## 4. Placeholder names, and translations that rename them

**Pages:** [Things to know](https://wsj-br.github.io/ai-i18n-tools/guide/ui-strings/python#things-to-know) and [Check one language](https://wsj-br.github.io/ai-i18n-tools/guide/add-i18n-to-python#check-one-language).

The helper substitutes `{name}` only when every name in the translation is also in the source. A translation that rewrites `{schedule}` as `{cronograma}` fails that test and the UI shows the English sentence. The November `pt-BR` catalog has three of these (`{schedule}`, `{state}`, `{value}`). October had one. Nothing in the review steps tells a person to look for it.

The November rewriter also emitted `{value}` and `{value_2}` whenever the interpolated expression was not a bare name (17 strings, against 6 in October). Those names give the model nothing to translate around, and they are easy to “correct” into `{valor}`.

Add to Things to know:

> Name a placeholder for what it is (`{when}`, `{counts}`), including the format spec (`{when:%Y-%m-%d}`, `{share:.0%}`). Avoid `{value}` and `{value_2}`. The translation must copy every placeholder name and format spec unchanged. If it renames one, formatting is skipped and the source sentence is shown.

Add to Check one language: search the locale JSON for a placeholder name that is absent from that entry’s source string. Those rows are broken even though `translate-ui` reported success.

The prompt’s call-shape bullet should say the same in one line: “Name placeholders for the translator. Do not emit `{value}` or `{value_2}`.”

## 5. The Streamlit sample does not implement the prompt

**Pages:** the Streamlit block in the prompt, the [Streamlit sample](https://wsj-br.github.io/ai-i18n-tools/guide/add-i18n-to-python#streamlit), and the [Streamlit bullet](https://wsj-br.github.io/ai-i18n-tools/guide/ui-strings/python#streamlit).

The prompt says to match `pt-br` and `pt` to `pt-BR`, warn once on an unknown explicit code, read the process locale, and call `reset_locale` in `finally`. The sample does none of that:

```python
choice = requested if requested in codes else codes[0]
```

`pt-br` stays unmatched. An unknown code becomes `codes[0]` with no warning, and that code is not necessarily the source locale. There is no `LC_ALL` / `LANG` step and no `reset_locale`. An agent that copies the sample will undo Part 3.

Replace the sample’s two functions with the rules the prompt already states, including:

- Match case-insensitively, then by language subtag only when exactly one configured language has that subtag. `pt` matches a sole `pt-BR`. It matches neither when both `pt-BR` and `pt-PT` are configured. The [request helper](https://wsj-br.github.io/ai-i18n-tools/guide/add-i18n-to-python#choose-the-locale-for-a-request) currently returns the first language with that subtag. Give it the same “exactly one” rule.
- An explicit or stored code that matches nothing warns once and uses the source locale. It does not fall through to the operating-system locale. A locale taken only from the operating system does not warn.
- Call `get_direction()` and set the app direction when the framework has a place for it.
- Keep the `set_locale` token and call `reset_locale` after the page has run.

For `st.navigation` and `st.Page(path)`, add two sentences the current Streamlit section lacks:

> `nav.run()` executes the selected page script inside the entry script. Call `reset_locale` after `nav.run()` returns. Resetting before that call leaves the page in the source locale.
> A page file is executed again on each rerun, so `t()` at the top of that file runs after `set_locale` and follows the language. A module imported once does not. `t()` in that module’s body, or in a dict built at import, stays on the language of the first import. Put those calls in a function that runs when the text is shown. Reloading the module on each switch misses every module the reload list forgot.

The November code reloaded nothing and translated column labels lazily, which is the right fix. It then failed to wrap `classification.EVENT_LABELS`, which the October code had wrapped and reloaded. The doc should recommend the function, and should not recommend `importlib.reload`.

## 6. Pin the source locale around text sent to a model

**Page:** Step 2’s “skip prompts you send to a model”, and [Things to know](https://wsj-br.github.io/ai-i18n-tools/guide/ui-strings/python#things-to-know).

Leaving the prompt unwrapped is not enough when the prompt is built from labels that are themselves `t()` results. With the UI on `pt-BR`, those labels become Portuguese inside an English prompt. The November wrap fixed this by pinning the locale:

```python
token = set_locale("en")
try:
    return _glossary_markdown()  # reads t() labels
finally:
    reset_locale(token)
```

Add that pattern next to the “do not wrap model prompts” rule. The source locale here is the language the model is asked to read, which is the catalog’s `sourceLocale`, not the visitor’s language.

## 7. Fill the glossary before the first `translate-ui`

**Pages:** [Choose models and translate](https://wsj-br.github.io/ai-i18n-tools/guide/add-i18n-to-python#choose-models-and-translate), [Check one language](https://wsj-br.github.io/ai-i18n-tools/guide/add-i18n-to-python#check-one-language), and [Glossary](https://wsj-br.github.io/ai-i18n-tools/guide/glossary).

`init` points `glossary.userGlossary` at `glossary-user.csv` and does not create the file. `translate-ui` only receives glossary rows from that CSV. Both wraps ran without it. Of 965 shared source sentences, 350 have different Portuguese in the two catalogs, under the same model family. Examples of the drift:

| Source | October `pt-BR` | November `pt-BR` |
| --- | --- | --- |
| `1.00 = 100% of CDI.` | `1,00 = 100% do CDI.` | `1.00 = 100% do CDI.` |
| `0.05 keeps 5% of the portfolio in cash…` | `carteira` / `reinvestir` | `portfólio` / `redistribuir` |
| a “bullet” CDB | `CDB regressivo` | `CDB bullet` |
| “In-scope FI only” | `Apenas RF` | `Apenas FI` |
| `Focus` (the central-bank survey) | `Foco` in 3 strings | `Foco` in 3 strings |

Add a step before `translate-ui`: run `glossary-generate` if the CSV is missing, and put domain terms in it first. For this kind of app the rows are names that must not be translated (`Focus`, `CDI`, `Selic`, `IPCA`, `TWR`) and names with one preferred translation (`portfolio` → `carteira`, `statement` → `extrato`, `bullet` → `regressivo` when it means the Brazilian tax regime). Use **Force** for the names that must be copied unchanged.

Say explicitly that a second `translate-ui` of an unchanged string can come back worded differently. The glossary is what makes the two runs agree. Checking one page after translation is still required. Checking that every key has a `pt-BR` value is not a review.

Also say, in Check one language, that a number written in the source sentence follows the target language’s decimal mark (`1.00` → `1,00` in `pt-BR`). A `{price:,.2f}` placeholder is a format spec and stays as written. The helper does not localize numbers by itself.

## 8. Tests the prompt should require

**Page:** “Verify and report” in the prompt.

The November tests lock language matching and `reset_locale`. They never assert that `set_locale("pt-BR")` changes a sentence. The October tests locked one interpolated forecast paragraph in English and the selector’s query param. Neither suite would fail if event labels or validation errors stayed English.

Add to the prompt:

> With a locale file present, one test sets `pt-BR` (or the project’s target), asserts that a validation message, a returned label, and a `format_func` label change, and asserts that the stored option value stays in the source language. `reset_locale` restores the source locale. A test that only checks `resolve_ui_locale` does not show that the wrap worked.

## Suggested edits, by file

| Guide | Edit |
| --- | --- |
| `docs/guide/add-i18n-to-python.md` prompt, Part 2 | Name the non-widget surfaces. Forbid a Streamlit-only rewriter. Forbid `{value}` placeholders. Add the `format_func` sketch and the model-prompt `set_locale("en")` pattern. |
| Same prompt, Part 3 and the Streamlit sample | Make the sample match the prompt: loose match, ambiguous subtag, warn once, process locale, `reset_locale` after `nav.run()`, `get_direction()`. Document page-script reruns versus imported modules. |
| Same page, Step 2 and Step 3 | Markup-outside-`t()` example. State again that a clean migrate report ignores unwrapped f-strings. |
| Same page, Review and Check one language | Require a skeleton diff when re-wrapping. Search locale JSON for renamed placeholders. Fill `glossary-user.csv` before the first `translate-ui`. |
| `docs/guide/ui-strings/python.md` Things to know | Placeholder names, the rename-fallback, and import-time `t()` versus a Streamlit page file. |
| `docs/guide/glossary.md` | One sentence that `translate-ui` sees only the user CSV, and that `init` does not create that file. |
| `skills/ai-i18n-tools/references/python.md` | The same non-widget list and the “clean migrate report is not coverage” line. Agents follow this file when they do not open the long guide. |
