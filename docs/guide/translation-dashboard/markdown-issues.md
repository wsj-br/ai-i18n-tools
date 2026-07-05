<a id="markdown-issues-static-checks"></a>
# Markdown issues (static checks)

The **Markdown issues** tab lists rows from the `markdown_source_issues` SQLite table. Each row is a **pre-translation** finding: for example delimiter runs that never pair as emphasis/strikethrough under the same CommonMark-style rules `translate-docs` uses for masking, an inline code span opened with backticks but never closed, or `STRONG_OUTSIDE_LINK` when `**` / `__` wrap a `[text](url)` link (put bold inside the link text only).

This is **not** the same as **Failures**, which records per-locale model output and post-translation validation problems (`AST mismatch`, placeholder leaks, and similar).

<a id="when-to-use-it"></a>
## When to use it

Use this tab when you want to fix **source markdown** before spending tokens — especially when quality checks keep failing on structure in the [Failures](/guide/translation-dashboard/failures) tab.

<a id="how-to-use-the-tab"></a>
## How to use the tab

1. Read the **summary** strip — total issue rows and counts per issue code.
2. Filter by filepath (partial match against the cache key, including `doc-block:{index}:` prefixes), **issue code**, or **source hash**.
3. Sort by **filepath + line** (default) or by **newest scan time**.
4. The 🔗 link button logs file/line hints to the terminal where `ai-i18n-tools dashboard` is running.

Fix the source file, then re-run translation.

<a id="refreshing-rows"></a>
## Refreshing rows

| Command / event | Effect |
| --- | --- |
| `ai-i18n-tools check-markdown` | Rescan configured docs; optional `-p` / `--path` scope, `--no-cache`, `--json` |
| `translate-docs` (default) | Rescans and replaces rows for each markdown file when `docs[].warnMarkdownSourceIssues` is not `false` |
| Delete all translations for a filepath | Removes markdown issue rows for that filepath (same cleanup as failures) |
| `cleanup` | Clears the entire `markdown_source_issues` table, then runs `sync --force-update` to repopulate rows |

<a id="common-issue-codes"></a>
## Common issue codes

| Code | Meaning |
| --- | --- |
| Unpaired emphasis / strikethrough | Delimiter runs that never close under CommonMark rules |
| Unclosed inline code | Backtick span opened but not closed |
| `STRONG_OUTSIDE_LINK` | Bold markers wrap a markdown link — move bold inside the link text |

See also [Complex Markdown and failed quality checks](/guide/documents/#complex-markdown-and-failed-quality-checks).
