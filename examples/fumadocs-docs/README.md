# fumadocs-docs

Minimal [Fumadocs](https://www.fumadocs.dev/) 4 site demonstrating the **`fumadocs`** preset with the **dot** i18n parser (SWR-style `*.pt.mdx` / `*.zh.mdx` suffixes).

## Quick start

From the monorepo root (after `pnpm install` and `pnpm run build`):

```bash
pnpm --dir examples/fumadocs-docs dev
```

Open [http://localhost:3080/docs](http://localhost:3080/docs).

## Translation

```bash
cd examples/fumadocs-docs
pnpm run i18n:sync
```

This translates:

- MDX pages under `content/docs/` (dot suffix outputs)
- `meta.json` sidebar (`meta.pt.json`, etc.)
- UI overrides bootstrapped from `lib/layout.shared.ts` into `lib/i18n/ui.{locale}.json`

Config: `ai-i18n-tools.config.json` (`init -t ui-fumadocs`).

### Dir parser (locale folders)

For Nextra-style `content/docs/en/` → `content/docs/pt-BR/` layouts, see `ai-i18n-tools.config.dir.example.json` and [Fumadocs integration](/guide/fumadocs-integration#dir-parser-nextra-style).

## Layout

```text
content/docs/index.mdx              English source
content/docs/index.pt.mdx           Portuguese (dot suffix)
content/docs/guide/getting-started.zh.mdx
content/docs/meta.json              Sidebar (shared)
lib/i18n/ui.en.json                 UI catalog (bootstrap + translate)
lib/layout.shared.ts                English UI overrides + loadUiCatalog()
```
