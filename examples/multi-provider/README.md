# Multi-provider markdown translation example

Minimal example for comparing LLM providers on the same document. Unlike [`../test-markdown`](../test-markdown), which varies the source language, this example keeps a single Portuguese source document and varies the provider used to translate it. There is no UI string extraction step — only `features.translateDocs` is enabled.

All four providers are defined in a single config ([`ai-i18n-tools.config.json`](./ai-i18n-tools.config.json)); you pick which one to use per run with the global `-P` / `--provider` flag.

| Provider    | Model (default)              | API-key environment variable |
|-------------|------------------------------|------------------------------|
| `openai`    | `gpt-4o-mini`                | `OPENAI_API_KEY`             |
| `anthropic` | `claude-3-5-haiku-latest`    | `ANTHROPIC_API_KEY`          |
| `nvidia`    | `meta/llama-3.1-8b-instruct` | `NVIDIA_API_KEY`             |
| `deepseek`  | `deepseek-chat`              | `DEEPSEEK_API_KEY`           |

The default `provider` in the config is `openai`; the `-P` flag overrides it for a single run. The model ids are sensible low-cost defaults — edit `translationModels` in the config to try different models per provider.

## Source document and targets

| Source locale | Config                                                  | Source file                                          |
|---------------|---------------------------------------------------------|------------------------------------------------------|
| `pt-BR`       | [`ai-i18n-tools.config.json`](./ai-i18n-tools.config.json) | [`markdown-example.md`](./markdown-example.md) |

Target locales: `en-GB`, `zh-Hans`.

Outputs: `translated-docs/markdown-example.{locale}.md`

## API keys

Each provider needs its API key exported in your shell before running. Set only the key(s) for the provider(s) you intend to use:

```bash
export OPENAI_API_KEY=sk-...
export ANTHROPIC_API_KEY=sk-ant-...
export NVIDIA_API_KEY=nvapi-...
export DEEPSEEK_API_KEY=sk-...
```

## Requirements

This example has no dependencies of its own and installs nothing — there is no `node_modules` here. Build the library once from the repository root so the CLI entry (`bin/ai-i18n-tools.mjs`) has a `dist/` to run:

```bash
pnpm install   # at the repository root
pnpm run build # at the repository root
```

The scripts in [`package.json`](./package.json) invoke the CLI directly through the repo's bin (`node ../../bin/ai-i18n-tools.mjs …`), so no per-example install is needed.

## Usage

Run commands from this directory so paths in the config resolve correctly:

```bash
cd examples/multi-provider
```

The commands below call the CLI directly through the repo's bin with `node ../../bin/ai-i18n-tools.mjs …`. Run them through the package scripts (`pnpm run …`) or directly. (If you have `ai-i18n-tools` installed globally or on your `PATH`, you can substitute the bare `ai-i18n-tools` command — see [Using the CLI](../../README.md#using-the-cli) in the package README and [Installation](../../docs/GETTING_STARTED.md#installation) in Getting Started.)

Translate into all configured locales with a specific provider (the `-P` value must be one of the configured `providers` keys):

```bash
node ../../bin/ai-i18n-tools.mjs translate-docs -P openai    --force
node ../../bin/ai-i18n-tools.mjs translate-docs -P anthropic --force
node ../../bin/ai-i18n-tools.mjs translate-docs -P nvidia    --force
node ../../bin/ai-i18n-tools.mjs translate-docs -P deepseek  --force
```

Single locale (for example, Japanese with Anthropic):

```bash
node ../../bin/ai-i18n-tools.mjs translate-docs -P anthropic --locale ja
```

Without `-P`, the default `provider` (`openai`) is used:

```bash
node ../../bin/ai-i18n-tools.mjs translate-docs
```

The package scripts in [`package.json`](./package.json) wrap the same commands:

```bash
pnpm run translate:openai
pnpm run translate:anthropic
pnpm run translate:nvidia
pnpm run translate:deepseek
```

### Comparing providers

All providers write to the same `translated-docs/` directory and use the same output filenames, so each run overwrites the previous provider's output. To keep results side by side for comparison, rename or copy `translated-docs/` between runs, for example:

```bash
node ../../bin/ai-i18n-tools.mjs translate-docs -P openai
mv translated-docs translated-docs-openai

node ../../bin/ai-i18n-tools.mjs translate-docs -P deepseek
mv translated-docs translated-docs-deepseek
```

The SQLite cache keys entries by model, so switching providers re-translates rather than reusing another provider's cached segments. Pass `--force` to re-translate even when a provider's own segments are already cached.

### Validating configured models

Before translating, confirm each provider's configured `translationModels` still exist in that provider's live `GET /models` list with `check-models` (it needs the provider's API key, and shows pricing only when the provider returns it):

```bash
node ../../bin/ai-i18n-tools.mjs check-models -P openai
node ../../bin/ai-i18n-tools.mjs check-models -P anthropic
node ../../bin/ai-i18n-tools.mjs check-models -P nvidia
node ../../bin/ai-i18n-tools.mjs check-models -P deepseek
```

The package scripts in [`package.json`](./package.json) wrap the same commands, plus a `check-models:all` script that runs every provider in sequence:

```bash
pnpm run check-models:all
pnpm run check-models:openai
pnpm run check-models:anthropic
pnpm run check-models:nvidia
pnpm run check-models:deepseek
```

`check-models:all` chains the four providers with `&&`, so it stops at the first provider whose configured model is missing or whose API key is unset; run the per-provider script to check just one. Use the related `list-models` command (for example `node ../../bin/ai-i18n-tools.mjs list-models -P anthropic`) to see every model a provider advertises.

Check the markdown source for issues (no API key required):

```bash
node ../../bin/ai-i18n-tools.mjs check-markdown
```

Clear the cache and generated outputs (the `build` script):

```bash
pnpm build
```

## Project structure

```text
examples/multi-provider/
├── README.md
├── ai-i18n-tools.config.json   # pt-BR source → en-GB, hi, ja, ko, zh-Hans; openai/anthropic/nvidia/deepseek providers
├── markdown-example.md         # Portuguese source
├── package.json                # build + per-provider translate / check-models scripts
├── .gitignore                  # ignores .translation-cache/ and translated-docs/
├── .translation-cache/         # generated (gitignored)
└── translated-docs/            # generated (gitignored)
    └── markdown-example.{locale}.md
```

This directory is not a pnpm workspace package and installs no dependencies — there is no `node_modules` here. Its scripts call the CLI directly through the repo's bin (`node ../../bin/ai-i18n-tools.mjs …`), which only needs the library built once from the repository root (`pnpm run build`). Run the commands through the `pnpm run …` scripts or invoke the CLI directly with `node ../../bin/ai-i18n-tools.mjs …`.
