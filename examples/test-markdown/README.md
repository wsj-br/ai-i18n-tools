# Markdown translation test fixture

Minimal example for exercising the document translation pipeline (`translate-docs`) on markdown and MDX that is hard to translate correctly — CJK scripts, non–Latin writing systems, and placeholder-heavy Docusaurus constructs. There is no UI string extraction step — only `features.translateDocs` is enabled.

Two configs cover complementary regression cases:

| Workflow                                  | Source locale | Config                                                                 | Source file(s)                                                                                                      |
|-------------------------------------------|---------------|------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------|
| Portuguese + MDX / placeholders → targets | `pt-BR`       | [`ai-i18n-tools.config.json`](./ai-i18n-tools.config.json)             | [`test-markdown-pt-BR.md`](./test-markdown-pt-BR.md), [`test-markdown-stress-test.md`](./test-markdown-stress-test.md) |
| English → targets                         | `en-GB`       | [`ai-i18n-tools.config-en-GB.json`](./ai-i18n-tools.config-en-GB.json) | [`test-markdown-en-GB.md`](./test-markdown-en-GB.md)                                                                  |

[`ai-i18n-tools.config.json`](./ai-i18n-tools.config.json) translates both Portuguese markdown edge cases and the MDX placeholder stress test in one run. Use [`ai-i18n-tools.config-en-GB.json`](./ai-i18n-tools.config-en-GB.json) for the common `en-GB` → CJK / Devanagari direction.

## What this tests

Each source document targets different failure modes:

| Section                             | Source file(s)               | Challenge                                                                                                                                                   |
|-------------------------------------|------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Rephrase / word-alternative UI copy | test-markdown-pt-BR.md       | Long sentences with nested emphasis, product terms (`Rephrase…` / `Reformular…`, `Esc`), and counts that must stay coherent in CJK line breaking            |
| Text formatting                     | test-markdown-pt-BR.md       | Bold, italic, strikethrough, links, and `` `inline code` `` must survive translation without broken delimiter pairing                                       |
| Code inside formatting              | test-markdown-pt-BR.md       | `` **`code`** ``, `` *_`code`_* ``, `` **~~`code`~~** ``, and link-wrapped code — identifiers must remain untranslated while surrounding prose is localized |
| Long mixed paragraph                | test-markdown-pt-BR.md       | Dense mix of emphasis + code spans (`async/await`, `` `importantFlag` ``, `` `./src/main.ts` ``) in one block                                               |
| Tables                              | test-markdown-pt-BR.md       | Per-cell translation while preserving column alignment and pipe syntax                                                                                      |
| Regular prose                       | test-markdown-pt-BR.md       | Straight narrative paragraphs as a baseline for fluency                                                                                                     |
| Admonitions                         | test-markdown-stress-test.md | `:::note`, bracketed titles, nested admonitions, and GitHub-style alerts — ADM placeholders must stay intact                                                |
| HTML comments and anchors           | test-markdown-stress-test.md | HTM and ANC placeholders for comments, `<a id="…">`, and doctoc-style anchor lines                                                                          |
| Heading IDs                         | test-markdown-stress-test.md | Explicit `{#id}`, MDX `{/* #id */}`, and HTML-comment id forms — HDG extraction and round-trip                                                               |
| MDX JSX and tabs                    | test-markdown-stress-test.md | Imports, components, `<Tabs>` / `<TabItem>`, brace expressions, and capitalized JSX tags                                                                   |
| URLs and images                     | test-markdown-stress-test.md | External and same-site link destinations, image paths — URL placeholders must not leak into translated prose                                                |
| Fenced code blocks                  | test-markdown-stress-test.md | Code inside fences must be skipped as non-translatable segments                                                                                             |

Running `translate-docs` writes outputs under [`translated-docs/`](./translated-docs/) (gitignored). Re-run translation after changing a source file or pipeline behaviour to refresh local results.

## Target locales

### Portuguese + MDX (`ai-i18n-tools.config.json`)

| Code      | Script / language          |
|-----------|----------------------------|
| `en-GB`   | English (UK)               |
| `ja`      | Japanese (CJK)             |
| `ko`      | Korean (CJK)               |
| `zh-Hans` | Chinese (Simplified) (CJK) |
| `hi`      | Hindi (Devanagari)         |

Outputs:

- `translated-docs/test-markdown-pt-BR.{locale}.md`
- `translated-docs/test-markdown-stress-test.{locale}.md`

For a quick placeholder check on the stress-test file only:

```bash
ai-i18n-tools translate-docs -c ai-i18n-tools.config.json --path test-markdown-stress-test.md --locale en-GB
```

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

- Node.js >= 22.16.0
- [pnpm](https://pnpm.io/)
- An [OpenRouter](https://openrouter.ai) API key (for generating translations)

## Installation

### Try this example on its own

Copy only this example folder and install `ai-i18n-tools` from npm:

```bash
npx degit wsj-br/ai-i18n-tools/examples/test-markdown test-markdown
cd test-markdown
pnpm install
```

### From the full ai-i18n-tools repository

Use this when you cloned the **whole** [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools) repository (not just this folder with degit). Run `pnpm install` from the repository root; the workspace [`overrides`](../../pnpm-workspace.yaml) entry links `ai-i18n-tools` to your local checkout automatically.

The scripts in [`package.json`](./package.json) call the installed `ai-i18n-tools` CLI directly.

## Usage

Run commands from this directory (after degit + `pnpm install`, or `cd examples/test-markdown` in the monorepo) so paths in the config resolve correctly:

The simplest path is the `build` script, which clears the cache and translates both configs:

```bash
pnpm build
```

For finer control, call the installed CLI directly with `ai-i18n-tools …`.

Check markdown sources for issues (no API key). Pass `-c` to select which config to scan:

```bash
ai-i18n-tools check-markdown -c ai-i18n-tools.config.json
ai-i18n-tools check-markdown -c ai-i18n-tools.config-en-GB.json
```

### Portuguese + MDX workflow

Translate both source files into all configured locales:

```bash
ai-i18n-tools translate-docs -c ai-i18n-tools.config.json
```

Single locale:

```bash
ai-i18n-tools translate-docs -c ai-i18n-tools.config.json --locale ja
```

Single source file:

```bash
ai-i18n-tools translate-docs -c ai-i18n-tools.config.json --path test-markdown-pt-BR.md
ai-i18n-tools translate-docs -c ai-i18n-tools.config.json --path test-markdown-stress-test.md --locale en-GB
```

### English source workflow

Translate into all configured locales:

```bash
ai-i18n-tools translate-docs -c ai-i18n-tools.config-en-GB.json
```

Single locale:

```bash
ai-i18n-tools translate-docs -c ai-i18n-tools.config-en-GB.json --locale ja
```

### Other options

Force a re-translation of all files (either config):

```bash
ai-i18n-tools translate-docs -c ai-i18n-tools.config.json --force
```

Clear the SQLite cache and re-translate both configs. Both share `.translation-cache/` and `translated-docs/` (both are gitignored) — this is exactly what the `build` script runs:

```bash
pnpm build
```


## Project structure

```text
examples/test-markdown/
├── README.md
├── ai-i18n-tools.config.json             # pt-BR: test-markdown-pt-BR.md + test-markdown-stress-test.md
├── ai-i18n-tools.config-en-GB.json       # en-GB: test-markdown-en-GB.md
├── test-markdown-pt-BR.md                # Portuguese source
├── test-markdown-en-GB.md                # English source
├── test-markdown-stress-test.md          # MDX / placeholder-handling source
├── .gitignore                            # ignores .translation-cache/ and translated-docs/
├── .translation-cache/                   # generated (gitignored)
└── translated-docs/                      # generated (gitignored)
    ├── test-markdown-pt-BR.{locale}.md
    ├── test-markdown-stress-test.{locale}.md
    └── test-markdown-en-GB.{locale}.md
```

This directory installs `ai-i18n-tools` from npm (`^1.7.2`). Run the full flow with `pnpm build`, or invoke `ai-i18n-tools` directly after `pnpm install`.
