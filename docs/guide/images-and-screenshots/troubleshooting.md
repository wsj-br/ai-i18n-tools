<a id="common-mistakes-and-troubleshooting"></a>
# Common mistakes and troubleshooting

**No locale directory in screenshot paths**
`images/screenshots/screenshot.png` — cannot distinguish locale variants and cannot be rewritten. Restructure to `images/screenshots/<locale>/screenshot.png` before using [per-locale folder](/guide/images-and-screenshots/per-locale-folder) rewriting.

**Hardcoded source locale in regex**
`"search": "screenshots/en-GB/"` — breaks silently if `sourceLocale` changes. Use `"search": "screenshots/[^/]+/"` instead.

**SVG sources and outputs in the same directory**
If `svg.sourcePath` and `svg.outputDir` overlap, generated files mix with hand-edited sources. Keep them in separate directories.

**Absolute Docusaurus static URLs for colocated SVGs**
`/img/diagram.svg` (from `static/img/`) requires a `regexAdjustments` rule to rewrite to `../assets/` in translated output. Place source SVGs in `static/assets/` and use relative `../assets/diagram.svg` from the start to avoid this entirely.

**Missing `docs/assets` symlink in Docusaurus**
Without the symlink, source docs in `docs/user-guide/` cannot reference PNGs or SVGs in `static/assets/` via a relative path. Set up the symlink at project creation: `ln -s ../static/assets documentation/docs/assets`.

**`take-screenshots` script only captures the source locale**
Per-locale folder layout requires PNG files for every locale. If the script only captures `en-GB`, translated docs will have rewritten paths pointing to missing files.

**`regexAdjustments` rewriting inside fenced config examples**
`postProcessing` runs on the full translated markdown body, including fenced code blocks. If a doc page embeds a config snippet that contains a matching path (e.g. `screenshots/en-GB/`), that snippet is rewritten in translated output too. Prefer the generic `screenshots/[^/]+/` form in reusable examples, or accept that translated docs will show locale-specific paths inside illustrations.
