<a id="cli--other-content"></a>
# CLI — Anya samagri

<a id="translate-json"></a>
### `translate-json`

**Sankshipt vivaran:** `ai-i18n-tools translate-json [options]`

Nested JSON ko `json[]` ke anusaar anuvaadit karein (jismein `features.translateJson` ki aavashyakta hoti hai). Saanjha SQLite cache.

**Mukhya vikalp:** `-l`, `-p` / `--path`, `--dry-run`, `--force`, `--force-update`, `-b`, `--prompt-format`

**Dekhein bhi:** [JSON](/guide/json)

---

<a id="translate-svg"></a>
### `translate-svg`

**Sankshipt vivaran:** `ai-i18n-tools translate-svg [options]`

`config.svg` mein konfigure kiye gaye SVG files ko anuvaadit karein (jo docs se alag hai). Ismein `features.translateSVG` ki aavashyakta hoti hai. Docs ke saman cache vichar; `--no-cache` ka samarthan karta hai taaki uss dauron ke liye SQLite padhne/likhne ko chhodein.

**Mukhya vikalp:** `-j`, `-b`, `--force`, `--force-update`, `-p` / `--path`, `--dry-run`, `--no-cache`

**Dekhein bhi:** [SVG anuvaad](/guide/svg-translation/)
