<a id="astro-website"></a>
# Astro website

For static Astro marketing or app sites (plain Astro, not Starlight), combine [Astro built-in i18n routing](https://docs.astro.build/en/guides/internationalization/) with ai-i18n-tools. See also [Astro integration](/guide/integrations/astro).

The reference implementation is [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) (see also its [README](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/README.md)): English at `/`, nine target locales at `/{locale}/` (`de`, `fr`, `es`, `ar`, `ja`, `ko`, `zh-cn`, `zh-tw`, `pt-br`).

<a id="hybrid-pipelines"></a>
## Hybrid pipelines

Most teams use a **hybrid** of two pipelines (they do not clash):

| Pipeline | Use for | Commands | Output |
|----------|---------|----------|--------|
| **Page HTML** | Headings, paragraphs, nav labels, inline arrays in the template body | `translate-docs` | `src/pages/{locale}/index.astro` per locale |
| **UI strings (`t()`)** | Frontmatter data, screenshot tab labels, shared arrays | `extract` → `translate-ui` | `public/locales/{locale}.json` (English source as key) |

Keep three lists aligned when you add or remove a language: `targetLocales` in `ai-i18n-tools.config.json`, `i18n.locales` in `astro.config.mjs` (Astro uses **lowercase** route codes such as `pt-br`), and `ui-languages.json` (via `generate-ui-languages`). Flat bundle **filenames** use config casing (`pt-BR.json`); map Astro's `pt-br` route to that file via your manifest `code` field (see `examples/astro-website/src/i18n/locale.ts`).

Example `package.json` scripts (from the reference project):

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:translate-ui": "ai-i18n-tools translate-ui",
  "i18n:translate": "ai-i18n-tools translate-docs",
  "i18n:locales": "ai-i18n-tools generate-ui-languages",
  "i18n:sync": "ai-i18n-tools sync"
}
```

<a id="ui-strings-ssg"></a>
## UI strings (SSG)

Scaffold UI extraction with `init -t ui-astro-website`, then merge in a `docs[]` block when you also translate page HTML (see [Parse-and-replace pages](#astro-website-pages-parse-and-replace)). Wrap copy in `t('…')` in TypeScript modules and `.astro` frontmatter (and template `{expression}` blocks when you prefer UI strings over duplicated locale pages):

```bash
ai-i18n-tools init -t ui-astro-website [-P <provider>]
ai-i18n-tools extract
ai-i18n-tools translate-ui
```

Set `sourceLocale` to match `i18n.defaultLocale` in `astro.config.mjs`. Write flat bundles to a directory Astro can import at build time (the template uses `public/locales/`). Resolve `t('…')` at **build time** by looking up the English source literal as the key (see `examples/astro-website/src/i18n/t.ts`; `strings.json` is the extraction cache, not the runtime bundle). You do **not** need `ai-i18n-tools/runtime` or i18next for a static site unless you add client islands that switch language after load.

Wire every page that calls `t()` (English root page and each `src/pages/{locale}/` copy):

```astro
import { loadFlatBundle, makeT } from '../i18n/t';        // or ../../i18n/t in locale subfolders
import { resolvePageLocale, useTranslations } from '../i18n/utils';

const locale = resolvePageLocale(Astro.currentLocale);
const flat = await loadFlatBundle(Astro.currentLocale);
const t = useTranslations(locale, makeT(flat));
```

Supporting helpers in the example: `src/i18n/utils.ts`, `src/i18n/locale.ts`, and `ui-languages.json` for labels, direction, and BCP-47 codes. Run `generate-ui-languages` after changing `targetLocales` (optionally set `languagesManifestPath` so the manifest lives next to your helpers, e.g. `src/i18n/ui-languages.json`). `MainLayout.astro` sets `<html lang>` and `<html dir>` from `resolveUiLanguage(Astro.currentLocale)`; `LanguagePicker.astro` uses `getRelativeLocaleUrl` from `astro:i18n`.

<a id="pages-parse-and-replace"></a>
## Pages (parse-and-replace)

For marketing pages with hardcoded HTML in `.astro` files, let `translate-docs` extract text nodes and attributes (`alt`, `title`, `aria-label`, `placeholder`), translate them with the document cache, and write locale-specific copies under your pages tree. You do **not** need `t()` for most visible copy.

Structural attribute and key values are **not** translated by default: built-in protection covers JSX/HTML attributes such as `class`, `id`, `style`, `src`, `href`, `data-*`, and most `aria-*`, plus object keys like `class`, `key`, and `id` inside template `{expression}` blocks. Use `docs[].protectAttributes` and `docs[].protectKeys` to extend those lists when you use custom attributes (for example Tailwind `variant` or CMS `slug` fields). The same options apply to MDX JSX during markdown translation (see [protectAttributes / protectKeys](/reference/configuration#protectattributes-protectkeys)).

Enable `features.translateDocs` and add a `docs[]` block, for example:

```json
{
  "features": { "translateDocs": true },
  "docs": [{
    "contentPaths": ["src/pages/index.astro"],
    "outputDir": "src/pages",
    "docsOutput": {
      "style": "astro-starlight",
      "docsRoot": "src/pages"
    },
    "addFrontmatter": false
  }]
}
```

Run `ai-i18n-tools translate-docs` (or `pnpm i18n:translate` in [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/)). English source stays at `src/pages/index.astro`; each target locale gets `src/pages/{locale}/index.astro` with imports adjusted for the extra directory level (for example `../layouts/` → `../../layouts/`).

Inside the **template body**, string literals in `{expression}` blocks (inline arrays, object `title`/`desc` fields) are translated when they are user-facing; quoted values on protected attributes/keys, literals inside `t('…')`, `<script>`, and `<style>` are left unchanged. **Frontmatter TypeScript is not translated** by this path—keep shared frontmatter (including `t()` imports and data arrays) identical on English and locale pages, or re-run `translate-docs` after editing the English page so locale copies pick up frontmatter changes. For frontmatter-only copy, use the [UI-string pipeline](#astro-website-ui-strings-ssg) instead.

See [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) for the full hybrid landing page (HTML via `translate-docs`, screenshot tab labels via `t()` + `translate-ui`).
