# Plan: re-flow the documentation for a new user

Status: draft for review. Documentation only. Nothing in this plan changes source, CLI behaviour, locale trees, or the changelog.

Follows up on `document_t()_preparation_c06604bf.plan.md` (the "missing `t()` preparation step" plan). That plan closed the content gap: `docs/guide/add-i18n-to-js.md` exists, with agent prompts and links from the existing pages. It did not change who the docs are written for, or the order in which a newcomer meets them. This plan covers audience and flow, and fixes one ordering bug that the earlier plan introduced.

Target reader: someone with a JS/TS app, a Python app, or a website or documentation site in one language, who wants to add more languages using this tool.

---

## 1. Findings

1. **The docs follow the tool's modes, not what the reader has.**
   - Current sidebar order in `docs/.vitepress/config.mts`: What is → Installation → Quick start → Tool UI language → Translation types (UI strings, Documents, JSON, SVG) → Glossary → Add i18n to JS (7th) → Add i18n to Python (8th) → Intlayer → Integrations → Images → Providers (12th) → Runtime helpers → Dashboard.
   - The only two onboarding walkthroughs sit below Glossary.
   - Doc-site owners must find a collapsed "Integrations" group under Intlayer.
   - Providers and models is a hard prerequisite for any translation, yet it is 12th. Tool UI language is cosmetic, yet it is 4th.

2. **`docs/guide/quick-start.md` is not a quick start.**
   - It runs 243 lines. It opens with a paragraph inventorying templates, then runnable examples, an API-key section, a command block with 14 `init` variants, a scripts block, combined sync, and a mixed Docusaurus plus README config.
   - The default path (`ui-markdown`, then `extract`) records nothing for a hardcoded app. The sentence that says so is on line 91, after the cheat sheet.

3. **`docs/guide/what-is-ai-i18n-tools.md` leads with tool vocabulary.**
   - It opens with "Translation modes", then a "Which should I use?" table by content type, then a 16-row examples table.
   - It never says who the tool is for, what changes in your project, what you get back, or what the tool does not do.

4. **The entry points promise `init` then `sync`.**
   - `docs/index.md` "Quick install" and `README.md` "Quick start" both run `init`, `suggest-models`, then `sync`. For a hardcoded JS/TS app that finishes and translates nothing.
   - The README tagline "no lock-in, no rewrites" contradicts the new `t()` step. The earlier plan said to leave it; this plan reverses that.

5. **The new JS guide has an ordering bug.**
   - `add-i18n-to-js.md` says "Add the bootstrap first". But the bootstrap imports `strings.json` and `ui-languages.json`, and only `extract` writes those.
   - `src/cli/extract-strings.ts` writes both unconditionally, even when it finds zero strings. The `migrate-intlayer` report already says "run extract before compiling".
   - So the app does not build between the bootstrap step and the first `extract`. The agent prompt's "Order" section has the same flaw.
   - The third import (`{sourceLocale}.json`) is only needed for plurals. `sourcePluralFlatBundle` is optional in `setupKeyAsDefaultT` (`src/runtime/i18next-helpers.ts`).
   - The page also never covers `init`, the API key, or config, so it is not self-contained the way `add-i18n-to-python.md` is.

6. **Three audiences, two journeys.** JS and Python have walkthroughs. Website and docs owners get a chooser table in `integrations/index.md` and five per-framework pages with different structures.

7. **`docs/guide/installation.md` mixes concerns.** It covers install, the standalone binary, PATH setup, cloned-monorepo developer notes, the API key, tool UI language, and an `i18next-scanner` removal note.

8. **Several in-site anchors are broken, and a restructure will touch them.** VitePress does not validate anchors. An approximate check over the English docs found about 26.
   - Confirmed from source:
     - `quick-start#provider-and-api-key` is linked from 6 pages (`documents/index`, `integrations/index`, `json`, `ui-strings/index`, `reference/cli-commands/setup`, and locale copies). The real id is `provider-and-api-key-required-for-translation`.
     - `installation#cloned-monorepo` is linked from `index.md`, `examples.md`, and `quick-start.md`. The real id is `cloned-ai-i18n-tools-monorepo`.
     - `quick-start#step-1-initialise` is linked from `reference/architecture.md`. No such heading exists.
   - Also reported by the check, to be confirmed against real ids: `ui-strings/astro-website#astro-website-pages-parse-and-replace`, `#astro-website-plain-astro-not-starlight`, `#astro-website-ui-strings-ssg`, `reference/configuration#docsoutput`, `documents/output-layouts#nested`, `documents/troubleshooting#wrong-script-or-romanized-output`, `images-and-screenshots#config---docsoutputstyle--doc-system`.
   - `ui-strings/astro-website.md` also has a duplicate `<a id="astro-website"></a>` on lines 1 and 2.

---

## 2. Design rules

- **No renames or moves of existing `.md` files.** Locale trees under `docs/<locale>/` are generated from them, and outside links point at them. Reorder through the sidebar and rewrite pages in place.
- **At most two new files:** `docs/guide/add-i18n-to-website.md` and `docs/guide/combining-pipelines.md`.
- **Sidebar labels** for new groups get keys in `docs/.vitepress/i18n/theme.en.json`, read in `config.mts` with the existing `t.sidebar.x ?? "English"` fallback. Do not edit locale theme JSON.
- **Every page** states who it is for in its first two lines and ends with one "Next:" link.
- **Reference pages** (UI strings, Documents, JSON, Integrations overview) say so in their opening line and point to the journey pages.
- **Entry pages** (home, README, what-is, quick-start) show no template names and no "pipeline", "block", or "mode" vocabulary in the first screen.
- **Anchors** that other pages link to are kept, with an explicit `<a id>` where the heading slug differs. Broken ones are fixed in English files only. Do not hand-fix locale copies.
- **Documentation conventions from `AGENTS.md` apply:**
  - Link with `/guide/…` and `/reference/…` routes inside `docs/`, and with full GitHub URLs for repo-root files.
  - In prose or inline code, write i18next placeholders as `<code v-pre>{{name}}</code>`. In fenced blocks, use plain `{{name}}`.
  - Never bold inline code or links.
  - Do not run `sync`, `translate-docs`, or `pnpm i18n:sync`.
- `README.md` and `docs/index.md` are maintained independently.

---

## 3. Reader model

Three starting situations, one shared spine:

> install → provider and key → `init` → **prepare the project** → `extract` / `translate` → use the output → switch language → keep it translated

"Prepare the project" is the only place the paths differ.

| Starting point | Prepare the project |
| --- | --- |
| JS/TS app | Install `i18next` (and `react-i18next` for React), run `extract` once, add the bootstrap, wrap user-facing strings in `t()` |
| Python app | Pick a template so `i18n.py` exists (Django keeps gettext), wrap strings with `t()` / `_()` |
| Website or docs site | Enable the framework's own i18n routing and layout (VitePress `locales`, Docusaurus `i18n`, Starlight `locales`, Nextra and Fumadocs content layout) |

Reading chain for every path: what-is → quick-start → journey page → reference page for the pipeline → language switcher → keep it translated.

---

## 4. Proposed sidebar

All of this sits inside the existing top-level "Guide" group, with `Examples` and `Reference` unchanged.

```text
Get started
  What is ai-i18n-tools?          /guide/what-is-ai-i18n-tools
  Quick start                     /guide/quick-start
  Installation                    /guide/installation
  LLM providers                   /guide/providers-and-models      (moved up; URL unchanged)
Add i18n to your project
  JS/TS app                       /guide/add-i18n-to-js
  Python app                      /guide/add-i18n-to-python
    Python integrations           /guide/integrations/python
  Website or docs site            /guide/add-i18n-to-website       (NEW)
    Astro · Docusaurus · VitePress · Nextra · Fumadocs   (existing integration pages)
    Plain HTML apps               /guide/ui-strings/plain-html
  Migrating from Intlayer         /guide/migrating-from-intlayer
Guides by content type
  UI strings (overview, t() & plurals, Wire i18next, Language switcher, Python, Astro website)
  Documents (existing children)
  JSON
  SVG
  Images & Screenshots
  Glossary
  Combining pipelines             /guide/combining-pipelines       (NEW)
  Integrations overview           /guide/integrations/             (framework-shell comparison)
Tools
  Translation Dashboard (existing children)
  Runtime helpers
  Tool UI language
```

New keys for `theme.en.json` under `sidebar`:

| Key | English |
| --- | --- |
| `getStarted` | Get started |
| `addI18nToProject` | Add i18n to your project |
| `addI18nToWebsite` | Add i18n to a website or docs site |
| `guidesByContentType` | Guides by content type |
| `combiningPipelines` | Combining pipelines |
| `tools` | Tools |

Existing keys reused: `addI18nToJs`, `addI18nToPython`, `migratingFromIntlayer`, `integrations`, `documentationSites`, `providers`, `runtimeHelpers`, `dashboard`, `toolUiLanguage`, `glossary`.

The top nav item "Guide" keeps pointing at `/guide/what-is-ai-i18n-tools`.

---

## 5. Page-by-page work

### 5.1 `docs/guide/what-is-ai-i18n-tools.md` (rewrite)

1. **Who it is for.** One paragraph: you have an app, website, or docs site in one language and want more languages. The tool finds the text, translates it with your LLM provider, writes the files your project already loads, and caches so reruns are cheap.
2. **You do / the tool does.** A two-column table.
   - You: pick languages and a provider; make user-facing text visible to the tool (`t()` or markers for apps, framework i18n for sites); wire the runtime or routing.
   - Tool: extract, translate, validate, cache, write catalogs or pages, show status in the dashboard.
3. **What it does not do.** It does not rewrite your source (agent prompts are provided), install i18next or framework i18n, or build your language switcher (helpers are provided).
4. **Where do I start?** A table by what you have. The first three rows are the three journeys. Remaining rows: standalone nested JSON, SVG labels, Intlayer, one HTML file. This replaces "Which should I use?".
5. **How it works.** Four steps: init, prepare, extract and translate, ship.
6. **Reference: the four pipelines.** The current "Translation modes" bullets, moved near the end.
7. **Examples.** Shrink the 16-row table to 4–5 picks per journey with a link to `/examples`.
8. **Next:** Quick start.

### 5.2 `docs/guide/quick-start.md` (rewrite)

1. Opening: who it is for, how long it takes, and prerequisites (Node.js `>=22.16.0`, or the standalone binary for Python; an API key or Ollama; a project in version control).
2. "Prefer to look first?" box with the `npx degit` example command.
3. **Step 1: install.** Short, with a link to Installation. Python points to the standalone executable.
4. **Step 2: provider and key.** Keep the content. Add `<a id="provider-and-api-key"></a>` so the six inbound links resolve.
5. **Step 3: pick your path.** Three short blocks, each with 3–5 commands, a line stating what must be true of your project first, and a link to its journey.
   - JS/TS app: `init -P`, then "your source must call `t()` first" with a link to the JS guide.
   - Python app: `init -t ui-python -P …`.
   - Website or docs site: a small framework-to-template table and a link to the website guide.
6. **Step 4: run and check.** `extract`, `translate-ui` or `sync`, then `status` and where to find the output.
7. **Step 5: keep it translated.** A short scripts block (keep an anchor `recommended-packagejson-scripts`), `sync` in CI, the dashboard.
8. **Removed from this page:**
   - The 14-variant `init` command block. The templates table in `docs/reference/cli-commands/setup.md` already lists them; link there.
   - The opening template-inventory paragraph.
   - The cloned-monorepo paragraph. It stays in Installation.
   - The "Combined sync" and "Mixed documentation config" sections. These move to `combining-pipelines.md`.
9. **Next:** the chosen journey page.

### 5.3 `docs/guide/installation.md` (reorder and trim)

New order: install (npm or pnpm), Python standalone executable, set the API key, running the CLI (PATH options and `package.json` scripts), contributors.

- Move the cloned-monorepo section to a short "Working from a clone" section at the bottom, with `<a id="cloned-monorepo"></a>`. Link to `dev/DEVEL.md` for detail.
- Drop the tool-UI-language blurb. Tool UI language is in the "Tools" group.
- Move the `i18next-scanner` and Intlayer note to the JS guide as "Coming from another tool".

### 5.4 `docs/guide/add-i18n-to-js.md` (restructure, fix order)

Same skeleton as `add-i18n-to-python.md`:

1. Who this is for (JS/TS/JSX with source-language literals and no `t()` yet). The existing "Which page" table moves to the end as "Not your case?".
2. Install the tool and set the key (links).
3. `init`, and the four essential config keys: `sourceLocale`, `targetLocales`, `ui.sourceRoots`, `ui.stringsJson` / `ui.flatOutputDir`. Link Configuration for the rest.
4. Install `i18next`, and `react-i18next` when components use `useTranslation()`.
5. **Run `extract` once.** It reports 0 strings, and that is expected. It creates `strings.json` and `ui-languages.json` so the bootstrap compiles.
6. Add the bootstrap. The minimal version omits `sourcePluralFlatBundle`. Add it when the app starts using plurals. `SOURCE_LOCALE` must equal `sourceLocale`. Next.js: import from a client module.
7. Wrap strings, by hand or with the agent prompt. Keep the rules and the skip list.
8. `extract` and `translate-ui`, then check the output (`status`, open one locale file).
9. Switch language and restore a saved locale before the first render.
10. Keep it translated.
11. Examples.
12. Not your case? (existing table).

Agent prompt "Order" section becomes: install libraries, run `extract` once, add the bootstrap, wrap call sites, run `extract` again. Do not run a translation, and do not hand-edit catalogs.

### 5.5 `docs/guide/add-i18n-to-website.md` (new)

1. Two cases: a documentation site (Markdown or MDX), or a marketing or static site (Astro website, plain HTML).
2. "What do you have?" table, moved from `integrations/index.md`. Columns: your site, init template, start here, agent prompt.
3. Six common steps: install and key; `init -t <template> -P <provider>`; set `sourceLocale`, `targetLocales`, `docs[].contentPaths`; enable i18n in the site framework (link each framework's existing "Enable i18n in an existing site" section); run `sync` or `translate-docs`; check in the browser and add a language switcher ([Documents — Language switcher](/guide/documents/language-switcher)).
4. What gets translated: a short table of pages, shell and theme strings, sidebar labels, and images, drawn from "Framework shell translation" in `integrations/index.md`.
5. Plain HTML: one page that switches in the browser (UI strings runtime, `ui-plain-html`) versus one translated file per locale (`docs-plain-html`).
6. Not your case? App UI goes to the JS/TS or Python guide. Standalone locale JSON goes to the JSON guide.

### 5.6 `docs/guide/combining-pipelines.md` (new)

Receives, unchanged in substance:
- the "Combined sync" section and its example config;
- `docs[].targetLocales` as a subset of UI locales;
- the "Mixed documentation config" section (Docusaurus plus flat README).

Add a short intro: when to combine, and the order `sync` runs (extract, translate-ui, translate-svg, translate-docs, translate-json). Link back to Quick start.

### 5.7 Other pages

| Page | Change |
| --- | --- |
| `docs/guide/add-i18n-to-python.md` | Number the steps to match the JS guide. Add a "Not your case?" aside and a "Keep it translated" section. Content and prompts stay. |
| `docs/guide/ui-strings/index.md` | Open with "reference for `extract` and `translate-ui`; adding i18n? start at the JS/TS or Python guide". Trim the Step 1 key list to the essentials and link Configuration. Replace the dangling "(Step 4)" with a real "Step 4: use the output in your app" that links Wire i18next. Move per-locale model overrides and XLIFF export under an "Optional" heading. |
| `docs/guide/documents/index.md` | Same reference framing and a link to the website guide. Collapse the five "On X sites" paragraphs into the existing "Which guide to read" table. |
| `docs/guide/integrations/index.md` | Keep shared concepts, "Framework shell translation", and runnable examples. Remove the chooser table (it moves to the website guide) and point to it. |
| `docs/guide/json.md` | Add a two-line "who this is for" at the top: namespace JSON that stays as is, no `t()` in source. |
| `docs/index.md` | New hero tagline that leads with the outcome (add languages to your app, website, or docs) and drops "no rewrites". Add a three-card "Start here" block (JS/TS, Python, website). "Quick install" covers install and key only, then `init` per path. Keep "Python, no Node.js". |
| `README.md` | Same changes, written for the GitHub and npm audience. "Quick start" shows the three paths. Rename "Which pipeline?" to "Where do I start?". |
| `docs/examples.md` | Add a "Start with this if you have…" column or grouping by journey. |
| `docs/ai-i18n-tools-context.md` | Add one routing line at the top for agents: bare literals go to the JS guide, sites to the website guide. |
| `examples/console-app/src/i18n.js` | Replace the comment citing the non-existent `docs/GETTING_STARTED.md, Step 4` with `docs/guide/ui-strings/i18next-runtime.md`. |
| `examples/astro-website/README.md` | Replace the links to `docs/GETTING_STARTED.md` with the current site routes. |
| `docs/.vitepress/config.mts`, `theme.en.json` | New groups and order per section 4. |

### 5.8 Anchor fixes (English files only)

- Add `<a id="provider-and-api-key"></a>` in `quick-start.md`.
- Add `<a id="cloned-monorepo"></a>` in `installation.md`.
- Change `reference/architecture.md` from `quick-start#step-1-initialise` to `/guide/ui-strings/#step-1-initialise`.
- Resolve the Astro anchors against the real ids in `ui-strings/astro-website.md`, and remove its duplicate `<a id="astro-website"></a>`.
- Resolve `reference/configuration#docsoutput`, `documents/output-layouts#nested`, `documents/troubleshooting#wrong-script-or-romanized-output`, and `images-and-screenshots#config---docsoutputstyle--doc-system` against the real ids.

---

## 6. Order of work

1. **Verify (read-only, no repo changes).**
   - Run `extract` in a scratch directory with an empty source tree and confirm `strings.json` and `ui-languages.json` appear.
   - Confirm `translate-ui` writes `{sourceLocale}.json` only for plural rows, and that the bootstrap runs without `sourcePluralFlatBundle`.
   - Re-run the anchor check with a slugifier matching VitePress, and record the real ids. Keep the script outside the repo (for example under `/tmp/opencode`); do not commit it.
2. **Journey pages:** fix `add-i18n-to-js.md`, create `add-i18n-to-website.md`, make the light pass on `add-i18n-to-python.md`.
3. **Entry pages:** `what-is-ai-i18n-tools.md`, `quick-start.md`, `installation.md`, `docs/index.md`, `README.md`. Create `combining-pipelines.md` in the same step, so nothing is dropped from `quick-start.md`.
4. **Reference reframes:** `ui-strings/index.md`, `documents/index.md`, `integrations/index.md`, `json.md`, `examples.md`, `ai-i18n-tools-context.md`.
5. **Sidebar:** `config.mts` and `theme.en.json`.
6. **Anchor fixes** and the source-comment fixes in the two examples.
7. **Build:** run `pnpm docs:build` (it runs the brace-escape script first). Read any dead-link or Vue-interpolation error, and fix it in the English source.

## 7. Acceptance checks

- A reader landing on the home page or README can reach the right journey in one click, and the first command they see is not `sync` for a hardcoded app.
- Following `add-i18n-to-js.md` from an empty config to a translated string never hits a missing-import build error.
- `quick-start.md` fits on a few screens and contains no more than one `init` command per path.
- No sidebar entry points at a missing page. Locale sidebars still render through the `??` fallback.
- The anchor check reports none of the broken links listed in section 1.
- `pnpm docs:build` passes.
- `git status` shows no changes under `docs/<locale>/`, `translated-docs/`, or `src/i18n/locales/`.

## 8. Out of scope

- CLI or source changes. A worthwhile follow-up: make `init` scaffold the JS bootstrap the way `ui-python` writes `i18n.py`. That would remove two steps from the JS journey.
- A diagnostic in `extract` for non-literal `t()` keys, and a detection-only command for hardcoded strings (both noted in the earlier plan).
- Editing locale trees, or running documentation translation.
- A changelog entry (documentation only).
- Locale pages stay stale until a docs-translation refresh. The new pages `add-i18n-to-website` and `combining-pipelines` return 404 in locale sites until then, the same as `add-i18n-to-js` does today.

## 9. Decisions needed

| # | Question | Recommendation |
| --- | --- | --- |
| 1 | Replace the "no lock-in, no rewrites" tagline in `README.md` and `docs/index.md`? | Yes. It conflicts with the `t()` step. |
| 2 | New `add-i18n-to-website.md`, or retitle `integrations/index.md` as the journey page? | New file, so the JS, Python, and website guides match. Shrink `integrations/index.md` to reference. |
| 3 | Move combined sync and the mixed docs config to `combining-pipelines.md`, or keep them at the bottom of Quick start? | New page. |
| 4 | Move "LLM providers" up into "Get started"? | Yes. It is a prerequisite for the first translation. |
