# Getting started

## Prerequisites

- Node.js ≥ 22.16
- pnpm ≥ 11
- OpenRouter API key (only when re-running translation)

## Try this example standalone

```bash
npx degit wsj-br/ai-i18n-tools/examples/vitepress-docs vitepress-docs
cd vitepress-docs
pnpm install
pnpm run docs:dev
```

Open [http://localhost:3060/](http://localhost:3060/) and switch locale in the nav bar (`pt-BR`, `zh-Hans`).

## Translate

```bash
echo "OPENROUTER_API_KEY=sk-or-..." > .env
pnpm run i18n:sync
```

Config: [`ai-i18n-tools.config.json`](../ai-i18n-tools.config.json).

## Layout

English sources:

```text
docs/
├── index.md
└── guide/getting-started.md
```

After `translate-docs`:

```text
docs/
├── pt-BR/
│   ├── index.md
│   └── guide/getting-started.md
└── zh-Hans/
    ├── index.md
    └── guide/getting-started.md
```

The `vitepress` preset keeps BCP-47 folder casing (`pt-BR`, not `pt-br`).
