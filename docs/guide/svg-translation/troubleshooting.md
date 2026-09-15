<a id="svg-troubleshooting"></a>
# SVG troubleshooting

See also [Images & Screenshots troubleshooting](/guide/images-and-screenshots/troubleshooting).

- **SVG sources and outputs in the same directory** — keep `svg.sourcePath` and `svg.outputDir` separate.
- **Absolute Docusaurus static URLs for colocated SVGs** — use relative `../assets/` paths from the start.
- **Unexpected closing tag `text` vs `g` after translation** — Inkscape often emits empty self-closing `<text … />` next to real labels. Older extractor regexes spanned those through the next `</text>` and wrote a stray closer. Upgrade and re-run `translate-svg` (or `sync`) to regenerate the locale SVG.
- **Romanized or Latin-only labels in Hindi, Arabic, CJK, or Cyrillic SVGs** — the same writing-system policy as documents applies; wrong-script cache rows are rejected on the next `translate-svg` / `sync`. Re-run with global `--debug-failed` to write a `FAILED-TRANSLATION` log under `cacheDir` for **each** discarded model (prompt, raw output, script error), not only when every model fails. See [Hindi, Arabic, CJK, or Cyrillic output is romanized](/guide/documents/troubleshooting#wrong-script-or-romanized-output).
