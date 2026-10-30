<a id="nextra-integration"></a>
# Nextra-Integration

Verwenden Sie `init -t ui-nextra` und `docsOutput.style: "nextra"` für [Nextra](https://nextra.site/) 4-Dokumentationsseiten auf dem Next.js App Router. Das Preset ist ein Alias für `doc-system` mit einem leeren `localeSubpath` und beibehaltenen BCP-47-Gebietsschema-Ordnernamen (`localePathLowercase` ist standardmäßig `false`, sodass Ordner `pt-BR`, `zh-Hans` usw. bleiben).

Siehe auch [Dokumente](/de/guide/documents/) und die ausführbare Demo [examples/nextra-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs/).

<a id="quick-start"></a>
## Schnellstart

```bash
ai-i18n-tools init -t ui-nextra -P gemini
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm run build       # Next.js build (project-specific script)
```

Aktivieren Sie `features.translateDocs`, wenn Sie Seiteninhalte, `_meta.ts`-Seitenleistenbeschriftungen und Theme-Wörterbuchmodule in einem `sync`-Lauf übersetzen.

<a id="page-layout"></a>
## Seitenlayout

Nextra 4 mit i18n speichert das **MDX der Quell-Locale in einem Locale-Ordner** (typischerweise `content/en/`, wenn Englisch die Quelle ist). `sourceLocale` kann jede Sprache sein. Übersetzte Kopien werden in gleichrangige Locale-Ordner geschrieben:

```text
content/en/index.mdx              →  content/pt-BR/index.mdx
content/en/guide/getting-started.mdx  →  content/zh-Hans/guide/getting-started.mdx
```

Konfigurieren Sie einen `docs[]`-Block:

```json
{
  "contentPaths": ["content/en"],
  "outputDir": "content",
  "docsOutput": {
    "style": "nextra",
    "docsRoot": "content/en",
    "rewriteNextraLinks": true
  }
}
```

Zeigen Sie `contentPaths` auf die in `sourceLocale` geschriebenen `.mdx`-Dateien und -Verzeichnisse. Diese Sprache kann jede Sprache sein. Setzen Sie `docsRoot` auf den Quell-Locale-Ordner innerhalb von `content/` (zum Beispiel `content/en`, wenn Englisch die Quelle ist).

Verbinden Sie die Nextra-[Internationalisierung](https://nextra.site/docs/guide/i18n): Setzen Sie `i18n.locales` und `defaultLocale` in `next.config` und halten Sie `targetLocales` in `ai-i18n-tools.config.json` mit diesen Gebietsschema-Codes und den `content/{locale}/`-Ordnernamen übereinstimmend.

<a id="enable-i18n-in-an-existing-site"></a>
### i18n auf einer bestehenden Site aktivieren

Eine Nextra 4-Website, die nur auf Englisch ist, benötigt einen Locale-Ordner, einen Routenparameter und die Next.js i18n-Konfiguration, bevor `translate-docs` einen Ort zum Schreiben hat. Die Ersteinrichtung verwendet die Eingabeaufforderung unter [i18n zu einer Website oder Dokumentationsseite hinzufügen](/de/guide/add-i18n-to-website#run-the-agent-prompt). Die [Wörterbuch-Eingabeaufforderung](#agent-prompt-dictionary-and-routes) ist die detaillierte Nachbereitung für dieselben Routen und dasselbe Wörterbuch. Checkliste:

- Verschieben Sie MDX nach `content/en/` (Englisch ist ein Locale-Ordner, nicht das Inhalts-Root).
- `i18n.locales` und `defaultLocale` in `next.config`.
- Eine `app/[lang]/`-Route, `getPageMap('/${lang}')` und `<Layout i18n={…}>`.
- `app/_dictionaries/en.ts` plus `get-dictionary.ts`, übergeben an `<Layout>`, `<Navbar>` und `<Footer>`.
- Optionales `proxy.ts`, das `nextra/locales` re-exportiert (siehe [Optionaler Locale-Proxy](#optional-locale-proxy)).
- `targetLocales` ausgerichtet an diesen Locale-Codes, dann `sync`.

<a id="theme-strings"></a>
## Theme-Strings

Nextra-Theme-Strings (`editLink`, Suchplatzhalter, Fußzeile usw.) werden nicht aus Markdown extrahiert. Erstellen Sie englische Zeichenfolgen in einem TypeScript-Wörterbuchmodul (zum Beispiel `app/_dictionaries/en.ts`) und übersetzen Sie es innerhalb von `translate-docs`:

```json
{
  "features": {
    "translateDocs": true
  },
  "docs": [
    {
      "contentPaths": ["content/en"],
      "outputDir": "content",
      "nextraDictionaryPath": "app/_dictionaries/en.ts",
      "docsOutput": {
        "style": "nextra",
        "docsRoot": "content/en"
      }
    }
  ]
}
```

Das Tool schreibt `app/_dictionaries/{locale}.ts` (Standardvorlage: `{dir}/{locale}.ts`). Laden Sie das Modul pro Gebietsschema in `app/_dictionaries/get-dictionary.ts` und übergeben Sie übersetzte Zeichenfolgen an `<Layout>`, `<Search>`, `<Footer>` und verwandte Theme-Komponenten.

Verwenden Sie **nicht** `json[]` für Nextra-Theme-Wörterbuchzeichenfolgen – dieses Muster ist nur für nicht verwandte App-Gebietsschema-Bundles vorgesehen.

<a id="sidebar-labels-_metats"></a>
## Seitenleistenbeschriftungen (`_meta.ts`)

Nextra 3+ verwendet TypeScript-Dateien `_meta.ts` / `_meta.tsx` für die Sidebar-Struktur und Titel. Wenn `docsOutput.style` `"nextra"` ist, sammelt `translate-docs` automatisch `_meta.ts`, `_meta.tsx` und `_meta.js` unter `docsRoot`, übersetzt Zeichenfolgenliterale in der `export default { … }`-Meta-Map und schreibt gespiegelte Dateien unter `content/{locale}/**`.

**Empfohlenes Muster:** Englische Literale inline in `content/en/**/_meta.ts` beibehalten (wie bei [swr-site](https://github.com/shuding/nextra/tree/main/examples/swr-site)):

```text
content/en/_meta.ts           English sidebar labels (source)
content/pt-BR/_meta.ts        Translated copy (generated by translate-docs)
```

Optional: Überschreiben Sie die Sammlung mit `docs[].nextraMetaGlob` oder beschränken Sie übersetzbare Eigenschaftsnamen mit `docs[].nextraMetaTranslatableKeys` (Standard: `title`, `display`, `breadcrumb`).

Erstellen Sie **keine** JSON-Sidecars (`i18n/meta.en.json`) oder dünne `_meta.ts`-Dateien, die übersetztes JSON importieren – generieren Sie Gebietsschema-`_meta`-Dateien mit `sync` / `translate-docs` neu, wenn sich das Englische ändert.

<a id="example-project"></a>
## Beispielprojekt

[Beispiele/Nextra-Dokumente](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs/) — Englische Quellen unter `content/en/`, festgeschriebene `pt-BR`- und `zh-Hans`-Seitenbäume, Inline-`_meta.ts`-Dateien und `app/_dictionaries/{locale}.ts`. Eine Serverkomponente (`app/_components/feedback-links.tsx`) verwendet `t()` über einen Flat-Bundle-Lookup, sodass benutzerdefinierte Shell-Strings neben dem Wörterbuch liegen können. Führen Sie `pnpm run dev` auf Port 3070 aus.

<a id="agent-prompt-dictionary-and-routes"></a>
## Agent-Prompt: Wörterbuch und Routen

Verwenden Sie dies, wenn die Site noch hartcodierte Layout-Strings und keinen `content/en/`-Baum hat. Es folgt dem Standardpfad (Wörterbuch + `_meta.ts` + `translate-docs`). Es führt kein `t()` ein.

<details class="agent-prompt">
<summary>Wörterbuch- und Routen-Prompt</summary>

````markdown
# Add Nextra 4 i18n with a theme dictionary

## Context

ai-i18n-tools translates Nextra page bodies, `_meta.ts` object literals, and the
theme dictionary module (`nextraDictionaryPath`, usually
`app/_dictionaries/en.ts`) with `translate-docs`. The English sentence in that
dictionary is the source text. Do not translate strings yourself. Reference:
https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs

## Scope

Edit `next.config`, `app/[lang]/layout.tsx`, `app/_dictionaries/en.ts`,
`app/_dictionaries/get-dictionary.ts`, and move MDX under `content/en/`. Skip
`docsRepositoryBase` (a URL). Keep native language names in a `LOCALE_LABELS`
map untranslated (`English`, `Português (Brasil)`). Do not move `_meta.ts`
sidebar labels into the dictionary or into `t()`.

## Call shape

- `next.config`: `i18n.locales` and `defaultLocale`.
- English MDX and `_meta.ts` live under `content/en/`. `getPageMap('/${lang}')`
  loads the matching tree.
- `app/_dictionaries/en.ts` exports the English shell strings (`siteTitle`, `footer`,
  `editLink`, search placeholder, table-of-contents title, last-updated label).
  `get-dictionary.ts` dynamically imports `./${locale}`.
- Pass those fields into `<Layout>`, `<Navbar>`, and `<Footer>`. Set
  `<Layout i18n>` from `LOCALE_LABELS`.
- Config: `features.translateDocs`, `docsOutput.style: "nextra"`,
  `docsRoot: "content/en"`, `nextraDictionaryPath: "app/_dictionaries/en.ts"`.
  `targetLocales` matches `i18n.locales` except the default locale.

## Order

1. Route, config, and dictionary wiring.
2. Move existing MDX into `content/en/` and point `contentPaths` at that folder.
3. Ask the user to run `sync`. Do not write `app/_dictionaries/pt-BR.ts` or
   `content/pt-BR/` by hand.

## Do not

- Do not translate, rename, or reword the English dictionary strings.
- Do not add `t()`, `getRequestConfig`, or a `dictionary.ts` filename. The
  English module is `app/_dictionaries/en.ts`.
- Do not duplicate a string in both the dictionary and a later `t()` call.
- Do not hand-edit generated locale dictionaries or locale `_meta.ts` files.

## Verify

- `pnpm build` passes.
- `/` shows the English dictionary strings. After `sync`, one non-English route
  shows translated shell strings and page titles.
- Sidebar labels come from `content/en/**/_meta.ts`, not from the dictionary.

## Report back

List files changed, each layout string you left untranslated and why (URLs,
native language names), and any MDX you were not sure belonged under
`content/en/`.
````

</details>

<a id="optional-t-for-app-react-hybrid"></a>
## Optional: `t()` für `app/` React (Hybrid)

**Standard:** `_meta.ts`-Objektliterale und `app/_dictionaries/en.ts` werden von `translate-docs` übersetzt. Für diese Shell-Strings ist kein `t()` erforderlich.

**Optionaler Hybrid:** Benutzerdefinierte Serverkomponenten können `t("source sentence")` und `translate-ui` aufrufen. Der Satz ist in `sourceLocale` geschrieben, was jede Sprache sein kann. Kopieren Sie keine Wörterbuch-Strings oder `_meta.ts`-Titel in diese Aufrufe. `extract` sieht nur Literale innerhalb von `t()`, daher sollte `ui.sourceRoots` nur die Ordner auflisten, die diese Aufrufe enthalten (das Beispiel verwendet `app/_components`), nicht `app/_dictionaries`.

Ein i18next-Singleton auf Modulebene mit `changeLanguage` ist in einer Serverkomponente unsicher: gleichzeitige Anfragen teilen es sich. Das Beispiel verwendet stattdessen einen zustandslosen Lookup. `getT(lang)` lädt `locales/{lang}.json` für eine Ziel-Locale, behandelt die Quellroute als leeres Bundle (das englische Literal ist bereits der Text) und interpoliert mit `interpolateTemplate` aus `ai-i18n-tools/runtime`. Platzhalter sind <code v-pre>{{name}}</code> mit ASCII-Wortschlüsseln. Dies ist die gleiche Idee wie [examples/astro-website/src/i18n/t.ts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/astro-website/src/i18n/t.ts).

Dieser Lookup wählt keine Pluralformen aus. Eine Komponente, die `plurals: true` benötigt, sollte den i18next-Pfad von [i18next verdrahten](/de/guide/ui-strings/i18next-runtime) in einer Client-Komponente oder einen pro-Anfrage-`createInstance()` verwenden.

Konfiguration für den Hybrid, neben dem bestehenden Docs-Block:

- `features.translateUIStrings`
- `ui.sourceRoots` – Ordner, die `t()`-Aufrufe enthalten
- `ui.stringsJson`
- `ui.flatOutputDir`

Das `sourceLocale` des Beispiels ist `en-GB` und die Site-Route ist `en`. Mit dem zustandslosen Lookup benötigt die `en`-Route kein Bundle, sodass diese Diskrepanz keine Rolle spielt. Es spielt nur eine Rolle, wenn Sie diese Komponente auf den i18next-Bootstrap umstellen, der Bundles nach `sourceLocale` schlüsselt.

| Inhalt | Standard-Pipeline | Optionale Alternative |
|---------|------------------|----------------------|
| MDX-Seiteninhalte | `translate-docs` | — |
| `_meta.ts` / `_meta.tsx` Objekttitel | `translate-docs` | Refaktorierung zu `t()` in JSX (Hybrid) |
| `app/`-Layout, `_components/` | `nextraDictionaryPath` + Wörterbuch `.ts` | `t()` + `translate-ui` |

Siehe `app/_components/feedback-links.tsx` und `lib/ui-t.ts` in [examples/nextra-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs/). `pnpm run i18n:sync-ui` in diesem Beispiel führt Extraktion und `translate-ui` aus, ohne die Docs-Pipeline zu beeinflussen.

**Beispiel-KI-Agenten-Prompt** (in Cursor oder einen anderen Coding-Agenten kopieren, wenn `t()` neben dem Wörterbuch hinzugefügt wird):

<details class="agent-prompt">
<summary>Hybrid t()-Prompt</summary>

````markdown
# Add a stateless t() lookup to a Nextra 4 server component

## Context

MDX pages, `_meta.ts`, and `app/_dictionaries/en.ts` stay on `translate-docs`.
Do not duplicate those strings in `t()`. This task adds `t("source sentence")`
only in custom components that the dictionary does not cover. The literal is the
catalog key and is written in `sourceLocale`, which can be any language. Do not translate any string.

Follow `lib/ui-t.ts` and `app/_components/feedback-links.tsx` in
https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs

## Scope

Edit the named components and `ai-i18n-tools.config.json`. Do not edit
`app/_dictionaries`, `content/**/_meta.ts`, or generated locale trees. Skip
URLs, native language names, and `docsRepositoryBase`.

## Call shape

Create `lib/ui-t.ts`. `getT(lang)` loads `locales/{lang}.json` through a
dynamic-import map for target locales, uses an empty bundle for the source
route, and returns
`(source, vars) => interpolateTemplate(flat[source] ?? source, vars ?? {})` with
`interpolateTemplate` imported from `ai-i18n-tools/runtime`.

Replace hardcoded sentences in the named server components with `t("source sentence")`. The sentence is written in `sourceLocale`, which can be any language.
A placeholder is `t("You are reading {{page}}.", { page })`.

Do not use `getRequestConfig` (that is a next-intl API) and do not call
`changeLanguage` on a shared i18next instance. This lookup does not resolve
plurals. Leave plural copy on the i18next client path.

Set `features.translateUIStrings`, `ui.sourceRoots` to only the folders that
contain `t()` calls, `ui.stringsJson`, and `ui.flatOutputDir`.

## Order

1. Add `lib/ui-t.ts` and the `t()` calls.
2. Set the four `ui` config keys.
3. Run `ai-i18n-tools extract` (or `sync-ui`). Do not hand-write
   `locales/*.json`.

## Do not

- Do not translate, rename, or reword the source sentences.
- Do not put `t()` keys in `app/_dictionaries` or move `_meta.ts` titles into
  `t()`.
- Do not hand-edit `strings.json` or flat locale files.
- Do not change layout or Nextra theme props that already receive dictionary
  strings.

## Verify

- `extract` writes a non-empty catalog containing the new sentences and nothing
  from the dictionary.
- The project build passes.
- The source route still shows the English sentences. After `translate-ui`, one
  non-English route renders the translated component.

## Report back

List files changed, each string you left in the dictionary on purpose, and any
plural or server-concurrency case you did not convert.
````

</details>

<a id="link-conventions"></a>
## Link-Konventionen

Nextra bedient lokal-präfixierte Routen über Next.js `i18n` (`/guide/getting-started`, `/pt-BR/guide/getting-started`). **Links innerhalb der Seite sollten lokal-neutral bleiben** (`/guide/getting-started`), damit Next.js das aktive Gebietsschema automatisch präfixieren kann.

Aktivieren Sie den integrierten Normalisierer, damit `translate-docs` Links in jeder übersetzten Datei automatisch korrigiert:

```json
"docsOutput": {
  "style": "nextra",
  "docsRoot": "content/en",
  "rewriteNextraLinks": true
}
```

`rewriteNextraLinks` ist standardmäßig aktiviert, wenn `style` `"nextra"` ist.

| In der Quell-Locale erstellen | Nach dem Normalisierer |
|--------------------------|------------------------|
| `[Guide](content/en/guide/getting-started.mdx)` | `[Guide](/de/guide/getting-started)` |
| `[Guide](/de/guide/getting-started.mdx)` | `[Guide](/de/guide/getting-started)` |
| `[Demo](https://github.com/org/repo)` | unverändert (vollständige URL) |

**Regeln für die Erstellung**

- Dokumentationslinks über mehrere Seiten hinweg: Verwenden Sie **Locale-neutrale Website-Routen** (`/guide/…`) in englischem MDX oder `content/en/…` / relative `.mdx`-Pfade und lassen Sie den Normalisierer sie während `sync` umschreiben.
- Repo-Dateien außerhalb des Inhaltsbaums: Verwenden Sie **vollständige URLs**.
- Bearbeiten Sie Links in `content/<locale>/` **nicht** manuell — generieren Sie sie mit `sync` / `translate-docs` neu.

<a id="optional-locale-proxy"></a>
## Optionaler Locale-Proxy

Nextra bietet einen Locale-Erkennungs-Proxy für i18n-Sites. Exportieren Sie ihn aus `proxy.ts` in Ihrem Projekt-Root:

```ts
export { proxy } from 'nextra/locales'

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|manifest|_pagefind).*)',
  ],
}
```

**Website-Locale-Codes vs. `sourceLocale`:** Nextra und Next.js verwenden kurze Routencodes (`en`, `pt-BR`, `zh-Hans`) in `next.config`, `content/{locale}/` und dem `NEXT_LOCALE`-Cookie. `sourceLocale` in `ai-i18n-tools.config.json` kann ein BCP-47-Tag sein, wie zum Beispiel `en-GB` für die Übersetzungsqualität — dieser Tag ist **keine** Website-Route. Wenn das Browser-Cookie oder `Accept-Language` zu einem Tag außerhalb von `i18n.locales` auflöst (zum Beispiel `en-GB`, wenn nur `en` konfiguriert ist), kann Nextras Standard-Proxy in einer Schleife weiterleiten. Die Demo [examples/nextra-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs/) umschließt `nextra/locales`, um ungültige Cookies und Pfade auf die Standard-Website-Locale zurückzusetzen, bevor sie delegiert.

Dies funktioniert nicht mit `output: 'export'` statischen Exporten. Siehe [Nextra i18n docs](https://nextra.site/docs/guide/i18n).

Siehe auch [Konfiguration – `docsOutput`](/de/reference/configuration#docsoutput) und [Ausgabe-Layouts](/de/guide/documents/output-layouts).
