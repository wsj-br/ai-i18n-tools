<a id="vitepress-integration"></a>
# VitePress-Integration

Verwenden Sie `init -t ui-vitepress` und `docsOutput.style: "vitepress"` für [VitePress](https://vitepress.dev/)-Dokumentationsseiten. Das Preset ist ein Alias für `doc-system` mit einem leeren `localeSubpath` und beibehaltenen BCP-47-Gebietsschema-Ordnernamen (`localePathLowercase` ist standardmäßig `false`, sodass Ordner `pt-BR`, `zh-Hans` usw. bleiben).

Siehe auch [Dokumente](/guide/documents/) und die ausführbare Demo [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/). Die eigene Dokumentationsseite dieses Repositorys unter `docs/` ist eine vollständige VitePress + ai-i18n-tools-Referenz (neun Sprachen, Themenkatalog, GitHub Pages).

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

Englischer Markdown befindet sich im VitePress-Inhaltsstamm (typischerweise `docs/`). Übersetzte Kopien werden neben dem Quellbaum geschrieben:

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

Verweisen Sie `contentPaths` auf Ihre englischen `.md`-Dateien und -Verzeichnisse. Setzen Sie `docsRoot` auf denselben Ordner, den VitePress als seinen Inhaltsstamm verwendet.

Verbinden Sie die [Internationalisierung](https://vitepress.dev/guide/i18n) von VitePress: Englisch unter `root`, jedes Ziel-Gebietsschema unter `locales[code].link` (zum Beispiel `/pt-BR/`). Halten Sie `targetLocales` in `ai-i18n-tools.config.json` mit den `locales`-Schlüsseln in `.vitepress/config.mts` synchronisiert.

<a id="theme-strings"></a>
## Themenzeichenfolgen

VitePress-Navigations-, Seitenleisten-, Fußzeilen-, Suchplatzhalter- und andere `themeConfig`-Beschriftungen werden nicht aus Markdown extrahiert. Konfigurieren Sie **`docsOutput.vitepressThemeCatalog`** so, dass **`translate-docs`** den englischen Katalog aus `.vitepress/config.mts` (wenn Strings inline sind) bootstrappt und die JSON-Dateien des Gebietsschema-Themas übersetzt:

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
- **`outputPathTemplate`** (optional) – Ausgaben pro Gebietsschema; Standard: gleiches Verzeichnis wie `catalogPath` mit `theme.{locale}.json`.

Laden Sie die Datei pro Gebietsschema in `.vitepress/config.mts` über `loadTheme()` und erstellen Sie `locales[code].themeConfig` aus dem übersetzten JSON. Siehe [examples/vitepress-docs/docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts).

Verwenden Sie **nicht** `json[]` für VitePress-Theme-Strings – dieses Muster ist nur für nicht verwandte App-Gebietsschema-Bundles vorgesehen.

<a id="wire-config-mts-to-generated-theme-json"></a>
## config.mts mit generiertem Theme-JSON verbinden (einmalig)

Nach dem ersten erfolgreichen `i18n:sync` / `translate-docs`-Lauf mit `vitepressThemeCatalog` hat das Repository `theme.en.json` und `theme.{locale}.json` generiert, aber eine **bestehende** Site kann immer noch hartcodierte `text:` / `message:`-Strings in `config.mts` haben. VitePress verwendet übersetztes JSON erst, wenn die Konfiguration es über `loadTheme()` lädt.

**Nicht im Tool-Umfang:** automatische Codemod. Verwenden Sie die folgende Aufforderung einmal pro Projekt (oder refaktorieren Sie manuell anhand der Beispielkonfiguration).

1. **Wann** – nach der ersten Synchronisierung, die `catalogPath` und Gebietsschema-Theme-Dateien erzeugt hat; bevor übersetzte Navigation/Seitenleiste in Entwicklung/Build erwartet wird.
2. **Unverändert lassen** – Routenlinks (`/guide/…`), Gebietsschema-Schlüssel, `defineConfig`-Struktur, Nicht-String-Optionen (Suchanbieter, eingeklappte Flags).
3. **Referenz** – [examples/vitepress-docs/docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts) und generierte `theme.en.json`-Form.
4. **Überprüfen** – `pnpm docs:dev`, Gebietsschema in der Navigation wechseln, Seitenleiste/Fußzeile/Suchplatzhalter übersetzen bestätigen; `pnpm docs:build` besteht.

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
| VitePress | Theme-/Navigations-/Seitenleistenkatalog | Dokumente – `docsOutput.vitepressThemeCatalog` + `translate-docs` |
| Nextra | `_meta.ts`-Seitenleistenbeschriftungen | Dokumente – automatisch, wenn `style: "nextra"` + `translate-docs` |
| Nextra | Theme-Wörterbuch `.ts` | Dokumente – `docs[].nextraDictionaryPath` + `translate-docs` |
| Fumadocs | `meta.json`-Seitenleistenbeschriftungen | Dokumente – automatisch, wenn `style: "fumadocs"` + `translate-docs` |
| Fumadocs | UI-Überschreibungskatalog | Dokumente – `docsOutput.fumadocsUiCatalog` + `translate-docs` |
| Astro Starlight | Integrierte UI-Strings (viele Sprachen); keine zusätzliche Shell-Pipeline | Dokumente – `translate-docs` (nur Seiten) |

Legen Sie **keine** Framework-Shell-/Theme-Strings in `json[]` ab – diese Pipeline ist für nicht verwandte App-Locale-Bundles vorgesehen. Siehe [Docusaurus-Integration](/guide/docusaurus-integration) und [Nextra-Integration](/guide/nextra-integration) für die anderen Framework-Muster.

<a id="example-project"></a>
## Beispielprojekt

[examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) – englische Quellen unter `docs/`, festgeschriebene Seitenbäume `pt-BR` und `zh-Hans`, plus `theme.pt-BR.json` / `theme.zh-Hans.json`. Führen Sie `pnpm run docs:dev` auf Port 3060 aus.

<a id="readme-as-the-docs-homepage"></a>
## README als Dokumentations-Homepage

Einige Projekte kopieren `README.md` in die VitePress-Site als `docs/index.md` (dieses Repo verwendet `scripts/sync-readme-to-docs.mjs` vor `docs:build`). Dieses Muster teilt eine Datei zwischen GitHub und der Dokumentations-Site, aber die Link-Regeln unterscheiden sich:

| Link-Typ | Funktioniert auf GitHub | Funktioniert auf VitePress |
|-----------|-----------------|-------------------|
| `docs/guide/foo.md` | Ja | Nein – verwenden Sie Site-Routen oder lassen Sie den Normalisierer während der Synchronisierung umschreiben |
| `./LICENSE`, `examples/demo/` | Ja (Repo-relativ) | Nein – verwenden Sie **vollständige URLs** |
| `/guide/foo` | Nein | Ja |

**Empfehlung:** Verwenden Sie in `README.md` **vollständige URLs** für alles außerhalb des VitePress-Inhaltsbaums (`LICENSE`, `examples/`, Konfigurationsdateien, Agent-Kontextdateien) und für übersetzte README-Kopien unter `translated-docs/`. Verwenden Sie `docs/guide/…`-Pfade (oder Site-Routen in englischen Dokumenten unter `docs/`) für interne Dokumentationslinks; das Synchronisierungsskript und der `rewriteVitepressLinks`-Normalisierer konvertieren diese in `/guide/…`-Routen.

Beispiel:

```markdown
[console-app demo](https://github.com/your-org/your-repo/tree/main/examples/console-app/)
[License](https://github.com/your-org/your-repo/blob/main/LICENSE)
[Quick start](/guide/quick-start)
```

<a id="link-conventions"></a>
## Link-Konventionen

VitePress stellt englische Seiten aus dem Inhaltsstamm und Lokalisierungskopien aus `docs/<locale>/…` bereit, aber **Seiteninterne Links müssen Site-Routen verwenden** (`/guide/quick-start`, `/reference/configuration`) – nicht repo-relative Pfade wie `docs/guide/quick-start.md` oder `../guide/quick-start.md`. Diese README-ähnlichen Pfade funktionieren in GitHub, brechen aber innerhalb von VitePress (404 im Dev-Modus und auf GitHub Pages).

Aktivieren Sie den integrierten Normalisierer, damit `translate-docs` Links in jeder übersetzten Datei automatisch korrigiert:

```json
"docsOutput": {
  "style": "vitepress",
  "docsRoot": "docs",
  "rewriteVitepressLinks": true
}
```

`rewriteVitepressLinks` ist standardmäßig aktiviert, wenn `style` `"vitepress"` ist.

| Autor in englischer Quelle | Nach dem Normalisierer |
|--------------------------|------------------|
| `[JSON](/guide/json)` | `[JSON](/guide/json)` |
| `[Home](./README.md)` im Lokalisierungsindex | `/` |
| `[Demo](https://github.com/org/repo/tree/main/examples/console-app/)` | unverändert (vollständige URL) |

**Regeln für die Erstellung**

- Dokumentenlinks über mehrere Seiten hinweg: Verwenden Sie **Site-Routen** (`/guide/…`, `/reference/…`) in englischem Markdown unter `docs/` oder `docs/guide/…`-Pfade beim Synchronisieren von `README.md`.
- Ausführbare Demos, `LICENSE` und andere Repo-Dateien: Verwenden Sie **vollständige GitHub-URLs** in `README.md` und in den Dokumenten (siehe [README als Dokumentations-Homepage](#readme-as-homepage)).
- Bearbeiten Sie Links in `docs/<locale>/` **nicht** manuell – generieren Sie sie mit `sync` / `translate-docs` neu.

Siehe auch [Link-Umschreibung](/guide/images-and-screenshots/link-rewriting) (flat vs. VitePress) und [Konfiguration — `docsOutput`](/reference/configuration#docsoutput).
