# Test for a markdown only translation (no UI strings pipeline)

## Alternatives to translation

1. **Rephrase…** — click **Rephrase…** above the output to get another full translation of the same input with different wording. You can store up to **five** versions and switch between them in the version dropdown. **Rephrase…** is disabled once you reach five versions.
2. **Word alternatives** — select one or more words in the output (if you select only part of a word, the app expands the selection to full words), then right-click. A short list of alternatives appears at the cursor; click one to replace the selection. If you have fewer than five versions, the edited output is saved as a new version; at five versions, only **version 5** is updated. You must select text before right-clicking; right-click with no selection does nothing. Press **Esc** or click outside the list to cancel without changing the output.
3. **Costs** — each **Rephrase…** click and each word-alternative request uses the model again and may add to usage cost (same as a normal translate run).

## Text formatting
The translator should carry over all inline formatting without altering the markup:

- **Bold text** signals importance and should stay bold after translation.
- _Italic text_ is used for emphasis or titles; the meaning should be preserved.
- ~~Strikethrough~~ marks deprecated or removed content.
- `inline code` is **never** translated — identifiers, function names, and file paths must remain as-is.
- A [hyperlink](https://github.com/wsj-br/ai-i18n-tools) keeps its original URL; only the anchor label is translated.


## Hard to translate code inside a formating

this is a code inside a bold: **`code`** - should not be translated
this is a code inside an italic: *`code`* - should not be translated
this is a code inside a strikethrough: ~~`code`~~ - should not be translated
this is a code inside a hyperlink: [**`code`**](https://github.com/wsj-br/ai-i18n-tools) - should not be translated
this is a code inside a bold and italic: **_`code`_** - should not be translated
this is a code inside a bold and strikethrough: **~~`code`~~** - should not be translated
this is a code inside an italic and strikethrough: *~~`code`~~* - should not be translated
this is a code inside a bold and italic and strikethrough: **_~~`code`~~_** - should not be translated

Here is a **long** paragraph designed to test mixed *inline* and code formatting. When using `async/await`, errors must be handled properly—never write `catch (e) {}`. Always highlight critical variables with **`importantFlag`**, and when writing configuration, use _`configKey`_ carefully. Some functions, such as **`runProcess()`**, require special attention to detail, while _processing_ the data in a loop like `for (const item of items) { ... }` ensures nothing is missed. Remember, efficiency matters: try optimizing your code, for example, by replacing **synchronous** calls with **`Promise.all()`** where possible for concurrent processing. If you ever hard-code values like _`42`_, be sure to document why. And in the case that you need italic emphasis with code, use _`dynamicStyle`_—or even **_`criticalPath`_**—so it's clear! Whenever referencing file paths, use `./src/main.ts`, but highlight critical ones as **`./src/important.ts`** for emphasis. In summary, *good code* blends clarity, correctness, and **`efficiency`** at every step.


## Tables
Tables are a common source of translation errors. Each cell is translated individually; column separators and alignment syntax are preserved.

| Feature                | Status         | **Notes**                                                        |
|------------------------|----------------|------------------------------------------------------------------|
| Markdown translation   | ✅ Stable       | Segments cached in SQLite                                        |
| UI string extraction   | ✅ Stable       | Reads `t("…")` calls                                             |
| Plural UI strings      | ✅ Stable       | `t("…", { plurals: true, count })`; catalog + flat JSON suffixes |
| JSON label translation | ✅ Stable       | Docusaurus sidebar/navbar JSON                                   |
| SVG text translation   | ✅ Stable       | Preserves SVG structure                                          |
| Glossary enforcement   | ✅ Stable       | Per-project CSV glossary                                         |
| Batch concurrency      | ✅ Configurable | **`batchConcurrency`** key                                       |


## Regular text

When summer arrives in the city, early mornings are filled with the sounds of delivery trucks and distant birdsong. The air is thick with the promise of heat, yet the streets remain cool in the shade of tall, aging trees that line each avenue. Residents exchange nods as they pass, their routines choreographed to avoid the harsh midday glare, gathering instead for a coffee at corner shops that have watched generations come and go.

On weekends, the market square transforms into a tapestry of colors and aromas. Vendors arrange their produce in careful piles: bright tomatoes beside fragrant herbs, honey glistening in glass jars. Laughter floats above the clatter of baskets and bicycles as children dash between the stalls, always drawn to the flower stand with its sunflowers standing tall above every head.

In the evenings, lights flicker on in apartment windows one by one, and the city resumes a quieter rhythm. Conversations spill from balconies, echoing down to the courtyards below where neighbors share stories and pets lounge lazily. As the sky darkens, the soothing hum of nocturnal life sets in—a gentle reminder that, just as day fades gently into night, every ending promises a new beginning.
