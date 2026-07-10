<a id="cli--documents"></a>
# CLI — Documents

<a id="translate-docs"></a>
### `translate-docs`

**Synopsis:** `ai-i18n-tools translate-docs [options]`

Translate markdown, MDX, `.astro`, optional Docusaurus catalog JSON (`docusaurusCatalogDir`), optional Nextra `_meta.ts`/dictionary `.ts`, and optional VitePress theme catalog for each `docs` block.

**Key options:** `-l`, `-j`, `-b`, `--prompt-format`, `--force`, `--force-update`, `-p` / `-f`, `--dry-run`

`-j`: max parallel locales; `-b`: max parallel batch API calls per file. `--prompt-format`: batch wire format (`xml` | `json-array` | `json-object`).

**See also:** [Cache behaviour and `translate-docs` flags](/guide/documents/cli-options#cache-behaviour-and-translate-docs-flags), [Batch prompt format](/guide/documents/cli-options#batch-prompt-format)

---

<a id="write-heading-ids"></a>
### `write-heading-ids`

**Synopsis:** `ai-i18n-tools write-heading-ids [options]`

Requires at least one `docs[]` block. Collects `.md` / `.mdx` under each block's `contentPaths` (honours `.translate-ignore`). Inserts an HTML anchor line `<a id="slug"></a>` immediately before each flat ATX `#` heading (skips headings inside fenced code blocks); when an anchor line is already present, updates the `id` if it no longer matches the slug derived from the current heading text.

**Key options:** `-p` / `--path`, `-f` / `--file`, `--slug-style`, `--dry-run`

`--slug-style`: `github` (default; doctoc / anchor-markdown-header), `bitbucket`, `gitlab`, `pymdown`, `azure-devops`. With `pymdown`, optional `--pymdown-case`, `--pymdown-normalize`, `--pymdown-percent-encode` / `--no-pymdown-percent-encode`.

**See also:** [Anchor links](/guide/documents/anchor-links)

---

<a id="check-markdown"></a>
### `check-markdown`

**Synopsis:** `ai-i18n-tools check-markdown [options]`

Scans markdown/MDX under each `docs[]` block's `contentPaths` (same discovery as `translate-docs`, honours `.translate-ignore`): delimiter pairing, unclosed inline code, and `STRONG_OUTSIDE_LINK` when `**`/`__` wrap a `[text](url)` link.

Prints `relativePath:line: [ISSUE_CODE] message` lines to stderr; exit code **1** if any issue. `--json`: JSON report on stdout. Writes `markdown_source_issues` in `cacheDir` unless `--no-cache`. `-v` adds source hashes to stderr lines.

**Key options:** `-p` / `--path`, `-f` / `--file`, `--json`, `--no-cache`

**See also:** [Markdown issues](/guide/translation-dashboard/markdown-issues)
