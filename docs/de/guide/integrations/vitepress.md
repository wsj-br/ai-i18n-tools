<a id="vitepress-integration"></a>
# VitePress-Integration

Verwenden Sie `init -t ui-vitepress` und `docsOutput.style: "vitepress"` für [VitePress](https://vitepress.dev/)-Dokumentationsseiten. Das Preset ist ein Alias für `doc-system` mit einem leeren `localeSubpath` und beibehaltenen BCP-47-Gebietsschema-Ordnernamen (`localePathLowercase` ist standardmäßig `false`, sodass Ordner `pt-BR`, `zh-Hans` usw. bleiben).

Siehe auch [Dokumente](/de/guide/documents/) und die ausführbare Demo [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/). Die eigene Dokumentationsseite dieses Repositorys unter `docs/` ist eine vollständige VitePress + ai-i18n-tools-Referenz (neun Gebietsschemas, Themenkatalog, GitHub Pages).

<a id="quick-start"></a>
## Schnellstart

```bash
ai-i18n-tools init -t ui-vitepress -P anthropic
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm run docs:build  # VitePress build (project-specific script)
```

Aktivieren Sie `features.translateDocs`, wenn Sie Seiteninhalte und VitePress-Chrome-Strings in einem `sync`-Lauf übersetzen.

<a id="page-layout"></a>
## Seitenlayout

Englisches Markdown befindet sich im VitePress-Inhaltsstammverzeichnis (typischerweise `docs/`). Übersetzte Kopien werden neben dem Quellbaum geschrieben:

```text
docs/index.md           →  docs/de/index.md
docs/guide/quick-start.md  →  docs/de/guide/quick-start.md
```

Konfigurieren Sie einen `docs[]`-Block:

```json
{
  "contentPaths": ["docs/index.md", "docs/guide"],
  "outputDir": "docs",
  "docsOutput": {
    "style": "vitepress",
    "docsRoot": "docs",
    "rewriteVitepressLinks": true
  }
}
```

Richten Sie `contentPaths` auf die in `sourceLocale` geschriebenen `.md`-Dateien und -Verzeichnisse. Diese Sprache kann jede beliebige Sprache sein. Setzen Sie `docsRoot` auf denselben Ordner, den VitePress als Inhaltsstammverzeichnis verwendet.

Verknüpfen Sie die VitePress-[Internationalisierung](https://vitepress.dev/guide/i18n): das Quell-Locale unter `root`, jedes Ziel-Locale unter `locales[code].link` (zum Beispiel `/pt-BR/`). Halten Sie `targetLocales` in `ai-i18n-tools.config.json` mit den `locales`-Schlüsseln in `.vitepress/config.mts` synchron.

<a id="enable-i18n-in-an-existing-site"></a>
### i18n auf einer bestehenden Site aktivieren

Eine rein englische VitePress-Konfiguration benötigt diese Teile, bevor übersetzte Seiten angezeigt werden. Die [Agentenaufforderung](#wire-configmts-to-generated-theme-json-one-off) deckt die Hälfte des Theme-Katalogs ab.

- `locales.root` für Englisch (`label`, `lang` und `themeConfig`).
- Ein `locales[code]`-Eintrag pro Ziel-Locale: `label`, `lang`, `link: '/${code}/'` und pro-Locale `title` / `description`.
- `themeConfig`-Links und `activeMatch`, pro Locale mit `prefixVitepressThemeConfigLinks` präfixiert (siehe [Theme-Navigations-/Sidebar-Links](#theme-navsidebar-links)).
- `targetLocales` synchronisiert mit diesen `locales`-Schlüsseln, dann `sync`, damit `docs/<locale>/` und `theme.<locale>.json` existieren.

<a id="theme-strings"></a>
## Theme-Strings

VitePress-Navigation, Sidebar, Footer, Suchplatzhalter und andere `themeConfig`-Beschriftungen werden nicht aus Markdown extrahiert. Konfigurieren Sie **`docsOutput.vitepressThemeCatalog`** so, dass **`translate-docs`** den Quell-Locale-Katalog aus `.vitepress/config.mts` bootstrappt (wenn Zeichenfolgen inline sind) und Locale-Theme-JSON-Dateien übersetzt:

```json
{
  "features": {
    "translateDocs": true
  },
  "docs": [
    {
      "contentPaths": ["docs/index.md", "docs/guide"],
      "outputDir": "docs",
      "docsOutput": {
        "style": "vitepress",
        "docsRoot": "docs",
        "vitepressThemeCatalog": {
          "configPath": "docs/.vitepress/config.mts",
          "catalogPath": "docs/.vitepress/i18n/theme.en.json"
        }
      }
    }
  ]
}
```

- **`catalogPath`** – Englisches verschachteltes JSON. Der Bootstrap von `config.mts` gilt nur, solange diese englischen Zeichenfolgen noch inline in der Konfiguration sind. Nachdem `themeConfigFor` den Katalog gelesen hat, behält `mergeThemeCatalogs` die bestehende Datei bei, und `theme.en.json` ist die Quelle der Wahrheit. Bearbeiten Sie diese Datei, wenn sich die Formulierung ändert (oder legen Sie das Englische für ein `sync` zurück in `config.mts`). Das Umbenennen eines Schlüssels ändert den Segment-Hash (`path`, ein NUL-Byte, dann der Wert), sodass das nächste `sync` diese Zeichenfolge einmal für jedes Ziel-Locale neu übersetzt.
- **`outputPathTemplate`** (optional) – Ausgaben pro Locale; Standard: dasselbe Verzeichnis wie `catalogPath` mit `theme.{locale}.json`.

`init -t ui-vitepress` erstellt auch Start-`docs/.vitepress/config.mts` und `docs/.vitepress/i18n/theme.en.json`, wenn diese Dateien noch nicht existieren. Die Konfiguration lädt den Katalog über `loadTheme()` und verbindet Standard-VitePress-i18n-Beschriftungen (einschließlich `langMenuLabel`) in `themeConfigFor()`.

Laden Sie die pro-Gebietsschema-Datei in `.vitepress/config.mts` über `loadTheme()` und erstellen Sie `locales[code].themeConfig` aus dem übersetzten JSON. Siehe [examples/vitepress-docs/docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts).

**Sprachmenü-Zeichenfolgen:** `locales[code].label` ist der sichtbare Name jeder Sprache im Dropdown-Menü (zum Beispiel `Português (Brasil)`). `themeConfig.langMenuLabel` ist das **aria-label** auf der Sprachwechsler-Schaltfläche. VitePress verwendet `Change language`, wenn die Option weggelassen wird. Der Beispielkatalog speichert stattdessen `Language`, und sowohl `theme.en.json` als auch `config.hardcoded.example.mts` verwenden denselben Satz. Legen Sie `langMenuLabel` in den Theme-Katalog und verknüpfen Sie `langMenuLabel: t.langMenuLabel` innerhalb von `themeConfigFor()` — verwechseln Sie es nicht mit pro-Locale `label`-Zeichenfolgen.

Während `sync` / `translate-docs` warnt ai-i18n-tools, wenn ein Katalogschlüssel in `theme.en.json` nicht von `config.mts` referenziert wird (zum Beispiel ein fehlendes `t.langMenuLabel` in `themeConfigFor()`).

Verwenden Sie **nicht** `json[]` für VitePress-Theme-Strings – dieses Muster ist nur für nicht verwandte App-Gebietsschema-Bundles vorgesehen.

<a id="wire-configmts-to-generated-theme-json-one-off"></a>
## config.mts mit generiertem Theme-JSON verbinden (einmalig)

Nach dem ersten erfolgreichen `i18n:sync` / `translate-docs`-Lauf mit `vitepressThemeCatalog` hat das Repository `theme.en.json` und `theme.{locale}.json` generiert, aber eine **bestehende** Site kann immer noch hartcodierte `text:` / `message:`-Strings in `config.mts` haben. VitePress wird übersetztes JSON erst verwenden, wenn die Konfiguration es über `loadTheme()` lädt.

**Nicht im Tool-Umfang:** automatischer Codemod. Verwenden Sie die folgende Aufforderung einmal pro Projekt (oder refaktorieren Sie manuell anhand der Beispielkonfiguration).

1. **Wann** — nachdem die erste Synchronisierung `catalogPath` und die lokalen Themendateien erstellt hat; bevor eine übersetzte Navigation/Seitenleiste in der Entwicklung/Erstellung erwartet wird.
2. **Unverändert lassen** — Routenlinks (`/guide/…`), Gebietsschema-Schlüssel, `defineConfig`-Struktur, nicht-string-Optionen (Suchanbieter, eingeklappte Flags).
3. **Referenz** — [examples/vitepress-docs/docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts) und die generierte `theme.en.json`-Form.
4. **Überprüfen** — `pnpm docs:dev`, Gebietsschema in der Navigation wechseln, Bestätigung der Übersetzung von Seitenleiste/Fußzeile/Suchplatzhalter; `pnpm docs:build` besteht.

**Beispiel-KI-Agent-Prompt** (in Cursor oder einen anderen Code-Agent kopieren):

<details class="agent-prompt">
<summary>Aufforderung zum Theme-Katalog</summary>

````markdown
# Load VitePress theme strings from the catalog

## Context

ai-i18n-tools translates VitePress chrome through
`docsOutput.vitepressThemeCatalog`. `extractVitepressThemeCatalog` writes
positional keys while English is still inline in `config.mts`
(`themeConfig.nav.0.text`, `themeConfig.sidebar.0.items.0.text`,
`locales.root.label`). The runnable example uses stable names instead
(`nav.guide`, `sidebar.gettingStarted`, `site.title`):
https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts

Reshape to named keys once and keep those names. Renaming changes the segment
hash, so the next `sync` re-translates the theme catalog for every locale (a few
dozen short strings, once). After the refactor, `config.mts` has no inline
display literals, `mergeThemeCatalogs` keeps `theme.en.json`, and that file is
the source of truth. Do not tell the user to refresh the catalog from
`config.mts` after this edit.

`translate-docs` does not rewrite links in `config.mts`. Locale pages must
prefix `link` and `activeMatch` or they point at English routes.

## Scope

Edit `.vitepress/config.mts` and `theme.en.json` only. Skip markdown bodies,
route paths, `base`, search provider choice, collapsed flags, and external URLs.

## Call shape

Precondition: `docsOutput.vitepressThemeCatalog` is set and `sync` has already
written `catalogPath`. If `theme.en.json` is missing, stop and ask for that
`sync` first.

1. Add `ai-i18n-tools` as a devDependency. Import
   `prefixVitepressThemeConfigLinks` from `ai-i18n-tools`.
2. Add `loadTheme(localeFile)` that reads `docs/.vitepress/i18n/` via
   `import.meta.url` and `fileURLToPath`. If a locale file is missing
   (`fs.existsSync`), fall back to the English theme so a fresh checkout does
   not crash before the first translation.
3. Rename positional keys in `theme.en.json` to short stable names. Update
   `themeConfigFor` to read those names. Keep links and structure in TypeScript.
   Only display strings come from the catalog.
4. If you keep positional keys instead, read them with string indexes:
   `t.themeConfig.nav["0"].text`. A numeric index `nav[0]` is invisible to the
   unused-key check and warns for every nav and sidebar entry.
5. Wrap the object `themeConfigFor` returns with
   `prefixVitepressThemeConfigLinks(themeConfig, localeRoutePrefix)`. Pass
   `/${code}` for each target locale and `null` for root. That prefixes `link`
   and `activeMatch`.
6. Per locale entry: `label` (native language name), `lang`,
   `link: '/${code}/'`, and that locale's `title` and `description` from the
   catalog.
7. Keys the extractor does not collect must be added to `theme.en.json` by hand,
   then referenced from `themeConfigFor`. That includes local-search copy under
   `search.options.locales.<code>.translations` (`button.buttonText`,
   `modal.noResultsText`, and the rest of that tree). Current VitePress docs do
   not use `options.placeholder` for local search. Also add
   `socialLinks[].ariaLabel`. A `notFound.title` inline in config is collected
   because `title` is a known key; `notFound.quote`, `notFound.linkText`,
   `notFound.linkLabel`, and `notFound.code` are not.

## Order

1. Confirm the catalog file exists.
2. Reshape keys, wire `loadTheme` and `themeConfigFor`, prefix links.
3. Ask the user to run `sync` so locale theme files are regenerated from the new
   key names. Do not hand-translate them.

## Do not

- Do not translate strings yourself.
- Do not leave a second copy of the same label in `config.mts` and in
  `theme.en.json`.
- Do not hand-edit `theme.<locale>.json`.
- Do not change markdown paths, `base`, or the path of internal links (only the
  locale prefix).

## Verify

- `pnpm docs:dev`: English and one target locale show translated nav, sidebar,
  footer, and search chrome.
- A locale page's nav `link` and `activeMatch` include the locale prefix
  (`/pt-BR/guide/`, not `/guide/`).
- `pnpm docs:build` passes.
- Removing a locale theme file still builds, because `loadTheme` falls back to
  English.

## Report back

List files changed, the old path key and the new name for each rename, any
string you added by hand because the extractor skips it, and anything you left
inline on purpose.
````

</details>

<a id="example-project"></a>
## Beispielprojekt

[examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) — Englische Quellen unter `docs/`, festgeschriebene `pt-BR` und `zh-Hans` Seitenbäume, plus `theme.pt-BR.json` / `theme.zh-Hans.json`. Führen Sie `pnpm run docs:dev` auf Port 3060 aus.

<a id="readme-and-the-docs-homepage"></a>
## README und die Docs-Homepage

Downstream-Projekte kopieren manchmal `README.md` als `docs/index.md` in die VitePress-Site (über ein Build-Skript oder manuelle Synchronisierung). Dieses Muster teilt eine Datei zwischen GitHub und der Dokumentations-Site, aber die Linkregeln unterscheiden sich:

| Linktyp | Funktioniert auf GitHub | Funktioniert auf VitePress |
|-----------|-----------------|-------------------|
| `docs/guide/foo.md` | Ja | Nein — verwenden Sie Site-Routen oder lassen Sie den Normalisierer während der Synchronisierung umschreiben |
| `./LICENSE`, `examples/demo/` | Ja (Repo-relativ) | Nein — verwenden Sie **vollständige URLs** |
| `/guide/foo` | Nein | Ja |

**Empfehlung für synchronisiertes README → Index:** Verwenden Sie in `README.md` **vollständige URLs** für alles außerhalb des VitePress-Inhaltsbaums (`LICENSE`, `examples/`, Konfigurationsdateien, Agent-Kontextdateien) und für übersetzte README-Kopien unter `translated-docs/`. Verwenden Sie `docs/guide/…`-Pfade (oder Site-Routen in englischen Dokumenten unter `docs/`) für In-Site-Dokumentationslinks; ein Synchronisierungsskript oder `rewriteVitepressLinks`-Normalisierer kann diese in `/guide/…`-Routen konvertieren.

**Dieses Repository** hält `README.md` und `docs/index.md` als **unabhängige Dateien**: README ist eine prägnante GitHub-/npm-Landingpage; `docs/index.md` ist der Einstiegspunkt der Dokumentationsseite, der auf `/guide/` und `/reference/` verweist. Detaillierte Anleitungen finden Sie unter `docs/` – duplizieren Sie kein langes Referenzmaterial in der README. Aktualisieren Sie jede Datei entsprechend ihrer Zielgruppe, wenn sich gemeinsame Fakten ändern.

Beispiel-Links für ein synchronisiertes README in einem anderen Projekt:

```markdown
[console-app demo](https://github.com/your-org/your-repo/tree/main/examples/console-app/)
[License](https://github.com/your-org/your-repo/blob/main/LICENSE)
[Quick start](/de/guide/quick-start)
```

<a id="link-conventions"></a>
## Link-Konventionen

VitePress stellt englische Seiten aus dem Inhaltsstamm und Lokalisierungskopien aus `docs/<locale>/…` bereit, aber **Links innerhalb der Seite müssen Site-Routen verwenden** (`/guide/quick-start`, `/reference/configuration`) – nicht repo-relative Pfade wie `docs/guide/quick-start.md` oder `../guide/quick-start.md`. Diese README-ähnlichen Pfade funktionieren in GitHub, brechen aber innerhalb von VitePress (404 in der Entwicklung und auf GitHub Pages).

Aktivieren Sie den integrierten Normalisierer, damit `translate-docs` Links in jeder übersetzten Datei automatisch korrigiert:

```json
"docsOutput": {
  "style": "vitepress",
  "docsRoot": "docs",
  "rewriteVitepressLinks": true
}
```

`rewriteVitepressLinks` ist standardmäßig aktiviert, wenn `style` `"vitepress"` ist.

| Autor im Quell-Locale | Nach Normalisierer (Quell-Locale-Root-Ausgabe) | Nach Normalisierer (übersetzte `docs/<locale>/`-Ausgabe) |
|--------------------------|----------------------------------------|------------------------------------------------------|
| `[JSON](/de/guide/json)` | `[JSON](/de/guide/json)` | `[JSON](/pt-BR/guide/json)` (Locale-Präfix stimmt mit Ordner überein) |
| `[Quick start](/de/guide/quick-start)` im Text oder `hero.actions[].link` | unverändert (`/guide/quick-start`) | `/pt-BR/guide/quick-start` |
| `[Home](./README.md)` im Gebietsschema-Index | `/` | `/pt-BR/` |
| `hero.image.src: /ai-i18n-tools_logo.svg` | unverändert | unverändert (gemeinsames `docs/public/`-Asset) |
| `[Demo](https://github.com/org/repo/tree/main/examples/console-app/)` | unverändert (vollständige URL) | unverändert (vollständige URL) |

Quell-Locale-Dateien unter `docs/` behalten **Locale-neutrale** Site-Routen (`/guide/…`) bei. Dieses Beispiel verwendet Englisch als `sourceLocale`. Jede Sprache ist gültig. Dateien, die nach `docs/<locale>/…` geschrieben werden, erhalten automatisch das Locale-Präfix auf internen Inhaltsrouten — einschließlich **Home-Layout-Frontmatter** (`hero.actions[].link`, `features[].link`, `prev`/`next`). Gemeinsame öffentliche Assets wie `/ai-i18n-tools_logo.svg` und `/translation-dashboard.png` bleiben in jedem Locale unpräfixiert.

<a id="theme-navsidebar-links"></a>
### Theme-Navigations-/Seitenleisten-Links

`translate-docs` schreibt Links in `.vitepress/config.mts` **nicht** um. Navbar- und Seitenleisten-`link`-Werte werden einmal in TypeScript erstellt und müssen pro Gebietsschema zur Konfigurations-Build-Zeit mit einem Präfix versehen werden.

VitePress [`themeConfig.i18nRouting`](https://vitepress.dev/reference/default-theme-config#i18nrouting) steuert nur den **Gebietsschema-Umschalter** (ordnet die entsprechende Seite zu, wenn der Benutzer eine andere Sprache wählt). Es schreibt **keine** statischen `nav`- / `sidebar`-hrefs auf der aktuellen Gebietsschema-Seite um.

Verwenden Sie `prefixVitepressThemeConfigLinks` von `ai-i18n-tools` (dieselben Präfixregeln wie beim Umschreiben von Markdown-Links):

```typescript
import { prefixVitepressThemeConfigLinks } from "ai-i18n-tools";

function themeConfigFor(t: ThemeCatalog, localeCode: string | null = null) {
  const localeRoutePrefix = localeCode ? `/${localeCode}` : null;
  return prefixVitepressThemeConfigLinks(
    {
      nav: [{ text: t.nav.guide, link: "/guide/getting-started", activeMatch: "/guide/" }],
      sidebar: [/* … locale-neutral /guide/… links … */],
      /* footer, search, etc. */
    },
    localeRoutePrefix
  );
}

// root English
themeConfig: themeConfigFor(enTheme)

// each target locale
themeConfig: themeConfigFor(theme, code)
```

Fügen Sie **`activeMatch`** neben **`link`** ein Präfix hinzu, damit die Navigationshervorhebung auf Gebietsschema-Routen funktioniert (`/pt-BR/guide/`, nicht `/guide/`). Externe URLs und gemeinsam genutzte öffentliche Assets bleiben unverändert.

Fügen Sie `ai-i18n-tools` als **devDependency** im VitePress-Projekt (siehe `examples/vitepress-docs/package.json`) hinzu, damit `config.mts` `prefixVitepressThemeConfigLinks` importieren kann. Die Hauptdokumentationsseite von ai-i18n-tools importiert direkt von `src/processors/…`, da sie den Monorepo-Checkout selbst nutzt; eigenständige Kopien (degit) sollten das npm-Paket verwenden.

**Regeln für die Erstellung**

- Seitenübergreifende Dokumentationslinks: Verwenden Sie **Site-Routen** (`/guide/…`, `/reference/…`) in englischem Markdown unter `docs/` oder `docs/guide/…`-Pfade, wenn Sie eine README-Datei verfassen, die in einem anderen Projekt in `docs/index.md` synchronisiert wird.
- Ausführbare Demos, `LICENSE` und andere Repository-Dateien: Verwenden Sie **vollständige GitHub-URLs** in `README.md` und in der Dokumentation (siehe [README und die Dokumentations-Startseite](#readme-and-the-docs-homepage)).
- Bearbeiten Sie Links in `docs/<locale>/` **nicht** manuell — generieren Sie diese mit `sync` / `translate-docs` neu.

Siehe auch [Link-Umschreibung](/de/guide/images-and-screenshots/link-rewriting) (flat vs. VitePress) und [Konfiguration — `docsOutput`](/de/reference/configuration#docsoutput).
