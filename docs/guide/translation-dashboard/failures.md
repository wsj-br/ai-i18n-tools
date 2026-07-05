<a id="failures-document-translation"></a>
# Failures (document translation)

The **Failures** tab is for **documentation** translation only. It reads failure records written to SQLite when a segment could not be translated successfully for a locale — for example empty or invalid model output, post-translation validation errors (`AST mismatch`, placeholder leaks, and similar **quality** checks), or a **fatal** condition that blocked progress.

It helps you answer: *which source segment broke, for which locale and model, and what error text was recorded?*

<a id="when-to-use-it"></a>
## When to use it

- After `translate-docs` or `sync` finishes with errors, partial locales, or confusing logs — sort and filter failures instead of scrolling terminal output alone.
- When you want to **prioritise rework**: sort by **# Failures** so segments that failed repeatedly across retries appear first; those are strong candidates to **simplify or reformat** in the source markdown.
- When you need the **exact segment** — filepath, line hint, source hash, and full source text — to edit the right paragraph in your repo.

<a id="why-source-edits-matter"></a>
## Why source edits matter

Dense inline markup (**bold** mixed with `` `code` ``, nested emphasis, long sentences with many spans) makes it harder for models to return translations that still pass structural checks. Segments with **multiple recorded failures** usually improve more from **rewriting or splitting** the source (or moving examples into fenced code blocks) than from re-running translation on unchanged text. That aligns with [Complex Markdown and failed quality checks](/guide/documents/#complex-markdown-and-failed-quality-checks).

<a id="how-to-use-the-tab"></a>
## How to use the tab

1. Open **Failures** in the dashboard.
2. Read the **summary** strip — segments with any failure, plus counts for segments with **1**, **2**, or **3+** failure records.
3. Filter by partial **filename**, **locale**, **model**, **quality error** (values come from your cache), **fatal only**, and optional **source hash**, **source text**, or **error message** substring — then click **Apply**.
4. Choose **Sort: # Failures** (default) or **Sort: filepath + line #**.
5. Use pagination at the top or bottom of the table. **Click a row** to expand full source text. The **Model** column shows the failure model and, when available, the model from a later successful cache entry.
6. The 🔗 link control logs file/line hints to the **terminal** where `ai-i18n-tools dashboard` is running.
7. Fix the **source file** in your project, then run `translate-docs` or `sync` again. If the list looks **out of date** after a successful run, run `ai-i18n-tools sync --force-update` and reload the dashboard.

For file-based debugging alongside the UI, use `translate-docs --debug-failed` to write `FAILED-TRANSLATION` detail under `cacheDir` during retries — see [Cache behaviour and `translate-docs` flags](/guide/documents/cli-options#cache-behaviour-and-translate-docs-flags).

<a id="failures-vs-markdown-issues"></a>
## Failures vs Markdown issues

| | **Failures** | **Markdown issues** |
| --- | --- | --- |
| When recorded | During translation (per locale) | Before translation (source scan) |
| Typical cause | Bad model output, validation errors | Unpaired emphasis, unclosed code spans, bold outside links |
| Fix | Edit source and re-translate | Fix source markdown, then re-translate |

See [Markdown issues](/guide/translation-dashboard/markdown-issues) for pre-translation static checks.
