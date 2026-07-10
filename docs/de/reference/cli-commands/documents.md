<a id="cli--documents"></a>
# CLI – Dokumente

<a id="translate-docs"></a>
### `translate-docs`

**Synopsis:** `ai-i18n-tools translate-docs [options]`

Übersetzt Markdown, MDX, `.astro`, optionalen Docusaurus-Katalog-JSON (`docusaurusCatalogDir`), optionales Nextra `_meta.ts`/Wörterbuch `.ts` und optionalen VitePress-Themenkatalog für jeden `docs`-Block.

**Schlüsseloptionen:** `-l`, `-j`, `-b`, `--prompt-format`, `--force`, `--force-update`, `-p` / `-f`, `--dry-run`

`-j`: maximale parallele Lokalisierungen; `-b`: maximale parallele Batch-API-Aufrufe pro Datei. `--prompt-format`: Batch-Wire-Format (`xml` | `json-array` | `json-object`).

**Siehe auch:** [Cache-Verhalten und `translate-docs`-Flags](/de/guide/documents/cli-options#cache-behaviour-and-translate-docs-flags), [Batch-Prompt-Format](/de/guide/documents/cli-options#batch-prompt-format)

---

<a id="write-heading-ids"></a>
### `write-heading-ids`

**Synopsis:** `ai-i18n-tools write-heading-ids [options]`

Erfordert mindestens einen `docs[]`-Block. Sammelt `.md` / `.mdx` unter dem `contentPaths` jedes Blocks (berücksichtigt `.translate-ignore`). Fügt eine HTML-Ankerzeile `<a id="slug"></a>` unmittelbar vor jeder flachen ATX `#`-Überschrift ein (überspringt Überschriften innerhalb von Codeblöcken); wenn bereits eine Ankerzeile vorhanden ist, aktualisiert sie den `id`, falls er nicht mehr mit dem aus dem aktuellen Überschriftentext abgeleiteten Slug übereinstimmt.

**Schlüsseloptionen:** `-p` / `--path`, `-f` / `--file`, `--slug-style`, `--dry-run`

`--slug-style`: `github` (Standard; doctoc / anchor-markdown-header), `bitbucket`, `gitlab`, `pymdown`, `azure-devops`. Mit `pymdown`, optional `--pymdown-case`, `--pymdown-normalize`, `--pymdown-percent-encode` / `--no-pymdown-percent-encode`.

**Siehe auch:** [Anker-Links](/de/guide/documents/anchor-links)

---

<a id="check-markdown"></a>
### `check-markdown`

**Synopsis:** `ai-i18n-tools check-markdown [options]`

Scannt Markdown/MDX unter dem `docs[]` jedes Blocks `contentPaths` (gleiche Erkennung wie `translate-docs`, berücksichtigt `.translate-ignore`): Begrenzerpaare, nicht geschlossener Inline-Code und `STRONG_OUTSIDE_LINK`, wenn `**`/`__` einen `[text](url)`-Link umschließen.

Gibt `relativePath:line: [ISSUE_CODE] message`-Zeilen an stderr aus; Exit-Code **1**, wenn ein Problem auftritt. `--json`: JSON-Bericht auf stdout. Schreibt `markdown_source_issues` in `cacheDir`, es sei denn `--no-cache`. `-v` fügt Quell-Hashes zu stderr-Zeilen hinzu.

**Schlüsseloptionen:** `-p` / `--path`, `-f` / `--file`, `--json`, `--no-cache`

**Siehe auch:** [Markdown-Probleme](/de/guide/translation-dashboard/markdown-issues)
