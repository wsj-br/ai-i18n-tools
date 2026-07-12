<a id="vitepress-integration"></a>
# VitePress integration

Use `init -t ui-vitepress` aur `docsOutput.style: "vitepress"` for [VitePress](https://vitepress.dev/) documentation sites. Preset `doc-system` ke liye ek alias hai jo ek khali `localeSubpath` ke saath aata hai aur BCP-47 locale folder names ko preserve karta hai (`localePathLowercase` default roop se `false` hota hai, isliye folders `pt-BR`, `zh-Hans` aadi rehte hain).

Aur dekhein [Documents](/hi-Latn/guide/documents/) aur runnable [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) demo. Is repository ki apni documentation site `docs/` ke antaragat VitePress + ai-i18n-tools ke liye poorn sandarbh hai (nau locales, theme catalog, GitHub Pages).

<a id="quick-start"></a>
## Quick start

```bash
ai-i18n-tools init -t ui-vitepress [-P <provider>]
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm run docs:build  # VitePress build (project-specific script)
```

Page content aur VitePress chrome strings ko ek `sync` run mein anuvadit karte samay `features.translateDocs` ko saksham karein.

<a id="page-layout"></a>
## Page layout

Angrezi markdown VitePress content root (aamtaur par `docs/`) par sthit hota hai. Anuvadit pratiyon ko strot vriksh ke bagal mein likha jata hai:

```text
docs/index.md           →  docs/de/index.md
docs/guide/quick-start.md  →  docs/de/guide/quick-start.md
```

Ek `docs[]` block ko configure karein:

```json
{
  "contentPaths": ["docs/index.md", "docs/guide"],
  "outputDir": "docs",
  "docsOutput": {
    "style": "vitepress",
    "docsRoot": "docs",
    "rewriteVitepressLinks": true
  }
}
```

`contentPaths` ko apne Angrezi `.md` files aur directories par nirdeshit karein. `docsRoot` ko usi folder par set karein jo VitePress apne content root ke roop mein upyog karta hai.

VitePress [internationalization](https://vitepress.dev/guide/i18n) ko wire karein: Angrezi `root` par, pratyek lakshya locale `locales[code].link` ke antaragat (udaharan ke liye `/pt-BR/`). `targetLocales` ko `ai-i18n-tools.config.json` mein `locales` keys ke saath sanrakshit karein jo `.vitepress/config.mts` mein hain.

<a id="theme-strings"></a>
## Theme strings

VitePress nav, sidebar, footer, search placeholder, aur anya `themeConfig` labels markdown se nikaalne nahi hote. **`docsOutput.vitepressThemeCatalog`** ko configure karein taaki **`translate-docs`** English catalog ko `.vitepress/config.mts` se bootstrap kar sake (jab strings inline hote hain) aur locale theme JSON files ko anuvadit kar sake:

```json
{
  "features": {
    "translateDocs": true
  },
  "docs": [
    {
      "contentPaths": ["docs/index.md", "docs/guide"],
      "outputDir": "docs",
      "docsOutput": {
        "style": "vitepress",
        "docsRoot": "docs",
        "vitepressThemeCatalog": {
          "configPath": "docs/.vitepress/config.mts",
          "catalogPath": "docs/.vitepress/i18n/theme.en.json"
        }
      }
    }
  ]
}
```

- **`catalogPath`** — generated English nested JSON (bootstrap output). Authors is file ko haath se maintain nahi karte jab Angrezi `config.mts` mein hoti hai; `sync` ko dobara chalayein isey refresh karne ke liye.
- **`outputPathTemplate`** (vaikalpik) — pratyek locale ke output; default: `catalogPath` ke saath same directory mein `theme.{locale}.json`.

`init -t ui-vitepress` shuruati `docs/.vitepress/config.mts` aur `docs/.vitepress/i18n/theme.en.json` ko bhi scaffold karta hai jab ve files abhi tak maujood nahi hain. Config catalog ko `loadTheme()` ke madhyam se load karta hai aur standard VitePress i18n labels (including `langMenuLabel`) ko `themeConfigFor()` mein wire karta hai.

`.vitepress/config.mts` mein pratyek locale file ko `loadTheme()` ke madhyam se load karein aur `locales[code].themeConfig` ko anuvadit JSON se build karein. Dekhein [examples/vitepress-docs/docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts).

**Language menu strings:** `locales[code].label` har bhasha ka dikhne wala naam hai dropdown mein (udaharan ke liye `Português (Brasil)`). `themeConfig.langMenuLabel` **aria-label** hai language-switcher button par (VitePress default: `Change language`). `langMenuLabel` ko theme catalog mein daalein aur `langMenuLabel: t.langMenuLabel` ko `themeConfigFor()` ke andar wire karein — isey pratyek locale `label` strings se bhul na karein.

`sync` / `translate-docs` ke dauran, ai-i18n-tools chetavani deta hai jab `theme.en.json` mein ek catalog key `config.mts` se sandarbhit nahi hoti (udaharan ke liye `t.langMenuLabel` ki kami `themeConfigFor()` mein).

**Na** `json[]` ko VitePress theme strings ke liye upyog karein — yeh pattern sirf alag app locale bundles ke liye hai.

<a id="wire-configmts-to-generated-theme-json-one-off"></a>
## Wire config.mts to generated theme JSON (one-off)

Pehle safal `i18n:sync` / `translate-docs` run ke baad `vitepressThemeCatalog` ke saath, repository mein generated `theme.en.json` aur `theme.{locale}.json` hote hain, lekin ek **moujooda** site abhi bhi `text:` / `message:` strings ko `config.mts` mein hardcoded kar sakti hai. VitePress anuvadit JSON ko tab tak upyog nahi karega jab tak config usse `loadTheme()` ke madhyam se load nahi karta.

**Tool scope mein nahi:** automatic codemod. Is prompt ka upyog har project ke liye ek baar karein (ya example config ka upyog karke manually refactor karein).

1. **Kab** — pehle sync ke baad `catalogPath` aur locale theme files banaye gaye; dev/build mein translated nav/sidebar ki ummeed karne se pehle.
2. **Apratibandhit rakhein** — route links (`/guide/…`), locale keys, `defineConfig` structure, non-string options (search provider, collapsed flags).
3. **Sandarbh** — [examples/vitepress-docs/docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts) aur generated `theme.en.json` shape.
4. **Satyapit karein** — `pnpm docs:dev`, nav mein locale badlein, sidebar/footer/search placeholder translate ki pushti karein; `pnpm docs:build` pass hota hai.

**Example AI agent prompt** (Cursor ya kisi anya coding agent mein copy karein):

```markdown
Refactor our VitePress config to load theme strings from generated JSON files instead of hardcoded literals.

Context:
- ai-i18n-tools already generated English and locale theme catalogs via `docsOutput.vitepressThemeCatalog`.
- English catalog: `docs/.vitepress/i18n/theme.en.json`
- Locale catalogs: `docs/.vitepress/i18n/theme.{locale}.json` (e.g. pt-BR, zh-Hans)
- Target file: `docs/.vitepress/config.mts` (or our project's equivalent path)
- Reference pattern: https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/docs/.vitepress/config.mts

Requirements:
1. Add `loadTheme(localeFile: string)` that reads JSON from `docs/.vitepress/i18n/` (use `import.meta.url` / `fileURLToPath` for ESM paths).
2. Add `themeConfigFor(t)` that builds VitePress `themeConfig` from the catalog — keep all **links and structure** in TypeScript; only **display strings** come from JSON keys matching `theme.en.json`.
3. Wire `locales.root` and each target locale in `locales[code]` to `loadTheme('theme.en.json')` or `loadTheme('theme.{code}.json')`, then `themeConfig: themeConfigFor(theme)`.
4. Align locale codes with `ai-i18n-tools.config.json` `targetLocales` and existing VitePress `locales` keys.
5. Do **not** change markdown content paths, `base`, or link targets — only move translatable labels out of inline string literals.
6. Preserve any project-specific options (ignoreDeadLinks, head config, etc.).

After editing:
- Run `pnpm docs:dev` (or our docs dev script) and confirm English + at least one translated locale show correct nav/sidebar/footer/search placeholder.
- If a string exists in config but not in `theme.en.json`, add a matching key to the JSON shape in `themeConfigFor` and note that the user should re-run `i18n:sync` to refresh catalogs from config if needed.

Do not introduce a hand-maintained duplicate of theme strings — config must read from the generated JSON files only.
```

<a id="example-project"></a>
## Example project

[examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) — English sources `docs/` par, committed `pt-BR` aur `zh-Hans` page trees, plus `theme.pt-BR.json` / `theme.zh-Hans.json`. Port 3060 par `pnpm run docs:dev` chalayein.

<a id="readme-and-the-docs-homepage"></a>
## README aur docs homepage

Downstream projects kabhi-kabhi `README.md` ko VitePress site mein `docs/index.md` ke roop mein copy karte hain (ek build script ya manual sync ke madhyam se). Vah pattern GitHub aur documentation site ke beech ek file share karta hai, lekin link rules alag hain:

| Link type | GitHub par kaam karta hai | VitePress par kaam karta hai |
|-----------|-----------------|-------------------|
| `docs/guide/foo.md` | Haan | Nahi — site routes ka upyog karein ya normalizer ko sync ke dauran rewrite karne dein |
| `./LICENSE`, `examples/demo/` | Haan (repo-relative) | Nahi — **full URLs** ka upyog karein |
| `/guide/foo` | Nahi | Haan |

**Synced README → index ke liye sifarish:** `README.md` mein, VitePress content tree (`LICENSE`, `examples/`, config files, agent context files) ke bahar kisi bhi cheez ke liye aur `translated-docs/` ke antargat translated README copies ke liye **full URLs** ka upyog karein. In-site documentation links ke liye `docs/guide/…` paths (ya English docs mein `docs/` ke antargat site routes) ka upyog karein; ek sync script ya `rewriteVitepressLinks` normalizer unhe `/guide/…` routes mein convert kar sakta hai.

**Yah repository** `README.md` aur `docs/index.md` ko **swatantra files** ke roop mein rakhta hai: README poora npm/GitHub landing hai; `docs/index.md` ek patla docs-site entry point hai jo `/guide/` aur `/reference/` se judta hai. Jab saajha tathya badalte hain to pratyek ko uske audience ke anusaar update karein.

Kisi anya project mein synced README ke liye udaharan links:

```markdown
[console-app demo](https://github.com/your-org/your-repo/tree/main/examples/console-app/)
[License](https://github.com/your-org/your-repo/blob/main/LICENSE)
[Quick start](/hi-Latn/guide/quick-start)
```

<a id="link-conventions"></a>
## Link conventions

VitePress content root se English pages aur `docs/<locale>/…` se locale copies serve karta hai, lekin **in-page links ko site routes** (`/guide/quick-start`, `/reference/configuration`) ka upyog karna chahiye — `docs/guide/quick-start.md` ya `../guide/quick-start.md` jaise repo-relative paths ka nahi. Yeh README-style paths GitHub mein kaam karte hain lekin VitePress ke andar toot jaate hain (dev mein aur GitHub Pages par 404).

Built-in normalizer ko enable karein taaki `translate-docs` har translated file mein links ko automatically theek kar sake:

```json
"docsOutput": {
  "style": "vitepress",
  "docsRoot": "docs",
  "rewriteVitepressLinks": true
}
```

`rewriteVitepressLinks` default roop se enabled hota hai jab `style` `"vitepress"` hota hai.

| Angrezi srot mein lekhak | Normalizer ke baad (Angrezi root output) | Normalizer ke baad (anuvadit `docs/<locale>/` output) |
|--------------------------|----------------------------------------|------------------------------------------------------|
| `[JSON](/hi-Latn/guide/json)` | `[JSON](/hi-Latn/guide/json)` | `[JSON](/pt-BR/guide/json)` (locale prefix folder se mel khata hai) |
| body mein `[Quick start](/hi-Latn/guide/quick-start)` ya `hero.actions[].link` | aparivartit (`/guide/quick-start`) | `/pt-BR/guide/quick-start` |
| locale index par `[Home](./README.md)` | `/` | `/pt-BR/` |
| `hero.image.src: /logo.svg` | aparivartit | aparivartit (sajha `docs/public/` asset) |
| `[Demo](https://github.com/org/repo/tree/main/examples/console-app/)` | aparivartit (pura URL) | aparivartit (pura URL) |

`docs/` ke tahat Angrezi root srot **locale-neutral** site routes (`/guide/…`) rakhte hain. `docs/<locale>/…` mein likhi gayi files ko internal content routes par locale prefix swatah mil jata hai — jismein **home layout frontmatter** (`hero.actions[].link`, `features[].link`, `prev`/`next`) shamil hai. `/logo.svg` aur `/translation-dashboard.png` jaise sajha public assets har locale par unprefixed rahte hain.

<a id="theme-navsidebar-links"></a>
### Theme nav/sidebar links

`translate-docs` `.vitepress/config.mts` mein links ko **nahi** likhta hai. Navbar aur sidebar `link` values TypeScript mein ek baar likhi jaati hain aur config build time par har locale ke liye prefix ki jaani chahiye.

VitePress [`themeConfig.i18nRouting`](https://vitepress.dev/reference/default-theme-config#i18nrouting) keval **bhaasha switcher** (jab upyogkarta anya bhaasha chunta hai to saman page ka mapping) par niyantran karta hai. Yah statik `nav` / `sidebar` hrefs ko vartamaan bhaasha page par **nahin** likhta hai.

`ai-i18n-tools` se `prefixVitepressThemeConfigLinks` ka upyog karein (markdown link rewriting ke samaan prefix rules):

```typescript
import { prefixVitepressThemeConfigLinks } from "ai-i18n-tools";

function themeConfigFor(t: ThemeCatalog, localeCode: string | null = null) {
  const localeRoutePrefix = localeCode ? `/${localeCode}` : null;
  return prefixVitepressThemeConfigLinks(
    {
      nav: [{ text: t.nav.guide, link: "/guide/getting-started", activeMatch: "/guide/" }],
      sidebar: [/* … locale-neutral /guide/… links … */],
      /* footer, search, etc. */
    },
    localeRoutePrefix
  );
}

// root English
themeConfig: themeConfigFor(enTheme)

// each target locale
themeConfig: themeConfigFor(theme, code)
```

Locale routes par nav highlighting kaam karne ke liye **`activeMatch`** ke saath **`link`** prefix karein (`/pt-BR/guide/` na ki `/guide/`). Baahari URLs aur shared public assets mein koi badlav nahi hoga.

VitePress project mein `ai-i18n-tools` ko ek **devDependency** ke roop mein jodein (`examples/vitepress-docs/package.json` dekhein) taaki `config.mts`, `prefixVitepressThemeConfigLinks` ko import kar sake. Mukhya ai-i18n-tools documentation site seedhe `src/processors/…` se import karti hai kyunki yeh monorepo checkout ko dogfood karti hai; standalone copies (degit) ko npm package ka upyog karna chahiye.

**Authoring rules**

- Cross-page doc links: English markdown mein `docs/` ke antargat **site routes** (`/guide/…`, `/reference/…`) ka upyog karein, ya `docs/guide/…` paths ka jab kisi README ko author kar rahe hon jise kisi anya project mein `docs/index.md` mein sync kiya jaayega.
- Runnable demos, `LICENSE`, aur anya repo files: `README.md` aur docs mein **poore GitHub URLs** ka upyog karein ([README aur docs homepage](#readme-as-the-docs-homepage) dekhein).
- `docs/<locale>/` mein links ko manually edit **na** karein — `sync` / `translate-docs` ke saath regenerate karein.

Yeh bhi dekhein [Link rewriting](/hi-Latn/guide/images-and-screenshots/link-rewriting) (flat vs VitePress) aur [Configuration — `docsOutput`](/hi-Latn/reference/configuration#docsoutput).
