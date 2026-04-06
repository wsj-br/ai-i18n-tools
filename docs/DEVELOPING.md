# Developing ai-i18n-tools

## Prerequisites

- Node.js 18+ (or the version specified in `package.json` / CI)
- npm, pnpm, or yarn

## Setup

```bash
git clone https://github.com/wsj-br/ai-i18n-tools.git
cd ai-i18n-tools
npm install
```

## Common commands

```bash
npm run build    # TypeScript compile (output in dist/)
npm test         # Jest unit tests
npm run lint     # ESLint (flat config: eslint.config.mjs)
```

**Note:** `chalk` is pinned to **v4** so Jest (CommonJS) can load it; **v5** is ESM-only.

## Layout

- `src/` — library and CLI implementation (`core/`, `cli/`, `extractors/`, `processors/`, `glossary/`, etc.)
- `tests/` — unit tests
- `edit-cache-app/` — static assets for `ai-i18n-tools edit` (CLI command `edit`; `edit-cache` remains an alias)
- `docs/` — user and contributor documentation ([README.md](./README.md) is the doc index)

## Publishing

See the repository README and npm docs when cutting a release: build, test, then `npm publish` (with appropriate version and access).

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md).
