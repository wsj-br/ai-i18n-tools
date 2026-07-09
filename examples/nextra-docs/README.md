# Nextra docs example

Minimal [Nextra](https://nextra.site/) 4 site translated by [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools) using `docsOutput.style: "nextra"`.

English source pages live under `content/en/`. Translated copies are committed under `content/pt-BR/` and `content/zh-Hans/`. Theme strings live in `app/_dictionaries/en.ts`; sidebar labels are inline in `content/en/**/_meta.ts`. Both are translated via **`translate-docs`** (no `json[]` sidecars).

Full integration guide: [Nextra integration](https://wsj-br.github.io/ai-i18n-tools/guide/nextra-integration/) on the main documentation site.

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
npx degit wsj-br/ai-i18n-tools/examples/nextra-docs nextra-docs
cd nextra-docs
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

Open [http://localhost:3070/](http://localhost:3070/). Use the language menu for `pt-BR` and `zh-Hans`.

If you previously hit a redirect loop (`/en-GB/en-GB/...`), clear the `NEXT_LOCALE` cookie for `localhost` — the example proxy resets invalid locale cookies automatically.

Production build:

```bash
pnpm run build
pnpm run start
```

> **Note:** Nextra 4.6.1 is incompatible with Zod 4.4.x until an upstream fix ships. This example includes a small `pnpm` patch for `nextra-theme-docs` (see `patches/`). When installing from the monorepo root, the same patch is applied via the workspace `pnpm-workspace.yaml`.

## Translate documentation

```bash
echo "OPENROUTER_API_KEY=sk-or-..." > .env
pnpm run i18n:sync
```

Config: [`ai-i18n-tools.config.json`](./ai-i18n-tools.config.json).

## Project layout

```text
examples/nextra-docs/
├── ai-i18n-tools.config.json
├── glossary-user.csv
├── package.json
├── next.config.ts
├── proxy.ts
├── app/
│   ├── [lang]/
│   │   ├── layout.tsx
│   │   └── [[...mdxPath]]/page.tsx
│   └── _dictionaries/
│       ├── en.ts
│       ├── pt-BR.ts
│       └── zh-Hans.ts
└── content/
    ├── en/
    │   ├── _meta.ts
    │   └── guide/_meta.ts
    ├── pt-BR/
    └── zh-Hans/
```
