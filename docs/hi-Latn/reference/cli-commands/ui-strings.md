<a id="cli--ui-strings"></a>
# CLI — UI strings

<a id="extract"></a>
### `extract`

**Synopsis:** `ai-i18n-tools extract`

`t("…")` / `i18n.t("…")` literals se `strings.json` ko update karein, optional `package.json` description, aur optional bundled-master `englishName` entries jab `includeUiLanguageEnglishNames` enable ho (dekhein `ui.uiExtractor`; `languagesManifestPath` nahi padhta). `languagesManifestPath` par `ui-languages.json` ko bhi regenerate karta hai. Jab `ui.uiExtractor.extensions` mein `.html` / `.htm` list kiye jaate hain, to HTML se `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` marker strings bhi capture karta hai. Non-empty `ui.sourceRoots` ki zaroorat hai. LLM ko call nahi karta.

**Yeh bhi dekhein:** [UI strings overview](/hi-Latn/guide/ui-strings/), [Plain HTML apps](/hi-Latn/guide/ui-strings/plain-html)

---

<a id="mark-html"></a>
### `mark-html`

**Synopsis:** `ai-i18n-tools mark-html [paths...] [--write]`

HTML mein bare `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` markers insert karein taaki source text ek baar likha jaaye (element par hi). Diye gaye files/dirs/globs ko scan karta hai (default: `ui.sourceRoots` ke neeche `.html` / `.htm`). Default roop se dry run (prati-file add counts aur kisi bhi mixed-content elements ki report karta hai jinhe manual `<span data-i18n>` ki zaroorat hai); `--write` changes apply karta hai. Idempotent, `data-i18n-ignore` ka samman karta hai (element aur uske subtree ko skip karta hai), kabhi bhi code-like elements (`code`, `pre`, `kbd`, `samp`, `var`) ya empty/numeric-only text ko nahi chhoota, aur kabhi bhi valued marker emit nahi karta. LLM ko call nahi karta.

**Mukhya vikalp:** `--write`

**Yeh bhi dekhein:** [Marking HTML for translation](/hi-Latn/guide/ui-strings/plain-html#marking-html-for-translation)

---

<a id="generate-ui-languages"></a>
### `generate-ui-languages`

**Synopsis:** `ai-i18n-tools generate-ui-languages [--master <path>] [--dry-run]`

`sourceLocale` + `targetLocales` aur bundled `data/ui-languages-complete.json` (ya `--master`) ka upyog karke `ui-languages.json` ko `languagesManifestPath` (default `{ui.flatOutputDir}/ui-languages.json` par) likhein. Master file se missing locales ke liye `TODO` placeholders ki chetavani deta hai aur emit karta hai. Yadi aapke paas customized `label` ya `englishName` values ke saath ek maujooda manifest hai, to unhe master catalog defaults se badal diya jaayega — baad mein generate ki gayi file ki review karein aur adjust karein.

**Mukhya vikalp:** `--master`, `--dry-run`

---

<a id="translate-ui"></a>
### `translate-ui`

**Synopsis:** `ai-i18n-tools translate-ui [-l <codes>] [--force] [--dry-run] [-j <n>]`

Keval UI strings ka anuvad karein (`strings.json` → locale JSON). `features.translateUIStrings` ki zaroorat hai.

**Mukhya vikalp:** `-l` / `--locale`, `--force`, `--dry-run`, `-j` / `--concurrency`

`-l` / `--locale`: comma-separated target locales (default: config `targetLocales` minus `sourceLocale`). `--force`: prati locale sabhi entries ka phir se anuvad karein (maujooda anuvadon ko ignore karein). `--dry-run`: koi writes nahi, koi API calls nahi.

---

<a id="sync-ui"></a>
### `sync-ui`

**Saransh:** `ai-i18n-tools sync-ui [-l <codes>] [--force] [--dry-run] [-j <n>]`

UI string nikalen, phir unka anuvad karen (iske liye `features.translateUIStrings` ki avashyakta hai). Sirf UI — koi dastavej, SVG, ya `json[]` nahi. `translate-ui` ke saman `-l`, `--force`, `--dry-run`, aur `-j` vikalp.

---

<a id="proofread-ui"></a>
### `proofread-ui`

**Saransh:** `ai-i18n-tools proofread-ui [-l <code>] [--chunk <n>] [--dry-run] [--json] [-j <n>]`

Pahle `extract` chalata hai (iske liye `features.translateUIStrings` ki avashyakta hai) taki `strings.json` srot se mel khaye, phir srot-sthanik UI string ki LLM samiksha (spelling, grammar). Shabdavali ke sanket sirf `glossary.userGlossary` CSV se aate hain (`translate-ui` ke saman scope — `strings.json` / `uiGlossary` nahi, isliye kharab copy glossary ke roop mein majboot nahi hoti). Sakriya LLM pradata ka upyog karta hai (uska API-key env var).

Asafalta par **1** se bahar nikalta hai (missing feature flag, extract failure, missing/invalid catalog, missing API key, ya jab sabhi batch fail ho jate hain); jab run safaltapoorvak poora ho jata hai to **0** se bahar nikalta hai (findings salahkari hain). `cacheDir` ke tahat `proofread-ui-results_<timestamp>.log` ko manav-pathaniya report ke roop mein likhta hai (saransh, samasyaen, aur prati-string OK panktiyan); terminal sirf saransh sankhya aur samasyaen print karta hai (prati string koi `[ok]` line nahi). Antim line par log filename print karta hai. `--json` ke sath, manav-shaili ka output stderr par jata hai. Links dashboard UI strings link button ki tarah `path:line` ka upyog karte hain.

**Mukhya vikalp:** `-l` / `--locale`, `--chunk` (default **50**), `--dry-run`, `--json`, `-j` / `--concurrency`

---

<a id="export-ui-xliff"></a>
### `export-ui-xliff`

**Saransh:** `ai-i18n-tools export-ui-xliff [-l <codes>] [-o <dir>] [--untranslated-only] [--dry-run]`

`strings.json` ko XLIFF 2.0 mein export karen (prati target locale ek `.xliff`). Sirf padhne ke liye; koi API nahi.

**Mukhya vikalp:** `-l` / `--locale`, `-o` / `--output-dir`, `--untranslated-only`, `--dry-run`

`-o` / `--output-dir`: output directory (default: catalog ke saman folder). `--untranslated-only`: us locale ke liye anuvad ke bina sirf units.
