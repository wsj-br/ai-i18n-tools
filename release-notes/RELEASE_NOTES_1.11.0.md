# ai-i18n-tools 1.11.0 Release Notes

## Highlights

- **Translate Python apps:** Extract `t`, `translate`, `_`, `gettext`, `ngettext`, `pgettext`, and `self.tr` from Python, plus Jinja `{% trans %}`, Django `{% blocktrans %}`, Qt `.ui` strings, and `pyproject.toml` descriptions. Placeholder checks cover `{name}`, format specs, `%s`, `%(name)s`, and `%{name}`. `migrate-python-i18n` rewrites unsafe f-string, `%`, and `.format()` calls (dry run by default; `--write` applies). `ui[].gettext` writes `.pot`, `.po`, and GNU `.mo` catalogs from extract, translate, and purge. New init templates (`ui-python`, `ui-python-gettext`, `ui-python-django`, `ui-python-flask`) and examples (Streamlit, Flask, FastAPI, and a stdlib gettext CLI) show the workflow. Releases also attach `ai-i18n-tools-python-examples.zip`.
- **Fill Intlayer dictionaries in place:** `translate-intlayer` translates missing and stale leaves in `*.content.ts` files and writes them back into each `t({ … })` object, including `insert("…")` nodes. Formatting stays intact, `{token}` placeholders round-trip, and staleness is tracked per leaf and locale. `--dry-run` reports counts without calling a model. A guide and the `intlayer-translate` example sit beside the existing migrate-off path.
- **Install a standalone executable:** `pnpm build:binary` builds an unsigned single executable for the current platform. GitHub Releases publish Linux x64/arm64, macOS arm64/x64, and Windows x64 builds plus `SHA256SUMS.txt`. `install.sh` and `install.ps1` download the binary for the host OS, verify the checksum, install the `ai-i18n-tools` command, and add it to `PATH`.
- **Rank models, then see what they cost:** `suggest-models` ranks the active provider's chat models from languagebench ChrF, Arena Score, and models.dev prices (`--quality`, `--price`, `--top`, `--list`, `--json`, `--apply`). `--max-output-price` and `--min-delta` narrow the list. The dashboard Models tab shows the same columns, reorders rows, and can update `translationModels` or copy the JSON. Applying a list copies the config to a timestamped backup first. When a provider omits `usage.cost` and config has no rate, Usage & costs uses models.dev input and output prices.
- **Cheaper Inference is a built-in provider:** The `cheaperinference` preset records billed `usage.cost` and shows catalog rates on `list-models` and `check-models`. `zeroDataRetention` sends `zdr: true` and loads the zero-data-retention model list; a refusal names the model and the fallback chain continues.
- **Keep fenced samples inside their containers:** Fenced code inside Docusaurus, VitePress, Pandoc, MyST, and MkDocs admonitions stays in the container. A fence-only body is copied through; a title or other prose still goes to the model, with each fence masked. Nested fences follow CommonMark closer length, so a sample inside a longer fence stays one block for extraction, `check-markdown`, and heading ids. A line that is only markdown links is translated. Documented emphasis tokens such as `{{SE}}` survive CJK and RTL masking.
- **Init names the provider up front:** `init` requires `-P` / `--provider` and lists the built-in presets when it is omitted. The new `docs-markdown` template covers repositories that only translate README and Markdown files, and `--with-readme` adds a README docs block to any template. UI templates that only translate strings set `translateJson` to false, and the Fumadocs template scaffolds `pt-BR` and `zh-Hans`.
- **Patched transitive dependencies:** Overrides move `katex`, `launch-editor`, `postcss-selector-parser`, and `tinypool` onto patched releases, and force `http-cache-semantics` to `4.3.0` with the max-stale patch retargeted.

## Why this release matters

Version 1.11.0 brings Python and GNU gettext into the same extract-and-translate workflow as JavaScript, lets Intlayer projects fill locales without leaving Intlayer, and publishes a checksum-verified standalone executable. Model ranking and models.dev prices make it easier to choose a fallback chain and see what a run costs.

---

For the full list of changes, see [`dev/CHANGELOG.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/CHANGELOG.md) (`## [1.11.0] - 2026-10-27`).

---

## Documentation

- [Documentation](https://wsj-br.github.io/ai-i18n-tools/) — guides, integrations, and reference
- [AI Agent Context](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — integration guide for assistants in consumer repositories

---

## License

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br/ai-i18n-tools)
