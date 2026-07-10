<a id="cli--documents"></a>
# CLI — Documents

<a id="translate-docs"></a>
### `translate-docs`

**Synopsis:** `ai-i18n-tools translate-docs [options]`

Markdown, MDX, `.astro`, optional Docusaurus catalog JSON (`docusaurusCatalogDir`), optional Nextra `_meta.ts`/dictionary `.ts`, aur har ek `docs` block ke liye optional VitePress theme catalog ka anuvad karein.

**Mukhya vikalp:** `-l`, `-j`, `-b`, `--prompt-format`, `--force`, `--force-update`, `-p` / `-f`, `--dry-run`

`-j`: adhiktam samantar sthaniya bhashaen; `-b`: prati file adhiktam samantar batch API calls. `--prompt-format`: batch wire format (`xml` | `json-array` | `json-object`).

**Yeh bhi dekhein:** [Cache vyavahar aur `translate-docs` flags](/guide/documents/cli-options#cache-behaviour-and-translate-docs-flags), [Batch prompt format](/guide/documents/cli-options#batch-prompt-format)

---

<a id="write-heading-ids"></a>
### `write-heading-ids`

**Synopsis:** `ai-i18n-tools write-heading-ids [options]`

Kam se kam ek `docs[]` block ki avashyakta hai. Har block ke `contentPaths` ke tahat `.md` / `.mdx` ikattha karta hai (`.translate-ignore` ka samman karta hai). Har flat ATX `#` heading se turant pehle ek HTML anchor line `<a id="slug"></a>` dalta hai (fenced code blocks ke andar headings ko chhod deta hai); jab ek anchor line pehle se maujood ho, to `id` ko update karta hai yadi yah ab vartaman heading text se prapt slug se mel nahin khata hai.

**Mukhya vikalp:** `-p` / `--path`, `-f` / `--file`, `--slug-style`, `--dry-run`

`--slug-style`: `github` (default; doctoc / anchor-markdown-header), `bitbucket`, `gitlab`, `pymdown`, `azure-devops`. `pymdown` ke saath, optional `--pymdown-case`, `--pymdown-normalize`, `--pymdown-percent-encode` / `--no-pymdown-percent-encode`.

**Yeh bhi dekhein:** [Anchor links](/guide/documents/anchor-links)

---

<a id="check-markdown"></a>
### `check-markdown`

**Synopsis:** `ai-i18n-tools check-markdown [options]`

Har `docs[]` block ke `contentPaths` ke tahat markdown/MDX scan karta hai (`translate-docs` jaisi hi khoj, `.translate-ignore` ka samman karta hai): delimiter pairing, unclosed inline code, aur `STRONG_OUTSIDE_LINK` jab `**`/`__` ek `[text](url)` link ko wrap karte hain.

stderr par `relativePath:line: [ISSUE_CODE] message` lines print karta hai; yadi koi samasya ho to exit code **1**. `--json`: stdout par JSON report. `cacheDir` mein `markdown_source_issues` likhta hai jab tak ki `--no-cache` na ho. `-v` stderr lines mein source hashes jodta hai.

**Mukhya vikalp:** `-p` / `--path`, `-f` / `--file`, `--json`, `--no-cache`

**Yeh bhi dekhein:** [Markdown issues](/guide/translation-dashboard/markdown-issues)
