# ai-i18n-tools 1.14.0 Release Notes

## Highlights

- **Rank by quality, then a Pareto cost frontier:** `suggest-models` scores models on ChrF and Arena only. `--quality` uses the 3:1 blended token price to break equal indices. `--price` lists Pareto-frontier models cheapest first, then later frontier layers. `--max-price` and the Models tab filter compare that blended price (not output-only). `--min-delta` is the absolute index gap. Tables show blended-price and frontier columns. `modelSuggestion.<profile>.price` is removed; existing configs are migrated on load.
- **Aliases and dominated rows stay out of the apply list:** A dated or longer id with the same ChrF, Arena Score, and token prices is an alias and does not take a frontier layer. An exact blended-price and index tie still shares a layer. Suggestions, `--json`, `--apply`, and the Models tab skip alias rows (`--list` still shows them). After the table, a line names the layer 1 model that beats each dominated row.
- **The Models tab shows the current fallback chain:** The selected provider's `translationModels` sit beside the ranked suggestions. The current-configuration table sizes to its columns so that pane does not scroll sideways; suggestions use the remaining width. Column headers explain Order, Rank, scores, prices, and the frontier layer in a tooltip. Model ids stay on one line.
- **Colon-fence admonitions follow VitePress container rules:** A closer lines up with its opener (including inside lists and blockquotes), may use a longer colon run, and is indented at most three spaces. A `:::` inside a fenced code sample still does not end the container.
- **`-L` without a code lists the shipped UI languages:** The missing-code error, that option's help, and the end of the root help name the languages the tool ships.

## Why this release matters

Version 1.14.0 ranks translation models by quality and a Pareto cost frontier, so price filters use blended cost instead of output-only rates, and the Models tab shows the current fallback chain next to those suggestions.

---

For the full list of changes, see [`dev/CHANGELOG.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/CHANGELOG.md) (`## [1.14.0] - 2026-11-09`).

---

## Documentation

- [Installation](https://wsj-br.github.io/ai-i18n-tools/guide/installation.html) — installation instructions
- [Documentation](https://wsj-br.github.io/ai-i18n-tools/) — guides, integrations, and reference
- [Coding-agent skill](https://wsj-br.github.io/ai-i18n-tools/guide/coding-agent-skill.html) — install the consumer skill and workflow slash commands
- [Add internationalization](https://wsj-br.github.io/ai-i18n-tools/guide/add-i18n-to-your-project.html) — add internationalization to your project (JS/TS, Python, .Net, Documentation, ...)

---

## License

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br/ai-i18n-tools)
