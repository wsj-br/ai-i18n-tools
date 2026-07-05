<a id="vitepress-integration"></a>
# VitePress integration

[VitePress](https://vitepress.dev/) documentation sites ke liye `init -t ui-vitepress` aur `docsOutput.style: "vitepress"` ka upyog karein. Yah preset ek alias hai `doc-system` ke liye jismein ek khaali `localeSubpath` aur BCP-47 locale folder ke naam surakshit rakhe gaye hain (`localePathLowercase` default roop se `false` hota hai, isliye folders `pt-BR`, `zh-Hans`, aadi bane rahte hain).

Yeh bhi dekhen [Documents](/guide/documents/), [JSON](/guide/json) (theme strings), aur chalne yogya [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) demo. Is repository ki apni documentation site `docs/` ke tahat ek poora VitePress + ai-i18n-tools reference hai (nau locales, theme JSON, GitHub Pages).

<a id="quick-start"></a>
## Turant shuru karein

```bash
npx ai-i18n-tools init -t ui-vitepress
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm run docs:build  # VitePress build (project-specific script)
```

Jab aap ek `sync` run mein page content aur VitePress chrome strings ka anuvad karte hain to `features.translateDocs` aur `features.translateJson` dono ko enable karein.

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

VitePress nav, sidebar, footer, search placeholder, aur anya `themeConfig` labels markdown se nikaale nahi jaate hain. Ek nested JSON catalog (jaise ki `docs/.vitepress/i18n/theme.en.json`) likhein aur use JSON ke saath anuvaad karein:

```json
{
  "features": {
    "translateJson": true
  },
  "json": [
    {
      "description": "VitePress theme/nav/sidebar strings",
      "contentPaths": "docs/.vitepress/i18n/theme.en.json",
      "outputPathTemplate": "docs/.vitepress/i18n/theme.{locale}.json"
    }
  ]
}
```

`.vitepress/config.mts` mein per-locale file load karein aur anuvadit JSON (nav text, sidebar group titles, footer message, aur is tarah) se `locales[code].themeConfig` banayein. `config.mts` mein anuvadit labels ko hard-code na karein — jab English badalta hai to unhein `sync` / `translate-json` ke saath regenerate karein.

Yeh package [docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/.vitepress/config.mts) mein `theme.{locale}.json` load karta hai; ek minimal do-locale setup ke liye [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) se tulna karen.

<a id="docusaurus-vs-vitepress-shell-json"></a>
## Docusaurus vs VitePress shell JSON

| Framework | Shell / theme strings | Pipeline |
|-----------|----------------------|----------|
| Docusaurus | `write-translations` catalog (`{ message, description }`) | Documents — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | Custom nested JSON catalog jo aap author karte hain | JSON — `json[]` + `translate-json` (ya `translateJson` on hone par `sync`) |

VitePress theme JSON ko `docs[]` mein na rakhein; iske bajaye `json[]` ka upyog karein.

<a id="example-project"></a>
## Example project

[examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) — English sources `docs/` par, committed `pt-BR` aur `zh-Hans` page trees, plus `theme.pt-BR.json` / `theme.zh-Hans.json`. Port 3060 par `pnpm run docs:dev` chalaen.

<a id="readme-as-homepage"></a>
## README docs homepage ke roop mein

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
