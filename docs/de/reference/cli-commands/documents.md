<a id="cli--documents"></a>
# CLI – Dokumente

<a id="translate-docs"></a>
### `translate-docs`

**Synopsis:** `ai-i18n-tools translate-docs [options]`

Übersetzt Markdown, MDX, `.astro`, optionalen Docusaurus-Katalog-JSON (`docusaurusCatalogDir`), optionales Nextra `_meta.ts`/Wörterbuch `.ts` und optionalen VitePress-Themenkatalog für jeden `docs`-Block.

**Wichtige Optionen:** `-l`, `-j`, `-b`, `--prompt-format`, `--force`, `--force-update`, `--check-cache`, `-p` / `-f`, `--dry-run`

`-j`: maximale parallele Lokalisierungen; `-b`: maximale parallele Batch-API-Aufrufe pro Datei. `--prompt-format`: Batch-Wire-Format (`xml` | `json-array` | `json-object`).

**Siehe auch:** [Cache-Verhalten und `translate-docs`-Flags](/de/guide/documents/cli-options#cache-behaviour-and-translate-docs-flags), [Batch-Prompt-Format](/de/guide/documents/cli-options#batch-prompt-format)

---

<a id="write-heading-ids"></a>
### `write-heading-ids`

**Synopsis:** `ai-i18n-tools write-heading-ids [options]`

Erfordert mindestens einen `docs[]`-Block. Sammelt `.md` / `.mdx` unter dem `contentPaths` jedes Blocks (berücksichtigt `.translate-ignore`). Standardmäßig wird eine HTML-Ankerzeile `<a id="slug"></a>` unmittelbar vor jeder flachen ATX-Überschrift `#` eingefügt (Überschriften innerhalb von Codeblöcken werden übersprungen). Bestehende Überschriften-IDs jeglicher Form (HTML-Ankerzeile, klassisches `{#id}`-Suffix, MDX `{/* #id */}`-Kommentar) werden durch den ausgewählten Stil ersetzt; der Slug wird immer aus dem aktuellen Überschriftentext abgeleitet. Mit `--slug-style mdx-comment` wird stattdessen ein Docusaurus MDX-Kommentar-Suffix in die Überschriftenzeile geschrieben (gleicher GitHub-Stil-Slug-Algorithmus) und ein vorhergehender HTML-Anker, falls vorhanden, entfernt. `--remove` entfernt alle diese Überschriften-ID-Formen und schreibt nichts an deren Stelle.

Nach dem Aktualisieren der Quelldateien durchläuft der Befehl auch die vorhandenen übersetzten Markdown-Dateien jedes Gebietsschemas (dieselbe `docsOutput`-Pfadzuordnung wie `translate-docs`). Er kopiert die **englischen** Überschriften-IDs auf die passenden ATX-Überschriften in Dokumentreihenfolge – er slugt niemals den übersetzten Titel – und verschiebt eine Überschriften-ID `{#id}` / `{/* #id */}` (oder verirrte HTML-ID `<a id>`) zurück in die Form, die Docusaurus / der gewählte Stil erwartet. Fehlende übersetzte Dateien werden übersprungen. `--remove` entfernt auch Überschriften-IDs aus diesen übersetzten Dateien, einschließlich falsch platzierter Inline-Tokens.

Wenn die Überschriften-IDs einer übersetzten Datei neu positioniert oder korrigiert werden, wird das zugehörige zwischengespeicherte übersetzte Segment (referenziert über den Hash der englischen Quelle) ebenfalls aktualisiert, sofern die englische Quelle sowie der alte und der neue übersetzte Inhalt dieselbe Anzahl an Segmenten aufweisen. Bei einer Abweichung der Anzahl werden diese Datei und dieses Gebietsschema übersprungen. Ein nachfolgender `sync --force-update` setzt die Datei dann aus der aktualisierten Cache-Zeile wieder zusammen.

**Wichtige Optionen:** `-p` / `--path`, `-f` / `--file`, `--slug-style`, `--remove`, `--dry-run`

`--slug-style`: `github` (Standard; doctoc / anchor-markdown-header), `bitbucket`, `gitlab`, `pymdown`, `azure-devops`, `mdx-comment` (Docusaurus `{/* #… */}`-Suffix). Mit `pymdown`, optional `--pymdown-case`, `--pymdown-normalize`, `--pymdown-percent-encode` / `--no-pymdown-percent-encode`. `--remove` kann nicht mit `--pymdown-*` kombiniert werden.

**Siehe auch:** [Anker-Links](/de/guide/documents/anchor-links)

---

<a id="check-markdown"></a>
### `check-markdown`

**Synopsis:** `ai-i18n-tools check-markdown [options]`

Scannt Markdown/MDX unter dem `docs[]` jedes Blocks `contentPaths` (gleiche Erkennung wie `translate-docs`, berücksichtigt `.translate-ignore`): Begrenzerpaare, nicht geschlossener Inline-Code und `STRONG_OUTSIDE_LINK`, wenn `**`/`__` einen `[text](url)`-Link umschließen.

Gibt `relativePath:line: [ISSUE_CODE] message`-Zeilen an stderr aus; Exit-Code **1**, wenn ein Problem auftritt. `--json`: JSON-Bericht auf stdout. Schreibt `markdown_source_issues` in `cacheDir`, es sei denn `--no-cache`. `-v` fügt Quell-Hashes zu stderr-Zeilen hinzu.

**Schlüsseloptionen:** `-p` / `--path`, `-f` / `--file`, `--json`, `--no-cache`

**Siehe auch:** [Markdown-Probleme](/de/guide/translation-dashboard/markdown-issues)
