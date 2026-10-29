# Documentation sites and static pages

Use Documents for localized Markdown, MDX, Astro, and HTML pages, plus framework shell catalogs.
Use `ai-i18n-tools sync` as the normal workflow; the framework still owns routing and serving.

## Start safely

- Inspect existing config, framework locale settings, source roots, and generated outputs first.
- Preserve an existing config; `init` rewrites it, so do not rerun scaffolding blindly.
- For a new config: `ai-i18n-tools init -t <template> -P <provider>`.
- Configure the selected provider/model and credentials before translation.
- Align `sourceLocale`, `targetLocales`, framework locales, and language-switcher links.
- Set `features.translateDocs: true`; keep other pipelines enabled only when needed.
- Point `docs[].contentPaths` at source-language content, not generated locale trees.

## Choose the framework template and layout

- VitePress: `ui-vitepress`, `docsOutput.style: "vitepress"`; source at `docs/`, output under `docs/{locale}/`.
- Docusaurus: `ui-docusaurus`, style `"docusaurus"`; output under `i18n/{locale}/docusaurus-plugin-content-docs/current/`.
- Starlight: `ui-starlight`, style `"astro-starlight"`; source at `src/content/docs/`, output in locale subfolders.
- Nextra: `ui-nextra`, style `"nextra"`; `docsRoot: "content/en"`, `outputDir: "content"` for sibling locales.
- Fumadocs: `ui-fumadocs`, style `"fumadocs"`; `fumadocsParser: "dot"` writes `page.de.mdx` beside source.
- Fumadocs folder routing: set `fumadocsParser: "dir"` and source `docsRoot` to the source-locale folder.
- Repository Markdown: `docs-markdown` and style `"flat"`; `README.md` becomes `translated-docs/README.de.md`.
- Plain HTML: `docs-plain-html` for separate locale pages; `ui-plain-html` for one page with browser language switching.
- Plain Astro: `ui-astro-website` scaffolds UI; add a Documents block for page HTML, using the Astro layout.
- Add `--with-readme` to another init template when a separate README block is needed.

## Configure paths explicitly

Merge this Documents fragment into a configured project; provider and locale settings are omitted:

```json
{
  "features": { "translateDocs": true },
  "docs": [{
    "contentPaths": ["docs"],
    "outputDir": "docs",
    "docsOutput": {
      "style": "vitepress",
      "docsRoot": "docs"
    }
  }]
}
```

- `outputDir` belongs to the `docs[]` block; `docsRoot` belongs inside `docsOutput`.
- Direct `style: "doc-system"` requires `localeSubpath`, including `""` for no intermediate folder.
- `pathTemplate` overrides page paths; `jsonPathTemplate` overrides Documents JSON paths.
- Templates accept `{outputDir}`, `{locale}`, `{llocale}`, `{LOCALE}`, `{relPath}`, `{stem}`, `{basename}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}`.
- Resolved custom paths must remain inside the block's `outputDir`.
- `localePathLowercase` affects built-in paths; custom templates need `{llocale}` explicitly.
- Starlight defaults to lowercase locale paths; map route codes to BCP-47 bundle codes where needed.
- Flat output discards directories by default; use `flatPreserveRelativeDir: true` to avoid duplicate-basename collisions.

## Keep shell catalogs in Documents

- Docusaurus: generate source `write-translations` catalogs, then set `docs[].docusaurusCatalogDir` to their source-locale directory.
- VitePress: `docsOutput.vitepressThemeCatalog` requires `configPath` and `catalogPath`; `outputPathTemplate` is optional.
- Wire VitePress configuration to load generated theme JSON; translating files alone does not connect them.
- Nextra: `_meta.ts` labels are automatic for its preset; set `docs[].nextraDictionaryPath` for a theme dictionary.
- Fumadocs: `meta.json` labels are automatic; `docsOutput.fumadocsUiCatalog` requires `sourcePath` and `catalogPath`.
- Starlight ships built-in UI translations; custom overrides can use a separate Documents block with `jsonPathTemplate`.
- Do not put these framework catalogs in `json[]`; standalone app bundles use that separate pipeline.
- Astro script frontmatter and `t()` arguments are not page prose; use UI translation for their strings.

## Ownership and verification

1. Edit source-language content, config, and runtime/framework wiring, not generated translations.
2. Run `ai-i18n-tools sync` when a translation refresh is authorized.
3. Run the consumer project's existing site build command; inspect its scripts rather than guessing.
4. Check source and target routes, dropdown navigation, sidebar labels, asset URLs, and heading fragments.
5. Check RTL layout, missing imports, locale casing, and deployment base paths.
6. Fix source/config and rerun sync instead of patching generated locale files.

For VitePress, source links should use site routes such as `/guide/start`, not repository paths.
Outside fenced code, protect Vue-sensitive interpolation examples with `<code v-pre>{{name}}</code>` in VitePress Markdown.
See [assets and links](assets-and-links.md) for screenshots, link rewriting, and stable anchors.

## Published guides

- [Website setup](https://wsj-br.github.io/ai-i18n-tools/guide/add-i18n-to-website)
- [Framework integrations](https://wsj-br.github.io/ai-i18n-tools/guide/integrations/)
- [Output layouts and templates](https://wsj-br.github.io/ai-i18n-tools/guide/documents/output-layouts)
- [Configuration](https://wsj-br.github.io/ai-i18n-tools/reference/configuration)
