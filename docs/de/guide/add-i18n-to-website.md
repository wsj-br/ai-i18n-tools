<a id="add-i18n-to-a-website-or-docs-site"></a>
# i18n zu einer Website oder Dokumentationsseite hinzufügen

Diese Seite beschreibt, wie man eine Dokumentationsseite (Markdown oder MDX) oder eine Marketing- oder statische Website (eine Astro-Website oder reines HTML), die eine Einzelsprache hat, mit ai-i18n-tools um Lokalisierungen erweitert. Das Tool übersetzt Seiteninhalte mit den Modellen Ihres LLM-Anbieters und schreibt eine lokalisierte Kopie pro Sprache. Ihr Site-Framework stellt diese Kopien bereit und bietet den Sprachumschalter.

Der schnellste Weg ist, einem Coding-Agenten den Prompt auf dieser Seite zu geben. Er aktiviert die i18n dieses Frameworks und prüft die Konfiguration. Sie installieren die CLI, wählen den Anbieter und initialisieren das Projekt selbst, da dies Ihren API-Schlüssel und Ihre Entscheidungen erfordert. Sie führen die Übersetzung auch selbst aus, da dabei Kosten auf Ihrem Konto anfallen.

Für eine App, deren UI-Strings in `t()`-Aufrufen liegen, verwenden Sie [i18n zu einer JS/TS-App hinzufügen](/de/guide/add-i18n-to-js) oder [i18n zu einer Python-App hinzufügen](/de/guide/add-i18n-to-python). Ein Repository-README ohne Site-Framework verwendet [i18n zu Ihrem README und Markdown-Dokumenten hinzufügen](/de/guide/add-i18n-to-readme). Sie sind sich nicht sicher, was zutrifft? Siehe [Nicht Ihr Fall?](#not-your-case) am Ende.

<a id="steps"></a>

Der Ablauf:

1. [CLI installieren und einen Anbieter auswählen](#install-and-choose-a-provider).
2. [Projekt initialisieren](#initialise-the-project) mit `init`.
3. [Agent-Prompt ausführen](#run-the-agent-prompt).
4. [Ergebnis überprüfen](#review-the-result).
5. [Modelle auswählen und übersetzen](#choose-models-and-translate), dann eine Sprache prüfen.
6. [Übersetzt halten](#keep-it-translated).

Möchten Sie die Änderungen lieber selbst vornehmen oder wissen, was der Prompt tut? [Manuell vorgehen](#do-it-by-hand) führt die gleichen Schritte einzeln durch.

<a id="install-and-choose-a-provider"></a>
## Anbieter installieren und auswählen

Diesen Teil erledigen Sie, nicht der Agent. Der Installer nimmt Änderungen an Ihrem System vor, und der API-Schlüssel ist ein Geheimnis, das in Ihre Shell gehört, nicht in einen Prompt.

Installieren Sie das Paket als Entwicklungsabhängigkeit. Die VitePress-Konfiguration importiert `prefixVitepressThemeConfigLinks` aus `ai-i18n-tools`, und eine reine HTML-Seite kopiert `i18n.js` aus dem Paket. Eine eigenständige ausführbare Datei ist nur dann ausreichend, wenn die Site niemals `ai-i18n-tools/runtime` importiert und das Paket niemals aus ihrer Konfiguration importiert. Weitere Installationsoptionen: [Installation](/de/guide/installation).

```bash
pnpm add -D ai-i18n-tools
```

`npm install --save-dev ai-i18n-tools` und `yarn add --dev ai-i18n-tools` funktionieren auch. Die folgenden Beispiele verwenden den reinen `ai-i18n-tools`-Befehl. Eine lokale Installation erfordert `node_modules/.bin` auf `PATH` oder `pnpm exec` vor jedem Befehl. Siehe [Verwenden der CLI](/de/guide/installation#using-the-cli).

Installation überprüfen:

```bash
ai-i18n-tools --version
```

Wählen Sie dann einen Anbieter und legen Sie dessen API-Schlüssel in der Shell fest, die die Übersetzung ausführen wird. Zum Beispiel OpenRouter:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Ollama benötigt keinen Schlüssel. Andere Voreinstellungen: [Integrierte Anbieter](/de/guide/providers-and-models#built-in-providers). Merken Sie sich den Anbieternamen, da Sie ihn im nächsten Schritt an `init` übergeben. Der Agent benötigt den Schlüssel nie: Er führt nur Befehle aus, die keine Modellaufrufe tätigen. Sie verwenden den Schlüssel später, wenn Sie [übersetzen](#choose-models-and-translate).

<a id="initialise-the-project"></a>
## Projekt initialisieren

Sie führen dies einmal aus, vor dem Prompt. Es schreibt `ai-i18n-tools.config.json` und verwendet den oben von Ihnen gewählten Anbieter. Es schaltet i18n nicht in einer bestehenden Site ein. Das ist der Prompt.

| Ihre Site | Init-Vorlage | Anleitung für Details |
| --- | --- | --- |
| Astro Starlight | `ui-starlight` | [Astro](/de/guide/integrations/astro) |
| Docusaurus | `ui-docusaurus` | [Docusaurus](/de/guide/integrations/docusaurus) |
| VitePress | `ui-vitepress` | [VitePress](/de/guide/integrations/vitepress) |
| Nextra 4 (Next.js App Router) | `ui-nextra` | [Nextra](/de/guide/integrations/nextra) |
| Fumadocs 4 (Next.js App Router) | `ui-fumadocs` | [Fumadocs](/de/guide/integrations/fumadocs) |
| Reine Astro-Website | `ui-astro-website` | [Astro](/de/guide/integrations/astro#plain-astro-marketing-and-app-sites) |
| Eine HTML-Datei, die die Sprache im Browser umschaltet | `ui-plain-html` | [Reine HTML-Apps](/de/guide/ui-strings/plain-html) |
| Eine übersetzte HTML-Datei pro Gebietsschema | `docs-plain-html` | [HTML-Seiten](/de/guide/documents/html-pages) |
| Kein Site-Framework, nur eine README-Datei und Markdown-Dateien | `docs-markdown` oder eine beliebige Vorlage plus `--with-readme` | [i18n zu Ihren README- und Markdown-Dokumenten hinzufügen](/de/guide/add-i18n-to-readme) |

```bash
ai-i18n-tools init -t ui-vitepress -P openrouter
```

Ersetzen Sie `ui-vitepress` durch die Vorlage in der Tabelle. Bearbeiten Sie dann `sourceLocale`, `targetLocales` und `docs[].contentPaths`. `sourceLocale` ist die Sprache der Seiten. Jede BCP-47-Sprache ist gültig. `contentPaths` müssen die Seiten und Ordner sein, die in dieser Sprache geschrieben sind. Die Pfade in der Vorlage sind Startpunkte. `docsOutput.style` ist bereits für die Vorlage eingestellt. `ui-astro-website` und `ui-plain-html` schreiben einen `ui`-Block und ein leeres `docs`-Array. Der Prompt fügt einen Seiten-HTML-`docs`-Block für eine reine Astro-Site hinzu, wenn Sie Seiten-HTML übersetzen.

Führen Sie `init` einmal aus. Es überschreibt `ai-i18n-tools.config.json` jedes Mal, daher verwirft ein zweiter Durchlauf von Ihnen vorgenommene Änderungen.

<a id="run-the-agent-prompt"></a>
## Agent-Prompt ausführen

Öffnen Sie das Projekt in Ihrem Coding-Agenten (Cursor, Claude Code, Copilot oder Ähnliches), starten Sie einen neuen Chat und fügen Sie den untenstehenden Prompt ein. Das Projekt muss bereits initialisiert sein. Es gibt nichts zu bearbeiten. Wenn Sie ein Framework-Detail weglassen möchten, teilen Sie dies in derselben Nachricht mit.

Der Agent prüft zuerst, ob die CLI und die Konfiguration existieren, und stoppt mit Anweisungen, falls eine fehlt. Dann erkennt er das Framework und aktiviert das Locale-Routing dieses Frameworks. Er installiert die CLI nicht, initialisiert die Konfiguration nicht, liest Ihren API-Schlüssel nicht und übersetzt nicht. Die Übersetzung ist der Schritt nach der Überprüfung, und Sie führen sie aus.

````markdown
# Enable i18n on this website or docs site

## Before you start

The user must already have installed ai-i18n-tools and initialised this
project. Check that `ai-i18n-tools --version` runs (or
`pnpm exec ai-i18n-tools --version` when the binary is only in
`node_modules/.bin`) and that
`ai-i18n-tools.config.json` exists. If either is missing, stop now and tell
the user to install ai-i18n-tools as a dev dependency and run
`ai-i18n-tools init -t <template> -P <provider>`, then run this prompt again.
The template is `ui-vitepress`, `ui-docusaurus`, `ui-starlight`, `ui-nextra`,
`ui-fumadocs`, `ui-astro-website`, `ui-plain-html`, or `docs-plain-html`.
Do not install or initialise anything yourself.

`ui-plain-html` and `ui-astro-website` are valid when `docs` is empty. Every
other template needs one `docs` entry. If that entry is missing, stop and name
the init command.

## Rules

- Do not read or search the ai-i18n-tools source. This prompt is complete.
- Never read, print, or write API keys, `.env` files, or the shell environment.
- Do not run `sync`, `translate-docs`, `translate-ui`, or `suggest-models`.
  They call the translation API and cost money. The user runs them after
  reviewing your work.
- Do not translate, reword, or rename source pages, nav labels, or dictionary
  strings. Do not edit generated locale trees (`docs/<locale>/`,
  `i18n/<locale>/` other than the source catalog from `write-translations`,
  `theme.<locale>.json`, `content/<locale>/`, locale MDX, or locale HTML).
- Do not reformat unrelated code. Leave unrelated edits in a dirty tree alone.
- Apply one branch. If the framework is unclear, stop and ask.

Detect the branch from `docsOutput.style`, then from the config file and
`package.json`: `vitepress`, `docusaurus`, `nextra`, `fumadocs`,
`astro-starlight` with pages under `src/content/docs` (Starlight), `nested`
with HTML `contentPaths` (`docs-plain-html`), a `ui` block whose extractor
extensions include `.html` (`ui-plain-html`), or an Astro site that is not
Starlight (`ui-astro-website`).

Point `contentPaths` and `docsRoot` at the source-language pages that exist
in this repository. The paths written by `init` are starters.

## VitePress

- In `.vitepress/config`, set `locales.root` for the source locale (`label`,
  `lang`, and the existing `themeConfig`). Add one `locales[code]` per
  `targetLocales` entry: `label`, `lang`, `link: '/<code>/'`, and per-locale
  `title` / `description`. Keep `targetLocales` equal to those keys.
- Author nav and sidebar links once, without a locale prefix. Prefix `link`
  and `activeMatch` per locale with `prefixVitepressThemeConfigLinks` from
  `ai-i18n-tools`. `translate-docs` does not rewrite links inside the config.
- Leave `docsOutput.vitepressThemeCatalog` as `init` wrote it. If the config
  already loads `theme.en.json`, keep that loader and add `locales[code]` the
  same way. If theme strings are still inline, leave them inline. Do not
  create `theme.en.json` or `theme.<locale>.json` yourself, and do not load a
  theme file that is not on disk. The first `sync` bootstraps a missing
  catalog.
- `docsOutput.style` is `vitepress`. `outputDir` is the docs root.

## Docusaurus

- Add the `i18n` block in `docusaurus.config.js`: `defaultLocale`, `locales`
  (source plus each target), and `localeConfigs[locale].path` when the URL
  path differs from the locale code. The path must match the folder under
  `i18n/`.
- Point `docusaurusCatalogDir` at `i18n/<defaultLocale>`. `docsOutput.style`
  is `docusaurus`. `contentPaths` and `docsRoot` are the source docs folder.
  `outputDir` is the parent of the locale folders.
- Run this project's `docusaurus write-translations` so
  `i18n/<defaultLocale>/` exists. That command does not call a model. Do not
  run `sync` or `translate-docs`.
- Custom React in `src/pages` and `src/components` is not markdown. Mark
  user-facing copy with `<Translate>` or `translate()` from
  `@docusaurus/Translate`. The message has to be a static string. Do not wrap
  those calls in `t()`.

## Nextra

- Move source MDX to `content/<sourceLocale>/` (usually `content/en/`). The
  source locale is a folder, not the content root. Leave `_meta.ts` beside
  the pages it labels.
- Set `i18n.locales` and `defaultLocale` in `next.config`. `targetLocales`
  matches `i18n.locales` except the default locale.
- Add an `app/[lang]/` route, `getPageMap('/' + lang)`, and `<Layout i18n>`.
- Add `app/_dictionaries/<source>.ts` (usually `en.ts`) with the English
  chrome as string literals (`siteTitle`, footer, `editLink`, search
  placeholder, table-of-contents title, last-updated label), and
  `get-dictionary.ts` that imports `./${locale}`. Pass those fields into
  `<Layout>`, `<Navbar>`, and `<Footer>`. Keep native language names in a
  labels map, untranslated.
- Config: `features.translateDocs`, `docsOutput.style` `nextra`, `docsRoot`
  `content/<sourceLocale>`, `nextraDictionaryPath` the source dictionary.
- Optional: `proxy.ts` that re-exports `nextra/locales`.
- Do not write `app/_dictionaries/pt-BR.ts`, `content/pt-BR/`, or any other
  locale tree.

## Fumadocs

- `defineI18n` in `lib/i18n.ts` with `languages`, `defaultLanguage`, and
  `parser: "dot"` or `"dir"`. Use `"dot"` unless the source pages already live
  under a locale folder. Set `docsOutput.fumadocsParser` to the same value.
- Add `app/[lang]/` routes. Export `createI18nMiddleware(i18n)` from
  `proxy.ts`.
- Dot: source MDX stays at the collection root (`content/docs/`). Dir: source
  MDX lives under `content/docs/<sourceLocale>/`. Point `contentPaths` and
  `docsRoot` at that source tree. `docsOutput.style` is `fumadocs`.
- `targetLocales` equals `languages` minus the default language, character
  for character.
- Leave English UI overrides as they are. Do not write `ui.<locale>.json` or
  translated MDX. Do not put this catalog in `json[]`.

## Astro Starlight

- In the Starlight config, set `locales`, including a `root` entry when the
  source language should be unprefixed (`label` and required `lang`). Set
  `defaultLocale: 'root'` when that root entry is the source language.
- Source pages stay in `src/content/docs/`. `translate-docs` writes
  `src/content/docs/<locale>/`. Point `contentPaths` at the source pages, not
  at locale folders. `outputDir` and `docsRoot` are `src/content/docs`.
  `docsOutput.style` is `astro-starlight`.
- Align `targetLocales` with the non-root locale keys. Starlight directory
  keys are often lowercase (`pt-br`). If you change case to match, say so in
  the report.
- Prefer sidebar `slug` entries so the label comes from the page title. Do
  not hand-translate sidebar `label` maps or `social[].label`. There is no
  shell catalog to add.

## Plain Astro

- Enable Astro i18n routing: `i18n.locales` includes the source locale and
  each target. Astro route codes are lowercase (`pt-br`). In the report, list
  `targetLocales`, `i18n.locales`, and the note that flat JSON filenames use
  the casing in `targetLocales`.
- `init -t ui-astro-website` leaves `docs` empty and turns on UI strings. When
  page HTML should be translated, set `features.translateDocs` to true and
  append one `docs` entry: `contentPaths` the source pages (for example
  `src/pages/index.astro`), `outputDir` `src/pages`, `addFrontmatter` false,
  `docsOutput.style` `astro-starlight`, `docsRoot` `src/pages`. Leave
  `features.translateUIStrings` as it is.
- If frontmatter or shared data calls `t()`, stop that part and tell the user
  to run the JS/TS prompt and skip i18next. Astro resolves `t` at build time.
  Do not wrap those calls here, and do not install i18next.

## Plain HTML

Each file belongs to only one pipeline. If the same file is both a `docs[]` source and
under `ui.sourceRoots`, stop and ask.

`ui-plain-html` (one page, language switches in the browser):

- Run `ai-i18n-tools mark-html` with no `--write`, read the report, then
  run it again with `--write`. It inserts `data-i18n` markers. It does not
  call a model.
- Copy `node_modules/ai-i18n-tools/dist/html-runtime/i18n.js` next to the page.
  Load it at the end of `<body>` with `data-source-locale` equal to
  `sourceLocale`, `data-locales-base` pointing at `flatOutputDir` as a URL
  relative to the script, and `data-locale-select` pointing at an empty
  `<select>`. Do not add a `docs` block for the same file.

`docs-plain-html` (one HTML file per locale):

- Confirm `contentPaths`, `outputDir`, and `docsRoot`. `docsOutput.style` is
  `nested`. Do not add `data-i18n` markers. Do not fill a language list by
  hand. `translate-docs` writes the locale files and the list.

## Verify and report

The framework's locale config matches `targetLocales`. `contentPaths` point
at source-language pages. No generated locale tree was edited. Run the
project's build or typecheck when it has one, and do not run a translation.

Report the branch you applied, the files changed, and any page you left out
of `contentPaths`, with a one-line reason. Then list the commands for the
user, and do not run them: `ai-i18n-tools suggest-models` (optional),
`ai-i18n-tools sync`, then build the site and open one localised route.
````

<a id="review-the-result"></a>
## Ergebnis überprüfen

Der Agent schließt mit einem Bericht ab. Überprüfen Sie ihn, bevor Sie übersetzen:

- Der Diff. Es sollte die Framework-Locale-Konfiguration, `contentPaths` und das Routing sein, das der Branch beschreibt. Der Quelltext der Seite sollte unverändert sein. `git diff --stat` zeigt, wie viel sich geändert hat.
- `targetLocales` stimmt mit den Locale-Schlüsseln überein, die das Framework bereitstellen wird.
- `contentPaths` verweist auf Seiten in der Ausgangssprache, nicht auf einen Locale-Ordner, den das Tool schreiben soll.
- Es wurde kein generierter Locale-Baum bearbeitet: `docs/<locale>/`, Locale-HTML, `content/<locale>/`, `theme.<locale>.json` oder ein Docusaurus-`i18n/<locale>/`-Ordner außer dem Quellkatalog aus `write-translations`.
- Der Build oder Typecheck des Projekts besteht weiterhin.

<a id="choose-models-and-translate"></a>
## Modelle auswählen und übersetzen

Sie führen diesen Teil aus. Er verwendet Ihren API-Schlüssel und verursacht Kosten auf Ihrem Konto.

Die Modellliste von `init` ist ein Ausgangspunkt. Bewerten Sie die Chat-Modelle des aktiven Anbieters und schreiben Sie die Auswahl in `translationModels`, sobald die engere Auswahl korrekt aussieht:

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` ersetzt nur `translationModels`. Dieselbe Rangfolge finden Sie auf der Registerkarte [Modelle](/de/guide/translation-dashboard/models) von `ai-i18n-tools dashboard`.

Dann übersetzen und bauen:

```bash
ai-i18n-tools sync
```

`sync` führt `translate-docs` aus, wenn `features.translateDocs` aktiviert ist, und `extract` plus `translate-ui`, wenn UI-Strings aktiviert sind (`ui-plain-html`, und eine reine Astro-Site, die auch `t()` verwendet). `ai-i18n-tools translate-docs` führt den Dokumentenschritt eigenständig aus.

<a id="what-gets-translated"></a>
### Was übersetzt wird

Seiteninhalte durchlaufen die [Dokumente](/de/guide/documents/)-Pipeline. Framework-Chrome (Navigation, Seitenleiste, Theme-Labels) wird im selben Durchlauf verarbeitet, sofern das Framework dies unterstützt. Das ist nicht die separate [JSON](/de/guide/json)-Pipeline. Eine einfache HTML-Seite, die die Sprache im Browser umschaltet, ist die Ausnahme: `mark-html` und `translate-ui` schreiben flaches JSON, und das Browser-Skript wendet es an. Eine HTML-Datei pro Gebietsschema bleibt in der Dokumente-Pipeline.

| Framework | Shell- und Theme-Strings | Wie |
| --- | --- | --- |
| Docusaurus | `write-translations`-Katalog (`{ message, description }`) | `docs[].docusaurusCatalogDir` plus `translate-docs` |
| VitePress | Theme-, Navigations- und Seitenleisten-Katalog | `docsOutput.vitepressThemeCatalog` plus `translate-docs` |
| Nextra | `_meta.ts`-Seitenleisten-Labels | Automatisch mit `style: "nextra"` |
| Nextra | Theme-Wörterbuch `.ts` | `docs[].nextraDictionaryPath` |
| Fumadocs | `meta.json`-Seitenleisten-Labels | Automatisch mit `style: "fumadocs"` |
| Fumadocs | Katalog für UI-Überschreibungen | `docsOutput.fumadocsUiCatalog` |
| Astro Starlight | Integrierte UI-Strings in vielen Sprachen | Nur Seiten |

Bilder und Screenshots werden nicht von `translate-docs` übersetzt. Für sprachspezifische Dateien siehe [Bilder und Screenshots](/de/guide/images-and-screenshots/).

Nach dem ersten `sync` benötigen einige Frameworks immer noch die Konfiguration, um den Katalog zu laden, den der Befehl gerade geschrieben hat. Diese Prompts bleiben auf den Integrationsseiten: [VitePress Theme-Katalog](/de/guide/integrations/vitepress#wire-configmts-to-generated-theme-json-one-off), [Nextra-Wörterbuch](/de/guide/integrations/nextra#agent-prompt-dictionary-and-routes) und [Fumadocs UI-Katalog](/de/guide/integrations/fumadocs#agent-prompt).

<a id="check-one-language"></a>
### Eine Sprache überprüfen

Erstellen Sie die Website und öffnen Sie eine lokalisierte Route im Browser. Das eigene Gebietsschema-Dropdown des Frameworks ist der Umschalter. Für eine HTML-Datei, die im Browser umschaltet, verwenden Sie die Auswahl, die die Laufzeit füllt. Für eine HTML-Datei pro Gebietsschema öffnen Sie die Datei im Gebietsschema-Ordner.

Text, der noch in der Ausgangssprache ist, wurde aus `contentPaths` ausgelassen, ist ein Code-Fence, eine URL oder ein Überschriftenanker, oder die Route ist nicht verdrahtet. Ein VitePress-Navigationslabel, das noch in der Ausgangssprache ist, ist der Theme-Katalog: führen Sie zuerst `sync` aus, dann den [Theme-Katalog-Prompt](/de/guide/integrations/vitepress#wire-configmts-to-generated-theme-json-one-off), wenn die Zeichenketten noch inline in der Konfiguration sind.

<a id="keep-it-translated"></a>
## Übersetzt halten

Führen Sie `ai-i18n-tools sync` erneut aus, nachdem sich die Quellseiten geändert haben. Der Cache bedeutet, dass nur neuer oder geänderter Text an das Modell gesendet wird. Committen Sie die Gebietsschema-Bäume, die die Pipeline schreibt. `ai-i18n-tools dashboard` öffnet das [Übersetzungs-Dashboard](/de/guide/translation-dashboard/), um Übersetzungen zu überprüfen.

Um `README.md` im selben Durchlauf zu übersetzen, erstellen Sie ein Gerüst mit `--with-readme` (oder fügen Sie den Block zu einer bestehenden Konfiguration hinzu). Siehe [i18n zu Ihrer README und Markdown-Dokumentation hinzufügen](/de/guide/add-i18n-to-readme).

<a id="do-it-by-hand"></a>
## Machen Sie es manuell

Gehen Sie diese Schritte durch, wenn Sie die Änderungen lieber selbst vornehmen möchten oder wissen wollen, was der Prompt tut. Sie [installieren die CLI](#install-and-choose-a-provider), [initialisieren das Projekt](#initialise-the-project) und [übersetzen](#choose-models-and-translate) am Ende trotzdem.

1. Richten Sie `contentPaths` und `docsRoot` auf die Seiten der Ausgangssprache aus. Die Vorlagenpfade sind Ausgangspunkte.
2. Aktivieren Sie das Gebietsschema-Routing des Frameworks. Verwenden Sie den Zweig, der zur Vorlage passt. Die Integrationsseite enthält die vollständige Referenz.

Shell-Strings, die das Framework aus einem Katalog liest, werden nach dem ersten `sync` verdrahtet. Jeder Zweig unten verlinkt diese Nachbereitung.

<a id="vitepress"></a>
### VitePress

Fügen Sie `locales.root` und ein `locales[code]` pro Ziel hinzu und versehen Sie Navigations- und Seitenleistenlinks mit dem Präfix `prefixVitepressThemeConfigLinks`. Belassen Sie Inline-Theme-Strings für das erste `sync`. Checkliste: [i18n auf einer bestehenden Website aktivieren](/de/guide/integrations/vitepress#enable-i18n-in-an-existing-site). Nachdem `sync` `theme.<locale>.json` geschrieben hat, fügen Sie den [Theme-Katalog-Prompt](/de/guide/integrations/vitepress#wire-configmts-to-generated-theme-json-one-off) ein, wenn die Konfiguration die Strings noch inline enthält.

<a id="docusaurus"></a>
### Docusaurus

Fügen Sie den `i18n`-Block hinzu, richten Sie `docusaurusCatalogDir` auf den Quellkatalog aus und führen Sie `docusaurus write-translations` aus. Checkliste: [i18n auf einer bestehenden Website aktivieren](/de/guide/integrations/docusaurus#enable-i18n-in-an-existing-site). Shell-JSON: [Shell-Strings](/de/guide/integrations/docusaurus#shell-strings-write-translations).

<a id="nextra"></a>
### Nextra

Verschieben Sie MDX unter `content/<sourceLocale>/`, fügen Sie `app/[lang]/` hinzu und fügen Sie das Quell-Wörterbuchmodul hinzu. Checkliste: [i18n auf einer bestehenden Website aktivieren](/de/guide/integrations/nextra#enable-i18n-in-an-existing-site). Der [Wörterbuch-Prompt](/de/guide/integrations/nextra#agent-prompt-dictionary-and-routes) ist der längere Durchlauf für dieselbe Verdrahtung. App React, die `t()` benötigt: [Hybrid-Prompt](/de/guide/integrations/nextra#optional-t-for-app-react-hybrid).

<a id="fumadocs"></a>
### Fumadocs

Fügen Sie `defineI18n`, `app/[lang]/` und die Middleware hinzu. Gleichen Sie `fumadocsParser` mit `dot` oder `dir` ab. Checkliste: [i18n auf einer bestehenden Website aktivieren](/de/guide/integrations/fumadocs#enable-i18n-in-an-existing-site). Der [UI-Katalog-Prompt](/de/guide/integrations/fumadocs#agent-prompt) verdrahtet `i18n.translations()`, nachdem die Routen existieren.

<a id="astro-starlight"></a>
### Astro Starlight

Fügen Sie `locales` hinzu, einschließlich `root`, wenn die Ausgangssprache nicht präfixiert ist. Seiten bleiben in `src/content/docs/`. Checkliste: [i18n auf einer bestehenden Website aktivieren](/de/guide/integrations/astro#enable-i18n-in-an-existing-site). Starlight liefert eigene UI-Strings. Bevorzugen Sie `slug`-Seitenleisteneinträge.

<a id="plain-astro"></a>
### Plain Astro

Aktivieren Sie Astros `i18n.locales` und fügen Sie, wenn das Seiten-HTML übersetzt werden soll, den `docs`-Block von [Plain Astro](/de/guide/integrations/astro#plain-astro-marketing-and-app-sites) hinzu. Frontmatter `t()`-Aufrufe verwenden den [JS/TS-Prompt](/de/guide/add-i18n-to-js#run-the-agent-prompt), ohne i18next zu installieren. Astro löst `t` zur Build-Zeit auf.

<a id="plain-html"></a>
### Einfaches HTML

Zwei Optionen, und eine Datei gehört zu einer davon:

- Eine Seite, die die Sprache im Browser wechselt: `ui-plain-html`. Führen Sie `ai-i18n-tools mark-html` aus (Trockenlauf, dann `--write`) und laden Sie `i18n.js`. Siehe [Einfache HTML-Anwendungen](/de/guide/ui-strings/plain-html).
- Eine übersetzte HTML-Datei pro Gebietsschema: `docs-plain-html`. Siehe [HTML-Seiten](/de/guide/documents/html-pages).

Das ist der letzte manuelle Schritt. Fahren Sie fort unter [Modelle auswählen und übersetzen](#choose-models-and-translate).

<a id="not-your-case"></a>
## Nicht Ihr Fall?

| Sie haben | Lesen Sie |
| --- | --- |
| UI-Strings der App | [i18n zu einer JS/TS-App hinzufügen](/de/guide/add-i18n-to-js) oder [i18n zu einer Python-App hinzufügen](/de/guide/add-i18n-to-python) |
| Django, Flask-Babel-Kataloge oder eine App, die bereits GNU gettext verwendet | [i18n zu einer Django-/Python-gettext-App hinzufügen](/de/guide/add-i18n-to-django-gettext) |
| Eine Repository-README neben der Website oder Markdown-Dateien ohne Website-Framework | [i18n zu Ihren README- und Markdown-Dokumenten hinzufügen](/de/guide/add-i18n-to-readme). `init … --with-readme` fügt diesen Block neben einer Website-Vorlage hinzu |
| Eigenständiges verschachteltes Gebietsschema-JSON | [JSON](/de/guide/json) |
| Eine Website und App-Strings in einer Konfiguration | [Pipelines kombinieren](/de/guide/combining-pipelines) |

Referenz für die gemeinsamen Optionen und frameworkspezifische Unterschiede: [Integrationen](/de/guide/integrations/).

<a id="examples"></a>
## Beispiele

| Beispiel | Was es zeigt |
| --- | --- |
| [vitepress-docs](/de/examples#vitepress-docs) | VitePress-Seiten und der Themenkatalog |
| [docusaurus-docs](/de/examples#docusaurus-docs) | Docusaurus-Seiten und Shell-JSON |
| [astro-docs](/de/examples#astro-docs) | Starlight-Seiten |
| [nextra-docs](/de/examples#nextra-docs) | Nextra 4-Routen und das Wörterbuch |
| [fumadocs-docs](/de/examples#fumadocs-docs) | Fumadocs-Routen und der UI-Katalog |
| [astro-website](/de/examples#astro-website) | Astro-Landingpage, HTML plus `t()` |
| [plain-html](/de/examples#plain-html) | Eine HTML-Datei, `data-i18n`-Marker |
| [plain-html-docs](/de/examples#plain-html-docs) | Eine HTML-Datei pro Gebietsschema |

Kopieren Sie eines mit `npx degit`. Befehle: [Beispiele](/de/examples#nodejs-examples).
