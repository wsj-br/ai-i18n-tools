<a id="cli-options"></a>
# CLI vikalp

`translate-docs` cache vyavahar, flags, batch prompt format, aur internal SQLite path keys ke liye sandarbh.

<a id="cache-behaviour-and-translate-docs-flags"></a>
## Cache vyavahar aur `translate-docs` flags

CLI SQLite mein **file tracking** (prati file source hash × locale) aur **segment** rows (prati anuvad yogya chunk hash × locale) rakhta hai. Ek samanya run ek file ko poori tarah se chhod deta hai jab tracked hash vartaman source se mel khata hai, output file pahle se maujood hai, **aur** output ka sanshodhan samay source ke barabar ya naya hai; anyatha yah file ko process karta hai aur segment cache ka upyog karta hai taki aparivartit text API ko call na kare.

| Flag                          | Effect                                                                                                                                                                                                                                                              |
|-------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| *(default)*                   | Jab tracking + on-disk output mel khate hain to unchanged files ko chhod den; baki ke liye segment cache ka upyog karen.                                                                                                                                           |
| `-l, --locale <codes>`        | Comma-separated target locales (jab chhod diya jata hai, to defaults root `targetLocales` aur har `docs[]` block ke optional `targetLocales` ke union se mel khate hain).                                                                                                       |
| `-p, --path` / `-f, --file` | Sirf is path ke tahat markdown/JSON ka anuvaad karein (project-relative, absolute, ya glob pattern); `--file`, `--path` ka ek alias hai. |
| `--dry-run`                   | Koi file likhi nahi jaati aur koi API call nahi kiye jaate.                                                                                                                                                                                                         |
| `--type <kind>` | `markdown` ya `json` tak seemit karein (anyaatha config mein enable hone par dono). |
| `--json-only` / `--no-json` | Sirf JSON label files ka anuvaad karein, ya JSON ko chhod dein aur sirf markdown ka anuvaad karein. |
| `-j, --concurrency <n>` | Adhikatam parallel target locales (config ya CLI built-in default se default). |
| `-b, --batch-concurrency <n>` | Prati file adhikatam parallel batch API calls (docs; config ya CLI se default). |
| `--emphasis-placeholders`     | Anuvad se pahle markdown emphasis markers ko placeholders ke roop mein mask karein. CJK aur RTL locales ke liye swatah saksham, jab tak ki `docs[].emphasisPlaceholders` ke madhyam se prati block override na kiya jaye ya `--no-emphasis-placeholders` ke saath aksham na kiya jaye.                                                                                                                                                                          |
| `--debug-failed` | Jab validation fail ho jaata hai, to `cacheDir` ke tahat detailed `FAILED-TRANSLATION` logs likhein. |
| `--force-update` | Har matched file ko phir se process karein (extract, reassemble, outputs likhein) bhale hi file tracking skip kar de. **Segment cache abhi bhi laagu hota hai** — anuvaad na kiye gaye segments LLM ko nahi bheje jaate hain. |
| `--force` | Har processed file ke liye file tracking saaf karta hai aur API anuvaad ke liye segment cache **nahi padhta hai** (poora re-translation). Naye results abhi bhi segment cache mein **likhe jaate hain**. |
| `--stats` | Segment counts, tracked file counts, aur prati-locale segment totals print karein, phir exit karein. |
| `--clear-cache [locale]` | Cached translations (aur file tracking) delete karein: sabhi locales, ya ek single locale, phir exit karein. |
| `--prompt-format <mode>` | Segments ka har **batch** model ko kaise bheja jaata hai aur parse kiya jaata hai (`xml`, `json-array`, ya `json-object`). Default `json-array`. Extraction, placeholders, validation, cache, ya fallback behaviour ko nahi badalta hai — [Batch prompt format](#batch-prompt-format) dekhein. |

Aap `--force` ko `--force-update` ke saath combine nahi kar sakte (ve mutually exclusive hain).

<a id="batch-prompt-format"></a>
## Batch prompt format

`translate-docs` anuvad yogya segments ko active LLM provider ko **batches** mein bhejta hai (`batchSize` / `maxBatchChars` dwara samuhit). `--prompt-format` flag keval us batch ke **wire format** ko badalta hai; `PlaceholderHandler` tokens, markdown AST checks, SQLite cache keys, aur batch parsing fail hone par prati-segment fallback aparivartit rahte hain.

| Mode                   | User message                                                           | Model reply                                                 |
|------------------------|------------------------------------------------------------------------|-------------------------------------------------------------|
| `xml`                  | Pseudo-XML: har segment ke liye ek `<seg id="N">…</seg>` (XML escaping ke saath). | Kewal `<t id="N">…</t>` blocks, har segment index ke liye ek.       |
| `json-array` (default) | Strings ka ek JSON array, order mein har segment ke liye ek entry.               | **Saman length** (saman order) ka ek JSON array.           |
| `json-object`          | Segment index dwara keyed ek JSON object `{"0":"…","1":"…",…}`.            | **Saman keys** aur translated values ke saath ek JSON object. |

Kuch model ek format ko doosre ki tulna mein adhik vishvasniyata se follow karte hain, isliye yadi koi model aksar galat batch ya bemel segment id deta hai, to ek alag mode try karein. `json-array` default hai kyuki yah ek aam, saral format hai jise model aamtaur par achhe se handle karte hain.

Run header `Batch prompt format: …` bhi print karta hai taki aap active mode ki pushti kar saken. JSON label files (`docusaurusCatalogDir`) aur SVG file batches usi setting ka upyog karte hain jab ve steps `translate-docs` (ya `sync` ke docs phase — `sync` is flag ko expose nahi karta hai; yah `json-array` par default hota hai) ke hisse ke roop mein chalte hain.
