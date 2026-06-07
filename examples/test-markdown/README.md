# Markdown translation test fixture

Minimal example for exercising the document translation pipeline (`translate-docs`) on markdown that is hard to translate correctly into CJK scripts and other non–Latin writing systems. There is no UI string extraction step — only `features.translateDocs` is enabled.

Two parallel workflows exercise the same document content from different source locales:

| Workflow             | Source locale | Config                                                           | Source file                                          |
|----------------------|---------------|------------------------------------------------------------------|------------------------------------------------------|
| Portuguese → targets | `pt-BR`       | [`ai-i18n-tools.config.json`](./ai-i18n-tools.config.json)       | [`test-markdown.md`](./test-markdown.md)             |
| English → targets    | `en-GB`       | [`ai-i18n-tools.config-en.json`](./ai-i18n-tools.config-en.json) | [`test-markdown-en-GB.md`](./test-markdown-en-GB.md) |

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

### Portuguese source (`ai-i18n-tools.config.json`)

| Code    | Script / language        |
|---------|--------------------------|
| `en-GB` | English (UK)             |
| `ja`    | Japanese (CJK)           |
| `ko`    | Korean (CJK)             |
| `zh-CN` | Simplified Chinese (CJK) |
| `hi`    | Hindi (Devanagari)       |

Outputs: `translated-docs/test-markdown.{locale}.md`

### English source (`ai-i18n-tools.config-en.json`)

| Code    | Script / language        |
|---------|--------------------------|
| `pt-BR` | Portuguese (Brazil)      |
| `ja`    | Japanese (CJK)           |
| `ko`    | Korean (CJK)             |
| `zh-CN` | Simplified Chinese (CJK) |
| `hi`    | Hindi (Devanagari)       |

Outputs: `translated-docs/test-markdown-en-GB.{locale}.md`

## Requirements

Build the library once from the repository root (if you have not already):

```bash
pnpm install
pnpm run build
```

## Usage

Run commands from this directory so paths in the config resolve correctly:

```bash
cd examples/test-markdown
```

The examples below use `npx ai-i18n-tools …` after installing and building from the repository root. If `node_modules/.bin` is on your `PATH` (or you use direnv), you can run the same commands with bare `ai-i18n-tools` instead — see [Using the CLI](../../README.md#using-the-cli) in the package README and [Installation](../../docs/GETTING_STARTED.md#installation) in Getting Started.

Check markdown sources for issues (no API key). Pass `-c` to select which workflow to scan:

```bash
npx ai-i18n-tools check-markdown -c ai-i18n-tools.config.json
npx ai-i18n-tools check-markdown -c ai-i18n-tools.config-en.json
```

### Portuguese source workflow

Translate into all configured locales:

```bash
npx ai-i18n-tools translate-docs -c ai-i18n-tools.config.json
```

Single locale:

```bash
npx ai-i18n-tools translate-docs -c ai-i18n-tools.config.json --locale ja
```

### English source workflow

Translate into all configured locales:

```bash
npx ai-i18n-tools translate-docs -c ai-i18n-tools.config-en.json
```

Single locale:

```bash
npx ai-i18n-tools translate-docs -c ai-i18n-tools.config-en.json --locale ja
```

### Other options

Force a re-translation of all files (either config):

```bash
npx ai-i18n-tools translate-docs -c ai-i18n-tools.config.json --force
```

Clear the SQLite cache and re-translate. Both workflows share `.translation-cache/` and `translated-docs/` (both are gitignored):

```bash
rm -rf .translation-cache translated-docs/
npx ai-i18n-tools translate-docs -c ai-i18n-tools.config.json
npx ai-i18n-tools translate-docs -c ai-i18n-tools.config-en.json
```


## Project structure

```text
examples/test-markdown/
├── README.md
├── ai-i18n-tools.config.json       # pt-BR source → en-GB, hi, ja, ko, zh-CN
├── ai-i18n-tools.config-en.json    # en-GB source → pt-BR, hi, ja, ko, zh-CN
├── test-markdown.md                # Portuguese source
├── test-markdown-en-GB.md          # English source
├── .gitignore                      # ignores .translation-cache/ and translated-docs/
├── .translation-cache/             # generated (gitignored)
└── translated-docs/                # generated (gitignored)
    ├── test-markdown.{locale}.md
    └── test-markdown-en-GB.{locale}.md
```

This directory is not a pnpm workspace package; invoke the CLI via `npx ai-i18n-tools`, bare `ai-i18n-tools` when your shell `PATH` is set up as in the package docs, or `node ../../dist/cli/index.js` from this directory.

