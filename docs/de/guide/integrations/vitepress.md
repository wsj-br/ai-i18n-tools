<a id="vitepress-integration"></a>
# VitePress-Integration

Verwenden Sie `init -t ui-vitepress` und `docsOutput.style: "vitepress"` für [VitePress](https://vitepress.dev/)-Dokumentationsseiten. Das Preset ist ein Alias für `doc-system` mit einem leeren `localeSubpath` und beibehaltenen BCP-47-Gebietsschema-Ordnernamen (`localePathLowercase` ist standardmäßig `false`, sodass Ordner `pt-BR`, `zh-Hans` usw. bleiben).

Siehe auch [Dokumente](/de/guide/documents/) und die ausführbare Demo [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/). Die eigene Dokumentationsseite dieses Repositorys unter `docs/` ist eine vollständige VitePress + ai-i18n-tools-Referenz (neun Gebietsschemas, Themenkatalog, GitHub Pages).

<a id="quick-start"></a>
## Schnellstart

```bash
npx ai-i18n-tools init -t ui-vitepress
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

Zeigen Sie `contentPaths` auf Ihre englischen `.md`-Dateien und -Verzeichnisse. Setzen Sie `docsRoot` auf denselben Ordner, den VitePress als Inhaltsstammverzeichnis verwendet.

Verbinden Sie die [Internationalisierung](https://vitepress.dev/guide/i18n) von VitePress: Englisch unter `root`, jedes Ziel-Gebietsschema unter `locales[code].link` (zum Beispiel `/pt-BR/`). Halten Sie `targetLocales` in `ai-i18n-tools.config.json` mit den `locales`-Schlüsseln in `.vitepress/config.mts` synchron.

<a id="theme-strings"></a>
## Theme-Strings

VitePress-Navigations-, Seitenleisten-, Fußzeilen-, Suchplatzhalter- und andere `themeConfig`-Beschriftungen werden nicht aus Markdown extrahiert. Konfigurieren Sie **`docsOutput.vitepressThemeCatalog`**, damit **`translate-docs`** den englischen Katalog aus `.vitepress/config.mts` (wenn Strings inline sind) bootstrappt und JSON-Dateien für Gebietsschema-Themes übersetzt:

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

- **`catalogPath`** – generiertes englisches verschachteltes JSON (Bootstrap-Ausgabe). Autoren pflegen diese Datei nicht manuell, wenn Englisch in `config.mts` liegt; führen Sie `sync` erneut aus, um sie zu aktualisieren.
- **`outputPathTemplate`** (optional) – Ausgaben pro Gebietsschema; Standard: dasselbe Verzeichnis wie `catalogPath` mit `theme.{locale}.json`.

`init -t ui-vitepress` erstellt auch Start-`docs/.vitepress/config.mts` und `docs/.vitepress/i18n/theme.en.json`, wenn diese Dateien noch nicht existieren. Die Konfiguration lädt den Katalog über `loadTheme()` und verbindet Standard-VitePress-i18n-Beschriftungen (einschließlich `langMenuLabel`) in `themeConfigFor()`.

Laden Sie die pro-Gebietsschema-Datei in `.vitepress/config.mts` über `loadTheme()` und erstellen Sie `locales[code].themeConfig` aus dem übersetzten JSON. Siehe [examples/vitepress-docs/docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts).

**Sprachmenü-Strings:** `locales[code].label` ist der sichtbare Name jeder Sprache im Dropdown-Menü (zum Beispiel `Português (Brasil)`). `themeConfig.langMenuLabel` ist das **aria-label** auf der Sprachumschalter-Schaltfläche (VitePress-Standard: `Change language`). Platzieren Sie `langMenuLabel` im Themenkatalog und verbinden Sie `langMenuLabel: t.langMenuLabel` innerhalb von `themeConfigFor()` – verwechseln Sie es nicht mit den pro-Gebietsschema-`label`-Strings.

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

```markdown
Refactor our VitePress config to load theme strings from generated JSON files instead of hardcoded literals.

Context:
- ai-i18n-tools already generated English and locale theme catalogs via `docsOutput.vitepressThemeCatalog`.
- English catalog: `docs/.vitepress/i18n/theme.en.json`
- Locale catalogs: `docs/.vitepress/i18n/theme.{locale}.json` (e.g. pt-BR, zh-Hans)
- Target file: `docs/.vitepress/config.mts` (or our project's equivalent path)
- Reference pattern: https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/docs/.vitepress/config.mts

Requirements:
1. Add `loadTheme(localeFile: string)` that reads JSON from `docs/.vitepress/i18n/` (use `import.meta.url` / `fileURLToPath` for ESM paths).
2. Add `themeConfigFor(t)` that builds VitePress `themeConfig` from the catalog — keep all **links and structure** in TypeScript; only **display strings** come from JSON keys matching `theme.en.json`.
3. Wire `locales.root` and each target locale in `locales[code]` to `loadTheme('theme.en.json')` or `loadTheme('theme.{code}.json')`, then `themeConfig: themeConfigFor(theme)`.
4. Align locale codes with `ai-i18n-tools.config.json` `targetLocales` and existing VitePress `locales` keys.
5. Do **not** change markdown content paths, `base`, or link targets — only move translatable labels out of inline string literals.
6. Preserve any project-specific options (ignoreDeadLinks, head config, etc.).

After editing:
- Run `pnpm docs:dev` (or our docs dev script) and confirm English + at least one translated locale show correct nav/sidebar/footer/search placeholder.
- If a string exists in config but not in `theme.en.json`, add a matching key to the JSON shape in `themeConfigFor` and note that the user should re-run `i18n:sync` to refresh catalogs from config if needed.

Do not introduce a hand-maintained duplicate of theme strings — config must read from the generated JSON files only.
```

<a id="framework-shell-translation"></a>
## Übersetzung der Framework-Shell

| Framework | Shell / Theme-Strings | Pipeline |
|-----------|----------------------|----------|
| Docusaurus | `write-translations`-Katalog (`{ message, description }`) | Dokumente — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | Theme-/Navigations-/Seitenleisten-Katalog | Dokumente — `docsOutput.vitepressThemeCatalog` + `translate-docs` |
| Nextra | `_meta.ts`-Seitenleistenbeschriftungen | Dokumente — automatisch, wenn `style: "nextra"` + `translate-docs` |
| Nextra | Theme-Wörterbuch `.ts` | Dokumente — `docs[].nextraDictionaryPath` + `translate-docs` |
| Fumadocs | `meta.json`-Seitenleistenbeschriftungen | Dokumente — automatisch, wenn `style: "fumadocs"` + `translate-docs` |
| Fumadocs | UI-Überschreibungs-Katalog | Dokumente — `docsOutput.fumadocsUiCatalog` + `translate-docs` |
| Astro Starlight | Eingebaute UI-Strings (viele Gebietsschemata); keine zusätzliche Shell-Pipeline | Dokumente — `translate-docs` (nur Seiten) |

Legen Sie **keine** Framework-Shell-/Theme-Strings in `json[]` ab – diese Pipeline ist für nicht verwandte App-Gebietsschema-Bundles. Siehe [Docusaurus-Integration](/de/guide/integrations/docusaurus) und [Fumadocs-Integration](/de/guide/integrations/fumadocs) für die anderen Framework-Muster.

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

**Dieses Repository** hält `README.md` und `docs/index.md` als **unabhängige Dateien**: README ist die vollständige npm/GitHub-Landingpage; `docs/index.md` ist ein schlanker Einstiegspunkt für die Dokumentationsseite, der auf `/guide/` und `/reference/` verweist. Aktualisieren Sie jede Datei entsprechend ihrer Zielgruppe, wenn sich gemeinsame Fakten ändern.

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

| Autor in englischer Quelle | Nach Normalisierer (englische Stamm-Ausgabe) | Nach Normalisierer (übersetzte `docs/<locale>/`-Ausgabe) |
|--------------------------|----------------------------------------|------------------------------------------------------|
| `[JSON](/de/guide/json)` | `[JSON](/de/guide/json)` | `[JSON](/pt-BR/guide/json)` (Gebietsschema-Präfix stimmt mit Ordner überein) |
| `[Quick start](/de/guide/quick-start)` im Text oder `hero.actions[].link` | unverändert (`/guide/quick-start`) | `/pt-BR/guide/quick-start` |
| `[Home](./README.md)` im Gebietsschema-Index | `/` | `/pt-BR/` |
| `hero.image.src: /logo.svg` | unverändert | unverändert (gemeinsames `docs/public/`-Asset) |
| `[Demo](https://github.com/org/repo/tree/main/examples/console-app/)` | unverändert (vollständige URL) | unverändert (vollständige URL) |

Englische Stammquellen unter `docs/` behalten **gebietsschema-neutrale** Site-Routen (`/guide/…`). Dateien, die nach `docs/<locale>/…` geschrieben werden, erhalten automatisch das Gebietsschema-Präfix für interne Inhaltsrouten – einschließlich **Home-Layout-Frontmatter** (`hero.actions[].link`, `features[].link`, `prev`/`next`). Gemeinsame öffentliche Assets wie `/logo.svg` und `/translation-dashboard.png` bleiben in jedem Gebietsschema ohne Präfix.

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

- Dokumentationslinks über Seiten hinweg: Verwenden Sie **Site-Routen** (`/guide/…`, `/reference/…`) im englischen Markdown unter `docs/`, oder `docs/guide/…`-Pfade, wenn Sie ein README erstellen, das in ein anderes Projekt unter `docs/index.md` synchronisiert werden soll.
- Ausführbare Demos, `LICENSE` und andere Repo-Dateien: Verwenden Sie **vollständige GitHub-URLs** in `README.md` und in der Dokumentation (siehe [README und die Dokumentations-Homepage](#readme-as-the-docs-homepage)).
- Bearbeiten Sie Links in `docs/<locale>/` **nicht** manuell – generieren Sie sie mit `sync` / `translate-docs` neu.

Siehe auch [Link-Umschreibung](/de/guide/images-and-screenshots/link-rewriting) (flat vs. VitePress) und [Konfiguration — `docsOutput`](/de/reference/configuration#docsoutput).
