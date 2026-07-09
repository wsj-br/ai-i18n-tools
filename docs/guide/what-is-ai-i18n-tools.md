<a id="what-is-ai-i18n-tools"></a>
# What is ai-i18n-tools?

ai-i18n-tools is a command-line tool and toolkit that helps you translate your app and documentation using your preferred LLM provider. You control everything from a single config file, choosing which translation features to enable. Use the "sync" command to run the modes you need in one go.

<a id="translation-modes"></a>
## Translation modes

- **UI strings** — Extract `t("…")` calls (and similar markers) from JS/TS source and write flat per-locale JSON files for i18next or static lookup. Commands: `extract`, `translate-ui`. Guide: [UI strings](/guide/ui-strings/).
- **Documents** — Translate Markdown, MDX, and `.astro` pages listed in `docs[].contentPaths`. Works with VitePress, Starlight, Docusaurus, Nextra, Fumadocs, Astro, and other static doc sites. Command: `translate-docs`. Guide: [Documents](/guide/documents/).
- **JSON** — Translate nested JSON locale bundles (theme labels, i18n overrides, app copy not in source) defined in top-level `json[]`. Command: `translate-json`. Guide: [JSON](/guide/json).
- **SVG** — Translate visible text inside SVG illustrations (`<text>`, `<title>`, `<desc>`) and write one output file per locale. Separate from document translation — `translate-docs` does not modify SVG assets. Command: `translate-svg`. Guide: [SVG translation](/guide/svg-translation/).

All four modes use the active [LLM provider](/guide/providers-and-models), share the same config file, and reuse a SQLite cache so reruns only send new or changed text to the model.

<a id="which-should-i-use"></a>
## Which should I use?

| Your content | Mode | Command |
| --- | --- | --- |
| Source code uses `t()` or HTML `data-i18n` markers | UI strings | `extract` / `translate-ui` |
| Localized pages or doc sites | Documents | `translate-docs` |
| Standalone nested JSON locale files | JSON | `translate-json` |
| Diagrams or illustrations with labels in SVG | SVG | `translate-svg` |

Many projects combine modes — for example UI strings plus documents for a VitePress site, or documents plus SVG for illustrated guides. See [Quick start](/guide/quick-start) for scaffold templates and [Configuration](/reference/configuration) for the full config schema.

<a id="examples"></a>
## Examples

The repository ships runnable example projects under `examples/` — each with its own config, committed locale outputs, and README. You can explore translated files without an API key; re-running translation requires a provider key (see [Providers and models](/guide/providers-and-models)).

| Example | What it shows |
| --- | --- |
| [console-app](/examples#console-app) | Smallest end-to-end app: `t()` UI strings plus README translation |
| [nextjs-app](/examples#nextjs-app) | Next.js UI, plurals, SVG, Docusaurus docs site, dashboard |
| [astro-website](/examples#astro-website) | Astro marketing site: full-page HTML translation plus `t()` strings |
| [astro-docs](/examples#astro-docs) | Astro Starlight documentation site |
| [vitepress-docs](/examples#vitepress-docs) | VitePress docs plus theme catalog |
| [nextra-docs](/examples#nextra-docs) | Nextra docs plus `_meta.ts` sidebar labels and theme dictionary |
| [fumadocs-docs](/examples#fumadocs-docs) | Fumadocs docs plus `meta.json` sidebar labels and UI catalog |
| [multi-provider](/examples#multi-provider) | Compare LLM providers on the same document |
| [test-markdown](/examples#test-markdown) | Markdown pipeline stress tests (CJK, Devanagari, edge cases) |

See [Examples](/examples) for `npx degit` copy commands and a choosing guide.

<a id="next-steps"></a>
## Next steps

1. [Installation](/guide/installation) — install the package and set your provider API key.
2. [Quick start](/guide/quick-start) — scaffold a config and run your first translation.
3. [Providers and models](/guide/providers-and-models) — choose a provider, model fallback chain, and `-P` override.
