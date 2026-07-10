# Fumadocs docs example

Minimal [Fumadocs](https://www.fumadocs.dev/) site translated by [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools) using `docsOutput.style: "fumadocs"` with the **dot** i18n parser (SWR-style `*.pt-BR.mdx` / `*.zh-Hans.mdx` suffixes).

English source pages live at `content/docs/`. Translated copies are committed as dot-suffix files (`*.pt-BR.mdx`, `*.zh-Hans.mdx`). Sidebar labels live in `content/docs/meta.json`; UI strings are bootstrapped from `lib/layout.shared.ts` into `lib/i18n/ui.en.json`. Both are translated via **`translate-docs`** (no `json[]` sidecars).

Full integration guide: [Fumadocs integration](https://wsj-br.github.io/ai-i18n-tools/guide/integrations/fumadocs/) on the main documentation site.

## Locales

| Code | Language |
|------|----------|
| `en` | English |
| `pt-BR` | Portuguese (Brazil) |
| `zh-Hans` | Simplified Chinese |

## Requirements

- Node.js ≥ 22.16
- pnpm ≥ 11
- OpenRouter API key (only when re-running translation)

## Installation

### Try this example on its own

```bash
npx degit wsj-br/ai-i18n-tools/examples/fumadocs-docs fumadocs-docs
cd fumadocs-docs
pnpm install
```

### From the full ai-i18n-tools repository

```bash
pnpm install
pnpm run build
```

## Run the site

```bash
pnpm run dev
```

Open [http://localhost:3080/docs](http://localhost:3080/docs). Use the language menu for `pt-BR` and `zh-Hans`.

Production build:

```bash
pnpm run build
pnpm run start
```

## Translate documentation

```bash
echo "OPENROUTER_API_KEY=sk-or-..." > .env
pnpm run i18n:sync
```

Config: [`ai-i18n-tools.config.json`](./ai-i18n-tools.config.json).

## Project layout

```text
examples/fumadocs-docs/
├── ai-i18n-tools.config.json
├── glossary-user.csv
├── package.json
├── next.config.mjs
├── proxy.ts
├── lib/
│   ├── i18n.ts
│   ├── layout.shared.ts
│   └── i18n/
│       ├── ui.en.json
│       ├── ui.pt-BR.json
│       └── ui.zh-Hans.json
└── content/
    └── docs/
        ├── meta.json
        ├── index.mdx
        ├── index.pt-BR.mdx
        ├── index.zh-Hans.mdx
        └── guide/
            ├── meta.json
            └── getting-started.mdx
```

### Dir parser (locale folders)

For Nextra-style `content/docs/en/` → `content/docs/pt-BR/` layouts, see `ai-i18n-tools.config.dir.example.json` and [Fumadocs integration](https://wsj-br.github.io/ai-i18n-tools/guide/integrations/fumadocs#dir-parser-nextra-style).
