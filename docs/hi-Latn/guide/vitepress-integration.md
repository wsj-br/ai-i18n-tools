<a id="vitepress-integration"></a>
# VitePress integration

[VitePress](https://vitepress.dev/) documentation sites ke liye `init -t ui-vitepress` aur `docsOutput.style: "vitepress"` ka upyog karein. Yah preset ek alias hai `doc-system` ke liye jismein ek khaali `localeSubpath` aur BCP-47 locale folder ke naam surakshit rakhe gaye hain (`localePathLowercase` default roop se `false` hota hai, isliye folders `pt-BR`, `zh-Hans`, aadi bane rahte hain).

Yeh bhi dekhen [Documents](/guide/documents/) aur chalne yogya [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) demo. Is repository ki apni documentation site `docs/` ke tahat ek poora VitePress + ai-i18n-tools reference hai (nau locales, theme catalog, GitHub Pages).

<a id="quick-start"></a>
## Turant shuru karein

```bash
npx ai-i18n-tools init -t ui-vitepress
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm run docs:build  # VitePress build (project-specific script)
```

`features.translateDocs` ko enable karein jab aap page content aur VitePress chrome strings ko ek `sync` run mein translate karte hain.

<a id="page-layout"></a>
## Page layout

English markdown VitePress content root (aam taur par `docs/`) mein rehta hai. Anuvadit copies source tree ke bagal mein likhi jaati hain:

```text
docs/index.md           →  docs/de/index.md
docs/guide/quick-start.md  →  docs/de/guide/quick-start.md
```

Ek `docs[]` block configure karein:

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

`contentPaths` ko apni English `.md` files aur directories par point karein. `docsRoot` ko usi folder par set karein jise VitePress apne content root ke roop mein upyog karta hai.

VitePress [internationalization](https://vitepress.dev/guide/i18n) ko wire karein: English `root` par, har target locale `locales[code].link` ke tahat (udharan ke liye `/pt-BR/`). `ai-i18n-tools.config.json` mein `targetLocales` ko `.vitepress/config.mts` mein `locales` keys ke saath align rakhein.

<a id="theme-strings"></a>
## Theme strings

VitePress nav, sidebar, footer, search placeholder, aur anya `themeConfig` labels markdown se extract nahi kiye jaate hain. **`docsOutput.vitepressThemeCatalog`** ko configure karein taki **`translate-docs`** English catalog ko `.vitepress/config.mts` se bootstrap kare (jab strings inline hon) aur locale theme JSON files ko translate kare:

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

- **`catalogPath`** — generate kiya gaya English nested JSON (bootstrap output). Lekhak is file ko haath se maintain nahi karte hain jab English `config.mts` mein rehti hai; ise refresh karne ke liye `sync` ko phir se chalayein.
- **`outputPathTemplate`** (optional) — per-locale outputs; default: `catalogPath` ke samaan directory mein `theme.{locale}.json` ke saath.

`.vitepress/config.mts` mein per-locale file ko `loadTheme()` ke madhyam se load karein aur translated JSON se `locales[code].themeConfig` banayein. Dekhen [examples/vitepress-docs/docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts).

VitePress theme strings ke liye `json[]` ka upyog **na karein** — vah pattern keval asambandhit app locale bundles ke liye hai.

<a id="wire-config-mts-to-generated-theme-json"></a>
## Wire config.mts to generated theme JSON (ek baar)

`vitepressThemeCatalog` ke saath pehle safal `i18n:sync` / `translate-docs` run ke baad, repo ne `theme.en.json` aur `theme.{locale}.json` generate kiye hain, lekin ek **maujooda** site mein abhi bhi `config.mts` mein hardcoded `text:` / `message:` strings ho sakte hain. VitePress translated JSON ka upyog tab tak nahi karega jab tak config ise `loadTheme()` ke madhyam se load nahi karta.

**Tool scope mein nahi:** automatic codemod. Is prompt ka upyog har project mein ek baar karein (ya example config ka upyog karke manually refactor karein).

1. **Kab** — pehle sync ne `catalogPath` aur locale theme files banaye; dev/build mein translated nav/sidebar ki ummeed karne se pehle.
2. **Apratibandhit rakhein** — route links (`/guide/…`), locale keys, `defineConfig` structure, non-string options (search provider, collapsed flags).
3. **Sandarbh** — [examples/vitepress-docs/docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts) aur generate kiya gaya `theme.en.json` shape.
4. **Satyapit karein** — `pnpm docs:dev`, nav mein locale badlein, sidebar/footer/search placeholder translate hone ki pushti karein; `pnpm docs:build` pass hota hai.

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

<a id="framework-shell-translation"></a>
## Framework shell anuvaad

| Framework | Shell / theme strings | Pipeline |
|-----------|----------------------|----------|
| Docusaurus | `write-translations` catalog (`{ message, description }`) | Documents — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | Theme/nav/sidebar catalog | Documents — `docsOutput.vitepressThemeCatalog` + `translate-docs` |
| Nextra | `_meta.ts` sidebar labels | Documents — auto jab `style: "nextra"` + `translate-docs` |
| Nextra | Theme dictionary `.ts` | Documents — `docs[].nextraDictionaryPath` + `translate-docs` |
| Fumadocs | `meta.json` sidebar labels | Documents — auto jab `style: "fumadocs"` + `translate-docs` |
| Fumadocs | UI overrides catalog | Documents — `docsOutput.fumadocsUiCatalog` + `translate-docs` |
| Astro Starlight | Built-in UI strings (kai sthaaneeya bhashaen); koi atirikt shell pipeline nahin | Dastavez — `translate-docs` (keval prishth) |

Framework shell/theme strings ko `json[]` mein **na** daalein — vah pipeline unrelated app locale bundles ke liye hai. Anya framework patterns ke liye [Docusaurus integration](/guide/docusaurus-integration) aur [Nextra integration](/guide/nextra-integration) dekhein.

<a id="example-project"></a>
## Example project

[examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) — English sources `docs/` par, committed `pt-BR` aur `zh-Hans` page trees, plus `theme.pt-BR.json` / `theme.zh-Hans.json`. Port 3060 par `pnpm run docs:dev` chalaen.

<a id="readme-as-the-docs-homepage"></a>
## README as the docs homepage

Kuch projects `README.md` ko VitePress site mein `docs/index.md` ke roop mein copy karte hain (yeh repo `docs:build` se pehle `scripts/sync-readme-to-docs.mjs` ka upyog karta hai). Vah pattern GitHub aur documentation site ke beech ek file share karta hai, lekin link niyam alag hain:

| Link prakar | GitHub par kaam karta hai | VitePress par kaam karta hai |
|-----------|-----------------|-------------------|
| `docs/guide/foo.md` | Haan | Nahin — site routes ka upyog karen ya sync ke dauran normalizer ko rewrite karne den |
| `./LICENSE`, `examples/demo/` | Haan (repo-relative) | Nahin — **poore URLs** ka upyog karen |
| `/guide/foo` | Nahin | Haan |

**Sifarish:** `README.md` mein, VitePress content tree ke bahar kisi bhi cheez ke liye **poore URLs** ka upyog karen (`LICENSE`, `examples/`, config files, agent context files) aur `translated-docs/` ke tahat anuvadit README copies ke liye. In-site documentation links ke liye `docs/guide/…` paths (ya English docs mein `docs/` ke tahat site routes) ka upyog karen; sync script aur `rewriteVitepressLinks` normalizer unhe `/guide/…` routes mein badalte hain.

Udaharan:

```markdown
[console-app demo](https://github.com/your-org/your-repo/tree/main/examples/console-app/)
[License](https://github.com/your-org/your-repo/blob/main/LICENSE)
[Quick start](/guide/quick-start)
```

<a id="link-conventions"></a>
## Link conventions

VitePress content root se English pages serve karta hai aur `docs/<locale>/…` se locale copies, lekin **in-page links ko site routes ka upyog karna chahiye** (`/guide/quick-start`, `/reference/configuration`) — na ki repo-relative paths jaise `docs/guide/quick-start.md` ya `../guide/quick-start.md`. Ye README-style paths GitHub mein kaam karte hain lekin VitePress ke andar toot jaate hain (dev mein aur GitHub Pages par 404).

Built-in normalizer ko enable karein taaki `translate-docs` har translated file mein links ko automatically theek kar de:

```json
"docsOutput": {
  "style": "vitepress",
  "docsRoot": "docs",
  "rewriteVitepressLinks": true
}
```

`rewriteVitepressLinks` default roop se enabled hota hai jab `style` `"vitepress"` hota hai.

| English source mein author karein | Normalizer ke baad |
|--------------------------|------------------|
| `[JSON](/guide/json)` | `[JSON](/guide/json)` |
| locale index par `[Home](./README.md)` | `/` |
| `[Demo](https://github.com/org/repo/tree/main/examples/console-app/)` | aparivartit (poora URL) |

**Authoring rules**

- Cross-page doc links: English markdown mein `docs/` ke tahat **site routes** (`/guide/…`, `/reference/…`) ka upyog karen, ya `README.md` se sync karte samay `docs/guide/…` paths ka.
- Chalne yogya demos, `LICENSE`, aur anya repo files: `README.md` aur docs mein **poore GitHub URLs** ka upyog karen ([README as the docs homepage](#readme-as-homepage) dekhen).
- `docs/<locale>/` mein links ko haath se edit **na** karen — `sync` / `translate-docs` ke saath phir se generate karen.

Yeh bhi dekhein [Link rewriting](/guide/images-and-screenshots/link-rewriting) (flat vs VitePress) aur [Configuration — `docsOutput`](/reference/configuration#docsoutput).
