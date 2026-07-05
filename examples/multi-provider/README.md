# Multi-provider markdown translation example

Minimal example for comparing LLM providers on the same document. Unlike [`../test-markdown`](../test-markdown), which varies the source language, this example keeps a single Portuguese source document and varies the provider used to translate it. There is no UI string extraction step — only `features.translateDocs` is enabled.

All four providers are defined in a single config ([`ai-i18n-tools.config.json`](./ai-i18n-tools.config.json)); you pick which one to use per run with the global `-P` / `--provider` flag.

| Provider    | Model (default)             | API-key environment variable |
| ----------- | --------------------------- | ---------------------------- |
| `openai`    | `gpt-4o-mini`               | `OPENAI_API_KEY`             |
| `anthropic` | `claude-haiku-4-5-20251001` | `ANTHROPIC_API_KEY`          |
| `nvidia`    | `openai/gpt-oss-20b`        | `NVIDIA_API_KEY`             |
| `deepseek`  | `deepseek-v4-flash`         | `DEEPSEEK_API_KEY`           |

The default `provider` in the config is `nvidia`; the `-P` flag overrides it for a single run. Each provider's first entry in `translationModels` is its default — edit `translationModels` in the config to try different models per provider.

## Source document and targets

| Source locale | Config                                                   | Source file                                  |
| ------------- | -------------------------------------------------------- | -------------------------------------------- |
| `pt-BR`       | [`ai-i18n-tools.config.json`](./ai-i18n-tools.config.json) | [`markdown-example.md`](./markdown-example.md) |

Target locales: `en-GB`, `hi-Latn`, `zh-Hans`.

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

- Node.js >= 22.16.0
- [pnpm](https://pnpm.io/)
- API keys for the provider(s) you intend to use (see [API keys](#api-keys))

## Installation

### Try this example on its own

Copy only this example folder and install `ai-i18n-tools` from npm:

```bash
npx degit wsj-br/ai-i18n-tools/examples/multi-provider multi-provider
cd multi-provider
pnpm install
```

### From the full ai-i18n-tools repository

Use this when you cloned the **whole** [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools) repository (not just this folder with degit). Run `pnpm install` from the repository root; the workspace [`overrides`](../../pnpm-workspace.yaml) entry links `ai-i18n-tools` to your local checkout automatically.

The scripts in [`package.json`](./package.json) call the installed `ai-i18n-tools` CLI directly.

## Usage

Run commands from this directory (after degit + `pnpm install`, or `cd examples/multi-provider` in the monorepo) so paths in the config resolve correctly:

The commands below call the installed `ai-i18n-tools` CLI. You can run them directly as shown, or through the package scripts (`pnpm run …`).

Translate into all configured locales with a specific provider (the `-P` value must be one of the configured `providers` keys):

```bash
ai-i18n-tools translate-docs -P openai    --force
ai-i18n-tools translate-docs -P anthropic --force
ai-i18n-tools translate-docs -P nvidia    --force
ai-i18n-tools translate-docs -P deepseek  --force
```

Single locale (for example, Hindi in Latin script with Anthropic):

```bash
ai-i18n-tools translate-docs -P anthropic --locale hi-Latn
```

Without `-P`, the default `provider` (`nvidia`) is used:

```bash
ai-i18n-tools translate-docs
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
ai-i18n-tools translate-docs -P openai
mv translated-docs translated-docs-openai

ai-i18n-tools translate-docs -P deepseek
mv translated-docs translated-docs-deepseek
```

The SQLite cache keys entries by model, so switching providers re-translates rather than reusing another provider's cached segments. Pass `--force` to re-translate even when a provider's own segments are already cached.

### Validating configured models

Before translating, use `check-models` to confirm that each provider's configured `translationModels` still exist in that provider's live `GET /models` list. It needs the provider's API key, and shows pricing only when the provider returns it:

```bash
ai-i18n-tools check-models -P openai
ai-i18n-tools check-models -P anthropic
ai-i18n-tools check-models -P nvidia
ai-i18n-tools check-models -P deepseek
```

The package scripts in [`package.json`](./package.json) wrap the same commands, plus a `check-models:all` script that runs every provider in sequence:

```bash
pnpm run check-models:all
pnpm run check-models:openai
pnpm run check-models:anthropic
pnpm run check-models:nvidia
pnpm run check-models:deepseek
```

`check-models:all` chains the four providers with `&&`, so it stops at the first provider whose configured model is missing or whose API key is unset; run the per-provider script to check just one.



### Listing the available models

Use the related `list-models` command to see every model a provider advertises. It prints a table of model id, input/output pricing (USD per 1M tokens, if available), and description.

```bash
ai-i18n-tools list-models -P anthropic
```

### Benchmarking the configured models

Use the related `bench-models` command to measure the performance of the configured models. It prints a table of model id, input/output tokens, wall-clock time, and USD cost (when available).

```bash
ai-i18n-tools bench-models -P anthropic
```

### Checking the markdown source for issues

Check the markdown source for issues (no API key required):

```bash
ai-i18n-tools check-markdown
```

### Clearing the cache and generated outputs

Clear the cache and generated outputs (the `clean` script):

```bash
pnpm clean
```

## Project structure

```text
examples/multi-provider/
├── README.md
├── ai-i18n-tools.config.json   # pt-BR source → en-GB, hi-Latn, zh-Hans; openai/anthropic/nvidia/deepseek providers
├── markdown-example.md         # Portuguese source
├── package.json                # build + per-provider translate / check-models scripts
├── .gitignore                  # ignores .translation-cache/ and translated-docs/
├── .translation-cache/         # generated (gitignored)
└── translated-docs/            # generated (gitignored)
    └── markdown-example.{locale}.md
```

This directory installs `ai-i18n-tools` from npm (`^1.7.2`). Run commands through the `pnpm run …` scripts or invoke `ai-i18n-tools` directly after `pnpm install`.