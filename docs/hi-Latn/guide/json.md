<a id="json"></a>
# JSON

Un projects ke liye design kiya gaya hai jo UI copy ko **nested JSON files mein per locale** (jaise `src/i18n/en/translation.json`) mein rakhte hain, na ki source mein `t("…")` mein. CLI un files mein string values ko walk karta hai, unhe active LLM provider ke madhyam se translate karta hai, aur `json[].outputPathTemplate` ka upyog karke per-locale outputs likhta hai. Yah `translate-docs` aur `translate-svg` (`cacheDir`) ke samaan SQLite cache ka upyog karta hai.

Yeh pipeline **nahin** chalta hai `extract` — yahaan koi `strings.json` catalog nahin hai. Ise `features.translateJson` ke saath aur top-level `json[]` mein ek ya adhik entries ke saath enable karein.

<a id="per-locale-model-overrides"></a>
### Pratyaik sthanik model override

`translate-json` **pratyek target locale** ke liye models ko resolve karta hai: jab configure kiya jaata hai to pehle `localeModels(locale)`, phir `translationModels`. Iska upyog nested JSON bundles ke liye karein jahaan kuch locales ko samarpit models se laabh hota hai — udaaharan ke liye `zh-Hans` / `zh-Hant` theme files. [Providers aur models](/guide/providers-and-models#model-fallback-chain) dekhein.

<a id="step-1-initialise-for-nested-json"></a>
### Step 1: Nested JSON ke liye initialise karein

```bash
npx ai-i18n-tools init -t ui-json-bundles
```

Vah template `features.translateJson: true` set karta hai, UI extraction aur document translation ko disable karta hai, aur `src/i18n/en/translation.json` par point karte hue ek single `json[]` block ko output `src/i18n/{llocale}/translation.json` ke saath scaffold karta hai. Apne repo layout ke liye `sourceLocale`, `targetLocales`, `contentPaths`, aur `outputPathTemplate` ko edit karein.

<a id="step-2-configure-json"></a>
### Step 2: `json[]` configure karein

Har `json[]` block ek pipeline ka varnan karta hai:

- `contentPaths` — ek ya ek se adhik `.json` files, directories, ya globs (jaise `"src/i18n/en/translation.json"` ya `"src/i18n/en/overrides/*.json"`). Paths project root se resolve hote hain.
- `outputPathTemplate` — avashyak. Har target locale file kahan likhna hai. Placeholders: `{locale}`, `{LOCALE}`, `{llocale}` (lowercased locale, Astro route folders ke liye upyogi), `{stem}`, `{basename}`, `{extension}`, `{relativeToSourceRoot}`.
- `targetLocales` (optional) — sirf is block ke liye subset; anyatha root `targetLocales` lagu hota hai.
- `keyPolicy` — kaun si JSON keys translatable prose rakhti hain vs stable identifiers (neeche dekhein).
- `description` (optional) — CLI headers aur `status` output mein dikhaya gaya hai.

Udaaharan (multiple source files, lowercase locale folders):

```json
{
  "sourceLocale": "en",
  "targetLocales": ["de", "fr", "pt-BR"],
  "features": {
    "translateJson": true
  },
  "cacheDir": ".translation-cache",
  "json": [
    {
      "description": "App UI bundle",
      "contentPaths": [
        "src/i18n/en/translation.json",
        "src/i18n/en/overrides/*.json"
      ],
      "outputPathTemplate": "src/i18n/{llocale}/{basename}",
      "keyPolicy": {
        "mode": "denylist",
        "skipKeys": ["id", "slug", "href", "url", "key", "code"],
        "translateKeys": []
      }
    }
  ]
}
```

**`keyPolicy`**

| `mode`      | Vyavahar |
|-------------|-----------|
| `allowlist` | Sirf `translateKeys` (dot paths; minimatch globs) se mail khane wali keys translate hoti hain. |
| `denylist`  | `skipKeys` se mail khane wali keys ko chhodkar sabhi string values ko translate karein. |
| `both`      | Pehle `translateKeys` lagu karein, phir `skipKeys` se matches hatayein. |

Paths dot notation (`nav.home.label`) ka upyog karte hain. `slug` jaisa ek nanga naam kisi bhi gehrai par antim key segment se mail khata hai.

<a id="step-3-translate-json-bundles"></a>
### Step 3: JSON bundles translate karein

```bash
npx ai-i18n-tools translate-json
```

Vikalpik flags (`translate-docs` jaise hi vichaar): `-l` / `--locale` lakshyon ke upsamuchchay ke liye, `-p` / `--path` files ko seemit karne ke liye, `--dry-run`, `--force` (milit files ke liye file tracking aur segment cache saaf karein), `--force-update` (jab file hash milta hai to phir se process karein; segment cache abhi bhi lagu hota hai), `-b` / `--batch-concurrency`, `--prompt-format` (`xml` \| `json-array` \| `json-object`).

Keval JSON projects chal sakte hain:

```bash
npx ai-i18n-tools sync --no-ui --no-svg --no-docs
```

Jab UI ya docs bhi saksham hon, to `sync` **translate-docs ke baad translate-json** chalata hai (jab tak ki `--no-json` na ho). `--no-json` ke saath JSON ko chhodein.

Prati file aur locale ke liye coverage jaanchein:

```bash
npx ai-i18n-tools status
```

Jab `translateJson` chalu hota hai, to `status` ek `json[]` section print karta hai (✓ up to date, ● stale ya missing).

<a id="json-vs-other-pipelines"></a>
### JSON vs anya pipelines

| Sthiti | Upyog Karen |
|-----------|-----|
| JS/TS/Astro mein `t("…")` / `i18n.t("…")` mein UI strings | [UI strings](/guide/ui-strings/) — `extract` + `translate-ui` |
| Docusaurus `write-translations` catalog (`{ "key": { "message": "…", "description": "…" } }`) | Documents — `docs[].docusaurusCatalogDir` + `translate-docs`, `json[]` **nahi** |
| VitePress theme/nav/sidebar strings | Documents — `docsOutput.vitepressThemeCatalog` + `translate-docs`; **na karein** `json[]` ka upyog — dekhein [VitePress integration](/guide/integrations/vitepress) |
| Nextra `_meta.ts` labels aur theme dictionary `.ts` | Documents — `translate-docs` (auto `_meta` jab `style: "nextra"`, optional `nextraDictionaryPath`); **na karein** `json[]` ka upyog — dekhein [Nextra integration](/guide/integrations/nextra) |
| Fumadocs `meta.json` labels aur UI overrides catalog | Documents — `translate-docs` (auto `meta.json` jab `style: "fumadocs"`, optional `fumadocsUiCatalog`); **na karein** `json[]` ka upyog — dekhein [Fumadocs integration](/guide/integrations/fumadocs) |
| Standalone nested locale JSON (ZenBrowser-style `translation.json` trees) | JSON — `json[]` + `translate-json` |
| `<text>` / `<title>` / `<desc>` ke saath illustrated `.svg` files | `features.translateSVG` + [`svg`](/reference/configuration#svg) + `translate-svg` (vaikalpik; teen mukhya pipelines mein se ek nahin) |

Field reference: [`json`](#json) [Configuration reference](/reference/configuration#json) mein. Cleanup ke liye cache keys `file_tracking` mein `json-block:{blockIndex}:{projectRelPath}` ka upyog karte hain.
