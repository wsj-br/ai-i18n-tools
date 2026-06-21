# Markdown translation test fixture

Minimal example for exercising the document translation pipeline (`translate-docs`) on markdown that is hard to translate correctly into CJK scripts and other non–Latin writing systems. There is no UI string extraction step — only `features.translateDocs` is enabled.

Two parallel workflows exercise the same document content from different source locales:

| Workflow             | Source locale | Config                                                           | Source file                                          |
|----------------------|---------------|------------------------------------------------------------------|------------------------------------------------------|
| Portuguese → targets | `pt-BR`       | [`ai-i18n-tools.config-pt-BR.json`](./ai-i18n-tools.config-pt-BR.json) | [`test-markdown-pt-BR.md`](./test-markdown-pt-BR.md) |
| English → targets    | `en-GB`       | [`ai-i18n-tools.config-en-GB.json`](./ai-i18n-tools.config-en-GB.json) | [`test-markdown-en-GB.md`](./test-markdown-en-GB.md) |

Both files cover the same sections and formatting edge cases; only the prose language differs. Use the Portuguese workflow to test non–English source locales (for example translating into `en-GB`), and the English workflow for the more common `en-GB` → CJK / Devanagari direction.

## What this tests

Each source document is written to stress common failure modes when translating into Japanese, Korean, Simplified Chinese, Hindi, and other locales that use different scripts, punctuation, and word boundaries than Latin scripts:

| Section                             | Challenge                                                                                                                                                   |
|-------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Rephrase / word-alternative UI copy | Long sentences with nested emphasis, product terms (`Rephrase…` / `Reformular…`, `Esc`), and counts that must stay coherent in CJK line breaking            |
| Text formatting                     | Bold, italic, strikethrough, links, and `` `inline code` `` must survive translation without broken delimiter pairing                                       |
| Code inside formatting              | `` **`code`** ``, `` *_`code`_* ``, `` **~~`code`~~** ``, and link-wrapped code — identifiers must remain untranslated while surrounding prose is localized |
| Long mixed paragraph                | Dense mix of emphasis + code spans (`async/await`, `` `importantFlag` ``, `` `./src/main.ts` ``) in one block                                               |
| Tables                              | Per-cell translation while preserving column alignment and pipe syntax                                                                                      |
| Regular prose                       | Straight narrative paragraphs as a baseline for fluency                                                                                                     |

Running `translate-docs` writes outputs under [`translated-docs/`](./translated-docs/) (gitignored). Re-run translation after changing a source file or pipeline behaviour to refresh local results.

## Target locales

### Portuguese source (`ai-i18n-tools.config-pt-BR.json`)

| Code      | Script / language          |
|-----------|----------------------------|
| `en-GB`   | English (UK)               |
| `ja`      | Japanese (CJK)             |
| `ko`      | Korean (CJK)               |
| `zh-Hans` | Chinese (Simplified) (CJK) |
| `hi`      | Hindi (Devanagari)         |

Outputs: `translated-docs/test-markdown-pt-BR.{locale}.md`

### English source (`ai-i18n-tools.config-en-GB.json`)

| Code      | Script / language          |
|-----------|----------------------------|
| `pt-BR`   | Portuguese (Brazil)        |
| `ja`      | Japanese (CJK)             |
| `ko`      | Korean (CJK)               |
| `zh-Hans` | Chinese (Simplified) (CJK) |
| `hi`      | Hindi (Devanagari)         |

Outputs: `translated-docs/test-markdown-en-GB.{locale}.md`

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
cd examples/test-markdown
```

The simplest path is the `build` script, which clears the cache and translates both workflows (`pt-BR` and `en-GB` sources) using the local build of the library:

```bash
pnpm build
```

For finer control, call the CLI directly through the repo's bin with `node ../../bin/ai-i18n-tools.mjs …`. (If you have `ai-i18n-tools` installed globally or on your `PATH`, you can substitute the bare `ai-i18n-tools` command — see [Using the CLI](../../README.md#using-the-cli) in the package README and [Installation](../../docs/GETTING_STARTED.md#installation) in Getting Started.)

Check markdown sources for issues (no API key). Pass `-c` to select which workflow to scan:

```bash
node ../../bin/ai-i18n-tools.mjs check-markdown -c ai-i18n-tools.config-pt-BR.json
node ../../bin/ai-i18n-tools.mjs check-markdown -c ai-i18n-tools.config-en-GB.json
```

### Portuguese source workflow

Translate into all configured locales:

```bash
node ../../bin/ai-i18n-tools.mjs translate-docs -c ai-i18n-tools.config-pt-BR.json
```

Single locale:

```bash
node ../../bin/ai-i18n-tools.mjs translate-docs -c ai-i18n-tools.config-pt-BR.json --locale ja
```

### English source workflow

Translate into all configured locales:

```bash
node ../../bin/ai-i18n-tools.mjs translate-docs -c ai-i18n-tools.config-en-GB.json
```

Single locale:

```bash
node ../../bin/ai-i18n-tools.mjs translate-docs -c ai-i18n-tools.config-en-GB.json --locale ja
```

### Other options

Force a re-translation of all files (either config):

```bash
node ../../bin/ai-i18n-tools.mjs translate-docs -c ai-i18n-tools.config-pt-BR.json --force
```

Clear the SQLite cache and re-translate both workflows. Both share `.translation-cache/` and `translated-docs/` (both are gitignored) — this is exactly what the `build` script runs:

```bash
pnpm build
```


## Project structure

```text
examples/test-markdown/
├── README.md
├── ai-i18n-tools.config-pt-BR.json   # pt-BR source → en-GB, hi, ja, ko, zh-Hans
├── ai-i18n-tools.config-en-GB.json   # en-GB source → pt-BR, hi, ja, ko, zh-Hans
├── test-markdown-pt-BR.md            # Portuguese source
├── test-markdown-en-GB.md            # English source
├── .gitignore                        # ignores .translation-cache/ and translated-docs/
├── .translation-cache/               # generated (gitignored)
└── translated-docs/                  # generated (gitignored)
    ├── test-markdown-pt-BR.{locale}.md
    └── test-markdown-en-GB.{locale}.md
```

This directory is not a pnpm workspace package and installs no dependencies — there is no `node_modules` here. Its scripts call the CLI directly through the repo's bin (`node ../../bin/ai-i18n-tools.mjs …`), which only needs the library built once from the repository root (`pnpm run build`). Run the full flow with `pnpm build`, or invoke the CLI directly with `node ../../bin/ai-i18n-tools.mjs …`.

