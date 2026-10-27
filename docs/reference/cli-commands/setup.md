<a id="cli--getting-started"></a>
# CLI — Getting started

<a id="version"></a>
### `version`

**Synopsis:** `ai-i18n-tools version`

Print CLI version and build timestamp (same information as `-V` / `--version` on the root program).

---

<a id="init"></a>
### `init`

**Synopsis:** `ai-i18n-tools init -P <provider> [-t <template>] [-o <path>] [--with-readme] [--with-translate-ignore]`

Write a starter config file (includes `provider` / `providers`, `concurrency`, `uiBatchConcurrency`, `batchConcurrency`, `batchSize`, `maxBatchChars`, and `docs[].addFrontmatter`). Translation commands that call an LLM require the active provider's API key in the environment or `.env` (Ollama excepted) — see [Provider and API key](/guide/quick-start#provider-and-api-key).

**Key options:** `-P` / `--provider` (required), `-t` / `--template`, `-o` / `--output`, `--with-readme`, `--with-translate-ignore`

`-P` / `--provider` is required. It selects which **built-in preset** to scaffold. Must be one of: `openrouter`, `openai`, `anthropic`, `gemini`, `deepseek`, `cerebras`, `groq`, `mistral`, `xai`, `nvidia`, `alibaba`, `apifun`, `cheaperinference`, `ollama`.

**Templates (`-t`):**

| Value | Scaffolds |
|-------|-----------|
| `ui-markdown` | UI strings plus README (flat output, language list) |
| `ui-docusaurus` | Docusaurus UI + docs |
| `ui-starlight` | Starlight docs |
| `ui-vitepress` | VitePress docs (`docsOutput.style: "vitepress"`) plus `vitepressThemeCatalog` for theme strings |
| `ui-nextra` | Nextra docs (`docsOutput.style: "nextra"`) plus `nextraDictionaryPath` for the theme dictionary (sidebar `_meta.ts` is collected automatically) |
| `ui-fumadocs` | Fumadocs docs (`docsOutput.style: "fumadocs"`) plus `fumadocsUiCatalog` for UI overrides (sidebar `meta.json` is collected automatically) |
| `ui-astro-website` | Astro website UI strings |
| `ui-plain-html` | Plain HTML catalog (`data-i18n*` markers, flat locale JSON) |
| `docs-plain-html` | Plain HTML documents (one file per locale, language list, hreflang) |
| `docs-markdown` | Markdown docs: README and `.md` files, flat output, language list |
| `ui-json-bundles` | JSON (`json[]` only) |
| `ui-python` | Python UI strings, flat JSON keyed by the source-language string, and `i18n.py` |
| `ui-python-gettext` | Python UI strings with flat JSON and GNU `.po` / `.mo`, plus `i18n.py` |
| `ui-python-django` | Django `gettext` / `{% blocktrans %}` catalogs (`flatOutput: false`, domain `django`, no `i18n.py`) |
| `ui-python-flask` | Flask / Jinja catalogs under `translations/` (`flatOutput: false`) plus `i18n.py` |

`--with-readme` appends a `README.md` docs block (`outputDir` `translated-docs`, `docsOutput.style` `"flat"`, a `languageListBlock`) and sets `features.translateDocs` to true. It does nothing when a docs block already lists `README.md`, which is the case for `ui-markdown` and `docs-markdown`. It writes the config only. It prints the marker line to paste into `README.md` and warns when that file is missing. Guide: [Add i18n to your README and Markdown docs](/guide/add-i18n-to-readme).

```bash
ai-i18n-tools init -t docs-markdown -P openrouter
ai-i18n-tools init -t ui-python -P openrouter --with-readme
```

`--with-translate-ignore` creates a starter `.translate-ignore` (including Python virtualenv and cache directories).

`ui-python`, `ui-python-gettext`, and `ui-python-flask` also write `i18n.py` when that file is missing. Django projects keep Django's own gettext runtime, so `ui-python-django` does not write `i18n.py`.

`migrate-python-i18n` rewrites unsafe pre-evaluated calls (`_(f"...")`, `_("..." % expr)`, `_("...".format(...))`) into lookup-before-format calls. The default is a dry run. Pass `--write` to edit files, and read `migrate-python-i18n-report.md` for review notes. Generated `i18n.py` files are skipped.

---

<a id="help"></a>
### `help`

**Synopsis:** `ai-i18n-tools help [command]`

Display help for a subcommand (same output as `ai-i18n-tools <command> --help`).
